-- Tela do dono e gestão: painel por vendedor, equipe, fila, configuração, bloqueio e descarte.

-- Painel: uma linha por perfil. Os números vêm do histórico (autor do evento), então não mudam
-- quando um lead é largado ou reatribuído. Eventos "migrado" não entram.
create function public.painel_dono(p_desde timestamptz)
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
    (p.ativo and p.papel = 'vendedor' and d.dias >= v_alerta)
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

create function public.definir_vendedor(p_perfil_id uuid, p_ativo boolean, p_cota int) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_admin();
  v_perfil public.perfis;
  r record;
begin
  if p_ativo is null then
    raise exception 'Escolha ativar ou desativar.' using errcode = 'P0001';
  end if;
  if p_cota is null or p_cota < 0 or p_cota > 50 then
    raise exception 'A cota fica entre 0 e 50.' using errcode = 'P0001';
  end if;
  select * into v_perfil from public.perfis p where p.id = p_perfil_id for update;
  if not found then
    raise exception 'Pessoa não encontrada. Atualize a tela.' using errcode = 'P0001';
  end if;
  if not p_ativo and p_perfil_id = v_eu then
    raise exception 'Você não pode desativar a si mesmo.' using errcode = 'P0001';
  end if;

  update public.perfis set ativo = p_ativo, cota_diaria = p_cota where id = p_perfil_id;

  if v_perfil.ativo and not p_ativo then
    -- o reservado volta para a fila; os em conversa passam para o admin que desativou
    update public.leads
    set estado = 'no_poco', dono_id = null, passo = null, reservado_em = null, atualizado_em = now()
    where dono_id = p_perfil_id and estado = 'reservado';
    for r in select l.id from public.leads l where l.dono_id = p_perfil_id and l.estado = 'em_conversa' for update loop
      update public.leads set dono_id = v_eu, atualizado_em = now() where id = r.id;
      perform private.registrar_evento(r.id, v_eu, 'reatribuido',
        jsonb_build_object('de', p_perfil_id, 'para', v_eu));
    end loop;
  end if;
end;
$$;

create function public.reatribuir_lead(p_lead_id uuid, p_novo_dono uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_admin();
  v_lead public.leads;
begin
  perform 1 from public.perfis p where p.id = p_novo_dono and p.ativo;
  if not found then
    raise exception 'Escolha um vendedor ativo.' using errcode = 'P0001';
  end if;
  select * into v_lead from public.leads l where l.id = p_lead_id for update;
  if not found then
    raise exception 'Lead não encontrado. Atualize a tela.' using errcode = 'P0001';
  end if;
  if v_lead.estado <> 'em_conversa' then
    raise exception 'Só dá para reatribuir lead em conversa.' using errcode = 'P0001';
  end if;
  if v_lead.dono_id = p_novo_dono then
    raise exception 'Esse lead já está com essa pessoa.' using errcode = 'P0001';
  end if;
  update public.leads set dono_id = p_novo_dono, atualizado_em = now() where id = p_lead_id;
  perform private.registrar_evento(p_lead_id, v_eu, 'reatribuido',
    jsonb_build_object('de', v_lead.dono_id, 'para', p_novo_dono));
end;
$$;

create function public.definir_filtro_fila(p_tipo text, p_id uuid, p_ativo boolean) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.exigir_admin();
  if p_tipo is null or p_tipo not in ('cidade', 'nicho') then
    raise exception 'Escolha cidade ou nicho.' using errcode = 'P0001';
  end if;
  if p_ativo is null then
    raise exception 'Escolha ativar ou desativar.' using errcode = 'P0001';
  end if;
  if p_tipo = 'cidade' then
    update public.cidades set ativa = p_ativo where id = p_id;
  else
    update public.nichos set ativo = p_ativo where id = p_id;
  end if;
  if not found then
    raise exception 'Item não encontrado. Atualize a tela.' using errcode = 'P0001';
  end if;
end;
$$;

create function public.resumo_fila() returns table (cidade text, nicho text, prontos int)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform private.exigir_admin();
  return query
  select c.nome, coalesce(n.nome, 'Sem nicho'), count(*)::int
  from public.leads l
  join public.cidades c on c.id = l.cidade_id
  left join public.nichos n on n.id = l.nicho_id
  where l.estado = 'no_poco' and private.lead_pronto(l.id)
  group by c.nome, coalesce(n.nome, 'Sem nicho')
  order by c.nome, 2;
end;
$$;

create function public.atualizar_configuracao(p_preco numeric, p_piso numeric, p_comissao numeric,
  p_cota_padrao int, p_dias_acompanhamento int, p_dias_alerta int) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.exigir_admin();
  if p_preco is null or p_piso is null or p_comissao is null or p_cota_padrao is null
    or p_dias_acompanhamento is null or p_dias_alerta is null
    or p_preco <= 0 or p_preco >= 100000000 or p_piso <= 0 or p_piso > p_preco
    or p_comissao < 0 or p_comissao > 100
    or p_cota_padrao < 0 or p_cota_padrao > 50
    or p_dias_acompanhamento < 1 or p_dias_acompanhamento > 30
    or p_dias_alerta < 1 or p_dias_alerta > 30 then
    raise exception 'Confira os valores da configuração.' using errcode = 'P0001';
  end if;
  update public.configuracao
  set preco_tabela = round(p_preco, 2), piso_referencia = round(p_piso, 2), comissao_pct = round(p_comissao, 2),
    cota_padrao = p_cota_padrao, dias_acompanhamento = p_dias_acompanhamento, dias_alerta_parado = p_dias_alerta,
    atualizado_em = now();
end;
$$;

create function public.bloquear(p_telefone_e164 text, p_google_place_id text, p_motivo text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_admin();
  v_tel text := nullif(btrim(coalesce(p_telefone_e164, '')), '');
  v_place text := nullif(btrim(coalesce(p_google_place_id, '')), '');
begin
  if p_motivo is null or p_motivo not in ('pediu_parar', 'cliente', 'descarte') then
    raise exception 'Escolha o motivo.' using errcode = 'P0001';
  end if;
  if v_tel is null and v_place is null then
    raise exception 'Informe o telefone ou o place id.' using errcode = 'P0001';
  end if;
  if v_tel is not null and v_tel !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Telefone inválido.' using errcode = 'P0001';
  end if;
  if v_tel is not null then
    insert into public.bloqueios (telefone_e164, motivo, origem, criado_por)
    values (v_tel, p_motivo, 'admin', v_eu) on conflict do nothing;
  end if;
  if v_place is not null then
    insert into public.bloqueios (google_place_id, motivo, origem, criado_por)
    values (v_place, p_motivo, 'admin', v_eu) on conflict do nothing;
  end if;
end;
$$;

create function public.descartar_lead(p_lead_id uuid, p_motivo text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_admin();
  v_lead public.leads;
begin
  if p_motivo is null or p_motivo not in ('lead_fraco', 'fora_do_nicho', 'duplicado', 'fechado', 'tem_site', 'outro') then
    raise exception 'Escolha o motivo.' using errcode = 'P0001';
  end if;
  select * into v_lead from public.leads l where l.id = p_lead_id for update;
  if not found then
    raise exception 'Lead não encontrado. Atualize a tela.' using errcode = 'P0001';
  end if;
  if v_lead.estado in ('encerrado', 'descartado') then
    raise exception 'Esse lead já terminou. Atualize a tela.' using errcode = 'P0001';
  end if;
  update public.leads
  set estado = 'descartado', dono_id = null, passo = null, reservado_em = null, etapa = null, etapa_desde = null,
    proximo_passo_em = null, motivo_fim = p_motivo, fim_em = now(), fim_por = v_eu, atualizado_em = now()
  where id = p_lead_id;
  perform private.registrar_evento(p_lead_id, v_eu, 'descartou', jsonb_build_object('motivo', p_motivo));
end;
$$;

revoke execute on function public.painel_dono(timestamptz), public.definir_vendedor(uuid, boolean, int),
  public.reatribuir_lead(uuid, uuid), public.definir_filtro_fila(text, uuid, boolean), public.resumo_fila(),
  public.atualizar_configuracao(numeric, numeric, numeric, int, int, int),
  public.bloquear(text, text, text), public.descartar_lead(uuid, text) from public, anon;
grant execute on function public.painel_dono(timestamptz), public.definir_vendedor(uuid, boolean, int),
  public.reatribuir_lead(uuid, uuid), public.definir_filtro_fila(text, uuid, boolean), public.resumo_fila(),
  public.atualizar_configuracao(numeric, numeric, numeric, int, int, int),
  public.bloquear(text, text, text), public.descartar_lead(uuid, text) to authenticated;
