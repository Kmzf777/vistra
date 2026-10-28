-- Importação de mensagens por lead (versões) e de modelos gerais. Só service_role executa.

create function public.importar_mensagens(p_autor uuid, p_itens jsonb)
returns table (indice int, mensagem_id bigint, resultado text)
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_item jsonb;
  v_i int := 0;
  v_lead uuid;
  v_place text;
  v_origem text;
  v_fone text;
  v_partes text[];
  v_versao int;
  v_num text;
  v_wa_origem text;
begin
  if not exists (select 1 from public.perfis p where p.id = p_autor and p.papel = 'admin' and p.ativo) then
    raise exception 'Autor precisa ser um admin ativo.' using errcode = 'P0001';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' then
    raise exception 'Itens inválidos.' using errcode = 'P0001';
  end if;

  for v_item in select e from jsonb_array_elements(p_itens) e loop
    indice := v_i;
    v_i := v_i + 1;
    mensagem_id := null;
    resultado := null;
    begin
      v_place := nullif(btrim(v_item #>> '{lead,google_place_id}'), '');
      v_origem := nullif(btrim(v_item #>> '{lead,origem_id}'), '');
      v_fone := nullif(btrim(v_item #>> '{lead,telefone}'), '');
      v_num := nullif(btrim(v_item #>> '{whatsapp,numero}'), '');
      v_wa_origem := nullif(btrim(v_item #>> '{whatsapp,origem}'), '');
      v_lead := null;

      -- 1. forma das partes e do whatsapp
      if jsonb_typeof(v_item -> 'partes') is distinct from 'array' then
        resultado := 'invalida:partes';
      else
        select array_agg(p.valor order by p.ordem) into v_partes
        from jsonb_array_elements_text(v_item -> 'partes') with ordinality as p(valor, ordem);
        if cardinality(v_partes) not between 2 and 3 then
          resultado := 'invalida:partes';
        elsif exists (select 1 from unnest(v_partes) u where btrim(u) = '') then
          resultado := 'invalida:partes';
        elsif char_length(array_to_string(v_partes, '')) > 650 then
          resultado := 'invalida:tamanho';
        end if;
      end if;
      if resultado is null and v_num is not null and v_num !~ '^\+[1-9][0-9]{7,14}$' then
        resultado := 'invalida:telefone';
      end if;
      if resultado is null and v_num is not null
        and exists (select 1 from public.bloqueios b where b.telefone_e164 = v_num) then
        resultado := 'invalida:bloqueado';
      end if;

      -- 2. acha o lead: place id, depois origem_id, depois telefone
      if resultado is null then
        if v_place is not null then
          select l.id into v_lead from public.leads l where l.google_place_id = v_place;
        end if;
        if v_lead is null and v_origem is not null then
          select l.id into v_lead from public.leads l where l.origem_id = v_origem order by l.criado_em, l.id limit 1;
        end if;
        if v_lead is null and v_fone is not null then
          select l.id into v_lead
          from public.leads l join public.telefones_lead t on t.lead_id = l.id
          where t.e164 = v_fone order by l.criado_em, l.id limit 1;
        end if;
        if v_lead is null then
          resultado := 'lead_nao_encontrado';
        end if;
      end if;

      if resultado is null then
        -- serializa as versões do lead
        perform 1 from public.leads l where l.id = v_lead for update;

        update public.mensagens_lead m set status = 'substituida'
        where m.lead_id = v_lead and m.status = 'aprovada';

        select coalesce(max(m.versao), 0) + 1 into v_versao from public.mensagens_lead m where m.lead_id = v_lead;
        insert into public.mensagens_lead (lead_id, versao, partes, status, modelo, observacao, autor_id, aprovada_em)
        values (v_lead, v_versao, v_partes, 'aprovada', nullif(v_item ->> 'modelo', ''),
          nullif(v_item ->> 'observacao', ''), p_autor, now())
        returning id into mensagem_id;

        -- whatsapp: cria ou marca o telefone e deixa só ele como principal
        if v_num is not null then
          update public.telefones_lead t set principal = false where t.lead_id = v_lead and t.e164 <> v_num;
          insert into public.telefones_lead (lead_id, e164, tipo, origem, principal)
          values (v_lead, v_num, 'whatsapp', v_wa_origem, true)
          on conflict (lead_id, e164) do update
            set tipo = 'whatsapp', origem = coalesce(excluded.origem, public.telefones_lead.origem), principal = true;

          update public.leads l set estado = 'no_poco', atualizado_em = now()
          where l.id = v_lead and l.estado = 'verificar'
            and exists (select 1 from public.telefones_lead t
              where t.lead_id = v_lead and t.tipo = 'whatsapp' and t.invalido_em is null
                and not exists (select 1 from public.bloqueios b where b.telefone_e164 = t.e164));
        end if;

        resultado := 'aprovada';
      end if;
    exception when others then
      mensagem_id := null;
      resultado := 'invalida:erro:' || sqlstate;
    end;
    return next;
  end loop;
end;
$$;

create function public.importar_modelos(p_autor uuid, p_nichos jsonb, p_modelos jsonb)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_n jsonb;
  v_m jsonb;
  v_nicho uuid;
  v_nome text;
  v_total int := 0;
begin
  if not exists (select 1 from public.perfis p where p.id = p_autor and p.papel = 'admin' and p.ativo) then
    raise exception 'Autor precisa ser um admin ativo.' using errcode = 'P0001';
  end if;
  if jsonb_typeof(coalesce(p_nichos, '[]')) <> 'array' or jsonb_typeof(coalesce(p_modelos, '[]')) <> 'array' then
    raise exception 'Itens inválidos.' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('importar_modelos', 0));

  for v_n in select e from jsonb_array_elements(coalesce(p_nichos, '[]')) e loop
    update public.nichos n set
      dor = coalesce(v_n ->> 'dor', n.dor),
      transformacao = coalesce(v_n ->> 'transformacao', n.transformacao)
    where n.nome = v_n ->> 'nome';
    if not found then
      raise exception 'Nicho desconhecido.' using errcode = 'P0001';
    end if;
  end loop;

  for v_m in select e from jsonb_array_elements(coalesce(p_modelos, '[]')) e loop
    v_nome := nullif(btrim(v_m ->> 'nicho'), '');
    v_nicho := null;
    if v_nome is not null then
      select n.id into v_nicho from public.nichos n where n.nome = v_nome;
      if v_nicho is null then
        raise exception 'Nicho desconhecido.' using errcode = 'P0001';
      end if;
    end if;
    if (v_m ->> 'tipo') is null or (v_m ->> 'tipo') not in ('abertura', 'robo', 'acompanhamento', 'preco') then
      raise exception 'Tipo de modelo inválido.' using errcode = 'P0001';
    end if;
    if nullif(btrim(v_m ->> 'texto'), '') is null then
      raise exception 'Texto do modelo vazio.' using errcode = 'P0001';
    end if;

    update public.modelos_mensagem mo set ativo = false
    where mo.ativo and mo.nicho_id is not distinct from v_nicho and mo.tipo = v_m ->> 'tipo'
      and mo.rotulo = coalesce(v_m ->> 'rotulo', '');
    insert into public.modelos_mensagem (nicho_id, tipo, rotulo, texto, ativo, autor_id)
    values (v_nicho, v_m ->> 'tipo', coalesce(v_m ->> 'rotulo', ''), v_m ->> 'texto', true, p_autor);
    v_total := v_total + 1;
  end loop;
  return v_total;
end;
$$;

revoke execute on function public.importar_mensagens(uuid, jsonb), public.importar_modelos(uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.importar_mensagens(uuid, jsonb), public.importar_modelos(uuid, jsonb, jsonb)
  to service_role;
