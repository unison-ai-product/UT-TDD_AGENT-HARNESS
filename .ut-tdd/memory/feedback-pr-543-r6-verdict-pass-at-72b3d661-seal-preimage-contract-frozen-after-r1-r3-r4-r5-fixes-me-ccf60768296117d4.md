---
memory_id: memory:feedback:pr-543-r6-verdict-pass-at-72b3d661-seal-preimage-contract-frozen-after-r1-r3-r4-r5-fixes-merge-is-the-non-author-side-s-call-author-does-not-merge--281874b8f587
kind: feedback
title: "PR #543 r6 verdict PASS at 72b3d661: seal preimage contract frozen after r1/r3/r4/r5 fixes; merge is the non-author side's call, author does not merge"
tags: ["issue542", "pass", "pr543", "review", "seal-preimage", "verdict"]
updated_at: 2026-09-09T03:04:42.497Z
---

## 非著者 closing review r6 (Codex `gpt-5.6-sol`) — exact HEAD 72b3d66141ced29bae3430bbeab90388a398c0f9

**VERDICT: PASS** (blocking 0)

- canonical receipt: `.ut-tdd/review/receipts/2153f19b98e551a9023efc5e8fae9ca93bc4977d6949762547f7b66bacfa9961.json` (reviewerFamily codex, at 2026-09-09T03:03:43Z)
- request memory: `review-request-pr543-72b3d661`
- exact-head CI: run 34304167683 5/5 success (harness-check aggregate / linux / windows / node-generation 両 OS)

### reviewer が実測したこと

- baseline projection は 180 record、`sequence` は 1..180 で **欠番・重複・欠測なし**。
- 対象 PLAN (`PLAN-RECOVERY-16-plan-revision-authoring`) は **実測どおり 4 record** (sequence 1, 2, 3, 73)。
  最大 sequence 73 が rebase asset revision 2 に**一意決定**する。doc に書いた数え上げは再現された。
- parser は配列 index+1 を `sequence` として必須化し record hash chain を検証するため、旧 record の選択は
  r6 契約で塞がれている。
- E.2 framing の独立再計算が legacy / rebase の期待 digest 双方と一致。

### review 系譜 (すべて exact-head 束縛、流用なし)

| 版 | head | verdict | blocking |
|---|---|---|---|
| r1 | c0c40c65 | FLAG | 2 (E.3 到達可能性 / E.4 ローカル artifact authority) |
| r3 | fe80ed7d | FLAG | 3 (E.4 preimage 未固定 / E.3 path 差し替え / E.5 キー順二重規定) |
| r4 | 599b6ce5 | FLAG | 1 (E.4 decision 要素が未凍結) |
| r5 | b2957185 | FLAG | 1 (E.3 projection が terminal 一意束縛でない) |
| r6 | 72b3d661 | **PASS** | 0 |

Issue #542 の contract freeze はこれで PASS を得た。**merge は非著者側の判断**であり、著者 (Claude) からは
実施しない。後続は #542 AC 1 (実装 PR) → #541 (L6-93 seal 実行) → #540 (cutover chain prefix writer) →
#487 の順で、いずれも本 head の契約を前提とする。
