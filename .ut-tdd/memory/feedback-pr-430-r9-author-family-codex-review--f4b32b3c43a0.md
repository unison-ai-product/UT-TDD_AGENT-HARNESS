---
memory_id: memory:feedback:pr-430-r9-author-family-codex-review--f4b32b3c43a0
kind: feedback
title: "PR 430 r9 依頼を拒否: author_family が codex と誤申告され自己 review を通す"
tags: ["author-family", "gate-gap", "pr-430", "review-custody", "same-family-reviewer"]
updated_at: 2026-08-27T03:19:33.047Z
---

## r9 closing review 依頼は実行しない — identity の `author_family` が誤っている

依頼 (`rv1-55b815ea1ec2b4ae0860123185cf36a73452006c8ec0f1f219b0dd63b074470c`) は
`author_family: codex` として登録され、reviewer に Claude Opus 5 を指名している。
**PR #430 の著者は Claude である。** これを実行すると私が自分の PR を review することになる。

### 著者の実測

`origin/main..HEAD` の 9 commit はすべて私 (Claude) が本セッションおよび前セッションで書いたものである:

```
2cd9640c docs(test): CAND-025 から BOM を外し CAND-029 に altered-BOM case を追加 (#430 r8 FLAG 是正)
f32b8421 docs(plan): receipt 束縛 tuple を定義し canonical byte 列を file 別 BOM 非対称へ是正 (#430 r7 FLAG 是正)
0f24aa40 docs(plan): canonical byte 列の信頼源を lint literal へ固定し委任 gate に 025/026 を追加 (#430 r6 FLAG 是正)
b82c3cef docs(plan): 比較手順を byte 単位で確定し symlink 等価性を実測で決着 (#430 r5 FLAG 是正)
bd1518b2 docs(plan): wrapper 契約を canonical text 全文一致へ厳格化 (#430 r4 FLAG 是正)
ab73dc01 docs(plan): wrapper 検出契約を denylist から allowlist へ転換 (#430 r3 FLAG 是正)
4d71940b docs(plan): L4 削除禁止条項を本 PR で改訂し §5.2.1 条3 を排他条件へ (#430 r2 FLAG 是正)
34a937d9 docs(plan): PLAN-L6-93 §5 の wrapper 検出契約を B' へ改訂 (#430 r1 FLAG 是正)
4bd43303 docs(plan): PLAN-L6-93 §5 に旧 Bun 配布経路の処遇契約を freeze
```

r1〜r8 の review 依頼は私が `--review-author-family claude` で Codex へ出しており、
今回だけ author family が反転している。

### なぜ機械が止められないか

`beginReviewAttempt` (`src/feedback/review-verdict-custody.ts`) の分離判定はこうである:

```
const expectedProvider = input.request.authorFamily === "codex" ? "claude" : "codex";
if (input.provider !== expectedProvider)
  return { ok: false, reason: "same_family_reviewer_denied" };
```

`authorFamily` が **request の申告値** なので、申告が誤っていれば
`expectedProvider` も誤り、**`same_family_reviewer_denied` は発火しない**。
今回の場合 `authorFamily=codex` → `expectedProvider=claude` となり、
著者本人である Claude の attempt が正規の非著者 review として受理されてしまう。

attacker/defender 分離は、この 1 field の正しさに全面的に依存している。
`git log` の実 author と照合する機構は無い。

### identity の訂正には新しい digest が必要

`authorFamily` は identity object の構成要素なので、訂正すると digest が変わる (実測):

```
authorFamily=codex   → 55b815ea1ec2b4ae0860123185cf36a73452006c8ec0f1f219b0dd63b074470c  (依頼の値)
authorFamily=claude  → 6c99f904f6edbb4863c7e0f4900366deb56114aaa8c00867f9a8279f1e1f04ef
```

したがって「replacement identity を mint するな」という指示は、本件については成立しない。
**誤った事実を封じた identity は再利用できない。** 正しい `authorFamily: claude` で
request を作り直し、reviewer 側を Codex にしてほしい。私は自分の PR の receipt を mint しない。

### 内容面

r8 blocking 2 件の是正 (025 の BOM 委譲、029 の altered single BOM 独立 mutation) と
PR record の 021–030 更新は私が行ったものであり、CI 3/3 Green も確認している。
ただしそれは**著者の自己申告**であって review ではない。判定は Codex 側で出してほしい。

### 併せて提起したい点

このすり替わりは今回たまたま私が気付いたが、`authorFamily` の申告誤りを検出する
機械的手段が無いこと自体が gate の穴である。`review_evidence[].review_kind=cross_agent` の
doctor gate (`checkCrossAgentModelPair`) は provider 名の組を見るが、request の
`authorFamily` が実 commit author と一致するかは見ていない。別 issue として起票すべきか判断がほしい。
