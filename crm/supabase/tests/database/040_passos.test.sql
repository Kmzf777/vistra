begin;
select plan(76);

-- isola a fila: só a Cidade Exemplo fica ativa (vale dentro desta transação, que termina em rollback)
insert into public.cidades (nome, uf, ativa) values ('Cidade Exemplo', 'EX', true) on conflict (nome, uf) do update set ativa = true;
update public.cidades set ativa = false where not (nome = 'Cidade Exemplo' and uf = 'EX');

select set_config('t.v1', testes.criar_usuario('passos1@exemplo.com', 'Vendedor Um Exemplo')::text, true);
select set_config('t.v2', testes.criar_usuario('passos2@exemplo.com', 'Vendedor Dois Exemplo')::text, true);
select set_config('t.v3', testes.criar_usuario('passos3@exemplo.com', 'Vendedor Tres Exemplo')::text, true);
select set_config('t.v4', testes.criar_usuario('passos4@exemplo.com', 'Vendedor Quatro Exemplo')::text, true);
select set_config('t.v5', testes.criar_usuario('passos5@exemplo.com', 'Vendedor Cinco Exemplo')::text, true);

-- ajudantes: agir como vendedor e reservar um lead à mão
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
create function pg_temp.reservar(p_l text, p_v text) returns void
language sql as $$
  update public.leads set estado = 'reservado', dono_id = p_v::uuid, passo = 'abertura', reservado_em = now()
  where id = p_l::uuid;
$$;

-- caminho principal: L é o único pronto e v1 o recebe pela fila
select set_config('t.l', testes.criar_lead_pronto('Pet Exemplo L', '+5534900000101')::text, true);
select testes.entrar_como(current_setting('t.v1')::uuid);
select is(public.proximo_lead(), current_setting('t.l')::uuid, 'v1 recebe L da fila');
reset role;
-- M existe só para ter uma mensagem de outro lead
select set_config('t.m', testes.criar_lead_pronto('Pet Exemplo M', '+5534900000109')::text, true);

select is(pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'abertura_enviada'), null, 'abertura devolve null');
select is((select estado || ':' || passo from public.leads where id = current_setting('t.l')::uuid),
  'em_conversa:quem_respondeu', 'abertura_enviada leva a quem_respondeu');
select throws_ok(format($$select pg_temp.ag(%L, %L, 'abertura_enviada')$$, current_setting('t.v1'), current_setting('t.l')),
  'P0001', 'Esse passo já foi registrado ou não vale agora. Atualize a tela.', 'segunda abertura é recusada');
select is((select count(*) from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'abertura_enviada'),
  1::bigint, 'toque duplo grava um evento só');
select testes.entrar_como(current_setting('t.v1')::uuid);
select is((select abertas_hoje from public.minha_cota()), 1, 'a cota conta uma vez');
reset role;

select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'robo');
select is((select passo from public.leads where id = current_setting('t.l')::uuid), 'robo', 'robo');
select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'pessoa');
select is((select passo from public.leads where id = current_setting('t.l')::uuid), 'principal', 'pessoa leva a principal');

select throws_ok(format($$select pg_temp.ag(%L, %L, 'principal_enviada', %s)$$, current_setting('t.v1'), current_setting('t.l'),
  (select id from public.mensagens_lead where lead_id = current_setting('t.m')::uuid)),
  'P0001', 'Essa não é a mensagem aprovada deste lead. Atualize a tela.', 'mensagem de outro lead é recusada');
select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'principal_enviada',
  (select id from public.mensagens_lead where lead_id = current_setting('t.l')::uuid));
select is((select passo from public.leads where id = current_setting('t.l')::uuid), 'resultado', 'principal leva a resultado');
select ok((select mensagem_id is not null from public.eventos_lead
  where lead_id = current_setting('t.l')::uuid and tipo = 'principal_enviada'), 'evento principal_enviada tem mensagem_id');
select ok((select principal_enviada_em is not null from public.leads where id = current_setting('t.l')::uuid), 'principal_enviada_em gravado');

select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'perguntou');
select is((select passo from public.leads where id = current_setting('t.l')::uuid), 'resultado', 'perguntou não muda o passo');
select ok(exists (select 1 from public.eventos_lead where lead_id = current_setting('t.l')::uuid and tipo = 'perguntou'), 'evento perguntou');

select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'sem_resposta');
select is((select passo from public.leads where id = current_setting('t.l')::uuid), 'acompanhamento', 'sem_resposta leva a acompanhamento');
select ok((select proximo_passo_em > now() from public.leads where id = current_setting('t.l')::uuid), 'prazo do acompanhamento no futuro');
select throws_like(format($$select pg_temp.ag(%L, %L, 'acompanhamento_enviado')$$, current_setting('t.v1'), current_setting('t.l')),
  'O acompanhamento é só a partir de %', 'acompanhamento antes do prazo é recusado');
update public.leads set proximo_passo_em = now() - interval '1 hour' where id = current_setting('t.l')::uuid;
select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'acompanhamento_enviado');
select is((select passo from public.leads where id = current_setting('t.l')::uuid), 'resultado', 'acompanhamento enviado volta ao resultado');
select ok((select acompanhamento_enviado_em is not null and proximo_passo_em is null from public.leads
  where id = current_setting('t.l')::uuid), 'acompanhamento_enviado_em gravado');
select pg_temp.ag(current_setting('t.v1'), current_setting('t.l'), 'sem_resposta');
select is((select estado || ':' || motivo_fim || ':' || coalesce(passo, 'nulo') from public.leads where id = current_setting('t.l')::uuid),
  'encerrado:sem_resposta:nulo', 'segundo sem_resposta encerra');
select ok((select fim_em is not null and fim_por = current_setting('t.v1')::uuid from public.leads
  where id = current_setting('t.l')::uuid), 'encerrar grava fim_em e fim_por');

-- pediu_parar com irmão de mesmo número
select set_config('t.p', testes.criar_lead_pronto('Pet Exemplo P', '+5534900000102')::text, true);
select set_config('t.l2', testes.criar_lead_pronto('Pet Exemplo L2', '+5534900000102')::text, true);
select ok(private.lead_pronto(current_setting('t.l2')::uuid), 'irmão L2 está pronto antes');
select pg_temp.reservar(current_setting('t.p'), current_setting('t.v1'));
select pg_temp.ag(current_setting('t.v1'), current_setting('t.p'), 'abertura_enviada');
select pg_temp.ag(current_setting('t.v1'), current_setting('t.p'), 'pediu_parar');
select is((select estado || ':' || motivo_fim from public.leads where id = current_setting('t.p')::uuid),
  'encerrado:pediu_parar', 'pediu_parar encerra');
select ok(exists (select 1 from public.bloqueios where telefone_e164 = '+5534900000102' and motivo = 'pediu_parar'), 'telefone bloqueado');
select ok(exists (select 1 from public.bloqueios b join public.leads l on l.google_place_id = b.google_place_id
  where l.id = current_setting('t.p')::uuid), 'place id bloqueado');
select ok(not private.lead_pronto(current_setting('t.l2')::uuid), 'irmão com o mesmo número deixa de estar pronto');
select ok(exists (select 1 from public.eventos_lead where lead_id = current_setting('t.p')::uuid and tipo = 'bloqueou'), 'evento bloqueou');

-- numero_errado com dois WhatsApp
select set_config('t.n', testes.criar_lead_pronto('Pet Exemplo N', '+5534900000103')::text, true);
insert into public.telefones_lead (lead_id, e164, tipo, principal) values (current_setting('t.n')::uuid, '+5534900000104', 'whatsapp', false);
select pg_temp.reservar(current_setting('t.n'), current_setting('t.v2'));
select pg_temp.ag(current_setting('t.v2'), current_setting('t.n'), 'abertura_enviada');
select pg_temp.ag(current_setting('t.v2'), current_setting('t.n'), 'numero_errado');
select is((select estado || ':' || passo from public.leads where id = current_setting('t.n')::uuid), 'em_conversa:abertura',
  'sobrou outro WhatsApp, volta para abertura');
select ok((select invalido_em is not null from public.telefones_lead where e164 = '+5534900000103'), 'primeiro telefone inválido');
select pg_temp.ag(current_setting('t.v2'), current_setting('t.n'), 'abertura_enviada');
select is((select count(*) from public.eventos_lead where lead_id = current_setting('t.n')::uuid and tipo = 'abertura_enviada'),
  2::bigint, 'abertura para o outro número conta de novo');
select pg_temp.ag(current_setting('t.v2'), current_setting('t.n'), 'numero_errado');
select is((select estado || ':' || coalesce(dono_id::text, 'nulo') || ':' || coalesce(passo, 'nulo') from public.leads
  where id = current_setting('t.n')::uuid), 'verificar:nulo:nulo', 'sem WhatsApp sobrando vai para verificar');

-- numero_errado com um WhatsApp só, direto da reserva
select set_config('t.s', testes.criar_lead_pronto('Pet Exemplo S', '+5534900000105')::text, true);
select pg_temp.reservar(current_setting('t.s'), current_setting('t.v2'));
select pg_temp.ag(current_setting('t.v2'), current_setting('t.s'), 'numero_errado');
select is((select estado || ':' || coalesce(dono_id::text, 'nulo') || ':' || coalesce(reservado_em::text, 'nulo') from public.leads
  where id = current_setting('t.s')::uuid), 'verificar:nulo:nulo', 'um WhatsApp só, vai para verificar');

-- telefone bloqueado depois da reserva
select set_config('t.b', testes.criar_lead_pronto('Pet Exemplo B', '+5534900000106')::text, true);
select pg_temp.reservar(current_setting('t.b'), current_setting('t.v3'));
insert into public.bloqueios (telefone_e164, motivo, origem) values ('+5534900000106', 'pediu_parar', 'teste');
select is(pg_temp.ag(current_setting('t.v3'), current_setting('t.b'), 'abertura_enviada'),
  'Esse número pediu para não ser chamado. O lead saiu da sua lista.', 'bloqueado depois da reserva devolve o recado');
select is((select estado || ':' || motivo_fim from public.leads where id = current_setting('t.b')::uuid), 'descartado:pediu_parar',
  'lead fica descartado');
select is((select count(*) from public.eventos_lead where lead_id = current_setting('t.b')::uuid and tipo = 'abertura_enviada'),
  0::bigint, 'sem evento de abertura');

-- prévia
select set_config('t.q', testes.criar_lead_pronto('Pet Exemplo Q', '+5534900000107')::text, true);
select pg_temp.reservar(current_setting('t.q'), current_setting('t.v4'));
select pg_temp.ag(current_setting('t.v4'), current_setting('t.q'), 'abertura_enviada');
select pg_temp.ag(current_setting('t.v4'), current_setting('t.q'), 'pessoa');
select pg_temp.ag(current_setting('t.v4'), current_setting('t.q'), 'principal_enviada',
  (select id from public.mensagens_lead where lead_id = current_setting('t.q')::uuid));
select throws_ok(format($$select pg_temp.ag(%L, %L, 'perguntou')$$, current_setting('t.v5'), current_setting('t.q')),
  'P0001', 'Esse lead não está com você.', 'outro vendedor não age no lead alheio');
select pg_temp.ag(current_setting('t.v4'), current_setting('t.q'), 'quer_previa');
select is((select etapa from public.leads where id = current_setting('t.q')::uuid), 'previa_pedida', 'etapa previa_pedida');
select is((select count(*) from public.pedidos_previa where lead_id = current_setting('t.q')::uuid and status = 'pendente'),
  1::bigint, 'um pedido pendente');
select throws_ok(format($$select pg_temp.ag(%L, %L, 'previa_enviada')$$, current_setting('t.v4'), current_setting('t.q')),
  'P0001', 'Esse passo já foi registrado ou não vale agora. Atualize a tela.', 'previa_enviada exige previa_pronta');
update public.leads set etapa = 'previa_pronta' where id = current_setting('t.q')::uuid;
update public.pedidos_previa set status = 'pronta', pronta_em = now() where lead_id = current_setting('t.q')::uuid;
select pg_temp.ag(current_setting('t.v4'), current_setting('t.q'), 'previa_enviada');
select is((select etapa from public.leads where id = current_setting('t.q')::uuid), 'previa_enviada', 'etapa previa_enviada');
select is((select status from public.pedidos_previa where lead_id = current_setting('t.q')::uuid), 'enviada', 'pedido enviado');
select pg_temp.ag(current_setting('t.v4'), current_setting('t.q'), 'pediu_parar');
select is((select etapa from public.leads where id = current_setting('t.q')::uuid), 'perdeu', 'pediu_parar com etapa vira perdeu');

-- bloqueio depois da reserva com dois WhatsApp: o principal bloqueado não pode trocar de número em silêncio
select set_config('t.w', testes.criar_lead_pronto('Pet Exemplo W', '+5534900000111')::text, true);
insert into public.telefones_lead (lead_id, e164, tipo, principal) values (current_setting('t.w')::uuid, '+5534900000112', 'whatsapp', false);
select pg_temp.reservar(current_setting('t.w'), current_setting('t.v5'));
insert into public.bloqueios (telefone_e164, motivo, origem) values ('+5534900000111', 'cliente', 'teste');
select is(pg_temp.ag(current_setting('t.v5'), current_setting('t.w'), 'abertura_enviada'),
  'Esse número pediu para não ser chamado. O lead saiu da sua lista.', 'principal bloqueado com 2 WhatsApp devolve o recado');
select is((select estado || ':' || motivo_fim from public.leads where id = current_setting('t.w')::uuid), 'descartado:pediu_parar',
  '2 WhatsApp, principal bloqueado: descartado');
select is((select count(*) from public.eventos_lead where lead_id = current_setting('t.w')::uuid and tipo = 'abertura_enviada'),
  0::bigint, '2 WhatsApp, principal bloqueado: sem evento de abertura');
select is((select dados->>'bloqueio_motivo' from public.eventos_lead where lead_id = current_setting('t.w')::uuid and tipo = 'descartou'),
  'cliente', 'evento guarda o motivo real do bloqueio');

-- place id bloqueado depois da reserva
select set_config('t.y', testes.criar_lead_pronto('Pet Exemplo Y', '+5534900000113')::text, true);
select pg_temp.reservar(current_setting('t.y'), current_setting('t.v5'));
insert into public.bloqueios (google_place_id, motivo, origem)
select l.google_place_id, 'descarte', 'teste' from public.leads l where l.id = current_setting('t.y')::uuid;
select is(pg_temp.ag(current_setting('t.v5'), current_setting('t.y'), 'abertura_enviada'),
  'Esse número pediu para não ser chamado. O lead saiu da sua lista.', 'place id bloqueado devolve o recado');
select is((select estado from public.leads where id = current_setting('t.y')::uuid), 'descartado', 'place id bloqueado: descartado');
select is((select count(*) from public.eventos_lead where lead_id = current_setting('t.y')::uuid and tipo = 'abertura_enviada'),
  0::bigint, 'place id bloqueado: sem evento de abertura');

-- numero_errado sem telefone livre e previa_enviada sem pedido pronto
select set_config('t.z', testes.criar_lead_pronto('Pet Exemplo Z', '+5534900000114')::text, true);
select pg_temp.reservar(current_setting('t.z'), current_setting('t.v5'));
insert into public.bloqueios (telefone_e164, motivo, origem) values ('+5534900000114', 'pediu_parar', 'teste');
select throws_ok(format($$select pg_temp.ag(%L, %L, 'numero_errado')$$, current_setting('t.v5'), current_setting('t.z')),
  'P0001', 'Esse passo já foi registrado ou não vale agora. Atualize a tela.', 'numero_errado sem telefone livre é recusado');

select set_config('t.k', testes.criar_lead_pronto('Pet Exemplo K', '+5534900000115')::text, true);
select pg_temp.reservar(current_setting('t.k'), current_setting('t.v3'));
select pg_temp.ag(current_setting('t.v3'), current_setting('t.k'), 'abertura_enviada');
update public.leads set etapa = 'previa_pronta' where id = current_setting('t.k')::uuid;
select throws_ok(format($$select pg_temp.ag(%L, %L, 'previa_enviada')$$, current_setting('t.v3'), current_setting('t.k')),
  'P0001', 'Esse passo já foi registrado ou não vale agora. Atualize a tela.', 'previa_enviada sem pedido pronto é recusada');
select is((select etapa from public.leads where id = current_setting('t.k')::uuid), 'previa_pronta', 'etapa não avançou sozinha');

-- "Não tem interesse" e "Pediu para não chamar mais" valem em todo passo da conversa
create function pg_temp.em_passo(p_nome text, p_fone text, p_v text, p_passo text) returns text
language plpgsql as $$
declare v_l uuid := testes.criar_lead_pronto(p_nome, p_fone);
begin
  update public.leads
  set estado = 'em_conversa', dono_id = p_v::uuid, passo = p_passo, abertura_enviada_em = now(),
    principal_enviada_em = case when p_passo = 'resultado' then now() end,
    proximo_passo_em = case when p_passo = 'acompanhamento' then now() + interval '2 days' end
  where id = v_l;
  return v_l::text;
end;
$$;
create function pg_temp.fim(p_l text) returns text language sql as $$
  select estado || ':' || motivo_fim || ':' || coalesce(passo, 'nulo') || ':' || coalesce(proximo_passo_em::text, 'nulo')
  from public.leads where id = p_l::uuid;
$$;

select set_config('t.si1', pg_temp.em_passo('Pet Exemplo SI1', '+5534900000121', current_setting('t.v2'), 'quem_respondeu'), true);
select set_config('t.si2', pg_temp.em_passo('Pet Exemplo SI2', '+5534900000122', current_setting('t.v2'), 'robo'), true);
select set_config('t.si3', pg_temp.em_passo('Pet Exemplo SI3', '+5534900000123', current_setting('t.v2'), 'principal'), true);
select set_config('t.si4', pg_temp.em_passo('Pet Exemplo SI4', '+5534900000124', current_setting('t.v2'), 'acompanhamento'), true);
select set_config('t.si5', pg_temp.em_passo('Pet Exemplo SI5', '+5534900000125', current_setting('t.v2'), 'resultado'), true);
select pg_temp.ag(current_setting('t.v2'), current_setting('t.si' || n), 'sem_interesse') from generate_series(1, 5) n;
select is(pg_temp.fim(current_setting('t.si1')), 'encerrado:sem_interesse:nulo:nulo', 'sem_interesse em quem_respondeu encerra');
select is(pg_temp.fim(current_setting('t.si2')), 'encerrado:sem_interesse:nulo:nulo', 'sem_interesse no robô encerra');
select is(pg_temp.fim(current_setting('t.si3')), 'encerrado:sem_interesse:nulo:nulo', 'sem_interesse na principal encerra');
select is(pg_temp.fim(current_setting('t.si4')), 'encerrado:sem_interesse:nulo:nulo', 'sem_interesse no acompanhamento encerra e limpa o prazo');
select is(pg_temp.fim(current_setting('t.si5')), 'encerrado:sem_interesse:nulo:nulo', 'sem_interesse no resultado encerra');

select set_config('t.pp1', pg_temp.em_passo('Pet Exemplo PP1', '+5534900000126', current_setting('t.v2'), 'quem_respondeu'), true);
select set_config('t.pp2', pg_temp.em_passo('Pet Exemplo PP2', '+5534900000127', current_setting('t.v2'), 'robo'), true);
select set_config('t.pp3', pg_temp.em_passo('Pet Exemplo PP3', '+5534900000128', current_setting('t.v2'), 'principal'), true);
select set_config('t.pp4', pg_temp.em_passo('Pet Exemplo PP4', '+5534900000129', current_setting('t.v2'), 'acompanhamento'), true);
select set_config('t.pp5', pg_temp.em_passo('Pet Exemplo PP5', '+5534900000130', current_setting('t.v2'), 'resultado'), true);
select pg_temp.ag(current_setting('t.v2'), current_setting('t.pp' || n), 'pediu_parar') from generate_series(1, 5) n;
select is(pg_temp.fim(current_setting('t.pp1')), 'encerrado:pediu_parar:nulo:nulo', 'pediu_parar em quem_respondeu encerra');
select is(pg_temp.fim(current_setting('t.pp2')), 'encerrado:pediu_parar:nulo:nulo', 'pediu_parar no robô encerra');
select is(pg_temp.fim(current_setting('t.pp3')), 'encerrado:pediu_parar:nulo:nulo', 'pediu_parar na principal encerra');
select is(pg_temp.fim(current_setting('t.pp4')), 'encerrado:pediu_parar:nulo:nulo', 'pediu_parar no acompanhamento encerra e limpa o prazo');
select is(pg_temp.fim(current_setting('t.pp5')), 'encerrado:pediu_parar:nulo:nulo', 'pediu_parar no resultado encerra');
select is((select count(*)::int from public.bloqueios
  where telefone_e164 in ('+5534900000126', '+5534900000127', '+5534900000128', '+5534900000129', '+5534900000130')
    and motivo = 'pediu_parar'), 5, 'pediu_parar bloqueia o número em todo passo');

-- "Falou uma pessoa" durante a espera do acompanhamento
select set_config('t.fa1', pg_temp.em_passo('Pet Exemplo FA1', '+5534900000131', current_setting('t.v2'), 'acompanhamento'), true);
select pg_temp.ag(current_setting('t.v2'), current_setting('t.fa1'), 'pessoa');
select is((select passo || ':' || coalesce(proximo_passo_em::text, 'nulo') from public.leads where id = current_setting('t.fa1')::uuid),
  'principal:nulo', 'pessoa no acompanhamento, sem principal: vai para a principal e limpa o prazo');
select set_config('t.fa2', pg_temp.em_passo('Pet Exemplo FA2', '+5534900000132', current_setting('t.v2'), 'acompanhamento'), true);
update public.leads set principal_enviada_em = now() where id = current_setting('t.fa2')::uuid;
select pg_temp.ag(current_setting('t.v2'), current_setting('t.fa2'), 'pessoa');
select is((select passo || ':' || coalesce(proximo_passo_em::text, 'nulo') from public.leads where id = current_setting('t.fa2')::uuid),
  'resultado:nulo', 'pessoa no acompanhamento, com principal: vai para o resultado');
select ok(exists (select 1 from public.eventos_lead where lead_id = current_setting('t.fa2')::uuid and tipo = 'pessoa_respondeu'),
  'evento pessoa_respondeu no acompanhamento');

-- telefone_para_abertura: o número do wa.me, ou nulo se algum telefone ou o place id do lead estiver bloqueado
create function pg_temp.tel(p_v text, p_l text) returns text
language plpgsql as $$
declare r text;
begin
  perform testes.entrar_como(p_v::uuid);
  r := public.telefone_para_abertura(p_l::uuid);
  reset role;
  return r;
end;
$$;
select set_config('t.ta', testes.criar_lead_pronto('Pet Exemplo TA', '+5534900000141')::text, true);
insert into public.telefones_lead (lead_id, e164, tipo, principal) values (current_setting('t.ta')::uuid, '+5534900000142', 'whatsapp', false);
select pg_temp.reservar(current_setting('t.ta'), current_setting('t.v3'));
select is(pg_temp.tel(current_setting('t.v3'), current_setting('t.ta')), '+5534900000141', 'dono recebe o WhatsApp principal');
select is(pg_temp.tel(current_setting('t.v4'), current_setting('t.ta')), null, 'quem não é dono recebe nulo');
insert into public.bloqueios (telefone_e164, motivo, origem) values ('+5534900000142', 'pediu_parar', 'teste');
select is(pg_temp.tel(current_setting('t.v3'), current_setting('t.ta')), null, 'outro telefone do lead bloqueado: nulo');
delete from public.bloqueios where telefone_e164 = '+5534900000142';
select is(pg_temp.tel(current_setting('t.v3'), current_setting('t.ta')), '+5534900000141', 'sem bloqueio volta o número');
insert into public.bloqueios (google_place_id, motivo, origem)
select l.google_place_id, 'cliente', 'teste' from public.leads l where l.id = current_setting('t.ta')::uuid;
select is(pg_temp.tel(current_setting('t.v3'), current_setting('t.ta')), null, 'place id bloqueado: nulo');
update public.perfis set ativo = false where id = current_setting('t.v3')::uuid;
select throws_ok(format($$select pg_temp.tel(%L, %L)$$, current_setting('t.v3'), current_setting('t.ta')),
  'P0001', 'Seu acesso foi desativado. Fale com o Kelwin.', 'desativado não lê o número');
update public.perfis set ativo = true where id = current_setting('t.v3')::uuid;
select ok(not has_function_privilege('anon', 'public.telefone_para_abertura(uuid)', 'execute'), 'anon não executa telefone_para_abertura');
select ok(has_function_privilege('authenticated', 'public.telefone_para_abertura(uuid)', 'execute'),
  'authenticated executa telefone_para_abertura');

-- privilégios
select ok(not has_function_privilege('anon', 'public.registrar_acao(uuid,text,bigint)', 'execute'), 'anon não executa registrar_acao');
select ok(has_function_privilege('authenticated', 'public.registrar_acao(uuid,text,bigint)', 'execute'), 'authenticated executa registrar_acao');

select * from finish();
rollback;
