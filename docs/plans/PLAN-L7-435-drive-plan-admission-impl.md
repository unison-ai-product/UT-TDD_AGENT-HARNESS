---
plan_id: PLAN-L7-435-drive-plan-admission-impl
title: "PLAN-L7-435 (add-impl): 駆動モデル準拠PLAN Admission実装"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-83-drive-plan-admission-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - Admission policy・draft command・receipt・tamper fence"
  - role: qa
    slot_label: "QA - tuple/property/mutation/atomicity/CLI oracle"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
    artifact_type: markdown_doc
  - artifact_path: src/plan-admission/policy.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/diff-fence.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L6-83-drive-plan-admission-contract.md
  requires: []
  references:
    - docs/plans/PLAN-L6-83-drive-plan-admission-contract.md
  blocks: []
---

# PLAN-L7-435: 駆動モデル準拠PLAN Admission実装

## 実装範囲

`PlanAdmissionPolicy`をpure domain/application境界に置き、`ut-tdd plan draft`、PLAN lint、
branch-kind、hook/pre-push/CIが同じ許可tupleを読む。detectorはこの表を生成せず、許可tuple以外を
Admission candidateに昇格させない。

`transition_direction`をmode判定の正本とする。`reverse`は`implementation_to_design`だけを許可し、
`実装 → Reverse → Forward合流`を記録する。`redesign`は`design_to_implementation`だけを許可し、
起点証拠、対象設計の差替え（`supersedes`）、Forward合流先、合流後に実装するPLANを同一receiptに
束縛する。先行実装の保存/廃棄は補助証跡であり、両者を混用してmodeを選ばない。

CLIは `validate → journal intent → reserve/ledger → temp write/fsync/rename → journal commit` を一つの
Sagaとして扱う。failure injection、replay、concurrent reservation、temp rename失敗を含め、通常失敗時に
authoring sourceとprojectionが部分更新されないこと、強制終了時には未完journalをfail-closeして次回recovery
まで正本扱いしないことを証明する。SQLiteとGit管理Markdownを単一transactionと偽装しない。

## AC

- [ ] unknown signalのForward fallbackをauthoring入口で廃止する。
- [ ] Incident等の相関tuple、Forward/escapeのIssue policy、origin/reentry、pairingを同一policyで判定する。
- [ ] direct PLAN editとreceipt staleをhook/pre-push/CIでfail-closeする。
- [ ] `U-PADM-*` / property / mutation / CLI実行がGreenとなり、Red oracle候補を実装oracleへ昇格する。
- [ ] REVERSE-435で実装観測をL4-L6/L7 test-designへgap-only backfillする。
