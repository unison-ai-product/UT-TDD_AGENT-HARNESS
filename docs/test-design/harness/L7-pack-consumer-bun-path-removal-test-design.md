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
| `CANDIDATE-U-PACKBUN-001` | Bun 未導入 (PATH にも `~/.bun` にも Bun が無い) の clean consumer で `ut-tdd setup` の readiness を評価する | readiness が `ok: true`。現行 `src/setup/distribution.ts:373` の `ok: bunOk && …` を残すと必ず Red |
| `CANDIDATE-U-PACKBUN-002` | 同上の環境で readiness の check 一覧を取得する | check 名 `bun>=1.3` が存在せず、`Install Bun 1.3 or newer before setup` が出力に現れない。代わりに `engines.node` 準拠の node バージョン check と git check が存在する |
| `CANDIDATE-U-PACKBUN-003` | `ut-tdd setup` が生成した consumer tree 全体を再帰走査する | `bun` 実行子 / `#!/usr/bin/env bun` / `oven-sh/setup-bun` / `run-bun.ts` の出現が **0 件** |
| `CANDIDATE-U-PACKBUN-004` (negative control) | `src/setup/templates.ts` の撤去済み template (`common/run-bun.ts`、`#!/usr/bin/env bun` shebang、生成 CI の `oven-sh/setup-bun@v2`) を 1 つずつ復活させて 003 を再実行する | **復活させた各軸について 003 が必ず Red になる**。003 が恒真でないことを証明する。復活軸ごとに独立の case とする |
| `CANDIDATE-U-PACKBUN-005` | `.github/workflows/harness-check.yml` から `oven-sh/setup-bun@v2` を除去した状態で Pack/consumer acceptance fixture を実行する | fixture が Green。Bun の install / download / invocation trace が 0 |
| `CANDIDATE-U-PACKBUN-006` (不変条件保護) | 本 slice の全 PR の diff を対象に、`package.json` の `build` script と `src/lint/runtime-portability.ts` / `github-ci-policy.ts` / `rule-drift.ts` / `toolchain-pin.ts` の Bun 参照を観測する | いずれも変化していない。`build` script の削除、または BAN 検出側 lint の Bun 参照の削除が混入すると Red |

## 3. slice との対応

| slice | 昇格対象 |
| --- | --- |
| S1-b (生成成果物) | `CANDIDATE-U-PACKBUN-003` / `004` |
| S1-a (readiness) | `CANDIDATE-U-PACKBUN-001` / `002` |
| S1-c (source CI) | `CANDIDATE-U-PACKBUN-005` |
| 全 slice 共通 | `CANDIDATE-U-PACKBUN-006` |

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
