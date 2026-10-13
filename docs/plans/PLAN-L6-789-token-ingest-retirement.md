---
plan_id: PLAN-L6-789-token-ingest-retirement
title: "PLAN-L6-789 (add-design): 常時 token 取り込みと model_evaluations 生成の退役"
kind: add-design
layer: L6
drive: agent
route_signal: redesign
route_mode: redesign
created: 2026-10-05
updated: 2026-10-13
owner: PO / Claude (author) · Codex gpt-6.1-sol (非著者 closing review)
parent_design: docs/design/harness/L6-function-design/function-spec.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: 本 PLAN 自身が token 取り込み契約を退役させる差替え正本であり、新契約を作らない純退役であるため、Reverse backfill を作らない。
agent_slots:
  - role: se
    slot_label: "Codex worker - #840 を再構成し token projection と model_evaluations 生成を撤去する"
  - role: qa
    slot_label: QA - 旧実装を戻すと RED になる退役 oracle と plan-artifact-existence を検証する
  - role: tl
    slot_label: Codex gpt-6.1-sol - exact HEAD を非著者 frontier tier で closing review する
generates:
  - artifact_path: docs/plans/PLAN-L6-789-token-ingest-retirement.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/function-spec.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-57-token-telemetry-tracker.md
    - docs/plans/PLAN-L7-454-runtime-token-telemetry-ingestion.md
    - docs/plans/PLAN-L7-423-engine-swap-domain-objects-ports.md
    - docs/plans/PLAN-L7-53-learning-engine.md
    - docs/plans/PLAN-L6-104-memory-clean-cut-replacement.md
    - docs/design/harness/L1-requirements/functional-requirements.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/test-design/harness/L14-operational-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/789
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/588
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/840
review_evidence: []
status: draft
github_issue_id: 789
supersedes:
  - PLAN-L7-57-token-telemetry-tracker
admission_receipt:
  schema_version: v2
  receipt_id: certificate:6330e0c0f34d21d6c1a10d3b6b0c9eac
  command_id: plan-revise:issue789:staged-contract-candidates:20261013:r3
  admitted_at: 2026-10-13T11:55:24.844Z
  source_digest: sha256:bf7f38fc28cc11880e022a4a9c6f71acd8d15d489574779f5281775baa773f0a
  decision_digest: sha256:43339daa702dede9e85daa2cc5412f9b789e9637efba0ad872d0a6a7fbff5c53
  receipt_digest: sha256:5e3a7c6af85b99fb641fadf00b562f3cac7f34f190ff2e9e3637a98de9a081c0
  binding:
    path: docs/plans/PLAN-L6-789-token-ingest-retirement.md
    plan_id: PLAN-L6-789-token-ingest-retirement
    asset_id: plan:9eb40ac57c66832a75be2af3f89eca4f
    revision: 3
    content_digest: sha256:bf7f38fc28cc11880e022a4a9c6f71acd8d15d489574779f5281775baa773f0a
  route:
    signal: redesign
    mode: redesign
  issue:
    provider: github
    issue_id: 789
    episode_id: E4-789-token-ingest-retirement
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-57-token-telemetry-tracker
    revision: 1
    digest: sha256:1368b978ec9de55e00e3d8edca93094ebc3b30bbaf0fba453da88ad08f4287bc
  transition:
    direction: design_to_implementation
    implementation_disposition: discarded
    implementation_target:
      target_plan_id: PLAN-L7-789-token-ingest-retirement-execution
      target_revision: 1
  reentry:
    target_plan_id: PLAN-L6-789-token-ingest-retirement
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #789 (PO 承認 2026-09-30): 常時 token 取り込みと model_evaluations
    生成を退役させる。PLAN-L7-57 の token ingest 契約を supersede し、#840 の削除 artifact を所有する
    confirmed PLAN の部分退役を前例 #424 (PLAN-L6-104) と同形で記録する。"
  supersedes:
    - PLAN-L7-57-token-telemetry-tracker
---

# PLAN-L6-789: 常時 token 取り込みと model_evaluations 生成の退役

## 1. 目的

Issue #789 (PO 承認 2026-09-30) の方針に従い、session ログから `model_runs` へ token 行を常時投入する
契約と、`model_evaluations` を生成する契約を退役させる。harness.db の 97.5% (7,985,466 行、
2026-09-30 実測) を占める token 行は、読む処理が 0 件である。費用を知りたいときは
`ut-tdd telemetry scan` を手動で実行し、集計を表示するだけにする (DB には書かない)。

token 取り込みの後継は v4 の作業ログ (チケット close 時の 1 回集計と L ステージ別集計、#588) であり、
v3 では作り直さず削るだけにする (Issue #789 comment、PO 採択 2026-09-30)。

## 2. supersede 境界

`supersedes: [PLAN-L7-57-token-telemetry-tracker]` が無効化する範囲は次に限る。

- `projectTokenUsage` による `model_runs` への token 行投入 (WBS-L7-57-03 の ingest 部分)。
- `projectModelEvaluations` の token 集計拡張 (tokens_per_success / cost_per_success、WBS-L7-57-03)。
- 上記に対応する AC (`model_runs` の token/cost 列が token-tracker 投入行で非 NULL になること、
  `projectModelEvaluations` が token 集計を出すこと)。

次は変更せず継承する。

- 取得層: `parseClaudeSessionUsage` / `parseCodexSessionUsage` / `computeClaudeCostUsd` /
  `loadRuntimeSessionUsage` と、PLAN-L7-454 が加えた `loadRepoScopedRuntimeSessionUsage`
  (`src/state-db/token-tracker.ts`)。`telemetry scan` の表示集計が使う。
- `model_runs` / `model_evaluations` の table schema (列定義、SCHEMA_VERSION)。schema 変更は本 PLAN の対象外。
- review-evidence 由来の `model_runs` 行 (token NULL、plan 紐付け)。orphan 検査
  (`src/state-db/drive-registration.ts`) が使う。
- 「tracker は CLI を再実行しない (ファイル走査のみ)」不変条件。

`PLAN-L7-57` の generates (`src/state-db/token-tracker.ts`、`tests/token-tracker.test.ts`) は撤去しない。

## 3. 設計判断

### 3.1 formal supersede を 1 件に限る

Issue #789 本文は「FR-L1-38 / PLAN-L7-57 / PLAN-L7-454 の token ingest は後継 PLAN の supersedes で
双方向に記録」と書いている。ただし redesign route の admission は supersede を 1 件だけ許す
(`src/plan-admission/policy.ts` の `plan-admission-redesign-supersede-required`
「redesignには差替える既存設計を一件だけ指定します」)。前例 #424 (`PLAN-L6-104`) も、formal supersede は
1 件だけにして、他の PLAN には非適用・撤回の注記を置いた (`PLAN-L6-104` §2、§3.1-3)。

advisor 相談: `ut-tdd advisor --decision design` (claude-fable-5、2026-10-05)。3 案から A を採択した。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **A (採用)** | L6 add-design / redesign、`supersedes` は 1 件、他は部分退役注記 | 前例 #424 と同形。Issue 本文の「L7-454 も supersedes で」から外れるため、Issue へ差分を記録する | 採用 |
| B | L7 add-impl / add-feature、`supersedes` 2 件 (PLAN-L7-565 / PLAN-L7-742 の前例) | 本文と一致するが、機能撤去を feature_addition と呼び route と実態が食い違う。add-impl は Reverse 対が必須 | 棄却 |
| C | 4 件 (57 / 454 / 423 / 53) を formal supersede | 部分退役にすぎない 423 / 53 まで supersede し、前例から外れる | 棄却 |

### 3.2 supersede 対象の選定

対象は、token 取り込みと `model_evaluations` token 集計の起点の契約である `PLAN-L7-57` とする。

- `PLAN-L7-57` は `projectTokenUsage` ingest と `projectModelEvaluations` の token 集計拡張を定義した
  (同 PLAN の WBS-L7-57-03)。
- `PLAN-L7-454` は L7-57 の ingest を rebuild 経路へ接続した troubleshoot であり、起点ではない。
  加えて、同 PLAN が追加した `loadRepoScopedRuntimeSessionUsage` は `telemetry scan` の表示経路として
  残るため、全体が退役するわけでもない。
- `model_evaluations` そのもの (FR-L1-38) の起点は `PLAN-L7-53` である。ただし同 PLAN は skill / PoC
  評価も含む複合 PLAN であり、退役するのは model 評価部分だけである。

### 3.3 部分退役の記録

| PLAN | 状態 | 記録 | 時点 |
| --- | --- | --- | --- |
| `PLAN-L7-57-token-telemetry-tracker` | confirmed | supersede back-reference (本 PLAN を指す訂正注記)。`plan revise` で発行 | 本 PR (plan-supersession が双方向を要求するため) |
| `PLAN-L7-454-runtime-token-telemetry-ingestion` | confirmed | rebuild 経路の repo スコープ ingest の非適用注記。`plan revise` で発行 | 本 PR (前例 #424 の PR-0 が REVERSE-512 への非適用注記を同梱した) |
| `PLAN-L7-58-telemetry-cost-enrichment` | confirmed | `telemetry scan` の DB ingest と再集計の非適用注記。`plan revise` で発行。非適用は L7-58-02 の migrate + `projectTokenUsage` + `projectModelEvaluations` 呼び出しと、Acceptance「token を model_runs へ ingest、model_evaluations を再集計」の部分。session-dir 解決 (option > env > OS default) と CLI 非起動の file-scan による取得、L7-58-01 の料金計算 (`OPENAI_PRICING` / `computeCodexCostUsd` / `pricingKeyFor` / `summarizeRunUsage`) は継承する | 本 PR (L7-454 と同じく generates を変えない非適用注記) |
| `PLAN-L7-423-engine-swap-domain-objects-ports` | confirmed | model-evaluations 4 件の `generates` 撤回 + 部分退役注記 | PR2 (add-feature) |
| `PLAN-L7-53-learning-engine` | confirmed | `tests/model-evaluation.test.ts` の `generates` 撤回 + FR-L1-38 部分退役注記 | PR1 (forward) |

status は全て変えない (前例 `PLAN-L6-104` §3.1-3)。

### 3.4 実装 PLAN (`implementation_target`)

redesign の admission receipt は `implementation_target` を必須とする
(`plan-admission-redesign-implementation-target-required`)。前方参照の
`PLAN-L7-789-token-ingest-retirement-execution` rev 1 を指す。

- kind は `impl` (L7、forward route)。新契約を作らない純退役なので Reverse 対を持たない
  (`backprop_decision: not_required`、理由「純退役・新契約なし」)。
- generates は起票時点では自分自身だけとする。
- 起票は実装 PR で行う (前例: `PLAN-L7-566` は #424 PR-1 の commit `db880ceb` で起票され、PR-0 では
  参照だけだった)。

番号の実測: origin/main `8fb0251c` の `docs/plans` には `PLAN-L6-789` / `PLAN-L7-789` が無く、
open PR の変更 file にも無い (2026-10-05、`gh pr list --state open --json files`)。

## 4. 変更契約

### 先行契約 PR (control コメント 6144875387)

既存の PR-0 の supersede / 非適用注記は維持する。この改訂では退役の実行順序を凍結し、functional-requirements / fr-unit-coverage / function-spec / L14 / L7 test-design を先に整合させる。source / tests は変更しない。§5 と FR coverage の参照は候補 ID に揃え、未実装の正式 oracle を先行宣言しない。

### PR1 (forward): caller と SQLite read の撤去

- projectTokenUsage / projectRepoScopedTokenUsage による常時 token 行投入を撤去する。
- rebuild / doctor / telemetry scan の model evaluation caller と、SQLite の ModelEvaluationReadPort implements / read 実装を撤去する。
- evidence-gated table / telemetry provenance 要求を対応する退役契約へ揃える。review-evidence 由来の model_runs 行は維持する。
- telemetry scan は loadRepoScopedRuntimeSessionUsage による表示専用とし、DB を開かず書き込まない。PLAN-L7-58 の取得・料金計算は保持する。
- PLAN-L7-53 の tests/model-evaluation.test.ts の所有を正規 plan revise で撤回する。PLAN-L7-789 は impl / forward の正規 admission で管理する。
- PLAN-L7-423 の domain / application / adapter / domain test の4ファイルと ModelEvaluationConfigPort / ModelEvaluationReadPort の型2件は残す。新しい no-op facade は作らない。
- テストは CANDIDATE-U-TOKRET-001..005 を引用する。U-FR-L1-38 の撤回は対応する test の撤去と同時に行い、U-DOMAIN-005 は保持する。

### 昇格 PR (source 変更なし)

PR1 の Red / 実測証拠に基づき、候補を U-TOKRET-001..005 へ昇格する。テスト引用・§5・FR coverage・L7 test-design の正式宣言を同時に変更する。source 実装は変更しない。

### PR2 (add-feature): 残した成果物と型の撤去

昇格 PR merge 後の main から開始する。PLAN-L7-423 の正規 revise と同時に4ファイルと port 型2件を削除する。U-DOMAIN-005 は tests/model-evaluation-domain.test.ts を撤去する時点まで宣言と引用を維持し、同時に撤回する。旧 proof branch はそのまま merge しない。

## 5. 退役 oracle (先行契約は候補宣言、PR1 は候補引用、昇格 PR で正式化)

Issue #789 の受入条件「PR-1 / PR-2 の oracle が、旧実装を戻すと RED になる」を満たす。

| 候補 ID | §5 の観点 | 実装テスト |
| --- | --- | --- |
| CANDIDATE-U-TOKRET-001 | session 由来 token 行の常時投入 0 | tests/projection-writer.test.ts |
| CANDIDATE-U-TOKRET-002 | opt-in 有効でも model_evaluations 生成 0 | tests/projection-writer.test.ts |
| CANDIDATE-U-TOKRET-003 | scan 後に DB 未作成 | tests/cli-surface.test.ts |
| CANDIDATE-U-TOKRET-004 | scan 後に既存 DB bytes 不変、journal / session 行 0 | tests/cli-surface.test.ts |
| CANDIDATE-U-TOKRET-005 | review-evidence 由来行と orphan 検査の保持 | tests/projection-writer.test.ts |

候補宣言はテスト実装済みや検証済みを意味しない。以下の元の反証条件を縮小しない。


- rebuild 後に、session ログ由来の `model_runs` 行 (token 列が非 NULL) が 0 件である。
- rebuild が `model_evaluations` を 1 行も書かない (opt-in 有効でも 0 行)。
- `telemetry scan` が harness.db を開かず、書き込まない。行数一致では判定しない。既存 session 行へ旧
  `projectTokenUsage` が安定 ID (`stableId("token-run", runtime:session:turn)`、
  `src/state-db/projection-writer.ts`) で再投入すると行数が変わらず、旧実装でも GREEN になるためである。
  判定は `runCliIn` (`tests/cli-surface.test.ts`、cwd を指定した node 直 spawn) で実行した後の file 観測で行う。
  - (a) DB 未作成: `.ut-tdd/` を持たない一時 root を cwd として `telemetry scan --json` を実行し、実行後に
    `<root>/.ut-tdd/harness.db` が存在しないこと。旧実装は scan action の
    `openHarnessDb(defaultHarnessDbPath(repoRoot))` (`src/cli.ts`) が `.ut-tdd/` を作って DB file を生成するので RED になる。
  - (b) 既存 DB 不変: migrate 済みの harness.db を事前に置き、file の sha256 と `-wal` / `-journal` sibling の
    不在を記録してから実行する。実行後に sha256 が一致し、sibling が無く、`role = 'session'` の
    `model_runs` 行が 0 件であること。
  - 反証条件: (a)(b) とも、session-dir に未投入の非空 session fixture を置く。fixture は root に一致する cwd を
    持つ Claude / Codex の usage 行で、`tests/token-tracker.test.ts` の `claudeAssistantLine` /
    `codexSessionContent` と同形にする。同じ test で出力の `totalRuns` が 1 以上であることを assert し、
    空 fixture で oracle が素通りしないようにする。scan action を旧実装 (`openHarnessDb` → `migrate` →
    `projectTokenUsage` → `projectModelEvaluations`) に戻すと (a)(b) が RED になることを、PR-1 の review
    証跡に残す。
- review-evidence 由来の `model_runs` 行は従来どおり生成され、orphan 検査が通る。

## 6. Schedule (serial)

1. 先行契約 PR を非著者 frontier reviewer が review し、control が merge する。
2. PR1 (forward) で caller 撤去と候補 oracle のテストを実装・実測し、review / merge する。
3. source 変更なしの昇格 PR で宣言と引用を同時に正式化し、review / merge する。
4. PR2 (add-feature) で L7-423 の所有と4ファイル・型2件・U-DOMAIN-005 を同時に退役させる。
5. 退役 merge 後の正規 db rebuild と doctor の実測を Issue #789 / #739 に記録する。harness.db の直接操作はしない。

## 7. 非対象と残余リスク

- harness.db の直接操作・VACUUM・削除はしない。縮小は rebuild だけで行う。
- `model_runs` / `model_evaluations` の table schema は変えない。空になった `model_evaluations` table の
  撤去は v4 の作業ログ設計 (#588) で扱う。
- 残余リスク: `model_evaluations` が空になることを前提にしていない外部 consumer がいれば影響を受ける。
  Issue #789 の実測で reader は 0 件である。
