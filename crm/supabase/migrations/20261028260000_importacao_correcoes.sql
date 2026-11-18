-- Correções do importar_leads: tipo do telefone vem do converter, verificação sem duplicar, SQLSTATE no erro,
-- autor validado, descartado nunca volta (também por telefone, sem place id) e fim_por no descarte.
create or replace function public.importar_leads(p_autor uuid, p_itens jsonb)
returns table (indice int, lead_id uuid, resultado text)
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_item jsonb;
  v_i int := 0;
  v_lead uuid;
  v_estado text;
  v_place text;
  v_origem text;
  v_cidade uuid;
  v_nicho uuid;
  v_nome text;
  v_nicho_nome text;
  v_estado_inicial text;
  v_motivo text;
  v_grupo text;
  v_novo boolean;
  v_tel jsonb;
  v_e164 text;
  v_tipo text;
  v_outro record;
  v_ver jsonb;
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
    lead_id := null;
    resultado := null;
    begin
      v_nome := nullif(btrim(v_item ->> 'nome'), '');
      v_place := nullif(btrim(v_item ->> 'google_place_id'), '');
      v_origem := nullif(btrim(v_item ->> 'origem_id'), '');
      v_nicho_nome := nullif(btrim(v_item ->> 'nicho'), '');
      v_estado_inicial := coalesce(v_item ->> 'estado_inicial', 'no_poco');
      v_motivo := nullif(v_item ->> 'motivo_fim', '');
      v_ver := v_item -> 'verificacao';
      v_cidade := null;
      v_lead := null;

      if v_nome is null then
        resultado := 'invalido:nome';
      elsif v_estado_inicial not in ('no_poco', 'descartado')
        or (v_estado_inicial = 'descartado' and v_motivo is null) then
        resultado := 'invalido:estado';
      elsif exists (select 1 from jsonb_array_elements(coalesce(v_item -> 'telefones', '[]')) t
        where (t ->> 'e164') is null or (t ->> 'e164') !~ '^\+[1-9][0-9]{7,14}$') then
        resultado := 'invalido:telefone';
      elsif v_place is null and jsonb_array_length(coalesce(v_item -> 'telefones', '[]')) = 0 then
        resultado := 'invalido:identificador';
      end if;

      -- 7. cidade por nome
      if resultado is null then
        select c.id into v_cidade from public.cidades c
        where c.nome = v_item ->> 'cidade' and c.uf = v_item ->> 'uf';
        if v_cidade is null then
          resultado := 'invalido:cidade';
        end if;
      end if;

      -- 2. bloqueio por place id ou por qualquer telefone do item
      if resultado is null then
        if (v_place is not null and exists (select 1 from public.bloqueios b where b.google_place_id = v_place))
          or exists (select 1 from jsonb_array_elements(coalesce(v_item -> 'telefones', '[]')) t
            join public.bloqueios b on b.telefone_e164 = t ->> 'e164') then
          resultado := 'bloqueado';
        end if;
      end if;

      -- 3. sem place id, telefone de lead descartado ou encerrado: o descartado nunca volta
      if resultado is null and v_place is null then
        select l.id into v_lead
        from public.leads l
        join public.telefones_lead t on t.lead_id = l.id
        where l.estado in ('descartado', 'encerrado')
          and t.e164 in (select e ->> 'e164' from jsonb_array_elements(coalesce(v_item -> 'telefones', '[]')) e)
        order by l.criado_em, l.id
        limit 1;
        if v_lead is not null then
          lead_id := v_lead;
          resultado := 'ja_descartado';
        end if;
      end if;

      if resultado is null then
        -- 1. acha o lead existente: place id, senão telefone de lead sem place id
        v_lead := null;
        if v_place is not null then
          select l.id into v_lead from public.leads l where l.google_place_id = v_place;
        end if;
        if v_lead is null then
          select l.id into v_lead
          from public.leads l
          join public.telefones_lead t on t.lead_id = l.id
          where l.google_place_id is null
            and t.e164 in (select e ->> 'e164' from jsonb_array_elements(coalesce(v_item -> 'telefones', '[]')) e)
          order by l.criado_em, l.id
          limit 1;
        end if;

        select n.id into v_nicho from public.nichos n where n.nome = v_nicho_nome;
        v_novo := v_lead is null;

        if not v_novo then
          select l.estado into v_estado from public.leads l where l.id = v_lead;
          if v_estado in ('descartado', 'encerrado') then
            -- 3. o descartado nunca volta
            lead_id := v_lead;
            resultado := 'ja_descartado';
          else
            -- 4. atualiza o enriquecimento
            update public.leads l set
              google_place_id = coalesce(l.google_place_id, v_place),
              origem_id = coalesce(l.origem_id, v_origem),
              nota = coalesce((v_item ->> 'nota')::numeric, l.nota),
              avaliacoes = coalesce((v_item ->> 'avaliacoes')::int, l.avaliacoes),
              seguidores = coalesce((v_item ->> 'seguidores')::int, l.seguidores),
              seguidores_em = coalesce((v_item ->> 'seguidores_em')::date, l.seguidores_em),
              instagram = coalesce(nullif(v_item ->> 'instagram', ''), l.instagram),
              site = coalesce(nullif(v_item ->> 'site', ''), l.site),
              email = coalesce(nullif(v_item ->> 'email', ''), l.email),
              gancho = coalesce(nullif(v_item ->> 'gancho', ''), l.gancho),
              prioridade = coalesce((v_item ->> 'prioridade')::smallint, l.prioridade),
              nicho_id = coalesce(v_nicho, l.nicho_id),
              atualizado_em = now()
            where l.id = v_lead;
            resultado := 'atualizado';
          end if;
        else
          -- 5. novo
          v_lead := gen_random_uuid();
          insert into public.leads (id, nome, cidade_id, nicho_id, categoria, endereco, nota, avaliacoes, instagram,
            seguidores, seguidores_em, site, email, google_place_id, origem_id, prioridade, gancho, grupo, estado,
            motivo_fim, fim_em, fim_por)
          values (v_lead, v_nome, v_cidade, v_nicho, nullif(v_item ->> 'categoria', ''), nullif(v_item ->> 'endereco', ''),
            (v_item ->> 'nota')::numeric, (v_item ->> 'avaliacoes')::int, nullif(v_item ->> 'instagram', ''),
            (v_item ->> 'seguidores')::int, (v_item ->> 'seguidores_em')::date, nullif(v_item ->> 'site', ''),
            nullif(v_item ->> 'email', ''), v_place, v_origem, (v_item ->> 'prioridade')::smallint,
            nullif(v_item ->> 'gancho', ''), nullif(btrim(v_item ->> 'grupo'), ''), v_estado_inicial,
            case when v_estado_inicial = 'descartado' then v_motivo end,
            case when v_estado_inicial = 'descartado' then now() end,
            case when v_estado_inicial = 'descartado' then p_autor end);
          resultado := 'criado';
        end if;

        if resultado in ('criado', 'atualizado') then
          lead_id := v_lead;

          -- telefones novos (o tipo vem do converter); principal só se o lead ainda não tem um
          for v_tel in select e from jsonb_array_elements(coalesce(v_item -> 'telefones', '[]')) e loop
            v_e164 := v_tel ->> 'e164';
            v_tipo := v_tel ->> 'tipo';
            insert into public.telefones_lead (lead_id, e164, tipo, origem, principal)
            values (v_lead, v_e164, v_tipo, v_tel ->> 'origem',
              coalesce((v_tel ->> 'principal')::boolean, false)
              and not exists (select 1 from public.telefones_lead p where p.lead_id = v_lead and p.principal))
            on conflict (lead_id, e164) do nothing;

            -- 5. mesmo telefone em outro lead (place id diferente): os dois ganham o mesmo grupo
            if v_novo then
              for v_outro in
                select distinct o.id, o.grupo
                from public.telefones_lead t
                join public.leads o on o.id = t.lead_id
                where t.e164 = v_e164 and o.id <> v_lead
              loop
                v_grupo := coalesce(v_outro.grupo, 'tel:' || v_e164);
                update public.leads l set grupo = v_grupo where l.id = v_lead;
                update public.leads l set grupo = v_grupo where l.id = v_outro.id and l.grupo is null;
              end loop;
            end if;
          end loop;

          -- verificação nova, só se a mais recente do lead não tem o mesmo veredito e a mesma ferramenta
          if v_ver is not null and jsonb_typeof(v_ver) = 'object' then
            insert into public.verificacoes_site (lead_id, veredito, evidencias, verificado_em, ferramenta)
            select v_lead, v_ver ->> 'veredito', coalesce(v_ver -> 'evidencias', '[]'),
              coalesce((v_ver ->> 'verificado_em')::timestamptz, now()), v_ver ->> 'ferramenta'
            where not exists (select 1 from (
              select s.veredito, s.ferramenta from public.verificacoes_site s
              where s.lead_id = v_lead order by s.verificado_em desc, s.id desc limit 1) u
              where u.veredito = v_ver ->> 'veredito' and u.ferramenta is not distinct from v_ver ->> 'ferramenta');
          end if;

          -- 4. em verificação e agora com WhatsApp válido: volta para a fila
          update public.leads l set estado = 'no_poco', atualizado_em = now()
          where l.id = v_lead and l.estado = 'verificar'
            and exists (select 1 from public.telefones_lead t
              where t.lead_id = v_lead and t.tipo = 'whatsapp' and t.invalido_em is null
                and not exists (select 1 from public.bloqueios b where b.telefone_e164 = t.e164));

          -- 6. evento
          perform private.registrar_evento(v_lead, p_autor, 'importado', jsonb_build_object('origem_id', v_origem));
        end if;
      end if;
    exception when others then
      lead_id := null;
      resultado := 'invalido:erro:' || sqlstate;
    end;
    return next;
  end loop;
end;
$$;

revoke execute on function public.importar_leads(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.importar_leads(uuid, jsonb) to service_role;
