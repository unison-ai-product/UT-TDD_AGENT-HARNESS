---
layer: L7
executed_at_layer: L7
artifact: test-design
status: draft
plan_id: PLAN-L7-513-worktree-lifecycle-application
---

# Worktree lifecycle application test design

`PLAN-L7-501` の domain FSMを正本として、applicationの side-effect ordering、補償、terminal handoff、path入力を
RED oracleへ固定する。全ケースは同一 lifecycle identity / attemptを使い、candidateはdocs-only freeze時点で未実装のままとする。

| Oracle | 変異軸 / Given・When | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-U-WTAPP-001` | owner、Issue、PLAN ID / revision、TTL、branch、parent、pathを各1軸で欠落・空・不正にする | validationで fail-closeし、`reservePath`、plan、create、observe、activate、cleanup side effectを全て0。typed denyを返す |
| `CANDIDATE-U-WTAPP-002` | 正常系、および `reservePath` / `plan` / `create` / `observe` / `activate` を各1軸でthrowする | 正常系は `reservePath → plan → create → observe → activate` を一度ずつ実行。faultはprimary errorを保持し、同じidentity / attemptのactivation-abort、lease release、cleanup handoffを記録する。 |
| `CANDIDATE-U-WTAPP-003` | releasePathをthrowさせる、またはrelease receiptを欠落・別identity・別attemptにする | release errorでprimary errorを置換せず、補償失敗をtyped faultとして保持。abort / cleanup handoffを成功扱いにせず、active孤児を作らない |
| `CANDIDATE-U-WTAPP-004` | owner、repository lineage / lifecycle identity、attempt、lease、plan revision、receipt digestを各1軸で差し替える | 段階を進めず create / activate 0。異なる束縛は `identity_mismatch` / `replay_conflict` 等で拒否し、既存record/eventを上書きしない |
| `CANDIDATE-U-WTAPP-005` | `finish` / `abort` に success/failure/cancel/timeout/parent-loss、terminal receipt欠落・不一致、再送を各1軸で入力する | terminal eventとcleanup handoffを同一lifecycle / attemptへ記録。欠測は `terminal_missing` 等で保全し、同一receiptのみ冪等、異なるdigestはfail-close |
| `CANDIDATE-U-WTAPP-006` | Windows/Linuxでroot自身、direct child、nested child、root外、case差、spaces、junction、symlink、home、Temp、OneDrive、long pathを入力する | Windowsはcase-insensitive、Linuxはcase-sensitiveでdirect-childだけを比較。spacesは許可し、それ以外のroot/nested/escape/link/provider/long pathは canonical実体検査で fail-close、create 0 |
| `CANDIDATE-U-WTAPP-007` | `plan` 前のcreate、observe前のactivate、別attemptのfinish/abort、順序反転、二重呼出しを各1軸で注入する | 順序違反・二重適用・不正遷移を拒否し、append eventのrevision/attempt順序を保持。成功・terminal handoff・physical cleanupへ黙って進まない |
| `CANDIDATE-P-WTAPP-001` | 同じvalid inputを固定N回、正常系およびfault系で実行し、各port call/event/handoffを観測する | 1 attemptあたり各段階はbounded exactly-once、重複retryやNに対する不必要な二次増幅を作らず、観測可能なcall/event数が入力数に対して線形に収束する |

## 非Scopeと実装時の昇格

adapter、CLI、doctor、hooks、JSONL ledger、#426のphysical cleanup、既存worktreeの回収はこの test design の実行対象外である。
`CANDIDATE-*` は実装PRで同一の `U-*` / `P-*` test citationへ昇格し、Red/Green時刻、PLAN revision、exact HEADを証跡へ束縛する。
