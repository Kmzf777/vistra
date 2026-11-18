// Roda o Next com as variáveis de .env.novo.local. Não dá para usar
// `node --env-file`: o Next repassa o --env-file aos workers e eles recusam.
// Uso: node scripts/com-ambiente-novo.js <dev|build|start> [args]
const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");
const { spawnSync } = require("node:child_process");

const raiz = path.resolve(__dirname, "..");
const vars = parseEnv(fs.readFileSync(path.join(raiz, ".env.novo.local"), "utf8"));
const args = process.argv.slice(2);
const r = spawnSync(
  process.execPath,
  [path.join(raiz, "node_modules/next/dist/bin/next"), ...args],
  { stdio: "inherit", cwd: raiz, env: { ...process.env, ...vars } }
);
process.exit(r.status ?? 1);
