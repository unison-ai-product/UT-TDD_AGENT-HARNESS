---
memory_id: memory:feedback:pr-336-re-review-at-93ca017f-three-blockings-fixed-grounded-in-existing-canonical-code-but-new-blocking-model-escalation-retry-deadlocks
kind: feedback
title: "PR 336 re-review at 93ca017f three blockings fixed grounded in existing canonical code but new blocking model escalation retry deadlocks"
tags: ["d3a", "design-freeze", "issue-328", "pr-336", "retry-deadlock"]
updated_at: 2026-08-18T11:51:24.109Z
---

## PR #336 re-review = FLAG (blocking 1 / advisory 3) — exact HEAD 93ca017fd78471e9e8015fa51c3c0e0cb9175b33

CI は review 時点 pending (run 32133457218)、PR draft、merge せず。

### 前回 blocking 3 件は解消 (実測付き)

B-1: digest preimage が既存実装と一致。src/feedback/review-custody-canonical.ts の ReviewRequestIdentity (schemaVersion/memoryId/pr/exactHead/authorFamily) と computeReviewRevision / REVIEW_REVISION_PATTERN (^rv1-[0-9a-f]{64}$) に一致し、RFC 8785 canonicalize も同ファイルに実装済み。実装が preimage を発明する余地が消えた。
B-2: .gitignore の verdicts 限定 rule と git check-ignore regression を implementation 必須成果物として予約。tracked review docs/requests/receipts の誤除外も禁止。
B-3: §3.4 新設。U-RVATT-010 を同 ID で repo-local 契約へ改訂 + 旧 tmpdir assertion 退役 + correction note、isOutsideRepo を外部拒否 predicate へ転用、review-guard regex へ verdicts 追加を必須化。
advisory も解消: cleanup_pending は .ut-tdd/audit/review-custody.jsonl の typed event、fence は verdicts 配下を volatileRuntimeIndex 扱い + fixture 1:1、provider evidence は .ut-tdd/audit/review-custody-sandbox-v1.jsonl (最低 1 OS、stub green を証拠にしない)。

### 新規 blocking B-4: model escalation retry のデッドロック

(1) digest preimage に reviewer provider/model が入らないため retry は必ず同じ path、(2) §3.3 は異なる model を同じ digest directory へ置く試みを verdict_identity_conflict で拒否、(3) receipt 前の削除・上書きは禁止。よって 1 回目の verdict が receipt に至らず残った状態で別 model 再依頼すると出口が無い。これは CLAUDE.md の escalateShallowResponse (浅い回答は effort 1 段 → その先は model を上げる) と正面衝突し、reviewer family は authorFamily の反対側固定なので族を変えて digest を変える逃げ道も無い。

是正案: (a) attempt 次元を path/identity へ入れる、または (b) receipt 前の supersede を consumer 判定で明示許可し superseded_attempt を audit へ記録。いずれも U-RVATT-034 の期待表へ「別 model retry」行を追加する必要がある。

### advisory

A-1: ignored dir 配下の .gitkeep は negation rule が無いと commit できない。check-ignore regression の期待に「.gitkeep は ignored でない」を含める。
A-2: verdicts を fence hash から除外すると verdicts 内のテスト残留が fence で見えない。cleanup oracle が受け皿である旨を fixture 検証に 1 行。
A-3 残存制約: 実 provider sandbox 実測は未取得のまま。

### 手法メモ

契約が既存実装の型・関数と一致しているかを grep で突き合わせると、「発明の余地が消えたか」を機械的に確認できる。また retry / escalation のような運用ループは、identity の次元 (何が digest に入るか) と上書き禁止条項の組み合わせでデッドロックしやすい。
