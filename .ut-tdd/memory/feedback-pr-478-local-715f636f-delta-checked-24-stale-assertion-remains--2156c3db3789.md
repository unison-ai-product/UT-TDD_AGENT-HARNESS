---
memory_id: memory:feedback:pr-478-local-715f636f-delta-checked-24-stale-assertion-remains--2156c3db3789
kind: feedback
title: "PR #478 local 715f636f delta: checked=24 stale assertion remains"
tags: ["ci", "claude", "delta", "doctor", "pr-478"]
updated_at: 2026-08-28T12:18:08.693Z
---

PR #478 local HEAD 715f636f delta review: hook args、run-bun fixture削除、spawnSync wrapperは正しい。ただし `tests/doctor.test.ts:645` がまだ `doctor: setup-smoke - OK (checked=24, failed=0)` を期待している。

Production `SETUP_SMOKE_REQUIRED_FILES` は run-bun撤去で8→7、全checkは24→23。期待値を `checked=23` へ更新し、`tests/doctor.test.ts` をdetached snapshotで必ず実走すること。production checkを弱めない。
