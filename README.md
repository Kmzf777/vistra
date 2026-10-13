# Vistra

Startup de IA de Uberlândia. Instagram [@vistra.ia](https://www.instagram.com/vistra.ia/).
Este repositório é a nossa gestão: CRM, concorrência, criação de conteúdo, marca, aprendizados,
ferramentas e prospecção. Os produtos para clientes (sites e CRMs de petshop) ficam no repositório
`PetShop-coldcall`, em `clientes/<cliente>/`.

| Pasta | O que tem |
|---|---|
| `crm/` | Vistra CRM, em Next 16 + Supabase: leads, contatos e funil. Para rodar: `cd crm && npm install && npm run dev`. Precisa de `crm/.env.local` (modelo em `crm/.env.example`). Sem Supabase, roda com dados de demonstração. |
| `crm/supabase/` | `schema.sql` e as migrações. Rode no SQL Editor do Supabase. |
| `crm/scripts/importar-leads.js` | Importa os leads de `prospeccao/leads/` para o Supabase. Sem `--gravar`, só mostra o que faria. |
| `marca/` | Manual da marca e da oferta (PDF) e o logo em SVG. |
| `conteudo/` | Introdução da marca, comunicação explicativa e guia do vendedor (PDF). |
| `motion/` | Reels da Vistra: identidade para vídeo (`marca/`) e o motor (Remotion, ferramentas, peças). Quem comanda é a skill `estudio-reels-vistra`. |
| `aprendizados/` | Specs, planos, pesquisas e referências (`docs/superpowers/...`), mais quadros e ideias em PDF. |
| `ferramentas/maps-scraper/` | Kit local do Google Maps Scraper (Docker na porta 8080). Veja `SETUP.md` ali dentro. |
| `prospeccao/` | `leads/` (raspagens, ex.: Uberlândia) e `scripts/` (`raspar_maps_udi.py`, `montar_leads_udi.py`, `build_sheet.py`). Rode os scripts a partir de `prospeccao/`. |
| `servicos.md` | Levantamento dos serviços a partir dos repositórios. |

Nasceu em 13/10/2026 a partir da pasta `Vistra/` do `PetShop-coldcall` (branch `vistra/reorganizacao`,
commit `0451410`, mais o trabalho de motion ainda não commitado). O histórico anterior está lá.
