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
updated: 2026-08-18
owner: PM / PO
github_issue_id: 77
parent_design: docs/design/harness/L6-function-design/function-spec.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
backprop_decision: required
backprop_decision_reason: "foreign activity とテスト残留を区別する新しい判定結果と exit reason を導入するため、PLAN-REVERSE-77 で上流契約へ戻す。"
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
  - artifact_path: docs/plans/PLAN-REVERSE-77-snapshot-fence-foreign-activity-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
    - docs/plans/PLAN-REVERSE-77-snapshot-fence-foreign-activity-backfill.md
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

## 実装対象 (実装着手時に generates へ昇格)

draft 段階の generates は本 PLAN doc のみとする (merged-plan-status: 既 merge 済み
deliverable の宣言は confirm 時)。実装対象は `tests/support/git-workspace-fingerprint.ts`、
`tests/global-setup.ts`、`docs/test-design/harness/L7-unit-test-design.md` であり、
実装 slice 着手時に generates へ追加して confirm と対で閉じる。

## 是正方針 (Step 案)

### Step 1: [直列] 差分の帰責分類
- 直列理由 = **downstream_dependency** (分類設計が後続の fail 挙動を決める)。
- fence の before/after 比較は、runnerが明示的に渡す相対pathの `testOwnedPaths`（既定は空集合）と、
  独立した `foreignActivityEvidence`（HEAD移動または管理されたfixtureが発行した活動証跡）を入力に取る。
  「テスト非対象」という暗黙の全path集合は作らない。
- **分類不能な差分は残留候補として fail-close** とする。pathが `testOwnedPaths` の外にあることだけでは
  foreignとは認定しない。HEAD移動、または検証可能な `foreignActivityEvidence` と一致する差分だけを
  `foreign_activity` として分類する。
- foreign activityだけでテスト残留が無い場合は、テスト失敗とは別の
  `fence_indeterminate_foreign_activity`（exit code 2、再実行指示付き）として報告する。
  一方、テスト残留候補が1件でもあれば、foreignの有無に関係なく従来どおり fail-close とし、
  indeterminateへ降格しない。

### Step 2: [並列] 決定論的再現 oracle
- 走行中の foreign commit / untracked 生成 / 編集を模す決定論的 fixture を追加し、
  「foreign activity → 判定不能 (テスト失敗でない)」「テスト残留 → fail」の両方向を
  real-repo regression test で実証する (prose 主張の禁止、coding ≠ substance)。

### Step 3: [直列] 回帰確認
- 直列理由 = **verification_gate**。full suite green + doctor green +
  fence 真陽性 (残留検出) の既存回帰が退行しないことを確認。

## pair-freeze 境界 (Issue #77)

この recovery slice は、既存の `PLAN-L7-421` fence を置き換えず、before/after
差分の**帰責結果だけ**を追加する。foreign activity を検出した場合に成功へ丸めず、
`fence_indeterminate_foreign_activity` と再実行指示を返す。テスト自身の残留は従来どおり
fail-close とし、foreign path を許可リストへ追加して隠す方式は採らない。

実装着手時に、次の候補を `docs/test-design/harness/L7-unit-test-design.md` へ
1:1 で昇格し、同じ commit で `generates` へ実装成果物を追加する。

| candidate | Red入力 | 期待結果 |
|---|---|---|
| `CANDIDATE-R11-001` | HEAD が before/after で移動 | foreign 判定不能、再実行指示、テスト残留扱いにしない |
| `CANDIDATE-R11-002` | 明示された `foreignActivityEvidence` と一致する編集または untracked 生成 | foreign 判定不能、silent pass 0 |
| `CANDIDATE-R11-003` | 対象 path のテスト残留 | 従来どおり fail-close |
| `CANDIDATE-R11-004` | foreign activity とテスト残留の同時発生 | 残留を優先して fail-close、indeterminateへ降格しない |

`foreignActivityEvidence` が無い非対象pathの編集・untracked生成は `unknown` として残留候補に倒す。
これにより、検証不能を理由にテスト残留を見逃すfail-openを許さない。

対象外は、snapshot runner のI/O scheduler・clone/cache再設計、CI workflowの変更、
他ランタイムの停止・排他制御である。本PRでは source/test-design の変更を行わず、
この境界と実装順序だけをpair-freezeする。

## AC

- [ ] 走行中の foreign commit / 編集 / untracked 生成だけでは full suite が
      「テスト失敗」として Red にならない (判定不能の明示エラー or 分類上の除外、
      real-repo regression test で実証)。
- [ ] テスト自身の起動元 worktree 残留は従来どおり fail-close (既存真陽性回帰の維持)。
- [ ] 判定不能ケースは silent pass ではなく、再実行指示を含む明示メッセージを出す。
- [ ] doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。
