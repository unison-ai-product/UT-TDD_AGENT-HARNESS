---
memory_id: memory:user:po-claude-pr-request-poll-30m
kind: user
title: "POルール: Claude Codeは30分単位でPR対応依頼を巡回する"
tags: ["claude", "cross-review", "github", "memory", "po-rule", "pr"]
updated_at: 2026-07-23T00:00:00+09:00
---

Claude Code runtimeは作業中、30分単位で共有HARNESSメモリを巡回し、Claude宛のPR対応・cross-review・修正依頼が追加または更新されていないか確認する。

- 正本は`.ut-tdd/memory/`のproject/user memory。
- GitHub PRのcomments/reviews/checksも突合し、メモリだけを応答済み証拠にしない。
- 対応可能な依頼はPR HEADとbaseを再確認して着手する。
- PR固有Redを修正し、独立review・CI・merge条件が満たされるまで収束させる。
- 未完成PLANのconfirm、detector allowlist、base負債のPR固有扱いでGreenを偽装しない。
- 巡回は継続運用ルールであり、staleな進捗メモを30分ごとに増殖させない。依頼内容または判断が変わった時だけmemoryを更新する。
