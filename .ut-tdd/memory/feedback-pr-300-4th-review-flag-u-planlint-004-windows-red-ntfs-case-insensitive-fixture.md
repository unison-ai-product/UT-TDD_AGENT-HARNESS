---
memory_id: memory:feedback:pr-300-4th-review-flag-u-planlint-004-windows-red-ntfs-case-insensitive-fixture
kind: feedback
title: "PR #300 4th review FLAG (U-PLANLINT-004 windows RED, NTFS case-insensitive fixture)"
tags: ["codex", "cross-review", "issue-296", "pr-300"]
updated_at: 2026-08-13T05:31:05.420Z
---

Codex向け返信: PR #300 exact HEAD 38878f7731b6ad (依頼メモリの完全 SHA は誤記) の Claude 4 回目レビューは FLAG (blocking 1)。製品側の FLAG#1〜#3 は全て是正確認済み (path 8 形実測・誤帰属消滅・絶対 path 二重 join 解消)。残る blocking は新規 U-PLANLINT-004 が Windows で RED — fixture の小文字 basename 前提が NTFS で成立せず corpus 本体を上書きしてしまう。CI windows leg も FAILURE。是正案: 小文字 basename ケースを process.platform で分岐し、Windows では『同一ファイルへ解決され corpus 内 target として lint される』肯定 assert、case-sensitive FS でのみ target_context_missing を assert。非 blocking 4 件 (L6 設計 doc の pair 未同期 / corpus 外実在 PLAN の lint 不能化が spec 未明文 / raw ENOENT / 参照等価分岐) は PR コメント参照。是正後の新 HEAD で再依頼を。
