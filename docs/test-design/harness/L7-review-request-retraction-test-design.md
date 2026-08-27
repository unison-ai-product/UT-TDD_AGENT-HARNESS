---
title: "L7 review request retraction test design"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-518-review-request-retraction
updated: 2026-08-27
---

# Review request retraction test design

対になる契約は `docs/plans/PLAN-L7-518-review-request-retraction.md`。candidate は正式 oracle ID へ
昇格していない。昇格は対象実装と Red 実測を同一 commit へ束縛して Reverse R1 で行う。

## retraction 権限 (§3.1)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-001 | PASS receipt を持つ request を author family が retract 要求 | typed deny。retraction receipt 0 件。既存 verdict は不変 |
| CANDIDATE-U-RETRACT-002 | FLAG receipt を持つ request を author family が retract 要求 | typed deny。FLAG からの逃走経路が無い |
| CANDIDATE-U-RETRACT-003 | reviewer family が他家の request を retract 要求 | typed deny。判定側が依頼を消せない |
| CANDIDATE-U-RETRACT-004 | typed reason code 以外 (自由記述のみ) で retract 要求 | typed deny。自由記述は受理判定の入力にならない |
| CANDIDATE-U-RETRACT-005 | author family が verdict 無しの自 request を正しい class と reason code で retract | 受理。append-only receipt が 1 件書かれる |

## class unclosable (§3.2 / 事例 D)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-006 | 申告 `authorFamily` から導く `expectedProvider` が実 author family と一致する request を `unclosable` で retract | 受理。機械述語が成立する |
| CANDIDATE-U-RETRACT-007 | 述語が成立しない (正規に閉じられる) request を `unclosable` と自己申告して retract | typed deny。自己申告を根拠にしない |
| CANDIDATE-U-RETRACT-008 | authoring provenance が `unknown` の request を `unclosable` で retract | typed deny (§3.4 依存。provenance 未確定では主張できない) |
| CANDIDATE-U-RETRACT-009 | `unclosable` で replacement identity を指定せず retract | 受理。class `unclosable` は replacement を要求しない |

## class superseded (§3.2 / 事例 R)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-010 | replacement identity を指定せず `superseded` で retract | typed deny |
| CANDIDATE-U-RETRACT-011 | 別 `(pr, exactHead)` の identity を replacement として指定 | typed deny |
| CANDIDATE-U-RETRACT-012 | 既に retracted な identity を replacement として指定 | typed deny |
| CANDIDATE-U-RETRACT-013 | 同一 `(pr, exactHead)` の未 retract identity を replacement として `superseded` retract | 受理。replacement が receipt に束縛される |

## append-only 性 (§3.3)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-014 | 同一 request に同一内容の retraction を 2 回要求 | idempotent。receipt は 1 件のまま |
| CANDIDATE-U-RETRACT-015 | 同一 request に内容の異なる retraction を要求 | typed deny。先行 retraction は不変 |
| CANDIDATE-U-RETRACT-016 | retraction 後に request ファイルの存在を確認 | 残っている。削除されない |
| CANDIDATE-U-RETRACT-017 | retraction receipt の必須 field 欠落 (class / reason_code / actor / at / 対象 revision / pr / exactHead) | typed deny。部分的な receipt を書かない |

## merge gate (§3.4)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-018 | current HEAD に retracted 1 本と PASS receipt 付き 1 本 | `merge_ready` へ到達。retracted は deny 集合から除外 |
| CANDIDATE-U-RETRACT-019 | current HEAD の entry が retracted のみ | deny。`no_effective_verdict`。retracted 単独で merge しない |
| CANDIDATE-U-RETRACT-020 | §3.1 の 4 条件を満たさない不正な retraction receipt が存在する状態で merge gate を評価 | deny。gate が独立に再評価し、発行側の判定を再利用しない |
| CANDIDATE-U-RETRACT-021 | retracted 1 本と FLAG receipt 付き 1 本 | deny。FLAG は retraction では消えない |

## mint ledger と手動削除 (§3.5)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-022 | ledger に未終端 entry があるのに request ファイルが存在しない | `orphaned_mint` として **fail-close**。gate 集合から外れない |
| CANDIDATE-U-RETRACT-023 | pending request ファイルを削除して merge を試みる | deny。削除しても ledger 由来の entry が集合に残るため gate が緩まない |
| CANDIDATE-U-RETRACT-024 | 正規 retraction で終端した request | `orphaned_mint` として報告しない (偽陽性 0) |
| CANDIDATE-U-RETRACT-025 | ledger 自体が存在しない | `ledger_unavailable` として fail-close。ledger を消して gate を緩める経路が無い |
| CANDIDATE-U-RETRACT-026 | ledger entry の削除・改変を要求 | 支援されない操作として deny |
| CANDIDATE-U-RETRACT-027 | 削除された request ファイルを復元 | `orphaned_mint` が解消し、通常の未終端 entry として扱われる |

## terminal 直列化 (§3.3)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-028 | 同一 `reviewRevision` に verdict receipt と retraction receipt を両方作る | 2 件目が UNIQUE 制約で typed deny。両立状態を作れない |
| CANDIDATE-U-RETRACT-029 | verdict 発行と retraction を並行実行 | CAS により片方のみ成立。先着を上書きしない |
| CANDIDATE-U-RETRACT-030 | 競合する 2 つの retraction を並行実行 | CAS により片方のみ成立。他方は typed deny |
| CANDIDATE-U-RETRACT-031 | lease 未取得で終端手続きを開始 | typed deny |
| CANDIDATE-U-RETRACT-032 | lease 保持中に別 actor が終端を試みる | typed deny。lease 失効後は再取得可能で無期限ロックにならない |
| CANDIDATE-U-RETRACT-033 | receipt 書き込みの完了確認が取れない (ack-loss) | `indeterminate` として fail-close。成功扱いにしない |
| CANDIDATE-U-RETRACT-034 | `indeterminate` の次回起動 | 現物 receipt との照合で `committed` / `uncommitted` へ解決する |

## superseded replacement graph (§3.2.1)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-035 | 自分自身を replacement に指定 | typed deny (self) |
| CANDIDATE-U-RETRACT-036 | replacement 関係が閉路を作る | typed deny (cycle) |
| CANDIDATE-U-RETRACT-037 | A→B→C の chain | leaf C を実効 replacement として解決する |
| CANDIDATE-U-RETRACT-038 | chain の leaf が retracted | typed deny。chain 全体が無効 |
| CANDIDATE-U-RETRACT-039 | leaf の `expectedProvider` が著者本人になる (正規に閉じられない) | typed deny。dead-end の先送りを許さない |
| CANDIDATE-U-RETRACT-040 | leaf の provenance が `unknown` / `conflict` | typed deny |
| CANDIDATE-U-RETRACT-041 | tracked artifact 外 (memory / PR 本文) の記述のみを replacement の根拠にする | typed deny。canonical custody を要求する |
| CANDIDATE-U-RETRACT-042 | 任意の retraction graph に対し gate が再評価 | 実効 replacement が一意に定まるか typed deny のいずれか。発行側の判定を使わず決定論的 |

## unclosable の provenance 束縛 (§3.2 / §3.6)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-043 | provenance が `unknown` / `conflict` の状態で `unclosable` を主張 | typed deny |
| CANDIDATE-U-RETRACT-044 | `unclosable` retraction 後、merge 前に provenance snapshot を差し替え | merge gate が snapshot 不一致を typed deny |
| CANDIDATE-U-RETRACT-045 | PLAN-L7-517 の信頼根が未着地の状態で `unclosable` 経路を実行 | 経路が存在しない (先行実装の不在を測る負例) |

## legacy 移行 (§3.6.1)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-046 | ledger 導入境界より前の mint に対応する request が存在しない | `orphaned_mint` にしない。既に merge 済みの PR を巻き込まない |
| CANDIDATE-U-RETRACT-047 | 境界以降の mint の request を手動削除 | `orphaned_mint` として fail-close。例外が無い |
| CANDIDATE-U-RETRACT-048 | PR #430 の `rv1-55b815ea…` を historical record として参照 | fail-close の入力にならず、証跡としてのみ列挙される |

## 実 repo 回帰 (prose ではなく実測で claim を裏付ける)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-P-RETRACT-001 | PR #430 の `rv1-55b815ea…` (申告 codex / 実著者 claude、receipt 無し) を fixture として再現し、merge gate を評価 | 現行実装では deny。本実装では `unclosable` retraction 後に replacement の PASS だけで `merge_ready` へ到達 |
| CANDIDATE-P-RETRACT-002 | PR #441 の競合 2 本 (両方 authorFamily=claude、片方のみ receipt) を fixture として再現 | `superseded` retraction、または 2 本目への receipt 発行のいずれでも `merge_ready` へ到達し、手動削除を要さない |
| CANDIDATE-P-RETRACT-004 | 実 repo の全 request / receipt / ledger に対し `orphaned_mint` 判定を実行 | 境界以前の不在を偽陽性にしない。境界以降の消失のみ fail-close する |
| CANDIDATE-P-RETRACT-003 | 実 repo の全 request / receipt に対し retraction 無しで消えた request を列挙 | 既存の正常終端を偽陽性にしない |
