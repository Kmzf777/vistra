begin;
select plan(19);

select set_config('t.v1', testes.criar_usuario('v1@exemplo.com', 'Vendedor Um Exemplo')::text, true);
select set_config('t.v2', testes.criar_usuario('v2@exemplo.com', 'Vendedor Dois Exemplo')::text, true);
select set_config('t.adm', testes.criar_usuario('adm@exemplo.com', 'Admin Exemplo', 'admin')::text, true);

select set_config('t.l1', testes.criar_lead_pronto('Pet Exemplo 01', '+5534900000001')::text, true);
select set_config('t.l2', testes.criar_lead_pronto('Pet Exemplo 02', '+5534900000002')::text, true);

update public.leads
set dono_id = current_setting('t.v1')::uuid, estado = 'em_conversa', passo = 'quem_respondeu', abertura_enviada_em = now()
where id = current_setting('t.l1')::uuid;

insert into public.bloqueios (telefone_e164, motivo, origem) values ('+5534900000099', 'descarte', 'teste');

select testes.entrar_como(current_setting('t.v1')::uuid);
select is((select count(*) from leads), 1::bigint, 'v1 vê só o próprio lead');
select is((select count(*) from telefones_lead), 1::bigint, 'v1 vê só o telefone do próprio lead');
select is((select count(*) from mensagens_lead), 1::bigint, 'v1 vê só a mensagem do próprio lead');
select is((select count(*) from verificacoes_site), 1::bigint, 'v1 vê só a verificação do próprio lead');
select throws_ok($$update public.leads set nome = 'x'$$, '42501');
select throws_ok($$insert into public.eventos_lead (lead_id, tipo) values (gen_random_uuid(), 'recebeu')$$, '42501');
select throws_ok($$delete from public.eventos_lead$$, '42501');
select is((select count(*) from bloqueios), 0::bigint, 'v1 não vê bloqueios');
reset role;

select testes.entrar_como(current_setting('t.v2')::uuid);
select is((select count(*) from leads), 0::bigint, 'v2 não vê lead alheio');
reset role;

select testes.entrar_como(current_setting('t.adm')::uuid);
select is((select count(*) from leads where id in (current_setting('t.l1')::uuid, current_setting('t.l2')::uuid)), 2::bigint, 'admin vê todos os leads');
select is((select count(*) from bloqueios where telefone_e164 = '+5534900000099'), 1::bigint, 'admin vê os bloqueios');
reset role;

select throws_ok(
  format($$update public.leads set estado = 'reservado', passo = null where id = %L$$, current_setting('t.l2')), '23514');
select throws_ok(format($$update public.leads set nota = 5.5 where id = %L$$, current_setting('t.l2')), '23514');
select throws_ok(
  format($$insert into public.mensagens_lead (lead_id, versao, partes, status) values (%L, 2, array['a','b'], 'aprovada')$$, current_setting('t.l1')), '23505');

select throws_ok(format($$insert into public.mensagens_lead (lead_id, versao, partes) values (%L, 3, '{}')$$, current_setting('t.l2')), '23514', null, 'partes vazias');
select throws_ok(format($$insert into public.mensagens_lead (lead_id, versao, partes) values (%L, 4, array['a', null])$$, current_setting('t.l2')), '23514', null, 'parte NULL');
select throws_ok(format($$insert into public.mensagens_lead (lead_id, versao, partes) values (%L, 5, array['a','b','c','d'])$$, current_setting('t.l2')), '23514', null, 'quatro partes');

insert into public.verificacoes_site (lead_id, veredito, verificado_em)
values (current_setting('t.l1')::uuid, 'TEM_SITE', now() + interval '1 day');
select is((select veredito_atual from public.leads where id = current_setting('t.l1')::uuid), 'TEM_SITE', 'veredito mais novo vira o atual');

insert into public.verificacoes_site (lead_id, veredito, verificado_em)
values (current_setting('t.l1')::uuid, 'FECHADO', now() - interval '2 days');
select is((select veredito_atual from public.leads where id = current_setting('t.l1')::uuid), 'TEM_SITE', 'verificação mais antiga inserida depois não vence');

select * from finish();
rollback;
