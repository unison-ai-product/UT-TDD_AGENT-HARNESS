---
layer: L6
sub_doc: function-spec
status: draft
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-01-function-spec.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: module 公開 IF = [module-decomposition.md](../L5-detailed-design/module-decomposition.md) / DbC pre-post-invariant = [internal-processing.md](../L5-detailed-design/internal-processing.md) §3-§5 / 型の単一正本 = `src/schema/` / pseudocode 標準 = [document-system-map](../../../governance/document-system-map.md) §1 (IEEE 1016 §5.7)。本 doc は公開 IF に **関数 signature + アルゴリズム pseudocode + 型設計 + WBS** を付与する (L6、IEEE 1016 §5.7)。
>
> **V-pair**: `pair_artifact = L7-unit-test-design.md` (L6↔L7)。DbC 契約から単体テスト oracle (U-*) を導出 (document-system-map §3)。
> **class-design 縮退**: UT-TDD core は非 OOP (関数 + zod 値オブジェクト)。型/値オブジェクト設計は本 doc §3 に統合 (PLAN-L6-00 §2、G.13 line 547)。
> **edge 引き渡し**: 各関数の `@edge-*` docstring per-function 確定は [edge-case.md](./edge-case.md) が担当 (IMP-014)。

# UT-TDD Agent Harness — L6 機能設計: 関数仕様 (Function-Spec)

module-decomposition の公開 IF に**関数 signature・pseudocode・型・WBS** を付与する (PLAN-L6-01)。**G6 = 機能設計凍結点** (gate-design §1) の凍結対象を本 doc が確定し、L7 実装の正本 (parent_design) となる。

## §1 関数 signature 表 (実装済 module、module-decomposition §2 と 1:1)

> 詳細型は `src/schema/` を正本とし参照。pre/post は internal-processing §3/§4 への参照。

### §1.1 lint (共通様式 `loadX` / `analyzeX(docs?)`)

| 関数 (実 export、src/lint/) | signature | pre (§3) | post (§4) |
|---|---|---|---|
| `analyzeG3Trace` | `(docs?: DocSource) => G3TraceResult` | docs 省略時 fs 読込可 | `orphans[] == [] ⟺ ok`、totals 全 > 0 |
| `analyzeEntityCoverage` | `(business?: string) => EntityCoverageResult` | 同上 | primary⊇derived 整合、totals > 0 |
| `analyzeFrRegistry` | `(docs?: FrDocSource) => FrRegistryAuditResult` | 同上 | 漏れ 5 型 == 0 で ok |
| `analyzeDocConsistency` | `(docs?: DocConsistencySource) => DocConsistencyResult` | 同上 | carry/screenId/nfr 違反 == 0 で ok |
| `analyzeImprovementBacklog` | `(md?: string) => ImprovementBacklogResult` | 同上 | IMP 形式/status/候補 enum 妥当で ok |
| `loadDocs` / `loadBusiness` / `loadFrDocs` / `loadDocConsistencyDocs` / `loadBacklog` | 各 `() => DocSource \| string \| FrDocSource \| DocConsistencySource \| string` (lint 別、統一型なし) | repo doc path 解決可 | 副作用 = fs read のみ (write なし) |

> 共通 invariant: `analyzeX` は純粋関数 (同入力→同出力、FR-05 決定論)。`loadX` が唯一の fs 端点 (module-decomposition §4)。**引数/戻り型は lint ごとに固有** (統一 `XSource` 型は存在しない。実 export 名・型は `src/lint/*.ts` を正本)。

### §1.2 runtime

| 関数 (実 export、src/runtime/) | signature | pre | post |
|---|---|---|---|
| `detectMode` | `() => RuntimeDetection` | (前提なし) | `mode ∈ {standalone,claude-only,codex-only,hybrid}`、副作用なし |
| `normalizeModelFamily` | `(raw: string \| null \| undefined) => ModelFamily \| null` | — | family ∈ {opus,sonnet,haiku} or `null` (判定不能・曖昧は fail-close) |
| `evaluateAgentGuard` | `(input: AgentGuardInput, ctx: AgentGuardContext) => GuardDecision` | input.subagent_type 存在 / ctx に `resolveAgentFamily` + `allowRaw` 提供 | `decision.code ∈ {0,2}` を**返す**。`code=2` の exit 実行は hook shim (`.claude/hooks/agent-guard.ts`) の責務 — 本関数は純粋 (process.exit しない)。bypass は `bypassed=true` + message warn |
| `resolveActivePlan` / `recordEvent` / `compressPlanDigest` / `onStop` (session-log) | `session-log.md §3` 参照 | — | **fail-OPEN** (常に 0、guard と逆)。`compressPlanDigest` は純関数・idempotent。詳細は `session-log.md` (PLAN-L6-03 add-design 差分) |

### §1.3 schema / plan / vmodel / doctor

| 関数 | signature | pre | post |
|---|---|---|---|
| `frontmatterSchema.parse` | `(data: unknown) => Frontmatter` | — | zod 妥当 or throw ZodError |
| `lintPlan` | `(path?: string) => LintResult` | path 省略時カレント | `{ok, messages[]}`、state 不変 (read-only) |
| `lintVmodel` | `(path?: string) => LintResult` | 同上 | 12 edge 照合、孤児で ok=false |
| `runDoctor` | `() => LintResult` | detector/lint の読む doc 解決可 | 全 detector 集約、error≥1 で ok=false/exit 1 |

## §2 core 操作の pseudocode (IEEE 1016 §5.7、IMP-019)

> internal-processing §2 の処理フローをアルゴリズム化。L7 実装の正本。共通骨格 = `入力 → zod validate → state 読込 → 処理 → state 書込 → 出力/exit` (副作用は cli/hook 端点)。

### §2.1 `plan draft` (FR-01)

```
function planDraft(input):
  assert input.title != ""                       # pre (§3)
  assert input.kind in VALID_KINDS
  assert input.layer in VALID_LAYERS
  if input.kind == "design" and input.layer in L1..L6:
    assert input.subDoc is provided              # G.1
  fm = buildFrontmatter(input)
  validated = frontmatterSchema.parse(fm)        # throw → fail-close
  if registry.has(validated.plan_id):
    error("plan_id 重複", FR-01); exit 1
  path = resolvePlanPath(validated)              # §1.10 line 418 規約
  # 原子性 = tmp file + rename (失敗時 file 不変)
  tmpPath = path + ".tmp"
  write(tmpPath, render(validated))
  rename(tmpPath, path)                          # post: 原子的 publish
  registry.add(validated.plan_id, path)
  exit 0
```

### §2.2 `gate <G-ID>` (FR-05、決定論 = AI 呼ばない)

```
function runGate(gId):
  assert gId in G0.5..G14                         # pre
  assert phase.priorGatesPassed(gId)              # V-model 順序 (FR-13)
  checks = loadGateChecks(gId)                    # gate-checks.yaml
  results = []
  for check in checks:                            # 決定論実行のみ
    results.append(check.run())                   # 純粋判定 (no AI)
  status = all(results.ok) ? "passed" : "failed"
  phase.gates[gId].status = status               # post: 証跡
  appendGateRun(gId, results)
  exit status == "passed" ? 0 : 1
```

### §2.3 `trace check` (FR-03)

```
function traceCheck(planId):
  plan = registry.get(planId)                     # pre: 存在
  assert plan.generates is not empty
  artifacts = resolve4Artifacts(plan)             # 設計/実装/テスト設計/テスト
  edges = checkBidir12(artifacts)                 # 双方向 12 edge
  orphans = edges.filter(e => not e.resolved)
  report(edges, orphans)
  exit orphans == [] ? 0 : 1                       # post: fail-close
```

### §2.4 `sprint check` (FR-02、TDD Red-first)

```
function sprintCheck(target):
  assert L6.functionDesignFrozen()                # pre: G6 通過
  redCommit = findRedTestCommit(target)
  greenCommit = findBodyCommit(target)
  assert redCommit.precedes(greenCommit)          # Red-first 順序
  recordTddTrace(redCommit, greenCommit)          # post
  exit ordered ? 0 : 1
```

## §3 型 / 値オブジェクト設計 (class-design 縮退統合)

> UT-TDD は非 OOP。型は zod schema (`src/schema/`) を単一正本とし、本節は L6 で確定する**追加型**のみ。

| 型 | 種別 | 定義 (実 src を正本) | carry |
|---|---|---|---|
| `SubDoc` | 値オブジェクト (zod enum) | §1.10.G.1 VALID_SUB_DOCS の層別 enum。値 = L1:[business,functional,screen,technical,nfr] / L2:[screen-list,screen-flow,wireframe,ui-element] / L3:[business-requirement,functional-requirement,nfr-grade] / L4:[architecture,function,screen,data,external-if] / L5:[internal-processing,module-decomposition,physical-data,if-detail] / L6:[function-spec,class-design,edge-case] | IMP-026 (L7 実装、未) |
| `PlanId` | 値オブジェクト (zod regex) | **現行** = `src/schema/frontmatter.ts:28` `^(PLAN-\d{3}(-[a-z0-9-]+)?\|PLAN-MM-\d{3})$`。**IMP-004 で層別拡張予定** (`PLAN-L<N>-NN` 形式を許容、L7) | IMP-004 (L7、現行値が G6 凍結対象) |
| `RuleType` | 判別共用体 (discriminated union) | `{ id: "pair-exists" \| "ref-resolves" \| "trace-bidir" \| "upstream-coverage" \| "count-matches" \| "id-format" \| "dup-id" \| "glossary-delta" \| "dependency-drift" \| "backlog-format" }` (discriminant = `id`、§4) | IMP-033 (L6 本 doc §4) |
| `GuardDecision` | interface (実装済、`src/runtime/agent-guard.ts:55`) | `{ code: 0 \| 2, message?: string, bypassed?: boolean }` (exit code を返すのみ、block boolean は持たない) | 実装済 |
| `RuntimeDetection` | interface (実装済、`src/runtime/detect.ts:10`) | `{ mode: ExecutionMode, claude: boolean, codex: boolean, currentRuntime: "claude"\|"codex"\|null, availableRuntimes: string[], missingRuntimes: string[] }` | 実装済 |
| `LintResult` | interface (実装済、`src/plan/lint.ts`) | `{ ok: boolean, messages: string[] }` | 実装済 |

> 値オブジェクト不変条件 = zod schema が parse 時に保証 (internal-processing §5 invariant「state は zod 妥当のみ永続化」の型レベル写像)。クラス階層は導入しない (依存方向 = schema 安定核、module-decomposition §4)。**実装済型は実 src 定義を正本とし、本表はその写し** (発明禁止)。

## §4 IMP-033: クロスチェックエンジン rule 型 (gate-design §5)

> 自動追加型クロスチェック (gate-design §4) の rule registry を構成する 10 型。各 rule = 純粋関数 (FR-05 決定論)。doc registry (frontmatter scan) が enroll、gate binding が G_N へ束ねる。

### §4.1 共通 signature

```
type Rule = (registry: DocRegistry, params: RuleParams) => RuleResult
type RuleResult = { ruleId, ok: boolean, violations: Violation[] }
```

### §4.2 10 rule 型 (signature + 1 行 pseudocode)

| # | rule 型 | signature 概要 | pseudocode 要旨 |
|---|---|---|---|
| 1 | `pair-exists` | `(reg, {layer}) => RuleResult` | 設計 doc に対応する pair (テスト設計) doc が存在するか |
| 2 | `ref-resolves` | `(reg, {field}) => RuleResult` | frontmatter の path 参照 (requires/pair) が repo 内に実在 |
| 3 | `trace-bidir` | `(reg, {from,to}) => RuleResult` | A→B 参照に対し B→A 逆参照が存在 (孤児 0) |
| 4 | `upstream-coverage` | `(reg, {childLayer,parentLayer}) => RuleResult` | 下流 ID が上流 ID で全被覆 (FR↔BR 等) |
| 5 | `count-matches` | `(reg, {declared,actual}) => RuleResult` | §0 件数宣言 = 実カウント (ドリフト検出) |
| 6 | `id-format` | `(reg, {pattern}) => RuleResult` | ID が regex 規約に従う (PlanId/FR-ID 等) |
| 7 | `dup-id` | `(reg, {idKind}) => RuleResult` | ID 一意 (重複 0) |
| 8 | `glossary-delta` | `(reg) => RuleResult` | per-工程の用語更新が glossary に反映 (G.9) |
| 9 | `dependency-drift` | `(reg, {expectedMap}) => RuleResult` | 実 import グラフ = 期待依存マップ (ADR-002/IMP-032) |
| 10 | `backlog-format` | `(reg) => RuleResult` | IMP-NNN 形式 + status/候補 enum 妥当 |

> 既存 5 lint (g3-trace/entity-coverage/fr-registry-audit/doc-consistency/improvement-backlog) は上記の rule インスタンスとして吸収 (gate-design §5)。auto-enroll = doc registry が新 doc の frontmatter (layer/sub_doc/pair_artifact) を scan し該当 rule を自動適用 (手書き lint 不要)。

### §4.3 auto-enroll pseudocode

```
function buildCoverageMap():
  registry = scanFrontmatter(docs/**)            # doc registry
  for doc in registry:
    rules = matchRulesByMetadata(doc)            # layer/sub_doc → 適用 rule
    for rule in rules:
      coverage[doc][rule] = rule(registry, paramsFor(doc))
  bindToGates(coverage)                          # gate binding (G_N)
  return coverage                                # 構造軸 = engine、意味軸 = self-review
```

## §5 WBS (関数群 → L7 実装 Sprint、G6 WBS 要件)

| Sprint | 対象関数群 | 依存 | 状態 |
|---|---|---|---|
| **L7.1** | schema 拡張 (`subDocSchema` IMP-026 / `planIdSchema` 層別 IMP-004) | — (安定核) | 未 |
| **L7.2** | `lintPlan` 本実装 (stub → frontmatter validate) | schema | stub→本 |
| **L7.3** | `lintVmodel` 本実装 (12 edge trace) | schema | stub→本 |
| **L7.4** | `runDoctor` 統合 (5 lint + state 突合) | lint 群 | scaffold→本 |
| **L7.5** | rule engine 10 型 + auto-enroll (IMP-033) | schema/lint | 未 |
| **L7.6** | dependency-drift lint (knip/madge、ADR-002/IMP-032) | runtime | 未 |
| **L7.7** | 未実装 module (workflow/session/cutover 等) | schema | 未 (後続 PLAN 分割可) |

> 各 Sprint = TDD Red-first (L7 entry、§1.10 line 671)。先行 ④ 単体テストコードは L7 単体テスト設計 (pair) の U-* に対応。

## §6 carry → edge-case (L6) / L7 実装

- 各関数の `@edge-*` docstring per-function 確定 = [edge-case.md](./edge-case.md) (IMP-014、internal-processing §7 枠を展開)
- signature の TS 実体化 + DbC docstring 転記 = L7 (parent_design = 本 doc)
- pseudocode (§2/§4.3) の実装 = L7 各 Sprint
- DbC → U-* test oracle 導出 = L7 単体テスト設計 (pair、document-system-map §3)
- **G6 freeze**: 本 doc の signature + pseudocode + 型 + WBS を G6 で凍結 (L7 の parent_design 正本)
