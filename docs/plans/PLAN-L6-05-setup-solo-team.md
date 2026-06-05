---
plan_id: PLAN-L6-05-setup-solo-team
title: "PLAN-L6-05 (add-design): ut-tdd setup solo/team 機能設計 — 参加規模の自動検出 + 提案/確認/記録 + GitHub 設定の solo/team 出し分け (emit-only 既定 + opt-in ガード付き適用)"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-02
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 関数 signature / DbC / file vs GitHub-API 境界 / fail-safe フォールバック / 秘匿(token 非記録) / 検出ヒューリスティクスのレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/setup-solo-team.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L4-04-external-if.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-02"
    tests_green_at: "2026-06-02"
    verdict: approve
    scope: "code-reviewer APPROVE (Critical 0)。file↔API 境界 / token 非記録 確認 (handover 2026-06-02d §5)"
---

# PLAN-L6-05 (add-design): ut-tdd setup solo/team 機能設計

## §0 位置づけ

要件 §6.5 (CODEOWNERS bootstrap 2-stage = Phase 0-A solo / 0-B team) / §6.8 (PLAN git ライフサイクル) / §6.9 (CI) に「製品仕様」として存在する **`ut-tdd setup`** を、**利用者の参加規模に応じて GitHub 設定を solo/team で出し分ける** 機能として確定する設計差分。`ut-tdd setup` はコード未実装 (要件 §7.1 にコマンド存在のみ)。本 PLAN は `kind=add-design` (L6 機能設計粒度) で型 + 関数 signature + DbC + **「harness が書くファイル」と「GitHub 設定 (API/gh) 操作」の境界**を確定し、`PLAN-L7-03-setup-solo-team` (add-impl) が実装する。**bottom-up build → 後段 Reverse で L4 external-if (GitHub 境界契約) / L3 要件 (新 FR) / §6.5 整合へ back-fill** する ([[feedback_addfeature_bottomup_reverse_backfill]])。

- 親設計: `PLAN-L4-04-external-if` (GitHub/CI 境界 = 本機能が具体化する外部境界、drive=fullstack 一致)。GitHub 境界の DbC 契約は後段 Reverse で L4-04 へ back-fill。
- 駆動モデル: **Add-feature**。`ut-tdd status` の mode 検出 (standalone/claude-only/...) と同思想で「検出して提案する」を solo/team 軸に拡張する。
- PO 確定事項 (本 session 2026-06-02):
  1. **solo/team は参加アカウント数等で自動「提案」する**が、確定は人間確認 + 状態記録 (数だけで自動確定しない)。
  2. **branch protection / Required 化は GitHub 設定操作**でファイルでは完結しない。既定は **emit-only** (スクリプト + 手順を生成、適用は人間)。**opt-in `--apply-branch-protection` でガード付き自動適用** (gh 認証/admin 確認 → 変更内容提示 → 実行)。
  3. **トークンは一切読まない/記録しない** (CLAUDE.md 禁止事項)。team 名は引数注入で hardcode しない。
  4. solo→team の格上げは**ガバナンス変更**であり暴発させない (検出は既定値の提案まで、適用は人間サインオフ)。

## §1 要求 (この機能が満たすこと)

1. **参加規模の自動検出**: `ut-tdd setup` (フラグ無し) で repo の owner 種別 (org/個人)・collaborator 数・既存 CODEOWNERS/branch-protection の有無を gh 経由で取得し、solo(0-A)/team(0-B) の**目星**を立てる。gh 不在/未認証/権限不足なら不明信号として **solo に安全フォールバック**。
2. **提案 → 確認 → 記録**: 検出結果から phase を理由つきで提案 → 対話確認 (yes/no) → 確定 phase を `.ut-tdd/state/setup.json` に**明示記録** (以後はそれを正本にし、毎回再推測しない)。`--solo`/`--team` は提案の上書き。非対話 + フラグ無しは安全フォールバック (solo)。
3. **GitHub 設定の solo/team 出し分け**: phase に応じて生成物を変える。
   - 共通 (0-A/0-B、§9.1 A 種別): `harness-check.yml` / ISSUE・PR テンプレ / commitlint 設定 / escalation-stale workflow
   - team のみ (0-B、§9.1 B 種別): `CODEOWNERS` (team 名は `--tl-team`/`--qa-team`/`--po-team` 注入) / `scripts/setup-branch-protection.sh`
4. **file vs GitHub-API 境界の分離**: harness が「ファイルとして書ける」ものは書く。「GitHub 設定操作」(Required Status Checks 登録 / `required_approving_review_count=1` / branch protection) は**ファイルでは完結しない**ため、既定は `setup-branch-protection.sh` (gh api スクリプト) + 手順の**生成のみ** (emit-only)。`--apply-branch-protection` 指定時のみガード付きで実行。
5. **dry-run + fail-safe**: `--dry-run` は生成物一覧を表示し**何も書かない**。検出・生成は人間確認前に破壊的変更をしない。token は読まない・docs/log に残さない。

## §2 機能設計 (L6 粒度、generates: setup-solo-team.md に詳細)

### §2.1 責務分離 (検出 = 提案どまり / 確定 = 人間 + 記録 / 適用 = 既定 emit-only)

| 層 | 責務 | 失敗/安全方針 |
|----|------|--------------|
| 検出 (`detectProjectScale`) | gh で owner 種別 / collaborator 数 / 既存 CODEOWNERS・protection を読む。**判定も適用もしない** | never throw。gh 不在/未認証/権限不足 → 不明信号 |
| 推奨 (`recommendPhase`) | 信号 → solo/team の提案 + 理由 + confidence。純関数 | 不明信号 → solo (安全側) low confidence |
| 確定 (`runSetup` orchestration) | フラグ > 対話確認(推奨提示) > 安全フォールバック で phase 確定 → `.ut-tdd/state/setup.json` 記録 | 非対話 + フラグ無し → solo |
| 生成 (`planSetup`/`renderArtifacts`/`emitSetup`) | phase 別の生成物計画 → テンプレ render → ファイル書込 (dry-run は書かない) | token を書かない。既存ファイルは上書き前に確認 |
| 適用 (`applyBranchProtection`) | **既定: スクリプト生成のみ (skip)**。`--apply-branch-protection` かつ**対話セッション**時のみ gh 認証/admin 確認 → 変更内容提示 → 人間 confirm → `gh api` 実行 | **非対話 (CI 等)** / admin・auth 不足 / 未確認 → 実行しない (emit-only に戻す) |

### §2.2 型 schema (D-CONTRACT)

```text
SetupPhase = "0-A" | "0-B"                          # 0-A=solo / 0-B=team
ProjectScale = {                                    # 検出結果 (生信号、判定しない)
  ownerType: "User" | "Organization" | "unknown",
  collaborators: number | null,                     # 取得不可は null
  hasCodeowners: boolean,
  hasBranchProtection: boolean | null,              # 取得不可は null
}
PhaseRecommendation = { phase: SetupPhase, reason: string, confidence: "high" | "low" }
GeneratedFile = { path: string, category: "A" | "B", purpose: string }   # category=§9.1 A/B
GithubAction  = { kind: "branch-protection"; script_path: string; applied: boolean }  # 既定 applied=false
SetupPlan = { phase: SetupPhase, files: GeneratedFile[], actions: GithubAction[], dryRun: boolean }
SetupState = {                                       # .ut-tdd/state/setup.json (確定値 SSoT)
  phase: SetupPhase, decidedAt: string,
  decidedBy: "flag" | "confirm" | "fallback",
  signals: ProjectScale,                            # 判断根拠 (token は含めない)
}
```

### §2.3 関数 signature (src/setup/index.ts + src/cli 拡張)

| 関数 | signature | DbC |
|------|-----------|-----|
| `detectProjectScale` | `(deps: { gh: GhRunner; fs: FsReader }) => ProjectScale` | **never throws**。gh 不在/未認証/権限不足 → `ownerType:"unknown", collaborators:null`。token は読まない (gh の認証状態に委ねる) |
| `recommendPhase` | `(scale: ProjectScale) => PhaseRecommendation` | **純関数**。org OR collaborators>1 OR hasCodeowners OR `hasBranchProtection===true` → 0-B(high、既存 protection は team 既存運用の強信号)。User かつ collaborators<=1 → 0-A(high)。unknown 信号 (含 `hasBranchProtection===null`・`collaborators===null` 単独) → 0-A(low、安全フォールバック) |
| `planSetup` | `(phase: SetupPhase, opts: { teams?: {tl,qa,po}; dryRun: boolean }) => SetupPlan` | **純関数**。0-A=共通(A)のみ。0-B=共通(A)+CODEOWNERS(B)+branch-protection script。actions.applied は常に false (適用は別関数) |
| `emitSetup` | `(plan: SetupPlan, templates: TemplateSet, deps: { fs: FsWriter; confirm }) => string[]` | テンプレ render (内部 helper `renderArtifacts` が純 render) して書込。**`plan.dryRun` は書かず path 一覧を返すのみ**。既存上書きは confirm 経由。**生成内容に token を含めない**。書いた path を返す (renderArtifacts は独立契約でなく emitSetup 内 helper = U-SETUP-004 に内包) |
| `recordSetupState` | `(state: SetupState, deps: { fs: FsWriter }) => void` | `.ut-tdd/state/setup.json` を**上書き** (単一ファイル = 確定値 SSoT、再実行・phase 変更時は最新 state で上書き・append しない)。**`signals` は 4 フィールド (ownerType/collaborators/hasCodeowners/hasBranchProtection) のみへ strip して書く** (それ以外を破棄 = 認証情報混入経路を遮断) |
| `applyBranchProtection` | `(plan: SetupPlan, deps: { gh; confirm; isInteractive }, opts: { apply: boolean }) => { applied: boolean; reason: string }` | `opts.apply!==true` → `{applied:false, reason:"emit-only"}` (既定)。**`deps.isInteractive!==true` → `opts.apply=true` でも `{applied:false, reason:"non-interactive"}`** (非対話での無人適用を precondition で封鎖)。対話下でのみ gh 認証 + admin 確認 + 変更内容提示 + 人間 confirm が揃って初めて `gh api` 実行。いずれか欠落 → 実行せず emit-only に戻す |
| `runSetup` | `(args: SetupArgs, deps) => SetupResult` | orchestration。phase = フラグ > confirm(recommend(detect)) > fallback(solo)。確定→record→render→emit→(apply は opt-in)。非対話+フラグ無し→solo。**invariant: `--apply-branch-protection` は対話セッションのみ有効** (非対話では emit-only 固定、I-2 ガバナンス保証) |

`GhRunner` = `(args: string[]) => { ok: boolean; stdout: string }` の注入インターフェース (test = mock、raw token 非依存)。`confirm` = 対話確認の注入 (非対話時は安全既定)。

### §2.4 ストレージ / 配置 / hook

- 確定 phase: `.ut-tdd/state/setup.json` (gitignored runtime state、確定値の SSoT)。
- 生成物の配置 (対象 repo): `.github/`(workflow/CODEOWNERS/ISSUE_TEMPLATE/PR template) / repo root or package.json (commitlint、配置は L7 で config 最小化方針 §8 と突合) / `scripts/setup-branch-protection.sh`。
- 本 repo のテンプレ置き場: `docs/templates/github/` (新設、§1 構成「docs/templates/」と整合)。**テンプレ実ファイル群は本 L6 設計 PLAN では generates せず、`PLAN-L7-03-setup-solo-team` (add-impl) が `artifact_type=template` として generates・V-model tracking する** (本 PLAN は型/契約まで)。
- hook: **無し** (setup は CLI subcommand。hook は足さない)。

### §2.5 file vs GitHub-API 境界 (本機能の核心判断)

| GitHub 生成物 | solo(0-A) | team(0-B) | harness が書くファイル? | GitHub 設定/API 操作? |
|---|---|---|---|---|
| harness-check.yml / ISSUE・PR テンプレ / commitlint / escalation-stale | ✅ | ✅ | YES (file) | NO |
| CODEOWNERS (team 名注入) | ✕ | ✅ | YES (file) | NO (gh で errors 検証は可) |
| Required Status Checks 登録 / 必須レビュー数=1 / branch protection | ✕ | ✅ | **NO** | **YES (gh api / rulesets)** → 既定は `setup-branch-protection.sh` 生成のみ |

→ 「ファイルで完結する」ものと「GitHub 設定操作」を**型 (GeneratedFile / GithubAction) で分離**。後者は既定 emit-only、opt-in でガード付き適用。

## §3 ③ 単体テスト設計 (generates: L7-unit-test-design.md §1.7、pair G7)

| U-ID | 対象 | DoD |
|------|------|-----|
| U-SETUP-001 | `detectProjectScale` | gh mock: org → ownerType=Organization / gh 失敗(未認証) → unknown+collaborators=null (never throw) |
| U-SETUP-002 | `recommendPhase` | org or collab>1 or hasCodeowners or `hasBranchProtection===true` → 0-B high / User+collab<=1 → 0-A high / unknown (含 null 単独) → 0-A low (安全フォールバック) |
| U-SETUP-003 | `planSetup` | 0-A=共通(A)のみ / 0-B=共通(A)+CODEOWNERS(B)+branch-protection script / actions.applied=false / team 名注入が CODEOWNERS plan に反映 |
| U-SETUP-004 | `emitSetup` | dryRun=true → fs.write 呼ばれない (一覧のみ) / dryRun=false → 期待ファイル群を書く / 生成内容に token 文字列を含まない |
| U-SETUP-005 | `recordSetupState` | setup.json に phase/decidedBy/signals を書く / **signals が 4 フィールド以外を含まない (strip 検証)** / token 非含 / 再読込で同一 phase / **再実行 (phase 変更) → 上書きで最新 phase のみ (append しない)** |
| U-SETUP-006 | `applyBranchProtection` | apply≠true → {applied:false, reason:"emit-only"} (gh 呼ばれない) / **isInteractive≠true かつ apply=true → {applied:false, reason:"non-interactive"} (gh 呼ばれない)** / 対話下でも admin/auth/confirm 欠落 → 実行しない |
| U-SETUP-007 | `runSetup` (orchestration) | ①フラグあり→フラグ値採用 / ②フラグ無し+対話→confirm 結果 / ③フラグ無し+非対話→solo (fallback) / ④apply=true+非対話→applied:false (I-2 配線ミス検出) |

## §工程表

### Step 1: 機能設計 doc 起草
`docs/design/harness/L6-function-design/setup-solo-team.md` に §2 の責務分離 + 型 + 関数 signature + DbC + file/API 境界 + ストレージ/配置 + fail-safe/秘匿方針を記述。`ut-tdd status` mode 検出 (`src/runtime/detect.ts`) からの設計継承 (検出→提案思想・`onPath` 再利用) を明記。

### Step 2: ③ 単体テスト設計
`docs/test-design/harness/L7-unit-test-design.md` に §1.7 U-SETUP-001..006 を追記 (① 設計とペア)。

### Step 3: review (review 前置 MUST)
claude-only のため `code-reviewer` (Senior Staff、TL 代替) で signature/DbC/file↔API 境界/安全フォールバック/秘匿(token 非記録)/検出ヒューリスティクスの誤判定リスクをレビュー。cross-agent 不在を evidence に記録 ([[feedback_ts_native_over_helix_cli]])。

### Step 4: 命名テスト + 全回帰
`npx vitest run tests/plan-id-naming.test.ts` + `npx vitest run`。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| solo/team = Phase 0-A/0-B の定義 | 要件 §6.5 (CODEOWNERS bootstrap 2-stage) / §10.1-10.2 受入条件 |
| 生成物の A/B 種別と配置 | 要件 §9.1 (A/B/G 種別ツリー) / repository-structure.md §1/§9 (投影 3 層) |
| file vs GitHub-API 境界 | scout 監査 (Required 化/branch protection は gh api 必須、ファイル不可)。GitHub branch protection / rulesets API |
| 自動検出ヒューリスティクス | gh api (`repos/{o}/{r}` owner.type / `collaborators` length / `codeowners/errors`)。PO 確定「提案どまり・確定は人間+記録」 |
| 関数 signature / DbC / deps 注入 | `src/runtime/session-log.ts` (nodeDeps/純関数分離/never-throw) + `src/runtime/detect.ts` (onPath/mode 検出) パターン踏襲 |
| 秘匿 (token 非記録) / branch protection 適用の人間確認 | CLAUDE.md 禁止事項 (認可/本番影響/credential) + PO 確定 (emit-only 既定 / opt-in ガード付き適用) |
| 確定値の state 記録 | `.ut-tdd/state/` (session-log の current-plan 読取パターン)。毎回再推測しない安定化 |

## §6 用語更新 (§G.9 living glossary)

| 用語 | 定義 | 導入層 |
|------|------|--------|
| Phase 0-A (solo) | repo 初期化直後の単独/小規模運用。branch protection なし・CODEOWNERS なし・harness-check 非 Required | L6 |
| Phase 0-B (team) | チーム運用。CODEOWNERS 配備 + branch protection + harness-check Required。solo からの格上げは人間サインオフのガバナンス変更 | L6 |
| 参加規模検出 (project scale detection) | owner 種別/collaborator 数/既存 CODEOWNERS・protection から solo/team を**提案**する検出。確定は人間 + 状態記録 (数だけで自動確定しない) | L6 |
| emit-only (GitHub 設定) | branch protection 等の GitHub 設定操作を harness が自動適用せず、スクリプト + 手順の生成にとどめる既定方針。適用は人間 (opt-in でガード付き自動適用) | L6 |

→ L0 §10 用語集へ back-merge (§G.9)、後段 Reverse で §6.5 Phase 0-A/0-B 整合 + L4 external-if GitHub 境界契約と整合。

## §7 成否

- generates 2 件 (setup-solo-team.md / L7-unit-test-design.md §1.7 追記) が揃い ①⇔③ ペア成立 (G6 pair freeze 対象)
- code-reviewer review APPROVE (Critical 0、特に file↔API 境界 / token 非記録 / 安全フォールバック / 非対話 apply 封鎖の確認)
- 命名テスト + 全回帰 pass
- §6 の 4 用語の L0 §10 用語集 back-merge は**後段 Reverse 工程の deliverable** (bottom-up 順、forced-stop 先例と同一)。本 PLAN は §6 に 4 用語を宣言済 = §G.9 の §6 セクション要件を充足 (lint stub のため human-binding)
- 後段 `PLAN-L7-03-setup-solo-team` (add-impl) へ接続、最終的に Reverse で L4 external-if (GitHub 境界契約) / L3 要件 (新 FR) / §6.5 整合へ back-fill (PO 方針)
