---
plan_id: PLAN-REVERSE-493-d3a-repo-local-verdict-custody-backfill
title: "PLAN-REVERSE-493: D3a repo-local verdict custody の上流合流"
kind: reverse
layer: cross
drive: be
workflow_phase: R0
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-18
updated: 2026-08-18
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - repo-local custodyで確定した identity / sandbox 境界の上流契約反映判定"
  - role: qa
    slot_label: "QA - receipt projection と L6 cross-review契約の差分だけを検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-493-d3a-repo-local-verdict-custody-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-94-cross-review-session-attestation.md
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/328
review_evidence: []
---

# PLAN-REVERSE-493: D3a repo-local verdict custody の上流合流

## 1. R0 予約

PLAN-L7-493 は、既存の D3a request / attestation / receipt 契約を変更せず、実 provider sandbox で成立する verdict evidence の物理配置と identity binding を追加する。R0 では、L7 実装がまだ存在しないため、上流契約へ反映済みとは主張しない。

## 2. backfill 対象

実装完了後に、次の差分だけを `PLAN-L6-94-cross-review-session-attestation.md` と必要な上流設計へ戻す。

- RFC 8785相当の canonical identity (`review-request/v1` / `memoryId` / `pr` / `exactHead` /
  `authorFamily`) から64桁 lowercase `requestDigest`を導出し、`reviewRevision=rv1-<requestDigest>`へ束縛すること。
- consumer が canonical request から verdict path を導出し、reviewer の path 自己申告を受けないこと。
- repo-local gitignored runtime pathをsandboxの唯一の書込先とし、`.gitignore`のverdicts限定rule、review-guardの
  projection、volatile fence境界、外部path / symlink escape拒否を一体で戻すこと。
- verdict envelope の request digest、exact HEAD、review revision、provider/model、nonce と実 spawn facts の照合。
- 既存 `U-RVATT-010` のrepo外 assertionを同じIDのrepo-local契約へ改訂し、`isOutsideRepo`を外部拒否predicateへ
  転用した correction note を残すこと。
- receipt 前の削除を拒否し、receipt 後 cleanup failure を `.ut-tdd/audit/review-custody.jsonl` の
  `cleanup_pending` typed event として扱うこと。
- receipt 前の model / effort escalation は digest を変えず、consumer 採番の次 attemptへ分離すること。
  `superseded_attempt` の監査記録、最新 attempt の単一選択、receipt 後の attempt 作成拒否を上流の retry 契約へ戻すこと。

R1 以降は、実装 PR の exact HEAD、U-RVATT-030〜036、Linux / Windows provider実測、receipt / wrapper E2Eを根拠に、既存 L6 契約へ戻す必要がある差分だけを記録する。未実測の方式、実装予定、PASS claimをこの Reverse PLANへ先に書かない。

## 3. 非対象

- D2 merge gate の bypass、手動merge、stdout-only verdict。
- #335 PF-5 aggregate admission の契約・実装。
- provider family の再設計、GitHub API projection、別 memory store。

本 PLAN は PLAN-L7-493 と対になる Reverse backfill 予約であり、R0の設計レビューと実装後のR1〜R4を混同しない。
