import type { Contato, Lead } from "@/lib/tipos";

/**
 * O poço mostra, em cada linha, o ativo que a prospecção produziu: o contato de
 * quem decide. Então a linha não é um `Lead` puro — é um lead com os contatos
 * e o perfil do dono pendurados, que é o que o `select` aninhado do Supabase
 * devolve.
 *
 * O tipo mora aqui, e não em `lib/tipos.ts`, porque aquele arquivo é
 * compartilhado com as outras telas e não é meu para alterar.
 */
export type ContatoDoPoco = Pick<Contato, "id" | "nome" | "cargo" | "telefone" | "e_decisor">;

export type LeadDoPoco = Lead & {
  contatos?: ContatoDoPoco[] | null;
  // Colunas da migracao-003. Opcionais: um banco sem a migração devolve a
  // linha sem elas, e a tela não pode quebrar por isso.
  seguidores?: number | null;
  email?: string | null;
  /** Segmento de prospecção ("Odontologia", "Imobiliária"…), não a categoria do Google. */
  nicho?: string | null;
  /** Por que contatar ESTE lead, numa frase. Gerado na raspagem. */
  gancho?: string | null;
  /** 1 = contatar primeiro. */
  prioridade?: number | null;
};

/* ------------------------------------------------------------------ *
 * DADOS DE DEMONSTRAÇÃO
 *
 * Existem por um motivo só: sem as chaves do Supabase no .env não há como
 * carregar o poço, e uma tela em branco não ensina nada sobre o produto.
 * São usados SOMENTE quando `temCredenciaisServidor()` é falso, e a tela
 * grita que são de mentira. Nunca se misturam com dados reais.
 *
 * Empresas, pessoas e telefones daqui são INVENTADOS. Nunca cole um lead
 * de verdade neste arquivo: o repositório é público.
 * ------------------------------------------------------------------ */

/** Quem "está logado" na demonstração. */
export const VENDEDOR_EXEMPLO = { id: "00000000-0000-4000-8000-000000000001", nome: "você (demo)" };
const OUTRO_VENDEDOR = { id: "00000000-0000-4000-8000-000000000002", nome: "Marina" };

const AGORA = "2026-09-30T12:00:00.000Z";

// Atalho para não repetir os quinze campos do schema em cada linha.
function exemplo(dados: Partial<LeadDoPoco> & { id: string; nome: string }): LeadDoPoco {
  return {
    categoria: "Pet Shop",
    telefone: "",
    endereco: "",
    nota: null,
    avaliacoes: null,
    instagram: "",
    site: "",
    fechado: false,
    origem: "raspado",
    situacao: "novo",
    etapa: null,
    vendedor_id: null,
    atribuido_em: null,
    motivo_desqualificacao: null,
    criado_em: AGORA,
    atualizado_em: AGORA,
    perfis: null,
    contatos: [],
    ...dados,
  };
}

export const LEADS_EXEMPLO: LeadDoPoco[] = [
  exemplo({
    id: "demo-01",
    nome: "Clínica Veterinária Exemplo Vida",
    categoria: "Veterinário",
    telefone: "(34) 90000-0001",
    endereco: "Rua das Acácias, 880",
    nota: 5,
    avaliacoes: 41,
    instagram: "https://www.instagram.com/exemplo.vida.vet",
    site: "https://exemplovida.exemplo.com",
  }),
  exemplo({
    id: "demo-02",
    nome: "Hospital Veterinário Exemplo 24h",
    categoria: "Hospital Veterinário",
    telefone: "(34) 90000-0002",
    endereco: "Av. dos Ipês, 995",
    nota: 4.9,
    avaliacoes: 218,
    instagram: "https://www.instagram.com/exemplo.hospital.vet",
  }),
  // Já qualificado: o telefone da lista era da recepção, e o contato
  // produziu o número do dono. É isto que "qualificado" significa.
  exemplo({
    id: "demo-03",
    nome: "Pet Exemplo Patinhas",
    telefone: "(34) 90000-0003",
    endereco: "R. dos Girassóis, 791",
    nota: 4.9,
    avaliacoes: 45,
    situacao: "qualificado",
    etapa: "novo_contato",
    vendedor_id: VENDEDOR_EXEMPLO.id,
    atribuido_em: AGORA,
    perfis: VENDEDOR_EXEMPLO,
    contatos: [
      {
        id: "demo-c1",
        nome: "Ana Exemplo",
        cargo: "Proprietária",
        telefone: "(34) 90000-0004",
        e_decisor: true,
      },
    ],
  }),
  exemplo({
    id: "demo-04",
    nome: "Pet Shop Amigão Exemplo",
    telefone: "(34) 3000-0005",
    endereco: "Av. das Palmeiras, 562",
    nota: 4.8,
    avaliacoes: 105,
    situacao: "meu",
    vendedor_id: VENDEDOR_EXEMPLO.id,
    atribuido_em: AGORA,
    perfis: VENDEDOR_EXEMPLO,
  }),
  // Pego por outra pessoa: é exatamente este aviso que impede dois
  // vendedores de contatarem o mesmo pet shop.
  exemplo({
    id: "demo-05",
    nome: "Banho e Tosa Exemplo",
    categoria: "Banho e tosa",
    telefone: "(34) 3000-0006",
    endereco: "R. das Orquídeas, 410",
    nota: 4.7,
    avaliacoes: 63,
    situacao: "meu",
    vendedor_id: OUTRO_VENDEDOR.id,
    atribuido_em: AGORA,
    perfis: OUTRO_VENDEDOR,
  }),
  exemplo({
    id: "demo-06",
    nome: "Mundo Pet Exemplo",
    telefone: "(34) 3000-0007",
    endereco: "Av. Central, 2120",
    nota: 4.6,
    avaliacoes: 312,
  }),
  exemplo({
    id: "demo-07",
    nome: "Agropet Exemplo",
    categoria: "Agropecuária",
    telefone: "(34) 3000-0008",
    endereco: "R. dos Cedros, 55",
    nota: 4.4,
    avaliacoes: 89,
  }),
  exemplo({
    id: "demo-08",
    nome: "Rede Pet Exemplo (franquia)",
    telefone: "(34) 3000-0009",
    endereco: "Av. Central, 1900",
    nota: 4.2,
    avaliacoes: 540,
    situacao: "nao_qualificado",
    vendedor_id: VENDEDOR_EXEMPLO.id,
    atribuido_em: AGORA,
    perfis: VENDEDOR_EXEMPLO,
    motivo_desqualificacao: "Rede nacional, marketing é decidido em São Paulo.",
  }),
  exemplo({
    id: "demo-09",
    nome: "Pet Feliz Exemplo",
    telefone: "(34) 90000-0010",
    endereco: "R. das Margaridas, 1240",
    nota: 4.1,
    avaliacoes: 17,
  }),
  exemplo({
    id: "demo-10",
    nome: "Clínica Veterinária Exemplo Sul",
    categoria: "Veterinário",
    telefone: "(34) 3000-0011",
    endereco: "R. dos Jasmins, 302",
    nota: 3.9,
    avaliacoes: 22,
  }),
  exemplo({
    id: "demo-11",
    nome: "Tosa Exemplo (indicação)",
    categoria: "Banho e tosa",
    telefone: "(34) 90000-0012",
    endereco: "",
    nota: null,
    avaliacoes: null,
    origem: "manual",
  }),
];
