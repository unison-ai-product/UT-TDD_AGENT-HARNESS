---
plan_id: PLAN-L7-453-snapshot-runner-root-guard
title: "PLAN-L7-453 (troubleshoot): snapshot runner の root 実行 fail-fast — chmod ベース reference seal が uid=0 で無効になる問題の封鎖 (issue #79)"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
route_signal: incident
route_mode: incident
created: 2026-07-21
updated: 2026-07-21
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-421 で導入済みの reference seal 機構の前提条件 (非 root 実行) を機械強制する堅牢化であり、新規 L0/L1 要件ではない。seal の設計自体は変更しない。"
agent_slots:
  - role: aim
    slot_label: "AIM — incident原因とroot/Windows実行環境境界の分析"
  - role: se
    slot_label: "SE — uid=0 検出 fail-fast の実装 (scripts/run-vitest-snapshot.ts)"
  - role: qa
    slot_label: "QA — root/非 root 両分岐の regression (uid モック負例含む)"
  - role: tl
    slot_label: "TL — fail-fast 採択 (fallback 非採択) の設計判断レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-453-snapshot-runner-root-guard.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
    - scripts/run-vitest-snapshot.ts
    - src/doctor/test-repository-isolation.ts
    - tests/vitest-snapshot-runner.test.ts
    - docs/test-design/harness/L7-unit-test-design.md
review_evidence:
  - reviewer: blind-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-21T14:44:00+09:00"
    tests_green_at: "2026-07-21T14:39:00+09:00"
    verdict: approve
    worker_model: gpt-5.6-sol
    reviewer_model: gpt-5.6-sol
    scope: "HEAD a0fda541 の初回 Codex FLAG 解除差分を read-only claim-blind/spec-blind 再レビュー。repository-read exact contract=2、L7 test-design U-TESTHYGIENE-048〜052、Windows ACL command/runtime evidence境界、diff hygieneを確認。attack 4件は全てartifact/test citationで反駁され、未反駁High/MediumなしのPASS。GitHub両OS/aggregateは別のmerge gateとしてpending扱い。"
    green_commands:
      - kind: unit_test
        command: "execution/fence/head rootをworktreeへ固定した bun x vitest run tests/vitest-snapshot-runner.test.ts tests/doctor-test-repository-isolation.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-21T14:39:00+09:00"
        evidence_path: tests/vitest-snapshot-runner.test.ts
        output_digest: "sha256:d05b7dc96c43cd6505579e58a16fcefeb5b3a94af817c4313101a66c138d5f79"
        anchor_commit: a0fda541f1a0755e2a4a874c906c0a3fe1f64ea8
  - reviewer: blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-21T12:20:00+09:00"
    tests_green_at: "2026-07-21T11:55:00+09:00"
    verdict: approve
    worker_model: claude-sonnet-5
    reviewer_model: gpt-5.6-sol
    scope: "HEAD bb61d9c1 (assertNotRoot guard + U-TESTHYGIENE-048〜051 + 本 PLAN) を `ut-tdd codex --role blind-reviewer` (gpt-5.6-sol) が再 blind review。前回 FLAG の解除条件 3 点 — (1) win32 記述が sealReference 実装 (attrib/icacls ACL 拒否) と整合、(2) runSnapshotTests entrypoint 経路の uid=0 fail-fast が副作用ゼロ (tmpdir に ut-tdd-vitest-* 新規生成なし) でテスト実測、(3) AC が実測根拠を引用 — を独立検証し全解消、対象テスト独立再実行 17 passed / 17 で判定 PASS (未反駁 attack なし)。"
    green_commands:
      - kind: unit_test
        command: "UT_TDD_TEST_EXECUTION_ROOT/UT_TDD_TEST_FENCE_ROOT/UT_TDD_HEAD_SNAPSHOT_ROOT を worktree に固定した bun x vitest run tests/vitest-snapshot-runner.test.ts (17 tests: 既存 13 + U-TESTHYGIENE-048〜051)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-21T11:55:00+09:00"
        evidence_path: tests/vitest-snapshot-runner.test.ts
        output_digest: "sha256:28adf612970eb0f540e92883e7777ce22b6f9f3c82c947c7872f4b6aa0733c58"
        anchor_commit: bb61d9c15449e0f6246764e0e609b16f573602f8
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
  ACL 拒否がどこまで実効するかは別軸である。通常権限での実write拒否は
  `U-TESTHYGIENE-036`、継承付き `WD,AD` deny command契約は
  `U-TESTHYGIENE-052`、明示bypass後の改変検出はfingerprint oracle
  `U-TESTHYGIENE-042`が担う。CI runnerはAdministrator昇格tokenを持たないため、
  take-ownership等のAdministrator明示bypassそのものは本PLANの完了証拠に数えない
  (uid=0 のDAC bypass問題とは異なる実行環境境界)。

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
      経路で直接確認)。既存 13 件 + 新規 5 件 (048-052) = 18 件 green。
- [x] typecheck / 対象 vitest / plan lint green。review evidence を記録。
      根拠: `bun run typecheck` exit 0 (2026-07-21)。
      `bun run lint` (`biome check src tests`) 544 files fixes なし (2026-07-21)。
      `bun src/cli.ts plan lint` `plan-schedule — OK` (2026-07-21)。
      vitest 18 tests green — **実行経路の注記**: 正規経路
      `bun scripts/run-vitest-snapshot.ts tests/vitest-snapshot-runner.test.ts`
      は `resolveSnapshotSource` が git top-level では常に `kind: "git"` を
      選び、**直近コミット (HEAD) を `git clone` した detached snapshot**
      に対して実行する設計 (PLAN-L7-421 の detached-HEAD 保護そのもの)。
      本 PLAN の変更はこの worktree で未コミットのため、正規経路のみでは
      本変更を検証できない (HEAD 実測は変更前の 13 件のまま green になる
      だけで新規テストを通さない — 実際に正規経路一発目でこれを確認し、
      誤って「green」と早合点しかけた反省点)。そのため
      `UT_TDD_TEST_EXECUTION_ROOT` / `UT_TDD_TEST_FENCE_ROOT` /
      `UT_TDD_HEAD_SNAPSHOT_ROOT` を worktree 自身に向けて `bun x vitest run`
      を直接実行し (clone/install/db-rebuild 工程を経ずに `global-setup.ts` の
      fence 要件だけを満たす診断的実行経路)、未コミットの実コードに対して
      18 tests green を実測した。加えて `assertNotRoot` /
      `runSnapshotTests` を直接 import する独立スクリプトでも同一 4 分岐を
      再実測し一致を確認 (詳細は最終報告)。**commit 後に正規経路
      (`bun scripts/run-vitest-snapshot.ts`) での再確認が必要** — orchestrator
      による commit 後、同コマンドを再実行して 18 tests green を確認すること。
      review_evidence: gpt-5.6-sol blind review (初回 FLAG → 是正 → 再 review
      PASS、2026-07-21) を frontmatter に記録済み。
