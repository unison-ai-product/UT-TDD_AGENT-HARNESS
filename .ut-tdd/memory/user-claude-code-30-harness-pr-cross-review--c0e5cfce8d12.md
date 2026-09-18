---
memory_id: memory:user:claude-code-30-harness-pr-cross-review--c0e5cfce8d12
kind: user
title: "Claude Codeは作業中30分単位で共有HARNESSメモリを巡回しPR対応・cross-review依頼の追加/更新を確認する"
tags: ["memory-polling", "operational-cadence", "po-rule"]
updated_at: 2026-09-16T11:16:36.147Z
---

Claude Code runtimeは作業中、30分単位で共有HARNESSメモリ(.ut-tdd/memory/のproject/user memory)を巡回し、Claude宛のPR対応・cross-review・修正依頼が追加または更新されていないか確認する。GitHub PRのcomments/reviews/checksも突合し、メモリだけを応答済み証拠にしない。対応可能な依頼はPR HEADとbaseを再確認して着手する。PR固有Redを修正し、独立review・CI・merge条件が満たされるまで収束させる。未完成PLANのconfirm、detector allowlist、base負債のPR固有扱いでGreenを偽装しない。巡回は継続運用ルールであり、staleな進捗メモを30分ごとに増殖させない。依頼内容または判断が変わった時だけmemoryを更新する。
