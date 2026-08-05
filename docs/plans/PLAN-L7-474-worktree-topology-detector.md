---
plan_id: PLAN-L7-474-worktree-topology-detector
title: "PLAN-L7-474 (add-design): worktree topology 健全性・寿命検出の契約 freeze"
kind: add-design
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-05
updated: 2026-08-05
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - freeze済み facts collector / 純粋 analyzer / doctor advisory 契約を実装する"
  - role: qa
    slot_label: "QA - U-WTTOPO-001〜011 の実装テストと fail-safe 境界を検証する"
  - role: tl
    slot_label: "TL - advisory境界と移設acceptance oracleの独立レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-474-worktree-topology-detector.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-222-doctor-runtime-surface-extraction.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    - docs/plans/PLAN-REVERSE-474-worktree-topology-detector-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/232
review_evidence: []
---

# PLAN-L7-474: worktree topology 健全性・寿命検出の契約 freeze

## 目的

Issue #232 の worktree link 健全性と終了判定を、配置移設
(`PLAN-L4-34-repository-runtime-placement-topology`) の前後比較に使える
**advisory の acceptance oracle** として設計固定する。

本PRは pair-freeze だけである。collector、analyzer、doctor配線、テストコード、実行結果は
まだ出荷物として宣言しない。後続の add-impl PR が本PLANを確認済みにし、そのとき初めて
実装出荷物を `generates` へ追加する。

## 固定する契約

1. 実装は Git I/O を行う薄い facts collector と、facts だけを入力にする純粋 analyzer を分離する。
   同じ入力集合は入力順にかかわらず同じ findings、counts、retirable を返す。
2. link は worktree→admin と admin→worktree の両方向を検査する。worktree `.git` の
   gitdir 参照不整合、admin back pointer 不整合は `link_broken` とする。登録された
   worktree directory 不在は `dir_missing`、未登録admin entryは `orphan_admin` とする。
3. liveness は排他的に `dirty > detached > merged > active` で分類する。
   `dirty` は他条件に優先し、main worktree は liveness/retirable から除外する。
4. `retirable` は finding の無い clean `merged` または clean `detached` だけである。
   link/dir の観測不能面は `dirty=false` 等の既定値を信用せず retirable から除外する。
5. 診断は doctor の advisory surface に置き、hard gate / CI成功判定を変更しない。
   worktree が無いCI環境は empty facts として診断を出さない。
6. `healthy` は link/dir finding の無い登録 worktree の件数である。移設の実行や削除は
   本スコープ外であり、移設側が前後の `healthy` を比較するための入力だけを提供する。

## 設計と検証の対

oracle の正本は `docs/test-design/harness/L7-unit-test-design.md` の
`U-WTTOPO-001`〜`011` である。これは #234 の実装候補から抽出して契約化したものであり、
本PRでは test code の存在・green・実リポジトリの計測値を主張しない。

## スコープ外

- worktree の削除、回収、`git worktree prune` 実行。
- 配置移設そのものと、移設の完了判定。
- doctor advisory を required check / fail-close へ変えること。

## 後続の実装受入条件

- AC-1: `U-WTTOPO-001`〜`011` をテストコードで実装し全件を検証する。
- AC-2: facts collector と純粋 analyzer のI/O境界、双方向link検査、fail-safe retirable除外を
  非author familyがレビューする。
- AC-3: doctorへのadvisory配線が hard gate / CIの成功判定を変えないことを実測で示す。
- AC-4: `PLAN-REVERSE-474` の R0〜R4 を完了し、L4/L6への必要最小限の合流を判定する。

## Schedule

1. [完了] 設計と L7 oracle を pair-freeze する。
2. [直列] 別 add-impl PR で collector / analyzer / doctor advisory / テストを実装する。
3. [直列] Reverse R0〜R4、cross-review、trace-freeze を実施して確認する。
