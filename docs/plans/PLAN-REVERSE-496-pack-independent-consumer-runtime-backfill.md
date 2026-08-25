---
plan_id: PLAN-REVERSE-496-pack-independent-consumer-runtime-backfill
title: "PLAN-REVERSE-496: consumer runtime隔離契約の上流合流"
kind: reverse
layer: cross
drive: agent
workflow_phase: R4
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
status: confirmed
created: 2026-08-21
updated: 2026-08-25
owner: PM / Codex
parent_design: docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
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
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/362
review_evidence:
  - reviewer: Claude Opus
    review_kind: cross_agent
    reviewed_at: "2026-08-21T09:24:09Z"
    tests_green_at: "2026-08-21T09:23:13Z"
    verdict: pass
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    scope: "PR #374 exact HEAD 6d1f61dc0d6dfc9c88f75020568840ae0169f4e8のR3 aggregate再検収。source fallback、A/B state隔離、digest再計算、escape、片系非干渉をmutation probe込みで攻撃しPASS blocking 0。"
    plan_revision: 6d1f61dc0d6dfc9c88f75020568840ae0169f4e8
    subject_head: 6d1f61dc0d6dfc9c88f75020568840ae0169f4e8
    evidence_path: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/374#issuecomment-5368042430"
    citations:
      - "GitHub Actions run 32467016151 job 96725647565 (harness-check-linux completed before the review)"
      - "GitHub Actions run 32467016151 Windows and aggregate jobs completed after the review at 09:27:44Z and 09:27:51Z"
      - "Mutation A: realpath canonicalization removal killed by alias and escape tests"
      - "Mutation B: layout freeze removal killed by layout oracle"
      - "Mutation C: digest equality removal killed by coherent fake identity oracle"
    green_commands:
      - kind: smoke
        command: "GitHub Actions run 32467016151 job 96725647565 (harness-check-linux)"
        runner: ci
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T09:23:13Z"
        evidence_path: docs/plans/PLAN-REVERSE-496-pack-independent-consumer-runtime-backfill.md
        output_digest: "sha256:c903422e782637f96518e3eca128ad4fcf511cd937f134586d656401dd8197e4"
        anchor_commit: 6d1f61dc0d6dfc9c88f75020568840ae0169f4e8
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
対応する候補oracleは`PLAN-L6-101` §2〜§5に存在する。共有のL7 test-design artifactは
このReverseで編集しない。

### R2: 実装証跡とトレースの固定（完了）

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

R3は実装者の自己PASSで完了させない。PR #374 exact HEADに対するClaude Opusの
非著者R3 reviewはPASS（blocking 0）であり、この条件を充足した。

R4ではR3で実測・引用により必要と判明した差分だけを`PLAN-L6-101`へ戻す。
共有のL7 test-design artifactは本PRで編集せず、
追加差分が必要な場合は別の原子的PRとして扱う。PF1〜PF5、promotion gate、Pack copy、
consumer実装の契約をReverseから再定義しない。

## 3. R3 review packet

- subject implementation: `d919b581f77325ab704c0292a3467246f1ef0254`
- landed main: `1f3355151a127fd517679eedf171ce144327da4c`
- forward PLAN: `PLAN-L7-496-pack-independent-consumer-runtime`
- upstream PLAN: `PLAN-L6-101-pack-independent-multi-consumer-acceptance`
- evidence: `tests/consumer-local-runtime-admission.test.ts` U-PACKISO-001〜006
- CI: GitHub Actions `32464262419` (Linux／Windows／aggregate 3/3 Green)
- required verdict: Claude Opus non-author claim-blind/spec-blind R3 review (PASS blocking 0)

## 4. R3結果とR4 backfill

PR #374 exact HEAD `6d1f61dc0d6dfc9c88f75020568840ae0169f4e8`に対し、Claude Opusの
非著者R3 reviewはPASS（blocking 0）だった。realpath canonicalization、layout freeze、digest
equalityの各mutationは既存oracleでkillされた。一方、canonical containmentの二重判定は片方を
除去しても26/26 Greenであり、防御が二重であるという読み方は成立しない。またadmission deny時の
apply系port 0を直接固定するoracleが存在しないことが確認された。

R4ではこの2点だけを`PLAN-L6-101` §6へbackfillした。containmentはcanonical空間で1回と定義し、
admission deny時はPF5 apply/staging/restore/pointer/publish port 0を要求する。後者は
`CANDIDATE-PACKISO-007`としてRED候補を固定し、共有L7 test-design artifactは
本PRでは変更しない。実装・test-design昇格はpath lease解消後の別の原子的PRへ送る。

これ以外の上流要求、PF1〜PF5、promotion gate、Pack copy、consumer implementationを変更しない。
以上によりR4の設計gapを閉じ、Forward routingを`gap-only`として既存L6契約へ戻す。
