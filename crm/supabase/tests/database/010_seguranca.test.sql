begin;
select plan(19);

select is((select count(*) from pg_tables where schemaname = 'public' and not rowsecurity), 0::bigint, 'RLS em toda tabela');
select is((select count(*) from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public'), 0::bigint, 'anon sem grant');
select is((select count(*) from information_schema.routine_privileges where grantee in ('anon', 'PUBLIC') and routine_schema in ('public', 'private')), 0::bigint, 'funções fechadas para anon');

-- o metadata não promove: papel=admin no metadata vira vendedor
select set_config('t.meta', gen_random_uuid()::text, true);
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values (current_setting('t.meta')::uuid, 'meta@exemplo.com',
  '{"nome":"Ana Exemplo","curso":"Engenharia","papel":"admin"}'::jsonb, 'authenticated', 'authenticated');
select is((select nome from public.perfis where id = current_setting('t.meta')::uuid), 'Ana Exemplo', 'perfil nasce com o nome do metadata');
select is((select curso from public.perfis where id = current_setting('t.meta')::uuid), 'Engenharia', 'perfil nasce com o curso do metadata');
select is((select papel from public.perfis where id = current_setting('t.meta')::uuid), 'vendedor', 'metadata não promove a admin');

select set_config('t.vend', testes.criar_usuario('vendedor@exemplo.com', 'Vendedor Exemplo')::text, true);
select set_config('t.adm', testes.criar_usuario('admin@exemplo.com', 'Admin Exemplo', 'admin')::text, true);

select testes.entrar_como(current_setting('t.vend')::uuid);
select is((select count(*) from perfis), 1::bigint, 'vendedor vê só o próprio perfil');
select throws_ok($$insert into public.perfis(id) values (gen_random_uuid())$$, '42501');
select throws_ok($$update public.configuracao set cota_padrao = 9$$, '42501');
reset role;

select testes.entrar_como(current_setting('t.adm')::uuid);
select is((select count(*) from perfis where id in (current_setting('t.vend')::uuid, current_setting('t.adm')::uuid)), 2::bigint, 'admin vê os perfis');
reset role;

update public.perfis set ativo = false where id = current_setting('t.vend')::uuid;
select testes.entrar_como(current_setting('t.vend')::uuid);
select is((select count(*) from perfis), 0::bigint, 'desativado não vê perfis');
select is((select count(*) from cidades), 0::bigint, 'desativado não vê cidades');
reset role;

select is(private.inicio_do_dia('2026-10-29 02:30+00'), '2026-10-28 00:00-03'::timestamptz, 'virada do dia em Brasília');
select is(private.somar_dias_uteis('2026-11-06 10:00-03', 2), '2026-11-10 10:00-03'::timestamptz, 'sexta + 2 dias úteis = terça');
select is(private.somar_dias_uteis('2026-11-07 10:00-03', 1), '2026-11-09 10:00-03'::timestamptz, 'sábado + 1 = segunda');
select is(private.dias_uteis_entre('2026-11-06 18:00-03', '2026-11-10 09:00-03'), 2, 'dias úteis entre sexta e terça');

select is((select count(*) from etapas_funil), 6::bigint, 'seis etapas do funil');
select is((select preco_tabela from configuracao), 497.00, 'preço de tabela 497');

select is((select count(*) from unnest(array[
  'private.eu_admin()', 'private.eu_ativo()', 'private.exigir_ativo()', 'private.inicio_do_dia(timestamptz)',
  'private.somar_dias_uteis(timestamptz,int)', 'private.dias_uteis_entre(timestamptz,timestamptz)'
]) f where has_function_privilege('anon', f, 'execute')), 0::bigint, 'anon sem execute nas funções private');

select * from finish();
rollback;
