---
plan_id: PLAN-L7-445-ops-rule-mechanization
title: "PLAN-L7-445 (add-impl): 運用ルールの機構化 (launch-storm guard / env リーク遮断 / stale index.lock 検知)"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / Claude (起票) / Codex (実装)
parent_design: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE (Codex) - launch guard / env scrub / index.lock 検知の実装"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-445-ops-rule-mechanization.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/launch-guard.ts
    artifact_type: source_module
  - artifact_path: tests/launch-guard.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  requires:
    - docs/plans/PLAN-L7-442-doctor-singleton-guard.md
  references:
    - .ut-tdd/memory/feedback-stale-index-lock-po-2026-07-16.md
---

# PLAN-L7-445 (add-impl): 運用ルールの機構化

## 背景 (PO 方針 2026-07-16)

「ルールをメモリで覚えさせる」より「破れない機構にする」。2026-07-16 の 2 インシデント
(doctor 16 並列によるメモリ枯渇、stale `.git/index.lock` 26 分放置で両ランタイム commit 不能)
と、snapshot テストの `UT_TDD_SESSION_ID` リーク誤発火を、prose ルールではなく機械強制へ昇格する。
doctor 限定で入れた singleton lock (PLAN-L7-442) の上位一般化。

## スコープ

1. **launch-storm guard の一般化**: PLAN-L7-442 の singleton lock を汎用ユーティリティ
   (`withSingletonLock(name)`) に切り出し、重量級 CLI コマンド (doctor / team run / db 投影) へ適用。
   加えて `.ut-tdd/state/` の launch 台帳で「同一正規化コマンドの時間窓内 N 回目の再起動」を
   fail-close する (再試行嵐の物理遮断。起動形を変えた再launch も正規化キーで捕捉)。
2. **`UT_TDD_SESSION_ID` リーク遮断**: `scripts/run-vitest-snapshot.ts` が子プロセス env から
   `UT_TDD_SESSION_ID` を除去し、snapshot workspace fence の誤発火 (session log が snapshot 内へ
   書かれる) を根治する。
3. **stale index.lock 検知**: doctor チェック `git-index-lock` を追加 — `.git/index.lock` が存在し、
   かつ git プロセス不在 + 経過時間 > 閾値 (例 5 分) なら stale として警告 surface する
   (SessionStart の warning 面にも出す)。自動削除はしない (除去は作成者ランタイム責務、
   PO 裁定 2026-07-16 = `.ut-tdd/memory/feedback-stale-index-lock-po-2026-07-16.md`)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | singleton lock 汎用化 + launch 台帳 + unit test | 直列 |
| 2 | snapshot runner env scrub + regression test | 並列可 (Step 1 と独立) |
| 3 | doctor `git-index-lock` チェック + unit test | 並列可 (Step 1 と独立) |
| 4 | typecheck + targeted test green + doctor 実走 | 直列 (最後) |

## DoD

- [ ] 同一コマンドの時間窓内多重再起動が fail-close される (test 固定)
- [ ] snapshot runner 経由のテストで `UT_TDD_SESSION_ID` が子 env に伝播しない (test 固定)
- [ ] stale index.lock (git プロセス不在 + 閾値超過) が doctor で警告 surface される (test 固定)
- [ ] 生存プロセスが保持する新鮮な index.lock を stale と誤判定しない (test 固定)
