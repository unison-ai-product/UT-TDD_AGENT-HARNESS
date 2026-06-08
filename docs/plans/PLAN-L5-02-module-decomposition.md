---
plan_id: PLAN-L5-02-module-decomposition
title: "PLAN-L5-02 (design/module-decomposition): L5 詳細設計 — モジュール分割 (architecture §3 building block の内部分割: 関数群/責務/公開 IF)"
kind: design
layer: L5
sub_doc: module-decomposition
drive: fullstack
status: confirmed
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "L5 module-decomposition freeze. Module boundary and dependency-direction contracts are paired to L8 IT-MODULE with GWT-level coverage."
created: 2026-05-29
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — module 内部分割 / 公開 IF 境界のレビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L5-00-master.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L5-detailed-design/physical-data.md
  references:
    - src/cli.ts
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
related_adr: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-02 (design/module-decomposition): L5 モジュール分割

## §0 PLAN

L5 Master (`PLAN-L5-00-master`) §2 の ① 必須 sub-doc「module-decomposition」を詳細化する design PLAN。出力 = `docs/design/harness/L5-detailed-design/module-decomposition.md`。architecture.md §3 の 7 building block (cli/schema/lint/plan/vmodel/runtime/doctor) を **内部関数群・責務・公開 IF・依存方向**へ詳細化する。

## §1 目的

architecture.md (Level 1/2 building block) を **実装単位のモジュール分割**へ詳細化する: ① 各 module の内部関数群 (export 関数・helper)、② 公開 IF (signature レベル概要)、③ module 内/間の依存方向 (schema 一方向・循環禁止の物理保証)、④ 未実装 module (workflow/session/telemetry/hook/review/skill/cutover) の責務境界。L6 機能設計 (関数仕様 pseudocode) の入力粒度に整える。

## §2 背景

- 上流: architecture.md §3 (7 building block + 依存方向) / physical-data.md (state 操作対象)
- 既存実装: `src/` の実 module 構成 (cli.ts/schema/lint×5/plan/vmodel/runtime×2/doctor)
- 業界標準: arc42 §5 Level 2 (Building Block 内部) / IEEE 1016 §5 (module 設計記述)
- L5 carry: ADR-002 候補 (依存方向ルールの ADR 化、G4 escalation ①)

## §3 工程表 (Step + 進捗)

### Step 1: [直列] module インベントリ
> 直列理由: downstream_dependency — module 集合が後続 Step 2〜8 の対象範囲になるため。
実装済 module (cli/schema/lint/plan/vmodel/runtime/doctor) + 未実装 module (workflow/session/telemetry/hook/review/skill/cutover/adapter) の一覧と実装状態。

### Step 2: [直列] 各 module の内部関数群
> 直列理由: downstream_dependency — Step 1 の module 集合ごとに関数群を切るため。
module ごとに export 関数 (公開 IF) + 内部 helper を列挙 (実装済は実関数、未実装は設計上の関数境界)。

### Step 3: [直列] 公開 IF (signature 概要)
> 直列理由: downstream_dependency — Step 2 の関数群から公開 IF を抽出するため。
各 module の公開関数の signature 概要 (引数/戻り値の型は L6/L7 で確定、本 doc は IF 境界まで)。

### Step 4: [直列] 依存方向の物理保証
> 直列理由: downstream_dependency — Step 1〜3 の module/IF 境界を import graph に写像するため。
schema 一方向・循環禁止 (architecture §3) を import グラフレベルで保証する分割。`fs` は副作用端点に隔離。

### Step 5: [直列] 未実装 module の責務境界
> 直列理由: downstream_dependency — Step 1〜4 の境界から未実装 module の carry を切るため。
workflow/session/telemetry/hook/review/skill/cutover/adapter の責務と配置 (function.md §1/§6 の将来 module を具体化)。

### Step 6: [直列] lint 共通様式の module 化
> 直列理由: downstream_dependency — Step 2〜4 の module 方針に既存 lint 実装を合わせるため。
5 lint (g3-trace/entity-coverage/fr-registry/doc-consistency/improvement-backlog) の `loadX`/`analyzeX` 共通パターンの module 構造。

### Step 7: [直列] ADR-002 候補 (依存方向ルール)
> 直列理由: downstream_dependency — Step 4/6 の依存方向整理を ADR 判断材料にするため。
G4 escalation ① = 依存方向ルールを ADR 化するか。本 PLAN で候補整理、確定は PO/TL。

### Step 8: [直列] carry → L6/L7
> 直列理由: downstream_dependency — Step 1〜7 の module 境界を L6/L7 へ引き継ぐため。
module 内部関数 → L6 関数仕様 (pseudocode) / L7 実装への carry。

### Step 9: [直列] review
> 直列理由: downstream_dependency — Step 1〜8 と L8 IT-MODULE 粒度の整合を確認してから review するため。
self / pmo-sonnet / TL reviewer のいずれかで、module 境界・依存方向・L8 IT-MODULE の対称性を確認する。

## §3.1 実装計画

- L5 では `module-decomposition.md` の module 境界記述を更新し、runtime 実装は行わない。
- L6 で関数仕様、L7 で TypeScript module 実装・import graph 検査へ落とす。
- G5 再 freeze は Step 9 review と L8 IT-MODULE 詳細粒度の監査後に行う。

## §4 受入条件 / DoD

- [x] Step 1〜9 のすべてが `module-decomposition.md` に存在
- [x] 実装済 7 module + 未実装 module の責務・公開 IF が存在
- [x] 依存方向 (schema 一方向・循環禁止) の物理保証方針が存在
- [x] architecture.md §3 building block との 1:1 整合 (二重定義なし)
- [x] ADR-002 候補の判断材料が存在 (G4 escalation ①)
- [x] §6 用語更新 / §7 機能要求更新 が存在 (要件 §1.10.G.9/G.10)
- [x] frontmatter `kind == design`、§0〜§7 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L5-00-master / 前 = architecture.md, physical-data.md / 後続 = PLAN-L5-03-internal-processing
- 関連 ADR: ADR-001 / ADR-002 候補 (依存方向)
- 参照 docs: architecture.md §3 / src/cli.ts

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| module / building block | 参照 | arc42 §5 標準語、独自定義せず参照 | back-merge 不要 |

> モジュール分割は architecture の内部詳細化で、新規ドメイン用語は導入しない。

## §7 機能要求更新 (FR registry delta)

> 現時点: **機能要求更新なし** (module-decomposition は実現方式の内部分割。新規 FR-L1 は生まない見込み)。
