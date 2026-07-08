---
title: "Vモデル agent contract 正本"
status: confirmed
owner: PO / TL
updated: 2026-07-08
---

# Vモデル agent contract 正本

## 0. 役割

本書は `Vモデル設計ドキュメント.zip` の各 doc にある `agent.defines` / `agent.read_first` /
`agent.done_when` を、HARNESS の authoring source 契約へ翻訳した正本である。

ZIP の `python tools/build.py detect` green 条件は、HARNESS では Python runtime の移植ではなく
`doctor:<gate-id>` の green 条件へ変換する。DB は正本ではない。本書を `agent_contracts` へ投影し、
read_first / done_when の欠落や gate 未定義を doctor が検出する。

## 1. agent contract 宣言

```yaml
agent_contracts:
  - contract_id: VAGENT-001
    target_path: docs/governance/vmodel-upgrade-schedule.md
    defines: [VMS-002]
    read_first:
      - docs/governance/vmodel-typed-spec-definitions.md
      - docs/governance/vmodel-activation-profiles.md
    done_when:
      - doctor:plan-schedule
      - doctor:db-currency
  - contract_id: VAGENT-002
    target_path: docs/governance/vmodel-typed-spec-definitions.md
    defines: [VMS-004, VMS-007, VMS-008, VMS-009]
    read_first:
      - docs/governance/vmodel-upgrade-schedule.md
      - docs/test-design/harness/L7-unit-test-design.md
    done_when:
      - doctor:typed-spec-trace-closure
      - doctor:typed-spec-ledger-body-sync
      - doctor:typed-spec-owned-artifact-dispersal
      - doctor:typed-spec-phase-layer-alignment
  - contract_id: VAGENT-003
    target_path: docs/governance/vmodel-activation-profiles.md
    defines: [VMS-003]
    read_first:
      - docs/governance/vmodel-upgrade-schedule.md
    done_when:
      - doctor:db-projection-ingestion
  - contract_id: VAGENT-004
    target_path: docs/design/harness/L6-function-design/function-spec.md
    defines: [VMS-008, VMS-009]
    read_first:
      - docs/governance/vmodel-agent-contracts.md
      - docs/governance/vmodel-typed-spec-definitions.md
      - docs/governance/vmodel-upgrade-schedule.md
    done_when:
      - doctor:agent-contract-detection
      - doctor:l6-completion
```

## 2. 解釈規則

- `contract_id` は `VAGENT-*` とする。
- `target_path` は契約を持つ authoring source の path である。
- `defines` は target が所有する typed spec ID である。
- `read_first` は編集前に読むべき repository-owned artifact である。
- `done_when` は HARNESS 上の `doctor:<gate-id>` で表す。ZIP の `detect green` はこの gate 群の green に翻訳する。

## 3. 不変条件

- DB projection は `agent_contracts` row を作るだけで、本書や target artifact を更新しない。
- `read_first` の存在しない path、空の `defines`、空の `done_when`、未知 doctor gate は finding にする。
- `done_when` は Python command 文字列を正本にしない。HARNESS の gate ID へ翻訳された構造契約だけを読む。
