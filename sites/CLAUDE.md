# Sites para clínicas (sites/)

Negócio: gerar sites rápidos e bonitos para comércios locais e vender pela abordagem no WhatsApp (demo pronta no link + proposta).

Veio da pasta local `sites-comercios-locais` em 15/10/2026. Aquela pasta fica como backup e não é git.

## Regra de dados (decisão do dono, 15/10/2026)

- O código reaproveitável dos sites fica aqui, no git.
- Dados reais de clientes e leads **nunca** entram no git. Ficam só no disco, ignorados pelo `.gitignore` da raiz:
  - `sites/leads/` inteiro (planilhas, `abordagens.csv`, mensagens por lead, `raw/`, `screenshots/`, `casos.md`).
  - `sites/clientes/*.json`, menos `exemplo.json` e `exemplo-pet.json`.
  - `sites/src/assets/clientes/*/`, menos `exemplo/` e `exemplo-pet/`.
- Os únicos clientes versionados são os fictícios: `exemplo` (Clínica Exemplo, odontologia, imagens de `scripts/gerar-imagens-exemplo.mjs`) e `exemplo-pet` (Pet Exemplo, pet shop + veterinária, imagens de `scripts/gerar-imagens-exemplo-pet.mjs`). Telefones falsos. O build funciona só com eles.
- Nos arquivos versionados, lead real aparece só de forma anônima ("lead nº 1", "caso 2"). Os nomes ficam em `sites/leads/casos.md`, local.
- Antes de cada commit, conferir no staged se não há telefone, e-mail ou nome de clínica real.

## Git e deploy

- Git liberado neste repositório (commit local à vontade). **Push só com o ok do dono.**
- **Vercel continua proibida:** nada de deploy nem `vercel login`. NÃO usar a conta da CLI atual (`kelwinlopes16-9979`) nem a `kmzf777` (do Artha-Rafael). O dono vai criar uma conta nova só para este negócio.

## Empresa: Vistra.ai (decidido em 13/10/2026)

- O negócio de sites roda sob a **Vistra.ai** (@vistra.ia no Instagram, linktr.ee/vistra.ia), startup do Kelwin de automação B2B com IA. Bio: "Não somos agência. Instalamos o Vendedor que Nunca Dorme na sua operação."
- **Estratégia:** o site é o produto de entrada. Depois vem o upsell de automação (agente de vendas com IA no WhatsApp, `vistra-ia.vercel.app`). Vários leads do primeiro teste já usam robô de atendimento no WhatsApp, o que mostra demanda por automação.
- Na mensagem, a apresentação é: "estou começando a Vistra, uma startup de automação com IA. para apresentar a Vistra em Uberlândia, estamos fazendo sites para clínicas por um valor bem abaixo do mercado". O lead pode conferir o @vistra.ia, o que também ajuda contra o medo de golpe.
- **Oferta de R$ 39,90 está descontinuada** (decisão do Kelwin, 13/10/2026). Era a landing page por briefing (`landingvistra.vercel.app/sellpage`). Precisa sair do Linktree da Vistra, porque quem pesquisar a Vistra veria esse preço.
- **Oferta do site (decidida em 13/10/2026), "Sua clínica no Google em 7 dias":** site completo pensado para o celular + domínio próprio (1º ano incluso) + botão de WhatsApp com mensagem de agendamento + perfil do Google e do WhatsApp Business ajustados + avaliações do Google no site + ajustes ilimitados nos primeiros 30 dias. **R$ 497 à vista ou 3x de R$ 179. Sem mensalidade no 1º ano** (hospedagem no Cloudflare Pages; custo ~R$ 40/ano de domínio). **Garantia: só paga depois que o site estiver no ar e aprovado.** Escassez: preço de lançamento só para as primeiras 10 clínicas (o Kelwin precisa honrar esse limite). Capacidade: 10+ demos por dia. A oferta vai na mensagem DEPOIS que a clínica vê a prévia. Texto base em `vendas/mensagem-oferta.md`.
- Próximo: automatizar posts do Instagram da Vistra.

## Decisões até agora (10/10/2026)

- **Stack:** Astro 7 + Tailwind v4, site estático, um JSON por cliente em `clientes/<slug>.json` que gera a rota `/<slug>`.
- **Demos:** Vercel Hobby, um projeto só, rota por cliente (`/nome-do-cliente`). Hobby é não comercial pelos termos, então só para prospecção. Ainda bloqueado (ver "Git e deploy").
- **Cliente fechado:** domínio próprio (.com.br, ~R$ 40/ano) no Cloudflare Pages (grátis, permite uso comercial) ou Vercel Pro quando compensar.
- **Preço antigo (hipótese, substituída pela oferta de 13/10):** implantação de R$ 300 a 800 + R$ 59 a 99/mês.

## Primeiro teste (10/10/2026)

- **Nicho:** dentista. **Região:** Uberlândia - MG.
- Rodada de teste com 30 resultados do Maps (não 50). Resultado: 5 quentes, 13 mornos, 12 descartes.
- Dados em `leads/dentista-uberlandia-2026-10-10.json` e planilha `.xlsx` ao lado, gerada por `python scripts/gerar_planilha.py leads/dentista-uberlandia-2026-10-10.json` (rodar de `sites/`). Tudo local, fora do git.
- O lead nº 1 tem demo pronta (nome e slug em `leads/casos.md`).
- Dados brutos e fotos baixadas em `leads/raw/` (fotos do Instagram expiram, baixar na hora).
- Custo Apify do teste: ≈ US$ 0,15 (plano FREE, US$ 5/mês de crédito).

## Projeto (como funciona)

- `clientes/<slug>.json`: todos os dados do cliente (contato, endereço, horário, nota do Google, tratamentos, avaliações reais, fotos, cores do tema). O formato é o tipo `Cliente` de `src/lib/clientes.ts`, e `clientes/exemplo.json` serve de modelo. Campo `nicho` escolhe o template. `demo: true` coloca `noindex` e uma nota de "prévia" no rodapé.
- `src/assets/clientes/<slug>/`: fotos do cliente (o JSON referencia só o nome do arquivo; o Astro gera WebP responsivo).
- `src/templates/Odontologia.astro`: template do nicho (hero, antes/depois com slider, tratamentos, primeira consulta, avaliações do Google, espaço, mapa sob demanda + horário, botão fixo de WhatsApp, schema `Dentist`/LocalBusiness).
- `src/templates/Pet.astro` (`nicho: "pet"`): pet shop, veterinária ou os dois pelo campo `tipo`. Faixa de emergência 24h, medalha com a nota do Google, serviços por categoria com preço "a partir de", tabela de banho e tosa por porte com mensagem de agendamento pronta, leva e traz, equipe com CRMV, schema `PetStore`/`VeterinaryCare`. Regra do CFMV (Res. 1.649/2025): nome e CRMV do responsável técnico na página e nada de preço de ato veterinário (o template ignora `aPartirDe` em `clinica`, `vacinas` e `exames` e avisa no build).
- `scripts/`: `gerar_planilha.py` (planilha de leads a partir de um JSON em `leads/`) e `gerar-imagens-exemplo.mjs` (imagens do exemplo).
- `vendas/`: textos de venda sem dado pessoal.
- Rodar: `npm install`, `npm run build` gera `dist/`, `npx astro preview` serve local.
- Meta: Lighthouse 95+ no celular. SEO da demo sai baixo de propósito por causa do `noindex`. No site do cliente fechado, tirar `demo`.
- Antes de publicar um site de cliente fechado: confirmar CRO do responsável técnico (exigência do CFO em publicidade odontológica) e autorização das fotos de antes/depois.

## ICP (hipótese a validar)

- Ticket alto por cliente final: dentista, estética, fisioterapia, advogado, oficina, marcenaria, energia solar, escola de idiomas.
- Cliente final procura no Google ("perto de mim", urgência).
- Perfil no Maps com muitas avaliações e sem site (ou site apontando para o Instagram).
- Evitar no começo: restaurante, barbearia, lanchonete (ticket baixo, vivem de iFood/Instagram).
- Escolher **um nicho só** primeiro.

## Prospecção (qualificação de leads)

- **Fluxo diário:** skill `/prospectar` (`.claude/skills/prospectar/SKILL.md`, na raiz do repositório). Vai da escolha dos 5 leads do dia até a pergunta qualificatória ("posso te mandar para dar uma olhada?") e para aí. Preço, mensalidade e garantia ficam fora por enquanto. Registro de cada abordagem em `leads/abordagens.csv` (local).
- **Só prospectar quem NÃO tem site.** Antes de qualquer mensagem, conferir 4 fontes: Google Maps, perfil do WhatsApp Business (pelo WhatsApp Web, sem enviar nada), bio do Instagram e busca no Google. Site que abre = descarte. Site quebrado ou domínio inexistente = pode abordar (vira gancho).
- **Ferramentas:** MCP da Apify. Actors: `compass/crawler-google-places` (Maps, US$ 0,004/lugar no FREE; teto mínimo por execução US$ 0,50) e `apify/instagram-profile-scraper` (US$ 0,0026/perfil). O @ do Instagram sai do campo de site do Maps ou de busca no Google pelo navegador (a busca web comum não acha). Este repositório também tem o kit local `ferramentas/maps-scraper/` (skill `google-maps-scraper`).
- **Google Maps / GMN:** existe perfil, nota, nº de avaliações, telefone, campo de site.
- **Instagram:** se está ativo, seguidores, link da bio (site próprio x Linktree/wa.me x nada).
- **Classificação:** QUENTE = sem site próprio (ou o site é Instagram/wa.me/agregador), 20+ avaliações, nota 4,3+, post nos últimos 30 dias. MORNO = sem site mas poucas avaliações, nota baixa ou Instagram parado/não verificado. DESCARTE = já tem site próprio decente ou parece fechado. Também é DESCARTE quem só tem Instagram privado ou pessoal, sem perfil profissional (decisão do Kelwin em 14/10/2026: quem não divulga nem no Instagram dificilmente vai querer site).
- **Conferir também o site do perfil do WhatsApp Business** antes de mandar: pode ser diferente do Google. Caso do lead nº 1: o WhatsApp mostrava um domínio que nunca foi registrado, e isso virou o gancho da mensagem. Nunca registrar o domínio de um lead por conta própria. Oferecer registrar no nome dele.
- **Confiança (medo de golpe):** mandar imagem/print da prévia em vez de link (`leads/screenshots/<slug>-previa-whatsapp.jpg`), perfil do WhatsApp com nome e foto reais, oferecer mostrar pessoalmente, nunca pedir pagamento antes da aprovação.
- **Mensagem:** a principal diz que a prévia do site já está feita e pergunta se pode mandar (pergunta qualificatória), SEM link. A demo é montada logo depois do "sim", em até ~30 min (decisão do Kelwin em 13/10/2026). Só abordar quando der para entregar no mesmo dia. Citar algo real (uma avaliação ou um post), sem jargão, com saída fácil.
- Cuidados: disparo frio em massa no WhatsApp derruba número (poucas mensagens/dia, personalizadas, opt-out). Scraping do Maps fere os termos do Google.
- Nunca enviar mensagem nem publicar nada sem confirmação do usuário. Mostrar o custo antes de qualquer execução paga na Apify.

## Skills de design

- Instaladas neste repositório em `.claude/skills/` (arquivos reais, via `npx skills add ... --copy`; fontes em `skills-lock.json`): `frontend-design`, pacote `ui-ux-pro-max` (+ `banner-design`, `brand`, `design`, `design-system`, `slides`, `ui-styling`), `wizard` e `to-questionnaire`.
- `frontend-design` (anthropics/skills): fugir de visual genérico; identidade a partir do próprio negócio.
- `ui-ux-pro-max` (nextlevelbuilder): checklist de UX/acessibilidade. A paleta sugerida para dentista (ciano/verde) é clichê; usamos as cores reais da clínica.
