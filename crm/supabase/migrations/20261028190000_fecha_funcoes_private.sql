-- Revoke explícito nas funções private (regra: revoke execute from public, anon em toda função).
revoke execute on function private.eu_admin(), private.eu_ativo(), private.exigir_ativo(),
  private.inicio_do_dia(timestamptz), private.somar_dias_uteis(timestamptz, int),
  private.dias_uteis_entre(timestamptz, timestamptz) from public, anon;

-- dias_uteis_entre dependia do TimeZone da sessão (generate_series com interval); agora só usa datas, e é stable.
create or replace function private.dias_uteis_entre(p_a timestamptz, p_b timestamptz) returns int
language sql stable set search_path = ''
as $$
  select count(*)::int
  from generate_series(0, ((p_b at time zone 'America/Sao_Paulo')::date - (p_a at time zone 'America/Sao_Paulo')::date) - 1) n
  where extract(isodow from (p_a at time zone 'America/Sao_Paulo')::date + 1 + n) < 6;
$$;
