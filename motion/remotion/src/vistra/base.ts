// Motor da Vistra: base comum (relógio, curvas, cores). Linguagem em motion/marca/linguagem-motion.md.
//
// Minimalista e quadrado: fundo preto, grade fina, um acento verde por cena. Todo tempo
// vem da narração (palavras.json) e passa por `fq`; nenhum segundo é digitado nas cenas.

import {Easing, interpolate, spring} from 'remotion';
import {COR} from '../identidade/tokens';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

/** Segundos → quadro. */
export const fq = (s: number) => Math.round(s * FPS);

export const VERDE = COR.acento;
export const PRETO = COR.escuro;
export const BRANCO = COR.claro;
export const GRAFITE = COR.profundo;
export const CINZA = '#6B7280';
export const LINHA = 'rgba(255,255,255,0.14)';

/** Entrada: ease-out expo (ref4). */
export const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
/** Saída: ease-in expo. */
export const EXPO_IN = Easing.bezier(0.7, 0, 0.84, 0);
/** Câmera: in-out longo. */
export const SUAVE = Easing.bezier(0.65, 0, 0.35, 1);

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 entre dois quadros, com curva. */
export const prog = (q: number, de: number, dur: number, easing = EXPO_OUT) =>
  interpolate(q, [de, de + Math.max(1, dur)], [0, 1], {...CL, easing});

/** Pop com overshoot leve (~4%): damping 14, stiffness 170 (ref4). */
export const pop = (q: number, de: number, fps = FPS) =>
  spring({frame: q - de, fps, config: {damping: 14, stiffness: 170, mass: 0.8}});

/** Bolha de chat: nasce do rabicho com overshoot (ref2). */
export const bolha = (q: number, de: number, fps = FPS) =>
  spring({frame: q - de, fps, config: {damping: 13, stiffness: 200}});

/** Sem overshoot: palavra que assenta (ref2). */
export const assenta = (q: number, de: number, fps = FPS) =>
  spring({frame: q - de, fps, config: {damping: 200, stiffness: 120}});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Pseudo-aleatório determinístico (render quadro a quadro precisa ser estável). */
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
