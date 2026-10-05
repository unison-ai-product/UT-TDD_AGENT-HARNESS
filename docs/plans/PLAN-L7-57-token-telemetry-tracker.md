---
plan_id: PLAN-L7-57-token-telemetry-tracker
title: "PLAN-L7-57: cross-runtime token telemetry tracker — FR-L1-38 cost 効率の実データ化"
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
    scope: "cross-runtime token telemetry tracker (parseClaudeSessionUsage / parseCodexSessionUsage 純パーサ + computeClaudeCostUsd + loadRuntimeSessionUsage file-scan loader + projectTokenUsage ingest + projectModelEvaluations token 集計拡張 + model_runs/model_evaluations schema 列追加 + SCHEMA_VERSION 12→13 + 10 unit/integration テスト)。両 runtime の session JSONL を CLI 非起動で読む設計(8009001d 回避=ADR-001 整合)、Codex 累積→差分復元、core=token 効率/$=enrichment(Claude 計算/Codex null=非捏造)、cold-start 安全を検証。"
agent_slots:
  - role: tl
    slot_label: "TL - token telemetry tracker (FR-38 cross-runtime) 設計 + 配線"
generates:
  - artifact_path: src/state-db/token-tracker.ts
    artifact_type: source_module
  - artifact_path: tests/token-tracker.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-53-learning-engine.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-57: cross-runtime token telemetry tracker

## Objective

設計の柱3 (state DB をフィードバック機構に) の実体化。**FR-L1-38 (model 評価) の cost 効率を実データで
計算可能にする**。PLAN-L7-53 で named-defer していた「token/cost telemetry が無い」を、両 runtime の
session ログ走査で discharge する。

**動機 (PO /goal 2026-06-15、Web 調査で defer 解除)**: FR-38 cost 効率を「telemetry インフラ未配線」と
infra-blocked 扱いしていたが、取得方法は既知だった (PO「Web検索で調べて解決できるだろ」):

- **Claude 委譲**: Claude Code transcript JSONL に per-message `usage` (input/output/cache tokens)。
- **Codex 委譲**: Codex rollout JSONL の `token_count` イベントに session 累積 totals。

**cross-runtime 必須 (PO「Claudeに寄ってるがcodexで機能するの」)**: harness は multi-runtime
(claude-only/**codex-only**/hybrid)。`model_runs.runtime` 列がある以上 FR-38 は両 runtime で動かないと
片肺。**core metric = token 効率** (両 runtime とも token は確実に出す = provider 非依存)。**$ コストは
enrichment** (Claude=CLAUDE_PRICING 計算 / Codex=OpenAI 単価 source 未取得で null、捏造しない)。

**8009001d 整合 (PO「Codex CLI は Windows 8009001d で委譲不可を回避するために TS にしてんじゃないの」)**:
tracker は **`codex exec` / `claude` を再実行しない**。それをやると 8009001d で壊れた Codex CLI への依存が
復活し、ADR-001 (TS-native 再実装) の動機を裏切る。**両 runtime が既にディスクへ書いた session JSONL を
読むだけ** (OS 非依存・CLI 起動なし、ccusage と同方式)。

## WBS

| WBS ID | Work | Source target | Test target | Gate | 並直 |
|---|---|---|---|---|---|
| WBS-L7-57-01 | `parseClaudeSessionUsage` / `parseCodexSessionUsage` 純パーサ (Codex は累積→差分) + `CLAUDE_PRICING` + `computeClaudeCostUsd` + `loadRuntimeSessionUsage` file-scan loader (CLI 非起動) | `src/state-db/token-tracker.ts` | `tests/token-tracker.test.ts` | `vitest tests/token-tracker.test.ts` | [直列] |
| WBS-L7-57-02 | `model_runs` に token/cost 列 + `model_evaluations` に token 集計列 + SCHEMA_VERSION 12→13 (冪等 ADD COLUMN) | `src/schema/harness-db.ts` | `tests/state-db.test.ts` | `vitest tests/state-db.test.ts` | [直列] |
| WBS-L7-57-03 | `projectTokenUsage` ingest + `projectModelEvaluations` を token 効率集計 (tokens_per_success / cost_per_success) へ拡張、cold-start 安全 | `src/state-db/projection-writer.ts` | `tests/token-tracker.test.ts` | `vitest tests/token-tracker.test.ts` | [直列] |

## Acceptance Criteria

- [x] Claude transcript JSONL → per-message usage + cost (CLAUDE_PRICING、未知モデル null)。
- [x] Codex rollout JSONL の累積 token_count を連続差分で per-turn 復元、cost=null (単価 source 未取得・非捏造)。
- [x] loader は両 runtime の *.jsonl を走査、**CLI を一切起動しない**、不在ディレクトリは cold-start 安全 (空)。
- [x] `model_runs` の token/cost 列は review-evidence 由来行で NULL、token-tracker 投入行で非 NULL。
- [x] `projectModelEvaluations` が token 集計 (total_input/output/cost, tokens_per_success, cost_per_success)。
- [x] tokens_per_success は provider 非依存 (core)、cost_per_success は cost 不明 (Codex) で NULL (enrichment)。
- [x] opt-in 無効 / 0 model_runs は 0 行 (既存 FR-38 cold-start 不変条件を破らない)。
- [x] SCHEMA_VERSION 12→13、migration 冪等 (再適用 no-op、欠落列 ADD COLUMN)。
- [x] typecheck / biome / 全 vitest / doctor green。
- [x] review 前置: code-reviewer (intra_runtime_subagent, cross-model) verdict=APPROVE。

## 壊さない / 再発させない

- **tracker は CLI を再実行しない (ファイル走査のみ)**。`codex exec`/`claude --json` を呼ぶ実装に変えると
  8009001d で壊れた Codex CLI 依存が復活し ADR-001 を裏切る。loadRuntimeSessionUsage を CLI 起動に変えない。
- **$ コストは捏造しない**: Codex の cost は OpenAI 公式単価を source するまで null。CLAUDE_PRICING は
  単一正本 (claude-api 正本) で散在させない。token 効率 (core) は両 runtime で常に成立。
- **既存 FR-38 不変条件を保つ**: opt-in gate / cold-start 0 行 / success join を壊さない (token 列は加算のみ)。
- **tokens_per_success は意図的非対称 (review I-2、Option B)**: 分子=全 model_runs の output token (session ログ
  由来行 plan_id='' 含む)、分母=plan 紐づき success 数 (review-evidence)。session は PLAN に帰属しないため別母集団で、
  指標は「success PLAN あたり token コスト」proxy。これを「success run あたり token」と誤読しない (定義 = projection-writer
  JSDoc に明記)。session→PLAN 帰属が取れたら対称化 (carry)。

## Carry / 別 scope

> **DISCHARGED (2026-06-15、PLAN-L7-58)**: 下記 2 carry はいずれも PLAN-L7-58 で着地済み。

- ~~**OpenAI/Codex 単価表**~~ → **discharged (PLAN-L7-58)**: `OPENAI_PRICING` (公式 API pricing、2026-06-15
  取得) + `computeCodexCostUsd` を追加。未掲載モデルは null 維持 (捏造禁止)。
- ~~**scan の CLI 配線**~~ → **discharged (PLAN-L7-58)**: `ut-tdd telemetry scan` を追加 (session-dir を
  option>env>OS default で解決、CLI 非起動 file-scan)。
