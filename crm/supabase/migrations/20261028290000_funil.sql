-- Depois do "sim": prévia anexada pelo admin, funil por etapas, contato opcional e venda.

create function private.exigir_admin() returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_id uuid := private.exigir_ativo();
begin
  if not (select private.eu_admin()) then
    raise exception 'Só o admin pode fazer isso.' using errcode = 'P0001';
  end if;
  return v_id;
end;
$$;
revoke execute on function private.exigir_admin() from public, anon, authenticated;

create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.leads (id),
  vendedor_id uuid not null references public.perfis (id),
  valor numeric(10,2) not null check (valor > 0),
  forma_pagamento text not null check (forma_pagamento in ('pix', 'boleto', 'cartao', 'dinheiro', 'outro')),
  fechado_em date not null,
  pago_em date,
  comissao_pct numeric(5,2) not null,
  comissao numeric(10,2) generated always as (round(valor * comissao_pct / 100, 2)) stored,
  repassado_em date,
  registrado_por uuid not null references public.perfis (id),
  criado_em timestamptz not null default now()
);
create index vendas_vendedor_idx on public.vendas (vendedor_id);
create index vendas_lead_idx on public.vendas (lead_id);
create index vendas_registrado_por_idx on public.vendas (registrado_por);

alter table public.vendas enable row level security;
create policy vendas_select on public.vendas for select to authenticated
using ((vendedor_id = (select auth.uid()) and (select private.eu_ativo())) or (select private.eu_admin()));
grant select on public.vendas to authenticated;
grant all on public.vendas to service_role;

-- Vendedor: mover etapa (menos para "fechou", que é a venda).
create function public.mover_etapa(p_lead_id uuid, p_etapa text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_ativo();
  v_lead public.leads;
begin
  select * into v_lead from public.leads l where l.id = p_lead_id and l.dono_id = v_eu for update;
  if not found then
    raise exception 'Esse lead não está com você.' using errcode = 'P0001';
  end if;
  if p_etapa = 'fechou' then
    raise exception 'A venda se registra pelo botão Fechou.' using errcode = 'P0001';
  end if;

  if v_lead.etapa = 'previa_enviada' and p_etapa = 'negociando' then
    update public.leads
    set etapa = 'negociando', etapa_desde = now(), ultima_atividade_em = now(), atualizado_em = now()
    where id = p_lead_id;
  elsif v_lead.estado = 'em_conversa' and p_etapa = 'perdeu'
    and v_lead.etapa in ('previa_pedida', 'previa_pronta', 'previa_enviada', 'negociando') then
    update public.leads
    set etapa = 'perdeu', etapa_desde = now(), estado = 'encerrado', motivo_fim = 'perdeu', passo = null,
      proximo_passo_em = null, fim_em = now(), fim_por = v_eu, ultima_atividade_em = now(), atualizado_em = now()
    where id = p_lead_id;
  else
    raise exception 'Esse movimento não vale agora. Atualize a tela.' using errcode = 'P0001';
  end if;
  perform private.registrar_evento(p_lead_id, v_eu, 'etapa', jsonb_build_object('de', v_lead.etapa, 'para', p_etapa));
end;
$$;

create function public.registrar_venda(p_lead_id uuid, p_valor numeric, p_forma text, p_fechado_em date)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_ativo();
  v_lead public.leads;
  v_pct numeric(5,2);
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_data date := coalesce(p_fechado_em, (now() at time zone 'America/Sao_Paulo')::date);
  v_id uuid;
begin
  select * into v_lead from public.leads l where l.id = p_lead_id and l.dono_id = v_eu for update;
  if not found then
    raise exception 'Esse lead não está com você.' using errcode = 'P0001';
  end if;
  if v_lead.estado <> 'em_conversa' or v_lead.etapa is null or v_lead.etapa not in ('previa_enviada', 'negociando') then
    raise exception 'A venda só se registra depois de enviar a prévia.' using errcode = 'P0001';
  end if;
  if p_valor is null or round(p_valor, 2) <= 0 or round(p_valor, 2) >= 100000000 then
    raise exception 'Informe o valor da venda.' using errcode = 'P0001';
  end if;
  if p_forma is null or p_forma not in ('pix', 'boleto', 'cartao', 'dinheiro', 'outro') then
    raise exception 'Escolha a forma de pagamento.' using errcode = 'P0001';
  end if;
  if v_data > v_hoje then
    raise exception 'A data do fechamento não pode ser no futuro.' using errcode = 'P0001';
  end if;

  select coalesce(p.comissao_pct, c.comissao_pct) into v_pct
  from public.perfis p cross join public.configuracao c where p.id = v_eu;

  insert into public.vendas (lead_id, vendedor_id, valor, forma_pagamento, fechado_em, comissao_pct, registrado_por)
  values (p_lead_id, v_eu, round(p_valor, 2), p_forma, v_data, v_pct, v_eu)
  returning id into v_id;

  update public.leads
  set etapa = 'fechou', etapa_desde = now(), estado = 'encerrado', motivo_fim = 'venda', passo = null,
    proximo_passo_em = null, fim_em = now(), fim_por = v_eu, ultima_atividade_em = now(), atualizado_em = now()
  where id = p_lead_id;
  perform private.registrar_evento(p_lead_id, v_eu, 'venda',
    jsonb_build_object('venda_id', v_id, 'valor', round(p_valor, 2), 'forma', p_forma));
  return v_id;
end;
$$;

create function public.salvar_contato(p_lead_id uuid, p_nome text, p_cargo text, p_telefone_e164 text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_ativo();
  v_nome text := nullif(btrim(coalesce(p_nome, '')), '');
  v_cargo text := nullif(btrim(coalesce(p_cargo, '')), '');
  v_tel text := nullif(btrim(coalesce(p_telefone_e164, '')), '');
  v_id uuid;
begin
  perform 1 from public.leads l where l.id = p_lead_id and l.dono_id = v_eu;
  if not found then
    raise exception 'Esse lead não está com você.' using errcode = 'P0001';
  end if;
  if v_nome is null and v_tel is null then
    raise exception 'Informe o nome ou o telefone.' using errcode = 'P0001';
  end if;
  if v_tel is not null and v_tel !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Telefone inválido.' using errcode = 'P0001';
  end if;
  insert into public.contatos (lead_id, nome, cargo, telefone_e164, criado_por)
  values (p_lead_id, v_nome, v_cargo, v_tel, v_eu)
  returning id into v_id;
  perform private.registrar_evento(p_lead_id, v_eu, 'contato', jsonb_build_object('contato_id', v_id));
  return v_id;
end;
$$;

-- Admin
create function public.anexar_previa(p_pedido_id uuid, p_site_url text, p_pdf_url text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_admin();
  v_ped public.pedidos_previa;
  v_site text := btrim(coalesce(p_site_url, ''));
  v_pdf text := btrim(coalesce(p_pdf_url, ''));
begin
  -- o PassosLead põe estes links direto no href: só https e sem espaço
  if v_site !~* '^https://[^\s/?#]+[^\s]*$' or v_pdf !~* '^https://[^\s/?#]+[^\s]*$'
    or char_length(v_site) > 2000 or char_length(v_pdf) > 2000 then
    raise exception 'Use um link https.' using errcode = 'P0001';
  end if;
  select * into v_ped from public.pedidos_previa p where p.id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido não encontrado. Atualize a tela.' using errcode = 'P0001';
  end if;
  if v_ped.status <> 'pendente' then
    raise exception 'Esse pedido já foi atendido. Atualize a tela.' using errcode = 'P0001';
  end if;
  perform 1 from public.leads l where l.id = v_ped.lead_id and l.etapa = 'previa_pedida' and l.estado = 'em_conversa' for update;
  if not found then
    raise exception 'Esse pedido não vale mais. Atualize a tela.' using errcode = 'P0001';
  end if;

  update public.pedidos_previa
  set status = 'pronta', site_url = v_site, pdf_url = v_pdf, pronta_em = now(), pronta_por = v_eu
  where id = p_pedido_id;
  update public.leads
  set etapa = 'previa_pronta', etapa_desde = now(), ultima_atividade_em = now(), atualizado_em = now()
  where id = v_ped.lead_id;
  perform private.registrar_evento(v_ped.lead_id, v_eu, 'previa_pronta', jsonb_build_object('pedido_id', p_pedido_id));
end;
$$;

create function public.marcar_venda_paga(p_venda_id uuid, p_pago_em date) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_venda public.vendas;
begin
  perform private.exigir_admin();
  if p_pago_em is null then
    raise exception 'Informe a data do pagamento.' using errcode = 'P0001';
  end if;
  select * into v_venda from public.vendas v where v.id = p_venda_id for update;
  if not found then
    raise exception 'Venda não encontrada. Atualize a tela.' using errcode = 'P0001';
  end if;
  if v_venda.repassado_em is not null then
    raise exception 'A comissão já foi repassada.' using errcode = 'P0001';
  end if;
  update public.vendas set pago_em = p_pago_em where id = p_venda_id;
end;
$$;

create function public.marcar_comissao_repassada(p_venda_id uuid, p_repassado_em date) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_venda public.vendas;
begin
  perform private.exigir_admin();
  if p_repassado_em is null then
    raise exception 'Informe a data do repasse.' using errcode = 'P0001';
  end if;
  select * into v_venda from public.vendas v where v.id = p_venda_id for update;
  if not found then
    raise exception 'Venda não encontrada. Atualize a tela.' using errcode = 'P0001';
  end if;
  if v_venda.pago_em is null then
    raise exception 'Marque o pagamento antes do repasse.' using errcode = 'P0001';
  end if;
  update public.vendas set repassado_em = p_repassado_em where id = p_venda_id;
end;
$$;

revoke execute on function public.mover_etapa(uuid, text), public.registrar_venda(uuid, numeric, text, date),
  public.salvar_contato(uuid, text, text, text), public.anexar_previa(uuid, text, text),
  public.marcar_venda_paga(uuid, date), public.marcar_comissao_repassada(uuid, date) from public, anon;
grant execute on function public.mover_etapa(uuid, text), public.registrar_venda(uuid, numeric, text, date),
  public.salvar_contato(uuid, text, text, text), public.anexar_previa(uuid, text, text),
  public.marcar_venda_paga(uuid, date), public.marcar_comissao_repassada(uuid, date) to authenticated;
