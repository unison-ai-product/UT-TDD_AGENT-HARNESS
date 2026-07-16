---
plan_id: PLAN-RECOVERY-11-snapshot-fence-foreign-activity
title: "PLAN-RECOVERY-11 (recovery): snapshot runner 起動元 fence の hybrid 偽陽性収束 — 相手ランタイム並行活動をテスト残留と誤帰責しない判別機構"
kind: recovery
layer: cross
drive: agent
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-16
updated: 2026-07-16
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-421 で導入済みのテスト衛生 fence の hybrid 運用欠陥の収束であり、新規 L0/L1 要件ではない。判別機構は L6 機能契約と L7 テスト設計への generates 反映で追跡する。"
agent_slots:
  - role: aim
    slot_label: "AIM — 偽陽性判別の設計判断 (foreign activity 検知 vs テスト残留の分離、fail-close 境界)"
  - role: qa
    slot_label: "QA — 並行 foreign 活動を模した決定論的再現 fixture + 偽陽性/真陽性の oracle 設計"
  - role: se
    slot_label: "SE — fingerprint 差分の帰責分類 (HEAD 移動 / foreign path / test 残留) の実装"
  - role: tl
    slot_label: "TL — 「共有 tree を測るな」原則との整合レビュー (fence の測定対象の再定義)"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-11-snapshot-fence-foreign-activity.md
    artifact_type: markdown_doc
  - artifact_path: tests/support/git-workspace-fingerprint.ts
    artifact_type: test_code
  - artifact_path: tests/global-setup.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
review_evidence: []
---

# PLAN-RECOVERY-11 (recovery): snapshot fence の hybrid 偽陽性収束

## 背景 (2026-07-16 全体監査での実測)

PLAN-L7-421 のテスト衛生 fence (`tests/support/git-workspace-fingerprint.ts`
`assertGitWorkspaceUnchanged`) は「テスト全走行後に**起動元 worktree** の
`git status --porcelain` 差分ゼロ」を機械検証する。しかし fingerprint は起動元
worktree の HEAD / status / worktree diff / index diff / untracked 内容の
**全体スナップショット比較**であり、走行中に発生した差分の**帰責を区別しない**。

2026-07-16 の実測: `bun run test` (snapshot runner full suite) 実行中に相手
ランタイム (Codex) が共有 worktree で正規作業 (commit / ファイル編集 / untracked
生成) を進めたところ、teardown の fence が trip して suite 全体が exit 1 となった。
テスト自身の残留はゼロでも、hybrid の並行活動だけで full-suite が Red になる。

## 問題の構造

- **偽陽性**: fence の意図は「テストが起動元 worktree を汚したことの検出」だが、
  実装は「走行前後で worktree が変わったことの検出」。hybrid ではこの 2 つは
  一致しない (CLAUDE.md「共有 tree を測るな」原則と同型の測定対象取り違え)。
- **運用影響**: author ランタイムのローカル full-suite 検証が相手の活動時間帯に
  常に失敗しうる → 検証が CI 依存になり、ローカル Red の意味が曖昧化する
  (真のテスト残留が foreign 活動ノイズに埋もれる)。

## 是正方針 (Step 案)

### Step 1: [直列] 差分の帰責分類
- 直列理由 = **downstream_dependency** (分類設計が後続の fail 挙動を決める)。
- fence の before/after 比較に帰責分類を追加する:
  (a) **HEAD 移動** (`before.head != after.head`) = foreign commit 活動、
  (b) **テスト非対象 path の差分** = foreign 編集の可能性、
  (c) それ以外 = テスト残留候補。
- 分類 (a)(b) は「foreign activity により fence 判定不能」という**独立した結果**
  (テスト失敗と区別された exit reason) として報告し、テスト残留 (c) のみを
  従来どおり fail-close とする。判定不能を silent pass にしない (fail-open 禁止:
  再実行指示付きの明示エラーとする)。

### Step 2: [並列] 決定論的再現 oracle
- 走行中の foreign commit / untracked 生成 / 編集を模す決定論的 fixture を追加し、
  「foreign activity → 判定不能 (テスト失敗でない)」「テスト残留 → fail」の両方向を
  real-repo regression test で実証する (prose 主張の禁止、coding ≠ substance)。

### Step 3: [直列] 回帰確認
- 直列理由 = **verification_gate**。full suite green + doctor green +
  fence 真陽性 (残留検出) の既存回帰が退行しないことを確認。

## AC

- [ ] 走行中の foreign commit / 編集 / untracked 生成だけでは full suite が
      「テスト失敗」として Red にならない (判定不能の明示エラー or 分類上の除外、
      real-repo regression test で実証)。
- [ ] テスト自身の起動元 worktree 残留は従来どおり fail-close (既存真陽性回帰の維持)。
- [ ] 判定不能ケースは silent pass ではなく、再実行指示を含む明示メッセージを出す。
- [ ] doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。
