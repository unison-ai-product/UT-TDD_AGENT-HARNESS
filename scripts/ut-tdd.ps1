# UT-TDD thin Windows PowerShell entrypoint (ADR-001 / PLAN-L7-507).
# Node runs the TypeScript CLI directly; there is no compiled binary contract.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
& node (Join-Path $root "src\cli.ts") @args
exit $LASTEXITCODE
