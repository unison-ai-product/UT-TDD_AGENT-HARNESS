---
layer: L4
sub_doc: architecture
status: confirmed
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
plan: docs/plans/PLAN-L4-02-architecture.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: 技術決定の根拠 = [ADR-001](../../../adr/ADR-001-ut-tdd-harness-redesign-and-language.md) / 方式記述様式 = arc42 §4/§5/§9 ([document-system-map](../../../governance/document-system-map.md) §2/§4) / 構造 (ドメインモデル) = [data.md](./data.md) / 実装 = `src/`。本 doc は「どう実現するか」(実行構造・制御フロー・依存方向) を担い、構造は data.md に委ねる。
>
> **用語更新 (G.9) / 機能要求更新 (G.10) の所在**: per-工程 delta は生成元 [PLAN-L4-02](../../../plans/PLAN-L4-02-architecture.md) の §6 (用語更新) / §7 (機能要求更新) に記録する (data.md と同規約)。artifact 本体 (本 doc) は構造・方式記述に専念し、delta tracking を二重化しない。
> **V-pair**: 本 doc の `pair_artifact = L9-system-test-design.md` は L4 sub-doc 群 (architecture/data/...) が **共通参照する集合 pair** (PLAN-L4-00-master 経由)。1 設計 doc:1 test doc ではなく、L4↔L9 を sub-doc 横断で束ねる。

# UT-TDD Agent Harness — L4 基本設計: 方式設計 (Architecture)

data.md (5 集約 = 構造) を building block に配置し、UT-TDD harness の**実現方式**を arc42 で確定する (PLAN-L4-02-architecture)。実装言語・配布・横断方針は ADR-001 を SSoT とし、本 doc はその設計根拠と module 境界を明文化する。

## §1 アーキテクチャ概観 / 制約

UT-TDD harness は **AI 実装エージェント (Claude Code / Codex) を統制する単一ルール core** + 薄い OS entrypoint + Claude runtime hook で構成される。core は対象リポジトリの言語に非依存 (harness 自身は TS)。

| 制約 (ADR-001) | 方式への影響 |
|---|---|
| 実装言語 = TypeScript (strict) / Bun | core は全 TS。bash を core に置かない (entrypoint のみ薄い OS shell) |
| state = `.ut-tdd/` YAML/JSON + SQLite projection DB (`.ut-tdd/harness.db`) | 永続化層は fs + projection。集約は file schema (data.md §8)、V-model 製本・trace/coverage/findings は SQLite projection (data.md §8.1) |
| 対象リポジトリ言語非依存 | harness は対象コードを実行せず、doc/PLAN/state を検証する静的 + orchestration ツール |
| Windows ネイティブ第一級 | path = Node `path`、改行 = `.gitattributes` 正規化、Codex sandbox 不安定を runtime adapter に隔離 |
| ルール同一性 (concept §2.1.0) | Claude (hook) / Codex (AGENTS.md) が**同一 core**を呼ぶ。判定ロジックを 2 重実装しない |
| 配布 = 単一バイナリ (`bun build --compile`) | core は外部 service 起動を adapter に隔離し、本体は pure に保つ |

## §2 主要技術決定 (arc42 §4 Solution Strategy)

品質目標 (ISO 25010) → 技術選択の対応。**zod を schema 単一正本**にすることが本 harness の中核 (enum drift をコンパイル時 + 実行時の両方で根絶)。

| 品質目標 (ISO 25010) | 技術決定 | 根拠 |
|---|---|---|
| 機能適合性 / 正確性 | **zod 単一正本** (`src/schema`) で enum・契約を型 + 実行時検証に展開 | drift 根絶 (ADR-001 Consequences、要件 §1.10 F) |
| 移植性 (Windows/Linux 同一動作) | TS/Bun + Node `path` + bash 排除 + `bun build --compile` 単一バイナリ | ADR-001 §3 クロスプラットフォーム規約 |
| 信頼性 (fail-close) | guard / lint は exit≠0 で停止 (agent-guard / 5 lint / doctor) | 安全性を pass させない (.claude/CLAUDE.md) |
| 保守性 / モジュール性 | 依存を `src/schema` へ一方向集約、循環禁止、lint は 1 関心 1 module | §3/§5 依存方向 |
| テスト容易性 | 各 module が pure 関数 (`analyzeX(opt?)`) を export、副作用を entrypoint に隔離 | lint 5 種の共通様式、vitest |
| 相互運用性 (Claude/Codex/MCP 圏) | commander CLI + 将来 MCP server 化を見据えた TS | ADR-001 Rationale (ecosystem fit) |

技術スタック (ADR-001 §技術スタック より): TypeScript strict / Bun / commander / **zod** / vitest / YAML+JSON state + SQLite projection DB / 単一バイナリ配布。

> **CLI framework 注記 (確定)**: ADR-001 が保留していた「oclif または commander」は **commander に確定** ([ADR-006](../../../adr/ADR-006-cli-framework-commander.md)、accepted 2026-06-05)。oclif は重量級構成が「薄い entrypoint + compiled core」方針に過剰として却下。`src/cli.ts` の実装確定を ADR-006 が追認記録 (IMP-070 resolved)。

## §3 building block view (arc42 §5)

### §3.1 Level 1 — サブシステム (`src/` トップ)

| building block | 責務 | 公開 IF | 依存先 |
|---|---|---|---|
| **cli** (`src/cli.ts`) | コマンドディスパッチ (status/doctor/plan/vmodel...)。副作用 (stdout/exitCode) の唯一の置き場 | `program` (commander) | runtime / doctor / plan / vmodel / (lint) |
| **schema** (`src/schema/`) | enum・契約・frontmatter の **単一正本** (zod)。値オブジェクト (data.md §3) の機械的 SSoT | `VALID_*` 定数 / frontmatter スキーマ | (なし — 依存の末端 = 安定核) |
| **lint** (`src/lint/`) | doc/PLAN/trace の静的検証群 (g3-trace / entity-coverage / fr-registry / doc-consistency / improvement-backlog / backfill-pairing / scrum-reverse / propagation / review-evidence)。**hard 判定 (doctor.ok 連動) の対象集合は `src/doctor/index.ts` が正本** (設計 doc に固定数を直書きしない、§6 m-4) | `analyzeX(opt?)` pure 関数群 | schema (一部) / fs (loadX) |
| **export** (`src/export/`) | canonical doc から派生 export dataset / render artifact projection を作る pure 変換層。CSV/Markdown は内蔵 renderer、XLSX/PPTX は renderer readiness finding に閉じる (PLAN-L7-35) | `parseCanonicalDocumentStructure()` / `buildDocumentExportDataset()` / `renderDocumentExport()` / `recordDocumentExportArtifact()` | schema (path normalization) |
| **plan** (`src/plan/`) | PLAN frontmatter + 本文の lint | `lintPlan(path?)` | schema |
| **vmodel** (`src/vmodel/`) | V-model 4 artifact 双方向 trace lint | `lintVmodel(path?)` | schema |
| **runtime** (`src/runtime/`) | 実行モード検出 (detect) + runtime adapter dry-run plan + provider handover + agent-guard 判定本体 + agent-slots (並列 slot 記録、IMP-050) + forced-stop (強制停止推定、IMP-068) + session-log (session 観測、IMP-068) | `detectMode()` / `buildAdapterPlan()` / `runProviderHandover()` / `agent-guard` / `agent-slots` / `forced-stop` / `session-log` | schema (allowlist) / roster (将来、実装後に切替。現状ハードコード相当、§3.1 note + §4.1 移行段階) |
| **gate** (`src/gate/`) | execution mode 別 review-tier 判定 (judgment gate の cross-agent / intra_runtime_subagent / human review 強制) | `evaluateGateReview()` | runtime / fs (checklist load) |
| **team** (`src/team/`) | hybrid team run の事前検証 (worker/reviewer provider 分離、duplicate role/provider 検出) | `validateTeamRun()` | schema / runtime |
| **doctor** (`src/doctor/`) | 統合検証 (lint 群 + state 突合の集約) | `runDoctor()` | lint / runtime / schema |
| **handover** (`src/handover/`) | session 引き継ぎ (CURRENT.json 生成/consume/stale 判定、prefill scope、PLAN-L6-06/L7-04 実装済) | `runHandover()` | schema / fs |
| **setup** (`src/setup/`) | repo baseline 確立 (solo/team で出し分ける GitHub 設定ファイル emit、PLAN-L6-05/L7-03 実装済) | `runSetup()` | schema / fs |
| **web** (`src/web/`) | 中央 Web UI adapter (画面 + DB サーバ、配布=GitHub-pull + team server、[ADR-005](../../../adr/ADR-005-distribution-model-and-central-ui.md))。core CLI とは別 adapter (本体 pure 維持) | (Phase B 配備) | schema / fs |
| **roster** (将来 `src/roster/`) | 内部資産 subagent roster registry。`.claude/agents/*.md` (層1 markdown 正本) の frontmatter を読み capability class / model family を構築、guard allowlist の SSoT (A-85、FR-L1-46、ADR-004 層2) | `loadRoster()` / `resolveCapability()` | schema / fs (loadX 端点) |
| **skills** (将来 `src/skills/`) | 内部資産 skill catalog / recommender / injector。`docs/skills/**/*.md` (層1 正本) を読み L 別注入セットを構築 (A-85、FR-L1-47/12/37、ADR-004 層2) | `loadCatalog()` / `recommendSkill()` / `injectByLayer()` | schema / fs (loadX 端点) |

> **依存方向の原則**: すべての依存は `schema` へ向かう一方向 (schema は何にも依存しない安定核)。`cli`/`doctor` が最も外側 (副作用層)。**循環依存禁止** (D-03=0 の構造的保証)。
> **内部資産 module (roster/skills) の依存 (A-85、ADR-004)**: roster/skills も **schema へ一方向依存のみ** (安定核維持、循環禁止)。fs 読込は `loadX()` 端点に隔離し、catalog 構築/capability 解決/skill 推挙の core ロジックは pure 関数 (テスト時 docs 注入)。**層1 (.md 正本) は TS が読むだけ (生成しない)**。
> **roster ↔ agent-guard の依存方向 (Critical-1 是正 A-85)**: roster は agent-guard に**依存しない** (依存先 = schema/fs のみ)。allowlist 統合は **agent-guard (runtime) が roster を読む = `runtime → roster` の一方向**で実現し、循環を作らない。roster は `.claude/agents/*.md` から allowlist を構築する**設計上の SSoT** (受動的提供側)、agent-guard が enforcement (能動的参照側)。現状 agent-guard はハードコード相当 allowlist で動作 (実装済)、roster 実装完了時に agent-guard が roster 参照へ切替 (移行段階は §4.1 / 下記 Critical-2 是正)。
> **fs の扱い**: `fs` (Node built-in) は依存方向ルールの対象外 (副作用アクセス)。core ロジックは `analyzeX(docs?)` の pure 関数に隔離し、`loadX()` (fs 読込) を呼び出し端点側に寄せる方針。テスト時は docs を注入し fs を介さない (§3.2)。

### §3.2 Level 2 — 代表 module の内部

- **schema**: `index.ts` (主要 enum 群 `VALID_*` + `V_MODEL_PAIRS`、**件数は `schema/index.ts` が正本** = 設計 doc に固定数を直書きしない) / `frontmatter.ts` (kind 別 superRefine: poc→S0-S4・cross、reverse R4→routing+strategy、design L1-L6→sub_doc、design/impl→review_evidence)。
- **lint 共通様式**: `loadX()` (fs 読込) → `analyzeX(docs?)` (pure、テスト時は docs 注入) → result object (`{orphans, totals}`)。テストは orphans=[] + totals>0 (非空虚) を assert。
- **runtime**: `detect.ts` (binary + probe + env で claude/codex 検出 → mode) / `agent-guard.ts` (subagent_type allowlist 15 + model 明示 + family 一致、fail-close) / `agent-slots.ts` (並列 slot fire→release 記録、IMP-050) / `forced-stop.ts` (dangling session 推定、IMP-068) / `session-log.ts` (session 観測ログ、IMP-068)。

## §4 集約 → module マッピング (arc42 §5 view、IMP-025)

data.md の 5 集約 (構造) を src/ building block (実行) に配置する横断ビュー。

| 集約 (data.md §2) | 主担当 module | 検証 lint / guard | state (`.ut-tdd/`) |
|---|---|---|---|
| **Plan** | plan + schema(frontmatter) | plan lint / (plan-id-schema 第2弾) | `plan_registry/*.json` + `docs/plans/*.md` |
| **Artifact** (pair/trace/AC/AT) | vmodel + lint(g3-trace) | vmodel lint / g3-trace (R3 AC↔AT) | `artifact/` + `artifact/trace/` |
| **Workflow** (phase/gate) | doctor + schema | doctor (工程順序 D-03) | `phase.yaml` / `gate_runs` |
| **Handover** | **handover module** (`src/handover/`、実装済 PLAN-L6-06/L7-04) | doctor (CURRENT.json stale 判定) | `handover/CURRENT.json` |
| **Evaluation** (Phase B) | (将来 `telemetry` module、L6 carry / IMP-019) | improvement-backlog (橋渡し) | `audit/*.jsonl` |
| 値オブジェクト (12 種、うち 11 実装済 / SubDoc は spec のみ IMP-026) | **schema** (zod enum SSoT) | 全 lint が schema を参照 | (state 読込時に zod validate) |
| derived_view (CQRS) | (将来 HM 画面 projection) | — | 集約 state から projection |

> 未実装 module (telemetry/HM projection) は **carry** (本 doc では責務境界のみ定義、実装は後続層)。現状実装済 = cli/schema/plan/vmodel/runtime/doctor/lint/**handover/setup**。**web** (中央 UI、ADR-005) は Phase B 配備。Handover は当初「将来 session module」と記載したが PLAN-L6-06/L7-04 で実装済 → 本 PLAN-L4-06 で実体へ整合 (drift back-fill)。

### §4.1 内部資産 drift lint (A-85、FR-L1-49、IMP-033 rule 型)

内部資産 (roster/skills) の整合は **IMP-033 cross-check rule engine (gate-design §4/§5) の rule 型 `asset-drift` インスタンス**として構想した。Current implementation (A-116/A-118) は先行 hard-gate slice として `src/lint/asset-drift.ts` を持ち、`.claude/agents/*.md` / `docs/skills` / `docs/templates/prompts/*.md` を scan する。Full roster/skills semantic rule-engine integration remains L7 carry.

| 検査項目 (inventory §1 / ADR-004 由来) | fail-close 条件 |
|---|---|
| HELIX 絶対パス残存 | `.claude/agents/*.md` が `~/ai-dev-kit-vscode/` / `C:\Users\micro` を含む → fail |
| `helix codex` 直叩き | subagent 本文に `helix codex` 直呼び出しが残存 → fail |
| `docs/skills/` 空 (curate 未着手) | skill pack が `.gitkeep` のみ → fail (curate 完了を強制) |
| roster ↔ guard allowlist 整合 | `.claude/agents/*.md` の model family と agent-guard allowlist (15) が乖離 → fail |

> **既存 `dependency-drift` (ADR-002) と並置**: gate-design §5 rule registry に `dependency-drift` が既存。内部資産 `asset-drift` を同列追加 (両方 IMP-033 rule)。Current hard gate sliceは HELIX path residue / legacy command residue / docs-skills vacancy / guard allowlist missing agent docs を doctor 経路で fail-close 済み。DB 未充足検知 (`placeholder_deps`) と full roster/skills semantic integration は L7 carry として A-118 に routing する。
>
> **正規 defer (concept §3.1.3.1、carry plan_id 明示。IMP-074)**: asset-drift の current hard gate slice は A-116 で実装済み。残る full rule-engine integration / roster↔guard semantic drift / placeholder_deps threshold check は **carry plan_id = [`PLAN-L4-13-drift-lint`](../../../plans/PLAN-L4-13-drift-lint.md) → [`PLAN-L5-07-drift`](../../../plans/PLAN-L5-07-drift.md)** の後続 L7/L9 実装・検証へ残す。
>
> **module-drift (設計⊇実在の包含、IMP-075) は実装済・別検査**: 上記 asset-drift current slice / remaining roster-skills carry とは別に、**「architecture §3.1 building block 集合 ⊇ `src/` 実在 module」の包含 drift** は ADR-002/IMP-032 の最小スライスとして **`src/lint/module-drift.ts` で実装済** (doctor `checkModuleDrift`、warn-first)。A-103 で handover/setup/web を「将来」のまま放置した meta-drift (impl→design back-fill 漏れ) を再発防止する回帰網 (U-MDRIFT-005 が実 repo 孤児0 を CI 担保)。import グラフ drift (循環/逆依存、knip/madge) は IMP-032 として別途 carry。

## §5 制御フロー / 実行時ビュー

代表シナリオの制御フロー (依存は常に schema 方向、副作用は cli/hook 端点)。

| シナリオ | フロー | fail 時 |
|---|---|---|
| **status** | entrypoint → `cli status` → `detectMode()` (binary/probe/env) → mode 出力 | — (検出のみ) |
| **plan lint** | `cli plan lint` → `lintPlan()` → schema frontmatter validate → result | exit 1 (CI 停止) |
| **doctor** | `cli doctor` → `runDoctor()` → lint 群 + state 突合集約 → ok/messages | exit 1 |
| **agent-guard** (有効 hook) | Claude `PreToolUse(Agent)` → `bun agent-guard.ts` → allowlist 15 + model 明示 + family 一致 | **exit 2 = block** (fail-close)。bypass = `UT_TDD_ALLOW_RAW_AGENT=1` → warn+pass (理由を会話記録、.claude/CLAUDE.md) |
| **handover** (実装済) | `cli handover` → `runHandover()` → CURRENT.json 生成/consume + 鮮度判定 | — (生成/記録、§1-§2 auto / §3-§6 人手) |
| **setup** (実装済) | `cli setup` → `runSetup()` → solo/team 別 GitHub 設定ファイル emit (branch protection は emit-only) | precondition 不成立で停止 (非対話 + `--apply-branch-protection` 等) |
| **目標 hook** (未有効) | PreToolUse(Write/Bash)/PostToolUse 等 → `ut-tdd ...` | UT-TDD CLI 整備後に有効化 |

> 実行時の唯一の状態源は `.ut-tdd/` file state。core は state を読み → 検証 → 結果を返すのみ (副作用最小、テスト時は docs/state を注入)。

## §6 横断方針 (hook / CI 配線)

| 横断関心 | 方式 | 現状 |
|---|---|---|
| **subagent guard** | `PreToolUse(Agent)` = `bun .claude/hooks/agent-guard.ts` (環境非依存 TS、判定本体 `src/runtime/agent-guard.ts`)、fail-close (block=exit 2、`blockOnFailure:true`) | **有効** |
| **session-log / forced-stop** | `SessionStart` / `PostToolUse(Edit\|Write\|Bash)` / `Stop` = `bun src/cli.ts session start` / `hook post-tool-use` / `session summary` (判定本体 `src/runtime/session-log.ts` + `forced-stop.ts`)、fail-OPEN (ログ失敗で作業を止めない) | **有効** (IMP-068) |
| **commit-msg hook** | git `commit-msg` hook が Conventional Commits を fail-close 強制 (`feat\|fix\|docs\|...`、.claude/CLAUDE.md / [[project_commit_msg_hook]]) | **有効** |
| その他 hook | PreToolUse(Write/Bash/WebSearch) 等 → package-local `ut-tdd` command | **未有効** (CLI 整備後、目標形は .claude/CLAUDE.md「Target UT-TDD Hooks」) |
| **CI lint** | 5 lint (g3-trace/entity-coverage/fr-registry/doc-consistency/improvement-backlog) + plan/vmodel lint を CI で実行、orphan 検出で fail-close | vitest pass で担保 (件数は CI artifact 参照。可変な実装メトリクスを設計 doc に固定値で直書きしない、m-4)、CI 配線は L7 carry (IMP-007) |
| entrypoint | `scripts/ut-tdd` (POSIX) / `ut-tdd.ps1` (Windows) は薄く compiled core を呼ぶだけ (bash ロジック禁止) | ADR-001 §3 |
| 依存隔離 | 外部 service (Claude/Codex/GitHub/Sentry) 起動は **runtime adapter** に隔離、core は正規化 intent のみ発行 | external-if (PLAN-L4-04) で境界契約化 |

## §7 ADR 仕組み (arc42 §9、IMP-023)

L4 方式設計 sub-doc は **ADR を必須 artifact** とする。様式 = arc42 §9 / MADR 準拠。

**ADR テンプレート** (`docs/adr/ADR-NNN-<slug>.md`):

```
# ADR-NNN: <タイトル>
- Status: proposed | accepted | superseded by ADR-MMM
- Date / Deciders / 関連
## Context     (背景・制約・課題)
## Decision    (採択した方式)
## Alternatives considered  (却下案 + 理由)
## Consequences  (+/- 結果、carry)
```

| ADR | 状態 | 扱い |
|---|---|---|
| **ADR-001** | accepted | TS/Bun + YAML/JSON state + SQLite projection DB + bash 排除 (既存、本方式の基盤) |
| **[ADR-002](../../../adr/ADR-002-dependency-direction-and-auto-map.md)** | **accepted** (2026-05-29) | 依存方向ルール (schema 安定核 + 循環禁止 + fs 隔離) + **依存マップ自動生成・構想 vs 実装 drift lint** (IMP-032)。§3 が設計根拠 |
| **[ADR-003](../../../adr/ADR-003-runtime-adapter-boundary-subscription-cli.md)** | **accepted** (2026-05-29) | runtime adapter 境界 (Anti-Corruption Layer)、**契約プラン CLI/hook 前提・API key 非保持** (A-71 是正を反映)。§6 + external-if §6 が設計根拠 |
| **[ADR-004](../../../adr/ADR-004-internal-asset-ts-control-boundary.md)** | **accepted** (2026-06-01) | 内部資産 (subagent/skill/command) の TS 統制境界 = **層1 資産の中身 markdown 正本 / 層2 管理機構 TS**。TS は生成でなく検証/注入/統制。FR-L1-46〜49 / BR-22 / Recovery PLAN-RECOVERY-01 の設計根拠。real Codex TL 確定 |
| **[ADR-005](../../../adr/ADR-005-distribution-model-and-central-ui.md)** | **accepted** (2026-06-01) | 配布モデル = **GitHub-pull + team server 中央 Web UI**。core CLI は単一バイナリ (§1 制約 `bun build --compile`)、画面+DB は別 adapter (`src/web/`、Phase B)。local↔Web 通信境界は ADR-003 adapter 方針の延長 (§2 (e) external-if) |
| **[ADR-006](../../../adr/ADR-006-cli-framework-commander.md)** | **accepted** (2026-06-05) | CLI フレームワーク = **commander** (oclif 却下)。ADR-001 保留の確定 + `src/cli.ts` 実装追認 (§2 注記の floating 解消、IMP-070 resolved) |

> ADR-002/003 は PO 承認済 (2026-05-29)、ADR-004/005 は TL 確定 + PO 承認 (2026-06-01)。将来 local↔Web 通信境界 (画面+DB サーバ化、IMP-031) は **ADR-005 (配布+中央UI)** が方針正本、通信は ADR-003 adapter の延長で Phase B に扱う。

## §8 carry → L5 詳細設計 / L6 機能設計

- **module 公開 IF の契約** (Precondition/Postcondition) = L5 D-API / internal-processing で DbC docstring 化 (IMP-014、edge 5-8)
- **runtime adapter の境界契約** = external-if (PLAN-L4-04) で DbC pre/post、L5 D-API へ carry (IMP-018)
- **未実装 module** (session/telemetry/HM projection) の内部アルゴリズム = L6 機能設計 (IEEE 1016 §5.7 pseudocode、IMP-019)
- **ADR-002/003 候補**の起票判断 = G4 前の PO/TL レビュー
- **CI lint 配線** (5 lint + plan/vmodel の自動発火) = L7 実装 + hook 化 (IMP-007)
- **plan-id-schema lint** (Plan 集約 ID 検証) = 第2弾 lint (IMP-004)
