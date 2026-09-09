---
memory_id: memory:feedback:pr-489-exact-head-37bdc60a-claude-opus-closing-pass-weak-blocking-0--05da091bfc94
kind: feedback
title: "PR #489 exact-head 37bdc60a Claude Opus closing PASS-WEAK blocking 0"
tags: ["claude-review", "closing-verdict", "pr"]
updated_at: 2026-08-31T07:31:34.154Z
---

# PR #489 non-author Claude Opus closing verdict (exact head `37bdc60a`)

- exact_head: `37bdc60a` (`docs(node): localize F0a registry prose`)
- base: `7cc60772`
- request: `454353d3...` (2026-08-31T07:21:33Z, author_family=codex)
- required CI: Linux **SUCCESS** / Windows **SUCCESS** / aggregate **SUCCESS**
- prior receipt: FLAG/2 `98728043...` (at `0baf7570`) — 再利用しない
- prior Claude verdict: FLAG/1 (at `117f0f7c`) — 再利用しない
- verdict: **PASS-WEAK**
- blocking: **0**

## 先行 blocking 1 の解消確認 (closed)

`117f0f7c` で指摘した「legacy backfill registry が F0a 半分を宣言しておらず、
L8/PLAN-L7-458 が `LegacyD0TrackedReceiptSetV1` exact 1 から D0/F0a 二 receipt が
導出されると主張していた」件は、`e643c6ee` + `37bdc60a` で層をまたいで解消されました。

- **L5** `internal-processing.md:478-482`: `NODE-SLICE-LEGACY-BACKFILL-REGISTRY-v1` を
  散文から **2 行の表**へ昇格。`legacy.f0a-custody` 行が、私が「L5 に存在しない」と
  指摘した入力そのもの (F0a 元 HEAD `76d0f9c7`、統合 commit `12aadde9`、
  `legacy.d0-admission` の receipt digest、PR #192 非著者 PASS receipt digest、
  toolchain/lock custody evidence digest) を固定 tuple として保持し、
  receipt producer を `f0a-toolchain-owner` に分離しています。
- **L6** `function-spec.md:2246-2249`: 二 row を順に exact 照合し二 receipt を atomic に
  mint する形へ更新。command authority と row 別 producer の混同を明示的に禁止。
- **L8** `CAND-CUTOVER-106`: 導出元が
  「`LegacyD0TrackedReceiptSetV1` exact 1 から二 receipt」→
  「`legacy.d0-admission` / `legacy.f0a-custody` から二 receipt」へ訂正。
  **私が指摘した矛盾文そのものが消えています。**
- **PLAN-L7-458**: `CAND-NODEBOOT-018` 行、§296、§335 の 3 箇所を同じ形へ統一。
- **PLAN-L6-93** §3: 項目を `legacy.d0-admission →` / `legacy.f0a-custody →` に紐付け、
  reject 条件も「bundle ID」→「registry ID、row ID」へ更新。
- **L7** unit test design: `CAND-NODEBOOT-018` の固定 tuple が L5 二 row 正本であること、
  かつ「下位 test design で独自の trust root 又は bundle tuple を追加しない」を明記。
- **PLAN-REVERSE-458** §4: 片側 mint / tuple mutation / wrong authority・producer /
  double mint / 削除後 remint を Red、二 row atomic exactly once だけ Green と規定。

先行 receipt (`98728043`) の 2 件も `117f0f7c` 時点で解消済みであることを再確認しました。

## non-blocking 1 (要修正): `LegacyF0aBackfillBundleV1` が定義なしの宙吊り識別子として残存

`docs/test-design/harness/L7-unit-test-design.md:2136`

> PR #154/#192のlegacy positiveは`LegacyF0aBackfillBundleV1`**だけを使い**、D0 source HEAD …

本 delta は他の全参照 (PLAN-L6-93:164、L8:346、PLAN-L7-458 §296) を二 row 表記へ置換し、
**PLAN-L6-93 にあったこの識別子の定義文を削除**しました。結果、`LegacyF0aBackfillBundleV1`
は docs 全体で L7:2136 の 1 箇所にしか現れず、定義が存在しません。

さらに同じファイルの 2060-2063 行に本 delta が追加した

> 下位test designで独自のtrust root又はbundle tupleを追加しない。

と、2136 行の「この bundle **だけ**を使う」が同一ファイル内で衝突します。

blocking にしない理由: 2136 行が列挙する内容 (D0 `8b339ec7`/`f38974da`、F0a `76d0f9c7`/
`12aadde9`、two-lane review、exact 4 plan admission、toolchain/lock evidence) は
L5 二 row の**和集合と完全に一致**しており、「片側だけの publish は 0」という文も
二 receipt 構造と整合します。したがって #484 が**別の trust root を選べる余地は無く**、
残っているのは名前の陳腐化だけです。先行 2 回の blocking はいずれも
「ある層が要求する入力を別の層が供給できない」導出ギャップでしたが、本件は該当しません。

とはいえ定義のない識別子を正本 test design に残すのは
CLAUDE.md Coding Rules の「誤解を招く残骸を負債として残さない」に反します。
2136 行を `legacy.d0-admission` / `legacy.f0a-custody` 表記へ置換してください (1 文)。

## non-blocking 2 (再掲): L5 の legacy 節の挿入位置

`117f0f7c` の review でも挙げた点で、未対応です。二 row 表は依然
`AttestedTrackedReceiptRecord` wrapper の記述の**途中**に挿入されており、表の直後に

> `tracked_record_digest`はembedded `tracked_record.recordDigest`とexact一致しなければならず…
> D0 graphへ4 wrapperをtyped object/refとして格納し、unsigned/self-hash-only/forged/untrusted…を拒否する

が続きます。直前の文が「backfill後の全D0/F0a admissionは通常registryへ戻り」なので
係り先は復元可能ですが、legacy row は attestation field を持たないため
`unsigned/self-hash-only/forged` を legacy へ誤って係らせると、先行 blocking 2 で
閉じたはずの「反証不能な negative」が読み手のレベルで復活します。
legacy 節を wrapper 記述が完結した後ろへ 1 段落移すだけで解消します。

## canonical receipt について

本 verdict の canonical receipt は**まだ発行できていません**。request `454353d3` に
対応する wake envelope が `.git/ut-tdd-runtime/claude-memory-wake/inbox/` に publish
されておらず (issue #454 の stale workspace 判定)、`review live-consume` の入力が
存在しないためです。

この turn 終了時に Stop hook が generation marker を更新するので、その直後に
同一 head `37bdc60a` へ `review live-dispatch` を再実行してください。
envelope が landing すれば `review live-consume` で canonical receipt を mint できます。
なお request digest は同一入力なら `454353d3` のままになります。
