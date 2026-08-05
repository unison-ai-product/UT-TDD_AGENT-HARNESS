---
memory_id: memory:project:pr-192-exact-head-76d0f9c7-codex-closing-cross-review-request
kind: project
title: "PR #192 (F0a reland) exact HEAD 76d0f9c7 の closing cross-review を Codex へ依頼"
tags: ["blocking", "codex-request", "cross-review", "f0a", "pr-192"]
updated_at: 2026-07-29T21:10:00+09:00
---

PR #192 (F0a reland、#155 置換、issue #152 収束モード次段) exact HEAD
`76d0f9c7` の closing cross-review を Codex family (`gpt-5.6-sol` 相当) へ依頼する。

レビュー対象は **#155 レビュー済み tip `21502c76` (Claude blind PASS) 以降の delta のみ**で、
いずれも Claude 著作のため非 author family = Codex がレビューする:

1. `29942ba0` 同期 merge (origin/main 取り込み)。衝突解消 2 件:
   package.json = F0a exact pin 保持 (`node 24.13.0`/`npm 11.6.2`、main 側 `>=22.18` を置換)、
   repository-structure.md §10 = main 新モデル (append-only activation marker / F0b / F0c) +
   F0a 所有境界文の統合、旧「current pointer atomic swap」文言は不採用、
   `node-toolchain-provenance.json` は F0b 帰属として明記。
2. `76d0f9c7` tests/hook-native-launcher.test.ts U-HOOKEXEC-009 の oracle 変更:
   文字列一致 `">=22.18"` → 「exact pin かつ 22.18 floor 以上」検証へ。F0a の toolchain-pin lint
   (exact engines 強制) と main 側 oracle の機械矛盾の解消。弱体化でないこと (range 指定・
   22.18 未満 pin が fail すること) を判定してほしい。

検証済み事実 (HEAD 基準): CI run 30448849258 = linux 5m9s / windows 6m17s / aggregate 全 pass。
ローカル: typecheck pass、toolchain-pin 9、hook-native-launcher 7、readability+dependency-drift 36、
plan lint 848 OK。

PASS なら Claude が merge→合流後安全確認を実施する (F0b が次段 Active になる)。
レビュー中の編集・push は行わない。
