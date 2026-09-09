---
memory_id: memory:feedback:pr-489-canonical-receipt-454353d3-flag-blocking-3-supersedes-my-pass-weak--7cb726855250
kind: feedback
title: "PR #489 canonical receipt 454353d3 FLAG blocking 3 supersedes my PASS-WEAK"
tags: ["canonical-receipt", "claude-review", "pr"]
updated_at: 2026-08-31T07:38:51.776Z
---

# PR #489 canonical review receipt (exact head `37bdc60a`) — **FLAG / blocking 3**

- receipt digest: `454353d339fdc3571dd8a564027311a67e52e4bc7b6404b5eb048637c398e9e8`
- request: `454353d3...` (rv1、author_family=codex)
- reviewer_family: claude / model `claude-opus-5` (review-lane, effort middle)
- at: 2026-08-31T07:38:07Z
- path: `.ut-tdd/review/receipts/454353d3….json`

**この receipt は、私が同じ head に対して先に投稿した PASS-WEAK / blocking 0 のコメントを
supersede します。** そちらは canonical receipt ではない暫定所見であり、以後は本 receipt を
正本としてください。私の判定が甘く、下の blocking 3 を見落としていました (特に 3 番目)。

## blocking findings

1. `docs/test-design/harness/L7-unit-test-design.md:2136` が legacy positive の唯一の入力として
   `LegacyF0aBackfillBundleV1` を指定するが、この識別子は exact HEAD 全体で当該 1 箇所にしか
   存在せず (grep 1 hit)、L5 `NODE-SLICE-LEGACY-BACKFILL-REGISTRY-v1` にも L6 / PLAN / Reverse にも
   定義がない。**未定義 trust root を positive oracle にしており**、実装者が L5 から導出できない。

2. 同じ L7 の記述が本 PR 内で自己矛盾している。L7:2061-2064 は
   「`legacy.d0-admission` / `legacy.f0a-custody` を正本とし、下位 test design で独自の
   trust root 又は bundle tuple を追加しない」と明記し、L7:2128 も legacy positive を
   `LegacyD0TrackedReceiptSetV1` で封印すると書くのに、L7:2136 は別 bundle tuple を
   「だけを使い」と規定する。L5 の 2 行分離という PR 主題を L7 が打ち消す残骸であり、
   どちらが正本か判別できない。

3. `legacy.f0a-custody` 行の固定入力のうち **「PR #192 の非著者 PASS receipt digest」と
   「toolchain/lock custody evidence digest」を供給する正本が、L5 / L6 / PLAN-L6-93 / L7 の
   いずれにも無い。** `legacy.d0-admission` 側は `docs/governance/plan-admission-receipts.json` の
   source commit `f38974da` と 4 command ID から決定的に再構成するコマンドが PLAN-L6-93 と L7 に
   固定されているのに対し、F0a 側は取得元 artifact も再構成手順も未定義で、
   `legacy_evidence_unavailable` の判定条件も D0 再構成にしか結び付いていない
   (F0a merge `12aadde9` の内容を確認したが、digest 化対象となる非著者 PASS receipt artifact は
   repo に存在しない)。atomic に 2 receipt を mint する契約に対し、**片側の入力を供給できない
   導出ギャップが残る**。

## 位置づけ

blocking 3 は、`117f0f7c` で私が挙げた blocking (「L5 が F0a 半分を宣言していない」) の
**一段深い層で同じ欠陥が残っていた**もの、という関係にあります。`e643c6ee`/`37bdc60a` で
F0a 行そのものは L5 に追加されましたが、その行が要求する入力のうち 2 要素について
「どの artifact から、どう再構成するか」が依然どの層にも無い状態です。
D0 行と同じ粒度 (取得元 artifact + 決定的再構成コマンド + `legacy_evidence_unavailable` の
発火条件) まで固定すれば閉じます。

blocking 1 / 2 は L7:2136 の 1 文を 2 row 表記へ置換すれば同時に閉じます。

## merge gate

FLAG のため `ut-tdd pr merge --pr 489` は deny します。修正後は新しい exact HEAD に対して
`review live-dispatch` を再発行してください (本 receipt は再利用不可)。
