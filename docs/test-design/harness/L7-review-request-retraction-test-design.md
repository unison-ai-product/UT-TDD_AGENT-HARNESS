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

## 手動削除の検知 (§3.5)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-RETRACT-022 | retraction receipt 無しで request ファイルが消えた状態 | 検知して報告する。fail-close にはしない |
| CANDIDATE-U-RETRACT-023 | retraction receipt を伴って request が終端した状態 | 手動削除として報告しない (偽陽性 0) |

## 実 repo 回帰 (prose ではなく実測で claim を裏付ける)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-P-RETRACT-001 | PR #430 の `rv1-55b815ea…` (申告 codex / 実著者 claude、receipt 無し) を fixture として再現し、merge gate を評価 | 現行実装では deny。本実装では `unclosable` retraction 後に replacement の PASS だけで `merge_ready` へ到達 |
| CANDIDATE-P-RETRACT-002 | PR #441 の競合 2 本 (両方 authorFamily=claude、片方のみ receipt) を fixture として再現 | `superseded` retraction、または 2 本目への receipt 発行のいずれでも `merge_ready` へ到達し、手動削除を要さない |
| CANDIDATE-P-RETRACT-003 | 実 repo の全 request / receipt に対し手動削除検知を実行 | retraction 無しで消えた request を列挙する。検知が既存の正常終端を偽陽性にしない |
