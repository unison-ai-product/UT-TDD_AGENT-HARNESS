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
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
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
  - artifact_path: scripts/run-vitest-snapshot.ts
    artifact_type: script
  - artifact_path: src/runtime/repo-root.ts
    artifact_type: source_module
  - artifact_path: src/doctor/runtime-state-location.ts
    artifact_type: source_module
  - artifact_path: src/doctor/test-repository-isolation.ts
    artifact_type: source_module
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: vitest.config.ts
    artifact_type: config
  - artifact_path: package.json
    artifact_type: config
  - artifact_path: tests/global-setup.ts
    artifact_type: test_code
  - artifact_path: tests/support/git-workspace-fingerprint.ts
    artifact_type: test_code
  - artifact_path: tests/support/temp-tree.ts
    artifact_type: test_code
  - artifact_path: tests/support/workspace-roots.ts
    artifact_type: test_code
  - artifact_path: tests/doctor-test-repository-isolation.test.ts
    artifact_type: test_code
  - artifact_path: tests/persistent-db-cleanup-contract.test.ts
    artifact_type: test_code
  - artifact_path: tests/vitest-snapshot-runner.test.ts
    artifact_type: test_code
  - artifact_path: tests/git-workspace-fingerprint.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor-runtime-state-location.test.ts
    artifact_type: test_code
  - artifact_path: tests/vitest-config.test.ts
    artifact_type: test_code
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
- **T-6 (snapshot runtime 漏れ)**: detached clone が source `node_modules` を
  symlink/junction で再利用するため、Vitest/Vite の既定 cache を source 側へ
  書く。runner 固有の一時 cache root を環境注入し、update check cache と同じ
  cleanup 境界で削除する。Clean Pack でも同一 runner を使い、Pack の標準
  `bun test` を隔離実行する。
- **T-7 (snapshot 内の読書き競合)**: 全 test file が同じsnapshotを並列共有すると、
  writer test が生成中の `.ut-tdd` をdoctor等のrepository-read testが観測する。
  runnerは「書込み可能な実行snapshot」と「fingerprintで不変を強制するHEAD読取り
  snapshot」を分離し、`headSnapshotRoot()` 契約は後者だけを返す。
- **T-8 (snapshot 正本の単一 revision 化)**: execution/reference を別々の可変
  `HEAD` から作ると hybrid commit 境界で revision が割れる。起動時に OID を一度だけ
  捕捉し、両 snapshot を同一 OID へ detached checkout して一致を fail-close する。
  親 Git 配下の非 Git Pack は top-level exact 一致で copy mode と判定し、reference へは
  `harness.db` と整合用 `feedback-lifecycle.jsonl` だけを注入する。
- **T-9 (検出器の構文回避)**: repository read / persistent DB cleanup の単純な
  namespace・named/const/destructuring alias、element access、async API、options alias、
  `if (false)` cleanup decoy を負例 corpus に加える。一般的な interprocedural dataflow、
  lifecycle post-dominator、mutation survivor 0 は
  `PLAN-L7-425-independent-detector-meta-verifier` で自己証明する。
  HEAD referenceへのmutationはNode/Bunの直接sinkをAPIごとのdestination引数として
  判定する。`open`はwrite-capable flagをfail-closeし、FD/FileHandleを経る任意dataflowは
  同PLAN-L7-425へdebt routeする。

## 工程表

### Step 1: [並列] T-1 の tmp 分離
- fake provider の書き込み先を tmp cwd へ寄せ、repoRoot への書き込みをゼロ化。

### Step 2: [並列] 残留検出 fence
- vitest globalSetup/teardown で全走行前後の `git status --porcelain` を比較し、
  テストが作業ツリーへ残したファイルがあれば fail する fence を追加。

### Step 3: [直列] live 測定テストの検出基盤と方針適用
- 直列理由 = **downstream_dependency** (棚卸し結果が個別方針を決める)。
- tests/ 配下で repository 読みを静的検出する lint (reason・呼出数を持つ契約台帳方式)
  を追加。再棚卸しで検出した 71 test/support file は全件を
  (a) detached HEAD snapshot、(b) 隔離 fixture のいずれかへ分類・適用する。CI 専用の
  live tree 測定は残さず、新規・呼出数差分・古い契約は全て fail-close とする。
  T-2 は rebuild 済み DB を前提とする guard (未 rebuild ならテスト内で rebuild
  or 明示 skip 理由) を入れる。snapshot runner は clone/copy 内で `db rebuild` を
  実行し、起動元の gitignored DB を継承しない決定論的fixtureを作る。

### Step 4: [並列] vitest.config 明示 + 誤配置 state 検出
- include/exclude/testTimeout を明示し、config-drift テストで固定。
- doctor へ「`.ut-tdd/` が repo root 以外に存在する」誤配置検出を追加し、
  現存の `docs/plans/.ut-tdd/` 残留を除去。

### Step 5: [直列] 回帰確認
- 直列理由 = **verification_gate**。全テスト green + doctor exit 0。

## 実装・検証記録 (2026-07-13)

- snapshot runner は同一 OID、Git top-level exact 判定、限定runtime input、全cleanup
  aggregate を実装した。
- repository isolation は再帰走査、契約件数/stale/unclassified fail-close に加え、
  alias・async・bracket・bare `headSnapshotRoot()` decoy、Node/Bunの直接mutation sink
  destination の負例を持つ。
- persistent DB cleanup は owner 自動発見、namespace/destructuring/const alias、async
  `rm`、options chain、dead cleanup decoy を負例化した。
- HEAD `97968c6c` で `172 files / 1661 tests` green、doctor `60/60` green、起動元・
  reference fingerprint差分ゼロを確認した。以後のdetector強化はHEAD `6b88fac6` の
  targeted `18/18` greenまで確認済みで、最終full suiteを再実行して証拠を更新する。
- `doctor.test.ts` のaggregate baselineはPLANがdraftの間だけ
  `merged-plan-status` 1件を許可する。PLAN confirm時に許可を0件へ更新し、doctor全体
  greenを復元することを解除条件とする。

## AC

- [ ] テスト全走行後に**起動元 worktree**の `git status --porcelain` 差分ゼロ
      (snapshot 外を fingerprint する fence が機械検証)。
- [ ] repository 読みテストが detached HEAD snapshot / 隔離 fixture の契約台帳下にあり、
      新規・呼出数差分・古い契約は lint が fail する (real-repo regression test で実証)。
- [ ] vitest.config に include/exclude/testTimeout が明示され drift テスト有り。
- [ ] `docs/plans/.ut-tdd/` 残留が除去され、誤配置検出が doctor に載っている。
- [ ] (T-5) DB テストの cleanup が共通ヘルパ経由で Windows lock retry
      (`maxRetries`) を持ち、エラー握り潰しをしない。
- [ ] Gitは単一捕捉OID、non-Gitは単一execution captureからreferenceを生成し、live source二度読みに依存しない。
      non-Git copyは全階層の`.git`／`.ut-tdd`／`node_modules`を含まず、post-rebuild注入はDBとfeedback lifecycle logのみである。
- [ ] referenceはVitest起動からcleanup直前まで物理的にread-onlyであり、Windowsを含むcanonical path比較でexecution rootと
      reference rootを混同しない。seal／revision／fingerprint／cleanup failureはexit 1である。
- [ ] repository read契約は`head_snapshot`／`isolated_fixture`のmode別exact countを持つ。sinkへ到達しないbare／void／
      unused／assertion-only rootは数えず、HEAD root（alias・静的derived pathを含む）のNode/Bun直接write sinkはhard violationとなる。
      FD/FileHandleを経る任意dataflowはPLAN-L7-425の独立自己証明対象としてdebt routeする。
- [ ] persistent DB cleanupはnamed／namespace／destructuring／element／alias／options chainを正規化し、constant-dead cleanupを
      証拠にしない。任意CFG post-dominator／mutation survivor 0はPLAN-L7-425へdebt route済みである。
- [ ] confirm時に`tests/doctor.test.ts`の`merged-plan-status` transitional allowanceを0件へ戻し、doctor exit 0を最終証拠とする。
