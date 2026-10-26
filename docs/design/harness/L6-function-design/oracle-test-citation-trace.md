---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_oracle_test_citation_trace
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
issue: 259
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

## 6. `deliverable-plan-trace` gate の退役契約 (Issue #1170)

> **状態**: この節は `deliverable-plan-trace` doctor gate を退役させる契約である (Issue #1170、PLAN 機構の撤去
> #1078 / #1168 の一部)。旧 §6 の Issue #958 契約 (test file 所有証拠を test-design 引用で補う規則) は
> 実装済みである (`src/lint/deliverable-plan-trace.ts` の `loadDeliverablePlanTraceInput` が formal / candidate の
> 宣言と引用を結合し、`tests/deliverable-plan-trace.test.ts` が正式 `U-DPTOWN-*` で検証している)。この規則と正式 oracle を
> **gate とともに退役させる**。§2〜§5 の formal oracle citation 契約は書き換えない。退役の実装は §6.5 の 2 PR で入れる。

### 6.1 退役する範囲

`deliverable-plan-trace` は、成果物 (`scripts/` / `.claude/` / `tests/` 等) の所有を PLAN frontmatter の
`generates` と test-design の引用から決める doctor gate である。PLAN を撤去するとこの gate には判定の拠り所が
残らないため、次をまとめて退役させる。

| 区分 | 退役するもの |
|---|---|
| 関数 | `src/lint/deliverable-plan-trace.ts` の `analyzeDeliverablePlanTrace` / `analyzeDeliverableTraceGate` / `loadDeliverablePlanTraceInput` / `deliverablePlanTraceMessages` (ファイルごと) |
| doctor 配線 | `src/doctor/source-trace.ts` の `checkDeliverablePlanTrace`、`src/doctor/index.ts` の re-export、`src/doctor/check-definition-groups.ts` の import と `full("deliverable-plan-trace", ...)`、`src/doctor/profiles.ts` の `FULL_DOCTOR_OUTPUT_IDS` の `"deliverable-plan-trace"` (`src/doctor/db-projection.ts` の `knownDoctorGateIds` はこの一覧を参照するだけで、個別の編集は要らない) |
| 台帳と生成物 | `docs/governance/deliverable-trace-debt-audit.md`、参照元のない生成スクリプト `src/trace/generate-deliverable-trace-debt-audit.ts` |
| finding | `orphan-deliverable` / `stale-deliverable-trace-debt` / `duplicate-artifact-ownership` |

### 6.2 `artifact-ownership` も退役させる

`src/lint/artifact-ownership.ts` (`analyzeArtifactOwnership`、finding `duplicate-artifact-ownership`) も同時に退役する。
検出するのは PLAN `generates` の重複だけで、PLAN を撤去すると意味を失うためである。実測 (`git grep -n
"artifact-ownership\|analyzeArtifactOwnership" -- src scripts .github tests`) で参照元は次の 3 つだけで、
他の live consumer は無い。

- `src/lint/deliverable-plan-trace.ts` (本 gate。import と呼び出し)
- `src/trace/generate-deliverable-trace-debt-audit.ts` (どの script / test / CI からも呼ばれない生成スクリプト)
- `tests/artifact-ownership.test.ts` (`artifact-ownership.ts` 自身の単体テスト)

`scripts/` と `.github/` には参照が無い。

### 6.3 退役させる規則と撤回するもの

- 旧 §6 (Issue #958) の test-design 所有証拠規則 (実装済み) と、`docs/test-design/harness/L7-deliverable-plan-trace-test-design.md`
  の正式 oracle `U-DPTOWN-001`〜`U-DPTOWN-009` (通常テストで検証済み) を、**gate とともに退役させる**。未実装 draft の
  撤回ではなく、実装済みの規則と正式 oracle の退役として扱う。
- 所有の代替となる gate、台帳、検査は**設けない**。成果物の所有を機械で決める仕組みは、退役後は存在しない。
- `src/lint/deliverable-plan-trace.ts:92` の相対 root の不具合は**修正しない**。gate とともに消える。doctor は絶対 root を
  渡すため、退役前の実害も無い。

### 6.4 退役後の不変条件

- `oracle-test-trace` の契約 (§2〜§5) と実装は変えない。
- 新しい gate、finding、台帳を足さない。
- 残存参照の検査は、退役した識別子 (`deliverable-plan-trace`、`duplicate-artifact-ownership`、`artifact-ownership`、
  `deliverable-trace-debt-audit`) が `docs/governance/candidates/**`、`docs/archive/**`、`.ut-tdd/**`、`docs/plans/**`
  以外に残らないことを確かめる。除外する 4 つは履歴・候補・実行時状態・退役対象の PLAN であり、退役の対象外である。
  退役の記録として、次は残存に数えない。
  - 本節自身と `design-protection-diff-gate.md` の退役注記が識別子を名指しする分。
  - PR-1 が退役記録として残した `docs/test-design/harness/L7-deliverable-plan-trace-test-design.md`
    (PR-2 は `src/` を含むため、design-protection gate によりこの文書を変更できない)。
  - `docs/archive/**` 配下のファイルを指す path 文字列の一部として現れる識別子
    (例: `docs/governance/memory-curation-ledger-2026-09.md` の `archive_path`)。除外済みの領域への参照は数えない、
    という規則であり、個別ファイルの免除ではない。

### 6.5 工程 (2 PR)

legacy migration の退役 (#1256 / #1257) と同じ 2 PR で進める。design-protection gate の制約上、設計の PR と
`src/` を含む PR は分ける。

1. **PR-1 (非実装: `docs/test-design/` と `tests/` のみ)**:
   `docs/test-design/harness/L7-deliverable-plan-trace-test-design.md` の `U-DPTOWN-001`〜`U-DPTOWN-009` 宣言を撤去し、
   同時に `tests/deliverable-plan-trace.test.ts` の同 ID ラベルを外す。テスト本体は残す。
   `L7-deliverable-plan-trace-test-design.md` は削除せず、宣言表を退役の注記 (本節 §6.3 への参照) に置き換えて退役記録として残す
   (PR-2 は `src/` を含むため design-protection gate により test-design を変更・削除できず、文書を消すなら PR-1 しかない。
   §6.3 が本文書を参照するため記録として残す)。宣言と引用を同じ PR で
   外すのは、`oracle-test-trace` が未引用の宣言と未宣言の引用をそれぞれ違反にするためである。
2. **PR-2 (実装)**:
   - テストを削除する: `tests/deliverable-plan-trace.test.ts`、`tests/artifact-ownership.test.ts`、
     `tests/doctor.test.ts` の roster / fail-closed 表の該当エントリ (`checkDeliverablePlanTrace` の import、
     fail-closed 表の行、output ID 一覧の `"deliverable-plan-trace"`)。
   - §6.1 と §6.2 の src、doctor 配線、台帳、生成スクリプトを削除する。doctor 配線には、
     `deliverable-plan-trace.ts` を import している `src/doctor/source-trace.ts` の `checkDeliverablePlanTrace` を含む。
   - `docs/governance/oracle-test-trace-baseline.json` の **`citations`** 一覧から、最後の引用テストが消える
     `U-L7-450-W2-001` / `U-L7-450-W2-002` / `U-L7-450-W2-003` / `U-L7-450-W2-004` /
     `U-L7-450-W3-001` / `U-L7-450-W3-002` / `U-L7-450-W4-001` の 7 件を外す。
     7 件は test-design に宣言が無く、W2-003 / W2-004 / W3-001 / W3-002 / W4-001 の 5 件は
     `tests/deliverable-plan-trace.test.ts`、W2-001 / W2-002 の 2 件は `tests/artifact-ownership.test.ts`
     (PR-2 が §6.2 / §6.5 で削除する) が唯一の引用元である
     (`git grep -n "<ID>" -- src tests docs/test-design` で各 1 件を実測)。7 件は baseline の `legacy` / `widened` には無く
     `citations` にだけある (baseline JSON を解析して各 ID で確認)。`citations` に残したままテストを消すと、
     `src/lint/oracle-test-trace.ts` の `analyzeCitationTrace` が stale citation baseline として違反にする。
     他の ID は、まだ別のテストが引用している場合があるため触れない。
   - prose を掃除する: root `CLAUDE.md`、`AGENTS.md`、`.claude/CLAUDE.md`、`skills/gate-planning.md` の
     `deliverable-plan-trace` / `duplicate-artifact-ownership` / `orphan-deliverable` への言及。
     「draft PLAN の `generates` に既存ファイルを書かない」規則は、`duplicate-artifact-ownership` への言及が
     root `CLAUDE.md`・`AGENTS.md`・`.claude/CLAUDE.md` の 3 ファイルで等価に書かれているため、3 ファイルを同時に直す
     (rule-drift の対象であり、片側欠落を作らない)。
   - PLAN-L7-450 の `generates` から退役した成果物の行を外す。これは PLAN 凍結 (`CLAUDE.md` §PLAN Filing Rules)
     の例外 (撤去作業そのものに必要な場合) に当たるので、PR 本文に根拠を書く。
   - `tests/doctor.test.ts` の `test-repository-isolation` の mode_calls が変わらないかを、削除後に確認する。
3. PR-2 の後に、§6.4 の残存参照検査を `git grep` で確かめる。

## 7. Forward / reverse citation baseline の正本と縮小専用 ratchet（Issue #1099 草案）

> **状態**: Issue #1099 の契約 draft。専用の supplemental 候補設計は
> `docs/test-design/harness/L7-oracle-test-trace-baseline-test-design.md` に置く。
> 既存 §2〜§5 の reverse test-label citation、または
> `docs/test-design/harness/L7-unit-test-design.md` の共通 index を置き換えない。本節と専用 L7 は本文で相互参照し、
> 新たな V-model pair_artifact を宣言しない。

### 7.1 Baseline データの正本

Forward oracle tracing と reverse citation の既存規則を維持する。test-design で宣言され tests に citation のない ID は、該当する
legacy または widened の debt set に含まれる場合だけ許容する。reverse 側で test label にあり canonical declaration がない ID は、
citations debt set に含まれる場合だけ許容する。analyzer の完全な集合一致を包含比較や件数比較へ弱めてはならない。
正本には legacy / widened / citations の3集合を置き、legacy と widened は意味を分けて相互に重複させない。
citations は既存 `ORACLE_TEST_CITATION_BASELINE` の集合をそのまま移す独立軸であり、legacy / widened との交差は許可する
（実例: `U-RDRIFT-004`）。各配列内の重複は拒否する。`ORACLE_ID_DUPLICATE_BASELINE` は既存どおり別の重複宣言
provenance debt として扱い、本JSON・3集合 ratchet の対象にしない。

正本データは `docs/governance/oracle-test-trace-baseline.json` とし、schemaVersion 2 の field は `schemaVersion`、`legacy`、
`widened`、`citations` の4つだけとする。各集合は文章や範囲表記ではなく、oracle ID の完全な文字列配列である。
strict decode を行い、ファイルの欠落・読取不能、JSON 不正、version または値型の不正、未知 field、不正な ID token、
各配列内の重複 ID、legacy / widened 間の重複を拒否する。citations と他の2集合との交差は拒否しない。TS 定数や空集合への
fallback は設けない。初回移行では移行前 main の3定数から各集合を要素単位で同一に複写し、oracle の退役・再分類を同時に行わない。
初回 main 値を維持し、legacy は正確に 89 件、widened は 317 件、citations は 582 件とする（件数だけでなく各旧定数との
要素集合一致を要求する）。#1097 が提案する 315 件を初回 seed にしてはならない。この変更ではどの debt の後続退役も行わない。

既存関数の `repoRoot` 引数は、`docs/test-design` と `tests` を走査する subject repository を示す。
baseline authority root も明示し、開発時は source checkout、clean Pack 実行時は配布済み harness asset root を
指す。いずれも process working directory から推測してはならない。実装は第 2 path 引数ではなく明示 reader / asset
port を用いてもよいが、source checkout と Pack の双方で同じ versioned JSON authority を特定できる境界にする。
subject scan root が consumer project だからという理由で、その root を harness asset root と誤認してはならない。

### 7.2 独立した 2 つの ratchet 証明

analyzer は引き続き、現在の subject から再導出した widened debt 集合と、現在の authority JSON から読み込んだ
widened 集合との完全な要素集合一致を要求する。これにより U-OIDGATE-005/006 を維持し、欠落した免除と stale
免除の両方を検出する。reverse 側では、既存の undeclared static citation から再導出する集合と JSON の `citations` の
完全な要素集合一致を要求し、既存の未宣言 citation / stale citation の意味を維持する。既存 `input.citationBaseline` は
この JSON-backed 集合を受け取り、formal citation を baseline へ追加しない。

これとは別に、必須 PR check は GitHub Actions が PR 用に固定した検証 merge commit `M = github.sha` を使って
縮小専用の進化を証明する。信頼する比較組は常に `B = M^1` (merge commit の第 1 親) と `H = M` である。
legacy / widened / citations の各集合について `headSet(H) ⊆ trustedBaseSet(B)` を独立に確認し、base JSON は `B` の Git tree から、head JSON は
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
  | "src/lint/oracle-test-trace-widened-baseline.ts"
  | "src/lint/oracle-test-citation-baseline.ts";

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
loader の成功値は従来どおり `OracleTestTraceInput` のままとし、失敗時は次の名前付き typed error を throw する。
既存の成功出力型や analyzer の入力・結果 shape は変更しない。

```ts
export class OracleTestTraceLoadError extends Error {
  readonly reason: OracleTraceFailureReason;
}
```

この型は `src/lint/oracle-test-trace.ts` から名前付き export として公開する。`OracleTestTraceLoadError.reason` は欠落・読取・decode/schema/token の既存 literal を保持する。
呼出側は `instanceof OracleTestTraceLoadError` と `reason` を確認し、例外 message から分類を推定しない。

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
  /**
   * Loader と同じ authority binding を composition で受け取る。
   * CI ratchet はこの reader の readText を呼ばず、比較対象 blob は git port だけから読む。
   */
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

`checkOracleBaselineRatchet` は loader と同じ authority binding を composition で受け取り、明示された CI Git reader を使う。
ただし ratchet は `authority.readText` を呼ばず、base/head JSON は immutable な Git tree の `B` / `H` からだけ読む。
PR用 required check は GitHub Actions の `harness-check` workflow の専用 step からこの関数を呼び、
`eventName = github.event_name`、`mergeSha = github.sha` をそのまま渡す。step は `{ok:false, reason}` を
non-zero で失敗させ、reason literal を結果として保持する。関数は例外を投げず、成功は `{ok:true}`、失敗は
`{ok:false, reason: OracleBaselineRatchetFailureReason}` を返す。event payload、branch名、可変 ref、working tree から
context や比較 pair を補わない。

PRでは `readFirstParent(mergeSha)` で B を解決し、`readTextAt(B, BASELINE_JSON_PATH)` /
`readTextAt(mergeSha, BASELINE_JSON_PATH)` でbase/head blobを読む。Git reader の結果のnullは `git_first_parent_missing` /
`git_baseline_missing`、I/O failure は ratchet 側の `git_first_parent_read_failed` /
`git_object_read_failed`、不正blobは
`trusted_baseline_invalid` とする。明示CI contextが不完全・不正なら `pr_context_invalid` でfail-closeする。
初回移行だけの構造不一致は `bootstrap_base_invalid`、3つの旧集合との値不一致は `bootstrap_value_mismatch` とする。
有効な組における3集合のいずれかの head-only ID は `baseline_growth` とする。

localからCI portを省略した一引数 loader 呼出しはsubsetを実行・主張せず、strict current JSON decode と既存analyzerの
complete-set equalityだけを行う。explicit local pair portは設けない。`baseline_growth` とその他の ratchet reason は
独立関数のtyped resultにのみ現れ、既存 analyzer の orphan・duplicate・stale-citation 出力や messages / `ok` projection
には追加しない。汎用booleanや例外messageから種類を推定しない。

**初回移行だけに限定した bootstrap route を許す。** 必須 PR check は上記の不変比較組 `(B, H) = (M^1, M)` を使い、
`B` の Git tree を調べる。base tree に baseline JSON がなく、旧 TS 定数ファイル 3 つと正規の定数宣言が存在し、
そこから得る legacy=89 / widened=317 / citations=582 の値が完全に認識・検証できる場合に限り、head JSON と旧 TS 集合を要素単位で完全一致
させる。head JSON は通常の strict decode を通ることも必要である。ファイル欠落、宣言形の不一致、値の不正、要素差異は
fail-close とする。任意 branch、cwd、自己申告 bootstrap flag によってこの route に入ってはならない。

これは runtime authority の例外ではない。runtime 対象 HEAD に JSON が無い・壊れている場合は常に fail-close とし、旧 TS
定数を runtime fallback に使わない。JSON が `B` に存在する変更では、旧 TS 定数が残っていても初回 route に再入せず、
JSON を trusted base とする subset check を使う。#1099 の初回 migration では `CANDIDATE-U-OIDBASE-001` と
`-011` だけを migration 限定 oracle として扱う。migration Green は両者の初回移行条件を満たすが、bootstrap route 削除を
要求する `-012` は未実装 Red のまま残し、#1099 全 oracle の closure と称してはならない。migration 後、source を変更しない
oracle retirement contract PR が `-001` / `-011` の宣言と test label を同期して退役させる。その後の独立した bootstrap
retirement Green PR が source route を削除し、`-012` だけを完了する。Refactor に route 削除を混ぜず、Refactor の
`tests/` 差分は 0 のままとする。初回 JSON は旧 main の legacy=89 / widened=317 / citations=582 と完全一致させ、#1097 の 315 件には
置き換えない。

### 7.3 design-protection と配布の境界

`design-protection-diff-gate.md` が定める保護 path (`docs/design/` と `docs/test-design/`) および実装分類 (`src/` と
`scripts/`) は変更しない。`docs/governance/` をその集合へ追加・削除せず、path 専用の例外も設けない。baseline JSON は
data であり、implementation PR で保護対象の design / test-design を変更する許可にはならない。JSON の編集可能性は、
strict decoder、必須の trusted-base shrink-only check、analyzer の集合一致で拘束する。

既存 `U-OIDGATE-005/006/007/011/012` と `U-OTT-006` の意味・期待値は増やさない。source を変更しない Red / 正式 oracle 工程で、
TS 定数を直接参照している既存 test を、production `loadOracleTestTraceInput` の戻り値へ付け替える。具体的には
`U-OIDGATE-005/006` は JSON-backed `input.widenedBaseline`、`U-OIDGATE-007` は JSON-backed `input.baseline.size === 89`
と既存の widened との交差 0、`U-OTT-006` は同じ loader の `input.baseline.size === 89` だけを維持する。付け替えの
所有表は supplemental L7 §3 に置き、loader が debt を適用する等の新しい oracle は追加しない。`U-OIDGATE-011` の
direct citation baseline assertion は JSON-backed `input.citationBaseline` に付け替え、`U-OIDGATE-012` の stale-citation
検出を維持する。初回 migration の旧定数と JSON の一時的な完全一致証明は candidate `-001` だけが所有し、継続する JSON 集合の
assertion と混同しない。

JSON は runtime authority であるため、oracle checker が利用する clean Pack の asset inventory / bundle に明示的に
含める。source checkout と Pack は、現在の working directory に依存せず、Windows / Linux で同じ versioned content を
読み込む。移行では 3 つの TS 定数削除に対する Git の実際の name-status / rename 判定を確認する。Git がいずれかを
`src/` から `docs/governance/` への move と分類し、既存 `implementation-moved-out` 規則が拒否する場合は、
design-protection を弱めたり move 例外を足したりせず、移行順序または表現を改めて解決する。

### 7.4 supplemental L7 との関係

本節と `L7-oracle-test-trace-baseline-test-design.md` は本文で相互に参照する supplemental 契約・候補設計であり、
共有 `L7-unit-test-design.md` が L6 全体の単一 pair_artifact である既存規則を変更しない。初回移行では旧 main の現在値を
そのまま維持する。hold 中の #1097 baseline 縮小と legacy #1093 は、JSON authority と trusted-base ratchet の merge 後に
のみ行う。
