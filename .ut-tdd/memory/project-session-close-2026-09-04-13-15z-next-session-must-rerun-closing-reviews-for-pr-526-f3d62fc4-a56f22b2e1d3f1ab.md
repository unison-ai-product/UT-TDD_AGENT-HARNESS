---
memory_id: memory:project:session-close-2026-09-04-13-15z-next-session-must-rerun-closing-reviews-for-pr-526-f3d62fc4-then-pr-519-b0c735d3-and-merge-on-pass-pr-517-parked-until-pack-pre-release-pr-521-awaiting-codex-r1-fix--59ce617247a6
kind: project
title: "Session close 2026-09-04 13:15Z: next session must rerun closing reviews for PR 526 (f3d62fc4) then PR 519 (b0c735d3) and merge on PASS; PR 517 parked until Pack pre-release; PR 521 awaiting Codex r1 fix"
tags: ["handover", "pr-517", "pr-519", "pr-521", "pr-526", "release"]
updated_at: 2026-09-04T13:13:31.105Z
---

Stopped all review chains and monitors for PC shutdown. State: PR 526 (issue 522 flake fix, tests only) CI 5/5 green at f3d62fc4, closing review not completed; PR 519 (issue 432) CI 5/5 green at b0c735d3, preflight r4 PASS-WEAK ec7fd4ff, closing review not completed. Order next session: remove any stale .ut-tdd/state/foreign-edit-override, prepend claude-code current version dir to PATH, run Opus closing on 526 then 519 (one at a time), merge each via ut-tdd pr merge on PASS/PASS-WEAK; then 523 (issue 424 slice 2) rebase and preflight; 521 (issue 487 pair-freeze) r2 when Codex posts new head (0965a0e8 pending envelope). PR 517 stays parked (PO decision) until Pack pre-release. Task files are in the session scratchpad; rebuild from PR comments if lost.
