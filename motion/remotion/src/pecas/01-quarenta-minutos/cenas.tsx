// Peça 01 — as cenas. Cada uma recebe o quadro global `q` e lê seus tempos do roteiro.

import React from 'react';
import {AbsoluteFill, Img, interpolate} from 'remotion';
import {urlDaMarca} from '../../identidade/arquivos-marca';
import {PILHA} from '../../identidade/tipografia';
import {BRANCO, CINZA, EXPO_OUT, GRAFITE, PRETO, SUAVE, VERDE, bolha, fq, lerp, pop, prog} from '../../vistra/base';
import {Celular, type Msg} from '../../vistra/chat';
import {Notificacoes3D, TresCelulares} from '../../vistra/cena3d';
import {Icone, Tile, type NomeIcone} from '../../vistra/icones';
import {Bloco, Eco, itensDe} from '../../vistra/texto';
import * as R from './roteiro';

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const P = R.PALAVRAS;
const at = (s: number) => fq(s);
const Centro: React.FC<{y: number; children: React.ReactNode}> = ({y, children}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>{children}</div>
);

/** Contador mono mm:ss que corre de `de` a `ate` minutos entre dois quadros. */
const Contador: React.FC<{q: number; ini: number; dur: number; ate: number; tamanho: number; cor?: string}> = ({q, ini, dur, ate, tamanho, cor = VERDE}) => {
  const p = prog(q, ini, dur, EXPO_OUT);
  const min = p * ate;
  const m = Math.floor(min);
  const s = Math.floor((min - m) * 60);
  const vel = q >= ini && q < ini + dur ? (1 - p) * 10 : 0;
  return (
    <div style={{fontFamily: PILHA.dado, fontSize: tamanho, color: cor, letterSpacing: -2, filter: `blur(${vel * 0.4}px)`, transform: `translateY(${-vel}px)`}}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
};

// ------------------------------------------------------------------ 1 · gancho
export const Gancho: React.FC<{q: number}> = ({q}) => {
  const qQuarenta = at(R.em(R.GANCHO, 'quarenta'));
  const itens = itensDe(P, R.GANCHO.de, R.GANCHO.ate, {quarenta: 2.3, minutos: 2.3}, [P[R.GANCHO.de + 7].i, P[R.GANCHO.de + 9].i]);
  const barra = prog(q, qQuarenta, 40, EXPO_OUT);
  return (
    <AbsoluteFill>
      <Centro y={430}>
        <Bloco q={q} itens={itens} tamanho={84} largura={960} />
      </Centro>
      <Centro y={1170}>
        <div style={{width: 760, height: 18, border: `3px solid ${CINZA}`, position: 'relative', opacity: q >= qQuarenta ? 1 : 0}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barra * 100}%`, background: VERDE}} />
        </div>
        <div style={{marginTop: 22, opacity: q >= qQuarenta ? 1 : 0}}>
          <Contador q={q} ini={qQuarenta} dur={40} ate={40} tamanho={64} cor={BRANCO} />
        </div>
      </Centro>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 2+3 · a cena e a demora
const CLIENTE = 'cliente';
export const CenaChat: React.FC<{q: number}> = ({q}) => {
  const msgs: Msg[] = [
    {lado: 'entra', texto: 'quanto tá o banho e tosa?', q: at(R.PERGUNTA.inicio), hora: '14:02'},
    {lado: 'sai', texto: 'oi! desculpa a demora, ainda quer marcar?', q: at(R.RESPONDI.inicio), hora: '14:42', lido: at(R.em(R.VISUALIZOU, 'visualizou'))},
  ];
  const qJa = at(R.em(R.PENSEI, 'já'));
  const qDepois = at(R.DEPOIS.inicio);
  const qSumiu = at(R.em(R.SUMIU, 'sumiu'));
  const status = q >= qSumiu ? 'visto por último às 14:43' : q >= at(R.MANDOU.inicio) && q < at(R.PERGUNTA.inicio) ? 'digitando…' : 'online';
  // o celular entra de baixo, inclinado; na demora ele recua um pouco
  const entra = prog(q, at(R.SABADO.inicio) - 2, 18, EXPO_OUT);
  const recua = prog(q, qDepois, 14, SUAVE) * (1 - prog(q, at(R.RESPONDI.inicio), 12, SUAVE));
  const tiles: [NomeIcone, number, number, number][] = [
    ['loja', at(R.LOJA.inicio), 40, 470],
    ['cachorro', at(R.CACHORRO.inicio), 840, 640],
    ['telefone', at(R.TELEFONE.inicio), 40, 860],
  ];
  const someTiles = prog(q, qJa, 10, EXPO_OUT);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: (1080 - 640) / 2,
          top: 250,
          transform: `perspective(2200px) translateY(${(1 - entra) * 700}px) rotateX(${(1 - entra) * 18 + 3}deg) rotateY(${-6 + Math.sin(q / 45) * 2}deg) scale(${1 - recua * 0.12})`,
          transformOrigin: '50% 30%',
          opacity: Math.min(1, entra * 1.4),
        }}
      >
        <Celular
          q={q}
          nome={CLIENTE}
          status={status}
          msgs={msgs}
          largura={640}
          altura={980}
          digitando={[at(R.MANDOU.inicio), at(R.PERGUNTA.inicio)]}
          rascunho={{texto: 'já respondo', de: qJa, dur: 10, cinza: qJa + 18}}
          some={qSumiu}
        />
      </div>
      {tiles.map(([nome, de, x, y]) => {
        const s = pop(q, de);
        if (q < de) return null;
        return (
          <div key={nome} style={{position: 'absolute', left: x, top: y, transform: `scale(${s * (1 - someTiles * 0.15)})`, opacity: 1 - someTiles * 0.75}}>
            <Tile nome={nome} lado={200} p={prog(q, de, 14)} aceso={nome === 'telefone' && Math.floor(q / 4) % 2 === 0 && q < qJa} />
          </div>
        );
      })}
      {/* a demora: bloco preto com o contador por cima do celular */}
      {q >= qDepois && q < at(R.RESPONDI.inicio) + 6 && (
        <Centro y={560}>
          <div
            style={{
              background: PRETO,
              border: `3px solid ${VERDE}`,
              padding: '30px 60px',
              transform: `scale(${pop(q, qDepois)})`,
              opacity: 1 - prog(q, at(R.RESPONDI.inicio), 6),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{fontFamily: PILHA.dado, fontSize: 30, color: CINZA}}>sem resposta há</div>
            <Contador q={q} ini={qDepois} dur={at(R.DEPOIS.fim) - qDepois} ate={40} tamanho={150} />
          </div>
        </Centro>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4 · a pergunta
export const Pergunta: React.FC<{q: number}> = ({q}) => {
  const qTres = at(R.TRES.inicio);
  if (q >= qTres - 2) {
    return <TresCelulares q={q} entra={qTres} escolhe={at(R.em(R.FIQUEI, 'primeiro'))} fim={at(R.PRIMEIRO1.inicio)} />;
  }
  const de = at(R.em(R.SEGUINTE, 'por'));
  const s = pop(q, de);
  return (
    <AbsoluteFill>
      <Centro y={430}>
        <div style={{fontFamily: PILHA.dado, fontSize: 34, color: CINZA, opacity: prog(q, at(R.SEGUINTE.inicio), 10)}}>domingo · 10:15</div>
        <div
          style={{
            marginTop: 40,
            width: 520,
            height: 520,
            border: `4px solid ${q >= at(R.SINCERO.inicio) ? VERDE : BRANCO}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${s}) rotate(${(1 - s) * -8}deg)`,
            fontFamily: PILHA.manchete,
            fontSize: 380,
            color: q >= at(R.SINCERO.inicio) ? VERDE : BRANCO,
            lineHeight: 1,
          }}
        >
          ?
        </div>
      </Centro>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4b · a lista
export const Lista: React.FC<{q: number}> = ({q}) => {
  const linha = (f: {de: number; ate: number}, tam: number, riscar: boolean) => {
    const itens = itensDe(P, f.de, f.ate);
    const qR = at(P[f.ate].fim) - 2;
    const r = prog(q, qR, 8);
    return (
      <div style={{position: 'relative', marginBottom: 26, opacity: riscar ? 1 - r * 0.55 : 1}}>
        <Bloco q={q} itens={itens} tamanho={tam} largura={960} />
        {riscar && r > 0 && <div style={{position: 'absolute', left: '8%', top: '50%', height: 10, width: `${84 * r}%`, background: VERDE}} />}
      </div>
    );
  };
  const q2 = at(R.PRIMEIRO2.inicio);
  return (
    <AbsoluteFill>
      <Centro y={330}>
        {linha(R.PRIMEIRO1, 110, false)}
        {linha(R.BARATO, 96, true)}
        {linha(R.MELHOR, 96, true)}
        {q >= q2 && (
          <div style={{marginTop: 30}}>
            <Eco q={q} de={q2} texto="o primeiro." tamanho={170} />
          </div>
        )}
      </Centro>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5 · a ficha (freada)
export const Ficha: React.FC<{q: number}> = ({q}) => (
  <AbsoluteFill>
    <Centro y={480}>
      <div style={{fontFamily: PILHA.dado, fontSize: 40, color: CINZA, marginBottom: 70, opacity: prog(q, at(R.FICHA.inicio), 10)}}>aí caiu a ficha.</div>
      <Bloco q={q} itens={itensDe(P, R.NAO_FICA.de, R.NAO_FICA.ate)} tamanho={100} largura={940} />
      <div style={{height: 50}} />
      <Bloco q={q} itens={itensDe(P, R.FICA.de, R.FICA.ate, {primeiro: 1.5})} tamanho={100} largura={940} />
    </Centro>
  </AbsoluteFill>
);

// ------------------------------------------------------------------ 6 · a ponte
export const Ponte: React.FC<{q: number}> = ({q}) => {
  const de = at(R.GRUDADO.inicio);
  const giro = interpolate(q, [de, at(R.CHEGUEI.inicio)], [0, 1440], CL);
  return (
    <AbsoluteFill>
      <Centro y={420}>
        <div style={{position: 'relative', width: 520, height: 520, transform: `scale(${pop(q, de)})`}}>
          <div style={{position: 'absolute', inset: 0, border: `4px solid ${BRANCO}`}} />
          <div style={{position: 'absolute', left: 258, top: 60, width: 6, height: 200, background: VERDE, transformOrigin: '50% 100%', transform: `rotate(${giro}deg)`}} />
          <div style={{position: 'absolute', left: 258, top: 140, width: 6, height: 120, background: BRANCO, transformOrigin: '50% 100%', transform: `rotate(${giro / 12}deg)`}} />
          <div style={{position: 'absolute', left: 245, top: 245, width: 32, height: 32, background: VERDE}} />
          <div style={{position: 'absolute', right: -70, bottom: -70}}>
            <div style={{background: PRETO}}><Icone nome="telefone" tamanho={220} p={prog(q, de + 6, 14)} /></div>
          </div>
        </div>
      </Centro>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 7 · a solução: o toggle
export const Solucao: React.FC<{q: number}> = ({q}) => {
  const de = at(R.CHEGUEI.inicio);
  const clique = at(R.em(R.CHEGUEI, 'oficial'));
  const ligado = q >= clique;
  const chega = prog(q, de + 4, clique - de - 6, SUAVE);
  const cx = lerp(1000, 780, chega);
  const cy = lerp(1700, 800, chega);
  const afunda = q >= clique && q < clique + 4 ? 0.92 : 1;
  const k = prog(q, clique, 8);
  return (
    <AbsoluteFill>
      <Centro y={560}>
        <div style={{transform: `scale(${pop(q, de) * afunda})`, width: 860, border: `3px solid ${ligado ? VERDE : '#3A3A3A'}`, background: '#0A0A0A', padding: '50px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div>
            <div style={{fontFamily: PILHA.manchete, fontSize: 62, color: BRANCO, letterSpacing: -2}}>atendimento ia</div>
            <div style={{fontFamily: PILHA.dado, fontSize: 30, color: ligado ? VERDE : CINZA, marginTop: 10}}>{ligado ? '● ligado · whatsapp oficial' : '○ desligado'}</div>
          </div>
          <div style={{width: 180, height: 92, border: `3px solid ${ligado ? VERDE : CINZA}`, position: 'relative', background: ligado ? 'rgba(57,255,20,0.12)' : 'transparent'}}>
            <div style={{position: 'absolute', top: 10, left: lerp(10, 98, k), width: 66, height: 66, background: ligado ? VERDE : CINZA}} />
          </div>
        </div>
      </Centro>
      {/* cursor quadrado */}
      <svg width={70} height={90} viewBox="0 0 70 90" style={{position: 'absolute', left: cx, top: cy, transform: `scale(${afunda})`, opacity: q < clique + 20 ? 1 : 1 - prog(q, clique + 20, 8)}}>
        <path d="M4 4 L4 70 L22 54 L34 84 L46 78 L34 50 L58 50 Z" fill={BRANCO} stroke={PRETO} strokeWidth={4} strokeLinejoin="miter" />
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 7b · notificações em 3D
export const Notifs: React.FC<{q: number}> = ({q}) => (
  <Notificacoes3D
    q={q}
    de={at(R.NA_HORA.inicio) - 6}
    ate={at(R.PRECO.inicio)}
    notifs={[
      {q: at(R.MADRUGADA.inicio), hora: 'ter · 02:13', texto: 'tem horário amanhã cedo?', resp: '✓ respondido em 3 s', pos: [-0.35, 2.4, 1.2]},
      {q: at(R.DOMINGO.inicio), hora: 'dom · 09:40', texto: 'vocês abrem hoje?', resp: '✓ respondido em 2 s', pos: [0.45, 0.9, 2.2]},
      {q: at(R.LOJA_CHEIA.inicio), hora: 'sáb · 14:02', texto: 'quanto tá o banho e tosa?', resp: '✓ respondido em 4 s', pos: [-0.3, -0.7, 3.0]},
    ]}
  />
);

// ------------------------------------------------------------------ 7c · a conversa com o robô
export const Conversa: React.FC<{q: number}> = ({q}) => {
  const de = at(R.PRECO.inicio);
  const msgs: Msg[] = [
    {lado: 'entra', texto: 'quanto tá o banho e tosa?', q: de - 30, hora: '14:02'},
    {lado: 'sai', texto: 'oi! porte pequeno sai r$ 70. quer agendar?', q: de + 2, hora: '14:02', lido: de + 10, botoes: ['sáb 15h', 'dom 10h']},
    {lado: 'entra', texto: 'sáb 15h', q: at(R.AGENDA.inicio), hora: '14:03'},
    {lado: 'sai', texto: 'prontinho! te espero sábado às 15h.', q: at(R.em(R.AGENDA, 'banho')), hora: '14:03', lido: at(R.em(R.AGENDA, 'banho')) + 8, selo: '✓ banho agendado'},
  ];
  const qChama = at(R.CHAMA.inicio);
  const banner = bolha(q, qChama);
  const sobe = prog(q, at(R.AGENDA.inicio), 12, SUAVE);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: (1080 - 640) / 2, top: 250 - sobe * 120, transform: `perspective(2200px) rotateY(${6 - Math.sin(q / 40) * 2}deg) scale(${0.96 + pop(q, de - 6) * 0.04})`}}>
        <Celular q={q} nome="cliente" status="online" msgs={msgs} largura={640} altura={980} />
      </div>
      {q >= qChama && (
        <div style={{position: 'absolute', left: 120, right: 120, top: 210 + (1 - banner) * -360, background: GRAFITE, border: `3px solid ${VERDE}`, padding: '26px 30px', display: 'flex', gap: 24, alignItems: 'center'}}>
          <Icone nome="pessoa" tamanho={70} cor={VERDE} p={prog(q, qChama + 4, 10)} />
          <div>
            <div style={{fontFamily: PILHA.dado, fontSize: 26, color: CINZA}}>agora · atendimento ia</div>
            <div style={{fontFamily: PILHA.corpo, fontSize: 36, color: BRANCO}}>cliente pediu pra falar com você</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 8 · pirata × oficial
export const Oficial: React.FC<{q: number}> = ({q}) => {
  const de = at(R.OFICIAL.inicio);
  const qOf = at(R.em(R.OFICIAL, 'oficial'));
  const qNum = at(R.em(R.BANIDO, 'número'));
  const qBan = at(R.em(R.BANIDO, 'banido'));
  const tremor = q >= qBan && q < qBan + 10 ? Math.sin(q * 3) * 10 * (1 - (q - qBan) / 10) : 0;
  const linha = prog(q, qNum, 16);
  const card = (titulo: string, sub: string, icone: NomeIcone, x: number, aceso: boolean, s: number, extra?: React.ReactNode) => (
    <div style={{position: 'absolute', left: x, top: 640, width: 420, height: 520, border: `3px solid ${aceso ? VERDE : '#3A3A3A'}`, background: '#0A0A0A', transform: `scale(${s})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26}}>
      <Icone nome={icone} tamanho={200} cor={aceso ? VERDE : BRANCO} p={prog(q, de + 4, 16)} />
      <div style={{fontFamily: PILHA.manchete, fontSize: 48, color: BRANCO, letterSpacing: -1}}>{titulo}</div>
      <div style={{fontFamily: PILHA.dado, fontSize: 28, color: aceso ? VERDE : CINZA}}>{sub}</div>
      {extra}
    </div>
  );
  return (
    <AbsoluteFill>
      {/* "seu número" no topo, ligado ao escudo por uma linha que se desenha */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', opacity: prog(q, qNum - 4, 8)}}>
        <div style={{border: `3px solid ${BRANCO}`, padding: '18px 34px', fontFamily: PILHA.dado, fontSize: 38, color: BRANCO}}>seu número</div>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <path d="M540 430 V520 H770 V640" fill="none" stroke={VERDE} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - linha} />
      </svg>
      <div style={{transform: `translateX(${tremor}px)`}}>
        {card('qr code', 'jeito pirata', 'qr', 90, false, pop(q, de), q >= qBan ? (
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)'}}>
            <div style={{background: BRANCO, color: PRETO, fontFamily: PILHA.manchete, fontSize: 64, padding: '10px 30px', transform: `scale(${pop(q, qBan)})`}}>banido</div>
          </div>
        ) : null)}
      </div>
      {card('api oficial', 'porta da meta', 'escudo', 570, q >= qOf, pop(q, de + 5))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 9 · a marca
export const Marca: React.FC<{q: number}> = ({q}) => {
  const de = at(R.VISTRA.inicio);
  const qV = at(R.em(R.VISTRA, 'vistra'));
  const qServe = at(R.SERVE.inicio);
  const ponto = pop(q, de);
  const logo = prog(q, qV, 12);
  const sobe = prog(q, qServe, 14, SUAVE);
  const icones: NomeIcone[] = ['cachorro', 'tesoura', 'sacola', 'predio', 'prato', 'pacote'];
  const qWa = at(R.em(R.SERVE, 'whatsapp'));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: lerp(560, 230, sobe), display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${1 - sobe * 0.28})`, transformOrigin: '50% 0%'}}>
        <div style={{position: 'relative', width: 560, height: 560}}>
          {/* o ponto verde cresce e vira o logo */}
          <div style={{position: 'absolute', left: 280 - 30 * ponto * (1 - logo), top: 280 - 30 * ponto * (1 - logo), width: 60 * ponto * (1 - logo), height: 60 * ponto * (1 - logo), background: VERDE}} />
          <Img src={urlDaMarca('logo-clara.png')} style={{position: 'absolute', inset: 0, width: 560, height: 560, opacity: logo, transform: `scale(${0.85 + 0.15 * logo})`, filter: `blur(${(1 - logo) * 8}px)`}} />
        </div>
        <div style={{fontFamily: PILHA.dado, fontSize: 36, color: CINZA, marginTop: -40, opacity: prog(q, at(R.UDI.inicio), 10)}}>uberlândia · mg</div>
      </div>
      {q >= qServe - 2 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 200px)', gap: 22}}>
            {icones.map((n, k) => {
              const d = qServe + k * 4;
              return (
                <div key={n} style={{transform: `scale(${pop(q, d)})`}}>
                  <Tile nome={n} lado={200} p={prog(q, d, 14)} aceso={q >= qWa + k * 2} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 10 · fecho (volta ao começo)
export const Fecho: React.FC<{q: number}> = ({q}) => {
  const qQ = at(R.QUANTO.inicio);
  const seg = Math.max(0, (q - qQ) / 30);
  return (
    <AbsoluteFill>
      <Centro y={380}>
        <Bloco q={q} itens={itensDe(P, R.QUARENTA.de, R.QUARENTA.ate, {quarenta: 1, minutos: 1})} tamanho={190} largura={960} />
      </Centro>
      <Centro y={860}>
        <Bloco q={q} itens={itensDe(P, R.QUANTO.de, R.QUANTO.ate, {agora: 1.25})} tamanho={84} largura={920} />
        {q >= qQ && (
          <div style={{marginTop: 60, fontFamily: PILHA.dado, fontSize: 64, color: BRANCO, display: 'flex', gap: 20, alignItems: 'center'}}>
            <div style={{width: 18, height: 18, background: VERDE, opacity: Math.floor(q / 10) % 2 ? 1 : 0.2}} />
            00:{String(Math.floor(seg)).padStart(2, '0')}
          </div>
        )}
      </Centro>
    </AbsoluteFill>
  );
};

