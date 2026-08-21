---
plan_id: PLAN-L7-498-pack-publication-manifest-v2-pure-domain
title: "PLAN-L7-498 (add-impl): Pack publication manifest v2 pure domain"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-21
updated: 2026-08-21
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - Luna Redを起点にmanifest v2 strict parserとdigest domainを実装する"
  - role: qa
    slot_label: "QA - PACKPUB-001のbyte framing、identity、UTF-8 mutationを検証する"
  - role: tl
    slot_label: "TL - Opus非著者reviewでpublication境界を検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-498-pack-publication-manifest-v2-pure-domain.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - PLAN-L7-479-release-manifest-pf1-pure-domain
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-479-release-manifest-pf1-pure-domain.md
    - docs/plans/PLAN-REVERSE-498-pack-publication-manifest-v2-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/schema/release-manifest.ts
    - tests/release-manifest.test.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/380
github_issue_id: 380
backprop_decision: required
review_evidence:
  - reviewer: codex-sol-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-21T11:23:00Z"
    tests_green_at: "2026-08-21T11:25:11Z"
    verdict: "PASS blocking 0; Claude Opus non-author closing review pending"
    scope: >-
      exact implementation HEAD 4a93ee5054d367d7700e81eb20baecd3911c0005 の
      manifest v2 strict schema、literal UTF-8 golden framing、coordinated identity mutation、
      lone-surrogate fail-closeをclaim-blind/spec-blindで検収した。
    worker_model: "gpt-5.6-luna (Red scaffold) + codex-primary (Green/FLAG closure)"
    reviewer_model: gpt-5.6-sol
    plan_revision: 4a93ee5054d367d7700e81eb20baecd3911c0005
    subject_head: 4a93ee5054d367d7700e81eb20baecd3911c0005
    evidence_path: tests/release-manifest.test.ts
    anchor_commit: 4a93ee5054d367d7700e81eb20baecd3911c0005
    citations:
      - "src/schema/release-manifest.ts: parsePublicationManifest / deriveArtifactInventoryDigest / deriveReleaseRecordDigest"
      - "tests/release-manifest.test.ts: U-PACKPUB-001"
    green_commands:
      - kind: unit_test
        command: "node node_modules/vitest/vitest.mjs run tests/release-manifest.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1 (workspace-fence diagnostic)"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T11:25:11Z"
        evidence_path: tests/release-manifest.test.ts
        output_digest: "sha256:07f3fccf316c581128b1c7a6b99448310cf4f15998547e4fc63052586c17e3b6"
        anchor_commit: 4a93ee5054d367d7700e81eb20baecd3911c0005
---

# Pack publication manifest v2 pure domain

## 1. 目的と境界

`PLAN-L6-63`でfreezeした新規publication用manifest v2をpure domainへ降ろす。現行v1は既存releaseの
read-only解決に残すが、新規publication入力では`v1_read_only`として拒否する。tracked tree、allowlist、
current worktree、Pack checkoutから`artifacts[]`を補完しない。

本sliceはschema parseとdigest再計算だけを所有する。Git/FS/CLI、tar/gzip生成、GitHub Release、tag、
channel pointer CAS、promotion、rollback、Pack copy、複数consumer E2Eは後続sliceへ残す。

## 2. 成果物traceと所有権

- 変更実体: `src/schema/release-manifest.ts`、`tests/release-manifest.test.ts`。
- 両artifactの既存ownerは`PLAN-L7-479`であり、本PLANは重複`generates`を宣言しない。
- 本PLANはv2 additive delta、Issue #380、`U-PACKPUB-001`の実装revisionをtraceする。
- PR #361のmerge後、L7 test-designへ`U-PACKPUB-001`を同じ実装PRで登録した。

## 3. 実装契約

1. root、release record、artifact entryはexact keyのみを受理する。
2. v2 channelは`canary`、`stable`と`channelOrder`のown-property完全一致を要求する。
3. artifactはsource/destinationのcanonical relative POSIX path、mode `100644|100755`、safe integer size、
   content SHA-256を要求し、source/destination重複とdestination UTF-8 byte順違反を拒否する。
4. UTF-8 round-trip不能なlone surrogateを拒否し、byte framing前の文字列aliasを許さない。
5. `artifactInventoryDigest`と`releaseRecordDigest`は`PLAN-L6-63`のprefix、u32/u64 BE、raw digest、
   field順で再計算する。literal non-ASCII golden vectorでproduction helper自己参照を避ける。
6. 成功値はrelease、artifact配列、各entry、channel、orderまでdeep immutable snapshotとする。

## 4. TDD / Oracle

`U-PACKPUB-001`は次を同一oracle群で殺す。

- v1 publication、unknown/missing/type、unknown key。
- absolute/drive/UNC/backslash/dot segment、mode 120000、重複、順序、unsafe size。
- release ID、source commit、artifact-set/inventory/asset-inventory/record digestの単独mutation。
- inventory再計算後にrecordを据え置くcoordinated mutation。
- UTF-8 byte lengthをJS code-unit lengthへ変えるmutationとsource/destination lone surrogate。
- 入力変更が成功snapshotへ漏れるmutation。

## 5. Exit

- targeted test、TypeScript、Biome、plan lint、Linux/Windows/aggregateをGreenにする。
- L7 test-designの`U-PACKPUB-001`と実テストを1対1でtraceする。
- Claude Opus 5のexact-head非著者closing PASSを得る。
- Reverse-498をR3/R4へ進め、L6契約に追加backfillが不要かを明示してからmergeする。
