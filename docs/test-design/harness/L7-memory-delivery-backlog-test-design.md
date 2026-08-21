---
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
plan_id: PLAN-L7-495-memory-delivery-backlog-visibility
---

# Claude memory配送backlog 可視化テスト設計

`PLAN-L7-495-memory-delivery-backlog-visibility` のL7単体テスト正本。
既存の`PLAN-L7-472`配送・claim・FIFO契約を再定義せず、publish後の配送成立性を
観測する境界だけを検証する。

| Oracle | 対象 | 正常/異常条件 |
| --- | --- | --- |
| U-MEMBACKLOG-001 | `summarizeUnclaimedInbox` current workspace | 未claim件数、最古entry、ageが返る |
| U-MEMBACKLOG-002 | `summarizeUnclaimedInbox` target mismatch | foreign targetを別件数として保持し、strict filterで消さない |
| U-MEMBACKLOG-003 | production generation marker観測 | current workspaceのv1 markerだけ`active`、fresh marker 0件は`session_absent`、foreign/legacy/破損markerは`unknown` |
| U-MEMBACKLOG-004 | `inspectClaudeMemoryWakeHook` | settings欠落/壊れ/Stop以外のみは`hook_missing`、Stop hookはconfigured |
| U-MEMBACKLOG-005 | `publishClaudeInboxEntry` audit | projection作成後も`deliveryState=pending`、`deliveryConfirmed=false` |
| U-MEMBACKLOG-006 | SessionStart rendering | age閾値超過を`inbox warning: age`として表示 |

## fail-close境界

- target workspaceが一致しないentryをcurrent workspaceの配送対象へ混ぜない。
- 受信session、Stop hook、claimを観測できない場合にdelivery成立と返さない。
- 監査jsonlのwarningを削除して「publish成功」をdelivery成功へ昇格する変更は、
  U-MEMBACKLOG-005で検出する。
