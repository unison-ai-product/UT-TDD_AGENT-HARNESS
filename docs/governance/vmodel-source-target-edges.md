---
title: "checked Vモデル source→HARNESS target edge正本"
status: draft
owner: PO / TL
updated: 2026-07-10
typed_spec_phase_owner: L4
---

# checked Vモデル source→HARNESS target edge正本

## 1. 役割

source dispositionの採否判断と、HARNESS targetへのtyped edgeを分離する。1 sourceから複数targetへ降下する場合は
同じsource_idにedgeを追加する。`artifact_family` はdirectoryそのものを成果物とせず、family resolverが配下の
tracked target slotへ展開するための一時的な設計参照である。design freezeまでにfamilyのmemberを固定する。

## 2. edge

| `edge_id` | `source_id` | `disposition` | `target_type` | `target_ref` |
|---|---|---|---|---|
| `EDGE-001` | `ZIP-DOC-001` | `merge` | `plan_alias` | `PLAN-L0-01-vmodel-harness-upgrade-charter` |
| `EDGE-002` | `ZIP-DOC-002` | `merge` | `artifact_family` | `docs/design/harness/L1-requirements/` |
| `EDGE-003` | `ZIP-DOC-003` | `merge` | `artifact_family` | `docs/design/harness/L3-functional/` |
| `EDGE-004` | `ZIP-DOC-004` | `merge` | `artifact_family` | `docs/design/harness/L4-basic-design/` |
| `EDGE-005` | `ZIP-DOC-005` | `merge` | `artifact_family` | `docs/design/harness/L5-detailed-design/` |
| `EDGE-006` | `ZIP-DOC-006` | `merge` | `artifact_path` | `docs/test-design/harness/L7-unit-test-design.md` |
| `EDGE-007` | `ZIP-DOC-007` | `merge` | `artifact_path` | `docs/test-design/harness/L8-integration-test-design.md` |
| `EDGE-008` | `ZIP-DOC-008` | `merge` | `artifact_path` | `docs/test-design/harness/L9-system-test-design.md` |
| `EDGE-009` | `ZIP-DOC-009` | `merge` | `artifact_path` | `docs/test-design/harness/L12-acceptance-test-design.md` |
| `EDGE-010` | `ZIP-DOC-010` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/security.md` |
| `EDGE-011` | `ZIP-DOC-011` | `merge` | `artifact_path` | `docs/test-design/harness/L14-operational-test-design.md` |
| `EDGE-012` | `ZIP-DOC-012` | `adopt` | `artifact_path` | `docs/process/vmodel-contract.yaml` |
| `EDGE-013` | `ZIP-DOC-013` | `merge` | `artifact_path` | `docs/process/gates.md` |
| `EDGE-014` | `ZIP-DOC-014` | `merge` | `artifact_family` | `docs/adr/` |
| `EDGE-015` | `ZIP-DOC-015` | `merge` | `artifact_path` | `docs/governance/coding-rules.md` |
| `EDGE-016` | `ZIP-DOC-016` | `reference` | `target_slot` | `DOC-L4-BATCH` |
| `EDGE-017` | `ZIP-DOC-017` | `merge` | `artifact_path` | `docs/governance/vmodel-document-catalog.md` |
| `EDGE-018` | `ZIP-DOC-018` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/architecture.md` |
| `EDGE-019` | `ZIP-DOC-019` | `merge` | `artifact_path` | `docs/process/forward/overview.md` |
| `EDGE-020` | `ZIP-DOC-020` | `merge` | `artifact_path` | `docs/design/harness/L1-requirements/business-requirements.md` |
| `EDGE-021` | `ZIP-DOC-021` | `merge` | `artifact_family` | `docs/design/harness/L5-detailed-design/` |
| `EDGE-022` | `ZIP-DOC-022` | `merge` | `artifact_path` | `docs/design/harness/L5-detailed-design/physical-data.md` |
| `EDGE-023` | `ZIP-DOC-023` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/external-if.md` |
| `EDGE-024` | `ZIP-DOC-024` | `merge` | `artifact_path` | `docs/design/harness/L6-function-design/function-spec.md` |
| `EDGE-025` | `ZIP-DOC-025` | `reference` | `artifact_path` | `docs/governance/vmodel-document-catalog.md` |
| `EDGE-026` | `ZIP-DOC-026` | `reference` | `artifact_path` | `docs/governance/vmodel-document-catalog.md` |
| `EDGE-027` | `ZIP-DOC-027` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/data.md` |
| `EDGE-028` | `ZIP-DOC-028` | `merge` | `artifact_path` | `docs/process/vmodel-contract.yaml` |
| `EDGE-029` | `ZIP-DOC-029` | `merge` | `artifact_family` | `docs/design/harness/L3-functional/` |
| `EDGE-030` | `ZIP-DOC-030` | `adopt` | `artifact_path` | `docs/governance/document-system-map.md` |
| `EDGE-031` | `ZIP-DOC-031` | `merge` | `artifact_path` | `docs/design/harness/L5-detailed-design/module-decomposition.md` |
| `EDGE-032` | `ZIP-DOC-032` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/architecture.md` |
| `EDGE-033` | `ZIP-DOC-033` | `merge` | `artifact_path` | `docs/process/plan-asset-v2.md` |
| `EDGE-034` | `ZIP-DOC-034` | `merge` | `artifact_path` | `docs/test-design/harness/L14-operational-test-design.md` |
| `EDGE-035` | `ZIP-DOC-035` | `reference` | `artifact_path` | `docs/governance/vmodel-document-catalog.md` |
| `EDGE-036` | `ZIP-DOC-036` | `reference` | `artifact_path` | `docs/design/harness/L4-basic-design/security.md` |
| `EDGE-037` | `ZIP-DOC-037` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/ui-standard.md` |
| `EDGE-038` | `ZIP-DOC-038` | `merge` | `artifact_path` | `docs/process/gates.md` |
| `EDGE-039` | `ZIP-DOC-039` | `merge` | `artifact_path` | `docs/design/harness/L5-detailed-design/physical-data.md` |
| `EDGE-040` | `ZIP-DOC-040` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/architecture.md` |
| `EDGE-041` | `ZIP-DOC-041` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/ui-standard.md` |
| `EDGE-042` | `ZIP-DOC-042` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/external-if.md` |
| `EDGE-043` | `ZIP-DOC-043` | `merge` | `artifact_path` | `docs/design/harness/L3-functional/functional-requirements.md` |
| `EDGE-044` | `ZIP-DOC-044` | `merge` | `artifact_path` | `docs/governance/document-system-map.md` |
| `EDGE-045` | `ZIP-DOC-045` | `merge` | `artifact_path` | `AGENTS.md` |
| `EDGE-046` | `ZIP-DOC-046` | `reference` | `target_slot` | `DOC-L4-UI-STANDARD` |
| `EDGE-047` | `ZIP-DOC-047` | `merge` | `artifact_path` | `docs/process/gates.md` |
| `EDGE-048` | `ZIP-DOC-048` | `merge` | `artifact_path` | `docs/governance/document-system-map.md` |
| `EDGE-049` | `ZIP-DOC-049` | `merge` | `artifact_path` | `docs/process/vmodel-contract.yaml` |
| `EDGE-050` | `ZIP-DOC-050` | `merge` | `artifact_family` | `docs/design/harness/L6-function-design/` |
| `EDGE-051` | `ZIP-DOC-051` | `merge` | `artifact_path` | `docs/test-design/harness/L10-ux-validation-test-design.md` |
| `EDGE-052` | `ZIP-DOC-052` | `merge` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-053` | `ZIP-DOC-053` | `merge` | `artifact_family` | `docs/process/modes/` |
| `EDGE-054` | `ZIP-DOC-054` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-055` | `ZIP-DOC-055` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-056` | `ZIP-DOC-056` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/security.md` |
| `EDGE-057` | `ZIP-DOC-057` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/security.md` |
| `EDGE-058` | `ZIP-DOC-058` | `merge` | `artifact_path` | `docs/design/harness/L1-requirements/nfr.md` |
| `EDGE-059` | `ZIP-DOC-059` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-060` | `ZIP-DOC-060` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/architecture.md` |
| `EDGE-061` | `ZIP-DOC-061` | `merge` | `artifact_path` | `docs/process/gates.md` |
| `EDGE-062` | `ZIP-DOC-062` | `merge` | `artifact_path` | `docs/test-design/harness/L14-operational-test-design.md` |
| `EDGE-063` | `ZIP-DOC-063` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-064` | `ZIP-DOC-064` | `merge` | `artifact_path` | `docs/design/harness/L1-requirements/nfr.md` |
| `EDGE-065` | `ZIP-DOC-065` | `merge` | `artifact_path` | `docs/test-design/harness/L14-operational-test-design.md` |
| `EDGE-066` | `ZIP-DOC-066` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-067` | `ZIP-DOC-067` | `reference` | `artifact_path` | `docs/design/harness/L4-basic-design/security.md` |
| `EDGE-068` | `ZIP-DOC-068` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-069` | `ZIP-DOC-069` | `merge` | `artifact_path` | `docs/design/harness/L1-requirements/nfr.md` |
| `EDGE-070` | `ZIP-DOC-070` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/architecture.md` |
| `EDGE-071` | `ZIP-DOC-071` | `merge` | `plan_alias` | `PLAN-L0-01-vmodel-harness-upgrade-charter` |
| `EDGE-072` | `ZIP-DOC-072` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/ui-standard.md` |
| `EDGE-073` | `ZIP-DOC-073` | `reference` | `target_slot` | `DOC-L4-UI-STANDARD` |
| `EDGE-074` | `ZIP-DOC-074` | `reference` | `target_slot` | `DOC-L4-UI-STANDARD` |
| `EDGE-075` | `ZIP-DOC-075` | `reference` | `target_slot` | `DOC-L4-SECURITY` |
| `EDGE-076` | `ZIP-DOC-076` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-077` | `ZIP-DOC-077` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-078` | `ZIP-DOC-078` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-079` | `ZIP-DOC-079` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-080` | `ZIP-DOC-080` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-081` | `ZIP-DOC-081` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-082` | `ZIP-DOC-082` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-083` | `ZIP-DOC-083` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-084` | `ZIP-DOC-084` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-085` | `ZIP-DOC-085` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-086` | `ZIP-DOC-086` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-087` | `ZIP-DOC-087` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-088` | `ZIP-DOC-088` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/external-if.md` |
| `EDGE-089` | `ZIP-DOC-089` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/external-if.md` |
| `EDGE-090` | `ZIP-DOC-090` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/external-if.md` |
| `EDGE-091` | `ZIP-DOC-091` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/external-if.md` |
| `EDGE-092` | `ZIP-DOC-092` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-093` | `ZIP-DOC-093` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-094` | `ZIP-DOC-094` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/data.md` |
| `EDGE-095` | `ZIP-DOC-095` | `merge` | `artifact_path` | `docs/governance/coding-rules.md` |
| `EDGE-096` | `ZIP-DOC-096` | `merge` | `artifact_path` | `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` |
| `EDGE-097` | `ZIP-DOC-097` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/data.md` |
| `EDGE-098` | `ZIP-DOC-098` | `merge` | `artifact_path` | `docs/process/vmodel-contract.yaml` |
| `EDGE-099` | `ZIP-DOC-099` | `merge` | `artifact_path` | `docs/design/harness/L4-basic-design/data.md` |
| `EDGE-100` | `ZIP-DOC-100` | `reference` | `artifact_path` | `docs/governance/vmodel-document-scale-profiles.md` |
| `EDGE-101` | `ZIP-DOC-101` | `merge` | `artifact_path` | `docs/test-design/harness/L9-system-test-design.md` |
| `EDGE-102` | `ZIP-DOC-102` | `merge` | `artifact_path` | `docs/test-design/harness/L9-system-test-design.md` |
| `EDGE-103` | `ZIP-DOC-103` | `merge` | `artifact_path` | `docs/governance/vmodel-upgrade-schedule.md` |
| `EDGE-104` | `ZIP-DOC-104` | `merge` | `artifact_path` | `docs/design/harness/L5-detailed-design/physical-data.md` |
| `EDGE-105` | `ZIP-DOC-105` | `merge` | `artifact_path` | `docs/design/harness/L5-detailed-design/physical-data.md` |
| `EDGE-106` | `ZIP-DOC-106` | `reference` | `artifact_path` | `docs/governance/coding-rules.md` |
| `EDGE-107` | `ZIP-DOC-107` | `merge` | `artifact_path` | `docs/process/vmodel-contract.yaml` |
| `EDGE-108` | `ZIP-DOC-108` | `merge` | `artifact_path` | `docs/process/modes/refactor.md` |
| `EDGE-109` | `ZIP-DOC-109` | `merge` | `artifact_path` | `docs/process/gates.md` |

## 3. 不変条件

- edge_idは一意、source_idは109 source dispositionへ解決する。
- target_typeは `target_slot|artifact_path|artifact_family|plan_alias` のみとする。
- artifact_pathはtracked file、target_slotはtarget catalog、plan_aliasはPLAN registryへ解決する。
- artifact_familyはmember 1件以上を持ち、design freeze時に未解決familyを残さない。
- source→targetは1:Nを許すが、理由なし0 edgeは許さない。
