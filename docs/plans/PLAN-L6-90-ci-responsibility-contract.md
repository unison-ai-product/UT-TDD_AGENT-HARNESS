---
plan_id: PLAN-L6-90-ci-responsibility-contract
title: "PLAN-L6-90 (add-design/function-spec): 内部 CI / 外部 CI 責務分担契約と pre-push
  subset gate (issue #109 Phase 2)"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-21
updated: 2026-07-21
revision_note: "rev2: references の PLAN-L7-221 実 path 修正 (-gate.md)。PLAN-L7-455
  参照は PR #112 merge で実体化する前方参照"
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: TL - 内部/外部 CI 責務境界と required context 不変条件
  - role: se
    slot_label: SE - pre-push subset gate 構成・一致率計測の契約
  - role: qa
    slot_label: QA - 責務欠落 (どちらも検証しない gate)・fail-open 縮退の Red oracle
generates:
  - artifact_path: docs/plans/PLAN-L6-90-ci-responsibility-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
  requires:
    - docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
  references:
    - docs/plans/PLAN-L7-455-ci-cost-speedup-phase1.md
    - docs/plans/PLAN-L7-221-github-ci-policy-gate.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  blocks: []
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 109
admission_receipt:
  schema_version: v2
  receipt_id: certificate:6f8694cea426b4c519701a1555bf4dc7
  command_id: plan-l6-90-20260721-02
  admitted_at: 2026-07-21T21:15:00.000+09:00
  source_digest: sha256:3bad56f2706d6a2ef4c72a6827184f433f48e3702db9cda398bfd2d3bd68fa2d
  decision_digest: sha256:94cc2de363ffdb5ddc3aa3898dd7164a28fbb755d89932cbe80db4f1267ef7a8
  receipt_digest: sha256:0fc17b48f3e57459c2798def5b4a7351cca9885a49c902936c37f5897711b345
  binding:
    path: docs/plans/PLAN-L6-90-ci-responsibility-contract.md
    plan_id: PLAN-L6-90-ci-responsibility-contract
    asset_id: plan:b16164ab91330ced198c273e62915d81
    revision: 2
    content_digest: sha256:3bad56f2706d6a2ef4c72a6827184f433f48e3702db9cda398bfd2d3bd68fa2d
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 109
    episode_id: E4-109
    projection_digest: sha256:a3263eb3967d331852f1365096b3888d492410527914b3e05c94c59dd9d6babf
  origin:
    plan_id: PLAN-L6-82-universal-pr-trigger-contract
    revision: 1
    digest: sha256:92b1837da4f20355bfdca7c1160fbcd1d5f82d8ad3d5dfbd9d44fd87c47ee021
  reentry:
    target_plan_id: PLAN-L6-82-universal-pr-trigger-contract
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #109 Phase 2: internally detectable defects (4 measured
    cases on 2026-07-21) reach the 5-9 min GitHub CI because no
    internal/external CI responsibility contract or pre-push subset gate exists"
---

# PLAN-L6-90: 内部 CI / 外部 CI 責務分担契約と pre-push subset gate

## 1. 目的と実測根拠 (Issue #109 Phase 2)

Phase 1 (PLAN-L7-455) は GitHub CI の doc-lane 絞り込みと cache で外部コストを下げた。本 PLAN は
残る Phase 2、すなわち「どの検証を内部 CI (著者ローカル) が担い、どの検証を外部 CI (GitHub) が
担うか」の責務分担を閉じた契約として固定し、pre-push subset gate を定義する。

実測根拠 (2026-07-21、PR #114/#115 での実例 4 件): shared memory frontmatter 不正 (db rebuild が
検出)、plan-governance requires_not_ready、green_commands.runner enum 逸脱、reviewed_at /
tests_green_at 順序違反 (IMP-077) — いずれもローカルで数秒〜数十秒で検出可能な欠陥が GitHub CI
(5〜9 分/run) まで到達し、往復 4 回ぶんの外部 CI 時間と cross-review 修正を発生させた。

## 2. 責務分担契約

| 面 | 責務 | 正本 gate |
|---|---|---|
| 内部 CI (著者ローカル、pre-push) | 著者起因の決定論的欠陥を push 前に落とす (shift-left)。速度目標: 60 秒以内 | pre-push subset gate (§3) |
| 外部 CI (GitHub harness-check) | merge 保護の最終防衛線。全回帰・OS 依存面 (Linux/Windows)・aggregate required context・環境差起因の検出 | PLAN-L6-82 trigger contract + PLAN-L7-455 lane 構成 |

不変条件:

1. **全 gate はどちらかの面に必ず属する** (どちらも検証しない gate を作らない。責務欠落は fail-close)。
2. 内部 CI は外部 CI の **代替ではなく前段**である。内部 green は push 可否のみに使い、merge 可否は
   外部 CI required context だけが決める (PLAN-L6-82 の branch-protection context 不変を維持)。
3. 外部 CI の絞り込み (lane skip) は github-ci-policy detector (PLAN-L7-455) の機械保証下でのみ許可
   する。内部 gate の存在を理由に外部 gate を削る fail-open の看板替えを禁止する。
4. 内部 gate は決定論的検査 (schema / lint / 順序不変条件 / digest 照合) を優先し、環境依存・長時間
   検査 (full vitest、full doctor) を含めない (issue #70/#98 の負債を内部 gate へ持ち込まない)。

## 3. pre-push subset gate 構成

変更種別 (PLAN-L7-455 の lane 分類と同一の分類器を共有) × gate のマトリクス:

| gate | doc/PLAN 変更 | src/tests 変更 | .ut-tdd/memory 変更 | 目安時間 |
|---|---|---|---|---|
| plan lint (`ut-tdd plan lint`) | 必須 | 必須 | - | ~10s |
| frontmatter schema safeParse (変更 PLAN のみ) | 必須 | - | - | ~1s |
| review-evidence lint (IMP-077 順序含む) | 必須 | - | - | ~2s |
| plan-supersession 解析 | 必須 | - | - | ~1s |
| memory frontmatter 検証 (db rebuild の memory 面) | - | - | 必須 | ~5s |
| typecheck (tsc --noEmit) | - | 必須 | - | ~20s |
| biome check src tests | - | 必須 | - | ~5s |
| targeted vitest (変更 module 対応 test のみ) | - | 必須 | - | 変動 |

分類は fail-close: 分類不能な変更は全 gate を実行する。gate 実行は Stop hook / pre-push hook の
既存 surface (`scripts/git-hooks/pre-push`) へ載せ、warn-only から始めて一致率計測 (§4) の実績を
もって fail-close へ昇格する (昇格判定は PO gate)。

## 4. 一致率計測 (内部 green → 外部 green)

- push ごとに「内部 gate 実行結果 (gate 別 verdict + digest)」を記録し、対応する外部 CI run の
  結果と突合する。
- **乖離 A (内部 green → 外部 fail)**: 内部 gate の穴。gate 追加候補として自動起票する
  (検出器は本契約から生成する。設計を検出器へ合わせない)。
- **乖離 B (内部 fail → push 断念)**: shift-left の成功。外部 CI 節約時間として集計する。
- 一致率と節約時間は harness.db projection で可視化し、Phase 2 AC の実測 evidence とする。

## 5. L6↔L7 pair / oracle

L7 test-design に `U-CIRESP-*` を追加し、少なくとも次を mutation で固定する。

1. 責務マトリクスの全 gate が内部/外部いずれかの面に属する (責務欠落 fixture を fail-close)。
2. 内部 gate green を理由に外部 required context を skip する構成変更を detector が拒否する。
3. 変更種別の分類不能 fixture が全 gate 実行へ fall back する。
4. 実例 4 件 (memory frontmatter / requires_not_ready / runner enum / reviewed_at 順序) を
   pre-push subset gate が push 前に検出する (今回の実測 fixture を回帰固定)。
5. 内部 green → 外部 fail の乖離 A が gate 穴として記録・起票される。
6. 内部 gate が full vitest / full doctor を含まない (時間予算超過 fixture を拒否)。

## 6. AC

- [ ] 内部/外部 CI の責務分担マトリクス (§2-§3) が function-spec として固定され、責務欠落ゼロを
      oracle で証明する。
- [ ] pre-push subset gate が定義され、実例 4 件の回帰 fixture を push 前に全件検出する
      (`U-CIRESP-4`)。
- [ ] 外部 CI required context (PLAN-L6-82) が本契約の導入前後で不変であることを detector で証明する。
- [ ] 一致率計測の記録形式と乖離 A の起票経路が定義される。
- [ ] doc-only / code / memory 変更の各代表 PR で内部 gate 所要時間が 60 秒以内 (実測 evidence)。
- [ ] `U-CIRESP-*` Red、cross-runtime blind review PASS、L7 実装 (PLAN-L7-457 想定) を経て
      confirmed 化する。

## 7. 降下先

L7 実装 (PLAN-L7-457 想定): 変更種別分類器の共有化、pre-push subset gate runner、内部 gate
結果記録と外部 CI 突合の projection、乖離 A 自動起票。PLAN-L7-455 Phase 1 の lane 分類器・
github-ci-policy detector と同一正本を共有し、二重実装しない。
