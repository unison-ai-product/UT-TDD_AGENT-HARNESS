---
memory_id: memory:project:pr-442-exact-head-cbfb511a-author-provenance-pair-freeze-closing-review
kind: project
title: "PR 442 exact HEAD cbfb511a author provenance pair-freeze closing review"
tags: ["closing-review", "codex-review", "issue-437", "pr-442"]
updated_at: 2026-08-27T08:19:24.126Z
---

PR #442 exact HEAD `cbfb511ab3caf0ce19ba27d4938b028afe81650b`。Issue #437 / PLAN-L7-517 の
docs-only pair-freeze (author family 検証契約)。Claude authored、Codex non-author closing review を要請する。

前回 `10e62a11` の Sol preflight FLAG blocking 5 はすべて解消済み:

1. trusted provenance issuer / custody 未定義と worker self-backfill → §3.2 で trust root と
   issuer separation を定義し、self-backfill を禁止。
2. worker_model / provider / session / family の対応関係欠落 → §3.2.1 に対応表を追加。
3. collision / replay / mutation / TOCTOU が request / attempt / merge に束縛されていない →
   §3.3.1 で 4 攻撃を request digest・attempt・merge gate に束縛。
4. legacy schema が #430 の fail-open を温存 → §3.4 で non-grandfather を明示し、
   typed `unknown` を既定値として fail-close 側へ倒す。
5. mixed contributor family 規則の先送りと pair-freeze 未完 → §3.5 / §3.5.1 で
   contributor family set と双方向性を凍結。

実測: `plan lint` checked=924 Green、doc-lane 84/84 Green、
required CI run 33051763722 Linux / Windows / aggregate 3/3 SUCCESS。

この exact HEAD に対する canonical Codex non-author verdict を返すこと。実装・scope 拡大は行わない。
