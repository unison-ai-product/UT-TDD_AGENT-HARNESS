---
title: "L7 consumer design phase doctor test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/consumer-design-phase-doctor.md
status: confirmed
updated: 2026-11-04
issue: 1527
---

# consumer 設計フェーズ doctor profile テスト設計 (issue #1527)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/consumer-design-phase-doctor.md` である。本書は §3 の profile、§4 の実装前判定、§5 の非要件、§6 の結果状態と summary を検証する oracle (`CANDIDATE-U-CDPD-001`〜) を定義する。

## 2. fixtures

- すべて一時ディレクトリに作る使い捨ての repo で行う。実 repo (本 repo) を対象にしない。
- `designed`: `resolveVModelRoots` が解決する `designRoot` に L1〜L3 の設計文書と対の test-design を持つ最小 repo (`src/` も `package.json` も無い)。
- `designed-l1-only`: L1 の設計文書と、その対になる test-design だけを持つ repo (L2 / L3 が無い)。L1 の設計文書は有効な `pair_artifact` で test-design を指し、test-design はその設計文書を逆参照する。したがって pair-freeze は `pass` になる。
- `designed-l1-only`: L1 の設計文書だけを持つ repo (L2 / L3 が無い)。
- `empty`: 設計文書も `src/` も `package.json` も無い repo。
- `with-package-json`: `empty` に `package.json` だけを足した repo。`with-src`: `empty` に空の `src/` だけを足した repo。

## 3. oracle

| ID | 対象 | 入力・期待・反例 |
| --- | --- | --- |
| CANDIDATE-U-CDPD-001 | profile の登録 | 期待: `consumer-design-phase` が `DOCTOR_RUN_PROFILE_IDS` と `--profiles` 一覧に `audience=consumer` / `sourceOnly=false` で現れる。反例: 未登録 id が受理される / source-only 扱いになる |
| CANDIDATE-U-CDPD-002 | pair-freeze と存在層の gate の実行 | 入力: `designed` で profile を実行。期待: pair-freeze と G1 / G2 / G3 が実行され、違反が無ければ全て `pass`、exit 0。反例: gate が実行されず空の pass になる |
| CANDIDATE-U-CDPD-003 | 入力層の無い gate は not-applicable | 入力: `designed-l1-only`。期待: G2 と G3 は `not-applicable`、G1 は評価されて pass か fail。反例: 不在の層の gate が `pass` になる / `fail` になる |
| CANDIDATE-U-CDPD-004 | 設計文書が無い repo | 入力: `empty`。期待: pair-freeze と G1〜G3 がすべて `not-applicable`、exit 0、summary は「検査された項目なし」を明示する。反例: 全件 `pass` と表示される |
| CANDIDATE-U-CDPD-005 | pair-freeze 違反で fail | 入力: `designed-pair-broken`。期待: pair-freeze が `fail`、profile 全体が exit 1。反例: 違反が `not-applicable` や pass に埋もれる |
| CANDIDATE-U-CDPD-006 | gate 違反で fail (G1・G2・G3 を個別に) | 3 つの入力を、それぞれ他の検査がすべて `pass` の状態で与える。(a) `designed` の L1 設計文書に、G1 の trace が検出する孤児を 1 件作る → G1 だけが `fail`。(b) `designed` の L2 設計文書 1 本を `status: draft` にする (対の文書は残すので pair-freeze は `pass`) → G2 の layer-pair が `fail`、G1 と G3 は `pass`。(c) `designed` の L3 設計文書に、G3 の trace (`G3-trace`) だけが検出する違反を 1 件作る (L3 の layer-pair は満たす) → G3 だけが `fail`。期待: どの入力でも、該当する gate の結果が `fail` で、profile 全体が exit 1。G2 は layer-pair、G3 は layer-pair と trace の合成であり (`src/gate/static.ts` の `evaluateStaticGate`)、consumer-design-phase はこの評価をそのまま使う。反例: 適用判定が違反を握りつぶす / G2 や G3 の結果を常に `pass` に置き換える (b・c で落ちる) |
| CANDIDATE-U-CDPD-007 | src も package.json も無いと toolchain は対象外 | 入力: `empty` で `--profile consumer-toolchain`。期待: `toolchain-pin` は `not-applicable (実装前)`、赤にならない、理由文言 `実装前` が出力にある。反例: 赤になる / 理由なしの対象外 |
| CANDIDATE-U-CDPD-008 | package.json が現れると toolchain が戻る | 入力: `with-package-json` で同じ profile。期待: `toolchain-pin` が通常どおり実行され、結果は pass か fail のどちらか (`not-applicable` ではない)。`empty` の後に `package.json` を足した同一 repo でも、再実行で通常実行に戻る。反例: `not-applicable` のまま残る |
| CANDIDATE-U-CDPD-009 | src だけでも toolchain は実行 | 入力: `with-src`。期待: `toolchain-pin` が通常実行される。反例: `package.json` が無いだけで `not-applicable` になる |
| CANDIDATE-U-CDPD-010 | summary は not-applicable を pass に数えない | 入力 (a): `designed-l1-only` で profile を実行する。4 検査の結果は確定している: pair-freeze は `pass`、G1 は `fail` (`consumer-trace-gates.md` §5 が G1 に L1 / L2 / L3 の core 文書を要求し、L2 / L3 が無いため)、G2 と G3 は `not-applicable`。期待: summary は pass 1 / fail 1 / not-applicable 2 と数え、exit 1。`--json` の 4 件の結果に 3 状態と、not-applicable の理由がある。入力 (b): summary の集計関数へ、合成入力として `pass` 1 件と `not-applicable` 3 件を直接渡す。期待: pass 1 / not-applicable 3 と数え、「全件 pass」と表示しない。反例: (a) で pass 2 件以上と数える / fail を落とす。(b) で pass 4 件と数える / 「全件 pass」と表示する |
| CANDIDATE-U-CDPD-011 | profile は src を要求しない | 入力: `designed` (`src/` も `package.json` も無い) と、同じ repo に空の `src/` と `package.json` を足したもの。期待: 両方で `consumer-design-phase` の結果が同一。反例: `src/` が無いと失敗する / 有無で結果が変わる |
| CANDIDATE-U-CDPD-012 | 実装前判定の局所性 | 入力: `empty` で `consumer-design-phase` と `--setup-smoke`。期待: 実装前の対象外規則は `consumer-toolchain` だけに適用され、他 2 つの結果状態を変えない。反例: `consumer-design-phase` の gate が実装前を理由に `not-applicable` になる |
