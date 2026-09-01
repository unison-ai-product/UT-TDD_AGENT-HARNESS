---
plan_id: PLAN-L7-526-windows-ci-single-snapshot
title: "PLAN-L7-526 (refactor): Windows required CI の test:fast・test:cli 単一 snapshot 統合"
kind: refactor
layer: L7
drive: agent
route_signal: code_smell
route_mode: refactor
status: draft
created: 2026-08-31
updated: 2026-08-31
owner: Codex / Luna
github_issue_id: 490
parent_design: docs/plans/PLAN-L7-510-snapshot-runner-cost.md
pair_artifact: docs/test-design/harness/L7-windows-ci-single-snapshot-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - 既存2 script集合の完全和集合とrequired gate不変の検収"
  - role: se
    slot_label: "Luna worker - Windows CIを単一sealed snapshot invocationへ統合"
  - role: qa
    slot_label: "QA - script削除・二重起動・集合欠落のmutation oracleとbefore/after計測"
generates:
  - artifact_path: docs/plans/PLAN-L7-526-windows-ci-single-snapshot.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-windows-ci-single-snapshot-test-design.md
    artifact_type: test_design
  - artifact_path: package.json
    artifact_type: config
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: workflow
  - artifact_path: src/lint/github-ci-policy.ts
    artifact_type: source_module
  - artifact_path: tests/windows-ci-single-snapshot.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-510-snapshot-runner-cost.md
  requires: []
  blocks:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
  references:
    - docs/plans/PLAN-L7-510-snapshot-runner-cost.md
    - docs/plans/PLAN-L7-463-vitest-snapshot-fixed-cost-cache.md
    - docs/test-design/harness/L7-snapshot-runner-cost-test-design.md
    - docs/test-design/harness/L7-unit-test-design.md
    - .github/workflows/harness-check.yml
    - package.json
    - src/github/change-lane.ts
    - src/lint/github-ci-policy.ts
    - tests/change-lane.test.ts
    - tests/github-ci-policy.test.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/409
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/472
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/490
backprop_decision: not_required
backprop_decision_reason: "既存のテスト集合とrequired gateを変えないCI内部refactorであり、上流product要件を変更しない。"
review_evidence: []
---

# PLAN-L7-526: Windows required CI の単一 snapshot 統合

## 0. 位置づけと routing

Issue #490 は Issue #409 の子であり、#472 (setup-bun撤去後に開始) の後続、#418 (Pack-only
internal canary) の predecessor である。現行 Windows required leg は `test:fast` と `test:cli`
を別々の `node scripts/run-vitest-snapshot.ts` processで起動するため、sealed execution snapshot、
reference snapshot、DB rebuild、fingerprintの固定費を二重に払う。本 PLAN はその CI 内部の固定費だけを
縮める。

この PR は **docs-only の pair-freeze** である。workflow、`package.json`、runner、policy oracle、
production source、test codeは変更しない。実装PRは本書と対のtest-designを入力にして初めてこれらを
変更できる。実装・計測・#418 canaryを本 PLAN の完了とは主張しない。

worker routing は `worker_model=gpt-5.6-luna`、`effort=high` とする。TL/非著者closing reviewは
別model familyで行い、同一runtimeの自己承認にしない。

## 1. 既存証跡と所有境界

### 1.1 #409/#423 の計測を入力にする

親の計測 slice `PLAN-L7-510` / PR #423 は exact HEAD
`f829e9414d0f14aa67d3e62364865d3c291ca995`、GitHub run
`33030014480`で Linux / Windows / aggregate 3/3 Green だった。Windows jobでは、scoped snapshot
の `Vitest 279.93s` と CLI snapshotの `Vitest 237.14s` が別 processとして記録され、各々 clone、
inner `npm ci`、DB rebuild、fingerprintを払っている。これは #409 の「runner固定費」の実測であり、
統合後の比較対象である。

直近の統合前 baseline は PR #478 の exact HEAD
`d597161a04b7c4ebd5a6fee81cff8aaaa983bdaa`、GitHub run `33346891983` である。同 runは Linux
6m06s、Windows 12m15s、aggregate success の3/3 Greenで、Windows stepは `test:fast` と
`test:cli` の2本である。実装PRではこの runを **before** として引用し、統合後の同じ required
workflowの exact-head runを **after** として記録する。後者を先に推測した短縮率・目標値は置かない。

### 1.2 正本と非正本

| 契約 | 正本 | 本 PLAN の扱い |
| --- | --- | --- |
| 既存2 test集合 | `package.json` の `test:fast` / `test:cli` | 両方を残し、機械的に読んで和集合を算出する |
| snapshot custody | `scripts/run-vitest-snapshot.ts` と既存 runner tests | detached sealed snapshotを再利用する。raw vitest、linked/shared clone、junction、hardlinkは不可 |
| Windows required step | `.github/workflows/harness-check.yml` | full laneで統合scriptをちょうど1回呼ぶ |
| policy manifest | `src/lint/github-ci-policy.ts` | 実装PRでworkflowと同時に更新し、manifest driftをfail-closeする |
| lane判定 | `src/github/change-lane.ts` の `DOC_LANE_PREFIXES` | allowlistを追加しない。PLAN/test-design変更は従来どおりfull |

既存 `PLAN-L7-490-memory-write-collision-safety` は Issue #325 の別所有物であるため、本 PLAN は
それを上書き・再利用しない。

## 2. 凍結する統合契約

### 2.1 集合の完全な和集合

実装PRは、現行 `package.json` から次の集合を独立に解釈する。

- `F = files(test:fast)`: runnerの既定発見集合から、現行8除外
  (`cli-surface`、`db-projection-ingestion`、`distribution-acceptance`、`doctor`、
  `drive-db-registration`、`projection-writer`、`review-green-command-projection`、
  `runtime-hook-entrypoints`)を除いた集合。
- `C = files(test:cli)`: `cli-surface`、`distribution-acceptance`、
  `runtime-hook-entrypoints` の明示集合。
- `W = F ∪ C`: Windows統合対象。重複は1回にdeduplicateする。

従って、現行scriptに対する canonicalな統合runner argvは、`test:fast`から次の **5除外だけ**を
残したものになる。

```text
node scripts/run-vitest-snapshot.ts
  --exclude tests/db-projection-ingestion.test.ts
  --exclude tests/doctor.test.ts
  --exclude tests/drive-db-registration.test.ts
  --exclude tests/projection-writer.test.ts
  --exclude tests/review-green-command-projection.test.ts
```

統合script名は `test:windows` に固定し、Windows workflowは `npm run test:windows` を呼ぶ。
`test:fast` / `test:cli` を統合scriptから文字列includeするだけ、既存scriptの一方を削除するだけ、
または5除外以外のpathを黙って追加・削除する実装は不受理とする。将来テストが増えた場合も、
両既存scriptの意味論から機械算出した `F ∪ C` と一致しなければRedである。

### 2.2 一回性とsealed custody

Windows full laneのtest stepは、`run-vitest-snapshot.ts`を起動する経路を **1つだけ**持つ。
統合script自身がrunnerを1回呼び、workflowに `test:fast`、`test:cli`、raw `vitest`、または
2本目のsnapshot invocationを残さない。実行は既存runnerのdetached execution snapshot → sealed
reference snapshot → fingerprint → Vitest → cleanup lifecycleを通ること。統合のためにsnapshot
rootを共有clone、linked worktree、junction、hardlink、cacheへ置き換えない。

### 2.3 required gateとfail-close laneの不変条件

- Windowsの`classify changed files`は現行どおり`bash`で実行し、解決不能・未知pathはfullへ倒す。
- `typecheck (tsc --noEmit)` はfull laneでtest stepより前に残す。
- `doctor (toolchain scope)` はfull laneでtest stepより後に残す。
- doc laneはsource doctorのみとし、allowlistを`docs/plans/`、`docs/test-design/`、governance、
  memoryへ広げない。`change-lane`の既存4 prefixとworkflow headerの集合一致を維持する。
- Linux legの全回帰、Linux/Windows両legのjob生成、aggregate `harness-check`の
  `if: always()`、`needs: [harness-check-linux, harness-check-windows]`、両result success条件を
  変更しない。aggregateは唯一のRequired Status Checkのままにする。
- `src/lint/github-ci-policy.ts` のruntime step manifestはworkflowと同じ順序・step shape・
  fail-close条件を要求し、Windows test stepが0回または2回以上ならviolationにする。

## 3. before/after timing evidence contract

実装PRのCI証跡は、次の表を同一の項目・単位で埋める。proseの「速くなった」は証拠にしない。

| 面 | before (固定値) | after (実装PRで取得) |
| --- | --- | --- |
| exact head | `d597161a04b7c4ebd5a6fee81cff8aaaa983bdaa` | 統合実装PRの40桁HEAD |
| run | `33346891983` (#478) | exact-head required run URL/ID |
| Linux leg | 6m06s | 同じ `harness-check-linux` job |
| Windows leg | 12m15s、2 test step | 同じ `harness-check-windows` job、1 test step |
| Windows test wall time | `test:fast` と `test:cli` の各step timestamp | `test:windows` step timestamp |
| aggregate | success、Linux+WindowsをAND | success、Linux+WindowsをAND |

after側は、workflow runのhead SHA、job ID、step名、started/completed timestamp、conclusion、
Linux/Windows/aggregateの3結果を記録する。#423の `33030014480` とその exact HEAD
`f829e941...` は、stage内訳の補助証跡として併記してよいが、#478 baselineの代替にはしない。

## 4. 実装PRへの引き渡し

実装PRの変更対象は `package.json`、`.github/workflows/harness-check.yml`、
`src/lint/github-ci-policy.ts` と、その契約を検査するtestに限定する。`scripts/run-vitest-snapshot.ts`
のcustody意味論、Linux test、doctor、change-lane allowlist、aggregate構造、doc-lane/cachingは
変更しない。実装PRは次の順で進める。

1. 対のtest-designのcandidateをRedで固定し、既存2 scriptから `F ∪ C` を独立算出する。
2. `test:windows` とWindows workflow/policy manifestを最小変更し、1 invocationでGreenにする。
3. typecheck、targeted test、PLAN lint/readability/trace、required Linux/Windows/aggregateを
   exact HEADで実行する。
4. #478 baselineとの差分をrun/job/stepの実測で記録し、非著者Claude/Opusのclosing reviewを
   exact HEADで得る。

Issue #490のcompletionはこのimplementation PRのGreenとexact-head reviewまでであり、#418の
Pack canary公開、snapshot cache/reference-root redesign、doc lane拡張を含まない。

## 5. Acceptance criteria

- AC-1: `test:fast`または`test:cli`の削除・空化を各1点変異すると、既存script両方の存在と
  `F ∪ C`一致を検査するcandidateがRedになる。
- AC-2: `test:windows`が5除外以外のpathを追加・削除する各mutation、CLI明示対象を再び除外する
  mutation、または重複を二重計上するmutationを検出する。
- AC-3: Windows workflow/policy manifestにsnapshot invocationを2本戻す、`test:fast`/`test:cli`
  を直接戻す、raw vitestへ置換する各mutationがRedになる。正常系のrunner invocation countは1。
- AC-4: typecheck、Windows toolchain doctor、Linux full regression、classify fail-closeを削る
  mutationが既存change-lane/github-ci-policy oracleでRedになり、aggregateのneeds/always/result
  guardを変えるmutationもRedになる。
- AC-5: sealed detached runnerの起動経路が維持され、linked/shared clone、junction、hardlink、
  cacheへの置換を受け入れない。
- AC-6: before=`33346891983`/HEAD `d597161a...` と after=実装PR exact HEADのLinux/Windows/
  aggregate、Windows test step timestampを同一形式で引用する。実測前の短縮率断定はしない。
- AC-7: docs-only pair-freeze自体はworkflow/production/test codeを変更せず、doc lane allowlistと
  cache/reference redesignを広げない。実装PRは1 Issue=1 PR、mergeは別途承認経路で行う。
