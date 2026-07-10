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
updated: 2026-07-10
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "既存テスト基盤の衛生欠陥修正と再発防止 lint の追加であり、新規 L0/L1 要件ではない。CLAUDE.md「共有 tree を測るな」原則の機械化。"
agent_slots:
  - role: qa
    slot_label: "QA — live-tree 依存テストの棚卸し + fence 設計"
  - role: se
    slot_label: "SE — tmp cwd 化 / 残留検出 setup / process.cwd() lint / vitest.config 明示"
  - role: tl
    slot_label: "TL — CI 専用と割り切る系 vs HEAD 固定化する系の線引きレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
    artifact_type: markdown_doc
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: vitest.config.ts
    artifact_type: config
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
- **T-3**: governance テスト 74 ファイルが `process.cwd()` でライブ作業ツリー
  (`docs/`・`src/`) を直読み。hybrid では相手ランタイムの未コミット編集を
  測って偽の Red/Green を出しうる。
- **M**: `vitest.config.ts` に include/exclude/testTimeout が未明示。
  `.ut-tdd` state が `docs/plans/.ut-tdd/` に生成された残留も確認されており
  (cwd 誤りの CLI 実行痕跡)、誤配置 state の検出機構も無い。

## 工程表

### Step 1: [並列] T-1 の tmp 分離
- fake provider の書き込み先を tmp cwd へ寄せ、repoRoot への書き込みをゼロ化。

### Step 2: [並列] 残留検出 fence
- vitest globalSetup/teardown で全走行前後の `git status --porcelain` を比較し、
  テストが作業ツリーへ残したファイルがあれば fail する fence を追加。

### Step 3: [直列] live 測定テストの検出基盤と方針適用
- 直列理由 = **downstream_dependency** (棚卸し結果が個別方針を決める)。
- tests/ 配下で live tree / live `.ut-tdd` を読むテストを静的検出する lint
  (許可リスト方式) を追加。既存 74 件は (a) CI 専用と明記、(b) `git ls-files`
  (HEAD tracked) ベースへ移行、(c) fixture 化のいずれかへ分類・適用。
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
- [ ] live tree 読みテストが許可リスト管理下にあり、リスト外の新規追加は
      lint が fail する (real-repo regression test で実証)。
- [ ] vitest.config に include/exclude/testTimeout が明示され drift テスト有り。
- [ ] `docs/plans/.ut-tdd/` 残留が除去され、誤配置検出が doctor に載っている。
