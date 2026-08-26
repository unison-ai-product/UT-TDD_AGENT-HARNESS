---
layer: L7
executed_at_layer: L7
artifact: test-design
status: confirmed
plan_id: PLAN-L7-511-managed-worktree-lifecycle
---

# Managed worktree lifecycle test design

| Oracle | 変異軸 | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-U-WTMAN-001` | owner/Issue/PLAN/TTL/pathを1軸ずつ欠落・逸脱 | Git create 0、typed deny |
| `CANDIDATE-U-WTMAN-002` | lease/planned/Git/inventory/activateを各段階でthrow | abort・lease release・cleanup handoffが残り、active孤児0 |
| `CANDIDATE-U-WTMAN-003` | ledger行改変、previous digest不一致、同revision競合 | replayをfail-closeし既存chain不変 |
| `CANDIDATE-U-WTMAN-004` | success/failure/cancel/timeout/parent-loss | terminalとcleanup handoffが同じoperationへ束縛 |
| `CANDIDATE-U-WTMAN-005` | owner一致/不一致、active status、session Stop | foreign ownerはrelease 0、正規ownerはterminal handoff |
| `CANDIDATE-U-WTMAN-006` | TTL満了、ledger外のregistered worktree | doctorがexpired/unmanaged件数をwarningとして投影 |
| `CANDIDATE-P-WTMAN-001` | 同一common-dirの2 worktree / 別repository | 同一projectだけledger共有、別project read 0 |

物理削除oracleは#426に属し、本設計ではGit登録やworktree bytesを削除しない。
