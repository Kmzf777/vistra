# Vistra CRM: unificação, estética e remoção do cold call. Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover o CRM de `aivenda/app` para `Vistra/crm`, apagar todo o cold call e vestir o CRM com a identidade Vistra.

**Architecture:** A Tarefa 1 é sequencial e faz o arquivamento e a mudança de pasta. Depois três tarefas paralelas, com arquivos disjuntos, mexem só em `Vistra/crm` e nos docs: (2) remover o código do cold call e ajustar a configuração, (3) trocar a pele CSS, (4) limpar os docs da Vistra. A Tarefa 5 integra e verifica.

**Tech Stack:** Next 16 (App Router, `proxy.ts`), React 19, CSS Modules, Supabase (`@supabase/ssr`), TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-08-vistra-crm-unificacao-design.md`

**Testes:** o CRM não tem suíte de testes. Os testes existentes (`teste-*.js`) são do copiloto e são apagados. A verificação é feita por `npx tsc --noEmit`, `npm run build`, grep de resíduos e renderização das rotas no navegador (Tarefa 5).

**Commits:** o usuário não pediu commit no `master`. A única escrita no git é a branch de arquivo da Tarefa 1. As mudanças ficam locais.

---

## Mapa de arquivos

| Caminho final | Origem | Dono |
|---|---|---|
| `Vistra/crm/**` | `aivenda/app/**` | T1 move; T2 lógica `.ts/.tsx`; T3 `.css` + `app/layout.tsx` + JSX de marca em login/cadastro |
| `Vistra/crm/supabase/*.sql` | `aivenda/supabase/` | T1 |
| `Vistra/crm/scripts/importar-leads.js` | `aivenda/scripts/` | T1 move; T2 corrige caminhos |
| `Vistra/crm/.env.local` | `aivenda/.env` (sem a TYPESAFE) | T1 |
| `Vistra/crm/.env.example` | `aivenda/.env.example` (sem a TYPESAFE) | T1 |
| `Vistra/marca/*`, `Vistra/conteudo/*.md`, `Vistra/README.md` | — | T4 |

**Divisão de posse dentro de `Vistra/crm` (para T2 e T3 não colidirem):**
- **T2 é dona de:** todo `.ts`/`.tsx`, exceto `app/layout.tsx`, `app/login/page.tsx` e `app/cadastro/page.tsx`. Também de `package.json`, `next.config.mjs`, `proxy.ts` e `scripts/`. Inclui `components/MenuLateral.tsx`, que recebe a marca Vistra (o código está na Tarefa 2).
- **T3 é dona de:** todo `*.css`/`*.module.css` e de `app/layout.tsx`, `app/login/page.tsx` e `app/cadastro/page.tsx`.
- **T3 não restiliza** os CSS que a T2 apaga (lista na Tarefa 2, Passo 2).

---

### Tarefa 1: Arquivar, mover e apagar (sequencial, orquestrador)

**Files:**
- Create: branch local `arquivo/coldcall`
- Move: `aivenda/app` → `Vistra/crm`, `aivenda/supabase` → `Vistra/crm/supabase`, `aivenda/scripts` → `Vistra/crm/scripts`
- Create: `Vistra/crm/.env.local`, `Vistra/crm/.env.example`
- Delete: `aivenda/`

- [ ] **Passo 1: Gravar o snapshot na branch de arquivo, sem tocar no working tree nem no índice**

```bash
cd <raiz do repo>
export GIT_INDEX_FILE=.git/index-arquivo
git read-tree HEAD
git add -A aivenda          # respeita aivenda/.gitignore: .env, node_modules, .next ficam de fora
TREE=$(git write-tree)
COMMIT=$(git commit-tree "$TREE" -p HEAD -m "arquivo: snapshot do copiloto de cold call (aivenda) antes da remocao")
unset GIT_INDEX_FILE; rm -f .git/index-arquivo
git branch arquivo/coldcall "$COMMIT"
git ls-tree -r --name-only arquivo/coldcall -- aivenda | wc -l   # esperado: > 100 arquivos
git ls-tree -r --name-only arquivo/coldcall -- aivenda | grep -c "\.env$"   # esperado: 0
```

- [ ] **Passo 2: Mover o app (rename no mesmo volume; node_modules vai junto) e limpar o cache do Next**

```powershell
Move-Item aivenda\app Vistra\crm
Move-Item aivenda\supabase Vistra\crm\supabase
Move-Item aivenda\scripts Vistra\crm\scripts
Remove-Item -Recurse -Force Vistra\crm\.next, Vistra\crm\tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
```

- [ ] **Passo 3: Criar o env do CRM sem a chave da TypeSafe**

```powershell
Get-Content aivenda\.env | Where-Object { $_ -notmatch 'TYPESAFE' } | Set-Content -Encoding utf8 Vistra\crm\.env.local
@'
# Supabase: painel do projeto > Settings > API
# A anon key e publica por desenho; quem protege os dados e o RLS.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Usada so pelo scripts/importar-leads.js, do lado do servidor. Ela IGNORA o RLS.
SUPABASE_SERVICE_ROLE_KEY=
'@ | Set-Content -Encoding utf8 Vistra\crm\.env.example
```
Garantir `.env*.local` e `.env` no `Vistra/crm/.gitignore` (criar se não existir) junto com `node_modules/`, `.next/`, `tsconfig.tsbuildinfo` e `next-env.d.ts`.

- [ ] **Passo 4: Apagar `aivenda/`**

```powershell
Remove-Item -Recurse -Force aivenda
Test-Path aivenda   # esperado: False
```

---

### Tarefa 2: Remover o cold call do código e ajustar a configuração (paralela)

**Files:** só `Vistra/crm`. Dona dos `.ts/.tsx` (ver o mapa), de `package.json`, `next.config.mjs`, `proxy.ts` e `scripts/`.

- [ ] **Passo 1: Apagar rotas e APIs**

```powershell
cd Vistra\crm
Remove-Item -Recurse -Force "app\(crm)\coldcall", "app\(crm)\objecoes", app\api
```

- [ ] **Passo 2: Apagar componentes, hooks e libs do copiloto (com o `.module.css` de cada um)**

Componentes: `CardHistorico`, `CardObjecao`, `CurvaVoz`, `FocoProvedor`, `LimiaresPainel`, `ModalConfig`, `ObjecaoForm`, `ObjecoesEditor`, `ObjecoesLista`, `ObjecoesTipos`, `PttFaixa`.
Antes de apagar `CampoTexto`, `CampoEscolha` e `CampoLista`, rode `grep -rl "CampoTexto\|CampoEscolha\|CampoLista" app components lib hooks`. Só apague os que não tiverem importador fora da lista acima.
Hooks: `hooks/motorCopiloto.ts`, `hooks/useCatalogo.ts`, `hooks/useCopiloto.ts`, `hooks/useDispositivos.ts` (apague a pasta `hooks/` se ficar vazia).
Lib: `lib/barramento.ts`, `lib/servidor.ts`. Public: `public/worklet-energia.js`.

- [ ] **Passo 3: Layout do CRM sem modo foco**

`app/(crm)/layout.tsx` fica assim:

```tsx
import MenuLateral from "@/components/MenuLateral";
import SessaoMenu from "@/components/SessaoMenu";
import estilo from "./crm.module.css";

// Casco do CRM: menu fixo à esquerda, conteúdo à direita.
export default function LayoutCrm({ children }: { children: React.ReactNode }) {
  return (
    <div className={estilo.casco}>
      <MenuLateral />
      {/* Monta-se por portal dentro da #menu-sessao do MenuLateral, entao
          nao vira um no na grade do casco. */}
      <SessaoMenu />
      <main className={estilo.conteudo}>{children}</main>
    </div>
  );
}
```
Se `perfilAtual` ficar sem uso em `lib/auth.ts`, mantenha a função (outras páginas podem usar). Rode o grep antes de decidir.

- [ ] **Passo 4: Menu com três portas e a marca Vistra**

`components/MenuLateral.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import estilo from "./MenuLateral.module.css";

// A ordem é a do dia de trabalho: a lista da equipe, os seus leads e o
// funil, onde o que deu certo continua.
const PORTAS = [
  { href: "/lista", nome: "Lista de leads", desc: "a equipe toda", glifo: "▦" },
  { href: "/leads", nome: "Meus leads", desc: "na sua mão", glifo: "▪" },
  { href: "/funil", nome: "Funil", desc: "seus qualificados", glifo: "▤" },
];

export default function MenuLateral() {
  const caminho = usePathname();

  return (
    <nav className={estilo.menu}>
      <Link href="/lista" className={estilo.marca} aria-label="Vistra CRM">
        <svg className={estilo.simbolo} viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="100" fill="#39FF14" />
          <path d="M52 56 H82 L94 122 L128 56 H158 L104 150 H76 Z" fill="#000" />
        </svg>
        <span className={estilo.nomeMarca}>
          vistra<b>.ia</b>
          <small>CRM</small>
        </span>
      </Link>

      <ul className={estilo.portas}>
        {PORTAS.map((p) => {
          const aqui = caminho === p.href || caminho.startsWith(p.href + "/");
          return (
            <li key={p.href}>
              <Link href={p.href} className={`${estilo.porta} ${aqui ? estilo.aqui : ""}`}>
                <span className={estilo.glifo} aria-hidden>
                  {p.glifo}
                </span>
                <span className={estilo.texto}>
                  <strong>{p.nome}</strong>
                  <em>{p.desc}</em>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* O rodapé do menu é preenchido pelo SessaoMenu (quem está logado + sair). */}
      <div className={estilo.pe} id="menu-sessao" />
    </nav>
  );
}
```
As classes `simbolo` e `nomeMarca` são criadas pela T3 em `MenuLateral.module.css` (contrato abaixo).

- [ ] **Passo 5: `package.json`**

`"name": "vistra-crm"`, `"version": "1.0.0"`. Remova o script `"teste"`.

- [ ] **Passo 6: `next.config.mjs` mínimo (o `.env.local` é lido nativamente pelo Next)**

```js
/** @type {import('next').NextConfig} */
export default {};
```

- [ ] **Passo 7: `proxy.ts`**

Remova a menção a `/coldcall` e `/objecoes` no comentário do bloco "sem credenciais". O comportamento não muda.

- [ ] **Passo 8: Caminhos dos dados em disco**

- **`scripts/importar-leads.js`:** o `.env` passa a ser `path.join(__dirname, "..", ".env.local")`. Os leads padrão passam a ser `path.join(__dirname, "..", "..", "..", "leads", "uberlandia", "leads.json")` e o fallback `.../leads/raw.json`. Atualize os comentários de uso, trocando `../leads` por `../../leads`.
- **`lib/leadsRaspados.ts`:** recalcule o caminho até `<raiz do repo>/leads/...`. Antes era `process.cwd()` = `aivenda/app`, agora é `Vistra/crm`. A profundidade até a raiz continua 2 níveis (`..`, `..`), então confira e só mude se o código usar outro ponto de partida.

- [ ] **Passo 9: Limpar referências restantes**

```bash
grep -rniE "coldcall|cold call|copiloto|jev|objec|foco|limiar|barramento|typesafe|PlacarEquipe" app components lib proxy.ts scripts
```
- `PlacarEquipe` **fica** (é o placar da lista).
- Rótulos de evento: o mapa de tipos em `components/PainelLead.tsx` (`objecao: "objeção"`) vira `objecao: "nota"`. Em `lib/funilExemplo.ts`, troque o evento de exemplo do tipo `"objecao"` por `"nota"` e reescreva o texto sem mencionar objeção.
- Textos de UI que falam em "ligar"/"cold call" (ex.: dicas em `LeadsPoco.tsx`) viram linguagem de contato: "pegou; falta contatar".
- Comentários que explicam o copiloto são removidos ou reescritos.

- [ ] **Passo 10: Verificar**

```bash
npx tsc --noEmit        # esperado: sem erros
```

---

### Tarefa 3: Pele Vistra (paralela)

**Files:** todos os `*.css` restantes em `Vistra/crm`, mais `app/layout.tsx`, `app/login/page.tsx` e `app/cadastro/page.tsx`. **Não** edite `.tsx` fora desses três.
**Não restilize** (a T2 apaga): `CardHistorico`, `CardObjecao`, `CurvaVoz`, `LimiaresPainel`, `ModalConfig`, `ObjecaoForm`, `ObjecoesEditor`, `ObjecoesLista`, `PttFaixa`, `coldcall.module.css`, `portao.module.css`, nem os `Campo*.module.css`.

- [ ] **Passo 1: Tokens em `app/globals.css` (mesmos nomes, valores Vistra)**

Substitua o bloco `:root` e o `body::before`:

```css
:root {
  --vazio:        #000000;
  --painel:       #0A0D12;
  --alto:         #111827;
  --linha:        #1F2937;
  --linha-viva:   #374151;

  --tinta:        #FFFFFF;
  --tinta-fraca:  #9CA3AF;
  --tinta-fantasma: #6B7280;

  /* acento Vistra: fundo verde sempre com texto preto */
  --voce:         #39FF14;
  --sobre-voce:   #000000;
  --cliente:      #A855F7;
  --sinal:        #FACC15;
  --ok:           #39FF14;
  --erro:         #EF4444;

  --raio:         14px;
  --raio-p:       9px;
  --mola: cubic-bezier(.22, 1, .36, 1);
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(1100px 620px at 50% -10%, rgba(57,255,20,.05), transparent 70%),
    radial-gradient(760px 420px at 92% 108%, rgba(57,255,20,.025), transparent 70%);
}
```
Remova de `globals.css` as primitivas que só o cold call usava, mas só se nenhum `.tsx` restante usar a classe: rode `grep -rn "className=\"<classe>" app components` antes de cada remoção.

- [ ] **Passo 2: Fontes e metadata em `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Inter é a fonte da marca Vistra: títulos em 800, texto em 400/500.
// --fonte-serif aponta para a mesma Inter: o CRM não usa serifa.
const ui = Inter({ subsets: ["latin"], variable: "--fonte-ui", display: "swap" });
const titulo = Inter({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--fonte-serif", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--fonte-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Vistra CRM",
  description: "CRM da Vistra: leads, contatos e funil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${ui.variable} ${titulo.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```
Nos CSS que usam `var(--fonte-serif)` em títulos, aplique `font-weight: 800; letter-spacing: -.02em;`.

- [ ] **Passo 3: Regra do verde em todos os CSS modules restantes**

```bash
grep -rn "var(--voce)\|var(--ok)" --include=*.css .
```
Para cada `background: var(--voce)` ou `background: var(--ok)` (ou equivalente com `color-mix` acima de 60%), o `color` do mesmo seletor passa a ser `var(--sobre-voce)`. Fundos translúcidos (`color-mix(... 10-25%)`) mantêm o texto claro. Verde nunca é cor de parágrafo: `color: var(--voce)` só em número-chave, ícone, rótulo curto ou link.

- [ ] **Passo 4: Contrato do `MenuLateral.module.css` (a T2 escreve o JSX)**

```css
.marca {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 20px;
  text-decoration: none;
  color: var(--tinta);
}
.simbolo { width: 30px; height: 30px; flex-shrink: 0; }
.nomeMarca {
  display: flex;
  flex-direction: column;
  font-family: var(--fonte-serif), sans-serif;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -.02em;
  line-height: 1.05;
}
.nomeMarca b { color: var(--voce); font-weight: 800; }
.nomeMarca small {
  font-family: var(--fonte-ui), sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .18em;
  color: var(--tinta-fantasma);
  margin-top: 3px;
}
.aqui::before { background: var(--voce); box-shadow: 0 0 10px rgba(57,255,20,.6); }

@media (max-width: 860px) {
  .marca { padding: 0 0 16px; justify-content: center; }
  .nomeMarca { display: none; }
}
```
Remova de `MenuLateral.module.css` as regras de `[data-foco]`, `.marca::after` e a `font-size:0` antiga. Remova de `app/(crm)/crm.module.css` a regra `.casco:has([data-foco="sim"])`.

- [ ] **Passo 5: Login e cadastro com a marca Vistra**

Em `app/login/page.tsx` e `app/cadastro/page.tsx`:
- **metadata:** `title: "Entrar · Vistra CRM"` / `"Criar conta · Vistra CRM"` e `description: "Acesso ao CRM da Vistra."`.
- **Marca:** troque o bloco `<h1 className={estilo.marca}>Copiloto</h1>` e a linha "O Jev decide..." por:

```tsx
<div className={estilo.marca}>
  <svg viewBox="0 0 200 200" width="40" height="40" aria-hidden>
    <circle cx="100" cy="100" r="100" fill="#39FF14" />
    <path d="M52 56 H82 L94 122 L128 56 H158 L104 150 H76 Z" fill="#000" />
  </svg>
  <h1>vistra<b>.ia</b> <span>CRM</span></h1>
</div>
<p className={estilo.linha}>Engenharia de receita com IA.</p>
```
Se a classe da linha existente tiver outro nome, reaproveite-a. Em `login.module.css`, `.marca` vira `display:flex; align-items:center; gap:12px;`, o `h1` usa Inter 800 a 26px, `.marca b` usa `color: var(--voce)`, `.marca span` usa `color: var(--tinta-fantasma); font-weight:600; font-size:.6em; letter-spacing:.14em;`. O botão principal fica com fundo `var(--voce)` e texto `var(--sobre-voce)`.

- [ ] **Passo 6: Varredura visual de cor antiga**

```bash
grep -rniE "#5978fd|#d53d00|#ffb340|#35d07f|rgba\(89,120,253|rgba\(213,61,0|Archivo|Instrument" --include=*.css --include=*.tsx .
```
Esperado: nada. Substitua o que sobrar pelos tokens.

---

### Tarefa 4: Docs da Vistra sem `aivenda` (paralela)

**Files:** `Vistra/conteudo/comunicacao-explicativa.md`, `Vistra/marca/manual-vistra.html` (+ regerar `Manual-Vistra.pdf`), `Vistra/servicos.md`, novo `Vistra/README.md`.

- [ ] **Passo 1:** `grep -rn "aivenda\|mapas\|Mapa 1\|Mapa 2\|Curso 1\|Curso 2" Vistra --include=*.md --include=*.html`
- [ ] **Passo 2:** em `comunicacao-explicativa.md`, apague a seção "7. Ligação com os mapas de venda".
- [ ] **Passo 3:** em `manual-vistra.html`, apague a seção `04 · Ligação com os mapas de venda` inteira. Também remova as citações a mapas e cursos nas outras seções (ex.: notas "Curso 2, módulo 1", "FALA 8b do Mapa 2", a tabela de pendências que cita "Mapas 1 e 2"), reescrevendo sem referência ao material apagado. Na tabela de pendências, o preço vira: "Preço da página: a definir (valores já usados: R$ 300, R$ 1.200, R$ 39,90)". Renumere as seções seguintes.
- [ ] **Passo 4:** regere o PDF com Chrome headless:

```bash
python -c "import subprocess,os; c=r'C:/Program Files/Google/Chrome/Application/chrome.exe'; d=r'C:/Users/rafae/OneDrive/Desktop/PetShop-coldcall/Vistra/marca'; subprocess.run([c,'--headless','--disable-gpu','--no-sandbox','--virtual-time-budget=10000','--print-to-pdf='+d+'/Manual-Vistra.pdf','--no-pdf-header-footer',d+'/manual-vistra.html'],capture_output=True,timeout=120); print(os.path.getsize(d+'/Manual-Vistra.pdf'))"
```
- [ ] **Passo 5:** em `servicos.md`, troque a menção a `aivenda` por `Vistra/crm` onde fizer sentido.
- [ ] **Passo 6:** crie `Vistra/README.md`:

```markdown
# Vistra

Startup de IA de Uberlândia. Instagram [@vistra.ia](https://www.instagram.com/vistra.ia/).

| Pasta | O que tem |
|---|---|
| `crm/` | Vistra CRM: Next 16 + Supabase. Leads, contatos e funil. `cd crm && npm install && npm run dev` (porta 3000). Precisa de `crm/.env.local` (modelo em `crm/.env.example`). Sem Supabase, roda com dados de demonstração. |
| `crm/supabase/` | `schema.sql` e migrações. Rode no SQL Editor do Supabase. |
| `crm/scripts/importar-leads.js` | Importa os leads raspados (`../leads/`) para o Supabase. Sem `--gravar`, só mostra o que faria. |
| `marca/` | Manual da marca e da oferta (PDF), logo em SVG. |
| `conteudo/` | Introdução da marca, comunicação explicativa e guia do vendedor (PDF). |
| `servicos.md` | Levantamento dos serviços a partir dos repositórios. |

O copiloto de cold call (antigo `aivenda/`) foi removido. O snapshot está na branch local `arquivo/coldcall`.
```

---

### Tarefa 5: Integração e verificação (orquestrador)

- [ ] **Passo 1:** em `Vistra/crm`: `npx tsc --noEmit`, com expectativa de 0 erro, e `npm run build`, com expectativa de sucesso. Corrija o que quebrou na junção de T2 com T3.
- [ ] **Passo 2:** grep de aceite:

```bash
grep -rniE "coldcall|copiloto|jev\b|typesafe" Vistra/crm --include=*.ts --include=*.tsx --include=*.css --include=*.mjs --include=*.json -l | grep -v node_modules
```
Esperado: vazio.
- [ ] **Passo 3:** `.claude/launch.json` passa a ter a configuração `vistra-crm` (`npm run dev` com `cwd`/`--prefix Vistra/crm`, porta 3000). Depois, `preview_start` e conferência de `/lista`, `/leads` e `/funil` (console sem erro, screenshot) e `/login`.
- [ ] **Passo 4:** `git branch --list arquivo/coldcall` existe. `Test-Path aivenda` dá False.
- [ ] **Passo 5:** atualizar a memória do projeto (`vistra-startup.md`) com o novo local do CRM.
