---
layer: L6
artifact_type: design_doc
status: draft
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
| chained label | `it.each(...)("label", ...)`、`skipIf(...)("label", ...)` の label | data provider と test label を分離し、label だけを契約面にするため |
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
- **oracle**: `U-OIDGATE-008..013` が static/chained、除外、new、baseline、stale、集合一致を固定する。

## 5. V-model 対と受入条件

- L6 の本契約と L7 `U-OIDGATE-008..013` を同一 freeze とする。
- `U-OTT-001..006` は oracle-test-trace 自身の test-design 台帳へ追加する。
- 新しい label citation、未宣言、fixture 内 fake ID、baseline stale を各一件以上 regression
  化する。
- doctor と static gate は既存 `oracle-test-trace` analyzer の結果をそのまま hard gate として
  投影し、別の検出経路を増やさない。
