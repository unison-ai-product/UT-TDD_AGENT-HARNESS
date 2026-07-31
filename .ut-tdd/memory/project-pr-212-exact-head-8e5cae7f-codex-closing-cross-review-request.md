---
memory_id: memory:project:pr-212-exact-head-8e5cae7f-codex-closing-cross-review-request
kind: project
title: "PR 212 exact head 8e5cae7f codex closing cross-review request"
tags: ["cross-review", "d3a", "exact-head", "pr-212", "review"]
updated_at: 2026-07-31T10:58:51.957Z
---

PR #212 (D3a: reviewer 出力契約の注入 + verdict 構造化抽出) の closing cross-review を Codex 側へ依頼する。

**exact HEAD: `8e5cae7f`** (branch `work/d3-verdict-receipt`)。verdict はこの HEAD に対してのみ有効。
依頼後は本 PR へ push しない (artifact freeze)。**verdict が返るまで merge しない** (incident #189)。

## なぜ Codex が判定側か

混成著作のため。Codex/luna が `extractVerdict` 本体と `src/cli/delegation.ts` への contract 注入を書き、
その後の load-bearing な変更 (下記) は Claude が書いた。直近の変更の著者が Claude なので、
判定は別族 (Codex) に置く。

Claude 著 = レビュー対象:

- prompt echo 対策 (`EXAMPLE_INDENT` + `reviewOutputContractExample` の dedent)
- 回帰 oracle `U-RVCON-017 / 018 / 019`
- `ddd-tdd-rules` の `test-oracle-strength` 是正 (`b869d6a8`)
- CI 環境依存の是正 (`8e5cae7f`)

## 重点

1. **prompt echo 対策が load-bearing か。** 委譲 task text は provider の captured log へ行頭のまま
   echo される。契約の模範出力を行頭 `VERDICT:` で書くと、reviewer が PASS を返したログに
   「echo された FLAG」と「実判定の PASS」が並び `verdict_ambiguous` になる。結果
   **PASS だけが恒久 fail-close し FLAG は通る**非対称な破壊が起きる。`EXAMPLE_INDENT` を `""` に
   戻すと `U-RVCON-017` / `019` が赤くなることは Claude 側で確認済みだが、独立に再現してほしい。
2. **`U-RVCON-015` の round-trip が空振りしていないか。** contract と parser の乖離を殺す最重要
   oracle。mutation で殺せることを確かめてほしい。
3. **環境依存スタブが oracle を弱めていないか。** `UT_TDD_CODEX_BIN` にスタブを差した結果、
   「注入経路を実際に通っている」ことの証明力が落ちていないか。
4. `flag_without_findings` の fail-close が D1 の `relevantReceipts` filter と整合しているか
   (FLAG + findings 0 件の receipt は D1 が丸ごと捨てるため、抽出段で落とす設計)。

## 実測 (exact HEAD `8e5cae7f`)

- 公式 snapshot runner (commit 済み HEAD を clone): **19 passed / 19**、`RUNNER_EXIT=0`
- `tsc --noEmit` exit 0 / `biome check src tests` exit 0
- CI `harness-check` / `-linux` / `-windows`: **3 / 3 pass**

CI green は **provider CLI が存在しない環境**で得られたもの = 直前の CI 赤を露出させた当の条件での実証。
