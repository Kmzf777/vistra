// Confere com o próprio git que um arquivo de dados reais está ignorado antes de gravá-lo.
// O repositório é público: arquivo com telefone ou nome de lead só pode cair em pasta ignorada.
// https://git-scm.com/docs/git-check-ignore (saída 0 = ignorado, 1 = não ignorado, 128 = erro).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type Conferencia = { ok: true } | { ok: false; motivo: string };

function git(cwd: string, args: string[]) {
  return spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
}

export function confirmarIgnoradoPeloGit(arquivo: string): Conferencia {
  const alvo = path.resolve(arquivo);
  // a pasta mais próxima que existe, para perguntar ao git de qual repositório ela é
  let pasta = path.dirname(alvo);
  while (!fs.existsSync(pasta) && path.dirname(pasta) !== pasta) pasta = path.dirname(pasta);

  const topo = git(pasta, ["rev-parse", "--show-toplevel"]);
  if (topo.error) return { ok: false, motivo: `não deu para rodar o git (${topo.error.message})` };
  if (topo.status !== 0) return { ok: false, motivo: "a pasta não está em um repositório git, então não dá para conferir" };
  const raiz = path.resolve(topo.stdout.trim());
  const relativo = path.relative(raiz, alvo);
  if (!relativo || relativo.startsWith("..") || path.isAbsolute(relativo)) {
    return { ok: false, motivo: "o arquivo fica fora do repositório da pasta" };
  }

  const r = git(raiz, ["check-ignore", "-q", "--", relativo.split(path.sep).join("/")]);
  if (r.status === 0) return { ok: true };
  if (r.status === 1) return { ok: false, motivo: `${relativo} não está ignorado pelo git` };
  return { ok: false, motivo: `git check-ignore falhou (código ${r.status ?? "?"})` };
}
