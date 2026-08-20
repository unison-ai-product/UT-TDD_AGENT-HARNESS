---
plan_id: PLAN-L7-460-db-refresh-resource-guardrails
title: "PLAN-L7-460 (troubleshoot): session db-refresh の資源ガードレール (Node 経路固定 + 上限 fail-close)"
kind: troubleshoot
layer: L7
drive: db
route_signal: incident
route_mode: incident
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: draft
created: 2026-07-27
updated: 2026-08-20
owner: PM / PO
agent_slots:
  - role: aim
    slot_label: "AIM - 資源上限値 (size/time/memory) と検出方式の設計判断"
  - role: tl
    slot_label: "TL - 資源上限とプロセス系統 (Bun/Node) 固定の設計レビュー"
  - role: se
    slot_label: "SE - single-flight / 上限 / rollback / fail-close 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-460-db-refresh-resource-guardrails.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-365-harness-db-currency-hook.md
  requires:
    - docs/plans/PLAN-L7-365-harness-db-currency-hook.md
  references:
    - .ut-tdd/memory/project-incident-bun-session-db-refresh-runaway-on-2026-07-27.md
    - src/state-db/stop-refresh-coordinator.ts
    - src/state-db/projection-writer.ts
    - src/state-db/token-tracker.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/178
    - src/state-db/index.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-460: session db-refresh の資源ガードレール

GitHub issue: #124 (`fix(runtime): bound Stop db-refresh memory and snapshot runner
preparation` — 本 PLAN が機構化の正本)、#169 (harness.db 4.4GB 残置)。
関連: #118 (closed、2.97GB で snapshot runner が >2GiB 全滅)、#78 (closed、rebuild なし
stale 化の再発)。初稿は #124 を引用しておらず、issue と PLAN の紐付けが欠けていた
(2026-07-28 に補完)。

## 設計判断: backprop は Reverse 対起票 (2026-07-28、advisor: claude-fable-5)

本 PLAN は既存挙動の修理ではなく **新しい契約の追加** (Node 経路固定 / 資源上限
fail-close / single-flight / SQLite pragma) であるため、`backprop_decision:
not_required` ではなく `PLAN-REVERSE-460-db-refresh-guardrail-backfill` を対起票して
上流 (L5 物理データ / L6 機能契約) へ合流させる。gap 実測: L6 function-spec に
db-refresh 記述 0 件、L5 internal-processing:922 の `synchronous=FULL` 規定と
スコープ 6 の `NORMAL` が doc 上で衝突しうる。

線引き (今後の troubleshoot 起票基準): 既存 spec への回帰 = 純修理なら
`not_required`、新契約を足すなら Reverse 対。レーンの重さを基準にしない。

## Status

draft (起票 2026-07-27)。

## 背景 (incident 2026-07-27)

2026-07-27 12:47 JST 頃、Bun で起動された session db-refresh (PID 12016) が
harness.db を排他し続け、約 7 分で working set 4.55GB / harness.db 4.57GB まで
増大した (incident メモリ
`.ut-tdd/memory/project-incident-bun-session-db-refresh-runaway-on-2026-07-27.md`)。
PLAN-L7-365 で導入した Stop hook 駆動 detached refresh には
「暴走時に自壊する上限」が存在しない。

追記 (2026-07-28 実測): incident の肥大が **rebuild されずに残置**されていた —
本体 repo harness.db 4,435MB に対しクリーン rebuild 後は 62MB (71 倍差)。上限
fail-close (本 PLAN スコープ 3) が入っていれば残置も即日 doctor red で発見できた。
DB に触る全ゲート (SessionStart feedback surface / status / doctor / currency 判定)
が肥大 DB への IO を払い続けるため、検査速度の観点でも本 PLAN は高優先。

注: 実装 deliverable (src/state-db/stop-refresh.ts / tests/db-currency.test.ts 等) は
既存ファイルのため draft 段階の generates には載せない (merged-plan-status /
duplicate-artifact-ownership 対策)。実装 PR で本 PLAN の generates を更新し confirm
と同時に宣言する。

## 目的 / スコープ

incident メモリが要求する再発防止 5 点を機械強制する:

1. **Node 経路固定**: session db-refresh の実行系統を Node runner に固定し、
   Bun 起動は fail-close (起動自体を拒否し finding を残す)。
2. **single-flight**: 同時に 1 refresh のみ (既存 coordinator の coalesce を
   排他ロックで強化し、二重起動は即終了)。
3. **上限 fail-close**: size (harness.db 増分) + time (wall clock) +
   memory (working set) の 3 上限を超えたら refresh 自身が transaction を
   rollback して終了する。
4. **transaction rollback**: 途中終了時に harness.db が partial write に
   ならないことをテストで保証。
5. **観測可能性**: 上限発火は `.ut-tdd/logs/` に監査行を残し、doctor で
   surface する。
6. **SQLite pragma チューニング**: state-db アダプタに journal_mode=WAL /
   synchronous=NORMAL 等の明示 pragma を導入する (現状 0 件、grep 実測
   2026-07-28)。Windows の書き込み遅延・handle 解放遅延の緩和を狙う。挙動
   等価性 (projection 決定性) は既存回帰で固定する。
7. **projection 鮮度の fail-close (HEAD 刻印)**: rebuild 時に projection 元の commit
   hash を meta へ刻印し、刻印 HEAD ≠ 現 HEAD のとき **「重複なし」「影響なし」といった
   否定証明を返さず fail-close** する。鮮度は rebuild 時刻だけでは測れない (下記
   2026-07-28 実測 3)。ブランチ作業中の摩擦は warn + 明示 override で緩和する。
8. **rebuild = 新ファイルへ書いて atomic swap**: サイズ回収を手順 (人が VACUUM を
   思い出すこと) ではなく**構造**で保証する。全置換 rebuild でもファイルは縮まないため
   (下記実測 2)、VACUUM 相当を rebuild 経路に内在させる。

## 2026-07-28 実測 (issue #169 の rebuild 実施で判明した 3 点)

1. **rebuild は効くが 1 回目は fail-close した**: 手書きメモリの frontmatter 欠落
   (`.ut-tdd/memory/project-po-issue-157-codex-goal-handover-2026-07-27.md`、ローカルが
   古いブランチのため main の修正版と未同期) で 3m28s 後に中断。原子性が効き旧 projection は
   無傷。main の版で上書きして再実行し 4m38s で成功。
2. **行数 8,056,339 → 189,301 (43 分の 1) だがファイルは 4,434.6MB のまま**。SQLite は
   VACUUM しない限り解放ページを再利用するだけで縮まない。→ スコープ 8 の根拠。
   rebuild 後の上位テーブルは feedback_lifecycle 95,259 / hook_events 23,196 /
   feedback_events 14,705 で、いずれも runtime append または jsonl 由来。retention 方針は
   スコープ 3 のゲートが鳴った時点で rebuild 時の刈り込みとして足す (保持期間を先に決めない)。
   **旧 8M 行の内訳は rebuild 済みのため既に測定不能** (誠実に記録: 主犯の特定はできていない)。
3. **鮮度には HEAD 同一性が要る**: rebuild 成功後も PLAN-L6-94 / PLAN-L7-465 は
   `graph_nodes` に載らなかった。DB が古いのではなく **projection 元の working tree が
   別ブランチ (`docs/l7-453-doc-audit-errata`) で、そのブランチに両 PLAN が存在しない**ため。
   つまり projection は「rebuild 時点の checkout」を映すので、時刻だけの鮮度判定では
   偽の否定証明を通す。→ スコープ 7 の根拠。

## 再発の履歴 (3 回目を機械で止める)

- issue #118 (closed): harness.db 2.97GB → snapshot runner が
  `ERR_FS_FILE_TOO_LARGE (>2GiB)` で全滅 (検証基盤が丸ごと停止する実害)。
- issue #169 (open): 4.4GB。今回。
- issue #78 (closed): 「rebuild なしで stale 化する」が**再発**とタイトルに明記。

肥大と stale は設計問題ではなく**運用不変条件の欠落**であり (advisor: claude-fable-5、
2026-07-28)、DB 再設計はコア安定後に回す。今固定するのはスコープ 3 / 7 / 8 の 3 点に限る。
DB は正本ではなく「安く捨てて作り直せる派生 index」であり (rebuild 4m38s で決定論的に
再生できることを実測)、依存面の縮小より再生保証の方が効く。

## スコープ外

- Stop hook の currency 判定そのもの (PLAN-L7-365 の責務)。
- 現在 in-flight の `windowsHide` 修正 (別作業、本 PLAN は上に積む)。

## Schedule

- step 1 (serial): 上限値と検出方式の設計メモ + テスト設計 (L7 oracle 宣言)
- step 2 (serial): 実装 + 実 repo regression (upper-bound 発火の real oracle)
- step 3 (serial): blind review (非 author provider) → confirm

## AC

- AC-1: Bun 系統で refresh を起動しようとすると fail-close する回帰テストが green。
- AC-2: size/time/memory いずれかの上限超過で rollback 終了する oracle テストが green
  (上限は fixture で人工的に小さくして実発火させる。prose 主張ではなくテストで裏取る)。
- AC-3: 二重起動が single-flight で 1 本に収束するテストが green。
- AC-4 (スコープ 7): 刻印 HEAD ≠ 現 HEAD の projection に対し、否定証明を返す系
  (重複検出 / 影響範囲 / doctor の該当 check) が **fail-close する負例テストが green**。
  刻印が一致する場合は従来どおり判定を返すこと (過剰 fail-close の回帰防止) も固定する。
- AC-5 (スコープ 8): rebuild 後に **ファイルサイズが実測で縮む** ことを固定
  (before/after のバイト数を評価。2026-07-28 の実測 = 行数 43 分の 1 でもサイズ不変
  4,434.6MB を before として引用する)。rebuild 中断時に旧 DB が無傷で残ることも維持。
- AC-6 (スコープ 3、再発検知): harness.db の size / 行数が閾値を超えたとき doctor が
  fail する回帰テストが green (人間の気付きに依存しない)。閾値の根拠は append テーブルの
  増加速度実測を引用する (未計測のまま定数を置かない)。

## 2026-08-20 実測: 肥大の主因は per-turn token-run projection (計測記録)

**位置づけ**: 本節は issue #178 が明示的に許可する範囲 —「やる: (a) 計測 + (b) 最小の計器」— の
計測記録である。#178 は「やらない: 定義の再設計 (c)。PO 合意 (DB 再設計はコア安定後) に反する」
「本 issue では schema を変更しない」と定めているため、**本節は projection の粒度契約を freeze しない**。
再設計は #178 の指示どおり再設計キューへ積み、DB 資源レーン (#124 / #169、Codex train 3) の
所有として扱う。本 PLAN は #178 の機構化正本ではない。

exact main `7dbfa4fd491c6783f8f46fcde930553b6299ae83` 時点のローカル `.ut-tdd/harness.db`
実測 (`PRAGMA` と `COUNT(*)` の直接読み):

| 測定項目 | 値 |
| --- | --- |
| 物理サイズ | 4.41GB (`page_size`=4096 / `page_count`=1,155,780) |
| `freelist_count` | **0 (freelist 比率 0.0%)** |
| 最大テーブル | `model_runs` 7,985,466 行 (次点 `feedback_lifecycle` 98,279 行) |
| うち `token-run:<runtime>:<sessionId>:<turnIndex>` | **7,984,539 行 = 99.99%** |
| PLAN 紐付きの `model-run:<plan>:<n>:<role>:<model>` | 927 行 |

`runtime`/`model` 別内訳は codex/gpt-5.6-sol 6,143,430、codex/gpt-5.6-terra 1,453,005、
codex/gpt-5.6-luna 283,479 で、外部 Codex セッション履歴の取り込みが支配的である。

### 観測 1: VACUUM は本件に効かない

PLAN-L7-457 (status=confirmed、issue #118) は freelist 81% / 2.5GB を根拠に rebuild 後の
条件付き自動 VACUUM を実装し実測 3.07GB→534MB を達成した。その契約は現在も有効に機能して
おり、**`freelist_count`=0 がその実測証拠**である。それでも 4.41GB へ再肥大している以上、
残量は全て live data であり VACUUM で回収できる余地は 0 である。したがって #169 の
「incident 残置」という framing では本件は閉じず、L7-457 の再実行・閾値強化は効果を持たない。
AC-5 が引用する「行数 43 分の 1 でもサイズ不変」という 2026-07-28 の観測も、削除対象が
`model_runs` ではなかったことで説明が付く。

### 観測 2: 増加源は per-turn の token telemetry

書き込み点は `src/state-db/projection-writer.ts:702` の
`stableId("token-run", ${u.runtime}:${u.sessionId}:${u.turnIndex})` であり、
**1 セッション 1 ターンあたり 1 行**を PRIMARY KEY 付きで永続化する。retention も
cardinality 上限も存在しない。`model_runs` は本来 PLAN 紐付きの model 実行記録
(927 行) を保持する表であり、per-turn telemetry の集積先として設計されていない。

これは #178 の主要結論 (「太らせている実体はファイル内容ではなく派生イベント」) を
`model_runs` について再現したものである。#178 の 2026-07-28 計測時点では clean rebuild 後の
62.8MB / 74,267 行であり `model_runs` は上位に現れていなかったため、本計測はその後の
外部セッション履歴取り込みによる新しい観測に当たる。

### 再設計キューへの申し送り (本 PLAN では実装しない)

粒度の再設計を行う場合の候補は「`projectTokenUsage` を (runtime, sessionId, model) 単位へ
集約する」であるが、以下が未定義であり、着手するレーンが契約として先に確定する必要がある:

- 再投入時の idempotency と既存 turn 粒度行の扱い (消滅させるのか移行するのか)
- `cost_usd` が null の行を含む合算の定義
- model / session identity の正規化規則
- runtime telemetry scan 経路と rebuild 経路の境界 (どちらが正本か)

これらを詰めずに集約すると silent double count / 行の残置 / 誤 cost を許す。
**本 PLAN はこの再設計を freeze せず、AC も置かない。** 実施は #124 / #169 レーンの
所有として、そのレーンの PLAN で pair-freeze すること。
