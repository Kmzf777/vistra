# Vistra CRM: banco novo e fluxo "Próximo lead". Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer o banco do Vistra CRM do zero no projeto Supabase `vistra-crm`, com fila "Próximo lead" com cota, passos guiados, mensagens aprovadas, resultado em um toque, bloqueio e tela do dono, e virar a produção para ele.

**Architecture:** O banco é a fonte das regras. Toda escrita passa por funções RPC `security definer` que gravam o evento na mesma transação, e o vendedor só lê os próprios leads por RLS. O app Next 16 em `crm/` é adaptado, não reescrito: uma camada de dados `server-only` (`lib/dados/`) chama as RPCs, as Server Actions devolvem `Resultado` em português, e as regras puras (telefone E.164, validador de mensagens, link do WhatsApp, lista "Agora", períodos) ficam em `lib/` com testes vitest. Tudo é feito no branch `crm-banco-novo`. A produção só vira no corte (Tarefa 14).

**Tech Stack:** Next 16.3 (App Router, Server Actions, `proxy.ts`), React 19, CSS Modules, `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.11x, Supabase CLI 2.122.0 (devDependency), Postgres 17, pgTAP, vitest 5, tsx 4, libphonenumber-js 1.13 (metadados `max`), `postgres` 3.4 (só no executor de pgTAP sem Docker).

**Spec:** `aprendizados/docs/superpowers/specs/2026-10-26-crm-banco-novo-design.md` (§12 decisões, §13 respostas do Kelwin). Apoio: `aprendizados/docs/crm-db/2026-10-26-engenharia-reversa.md` (invariantes §7), `2026-10-26-boas-praticas.md` (checklist §8), `2026-10-26-fluxo-proximo-lead.md` (§4.2, §5, §6.3).

## Global Constraints

- Projeto Supabase `vistra-crm` (org Vistra, sa-east-1, plano Free). O MCP `supabase-ro` é de outro projeto: nunca usá-lo para o CRM.
- "A partir de 30/10/2026 toda tabela nova em `public` precisa de `GRANT` explícito." Nenhum grant para `anon`.
- Chaves `sb_publishable_` e `sb_secret_`. No código novo: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` (a secreta sem `NEXT_PUBLIC_`, só no servidor e em scripts). O app em produção continua lendo `crm/.env.local` (banco antigo) até o corte. Durante o desenvolvimento, o código novo lê `crm/.env.novo.local`.
- Funções `security definer` com `set search_path = ''` e nomes qualificados. Ajudantes de policy em `private`. `revoke execute ... from public, anon` em toda função.
- Policies `to authenticated` com `(select auth.uid())`, uma permissiva por ação, índice em toda coluna de policy e em toda FK.
- Escrita só por RPC. Nenhuma policy nem grant de `insert`/`update`/`delete` para `authenticated`.
- Erro de RPC: `raise exception '<frase em português>' using errcode = 'P0001'`. Server Action nunca lança: devolve `{ ok: true; recado } | { ok: false; erro }` (invariante 15). `redirect()` fica fora de `try/catch`.
- No servidor, `getClaims()` (nunca `getSession()`), com autorização dentro de cada Server Action.
- Nomes em português; `snake_case` no banco; CSS Modules; marca verde `#39FF14` sobre preto (tokens de `app/globals.css`).
- WhatsApp: só `https://wa.me/<dígitos>?text=<encodeURIComponent(texto)>`, nunca `web.whatsapp.com/send?phone=`. Uma mensagem por link; as partes seguintes vão por "copiar". O CRM nunca envia nada.
- Mensagens: "no máximo 650 caracteres somando as partes, 2 ou 3 partes, humanizada, sem dois-pontos, sem travessão, sem citar a Vistra; depois de `.`, `?` ou `!`, ou quebra a linha e começa minúscula, ou segue na mesma linha com maiúscula". O texto diz "estudo [curso] na UFU", nunca "somos da UFU". Nas clínicas, nada de promessa de resultado (CFO 196/2019, CFM 2.336/2023, CFMV 1.649/2025).
- Valores de `configuracao`: preço de tabela 497, piso de referência 397 (sem bloqueio), comissão 50 (%) gravada na venda, cota padrão 5 aberturas **enviadas** por dia, acompanhamento em 2 dias úteis, alerta de vendedor parado em 2 dias úteis. O "dia" é o de `America/Sao_Paulo`.
- Repositório público: nenhum dado real (lead, telefone, e-mail, chave, dump) em migração, seed, teste, exemplo ou commit. Fictícios no padrão `(34) 90000-00XX`, nomes "… Exemplo …", e-mails `@exemplo.com`, `origem_id` e `google_place_id` começando com `exemplo-`. Dados reais só em `prospeccao/leads/` (ignorado), lidos por script.
- Migrações só pelo CLI (`npx supabase`, versão 2.122.0). Nada pelo SQL Editor. Nunca `supabase db reset --linked`.
- Git: branch `crm-banco-novo`; commit a cada tarefa; push e corte só com o ok do Kelwin. No dia do corte o Rafael troca as 3 variáveis na Vercel.
- Celular primeiro: tudo funciona a 360 px de largura, com alvo de toque de no mínimo 44×44 px.
- Next 16: antes de escrever código de app, ler o guia relevante em `crm/node_modules/next/dist/docs/` (regra do `crm/AGENTS.md`). `params` e `searchParams` são `Promise`.

## Review Focus

1. **Toque duplo ou rede lenta em "Enviei".** O vendedor toca duas vezes, ou a primeira resposta demora. Esperado: um evento só, a cota conta uma vez, e a segunda chamada responde "Esse passo já foi registrado ou não vale agora. Atualize a tela." Teste em pgTAP na Tarefa 5. O botão fica desabilitado enquanto a ação roda (Tarefa 9).
2. **Virada do dia no fuso de Brasília.** Uma abertura às 23:30 de Brasília é 02:30 UTC do dia seguinte e conta para o dia em que foi feita. Uma reserva feita às 23:50 vence à meia-noite de Brasília, não à meia-noite UTC. Testes em pgTAP nas Tarefas 2 e 4.
3. **`&`, `#`, `?`, acento, emoji ou quebra de linha no texto do `wa.me`** (por exemplo "Dog & Cat Pet Exemplo"). Esperado: o texto chega inteiro e `\n` vira `%0A`. Teste vitest na Tarefa 7.
4. **Vendedor desativado com a sessão ainda aberta.** Esperado: a ação seguinte é recusada com "Seu acesso foi desativado. Fale com o Kelwin." e as leituras voltam vazias. Testes em pgTAP nas Tarefas 2 e 4.
5. **Perfil sem curso ou sem nome.** Esperado: o texto nunca sai com `[curso]` cru. "Copiar" e "Abrir no WhatsApp" ficam bloqueados, com aviso para completar o perfil. Teste vitest na Tarefa 7, tela na Tarefa 9.

---

## Decisões do construtor (o que §10 do design deixou em aberto)

- **Expiração da reserva:** verificada na hora, dentro de `proximo_lead()` e de `minha_cota()`, que roda a cada abertura do Início. Sem `pg_cron`: a doc oficial não diz se ele existe no Free (https://supabase.com/docs/guides/cron/install), e ele pausaria junto com o projeto.
- **PDF da prévia:** link externo (`pdf_url`, https), sem Storage.
- **SMTP:** nenhum nesta etapa. O admin gera o link de convite ou de acesso (`auth.admin.generateLink`, que não envia e-mail) e manda pelo WhatsApp. A página `/auth/confirmar` troca o `token_hash` por sessão com `verifyOtp`. Com isso o limite de 2 e-mails por hora do SMTP embutido deixa de importar.
- **Modo demonstração sem banco:** sai. Saem `lib/leadsRaspados.ts`, `lib/leadsExemplo.ts` e `lib/funilExemplo.ts`. Sem credenciais, o app mostra um recado.
- **Redes e duplicados:** coluna `leads.grupo text`. Um lead só entra na fila se nenhum outro do mesmo grupo estiver reservado, em conversa ou encerrado.
- **Importador e convite:** por script na primeira entrega (`scripts/importar-leads.ts`, `scripts/importar-mensagens.ts`). O convite fica na tela de equipe. As funções de importação só podem ser executadas por `service_role`.
- **Pedido de prévia:** dispara pelo resultado "quer ver a prévia" (Tarefa 5). Anexar a prévia, enviar a prévia e o resto do funil ficam na Tarefa 10.
- **Fica para depois do corte (fora deste plano):** `/lista` completa e "criar lead à mão" para o admin, importador na tela, renovação, A/B.

## Mapa de arquivos

| Caminho (em `crm/`) | Responsabilidade | Tarefa |
|---|---|---|
| `supabase/config.toml`, `supabase/migrations/*.sql` | esquema, RLS, RPCs | 1–5, 10–12 |
| `supabase/tests/database/*.test.sql` | pgTAP por área | 2–7, 10–12 |
| `scripts/pgtap.ts` | executor de pgTAP sem Docker | 2 |
| `scripts/_ambiente.ts` | lê `.env.novo.local` e `.env.local` sem misturar | 1 |
| `scripts/importar-leads.ts`, `importar-mensagens.ts`, `convidar.ts`, `promover-admin.ts`, `teste-concorrencia.ts`, `limpar-exemplos.ts`, `migrar-dados.ts`, `backup.ps1` | operação | 4, 6–8, 12, 13 |
| `scripts/exemplos/*.json` | dados fictícios | 6, 7 |
| `lib/resultado.ts`, `lib/telefone.ts`, `lib/periodo.ts` | puros | 1, 6, 11 |
| `lib/importacao/converter.ts`, `lib/migracao/plano.ts` | puros | 6, 12 |
| `lib/mensagens/validar.ts`, `lib/mensagens/preencher.ts` | puros | 7 |
| `lib/fluxo/agora.ts`, `lib/fluxo/passos.ts` | puros | 9 |
| `lib/supabase/{servidor,cliente,admin}.ts`, `lib/supabase/database.types.ts` | clientes tipados | 3, 8 |
| `lib/dados/{sessao,vendedor,admin}.ts` | DAL `server-only` | 8, 9, 11 |
| `lib/convite.ts` | link de convite e de acesso | 8 |
| `app/(crm)/inicio`, `lead/[id]`, `conversas`, `funil`, `admin/**` | telas | 9–11 |
| `app/auth/confirmar/route.ts`, `app/definir-senha/` | entrada por convite | 8 |
| `tests/unit/*.test.ts` | vitest | 1, 6, 7, 9, 11, 12 |

---

### Tarefa 1: Branch, ferramentas e esqueleto do Supabase

**Files:**
- Modify: `crm/package.json`, `crm/.env.example`, `crm/tsconfig.json` (incluir `vitest.config.ts`)
- Create: `crm/vitest.config.ts`, `crm/supabase/config.toml` (via `supabase init`), `crm/scripts/_ambiente.ts`, `crm/lib/resultado.ts`
- Test: `crm/tests/unit/resultado.test.ts`

**Interfaces:**
- Produces: `type Resultado = { ok: true; recado: string } | { ok: false; erro: string }` e `traduzirErro(e: { code?: string; message?: string } | null | undefined): string` em `lib/resultado.ts`; `carregarAmbiente(arquivo?: string): { url: string; publicavel: string; secreta: string; ref: string; dbUrl: string | null }` e `lerAmbienteAntigo(): { url: string; serviceRole: string }` em `scripts/_ambiente.ts`. Os scripts npm estão listados no Passo 3.

- [ ] **Passo 1: Branch e documentos.** `git switch -c crm-banco-novo`. Antes de commitar os documentos de pesquisa, confira que não há telefone real: `git grep -nE "\(?[0-9]{2}\)? ?9?[0-9]{4}-[0-9]{4}" -- aprendizados/docs/crm-db aprendizados/docs/superpowers` (com os arquivos ainda não rastreados, use `grep -rnE` no lugar do `git grep`). Esperado: só números `(34) 90000-00XX`, ou nenhum. Faça o mesmo com e-mails (`[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}`). Esperado: só `@exemplo.com` ou endereços genéricos de documentação. Depois: `git add aprendizados/docs/crm-db aprendizados/docs/superpowers/specs/2026-10-26-crm-banco-novo-design.md aprendizados/docs/superpowers/plans/2026-10-28-crm-banco-novo.md && git commit -m "crm: design, pesquisas e plano do banco novo"`.

- [ ] **Passo 2: Docker ou remoto.** Rode `docker info`.
  - Se responder, siga o **caminho A** (local): `npx supabase start` e `npx supabase db reset` a cada migração, e pgTAP com `npx supabase test db`.
  - Se falhar ("failed to connect"), siga o **caminho B** (remoto): `npx supabase db push --dry-run` e depois `db push` no `vistra-crm`, ainda vazio, e pgTAP com `npm run db:testar`. Motivo: o `supabase test db` roda o `pg_prove` num container mesmo com `--linked` (https://github.com/supabase/cli/blob/develop/apps/cli/src/commands/test/db/SIDE_EFFECTS.md).
  - O caminho B só vale **até a Tarefa 14 gravar dados reais**. Depois disso, o pgTAP roda só no caminho A.
  - Anote no resumo da tarefa qual caminho foi usado.

- [ ] **Passo 3: Dependências e scripts.**
  - `npm i libphonenumber-js@^1.13.15 server-only@^0.0.1`
  - `npm i -D supabase@2.122.0 vitest@^5.0.5 tsx@^4.23.15 postgres@^3.4.9`
  - Em `package.json`, mantenha `dev`, `build` e `start` e acrescente:
    - `"dev:novo": "node --env-file=.env.novo.local node_modules/next/dist/bin/next dev -p 3000"`
    - `"build:novo": "node --env-file=.env.novo.local node_modules/next/dist/bin/next build"`
    - `"test": "vitest run"`
    - `"db:testar": "tsx scripts/pgtap.ts"`
    - `"db:tipos": "supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts"`
    - `"importar:leads": "tsx scripts/importar-leads.ts"`
    - `"importar:mensagens": "tsx scripts/importar-mensagens.ts"`
    - `"convidar": "tsx scripts/convidar.ts"`
    - `"migrar": "tsx scripts/migrar-dados.ts"`
  - Por que funciona: o `process.env` vence os arquivos `.env*` no Next, então o `.env.novo.local` passado por `--env-file` tem precedência sobre o `.env.local` antigo.
  - Rode `npm run db:tipos` pelo `npm`, não com o `>` do PowerShell 5, que grava em UTF-16.

- [ ] **Passo 4: `npx supabase init`** dentro de `crm/`. O `config.toml` fica com:
  - `[db] major_version = 17`
  - `[auth] site_url = "http://localhost:3000"`, `additional_redirect_urls = ["http://localhost:3000/**"]` e `enable_signup = false`
  - `[auth.email] enable_signup = false`
  - Os arquivos antigos `supabase/schema.sql` e `migracao-00x.sql` ficam até a Tarefa 9, que os apaga.

- [ ] **Passo 5: Ligar o projeto remoto** (o Kelwin faz, uma vez só).
  1. `npx supabase login` (pelo navegador; o token fica no perfil, fora do repo).
  2. `npx supabase link --project-ref <SUPABASE_PROJECT_REF> -p <SUPABASE_DB_PASSWORD>`.
  3. No Dashboard → Authentication, desligue "Allow new users to sign up". Site URL `https://vistracrm.vercel.app`. Redirect URLs `http://localhost:3000/**` e `https://vistracrm.vercel.app/**`.
  4. Acrescente a `crm/.env.novo.local` a variável `SUPABASE_DB_URL`, com a string do **Session pooler** (Dashboard → Connect). A conexão direta do Free é só IPv6.

- [ ] **Passo 6: `.env.example`** passa a listar só os nomes novos, sem valores:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_URL`
  - Comentário: a secreta ignora o RLS e nunca leva `NEXT_PUBLIC_`.
  - Confira com `git check-ignore crm/.env.novo.local` que o arquivo é ignorado. Esperado: imprime o caminho.

- [ ] **Passo 7: Teste que falha.** Em `tests/unit/resultado.test.ts`:
  - `traduzirErro({ code: "P0001", message: "Você já abriu 5 conversas hoje. A cota volta amanhã." })` devolve a própria frase;
  - `traduzirErro({ code: "42501", message: "permission denied for table leads" })` devolve `"Você não tem permissão para isso."`;
  - `traduzirErro({ code: "PGRST301", message: "JWT expired" })` devolve `"Sessão expirada. Entre de novo para continuar."`;
  - `traduzirErro(null)` devolve `"Não deu para falar com o banco. Tente de novo."`;
  - qualquer outro caso devolve `"Não deu para falar com o banco: <message>"`.

- [ ] **Passo 8:** `npm test`. Esperado: FAIL (módulo inexistente).

- [ ] **Passo 9: Implementar** `lib/resultado.ts` e `scripts/_ambiente.ts`.
  - O `_ambiente.ts` usa `util.parseEnv(fs.readFileSync(arquivo, "utf8"))` e **não** escreve em `process.env`.
  - Por padrão lê `crm/.env.novo.local`. `lerAmbienteAntigo` lê `crm/.env.local` e devolve `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
  - Variável faltando gera erro com o nome dela.
  - `vitest.config.ts`: `resolve: { tsconfigPaths: true }` e `test.include: ["tests/unit/**/*.test.ts"]`.

- [ ] **Passo 10:** `npm test` e `npx supabase --version`. Esperado: PASS (5 testes) e `2.122.0`.

- [ ] **Passo 11: Commit.** `git add crm/package.json crm/package-lock.json crm/vitest.config.ts crm/tsconfig.json crm/.env.example crm/supabase/config.toml crm/supabase/.gitignore crm/scripts/_ambiente.ts crm/lib/resultado.ts crm/tests && git commit -m "crm: ferramentas do banco novo (CLI, vitest, tsx) e tradução de erros"`

---

### Tarefa 2: Migração base — privilégios, pessoas, domínios e ajudantes de teste

**Files:**
- Create: `crm/supabase/migrations/<ts>_base.sql` e `crm/supabase/migrations/<ts>_testes.sql` (os dois por `npx supabase migration new base` e `npx supabase migration new testes`)
- Create: `crm/scripts/pgtap.ts`, `crm/supabase/tests/database/010_seguranca.test.sql`

**Interfaces:**
- Produces, em tabelas:
  - `perfis(id uuid pk → auth.users on delete cascade, nome text, curso text, artigo text 'o'|'a', email text, papel text 'vendedor'|'admin', ativo bool, cota_diaria int 0..50 default 5, comissao_pct numeric(5,2) null, ultimo_acesso_em timestamptz, criado_em)`
  - `cidades(id uuid, nome, uf char(2), ativa bool, unique(nome, uf))`
  - `nichos(id uuid, nome text unique, clinica bool, template_site text, conselho text, dor text, transformacao text, ativo bool)`
  - `etapas_funil(slug text pk, nome, posicao smallint unique, terminal bool)`
  - `configuracao(id bool pk check (id), preco_tabela numeric(10,2), piso_referencia, comissao_pct numeric(5,2), cota_padrao int, dias_acompanhamento int, dias_alerta_parado int, atualizado_em)`
- Produces, em funções:
  - `private.eu_admin() returns boolean` e `private.eu_ativo() returns boolean`, os dois `stable security definer`;
  - `private.exigir_ativo() returns uuid`, que devolve `auth.uid()` ou levanta "Seu acesso foi desativado. Fale com o Kelwin." ("Entre de novo para continuar." quando não há sessão);
  - `private.inicio_do_dia(timestamptz) returns timestamptz` (meia-noite de `America/Sao_Paulo`);
  - `private.somar_dias_uteis(timestamptz, int) returns timestamptz` (segunda a sexta, sem feriados);
  - `private.dias_uteis_entre(timestamptz, timestamptz) returns int` (dias úteis d com data(a) < d ≤ data(b), em Brasília).
- Produces, para os testes: `testes.criar_usuario(p_email text, p_nome text, p_papel text default 'vendedor') returns uuid` e `testes.entrar_como(p_id uuid) returns void`. O `entrar_como` faz `set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)` e `set_config('role', 'authenticated', true)`. Para voltar a `postgres`, o teste usa `reset role;`.
- Produces: `npm run db:testar [-- --db-url <url>]`. Sem `--db-url`, usa `SUPABASE_DB_URL`.

- [ ] **Passo 1: Teste que falha** (`010_seguranca.test.sql`, entre `begin;`, `select plan(N);` e `select * from finish(); rollback;`). Asserções:
  - `is((select count(*) from pg_tables where schemaname='public' and not rowsecurity), 0::bigint, 'RLS em toda tabela')`
  - `is((select count(*) from information_schema.role_table_grants where grantee='anon' and table_schema='public'), 0::bigint, 'anon sem grant')`
  - `is((select count(*) from information_schema.routine_privileges where grantee in ('anon','PUBLIC') and routine_schema in ('public','private')), 0::bigint, 'funções fechadas para anon')`
  - Usuário criado com `raw_user_meta_data = {"nome":"Ana Exemplo","curso":"Engenharia","papel":"admin"}` nasce com perfil `nome='Ana Exemplo'`, `curso='Engenharia'` e `papel='vendedor'` (o metadata não promove).
  - Como vendedor: `is((select count(*) from perfis), 1::bigint)`. Como admin: vê os 2.
  - Como vendedor: `throws_ok($$insert into public.perfis(id) values (gen_random_uuid())$$, '42501')` e o mesmo para `update public.configuracao set cota_padrao = 9`.
  - Vendedor com `ativo=false` (atualizado como postgres): `is((select count(*) from perfis), 0::bigint)` e `is((select count(*) from cidades), 0::bigint)`.
  - `is(private.inicio_do_dia('2026-10-29 02:30+00'), '2026-10-28 00:00-03'::timestamptz)` (Review Focus 2).
  - `is(private.somar_dias_uteis('2026-11-06 10:00-03', 2), '2026-11-10 10:00-03'::timestamptz)` (sexta + 2 = terça) e `is(private.somar_dias_uteis('2026-11-07 10:00-03', 1), '2026-11-09 10:00-03'::timestamptz)` (sábado + 1 = segunda).
  - `is(private.dias_uteis_entre('2026-11-06 18:00-03', '2026-11-10 09:00-03'), 2)`.
  - `is((select count(*) from etapas_funil), 6::bigint)` e `is((select preco_tabela from configuracao), 497.00)`.

- [ ] **Passo 2:** rode o pgTAP (caminho A: `npx supabase test db`; caminho B: `npm run db:testar`). Esperado: FAIL (tabelas inexistentes). No caminho B, escreva primeiro o `scripts/pgtap.ts`:
  - conecta com `postgres(dbUrl, { max: 1 })`;
  - roda `create extension if not exists pgtap with schema extensions` e lembra se ela já existia;
  - para cada `supabase/tests/database/*.test.sql`, em ordem alfabética, executa `sql.unsafe(conteudo)` e imprime as linhas TAP de cada resultado;
  - falha (`process.exitCode = 1`) com qualquer `not ok` ou `# Looks like`;
  - no fim, `drop extension pgtap` se ela não existia antes.

- [ ] **Passo 3: Migração `base`.**
  - Abre com o endurecimento oficial: `alter default privileges for role postgres in schema public revoke all on tables|sequences|functions from anon, authenticated, service_role;` e `alter default privileges for role postgres revoke execute on functions from public;`.
  - `create schema private; grant usage on schema private to authenticated;`
  - Trigger `private.criar_perfil()` (`security definer`, `search_path ''`), `after insert on auth.users`. Grava `nome` (metadata `nome`, senão o e-mail antes do @), `curso` (metadata `curso`, senão `''`), `artigo` (metadata `artigo` se for `o` ou `a`, senão `'o'`) e `email`. Nunca lê papel.
  - Policies:
    - `perfis`: select com `id = (select auth.uid()) and (select private.eu_ativo())`, ou `(select private.eu_admin())`.
    - Domínios: select com `(select private.eu_ativo())`.
  - Grants: `grant select on <cada tabela> to authenticated; grant all on <cada tabela> to service_role;`. As funções que as policies chamam precisam de grant próprio, senão a policy falha: `grant execute on function private.eu_admin(), private.eu_ativo() to authenticated`.
  - Dados de domínio, que não são dados de lead:
    - etapas `previa_pedida`(1), `previa_pronta`(2), `previa_enviada`(3), `negociando`(4), `fechou`(5, terminal), `perdeu`(6, terminal);
    - a linha de `configuracao` com os valores das Global Constraints;
    - cidade `Uberlândia`/`MG` ativa;
    - nichos `Pet shop`, `Odontologia` (clínica, CFO 196/2019), `Estética` (clínica), `Veterinária` (clínica, CFMV 1.649/2025), com `dor` e `transformacao` vazias (preenchidas pelo importador de mensagens, Tarefa 7).

- [ ] **Passo 4: Migração `testes`.** `create schema testes` e as duas funções com `revoke execute ... from public, anon, authenticated`. O `criar_usuario` insere em `auth.users` (`id`, `email`, `raw_user_meta_data` com o nome, `aud`/`role` = `authenticated`) e, se o papel for admin, faz `update public.perfis set papel='admin'`.

- [ ] **Passo 5:** aplique as migrações. Caminho A: `npx supabase db reset`. Caminho B: `npx supabase db push --dry-run` (confira se lista só as 2 migrações) e depois `npx supabase db push`. Rode o pgTAP. Esperado: PASS em todas as asserções.

- [ ] **Passo 6: Advisors.** `npx supabase db advisors --linked --type all --level warn`. Esperado: nenhum ERROR e nenhum WARN. No caminho A, rode o mesmo comando depois do `db push` da Tarefa 3.

- [ ] **Passo 7: Commit.** `git add crm/supabase crm/scripts/pgtap.ts && git commit -m "crm/db: base com privilégios fechados, perfis, domínios e ajudantes de teste"`

---

### Tarefa 3: Migração dos leads e do que se sabe deles, com tipos gerados

**Files:**
- Create: `crm/supabase/migrations/<ts>_leads.sql`, `crm/supabase/migrations/<ts>_testes_leads.sql` (a nova função de teste; migração aplicada nunca é editada), `crm/supabase/tests/database/020_leads.test.sql`, `crm/lib/supabase/database.types.ts` (gerado)

**Interfaces:**
- Consumes: Tarefa 2 (`private.eu_admin`, `private.eu_ativo`, `testes.*`).
- Produces, a tabela `leads`:
  - Colunas: `id uuid`, `nome text not null`, `cidade_id uuid not null → cidades`, `nicho_id uuid → nichos`, `categoria`, `endereco`, `nota numeric(2,1) check 0..5`, `avaliacoes int check ≥0`, `instagram`, `seguidores int check ≥0`, `seguidores_em date`, `site`, `email`, `google_place_id text`, `origem_id text`, `prioridade smallint check 1..4`, `gancho`, `grupo text`.
  - Estado e passo: `estado text check in ('no_poco','reservado','em_conversa','encerrado','descartado','verificar') default 'no_poco'` e `passo text check in ('abertura','quem_respondeu','robo','acompanhamento','principal','resultado')`.
  - Datas da conversa: `dono_id uuid → perfis`, `reservado_em`, `abertura_enviada_em`, `principal_enviada_em`, `acompanhamento_enviado_em`, `proximo_passo_em`.
  - Funil e fim: `etapa text → etapas_funil`, `etapa_desde`, `ultima_atividade_em`, `veredito_atual text`, `motivo_fim text check in ('sem_interesse','sem_resposta','pediu_parar','venda','perdeu','tem_site','lead_fraco','fechado','duplicado','fora_do_nicho','outro')`, `fim_em`, `fim_por uuid → perfis`, `criado_em`, `atualizado_em`.
  - CHECKs:
    - `estado in ('reservado','em_conversa') ⇒ dono_id is not null`;
    - `estado in ('no_poco','verificar') ⇒ dono_id is null and passo is null and etapa is null`;
    - `estado='reservado' ⇒ passo='abertura' and reservado_em is not null`;
    - `estado='em_conversa' ⇒ abertura_enviada_em is not null`;
    - `etapa is not null ⇒ estado in ('em_conversa','encerrado')`;
    - `estado in ('encerrado','descartado') ⇒ motivo_fim is not null`.
  - Índices:
    - `unique (google_place_id) where google_place_id is not null`;
    - `unique (dono_id) where estado='reservado'` (um lead reservado por vendedor);
    - fila `(prioridade nulls last, nota desc nulls last, avaliacoes desc nulls last, criado_em) where estado='no_poco'`;
    - `dono_id`, `cidade_id`, `nicho_id`, `etapa`, `grupo`.
- Produces, as tabelas ao redor do lead:
  - `telefones_lead(id bigint identity, lead_id → leads, e164 text check (e164 ~ '^\+[1-9][0-9]{7,14}$'), tipo text check in ('fixo','celular','whatsapp'), origem text, principal bool, invalido_em timestamptz, criado_em, unique(lead_id, e164))`, com índice em `e164`.
  - `verificacoes_site(id bigint identity, lead_id, veredito text check in ('PODE_ABORDAR','SITE_QUEBRADO','TEM_SITE','FECHADO','DESCARTE_LEAD_FRACO','DUVIDA'), evidencias jsonb default '[]', verificado_em timestamptz, ferramenta text, criado_em)`. O trigger `after insert` põe em `leads.veredito_atual` o veredito com o maior `verificado_em`.
  - `modelos_mensagem(id bigint identity, nicho_id null = todos, tipo text check in ('abertura','robo','acompanhamento','preco'), rotulo text default '', texto text, ativo bool, autor_id, criado_em)`.
  - `mensagens_lead(id bigint identity, lead_id, versao int, partes text[] check (array_length(partes,1) between 2 and 3) check (char_length(array_to_string(partes,'')) <= 650), status text check in ('rascunho','aprovada','substituida'), modelo text, observacao text, autor_id, criado_em, aprovada_em, unique(lead_id, versao))`, com `unique (lead_id) where status='aprovada'`.
  - `contatos(id uuid, lead_id, nome, cargo, telefone_e164, criado_por, criado_em)`.
  - `bloqueios(id bigint identity, telefone_e164 text, google_place_id text, motivo text check in ('pediu_parar','cliente','descarte'), origem text, lead_id null, criado_por null, criado_em, check (telefone_e164 is not null or google_place_id is not null))`, com `unique (telefone_e164) where telefone_e164 is not null` e o mesmo para `google_place_id`.
  - `eventos_lead(id bigint identity, lead_id not null, autor_id → perfis null (null = sistema), tipo text check in ('recebeu','abertura_enviada','numero_errado','robo','pessoa_respondeu','sem_resposta','acompanhamento_enviado','principal_enviada','perguntou','sem_interesse','previa_pedida','previa_pronta','previa_enviada','etapa','venda','largou','descartou','bloqueou','reserva_venceu','reatribuido','importado','migrado','contato'), dados jsonb default '{}', mensagem_id bigint → mensagens_lead null, criado_em)`, com índices `(lead_id, criado_em desc)`, `(autor_id, tipo, criado_em)` e `(mensagem_id)`.
  - Nenhuma FK tem `on delete cascade` nem `set null`: lead e perfil nunca somem por cascata.
- Produces, para os testes: `testes.criar_lead_pronto(p_nome text, p_fone text, p_prioridade int default 2, p_nota numeric default 4.5, p_avaliacoes int default 50) returns uuid`. Ele cria (se faltar) a cidade `Cidade Exemplo`/`EX` ativa e o nicho `Nicho Exemplo` ativo; insere o lead, o telefone `whatsapp` principal, a verificação `PODE_ABORDAR`, a mensagem aprovada (3 partes curtas) e um modelo `abertura` geral (`Olá [saudacao]`).
- Produces: `lib/supabase/database.types.ts`.

- [ ] **Passo 1: Teste que falha** (`020_leads.test.sql`). Crie v1, v2 e admin. Crie L1 (`criar_lead_pronto('Pet Exemplo 01','+5534900000001')`) e L2. Ponha L1 com `dono_id=v1, estado='em_conversa', passo='quem_respondeu', abertura_enviada_em=now()`.
  - Como v1: `is((select count(*) from leads), 1::bigint)` e o mesmo para `telefones_lead`, `mensagens_lead` e `verificacoes_site` (só os de L1).
  - Como v2: `is((select count(*) from leads), 0::bigint)`. Como admin: `2`.
  - Como v1: `throws_ok($$update public.leads set nome='x'$$, '42501')`, e também para `insert into public.eventos_lead(...)` e `delete from public.eventos_lead`. Com um bloqueio inserido como postgres, `is((select count(*) from bloqueios), 0::bigint)` para v1 e `1` para o admin.
  - Como postgres:
    - `throws_ok($$update public.leads set estado='reservado', passo=null where id=<L2>$$, '23514')`;
    - `throws_ok($$update public.leads set nota=5.5 where id=<L2>$$, '23514')`;
    - uma segunda mensagem `aprovada` para L1 dá `23505`;
    - inserir `verificacoes_site` com `TEM_SITE` e `verificado_em` mais novo faz `veredito_atual='TEM_SITE'`.

- [ ] **Passo 2:** rode o pgTAP. Esperado: FAIL.

- [ ] **Passo 3: Implementar a migração `leads` e a `testes_leads`.**
  - Policies de select: `leads` com `(dono_id = (select auth.uid()) and (select private.eu_ativo())) or (select private.eu_admin())`.
  - As tabelas filhas usam `lead_id in (select l.id from public.leads l where l.dono_id = (select auth.uid())) and (select private.eu_ativo())` `or (select private.eu_admin())`.
  - `modelos_mensagem` libera select para qualquer ativo. `bloqueios` só para o admin.
  - Grants: só `select` para `authenticated`, `all` para `service_role`.

- [ ] **Passo 4:** aplique (A: `db reset`; B: `db push --dry-run`, depois `db push`) e rode o pgTAP. Esperado: PASS.

- [ ] **Passo 5: Tipos.** `npm run db:tipos` (no caminho A, `npx supabase gen types typescript --local --schema public > lib/supabase/database.types.ts`, rodado por `cmd`/`npm`). Esperado: o arquivo tem `leads:`, `eventos_lead:` e `mensagens_lead:`.

- [ ] **Passo 6:** `npx supabase db advisors --linked --type all --level warn`. Esperado: nenhum ERROR. `0001_unindexed_foreign_keys` não pode aparecer.

- [ ] **Passo 7: Commit.** `git add crm/supabase crm/lib/supabase/database.types.ts && git commit -m "crm/db: leads, telefones, verificações, mensagens, bloqueios e eventos com RLS de dono"`

---

### Tarefa 4: Fila com cota — `proximo_lead`, `largar_lead`, `minha_cota`

**Files:**
- Create: `crm/supabase/migrations/<ts>_fila.sql`, `crm/supabase/tests/database/030_fila.test.sql`, `crm/scripts/teste-concorrencia.ts`, `crm/scripts/limpar-exemplos.ts`

**Interfaces:**
- Consumes: Tarefas 2 e 3.
- Produces, as funções privadas:
  - `private.lead_pronto(p_lead_id uuid) returns boolean`;
  - `private.telefone_atual(p_lead_id uuid) returns public.telefones_lead` (o primeiro `whatsapp` sem `invalido_em` e fora de `bloqueios`, com o `principal` na frente);
  - `private.registrar_evento(p_lead uuid, p_autor uuid, p_tipo text, p_dados jsonb default '{}', p_mensagem bigint default null) returns void`;
  - `private.liberar_reservas_vencidas() returns int`.
- Produces, as RPCs públicas `security definer`, com execute para `authenticated`:
  - `proximo_lead() returns uuid`;
  - `largar_lead(p_lead_id uuid, p_motivo text) returns void`, com `p_motivo` entre `tem_site`, `fechado`, `fora_do_nicho` e `outro`;
  - `minha_cota() returns table(abertas_hoje int, cota int)`;
  - `marcar_acesso() returns void`, que só grava se `ultimo_acesso_em` tiver mais de 10 minutos.
- Produces: `npm run` não muda; os scripts rodam com `npx tsx scripts/teste-concorrencia.ts` e `npx tsx scripts/limpar-exemplos.ts [--gravar]`.

Regras que o `lead_pronto` exige, todas juntas:
- `estado='no_poco'`;
- `veredito_atual in ('PODE_ABORDAR','SITE_QUEBRADO')` (§12.8);
- `telefone_atual` não nulo;
- existe `mensagens_lead` aprovada;
- existe modelo `abertura` ativo do nicho ou geral;
- nenhum telefone do lead nem o place id em `bloqueios`;
- cidade ativa;
- nicho nulo ou ativo;
- nenhum outro lead do mesmo `grupo` com estado `reservado`, `em_conversa` ou `encerrado`.

O que o `proximo_lead` faz, em ordem:
1. `private.exigir_ativo()`.
2. `liberar_reservas_vencidas()`. Reserva com `reservado_em < inicio_do_dia(now())` volta para `no_poco` (dono, passo e `reservado_em` nulos) e grava o evento `reserva_venceu` com o autor = o antigo dono.
3. Se eu já tenho um lead `reservado`, devolve o id dele.
4. Conta meus eventos `abertura_enviada` com `criado_em >= inicio_do_dia(now())`. Se a conta for ≥ `cota_diaria`, levanta "Você já abriu {cota} conversas hoje. A cota volta amanhã."
5. `select id ... where lead_pronto(id)` e sem evento `largou` meu nesse lead, `order by prioridade asc nulls last, nota desc nulls last, avaliacoes desc nulls last, criado_em, id limit 1 for update skip locked`.
6. Se não achar nada, levanta "A fila está vazia agora. Avise o Kelwin."
7. `update` para `estado='reservado'`, `dono_id`, `reservado_em=now()`, `passo='abertura'`, mais o evento `recebeu`.

O `largar_lead` só vale com o lead `reservado` e meu. Depois da abertura, levanta "Depois da abertura enviada o lead não volta para a fila." Com o motivo `outro`, o lead vai para `no_poco` e grava o evento `largou` (eu não recebo mais esse lead). Com os outros motivos, vai para `descartado`, com `motivo_fim=p_motivo` e o evento `descartou`.

- [ ] **Passo 1: Teste que falha** (`030_fila.test.sql`). Lead pronto por `testes.criar_lead_pronto`. Cada caso abaixo é uma asserção:
  - `ok(private.lead_pronto(L))` no lead pronto e `not ok` depois de cada mudança, uma por asserção: veredito `TEM_SITE`; veredito `DUVIDA`; só telefone `fixo`; WhatsApp com `invalido_em`; mensagem `rascunho` no lugar de aprovada; telefone em `bloqueios`; place id em `bloqueios`; cidade inativa; nicho inativo; irmão de `grupo` em `em_conversa`. E `ok` com `SITE_QUEBRADO`.
  - Ordem: com A (prioridade 2, nota 4,9), B (prioridade 1, nota 4,0), C (prioridade 1, nota 4,0, 90 avaliações) e D (prioridade 1, nota 4,0, 10 avaliações), v1, v2 e v3 recebem C, D e B, nessa ordem (`results_eq`).
  - Um por vez: chamar `proximo_lead()` duas vezes como v1 devolve o mesmo id.
  - Cota: com `cota_diaria=1` e um evento `abertura_enviada` de v1 com `criado_em = now()` (inserido como postgres), `throws_ok('select public.proximo_lead()', 'P0001', 'Você já abriu 1 conversas hoje. A cota volta amanhã.')`. Com o evento em `inicio_do_dia(now()) - interval '30 minutes'` (ontem, 23:30 em Brasília), a chamada passa (Review Focus 2).
  - Reserva vencida: com o `reservado_em` de v1 em `inicio_do_dia(now()) - interval '10 minutes'`, o `proximo_lead()` de v2 recebe esse lead, e existe evento `reserva_venceu`.
  - Largar: depois de `largar_lead(L,'outro')`, v1 não recebe L de novo e v2 recebe. Com L em `em_conversa`, `throws_ok(... 'Depois da abertura enviada o lead não volta para a fila.')`. Com `'tem_site'`, o lead fica `descartado` e `motivo_fim='tem_site'`.
  - Vendedor desativado: `throws_ok('select public.proximo_lead()', 'P0001', 'Seu acesso foi desativado. Fale com o Kelwin.')` (Review Focus 4).
  - Dois vendedores em sequência recebem ids diferentes. Como postgres, um segundo lead `reservado` para o mesmo dono dá `23505`.
  - `minha_cota()` de v1 devolve `(1, 1)` no cenário da cota.
  - Fila vazia: `throws_ok(..., 'A fila está vazia agora. Avise o Kelwin.')`.

- [ ] **Passo 2:** rode o pgTAP. Esperado: FAIL.

- [ ] **Passo 3: Implementar a migração `fila`.** Use `revoke execute ... from public, anon` e `grant execute ... to authenticated` nas 4 RPCs. Ponha um comentário no topo da migração: o lint 0029 (`authenticated_security_definer_function_executable`) é intencional, porque a escrita só passa por estas RPCs.

- [ ] **Passo 4:** aplique a migração e rode o pgTAP. Esperado: PASS.

- [ ] **Passo 5: Concorrência de verdade, com conexões separadas.** O pgTAP roda numa sessão só e não pega essa disputa. O `scripts/teste-concorrencia.ts`:
  1. Com a chave secreta, cria 6 usuários `concorrencia.01..06@exemplo.com` (`auth.admin.createUser` com senha aleatória e `email_confirm: true`).
  2. Insere direto nas tabelas, com a chave secreta, 3 leads prontos `Pet Shop Exemplo Conc 01..03` (`(34) 90000-0091..93`, `origem_id` `exemplo-conc-01..03`, cidade Uberlândia, nicho Pet shop): lead, telefone `whatsapp`, verificação `PODE_ABORDAR` e mensagem aprovada. Se não houver modelo de abertura geral ativo, cria um e lembra que criou.
  3. Faz `signInWithPassword` dos 6 e dispara `rpc('proximo_lead')` em `Promise.all`.
  4. Exige que nenhum id se repita entre os sucessos, que sucessos + recusas "A fila está vazia agora. Avise o Kelwin." = 6, e que os 3 leads `exemplo-conc-` estejam entre os sucessos. A conta vale também quando já há outros leads prontos no banco.
  5. Chama `limpar-exemplos --prefixo exemplo-conc- --emails concorrencia.` e apaga o modelo de abertura, se ele foi criado no passo 2.

  O `scripts/limpar-exemplos.ts [--prefixo exemplo-] [--emails <prefixo do e-mail>] [--gravar]`:
  1. Devolve à fila os leads reservados pelos usuários do filtro e apaga os eventos de autoria deles.
  2. Apaga, nesta ordem, `eventos_lead`, `mensagens_lead`, `telefones_lead`, `verificacoes_site`, `contatos`, `pedidos_previa` (se existir), `vendas` (se existir), `bloqueios` e `leads` com `origem_id like '<prefixo>%'`.
  3. Apaga os usuários `@exemplo.com` cujo e-mail começa com o prefixo (`auth.admin.deleteUser`). Sem `--emails`, apaga todos os `@exemplo.com`.

  Sem `--gravar`, só conta o que apagaria.
  - Run: `npx tsx scripts/teste-concorrencia.ts`. Esperado: `6 pedidos, 0 ids repetidos, 3 leads de concorrência entregues. OK`.
  - Run: `npx tsx scripts/limpar-exemplos.ts --prefixo exemplo-conc- --emails concorrencia.`. Esperado: `0 leads de exemplo, 0 usuários de exemplo`.

- [ ] **Passo 6:** advisors (`--level warn`). Esperado: só os WARN 0029 das RPCs comentadas.

- [ ] **Passo 7: Commit.** `git add crm/supabase crm/scripts/teste-concorrencia.ts crm/scripts/limpar-exemplos.ts && git commit -m "crm/db: fila Próximo lead com cota diária, reserva que vence e largar só antes da abertura"`

---

### Tarefa 5: Passos e resultado — `registrar_acao`

**Files:**
- Create: `crm/supabase/migrations/<ts>_passos.sql` e `crm/supabase/tests/database/040_passos.test.sql`

**Interfaces:**
- Consumes: Tarefa 4 (`private.telefone_atual`, `private.registrar_evento`, `private.exigir_ativo`).
- Produces:
  - Tabela `pedidos_previa(id uuid, lead_id, vendedor_id → perfis, status text check in ('pendente','pronta','enviada'), pedido_em, site_url text, pdf_url text, pronta_em, pronta_por, enviada_em)`, com `unique (lead_id) where status <> 'enviada'`. Policy de select pelo lead (dono ou admin).
  - `registrar_acao(p_lead_id uuid, p_acao text, p_mensagem_id bigint default null) returns text`. Devolve um recado opcional (`null` no caminho normal).
  - `private.bloquear_lead(p_lead_id uuid, p_motivo text, p_autor uuid) returns void`: insere em `bloqueios` cada telefone e o place id, com `on conflict do nothing`.

Tabela de transições. Valem para todas as linhas:
- o lead é meu (`dono_id = auth.uid()`) e eu estou ativo;
- toda ação grava `ultima_atividade_em = now()` e o evento da coluna da direita;
- se a ação não vale no passo atual: "Esse passo já foi registrado ou não vale agora. Atualize a tela.";
- se o lead não é meu: "Esse lead não está com você."

| `p_acao` | Vale quando | Efeito | Evento |
|---|---|---|---|
| `abertura_enviada` | `passo='abertura'` (estado `reservado`, ou `em_conversa` depois de um número errado; nesse segundo caso a abertura para o outro número conta de novo na cota) | `estado='em_conversa'`, `passo='quem_respondeu'`, `abertura_enviada_em=now()`. Se o `telefone_atual` estiver em `bloqueios`: `estado='descartado'`, `motivo_fim='pediu_parar'`, sem evento de abertura, e devolve "Esse número pediu para não ser chamado. O lead saiu da sua lista." | `abertura_enviada {telefone_id}` |
| `numero_errado` | `passo in ('abertura','quem_respondeu')` | o telefone atual ganha `invalido_em`. Se sobra outro WhatsApp válido: `passo='abertura'`, e o estado não muda. Se não sobra: `estado='verificar'`, com dono, passo e `reservado_em` nulos | `numero_errado {telefone_id}` |
| `robo` | `passo='quem_respondeu'` | `passo='robo'` | `robo` |
| `pessoa` | `passo in ('quem_respondeu','robo')` | `passo = case when principal_enviada_em is null then 'principal' else 'resultado' end` | `pessoa_respondeu` |
| `sem_resposta` | `passo in ('quem_respondeu','robo','resultado')` | com `acompanhamento_enviado_em` nulo: `passo='acompanhamento'` e `proximo_passo_em = somar_dias_uteis(now(), dias_acompanhamento)`. Senão: `estado='encerrado'`, `motivo_fim='sem_resposta'`, `passo=null` | `sem_resposta` |
| `acompanhamento_enviado` | `passo='acompanhamento'` e `proximo_passo_em <= now()`. Antes do prazo, levanta "O acompanhamento é só a partir de dd/mm." | `acompanhamento_enviado_em=now()`, `proximo_passo_em=null`, e `passo` volta como em `pessoa` | `acompanhamento_enviado` |
| `principal_enviada` | `passo='principal'` e `p_mensagem_id` = a mensagem aprovada **deste** lead | `passo='resultado'`, `principal_enviada_em=now()` | `principal_enviada`, com `mensagem_id` |
| `perguntou` | `passo='resultado'` | nada | `perguntou` |
| `quer_previa` | `passo='resultado'` | `passo=null`, `etapa='previa_pedida'`, `etapa_desde=now()` e `insert pedidos_previa (status 'pendente')` | `previa_pedida` |
| `sem_interesse` | `estado='em_conversa'` e `passo is not null` | `estado='encerrado'`, `motivo_fim='sem_interesse'`, `passo=null` | `sem_interesse` |
| `pediu_parar` | `estado='em_conversa'` | `private.bloquear_lead(..., 'pediu_parar')`, `estado='encerrado'`, `motivo_fim='pediu_parar'`, `passo=null` e `etapa = case when etapa is not null then 'perdeu' end` | `bloqueou` |
| `previa_enviada` | `etapa='previa_pronta'` | `etapa='previa_enviada'`, `etapa_desde=now()`, pedido `enviada`, `enviada_em` | `previa_enviada` |

Mudar `passo` ou `etapa` também grava `fim_em` e `fim_por` quando o estado vai para `encerrado` ou `descartado`.

- [ ] **Passo 1: Teste que falha** (`040_passos.test.sql`). Lead L reservado por v1 via `proximo_lead()`:
  - `abertura_enviada` → `estado='em_conversa'`, `passo='quem_respondeu'`.
  - Uma segunda `abertura_enviada` dá `throws_ok(..., 'P0001', 'Esse passo já foi registrado ou não vale agora. Atualize a tela.')`, e `is((select count(*) from eventos_lead where lead_id=L and tipo='abertura_enviada'), 1::bigint)` (Review Focus 1).
  - `robo` → `pessoa` → `passo='principal'`. `principal_enviada` com a mensagem de **outro** lead dá erro. Com a mensagem certa, o evento tem `mensagem_id`.
  - `sem_resposta` → `passo='acompanhamento'`. Logo em seguida, `acompanhamento_enviado` dá erro "O acompanhamento é só a partir de". Com `proximo_passo_em` no passado (postgres), passa e `passo='resultado'`. Um novo `sem_resposta` leva a `estado='encerrado'`, `motivo_fim='sem_resposta'`.
  - `pediu_parar`, com um irmão L2 que tem o mesmo número: `bloqueios` passa a ter o e164 e o place id de L, e `not ok(private.lead_pronto(L2))`.
  - `numero_errado` em lead com dois WhatsApp fica em `passo='abertura'`, com o primeiro telefone `invalido_em is not null`. Com um WhatsApp só, fica `estado='verificar'` e `dono_id is null`.
  - Telefone bloqueado depois da reserva: `is(public.registrar_acao(L,'abertura_enviada'), 'Esse número pediu para não ser chamado. O lead saiu da sua lista.')` e o lead fica `descartado`.
  - `quer_previa` cria 1 `pedidos_previa` pendente e põe `etapa='previa_pedida'`.
  - v2 agindo no lead de v1: "Esse lead não está com você."

- [ ] **Passo 2:** rode o pgTAP. Esperado: FAIL.

- [ ] **Passo 3: Implementar.** Um único `case p_acao` dentro de `registrar_acao`, com `select ... for update` do lead no início (é isso que serializa o toque duplo). Grants como na Tarefa 4.

- [ ] **Passo 4:** aplique a migração, rode o pgTAP e depois `npm run db:tipos`. Esperado: PASS, e `registrar_acao` aparece em `Functions` nos tipos.

- [ ] **Passo 5: Commit.** `git add crm/supabase crm/lib/supabase/database.types.ts && git commit -m "crm/db: passos guiados e resultado em um toque, com bloqueio por pedido de parar"`

---

### Tarefa 6: Importador de leads idempotente

**Files:**
- Create: `crm/lib/telefone.ts`, `crm/lib/importacao/converter.ts`, `crm/scripts/importar-leads.ts`, `crm/scripts/exemplos/leads-exemplo.json`, `crm/supabase/migrations/<ts>_importacao.sql`, `crm/supabase/tests/database/050_importacao.test.sql`
- Delete: `crm/scripts/importar-leads.js`
- Test: `crm/tests/unit/telefone.test.ts`, `crm/tests/unit/converter.test.ts`

**Interfaces:**
- Produces, em `lib/telefone.ts`: `normalizarTelefone(bruto: string): { e164: string; tipo: "fixo" | "celular" } | null` (usa `libphonenumber-js/max`, região `BR`, `isValid()` e `getType()` `MOBILE` → `celular`, `FIXED_LINE` → `fixo`) e `digitosWhatsApp(e164: string): string` (o e164 sem o `+`).
- Produces, em `lib/importacao/converter.ts`:
  - `type Veredito = "PODE_ABORDAR" | "SITE_QUEBRADO" | "TEM_SITE" | "FECHADO" | "DESCARTE_LEAD_FRACO" | "DUVIDA"`
  - `type LeadImportado = { origem_id: string | null; google_place_id: string | null; nome: string; cidade: string; uf: string; nicho: string | null; categoria: string | null; endereco: string | null; nota: number | null; avaliacoes: number | null; instagram: string | null; seguidores: number | null; seguidores_em: string | null; site: string | null; email: string | null; gancho: string | null; prioridade: number | null; grupo: string | null; telefones: { e164: string; tipo: "fixo" | "celular" | "whatsapp"; origem: string; principal: boolean }[]; verificacao: { veredito: Veredito; evidencias: unknown[]; verificado_em: string; ferramenta: string } | null; estado_inicial: "no_poco" | "descartado"; motivo_fim: string | null }`
  - `converterLeadRaspado(cru: LeadRaspado, opcoes: { cidade: string; uf: string; verificadoEm: string }): { lead: LeadImportado | null; aviso: string | null }`. `LeadRaspado` tem as chaves de `novos-aprovados.json`: `id, nome, cat, tel, end, nota, aval, ig, seguidores, site, fechado, email, nicho, gancho, prioridade, veredito, placeId, ig_ultimo_post`.
  - Mapeamento: `nota "4,7"` → `4.7`; `aval` → inteiro; `tel` → `normalizarTelefone` com origem `google`; `placeId` → `google_place_id`; `id` → `origem_id`; `veredito` e `ig_ultimo_post` vão para a `verificacao`, com `ferramenta: "verificar_sem_site.py"`.
  - Telefone inválido gera aviso e o lead entra sem telefone.
- Produces: `importar_leads(p_autor uuid, p_itens jsonb) returns table(indice int, lead_id uuid, resultado text)`, executável **só por `service_role`**. `resultado` é um destes: `criado`, `atualizado`, `bloqueado`, `ja_descartado`, `invalido:<motivo>`.
- Produces: `npm run importar:leads -- --arquivo <json> --autor <email do admin> [--cidade Uberlândia --uf MG] [--gravar]`.

Regras do `importar_leads`, item a item, numa transação só:
1. Acha o lead existente pelo `google_place_id`. Se não achar, por algum `e164` igual de um lead **sem** place id, e então grava o place id.
2. Telefone ou place id em `bloqueios` → `bloqueado`. Não cria nem atualiza.
3. Existente em `descartado` ou `encerrado` → `ja_descartado`. Não muda o estado: o descartado nunca volta.
4. Existente: atualiza o enriquecimento (nota, avaliações, seguidores, gancho, prioridade, nicho). Acrescenta os telefones novos (`on conflict (lead_id, e164) do nothing`) e a verificação nova. Se estava em `verificar` e agora tem WhatsApp válido, volta para `no_poco`.
5. Novo: cria com `estado_inicial` e `motivo_fim`. Se outro lead já tem o mesmo `e164` (com place id diferente), os dois ganham o mesmo `grupo` (o grupo que já existia, senão `'tel:'||e164`).
6. Grava o evento `importado` com o autor `p_autor` e `{origem_id}`.
7. Cidade ou nicho por nome. Cidade desconhecida → `invalido:cidade`. Nicho desconhecido → `nicho_id` nulo, e o lead entra mesmo assim.

- [ ] **Passo 1: Testes que falham.**
  - `telefone.test.ts`:
    - `normalizarTelefone("(34) 90000-0001")` devolve `{ e164: "+5534900000001", tipo: "celular" }`;
    - `"34900000001"`, `"+55 34 90000-0001"` e `"034 90000 0001"` dão o mesmo e164;
    - `"(34) 3000-0007"` dá `{ e164: "+553430000007", tipo: "fixo" }`;
    - `"(34) 9000-0001"`, `"0001"` e `""` dão `null`;
    - `digitosWhatsApp("+5534900000001")` dá `"5534900000001"`.
  - `converter.test.ts`, com um `LeadRaspado` fictício (`Pet Shop Exemplo 01`, `placeId: "exemplo-place-01"`, `nota: "4,7"`, `aval: "120"`, `tel: "(34) 90000-0001"`, `veredito: "PODE_ABORDAR"`): `nota` 4.7, `avaliacoes` 120, `google_place_id` `exemplo-place-01`, telefone `celular` com origem `google` e `principal: true`, `verificacao.veredito` `PODE_ABORDAR` e `estado_inicial` `no_poco`. Com `tel: "123"`: `lead.telefones` vazio e `aviso` contendo "telefone inválido".

- [ ] **Passo 2:** `npm test`. Esperado: FAIL.

- [ ] **Passo 3: Implementar** `lib/telefone.ts` e `lib/importacao/converter.ts`. Os dois sem `server-only` e sem `@/`, para o `tsx` também carregar. Rode `npm test`. Esperado: PASS.

- [ ] **Passo 4: pgTAP que falha** (`050_importacao.test.sql`, como postgres com `set local role service_role`):
  - importar 2 itens dá `criado`, `criado`;
  - o mesmo lote de novo dá `atualizado`, `atualizado`, e `count(*)` de leads continua 2;
  - item sem place id com o mesmo e164 de um lead existente sem place id dá `atualizado`;
  - item com telefone em `bloqueios` dá `bloqueado`;
  - item de lead `descartado` dá `ja_descartado`, e o estado continua `descartado`;
  - lead em `verificar` mais um WhatsApp novo volta a `no_poco`;
  - como `authenticated`: `throws_ok('select * from public.importar_leads(...)', '42501')`.

- [ ] **Passo 5: Implementar a migração** (com `grant execute ... to service_role` e nada para `authenticated`). Aplique e rode o pgTAP. Esperado: PASS.

- [ ] **Passo 6: Script e exemplos.**
  - O `scripts/importar-leads.ts`:
    - lê o arquivo e converte;
    - sem `--gravar`, não toca no banco e só imprime contagens (convertidos, avisos, por veredito);
    - com `--gravar`, exige `--autor` e o resolve em id de perfil admin com a chave secreta;
    - com `--gravar`, chama a RPC em lotes de 100 e imprime a contagem por `resultado`;
    - nunca imprime telefone.
  - `leads-exemplo.json` traz 6 leads fictícios `Pet Shop Exemplo 01..06`:
    - `placeId` `exemplo-place-01..06` e `id` `exemplo-01..06`;
    - telefones `(34) 90000-0001..06`, menos o 06, que é `(34) 3000-0006` (fixo, para provar que fica fora da fila);
    - o 05 com `veredito: "SITE_QUEBRADO"`, os outros com `PODE_ABORDAR`.
  - Run: `npm run importar:leads -- --arquivo scripts/exemplos/leads-exemplo.json`. Esperado: `6 convertidos, 0 avisos` e nada gravado. O admin de exemplo nasce na Tarefa 8, e a gravação dos exemplos fica para a Tarefa 9.

- [ ] **Passo 7: Commit.** `git rm crm/scripts/importar-leads.js && git add crm/lib/telefone.ts crm/lib/importacao crm/scripts crm/supabase crm/tests && git commit -m "crm: importador idempotente por place id e telefone E.164, com bloqueios"`

---

### Tarefa 7: Mensagens — validador, preenchimento, link do WhatsApp e importação

**Files:**
- Create: `crm/lib/mensagens/validar.ts`, `crm/lib/mensagens/preencher.ts`, `crm/scripts/importar-mensagens.ts`, `crm/scripts/exemplos/mensagens-exemplo.json`, `crm/supabase/migrations/<ts>_mensagens.sql`, `crm/supabase/tests/database/060_mensagens.test.sql`
- Test: `crm/tests/unit/validar.test.ts`, `crm/tests/unit/preencher.test.ts`

**Interfaces:**
- Produces, em `lib/mensagens/validar.ts`: `validarMensagem(partes: string[], ctx: { nota: number | null; avaliacoes: number | null; clinica: boolean; dominioPermitido?: string | null }): string[]`. Devolve a lista de erros em português; vazia quer dizer aprovada. Constantes `LIMITE_CARACTERES = 650` e `FOLGA_PREENCHIMENTO = 40`. O total com os placeholders tem que ser ≤ 610, para caber nome e curso. Com `ctx.nota` ou `ctx.avaliacoes` nulos, a checagem correspondente é pulada.
- Produces, em `lib/mensagens/preencher.ts`:
  - `type Variaveis = { nome: string; curso: string; artigo: "o" | "a"; negocio: string; saudacao?: string }`
  - `preencher(texto: string, v: Variaveis): { texto: string; faltando: string[] }`. Troca `[nome]`, `[curso]`, `[negocio]` e `[saudacao]`, aceita também `[seu nome]` e `[seu curso]` dos geradores antigos, e troca `Sou o [nome]`/`sou o [nome]` pelo artigo do perfil. Valor vazio entra em `faltando`, e o placeholder fica no texto.
  - `saudacao(agora: Date): "bom dia" | "boa tarde" | "boa noite"`, pela hora de `America/Sao_Paulo`: antes das 12h, antes das 18h, e depois.
  - `linkWhatsApp(e164: string, texto: string): string` = `https://wa.me/${digitosWhatsApp(e164)}?text=${encodeURIComponent(texto)}`.
- Produces:
  - `importar_mensagens(p_autor uuid, p_itens jsonb) returns table(indice int, mensagem_id bigint, resultado text)`, com `resultado` entre `aprovada`, `lead_nao_encontrado` e `invalida:<motivo>`;
  - `importar_modelos(p_autor uuid, p_nichos jsonb, p_modelos jsonb) returns int`;
  - as duas só para `service_role`.
- Produces: o formato do arquivo local de mensagens, que os geradores fora do repo devem emitir:

```ts
type ArquivoMensagens = {
  gerado_em: string;            // ISO
  modelo: string;               // ex.: "modelo-novo-2026-11"; gravado em mensagens_lead.modelo
  nichos?: { nome: string; dor: string; transformacao: string }[];
  modelos?: { nicho: string | null; tipo: "abertura" | "robo" | "acompanhamento" | "preco"; rotulo?: string; texto: string }[];
  mensagens: {
    lead: { google_place_id?: string; telefone?: string; origem_id?: string }; // ao menos um
    partes: string[];                                                       // 2 ou 3, com [nome] e [curso]
    whatsapp?: { numero: string; origem: string };                         // ex.: "bio do Instagram"
    observacao?: string;
  }[];
};
```

- Produces: `npm run importar:mensagens -- --arquivo <json> --autor <email> [--gravar]`.

Regras do `importar_mensagens`, item a item:
- acha o lead por place id, depois por `origem_id`, depois por e164;
- a aprovada anterior vira `substituida`;
- insere a nova versão (`versao = max+1`), `aprovada`, com `aprovada_em=now()`;
- `whatsapp` cria ou marca o telefone com `tipo='whatsapp'` e `principal=true` (os outros perdem o `principal`). Se o lead estava em `verificar`, volta para `no_poco`.

O `importar_modelos` atualiza `nichos.dor` e `nichos.transformacao` pelo nome, desativa os modelos ativos do mesmo `(nicho, tipo, rotulo)` e insere os novos.

- [ ] **Passo 1: Testes que falham.**
  - `validar.test.ts` parte de uma mensagem base de 3 partes que passa (`["que bom falar com você! Sou o [nome], estudo [curso] na UFU", "vi a nota 4,8 da Pet Shop Exemplo 01 no Google, com 120 avaliações. Parabéns!\nsó não achei um site de vocês. ...", "com um site, ...\nestou montando uma startup com uns amigos ... Posso te mandar?"]`, com `ctx { nota: 4.8, avaliacoes: 120, clinica: false }`) e cobre:
    - `[]` para a base;
    - "dois-pontos" quando aparece `:`;
    - "travessão" com `—` ou `–`;
    - "cita a Vistra" com `Vistra`, em qualquer caixa;
    - "link ou telefone" com `www.exemplo.com.br` ou `90000-0001`, menos o `dominioPermitido`;
    - "pontuação seguida de minúscula na mesma linha" com `Parabéns! só`;
    - "linha começa com maiúscula" quando a parte ou a linha começa maiúscula (exceto quando começa por `[`);
    - "somos da UFU";
    - "2 ou 3 partes" com 1 ou 4 partes;
    - "passa de 610 caracteres";
    - "nota diferente do dado" com `vi a nota 4,9`;
    - "avaliações diferentes do dado" com `130 avaliações`;
    - com `clinica: true`, "termo vedado para clínica" para `resultado`, `garant`, `antes e depois` e `mais pacientes`;
    - "falta [nome]" e "falta [curso]";
    - "a última parte termina com pergunta".
  - `preencher.test.ts`:
    - `preencher("Sou o [nome], estudo [curso] na UFU", { nome: "Ana Exemplo", curso: "Direito", artigo: "a", negocio: "x" }).texto` dá `"Sou a Ana Exemplo, estudo Direito na UFU"`;
    - `[seu nome]` funciona igual;
    - com `curso: ""`, `faltando` é `["curso"]` e o texto ainda contém `[curso]` (Review Focus 5);
    - `saudacao(new Date("2026-11-03T14:59:00Z"))` dá `"bom dia"` (11:59 em Brasília) e `"2026-11-03T15:00:00Z"` dá `"boa tarde"`;
    - `linkWhatsApp("+5534900000001", "Olá bom dia\nDog & Cat #1? ção 🐶")` é igual a `"https://wa.me/5534900000001?text=" + encodeURIComponent("Olá bom dia\nDog & Cat #1? ção 🐶")` e contém `%0A`, `%26`, `%23` e `%3F` (Review Focus 3).

- [ ] **Passo 2:** `npm test`. Esperado: FAIL.

- [ ] **Passo 3: Implementar** os dois módulos. As checagens de nota e avaliações formatam o número como o gerador formata: vírgula decimal, inteiro sem casa, milhar com ponto. Rode `npm test`. Esperado: PASS.

- [ ] **Passo 4: pgTAP que falha** (`060_mensagens.test.sql`, como `service_role`):
  - importar a mensagem de L duas vezes deixa a versão 1 `substituida` e a 2 `aprovada`, com `count(*) where status='aprovada'` = 1;
  - item com 4 partes dá `invalida:...`, sem exceção;
  - lead desconhecido dá `lead_nao_encontrado`;
  - `whatsapp` num lead que só tinha fixo cria o telefone `whatsapp` principal e põe `ok(private.lead_pronto(L))`;
  - `importar_modelos` com 2 modelos `robo` de rótulos diferentes deixa os 2 ativos;
  - reimportar o mesmo `(nicho, tipo, rotulo)` deixa 1 ativo.

- [ ] **Passo 5: Implementar a migração.** Aplique, rode o pgTAP (esperado: PASS) e depois `npm run db:tipos`.

- [ ] **Passo 6: Script e exemplo.**
  - O `scripts/importar-mensagens.ts`:
    - lê o arquivo;
    - busca nota, avaliações e nicho de cada lead, com a chave secreta. Lead que ainda não está no banco é validado sem a checagem de nota e avaliações e entra no relatório como "sem lead no banco";
    - roda `validarMensagem` e normaliza o `whatsapp.numero`;
    - item reprovado **não** é enviado, e aparece no relatório com o nome do negócio e os erros;
    - sem `--gravar`, só o relatório; com `--gravar`, chama `importar_modelos` e depois `importar_mensagens`.
  - `mensagens-exemplo.json` traz:
    - os modelos gerais `abertura` (`Olá [saudacao]`), `robo` (rótulos `menu` e `digite o assunto`, com os textos da skill `prospectar`), `acompanhamento` e `preco`;
    - mensagens para `exemplo-place-01..05`, no modelo do §7, com dados fictícios. O 06 fica sem mensagem, e por isso fora da fila. O campo `whatsapp` é provado no pgTAP do Passo 4.
  - Run: `npm run importar:mensagens -- --arquivo scripts/exemplos/mensagens-exemplo.json`. Esperado: `5 válidas, 0 reprovadas, 5 sem lead no banco`.

- [ ] **Passo 7: Commit.** `git add crm/lib/mensagens crm/scripts crm/supabase crm/lib/supabase/database.types.ts crm/tests && git commit -m "crm: mensagens por lead com versões, validador das regras do Kelwin e link wa.me"`

---

### Tarefa 8: App no banco novo — clientes, sessão, convite e entrada

**Files:**
- Modify: `crm/lib/supabase/servidor.ts`, `crm/lib/supabase/cliente.ts`, `crm/proxy.ts`, `crm/lib/auth.ts` (passa a ser `lib/dados/sessao.ts`; apague `lib/auth.ts` depois de trocar os imports), `crm/app/login/page.tsx`, `crm/app/login/FormularioLogin.tsx` (tira o link de cadastro), `crm/components/SessaoMenu.tsx`, `crm/app/page.tsx`, `crm/lib/tipos.ts`
- Create: `crm/lib/supabase/admin.ts`, `crm/lib/dados/sessao.ts`, `crm/lib/convite.ts`, `crm/app/auth/confirmar/route.ts`, `crm/app/definir-senha/page.tsx`, `crm/app/definir-senha/FormularioSenha.tsx`, `crm/app/definir-senha/acoes.ts`, `crm/scripts/convidar.ts`, `crm/scripts/promover-admin.ts`
- Delete: `crm/app/cadastro/`
- Test: `crm/tests/unit/convite.test.ts`

**Interfaces:**
- Consumes: `Database` de `lib/supabase/database.types.ts` e `Resultado`/`traduzirErro` da Tarefa 1.
- Produces, os clientes:
  - `criarClienteServidor(): Promise<SupabaseClient<Database>>` com `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
  - `criarCliente()` para o navegador, com a mesma chave;
  - `temCredenciais()`, `true` com URL e chave publicável;
  - `criarClienteAdmin(): SupabaseClient<Database>` em `lib/supabase/admin.ts`, com `import "server-only"`, `SUPABASE_SECRET_KEY` e `auth: { persistSession: false, autoRefreshToken: false }`.
- Produces, em `lib/dados/sessao.ts` (`server-only`):
  - `type Perfil = { id: string; nome: string; curso: string; artigo: "o" | "a"; email: string; papel: "vendedor" | "admin"; ativo: boolean; cota_diaria: number }`
  - `perfilAtual(): Promise<Perfil | null>`: `getClaims()` → `sub` → `perfis`. Perfil inativo ou ausente dá `null`.
  - `exigirPerfil(de?: string): Promise<Perfil>`, que redireciona para `/login?de=`.
  - `exigirAdmin(): Promise<Perfil>`, que redireciona o não admin para `/inicio`.
  - `abrirAcao(opcoes?: { admin?: boolean }): Promise<{ sb: SupabaseClient<Database>; perfil: Perfil } | { erro: string }>`.
- Produces, em `lib/convite.ts`:
  - `montarLinkConvite(base: string, tokenHash: string, tipo: "invite" | "recovery"): string` = `${base}/auth/confirmar?token_hash=...&type=...` (com `encodeURIComponent`);
  - `gerarConvite(admin: SupabaseClient, dados: { email: string; nome: string; curso: string; artigo: "o" | "a" }, base: string): Promise<{ link: string } | { erro: string }>`, que usa `auth.admin.generateLink({ type: "invite", email, options: { data: { nome, curso, artigo } } })` e monta o link a partir de `properties.hashed_token`;
  - `gerarLinkDeAcesso(admin, email, base)` com `type: "recovery"`.
- Produces: as rotas `/auth/confirmar` (GET, pública: `verifyOtp({ type, token_hash })` e redirect para `/definir-senha`; erro vai para `/login?erro=link`) e `/definir-senha` (a Server Action `definirSenha(senha)`, com mínimo de 8 caracteres e `auth.updateUser({ password })`, depois redirect para `/inicio`).

- [ ] **Passo 1:** leia `node_modules/next/dist/docs/01-app/02-guides/authentication.md`, `data-security.md` e `01-getting-started/15-route-handlers.md` e `16-proxy.md`.

- [ ] **Passo 2: Teste que falha** (`convite.test.ts`): `montarLinkConvite("https://vistracrm.vercel.app", "abc+/=", "invite")` dá `"https://vistracrm.vercel.app/auth/confirmar?token_hash=abc%2B%2F%3D&type=invite"`, e com `base` terminando em `/` não sai `//auth`. Rode `npm test`. Esperado: FAIL.

- [ ] **Passo 3: Implementar.**
  - `lib/convite.ts` sem `server-only`, porque o script também usa.
  - Clientes com os nomes novos.
  - `proxy.ts`:
    - lê `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
    - `ROTA_INICIO = "/inicio"`;
    - rotas públicas `/login` e `/auth/confirmar`;
    - sai a `/cadastro`.
  - `app/page.tsx` redireciona para `/inicio`.
  - `SessaoMenu` deixa de ler `user_metadata` e mostra `nome` e `papel` do `perfis`.
  - Sem credenciais, a `/login` explica quais variáveis faltam (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
  - Rode `npm test`. Esperado: PASS.

- [ ] **Passo 4: Scripts.**
  - `scripts/convidar.ts --email <e> --nome <n> --curso <c> [--artigo a] [--base http://localhost:3000]` imprime o link. O e-mail é o da própria pessoa: não imprima nada além do link.
  - `scripts/promover-admin.ts --email <e>` faz `update perfis set papel='admin'` com a chave secreta e imprime `admin: <nome>`.

- [ ] **Passo 5: Conferência.** `npx tsc --noEmit` e `npm run build:novo`. Esperado: sem erro de tipo e build concluído. No `grep -rn "ANON_KEY\|SERVICE_ROLE" app components lib proxy.ts`, esperado: nada.

- [ ] **Passo 6: Teste manual com usuários fictícios** (`npm run dev:novo`).
  1. `npm run convidar -- --email admin.exemplo@exemplo.com --nome "Admin Exemplo" --curso Administração` e depois `npx tsx scripts/promover-admin.ts --email admin.exemplo@exemplo.com`.
  2. Abra o link. Esperado: cai em `/definir-senha`; com a senha definida, cai em `/inicio` (404 até a Tarefa 9).
  3. Saia e entre pela `/login`.
  4. Convide `ana.exemplo@exemplo.com` (vendedora) e confira que `/admin` a manda para `/inicio`.
  5. Com o cadastro desligado no Dashboard, o convite funcionou. Se o `generateLink` recusar com o cadastro desligado, anote e pare: é uma decisão para o Kelwin.

- [ ] **Passo 7: Commit.** `git rm -r crm/app/cadastro crm/lib/auth.ts && git add crm/lib crm/app crm/proxy.ts crm/components/SessaoMenu.tsx crm/scripts crm/tests && git commit -m "crm: app nas chaves novas, entrada por convite e sessão por getClaims"`

---

### Tarefa 9: Telas do vendedor — Início, passos do lead e minhas conversas

**Files:**
- Create: `crm/lib/fluxo/agora.ts`, `crm/lib/fluxo/passos.ts`, `crm/lib/dados/vendedor.ts`, `crm/app/(crm)/inicio/page.tsx`, `crm/app/(crm)/inicio/inicio.module.css`, `crm/app/(crm)/lead/[id]/page.tsx`, `crm/app/(crm)/lead/[id]/lead.module.css`, `crm/app/(crm)/lead/acoes.ts`, `crm/app/(crm)/conversas/page.tsx`, `crm/components/PassosLead.tsx`, `crm/components/PassosLead.module.css`, `crm/components/BotaoCopiar.tsx`, `crm/components/BotaoCopiar.module.css`
- Modify: `crm/components/MenuLateral.tsx` e `.module.css` (portas por papel; abaixo de 640 px vira barra inferior), `crm/app/(crm)/crm.module.css`, `crm/app/(crm)/layout.tsx` (chama `marcar_acesso` e passa o papel ao menu), `crm/lib/tipos.ts`
- Delete: `crm/app/(crm)/leads/`, `crm/app/(crm)/lista/`, `crm/components/{TelaLeads,LeadsPoco,LeadLinha,LeadDesqualificar,QualificarModal,NovoLeadModal,PlacarEquipe,LeadModal}.*`, `crm/lib/{leadsExemplo,leadsRaspados}.ts`, `crm/supabase/schema.sql`, `crm/supabase/migracao-002-admin.sql`, `crm/supabase/migracao-003-raspagem.sql`
- Test: `crm/tests/unit/agora.test.ts`, `crm/tests/unit/passos.test.ts`

**Interfaces:**
- Consumes: RPCs das Tarefas 4 e 5, `preencher`/`saudacao`/`linkWhatsApp` da 7 e `abrirAcao`/`exigirPerfil` da 8.
- Produces, em `lib/fluxo/agora.ts`:
  - `type LeadConversa = { id: string; nome: string; nicho: string | null; passo: Passo | null; etapa: string | null; proximo_passo_em: string | null; ultima_atividade_em: string | null }`
  - `type ItemAgora = LeadConversa & { motivo: "previa_pronta" | "em_andamento" | "acompanhamento_vencido" }`
  - `classificarAgora(leads: LeadConversa[], agora: Date): ItemAgora[]`. As regras: `etapa='previa_pronta'` → `previa_pronta`; `passo in ('robo','principal','resultado')` → `em_andamento`; `passo='acompanhamento'` e `proximo_passo_em <= agora` → `acompanhamento_vencido`; o resto fica fora. A ordem é por motivo, nessa ordem, e dentro de cada motivo pela `ultima_atividade_em` mais antiga.
- Produces, em `lib/fluxo/passos.ts`:
  - `type Passo = "abertura" | "quem_respondeu" | "robo" | "acompanhamento" | "principal" | "resultado"`
  - `type Acao`, com os valores de `p_acao` da Tarefa 5
  - `botoesDoPasso(passo: Passo | null, etapa: string | null): { acao: Acao; rotulo: string; destaque: boolean; confirma?: string }[]`. Os rótulos vêm da tabela da Tarefa 5 e do §4.3 do design:
    - abertura: "Enviei a abertura" (destaque), "Número errado ou sem WhatsApp";
    - quem_respondeu: "Caiu no robô", "Falou uma pessoa" (destaque), "Ninguém respondeu";
    - resultado: "Quer ver a prévia" (destaque), "Perguntou outra coisa ou preço", "Não tem interesse", "Não respondeu", "Pediu para não chamar mais", este com `confirma: "Isso bloqueia este número para todo mundo. Confirmar?"`.
- Produces, em `lib/dados/vendedor.ts` (`server-only`):
  - `carregarInicio(): Promise<{ cota: { abertas: number; limite: number }; reservadoId: string | null; agora: ItemAgora[] }>`
  - `carregarLeadEmPasso(id: string): Promise<LeadEmPasso | null>`
  - `carregarConversas(): Promise<LeadConversa[]>`
  - `type LeadEmPasso = { lead: { id; nome; nicho; nota; avaliacoes; instagram; site; gancho; endereco; passo; etapa; estado; proximo_passo_em }; telefone: { e164: string; tipo: string } | null; abertura: string | null; robo: { rotulo: string; texto: string }[]; principal: { mensagemId: number; partes: string[] } | null; acompanhamento: string | null; preco: string | null; faltando: string[]; mesmoGrupo: string[] }`, com os textos já preenchidos com o perfil e a `saudacao(new Date())`.
- Produces, em `app/(crm)/lead/acoes.ts` (`"use server"`):
  - `pegarProximoLead(): Promise<Resultado>`: em caso de sucesso, faz `redirect('/lead/<id>')` fora do try.
  - `registrarAcao(leadId: string, acao: Acao, mensagemId?: number): Promise<Resultado>`
  - `largarLead(leadId: string, motivo: "tem_site" | "fechado" | "fora_do_nicho" | "outro"): Promise<Resultado>`
  - Todas usam `abrirAcao()`, `traduzirErro` e `revalidatePath('/inicio')`, e também `revalidatePath('/lead/<id>')` quando houver lead.

- [ ] **Passo 1:** leia `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` e `02-guides/forms.md`.

- [ ] **Passo 2: Testes que falham.**
  - `agora.test.ts`, com `agora = 2026-11-10T13:00:00Z`:
    - lead com `etapa:'previa_pronta'` vem primeiro;
    - `passo:'resultado'` vem em seguida;
    - `passo:'acompanhamento'` com `proximo_passo_em` `2026-11-10T12:00:00Z` entra como `acompanhamento_vencido`, e com `2026-11-11T12:00:00Z` não entra;
    - `passo:'quem_respondeu'` não entra;
    - dois `em_andamento` saem do mais parado para o menos parado.
  - `passos.test.ts`: `botoesDoPasso("abertura", null)[0]` dá `{ acao: "abertura_enviada", destaque: true }`; `botoesDoPasso(null, "previa_pronta")` contém `previa_enviada`; `botoesDoPasso("resultado", null)` tem `pediu_parar` com `confirma`.
  - Rode `npm test`. Esperado: FAIL.

- [ ] **Passo 3: Implementar** os dois módulos puros. Rode `npm test`. Esperado: PASS.

- [ ] **Passo 4: Telas.**
  - **Início** (`/inicio`):
    - mostra "Hoje você abriu X de Y";
    - a lista **Agora** linka para `/lead/<id>` e mostra o motivo em palavras;
    - o botão grande **Próximo lead** é um `<form action={pegarProximoLead}>`. Ele vira "Continuar o lead reservado" quando há `reservadoId`, e fica desabilitado com "A cota de hoje acabou" quando `abertas >= limite`.
  - **Lead** (`/lead/[id]`): `params` é `Promise<{ id: string }>`. O `PassosLead` (client) mostra:
    - a lista dos passos com o atual em destaque;
    - na abertura, um `<a href={linkWhatsApp(...)} target="_blank" rel="noopener">Abrir no WhatsApp</a>`;
    - no robô, cada resposta com `BotaoCopiar`;
    - na principal, "Copiar parte 1/3", "2/3" e "3/3", cada uma marcada quando copiada (estado local), mais "Mandei a mensagem principal";
    - no acompanhamento, o texto e a data ("a partir de dd/mm");
    - em "perguntou", o texto de preço;
    - nas prévias, o link do site e do PDF (`site_url`, `pdf_url`).
    - Cada ação roda com `useTransition`, e os botões ficam `disabled` enquanto `pending` (Review Focus 1).
    - Com `faltando.length > 0`, "Abrir no WhatsApp" e os "Copiar" ficam desabilitados, com o aviso "Complete seu nome e curso no perfil antes de mandar" (Review Focus 5).
    - "Largar" aparece só no passo `abertura`, com a escolha do motivo.
    - `mesmoGrupo` mostra "Mesma rede/telefone: …".
  - **BotaoCopiar**:
    - chama `navigator.clipboard.writeText(texto)` dentro do próprio `onClick`, que é o gesto que o Safari exige;
    - se der `NotAllowedError` ou a API não existir, cai num `<textarea readonly>` selecionado com `document.execCommand("copy")`;
    - mostra "Copiado" por 4 s.
  - **Minhas conversas** (`/conversas`): todos os meus leads `reservado` e `em_conversa`, agrupados por passo ou etapa.
  - **Menu**:
    - vendedor: Início, Minhas conversas, Funil;
    - admin, além disso: Painel, Sites para fazer, Vendas, Equipe e fila;
    - abaixo de 640 px, barra fixa inferior com ícone e rótulo curto e alvo de 44 px.
  - **Layout**: chama `rpc('marcar_acesso')` sem bloquear a tela, e o erro é ignorado.

- [ ] **Passo 5: Apagar o legado** listado em Files. Antes, confira com `grep -rn "LeadsPoco\|TelaLeads\|leadsRaspados\|leadsExemplo\|/lista\|/leads\"" app components lib`. Esperado depois: nada, menos o `funil` (Tarefa 10).

- [ ] **Passo 6: Conferência.** `npm test`, `npx tsc --noEmit` e `npm run build:novo`. Esperado: tudo verde. O `funil` antigo pode falhar no build: nesse caso, nesta tarefa, troque a página `/funil` por um recado "Funil em obras" e a Tarefa 10 a refaz.

- [ ] **Passo 7: Teste manual (fictício).**
  0. `npm run criar:dominio -- --nicho "Nicho Exemplo" --gravar`. Todo dado de exemplo (leads, modelos, dor e transformação) fica nesse nicho fictício: nenhum modelo geral e nenhum nicho real é tocado (revisão final, I5).
  1. `npm run importar:leads -- --arquivo scripts/exemplos/leads-exemplo.json --autor admin.exemplo@exemplo.com --gravar`.
  2. `npm run importar:mensagens -- --arquivo scripts/exemplos/mensagens-exemplo.json --autor admin.exemplo@exemplo.com --gravar`.
  3. Entre como Ana Exemplo, com o DevTools em 360 px.
  4. Próximo lead → Pet Shop Exemplo 01 (prioridade/nota). Enviei → Caiu no robô → Falou uma pessoa → copiar 3 partes → Mandei → Não respondeu. O lead aparece em Minhas conversas como acompanhamento em 2 dias úteis, e o Início mostra "1 de 5".
  5. Próximo lead de novo → 02. Largar com "outro" → o próximo não é o 02.
  6. O 06 nunca aparece: só tem fixo e não tem mensagem.

- [ ] **Passo 8: Commit.** `git add -A crm && git commit -m "crm: Início com cota e Agora, passos do lead com wa.me e copiar, minhas conversas"`

---

### Tarefa 10: Depois do "sim" — sites para fazer, prévia, funil e venda

**Files:**
- Create: `crm/supabase/migrations/<ts>_funil.sql`, `crm/supabase/tests/database/070_funil.test.sql`, `crm/app/(crm)/admin/previas/page.tsx`, `crm/app/(crm)/admin/acoes.ts`, `crm/components/FormVenda.tsx`, `crm/components/FormPrevia.tsx`
- Modify: `crm/app/(crm)/funil/page.tsx`, `crm/components/Kanban.tsx`, `crm/components/KanbanTipos.tsx`, `crm/components/KanbanColuna.tsx`, `crm/components/CartaoLead.tsx`, `crm/components/PainelLead.tsx`, `crm/app/(crm)/lead/acoes.ts`
- Delete: `crm/lib/funilExemplo.ts`

**Interfaces:**
- Consumes: `pedidos_previa` e `registrar_acao` (`quer_previa`, `previa_enviada`) da Tarefa 5.
- Produces, a tabela `vendas`:
  - Colunas: `id uuid`, `lead_id → leads unique`, `vendedor_id → perfis`, `valor numeric(10,2) check > 0`, `forma_pagamento text check in ('pix','boleto','cartao','dinheiro','outro')`, `fechado_em date`, `pago_em date`, `comissao_pct numeric(5,2) not null`, `comissao numeric(10,2) generated always as (round(valor * comissao_pct / 100, 2)) stored`, `repassado_em date`, `registrado_por`, `criado_em`.
  - Índices: `vendedor_id`, `lead_id`.
  - Policy de select: `vendedor_id = (select auth.uid())`, ou admin.
- Produces, as RPCs do vendedor:
  - `mover_etapa(p_lead_id uuid, p_etapa text) returns void`: de `previa_enviada` para `negociando`, e de `previa_pedida`, `previa_pronta`, `previa_enviada` ou `negociando` para `perdeu`, que encerra com `motivo_fim='perdeu'`. Cada mudança grava o evento `etapa {de, para}` e `etapa_desde`.
  - `registrar_venda(p_lead_id uuid, p_valor numeric, p_forma text, p_fechado_em date) returns uuid`:
    - só o dono, com etapa `previa_enviada` ou `negociando`;
    - `comissao_pct = coalesce(perfil.comissao_pct, configuracao.comissao_pct)`;
    - grava `etapa='fechou'`, `estado='encerrado'`, `motivo_fim='venda'` e o evento `venda`;
    - valor abaixo do piso passa sem aviso no banco (§13.3).
  - `salvar_contato(p_lead_id uuid, p_nome text, p_cargo text, p_telefone_e164 text) returns uuid`: grava o evento `contato` e é opcional (§12.1).
- Produces, as RPCs do admin:
  - `anexar_previa(p_pedido_id uuid, p_site_url text, p_pdf_url text) returns void`: as duas URLs `https://`; pedido `pronta`, `pronta_em`, `pronta_por`; lead `etapa='previa_pronta'`; evento `previa_pronta`.
  - `marcar_venda_paga(p_venda_id uuid, p_pago_em date)`.
  - `marcar_comissao_repassada(p_venda_id uuid, p_repassado_em date)`: exige `pago_em` preenchido.
- Produces, as Server Actions:
  - em `lead/acoes.ts`: `moverEtapa`, `registrarVenda` e `salvarContato`;
  - em `admin/acoes.ts`: `anexarPrevia`, `marcarVendaPaga` e `marcarComissaoRepassada`, todas com `abrirAcao({ admin: true })`.

- [ ] **Passo 1: pgTAP que falha** (`070_funil.test.sql`). L de v1 em `resultado` → `quer_previa`:
  - como admin, `anexar_previa` com `http://` dá erro "Use um link https.", e com `https://` põe `etapa='previa_pronta'`;
  - como v1: `previa_enviada` → `mover_etapa(L,'negociando')`;
  - `mover_etapa(L,'fechou')` dá erro "A venda se registra pelo botão Fechou.";
  - `registrar_venda(L, 350, 'pix', '2026-11-10')` dá `comissao = 175.00` e `comissao_pct = 50`;
  - com `configuracao.comissao_pct = 40` depois, a venda continua com 175.00;
  - como v2, `select count(*) from vendas` dá 0;
  - `marcar_comissao_repassada` antes de `pago_em` dá erro "Marque o pagamento antes do repasse.";
  - vendedor chamando `anexar_previa` dá "Só o admin pode fazer isso."

- [ ] **Passo 2:** rode o pgTAP. Esperado: FAIL. **Passo 3:** implemente a migração. Aplique, rode o pgTAP (esperado: PASS) e depois `npm run db:tipos`.

- [ ] **Passo 4: Telas.**
  - **Funil** (`/funil`):
    - as colunas vêm de `etapas_funil` (6 colunas), com os meus leads que têm `etapa`;
    - mover chama `moverEtapa` (Server Action), e não grava mais direto do navegador;
    - "Fechou" abre o `FormVenda`: valor pré-preenchido com 497, o piso 397 só como texto de referência, a forma e a data;
    - o relógio "parado há" usa `etapa_desde` e `ultima_atividade_em` (invariante 12, regras R19–R21 de `KanbanTipos.ts`);
    - o `PainelLead` mostra os eventos com rótulos em português para cada `tipo` da Tarefa 3.
  - **Sites para fazer** (`/admin/previas`):
    - lista os pedidos `pendente` com o tempo desde o pedido, o lead (nome, nicho, Instagram, site, gancho) e o vendedor, mais o `FormPrevia` (site e PDF);
    - abaixo, os pedidos `pronta`, aguardando o vendedor.

- [ ] **Passo 5: Conferência.** `npm test`, `npx tsc --noEmit` e `npm run build:novo`. Teste manual com fictícios: Ana leva o 03 até "Quer ver a prévia"; o admin anexa `https://exemplo.com/previa` e `https://exemplo.com/previa.pdf`; o 03 aparece no Agora da Ana como "prévia pronta"; ela envia, move para Negociando e fecha por 350. O funil mostra o 03 em Fechou.

- [ ] **Passo 6: Commit.** `git add -A crm && git commit -m "crm: sites para fazer, prévia pronta no Agora, funil por etapas e registro da venda"`

---

### Tarefa 11: Tela do dono e gestão — painel, equipe, fila e vendas

**Files:**
- Create: `crm/supabase/migrations/<ts>_painel.sql`, `crm/supabase/tests/database/080_painel.test.sql`, `crm/lib/periodo.ts`, `crm/lib/dados/admin.ts`, `crm/app/(crm)/admin/page.tsx`, `crm/app/(crm)/admin/admin.module.css`, `crm/app/(crm)/admin/equipe/page.tsx`, `crm/app/(crm)/admin/fila/page.tsx`, `crm/app/(crm)/admin/vendas/page.tsx`
- Modify: `crm/app/(crm)/admin/acoes.ts`
- Test: `crm/tests/unit/periodo.test.ts`

**Interfaces:**
- Produces: `painel_dono(p_desde timestamptz) returns table(vendedor_id uuid, nome text, ativo boolean, ultimo_acesso_em timestamptz, recebidos int, aberturas int, respostas_pessoa int, pedidos_previa int, vendas int, comissao_a_receber numeric, dias_sem_abertura int, parado boolean)`, só admin, uma linha por perfil. Como cada número sai:
  - recebidos, aberturas, respostas e pedidos: `count` de `eventos_lead` por `autor_id` e tipo (`recebeu`, `abertura_enviada`, `pessoa_respondeu`, `previa_pedida`), com `criado_em >= coalesce(p_desde, '-infinity')`. Os eventos `migrado` não contam.
  - vendas: `vendas.fechado_em >= p_desde`.
  - comissão a receber: soma de `comissao` com `pago_em` preenchido e `repassado_em` nulo, sem filtro de período (§12.5).
  - `dias_sem_abertura = private.dias_uteis_entre(coalesce(última abertura_enviada, perfil.criado_em), now())` e `parado = dias_sem_abertura >= configuracao.dias_alerta_parado`.
- Produces, as outras RPCs do admin:
  - `definir_vendedor(p_perfil_id uuid, p_ativo boolean, p_cota int) returns void`. Ao desativar: o lead `reservado` dele volta para `no_poco`; os de `em_conversa` passam para o admin que chamou, com o evento `reatribuido {de, para}` (§12.7).
  - `reatribuir_lead(p_lead_id uuid, p_novo_dono uuid) returns void`.
  - `definir_filtro_fila(p_tipo text ('cidade'|'nicho'), p_id uuid, p_ativo boolean) returns void`.
  - `resumo_fila() returns table(cidade text, nicho text, prontos int)`.
  - `atualizar_configuracao(p_preco numeric, p_piso numeric, p_comissao numeric, p_cota_padrao int, p_dias_acompanhamento int, p_dias_alerta int) returns void`.
  - `bloquear(p_telefone_e164 text, p_google_place_id text, p_motivo text) returns void`.
  - `descartar_lead(p_lead_id uuid, p_motivo text) returns void`.
- Produces, em `lib/periodo.ts`: `type Periodo = "hoje" | "semana" | "tudo"` e `inicioDoPeriodo(p: Periodo, agora: Date): Date | null`. É a meia-noite de Brasília de hoje, ou da segunda-feira desta semana, ou `null`.
- Produces, as Server Actions do admin: `convidarVendedor(dados)` e `gerarAcesso(email)`, que devolvem `{ ok: true; recado: <link> }` e usam `criarClienteAdmin` e `lib/convite.ts`, com `base` vindo de `headers()` (`origin`). Mais `definirVendedor`, `alternarFiltroFila`, `salvarConfiguracao`, `bloquearContato` e `descartarLead`.

- [ ] **Passo 1: Testes que falham.**
  - `periodo.test.ts`:
    - `inicioDoPeriodo("hoje", new Date("2026-11-11T02:30:00Z"))` dá `2026-11-10T03:00:00.000Z`;
    - `"semana"` numa quarta (`2026-11-11T15:00:00Z`) dá `2026-11-09T03:00:00.000Z`;
    - `"semana"` num domingo (`2026-11-15T15:00:00Z`) também dá `2026-11-09T03:00:00.000Z`;
    - `"tudo"` dá `null`.
  - `080_painel.test.sql`:
    - v1 recebe L e envia a abertura;
    - como admin, `painel_dono(null)` mostra `aberturas = 1` e `recebidos = 1` para v1;
    - depois de `reatribuir_lead(L, v2)`, v1 continua com `aberturas = 1` e v2 tem `0` (o número não muda quando o lead troca de dono);
    - um evento `migrado` não muda nada;
    - com a última abertura de v1 forçada para 3 dias úteis atrás (postgres), `parado = true`;
    - `definir_vendedor(v1, false, 5)` leva os leads `em_conversa` de v1 para o admin, e v1 perde o acesso (`proximo_lead` dá a frase do Review Focus 4);
    - vendedor chamando `painel_dono` dá "Só o admin pode fazer isso.";
    - `resumo_fila()` conta 1 pronto em `Cidade Exemplo/Nicho Exemplo`.
  - Rode os dois. Esperado: FAIL.

- [ ] **Passo 2: Implementar** `lib/periodo.ts` e a migração. Aplique, rode `npm test`, o pgTAP e `npm run db:tipos`. Esperado: PASS.

- [ ] **Passo 3: Telas.**
  - **Painel** (`/admin`):
    - o filtro Hoje, Semana ou Desde o início vem por `searchParams` (`Promise`);
    - uma linha por vendedor ativo, com as colunas do §5;
    - a linha com `parado` fica destacada e diz "há N dias úteis sem abertura";
    - os inativos ficam numa seção recolhida;
    - no celular, a tabela vira cartões.
  - **Equipe e fila** (`/admin/equipe` e `/admin/fila`):
    - formulário de convite: e-mail, nome, curso, artigo. Mostra o link com `BotaoCopiar` e a instrução "mande pelo WhatsApp";
    - "Gerar link de acesso" para quem esqueceu a senha;
    - ativar ou desativar e a cota por pessoa;
    - cidades e nichos ativos, com o `resumo_fila`;
    - a configuração (preço, piso, comissão, cota padrão, dias).
  - **Vendas** (`/admin/vendas`): todas as vendas, com "marcar pago" e "marcar repassado", e o total a receber por vendedor.

- [ ] **Passo 4: Conferência.** `npm test`, `npx tsc --noEmit` e `npm run build:novo`. Teste manual: o painel mostra a Ana com os números da Tarefa 9; desativar a Ana faz a próxima ação dela, na aba já aberta, mostrar "Seu acesso foi desativado. Fale com o Kelwin."; reative.

- [ ] **Passo 5: Commit.** `git add -A crm && git commit -m "crm: tela do dono a partir do histórico, equipe por convite, fila por cidade e nicho, vendas"`

---

### Tarefa 12: Migração dos dados atuais (script e dry-run)

**Files:**
- Create: `crm/lib/migracao/plano.ts`, `crm/scripts/migrar-dados.ts`, `crm/supabase/migrations/<ts>_migracao.sql`, `crm/supabase/tests/database/090_migracao.test.sql`
- Test: `crm/tests/unit/plano-migracao.test.ts`, com fixtures fictícias **dentro do próprio teste**

**Interfaces:**
- Consumes: `converterLeadRaspado`, `normalizarTelefone` e `LeadImportado` da Tarefa 6, e `importar_leads`.
- Produces: `migrar_conversa(p_lead_id uuid, p_dono uuid, p_passo text, p_contato jsonb, p_eventos jsonb) returns void`, só `service_role`. Ele:
  - põe o lead em `em_conversa` com `abertura_enviada_em` = o `atribuido_em` antigo, ou `now()` se não houver;
  - grava `passo = p_passo`;
  - insere o contato;
  - insere cada evento antigo como `tipo='migrado'`, com `dados {tipo_antigo, nota}` e `criado_em` original.
- Produces, em `lib/migracao/plano.ts`: `montarPlanoMigracao(e: EntradasMigracao): PlanoMigracao`.
  - `type EntradasMigracao = { producao: { leads: LeadAntigo[]; contatos: ContatoAntigo[]; eventos: EventoAntigo[]; perfis: { id: string; email: string }[] }; export117: LeadAntigo[]; backup71: LeadAntigo[]; revisao: LeadRevisado[]; aprovados: LeadRaspado[]; clientes: { nome: string; telefone?: string; google_place_id?: string }[]; donosNovos: Record<string, string>; adminId: string }`
  - `LeadAntigo` traz as 19 colunas do banco antigo (engenharia reversa §1.2). `LeadRevisado` é o `LeadAntigo` mais `veredito`, `evidencias` e `verificado_em`.
  - `type PlanoMigracao = { leads: LeadImportado[]; conversas: { origem_id: string; dono_id: string; passo: "quem_respondeu" | "resultado"; contato: { nome: string; cargo: string; telefone_e164: string | null } | null; eventos: { tipo_antigo: string; nota: string; criado_em: string }[] }[]; bloqueios: { telefone_e164: string | null; google_place_id: string | null; motivo: "cliente" }[]; avisos: string[]; contagem: Record<string, number> }`
- Produces: `npm run migrar -- --autor <email do admin> [--clientes <json local>] [--gravar]`.

Regras do plano, que refletem o §8 e o §12.2 do design:
1. **Ativos:** os 46 de `producao.leads`, com a verificação vinda da `revisao` pelo id.
2. **Descartados:** os ids de `export117 ∪ backup71` que não estão em `producao.leads`. Eles entram com `estado_inicial='descartado'` e o motivo tirado do veredito da revisão: `TEM_SITE` → `tem_site`, `DESCARTE_LEAD_FRACO` → `lead_fraco`, `FECHADO` → `fechado`, e o resto → `outro`. Para o resto (por exemplo um `PODE_ABORDAR` apagado à mão) sai também um aviso com o nome.
3. **Aprovados:** os 50 de `aprovados`, convertidos. Se um telefone E.164 bate com um ativo, vira o mesmo lead (`google_place_id` acrescentado) e sai um aviso.
4. **Com dono:** os 11 viram uma conversa. O dono é `donosNovos[email do perfil antigo, em minúsculas]`. Se não houver, o dono vira o `adminId` e sai o aviso "lead de <nome> ficou com o admin". `situacao='qualificado'` → `passo: "resultado"`, o resto → `passo: "quem_respondeu"`. Contato e eventos vão junto.
5. **Clientes atuais** (arquivo local passado em `--clientes`) viram bloqueios `cliente`.
6. O `origem_id` dos leads antigos é o uuid antigo; o dos aprovados é `udi-…`.

- [ ] **Passo 1: Teste que falha** (`plano-migracao.test.ts`), com 5 leads fictícios `Pet Exemplo A..E`, telefones `(34) 90000-0011..15`:
  - A em produção sem dono vira 1 lead `no_poco` e nenhuma conversa;
  - B só no export, com revisão `TEM_SITE`, vira `descartado/tem_site`;
  - C só no backup, com revisão `PODE_ABORDAR`, vira `descartado/outro` e gera um aviso que contém "Pet Exemplo C";
  - D em produção com dono `vendedor.exemplo@exemplo.com` mapeado vira uma conversa com aquele id e `passo: "quem_respondeu"`;
  - E com dono `sumiu@exemplo.com`, que não está mapeado, vira uma conversa com `adminId` e um aviso;
  - um aprovado com o telefone de A faz `leads.length` não crescer e gera um aviso;
  - `contagem` traz `{ ativos: 3, descartados: 2, aprovados: 1, conversas: 2, mesclados: 1 }`.
  - Rode `npm test`. Esperado: FAIL.

- [ ] **Passo 2: Implementar** `lib/migracao/plano.ts`. Rode `npm test`. Esperado: PASS.

- [ ] **Passo 3: pgTAP** (`090_migracao.test.sql`): `migrar_conversa` deixa o lead `em_conversa` com `abertura_enviada_em` igual ao `atribuido_em` informado; os eventos ficam `migrado`, com o `criado_em` original; `not ok(private.lead_pronto(L))`; `painel_dono(null)` não conta esses eventos. Implemente a migração, aplique e rode. Esperado: PASS.

- [ ] **Passo 4: Script.** O `scripts/migrar-dados.ts`:
  - lê o banco antigo **só com GET** (`lerAmbienteAntigo`, com `select` paginado de 1.000 em 1.000 em `leads`, `contatos`, `eventos` e `perfis`);
  - lê os arquivos de `prospeccao/leads/uberlandia/` (`crm-export.json`, `crm-backup-antes-limpeza-2026-10-26.json` → `.leads`, `crm-revisao.json` → `.leads`, `novos-aprovados.json`);
  - monta `donosNovos` com `auth.admin.listUsers` do banco novo;
  - chama `montarPlanoMigracao`.
  - Sem `--gravar`: imprime `contagem`, os avisos e o total por motivo, e grava o plano completo em `prospeccao/leads/uberlandia/plano-migracao-<data>.json`, que é ignorado pelo git (confira com `git check-ignore`). Nenhum telefone vai para o console.
  - Com `--gravar` (exige `--autor`): `importar_leads` (todos), depois `migrar_conversa` (as conversas), depois `insert` direto em `bloqueios` com a chave secreta, com `on conflict do nothing`, para os clientes. A RPC `bloquear` da Tarefa 11 exige sessão de admin. Rodar de novo é idempotente e dá `atualizado` ou `ja_descartado`.

- [ ] **Passo 5: Dry-run com os dados reais** (nada é gravado): `npm run migrar`. Esperado, segundo o design: `ativos 46`, `descartados 71`, `aprovados 50` (menos os mesclados), `conversas 11`, `contatos 1`, `eventos 19`. Como os vendedores ainda não foram reconvidados, os 11 saem com o aviso de dono ausente. Mostre ao Kelwin só a contagem e os avisos e espere o ok dele. A gravação real fica no runbook (Tarefa 14), depois dos convites e de um novo dry-run.

- [ ] **Passo 6: Commit.** `git add crm/lib/migracao crm/scripts/migrar-dados.ts crm/supabase crm/tests && git commit -m "crm: migração dos dados atuais com dry-run, descartados que nunca voltam e donos por e-mail"`

---

### Tarefa 13: Verificação antes do corte

**Files:**
- Create: `crm/scripts/backup.ps1`
- Nenhum outro arquivo. Esta tarefa produz evidência, que vai no resumo da tarefa.

- [ ] **Passo 1: Suites.**
  - `npm test`. Esperado: todos os testes vitest verdes.
  - pgTAP: caminho A, `npx supabase test db`; caminho B, `npm run db:testar`. Esperado: 0 `not ok`, nos 8 arquivos (`010` a `090`).
  - `npx supabase migration list --linked`. Esperado: local = remoto.

- [ ] **Passo 2: Advisors.** `npx supabase db advisors --linked --type security --level info` e `--type performance --level info`. Esperado: zero ERROR. Entre os WARN, só o `0029` das RPCs, comentadas nas migrações. Nenhum `0003`, `0006` nem `0001`. Cole a lista no resumo.

- [ ] **Passo 3: Tipos e build.**
  - `npm run db:tipos` e `git diff --exit-code lib/supabase/database.types.ts`. Esperado: sem diferença.
  - `npx tsc --noEmit` e `npm run build:novo`. Esperado: verdes.
  - `npx tsx scripts/teste-concorrencia.ts`. Esperado: OK.

- [ ] **Passo 4: Teste nos aparelhos** (Android, iPhone e notebook com WhatsApp Web; nada disso é documentado pelo WhatsApp). Preparação:
  - o Kelwin convidado e promovido (`npm run convidar`, depois `promover-admin`). O teste é feito com a conta dele, para que nenhum evento real fique com autor de exemplo;
  - no banco novo, os leads de exemplo da Tarefa 9;
  - mais um lead de teste com o **número do próprio Kelwin**, em arquivo local fora do git (`prospeccao/leads/teste-aparelhos.json`), importado com `--autor` = Kelwin;
  - a mensagem desse lead tem uma linha com `&`, uma com acento e uma quebra de linha.

  | Conferência | Android | iPhone (Safari) | Notebook |
  |---|---|---|---|
  | "Abrir no WhatsApp" abre o app certo (comum ou Business) com o texto | | | |
  | Quebra de linha (`%0A`) e acentos chegam intactos | | | |
  | `&`, `#` e `?` chegam inteiros | | | |
  | "Copiar parte N" funciona e mostra "Copiado" | | | |
  | No notebook, o `wa.me` não recarrega nem trava o WhatsApp Web | — | — | |
  | Telas a 360 px sem rolagem horizontal; botões ≥ 44 px | | | — |

  Se o `wa.me` travar o WhatsApp Web no notebook, registre e mostre ao lado do botão o aviso "No notebook, abra a conversa pela busca e use os botões de copiar" (fluxo §3.1). No fim, o admin descarta o lead de teste com motivo `outro`, e `npx tsx scripts/limpar-exemplos.ts --gravar` remove os exemplos: leads, usuários, os modelos desses usuários e do Nicho Exemplo, e o próprio nicho. No fim ele lista os modelos ativos (tipo e nicho, sem texto). Esperado: nenhum modelo `(geral)` de exemplo e nenhum `Nicho Exemplo` na lista.

- [ ] **Passo 5: Backup.** O `scripts/backup.ps1` roda os três `npx supabase db dump --db-url $env:SUPABASE_DB_URL` da receita oficial (`--role-only`, o esquema, e `--data-only --use-copy`) para uma pasta **fora do repositório**, por padrão `$env:USERPROFILE\Backups\vistra-crm\<data>`, e apaga os backups com mais de 30 dias. Rode uma vez. Esperado: os três arquivos, sem nenhum caminho dentro do repo. O agendamento diário vai no runbook.

- [ ] **Passo 6: Commit.** `git add crm/scripts/backup.ps1 && git commit -m "crm: backup diário fora do repositório"`

---

### Tarefa 14: Runbook do corte (só com o ok do Kelwin)

Cada passo é feito com o Kelwin. Os que dependem do Rafael estão marcados.

- [ ] **Passo 1: Antes do dia.**
  0. **Cadastro fechado (só com o ok do Kelwin, pelo Chrome).** No Dashboard do projeto novo, Authentication > Sign In / Providers (`dashboard/project/<ref>/auth/providers`): desligar "Allow new users to sign up" e conferir que "Allow anonymous sign-ins" está desligado. Depois, `npx tsx scripts/conferir-cadastro-fechado.ts`. Esperado: `OK` nas duas linhas (o `signUp` com e-mail `@exemplo.com` e a entrada anônima voltam `signup_disabled`). O convite continua funcionando: ele usa a chave secreta (`generateLink`) e ativa o perfil, que nasce inativo desde a revisão final (C1).
  1. As mensagens no modelo novo (pesquisa Hormozi) chegam como arquivo local no formato da Tarefa 7.
  2. `npm run importar:mensagens -- --arquivo <arquivo> --autor <Kelwin>`. Esperado: 0 reprovadas, ou o Kelwin corrige e roda de novo. Com `--gravar`, qualquer reprovada faz o script não gravar nada.
  3. Os vendedores reconvidados pela tela de equipe (o Kelwin já foi convidado na Tarefa 13), com o link mandado no WhatsApp de cada um. A tela de equipe roda em `dev:novo`, e o link usa a base `https://vistracrm.vercel.app` (`--base` no script, ou o `origin` da tela). Ele só funciona depois do corte. Se for preciso entrar antes, gere com a base local.
  4. Novo dry-run (`npm run migrar`). Esperado: os avisos de dono ausente só para quem não voltou.
  5. Agende o `backup.ps1` no Agendador de Tarefas do Windows, diário às 03:00.
  6. **Checklist antes do corte** (cada item com a saída colada no resumo):
     - [ ] cadastro fechado: `conferir-cadastro-fechado.ts` com `OK` nas duas linhas (item 0);
     - [ ] `npx tsx scripts/limpar-exemplos.ts --gravar` rodado; a lista de modelos ativos que ele imprime não tem modelo de exemplo, nem `(geral)` de exemplo, nem `Nicho Exemplo`. A dor e a transformação do Pet shop no banco novo ainda têm o texto do exemplo antigo da Tarefa 9: o arquivo real de mensagens precisa trazer o Pet shop em `nichos`;
     - [ ] nichos Advocacia e Móveis planejados e cidades Governador Valadares/MG e Caratinga/MG criados (`npm run criar:dominio -- --nicho "Advocacia" --gravar`, idem para os outros, e `--cidade "Caratinga" --uf MG`), com os modelos de cada nicho no arquivo de mensagens, antes de importar leads e mensagens deles;
     - [ ] último dry-run (`npm run migrar -- --dados <pasta ignorada>`): o plano JSON só é gravado se o `git check-ignore` confirmar que está ignorado; ele recusa caso contrário;
     - [ ] o arquivo local dos clientes atuais pronto para o `--clientes` (sem ele o `--gravar` não roda);
     - [ ] combinado: depois do corte ninguém roda `scripts/teste-concorrencia.ts` (ele cria e apaga dados no banco de produção).

- [ ] **Passo 2: Congelar o banco antigo.** Aviso no grupo da equipe: "CRM em manutenção de <hora> a <hora>, não registre nada". Daqui em diante o banco antigo é só leitura, por combinação. A partir deste momento, rodar de novo o dry-run da Tarefa 12 dá os mesmos números do último dry-run.

- [ ] **Passo 3: Gravar os dados reais no banco novo.**
  1. `npm run migrar -- --autor <Kelwin> --clientes <arquivo local dos clientes> --gravar` (sem `--clientes` ele recusa). Esperado no fim: `Migração sem pendências: falhas 0, ignoradas 0.` Toda conversa que não sai `migrada` ou `ja_migrada`, e todo lead recusado, aparece pelo origem id, e o script sai com código 1. Os leads ativos sem dono com contato anterior viram conversa do Kelwin em "Quem respondeu" (`com_contato_sem_dono` na contagem, com aviso pelo nome): ficam em Minhas conversas dele, que segue o passo a passo ou encerra como qualquer conversa.
  2. **Só se o passo 1 terminou com falhas 0 e ignoradas 0:** `npm run importar:mensagens -- --arquivo <arquivo> --autor <Kelwin> --gravar`. Com pendência, pare e resolva antes.
  3. Confira, como admin no app (`dev:novo`): `/admin/fila` mostra os prontos por nicho (> 0); o painel mostra a equipe; um lead migrado com dono aparece em Minhas conversas do dono certo.
  4. Daqui em diante, nada de pgTAP remoto.

- [ ] **Passo 4: Variáveis na Vercel (Rafael), sem redeploy.** No projeto `vistracrm`, Production:
  - `NEXT_PUBLIC_SUPABASE_URL` = a URL do `vistra-crm`;
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = a `sb_publishable_…`;
  - `SUPABASE_SECRET_KEY` = a `sb_secret_…`, marcada como Sensitive.

  As antigas (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) ficam até o Passo 8. O deploy que está no ar guarda as variáveis do build dele, então nada muda até o próximo deploy. Ninguém faz redeploy entre este passo e o Passo 5.

- [ ] **Passo 5: Código (com o ok do Kelwin).** `git push -u origin crm-banco-novo`. Depois, `git switch main && git merge --no-ff crm-banco-novo && git push`. O push publica na Vercel, já com as variáveis novas. Acompanhe o deploy até ficar "Ready".

- [ ] **Passo 6: Conferência em produção** (`https://vistracrm.vercel.app`):
  - o Kelwin entra;
  - `/admin` carrega;
  - um vendedor entra pelo link de convite e aperta Próximo lead: recebe um lead com mensagem;
  - "Abrir no WhatsApp" abre com o texto (sem enviar);
  - "Largar" com motivo `outro` devolve o lead à fila;
  - o painel conta "recebidos 1" para ele;
  - a Data API recusa sem sessão: `curl -s "<URL>/rest/v1/leads" -H "apikey: <publishable>"` responde `401` ou `42501`, nunca uma lista.

- [ ] **Passo 7: Volta, se algo falhar nos Passos 5 e 6.** O Rafael promove o último deploy de antes do merge (Vercel → Deployments → "Promote to Production"). Esse deploy já tem as variáveis antigas embutidas. Depois, ele volta a `NEXT_PUBLIC_SUPABASE_URL` para o valor antigo, para um redeploy futuro não misturar as duas. O Kelwin faz `git revert -m 1 <merge>` no `main`. O banco antigo não foi tocado, então a volta é completa. O banco novo fica como está para a próxima tentativa.

- [ ] **Passo 8: Depois de conferido.**
  - Atualize o `prospeccao/guia-amigos.md`: entrada por convite, sem `/cadastro`; o fluxo Início → Próximo lead → passos.
  - Avise a equipe.
  - O Rafael remove da Vercel `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
  - Depois de alguns dias de uso sem problema, o Rafael pausa o banco antigo (§8).
  - Apague o `crm/.env.local` antigo da máquina, ou renomeie para `.env.antigo.local`, e passe o `.env.novo.local` para `.env.local`.
  - Troque `dev:novo` e `build:novo` por `dev` e `build` num commit `crm: fim do período de transição`.

---

## Self-review

**1. Cobertura do design:**

| Item do design | Onde está no plano |
|---|---|
| §2 objetivos: banco novo, RLS, testes e tipos | T2–T5, T13 |
| §2 objetivos: fluxo | T4, T5, T9 |
| §2 objetivos: dono | T11 |
| §2 objetivos: primeira venda | T10 |
| §2 objetivos: migrar sem trazer descartado de volta | T6 (`ja_descartado`), T12 |
| §2 antiobjetivo: nunca enviar | Global Constraints, T9 (só `wa.me` e copiar) |
| §2 antiobjetivo: dois vendedores no mesmo lead | T4 (pgTAP e script de concorrência) |
| §2 antiobjetivo: chamar de novo quem pediu para parar | T5, T6 |
| §2 antiobjetivo: lead sem site confirmado | `lead_pronto` |
| §2 antiobjetivo: leitura pública | T2, T3, T14 Passo 6 |
| §2 antiobjetivo: mensagem fora das regras | T7 |
| §2 antiobjetivo: placar que muda | T11 |
| §3 restrições: grants e chaves | T2, T8 |
| §3 restrições: `wa.me` | T7 |
| §3 restrições: repo público | Global Constraints, exemplos `exemplo-` |
| §3 restrições: Vercel do Rafael | T14 |
| §4.1 Início | T9 |
| §4.2 fila: cota, um por vez, reserva que vence, ordem, filtro cidade/nicho | T4, T11 |
| §4.3 passos salvos no servidor | T5, T9 |
| §4.4 prévia e Sites para fazer | T5, T10 |
| §4.5 venda e comissão, piso só como referência | T10 |
| §4.6 bloqueio | T5 |
| §5 tela do dono | T11 |
| §6 modelo de dados | T2, T3, T5, T10 |
| §6 redes e duplicados | `grupo` em T3, T4, T6 |
| §7 mensagens e validador | T7 |
| §8 migração | T12, T14 |
| §9 CLI | T1 |
| §9 tipos | T3 e seguintes |
| §9 pgTAP com os 5 casos citados | T4, T5, T3 |
| §9 Advisors | T2, T4, T13 |
| §9 backup | T13, T14 |
| §9 teste nos aparelhos | T13 |
| §10 decisões em aberto | seção "Decisões do construtor" |
| §12.1 telas adaptadas | T9, T10 |
| §12.1 lista e criar à mão para o admin | adiados, declarado |
| §12.2 os 11 com dono | T12 |
| §12.3 modelos por nicho e principal por lead | T7 |
| §12.4 corte | T14 |
| §12.5 comissão a partir de `pago_em` e `repassado_em` | T10, T11 |
| §12.6 telefone WhatsApp e número errado | T4, T5 |
| §12.7 desativado | T11 |
| §12.8 `SITE_QUEBRADO` | T4 |

Lacuna assumida: a §9, "documentar como restaurar", fica coberta pela receita oficial citada no `backup.ps1`. Não há documento novo.

**2. Varredura dos passos:** não há "TBD" nem "tratar casos de borda". Cada código tem assinatura e arquivo, e cada teste traz os valores. Os corpos ficam por conta do implementador, menos a ordem do `proximo_lead` e a tabela de transições, que o teste não determina sozinho.

**3. Consistência de nomes:**
- `registrar_acao` / `registrarAcao`, `proximo_lead` / `pegarProximoLead`, `largar_lead` / `largarLead`.
- `lead_pronto`, `telefone_atual`, `inicio_do_dia`, `somar_dias_uteis` e `dias_uteis_entre` aparecem com o mesmo nome em T2, T4, T5 e T11.
- `LeadImportado` é o mesmo em T6 e T12. `Acao` e `Passo` são os mesmos em T9 e na tabela da T5.
- `pedidos_previa` nasce em T5 e é usado em T10.
- O `motivo_fim` `perdeu` e `venda` estão no CHECK da T3.

**4. Review Focus:** os 5 itens têm teste na tarefa dona: T5, T2/T4, T7, T2/T4/T11 e T7/T9.

**5. Proporção:** o design tem 286 linhas e o plano tem cerca de 3,7 vezes isso. A maior parte é decisão (estados, transições, regras de importação e migração, runbook). Nenhum corpo de função foi transcrito. Os blocos de código são o formato do arquivo de mensagens e as asserções.
