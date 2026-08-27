---
layer: L7
executed_at_layer: L7
artifact: test-design
status: confirmed
plan_id: PLAN-L7-513-worktree-lifecycle-application
---

# Worktree lifecycle application test design

`PLAN-L7-501` の domain FSMを正本として、applicationの side-effect ordering、補償、terminal handoff、path入力を
RED oracleへ固定する。全ケースは同一 lifecycle identity / attemptを使い、candidateはdocs-only freeze時点で未実装のままとする。

| Oracle | 変異軸 / Given・When | 期待結果 |
| --- | --- | --- |
| `CANDIDATE-U-WTAPP-001` | `repository_lineage_id`、`lifecycle_id`、owner、Issue、PLAN ID / revision、`use`、`head_oid`、TTL、`activation_deadline`、branch、parent、path、`operation_id`、初期`attempt`を各1軸で欠落・空・不正にする | 各mutationが独立にvalidation fail-closeし、`reservePath`、plan、worktree create、observe、worker spawn、start receipt、activate、cleanup side effectを全て0。typed denyを返す |
| `CANDIDATE-U-WTAPP-002` | record登録失敗、正常系、および `reservePath` / `plan` / worktree create / `observe` / worker spawn / start receipt / `activate` を各1軸でthrowする | 正常系は `reservePath → plan → worktree create → observe → worker spawn → start receipt → activate` を一度ずつ実行。record登録失敗はworktree create / worker spawn 0。post-plan faultはprimary errorを保持し、同じidentity / `operation_id` / attemptのactivation-abort、lease release、cleanup handoffを記録する。 |
| `CANDIDATE-U-WTAPP-003` | pre-reserve、post-reserve-pre-plan、post-planのfaultを各1軸で注入し、原子的reserveのthrowまたはrecoverable lease receiptを変異する | reservePath throw時はreservation / lease 0。record不存在時にactivation-abort / terminal / cleanup handoffを要求しない。可能なlease receiptだけrelease対象とし、post-planだけrecord-bound補償を行う。最初のprimary errorを保持する |
| `CANDIDATE-U-WTAPP-004` | owner、`repository_lineage_id` / `lifecycle_id`、`operation_id`、初期`attempt`、lease、plan revision、`use`、`head_oid`、`activation_deadline`、start receipt digestを各1軸で差し替える | 段階を進めずworktree create / worker spawn / activate 0。同一attempt以外・foreign receiptは拒否し、異なる束縛は `identity_mismatch` / `replay_conflict` 等で拒否、既存record/eventを上書きしない |
| `CANDIDATE-U-WTAPP-005` | `finish` / `abort` に success/failure/cancel/timeout/parent-loss、terminal receipt欠落・不一致、同一receipt replay、異なるdigest replay_conflictを入力し、terminal event / releasePath / cleanup handoffを各1軸でthrowする | 正規順序は `terminal event → lease-release receipt → cleanup handoff`。terminal throw時は後続0、release throw時もterminalとhandoffを保持、handoff throw時もterminalとrelease receiptをauthoritative stateとして保持し、欠落/不一致は保全、同一receiptは冪等、異なるdigestは `replay_conflict`、最初のprimary errorを置換しない |
| `CANDIDATE-U-WTAPP-006` | Windows/Linuxでroot自身、direct child、nested child、root外、case差、spaces、junction、symlink、home、Temp、OneDriveを各1軸で入力する | Windowsはcase-insensitive、Linuxはcase-sensitiveでdirect-childだけを比較。spacesは許可し、それ以外のroot/nested/escape/link/providerはcanonical実体検査でfail-close、spawn 0 |
| `CANDIDATE-U-WTAPP-007` | Windows path長を239 / 240 / 241 UTF-16 code units、reserved name、unresolved link、canonicalization不能で各1軸にする。また `plan` 前worktree create、observe前worker spawn、順序反転、二重呼出しを注入する | 239/240は長さだけなら通過可能、241・reserved name・unresolved/canonicalization不能は各単独でtyped deny、worktree create / worker spawn 0。順序違反・二重適用・不正遷移も拒否し、revision/attempt順序を保持 |
| `CANDIDATE-P-WTAPP-001` | `N=100` valid attemptsを固定し、各port/event callとhandoffを測定する | `reservePath / worktree create / observe / worker spawn / start receipt / releasePath` は各 `1N+0` 以下、append event（plan / activate / terminal）は各 `1N+0` 以下、cleanup handoffは `1N+0` 以下（正常系各exactly `N`）。application port総数は `6N+0`、append event総数は `3N+0`、handoff総数は `1N+0` 以下。暗黙retry・二次増幅0 |

## 非Scopeと実装時の昇格

adapter、CLI、doctor、hooks、JSONL ledger、#426のphysical cleanup、既存worktreeの回収はこの test design の実行対象外である。
`CANDIDATE-*` は実装PRで同一の `U-*` / `P-*` test citationへ昇格し、Red/Green時刻、PLAN revision、exact HEADを証跡へ束縛する。
