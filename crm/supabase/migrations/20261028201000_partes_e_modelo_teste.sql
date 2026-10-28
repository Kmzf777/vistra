-- Corrige o check de partes (NULL passava) e torna criar_lead_pronto idempotente no modelo.
do $$
declare
  v_nome text;
begin
  for v_nome in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.mensagens_lead'::regclass and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%array_length%'
  loop
    execute format('alter table public.mensagens_lead drop constraint %I', v_nome);
  end loop;
end;
$$;

alter table public.mensagens_lead add constraint mensagens_lead_partes_forma
  check (cardinality(partes) between 2 and 3 and array_ndims(partes) = 1 and array_position(partes, null) is null);

create or replace function testes.criar_lead_pronto(p_nome text, p_fone text, p_prioridade int default 2,
  p_nota numeric default 4.5, p_avaliacoes int default 50)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_cidade uuid;
  v_nicho uuid;
  v_lead uuid := gen_random_uuid();
begin
  select id into v_cidade from public.cidades where nome = 'Cidade Exemplo' and uf = 'EX';
  if v_cidade is null then
    insert into public.cidades (nome, uf, ativa) values ('Cidade Exemplo', 'EX', true) returning id into v_cidade;
  end if;
  select id into v_nicho from public.nichos where nome = 'Nicho Exemplo';
  if v_nicho is null then
    insert into public.nichos (nome, ativo) values ('Nicho Exemplo', true) returning id into v_nicho;
  end if;

  insert into public.leads (id, nome, cidade_id, nicho_id, nota, avaliacoes, prioridade, google_place_id, origem_id)
  values (v_lead, p_nome, v_cidade, v_nicho, p_nota, p_avaliacoes, p_prioridade,
    'exemplo-' || v_lead::text, 'exemplo-' || v_lead::text);
  insert into public.telefones_lead (lead_id, e164, tipo, principal) values (v_lead, p_fone, 'whatsapp', true);
  insert into public.verificacoes_site (lead_id, veredito, ferramenta) values (v_lead, 'PODE_ABORDAR', 'teste');
  insert into public.mensagens_lead (lead_id, versao, partes, status, aprovada_em)
  values (v_lead, 1, array['oi, tudo bem?', 'vi o perfil de vocês', 'posso mandar uma ideia?'], 'aprovada', now());
  if not exists (select 1 from public.modelos_mensagem where nicho_id is null and tipo = 'abertura' and ativo) then
    insert into public.modelos_mensagem (nicho_id, tipo, rotulo, texto) values (null, 'abertura', 'teste', 'Olá [saudacao]');
  end if;
  return v_lead;
end;
$$;
revoke execute on function testes.criar_lead_pronto(text, text, int, numeric, int) from public, anon, authenticated;
