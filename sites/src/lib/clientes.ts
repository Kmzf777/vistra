import type { ImageMetadata } from 'astro';

export type Horario = { dia: number; abre: string; fecha: string };
export type AntesDepois = { antes: string; depois: string; legenda: string };
export type Foto = { src: string; alt: string };

export type Cliente = {
  slug: string;
  nicho: 'odontologia';
  demo?: boolean;
  nome: string;
  complemento?: string;
  descricao: string;
  contato: { whatsapp: string; telefone: string; mensagemWhatsapp: string; instagram?: string };
  endereco: {
    rua: string; bairro: string; cidade: string; uf: string; cep: string;
    lat: number; lng: number; mapsUrl: string;
  };
  google: { nota: number; avaliacoes: number; cincoEstrelas?: number; placeId: string };
  horario: Horario[];
  hero: { titulo: string; subtitulo: string; imagem: string; imagemAlt: string };
  antesDepois?: { titulo: string; texto: string; destaque: AntesDepois; outros?: AntesDepois[] };
  tratamentos: { grupo: string; itens: { nome: string; texto: string }[] }[];
  primeiraConsulta?: { titulo: string; passos: { titulo: string; texto: string }[] };
  avaliacoes: { autor: string; quando: string; texto: string }[];
  espaco?: { titulo: string; texto: string; fotos: Foto[]; acessibilidade?: string[] };
  tema?: { grafite?: string; acento?: string; acentoTexto?: string };
};

const arquivos = import.meta.glob<Cliente>('/clientes/*.json', { eager: true, import: 'default' });
const imagens = import.meta.glob<ImageMetadata>('/src/assets/clientes/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

export function listarClientes(): Cliente[] {
  return Object.values(arquivos);
}

/** Resolve o nome de arquivo do JSON para a imagem importada de src/assets/clientes/<slug>/. */
export function imagem(cliente: Cliente, arquivo: string): ImageMetadata {
  const img = imagens[`/src/assets/clientes/${cliente.slug}/${arquivo}`];
  if (!img) throw new Error(`Imagem não encontrada: src/assets/clientes/${cliente.slug}/${arquivo}`);
  return img;
}

export function linkWhatsapp(cliente: Cliente): string {
  const { whatsapp, mensagemWhatsapp } = cliente.contato;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagemWhatsapp)}`;
}

export function linkAvaliacoesGoogle(cliente: Cliente): string {
  return `https://search.google.com/local/reviews?placeid=${cliente.google.placeId}`;
}

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const DIAS_SCHEMA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatarNota(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
