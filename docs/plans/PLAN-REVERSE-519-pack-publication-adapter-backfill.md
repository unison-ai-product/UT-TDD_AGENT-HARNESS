---
plan_id: PLAN-REVERSE-519-pack-publication-adapter-backfill
title: "PLAN-REVERSE-519: Pack publication adapter backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R2
confirmed_reverse_type: design
status: draft
created: 2026-08-27
updated: 2026-08-27
owner: Codex / Luna
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: required
backprop_decision_reason: "remote publicationのbounded実装で判明するidentity/CAS/partial境界を上位契約へ戻す。"
parent_design: docs/plans/PLAN-L7-519-pack-publication-adapter.md
pair_artifact: docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
github_issue_id: 414
agent_slots:
  - role: tl
    slot_label: "TL - L6 publication contract linkage"
  - role: qa
    slot_label: "QA - independent remote-write oracle"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-519-pack-publication-adapter-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-519-pack-publication-adapter.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
    - src/setup/pack-publication-adapter.ts
    - tests/pack-publication-adapter.test.ts
review_evidence: []
---

# PLAN-REVERSE-519

## R0 / R1

`PLAN-L6-63` の `planned → pack_commit → release_draft → assets → tag → release_visible → canary` を
正本として、local staging の sealed result から remote adapter へ降下した。manifest-v2、release identity、
asset bytes の再実装は行わず、adapter は pure domain と注入 GitHub/Pack port に限定する。

## R2 backfill

intent の expected tree / sidecar / source revision / release identity / allowed merge mode、transition
approval、nonce、before-state CAS、append-only execution journal、partial/indeterminate fail-close を、
専用 test-design の各 oracle と forward PLAN に束ねる。未生成 commit SHA の事前 seal、direct push、tag
retarget、asset overwrite、pointer の snapshot 外書込みは認めない。初期 drift と late pointer drift を
分離し、ambiguity 後の後続 write をゼロにする。

## Backprop boundary

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | bounded internal canary のみで、stable/consumer受入を変更しない。 |
| L4/L5 | not_impacted | 新しい外部SDK、永続schema、CLI、Pack checkout依存を導入しない。 |
| L6 | updated | approval、CAS、nonce、identity、partial/indeterminate境界を実装結果へ束縛する。 |
| L7 test design | updated | `U-PACKPUB-REMOTE-*` の独立 write-count/reason oracle を追加する。 |

R3/R4 は non-author review、CI、同一 exact HEAD の evidence が揃うまで未完了とし、remote mutation は別の
human-approved execution へ残す。
