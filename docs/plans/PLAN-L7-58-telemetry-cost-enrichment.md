---
plan_id: PLAN-L7-58-telemetry-cost-enrichment
title: "PLAN-L7-58: token telemetry の $ cost enrichment + ut-tdd telemetry scan CLI 配線 (FR-L1-38 follow-up)"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L4-basic-design/architecture.md
status: confirmed
created: 2026-06-15
updated: 2026-06-15
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    tests_green_at: "2026-06-15"
    reviewed_at: "2026-06-15"
    verdict: pass
    scope: "Codex $ cost enrichment (OPENAI_PRICING 公式単価表 + computeCodexCostUsd + pricingKeyFor を variant 境界 -codex/-mini/-pro を跨がない安全 matcher へ一般化 + parseCodexSessionUsage cost 計算化 + summarizeRunUsage) と ut-tdd telemetry scan CLI 配線 (session-dir を option>env>OS default で解決、loadRuntimeSessionUsage→projectTokenUsage→projectModelEvaluations、CLI 非起動 file-scan)。code-reviewer verdict=APPROVE (Critical 0)。捏造防止不変条件 (未掲載モデル null)・OpenAI 課金式 (uncached×input + cached×cachedRate + output×output、reasoning 二重計上なし)・既存 oracle (gpt-5.4-codex→null) 非破壊・cold-start 安全を全数手計算で検証。Important 1 (cached>input 境界テスト) と Minor 2 (陳腐化コメント) を反映済み。"
agent_slots:
  - role: tl
    slot_label: "TL - FR-38 follow-up ($ enrichment + telemetry scan CLI)"
generates:
  - artifact_path: src/state-db/token-tracker.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/state-db/drive-registration.ts
    artifact_type: source_module
  - artifact_path: tests/token-tracker.test.ts
    artifact_type: test_code
  - artifact_path: tests/drive-db-registration.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-57-token-telemetry-tracker.md
  requires:
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-58: token telemetry の $ cost enrichment + telemetry scan CLI 配線

## Objective

PLAN-L7-57 が明示 carry として残した FR-L1-38 follow-up の 2 項目を discharge する。

1. **Codex の $ cost enrichment**: PLAN-L7-57 では Codex の cost を「OpenAI 公式単価 source 未取得」として
   null に固定していた。OpenAI 公式 API pricing (https://developers.openai.com/api/docs/pricing、standard
   tier、2026-06-15 取得) を `OPENAI_PRICING` 単一正本として取り込み、`computeCodexCostUsd` で Codex の
   per-turn cost をローカル計算する。core (token 効率) は L7-57 で既に両 runtime 成立済み。本 PLAN は $ enrichment。
2. **`ut-tdd telemetry scan` CLI 配線**: L7-57 で着地した `loadRuntimeSessionUsage`→`projectTokenUsage` を
   定期実行する CLI 入口。env 固有の session-dir 解決 (option > 環境変数 > OS default) を含む。

## 背景 / 制約

- PO /goal (2026-06-15): キャリーを片付ける。FR-38 本体は L7-57 で discharge 済み、本 follow-up が最後の残件。
- **捏造禁止 (不変条件)**: 公式 pricing 表に掲載のあるモデルのみ cost を出し、未掲載 (例 gpt-5.4-codex) は
  null を維持する。`pricingKeyFor` は variant 境界 (`-codex`/`-mini`/`-pro`) を跨いで誤マッチしない安全 matcher。
- **CLI 非起動 (ADR-001/8009001d 整合)**: telemetry scan は `codex exec`/`claude` を再実行せず、両 runtime が
  既にディスクへ書いた session JSONL を読むだけ (OS 非依存)。`loadRuntimeSessionUsage` を CLI 起動に変えない。
- **OpenAI 課金式**: cost = ((input − cached)×input単価 + cached×cached単価 + output×output単価) / 1e6。
  reasoning tokens は OpenAI の output_tokens に内包されるため別課金しない。caching 非対応 (pro、cached=null)
  は cached トークンも input 単価で課金。

## 工程表 Step

| Step | 内容 | impl | test | 検証 | 並/直 |
|---|---|---|---|---|---|
| L7-58-01 | `OPENAI_PRICING` 公式単価表 + `computeCodexCostUsd` + `pricingKeyFor` 安全一般化 + `parseCodexSessionUsage` cost 計算化 + `summarizeRunUsage` | `src/state-db/token-tracker.ts` | `tests/token-tracker.test.ts` | `vitest tests/token-tracker.test.ts` | [直列] |
| L7-58-02 | `ut-tdd telemetry scan` コマンド (session-dir 解決 + migrate + projectTokenUsage + projectModelEvaluations) + session telemetry 行を model_orphans から除外 (`role <> 'session'`) | `src/cli.ts`, `src/state-db/drive-registration.ts` | `tests/token-tracker.test.ts`, `tests/drive-db-registration.test.ts` | `vitest run` + `bun src/cli.ts telemetry scan --json` + `doctor` | [直列] |
| L7-58-03 | 設計同期 (function-spec FR-38 defer → DISCHARGED) + L7-57 carry discharge 注記 | `docs/design/harness/L6-function-design/function-spec.md` | — | `bun src/cli.ts doctor` (change-impact) | [直列] |

## Acceptance

- [x] `computeCodexCostUsd` が公式掲載モデル (gpt-5.4 / gpt-5.3-codex / pro) の cost を正しく計算。
- [x] 未掲載モデル (gpt-5.4-codex / gpt-4o) は null を返す (捏造しない、既存 oracle 非破壊)。
- [x] `pricingKeyFor` が variant 境界を跨がない (gpt-5.4-codex は gpt-5.4 単価へ誤マッチしない)。日付/version suffix は許容。
- [x] cached > input の delta 異常で負課金しない (uncached=max(0,…)、安全方向 undercharge)。
- [x] `ut-tdd telemetry scan` が session-dir を option>env>OS default で解決、token を model_runs へ ingest、model_evaluations を再集計 (opt-in 無効なら no-op)。
- [x] typecheck 0 / biome 0 / 全 vitest green / doctor exit 0 / change-impact OK。
- [x] review 前置: code-reviewer (intra_runtime_subagent, cross-model reviewer=sonnet/worker=opus) verdict=APPROVE。

## 壊さない / 再発させない

- **未掲載モデルは表に追加しない = cost null**。OPENAI_PRICING に推測単価を足さない (捏造禁止)。単価改定は
  公式 pricing を source して表を差し替える (単一正本)。
- **telemetry scan は file-scan のみ**。CLI (`codex exec`/`claude`) を再実行する実装に変えない (8009001d / ADR-001)。
- **pricingKeyFor の安全 matcher を pure-prefix に戻さない**。`gpt-5.4-codex`→`gpt-5.4` 誤マッチで $ 捏造が再発する。
- reasoning tokens を output と別課金しない (OpenAI は output_tokens が reasoning を内包)。
