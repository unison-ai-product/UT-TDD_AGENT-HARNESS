---
memory_id: memory:feedback:pr-324-closing-review-flag-blocking-1-at-exact-head-1a6cbb1d-bare-filename-bun-form-fail-open
kind: feedback
title: "PR 324 closing review FLAG blocking 1 at exact HEAD 1a6cbb1d: bare filename bun form fail-open"
tags: ["fail-open", "flag", "pr-324", "rule-drift"]
updated_at: 2026-08-17T03:33:44.884Z
---

PR #324 の closing review (Claude 非 author family)。**exact HEAD `1a6cbb1d1ae10c048e9828279f17f9037504ebdf` / Verdict: FLAG (blocking 1)**。CI は 3 job とも SUCCESS ですが、既存 oracle が当該入力形を持たないため **CI green はこの欠陥に対して非情報**です。

biome 是正 (2431ce64 → 1a6cbb1d) の差分は escape 除去と if 条件の折り返しのみで振る舞い不変であることを確認しました。

## Blocking: bare filename 引数の Bun 実行指示が fail-open

`src/lint/rule-drift.ts:74` の character class が `[\w.-]` になっており、これは `\w` (単語文字) ではなく **{ backslash, w, ., - } の 4 文字集合**です。直前の行 70/75 が使う path separator `[\/]` を写した際の取り違えと読めます。意図は `[\w.-]`。

実測 (analyzeRuleDrift 直呼び): `bun cli.ts` / `bun index.js` / `bun a.ts` は **MISSED**、`bun w.ts` / `bun ww.ts` / `bun w-w.ts` / `bun w.js` は DETECTED。**w / . / - だけで構成される token のときだけ発火する**という非対称が、診断を一意に決めます。

他の実行形 (bun test / install / build / run x / path 付き / bunx / bun.cmd / --version / code span / 連続空白 / 大文字 BUN) は全て DETECTED、散文 6 形は全て false positive なし。この 1 点以外の判別境界は健全です。

## 是正依頼

1. `[\w.-]` → `[\w.-]`。
2. **oracle を先に足す**こと。現 U-RDRIFT-008 は bare filename 形を持たないためこの fail-open を通しました。`bun cli.ts` / `bun index.js` を must-flag へ追加し、修正前に RED になることを確認してください (`w.ts` のような偶然通る token では回帰になりません)。

私は差し戻し済みなので手を出しません (差し戻しと自力修正は排他、PO ルール 2026-08-17)。是正 push 後、CI 3/3 green を確認して新しい full SHA で再依頼してください。

## 教訓 (検証手法)

shell heredoc 経由で書いた検証スクリプトは backslash を欠落させることがある (`[\w.-]` が `[\w.-]` になり、手書き regex の再現テストが偽の緑を出した)。**正本 source を import して実挙動を測る**こと、および **診断を一意に決める非対称な入力対** (`bun w.ts` DETECTED / `bun a.ts` MISSED) を作ることで確定させた。
