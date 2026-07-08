---
plan_id: PLAN-L6-63-pack-staged-release-rollback
title: "PLAN-L6-63 (add-design): Pack 配布 段階公開・ロールバック戦略 (ZIP 61_リリース・デプロイ戦略設計書 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - Pack 配布の段階公開・ロールバック手順の設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - src/setup/distribution.ts
    - src/cli/distribution.ts
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-63: Pack 配布 段階公開・ロールバック戦略

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `61_リリース・デプロイ戦略設計書` はカナリア/ブルーグリーン/フィーチャーフラグ/DB マイグレーション
後方互換/ロールバック方針を定義する。UT-TDD は SaaS デプロイではなく `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`
への配布 (`ut-tdd distribution sync-pack`) が該当する release surface。

`docs/design/harness/L6-function-design/setup-solo-team.md` の Pack sync addendum
(`buildPackSyncPlan`) は既に **local な copy-plan/staging の非破壊性・rollback managed paths・
human-approved command list** を持つ (裏取り済)。したがって「ロールバック手順が皆無」という主張は
過大である。未確認なのは、Pack **リポジトリ側**の段階公開運用 (tag/release の切り方、consumer が
既に pull 済みのバージョンを撤回する場合の revert runbook) であり、これは `sync-plan`/`sync-stage`
(ローカル面) の scope 外にある。本 PLAN はこの Pack repo 側の段階公開・revert runbook のみを対象とする。

## 1. 設計スコープ

1. Pack **リポジトリ側**の段階公開方針 (tag 運用、一括 push か段階的タグ付けか) を設計する。
   ローカル側の copy-plan/staging (`sync-plan`/`sync-stage`) の非破壊性は設計済みのため対象外。
2. 配布後に consumer が既に pull 済みのバージョンで不具合が発覚した場合の revert runbook
   (Pack リポジトリ側の tag/release revert 方針、既存 `buildPackSyncPlan` の rollback managed paths
   との連携) を設計する。
3. 破壊的変更 (非破壊不変条件違反) を含む配布の事前検知経路を、既存 distribution 関連 PLAN と
   重複しない形で設計する。

## 2. 受け入れ条件 (design freeze 時)

- 段階公開・ロールバック手順が Pack 配布の実運用 (`sync-pack --prune-local` 等既存フラグ) と
  整合する形で L6 function-spec として固定される。
