---
artifact_type: design_doc
layer: L6
status: draft
sub_doc: function-spec
plan: docs/plans/PLAN-L6-789-token-ingest-retirement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
---

# 常時 token 取り込みと model_evaluations 生成の退役の範囲 (Issue #789)

状態: 退役は未完了 (2026-10-14 時点)。rebuild / doctor / telemetry scan からの caller は残っている。FR-L1-38 の退役方針と段階 (PR1 / 昇格 / PR2) は `function-spec.md` の `projectModelEvaluations` 行、`docs/design/harness/L1-requirements/functional-requirements.md` の FR-L1-38 と「Issue #789 の段階的退役境界」、退役 oracle は `docs/test-design/harness/L7-unit-test-design.md` の「Issue #789 退役 oracle」(`CANDIDATE-U-TOKRET-001..005`) が持つ。本文書はそれらに無い「何を退役し、何を継承するか」の責務の範囲と、telemetry の表示専用化の不変条件を持つ。

方針 (PO 承認 2026-09-30): session ログから `model_runs` へ token 行を常時投入する契約と `model_evaluations` を生成する契約を退役する。harness.db の 97.5% (7,985,466 行、2026-09-30 実測) を占める token 行は読む処理が 0 件。費用は `ut-tdd telemetry scan` を手動で実行して集計を表示するだけにする (DB には書かない)。後継は v4 の作業ログ (チケット close 時の 1 回集計と L ステージ別集計、#588) で、v3 では作り直さず削るだけにする。

## 1. 退役する契約

- `projectTokenUsage` / `projectRepoScopedTokenUsage` による `model_runs` への token 行投入 (PLAN-L7-57 の WBS-L7-57-03 の ingest 部分、PLAN-L7-454 の rebuild 経路の repo スコープ ingest)。
- `projectModelEvaluations` の評価行生成と token 集計拡張 (`tokens_per_success` / `cost_per_success`)、およびそれらに対応する AC (`model_runs` の token / cost 列が token-tracker 投入行で非 NULL になること、`projectModelEvaluations` が token 集計を出すこと)。
- `telemetry scan` の DB ingest と再集計 (PLAN-L7-58-02 の migrate + `projectTokenUsage` + `projectModelEvaluations` 呼び出しと、Acceptance「token を model_runs へ ingest、model_evaluations を再集計」の部分)。

## 2. 継承する契約 (退役しない)

- 取得層: `parseClaudeSessionUsage` / `parseCodexSessionUsage` / `computeClaudeCostUsd` / `loadRuntimeSessionUsage` と、PLAN-L7-454 が加えた `loadRepoScopedRuntimeSessionUsage` (`src/state-db/token-tracker.ts`)。`telemetry scan` の表示集計が使う。session-dir 解決 (option > env > OS default) と CLI 非起動の file-scan による取得、PLAN-L7-58-01 の料金計算 (`OPENAI_PRICING` / `computeCodexCostUsd` / `pricingKeyFor` / `summarizeRunUsage`) も継承する。
- `model_runs` / `model_evaluations` の table schema (列定義、SCHEMA_VERSION)。schema 変更は範囲外で、空になった `model_evaluations` table の撤去は v4 の作業ログ設計 (#588) で扱う。
- review-evidence 由来の `model_runs` 行 (token NULL、plan 紐付け)。orphan 検査 (`src/state-db/drive-registration.ts`) が使う。
- 「tracker は CLI を再実行しない (ファイル走査のみ)」不変条件。
- PLAN-L7-423 所有の model-evaluation の domain / application / adapter / domain test の 4 ファイルと `ModelEvaluationConfigPort` / `ModelEvaluationReadPort` の型 2 件は PR1 では残し (新しい no-op facade は作らない)、PR2 で撤去する。

## 3. 退役後の `telemetry scan` の不変条件

表示専用: harness.db を開かず、書き込まない。行数一致では判定しない (既存 session 行へ旧 `projectTokenUsage` が安定 ID `stableId("token-run", runtime:session:turn)` で再投入すると行数が変わらず旧実装でも通るため)。判定は cwd を指定した node 直 spawn (`runCliIn`、`tests/cli-surface.test.ts`) 後の file 観測で行う: (a) `.ut-tdd/` を持たない一時 root で実行後に `<root>/.ut-tdd/harness.db` が存在しない、(b) migrate 済みの harness.db の sha256 と `-wal` / `-journal` sibling の不在を記録してから実行し、実行後に sha256 が一致し sibling が無く `role = 'session'` の `model_runs` 行が 0 件。(a)(b) とも session-dir に未投入の非空 session fixture (root に一致する cwd を持つ Claude / Codex の usage 行) を置いて `totalRuns` が 1 以上であることを assert し、空 fixture で oracle が素通りしないようにする。

## 4. 範囲外と残余リスク

harness.db の直接操作・VACUUM・削除はしない (縮小は rebuild だけで行う)。`model_evaluations` が空になることを前提にしていない外部 consumer がいれば影響を受けるが、Issue #789 の実測で reader は 0 件。

## 5. 責務どうしの依存

caller / SQLite read の撤去 (PR1) は Issue #848 の退役判定分岐 (l6-fr-coverage) が main にあることを前提とする。4 ファイルと型 2 件の撤去 (PR2) は、PR1 の後の source 変更なしの昇格 PR (候補の `U-TOKRET-001..005` への昇格) の後に行う。
