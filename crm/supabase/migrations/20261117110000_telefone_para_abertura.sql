-- Número do wa.me para o dono do lead. O vendedor não lê bloqueios (só o admin, pelo RLS), então a tela
-- pergunta aqui: volta o WhatsApp atual, ou nulo quando qualquer telefone ou o place id do lead está
-- bloqueado (o mesmo predicado de lead_pronto e do "Enviei" de registrar_acao). Quem não é dono recebe nulo.
-- O lint 0029 (authenticated_security_definer_function_executable) é intencional: a leitura de bloqueios
-- só passa por aqui.
create function public.telefone_para_abertura(p_lead_id uuid) returns text
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_eu uuid := private.exigir_ativo();
  v_place text;
begin
  select l.google_place_id into v_place from public.leads l where l.id = p_lead_id and l.dono_id = v_eu;
  if not found then
    return null;
  end if;
  if exists (select 1 from public.bloqueios b
      join public.telefones_lead t on t.e164 = b.telefone_e164 where t.lead_id = p_lead_id)
    or (v_place is not null and exists (select 1 from public.bloqueios b where b.google_place_id = v_place)) then
    return null;
  end if;
  return (private.telefone_atual(p_lead_id)).e164;
end;
$$;

revoke execute on function public.telefone_para_abertura(uuid) from public, anon;
grant execute on function public.telefone_para_abertura(uuid) to authenticated;
