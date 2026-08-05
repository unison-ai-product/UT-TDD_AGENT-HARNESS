---
plan_id: PLAN-L4-34-repository-runtime-placement-topology
title: "PLAN-L4-34 (add-design/architecture): Repository / Runtime Placement Topology"
kind: add-design
layer: L4
drive: fullstack
route_signal: redesign
route_mode: redesign
created: 2026-08-05
updated: 2026-08-05
owner: PO / TL
parent_design: docs/design/harness/L4-basic-design/architecture.md
sub_doc: architecture
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: TL - state root resolver、write fence、二重稼働禁止の段階導入境界
  - role: se
    slot_label: SE - durable/cache/scratch/evidence 4-class 台帳、cutover/rollback プロトコル
  - role: qa
    slot_label: QA - interrupted copy / replay idempotency / cross-volume の system oracle
generates:
  - artifact_path: docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/141
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/169
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/228
    - docs/plans/PLAN-L7-348-runtime-state-recoverability.md
    - docs/governance/repository-structure.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/test-design/harness/L9-system-test-design.md
github_issue_id: 141
backprop_decision: not_required
backprop_decision_reason: >-
  新規契約 (repository/runtime placement topology) の genesis 設計であり、既存実装を正本として
  設計へ引き戻す Reverse ではない (issue #141 の駆動モデル節が明示)。kind=add-design は
  KIND_BACKFILL 上も Reverse 対必須ではない ("none"、src/lint/backfill-pairing.ts)。本判定は
  add-impl 側で必要になった時点 (L7 降下) で再評価する。
review_evidence: []
status: draft
---

# PLAN-L4-34: Repository / Runtime Placement Topology

## 0. 起票理由

Issue #141 (2026-07-23 起票、Redesign route 選択済み) が「統一 repository/runtime placement
topology は未設計」と結論し、新規 L4 `add-design` PLAN を要求した。起票から 13 日経過しても
PLAN は未起票だった (`docs/plans/` に該当なしを本 PLAN 起票時点で確認済み)。本 PLAN はその
起票要求への応答であり、設計そのものを本文で確定するのではなく **L4/L9 pair-freeze による
設計凍結の入口を開く**。

## 1. 目的

OneDrive 上の primary clone + 共通 `.git` + worktree ごとの `.ut-tdd` という現行配置契約を
差し替え、OneDrive 外の canonical placement へ安全に cutover するための設計を凍結する。
「見かけ上の退避 (worktree を外部へ置くだけ)」では共通 Git 管理領域が OneDrive へ戻るため
負債が消えないことを設計前提として明記する (issue #141 実測 3.)。

## 2. 実測 (2026-07-23 → 2026-08-05 の悪化推移)

| 指標 | 2026-07-23 (issue #141 起票時) | 2026-08-05 (本 PLAN 起票時) | 変化 |
|---|---|---|---|
| 登録 worktree 数 | 38 本 | 118 本 (Temp 70 / `C:/Users/micro/ut-*` 36 / OneDrive 7 / その他 5) | 約 3.1 倍 / 13 日 |
| `.ut-tdd/harness.db` サイズ | 約 3.86 GB (3,859,845,120 bytes) | 約 4.4 GB | さらに増加 (issue #169 の正常値 62MB に対し**71 倍**) |
| worktree 個別 `harness.db` 数 | 22 本 (38 worktree 中) | Temp 配下だけで 67 本 | 増加継続 |
| stale worktree (`git worktree prune --dry-run`) | 未計測 | **0 件** — 全 118 ディレクトリが実在し生きた参照 | 「古いから消せる」判別が機械的にできない |

追加実測 (2026-08-05 新規):

- `.ut-tdd/harness.db` は `ReparsePoint` 属性を持つ **OneDrive クラウド placeholder**。4.4GB の
  SQLite が常時 OneDrive 同期対象になっている (issue #141 の "OneDrive 停止で I/O が数十秒級→
  約 1〜3 秒へ回復" という実証済み効果と直結する原因)。
- issue #228: OneDrive 配下の既存ディレクトリに対し Bun 1.3.14 の
  `mkdirSync(path, {recursive: true})` が **EEXIST を投げる** (Temp 配下は成功、Node は同一
  パスで no-op)。結果、主 checkout で `ut-tdd db status` / `ut-tdd handover` が実行不能になり、
  EOD 棚卸しの projection 鮮度確認と PLAN 完了時 handover という**運用規律そのもの**が機械的に
  遂行できない状態が発生していた。

**結論**: OneDrive 停止という緩和の効果は実証済み (I/O 数十秒→1〜3秒) だが、これは人間操作
であり構造対応ではない。悪化速度 (13 日で worktree 3 倍・DB 71 倍) は緩和だけでは止まらず、
本 PLAN が要求する構造設計 (状態 root の分離、4-class 台帳、worktree 寿命契約) を凍結する
必要がある。

## 3. 閉じるべき契約 (issue #141 が列挙した 6 件を設計項目として構造化)

1. **cutover / rollback / write fence**: OneDrive 外 new clone への正式 cutover、old/new
   identity の対応付け、rollback 手順、**旧 clone の write fence** (cutover 後に旧 clone へ
   誤って書き込まれないことの機械的保証)、新旧二重稼働の禁止 (検知・拒否)。
2. **4-class 台帳と canonical state root resolver**: `durable / cache / scratch / evidence`
   の全 path を分類する台帳と、それを解決する canonical state root resolver。現状は
   repository-local `.ut-tdd` 固定 (cwd 依存) であり、4.4GB の DB を単純に「移設」しても
   worktree ごとの分裂は解消しない — resolver が repository lineage に対して一意な root を
   返す契約が要る。
3. **rebuildable 分類と移送順序**: `harness.db` / ledger / memory / logs / WAL / SHM / lock の
   うち「正規入力から再構築できるもの」と「再構築不能な durable state」を分類し、停止点・
   移送順序・hash/count/schema 検証手順を定義する。3.86GB→4.4GB の DB を盲目的にコピーしない
   (issue #141 要求条件と同じ)。
4. **障害注入試験**: interrupted copy、partial migration、replay の idempotency、DB がロック
   中の移送、OneDrive placeholder (未 hydrate ファイル) の扱い、cross-volume (別ドライブ) 移送
   の試験契約。
5. **復旧と証跡連続性の acceptance**: PC 再起動、OneDrive 停止、旧 clone 削除後に、復旧手順と
   証跡 (harness.db projection、review evidence 等) の連続性を確認する L12/L14 acceptance。
6. **secret / PII / retention / backup 責任境界**: 移送対象に secret・PII が含まれないことの
   確認手順、retention policy、backup の責任境界 (誰が・いつ・何を保持するか)。

## 4. 移設手順の骨子 (設計として固定する要件。実行手順書ではない)

- **共通 `.git` 依存の全 worktree 破壊契約**: 2026-08-05 時点で 118 worktree が単一の共通
  `.git` を参照している。primary clone を移動すれば全 worktree link が (`.git` file 内の
  gitdir 参照経由で) 破壊される。設計は `git worktree repair` を含む復旧契約と、**他ランタイム
  (Codex) の in-flight 作業が存在しない窓**でのみ cutover を実行する前提条件を明記しなければ
  ならない (`CLAUDE.md` の Hybrid 多ランタイム commit 協調と矛盾しないこと)。
- **worktree 寿命契約の欠如が根本原因**: 38→118 (13 日で 3 倍) の増加は、worktree に
  owner/TTL/terminal receipt が無く、終了済み作業面を機械的に判別・回収する契約が存在しない
  ことに起因する (`git worktree prune --dry-run` が 0 件を返す = Git からは全部「生きている」
  ように見える)。本設計はこの寿命契約 (owner/TTL/終了時の登録解除) を要求項目に含める。
- **検証方法**: 移設後、rebuildable な state は「re-build して一致」を検証条件とし、durable な
  state は「hash/count が一致」を検証条件とする。両者を混同しない (rebuildable を hash 一致で
  縛らない、durable を re-build で代替しない)。

## 5. 段階化 (S1/S2/S3)

- **S1 (本 PLAN の scope)**: 本設計を L4/L9 pair-freeze で凍結する。**実行 (cutover) を含まない**。
- **S2**: canonical state root resolver の L5/L6 降下 + 4-class 台帳の schema 化。
- **S3**: cutover 実行 (new clone 生成、worktree 再生成、DB 再構築) + L12/L14 acceptance の
  system 実走。

S1 は設計のみであり、S2/S3 の着手は S1 の confirmed 後、別 PLAN として起票する。

## 6. 暫定緩和 (本 PLAN の AC とは別に明記)

構造対応 (S3) の完了を待たず、現時点で取れる緩和を記録する。**これらは本 PLAN の受入条件では
ない** — 構造対応が完了するまで「無防備でよい」根拠として誤読しないための記録である。

- (a) OneDrive 同期対象からの除外 / OneDrive 停止。人間の設定操作であり、実測で効果がある
  (issue #141: I/O 数十秒→1〜3秒)。
- (b) 4.4GB `.ut-tdd/harness.db` の縮退。issue #169 が対象とする gitignored な生成物の整理。
- (c) 主 checkout での bun 実行回避。issue #228 が指摘する `mkdirSync` EEXIST を踏まないための
  当面の作業回避 (Temp 配下 worktree での実行等)。

## 7. 受入条件 (AC)

- **AC-PLACE-01**: 契約 6 件 (§3) が設計として閉じ、non-author family cross-review (PASS) の
  review_evidence を得る。
- **AC-PLACE-02**: `durable / cache / scratch / evidence` 4-class 台帳の schema が L9 の
  system test design oracle と 1:1 で対になる。
- **AC-PLACE-03**: 旧 clone write fence と新旧二重稼働禁止が「prose の禁止」ではなく機械強制
  可能な形 (検出・拒否の対象と手段) で定義されている。
- **AC-PLACE-04**: L12/L14 acceptance 項目 (PC 再起動 / OneDrive 停止 / 旧 clone 削除後の復旧と
  証跡連続性) が列挙され、L9 system test design と pair している。
- **AC-PLACE-05**: worktree 寿命契約 (owner/TTL/終了時登録解除) が S2 以降の降下対象として
  明示され、`git worktree prune` の「stale 0 = 全部生存」という現状の限界 (§2) を放置しない
  設計になっている。

## 8. 設計と検証の対 (RED oracle 案、L9 pair-freeze 入力)

以下は本 PLAN が L9 (`docs/test-design/harness/L9-system-test-design.md`) へ pair-freeze する
際の RED oracle 候補である。本 PLAN 自体はこれらを Green にしない (S1 は設計のみ)。

| oracle ID (案) | 検証対象 | 種別 |
|---|---|---|
| `U-PLACE-001` | canonical state root resolver が repository lineage に対し一意な root を返す (cwd/worktree 位置に依存しない) | positive |
| `U-PLACE-002` | 4-class (`durable/cache/scratch/evidence`) 分類が全既知 path を網羅し未分類 path が 0 | positive |
| `U-PLACE-003` | 旧 clone への書き込みが cutover 後に fail-close で拒否される (write fence) | negative |
| `U-PLACE-004` | new/old clone の同時稼働 (二重稼働) を検知し fail-close する | negative |
| `U-PLACE-005` | rebuildable state (harness.db 等) が正規入力からの再構築後、full rebuild と canonical digest が一致する | positive |
| `U-PLACE-006` | interrupted copy 後の再実行 (replay) が idempotent に収束する (二重適用・欠落なし) | negative → positive収束 |
| `U-PLACE-007` | DB がロック中の移送要求を fail-close する (silent skip / 部分コピーをしない) | negative |
| `U-PLACE-008` | OneDrive placeholder (未 hydrate ファイル) を検出し、hydrate 前の盲目コピーを拒否する | negative |
| `U-PLACE-009` | cross-volume (別ドライブ) 移送で hash/count 検証が volume 差に影響されず一致する | positive |
| `U-PLACE-010` | worktree の owner/TTL が期限切れの scratch worktree を、success/failure/timeout/parent-loss の全経路で登録解除・実体回収する | positive |
| `U-PLACE-011` | PC 再起動 / OneDrive 停止後、進行中だった移送 (partial migration) の状態から安全に復旧・再開または明示 fail-close する | negative → positive収束 |
| `U-PLACE-012` | secret/PII が durable 台帳に含まれないことを移送前 scan で検出する (含まれる場合は fail-close) | negative |

## 9. Reverse 対の判定 (kind=add-design)

`src/lint/backfill-pairing.ts` の `KIND_BACKFILL` は `add-design: "none"` であり、Reverse 対は
必須ではない (必須なのは `add-impl` のみ)。本 PLAN は既存実装を正本として設計へ引き戻す
Reverse ではなく、issue #141 の駆動モデル節が明示する **genesis 設計 (Redesign route)** である
ため、`backprop_decision: not_required` を frontmatter に明記した。L7 降下 (実装 PLAN) で
`kind=add-impl` を起票する段になった時点で、その PLAN 側で Reverse 対の要否を再評価する
(add-impl は `KIND_BACKFILL` 上 `"required"`)。

## 10. plan_id 番号についての注記

指示では `PLAN-L4-33-repository-runtime-placement-topology` として起票する想定だったが、
起票直前の確認で **`docs/plans/PLAN-L4-33-node-control-plane-redesign.md` が既に存在**
(2026-07-24 作成、別トピック) しており、番号が衝突することが判明した。既存 L4-33 を上書き・
改番せず、本 PLAN は空いている次番号 `PLAN-L4-34` を採番した (RECOVERY-17 番号衝突の教訓と
同型の事前チェックを本 PLAN 起票時に実施し、今回は起票前に検出・回避した)。
