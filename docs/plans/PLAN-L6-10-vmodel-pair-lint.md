---
plan_id: PLAN-L6-10-vmodel-pair-lint
title: "PLAN-L6-10 (add-design): vmodel pair-freeze lint の機能設計 — design⇔test-design pair_artifact 双方向整合・孤児0 (rule pair-exists/ref-resolves/trace-bidir、IMP-067)"
kind: add-design
layer: L6
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-05
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — pair-freeze 検査の純関数仕様 / 対象選定規約 (README・roadmap 除外 / self-pair / L2 group 参照) / function-spec §4 rule 1-3 への忠実性 / 既存 doc-consistency・backfill-pairing との非重複のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/vmodel-pair-freeze.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires: []
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    worker_model: codex:gpt-5.4
    reviewer_model: claude:pmo-sonnet
    tests_green_at: "2026-06-09T13:00:00+09:00"
    reviewed_at: "2026-06-09T13:10:23+09:00"
    verdict: approve
    scope: "G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR coverage and guardrail coverage reviewed"
---

# PLAN-L6-10 (add-design): vmodel pair-freeze lint の機能設計

## §0 位置づけ

PO /goal「L4 完遂を円滑に進めるためにカバーすべき機能を起票して対応 + doc カバレッジを review・改善」を受け、`src/vmodel/lint.ts` stub のうち **設計層 pair freeze 検証** (design doc ⇔ test-design doc の `pair_artifact` 双方向整合・孤児0) を機能設計する。これは function-spec §4 の rule 1 `pair-exists` / rule 2 `ref-resolves` / rule 3 `trace-bidir` の最小インスタンス化であり、G1-G6 各層の pair freeze を機械担保する (requirements §6.8.3 設計 PLAN 完了 PR の `vmodel-lint` 必須に接続)。G7 の 4 artifact 12 edge trace (`traceCheck`、function-spec §2.3) はスコープ外 (L7 trace freeze の別マイルストーン)。設計本体 = `docs/design/harness/L6-function-design/vmodel-pair-freeze.md`、③ ペア = L7-unit-test-design §1.13 (U-VPAIR)。

## §工程表

### Step 1: [直列] 機能設計 doc 起草
- 直列理由 = **file_conflict** (vmodel-pair-freeze.md を新規作成)。`loadPairDocs` / `analyzePairFreeze` / `pairFreezeMessages` の純関数仕様 + 対象選定規約 (README・roadmap 除外 / self-pair / L2 group) + 孤児 reason 3 種を記述。

### Step 2: [直列] L7-unit テスト設計 (③ ペア) 追記
- 直列理由 = **downstream_dependency** (Step 1 の関数仕様に対応する U-ID を起こす)。U-VPAIR-001〜005 を §1.13 に追記 (各検査軸 + 実 repo 完全性ガード)。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で設計⇔テスト設計の同粒度 / function-spec §4 rule 忠実性 / 既存 lint 非重複をレビュー。

## §実装計画

- **vmodel-pair-freeze.md** (情報源: function-spec §4 rule 1-3 + §1.3 lintVmodel + requirements §6.8.3/§2.4 + pair_artifact 実態マップ): pair-freeze 検査の純関数仕様 + 実 repo vitest ガード方針。
- **L7-unit §1.13** (情報源: Step 1 関数仕様): U-VPAIR の oracle を DbC で記述。
- 設計粒度 = L7 単体テスト設計粒度 (各検査軸 1 U-ID + 実 repo 孤児0 ガード)。

## §6 用語更新

- **pair-freeze lint (設計層)**: design doc ⇔ test-design doc の `pair_artifact` 双方向整合・孤児0 を検査する vmodel lint の設計層部分 (G1-G6 pair freeze の機械担保)。G7 の 4 artifact trace とは別レイヤー。→ concept §10 用語集へ back-merge (REVERSE-10)。
- **self-pair**: `pair_artifact: self` の doc (wireframe mock 自体が③ペア)。孤児扱いしない。→ concept §10 へ back-merge。

## §7 DoD
- [ ] vmodel-pair-freeze.md 起草 + L7-unit §1.13 (③ ペア U-VPAIR)
- [ ] §6 用語を concept §10 へ back-merge (REVERSE-10)
- [ ] review 前置 (code-reviewer)
