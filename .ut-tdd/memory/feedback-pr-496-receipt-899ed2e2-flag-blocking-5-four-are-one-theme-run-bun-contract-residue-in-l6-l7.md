---
memory_id: memory:feedback:pr-496-receipt-899ed2e2-flag-blocking-5-four-are-one-theme-run-bun-contract-residue-in-l6-l7
kind: feedback
title: "PR 496 receipt 899ed2e2 FLAG blocking 5 four are one theme run-bun contract residue in L6 L7"
tags: ["canonical-receipt", "claude-review", "pr"]
updated_at: 2026-08-31T09:05:20.518Z
---

# PR #496 canonical review receipt (exact head `8bac71d9`) — **FLAG / blocking 5**

- receipt digest: `899ed2e2045983853ad93fc086b72dd6b3994b5c36bf8aa23e2ada4bba7ba8f8`
- reviewer_family: claude / `claude-opus-5` (review-lane, effort middle)
- at: 2026-08-31T09:03:59Z
- required CI: Linux / Windows / aggregate 3/3 SUCCESS
- 先行 receipt `c07f0264` / `edfd24be` / `fe4912b3` は再利用していません

**これは網羅パスです。** 件数は増えましたが、**5 件のうち 4 件は同一テーマ**であり、
1 回の修正で全部閉じられます。serial discovery を止めるために全部出しました。

## 直前 blocking 2 件は解消済み

- `PLAN-L7-522` は `status: draft` のまま (実測確認済み)。実装 PR 内での親契約 confirm は解消。
- DoD の候補宣言矛盾も解消。

## blocking 1〜4: **同一テーマ** — 撤去した `run-bun` launcher 契約が L6/L7 正本に残存

本 PR は `common/run-bun.ts` template と `COMMON_FILES` 項目を削除し、生成 argv を
`["node", ".ut-tdd/bin/ut-tdd.mjs", ...]` へ変更しました。しかし設計正本・テスト設計正本が
**旧 launcher 契約を宣言したまま**で、同一 HEAD で実装に反証されています。
以下 4 箇所を直せば 4 件とも閉じます (全て逐語確認済み)。

| # | 位置 | 現在の宣言 | 実装の実態 |
|---|---|---|---|
| 1 | `docs/design/harness/L6-function-design/setup-solo-team.md:149` | `ut-tdd setup` は `.ut-tdd/bin/run-bun.ts` と `ut-tdd.mjs` を投影する | `run-bun.ts` は `COMMON_FILES` から削除済み |
| 1 | 同 `:182` | `argv[0]=".ut-tdd/bin/run-bun.ts"`、`argv[1]=".ut-tdd/bin/ut-tdd.mjs"` | `argv[0]=".ut-tdd/bin/ut-tdd.mjs"` |
| 1 | 同 `:155` 付近 (不変条件) | `Bun >=1.3` は core runtime、Node は native Bun launcher に必要 | Bun 不要 |
| 2 | `docs/design/harness/L6-function-design/session-log.md:136` | Claude serializer の argv は native Bun launcher・entrypoint・subcommand を token 化 | launcher token 不在 |
| 2 | 同 `:140` | Windows oracle が「hook host → Bun entrypoint の dispatch ancestry」を前提 | Bun entrypoint 不在 |
| 3 | `docs/test-design/harness/L7-unit-test-design.md:1908` (`U-HOOKEXEC-002`) | `args` は shell-free native Bun launcher、entrypoint、subcommand の token 配列 | 所有テスト `tests/hook-native-launcher.test.ts:111-136` は逆に `run-bun` token の**不在**を assert |
| 4 | 同 `:1915` (`U-HOOKEXEC-008`) | Windows native smoke: hook host → Bun entrypoint の dispatch ancestry | 同 ID のテストを「entrypoint 解決失敗で exit 127」+「wrapper template の shell-free source 検査」へ差し替え済み。ID 再利用で宣言未更新 |

3 / 4 は特に重い形です: **宣言 oracle が自分の実行テストに反証されている**ため、
L7 test-design が正本として機能していません。

先例として `PLAN-L7-371-standalone-readiness-advisory.md:99` が
「L6 設計と L7 テスト設計の記述を…更新した」と記録しており、**実装変更時の doc 追随は
この repo の既定手順**です。#495 の blocking 1 も同じクラスでした。

## blocking 5 (独立): `PLAN-L7-524` の pair 指定が自己矛盾

- frontmatter `pair_artifact` (17 行) =
  `docs/test-design/harness/L7-pack-consumer-generated-bun-removal-backfill-test-design.md`
- §5 (137 行) =「対の test-design は
  `docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md`」(親の test-design)

`status: confirmed` の add-impl PLAN で pair-freeze 対象が一意に定まっていません。
どちらが正かを決めて 1 箇所に揃えてください。

## `ci.requires` について (blocking にはしていません)

exact HEAD では生成 CI template は npm 化済み (`actions/setup-node@v4` / `npm ci` /
`npm run typecheck` / `npm run test`) である一方、`buildConsumerReadinessPlan` の
`ci.requires` は `oven-sh/setup-bun@v2` / `bun install` / `bun run typecheck` /
`bun run test` のままです (実測確認済み)。

これを本 receipt の blocking にはしていません。`ci.requires` は
`buildConsumerReadinessPlan` = readiness 面であり **S1-a (#471) の所有**だからです。
姉妹 PR #495 は逆向きの同じ乖離 (readiness=npm / template=bun) で既に FLAG を受けています。
**両者が land すれば解消します。**

## 収束のための順序 (convergence driver として)

`PLAN-L7-522 §5.1` の推奨どおり **#496 (S1-b) を先に着地させ、その後 #495 (S1-a) を rebase**
してください。この順序なら #495 の blocking 2 (readiness と生成 CI の乖離) は
rebase 時点で自然に消えます。逆順にしたことが #495 の直近 2 round の手戻り要因でした。

したがって **#496 が Bun 撤去 program の現在のクリティカルパス**です。
上記 5 件は全て docs / PLAN の局所修正であり、実装コードの変更は不要です。

## merge gate

FLAG のため `ut-tdd pr merge --pr 496` は deny します。
