# Linguagem de motion da Vistra

Data: 2026-10-08. Consolidado dos 5 estudos em `motion/referencias/2026-10-08_ref*.md` (lidos quadro a
quadro). O que entra aqui é **técnica**; nada de pixel, texto, layout exato ou marca das referências.
É o contrato visual do motor da Vistra: a fase 07 monta com estes componentes e a fase 08 confere contra
esta página.

## Princípio

**Minimalista, quadrado e contínuo.** Fundo preto, grade fina, um acento verde por cena, muito ar.
Nada de colagem como base: a peça é feita de UI (chat do WhatsApp com mensagens reais, notificações,
painel), cenas em react-three-fiber e tipografia cinética. **Tudo vira a próxima coisa** (ref4): uma
bolha vira pill, que vira check, que vira o card seguinte; corte seco só em batida dramática.

## Sistema visual

| Item | Regra |
|---|---|
| Fundo | `#000000`, grade de 1 px `#FFFFFF` a 6% a cada 90 px; cartões `#111827` |
| Shapes | **quadrados**: raio 0 nos blocos, 8–12 px só em bolha de chat e botão; contorno 2 px; nada de squircle de iOS |
| Acento | `#39FF14`, **um por cena** (palavra, check, ponto, linha) |
| Objeto-fio | o **ponto verde** (o "v" do símbolo) atravessa a peça: é o cursor, o ponto final, o check, o status "online" (ref3) |
| Moldura técnica | texto mono pequeno nos cantos: `vistra.ia` · capítulo `01 / O ERRO` · relógio rodando `23:59:58` (ref3 + ref1) |
| Manchete | Inter 900, minúsculas, 2 a 5 palavras por vez; a palavra-chave **2–3× maior** e/ou em verde (ref1, ref2) |
| Dado | IBM Plex Mono 500: horários, contadores, "visualizado 14:02" |
| Legenda | o próprio texto cinético é a legenda (ref2); nunca bloco de legenda separado |

## Componentes do motor (`motion/remotion/src/vistra/`)

| Componente | O que faz | Parâmetros (30 fps) | De onde |
|---|---|---|---|
| `PalavraBlur` | palavra entra de blur 10 px + 14 px em x até nítida | spring damping 200, stiffness 120; stagger 3–5 f | ref2 |
| `TextoSilaba` | sílabas em tamanhos diferentes formando bloco; entra esticada/borrada | 5 f por sílaba, 3 f entre elas; sai achatando numa linha | ref1 |
| `EcoPalavra` | palavra repete 3–4× embaixo, cada cópia mais apagada | 2 f de atraso entre cópias | ref2 |
| `ChatWhatsApp` | tela de conversa quadrada, bolhas reais, ticks, "digitando…", "visualizado" | bolha nasce do rabicho, damping 13, stiffness 200; uma a cada ~14 f | ref2 |
| `Notificacao` | banner que cai do topo e empilha | spring damping 12, stiffness 180; 6–9 f | ref5 |
| `Relogio` | relógio mono que corre/acelera (40 min em 2 s) | interpolação com ease-in expo | ref1 |
| `Celular3D` (r3f) | celular de bloco reto em perspectiva, tela = composição Remotion como textura | balanço ±3°, mergulho na tela com escala até 12× e rotateX 0→50° em 18 f | ref4, ref5 |
| `BolhasProfundidade` (r3f) | notificações flutuando em camadas, câmera orbitando | parallax, DOF falso | ref5 |
| `LinhaDesenha` | linha que se desenha (dashoffset) e puxa a câmera de um card ao outro | 12–18 f, ease-out expo | ref4 |
| `MorphForma` | bolha → pill → check → card | 8–12 f, bezier(0.16,1,0.3,1) | ref2, ref4 |
| `CursorClique` | cursor quadrado que clica num botão; botão afunda e acende | squash 0.9 em 3 f | ref5, ref3 |
| `Contador` | número rolando (0 → 40 min; 40 min → 3 s) | ease-out expo 20 f | ref3 |
| `Flash` | 1 frame invertido ou branco na batida | só 2–3 por peça | ref4, ref5 |
| `MotionBlur` | blur direcional em tudo que é rápido | `@remotion/motion-blur` (`CameraMotionBlur`, 5–8 amostras) | ref3, ref4 |

## Movimento

- **Curvas:** entrada ease-out expo `bezier(0.16,1,0.3,1)`; saída ease-in expo; pop com spring damping
  12–14, stiffness 170–200 (overshoot ~4%). Câmera 3D sempre ease-in-out longo, nunca para de vez.
- **Ritmo:** algo muda a cada 0,7–1 s na abertura e no conteúdo; respiros de 10–15 f. **Freia** no clímax
  emocional (ref1: a desaceleração é o recurso dramático) e no CTA.
- **Transições:** objeto que enche a lente (bolha, cursor), match cut na forma do centro, máscara em
  blocos quadrados (pixel), whip com blur. Sem crossfade mole.
- **Batida:** o corte cai na palavra-chave da narração (fase 05 dá o tempo); flash só em 2–3 batidas.

## Copy no motion (ref1)

- Confissão em 1ª pessoa, frase curta, **anáfora** ("Eu vi… Eu vi…"; "O primeiro. Não o… Não o… O primeiro.").
- Objetos concretos do dia (loja cheia, cachorro na mesa, telefone tocando) viram cena, um por frase.
- A peça **fecha no objeto em que começou** (o relógio dos quarenta minutos): o Reel repete em laço.

## Não copiar

Marcas, fotos, rostos, frases e músicas das referências; a combinação cortiça + peças de encaixe (ref1); o
visual de iMessage e iOS (ref2, ref4); a paleta roxo/magenta (ref5) e vermelho/azul/amarelo (ref3); formato
16:9 e quadrado (ref3, ref4, ref5). Preço nunca aparece na tela.
