-- Ajudantes de teste (pgTAP). Fechados para todos os papéis da API.
create schema testes;

create function testes.criar_usuario(p_email text, p_nome text, p_papel text default 'vendedor')
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
  values (v_id, p_email, jsonb_build_object('nome', p_nome), 'authenticated', 'authenticated');
  if p_papel = 'admin' then
    update public.perfis set papel = 'admin' where id = v_id;
  end if;
  return v_id;
end;
$$;

create function testes.entrar_como(p_id uuid) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

revoke execute on function testes.criar_usuario(text, text, text) from public, anon, authenticated;
revoke execute on function testes.entrar_como(uuid) from public, anon, authenticated;
