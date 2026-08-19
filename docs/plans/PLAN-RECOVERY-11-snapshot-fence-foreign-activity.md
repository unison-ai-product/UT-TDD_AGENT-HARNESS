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
`tests/global-setup.ts`、新設する `src/runtime/foreign-activity-sidecar.ts` の producer adapter、
`docs/test-design/harness/L7-unit-test-design.md` である。現時点で session coordinator /
foreign-activity producer adapter は `src/` に存在しないため、実装 PR がこの新規 source を追加し、
同じ commit で実装 PR の `generates` へ昇格する。adapter は既存の共通 CLI session surface
（`src/cli.ts session start|summary` と `hook post-tool-use`。Claude hook は
`.claude/hooks/session-log.ts` からこの CLI へ転送）へ接続する。`apply_patch` 等の外部 API
呼び出し面は本 slice の観測対象外であり、`src/state-db/stop-refresh-coordinator.ts` は DB refresh
専用で、この producer の実装・代替ではない。test process が evidence を直接書けない境界は、
実装 PR で adapter の producer session と runner session の分離、および fenceRoot 外の sidecar
write/read を実測して固定する。

## 是正方針 (Step 案)

### Step 1: [直列] 差分の帰責分類
* 直列理由 = **downstream_dependency** (分類設計が後続の fail 挙動を決める)。
* fence の before/after 比較は、runner が明示的に渡す相対 path の `testOwnedPaths`（既定は空集合）と、
  独立した `foreignActivityEvidence` を入力に取る。「テスト非対象」という暗黙の全パス集合は作らない。
* `foreignActivityEvidence` は任意のテスト出力ではない。新設する
  `src/runtime/foreign-activity-sidecar.ts` producer adapter が既存の共通 CLI session / runtime hook
  `fenceRoot` の**外側**に用意した sidecar を、runner の明示 port (`evidencePath`) 経由で読み取る。
  各 event は `schema_version=snapshot-fence-foreign/v1`、`event_id`、`producer_session_id`、
  `runner_session_id`、`before_head`、`after_head`、`changed_paths`、`observed_at`、`event_signature` を持つ。
  `event_signature = sha256(canonical(changed_paths_sorted|before_head|after_head))` とし、`changed_paths` は
  `testOwnedPaths` 外での相対 path 差分を収集する最小コスト入力とする。  
  managed fixture は同じ schema を注入して実運用の producer を決定論的に再現する。test code 自体は
  sidecar を書けない境界を前提とする。
- event は run の開始・終了時刻内で、`before_head` / `after_head` / `changed_paths`（集合一致）/`event_signature`
  が実測差分と一致し、`producer_session_id != runner_session_id` のときだけ検証済みとする。  
  commit の changed path が `testOwnedPaths` と交差する場合、または sidecar が欠落・不正・期限外・一致不能の場合は
  foreign と認定しない。
- 複数 event がある場合は `observed_at` 順で時系列に集約して判定する。集約結果は
  `before_head = 先頭.event.before_head`、`after_head = 最後.event.after_head`、`changed_paths = 和集合` とする。
  集約中の時系列不連続（`prev.after_head != next.before_head`）は `unknown` 扱いで検証不能とし、残留扱いへ倒す。
- **分類不能な差分は残留候補として fail-close** とする。HEAD移動だけでは foreign にならず、検証済みの
  `foreignActivityEvidence` と一致する差分だけを `foreign_activity` として分類する。これにより、テスト自身が
  commitしてstatusをcleanに戻す経路も、証跡が無い限り従来どおり fail-close になる。
- foreign activityだけでテスト残留が無い場合は、テスト失敗とは別の
  `fence_indeterminate_foreign_activity`（exit code 2、再実行指示付き）として報告する。
  一方、テスト残留候補が1件でもあれば、foreignの有無に関係なく従来どおり fail-close とし、
  indeterminateへ降格しない。

### Step 2: [並列] 決定論的再現 oracle
- sidecar eventを発行する producer adapter fixtureと、走行中の foreign commit / untracked 生成 / 編集を模す
  決定論的 fixture を追加し、「検証済み foreign activity → 判定不能 (テスト失敗でない)」「証跡なし / テスト残留 → fail」の両方向を
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
| `CANDIDATE-R11-001` | producer adapter sidecarと完全一致するforeign HEAD移動 | foreign 判定不能、再実行指示、テスト残留扱いにしない |
| `CANDIDATE-R11-002` | producer adapter sidecarとhead/changed_paths/event_signatureが完全一致する foreign 編集または untracked 生成 | foreign 判定不能、silent pass 0 |
| `CANDIDATE-R11-003` | 対象 path のテスト残留 | 従来どおり fail-close |
| `CANDIDATE-R11-004` | foreign activity とテスト残留の同時発生 | 残留を優先して fail-close、indeterminateへ降格しない |

`foreignActivityEvidence` が無い非対象pathの編集・untracked生成、またはHEADだけが移動したケースは
`unknown` として残留候補に倒す。これにより、検証不能を理由にテスト残留を見逃すfail-openを許さない。

Issue #77 の番号をReverse PLANのnumeric coreへ保持する必要があるため、既存の
`PLAN-L6-77` / `PLAN-L7-77` とnumeric coreが衝突する点は issue #128 のrekey debtとして明記して維持する。
このpairではrekeyを行わず、`PLAN-REVERSE-77` のIssue対応関係を優先する。

対象外は、snapshot runner のI/O scheduler・clone/cache再設計、CI workflowの変更、
他ランタイムの停止・排他制御である。本PRでは source/test-design の変更を行わず、
この境界と実装順序だけをpair-freezeする。

## AC

- [ ] coordinator が発行した検証済み sidecar event と一致する foreign commit / 編集 / untracked 生成だけでは
      full suite が「テスト失敗」として Red にならない (判定不能の明示エラー、real-repo regression testで実証)。
  - ただし対象 surface は CLI / IDE の sidecar（fixture と実装される既定 producer）に限定し、
    当該 surface 外（例: API 経由の外部 tool 呼び出し）で発生した差分は観測不能として `unknown` 扱いにし、
    従来どおり残留として Red 扱いを維持する。
  - sidecar が無い・不正・一致しない場合は、HEAD 移動を含めて従来どおり残留として Red にする。
- [ ] テスト自身の起動元 worktree 残留は従来どおり fail-close (既存真陽性回帰の維持)。
- [ ] 判定不能ケースは silent pass ではなく、再実行指示を含む明示メッセージを出す。
- [ ] doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。
