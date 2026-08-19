---
plan_id: PLAN-L7-455-ci-cost-speedup-phase1
title: "PLAN-L7-455 (troubleshoot): GitHub CI の重要部分絞り込み・高速化 Phase 1 — doc-only 絞り込み + bun cache + 検証弱化防止 detector 追随 (issue #109)"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
route_signal: incident
route_mode: incident
created: 2026-07-21
updated: 2026-07-21
owner: PM / PO
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
github_issue_id: 109
backprop_decision: not_required
backprop_decision_reason: "requirements §6.9 の CI 契約 (aggregate gate / required context) は維持したまま、実行コストの配分を最適化する運用是正。検証の弱化 (fail-open の看板替え) は detector で機械防止するため、新規 L0/L1 要件ではない。本格 redesign (shard / 内部 CI 一致率計測) は issue #109 の後続 design PLAN で扱う。"
agent_slots:
  - role: aim
    slot_label: "AIM — 変更種別ごとの CI 実行マトリクス (何を省いて安全か) の設計判断"
  - role: se
    slot_label: "SE — harness-check.yml の paths 分類 + bun cache + detector 追随"
  - role: qa
    slot_label: "QA — 絞り込みが required context を欠落させない負例 regression"
  - role: tl
    slot_label: "TL — fail-close 境界 (doc-only 判定の安全性) レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-455-ci-cost-speedup-phase1.md
    artifact_type: markdown_doc
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: config
  - artifact_path: src/lint/github-ci-policy.ts
    artifact_type: source_module
  - artifact_path: tests/change-lane.test.ts
    artifact_type: test_code
  - artifact_path: src/doctor/profiles.ts
    artifact_type: source_module
  - artifact_path: src/doctor/runner.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-221-github-ci-policy-gate.md
    - docs/plans/PLAN-RECOVERY-15-cross-os-ci-aggregate-gate.md
    - docs/plans/PLAN-L7-420-ci-strict-evidence-gates.md
review_evidence:
  - reviewer: blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-21T16:40:00+09:00"
    tests_green_at: "2026-07-21T16:03:00+09:00"
    verdict: approve
    worker_model: claude-sonnet-5
    reviewer_model: gpt-5.6-sol
    scope: "worktree wt-issue-109 変更一式 (harness-check.yml doc lane 分岐 + bun cache、change-lane.ts fail-close 分類器、cli classify-changes、checkLaneSkipSafety detector + 負例 U-CIPOL-021〜026)。初回 blind review FLAG (docs/plans/** と root md が doc lane に乗り governance hard-gate を迂回可能) → allowlist を docs/** (plans 除く) + .ut-tdd/memory/** へ縮小、攻撃再現負例を追加 → focused 再レビューで PASS (reviewer が独立攻撃プローブで全ケース full への fail-close を実証)。"
    green_commands:
      - kind: unit_test
        command: "UT_TDD_TEST_EXECUTION_ROOT=$PWD UT_TDD_TEST_FENCE_ROOT=$PWD UT_TDD_HEAD_SNAPSHOT_ROOT=<mktemp -d detached copy> bunx vitest run tests/change-lane.test.ts tests/github-ci-policy.test.ts → 58/58 green (orchestrator 実測)。typecheck 0 / biome clean / plan lint OK"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-21T16:03:00+09:00"
        evidence_path: tests/change-lane.test.ts
        output_digest: "sha256:d167eb10aefa141907e11704ff64b348511f8eaaa72c89c54504eadb22aa34d6"
        anchor_commit: d5acb1eccd7918fbe1d688a321f2ee010689a7d9
---

# PLAN-L7-455 (troubleshoot): GitHub CI 高速化 Phase 1

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/109

## 背景 (2026-07-21 実測)

- `harness-check` は 1 run 305〜557s (直近 8 run 実測)。Linux + Windows dual-leg +
  aggregate で、doc-only / PLAN-only の変更でも full suite (typecheck / 全 vitest /
  biome / doctor) が毎回走る。
- PR サイクル (実装 → cross-review → merge) の律速が CI 待ちになっており、
  main の CI 赤放置 (PR #100 / #105 の merge commit failure) という
  信頼低下の症状が出ている。
- 本 PLAN は issue #109 の Phase 1 (即効・低リスク) のみ: (1) doc-only 変更の
  job 絞り込み、(2) bun install cache、(3) 絞り込みが検証弱化にならないことの
  detector 機械保証。テスト shard / 内部 CI 一致率計測などの本格 redesign は
  後続 design PLAN (issue #109 に残 AC として記録) で扱う。

## 設計判断記録

- **採択: 変更種別の fail-close 分類**。「code を 1 ファイルでも含む → full」
  「保守的 doc-safe allowlist のみ → doc lane (lint / plan lint /
  readability / rule-drift 等の doc 系 check のみ)」。判定不能・新種 path は
  full へフォールバック (fail-close)。doc-safe allowlist は非正本の参照proseである
  **`docs/archive/**.md` / `docs/migration/**.md` / `docs/reference/**.md` /
  `docs/research/**.md`** のみに限定する。governance/design/process/adr/test-design/
  templates/handover/memory と `.ut-tdd/memory/**` は常に full とする。
- **required context (`harness-check` aggregate) は絞り込み後も常に生成する**。
  doc lane でも aggregate job は走り、doc 系 check green を集約して success を
  返す (branch protection の required check が pending 放置にならない)。
- 非採択: job 単位の `paths:` トリガ分割 (workflow レベルの paths filter)。
  理由 = required check が skip されると protection 上 pending のまま残る
  footgun があり、aggregate 契約 (PLAN-RECOVERY-15) と衝突する。job 内での
  変更分類 (dorny/paths-filter 相当のロジックか git diff ベースの step) で
  分岐し、aggregate は常に走らせる方式を採る。
- bun cache は `~/.bun/install/cache` を lockfile hash キーで restore する
  (弱化リスクなし、純粋な時間短縮)。

## 工程表

### Step 1: [直列] 変更分類 step + doc lane の導入
- harness-check.yml に「変更ファイル分類」step を追加し、doc-only 判定時は
  重い step (full vitest / doctor full) を skip、doc 系 check のみ実行。
  分類 allowlist は上記4つの非正本 prose tree のみに限定する。
  code / config / workflow / スクリプト変更は常に full。

### Step 2: [並列] bun install cache
- actions/cache で bun cache を lockfile キーで復元 (Linux / Windows 両 leg)。

### Step 3: [直列] detector 追随 (検証弱化防止)
- 直列理由 = **downstream_dependency** (Step 1 の最終形に対して検査を書く)。
  `src/lint/github-ci-policy.ts` を拡張し、(a) aggregate job が変更種別に
  依らず常に実行されること、(b) doc lane の skip 対象に code 系 check が
  混入していないこと (skip 可能 step の allowlist)、を structured violation で
  fail-close 検査。負例 regression を real fixture で追加。

### Step 4: [直列] 回帰確認
- 直列理由 = **verification_gate**。typecheck / biome / plan lint / 対象 vitest
  green。実 PR での before/after CI 時間は PR 作成後に実測して issue #109 へ
  evidence として記録する (本 PLAN の AC は構造 test まで、実走時間は issue 側)。

## 実施記録 (2026-07-21)

- Step 1/2: `.github/workflows/harness-check.yml` に `classify` step (id: classify、
  両 leg に独立実装) を追加。`bun src/cli.ts github classify-changes` (新設 CLI、
  `src/github/change-lane.ts`) が git diff range (pull_request は base/head SHA、
  push は before/head SHA、force-push/新規ブランチ/未対応 event は range 解決不能
  → fail-close) を解決し、変更ファイルを分類する。doc-only (非正本参照prose 4 tree)
  のときだけ `steps.classify.outputs.lane == 'full'` 条件の
  重い step (typecheck / db rebuild / 全回帰 vitest / audit quality / full doctor)
  を skip し、`lane == 'doc'` 条件の新 step (`bun src/cli.ts plan lint` +
  `bun run test:doc-lane` = readability/rule-drift/plan-lint) を実行する。
  github guard と biome lint は lane に依らず常に実行 (allowlist 外)。
  `actions/cache@v4` (`~/.bun/install/cache`、`bun.lock` hash key) を Linux/Windows
  両 leg に追加。
- Step 3: `src/lint/github-ci-policy.ts` の `checkLaneSkipSafety` を追加。
  (a) runtime leg (`harness-check-linux` / `harness-check-windows`) が job レベル
  `if` を持たないこと (aggregate 到達性を job 単位 skip で壊させない)、(b) lane
  条件付き step が canonical な `if` 式 (`steps.classify.outputs.lane == 'full'` /
  `== 'doc'`) のみを許可し、`'full'` 限定 skip は保守的 allowlist
  (typecheck/db rebuild/`bun run test`(exact, `test:doc-lane` 等の別 script とは
  正規表現の負先読みで区別)/`test:fast`/audit quality/full doctor) に限定する
  ことを新規 violation reason `forbidden_job_level_lane_skip` /
  `forbidden_lane_skip_step` で fail-close 検査する。既存の dual-leg topology 検査
  (aggregate needs / always() / result guard 等) は無変更。
- Step 4: 下記コマンドで実測 (すべて `C:/Users/micro/AppData/Local/Temp/claude/wt-issue-109`
  worktree、未コミット差分込み)。

  | # | コマンド | 結果 |
  |---|---|---|
  | 1 | `bun run typecheck` | exit 0 (無出力) |
  | 2 | `bun run lint` (初回 3 format violation → `bun run format` で解消) | exit 0, `Checked 563 files … No fixes applied.` |
  | 3 | `bun src/cli.ts plan lint` | `plan-schedule — OK (§工程表 checked=817, §G.4 minimal slice)` |
  | 4 | `UT_TDD_TEST_EXECUTION_ROOT=$PWD UT_TDD_TEST_FENCE_ROOT=$PWD UT_TDD_HEAD_SNAPSHOT_ROOT=<snapshot> bun x vitest run tests/change-lane.test.ts tests/github-ci-policy.test.ts --reporter=dot` | `Test Files 2 passed (2)` / `Tests 58 passed (58)` (change-lane 22 (blind review FLAG 是正の負例 5 件を含む) + github-ci-policy 36、`U-CIPOL-021`〜`026` を含む) |
  | 5 | 同上 env で `vitest run tests/readability.test.ts tests/rule-drift.test.ts --reporter=dot` | `Test Files 2 passed (2)` / `Tests 29 passed (29)` |
  | 6 | 同上 env で `vitest run tests/plan-lint.test.ts --reporter=dot` | `Test Files 1 passed (1)` / `Tests 63 passed (63)` |
  | 7 | `bun -e 'import { checkGithubCiPolicy } from "./src/doctor/runtime-surface"; console.log(JSON.stringify(checkGithubCiPolicy(process.cwd())))'` (doctor の github-ci-policy hard gate を対象関数直接実行、full doctor は不使用) | `{"messages":["github-ci-policy - OK (checked=4, ...)"],"ok":true}` — 実運用の (未コミット) `.github/workflows/harness-check.yml` 自体が新 detector を通過することを確認 |
  | 8 | `bun src/cli.ts github classify-changes --event-name push --head-sha <HEAD> --before-sha <HEAD~1> --json` (実 git 履歴に対する end-to-end smoke) | `{"lane":"full","reason":"non-doc-lane-path (fail-close): ...","fileCount":17,...}` — src 変更を含む merge commit を正しく "full" へ fail-close 分類 |
  | 9 | `--github-output <file>` 付き同コマンド → `cat <file>` | `lane=full` (GITHUB_OUTPUT 形式で正しく追記) |

  #6 は #4+#5+#6 を単一 vitest 呼び出しでまとめて実行すると (原因未特定、リソース
  競合の可能性) 5 分でタイムアウトしたため、3 呼び出しに分割して実測した
  (個別実行はいずれも数秒〜十数秒で完了)。full doctor / full vitest 回帰の実測は
  ローカル 10 分超 (issue #70 既知) のため対象外とし、doctor は #7 の対象関数直接
  実行、全回帰は既存の CI (`harness-check`) 実走に委譲する。

## FLAG 是正記録 (blind review, gpt-5.6-sol, 2026-07-21)

- **finding**: doc lane allowlist が広すぎ、governance hard-gate を迂回できた。
  反例 (1) `docs/plans/PLAN-X.md` のみの変更 (PLAN frontmatter の
  `status` flip / `review_evidence` 改変 / supersession 削除) が doc lane に
  分類され、full doctor の `checkReviewEvidence` / `plan-supersession` 検査を
  素通りする。反例 (2) 当時のグローバル `*.md` 規則により `CLAUDE.md` /
  `AGENTS.md` / `.claude/CLAUDE.md` 等の runtime 規則ファイルも doc lane に
  乗っていた。
- **是正内容**: `src/github/change-lane.ts` の `isDocSafeChangePath` を保守的
  allowlist へ縮小した。(a) `docs/plans/**` を doc-safe から明示除外 (→ full)。
  (b) グローバル `*.md` 規則を廃止し、doc-safe は「`docs/**` (`docs/plans/**`
  を除く) の `*.md`」と「`.ut-tdd/memory/**`」のみに限定 (root の README.md /
  CLAUDE.md / AGENTS.md 等は full へ)。reason 文字列・
  `.github/workflows/harness-check.yml` の comment も新境界に同期した。
- **新規負例 regression テスト** (`tests/change-lane.test.ts`):
  `isDocSafeChangePath` の「blind review FLAG regression: rejects
  docs/plans/** (PLAN frontmatter is governance, not doc-safe)」/
  「blind review FLAG regression: rejects root/runtime-rule *.md (global
  *.md rule removed)」、`classifyChangeLane` の「blind review FLAG
  regression: docs/plans/** alone classifies as full (governance bypass
  attack reproduction)」/「blind review FLAG regression: root runtime-rule
  *.md files classify as full」/「blind review FLAG regression: a doc-safe
  path mixed with docs/plans/** classifies as full (fail-close on mix)」。
  攻撃再現 (governance 迂回) を固定し、`docs/design/foo.md` 等の正例は
  縮小後も doc lane のまま生きることも維持確認した。

### 最終収束是正 (2026-07-27)

- 各runtime legに `id: classify` + `github classify-changes` のlane output producerを必須化し、
  欠落・誤id・command差替えを `github-ci-policy` がfail-closeする。
- producerはmultiline continuation / CRLF / 空白だけを正規化し、現workflowの
  `bun src/cli.ts github classify-changes` と5引数（GitHub式・順序・`$GITHUB_OUTPUT`を含む）
  のcanonical全文に完全一致させる。追加行/comment/`;`/`&&`/`||`/別output/引数順序変更は
  全てfail-closeする。shell契約はplatform別に固定し、Linux legは未指定のみ、
  Windows legは`bash`明示のみを許可する（Linuxのcustom shell/`bash`明示もfail-close）。
- producerはさらに`if`/step env未指定、`continue-on-error`未指定またはfalseを必須とし、
  job-levelの`GITHUB_OUTPUT`上書きも拒否する。source-doc doctorは各OSに1件以上、
  canonical doc条件・canonical command全文・shell/env未指定・fail-close実行だけを許可し、
  substring偽装、control operator、別profile、追加flagを拒否する。
- runtime leg jobは`runs-on`/`steps`以外のexecution contextを拒否する。critical producerは
  Linux=`name,id,run`、Windows=`name,id,shell,run`、doc doctor=`name,if,run`のexact key set
  とし、working-directory/timeout/unknown key、job defaults/env/container/strategy、
  duplicate producer idを構造driftとしてfail-closeする。
- source runtime workflow rootも現実体の`name,on,permissions,concurrency,jobs`だけにsealし、
  top-level `defaults.run.shell` / `env.BASH_ENV` / `env.GITHUB_OUTPUT`や未知root keyによる
  runtime step hijackをfail-closeする。
- source runtime legsのsteps配列はOS別のordered canonical semantic manifestとして固定し、
  step件数・順序・全property/valueを完全一致検査する。YAML block whitespaceだけ正規化し、
  action/with/run/if/env/shellの差替え、command追記、step追加・削除・並替えをfail-closeする。
- `run`正規化はCRLF→LF、明示shell continuation (`\`+改行+indent)→single space、
  block外縁の空行除去だけに限定する。通常改行・line内space・quoted whitespaceは意味として保持し、
  command separatorの改行をspaceへ変える攻撃を拒否する。
- doc-safeを4つの非正本prose treeだけへ再縮小し、正本・runtime rule・共有memoryをfullへ戻す。
- source-only doctor profile `source-doc-lane` を追加し、readability/runtime-readability/
  rule-drift/secret-scanをdoc laneでも必須実行する。workflowとdetectorの両側で固定する。

### Issue #314 の profile 実行面束縛 (2026-08-19)

`source-doc-lane` の `outputIds` を宣言だけにせず、doctor registry の選択・実行・
envelope `checkIds`/`checks` の集合と順序へ直接束縛する。profile の4件を `scope=full`
の全検査へ拡張する経路、または registry 定義順と profile 宣言順がずれる経路を
`U-CIPOL-027` (tests/doctor.test.ts) で fail-close に固定する。実装所有は
`src/doctor/runner.ts`、既存 profile 宣言は `src/doctor/profiles.ts` とする。

## AC

- [x] doc-only 変更で重い step が skip され、code 変更で full が走る分岐が
      workflow 構造 test で検証されている (負例: code path を doc lane へ
      分類すると Red)。 — `tests/change-lane.test.ts` (`classifyChangeLane` /
      `runChangeLaneClassification` の正例・負例、fail-close 既定に加え、blind
      review FLAG 是正 (docs/plans/** 除外・グローバル *.md 規則廃止) の負例
      regression を含め 22 test) + `tests/github-ci-policy.test.ts` の
      `U-CIPOL-021`〜`026` (実施記録 #4)。
- [x] aggregate `harness-check` context が変更種別に依らず常に生成される
      ことを github-ci-policy detector が fail-close 検査する。 — 既存
      `missing_aggregate_always` / `invalid_aggregate_needs` /
      `missing_aggregate_result_guard` に加え、新規 `forbidden_job_level_lane_skip`
      (`U-CIPOL-025`) が runtime leg の job レベル skip を禁止し、aggregate へ
      到達不能になる経路を fail-close する。実運用 workflow でも #7 (実施記録) で
      green を確認。
- [x] bun cache step が両 leg に入り、workflow 構造 test で検証されている。 —
      `.github/workflows/harness-check.yml` の両 leg に `actions/cache@v4` を追加
      (`~/.bun/install/cache`, key=`${{ runner.os }}-bun-${{ hashFiles('bun.lock') }}`)。
      github-ci-policy の既存 dual-leg 検査 (`U-CIPOL-013` 等) が引き続き green
      (実施記録 #4) であることを cache step 追加後の構造 test で確認。実 CI 時間
      短縮効果は PR 作成後に issue #109 側で実測する (本 PLAN スコープ外、工程表
      Step 4 記載どおり)。
- [x] typecheck / biome / plan lint / 対象 vitest green。review evidence を
      confirmed 前に記録。 — 実施記録 #1〜#6 (green)。review evidence は本 PLAN が
      `status: draft` のまま (confirmed gate 前) のため未記録。confirmed へ進める
      前に cross-runtime review を実施し `review_evidence` へ追記する。
- [x] Issue #314: source doc lane の宣言面と実行面が集合・順序とも一致する。 —
      exact HEAD `1c3f662ff418aa53780f6148144cdfbac05c59b8` で
      `node scripts/run-vitest-snapshot.ts tests/doctor.test.ts -t "U-CIPOL-027" --reporter=dot`
      を実行し、1 file / 1 test Green。profile の4件だけが `checkIds`/`checks` に現れ、
      registry 定義順の差異が残らないことを実測した。
