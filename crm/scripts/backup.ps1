# Backup do banco do CRM (receita oficial do Supabase: papéis, esquema e dados).
# Uso: powershell -File scripts/backup.ps1 [-Destino <pasta>] [-DiasGuardar 30]
# A pasta de destino fica FORA do repositório. A string de conexão vem de
# SUPABASE_DB_URL (ambiente) ou de crm/.env.novo.local; nunca é impressa.
# Requer Docker em execução (o CLI usa um contêiner com pg_dump).
param(
  [string]$Destino = (Join-Path $env:USERPROFILE 'Backups\vistra-crm'),
  [ValidateRange(1,3650)][int]$DiasGuardar = 30
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

$pasta = Join-Path $destinoAbs (Get-Date -Format 'yyyy-MM-dd_HHmmss')
if (Test-Path $pasta) { throw 'Pasta de backup já existe; tente de novo.' }
New-Item -ItemType Directory -Path $pasta | Out-Null

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
    $texto = (& npx supabase db dump --db-url $dbUrl @($p.args) -f $saida 2>&1 | Out-String)
    $codigo = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($codigo -ne 0 -or -not (Test-Path $saida)) {
      $mascarado = $texto -replace 'postgres(ql)?://\S+', '<conexao>'
      if ($dbUrl -match '^[a-z]+://[^:/@]+:([^@]+)@') { $mascarado = $mascarado.Replace($Matches[1], '<senha>') }
      $fim = ($mascarado.Split([char]10) | Where-Object { $_.Trim() } | Select-Object -Last 20) -join [Environment]::NewLine
      Write-Host $fim
      Remove-Item -Recurse -Force -LiteralPath $pasta -ErrorAction SilentlyContinue
      throw "Falha ao gerar $($p.arq) (código $codigo). Causas comuns: Docker parado, conexão ou senha inválida, rede. Pasta parcial removida."
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
