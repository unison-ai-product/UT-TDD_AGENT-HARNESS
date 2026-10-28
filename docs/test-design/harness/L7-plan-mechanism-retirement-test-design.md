---
title: "L7 plan mechanism retirement test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/plan-mechanism-retirement.md
status: confirmed
updated: 2026-10-28
issue: 1364
---

# PLAN 機構の縮退 テスト設計 (issue #1364)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/plan-mechanism-retirement.md` である (未実装の目標契約)。
本書はその §3 データの扱い、§4 fail-open の check、§5 Issue への付け替え、§6 Pack、§7 外部 API、§8 の削除前の規則 (#1430、本書 §6)、§9 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-PLANRET-*`) だけを宣言する。正式化は設計書保護 gate の三段階 (L6 §8) で、各段の Red PR が引用し、src を含まない昇格 PR で `U-PLANRET-*` へ 1:1 で昇格する。

## 2. fixture

- 純粋関数の行 (001〜007、009〜013) は、入力を直接渡す。実 repo のファイルは読まない。`docs/plans` を持たない temp directory を repo root として使う。
- DB の行 (008) は temp directory に harness.db を作り、registry に登録の無い表を手で作ってから `migrate` と rebuild の truncate を流す。実際の `.ut-tdd/harness.db` と台帳 DB には触れない。
- 移行の行 (019、020) は、旧版の DDL を手で書き直さない。その段の base commit で `schemaDdl()` が出す文字列をそのまま fixture に保存し、temp の harness.db をそれで作る。実際の `.ut-tdd/harness.db` には触れない。
- 静的な行 (014〜018) は実 repo の tracked file を読むので、`src/doctor/test-repository-isolation.ts` の登録が要る。
- 1 つの行は規則を 1 本だけ殺すように、入力の書き方を 1 つだけ変える。

## 3. oracle 宣言の一覧

| ID | 段 | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- | --- |
| `CANDIDATE-U-PLANRET-001` | S3 | `parseIssueUrl` に (a) `https://github.com/o/r/issues/12`、(b) `https://github.com/o/r/issues/0`、(c) `.../issues/012`、(d) `.../pull/12`、(e) `.../issues/12/`、(f) `.../issues/12#x`、(g) ` https://github.com/o/r/issues/12`、(h) `http://github.com/o/r/issues/12`、(i) `https://example.com/o/r/issues/12`、(j) `PLAN-L7-1-x` | (a) だけが `{ owner: "o", repo: "r", number: 12 }`、他は `null` | 0 や先頭 0 を受ける / PR の URL を受ける / 末尾や前後の空白を許す / http や他の host を受ける / PLAN ID を受ける |
| `CANDIDATE-U-PLANRET-002` | S3 | right-arm static の evidence で、defer の case に (a) `reason` と Issue URL の `issue`、(b) `reason` と `plan_id: PLAN-L9-1-x` だけ (repo に `docs/plans` は無い)、(c) `reason` と不正な `issue` | (a) 違反 0 件、(b) と (c) は `stale defer <id>` | `plan_id` を受け続ける / `issue` の形式を見ない / `docs/plans` の実在で判定する |
| `CANDIDATE-U-PLANRET-003` | S3 | improvement feedback の `routed_to` に (a) Issue URL、(b) `PLAN-L7-1-x` | (a) 違反 0 件、(b) は Issue URL でない違反 | PLAN ID を受け続ける |
| `CANDIDATE-U-PLANRET-004` | S3 | G14 の VALUE case で、design root の `L0-planning/charter.md` (frontmatter `layer: L0`、`doc_type_id: DOC-L0-CHARTER`) がある repo に、(a) `DOC-L0-CHARTER` を引用する行、(b) `PLAN-L0-01` を引用する行、(c) L0 を引用しない行 | (a) 違反 0 件、(b) `trace target missing PLAN-L0-01` と VALUE の L0 未引用、(c) VALUE の L0 未引用で、文言は `doc_type_id` の引用を求める | `docs/plans/PLAN-L0-*` を読み続ける / `doc_type_id` を L0 以外の文書から拾う |
| `CANDIDATE-U-PLANRET-005` | S3 | 文書処分の正規化に (a) `deferred` で `issue` が Issue URL、(b) `deferred` で `plan_id` だけ、(c) `update` で `targets` も `issues` も空、(d) 既に記録された `plan_ids` を持つ記録の digest の再計算 | (a) ok、(b) `applicability.issue` の欠落、(c) `targets_or_issues` の欠落、(d) 記録済みの digest と一致する | 新しい記録に `plan_id` を許す / 既存の digest を変える |
| `CANDIDATE-U-PLANRET-006` | S4 | `renderPrTraceBlock` / `validatePrTraceBody` に (a) `route_mode`・`subject_head`・`base_sha`・`issue_number` だけ、(b) (a) に `plan_id` を足した本文、(c) `issue_number` の欠落 | (a) marker `ut-tdd:trace/v2` の block を返し検証 ok、(b) 未知の key の finding、(c) `missing-issue-number` | `plan_id` を必須に残す / v1 の marker を出す / 未知の key を黙って通す |
| `CANDIDATE-U-PLANRET-007` | S4 | custody receipt の検証に (a) v2 で `planId` / `planRevision` を持たない receipt、(b) (a) に `planId` を足した receipt、(c) `prNumber` だけ異なる receipt | (a) ok、(b) 未知の field で拒否、(c) `prNumber` の subject mismatch。mismatch の比較に `planId` / `planRevision` の組は無い | PLAN の field を必須に残す / 未知の field を通す / PR の束縛を外す |
| `CANDIDATE-U-PLANRET-008` | S7 | temp の harness.db に、registry に無い `plan_registry` (行 3 件) と `schedule_entries` (行 2 件) を作り、`migrate` を 2 回流してから rebuild の truncate (`clearRebuildableProjectionTables`) を流す | 2 表は存在し、列と行数 (3 件、2 件) が変わらない。`missingTables` と `rowCounts` に 2 表が出ない。`migrate` の戻り値の `tables` には残る | 登録の無い表を DROP・ALTER・DELETE する / 名前つき再作成の一覧に PLAN 用の表を足す |
| `CANDIDATE-U-PLANRET-009` | S2 | `analyzeDriveDbRegistration` に (a) PLAN の field を持たず orphan が全部 0 の stats、(b) (a) の `workflowOrphans=1`、(c) 全表 0 件の stats | (a) ok、(b) `workflow_orphans=1`、(c) ok (空の repo を赤にしない) | orphan を PLAN の件数で飛ばす / 存在要求を残す |
| `CANDIDATE-U-PLANRET-010` | S2 | `analyzeDbCurrency` に (a) DB のある stats、(b) `null` | (a) ok で違反の種類に PLAN 由来のものが無い、(b) `missing_db` | PLAN の比較を残す / DB 不在を通す |
| `CANDIDATE-U-PLANRET-011` | S2 | `analyzeL6Completion` に (a) frontmatter `issue: 12` の L6 文書、(b) `plan: docs/plans/PLAN-L6-1-x.md` だけの文書、(c) `issue: 0` の文書 | (a) 所有者あり、(b) と (c) は所有者なし。結果に PLAN の draft / review の項目が無い | `plan:` を所有者として数え続ける / 0 を受ける |
| `CANDIDATE-U-PLANRET-012` | S2 | (a) `loadDeferLedger` を、`docs/plans/x.md` と `docs/design/y.md` の両方に `explicit_l7_defer` の行を置いた repo で流す、(b) `computeOutstandingWork` を同じ repo で流す、(c) `loadSubDocSectionStructureInput` を、`sub_doc: report` を持つ `docs/plans/x.md` と design root の文書を置いた repo で流す | (a) `docs/design/y.md` 由来の行だけ、(b) PLAN の件数の field が無く `openDefers` だけ、(c) design root の文書だけが対象 | `docs/plans` を走査し続ける / 走査対象を空にする |
| `CANDIDATE-U-PLANRET-013` | S2 | `ddd-tdd-rules` の解析に、`tdd_red_required: true` で `red_at` の無い confirmed PLAN 相当の文書を `docs/plans/` に置いた repo | `red-first-evidence` の違反が 0 件で、他の規則の結果は変わらない | 規則を残す / 他の規則まで外す |
| `CANDIDATE-U-PLANRET-014` | S4・S5 | `src/cli.ts` の command 定義を解析する (help の出力は使わない) | `github project`・`github binding` の command が無い。`github pr render`・`elicit *`・`workflow *` と §5.2 の任意の `--plan` の command に `--plan` の option が無い。`elicit record`・`workflow *` は `--issue` を必須にする | command を残す / `--plan` を任意で残す |
| `CANDIDATE-U-PLANRET-015` | S1 | doctor の check 定義と `.github/workflows/harness-check.yml` | `merged-plan-status`・`plan-body-substance`・`plan-completion-drift`・`green-command-digest` と PLAN の `review-evidence` の check ID が full doctor の出力 ID に無い。workflow と src に `--strict-green-command-digest` が無い | check や flag を残す / 一部だけ外す |
| `CANDIDATE-U-PLANRET-016` | S4 | `.github/workflows/review-attestation.yml` | `workflow_dispatch.inputs` に `plan_id` と `plan_revision` が無く、`pr` は必須のまま。`UT_TDD_CUSTODY_PLAN_ID` / `UT_TDD_CUSTODY_PLAN_REVISION` の env が無い | 入力を残す / PR の束縛を外す |
| `CANDIDATE-U-PLANRET-017` | S6 | `docs/templates/**/*.md` の frontmatter、`src/setup/authoring-template-inventory.ts`、`scripts/pack-canary-acceptance.mjs` | `plan:` を持つ雛形が 0 本で、§6 の 50 本は `issue:` を持つ。inventory に `docs/templates/plan/` が無い。canary に `plan draft` / `plan lint` の実行が無い | 一部の雛形に `plan:` を残す / canary が PLAN を起票し続ける |
| `CANDIDATE-U-PLANRET-019` | S3 | 旧版 DB の fixture: S3 の base commit の `schemaDdl()` が出す実際の DDL で全表を作り、`user_version` を旧版 (29) にし、`plan_registry` に行 2 件、`vmodel_item_target_edges` に旧形の行 1 件を入れた temp の harness.db。これに (1) `migrate`、(2) defer で `issue` を持ち `plan_id` を持たない item target の行を含む catalog から vmodel の投影を流す rebuild、(3) もう一度 `migrate` を流す | (1) の後: `sqlite_master` の `vmodel_item_target_edges` の DDL に `plan_id` と `plan_registry` への外部キーが無く、`issue` 列と「defer なら `issue` が NULL でない」CHECK がある。`plan_registry` の表と行 2 件は (1) で変わらない。(2) は例外なく終わり、defer の行が `issue` を持って 1 件投影される。(3) は `applied=false` で、`sqlite_master` の全 DDL と全表の行数が (2) の後と同じ。`issue` が NULL の defer 行を (2) の後に挿入すると CHECK で拒否される | 再作成を省いて registry の定義だけ変える (旧い CHECK か未定義の列で (2) が落ちる) / 版を見ずに毎回作り直す ((3) で行が消える) / 新しい CHECK を付け忘れる / PLAN 用の表を巻き込んで DROP する |
| `CANDIDATE-U-PLANRET-020` | S4 | 旧版 DB の fixture: S4 の base commit (S3 の後) の `schemaDdl()` が出す実際の DDL で作り、`user_version` をその版にし、`github_review_lane_receipts` に `plan_id` を持つ旧形の行 1 件、`plan_registry` に行 2 件を入れた temp の harness.db。これに (1) `migrate`、(2) custody v2 の receipt (`plan_id` 無し) を含む repo から rebuild、(3) もう一度 `migrate` を流す | (1) の後: `github_review_lane_receipts` の DDL に `plan_id`・`plan_revision` が無く、UNIQUE が `lane`・`subject_head` の組。`plan_registry` の表と行 2 件は (1) で変わらない。(2) は例外なく終わり、receipt の行が投影される。同じ `lane`・`subject_head` の行の 2 件目の挿入は UNIQUE で拒否される。(3) は `applied=false` で、DDL と行数が (2) の後と同じ | 再作成を省く (旧い NOT NULL で (2) が落ちる) / 版を見ずに毎回作り直す / UNIQUE を落とす / PLAN 用の表を巻き込んで DROP する |
| `CANDIDATE-U-PLANRET-018` | S7 | src・scripts・`.github` の tracked file | (a) L6 §3 の PLAN 用の表の名前を含む SQL 文字列が無い、(b) `harness-ledger.db` の path が無い、(c) PLAN 用の表と台帳への `DROP`・`VACUUM`・`DELETE` が無い、(d) `docs/plans` の実在を確かめるコードが無い、(e) Project の item を消す GraphQL mutation (`deleteProjectV2Item` など) が無い | 読み手や書き手を残す / 退役の名目で破壊的な操作を足す |

## 4. 昇格と引用の方針

- 各段の Red PR は、その段の行 (表の「段」の列) の候補 ID をテスト名に引用する。1 本の PR が別の段の行を引用しない。
- S1・S5・S8 のように振る舞いを足さない段の行 (015、014 の S5 部分) は、退役の PR で `it` として入れてよい (退役前の main では成り立たないので `it.fails` の Red にしない)。
- 019 は S3 の PR、020 は S4 の PR が、Red (`it.fails`) として先に入れる。どちらも S7 の前の中間段で rebuild が通ることを確かめる行である。
- 008 と 018 は S7 の PR が入れる。S7 より前は、PLAN 用の表がまだ registry にあるので成り立たない。

## 5. 範囲外

- `docs/plans` の物理削除そのもの (#1365 の完了条件が持つ)。§6 は削除の前提を整えるだけで、削除はしない。
- 過去の PR 本文 (trace v1)・custody v1 の receipt・記録済みの文書処分の書き換え (L6 §10)。
- GitHub の Project 側のデータ (API を呼ぶ検証はしない)。

## 6. 削除の前に PLAN から外す実 repo テスト (#1430)

設計文書 §8 の「削除 (#1365) の前」の規則を検証する。対象は、`docs/plans` を除いた tree で赤になるか、PLAN の有無で黙って飛ばされる実 repo テスト 5 件である。

### 6.1 実測 (2026-10-28、`origin/main` `36482acad`)

`docs/plans` を index と作業ツリーの両方から外した tree で `rebuildHarnessDb` (`:memory:`) と relation graph の loader を node から直接流し、PLAN のある tree と比べた。**この節の数値は内部関数 (rebuild / loader) の出力の件数計測であり、テストを実行した結果でも、テストの assertion に到達した証拠でもない** (vitest と doctor は流していない)。テストの赤・空振りの証拠は §6.4 のとおり付け替えの PR が別に取る。

- rebuild は `ok=true` で終わる。PLAN 由来の表 (`plan_registry`、`schedule_entries`、`execution_readiness_projection`、`review_evidence_registry`、`roadmap_gate_progress`、`drive_runs`、`model_runs`、`skill_recommendations`、`skill_invocations`、`test_runs`) は 0 件になる。`roadmap_rollups` の `program` は `total_gates=0`、`covered_bands=0` になる。
- PLAN に依らず残る: `test_cases` 4033 件、`graph_nodes` 1573 件、design-quality の coverage 8 行 (全て `value=0`、`passed`)、`descent_obligations`、`automation_assets`、`document_catalog_entries`、`spec_rag_closure_entries` (VMS-004 は `green`・`closed`)、issue queue と承認 guardrail と improvement log の行。2 回目の rebuild の行数は 1 回目と一致する (hook と feedback の 4 表を除く)。
- relation graph: `plan` node と `derives-from`・`generates` の edge が 0 件になり、`pairs` 82 件と `covered-by` 950 件、`requirement` node 51 件が残る。stale-edge は 0 件のまま。
- 通過証明書の loader は L3 の設計文書 1 本を読み、11 mode で `ok=true` になる。

### 6.2 扱いの決定

| # | テスト | 決定 | 根拠 (守る性質と PLAN の関係) |
| --- | --- | --- | --- |
| 1 | `tests/review-green-command-projection.test.ts` | 退役 (ファイルごと) | 守る性質は「PLAN の `review_evidence[].green_commands` が `test_runs` へ投影される」で、入力は PLAN の台帳そのものである。§4 で `review-evidence` は退役し、投影のコードも S7 で消える。ファイルを選ぶ `package.json` の `test:fast`・`test:db`・`test:windows` と、`L7-windows-ci-single-snapshot-test-design.md` の集合 `W` から同じ PR で外す |
| 2 | `tests/projection-writer.test.ts` の「auto-populates relation, profile, document export, and test catalog projections on rebuild」 | 入力は実 repo のまま、PLAN の assertion だけ退役 | 守る性質は「rebuild が relation・profile・document export・test catalog・spec RAG の投影を自動で埋める」で PLAN と無関係である。planned edge (PLAN の draft の `generates`)、`schedule_entries`、PLAN を対象にする spec / activation / schedule の行の assertion は PLAN の台帳を見ているので外す |
| 3a | 同ファイルの「rebuildHarnessDb is atomic ...」 | PLAN 以外の表へ入力を付け替え | 守る性質は rebuild の原子的 rollback で PLAN と無関係である。失敗を注入する表を `plan_registry` から、PLAN に依らず行のある `test_cases` に替える。oracle は `L7-unit-test-design.md` の `U-DBPROJ-ATOMIC-01` の行を同じ 1 行のまま改訂する |
| 3b | 同ファイルの「projects design-quality coverage rows from the real repo rebuild」 | 早期 return を外すだけ | 設計品質の 8 check の投影は PLAN と無関係で、PLAN の無い tree でも 8 行が `passed` になる (§6.1) |
| 3c | 同ファイルの「rebuildHarnessDb deterministically projects plans and Phase3 outputs ...」 | 実 repo のまま、PLAN の assertion だけ退役 | 守る性質は再 rebuild の決定性と Phase3 の feedback 系の投影で PLAN と無関係である。`plan_registry`、roadmap の 3 表、`review_evidence_registry`、`drive_runs`、`model_runs`、skill の推薦と起動、`plan_registry` との結合、PLAN を名指しする行は PLAN の台帳を見ているので外す |
| 4 | `tests/drive-model-passage.test.ts` の U-DMP-003 | 早期 return を外すだけ | loader は #1355 で L3 の設計文書だけを読む。上流スケジュールの PLAN の実在を見る分岐は、守る性質 (11 mode の通過証明書) と無関係な残骸である |
| 5 | `tests/relation-graph-loader.test.ts` の実 repo の stale-edge fence | 実 repo のまま、空振りしない条件を足す | 守る性質は「loader が作る edge の端点が全て実在する」で PLAN と無関係である。PLAN を除くと `derives-from`・`generates` の edge が消えて守る範囲が狭くなるので、PLAN に依らない edge (`pairs`・`covered-by`) と FR レジストリ由来の `requirement` node が 1 件以上あることを要求する。PLAN の edge の端点は既存の temp repo の fixture のテストが S7 まで守る |

`src/graph/loader.ts` の「docs/plans 不在で throw する」というコメントは実装 (`loadReviewPlans` は `[]` を返す) と食い違うので、#1430 の実装 PR で直す (oracle は持たない)。

### 6.3 oracle 宣言

| ID | 段 | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- | --- |
| `CANDIDATE-U-PLANRET-021` | 削除前 | 実 repo の HEAD で `rebuildHarnessDb` (`:memory:`) を 1 回流す | `ok=true`。graph・impact rule・verification / MCP / document export の profile と trigger と run と dataset・`test_cases`・`test_artifact_edges`・`artifact_progress`・`spec_defs`・`document_catalog_entries`・document scale profile・`spec_rag_closure_entries` が各 1 件以上。`tests/handover.test.ts` の oracle ID 付きの test case (継承した oracle の行)、`DOC-L4-DATA` の catalog 行、`enterprise` × `DOC-L4-REPORT` の `adopt`、VMS-004 の typed spec と `green`・`closed` の RAG 行がある。PLAN の ID・planned edge・`schedule_entries`・activation の行を assertion に使わない | 投影を 1 つ外す / PLAN の行を条件に残す (PLAN の無い tree で赤になる) |
| `CANDIDATE-U-PLANRET-022` | 削除前 | 実 repo の HEAD で `migrate` と `rebuildHarnessDb` を流す。`docs/plans` の実在を見ない | design-quality の coverage の `subject_id` の集合が `DESIGN_QUALITY_CHECK_IDS` と一致し、全行が `value=0`・`threshold=0`・`passed`。`analyzeDesignDetectionStats` が ok | 早期 return を残す (PLAN の無い tree で検査が消える) / check を 1 つ投影しない |
| `CANDIDATE-U-PLANRET-023` | 削除前 | 実 repo の HEAD で、PLAN を指さない node 1 件 (design node) の relation graph と、固定の document export・verification evidence を渡して rebuild を 2 回流す。`docs/plans` の実在を見ない | 2 回の行数が一致する (hook と feedback の 4 表を除く)。`graph_nodes=1`、`document_export_runs=1`、`descent_obligations`・`hook_events`・`automation_assets`・`quality_signals`・`feedback_events`・`issue_queue`・`improvement_log` が 1 件以上。issue queue の先頭は `github`・`queued_dry_run`・承認必須・URL 空、承認 guardrail は `requires-human-approval`、improvement log の先頭は `open` で次の行動に `review` を含む。PLAN 由来の表 (設計文書 §3) と PLAN の ID を assertion に使わない | 2 回目で行数が動く / issue queue を dry-run 以外で作る / 承認なしで外部へ出す / PLAN の表を条件に残す |
| `CANDIDATE-U-PLANRET-024` | 削除前 | 実 repo の HEAD で `loadRelationGraphSourceSet` → `collectRelationGraphProjection` → `analyzeRelationImpact` (変更 path なし) | stale-edge が 0 件。`requirement` node・`pairs` edge・`covered-by` edge が各 1 件以上。既存の `.claude/agents`・`.claude/commands`・`skills/SKILL_MAP.md`・adapter の雛形の design node の assertion は変えない。`plan` node と `derives-from`・`generates` の edge の件数を条件にしない | 端点の無い edge を通す / loader が `pairs` か `covered-by` を作らなくなっても通る / PLAN の edge を条件にする |

### 6.4 昇格と引用の方針

- 3 件 (1、3a、4) は候補 ID を持たない。1 は退役で、テストと選択の集合からファイルを消す。3a は既存の `U-DBPROJ-ATOMIC-01` を改訂する (共有の `L7-unit-test-design.md` の 1 行を置き換え、行は増やさない)。4 は既存の citation `U-DMP-003` のまま、早期 return を外してテスト名の「PLAN」を「設計文書」に替える。
- 021〜024 と 3a・4 は振る舞いを足さない (テストの入力と assertion の付け替えで、`src/` の振る舞いは変えない)。現行の main では通るので `it.fails` の Red を持たない。Red の代わりの証拠は、付け替えの PR が次の 2 種類を区別して本文に記録する。§6.1 の件数計測はどちらの代わりにもならない。
  - (i) 旧テストの実行: PLAN を除いた tree で旧テストを vitest で実行し、assertion の失敗で赤になるか、早期 return で assertion に 1 件も到達しない (空振り) ことを、実行ログと assertion の到達件数で示す。続けて、付け替え後のテストを同じ tree で実行し、assertion に到達して通ることを示す。
  - (ii) mutation: 旧テストが PLAN を除いても通るケースでは (i) を作れない。投影の入力を 1 か所だけ壊した mutation で、旧 assertion は通り、新しい assertion は落ちることを示す。

| # | 証拠 | 内容 |
| --- | --- | --- |
| 1 | (i) | 旧テストが `test_runs` の行数の assertion で赤になる。退役後はファイルと選択の集合に無いことを示す |
| 2 (021) | (i) | 旧テストが planned edge か PLAN の行の assertion で赤になる |
| 3a | (i) | 旧テストが早期 return で空振りになる |
| 3b (022) | (i) | 同上 |
| 3c (023) | (i) | 同上 |
| 4 | (i) | 同上 |
| 5 (024) | (ii) | 旧テストは PLAN を除いても実行されて通る (§6.1 の件数からの推定。実行して確かめる)。`requirement` node を残したまま `pairs` か `covered-by` の edge を投影から全て除いた mutation で、旧 assertion (stale-edge 0 件、`requirement` node 1 件以上) は通り、新しい非空条件が落ちる |
- 候補 ID は、付け替えの PR がテスト名に引用し、src を含まない昇格 PR で `U-PLANRET-021`〜`024` へ 1:1 で昇格する。
- `src/doctor/test-repository-isolation.ts` の登録 (`process.cwd()` の呼び出し数) は、早期 return の helper を消す分だけ同じ PR で合わせる。
