---
plan_id: PLAN-L7-479-release-manifest-pf1-pure-domain
title: "PLAN-L7-479 (impl): PF-1 release manifest pure domain pair-freeze"
kind: impl
layer: L7
drive: be
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-05
updated: 2026-08-13
owner: PM / PO
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - release manifest pure parser、immutable identity、own-property channel resolverをTDD実装する"
  - role: qa
    slot_label: "QA - PF-1 owner oracleの型、identity、order、prototype境界を検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-479-release-manifest-pf1-pure-domain.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/release-manifest.ts
    artifact_type: source_module
  - artifact_path: tests/release-manifest.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    - docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/247
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-473 の PF-1 partition として freeze 済みの pure domain 追加であり、L0-L6 要件・設計・外部仕様を変更しない。上流への逆伝播は不要 (副作用契約は PF-5 の RED が保持)。"
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-13T10:21:18Z"
    tests_green_at: "2026-08-13T10:16:36Z"
    verdict: approve
    scope: >-
      PR #307 の blind closing review 2 周。初回 FLAG は U-RELMAN-007 の oracle 空証明であり、
      テスト追補 dc007c6c で mutA を KILL した。mutD は等価 mutant と判明し、kill は 3 から 6 へ
      増加して PASS となった。subject は exact HEAD dc007c6cf282b884771ae7a15bf2ca5eda8b2082。
    worker_model: gpt-5.6-terra
    reviewer_model: claude-opus-5
    citations:
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/307#issuecomment-5278656377"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/307#issuecomment-5279055340"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/31689925418"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/release-manifest.test.ts"
        runner: bash
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-13T10:16:36Z"
        evidence_path: tests/release-manifest.test.ts
        output_digest: "sha256:23f7fa804c934d2f2978f6fd2c3978afd88bd1fbda923894e791f0d56f810f85"
        anchor_commit: dc007c6cf282b884771ae7a15bf2ca5eda8b2082
---

# PF-1: release manifest pure domain pair-freeze

本 PLAN は master `PLAN-L7-473` のPF-1を、実行可能かつ検証所有が一意なforward implementation
partitionへ分けるdocs-only pair-freezeである。master PLANはPF-5 aggregate acceptanceまでdraftのまま
保持し、Reverse R1〜R4と最終のaggregate原子性を所有し続ける。本 PLAN は新しいfeature lifecycle、
Git/FS/CLI adapter、materializer、isolated Git resolver、copy/writeを追加しない。

## Entry

PF-0のdocs-only訂正PR #246がmainへmergeされ、Issue #247がReadyであること。本PLAN自身が
exact-HEAD CIとnon-author closing reviewを通過してmainへmergeするまで、PF-1実装は開始しない。

## Scope / owner

PF-1が所有するのは以下のcandidateだけである。

- `CANDIDATE-RELMAN-001`: strict schema type、unknown version、unknown fieldのpure fail-close
- `CANDIDATE-RELMAN-002`: pure channel resolutionの`unknown_channel`
- `CANDIDATE-RELMAN-007`: custom channelと`channelOrder`のown-key完全列挙
- `CANDIDATE-RELMAN-009`: release ID、source commit、artifact digestの独立identity mutation
- `CANDIDATE-RELMAN-013`: `toString`、`constructor`、`__proto__`を含むown-property境界

実装PRは `src/schema/release-manifest.ts` というsource module 1個と対になるunit testだけを同じ
commitで追加し、上記5件を`U-RELMAN-*`へ昇格する。parse成功値はimmutable release identityを返す。
`CANDIDATE-RELMAN-014`〜`017`、特にinvalid/unknown channel時のresolver/materializer/copy/write 0と
fault injectionはPF-5のままREDを維持する。PF-1のpure返値を副作用証明の代替にしてはならない。

## 実装

- `src/schema/release-manifest.ts` は `schema_version=v1` のstrict parse、release identity導出式、
  `channels` と `channelOrder` のown-key完全列挙、immutableな成功値、own-propertyだけを使う
  channel resolverを提供するpure domain moduleとする。
- `tests/release-manifest.test.ts` は `U-RELMAN-001`、`002`、`007`、`009`、`013` を各 `it()` と
  1:1に対応させる。`007` は存在しないrelease IDへのchannel参照と、channel数と同数長の重複
  `channelOrder`も拒否する。`013` は`unknown_channel`の`ok: false`とerror値、および`channels`と
  `channelOrder`のfreezeを直接pinする。Git/FS/CLI adapter、materializer、resolver I/O、copy/write、
  feature lifecycleは追加しない。`014`〜`017`はPF-5のRED oracleとして変更しない。

## Exit

- [Claude non-author closing review の PASS](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/307#issuecomment-5279055340) と [CI run 31689925418](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/31689925418) を confirm 根拠とする。
- このdocs-only PLANがmainへmergeされる。
- 後続のPF-1実装PRが、上記5 candidateの実装test citationを同じcommitで`U-RELMAN-*`へ昇格する。
- exact HEAD CIとnon-author closing PASSを満たすまでIssue #247をcloseせず、PF-2 #248を解除しない。
