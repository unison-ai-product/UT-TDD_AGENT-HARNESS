---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_module_drift
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-06-08
plan: docs/plans/PLAN-L6-15-module-drift.md
---

> **L6 contract marker**: `parseListedModules`, `scanActualModules`, `analyzeModuleDrift`, `loadModuleDocs`, and `moduleDriftMessages` は unit-test 粒度の contracts とする。DbC pre/post は §2-§3 に置く。L7 oracle family: U-MDRIFT-001..005.

# module-drift lint — 機能設計 (① / PLAN-L6-15、IMP-075)

> **V-pair**: `pair_artifact = L7-unit-test-design.md §1.16` (L6↔L7)。DbC 契約から単体テスト oracle (U-MDRIFT-*) を導出。

## §0 スコープ

**「architecture §3.1 building block 集合 ⊇ `src/` 実在 module」の包含 drift を機械検査** (IMP-075)。

背景: A-103 (L4 見直し) で handover/setup/web/lint が「実装済かつ設計 doc が将来扱い」の back-fill 漏れ (= harness 自身が [[feedback_impl_must_backfill_to_design]] を L4 で破った) を **手動監査**で発見した。柱 2「doc×機械厳格化」「柱 3 自動化で state 管理」に照らすと、impl→design back-fill 漏れ (meta-drift) を手動 audit に頼るのは under-design。本設計は **`src/` 実在 module がすべて architecture §3.1 に列挙されているか** (actual ⊆ listed) を doctor hard gate で検査する純関数 lint を定義する。

**スコープ外**:
- **逆向き (listed ⊋ actual = 将来 module)**: 設計が web/roster/skills 等を「将来」列挙し src 未実在は drift ではない (宣言済 carry)。検査しない。
- **asset-drift (internal asset cutover / FR-L1-49)**: 現在の slice は enrolled internal assets (`.claude/agents`, `.claude/agent-memory`, `docs/skills`, `docs/templates/prompts`) 向けの separate doctor hard gate として実装する。Full roster/skills dependency semantics は本 module-drift lint の外の future work とする。
- **import グラフ drift (循環/逆依存)**: ADR-002/IMP-032 (knip/madge) の別 PLAN。本 lint は module **集合の包含**のみ。

## §1 入力 (設計 listed / 実在 actual)

- **listed**: `docs/design/harness/L4-basic-design/architecture.md` の §3.1 表 1 列目 `**name**` building block 名。
- **actual**: `src/` top-level の **dir 名** + **top-level `*.ts` の basename** (`cli.ts` → `cli`)。

## §2 純関数 (parse / analyze)

```text
parseListedModules(architectureText: string) -> string[]
scanActualModules(srcDir: string) -> string[]
analyzeModuleDrift(docs: { listed, actual }) -> { orphans, listedCount, actualCount, ok }
```

- **parseListedModules**:
  - **Precondition**: architecture.md 全文。
  - **対象切り出し**: `§3.1` 見出し〜次見出し (`§3.2` 等) に限定 (§3.2 代表 module の太字を巻き込まない、過検知回避)。
  - **抽出**: 表行 1 列目 `^\|\s*\*\*([a-z][a-z0-9_-]*)\*\*` のみ。重複排除。
  - **Postcondition**: §3.1 不在 → `[]` (パース失敗を空虚 ok にしない、§3 で listedCount 0 検出可)。
- **scanActualModules**:
  - dir + top-level `*.ts` を module 名に正規化、sort + 重複排除。
- **analyzeModuleDrift**:
  - **Postcondition**: `orphans = actual \ listed` (実在だが未列挙)。`ok = orphans.length===0`。`listedCount/actualCount` は非空虚ガード用。

## §3 I/O loader と messages

- `loadModuleDocs(repoRoot)`: architecture.md を読み `parseListedModules`、`src/` を `scanActualModules` → `{ listed, actual }`。
- `moduleDriftMessages(result)`: orphan 0 → `"OK (… 孤児 0)"` / orphan あり → 件数 + module 列 + 「設計 doc へ back-fill (impl→design)」+ `[[feedback_impl_must_backfill_to_design]]`。

### §3.1 FR asset-drift alias（別名）

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `analyzeAssetDrift` | analyzeAssetDrift(input: AssetDriftInput) => AssetDriftResult | enrolled agent/agent-memory/skill/prompt docs と guard allowlist を与える。isolated fixture で root がない場合は unrelated check を fail させず skip する。 | legacy source path residue、legacy runtime delegation command residue、legacy runtime name residue、empty docs-skills、agent docs と一致しない guard allowlist entry を violation として返す。 | asset-drift は module-drift と別だが、同じ finding/back-fill feedback loop に流す。prompt body と secret は persist しない。 | U-FR-L1-49 / U-ASSETDRIFT-001..007 |
| `analyzeChangeImpact` | analyzeChangeImpact(input: ChangeImpactInput) => ChangeImpactResult | current change set file path を与える。 | `src/**` change に同一 change set 内の design PLAN/doc update または test/test-design update がない場合、`missingDesign` または `missingTest` を返す。 | source change は design back-fill や test evidence を silent bypass できない。documentation-only change は source test を要求しない。 | U-CHGIMPACT-001..004 |
| `analyzeL14CloseAudit` | analyzeL14CloseAudit(docs: L14CloseAuditDoc[], repoRoot?: string) => L14CloseAuditResult | `.ut-tdd/audit/A-143-l14-close-system-foundation-audit.md` を L14 close audit source として与え、evidence path は repo-relative とする。 | expected item 欠落、malformed row、unknown status value、evidence path 欠落、item-specific evidence 欠落、item-specific boundary marker 欠落、gap なし partial row、next action なし open boundary row に対する parsed audit row と violation を返す。item-specific required evidence は workflow definition、system foundation、Claude/Codex parity、clean distribution package、version-up nonbreaking、brownfield onboarding、cross-project workflow、L1/L2 mock roundtrip、L10 UX close、drive-model bookbinding、green evidence integrity を覆う。明示引用時は `.claude/`、`.codex/`、`LICENSE`、adapter template、CI workflow、`.ut-tdd/evidence` path を valid evidence root とする。Pack tag / GitHub Release が実行済みの後は、release publication boundary の必須 gap marker を「signed tarball signature」に縮退し、古い「tag push 未実施」を要求し続けない。 | L14 close は prose や local green command だけでは主張できない。workflow definition、L10-L14 boundary、distribution、brownfield onboarding、version-up、cross-project test、L1/L2 mock feedback、release publication boundary、parked version-up work、green evidence correction evidence は明示的な machine-checked row として残す。公開済み tag/release は実績として記録するが、署名・UAT・post-release telemetry が無い限り full release close にしない。 | U-L14CLOSE-001..008 |
| `analyzeCodingRules` | analyzeCodingRules(docs: CodingRulesDoc[], policy?: CodingRulesPolicy, workflowDocs?: CodingWorkflowDoc[]) => CodingRulesResult | TypeScript source/test docs、coding-rule SSoT、workflow placement docs を与える。 | explicit `any`、TS/lint suppression comment、kebab-case / kebab-case `.test.ts` / `index.ts` 外の TS file name、引数 3 個超の source function、empty/rethrow-only catch block、module-boundary drift、machine-surface language drift、SSoT policy drift、workflow anchor 欠落を violation として返す。 | coding rule は requirements-level SSoT かつ workflow artifact である。test は no-any/suppression/naming check を保持し、max-params / structured-error / module-boundary は `src/**` に適用する。CLI/doctor/lint/gate decision token は、周囲の prose が日本語でも ASCII のままにする。 | U-CODE-001..010 |
| `analyzeDddTddRules` | analyzeDddTddRules(input: DddTddInputs) => DddTddResult | DDD/TDD rule SSoT、workflow docs、source/test docs、PLAN docs、L7/L8 test-design docs を与える。 | policy drift、workflow anchor drift、domain-boundary import、invariant oracle gap、Red-first evidence 欠落、weak test oracle、integration GWT 欠落を violation として返す。 | quantitative check は qualitative review と分離する。ただし freeze-significant point は test evidence と reviewer evidence の両方を要求する。 | U-DDDTDD-001..009 / U-FR-L1-50 |

### Cross-Artifact Relation Graph 追補 (A-124/A-125 / PLAN-L6-31)

この追補は cross-artifact graph と verification-profile projection の L6 function-design entry である。PLAN-RECOVERY-03 が露出させた design gap を閉じる。これら contracts が L7 unit oracles と L7 implementation PLAN で覆われるまで、relation graph source code は authorized ではない。

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `collectRelationGraphProjection` | collectRelationGraphProjection(input: RelationGraphSourceSet) => RelationGraphProjection | docs、source paths、tests、PLAN metadata、audit records、verification evidence paths を text/metadata fixtures として供給する。missing optional roots は明示的な empty sets とする。 | requirements、PLANs、design docs、test-design docs、source files、tests、DB tables、verification profiles、external tools、diagrams、findings の normalized nodes / edges を返す。 | graph は rebuildable projection であり authoring source ではない。projection rows は raw MCP responses、browser traces、screenshots、provider transcripts、secrets、credentials を copy しない。 | U-RELGRAPH-001..003 |
| `analyzeRelationImpact` | analyzeRelationImpact(input: RelationImpactInput) => RelationImpactResult | changed path と graph projection を与える。changed path は repo-relative かつ normalized とする。 | directly changed node、impacted upstream/downstream node、required follow-up action、missing design/test/DB/evidence coverage の finding を返す。 | lower-layer change は reverse/backprop action を要求し得る。docs-only change は graph が behavioral contract と mark しない限り source test を要求しない。 | U-RELGRAPH-004..006 |
| `exportRelationDiagram` | exportRelationDiagram(snapshot: RelationGraphSnapshot, format: "mermaid" \| "dot" \| "d2") => DiagramArtifact | graph snapshot と requested format を与える。Mermaid は常に利用可能、DOT/D2 は installed tooling で gate される optional adapter とする。 | stable node ID と edge label を持つ deterministic diagram text を返す。利用できない optional adapter は implicit tool invocation ではなく finding を返す。 | diagram export は review/handover の evidence であり、source doc や DB state を mutate してはならない。 | U-RELGRAPH-007..008 |
| `collectVerificationEvidenceProjection` | collectVerificationEvidenceProjection(input: VerificationEvidenceRecord[]) => VerificationProfileProjection | `.ut-tdd/evidence/verification-profiles/*.json` の saved A-125 evidence record を schema validation 後に与える。 | evidence path 付きの `verification_profiles`、`verification_recommendations`、`mcp_server_runs`、`external_tool_findings` projection row を返す。 | external execution は opt-in のままにする。projection は raw external payload ではなく summary と classification を保存する。 | U-RELGRAPH-009..010 |

**PLAN `generates` の実在境界（#1168、未実装の目標契約）**: relation graph は既存どおり PLAN metadata を読み込み、projection を再構築する。完了を主張する PLAN (`confirmed` / `completed` / `accepted`) に記載された `generates` path が現在の checkout に存在しないことだけを理由に、missing-artifact / stale-edge finding を返したり graph を fail にしたりしない。この退役は `generates` の実在確認だけに限る。loader / projection 自体と、他の relation edge に対する stale 検知および missing-projection の fail-close は維持する。PLAN の lifecycle、status field、path 例外は追加しない。

**必須 impact classes**:

- source の影響先 -> sibling test、L6 design contract、L7 oracle、PLAN、reverse/backprop guard。
- design/test-design の影響先 -> paired artifact、PLAN DoD、trace-freeze evidence。
- physical-data / DB projection docs の影響先 -> DB table nodes、rebuild contract、upstream requirement/ADR nodes。
- verification-profile evidence の影響先 -> external-tool profile、MCP server/tooling decision、evidence path、sanitized finding rows。
- diagram export -> stale-source detection 付き review/handover artifact。

**workflow guard**: PLAN-L6-31 が L7 oracle coverage を持ち、PLAN-L7-32 が TDD Red entry を持つ前に `src/**` relation-graph source を作成した場合、その変更は valid implementation shortcut ではなく Recovery event とする。

### tool adapter probe 追補 (A-124 / PLAN-L6-33)

この追補は optional graph/diagram development-tool adapters の L6 contract を定義する。core relation graph collector とは分離する。adapters は evidence quality を高められるが、TypeScript/Node collector と DB projection が gate-normalized truth の source であり続ける。

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `catalogToolAdapters` | catalogToolAdapters(input: ToolAdapterCatalogInput) => ToolAdapterCatalogResult | researched adapter metadata、package refs、executable names、trigger signals、output formats を与える。 | dependency-cruiser、Knip、Madge、Graphviz DOT、Mermaid、D2 の deterministic adapter profile を返す。 | adapter は optional であり、declared/available になるまで disabled とし、authoring source にはできない。 | U-TOOLADAPTER-001..002 |
| `probeToolAdapter` | probeToolAdapter(input: ToolAdapterProbeInput, deps: ToolAdapterProbeDeps) => ToolAdapterProbeResult | adapter profile、package metadata、executable check、workspace scope を与える。 | install や destructive action を実行せず、package/executable/config/scope の readiness check を返す。 | adapter availability 欠落は silent pass や unrelated check failure ではなく finding とする。 | U-TOOLADAPTER-003..005 |
| `normalizeToolAdapterRun` | normalizeToolAdapterRun(input: ToolAdapterRunEvidence) => ToolAdapterProjection | raw adapter evidence path、command、exit code、version、scope、parsed output summary を与える。 | normalized `tool_runs`、`dependency_edges`、`diagram_artifacts`、`findings` row を返す。 | raw DOT/JSON/SVG/Mermaid/D2 output は evidence として残す。gate は normalized projection row だけを消費する。 | U-TOOLADAPTER-006..008 |
| `planDiagramRefresh` | planDiagramRefresh(input: DiagramRefreshInput) => DiagramRefreshPlan | graph snapshot digest、existing diagram artifact、requested format、adapter readiness を与える。 | Mermaid/DOT/D2 diagram artifact に対する refresh/mark-stale/no-op action を返す。 | stale diagram は current review evidence として扱えない。optional renderer 欠落は finding を返す。 | U-TOOLADAPTER-009..010 |

#### tool adapter のスコープ改訂 (IMP-131、PO 2026-06-10) — 未実装の目標契約

上表の `catalogToolAdapters` / `probeToolAdapter` / `normalizeToolAdapterRun` / `planDiagramRefresh` は `src/lint/tool-adapter.ts` の現行実装 (adapter catalog + probe) の契約である。これに対し、PO 決定 (IMP-131、`docs/improvement-backlog.md`) は tool adapter (dependency-cruiser / Knip / Madge / Graphviz DOT / Mermaid / D2) を **gate truth でない insight 系**と位置づけ、harness core の profile catalog としてモデル化せず次の形へ降格する方針である。この降格は未実装であり、以下は**未実装の目標契約**である。

- `ut-tdd setup graph-tools [--with <adapter,...>]` の一括セットアップコマンドを置く。冪等で、`--with` で dependency-cruiser / knip / madge / graphviz / mermaid / d2 から選んで導入する。生成する config は git 秘匿の外に置き、§6.8.10 の安全則 (secret・利用者固有の global mount を commit しない) を踏襲する。first slice は dependency-cruiser + Knip + Mermaid とし、Madge / DOT / D2 は conditional とする。
- layer-context が、関連する V-model 工程で導入手順をアナウンスする。
- adapter 出力の DB 正規化は、project が setup で opt-in したときだけ薄く配線する。未導入を前提に gate を組まない。adapter ごとの probe / normalize / findings / 優先順位を core に持たない。
- MCP / verification profile (playwright / testcontainers / github-mcp / msw / mcp-inspector / vitest-browser) は gate を支える検証 (must-tool 系) であり、この降格の対象外として profile と機械着地を維持する (`function-spec.md` の MCP profile config / safety 追補)。

現状との差: 上の setup + announce への置き換えは PO 決定 (IMP-131) で確定済みの目標契約であり、採否は未決ではない。`src/` には `setup graph-tools` がまだ無く (`src/setup/` と `src/cli.ts` に該当なし)、`tool-adapter.ts` の catalog 実装は移行前の実装である。未実装なのは目標契約の実現であり、実現時に catalog 実装を置き換える (証跡: `docs/migration/plan-design-migration-evidence/backflow-s6e.md`)。

### Coding Rules 追補

- **coding-rules**: requirements `Coding Rules SSoT` から `src/lint/coding-rules.ts` へ落とす TS core 規約。explicit `any`、TS/lint suppression comment、TS file-name drift、source max-params drift は doctor hard failure。
- **workflow placement**: Forward L6 と Add-feature `add-design` は implementation freeze 前に `docs/governance/coding-rules.md` を確認または更新する。workflow docs は `CODING-RULE-WORKFLOW` anchor を持つため machine-auditable である。
- **doctor contract**: `checkCodingRules(repoRoot)` は `docs/governance/coding-rules.md`、`docs/process/forward/L00-L06-design-phase.md`、`docs/process/modes/add-feature.md`、`docs/process/modes/README.md`、`src/**/*.ts`、`tests/**/*.ts` を load する。`analyzeCodingRules` を実行し、`ok` を `runDoctor.ok` に接続する。
- **error handling**: fail-open は catch block が明示的 failure state を return/record するか、その場で fail-open intent を文書化する場合だけ許可する。未文書化の empty catch と rethrow-only catch block は `structured-error-handling` violation とする。
- **module boundary**: `lint` は runtime/doctor/CLI feature module を import してはならない。`runtime` は governance check を import してはならない。`schema` は feature module より下位に置く。違反は `module-boundary` とする。
- **machine-surface language**: machine-facing CLI/doctor/lint/gate/status message は日本語説明を含んでよいが、decision token は安定した ASCII English (`OK`, `violation`, `warning`, `skipped`, `note`, `error`, `ready`, `not ready`) とする。machine message line の日本語のみ decision word は `machine-surface-language` violation とする。**Impl (2026-06-19、A-141)**: `analyzeCodingRules` の `violatesMachineSurfaceLanguage` が machine-surface 行パターン × 非 ASCII 判定語 × ASCII token 不在で検出し、`describe`/`it`/`test` の title literal は除外する (false-positive 回避)。`REQUIRED_RULE_IDS` + SSoT `coding-rules.md` に `machine-surface-language` を登録。oracle U-CODE-010。実 repo violations 0。
- **scope split**: no-any / no-suppression / file naming は source と test に適用する。max-params / structured-error-handling / module-boundary は `src/**` のみに適用する。test helper arity は readability と local test design で統制する。

### DDD/TDD strictness 追補 (FR-L1-50)

- **DDD/TDD rule SSoT**: `docs/governance/ddd-tdd-rules.md` は `domain-boundary`、`invariant-test-trace`、`red-first-evidence`、`test-oracle-strength`、`integration-gwt` の rule ID を定義する。
- **workflow placement**: Forward L6、Add-feature、mode index docs は `DDD-TDD-WORKFLOW` anchor を持つため、rule placement を reviewer memory に委ねない。
- **quantitative/qualitative split**: `analyzeDddTddRules` は review 前に mechanical evidence を提供する。gate-significant な DDD/TDD decision は引き続き reviewer evidence を要求するため、2 つを 1 signal に畳まず freeze readiness として bundle する。
- **unit-oracle-substance (IMP-083 残差、2026-06-19)**: `integration-gwt` が L8 IT-* 行の Given/When/Then 非空を見るのと対に、`unitOracleSubstanceViolations` は **L7 unit test-design の `U-XXX-NNN` 行** (末尾数字必須 = `U-ID` ヘッダ除外) の expected-behavior セルが**実ケース**を持つ (空 / trivial < 6 字 / skeleton marker `-`/TODO/骨格 でない) ことを検査する。pair-freeze (link) / oracle-test-trace (citation) / test-oracle-strength (test コード assert) は U-* 行の**期待結果セル中身**を見ないため、freeze 時の骨格凍結を素通りさせていた穴 (IMP-083) を FR-L1-50 配下で塞ぐ。oracle U-DDDTDD-009。**IMP-082 (descent substance) は別途 IMP-090/092 の `l6-fr-coverage` (FR→L6 type body + pseudocode) で被覆済 = superseded**。
- **doctor contract**: `checkDddTddRules(repoRoot)` は SSoT、workflow docs、PLAN docs、L7/L8 test-design docs、TS source/test file を load する。DDD/TDD strictness violation がある場合、`runDoctor.ok` は fail する。

### Impl-Plan-Trace 追補 (IMP-088 / FR-L1-18 descent / PLAN-REVERSE-40、module 単位への改訂: issue #1169 / #1078 A5)

本追補は FR-L1-18 (横断検出・**接続欠損**) の descent として、実装から設計文書へのトレーサビリティを定義する。PLAN 機構の撤去 (#1078) により、PLAN の本文は入力に使えなくなる。そこで検査の粒度を **ファイル単位の path 一致から module 単位の所有** へ改める (方式判断: #1169 comment 6289671147 の判断 2。advisor claude-fable-5-1 に相談して決定)。新しい機構は作らず、既存の正規表現と baseline の仕組みだけで行う。

**凍結する規則 (matcher の定義)**

1. **入力は設計文書だけ**。再帰的な `docs/design/**/*.md` の本文を読む。`docs/plans/*.md` は入力にしない (PLAN の本文にだけ書かれた path は trace に数えない。ただし、その src の module が設計文書で名指しされていれば、規則 5 (a) により所有される)。
2. **module の名指し**: 設計文書の本文に、正規表現 `(^|[^A-Za-z0-9_./-])src/([A-Za-z0-9_-]+)/` が一致すれば、その第 2 群 `<module>` を「名指しされた module」とする。つまり `src/<module>/` という文字列が現れれば足りる。`src/<module>/*.ts` や `src/<module>/<file>.ts` のような後続付きの形も、先頭が `src/<module>/` なので同じ規則で名指しに数える (glob 形を別扱いにしない)。直前の文字の条件は、`foo/src/<module>/` のような別 path の一部を数えないためである。
3. **module の定義**: `src/` 直下の第 1 階層のディレクトリ名とする。`src/vmodel-contract/domain/x.ts` の module は `vmodel-contract` である。
4. **top-level の単体ファイル** (`src/cli.ts` のように `src/` 直下に置かれた `.ts`) は module を持たない。従来の正規表現 `/src\/[A-Za-z0-9_./-]+\.ts/g` による **path の完全一致**で、設計文書に名指しされているときだけ所有されているとみなす。
5. **所有の判定**: src の `.ts` ファイルは、(a) その module が名指しされている、または (b) top-level 単体ファイルで path が設計文書に完全一致で現れる、のどちらかで所有される。どちらでもなく baseline にも無いファイルは `orphans` に返し、NEW orphan が 1 件でもあれば `ok=false` (fail-close)。
6. **baseline は縮小のみ可**。現行の 5 件 (`src/lint/` の change-impact / doc-consistency / entity-coverage / improvement-backlog / shared) は、いずれも名指し済みの module `lint` に属するため、新しい規則では所有されており stale になる。Green で 5 件とも baseline から外し、集合は空にする。baseline の仕組み自体は残し、追加は認めない。

| 関数 | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `analyzeImplPlanTrace` | analyzeImplPlanTrace(input: ImplPlanTraceInput) => ImplPlanTraceResult | `src/**.ts` 集合 + 設計文書から得た名指し module 集合 + 設計文書に完全一致で現れた src path 集合 + baseline allowlist が供給される。`loadImplPlanTraceInput` は設計文書だけを上記の規則で読み、PLAN を読まない。 | 所有されておらず baseline でもない src を `orphans` に返し、NEW orphan 有無で `ok` を決める。 | baseline は**縮小のみ可** (空集合へ縮小し、追加しない)。module が名指しされていない src は、path が PLAN の本文に書かれていても orphan のまま (PLAN は入力ではない)。名指し済みの module に属する src は、個別の path がどこに書かれているか (PLAN の本文だけ、または無記載) によらず所有される。 | U-IPT-001..006 (既存) と CANDIDATE-U-IPT-007..011 (本改訂) |

- **U-IPT-006 (既存)**: `loadImplPlanTraceInput` は深い階層の `docs/design/**/*.md` を再帰的に読む。この性質は module 単位でも変わらず、Green で fixture を module の名指しに合わせて書き直す。
- **意図的に失う検出力**: 名指し済みの module の中にある「設計から個別には言及されていないファイル」は、もう orphan にならない。許容する理由は、L5 (`module-decomposition.md`) がファイル単位の列挙を最初から放棄し、「`src/lint/` の実数は `src/lint/` が正本」としているためである。ファイル単位の列挙を設計に写すと、rename のたびに古くなる (機械が強制することを文書に写す形になる)。検出が残るのは、設計から名指しされない module の新設と、top-level 単体ファイルの追加である。
- **実測 (origin/main `28ab6b138ed33b29654e5b3535eb7f44b000ad9b`、read-only の node script で測定)**: tracked の `.ts` を持つ `src/` 直下のディレクトリは 40 module。上記 2 の正規表現で設計文書に名指しされていない module は 0 件 (40/40 が名指し済み。例: document-disposition / disposition / audit / trace / vmodel-contract / export / search は `architecture.md` §3.1 の表に `src/<module>/` で載っている)。top-level 単体ファイルは `src/cli.ts` / `src/secret.ts` / `src/stable-id.ts` の 3 件で、3 件とも設計文書に path が完全一致で現れる。測定は `git ls-files src` と `git ls-files docs/design` を対象に、上記の規則を適用して数えた。このため、L5 `module-decomposition.md` へ足す module 単位の行は **0 件** である。
- **Green の範囲 (本書の範囲外、Codex)**: `loadImplPlanTraceInput` から PLAN の読み取りを外し、module 名指しの集合を得る処理を足す。`IMPL_PLAN_TRACE_BASELINE` を空にする。`ImplPlanTraceInput` の形は実装側で最小に決める。PLAN 本文にだけ依存していた 278 件は、module の名指しで所有されるので orphan にならない。これにより A6 (docs/plans の物理撤去) で U-IPT-004 / doctor / gate-static が赤にならない。
- **baseline 根拠 (履歴)**: 2026-06-10 実測で 12 孤児。うち 4 は back-fill、残 8 を baseline とし、設計 path の trace で 5 件へ縮小した。本改訂で 0 件になる。
- **doctor 配線**: `checkImplPlanTrace(repoRoot)` を **hard/fail-close** で配線する点は変えない。CI 回帰網 `U-IPT-004` と doctor の両方で実 repo orphan 0 を維持する。

## §4 doctor 配線 (hard/fail-close)

`checkModuleDrift(repoRoot)` を `runDoctor` に **hard/fail-close** で配線。I/O 失敗は violation として `ok=false` を返し、module-drift があれば `ut-tdd doctor` は失敗する。

## §5 段階導入 / hard 化判断

- **hard 化完了**: A-103 back-fill 後、実 repo 孤児0 (handover/setup/web 列挙済) を確認し、CI 回帰網 (U-MDRIFT-005) と doctor.ok 連動の両方で fail-close する。

## §6 用語更新

- **module-drift**: architecture §3.1 設計 module 集合 ⊇ `src/` 実在 module の包含 drift (impl→design back-fill 漏れ)。asset-drift (内容整合) / dependency-drift (import グラフ) と別検査。
- **change-impact**: `src/**` の差分に対し、同一 change set 内の design PLAN/doc 更新と tests または test-design 更新を要求する修正漏れ検出。semantic な「変更不要」判断は将来の relation-graph/dependency-drift に委ねるが、コード変更が設計・テスト更新なしで通過する穴は doctor で塞ぐ。

## §7 carry

- **hard 化**: 完了。`checkModuleDrift.ok` / `checkImplPlanTrace.ok` は `runDoctor.ok` に連動する。
- **粒度の深化**: 現状 top-level module 集合のみ。Level 2 (代表 module 内部ファイル) 粒度の drift は対象外 (§3.2 は人手)。
- **asset-drift**: `analyzeAssetDrift` (FR-L1-49) は internal asset cutover の現在の hard gate slice として実装する。`.claude/agents/*.md`、`.claude/agent-memory/**/*.md`、`docs/skills`、`docs/templates/prompts/*.md` assets を再帰 scan し、legacy source personal path residue、legacy runtime delegation command residue、legacy runtime name/env residue、空の `docs/skills`、対応する agent docs を持たない guard allowlist entry を failure とする。prompt body は persistent state へ parse せず、markdown assets を source of truth とする。
