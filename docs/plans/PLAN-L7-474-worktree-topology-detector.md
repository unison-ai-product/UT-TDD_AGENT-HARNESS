---
plan_id: PLAN-L7-474-worktree-topology-detector
title: "PLAN-L7-474 (add-impl): worktree topology 健全性・寿命検出 (配置移設の acceptance oracle)"
kind: add-impl
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
    slot_label: "SE - facts collector + 純粋 analyzer + doctor advisory 配線を実装"
  - role: qa
    slot_label: "QA - U-WTTOPO-001〜010 を実装し fail-safe 分類 (dirty 最優先) を検証"
  - role: tl
    slot_label: "TL - advisory (non fail-close) 境界と CI no-op 前提を独立レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-474-worktree-topology-detector.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/worktree-topology-collect.ts
    artifact_type: source_module
  - artifact_path: src/runtime/worktree-topology.ts
    artifact_type: source_module
  - artifact_path: src/doctor/worktree-topology.ts
    artifact_type: source_module
  - artifact_path: tests/worktree-topology.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-222-doctor-runtime-surface-extraction.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    - docs/plans/PLAN-REVERSE-474-worktree-topology-detector-backfill.md
    - docs/plans/PLAN-L7-470-review-dispatch-analyzer-ownership.md
    - src/feedback/review-dispatch.ts
    - docs/test-design/harness/L7-unit-test-design.md
review_evidence: []
---

# PLAN-L7-474: worktree topology 健全性・寿命検出

## 目的

worktree の link 健全性 (admin ⇄ worktree 双方向) と寿命 (終了判定) を機械検出する。
配置移設 (issue #141 / `PLAN-L4-34-repository-runtime-placement-topology`) の先行スライスであり、
**移設の acceptance oracle** になる: 移設前後で `healthy` 集合が一致することを要求できるように
する。`PLAN-L4-34` は本 PLAN 提出時点で本 worktree の base tree に存在しない (別 PR #230 で未
merge) ため、`dependencies.parent` には設定せず (`parent_missing` fail-close を実測回避、
下記「設計判断」節参照)、`dependencies.references` と本文でのみ参照する。

## 実測 (2026-08-05)

- `doctor` / `lint` に worktree 検査は 0 件
  (`grep -rli "worktree" src/doctor src/lint` = `src/lint/deliverable-plan-trace.ts` /
  `src/lint/memory-sync.ts` の 2 件のみで、いずれも worktree topology 検査ではない
  — deliverable-plan-trace は artifact 走査対象パス由来、memory-sync は共有メモリ同期の
  worktree 横断言及であり、link 健全性/寿命の検査ロジックは存在しない)。
- 登録 118 本 (main 含む) を分類実測: clean+merged 34 / clean+detached 34 /
  clean+unmerged 25 / dirty 24 → **117 本中 68 本 (58%) が終了済みと推定**。
- `git worktree prune --dry-run` は 0 件 (ディレクトリ実在しか見ないため、admin 側の
  broken link や「作業完了だが dir が残っている」終了判定は対象外)。
- **終了判定契約の不在**が 38→118 (13 日で 3 倍) の worktree 増殖の原因と推定される。

## 設計判断

1. **純粋 analyzer + 薄い facts collector に分離** (`src/feedback/review-dispatch.ts` と同型)。
   理由: git 状態に依存しない hermetic な oracle を可能にするため。`analyzeWorktreeTopology`
   は `WorktreeFacts[]` を受け取る純関数とし、git fixture を作るテストにしない
   (`src/runtime/worktree-topology-collect.ts` が `git worktree list --porcelain` /
   `.git/worktrees/*` admin dir を facts へ変換する薄い I/O 層)。
2. **advisory (surface) であり fail-close にしない**。理由: ローカル作業面の状態で CI を
   赤にしない。CI ランナーには worktree が存在しないため no-op (facts 0 件 = healthy 0 件で
   何も報告しない)。`src/doctor/worktree-topology.ts` は `runDoctor` の advisory セクションへ
   追加する (hard gate ではなく `ok` に影響しない診断)。
3. **link 検査は双方向** (worktree→admin と admin→worktree)。片方向だと `git worktree repair`
   が必要な壊れ状態 (admin 側だけ残存 / worktree 側の `.git` file が指す gitdir が admin へ
   戻れない) を見逃す。
4. **分類は排他で dirty 最優先** (fail-safe 側)。uncommitted change がある worktree は他の
   分類 (merged/detached/unmerged) と混ぜず、常に保全対象として扱う。誤って retirable に
   分類し作業中の変更を失わせるより、過剰検出 (retirable を少なく見積もる) を選ぶ。

`dependencies.parent` を `PLAN-L7-222-doctor-runtime-surface-extraction` (confirmed / drive=be /
layer=L7 / doctor runtime 診断面の拡張実績) に設定した理由は「設計判断依頼」節の実測を参照。

## 検出項目

- `link_broken`: worktree 側 `.git` file の gitdir 参照が admin dir と一致しない。
- `dir_missing`: admin `.git/worktrees/<id>/gitdir` が指す worktree ディレクトリが実在しない。
- `orphan_admin`: `dir_missing` かつ admin entry 自体が孤立 (`git worktree prune` 相当だが
  admin→worktree 方向を明示的に oracle 化する)。
- liveness 分類 (排他、優先順): `dirty` (uncommitted change あり) > `active` (直近アクセスや
  未 merge かつ detached でない作業中ブランチ) > `merged` (branch tip が対象ブランチへ到達
  済み) > `detached` (detached HEAD、branch 追跡なし)。
- `retirable` 集合: `dirty` を除く、`merged` または (`detached` かつ findings なし) の worktree。
- `healthy` 件数: findings (`link_broken` / `dir_missing` / `orphan_admin`) が 0 件の worktree数。
  移設前後比較の基準値として使う。

## 移設との関係 (PLAN-L4-34 先行スライス)

移設 (`PLAN-L4-34`) 実行前後で `healthy` 件数の一致を機械的に要求できるようになる。
本 PLAN は検出のみを提供し、blast radius の絞り込み材料 (117 本 → dirty 24 + active 25 =
実質 49 本) を移設判断へ渡す。移設の実施そのもの (`PLAN-L4-34` S3 相当) は本 PLAN の
スコープに含まない。

## スコープ外

- worktree の削除・回収の自動実行 (検出のみ。破壊操作は含めない)。
- 移設実行そのもの (`PLAN-L4-34` の担当領域)。
- `git worktree prune` の置換 (prune は dir 実在チェックのみであり本 PLAN は補完、代替しない)。

## 設計と検証の対

| ID | 攻撃・入力 | oracle |
| --- | --- | --- |
| `U-WTTOPO-001` | 全リンク一致・findings なしの worktree | `healthy` に計上し findings は空配列 |
| `U-WTTOPO-002` | worktree 側 `.git` file の gitdir 参照が admin と不一致 | `link_broken` を検出し `healthy` から除外 |
| `U-WTTOPO-003` | admin `.git/worktrees/<id>` の back pointer が worktree dir と不一致 | `link_broken` を検出 (admin→worktree 方向) |
| `U-WTTOPO-004` | admin entry が参照する worktree dir が存在しない | `dir_missing` を検出 |
| `U-WTTOPO-005` | `dir_missing` かつ admin entry 自体が孤立 | `orphan_admin` を検出 |
| `U-WTTOPO-006` | uncommitted change ありの worktree が同時に merged/detached 条件も満たす | `dirty` を最優先し他分類と排他 |
| `U-WTTOPO-007` | dirty でない merged / findings なし detached の混在集合 | `retirable` 集合へ両方を含め、dirty は除外 |
| `U-WTTOPO-008` | main (root) worktree | 分類対象から除外し `healthy` / `retirable` のいずれにも数えない |
| `U-WTTOPO-009` | facts の入力順序を反転して再実行 | `healthy` / `retirable` / findings が入力順に依存せず一致 |
| `U-WTTOPO-010` | findings (`link_broken`/`dir_missing`/`orphan_admin`) がある worktree | `healthy` に数えない (findings ある worktree は liveness 分類と独立に非 healthy) |

## Schedule

1. [並列] `src/runtime/worktree-topology-collect.ts` (facts I/O) と
   `src/runtime/worktree-topology.ts` (純粋 analyzer) + U-WTTOPO oracle を実装する。
2. [直列] `src/doctor/worktree-topology.ts` を `runDoctor` advisory セクションへ配線する。
3. [直列] targeted test / typecheck / Biome / doctor と non-author family cross-review を完了する。

## 完了条件 (AC)

- AC-1: `U-WTTOPO-001`〜`010` が `tests/worktree-topology.test.ts` で green。
- AC-2: typecheck / Biome lint が green。
- AC-3: `ut-tdd doctor` の advisory セクションへ登録済みで、`ok` (hard gate) に影響しないことを
  実 doctor 出力で確認済み。
- AC-4: 実 repo (本 worktree) の実測 counts (healthy / retirable / dirty / findings 件数) が
  本 PLAN または pair_artifact に記録されている。
- AC-5: non-author family (実装が Codex なら Claude、Claude なら Codex) の cross-review PASS。
