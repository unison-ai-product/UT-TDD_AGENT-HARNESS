---
memory_id: memory:feedback:delivering-the-untracked-memory-backlog-needs-triage-plus-pre-delivery-inspection-not-a-bulk-commit-ci-does-not-scan-memory-and-mojibake-can-be-intentional-evidence--dbe32b02d878
kind: feedback
title: "Delivering the untracked memory backlog needs triage plus pre-delivery inspection, not a bulk commit; CI does not scan memory and mojibake can be intentional evidence"
tags: ["cleanup", "delivery", "lesson", "memory", "process"]
updated_at: 2026-09-09T05:43:14.393Z
---

2026-09-09 に primary checkout の `.ut-tdd/memory` に滞留していた untracked 702 件を処理した。
tracked への最終追加は 2026-08-31 で、9 日分が未配送だった (`src/lint/memory-sync.ts:80` が
「commit + push されない限り相手ランタイムに届かない」と警告する状態)。

**Why:** `.ut-tdd/memory` は tracked (586 件) の共有正本であり、untracked のままでは相手ランタイム・
他クローン・他 worktree に伝播しない。前例は e890adc0 (367 件回収) と 117598ff (128 件配送、issue #242)。

**How to apply:** 一括 commit してはならない。実測に基づく選別と配送前検査が要る。

- **選別**: 582 件を配送 (PR #549)、97 件をエピソード (review request / merge handoff / EOD / nudge) として
  除外、21 件を frontmatter 欠落として別処理。除外語に一致しても root cause / FLAG / blocking / receipt /
  correction / directive など知見の徴候を持つ 37 件は配送側へ救出する。判定は本文冒頭ではなく
  title + ファイル名で行う (本文には依頼への参照が入るため誤検出する)。
- **配送前検査**: `readability` の走査対象は `docs/` + `.ut-tdd/audit` + `.ut-tdd/handover` で
  **memory は対象外** (`src/lint/readability.ts:255,286`)。CI は memory 本文を検査しないので直接行う。
  個人 home パスは伏字化する (前例 e890adc0 も最終 commit で伏せている)。CRLF は `.gitattributes` の
  `text=auto eol=lf` が commit 時に正規化する。**mojibake は一律是正しない** — 欠陥の証拠として
  引用されている場合があり、書き換えると証跡が壊れる (feedback-pr-446 が実例)。
- **TOCTOU**: 共有 tree なので計測中も増える (696 → 702)。stage 時点で再列挙し、`--pathspec-from-file` で
  明示 path のみ stage、commit 前に staged 集合が期待リストと完全一致することを検証する。
- **frontmatter 欠落分**: commit すると db rebuild が fail-close する (PR #167 前例)。`C:/dev/_archive/`
  (memory 走査範囲外) へ退避し、原パス・sha256・bytes・復元手順・保持条件を MANIFEST.json に記録。
  **削除前に正本の存在を確認する** — 今回は 19 件が決着済み PR のコメント (#442/#489 merged、
  #478/#492 closed、計 72 comment) と receipt 154 件に、`global-allowlist-oracle-fix` が PR #478 の
  コメント 8 箇所に、`release-version-identity-slice` (task pack) が
  `docs/plans/PLAN-L7-523-release-version-identity.md` に正本を持つことを確認した。削除直前に live と
  退避コピーの sha256 を双方向照合し、21 件すべて drift 0 で一致してから削除した。

方式は advisor 3 者に諮った。無選別配送は gpt-5.6-sol と gpt-6-astra が REFUTED / FLAG とし、
astra が「frontmatter 完備でもエピソードが混入する」「CI は memory を検査しない」を file:line 付きで
指摘した。claude-fable-5 の「ID 衝突 2 組」という中心的反証は実測で否定された (全 ID 相異、衝突 0) ため、
advisor 回答は実測で検証してから採用すること。
