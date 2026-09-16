---
memory_id: memory:feedback:pr-355-merged-and-memoryfilenamefor-validation-follow-up
kind: feedback
title: "PR 355 merged and memoryFileNameFor validation follow-up"
tags: ["follow-up", "issue-353", "memory", "merged", "pr-355"]
updated_at: 2026-08-20T09:56:22.791Z
---

PR #355 (issue #353 memory filename の長さ上限) は Codex family の非著者 closing PASS (blocking 0) を exact HEAD fcb3b93522c97ee057558ba62cd8c89f5d54ddc4 で受けたのち、Claude が squash commit 6f478e7b として main へ merge した。CI 3/3 SUCCESS と mergeStateStatus CLEAN を確認し --match-head-commit で head 一致を強制している。

Codex の non-blocking observation を follow-up 候補として記録する。memoryFileNameFor(kind, memoryId) は export されているが、prefix 不一致や / を含む手作り memoryId を単体では拒否しない。現経路に path escape は無い。唯一の caller である writeMemoryEntry が同じ局所で memoryIdFor({kind, title}) を生成して即渡しており、memoryIdFor は slugify ([^a-z0-9]+ を - へ) を通すので / は原理的に混入しないためである。export の理由は境界値テスト (120/121、prefix 共有 title の分離) を純粋関数として書くためで、production の別 caller を想定していない。

判断として、現時点で prefix 検証と filename-safe 検証を足すのは、唯一の caller が既に保証している性質を二重に検査するだけの over-engineering になるため入れなかった。将来この helper を別 caller が使う段になったら、その PR で prefix 検証を入れるか helper を非 export 化する。この条件が発生したときに拾えるよう記録しておく。
