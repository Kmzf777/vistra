import type { ImageMetadata } from 'astro';

export type Horario = { dia: number; abre: string; fecha: string };
export type AntesDepois = { antes: string; depois: string; legenda: string };
export type Foto = { src: string; alt: string };

/** Campos comuns a todos os nichos. */
type ClienteBase = {
  slug: string;
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
  avaliacoes: { autor: string; quando: string; texto: string }[];
  espaco?: { titulo: string; texto: string; fotos: Foto[]; acessibilidade?: string[] };
  tema?: { grafite?: string; acento?: string; acentoTexto?: string };
};

export type ClienteOdontologia = ClienteBase & {
  nicho: 'odontologia';
  antesDepois?: { titulo: string; texto: string; destaque: AntesDepois; outros?: AntesDepois[] };
  tratamentos: { grupo: string; itens: { nome: string; texto: string }[] }[];
  primeiraConsulta?: { titulo: string; passos: { titulo: string; texto: string }[] };
};

/** Categoria de serviço do pet: escolhe o ícone e o nome padrão do grupo. */
export type CategoriaPet = 'clinica' | 'vacinas' | 'exames' | 'estetica' | 'loja' | 'hospedagem';

/** Pet shop, clínica veterinária ou os dois (`tipo`). */
export type ClientePet = ClienteBase & {
  nicho: 'pet';
  /** Decide o schema.org: PetStore, VeterinaryCare ou os dois. */
  tipo: 'petshop' | 'veterinaria' | 'petshop-veterinaria';
  /** Atendimento de emergência 24 horas: mostra a faixa de emergência no topo com botão de ligar. */
  emergencia24h?: { telefone: string; texto?: string };
  /** Leva e traz (táxi dog). */
  levaETraz?: { texto: string; aPartirDe?: number };
  /** Selos curtos do hero, ex.: "Cães e gatos", "Estacionamento". Emergência e leva e traz entram sozinhos. */
  destaques?: string[];
  servicos: {
    categoria: CategoriaPet;
    /** Nome do grupo. Sem ele, vale o nome padrão da categoria. */
    nome?: string;
    itens: { nome: string; texto?: string; aPartirDe?: number }[];
  }[];
  banhoETosa?: {
    titulo?: string;
    texto: string;
    /** Preços "a partir de" por porte. */
    portes: { porte: string; peso?: string; banho?: number; banhoETosa?: number }[];
    inclui?: string[];
    /** Mensagem pré-pronta do botão de agendar banho e tosa. */
    mensagemWhatsapp: string;
    passos?: { titulo: string; texto: string }[];
  };
  /** Obrigatório na publicidade veterinária (CFMV): nome e CRMV do responsável técnico. */
  responsavelTecnico?: { nome: string; crmv: string };
  equipe?: { titulo?: string; texto?: string; pessoas: { nome: string; funcao: string; registro?: string; foto?: string }[] };
  /** Aviso dos preços. Padrão: "Preços a partir de. O valor final depende do porte, da pelagem e do comportamento do pet." */
  avisoPrecos?: string;
  tema?: ClienteBase['tema'] & { claro?: string };
};

export type Cliente = ClienteOdontologia | ClientePet;

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

export function linkWhatsapp(cliente: Cliente, mensagem = cliente.contato.mensagemWhatsapp): string {
  return `https://wa.me/${cliente.contato.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

export function linkAvaliacoesGoogle(cliente: Cliente): string {
  return `https://search.google.com/local/reviews?placeid=${cliente.google.placeId}`;
}

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const DIAS_SCHEMA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatarNota(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatarPreco(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: n % 1 ? 2 : 0 });
}
