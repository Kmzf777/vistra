# Vistra CRM: banco novo e fluxo "Próximo lead" (design)

Data: 26/10/2026. Autor do desenho: Claude, a partir da conversa com o Kelwin (dono).
Pesquisas que sustentam este documento (ler antes de planejar):

- `aprendizados/docs/crm-db/2026-10-26-engenharia-reversa.md`: o banco atual, regras R1–R28, lacunas G1–G20, invariantes.
- `aprendizados/docs/crm-db/2026-10-26-boas-praticas.md`: Supabase/Postgres/Next 16, checklist "faça / não faça".
- `aprendizados/docs/crm-db/2026-10-26-fluxo-proximo-lead.md`: fila empurrada, cota diária, passos guiados, WhatsApp.
- `aprendizados/docs/crm-db/2026-10-26-abordagem-email-whatsapp.md`: texto das mensagens (só WhatsApp; e-mail descartado).
- `aprendizados/docs/2026-10-26-margem-site-497.md`: preço, piso, comissão, margem.

Neste documento, **[Kelwin]** marca o que ele decidiu; **[minha decisão]** marca escolha minha que ele pode trocar.

## 1. Por que

A Vistra vende sites (R$ 497/ano) para comércios locais de Uberlândia que não têm site. Quem prospecta são amigos
do Kelwin, todos estudantes da UFU, pelo WhatsApp de cada um, 5 conversas novas por dia. Hoje o CRM é uma lista em
que cada um escolhe e "pega" o lead, e as mensagens personalizadas ficam em arquivos fora do CRM.

O Kelwin quer duas coisas:

1. **Para a equipe [Kelwin]:** abrir o CRM no celular ou no notebook, apertar um botão e receber o lead já atribuído;
   saber exatamente o que mandar em cada momento (abertura, passar pelo robô do comércio, mensagem principal).
2. **Para ele [Kelwin]:** enxergar se a equipe está usando o sistema. Nas palavras dele, se não estiverem, ele "mata o
   projeto e faz sozinho". Esse é o critério de sucesso do produto: a tela do dono precisa responder isso em segundos.

E quer o banco **refeito do zero**, numa conta Supabase dele, seguindo boas práticas, em vez de herdar o banco atual
(que está na conta do Rafael, divide uso com outro projeto do Rafael e tem problemas sérios: ver engenharia reversa §0).

## 2. Objetivos, não objetivos e antiobjetivos

**Objetivos**

- Banco novo no Supabase, organização "Vistra" da conta do Kelwin (já criada, plano Free, sem projeto), versionado
  por migrações no git, com RLS correta, testes e tipos gerados.
- Fluxo "Próximo lead" com passos guiados e mensagens prontas por lead.
- Tela do dono com o uso da equipe.
- Registro da primeira venda (valor, comissão) e a passagem do lead para o Kelwin fazer a prévia.
- Migrar o que existe hoje sem perder nada e sem trazer de volta lead descartado ou bloqueado.

**Não objetivos (fora desta etapa)**

- Hospedagem dos sites dos clientes [Kelwin: "uma Vercel para cada cliente, usando o domínio dele"]. Ver §11, riscos.
- Forma jurídica e emissão de nota [Kelwin: "vou dar algum jeito de passar como MEI"].
- Pagar comissão. O CRM só calcula e mostra quanto cada um tem a receber [minha decisão].
- E-mail para leads e pesquisa de sócios [Kelwin descartou os dois].
- Teste A/B de mensagens (volume insuficiente; só registrar a versão usada, ver pesquisa do fluxo, ponto 9).
- Raspagem e verificação de leads continuam fora do CRM (`prospeccao/scripts/`); o CRM só importa o resultado.

**Antiobjetivos (seria fracasso mesmo funcionando)**

- O CRM **enviar** qualquer mensagem sozinho. Os termos do WhatsApp proíbem; o vendedor sempre aperta enviar.
- Dois vendedores chamarem o mesmo comércio, ou alguém chamar de novo quem pediu para parar.
- Um lead sem site confirmado entrar na fila (regra do Kelwin: "com toda a certeza que não tem site").
- Qualquer pessoa da internet conseguir ler leads ou contatos (é o problema do banco atual).
- Mensagem chegar ao lead com dois-pontos, travessão, menção à Vistra ou promessa que viola as regras dos conselhos.
- A tela do dono mostrar número que muda quando alguém larga um lead (placar atual faz isso).

## 3. Restrições

- **Supabase Free:** 500 MB, sem backup automático, pausa após 7 dias com pouco uso, 2 projetos ativos por pessoa
  (a conta do Kelwin tem 1 ativo hoje; o "Personal Finance" está pausado).
- **Mudanças de plataforma:** a partir de 30/10/2026 toda tabela nova em `public` precisa de `GRANT` explícito para a
  Data API; o projeto novo nasce com chaves `sb_publishable_` / `sb_secret_` (as legadas saem até o fim de 2026).
- **App:** Next.js 16 (App Router, Server Actions, `@supabase/ssr`) em `crm/`. Ler `crm/AGENTS.md`: o Next 16 tem
  mudanças que quebram o que se sabe de versões antigas. `getClaims()` no servidor, autorização dentro de cada Server Action.
- **Deploy:** o projeto Vercel `vistracrm` é do Rafael (Hobby). Trocar as 3 variáveis de ambiente e fazer redeploy
  depende dele. O push no repositório já publica (testado em 26/10 com o commit `fde251a`).
- **Repositório público** (`github.com/Kmzf777/vistra`): nenhum dado real de lead, chave, dump ou seed real no git.
  Dados de lead ficam em `prospeccao/leads/` (ignorado).
- **LGPD:** telefone do dono de um comércio é dado pessoal. Base: legítimo interesse; pedido para parar é atendido na hora
  e vale para sempre (art. 18 §2º).
- **WhatsApp:** só `wa.me/<número>?text=` para abrir conversa com texto pronto; nunca `web.whatsapp.com/send?phone=`
  (trava o WhatsApp Web, lição registrada na skill `prospectar`). Uma mensagem por link; as partes seguintes vão por "copiar".
- **Mensagens:** regras do Kelwin (§7). Para clínicas: CFO 196/2019, CFM 2.336/2023, CFMV 1.649/2025.

## 4. Fluxo do vendedor [Kelwin, com detalhes meus marcados]

Celular primeiro; no notebook é a mesma tela, mais larga.

1. **Início.** Mostra "hoje você abriu X de 5", a lista **Agora** (conversas que pedem ação: alguém respondeu,
   acompanhamento vencido, prévia pronta para enviar) e o botão grande **Próximo lead**.
2. **Próximo lead.** O banco entrega um lead e já o atribui ao vendedor, de forma atômica.
   - Só entram na fila leads com verificação aprovada, mensagem aprovada, sem bloqueio, sem dono, não clientes.
   - Ordem: prioridade, depois nota e avaliações (invariante 13). Filtro opcional por cidade e nicho, ajustável pelo
     admin, para "secar" um nicho por vez [Kelwin: secar Uberlândia por nichos, depois outras cidades].
   - Cota: 5 aberturas por dia por vendedor (configurável por pessoa). Esgotada, o botão avisa que acabou o dia.
   - Um lead por vez [minha decisão]: enquanto houver um lead reservado sem abertura enviada, o botão leva a ele.
   - Reserva vence no fim do dia se a abertura não foi registrada; o lead volta à fila [minha decisão, da pesquisa].
     Depois da abertura enviada, o lead nunca volta à fila.
3. **Passo a passo do lead** (o passo atual fica salvo, porque o vendedor sai para o WhatsApp e volta):
   1. **Abertura:** botão abre o `wa.me` com a abertura do lead já digitada. O vendedor marca "enviei".
   2. **Quem respondeu:** robô/menu (mostra respostas curtas para copiar), pessoa, ninguém ainda.
   3. **Mensagem principal:** 2 ou 3 partes, cada uma com "copiar", na ordem. Marca "mandei".
   4. **Resultado em um toque:** quer ver a prévia; perguntou outra coisa ou preço; não tem interesse; pediu para não
      chamar mais; não respondeu (agenda acompanhamento único em 2 dias úteis); número errado ou sem WhatsApp.
4. **Quer ver a prévia** [Kelwin]: o vendedor continua dono da conversa. O lead entra na lista **Sites para fazer**
   do admin [minha decisão: em vez de o amigo avisar o Kelwin por mensagem]. O Kelwin passa ao Claude, que monta o site
   e a apresentação em imagens (PDF). Quando o admin anexa o link do site e o PDF, o lead aparece em **Agora** do
   vendedor como "prévia pronta para enviar". O vendedor envia e conduz até fechar, inclusive o preço.
5. **Fechou:** o vendedor registra valor combinado (preço de tabela R$ 497/ano, piso configurável), forma de pagamento
   e data. O CRM calcula a comissão (50% da primeira venda [Kelwin]). O piso é só referência: o vendedor tem
   autonomia para negociar abaixo dele, sem bloqueio nem aprovação [Kelwin: "deixo os mlk ter autonomia"].
6. **Pediu para parar:** bloqueia o telefone (e o place id) na base inteira, para todos, inclusive importações futuras.

## 5. Tela do dono [Kelwin: "só se a rapaziada tá usando o sistema ou não"]

Uma linha por vendedor, com filtro hoje / semana / desde o início: último acesso, leads recebidos, aberturas
enviadas, respostas de pessoa, pedidos de prévia, vendas, comissão a receber. Destaque para quem está há 2 dias úteis
ou mais sem abertura [minha decisão; o número é configurável]. Os números vêm do histórico append-only, então não
mudam quando um lead é largado ou reatribuído.

O admin também tem: **Sites para fazer** (fila de prévias, com tempo desde o "sim"), **Vendas**, a
gestão da fila (cidade/nicho ativos, cota por pessoa), convites e desativação de vendedores, e o importador.

## 6. Modelo de dados

Nomes em português, `snake_case`, como no app. A forma final das tabelas é do construtor; abaixo está o que precisa
existir e as regras que o banco (não o app) garante.

**Pessoas**

- `perfis`: 1:1 com `auth.users` via trigger (padrão oficial). `nome`, `curso` (usado na mensagem: "sou [nome],
  estudo [curso] na UFU"), `papel` (`vendedor` | `admin`), `ativo`, `cota_diaria` (padrão 5), `comissao_pct`
  opcional por pessoa. Papel e ativo lidos por funções `private.*`; nunca de `user_metadata`.
- Entrada só por convite do admin; cadastro aberto desligado. Exige SMTP próprio antes do primeiro convite (o SMTP
  embutido manda 2 e-mails por hora). Vendedor desativado perde acesso na hora e **não** perde histórico nem vendas
  (corrige o `on delete set null` atual).

**Domínios** (tabelas pequenas, editáveis pelo admin)

- `cidades` (nome, UF, ativa).
- `nichos` (nome, template de site, regras do conselho quando for clínica, ativo).
- `etapas_funil` (ordem, terminal sim/não) [da pesquisa: enum não deixa remover nem reordenar].
- Listas fechadas pequenas (passo, resultado, motivo de descarte) em `text` + `CHECK` [da pesquisa].

**Lead e o que se sabe dele**

- `leads`: nome, cidade, nicho, endereço, nota, avaliações, Instagram, seguidores e a data desse dado,
  `google_place_id` único (chave natural nova), prioridade, gancho, estado de prospecção, dono, reservado_em,
  próximo passo e data, etapa do funil quando houver. Nunca apagado: descartado/arquivado com motivo, data e autor
  (pode ser o verificador).
- `telefones_lead` 1:N: número em E.164, tipo (fixo, celular, WhatsApp), origem (Google, bio do Instagram...),
  principal. Normalização no app (libphonenumber) e índice para deduplicar [lacuna G14: 17 de 46 são fixos].
- `verificacoes_site` 1:N: veredito (`PODE_ABORDAR`, `SITE_QUEBRADO`, `TEM_SITE`, `FECHADO`, `DESCARTE_LEAD_FRACO`,
  `DUVIDA`), evidências em `jsonb`, data, ferramenta. O veredito vigente decide se o lead entra na fila.
- `mensagens_lead`: versões do roteiro do lead (abertura, respostas para robô, partes da principal, acompanhamento),
  com placeholders `[nome]` e `[curso]`, status (rascunho, aprovada), autor e data. Só versão aprovada entra na fila.
  Cada envio registra qual versão foi usada.
- `contatos`: quem decide (nome, cargo, telefone), como hoje.
- `bloqueios`: lista de supressão por telefone E.164 e por place id, com motivo (pediu para parar, cliente atual,
  descarte), data e origem. Consultada pelo `Próximo lead` e pelo importador.
- Redes e duplicados: lead pode apontar para um grupo (mesma rede ou mesmo telefone), para uma pessoa só conduzir
  todos [lacuna G10]. A forma é do construtor.

**O que acontece**

- `eventos_lead`: append-only, `bigint identity`, gravado **pelo banco** na mesma transação de cada ação (recebeu,
  abertura enviada, robô, pessoa respondeu, mensagem enviada com a versão, resultado, prévia pedida, prévia pronta,
  prévia enviada, venda, largou, descartou, bloqueou, reserva venceu). Base da tela do dono.
- `pedidos_previa`: lead, vendedor, pedido em, status (pendente, pronta, enviada), link do site, PDF (Supabase
  Storage privado ou link; decisão do construtor, ver §10), pronto em.
- `vendas`: lead, vendedor, valor combinado, forma de pagamento, fechado em, pago em, comissão calculada, repassado em.
  Renovação fica fora desta etapa [Kelwin: "queremos somente vender agora, a primeira venda"]. Comissão = valor × percentual vigente gravado na própria venda (não muda se a configuração mudar).
- `configuracao`: preço de tabela (497), piso de referência (397, da pesquisa de margem, sem bloqueio), comissão da venda (50%), cota
  padrão, dias para acompanhamento (2 úteis), dias para alerta de vendedor parado (2 úteis). Só admin edita.

**Ações como funções no banco (RPC)**, cada uma atômica e gravando o evento: próximo lead, registrar passo/resultado,
largar (só se a abertura não foi enviada), pedir prévia, anexar prévia (admin), registrar venda, descartar,
bloquear, importar lote (admin). Erros com mensagem em português legível (invariante 15).

**Segurança (RLS)**

- Vendedor lê **só os próprios leads** e o que pende deles (mensagens, telefones, eventos). Ele não precisa navegar o
  poço no fluxo novo [minha decisão; corrige a exposição atual de todos os contatos para qualquer conta]. Admin lê tudo.
- Escrita só por RPC; nenhuma escrita direta do navegador nas tabelas.
- Nada para `anon`. `GRANT` explícito por tabela. Funções `security definer` com `search_path = ''` no schema `private`.
- `(select auth.uid())`, `TO authenticated`, índice em toda coluna de policy e FK (checklist da pesquisa).
- Chave secreta só no servidor, sem `NEXT_PUBLIC_`.

## 7. Mensagens

O conteúdo é gerado fora do CRM (por Claude, com os dados do lead e da verificação), validado por script e carregado
em `mensagens_lead` como aprovado. Regras [Kelwin]: AIDA, no máximo 650 caracteres somando as partes, 2 ou 3 partes,
humanizada, sem dois-pontos, sem travessão, sem citar a Vistra; depois de `.`, `?` ou `!`, ou quebra a linha e começa
minúscula, ou segue na mesma linha com maiúscula. Apresentação com nome e curso do vendedor ("estudo na UFU", nunca
"somos da UFU", da pesquisa da abordagem). O validador existente
(`scratchpad/mensagens.py` desta sessão) vira script do repositório, sem dados reais.

Conteúdo da abordagem [Kelwin escolheu a versão dele, mais curta, com dor e transformação explícitas]. Modelo
(pet shop, 556 caracteres, validado):

1. `que bom falar com você! Sou o [nome], estudo [curso] na UFU`
2. `vi a nota [nota] da [negocio] no Google, com [avaliacoes] avaliações. Parabéns!` + quebra +
   `só não achei um site de vocês. [dor do nicho]`
3. `[transformação do nicho]` + quebra + `estou montando uma startup com uns amigos e, para levantar capital, fazemos
   sites por um preço bem justo. Montei uma prévia para vocês e ela é gratuita. Posso te mandar?`

Dor e transformação por nicho ficam em `nichos` (pet shop, odonto, estética, veterinária); nas clínicas, só achar,
conferir e agendar, sem promessa de resultado. A pesquisa recomendava deixar preço e "levantar capital" para depois do
"sim"; o Kelwin optou por manter.

## 8. Migração do banco atual

- Leads: os 46 atuais (35 sem dono e 11 com dono, mantendo o dono) e os 50 aprovados em
  `prospeccao/leads/uberlandia/novos-aprovados.json`.
- Os 71 apagados em 26/10 (backup em `prospeccao/leads/uberlandia/crm-backup-antes-limpeza-2026-10-26.json`) entram
  como descartados com o motivo da revisão, para nunca voltarem. Clientes atuais (Agrozet, Alva, Mar Azul) entram em
  `bloqueios` como cliente.
- Contatos e eventos atuais são migrados. Usuários: convidados de novo no banco novo [minha decisão; são poucos e o
  cadastro antigo não tinha controle de quem entrava].
- Importador novo, idempotente por `google_place_id` (e telefone E.164 como segunda chave), checando `bloqueios`.
- Corte: o banco antigo fica só leitura até a virada; o Rafael troca as 3 variáveis na Vercel e faz redeploy; conferir
  login, fila e tela do dono em produção; depois disso, o banco antigo pode ser pausado pelo Rafael.

## 9. Operação

- Migrações pelo CLI (`migration new`, `db reset` local, `db push --dry-run`, `db push`); nada pelo SQL Editor.
- Tipos gerados (`supabase gen types`) e commitados.
- Testes pgTAP das policies e RPCs (`supabase test db`), incluindo: dois vendedores apertando ao mesmo tempo nunca
  recebem o mesmo lead; cota respeitada; bloqueado nunca entra na fila; largar proibido depois da abertura; vendedor
  não lê lead de outro.
- Security e Performance Advisor sem alertas depois de cada migração.
- Backup: `supabase db dump` diário, guardado fora do repositório (o repo é público).
- Pausa por inatividade: com uso diário da equipe não deve ocorrer; o próprio dump diário não conta como uso
  confiável, então documentar como restaurar.
- Teste manual antes de liberar: Android, iPhone e notebook (wa.me no notebook, quebra de linha `%0A`, botão copiar
  no Safari; nada disso é documentado pelo WhatsApp).

## 10. Deixado para o construtor

- Forma exata das tabelas, nomes de colunas, índices, e se redes/duplicados viram tabela ou coluna.
- Expiração da reserva: verificar no momento do "Próximo lead" ou por agendamento (conferir se `pg_cron` existe no Free).
- Onde guardar o PDF (Storage privado com URL assinada, ou link externo).
- Qual serviço de SMTP usar para os convites (precisa de um antes do primeiro convite).
- O desenho visual das telas, seguindo `marca/` e o padrão atual do CRM (verde #39FF14, preto).
- Se o modo demonstração sem banco (invariante 14) continua; se continuar, não quebrar `lib/leadsRaspados.ts`.
- A ordem de entrega das fatias, desde que o primeiro corte em produção já tenha: fila com cota, passos, mensagens,
  resultado, bloqueio e tela do dono.

## 11. Riscos conhecidos

- **Hospedagem dos clientes na Vercel Hobby.** Os termos dizem que o Hobby é "non-commercial personal use only" e
  citam como uso comercial "Receiving payment to create, update, or host the site". Uma conta Hobby por cliente não
  muda isso, porque o site é de um negócio e alguém recebe para fazê-lo. Fora do escopo; registrado para o Kelwin.
  O próprio CRM também roda num Hobby.
- **MEI.** A pesquisa de margem não achou ocupação de criação de sites no anexo oficial do MEI. Fora do escopo.
- **Comissão de 50%** [Kelwin]. Na pesquisa, com 50% a margem econômica do primeiro ano fica perto de zero (o tempo do
  Kelwin come o resto) e o lucro passa a depender da renovação. Por isso a comissão é configurável e gravada em cada venda.
- **Política do WhatsApp** exige permissão prévia de quem recebe; a prospecção fria fica em risco de restrição do número
  de cada amigo. Mitigação: volume baixo, sem link antes do "sim", um acompanhamento só, parar na hora.

## 12. Decisões tomadas depois da leitura do construtor [minha decisão em todas]

1. **Telas atuais.** O app é adaptado, não reescrito do zero. Para o vendedor, a `/lista` e o placar saem; ficam
   Início (Agora + Próximo lead), a tela de passos do lead e "Minhas conversas". O kanban vira o funil depois do "sim",
   com etapas `previa_pedida` → `previa_pronta` → `previa_enviada` → `negociando` → `fechou` | `perdeu`, mantendo o
   relógio "parado há" (invariante 12). O contato de quem decide é opcional e não trava etapa (no fluxo novo quem
   conduz é o amigo, pelo próprio WhatsApp). A `/lista` completa e "criar lead à mão" ficam só para o admin, e lead
   criado à mão só entra na fila depois de verificação e mensagem aprovadas.
2. **Os 11 leads com dono hoje** migram como "abertura enviada" (conservador: nunca voltam à fila, para ninguém chamar
   de novo uma loja já chamada). Os vendedores são reconvidados e o dono é ligado pelo e-mail. Lead de quem não voltar
   fica com o admin, que decide.
3. **Mensagens no lançamento.** Abertura, respostas para robô, acompanhamento e resposta a "perguntou preço" são um
   modelo por nicho (com `[nome]`, `[curso]`, `[negocio]`); a mensagem principal é por lead. As 85 principais já
   escritas (`mensagens-poco.md`, `mensagens-novos.md`) serão reescritas no conteúdo decidido em §13.1 e carregadas
   como aprovadas antes do corte. Sem isso a fila nasce vazia.
4. **Corte.** Desenvolvimento num branch, testado localmente contra o projeto novo; `main` só recebe o código no dia
   da virada, junto com a troca das variáveis na Vercel pelo Rafael. Até lá o banco antigo segue como está; o Rafael
   pausa depois que tudo estiver conferido.
5. **Comissão a receber** conta a partir de `pago_em` (o cliente pagou), não do fechamento. A venda tem "repassado em",
   para o "a receber" zerar. Renovação é uma nova linha em `vendas`, registrada pelo admin, ligada à venda original; a
   comissão da renovação vai para o vendedor original mesmo desativado.
6. **Telefone.** Só entra na fila lead com um número marcado como WhatsApp (bio do Instagram, WhatsApp Business ou
   confirmado); só fixo fica fora até alguém achar o WhatsApp. "Número errado ou sem WhatsApp" tenta o próximo número
   do lead; sem outro, o lead volta para verificação. A cota conta aberturas **enviadas**, então isso não gasta cota.
7. **Vendedor desativado.** Os leads em conversa dele vão para o admin, que pode reatribuir. O novo dono lê o histórico
   do lead; os números da tela do dono continuam contando para quem fez cada ação.
8. `SITE_QUEBRADO` entra na fila (o site quebrado vira o gancho da mensagem).

## 13. Respostas do Kelwin

1. Mensagem: a versão dele, curta, com dor e transformação (§7).
2. Renovação: fora desta etapa; só a primeira venda importa agora. A comissão da renovação no item 5 de §12 fica
   para depois.
3. Venda abaixo do piso: o vendedor tem autonomia, sem bloqueio nem aprovação. O piso aparece só como referência.
