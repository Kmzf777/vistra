-- "Falou uma pessoa" vale também no passo acompanhamento (limpa o prazo). "Não tem interesse" e
-- "Pediu para não chamar mais" já valem em qualquer passo da conversa; a tela agora os mostra em todos.
create or replace function public.registrar_acao(p_lead_id uuid, p_acao text, p_mensagem_id bigint default null)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_ativo();
  v_lead public.leads;
  v_tel public.telefones_lead;
  v_dias int;
  v_bloq_motivo text;
  v_bloq_tel bigint;
  c_invalido constant text := 'Esse passo já foi registrado ou não vale agora. Atualize a tela.';
begin
  -- o for update serializa o toque duplo: a segunda chamada espera e já vê o passo mudado
  select * into v_lead from public.leads l where l.id = p_lead_id and l.dono_id = v_eu for update;
  if not found then
    raise exception 'Esse lead não está com você.' using errcode = 'P0001';
  end if;

  case p_acao
  when 'abertura_enviada' then
    if v_lead.passo is distinct from 'abertura' then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    -- bloqueio que entrou depois da reserva: qualquer telefone do lead ou o place id (mesmo predicado de lead_pronto)
    select b.motivo, t.id into v_bloq_motivo, v_bloq_tel
    from public.bloqueios b
    left join public.telefones_lead t on t.lead_id = p_lead_id and t.e164 = b.telefone_e164
    where (t.id is not null or (v_lead.google_place_id is not null and b.google_place_id = v_lead.google_place_id))
    order by (t.id is null), b.id
    limit 1;
    if v_bloq_motivo is not null then
      update public.leads
      set estado = 'descartado', motivo_fim = 'pediu_parar', dono_id = null, passo = null, reservado_em = null,
        fim_em = now(), fim_por = v_eu, ultima_atividade_em = now(), atualizado_em = now()
      where id = p_lead_id;
      perform private.registrar_evento(p_lead_id, v_eu, 'descartou',
        jsonb_build_object('motivo', 'pediu_parar', 'bloqueio_motivo', v_bloq_motivo, 'telefone_id', v_bloq_tel));
      return 'Esse número pediu para não ser chamado. O lead saiu da sua lista.';
    end if;
    v_tel := private.telefone_atual(p_lead_id);
    if v_tel.id is null then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    update public.leads
    set estado = 'em_conversa', passo = 'quem_respondeu', abertura_enviada_em = now(),
      ultima_atividade_em = now(), atualizado_em = now()
    where id = p_lead_id;
    perform private.registrar_evento(p_lead_id, v_eu, 'abertura_enviada', jsonb_build_object('telefone_id', v_tel.id));

  when 'numero_errado' then
    if v_lead.passo is null or v_lead.passo not in ('abertura', 'quem_respondeu') then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    v_tel := private.telefone_atual(p_lead_id);
    if v_tel.id is null then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    update public.telefones_lead set invalido_em = now() where id = v_tel.id;
    if (private.telefone_atual(p_lead_id)).id is not null then
      update public.leads
      set passo = 'abertura', ultima_atividade_em = now(), atualizado_em = now()
      where id = p_lead_id;
    else
      update public.leads
      set estado = 'verificar', dono_id = null, passo = null, reservado_em = null,
        ultima_atividade_em = now(), atualizado_em = now()
      where id = p_lead_id;
    end if;
    perform private.registrar_evento(p_lead_id, v_eu, 'numero_errado', jsonb_build_object('telefone_id', v_tel.id));

  when 'robo' then
    if v_lead.passo is distinct from 'quem_respondeu' then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    update public.leads set passo = 'robo', ultima_atividade_em = now(), atualizado_em = now() where id = p_lead_id;
    perform private.registrar_evento(p_lead_id, v_eu, 'robo');

  when 'pessoa' then
    -- também na espera do acompanhamento: a pessoa respondeu antes do prazo, e o prazo some
    if v_lead.passo is null or v_lead.passo not in ('quem_respondeu', 'robo', 'acompanhamento') then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    update public.leads
    set passo = case when principal_enviada_em is null then 'principal' else 'resultado' end,
      proximo_passo_em = null, ultima_atividade_em = now(), atualizado_em = now()
    where id = p_lead_id;
    perform private.registrar_evento(p_lead_id, v_eu, 'pessoa_respondeu');

  when 'sem_resposta' then
    if v_lead.passo is null or v_lead.passo not in ('quem_respondeu', 'robo', 'resultado') then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    if v_lead.acompanhamento_enviado_em is null then
      select c.dias_acompanhamento into v_dias from public.configuracao c;
      update public.leads
      set passo = 'acompanhamento', proximo_passo_em = private.somar_dias_uteis(now(), v_dias),
        ultima_atividade_em = now(), atualizado_em = now()
      where id = p_lead_id;
    else
      update public.leads
      set estado = 'encerrado', motivo_fim = 'sem_resposta', passo = null, proximo_passo_em = null,
        fim_em = now(), fim_por = v_eu, ultima_atividade_em = now(), atualizado_em = now()
      where id = p_lead_id;
    end if;
    perform private.registrar_evento(p_lead_id, v_eu, 'sem_resposta');

  when 'acompanhamento_enviado' then
    if v_lead.passo is distinct from 'acompanhamento' then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    if v_lead.proximo_passo_em > now() then
      raise exception 'O acompanhamento é só a partir de %.',
        to_char(v_lead.proximo_passo_em at time zone 'America/Sao_Paulo', 'DD/MM') using errcode = 'P0001';
    end if;
    update public.leads
    set acompanhamento_enviado_em = now(), proximo_passo_em = null,
      passo = case when principal_enviada_em is null then 'principal' else 'resultado' end,
      ultima_atividade_em = now(), atualizado_em = now()
    where id = p_lead_id;
    perform private.registrar_evento(p_lead_id, v_eu, 'acompanhamento_enviado');

  when 'principal_enviada' then
    if v_lead.passo is distinct from 'principal' then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    if p_mensagem_id is null or not exists (select 1 from public.mensagens_lead m
      where m.id = p_mensagem_id and m.lead_id = p_lead_id and m.status = 'aprovada') then
      raise exception 'Essa não é a mensagem aprovada deste lead. Atualize a tela.' using errcode = 'P0001';
    end if;
    update public.leads
    set passo = 'resultado', principal_enviada_em = now(), ultima_atividade_em = now(), atualizado_em = now()
    where id = p_lead_id;
    perform private.registrar_evento(p_lead_id, v_eu, 'principal_enviada', '{}', p_mensagem_id);

  when 'perguntou' then
    if v_lead.passo is distinct from 'resultado' then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    update public.leads set ultima_atividade_em = now(), atualizado_em = now() where id = p_lead_id;
    perform private.registrar_evento(p_lead_id, v_eu, 'perguntou');

  when 'quer_previa' then
    if v_lead.passo is distinct from 'resultado' then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    update public.leads
    set passo = null, etapa = 'previa_pedida', etapa_desde = now(), ultima_atividade_em = now(), atualizado_em = now()
    where id = p_lead_id;
    insert into public.pedidos_previa (lead_id, vendedor_id, status) values (p_lead_id, v_eu, 'pendente');
    perform private.registrar_evento(p_lead_id, v_eu, 'previa_pedida');

  when 'sem_interesse' then
    if v_lead.estado <> 'em_conversa' or v_lead.passo is null then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    update public.leads
    set estado = 'encerrado', motivo_fim = 'sem_interesse', passo = null, proximo_passo_em = null,
      fim_em = now(), fim_por = v_eu, ultima_atividade_em = now(), atualizado_em = now()
    where id = p_lead_id;
    perform private.registrar_evento(p_lead_id, v_eu, 'sem_interesse');

  when 'pediu_parar' then
    if v_lead.estado <> 'em_conversa' then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    perform private.bloquear_lead(p_lead_id, 'pediu_parar', v_eu);
    update public.leads
    set estado = 'encerrado', motivo_fim = 'pediu_parar', passo = null, proximo_passo_em = null,
      etapa = case when etapa is not null then 'perdeu' end,
      etapa_desde = case when etapa is not null then now() else etapa_desde end,
      fim_em = now(), fim_por = v_eu, ultima_atividade_em = now(), atualizado_em = now()
    where id = p_lead_id;
    perform private.registrar_evento(p_lead_id, v_eu, 'bloqueou', jsonb_build_object('motivo', 'pediu_parar'));

  when 'previa_enviada' then
    if v_lead.etapa is distinct from 'previa_pronta' then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    update public.leads
    set etapa = 'previa_enviada', etapa_desde = now(), ultima_atividade_em = now(), atualizado_em = now()
    where id = p_lead_id;
    update public.pedidos_previa set status = 'enviada', enviada_em = now()
    where lead_id = p_lead_id and status = 'pronta';
    if not found then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    perform private.registrar_evento(p_lead_id, v_eu, 'previa_enviada');

  else
    raise exception 'Ação desconhecida.' using errcode = 'P0001';
  end case;

  return null;
end;
$$;

revoke execute on function public.registrar_acao(uuid, text, bigint) from public, anon;
grant execute on function public.registrar_acao(uuid, text, bigint) to authenticated;
