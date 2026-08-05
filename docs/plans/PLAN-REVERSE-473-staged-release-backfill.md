---
plan_id: PLAN-REVERSE-473-staged-release-backfill
title: "PLAN-REVERSE-473: 段階リリース管理 設計backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R0
confirmed_reverse_type: fullback
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-04
updated: 2026-08-04
owner: PO / Claude
parent_design: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - 既存sync-pack/buildPackSyncPlanとの責務境界をbackfill"
  - role: qa
    slot_label: "QA - L6/L7対とrollback非破壊契約を検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - src/setup/distribution.ts
    - src/cli/distribution.ts
review_evidence: []
---

# PLAN-REVERSE-473: 段階リリース管理 設計backfill

本 PLAN は `PLAN-L7-473-staged-release-channel-manifest` (add-impl) の Reverse 対である
(`kind=add-impl` は Reverse 対必須)。S1 時点では設計降下がまだ行われていないため、R0 の
観測のみを記録し、R1 以降は S2 (schema/CLI 実装) の着手後に進める。

## R0-R4 (S1 時点は R0 のみ着手)

- R0: 既存 `sync-pack` / `buildPackSyncPlan` (`src/setup/distribution.ts`,
  `src/cli/distribution.ts`) が既に持つ非破壊 copy-plan/staging・rollback managed paths・
  human-approved command list を観測し、新設する release channel manifest 契約との
  重複領域と境界を確定する。`PLAN-L6-63-pack-staged-release-rollback` が扱う「Pack repo 側
  tag/revert runbook」との責務差分もここで確定する。2026-08-05 の実装観測では、clean Packの
  `CLEAN_ALLOW_PREFIXES` / `CLEAN_ALLOW_FILES` に `release/` は無く、`artifactPaths`はallowlist
  通過物だけ、`sync-pack`はその集合だけをcopyする。従ってS2はsource repo manifestを唯一の
  正本としてallowlistとcopy testを同時追加し、Pack copyを派生artifactに固定する。
- R1: manifest 正本・sync-pack 実行・Pack repo 側 tag/revert runbook の 3 責務を分離する
  (S2 着手後)。
- R2: `U-RELMAN-001`〜`011` (案) を確定 oracle として test-design へ登録する (S2 着手後)。
- R3: 実装後、cross-family review で正本選択 (manifest vs harness.db vs GitHub Releases)
  の不変条件と非破壊契約を検証する (S2 完了後)。
- R4: `docs/design/harness/L6-function-design/` へ release channel manifest 契約を合流し、
  `forward_routing` / `promotion_strategy` を確定して Forward へ戻す (S2 完了後)。

## backprop_scope (仮、R4 で確定)

設計降下前のため本節は仮置きとする。現時点で予想される影響範囲:

- requirements: 既存の配布要件を変更しない見込み (Pack 配布契約の粒度追加に閉じる想定)。
- L4-basic-design: 外部機能境界・component 責務は変更しない見込み。
- L5/L6: release channel manifest の詳細契約を新規追加する見込み
  (`docs/design/harness/L6-function-design/` 配下、対象ファイルは R1 で確定)。

上記は R0 時点の見立てであり、R4 で実測に基づき確定する (仮置きを完了条件の代替にしない)。

## 完了条件 (S1 時点)

- [x] R0: `sync-pack` / `buildPackSyncPlan` / `PLAN-L6-63` との責務境界がPLAN-L7-473の
  設計判断節と矛盾なく記録される。
- [ ] R1〜R4 は S2 着手後に着手する (本 PLAN は S1 では draft のまま維持する)。
