begin;
select plan(14);

select set_config('t.v1', testes.criar_usuario('migra1@exemplo.com', 'Vendedor Migra Exemplo')::text, true);
select set_config('t.adm', testes.criar_usuario('migra-adm@exemplo.com', 'Admin Migra Exemplo', 'admin')::text, true);
select set_config('t.l', testes.criar_lead_pronto('Pet Exemplo Migra L', '+5534900000401')::text, true);
select set_config('t.l2', testes.criar_lead_pronto('Pet Exemplo Migra M', '+5534900000402')::text, true);

select ok(private.lead_pronto(current_setting('t.l')::uuid), 'antes da migração o lead está pronto para a fila');

create function pg_temp.migrar(p_lead text, p_passo text, p_contato jsonb, p_eventos jsonb, p_atrib timestamptz)
returns void language plpgsql as $$
begin
  perform set_config('role', 'service_role', true);
  perform public.migrar_conversa(p_lead::uuid, current_setting('t.v1')::uuid, p_passo, p_contato, p_eventos, p_atrib);
  reset role;
end;
$$;

select pg_temp.migrar(current_setting('t.l'), 'quem_respondeu',
  '{"nome":"Contato Exemplo","cargo":"dono","telefone_e164":"+5534900000499"}'::jsonb,
  '[{"tipo_antigo":"atribuiu","nota":"","criado_em":"2026-10-20T09:00:00Z"},
    {"tipo_antigo":"nota","nota":"conversa exemplo","criado_em":"2026-10-22T10:00:00Z"}]'::jsonb,
  '2026-10-20T09:00:00Z');

select is((select estado from public.leads where id = current_setting('t.l')::uuid), 'em_conversa', 'lead em conversa');
select is((select dono_id from public.leads where id = current_setting('t.l')::uuid), current_setting('t.v1')::uuid, 'dono gravado');
select is((select passo from public.leads where id = current_setting('t.l')::uuid), 'quem_respondeu', 'passo gravado');
select is((select abertura_enviada_em from public.leads where id = current_setting('t.l')::uuid),
  '2026-10-20T09:00:00Z'::timestamptz, 'abertura_enviada_em é o atribuido_em informado');
select is((select count(*)::int from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'migrado'), 2,
  'eventos antigos viram migrado');
select is((select min(criado_em) from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'migrado'),
  '2026-10-20T09:00:00Z'::timestamptz, 'criado_em original preservado');
select is((select dados ->> 'tipo_antigo' from public.eventos_lead
  where lead_id = current_setting('t.l')::uuid and dados ->> 'nota' = 'conversa exemplo'), 'nota', 'dados com tipo_antigo e nota');
select is((select count(*)::int from public.contatos where lead_id = current_setting('t.l')::uuid and telefone_e164 = '+5534900000499'), 1,
  'contato inserido');
select ok(not private.lead_pronto(current_setting('t.l')::uuid), 'lead em conversa não está pronto');

-- idempotente: repetir não duplica
select pg_temp.migrar(current_setting('t.l'), 'quem_respondeu', null, '[{"tipo_antigo":"nota","nota":"x","criado_em":"2026-10-23T10:00:00Z"}]'::jsonb, null);
select is((select count(*)::int from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'migrado'), 2,
  'repetir não duplica eventos');

-- sem atribuido_em: usa now()
select pg_temp.migrar(current_setting('t.l2'), 'resultado', null, '[]'::jsonb, null);
select ok((select abertura_enviada_em from public.leads where id = current_setting('t.l2')::uuid) > now() - interval '1 minute',
  'sem atribuido_em usa now()');

-- painel_dono não conta migrado
create function pg_temp.painel() returns text language plpgsql as $$
declare r text;
begin
  perform testes.entrar_como(current_setting('t.adm')::uuid);
  select (recebidos + aberturas + respostas_pessoa + pedidos_previa + vendas)::text into r
  from public.painel_dono(null) where vendedor_id = current_setting('t.v1')::uuid;
  reset role;
  return r;
end;
$$;
select is(pg_temp.painel(), '0', 'painel_dono não conta eventos migrados');

-- só service_role
select ok(not has_function_privilege('authenticated',
  'public.migrar_conversa(uuid, uuid, text, jsonb, jsonb, timestamptz)', 'execute'), 'authenticated não executa');

select * from finish();
rollback;
