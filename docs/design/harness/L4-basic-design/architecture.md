---
layer: L4
sub_doc: architecture
status: confirmed
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
plan: docs/plans/PLAN-L4-33-node-control-plane-redesign.md
replacement_issue: 152
predecessor_plan: docs/plans/PLAN-L4-02-architecture.md
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
| 現行実体 = TypeScript (strict) / Bun、target = TypeScript / Node | mainにはBun production/test経路が残るため現状をNode化済みと扱わない。新規Bun依存は禁止し、Node parity receipt後に既存経路を段階撤去する |
| state = `.ut-tdd/` YAML/JSON + SQLite projection DB (`.ut-tdd/harness.db`) | 永続化層は fs + projection。集約は file schema (data.md §8)、V-model 製本・trace/coverage/findings は SQLite projection (data.md §8.1) |
| 対象リポジトリ言語非依存 | harness は対象コードを実行せず、doc/PLAN/state を検証する静的 + orchestration ツール |
| Windows ネイティブ第一級 | path = Node `path`、改行 = `.gitattributes` 正規化、Codex sandbox 不安定を runtime adapter に隔離 |
| ルール同一性 (concept §2.1.0) | Claude (hook) / Codex (AGENTS.md) が**同一 core**を呼ぶ。判定ロジックを 2 重実装しない |
| 現行配布 = `bun build --compile`、target配布 = sealed Node generation | 旧配布をmigration debtとしてinventoryし、Node generationの同一性・rollback成立前に削除しない |

## §2 主要技術決定 (arc42 §4 Solution Strategy)

品質目標 (ISO 25010) → 技術選択の対応。**zod を schema 単一正本**にすることが本 harness の中核 (enum drift をコンパイル時 + 実行時の両方で根絶)。

| 品質目標 (ISO 25010) | 技術決定 | 根拠 |
|---|---|---|
| 機能適合性 / 正確性 | **zod 単一正本** (`src/schema`) で enum・契約を型 + 実行時検証に展開 | drift 根絶 (ADR-001 Consequences、要件 §1.10 F) |
| 移植性 (Windows/Linux 同一動作) | 現行TS/Bunをbaselineとして保持しつつ、TypeScript/Node + Node `path` + compiled ESMへ移行 | ADR-001 §3 クロスプラットフォーム規約 |
| 信頼性 (fail-close) | guard / lint は exit≠0 で停止 (agent-guard / 5 lint / doctor) | 安全性を pass させない (.claude/CLAUDE.md) |
| 保守性 / モジュール性 | 依存を `src/schema` へ一方向集約、循環禁止、lint は 1 関心 1 module | §3/§5 依存方向 |
| テスト容易性 | 各 module が pure 関数 (`analyzeX(opt?)`) を export、副作用を entrypoint に隔離 | lint 5 種の共通様式、vitest |
| 相互運用性 (Claude/Codex/MCP 圏) | commander CLI + 将来 MCP server 化を見据えた TS | ADR-001 Rationale (ecosystem fit) |

技術スタックは二状態を区別する。**current**はTypeScript strict / Bun / commander / zod / vitest /
YAML+JSON+SQLite / Bun単一バイナリでありmigration debtである。**target**はTypeScript strict /
Node / compiled ESM / sealed generationである。Node parity receipt前にcurrentを削除せず、target成立後に
current Bun経路を残さない。

> **CLI framework 注記 (確定)**: ADR-001 が保留していた「oclif または commander」は **commander に確定** ([ADR-006](../../../adr/ADR-006-cli-framework-commander.md)、accepted 2026-06-05)。oclif は重量級構成が「薄い entrypoint + compiled core」方針に過剰として却下。`src/cli.ts` の実装確定を ADR-006 が追認記録 (IMP-070 resolved)。

## §3 building block view 構成ビュー (arc42 §5)

### §3.1 Level 1 — サブシステム (`src/` トップ)

| building block | 責務 | 公開 IF | 依存先 |
|---|---|---|---|
| **cli** (`src/cli.ts`) | コマンドディスパッチ (status/doctor/plan/vmodel...)。副作用 (stdout/exitCode) の唯一の置き場 | `program` (commander) | runtime / doctor / plan / vmodel / (lint) |
| **context** (`src/context/`) | canonical doc のセクション索引とタスク別 reading suggestion を提供する context routing 層。常時必読 doc を役割相応の section read に縮小するための補助 surface (fail-open、全文読み推奨へ戻せる) | `buildDocIndex()` / `suggestSections()` / `contextSuggest()` | task / fs |
| **schema** (`src/schema/`) | enum・契約・frontmatter の **単一正本** (zod)。値オブジェクト (data.md §3) の機械的 SSoT | `VALID_*` 定数 / frontmatter スキーマ | (なし — 依存の末端 = 安定核) |
| **kernel** (`src/kernel/`) | bounded context間で共有する副作用なしの最小identity/value resolver。domain adapterを相互importさせずcycle 0を維持する | `resolveLegacyPlanAlias()` | (なし — pure stable kernel) |
| **lint** (`src/lint/`) | doc/PLAN/trace の静的検証群 (g3-trace / entity-coverage / fr-registry / doc-consistency / improvement-backlog / backfill-pairing / scrum-reverse / propagation / review-evidence / **roadmap-registry**)。**hard 判定 (doctor.ok 連動) の対象集合は `src/doctor/index.ts` が正本** (設計 doc に固定数を直書きしない、§6 m-4)。<br>**工程表メタモデル** (`roadmap-registry.ts` + `schema/roadmap.ts`): 工程表 (roadmap) = **人間向け全プログラム進行台帳** (機能群=結合テスト粒度、human/AI plane = 工程表:人間自己割当 / PLAN:AI オーケストレーション、定義正本 concept §10.2)。`analyzeProgramCoverage` が **全プログラム被覆** (forward 全バンド `PROGRAM_BANDS` の工程表登録) を doctor へ surface (未登録 = 「実装どこまで?」frontier、warn-first)。フロント (中央UI) へは harness.db projection 経由 (PLAN-RECOVERY-04 定義 / REVERSE-44 設計書) | `analyzeX(opt?)` pure 関数群 / `analyzeProgramCoverage` | schema (一部) / fs (loadX) |
| **export** (`src/export/`) | canonical doc から派生 export dataset / render artifact projection を作る pure 変換層。CSV/Markdown は内蔵 renderer、XLSX/PPTX は renderer readiness finding に閉じる (PLAN-L7-35) | `parseCanonicalDocumentStructure()` / `buildDocumentExportDataset()` / `renderDocumentExport()` / `recordDocumentExportArtifact()` | schema (path normalization) |
| **projection** (`src/projection/`) | DB非依存のprojection domain、application command、意味的read/store portを所有する。SQLやfilesystemをdomain/applicationへ漏らさず、具象SQLite adapterは`state-db`側で実装する | `ProjectionStore` / `PocEvaluationReadPort` / `ModelEvaluationReadPort` / `OperationalMetricsReadPort` / 各project command | applicationは`stable-id`、repository config adapterだけがnode:fs/path + yamlへ依存する。state-dbへ逆依存しない |
| **state-db** (`src/state-db/`) | `.ut-tdd/harness.db` projection の SQLite adapter (bun:sqlite first / node:sqlite fallback、runtime 出し分け) + registry-driven migration (PRAGMA user_version) + idempotent upsert。projection 充填は span ② で配線 (PLAN-L7-44/45) | `openHarnessDb()` / `migrate()` / `upsertRow()` / `harnessDbStatus()` | schema (harness-db registry) / kernel alias resolver / fs |
| **cutover-ledger** (`src/runtime/cutover-transition.ts`) | canonical cutover receipt/object/refを専用`.ut-tdd/ledger/cutover-ledger.db`へappendする。独自migration registry、`user_version`、online backup/restoreを所有し、`.ut-tdd/harness.db`のprojection writerはread-only投影だけを行う。`.ut-tdd/ledger/harness-ledger.db`はPLAN ledger専用。物理正本はL5 [physical-data.md](../L5-detailed-design/physical-data.md) §2.7.1 | `initializeCutoverChain()` / `appendCutoverTransition()` / `backupCutoverLedger()` / `restoreCutoverLedger()` | schema / Node SQLite / fs |
| **search** (`src/search/`) | `.ut-tdd/harness.db` の `search_index` を読み、PLAN/artifact/finding/skill/model/session の参照検索を提供する read-only query layer (PLAN-L7-47) | `findReference()` / `upsertSearchReference()` | state-db |
| **feedback** (`src/feedback/`) | finding / quality_signal / skill recommendation/invocation を集約し、replanning input として `feedback_events` と skill metrics を projection する (PLAN-L7-47) | `computeSkillMetrics()` / `emitFeedbackEvents()` | state-db |
| **elicitation** (`src/elicitation/`) | 設計判断エリシテーション文脈 (PLAN-L7-428)。工程表 live state + skill decision_points + typed-spec カバレッジを 1 packet に結合して `## 設計判断依頼` 雛形を描画し、採択結果を `.ut-tdd/logs/design-decisions.jsonl` へ append-only 記録する (正本 = PLAN 設計判断節 / ADR、governance = `docs/governance/design-decision-elicitation.md`) | `selectElicitationContext()` / `renderElicitationContext()` / `appendDesignDecision()` | handover (schedule live state) / skill-engine / state-db / fs |
| **workflow** (`src/workflow/`) | workflow/gate/doctor/CI projection を join し、automation readiness を ready/blocked/human-required に分類する。証跡不足で ready にしない (PLAN-L7-48) | `evaluateAutomationReadiness()` | state-db |
| **guardrail** (`src/guardrail/`) | agent-guard / review / escalation / human signoff の判断を `guardrail_decisions` へ正規化する ledger。human-required を DB projection で格下げしない (PLAN-L7-48) | `recordGuardrailDecision()` | state-db |
| **assets** (`src/assets/`) | skill / roster / command docs を metadata catalog として `automation_assets` / `search_index` へ projection する。prompt body は保存しない (PLAN-L7-49) | `catalogAutomationAssets()` | state-db / fs |
| **skill-scoring** (`src/skill-scoring/`) | skill 推奨 score の純粋 scorer。CLI 推奨と DB projection が同じ scoring SSoT を参照し、metadata overlap、runtime-provenance learning、wildcard checklist 除外を一箇所で判定する。state-db / skill-engine / assets へ依存しない低レベル module。 | `scoreSkill()` / `scoreSkillDetailed()` / `shouldScoreSkillAsset()` | none |
| **audit** (`src/audit/`) | hardcode/security/debt と branch cleanup inventory を read-only に分類する maintenance audit 層。破壊操作は CLI scope 外に置き、gate/actionable/telemetry 表示 discipline に揃える (PLAN-L7-138) | `runQualityAudit()` / `loadBranchAudit()` | state-db (secret pattern) / git read-only |
| **github** (`src/github/`) | GitHub Actions / PR branch-type / release publication plan の運用 guard。`poc/*` main merge、postmortem 無し `hotfix/*`、非 Conventional Commit subject を fail-close し、tag / GitHub Release は非破壊 plan として外部公開境界を明示する。 | `evaluateGithubOpsGuard()` / `buildReleasePublicationPlan()` | git metadata / PR metadata |
| **execution** (`src/execution/`) | Execution Ledger の Forward 外遷移 (escape) 契約層 (PLAN-L6-83 / PLAN-L7-452)。境界分類、`RequestForwardEscape` validation (fail-close、冪等 payload digest)、drive model 三面一致、Issue body projection と reconcile を GitHub SDK 非依存の純粋関数 + port で提供する。E2 custodyとE3/E4 outboxはSQLite adapterでclose/reopen可能なdigest chainへ永続化する。episode 集約は L7-436 系列で拡張する。 | `classifyForwardBoundary()` / `validateForwardEscape()` / `projectForwardEscapeIssue()` / `reconcileIssueProjection()` / `SqliteForwardEscapeJournal` | node:crypto / state-db (SQLite)。GitHub SDKへ依存しない |
| **graph** (`src/graph/`) | cross-artifact relation graph の repo→`RelationGraphSourceSet` loader (I/O 組み立て層、PLAN-L7-32 §9 / ADR-002 A-124)。pure projection/impact/export は `src/lint/relation-graph.ts`、本 module は既存 loader (impl-plan-trace / review-evidence / vmodel pair) を再利用して doc/source graph を組む。配布用 `docs/templates/adapter/` の Claude/Codex hook・subagent・command template、および repo-local `.claude/settings.json` / `.codex/config.toml` / `.codex/hooks.json` も graph node とし、hook/config 変更が missing-projection へ落ちないようにする。`ut-tdd graph impact/export` CLI の供給元 | `loadRelationGraphSourceSet()` | lint / vmodel / fs |
| **trace** (`src/trace/`) | typed spec ID 起点の trace impact traversal。`spec_defs` / `spec_relations` の `spec.defines:*` ID 宇宙を read-only に辿り、上流・下流・テスト影響を返す。file/artifact 粒度の `graph impact` / `change-impact` と責務を分ける。 | `analyzeTraceImpact()` | state-db (read-only) |
| **shared** (`src/shared/`) | lint/runtime/cli など複数 module が共有する純粋ヘルパー。module 間の逆依存を避けるための低レベル配置で、domain 判定や I/O は持たない。 | `extractEditTargets()` / `normalizeRepoRelative()` | none |
| **plan** (`src/plan/`) | PLAN frontmatter + 本文の lint | `lintPlan(path?)` | schema |
| **vmodel** (`src/vmodel/`) | V-model 4 artifact 双方向 trace lint | `lintVmodel(path?)` | schema |
| **disposition** (`src/disposition/`) | checked ZIP source/category/item/typed target aggregate、strict authoring loader、Git provenance port。DBやCLIをdomainへ持ち込まず、source→item target推論を禁止する | `DocumentDispositionCatalog.create()` / `loadTrackedCatalogInput()` / `verifyAuthoringProvenance()` | node:crypto / fs・git (adapterのみ) |
| **profile** (`src/profile/`) | document `doc_type_id` scale/product profile masterとdecision overlay aggregate。semantic item profileを創作せず、決定論resolverを提供する | `createProfileCatalog()` / `resolveDocumentProfile()` / `loadTrackedDocumentProfileCatalog()` | disposition strict parser (adapterのみ) / node:crypto |
| **plan-asset** (`src/plan-asset/`) | immutable PLAN identity/revision/evidence/reservationとv1 canonical adapter。`.ut-tdd/ledger/harness-ledger.db`をcanonical event/receipt正本として所有し、HEAD PLAN inventoryとshort alias多義をfail-closeする | `PlanAsset.create/reconstruct/revise()` / `EvidenceRecord.isUsableFor()` / `PlanIdReservation.reserve()` / `PlanLedger.reserve/release/expire()` / `adaptLegacyPlan()` / `buildLegacyPlanInventory()` / `loadProjectIdentityFromHead()` / `migratePlanLedger()` | schema typed DDL / state-db SQLite port / node:crypto / Git・fs（adapterのみ） |
| **plan-admission** (`src/plan-admission/`) | PLAN起票の駆動モデル許可tuple、Reverse/Redesign遷移、receipt内容束縛、差分fenceを所有する。proposal routingのfallbackをauthoringへ持ち込まず、PLAN直接編集をfail-closeする | `evaluatePlanAdmission()` / `analyzePlanAdmissionDiff()` | schema / plan-asset adapter / Git read-only adapter |
| **vmodel-contract** (`src/vmodel-contract/`) | L8-L14 verification obligation と L11/L13 pair 例外を宣言契約から検証済み registry へコンパイルする。domain/application と YAML/fs adapter を分離し、右腕・右肺 detector の手書き定数 drift を防ぐ | `compileRightArmContract()` / `loadCompiledRightArmRegistry()` | node:crypto / yaml / fs (adapterのみ) |
| **runtime** (`src/runtime/`) | 実行モード検出 (detect) + runtime adapter dry-run plan + provider handover + agent-guard 判定本体 + agent-slots (並列 slot 記録、IMP-050) + forced-stop (強制停止推定、IMP-068) + session-log (session 観測、IMP-068) | `detectMode()` / `buildAdapterPlan()` / `runProviderHandover()` / `agent-guard` / `agent-slots` / `forced-stop` / `session-log` | schema (allowlist) / roster (将来、実装後に切替。現状ハードコード相当、§3.1 note + §4.1 移行段階) |
| **resource-kernel** (`src/resource-kernel/`) | ExecutionSpec、resource/admission policy、journal/outbox、receipt封印のTypeScript正本。verified control processのprobeをdurable化してsealed admission tokenを発行し、managed workload生成を別barrierで許可する | `ExecutionKernel` / `CapabilityNegotiator` / `ExecutionJournal` | schema / state-db / native companion・custody authority port。Rust側へdomain ruleを複製しない |
| **gate** (`src/gate/`) | execution mode 別 review-tier 判定 (judgment gate の cross-agent / intra_runtime_subagent / human review 強制) | `evaluateGateReview()` | runtime / fs (checklist load) |
| **team** (`src/team/`) | hybrid team run の事前検証 + Claude/Codex 共通 launch plan + 難易度別の決定論的 model/effort policy + 明示 `--execute` 時の provider adapter 実行 (worker/reviewer provider 分離、duplicate role/provider 検出、`team_runner` slot fire/release) | `validateTeamRun()` / `selectTeamModel()` / `buildTeamRunPlan()` / `executeTeamRunPlan()` | schema / runtime / workflow |
| **task** (`src/task/`) | FR-L1-39 タスク分類の公開 CLI 面。既存契約 (`scoreTaskComplexity` = FR-L1-39 / `classifyDrive` = FR-L1-41) + `inferTaskDifficulty` を合成し kind/drive/size/complexity/difficulty/risk を構造化出力 (`ut-tdd task classify`)。escalation-sensitive 領域 (auth/payments/PII/migration/schema/production) を risk flag 化し plan lint/gate/skill suggest の入力にする | `classifyTask()` | workflow / team |
| **doctor** (`src/doctor/`) | 統合検証 (lint 群 + state 突合の集約) | `runDoctor()` | lint / runtime / schema |
| **handover** (`src/handover/`) | session 引き継ぎ (CURRENT.json 生成/consume/stale 判定、prefill scope、PLAN-L6-06/L7-04 実装済) | `runHandover()` | schema / fs |
| **memory** (`src/memory/`) | `.ut-tdd/memory/*.md` を authored source とする Claude/Codex 共有 memory。`memory_entries` へ deterministic projection し、SessionStart で read-only/fail-open に surface する。secret-like payload は write/parse 時に fail-close する (PLAN-L7-189)。 | `writeMemoryEntry()` / `loadMemoryEntries()` / `selectMemoryEntries()` / `renderMemorySurface()` | secret / state-db type / fs |
| **secret** (`src/secret.ts`) | projection、memory、audit、search が共有する secret-like token detector。低レベル module から参照できるよう依存なしに保ち、state-db への逆依存 cycle を作らない。 | `SECRET_PATTERN` / `isSecretLike()` | none |
| **stable-id** (`src/stable-id.ts`) | DB projection / feedback / skill / workflow が共有する deterministic ID 正規化 helper。ASCII 正規化で情報が落ちる場合は hash suffix を付け、非ASCII見出しやパス由来 ID の衝突を防ぐ。低レベル module から参照できるよう依存は node:crypto のみに保つ。 | `stableId()` | none |
| **setup** (`src/setup/`) | repo baseline 確立 (solo/team で出し分ける GitHub 設定ファイル emit、PLAN-L6-05/L7-03 実装済) | `runSetup()` | schema / fs |
| **web** (`src/web/`) | 中央 Web UI adapter (画面 + DB サーバ、配布=GitHub-pull + team server、[ADR-005](../../../adr/ADR-005-distribution-model-and-central-ui.md))。core CLI とは別 adapter (本体 pure 維持) | (Phase B 配備) | schema / fs |
| **roster** (将来 `src/roster/`) | 内部資産 subagent roster registry。`.claude/agents/*.md` (層1 markdown 正本) の frontmatter を読み capability class / model family を構築、guard allowlist の SSoT (A-85、FR-L1-46、ADR-004 層2) | `loadRoster()` / `resolveCapability()` | schema / fs (loadX 端点) |
| **skill-engine** (`src/skill-engine/`) | 内部資産 skill catalog / recommender / injector。`skills/**/*.md` / legacy `docs/skills/**/*.md` (層1 正本) を読み L 別注入セットを構築 (A-85、FR-L1-47/12/37、ADR-004 層2)。配布物では skill 本文は root `skills/`、実装 engine は `src/skill-engine/` に分離する。 | `loadCatalog()` / `recommendSkill()` / `injectByLayer()` | schema / fs (loadX 端点) |

> **依存方向の原則**: すべての依存は `schema` へ向かう一方向 (schema は何にも依存しない安定核)。`cli`/`doctor` が最も外側 (副作用層)。**循環依存禁止** (D-03=0 の構造的保証)。
> **roadmap-registry park / rollup (PLAN-REVERSE-44 Step3)**: `src/lint/roadmap-registry.ts` は `PARKED_BANDS` を単一正本として、forward 未降下の `verification` / `cutover` を `uncovered` から分離しつつ reason 付きで doctor surface する。`computeProgramRollup` は `PROGRAM_BANDS` の covered/parked/uncovered 不変条件、gate/span 進捗、未登録 band と pending 工程表 planId の frontier、`perBand` を返し、`doctor` は `roadmap-rollup —` 行で warn-first surface する。`computeGateProgress` は confirmed/completed を同等に到達計数する (IMP-132)。harness.db への rollup projection (front 返却) は別増分。
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
| **Artifact** (pair/trace/AC/AT) | vmodel + lint(g3-trace) の artifact 集約 | vmodel lint / g3-trace (R3 AC↔AT) | `artifact/` + `artifact/trace/` |
| **Workflow** (phase/gate) | doctor + schema | doctor (工程順序 D-03) | `phase.yaml` / `gate_runs` |
| **Handover** | **handover module** (`src/handover/`、実装済 PLAN-L6-06/L7-04) | doctor (CURRENT.json stale 判定) | `handover/CURRENT.json` |
| **Evaluation** (Phase B) | (将来 `telemetry` module、L6 carry / IMP-019) | improvement-backlog (橋渡し) | `audit/*.jsonl` |
| 値オブジェクト (12 種、うち 11 実装済 / SubDoc は spec のみ IMP-026) | **schema** (zod enum SSoT) | 全 lint が schema を参照 | (state 読込時に zod validate) |
| derived_view (CQRS) | (将来 HM 画面 projection) | — | 集約 state から projection |

> L7 完遂時点の module surface は cli/schema/plan/vmodel/runtime/doctor/lint/**handover/setup/export/state-db/workflow/feedback/skill-engine/assets/audit** に着地済み。telemetry は `src/feedback/engine.ts` と `src/state-db/projection-writer.ts` の DB projection として実装し、HM/web projection (中央 UI、ADR-005) は Phase B 配備範囲として分離する。Handover は当初「将来 session module」と記載したが PLAN-L6-06/L7-04 で実装済 → 本 PLAN-L4-06 で実体へ整合 (drift back-fill)。

### §4.1 内部資産 drift lint (A-85、FR-L1-49、IMP-033 rule 型)

内部資産 (roster/skills) の整合は **IMP-033 cross-check rule engine (gate-design §4/§5) の rule 型 `asset-drift` インスタンス**として構想した。Current implementation は `src/lint/asset-drift.ts`、`src/runtime/agent-slots.ts#resolveRosterCapability`、`src/assets/catalog.ts`、`src/skill-engine/recommend.ts`、`src/lint/placeholder-deps.ts` を持ち、`.claude/agents/*.md` / `docs/skills` / `docs/templates/prompts/*.md` を scan する。roster/skills の現行 semantic guard は doctor hard gate と unit/integration tests で fail-close する。

| 検査項目 (inventory §1 / ADR-004 由来) | fail-close 条件 |
|---|---|
| legacy absolute path residue | `.claude/agents/*.md` が `~/ai-dev-kit-vscode/` / `C:\Users\micro` を含む → fail |
| legacy runtime command direct call | subagent 本文に legacy runtime command direct call が残存 → fail |
| `docs/skills/` 空 (curate 未着手) | skill pack が `.gitkeep` のみ → fail (curate 完了を強制) |
| roster ↔ guard allowlist 整合 | `.claude/agents/*.md` の model family と agent-guard allowlist (15) が乖離 → fail |

> **既存 `dependency-drift` (ADR-002) と並置**: gate-design §5 rule registry に `dependency-drift` が既存。内部資産 `asset-drift` を同列追加 (両方 IMP-033 rule)。Current hard gate sliceは legacy path residue / legacy command residue / docs-skills vacancy / guard allowlist missing agent docs を doctor 経路で fail-close 済み。active design/test-design に残った L7 待ち `placeholder_deps` は `placeholder-deps` doctor gate で fail-close する。
>
> **実装証跡 (concept §3.1.3.1、IMP-074)**: asset-drift hard gate は A-116 で実装済み。roster capability resolution は `src/runtime/agent-slots.ts#resolveRosterCapability`、asset catalog / skill recommendation は `src/assets/catalog.ts` / `src/skill-engine/recommend.ts`、stale L7 placeholder の fail-close は `src/lint/placeholder-deps.ts` が担う。
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
| **session-log / forced-stop** | `SessionStart` / `PostToolUse(Edit\|Write\|MultiEdit\|Bash\|PowerShell)` / `Stop` = `bun src/cli.ts session start` / `hook post-tool-use` / `session summary` (判定本体 `src/runtime/session-log.ts` + `forced-stop.ts`)、fail-OPEN (ログ失敗で作業を止めない) | **有効** (IMP-068) |
| **commit-msg hook** | git `commit-msg` hook が Conventional Commits を fail-close 強制 (`feat\|fix\|docs\|...`、.claude/CLAUDE.md / [[project_commit_msg_hook]]) | **有効** |
| **orchestrator-rule parity (Codex)** | Claude Code の hook 強制面 (agent-guard / work-guard / session-lifecycle) を **Codex 側 repo-local `.codex/hooks.json`** へ materialize し、両 orchestrator が同一 guard を機械強制する (PLAN-DISCOVERY-06 spike が ADOPT 判定 → PLAN-L7-139 で実装)。判定本体 = `src/lint/codex-hook-adapter.ts` + work-guard の `src/runtime/work-guard.ts#extractEditTargets` + agent-guard の `src/runtime/agent-guard.ts` (runtime 非依存 pure fn)。**偽パリティ caveat** (literal copy では発火しない): ① Codex `apply_patch` は freeform で `tool_input.file_path` 不在 (パスは patch 本文 → `extractEditTargets` で抽出)、② matcher tool 名差 (`spawn_agent\|spawn_agents_on_csv` / `apply_patch\|write_file` / `exec_command\|local_shell`)、③ `subagent-stop` のみ真の N/A。scope = direct Codex CLI/IDE の repo-local hook (hosted/API runtime の apply_patch は intercept 対象外) | **有効** (repo-local、global `~/.codex/` 書込みなし) |
| その他 hook | PreToolUse(Write/Bash/WebSearch) 等 → package-local `ut-tdd` command | **未有効** (CLI 整備後、目標形は .claude/CLAUDE.md「Target UT-TDD Hooks」) |
| **CI lint** | g1/g3-trace、pair-freeze、plan/vmodel、doctor hard gates を fail-close 実行 | current local gateは既存Bun commandで稼働するmigration debt。targetはsealed Node CLIへ同じ判定を移し、Node parity前に旧gateを削除せず、移行後にBun fallbackを残さない |
| entrypoint | `scripts/ut-tdd` (POSIX) / `ut-tdd.ps1` (Windows) は薄く compiled core を呼ぶだけ (bash ロジック禁止) | ADR-001 §3 |
| 依存隔離 | 外部 service (Claude/Codex/GitHub/Sentry) 起動は **runtime adapter** に隔離、core は正規化 intent のみ発行 | external-if (PLAN-L4-04) で境界契約化 |

## §7 ADR 仕組み (arc42 §9、IMP-023)

L4 方式設計 sub-doc は **ADR を必須 artifact** とする。様式 = arc42 §9 / MADR 準拠。

**ADR テンプレート** (`docs/adr/ADR-NNN-<slug>.md`):

```
# ADR-NNN: <タイトル>
- Status: proposed | accepted | superseded by ADR-MMM
- Date / Deciders / 関連
## 背景     (制約・課題)
## 決定    (採択した方式)
## 検討した代替案  (却下案 + 理由)
## 結果  (+/- 結果、carry)
```

| ADR | 状態 | 扱い |
|---|---|---|
| **ADR-001** | accepted / migration中 | mainのTS/Bun実体をmigration debtとして明記し、targetをTypeScript/Node + compiled ESMへ更新。Node parity前の旧経路削除は禁止 |
| **[ADR-002](../../../adr/ADR-002-dependency-direction-and-auto-map.md)** | **accepted** (2026-05-29) | 依存方向ルール (schema 安定核 + 循環禁止 + fs 隔離) + **依存マップ自動生成・構想 vs 実装 drift lint** (IMP-032)。§3 が設計根拠 |
| **[ADR-003](../../../adr/ADR-003-runtime-adapter-boundary-subscription-cli.md)** | **accepted** (2026-05-29) | runtime adapter 境界 (Anti-Corruption Layer)、**契約プラン CLI/hook 前提・API key 非保持** (A-71 是正を反映)。§6 + external-if §6 が設計根拠 |
| **[ADR-004](../../../adr/ADR-004-internal-asset-ts-control-boundary.md)** | **accepted** (2026-06-01) | 内部資産 (subagent/skill/command) の TS 統制境界 = **層1 資産の中身 markdown 正本 / 層2 管理機構 TS**。TS は生成でなく検証/注入/統制。FR-L1-46〜49 / BR-22 / Recovery PLAN-RECOVERY-01 の設計根拠。real Codex TL 確定 |
| **[ADR-005](../../../adr/ADR-005-distribution-model-and-central-ui.md)** | **accepted** (2026-06-01) | 配布モデル = **GitHub-pull + team server 中央 Web UI**。現行Bun単一バイナリはmigration baseline、target CLIはsealed Node generation。画面+DBは別adapter (`src/web/`、Phase B) |
| **[ADR-006](../../../adr/ADR-006-cli-framework-commander.md)** | **accepted** (2026-06-05) | CLI フレームワーク = **commander** (oclif 却下)。ADR-001 保留の確定 + `src/cli.ts` 実装追認 (§2 注記の floating 解消、IMP-070 resolved) |
| **[ADR-009](../../../adr/ADR-009-resource-kernel-native-custody-companion.md)** | **accepted** (2026-07-22) | Rustをprivileged OS custody companionに限定し、TypeScript domain/policy/journal正本、署名済bundle、SBOM、fail-close、rollbackを固定 |

> ADR-002/003 は PO 承認済 (2026-05-29)、ADR-004/005 は TL 確定 + PO 承認 (2026-06-01)。将来 local↔Web 通信境界 (画面+DB サーバ化、IMP-031) は **ADR-005 (配布+中央UI)** が方針正本、通信は ADR-003 adapter の延長で Phase B に扱う。

## §8 carry → L5 詳細設計 / L6 機能設計

- **module 公開 IF の契約** (Precondition/Postcondition) = L5 D-API / internal-processing で DbC docstring 化 (IMP-014、edge 5-8)
- **runtime adapter の境界契約** = external-if (PLAN-L4-04) で DbC pre/post、L5 D-API へ carry (IMP-018)
- **L7 module closure** (session/telemetry/workflow/review/skill/cutover/adapter) の内部アルゴリズム = L6 機能設計 (IEEE 1016 §5.7 pseudocode、IMP-019) から `src/` 実装と CLI surface へ着地済み。HM/web projection は Phase B 配備範囲
- **ADR-002/003 候補**の起票判断 = G4 前の PO/TL レビュー
- **CI lint 配線** (doctor + lint + test の自動発火) = local gate 実装済み。外部 CI service 配備は infrastructure / ops 配備範囲
- **plan-id-schema lint** (Plan 集約 ID 検証) = 第2弾 lint (IMP-004)
## 2026-06-29 Task-Classify Route 追補

`classifyTask()` は `evaluateRouteCommand` 由来の `signal -> mode` route metadata も surface する。対象は `route.mode`、`route.exit_code`、approval status、escalation boundary である。これにより `ut-tdd task classify` は route-aware な work entry point になる。完全な fail-close routing は引き続き `ut-tdd route eval` と後続の work-entry integration が所有する。

## §9 Node制御面の切替（Issue #152 / #153）

TypeScriptのdomain/control planeはcompiled ESMとしてNode上で自己ホストする。移行状態は
`inventory_frozen → node_shadow → node_primary → bun_removed → sealed`の一方向であり、
各遷移をsubject revisionへ拘束したTypeScript-owned append-only `CutoverTransitionReceipt` chainで証明する。
receiptの唯一のschemaは`schema_version`、`registry_id`、`transition_id`、`sequence`、`subject_revision`、
`previous_state`、`current_state`、`evidence_set_digest`、`review_digest`、`admission_digest`、
`previous_receipt_digest`、`receipt_digest`である。全edgeのfresh review/admission digestは非nullで、
対応registry rowのevidence receipt `receipt_digest`とexact一致する。
非隣接、skip、reverse、replay、chain不一致をfail-closeする。状態projectionはvalidated chainから再構築する。
genesisはnull previous fieldsとinventory evidence+review/admissionを持ち、空chainは`uninitialized`で開始不可とする。
F0a/F0b/F0c receiptは各producer commitをsubjectとし、node_shadow candidate HEADが全commitのdescendantである
closureを検証する。transition receipt自体はcandidate HEADをsubjectにする。
genesisはsequence 0/head null、通常appendはlatest+1とexpected head一致を要求し、exclusive lock内CASで
receipt+evidenceをatomic appendする。fork、double genesis、CAS loser、partial appendを拒否する。
slice admissionはD0→F0a→F0b→F0c→Q0のtyped一方向FSMとし、各candidate commitのmerge admissionが
直前sliceの成功receiptを要求する。edit-start自己gateにはしない。
review+admission済みD0 draft下で許可するのは順序内の非activation build/verifyとQ0 fixture/detector workだけであり、
production activation、hook/runtime switch、Bun final deletion、cutoverはconfirmed L6+D0 admissionまで禁止する。
zod SSoTは`src/schema/cutover-transition.ts` / `src/schema/node-slice-admission.ts`、runtimeは
`src/runtime/cutover-transition.ts` / `src/runtime/node-slice-admission.ts`、pair testは
`tests/cutover-transition.test.ts` / `tests/node-slice-admission.test.ts`へ固定する。
Node parity前に旧Bun経路を削除せず、
`node_primary`後にBun、bunx、tsx、TS直実行、shellへfallbackしない。

build imageはexact Node/npm pin、review済みlock graph、external dependency closure、compiled digestを
封印し、generation単位で原子的に公開する。Linux/WindowsのNode bootstrap legと既存Linux/Windows
harness legを最終aggregateがAND集約し、skip、欠測、別HEAD、別generationをGreenにしない。
Issue #153は継承main負債2件だけを限定する一時envelopeであり、candidate固有のreceipt、review、
Node matrix、aggregate failureを免除しない。Resource Kernel / Rust companionは別D0-R sliceで扱う。
D0-N candidateのreview/admission欠落も免除対象外で、merge前修復を要求する。

F0bのatomicityはprocess-crash境界で、`dist/node-publish.lock/`のglobal exclusive publish lease下のappend-only markerにより
旧completeまたは新complete generationだけを選ぶことを意味する。power-loss durabilityとは区別し、
Windows Node-only F0bでは最新markerの永続化完了も旧markerの存在も保証しない。power loss後に検証可能な
complete markerが1件以上あれば最大sequenceを選び、0件ならfail-closeする。
power-loss durable activationはResource Kernel bundle側trust floorへ委譲するが、D0-R未着地をF0の
process-crash atomicity blockerにはしない。F0bではgeneration自動GCを禁止する。

## §10 リソースカーネルのネイティブカストディ（Issue #152 D0-R）

Resource Kernelは、process tree、CPU・memory・process・output budget、deadline、orphan zeroを
OS強制境界で保証する。TypeScript control planeは`ExecutionSpec`、policy、journal、receiptを所有し、
Rust companionはWindows Job ObjectまたはLinux cgroup v2へのprivileged custody操作だけを実行する。
責務を両言語へ重複実装せず、capability probe、durable journal append、sealed admission token、
managed workload生成の順序をbarrierとして固定する。wire commandは`Probe | Execute | RecoveryCustody`のclosed unionとし、
生成・attach・resumeはtoken必須の`Execute`だけに閉じる。`RecoveryCustody`はauthority leaseで既存custodyを
observe/terminate/prove-empty/shutdownできるが、launcher、managed-root生成、resumeへ型として到達できない。
`create_custody`が返すleaseをattach/resumeでも照合し、token真正性は抽象`AdmissionTokenAuthenticatorPort`で検証する。
deadlineはwall sealからmonotonicへ開始時に一度だけ縮小変換し、broker/authority API/recovery supervisorとは独立した
durable deadline executorをmanaged root生成前にarmする。

D0-R merge scopeはresource budget、process-tree custody、capability、terminal receipt、signed companion bundleに
限定する。DB incremental rebuild、single-flight、snapshot CAS、hook/doctor/local CI横断のqueue/headroom admissionと
performance convergenceは要件を維持したままIssue #152 later performance/control-plane waveへdeferし、D0-Rの
merge gateへ含めない。後続waveは本custody境界を利用するが、D0-RがDB/CAS/local CI policyやNode generation/activationを
再所有したとは扱わない。

配布単位はtarget別companion、versioned protocol descriptor、SBOM、署名、D0-N generation receipt参照を
同一revisionへ束縛した署名済companion bundleとする。Node control plane/runtime/core/generation/activationは
D0-N正本を参照し、D0-R bundleへ含めない。
manifest、binary digest、protocol、target、SBOM、署名のいずれかが不一致ならcontrol processまたは
managed root生成前にfail-closeする。L4受入は同一attemptのL9 `ST-RGK-*` receiptだけで判定し、
検出器のskip・警告化・soft limitへの縮退によって設計契約を下げない。
trust判定はbundle外のversioned installer/release policyを読む`TrustDecisionPort`へ集約し、署名対象は
companion digest、protocol descriptor、SBOM、target、sequence、D0-N generation receipt digestを含むcanonical manifest全体とする。
TS側は`bundle_sequence + manifest_digest + trust_decision_digest + d0n_generation_receipt_digest`の
accepted factをdurableにcompare-and-advanceする。PKI rotation、secure clock、re-anchor、物理storeはD0-Rで固定せず、
port欠測、floor未満、同sequence別payloadはfail-closeする。
global Bun cutoverはPR #154 D0-Nのprerequisiteであり、D0-Rはnative差分のBun依存増分0だけを所有する。

Linuxのmanaged rootは、broker自身ではなくbroker外のdurable deadline ownerへ
`attempt_id + custody_nonce + cgroup identity + absolute deadline`を開始前commitする。system manager transient
scope/timerまたは同等のkernel-backed supervisorが、brokerと通常のuser-space recovery supervisorのdual-crash後も期限内に`cgroup.kill`を発行し、
bounded recovery内に再起動broker/subreaperが`populated=0`、zombie 0、managed orphan 0まで閉じる。
このowner・kill・reapを強制不能なら開始前に拒否し、証拠欠測をfail-close findingへ変換するだけでは代替しない。
