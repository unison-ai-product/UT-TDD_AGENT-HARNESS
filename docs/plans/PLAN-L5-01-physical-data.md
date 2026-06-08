---
plan_id: PLAN-L5-01-physical-data
title: "PLAN-L5-01 (design/physical-data): L5 詳細設計 — 物理データ設計 (.ut-tdd/ state の物理 schema = JSON フィールド型/必須任意/default、D-DB)"
kind: design
layer: L5
sub_doc: physical-data
drive: db
status: confirmed
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "L5 physical-data freeze. D-DB/state schema contracts are paired to L8 IT-STATE with GWT-level coverage."
created: 2026-05-29
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 物理 schema / zod 化 / file レイアウトのレビュー (別 runtime)"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L5-00-master.md
  requires:
    - docs/design/harness/L4-basic-design/data.md
  references:
    - src/schema/index.ts
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
related_adr: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-01 (design/physical-data): L5 物理データ設計

## §0 PLAN

L5 Master (`PLAN-L5-00-master`) §2 の ① 必須 sub-doc「physical-data」を詳細化する design PLAN。出力 = `docs/design/harness/L5-detailed-design/physical-data.md`。data.md §8 の `.ut-tdd/` state schema (論理) を **物理 schema** (JSON フィールド型・必須/任意・default・file レイアウト) に詳細化し、`src/schema` zod での読込検証を確定する (D-DB)。

## §1 目的

data.md の 5 集約 + state schema (§8) を **永続化レベルの物理 schema** へ詳細化する: ① 各 state file の JSON/YAML フィールド定義 (型・必須/任意・default・制約)、② file/ディレクトリ レイアウト (drive 別区画含む)、③ `.ut-tdd/harness.db` SQLite projection table、④ `src/schema` zod スキーマとの 1:1 対応 (読込時 validate)、⑤ ID 採番・index・参照整合の物理実装方針。

## §2 背景

- 上流: data.md §3 (値オブジェクト 12) / §4 (ID 規約) / §8 (state schema 論理)
- 既存実装: `src/schema/index.ts` (enum SSoT) + `frontmatter.ts` (PLAN frontmatter zod)
- 業界標準: D-DB (物理データ設計) / DbC (state invariant の物理表現)
- L5 carry: IMP-026 (VALID_SUB_DOCS の zod enum 化 = SubDoc 値オブジェクトの物理化)

## §3 工程表 (Step + 進捗)

### Step 1: [直列] state file レイアウト
> 直列理由: downstream_dependency — file レイアウトが後続 schema / zod 対応の入力になるため。
`.ut-tdd/` 配下の物理ディレクトリ/ファイル構成 (plan_registry / artifact / trace / phase.yaml / mode.yaml / handover / audit / drive 別区画) を確定。

### Step 2: [直列] 集約別 物理 schema (JSON フィールド)
> 直列理由: downstream_dependency — Step 1 の配置に基づいて file ごとの schema を定義するため。
5 集約 (Plan/Artifact/Workflow/Handover/Evaluation) ごとに state file の JSON フィールド (名前・型・必須/任意・default・制約)。

### Step 3: [直列] 値オブジェクトの物理表現
> 直列理由: downstream_dependency — Step 2 の schema に埋め込む値オブジェクト表現を決めるため。
data.md §3 の 12 値オブジェクトを物理 (enum string / ID パターン) で表現。SubDoc の zod enum 化 (IMP-026) を含む。

### Step 4: [直列] ID 採番 / index / 参照整合
> 直列理由: downstream_dependency — Step 2/3 の物理表現を前提に参照整合を設計するため。
ID 規約 (data.md §4) の物理採番 (連番/timestamp) + 集約間参照 (ID 参照) の物理整合方針 (孤児検出)。

### Step 5: [直列] zod スキーマ対応
> 直列理由: downstream_dependency — Step 2〜4 の物理 schema を `src/schema` に写像するため。
各 state file ↔ `src/schema` zod スキーマの 1:1 対応表。読込時 validate / 書込時の型保証。

### Step 6: [直列] drive 別区画 (FR-L1-40)
> 直列理由: downstream_dependency — Step 1〜5 の state 方針を drive partition へ拡張するため。
`.ut-tdd/drive/<drive>/` の物理区画 schema + skip_sub_doc 機械強制の物理表現。

### Step 7: [直列] 不変条件の物理検証点
> 直列理由: downstream_dependency — Step 2〜6 の schema と区画に対して不変条件を置くため。
data.md §6 不変条件を物理 schema レベルで検証する点 (zod superRefine / doctor check)。

### Step 8: [直列] carry → L7 実装
> 直列理由: downstream_dependency — Step 1〜7 の物理 schema を実装 carry に変換するため。
物理 schema → `src/schema` 実装 (zod 定義追加) / `ut-tdd doctor check_business_entity_coverage` への carry。

### Step 9: [直列] review
> 直列理由: downstream_dependency — Step 1〜8 と L8 IT-STATE 粒度の整合を確認してから review するため。
self / pmo-sonnet / TL reviewer のいずれかで、D-DB 粒度・state 検証点・L8 IT-STATE の対称性を確認する。

## §3.1 実装計画

- L5 では `physical-data.md` の物理 schema 記述を更新し、runtime 実装は行わない。
- L6/L7 で zod schema / state loader / doctor 検査へ落とす。
- G5 再 freeze は Step 9 review と L8 IT-STATE 詳細粒度の監査後に行う。

## §4 受入条件 / DoD

- [x] Step 1〜9 のすべてが `physical-data.md` に存在
- [x] 5 集約の物理 schema (JSON フィールド型/必須任意/default) が存在
- [x] 12 値オブジェクトの物理表現 + SubDoc zod 化方針 (IMP-026) が存在
- [x] state file ↔ `src/schema` zod 1:1 対応表が存在
- [x] data.md §6 不変条件の物理検証点が明示
- [x] §6 用語更新 / §7 機能要求更新 が存在 (要件 §1.10.G.9/G.10)
- [x] frontmatter `kind == design`、§0〜§7 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L5-00-master / 前 = data.md (L4) / 後続 = PLAN-L5-02-module-decomposition
- 関連 ADR: ADR-001 (YAML/JSON state + SQLite projection DB)
- 参照 docs: data.md §8 / src/schema/index.ts

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| 物理 schema (physical schema) | 参照 | D-DB 標準語、独自定義せず参照 | back-merge 不要 |

> 物理データ設計は data.md の論理モデルを物理化するもので、新規ドメイン用語は導入しない。

## §7 機能要求更新 (FR registry delta)

> 現時点: **機能要求更新なし** (physical-data は FR-L1-06/40 の state 設計の物理化。新規 FR-L1 は生まない見込み)。
