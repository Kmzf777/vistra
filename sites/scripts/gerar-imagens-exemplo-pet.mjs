// Placeholders do cliente fictício de pet (gradientes, patinhas e silhuetas; nenhuma foto de terceiros).
// Par do gerar-imagens-exemplo.mjs (odontologia).
// Uso (a partir de sites/): node scripts/gerar-imagens-exemplo-pet.mjs src/assets/clientes/exemplo-pet
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const dir = process.argv[2];
if (!dir) throw new Error('Informe a pasta de saída, ex.: src/assets/clientes/exemplo-pet');
mkdirSync(dir, { recursive: true });

const svg = (w, h, a, b, formas, rotulo) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>${formas}
<text x="50%" y="${h - Math.round(h / 16)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(Math.min(w, h) / 20)}" fill="#ffffff" fill-opacity="0.8">${rotulo}</text></svg>`;

// Patinha: almofada central + 4 dedos.
const pata = (x, y, s, op = 0.18, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="#ffffff" fill-opacity="${op}">
<ellipse cx="0" cy="18" rx="30" ry="25"/><ellipse cx="-34" cy="-14" rx="11" ry="15"/><ellipse cx="-12" cy="-34" rx="11" ry="15"/>
<ellipse cx="12" cy="-34" rx="11" ry="15"/><ellipse cx="34" cy="-14" rx="11" ry="15"/></g>`;
const trilha = (w, h, op) =>
  [0, 1, 2, 3].map((i) => pata(w * (0.18 + i * 0.2), h * (0.72 - i * 0.14), Math.min(w, h) / 260, op, 20)).join('');

// Silhueta simples de cachorro sentado (formas geométricas).
const cao = (cx, base, s, cor = '#ffffff', op = 0.32) => `<g transform="translate(${cx} ${base}) scale(${s})" fill="${cor}" fill-opacity="${op}">
<ellipse cx="0" cy="-70" rx="62" ry="78"/><circle cx="0" cy="-185" r="52"/>
<ellipse cx="-44" cy="-200" rx="18" ry="40" transform="rotate(-18 -44 -200)"/><ellipse cx="44" cy="-200" rx="18" ry="40" transform="rotate(18 44 -200)"/>
<ellipse cx="0" cy="-160" rx="26" ry="18"/><rect x="-46" y="-30" width="26" height="30" rx="10"/><rect x="20" y="-30" width="26" height="30" rx="10"/>
<path d="M58 -40 q60 -20 64 -80" stroke="${cor}" stroke-opacity="${op}" stroke-width="16" fill="none" stroke-linecap="round"/></g>`;

// Silhueta de gato sentado.
const gato = (cx, base, s, cor = '#ffffff', op = 0.28) => `<g transform="translate(${cx} ${base}) scale(${s})" fill="${cor}" fill-opacity="${op}">
<ellipse cx="0" cy="-62" rx="50" ry="66"/><circle cx="0" cy="-160" r="40"/>
<path d="M-36 -178 L-30 -226 L-6 -194 Z"/><path d="M36 -178 L30 -226 L6 -194 Z"/>
<path d="M44 -20 q70 10 50 -70" stroke="${cor}" stroke-opacity="${op}" stroke-width="12" fill="none" stroke-linecap="round"/></g>`;

// Pessoa (retrato da equipe): cabeça + ombros.
const pessoa = (w, h) => `<circle cx="${w / 2}" cy="${h * 0.4}" r="${w * 0.17}" fill="#ffffff" fill-opacity="0.35"/>
<ellipse cx="${w / 2}" cy="${h * 0.95}" rx="${w * 0.36}" ry="${h * 0.3}" fill="#ffffff" fill-opacity="0.3"/>`;

const prateleiras = (w, h) =>
  [0.22, 0.44, 0.66]
    .map((y) => `<rect x="${w * 0.08}" y="${h * y}" width="${w * 0.84}" height="${h * 0.025}" fill="#ffffff" fill-opacity="0.25"/>` +
      [0, 1, 2, 3, 4].map((i) => `<rect x="${w * (0.12 + i * 0.16)}" y="${h * (y - 0.12)}" width="${w * 0.1}" height="${h * 0.12}" rx="8" fill="#ffffff" fill-opacity="${0.12 + (i % 3) * 0.05}"/>`).join(''))
    .join('');

const banheira = (w, h) => `<rect x="${w * 0.18}" y="${h * 0.52}" width="${w * 0.64}" height="${h * 0.22}" rx="${h * 0.06}" fill="#ffffff" fill-opacity="0.22"/>
${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${w * (0.25 + i * 0.1)}" cy="${h * (0.42 - (i % 2) * 0.06)}" r="${h * (0.03 + (i % 3) * 0.012)}" fill="#ffffff" fill-opacity="0.3"/>`).join('')}`;

const mesa = (w, h) => `<rect x="${w * 0.2}" y="${h * 0.56}" width="${w * 0.6}" height="${h * 0.05}" rx="10" fill="#ffffff" fill-opacity="0.3"/>
<rect x="${w * 0.47}" y="${h * 0.61}" width="${w * 0.06}" height="${h * 0.2}" fill="#ffffff" fill-opacity="0.2"/>
<circle cx="${w * 0.78}" cy="${h * 0.22}" r="${h * 0.08}" fill="#ffffff" fill-opacity="0.18"/>`;

const imgs = [
  ['hero.jpg', 960, 1200, '#3b356f', '#c79a2c', cao(380, 1060, 2.2) + gato(700, 1060, 1.7, '#ffffff', 0.24) + trilha(960, 1200, 0.1), 'Imagem ilustrativa'],
  ['recepcao.jpg', 1440, 1080, '#4a4580', '#d8c690', prateleiras(1440, 1080) + pata(1150, 860, 2.2, 0.2), 'Recepção e loja (imagem ilustrativa)'],
  ['banho.jpg', 1080, 1080, '#3e5c8a', '#bcd0e6', banheira(1080, 1080) + cao(540, 620, 0.9, '#ffffff', 0.3), 'Banho e tosa (imagem ilustrativa)'],
  ['consultorio.jpg', 1080, 1080, '#2f4a5a', '#c4d4d6', mesa(1080, 1080) + gato(540, 600, 1.0), 'Consultório (imagem ilustrativa)'],
  ['loja.jpg', 1600, 800, '#5a4a7a', '#e2cf8f', prateleiras(1600, 800), 'Loja (imagem ilustrativa)'],
  ['equipe-1.jpg', 600, 600, '#463f7a', '#b69ad0', pessoa(600, 600), 'Imagem ilustrativa'],
  ['equipe-2.jpg', 600, 600, '#3d5f73', '#9cc3c9', pessoa(600, 600), 'Imagem ilustrativa'],
  ['equipe-3.jpg', 600, 600, '#6b4d3a', '#d6b48f', pessoa(600, 600), 'Imagem ilustrativa'],
];

for (const [nome, w, h, a, b, f, r] of imgs) {
  await sharp(Buffer.from(svg(w, h, a, b, f, r))).jpeg({ quality: 80, mozjpeg: true }).toFile(`${dir}/${nome}`);
  console.log(nome);
}
