// Placeholders neutros para o cliente de exemplo (gradientes e formas, sem foto de terceiros).
// Uso (a partir de sites/): node scripts/gerar-imagens-exemplo.mjs src/assets/clientes/exemplo
import sharp from 'sharp';
const dir = process.argv[2];
const svg = (w, h, a, b, formas, rotulo) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>${formas}
<text x="50%" y="${h - 48}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(w / 22)}" fill="#ffffff" fill-opacity="0.75">${rotulo}</text></svg>`;
const circ = (w, h, op) => `<circle cx="${w * 0.7}" cy="${h * 0.35}" r="${Math.min(w, h) * 0.28}" fill="#ffffff" fill-opacity="${op}"/><circle cx="${w * 0.25}" cy="${h * 0.7}" r="${Math.min(w, h) * 0.18}" fill="#000000" fill-opacity="0.08"/>`;
const arco = (w, h) => `<rect x="${w * 0.2}" y="${h * 0.18}" width="${w * 0.6}" height="${h * 0.62}" rx="${w * 0.3}" fill="#ffffff" fill-opacity="0.14"/>`;
const faixas = (w, h) => `<rect x="0" y="${h * 0.62}" width="${w}" height="${h * 0.12}" fill="#ffffff" fill-opacity="0.10"/><rect x="${w * 0.1}" y="${h * 0.2}" width="${w * 0.35}" height="${h * 0.35}" rx="24" fill="#ffffff" fill-opacity="0.12"/>`;
const imgs = [
  ['fachada.jpg', 804, 987, '#3a4a5c', '#8a6f5a', arco(804, 987), 'Fachada (imagem ilustrativa)'],
  ['sorriso-antes.jpg', 1080, 540, '#8d8a86', '#b7b1a8', circ(1080, 540, 0.10), 'Antes (ilustrativo)'],
  ['sorriso-depois.jpg', 1080, 540, '#c9b49c', '#f1e8dc', circ(1080, 540, 0.25), 'Depois (ilustrativo)'],
  ['caso-2-antes.jpg', 678, 929, '#7d7a77', '#a9a39b', circ(678, 929, 0.10), 'Antes (ilustrativo)'],
  ['caso-2-depois.jpg', 678, 929, '#b99f86', '#efe4d6', circ(678, 929, 0.25), 'Depois (ilustrativo)'],
  ['recepcao.jpg', 1440, 1080, '#5b6b74', '#d9cbb8', faixas(1440, 1080), 'Recepção (imagem ilustrativa)'],
  ['consultorio.jpg', 810, 1080, '#4f6a6a', '#cfd8d3', arco(810, 1080), 'Consultório (imagem ilustrativa)'],
  ['espera.jpg', 1600, 765, '#6d5d52', '#e2d6c6', faixas(1600, 765), 'Sala de espera (imagem ilustrativa)'],
  ['consultorio-2.jpg', 1440, 1080, '#46525e', '#b8c4c9', circ(1440, 1080, 0.15), 'Consultório 2 (imagem ilustrativa)'],
];
for (const [nome, w, h, a, b, f, r] of imgs) {
  await sharp(Buffer.from(svg(w, h, a, b, f, r))).jpeg({ quality: 80, mozjpeg: true }).toFile(`${dir}/${nome}`);
  console.log(nome);
}
