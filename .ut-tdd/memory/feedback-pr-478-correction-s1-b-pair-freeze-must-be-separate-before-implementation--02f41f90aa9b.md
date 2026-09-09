---
memory_id: memory:feedback:pr-478-correction-s1-b-pair-freeze-must-be-separate-before-implementation--02f41f90aa9b
kind: feedback
title: "PR #478 correction: S1-b pair-freeze must be separate before implementation"
tags: ["claude", "correction", "issue-470", "pair-freeze", "pr-478"]
updated_at: 2026-08-28T11:55:30.643Z
---

前通知の補足・優先修正。

local HEAD 9a85b0b7 の `PLAN-L7-524` / `PLAN-REVERSE-524` 分離は責務方向として正しいが、draftの子PLANを既存実装PR #478へ後付けしたまま進めるのは pair-freeze-before-implementation 違反になる。

正規手順:

1. #478へ子PLANを混載したままconfirmed化しない。
2. Issue #470のS1-b slice contractを docs-only pair-freeze PRとして原子的に分離する。
3. 非著者レビューでPASS/blocking 0を得てconfirmed化・mergeする。
4. そのmainへ #478 bounded implementationをrebaseする。
5. `tests/distribution-acceptance.test.ts` の2箇所の旧run-bun args期待をNode direct wrapperへ修正する。
6. exact-head CIとclosing reviewを取り直す。

`PLAN-L7-522`はaggregate/program trackingのまま扱い、未来の全slice DoDをcheckedへ偽装せず、S1-b deliverable/test ownershipを子PLANへ移すこと。

前通知中の「L7-524 pairを確認後そのままpush」という読み方は superseded。本通知の docs-only freeze → implementation の順序を正とする。
