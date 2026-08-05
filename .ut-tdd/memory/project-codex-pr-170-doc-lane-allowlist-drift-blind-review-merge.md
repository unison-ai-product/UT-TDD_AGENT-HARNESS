---
memory_id: memory:project:codex-pr-170-doc-lane-allowlist-drift-blind-review-merge
kind: project
title: "Codexへの依頼: PR #170 (doc-lane allowlist drift 是正 + 回帰機械化) の blind review + merge"
tags: ["PLAN-L7-461", "ci-speedup", "codex", "handover", "pr-170"]
updated_at: 2026-07-28T05:32:54.921Z
---

非 author runtime (Codex) へ: PR #170 (Claude author) の blind review と merge を依頼する。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/170
- branch: fix/l7-461-lane-comment-drift
- HEAD: 2b8c5064b21b99d0224c309a6597ae1e9563bd9d
- PLAN: PLAN-L7-461-ci-cost-speedup-phase2 (AC-5)

## 変更内容

1. `.github/workflows/harness-check.yml` の header コメントが実装 (`src/github/change-lane.ts` の `DOC_LANE_PREFIXES`) より広い doc-safe allowlist を記述していた doc-code drift の是正。コメント: `docs/**.md` (docs/plans 除外) + `.ut-tdd/memory/**` / 実装: `docs/archive|migration|reference|research/**.md` の 4 tree のみ。
2. `DOC_LANE_PREFIXES` を export し、`tests/change-lane.test.ts` が header を parse して集合一致を検査する回帰を追加 (marker 消失も fail-close)。コメント修正のみでは再発を止められないため機械化した。
3. PLAN-L7-461 に Phase 1 の realized benefit 実測と lane 戦略の設計判断を追記。

## 判断してほしい点 (レビュー観点)

- header parse という oracle の設計が妥当か (marker 行の regex 抽出。marker を消せば fail-close するが、marker 行自体を書き換えて実装に合わせる回避は可能 — その場合コメントと実装は一致するので実害はない、という設計判断)。
- PLAN-L7-461 に記録した「Phase 2 に governance lane を追加しない」判断 (docs/plans が vitest 内ゲートの入力である以上、手作業 allowlist 拡大は false-green を作る)。
- Phase 1 の realized benefit = 0% という実測 (main first-parent 156 commits / 2026-07-01 以降で doc lane 該当 0 件) の解釈。

## 実測 evidence (Claude 側で実行済み)

- `tests/change-lane.test.ts` 25 tests green (snapshot runner)。
- 負例 oracle 実証: header に `docs/plans/**.md` を足す変異を commit して実行 → 2 failed / 23 passed。変異は revert 済み。
- `tests/github-ci-policy.test.ts` 92 tests green。
- 初回 CI は `test-repository-isolation` (U-TESTHYGIENE-015) に捕まった (テストが live root を直読み) → `workspaceRead(head_snapshot)` 経由へ修正済み。修正後の CI は再走行中。
- advisor: claude-fable-5 (lane 戦略の設計判断)。

## 注意

Claude は自分の PR のレビューを自分で回さない (PO ルール 2026-07-16)。merge 可否判断は Codex レーンに委ねる。
