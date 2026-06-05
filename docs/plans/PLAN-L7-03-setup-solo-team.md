---
plan_id: PLAN-L7-03-setup-solo-team
title: "PLAN-L7-03 (add-impl): ut-tdd setup solo/team 実装 — src/setup/ + ut-tdd setup CLI + tests/setup.test.ts (U-SETUP) + docs/templates/github/"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-02
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
agent_slots:
  - role: tl
    slot_label: "TL — 実装/型/file↔GitHub-API 境界/非対話 apply 封鎖/token 非記録/安全フォールバックのレビュー (claude-only は code-reviewer 代替)"
  - role: qa
    slot_label: "QA — U-SETUP テスト戦略 (L7 impl 必須 role §1.8)"
generates:
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: docs/templates/github/common/
    artifact_type: template
  - artifact_path: docs/templates/github/team/
    artifact_type: template
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-05-setup-solo-team.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-02"
    tests_green_at: "2026-06-02"
    verdict: approve
    scope: "code-reviewer APPROVE (Critical 0) (handover 2026-06-02d §1)"
---

# PLAN-L7-03 (add-impl): ut-tdd setup solo/team 実装

## §0 位置づけ

`PLAN-L6-05-setup-solo-team` (add-design) の ① 機能設計 (`setup-solo-team.md`) + ③ 単体テスト設計 (U-SETUP-001〜007) を ② 実装 + ④ テストコードに落とす add-impl。**Add-feature 標準ライフサイクル 経路 B** の impl 段階。完了後、後段 `PLAN-REVERSE-04` (未起票、本 PLAN 完了後に起票予定) で L4 external-if (GitHub 境界契約) / L3 要件 (新 FR 要否) / §6.5 整合 / L0 §10 用語へ back-fill する。

- 親設計: `docs/design/harness/L6-function-design/setup-solo-team.md` (parent_design 必須、L7-02 と同じ add-impl 規約フィールド)。契約関数 7 本 + DbC + file↔GitHub-API 境界が正本。
- **dependencies**: `parent=PLAN-L6-05` で lineage 連結。`requires` には置かない (confirmed 段階の design PLAN を `status=completed` 検証対象にしないため = §1.10.E の latent fail-close 回避。bottom-up Add-feature で L7 impl は confirmed L6 設計に依存するのが常態)。
- パターン: `src/runtime/session-log.ts` (deps 注入 + 純粋関数分離 + never-throw) / `src/runtime/detect.ts` (`onPath`) / `src/cli.ts` (commander) を踏襲・再利用。drive=fullstack (親一致)。
- **セキュリティ不変条件 (CLAUDE.md エスカレーション境界)**: ① **token を読まない・state/docs/log に記録しない** / ② branch protection の実適用は `--apply-branch-protection` + **対話セッション** + admin/auth/人間 confirm の全充足時のみ (非対話は precondition で封鎖) / ③ 既定は emit-only (スクリプト+手順生成)。

## §工程表

### Step 1: src/setup/index.ts 型定義 (② 土台)
`setup-solo-team.md` §2.2 の型を実装: `SetupPhase` / `ProjectScale` / `PhaseRecommendation` / `GeneratedFile` / `GithubAction` / `SetupPlan` / `SetupState` / `SetupArgs` / `SetupResult` / `TemplateSet` + 注入 IF (`GhRunner` / `FsReader` / `FsWriter` / `confirm` / `isInteractive`)。`nodeDeps` (実 I/O) と `onPath("gh")` を `src/runtime/detect.ts` から再利用。

### Step 2: 契約関数 7 本の実装 (② 本体、§2.3 DbC 準拠)
`detectProjectScale` (never-throws、gh 失敗→unknown/null、token 非読取) / `recommendPhase` (純関数、org|collab>1|hasCodeowners|hasBranchProtection===true→0-B、null 単独は unknown) / `planSetup` (純関数、0-A=A のみ / 0-B=A+CODEOWNERS+bp script、actions.applied=false) / `emitSetup` (内部 helper `renderArtifacts` で純 render → 書込、dryRun は path 一覧返すのみ、token 非埋込) / `recordSetupState` (setup.json 上書き、signals を 4 フィールド strip) / `applyBranchProtection` (apply≠true→emit-only、**isInteractive≠true→non-interactive で gh 非実行**、対話下のみ admin/auth/confirm 充足で gh api) / `runSetup` (orchestration: フラグ>confirm(recommend(detect))>fallback solo、非対話 apply 封鎖)。

### Step 3: docs/templates/github/ テンプレ群作成 (② template)
`docs/templates/github/common/` (A 種別): `harness-check.yml` / `ISSUE_TEMPLATE/*.md` (recovery / add-feature) / `PULL_REQUEST_TEMPLATE.md` / commitlint 設定 / `escalation-stale.yml`。`docs/templates/github/team/` (B 種別): `CODEOWNERS` (team 名プレースホルダ) / `setup-branch-protection.sh` (gh api / rulesets スクリプト雛形)。**いずれも token を埋め込まない**。commitlint は対象 repo へ **standalone `commitlint.config.js` を emit** (§9.1 A 種別) — repository-structure §8 の config 最小化は harness 自身の repo に適用される方針で、setup は**対象 repo の package.json を変更しない** (既存ファイル非破壊) ため standalone file が安全。配置を変える場合は U-SETUP-003 の `GeneratedFile.path` 期待値を更新してから Step 4 を開始。

### Step 4: tests/setup.test.ts (④、TDD Red→Green)
U-SETUP-001〜007 を vitest 化 (③ 設計 L7-unit-test-design.md §1.7)。deps mock で gh / fs / confirm / isInteractive / now を注入。never-throws / 安全フォールバック (unknown→solo) / **非対話 apply 封鎖** / signals strip / token 非埋込 / dry-run 非書込 / orchestration 優先順 を検証。

### Step 5: ut-tdd setup CLI 配線 (src/cli.ts)
commander で `ut-tdd setup` を追加: `--solo` / `--team` (phase 上書き) / `--dry-run` / `--apply-branch-protection` / `--tl-team` / `--qa-team` / `--po-team`。非対話判定 (TTY/CI) を `isInteractive` deps に注入。既存 status/plan サブコマンドと同形。

### Step 6: review (review 前置 MUST)
`code-reviewer` (Senior Staff、TL 代替) で実装/型/file↔GitHub-API 境界/非対話 apply 封鎖/token 非記録/安全フォールバック/idempotency をレビュー。cross-agent 不在を evidence に記録 ([[feedback_ts_native_over_helix_cli]])。

### Step 7: typecheck + 全回帰 + biome
`npm run typecheck` (0 errors) + `npx vitest run` (U-SETUP 全 pass + 既存 85 緑維持) + 自作ファイル `npx biome check --write`。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| 契約関数 signature / DbC | parent_design `setup-solo-team.md` §2.2-§2.3 |
| deps 注入 (GhRunner/FsReader/FsWriter/confirm/isInteractive) | `src/runtime/session-log.ts` nodeDeps + `src/runtime/detect.ts` onPath 再利用 |
| 検出ヒューリスティクス (gh api) | setup-solo-team.md §2.3 (`repos/{o}/{r}` owner.type / collaborators length / codeowners・protection) |
| テンプレ内容 (A/B 種別) | 要件 §6.5 / §9.1 A/B 種別ツリー / repository-structure.md §1/§9 投影 3 層 |
| branch protection スクリプト | GitHub branch protection / rulesets API (gh api PUT/POST)。emit-only 既定 |
| CLI 配線 | 既存 `src/cli.ts` commander パターン (status/plan と同形) |
| 秘匿 (token) / 非対話 apply 封鎖 | CLAUDE.md 禁止事項 (認可/本番影響/credential) + parent_design §2.3/§2.5 |

## §6 用語更新 (§G.9)

L6 (PLAN-L6-05) で導入した **Phase 0-A (solo) / Phase 0-B (team) / 参加規模検出 / emit-only** を実装語として確定 (新規語なし、L6 定義を踏襲)。L7 で確定する具体 path 名 (`.ut-tdd/state/setup.json` / `src/setup/index.ts`) は**実装語であり L0 用語集範疇外**。設計用語の L0 §10 back-merge は後段 Reverse (PLAN-REVERSE-04) の deliverable。

## §7 成否

- src/setup/index.ts + src/cli.ts setup + tests/setup.test.ts + docs/templates/github/ 揃い、U-SETUP-001〜007 全 pass
- 既存テスト緑維持 (起票時点 85 件、U-SETUP add 後 85+7=92 件以上)、typecheck 0、**token 非記録 / 非対話 apply 封鎖 / 安全フォールバック (unknown→solo) / dry-run 非書込** を test で実証
- code-reviewer review APPROVE (Critical 0)
- 後段 `PLAN-REVERSE-04` (未起票、本 PLAN 完了後に起票、fullback) で L4 external-if GitHub 境界契約 / L3 要件 (新 FR 要否) / §6.5 整合 / L0 §10 用語へ back-fill へ接続
