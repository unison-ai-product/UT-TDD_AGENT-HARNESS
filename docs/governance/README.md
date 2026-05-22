# Governance Documents

このディレクトリは UT-TDD Agent Harness の現行正本だけを置く。

## Current Source Of Truth

Claude Code / Codex / human reviewer は、通常タスクでは次の順に読む。

1. `ut-tdd-agent-harness-concept_v3.0.md`
2. `ut-tdd-agent-harness-requirements_v1.1.md`
3. `ut-tdd-agent-harness-extraction-plan_v0.1.md`
4. `../migration/helix-source-inventory.md`
5. `../migration/helix-porting-map.md`

## Reference Only

次の文書は背景・上位チーム運用の参考であり、UT-TDD の受入条件や実装導線の正本ではない。

- `ai-dev-team-concept_v1.1.md`
- `ai-dev-team-operations_v1.1.md`

## Archived Or Vendor Material

旧版、移植元、個人 HELIX 原稿は正本として使わない。

- 旧版は `../archive/` に置く。
- HELIX 移植元 snapshot は `../../vendor/helix-source/` に置く。
- `vendor/helix-source/` と `.helix/` は直接編集しない。
- `helix` command は社内版 UT-TDD の実行導線として記述しない。現行導線は `ut-tdd` command とする。

Claude Code が判断に迷った場合は、本 README と repo root の `CLAUDE.md` を優先し、archive / vendor / local runtime state を正本にしない。
