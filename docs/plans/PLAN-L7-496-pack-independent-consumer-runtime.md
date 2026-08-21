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
updated: 2026-08-21
owner: PM / Codex
parent_design: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - consumer-local namespace、receipt束縛、PF5 port再利用を実装する"
  - role: qa
    slot_label: "QA - U-PACKISO-001..006、実process、局所faultとescapeを実測する"
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
  - reviewer: codex-primary-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-21T15:55:00+09:00"
    tests_green_at: "2026-08-21T15:49:00+09:00"
    verdict: "preflight-pass; non-author closing review pending"
    scope: "B1-B7 exact-head preflight是正。dual consumer、component layout、v1/v2 identity、atomic upgrade/rollback、canonical releaseId、symlink aliasを再検収。"
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    plan_revision: db29bc73
    subject_head: db29bc73
    evidence_path: tests/consumer-local-runtime-admission.test.ts
    anchor_commit: db29bc73
    citations:
      - "tests/consumer-local-runtime-admission.test.ts: U-PACKISO-001..006 expanded 25 cases"
      - "src/setup/consumer-local-runtime-admission.ts: canonical layout, releaseId derivation, PF5 install composition"
      - "src/schema/release-manifest.ts: deriveReleaseId"
    green_commands:
      - kind: unit_test
        command: "node node_modules/vitest/vitest.mjs run tests/consumer-local-runtime-admission.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1 (fenced diagnostic)"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T15:49:00+09:00"
        evidence_path: tests/consumer-local-runtime-admission.test.ts
        anchor_commit: db29bc73
      - kind: typecheck
        command: "npm run typecheck -- --pretty false"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-08-21T15:49:00+09:00"
        evidence_path: src/setup/consumer-local-runtime-admission.ts
        anchor_commit: db29bc73
      - kind: lint
        command: "npm run lint"
        runner: node
        scope: full
        exit_code: 0
        completed_at: "2026-08-21T15:49:00+09:00"
        evidence_path: src/setup/consumer-local-runtime-admission.ts
        anchor_commit: db29bc73
      - kind: plan_lint
        command: "node src/cli.ts plan lint docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T15:49:00+09:00"
        evidence_path: docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
        anchor_commit: db29bc73
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
- DB、Memory、PLAN projection、lock、hook state、receipt、evidenceのlayoutはruntime rootからのみ導出し、
  callerが任意rootを注入できない凍結layoutとして返す。
- 受領したsealed planのentriesをpath/mode/contentから独立に再計算する。manifest、receipt、PF5 planの申告
  digestを計算入力にせず、再計算値が三者へ一致した場合だけadmitする。
- materializer version、release identity、source revision、product namespace、consumer/runtime rootを
  receiptへ束縛し、A/B間の横流しを拒否する。
- staging/apply/restoreの失敗分類は既存PF5の`unavailable`または`rollback_failed/indeterminate`を保持し、
  deny時はconsumer write/process portへ到達させない。

## 3. TDD/trace

`CANDIDATE-PACKISO-001..006`を`tests/consumer-local-runtime-admission.test.ts`の同番号
`U-PACKISO-001..006`へ昇格する。U004/U005はBのruntime commandを実processとして稼働させ、PID/exitと
bytes/mode/path/state treeをAのupgrade/rollback前後で比較する。U002/U006はreal filesystemの
symlink/junction、unknown version、digest mutation、receipt mismatchを含む。

## 4. 完了条件

1. U-PACKISO全件、TypeScript、Biome、PLAN lint、scoped doctorがGreen。
2. Linux/Windowsでsource不在、A/B隔離、異version、片系upgrade/rollback、局所faultを実測する。
3. Reverse R1〜R4で必要差分をL6/test-designへbackfillする。
4. 非著者のclosing reviewと正規receipt gateを通過する。mergeは親runtimeが実施し、自分では行わない。
