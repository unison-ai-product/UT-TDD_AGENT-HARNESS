# UT-TDD thin Windows PowerShell entrypoint (ADR-001). compiled binary 優先、無ければ bun run。
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$bin = Join-Path $root "dist\ut-tdd.exe"
if (Test-Path $bin) {
    & $bin @args
    exit $LASTEXITCODE
}
& bun run (Join-Path $root "src\cli.ts") @args
exit $LASTEXITCODE
