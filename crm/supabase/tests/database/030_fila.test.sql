begin;
select plan(36);

select set_config('t.v1', testes.criar_usuario('fila1@exemplo.com', 'Vendedor Um Exemplo')::text, true);
select set_config('t.v2', testes.criar_usuario('fila2@exemplo.com', 'Vendedor Dois Exemplo')::text, true);
select set_config('t.v3', testes.criar_usuario('fila3@exemplo.com', 'Vendedor Tres Exemplo')::text, true);
select set_config('t.v4', testes.criar_usuario('fila4@exemplo.com', 'Vendedor Quatro Exemplo')::text, true);
select set_config('t.v5', testes.criar_usuario('fila5@exemplo.com', 'Vendedor Cinco Exemplo')::text, true);
select set_config('t.v6', testes.criar_usuario('fila6@exemplo.com', 'Vendedor Seis Exemplo')::text, true);
select set_config('t.v7', testes.criar_usuario('fila7@exemplo.com', 'Vendedor Sete Exemplo')::text, true);

-- lead_pronto: um lead que passa em tudo e uma mudança por asserção
select set_config('t.p', testes.criar_lead_pronto('Pet Exemplo P', '+5534900000010')::text, true);
select set_config('t.q', testes.criar_lead_pronto('Pet Exemplo Q', '+5534900000011')::text, true);

select ok(private.lead_pronto(current_setting('t.p')::uuid), 'lead completo está pronto');

update public.leads set veredito_atual = 'TEM_SITE' where id = current_setting('t.p')::uuid;
select ok(not private.lead_pronto(current_setting('t.p')::uuid), 'TEM_SITE não está pronto');
update public.leads set veredito_atual = 'DUVIDA' where id = current_setting('t.p')::uuid;
select ok(not private.lead_pronto(current_setting('t.p')::uuid), 'DUVIDA não está pronto');
update public.leads set veredito_atual = 'SITE_QUEBRADO' where id = current_setting('t.p')::uuid;
select ok(private.lead_pronto(current_setting('t.p')::uuid), 'SITE_QUEBRADO está pronto');
update public.leads set veredito_atual = 'PODE_ABORDAR' where id = current_setting('t.p')::uuid;

update public.telefones_lead set tipo = 'fixo' where lead_id = current_setting('t.p')::uuid;
select ok(not private.lead_pronto(current_setting('t.p')::uuid), 'só telefone fixo não está pronto');
update public.telefones_lead set tipo = 'whatsapp' where lead_id = current_setting('t.p')::uuid;

update public.telefones_lead set invalido_em = now() where lead_id = current_setting('t.p')::uuid;
select ok(not private.lead_pronto(current_setting('t.p')::uuid), 'WhatsApp inválido não está pronto');
update public.telefones_lead set invalido_em = null where lead_id = current_setting('t.p')::uuid;

update public.mensagens_lead set status = 'rascunho' where lead_id = current_setting('t.p')::uuid;
select ok(not private.lead_pronto(current_setting('t.p')::uuid), 'mensagem em rascunho não está pronta');
update public.mensagens_lead set status = 'aprovada' where lead_id = current_setting('t.p')::uuid;

insert into public.bloqueios (telefone_e164, motivo, origem) values ('+5534900000010', 'descarte', 'teste');
select ok(not private.lead_pronto(current_setting('t.p')::uuid), 'telefone bloqueado não está pronto');
delete from public.bloqueios where telefone_e164 = '+5534900000010';

insert into public.bloqueios (google_place_id, motivo, origem)
select l.google_place_id, 'descarte', 'teste' from public.leads l where l.id = current_setting('t.p')::uuid;
select ok(not private.lead_pronto(current_setting('t.p')::uuid), 'place id bloqueado não está pronto');
delete from public.bloqueios where google_place_id like 'exemplo-%';

update public.cidades set ativa = false where nome = 'Cidade Exemplo' and uf = 'EX';
select ok(not private.lead_pronto(current_setting('t.p')::uuid), 'cidade inativa não está pronta');
update public.cidades set ativa = true where nome = 'Cidade Exemplo' and uf = 'EX';

update public.nichos set ativo = false where nome = 'Nicho Exemplo';
select ok(not private.lead_pronto(current_setting('t.p')::uuid), 'nicho inativo não está pronto');
update public.nichos set ativo = true where nome = 'Nicho Exemplo';

update public.leads set grupo = 'exemplo-grupo' where id in (current_setting('t.p')::uuid, current_setting('t.q')::uuid);
update public.leads
set estado = 'em_conversa', passo = 'quem_respondeu', dono_id = current_setting('t.v1')::uuid, abertura_enviada_em = now()
where id = current_setting('t.q')::uuid;
select ok(not private.lead_pronto(current_setting('t.p')::uuid), 'irmão de grupo em conversa bloqueia');

-- tira P e Q da fila para os cenários seguintes
update public.leads set estado = 'descartado', motivo_fim = 'outro', grupo = null
where id in (current_setting('t.p')::uuid, current_setting('t.q')::uuid);

-- ordem da fila
select set_config('t.a', testes.criar_lead_pronto('Pet Exemplo A', '+5534900000021', 2, 4.9, 50)::text, true);
select set_config('t.b', testes.criar_lead_pronto('Pet Exemplo B', '+5534900000022', 1, 4.0, null)::text, true);
select set_config('t.c', testes.criar_lead_pronto('Pet Exemplo C', '+5534900000023', 1, 4.0, 90)::text, true);
select set_config('t.d', testes.criar_lead_pronto('Pet Exemplo D', '+5534900000024', 1, 4.0, 10)::text, true);

select testes.entrar_como(current_setting('t.v1')::uuid);
select set_config('t.r1', public.proximo_lead()::text, true);
reset role;
select testes.entrar_como(current_setting('t.v2')::uuid);
select set_config('t.r2', public.proximo_lead()::text, true);
reset role;
select testes.entrar_como(current_setting('t.v3')::uuid);
select set_config('t.r3', public.proximo_lead()::text, true);
reset role;
select is(current_setting('t.r1')::uuid, current_setting('t.c')::uuid, 'v1 recebe C (mais avaliações)');
select is(current_setting('t.r2')::uuid, current_setting('t.d')::uuid, 'v2 recebe D');
select is(current_setting('t.r3')::uuid, current_setting('t.b')::uuid, 'v3 recebe B (sem avaliações vai por último)');
select is((select count(distinct x) from unnest(array[current_setting('t.r1'), current_setting('t.r2'), current_setting('t.r3')]) x),
  3::bigint, 'três vendedores, três leads diferentes');

-- um por vez
select testes.entrar_como(current_setting('t.v1')::uuid);
select is(public.proximo_lead(), current_setting('t.c')::uuid, 'pedir de novo devolve o mesmo lead');
reset role;
select throws_ok(
  format($$update public.leads set estado = 'reservado', passo = 'abertura', reservado_em = now(), dono_id = %L where id = %L$$,
    current_setting('t.v1'), current_setting('t.a')), '23505', null, 'segundo reservado do mesmo dono');

-- cota (v4)
update public.perfis set cota_diaria = 1 where id = current_setting('t.v4')::uuid;
insert into public.eventos_lead (lead_id, autor_id, tipo, criado_em)
values (current_setting('t.a')::uuid, current_setting('t.v4')::uuid, 'abertura_enviada', now());
select testes.entrar_como(current_setting('t.v4')::uuid);
select throws_ok('select public.proximo_lead()', 'P0001', 'Você já abriu 1 conversas hoje. A cota volta amanhã.');
select results_eq('select abertas_hoje, cota from public.minha_cota()', $$values (1, 1)$$, 'minha_cota 1 de 1');
reset role;
update public.eventos_lead set criado_em = private.inicio_do_dia(now()) - interval '30 minutes'
where autor_id = current_setting('t.v4')::uuid and tipo = 'abertura_enviada';
select testes.entrar_como(current_setting('t.v4')::uuid);
select set_config('t.r4', public.proximo_lead()::text, true);
select is(current_setting('t.r4')::uuid, current_setting('t.a')::uuid, 'abertura de ontem 23:30 não conta hoje');
select results_eq('select abertas_hoje, cota from public.minha_cota()', $$values (0, 1)$$, 'minha_cota 0 de 1');
reset role;

-- reserva vencida
update public.leads set reservado_em = private.inicio_do_dia(now()) - interval '10 minutes'
where id = current_setting('t.c')::uuid;
select testes.entrar_como(current_setting('t.v5')::uuid);
select set_config('t.r5', public.proximo_lead()::text, true);
reset role;
select is(current_setting('t.r5')::uuid, current_setting('t.c')::uuid, 'reserva de ontem volta e v5 recebe');
select ok(exists (select 1 from public.eventos_lead
  where lead_id = current_setting('t.c')::uuid and tipo = 'reserva_venceu' and autor_id = current_setting('t.v1')::uuid),
  'evento reserva_venceu com o antigo dono');

-- largar
select testes.entrar_como(current_setting('t.v3')::uuid);
select throws_ok(format($$select public.largar_lead(%L, 'outro')$$, current_setting('t.a')), 'P0001',
  'Esse lead não está com você.', 'não largo lead alheio');
reset role;

select set_config('t.f', testes.criar_lead_pronto('Pet Exemplo F', '+5534900000031', 2, 4.8, 50)::text, true);
select set_config('t.g', testes.criar_lead_pronto('Pet Exemplo G', '+5534900000032', 2, 4.7, 50)::text, true);
select testes.entrar_como(current_setting('t.v1')::uuid);
select is(public.proximo_lead(), current_setting('t.f')::uuid, 'v1 sem reserva recebe F');
select public.largar_lead(current_setting('t.f')::uuid, 'outro');
select is(public.proximo_lead(), current_setting('t.g')::uuid, 'depois de largar F, v1 não recebe F de novo');
reset role;
select testes.entrar_como(current_setting('t.v6')::uuid);
select is(public.proximo_lead(), current_setting('t.f')::uuid, 'outro vendedor recebe F');
reset role;

update public.leads set estado = 'em_conversa', passo = 'quem_respondeu', abertura_enviada_em = now()
where id = current_setting('t.d')::uuid;
select testes.entrar_como(current_setting('t.v2')::uuid);
select throws_ok(format($$select public.largar_lead(%L, 'outro')$$, current_setting('t.d')), 'P0001',
  'Depois da abertura enviada o lead não volta para a fila.');
reset role;

select testes.entrar_como(current_setting('t.v3')::uuid);
select public.largar_lead(current_setting('t.b')::uuid, 'tem_site');
reset role;
select is((select estado || ':' || motivo_fim from public.leads where id = current_setting('t.b')::uuid),
  'descartado:tem_site', 'largar com tem_site descarta');

-- vendedor desativado
update public.perfis set ativo = false where id = current_setting('t.v7')::uuid;
select testes.entrar_como(current_setting('t.v7')::uuid);
select throws_ok('select public.proximo_lead()', 'P0001', 'Seu acesso foi desativado. Fale com o Kelwin.');
reset role;

-- fila vazia (v3 está sem reserva)
select testes.entrar_como(current_setting('t.v3')::uuid);
select throws_ok('select public.proximo_lead()', 'P0001', 'A fila está vazia agora. Avise o Kelwin.');
reset role;

-- privilégios
select ok(not has_function_privilege('anon', 'public.proximo_lead()', 'execute'), 'anon não executa proximo_lead');
select ok(has_function_privilege('authenticated', 'public.proximo_lead()', 'execute'), 'authenticated executa proximo_lead');

-- marcar_acesso só grava depois de 10 minutos
update public.perfis set ultimo_acesso_em = now() - interval '1 hour' where id = current_setting('t.v1')::uuid;
select testes.entrar_como(current_setting('t.v1')::uuid);
select public.marcar_acesso();
reset role;
select is((select ultimo_acesso_em from public.perfis where id = current_setting('t.v1')::uuid), now(), 'acesso antigo é atualizado');
update public.perfis set ultimo_acesso_em = now() - interval '5 minutes' where id = current_setting('t.v1')::uuid;
select testes.entrar_como(current_setting('t.v1')::uuid);
select public.marcar_acesso();
reset role;
select is((select ultimo_acesso_em from public.perfis where id = current_setting('t.v1')::uuid), now() - interval '5 minutes',
  'acesso recente não é regravado');

select * from finish();
rollback;
