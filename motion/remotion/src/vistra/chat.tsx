// Chat de WhatsApp (tema escuro) dentro de um celular minimalista de cantos retos.
// Bolhas nascem do rabicho com overshoot leve (ref2), uma a uma, no tempo da fala.

import React from 'react';
import {interpolate} from 'remotion';
import {PILHA} from '../identidade/tipografia';
import {CINZA, GRAFITE, VERDE, bolha, prog, rnd} from './base';

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const WA = {
  fundo: '#0B141A',
  topo: '#1F2C34',
  entra: '#202C33',
  sai: '#005C4B',
  azul: '#53BDEB',
  texto: '#E9EDEF',
  sub: '#8696A0',
};

export type Msg = {
  lado: 'entra' | 'sai';
  texto: string;
  q: number; // quadro em que aparece
  hora: string;
  lido?: number; // quadro em que os ticks ficam azuis
  botoes?: string[];
  rascunho?: boolean; // ficou no campo de texto, nunca enviada
  selo?: string; // selo verde abaixo da bolha
  some?: number; // quadro em que se desfaz em blocos
};

const Ticks: React.FC<{azul: boolean}> = ({azul}) => (
  <svg width={34} height={20} viewBox="0 0 34 20" style={{marginLeft: 6}}>
    <path d="M2 11 L7 16 L17 4" stroke={azul ? WA.azul : WA.sub} strokeWidth={2.6} fill="none" />
    <path d="M12 14 L14 16 L24 4" stroke={azul ? WA.azul : WA.sub} strokeWidth={2.6} fill="none" />
  </svg>
);

/** Desfaz um retângulo em blocos quadrados que caem e somem (ref1: mosaico). */
const Blocos: React.FC<{q: number; de: number; children: React.ReactNode; w: number; h: number}> = ({q, de, children, w, h}) => {
  if (q < de) return <>{children}</>;
  const t = q - de;
  const lado = 28;
  const cols = Math.ceil(w / lado);
  const rows = Math.ceil(h / lado);
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const k = r * cols + c;
      const atraso = rnd(k) * 10 + (c / cols) * 6;
      const p = interpolate(t, [atraso, atraso + 10], [0, 1], CL);
      if (p >= 1) continue;
      cells.push(
        <div
          key={k}
          style={{
            position: 'absolute',
            left: c * lado,
            top: r * lado,
            width: lado,
            height: lado,
            overflow: 'hidden',
            opacity: 1 - p,
            transform: `translateY(${p * p * 80}px)`,
          }}
        >
          <div style={{position: 'absolute', left: -c * lado, top: -r * lado, width: w, height: h}}>{children}</div>
        </div>,
      );
    }
  return <div style={{position: 'relative', width: w, height: h}}>{cells}</div>;
};

const Bolha: React.FC<{q: number; m: Msg; largura: number}> = ({q, m, largura}) => {
  const s = bolha(q, m.q);
  const sai = m.lado === 'sai';
  const corpo = (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: sai ? 'flex-end' : 'flex-start'}}>
      <div
        style={{
          maxWidth: largura * 0.78,
          background: sai ? WA.sai : WA.entra,
          color: WA.texto,
          fontFamily: PILHA.corpo,
          fontSize: 38,
          lineHeight: 1.25,
          padding: '16px 22px 12px',
          borderRadius: 10,
          borderTopRightRadius: sai ? 0 : 10,
          borderTopLeftRadius: sai ? 10 : 0,
        }}
      >
        {m.texto}
        <div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, fontSize: 24, color: WA.sub, fontFamily: PILHA.dado}}>
          {m.hora}
          {sai && <Ticks azul={m.lido !== undefined && q >= m.lido} />}
        </div>
      </div>
      {m.botoes && (
        <div style={{display: 'flex', gap: 10, marginTop: 10}}>
          {m.botoes.map((b, k) => {
            const pb = bolha(q, m.q + 6 + k * 3);
            return (
              <div
                key={b}
                style={{
                  border: `2px solid ${WA.azul}`,
                  color: WA.azul,
                  fontFamily: PILHA.corpo,
                  fontSize: 32,
                  padding: '10px 26px',
                  borderRadius: 8,
                  transform: `scale(${pb})`,
                  opacity: Math.min(1, pb * 2),
                }}
              >
                {b}
              </div>
            );
          })}
        </div>
      )}
      {m.selo && (
        <div
          style={{
            marginTop: 12,
            background: VERDE,
            color: '#000',
            fontFamily: PILHA.dado,
            fontSize: 28,
            padding: '8px 18px',
            transform: `scale(${bolha(q, m.q + 10)})`,
            transformOrigin: sai ? 'right center' : 'left center',
          }}
        >
          {m.selo}
        </div>
      )}
    </div>
  );
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: sai ? 'flex-end' : 'flex-start',
        transform: `scale(${s})`,
        transformOrigin: sai ? 'top right' : 'top left',
        opacity: Math.min(1, s * 2),
        marginBottom: 18,
      }}
    >
      {corpo}
    </div>
  );
};

/** "digitando…": três quadrados que pulsam. */
export const Digitando: React.FC<{q: number}> = ({q}) => (
  <div style={{display: 'inline-flex', gap: 8, background: WA.entra, padding: '18px 22px', borderRadius: 10, borderTopLeftRadius: 0}}>
    {[0, 1, 2].map((k) => (
      <div key={k} style={{width: 12, height: 12, background: WA.sub, opacity: 0.4 + 0.6 * Math.abs(Math.sin((q + k * 5) / 6))}} />
    ))}
  </div>
);

export const Celular: React.FC<{
  q: number;
  nome: string;
  status?: string;
  msgs: Msg[];
  largura?: number;
  altura?: number;
  rascunho?: {texto: string; de: number; dur: number; cinza?: number};
  digitando?: [number, number];
  some?: number;
}> = ({q, nome, status = 'online', msgs, largura = 760, altura = 1180, rascunho, digitando, some}) => {
  const visiveis = msgs.filter((m) => q >= m.q);
  const tela = (
    <div style={{width: largura - 24, height: altura - 24, background: WA.fundo, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
      <div style={{background: WA.topo, padding: '70px 28px 22px', display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{width: 64, height: 64, background: GRAFITE, border: `2px solid ${CINZA}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WA.sub, fontFamily: PILHA.manchete, fontSize: 30}}>
          {nome[0]}
        </div>
        <div>
          <div style={{fontFamily: PILHA.corpo, fontSize: 36, color: WA.texto}}>{nome}</div>
          <div style={{fontFamily: PILHA.dado, fontSize: 24, color: WA.sub}}>{status}</div>
        </div>
      </div>
      <div style={{flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}}>
        {some !== undefined ? (
          <Blocos q={q} de={some} w={largura - 72} h={Math.min(altura - 360, 120 + visiveis.length * 170)}>
            <div style={{width: largura - 72}}>
              {visiveis.map((m, k) => (
                <Bolha key={k} q={q} m={m} largura={largura - 72} />
              ))}
            </div>
          </Blocos>
        ) : (
          visiveis.map((m, k) => <Bolha key={k} q={q} m={m} largura={largura - 72} />)
        )}
        {digitando && q >= digitando[0] && q < digitando[1] && <Digitando q={q} />}
      </div>
      <div style={{background: WA.topo, padding: '18px 22px 34px', display: 'flex', gap: 16, alignItems: 'center'}}>
        <div style={{flex: 1, background: WA.entra, borderRadius: 8, padding: '18px 22px', fontFamily: PILHA.corpo, fontSize: 32, color: WA.sub, minHeight: 40}}>
          {rascunho && q >= rascunho.de ? (
            <span style={{color: rascunho.cinza !== undefined && q >= rascunho.cinza ? WA.sub : WA.texto}}>
              {rascunho.texto.slice(0, Math.round(rascunho.texto.length * prog(q, rascunho.de, rascunho.dur, (x) => x)))}
              <span style={{opacity: Math.floor(q / 8) % 2 ? 1 : 0, color: WA.azul}}>|</span>
            </span>
          ) : (
            'mensagem'
          )}
        </div>
        <div style={{width: 72, height: 72, background: WA.sai, borderRadius: 8}} />
      </div>
    </div>
  );
  return (
    <div style={{width: largura, height: altura, background: '#151515', border: `3px solid #2E2E2E`, borderRadius: 28, padding: 9, boxShadow: '0 40px 120px rgba(0,0,0,0.6)'}}>
      <div style={{borderRadius: 20, overflow: 'hidden', border: '1px solid #000'}}>{tela}</div>
    </div>
  );
};

