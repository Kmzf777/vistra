begin;
select plan(63);

select set_config('t.v1', testes.criar_usuario('painel1@exemplo.com', 'Vendedor Um Exemplo')::text, true);
select set_config('t.v2', testes.criar_usuario('painel2@exemplo.com', 'Vendedor Dois Exemplo')::text, true);
select set_config('t.adm', testes.criar_usuario('painel-adm@exemplo.com', 'Admin Exemplo', 'admin')::text, true);

create function pg_temp.como(p_u text, p_sql text) returns text
language plpgsql as $$
declare r text;
begin
  perform testes.entrar_como(p_u::uuid);
  execute p_sql into r;
  reset role;
  return r;
end;
$$;
create function pg_temp.ag(p_v text, p_l text, p_acao text) returns text
language plpgsql as $$
declare r text;
begin
  perform testes.entrar_como(p_v::uuid);
  r := public.registrar_acao(p_l::uuid, p_acao);
  reset role;
  return r;
end;
$$;
-- uma coluna do painel, para um vendedor, vista pelo admin
create function pg_temp.col(p_col text, p_v text, p_desde text default null) returns text
language plpgsql as $$
declare r text;
begin
  perform testes.entrar_como(current_setting('t.adm')::uuid);
  execute format('select %I::text from public.painel_dono(%L::timestamptz) where vendedor_id = %L::uuid', p_col, p_desde, p_v) into r;
  reset role;
  return r;
end;
$$;

select set_config('t.l', testes.criar_lead_pronto('Pet Exemplo Painel L', '+5534900000301')::text, true);

-- resumo_fila e filtro de fila (só o que esta transação criou: Cidade Exemplo / Nicho Exemplo)
select is(pg_temp.como(current_setting('t.adm'),
  $$select prontos::text from public.resumo_fila() where cidade = 'Cidade Exemplo' and nicho = 'Nicho Exemplo'$$),
  '1', 'resumo_fila conta 1 pronto em Cidade Exemplo / Nicho Exemplo');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'), 'select count(*)::text from public.resumo_fila()'),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não vê o resumo da fila');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.definir_filtro_fila(%L, %L::uuid, false)::text', 'cidade', gen_random_uuid())),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não muda o filtro da fila');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.definir_filtro_fila(%L, %L::uuid, false)::text', 'bairro', gen_random_uuid())),
  'P0001', 'Escolha cidade ou nicho.', 'tipo de filtro inválido');
select pg_temp.como(current_setting('t.adm'), format('select public.definir_filtro_fila(%L, %L::uuid, false)::text', 'cidade',
  (select id from public.cidades where nome = 'Cidade Exemplo' and uf = 'EX')));
select is(pg_temp.como(current_setting('t.adm'),
  $$select count(*)::text from public.resumo_fila() where cidade = 'Cidade Exemplo' and nicho = 'Nicho Exemplo'$$),
  '0', 'cidade desligada some do resumo da fila');
select pg_temp.como(current_setting('t.adm'), format('select public.definir_filtro_fila(%L, %L::uuid, true)::text', 'cidade',
  (select id from public.cidades where nome = 'Cidade Exemplo' and uf = 'EX')));
select pg_temp.como(current_setting('t.adm'), format('select public.definir_filtro_fila(%L, %L::uuid, false)::text', 'nicho',
  (select id from public.nichos where nome = 'Nicho Exemplo')));
select is((select ativo from public.nichos where nome = 'Nicho Exemplo'), false, 'filtro desliga o nicho');
select pg_temp.como(current_setting('t.adm'), format('select public.definir_filtro_fila(%L, %L::uuid, true)::text', 'nicho',
  (select id from public.nichos where nome = 'Nicho Exemplo')));
select is(pg_temp.como(current_setting('t.adm'),
  $$select prontos::text from public.resumo_fila() where cidade = 'Cidade Exemplo' and nicho = 'Nicho Exemplo'$$),
  '1', 'religado volta ao resumo');

-- v1 recebe L e envia a abertura
update public.leads set estado = 'reservado', dono_id = current_setting('t.v1')::uuid, passo = 'abertura', reservado_em = now()
  where id = current_setting('t.l')::uuid;
select private.registrar_evento(current_setting('t.l')::uuid, current_setting('t.v1')::uuid, 'recebeu');
select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'abertura_enviada');

select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'), 'select count(*)::text from public.painel_dono(null)'),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não vê o painel');
select is(pg_temp.col('aberturas', current_setting('t.v1')), '1', 'painel: v1 tem 1 abertura');
select is(pg_temp.col('recebidos', current_setting('t.v1')), '1', 'painel: v1 tem 1 recebido');
select is(pg_temp.col('aberturas', current_setting('t.v2')), '0', 'painel: v2 tem 0 aberturas');
select is(pg_temp.col('nome', current_setting('t.v1')), 'Vendedor Um Exemplo', 'painel traz o nome');
select is(pg_temp.col('ativo', current_setting('t.v1')), 'true', 'painel traz o ativo');
select is(pg_temp.col('dias_sem_abertura', current_setting('t.v1')), '0', 'abertura de agora: 0 dias sem abertura');
select is(pg_temp.col('parado', current_setting('t.v1')), 'false', 'abertura de agora: não está parado');
select is(pg_temp.col('aberturas', current_setting('t.v1'), (now() + interval '1 hour')::text), '0', 'período no futuro não conta nada');
select is(pg_temp.col('aberturas', current_setting('t.v1'), (now() - interval '1 hour')::text), '1', 'período que cobre o evento conta');

-- reatribuir: o número fica com quem fez a ação
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.reatribuir_lead(%L::uuid, %L::uuid)::text', current_setting('t.l'), current_setting('t.v2'))),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não reatribui');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.reatribuir_lead(%L::uuid, %L::uuid)::text', current_setting('t.l'), gen_random_uuid())),
  'P0001', 'Escolha um vendedor ativo.', 'novo dono precisa existir');
select pg_temp.como(current_setting('t.adm'),
  format('select public.reatribuir_lead(%L::uuid, %L::uuid)::text', current_setting('t.l'), current_setting('t.v2')));
select is((select dono_id from public.leads where id = current_setting('t.l')::uuid), current_setting('t.v2')::uuid, 'lead passou para v2');
select is((select dados from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'reatribuido'),
  jsonb_build_object('de', current_setting('t.v1'), 'para', current_setting('t.v2')), 'evento reatribuido grava de e para');
select is(pg_temp.col('aberturas', current_setting('t.v1')), '1', 'depois de reatribuir, v1 segue com 1 abertura');
select is(pg_temp.col('aberturas', current_setting('t.v2')), '0', 'depois de reatribuir, v2 segue com 0');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.reatribuir_lead(%L::uuid, %L::uuid)::text', current_setting('t.l'), current_setting('t.v2'))),
  'P0001', 'Esse lead já está com essa pessoa.', 'reatribuir para quem já tem é recusado');

-- evento migrado não conta
select private.registrar_evento(current_setting('t.l')::uuid, current_setting('t.v1')::uuid, 'migrado');
select is(pg_temp.col('aberturas', current_setting('t.v1')) || pg_temp.col('recebidos', current_setting('t.v1')), '11',
  'evento migrado não muda os números');

-- parado: última abertura de 7 dias atrás (5 dias úteis)
update public.eventos_lead set criado_em = now() - interval '7 days'
  where lead_id = current_setting('t.l')::uuid and tipo = 'abertura_enviada';
select ok(pg_temp.col('dias_sem_abertura', current_setting('t.v1'))::int >= 3, 'dias úteis sem abertura passam de 3');
select is(pg_temp.col('parado', current_setting('t.v1')), 'true', 'v1 está parado');
select is(pg_temp.col('parado', current_setting('t.v2')), 'false', 'v2 recém-criado não está parado');
-- o admin ativo e sem atividade também aparece e pode ficar parado
select is(pg_temp.col('parado', current_setting('t.adm')), 'false', 'admin recém-criado aparece e não está parado');
update public.perfis set criado_em = now() - interval '7 days' where id = current_setting('t.adm')::uuid;
select is(pg_temp.col('parado', current_setting('t.adm')), 'true', 'admin ativo sem abertura fica parado');

-- comissão a receber e vendas: só com pago_em e sem repassado_em
select set_config('t.l3', testes.criar_lead_pronto('Pet Exemplo Painel L3', '+5534900000303')::text, true);
update public.leads set estado = 'encerrado', motivo_fim = 'venda', dono_id = current_setting('t.v1')::uuid,
  abertura_enviada_em = now(), fim_em = now() where id = current_setting('t.l3')::uuid;
insert into public.vendas (lead_id, vendedor_id, valor, forma_pagamento, fechado_em, comissao_pct, registrado_por)
values (current_setting('t.l3')::uuid, current_setting('t.v1')::uuid, 400, 'pix', current_date, 50, current_setting('t.v1')::uuid);
select is(pg_temp.col('vendas', current_setting('t.v1')), '1', 'painel conta a venda');
select is(pg_temp.col('comissao_a_receber', current_setting('t.v1')), '0', 'sem pagamento, nada a receber');
update public.vendas set pago_em = current_date where lead_id = current_setting('t.l3')::uuid;
select is(pg_temp.col('comissao_a_receber', current_setting('t.v1')), '200.00', 'paga e não repassada: 200 a receber');
update public.vendas set repassado_em = current_date where lead_id = current_setting('t.l3')::uuid;
select is(pg_temp.col('comissao_a_receber', current_setting('t.v1')), '0', 'repassada zera o a receber');

-- bloquear e descartar
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.bloquear(%L, %L, %L)::text', '12345', null, 'cliente')),
  'P0001', 'Telefone inválido.', 'bloquear recusa telefone fora do padrão');
select pg_temp.como(current_setting('t.adm'),
  format('select public.bloquear(%L, %L, %L)::text', '+5534900000399', 'exemplo-bloqueio', 'cliente'));
select is((select count(*)::int from public.bloqueios where telefone_e164 = '+5534900000399' and motivo = 'cliente'
  and criado_por = current_setting('t.adm')::uuid), 1, 'bloqueio por telefone gravado');
select is((select count(*)::int from public.bloqueios where google_place_id = 'exemplo-bloqueio'), 1, 'bloqueio por place id gravado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.bloquear(%L, %L, %L)::text', '+5534900000398', null, 'cliente')),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não bloqueia');

select set_config('t.l4', testes.criar_lead_pronto('Pet Exemplo Painel L4', '+5534900000304')::text, true);
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.descartar_lead(%L::uuid, %L)::text', current_setting('t.l4'), 'qualquer')),
  'P0001', 'Escolha o motivo.', 'descartar exige motivo válido');
select pg_temp.como(current_setting('t.adm'),
  format('select public.descartar_lead(%L::uuid, %L)::text', current_setting('t.l4'), 'lead_fraco'));
select is((select estado || ':' || motivo_fim from public.leads where id = current_setting('t.l4')::uuid), 'descartado:lead_fraco', 'lead descartado');
select ok(exists (select 1 from public.eventos_lead where lead_id = current_setting('t.l4')::uuid and tipo = 'descartou'
  and autor_id = current_setting('t.adm')::uuid), 'evento descartou');

-- configuração
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  'select public.atualizar_configuracao(497, 397, 50, 5, 2, 2)::text'),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não muda a configuração');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  'select public.atualizar_configuracao(0, 397, 50, 5, 2, 2)::text'),
  'P0001', 'Confira os valores da configuração.', 'preço zero é recusado');
select pg_temp.como(current_setting('t.adm'), 'select public.atualizar_configuracao(450, 350, 40, 6, 3, 4)::text');
select is((select preco_tabela::text || '/' || piso_referencia::text || '/' || comissao_pct::text || '/' || cota_padrao || '/'
  || dias_acompanhamento || '/' || dias_alerta_parado from public.configuracao), '450.00/350.00/40.00/6/3/4', 'configuração gravada');

-- desativar v1 (L2 em conversa, L5 reservado)
select set_config('t.l2', testes.criar_lead_pronto('Pet Exemplo Painel L2', '+5534900000302')::text, true);
update public.leads set estado = 'em_conversa', dono_id = current_setting('t.v1')::uuid, passo = 'resultado',
  abertura_enviada_em = now() where id = current_setting('t.l2')::uuid;
select set_config('t.l5', testes.criar_lead_pronto('Pet Exemplo Painel L5', '+5534900000305')::text, true);
update public.leads set estado = 'reservado', dono_id = current_setting('t.v1')::uuid, passo = 'abertura', reservado_em = now()
  where id = current_setting('t.l5')::uuid;

select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.definir_vendedor(%L::uuid, false, 5)::text', current_setting('t.v2'))),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não desativa ninguém');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.definir_vendedor(%L::uuid, false, 5)::text', current_setting('t.adm'))),
  'P0001', 'Você não pode desativar a si mesmo.', 'admin não se desativa');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.definir_vendedor(%L::uuid, true, 99)::text', current_setting('t.v1'))),
  'P0001', 'A cota fica entre 0 e 50.', 'cota fora do limite é recusada');
select pg_temp.como(current_setting('t.adm'),
  format('select public.definir_vendedor(%L::uuid, true, 8)::text', current_setting('t.v1')));
select is((select cota_diaria from public.perfis where id = current_setting('t.v1')::uuid), 8, 'cota por pessoa gravada');

select pg_temp.como(current_setting('t.adm'),
  format('select public.definir_vendedor(%L::uuid, false, 5)::text', current_setting('t.v1')));
select is((select dono_id from public.leads where id = current_setting('t.l2')::uuid), current_setting('t.adm')::uuid,
  'lead em conversa de v1 foi para o admin');
select is((select dados from public.eventos_lead where lead_id = current_setting('t.l2')::uuid and tipo = 'reatribuido'),
  jsonb_build_object('de', current_setting('t.v1'), 'para', current_setting('t.adm')), 'evento reatribuido ao desativar');
select is((select estado || ':' || coalesce(dono_id::text, 'sem') from public.leads where id = current_setting('t.l5')::uuid),
  'no_poco:sem', 'reservado de v1 voltou para a fila');
select is((select ativo from public.perfis where id = current_setting('t.v1')::uuid), false, 'v1 desativado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'), 'select public.proximo_lead()::text'),
  'P0001', 'Seu acesso foi desativado. Fale com o Kelwin.', 'v1 perde o acesso');
select is(pg_temp.col('parado', current_setting('t.v1')), 'false', 'desativado não aparece como parado');

-- editar nome, curso e artigo ("Sou o" / "Sou a") na tela de equipe
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v2'),
  format('select public.editar_perfil(%L::uuid, %L, %L, %L)::text', current_setting('t.v2'), 'Outro Nome', 'Direito', 'a')),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não edita perfil');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.editar_perfil(%L::uuid, %L, %L, %L)::text', current_setting('t.v2'), '  ', 'Direito', 'a')),
  'P0001', 'Informe o nome.', 'nome vazio é recusado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.editar_perfil(%L::uuid, %L, %L, %L)::text', current_setting('t.v2'), 'Ana Exemplo', '', 'a')),
  'P0001', 'Informe o curso.', 'curso vazio é recusado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.editar_perfil(%L::uuid, %L, %L, %L)::text', current_setting('t.v2'), 'Ana Exemplo', 'Direito', 'x')),
  'P0001', 'Escolha "Sou o" ou "Sou a".', 'artigo inválido é recusado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.editar_perfil(%L::uuid, %L, %L, %L)::text', gen_random_uuid(), 'Ana Exemplo', 'Direito', 'a')),
  'P0001', 'Pessoa não encontrada. Atualize a tela.', 'perfil inexistente é recusado');
select pg_temp.como(current_setting('t.adm'),
  format('select public.editar_perfil(%L::uuid, %L, %L, %L)::text', current_setting('t.v2'), ' Ana Exemplo ', ' Direito ', 'a'));
select is((select nome || '|' || curso || '|' || artigo from public.perfis where id = current_setting('t.v2')::uuid),
  'Ana Exemplo|Direito|a', 'admin grava nome, curso e artigo sem espaços nas pontas');
select ok(not has_function_privilege('anon', 'public.editar_perfil(uuid, text, text, text)', 'execute'), 'anon não executa editar_perfil');

select ok(has_function_privilege('authenticated', 'public.painel_dono(timestamptz)', 'execute'), 'authenticated executa painel_dono');
select ok(not has_function_privilege('anon', 'public.painel_dono(timestamptz)', 'execute'), 'anon não executa painel_dono');

select * from finish();
rollback;
