---
title: "L7 project-scoped Memory root test design"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-512-project-scoped-memory-root
updated: 2026-08-26
---

# Project-scoped Memory root test design

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-PMEMROOT-001 | linked worktreeからroot解決 | primary corpusとproject busが一致 |
| CANDIDATE-U-PMEMROOT-002 | current/primary identity drift | typed deny、read/write 0 |
| CANDIDATE-U-PMEMROOT-003 | identity欠落・不正common-dir | typed deny |
| CANDIDATE-U-PMEMROOT-004 | 異project identity | namespace不一致 |
| CANDIDATE-U-PMEMROOT-005 | 同一ID・同一digest複製 | 一件canonical、残りdedupe |
| CANDIDATE-U-PMEMROOT-006 | 同一ID・異digest | 上書き0、全variant quarantine |
| CANDIDATE-U-PMEMROOT-007 | envelope project/provider/session変異 | read/claim 0、entry保持 |
| CANDIDATE-U-PMEMROOT-008 | symlink/junction/8.3 root escape | typed deny |
| CANDIDATE-U-PMEMROOT-009 | linked worktreeからDB rebuild／Memory projectionを実行し、current worktreeだけにlegacy corpusを置く | projection readerもprimary canonical corpusだけを読み、legacy fallback 0。current/primaryを入れ替えてもidentity集合とdigestが一致 |
| CANDIDATE-P-PMEMROOT-001 | mainとlinked worktree間のMemory/Claude通知 | 同一corpus/busを観測 |
| CANDIDATE-P-PMEMROOT-002 | Packだけでsetup後にCodex/Claudeを起動 | source/Pack checkout参照0でparity成立 |
| CANDIDATE-P-PMEMROOT-003 | 同名Memoryを持つ別projectを並行起動 | cross-project read/claim 0 |
| CANDIDATE-P-PMEMROOT-004 | 全linked worktreeに同一ID・異digestを配置してmigration | canonical write 0、全variant quarantine、completion replay一致 |
| CANDIDATE-P-PMEMROOT-005 | worker-only memoryのapply中断・source drift・完了後改ざん後に次回起動する | rollback/recovery、次回起動の未完了fence 0、現物digest不一致をtyped deny |

正式oracle IDへの昇格は、対象実装とRed実測を同一commitへ束縛し、Reverse R1で行う。
