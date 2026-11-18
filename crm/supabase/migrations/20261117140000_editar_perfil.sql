-- Tela de equipe: o admin corrige nome, curso e artigo de uma pessoa. O artigo é o de "Sou o [nome]" /
-- "Sou a [nome]" (lib/mensagens/preencher.ts), não o do curso. Só admin; escrita só por esta RPC.
create function public.editar_perfil(p_perfil_id uuid, p_nome text, p_curso text, p_artigo text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_curso text := btrim(coalesce(p_curso, ''));
begin
  perform private.exigir_admin();
  if v_nome = '' then
    raise exception 'Informe o nome.' using errcode = 'P0001';
  end if;
  if v_curso = '' then
    raise exception 'Informe o curso.' using errcode = 'P0001';
  end if;
  if p_artigo is null or p_artigo not in ('o', 'a') then
    raise exception 'Escolha "Sou o" ou "Sou a".' using errcode = 'P0001';
  end if;
  if char_length(v_nome) > 120 or char_length(v_curso) > 120 then
    raise exception 'Nome e curso têm no máximo 120 letras.' using errcode = 'P0001';
  end if;
  update public.perfis set nome = v_nome, curso = v_curso, artigo = p_artigo where id = p_perfil_id;
  if not found then
    raise exception 'Pessoa não encontrada. Atualize a tela.' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.editar_perfil(uuid, text, text, text) from public, anon;
grant execute on function public.editar_perfil(uuid, text, text, text) to authenticated;
