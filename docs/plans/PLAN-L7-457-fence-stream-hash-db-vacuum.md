---
plan_id: PLAN-L7-457-fence-stream-hash-db-vacuum
title: "PLAN-L7-457 (troubleshoot): harness.db 肥大によるローカル検証全停止の恒久対策 — fence streaming hash + 読取診断 + rebuild 後自動 VACUUM (issue #118)"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
route_signal: incident
route_mode: incident
created: 2026-07-22
updated: 2026-07-22
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
github_issue_id: 118
backprop_decision: not_required
backprop_decision_reason: "既存 L6 契約 (workspace fence の残留検出、db-currency hook の鮮度保証) の意味論は変えない。fence の hash 実装を丸読みからチャンク読みへ置換し、db-refresh 後の物理サイズ管理 (VACUUM) を追加する運用是正であり、新規 L0/L1 要件ではない。"
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: aim
    slot_label: "AIM — VACUUM 発火閾値 (freelist 比率/絶対量) と fail-open 境界の設計判断"
  - role: se
    slot_label: "SE — fingerprint streaming 化 / 読取診断 / stop-refresh 後 VACUUM"
  - role: qa
    slot_label: "QA — 2GiB 超ファイル相当の回帰 (モック) + freelist 縮小の実測負例"
  - role: tl
    slot_label: "TL — fence 意味論不変 (hash 同値性) と #77/RECOVERY-11 スコープ非侵食のレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-457-fence-stream-hash-db-vacuum.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/db-maintenance.ts
    artifact_type: source_module
  - artifact_path: tests/db-maintenance.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
  requires: []
  references:
    - docs/plans/PLAN-L7-365-harness-db-currency-hook.md
    - docs/plans/PLAN-RECOVERY-11-snapshot-fence-foreign-activity.md
review_evidence:
  - reviewer: codex-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-22T04:20:00+00:00"
    tests_green_at: "2026-07-22T04:27:50+00:00"
    verdict: approve
    scope: "PLAN-L7-457 全差分 (chunked-hash 新設 / fence・snapshot fingerprint 置換 / db-maintenance 新設 / stop-refresh・cli 接続)。Sol (gpt-5.6-sol) blind review: claim-blind = AC U-FSTREAM-1..3 / U-DBVAC-1..3 / U-DBCURRENCY-026..027 全件をテスト実走で独立裏取り、spec-blind = PASS (部分 read 欠落 / 毎 Stop VACUUM / lock 波及 / CLI warning 隠蔽の 4 攻撃を全反駁)。tests_green_at は評価後の evidence 採取実走 (61/61, exit 0) の時刻。実装は Sonnet (claude-sonnet-5) be-logic、統括レビュー Claude Fable 5 (merge-base diff 精読済み)。"
    worker_model: claude-sonnet-5
    reviewer_model: codex
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/git-workspace-fingerprint.test.ts tests/db-maintenance.test.ts tests/db-currency.test.ts tests/vitest-snapshot-runner.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-22T04:27:50+00:00"
        evidence_path: .ut-tdd/audit/A-L7-457-vitest.log
        output_digest: "sha256:864e3db42ba29c05aadd6f42c2f96d6b93ed54da93a608c654e823cf4aa36047"
        anchor_commit: fb6d1127
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-22T04:27:50+00:00"
        evidence_path: .ut-tdd/audit/A-L7-457-typecheck.log
        output_digest: "sha256:8366207267355d3e3d5bf3bf6e8c94c5f93f6078c34f08973fa2b38cdda6cc92"
        anchor_commit: fb6d1127
---

# PLAN-L7-457: harness.db 肥大によるローカル検証全停止の恒久対策 (issue #118)

## 1. 実測と根因 (2026-07-22)

- `.ut-tdd/harness.db` が 3,065,884,672 bytes (3.07GB) へ肥大。`PRAGMA page_count`=748,507 /
  `PRAGMA freelist_count`=610,596 — **81% (2.5GB) が freelist (空きページ)**。実データは約 534MB
  (VACUUM 実測: 42.8s で 3.07GB → 534,208,512 bytes)。
- 肥大機構: Stop hook ごとの `session db-refresh` full rebuild (PLAN-L7-365) が delete+reinsert
  churn を発生させるが、**VACUUM がどの経路でも一度も走らない**ため、ファイルサイズが単調増加する。
- ローカル検証停止点: snapshot runner の copy は `.ut-tdd` を除外済みであり、実際に fail するのは
  vitest global setup の workspace fence `captureWorkspaceInventory()`
  (`tests/support/git-workspace-fingerprint.ts`) が live fence root の全ファイルを `readFileSync`
  丸読みで hash する箇所。Bun の `readFileSync` は 2GiB 超で `ERR_FS_FILE_TOO_LARGE` を投げ、
  **fence が実行できずローカル検証が全停止**する (issue #118 の実測トレースはこの経路)。
  issue 本文の分解 2 (「runner が runtime state を copy する」) は現行実装では既に除外済みで、
  正しい欠陥位置は fence の丸読みである — 本 PLAN はこの実測で issue の分解を訂正する。

## 2. 対策 (スコープ)

### Step 1 — fence hash の streaming 化 (2GiB 上限の撤廃)

`captureWorkspaceInventory()` のファイル hash を `readFileSync` 丸読みから**固定チャンク読み**
(`openSync`/`readSync` ループ、既定 8MiB チャンク) へ置換する。

- 意味論不変: 同一ファイルに対し従来実装と**同一の sha256 値**を返す (回帰テストで同値性を固定)。
- サイズ非依存: ファイルサイズに関わらず fence が完走する (メモリ使用はチャンク長で有界)。
- `scripts/run-vitest-snapshot.ts` 側 `snapshotContentFingerprint()` も同じ丸読みを持つため、
  共通のチャンク hash ヘルパーへ寄せて両方を置換する。

### Step 2 — 読取失敗の診断性 (issue 分解 3)

fence / fingerprint がファイル読取で throw する場合、**対象ファイルの相対パスとサイズを含む
エラー**へ wrap する (`workspace fence failed reading <path> (<bytes> bytes): <cause>`)。
ERR_FS_FILE_TOO_LARGE から原因ファイルへの手動探索を不要にする。

### Step 3 — rebuild 後の条件付き自動 VACUUM (肥大の再発防止)

`src/state-db/db-maintenance.ts` を新設し、`maybeVacuumHarnessDb(dbPath, options)` を実装する:

- 発火条件 (既定): `freelist_count * page_size > max(64MiB, 全体の 25%)`。
- 発火時 `VACUUM` を実行し、before/after bytes と所要時間を戻り値で返す (呼び出し側が log)。
- 非発火時は no-op (Stop ごとの 40 秒級 VACUUM を避ける — 閾値到達時のみ)。
- 失敗 (db busy 等) は **fail-open** (rebuild 成果を壊さない。warning を返すのみ)。理由:
  VACUUM は物理サイズ最適化であり鮮度保証 (PLAN-L7-365 の正本義務) の一部ではない。
- 呼び出し点: `session db-refresh` の rebuild 完走後 (stop-refresh 実行系)。generation 検査で
  勝者となった refresh のみが実行する既存直列化に乗る (並行 VACUUM は発生しない)。

### スコープ外 (非侵食)

- fence が「何を残留とみなすか」の意味論変更 (foreign runtime activity の誤帰責) は
  PLAN-RECOVERY-11 / issue #77 のスコープであり、本 PLAN では触れない。
- Stop ごとの full rebuild 自体の設計見直し (coalescing 等) は PR #100 FLAG 系の別レーン。
- snapshot runner の固定費 redesign は issue #98 (PLAN-L6-88、Codex 進行中)。

## 3. AC (完了条件)

- [x] U-FSTREAM-1: チャンク hash が従来丸読み hash と同一 sha256 を返す (複数サイズ、境界 =
      チャンク長ちょうど/±1 バイトを含む)。
- [x] U-FSTREAM-2: チャンク読みの読取ループが EOF まで全バイトを消費する (部分 read の継続)。
- [x] U-FSTREAM-3: 読取失敗時のエラーに相対パスとサイズが含まれる (存在しないファイル/権限相当の
      注入で検証)。
- [x] U-DBVAC-1: freelist が閾値超の db で `maybeVacuumHarnessDb` が VACUUM を実行し、
      ファイルサイズが縮小する (churn を人工生成した実 SQLite db で実測)。
- [x] U-DBVAC-2: 閾値未満では no-op (VACUUM 非実行を実測)。
- [x] U-DBVAC-3: VACUUM 失敗 (別接続の排他 lock 注入) で throw せず warning を返し、rebuild 結果を
      壊さない (fail-open)。
- [x] stop-refresh 経路が rebuild 完走後に maybeVacuum を呼ぶ (spawn/実行系ユニットで検証)。
- [x] 既存 fence / snapshot runner / db-currency の全既存テストが green (意味論不変)。


根拠: review_evidence の codex-blind-reviewer green_commands (61/61, exit 0,
2026-07-22T04:27:50Z) が AC 全 ID をテスト実走で裏取り済み。checkbox は confirm 時
(2026-07-27, issue #157 drain) に同証跡へ整合させた。

## 4. 検証コマンド

- `bunx vitest run tests/git-workspace-fingerprint.test.ts tests/db-maintenance.test.ts tests/db-currency.test.ts`
- `bun run typecheck` / `bun run lint` / `bun src/cli.ts plan lint docs/plans/PLAN-L7-457-fence-stream-hash-db-vacuum.md`
