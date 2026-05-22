param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $Arguments
)

$ErrorActionPreference = 'Stop'

function Test-RawCodexExec {
  param([string[]] $Items)

  $i = 0
  while ($i -lt $Items.Count) {
    $token = $Items[$i]
    switch -Regex ($token) {
      '^(exec|e)$' { return $true }
      '^--$' {
        $i++
        return (($i -lt $Items.Count) -and ($Items[$i] -in @('exec', 'e')))
      }
      '^(-c|--config|--enable|--disable|--remote|--remote-auth-token-env|-i|--image|-m|--model|--local-provider|-p|--profile|-s|--sandbox|-C|--cd|--add-dir|-a|--ask-for-approval|--color|-o|--output-last-message)$' {
        $i += 2
        continue
      }
      '^(--config=|--remote=|--remote-auth-token-env=|--image=|--model=|--local-provider=|--profile=|--sandbox=|--cd=|--add-dir=|--ask-for-approval=|--color=|--output-last-message=)' {
        $i++
        continue
      }
      '^(--dangerously-bypass-approvals-and-sandbox|--full-auto|--no-alt-screen|--oss|--search|--skip-git-repo-check)$' {
        $i++
        continue
      }
      '^-' {
        $i++
        continue
      }
      default {
        return $false
      }
    }
  }
  return $false
}

function Resolve-RealCodex {
  $scriptPath = $PSCommandPath
  $scriptDir = Split-Path -Parent $scriptPath
  $skip = @(
    (Resolve-Path -LiteralPath $scriptPath).Path.ToLowerInvariant(),
    (Join-Path $scriptDir 'codex').ToLowerInvariant(),
    (Join-Path $scriptDir 'codex.ps1').ToLowerInvariant()
  )

  foreach ($command in Get-Command codex -All -ErrorAction SilentlyContinue) {
    $source = $command.Source
    if (-not $source) {
      continue
    }
    $full = try { (Resolve-Path -LiteralPath $source -ErrorAction Stop).Path } catch { $source }
    if ($skip -contains $full.ToLowerInvariant()) {
      continue
    }
    return $full
  }

  return $null
}

if ((Test-RawCodexExec $Arguments) -and ($env:HELIX_CODEX_INTERNAL -ne '1')) {
  $reason = [string] $env:HELIX_RAW_CODEX_REASON
  if (($env:HELIX_ALLOW_RAW_CODEX -eq '1') -and (-not [string]::IsNullOrWhiteSpace($reason))) {
    $realCodex = Resolve-RealCodex
    if (-not $realCodex) {
      Write-Error 'ERROR: real codex binary was not found'
      exit 127
    }
    & $realCodex @Arguments
    exit $LASTEXITCODE
  }

  [Console]::Error.WriteLine(@'
ERROR: raw `codex exec` is blocked because HELIX discipline is not injected.

Use one of these instead:
  helix codex --role <role> --task "..." --plan-only
  helix codex --role <role> --task "..." --approved --plan-id PLAN-001 --wbs-id WBS-003

Only when raw Codex is unavoidable, record the reason in evidence and run:
  HELIX_ALLOW_RAW_CODEX=1 HELIX_RAW_CODEX_REASON=<reason> codex exec ...
'@)
  exit 2
}

$realCodex = Resolve-RealCodex
if (-not $realCodex) {
  Write-Error 'ERROR: real codex binary was not found'
  exit 127
}

& $realCodex @Arguments
exit $LASTEXITCODE
