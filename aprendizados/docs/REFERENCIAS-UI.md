# Referências open source para landing page de pet shop

Levantamento feito via API do GitHub + inspeção visual dos demos no navegador
(nota, estrelas e licença conferidas em 2026-09-28).

## Conclusão curta

O nicho "petshop" no GitHub **não tem nenhum projeto com tração** — o topo da
busca tem 10 estrelas. São quase todos exercícios de curso. E o mais importante:
**a maioria não tem licença**, o que juridicamente significa "todos os direitos
reservados" — não dá para reusar em trabalho de cliente.

O caminho que se sustenta é: **pegar um template genérico MIT de alto acabamento
e trocar o conteúdo pelo tema pet**. As seções que um pet shop precisa (hero,
serviços, sobre, depoimentos, contato/WhatsApp) são exatamente as de um template
de negócio de serviços.

---

## A. Tema pet — vale olhar pelo conteúdo já escrito

| Repo | Stack | Licença | Demo | Avaliação |
|---|---|---|---|---|
| `valb-mig-lab/astro.petshop-melhor-amigo` | Astro | ⚠️ sem licença | [demo](https://astro-petshop-melhor-amigo.vercel.app) | **O melhor do tema.** PT-BR, paleta quente, serifada + sans, seções completas (hero, história, "Nossos cuidados" com ícones, depoimentos, contato). Copy pronta e boa. |
| `mr-mizanur/PetAdoption` | Next.js | ⚠️ sem licença | [demo](https://pet-adoption-theta-ten.vercel.app) | Visual mais "premium" do conjunto: dark mode, cards flutuantes, badges. É adoção, não loja — mas o sistema visual é aproveitável. |
| `Marcossousadev/PetShop-Next` | Next + Tailwind + AOS | ⚠️ sem licença | [demo](https://pet-shop-next-gamma.vercel.app) | PT-BR com **CTA de WhatsApp e cupom de desconto** — exatamente o padrão que converte no mercado brasileiro. Hero tem sobreposição de texto a corrigir. |
| `Thyale/CuidadoPet` | JS | **MIT** ✅ | sem demo | Única do tema com licença limpa. PT-BR. |
| `aw-amanda/dog_grooming_website` | Next.js | **MIT** ✅ | [demo](https://aw-amanda.github.io/dog_grooming_website/) | Banho e tosa, estrutura de serviços correta. Visual fraco, mas licença livre. |
| `pooyasamimi/petshop_landing` | HTML/CSS | ⚠️ sem licença | [demo](https://pooyasamimi.github.io/petshop_landing/) | Formas orgânicas e amarelo funcionam bem. É persa/RTL — inverter o layout dá trabalho. |
| `brunoglvm/JardinCanin` | Astro | ⚠️ sem licença | [demo](https://jardin-canin.vercel.app) | Hero bonito, mas o corpo é lorem ipsum. |
| `ricichien/nextjs-petshop` | Next.js | ⚠️ sem licença | sem demo | Mais estrelado do tema (10★). |

## B. Genéricos de alto acabamento — a recomendação de verdade

| Repo | ★ | Licença | Demo | Por que |
|---|---|---|---|---|
| `arthelokyo/astrowind` | 6.0k | **MIT** ✅ | [demo](https://astrowind.vercel.app) | **Primeira escolha.** Astro + Tailwind, várias variantes de landing, blog, SEO, dark mode, mantido ativamente. Troca de conteúdo é direta. |
| `mearashadowfax/ScrewFast` | 1.4k | **MIT** ✅ | [demo](https://screwfast.uk) | **Estruturalmente o mais parecido com pet shop**: serviços + produtos + blog + contato. Acabamento muito bom. |
| `cruip/tailwind-landing-page-template` | 4.5k | verificar | [demo](https://simple-light.vercel.app) | "Simple Light", Next.js. Tipografia e ritmo impecáveis; visual mais SaaS/clean. |
| `nobruf/shadcn-landing-page` | 1.3k | **MIT** ✅ | [demo](https://shadcn-landing-page.vercel.app) | Next + shadcn/ui + TS. Ótimo se você quer componentes reaproveitáveis entre vários clientes. |
| `ixartz/Next-JS-Landing-Page-Starter-Template` | 2.1k | **MIT** ✅ | — | Starter enxuto, bom ponto de partida. |
| `cssninjaStudio/fresh` | 670 | **MIT** ✅ | — | Astro, leve. |
| `PaulleDemon/awesome-landing-pages` | 1.0k | **MIT** ✅ | — | Coleção curada — bom para garimpar referência de seção. |
| `surjithctly/astroship` | 2.0k | ⚠️ **GPL-3.0** | — | Bonito, mas copyleft: **evite em trabalho de cliente**. |

## Licenças — o ponto que decide

- **MIT**: use, modifique e venda à vontade; só mantenha o aviso de copyright.
- **GPL-3.0** (`astroship`): obriga abrir o código derivado. Ruim para site de cliente.
- **Sem licença**: o padrão legal é *todos os direitos reservados*. Serve como
  **referência visual**, não para copiar código. Vale para quase todo o bloco A.

## Sugestão de caminho

Base **AstroWind** ou **ScrewFast** (MIT, acabamento alto) + a **estrutura de
seções e a copy em português do "Melhor Amigo"** + o **CTA de WhatsApp do
PetShop-Next**. Isso cobre os 10 leads da planilha que estão sem nenhuma
presença online.
