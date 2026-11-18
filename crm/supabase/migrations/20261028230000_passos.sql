-- Passos guiados e resultado em um toque: registrar_acao, pedidos de prévia e bloqueio por pedido de parar.

create table public.pedidos_previa (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id),
  vendedor_id uuid not null references public.perfis (id),
  status text not null default 'pendente' check (status in ('pendente', 'pronta', 'enviada')),
  pedido_em timestamptz not null default now(),
  site_url text,
  pdf_url text,
  pronta_em timestamptz,
  pronta_por uuid references public.perfis (id),
  enviada_em timestamptz
);
create unique index pedidos_previa_aberto_uq on public.pedidos_previa (lead_id) where status <> 'enviada';
create index pedidos_previa_lead_idx on public.pedidos_previa (lead_id);
create index pedidos_previa_vendedor_idx on public.pedidos_previa (vendedor_id);
create index pedidos_previa_pronta_por_idx on public.pedidos_previa (pronta_por);

alter table public.pedidos_previa enable row level security;
create policy pedidos_previa_select on public.pedidos_previa for select to authenticated
using ((lead_id in (select l.id from public.leads l where l.dono_id = (select auth.uid())) and (select private.eu_ativo()))
  or (select private.eu_admin()));
grant select on public.pedidos_previa to authenticated;
grant all on public.pedidos_previa to service_role;

-- Bloqueia cada telefone e o place id do lead. O que já está bloqueado fica como está.
create function private.bloquear_lead(p_lead_id uuid, p_motivo text, p_autor uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.bloqueios (telefone_e164, motivo, origem, lead_id, criado_por)
  select distinct t.e164, p_motivo, 'registrar_acao', p_lead_id, p_autor
  from public.telefones_lead t where t.lead_id = p_lead_id
  on conflict do nothing;

  insert into public.bloqueios (google_place_id, motivo, origem, lead_id, criado_por)
  select l.google_place_id, p_motivo, 'registrar_acao', p_lead_id, p_autor
  from public.leads l where l.id = p_lead_id and l.google_place_id is not null
  on conflict do nothing;
end;
$$;
revoke execute on function private.bloquear_lead(uuid, text, uuid) from public, anon, authenticated;

create function public.registrar_acao(p_lead_id uuid, p_acao text, p_mensagem_id bigint default null)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_ativo();
  v_lead public.leads;
  v_tel public.telefones_lead;
  v_dias int;
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
    v_tel := private.telefone_atual(p_lead_id);
    if v_tel.id is null then
      -- sem número livre: se sobrou WhatsApp válido, ele foi bloqueado depois da reserva
      if exists (select 1 from public.telefones_lead t
        where t.lead_id = p_lead_id and t.tipo = 'whatsapp' and t.invalido_em is null) then
        update public.leads
        set estado = 'descartado', motivo_fim = 'pediu_parar', dono_id = null, passo = null, reservado_em = null,
          fim_em = now(), fim_por = v_eu, ultima_atividade_em = now(), atualizado_em = now()
        where id = p_lead_id;
        perform private.registrar_evento(p_lead_id, v_eu, 'descartou', jsonb_build_object('motivo', 'pediu_parar'));
        return 'Esse número pediu para não ser chamado. O lead saiu da sua lista.';
      end if;
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
    if v_tel.id is not null then
      update public.telefones_lead set invalido_em = now() where id = v_tel.id;
    end if;
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
    if v_lead.passo is null or v_lead.passo not in ('quem_respondeu', 'robo') then
      raise exception '%', c_invalido using errcode = 'P0001';
    end if;
    update public.leads
    set passo = case when principal_enviada_em is null then 'principal' else 'resultado' end,
      ultima_atividade_em = now(), atualizado_em = now()
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
    perform private.registrar_evento(p_lead_id, v_eu, 'previa_enviada');

  else
    raise exception 'Ação desconhecida.' using errcode = 'P0001';
  end case;

  return null;
end;
$$;

revoke execute on function public.registrar_acao(uuid, text, bigint) from public, anon;
grant execute on function public.registrar_acao(uuid, text, bigint) to authenticated;
