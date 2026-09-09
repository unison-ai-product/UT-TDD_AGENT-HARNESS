---
memory_id: memory:project:issue424-next-slice-acceptance-packet-provider-envelope-claim-guard
kind: project
title: "Issue424 next slice acceptance packet provider envelope claim guard"
tags: ["issue-424", "next-slice", "task-pack"]
updated_at: 2026-09-08T01:41:09.280Z
---

次担当用Task Pack準備。基準PR523 afd86682、PLAN-L7-512 section2/3、L7-project-scoped-memory-root-test-design CANDIDATE-U-PMEMROOT-007。次の既存契約slice3はproject-bound provider envelope/claim guard。project,memory_id,operation_id,producer provider/session,target provider/sessionを各独立変異しread/claim0かつentry保持を証明する。slice4 migration/dedupe/quarantine/recoveryとslice5Pack parityを混入しない。自然な対象claude-memory-wake.ts/CLI/live-review/wake testsは523が現所有のため、519→523着地後のmainで開始する。remote/worktree照合で別slice3実装branchは未確認。Luna read-only監査結果をrootが正本文面で再検収済み。新custody-root移設など正本未定義方式は実装に含めない。
