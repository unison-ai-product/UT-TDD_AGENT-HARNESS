# A-145 projection / substance follow-up audit

## 判定

2026-06-30 の外部 judge 所見を統合する。全体テーマは `projection != substance` である。
ローカル閉鎖の骨格は維持できるが、full close / production release close ではない。

## 高優先の是正対象

| id | severity | area | finding | disposition |
| --- | --- | --- | --- | --- |
| F-01 | HIGH | distribution | 配布 adapter が enforced guard (`agent-guard` / `work-guard` / `SubagentStop`) を十分に同梱していない。roster は届くが governance enforcement が consumer 側で弱い。 | follow-up required |
| F-02 | HIGH | distribution / OS | adapter hook は bare `ut-tdd` を起動するが、install flow が PATH / linked binary を保証しない。consumer hook 不発のリスクがある。 | follow-up required |
| F-03 | HIGH | green evidence | digest restamp は hash 一致だけを証明し、green command の再実行を証明しない。 | this audit binds rerun evidence for the current CI fix; broader hardening remains partial |
| F-04 | HIGH | DB telemetry | `skill_invocations` / `test_runs` / `guardrail_decisions` / model cost telemetry が projection facade または hollow schema になっている。 | follow-up required |
| F-05 | MED-HIGH | clean package | blanket `docs/governance/` allow が dogfood audit docs を配布へ漏らす可能性がある。 | follow-up required |
| F-06 | MED | design coverage | FE 設計 / FE 右腕検証の body substance が不足し、coverage gate は presence 寄りである。 | tracked as population / substance backlog |
| F-07 | MED | drive model | `signal -> mode` と `kind x drive` の入口適合が advisory 寄り。Research / Recovery の実体収束も soft。 | follow-up required |
| F-08 | MED | Claude / Codex adapter | `Agent` matcher など runtime tool-name 前提が環境依存。CLI / SDK 差分で空振りし得る。 | follow-up required |

## Current CI remediation binding

PR #2 の GitHub Actions failure は次の2件だった。

- `tests/runtime-adapter.test.ts`: Windows simulation on Linux CI で `path.join` が `C:\Windows/System32/cmd.exe` を生成した。
- `tests/cli-surface.test.ts`: `ut-tdd-tl` 追加後の allowlisted command count が 14 のままだった。

本差分では次を修正した。

- `src/runtime/adapter.ts`: simulated `win32` branch では `win32.join` を使い、`where.exe` / `cmd.exe` の path separator を Windows 形式に固定する。
- `tests/cli-surface.test.ts`: allowlisted command count を 15 に更新する。

## Rerun evidence bundled with digest rebinding

digest のみを更新せず、対象ファイルに対応する green command を同じ remediation cycle で再実行した。

| command | result |
| --- | --- |
| `bun run vitest run tests\runtime-adapter.test.ts tests\cli-surface.test.ts tests\distribution-acceptance.test.ts --reporter=dot` | PASS: 3 files / 42 tests |
| `bun run typecheck` | PASS before this audit packet; rerun again before commit |
| `bun run lint` | PASS before this audit packet; rerun again before commit |

`green-command-digest` mismatch は `src/runtime/adapter.ts` と `tests/cli-surface.test.ts` の実 hash 変更に由来する。上記 rerun の後に、該当する `output_digest` を現ファイル hash へ rebinding した。

This audit does not claim final production close. It records a local CI remediation packet and preserves F-01..F-08 as follow-up substance gaps.
