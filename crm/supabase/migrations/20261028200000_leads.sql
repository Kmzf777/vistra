-- Leads e o que se sabe deles. Escrita só por RPC (service_role); authenticated só lê.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade_id uuid not null references public.cidades (id),
  nicho_id uuid references public.nichos (id),
  categoria text,
  endereco text,
  nota numeric(2,1) check (nota between 0 and 5),
  avaliacoes int check (avaliacoes >= 0),
  instagram text,
  seguidores int check (seguidores >= 0),
  seguidores_em date,
  site text,
  email text,
  google_place_id text,
  origem_id text,
  prioridade smallint check (prioridade between 1 and 4),
  gancho text,
  grupo text,
  estado text not null default 'no_poco'
    check (estado in ('no_poco', 'reservado', 'em_conversa', 'encerrado', 'descartado', 'verificar')),
  passo text check (passo in ('abertura', 'quem_respondeu', 'robo', 'acompanhamento', 'principal', 'resultado')),
  dono_id uuid references public.perfis (id),
  reservado_em timestamptz,
  abertura_enviada_em timestamptz,
  principal_enviada_em timestamptz,
  acompanhamento_enviado_em timestamptz,
  proximo_passo_em timestamptz,
  etapa text references public.etapas_funil (slug),
  etapa_desde timestamptz,
  ultima_atividade_em timestamptz,
  veredito_atual text,
  motivo_fim text check (motivo_fim in ('sem_interesse', 'sem_resposta', 'pediu_parar', 'venda', 'perdeu',
    'tem_site', 'lead_fraco', 'fechado', 'duplicado', 'fora_do_nicho', 'outro')),
  fim_em timestamptz,
  fim_por uuid references public.perfis (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint leads_dono_ativo check (estado not in ('reservado', 'em_conversa') or dono_id is not null),
  constraint leads_livre check (estado not in ('no_poco', 'verificar')
    or (dono_id is null and passo is null and etapa is null)),
  constraint leads_reservado check (estado <> 'reservado' or (passo = 'abertura' and reservado_em is not null)),
  constraint leads_em_conversa check (estado <> 'em_conversa' or abertura_enviada_em is not null),
  constraint leads_etapa_estado check (etapa is null or estado in ('em_conversa', 'encerrado')),
  constraint leads_fim_motivo check (estado not in ('encerrado', 'descartado') or motivo_fim is not null)
);

create unique index leads_google_place_id_uq on public.leads (google_place_id) where google_place_id is not null;
create unique index leads_um_reservado_por_dono_uq on public.leads (dono_id) where estado = 'reservado';
create index leads_fila_idx on public.leads (prioridade nulls last, nota desc nulls last, avaliacoes desc nulls last, criado_em)
  where estado = 'no_poco';
create index leads_dono_id_idx on public.leads (dono_id);
create index leads_cidade_id_idx on public.leads (cidade_id);
create index leads_nicho_id_idx on public.leads (nicho_id);
create index leads_etapa_idx on public.leads (etapa);
create index leads_grupo_idx on public.leads (grupo);
create index leads_fim_por_idx on public.leads (fim_por);

create table public.telefones_lead (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.leads (id),
  e164 text not null check (e164 ~ '^\+[1-9][0-9]{7,14}$'),
  tipo text check (tipo in ('fixo', 'celular', 'whatsapp')),
  origem text,
  principal boolean not null default false,
  invalido_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (lead_id, e164)
);
create index telefones_lead_e164_idx on public.telefones_lead (e164);

create table public.verificacoes_site (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.leads (id),
  veredito text not null check (veredito in ('PODE_ABORDAR', 'SITE_QUEBRADO', 'TEM_SITE', 'FECHADO',
    'DESCARTE_LEAD_FRACO', 'DUVIDA')),
  evidencias jsonb not null default '[]',
  verificado_em timestamptz not null default now(),
  ferramenta text,
  criado_em timestamptz not null default now()
);
create index verificacoes_site_lead_idx on public.verificacoes_site (lead_id, verificado_em desc);

create table public.modelos_mensagem (
  id bigint generated always as identity primary key,
  nicho_id uuid references public.nichos (id),
  tipo text not null check (tipo in ('abertura', 'robo', 'acompanhamento', 'preco')),
  rotulo text not null default '',
  texto text not null,
  ativo boolean not null default true,
  autor_id uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);
create index modelos_mensagem_nicho_idx on public.modelos_mensagem (nicho_id);
create index modelos_mensagem_autor_idx on public.modelos_mensagem (autor_id);

create table public.mensagens_lead (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.leads (id),
  versao int not null,
  partes text[] not null check (array_length(partes, 1) between 2 and 3)
    check (char_length(array_to_string(partes, '')) <= 650),
  status text not null default 'rascunho' check (status in ('rascunho', 'aprovada', 'substituida')),
  modelo text,
  observacao text,
  autor_id uuid references public.perfis (id),
  criado_em timestamptz not null default now(),
  aprovada_em timestamptz,
  unique (lead_id, versao)
);
create unique index mensagens_lead_uma_aprovada_uq on public.mensagens_lead (lead_id) where status = 'aprovada';
create index mensagens_lead_autor_idx on public.mensagens_lead (autor_id);

create table public.contatos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id),
  nome text,
  cargo text,
  telefone_e164 text,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);
create index contatos_lead_idx on public.contatos (lead_id);
create index contatos_criado_por_idx on public.contatos (criado_por);

create table public.bloqueios (
  id bigint generated always as identity primary key,
  telefone_e164 text,
  google_place_id text,
  motivo text not null check (motivo in ('pediu_parar', 'cliente', 'descarte')),
  origem text,
  lead_id uuid references public.leads (id),
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now(),
  check (telefone_e164 is not null or google_place_id is not null)
);
create unique index bloqueios_telefone_uq on public.bloqueios (telefone_e164) where telefone_e164 is not null;
create unique index bloqueios_place_uq on public.bloqueios (google_place_id) where google_place_id is not null;
create index bloqueios_lead_idx on public.bloqueios (lead_id);
create index bloqueios_criado_por_idx on public.bloqueios (criado_por);

create table public.eventos_lead (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.leads (id),
  autor_id uuid references public.perfis (id),
  tipo text not null check (tipo in ('recebeu', 'abertura_enviada', 'numero_errado', 'robo', 'pessoa_respondeu',
    'sem_resposta', 'acompanhamento_enviado', 'principal_enviada', 'perguntou', 'sem_interesse', 'previa_pedida',
    'previa_pronta', 'previa_enviada', 'etapa', 'venda', 'largou', 'descartou', 'bloqueou', 'reserva_venceu',
    'reatribuido', 'importado', 'migrado', 'contato')),
  dados jsonb not null default '{}',
  mensagem_id bigint references public.mensagens_lead (id),
  criado_em timestamptz not null default now()
);
create index eventos_lead_lead_idx on public.eventos_lead (lead_id, criado_em desc);
create index eventos_lead_autor_idx on public.eventos_lead (autor_id, tipo, criado_em);
create index eventos_lead_mensagem_idx on public.eventos_lead (mensagem_id);

-- veredito_atual = o veredito de maior verificado_em
create function private.atualizar_veredito_atual() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.leads l
  set veredito_atual = (
    select v.veredito from public.verificacoes_site v
    where v.lead_id = new.lead_id order by v.verificado_em desc, v.id desc limit 1)
  where l.id = new.lead_id;
  return null;
end;
$$;
revoke execute on function private.atualizar_veredito_atual() from public, anon, authenticated;

create trigger verificacoes_site_veredito after insert on public.verificacoes_site
for each row execute function private.atualizar_veredito_atual();

-- RLS
alter table public.leads enable row level security;
alter table public.telefones_lead enable row level security;
alter table public.verificacoes_site enable row level security;
alter table public.modelos_mensagem enable row level security;
alter table public.mensagens_lead enable row level security;
alter table public.contatos enable row level security;
alter table public.bloqueios enable row level security;
alter table public.eventos_lead enable row level security;

create policy leads_select on public.leads for select to authenticated
using ((dono_id = (select auth.uid()) and (select private.eu_ativo())) or (select private.eu_admin()));

create policy telefones_lead_select on public.telefones_lead for select to authenticated
using ((lead_id in (select l.id from public.leads l where l.dono_id = (select auth.uid())) and (select private.eu_ativo()))
  or (select private.eu_admin()));
create policy verificacoes_site_select on public.verificacoes_site for select to authenticated
using ((lead_id in (select l.id from public.leads l where l.dono_id = (select auth.uid())) and (select private.eu_ativo()))
  or (select private.eu_admin()));
create policy mensagens_lead_select on public.mensagens_lead for select to authenticated
using ((lead_id in (select l.id from public.leads l where l.dono_id = (select auth.uid())) and (select private.eu_ativo()))
  or (select private.eu_admin()));
create policy contatos_select on public.contatos for select to authenticated
using ((lead_id in (select l.id from public.leads l where l.dono_id = (select auth.uid())) and (select private.eu_ativo()))
  or (select private.eu_admin()));
create policy eventos_lead_select on public.eventos_lead for select to authenticated
using ((lead_id in (select l.id from public.leads l where l.dono_id = (select auth.uid())) and (select private.eu_ativo()))
  or (select private.eu_admin()));

create policy modelos_mensagem_select on public.modelos_mensagem for select to authenticated
using ((select private.eu_ativo()));
create policy bloqueios_select on public.bloqueios for select to authenticated
using ((select private.eu_admin()));

grant select on public.leads, public.telefones_lead, public.verificacoes_site, public.modelos_mensagem,
  public.mensagens_lead, public.contatos, public.bloqueios, public.eventos_lead to authenticated;
grant all on public.leads, public.telefones_lead, public.verificacoes_site, public.modelos_mensagem,
  public.mensagens_lead, public.contatos, public.bloqueios, public.eventos_lead to service_role;
