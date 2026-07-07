---
plan_id: PLAN-RECOVERY-10-right-lung-quality-assurance
title: "PLAN-RECOVERY-10 (recovery): 品質保証を右肺として確立 — L8+ 検証 PLAN 起票不能の収束と品質改善ループ (refactor 等) の右肺接続"
kind: recovery
layer: cross
drive: fullstack
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-07
updated: 2026-07-07
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL — reopen point 確認 + kind/layer envelope 設計影響レビュー (人間サインオフ必須)"
  - role: po
    slot_label: "PO — スコープ承認 + 右肺=品質保証の標準確定サインオフ (人間サインオフ必須)"
  - role: qa
    slot_label: "QA — 検証戦略節の要件定義と L8+ 検証 PLAN 発火条件の整合確認"
  - role: aim
    slot_label: "AIM — 品質改善ループ (検証所見→refactor/reverse 発火→Forward 合流) の配線整合確認"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-RECOVERY-09-test-design-right-arm-placement.md
    - docs/plans/PLAN-L5-10-drive-model-router-redesign.md
    - docs/plans/PLAN-L6-38-router-function-contracts.md
    - docs/plans/PLAN-L7-363-routine-gate-run-projection.md
    - docs/plans/PLAN-L7-367-refactor-candidate-lifecycle.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/test-design/harness/L8-integration-test-design.md
    - src/schema/frontmatter.ts
---

# PLAN-RECOVERY-10 (recovery): 品質保証を右肺として確立

## Status

draft 起票 (2026-07-07、PO 指示「品質保証が右肺になるようにリカバリーでちゃんと起票して載せてくれ」)。
tl/po 人間サインオフ待ち。

## Step 1: 全事象収集 (dev 回帰 = 品質保証が harness の管理 plane に載っていない)

| # | 事象 | 帰結 |
|---|---|---|
| 1 | **L8-L14 layer を取れる kind が存在しない** (`ALLOWED_LAYER_BY_KIND`: design→L1-L6 / impl 系→L7 / research→L1-L4 / 横断→cross)。検証実行 PLAN は構造的に起票不能 | L8+ PLAN 不在 = 「本当に検証したか」が機械的に不明。L7 tests は関数・機能の正常動作 (単体) のみ |
| 2 | 右肺 doc の**検証戦略節が不揃い** (L8 は G8-WORKFLOW あり / L9・L12・L14 は無し / L10 は doc 自体が無い — PLAN-RECOVERY-09 と連動) | 「いつ・何を・どの基準で L8+ 検証 PLAN を起票するか」が定義されず、右肺が PLAN を発火できない |
| 3 | routine gate G1-G8 の pass/fail が DB 未登録 (PLAN-L7-363 で既起票、Critical) | 検証実行の証跡が gate_runs に残らず、検証したことの機械的証明が無い |
| 4 | **品質改善ループが右肺に接続されていない**: 検証所見 (quality_signals / refactor 候補) → refactor / reverse 発火 → Forward 合流の配線が prose のみ (refactor 候補の永続 lifecycle・候補→PLAN リンク欠落 = PLAN-L7-367 で既起票) | 右肺の検証から「コード品質を上げ保守性を高める」refactor 等が機械的に生まれず、品質保証が閉ループにならない |

## Step 2: PO 提示・認識確認 (確定原理、2026-07-07)

- 左肺 = どういうシステムを作るか (計測・評価点を①に同梱)。**右肺 = どう評価・検証するか = 品質保証の
  plane**。右肺 doc = ③テスト設計 + 検証戦略。
- 右肺の検証活動の中で refactor 等が発生し、コード品質・保守性を高める。駆動モデル = branch であり、
  必ず Forward (main) へ合流する。
- 正本設計: internal-processing.md Appendix C (C.2b 両肺設計の義務 / 機械的欠陥 carry)。

## Step 3: reopen point 特定

- reopen point = **右肺の PLAN plane (L8-L14 の検証 PLAN 起票能力)**。左肺の設計資産・既存③・検証機構
  (doctor/gate/verification roadmap) は有効。欠けているのは「右肺を PLAN として起票し、証跡を残し、
  品質改善へ発火する」経路のみ。

## Step 4: top-down 修正

> **着手条件**: PLAN-RECOVERY-09 と同じく、実装前に修正手順定義 (影響調査・手順・検証・rollback) を
> 本 PLAN へ追記し tl/po サインオフを得る。定義完了前の本体変更は禁止 (fail-close)。

1. **検証 PLAN の kind/layer envelope 新設**: L8-L14 layer を正規に取れる検証実行 kind (名称・schema・
   lint は定義フェーズで確定) を frontmatter schema へ追加し、routeFiling の stage-aware intake
   (C.2b) から発火可能にする。
2. **検証戦略 + 検証設計節の標準化**: 右肺 doc 全件 (L8/L9/L10/L12/L14) に、検証戦略節 (G8-WORKFLOW
   同型: strategy → plan → conditions → procedures → evidence → exit → defect_routing) と
   **検証設計節** (検証環境・データ実在性・計測方法・評価基準・実行手順 — concept §2.3 検証本質の
   設計面。PO 2026-07-07「テスト側の片肺には検証設計も入れる」) を追補する。右肺 doc の必須 3 点 =
   ③テスト設計 + 検証戦略 + 検証設計 (internal-processing.md C.2b 正本)。
   (L10 doc 新設と rename は PLAN-RECOVERY-09 の scope、順序依存を定義フェーズで確定)。
3. **証跡接続**: 検証 PLAN の実行が gate_runs / workflow_runs へ永続化される配線 (PLAN-L7-363 と統合)。
4. **品質改善ループの接続**: 検証所見 → refactor 候補 lifecycle (PLAN-L7-367) → refactor/reverse PLAN
   発火 → Forward 合流、の defect_routing を機械化する (右肺から品質・保守性向上が生まれる閉ループ)。

## Step 5: fullback (再発防止 + 上位整合)

- concept §2.3 / requirements への「右肺 = 品質保証 plane」back-fill は Recovery exit 後の Reverse
  (fullback) で L設計正本へ昇華する。
- 再発防止 (doctor/lint を修正内で追加、PO 2026-07-07「ルール周りでちゃんと縛る」):
  1. 右肺 doc に 3 点セット (③テスト設計 + 検証戦略 + **検証設計**) の節が存在すること (fail-close)。
  2. L8+ 検証 PLAN が verification roadmap の発火と対応していること。
  3. **粒度一致の機械検査**: 右肺 doc の各節が左肺ペア層 doc を参照し、対象粒度マーカー (モジュール間
     契約 / 方式 / 画面 / FR-AC / 業務要求) がペア層と一致すること。意味的な粒度判定は design gate の
     レビュー観点として明文化 (機械は構造・参照・マーカーの一致まで)。
  4. **PLAN frontmatter の `pair_artifact` / `next_pair_freeze` の schema 検証**: 現行 schema は
     unknown key として素通りさせるため、フィールドを正規定義し「参照先 doc の実在 + 当該層の正しい
     対 (①⇔③ 対応表) であること」を plan lint で fail-close する。

## DoD

- [ ] tl/po 人間サインオフ (Step 2/3) が review_evidence に記録される。
- [ ] Step 4 の修正手順定義 (影響調査・手順・検証・rollback) が追記されサインオフされてから本体着手。
- [ ] L8-L14 layer を取れる検証 kind が schema/lint に存在し、`ut-tdd plan lint` が受理する。
- [ ] 右肺 doc 全件に検証戦略節があり、doctor が fail-close 検査する。
- [ ] 検証所見→refactor/reverse 発火→Forward 合流の defect_routing が機械記録される。
- [ ] concept/requirements への back-fill Reverse が起票される (exit 条件)。
