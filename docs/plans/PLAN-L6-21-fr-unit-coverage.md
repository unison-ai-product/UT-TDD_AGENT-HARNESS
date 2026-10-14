---
plan_id: PLAN-L6-21-fr-unit-coverage
title: "PLAN-L6-21 (add-design): FR registry to L6 unit coverage"
kind: add-design
layer: L6
drive: fullstack
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: TL - L6 FR coverage design
generates:
  - artifact_path: docs/design/harness/L6-function-design/fr-unit-coverage.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - docs/plans/PLAN-L6-00-master.md
    - docs/design/harness/L1-requirements/functional-requirements.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    worker_model: codex:gpt-5.4
    reviewer_model: claude:pmo-sonnet
    tests_green_at: 2026-06-09T13:00:00+09:00
    reviewed_at: 2026-06-09T13:10:23+09:00
    verdict: approve
    scope: G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR
      coverage and guardrail coverage reviewed
route_signal: feature_addition
route_mode: add-feature
status: confirmed
github_issue_id: 848
admission_receipt:
  schema_version: v2
  receipt_id: certificate:d78801f3d4f89515f258414e009b2876
  command_id: plan-revise:issue-848:PLAN-L6-21:r2:20261014-lease-d
  admitted_at: 2026-10-14T05:24:02.500Z
  source_digest: sha256:8019663d7150c29dd16b06d0fddb262cef97e93ab6d616c9e055830077a1b200
  decision_digest: sha256:15a975341abdcebe5bb1e0346cfe865b66f848bdbf3406f3f212fa123abc3f5d
  receipt_digest: sha256:87c47846586063a47d39ae52ccd57d1f253371397726af0049b37a467a2fa319
  binding:
    path: docs/plans/PLAN-L6-21-fr-unit-coverage.md
    plan_id: PLAN-L6-21-fr-unit-coverage
    asset_id: plan:legacy:a761d5f9a126929e47a8e2cb3f27e45e8645126ee24876dda7e6454d42413c5e
    revision: 2
    content_digest: sha256:8019663d7150c29dd16b06d0fddb262cef97e93ab6d616c9e055830077a1b200
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 848
    episode_id: issue-848
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-21-fr-unit-coverage
    revision: 1
    digest: sha256:b53c24f41b10c454da746f8010ae5ea210d0f61920916f6cfe70d57c7730f09a
  reentry:
    target_plan_id: PLAN-L6-21-fr-unit-coverage
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue
    #848の退役coverage契約を既存所有PLANへ限定追補。control6161445264とA手番返却6161538976に基づく正規改訂。"
---

# PLAN-L6-21 (add-design): FR registry to L6 unit coverage

## §0 位置づけ

L6 完遂の入口条件として、L1 FR registry 46 件を L6 unit-test-level contract へ 100% 接続する add-design。既存の `fr-registry-audit` は FR 一覧そのものの漏れを検出するが、L6 仕様への coverage は未検査だった。本 PLAN はその穴を閉じる。

## §3.1 実装計画（情報源）

情報源:

- `docs/design/harness/L1-requirements/functional-requirements.md`
- `docs/design/harness/L6-function-design/function-spec.md`
- `docs/test-design/harness/L7-unit-test-design.md`
- `src/lint/fr-registry-audit.ts`

実装:

- `docs/design/harness/L6-function-design/fr-unit-coverage.md`
- `docs/design/harness/L6-function-design/function-spec.md`
- `docs/test-design/harness/L7-unit-test-design.md`

## §3 工程表

### Step 1: [直列] FR registry 取得

直列理由: downstream_dependency。FR-L1 の正本件数が確定しないと L6 coverage 行を作れない。

### Step 2: [直列] L6 coverage matrix 作成

直列理由: downstream_dependency。Step 1 の FR 一覧に対して L6 spec / unit contract / U-* oracle を割り当てる。

### Step 3: [並列] L7 test-design 追補

U-FR-L1-* を L7 Red entry contract として参照する。

### Step 4: [直列] review

直列理由: downstream_dependency。coverage lint と doctor が green になってから self / cross-agent review を行う。

## §6 用語更新

- **L6 FR unit coverage**: L1 FR registry の各 FR を L6 spec path、unit-level contract、U-* oracle へ接続する coverage matrix。

## §8 DoD

- [x] FR-L1 47 件が L6 coverage matrix に全件存在する。
- [x] 各 FR が L6 spec path、unit contract、U-* oracle を持つ。
- [x] L7 unit test design が U-FR-L1-* を Red entry contract として参照する。
- [x] lint / typecheck / vitest / doctor / review が green。

## 2026-10-14 Issue #848 改訂差分

### 目的

既存PLAN-L6-21のcoverage契約ownerを拡張し、FR registryが明示する退役状態にもcoverage判定を定義する（Issue #848、control 6158936589、6159675813）。本改訂は既存DoDの完了証跡を拡大せず、新規追補のDoDは未達のまま記録する。

### 変更対象と設計・test-design参照

既存 `generates` が示すL6設計2文書とL7 test-designを対象とし、契約の詳細は `docs/design/harness/L6-function-design/fr-unit-coverage.md`、対応要約は `docs/design/harness/L6-function-design/function-spec.md`、候補Red設計と後続の昇格条件は `docs/test-design/harness/L7-unit-test-design.md` を参照する。変更はFR registryを起点とするretired coverage分岐、oracle宣言と対象FRの結び付け、および未実装から後続検証へ渡す順序に限る。契約の詳細HOWは各設計文書に置き、本PLANで重複記述しない。

工程順は、まずL7にRed候補を登録し、formal昇格PRでcoverage matrix・L7 declaration表・実test内oracle引用の3面を同時に切り替え、その後の別実装PRで実装と対象testをGreenにする。doctorとL6 descent／closure readerは同一のcoverage判定を用いる。候補登録は実testや実装済みを意味せず、Green完了証跡にもならない。

### 変更しない対象

現FR registryの行・退役状態、source、実test、実装、formal U-FR対応、CIはこの設計追補の対象外とする。PLANの正規改訂とその台帳記録は既存所有・参照・検証追跡に限定する。旧DoDのチェック状態は既存のL6 coverage成果に対する歴史的証跡として保持し、本追補の設計検収・Red登録・昇格・実装Greenへ流用しない。frontmatterの `owner`、`generates`、`status`、`review_evidence` と既存履歴は原文のまま保持する。

### 未達DoD

- [ ] Issue #848の設計追補がL6/L7設計文書で検収されている。
- [ ] L7の候補テスト設計がL6の各条件と対応し、独立した負例と正例を明示している（候補設計は実test実行やRed結果の証跡ではない）。
- [ ] 通常FRの既存coverageと正式oracleを維持すること、後続のRed登録→formal昇格→実装Greenの順序が設計間で一致している。
- [ ] 正規改訂のexact revisionに対する文書検査と新しい非著者レビューが記録されている。

formal昇格、退役分岐の実装Green、doctorとdescent readerの実測は、既存実装ownerのPLAN-L7-22とReverse-21へ渡す後続工程であり、本add-design改訂の完了証跡には含めない。

既存の完了DoDは上記の未達条件を満たした証拠として扱わない。正規改訂receiptは発行事実だけを示し、本追補のreview PASSや実装完了を意味しない。
