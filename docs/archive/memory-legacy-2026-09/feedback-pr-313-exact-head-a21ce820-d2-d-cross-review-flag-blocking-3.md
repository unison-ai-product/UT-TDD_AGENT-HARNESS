---
memory_id: memory:feedback:pr-313-exact-head-a21ce820-d2-d-cross-review-flag-blocking-3
kind: feedback
title: "PR #313 exact HEAD a21ce820 D2-D cross-review FLAG blocking 3"
tags: ["claude-action", "cross-review", "d2", "d2d", "flag", "pr-313"]
updated_at: 2026-08-14T01:44:39.157Z
---

VERDICT: FLAG
FINDING: [blocking] `readMergeReceipts`が正式な`MergeExecutionReceipt`を検証せず、`receiptKind=merge_result` / `decision=merge` / pr / headSha の4 fieldだけでwrapper custodyを成立させる。verdict/reason/timestamp/authorizedEntryを欠く手書きJSONでも`hasWrapperReceipt`がtrueとなり、実際のbypass mergeを隠せる。U-RVMG-015 fixture自身がこの不完全receiptなのでfail-openを正解としてpinしている。
FINDING: [blocking] session-start digestから同期実行される`gh api`にtimeout/abort境界がない。`execFileSync("gh", ...)`は`encoding`しか指定せず、API/CLIがhangするとcatchへ到達せず、要求された「検知不能」表示ではなくSessionStart全体が無期限停止する。pagination 50 page上限は各fetchの無期限待ちをboundしない。
FINDING: [blocking] U-RVMG-019はAPI不能経路のoracleになっていない。scanner/fetchを失敗させず、手製の`PostMergeBackstopResult {ok:false}`をdigest/eventへ注入するだけで、default `git remote -> gh api` adapter、page 1 failure、timeoutからunavailableへの変換が全て壊れてもGreen。外部結線未検証のまま9 oracle Greenを主張できる。

Codex non-author cross-review — PR #313 exact HEAD `a21ce820621138a270976de6fa57c6036c5ddf17`。claim-blind/spec-blind双方FLAG、blocking 3。

## 根拠

1. `src/feedback/post-merge-backstop.ts:127-145`はJSON parse後、4 fieldだけで`MergeExecutionReceipt`へcastする。一方正式型 (`src/feedback/review-merge-gate.ts:39-47`) はverdict/reason/timestamp/authorizedEntryを持つ。`tests/post-merge-backstop.test.ts:45-59`も4 fieldだけであり、偽receipt mutantをkillしない。
2. default adapter (`post-merge-backstop.ts:92-104`) の`execFileSync` optionsにtimeoutなし。`selectSessionStartDigest`はsession-start CLI (`src/cli.ts`の`renderSessionStartDigest(selectSessionStartDigest(...))`)から同期呼出しされるため、hook外側のtry/catchは子processが返らない限り機能しない。
3. U-RVMG-019 (`tests/post-merge-backstop.test.ts:146-165`) はscannerを一度も呼ばない。全testのfetchは注入 (`:85`以降)され、`repositorySlug` / default endpoint / first-page failureの実結線oracleが0。

## 攻撃試行

- forged/incomplete receipt: 4 field JSONでreceipt認定されるため攻撃成立。
- hanging gh adapter: child process timeoutなしのため攻撃成立。
- page 2 failure / repeated page / partial malformed:実装とoracleがあり攻撃は反駁済み。
- exact-head D1判定、cutoff、2ページ目正常検知:実装とoracleがあり攻撃は反駁済み。

## 検証状態

- checkout HEADは上記exact SHA。
- targeted snapshot/tsc/biomeの並列ローカル実行は120秒timeoutし、green evidenceには数えていない。
- GitHub exact-HEAD CIはreview時点でpending。blockingはCI結果と独立したfail-open/oracle欠落。

是正要求: (1) 正式merge receipt全fieldをfail-close validateし、不足/不正receiptはcustody証明に使わないmutation oracle、(2) `gh api`の固定timeoutとtimeout→detection unavailable oracle、(3) injected `execFileSync`でrepository slug/endpoint/per_page/pageおよびpage 1 failureを通すdefault adapter oracle。新exact HEADで再レビューする。
