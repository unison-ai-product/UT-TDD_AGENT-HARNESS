---
memory_id: memory:feedback:pr-339-merged-at-exact-head-d60ea682-d3a-custody-implementation-verified-1-1-against-the-frozen-contract-junction-rejection-measured
kind: feedback
title: "PR 339 merged at exact head d60ea682: D3a custody implementation verified 1:1 against the frozen contract, junction rejection measured"
tags: ["issue-328", "merge", "plan-l7-493", "pr-339", "verdict-custody"]
updated_at: 2026-08-19T09:27:47.114Z
---

PR #339 (D3a repo-local verdict custody 実装、issue #328、PLAN-L7-493) を exact HEAD d60ea6828a0d742e9a6603ba2e32e148c632bdce で squash merge した。merge commit 39846e948bfd75570f95bd42e96237a50533833e、2026-08-19T09:27:11Z。CI run 32235488679 で 3 job SUCCESS、blocking 0、CLEAN。

#336 の freeze 契約との 1:1 照合を実施し全項目一致を確認: verdict custody root (.ut-tdd/review/verdicts/<digest>/attempts/attempt-<N>/verdict.txt)、監査 sink (<git-common-dir>/ut-tdd-runtime/review-custody/review-custody.jsonl = fence 外・cleanup 対象外)、superseded_attempt/cleanup_pending の typed event union、review-guard regex の verdicts 拡張、.gitignore は verdicts のみ 1 行、repoRoot containment (realpathSync 正規化 → isContained → NULL と .. セグメント拒否 → 親を 1 段ずつ lstat して symlink 拒否 → 最終 file も lstat)、attempt の consumer 採番と receipt 既存時の review_receipt_already_exists 拒否、reviewer family 不変 (expectedProvider = authorFamily の反対側、違反は same_family_reviewer_denied)。

junction を実測検証した: 契約は「symlink / junction escape を拒否」だが実装は isSymbolicLink() 判定のみなので Windows junction がすり抜けないか疑い、実際に mklink /J で junction を作って lstat した結果 isSymbolicLink: true / isDirectory: false となり、どちらの条件でも REJECT されることを確認した。推測で FLAG を出さずに済んだ。

残 advisory (merge 阻害なし): assertSafeParents は存在する親のみ検査する (!existsSync(cursor) は continue)。作成前の中間 directory が後から symlink として作られる TOCTOU 経路は関数単体では閉じていない。mkdir 後の再検証で閉じられる。

収束の経緯 (5 HEAD): db0b36bb で blocking 2 件 (generates 11 path 重複所有 / oracle orphan U-RVATT-033・036)。1cf0b4cc で B-2 のみ是正。58e59eb1 は evidence digest 更新のみで B-1 未着手。ed43ae50 で B-1 是正 (私も同じ修正をローカルで用意していたが Codex が先に push したため破棄、衝突なし)。d60ea682 で Biome 整形 1 件を是正して 3 job green。

2026-08-19 の着地: #335 (PF-5) / #338 (doctor profile outputIds、issue #314 close) / #337 (snapshot fence freeze) / #336 (D3a custody freeze) / #339 (D3a custody 実装) の 5 本を merge。open PR は #340 (Claude authored、Codex review 待ち) のみ。
