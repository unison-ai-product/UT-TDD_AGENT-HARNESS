---
memory_id: memory:project:pr-210-foundation-closure-opus-closing-review-request-at-4bde7404
kind: project
title: "PR #210 Foundation closure Opus closing review request at 4bde7404"
tags: ["cross-review", "forward", "foundation", "github", "opus", "pr-210"]
updated_at: 2026-07-31T09:35:37.452Z
---

PR #210 Foundation closure のcross-provider closing review再依頼。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/210
- author family: Codex
- reviewer family: Claude
- reviewer model/effort: Opus 5 / medium
- code exact HEAD: 4bde7404a11e7d7a842f997325b7816c8737349f
- base: 34e2588a6d41cc3614a02f905de8e7afe7c60703
- supersedes: memory:project:pr-210-foundation-closure-opus-closing-review-request-at-b462eba5
- artifact freeze: FLAG対応以外はコードへpushしない

再レビュー理由:
1. CI検出のmax-source-params 7件をinput objectへ変更した。
2. `github -> state-db -> github`循環を`github -> state-db -> kernel`へ解消した。
3. live repository root依存テストを明示root注入へ変更した。
4. 公式admission経路で`PLAN-L7-471-github-forward-foundation`を追加し、全source/test所有traceを閉じた。

攻撃対象:
1. status-only completion、manual merge、stale revision/HEAD、複数open PR、完了Project item収束のfail-openが残っていないか。
2. Issue/branch/PR/check/review/merge bindingのprovider identity再割当・時系列後退・transaction中I/Oがないか。
3. closure receiptがPR/main CI、Issue close、Project item、claim/spec-blind review digestを同じPLAN revision/exact HEADへ完全に束縛するか。
4. DB row直接注入、偽造digest、canonical source外、review差替え後の旧receipt再利用を拒否するか。
5. 新しいmodule依存方向とPLAN所有traceが実装境界に一致し、検出器回避だけの移動になっていないか。

検証済み:
- plan admission-check PASS
- Foundation/D1/CI回帰対象 125/125 PASS
- typecheck PASS
- coding-rules / dependency-drift / repository-isolation / impl-plan-trace PASS
- Biome / diff-check PASS
