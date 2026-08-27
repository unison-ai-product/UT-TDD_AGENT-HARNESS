---
plan_id: PLAN-L7-496-pack-independent-consumer-runtime
title: "PLAN-L7-496 (impl): Pack単独consumer-local runtime admission"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-21
updated: 2026-08-27
owner: PM / Codex
parent_design: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - consumer-local namespace、receipt束縛、PF5 port再利用を実装する"
  - role: qa
    slot_label: "QA - U-PACKISO-001..007、実process、局所faultとescapeを実測する"
  - role: tl
    slot_label: "TL - source非依存、A/B隔離、Reverse backfillを非著者で検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/consumer-local-runtime-admission.ts
    artifact_type: source_module
  - artifact_path: tests/consumer-local-runtime-admission.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
  requires:
    - PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze
  blocks: []
  references:
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-REVERSE-496-pack-independent-consumer-runtime-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/setup/release-aggregate-admission.ts
    - src/setup/release-materializer.ts
    - src/schema/release-manifest.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/362
github_issue_id: 362
backprop_decision: required
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-21T17:30:03+09:00"
    tests_green_at: "2026-08-21T17:05:25+09:00"
    verdict: "PASS; blocking 0"
    scope: "exact HEAD d919b581の非著者claim-blind/spec-blind closing review。source非依存、A/B隔離、canonical root、escape fail-close、digest再計算、layout凍結をmutation probe込みで再検収。"
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    plan_revision: d919b581f77325ab704c0292a3467246f1ef0254
    subject_head: d919b581f77325ab704c0292a3467246f1ef0254
    evidence_path: tests/consumer-local-runtime-admission.test.ts
    anchor_commit: b69cca39742413693152d29314b00a85063338c2
    citations:
      - "tests/consumer-local-runtime-admission.test.ts: U-PACKISO-001..006 expanded 26 cases"
      - "src/setup/consumer-local-runtime-admission.ts: canonical layout, releaseId derivation, PF5 install composition"
      - "src/schema/release-manifest.ts: deriveReleaseId"
    green_commands:
      - kind: unit_test
        command: "node node_modules/vitest/vitest.mjs run tests/consumer-local-runtime-admission.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1 (fenced diagnostic)"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T17:05:25+09:00"
        evidence_path: tests/consumer-local-runtime-admission.test.ts
        output_digest: "sha256:56a9c1ef30e4a778001bf6813917192b1c62cb1adaeabb91dde01672c987a3ec"
        anchor_commit: b69cca39742413693152d29314b00a85063338c2
      - kind: typecheck
        command: "npm run typecheck -- --pretty false"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-08-21T17:05:25+09:00"
        evidence_path: src/setup/consumer-local-runtime-admission.ts
        output_digest: "sha256:7092b8bc767b8454f8ed501d5fa5b5dc23d0e25049ed279e14d40d6be3122aaa"
        anchor_commit: b69cca39742413693152d29314b00a85063338c2
      - kind: lint
        command: "npm run lint"
        runner: node
        scope: full
        exit_code: 0
        completed_at: "2026-08-21T17:05:25+09:00"
        evidence_path: src/setup/consumer-local-runtime-admission.ts
        output_digest: "sha256:7092b8bc767b8454f8ed501d5fa5b5dc23d0e25049ed279e14d40d6be3122aaa"
        anchor_commit: b69cca39742413693152d29314b00a85063338c2
      - kind: unit_test
        command: "node src/cli.ts plan lint docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T17:05:25+09:00"
        evidence_path: docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
        output_digest: "sha256:0a1141fd9195c3e3f9cde4222c911e7aad0d5580ca43bdac9143b7b4202f9ae8"
        anchor_commit: b69cca39742413693152d29314b00a85063338c2
---

# PLAN-L7-496: Pack単独consumer-local runtime admission

## 1. 目的と境界

`PLAN-L6-101`でfreezeしたconsumer受入契約を、PF5のsealed release aggregateを唯一の入力とする
consumer-local runtime admission adapterへ降下する。Product A/Bはそれぞれのcanonical consumer rootと
runtime rootだけを所有し、source repository、source worktree、local Pack checkout、共有DB/lock/evidenceを
runtime discoveryへ持ち込まない。

PF1〜PF5、release promotion/rollback gate、Pack publish/copy、CLI、D1/D2/D3、Execution Episodeは変更しない。
新しいrollback engineやglobal runtime rootも導入しない。applyは既存`applySealedReleaseAggregate`へ接続する。

## 2. 実装契約

- consumer rootとruntime rootを絶対canonical pathとして検証し、runtime rootがconsumer root外へ解決される
  lexical path、symlink、junctionをfail-closeする。
- configuration、DB、Memory、PLAN projection、lock、hook state、receipt、evidence、historyのlayoutはruntime rootからのみ導出し、
  callerが任意rootを注入できない凍結layoutとして返す。
- 受領したsealed planのentriesをpath/mode/contentから独立に再計算する。manifest、receipt、PF5 planの申告
  digestを計算入力にせず、再計算値が三者へ一致した場合だけadmitする。
- materializer version、release identity、source revision、product namespace、consumer/runtime rootを
  receiptへ束縛し、A/B間の横流しを拒否する。
- staging/apply/restoreの失敗分類は既存PF5の`unavailable`または`rollback_failed/indeterminate`を保持し、
  deny時はconsumer write/process portへ到達させない。
- admissionが`namespace_escape`、release/artifact/receipt identity mismatch、独立再計算digest mismatch、
  artifact unavailable、unknown version、invalid inputでdenyした場合、既存PF5 compositionの
  snapshot/staging/apply/discard/restoreとpointer/publishは全て0回で、consumerのprior bytes/mode/path/version/history
  treeは不変とする。

## 3. TDD/trace

`CANDIDATE-PACKISO-001..007`を`tests/consumer-local-runtime-admission.test.ts`の同番号
`U-PACKISO-001..007`へ昇格する。U004/U005はBのruntime commandを実processとして稼働させ、PID/exitと
bytes/mode/path/state treeをAのupgrade/rollback前後で比較する。U002/U006はreal filesystemの
symlink/junction、unknown version、digest mutation、receipt mismatchを含み、U007はdeny軸を一度に一つだけ
変異してadmission branchと全composition port count 0を直接観測する。

## 4. 完了条件

1. U-PACKISO全件、TypeScript、Biome、PLAN lint、scoped doctorがGreen。
2. Linux/Windowsでsource不在、A/B隔離、異version、片系upgrade/rollback、局所faultを実測する。
3. Reverse R1〜R4で必要差分をL6/test-designへbackfillする。
4. 非著者のclosing reviewと正規receipt gateを通過する。mergeは親runtimeが実施し、自分では行わない。

## 5. Issue #419: CANDIDATE-PACKISO-007昇格

PLAN-REVERSE-496 R4で固定したdeny時副作用0契約を、既存consumer-local compositionへ接続する。
namespace escape、release/artifact/receipt identity mismatch、独立再計算digest mismatch、artifact unavailable、
unknown version、invalid inputを個別に生成し、各caseで実装本体の`installConsumerLocalRuntime`が
`phase: "admission"`を返すこと、PF5 snapshot/staging/apply/discard/restoreのcall countが0であること、さらに
consumer prior bytes/mode/path/version/history treeが不変であることを測定する。U006はadmission predicateの
matrix、U007は実compositionへ直接渡す独立oracleであり、receipt `consumerRoot`/`runtimeRoot` 非stringは
typed `identity_mismatch`としてU007に含める。remote publication、channel CAS、PF5内部契約の再実装は行わない。
