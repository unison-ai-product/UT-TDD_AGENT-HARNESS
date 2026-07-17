---
plan_id: PLAN-RECOVERY-12-design-doc-reality-backmerge
title: "PLAN-RECOVERY-12 (recovery): 設計 doc 実態乖離の一括 back-merge — L5 physical-data 未文書テーブル / L6 function-spec stale model ID / governance 正本欠落 (issue #85)"
kind: recovery
layer: cross
drive: agent
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-17
updated: 2026-07-17
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
backprop_decision: not_required
backprop_decision_reason: "実装先行で doc が未追随になった乖離の back-merge であり、新規 L0/L1 要件ではない。各 doc の SSoT 記述を実装事実へ収束させ、再発防止は既存 gate (model-id-ssot-drift) の対象拡張で追跡する。"
agent_slots:
  - role: aim
    slot_label: "AIM — governance README 未分類 23 件の分類提案 (最終分類判断は PO 確認)"
  - role: se
    slot_label: "SE — L5 physical-data への schema back-merge と L7-256 gate 対象拡張"
  - role: qa
    slot_label: "QA — gate 拡張の負例 (stale literal 検出) real-repo regression"
  - role: tl
    slot_label: "TL — doc-only 変更の SSoT 整合レビュー (doc↔schema↔lint 三点一致)"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-12-design-doc-reality-backmerge.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L3-05-harness-telemetry-closure.md
    - docs/plans/PLAN-L7-256-model-id-ssot-drift-gate.md
    - docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
review_evidence: []
---

# PLAN-RECOVERY-12 (recovery): 設計 doc 実態乖離の一括 back-merge

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/85

## 背景 (2026-07-17 設計実態フルチェック監査での実測)

設計ドキュメント本文と実装の突き合わせレビュー (機械検出でカバーされない内容照合)
で、「実装先行・doc 未追随」型の乖離が複数確認された。いずれも本番影響なしだが、
L5 物理データ doc と governance 正本が SSoT として実態を語れていない。

## 是正対象

1. **L5 physical-data.md — 未文書テーブル 4 件 + 列差分**
   - `issue_queue` / `trouble_events` / `retry_events` / `improvement_log`
     (`src/schema/harness-db-tables-core.ts:365-420`、由来 PLAN-L3-05) の
     PK・列・型・index・invariant を §9.1 系へ正式 back-merge。
   - `test_runs` / `test_cases` / `test_results` / `test_artifact_edges` /
     `automation_assets` / `model_runs` (token telemetry 列) の doc 列挙を実装列へ追随。
   - `feedback_events.source_color` を §9.1 表へ追記し §9.5 prose と一本化。
2. **L6 function-spec.md — stale model ID literal**
   - `function-spec.md:681-683,726` の `gpt-5.5` / `claude-sonnet-4-6` / `gpt-5.4`
     を現行値 (`gpt-5.6-sol` / `claude-sonnet-5` / `gpt-5.6-luna`) へ更新。
     再発防止のため生 literal でなく `MODEL_IDS` シンボル参照で記述する。
   - `src/task/tier-router.ts:9-10,146` コメントの同 literal 残留も同時に是正。
   - **gate の穴**: PLAN-L7-256 (model-id-ssot-drift-gate、confirmed) の検査対象に
     この doc 箇所が入っていなかった。gate の対象へ L6 doc の model ID 記述を追加し、
     負例 (stale literal を仕込むと violation) を real-repo regression で実証する。
3. **repository-structure.md — root `skills/` 欠落**
   - canonical tree へ root `skills/` を追加 (現状は `docs/skills/` の「[予定]」行のみ)。
   - doctor `tracked-canonical` が欠落を pass した検査粒度を確認し、必要なら追跡 IMP 起票。
4. **governance/README.md — 正本ナビゲーションの欠落**
   - `ut-tdd-agent-harness-extraction-plan_v0.1.md` (CLAUDE.md Read Order 正本) を
     正本リストへ追加。行 16/17 の番号 "7." 重複を修正。
   - 未分類 23 ファイルは機械的に埋めず、分類提案リスト (正本/参照のみ/アーカイブ) を
     本 PLAN に記録して PO 確認へ回す (最終分類は PO 判断)。
5. **agent-slots の参照先消失**
   - `agent-slots.md:31,84` / `src/runtime/agent-slots.ts:9` が参照する
     「`.claude/CLAUDE.md`「上限 8」」記述が現行 doc に存在しない。並列上限記述の
     要否は設計判断 (PO 確認) とし、復元 or 参照文言の書き換えのどちらかで閉じる。
6. **work-guard override marker の実態記述**
   - `.claude/CLAUDE.md` Guard Rules へ、marker が発行者セッション限定でなく
     「次の foreign edit 呼び出し全般で早い者勝ち消費」である実態を 1 行明記
     (実測: 2026-07-17T01:33:51 別セッションによる横取り消費、
     `.ut-tdd/logs/foreign-edit-overrides.jsonl`)。機構変更は PLAN-L7-419 側の
     スコープであり本 PLAN は記述の精度向上のみ。

## 是正方針 (Step 案)

### Step 1: [並列] L5 physical-data back-merge
- 対象 1 の schema back-merge。doc 記述は `src/schema/harness-db-tables-core.ts` の
  実装列を正として転記し、由来 PLAN (L3-05) を出典として明記する。

### Step 2: [並列] governance / L6 doc 是正
- 対象 2 (doc 部分)・3・4・5・6 の doc 修正。対象 4 の未分類 23 件は分類提案までに
  留め、PO 採択後に別 slice で反映する。

### Step 3: [直列] model-id gate 対象拡張
- 直列理由 = **downstream_dependency** (Step 2 で literal を現行化した後でないと
  gate 拡張が既存 doc で即 Red になる)。L7-256 gate の検査対象へ L6 doc を追加し、
  負例 regression を追加する。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。`ut-tdd plan lint` / doctor (readability /
  sub-doc-schema-integrity / tracked-canonical / rule-drift) / vitest green を確認。

## AC

- [ ] physical-data.md に 4 テーブルの列定義が実装 (`harness-db-tables-core.ts`) と
      一致して記載され、列差分 7 系統が解消 (doc↔schema 突合で差分 0)。
- [ ] function-spec.md / tier-router.ts コメントに旧 model ID literal が残らない
      (`grep gpt-5.5` 等で 0 件)。
- [ ] model-id-ssot-drift gate が L6 doc の stale literal を検出する負例 regression が
      green (prose 主張でなく real-repo test、coding ≠ substance)。
- [ ] repository-structure.md canonical tree に root `skills/` が記載される。
- [ ] governance/README.md の正本リストに extraction-plan が載り、番号重複が解消。
      未分類 23 件の分類提案リストが本 PLAN に記録される。
- [ ] doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。
