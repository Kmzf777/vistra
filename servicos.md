# Vistra — serviços que fazemos

Levantamento a partir dos repositórios do GitHub do Rafael (`Kmzf777`, 51 repos públicos, lidos em 08/10/2026).
Repos do Kelwin: **pendente** (o usuário `kelwintobiaslopes` não existe no GitHub, falta o link certo).

Marcado com *(inferido)* = repo sem README; deduzi pela estrutura de arquivos.

---

## 1. Agentes de IA no WhatsApp (atendimento, qualificação e vendas)
O carro-chefe. Bot que conversa, qualifica, responde e passa para humano.
- **jobai / "Julia"**: recepcionista virtual da própria Vistra no WhatsApp (Evolution API + Gemini + Supabase, com buffer de mensagens).
- **Artha-Rafael**: CRM com bot de qualificação por botões, URA de respostas, triagem, funil de retomada de leads.
- **agrozet-petshop / crm**: CRM com simulador de bot rodando a lógica real.
- **an-engenharia**: cliente pede a APR (Análise Preliminar de Risco) pelo WhatsApp e recebe o documento pronto.
- **nutrimatic**: atendimento automatizado e prospecção para nutricionistas.

## 2. CRM e plataformas de disparo / campanhas
- **techprovider** *(inferido)*: plataforma multi-tenant com instâncias de WhatsApp, disparos agendados (cron), etiquetas e copiloto de IA.
- **maquina-de-vendas** *(inferido)*: CRM de vendas com construtor de fluxos de campanha, painel de leads com KPIs e filtros, tela de conversas.
- **Disparador-Joao-The-Man** *(inferido)*: disparador de mensagens.

## 3. Agentes de IA ligados ao ERP / dados da empresa
- **agente-bling**: chat em que o dono pergunta, em português, sobre vendas, faturamento, estoque e produção, e a resposta vem ao vivo do ERP Bling (agente Claude, só leitura, relatório diário).
- **beeinsidecanastra**: análise de margem de contribuição de e-commerce puxando do Bling.
- **dashboardcanastra**: dashboard de KPIs de vendas e leads, com páginas por agente de IA (Valéria: leads; Marcos: atacado).

## 4. Copiloto de vendas em tempo real
- **aivendasite**: escuta a call de vendas e, quando o cliente levanta uma objeção, mostra na hora o argumento certo (classificação em ~300 ms).

## 5. Prospecção e geração de leads
- **Google Maps Scraper Kit** (este repo): raspagem de empresas locais (nome, telefone, site, avaliação) para lista de leads.
- **automacaoinstafollowcafe** *(inferido)*: automação de Instagram: coleta seguidores, analisa a bio com IA, envia mensagem e monitora atividade.
- Cold call / cold outreach (scripts e planilhas de leads neste repo).

## 6. Conteúdo com IA (imagem e vídeo)
- **skills-motion-video-generator / estudio-reels**: produção de Reels narrados em motion de colagem: pesquisa da marca, roteiro com fontes, narração, montagem em Remotion e legenda do post.
- **canastra-content-creator**: motor de imagem com IA ancorado em fotos reais da marca, com travas contra imagem "inventada".
- **foodshorts**: cardápio digital em vídeos curtos verticais, estilo TikTok, com QR code por mesa e delivery (SaaS B2B para restaurantes).

## 7. Sites, landing pages e e-commerce
- **Lojas / e-commerce**: loja-cafecanastra (site e loja em 3 idiomas, pagamento, frete, ERP, assinatura), tabela-atacado-cafe-canastra.
- **Sites institucionais**: LiviaSant-Anna (médica), agrozet-petshop, marazulpromotora, auroramkt, romanovskins, corridadorock, mundodanostalgia, cafecanastrablog, landingvistra / landingvistraprodutos.
- **Programas de afiliados e amostras**: afiliadoscanastra (código, ranking, painel do afiliado), amostracanastra (checkout Mercado Pago, saques, n8n).

## 8. Sistemas sob medida / ferramentas internas
- **notion-canastra**: kanban próprio sobre Supabase.
- **formsnutrimatic**: construtor de formulários.
- **rastreamentopracadamoca**: rastreamento.
- **treino-rafael**: app de consulta de plano de treino (projeto pessoal, não é serviço).
- **Media-Indoor**: mídia indoor com várias TVs, anunciantes e painel.

---

## Proposta de portfólio enxuto (para site e Instagram)
1. **Agente de IA no WhatsApp**: atende, qualifica e agenda 24h.
2. **CRM + disparos com IA**: funil, campanhas, retomada de leads.
3. **IA conectada ao seu ERP**: pergunte sobre vendas e estoque e receba a resposta com dados ao vivo; dashboards.
4. **Prospecção automatizada**: listas de leads (Google Maps, Instagram) e abordagem.
5. **Conteúdo com IA**: Reels narrados e imagens de marca.
6. **Sites, lojas e sistemas sob medida**.

Repos que não entraram (antigos, pessoais ou sem propósito claro): shadowfeed*, analisecomportamentalapostas, carteirinhaestudanteufu, Copy-Code, Easy-Code, The-Bio, SegSat, Patrocine, Criar-Black, canastra-thank-you, canastracomingsoon, appnutrimatic, portfolio.
