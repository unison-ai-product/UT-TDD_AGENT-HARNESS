---
memory_id: memory:feedback:issue-218-d2-live-vs-code-review-canonical-writer-wiring-gap
kind: feedback
title: "Issue #218 D2 live VS Code review canonical writer wiring gap"
tags: ["d2", "d3a", "issue-218", "operations", "review-dispatch"]
updated_at: 2026-08-14T03:24:59.803Z
---

## D2実運用FLAG: canonical producerは存在するが、live VS Code review経路から未配線

2026-08-14、PR #309 exact HEAD `e0de8d49` で `ut-tdd pr merge --pr 309` を実走し、`no_request_for_current_head` / `orphan_pr_observation` でdenyされた。root実測は `.ut-tdd/review/requests=1`（旧PR #300のみ）、`receipts=0`。その後の直mergeをD2-Dがbypass真陽性として拾う。

### 原因の訂正

producer自体が未実装なのではない。現mainには既に以下がある:

- `src/feedback/review-attestation.ts`: `issueReviewRequest()` / `projectReviewVerdict()` が `.ut-tdd/review/{requests,receipts}` へ永続化。
- `src/cli/delegation.ts`: `ut-tdd codex|claude --role reviewer|blind-reviewer --review-pr/--review-head/--review-revision/... --execute` の時だけ上記を呼ぶ。

一方、実運用のcross-reviewは `ut-tdd memory add --notify-claude` → live Claude VS Code session → PR comment / feedback memory で完結し、delegationの4 review identity flag経路を通らない。したがってrequest/receiptが0のままD2-Bだけが常時denyする。**consumer不良ではなく、live review配送と既存canonical writerの未接続**。

### advisor結果と最小Forward

`ut-tdd advisor --decision design ... --execute`（Fable 5）は、`.ut-tdd/review`を唯一のD1/D2入力、memory wake/PR commentを派生通知に限定し、Issue #218 / PLAN-L7-465 D3a内で接続する案を推奨。新規Issue・別SSoT・別schemaは不要。

実装前にfreezeすべき最小契約:

1. live VS Code向けreview dispatchは既存`issueReviewRequest()`を先に成功させ、その後にmemory wakeを派生配送する。request失敗時は通知だけ送らない。
2. verdict返却は既存`projectReviewVerdict()`と同じschema/validatorを通してreceipt化し、その後にPR comment/memoryを派生表示する。
3. exact HEAD更新時は旧requestを流用せず再dispatch。移行中open PRは1回だけ再dispatch。
4. oracleは dispatch→request存在→verdict→receipt存在→同一HEAD wrapper allow、別HEAD/receipt欠落deny、D2-D bypass誤検知0を実repo E2Eで固定。
5. memory/commentをD1/D2判定入力へ読む実装は禁止（SSoT二重化防止）。

現在rootにはClaudeのD3 trusted-custody作業差分があり、同じPLAN-L7-465を編集すると重複するため、Codexはここで実装PRを起こさない。Claude側はこの観測をD3a/D2の次契約改訂へ取り込むこと。
