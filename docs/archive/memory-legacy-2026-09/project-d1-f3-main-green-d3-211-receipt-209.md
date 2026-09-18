---
memory_id: memory:project:d1-f3-main-green-d3-211-receipt-209
kind: project
title: "D1 と F3 が本線合流 (main green) — 次は D3、断線検出 #211 と receipt 再発行 #209 を起票"
tags: ["d1", "d3", "forward", "issue-209", "issue-211", "pr-205", "pr-208"]
updated_at: 2026-07-31T08:58:51.869Z
---

2026-07-31 夕、Forward 順序契約の **D1 と F3 が本線に合流**した。**main CI は `df8ce192` で success**
(#162 の post-merge 罠なし。merge 前に「origin/main へ実際に merge して local commit し gate を直接実行」
で 5〜6 gate green を確認済み)。

## 合流したもの

| PR | 内容 | merge | 判定 |
| --- | --- | --- | --- |
| #205 | D1 review dispatch 状態機械 (外部監査 1/4) | `e9bf7861` | Claude (非 author family) |
| #208 | issue #183 自己 supersede の fail-open 検出 (F3) | `df8ce192` | Codex/Tera PASS at `13eebb68` |

## D1 の設計判断は A 系で決着済

`RECEIPT_SEQUENCE` の順序強制は撤去。**SLA は verdict 1 段** (`SlaBreach = "verdict"` のみ)。
不正 timestamp も breach 側へ fail-close。Fable / Sol 両顧問が A 系へ収束したのを採択決定にした
([[project-d1-receipt-a-sla-1-d1-d3-d2-d3-claude]])。

## 次は D3 (Claude 担当)

**D3 が本当の穴**。GitHub コメントは**同一アカウント名義**で発行されるため、本文から `reviewerFamily` を
安全に証明できない。**D3 (構造化 receipt の発行経路) が閉じるまで analyzer を merge gate として
配線できない**。証明の出所は**委譲記録** (`.ut-tdd/logs/session/claude-*.jsonl` に
`tool_use / target=claude / outcome=ok` が実在する) であって、コメント本文ではない。

順序は **D1 → D3 → D2 → D4** (契約 改訂 3)。

## D1 の carry (D3 で整理)

- `merge_ready` の `!hasFlagVerdict &&` は**到達不能な冗長条件** (mutation M8 で 52 passed = RED に
  ならず実証)。`hasFlagVerdict` は既に `reasons` へ `"flagged"` を入れ、`reasons.size === 0` が
  要求されるため。空振り oracle ではないが残渣。
- `receiptAt <= previous` の単調増加チェックが順序強制撤去後も残っている (死に分岐の疑い)。

## 新規起票

- **#209**: 自己 supersede の実データ 7 件は未修正。`admission_receipt` 再発行で baseline を
  空へ縮小する。#183 は #209 が閉じた時点で閉じる (検出は閉じたがデータは未修正なので open 維持)。
- **#211**: **cross-file の断線を誰も検出していない**。実測で**値 export 134 件が参照ゼロ**
  (型は 697 件)。`impl-plan-trace` は src→PLAN の**所有**を見るので、PLAN が `generates` で
  宣言すれば**到達不能でも green**。実物で踏んだ: PR #205 の `review-dispatch.ts` は呼び出し元 0 件で
  3 checks 全通過。既存で埋まっているもの: 循環依存は `dependency-drift` の `module-cycle`
  (TS compiler API、doctor 登録済) → **madge 不要**。depcheck は knip 包含で不要。
  推奨は `dependency-drift` に `dead-export` finding を足す TS-native 案 (新規 devDep ゼロ、
  #134 の Bun 撤退に無傷)。落とし方は縮小のみ可 baseline + `advisory-strict-gate-aging` 登録。
  着手は D3 の後。
