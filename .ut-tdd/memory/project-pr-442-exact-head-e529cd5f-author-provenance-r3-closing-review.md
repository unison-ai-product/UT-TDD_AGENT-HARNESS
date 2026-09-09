---
memory_id: memory:project:pr-442-exact-head-e529cd5f-author-provenance-r3-closing-review
kind: project
title: "PR 442 exact head e529cd5f author provenance r3 closing review"
tags: ["closing-review", "exact-head", "issue-437", "pr-442"]
updated_at: 2026-08-28T01:01:45.033Z
---

PR #442 (docs(review): author family 検証契約を pair-freeze, Issue #437) の
exact HEAD `e529cd5f8058741a9dc845c858a3fd248bbeb4cf` に対する非著者 closing review 要求 (r3)。

- author family: claude (Claude 側が PLAN / test-design を authoring)
- reviewer: codex frontier tier (`gpt-5.6-sol`)
- CI: harness-check 3/3 SUCCESS (run 33064922721)

## 前ラウンドからの差分

r2 (`d8cfb660`) の Sol verdict は FLAG / blocking 2 (receipt `54d76c68bbbfaf224e06596f0147da3dc775492a5d83df138eb07e89f9dc1565`)。
本 HEAD はその 2 件を契約側で閉じたと主張する。

1. **dispatch issuer が独立に認証されていない** (worker が issuer と content digest を同時に forge できる)
   → PLAN-L7-517 §3.1 / §3.2 に、issuer 欄と通常の content digest を信頼根にしないこと、
   dispatch custody を worker が書けない append-only の issuer attestation (dispatch identity /
   repository / commit-set / provider / 完了時刻を束縛) として発行し、受理点が独立検証することを追記。

2. **unknown-provenance 旧 request に許された terminal transition が無い** (typed retraction へ倒すが
   #439 / U-RETRACT-043 が unclosable retraction を拒否するためデッドロック)
   → `unknown_provenance_unresolved` の typed non-terminal として merge-blocking に保持し、
   #439 の retraction は独立 provenance 確定かつ #439 §3.2 の機械述語充足時のみ許可する形へ改訂。
   unknown のままの自動終端・再 mint を契約から除去。

変更範囲: `docs/plans/PLAN-L7-517-review-author-provenance.md`,
`docs/plans/PLAN-REVERSE-517-review-author-provenance-backfill.md`,
`docs/test-design/harness/L7-review-author-provenance-test-design.md` (docs のみ、実装差分なし)。

## 判定してほしい点

- 上記 2 件が契約テキストとして実際に閉じているか (prose の言い換えで終わっていないか)。
- test-design 側の oracle が新契約を一意に測るか (grandfather と no-grandfather の双方を許す
  曖昧さが残っていないか — r1 で指摘された類型)。
- 新規に不可能な transition / 未定義の述語を持ち込んでいないか。
