-- migrar_conversa passa a dizer o que fez: 'migrada', 'ja_migrada' ou 'ignorada:<estado>' (lead que já
-- saiu da fila por outro caminho). O script trata tudo que não é 'migrada' nem 'ja_migrada' como falha.
-- Toda migração grava uma marca ('migrado' com tipo_antigo 'migracao'), para que repetir uma conversa sem
-- eventos antigos também seja reconhecida como já migrada. Só service_role executa.
drop function public.migrar_conversa(uuid, uuid, text, jsonb, jsonb, timestamptz);

create function public.migrar_conversa(p_lead_id uuid, p_dono uuid, p_passo text, p_contato jsonb, p_eventos jsonb,
  p_atribuido_em timestamptz default null)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_estado text;
  v_abertura timestamptz;
  v_ultima timestamptz;
begin
  if p_passo is null or p_passo not in ('quem_respondeu', 'resultado') then
    raise exception 'Passo inválido para migração.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.perfis p where p.id = p_dono and p.ativo) then
    raise exception 'Dono precisa ser um perfil ativo.' using errcode = 'P0001';
  end if;
  if p_eventos is not null and jsonb_typeof(p_eventos) <> 'array' then
    raise exception 'Eventos inválidos.' using errcode = 'P0001';
  end if;

  select l.estado into v_estado from public.leads l where l.id = p_lead_id for update;
  if v_estado is null then
    raise exception 'Lead não encontrado.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.eventos_lead e where e.lead_id = p_lead_id and e.tipo = 'migrado') then
    return 'ja_migrada';
  end if;
  if v_estado not in ('no_poco', 'verificar') then
    return 'ignorada:' || v_estado;
  end if;

  v_abertura := coalesce(p_atribuido_em, now());
  select max((e ->> 'criado_em')::timestamptz) into v_ultima from jsonb_array_elements(coalesce(p_eventos, '[]')) e;

  update public.leads l set
    estado = 'em_conversa',
    dono_id = p_dono,
    passo = p_passo,
    abertura_enviada_em = v_abertura,
    ultima_atividade_em = greatest(v_abertura, coalesce(v_ultima, v_abertura)),
    atualizado_em = now()
  where l.id = p_lead_id;

  if p_contato is not null and jsonb_typeof(p_contato) = 'object' then
    insert into public.contatos (lead_id, nome, cargo, telefone_e164, criado_por)
    values (p_lead_id, nullif(p_contato ->> 'nome', ''), nullif(p_contato ->> 'cargo', ''),
      nullif(p_contato ->> 'telefone_e164', ''), p_dono);
  end if;

  insert into public.eventos_lead (lead_id, autor_id, tipo, dados, criado_em)
  select p_lead_id, p_dono, 'migrado',
    jsonb_build_object('tipo_antigo', e ->> 'tipo_antigo', 'nota', coalesce(e ->> 'nota', '')),
    coalesce((e ->> 'criado_em')::timestamptz, now())
  from jsonb_array_elements(coalesce(p_eventos, '[]')) e;

  insert into public.eventos_lead (lead_id, autor_id, tipo, dados)
  values (p_lead_id, p_dono, 'migrado', jsonb_build_object('tipo_antigo', 'migracao', 'nota', ''));

  return 'migrada';
end;
$$;

revoke execute on function public.migrar_conversa(uuid, uuid, text, jsonb, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.migrar_conversa(uuid, uuid, text, jsonb, jsonb, timestamptz) to service_role;
