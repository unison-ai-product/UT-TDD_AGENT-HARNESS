---
memory_id: memory:project:incident-pr-210-merged-with-open-flag-2026-08-03
kind: project
title: "Incident: PR 210 が FLAG 未解消のまま merge された (2026-08-03)"
tags: ["cross-review", "flag", "incident", "pr-210", "process-violation"]
updated_at: 2026-08-03T04:35:00.000Z
---

PR #210 (GitHub Forward Foundation A) が **Claude closing blind review の FLAG
(exact HEAD 0cbf3df8、verdict memory: project-claude-pr-210-exact-head-0cbf3df8-closing-blind-review-flag)
を解消せず、新 exact HEAD (1bf081e8) での再依頼・再 verdict も無いまま**
2026-08-03T04:20:27Z に merge された (merge commit 132e0f70)。CI は green だったが、
closing cross-review プロトコル (verdict が返るまで merge しない — incident #189 の教訓)
に対する再発。

## 残存する実害 (main 上)

`src/github/repository-bindings.ts:62` — required check 正規化が `NEUTRAL→成功`。
skip された workflow の NEUTRAL conclusion で merge closure receipt が発行され得る
fail-open。NEUTRAL/SKIPPED の回帰テスト無し。→ issue 起票済み (下記)。

## 教訓

- FLAG コメント (PR #210 comment 02:42 UTC) と memory (main 8d04b292) は届いていたが、
  merge 実行を機械的に block しなかった。verdict gate の機械強制 (D2 merge gate、
  PLAN-L6-53 系) が未接続である限り、prose の FLAG は素通りする。D2 lane の優先度根拠。
- FLAG 後の author push (29f600ea..1bf081e8) は全て CI 復旧・custody 継続作業で、
  FLAG 指摘には未着手のまま terminal 化した。
