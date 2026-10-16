---
title: "L7 deliverable-plan-trace test ownership design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-16
---

# deliverable-plan-trace test ownership テスト設計 (Issue #958 draft)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/oracle-test-citation-trace.md` §6 である。
本書は `tests/**/*.test.ts` の所有根拠に、PLAN `generates` に加えて test-design 宣言と static test-label
citation の結び付きを使う契約を検証する候補 oracle を定義する。L6 の既存 `pair_artifact` は共有
`docs/test-design/harness/L7-unit-test-design.md` を指すままとし、共有 index には変更を要求しない。

候補 ID は `docs/test-design/` に宣言する未実装 oracle であり、formal oracle として扱わない。candidate label の
所有用途は `deliverable-plan-trace` に限られ、`oracle-test-trace` の formal declaration/citation collection や
formal oracle ID 集合へ混入させない。候補宣言元文書 path と static citation の test file path を結び付け、
test file path は `tracedPaths` だけに加える。宣言表に test path 文字列を重ねて要求しない。

## 2. 所有証拠の候補 oracle

全候補の Red fixture は `tests/deliverable-plan-trace.test.ts` を使う。候補 label は test file 内の static
test label として置く。正式昇格前は candidate ID を formal oracle の期待集合に足さない。

| 候補 ID | fixture / 入力 | command / query | 期待結果 |
|---|---|---|---|
| `CANDIDATE-U-DPTOWN-001` | 対象 `tests/new.test.ts` は PLAN `generates` にだけ宣言される | deliverable ownership analyzer | PLAN owner で所有され、orphan にならない |
| `CANDIDATE-U-DPTOWN-002` | formal oracle ID を宣言する test-design 文書と、同じ ID の static label citation を持つ `tests/new.test.ts`。PLAN `generates` は無い | existing declaration/citation collectors と deliverable ownership analyzer | cited ID の宣言元文書 path を provenance として保持し、test path を `tracedPaths` に加える。新規 orphan なし |
| `CANDIDATE-U-DPTOWN-003` | 本書に候補 ID を宣言し、その ID を static `it.fails("CANDIDATE-U-DPTOWN-003: ...")` label に持つ `tests/deliverable-plan-trace.test.ts` | candidate-only ownership collection | 候補宣言元と `it.fails` citation path を結び、test path を `tracedPaths` に加える。formal oracle collection は不変 |
| `CANDIDATE-U-DPTOWN-004` | 2つの独立負例: (a) candidate static label はあるがその ID を宣言する test-design 文書がない、(b) formal static label はあるがその ID の formal declaration がない | candidate/formal ownership projection | いずれも owner evidence にならず、新規 orphan を fail-close する。formal側の未宣言 citation finding も既存 `oracle-test-trace` のまま |
| `CANDIDATE-U-DPTOWN-005` | candidate 宣言はあるが、対応 test file に同じ ID の static label がなく、fixture/body/comment/dynamic label にだけ存在する | candidate-only ownership collection | owner evidence にならず、新規 orphan を fail-close する |
| `CANDIDATE-U-DPTOWN-006` | PLAN `generates` owner と formal または candidate test-design citation owner の両方を持つ test path | `tracedPaths` projection と既存 duplicate analyzer | test-design citation により test path は traced。`ownersByPath` はPLAN ownerのままで、既存duplicate結果を変えない。複数test-design引用も重複所有でない |
| `CANDIDATE-U-DPTOWN-007` | `tests/**/*.test.ts` ではない `tests/**/*.ts` path | deliverable artifact classifier | 本契約の test-file owner 補完対象にしない |
| `CANDIDATE-U-DPTOWN-008` | `scripts/` または `.claude/` の artifact path | deliverable ownership analyzer | 本契約の oracle owner 補完対象にしない。scope は Issue #1088 に委ねる |

## 3. 境界

- PLAN `generates` による所有根拠を廃止しない。新規 test file は PLAN owner または有効な test-design owner の
  いずれかで追跡する。
- 開発 repo を読む Red test に対する `design-protection-diff-gate.md` §10.3 の PLAN-L6-834
  `generates` 要求は、deliverable owner 条件だけ本契約の test-design trace で満たせる。`repositoryReadContracts`
  登録と登録 + Red → 昇格 → Green の順序はそのまま維持し、現 checker は未実装のため引き続き PLAN owner を要求する。
- test-design owner の provenance は宣言元文書 path と citation 先 test file path を保持する。
- test-design owner は `tracedPaths` にだけ反映し、`ownersByPath` および PLAN `generates` 同士の duplicate 判定へ加えない。
- 複数の test-design 文書による同じ test path への citation は許容する。同一 formal ID の重複宣言は既存 `oracle-test-trace` が判定する。
- formal ID は既存 `collectOracleDeclarationSites` / `collectOracleCitationSites` の exact-ID 規則を再利用する。
  test-design の正式宣言が無い citation を所有証拠に読み替えない。
- `CANDIDATE-*` は deliverable-owner 用途のみに分離し、formal oracle として宣言・引用済みとは扱わない。
- 既存 duplicate 判定、既存 ledger、test artifact 集合、scripts/.claude の扱いは別責務である。baseline debt は
  縮小のみとし、expired `promote_by` の処理は Issue #1089 に委ねる。
- 工程は contract → Red → Green → Refactor とし、候補 oracle の正式昇格は実装 Green と同一視しない。
