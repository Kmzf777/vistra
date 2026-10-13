# motion/ da Vistra

Convenção: **cada marca tem a sua pasta `motion/` na raiz da marca.** A da Vistra é esta, na raiz
deste repositório. As marcas de clientes têm a própria no repositório de produtos (PetShop-coldcall),
em `clientes/<cliente>/motion/`.

Dentro de `motion/`:

- `marca/`: a identidade da marca para vídeo. `identidade.json` (cores, fontes, logos, voz; é o
  contrato que o motor lê), `dossie.md` (posicionamento, tom, ganchos, cuidados), logos
  (`logo-clara.png` para fundo escuro, `logo-escura.png` para fundo claro, `logo.svg`) e `fontes/`.
- O **motor** (`remotion/`, `ferramentas/`, `biblioteca/`, `pecas/`) foi plantado pela skill
  `estudio-reels` e é operado pela cópia `.claude/skills/estudio-reels-vistra/`.

Os caminhos `motion/...` que a skill `estudio-reels` cita são **relativos à raiz da marca**: aqui,
a raiz do repositório.

Fonte da verdade da marca (texto): `conteudo/introducao-marca.md` e
`conteudo/comunicacao-explicativa.md`. Se mudar lá, atualize o `dossie.md`.
