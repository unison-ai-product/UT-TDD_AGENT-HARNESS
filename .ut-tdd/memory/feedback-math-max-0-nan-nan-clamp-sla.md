---
memory_id: memory:feedback:math-max-0-nan-nan-clamp-sla
kind: feedback
title: "Math.max(0, NaN) は NaN — 経過時間 clamp は不正日付を吸収せず SLA 検知を沈黙させる"
tags: ["2026-07-31", "date", "fail-open", "review-dispatch", "sla", "verification"]
updated_at: 2026-07-31T05:30:20.060Z
---

経過時間 gate で `Math.max(0, (Date.parse(now) - Date.parse(then)) / 60_000)` と書くと、
**不正日付を吸収したつもりで fail-open になる**。

`Math.max` は引数に `NaN` があれば `NaN` を返す (ECMA-262)。`0` に clamp されない。
したがって `Date.parse` が失敗した瞬間に:

- `age > threshold` の比較がすべて `false` になる
- 超過検知 (SLA / timeout / stale 判定) が**沈黙する**
- `ok` は `true` のまま = **危険側**へ倒れる

2026-07-31、PR #205 (review dispatch 状態機械) の blind review が実際にこれを検出した。
`requestedAt` は永続化された memory / receipt 由来の **agent 生成文字列**なので、
「型が `string` だから日付として妥当」は成り立たない。到達可能な経路である。

## どう書くか

- `Number.isFinite` で**明示的に検証**し、確定できないときは専用 reason (`invalid_timestamp` 等) を
  積んで `ok=false` へ倒す。「不明」を「閾値内」と同義にしない。
- 出力に載せる経過時間は**有限値**にする (`NaN` を外へ出さない。JSON 化で `null` に化けて
  下流の判定をさらに壊す)。
- `now < then` の clamp (負値 → 0) は別問題。clamp は残しつつ、**NaN は clamp では消えない**
  ことを理解しておく。

## 一般化

**「安全側に倒すつもりの式が、異常入力では安全側に倒れない」**類型。
clamp / default / `??` / `try-catch` で握り潰す形は、正常系だけ見ると安全に見える。
異常入力を 1 本テストに通すまで「fail-close である」と主張しない。
