---
plan_id: PLAN-L4-16-security-design-slot
title: "PLAN-L4-16 (add-design): セキュリティ設計 slot の定義と L4 設計起票"
kind: add-design
layer: L4
sub_doc: security
drive: fullstack
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-09
owner: PM / PO
parent_design: docs/design/harness/L1-requirements/nfr.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T15:30:00+09:00"
    tests_green_at: "2026-07-09T15:30:00+09:00"
    verdict: approve
    scope: "PLAN-L4-16。security sub_doc を L4 正本 slot として schema / 要件 / document catalog / scale profile / L4 body へ登録し、PLAN-L6-62 の上流前提を解凍した。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T15:30:00+09:00"
        evidence_path: docs/design/harness/L4-basic-design/security.md
        output_digest: "sha256:477d6a39aae8f7555ddb8d50580f5d4cc000968544b30e534c9c3510681ea527"
agent_slots:
  - role: po
    slot_label: "PO - security slot 新設の採否 (document-system-map + VALID_SUB_DOCS 拡張)"
  - role: tl
    slot_label: "TL - 脅威モデル/DevSecOps 設計の構成案"
generates:
  - artifact_path: docs/plans/PLAN-L4-16-security-design-slot.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/security.md
    artifact_type: design_doc
  - artifact_path: src/schema/index.ts
    artifact_type: source_module
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/document-system-map.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-document-catalog.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-document-scale-profiles.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L6-62-design-doc-secret-scan-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-02-architecture.md
  requires: []
  references:
    - .ut-tdd/audit/A-174-forward-design-test-pair-audit-2026-07-02.md
    - docs/governance/document-system-map.md
---

# PLAN-L4-16 (design): セキュリティ設計 slot の定義と L4 設計起票

## Status

confirmed (2026-07-09)。`security` は L4 sub_doc として採択し、`docs/design/harness/L4-basic-design/security.md`
を正本 body とする。document-system-map / VALID_SUB_DOCS / requirements mirror / document catalog / scale profile を同期した。

## 背景 (A-174 F-4)

NFR-17 (セキュリティ) は L1 nfr.md で親宣言され「詳細は L4 方式設計 sub-doc で確定」と明記されるが、L4 に security の独立節/sub-doc slot が無く ADR 参照のみ。escalation gate (auth/PII/破壊操作) を製品機能として持つハーネスとして、脅威モデル/DevSecOps 設計の置き場が未定義。ロギング/可観測性の横断方針 (何をいつどの粒度で記録するか) も部分被覆。

## スコープ

1. security slot の新設判断 (PO): document-system-map §1b + VALID_SUB_DOCS[L4] へ `security` を追加する。
2. 採択方式で L4 security 設計 (脅威モデル・escalation 境界・秘密情報取扱) を起票・記述する。
3. V-pair: L4 基本設計として L9 system-test-design へ接続し、docs 横断 secret-scan は L6-62 で L7 oracle へ降下する。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | slot 方式決定 (PO gate): L4 `security` sub_doc として採択 | 完了 |
| 2 | L4 security 設計本文の起票 | 完了 |
| 3 | pair test-design 接続 + doctor green | 完了 |

## DoD

- [x] NFR-17 の L4 降下先が実在し descent-obligation が接続を認識
- [x] security 設計に対応する右腕 (test-design) 参照が存在

## Design Freeze Result (2026-07-09)

`security` は L4 の正式 sub_doc とする。harness 自身は provider API key を保持せず、秘密情報は docs / plans /
audit / memory / DB projection / Pack 配布物へ混入させない。広域 docs secret-scan と配布前 fail-close は
`PLAN-L6-62` で L6 契約化する。
