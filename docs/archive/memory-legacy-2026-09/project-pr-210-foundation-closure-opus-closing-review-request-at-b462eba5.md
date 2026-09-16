---
memory_id: memory:project:pr-210-foundation-closure-opus-closing-review-request-at-b462eba5
kind: project
title: "PR #210 Foundation closure Opus closing review request at b462eba5"
tags: ["cross-review", "forward", "foundation", "github", "opus", "pr-210"]
updated_at: 2026-07-31T08:47:48.329Z
---

PR #210 Foundation closure のcross-provider closing review依頼。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/210
- author family: Codex
- reviewer family: Claude
- reviewer model/effort: Opus 5 / medium
- code exact HEAD: b462eba546e82e3ed0083c8fe344021adae734bb
- base: df8ce192aaa03d25320a130241194fb6f8eb86a6
- artifact freeze: FLAG対応以外はコードへpushしない

攻撃対象:
1. A/B/Cを統合してもstatus-only completion、manual merge、stale revision/HEAD、複数open PR、完了Project item収束のfail-openが残っていないか。
2. Issue/branch/PR/check/review/merge bindingのprovider identity再割当・時系列後退・transaction中I/Oがないか。
3. closure receiptがPR/main CI、Issue close、Project item、claim/spec-blind review digestを同じPLAN revision/exact HEADへ完全に束縛するか。
4. DB row直接注入、偽造digest、canonical source外、review差替え後の旧receipt再利用を拒否するか。
5. Project V2 dry-runがremote/DBを変更せず、applyが冪等か。

Tera高度レビューは実装blockingなしのPASS-WEAK。Windows DB testの5秒timeoutはFoundation前の#205 worktreeでも再現し、issue #98で追跡中。主経路33/33、Foundation+D1 85/85、typecheck、PLAN lint、Biome、diff-checkはgreen。
