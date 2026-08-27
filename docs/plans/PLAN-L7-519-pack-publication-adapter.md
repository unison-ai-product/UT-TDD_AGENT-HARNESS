---
plan_id: PLAN-L7-519-pack-publication-adapter
title: "PLAN-L7-519 (add-impl): human-approved Pack canary publication adapter"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-27
updated: 2026-08-27
owner: Codex / Luna
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
backprop_decision: required
backprop_decision_reason: "approval/CAS/nonce/partial boundaryをL6 publication契約へ逆向きに照合する。"
github_issue_id: 414
next_pair_freeze: L8
agent_slots:
  - role: se
    slot_label: "Luna worker - sealed intentと注入GitHub/Pack port"
  - role: qa
    slot_label: "Terra - approval/identity/nonce/CAS/fail-close oracle"
  - role: tl
    slot_label: "Sol - exact HEAD非著者検収"
generates:
  - artifact_path: src/setup/pack-publication-adapter.ts
    artifact_type: source_module
  - artifact_path: tests/pack-publication-adapter.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
    - docs/plans/PLAN-L7-500-pack-publication-assets-pure-domain.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-519-pack-publication-adapter-backfill.md
    - src/setup/pack-publication-staging.ts
    - src/schema/release-manifest.ts
    - tests/pack-publication-adapter.test.ts
review_evidence:
  - reviewer: codex-primary-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-27T08:10:00Z"
    tests_green_at: "2026-08-27T08:10:00Z"
    verdict: "targeted Node/npm and relevant local domain tests green; Claude non-author closing review and CI pending"
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: gpt-5.6-sol
    plan_revision: 36be04bf
    subject_head: 36be04bf
    evidence_path: tests/pack-publication-adapter.test.ts
    anchor_commit: 36be04bf
    scope: >-
      U-PACKPUB-REMOTE-001..009 direct approval, identity, nonce, initial/late CAS,
      journal/receipt, pack read-back and happy-path oracles. No Pack remote mutation.
    citations:
      - "tests/pack-publication-adapter.test.ts: U-PACKPUB-REMOTE-001..009"
      - "src/setup/pack-publication-adapter.ts"
      - "docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/pack-publication-adapter.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-27T08:10:00Z"
        evidence_path: tests/pack-publication-adapter.test.ts
        output_digest: "sha256:0000000000000000000000000000000000000000000000000000000000000000"
        anchor_commit: 36be04bf
      - kind: typecheck
        command: "npm run typecheck"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-08-27T08:10:00Z"
        evidence_path: src/setup/pack-publication-adapter.ts
        output_digest: "sha256:0000000000000000000000000000000000000000000000000000000000000000"
        anchor_commit: 36be04bf
---

# PLAN-L7-519: Pack publication adapter

Issue #414 の bounded implementation は、既存の `SealedPackPublicationPlan` と manifest-v2 / release
identity を入力に、human-approved internal canary の pure domain と注入 port を提供する。
実行経路は Node/npm とし、Bun、source/worktree/DB/PLAN/evidence/Pack checkout の暗黙補完を持たない。

root intent は entries、control snapshot、exact two assets、source revision、materializer、release
identity、expected tree、allowed `pull_request_cas`、operation/idempotency/nonce を immutable に束縛する。
未生成の commit/tree SHA は事前計算しない。planned の before-state CAS、transition approval、append-only
journal（planned / mutation intent / read-back）を先に検証し、pack commit → draft Release → assets →
annotated tag → visibility → canary pointer の一方向 FSM を固定する。

initial drift、approval/nonce/identity mismatch、duplicate tag、remote mismatch/unavailable、late
pointer drift は fail-close し、最初の write 前は `remoteWrites: 0`、最初の ambiguity 後は後続 write 0
の typed result を返す。tag/Release/assets/visibility の完全 attestation 前に canary pointer を書かない。
成功時は release/pointer commit-tree、before/after snapshot、asset identity、approval、nonce、journal と
intent を束ねた publication receipt を保存する。実 remote mutation はこの PRでもテストでも実行しない。

PR #438 の PLAN-L7-515 remote-canary contract は draft/unmerged の predecessor candidate であり、
本 slice はその未確定実装を import/cherry-pick せず、`PLAN-L6-63` と merged local staging 契約だけを
継承する。#438 が確定するまで本 PR を merge-ready、Pack remote execution-ready、または stable-ready
とは判定しない。

## TDD / verification

`CANDIDATE-PACKPUB-REMOTE-001..003` を `U-PACKPUB-REMOTE-*` に昇格し、Node/npm targeted test、typecheck、
Biome、PLAN lint を exact HEAD に束ねる。Reverse pair は `PLAN-REVERSE-519` が approval/CAS/nonce/
partial 境界を `PLAN-L6-63` と既存 staging へ backfill する。
