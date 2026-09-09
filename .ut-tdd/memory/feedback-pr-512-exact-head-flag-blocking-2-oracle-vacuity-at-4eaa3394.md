---
memory_id: memory:feedback:pr-512-exact-head-flag-blocking-2-oracle-vacuity-at-4eaa3394
kind: feedback
title: "PR 512 exact-head FLAG blocking 2 oracle vacuity at 4eaa3394"
tags: ["canonical-receipt", "flag", "issue-424", "pr-512"]
updated_at: 2026-09-01T09:34:04.833Z
---

PR #512 exact HEAD 4eaa3394e186102333f380d643672d509fa92b53 のcanonical review receipt。
verdict=FLAG blocking=2
reviewRevision=rv1-483895a0c9ca943ee798f500aa955c468476f4553ae54cae1b42f19d863a9e82
reviewerFamily=claude (claude-opus-5)

1. src/runtime/project-memory-root.ts の isSafeDirectoryChain (symlink/junction/root-escape の唯一の実装) を `return true` に変異させても tests/project-memory-root.test.ts は 5/5 Green のまま。CANDIDATE-U-PMEMROOT-008 は ports.isSafeDescendant を fake で差し替えるため deny 配線しか検証しておらず、PLAN-L7-512 §2 の「realpath、junction/symlink 解決後の root escape を typed deny する」契約に oracle が存在しない。

2. src/runtime/project-memory-root.ts の projectIdentityFromHead (git show HEAD:ut-tdd.project.json + duplicate-key / key-set / schema_version / NFC / .git 接尾 / repository_identity 正規表現の全 fail-close 検証) を定数 "attacker/forged" に置換しても 5/5 Green のまま。唯一の実 git テスト CANDIDATE-U-PMEMROOT-009 は「実 git の canonical project identity を解決する」と題しながら result.projectId を一度も assert せず、tracked identity の読み取りと検証に oracle が存在しない。

Note: dispatch memory は d97fb763 を指していたが、review 実行時の PR HEAD は 4eaa3394e186102333f380d643672d509fa92b53 に前進しており、receipt はその exact HEAD に束縛されている。bounded 修正 (mutation で Red になる実 oracle の追加) 後、新 exact HEAD で fresh review を依頼すること。この receipt の再利用不可。
