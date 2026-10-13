# Referência 2: Reel "Criativos" (Oto Criativo, motion design)

> Estudo de análise. Nada deste vídeo (pixels, marca, coruja, copy) entra nas peças da Vistra.
> Serve para aprender o **vocabulário de movimento** e a estrutura.

- **Link:** https://www.instagram.com/reel/DPNUCY0Ed4U/
- **Autor:** Oto Criativo, um estúdio de motion design que vende "criativos" (vídeos de anúncio)
- **Duração:** 27,7 s (30 fps, 831 frames)
- **Aspecto:** 9:16 (o arquivo baixado é 360x640; o original deve ser 1080x1920)
- **Formato:** **só motion** (kinetic type + mockups de UI). Sem talking head, sem filmagem e sem stock.
  Usa vídeo de portfólio dentro de cards de celular. Tem áudio contínuo o tempo todo (sem silêncio
  > 0,3 s a -35 dB; média de -16 dB): provavelmente narração em voz + trilha + SFX. Não transcrevemos.
- **Arquivos locais do estudo (temporários):**
  - vídeo: `C:\Users\rafae\AppData\Local\Temp\claude\...\scratchpad\watch\watch-hfxc5_7t\download\run-3y35iiwo\video.mp4`
  - áudio: `...\watch-hfxc5_7t\audio.wav` (16 kHz, mono)
  - folhas de frames: `...\watch-hfxc5_7t\frames_dense\sheet_01..10.jpg` (8 fps) e `z_*.jpg` (20 fps nas transições)

---

## 1. Timeline cena a cena

| Tempo | Na tela | Tipo de asset | Movimento / transição |
|---|---|---|---|
| 0,00–0,12 | Branco puro | — | Frame de respiro antes do hook |
| 0,12–0,65 | "Tá precisando" preto, centralizado | Kinetic type | As palavras entram com **blur → nítido** e um leve deslocamento lateral. Saem com fade/blur |
| 0,75–1,15 | "Criativos" cinza com **eco empilhado** (3–4 cópias embaixo, cada vez mais claras) + **card de celular branco** com ícone de pause subindo à frente | Texto em echo + phone card 2D | O card sobe com spring (escala 0,9→1) e com sombra. O eco do texto "desce" em cascata (stagger de ~2 frames por cópia) |
| 1,15–1,30 | O card **morpha** num retângulo verde que encolhe até virar uma pill/barrinha | Shape morph | Escala e border-radius animados, com troca de cor de branco para verde. Essa é a ponte para a próxima cena |
| 1,30–2,35 | Tela de "Pix enviado": check verde num círculo, **valor contando** R$0 → R$82, "Sobre a transação", data e horário. Moedas "$" em círculos cinza flutuam e crescem ao redor | Mockup de UI de app (banco) + contador + ícones em badges circulares | A pill vira o círculo do check (morph). Contador numérico com ease-out. As linhas de detalhe entram com blur. Os badges "$" fazem **parallax e scale** (um grande sai pela borda superior direita, um pequeno à esquerda) |
| 2,35–2,60 | Fade para branco | — | Dissolve com blur |
| 2,60–3,30 | "Então você chegou no" | Kinetic type | **Revelação palavra a palavra da esquerda para a direita**: cada palavra nasce desfocada e em cinza claro e assenta em preto |
| 3,30–3,40 | Corte para **fundo preto** | — | Inversão branco → preto (flash cinza de 1 frame) |
| 3,40–3,85 | "lugar certo" branco + **arco branco girando** embaixo (loader) | Kinetic type + traço SVG | Arco (stroke ~3 px com ponta arredondada) gira em volta. "lugar" esmaece e "certo" fica |
| 3,85–4,10 | Preto, com um borrão de texto entrando | — | Transição com motion blur forte |
| 4,10–4,50 | "Criativo(s)" entra **rotacionado (~-15°) e curvado**, e as letras finais saltam de baseline ("tiv**os**" sobem em onda) | Kinetic type com efeito por letra | Rotação → 0° com spring e overshoot leve. Onda de baseline por letra |
| 4,50–5,10 | "Criativos" + "A partir de:" (pequeno, cinza) | Type | Assenta e segura uns 15 frames |
| 5,10–5,30 | **Moedas 3D** (prata, com DOF) cruzam a frente da câmera, com glow verde e partículas | Objetos 3D (ou render) + luz | Câmera "atravessa" as moedas. Desfoque de profundidade forte |
| 5,30–6,10 | "R$**180**,00" gigante: "18" branco, "0" verde neon, centavos verdes pequenos sobrescritos, e um **feixe de luz verde** vertical por trás | Preço em kinetic type + light leak | O número entra com motion blur. A luz verde varre da direita. Moedas desfocadas em primeiro plano |
| 6,10–6,30 | Tela cinza (flash) → branco | — | Whip com blur e fade para cinza claro |
| 6,30–7,10 | "Você garante anúncios", revelação palavra a palavra, com **cards cinza-claro (#EFEFF1) arredondados** grandes flutuando atrás em parallax | Type + placeholders de card | Os cards deslizam devagar em profundidades diferentes (camadas). Isso cria profundidade sem conteúdo |
| 7,10–7,70 | "Com edição": "Com" cai em blur e "edição" fica | Type | Palavra anterior desfoca e some, e a seguinte ganha foco (rack focus tipográfico) |
| 7,70–8,40 | Título "Profissional" acima de um **card de celular** com UI de app de mobilidade (lista de motoristas com botões Recusar/Aceitar verde-limão). Um **ponto verde** embaixo do card | Phone card com tela de portfólio | O card surge com scale + fade. A UI interna rola, um item novo entra |
| 8,40–9,40 | **Carrossel horizontal**: o card desliza para a esquerda e entra "Dinâmica" (mapa do Brasil laranja com pins de seta) | Carrossel de cards | Slide horizontal com spring. O card que sai fica parcial na borda esquerda. Os pins aparecem com pop em stagger |
| 9,40–10,60 | Próximo card: "Extrema qualidade", tela escura com ícones de pessoa em vermelho neon e **contador "49 → 80 VENDAS"** | Card + contador + glow | O card entra pela direita desfocado e assenta. O título ganha uma palavra ("Extrema" → "Extrema qualidade"). O contador tem flicker. O conjunto sai com blur + fade |
| 10,60–10,90 | Branco | — | Respiro |
| 10,90–11,70 | "Tudo no estilo Apple", palavra a palavra | Type | Mesma revelação blur→nítido |
| 11,75–12,80 | "Efeitos sonoros" + "exclusivos" com **letter-spacing largo** + **toggle iOS azul** e pills azuis espalhadas | UI kit (toggle, pills) | As pills entram de fora com velocidade e se agrupam em volta do texto. O toggle liga (knob desliza). A saída é com blur de movimento |
| 12,80–13,60 | Folha "Roteiro" (PDF): card preto com texto e marca-texto verde-limão, tag "PDF" | Mockup de documento | Entra do blur com leve escala. Fica pouco tempo e sai em blur |
| 13,60–14,40 | Ícone de alto-falante em badge circular + **waveform** (barras pretas, ponta verde) + "e narração já inclusos" | Ícone 3D/emoji + waveform | O badge cresce e migra pela tela (parallax). As barras da waveform pulsam com o áudio. O texto se revela palavra a palavra |
| 14,40–15,30 | "Pra deixar o seu projeto ainda mais..." | Type | Revelação palavra a palavra, e o **fundo vai escurecendo** de branco a cinza-chumbo (#5A5A5E). É tensão antes do clímax |
| 15,30–15,40 | Flash branco | — | Corte seco, provavelmente com batida no áudio |
| 15,40–16,20 | Logo (coruja) + "Profissional" com **eco empilhado** + **balão de fala preto** com "Profissional" que gira (~-25°) até 0° | Type echo + speech bubble 3D-ish | O balão entra girando e desfocado e assenta com overshoot. A sombra elíptica embaixo dá falsa 3D |
| 16,20–16,50 | Tudo desfoca e some | — | Blur-out |
| 16,50–17,10 | "E o melhor" | Type | Palavra a palavra |
| 17,10–19,40 | **Chat estilo iMessage**: cabeçalho "iMessage / Hoje 9:45", bolha azul "Upando agr..", bolha cinza "MAIS JÁ? OXE", bolha azul com **arquivo "Criativo Completo.mp4"**, emoji 🤩 e brilhinho ✨ | Mockup de chat | As bolhas nascem do canto do remetente com scale de 0→1 e overshoot, uma por vez (cerca de 12–18 frames entre elas). A bolha anterior sobe. O emoji faz pop |
| 19,40–19,60 | Branco | — | Fade |
| 19,60–20,40 | "Preço acessível" + badges circulares com 💵 entrando/saindo pelas bordas | Type + emoji badges | O texto vai de blur a nítido. Os badges fazem parallax e scale |
| 20,40–21,10 | "Qualidade" + ✅ em badge | Idem | Idem |
| 21,10–22,00 | "Segurança" + 🔒 e 🔑 em badges | Idem | Idem. Saída com scale-down + blur |
| 22,00–23,00 | **Botão "Saiba mais"** (pill azul) com **anel de stroke azul se desenhando** em volta + **cursor circular cinza** que entra por baixo e clica | Botão UI + cursor fake | O stroke se desenha (draw-on). O cursor sobe com ease-out. No clique o botão encolhe (~0,85) e some |
| 23,00–24,20 | Card de celular branco à esquerda + "E venha fazer o **seu criativo**" (segunda linha em preto) + **seta curva desenhada** apontando para o celular | Phone card + seta SVG draw-on | O texto entra pela direita. A seta se desenha. O destaque fica por contraste de cor (cinza → preto) |
| 24,20–24,90 | "Tô te esperando aqui 👀" | Type + emoji | Palavra a palavra, com blur |
| 24,90–26,30 | Logo da coruja preto centralizado | Logo | Estático (segura cerca de 1,4 s) |
| 26,30–27,70 | Wordmark "OtoCriativo" | Logo | Troca seca e depois fade-out no fim |

---

## 2. Sistema visual

- **Fundo:** branco quase puro, de **#FFFFFF a #F7F7F8**. Nas cenas de carrossel fica cinza-gelo **#EEEEF0**.
  Só duas exceções escuras: o bloco do preço (preto #000 com luz verde) e o escurecimento antes do clímax.
  É a regra "claro, com um momento escuro para o preço".
- **Grid:** nenhum grid visível. Tudo é **centralizado** no eixo vertical, com o texto em cerca de 48–50% da
  altura. Os mockups ocupam entre 45% e 55% da largura.
- **Formas:**
  - Cards de celular com raio grande (~10–12% da largura do card) e **sem stroke**. A separação vem só de uma
    sombra muito suave e do tom (#FFFFFF sobre #F2F2F4).
  - Placeholders de fundo: retângulos #EFEFF1 com raio de ~16 px, em camadas.
  - Pills e botões: raio total (cápsula).
  - Badges de ícone: círculo cinza #F0F0F2 com o ícone ou emoji dentro.
  - Traços: o arco do loader, o anel do botão e a seta curva têm stroke de 3–4 px a 1080p, com `linecap round`.
- **Paleta (estimada):**
  - Texto principal **#111111**. Texto secundário e eco **#8A8A8E**, que vai até #D0D0D4.
  - Verde de sucesso/dinheiro **#22C55E / #1DB954**. Verde neon do preço **#39FF6A**.
  - Azul iOS **#2F8CFF / #3B82F6** (toggle, bolhas, botão).
  - Verde-limão das UIs de portfólio **#D4FF3A**. Laranja **#F26B2A** e vermelho neon **#FF2A2A** vêm do
    portfólio e não fazem parte do sistema.
- **Tipografia:** uma sans **geométrica arredondada** (parecida com Gilroy, Satoshi ou Plus Jakarta Sans), em
  **Semibold/Bold**, sempre em caixa baixa com inicial maiúscula (sentence case). Não tem CAIXA ALTA, exceto no
  "VENDAS" do portfólio e no "MAIS JÁ? OXE" do chat.
  - Tamanho: a frase corrida tem cap-height de ~3,5–4% da altura (≈ 56–64 px a 1080x1920). Palavras-chave
    soltas, como "Criativos" e "Profissional", ficam com ~6–7%. O preço "180" fica com ~14%.
  - Subtítulo ("A partir de:", "exclusivos") com ~1,5%, cinza, às vezes com tracking largo (+200).
- **Como as palavras ganham destaque:**
  1. **Contraste de cor**: palavra já dita em cinza, palavra atual em preto (ou o contrário: "seu criativo"
     em preto na segunda linha).
  2. **Foco/desfoque**: a palavra nova nasce borrada e a anterior desfoca ao sair.
  3. **Eco empilhado**: a palavra repetida 3–4 vezes embaixo, com opacidade decrescente (1 → 0,45 → 0,25 → 0,1).
  4. **Cor de destaque só em número** (o "0" verde no preço).
- **Legendas:** não existem legendas no sentido clássico. **O próprio texto é a legenda**: frase curta
  centralizada, sincronizada com a narração, de 2 a 5 palavras por vez.

## 3. Tipos de asset e como cada um anima

| Asset | Animação |
|---|---|
| Kinetic type (frase) | Revelação palavra a palavra: cada palavra de blur 8–12 px → 0, opacidade 0 → 1, x de +12 px → 0, cor de cinza a preto. Stagger de 3–5 frames |
| Palavra-hero com eco | A cópia principal entra e as cópias "descem" em cascata, com 2 frames de atraso entre elas |
| Palavra rotacionada/curva | Entra a -15° com baseline em arco e assenta em 0° com spring e um pouco de overshoot |
| Phone card 2D (placeholder branco) | Scale 0,9 → 1, y +40 → 0, sombra crescendo. Pode **morphar** em outra forma |
| Phone card com tela | Carrossel horizontal: o card atual vai para x -60% e o novo entra de +60%, ambos com spring. O título acima troca junto |
| Mockup de app (Pix) | Ícone check pop + contador numérico + linhas de detalhe com blur-in em stagger |
| Badges circulares com ícone/emoji | Entram e saem pelas bordas com scale (0,6 → 1,3) e parallax. Funcionam como "confete informativo" |
| Chat (iMessage) | Bolhas com scale 0 → 1 a partir do canto do rabicho, com overshoot. A pilha sobe. Emoji pop |
| Toggle e pills de UI | Pills voam de fora e se agrupam. O knob do toggle desliza |
| Waveform | Barras verticais com altura procedural (ou ligada ao áudio). A ponta direita fica em verde |
| Documento (PDF) | Card entra do blur, com leve tilt |
| Botão com cursor | Anel de stroke draw-on, cursor circular entra, clique com scale de 0,85 e "ripple" |
| Seta curva | Stroke draw-on (strokeDashoffset) com cabeça de seta no fim |
| Moedas 3D + luz | Objetos metálicos com DOF forte atravessam a câmera. Light leak verde varre |
| Contador numérico | Ease-out (rápido no começo, desacelerando). Nas telas escuras tem glow e flicker |

## 4. Linguagem de movimento

- **Easing:** quase tudo é **ease-out forte** (expo/quint out) ou **spring com pouquíssimo overshoot**. O que
  parece "estilo Apple" é entrada rápida, assentamento longo e macio. Overshoot visível só em objetos com
  "personalidade": balão de fala, bolhas de chat, palavra girando e emoji.
- **Blur é o motor do vídeo.** Toda entrada e toda saída passa por blur gaussiano (e às vezes por motion blur
  direcional). Quase não há corte seco. O que existe são **dissolves com blur** de 4–8 frames.
- **Durações (30 fps):**
  - entrada de palavra: 6–10 frames
  - stagger entre palavras: 3–5 frames
  - entrada de card ou mockup: 12–18 frames
  - slide do carrossel: 14–18 frames
  - saída com blur: 5–8 frames
  - segura, com tudo legível: 10–20 frames (bem curto)
- **Câmera:** não há câmera 3D "de verdade" na maior parte. A profundidade vem de **parallax de camadas**
  (placeholders, badges) e de **DOF falso** (blur em quem está em primeiro e segundo plano). O único momento
  "3D" é o das moedas, com a câmera atravessando, mais o feixe de luz. Tem um leve drift ou scale contínuo
  (~1,00 → 1,03) nas cenas paradas, para que nada fique morto.
- **Transições entre cenas:**
  1. **Morph de forma** (card → pill verde → círculo do check), a mais elegante do vídeo.
  2. Blur-out + fade para branco, com 2–4 frames de respiro em branco.
  3. **Inversão branco/preto** para marcar a virada para o preço.
  4. **Escurecimento progressivo do fundo** (build-up), depois flash branco e revelação.
  5. Carrossel horizontal entre os cards de portfólio.
- **Som (inferido pelos "hits" visuais):** whoosh em cada entrada com blur. Pop/click nas bolhas, no toggle e
  no clique do cursor. Riser durante o escurecimento (14,4–15,3 s) e impacto no flash branco (15,3 s).
  "Cha-ching" ou impacto no "R$180". Os contadores sugerem som de tick.

## 5. Ritmo

- 27,7 s e cerca de **26 cenas/estados** → **cena média ≈ 1,05 s**. Dentro de cada cena entra algo novo a
  cada 0,3–0,5 s (palavra, ícone, bolha).
- **Nunca fica parado mais de 0,6 s**, exceto no fim (logo, ~2,8 s).
- **Desacelera** em três pontos: no preço (5,3–6,1 s, segura o número), no chat (17,1–19,4 s, a cena mais
  longa, ~2,3 s, porque é a "historinha") e no logo final.
- **Acelera** no carrossel de portfólio e na lista de benefícios (Preço / Qualidade / Segurança: ~0,8 s cada).

## 6. Hook, narrativa e CTA

- **Hook (0–3 s):** pergunta de dor/desejo ("Tá precisando" + "Criativos"), logo seguida de **prova visual de
  dinheiro entrando** (tela de Pix com valor subindo). Em 2 segundos ele já mostra *resultado*, não
  ferramenta. Depois vem o "Então você chegou no lugar certo".
- **Estrutura:**
  1. Dor ou necessidade (precisa de X?)
  2. Resultado (dinheiro, Pix)
  3. "Lugar certo" + **preço-âncora cedo** (5 s), em tela escura dramática
  4. Promessa (você garante anúncios com edição profissional)
  5. **Prova** (carrossel de portfólio: profissional, dinâmica, extrema qualidade)
  6. Diferenciais (estilo Apple, efeitos sonoros, roteiro, narração inclusa)
  7. Build-up ("pra deixar ainda mais...") → clímax "Profissional"
  8. Prova social e informal em chat ("E o melhor": entrega rápida)
  9. Trio de benefícios (preço acessível, qualidade, segurança)
  10. CTA: botão "Saiba mais" clicado + "venha fazer o seu..." + "Tô te esperando aqui 👀"
  11. Logo
- **CTA:** botão de UI com cursor clicando (ensina o gesto), seta apontando e fechamento informal e próximo.

## 7. Como reproduzir no Remotion / three.js

Composição de 1080x1920 a 30 fps. Primitivos sugeridos (nomes para o nosso motor):

1. **`<WordReveal text stagger={4} />`**: divide por palavra. Cada palavra usa
   `spring({frame: f - i*stagger, fps, config: {damping: 200, stiffness: 120, mass: 0.6}})` (sem overshoot)
   e mapeia `blur 10→0px`, `opacity 0→1`, `translateX 14→0`, `color #B5B5BA→#111`.
   Tem prop `exit` com blur de 0 → 10 e opacity de 1 → 0 em 6 frames. Suporta `highlight` (índices em preto
   e o resto em cinza).
2. **`<EchoWord text copies={4} />`**: cópias com `translateY = k*0.9em`, opacidade
   `[1, .45, .25, .1]` e atraso de 2 frames por cópia.
3. **`<WarpWord />`**: rotação de -15° → 0 e baseline por letra
   `y_i = sin(i*0.6 + t)*amp*(1-progress)`, com spring `{damping: 14, stiffness: 140}` (overshoot leve).
4. **`<BlurDissolve durationInFrames={6} />`**: transição padrão entre cenas (via `@remotion/transitions`
   com presentation custom: blur + fade + scale 1 → 1,04 na saída).
5. **`<ShapeMorph />`**: um `div` (ou rect SVG) que interpola `width/height/borderRadius/background` entre
   keyframes (card → pill → círculo), em 8–12 frames com `Easing.bezier(0.16, 1, 0.3, 1)` (expo-out).
6. **`<PhoneCard>`**: card branco com raio de 48 px a 1080p, `box-shadow: 0 30px 60px rgba(0,0,0,.08)`, sem
   borda, com conteúdo interno opcional. Entrada com spring `{damping: 20, stiffness: 160}`, scale de 0,9 → 1
   e y de 60 → 0.
7. **`<CardCarousel items gap />`**: os slides mudam `x` por spring `{damping: 26, stiffness: 180}` (cerca de
   15 frames). O título acima troca com WordReveal. O card ativo fica com blur 0 e os laterais com 2–4 px.
8. **`<CountUp from to durationInFrames={20} />`**: `interpolate` com `Easing.out(Easing.cubic)`, formatado
   em BRL. No modo "neon": text-shadow verde e um flicker de opacidade aleatório no início.
9. **`<IconBadge emoji|icon size depth />`**: círculo #F0F0F2. Posição em órbita ou parallax: x/y animados
   por `depth` (badges "perto" movem mais e ficam maiores e mais desfocados). Entrada com scale de 0,6 → 1
   (spring `{damping: 12, stiffness: 180}`).
10. **`<ChatThread messages />`**: este é **o mais importante para a Vistra (WhatsApp)**. Cada bolha usa
    `transformOrigin` no canto do rabicho e spring `{damping: 13, stiffness: 200, mass: 0.7}` (overshoot de
    ~6%). O intervalo entre bolhas é de 14 frames. A pilha sobe com spring suave. Tem bolha de arquivo/áudio,
    reações em emoji pop e indicador "digitando…". **Versão Vistra:** visual de WhatsApp claro, não de
    iMessage.
11. **`<ToggleUI />`, `<PillSwarm />`**: as pills entram de fora com velocidade alta e assentam com spring
    `{damping: 18}`. O knob do toggle desliza em 8 frames.
12. **`<Waveform bars={40} />`**: alturas por `noise2D` (de `@remotion/noise`) ou por `visualizeAudio` do
    áudio da narração. As últimas barras ficam na cor de destaque.
13. **`<CTAButton>` + `<FakeCursor>`**: anel com `strokeDashoffset` de L → 0 em 12 frames. O cursor (círculo
    cinza translúcido de 40 px) sobe com expo-out por 10 frames. No clique, o botão vai de 1 → 0,88 → 1 em
    6 frames, com ripple.
14. **`<DrawArrow path />`**: SVG path com dash draw-on em 12–15 frames e cabeça de seta aparecendo no fim.
15. **`<BgTone from to />`**: anima a cor do fundo (para o build-up de branco a cinza-chumbo e para a
    inversão branco/preto).
16. **Cena 3D (r3f via `@remotion/three`)**: para o momento do preço. Algumas moedas (ou, na Vistra, ícones
    de balão de mensagem e de check) em material metálico (`meshStandardMaterial metalness 1 roughness .25`)
    com `EffectComposer` + `DepthOfField` + `Bloom`. A câmera faz dolly em z em ~20 frames, atravessando os
    objetos. Por trás vai um plano com gradiente verde aditivo (light leak).
17. **Drift global**: um wrapper que aplica `scale 1 → 1.03` linear durante cada cena, para nada ficar estático.

**Ritmo-alvo:** 25–30 s, cenas de ~1 s, um elemento novo a cada 10–15 frames e 1 cena longa (~2,3 s) de
"historinha" em chat.

## 8. O que NÃO copiar

- A marca e o logo do autor (coruja, wordmark), a copy literal e as frases de fechamento.
- As telas de portfólio de terceiros (app de motorista, mapa laranja, contador de vendas) e a tela de Pix
  com data, que imita um comprovante bancário real. **Na Vistra não simulamos comprovantes nem transações
  reais.**
- O "estilo Apple" como alegação: não usar o nome Apple nem o visual de iMessage. Para a Vistra, o chat
  deve ser **WhatsApp genérico e claro** (sem logo do WhatsApp e respeitando as diretrizes da Meta).
- **Preço na tela:** é a regra da casa, a Vistra **não mostra preço em peça pública**. O bloco "R$180" serve
  só como referência de *movimento* (o momento escuro dramático). Para nós ele vira, por exemplo, um número
  de resultado ("24 h atendendo") e não um valor.
- O excesso de emojis genéricos (💵 ✅ 🔒) fica barato. Para a Vistra, melhor usar ícones próprios em linha.
