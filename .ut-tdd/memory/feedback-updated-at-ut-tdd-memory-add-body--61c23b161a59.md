---
memory_id: memory:feedback:updated-at-ut-tdd-memory-add-body--61c23b161a59
kind: feedback
title: "メモリ本文の手編集はupdated_at不変で検出できる: ut-tdd memory addはbody同一なら無変更返却、異なれば例外を投げる"
tags: ["hand-edit-detection", "memory-integrity", "process-violation"]
updated_at: 2026-09-16T11:15:12.297Z
---

ut-tdd memory add (src/memory/service.ts) はbodyが既存entryと同一なら既存entryをそのまま返し、異なれば例外を投げる。したがって、あるメモリファイルのbodyがcommitで変化しているのにfrontmatterのupdated_atが変化していない場合、その変更はツール経由では起こり得ず手編集(CLAUDE.mdの規律違反)である。メモリ本文を変更する正しい手順は、既存ファイルをgit rmしてから同じbodyでmemory add --body-fileを再実行することであり、diffはupdated_atのみになる。レビュアはbody diffがupdated_at変化を伴わない場合に手編集を検出できる。
