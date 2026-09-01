---
plan_id: PLAN-L7-527-pack-consumer-node-readiness
title: "PLAN-L7-527 (add-impl): Bun 非依存の consumer Node readiness (S1-a)"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-31
updated: 2026-08-31
owner: Codex / Luna
worker_model: gpt-5.6-luna
worker_effort: high
github_issue_id: 471
parent_design: docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-node-readiness-test-design.md
next_pair_freeze: L7
transition_direction: design_to_implementation
implementation_disposition: none
agent_slots:
  - role: se
    slot_label: "SE - readiness を engines.node と Git の判定へ限定する"
  - role: qa
    slot_label: "QA - Bun 不在の clean consumer setup と Node range の負系を実測する"
generates:
  - artifact_path: docs/plans/PLAN-L7-527-pack-consumer-node-readiness.md
    artifact_type: markdown_doc
  - artifact_path: tests/setup-bun-readiness.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-527-pack-consumer-node-readiness-backfill.md
    - docs/test-design/harness/L7-pack-consumer-node-readiness-test-design.md
    - docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - src/setup/distribution.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/471
# These are genuine preflight records from the implementation's earlier exact
# heads. A fresh exact-head closing review is still required after rebase.
review_evidence:
  - reviewer: sol
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-31T07:26:56Z"
    tests_green_at: "2026-08-31T07:26:49Z"
    verdict: >-
      non-author preflight PASS / blocking 0。readiness の checks、ci.requires、rollback.commands が
      Node/npm-onlyであること、engines.node のsemver正負境界、S1-a外の非変更を確認した。
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    plan_revision: 3c3a8f0ff14e325f9d9cf10fc9ed0e319ee8dad7
    subject_head: 3c3a8f0ff14e325f9d9cf10fc9ed0e319ee8dad7
    scope: >-
      PLAN-L6-93、PLAN-L7-522/L7-527、対test-design、readiness composition、
      U-PACKBUN-001/002、engines.node range、#470/#472/#473との非干渉を対象とした。
    citations:
      - "src/setup/distribution.ts"
      - "tests/setup-bun-readiness.test.ts"
      - "tests/setup.test.ts"
      - "docs/test-design/harness/L7-pack-consumer-node-readiness-test-design.md"
      - "docs/design/harness/L6-function-design/setup-solo-team.md"
      - "docs/test-design/harness/L7-unit-test-design.md"
      - "docs/plans/PLAN-REVERSE-527-pack-consumer-node-readiness-backfill.md"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/setup-bun-readiness.test.ts tests/setup.test.ts --reporter=dot"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-31T07:26:49Z"
        evidence_path: tests/setup-bun-readiness.test.ts
        output_digest: "sha256:811bf3b2b31ce099a3b7ae6c840267ea111f5eb0e700424026a6a6b55bfc463a"
        anchor_commit: 3c3a8f0ff14e325f9d9cf10fc9ed0e319ee8dad7
  - reviewer: sol
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-31T08:21:55Z"
    tests_green_at: "2026-08-31T08:20:40Z"
    verdict: >-
      non-author preflight PASS / blocking 0。Claude FLAG 4a8adc0e の L6/L7
      U-SETUP-012 不整合、U-SETUP-013/AT-DIST-001 の移行中 fixture 記述、
      S1-a先行時の中間状態開示を exact HEAD で再検収した。
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    plan_revision: 28787e4b93a90fa7d9899309ff037a2aa1439610
    subject_head: 28787e4b93a90fa7d9899309ff037a2aa1439610
    scope: >-
      engines.node readiness、Node/npm-only output、global U-SETUP-012/013、
      paired test design、Reverse-527、PR #495 の中間状態開示を対象とした。
    citations:
      - "src/setup/distribution.ts"
      - "src/cli/distribution.ts"
      - "tests/setup-bun-readiness.test.ts"
      - "tests/setup.test.ts"
      - "tests/distribution-acceptance.test.ts"
      - "docs/design/harness/L6-function-design/setup-solo-team.md"
      - "docs/test-design/harness/L7-unit-test-design.md"
      - "docs/test-design/harness/L7-pack-consumer-node-readiness-test-design.md"
      - "docs/plans/PLAN-REVERSE-527-pack-consumer-node-readiness-backfill.md"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/setup-bun-readiness.test.ts tests/setup.test.ts --reporter=dot"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-31T08:20:40Z"
        evidence_path: tests/setup-bun-readiness.test.ts
        output_digest: "sha256:811bf3b2b31ce099a3b7ae6c840267ea111f5eb0e700424026a6a6b55bfc463a"
        anchor_commit: 28787e4b93a90fa7d9899309ff037a2aa1439610
---

# PLAN-L7-527: Bun 非依存の consumer Node readiness (S1-a)

## 1. 目的と境界

`PLAN-L7-522` が Issue #471 へ割り当てた S1-a だけを実装する。clean consumer の setup
readiness から Bun probe と `bunOk` を除去し、consumer `package.json` の `engines.node` と Git を
正本として判定する。生成成果物の Bun 撤去 (#470)、source CI (#472)、sealed Node producer
(#473) は所有しない。

S1-a は S1-b (#470) より先に landing できるが、その場合は移行中の中間状態が発生する。
readiness が `ok: true` でも、#470 が未着地の間は既存の生成 hook/template が Bun を要求し得るため、
この組合せは releasable とは扱わない。#470 の完了を consumer canary の前提として維持し、
本 PLAN は readiness 判定だけを Node/npm 正本へ切り替える。

## 2. 不変条件

1. Bun が PATH と既知 home path のどちらにも無くても、対応 Node と Git があれば setup は成功する。
2. readiness の全出力 (`checks`、`ci.requires`、`rollback.commands`) にBun check、導入案内、
   実行コマンドを残さず、Node/npm経路だけを提示する。
3. Node version は `engines.node` の npm semver range を満たさない場合に fail-close する。
4. source `package.json` の build script、生成 template、source workflowは変更しない。
5. parentがdual-lockを保持する期間は `package-lock.json` と `bun.lock` の direct graph parity を維持する。

## 3. 完了条件

- `U-PACKBUN-001`: Bun 到達不能な隔離consumerで実setupが成功する。
- `U-PACKBUN-002`: readiness全体からBun文字列が消え、Node/npmのCI・rollback command、
  Node rangeの正負境界、Git checkが観測できる。
- 実 CLI acceptance は `process.execPath` でNodeを直接起動する。
- L6 `setup-solo-team.md` と global L7 `L7-unit-test-design.md` の U-SETUP-012/
  U-SETUP-013/AT-DIST-001 が本PLANおよび paired test designと同じ契約を記載する。
- **依存状態**: S1-b (#496) は current main `f38b78d8` に landing 済みで、生成 consumer
  の Node wrapper／Bun hook 撤去はこのPRの実装前提として成立している。S1-a単独では
  Bun BANまたはreleasableの主張をせず、S1-c以降 (#472/#473) の完了を別途要求する。
- Linux / Windows / aggregate CIがexact HEADでGreenになる。
- Reverse-527が実測証跡をR4へ戻す。
