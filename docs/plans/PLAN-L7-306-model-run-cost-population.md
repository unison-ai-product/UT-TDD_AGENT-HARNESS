---
plan_id: PLAN-L7-306-model-run-cost-population
title: "PLAN-L7-306 (impl): model_runs コスト実データ化 — 委譲実行から usage/cost を ingest し routing へ還流"
kind: impl
layer: L7
drive: db
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期とコスト還流の運用方針承認"
  - role: tl
    slot_label: "TL - provenance 設計 (実行由来のみ一次証跡) レビュー"
  - role: se
    slot_label: "SE - adapter usage capture + projection 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-306-model-run-cost-population.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-57-token-telemetry-tracker.md
    - docs/plans/PLAN-L7-58-telemetry-cost-enrichment.md
    - docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
---

# PLAN-L7-306 (impl): model_runs コスト実データ化

## Status

**version-up parked (v2)**。A-181 DP-1。L7-57/58 (FR-38 cost telemetry、confirmed) の取得系はあるが、**model_runs テーブルへの population 経路が無い**という gap の是正。

## 背景 (実測 2026-07-03)

- `model_runs` は 634 行あり `input_tokens / output_tokens / cached_input_tokens / reasoning_tokens / cost_usd` の 5 列を持つが、**全行 null** (bun:sqlite で PRAGMA + 全行確認)。
- つまり CLAUDE.md の Model/Effort Routing (docs=Sonnet / 実装=GPT / review=frontier...) は一度も実コストで検証されたことがない。routing 表の妥当性・advisor の判断・「spark/mini lane が本当に安いか」がすべて推測のまま。
- 取得方法は既知 (FR-38 調査済): Claude 側は `claude --output-format json` の usage + total_cost_usd。Codex 側は同等の実行メタデータ。取得系 (L7-57/58 の telemetry scan) と DB 投影が接続されていないのが欠落点。

## スコープ (1 要件: 委譲実行の usage/cost を model_runs へ実データとして流し、routing の実測検証を可能にする)

1. **capture**: `ut-tdd codex` / `ut-tdd claude` の delegation adapter (L7-255 が per-call --model/--effort 注入を実装済みの層) で、実行完了時に runtime の usage 出力を parse し、run_id に紐付けて `.ut-tdd/` 側へ記録。usage が取れない実行 (interactive 等) は null のまま + `usage_capture: unavailable` を provenance に明記 (欠測と 0 を混同しない)。
2. **projection**: 記録から model_runs の 5 列へ投影 (`src/state-db/projection-writer.ts` の model_runs 書き込み箇所を拡張)。provenance 原則: 実行由来の値のみ投影し、推計値は入れない。
3. **還流ビュー**: `ut-tdd status` または advisor が参照できる集計 (model × role 別の median cost/tokens) を query として用意。routing 表の改訂判断は PO — 本 PLAN はデータを見えるようにするまで (勝手に routing を変えない)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | usage 出力形式の実機確認 (claude/codex 両方、Windows 実機) + provenance 設計 (TL) | 直列 |
| 2 | adapter capture 実装 | 直列 |
| 3 | projection 実装 | 直列 |
| 4 | 集計 query + 表示 | 直列 |
| 5 | regression test (実行が値を生む / 欠測が null + provenance / 推計値が混入しない) | 直列 |

## DoD

- [ ] 実委譲実行後に model_runs の該当行が非 null の usage を持つ (実走 evidence: 実行コマンドと SELECT 結果を review_evidence に記録)
- [ ] usage 取得不能な実行は null のまま provenance が unavailable を示す (test 固定)
- [ ] 集計 query が model × role 別コストを返す (test 固定)

## 実装ノート (後続モデル向け)

- 触るファイル: delegation adapter (`src/` 内の codex/claude adapter — Codex リファクタで位置が動くため着手時に `Grep "windowsVerbatimArguments"` 等で spawn 層を再特定)、`src/state-db/projection-writer.ts`、`src/cli.ts`。
- **Windows 第一級**: adapter spawn を触るので、Windows 実機で `bun run test` + 実 probe が必須 (Linux CI は .cmd 分岐を通らない既知の永続盲点)。
- run_id の突合: 既存 model_runs の run_id は `model-run:<plan_id>:<n>:<role>:<model>` 形式。capture 時に同じ形式で照合するか、実行 evidence 経由で後付け投影するかは Step 1 の設計判断 (決定を本文へ書き戻す)。
- 秘密情報境界: usage メタデータのみ記録し、プロンプト本文や API キーを DB/ログへ書かない。
