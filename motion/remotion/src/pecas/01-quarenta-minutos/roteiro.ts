// Peça 01 — quarenta minutos. Cada trecho da narração, em ordem; os tempos vêm do
// palavras.json (fase 05). Nenhum segundo das cenas é digitado.

import palavrasJson from '../../../../pecas/01-quarenta-minutos/palavras.json';
import {Roteiro, type Palavra} from '../../colagem/legenda';

export const PALAVRAS = palavrasJson as Palavra[];
const r = new Roteiro(PALAVRAS);
export const em = r.em.bind(r);

// 1 · gancho
export const GANCHO = r.t('Eu literalmente perdi um cliente porque demorei quarenta minutos pra responder ele.');
// 2 · a cena
export const SABADO = r.t('Era sábado.');
export const MANDOU = r.t('Ele mandou:');
export const PERGUNTA = r.t('quanto tá o banho e tosa?');
export const EU_VI = r.t('Eu vi.');
export const LOJA = r.t('Loja cheia,');
export const CACHORRO = r.t('cachorro na mesa,');
export const TELEFONE = r.t('telefone tocando.');
export const PENSEI = r.t('Pensei: já respondo.');
// 3 · a demora
export const DEPOIS = r.t('Quarenta minutos depois,');
export const RESPONDI = r.t('eu respondi.');
export const VISUALIZOU = r.t('Ele visualizou…');
export const SUMIU = r.t('e sumiu.');
// 4 · a pergunta
export const SEGUINTE = r.t('No dia seguinte, eu perguntei por quê.');
export const SINCERO = r.t('E ele foi sincero:');
export const TRES = r.t('mandei pra três pet shops.');
export const FIQUEI = r.t('Fiquei com o primeiro que respondeu.');
export const PRIMEIRO1 = r.t('O primeiro.');
export const BARATO = r.t('Não o mais barato.');
export const MELHOR = r.t('Não o melhor.');
export const PRIMEIRO2 = r.t('O primeiro.');
// 5 · a ficha (ten)
export const FICHA = r.t('Aí caiu a ficha.');
export const NAO_FICA = r.t('O cliente não fica com o melhor.');
export const FICA = r.t('Fica com o primeiro que responde.');
// 6 · a ponte
export const GRUDADO = r.t('E eu não ia passar o dia grudado no celular.');
// 7 · a solução
export const CHEGUEI = r.t('Foi assim que eu cheguei na inteligência artificial no WhatsApp oficial.');
export const NA_HORA = r.t('Ela responde na hora.');
export const MADRUGADA = r.t('De madrugada,');
export const DOMINGO = r.t('no domingo,');
export const LOJA_CHEIA = r.t('com a loja cheia.');
export const PRECO = r.t('Passa o preço certo,');
export const AGENDA = r.t('agenda o banho');
export const CHAMA = r.t('e me chama quando precisa de gente.');
// 8 · oficial
export const OFICIAL = r.t('E como é pela porta oficial da Meta,');
export const BANIDO = r.t('meu número não corre o risco de ser banido só por usar robô.');
// 9 · marca
export const VISTRA = r.t('Quem montou o meu foi a vistra,');
export const UDI = r.t('aqui de Uberlândia.');
export const SERVE = r.t('Serve pra qualquer comércio que vive do WhatsApp.');
// 10 · fecho
export const QUARENTA = r.t('Quarenta minutos.');
export const QUANTO = r.t('Quanto tempo o seu cliente tá esperando agora?');

/** Fim: última palavra + 0,5 s. */
export const FIM = Math.ceil((PALAVRAS[PALAVRAS.length - 1].fim + 0.5) * 10) / 10;

/** Início de cada cena (s) — a fala que abre a cena. */
export const CENAS = {
  gancho: 0,
  cena: SABADO.inicio,
  demora: DEPOIS.inicio,
  pergunta: SEGUINTE.inicio,
  lista: PRIMEIRO1.inicio,
  ficha: FICHA.inicio,
  ponte: GRUDADO.inicio,
  solucao: CHEGUEI.inicio,
  notifs: NA_HORA.inicio,
  conversa: PRECO.inicio,
  oficial: OFICIAL.inicio,
  marca: VISTRA.inicio,
  fecho: QUARENTA.inicio,
};
