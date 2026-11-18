-- Base do banco novo: privilégios fechados, pessoas, domínios e ajudantes.

-- Endurecimento oficial: nada nasce com acesso para anon, authenticated ou service_role.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role;
alter default privileges for role postgres revoke execute on functions from public;

create schema private;
grant usage on schema private to authenticated;

-- Pessoas
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  curso text not null default '',
  artigo text not null default 'o' check (artigo in ('o', 'a')),
  email text not null default '',
  papel text not null default 'vendedor' check (papel in ('vendedor', 'admin')),
  ativo boolean not null default true,
  cota_diaria int not null default 5 check (cota_diaria between 0 and 50),
  comissao_pct numeric(5,2) check (comissao_pct between 0 and 100),
  ultimo_acesso_em timestamptz,
  criado_em timestamptz not null default now()
);

-- Domínios
create table public.cidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  uf char(2) not null,
  ativa boolean not null default true,
  unique (nome, uf)
);

create table public.nichos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  clinica boolean not null default false,
  template_site text,
  conselho text,
  dor text not null default '',
  transformacao text not null default '',
  ativo boolean not null default true
);

create table public.etapas_funil (
  slug text primary key,
  nome text not null,
  posicao smallint not null unique,
  terminal boolean not null default false
);

create table public.configuracao (
  id boolean primary key default true check (id),
  preco_tabela numeric(10,2) not null,
  piso_referencia numeric(10,2) not null,
  comissao_pct numeric(5,2) not null,
  cota_padrao int not null,
  dias_acompanhamento int not null,
  dias_alerta_parado int not null,
  atualizado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;
alter table public.cidades enable row level security;
alter table public.nichos enable row level security;
alter table public.etapas_funil enable row level security;
alter table public.configuracao enable row level security;

-- Ajudantes de policy
create function private.eu_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.papel = 'admin' and p.ativo from public.perfis p where p.id = (select auth.uid())), false);
$$;

create function private.eu_ativo() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.ativo from public.perfis p where p.id = (select auth.uid())), false);
$$;

create function private.exigir_ativo() returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_id uuid := (select auth.uid());
begin
  if v_id is null then
    raise exception 'Entre de novo para continuar.' using errcode = 'P0001';
  end if;
  if not (select private.eu_ativo()) then
    raise exception 'Seu acesso foi desativado. Fale com o Kelwin.' using errcode = 'P0001';
  end if;
  return v_id;
end;
$$;

-- Tempo em Brasília
create function private.inicio_do_dia(p_t timestamptz) returns timestamptz
language sql immutable set search_path = ''
as $$
  select (date_trunc('day', p_t at time zone 'America/Sao_Paulo')) at time zone 'America/Sao_Paulo';
$$;

create function private.somar_dias_uteis(p_t timestamptz, p_dias int) returns timestamptz
language plpgsql immutable set search_path = ''
as $$
declare
  v_local timestamp := p_t at time zone 'America/Sao_Paulo';
  v_falta int := p_dias;
begin
  while v_falta > 0 loop
    v_local := v_local + interval '1 day';
    if extract(isodow from v_local) < 6 then
      v_falta := v_falta - 1;
    end if;
  end loop;
  return v_local at time zone 'America/Sao_Paulo';
end;
$$;

-- Dias úteis d com data(a) < d <= data(b), em Brasília.
create function private.dias_uteis_entre(p_a timestamptz, p_b timestamptz) returns int
language sql immutable set search_path = ''
as $$
  select count(*)::int
  from generate_series(
    (p_a at time zone 'America/Sao_Paulo')::date + 1,
    (p_b at time zone 'America/Sao_Paulo')::date,
    interval '1 day'
  ) d
  where extract(isodow from d) < 6;
$$;

-- Perfil automático; nunca lê papel do metadata.
create function private.criar_perfil() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_artigo text := v_meta ->> 'artigo';
begin
  insert into public.perfis (id, nome, curso, artigo, email)
  values (
    new.id,
    coalesce(nullif(v_meta ->> 'nome', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(v_meta ->> 'curso', ''),
    case when v_artigo in ('o', 'a') then v_artigo else 'o' end,
    coalesce(new.email, '')
  );
  return new;
end;
$$;

create trigger criar_perfil after insert on auth.users
  for each row execute function private.criar_perfil();

-- Policies
create policy perfis_select on public.perfis for select to authenticated
  using ((id = (select auth.uid()) and (select private.eu_ativo())) or (select private.eu_admin()));
create policy cidades_select on public.cidades for select to authenticated using ((select private.eu_ativo()));
create policy nichos_select on public.nichos for select to authenticated using ((select private.eu_ativo()));
create policy etapas_funil_select on public.etapas_funil for select to authenticated using ((select private.eu_ativo()));
create policy configuracao_select on public.configuracao for select to authenticated using ((select private.eu_ativo()));

-- Grants
grant select on public.perfis, public.cidades, public.nichos, public.etapas_funil, public.configuracao to authenticated;
grant all on public.perfis, public.cidades, public.nichos, public.etapas_funil, public.configuracao to service_role;
grant execute on function private.eu_admin(), private.eu_ativo(), private.exigir_ativo(),
  private.inicio_do_dia(timestamptz), private.somar_dias_uteis(timestamptz, int),
  private.dias_uteis_entre(timestamptz, timestamptz) to authenticated;
revoke execute on function private.criar_perfil() from public, anon, authenticated;

-- Dados de domínio (não são dados de lead)
insert into public.etapas_funil (slug, nome, posicao, terminal) values
  ('previa_pedida', 'Prévia pedida', 1, false),
  ('previa_pronta', 'Prévia pronta', 2, false),
  ('previa_enviada', 'Prévia enviada', 3, false),
  ('negociando', 'Negociando', 4, false),
  ('fechou', 'Fechou', 5, true),
  ('perdeu', 'Perdeu', 6, true);

insert into public.configuracao (preco_tabela, piso_referencia, comissao_pct, cota_padrao, dias_acompanhamento, dias_alerta_parado)
values (497.00, 397.00, 50, 5, 2, 2);

insert into public.cidades (nome, uf, ativa) values ('Uberlândia', 'MG', true);

insert into public.nichos (nome, clinica, conselho) values
  ('Pet shop', false, null),
  ('Odontologia', true, 'CFO 196/2019'),
  ('Estética', true, null),
  ('Veterinária', true, 'CFMV 1.649/2025');
