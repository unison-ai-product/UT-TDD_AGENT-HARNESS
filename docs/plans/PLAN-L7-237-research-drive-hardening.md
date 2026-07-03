---
plan_id: PLAN-L7-237-research-drive-hardening
title: "PLAN-L7-237 (impl): research 第二 exit の機械完結 (routing 素通り防止 + route eval 整合 + 承認 policy)"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/process/modes/research.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - route eval 整合 + audit-finding routing 接続 gate"
  - role: po
    slot_label: "PO - route 承認 policy (required_approvers) の定義"
generates:
  - artifact_path: docs/plans/PLAN-L7-237-research-drive-hardening.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-156-research-recovery-finding-route-ledger.md
    - src/workflow/routing-contracts.ts
    - src/cli.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-237 (impl): research 第二 exit の機械完結

## Status

draft 起票 (PO /goal 2026-07-02、A-172 実走 dogfood 3 所見)。

## 背景 (A-156 dogfood 所見 2026-07-02)

1. **第二 exit が機械強制されていない**: finding 入り audit doc を記録・commit しても routing 未実施のまま素通り可能 (実証済み)。ledger / route-approval.jsonl 未接続でも doctor は沈黙 = absence-blindness の再発形。
2. **route eval の入力矛盾が素通り**: `--signal` は required だが `--finding-type` 指定時は routing に使われず、矛盾組 (code_smell + premise-gap) が mode=recovery を返す。A-156 対応表 (finding_type→route_signal) が CLI 側で解決されない。
3. **approval_status=policy_missing**: required_approvers が空定義のため recovery route の承認が常に blocked。「人間承認して起票」の正規動線が audit 上完結しない。

## スコープ

1. audit doc の finding → route ledger 接続を surface する gate (新規 audit doc に findings 節があり routing 記録が無い場合に doctor が warn/fail)。
2. `route eval` の finding_type → signal 自動解決 (対応表の CLI 内蔵) + 矛盾組の reject。
3. route 承認 policy の定義 (required_approvers、PO 判断) と承認記録の audit 完結。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | finding_type→signal 自動解決 + 矛盾 reject | 直列 |
| 2 | audit-finding routing 接続 gate | 1 と並列 |
| 3 | 承認 policy 定義 (PO gate) + 動線 end-to-end test | 直列 |

## DoD

- [ ] 矛盾 signal/finding-type 組が exit 1 (test 固定)
- [ ] routing 未接続の finding 入り audit doc を doctor が surface
- [ ] recovery route の承認が policy_missing 以外で完結する実証跡
