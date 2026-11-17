# Backup do banco do CRM (receita oficial do Supabase: papéis, esquema e dados).
# Uso: powershell -File scripts/backup.ps1 [-Destino <pasta>] [-DiasGuardar 30]
# A pasta de destino fica FORA do repositório. A string de conexão vem de
# SUPABASE_DB_URL (ambiente) ou de crm/.env.novo.local; nunca é impressa.
# Requer Docker em execução (o CLI usa um contêiner com pg_dump).
param(
  [string]$Destino = (Join-Path $env:USERPROFILE 'Backups\vistra-crm'),
  [int]$DiasGuardar = 30
)
$ErrorActionPreference = 'Stop'
$crm = Split-Path -Parent $PSScriptRoot

# Recusa destino dentro do repositório.
$raizRepo = (& git -C $crm rev-parse --show-toplevel 2>$null)
$destinoAbs = [System.IO.Path]::GetFullPath($Destino)
if ($raizRepo) {
  $repoAbs = [System.IO.Path]::GetFullPath($raizRepo)
  if ($destinoAbs.StartsWith($repoAbs, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'O destino do backup não pode ficar dentro do repositório.'
  }
}

# Conexão: ambiente primeiro, depois o arquivo local (sem imprimir).
$dbUrl = $env:SUPABASE_DB_URL
if (-not $dbUrl) {
  $arq = Join-Path $crm '.env.novo.local'
  if (Test-Path $arq) {
    $linha = Get-Content $arq | Where-Object { $_ -match '^\s*SUPABASE_DB_URL\s*=' } | Select-Object -First 1
    if ($linha) { $dbUrl = ($linha -replace '^\s*SUPABASE_DB_URL\s*=\s*', '').Trim().Trim('"').Trim("'") }
  }
}
if (-not $dbUrl) { throw 'SUPABASE_DB_URL não encontrada no ambiente nem em .env.novo.local.' }

$pasta = Join-Path $destinoAbs (Get-Date -Format 'yyyy-MM-dd_HHmm')
New-Item -ItemType Directory -Force -Path $pasta | Out-Null

Push-Location $crm
try {
  $passos = @(
    @{ arq = 'papeis.sql';  args = @('--role-only') },
    @{ arq = 'esquema.sql'; args = @() },
    @{ arq = 'dados.sql';   args = @('--data-only', '--use-copy') }
  )
  foreach ($p in $passos) {
    $saida = Join-Path $pasta $p.arq
    $ErrorActionPreference = 'Continue'
    & npx supabase db dump --db-url $dbUrl @($p.args) -f $saida 2>&1 | ForEach-Object { $_ -replace 'postgres(ql)?://\S+', '<conexao>' } | Out-Null
    $ErrorActionPreference = 'Stop'
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $saida)) {
      throw "Falha ao gerar $($p.arq). O Docker está em execução?"
    }
    Write-Host ("{0}  {1} bytes" -f $p.arq, (Get-Item $saida).Length)
  }
} finally {
  Pop-Location
}

# Apaga só pastas de backup antigas dentro do destino.
$limite = (Get-Date).AddDays(-$DiasGuardar)
Get-ChildItem -Path $destinoAbs -Directory | Where-Object {
  $_.Name -match '^\d{4}-\d{2}-\d{2}' -and $_.LastWriteTime -lt $limite
} | ForEach-Object { Remove-Item -Recurse -Force -LiteralPath $_.FullName }

Write-Host "Backup em $pasta"
