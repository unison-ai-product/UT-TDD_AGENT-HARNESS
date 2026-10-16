---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_oracle_test_citation_trace
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
plan: docs/plans/PLAN-L6-98-oracle-test-citation-contract.md
---

# oracle-test-trace 逆向き citation 契約

## 1. 目的

`oracle-test-trace` は従来、`docs/test-design` にある oracle ID が `tests/` に現れるかという
forward 方向だけを検査していた。これではテストが設計台帳に無い oracle ID を使っていても、
test-design が検証の正本から外れたまま検出できない。Issue #259 のため、テスト側の明示的な
label citation を収集し、設計側の宣言へ戻る trace を追加する。

## 2. citation surface の分類

| 分類 | 収集 | 理由 |
|---|---|---|
| static test label | `describe` / `it` / `test` の最初の静的文字列引数にある oracle ID | 実行される test suite/case の名前であり、検証対象を明示するため |
| chained label | `it.each(...)("label", ...)`、`skipIf(...)("label", ...)`、`it.skip("label", ...)`、`describe.only("label", ...)`、`test.todo("label")` の label | data provider / modifier と test label を分離し、label だけを契約面にするため |
| fixture / body reference | 収集しない | 架空 ID、入力値、snapshot、ドキュメント再引用を citation と誤認しないため |
| comment / baseline | 収集しない | 検査器の説明・ratchet 自体を実体 citation にしないため |
| dynamic label | 収集しない | 実行時値を静的に再現できず、別契約なしに宣言済みとは判定できないため |

collector は TypeScript の完全 AST を導入せず、コメントと文字列を飛ばす小さな lexical scanner
で test call と最初の label を同定する。これにより、fixture 文字列中の `it("...")` を code
として誤認しない。収集結果は ID・相対 path・行番号・`kind=static-test-label` の provenance
を持つ。

## 3. 逆向き ratchet

`declared = collectOracleDeclarationSites().map(id)`、`cited = collectOracleCitationSites()` と
する。既存 forward leg の broad `collectOracleIds().declared` 契約は維持するが、reverse leg は
正確な test-design table row の宣言 site を使う。`cited.id ∖ declared` のうち
`ORACLE_TEST_CITATION_BASELINE` に無い ID は新規断線として
fail-close する。baseline にある ID が宣言済みになった、または test label から消えた場合は
stale baseline として fail-close し、baseline の縮小を要求する。集合比較を使い、件数一致だけの
偽 Green を許さない。

forward 側の `referenced` 集合は既存契約を維持する。reverse 側だけが static test-label surface
を使うため、fixture の ID を既存 forward gate から取り除くことはしない。

## 4. 関数契約

`collectOracleCitationSites(repoRoot) => OracleCitationSite[]` は、`repoRoot/tests/` を読み取り、
静的 test label の ID・相対 path・行番号・`kind` を返す純粋な収集境界である。

- **pre**: `repoRoot` は検査対象リポジトリの root で、`tests/` が存在する。
- **post**: 返却 site は相対 POSIX path・1-origin 行番号・許可された oracle ID のみを持ち、
  同一 label の再走査で重複しない。
- **invariant**: コメント・fixture/body・baseline・dynamic label の ID は返却集合へ混入しない。
- **oracle**: `U-OIDGATE-008..015` が static/chained/modifier、regex 境界、除外、new、baseline、stale、集合一致を固定する。

## 5. V-model 対と受入条件

- L6 の本契約と L7 `U-OIDGATE-008..015` を同一 freeze とする。
- `U-OTT-001..006` は oracle-test-trace 自身の test-design 台帳へ追加する。
- 新しい label citation、未宣言、fixture 内 fake ID、baseline stale を各一件以上 regression
  化する。
- doctor と static gate は既存 `oracle-test-trace` analyzer の結果をそのまま hard gate として
  投影し、別の検出経路を増やさない。

## 6. `deliverable-plan-trace` における test file 所有証拠 (Issue #958 draft)

> **状態**: この節は Issue #958 の追加契約 draft であり、既存 §2〜§5 の formal oracle citation 契約を
> 書き換えない。対になる候補 oracle は `docs/test-design/harness/L7-deliverable-plan-trace-test-design.md`
> に置く。L6 の `pair_artifact` は既存の共有 index のまま維持する。

### 6.1 適用範囲と所有条件

この追加規則が補う対象は `tests/**/*.test.ts` の deliverable ownership だけである。対象 test file は、次の
いずれか 1 つで所有証拠を持つ:

1. 既存どおり、PLAN の `generates[].artifact_path` が対象 path と一致する。
2. `docs/test-design/` の oracle 宣言と、対象 file 内の同じ ID を持つ static test-label citation が一致する。

2 の所有証拠は `oracle-test-trace` の既存 `collectOracleDeclarationSites` / `collectOracleCitationSites` が持つ
ID・test-design 宣言元 path・test file path・行番号を対応付け、その test file path を `tracedPaths` に加える。
test-design 文書 path は provenance として保持するが、`ownersByPath` には加えない。コメント、fixture/body、
dynamic label、未宣言 ID は所有証拠にならない。formal oracle の宣言と citation は既存の exact-ID /
duplicate / baseline 規則に従う。

候補 ID (`CANDIDATE-*`) は未実装 oracle のままであり、formal oracle の宣言集合・citation 集合・
`OracleCitationSite` へ混ぜない。候補 label が所有証拠になるのは、この gate に限り、`docs/test-design/`
内の候補宣言と対象 file の同じ候補 ID を持つ static test label が対応する場合だけである。宣言元文書 path と
static citation の test file path を対応付け、test file path を `tracedPaths` に加える。候補専用経路では、
既存の `describe` / `it` / `test` static-label surface と §2 の chained/modifier label の lexical boundary を使い、
さらに Red の `it.fails("...")` / `test.fails("...")` の静的 label も所有証拠として認める。この追加は候補専用で、
既存 formal collector の結果を変えず、候補の形式的な昇格・実装完了も意味しない。
dynamic label、fixture/body、comment は候補の所有証拠にならない。formal collector の結果と §2〜§5 の規則は
変えず、L7 宣言に test path 文字列を重ねて要求しない。

この OR により、新規 test file は PLAN 所有または test-design 所有のどちらかで trace できる。既存の
test artifact 集合、`scripts/` / `.claude/` の扱い、ledger による既存 debt ratchet は本節の対象外であり、
別 Issue #1088 が scripts/.claude の ownership を扱う。expired `promote_by` の ledger 行は本節で変更せず、
別 Issue #1089 の対象とする。ledger の新規 debt 追加・期限延長・期限到来による自動昇格は行わず、既存 debt
は縮小のみを許す。

既存 L6 `design-protection-diff-gate.md` §10.3 が開発 repo を読む新 test file に要求する
PLAN-L6-834 `generates` 登録は、その test file の deliverable owner 条件に限り、本節の test-design trace
でも満たせる。これは未実装目標契約であり、現在の `deliverable-plan-trace` checker はなお PLAN owner に依存する。
§10.3 の `repositoryReadContracts` 登録責務と登録 + Red → 昇格 → Green の順序は変えず、PLAN-L6-834 を含む
他の PLAN 要件も変更しない。

### 6.2 所有者 provenance と重複判定

test-design 宣言元 path は引用元 provenance として保持する。test-design 由来の所有証拠は
`tracedPaths` だけに加え、`ownersByPath` は従来どおり PLAN `generates` の owner ID だけを保持する。
`duplicate-artifact-ownership` の入力と判定、baseline の適用は変更せず、PLAN `generates` 同士の既存重複だけを
同じ規則で検出する。複数の test-design 文書が同じ test file を引用することは正当な trace であり、
重複所有ではない。同じ formal ID の宣言重複は既存 `oracle-test-trace` の責務である。

PLAN owner と test-design owner を同じ `ownersByPath` に union する案は採らない。origin/main `8d0d1bac`
の実 repo を既存 formal collectors で照合したとき、宣言 citation を持つ test file 186 件中 183 件は既に
PLAN owner を持っていた。この owner path を同じ vector に加えると、既存 duplicate analyzer をそのまま使っても
ledger 外の `duplicate-artifact-ownership` が 140 件増える。これは2種の独立した代替 trace を誤って重複所有と
扱うためであり、test-design path は `tracedPaths` のみへ反映し、PLAN 重複の入力・結果を不変にする。

### 6.3 工程

pair の次は contract → Red → Green → Refactor の順とする。Red は専用 L7 test-design の候補だけを引用し、
正式 oracle への昇格は別の後続工程とする。`it.fails` の Red 登録を formal oracle citation と見なさない。
