---
plan_id: PLAN-L7-508-pack-publication-staging-auditor
title: "PLAN-L7-508 (add-impl): local deterministic Pack publication staging/auditor"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-25
updated: 2026-08-26
owner: Codex / Luna
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_decision: required
backprop_decision_reason: "local staging/auditorの実測結果をPLAN-REVERSE-505へ戻し、remote未実装境界を保持する。"
github_issue_id: 403
next_pair_freeze: L8
agent_slots:
  - role: se
    slot_label: "Luna worker - deterministic local Pack staging and auditor"
  - role: qa
    slot_label: "TDD - exact entries, semantic snapshot digest, atomic fault matrix"
  - role: tl
    slot_label: "TL - CANDIDATE-PACKPUB-001/002 local boundary review"
generates:
  - artifact_path: docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/pack-publication-staging.ts
    artifact_type: source_module
  - artifact_path: tests/pack-publication-staging.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
    - docs/plans/PLAN-L7-500-pack-publication-assets-pure-domain.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-505-pack-staged-release-rollback-backfill.md
    - docs/plans/PLAN-REVERSE-508-pack-publication-staging-auditor-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/schema/release-manifest.ts
    - src/setup/pack-publication-assets.ts
review_evidence:
  - reviewer: codex-primary-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-25T12:02:58Z"
    tests_green_at: "2026-08-25T12:02:57Z"
    verdict: "preflight green; Claude Opus non-author exact-head closing review pending"
    scope: >-
      worker_model gpt-5.6-luna / effort high。CANDIDATE-PACKPUB-001/002のうち
      parsed v2、explicit inventory、deterministic assets、control snapshot、local
      staging/apply/discard/restore（destination未存在snapshotを含む）、partial/indeterminate auditorだけを対象とする。
      remote mutation、approval/CAS、rollback、CLI、consumer E2Eは対象外。
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: gpt-5.6-sol
    plan_revision: d888938eee480d65febf4b4d16fd9473c5f80d03
    subject_head: d888938eee480d65febf4b4d16fd9473c5f80d03
    evidence_path: tests/pack-publication-staging.test.ts
    anchor_commit: d888938eee480d65febf4b4d16fd9473c5f80d03
    citations:
      - "tests/pack-publication-staging.test.ts: U-PACKPUB-STAGE-001..010"
      - "docs/test-design/harness/L7-unit-test-design.md: U-PACKPUB-STAGE-001..010"
      - "src/setup/pack-publication-staging.ts"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/pack-publication-staging.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-25T12:02:57Z"
        evidence_path: tests/pack-publication-staging.test.ts
        output_digest: "sha256:23c73a599765174931d1595b52de15cd76f05e39fc0a88cb903683bc7708ace8"
        anchor_commit: d888938eee480d65febf4b4d16fd9473c5f80d03
      - kind: typecheck
        command: "npx tsc --noEmit --pretty false"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-08-25T12:02:57Z"
        evidence_path: src/setup/pack-publication-staging.ts
        output_digest: "sha256:3e0361e097e0680dc671a2a11032909ba23400b1d6bb5ff62fe72740dac37d82"
        anchor_commit: d888938eee480d65febf4b4d16fd9473c5f80d03
      - kind: lint
        command: "npx biome check src/setup/pack-publication-staging.ts tests/pack-publication-staging.test.ts"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-08-25T12:02:57Z"
        evidence_path: src/setup/pack-publication-staging.ts
        output_digest: "sha256:3e0361e097e0680dc671a2a11032909ba23400b1d6bb5ff62fe72740dac37d82"
        anchor_commit: d888938eee480d65febf4b4d16fd9473c5f80d03
---

# PLAN-L7-508

## 目的と境界

`PLAN-L7-499` の parsed manifest v2 と `PLAN-L7-500` の exact sealed entries / deterministic
tar.gz / checksum を、local-only の sealed Pack publication staging plan へ束ねる。control manifest
sidecar の完全性は YAML の文字列表現ではなく semantic `controlManifestSnapshotDigest` で束縛する。

staging plan は Pack commit entries と release assets を明示列挙するが、Git、filesystem、network、
current worktree、directory walk、Pack checkout、allowlist、CLI、remote mutation、commit/tag/release/
channel pointer、consumer E2E は参照しない。

## TDD 契約

- release record は parsed v2 の選択 release と exact に一致し、sealed entry の欠落・余剰・順序・path・
  mode・size・content digest drift を fail-close する。
- commit entries は manifest artifact destinations と `release/manifest.yaml` sidecar のみ、release assets
  は deterministic builder の tarball と `.sha256` の 2 件のみとする。
- `controlManifestSnapshotDigest` は `ut-tdd-pack-control-v2\0`、要素数付きの `releases` / `channels`
  domain separator、release ID UTF-8 順の `releaseId/releaseRecordDigest`、`channelOrder` 順の
  `channel/releaseId` を semantic framing して再計算する。release record と channel record が同じ
  pair を持っても節境界を越えて同一 digest になってはならない。
- plan と bytes は deep immutable snapshot とし、injected `snapshot/writeStaging/apply/discard/restore` ports
  の fault は prior destination を復元できる場合だけ typed unavailable、復元不能なら typed indeterminate とする。
- auditor は exact observed commit/assets/control digest のみを attested とし、commit、asset欠落、asset
  digest/bytes drift、control digest driftをそれぞれ typed reason付き `partial_publication`、観測不能を
  `indeterminate` として成功へ丸めない。

## 非スコープ

approval receipt、remote CAS、Git tag/Release、promotion、rollback、channel pointer FSM、Pack remote
copy、source/CLI変更、consumer E2E は後続 adapter の責務として残す。CANDIDATE-PACKPUB-003/004 は昇格しない。

## 検証

Red→Green の targeted Vitest、`tsc --noEmit`、Biome lint を実行し、実行結果と exact HEAD をこの PLAN の
review evidence に追記する。remote 操作は実行しない。
