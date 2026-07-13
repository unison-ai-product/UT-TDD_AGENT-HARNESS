---
plan_id: PLAN-L7-421-test-hygiene-live-tree-fence
title: "PLAN-L7-421 (troubleshoot): テスト衛生 fence — ライブ repo root への書き込み排除 + live tree/live .ut-tdd 測定テストの検出基盤 + vitest 設定明示"
kind: troubleshoot
layer: L7
drive: agent
status: draft
route_signal: incident
route_mode: incident
created: 2026-07-10
updated: 2026-07-13
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "既存テスト基盤の衛生欠陥修正と再発防止 lint の追加であり、新規 L0/L1 要件ではない。CLAUDE.md「共有 tree を測るな」原則の機械化。"
agent_slots:
  - role: aim
    slot_label: "AIM — 是正方針の設計判断 (fail-close 境界 / gate 方針)"
  - role: qa
    slot_label: "QA — live-tree 依存テストの棚卸し + fence 設計"
  - role: se
    slot_label: "SE — tmp cwd 化 / 残留検出 setup / process.cwd() lint / vitest.config 明示"
  - role: tl
    slot_label: "TL — CI 専用と割り切る系 vs HEAD 固定化する系の線引きレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-90-ci-readability-gitignored-artifact.md
review_evidence: []
---

# PLAN-L7-421 (troubleshoot): テスト衛生 fence

## 背景 (2026-07-10 品質基盤全件監査所見)

- **T-1**: `tests/cli-surface.test.ts:750` の distribution 経路は fake provider
  が cwd=ライブ repoRoot へ `codex-env.txt` を書く。後始末は `finally` の
  `rmSync` のみで、クラッシュ時に作業ツリーへ残留 → governance lint 巻き込み、
  vitest forks 並列との競合リスク。
- **T-2**: `tests/drive-db-registration.test.ts:161-178` はライブ
  `.ut-tdd/harness.db` の投影値 (`registeredHookEvents > 0` 等) を正本として
  測る。CI は db rebuild 先行で通るが、ローカル単独実行は DB 鮮度で Red/Green
  が動く (CI/ローカル乖離、「共有 tree を測るな」原則に構造的抵触)。
- **T-3**: 初回棚卸しでは governance テスト 74 ファイルが `process.cwd()` でライブ作業ツリー
  (`docs/`・`src/`) を直読み。hybrid では相手ランタイムの未コミット編集を
  測って偽の Red/Green を出しうる。
- **M**: `vitest.config.ts` に include/exclude/testTimeout が未明示。
  `.ut-tdd` state が `docs/plans/.ut-tdd/` に生成された残留も確認されており
  (cwd 誤りの CLI 実行痕跡)、誤配置 state の検出機構も無い。

## 追加所見 (2026-07-13 基盤欠陥指摘の検証監査)

- **T-4 (誤配置の原因コード特定)**: `docs/plans/.ut-tdd/logs/session/*.jsonl`
  残留の直接原因は `src/runtime/session-log.ts` `recordEvent` (262-268 行) が
  `deps.repoRoot` = 呼び出し元 `process.cwd()` (`src/cli.ts:944` 等の hook
  dispatch) をそのまま書き込み root に使うこと。hook 起動時に cwd が repo root
  でないと `.ut-tdd/` が任意ディレクトリへ生成される。Step 4 の誤配置検出に
  加え、hook 経路では `CLAUDE_PROJECT_DIR` 等による repo root 解決 (cwd 非依存)
  を検討する。
- **T-5 (SQLite cleanup の Windows lock 耐性ムラ)**: `Bun.gc(true)` +
  `rmSync(..., { maxRetries: 10, retryDelay: 50 })` パターンを持つのは
  `tests/state-db.test.ts:28-31` と `tests/memory.test.ts` のみ。他の DB 系
  テスト (`tests/token-tracker.test.ts` / `tests/feedback-lifecycle.test.ts`
  等、openHarnessDb 利用 25 ファイル中残り) は `db.close()` 後 `rmSync(...,
  { recursive: true, force: true })` のみで、Windows のハンドル解放遅延時に
  EBUSY で落ちうる。cleanup ヘルパを共通化して全 DB テストへ適用する。

## 工程表

### Step 1: [並列] T-1 の tmp 分離
- fake provider の書き込み先を tmp cwd へ寄せ、repoRoot への書き込みをゼロ化。

### Step 2: [並列] 残留検出 fence
- vitest globalSetup/teardown で全走行前後の `git status --porcelain` を比較し、
  テストが作業ツリーへ残したファイルがあれば fail する fence を追加。

### Step 3: [直列] live 測定テストの検出基盤と方針適用
- 直列理由 = **downstream_dependency** (棚卸し結果が個別方針を決める)。
- tests/ 配下で repository 読みを静的検出する lint (reason・呼出数を持つ契約台帳方式)
  を追加。再棚卸しの実行コード 60 テスト（コメント 1、fence setup 1 を除外）は全件を
  (a) detached HEAD snapshot、(b) 隔離 fixture のいずれかへ分類・適用する。CI 専用の
  live tree 測定は残さず、新規・呼出数差分・古い契約は全て fail-close とする。
  T-2 は rebuild 済み DB を前提とする guard (未 rebuild ならテスト内で rebuild
  or 明示 skip 理由) を入れる。

### Step 4: [並列] vitest.config 明示 + 誤配置 state 検出
- include/exclude/testTimeout を明示し、config-drift テストで固定。
- doctor へ「`.ut-tdd/` が repo root 以外に存在する」誤配置検出を追加し、
  現存の `docs/plans/.ut-tdd/` 残留を除去。

### Step 5: [直列] 回帰確認
- 直列理由 = **verification_gate**。全テスト green + doctor exit 0。

## AC

- [ ] テスト全走行後に `git status --porcelain` 差分ゼロ (fence が機械検証)。
- [ ] repository 読みテストが detached HEAD snapshot / 隔離 fixture の契約台帳下にあり、
      新規・呼出数差分・古い契約は lint が fail する (real-repo regression test で実証)。
- [ ] vitest.config に include/exclude/testTimeout が明示され drift テスト有り。
- [ ] `docs/plans/.ut-tdd/` 残留が除去され、誤配置検出が doctor に載っている。
- [ ] (T-5) DB テストの cleanup が共通ヘルパ経由で Windows lock retry
      (`maxRetries`) を持ち、エラー握り潰しをしない。
