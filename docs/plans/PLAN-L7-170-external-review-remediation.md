---
plan_id: PLAN-L7-170-external-review-remediation
title: "PLAN-L7-170 (troubleshoot): 外部レビュー(GPT5.5Pro)指摘4件の remediation — setup --dry-run 無副作用 / --execute --json 契約 / runtime-portability git非依存 fallback / work-guard marker one-shot + green-command digest coordinated 再stamp"
kind: troubleshoot
layer: L7
drive: be
status: confirmed
created: 2026-06-26
updated: 2026-06-26
owner: PM (Opus) / PO (人間)
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling fixes (setup CLI dry-run side-effect封鎖 / runtime adapter --execute --json 出力契約 / runtime-portability lint の git非依存 fallback / work-guard 衝突ガードの marker one-shot 化). いずれも既に文書化済の契約 (CLI help「書き込まない」, team run の --execute --json 先例, guard の「今回だけの例外」意図) を実装側で回復するもので、製品の外部 requirement / design / test-design 契約を新設・変更しない。よって upstream backprop 対象なし。"
agent_slots:
  - role: aim
    slot_label: "AIM — 外部レビュー指摘の再現確認 + 問題定義 + remediation 方針 (案A) 確定"
  - role: se
    slot_label: "SE — 4 修正実装 + 回帰テスト + digest 再stamp"
  - role: tl
    slot_label: "TL — cross-runtime (Codex gpt-5.5) desk review"
generates:
  - artifact_path: docs/plans/PLAN-L7-170-external-review-remediation.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/lint/runtime-portability.ts
    artifact_type: source_module
  - artifact_path: .claude/hooks/work-guard.ts
    artifact_type: hook
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-portability.test.ts
    artifact_type: test_code
  - artifact_path: tests/work-guard.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-114-work-guard.md
    - docs/plans/PLAN-L7-131-plan-complete-handover.md
    - docs/plans/PLAN-L7-138-quality-branch-audit.md
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
    - docs/plans/PLAN-L7-158-refactor-detector-precision-and-policy-extraction.md
    - docs/plans/PLAN-L7-166-setup-template-catalog-split.md
    - docs/plans/PLAN-REVERSE-131-plan-complete-handover.md
review_evidence:
  - reviewer: codex
    review_kind: cross_agent
    reviewed_at: "2026-06-26T12:10:00+09:00"
    tests_green_at: "2026-06-26T11:45:00+09:00"
    verdict: approve
    scope: "外部レビュー指摘4件の修正 (setup --dry-run 無副作用化 / runtime adapter --execute --json 実行+実行結果JSON / runtime-portability git非依存 filesystem fallback / work-guard override marker one-shot 消費) と回帰テスト、および 7 confirmed PLAN の green-command digest coordinated 再stamp 方針 (案A) の desk review。Codex(gpt-5.5) は6観点 (A 修正妥当性 / B --execute --json 契約 / C marker×hybrid協調 / D 再stamp 監査性 / E 他PLAN digest 訂正手順 / F Biome drift) で approve。marker consume が env override を消す懸念は誤読 (consume は source==marker 分岐内、env優先で source=env のため非消費) と実コードで確認。"
    worker_model: claude-opus-4-8
    reviewer_model: gpt-5.5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/setup.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T11:40:00+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:91f2a2d6bd146b908ca47168a8102ca955f709e0c2d9df911336d818975998c5"
      - kind: unit_test
        command: "bun run vitest run tests/cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T11:41:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:02dfec21181e8478f0ba3da13c010c8f155d45c9202ef008eb13fcbf3364dfb5"
      - kind: unit_test
        command: "bun run vitest run tests/runtime-portability.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T11:42:00+09:00"
        evidence_path: tests/runtime-portability.test.ts
        output_digest: "sha256:d5760a2295325537bab5c8c43333b48628cc796f541b0ec2d22b63da850aa883"
      - kind: unit_test
        command: "bun run vitest run tests/work-guard.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T11:43:00+09:00"
        evidence_path: tests/work-guard.test.ts
        output_digest: "sha256:5ff89dd03a0e6ec91733514d7c94ee10a7bf2dbe8b148a24c73d779a0681c35b"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T11:44:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:be796648c6b7a34bcc93f007ad7a6b9c4c5ac0765a42f243b10b3b7378f2147b"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T11:44:10+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:517832835f03fa606ae79b8709c6d4bd0e229b4461303aa6616cad8d92b87a2c"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T11:44:20+09:00"
        evidence_path: src/lint/runtime-portability.ts
        output_digest: "sha256:3b4ed93f78c9f90bf917bc12720c0ef2df85c56017ebc57e3cd284adf2de975d"
      - kind: unit_test
        command: "bun run vitest run tests/work-guard.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T11:43:30+09:00"
        evidence_path: .claude/hooks/work-guard.ts
        output_digest: "sha256:5cd75baface268cb4cb817ee1b205a792714447361241a2ae5e6825866fe0b91"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T11:45:00+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:517832835f03fa606ae79b8709c6d4bd0e229b4461303aa6616cad8d92b87a2c"
---

# PLAN-L7-170: 外部レビュー remediation (4 findings + digest 再stamp)

## Objective

外部レビュー (GPT5.5Pro) が UT-TDD harness に挙げた 4 件の欠陥を、実コードで全件再現確認した上で
修正し、各々に real-repo 回帰テストを付ける。あわせて、mega-file (`src/cli.ts` 等) を green-command
evidence として content-hash 参照していた 7 つの confirmed PLAN の `output_digest` が本修正の編集で
stale 化したため、green 再実行済みの coordinated 再stamp (案A) で監査整合を回復する。

外部レビューは coverage ではなく substance を見ており、4 件は全て「機械で守る」思想との不整合
(`coding ≠ substance`) だった。本 PLAN はその回復であり、新規 requirement/design を導入しない
(`backprop not_required`)。

## 修正 (4 findings)

### F1 — `setup --dry-run` が副作用を持つ (Critical)
- 問題: `runSetup` が dryRun でも `recordSetupState` で `.ut-tdd/state/setup.json` を書き、
  `applyBranchProtection` も dryRun を見ず、`--dry-run --apply-branch-protection`+対話+admin+confirm で
  remote の branch protection 適用まで進み得た。CLI help は「生成物一覧のみ表示 (書き込まない)」。
- 修正 ([src/setup/index.ts](../../src/setup/index.ts)): dryRun=true で `recordSetupState` を封鎖し、
  `branchProtection` を `{ applied:false, reason:"dry-run" }` に固定。`emitSetup` は元から `plan.dryRun`
  を尊重して非書込。`runSetup` の不変条件コメントに「dryRun=true は副作用ゼロ」を明記。
- AC: dry-run は state を書かず、mutating gh 経路 (`auth status` / `-X PUT`) に決して入らない。
- 回帰テスト: `U-SETUP-008` (state非書込 / 生成物非書込 / mutating gh非呼出 / `reason="dry-run"`)。
  既存 `U-SETUP-007` ③④ は dry-run で state を書く前提に依存していたため、本来意図 (fallback決定 /
  非対話 branch protection precondition) を保つよう `dryRun:false` に修正。

### F2 — `codex/claude --execute --json` が実行せず `dry_run:false` を返す (High)
- 問題: `runtimeCommand` が `if (opts.json || !opts.execute)` で `--execute --json` を実行前に return し、
  しかも JSON は `dry_run:false` / "adapter execution allowed"。実行していないのに実行済みに見える
  機械判定の罠だった。
- 修正 ([src/cli.ts](../../src/cli.ts)): `team run` と同契約に統一。`--json` は出力形式であって実行抑止
  ではない。`--execute --json` は provider を起動し、末尾で実行結果 JSON (`executed:true`,
  `exit_code`, `dry_run:false`) を返す。json 時は provider の stdout を fd2(stderr) へ逃がし、parent
  stdout を実行結果 JSON 専用に保つ。
- AC: `--execute --json` は実際に provider を起動し、stdout は機械パース可能な実行結果 JSON のみ。
- 回帰テスト: cli-surface に「fake provider 起動 + stdout に provider noise を含まない + `dry_run:false`
  + env dump で実起動を確認」を追加。

### F3 — runtime-portability lint が git 非依存で動かない (Medium)
- 問題: `loadRuntimePortabilityDocs` の git 失敗時 fallback が `package.json` / `tsconfig.json` の 2
  ファイルだけへ縮退し、zip/tarball 展開 (`.git` 不在) では `src/` / `scripts/` / `.claude/hooks/` が
  検査面から脱落した。harness は公開配布物 (system=public) ゆえ配布物での検査欠落は実害。
- 修正 ([src/lint/runtime-portability.ts](../../src/lint/runtime-portability.ts)): git 失敗時に既知 prefix
  (`src` / `.claude/hooks` / `scripts`) のみ降下する filesystem walk へ fallback (node_modules / dist /
  .git は走査しない)。
- AC: `.git` 不在でも `src/` 配下が検査面に含まれる。
- 回帰テスト: `U-RPORT-007` (`.git` を作らず `src/legacy.py` を検出)。

### F4 — work-guard override marker が永続 (Medium)
- 問題: `.ut-tdd/state/foreign-edit-override` marker は読むだけで消費されず、古い marker が残ると
  「今回だけの例外」が「以後ずっと例外」になり、foreign-edit guard を広く無効化していた。
- 修正 ([.claude/hooks/work-guard.ts](../../.claude/hooks/work-guard.ts)): marker を **one-shot** 消費
  (foreign 編集を許可した 1 tool-call で削除)。env override は人間管理ゆえ非消費。
  `consumeOverrideMarker` は `if (override.source === "marker" && targets.length > 0)` 分岐内に置き、
  env 優先 (source=env) 時は消えない (Codex の「env でも消す」懸念は diff 文脈の誤読で、実コードは
  仕様どおり)。`.claude/CLAUDE.md` の Guard Rules 記述も one-shot に同期。
- AC: marker 使用後は削除され、次の同一 foreign 編集は再び block (exit 2)。audit 証跡は残る。
- 回帰テスト: 実 hook spawn で「1回目=許可+marker消費+audit残存 / 2回目=block(exit2)」。

### 非対応 — Biome warning 4 件 (Minor, drift 偽陽性)
- 外部レビューの Biome 4 件は pinned biome `2.4.15` (`bun run lint` = CI 同一) では 262 ファイル
  warning ゼロ・exit 0。別 version (`npx biome`) の drift 由来の偽陽性のため編集見送り。canonical
  toolchain が報告しない warning への投機編集は `coding ≠ substance`。

## green-command digest coordinated 再stamp (案A、Codex E 準拠)

本修正は `src/cli.ts` / `src/setup/index.ts` および test ファイルを編集した。これらを green-command
evidence として content-hash 参照していた 7 confirmed PLAN の `output_digest` が stale 化したため、
green 再実行済みで coordinated に再stamp した (機械改ざんでなく content-address の更新)。

- 再stamp 対象 (11 entries / 7 PLAN):
  - PLAN-L7-114-work-guard → tests/work-guard.test.ts
  - PLAN-L7-131-plan-complete-handover → tests/cli-surface.test.ts
  - PLAN-L7-138-quality-branch-audit → src/cli.ts, tests/cli-surface.test.ts
  - PLAN-L7-139-codex-hook-adapter → tests/work-guard.test.ts
  - PLAN-L7-158-refactor-detector-precision-and-policy-extraction → src/cli.ts, tests/cli-surface.test.ts
  - PLAN-L7-166-setup-template-catalog-split → tests/setup.test.ts, src/setup/index.ts (×2)
  - PLAN-REVERSE-131-plan-complete-handover → src/cli.ts
- green 再実行: `bun run typecheck` (pass) / `bun run lint` (clean) / 全 vitest (logic 1093 pass) /
  対象 test (setup / cli-surface / runtime-portability / work-guard / runtime-hook-entrypoints) 全 green。
- baseline: HEAD `0f46f3a` + 本 PLAN の意図変更のみ。
- claim 不変: 各 PLAN の verdict / scope / 主張は変えず、`output_digest` の hash と最小限のみ更新
  (`completed_at` 等の original 監査時刻は保持)。`supersedes` 不要 (意味論不変、hash drift のみ)。
- 検証: `auditGreenCommandDigests` が再stamp 後 0 mismatch、git diff は 11 行の digest hex のみ
  (行末 churn なし)。

## Cross-runtime review

`ut-tdd codex --role qa --task-file <desk-review> --execute` (provider=codex / model=gpt-5.5、
hybrid cross_agent) で DESK REVIEW を実施。6 観点 (A〜F) で approve、コード由来の修正要求ゼロ。
worker=Claude Opus 4.8、reviewer=Codex gpt-5.5 (model family 相異 → cross_agent 成立)。Codex が
任意改善として挙げた「signal 終了を JSON に含める」は下記フォローアップで対応済。

## 軽微項目フォローアップ (同レビューの minor、PO「対応して」2026-06-26)

外部レビューの軽微2点を追加対応した。いずれも contract/品質の小改善で新規 requirement を導入しない。

- **README バッジ drift**: `Vitest 672 passing` が実数 (1100) とズレていた。手書き数値は再 drift
  するため数値を外し `Vitest passing` に変更 (Biome バッジと同様、CI 非依存で陳腐化しない)。
- **`--execute --json` の signal 併記** ([src/cli.ts](../../src/cli.ts)): signal 終了時は
  `exit_code=null` になるため、実行結果 JSON に `signal: child.signal ?? null` を併記し、機械判定が
  exit / signal を区別できるようにした (Codex A2 の任意改善)。正常終了は `signal:null`。回帰テストの
  `--execute --json` ケースに `signal: null` アサーションを追加。
- この 2 点で `src/cli.ts` / `tests/cli-surface.test.ts` を再編集したため、両者を参照する 5 PLAN
  (L7-131 / L7-138 / L7-158 / L7-170 / REVERSE-131) の 8 entries を同手順で再stamp (audit 0 mismatch)。

## Definition of Done

- [x] F1 setup --dry-run 無副作用化 + U-SETUP-008 + 既存テスト意図保持
- [x] F2 --execute --json 実行+実行結果JSON 契約 + cli-surface 回帰テスト
- [x] F3 runtime-portability git非依存 fallback + U-RPORT-007
- [x] F4 work-guard marker one-shot + .claude/CLAUDE.md 同期 + 実 hook 回帰テスト
- [x] 11 green-command digest を coordinated 再stamp (audit 0 mismatch)
- [x] Codex cross-runtime desk review approve (6 観点)
- [x] 軽微フォローアップ: README バッジ drift 解消 + `--execute --json` signal 併記 + 再stamp (8 entries)
- [x] typecheck / lint / 全 vitest / 対象 test green、doctor 緑化
- [x] staged diff が意図ファイルのみであることを確認

> 着地: 本体 remediation (F1-F4 + 11 digest 再stamp) は commit `69b1521` で landing 済。軽微
> フォローアップ (README + signal + 8 digest 再stamp) は後続コミットで delivery する。
