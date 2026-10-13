# Referência 3 — "Motion Design Reel '26" (Cevox)

- **Link:** https://www.instagram.com/reel/DeDaXyYoRTG/ (perfil `cevox__`, Cevox | Software Solutions)
- **Estudado em:** 2026-10-08, só análise. Nenhum pixel, texto ou trilha deste vídeo entra nas peças da Vistra.
- **Duração:** 15,0 s (o próprio rodapé final diz "15 SEC / 900 FRAMES / 60 FPS"; o arquivo baixado é 30 fps).
- **Aspecto:** 16:9 (1280x720), **horizontal**, postado como Reel. Para a Vistra a gente adapta para 9:16.
- **Formato:** **motion puro**, 100% gráfico gerado (2D vetorial + trechos 3D). Sem rosto, sem narração,
  sem gravação de tela, sem foto e sem stock. Só trilha musical com acentos de sound design.
- **Audio local (para análise de batida):** `C:\Users\rafae\AppData\Local\Temp\claude\C--Users-rafae-OneDrive-Desktop-PetShop-coldcall\24d7348f-d561-4e9b-9e96-cb0880008531\scratchpad\watch\watch-7qkxof12\audio.wav` (16 kHz mono, temporário).

## Ideia central

É um "showreel de capítulos": 9 mini-cenas numeradas, cada uma demonstrando um princípio de motion
(TIMING, TYPE, FORM, DEPTH, SYSTEMS, FLOW, INTERFACE, RHYTHM, FIN). O que costura tudo é
**uma bolinha vermelha** que aparece em quase toda cena (a bola que quica, o ponto final do "MOVE.",
a forma que morfa, o centro dos anéis, do sol, do olho, do disco, e por fim o ponto de "'26.").
Esse objeto-âncora é o truque mais valioso da peça: dá continuidade a cortes muito rápidos.

## Moldura fixa (HUD) — presente em todos os frames

| Posição | Conteúdo | Observação |
|---|---|---|
| Topo esquerdo | "MOTION DESIGN REEL" | mono, caixa alta, ~11 px em 720p (~1,5% da altura) |
| Topo direito | "©2026" | mono |
| Base esquerda | "0X  NOME DO CAPÍTULO" (ex.: "04 DEPTH") | troca a cada cena, é o "título" da cena |
| Base direita | timecode "00:SS:FF" | segundos:frames a 60 fps, rodando de verdade |

Margem ~37 px em 1280 (≈3% da largura). A cor do HUD inverte (preto em fundo claro, creme em fundo escuro).
Esse HUD dá cara de "documento técnico / ferramenta" e transmite precisão.

## Linha do tempo cena a cena

| Tempo | Capítulo | O que aparece | Tipo de asset | Movimento / transição |
|---|---|---|---|---|
| 0,0–0,1 | 01 TIMING | Fundo preto, linha horizontal de "chão" nasce do centro para as bordas | linha (stroke 1–2 px creme) | scale X de 0→1, ease-out rápido |
| 0,1–1,5 | 01 TIMING | Bola vermelha cai do topo, deixa rastro pontilhado da trajetória, quica 3 vezes decrescendo | círculo 2D + trilha pontilhada | gravidade (ease-in na queda, ease-out na subida), squash & stretch no impacto, a linha do chão **enverga como mola** (wobble), traços radiais de impacto (8–10 riscos) |
| 1,5–1,6 | → | Retângulo vermelho entra com bordas borradas, já com o topo do "M" | bloco de cor | wipe/expansão com motion blur pesado |
| 1,6–2,4 | 02 TYPE | "MAKE" (preto), "IT" (creme), "MOVE" (preto), ponto creme "." | tipografia cinética | cada palavra entra deslizando na horizontal com **motion blur direcional** forte; "MOVE" entra letra a letra espaçada e fecha o tracking; o ponto "pinga" de cima e quica |
| 2,4–2,9 | → | Texto inteiro é arrastado para baixo/lado com borrão, câmera "mergulha" no ponto creme | whip / zoom blur | o ponto creme vira o círculo que abre a próxima cena (match cut por forma) |
| 2,9–3,1 | → | Gradiente radial vermelho→creme | transição de cor | círculo expandindo com borda muito suave (iris wipe borrado) |
| 3,0–4,4 | 03 FORM | Ponto vermelho cresce e **morfa**: círculo → quadrado arredondado → triângulo → cruz → estrela/engrenagem → cruz arredondada → squircle → hexágono | shape morph 2D + overlay de ferramenta de design (bounding box, alças de bézier, rótulos de coordenada) | troca de forma a cada ~4–8 frames (30 fps), com rotação; duas cópias atrasadas (azul e amarela) seguem a vermelha com lag, como "eco"/sombra deslocada |
| 4,4–4,7 | → | Hexágono azul cresce até ocupar a tela, borda difusa | iris wipe com forma | scale-up rápido + blur na borda |
| 4,6–5,9 | 04 DEPTH | Quadrado vermelho vira **cubo 3D**; cubo se divide em 2x2x2 (tipo cubo mágico) com faces creme/rosa/vermelho/amarelo; fatias giram; cubo **explode** em cubinhos que voam para a câmera | 3D (react-three-fiber) | rotação Y/X contínua, cortes de fatia com motion blur, explosão radial + câmera atravessa um cubo escuro → preto |
| 5,9–7,4 | 05 SYSTEMS | Fundo preto com grade de pontos; um **anel de meio-tom** (pontos maiores no anel) nasce do centro; ondas de pontos vermelhos se propagam para fora; o anel inclina em 3D e volta | grade de pontos (halftone procedural) | o tamanho de cada ponto = função da distância ao centro + onda no tempo; tilt 3D em X; saída com smear horizontal |
| 7,4–9,0 | 06 FLOW | **Tubos listrados** (vermelho/rosa/creme, azul/branco, amarelo/preto) desenhando caminhos curvos que se cruzam e fazem loops | stroke animado em path (trim path) | ponta do tubo avança com ease-in-out, cada tubo com defasagem; saída com dois círculos creme que crescem (iris) |
| 9,0–9,6 | 07 INTERFACE | Fundo creme, **toggle** preto entra com blur; cursor voa até ele, clica (anel de pressão), toggle passa para vermelho com estouro de riscos radiais | UI mockup + cursor | escala com overshoot, cursor com trajetória curva e blur, "click ring" expande e some |
| 9,6–10,5 | 07 INTERFACE | Câmera recua e o toggle vira um card de um **dashboard bento** de 4 cards: "MOTION BLUR ON" (preto), contador "0→100%" (vermelho), barras + linha "OUTPUT / WEEK" (azul), curva de easing com alças (rosa) | UI mockup / gráficos | cards entram com blur de escala; dígitos do contador rolam na vertical com motion blur; barras crescem com stagger, última fica amarela (destaque); ponto percorre a curva bézier |
| 10,5–12,0 | 08 RHYTHM | Sequência relâmpago, sempre com o **círculo central fixo**: anéis concêntricos pulsando → sol de raios amarelo → olho piscando (rosa) → grade de bolinhas pretas em vermelho → órbita azul com corpos brilhantes → disco de vinil → linhas de velocidade em azul → "GO" | ilustração flat 2D | cortes secos na batida (~0,12–0,4 s cada); o centro nunca se move, então o olho lê como uma só coisa se transformando |
| 12,0–12,9 | 09 FIN | "GO" com o ponto vermelho rolando; anel de choque; "MOTION" e "REEL" sobem letra a letra; o "G" cai girando para fora; o ponto vermelho quica pelas letras e pousa como ponto final de "'26." (serifa itálica vermelha) | tipografia cinética | stagger por letra com blur vertical, física de bola no ponto, serifa itálica "desenha"/entra borrada |
| 12,9–13,4 | 09 FIN | Fio horizontal se desenha da esquerda para a direita; rodapé de 3 colunas aparece digitando ("DESIGN — ANIMATION — DIRECTION", meta técnica, "AVAILABLE FOR NEW PROJECTS") | linha + texto mono | trim path linear; texto em typewriter / scramble |
| 13,4–15,0 | 09 FIN | Cartão final parado | end card | hold de ~1,6 s; áudio faz fade-out de 13 s a 15 s |

## Sistema visual

- **Fundos:** chapados, sem textura, alternando entre 4 cores. Grade só aparece como asset (pontos na cena 05,
  grid fino dentro do card de easing). Não há grade de fundo permanente.
- **Paleta (estimativa hex):**
  - preto quente `#0E0E10`
  - creme papel `#EEE8DC`
  - vermelho-laranja `#EE3B1F` (cor-herói, o ponto)
  - azul ultramar elétrico `#1F2BE8`
  - amarelo `#F8CC2B`
  - rosa chiclete `#F4A7C8`
  Regra: no máximo 3 cores por quadro, sempre uma delas é o vermelho do ponto.
- **Formas:** geometria primária e plana (círculo, quadrado, triângulo, estrela, hexágono). Cards de UI com
  raio grande (~22–26 px em 720p, ≈3,5% da altura). Strokes finos (1–2 px) para linhas técnicas e órbitas,
  strokes grossos (10–14 px) para os anéis concêntricos e contorno do olho. Nada de sombra realista;
  "sombra" é uma cópia deslocada em outra cor.
- **Tipografia:**
  1. Display: grotesca **ultra-pesada e larga** (estilo Druk Wide / Monument Extended / "Obviously Black"),
     caixa alta, kerning apertado, ocupa a largura toda (cap height ≈ 26% da altura do quadro no end card).
  2. Contraste: **serifa didona itálica** de alto contraste (estilo Playfair Display Italic), só no "'26", em vermelho.
  3. Técnica: **mono** pequena caixa alta com tracking aberto (estilo JetBrains Mono / Space Mono / IBM Plex Mono) para HUD, rótulos de card e rodapé.
  - Destaque de palavra: por **cor** (IT em creme no meio de preto) e por **troca de família** (serifa itálica vermelha), nunca por sublinhado ou caixa.
- **Legendas:** não existem (não há fala). O "texto na tela" é a própria peça (MAKE IT MOVE / MOTION REEL '26).

## Tipos de asset e como cada um anima

| Asset | Animação |
|---|---|
| Bola/ponto vermelho | física (queda, quique decrescente, squash & stretch), ponte entre cenas |
| Linhas (chão, órbita, rodapé, trajetória pontilhada) | trim path / scale X; chão com mola amortecida |
| Tipografia cinética | slide horizontal com motion blur direcional, stagger por letra, tracking fechando |
| Shape morph com UI de editor (bounding box, alças) | morph de path a cada poucos frames, cópias em lag |
| Cubo 3D / cubo mágico | rotação, giro de fatias, explosão em partículas-cubo, câmera atravessa |
| Grade de pontos halftone | campo procedural (raio do ponto = f(distância, tempo)), tilt 3D |
| Tubos listrados | path com 3 strokes concêntricos (externo, meio, núcleo) e trim animado |
| Toggle + cursor | cursor voa em curva, click ring, toggle muda cor, burst de riscos |
| Dashboard bento | cards entram com scale+blur, contador com dígitos rolando, barras com stagger, curva bézier com ponto |
| Ilustrações flat (sol, olho, vinil, órbita) | cortes no ritmo, micro loop interno (piscar, girar, pulsar) |
| HUD (moldura) | estático; só capítulo e timecode trocam |

Não usa: rosto, foto, stock, celular/phone frame, bolhas de chat, notificações, ícones de app.

## Linguagem de movimento

- **Easing:** dominante é ease-out forte (tipo `cubic-bezier(0.18, 0.93, 0.33, 0.97)`, coerente com a curva
  mostrada no card "EASE"), ou seja, chega muito rápido e assenta devagar. Overshoot leve em entradas de UI
  (toggle, cards). Física de gravidade só na bola.
- **Motion blur é o tempero principal:** todo movimento rápido tem blur direcional exagerado (o card até
  anuncia "MOTION BLUR ON"). É isso que dá sensação de 60 fps "caro".
- **Durações (a 30 fps):** entradas de palavra 4–6 frames; morph de forma 4–8 frames; cards 6–8 frames
  com stagger de 2–3 frames; contador 0→100 em ~18 frames; cortes da cena RHYTHM 4–12 frames.
- **Câmera:** quase sempre frontal e centrada. Movimentos de câmera aparecem como zoom-through (mergulhar
  no ponto, atravessar o cubo), recuo para revelar (toggle → dashboard) e tilt 3D (anel de pontos).
  Sem pan lateral longo, sem parallax de camadas.
- **Transições:** (1) iris/círculo que cresce com borda difusa, (2) match cut por forma no ponto central,
  (3) whip com smear, (4) corte seco no beat. Nunca dissolve/crossfade.
- **Sound design inferido (RMS do áudio):** ataque em 0,4 s (primeiro impacto da bola), picos em 1,5 s
  (entrada do bloco TYPE), ~2,3 s, 3,0 s (abertura FORM), e na cena RHYTHM picos a cada ~0,4 s
  (10,5 / 10,9 / 11,3 / 11,7 / 12,1 s, ≈150 BPM). Do 13 s em diante o áudio cai suavemente até 15 s
  (fade-out sobre o end card). Ou seja: cada troca de capítulo cai num acento da música.

## Ritmo

- 9 capítulos em 13,4 s → **~1,5 s por capítulo**, mas dentro de cada um algo muda a cada 4–8 frames.
- Acelera na cena 08 RHYTHM (cortes de 0,12–0,4 s), que funciona como clímax.
- Desacelera só no fim: o end card fica 1,6 s parado para leitura.

## Gancho e estrutura

- **Gancho (0–3 s):** tela preta minimalista com uma bola que quica com física perfeita (satisfação
  imediata, curiosidade), seguida do slogan gigante "MAKE IT MOVE." em vermelho saturado. Movimento
  acontece no frame 1, sem logo e sem intro.
- **Estrutura:** promessa (MAKE IT MOVE) → demonstração em capítulos numerados (prova de competência) →
  clímax rítmico → assinatura (MOTION REEL '26.).
- **CTA:** discreto, no rodapé mono: "AVAILABLE FOR NEW PROJECTS". Sem botão, sem "arraste", sem link.

## Como reproduzir no Remotion / three.js

Composição de referência: 1080x1920 (9:16) ou 1920x1080, **60 fps** de preferência (o motion blur fica
melhor); valores abaixo em frames a 30 fps, dobre para 60.

1. **`<HudFrame chapter="04" name="DEPTH" />`** — 4 cantos com texto mono, margem 3% da largura,
   timecode real `SS:FF` calculado de `useCurrentFrame()`. Cor por prop `tone="dark|light"`.
2. **Tokens de cor** em um `theme.ts` com as 4–6 cores da Vistra (não as da Cevox). Cada cena escolhe
   `bg`, `ink` e o **acento-âncora** (para a Vistra, o ponto pode ser a bolha verde do WhatsApp).
3. **`<AnchorDot />`** — objeto único que viaja entre cenas. Guardar `{x, y, r}` no fim de cada cena e
   começar a próxima no mesmo lugar (match cut). Física de quique: `y = h*|cos(πt/T)|` com `h` caindo
   0,55 por quique; squash `scaleX=1+0.35*impacto`, `scaleY=1-0.3*impacto` por 3 frames.
4. **`<SpringLine />`** — linha de chão com 1 ponto de controle no meio ligado a `spring({damping: 8,
   stiffness: 180, mass: 0.6})` disparada no frame do impacto (deflexão 12–20 px).
5. **`<ImpactBurst count={9} />`** — riscos radiais de 1,5 px, comprimento 0→18 px→0 em 6 frames, rotação aleatória fixa por seed.
6. **`<KineticWord />`** — entrada horizontal com `spring({damping: 20, stiffness: 220})` (sem overshoot
   visível) + **motion blur direcional**: usar `@remotion/motion-blur` (`<CameraMotionBlur samples={10} shutterAngle={270}>`)
   ou um SVG `feGaussianBlur stdDeviation="X 0"` proporcional à velocidade. Stagger por letra 1–2 frames.
   Tracking anima de 0.4em → -0.02em.
7. **`<ShapeMorph shapes={[circle, squircle, triangle, plus, star, hexagon]} />`** — `flubber` ou
   `@remotion/paths` (`interpolatePath`) com paths de mesma contagem de pontos; troca a cada 6 frames,
   easing `Easing.bezier(0.18, 0.93, 0.33, 0.97)`. Duas cópias em cor secundária com atraso de 2 e 4
   frames e offset (6, 6) px. Overlay opcional `<EditorBox />` (retângulo 1 px, 8 alças, rótulo mono).
8. **`<IrisWipe color shape="circle|hexagon" />`** — escala de 0 → diagonal da tela em 8–10 frames,
   `Easing.in(Easing.cubic)`, com `filter: blur(24px)` na borda (ou máscara com gradiente radial).
9. **Cena 3D (`@remotion/three` + r3f):** `<RoundedBox>` 2x2x2 com `meshBasicMaterial`/toon (cores chapadas,
   sem luz realista) ou `meshStandardMaterial` com luz ambiente alta. Rotação de fatias de 90° em 8 frames
   com spring `{damping: 14, stiffness: 160}`; explosão: cada cubinho com vetor radial * `interpolate(f,[0,12],[0,8])`
   e câmera `position.z` 8 → 0,5 em 12 frames (zoom-through).
10. **`<HalftoneField />`** — grade N x M de círculos (canvas ou instanced mesh); `r = base + amp *
    exp(-((d - ringR(t))^2)/w)`; segunda onda em vermelho com atraso; para o tilt, `rotateX` 0→60°→0.
11. **`<StripedTube path />`** — mesmo path desenhado 3x (largura 46/30/10 px, cores externo/meio/núcleo),
    `strokeDasharray` + `strokeDashoffset` animados (via `evolvePath` de `@remotion/paths`); pontas
    arredondadas; tubos defasados 6–10 frames.
12. **`<Cursor />` + `<ClickRing />`** — cursor percorre bézier em 10 frames com blur; no clique: escala
    0.85 por 2 frames e anel 0→60 px com opacidade 1→0 em 8 frames.
13. **`<Toggle />`** — knob desliza com `spring({damping: 12, stiffness: 200})`, cor do trilho interpola
    preto → acento em 4 frames, + `ImpactBurst`.
14. **`<BentoDashboard />`** — 4 cards com raio 3,5% da altura, entrada scale 0.9→1 + blur 12→0 px em
    8 frames com stagger 3. **`<RollingCounter />`**: cada dígito é uma coluna 0–9 que translada em Y,
    com blur vertical proporcional à velocidade. **`<BarChart />`**: barras `scaleY` com stagger 2 frames,
    última barra destacada em outra cor. **`<EaseCurveCard />`**: path bézier com `evolvePath` + bolinha percorrendo.
15. **`<RhythmCuts beats={[...]}/>`** — `<Series>` de ilustrações curtas, durações tiradas dos beats
    da trilha (detectar onsets do áudio e gerar o array). Centro fixo em todas.
16. **`<EndCard />`** — título display em 2 linhas com stagger de letra (subida 40 px + blur vertical,
    2 frames entre letras), palavra de contraste em serifa itálica no acento, fio que se desenha
    (12 frames linear), rodapé mono com efeito typewriter/scramble (1 caractere/frame). Hold ≥ 45 frames.
17. **Trilha:** música com BPM marcado (140–160) e acentos; alinhar cada troca de capítulo a um downbeat.

**Adaptação Vistra:** os capítulos podem virar etapas do produto (ex.: 01 MENSAGEM, 02 IA ENTENDE,
03 RESPONDE, 04 AGENDA, 05 FUNIL, 06 RESULTADO), o ponto-âncora vira a bolha de mensagem, e a cena
INTERFACE vira um bento com métricas de atendimento (sem números de preço, que não vão para peça pública).

## O que NÃO copiar

- Textos da peça ("MAKE IT MOVE", "MOTION REEL '26", rodapés), o HUD com os mesmos rótulos, a sequência
  exata de capítulos e as ilustrações específicas (olho, sol, vinil, órbita, cubo mágico colorido).
- A paleta exata vermelho/azul/amarelo/rosa sobre creme: é a assinatura da Cevox. Usar a paleta da Vistra.
- A trilha sonora (é deles ou licenciada para eles).
- O formato 16:9: para Reels da Vistra, compor em 9:16.
- O tom "showreel de estúdio sem mensagem": para a Vistra, cada capítulo precisa dizer algo sobre o
  atendimento por IA; a técnica serve à mensagem, não o contrário.
