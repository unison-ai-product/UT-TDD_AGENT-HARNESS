---
plan_id: PLAN-RECOVERY-12-design-doc-reality-backmerge
title: "PLAN-RECOVERY-12 (recovery): 設計 doc 実態乖離の一括 back-merge — L5 physical-data 未文書テーブル / L6 function-spec stale model ID / governance 正本欠落 (issue #85)"
kind: recovery
layer: cross
drive: agent
status: confirmed
route_signal: regression_dev
route_mode: recovery
created: 2026-07-17
updated: 2026-07-21
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
backprop_decision: not_required
backprop_decision_reason: "実装先行で doc が未追随になった乖離の back-merge であり、新規 L0/L1 要件ではない。各 doc の SSoT 記述を実装事実へ収束させ、再発防止は既存 gate (model-id-ssot-drift) の対象拡張で追跡する。"
agent_slots:
  - role: aim
    slot_label: "AIM — governance README 未分類 23 件の分類提案 (最終分類判断は PO 確認)"
  - role: se
    slot_label: "SE — L5 physical-data への schema back-merge と L7-256 gate 対象拡張"
  - role: qa
    slot_label: "QA — gate 拡張の負例 (stale literal 検出) real-repo regression"
  - role: tl
    slot_label: "TL — doc-only 変更の SSoT 整合レビュー (doc↔schema↔lint 三点一致)"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-12-design-doc-reality-backmerge.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/model-id-doc-drift.ts
    artifact_type: source_module
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L3-05-harness-telemetry-closure.md
    - docs/plans/PLAN-L7-256-model-id-ssot-drift-gate.md
    - docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
review_evidence:
  - reviewer: blind-reviewer
    review_kind: cross_provider
    reviewed_at: "2026-07-21T12:48:00+09:00"
    tests_green_at: "2026-07-21T12:53:00+09:00"
    verdict: approve
    worker_model: claude-sonnet-5
    reviewer_model: gpt-5.6-sol
    scope: "worktree 変更一式 (L5 physical-data 4 テーブル back-merge + 列型注記 / L6 function-spec stale model ID の MODEL_IDS 参照化 / src/lint/model-id-doc-drift.ts 新設 + doctor full profile 配線 / governance README・repository-structure 是正) を `ut-tdd codex --role blind-reviewer` (gpt-5.6-sol) が blind review。初回 FLAG 2 点 (列型注記欠落 / AC の live-tree 実行経路が 0 tests) → 是正 → 再 FLAG 1 点 (3 env 変数=cwd 経路は workspace-roots.ts 契約違反で第三者再実行不能) → mktemp -d detached copy 経路へ是正 → 再々 review で reviewer 自身が AC 記載コマンドをそのまま実行し 8/8 green (exit 0) を再現、契約適合 (snapshot root ≠ cwd) も確認して判定 PASS。"
    green_commands:
      - kind: unit_test
        command: "mktemp -d の独立ディレクトリへ .claude/ と docs/ を実体コピーし UT_TDD_HEAD_SNAPSHOT_ROOT に指定、UT_TDD_TEST_EXECUTION_ROOT/UT_TDD_TEST_FENCE_ROOT=live tree cwd で bunx vitest run tests/model-id-ssot-drift.test.ts (8 tests、負例 regression 含む)。commit 14dda22f 後に正規経路 bun scripts/run-vitest-snapshot.ts tests/model-id-ssot-drift.test.ts でも 8 passed (8) を再確認"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-21T12:53:00+09:00"
        evidence_path: tests/model-id-ssot-drift.test.ts
        output_digest: "sha256:b9e0219af764cb2c589be9ee4dd77548c934bd40ebe405d553ac3ef64db768f7"
        anchor_commit: 14dda22fc6aab513ed982e56c6161964d725076f
---

# PLAN-RECOVERY-12 (recovery): 設計 doc 実態乖離の一括 back-merge

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/85

## 背景 (2026-07-17 設計実態フルチェック監査での実測)

設計ドキュメント本文と実装の突き合わせレビュー (機械検出でカバーされない内容照合)
で、「実装先行・doc 未追随」型の乖離が複数確認された。いずれも本番影響なしだが、
L5 物理データ doc と governance 正本が SSoT として実態を語れていない。

## 是正対象

1. **L5 physical-data.md — 未文書テーブル 4 件 + 列差分**
   - `issue_queue` / `trouble_events` / `retry_events` / `improvement_log`
     (`src/schema/harness-db-tables-core.ts:365-420`、由来 PLAN-L3-05) の
     PK・列・型・index・invariant を §9.1 系へ正式 back-merge。
   - `test_runs` / `test_cases` / `test_results` / `test_artifact_edges` /
     `automation_assets` / `model_runs` (token telemetry 列) の doc 列挙を実装列へ追随。
   - `feedback_events.source_color` を §9.1 表へ追記し §9.5 prose と一本化。
2. **L6 function-spec.md — stale model ID literal**
   - `function-spec.md:681-683,726` の `gpt-5.5` / `claude-sonnet-4-6` / `gpt-5.4`
     を現行値 (`gpt-5.6-sol` / `claude-sonnet-5` / `gpt-5.6-luna`) へ更新。
     再発防止のため生 literal でなく `MODEL_IDS` シンボル参照で記述する。
   - `src/task/tier-router.ts:9-10,146` コメントの同 literal 残留も同時に是正。
   - **gate の穴**: PLAN-L7-256 (model-id-ssot-drift-gate、confirmed) の検査対象に
     この doc 箇所が入っていなかった。gate の対象へ L6 doc の model ID 記述を追加し、
     負例 (stale literal を仕込むと violation) を real-repo regression で実証する。
3. **repository-structure.md — root `skills/` 欠落**
   - canonical tree へ root `skills/` を追加 (現状は `docs/skills/` の「[予定]」行のみ)。
   - doctor `tracked-canonical` が欠落を pass した検査粒度を確認し、必要なら追跡 IMP 起票。
4. **governance/README.md — 正本ナビゲーションの欠落**
   - `ut-tdd-agent-harness-extraction-plan_v0.1.md` (CLAUDE.md Read Order 正本) を
     正本リストへ追加。行 16/17 の番号 "7." 重複を修正。
   - 未分類 23 ファイルは機械的に埋めず、分類提案リスト (正本/参照のみ/アーカイブ) を
     本 PLAN に記録して PO 確認へ回す (最終分類は PO 判断)。
5. **agent-slots の参照先消失**
   - `agent-slots.md:31,84` / `src/runtime/agent-slots.ts:9` が参照する
     「`.claude/CLAUDE.md`「上限 8」」記述が現行 doc に存在しない。並列上限記述の
     要否は設計判断 (PO 確認) とし、復元 or 参照文言の書き換えのどちらかで閉じる。
6. **work-guard override marker の実態記述**
   - `.claude/CLAUDE.md` Guard Rules へ、marker が発行者セッション限定でなく
     「次の foreign edit 呼び出し全般で早い者勝ち消費」である実態を 1 行明記
     (実測: 2026-07-17T01:33:51 別セッションによる横取り消費、
     `.ut-tdd/logs/foreign-edit-overrides.jsonl`)。機構変更は PLAN-L7-419 側の
     スコープであり本 PLAN は記述の精度向上のみ。

## 是正方針 (Step 案)

### Step 1: [並列] L5 physical-data back-merge
- 対象 1 の schema back-merge。doc 記述は `src/schema/harness-db-tables-core.ts` の
  実装列を正として転記し、由来 PLAN (L3-05) を出典として明記する。

### Step 2: [並列] governance / L6 doc 是正
- 対象 2 (doc 部分)・3・4・5・6 の doc 修正。対象 4 の未分類 23 件は分類提案までに
  留め、PO 採択後に別 slice で反映する。

### Step 3: [直列] model-id gate 対象拡張
- 直列理由 = **downstream_dependency** (Step 2 で literal を現行化した後でないと
  gate 拡張が既存 doc で即 Red になる)。L7-256 gate の検査対象へ L6 doc を追加し、
  負例 regression を追加する。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。`ut-tdd plan lint` / doctor (readability /
  sub-doc-schema-integrity / tracked-canonical / rule-drift) / vitest green を確認。

## AC

- [x] physical-data.md に 4 テーブルの PK・列・型・index・invariant が実装
      (`harness-db-tables-core.ts` の `col()`/`pk()` 型を正本) と一致して記載され、
      列差分 7 系統が解消 (doc↔schema 突合で差分 0)。**型明記 (blind review FLAG 是正)**:
      §2.7/§9.1/§9.4 の対象行は列名直後に `(TYPE)` を丸括弧で付記 (backtick 内には
      列名のみを保持し、`db-projection-coverage` gate の backtick 単位突合を壊さない
      形式)。凡例は §9.1 冒頭に明記。
- [x] function-spec.md / tier-router.ts コメントに旧 model ID literal が残らない
      (`grep gpt-5.5` 等で 0 件)。
- [x] model-id-ssot-drift gate が L6 doc の stale literal を検出する負例 regression が
      green (prose 主張でなく real-repo test、coding ≠ substance)。**実行経路の明記
      (blind review FLAG 是正、2 回目)**: 本 repo の全 vitest は `tests/global-setup.ts`
      (PLAN-L7-421 test-hygiene-live-tree-fence) 配下にあり、per-file opt-out は無い。
      canonical (正規) 経路は `bun run test -- tests/model-id-ssot-drift.test.ts`
      (snapshot runner、commit 済 HEAD tree を検証。post-commit のみ有効、
      「HEAD-clone footgun」により未コミット差分は検証しない。**commit 後は canonical
      runner でこの経路の再確認が必要**)。
      未コミット時のローカル pre-commit 検証は、`tests/support/workspace-roots.ts`
      の `headSnapshotRoot()` が `UT_TDD_HEAD_SNAPSHOT_ROOT === process.cwd()` を
      明示拒否する契約 (独立した detached read root を要求、fence 自体は変更しない) を
      満たす必要がある。3 env var を全て cwd に揃える形は、シェルによって `$(pwd)`
      (POSIX 形式) と `process.cwd()` (Windows 形式) の文字列表現が食い違い偶然
      `!==` を満たしてしまう不安定な抜け穴であり、正しいシェル (パスが真に一致する環境)
      では `headSnapshotRoot()` が正しく fail-close する (実測: 0 tests / exit 1)。
      正しい再現手順は、`.claude/`・`docs/` (このテストファイルが repoRoot 経由で
      読む唯一の対象) を独立した一時ディレクトリへ実体コピーし、そこを
      `UT_TDD_HEAD_SNAPSHOT_ROOT` に指定する:
      ```bash
      DEST="$(mktemp -d)" && mkdir -p "$DEST/.claude" "$DEST/docs" \
        && cp -r .claude/. "$DEST/.claude/" && cp -r docs/. "$DEST/docs/" \
        && UT_TDD_TEST_EXECUTION_ROOT="$(pwd)" UT_TDD_TEST_FENCE_ROOT="$(pwd)" \
           UT_TDD_HEAD_SNAPSHOT_ROOT="$DEST" \
           bunx vitest run tests/model-id-ssot-drift.test.ts
      ```
      この一発コマンドを bash で実行し `tests/model-id-ssot-drift.test.ts` 8/8 green
      (新規 (g)(h) 含む、stale literal 注入で `findStaleModelIdLiterals` が violation を
      返す負例実測込み) を確認した。同じコメントブロックを
      `tests/model-id-ssot-drift.test.ts` 冒頭にも記載し、第三者が再現できる。
- [x] repository-structure.md canonical tree に root `skills/` が記載される。
- [x] governance/README.md の正本リストに extraction-plan が載り、番号重複が解消。
      未分類 23 件の分類提案リストが本 PLAN に記録される。
- [ ] doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。

## 未分類 governance doc 分類提案 (対象 4、PO 確認待ち)

`docs/governance/README.md` の「現行の正本」「参照のみ」に載らない未分類ファイルを棚卸しした。
issue #85 当時の推定は 23 件だったが、本 PLAN で `ut-tdd-agent-harness-extraction-plan_v0.1.md`
を正本へ昇格させた後の現時点で機械的に数え直すと **24 件**である
(推定 23 件 + 昇格済 extraction-plan 1 件の重複カウント差分)。以下は分類**提案**であり、
README 本体の分類は変更しない (最終分類は PO 判断、本節は提案の記録のみ)。

| ファイル | 提案分類 | 根拠 |
|---|---|---|
| `audit-lens-catalog.md` | 参照のみ | 監査で使う lens カタログ (横断参照資料、単発監査ではない)。 |
| `conditional-backfill-decision-audit-2026-06-22.md` | アーカイブ | 日付付き単発監査記録 (過去証跡)。 |
| `context-efficiency-audit-2026-07-09.md` | アーカイブ | 日付付き単発監査記録。 |
| `deliverable-trace-debt-audit.md` | 参照のみ | 日付なし継続 debt 台帳 (単発監査でなく運用参照)。 |
| `design-decision-elicitation.md` | 参照のみ | CLAUDE.md が PO ルールとして継続参照する運用手順書だが、V-model backbone (concept/requirements/ADR/repo-structure/vmodel-*) ではない。 |
| `design-doc-implementation-readiness.md` | 参照のみ | 設計→実装 readiness 判定基準の参照資料。 |
| `forward-convergence-legacy-debt-audit.md` | アーカイブ | 日付なしだが内容が特定時点の legacy debt 監査 (過去証跡)。 |
| `harness-v2-quality-uplift-strategy.md` | 参照のみ | v2 品質戦略の運用参照資料 (継続方針)。 |
| `harness-v2-update-strategy.md` | 参照のみ | v2 更新戦略の運用参照資料。 |
| `reverse-fullback-backprop-audit-2026-06-22.md` | アーカイブ | 日付付き単発監査記録。 |
| `route-mode-kind-debt-audit-2026-07-02.md` | アーカイブ | 日付付き単発監査記録。 |
| `runtime-parity-l0-l3-design-audit-2026-06-02.md` | アーカイブ | 日付付き単発監査記録。 |
| `scope-integrity-and-evasion-taxonomy.md` | 参照のみ | taxonomy 参照資料 (継続利用)。 |
| `version-up-route-debt-2026-07-10.md` | アーカイブ | 日付付き debt スナップショット。 |
| `vmodel-agent-contracts.md` | 正本候補 | `physical-data.md` §9.9 `agent_contracts` table の authoring source として実引用されている (vmodel 正本ファミリー、vmodel-upgrade-schedule 等と同格)。 |
| `vmodel-document-disposition-catalog.md` | 正本候補 | `physical-data.md` §9.15 `document_dispositions` 系の authoring source として実引用。 |
| `vmodel-document-scale-profiles.md` | 正本候補 | `physical-data.md` §9.15.4 `document_scale_profiles` の authoring source として実引用。 |
| `vmodel-item-target-ledger.md` | 正本候補 | `physical-data.md` §9.15.1 `vmodel_item_target_edges` 系の authoring source として実引用。 |
| `vmodel-refactor-qa-release-gates.md` | 正本候補 | vmodel gate 系 backbone doc (既存正本 4 件と同ファミリー)。 |
| `vmodel-role-contracts.md` | 正本候補 | vmodel backbone doc (役割契約の authoring source)。 |
| `vmodel-semantic-item-catalog.md` | 正本候補 | `physical-data.md` §9.15.1 `vmodel_semantic_items` の authoring source として実引用。 |
| `vmodel-semantic-item-self-assessment.md` | 正本候補 | `physical-data.md` §9.15.1 `semantic_assessments` (self-assessment catalog) の authoring source として実引用。 |
| `vmodel-source-manifest.md` | 正本候補 | `physical-data.md` §9.15.2 source manifest の authoring source として実引用。 |
| `vmodel-source-target-edges.md` | 正本候補 | `physical-data.md` §9.15.1 `vmodel_source_target_edges` の authoring source として実引用。 |

**所見**: `vmodel-*.md` 系 10 件のうち 8 件が `physical-data.md` から authoring source として
実引用されているにもかかわらず README の「現行の正本」に載っていない。既存正本 4 件
(`vmodel-upgrade-schedule.md` / `vmodel-activation-profiles.md` / `vmodel-document-catalog.md` /
`vmodel-typed-spec-definitions.md`) と同格の扱いが必要ではないかという設計判断が必要。
本 PLAN では README 側の分類は変更せず、上表を提案として記録するに留める (PO 確認事項)。
機械追跡は `docs/improvement-backlog.md` IMP-178 (`tracked-canonical` 検査粒度の限界) を参照。

## 設計判断記録 (agent-slots 並列上限記述、対象 5)

- **論点**: `src/runtime/agent-slots.ts` (`DEFAULT_MAX_PARALLEL = 8`) と
  `docs/design/harness/L6-function-design/agent-slots.md:31,84` が参照する
  「`.claude/CLAUDE.md`「上限 8」」という記述が、現行 `.claude/CLAUDE.md` に存在しなかった
  (参照先消失)。閉じ方は 2 通り: (A) `.claude/CLAUDE.md` へ並列上限の記述を復元する、
  (B) 設計 doc / 実装コメント側の参照文言を「実装コードが正本」に書き換えて参照を削除する。
- **採択**: **(A) 復元**。`.claude/CLAUDE.md` に新設した `## Parallel Task Limit` 節で
  「依存しないタスクは並列投入、default 上限 8 (`DEFAULT_MAX_PARALLEL`,
  `src/runtime/agent-slots.ts`)」を明記した。
- **理由**: `.claude/CLAUDE.md` は Claude Code のランタイム運用ポリシー正本であり、
  「並列実行数の目安」は実装コード (`agent-slots.ts`) の内部定数だけでなく、エージェント
  (Claude Code セッション) が実際にタスクを並列投入する際の運用判断基準として本来
  ここに書かれているべき情報である。(B) (参照除去) は既存の 2 箇所の設計 doc 引用
  (`agent-slots.md:31,84`) と実装コメント (`agent-slots.ts:9,54`) を両方書き換える必要があり、
  「実装先行で doc が追随していない」という本 PLAN の是正方針 (実装を正として doc を追随させる)
  とも整合しない。復元の方が影響範囲が小さく、既存の複数箇所の参照を活かせる。
  PO 事後確認可 (可逆な doc 追記であり、破壊的変更ではない)。
