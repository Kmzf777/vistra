# 01 — quarenta minutos

**Modo:** `geral` (história em 1ª pessoa com venda leve), inspirado na estrutura de confissão da ref1.
**Duração estimada:** ~73 s a 2,6 palavras/s (187 palavras); a 1,1× fica ~66 s.
**Narrador:** dono de pet shop, 1ª pessoa, contado como real (decisão do Rafael, 2026-10-08).
**Público:** pet shop e qualquer comércio que vive do WhatsApp.

## Tese e alternativas

- **Escolhida:** "O cliente não fica com o melhor. Fica com o primeiro que responde." A dor (cliente
  perdido por demora) leva à solução (IA no WhatsApp oficial) e à Vistra.
- Alt. 1: "23:59. Seu cliente mandou mensagem. Quem respondeu?" (relógio, sem história).
- Alt. 2: "Mandei mensagem pra vinte pet shops às dez da noite" (experimento real, exige fazer o teste).

## Promessas

| Promessa | Aberta em | Paga em |
|---|---|---|
| A: por que eu perdi o cliente | 0 s (gancho) | ~19–29 s ("fiquei com o primeiro que respondeu") |
| B: como eu resolvi | ~36 s ("não ia passar o dia grudado no celular") | ~40–62 s |

Frase repetível (11 palavras, antítese): **"O cliente não fica com o melhor. Fica com o primeiro que responde."** (~30 s)
Fecho volta ao começo: "Quarenta minutos." O relógio que abre é o relógio que fecha.

## Blocos e o que cada um mostra

| Tempo | Bloco | Abre com | Tela (motor Vistra) |
|---|---|---|---|
| 0–4,6 s | **Ki: gancho** | "Eu literalmente perdi um cliente…" | Preto, grade. `TextoSilaba`: "perdi um cliente" com **"quarenta minutos"** 3× maior em verde; `Relogio` mono no canto disparando 14:02 → 14:42 |
| 4,6–13 s | **Shō: a cena** | "Era sábado." | `ChatWhatsApp` quadrado: chega "quanto tá o banho e tosa?" (14:02). Em volta, três ícones-bloco aparecem um por palavra: loja cheia, cachorro na mesa, telefone tocando (shapes minimalistas, contorno 2 px). "já respondo" vira bolha de rascunho que fica cinza |
| 13–16,5 s | **a demora** | "Quarenta minutos depois" | `Contador` rolando 0 → 40 min com motion blur; a resposta sai às 14:42; ticks azuis, "visualizado"… e a conversa esvazia (bolhas caem em blocos de pixel) |
| 16,5–29 s | **a pergunta** | "No dia seguinte" | Câmera r3f atravessa a bolha. Três `Celular3D` lado a lado (pet shop 1, 2, 3, sem nome), cada um com o relógio da resposta: o 1º acende verde com "2 min". `EcoPalavra` em **"o primeiro"**; "não o mais barato / não o melhor" riscados à mão |
| 29–36 s | **Ten: virada** | "Aí caiu a ficha." | Freada: fundo limpo, só a frase repetível em `PalavraBlur`, "primeiro" em verde. 1 `Flash` na batida |
| 36–53 s | **a solução** | "Foi assim que eu cheguei…" | `CursorClique` liga um toggle quadrado "atendimento IA"; `Celular3D` gira de frente; `BolhasProfundidade` com notificações às 02:13, domingo 09:40, sábado 14:02 respondidas em segundos; chat mostra preço, botões "agendar" e o selo "✓ agendado"; "me chama quando precisa de gente" vira notificação "passar para humano" |
| 53–62 s | **oficial** | "E como é pela porta oficial da Meta" | Dois blocos lado a lado: "QR Code" com cadeado quebrado × "API oficial" com escudo verde; `LinhaDesenha` liga o número da loja ao escudo |
| 62–69 s | **Ketsu: marca** | "Quem montou o meu foi a vistra" | Logo `vistra.ia` montado a partir do ponto verde (`MorphForma`); grade de ícones de comércio (pet, tesoura, sacola, prédio) acendendo um a um |
| 69–73 s | **fecho** | "Quarenta minutos." | Volta ao `Relogio` do gancho, agora correndo no tempo do espectador; pergunta final em `PalavraBlur`; última imagem emenda na primeira (laço) |

Moldura técnica o tempo todo: `vistra.ia` no canto superior esquerdo, capítulo (`01 o erro` · `02 a pergunta` ·
`03 a ficha` · `04 a solução`) e relógio mono no canto direito.

## Fatos → fonte

| # | Trecho | Fato | Fonte | Marca | Ressalva |
|---|---|---|---|---|---|
| 1 | "porta oficial da Meta" | A WhatsApp Business Platform (API) é o canal oficial da Meta para empresas automatizarem o atendimento | developers.facebook.com/docs/whatsapp | [oficial] | — |
| 2 | "não corre o risco de ser banido só por usar robô" | Os Termos do WhatsApp proíbem "auto-messaging" e acesso "through automated means" no app comum; na API, o robô é permitido | whatsapp.com/legal/terms-of-service (lido 2026-10-08) | [oficial] | o número oficial ainda pode ser restrito por spam ou violar política; por isso "só por usar robô" |
| 3 | "responde na hora, de madrugada, no domingo" | Atendimento 24 h é recurso do produto Vistra | introducao-marca.md, comunicacao-explicativa §4 | [oficial] | — |
| 4 | "passa o preço certo, agenda o banho e me chama quando precisa de gente" | Robô treinado com preços da loja, automação de agendamento e passagem para humano | comunicacao-explicativa §3–4 | [oficial] | — |
| 5 | "aqui de Uberlândia" | Vistra é de Uberlândia (MG) | introducao-marca.md | [oficial] | — |
| 6 | A história (40 min, três pet shops) | Narrativa em 1ª pessoa | decisão do Rafael | narrativa | não é caso medido; **nenhum número de resultado** é dito |

Sem preço na tela nem na fala. Conversas na tela são simuladas.

## Checagem de produto

A peça não acusa nenhum produto da Vistra. Nada sobre site, preço ou prova social.

## OK

Aprovado por Rafael, 2026-10-09 (gerou a narração no ElevenLabs com este texto: voz "Fernando - Enthusiastic & Firm", v4, cortada no mp3cut).
