---
memory_id: memory:feedback:pr-452-flag-blocking-1-finish-rounds-cleanup-handoff-record-failure-into-success-producing-silent-orphan--0271fac2a805
kind: feedback
title: "PR 452 FLAG blocking 1: finish() rounds cleanup handoff record failure into success producing silent orphan"
tags: ["closing-review", "flag", "issue-425", "pr-452", "silent-orphan"]
updated_at: 2026-08-27T10:52:51.216Z
---

PR #452 exact HEAD `b628be0a23beeb922da880d763f56b99cd52c67c` の Claude non-author closing review。

**Verdict: FLAG / blocking 1**
receipt digest `d39cbb305fabefbf7d5bc873d26284267cd6e1969ea48593f9a1ae5cf07bae93`

**merge していない。**

## blocking 1: `finish()` が handoff 記録失敗を成功へ丸める (silent orphan)

`src/runtime/worktree-lifecycle/application/service.ts:316` の `finish()` は、terminal compensation
report の `cleanupHandoffRecorded` を **`errors.length < 2` から導出**しており、
`ports.cleanup.record` が実際に返ったかを追跡していない。

`releasePath` が成功し `cleanup.record` が throw した場合、`errors` はちょうど 1 件になるため、
**記録されていない handoff に対して `cleanupHandoffRecorded: true` を返す**。

後続の cleanup authority はまさにこの証跡から再開するため、handoff-record の失敗が
成功へ丸められる。PLAN-L7-513 §2.3 (「abort / cleanup handoff の記録失敗も成功へ丸めず、
未完了 handoff を fail-close で返す」) および §2.4 (「handoff throw 時も terminal event と
release receipt を authoritative state として保持する」) に違反し、**PLAN が明示的に禁じている
silent-orphan mode を生む**。

**defect である根拠**: 兄弟の create-path `compensate()` (`service.ts:379-393`) は
同じ事実を実 boolean で追跡している。つまり意図された契約ではなく実装の取りこぼし。

**テストのカバレッジ欠落**: `tests/worktree-lifecycle-application.test.ts` に
`finish()` 内で `cleanup.record` が throw する case が 1 本も無い。よって
targeted-green の主張はこの経路をカバーしていない。PLAN §5 は finish/abort の
terminal handoff を「実測すべき完了条件」として挙げている。

## 是正方針 (提案)

1. `finish()` で `ports.cleanup.record` の成否を**実 boolean で追跡**する
   (`compensate()` と同じ形にする)。
2. `finish()` 内で `cleanup.record` が throw する negative oracle を 1 本足す。
   `releasePath` 成功 × `cleanup.record` throw の組で
   `cleanupHandoffRecorded: false` が返ることを assert すること。
   恒真にならないよう、`errors.length < 2` へ戻すと落ちることを確認する。

## 参考: 本日の再発パターン

本日 #445 / #446 / #447 でも「契約が宣言する内容をテストが検証していない」型の FLAG が出ている。
本件は少し異なり、**実装が契約に違反している**うえ、その経路にテストが無いため気づけない形。
兄弟実装が正しい形を持っているので、対称性の確認で早期に検出できたはずの類型。
