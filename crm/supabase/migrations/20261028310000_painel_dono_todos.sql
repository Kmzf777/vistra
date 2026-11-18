-- O painel mostra todo perfil ativo, admin incluso: o dono também prospecta. 'parado' vale para qualquer perfil ativo.
create or replace function public.painel_dono(p_desde timestamptz)
returns table (vendedor_id uuid, nome text, ativo boolean, ultimo_acesso_em timestamptz,
  recebidos int, aberturas int, respostas_pessoa int, pedidos_previa int, vendas int,
  comissao_a_receber numeric, dias_sem_abertura int, parado boolean)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_alerta int;
begin
  perform private.exigir_admin();
  select c.dias_alerta_parado into v_alerta from public.configuracao c;
  return query
  select
    p.id,
    p.nome,
    p.ativo,
    p.ultimo_acesso_em,
    (select count(*)::int from public.eventos_lead e
      where e.autor_id = p.id and e.tipo = 'recebeu' and e.criado_em >= coalesce(p_desde, '-infinity')),
    (select count(*)::int from public.eventos_lead e
      where e.autor_id = p.id and e.tipo = 'abertura_enviada' and e.criado_em >= coalesce(p_desde, '-infinity')),
    (select count(*)::int from public.eventos_lead e
      where e.autor_id = p.id and e.tipo = 'pessoa_respondeu' and e.criado_em >= coalesce(p_desde, '-infinity')),
    (select count(*)::int from public.eventos_lead e
      where e.autor_id = p.id and e.tipo = 'previa_pedida' and e.criado_em >= coalesce(p_desde, '-infinity')),
    (select count(*)::int from public.vendas v
      where v.vendedor_id = p.id
        and (p_desde is null or v.fechado_em >= (p_desde at time zone 'America/Sao_Paulo')::date)),
    (select coalesce(sum(v.comissao), 0)::numeric from public.vendas v
      where v.vendedor_id = p.id and v.pago_em is not null and v.repassado_em is null),
    d.dias,
    (p.ativo and d.dias >= v_alerta)
  from public.perfis p
  cross join lateral (
    select private.dias_uteis_entre(
      coalesce((select max(e.criado_em) from public.eventos_lead e
        where e.autor_id = p.id and e.tipo = 'abertura_enviada'), p.criado_em),
      now()) as dias
  ) d
  order by p.nome, p.id;
end;
$$;
