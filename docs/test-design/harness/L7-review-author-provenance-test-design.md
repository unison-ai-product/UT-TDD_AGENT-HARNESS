---
title: "L7 review author provenance test design"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-517-review-author-provenance
updated: 2026-08-27
---

# Review author provenance test design

対になる契約は `docs/plans/PLAN-L7-517-review-author-provenance.md`。candidate は正式 oracle ID へ
昇格していない。昇格は対象実装と Red 実測を同一 commit へ束縛して Reverse R1 で行う。

## 受理点照合 (§3.1 / §4)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-001 | request の `authorFamily` が provenance と一致する状態で非著者 provider が attempt | 受理。既存の同族拒否判定は従来どおり後段で評価される |
| CANDIDATE-U-AUTHPROV-002 | claude 著の PR を `authorFamily=codex` と申告し、著者本人 claude が attempt | typed deny。receipt 0 件。deny 理由は provider 不一致ではなく provenance 不一致 |
| CANDIDATE-U-AUTHPROV-003 | codex 著の PR を `authorFamily=claude` と申告し、著者本人 codex が attempt | typed deny (§3.5 逆向き。002 と対称) |
| CANDIDATE-U-AUTHPROV-004 | provenance 不一致と reviewer provider 不一致が同時に成立 | provenance 不一致を先に返す。評価順序が申告値に依存しない |
| CANDIDATE-U-AUTHPROV-005 | 受理点で deny された request に対し merge gate を評価 | merge gate も独立に照合して deny。review 側の判定を再利用しない |
| CANDIDATE-U-AUTHPROV-006 | provenance と一致する request に PASS receipt があり merge gate を評価 | `merge_ready` へ到達 |

## unknown 既定 (§3.3)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-007 | provenance 記録が存在しない PR に対し request を mint | mint 成功。unknown として記録される |
| CANDIDATE-U-AUTHPROV-008 | unknown の request に対し attempt | typed deny。`unknown` 固有の reason を返し、申告値へ fallback しない |
| CANDIDATE-U-AUTHPROV-009 | unknown の request に対し merge gate を評価 | `merge_ready` へ到達しない |
| CANDIDATE-U-AUTHPROV-010 | unknown 解消経路で provenance を後付け記録し、同一 identity で再 attempt | 受理。新規 identity の mint を要求しない |
| CANDIDATE-U-AUTHPROV-011 | provenance 記録の書き込みが失敗する | unknown として扱う。成功扱いにする経路が無い |

## 混在 family と多 commit (§4)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-012 | 1 PR の commit が claude と codex にまたがる | typed `mixed`。単一 family へ丸めない |
| CANDIDATE-U-AUTHPROV-013 | `mixed` の request に対し attempt | §4 が freeze する規則どおりに判定し、規則が未定義な組合せは deny |
| CANDIDATE-U-AUTHPROV-014 | 一部 commit だけ provenance を持つ PR | 全 commit が既知でない限り `mixed` でも既知でもなく unknown 側へ倒す |

## digest 互換と移行 (§3.4)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-015 | 旧 `REVIEW_REQUEST_SCHEMA_VERSION` の request を新実装で読む | 旧規則で解釈される。digest 再計算 0 |
| CANDIDATE-U-AUTHPROV-016 | 旧 schema の in-flight request を close | 旧規則のまま close でき、既存 receipt との対応が保たれる |
| CANDIDATE-U-AUTHPROV-017 | 新 schema で mint した request の digest | 新 schemaVersion を入力に含み、同一 (memoryId, pr, exactHead, authorFamily) でも旧 digest と一致しない |
| CANDIDATE-U-AUTHPROV-018 | 既存 receipt を新 schema で再検証 | 対応が壊れない。receipt の無効化 0 |

## 実 repo 回帰 (prose ではなく実測で claim を裏付ける)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-P-AUTHPROV-001 | 実 repo の直近 commit 群に対し provenance 解決を実行 | git author 名からは family を導出しない。導出源として参照した記録が commit metadata でないことを示す |
| CANDIDATE-P-AUTHPROV-002 | PR #430 の r9 誤申告 request (`authorFamily=codex`、実著者 claude) を fixture として再現 | 本実装で typed deny。手動介入なしに阻止される |
| CANDIDATE-P-AUTHPROV-003 | 正規委譲経路 (`ut-tdd codex|claude --role`) で作られた commit と、wrapper 外で作られた commit が混在する PR | 前者は既知、後者は unknown。推定で埋めない |
