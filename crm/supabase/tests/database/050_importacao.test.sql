begin;
select plan(32);

select set_config('t.autor', testes.criar_usuario('importa1@exemplo.com', 'Admin Importa Exemplo', 'admin')::text, true);

-- item fictício; p_extra sobrescreve campos
create function pg_temp.item(p_nome text, p_place text, p_tel text, p_extra jsonb default '{}') returns jsonb
language sql as $$
  select jsonb_build_object(
    'origem_id', 'exemplo-' || p_nome, 'google_place_id', p_place, 'nome', p_nome,
    'cidade', 'Uberlândia', 'uf', 'MG', 'nicho', 'Pet shop', 'nota', 4.5, 'avaliacoes', 80, 'prioridade', 2,
    'telefones', case when p_tel is null then '[]'::jsonb
      else jsonb_build_array(jsonb_build_object('e164', p_tel, 'tipo', 'whatsapp', 'origem', 'google', 'principal', true)) end,
    'verificacao', jsonb_build_object('veredito', 'PODE_ABORDAR', 'evidencias', '[]'::jsonb,
      'verificado_em', '2026-10-28T12:00:00Z', 'ferramenta', 'teste'),
    'estado_inicial', 'no_poco') || p_extra;
$$;

-- importa como service_role e devolve "r1,r2,..."
create function pg_temp.imp(p_itens jsonb) returns text
language plpgsql as $$
declare r text;
begin
  perform set_config('role', 'service_role', true);
  select string_agg(x.resultado, ',' order by x.indice) into r
  from public.importar_leads(current_setting('t.autor')::uuid, p_itens) x;
  reset role;
  return r;
end;
$$;

-- criar e repetir
select is(pg_temp.imp(jsonb_build_array(
  pg_temp.item('Pet Imp A', 'exemplo-imp-a', '+5534900000061'),
  pg_temp.item('Pet Imp B', 'exemplo-imp-b', '+5534900000062'))), 'criado,criado', 'primeiro lote cria 2');
select is(pg_temp.imp(jsonb_build_array(
  pg_temp.item('Pet Imp A', 'exemplo-imp-a', '+5534900000061'),
  pg_temp.item('Pet Imp B', 'exemplo-imp-b', '+5534900000062'))), 'atualizado,atualizado', 'mesmo lote atualiza');
select is((select count(*)::int from public.leads where google_place_id in ('exemplo-imp-a', 'exemplo-imp-b')), 2, 'continuam 2 leads');
select is((select count(*)::int from public.telefones_lead t join public.leads l on l.id = t.lead_id
  where l.google_place_id like 'exemplo-imp-%'), 2, 'telefones não duplicam');
select is((select count(*)::int from public.verificacoes_site v join public.leads l on l.id = v.lead_id
  where l.google_place_id = 'exemplo-imp-a'), 1, 'verificação repetida não duplica');
select is((select veredito_atual from public.leads where google_place_id = 'exemplo-imp-a'), 'PODE_ABORDAR', 'veredito_atual gravado');
select is((select t.tipo from public.telefones_lead t join public.leads l on l.id = t.lead_id
  where l.google_place_id = 'exemplo-imp-a'), 'whatsapp', 'tipo vem do converter e é gravado como veio');
select is((select count(*)::int from public.eventos_lead e join public.leads l on l.id = e.lead_id
  where l.google_place_id = 'exemplo-imp-a' and e.tipo = 'importado' and e.autor_id = current_setting('t.autor')::uuid
    and e.dados ->> 'origem_id' = 'exemplo-Pet Imp A'), 2, 'evento importado com autor e origem_id');

-- lead sem place id, achado pelo telefone
insert into public.leads (nome, cidade_id, origem_id)
select 'Pet Imp Sem Place', c.id, 'exemplo-sem-place' from public.cidades c where c.nome = 'Uberlândia' and c.uf = 'MG';
insert into public.telefones_lead (lead_id, e164, tipo, principal)
select id, '+5534900000063', 'whatsapp', true from public.leads where origem_id = 'exemplo-sem-place';
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Sem Place', null, '+5534900000063'))), 'atualizado',
  'sem place id acha pelo telefone');
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Sem Place', 'exemplo-imp-c', '+5534900000063'))), 'atualizado',
  'com place id novo acha pelo telefone');
select is((select google_place_id from public.leads where origem_id = 'exemplo-sem-place'), 'exemplo-imp-c', 'grava o place id');
select is((select count(*)::int from public.leads where origem_id = 'exemplo-sem-place'), 1, 'sem duplicar');

-- bloqueios
insert into public.bloqueios (telefone_e164, motivo, origem) values ('+5534900000064', 'pediu_parar', 'teste');
insert into public.bloqueios (google_place_id, motivo, origem) values ('exemplo-imp-bloq', 'descarte', 'teste');
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Bloq Tel', 'exemplo-imp-d', '+5534900000064'))), 'bloqueado', 'telefone bloqueado');
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Bloq Place', 'exemplo-imp-bloq', '+5534900000065'))), 'bloqueado', 'place id bloqueado');
select is((select count(*)::int from public.leads where google_place_id in ('exemplo-imp-d', 'exemplo-imp-bloq')), 0, 'bloqueado não cria');

-- descartado nunca volta
insert into public.leads (nome, cidade_id, google_place_id, estado, motivo_fim, fim_em)
select 'Pet Imp Descartado', c.id, 'exemplo-imp-desc', 'descartado', 'tem_site', now()
from public.cidades c where c.nome = 'Uberlândia' and c.uf = 'MG';
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Descartado', 'exemplo-imp-desc', '+5534900000066'))), 'ja_descartado', 'descartado');
select is((select estado from public.leads where google_place_id = 'exemplo-imp-desc'), 'descartado', 'estado continua descartado');

-- verificar + WhatsApp novo volta para a fila
insert into public.leads (nome, cidade_id, google_place_id, estado)
select 'Pet Imp Verificar', c.id, 'exemplo-imp-ver', 'verificar' from public.cidades c where c.nome = 'Uberlândia' and c.uf = 'MG';
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Verificar', 'exemplo-imp-ver', '+5534900000067'))), 'atualizado', 'verificar atualiza');
select is((select estado from public.leads where google_place_id = 'exemplo-imp-ver'), 'no_poco', 'volta para no_poco');

-- cidade e nicho; grupo
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Cidade', 'exemplo-imp-e', '+5534900000068', '{"cidade":"Cidade Que Nao Existe"}'))),
  'invalido:cidade', 'cidade desconhecida');
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Nicho', 'exemplo-imp-f', '+5534900000069', '{"nicho":"Nicho Que Nao Existe"}'))),
  'criado', 'nicho desconhecido entra');
select ok((select nicho_id is null from public.leads where google_place_id = 'exemplo-imp-f'), 'nicho_id nulo');
select pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Filial', 'exemplo-imp-g', '+5534900000061')));
select ok((select l1.grupo is not null and l1.grupo = l2.grupo from public.leads l1, public.leads l2
  where l1.google_place_id = 'exemplo-imp-g' and l2.google_place_id = 'exemplo-imp-a'), 'mesmo telefone, place diferente: mesmo grupo');

-- verificação não duplica com timestamps diferentes
select pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp A', 'exemplo-imp-a', '+5534900000061',
  '{"verificacao":{"veredito":"PODE_ABORDAR","evidencias":[],"verificado_em":"2026-11-05T09:00:00Z","ferramenta":"teste"}}')));
select is((select count(*)::int from public.verificacoes_site v join public.leads l on l.id = v.lead_id
  where l.google_place_id = 'exemplo-imp-a'), 1, 'timestamp novo, mesmo veredito e ferramenta: 1 verificação');
select pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp A', 'exemplo-imp-a', '+5534900000061',
  '{"verificacao":{"veredito":"TEM_SITE","evidencias":[],"verificado_em":"2026-11-06T09:00:00Z","ferramenta":"teste"}}')));
select is((select count(*)::int from public.verificacoes_site v join public.leads l on l.id = v.lead_id
  where l.google_place_id = 'exemplo-imp-a'), 2, 'veredito diferente entra');

-- descartado sem place id, achado pelo telefone
insert into public.leads (nome, cidade_id, google_place_id, estado, motivo_fim, fim_em)
select 'Pet Imp Desc Tel', c.id, 'exemplo-imp-desc2', 'descartado', 'fechado', now()
from public.cidades c where c.nome = 'Uberlândia' and c.uf = 'MG';
insert into public.telefones_lead (lead_id, e164, tipo) select id, '+5534900000070', 'whatsapp' from public.leads where google_place_id = 'exemplo-imp-desc2';
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Desc Tel Novo', null, '+5534900000070'))), 'ja_descartado', 'sem place id, telefone de descartado');
select is((select count(*)::int from public.leads where nome = 'Pet Imp Desc Tel Novo'), 0, 'não cria lead novo');

-- descartado criado na importação recebe fim_por e fim_em
select is(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Nasce Desc', 'exemplo-imp-h', '+5534900000071',
  '{"estado_inicial":"descartado","motivo_fim":"tem_site"}'))), 'criado', 'cria descartado');
select ok((select fim_por = current_setting('t.autor')::uuid and fim_em is not null and estado = 'descartado'
  from public.leads where google_place_id = 'exemplo-imp-h'), 'fim_por e fim_em gravados');

-- erro por item traz o SQLSTATE
select ok(pg_temp.imp(jsonb_build_array(pg_temp.item('Pet Imp Erro', 'exemplo-imp-i', '+5534900000072', '{"nota":"abc"}'))) like 'invalido:erro:%',
  'erro por item traz SQLSTATE');

-- autor precisa ser admin ativo
select set_config('role', 'service_role', true);
select throws_ok($$select * from public.importar_leads(gen_random_uuid(), '[]'::jsonb)$$, 'P0001', 'Autor precisa ser um admin ativo.', 'autor desconhecido');
reset role;

-- permissão
select testes.entrar_como(current_setting('t.autor')::uuid);
select throws_ok($$select * from public.importar_leads(gen_random_uuid(), '[]'::jsonb)$$, '42501');

select * from finish();
rollback;
