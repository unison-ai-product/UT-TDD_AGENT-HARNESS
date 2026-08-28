---
plan_id: PLAN-REVERSE-523-release-version-identity-backfill
title: "PLAN-REVERSE-523: 初回canary version locator identity backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R1
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-28
updated: 2026-08-28
owner: Codex / Luna
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: "PLAN-L6-63のcontent-derived release identityを変更せず、semver/tag locatorの欠落束縛だけを補うため。"
parent_design: docs/plans/PLAN-L7-523-release-version-identity.md
pair_artifact: docs/test-design/harness/L7-release-version-identity-test-design.md
github_issue_id: 474
agent_slots:
  - role: tl
    slot_label: "Opus/Sol - L6 identity定義をsemverへ置換していないことを逆向き検証する"
  - role: qa
    slot_label: "Terra - prerelease precedenceとwrite 0 oracleを独立照合する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-523-release-version-identity-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-release-version-identity-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-523-release-version-identity.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-362-pack-update-check-advisory.md
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-L7-519-pack-publication-adapter.md
    - docs/test-design/harness/L7-release-version-identity-test-design.md
review_evidence: []
---

# PLAN-REVERSE-523: version locator identity backfill

## R0 / R1

初回canary locatorは`v0.2.0-canary.1`だが、current mainのpackage/lock/CLIは`0.1.4`である。
さらにupdate-checkはstable tag parserをpackage version検証にも共有し、prerelease package versionをinvalid扱いする。remote publication
contractはtagとrelease identityを束縛するが、sealed package versionとtag locatorの一致は未所有である。

本pairはこのgapだけを補い、次を固定する。

1. package/lock/CLI versionは一つのpackage正本から`0.2.0-canary.1`へ一致する。
2. tag locatorは`v${releaseVersion}`であり、content-derived `releaseId`を代替しない。
3. package prerelease parserをstable tag parserから分離し、stable tag selectionとadvisory fail-openを維持する。
4. sealed package entry、intent、receipt、tagのversion/identity一軸driftはremote write前に拒否する。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | 独立Packと段階公開の既存要求を変更しない。 |
| L4/L5 | not_impacted | 新しい外部port、永続schema、credentialを追加しない。 |
| L6-63 | not_impacted | semver/tagはlocator、releaseIdはcontent-derivedという既存判断を維持する。 |
| L7-362 | updated | package parserだけにprerelease SemVerを加える。stable tag parserと`latestReleaseTag`はprereleaseを広告しない。 |
| L7-515/519 | updated | package versionとtag locatorのseal前照合をadditiveに接続する。 |
| L7-523 | new | 欠落していたversion locator束縛と実装所有を固定する。 |

## R2〜R4出口

R2は各candidateのRed、R3はpackage/tag/receipt/releaseIdを一軸ずつ攻撃しremote write ledger 0を
確認する。R4は`releaseId`導出式、manifest schema、asset namingへのbackpropが不要であることを確認する。
mixed stable/prerelease tag listで既存stable選択が不変であることもR3の必須証跡とする。
package version更新、production実装、CI、canonical closing receiptが揃う前にR4またはcanary-readyを
宣言しない。
