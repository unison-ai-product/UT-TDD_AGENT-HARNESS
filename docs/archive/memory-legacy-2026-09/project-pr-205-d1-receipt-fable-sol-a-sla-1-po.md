---
memory_id: memory:project:pr-205-d1-receipt-fable-sol-a-sla-1-po
kind: project
title: "PR #205 D1 receipt 順序強制 — Fable/Sol 両者が A 系へ収束、SLA は 1 段へ畳む (PO 裁定待ち)"
tags: ["advisor", "d1", "design-decision", "pr-205", "review-dispatch"]
updated_at: 2026-07-31T06:38:57.126Z
---

PR #205 (D1 review dispatch) の `RECEIPT_SEQUENCE` 順序強制について、Fable (`claude-fable-5`) と
Sol (`gpt-5.6-sol`) へ**独立に**諮問した。**両者とも A 系 (verdict 錨定) に収束し、
私の FLAG は SURVIVE した**。

## 争点

Codex の hardening が入れた `RECEIPT_SEQUENCE = ["acknowledged","in_review","verdict"]` は、
verdict 単独の receipt を `out_of_order_receipt` で**捨てる**。結果:
`acceptedReceipts` が空 → `hasAcknowledged`/`hasStarted`/`hasVerdict` 全 false →
**ack/start/verdict の 3 breach が恒久的に出続け、`merge_ready` に永久到達しない**。

## 両者の裁定

| | Fable | Sol |
| --- | --- | --- |
| 推奨 | **A** (verdict 錨定、順序欠落は診断のみ) | **D = A の精緻化** (terminal verdict 優先) |
| SLA | **1 段に畳め** (verdict 到達までの経過時間) | **1 段に畳め** (同) |
| B 棄却理由 | 発行主体が存在しない義務の新設。機械強制の当てが無く A と同じ帰結を高コストで得る | producer 不在の契約を analyzer だけで強制 → 全件偽陽性。**導入順序が逆** |
| C 棄却理由 | 実データで一度も通らない**デッドパス** | 旧 HEAD receipt の流用は exact identity と reviewRevision 分離を崩す |
| PO 裁定 | **不要** (spec は監査原文で確定済、A は準拠回復) | **必要** (15/30/60 分は運用契約であり実装判断を超える) |

## 私の諮問文の誤りが 2 つ訂正された (記録)

1. **「4 本すべて verdict 1 本だけ」は Sol に反証された。** #202 は依頼+verdict、#204/#205 は
   複数コメント、#208 は現時点で依頼のみ。**正確な言明は「どの PR にも独立した
   `acknowledged`/`in_review` artifact が無い」**。B3′ の核心 (producer 不在) は崩れない。
2. **「時間閾値テストは flaky」は Fable に未検証の思い込みと指摘された。** analyzer は `nowMs`
   注入の純関数なので固定 `nowMs` を渡せば**決定的**。SLA oracle は書ける。

## B2′ の扱い

Sol: **blocking 評価は REFUTED**。不正 timestamp は `invalid_timestamp` + `ok:false` になるので
自動承認方向の fail-open ではない。ただし `ageMinutes` / breach の**異常系 oracle 欠落は実在する
非 blocking のテスト欠陥**。→ oracle は足す、blocking 扱いはしない。

## 両者が指摘した見落とし (未対応、carry)

- **Fable**: `Number.isFinite(requestTimestamp)` ガードにより、request 時刻が parse 不能だと
  `receipt_before_request` チェックが**素通り**する (fail-open)。判定不能は merge_ready 不可へ倒すべき。
- **Fable**: 順序強制を外すなら `receiptAt <= previous` の単調増加チェックも死に分岐になる。残骸除去。
- **Sol (最大の未解決点)**: GitHub コメントから `reviewerFamily` / exact HEAD / reviewRevision を
  **信頼できる構造化 receipt へ変換する D3 が未実装**。現在のコメントは同一 GitHub アカウント名義で、
  本文だけから family を安全に証明できない。**D1 を直しても D3 を閉じるまで analyzer を
  merge gate として配線できない**。

## close 条件 (両者の和集合、固定 nowMs 注入で決定的)

1. exact identity・非 author family・PASS verdict **単独**・OPEN・CI green → `merge_ready`、breach なし
2. 同条件の FLAG → `merge_ready` 不可、blocking finding 保持、未応答 breach なし
3. same-family PASS → verdict 不受理、`merge_ready` 不可
4. 旧 HEAD への PASS のみ → `merge_ready` 不可 (exact HEAD 不変条件)
5. 旧 HEAD ack + 現行 HEAD PASS → **現行 PASS を受理し `merge_ready`** (仕様空白を埋める oracle)
6. verdict 無し + `nowMs = requestedAt + 61min` → **verdict breach 1 本のみ**
   (ack/start breach が**出ない**ことも assert = 畳み込みの回帰フェンス)
7. malformed / request 以前 / identity 不一致 verdict → 不受理、61 分なら verdict breach
8. verdict 無しで MERGED → `merged_without_verdict` (PR #201 回帰)
9. 正規 3 段 sequence → 従来どおり成功
10. invalid / future timestamp → `ok:false`、`ageMinutes` の表現も明示 assert
11. receipts / prs の shuffle で結果不変

## 手続き上の制約

修正は **Codex 側へ返す**。Claude が FLAG を出した側なので、A 実装を Claude が書いて自己承認する形にしない
(Fable の条件 (b))。PLAN-L7-465 D1 の設計判断節に「Codex の意図的 hardening を supersede する」旨と
本諮問を記録する (新規 PLAN / ADR は不要 — 両者一致)。
