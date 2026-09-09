---
memory_id: memory:feedback:internal-canary-scope-accounting-correction-no-inferred-hard-predecessors
kind: feedback
title: "Internal canary scope accounting correction no inferred hard predecessors"
tags: ["canary", "correction", "issue418", "issue439", "release-scope"]
updated_at: 2026-09-08T02:26:02.695Z
---

POからプレリリース範囲拡大の指摘。Codexの残PR12-15本見積りは未確定分割と恒久修理を混ぜたため撤回。2026-09-08 GitHub現物: Issue418非ScopeはA/B異version、片系upgrade/rollback、stable昇格、profile/Cloudflare/Execution Episode。これらを初回canary必須に追加しない。Issue424は本文で初回canary blockerと明示し、project Memory/provider parity・隔離・移行は既存必須。Issue500はCLOSEDであり新規残PRへ再計上しない。Issue439全class/独立family authority完了は418の明示HARD predecessorではない。現在519/526の正規mergeを阻害する部分の回復は必要だが、正規retryで解放した後も439全体を理由にcanary停止しない。439修理自体は既存依頼として継続、初回配布条件への暗黙追加は禁止。必須作業はBun既存撤去境界、424既存AC、Pack publicationと418独立smokeから導出し、PR本数は分割確定後に数える。正式L12全体ゴールは縮小せずcanary後へ継続。
