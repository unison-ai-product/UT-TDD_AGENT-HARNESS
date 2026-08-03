---
memory_id: memory:project:pr-214-exact-head-10582f0a-codex-closing-cross-review-request
kind: project
title: "PR 214 exact head 10582f0a codex closing cross-review request"
tags: ["cross-review", "d3b", "exact-head", "pr-214", "review"]
updated_at: 2026-08-03T02:01:55.852Z
---

PR #214 (D3b: verdict 輸送 / ReviewAttestation / receipt 永続化) の closing cross-review を
Codex 側へ依頼する。

**exact HEAD: `10582f0a`** (branch `work/d3b-review-attestation`)。verdict はこの HEAD に対してのみ
有効。依頼後は push しない (artifact freeze)。**verdict が返るまで merge しない** (incident #189)。

## 経緯 (レビュー対象を絞るため)

Codex/terra が RED oracle、Codex/luna が実装。その後 Claude が以下を修正した = **レビュー対象**:

1. **fail-open の是正**: luna 版は request の著者族を `provider === "codex" ? "claude" : "codex"` と
   導出していた。D1 の同族検出は `receipt.reviewerFamily === request.authorFamily` で receipt 側も
   同じ provider 由来なので**恒偽**になり、同族レビューを永久に検出できなかった。
   `resolveReviewAuthorFamily` (signature に provider を持たない) へ置換。
2. **識別子の必須範囲**: 当初「全 review_lane で必須」にして CI を壊した。`REVIEW_GATE_ROLES` は
   14 種あり `qa` / `tl` / `uiux` を含む。opt-in + 部分指定 fail-close へ変更。
3. **誤った安全論拠の訂正**: 「識別子なしでも D1 が SLA breach で拾う」は誤り。breach 判定は
   `input.requests` 起点なので未宣言レビューは判定対象にすらならない。顧問 2 名 (Fable / Sol) が
   独立に refute し、実測で確認済み。保証範囲を限定し、強制は D2 merge gate の責務と明記。
4. **silent undefined の fail-close 化** (U-RVATT-019)、temp dir leak 修正 (U-RVATT-016)、
   実 repo 読みの除去 (U-RVATT-017)。

## 顧問の判定 (前提ではなく参考情報)

- Fable: 安全論拠 REFUTED。`--review-author-family` を anchor にする代案を提示。
- Sol: Fable 案を **REFUTED / 不採用** (override と実レビュー宣言の二重意味)。opt-in 維持 +
  部分/構築不能の fail-close まで、強制は D2 へ、を推奨。**この推奨に従った。**

## 重点

1. 著者族の provider 非依存が**本当に**保たれているか (mutation で恒偽版へ戻すと U-RVATT-015 が
   赤化することは確認済みだが独立に再現してほしい)。
2. opt-in の境界に穴が無いか。「識別子を渡したのに receipt が作られない」経路が他に残っていないか。
3. `U-RVATT-010`〜`012` の輸送 round-trip が空振りしていないか (単一定数 `REVIEW_VERDICT_FILE_ENV`
   を根拠にしているか)。
4. content-addressed 永続化の冪等性 (U-RVATT-003 / 004) が mutation で殺せるか。

## 実測 (exact HEAD `10582f0a`)

- 公式 snapshot runner (attestation / cli-surface / verdict-contract / cli-delegation): **92 passed / 92**
- CI `harness-check` / `-linux` / `-windows`: **3 / 3 pass**
- `tsc --noEmit` / `biome check src tests`: exit 0 / exit 0
- trace 7 ゲート・`test-repository-isolation`・`ddd-tdd-rules`: ok

## 既知の限界 (誇張しない)

`--execute` の実行後投影までを end-to-end で通した単体 oracle は無い (実 provider の起動を単体
テストへ持ち込まないため)。本依頼の委譲自体を新フラグ付きで実行し、実 receipt が生成されるかを
別途実証する。
