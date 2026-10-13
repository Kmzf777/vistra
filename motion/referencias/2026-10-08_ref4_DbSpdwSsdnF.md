# Referência 4: DbSpdwSsdnF (olafmotion), "Let's Plan Your Adventure"

> Estudo só de análise. Nenhum pixel, texto ou asset desta peça entra nos vídeos da Vistra.
> Aproveitamos a **linguagem de movimento**, não o conteúdo.

## Ficha

| Campo | Valor |
|---|---|
| Link | https://www.instagram.com/reel/DbSpdwSsdnF/ |
| Autor | Olaf Klimasz (@olafmotion), motion designer |
| Duração | 11,0 s (330 frames a 30 fps) |
| Aspecto | **1:1 (720x720)**, e não 9:16 |
| Áudio | faixa de áudio presente (trilha/SFX; transcrição desligada). WAV extraído para análise em `C:\Users\rafae\AppData\Local\Temp\claude\C--Users-rafae-OneDrive-Desktop-PetShop-coldcall\24d7348f-d561-4e9b-9e96-cb0880008531\scratchpad\watch\watch-rpuu1940\audio.wav` |
| Formato | **Motion puro de UI** no estilo iOS: sem rosto, sem locução visível, sem gravação de tela real. É uma peça de portfólio que reconstrói elementos do sistema da Apple (lista de apps, ícone do Maps, botão "Directions", cards de lugar, mapa) e os encadeia por **match cuts**. |
| Loop | **Loop perfeito**: o último frame (fundo cinza-lavanda claro com o logo borrado) emenda no primeiro (mesmo fundo com os ícones borrados). |

## Linha do tempo plano a plano

| Tempo | Na tela | Tipo de asset | Movimento / transição |
|---|---|---|---|
| 0,00–0,15 | Lista de apps borrada (ícones Music, Messages, Wallet/Touch ID) com **flash de cor invertida**: 1 frame claro, 1 frame escuro com hue deslocado (verde-água, magenta, amarelo), 1 frame com **scanlines** horizontais | Ícones de app + rótulos | Glitch de entrada em 3–4 frames: inversão de cor + rotação de hue + linhas de varredura. Motion blur vertical forte (a lista está "rolando") |
| 0,15–1,20 | Lista estilo Ajustes do iOS: iMessage, Settings, Maps, Mail. Itens sobem e desaceleram | Ícones squircle + rótulo em SF Pro | **Scroll vertical em perspectiva 3D**: a lista está num plano levemente inclinado (eixo X), os itens de cima ficam em itálico/distorcidos e desaparecem com fade, os de baixo entram borrados. Os rótulos aparecem com **reveal letra a letra** (máscara da esquerda para a direita + blur), sempre atrás do ícone. Ease-out longo |
| 1,20–1,40 | Settings e Mail somem; sobra Maps | — | Os outros itens saem com blur vertical; o Maps fica como âncora |
| 1,40–2,10 | "Let's Plan" entra **curvado em arco 3D**, depois "Your [ícone Maps] Adventure" | Tipografia cinética + ícone inline | O título nasce em arco (texto num cilindro, rotação em Y) e desenrola até ficar plano. "Your" e "Adventure" saem de trás do ícone para os lados com blur. Hierarquia por cor: "Let's" cinza-escuro e "Plan" cinza médio; "Your" cinza e "Adventure" escuro |
| 2,10–2,70 | Composição parada: "Let's Plan / Your [Maps] Adventure" | — | **Hold** de cerca de 0,5 s (o único respiro do começo) |
| 2,70–3,30 | O ícone do Maps cresce e **inclina em 3D** (tilt em X, visto de cima), o texto some com blur, a câmera "voa" para dentro do ícone até a seta azul da navegação | Ícone 3D (plano com perspectiva) | **Push-in/fly-through** com perspectiva forte e motion blur. Match cut: a seta de localização vira o próximo objeto |
| 3,30–3,75 | A seta azul num círculo branco gira, encolhe e vai para o centro | Glifo de seta (estilo SF Symbol) | Rotação e scale-down com ease-in-out, blur de movimento |
| 3,75–3,85 | A seta **estica e vira o pill "Directions"** | Botão pill | Morph: a forma alonga na horizontal com smear/blur, o texto sai de dentro |
| 3,85–4,05 | Flashes: scanlines, quadro preto, pill laranja num fundo quase preto, pill ciano num fundo branco | Glitch de cor | **Acento de batida**: 1 frame por estado (inversão + hue shift). Quase certamente marca um hit de SFX/trilha |
| 4,05–4,50 | Pill "Directions" azul no centro do fundo branco, depois desce para a direita | Botão pill | Volta para o azul; leve wobble de escala; translação diagonal com blur |
| 4,50–5,00 | O card branco **nasce em volta do pill** (o pill vira o botão do card). A foto da montanha entra deslizando pela direita, dentro de uma máscara arredondada | Card de lugar (foto + título + subtítulo + botão) | Máscara cresce a partir do botão; a imagem desliza dentro da máscara (parallax interno). O título "Dolomites" entra com **tracking largo que se fecha** (letras espaçadas e girando que se assentam) |
| 5,00–5,40 | Card "Dolomites / Italy" parado, com micro-rotação | — | Tilt 3D sutil e contínuo (±3°), "flutuando" |
| 5,40–6,10 | O card sai para a esquerda e para baixo com blur; uma **linha azul (traço)** desenha uma onda em S que leva ao próximo card | Path animado (stroke-dashoffset) | Pan de câmera lateral + traço que se desenha como uma rota de mapa. A linha é a "costura" entre os planos |
| 6,10–7,20 | Card "Lake Tahoe / United States" entra pela direita e assenta; a ponta do traço fica presa a ele | Card de lugar | Entrada com blur, spring com leve overshoot, depois tilt flutuante |
| 7,20–8,00 | O card sai pela esquerda e para cima; a câmera faz **pan para baixo** seguindo o traço; o card "Mount Fuji / Japan" sobe de baixo | Card + path | Mesma gramática, agora na vertical (variação de direção) |
| 8,00–8,60 | O card Mount Fuji assenta e **encolhe** (zoom-out) | Card | Scale-down suave, parecendo afastamento de câmera |
| 8,60–8,75 | Flash branco; o card vira um **tile de mapa** quadrado e borrado | Mapa (squircle) | Cross-dissolve com flash para o branco (blur muito alto, depois foco) |
| 8,75–9,60 | Tile de mapa com o ponto azul de "localização atual"; o texto "Ridgecrest / Working remotely" entra letra a letra no canto inferior esquerdo | Widget de mapa + texto | Pequeno scale-up contínuo; reveal de texto por máscara + blur; o ponto azul fica fixo |
| 9,60–10,10 | O tile **cresce até sair do quadro** (o mapa ocupa a tela toda) e o ponto azul desliza levemente | Mapa fullscreen | Zoom-in com ease-in e blur de borda; o ponto se move como "GPS andando" |
| 10,10–10,20 | O mapa encolhe e borra; corte para preto | — | Zoom-out rápido + blur, depois corte seco |
| 10,20–10,90 | Assinatura: memoji + "olafmotion" no preto. Começa pequeno, encolhe mais e depois cresce com uma piscada | Logo/assinatura | Scale com spring, preto que clareia para cinza-escuro |
| 10,90–11,00 | O fundo vai para o cinza-lavanda e o logo borra (emenda no início) | — | Fade de cor do fundo + blur = loop |

## Sistema visual

- **Fundo:** cinza-lavanda bem claro, liso, sem grid nem textura. Amostrado **`#E6E3EB`** (230,227,235). Os flashes vão para branco puro `#FFFFFF` e preto `#000000`; o final é preto que clareia até `#2A292E` e volta ao lavanda.
- **Sombras:** praticamente nenhuma. Os cards brancos se separam do fundo só pelo contraste e por uma borda branca grossa (padding de cerca de 6–8% da largura do card).
- **Formas:**
  - Ícones e tiles de mapa em **squircle** (curva contínua do iOS), raio de cerca de 22% do lado.
  - Cards: raio de cerca de 12% do lado; a foto interna tem raio menor (cerca de 9%), concêntrico.
  - Botão: **pill** (raio = 50% da altura), altura de cerca de 5% do quadro.
  - Traço de rota: stroke azul de cerca de 1% do quadro, ponta arredondada, curva Bézier em S.
  - Nada de contornos/outlines decorativos; é tudo preenchimento chapado.
- **Paleta (estimativa):**
  - Azul sistema/acento `#1E8CF0`–`#0A84FF` (seta, pill, traço, ponto de localização)
  - Texto escuro `#2B2B2F`; texto secundário `#8A8A90`
  - Branco dos cards `#FFFFFF`
  - Cores dos ícones de app (verde do Messages `#34C759`, vermelho do Music etc.), só na abertura
  - Flashes de glitch: laranja `#F07A10` no quase-preto `#1C1A18`; ciano `#2EE6F0` no branco (são o azul invertido/rotacionado no hue)
  - Mapa: verdes, bege e azul-mar do Apple Maps
- **Tipografia:** neo-grotesca de sistema (estilo SF Pro Display). Título em Semibold com cerca de 9% da altura do quadro; rótulos de lista em Regular com cerca de 4%; título do card em Semibold com cerca de 2,5% e subtítulo em Regular com cerca de 2%. Caixa normal (sentence/title case), nunca caixa-alta.
- **Destaque de palavra:** por **contraste de cinza** (uma palavra escura e a outra cinza média), não por cor de marca nem por sublinhado. O ícone entra **inline no meio da frase**, no lugar de uma palavra (trocadilho visual: "Your [Maps] Adventure").
- **Legendas:** não há legenda de fala; todo texto é on-screen e diegético da UI.

## Tipos de asset e como cada um anima

| Asset | Animação |
|---|---|
| Lista de apps (ícone + rótulo) | Plano 3D inclinado com scroll e desaceleração; rótulo com reveal por máscara + blur, entrando depois do ícone (stagger de cerca de 3 frames) |
| Ícone de app como "portal" | Cresce, inclina em perspectiva e a câmera mergulha nele (fly-through) |
| Glifo de seta | Gira, encolhe, faz morph para pill |
| Botão pill | Morph de forma (círculo → pill), flash de cor, depois translação até virar parte do card |
| Card de lugar (foto + título + botão) | Máscara cresce a partir do botão; a foto desliza dentro da máscara; tracking do título fecha; tilt flutuante contínuo; sai com blur direcional |
| Traço de rota (path) | Desenho por stroke-dashoffset, conecta os cards e guia o pan da câmera |
| Tile de mapa | Dissolve via flash branco, scale-up contínuo, vira fullscreen |
| Ponto de localização | Fixo no tile; no fullscreen, desliza de leve |
| Kinetic type ("Let's Plan") | Texto em arco/cilindro que desenrola até ficar plano |
| Assinatura (memoji + wordmark) | Scale com spring + piscada, fundo preto que clareia |
| Glitch (inversão/hue/scanline) | Frames isolados de 1 frame cada, como pontuação rítmica |

Não há telefone/moldura de device, cursor, notificação, gráfico, foto de pessoa nem stock footage em movimento (as fotos dos cards são estáticas).

## Linguagem de movimento

- **Easing:** dominante é **ease-out expo/quint** (entra muito rápido e assenta devagar). As entradas de card têm **spring com overshoot leve** (cerca de 3–5%). As saídas usam **ease-in** forte com motion blur, de modo que o objeto "dispara" para fora do quadro.
- **Motion blur em tudo:** blur direcional proporcional à velocidade é a assinatura da peça. Nos frames rápidos, ícones e textos ficam totalmente smeared.
- **Durações típicas (30 fps):**
  - entrada de card: 10–14 frames
  - reveal de texto: 8–12 frames
  - morph seta → pill: 3–4 frames
  - flash de glitch: 1 frame por estado, 4–6 frames no total
  - holds: 10–15 frames (curtos!)
- **Stagger:** ícone → rótulo cerca de 3 frames; linhas da lista cerca de 4 frames; letras do título do card cerca de 1 frame por letra.
- **Câmera:**
  - Perspectiva 3D o tempo todo (planos levemente inclinados, nunca 100% frontais).
  - Push-in/fly-through no ícone.
  - Pan lateral e depois vertical seguindo o traço.
  - Zoom-out no card Fuji e zoom-in no mapa até fullscreen.
  - Micro-tilt flutuante (±2–4°) nos objetos em repouso.
- **Transições:** **nenhum corte seco entre ideias**; tudo é **match cut / morph**: ícone → seta → pill → card → (traço) → card → card → mapa → logo. As únicas "quebras" são os flashes de glitch e o flash branco, que funcionam como pontuação.
- **Som (inferido):** whoosh nos fly-throughs e nas saídas com blur; "glitch/click" nos flashes de 3,85 s e na abertura; "tick/pop" nas entradas de card; possivelmente uma batida forte no flash branco de 8,6 s e no corte para preto em 10,2 s.

## Ritmo

- Cerca de 14 "eventos" visuais em 11 s, ou seja, **algo muda a cada 0,7–0,8 s**.
- Plano médio (entre estados estáveis) de cerca de 1,1 s, mas os estados se sobrepõem: o próximo elemento já está entrando enquanto o anterior sai.
- **Desacelera** em três lugares: o hold do título (2,1–2,7 s), cada card assentado (cerca de 0,4 s) e o mapa com "Working remotely" (9,0–9,6 s).
- **Acelera** no glitch do pill (3,8–4,1 s) e na transição mapa → logo.

## Gancho e estrutura narrativa

- **Gancho (0–3 s):** glitch colorido + lista do iOS rolando, um contexto que todo mundo reconhece ("estou no meu celular"). Em 1,5 s o título promete a história ("vamos planejar sua aventura"). O olho é segurado por movimento contínuo e pelo reconhecimento de UI nativa.
- **Estrutura:**
  1. Contexto (lista de apps)
  2. Promessa (título com ícone inline)
  3. Ação (Directions)
  4. Prova/variedade (3 destinos ligados por uma rota)
  5. Desfecho com twist ("Working remotely": o "destino" é trabalhar de qualquer lugar)
  6. Assinatura
- **CTA:** não há CTA comercial; termina na assinatura do autor (peça de portfólio). Para nós, o lugar do CTA seria o tile final (substituindo "Working remotely").

## Como reproduzir no Remotion / three.js

Composição sugerida: 1080x1080 (ou 1080x1920 adaptando o layout ao centro), 30 fps, cerca de 330 frames. Todos os elementos são **planos 2D num espaço 3D**. Dá para fazer com CSS 3D (`perspective` + `rotateX/Y`) no Remotion puro, e com react-three-fiber só no fly-through e na lista em perspectiva, se quisermos profundidade real.

### Primitivas

1. **`<Stage3D perspective={1200}>`**
   - Wrapper com `perspective` e um `cameraZ`/`cameraY` animáveis.
   - Pan e zoom são feitos movendo a câmera, nunca os objetos individualmente.
2. **`useMotionBlur(velocity)`** / **`<MotionBlur>`**
   - Opção A: o `<CameraMotionBlur samples={8} shutterAngle={180}>` do `@remotion/motion-blur` em volta das cenas rápidas.
   - Opção B, mais barata: `filter: blur()` direcional fake via SVG `feGaussianBlur stdDeviation="{vx*0.15} 0"` calculado a partir da derivada da posição.
   - **É o item mais importante para o "feel".**
3. **Curvas de ease padrão**
   - `easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1)` (entradas)
   - `easeInExpo = Easing.bezier(0.7, 0, 0.84, 0)` (saídas)
   - Spring de assentamento: `spring({ fps:30, config:{ damping:14, stiffness:170, mass:0.8 } })`, com cerca de 4% de overshoot
   - Spring firme para UI: `{ damping:22, stiffness:220 }`, sem overshoot visível
4. **`<Squircle size radius="22%">`**
   - Path SVG de superelipse (n≈5) ou `clip-path` com path pré-gerado; serve para ícones e tiles.
5. **`<PerspectiveList items tilt={-18deg}>`**
   - Lista com `rotateX(18deg)` e scroll por `translateY` interpolado (40 frames, easeOutExpo).
   - Opacidade em função do Y (fade em cima e embaixo).
   - Rótulos com `<MaskReveal>` e delay de 3 frames.
6. **`<MaskReveal dir="ltr" frames={10} blur={8}>`**
   - `clip-path: inset(0 X% 0 0)` + `filter: blur()` que vai de 8 a 0 px.
   - Serve para todo texto de UI.
7. **`<ArcText radius rotateFrom={60deg}>`**
   - Cada letra posicionada num cilindro (`rotateY(i*step) translateZ(r)`); o raio anima de pequeno a infinito, ou seja, o texto desenrola.
   - Duração de 14 frames, easeOutExpo.
8. **`<TrackingIn text from={0.6em} to={0}>`**
   - `letter-spacing` animado + `rotateY` por letra (stagger de 1 frame); para títulos de card.
9. **`<InlineIconWord>`**
   - Linha de texto com um ícone no lugar de uma palavra; as palavras saem de trás do ícone (`translateX` de ±40 px até 0 + blur).
10. **`<FlyThrough target>`**
    - Escala o objeto de 1 até cerca de 12 com `rotateX` de 0 a 50° e câmera descendo (16–20 frames, easeInExpo + blur).
    - No frame em que o detalhe (a seta) ocupa a tela, troca para o próximo elemento (match cut).
11. **`<ShapeMorph from="circle" to="pill">`**
    - Uma div com `width` e `border-radius` animados (circle 44x44 → pill 220x56) em 4 frames, com smear horizontal.
    - O texto do pill entra com o `MaskReveal`.
12. **`<GlitchFlash frames=[...]>`**
    - Sequência de 1 frame cada: `filter: invert(1) hue-rotate(180deg)`, quadro preto, `hue-rotate(150deg)` e overlay de scanlines (`repeating-linear-gradient(0deg, #0003 0 2px, transparent 2px 4px)`).
    - Usar no máximo 2 vezes por peça, sincronizado com hit de áudio.
13. **`<PlaceCard>`** (na Vistra seria um card de cliente/conversa)
    - Máscara que cresce a partir do botão: `clip-path: inset()` animado, com origem no botão.
    - Imagem com `translateX` de 30% até 0 dentro da máscara (parallax interno).
    - Tilt idle: `rotateX = sin(f/40)*3deg` e `rotateY = cos(f/50)*3deg`.
14. **`<RoutePath d>`**
    - Path SVG com `strokeDasharray = length` e `strokeDashoffset` animado (cerca de 18 frames, easeInOutCubic), ponta redonda.
    - A câmera segue o ponto `getPointAtLength(progress)`, o que dá o pan automático entre cards.
15. **`<WhiteFlashDissolve>`**
    - O overlay branco vai de 0 a 1 e volta a 0 em 6 frames; no pico troca a cena, e a nova entra com blur de 20 a 0 px.
16. **`<LoopSeam>`**
    - Os últimos 4 frames reproduzem a cor de fundo e o blur do frame 0, para o Reels rodar em loop sem emenda visível.

### Tabela de tempos sugerida (30 fps, peça Vistra de cerca de 12 s)

| Bloco | Frames |
|---|---|
| Glitch de abertura + lista em perspectiva | 0–36 |
| Título com ícone inline (arc text) | 36–64, com hold até 80 |
| Fly-through no ícone | 80–98 |
| Morph seta/glifo → pill + glitch | 98–124 |
| Card 1 nasce do pill | 124–150, hold até 165 |
| Rota + card 2 | 165–215 |
| Rota + card 3 (vertical) | 215–255 |
| Flash branco → tile final + texto | 255–300 |
| Zoom fullscreen → assinatura Vistra | 300–345, com loop seam nos 4 últimos frames |

### Tradução para a Vistra (ideia, não cópia)

- A lista de apps vira uma **lista de conversas do WhatsApp** (avatares squircle genéricos, nomes fictícios).
- O ícone inline da frase vira o nosso símbolo (por exemplo "Seu [ícone Vistra] atendente").
- O fly-through mergulha num balão de mensagem; o balão vira o pill **"Responder"**, e o pill gera cards de **resultado** (agendamento confirmado, pedido fechado, lead qualificado) ligados por uma linha (a "conversa" como rota).
- O tile final é a tela de conversa com o texto "atendido às 3h da manhã".
- Lembrete da memória do projeto: **nunca mostrar preço** em peça pública.

## O que NÃO copiar

- Nenhum ícone, glifo, interface ou wordmark da Apple (Maps, Messages, Settings, SF Symbols, mapa do Apple Maps). Usamos ícones próprios ou open-source (Lucide, Phosphor) e fontes livres (Inter, Geist), não SF Pro.
- As fotos (Dolomites, Lake Tahoe, Fuji), o mapa e os nomes de lugar.
- O texto "Let's Plan Your Adventure" e o "Working remotely".
- O memoji e a assinatura "olafmotion".
- A paleta exata (lavanda + azul iOS): a Vistra usa a própria paleta de `Vistra/marca/`.
- Não exagerar no glitch: aqui são 2 ocorrências curtas; mais do que isso vira ruído e cansa no Reels.
- Formato 1:1: para Reels nós entregamos 9:16 (manter a ação concentrada na faixa central segura).
