begin;
select plan(51);

select set_config('t.v1', testes.criar_usuario('funil1@exemplo.com', 'Vendedor Um Exemplo')::text, true);
select set_config('t.v2', testes.criar_usuario('funil2@exemplo.com', 'Vendedor Dois Exemplo')::text, true);
select set_config('t.adm', testes.criar_usuario('funil-adm@exemplo.com', 'Admin Exemplo', 'admin')::text, true);

-- executa um select escalar como um usuário e volta ao papel de dono
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
create function pg_temp.ag(p_v text, p_l text, p_acao text, p_msg bigint default null) returns text
language plpgsql as $$
declare r text;
begin
  perform testes.entrar_como(p_v::uuid);
  r := public.registrar_acao(p_l::uuid, p_acao, p_msg);
  reset role;
  return r;
end;
$$;
-- lead em conversa, direto na etapa pedida (atalho de preparação)
create function pg_temp.na_etapa(p_l text, p_v text, p_etapa text) returns void
language sql as $$
  update public.leads
  set estado = 'em_conversa', dono_id = p_v::uuid, passo = null, abertura_enviada_em = now(),
    etapa = p_etapa, etapa_desde = now(), ultima_atividade_em = now()
  where id = p_l::uuid;
$$;

-- L: do reservado até "quer ver a prévia", pelo fluxo real
select set_config('t.l', testes.criar_lead_pronto('Pet Exemplo L', '+5534900000201')::text, true);
update public.leads set estado = 'reservado', dono_id = current_setting('t.v1')::uuid, passo = 'abertura', reservado_em = now()
  where id = current_setting('t.l')::uuid;
select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'abertura_enviada');
select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'pessoa');
select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'principal_enviada',
  (select id from public.mensagens_lead where lead_id = current_setting('t.l')::uuid));
select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'quer_previa');
select set_config('t.ped', (select id::text from public.pedidos_previa where lead_id = current_setting('t.l')::uuid), true);

-- anexar_previa
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.anexar_previa(%L::uuid, %L, %L)::text', current_setting('t.ped'), 'https://exemplo.com/previa', 'https://exemplo.com/previa.pdf')),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não anexa prévia');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.anexar_previa(%L::uuid, %L, %L)::text', current_setting('t.ped'), 'http://exemplo.com/previa', 'https://exemplo.com/previa.pdf')),
  'P0001', 'Use um link https.', 'site em http é recusado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.anexar_previa(%L::uuid, %L, %L)::text', current_setting('t.ped'), 'https://exemplo.com/previa', 'ftp://exemplo.com/previa.pdf')),
  'P0001', 'Use um link https.', 'pdf fora de https é recusado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.anexar_previa(%L::uuid, %L, %L)::text', current_setting('t.ped'), 'javascript:alert(1)', 'https://exemplo.com/previa.pdf')),
  'P0001', 'Use um link https.', 'javascript: é recusado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.anexar_previa(%L::uuid, %L, %L)::text', current_setting('t.ped'), 'https://', 'https://exemplo.com/previa.pdf')),
  'P0001', 'Use um link https.', 'https sem endereço é recusado');
select is((select status from public.pedidos_previa where id = current_setting('t.ped')::uuid), 'pendente', 'recusas não mexem no pedido');

select pg_temp.como(current_setting('t.adm'),
  format('select public.anexar_previa(%L::uuid, %L, %L)::text', current_setting('t.ped'), 'https://exemplo.com/previa', 'https://exemplo.com/previa.pdf'));
select is((select etapa from public.leads where id = current_setting('t.l')::uuid), 'previa_pronta', 'lead em previa_pronta');
select is((select status || ':' || site_url || ':' || pdf_url from public.pedidos_previa where id = current_setting('t.ped')::uuid),
  'pronta:https://exemplo.com/previa:https://exemplo.com/previa.pdf', 'pedido pronta com os links');
select ok((select pronta_em is not null and pronta_por = current_setting('t.adm')::uuid from public.pedidos_previa
  where id = current_setting('t.ped')::uuid), 'pronta_em e pronta_por gravados');
select ok(exists (select 1 from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'previa_pronta'
  and autor_id = current_setting('t.adm')::uuid), 'evento previa_pronta');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.anexar_previa(%L::uuid, %L, %L)::text', current_setting('t.ped'), 'https://exemplo.com/outra', 'https://exemplo.com/outra.pdf')),
  'P0001', 'Esse pedido já foi atendido. Atualize a tela.', 'segundo anexo no mesmo pedido é recusado');

-- venda e mover_etapa antes de enviar a prévia
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.registrar_venda(%L::uuid, 350, %L, %L)::text', current_setting('t.l'), 'pix', '2026-11-10')),
  'P0001', 'A venda só se registra depois de enviar a prévia.', 'venda com a prévia ainda não enviada é recusada');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.mover_etapa(%L::uuid, %L)::text', current_setting('t.l'), 'negociando')),
  'P0001', 'Esse movimento não vale agora. Atualize a tela.', 'de previa_pronta não vai direto a negociando');

select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'previa_enviada');
select is((select etapa from public.leads where id = current_setting('t.l')::uuid), 'previa_enviada', 'v1 enviou a prévia');

-- mover_etapa
select pg_temp.como(current_setting('t.v1'), format('select public.mover_etapa(%L::uuid, %L)::text', current_setting('t.l'), 'negociando'));
select is((select etapa from public.leads where id = current_setting('t.l')::uuid), 'negociando', 'previa_enviada vai a negociando');
select ok((select etapa_desde > now() - interval '1 minute' and estado = 'em_conversa' from public.leads
  where id = current_setting('t.l')::uuid), 'etapa_desde renovado e lead segue em conversa');
select is((select dados from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'etapa'
  order by id desc limit 1), '{"de": "previa_enviada", "para": "negociando"}'::jsonb, 'evento etapa grava de e para');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.mover_etapa(%L::uuid, %L)::text', current_setting('t.l'), 'fechou')),
  'P0001', 'A venda se registra pelo botão Fechou.', 'fechou não passa por mover_etapa');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.mover_etapa(%L::uuid, %L)::text', current_setting('t.l'), 'previa_pronta')),
  'P0001', 'Esse movimento não vale agora. Atualize a tela.', 'voltar etapa é recusado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v2'),
  format('select public.mover_etapa(%L::uuid, %L)::text', current_setting('t.l'), 'perdeu')),
  'P0001', 'Esse lead não está com você.', 'outro vendedor não move a etapa');

-- registrar_venda
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v2'),
  format('select public.registrar_venda(%L::uuid, 350, %L, %L)::text', current_setting('t.l'), 'pix', '2026-11-10')),
  'P0001', 'Esse lead não está com você.', 'outro vendedor não registra a venda');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.registrar_venda(%L::uuid, 0, %L, %L)::text', current_setting('t.l'), 'pix', '2026-11-10')),
  'P0001', 'Informe o valor da venda.', 'valor zero é recusado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.registrar_venda(%L::uuid, 350, %L, %L)::text', current_setting('t.l'), 'cheque', '2026-11-10')),
  'P0001', 'Escolha a forma de pagamento.', 'forma inválida é recusada');
select set_config('t.venda', pg_temp.como(current_setting('t.v1'),
  format('select public.registrar_venda(%L::uuid, 350, %L, %L)::text', current_setting('t.l'), 'pix', '2026-11-10')), true);
select ok(current_setting('t.venda') ~ '^[0-9a-f-]{36}$', 'registrar_venda devolve o id');
select is((select comissao from public.vendas where id = current_setting('t.venda')::uuid), 175.00::numeric, 'comissão de 350 a 50% é 175,00');
select is((select comissao_pct from public.vendas where id = current_setting('t.venda')::uuid), 50.00::numeric, 'comissao_pct 50 vem da configuração');
select is((select etapa || ':' || estado || ':' || motivo_fim from public.leads where id = current_setting('t.l')::uuid),
  'fechou:encerrado:venda', 'lead fechou e encerrou');
select ok((select fim_em is not null and fim_por = current_setting('t.v1')::uuid from public.leads
  where id = current_setting('t.l')::uuid), 'fim_em e fim_por gravados');
select ok((select vendedor_id = current_setting('t.v1')::uuid and registrado_por = current_setting('t.v1')::uuid
  and fechado_em = date '2026-11-10' and forma_pagamento = 'pix' from public.vendas where id = current_setting('t.venda')::uuid),
  'venda guarda vendedor, registrador, data e forma');
select ok(exists (select 1 from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'venda'), 'evento venda');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.registrar_venda(%L::uuid, 350, %L, %L)::text', current_setting('t.l'), 'pix', '2026-11-10')),
  'P0001', 'A venda só se registra depois de enviar a prévia.', 'segunda venda do mesmo lead é recusada');

update public.configuracao set comissao_pct = 40;
select is((select comissao from public.vendas where id = current_setting('t.venda')::uuid), 175.00::numeric,
  'mudar a configuração depois não mexe na venda');

-- leitura: v2 não vê venda alheia
select testes.entrar_como(current_setting('t.v2')::uuid);
select is((select count(*) from public.vendas), 0::bigint, 'v2 não vê a venda de v1');
reset role;
select testes.entrar_como(current_setting('t.v1')::uuid);
select is((select count(*) from public.vendas), 1::bigint, 'v1 vê a própria venda');
reset role;
select testes.entrar_como(current_setting('t.adm')::uuid);
select is((select count(*) from public.vendas), 1::bigint, 'admin vê a venda');
reset role;

-- comissão do perfil vale mais que a da configuração; abaixo do piso passa sem aviso
update public.perfis set comissao_pct = 30 where id = current_setting('t.v1')::uuid;
select set_config('t.n', testes.criar_lead_pronto('Pet Exemplo N', '+5534900000202')::text, true);
select pg_temp.na_etapa(current_setting('t.n'), current_setting('t.v1'), 'previa_enviada');
select set_config('t.venda2', pg_temp.como(current_setting('t.v1'),
  format('select public.registrar_venda(%L::uuid, 300, %L, null)::text', current_setting('t.n'), 'boleto')), true);
select is((select comissao_pct || ':' || comissao from public.vendas where id = current_setting('t.venda2')::uuid), '30.00:90.00',
  'comissão do perfil (30%) e venda abaixo do piso passam');
select is((select fechado_em from public.vendas where id = current_setting('t.venda2')::uuid),
  (now() at time zone 'America/Sao_Paulo')::date, 'sem data, fechado_em é hoje em Brasília');

-- pagamento e repasse
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.marcar_comissao_repassada(%L::uuid, %L)::text', current_setting('t.venda'), '2026-11-20')),
  'P0001', 'Marque o pagamento antes do repasse.', 'repasse antes do pagamento é recusado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.marcar_venda_paga(%L::uuid, %L)::text', current_setting('t.venda'), '2026-11-15')),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não marca pagamento');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.marcar_comissao_repassada(%L::uuid, %L)::text', current_setting('t.venda'), '2026-11-20')),
  'P0001', 'Só o admin pode fazer isso.', 'vendedor não marca repasse');
select pg_temp.como(current_setting('t.adm'), format('select public.marcar_venda_paga(%L::uuid, %L)::text', current_setting('t.venda'), '2026-11-15'));
select is((select pago_em from public.vendas where id = current_setting('t.venda')::uuid), date '2026-11-15', 'pago_em gravado');
select pg_temp.como(current_setting('t.adm'), format('select public.marcar_comissao_repassada(%L::uuid, %L)::text', current_setting('t.venda'), '2026-11-20'));
select is((select repassado_em from public.vendas where id = current_setting('t.venda')::uuid), date '2026-11-20', 'repassado_em gravado');

-- perdeu: encerra e o pedido pendente não aceita mais anexo
select set_config('t.m', testes.criar_lead_pronto('Pet Exemplo M', '+5534900000203')::text, true);
select pg_temp.na_etapa(current_setting('t.m'), current_setting('t.v1'), 'previa_pedida');
insert into public.pedidos_previa (lead_id, vendedor_id, status) values (current_setting('t.m')::uuid, current_setting('t.v1')::uuid, 'pendente');
select pg_temp.como(current_setting('t.v1'), format('select public.mover_etapa(%L::uuid, %L)::text', current_setting('t.m'), 'perdeu'));
select is((select etapa || ':' || estado || ':' || motivo_fim from public.leads where id = current_setting('t.m')::uuid),
  'perdeu:encerrado:perdeu', 'mover para perdeu encerra com motivo perdeu');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.adm'),
  format('select public.anexar_previa(%L::uuid, %L, %L)::text',
    (select id from public.pedidos_previa where lead_id = current_setting('t.m')::uuid), 'https://exemplo.com/p', 'https://exemplo.com/p.pdf')),
  'P0001', 'Esse pedido não vale mais. Atualize a tela.', 'lead perdido não recebe prévia');

-- salvar_contato
select set_config('t.c', pg_temp.como(current_setting('t.v1'),
  format('select public.salvar_contato(%L::uuid, %L, %L, %L)::text', current_setting('t.n'), 'Contato Exemplo', 'dono', '+5534900000299')), true);
select ok(exists (select 1 from public.contatos where id = current_setting('t.c')::uuid and telefone_e164 = '+5534900000299'
  and criado_por = current_setting('t.v1')::uuid), 'contato salvo');
select ok(exists (select 1 from public.eventos_lead where lead_id = current_setting('t.n')::uuid and tipo = 'contato'), 'evento contato');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v1'),
  format('select public.salvar_contato(%L::uuid, %L, %L, %L)::text', current_setting('t.n'), 'Contato Exemplo', 'dono', '34900000299')),
  'P0001', 'Telefone inválido.', 'telefone fora do formato E.164 é recusado');
select throws_ok(format($$select pg_temp.como(%L, %L)$$, current_setting('t.v2'),
  format('select public.salvar_contato(%L::uuid, %L, %L, %L)::text', current_setting('t.n'), 'Contato Exemplo', 'dono', '+5534900000299')),
  'P0001', 'Esse lead não está com você.', 'contato em lead alheio é recusado');

-- privilégios
select ok(not has_function_privilege('anon', 'public.registrar_venda(uuid,numeric,text,date)', 'execute'), 'anon não executa registrar_venda');
select ok(has_function_privilege('authenticated', 'public.anexar_previa(uuid,text,text)', 'execute'), 'authenticated executa anexar_previa');
select ok(not has_table_privilege('authenticated', 'public.vendas', 'insert'), 'authenticated não insere em vendas');

select * from finish();
rollback;
