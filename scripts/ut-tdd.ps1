# UT-TDD thin Windows PowerShell entrypoint (ADR-001).
# Node compiled ESM is the only supported runtime. No TypeScript/Bun fallback.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$cli = Join-Path $root "dist\ut-tdd.mjs"
if (-not (Test-Path $cli)) {
    throw "UT-TDD Node bootstrap is missing. Run npm ci and npm run build."
}
& node $cli @args
exit $LASTEXITCODE
