// Transições quadradas: a tela fecha em blocos (máscara de pixel, ref1) na diagonal e abre
// de novo do outro lado. O corte acontece no quadro em que a grade está cheia.

import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {BRANCO, PRETO, VERDE, W, H} from './base';

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Blocos que cobrem a tela por volta do quadro `em` (fecha 7 q antes, abre 7 q depois). */
export const Blocos: React.FC<{q: number; em: number; lado?: number; cor?: string}> = ({q, em, lado = 120, cor = PRETO}) => {
  const d = q - em;
  if (d < -9 || d > 9) return null;
  const cols = Math.ceil(W / lado);
  const rows = Math.ceil(H / lado);
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const diag = (c + r) / (cols + rows); // 0..1
      const fecha = interpolate(d, [-9 + diag * 6, -3 + diag * 6], [0, 1], CL);
      const abre = interpolate(d, [1 + diag * 6, 3 + diag * 6], [0, 1], CL);
      const s = d < 0 ? fecha : 1 - abre;
      if (s <= 0) continue;
      cells.push(
        <div
          key={`${r}-${c}`}
          style={{position: 'absolute', left: c * lado + (lado * (1 - s)) / 2, top: r * lado + (lado * (1 - s)) / 2, width: lado * s + 1, height: lado * s + 1, background: cor}}
        />,
      );
    }
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{cells}</AbsoluteFill>;
};

/** Flash de 1–2 quadros na batida (ref4/ref5): só 2–3 por peça. */
export const Flash: React.FC<{q: number; em: number; cor?: string}> = ({q, em, cor = BRANCO}) => {
  const d = q - em;
  if (d < 0 || d > 2) return null;
  return <AbsoluteFill style={{background: cor, opacity: [0.9, 0.45, 0.15][d]}} />;
};

/** Varredura: uma barra verde atravessa a tela na vertical (troca rápida). */
export const Varredura: React.FC<{q: number; em: number}> = ({q, em}) => {
  const p = interpolate(q, [em - 6, em + 6], [-0.2, 1.2], CL);
  if (p <= -0.2 || p >= 1.2) return null;
  return <AbsoluteFill style={{pointerEvents: 'none'}}><div style={{position: 'absolute', top: 0, bottom: 0, left: p * W - 60, width: 120, background: VERDE, filter: 'blur(6px)'}} /></AbsoluteFill>;
};
