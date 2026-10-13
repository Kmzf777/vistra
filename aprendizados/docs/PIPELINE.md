# Pipeline de leads — Pet shops de Uberlândia/MG

## Por que não usamos o kit como veio

O `google-maps-scraper-kit` roda o scraper `gosom/google-maps-scraper` em Docker.
Nesta máquina:

- **Docker Desktop não está instalado** e o **WSL2 também não** (`wsl --status` →
  "O Subsistema do Windows para Linux não está instalado").
- Contornamos baixando o **binário nativo Windows** (`bin/gmaps-scraper.exe`,
  release v1.18.1) — sem Docker.
- O binário **falha neste ambiente**: toda query retorna `unexpected page type`
  em ~10s, tanto headless quanto `-debug` (headful), com e sem `-geo`/`-lang`.
  Causa: o Google devolve muro de consentimento/anti-bot ao navegador limpo do
  Playwright, que não é a página de resultados que o scraper espera.

## O que funcionou

Coleta pelo **Chrome real do usuário** (extensão Claude in Chrome), que já tem
consentimento e sessão — o mesmo request que o Playwright não passa, passa aqui.

### Fase 1 — Censo no Google Maps
- Painel de resultados do Maps **recicla os nós do DOM** (~5 cards vivos por vez),
  então a coleta é **incremental**: colhe → rola → colhe, acumulando num `Map`
  com dedupe por URL do place, persistido em `localStorage`.
- **Só gesto de rolagem real carrega mais resultados.** `scrollTop = ...` e
  `WheelEvent` sintético não disparam o lazy-load do Maps.
- O Maps devolve **no máximo ~20 resultados por busca**. Para cobrir a cidade,
  varremos **um texto de busca diferente por bairro** — mudar só o centro do mapa
  (`@lat,lon`) **não refaz a busca**, ele reaproveita o resultado anterior.

Buscas usadas: `pet shop` (centro), `petshop`, `banho e tosa em Uberlândia`, e
`pet shop <bairro> Uberlândia` para Santa Mônica, Luizote de Freitas, Planalto/
Roosevelt, Segismundo Pereira, Shopping Park/Mansour, Jardim Patrícia/Guarani,
Tubalina/Morada da Colina.

### Fase 2 — Enriquecimento (Instagram + site)
- Rodando **na própria página do google.com**, `fetch('/search?q=...')` é
  **same-origin** → sem CORS, sem abrir aba, sem screenshot.
- Regex no HTML do resultado extrai o primeiro perfil `instagram.com/<handle>`
  e o primeiro domínio próprio (descartando agregadores: telelistas, apontador,
  guiamais, solutudo, ifood, redes sociais, encurtadores).
- Atenção: a string `/sorry/` aparece no HTML **normal** do Google — não serve
  como detector de bloqueio. Use `"Nossos sistemas detectaram"` / `unusual traffic`
  ou tamanho anômalo da resposta.

### Fase 3 — Seguidores
Contagem de seguidores exige o domínio do Instagram (CORS), então roda a partir
de uma aba em `instagram.com`.

### Fase 2 (revisada) — qual buscador aguenta o volume
Testado na prática, nesta ordem:

| Buscador | Recall de Instagram | Aguentou o lote? |
|---|---|---|
| Google | bom (~62%) | **não** — captcha ("Nossos sistemas detectaram tráfego incomum") após ~32 buscas |
| Bing | bom no início | **não** — não bloqueia, mas **degrada silenciosamente**: passa a devolver resultados irrelevantes (fóruns, Wikipédia, Zhihu) mantendo o tamanho normal da página |
| **DuckDuckGo** (`html.duckduckgo.com/html/`) | **~88%** | **sim** — 98 buscas sem degradar; páginas de 33 KB (Google: 560 KB) |

Armadilhas encontradas:
- **Bing codifica as URLs** em `u=a1<base64>`; sem decodificar, nenhum link aparece.
- **DuckDuckGo** codifica em `uddg=<urlencoded>` e cola um `&rut=<hash>` no fim — tem que cortar.
- Degradação silenciosa só é detectável por **checagem de relevância**: exigir que um
  token distintivo do nome apareça no HTML. Tamanho de resposta não basta.
- Todo handle encontrado é **validado contra o nome** do negócio (token em comum),
  senão o buscador devolve o perfil do vizinho. Sem isso, 6 de 32 vieram errados.
- Handle repetido em dois negócios = falso positivo; fica com o de match mais forte.

### Fase 3 — seguidores
- `fetch('/api/v1/users/web_profile_info/?username=X')` devolve **429 de cara**.
- O que funciona: `fetch('/<handle>/')` e ler a meta `og:description`
  ("1,982 seguidores, seguindo 3,024, 242 posts"). 105 de 106 perfis, zero bloqueio,
  com pausa de 1,6 s entre requisições.

### Ritmo: o detalhe que quebra tudo
`setTimeout` é **estrangulado para ~1x/minuto em aba de segundo plano** — o loop
parece travado. Sem pausa nenhuma, porém, o buscador bloqueia. A saída foi pausa por
**espera ocupada** (`while (Date.now()-t < ms) {}`), que o Chrome não estrangula,
com o loop fatiado em blocos que cabem no limite de 45 s do executor de JS.
