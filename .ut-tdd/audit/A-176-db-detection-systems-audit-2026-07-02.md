# A-176 - DB 側自動検出系の焦点監査

- **date**: 2026-07-02
- **scope**: harness.db を源泉とする自動検出系 (feedback engine / telemetry 投影 / refactor 候補 / guardrail / DB 系 lint) の実態監査 (PO 質問「データベース側の自動検出系は？」、A-175 台帳 #6 の次 round 筆頭を前倒し実施)。
- **method**: 実 DB クエリ (feedback_events 全量) + 生成/消化経路のコード突合。

## 検出系インベントリ (実在確認済み)

| 検出系 | 源泉 → 出口 | 状態 |
|---|---|---|
| findings → feedback_events (missing-test-coverage 等) | review findings → SessionStart surface | 稼働 |
| quality_signals → feedback_events (warn/fail) | 各 lint 投影 → surface | 稼働 |
| artifact_progress (yellow) → feedback_events | 進捗投影 → telemetry bucket | 稼働 (肥大、下記 F-A) |
| missing-test-oracle-id | projectTestCaseCatalog (tests の it() 走査) | 稼働・設計どおり (A-174 で確認済) |
| skill firing/acceptance rate | skill 投影 → telemetry | 稼働だが既知 provenance 空洞の上 (実発火 0 問題) |
| refactor_candidate (split-module / large-document-split) | DB-trigger → Refactor mode §3 | **稼働・成功実績** (contracts.ts 分割の PO 工程判断へ実接続) |
| trouble events (forced-stop 等) | session-log → feedback | 稼働 |
| SessionStart 3-bucket surface (gate/actionable/telemetry) | surface.ts | 稼働・ノイズ制御は有効 |
| drive-db-registration / db-projection-coverage / ingestion lint | doctor | 稼働 (mode 損失の盲点は A-173 F-9 → PLAN-L7-243) |
| telemetry-closure / rule-automation-closure | doctor (doc ベースの closure 規律) | green (event lifecycle とは別物) |

## Findings

### F-A [important] feedback_events に消化 (close) 経路が存在しない — 状態列の無意味化

実測: **feedback_events 全 2027 行が status='open'、closed=0**。書き込み側 (`src/state-db/feedback-projections.ts`) は常に `status: "open"` を書き、`UPDATE feedback_events` / close 経路は全 src に存在しない (impact_results の closure 機構 = projection-writer.ts:1408 は別テーブル)。帰結:

- 源条件が解消しても event は open のまま残留。特に artifact_progress_yellow (786 行) は stableId key に `{path}:{color}:{state}` を含むため**状態遷移ごとに新 open が積まれ旧 open が永久残留** (session start 時点 1051 → 当日中に 2027 へ増加)。
- 「open 件数」が観測可能性の指標として機能しない (write-only log 化)。柱3 (自動状態とフィードバック) の「見える化」が集計レベルで劣化。
- 3-bucket surface が表示ノイズを抑えているため**体感されないまま蓄積する** (今回 PO 質問が無ければ次 round まで潜伏)。

### F-B [important] actionable → 起票 routing の未接続 (第二 exit と同型の DB 側 absence)

actionable bucket (例: missing-test-coverage warn) は surface されるが、A-156 型の起票 candidate へ接続する機械経路が無い。「surface された actionable が放置されても何も起きない」— research 第二 exit (A-156 dogfood #1) の DB 側対応物。

### F-C [minor] recordGuardrailDecision が定義のみ (呼び出し元 0)

`src/guardrail/ledger.ts:45` に定義されるが callers 0。2026-06-15 L7 監査指摘 (L7-48 本番未配線) の残存か、review_evidence ベースの guardrail-invariants gate (green) への意図的置換かは**未確定 — verify-intent 要** (意図的置換なら定義の残置が dead path)。enforcement 資産の宙吊り class (A-173 F-3 と同型) として disposition 確定が必要。

### F-D [minor] skill rate telemetry (300+300 行) は既知 provenance 空洞の派生

実発火 0 (source=auto-projection、PO 2026-06-29 既知) の上に rate 集計が積まれており、信号として無意味。検証戦略雛形 (skill 縦 1 本) の完了に従属するため新規起票はしない。

## 健全確認

- refactor 候補検出は「検出 → PO 工程判断 → 実リファクタ進行」の実績を持つ成功例 (DB-trigger 動線のあるべき姿)。
- surface の 3-bucket 設計と表示上限は有効に機能 (SessionStart が 1048 件を要約し取っ手 3 件に絞れている)。
- missing-test-oracle-id は設計どおりの逆方向計測 (A-174 §4 で解明済み)。

## Routing / 起票

| finding | type | 対応 |
|---|---|---|
| F-A + F-B | `feature-gap` | **PLAN-L7-246-feedback-event-lifecycle** 起票 (消化経路 + actionable→routing 接続を 1 要件「検出→消化の lifecycle 完結」として) |
| F-C | `latent-defect` | PLAN-L7-239 (contract enforcement wiring) のスコープへ追記が自然 — 同型の「実装済み enforcement 資産の未配線/宙吊り」棚卸しに guardrail ledger を含める |
| F-D | — | 既存方針 (検証戦略雛形) に従属、新規起票なし |

A-175 台帳 #6 の監査状態を「部分」→「済 (event lifecycle 除く)」へ更新。残る未監査は provenance 実在性の全テーブル横断 (skill 縦 1 本雛形の完了後が効率的)。
