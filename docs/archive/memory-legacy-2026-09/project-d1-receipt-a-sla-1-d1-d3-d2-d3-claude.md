---
memory_id: memory:project:d1-receipt-a-sla-1-d1-d3-d2-d3-claude
kind: project
title: "D1 receipt 順序は A 系を採択 — SLA 1 段へ、順序は D1→D3→D2、D3 は Claude 担当"
tags: ["adopted", "d1", "d3", "decision", "pr-205", "review-dispatch"]
updated_at: 2026-07-31T06:56:36.395Z
---

PR #205 (D1 review dispatch) の `RECEIPT_SEQUENCE` 順序強制について、**A 系 (verdict 錨定) を
採択した**。この論点で判断待ちは無い。**先行メモリ「PO 裁定待ち」は本メモリが supersede する。**

## 採択内容

1. 現行 exact HEAD の有効な `verdict` を**終端証拠として受理**する (先行 receipt の有無を問わない)。
2. 順序欠落は**非 blocking の診断 reason** に留める。`merge_ready` を妨げない。
3. **SLA は 1 段へ畳む** — actionable breach は「request から有効 verdict 未到達のまま 60 分超過」のみ。
   `ack` (15 分) / `start` (30 分) は breach として出さない。
4. D3 で受領・開始を自動記録する producer が実装された時点で 3 段 SLA を復活させる。

## なぜ PO 裁定に上げなかったか (手続きの教訓)

一度 PO へ上げたが**差し戻された**。「裁定って何を？なんでもこっちによこすな。というか俺が決める
必要があるものですらないだろそれ」。

**判断基準**: 15/30/60 分は PO が外部監査経由で示した数値だが、監査原文自身が「**本質は無反応の
検知であってレビュー内容を急がせることではない**」と目的を明示している。3 段を 1 段へ畳むのは
**その目的を変えない実装判断**であり、PO の意思決定事項ではない。Fable の「裁定不要」が正しく、
Sol の「運用契約だから PO 必要」に寄せたのが誤りだった。

**一般化**: 顧問が「PO 裁定が要る」と言っても、それ自体は上げる理由にならない。上げるのは
**PO が示した目的そのものが変わる**ときだけ。目的が同じで手段が変わるなら自分で決める。

## 棄却理由

- **B (3 receipt を reviewer に義務づけ)**: 発行主体が実在しない契約を analyzer だけで強制しても
  全件偽陽性。導入順序が逆 (Sol)。機械強制の当てが無く A と同じ帰結を高コストで得る (Fable)。
- **C (旧 HEAD receipt を ack 相当に数える)**: 実データで一度も通らないデッドパス (Fable)。
  exact identity と reviewRevision の分離を崩す (Sol)。

## 実装担当と family 分離

**Codex が実装する。** Claude が FLAG を出した側なので A 実装を Claude が書いて自己承認しない。
`834bb22c` まで Codex 稼働中を確認済みで、並行実装はしない (PR #205 の並行実装事故の再発防止)。
決定は PR #205 のコメントで配送済み。

## 順序の組み替え: D1 → **D3** → D2

Sol の指摘が決め手。GitHub コメントは**同一アカウント名義**で発行されるため、本文だけから
`reviewerFamily` を安全に証明できない。**D3 (構造化 receipt の発行経路) が閉じるまで analyzer を
merge gate として配線できない**。よって D2 (SLA surface 配線) は D3 の後。**D3 は Claude が着手する。**

## close 条件 (両顧問の和集合、固定 nowMs 注入で決定的)

1. exact identity・非 author family・PASS verdict 単独・OPEN・CI green → `merge_ready`、breach なし
2. 同条件の FLAG → `merge_ready` 不可、blocking finding 保持、未応答 breach なし
3. same-family PASS → verdict 不受理、`merge_ready` 不可
4. 旧 HEAD への PASS のみ → `merge_ready` 不可
5. 旧 HEAD ack + 現行 HEAD PASS → 現行 PASS を受理し `merge_ready`
6. verdict 無し + `nowMs = requestedAt + 61min` → **verdict breach 1 本のみ** (ack/start が出ないことも assert)
7. malformed / request 以前 / identity 不一致 verdict → 不受理、61 分なら verdict breach
8. verdict 無しで MERGED → `merged_without_verdict`
9. 正規 3 段 sequence → 従来どおり成功
10. invalid / future timestamp → `ok:false`、`ageMinutes` の表現も明示 assert
11. receipts / prs の shuffle で結果不変

## 併せて対応 (両顧問の指摘、未対応 carry)

- `Number.isFinite(requestTimestamp)` ガードの fail-open: request 時刻が parse 不能だと
  `receipt_before_request` が素通り。判定不能は `merge_ready` 不可へ倒す。
- `receiptAt <= previous` の単調増加チェックは順序強制を外すと死に分岐。残骸を残さない。
