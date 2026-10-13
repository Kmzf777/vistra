// Cenas em react-three-fiber (via @remotion/three): celulares e cartões de mensagem em
// espaço 3D, câmera que se move sem parar (ref4, ref5). O conteúdo das telas é desenhado
// num <canvas> 2D com as fontes da marca e vira textura -- determinístico, sem rede.

import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import React, {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, interpolate} from 'remotion';
import * as THREE from 'three';
import {TIPO} from '../identidade/tokens';
import {GRAFITE, H, SUAVE, VERDE, W, bolha, lerp, prog} from './base';

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Espera as fontes do documento antes de desenhar texto em canvas. */
function useFontesProntas() {
  const [pronto, setPronto] = useState(false);
  const [h] = useState(() => delayRender('fontes para texturas 3D'));
  useEffect(() => {
    document.fonts.ready.then(() => {
      setPronto(true);
      continueRender(h);
    });
  }, [h]);
  return pronto;
}

type Linha = {texto: string; papel: 'manchete' | 'corpo' | 'dado'; px: number; cor: string; y: number; x?: number};

function textura(w: number, h: number, fundo: string, linhas: Linha[], borda?: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = fundo;
  g.fillRect(0, 0, w, h);
  if (borda) {
    g.strokeStyle = borda;
    g.lineWidth = 8;
    g.strokeRect(4, 4, w - 8, h - 8);
  }
  for (const l of linhas) {
    g.font = `${TIPO[l.papel].peso} ${l.px}px "${TIPO[l.papel].familia}"`;
    g.fillStyle = l.cor;
    g.textBaseline = 'alphabetic';
    g.fillText(l.texto, l.x ?? 40, l.y);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const Celular3D: React.FC<{tex: THREE.Texture | null; pos: [number, number, number]; rot: [number, number, number]; brilho: number; escala?: number; apagado?: number}> = ({
  tex,
  pos,
  rot,
  brilho,
  escala = 1,
  apagado = 0,
}) => (
  <group position={pos} rotation={rot} scale={escala}>
    <mesh>
      <boxGeometry args={[2.0, 4.0, 0.16]} />
      <meshStandardMaterial color={'#141414'} metalness={0.4} roughness={0.5} emissive={VERDE} emissiveIntensity={brilho * 0.35} />
    </mesh>
    <mesh position={[0, 0, 0.086]}>
      <planeGeometry args={[1.86, 3.86]} />
      {tex ? <meshBasicMaterial map={tex} color={new THREE.Color(1 - apagado * 0.7, 1 - apagado * 0.7, 1 - apagado * 0.7)} toneMapped={false} /> : <meshBasicMaterial color={'#000'} />}
    </mesh>
    {/* contorno verde quando escolhido */}
    {brilho > 0.01 && (
      <lineSegments position={[0, 0, 0.1]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.12, 4.12)]} />
        <lineBasicMaterial color={VERDE} transparent opacity={brilho} />
      </lineSegments>
    )}
  </group>
);

/** Tela de um pet shop com o tempo de resposta. */
const telaLoja = (nome: string, tempo: string, rotulo: string, verde: boolean) =>
  textura(512, 1064, '#0B141A', [
    {texto: nome, papel: 'corpo', px: 44, cor: '#E9EDEF', y: 150},
    {texto: 'respondeu em', papel: 'dado', px: 34, cor: '#8696A0', y: 470},
    {texto: tempo, papel: 'manchete', px: 120, cor: verde ? VERDE : '#E9EDEF', y: 610},
    {texto: rotulo, papel: 'dado', px: 32, cor: verde ? VERDE : '#8696A0', y: 700},
  ], verde ? VERDE : '#2E2E2E');

/**
 * "Mandei pra três pet shops. Fiquei com o primeiro que respondeu."
 * `entra`: os três aparecem; `escolhe`: o primeiro acende e a câmera vai até ele.
 */
export const TresCelulares: React.FC<{q: number; entra: number; escolhe: number; fim: number}> = ({q, entra, escolhe, fim}) => {
  const pronto = useFontesProntas();
  const tex = useMemo(
    () =>
      pronto
        ? [telaLoja('pet shop a', '2 min', 'ficou com o cliente', true), telaLoja('pet shop b', '15 min', '', false), telaLoja('eu', '40 min', 'visualizado', false)]
        : [null, null, null],
    [pronto],
  );
  const esc = prog(q, escolhe, 24, SUAVE);
  const orbita = interpolate(q, [entra, fim], [0.35, -0.15], CL);
  const camZ = lerp(17.5, 10, esc);
  const camX = lerp(Math.sin(orbita) * 3, -2.3, esc);
  return (
    <ThreeCanvas width={W} height={H} camera={{fov: 40, position: [camX, 0.4, camZ]}} style={{position: 'absolute', inset: 0}}>
      <CameraOlha alvo={[lerp(0, -2.3, esc), 0, 0]} pos={[camX, lerp(0.4, 0.1, esc), camZ]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 6]} intensity={1.4} />
      {[-2.3, 0, 2.3].map((x, k) => {
        const s = bolha(q, entra + k * 5);
        const balanco = Math.sin((q + k * 20) / 30) * 0.05;
        return (
          <Celular3D
            key={k}
            tex={tex[k]}
            pos={[x, (1 - s) * -3, -k * 0.3]}
            rot={[0.06, 0.18 - k * 0.18 + balanco, 0]}
            
            escala={Math.max(0.001, s)}
            brilho={k === 0 ? esc : 0}
            apagado={k === 0 ? 0 : esc}
          />
        );
      })}
    </ThreeCanvas>
  );
};

const CameraOlha: React.FC<{alvo: [number, number, number]; pos: [number, number, number]}> = ({alvo, pos}) => {
  // A câmera padrão do canvas, reposicionada a cada quadro.
  const cam = useThree((s) => s.camera);
  cam.position.set(...pos);
  cam.lookAt(...alvo);
  return null;
};

export type Notif = {q: number; hora: string; texto: string; resp: string; pos: [number, number, number]};

/**
 * "Ela responde na hora. De madrugada, no domingo, com a loja cheia."
 * Um celular de frente e cartões de mensagem flutuando em camadas, cada um com o
 * selo verde de resposta em segundos. A câmera orbita devagar (parallax).
 */
export const Notificacoes3D: React.FC<{q: number; de: number; ate: number; notifs: Notif[]}> = ({q, de, ate, notifs}) => {
  const pronto = useFontesProntas();
  const texs = useMemo(
    () =>
      pronto
        ? notifs.map((n) =>
            textura(1024, 300, '#111827', [
              {texto: n.hora, papel: 'dado', px: 40, cor: '#8696A0', y: 70},
              {texto: n.texto, papel: 'corpo', px: 56, cor: '#FFFFFF', y: 160},
              {texto: n.resp, papel: 'dado', px: 44, cor: VERDE, y: 250},
            ], '#2E2E2E'),
          )
        : notifs.map(() => null),
    [pronto, notifs],
  );
  const telaTex = useMemo(
    () => (pronto ? textura(512, 1064, '#0B141A', [{texto: 'atendimento ia', papel: 'dado', px: 34, cor: VERDE, y: 140}, {texto: 'online 24h', papel: 'manchete', px: 72, cor: '#FFFFFF', y: 560}]) : null),
    [pronto],
  );
  const t = interpolate(q, [de, ate], [0, 1], CL);
  const ang = lerp(-0.45, 0.45, SUAVE(t));
  const r = 12;
  return (
    <ThreeCanvas width={W} height={H} camera={{fov: 42, position: [Math.sin(ang) * r, 0.5, Math.cos(ang) * r]}} style={{position: 'absolute', inset: 0}}>
      <CameraOlha alvo={[0, 0, 0]} pos={[Math.sin(ang) * r, lerp(0.8, -0.2, t), Math.cos(ang) * r]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[-4, 6, 6]} intensity={1.2} />
      <Celular3D tex={telaTex} pos={[0, -0.2, -1.2]} rot={[0, 0, 0]} brilho={0.35} />
      {notifs.map((n, k) => {
        const s = bolha(q, n.q);
        if (q < n.q) return null;
        return (
          <group key={k} position={n.pos} scale={Math.max(0.001, s)}>
            <mesh>
              <planeGeometry args={[2.9, 0.85]} />
              {texs[k] ? <meshBasicMaterial map={texs[k]!} toneMapped={false} side={THREE.DoubleSide} /> : <meshBasicMaterial color={GRAFITE} />}
            </mesh>
          </group>
        );
      })}
    </ThreeCanvas>
  );
};
