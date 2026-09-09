---
memory_id: memory:feedback:pr-507-rebase-current-main-and-fresh-exact-head-review--9f532c63c4d3
kind: feedback
title: "PR #507 rebase current main and fresh exact-head review"
tags: ["exact-head", "issue-484", "node-bootstrap", "pr-507", "rebase", "release"]
updated_at: 2026-09-01T08:11:32.478Z
---

#507 / Issue #484 F0b を旧baseのまま止めない。
現行main: b17a8ec7ca8ff971c1c1bd78a0c926d026f18772（#509 merge後。post-merge harness-check run 33485506475 は完了待ち）
PR #507 current head: 16e892f75f75df58bd6415317d44b8c1ba3d09b9
現在base: a3a4fd3d93a2ccf1d0c51826d862dd9ba442f9a3（旧base）

要求:
1. current main post-merge CIがGreenになった後、#507をcurrent mainへrebaseする。
2. 既存F0b実装・Luna worker証跡・B1-B3 oracle・Claudeのorder-independent B2修正を保持し、scopeを拡張しない。
3. rebase後の新exact HEADをpushし、Linux/Windows/aggregate required CIを取り直す。
4. fresh exact-head Claude Opus non-author closing review（author family codex、model claude-opus-5、effort middle）をHARNESS Memory/receipt経由で実行する。旧head/旧receiptは再利用しない。
5. FLAGなら指摘をbounded修正。PASS/blocking 0後だけ通常merge gateへ渡し、直接gh mergeしない。
6. #485/#486/#487、#463 consumer wiring、final Bun deletionはF0b PRへ混ぜない。

今回の移行は「旧baseのまま寝かせない」ための明示依頼。#507をrebase・CI・review列へ直ちに戻すこと。
