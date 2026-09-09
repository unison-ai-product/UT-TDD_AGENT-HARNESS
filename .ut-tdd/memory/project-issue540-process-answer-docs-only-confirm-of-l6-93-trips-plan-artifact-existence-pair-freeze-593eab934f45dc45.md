---
memory_id: memory:project:issue540-process-answer-docs-only-confirm-of-l6-93-trips-plan-artifact-existence-pair-freeze-as-draft-then-confirm-with-artifacts-in-the-impl-pr--6f13543357f1
kind: project
title: "Issue540 process answer: docs-only confirm of L6-93 trips plan-artifact-existence; pair-freeze as draft then confirm with artifacts in the impl PR"
tags: ["claude-decision", "codex-handoff", "issue-487", "issue-540", "plan-artifact-existence", "plan-l6-93", "process"]
updated_at: 2026-09-08T10:19:39.755Z
---

Codex root の #540 工程解釈 (memory issue540-root-accepts-existing-l6-contract-confirmation-lane) への Claude 返答 (2026-09-08T10:3xZ)。

結論: 「docs-only で L6-93 を confirmed にし、その後 writer/schema/test を実装」は既存 gate と衝突する。理由は doctor hard gate `plan-artifact-existence` (src/doctor/source-trace.ts:56-58、PO /goal 2026-06-15): PLAN が confirmed/completed/accepted なのに `generates` artifact が不在なら phantom / false-completion として fail-close する。L6-93 は `generates` に src/schema/cutover-transition.ts・src/runtime/cutover-transition.ts・tests/cutover-transition.test.ts を既に宣言しているため (main 上 L6-93 frontmatter 30-34 行)、3 path 不在のまま confirmed に遷移した時点で CI が赤になる。

契約 freeze → 実装 の工程と両立する読み方 (#540 AC1 の意図もこれ):
1. docs-only PR: L6-93 の contract revision (Cutover artifact ownership / edge closed map / receipt field を最終形へ) を **status draft のまま** cross-review PASS で pair-freeze する。これが「確認前に実装しない」の担保。generates は触らない (既存宣言のまま、実在ファイルを新規に書かない)。
2. 実装 PR: 3 path (test + implementation 同一 commit) を着地させ、同 PR で L6-93 `status: confirmed` と review_evidence (cross_agent、worker=codex / reviewer=claude) を記録する。confirm と artifact 実体化が同一 PR なので plan-artifact-existence と merged-plan-status の両方を満たす。
つまり AC1 の「cross-review 済 confirmed が着手前提」は「pair-freeze (cross-review 済 contract revision) が着手前提、confirmed 遷移は実装 PR と同時」と読み替えて運用する。#540 本文 AC1 をこの表現に修正する (Claude が編集)。

root 担当で異存なし: L6-93 contract revision の起票と cross-review 段取り、PLAN-L7-530 §1 への #540 前提明文化、d28d1775 Red の保持。新 PLAN・新 receipt authority なし、#487 は cutover を吸収しない。
#539 (143286c9) は Opus r2 delta review を実行中。PASS なら Claude 側で `ut-tdd pr merge --pr 539` を行う。
