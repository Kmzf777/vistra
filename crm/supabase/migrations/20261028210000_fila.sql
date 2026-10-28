-- Fila "Próximo lead" com cota diária.
-- O lint 0029 (authenticated_security_definer_function_executable) é intencional nas RPCs públicas abaixo:
-- a escrita em leads e eventos só passa por elas (nenhum grant de insert/update/delete para authenticated).

-- Telefone a usar na abordagem: o primeiro WhatsApp válido e fora de bloqueios, com o principal na frente.
create function private.telefone_atual(p_lead_id uuid) returns public.telefones_lead
language sql stable security definer set search_path = ''
as $$
  select t.*
  from public.telefones_lead t
  where t.lead_id = p_lead_id
    and t.tipo = 'whatsapp'
    and t.invalido_em is null
    and not exists (select 1 from public.bloqueios b where b.telefone_e164 = t.e164)
  order by t.principal desc, t.id
  limit 1;
$$;

create function private.lead_pronto(p_lead_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.leads l
    join public.cidades c on c.id = l.cidade_id
    where l.id = p_lead_id
      and l.estado = 'no_poco'
      and l.veredito_atual in ('PODE_ABORDAR', 'SITE_QUEBRADO')
      and (private.telefone_atual(l.id)).id is not null
      and exists (select 1 from public.mensagens_lead m where m.lead_id = l.id and m.status = 'aprovada')
      and exists (select 1 from public.modelos_mensagem mo
        where mo.tipo = 'abertura' and mo.ativo and (mo.nicho_id is null or mo.nicho_id = l.nicho_id))
      and not exists (select 1 from public.bloqueios b
        join public.telefones_lead t on t.e164 = b.telefone_e164 where t.lead_id = l.id)
      and not exists (select 1 from public.bloqueios b
        where l.google_place_id is not null and b.google_place_id = l.google_place_id)
      and c.ativa
      and (l.nicho_id is null or exists (select 1 from public.nichos n where n.id = l.nicho_id and n.ativo))
      and (l.grupo is null or not exists (select 1 from public.leads o
        where o.grupo = l.grupo and o.id <> l.id and o.estado in ('reservado', 'em_conversa', 'encerrado')))
  );
$$;

create function private.registrar_evento(p_lead uuid, p_autor uuid, p_tipo text, p_dados jsonb default '{}',
  p_mensagem bigint default null)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.eventos_lead (lead_id, autor_id, tipo, dados, mensagem_id)
  values (p_lead, p_autor, p_tipo, coalesce(p_dados, '{}'), p_mensagem);
$$;

-- Reserva de antes da meia-noite de Brasília volta para a fila; o evento fica com o antigo dono.
create function private.liberar_reservas_vencidas() returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_n int;
begin
  with vencidas as (
    select l.id, l.dono_id
    from public.leads l
    where l.estado = 'reservado' and l.reservado_em < private.inicio_do_dia(now())
    for update skip locked
  ), liberadas as (
    update public.leads l
    set estado = 'no_poco', dono_id = null, passo = null, reservado_em = null, atualizado_em = now()
    from vencidas v
    where l.id = v.id
    returning v.id, v.dono_id
  ), eventos as (
    insert into public.eventos_lead (lead_id, autor_id, tipo)
    select id, dono_id, 'reserva_venceu' from liberadas
    returning 1
  )
  select count(*)::int into v_n from eventos;
  return v_n;
end;
$$;

revoke execute on function private.telefone_atual(uuid), private.lead_pronto(uuid),
  private.registrar_evento(uuid, uuid, text, jsonb, bigint), private.liberar_reservas_vencidas()
  from public, anon, authenticated;

create function public.proximo_lead() returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_ativo();
  v_lead uuid;
  v_cota int;
  v_abertas int;
begin
  -- serializa os pedidos do mesmo vendedor (toque duplo)
  perform pg_advisory_xact_lock(hashtextextended('proximo_lead:' || v_eu::text, 0));

  perform private.liberar_reservas_vencidas();

  select l.id into v_lead from public.leads l where l.dono_id = v_eu and l.estado = 'reservado';
  if v_lead is not null then
    return v_lead;
  end if;

  select p.cota_diaria into v_cota from public.perfis p where p.id = v_eu;
  select count(*)::int into v_abertas
  from public.eventos_lead e
  where e.autor_id = v_eu and e.tipo = 'abertura_enviada' and e.criado_em >= private.inicio_do_dia(now());
  if v_abertas >= v_cota then
    raise exception 'Você já abriu % conversas hoje. A cota volta amanhã.', v_cota using errcode = 'P0001';
  end if;

  select l.id into v_lead
  from public.leads l
  where l.estado = 'no_poco'
    and private.lead_pronto(l.id)
    and not exists (select 1 from public.eventos_lead e
      where e.lead_id = l.id and e.autor_id = v_eu and e.tipo = 'largou')
  order by l.prioridade asc nulls last, l.nota desc nulls last, l.avaliacoes desc nulls last, l.criado_em, l.id
  limit 1
  for update of l skip locked;

  if v_lead is null then
    raise exception 'A fila está vazia agora. Avise o Kelwin.' using errcode = 'P0001';
  end if;

  update public.leads
  set estado = 'reservado', dono_id = v_eu, reservado_em = now(), passo = 'abertura', atualizado_em = now()
  where id = v_lead;
  perform private.registrar_evento(v_lead, v_eu, 'recebeu');
  return v_lead;
end;
$$;

create function public.largar_lead(p_lead_id uuid, p_motivo text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_ativo();
  v_lead public.leads;
begin
  if p_motivo is null or p_motivo not in ('tem_site', 'fechado', 'fora_do_nicho', 'outro') then
    raise exception 'Motivo inválido.' using errcode = 'P0001';
  end if;

  select * into v_lead from public.leads l where l.id = p_lead_id and l.dono_id = v_eu for update;
  if not found then
    raise exception 'Esse lead não está com você.' using errcode = 'P0001';
  end if;
  if v_lead.estado in ('em_conversa', 'encerrado') or v_lead.abertura_enviada_em is not null then
    raise exception 'Depois da abertura enviada o lead não volta para a fila.' using errcode = 'P0001';
  end if;
  if v_lead.estado <> 'reservado' then
    raise exception 'Esse lead não está com você.' using errcode = 'P0001';
  end if;

  if p_motivo = 'outro' then
    update public.leads
    set estado = 'no_poco', dono_id = null, passo = null, reservado_em = null, atualizado_em = now()
    where id = p_lead_id;
    perform private.registrar_evento(p_lead_id, v_eu, 'largou', jsonb_build_object('motivo', p_motivo));
  else
    update public.leads
    set estado = 'descartado', dono_id = null, passo = null, reservado_em = null,
      motivo_fim = p_motivo, fim_em = now(), fim_por = v_eu, atualizado_em = now()
    where id = p_lead_id;
    perform private.registrar_evento(p_lead_id, v_eu, 'descartou', jsonb_build_object('motivo', p_motivo));
  end if;
end;
$$;

create function public.minha_cota() returns table (abertas_hoje int, cota int)
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_ativo();
begin
  perform private.liberar_reservas_vencidas();
  return query
  select
    (select count(*)::int from public.eventos_lead e
      where e.autor_id = v_eu and e.tipo = 'abertura_enviada' and e.criado_em >= private.inicio_do_dia(now())),
    (select p.cota_diaria::int from public.perfis p where p.id = v_eu);
end;
$$;

create function public.marcar_acesso() returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_ativo();
begin
  update public.perfis p
  set ultimo_acesso_em = now()
  where p.id = v_eu and (p.ultimo_acesso_em is null or p.ultimo_acesso_em < now() - interval '10 minutes');
end;
$$;

revoke execute on function public.proximo_lead(), public.largar_lead(uuid, text), public.minha_cota(),
  public.marcar_acesso() from public, anon;
grant execute on function public.proximo_lead(), public.largar_lead(uuid, text), public.minha_cota(),
  public.marcar_acesso() to authenticated;
