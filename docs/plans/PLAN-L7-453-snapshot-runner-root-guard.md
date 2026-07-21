---
plan_id: PLAN-L7-453-snapshot-runner-root-guard
title: "PLAN-L7-453 (troubleshoot): snapshot runner の root 実行 fail-fast — chmod ベース reference seal が uid=0 で無効になる問題の封鎖 (issue #79)"
kind: troubleshoot
layer: L7
drive: agent
status: draft
route_signal: incident
route_mode: incident
created: 2026-07-21
updated: 2026-07-21
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-421 で導入済みの reference seal 機構の前提条件 (非 root 実行) を機械強制する堅牢化であり、新規 L0/L1 要件ではない。seal の設計自体は変更しない。"
agent_slots:
  - role: se
    slot_label: "SE — uid=0 検出 fail-fast の実装 (scripts/run-vitest-snapshot.ts)"
  - role: qa
    slot_label: "QA — root/非 root 両分岐の regression (uid モック負例含む)"
  - role: tl
    slot_label: "TL — fail-fast 採択 (fallback 非採択) の設計判断レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-453-snapshot-runner-root-guard.md
    artifact_type: markdown_doc
  - artifact_path: scripts/run-vitest-snapshot.ts
    artifact_type: script
  - artifact_path: tests/vitest-snapshot-runner.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
review_evidence: []
---

# PLAN-L7-453 (troubleshoot): snapshot runner の root 実行 fail-fast

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/79

## 背景

PLAN-L7-421 の reference seal は POSIX 上で `chmod 0o555/0o444` により
reference snapshot tree を物理 read-only 化し、Vitest 実行後に fingerprint
再検証で改変を fail-close 検出する。しかし **root (uid=0) は DAC 権限を
無視して書き込めるため、chmod ベースの seal は uid=0 では保護効果が無い**。
Docker CI / devcontainer で root 実行すると、suite 実行中の reference 改変が
防がれず、終了時の `snapshot reference fingerprint mismatch` で full suite が
一括 Red になる (同一 suite が一般ユーザーでは green)。失敗様態が「原因
(root 実行) から遠い場所 (終了時 fingerprint)」で発火するのが問題の本体。

## 設計判断記録

- **採択: 起動時 uid=0 検出で fail-fast** (明確なメッセージ + 非 root 実行の
  案内 + exit 1)。
- 非採択: copy-comparison fallback (seal を権限に依らない複製比較へ切替)。
  理由 = fallback は保護機構の二重化で複雑度が上がる一方、root 実行自体が
  テスト衛生上望ましくない (live tree fence の前提も崩す)。fail-close 原則
  (fail-open の看板替え禁止) に沿い、まず明示拒否で封じる。fallback が実需要
  になれば別 PLAN で追加する。PO 事後確認可。
- Windows (`process.platform === "win32"`) は本 guard の対象外 (現状維持)。
  理由 = `process.getuid` が win32 に存在せず uid=0 (POSIX root) という概念
  自体が適用不能なため、`assertNotRoot` は `getuid` 未提供時に no-op となる
  設計で自然にスキップされる。**win32 の `sealReference` は seal 自体が
  no-op なのではない** — `attrib`/`icacls` による ACL 拒否ベースの seal を
  実行している (`sealReference` 実装参照)。Administrator 昇格実行時に当該
  ACL 拒否がどこまで実効するかは別軸の課題であり、本 PLAN のスコープ外
  (uid=0 の DAC bypass 問題とは異なる)。

## 工程表

### Step 1: [直列] uid=0 fail-fast guard 実装
- `scripts/run-vitest-snapshot.ts` の runner 起動経路 (seal 実行前) に
  uid=0 検出を追加。エラーメッセージは原因 (chmod seal が root で無効) と
  対処 (非 root ユーザーで実行) を明記する。
- guard は export された純関数として切り出し、uid 供給を注入可能にして
  テスト可能性を確保する (実 root をテストで要求しない)。

### Step 2: [直列] regression test
- 直列理由 = **verification_gate**。純関数 `assertNotRoot` の正例/負例に加え、
  `runSnapshotTests` entrypoint 経路で uid=0 注入時に **seal はもちろん
  `createSnapshot` 等いかなる副作用よりも前に** throw すること、および
  uid≠0 注入時は guard を素通りして本来の後続処理へ到達することを
  `tests/vitest-snapshot-runner.test.ts` に追加し green を確認。

## AC

- [x] uid=0 で runner が seal 実行前に exit 1 し、原因と対処を含むメッセージを
      出す (テスト実測)。根拠:
      `U-TESTHYGIENE-048` (`assertNotRoot(() => 0)` が
      `"vitest snapshot runner refuses to run as root (uid=0)"` /
      `chmod-based reference seal` / `Re-run as a non-root user` を含む
      メッセージで throw することを純関数レベルで実測) に加え、
      `U-TESTHYGIENE-050` (`runSnapshotTests(["--reporter=dot"], process.cwd(), () => 0)`
      が同メッセージで throw し、かつ呼び出し前後で `tmpdir()` に
      `ut-tdd-vitest-*` 新規エントリが **1 件も作られない**ことを実測 — 
      `createSnapshot` / `sealReference` を含むどの副作用よりも手前で
      fail-fast することを entrypoint 経路で直接検証)。`runSnapshotTests` は
      `assertBatchVitestArgs` 直後・`snapshotRoot` 等の一時パス組み立てより前に
      `assertNotRoot(getuid)` を呼ぶ (`getuid` は `runSnapshotTests` の第3引数
      で注入可能、既定値 `process.getuid`)。
- [x] uid≠0 / `process.getuid` 不在 (win32) では従来経路が変化しない
      (既存テスト green 維持)。根拠: `U-TESTHYGIENE-049`
      (`assertNotRoot(() => 1000)` / `assertNotRoot(undefined)` は
      throw しない) に加え、`U-TESTHYGIENE-051`
      (`runSnapshotTests(["--reporter=dot"], <存在しない repoRoot>, () => 1000)`
      が guard の `"refuses to run as root"` メッセージでは **なく**、guard を
      通過した後段 (`createSnapshot` の `ENOENT`) で失敗することを実測 — 
      非 root uid では guard が後続処理をブロックしないことを entrypoint
      経路で直接確認)。既存 13 件 + 新規 4 件 (048-051) = 17 件 green。
- [x] typecheck / 対象 vitest / plan lint green。review evidence を記録。
      根拠: `bun run typecheck` exit 0 (2026-07-21)。
      `bun run lint` (`biome check src tests`) 544 files fixes なし (2026-07-21)。
      `bun src/cli.ts plan lint` `plan-schedule — OK` (2026-07-21)。
      vitest 17 tests green — **実行経路の注記**: 正規経路
      `bun scripts/run-vitest-snapshot.ts tests/vitest-snapshot-runner.test.ts`
      は `resolveSnapshotSource` が git top-level では常に `kind: "git"` を
      選び、**直近コミット (HEAD) を `git clone` した detached snapshot**
      に対して実行する設計 (PLAN-L7-421 の detached-HEAD 保護そのもの)。
      本 PLAN の変更はこの worktree で未コミットのため、正規経路のみでは
      本変更を検証できない (HEAD 実測は変更前の 13 件のまま green になる
      だけで、新規 4 件を通さない — 実際に正規経路一発目でこれを確認し、
      誤って「green」と早合点しかけた反省点)。そのため
      `UT_TDD_TEST_EXECUTION_ROOT` / `UT_TDD_TEST_FENCE_ROOT` /
      `UT_TDD_HEAD_SNAPSHOT_ROOT` を worktree 自身に向けて `bun x vitest run`
      を直接実行し (clone/install/db-rebuild 工程を経ずに `global-setup.ts` の
      fence 要件だけを満たす診断的実行経路)、未コミットの実コードに対して
      17 tests green を実測した。加えて `assertNotRoot` /
      `runSnapshotTests` を直接 import する独立スクリプトでも同一 4 分岐を
      再実測し一致を確認 (詳細は最終報告)。**commit 後に正規経路
      (`bun scripts/run-vitest-snapshot.ts`) での再確認が必要** — orchestrator
      による commit 後、同コマンドを再実行して 17 tests green を確認すること。
      review_evidence (cross-provider review) は本 slice では未実施につき
      空のまま維持する。
