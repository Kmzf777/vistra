# -*- coding: utf-8 -*-
"""Verificador rigoroso: este comércio NÃO tem site e está ATIVO?

Implementa a Etapa 2 da skill `prospectar` (.claude/skills/prospectar/SKILL.md) com os critérios
aprovados pelo dono. O lead só vira PODE_ABORDAR (ou SITE_QUEBRADO) se cumprir TODOS:

  1. Sem site no Maps: campo vazio ou só Instagram/Facebook/wa.me/Linktree/agregador.
     Regra da SKILL, não a do montar_leads_udi.py: canva.site, wixsite, sites.google, negocio.site,
     webnode, carrd etc. CONTAM COMO SITE (página que abre e apresenta a empresa = TEM SITE).
  2. Não está marcado como fechado.
  3. Domínios prováveis (3 a 6 candidatos .com.br gerados do nome) não estão no ar: RDAP oficial do
     registro.br (200 = registrado, 404 = livre; no máximo 2 req/s, recua no 429). Registrado e
     abre (http/https, 10 s) com título/conteúdo da mesma empresa = TEM SITE. Registrado e não abre =
     SITE_QUEBRADO (gancho).
  4. Instagram profissional ativo: perfil business/profissional, não privado, post nos últimos 60
     dias. Link da bio que é site próprio e abre = TEM SITE. Sem @, privado, pessoal ou parado =
     DESCARTE_LEAD_FRACO (regra de 14/10/2026).
  5. Busca no Google por "<nome>" uberlândia: domínio próprio da empresa entre os primeiros
     resultados, que abre e é a mesma empresa = TEM SITE.

Vereditos: PODE_ABORDAR | SITE_QUEBRADO | TEM_SITE | FECHADO | DESCARTE_LEAD_FRACO | DUVIDA.
Leads que já têm dono no CRM (situacao meu/qualificado, vendedor_id ou etapa) NUNCA são descartados
automaticamente: ganham "sinalizar": true e "acao" de revisão pelo vendedor.

A parte da Apify (o script não tem token) entra por arquivo de cache:
  --ig-cache    dataset do actor apify/instagram-profile-scraper (lista JSON; pode ser só os campos
                username, private, isBusinessAccount, businessCategoryName, followersCount,
                externalUrl, externalUrls, latestPosts[].timestamp, postsCount, error)
  --busca-cache dataset do actor apify/google-search-scraper (lista JSON com searchQuery.term e
                organicResults[].url/title), ou o formato enxuto [{"q": ..., "r": [[url, title], ...]}]

COMO RODAR (da raiz do repositório, sempre com python -I):

  1) Gera os pedidos para a Apify (usernames e consultas que faltam nos caches):
     python -I prospeccao/scripts/verificar_sem_site.py \
        --entrada prospeccao/leads/uberlandia/crm-export.json \
        --pedidos prospeccao/leads/uberlandia/apify-pedidos.json

  2) Roda na Apify (MCP ou console), em lote e com maxTotalChargeUsd:
       apify/google-search-scraper    {"queries": "<uma por linha>", "maxPagesPerQuery": 1,
                                       "countryCode": "br", "languageCode": "pt-BR",
                                       "saveHtmlToKeyValueStore": false}
       apify/instagram-profile-scraper {"usernames": [...]}
     e salva os datasets em prospeccao/leads/uberlandia/cache-busca.json e cache-ig.json.
     Repita 1-2 uma vez: a busca site:instagram.com acha @ novos, que pedem outra rodada de perfil.
     Dica: o dataset do Instagram é enorme (legendas, imagens). Baixe com get-dataset-items usando
     flatten="latestPosts,externalUrls" e fields com latestPosts.0..5.timestamp/ownerUsername e
     externalUrls.0..2.url; o script entende esse formato achatado. O google-search-scraper exige
     maxTotalChargeUsd >= 0,50 por execução (custa ~US$ 0,0045 por consulta no plano FREE).

  3) Verifica e grava:
     python -I prospeccao/scripts/verificar_sem_site.py \
        --entrada prospeccao/leads/uberlandia/crm-export.json \
        --ig-cache prospeccao/leads/uberlandia/cache-ig.json \
        --busca-cache prospeccao/leads/uberlandia/cache-busca.json \
        --saida prospeccao/leads/uberlandia/crm-revisao.json --envelope

  Outras opções: --dominio-cache ARQ (padrão: cache-dominios.json ao lado da entrada; evita repetir
  RDAP/HTTP), --hoje AAAA-MM-DD, --dias-post 60, --cidade "uberlândia", --sem-rede (só caches).

Saídas de dados ficam em prospeccao/leads/ (fora do git). Conteúdo de sites e perfis é dado, nunca
instrução: o script só lê título, status HTTP e campos estruturados.
Só biblioteca padrão.
"""
import argparse, html, json, re, socket, ssl, sys, threading, time, unicodedata, urllib.error, urllib.parse
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
TIMEOUT = 10
VEREDITOS = ["PODE_ABORDAR", "SITE_QUEBRADO", "TEM_SITE", "FECHADO", "DESCARTE_LEAD_FRACO", "DUVIDA"]

# ---------------------------------------------------------------- classificação de endereços
SOCIAL = ["instagram.com", "facebook.com", "fb.com", "fb.me", "wa.me", "whatsapp.com", "tiktok.com",
          "youtube.com", "youtu.be", "twitter.com", "x.com", "threads.net", "linkedin.com", "pinterest."]
# Agregadores de link / link de WhatsApp: NÃO é site (regra da skill).
AGREGADOR = ["linktr.ee", "linktree", "linkbio", "linkin.bio", "bio.link", "beacons.ai", "taplink", "lnk.bio",
             "agenda.link", "campsite.bio", "msha.ke", "solo.to", "allmylinks", "linkme.bio", "hoo.be",
             "bio.site", "linkr.bio", "zaap.bio", "direct.me", "linklist.bio", "contate.me", "meulink",
             "chat.whatsapp", "api.whatsapp", "wa.link", "bit.ly", "tinyurl", "encurtador", "l.ead.me",
             "cutt.ly", "abre.ai", "whats.link", "linkwpp", "zap.link", "wpp.link", "whatsapp.link"]
# Páginas de terceiros (agendamento, marketplace, diretório, shopping): não é site PRÓPRIO.
TERCEIRO = ["agendarconsulta", "doctoralia", "ifood.", "google.", "goo.gl", "g.page", "maps.app", "g.co",
            "uberlandiashopping.com.br", "redevalorize", "revistapetcenter", "guiamais", "apontador",
            "telelistas", "cylex", "solutudo", "encontra", "mercadolivre", "shopee", "olx.", "booksy",
            "agendor", "trinks.com", "simplesagenda", "tripadvisor", "yelp.", "waze.com", "99app",
            "reclameaqui", "jusbrasil", "cnpj", "econodata", "empresaqui", "casadosdados", "wikipedia",
            "facebook", "kekanto", "listamais", "pmweb", "uberlandia.mg.gov", "petlove.com.br", "petz.com.br",
            "cobasi.com.br", "zoetis", "amazon.", "magazineluiza", "americanas", "forms.gle", "saipos",
            "anota.ai", "goomer", "meucatalogodigital", "catalogodigital", "ola.click", "cardapioweb",
            "instadelivery", "deliverydireto", "aiqfome", "calendly", "sympla", "pedido.anota",
            # diretórios e guias que repetem nome, telefone e cidade da empresa (não é site dela)
            "petpoup", "latemia", "acheiuberlandia", "vida.pet", "guia", "lista", "catalogo", "achei",
            "empresas", "imobiliari", "imoveis", "vivareal", "zapimoveis", "kekanto", "infobel",
            "hotfrog", "brasilmapa", "mapadobrasil", "dnb.com", "serasa", "consultasocio", "cnpj.biz",
            "informecadastral", "telelistas", "paginasamarelas", "yellowpages", "foursquare", "tiktok",
            "doghero", "petanjo", "petsupermarket"]
# Construtores de site: contam como SITE se abrem e apresentam a empresa.
CONSTRUTOR = ["canva.site", "my.canva", "wixsite", "wix.com", "sites.google", "negocio.site", "business.site",
              "webnode", "carrd.co", "wordpress.com", "blogspot", "site123", "godaddysites", "hotmart",
              "budi.shop", "nuvemshop", "lojaintegrada", "simples.vet.br", "squarespace", "webflow.io",
              "netlify.app", "vercel.app", "github.io", "jimdo", "weebly", "strikingly", "framer"]
# Página padrão de hospedagem, estacionamento, suspensão: registrado mas NÃO é site no ar.
PARQUEADO = re.compile(
    r"(domain (is )?for sale|dom[ií]nio (est[aá] )?(à|a) venda|buy this domain|parked|parking|"
    r"registro\.br|index of /|site em constru[cç][aã]o|em constru[cç][aã]o|coming soon|em breve|"
    r"under construction|account suspended|conta suspensa|this site can.t be reached|default web site page|"
    r"welcome to nginx|apache2? .*default page|it works!|iis windows server|hostgator|locaweb|"
    r"hostinger|umbler|kinghost|página não encontrada|page not found|not found|404|403 forbidden|"
    r"domain has expired|dom[ií]nio expirado|cpanel|plesk|website expired|site expirado|"
    r"wix\.com.*(error|conecte)|this domain|este dom[ií]nio)", re.I)

STOP = {"pet", "pets", "petshop", "shop", "store", "center", "centro", "casa", "clinica", "clinicas", "vet",
        "veterinaria", "veterinario", "veterinarios", "veterinarias", "hospital", "banho", "tosa", "e", "de",
        "da", "do", "das", "dos", "a", "o", "os", "as", "the", "and", "ltda", "me", "eireli", "epp", "sa",
        "s", "racao", "racoes", "agropecuaria", "agro", "uberlandia", "udi", "mg", "loja", "unidade",
        "filial", "matriz", "em", "com", "para", "petcenter", "spa", "estetica", "animal", "animais",
        "produtos", "servicos", "comercio", "distribuidora", "atacado", "varejo", "&", "n", "no", "na"}
LEGAL = re.compile(r"\b(ltda|me|eireli|epp|s\.?a\.?|mei)\b\.?", re.I)


def norm(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def compacto(s):
    return re.sub(r"[^a-z0-9]", "", norm(s))


def nome_base(nome):
    """Nome sem complemento ('- Banho e Tosa', '| Unidade X', '(...)') e sem sufixo jurídico."""
    n = re.split(r"\s[-–|•·]\s|\s\(|\|", nome or "")[0]
    n = LEGAL.sub(" ", n)
    return re.sub(r"\s+", " ", n).strip() or (nome or "").strip()


def tokens(nome):
    """Palavras do nome base, sem repetição ("Clínica Veterinária Clínica X" -> uma "clinica" só)."""
    out = []
    for t in re.findall(r"[a-z0-9]+", norm(nome_base(nome))):
        if t not in out:
            out.append(t)
    return out


def distintivos(nome):
    return [t for t in tokens(nome) if t not in STOP and len(t) >= 2]


def host_de(url):
    u = (url or "").strip()
    if not u:
        return ""
    if not re.match(r"^[a-z][a-z0-9+.-]*://", u, re.I):
        u = "http://" + u
    try:
        h = urllib.parse.urlsplit(u).hostname or ""
    except ValueError:
        return ""
    return h.lower().removeprefix("www.")


def tipo_url(url):
    """vazio | social | agregador | terceiro | construtor | proprio."""
    u = (url or "").strip().lower()
    if not u:
        return "vazio"
    h = host_de(u)
    if any(s in h for s in SOCIAL) or "whatsapp" in u:
        return "social"
    if any(a in h or a in u for a in AGREGADOR):
        return "agregador"
    if any(c in h for c in CONSTRUTOR):
        return "construtor"
    if any(t in h for t in TERCEIRO):
        return "terceiro"
    return "proprio"


def bate_nome(texto, lead, forte=False):
    """O texto (título, host, corpo) cita o nome da empresa? Usa só as palavras distintivas do nome.
    forte=True desliga a regra do "par de palavras" (para o titular do RDAP)."""
    c = compacto(texto)
    if not c:
        return False
    d = distintivos(lead["nome"])
    toks = tokens(lead["nome"])
    if compacto("".join(toks)) in c:
        return True
    if not d:  # nome só com palavras genéricas ("Mundo Pet Shop"): exige o nome inteiro
        return False
    junto = compacto("".join(d))
    if len(junto) >= 6 and junto in c:
        return True
    fortes = [t for t in d if len(t) >= 5]
    if len(fortes) >= 2 and all(t in c for t in fortes):
        return True
    if forte:
        return False
    # palavra distintiva curta ("Lu Pet", "Vida Animal"): exige ela junto de uma vizinha do nome
    for i in range(len(toks) - 1):
        par = toks[i] + toks[i + 1]
        if (toks[i] in d or toks[i + 1] in d) and len(par) >= 6 and par in c:
            return True
    return False


def fatos_pagina(pagina, texto, cidade):
    """Fatos da página que independem do lead: cita a cidade? quais telefones e @ aparecem?"""
    fones = set()
    for m in re.finditer(r"\+?\d[\d\s().-]{7,18}\d", pagina):
        dg = re.sub(r"\D", "", m.group(0))
        if 8 <= len(dg) <= 13:
            fones.add(dg[-8:])
    igs = {u.lower().rstrip(".") for u in re.findall(r"instagram\.com/([A-Za-z0-9_.]{2,30})", pagina)}
    return {"cidade": compacto(cidade) in compacto(texto) or compacto(cidade) in compacto(pagina[:400_000]),
            "fones": sorted(fones)[:300], "igs": sorted(igs)[:50], "chars_texto": len(texto)}


# Palavras do ramo: a página achada por busca/candidato tem de falar do mesmo negócio.
RAMO = {"pet": ["pet", "cao", "caes", "cachorro", "gato", "banho", "tosa", "racao", "racoes", "veterin",
                "animal", "animais", "filhote", "felino", "canino"],
        "veterin": ["veterin", "pet", "animal", "animais", "cao", "caes", "gato", "vacina", "consulta"],
        "racao": ["racao", "racoes", "pet", "cao", "caes", "gato", "animal", "agro"],
        "tosa": ["banho", "tosa", "pet", "cao", "caes", "cachorro", "gato"]}


def tem_ramo(texto, lead):
    """A página fala do ramo do lead? Exige 2 palavras diferentes do ramo, fora as do próprio nome."""
    cat = norm(lead.get("cat", ""))
    pal = set()
    for chave, lista in RAMO.items():
        if chave in cat:
            pal.update(lista)
    if not pal:
        pal = {w for w in re.findall(r"[a-z]{4,}", cat) if w not in STOP}
    t = norm(texto)
    for tok in tokens(lead["nome"]):  # o nome "Agro Pet" não prova que a página é de pet shop
        t = t.replace(tok, " ")
    return sum(1 for w in pal if re.search(r"\b" + w, t)) >= 2


def sinais_locais(fatos, lead, cidade):
    """Prova de que a página é DESTA empresa: cidade, telefone do lead ou @ do lead na página."""
    if not fatos:
        return []
    s = []
    if fatos.get("cidade"):
        s.append(cidade)
    if lead.get("tel8") and lead["tel8"] in fatos.get("fones", []):
        s.append("telefone do lead")
    u = username_de(lead.get("ig", ""))
    if u and u in fatos.get("igs", []):
        s.append("@ do lead")
    return s


# ---------------------------------------------------------------- rede: HTTP
_CTX_RUIM = ssl.create_default_context()
_CTX_RUIM.check_hostname = False
_CTX_RUIM.verify_mode = ssl.CERT_NONE


def _get(url, ctx=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9",
                                               "Accept": "text/html,application/xhtml+xml"})
    with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as r:
        corpo = r.read(400_000)
        cs = r.headers.get_content_charset() or "utf-8"
        return r.status, r.geturl(), corpo.decode(cs, "ignore")


def _titulo(pagina):
    m = re.search(r"<title[^>]*>(.*?)</title>", pagina, re.I | re.S)
    t = html.unescape(re.sub(r"\s+", " ", m.group(1))).strip() if m else ""
    if not t:
        m = re.search(r'<meta[^>]+property=["\']og:(?:site_name|title)["\'][^>]+content=["\']([^"\']+)', pagina, re.I)
        t = html.unescape(m.group(1)).strip() if m else ""
    return t[:200]


def _texto(pagina):
    p = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", pagina)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", p)))[:200_000]


def resolve(host):
    try:
        socket.getaddrinfo(host, 80)
        return True
    except OSError:
        return False


def abrir(url_ou_dominio, cidade="uberlândia"):
    """Tenta https e http (com e sem www). Devolve dict com abre/status/final/titulo/motivo."""
    base = url_ou_dominio.strip()
    if re.match(r"^https?://", base, re.I):
        sp = urllib.parse.urlsplit(base)
        host, resto = sp.hostname or "", (sp.path or "/") + (("?" + sp.query) if sp.query else "")
    else:
        host, resto = base.split("/")[0], "/" + "/".join(base.split("/")[1:])
    host = host.lower()
    hosts = [host] if host.startswith("www.") else [host, "www." + host]
    hosts = [h for h in hosts if resolve(h)]
    if not hosts:
        return {"abre": False, "motivo": "sem DNS", "url": "https://" + host + resto}
    ultimo = None
    for esquema in ("https", "http"):
        for h in hosts:
            url = f"{esquema}://{h}{resto}"
            for ctx in (None, _CTX_RUIM) if esquema == "https" else (None,):
                try:
                    st, final, pag = _get(url, ctx)
                except urllib.error.HTTPError as e:
                    ultimo = {"abre": False, "motivo": f"HTTP {e.code}", "url": url}
                    break
                except ssl.SSLError as e:
                    ultimo = {"abre": False, "motivo": "certificado inválido", "url": url}
                    continue
                except urllib.error.URLError as e:
                    if isinstance(e.reason, ssl.SSLError) and ctx is None:
                        ultimo = {"abre": False, "motivo": "certificado inválido", "url": url}
                        continue
                    ultimo = {"abre": False, "motivo": f"erro: {str(e.reason)[:60]}", "url": url}
                    break
                except Exception as e:  # timeout, reset, etc.
                    ultimo = {"abre": False, "motivo": f"erro: {type(e).__name__}", "url": url}
                    break
                titulo = _titulo(pag)
                texto = _texto(pag)
                res = {"abre": True, "status": st, "url": url, "final": final, "titulo": titulo,
                       "cert_ruim": ctx is not None, "_texto": texto,
                       "fatos": fatos_pagina(pag, texto, cidade)}
                hf = host_de(final)
                if tipo_url(final) in ("social", "agregador"):
                    res.update(abre=False, motivo=f"redireciona para {hf}")
                elif len(texto.strip()) < 40 and not titulo:
                    res.update(abre=False, motivo="página vazia")
                elif PARQUEADO.search(titulo) or (len(texto) < 1500 and PARQUEADO.search(texto)):
                    res.update(abre=False, motivo="página padrão/estacionada/em construção")
                return res
    return ultimo or {"abre": False, "motivo": "não abriu", "url": base}


# ---------------------------------------------------------------- rede: RDAP registro.br
class Rdap:
    INTERVALO = 0.55  # ~2 req/s no máximo

    def __init__(self, sem_rede=False):
        self.lock = threading.Lock()
        self.ultimo = 0.0
        self.sem_rede = sem_rede

    def consultar(self, dominio, nome_lead):
        if self.sem_rede:
            return {"registrado": None, "erro": "sem rede"}
        url = f"https://rdap.registro.br/domain/{dominio}"
        espera = 2.0
        for _ in range(6):
            with self.lock:
                falta = self.INTERVALO - (time.monotonic() - self.ultimo)
                if falta > 0:
                    time.sleep(falta)
                self.ultimo = time.monotonic()
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rdap+json"})
                with urllib.request.urlopen(req, timeout=15) as r:
                    d = json.loads(r.read().decode("utf-8", "ignore"))
                return self._resumo(d, nome_lead)
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    return {"registrado": False}
                if e.code == 429 or e.code >= 500:
                    ra = e.headers.get("Retry-After")
                    pausa = float(ra) if ra and ra.isdigit() else espera
                    with self.lock:  # recua para todo mundo
                        time.sleep(pausa)
                    espera = min(espera * 2, 60)
                    continue
                return {"registrado": None, "erro": f"HTTP {e.code}"}
            except Exception:
                time.sleep(espera)
                espera = min(espera * 2, 60)
        return {"registrado": None, "erro": "RDAP sem resposta"}

    @staticmethod
    def _resumo(d, nome_lead):
        titular = ""
        for e in d.get("entities", []):
            if "registrant" in (e.get("roles") or []):
                for campo in (e.get("vcardArray") or [None, []])[1]:
                    if campo and campo[0] == "fn":
                        titular = str(campo[3])
        exp = next((ev.get("eventDate", "")[:10] for ev in d.get("events", []) if ev.get("eventAction") == "expiration"), "")
        # O nome do titular é dado pessoal: guardamos só se confere com a empresa.
        confere = bate_nome(titular, {"nome": nome_lead, "cat": ""}, forte=True) if titular else None
        return {"registrado": True, "status": d.get("status", []), "expira": exp, "titular_confere": confere}


# ---------------------------------------------------------------- candidatos de domínio
def candidatos(lead):
    toks = tokens(lead["nome"])
    d = distintivos(lead["nome"])
    base = "".join(toks)
    dist = "".join(d)
    cat = norm(lead.get("cat", ""))
    sufixo = "petshop" if ("pet" in cat or "racao" in cat or "tosa" in cat) else \
        "vet" if "veterin" in cat else re.sub(r"[^a-z]", "", cat.split()[0]) if cat.split() else ""
    # sem as palavras genéricas do começo ("Clínica Veterinária Vida Animal" -> "vidaanimal")
    i = 0
    while i < len(toks) - 1 and toks[i] in STOP:
        i += 1
    sem_prefixo = "".join(toks[i:])
    c = [base]
    if sem_prefixo != base and len(sem_prefixo) >= 5:
        c.append(sem_prefixo)
    if dist and dist != base and sufixo:
        c.append(dist + sufixo)
    c += [base + "uberlandia", base + "udi"]
    if dist and dist != base:
        c += [sufixo + dist, dist + "pet"] if sufixo else []
        if len(dist) >= 6:
            c.append(dist)
    elif sufixo and sufixo not in base:
        c.append(base + sufixo)
    vistos, out = set(), []
    for x in c:
        x = re.sub(r"(clinica)+", "clinica", x)
        if 3 <= len(x) <= 50 and x not in vistos:
            vistos.add(x)
            out.append(x + ".com.br")
    return out[:6]


# ---------------------------------------------------------------- caches da Apify
def username_de(ig):
    ig = (ig or "").strip()
    if not ig:
        return ""
    m = re.search(r"instagram\.com/([A-Za-z0-9_.]{1,30})", ig)
    u = m.group(1) if m else ig.lstrip("@")
    u = u.strip("/").split("?")[0].lower()
    if u in {"p", "reel", "reels", "explore", "accounts", "stories", "tv", "share", "_u", ""}:
        return ""
    return u if re.fullmatch(r"[a-z0-9_.]{1,30}", u) else ""


def carregar_ig(arq):
    if not arq or not Path(arq).exists():
        return {}
    dados = json.loads(Path(arq).read_text(encoding="utf-8"))
    if isinstance(dados, dict):  # resposta do get-dataset-items do MCP: {"items": [...]}
        dados = dados.get("items", [])
    out = {}
    for it in dados:
        it = desachatar(it)
        u = (it.get("username") or "").lower()
        if not u and it.get("inputUrl"):
            u = username_de(it["inputUrl"])
        if u:
            out[u] = it
    return out


def desachatar(it):
    """Aceita o dataset 'achatado' (flatten=latestPosts,externalUrls → "latestPosts.0.timestamp")."""
    if not any(re.match(r"^(latestPosts|externalUrls|organicResults)\.\d+\.", k) for k in it):
        return it
    out, listas = {}, defaultdict(dict)
    for k, v in it.items():
        m = re.match(r"^(latestPosts|externalUrls|organicResults)\.(\d+)\.(.+)$", k)
        if m:
            listas[m.group(1)].setdefault(int(m.group(2)), {})[m.group(3)] = v
        else:
            out[k] = v
    for nome, d in listas.items():
        out[nome] = [d[i] for i in sorted(d)]
    return out


def carregar_busca(arq):
    if not arq or not Path(arq).exists():
        return {}
    dados = json.loads(Path(arq).read_text(encoding="utf-8"))
    if isinstance(dados, dict):
        dados = dados.get("items", [])
    out = {}
    for it in dados:
        it = desachatar(it)
        if "q" in it:
            q, res = it["q"], [{"url": x[0], "title": x[1], "description": x[2] if len(x) > 2 else ""}
                               for x in it.get("r", [])]
        else:
            q = (it.get("searchQuery") or {}).get("term", "") or it.get("searchQuery.term", "")
            res = it.get("organicResults") or []
        if q:
            out[q.strip().lower()] = res
    return out


def consulta_google(lead, cidade):
    return f'"{nome_base(lead["nome"])}" {cidade}'


def consulta_ig(lead, cidade):
    return f'site:instagram.com "{nome_base(lead["nome"])}" {cidade}'


def desembrulhar(url):
    if "l.instagram.com" in (url or ""):
        q = urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)
        return q.get("u", [url])[0]
    return url


# ---------------------------------------------------------------- verificação de um lead
def normalizar(cru):
    return {
        "nome": cru.get("nome", ""),
        "site": (cru.get("site") or "").strip(),
        "ig": (cru.get("ig") or cru.get("instagram") or "").strip(),
        "cat": cru.get("cat") or cru.get("categoria") or "",
        "fechado": cru.get("fechado") in (True, "true", "1", 1),
        "situacao": cru.get("situacao") or "",
        "tel8": re.sub(r"\D", "", cru.get("tel") or cru.get("telefone") or "")[-8:],
        "tem_dono": bool(cru.get("vendedor_id")) or (cru.get("situacao") in ("meu", "qualificado"))
        or bool(cru.get("etapa")),
    }


class Verificador:
    def __init__(self, a, dom_cache):
        self.a = a
        self.ig = carregar_ig(a.ig_cache)
        self.busca = carregar_busca(a.busca_cache)
        self.dom = dom_cache  # dominio -> {"rdap":..., "http":...}
        self.rdap = Rdap(a.sem_rede)
        self.hoje = datetime.fromisoformat(a.hoje).replace(tzinfo=timezone.utc) if a.hoje else datetime.now(timezone.utc)
        self.pedidos = {"instagram_usernames": set(), "buscas": set()}
        self.lock = threading.Lock()
        self.http_cache = {}

    # -- rede com cache
    def http(self, alvo):
        chave = alvo.lower().rstrip("/")
        with self.lock:
            if chave in self.http_cache:
                return self.http_cache[chave]
        if self.a.sem_rede:
            r = {"abre": None, "motivo": "sem rede", "url": alvo}
        else:
            r = abrir(alvo, self.a.cidade)
        with self.lock:
            self.http_cache[chave] = r
        return r

    def dominio(self, dom, lead):
        with self.lock:
            c = self.dom.get(dom)
        if c and c.get("rdap", {}).get("registrado") is not None:
            if c["rdap"]["registrado"] and ("http" not in c or (c["http"].get("abre") and "fatos" not in c["http"])):
                c["http"] = _sem_texto(self.http(dom))
            return c
        r = self.rdap.consultar(dom, lead["nome"])
        c = {"rdap": r}
        if r.get("registrado"):
            c["http"] = _sem_texto(self.http(dom))
        with self.lock:
            self.dom[dom] = c
        return c

    # -- critério: uma URL que pode ser site da empresa
    def checar_site(self, url, lead, fonte, ev, declarado, locais_extra=None):
        """Devolve 'tem' | 'quebrado' | 'duvida' | None (não é site da empresa).

        declarado=True: a própria empresa aponta para a URL (Maps, bio do Instagram). Abre e tem prova
        local (cidade, telefone ou @ do lead na página) = TEM SITE; abre sem prova local = DUVIDA.
        declarado=False (achado por busca/candidato): precisa do nome E de prova local; só o nome =
        provavelmente homônimo de outra cidade (ignorado), a não ser que a página quase não tenha texto.
        """
        t = tipo_url(url)
        if t in ("vazio", "social", "agregador"):
            ev.append({"criterio": fonte, "url": url, "resultado": f"não é site ({t})"})
            return None
        if t == "terceiro":
            ev.append({"criterio": fonte, "url": url, "resultado": "página de terceiro (diretório/agendamento/shopping), não é site próprio"})
            return None
        r = self.http(url)
        if r.get("abre") is None:
            ev.append({"criterio": fonte, "url": url, "resultado": "não testado (sem rede)"})
            return "duvida"
        if not r["abre"]:
            if str(r.get("motivo", "")).startswith("redireciona"):
                ev.append({"criterio": fonte, "url": url, "resultado": f"não é site ({r.get('motivo')})"})
                return None
            ev.append({"criterio": fonte, "url": url, "resultado": f"não abre ({r.get('motivo')})"})
            return "quebrado" if declarado else None
        tf = tipo_url(r.get("final") or url)
        if tf in ("social", "agregador", "terceiro"):
            ev.append({"criterio": fonte, "url": r.get("final") or url,
                       "resultado": f"não é site próprio (destino final: {tf})"})
            return None
        return self._julgar_pagina(r, url, lead, fonte, ev, declarado, locais_extra=locais_extra)

    def _julgar_pagina(self, r, url, lead, fonte, ev, declarado, extra=None, locais_extra=None):
        hf = host_de(r.get("final", ""))
        alvo = " ".join([r.get("titulo", ""), hf if hf != host_de(url) else ""])
        nome = bate_nome(alvo, lead) or bate_nome(r.get("_texto", r.get("trecho", ""))[:20_000], lead) \
            or (declarado and bate_nome(host_de(url), lead))
        locais = sinais_locais(r.get("fatos"), lead, self.a.cidade) + list(locais_extra or [])
        info = {"criterio": fonte, "url": r.get("final") or url, "titulo": r.get("titulo", ""),
                "status": r.get("status"), "prova_local": locais, **(extra or {})}
        if r.get("cert_ruim"):
            info["obs"] = "certificado HTTPS inválido"
        pouco_texto = (r.get("fatos") or {}).get("chars_texto", 9999) < 300
        if declarado == "bio":
            ev.append({**info, "resultado": "link da bio do próprio perfil abre e apresenta a empresa → TEM SITE"
                       if (nome or locais) else "link da bio abre, mas não cita o nome nem a cidade: conferir"})
            return "tem" if (nome or locais) else "duvida"
        if declarado:
            if locais:
                ev.append({**info, "resultado": "abre e é a empresa (prova local) → TEM SITE"})
                return "tem"
            ev.append({**info, "resultado": "abre, mas sem cidade/telefone/@ do lead na página: conferir"
                       + (" (nome bate)" if nome else "")})
            return "duvida"
        forte_local = any(x in locais for x in ("telefone do lead", "@ do lead"))
        ramo = tem_ramo(r.get("titulo", "") + " " + r.get("_texto", r.get("trecho", "")), lead)
        info["ramo"] = ramo
        if nome and (forte_local or (locais and ramo)):
            ev.append({**info, "resultado": "abre, cita o nome e tem prova local → TEM SITE"})
            return "tem"
        if nome and locais:
            ev.append({**info, "resultado": "abre, cita o nome e a cidade, mas é de outro ramo: homônimo (ignorado)"})
            return None
        if nome and pouco_texto:
            ev.append({**info, "resultado": "abre e cita o nome, mas a página quase não tem texto e não tem prova local (não confirmado, ignorado)"})
            return None
        if nome:
            ev.append({**info, "resultado": "abre e cita o nome, mas sem cidade/telefone/@: homônimo de fora (ignorado)"})
            return None
        ev.append({**info, "resultado": "abre, mas é de outra empresa/assunto (ignorado)"})
        return None

    def verificar(self, cru):
        L = normalizar(cru)
        ev, flags = [], set()

        # 2. fechado
        if L["fechado"]:
            ev.append({"criterio": "2.fechado", "url": "", "resultado": "marcado como fechado"})
            flags.add("fechado")

        # 1. site no Maps / CRM
        if L["site"]:
            s = self.checar_site(L["site"], L, "1.site_maps", ev, declarado=True)
            flags.add({"tem": "tem", "quebrado": "quebrado", "duvida": "duvida"}.get(s, "ok"))
        else:
            ev.append({"criterio": "1.site_maps", "url": "", "resultado": "campo de site vazio"})

        if "tem" not in flags and "fechado" not in flags:
            # 3. domínios prováveis
            for dom in candidatos(L):
                c = self.dominio(dom, L)
                rd = c["rdap"]
                url_rdap = f"https://rdap.registro.br/domain/{dom}"
                if rd.get("registrado") is None:
                    ev.append({"criterio": "3.dominio", "url": url_rdap, "resultado": f"RDAP sem resposta ({rd.get('erro')})"})
                    flags.add("duvida_rdap")
                    continue
                if not rd["registrado"]:
                    ev.append({"criterio": "3.dominio", "url": url_rdap, "resultado": "livre (404)"})
                    continue
                h = c.get("http") or {}
                base = {"criterio": "3.dominio", "url": url_rdap, "titular_confere": rd.get("titular_confere"),
                        "expira": rd.get("expira"), "status_rdap": rd.get("status")}
                if h.get("abre"):
                    s_ = self._julgar_pagina(h, "https://" + dom, L, "3.dominio", ev, declarado=False,
                                             extra={"rdap": url_rdap, "titular_confere": rd.get("titular_confere")})
                    if s_ == "tem":
                        flags.add("tem")
                    elif s_ == "duvida":
                        flags.add("duvida")
                elif rd.get("titular_confere"):
                    ev.append({**base, "resultado": f"registrado em nome igual ao da empresa e NÃO abre ({h.get('motivo')}) → site quebrado"})
                    flags.add("quebrado")
                else:
                    ev.append({**base, "resultado": f"registrado, não abre ({h.get('motivo')}), titular "
                               + ("de outro nome" if rd.get("titular_confere") is False else "oculto")
                               + ": dono não confirmado (só registro)"})

        # 4. Instagram
        ig_info = {"ultimo_post": None, "seguidores": None}
        if "tem" not in flags and "fechado" not in flags or L["tem_dono"]:
            self.instagram(L, ev, flags, ig_info)

        # 5. busca no Google
        if "tem" not in flags and "fechado" not in flags:
            self.google(L, ev, flags)

        # veredito
        if "fechado" in flags:
            v = "FECHADO"
        elif "tem" in flags:
            v = "TEM_SITE"
        elif flags & {"ig_fraco", "ig_sem"}:
            v = "DESCARTE_LEAD_FRACO"
        elif flags & {"duvida", "duvida_rdap", "ig_pendente", "busca_pendente"}:
            v = "DUVIDA"
        elif "quebrado" in flags:
            v = "SITE_QUEBRADO"
        else:
            v = "PODE_ABORDAR"

        out = dict(cru)
        out["veredito"] = v
        out["evidencias"] = ev
        out["ig_ultimo_post"] = ig_info["ultimo_post"]
        out["ig_seguidores"] = ig_info["seguidores"]
        out["verificado_em"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        pend = sorted(flags & {"ig_pendente", "busca_pendente", "duvida_rdap"})
        if pend:
            out["pendente"] = pend
        if L["tem_dono"]:
            out["sinalizar"] = True
            out["acao"] = ("lead com dono/em andamento: NÃO descartar automaticamente; avisar o vendedor"
                           if v in ("TEM_SITE", "FECHADO", "DESCARTE_LEAD_FRACO", "DUVIDA") else "lead com dono: manter")
        else:
            out["acao"] = {"TEM_SITE": "tirar do poço (descartar: tem site)", "FECHADO": "tirar do poço (fechado)",
                           "DESCARTE_LEAD_FRACO": "tirar do poço (lead fraco)", "DUVIDA": "perguntar ao Kelwin",
                           "SITE_QUEBRADO": "pode abordar; gancho: site quebrado",
                           "PODE_ABORDAR": "pode abordar"}[v]
        return out

    def instagram(self, L, ev, flags, ig_info):
        u = username_de(L["ig"])
        fonte = "campo instagram do lead"
        if not u:
            q = consulta_ig(L, self.a.cidade)
            res = self.busca.get(q.lower())
            if res is None:
                self.pedidos["buscas"].add(q)
                ev.append({"criterio": "4.instagram", "url": "", "resultado": "sem @; busca site:instagram.com pendente"})
                flags.add("ig_pendente")
                return
            for r in res[:10]:
                cand = username_de(r.get("url", ""))
                if cand and "/p/" not in r.get("url", "") and "/reel" not in r.get("url", "") and \
                        (bate_nome(r.get("title", "") + " " + cand, L)):
                    u, fonte = cand, f"busca Google: {r.get('url')}"
                    break
            if not u:
                ev.append({"criterio": "4.instagram", "url": "https://www.google.com/search?q=" + urllib.parse.quote(q),
                           "resultado": "nenhum @ da empresa encontrado → lead fraco"})
                flags.add("ig_sem")
                return
        perfil = self.ig.get(u)
        url_ig = f"https://www.instagram.com/{u}/"
        if perfil is None:
            self.pedidos["instagram_usernames"].add(u)
            ev.append({"criterio": "4.instagram", "url": url_ig, "resultado": f"perfil ainda não raspado ({fonte})"})
            flags.add("ig_pendente")
            return
        if perfil.get("error") or perfil.get("errorDescription"):
            ev.append({"criterio": "4.instagram", "url": url_ig,
                       "resultado": f"perfil não encontrado/indisponível ({perfil.get('error') or perfil.get('errorDescription')})"})
            flags.add("ig_sem")
            return
        ig_info["seguidores"] = perfil.get("followersCount")
        # Só post do PRÓPRIO perfil conta como atividade (collab/marcação de terceiro aparece no
        # latestPosts com outro ownerUsername). Fixados entram: o max() pega o mais recente.
        datas, datas_collab = [], []
        for p in perfil.get("latestPosts") or []:
            ts = p.get("timestamp") if isinstance(p, dict) else None
            if not ts:
                continue
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except ValueError:
                continue
            dono = (p.get("ownerUsername") or u).lower()
            (datas if dono == u else datas_collab).append(dt)
        ultimo = max(datas) if datas else None
        ig_info["ultimo_post"] = ultimo.date().isoformat() if ultimo else None
        prof = bool(perfil.get("isBusinessAccount")) or bool(perfil.get("businessCategoryName"))
        privado = bool(perfil.get("private"))
        dias = (self.hoje - ultimo).days if ultimo else None
        desc = (f"@{u} ({fonte}): {'profissional' if prof else 'pessoal'}, {'privado' if privado else 'público'}, "
                f"{perfil.get('followersCount')} seguidores, último post "
                f"{ig_info['ultimo_post'] or 'nenhum'}" + (f" ({dias} dias)" if dias is not None else "")
                + (f"; collab de terceiro em {max(datas_collab).date()}" if datas_collab else ""))
        # link da bio
        links = []
        if perfil.get("externalUrl"):
            links.append(perfil["externalUrl"])
        for x in perfil.get("externalUrls") or []:
            if isinstance(x, dict) and x.get("url"):
                links.append(x["url"])
            elif isinstance(x, str):
                links.append(x)
        vistos = set()
        for link in links:
            link = desembrulhar(link)
            if not link or link in vistos:
                continue
            vistos.add(link)
            s = self.checar_site(link, L, "4.instagram_bio", ev, declarado="bio")
            if s == "tem":
                flags.add("tem")
            elif s == "quebrado":
                flags.add("quebrado")
            elif s == "duvida":
                flags.add("duvida")
        sinal_negocio = any(tipo_url(desembrulhar(x)) in ("social", "agregador") for x in links)
        if privado:
            ev.append({"criterio": "4.instagram", "url": url_ig, "resultado": desc + " → privado: lead fraco"})
            flags.add("ig_fraco")
        elif not prof and dias is not None and dias <= self.a.dias_post and sinal_negocio:
            # A API não separa "pessoal" de "profissional com categoria oculta". Conta ativa e com
            # link de WhatsApp/agregador na bio é sinal de negócio: na dúvida, perguntar ao Kelwin.
            ev.append({"criterio": "4.instagram", "url": url_ig, "resultado": desc
                       + " → aparece como pessoal, mas posta e tem link de contato na bio (conferir se é profissional)"})
            flags.add("duvida")
        elif not prof:
            ev.append({"criterio": "4.instagram", "url": url_ig, "resultado": desc + " → só pessoal: lead fraco"})
            flags.add("ig_fraco")
        elif dias is None or dias > self.a.dias_post:
            ev.append({"criterio": "4.instagram", "url": url_ig, "resultado": desc + f" → parado (> {self.a.dias_post} dias)"})
            flags.add("ig_fraco")
        else:
            ev.append({"criterio": "4.instagram", "url": url_ig, "resultado": desc + " → ativo"})

    def google(self, L, ev, flags):
        q = consulta_google(L, self.a.cidade)
        res = self.busca.get(q.lower())
        url_q = "https://www.google.com/search?q=" + urllib.parse.quote(q)
        if res is None:
            self.pedidos["buscas"].add(q)
            ev.append({"criterio": "5.google", "url": url_q, "resultado": "busca pendente"})
            flags.add("busca_pendente")
            return
        if not res:
            ev.append({"criterio": "5.google", "url": url_q, "resultado": "sem resultados orgânicos"})
            return
        primeiro = res[0].get("url", "")
        ev.append({"criterio": "5.google", "url": url_q,
                   "resultado": f"1º resultado: {host_de(primeiro)} ({tipo_url(primeiro)})"})
        # Rigor: qualquer domínio próprio/construtor da empresa entre os 5 primeiros é checado.
        for i, r in enumerate(res[:5]):
            url = r.get("url", "")
            t = tipo_url(url)
            if t not in ("proprio", "construtor"):
                continue
            h = host_de(url)
            # domínio PRÓPRIO: o nome tem de estar no endereço (diretório só repete no título)
            if not bate_nome(h, L):
                continue
            # o snippet do Google citar a cidade também é prova local (a busca já era "<nome>" cidade)
            snip = (r.get("title", "") or "") + " " + (r.get("description", "") or "")
            extra = ["cidade no snippet do Google"] if compacto(self.a.cidade) in compacto(snip) else []
            s = self.checar_site(url, L, f"5.google_resultado_{i + 1}", ev, declarado=False, locais_extra=extra)
            if s == "tem":
                flags.add("tem")
                return
            if s == "duvida":
                flags.add("duvida")


def _sem_texto(r):
    r = dict(r)
    t = r.pop("_texto", "")
    if r.get("abre"):
        r["trecho"] = t[:3000]
    return r


# ---------------------------------------------------------------- principal
def resumo(leads):
    por_v = Counter(l["veredito"] for l in leads)
    por_sit = defaultdict(Counter)
    for l in leads:
        por_sit[l.get("situacao") or "-"][l["veredito"]] += 1
    sair = [l for l in leads if l["veredito"] in ("TEM_SITE", "FECHADO", "DESCARTE_LEAD_FRACO")]
    return {
        "total": len(leads),
        "por_veredito": {v: por_v.get(v, 0) for v in VEREDITOS},
        "veredito_x_situacao": {s: {v: c.get(v, 0) for v in VEREDITOS} for s, c in sorted(por_sit.items())},
        "sair_do_poco": {
            "total": len(sair),
            "sem_dono": sum(1 for l in sair if not l.get("sinalizar")),
            "com_dono_so_sinalizar": sum(1 for l in sair if l.get("sinalizar")),
        },
        "com_dono_sinalizados": sum(1 for l in leads if l.get("sinalizar")),
        "pendentes": sum(1 for l in leads if l.get("pendente")),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--entrada", required=True)
    ap.add_argument("--saida")
    ap.add_argument("--ig-cache")
    ap.add_argument("--busca-cache")
    ap.add_argument("--dominio-cache")
    ap.add_argument("--pedidos", help="grava usernames/consultas que faltam nos caches da Apify")
    ap.add_argument("--envelope", action="store_true", help='saída {"resumo":..., "leads":[...]}')
    ap.add_argument("--hoje")
    ap.add_argument("--dias-post", type=int, default=60)
    ap.add_argument("--cidade", default="uberlândia")
    ap.add_argument("--sem-rede", action="store_true")
    ap.add_argument("--threads", type=int, default=6)
    a = ap.parse_args()

    entrada = Path(a.entrada)
    leads = json.loads(entrada.read_text(encoding="utf-8"))
    if isinstance(leads, dict) and "leads" in leads:
        leads = leads["leads"]
    dom_arq = Path(a.dominio_cache) if a.dominio_cache else entrada.parent / "cache-dominios.json"
    dom_cache = json.loads(dom_arq.read_text(encoding="utf-8")) if dom_arq.exists() else {}

    ver = Verificador(a, dom_cache)
    feitos = [0]

    def um(l):
        r = ver.verificar(l)
        with ver.lock:
            feitos[0] += 1
            if feitos[0] % 10 == 0:
                print(f"  {feitos[0]}/{len(leads)}", file=sys.stderr, flush=True)
                dom_arq.write_text(json.dumps(ver.dom, ensure_ascii=False, indent=1), encoding="utf-8")
        return r

    with ThreadPoolExecutor(a.threads) as ex:
        saida = list(ex.map(um, leads))
    dom_arq.write_text(json.dumps(ver.dom, ensure_ascii=False, indent=1), encoding="utf-8")

    rs = resumo(saida)
    if a.pedidos:
        p = {k: sorted(v) for k, v in ver.pedidos.items()}
        Path(a.pedidos).write_text(json.dumps(p, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"pedidos: {len(p['instagram_usernames'])} perfis, {len(p['buscas'])} buscas → {a.pedidos}")
    if a.saida:
        corpo = {"gerado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                 "entrada": str(entrada), "resumo": rs, "leads": saida} if a.envelope else saida
        Path(a.saida).write_text(json.dumps(corpo, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"gravado {a.saida}")
    print(json.dumps(rs, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
