// Tipografia cinética da Vistra. O texto É a legenda (ref2): cada palavra entra no
// instante em que é dita, de blur a nítida e de cinza a branco, deslizando 14 px.
// A palavra-chave fica 2–3× maior e/ou verde (ref1). Tudo em minúsculas.

import React from 'react';
import {interpolate} from 'remotion';
import type {Palavra} from '../colagem/legenda';
import {norm} from '../colagem/legenda';
import {PILHA} from '../identidade/tipografia';
import {BRANCO, CINZA, VERDE, assenta, fq, prog, EXPO_IN} from './base';

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Uma palavra que entra no quadro `de`. */
export const PalavraBlur: React.FC<{
  q: number;
  de: number;
  texto: string;
  tamanho: number;
  verde?: boolean;
  fonte?: 'manchete' | 'corpo' | 'dado';
  sai?: number;
}> = ({q, de, texto, tamanho, verde = false, fonte = 'manchete', sai}) => {
  const t = assenta(q, de);
  const s = sai === undefined ? 0 : prog(q, sai, 6, EXPO_IN);
  const blur = interpolate(t, [0, 1], [10, 0], CL) + s * 12;
  const x = interpolate(t, [0, 1], [14, 0], CL) - s * 20;
  const cor = verde ? VERDE : t < 0.6 ? CINZA : BRANCO;
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: PILHA[fonte],
        fontSize: tamanho,
        lineHeight: 1.02,
        letterSpacing: fonte === 'manchete' ? -tamanho * 0.035 : 0,
        color: cor,
        opacity: Math.min(1, t * 1.6) * (1 - s),
        filter: `blur(${blur}px)`,
        transform: `translateX(${x}px)`,
        whiteSpace: 'pre',
      }}
    >
      {texto}
    </span>
  );
};

export type Item = {texto: string; inicio: number; verde?: boolean; escala?: number; quebra?: boolean};

/** Linha (ou bloco) de palavras, cada uma no seu tempo de fala. */
export const Bloco: React.FC<{
  q: number;
  itens: Item[];
  tamanho: number;
  alinhar?: 'left' | 'center';
  sai?: number;
  largura?: number;
}> = ({q, itens, tamanho, alinhar = 'center', sai, largura = 940}) => (
  <div
    style={{
      width: largura,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: alinhar === 'center' ? 'center' : 'flex-start',
      alignItems: 'baseline',
      columnGap: tamanho * 0.26,
      rowGap: tamanho * 0.02,
    }}
  >
    {itens.map((it, k) => (
      <React.Fragment key={k}>
        {it.quebra && <div style={{flexBasis: '100%', height: 0}} />}
        <PalavraBlur q={q} de={fq(it.inicio)} texto={it.texto.toLowerCase()} tamanho={tamanho * (it.escala ?? 1)} verde={it.verde} sai={sai} />
      </React.Fragment>
    ))}
  </div>
);

/** Itens a partir das palavras da narração [de, ate], com destaques por palavra normalizada. */
export const itensDe = (P: Palavra[], de: number, ate: number, destaque: Record<string, number> = {}, quebras: number[] = []): Item[] =>
  P.slice(de, ate + 1).map((p) => {
    const k = norm(p.texto);
    const esc = destaque[k];
    return {
      texto: p.texto.replace(/[,:;]$/, ''),
      inicio: p.inicio,
      verde: esc !== undefined,
      escala: esc ?? 1,
      quebra: quebras.includes(p.i),
    };
  });

/** Legenda em pedaços de até 4 palavras, cortando na pontuação (ref2: 2–5 palavras por vez). */
export type Pedaco = {de: number; ate: number; inicio: number; fim: number};
export function pedacos(P: Palavra[], max = 4): Pedaco[] {
  const out: Pedaco[] = [];
  let ini = 0;
  for (let i = 0; i < P.length; i++) {
    const fimFrase = /[.,!?:;…]$/.test(P[i].texto);
    if (fimFrase || i - ini + 1 >= max || i === P.length - 1) {
      out.push({de: ini, ate: i, inicio: P[ini].inicio, fim: P[i].fim});
      ini = i + 1;
    }
  }
  return out.map((p, k) => ({...p, fim: k + 1 < out.length ? out[k + 1].inicio : p.fim + 0.6}));
}

/** Legenda cinética no terço de baixo; some nos intervalos `oculta` (s) onde a cena já é o texto. */
export const Legenda: React.FC<{
  q: number;
  P: Palavra[];
  oculta: [number, number][];
  verdes?: string[];
  y?: number;
}> = ({q, P, oculta, verdes = [], y = 1270}) => {
  const t = q / 30;
  if (oculta.some(([a, b]) => t >= a && t < b)) return null;
  const ped = pedacos(P).find((p) => t >= p.inicio - 0.05 && t < p.fim);
  if (!ped) return null;
  const vs = new Set(verdes.map(norm));
  const itens = P.slice(ped.de, ped.ate + 1).map((p) => ({
    texto: p.texto.replace(/[,:;]$/, ''),
    inicio: p.inicio - 0.04,
    verde: vs.has(norm(p.texto)),
  }));
  const sai = fq(ped.fim) - 5;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center'}}>
      <Bloco q={q} itens={itens} tamanho={76} sai={sai} largura={900} />
    </div>
  );
};

/** Palavra com eco: 3 cópias embaixo, cada uma mais apagada, 2 quadros de atraso (ref2). */
export const Eco: React.FC<{q: number; de: number; texto: string; tamanho: number}> = ({q, de, texto, tamanho}) => (
  <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    {[0, 1, 2, 3].map((k) => (
      <div key={k} style={{opacity: [1, 0.45, 0.22, 0.1][k], marginTop: k === 0 ? 0 : -tamanho * 0.12}}>
        <PalavraBlur q={q} de={de + k * 2} texto={texto} tamanho={tamanho} verde={k === 0} />
      </div>
    ))}
  </div>
);

/** Risco que atravessa o texto da esquerda para a direita. */
export const Risco: React.FC<{q: number; de: number; largura: number; cor?: string}> = ({q, de, largura, cor = VERDE}) => {
  const p = prog(q, de, 8);
  return <div style={{position: 'absolute', left: 0, top: '52%', height: 8, width: largura * p, background: cor}} />;
};
