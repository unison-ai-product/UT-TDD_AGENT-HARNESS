---
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/gate-confirm.md
issue: 1032
---

# gate-confirm のテスト設計

### §1.18 U-GCONF (gate-confirm coupling lint、PLAN-L7-18 / IMP-079)

> ペア = `gate-confirm.md`。gate-design §2 台帳と design/test-design doc `status: confirmed` の coupling を検査する。parse 失敗を含む不整合は fail-close。

| Test ID | 対象 | 期待 |
|---|---|---|
| U-GCONF-001 | `parseGateStatuses` | gate table から G/L/status/PASS を抽出 |
| U-GCONF-002 | `layerToGate` | `L5 -> G5`、非 layer は null |
| U-GCONF-003 | `analyzeGateConfirm` | gate park の layer に confirmed doc → violation |
| U-GCONF-004 | `analyzeGateConfirm` | gate PASS の layer に confirmed doc → ok |
| U-GCONF-005 | `analyzeGateConfirm` | gate table parse 失敗 → `ok=false` + `violation` (fail-close) |
| U-GCONF-006 | `analyzeGateConfirm` | draft doc は対象外 |
