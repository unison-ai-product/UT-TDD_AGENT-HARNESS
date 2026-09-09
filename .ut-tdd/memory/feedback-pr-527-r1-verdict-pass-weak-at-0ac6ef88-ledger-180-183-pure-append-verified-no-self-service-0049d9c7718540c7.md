---
memory_id: memory:feedback:pr-527-r1-verdict-pass-weak-at-0ac6ef88-ledger-180-183-pure-append-verified-no-self-service-escape-2-non-blocking-notes--b8607deb649c
kind: feedback
title: "PR #527 r1 verdict PASS-WEAK at 0ac6ef88: ledger 180->183 pure append verified, no self-service escape, 2 non-blocking notes"
tags: ["issue439", "ledger", "pr527", "review", "verdict"]
updated_at: 2026-09-09T01:17:47.705Z
---

## 非著者 closing review r1 (Claude `claude-opus-5`) — exact HEAD 0ac6ef88c42026c60cd94d5ed853da15f4c3c997

**VERDICT: PASS-WEAK** (blocking 0)

- canonical receipt: `.ut-tdd/review/receipts/d96a2b3da7da2de68d4b8aece8db61d6d89b560290a8b7f674867cc829d245b8.json` (reviewerFamily claude)
- request memory: `review-request-pr527-0ac6ef88`
- exact-head CI: 5/5 success at 0ac6ef88

### 検証済み

- **Ledger (この head は merge なので個別確認)**: main の 180 record は 48+/0− の純追記により順序ごと
  byte 一致で保存。追記は 181 = PLAN-L7-518 rev2、182 = PLAN-REVERSE-518 rev2、183 = PLAN-L7-518 rev3。
  3 件の `record_digest` を kernel formula (`trackedReceiptRecordDigest`) で再計算し
  `da08b298…` / `90100b97…` / `037ad192…` と完全一致。chain は main tail `bc94c7f7…` から途切れなし。
  `command_id` / `receipt_id` の重複ゼロ。両 PLAN の front-matter `admission_receipt` は各々の新 revision
  entry を指す。
- **merge hygiene**: main 親 → merge は PR の 4 ファイルのみ。旧 head `41ff556d` に対して PLAN 2 本と
  test-design は差分ゼロ (無音の混入なし)。
- **self-service 脱出口 (§3.1/§3.2/§4)**: verdict 済 (FLAG 含む) は retract 不可、author family 限定、
  typed reason code のみ、`superseded` は同一 repository / PR / exact HEAD の canonical closing PASS 系 leaf に
  digest 束縛、後着 verdict との二重終端は fail-close で FLAG 優先保持。逃走可能な class / 遷移は無し。
  `unclosable` の deny 条件は `provider-family-authority` port が未実装 (`unverified_family` 終端) である
  実体で裏付けられている。
- **手動削除の再導出 (§3.5)**: 初版判断は明示的に撤回済み (黙って上書きではない)。正本は ledger 側で、
  ファイル復元は `orphaned_mint` を解消するだけで終端にはならない。
- **PLAN hygiene / 依存是正 (§3.6)**: PLAN-L7-517 の実体 (post-#442 = Git facts のみ) と記述が一致。
  test-design の candidate id 62 件は一意 (048→056 の重複是正を確認)。

### 非 blocking の注記 (2 件)

1. §4 の UNIQUE key の表現が §3.3 の key と語法上ずれる (意味は同一)。
2. Reverse receipt の `reentry` が rev2 のまま = mint 順序による不変の記録。

### レビュー環境の制約 (verdict 本文にも明記済み)

reviewer セッションでは node 実行 / shell loop / script 実行が権限で拒否されたため、183 record 全件の
一括再計算はできず、**追記 3 件を個別に再計算**し、継承 180 件は main と byte 一致であることで担保している。
(Claude root 側では別途 183 件全件を再計算し 0 mismatch / 0 chain break を確認済み。)

なお reviewer の Stop hook が `review-guard` violation として `.ut-tdd/memory/feedback-pr-543-…md` の
mutation を報告しているが、これは同時刻に root が PR #543 の receipt を `ut-tdd memory add` で書いた
共有 tree の transient であり、reviewer の off-task edit ではない (本 PR の subject file には無関係)。

PASS-WEAK のため merge 可。`ut-tdd pr merge --pr 527` で正規経路のみを使う。
