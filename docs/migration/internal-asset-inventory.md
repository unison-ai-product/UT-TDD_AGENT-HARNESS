# UT-TDD 内部資産 棚卸 + 機能一覧 (subagent / skill / command)

> **目的**: HELIX 由来の **runtime 内部資産**を「UT-TDD 用に作り替える機能」として棚卸・一覧化する。既存の [helix-source-inventory.md](./helix-source-inventory.md) / [helix-porting-map.md](./helix-porting-map.md) は **code-port 視点** (cli/lib → TS) であり、subagent/skill/command を **harden/curate** 扱いで「機能として設計し直す対象」にしていなかった (= FR-level 前提抜け)。本 doc はその gap を埋める evidence。
> **調査**: 2026-05-29、pmo-project-explorer ×2 (subagent / skill) 並行棚卸。read-only。
> **接続**: 本 doc は recovery PLAN [PLAN-RECOVERY-01](../plans/PLAN-RECOVERY-01-internal-asset-recovery.md) §4 の evidence。不足 FR は同 PLAN §6/§7 で L1/L3 へ fullback。

## §0 結論サマリ

| 資産種別 | 現状 | UT-TDD 化の必要作業 | 既存 FR |
|---|---|---|---|
| **subagent** (19) | active = vendor と **byte 完全一致 = 未改変**。HELIX 前提 (絶対パス / `helix codex` 直叩き) が現役で残存 | role→capability class、HELIX 前提除去、**roster の設計化** (誰が存在し何の role/model か) | **無し** (guard 機構=FR-09 のみ) |
| **skill** (107) | `docs/skills/` = `.gitkeep` のみ = **curate 未着手**。vendor に 107、core 直結 ~15 | UT-TDD 版 SKILL_MAP、core/optional/drop 区分、ut-tdd CLI trigger 化、helix 用語除去 | FR-12 (skill 注入機構) のみ。**pack 内容の FR 無し** |
| **command** | `.claude/commands/` = **空**。HELIX `docs/commands/*` は UT-TDD 正本化未着手 | `ut-tdd` CLI subcommand として実装 (dashboard/asset 等) | 部分的 (CLI FR は core 側) |

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

**未改変リスク**: active 19 は vendor をコピーしただけで UT-TDD 化ゼロ。HELIX 前提 (絶対パス・`helix` コマンド) のまま現役稼働中。pmo-sonnet は毎回 `~/ai-dev-kit-vscode/helix/HELIX_CORE.md` を Read する設計で、CI 等の不在環境でエラーリスク。

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
- HELIX `cli/helix-dashboard` / `cli/helix-asset` / builder 系 command / `docs/commands/*` → `ut-tdd dashboard` / `ut-tdd asset` / `ut-tdd builder` 等 (porting-map W11/W12/W16、未着手)。
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

## §6 FR 反映結果と漏れ監査 (2026-06-02)

2026-06-02 の再監査では、HELIX 側 runtime 内部資産機能を L1 機能一覧へ再突合した。結論は **FR-level の新規漏れなし**。§5 の FR-AST-1〜4 は L1 採番体系に合わせて以下へ反映済み。

| 棚卸候補 | L1 反映先 | 状態 | 補足 |
|---|---|---|---|
| FR-AST-1 subagent roster | FR-L1-46 | 反映済み | active 19 件を UT-TDD roster として harden。guard / capability class / model family と接続 |
| FR-AST-2 skill pack curate | FR-L1-47 | 反映済み | vendor `SKILL.md` 107 件を core / optional / drop に分類し、UT-TDD `docs/skills` へ curate |
| FR-AST-3 command subcommand 化 | FR-L1-48 | 反映済み | `docs/commands` 19 件と `cli/helix-*` 70 件を対象に含める。builder 系は W11 として FR-L1-48 に明記 |
| FR-AST-4 drift lint | FR-L1-49 | 反映済み | HELIX 前提残存、docs/skills 空、roster↔guard 不整合を fail-close 検出 |

## §7 TS 再実装 / 転用可否分類

ADR-001 に従い、HELIX Python をそのまま port せず TypeScript/Bun で作り直す。分類は「実行時にそのまま使えるか」ではなく「UT-TDD 正本としてどの形にするか」で判断する。

| 資産種別 | 対象 | 判定 | 必要作業 |
|---|---|---|---|
| executable core logic | `cli/lib/**`, `cli/helix-*`, W1〜W17 の実行ロジック | **TS/Bun 再実装が必要** | `src/**` / CLI subcommand に作り直す。`.helix` path、HELIX enum、Python state、固定 model 名を除去 |
| hook / guard / lint | `.claude/hooks/*`, `.claude/settings.json`, agent guard、drift lint | **TS 統制 + shell/PowerShell wrapper が必要** | package-local `ut-tdd` 経由、Windows/POSIX smoke、fail-close 範囲の明確化 |
| subagent prompt | `.claude/agents/*.md` 19 件 | **TS literal 化しない。markdown 正本として修正転用** | role→capability class、model family、絶対パス、`helix codex`、HELIX 用語を除去。roster registry / guard は TS |
| skill 本文 | `vendor/helix-source/skills/**/SKILL.md` 107 件 | **TS literal 化しない。markdown 正本として curate** | core / optional / drop 分類、UT-TDD SKILL_MAP、trigger、用語置換。catalog / recommender / injector は TS |
| command docs / templates | `docs/commands/*.md`, plan/handover/team templates | **docs/templates として修正転用** | command 名、path、state、Windows 前提を UT-TDD 化。実行動作は TS CLI |
| historical docs / audit findings | `docs/v2/**`, old PLAN / audit evidence | **無修正参照可 (runtime 転用不可)** | evidence / regression idea として link 参照のみ。正本要件・実装にはしない |
| vendor snapshot | `vendor/helix-source/**` | **無修正参照可 (read-only)** | 直接編集・runtime 正本化は禁止。必要な場合は UT-TDD 所有パスへ取り込み、上記分類に従って再実装 / curate |

**runtime として修正せず転用できるものは 0 件**。無修正で使えるのは evidence / reference としての vendor snapshot と historical docs に限る。subagent / skill の自然言語本文は TS 化しないが、UT-TDD で動かすには内容の harden / curate が必要である。
