---
plan_id: PLAN-L7-97-deliverable-catalog-extension
title: "PLAN-L7-97 (troubleshoot): SI 標準成果物カタログ拡張 — L4 外部設計成果物 report/batch/notification/code-value を VALID_SUB_DOCS へ追加 + plan/lint.ts を schema 単一正本へ一本化 (誤った carry 先送りの是正)"
kind: troubleshoot
layer: L7
drive: be
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: code-reviewer subagent (sonnet) — intra_runtime_subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "PO『キャリー対応カタログ拡張の完遂 / PO 判断って本当に存在するのか調べろ』を受け、L4 標準成果物カタログ (report/batch/notification/code-value) を VALID_SUB_DOCS へ追加し plan/lint.ts の重複定義を schema 単一正本由来へ一本化。code-reviewer (sonnet) VERDICT=pass・Critical 0・blocking Important 0。Object.fromEntries 派生は撤去前ローカル定義と全 6 層同値・型安全 (Record<string,Set<string>>) と確認、VALID_SUB_DOC_VALUES enum への 4 型同時追加で subDocSchema↔isValidSubDocForLayer 整合、未使用 vocabulary 追加は既存チェックに非波及と判定。Important 1 件 = 本変更が露呈させた既存 doc↔schema drift (要件 §1.10.G.1 の L3 slug `business-requirement` vs schema `business`、L4 `screen` 残留) は本変更前から存在 = 非ブロッカー、IMP-141 へ登録。Minor (grounding コメント冗長) も反映 (2 行 + document-system-map §1b 参照へ短縮)。typecheck / Biome / Vitest 854 / doctor / db rebuild green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
agent_slots:
  - role: tl
    slot_label: "TL - 標準成果物カタログ拡張 + VALID_SUB_DOCS 単一正本化 (誤 carry 先送りの是正)"
  - role: qa
    slot_label: "QA - 4 型 valid/invalid + plan-lint parity の substance 検証"
generates:
  - artifact_path: docs/plans/PLAN-L7-97-deliverable-catalog-extension.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/index.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: tests/frontmatter.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/document-system-map.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/plans/PLAN-L2-00-master.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-97 (troubleshoot): SI 標準成果物カタログ拡張 + VALID_SUB_DOCS 単一正本化

## 0. Objective

L4 基本設計 (外部設計) の標準成果物 sub_doc 型を 4 つ (`report` 帳票 / `batch` バッチ /
`notification` メール・通知 / `code-value` コード値一覧) `VALID_SUB_DOCS` へ追加し、SI 標準成果物
カタログを業界標準どおりに完成させる。あわせて `src/plan/lint.ts` のローカル重複コピーを撤去し
schema を単一正本とする。

## 1. Problem (PO `/goal`「カタログ拡張の完遂 / PO 判断って本当に存在するのか調べろ」)

### (A) 誤った carry 先送り (PO 判断は実在しなかった)

`PLAN-L2-00-master §5` と handover が「標準成果物カタログ拡張 (帳票/batch/mail 等) = **別議題
(downstream プロダクト形状確定後)**」と carry していた。git 履歴を裏取りした結果:

- この「別議題 (downstream プロダクト形状確定後)」文言は `371d1df` (PLAN-L2-00 起票 commit) と
  handover にしか存在せず、**PO 発言の裏付けが git 上に無い** = AI 由来の先送り。
- 先送り根拠「downstream プロダクト形状確定後」は**自己スコープ論法** (harness 自身が CLI で帳票を
  持たないから不要)。これは PO が明確に否定した「土台のツールはミッション (= 別 SI 製品開発) で測る」
  ([[feedback_judge_tooling_by_mission_not_self_scope]]) に反する。
- 標準成果物 (帳票/バッチ/メール/コード値) は IPA 共通フレームの外部設計成果物として業界標準で
  確定済 (`document-system-map.md §1` line 13「画面/帳票/IF/データ/業務処理」)。downstream 製品形状に
  依存せず**今**確定できる。

→ 「PO 判断待ち」と称した先送りは実在の PO 判断でなく、業界標準で確定可能な実装を遅延させていた。

### (B) VALID_SUB_DOCS の二重定義 (潜在 drift)

`VALID_SUB_DOCS` が `src/schema/index.ts` (line 406 が「VALID_* は schema を単一正本」と規定) と
`src/plan/lint.ts` の 2 箇所に重複定義され、現状は全層同値だが catalog 拡張時に片肺 drift する構造。

## 2. Fix

### (A) L4 標準成果物カタログ拡張 (`src/schema/index.ts`)

`VALID_SUB_DOCS.L4` + `VALID_SUB_DOC_VALUES` に `report` / `batch` / `notification` / `code-value`
を追加。画面は L2 (画面専用層) が持つため、残る外部設計成果物を L4 に置く。これらは
`document-system-map §1b` の「**② プロダクト選択**」= 当該成果物を産出する製品のみ起票し、不産出製品
(この CLI harness 等) は `skip_sub_doc[].reason` で省略する (製品非依存の ① 必須ではない)。

### (B) plan/lint.ts を schema 単一正本へ一本化

`src/plan/lint.ts` のローカル `VALID_SUB_DOCS` を撤去し、`SCHEMA_VALID_SUB_DOCS` から
`Object.fromEntries(... new Set(...))` で派生 (Set 化のみ)。今後カタログを何種追加しても lint.ts は
無改修 = drift 根治 (要件 line 406 の「schema=単一正本」を実装で担保)。

### (C) doc grounding back-fill

- 要件 `§1.10.G.1` の L4 行に 4 型追記 + grounding 注記 (正本 = schema)。
- `document-system-map.md §1` L4 行に標準成果物明示 + 新規 `§1b 外部設計 標準成果物カタログ` 表
  (sub_doc slug ↔ 区分 ↔ 業界標準の対応、IPA 共通フレーム grounding)。

## 3. Acceptance Criteria

- [x] `report`/`batch`/`notification`/`code-value` が L4 design PLAN で valid sub_doc、L2 では invalid。
- [x] `src/plan/lint.ts` が schema 由来の単一派生になり重複定義が消えた (撤去前と全 6 層同値)。
- [x] substance test: 4 型 L4 valid / L2 invalid (frontmatter schema 経路) + analyzePlanGovernance が
  4 型受理 / L2 で `invalid_sub_doc` (plan lint 経路、U-PLANGOV-006)。
- [x] doc grounding: 要件 §1.10.G.1 + document-system-map §1/§1b 反映。
- [x] typecheck / Biome / Vitest / doctor / db rebuild green。
- [x] code-reviewer (intra_runtime_subagent) VERDICT=pass、露呈した既存 drift は IMP-141 へ登録。

## 4. Out of scope

- **要件 §1.10.G.1 ↔ schema の既存 drift 是正** (L3 slug `business-requirement` vs `business`、
  L4 `screen` 残留) = 本変更が露呈させた既存問題。正本どちらに寄せるかは PO 判断 → **IMP-141** で追跡
  (本 PLAN で silent fix しない、[[feedback_verify_intent_before_calling_gate_a_bug]])。
- **各標準成果物の sub-doc 必須 § 構造定義** (要件 §G.6 の report/batch/notification/code-value 版
  必須見出し) = 当該成果物を実際に起票する downstream 製品 PLAN 着手時に back-fill (vocabulary 追加が先)。
- **L5 (内部設計) 側の batch 内部処理設計型** = 既存 `internal-processing` で被覆、speculative 追加しない。

## 5. 壊さない / 再発させない

- **`VALID_SUB_DOCS` の正本は `src/schema/index.ts` 1 箇所**。plan/lint.ts に再びローカルコピーを
  置くな (catalog 拡張時の片肺 drift が再発する)。要件 §1.10.G.1 表はそれを mirror する従属物。
- **標準成果物カタログの要否は土台のミッション (別 SI 製品開発) で測る**。harness 自身が帳票/バッチ/
  メールを持たないことを理由に「不要・別議題」と先送りするな (自己スコープ論法 =
  [[feedback_judge_tooling_by_mission_not_self_scope]] 違反)。② プロダクト選択ゆえ harness 自身は
  skip するだけで、カタログには存在させる。
- **「別議題 / PO 判断待ち」を carry に書くなら PO 発言の出所を git/doc で裏取りせよ**。本件は裏付け
  無き AI 由来の先送りだった ([[feedback_verify_carry_status_against_code]])。
- **PLAN 追加/status 変更後は `ut-tdd db rebuild`** (plan-registry-fingerprint stale 回避、
  [[project_codex_branch_ci_verification]])。

## 6. 駆動モデル back-fill ペアリング (PO 監査 2026-06-22 是正)

本 PLAN は `VALID_SUB_DOCS` (exported 契約) を変更した。`KIND_BACKFILL[troubleshoot]="conditional"` =
契約変更を伴う conditional kind は Reverse 合流が必要 (warn)。当初その合流を省いていた (駆動モデルの
緩い使用、PO「駆動モデルは正しく使われている？」で指摘) ため、**`PLAN-REVERSE-46-deliverable-catalog-extension`**
で back-fill 合流を formal に登録した (本 PLAN を requires)。契約変更 → 設計/governance 正本への
back-fill が駆動モデルとして正しく 1 サイクル閉じている ([[feedback_impl_must_backfill_to_design]])。
