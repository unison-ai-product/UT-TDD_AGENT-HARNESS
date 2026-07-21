---
plan_id: PLAN-L7-454-runtime-token-telemetry-ingestion
title: "PLAN-L7-454 (troubleshoot): model_runs へ実測 token/cost telemetry を自動投入 — rebuild 経路の projectTokenUsage 欠落是正 + repo スコープ ingest (issue #82)"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
route_signal: incident
route_mode: incident
created: 2026-07-21
updated: 2026-07-21
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-57 (token-tracker) / FR-L1-38 で設計済みの実測 telemetry 取得層が、on-disk harness.db の正規再構築経路 (rebuildHarnessDb) に接続されていない運用欠落の是正。新規 L0/L1 要件ではない。"
agent_slots:
  - role: se
    slot_label: "SE — rebuildHarnessDb への repo スコープ token ingest 接続"
  - role: qa
    slot_label: "QA — 実測行 provenance / repo スコープ filter の regression"
  - role: tl
    slot_label: "TL — 全量 ingest 非採択 (repo スコープ) の設計判断レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-454-runtime-token-telemetry-ingestion.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/token-tracker.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/token-tracker.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-57-token-cost-telemetry.md
    - docs/plans/PLAN-L7-192-db-telemetry-provenance-enforcement.md
    - docs/plans/PLAN-L7-420-ci-strict-evidence-gates.md
review_evidence:
  - reviewer: blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-21T16:15:00+09:00"
    tests_green_at: "2026-07-21T16:05:00+09:00"
    verdict: approve
    worker_model: claude-sonnet-5
    reviewer_model: gpt-5.6-sol
    scope: "worktree wt-issue-82 変更一式 (token-tracker repo スコープ loader、rebuildHarnessDb token-telemetry 接続、CLI 統計出力、regression)。初回 blind review FLAG 2 点 (slug 非単射衝突 / POSIX case 誤同一視、reviewer が実反例を構築) → per-file cwd 帰属検証 + win32 限定 case-fold へ是正、負例 3 件追加 → focused 再レビューで PASS (reviewer が実装と負例 oracle を直接確認)。"
    green_commands:
      - kind: unit_test
        command: "UT_TDD_TEST_EXECUTION_ROOT=$PWD UT_TDD_TEST_FENCE_ROOT=$PWD UT_TDD_HEAD_SNAPSHOT_ROOT=<mktemp -d detached copy> bunx vitest run tests/token-tracker.test.ts → 35/35 green (orchestrator 再実測含む)。tests/projection-writer.test.ts -t 'PLAN-L7-454' → 2/2 green。typecheck 0 / biome clean / plan lint OK (FLAG 是正記録参照)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-21T16:05:00+09:00"
        evidence_path: tests/token-tracker.test.ts
        output_digest: "sha256:759e37ece871eed4937b47bc284fd4a5a9f826803b3e53c5d3197bdd8ef8a935"
        anchor_commit: 69f1088f9a96c2f07549e814de6fe968e5a23627
---

# PLAN-L7-454 (troubleshoot): model_runs へ実測 token/cost telemetry を自動投入

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/82

## 背景 (2026-07-16 実測 / 2026-07-21 再診断)

- issue #82 実測: model_runs 849 行はすべて review evidence 由来の projection で、
  実測 runtime token/cost 行がゼロ。cost-management pillar に実測データが無い。
- 2026-07-21 再診断: 取得層 (token-tracker、PLAN-L7-57) は健在で、
  `loadRuntimeSessionUsage` は両 runtime の session ログから 431 万 run を
  パースできる (live 実測: claude 68,238 / codex 4,242,687 run)。欠落点は
  **`rebuildHarnessDb` の projection セットに `projectTokenUsage` が入って
  いない**こと (`src/state-db/projection-writer.ts:2531` 以降の projection
  一覧参照)。手動 `ut-tdd telemetry scan` だけが実測行を書けるが、正規運用
  経路 (db rebuild / Stop hook 由来 rebuild) では一度も走らない。

## 設計判断記録

- **採択: repo スコープ ingest**。rebuild は「この repo に帰属する session
  usage のみ」を投入する:
  - Claude: `~/.claude/projects/` 直下の project-slug ディレクトリのうち
    repoRoot に対応するもの (slug は絶対パスの区切り置換で導出) のみ走査。
  - Codex: session JSONL 先頭 meta の `cwd` が repoRoot 配下のもののみ採用
    (meta に cwd が無い形式は不採用として skip し、件数を戻り値で可視化)。
- 非採択: 全量 ingest (431 万 run)。理由 = harness.db はプロジェクト状態 DB
  であり他プロジェクトの usage は帰属外。かつ rebuild 所要時間と DB サイズを
  桁で悪化させる (doctor 遅延 issue #70 と逆行)。全量集計が必要な場合は既存
  `ut-tdd telemetry scan --claude-dir/--codex-dir` の明示実行で従来どおり可能
  (機能は残す)。PO 事後確認可。
- 環境変数 override (`UT_TDD_CLAUDE_SESSIONS_DIR` / `UT_TDD_CODEX_SESSIONS_DIR`)
  は従来どおり尊重する (doctor 経路 `projectRuntimeModelTelemetryForDoctor`
  と同じ解決順)。

## 工程表

### Step 1: [直列] repo スコープ loader の追加
- token-tracker へ repoRoot → 対象 session ファイル集合の解決 (Claude slug /
  Codex cwd filter) を純関数 + I/O 分離で追加。既存 `loadRuntimeSessionUsage`
  は温存 (telemetry scan 全量経路)。

### Step 2: [直列] rebuildHarnessDb への接続
- 直列理由 = **downstream_dependency**。rebuild の projection セットへ
  repo スコープ ingest を追加。cold-start (ログ不在) は no-op、
  ログ読取失敗は fail-open (rebuild 全体を落とさない) を維持。

### Step 3: [直列] regression
- 直列理由 = **verification_gate**。fixture session ログで (a) repo 帰属分のみ
  投入される、(b) 他 repo の usage が混入しない、(c) rebuild 後の model_runs に
  実測行 (input/output tokens 非 NULL) が存在する、を real fixture test で実証。

## AC

- [x] `ut-tdd db rebuild` 後、model_runs に実測 token 行が repo スコープで
      投入される (fixture 実測 + 実 repo での rebuild 実測件数を証跡)。
      - fixture 実測 (`tests/projection-writer.test.ts`
        「rebuildHarnessDb: repo-scoped runtime token telemetry ingest
        (issue #82, PLAN-L7-454)」): repo 帰属の Claude 1 行
        (input_tokens=111, output_tokens=22) + Codex 1 行 (input_tokens=300,
        output_tokens=44) が `rebuildHarnessDb` 実行後の model_runs へ
        投入されることを確認 (green)。
      - 実 repo (本 PLAN 実装 worktree `wt-issue-82`) での実測コマンド/結果:
        ```
        $ bun src/cli.ts db rebuild
        db rebuild: projection ok, rows 70244 (...\wt-issue-82\.ut-tdd\harness.db)
          token telemetry (repo-scoped, issue #82): claude files 0
          (project dir resolved=false), codex files matched 0/1539
          (foreign repo 1537, unknown cwd 2)
        $ bun -e 'const {Database}=require("bun:sqlite");
          const db=new Database(".ut-tdd/harness.db",{readonly:true});
          console.log(db.query(
            "SELECT COUNT(*) AS n FROM model_runs WHERE input_tokens IS NOT NULL"
          ).get());'
        { n: 0 }
        ```
        0 行は **仕様どおりの結果**: この worktree の repoRoot
        (`...\AppData\Local\Temp\claude\wt-issue-82`) は今回新規作成された
        一時ディレクトリであり、過去にその絶対パスを cwd として起動した
        Claude/Codex session ログが実在しないため、repo スコープ ingest は
        正しく no-op になる (「帰属しない usage を投入しない」不変条件どおり)。
        CLI 出力が同時に示す `codex files matched 0/1539 (foreign repo
        1537, unknown cwd 2)` は、実マシン上の実 session ログ 1539 件のうち
        1537 件を「他 repo 帰属」として正しく除外できていることの実測証跡
        (= 全量 ingest ではなく repo スコープが機能している直接証拠)。
- [x] 他プロジェクト session usage が混入しない負例 regression green。
      `tests/token-tracker.test.ts`
      (`loadRepoScopedRuntimeSessionUsage` の走査統計 + 他 project/repo の
      値 999 が usages に一切混入しないアサーション、35/35 green。blind
      review 是正後の追加負例 3 件を含む — 詳細は下記「FLAG 是正記録」参照:
      `(d) verifies per-file cwd inside a slug-collided Claude project dir;
      a same-slug foreign-repo file is excluded`,
      `(e) a Claude session file with no cwd field is unadopted and counted
      in claudeFilesSkippedUnknownCwd`,
      `case-folds paths only on win32; POSIX (linux) stays case-sensitive`)
      と `tests/projection-writer.test.ts`
      (foreign repo の値 90909/80808 が model_runs に混入しないアサーション、
      -t "PLAN-L7-454" 2/2 green) の両方で実証。
- [x] 既存 `ut-tdd telemetry scan` 全量経路の挙動が退行しない。
      `loadRuntimeSessionUsage` / CLI `telemetry scan` コマンド本体は無変更。
      既存 `describe("loadRuntimeSessionUsage (file scan, no CLI
      invocation)")` テストも無修正のまま green (上記 35/35 に含まれる)。
- [x] typecheck / 対象 vitest / plan lint green。review evidence を記録。
      - typecheck: `bun x tsc --noEmit -p tsconfig.json` → エラー 0。
      - 対象 vitest (直接実行、`UT_TDD_TEST_EXECUTION_ROOT` /
        `UT_TDD_TEST_FENCE_ROOT` を実 repoRoot に、`UT_TDD_HEAD_SNAPSHOT_ROOT`
        を別パスの detached HEAD clone に固定して worktree 上の未コミット
        変更を検証、`bunx vitest run` 直接実行):
        `tests/token-tracker.test.ts` 35/35 green (実行時間 ~1.1s)、
        `tests/projection-writer.test.ts -t "PLAN-L7-454"` 2/2 green
        (実行時間 ~0.6s。全量 37 件を含む再走は元々の実測 (1091.7s、システム
        負荷下) を参照、当該 2 件の負担は僅少)。
      - biome: `bun x biome check src tests` → clean
        (`Checked 544 files`, 0 errors)。
      - plan lint: `bun src/cli.ts plan lint` →
        `plan-schedule — OK (§工程表 checked=813, §G.4 minimal slice)`。
      - review evidence: 記録済み (frontmatter 参照。blind review FLAG→是正→
        focused 再レビュー PASS、anchor 69f1088f)。

## FLAG 是正記録 (blind review, gpt-5.6-sol、2026-07-21)

Step 3 regression の blind review (gpt-5.6-sol) が実反例 2 件で FLAG を返し、
以下のとおり是正した。

### Finding 1: `claudeProjectSlug` の非単射性による他 repo 混入余地

- 実反例: `claudeProjectSlug` はパス区切り文字 (`\` `/`) とドライブ区切り
  `:` を一律 `-` へ置換するため非単射で、`C:\a-b\c` と `C:\a\b-c` は同一 slug
  `C--a-b-c` に衝突する。Claude Code 自身も同じ slug でディレクトリ名を
  決めるため、実運用では両 repo の session が同一物理ディレクトリへ混在
  しうる。従来実装は slug が一致した project-slug ディレクトリの配下を
  無条件に走査していたため、slug 衝突時は他 repo の usage が repo スコープ
  ingest へ混入する余地があった。
- 是正: `loadRepoScopedRuntimeSessionUsage` の Claude 側走査へ **per-file
  cwd 検証**を追加した (Codex 側 `readCodexSessionCwd` /
  `parseCodexSessionMetaCwd` と対称の設計)。Claude Code transcript の各行に
  載る `cwd` フィールドを、ファイル先頭付近の数行 (`readLeadingLines`,
  上限 `CLAUDE_META_SCAN_MAX_BYTES`=256KiB / `CLAUDE_META_SCAN_MAX_LINES`=20)
  から `parseClaudeSessionCwd` で読み取り、`codexSessionBelongsToRepo` (両
  runtime 共用の汎用 cwd 帰属判定) で repoRoot 配下かどうかを検証してから
  ingest する。cwd 不一致は `RepoScopeIngestStats.claudeFilesForeignRepo`、
  cwd 不明形式は `claudeFilesSkippedUnknownCwd` として可視化する
  (`src/state-db/token-tracker.ts` の `readClaudeSessionCwd` /
  `parseClaudeSessionCwd` / `loadRepoScopedRuntimeSessionUsage`)。
- 負例 regression: `tests/token-tracker.test.ts`
  `describe("loadRepoScopedRuntimeSessionUsage (repo-scope ingest, issue
  #82 / PLAN-L7-454)")` の
  `it("(d) verifies per-file cwd inside a slug-collided Claude project
  dir; a same-slug foreign-repo file is excluded (blind review Finding 1,
  PLAN-L7-454)")` — `C:\a-b\c` / `C:\a\b-c` が同一 slug に衝突することを
  前提確認した上で、同一 slug ディレクトリ内の cwd 不一致ファイル
  (`999`/`999`) が ingest されないことを実証、および
  `it("(e) a Claude session file with no cwd field is unadopted and
  counted in claudeFilesSkippedUnknownCwd (blind review Finding 1,
  PLAN-L7-454)")` — cwd フィールド無しファイルが不採用 + 統計計上される
  ことを実証。

### Finding 2: `normalizePathForCompare` の無条件 lowercase による POSIX 誤同一視

- 実反例: `normalizePathForCompare` が platform を問わず無条件で
  lowercase していたため、POSIX (case-sensitive ファイルシステム) の
  `/work/Repo` と `/work/repo` を同一パスと誤認する余地があった
  (Windows の大文字小文字揺れ吸収を意図した実装が、非 Windows 環境の
  正当な別ディレクトリを誤って同一視していた)。
- 是正: case-fold を **win32 のみ**に限定した。テスト決定性のため
  `PathCompareOptions.platform` を `codexSessionBelongsToRepo` /
  `normalizePathForCompare` へ注入可能にし (省略時は `process.platform`)、
  win32 は従来どおり case-insensitive、POSIX は case-sensitive で比較する
  (`src/state-db/token-tracker.ts`)。
- 負例 regression: `tests/token-tracker.test.ts`
  `describe("parseCodexSessionMetaCwd + codexSessionBelongsToRepo (Codex
  cwd filter)")` の
  `it("case-folds paths only on win32; POSIX (linux) stays case-sensitive
  (blind review Finding 2, PLAN-L7-454)")` — `platform: "linux"` 注入で
  `codexSessionBelongsToRepo("/work/Repo", "/work/repo")` が `false`、
  `platform: "win32"` 注入で `true` になることを実証。

### 是正後の実測

- `bunx vitest run tests/token-tracker.test.ts`
  (`UT_TDD_TEST_EXECUTION_ROOT`/`UT_TDD_TEST_FENCE_ROOT`=worktree、
  `UT_TDD_HEAD_SNAPSHOT_ROOT`=別パスの detached HEAD clone、直接実行):
  35/35 green (既存 32 + 新規負例 3)。
- `bunx vitest run tests/projection-writer.test.ts -t "PLAN-L7-454"`
  (同条件): 2/2 green (`tests/projection-writer.test.ts` の repo-scoped
  ingest fixture へ own session の `cwd` フィールドを追加し、新しい
  per-file 検証と整合させた)。
- `bun x tsc --noEmit -p tsconfig.json`: エラー 0。
- `bun x biome check src tests`: clean (0 errors)。

## 実測メモ: rebuild 所要時間 (懸念点)

- 実測 (このタスク中、ウォーム状態、他プロセス競合なし):
  `token-telemetry` ステップ単独 = **1.4s** (Codex session 1546 ファイルの
  先頭行のみ読む設計、`loadRepoScopedRuntimeSessionUsage` 単体呼び出しでは
  732ms)。rebuild 全体 (~76s) の中で上位 6 ステップには入らず、既存の
  `spec-ir` (~12.3s) / `roadmap-review` (~11.5s) / `skill-projections`
  (~11.0s) 等、本 PLAN と無関係な既存ステップが依然として支配的。
  → 本変更による rebuild 所要時間への影響は軽微 (issue #70 doctor 遅延への
  逆行なしと判断できる実測)。
- 参考 (懸念として記録): 他プロセス (別 Claude/Codex セッションの doctor /
  typecheck / vitest 等) が同一マシン上で同時実行されていた計測回では
  `token-telemetry` が 34.5s まで悪化した瞬間値を観測した (ディスク I/O 競合
  由来と推定、`loadRepoScopedRuntimeSessionUsage` 単体の再測定では 732ms に
  復帰したため本変更のロジック自体の遅さではないと判断)。hybrid 環境
  (複数ランタイム同時実行が常態) では I/O 競合時に rebuild が一時的に遅く
  なりうる点は運用上の留意点として残す。
