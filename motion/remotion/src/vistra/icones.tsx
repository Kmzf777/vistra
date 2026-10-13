// Ícones de traço, quadrados e minimalistas (contorno 2–3 px, sem preenchimento), feitos
// para a Vistra. O traço se desenha (dashoffset) quando `p` vai de 0 a 1.

import React from 'react';
import {BRANCO, VERDE} from './base';

export type NomeIcone =
  | 'loja' | 'cachorro' | 'telefone' | 'tesoura' | 'sacola' | 'predio' | 'prato' | 'pacote'
  | 'escudo' | 'cadeado' | 'qr' | 'pessoa' | 'relogio' | 'raio';

const D: Record<NomeIcone, string[]> = {
  loja: ['M10 30 H90 V90 H10 Z', 'M4 30 L16 10 H84 L96 30', 'M40 90 V60 H60 V90', 'M20 42 H34 V54 H20 Z', 'M66 42 H80 V54 H66 Z'],
  cachorro: ['M22 40 L14 18 L34 30', 'M78 40 L86 18 L66 30', 'M22 40 V74 H78 V40 Z', 'M36 52 H40', 'M60 52 H64', 'M46 64 H54 L50 70 Z', 'M34 74 V88 H66 V74'],
  telefone: ['M30 8 H70 V92 H30 Z', 'M44 82 H56', 'M80 24 Q90 34 80 44', 'M88 16 Q102 34 88 52'],
  tesoura: ['M24 72 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0', 'M76 72 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0', 'M32 62 L70 10', 'M68 62 L30 10'],
  sacola: ['M16 32 H84 L78 92 H22 Z', 'M36 32 V20 Q50 4 64 20 V32'],
  predio: ['M22 92 V10 H78 V92', 'M10 92 H90', 'M34 24 H44 V34 H34 Z', 'M56 24 H66 V34 H56 Z', 'M34 46 H44 V56 H34 Z', 'M56 46 H66 V56 H56 Z', 'M44 92 V72 H56 V92'],
  prato: ['M50 56 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0', 'M50 56 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0', 'M8 18 V40', 'M92 18 V90'],
  pacote: ['M12 30 L50 12 L88 30 V72 L50 90 L12 72 Z', 'M12 30 L50 48 L88 30', 'M50 48 V90'],
  escudo: ['M50 6 L88 20 V50 Q88 80 50 94 Q12 80 12 50 V20 Z', 'M32 50 L46 64 L70 38'],
  cadeado: ['M18 44 H82 V92 H18 Z', 'M30 44 V28 Q50 2 70 28 V44', 'M50 60 V74'],
  qr: ['M10 10 H38 V38 H10 Z', 'M62 10 H90 V38 H62 Z', 'M10 62 H38 V90 H10 Z', 'M20 20 H28 V28 H20 Z', 'M72 20 H80 V28 H72 Z', 'M20 72 H28 V80 H20 Z', 'M54 54 H64 V64 H54 Z', 'M72 66 H90', 'M66 80 H80 V90', 'M50 82 V90'],
  pessoa: ['M50 30 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0', 'M18 92 Q18 58 50 58 Q82 58 82 92'],
  relogio: ['M50 50 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0', 'M50 24 V50 L68 62'],
  raio: ['M56 6 L22 56 H48 L40 94 L78 40 H52 Z'],
};

export const Icone: React.FC<{nome: NomeIcone; tamanho: number; p?: number; cor?: string; traco?: number}> = ({
  nome,
  tamanho,
  p = 1,
  cor = BRANCO,
  traco = 4,
}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{overflow: 'visible'}}>
    {D[nome].map((d, k) => (
      <path
        key={k}
        d={d}
        fill="none"
        stroke={cor}
        strokeWidth={traco}
        strokeLinecap="square"
        strokeLinejoin="miter"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - Math.max(0, Math.min(1, p * 1.25 - k * 0.06))}
      />
    ))}
  </svg>
);

/** Ícone dentro de um bloco quadrado com contorno — o "tile" da Vistra. */
export const Tile: React.FC<{nome: NomeIcone; lado: number; p: number; aceso?: boolean; rotulo?: string}> = ({nome, lado, p, aceso = false, rotulo}) => (
  <div
    style={{
      width: lado,
      height: lado,
      border: `3px solid ${aceso ? VERDE : 'rgba(255,255,255,0.35)'}`,
      background: aceso ? 'rgba(57,255,20,0.08)' : '#0A0A0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: lado * 0.06,
    }}
  >
    <Icone nome={nome} tamanho={lado * 0.5} p={p} cor={aceso ? VERDE : BRANCO} />
    {rotulo && <div style={{fontFamily: '"IBM Plex Mono", monospace', fontSize: lado * 0.11, color: aceso ? VERDE : 'rgba(255,255,255,0.6)'}}>{rotulo}</div>}
  </div>
);
