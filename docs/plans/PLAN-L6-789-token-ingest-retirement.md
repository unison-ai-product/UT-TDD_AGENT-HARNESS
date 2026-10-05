---
plan_id: PLAN-L6-789-token-ingest-retirement
title: "PLAN-L6-789 (add-design): 常時 token 取り込みと model_evaluations 生成の退役"
kind: add-design
layer: L6
drive: agent
route_signal: redesign
route_mode: redesign
created: 2026-10-05
updated: 2026-10-05
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
sub_doc: function-spec
github_issue_id: 789
supersedes:
  - PLAN-L7-57-token-telemetry-tracker
admission_receipt:
  schema_version: v2
  receipt_id: certificate:5e7a14a8be6ccbcce42ce806babeaa51
  command_id: plan-revise:issue-789:token-ingest-retirement:rechain-1:slot-label-quote:r3:73eb26976de7
  admitted_at: 2026-10-05T11:28:58.224Z
  source_digest: sha256:6e321c50a2d970b43e360753ff86de89b2e43e21d6832c5565a5e4ec8b34b142
  decision_digest: sha256:956e69ce645429f6f6ce443246f34ca9606a1420983a147643cf15fa4141678d
  receipt_digest: sha256:70acb97a0be1b9a574497c513cabff622b50aa194d3c1c566f843184d85bf0c4
  binding:
    path: docs/plans/PLAN-L6-789-token-ingest-retirement.md
    plan_id: PLAN-L6-789-token-ingest-retirement
    asset_id: plan:8cd99bada32554ad2d55498b025ed55a
    revision: 3
    content_digest: sha256:6e321c50a2d970b43e360753ff86de89b2e43e21d6832c5565a5e4ec8b34b142
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
  escape_reason: "Issue 789: PR #842 correction 1/3
    の追加是正。agent_slots[0].slot_label の値を引用符で囲み、YAML コメントとして欠落した本文 (#840 以降)
    を復元する。方式と scope は変えない"
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
| `PLAN-L7-423-engine-swap-domain-objects-ports` | confirmed | model-evaluations 4 件の `generates` 撤回 + 部分退役注記 | 実装 PR |
| `PLAN-L7-53-learning-engine` | confirmed | `tests/model-evaluation.test.ts` の `generates` 撤回 + FR-L1-38 部分退役注記 | 実装 PR |

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

### PR-0 (本 PR): 契約 freeze

- 本 PLAN を canonical `plan draft --manifest` で起票する。
- `PLAN-L7-57` に supersede back-reference、`PLAN-L7-454` と `PLAN-L7-58` に非適用注記を canonical `plan revise --manifest` で入れる。
- src / tests / 設計 doc / test-design は変更しない。

### PR-1: 退役の実行 (#840 を forward branch で再構成)

#840 (`work/fix-issue789-token-pr2-20261005`) の内容を、`PLAN-L7-789` の route に合う
`work/forward-` branch で作り直す。次を同じ PR に含める。

- `projectTokenUsage` / `projectRepoScopedTokenUsage` による token 行の生成を撤去する。
- `projectModelEvaluations` と `src/projection` の model-evaluations domain / application / adapter / port、
  store の `readModelEvaluationFacts` を撤去する。
- `src/lint/db-projection-ingestion.ts` の evidence-gated 一覧と provenance 要求から該当 table を外す。
- `telemetry scan` を `loadRepoScopedRuntimeSessionUsage` による表示専用にする (DB 書き込みなし)。取得と
  料金計算は `PLAN-L7-58` の契約をそのまま使う。同 PLAN の非適用注記は PR-0 で入れ済みなので、PR-1 では
  `PLAN-L7-58` を revise しない。
- `PLAN-L7-423` / `PLAN-L7-53` の `generates` から削除 artifact 5 件を `plan revise --manifest` で外し、
  部分退役注記を入れる。外さないと `plan-artifact-existence` が phantom を出す。#840 の CI
  (run 37292214302) で失敗した check はこの 2 PLAN についての同 check だけである。
- 文書更新を同じ PR で行う。
  - `docs/design/harness/L1-requirements/functional-requirements.md`: FR-L1-38 を退役と記す。
  - `docs/design/harness/L6-function-design/function-spec.md`: 削除 path を参照している
    `projectModelEvaluations` 行を撤回する。
  - `docs/test-design/harness/L7-unit-test-design.md`: `U-FR-L1-38` の oracle を撤回する。
    citation 元の `tests/model-evaluation.test.ts` を消すので、宣言を残すと oracle-test-trace の orphan になる。
    あわせて §5 の退役 oracle を宣言する。
  - `docs/test-design/harness/L14-operational-test-design.md`: token 取り込みを前提とする運用観点があれば撤回する。
- `PLAN-L7-789` を起票し、confirm と同時に所有を宣言する。

## 5. 退役 oracle (PR-1 で test-design に宣言する)

Issue #789 の受入条件「PR-1 / PR-2 の oracle が、旧実装を戻すと RED になる」を満たす。

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

1. [直列] PR-0: 本 PLAN の draft と back-reference / 非適用注記 (直列理由 = downstream_dependency)。
2. [直列] PR-0 の closing review (非著者 family の frontier tier) と confirm。
3. [直列] PR-1: #840 の再構成 (直列理由 = verification_gate)。
4. [直列] PR-1 の merge 後に `ut-tdd db rebuild` を実行し、`model_runs` 行数と harness.db のサイズを
   実測して Issue #789 に記録する。doctor の所要時間とピークメモリの変化を #739 に記録する。

## 7. 非対象と残余リスク

- harness.db の直接操作・VACUUM・削除はしない。縮小は rebuild だけで行う。
- `model_runs` / `model_evaluations` の table schema は変えない。空になった `model_evaluations` table の
  撤去は v4 の作業ログ設計 (#588) で扱う。
- 残余リスク: `model_evaluations` が空になることを前提にしていない外部 consumer がいれば影響を受ける。
  Issue #789 の実測で reader は 0 件である。
