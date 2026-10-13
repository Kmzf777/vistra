# Referência 1: Reel "aniversário de 31 / saudade" (Victor ZK, videomaker)

> Estudo de análise. Nada deste vídeo entra nas peças da Vistra: nem pixels, nem fotos de família, nem o
> rosto do criador, nem a copy, nem as marcas que aparecem. Serve para aprender o **vocabulário de
> movimento**, o ritmo e a estrutura.

- **Link:** https://www.instagram.com/p/DbWVsyiNvoj/
- **Autor:** Victor ZK (`_victorzk`). É videomaker e editor, e a legenda do post se apresenta como um
  "vídeo de aniversário sobre saudade". As hashtags são de cinematografia e edição.
- **Duração:** 129,4 s (30 fps)
- **Aspecto:** 9:16, com 1080x1920 no arquivo baixado
- **Formato:** **mistura densa**. Tem live-action cinematográfico (criador em cena, objetos na mão, flat
  lays de cima) com muito motion por cima: kinetic type por sílaba, colagem 2D/3D, mural de cortiça em
  3D com câmera, máscaras de pixel, UI retrô e adesivos. Não é talking head no sentido clássico, porque ele
  quase não fala para a câmera. A narração (voz em off) conduz tudo. No terço final, o vídeo **troca de
  linguagem**: sai o kinetic type e entra a legenda simples, com luz escura e planos lentos.
- **Arquivos locais do estudo (temporários):**
  - vídeo: `C:\Users\rafae\AppData\Local\Temp\claude\C--Users-rafae-OneDrive-Desktop-PetShop-coldcall\24d7348f-d561-4e9b-9e96-cb0880008531\scratchpad\watch\watch-7bg_6sih\download\run-x72qk164\video.mp4`
  - áudio: `...\watch-7bg_6sih\audio.wav` (16 kHz, mono, para transcrever depois)
  - frames: `...\watch-7bg_6sih\frames\` (100 frames originais), `...\frames_dense\z_full_1fps_01..11.jpg`
    (folhas 6x2 a 1 fps, em que a folha *n* e a célula *i* dão t ≈ (n-1)·12 + i s) e folhas densas de 4 a 8 fps
    (`a_hook_*` 0–6 s, `b_cork_*`, `c_eye_*`, `f_eye_xp_*`, `g_bed_*`, `d_pixel_*`)
- **Cortes detectados (ffmpeg, scene > 0,3):** 58 cortes em 129 s. Nos primeiros 13 s há cortes a cada
  0,3–0,8 s (0,07 · 0,47 · 0,8 · 1,6 · 4,6 · 5,4 · 6,5 · 7,4 · 8,2 · 8,9 · 10,3 · 10,9 · 12,2 · 12,8 · 13,2).
  Depois de 93 s, os cortes ficam a 4–5 s um do outro.

---

## 1. Timeline cena a cena

Os tempos são aproximados (±0,5 s) e vêm das folhas a 1 fps e das densas.

| Tempo | Na tela | Tipo de asset | Movimento / transição |
|---|---|---|---|
| 0,0–0,8 | Bolo com velas "30", confete turquesa caindo, e as sílabas "re · cen · te · men · te" | Live-action (mesa, macro) + kinetic type por sílaba | Cada sílaba nasce num ponto e num tamanho diferentes ("re" grande no topo à esquerda, "cen" pequena à direita, "men/te" embaixo). Entram com **smear horizontal** (esticadas e borradas → nítidas) a cada ~3 frames |
| 0,8–1,4 | Mesma cena **girando** com zoom blur radial e **cores invertidas** por ~3–4 frames | Transição | **Whip-spin** de ~180° com inversão de cor (o texto fica navy no fundo claro) e volta. É o "hit" do hook |
| 1,4–2,0 | "completei" + peças **tetrominó** creme (formas de Tetris) + **sparkle amarelo** de 4 pontas com raios tracejados | Kinetic type + shapes 2D + adesivo | As peças surgem nas bordas, o sparkle faz pop com overshoot e os raios tracejados disparam para fora. O texto **sai colapsando numa linha tracejada** ("——·—·—") |
| 2,0–2,5 | As velas trocam de "30" para **"31"** (mesmo plano) | VFX (troca de objeto) | Morph rápido e borrado do número da vela |
| 2,5–4,5 | "não me sinto" → "um **adulto**"; uma mão **esmaga o bolo** | Live-action + kinetic type | As palavras empilham com escalas diferentes e "adulto" é a maior (ênfase por tamanho). Sparkles pequenos piscam ao redor da palavra-chave |
| 4,6–5,5 | **Mural de cortiça** com sombra de persiana; câmera avança através de tetrominós creme voando | Cena 3D (plano de cortiça + cards) | **Dolly-in em 3D** com parallax: peças grandes e desfocadas em primeiro plano, pequenas e nítidas atrás (DOF real) |
| 5,5–12,5 | Bilhetes que aparecem um a um na cortiça: fita crepe escrita a marcador, post-its, foto antiga circulada, cédulas | Colagem 3D (planos texturizados) + escrita à mão | A câmera **inclina e passeia** entre os grupos de bilhetes (tilt de 10–25°). Cada bilhete entra com pop e leve rotação. Círculos e setas a caneta **se desenham** (write-on). Há um rack focus entre os grupos |
| 12,5–15,5 | Mão segurando potes rotulados (tipo farmácia), depois um joinha | Live-action + kinetic type | O texto é **ondulado** (warp de onda por letra). Corte seco |
| 15,5–16,5 | Céu com nuvens dentro de um olho de vinil e um **globo ocular** em halftone | Colagem 2D + textura halftone | Zoom/rotação radial. O fundo vira um **túnel** de zoom blur vermelho e azul |
| 16,5–18 | Papel creme halftone, recorte de olho com borda rasgada, palavras em **tinta vermelha escorrida** e tetrominós **pretos** | Colagem 2D | Os recortes entram em stop-motion (2–3 frames por posição) e o texto "gotejando" se escreve |
| 18–20 | Criador com cabos de rede na mão; um **ícone de navegador antigo** e uma janelinha com botões ✕ surgem com raio elétrico | Live-action + UI retrô + FX | Lente grande-angular (selfie), o objeto vem para a câmera e o raio pisca 2–3 frames |
| 20 | Close do criador com cara de espanto | Live-action | Punch-in (zoom digital) |
| 20,5–23,5 | Wallpaper de colina verde **pixelado** + card de rede social antiga + janela de bloco de notas com a palavra "transição" + janelas de mensageiro | Mockups de UI retrô (2D) | **Dissolve em mosaico de pixels** (blocos quadrados aparecem e somem em ordem aleatória). As janelas entram com escala e desfoque, e uma delas tem a piada metalinguística de escrever "transição" |
| 24–27 | Mão entra com um objeto em frente a um fundo fixo: fita VHS → DVD → logo de streaming | Live-action (troca de objeto) | **Match-cut por objeto**: mesmo enquadramento e mesma mão, só o objeto muda a cada ~0,8 s |
| 28–32 | Tampo **azul com grid branco** (estilo cutting mat) visto de cima, com uma ficha pautada presa por fita, CD → fone → MP3 → celular | Flat lay + escrita à mão | A ficha **se escreve letra a letra**, com rasura que vira a palavra seguinte ("CD-", "CD-1", "CD-R" sublinhado). Os tetrominós brancos e desfocados atravessam a frente. O objeto troca por stop-motion |
| 33–35 | Parede com relógio, a mão troca um celular antigo por um smartphone | Live-action + kinetic type | Match-cut por objeto + palavra-chave grande |
| 36–37 | Flat lay em toalha xadrez laranja com eletrônicos antigos, e "tudo isso" / "ok!" | Flat lay + type | Pop do texto com um sparkle |
| 38–40 | Volta à cortiça: bilhetes riscados com X a caneta | Colagem 3D | Rabisco **write-on** riscando a palavra. Câmera lenta |
| 41–43 | Criador ninando uma "trouxa" de cobertor como um bebê; plongée com o rosto dele embrulhado | Live-action (humor) | As palavras empilham por sílaba. Corte cômico |
| 44–49 | Escritório escuro com estatueta dourada; uma porcentagem e a palavra "imposto" | Live-action com luz motivada | Texto curvado em arco e sílabas de tamanhos misturados ("im**pos**to"). Dinheiro jogado no ar |
| 50–51 | Criador em pé em frente a quadros; **troca de roupa em jump cut** (preto → verde) | Live-action | Jump cut no mesmo enquadramento, com kinetic type em volta do corpo |
| 52–54 | Prédio azul **recortado em pixel**; "sair à noite" | Colagem (máscara pixelada) | A máscara em degraus revela a cena |
| 55–59 | Relógio vermelho: plano aberto → macro dos números → relógio sobre cobertor | Live-action macro | Rack focus e macro lento. As palavras ficam pequenas e soltas |
| 60–63 | Cortiça com sombra de janela e fita crepe com palavras a pincel; **aparecem as legendas simples** | Type manual + legenda | Os pedaços de fita entram em stop-motion. Primeira aparição da legenda neutra (sans pequena, branca, centralizada) |
| 64–67 | Colagem: céu + bloco vermelho, criador recortado; **máscara em blob ondulado** (borda navy) mostrando um vídeo dele no celular; "10 anos" com sparkles | Colagem 2D com máscaras | Recortes com contorno grosso. Parallax leve entre as camadas |
| 68–71 | Mãos segurando um caderno escrito "livro de lembranças" sobre pano vermelho; caderno com letras vermelhas grandes | Live-action top-down | Lento. A ficha passa para o caderno |
| 72 | Criador na cama com uma **pill azul "23:59 🛏"** | Live-action + UI pill | A pill entra com pop |
| 73–74 | Mesmo plano dentro de uma **máscara circular** sobre grid azul; post-its amarelos voando; a pill muda para "00:00" | Máscara + grid + stickers | Os post-its giram em 3D e desfocados na frente |
| 75–77 | Máscara circular sobre **grid amarelo**, pill branca "00:01 ☀", roupa social; **cards azuis "Entrega"** voando | Máscara + cards 2D/3D | **Troca de cor do fundo** como transição de tempo (noite → manhã). Os cards entram em parallax com rotação |
| 78–79 | Plano de cima no sofá jogando videogame (vira de posição com jump cut) | Live-action | Jump cut com o texto fixo |
| 80–82 | Grid amarelo com **máscara pixelada azul** que revela um prato de comida (hambúrguer → massa) | Máscara pixel + stock/AI food | A máscara cresce em blocos e depois **desliza para fora à esquerda** com motion blur |
| 83–86 | Vídeo de corrida num **retângulo arredondado** com borda irregular sobre grid amarelo; stats de app de corrida | Card de vídeo + overlay de dados | Os números entram com blur (borrados → nítidos) |
| 87–88 | Mão segurando uma **TV vermelha** na frente de cortina vermelha; os olhos do criador na tela com textura de scanline | Live-action composto + textura CRT | Sparkles e kinetic type por sílaba |
| 89–92 | **Scrapbook**: fotos de infância, letras vermelhas grandes a pincel, estrelas recortadas, corações | Live-action top-down + fotos | **Whip pans** com motion blur entre as páginas |
| 93–129 | Ambiente escuro, luz dura, plantas e pano vermelho; toca-discos; o criador lê o caderno e escreve; card com a frase da mãe | Live-action cinematográfico | **Planos de 3–5 s**, só com a legenda simples. Uma única palavra em kinetic volta em ~103 s (ênfase pontual) |
| 124–129 | Caderno com a frase final a pincel vermelho, a página vira, e a capa "livro de lembranças" | Live-action top-down | **Bookend**: o vídeo fecha no mesmo objeto que abriu o ato 2. Não há CTA explícito |

---

## 2. Sistema visual

### Fundos (cada bloco tem o seu "tampo")
| Fundo | Cor (hex estimado) | Uso |
|---|---|---|
| Cortiça com sombra de persiana | cortiça `#B8692A`, sombras `#3A1E0E`, listras diagonais | Ato 1, a "investigação" dos marcos da vida |
| Grid azul (cutting mat) | base `#1C3FA8`, linhas `#C9D6FF` a ~50% de opacidade, células de ~1/14 da largura | Objetos de tecnologia vistos de cima |
| Grid amarelo | base `#E6C53A`, linhas `#1F3550` com 2 px, células de ~1/14 da largura | Rotina adulta, máscaras circulares e pixeladas |
| Grid azul-escuro dentro da máscara | `#123A7A` com linhas claras | Interior das máscaras pixeladas |
| Papel creme halftone | `#E9E4D6` com pontilhado `#00000022` | Colagem "olho" |
| Pano vermelho | `#6E0B0B` a `#9A1414`, com vinheta forte | Ato final (emoção) |
| Céu de nuvens | `#2A8FC8` / `#FFFFFF` | Colagens de memória |

### Formas
- **Tetrominós** (formas de Tetris: T, L, S, quadrado) em creme `#EFE9DA` com linhas internas finas que
  marcam os 4 quadrados. Os cantos são **retos** (raio 0). Ficam soltos no espaço 3D e desfocados por
  profundidade. Na colagem clara, aparecem em versão **preta** `#1A1A1A`.
- **Sparkle de 4 pontas** amarelo `#F2D22E` (estrela côncava), com 4–6 **raios tracejados** que disparam
  para fora. Também usa cruzinhas "+" pequenas.
- **Fichas pautadas** (branco com linhas azuis e margem vermelha), **fita crepe** semitransparente com borda
  rasgada, **post-its** (amarelo `#E8D66A`, ciano `#5BC0C9`, rosa `#E8707A`), **alfinetes** coloridos.
- **Máscaras:** círculo perfeito, blob em **degraus de pixel** (preso à grade), blob **ondulado/scalloped**
  com contorno navy grosso de ~12 px, retângulo de cantos irregulares (~40 px de raio, "recortado à
  tesoura"), moldura de TV vermelha.
- **Pill de UI:** cápsula com raio total (azul `#1E4FD0` com texto branco, ou branca com texto escuro),
  horário em sans tabular e um ícone pequeno.

### Paleta geral
Os primários vêm "de papelaria", saturados mas sujos: azul royal `#1C3FA8`, amarelo `#E6C53A`, vermelho
`#C8102E`, creme `#EFE9DA`, navy `#14213D`. Os acentos são o amarelo sparkle `#F2D22E` e o turquesa do
confete `#4CC3C9`. Tem **grão de filme** e uma gradação quente (pele alaranjada, sombras azuladas e
esverdeadas).

### Tipografia
1. **Display de kinetic type:** sans **arredondada, pesada e larga** (estilo "Fredoka/Baloo/Cooper
   moderna", com terminais redondos e contraformas pequenas). É sempre **minúscula**, em creme `#F3EEE2`
   sobre vídeo e em navy `#1B1B3A` nos frames invertidos. Não usa contorno, mas tem uma sombra muito sutil.
   - **Ênfase por tamanho, não por cor:** a palavra-chave fica 2–3x maior que as vizinhas (exemplos:
     "um / **adulto**", "não / **tenho**", "im**pos**to").
   - **Quebra por sílaba**, com sílabas em linhas e alinhamentos diferentes, formando um bloco
     irregular (exemplo: "che / gar / **da** / escola"). Encaixa no vazio do enquadramento, ao lado do
     rosto ou do objeto.
   - Tamanho: palavra comum com ~5–7% da altura do frame e palavra-chave com ~10–14%.
   - Às vezes vem **curvada em arco** ou com **warp de onda** por letra.
2. **Escrita à mão** (marcador/pincel) em vermelho `#C8102E` e preto, dentro dos objetos (fitas, fichas,
   cadernos). Ela **se escreve** na tela (write-on) e às vezes rasura e corrige.
3. **Legenda neutra** (ato final): sans geométrica tipo **Poppins Medium**, branca, com ~2,2% da altura,
   centralizada em ~70% da altura e em caixa normal. Não tem fundo, só uma sombra leve. Não anima: troca
   por corte junto com a fala.

### Posição do texto
Não tem uma zona fixa no kinetic type: o texto procura o espaço negativo. A legenda neutra fica sempre no
mesmo lugar (terço inferior, um pouco acima da UI do Instagram).

---

## 3. Tipos de asset e como cada um anima

| Asset | Animação |
|---|---|
| Kinetic type por sílaba | Entra com **smear horizontal** (scaleX ~1,6→1, blur 10→0 px e x ±40 px), uma sílaba a cada 2–4 frames. Sai **colapsando em linha tracejada** (scaleY→0,1 e as letras viram traços) em 4–6 frames, ou corta junto com a cena |
| Sparkle amarelo | Pop 0→1,2→1 com rotação de ~20°, os raios tracejados se desenham para fora (strokeDashoffset) e somem em ~12 frames. Funciona como "acento" em cima da palavra-chave e marca o beat |
| Tetrominós | Flutuam em 3D (posição z variada), giram devagar e passam pela câmera durante o dolly. Têm DOF forte |
| Bilhetes e fotos na cortiça | Pop com overshoot e rotação de ±5–10°, com sombra projetada real (luz da persiana por cima). Círculos e setas a caneta se desenham em 6–10 frames |
| Ficha pautada | Write-on letra a letra, com rasura e correção, como piada visual |
| Objetos na mão (VHS, DVD, celular) | Match-cut: o mesmo enquadramento e a mesma mão trocam o objeto em sequência rápida |
| UI retrô (janelas, ícones, card de rede social) | Escala 0,9→1 com blur que sai, e leve flutuação. A janela de bloco de notas com a palavra "transição" funciona como transição (metapiada) |
| Pill de horário | Pop. O número muda (23:59 → 00:00 → 00:01) e o fundo do grid troca de cor para contar a passagem do tempo |
| Cards "Entrega" | Voam em 3D na frente do sujeito, girando, com parallax e desfoque de profundidade |
| Máscara pixelada | Cresce em blocos presos ao grid (stagger aleatório/radial) e sai **deslizando lateralmente** inteira, com motion blur |
| Máscara circular | Recorta o vídeo do criador sobre um grid colorido e se mantém. Funciona como palco |
| Overlay de dados (stats de corrida) | Linhas de número entram com blur → nítido, em stagger |
| Fotos antigas | Grão, desbotado, círculo de destaque desenhado à mão por cima |
| Legenda neutra | Corte seco a cada frase (2–4 palavras) |

Ele **não usa** bolhas de chat, telefone em 3D, gráficos nem cursor. O vídeo é de storytelling pessoal.

---

## 4. Linguagem de movimento

- **Easing:** quase tudo é **spring com overshoot curto** (pop de ~6–10 frames) ou **ease-out exponencial
  com motion blur** (smear). Não tem nada linear, a não ser a flutuação lenta dos tetrominós.
- **Durações (30 fps):** a entrada de uma sílaba leva 4–6 f; o stagger entre sílabas é de 2–4 f; o pop do
  sparkle, 8–12 f; o colapso de saída, 4–6 f; o whip-spin, ~10 f; o dissolve de pixel, 12–20 f.
- **Câmera:**
  - **dolly 3D na cortiça** com tilt e parallax (os planos de bilhete e os tetrominós ficam em z
    diferentes);
  - **whip-spin** (rotação no eixo Z com zoom blur radial e inversão de cor) no hook;
  - **zoom blur / túnel** na entrada da colagem do olho;
  - **whip pan** lateral no scrapbook;
  - **punch-in** digital em close de reação;
  - grande-angular "selfie" com objeto vindo para a lente.
- **Transições:** corte seco na batida (a maioria), whip-spin, dissolve em mosaico de pixel, máscara
  pixelada que entra e sai deslizando, match-cut por objeto e por enquadramento (troca de roupa, troca de
  objeto), troca da cor do fundo com o mesmo sujeito.
- **Sound design (inferido pelos hits visuais):** um whoosh/reverse no whip-spin; um "plim/ding" em cada
  sparkle; pops de papel nos bilhetes; marcador rabiscando nos write-ons; um glitch ou ruído de modem na
  sequência de UI retrô; a música troca de energia em ~60 s e de novo em ~93 s (fica mais calma, com
  piano ou pads). O áudio está em `audio.wav` para confirmar.

---

## 5. Ritmo

- **Média geral:** ~2,2 s por corte (58 cortes em 129 s), mas a sensação é de **mudança a cada 0,5–1 s**
  nos primeiros 60 s, porque dentro do mesmo plano entram sílabas, sparkles, bilhetes e objetos.
- **Três marchas:**
  1. **0–60 s, frenético e cômico:** a lista de comparações ("meus pais tinham X, eu tenho Y"). São de 1 a
     3 eventos por segundo.
  2. **60–93 s, médio:** a colagem e a rotina adulta, com máscaras, grids e pills. Fica em ~1 evento por
     segundo.
  3. **93–129 s, lento e emocional:** planos de 3–5 s, a legenda neutra e a luz escura. A desaceleração
     é o próprio recurso dramático.
- O vídeo **respira** nos close-ups de reação (0,5–1 s sem texto) e no ato 3 inteiro.

---

## 6. Hook e estrutura narrativa

- **Hook (0–3 s):** em 3 s ele entrega a premissa: a sílaba "re-cen-te-men-te" gira com inversão de cor,
  as velas mudam de 30 para 31 e entra o conflito ("não me sinto um adulto") com o bolo esmagado. O
  primeiro segundo tem **movimento máximo** (spin + inversão) e prende pelo choque visual. A frase
  completa só fecha no segundo 4.
- **Estrutura:**
  1. Premissa: fez 31 e não se sente adulto.
  2. Comparação com os pais na mesma idade (mural de cortiça, a "investigação").
  3. A geração dele: tecnologia que mudou (VHS → streaming, CD → app), o humor da imaturidade e os
     boletos.
  4. Virada: "tempo retrospectivo", a sensação de que tudo passou rápido.
  5. A rotina adulta contra o que era bom na infância (máscaras, grids e scrapbook).
  6. Clímax emocional: a frase da mãe, gratidão e saudade.
  7. Fecho: o caderno "livro de lembranças" (bookend). **Não há CTA**, e o post funciona como peça de
     portfólio e de branding pessoal.

---

## 7. Como reproduzir no Remotion / three.js (para a Vistra)

Os parâmetros consideram 30 fps e 1080x1920. A ideia é pegar o **vocabulário**, não a estética
"nostalgia". Para a Vistra, o grid e os cards viram o mundo do atendimento (WhatsApp, horários, pedidos).

### Primitivos 2D (Remotion)
1. **`<SyllableType words=[{text, syll:["re","cen","te"], emphasis, x, y, scale}] />`**
   - Hifenização manual em pt-BR (lista, não algoritmo) e layout em bloco irregular, com a escala por
     sílaba definida no roteiro.
   - Entrada: `spring({damping: 14, stiffness: 220, mass: 0.6})` em 5–6 f, com scaleX 1.6→1,
     `filter: blur(10px→0)` e translateX 40→0. Stagger de 3 f.
   - Saída "colapso": em 5 f, scaleY 1→0.08 e uma camada de traços (`border-bottom: dashed`) que
     aparece no lugar.
   - Fonte: alternativa licenciada da Google Fonts com o mesmo espírito (Fredoka 600/700 ou Baloo 2
     800), sempre em minúsculas e na cor creme. **Confirmar com o manual da marca da Vistra** antes,
     porque, se a marca tiver fonte própria, ela vence.
2. **`<SparkleBurst at={frame} color="#F2D22E" rays={5} />`**: estrela côncava em SVG. Usa
   `spring({damping: 9, stiffness: 260})` para escala 0→1.2→1 e rotação 0→20°. Os raios são `<line>`
   tracejadas com strokeDashoffset animado em 6 f e opacidade 1→0 de 8 a 14 f. Sincronizar com o "ding"
   da trilha.
3. **`<WriteOn path|text font="marker" />`**: write-on de escrita à mão via `strokeDasharray` (SVG a partir
   de uma fonte handwriting convertida em path, ou um path desenhado). Leva 1,5–2 f por letra e tem um
   modo "rasura" (risca e reescreve), útil para "antes/depois".
4. **`<GridBackground base="#1C3FA8" line="#C9D6FF" cell={77} />`** (1080/14). Temos variante azul e
   amarela. Trocar a cor do grid **com o mesmo sujeito na frente** funciona como transição de tempo.
5. **`<PixelMask cells progress origin="center|random" />`**: máscara presa ao grid. Cada célula acende
   com atraso `delay = dist(origem) * 0.6f + rand(0..3f)` e o total fica em 12–18 f. A saída é a máscara
   inteira deslizando em x por 10 f com `Easing.in(Easing.exp)` + motion blur (`@remotion/motion-blur`,
   CameraMotionBlur com 6–8 samples).
6. **`<CircleStage />` e `<BlobStage variant="scallop|pixel|torn" stroke="#14213D" />`**: o palco onde
   entra o vídeo ou o mockup, com contorno grosso opcional.
7. **`<StatusPill text="23:59" icon="moon" />`**: cápsula com pop de 8 f e troca de dígitos com rolagem
   vertical (cada dígito desliza em 4 f). **Uso Vistra:** "23:59 · cliente chamou" → "23:59 · respondido
   em 4 s". É o melhor gancho para mostrar o atendimento 24 h.
8. **`<FlyingCard label="Pedido" color="#1E4FD0" />`**: cards 2D com rotate3d, parallax e blur por
   profundidade. Para a Vistra, viram mensagens e pedidos chegando ("Novo pedido", "Agendamento").
9. **`<WhipSpin>`**: transição de 10 f com rotate 0→180° (ease-in até f5) mais um corte, e o próximo
   plano gira de -180→0 (ease-out). Usa zoom blur radial (shader ou várias cópias com scale e opacidade)
   e `filter: invert(1) hue-rotate(180deg)` nos f 3–6. Vale usar **uma vez**, no hook.
10. **`<DashCollapse>`**: a saída padrão dos textos (item 1).
11. **`<Subtitle mode="neutral" />`**: Poppins 500, 2,2% da altura e y = 70%, com corte por frase. Fica
    para o trecho emocional, como depoimento ou "o que o dono do pet shop sente".
12. **Finishing:** grão de filme (overlay de vídeo de grain ou ruído SVG animado), vinheta e gradação quente
    em LUT ou CSS (`contrast(1.05) saturate(1.1)` + overlay laranja e azul). O halftone da colagem sai
    de um padrão de pontos em SVG com `mix-blend-mode: multiply`.

### Primitivos 3D (react-three-fiber dentro do Remotion via `@remotion/three`)
13. **`<BoardScene>`**: um plano de "mural" (cortiça ou, para a Vistra, um quadro de grid) com textura e
    uma **sombra de persiana** feita por um spotlight com `gobo` (textura de listras) ou por um plano de
    sombra com alpha. Os bilhetes e cards são planos com texturas (fichas, prints de conversa do WhatsApp
    que **nós** produzimos) e `castShadow`.
    - Câmera: o caminho é uma spline com 3–5 pontos (um por grupo de bilhetes) e tilt de 10–25° em X. Entre
      os pontos, uma interpolação com `Easing.inOut(Easing.cubic)` em 20–30 f, segurando 20–40 f em cada
      grupo.
    - Entrada de bilhete: `spring({damping: 12, stiffness: 180})` em z (+0,3 → 0), escala 0,8→1 e
      rotação Z aleatória de ±6°.
14. **`<FloatingTetrominoes count={14} />`**: instanced meshes (BoxGeometry fina com textura creme e linhas)
    com z entre -3 e +2 relativo ao plano e rotação lenta (0,2–0,5 rad/s). O DOF sai de
    `@react-three/postprocessing` `<DepthOfField focusDistance bokehScale={4}>` ou de blur manual por
    camada. **Para a Vistra**, as peças viram balõezinhos de chat creme ou quadradinhos da marca, sem
    copiar o Tetris.
15. **Rack focus:** animar o `focusDistance` entre dois grupos em 12 f.

### Receita de ritmo para a Vistra (Reel de 30–45 s)
- 0–3 s: hook com movimento máximo (WhipSpin + SyllableType com a dor do cliente, por exemplo
  "per-deu o cli-en-te").
- 3–20 s: "investigação" em BoardScene (os problemas do atendimento manual como bilhetes, com
  write-on e rasura), com 1–2 eventos por segundo.
- 20–35 s: grid colorido + CircleStage + StatusPill mostrando o atendente de IA respondendo de madrugada,
  com FlyingCards de pedidos chegando.
- Final: **desacelerar** (Subtitle neutral, plano mais longo) e fechar no mesmo objeto do começo
  (bookend). Diferente da referência, **nós precisamos de CTA** (sem preço público, conforme a regra da
  marca), por exemplo "chama no WhatsApp".

---

## 8. O que NÃO copiar

- O rosto, a casa, as fotos de família e de infância, os objetos pessoais e o boné com a marca que o
  criador usa.
- A **copy** (as frases sobre aniversário, pais, saudade e a frase da mãe) e o conceito "livro de
  lembranças".
- Os logos e as UIs de terceiros que aparecem (rede social antiga, mensageiro, navegador, streaming,
  música, app de corrida, álbum de figurinhas de futebol, cédulas de dólar). Na Vistra, mockup de UI só
  de **WhatsApp genérico/nosso**, desenhado por nós e dentro das regras de uso da marca Meta.
- O **layout exato** da cortiça com persiana e tetrominós creme. Adaptar para a identidade da Vistra
  (cores, forma e fonte da marca) em vez de clonar a combinação "cortiça + Tetris + sparkle amarelo".
- A estética "nostalgia anos 2000" como tema: aqui ela é conteúdo pessoal dele, e para a Vistra o tema é
  atendimento e negócio local.
