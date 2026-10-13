// Peça 01 — quarenta minutos. A raiz: escolhe a cena pelo quadro, põe a grade, a moldura
// técnica, a legenda cinética, as transições em blocos e o som.

import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, getStaticFiles, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {FPS, fq} from '../../vistra/base';
import {Grade, Moldura, hora} from '../../vistra/moldura';
import {Legenda} from '../../vistra/texto';
import {Blocos, Flash, Varredura} from '../../vistra/transicao';
import * as C from './cenas';
import * as R from './roteiro';

export {FPS};
export const DURACAO = fq(R.FIM);

const S = R.CENAS;
const ORDEM: [number, React.FC<{q: number}>][] = [
  [S.gancho, C.Gancho],
  [S.cena, C.CenaChat],
  [S.pergunta, C.Pergunta],
  [S.lista, C.Lista],
  [S.ficha, C.Ficha],
  [S.ponte, C.Ponte],
  [S.solucao, C.Solucao],
  [S.notifs, C.Notifs],
  [S.conversa, C.Conversa],
  [S.oficial, C.Oficial],
  [S.marca, C.Marca],
  [S.fecho, C.Fecho],
];

const cenaEm = (q: number) => {
  let k = 0;
  for (let i = 0; i < ORDEM.length; i++) if (q >= fq(ORDEM[i][0])) k = i;
  return ORDEM[k][1];
};

const capituloEm = (t: number) =>
  t < S.pergunta ? '01 · o erro' : t < S.ficha ? '02 · a pergunta' : t < S.solucao ? '03 · a ficha' : t < S.marca ? '04 · a solução' : t < S.fecho ? '05 · vistra.ia' : '01 · o erro';

/** Relógio da história no canto: a demora corre, a solução mostra a hora de cada mensagem. */
function relogioEm(t: number): {txt: string; verde: boolean} {
  const corre = (de: number, ate: number, m0: number, m1: number) => {
    const p = Math.max(0, Math.min(1, (t - de) / Math.max(0.01, ate - de)));
    return 'sáb ' + hora(m0 + (m1 - m0) * p);
  };
  if (t < S.cena) return {txt: corre(R.em(R.GANCHO, 'quarenta'), R.GANCHO.fim, 14 * 60 + 2, 14 * 60 + 42), verde: t > R.em(R.GANCHO, 'quarenta')};
  if (t < R.DEPOIS.inicio) return {txt: 'sáb 14:02', verde: false};
  if (t < S.pergunta) return {txt: corre(R.DEPOIS.inicio, R.DEPOIS.fim, 14 * 60 + 2, 14 * 60 + 42), verde: t < R.RESPONDI.inicio};
  if (t < S.ficha) return {txt: 'dom 10:15', verde: false};
  if (t < S.notifs) return {txt: '— —', verde: false};
  if (t < R.DOMINGO.inicio) return {txt: 'ter 02:13', verde: true};
  if (t < R.LOJA_CHEIA.inicio) return {txt: 'dom 09:40', verde: true};
  if (t < S.oficial) return {txt: 'sáb 14:02', verde: true};
  if (t < S.fecho) return {txt: '24h', verde: true};
  return {txt: 'agora', verde: true};
}

// transições: blocos nas trocas de assunto, varredura nas trocas rápidas, flash na batida
const BLOCOS = [S.cena, S.pergunta, S.lista, S.ponte, S.notifs, S.conversa, S.oficial, S.fecho];
const VARRE = [R.TRES.inicio, S.solucao, S.marca];
const FLASH = [R.FICA.inicio, R.em(R.BANIDO, 'banido')];

/** Efeitos: [arquivo, segundo, volume]. Todo tempo lido do roteiro. */
const EF: [string, number, number][] = [
  ['drone', 0, 0.5], ['batimento', 0.05, 0.5],
  ['thump', R.em(R.GANCHO, 'quarenta'), 0.8], ['tick', R.em(R.GANCHO, 'quarenta') + 0.2, 0.4],
  ['pop', R.PERGUNTA.inicio, 0.5], ['pop', R.LOJA.inicio, 0.45], ['pop', R.CACHORRO.inicio, 0.45], ['pop', R.TELEFONE.inicio, 0.45],
  ['digitacao', R.em(R.PENSEI, 'já'), 0.5],
  ['tick', R.DEPOIS.inicio, 0.5], ['tick', R.DEPOIS.inicio + 0.3, 0.4], ['tick', R.DEPOIS.inicio + 0.6, 0.3],
  ['pop', R.RESPONDI.inicio, 0.5], ['tink', R.em(R.VISUALIZOU, 'visualizou'), 0.4], ['graos', R.em(R.SUMIU, 'sumiu'), 0.6],
  ['pop', R.em(R.SEGUINTE, 'por'), 0.6],
  ['pop', R.TRES.inicio, 0.4], ['pop', R.TRES.inicio + 0.17, 0.4], ['pop', R.TRES.inicio + 0.33, 0.4], ['brilho', R.em(R.FIQUEI, 'primeiro'), 0.6],
  ['rabisco', R.BARATO.fim - 0.07, 0.5], ['rabisco', R.MELHOR.fim - 0.07, 0.5], ['thump', R.PRIMEIRO2.inicio, 0.7],
  ['thump', R.FICA.inicio, 0.8],
  ['tink', R.em(R.CHEGUEI, 'oficial'), 0.7],
  ['ding', R.MADRUGADA.inicio, 0.5], ['ding', R.DOMINGO.inicio, 0.5], ['ding', R.LOJA_CHEIA.inicio, 0.5],
  ['pop', R.PRECO.inicio, 0.5], ['pop', R.AGENDA.inicio, 0.45], ['brilho', R.em(R.AGENDA, 'banho'), 0.5], ['ding', R.CHAMA.inicio, 0.6],
  ['pop', R.OFICIAL.inicio, 0.45], ['brilho', R.em(R.OFICIAL, 'oficial'), 0.5], ['thump', R.em(R.BANIDO, 'banido'), 0.8],
  ['brilho', R.em(R.VISTRA, 'vistra'), 0.7], ['pop', R.SERVE.inicio, 0.4],
  ['thump', R.QUARENTA.inicio, 0.7],
  ...[S.cena, S.pergunta, S.lista, S.ponte, S.notifs, S.conversa, S.oficial, S.fecho].map((t) => ['whoosh', t - 0.25, 0.35] as [string, number, number]),
  ...[R.TRES.inicio, S.solucao, S.marca].map((t) => ['slide', t - 0.2, 0.35] as [string, number, number]),
];

const OCULTA: [number, number][] = [
  [0, S.cena],
  [S.lista, S.ponte],
  [S.fecho, 999],
];

export const Peca: React.FC = () => {
  const q = useCurrentFrame();
  const t = q / FPS;
  const Cena = cenaEm(q);
  const rel = relogioEm(t);
  const temSfx = getStaticFiles().some((f) => f.name === 'sfx/trilha.wav');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Grade deslocY={-q * 0.6} opacidade={t >= S.ficha && t < S.ponte ? 0.35 : 1} />
      <Cena q={q} />
      <Moldura q={q} capitulo={capituloEm(t)} relogio={rel.txt} destaqueRelogio={rel.verde} />
      <Legenda q={q} P={R.PALAVRAS} oculta={OCULTA} verdes={['primeiro', 'oficial', 'vistra', 'agora', 'hora', 'banido']} />
      {BLOCOS.map((s) => <Blocos key={s} q={q} em={fq(s)} />)}
      {VARRE.map((s) => <Varredura key={s} q={q} em={fq(s)} />)}
      {FLASH.map((s) => <Flash key={s} q={q} em={fq(s)} />)}
      <Audio src={staticFile('fonte/narracao.mp3')} />
      {temSfx && <Audio src={staticFile('sfx/trilha.wav')} volume={0.32} />}
      {temSfx &&
        EF.map(([nome, seg, vol], k) => (
          <Sequence key={k} from={Math.max(0, fq(seg))} durationInFrames={45}>
            <Audio src={staticFile(`sfx/${nome}.wav`)} volume={vol} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
