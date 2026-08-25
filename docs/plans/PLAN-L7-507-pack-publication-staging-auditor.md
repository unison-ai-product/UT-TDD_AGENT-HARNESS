---
plan_id: PLAN-L7-507-pack-publication-staging-auditor
title: "PLAN-L7-507 (add-impl): local deterministic Pack publication staging/auditor"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-25
updated: 2026-08-25
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
  - artifact_path: docs/plans/PLAN-L7-507-pack-publication-staging-auditor.md
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
    - docs/plans/PLAN-REVERSE-505-pack-staged-release-rollback-backfill.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-505-pack-staged-release-rollback-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/schema/release-manifest.ts
    - src/setup/pack-publication-assets.ts
review_evidence:
  - reviewer: codex-worker-self-check
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-25T00:00:00Z"
    tests_green_at: "pending"
    verdict: "IMPLEMENTATION EVIDENCE; non-author closing review pending"
    scope: >-
      worker_model gpt-5.6-luna / effort high。CANDIDATE-PACKPUB-001/002のうち
      parsed v2、explicit inventory、deterministic assets、control snapshot、local
      staging/apply/discard/restore、partial/indeterminate auditorだけを対象とする。
      remote mutation、approval/CAS、rollback、CLI、consumer E2Eは対象外。
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: gpt-5.6-sol
    plan_revision: pending
    subject_head: 6258c510e542a5ce62799e58c97dc17e8b3ae623
    evidence_path: tests/pack-publication-staging.test.ts
---

# PLAN-L7-507

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
- `controlManifestSnapshotDigest` は `ut-tdd-pack-control-v2\0`、release ID UTF-8 順の
  `releaseId/releaseRecordDigest`、`channelOrder` 順の `channel/releaseId` を semantic framing して再計算する。
- plan と bytes は deep immutable snapshot とし、injected `snapshot/writeStaging/apply/discard/restore` ports
  の fault は prior destination を復元できる場合だけ typed unavailable、復元不能なら typed indeterminate とする。
- auditor は exact observed commit/assets/control digest のみを attested とし、欠落・余剰・digest drift は
  `partial_publication`、観測不能は `indeterminate` として成功へ丸めない。

## 非スコープ

approval receipt、remote CAS、Git tag/Release、promotion、rollback、channel pointer FSM、Pack remote
copy、source/CLI変更、consumer E2E は後続 adapter の責務として残す。CANDIDATE-PACKPUB-003/004 は昇格しない。

## 検証

Red→Green の targeted Vitest、`tsc --noEmit`、Biome lint を実行し、実行結果と exact HEAD をこの PLAN の
review evidence に追記する。remote 操作は実行しない。
