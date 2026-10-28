-- Corrige a corrida entre leads do mesmo grupo no proximo_lead (trava global da fila).
create or replace function public.proximo_lead() returns uuid
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

  -- trava global da fila: sem ela, dois vendedores podiam pegar irmãos do mesmo grupo ao mesmo tempo,
  -- porque nenhum enxerga a reserva ainda não confirmada do outro. O volume é baixo.
  perform pg_advisory_xact_lock(hashtextextended('vistra:fila', 0));

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


revoke execute on function public.proximo_lead() from public, anon;
grant execute on function public.proximo_lead() to authenticated;
