# Vistra CRM — unificação, estética Vistra e remoção do cold call

**Data:** 2026-10-08 · **Status:** aprovado pelo usuário de antemão ("deixo ambos já aprovados")

## Objetivo

1. O CRM que hoje mora em `aivenda/app` passa a ser o **Vistra CRM**, dentro de `Vistra/crm/`.
2. O visual muda para a identidade Vistra (preto, verde `#39FF14`, Inter, símbolo `v`).
3. O sistema de cold call (copiloto de call) é **apagado por completo**. A pasta `aivenda/` deixa de existir.

## Fora do escopo

- **Banco de dados.** O Supabase (projeto `turzstctaedjlzbdhdxl`) é de produção. Não dropar tabela nem coluna. As colunas `perfis.admin` e `contatos` continuam existindo e funcionando.
- Funcionalidade nova no CRM. Só remoção e troca de pele.
- Commit no `master` (o usuário não pediu). Fica tudo como mudança local.

## Estrutura final

```
Vistra/
  crm/                    <- era aivenda/app (Next 16 + React 19 + Supabase)
    app/ components/ hooks/ lib/ public/
    supabase/             <- era aivenda/supabase (schema + migrações 002, 003)
    scripts/importar-leads.js   <- era aivenda/scripts
    .env.local            <- só NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
    .env.example
  marca/  conteudo/  servicos.md  README.md
```

- **`.env`:** sai de `aivenda/.env` para `Vistra/crm/.env.local`, que o Next lê nativamente. `TYPESAFE_API_KEY` é descartada. A ponte em `next.config.mjs` que lia `../.env` é removida, e o `next.config.mjs` fica mínimo.
- **`scripts/importar-leads.js`:** passa a ler `Vistra/crm/.env.local`. O caminho padrão dos leads passa a ser `<raiz do repo>/leads/...`, ou seja, `path.join(__dirname, "..", "..", "..", "leads", ...)`.
- **`lib/leadsRaspados.ts`:** qualquer caminho relativo ao disco é recalculado a partir do novo lugar, mantendo os mesmos arquivos de `leads/` na raiz.

## O que é apagado

**Em `aivenda/`, tudo que não migra:** `server.js`, `*.html`, `ensaio.js`, `teste*.js`, `worklet-energia.js`, `*.json` (fallback, fases, nudges, objecoes), `extensao/`, `lib/` (atribuir, decisao, objecoes-exemplo), `mapas/`, `pesquisa/`, `banco/`, `medicao/`, `contrato/`, `decisoes/`, `docs/`, `PLANO-PROTOTIPOS.md`, `README.md`, `.env`, `.env.example`, `.gitignore`.

**Dentro do CRM:**
- **Rotas:** `app/(crm)/coldcall/`, `app/(crm)/objecoes/`, `app/api/` inteira (evento, eventos, jev, limiares, objecoes).
- **Componentes:** CardHistorico, CardObjecao, CurvaVoz, FocoProvedor, LimiaresPainel, ModalConfig, ObjecaoForm, ObjecoesEditor, ObjecoesLista, ObjecoesTipos, PttFaixa, mais CampoTexto/CampoEscolha/CampoLista **se** só o editor de objeções os usar. Cada `.module.css` correspondente sai junto.
- **Hooks:** motorCopiloto, useCatalogo, useCopiloto, useDispositivos.
- **Lib:** barramento.ts, servidor.ts. **Public:** worklet-energia.js.
- **`package.json`:** `name` vira `vistra-crm` e o script `teste` (que apontava para os testes do copiloto) é removido.
- **Menu:** saem as portas "Cold call" e "Objeções". O layout do CRM perde o `FocoProvedor` e o `data-foco`.
- **Textos:** "Copiloto", "Jev", "objeção" e "cold call" saem de login, cadastro, metadata, comentários e copy das telas. Os eventos do tipo `objecao` que já estão no banco continuam sendo exibidos, com o rótulo genérico "nota".

**Recuperação:** antes de apagar, todo o conteúdo de `aivenda/` (rastreado ou não, menos `.env` e `node_modules`) é gravado num commit da branch local **`arquivo/coldcall`**. O working tree e o índice do `master` não são tocados. Nada é publicado.

## Estética Vistra

Os nomes das variáveis de `globals.css` são mantidos, para não reescrever todo CSS module. Mudam os valores:

| Token | Novo valor | Papel |
|---|---|---|
| `--vazio` | `#000000` | fundo |
| `--painel` | `#0A0D12` | menu, painéis |
| `--alto` | `#111827` | cartões, hover |
| `--linha` / `--linha-viva` | `#1F2937` / `#374151` | bordas |
| `--tinta` / `--tinta-fraca` / `--tinta-fantasma` | `#FFFFFF` / `#9CA3AF` / `#6B7280` | texto |
| `--voce` (acento principal) | `#39FF14` | ação, item ativo, foco |
| `--ok` | `#39FF14` | sucesso |
| `--sinal` | `#FACC15` | atenção |
| `--erro` | `#EF4444` | erro |
| `--cliente` | `#A855F7` | acento secundário |

- **Regra do verde:** fundo verde leva **texto preto** (`#000`). Verde nunca é texto corrido; aparece em destaque, botão, indicador ativo e número-chave. Todo botão e etiqueta que hoje usa `var(--voce)` de fundo com texto claro passa para texto preto.
- **Tipografia:** Inter (`next/font/google`) em `--fonte-ui` e também em `--fonte-serif`, ou seja, títulos em Inter 800 e sem serifa. JetBrains Mono fica em `--fonte-mono`, só para números e telemetria.
- **Textura:** o `body::before` troca o brilho azul/laranja por um brilho verde muito fraco (`rgba(57,255,20,.05)`).
- **Marca no menu:** o símbolo (círculo `#39FF14` com o `v` preto, do mesmo path de `Vistra/marca/vistra-logo.svg`, embutido como SVG inline) mais o texto `vistra.ia` (com `.ia` em verde) e o subtítulo "CRM". No menu estreito, fica só o símbolo.
- **Login e cadastro:** marca Vistra, título "Vistra CRM" e a linha "Engenharia de receita com IA".
- **Metadata:** title "Vistra CRM".

## Critérios de aceite

1. `aivenda/` não existe. `Vistra/crm/` existe e roda com `npm run dev`.
2. `npx tsc --noEmit` e `npm run build` passam em `Vistra/crm`.
3. `grep -ri "coldcall\|copiloto\|jev\|objec"` em `Vistra/crm` (fora de `node_modules`/`.next`) não encontra nada no código, exceto o valor `"objecao"` lido de eventos antigos, onde for necessário.
4. `/lista`, `/leads` e `/funil` renderizam com o visual Vistra, e o menu mostra só essas três portas.
5. A branch `arquivo/coldcall` contém `aivenda/` completo.
6. Docs da Vistra sem link quebrado para `aivenda/mapas`.
