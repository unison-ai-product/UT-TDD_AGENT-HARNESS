# UT-TDD 内部資産 棚卸 + 機能一覧 (subagent / skill / command)

> **目的**: HELIX 由来の **runtime 内部資産**を「UT-TDD 用に作り替える機能」として棚卸・一覧化する。既存の [helix-source-inventory.md](./helix-source-inventory.md) / [helix-porting-map.md](./helix-porting-map.md) は **code-port 視点** (cli/lib → TS) であり、subagent/skill/command を **harden/curate** 扱いで「機能として設計し直す対象」にしていなかった (= FR-level 前提抜け)。本 doc はその gap を埋める evidence。
> **調査**: 2026-05-29、pmo-project-explorer ×2 (subagent / skill) 並行棚卸。read-only。
> **接続**: 本 doc は recovery PLAN [PLAN-REC-001](../plans/PLAN-REC-001-internal-asset-recovery.md) §4 の evidence。不足 FR は同 PLAN §6/§7 で L1/L3 へ fullback。

## §0 結論サマリ

| 資産種別 | 現状 | UT-TDD 化の必要作業 | 既存 FR |
|---|---|---|---|
| **subagent** (19) | active = vendor と **byte 完全一致 = 未改変**。HELIX 前提 (絶対パス / `helix codex` 直叩き) が現役で残存 | role→capability class、HELIX 前提除去、**roster の設計化** (誰が存在し何の role/model か) | **無し** (guard 機構=FR-09 のみ) |
| **skill** (107) | `docs/skills/` = `.gitkeep` のみ = **curate 未着手**。vendor に 107、core 直結 ~15 | UT-TDD 版 SKILL_MAP、core/optional/drop 区分、ut-tdd CLI trigger 化、helix 用語除去 | FR-12 (skill 注入機構) のみ。**pack 内容の FR 無し** |
| **command** | `.claude/commands/` = **空**。HELIX `docs/commands/*` 未移植 | `ut-tdd` CLI subcommand として実装 (dashboard/asset 等) | 部分的 (CLI FR は core 側) |

> **核心**: 「呼び出しの安全弁 (guard = `agent-guard.ts`)」は TS 化・L4-L6 設計済。だが「**資産そのもの (roster / pack / command の中身と体系)**」を UT-TDD 用に作り替える FR が L1/L3 に存在しない。

## §1 subagent roster 棚卸 (active 19 = vendor byte 一致、未改変)

| カテゴリ | 件数 | guard | 代表 | UT-TDD 適合 | HELIX 前提 (剥がす対象) |
|---|---|---|---|---|---|
| **PMO** | 9 | 全 pass | pmo-sonnet / pmo-haiku / pmo-project-explorer/scout / pmo-tech-* | core 5 / optional 2 / **drop 候補 2** (pmo-helix-explorer/scout = `~/ai-dev-kit-vscode/` 固定) | 絶対パス Read 必須 (pmo-sonnet が `HELIX_CORE.md` 等) |
| **PdM** | 3 | 全 pass | pdm-tech/marketing/innovation-manager (model=**opus**) | optional | `helix codex --role tl-advisor` を直 Bash |
| **review** | 3 | 全 pass | code-reviewer / security-audit / qa-test | **core** | `~/ai-dev-kit-vscode/skills/common/*` Read 必須 |
| **BE** | 2 | **block** | be-api / be-logic | optional (Codex 委譲専用) | HELIX skill パス + 汎用 project §参照 |
| **DB** | 1 | **block** | db-schema | optional (同上) | 同上 |
| **DevOps** | 1 | **block** | devops-deploy | optional (同上) | 同上 |

**未改変リスク**: active 19 は vendor をコピーしただけで UT-TDD 化ゼロ。HELIX 移植前提 (絶対パス・`helix` コマンド) のまま現役稼働中。pmo-sonnet は毎回 `~/ai-dev-kit-vscode/helix/HELIX_CORE.md` を Read する設計で、CI 等の不在環境でエラーリスク。

**作り替え観点**: (1) HELIX 絶対パス一掃 (11/19 に残存) (2) `helix codex` → `ut-tdd codex` (PdM 3) (3) pmo-helix-explorer/scout の drop or 再定義 (`vendor/helix-source/` 探索へ) (4) guard allowlist 15 の維持 (be-*/db/devops の block 設計は正当・継続) (5) description の「HELIX」→「UT-TDD」(誤起動の温床)。

## §2 skill 体系 棚卸 (vendor 107、UT-TDD core 直結 ~15)

| カテゴリ | 件数 | UT-TDD 関連 | core 直結の代表 |
|---|---|---|---|
| **workflow/** | 31 | **core** | reverse-r0..r4 / reverse-rgc / reverse-analysis / poc / gate-planning / adversarial-review / verification / quality-lv5 / debt-register / design-doc / api-contract / schedule-wbs / requirements-handover |
| **agent-skills/** | 23 | core (helix-scrum/spec-driven/tdd/system-design-sizing) / optional 19 | spec-driven-development / test-driven-development / helix-scrum / planning-and-task-breakdown / documentation-and-adrs / context-engineering |
| **integration/** | 3 | **core** (harness 自体が agent framework) | agent-design / agent-teams / agent-cost-design |
| **common/** | 12 | optional | testing / code-review / security / refactoring |
| **advanced/** | 9 | optional / drop | legacy / migration (reverse 接続) / marketing-innovation (drop) |
| **project/** | 8 | optional / drop | api / db (L3 直結) / fe-* 5 (drop 候補) |
| **automation/** | 8 | optional / drop | scheduler / job-queue / browser-script (drop) |
| **tools/** | 4 | optional | ai-coding / web-search |
| **writing/** | 4 | drop 候補 | japanese / explain / social (drop) |
| **design-tools/** | 5 | drop 候補 | diagram (optional) / pptx / character (drop) |

### §2.1 駆動モデル直結 skill (9-mode に対応 — 最優先 curate)

| skill | UT-TDD mode/工程 |
|---|---|
| workflow/reverse-r0..r4 / reverse-rgc / reverse-analysis | **Reverse** R0-R4 (既存資産逆引き) |
| agent-skills/helix-scrum | **Scrum** S0-S4 |
| workflow/poc | **Discovery** PoC (G1.5) |
| workflow/gate-planning / adversarial-review | ゲート (G0.5/G2) |
| workflow/verification / quality-lv5 / debt-register | V-model 検証・G4/G6 |
| agent-skills/spec-driven / tdd / documentation-and-adrs | V-model L1/L7 設計⇔テスト |
| integration/agent-design / agent-teams / agent-cost-design | harness 自体の multi-agent 設計 |

> **drop 候補 ~9** (writing/social・presentation / design-tools/character・pptx・graphic / advanced/marketing-innovation・innovation-mgr / automation/site-mapping・browser-script) を除外宣言すると curate 対象は 107→~70 台に絞れる。

## §3 command 棚卸

- `.claude/commands/` = **空** (UT-TDD command 未整備)。
- HELIX `cli/helix-dashboard` / `cli/helix-asset` / `docs/commands/*` → `ut-tdd dashboard` / `ut-tdd asset` 等 (porting-map W12/W16、未着手)。
- 中核 command (`ut-tdd setup/status/doctor/plan/review/codex/claude/team/...`) は core CLI FR で別途定義済 (本 doc 対象外)。

## §4 cli/lib 機能 (既存 porting-map を cross-ref、本 doc では再掲のみ)

cli/lib (710 file) の機能棚卸は [helix-porting-map.md](./helix-porting-map.md) W1-W17 + helix-source-inventory.md「7割構築候補」に既出。subagent/skill/command と異なり **TS 再実装対象 (ADR-001)** として L4-L6 で設計済 (schema/lint/plan/vmodel/runtime/doctor + 未実装 module workflow/session/...)。本 doc の gap は cli/lib ではなく **runtime 内部資産 (§1-§3)** 側。

## §5 不足 FR 候補 (recovery PLAN §6 で L1/L3 へ fullback)

| 候補 FR | 内容 | 帰属層 |
|---|---|---|
| **FR-AST-1** | UT-TDD subagent roster の定義・harden (capability class / model family / guard 統合 / HELIX 前提除去) | L3 (機構)、L1 (業務要求「自前 runtime 資産を持つ」) |
| **FR-AST-2** | skill pack の UT-TDD curate (SKILL_MAP UT-TDD 版 / core-optional-drop 区分 / ut-tdd CLI trigger / helix 用語除去) | L3 + L1 |
| **FR-AST-3** | command を ut-tdd CLI subcommand として体系化 (dashboard/asset 等) | L3 |
| **FR-AST-4** | 内部資産の drift lint (roster/pack が HELIX 前提を残さない・docs/skills 空でない等を機械検証) | L3 (再発防止、§7) |

> これらは「機構の FR (FR-09 guard / FR-12 skill 注入)」ではなく「**資産そのものを UT-TDD 用に構築する FR**」。現 L1/L3 に欠落 = G1/G3 の gap。recovery PLAN で reopen し fullback する。
