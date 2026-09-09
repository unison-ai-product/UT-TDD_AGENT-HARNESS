---
memory_id: memory:feedback:pr-448-flag-blocking-2-non-zero-receipt-permanently-blocks-merge-for-that-exact-head-and-human-readable-projection-omits-executionoutcome--c12ef928eb5b
kind: feedback
title: "PR 448 FLAG blocking 2: non-zero receipt permanently blocks merge for that exact head and human-readable projection omits executionOutcome"
tags: ["closing-review", "flag", "issue-386", "pr-448", "regression"]
updated_at: 2026-08-27T10:33:32.114Z
---

PR #448 exact HEAD `6dc0313f5deae69482ebbfc780eb8489c2ebec1a` の Claude non-author closing review。

**Verdict: FLAG / blocking 2**
receipt digest `66822425ed93fa68e5a0a88aeb1634ee4fd0a003d8dda4df33df072f15455472`

CI 3/3 SUCCESS だが、**この PR は現状より状況を悪くする退行を含む**。

## blocking 1: non-zero receipt が receipt slot を占有し、その exact HEAD が恒久的に merge 不能になる

non-zero 実行で永続化される `executionOutcome` 付き receipt は、**request digest 単位の唯一の
receipt slot を占有する**。したがって同一 request の再実行は
`projectReviewVerdict` の `verdict_identity_conflict` で**必ず**失敗する
(`src/feedback/review-attestation.ts:312-328` — 既存 receipt と canonicalJson が
`at` / `executionOutcome` で必ず相違するため)。

さらに `evaluateMergeGate` は `entriesForHead` 全件の reasons を deny 材料に積む
(`src/feedback/review-merge-gate.ts:233-242`) ため、その exact HEAD は
**`reviewer_execution_failed` により恒久的に merge 不能**になる。

新しい `reviewRevision` で再依頼しても、旧 request entry が同じ `exactHead` で残り deny し続ける。
**retraction 実装は存在しない** (`src` 内に retract 実装 0 件。PLAN-L7-518 は契約 freeze のみで
実装は未着手) ため、契約内の回復路が無い。

**本 PR 以前は non-zero 時に receipt を書かなかったため、再実行で回復できていた。**
PLAN-L7-520 §2 の「non-zero receipt は監査・再実行の入力として保持する」に対し、
実装が**再実行不能**という退行になっている。

これは本日実際に起きた #438 / #445 の詰まりと同型かつより悪い。#438 / #445 は
「HEAD を進めて旧 request を stale_head へ落とす」escape が使えたが、本 PR 後は
同一 exactHead に対する回復手段が消える。

## blocking 2: 人間可読面が executionOutcome を落とし、誤導的な clean 証跡を提示する

`consumeLiveReview` は `executionOutcome=failed` の projection でも `publishReceipt` を
**先に実行する** (`src/feedback/live-review-projection.ts:214-225`)。
そして `publishLiveReviewReceipt` が生成する PR comment / feedback memory の本文は
**verdict=PASS と blocking 件数のみで、`executionOutcome` を一切含まない**
(`src/cli/review-live.ts:86-106`)。

この repo の merge 規律は closing review の PASS 受領を**人が PR comment で確認する前提**である。
実行失敗したレビューが人間可読面では clean な canonical receipt として提示される。
機械 gate は fail-close するが、**人手 merge を誘発しうる誤導的証跡**であり、
PLAN の「non-zero なのに PASS として merge させない」目的を人間層で満たしていない。

## 是正方針 (提案)

blocking 1 が構造的なので、以下のいずれかが要る:

- **案 A (推奨)**: `executionOutcome=failed` の receipt を **canonical receipt slot に置かない**。
  監査用の別 slot (例: `.ut-tdd/review/execution-outcomes/<digest>/attempt-N.json`) へ書き、
  receipt slot は成功した verdict のためだけに残す。再実行可能性が保たれ、監査証跡も残る。
- **案 B**: PLAN-L7-518 の retraction を**先に実装**し、`reviewer_execution_failed` receipt を
  typed retract できるようにしてから本 PR を入れる。ただし #518 実装は #517 (PR #442、未 merge) の
  provenance に依存しており、直列が長い。
- **案 C**: 本 PR を **`review-live.ts:54` の typed reason 貫通のみ**に絞る (当初提案)。
  受理条件を変えず、診断破壊だけを直す。receipt slot に触れないので blocking 1 は発生しない。

blocking 2 は独立して、PR comment / feedback memory の本文に `executionOutcome` を含める修正で解ける。

## 補足 (訂正)

私が #386 / PR #448 のコメントで「non-zero exit は発生していない」と書いた点は実測どおりだが、
その後 #438 の receipt が新 HEAD で正常生成されたことから、**custody 機構自体は健全**であり、
5 回の失敗は nonce 転記ミスと散文の envelope 誤マッチという偶発要因だったと確定した。
`review-live.ts:54` の診断破壊 (案 C) は実在の欠陥として残るが、`executionOutcome` の
永続化は現状では blocking 1 の退行を招く。
