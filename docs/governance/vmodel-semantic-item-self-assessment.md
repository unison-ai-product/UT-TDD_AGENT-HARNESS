---
title: "Vモデル semantic item HARNESS自己適合台帳"
status: draft
owner: PO / TL
updated: 2026-07-10
typed_spec_phase_owner: L4
---

# Vモデル semantic item HARNESS自己適合台帳

## 1. 状態

本台帳は初期inventoryであり、163件を意図的に`pending_review`で開始する。target候補の存在は正しさの証明ではない。
PLAN-L4-27に従い、意味契約、実装、test/evidenceを検収した後だけ状態を更新する。

## 2. 自己適合評価

| `item_id` | `source_ref` | `applicability_review` | `target_candidate` | `state` | `evidence_refs` | `debt_plan_id` |
|---|---|---|---|---|---|---|
| `qa_checklist` | `ZIP-DOC-109` | `core_review` | `artifact_path:docs/process/gates.md` | `pending_review` |  |  |
| `refactoring` | `ZIP-DOC-108` | `core_review` | `artifact_path:docs/process/modes/refactor.md` | `pending_review` |  |  |
| `kikaku` | `ZIP-DOC-001` | `core_review` | `plan_alias:PLAN-L0-01-vmodel-harness-upgrade-charter` | `pending_review` |  |  |
| `youkyu` | `ZIP-DOC-002` | `core_review` | `artifact_family:docs/design/harness/L1-requirements/` | `pending_review` |  |  |
| `poc` | `ZIP-DOC-053` | `core_review` | `artifact_family:docs/process/modes/` | `pending_review` |  |  |
| `youken` | `ZIP-DOC-003` | `core_review` | `artifact_family:docs/design/harness/L3-functional/` | `pending_review` |  |  |
| `usecase_list` | `ZIP-DOC-002` | `core_review` | `artifact_family:docs/design/harness/L1-requirements/` | `pending_review` |  |  |
| `screen_req` | `ZIP-DOC-002` | `core_review` | `artifact_family:docs/design/harness/L1-requirements/` | `pending_review` |  |  |
| `req_register` | `ZIP-DOC-043` | `core_review` | `artifact_path:docs/design/harness/L3-functional/functional-requirements.md` | `pending_review` |  |  |
| `sysconf` | `ZIP-DOC-004` | `core_review` | `artifact_family:docs/design/harness/L4-basic-design/` | `pending_review` |  |  |
| `tenant` | `ZIP-DOC-004` | `core_review` | `artifact_family:docs/design/harness/L4-basic-design/` | `pending_review` |  |  |
| `func_list` | `ZIP-DOC-004` | `core_review` | `artifact_family:docs/design/harness/L4-basic-design/` | `pending_review` |  |  |
| `screen_list` | `ZIP-DOC-004` | `core_review` | `artifact_family:docs/design/harness/L4-basic-design/` | `pending_review` |  |  |
| `api_list` | `ZIP-DOC-004` | `core_review` | `artifact_family:docs/design/harness/L4-basic-design/` | `pending_review` |  |  |
| `crud` | `ZIP-DOC-004` | `core_review` | `artifact_family:docs/design/harness/L4-basic-design/` | `pending_review` |  |  |
| `func_detail` | `ZIP-DOC-005` | `core_review` | `artifact_family:docs/design/harness/L5-detailed-design/` | `pending_review` |  |  |
| `screen_spec` | `ZIP-DOC-005` | `core_review` | `artifact_family:docs/design/harness/L5-detailed-design/` | `pending_review` |  |  |
| `label_list` | `ZIP-DOC-017` | `core_review` | `artifact_path:docs/governance/vmodel-document-catalog.md` | `pending_review` |  |  |
| `msg_list` | `ZIP-DOC-005` | `core_review` | `artifact_family:docs/design/harness/L5-detailed-design/` | `pending_review` |  |  |
| `code_list` | `ZIP-DOC-017` | `core_review` | `artifact_path:docs/governance/vmodel-document-catalog.md` | `pending_review` |  |  |
| `mail` | `ZIP-DOC-017` | `core_review` | `artifact_path:docs/governance/vmodel-document-catalog.md` | `pending_review` |  |  |
| `file_spec` | `ZIP-DOC-017` | `core_review` | `artifact_path:docs/governance/vmodel-document-catalog.md` | `pending_review` |  |  |
| `report_spec` | `ZIP-DOC-017` | `core_review` | `artifact_path:docs/governance/vmodel-document-catalog.md` | `pending_review` |  |  |
| `extif_spec` | `ZIP-DOC-017` | `core_review` | `artifact_path:docs/governance/vmodel-document-catalog.md` | `pending_review` |  |  |
| `integration` | `ZIP-DOC-042` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/external-if.md` | `pending_review` |  |  |
| `batch_spec` | `ZIP-DOC-016` | `core_review` | `target_slot:DOC-L4-BATCH` | `pending_review` |  |  |
| `workflow` | `ZIP-DOC-019` | `core_review` | `artifact_path:docs/process/forward/overview.md` | `pending_review` |  |  |
| `data_item` | `ZIP-DOC-003` | `core_review` | `artifact_family:docs/design/harness/L3-functional/` | `pending_review` |  |  |
| `db_table` | `ZIP-DOC-005` | `core_review` | `artifact_family:docs/design/harness/L5-detailed-design/` | `pending_review` |  |  |
| `db_view` | `ZIP-DOC-017` | `core_review` | `artifact_path:docs/governance/vmodel-document-catalog.md` | `pending_review` |  |  |
| `db` | `ZIP-DOC-022` | `core_review` | `artifact_path:docs/design/harness/L5-detailed-design/physical-data.md` | `pending_review` |  |  |
| `io` | `ZIP-DOC-023` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/external-if.md` | `pending_review` |  |  |
| `display_catalog` | `ZIP-DOC-041` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/ui-standard.md` | `pending_review` |  |  |
| `i18n_resource` | `ZIP-DOC-041` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/ui-standard.md` | `pending_review` |  |  |
| `logic` | `ZIP-DOC-024` | `core_review` | `artifact_path:docs/design/harness/L6-function-design/function-spec.md` | `pending_review` |  |  |
| `network` | `ZIP-DOC-025` | `profile_review` | `artifact_path:docs/governance/vmodel-document-catalog.md` | `pending_review` |  |  |
| `server` | `ZIP-DOC-026` | `profile_review` | `artifact_path:docs/governance/vmodel-document-catalog.md` | `pending_review` |  |  |
| `directory` | `ZIP-DOC-045` | `profile_review` | `artifact_path:AGENTS.md` | `pending_review` |  |  |
| `seo` | `ZIP-DOC-046` | `core_review` | `target_slot:DOC-L4-UI-STANDARD` | `pending_review` |  |  |
| `support` | `ZIP-DOC-047` | `core_review` | `artifact_path:docs/process/gates.md` | `pending_review` |  |  |
| `user_docs` | `ZIP-DOC-048` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `ai_verification` | `ZIP-DOC-049` | `core_review` | `artifact_path:docs/process/vmodel-contract.yaml` | `pending_review` |  |  |
| `restart` | `ZIP-DOC-050` | `core_review` | `artifact_family:docs/design/harness/L6-function-design/` | `pending_review` |  |  |
| `ui_test` | `ZIP-DOC-051` | `core_review` | `artifact_path:docs/test-design/harness/L10-ux-validation-test-design.md` | `pending_review` |  |  |
| `d_escalation` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `domain` | `ZIP-DOC-027` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/data.md` | `pending_review` |  |  |
| `bounded_ctx` | `ZIP-DOC-027` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/data.md` | `pending_review` |  |  |
| `aggregate` | `ZIP-DOC-027` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/data.md` | `pending_review` |  |  |
| `domain_event` | `ZIP-DOC-027` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/data.md` | `pending_review` |  |  |
| `glossary` | `ZIP-DOC-030` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `components` | `ZIP-DOC-031` | `core_review` | `artifact_path:docs/design/harness/L5-detailed-design/module-decomposition.md` | `pending_review` |  |  |
| `externalization` | `ZIP-DOC-032` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/architecture.md` | `pending_review` |  |  |
| `linkage` | `ZIP-DOC-033` | `core_review` | `artifact_path:docs/process/plan-asset-v2.md` | `pending_review` |  |  |
| `verification` | `ZIP-DOC-028` | `core_review` | `artifact_path:docs/process/vmodel-contract.yaml` | `pending_review` |  |  |
| `test_tech` | `ZIP-DOC-028` | `core_review` | `artifact_path:docs/process/vmodel-contract.yaml` | `pending_review` |  |  |
| `test_data` | `ZIP-DOC-028` | `core_review` | `artifact_path:docs/process/vmodel-contract.yaml` | `pending_review` |  |  |
| `coverage_crit` | `ZIP-DOC-028` | `core_review` | `artifact_path:docs/process/vmodel-contract.yaml` | `pending_review` |  |  |
| `contract_test` | `ZIP-DOC-028` | `core_review` | `artifact_path:docs/process/vmodel-contract.yaml` | `pending_review` |  |  |
| `bdd` | `ZIP-DOC-029` | `core_review` | `artifact_family:docs/design/harness/L3-functional/` | `pending_review` |  |  |
| `features` | `ZIP-DOC-029` | `core_review` | `artifact_family:docs/design/harness/L3-functional/` | `pending_review` |  |  |
| `naming` | `ZIP-DOC-015` | `core_review` | `artifact_path:docs/governance/coding-rules.md` | `pending_review` |  |  |
| `coding` | `ZIP-DOC-015` | `core_review` | `artifact_path:docs/governance/coding-rules.md` | `pending_review` |  |  |
| `app_spec` | `ZIP-DOC-018` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/architecture.md` | `pending_review` |  |  |
| `security` | `ZIP-DOC-010` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/security.md` | `pending_review` |  |  |
| `authz` | `ZIP-DOC-010` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/security.md` | `pending_review` |  |  |
| `appsec` | `ZIP-DOC-010` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/security.md` | `pending_review` |  |  |
| `ops` | `ZIP-DOC-011` | `core_review` | `artifact_path:docs/test-design/harness/L14-operational-test-design.md` | `pending_review` |  |  |
| `measurement` | `ZIP-DOC-020` | `core_review` | `artifact_path:docs/design/harness/L1-requirements/business-requirements.md` | `pending_review` |  |  |
| `logging` | `ZIP-DOC-021` | `core_review` | `artifact_family:docs/design/harness/L5-detailed-design/` | `pending_review` |  |  |
| `migration` | `ZIP-DOC-013` | `core_review` | `artifact_path:docs/process/gates.md` | `pending_review` |  |  |
| `maintenance` | `ZIP-DOC-034` | `core_review` | `artifact_path:docs/test-design/harness/L14-operational-test-design.md` | `pending_review` |  |  |
| `dr_bcp` | `ZIP-DOC-035` | `core_review` | `artifact_path:docs/governance/vmodel-document-catalog.md` | `pending_review` |  |  |
| `cicd` | `ZIP-DOC-038` | `core_review` | `artifact_path:docs/process/gates.md` | `pending_review` |  |  |
| `privacy` | `ZIP-DOC-036` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/security.md` | `pending_review` |  |  |
| `i18n_a11y` | `ZIP-DOC-037` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/ui-standard.md` | `pending_review` |  |  |
| `event_schema` | `ZIP-DOC-039` | `core_review` | `artifact_path:docs/design/harness/L5-detailed-design/physical-data.md` | `pending_review` |  |  |
| `agent` | `ZIP-DOC-040` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/architecture.md` | `pending_review` |  |  |
| `agent_guard` | `ZIP-DOC-040` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/architecture.md` | `pending_review` |  |  |
| `env` | `ZIP-DOC-100` | `core_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `iac` | `NO-SOURCE` | `not_applicable_review` | `none` | `pending_review` |  |  |
| `test_plan` | `ZIP-DOC-012` | `core_review` | `artifact_path:docs/process/vmodel-contract.yaml` | `pending_review` |  |  |
| `ut` | `ZIP-DOC-006` | `core_review` | `artifact_path:docs/test-design/harness/L7-unit-test-design.md` | `pending_review` |  |  |
| `it` | `ZIP-DOC-007` | `core_review` | `artifact_path:docs/test-design/harness/L8-integration-test-design.md` | `pending_review` |  |  |
| `st` | `ZIP-DOC-008` | `core_review` | `artifact_path:docs/test-design/harness/L9-system-test-design.md` | `pending_review` |  |  |
| `at` | `ZIP-DOC-009` | `core_review` | `artifact_path:docs/test-design/harness/L12-acceptance-test-design.md` | `pending_review` |  |  |
| `perf` | `ZIP-DOC-101` | `core_review` | `artifact_path:docs/test-design/harness/L9-system-test-design.md` | `pending_review` |  |  |
| `sectest` | `ZIP-DOC-102` | `core_review` | `artifact_path:docs/test-design/harness/L9-system-test-design.md` | `pending_review` |  |  |
| `mgmt` | `ZIP-DOC-014` | `core_review` | `artifact_family:docs/adr/` | `pending_review` |  |  |
| `change` | `ZIP-DOC-014` | `core_review` | `artifact_family:docs/adr/` | `pending_review` |  |  |
| `wbs` | `ZIP-DOC-103` | `core_review` | `artifact_path:docs/governance/vmodel-upgrade-schedule.md` | `pending_review` |  |  |
| `trace` | `ZIP-DOC-033` | `core_review` | `artifact_path:docs/process/plan-asset-v2.md` | `pending_review` |  |  |
| `index_map` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `tailoring` | `ZIP-DOC-052` | `core_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `proj_plan` | `ZIP-DOC-103` | `core_review` | `artifact_path:docs/governance/vmodel-upgrade-schedule.md` | `pending_review` |  |  |
| `d_sysconf` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_screen` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_state` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_er` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_seq` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_comp` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_dfd` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_job` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_wire` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_usecase` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_activity` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_class` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_deploy` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_context` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_aggregate` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_ext` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_agent` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_cicd` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `d_artifactmap` | `ZIP-DOC-044` | `core_review` | `artifact_path:docs/governance/document-system-map.md` | `pending_review` |  |  |
| `billing` | `ZIP-DOC-054` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `tenant_lifecycle` | `ZIP-DOC-055` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `quota` | `ZIP-DOC-060` | `profile_review` | `artifact_path:docs/design/harness/L4-basic-design/architecture.md` | `pending_review` |  |  |
| `residency` | `ZIP-DOC-059` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `release_strategy` | `ZIP-DOC-061` | `core_review` | `artifact_path:docs/process/gates.md` | `pending_review` |  |  |
| `incident` | `ZIP-DOC-062` | `core_review` | `artifact_path:docs/test-design/harness/L14-operational-test-design.md` | `pending_review` |  |  |
| `capacity` | `ZIP-DOC-063` | `core_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `finops` | `ZIP-DOC-064` | `core_review` | `artifact_path:docs/design/harness/L1-requirements/nfr.md` | `pending_review` |  |  |
| `ops_manual` | `ZIP-DOC-065` | `core_review` | `artifact_path:docs/test-design/harness/L14-operational-test-design.md` | `pending_review` |  |  |
| `sla_catalog` | `ZIP-DOC-066` | `core_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `supplychain` | `ZIP-DOC-056` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/security.md` | `pending_review` |  |  |
| `keymgmt` | `ZIP-DOC-057` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/security.md` | `pending_review` |  |  |
| `identity_prov` | `ZIP-DOC-067` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/security.md` | `pending_review` |  |  |
| `compliance_map` | `ZIP-DOC-068` | `core_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `nfr_grid` | `ZIP-DOC-058` | `core_review` | `artifact_path:docs/design/harness/L1-requirements/nfr.md` | `pending_review` |  |  |
| `perf_design` | `ZIP-DOC-069` | `core_review` | `artifact_path:docs/design/harness/L1-requirements/nfr.md` | `pending_review` |  |  |
| `model_gov` | `ZIP-DOC-070` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/architecture.md` | `pending_review` |  |  |
| `sys_plan` | `ZIP-DOC-071` | `core_review` | `plan_alias:PLAN-L0-01-vmodel-harness-upgrade-charter` | `pending_review` |  |  |
| `fe_design` | `ZIP-DOC-072` | `profile_review` | `artifact_path:docs/design/harness/L4-basic-design/ui-standard.md` | `pending_review` |  |  |
| `browser_responsive` | `ZIP-DOC-073` | `profile_review` | `target_slot:DOC-L4-UI-STANDARD` | `pending_review` |  |  |
| `web_perf` | `ZIP-DOC-074` | `profile_review` | `target_slot:DOC-L4-UI-STANDARD` | `pending_review` |  |  |
| `web_session` | `ZIP-DOC-075` | `profile_review` | `target_slot:DOC-L4-SECURITY` | `pending_review` |  |  |
| `mobile_arch` | `ZIP-DOC-076` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `offline_sync` | `ZIP-DOC-077` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `push_perms` | `ZIP-DOC-078` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `app_dist` | `ZIP-DOC-079` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `mobile_sec` | `ZIP-DOC-080` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `device_compat` | `ZIP-DOC-081` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `desk_arch` | `ZIP-DOC-082` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `desk_pkg` | `ZIP-DOC-083` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `desk_update` | `ZIP-DOC-084` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `desk_sign` | `ZIP-DOC-085` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `desk_os` | `ZIP-DOC-086` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `desk_sec` | `ZIP-DOC-087` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `cli_arch` | `ZIP-DOC-088` | `profile_review` | `artifact_path:docs/design/harness/L4-basic-design/external-if.md` | `pending_review` |  |  |
| `cli_cfg` | `ZIP-DOC-089` | `profile_review` | `artifact_path:docs/design/harness/L4-basic-design/external-if.md` | `pending_review` |  |  |
| `cli_dist` | `ZIP-DOC-090` | `profile_review` | `artifact_path:docs/design/harness/L4-basic-design/external-if.md` | `pending_review` |  |  |
| `api_gov` | `ZIP-DOC-091` | `profile_review` | `artifact_path:docs/design/harness/L4-basic-design/external-if.md` | `pending_review` |  |  |
| `api_portal` | `ZIP-DOC-092` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `api_webhook` | `ZIP-DOC-093` | `profile_review` | `artifact_path:docs/governance/vmodel-document-scale-profiles.md` | `pending_review` |  |  |
| `domain_impl` | `ZIP-DOC-094` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/data.md` | `pending_review` |  |  |
| `method_rules` | `ZIP-DOC-095` | `core_review` | `artifact_path:docs/governance/coding-rules.md` | `pending_review` |  |  |
| `design_principles` | `ZIP-DOC-096` | `core_review` | `artifact_path:docs/governance/ut-tdd-agent-harness-concept_v3.1.md` | `pending_review` |  |  |
| `spec_driven` | `ZIP-DOC-097` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/data.md` | `pending_review` |  |  |
| `mesh_vmodel` | `ZIP-DOC-098` | `core_review` | `artifact_path:docs/process/vmodel-contract.yaml` | `pending_review` |  |  |
| `typed_spec` | `ZIP-DOC-099` | `core_review` | `artifact_path:docs/design/harness/L4-basic-design/data.md` | `pending_review` |  |  |
| `json_schema` | `ZIP-DOC-104` | `core_review` | `artifact_path:docs/design/harness/L5-detailed-design/physical-data.md` | `pending_review` |  |  |
| `persistence` | `ZIP-DOC-105` | `core_review` | `artifact_path:docs/design/harness/L5-detailed-design/physical-data.md` | `pending_review` |  |  |
| `codegen` | `ZIP-DOC-106` | `core_review` | `artifact_path:docs/governance/coding-rules.md` | `pending_review` |  |  |
| `vmodel_levels` | `ZIP-DOC-107` | `core_review` | `artifact_path:docs/process/vmodel-contract.yaml` | `pending_review` |  |  |

## 3. 不変条件

- 163 item exactly once、初期状態は全件`pending_review`でありcoverage greenへ含めない。
- `verified`にはdesign、implementation、test/evidenceの参照を必須とする。
- `partial|gap`には存在するdebt PLAN IDを必須とする。
- profile/非適用判断は理由とowner reviewを必須とする。
