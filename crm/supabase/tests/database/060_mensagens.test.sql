begin;
select plan(25);

select set_config('t.autor', testes.criar_usuario('msg1@exemplo.com', 'Admin Mensagens Exemplo', 'admin')::text, true);
select set_config('t.vend', testes.criar_usuario('msg2@exemplo.com', 'Vendedor Mensagens Exemplo')::text, true);

update public.cidades set ativa = true where nome = 'Uberlândia' and uf = 'MG';

-- lead só com telefone fixo, verificado, sem mensagem
insert into public.leads (id, nome, cidade_id, google_place_id, origem_id)
select gen_random_uuid(), 'Pet Msg Exemplo', c.id, 'exemplo-msg-a', 'exemplo-msg-a-origem'
from public.cidades c where c.nome = 'Uberlândia' and c.uf = 'MG';
select set_config('t.l', (select id::text from public.leads where google_place_id = 'exemplo-msg-a'), true);
insert into public.telefones_lead (lead_id, e164, tipo, principal)
values (current_setting('t.l')::uuid, '+553430000001', 'fixo', true);
insert into public.verificacoes_site (lead_id, veredito, ferramenta)
values (current_setting('t.l')::uuid, 'PODE_ABORDAR', 'teste');
insert into public.modelos_mensagem (nicho_id, tipo, rotulo, texto)
select null, 'abertura', 'teste-msg', 'Olá [saudacao]'
where not exists (select 1 from public.modelos_mensagem where nicho_id is null and tipo = 'abertura' and ativo);

-- item fictício; p_extra sobrescreve campos
create function pg_temp.item(p_lead jsonb, p_extra jsonb default '{}') returns jsonb
language sql as $$
  select jsonb_build_object('lead', p_lead, 'modelo', 'modelo-teste',
    'partes', jsonb_build_array('que bom falar com você! Sou [nome].', 'só não achei um site de vocês.', 'Quer ver?'))
    || p_extra;
$$;

create function pg_temp.imp(p_itens jsonb) returns text
language plpgsql as $$
declare r text;
begin
  perform set_config('role', 'service_role', true);
  select string_agg(x.resultado, ',' order by x.indice) into r
  from public.importar_mensagens(current_setting('t.autor')::uuid, p_itens) x;
  reset role;
  return r;
end;
$$;

-- duas importações do mesmo lead
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('{"google_place_id":"exemplo-msg-a"}'))), 'aprovada', 'primeira importação aprova');
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('{"google_place_id":"exemplo-msg-a"}'))), 'aprovada', 'segunda importação aprova');
select is((select status from public.mensagens_lead where lead_id = current_setting('t.l')::uuid and versao = 1), 'substituida', 'versão 1 substituída');
select is((select status from public.mensagens_lead where lead_id = current_setting('t.l')::uuid and versao = 2), 'aprovada', 'versão 2 aprovada');
select is((select count(*)::int from public.mensagens_lead where lead_id = current_setting('t.l')::uuid and status = 'aprovada'), 1, 'uma aprovada só');
select ok((select aprovada_em is not null and modelo = 'modelo-teste' and autor_id = current_setting('t.autor')::uuid
  from public.mensagens_lead where lead_id = current_setting('t.l')::uuid and versao = 2), 'aprovada_em, modelo e autor gravados');

-- achar por origem_id e por telefone
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('{"origem_id":"exemplo-msg-a-origem"}'))), 'aprovada', 'acha por origem_id');
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('{"telefone":"+553430000001"}'))), 'aprovada', 'acha por telefone');
select is((select max(versao) from public.mensagens_lead where lead_id = current_setting('t.l')::uuid), 4, 'versões seguem 1..4');

-- inválidos e desconhecido
select ok((pg_temp.imp(jsonb_build_array(pg_temp.item('{"google_place_id":"exemplo-msg-a"}',
  jsonb_build_object('partes', jsonb_build_array('a', 'b', 'c', 'd')))))) like 'invalida:%', '4 partes é inválida');
select ok((pg_temp.imp(jsonb_build_array(pg_temp.item('{"google_place_id":"exemplo-msg-a"}',
  jsonb_build_object('partes', jsonb_build_array('uma só')))))) like 'invalida:%', '1 parte é inválida');
select ok((pg_temp.imp(jsonb_build_array(pg_temp.item('{"google_place_id":"exemplo-msg-a"}',
  jsonb_build_object('partes', jsonb_build_array(repeat('x', 400), repeat('y', 300))))))) like 'invalida:%', 'mais de 650 é inválida');
select is((select count(*)::int from public.mensagens_lead where lead_id = current_setting('t.l')::uuid), 4, 'inválidas não gravam');
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('{"google_place_id":"exemplo-msg-nao-existe"}'))), 'lead_nao_encontrado', 'lead desconhecido');
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('{}'))), 'lead_nao_encontrado', 'sem identificador do lead');
select ok((pg_temp.imp(jsonb_build_array(pg_temp.item('{"google_place_id":"exemplo-msg-a"}',
  '{"whatsapp":{"numero":"abc","origem":"bio"}}')))) like 'invalida:%', 'whatsapp com número inválido');

-- whatsapp num lead que só tinha fixo
select ok(not private.lead_pronto(current_setting('t.l')::uuid), 'antes: sem WhatsApp, não está pronto');
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('{"google_place_id":"exemplo-msg-a"}',
  '{"whatsapp":{"numero":"+5534900000081","origem":"bio do Instagram"}}'))), 'aprovada', 'importa com whatsapp');
select is((select tipo || ':' || principal::text || ':' || origem from public.telefones_lead
  where lead_id = current_setting('t.l')::uuid and e164 = '+5534900000081'), 'whatsapp:true:bio do Instagram', 'whatsapp principal criado');
select is((select count(*)::int from public.telefones_lead where lead_id = current_setting('t.l')::uuid and principal), 1, 'só um principal');
select ok(private.lead_pronto(current_setting('t.l')::uuid), 'depois: o lead está pronto');

-- modelos
create function pg_temp.imp_modelos(p_nichos jsonb, p_modelos jsonb) returns int
language plpgsql as $$
declare r int;
begin
  perform set_config('role', 'service_role', true);
  select public.importar_modelos(current_setting('t.autor')::uuid, p_nichos, p_modelos) into r;
  reset role;
  return r;
end;
$$;
select is(pg_temp.imp_modelos('[]', '[{"nicho":null,"tipo":"robo","rotulo":"menu-x","texto":"um"},{"nicho":null,"tipo":"robo","rotulo":"assunto-x","texto":"dois"}]'), 2,
  'importar_modelos devolve quantos inseriu');
select is((select count(*)::int from public.modelos_mensagem where tipo = 'robo' and rotulo in ('menu-x', 'assunto-x') and ativo), 2, 'dois robôs de rótulos diferentes ficam ativos');
select pg_temp.imp_modelos('[]', '[{"nicho":null,"tipo":"robo","rotulo":"menu-x","texto":"um novo"}]');
select is((select count(*)::int from public.modelos_mensagem where tipo = 'robo' and rotulo = 'menu-x' and ativo), 1, 'reimportar o mesmo rótulo deixa 1 ativo');

-- permissão
select testes.entrar_como(current_setting('t.vend')::uuid);
select throws_ok($$select * from public.importar_mensagens(gen_random_uuid(), '[]'::jsonb)$$, '42501');

select * from finish();
rollback;
