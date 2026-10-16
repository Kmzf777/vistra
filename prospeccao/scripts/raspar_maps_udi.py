# -*- coding: utf-8 -*-
"""Raspa o Google Maps por nicho em Uberlândia e grava leads/uberlandia/raw/<nicho>.tsv.

Usa o mesmo endpoint JSON que o próprio Maps chama ao rolar a lista
(/search?tbm=map), então não precisa de Docker nem de navegador aberto.
Só biblioteca padrão.

    python scripts/raspar_maps_udi.py                 (todos os nichos)
    python scripts/raspar_maps_udi.py odonto estetica (só esses)
    python scripts/raspar_maps_udi.py --paginas 2     (20 por página; padrão 3)

Depois: python scripts/montar_leads_udi.py  -> leads.json que a /lista do Vistra CRM lê.

Cuidado: é tráfego real no Google. O script espera entre as páginas; rodar em
loop ou com dezenas de nichos pode levar a bloqueio temporário do IP.
"""
import json, random, sys, time, urllib.parse, urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "leads" / "uberlandia" / "raw"
LAT, LON = -18.9186, -48.2772  # centro de Uberlândia
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"

# Chave = nome do arquivo (casa com NICHOS em montar_leads_udi.py).
BUSCAS = {
    "odonto":      ["clinica odontologica", "implante dentario", "ortodontia"],
    "estetica":    ["clinica de estetica", "harmonizacao facial", "depilacao a laser"],
    "imobiliaria": ["imobiliaria", "corretor de imoveis"],
    "autoescola":  ["autoescola"],
    "academia":    ["academia", "studio de pilates", "crossfit"],
    "seminovos":   ["loja de carros seminovos", "revenda de motos"],
    "planejados":  ["moveis planejados", "marcenaria planejados"],
    "solar":       ["energia solar"],
    "idiomas":     ["escola de ingles", "curso profissionalizante"],
    "veterinaria": ["clinica veterinaria"],
    "petshop":     ["pet shop", "banho e tosa", "agropecuaria pet"],
    "advocacia":   ["escritorio de advocacia", "advogado"],
    "eventos":     ["buffet infantil", "espaco de eventos"],
}


def g(x, *caminho):
    """Acesso seguro a listas aninhadas do JSON do Maps."""
    for i in caminho:
        if not isinstance(x, list) or i >= len(x):
            return None
        x = x[i]
    return x


def pagina(consulta, inicio):
    pb = (f"!4m8!1m3!1d40000!2d{LON}!3d{LAT}!3m2!1i1200!2i900!4f13.1"
          f"!7i20!8i{inicio}!10b1")
    url = "https://www.google.com/search?" + urllib.parse.urlencode(
        {"tbm": "map", "authuser": 0, "hl": "pt-BR", "gl": "br", "q": consulta, "pb": pb})
    r = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR"})
    txt = urllib.request.urlopen(r, timeout=25).read().decode("utf-8")
    if txt.startswith(")]}'"):
        txt = txt.split("\n", 1)[1]
    txt = txt.rsplit("/*", 1)[0]
    dados = json.loads(txt)
    return [x[14] for x in (g(dados, 0, 1) or []) if isinstance(x, list) and len(x) > 14 and x[14]]


def linha(p):
    nome = g(p, 11) or ""
    nota = g(p, 4, 7)
    aval = g(p, 4, 8)
    cat = (g(p, 13) or [""])[0] or ""
    end = g(p, 39) or ""
    end = end.replace(", Uberlândia - MG", "").split(" - Uberlândia")[0]
    tel = g(p, 178, 0, 0) or ""
    site = g(p, 7, 0) or ""
    if "google.com/aclk" in site:
        site = ""
    texto = json.dumps(p, ensure_ascii=False)
    # Permanente ou temporário: nos dois casos o lead não serve para abordar agora.
    fechado = 1 if any(s in texto for s in (
        "Fechado permanentemente", "Fechado temporariamente", "Permanently closed",
        "Temporarily closed", "CLOSED_PERMANENTLY", "CLOSED_TEMPORARILY")) else 0
    cidade = "Uberlândia" in texto or "Uberlandia" in texto
    nota_s = f"{nota:.1f}".replace(".", ",") if isinstance(nota, (int, float)) else ""
    campos = [nome, nota_s, str(aval or ""), cat, end, tel, site, str(fechado), "0"]
    return cidade, "\t".join(c.replace("\t", " ").replace("\n", " ") for c in campos)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    paginas = 3
    if "--paginas" in sys.argv:
        paginas = int(sys.argv[sys.argv.index("--paginas") + 1])
        args = [a for a in args if a != str(paginas)]
    alvo = {k: v for k, v in BUSCAS.items() if not args or k in args}
    SAIDA.mkdir(parents=True, exist_ok=True)

    for chave, consultas in alvo.items():
        linhas, vistos = [], set()
        for c in consultas:
            for n in range(paginas):
                try:
                    lugares = pagina(f"{c} em Uberlândia MG", n * 20)
                except Exception as e:
                    print(f"  ! {c} p{n + 1}: {e}")
                    break
                novos = 0
                for p in lugares:
                    cidade, l = linha(p)
                    nome = l.split("\t", 1)[0]
                    if cidade and nome and nome not in vistos:
                        vistos.add(nome)
                        linhas.append(l)
                        novos += 1
                time.sleep(1.5 + random.random() * 1.5)
                if len(lugares) < 20 or not novos:
                    break
        (SAIDA / f"{chave}.tsv").write_text("\n".join(linhas) + "\n", encoding="utf-8")
        print(f"{chave:12s} {len(linhas):4d} lugares")


if __name__ == "__main__":
    main()
