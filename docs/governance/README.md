# Governance Documents

このディレクトリは UT-TDD Agent Harness の現行正本だけを置く。

## Current Source Of Truth

Claude Code / Codex / human reviewer は、通常タスクでは次の順に読む。

1. `ut-tdd-agent-harness-concept_v3.1.md`
2. `ut-tdd-agent-harness-requirements_v1.2.md`
3. `ut-tdd-agent-harness-extraction-plan_v0.1.md`
4. `../adr/ADR-001-ut-tdd-harness-redesign-and-language.md` (再設計方針 + 実装言語 = TypeScript)
5. `repository-structure.md` (リポジトリ構成ルールの正本)

> **ADR-001 連動**: 実装は **source snapshot 概念のみ取り込み + TypeScript で全面再実装**。`../migration/helix-porting-map.md` と `helix-to-ut-tdd-cutover-strategy.md` の **Python code-port 部分は superseded**。これらは source capability inventory / 再設計思想の参考として残置し、code-port 計画としては使わない (PLAN-001..004 も同様に superseded)。

> **ADR-001 boundary**: implementation is UT-TDD-owned TypeScript/Bun. Migration docs and source snapshots are reference-only material for porting audits and regression ideas; they are not Current Source Of Truth and are not an execution route.

## Reference Only

次の文書は背景・上位チーム運用の参考であり、UT-TDD の受入条件や実装導線の正本ではない。

- `ai-dev-team-concept_v1.1.md`
- `ai-dev-team-operations_v1.1.md`

## Archived Or Vendor Material

旧版、参照 snapshot、個人 legacy source 原稿は正本として使わない。

- 旧版は `../archive/` に置く。
- source reference snapshot と legacy local state は直接編集しない。
- 旧 runtime command は社内版 UT-TDD の実行導線として記述しない。現行導線は `ut-tdd` command とする。

Claude Code が判断に迷った場合は、本 README と repo root の `CLAUDE.md` を優先し、archive / vendor / local runtime state を正本にしない。
