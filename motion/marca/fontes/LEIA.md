# Fontes da Vistra

A fonte da marca é a **Inter** (Google Fonts, licença SIL Open Font License 1.1, uso comercial livre).

- **Títulos (manchete):** Inter **900** (Black). O `identidade.json` pede o arquivo
  `Inter-Black.ttf` nesta pasta. Ele **ainda não está aqui**: coloque antes do primeiro render,
  senão o motor para com o erro "identidade.json pede motion/marca/fontes/Inter-Black.ttf".
  Baixe de https://fonts.google.com/specimen/Inter (ou do repositório oficial rsms/inter) e salve
  o peso Black com esse nome exato. Guarde o `OFL.txt` junto.
- **Corpo:** Inter 700, que já vem empacotada no motor (`"arquivo": null`). O manual da marca usa
  400/500 no texto corrido de páginas; em vídeo, legenda e texto de cena ficam em 700 para ler no
  celular.
- **Dado (números, horários, preços em tela):** IBM Plex Mono 500, padrão do motor. A Vistra não
  tem fonte mono própria; é decisão de motor, troque se a marca definir outra.

Alternativa sem baixar nada: trocar `fontes.manchete` no `identidade.json` para
`{"familia": "Archivo Black", "arquivo": null, "peso": 400}` (padrão do motor). Funciona, mas foge
da marca, que usa Inter 800/900 nos títulos.
