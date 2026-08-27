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
| CANDIDATE-U-AUTHPROV-010 | **verdict receipt が未発行の** unknown request に対し provenance を後付け記録し、同一 identity で再 attempt | 受理。新規 identity の mint を要求しない。snapshot は再 attempt 時点の値へ束縛し直される |
| CANDIDATE-U-AUTHPROV-047 | **verdict receipt 発行後に** provenance を後付け記録・変更 | typed deny。receipt が束縛した snapshot は不変 (034 と同一規則。束縛の起点が verdict 発行であることを測る) |
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
| CANDIDATE-U-AUTHPROV-015 | 旧 `REVIEW_REQUEST_SCHEMA_VERSION` の request を新実装で読む | **digest は旧規則で保存され再計算 0**。ただし受理判定は §3.4 の照合を経由する (保存側と受理側を分離。036-039 と同一規則) |
| CANDIDATE-U-AUTHPROV-016 | 旧 schema の in-flight request を、provenance が照合でき一致する状態で close | close 可。既存 receipt との対応が保たれ、digest は再計算されない。**「旧規則のまま無条件に close できる」ことは主張しない** (038 と同一事象を保存側の観点から測る) |
| CANDIDATE-U-AUTHPROV-017 | 新 schema で mint した request の digest | 新 schemaVersion を入力に含み、同一 (memoryId, pr, exactHead, authorFamily) でも旧 digest と一致しない |
| CANDIDATE-U-AUTHPROV-018 | 既存 receipt を新 schema で再検証 | 対応が壊れない。receipt の無効化 0 |

## 発行権限の分離 (§3.2)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-019 | 当該 commit を書いた worker family 自身が issuer attestation と provenance record を同時に write/forge | typed deny。独立 custody 検証に失敗し、record 0 件 |
| CANDIDATE-U-AUTHPROV-020 | dispatch identity を持たない record を受理点へ入力 | typed deny。信頼根として使わない |
| CANDIDATE-U-AUTHPROV-021 | dispatch 開始時 record の宣言 family と、完了時 commit-set binding の family が食い違う | `unknown` へ倒す。開始時宣言を採用しない |
| CANDIDATE-U-AUTHPROV-022 | unknown 解消の backfill を、当該 commit を書いた worker family が実行 | typed deny |
| CANDIDATE-U-AUTHPROV-023 | 同じ backfill を dispatch 側または人手 (out-of-band) が実行 | 受理 |

## model / provider 対応 (§3.2.1)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-024 | dispatch provider が codex、`worker_model` が claude 系 | alias 正規化後も不一致 → `unknown`。推論で辻褄を合わせない |
| CANDIDATE-U-AUTHPROV-025 | 正規化表に無い未知 model 名 | `unknown`。既知 family へ丸めない |
| CANDIDATE-U-AUTHPROV-026 | alias 表記の既知 model | 正規化して family を解決。同一 family に落ちる |
| CANDIDATE-U-AUTHPROV-027 | human / manual commit | typed `human`。`codex` / `claude` のいずれにも丸めない |
| CANDIDATE-U-AUTHPROV-028 | subagent の record を親 dispatch identity 無しで受理点へ入力 | typed deny |
| CANDIDATE-U-AUTHPROV-029 | 1 commit を複数 worker が生成 | multi-contributor として記録。単一 family へ丸めない |

## collision / replay / mutation / TOCTOU (§3.3.1)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-030 | 同一 repo・同一 commit に異 family の record が 2 件 | `conflict` として保持。先勝ちで片方を捨てない。受理点は `unknown` 同様に deny |
| CANDIDATE-U-AUTHPROV-031 | 別 repository identity の record を同一 commit sha で流用 | typed deny (cross-repo replay) |
| CANDIDATE-U-AUTHPROV-032 | 既存 record の overwrite / delete を要求 | 支援されない操作として deny。訂正は追記 + supersede でのみ成立 |
| CANDIDATE-U-AUTHPROV-033 | issuer attestation と内容 digest を同時に改変/forge した record | 受理点の独立 custody 検証と digest 再計算で不一致を検出し deny。record 側の自己申告だけでGreenにならない |
| CANDIDATE-U-AUTHPROV-034 | receipt 発行後・merge 前に provenance snapshot を差し替え | merge gate が snapshot 不一致を typed deny。「review 時は正しかった」を merge 根拠にしない |
| CANDIDATE-U-AUTHPROV-035 | request / receipt / merge gate が同一 snapshot を参照する正常系 | `merge_ready` へ到達 |

## legacy 移行の非 grandfather (§3.4)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-036 | 旧 schema の in-flight request を、provenance 照合なしで close | typed deny。旧 schema は照合免除にならない |
| CANDIDATE-U-AUTHPROV-037 | 旧 schema request で provenance が照合できない | `unknown_provenance_unresolved` の typed non-terminal としてlive/merge-blockingに保持。#439 retractionや再mintへ自動遷移せず、unknownのままcloseできない |
| CANDIDATE-U-AUTHPROV-038 | 旧 schema request で provenance が照合でき一致する | close 可。旧 digest は再計算されない |
| CANDIDATE-U-AUTHPROV-039 | PR #430 型の誤 `authorFamily` 旧 request を移行期間中に close しようとする | typed deny。grandfather 条項が存在しない |

## contributor family set (§3.5)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-U-AUTHPROV-040 | set = `{codex, claude}` の PR に codex reviewer が attempt | typed deny |
| CANDIDATE-U-AUTHPROV-041 | set = `{codex, claude}` の PR に claude reviewer が attempt | typed deny (040 と対称。どの reviewer でも受理しない) |
| CANDIDATE-U-AUTHPROV-042 | set に unknown contributor を 1 件含む | typed deny。部分的既知では通さない |
| CANDIDATE-U-AUTHPROV-043 | set = `{human}` のみ | codex / claude いずれの reviewer も非著者として受理 |
| CANDIDATE-U-AUTHPROV-044 | set = `{codex, human}` に claude reviewer が attempt | 受理。claude は set に含まれない |
| CANDIDATE-U-AUTHPROV-045 | 混在 set を多数派 family へ丸める経路の探索 | 丸め込み経路が存在しない (緩和の不在を測る負例) |
| CANDIDATE-U-AUTHPROV-046 | single-commit mixed を含む PR | その commit の複数 family が PR の set へ合流する |

> **015/016 と 036-039 の関係**: 015/016 は *digest 保存側* の不変条件 (再計算 0、receipt 対応の維持) を測り、
> 036-039 は *受理側* の不変条件 (照合免除の不在) を測る。PLAN §3.4 が両者を別の関心事として分離しているため、
> 「旧 schema は照合を免除される」と読める oracle は存在しない。016 は照合が成立した場合の保存側挙動のみを
> 主張し、照合できない場合は 037 が支配する。

## 実 repo 回帰 (prose ではなく実測で claim を裏付ける)

| Candidate | Stimulus | Oracle |
|---|---|---|
| CANDIDATE-P-AUTHPROV-001 | 実 repo の直近 commit 群に対し provenance 解決を実行 | git author 名からは family を導出しない。導出源として参照した記録が commit metadata でないことを示す |
| CANDIDATE-P-AUTHPROV-002 | PR #430 の r9 誤申告 request (`authorFamily=codex`、実著者 claude) を fixture として再現 | 本実装で typed deny。手動介入なしに阻止される |
| CANDIDATE-P-AUTHPROV-003 | 正規委譲経路 (`ut-tdd codex|claude --role`) で作られた commit と、wrapper 外で作られた commit が混在する PR | 前者は既知、後者は unknown。推定で埋めない |
