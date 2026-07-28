# UT-TDD thin Windows PowerShell entrypoint (ADR-001).
# Prefer the compiled binary when present; otherwise run the TypeScript CLI through Bun.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$bin = Join-Path $root "dist\ut-tdd.exe"
if (Test-Path $bin) {
    & $bin @args
    exit $LASTEXITCODE
}
$bunCandidates = @((Join-Path $env:APPDATA "npm\node_modules\bun\bin\bun.exe"), (Join-Path $env:USERPROFILE ".bun\bin\bun.exe"))
$bun = $bunCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if (-not $bun) { throw "Native bun.exe not found. Install Bun before running the source entrypoint." }
& $bun run (Join-Path $root "src\cli.ts") @args
exit $LASTEXITCODE
