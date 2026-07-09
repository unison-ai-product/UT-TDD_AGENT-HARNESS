---
plan_id: PLAN-L6-50-execution-assignment-ledger
title: "PLAN-L6-50 (add-design): ID 単位実行割当台帳 (ZIP assign 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-09
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-42-typed-spec-declaration-source.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T19:46:18+09:00"
    tests_green_at: "2026-07-09T19:46:18+09:00"
    verdict: approve
    scope: "PLAN-L6-50 design freeze。ZIP assign/signals の ID 単位実行割当台帳を HARNESS の L6 function contract、L7 oracle、typed spec 台帳、工程表へ接続した。"
    green_commands:
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T19:46:18+09:00"
        evidence_path: docs/design/harness/L6-function-design/function-spec.md
        output_digest: "sha256:c34edfe309d913ff2e472858eb2394d967e6c1fdad7e5a23278d22b0d0993b8a"
        anchor_commit: 0d79caa85ee493d742f2ad60808e32dd555d52a7
agent_slots:
  - role: tl
    slot_label: "TL - 実行割当台帳の設計契約"
  - role: se
    slot_label: "SE - typed spec 宣言からの台帳導出設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-50-execution-assignment-ledger.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-42-typed-spec-declaration-source.md
  requires:
    - docs/plans/PLAN-L7-386-typed-spec-declaration-projection.md
  references:
    - docs/governance/vmodel-typed-spec-definitions.md
    - docs/governance/vmodel-upgrade-schedule.md
    - .ut-tdd/tmp/vmodel-zip-check/vmodel-docgen-clean/README.md
    - .ut-tdd/tmp/vmodel-zip-check/vmodel-docgen-clean/ハーネス導入ガイド.md
---

# PLAN-L6-50: ID 単位実行割当台帳 (ZIP assign 相当)

## 0. 背景 (ZIP 比較監査 2026-07-08、PO 指示による代理起票)

修正版 ZIP (vmodel-docgen-clean) の運用サイクル②「実行割当 (`assign.py` / `docs/assign.yaml`)」に
相当する機構が U0-U12d の起票に含まれていない。左翼の typed spec 宣言 (U8) と V 字対から
**ID 単位の実行タスク台帳**を導出し、実行記録の正本にする層が抜けている。
現状の PLAN 粒度 review_evidence では ID 粒度の実行証跡を持てない。

## 1. 設計スコープ (ZIP 仕様の HARNESS 翻訳)

1. typed spec 宣言 (spec_defs projection) と V 字対から、実装タスク (対応設計 / 完了条件
   テスト / V 字対) と検証タスク (トレース元 / 検証レベル) を ID 単位で導出する。
2. **証跡必須**: done/pass/fail には検証可能アンカー (テストコマンド / PR# / パス) 最低 1 つ。
   証跡なし完了主張は fail-close (「確認しました」だけを拒否)。
3. **冪等マージ**: 既存記録温存・新 ID 追加・宣言から消えた ID は archived へ退避 (監査証跡)。
4. authoring source は tracked file、検索 surface は harness.db projection (U5/U8 と同型)。

## 2. 受け入れ条件 (design freeze 時)

- 台帳 schema (実装/検証タスク・status・evidence・archived) の L6 contract が固定される。
- doctor gate (証跡なし done、宣言外 ID、非冪等更新の検出) の gate-id が定義される。
- `deriveExecutionAssignmentLedger` / `checkExecutionAssignmentLedger` の入出力と不変条件が L6 function-spec に追加される。
- L7 unit-test-design に `U-ASSIGN-LEDGER-*` oracle が追加され、後続 L7 実装の Red/Green が固定される。
- typed spec 台帳に VMS-014 / TVMS-014 として実行割当台帳の設計・検証 leaf が登録される。
- 工程管理表に U15a として現在地が追加され、DB projection / routeFiling が参照できる。

## 3. Design Freeze Result (2026-07-09)

本 PLAN は L6 設計 freeze として confirmed とする。実装は後続 L7 add-impl で行う。

HARNESS の実行割当台帳は、ZIP の `assign.py` / `docs/assign.yaml` を単純移植せず、既存の
typed spec projection (`spec_defs` / `spec_relations`) と V-pair / schedule projection を入力にした
authoring source + read-model 境界として定義する。台帳は「実行したこと」を主張する層ではなく、
設計 ID ごとに次に実行・検証すべきタスクと、done/pass/fail を名乗るための証跡条件を固定する層である。

### 3.1 台帳 row contract

L7 実装は tracked authoring source を `docs/governance/vmodel-execution-assignment-ledger.md` として追加する。
DB は projection であり正本ではない。row は最低限、以下の論理列を持つ:

| field | contract |
|---|---|
| `assignment_id` | `spec_id` + `task_kind` から作る stable ID。rebuild で変わらない。 |
| `spec_id` | `spec_defs.spec_id` に存在する ID。宣言外 ID は finding。 |
| `task_kind` | `implementation` / `verification` / `review` のいずれか。 |
| `target_artifacts` | 対応設計、実装、テスト、review packet のパス配列。空の場合は `assignment-target-missing`。 |
| `completion_criteria` | 完了条件。`implementation` は対応 test/oracle、`verification` は検証レベルと再実行対象を含む。 |
| `status` | `planned` / `in_progress` / `done` / `pass` / `fail` / `archived`。 |
| `evidence` | command / PR / path / issue など検証可能アンカー配列。`done/pass/fail` では必須。 |
| `archived_reason` | `archived` の場合のみ必須。宣言から消えた ID は削除せず archived へ退避する。 |

### 3.2 Gate contract

- `execution-assignment-evidence-missing`: `done/pass/fail` なのに evidence が空、または「確認しました」等の非アンカーのみ。
- `execution-assignment-unknown-spec`: `spec_id` が `spec_defs` に存在しない。
- `execution-assignment-target-missing`: `target_artifacts` または `completion_criteria` が空。
- `execution-assignment-archive-reason-missing`: `archived` なのに理由が無い。
- `execution-assignment-non-idempotent`: 同一入力で `assignment_id` / row 数 / archived row が揺れる。

### 3.3 Scope boundary

本 PLAN は台帳の L6 契約であり、実装コマンド、DB table 追加、doctor hard gate 登録は後続 L7 で扱う。
ただし設計の向きはここで固定する。検出系は既存 `review_evidence` や PLAN 粒度の green command に合わせて
台帳を薄めてはならない。設計 ID 単位の割当・証跡・再実行対象へ検出系を合わせる。

## U15 型付きスペック所有 artifact

```yaml
spec:
  defines:
    - id: VMS-014
      kind: execution-assignment-ledger
      traces_from: [VMS-004]
      tests: [TVMS-014]
```

VMS-014 は ID 単位実行割当台帳の L6 設計契約である。typed spec authoring source を上流に持ち、
対応 oracle は TVMS-014 である。
