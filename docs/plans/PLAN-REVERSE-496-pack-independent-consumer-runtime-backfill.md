---
plan_id: PLAN-REVERSE-496-pack-independent-consumer-runtime-backfill
title: "PLAN-REVERSE-496: consumer runtime隔離契約の上流合流"
kind: reverse
layer: cross
drive: agent
workflow_phase: R2
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-21
updated: 2026-08-21
owner: PM / Codex
parent_design: docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - S4実装差分のL6受入契約へのbackfill判定"
  - role: qa
    slot_label: "QA - A/B隔離、digest再計算、escapeとprocess非干渉を再検収する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-496-pack-independent-consumer-runtime-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/362
review_evidence: []
---

# PLAN-REVERSE-496: consumer runtime隔離契約の上流合流

## 1. R1〜R2対象

- PF5のsealed aggregateをconsumerへ受け渡す際の、path/mode/content独立digest再計算。
- canonical releaseId derivationをmaterializer version/source revision/artifact digestへ束縛し、coherent fake
  identity replayを拒否すること。
- consumer/runtime rootのcanonical namespaceとsymlink/junction escape fail-close。
- configuration、DB、Memory、PLAN、lock、hook、receipt、evidence、historyのlayoutをproduct-local runtime rootへ固定すること。
- product identity、manifest、receipt、planの三者束縛と異version共存。
- A prior stateを持つupgrade/rollback中にBの実process、bytes、mode、path、state/historyを不変にする観測。
- artifact unavailable、unknown version、receipt mismatch、局所faultのwrite/process 0。

### R1: 実装と上流契約の照合（完了）

実装PR #371（Issue #362）のmain到達を確認し、`PLAN-L7-496`の実装範囲と
`PLAN-L6-101`の受入契約を照合した。実装はconsumer-local runtime admission、sealed
aggregateのdigest再計算、canonical root／symlink／junction境界、A/B identity束縛、
PF5 staging/apply/rollback portのfail-closeに限定されており、PF1〜PF5の内部契約、
promotion/rollback gate、Pack copy、D1/D2/D3を再実装していない。

U-PACKISO-001〜006は`tests/consumer-local-runtime-admission.test.ts`へ昇格済みで、
対応する候補oracleは`PLAN-L6-101` §2〜§5に存在する。#361が使用中の
`docs/test-design/harness/L7-unit-test-design.md`はこのReverseで編集しない。

### R2: 実装証跡とトレースの固定（完了・R3待ち）

実装成果物のsource baselineはmain merge commit
`1f3355151a127fd517679eedf171ce144327da4c`である。closing review対象の実装revisionは
`d919b581f77325ab704c0292a3467246f1ef0254`、実装workerは`gpt-5.6-luna`、非著者
closing reviewerは`claude-opus-5`であり、`PLAN-L7-496`にPASS（blocking 0）とmutation
probeの証跡が固定されている。

同一実装revisionで次の実測を確認した。

- U-PACKISO 26ケース: `node node_modules/vitest/vitest.mjs run tests/consumer-local-runtime-admission.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1`、exit 0。
- TypeScript: `npm run typecheck -- --pretty false`、exit 0。
- Biome: `npm run lint`、exit 0。
- PLAN lint: `node src/cli.ts plan lint docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md`、exit 0。
- GitHub Actions run `32464262419`: Linux／Windows／aggregate 3/3 Green。

証跡の実体は`PLAN-L7-496`の`green_commands`（test/source/PLANのSHA-256とanchor
commitを含む）、`tests/consumer-local-runtime-admission.test.ts`のU-PACKISO-001〜006、
`PLAN-L6-101`のCANDIDATE-PACKISO-001〜006との番号対応である。R2ではこの実測事実を
上流契約へ写像しただけであり、未実測のPack公開、stable promotion、親Issue #224の
完了は主張しない。

## 2. R3〜R4

R3では、上記exact implementation revisionとmain mergeの対応を固定したうえで、非著者の
Claude Opus reviewerが次の攻撃面をclaim-blind/spec-blindで再検収する。

- source/worktree/local Pack checkoutへのfallback。
- A/B間の共有DB、Memory、PLAN、lock、hook、receipt、evidence。
- receipt／manifestの申告digestを計算入力として信用する経路。
- parent symlink／junction、lexical escape、Windows 8.3 alias。
- Aのupgrade／rollback中のB process、bytes、mode、path、state/history汚染。
- artifact unavailable、unknown version、receipt mismatch、局所fault時のwrite/process 0。

R3は実装者の自己PASSで完了させない。R3の依頼はこのPLANのexact HEAD、
`PLAN-L7-496`、`PLAN-L6-101`、実装テスト、CI runを束ねたHARNESS Memoryの正規通知で行う。
R3 PASSまたはFLAGが返るまで、R4のbackfillと`PLAN-L7-496`の最終acceptを行わない。

R4ではR3で実測・引用により必要と判明した差分だけを`PLAN-L6-101`へ戻す。
`docs/test-design/harness/L7-unit-test-design.md`は#361のpath leaseが解放されるまで変更せず、
追加差分が必要な場合は別の原子的PRとして扱う。PF1〜PF5、promotion gate、Pack copy、
consumer実装の契約をReverseから再定義しない。

## 3. R3 review packet

- subject implementation: `d919b581f77325ab704c0292a3467246f1ef0254`
- landed main: `1f3355151a127fd517679eedf171ce144327da4c`
- forward PLAN: `PLAN-L7-496-pack-independent-consumer-runtime`
- upstream PLAN: `PLAN-L6-101-pack-independent-multi-consumer-acceptance`
- evidence: `tests/consumer-local-runtime-admission.test.ts` U-PACKISO-001〜006
- CI: GitHub Actions `32464262419` (Linux／Windows／aggregate 3/3 Green)
- required verdict: Claude Opus non-author claim-blind/spec-blind R3 review
