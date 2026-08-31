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
