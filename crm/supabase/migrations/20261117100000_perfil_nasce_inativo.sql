-- Só convite ativa. O perfil que o gatilho cria nasce inativo: um cadastro feito com a chave pública
-- (auth.signUp) não ganha acesso a nada. O convite (tela de equipe e scripts/convidar.ts) ativa o perfil
-- com a chave secreta, pelo id que o generateLink devolve. Os perfis que já existem ficam como estão.

alter table public.perfis alter column ativo set default false;

create or replace function private.criar_perfil() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_artigo text := v_meta ->> 'artigo';
begin
  insert into public.perfis (id, nome, curso, artigo, email, ativo)
  values (
    new.id,
    coalesce(nullif(v_meta ->> 'nome', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(v_meta ->> 'curso', ''),
    case when v_artigo in ('o', 'a') then v_artigo else 'o' end,
    coalesce(new.email, ''),
    false
  );
  return new;
end;
$$;
revoke execute on function private.criar_perfil() from public, anon, authenticated;

-- Ajudante de teste: simula o convite, que ativa o perfil depois de criar o usuário.
create or replace function testes.criar_usuario(p_email text, p_nome text, p_papel text default 'vendedor')
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
  values (v_id, p_email, jsonb_build_object('nome', p_nome), 'authenticated', 'authenticated');
  update public.perfis
  set ativo = true, papel = case when p_papel = 'admin' then 'admin' else papel end
  where id = v_id;
  return v_id;
end;
$$;
revoke execute on function testes.criar_usuario(text, text, text) from public, anon, authenticated;
