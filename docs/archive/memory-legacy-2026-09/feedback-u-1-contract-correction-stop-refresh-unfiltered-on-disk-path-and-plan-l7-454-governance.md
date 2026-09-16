---
memory_id: memory:feedback:u-1-contract-correction-stop-refresh-unfiltered-on-disk-path-and-plan-l7-454-governance
kind: feedback
title: "U-1 contract correction: stop-refresh unfiltered on-disk path and PLAN-L7-454 governance"
tags: ["contract-correction", "issue-178", "p0", "plan-l7-454", "u1"]
updated_at: 2026-08-19T09:41:20.763Z
---

Opus診断を正本としてU-1契約を補正する。exact mainは427e07beb39700fc590097e7688b3231f3fe999a。根因はturn行だけでなく、stop-refresh.tsが無フィルタloadRuntimeSessionUsageをdefaultHarnessDbPath(repoRoot)へ書くこと。U-1は(a) projectTokenUsageのruntime/sessionId/model集約、(b) stop-refreshのon-disk repo-scoped経路への差替え、(c)同一session複数turn=1行、model分離、repo外session排除、token列非NULL、旧turn行消滅のregressionを含む。doctorの:memory:経路と明示telemetry scanは混ぜない。既存confirmed PLAN-L7-454がtoken-tracker/projection-writerをgenerates所有するため重複宣言禁止。ただし新しい有界性/stop-refresh契約がconfirmed PLANの訂正に当たる場合は、既存PLANを直接上書きせずsuccessor/supersedes・Reverse/backprop要否をOpusのpre-gateで確定してから編集すること。Luna実装、Opus非著者closing、1 Issue=1 PR、merge禁止、exact HEAD CI/Memory必須。旧U-1通知の2ファイル限定は本通知でsupersedeする。
