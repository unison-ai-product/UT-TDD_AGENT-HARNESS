---
title: "L7 Windows CI single sealed snapshot test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
plan_id: PLAN-L7-526-windows-ci-single-snapshot
updated: 2026-08-31
---

# PLAN-L7-526 test design

## Pair and boundary

対になる契約は`docs/plans/PLAN-L7-526-windows-ci-single-snapshot.md`である。これはIssue #490の
docs-only pair-freezeであり、実装PRがRed testを追加してGreen化するまでcandidateを正式`U-*`へ
昇格させない。既存 `test:fast` / `test:cli` の意味論をtest側で独立に読み、productionの新しい
統合scriptやworkflowをそのまま期待値として再利用しない。

対象fixtureは実repoの`package.json`、`.github/workflows/harness-check.yml`、
`src/lint/github-ci-policy.ts`を同じexact HEADから読む。YAML/JSONの文字列grepだけで「1回」を
証明せず、script argv、workflow step、policy manifestの構造をそれぞれparseして突合する。

## Canonical set model

`F`は現行`test:fast`のrunner argv（8 exclude）、`C`は現行`test:cli`の明示3 path、期待集合は
`W = F ∪ C`である。`test:fast`と`test:cli`の両方を入力として残し、pathはstable normalized
repo-relative formへしてdeduplicateする。現在の`W`は次の5 excludeを持つ1 runner argvへ正規化される。

```text
tests/db-projection-ingestion.test.ts
tests/doctor.test.ts
tests/drive-db-registration.test.ts
tests/projection-writer.test.ts
tests/review-green-command-projection.test.ts
```

CLI/hook実発火 (`cli-surface`、`distribution-acceptance`、`runtime-hook-entrypoints`)を除外へ
戻す実装は集合を縮めるためRedである。

## Candidate oracle matrix

| Candidate | Stimulus / mutation | 独立oracle |
| --- | --- | --- |
| `CANDIDATE-CI490-001` | `package.json`から`test:fast`を削除・空化・別runnerへ変更。別caseで`test:cli`を同様に変更 | 両scriptが存在し、各scriptから独立に`F`/`C`を再構成できること。片方の欠落・縮退はfail-closeでRed。 |
| `CANDIDATE-CI490-002` | `test:windows`の5 excludeから1つ削除、未知pathを1つ追加、またはCLI 3 pathのうち1つをexcludeへ戻す | 新scriptの選択集合が独立算出した`F ∪ C`とbyte-stable normalized setで一致すること。各1軸mutationをRed。 |
| `CANDIDATE-CI490-003` | Windows full laneを`npm run test:fast` + `npm run test:cli`の2 stepへ戻す、統合scriptを2回呼ぶ、または2本のrunner argvをworkflowへ戻す | Windows runtime step manifestのsnapshot runner invocation countが正常系でexactly 1。`test:fast`/`test:cli`の直接呼出し、2本目、raw `vitest`はRed。 |
| `CANDIDATE-CI490-004` | `test:windows`をraw `vitest`、detachedでないrunner、linked/shared clone、junction、hardlink、cache経路へ置換 | invocationは`node scripts/run-vitest-snapshot.ts`を通り、sealed execution/reference/fingerprint lifecycleを保持する。既存snapshot custody oracleと結合し、bypassを受理しない。 |
| `CANDIDATE-CI490-005` | Windows stepからtypecheckまたはtoolchain doctorを削除・lane条件を変更。Linux legを削除・full testをskip | `src/lint/github-ci-policy.ts`のordered manifest、full/doc条件、doctor/typecheck presenceが違反を返す。Windows classify不能はfullへ倒れる。 |
| `CANDIDATE-CI490-006` | aggregateの`needs`からLinux/Windowsを1つ削除、`if: always()`を削除、result success ANDを変更 | `harness-check`がLinux/Windows両方をneedsし、always生成され、各`result == success`を要求する。片方の欠落・skip・failureをGreenにしない。 |
| `CANDIDATE-CI490-007` | `DOC_LANE_PREFIXES`へ`docs/plans/`や`docs/test-design/`を追加、workflow headerだけを広げる、未知pathをdoc扱いする | `tests/change-lane.test.ts`とheader集合突合がRed。今回のPLAN/test-design変更はfull laneであり、doc lane skipを得ない。 |
| `CANDIDATE-CI490-008` | before/after timingのHEAD、run、job、step、timestamp、conclusionのいずれかを別revision/別jobへ差替え、afterを未計測の数値で埋める | beforeは#478 run `33346891983` / HEAD `d597161a...`、afterは実装PR exact HEADに束縛。run/job/step identity欠落・HEAD不一致・prose-only短縮主張を拒否する。 |

この実装PRのworkflow構造oracleは、次の2件をcandidateから限定的に昇格する。

| Unit oracle | 対応する検証 |
| --- | --- |
| `U-CI490-004` | 現行workflowを構造parseし、Windows jobのsealed `test:windows` invocation exactly 1、typecheck/db rebuild/toolchain doctorの保持、policy manifest整合を確認する正常系。 |
| `U-CI490-005` | snapshot step欠落・重複、fast/cli分割、raw vitestの各独立mutationを、workflow構造oracleとpolicy oracleの双方でdenyする。 |

## Gate and scope fence

- Linux / Windows / aggregateは1つのrequired gate群として扱い、Windowsのtest stepを減らしても
  jobやaggregateを減らさない。
- `change-lane`の4つの既存doc-safe prefix、workflow header、`checkLaneSkipSafety`のfail-close
  をcandidateの前提にする。新しいdoc laneやcache laneはこのpairのoracleではない。
- `test:fast`と`test:cli`の選択集合をproductionの`test:windows`から逆算しない。削除mutationを
  見逃す循環oracleを禁止する。
- runner内部のsealed snapshot、foreign-write fence、reference fingerprint、DB projectionの
  意味論は再定義しない。これらを弱める最適化はIssue #490の解決とみなさない。
- `CANDIDATE-CI490-*`は実装PRで対応testとRed実測が揃った時点に限り`U-CI490-*`へ昇格する。
  candidateの存在だけをGreen証跡、短縮率、#418 canary受入の根拠にしない。

## Required evidence

実装PRは#478 baseline (`33346891983`, exact HEAD `d597161a04b7c4ebd5a6fee81cff8aaaa983bdaa`,
Windows 12m15s)と、afterのexact-head required runを同一形式で記録する。最低限、run URL/ID、
head SHA、Linux/Windows/aggregate job IDとconclusion、Windows `test:windows` stepの開始・終了時刻、
旧2 stepのbefore値、afterの1 step値、targeted commandのexit codeを残す。#423 run `33030014480` /
HEAD `f829e9414d0f14aa67d3e62364865d3c291ca995`のWindows scoped 279.93s / CLI 237.14sは親計測の
補助citationとして保持する。

## 2026-10-15 追補: Windows leg 3 shard の candidate oracle (Issue #1063)

対になる設計は `docs/design/harness/L6-function-design/function-spec.md` §「2026-10-15 Windows leg の vitest 3 shard 契約」
である。上記の順序 (契約 → 登録 + Red → 昇格 → 実装 Green) で進め、昇格 PR までは下表を正式 `U-*` へ昇格させない。`W` (上記 Canonical set model) の意味は変えず、`test:windows` の選択集合を shard で分割するだけである。
oracle は workflow YAML、`package.json`、policy manifest をそれぞれ構造 parse して突合し、文字列 grep だけで通さない。

| Candidate | Stimulus / mutation (mutant) | 独立 oracle |
| --- | --- | --- |
| `CANDIDATE-U-CISHARD-001` | matrix の shard を 2 要素に減らす、4 要素に増やす、`2/3` を `2/4` へ変える、順序を入れ替える、`include` / `exclude` を足す、`fromJSON` で動的化する | policy が `strategy.matrix.shard` を `["1/3","2/3","3/3"]` と exact 照合し、各 mutant を violation にする。 |
| `CANDIDATE-U-CISHARD-002` | `fail-fast` を `true` にする、削除する、job レベル `if`、shard 単位の skip 条件、`continue-on-error` を足す | `fail-fast: false` を要求し、`forbidden_job_level_lane_skip` を含む job レベル skip 禁止が従来どおり働く。 |
| `CANDIDATE-U-CISHARD-003` | Windows leg の test step から `--shard=${{ matrix.shard }}` を外す (全件を 3 回実行)、固定値 `--shard=1/3` にする、raw `vitest` へ戻す | step manifest が `npm run test:windows -- --shard=${{ matrix.shard }}` と exact 一致し、sealed snapshot runner invocation は shard あたり exactly 1 のまま。 |
| `CANDIDATE-U-CISHARD-004` | `strategy` を Linux / node-generation 系 job へ足す、Windows leg の許可キーを `runs-on` / `strategy` / `steps` 以外へ広げる | `strategy` は Windows leg だけが持ち、他 job への混入は `missing_runtime_leg` 系 violation になる。 |
| `CANDIDATE-U-CISHARD-005` | aggregate の `needs.harness-check-windows.result` 判定を削除・`always()` 削除・`!= "failure"` へ緩める、matrix 一部 `skipped` を success 扱いにする | `REQUIRED_AGGREGATE_COMMAND` が不変で、`failure` / `cancelled` / `skipped` / 結果欠落を Red にする (matrix 集約の挙動を fixture で検証)。 |
| `CANDIDATE-U-CISHARD-006` | shard evidence artifact を 1 つ欠落、同一 shard を重複、4 つ目を余剰に置く | aggregate の検証関数が shard 集合をちょうど `{1/3,2/3,3/3}` として要求し、欠落・重複・余剰を拒否する。 |
| `CANDIDATE-U-CISHARD-007` | evidence の `run_attempt` / `run_id` / `head_sha` を別 attempt・別 run・別 HEAD に差し替える (failed-job-only rerun を模す) | aggregate 自身の `GITHUB_RUN_ATTEMPT` / run / HEAD と一致しない evidence は `attempt_binding_mismatch` で拒否する。別 attempt の artifact を今 attempt の証拠として拾わない。 |
| `CANDIDATE-U-CISHARD-008` | full lane で shard 件数 `[10,0,10]` (合計は正、1 つが 0)、全 shard 0 件、負数・非整数の件数を成功扱いにする | 各 shard の実行ファイル数がそれぞれ正の整数であることを要求し、混在 0 を含む全 mutant を拒否する。 |
| `CANDIDATE-U-CISHARD-013` | (正常系) doc lane の run で vitest evidence が 3 shard とも無く、`lane=doc` が同一 run / attempt / HEAD に束縛され、再計算 lane も `doc` | aggregate が Green (evidence 不在を理由に Red にしない)。doc lane の `source-doc-lane` doctor 成功を前提にする。 |
| `CANDIDATE-U-CISHARD-014` | full lane の run を doc lane に偽装する (evidence 無し + claimed `doc` + 変更ファイルから再計算すると `full`)、doc lane なのに shard evidence が存在する、lane evidence の run / attempt / HEAD 差替え | `src/github/change-lane.ts` の再計算と claimed lane の不一致を拒否し、偽装 doc を Red にする。判定不能・新種 path は `full` へ倒れる。 |
| `CANDIDATE-U-CISHARD-009` | `test:windows` の除外集合から 1 件落とす、shard 引数が runner で vitest へ透過されず全件実行になる | `vitest list --shard=i/3` (i=1..3) の和集合が独立算出した `W` と一致し、shard 同士が互いに素であること。runner が `--shard` を透過する (全件実行へ退行しない) こと。 |
| `CANDIDATE-U-CISHARD-010` | Linux leg に matrix / `--shard` を足す | Linux leg は従来の step manifest と一致し、shard しない (本契約の範囲外) ことを固定する。 |
| `CANDIDATE-U-CISHARD-011` | branch protection の required context に `harness-check-windows (i/3)` を足す、`harness-ci-aggregate` 相当を required に足す | required context は `harness-check` 1 件のままで、matrix 表示名は required に入らない (設定は実測で確認し、取得不能なら「設定済み」と推測せず block)。 |
| `CANDIDATE-U-CISHARD-012` | 実装 PR が before/after 計測を未計測値・別 HEAD で埋める | before は main run `38694546173` / `38692344625` / `38690207164`、after は実装 PR exact HEAD の required run に束縛し、run / job / step identity 欠落と prose だけの短縮主張を拒否する (`CANDIDATE-CI490-008` と同形式)。 |

## 実装 PR の順序と fence

`design-protection-diff-gate.md` §10.2 / §10.3 に従う。実装 PR は test-design に触れないため、昇格は実装 PR より前に入れる。

1. 契約 (本 PR、docs のみ)。
2. 登録 + Red: `it.fails` で候補 ID を引用する。実 workflow を読むテストなので `repositoryReadContracts` の登録行だけを同じ PR に足す (src/ は登録行に限る)。
3. 昇格: `CANDIDATE-U-CISHARD-*` を正式 ID へ昇格し、引用を書き換える (src/ を含まない)。
4. 実装 Green (policy + workflow + aggregate step、1 PR = 1 論点): Issue #898 の Green が `src/lint/github-ci-policy.ts` を変更するため、#898 merge 後に出す。Linux の shard 化、手動分割、larger runner は別 PR / 別判断。
- required gate の弱体化 (テスト除外・skip、aggregate の `needs` 緩和、doctor strict flag 削除) は shard 化の名目でも行わない。
- 短縮見積り (job wall 約 10〜12.5 分) は candidate であり、達成値の根拠にしない。
