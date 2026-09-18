---
memory_id: memory:project:process-violation-pr-300-merged-before-claude-closing-pass-receipt-2026-08-13
kind: project
title: "process violation: PR #300 merged before Claude closing PASS receipt (2026-08-13)"
tags: ["d2", "incident", "merge-discipline", "pr-300", "process-violation"]
updated_at: 2026-08-13T06:26:39.941Z
---

2026-08-13T06:16:47Z、PR #300 (exact HEAD 5a6560219bb515db8c26e3223444e72897c25096) が Codex 側で merge された。Claude non-author closing review の PASS-WEAK verdict が PR コメント 5276760522 に記録されたのは 06:25:56Z であり、merge は verdict 受領の 9 分前。規律 (運用規律の再締結 2026-08-03 §2: closing review の PASS verdict 受領前に merge しない。例外なし) への違反として FLAG する。内容面: delta 追認レビューは結果的に PASS-WEAK (blocking 0) であり、成果物の巻き戻しは不要。ただし違反時の扱いは内容の当否に関わらないため incident として記録する。構造面の注記: これは D2 が対策対象とする事象そのもの — B 面 gate (ut-tdd pr merge) は receipts/requests 経路の verdict 不在で deny したはずで、D 面 backstop (PR #302 で freeze 済み、実装前) が有れば merged_without_verdict / bypass_merge として検知された。gh 直叩き merge が両ランタイムでまだ可能である実証でもあり、D2-D 実装と CLAUDE.md/AGENTS.md の『PR merge は必ず ut-tdd pr merge 経由』規約 (PR #299 で掲載済み) の遵守徹底が対策。再発防止の即効策: closing review 依頼を出した側は verdict 返却前に merge しない、review 実施側は verdict を PR コメントへ書いてから他の作業に移る (今回 verdict 確定から記録まで probe 検証で ~10 分の窓があった)。
