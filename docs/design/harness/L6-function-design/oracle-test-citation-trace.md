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
内の canonical な候補宣言表で ID 専用セル全体が候補 ID と完全一致し、対象 file の同じ候補 ID を持つ
static test label citation が対応する場合だけである。候補宣言も formal 宣言と同じ canonical table row/cell
境界で認定し、本文の記述、ID 範囲、再引用、他セルへの埋め込み、部分文字列一致は宣言に数えない。
候補専用 collection は候補 ID を formal declaration sites に混ぜない。宣言元文書 path と static citation の
test file path を対応付け、test file path を `tracedPaths` に加える。候補専用経路では、
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

## 7. Forward baseline の正本と縮小専用 ratchet（Issue #1099 草案）

> **状態**: Issue #1099 の契約 draft。専用の supplemental 候補設計は
> `docs/test-design/harness/L7-oracle-test-trace-baseline-test-design.md` に置く。
> 既存 §2〜§5 の reverse test-label citation、§6 の deliverable ownership、または
> `docs/test-design/harness/L7-unit-test-design.md` の共通 index を置き換えない。本節と専用 L7 は本文で相互参照し、
> 新たな V-model pair_artifact を宣言しない。

### 7.1 Baseline データの正本

Forward oracle tracing の既存規則を維持する。test-design で宣言され tests に citation のない ID は、該当する
legacy または widened の debt set に含まれる場合だけ許容する。analyzer の完全な集合一致を包含比較や件数比較へ
弱めてはならない。2 つの set は意味を分け、相互に重複させない。

正本データは `docs/governance/oracle-test-trace-baseline.json` とし、field は `schemaVersion`、`legacy`、
`widened` の 3 つだけとする。`legacy` と `widened` は文章や範囲表記ではなく、oracle ID の完全な文字列配列である。
strict decode を行い、ファイルの欠落・読取不能、JSON 不正、version または値型の不正、未知 field、不正な ID token、
各配列内の重複 ID、2 集合間の重複を拒否する。TS 定数や空集合への fallback は設けない。初回移行では移行前 main の
定数から両集合を要素単位で同一に複写し、oracle の退役・再分類を同時に行わない。初回 main 値を維持し、legacy は
正確に 89 件、widened は 317 件とする（件数だけでなく各旧定数との要素集合一致を要求する）。#1097 が提案する
315 件を初回 seed にしてはならない。この変更では legacy debt の後続退役も行わない。

既存関数の `repoRoot` 引数は、`docs/test-design` と `tests` を走査する subject repository を示す。
baseline authority root も明示し、開発時は source checkout、clean Pack 実行時は配布済み harness asset root を
指す。いずれも process working directory から推測してはならない。実装は第 2 path 引数ではなく明示 reader / asset
port を用いてもよいが、source checkout と Pack の双方で同じ versioned JSON authority を特定できる境界にする。
subject scan root が consumer project だからという理由で、その root を harness asset root と誤認してはならない。

### 7.2 独立した 2 つの ratchet 証明

analyzer は引き続き、現在の subject から再導出した widened debt 集合と、現在の authority JSON から読み込んだ
widened 集合との完全な要素集合一致を要求する。これにより U-OIDGATE-005/006 を維持し、欠落した免除と stale
免除の両方を検出する。

これとは別に、必須 PR check は GitHub Actions が PR 用に固定した検証 merge commit `M = github.sha` を使って
縮小専用の進化を証明する。信頼する比較組は常に `B = M^1` (merge commit の第 1 親) と `H = M` である。
各集合について `headSet(H) ⊆ trustedBaseSet(B)` を確認し、base JSON は `B` の Git tree から、head JSON は
`H` の Git tree から読む。`pull_request.base.sha`、PR branch HEAD、`origin/main`、可変 branch 名、analyzer 導出集合、
working tree 上の複製を `B` または `H` の代わりに使ってはならない。`M`、その第 1 親、Git object、各 JSON を解決・読取
できない場合、またはデータが不正な場合は fail-close とする。`M` を検証対象 HEAD とする点は、既存
`design-protection-diff-gate.md` §7 の CI pair (`BASE_SHA=${{ github.sha }}^1`, `--head "${{ github.sha }}"`) と一致させる。
必須 check の PR context は GitHub Actions の `github.event_name == pull_request` と immutable `github.sha` を信頼元とし、
branch 名・本文・任意の environment variable から推測しない。subset ratchet は required CI boundary に限る。
通常の local doctor / static run は subset 証明を実行・主張せず、strict JSON authority と current-derived set の完全一致だけを
検証する。現在の derived set との完全一致は subset 証明の代わりにならない。未 citation の oracle を新たに宣言し、
同じ ID を head baseline と derived debt の双方へ足すと、完全一致を保ったまま縮小専用規則に違反し得るためである。

PR 外の doctor / static-analysis path は、現在の strict JSON authority を検証・利用し analyzer の集合一致を強制する。
通常の local doctor / static-analysis は履歴に対する subset 証明を行わない。baseline JSON が変更される
すべての PR に対して、変更分類が docs-only であっても PR ratchet check を必須にする。

**既存 loader の optional port と typed failure**

subject と authority の境界は既存 `loadOracleTestTraceInput(subjectRoot)` を保ち、必要な依存だけを第2引数の
optional `ports` から注入できる形にする。既存1引数呼出しは後方互換であり、local doctor / static run は strict JSON
authority と subject の complete-set equality だけを検査する。port は読取依存を差し替える seam であり、別 loader や
doctor 専用経路を追加しない。authority reader と CI-only ratchet reader は別 port とする。最小形は次のとおり。

```ts
const BASELINE_JSON_PATH = "docs/governance/oracle-test-trace-baseline.json" as const;

type OracleTraceAuthorityFailureReason = "authority_read_failed";

type OracleTraceGitIoFailureReason =
  | "git_first_parent_read_failed"
  | "git_object_read_failed";

type OracleTraceFailureReason =
  | OracleTraceAuthorityFailureReason
  | "baseline_asset_missing"
  | "baseline_json_malformed"
  | "baseline_schema_invalid"
  | "baseline_id_invalid"
  | "baseline_id_duplicate"
  | "baseline_sets_overlap";

type OracleTracePortResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: OracleTraceAuthorityFailureReason };

type OracleTraceGitPortResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: OracleTraceGitIoFailureReason };

type OracleTraceGitPath =
  | typeof BASELINE_JSON_PATH
  | "src/lint/oracle-test-trace-baseline.ts"
  | "src/lint/oracle-test-trace-widened-baseline.ts";

interface OracleTraceAuthority {
  readText(path: typeof BASELINE_JSON_PATH): OracleTracePortResult<string | null>;
}

interface OracleTestTracePorts {
  authority?: OracleTraceAuthority;
}

loadOracleTestTraceInput(subjectRoot: string, ports?: OracleTestTracePorts)
```

`authority.readText(BASELINE_JSON_PATH)` はsource checkoutでは既存module-root、clean Packでは既存bundle asset bindingを使う。
既定adapterも同じ解決規則に従い、consumerの `subjectRoot`、process cwd、任意環境変数をauthority rootにしない。
呼出し側が任意pathを選べるreaderにはしない。readerの `{ok:true,value:null}` は対象assetの不存在、
`{ok:false,reason:"authority_read_failed"}` はI/O失敗を表す。missingとI/Oを同じ理由に畳まない。
JSON decode後のschema/token/重複検証も上記 `OracleTraceFailureReason` でtypedに失敗し、例外文面を解析しない。
この optional loader port は authority reader だけを受け取り、Git pair / CI context を受け取らない。

縮小専用比較の独立入口は次のとおりとする。これは既存 loader の option ではなく、既存
`OracleTestTraceInput` / `OracleTestTraceResult` / `analyzeOracleTestTrace` の集合・出力を変更しない。

```ts
type OracleBaselineRatchetFailureReason =
  | "pr_context_invalid"
  | "git_first_parent_missing"
  | "git_first_parent_read_failed"
  | "git_baseline_missing"
  | "git_object_read_failed"
  | "trusted_baseline_invalid"
  | "baseline_growth"
  | "bootstrap_base_invalid"
  | "bootstrap_value_mismatch";

type OracleBaselineRatchetResult =
  | { ok: true }
  | { ok: false; reason: OracleBaselineRatchetFailureReason };

interface OracleBaselineRatchetInput {
  authority: OracleTraceAuthority;
  ci: {
    eventName: string;
    mergeSha: string;
    git: {
      readTextAt(commitSha: string, path: OracleTraceGitPath):
        OracleTraceGitPortResult<string | null>;
      readFirstParent(mergeSha: string):
        OracleTraceGitPortResult<string | null>;
    };
  };
}

checkOracleBaselineRatchet(input: OracleBaselineRatchetInput): OracleBaselineRatchetResult
```

`checkOracleBaselineRatchet` は source checkout / Pack の同じ authority 解決境界と、明示された CI Git reader を受け取る。
PR用 required check は GitHub Actions の `harness-check` workflow の専用 step からこの関数を呼び、
`eventName = github.event_name`、`mergeSha = github.sha` をそのまま渡す。step は `{ok:false, reason}` を
non-zero で失敗させ、reason literal を結果として保持する。関数は例外を投げず、成功は `{ok:true}`、失敗は
`{ok:false, reason: OracleBaselineRatchetFailureReason}` を返す。event payload、branch名、可変 ref、working tree から
context や比較 pair を補わない。

PRでは `readFirstParent(mergeSha)` で B を解決し、`readTextAt(B, BASELINE_JSON_PATH)` /
`readTextAt(mergeSha, BASELINE_JSON_PATH)` でbase/head blobを読む。結果のnullは `git_first_parent_missing` /
`git_baseline_missing`、reader失敗は `git_first_parent_read_failed` / `git_object_read_failed`、不正blobは
`trusted_baseline_invalid` とする。明示CI contextが不完全・不正なら `pr_context_invalid` でfail-closeする。
初回移行だけの構造不一致は `bootstrap_base_invalid`、旧集合との値不一致は `bootstrap_value_mismatch` とする。
有効な組における legacy / widened いずれかの head-only ID は `baseline_growth` とする。

localからCI portを省略した一引数 loader 呼出しはsubsetを実行・主張せず、strict current JSON decode と既存analyzerの
complete-set equalityだけを行う。explicit local pair portは設けない。`baseline_growth` とその他の ratchet reason は
独立関数のtyped resultにのみ現れ、既存 analyzer の orphan・duplicate・stale-citation 出力や messages / `ok` projection
には追加しない。汎用booleanや例外messageから種類を推定しない。

**初回移行だけに限定した bootstrap route を許す。** 必須 PR check は上記の不変比較組 `(B, H) = (M^1, M)` を使い、
`B` の Git tree を調べる。base tree に baseline JSON がなく、旧 TS 定数ファイル 2 つと正規の定数宣言が存在し、
そこから得る legacy=89 / widened=317 の値が完全に認識・検証できる場合に限り、head JSON と旧 TS 集合を要素単位で完全一致
させる。head JSON は通常の strict decode を通ることも必要である。ファイル欠落、宣言形の不一致、値の不正、要素差異は
fail-close とする。任意 branch、cwd、自己申告 bootstrap flag によってこの route に入ってはならない。

これは runtime authority の例外ではない。runtime 対象 HEAD に JSON が無い・壊れている場合は常に fail-close とし、旧 TS
定数を runtime fallback に使わない。JSON が `B` に存在する変更では、旧 TS 定数が残っていても初回 route に再入せず、
JSON を trusted base とする subset check を使う。#1099 の初回 migration では `CANDIDATE-U-OIDBASE-001` と
`-011` だけを migration 限定 oracle として扱う。migration Green は両者の初回移行条件を満たすが、bootstrap route 削除を
要求する `-012` は未実装 Red のまま残し、#1099 全 oracle の closure と称してはならない。migration 後、source を変更しない
oracle retirement contract PR が `-001` / `-011` の宣言と test label を同期して退役させる。その後の独立した bootstrap
retirement Green PR が source route を削除し、`-012` だけを完了する。Refactor に route 削除を混ぜず、Refactor の
`tests/` 差分は 0 のままとする。初回 JSON は旧 main の legacy=89 / widened=317 と完全一致させ、#1097 の 315 件には
置き換えない。

### 7.3 design-protection と配布の境界

`design-protection-diff-gate.md` が定める保護 path (`docs/design/` と `docs/test-design/`) および実装分類 (`src/` と
`scripts/`) は変更しない。`docs/governance/` をその集合へ追加・削除せず、path 専用の例外も設けない。baseline JSON は
data であり、implementation PR で保護対象の design / test-design を変更する許可にはならない。JSON の編集可能性は、
strict decoder、必須の trusted-base shrink-only check、analyzer の集合一致で拘束する。

既存 `U-OIDGATE-005/006/007` と `U-OTT-006` の意味・期待値は増やさない。source を変更しない Red / 正式 oracle 工程で、
TS 定数を直接参照している既存 test を、production `loadOracleTestTraceInput` の戻り値へ付け替える。具体的には
`U-OIDGATE-005/006` は JSON-backed `input.widenedBaseline`、`U-OIDGATE-007` は JSON-backed `input.baseline.size === 89`
と既存の widened との交差 0、`U-OTT-006` は同じ loader の `input.baseline.size === 89` だけを維持する。付け替えの
所有表は supplemental L7 §3 に置き、loader が debt を適用する等の新しい oracle は追加しない。初回 migration の旧定数と
JSON の一時的な完全一致証明は candidate `-001` だけが所有し、継続する JSON 集合の assertion と混同しない。

JSON は runtime authority であるため、oracle checker が利用する clean Pack の asset inventory / bundle に明示的に
含める。source checkout と Pack は、現在の working directory に依存せず、Windows / Linux で同じ versioned content を
読み込む。移行では 2 つの TS 定数削除に対する Git の実際の name-status / rename 判定を確認する。Git がいずれかを
`src/` から `docs/governance/` への move と分類し、既存 `implementation-moved-out` 規則が拒否する場合は、
design-protection を弱めたり move 例外を足したりせず、移行順序または表現を改めて解決する。

### 7.4 supplemental L7 との関係

本節と `L7-oracle-test-trace-baseline-test-design.md` は本文で相互に参照する supplemental 契約・候補設計であり、
共有 `L7-unit-test-design.md` が L6 全体の単一 pair_artifact である既存規則を変更しない。初回移行では旧 main の現在値を
そのまま維持する。hold 中の #1097 baseline 縮小と legacy #1093 は、JSON authority と trusted-base ratchet の merge 後に
のみ行う。
