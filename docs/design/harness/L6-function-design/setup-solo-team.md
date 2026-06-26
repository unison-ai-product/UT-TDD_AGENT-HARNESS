---
layer: L6
artifact_type: design_doc
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-05-setup-solo-team.md
---

> **L6 contract marker**: `planSetup(input: SetupInput) => SetupPlan` and `runSetup(input: SetupInput) => SetupResult` are the unit-test-granularity contracts. DbC pre/post/invariant maps solo/team detection and setup outputs to U-SETUP-001..007.

<!--
① 設計 (L6 機能設計) — ut-tdd setup solo/team GitHub 設定出し分け。
PLAN: PLAN-L6-05-setup-solo-team (add-design)。pair (③): docs/test-design/harness/L7-unit-test-design.md §1.7 U-SETUP。
実装 (②): src/setup/index.ts + src/cli (ut-tdd setup) (PLAN-L7-03-setup-solo-team, add-impl, 後続)。
土台思想: ut-tdd status の mode 検出 (src/runtime/detect.ts)「検出して提案する」を solo/team 軸へ拡張。
上位整合: 要件 §6.5 Phase 0-A/0-B / §9.1 A/B 種別 / L4 external-if GitHub 境界 (後段 Reverse で back-fill)。
-->

# UT-TDD Agent Harness — L6 機能設計: ut-tdd setup solo/team (参加規模検出 + 提案/確認/記録 + GitHub 設定出し分け)

## §1 概要

`ut-tdd setup` を、**利用者の参加規模に応じて GitHub 設定を solo (Phase 0-A) / team (Phase 0-B) で出し分ける** runtime 機能として設計する。(1) repo の owner 種別・collaborator 数・既存 CODEOWNERS/branch-protection を gh 経由で**検出**し、(2) solo/team を理由つきで**提案** → 人間確認 → 確定 phase を `.ut-tdd/state/setup.json` に**記録**し、(3) phase 別の GitHub 設定 (workflow / ISSUE・PR テンプレ / commitlint / CODEOWNERS / branch-protection) を生成する。`ut-tdd status` の mode 検出と同じ「**検出して提案する**」思想を solo/team 軸に拡張する。

> **PO 確定事項** (2026-06-02): ① solo/team は参加アカウント数等で自動「**提案**」するが、確定は**人間確認 + 状態記録** (数だけで自動確定しない) / ② branch protection / Required 化は GitHub 設定操作でファイルでは完結しないため**既定 emit-only** (スクリプト+手順生成、適用は人間)・`--apply-branch-protection` で**対話下のみ**ガード付き自動適用 / ③ **token は読まない・記録しない** (CLAUDE.md 禁止事項) / ④ solo→team の格上げは**ガバナンス変更**であり暴発させない (適用は人間サインオフ)。

> **なぜ「提案どまり」か**: 参加アカウント数は代理指標であり (bot / 単発 contributor / org-with-1 等の曖昧ケース)、かつ solo→team の格上げは branch protection / 必須レビューを ON にする**認可・本番影響**を持つ。要件 §6.5 でも Phase 0-A→0-B は「bootstrap-owner から各 team へレビュー責任を移管する**意図的マイルストーン**」であり、headcount で自動発火させない。検出は**既定値の提案まで**、確定は人間 + state 記録で**安定化** (毎回再推測しない)。

## §2 機能設計 (L6 粒度)

### §2.1 責務分離 (検出=提案どまり / 確定=人間+記録 / 適用=既定 emit-only)

| 層 | 責務 | 失敗 / 安全方針 |
|----|------|----------------|
| **検出** (`detectProjectScale`) | gh で owner 種別 / collaborator 数 / 既存 CODEOWNERS・protection を読む。**判定も適用もしない** | never throws。gh 不在/未認証/権限不足 → 不明信号 (`unknown`/`null`) |
| **推奨** (`recommendPhase`) | 信号 → solo/team の提案 + 理由 + confidence。**純関数** | 不明信号 → solo (安全側) low confidence |
| **確定** (`runSetup` orchestration) | フラグ > 対話確認 (推奨提示) > 安全フォールバック で phase 確定 → `.ut-tdd/state/setup.json` 記録 | 非対話 + フラグ無し → solo |
| **生成** (`planSetup` / `emitSetup`) | phase 別の生成物計画 → テンプレ render → ファイル書込 (dry-run は書かない) | **token を書かない**。既存ファイル上書きは confirm 経由 |
| **適用** (`applyBranchProtection`) | **既定: スクリプト生成のみ (skip)**。`--apply-branch-protection` かつ**対話下**でのみ gh 認証/admin 確認 → 変更内容提示 → 人間 confirm → `gh api` 実行 | **非対話 (CI) は precondition で封鎖**。admin/auth/confirm 欠落 → 実行せず emit-only |

「検出→提案」は hook でなく **CLI subcommand** (`ut-tdd setup`) の対話フローで実現する (hook は足さない)。

### §2.2 型 / schema (D-CONTRACT)

```ts
type SetupPhase = "0-A" | "0-B";                    // 0-A=solo / 0-B=team

interface ProjectScale {                            // 検出結果 (生信号、判定しない)
  ownerType: "User" | "Organization" | "unknown";
  collaborators: number | null;                     // 取得不可は null
  hasCodeowners: boolean;
  hasBranchProtection: boolean | null;              // 取得不可は null
}
interface PhaseRecommendation { phase: SetupPhase; reason: string; confidence: "high" | "low"; }

interface GeneratedFile { path: string; category: "A" | "B"; purpose: string; }   // category=§9.1 A/B
interface GithubAction  { kind: "branch-protection"; script_path: string; applied: boolean; }  // 既定 applied=false
interface SetupPlan { phase: SetupPhase; files: GeneratedFile[]; actions: GithubAction[]; dryRun: boolean; }

interface SetupState {                              // .ut-tdd/state/setup.json (確定値 SSoT)
  phase: SetupPhase;
  decidedAt: string;
  decidedBy: "flag" | "confirm" | "fallback";
  signals: ProjectScale;                            // 4 フィールドのみ。token を含めない (recordSetupState で strip)
}
interface SetupArgs { phase?: SetupPhase; dryRun: boolean; applyBranchProtection: boolean; teams?: { tl: string; qa: string; po: string }; }  // teams は CLI --tl-team/--qa-team/--po-team から
interface SetupResult { phase: SetupPhase; written: string[]; branchProtection: { applied: boolean; reason: string }; }
type TemplateSet = { [name: string]: string };     // テンプレ名 → 内容。emitSetup の render 入力 (内部 helper renderArtifacts が消費)
```

**秘匿原則 (CLAUDE.md 禁止事項)**: 認証 token を一切読まない (gh の認証状態に委ねる)。`SetupState.signals` は 4 フィールドへ strip して書き、gh 出力に万一含まれうる認証情報を state/docs/log に**残さない**。生成ファイルの内容に token を埋め込まない。

### §2.3 関数 signature + DbC (src/setup/index.ts + src/cli)

| 関数 | signature | pre | post |
|------|-----------|-----|------|
| `detectProjectScale` | `(deps: { gh: GhRunner; fs: FsReader }) => ProjectScale` | — | **never throws**。`gh api repos/{o}/{r}` の `owner.type` / `collaborators length` / CODEOWNERS・protection 有無を読む。gh 不在/未認証/権限不足 → `ownerType:"unknown", collaborators:null, hasBranchProtection:null`。**token は読まない** (gh 認証状態に委譲) |
| `recommendPhase` | `(scale: ProjectScale) => PhaseRecommendation` | — | **純関数**。`ownerType==="Organization"` OR `collaborators>1` OR `hasCodeowners` OR `hasBranchProtection===true` → `0-B` (high、既存 protection は team 既存運用の強信号) / `ownerType==="User"` かつ `collaborators<=1` → `0-A` (high) / それ以外 (unknown 信号) → `0-A` (low、安全フォールバック)。**`hasBranchProtection===null` (取得不可) / `collaborators===null` は unknown 扱いで単独では 0-B トリガーにしない** |
| `planSetup` | `(phase: SetupPhase, opts: { teams?; dryRun: boolean }) => SetupPlan` | — | **純関数 (I/O なし)**。`0-A` = 共通 (A 種別: adapter docs (`AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` / `.claude/settings.json`) + harness-check.yml / ISSUE・PR テンプレ / commitlint / escalation-stale)。`0-B` = 共通 (A) + `CODEOWNERS` (B、teams 名を反映) + `setup-branch-protection.sh` + `GithubAction{applied:false}`。`actions.applied` は常に false (適用は別関数) |
| `emitSetup` | `(plan: SetupPlan, templates: TemplateSet, deps: { fs: FsWriter; confirm }) => string[]` | — | テンプレを render して書込 (内部 helper `renderArtifacts` が純 render を担う)。**`plan.dryRun` は書かず一覧 (path) を返すのみ**。既存ファイル上書きは `confirm` 経由。`AGENTS.md` / `CLAUDE.md` / `.claude/CLAUDE.md` は consumer 既存行を保持し、`<!-- UT-TDD:managed:start -->`〜`<!-- UT-TDD:managed:end -->` の managed block だけを挿入/更新する。`.claude/settings.json` など構造ファイルは既存なら confirm なしに上書きしない。**生成内容に token を含めない**。書いた path 配列を返す |
| `recordSetupState` | `(state: SetupState, deps: { fs: FsWriter }) => void` | — | `.ut-tdd/state/setup.json` を**上書き** (単一ファイル = 確定値 SSoT。再実行・phase 変更時は最新 state で上書きし append しない)。**`signals` は 4 フィールド (ownerType/collaborators/hasCodeowners/hasBranchProtection) のみへ strip** (それ以外を破棄 = 認証情報混入経路を遮断) |
| `applyBranchProtection` | `(plan: SetupPlan, deps: { gh; confirm; isInteractive }, opts: { apply: boolean }) => { applied: boolean; reason: string }` | — | `opts.apply!==true` → `{applied:false, reason:"emit-only"}` (既定)。**`deps.isInteractive!==true` → `opts.apply=true` でも `{applied:false, reason:"non-interactive"}`** (非対話の無人適用を precondition で封鎖)。対話下でのみ gh 認証 + admin 確認 + 変更内容提示 + 人間 confirm が**全て揃って初めて** `gh api ... branches/main/protection` 実行。いずれか欠落 → 実行せず emit-only に戻す |
| `runSetup` | `(args: SetupArgs, deps) => SetupResult` | — | orchestration。phase = `args.phase` (フラグ) > `confirm(recommendPhase(detectProjectScale()))` (対話) > `0-A` (fallback)。確定 → `recordSetupState` → `planSetup` → `emitSetup` → (`applyBranchProtection` は opt-in)。**非対話 + フラグ無し → 0-A**。**invariant: `--apply-branch-protection` は対話セッションのみ有効** (非対話は emit-only 固定) |

`GhRunner` = `(args: string[]) => { ok: boolean; stdout: string }` の注入インターフェース (test=mock、**raw token 非依存** = gh の認証状態に委ねる seam)。`FsReader`/`FsWriter` は session-log の `nodeDeps` パターン (I/O 注入で純粋化)。`confirm` = 対話確認の注入 (非対話時は安全既定)。`isInteractive` = TTY/CI 判定の注入。

### §2.4 file vs GitHub-API 境界 (本機能の核心判断)

| GitHub 生成物 | solo (0-A) | team (0-B) | harness が書くファイル? | GitHub 設定/API 操作? |
|---|---|---|---|---|
| harness-check.yml / ISSUE・PR テンプレ / commitlint / escalation-stale.yml (workflow) | ✅ | ✅ | YES (`GeneratedFile`) | NO |
| CODEOWNERS (team 名注入) | ✕ | ✅ | YES (`GeneratedFile`) | NO (gh で `codeowners/errors` 検証は可) |
| Required Status Checks 登録 / 必須レビュー数=1 / branch protection | ✕ | ✅ | **NO** | **YES (`GithubAction`、gh api / rulesets)** → 既定は `setup-branch-protection.sh` 生成のみ |

「ファイルで完結する」ものを `GeneratedFile`、「GitHub 設定操作」を `GithubAction` として**型で分離**し、実装時の境界混同を構造的に防ぐ。後者は既定 emit-only、`--apply-branch-protection` + 対話下でのみ `applyBranchProtection` が実行。**commitlint の配置 (root `commitlint.config.js` vs `package.json` キー) は §9.1 A 種別と repository-structure §8 config 最小化方針が衝突しうる** → L7 impl で突合 (本書では「commitlint 設定」を A 種別 GeneratedFile として抽象保持)。

### §2.5 fail-safe + 安全フォールバック

- **検出不能 → solo (0-A)** を 3 層で一貫: `detectProjectScale` (never throws + unknown 信号) → `recommendPhase` (unknown → 0-A low) → `runSetup` (非対話+フラグ無し → 0-A)。緩い側 (solo = 強制なし) に倒すことで、検出失敗時に誤って team 設定 (branch protection) を発火させない。
- **dry-run**: `--dry-run` は生成物一覧を表示し**何も書かない** (破壊的変更ゼロ)。
- **既存ファイル保護**: 上書きは `confirm` 経由 (無断上書きしない)。
- **ガバナンス暴発防止**: branch protection 適用は `--apply-branch-protection` + 対話 + admin/auth/confirm の全充足が precondition。非対話・フラグ無しでは GitHub 設定を一切変更しない。

### §2.6 ストレージ / 配置 / hook

- 確定 phase: `.ut-tdd/state/setup.json` (gitignored runtime state、確定値の SSoT。毎回再推測しない安定化)。
- 生成物の配置 (対象 repo): `.github/` (workflow / CODEOWNERS / ISSUE_TEMPLATE / PR template) / repo root or package.json (commitlint、L7 で config 最小化方針と突合) / `scripts/setup-branch-protection.sh`。
- 本 repo のテンプレ置き場: `docs/templates/github/` と `docs/templates/adapter/`。テンプレ実ファイル群は `PLAN-L7-03-setup-solo-team` / `PLAN-L7-157-distribution-clean-pull` (add-impl) が `artifact_type=template` として generates・tracking する。既存プロジェクトへ harness binary だけを持ち込む場合は対象 repo にこの docs tree が存在しないため、`loadTemplates` は `BUILTIN_GITHUB_TEMPLATES` を fallback として持つ (PLAN-L7-66)。対象 repo 側の `docs/templates/github/` / `docs/templates/adapter/` が存在する場合はそれで built-in を上書きできる。
- hook: **無し** (setup は CLI subcommand。hook は足さない)。

## §3 ③ 単体テスト設計 (pair) — L7-unit-test-design.md §1.7

U-SETUP-001 (`detectProjectScale` never-throws / gh 失敗→unknown) / U-SETUP-002 (`recommendPhase` 純粋・team/solo/fallback 信号) / U-SETUP-003 (`planSetup` 0-A=A のみ / 0-B=A+CODEOWNERS+bp script / team 名注入) / U-SETUP-004 (`emitSetup` dry-run 非書込 / 期待ファイル書込 / token 非含。**内部 helper `renderArtifacts` の render 内容もここで被覆**) / U-SETUP-005 (`recordSetupState` signals 4 フィールド strip / token 非含 / 再読込同一) / U-SETUP-006 (`applyBranchProtection` apply≠true→emit-only / 非対話→non-interactive で gh 非実行 / 欠落→非実行) / U-SETUP-007 (`runSetup` フラグ>確認>fallback 優先順 + 非対話 apply 封鎖) / U-SETUP-009 (`planSetup` が adapter テンプレを含める) / U-SETUP-010 (`emitSetup` が brownfield 既存 adapter doc を非破壊 merge し、構造ファイルは confirm なしに上書きしない)。

**PLAN-L7-157 distribution addendum**: `buildCleanDistributionPlan(paths, tag, cleanRepo)` is the clean export contract for R1/R2/R12/R13: it emits the clean-repo + signed-tarball channel, includes LICENSE/package/src/adapter templates, excludes dogfood (`docs/plans`, `docs/design/harness`, `docs/test-design`, `.ut-tdd`) and UI (`src/web`), and fail-closes on required-file or denylist drift (U-SETUP-011). `buildConsumerReadinessPlan(host/runtime/workspace/tag signals)` is the onboarding/readiness contract for R3/R5/R6/R8/R9/R10/R16/R17: it reports Bun/git/gh/runtime preflight, CI self-sufficiency, rollback managed paths, tag-pin/public contracts, monorepo package-root placement, and portability smoke scenarios without mutating the host (U-SETUP-012). The local distribution acceptance smoke (U-SETUP-013 / AT-DIST-001) materializes the planned clean artifact set into a temporary repo, runs `bun install --frozen-lockfile`, then verifies `status --json`, `distribution plan --json`, and `typecheck`; source-repo full `doctor` remains out of scope until a separate consumer doctor profile exists because the clean artifact intentionally excludes dogfood PLAN/design/test-design/runtime state.

> **孤児 0**: §2.3 契約関数 7 本 ↔ U-SETUP-001〜007 を 1:1 被覆。`renderArtifacts` は `emitSetup` 内部 helper のため U-SETUP-004 に内包 (独立契約でない)。
> **freeze**: **G6 (機能設計凍結)** で ①(本書) ⇔ ③(L7-unit-test-design.md §1.7 U-SETUP) の pair を確定。**G7** で ①⇔②⇔③⇔④ の 4-artifact 双方向 trace を凍結。`next_pair_freeze: L7`。

## §4 既存機構との関係 (mode 検出 / session-log / agent-guard)

| | mode 検出 (detect.ts) | setup solo/team (本機能) |
|--|----------------------|--------------------------|
| 軸 | どの AI runtime が居るか (standalone/claude-only/codex-only/hybrid) | 参加規模 = solo/team (Phase 0-A/0-B) |
| 思想 | 検出して提案 (config を mode の主信号にしない) | **検出して提案 → 人間確認 → state 記録** (数で自動確定しない) |
| 確定の所在 | 実行時に毎回検出 | `.ut-tdd/state/setup.json` に**記録**して安定化 |
| 安全側 | — | 検出不能 → solo (緩い側) フォールバック |

deps 注入 (`GhRunner`/`FsReader`/`FsWriter`/`confirm`) は session-log の `nodeDeps` パターン、`onPath` (`gh` 有無判定) は `src/runtime/detect.ts` を再利用する。

## §5 上位整合 (後段 Reverse で back-fill)

本機能の要件・境界契約は **bottom-up build → 後段 Reverse で back-fill** ([[feedback_addfeature_bottomup_reverse_backfill]]):

- **L4 external-if (PLAN-L4-04)**: GitHub 境界の DbC 契約 (file vs gh-api 境界 / emit-only 既定 / 適用の人間サインオフ前提) を external-if.md へ back-fill。
- **§6.5 Phase 0-A/0-B**: `ut-tdd setup` の solo/team 出し分けが §6.5 の 2-stage と整合することを正本側に明記 (§10.1 受入条件 `setup --dry-run` と接続)。
- **L3 要件 (FR/AC)**: 参加規模検出 + 提案/確認/記録 + GitHub 設定出し分けの振る舞いを既存 FR 拡張で吸収 (新 FR は Reverse で要否判断、fr-registry-audit を壊さない)。
- **§6 用語 (Phase 0-A/0-B / 参加規模検出 / emit-only)**: L0 §10 用語集へ back-merge (§G.9、導入層 L6)。
- **認可・本番影響の境界**: branch protection 適用は人間サインオフ前提 (CLAUDE.md エスカレーション境界)。仕組み化 (precondition で非対話封鎖) を §8.6 失敗→仕組みループの一部として確定。
