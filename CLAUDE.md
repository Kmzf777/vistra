# CLAUDE.md — repositório da Vistra

Este repositório é a **gestão da Vistra** (startup de IA de Uberlândia: WhatsApp na API oficial e
sites): CRM, concorrência, criação de conteúdo, marca, aprendizados e prospecção.

Os **produtos para clientes** (sites e CRMs de petshop: Agrozet, Alva, Mar Azul…) ficam em outro
repositório, `PetShop-coldcall`, em `clientes/<cliente>/`.

**Exceção (decisão do dono, 15/10/2026):** o código reaproveitável dos sites de clínica fica em `sites/`.
Dados reais de clientes e leads nunca entram no git: `sites/leads/`, os JSONs de `sites/clientes/` e as fotos
de `sites/src/assets/clientes/` ficam ignorados, menos o cliente fictício `exemplo`. Regras e decisões do
negócio de sites em `sites/CLAUDE.md`. Fluxo de prospecção na skill `prospectar` (`.claude/skills/prospectar/`).

## Regras obrigatórias

Valem para toda tarefa do projeto:

1. **Subagentes em background.** Execute as tarefas com subagentes em background e rode em paralelo o que
   for independente.
2. **Skills.** Identifique e use as skills instaladas que se aplicam à tarefa.
3. **Pesquisa antes da solução.** Pesquise na internet antes de apresentar uma solução. Priorize documentação
   oficial, boas práticas comprovadas e informação atualizada, e cite as fontes.
4. **Validação antes da entrega.** Verifique o resultado (build, teste, conferência) antes de entregá-lo.

## Mapa

| Pasta | O que é |
|---|---|
| `crm/` | Vistra CRM (Next 16 + Supabase): leads, contatos e funil. |
| `marca/`, `conteudo/` | Manual da marca, guia do vendedor, introdução da marca, comunicação explicativa e estratégia de marketing. |
| `motion/` | Reels da Vistra: identidade para vídeo e o motor (Remotion). |
| `aprendizados/` | Specs, planos, pesquisas (inclusive `concorrencia/`) e referências (`docs/superpowers/...`). |
| `ferramentas/maps-scraper/` | Kit local do Google Maps Scraper (Docker). |
| `prospeccao/` | Leads raspados (`leads/`, fora do git) e os scripts que raspam e montam esses leads. |
| `sites/` | Sites para clínicas (Astro 7 + Tailwind v4): templates, scripts e textos de venda. Clientes e leads reais ficam fora do git. Leia `sites/CLAUDE.md`. |

## Google Maps Scraper (kit em `ferramentas/maps-scraper/`)

Deploy local do open-source `gosom/google-maps-scraper`, exposto em **`http://localhost:8080`**.
Raspa **só listagens do Google Maps** (não rede social).

- **Pedido de raspar empresas, lista de lugares ou leads:** carregue e siga a skill `google-maps-scraper`
  (`.claude/skills/google-maps-scraper/SKILL.md`). Não improvise as chamadas.
- **Comandos:** `/scrape`, `/scrape-batch`, `/scrape-setup`, `/scrape-jobs` (em `.claude/commands/`).
- **Rate limit: avise, não bloqueie.** Em pedido grande (depth alto, muitas keywords, `email:true`), siga em
  frente com UM aviso curto sobre o risco de o IP ser limitado pelo Google e sugira proxies. Recuse só uso
  abusivo (vigiar pessoas, spam).
- **Fatos fixos:**
  - `POST /api/v1/jobs` exige `max_time` (segundos), `lat` e `lon` (strings) e `keywords` (array), senão dá 422.
  - A resposta traz `{"id":"<uuid>"}`. O status sai em `GET /api/v1/jobs/{id}`, campo `"Status"`, que fica `"ok"` quando termina.
  - Faça o poll em background (`run_in_background: true`). O Bash bloqueia `sleep` em foreground.
  - Antes de job grande, confirme com o usuário.
  - E-mail e telefone raspados são dado pessoal: resuma e salve em disco, não despeje no chat.
- **Setup:** `docker compose -f ferramentas/maps-scraper/docker-compose.yml up -d` e depois
  `curl http://localhost:8080/api/v1/jobs`. Detalhes em `ferramentas/maps-scraper/SETUP.md`.
- **Atribuição:** `gosom/google-maps-scraper` (MIT, © Georgios Komninos). Mantenha `CREDITS.md` e `LICENSE`
  do kit intactos.

## Reels (estudio-reels)

Reels, motion e vídeo vertical da Vistra são produzidos pela skill `.claude/skills/estudio-reels-vistra/`,
plantada da semente pessoal `estudio-reels`. Leia o `SKILL.md` dela antes de escrever roteiro, gerar
narração, montar ou conferir uma peça: é ela que comanda o processo. A raiz da marca é a raiz deste
repositório (o motor fica em `motion/`).
