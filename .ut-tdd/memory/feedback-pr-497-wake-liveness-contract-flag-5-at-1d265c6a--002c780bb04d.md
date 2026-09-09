---
memory_id: memory:feedback:pr-497-wake-liveness-contract-flag-5-at-1d265c6a--002c780bb04d
kind: feedback
title: "PR 497 wake liveness contract FLAG/5 at 1d265c6a"
tags: ["issue-454", "pr-497", "review-receipt"]
updated_at: 2026-08-31T09:26:49.083Z
---

PR #497 (docs: issue 454 Claude wake liveness contract) exact head 1d265c6a, canonical cross_agent receipt b969bc8b = FLAG blocking 5. All five verified against repo. Core theme: the frozen contract contradicts the existing typed return union and green tests instead of building on them. (1) deny-path 'canonical request write 0' contradicts tests/review-live-cli.test.ts (1 request kept, 0 inbox) and live-review-projection.ts backlog return; removing it kills the very channel that made issue #454 observable. (2) U-MEMWAKE-007 re-pointed at 'stale exact-1 = deferred' while the green test fixes stale = typed deny, with no supersede note. (3) deferred queue has no path/schema/consumer/GC, so its oracles pass on a write-only sink and the >15min working-turn invisibility stays open; pruneRuntimeFiles + readInbox will collide with unnamed files. (4) deny taxonomy declares 5 classes but ClaudeLiveWorkspaceResolution has 4 reasons; corrupt and identity-unverifiable collapse into incompatible, and 'stale exact-1' is unreachable because incompatible returns first and stale requires staleMarkerCount===markerCount. (5) exact-one counting unit undefined (marker vs workspaceId); impl dedups by workspaceId with any-fresh, and the real 3-markers-one-workspaceId state is uncovered. Convergence: anchor on the current 4 reasons + U-MEMWAKE-007 and write only the delta, plus freeze the deferred queue lifecycle.
