begin;
select plan(23);

select set_config('t.v1', testes.criar_usuario('migra1@exemplo.com', 'Vendedor Migra Exemplo')::text, true);
select set_config('t.adm', testes.criar_usuario('migra-adm@exemplo.com', 'Admin Migra Exemplo', 'admin')::text, true);
select set_config('t.l', testes.criar_lead_pronto('Pet Exemplo Migra L', '+5534900000401')::text, true);
select set_config('t.l2', testes.criar_lead_pronto('Pet Exemplo Migra M', '+5534900000402')::text, true);

select ok(private.lead_pronto(current_setting('t.l')::uuid), 'antes da migração o lead está pronto para a fila');

create function pg_temp.migrar(p_lead text, p_passo text, p_contato jsonb, p_eventos jsonb, p_atrib timestamptz)
returns text language plpgsql as $$
declare r text;
begin
  perform set_config('role', 'service_role', true);
  r := public.migrar_conversa(p_lead::uuid, current_setting('t.v1')::uuid, p_passo, p_contato, p_eventos, p_atrib);
  reset role;
  return r;
end;
$$;

select is(pg_temp.migrar(current_setting('t.l'), 'quem_respondeu',
  '{"nome":"Contato Exemplo","cargo":"dono","telefone_e164":"+5534900000499"}'::jsonb,
  '[{"tipo_antigo":"atribuiu","nota":"","criado_em":"2026-10-20T09:00:00Z"},
    {"tipo_antigo":"nota","nota":"conversa exemplo","criado_em":"2026-10-22T10:00:00Z"}]'::jsonb,
  '2026-10-20T09:00:00Z'), 'migrada', 'primeira migração devolve migrada');

select is((select estado from public.leads where id = current_setting('t.l')::uuid), 'em_conversa', 'lead em conversa');
select is((select dono_id from public.leads where id = current_setting('t.l')::uuid), current_setting('t.v1')::uuid, 'dono gravado');
select is((select passo from public.leads where id = current_setting('t.l')::uuid), 'quem_respondeu', 'passo gravado');
select is((select abertura_enviada_em from public.leads where id = current_setting('t.l')::uuid),
  '2026-10-20T09:00:00Z'::timestamptz, 'abertura_enviada_em é o atribuido_em informado');
select is((select count(*)::int from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'migrado'
  and dados ->> 'tipo_antigo' <> 'migracao'), 2, 'eventos antigos viram migrado');
select is((select count(*)::int from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'migrado'
  and dados ->> 'tipo_antigo' = 'migracao'), 1, 'a migração deixa uma marca própria');
select is((select min(criado_em) from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'migrado'),
  '2026-10-20T09:00:00Z'::timestamptz, 'criado_em original preservado');
select is((select dados ->> 'tipo_antigo' from public.eventos_lead
  where lead_id = current_setting('t.l')::uuid and dados ->> 'nota' = 'conversa exemplo'), 'nota', 'dados com tipo_antigo e nota');
select is((select count(*)::int from public.contatos where lead_id = current_setting('t.l')::uuid and telefone_e164 = '+5534900000499'), 1,
  'contato inserido');
select ok(not private.lead_pronto(current_setting('t.l')::uuid), 'lead em conversa não está pronto');

-- idempotente: repetir não duplica e diz que já foi
select is(pg_temp.migrar(current_setting('t.l'), 'quem_respondeu', null,
  '[{"tipo_antigo":"nota","nota":"x","criado_em":"2026-10-23T10:00:00Z"}]'::jsonb, null), 'ja_migrada', 'repetir devolve ja_migrada');
select is((select count(*)::int from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'migrado'), 3,
  'repetir não duplica eventos');

-- sem atribuido_em: usa now(); sem eventos antigos, a marca ainda permite saber que já foi
select is(pg_temp.migrar(current_setting('t.l2'), 'resultado', null, '[]'::jsonb, null), 'migrada', 'conversa sem eventos migra');
select ok((select abertura_enviada_em from public.leads where id = current_setting('t.l2')::uuid) > now() - interval '1 minute',
  'sem atribuido_em usa now()');
select is(pg_temp.migrar(current_setting('t.l2'), 'resultado', null, '[]'::jsonb, null), 'ja_migrada',
  'conversa sem eventos, repetida, devolve ja_migrada');

-- lead que já saiu da fila por outro caminho: ignorada, com o estado, e nada muda
select set_config('t.l3', testes.criar_lead_pronto('Pet Exemplo Migra N', '+5534900000403')::text, true);
update public.leads set estado = 'reservado', dono_id = current_setting('t.adm')::uuid, passo = 'abertura', reservado_em = now()
where id = current_setting('t.l3')::uuid;
select is(pg_temp.migrar(current_setting('t.l3'), 'quem_respondeu', null, '[]'::jsonb, null), 'ignorada:reservado',
  'lead reservado devolve ignorada:reservado');
select is((select dono_id from public.leads where id = current_setting('t.l3')::uuid), current_setting('t.adm')::uuid,
  'ignorada não muda o dono');

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
select ok(not has_function_privilege('anon',
  'public.migrar_conversa(uuid, uuid, text, jsonb, jsonb, timestamptz)', 'execute'), 'anon não executa');
select ok(has_function_privilege('service_role',
  'public.migrar_conversa(uuid, uuid, text, jsonb, jsonb, timestamptz)', 'execute'), 'service_role executa');

select * from finish();
rollback;
