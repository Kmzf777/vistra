// Moldura técnica (ref3 + ref1): grade fina no fundo, texto mono nos cantos — a marca,
// o capítulo e um relógio. Dá o ar preciso, de "sistema", que é a cara da Vistra.

import React from 'react';
import {AbsoluteFill} from 'remotion';
import {PILHA} from '../identidade/tipografia';
import {BRANCO, CINZA, LINHA, PRETO, VERDE, W, H, prog} from './base';

export const Grade: React.FC<{passo?: number; deslocY?: number; opacidade?: number}> = ({passo = 90, deslocY = 0, opacidade = 1}) => {
  const dy = ((deslocY % passo) + passo) % passo;
  return (
    <AbsoluteFill style={{background: PRETO}}>
      <AbsoluteFill
        style={{
          opacity: opacidade,
          backgroundImage: `linear-gradient(${LINHA} 1px, transparent 1px), linear-gradient(90deg, ${LINHA} 1px, transparent 1px)`,
          backgroundSize: `${passo}px ${passo}px`,
          backgroundPosition: `${(W % passo) / 2}px ${dy}px`,
          maskImage: 'radial-gradient(ellipse 75% 60% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 50% 50%, black 30%, transparent 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** hh:mm a partir de minutos do dia. */
export const hora = (min: number) => {
  const m = ((Math.floor(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export const Moldura: React.FC<{q: number; capitulo: string; relogio: string; destaqueRelogio?: boolean; entra?: number}> = ({
  q,
  capitulo,
  relogio,
  destaqueRelogio = false,
  entra = 0,
}) => {
  const a = prog(q, entra, 12);
  const mono: React.CSSProperties = {fontFamily: PILHA.dado, fontSize: 30, letterSpacing: 1, color: BRANCO, opacity: 0.75 * a};
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 64, top: 150, display: 'flex', alignItems: 'center', gap: 14, ...mono}}>
        <div style={{width: 14, height: 14, background: VERDE}} />
        vistra.ia
      </div>
      <div style={{position: 'absolute', right: 64, top: 150, ...mono, color: destaqueRelogio ? VERDE : BRANCO, opacity: (destaqueRelogio ? 1 : 0.75) * a}}>
        {relogio}
      </div>
      <div style={{position: 'absolute', left: 64, bottom: 330, ...mono, color: CINZA, opacity: a}}>{capitulo}</div>
      {/* cantos: quatro marcas de enquadramento */}
      {[
        [40, 110],
        [W - 40 - 28, 110],
        [40, H - 300],
        [W - 40 - 28, H - 300],
      ].map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 28,
            height: 28,
            opacity: 0.35 * a,
            borderLeft: i % 2 === 0 ? `2px solid ${BRANCO}` : undefined,
            borderRight: i % 2 === 1 ? `2px solid ${BRANCO}` : undefined,
            borderTop: i < 2 ? `2px solid ${BRANCO}` : undefined,
            borderBottom: i >= 2 ? `2px solid ${BRANCO}` : undefined,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
