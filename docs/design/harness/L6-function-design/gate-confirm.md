---
layer: L6
sub_doc: function-spec
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
plan: docs/plans/PLAN-L6-17-gate-confirm.md
---

> **L6 contract marker**: `analyzeGateConfirm(input: GateConfirmInput) => GateConfirmResult` は unit-test-granularity contract である。DbC pre/post/invariant は gate PASS/park state を U-GCONF-001..005 へ対応付ける。

# gate-confirm lint — 関数設計 (IMP-079)

## §1 スコープ

`gate-confirm` は gate status と document freeze status の機械的な結合を検証する。design または test-design document は、対応する `docs/governance/gate-design.md` §2 の gate row が PASS の場合だけ `status: confirmed` にできる。これにより gate record のない status-only freeze を検出する。

## §2 関数

| 関数 | contract |
|---|---|
| `parseGateStatuses(gateText)` | gate-design §2 table から `G<N>` / `L<N>` / status cells を parse する。status cell が `PASS` を含む場合だけ PASS=true とする。 |
| `parseConfirmDoc(file, content, kind)` | design/test-design frontmatter から `layer` と `status` を extract する。 |
| `layerToGate(layer)` | `L<N>` を `G<N>` に map する。non-layer values は null を返す。 |
| `analyzeGateConfirm(input)` | confirmed doc ごとに対応 gate PASS を check する。Gate parse failure は `skipped=true` かつ `ok=false` を返す (fail-close)。 |
| `loadGateConfirmDocs(repoRoot)` | gate-design と `docs/design/harness/**`、`docs/test-design/harness/**` を load する。 |
| `gateConfirmMessages(result)` | doctor 向け OK / violation message を emit する。 |

## §2.1 DbC / fail-close 不変条件

| contract point | 不変条件 |
|---|---|
| gate parser failure | `skipped=true`、`ok=false` とし、message は `violation` を含む。parse ambiguity は silent PASS を生成できない |
| confirmed doc with PASS gate | その doc/gate pair では `violations=[]` とする |
| confirmed doc with park/non-PASS gate | doc path、layer、expected gate を含む violation を 1 件出す |
| draft doc | coupling check では無視する。draft は gate PASS を要求しない |

## §3 Doctor 挙動

現在の integration は hard/fail-close である。`checkGateConfirm` は doctor messages に含まれ、`checkGateConfirm.ok` は `runDoctor.ok` に wired される。gate/doc coupling drift は `ut-tdd doctor` を block する。

## §4 テスト oracle

Covered by `tests/gate-confirm.test.ts`:

| ID | oracle |
|---|---|
| U-GCONF-001 | gate table parser が PASS と park rows を extract する |
| U-GCONF-002 | layer から gate への mapping |
| U-GCONF-003 | park gate + confirmed doc -> violation になる |
| U-GCONF-004 | PASS gate + confirmed doc -> ok になる |
| U-GCONF-005 | parse failure -> fail-close violation になる |
| U-GCONF-006 | draft doc は check 対象外 |
