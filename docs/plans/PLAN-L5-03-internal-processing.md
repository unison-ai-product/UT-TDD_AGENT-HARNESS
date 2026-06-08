---
plan_id: PLAN-L5-03-internal-processing
title: "PLAN-L5-03 (design/internal-processing): L5 詳細設計 — 内部処理 / D-API (処理ロジック + DbC pre/post/invariant docstring、edge 5-8)"
kind: design
layer: L5
sub_doc: internal-processing
drive: be
status: confirmed
created: 2026-05-29
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    reviewed_at: "2026-06-08"
    verdict: pass
    worker_model: gpt-5.5
    reviewer_model: claude-sonnet-4-6
    tests_green_at: "2026-06-08"
    scope: "G5 readiness for internal-processing D-API: processing flows, DbC pre/post/invariants, skill/drift D-API back-fill, L8 IT-CONTRACT/IT-ASSET pair; gate G5 hybrid cross_agent check passed."
agent_slots:
  - role: tl
    slot_label: "TL — D-API 処理ロジック / DbC 契約のレビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L5-00-master.md
  requires:
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L4-basic-design/function.md
  references:
    - docs/governance/document-system-map.md
related_adr: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-03 (design/internal-processing): L5 内部処理 / D-API

## §0 PLAN

L5 Master (`PLAN-L5-00-master`) §2 の ① 必須 sub-doc「internal-processing」を詳細化する design PLAN。出力 = `docs/design/harness/L5-detailed-design/internal-processing.md`。module-decomposition の公開関数 (D-API) に **処理ロジック + Design by Contract (precondition/postcondition/invariant)** を付与し、IMP-014 (②実装↔④テスト docstring、edge 5-8) を凍結準備する。

## §1 目的

module-decomposition の公開 IF を **処理仕様 + DbC 契約**へ詳細化する: ① 主要操作の処理フロー (入力検証→処理→state 更新→出力)、② 各操作の pre/post/invariant (Meyer DbC、document-system-map §3)、③ fail-close エラーパターン (exit code + next_action)、④ edge case (G3 carry IMP-014 の edge 5-8 = 異常/境界の docstring 形式)。L6 機能設計 (pseudocode) / L7 実装 (vitest) の入力。

## §2 背景

- 上流: module-decomposition (公開 IF) / function.md §2 (CLI コマンド) §7 (機能間依存)
- 業界標準: DbC (Meyer) + IEEE 1016 §5 (Design Description) + ISO 29119 (テスト可能契約)
- L5 carry: IMP-014 (②↔④ docstring edge 5-8 を L7 入口前に凍結 = G5 = DbC freeze 点、document-system-map §3)
- IMP-018: external-if (what) ↔ 本 doc (D-API how) の粒度境界 (if-detail と分担)

## §3 設計計画 (Step 1〜8)

### Step 1: D-API 対象操作の棚卸し
function.md §2 CLI コマンド + module 公開関数から DbC 記述対象の操作を選定 (plan draft/lint, gate, trace check, sprint check, doctor, agent-guard, detectMode 等)。

### Step 2: 操作別 処理フロー
各操作の処理ステップ (入力 → 検証 (zod) → state 読込 → 処理 → state 書込 → 出力/exit code)。

### Step 3: DbC precondition
各操作の事前条件 (呼び出し側が保証すべき: state 存在/frontmatter 妥当/gate 前提)。

### Step 4: DbC postcondition
各操作の事後条件 (操作が保証する: state 更新/証跡記録/exit code 意味)。

### Step 5: DbC invariant
処理を通じて常に真の不変条件 (data.md §6 集約不変条件の操作レベル表現)。

### Step 6: fail-close エラーパターン
異常系の統一形式 (`Error: <理由> (FR-XX)` + next_action + exit 1/2)。function.md AC の異常系と整合。

### Step 7: edge case docstring (IMP-014、edge 5-8)
②実装↔④テストの双方向 trace edge (requirements §2.3 の edge 5-8 = 正常/異常/境界/エラーの docstring) 形式を確定。G5 freeze 対象。

### Step 8: carry → L6/L7
処理ロジック → L6 pseudocode (IEEE 1016 §5.7) / DbC docstring → L7 実装 (関数 docstring + vitest)。

## §4 受入条件 / DoD

- [x] Step 1〜8 のすべてが `internal-processing.md` に存在
- [x] 主要操作 (最低 8 操作) に処理フロー + DbC pre/post/invariant が存在
- [x] fail-close エラーパターン統一形式が存在 (function AC 異常系と整合)
- [x] edge case docstring 形式 (IMP-014、edge 5-8) が確定し G5 freeze 準備
- [x] DbC が data.md §6 集約不変条件と整合 (二重定義でなく操作レベル写像)
- [x] §6 用語更新 / §7 機能要求更新 が存在
- [x] frontmatter `kind == design`、§0〜§7 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L5-00-master / 前 = module-decomposition / 並行 = if-detail
- 参照 docs: function.md / module-decomposition.md / document-system-map.md §3 (DbC)

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| Design by Contract (pre/post/invariant) | 参照 | Meyer 標準語 (document-system-map §3 で導入済)、独自定義せず参照 | back-merge 不要 |

> 内部処理設計は DbC 標準語の適用。新規ドメイン用語は導入しない。

## §7 機能要求更新 (FR registry delta)

> 現時点: **機能要求更新なし** (internal-processing は既存機能の処理仕様化。新規 FR-L1 は生まない見込み)。
