---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-522-pack-consumer-bun-path-removal
---

# L7 test design: Pack/consumer 実行面の Bun 到達経路撤去

対の Forward は `docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md`、
Reverse 対は `docs/plans/PLAN-REVERSE-522-pack-consumer-bun-path-removal-backfill.md`。

## 1. 方針

候補 oracle は `CANDIDATE-U-PACKBUN-001..006` として宣言する。未実装の oracle を正規 ID にしない。
正規 ID への昇格は各 slice の実装 PR が Red test と同時に行う。

prefix `U-PACKBUN` は既存 registry と衝突しない
(`grep -o "U-PACKBUN-[0-9]*" docs/test-design/harness/L7-unit-test-design.md` = 0 件、2026-08-28 実測)。

各 oracle は**単軸 mutation で独立に Red になる**こと。複数の是正をまとめて 1 本の oracle で
観測する形にしない。

## 2. 候補 oracle

| Candidate | Stimulus | Oracle |
| --- | --- | --- |
| `CANDIDATE-U-PACKBUN-001` | Bun 未導入 (PATH にも `~/.bun` にも Bun が無い) の clean consumer fixture で **`ut-tdd setup` を実際に実行する** (readiness 関数を単体で呼ぶのではない) | setup が完了し readiness が `ok: true`。現行 `src/setup/distribution.ts:373` の `ok: bunOk && …` を残すと必ず Red。Issue #450 AC1 は「`ut-tdd setup` を実行し、readiness が `ok: true`」であり、readiness 計算の単体評価では AC1 を満たさない (PR #469 review、receipt `47144e18…` の指摘により是正) |
| `CANDIDATE-U-PACKBUN-002` | 同上の環境で readiness の check 一覧を取得する | check 名 `bun>=1.3` が存在せず、`Install Bun 1.3 or newer before setup` が出力に現れない。代わりに `engines.node` 準拠の node バージョン check と git check が存在する |
| `CANDIDATE-U-PACKBUN-003` | `ut-tdd setup` が生成した consumer tree 全体を再帰走査する | `bun` 実行子 / `#!/usr/bin/env bun` / `oven-sh/setup-bun` / `run-bun.ts` の出現が **0 件** |
| `CANDIDATE-U-PACKBUN-004` (negative control) | `PLAN-L7-522` §2.1 が列挙する**生成経路ごと**に、撤去済みの Bun 出力を 1 つずつ復活させて 003 を再実行する。最低限の軸は (a) `templates.ts` の `#!/usr/bin/env bun` shebang、(b) `templates.ts` の `common/run-bun.ts` / `findBun()`、(c) `templates.ts` の生成 consumer CI (`oven-sh/setup-bun@v2` / `bun install` / `bun run *`)、(d) `templates.ts` の案内文、(e) **`distribution.ts` が生成 `package.json` へ書く `"test": "bun run test:pack"`** | **復活させた各軸について 003 が必ず Red になる**。003 が恒真でないことを証明する。**軸ごとに独立の case とし、1 軸でも Red にならなければ 004 自体を Red とする**。特に (e) は生成元 module が `templates.ts` ではないため、`templates.ts` だけを走査する 003 実装では検出できない。003 の走査対象が生成 tree 全体であることを (e) が担保する |
| `CANDIDATE-U-PACKBUN-005` | `.github/workflows/harness-check.yml` から `oven-sh/setup-bun@v2` を除去した状態で Pack/consumer acceptance fixture を実行する | fixture が Green。Bun の install / download / invocation trace が 0 |
| `CANDIDATE-U-PACKBUN-006` (不変条件保護) | 本 slice の全 PR の diff を対象に、(i) `package.json` の `build` script、(ii) BAN 検出側 lint の**検出能力**を観測する。検出能力は「deny rule の本数」「debt allowlist の path 集合」「pin 値」で測る (条文の逐語一致では測らない) | (i) `build` script が不変。(ii) **`PLAN-L7-522` §3.3 が freeze した 15 サンプルを各 lint へ入力し、表が指定する rule で全サンプルが依然 fail-close されること** (behavioral)。加えて **matcher 分岐単位で網羅性を assert する** — 各 Bun 正規表現の `source` を alternation で分解し各分岐がサンプル 1 件以上にマッチすること、述語 rule は reason 単位で同じことを要求する。覆えていない分岐 / reason が 1 つでもあれば 006 自体を Red とする。**rule id 単位の列挙では既存 rule の内部に分岐が足された場合を検出できない**ため、分岐単位であることが必須。加えて deny rule の削除、allowlist への新規 path 追加、pin 値の引き上げが 1 件でもあれば Red。件数・集合・pin の比較は behavioral 検査の補助であり代替ではない — **同数のまま matcher を弱める変更 (deny rule の本数を保ったまま正規表現を緩める等) は件数比較では検出できない**ため、サンプル入力側で必ず Red になること。**`github-ci-policy.ts` の required step を `setup-bun` から Node 経路へ差し替える変更は Red にしない** — S1-c がそれを必要とするため (`PLAN-L7-522` §3.3)。逐語不変で測る初版は S1-c の正しい実装を Red にしていた (PR #469 review、receipt `47144e18…` の指摘により是正) |

## 3. slice との対応

| slice | child Issue | 昇格対象 |
| --- | --- | --- |
| S1-b (生成成果物) | #470 | `CANDIDATE-U-PACKBUN-003` / `004` |
| S1-a (readiness) | #471 | `CANDIDATE-U-PACKBUN-001` / `002` |
| S1-c (source CI) | #472 | `CANDIDATE-U-PACKBUN-005` |
| 全 slice 共通 | #470 / #471 / #472 | `CANDIDATE-U-PACKBUN-006` |

`006` は各 slice の PR で個別に評価する (最後にまとめて 1 回ではない)。
`build` script や BAN 検出側 lint への混入は、混入した PR で検出されなければ意味がないためである。

## 4. Issue #450 受入条件との対応

| Issue #450 AC | 対応 |
| --- | --- |
| AC1 (Bun 未導入 clean consumer で readiness ok) | `001` / `002` |
| AC2 (生成 tree の Bun reachable path 0 + negative control) | `003` / `004` |
| AC3 (Node-only sealed runtime 生成) | **本 test design の対象外**。`PLAN-L7-522` §4.3 の読み替えにより Slice 2 (`PLAN-L6-93` → `PLAN-L7-458` 系列) が所有する |
| AC4 (`setup-bun` 除去後も fixture Green) | `005` |

## 5. 非証明事項

本 test design は候補 oracle の宣言であり、実装、Red 化、Green 化、
`oracle-test-trace` の充足、Issue #418 の受入のいずれも証明しない。
`CANDIDATE-U-PACKBUN-004` の negative control が実際に Red を出すことも、
実装 PR が実測するまで主張しない。
