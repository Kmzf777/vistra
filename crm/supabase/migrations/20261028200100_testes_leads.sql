-- Ajudante de teste: lead pronto para a fila, com dados fictícios. Fechado para os papéis da API.
create function testes.criar_lead_pronto(p_nome text, p_fone text, p_prioridade int default 2,
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
  insert into public.modelos_mensagem (nicho_id, tipo, rotulo, texto) values (null, 'abertura', 'teste', 'Olá [saudacao]');
  return v_lead;
end;
$$;
revoke execute on function testes.criar_lead_pronto(text, text, int, numeric, int) from public, anon, authenticated;
