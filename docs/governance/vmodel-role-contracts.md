---
title: "Vモデル role delegation contract 正本"
status: confirmed
owner: PO / TL
updated: 2026-07-13
---

# Vモデル role delegation contract 正本

## 1. 目的

`agent_slots[].role`を単なるラベルで終わらせず、各委譲roleが判断・実行時に従う設計実体へ結ぶ。
PLAN固有の`slot_label`は作業責務を保持し、本表はrole共通のauthority/quality boundaryを与える。

## 2. 機械可読contract

```yaml
role_contracts:
  po: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  tl: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
  qa: docs/test-design/harness/L7-unit-test-design.md
  aim: docs/process/modes/README.md
  uiux: docs/design/harness/L4-basic-design/ui-standard.md
  se: docs/governance/coding-rules.md
  docs: docs/governance/document-system-map.md
```

## 3. 不変条件

- `VALID_ROLES` 7種とcontract keyは全単射とする。
- contract targetはHEADにtrackedされた非空fileでなければならない。
- migration projectionは既存`role + slot_label`を保持し、role contractを追加する。slotを削除しない。
- PLAN固有の設計先が必要な場合は将来のtyped overrideを追加し、label文字列から推測しない。
