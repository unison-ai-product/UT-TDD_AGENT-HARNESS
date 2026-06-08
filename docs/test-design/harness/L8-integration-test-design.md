---
layer: L5
executed_at_layer: L8
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L5-detailed-design/
parent_doc: docs/plans/PLAN-L5-00-master.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l5_physical_data: docs/design/harness/L5-detailed-design/physical-data.md
related_l5_module: docs/design/harness/L5-detailed-design/module-decomposition.md
related_l5_internal: docs/design/harness/L5-detailed-design/internal-processing.md
related_l5_if_detail: docs/design/harness/L5-detailed-design/if-detail.md
next_pair_freeze: L5
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-29
updated: 2026-05-29
---

# UT-TDD Agent Harness 窶・L8 邨仙粋繝・せ繝郁ｨｭ險・(竭｣ / IT-*)

> **layer (菴懈・螻､ = V-pair key)**: L5 (隧ｳ邏ｰ險ｭ險・ / **executed_at_layer (螳滓命螻､)**: L8 (邨仙粋繝・せ繝・ / **artifact**: 竭｣ 繝・せ繝郁ｨｭ險・(V-model 蜿ｳ縲≫贈 L5 隧ｳ邏ｰ險ｭ險・蜈ｨ sub-doc 縺ｨ蟇ｾ)
> **pair (V-model L5竊猫8)**: `docs/design/harness/L5-detailed-design/{physical-data,module-decomposition,internal-processing,if-detail}.md` 4 sub-doc 蜈ｨ菴・竊・譛ｬ譖ｸ 1 doc
> **status**: confirmed (L5-L8 pair freeze. §5 provides GWT-level IT case design for all IT-* rows.)
> **granularity correction (2026-06-08)**: resolved. Each IT-* now has Given/When/Then, fixture, module boundary setup, mock/adapter conditions, expected assertions, and negative/edge coverage in §5.

## ﾂｧ0 驥城哩縺伜次蜑・(L5 竊・L8)

L5 隧ｳ邏ｰ險ｭ險医・蜷・･醍ｴ・(DbC) 縺・L8 邨仙粋繝・せ繝・(IT-*) 縺ｧ陲ｫ隕・＆繧後ｋ縺薙→ (蟄､蜈・= 0)縲・
- **internal-processing**: 蜷・桃菴懊・ DbC pre/post/invariant (ﾂｧ3/ﾂｧ4/ﾂｧ5) + edge docstring (ﾂｧ7) 竊・螂醍ｴ・・螳・IT 蠢・・- **if-detail**: adapter 隧ｳ邏ｰ螂醍ｴ・(ﾂｧ1-ﾂｧ5) + 繧ｨ繝ｩ繝ｼ蛻・｡樞・fail-close (ﾂｧ4) 竊・蠅・阜邨ｱ蜷・IT 蠢・・- **module-decomposition**: module 髢薙・蜈ｬ髢・IF 蜻ｼ縺ｳ蜃ｺ縺・(萓晏ｭ俶婿蜷・ 竊・module 邨仙粋 IT 蠢・・- **physical-data**: state file 竊・zod 縺ｮ隱ｭ霎ｼ/譖ｸ霎ｼ謨ｴ蜷・(ﾂｧ5) 竊・豌ｸ邯壼喧邨仙粋 IT 蠢・・- 蟄､蜈・= 0 (L7 縺ｧ `ut-tdd vmodel lint` 縺ｮ edge 5-8 辣ｧ蜷医↓謗･邯・

## ﾂｧ1 邨仙粋繝・せ繝・(IT-*) 窶・candidate skeleton

> L8 = module 髢・/ 蜀・､門｢・阜縺ｮ **邨仙粋**繧貞ｯｾ雎｡ (L9 system test 繧医ｊ荳倶ｽ阪´12 蜿怜・ AT 繧医ｊ螳溯｣・ｯ・ｊ)縲ょ句挨 IT 繧ｱ繝ｼ繧ｹ縺ｯ L8 譛ｬ襍ｷ逾ｨ縺ｧ螻暮幕縲・
### ﾂｧ1.1 IT-CONTRACT (internal-processing DbC 逕ｱ譚･)
| IT-ID (蛟呵｣・ | 讀懆ｨｼ蟇ｾ雎｡ | 繧ｷ繝翫Μ繧ｪ |
|---|---|---|
| IT-CONTRACT-01 | `plan draft` 縺ｮ pre/post (ﾂｧ3/ﾂｧ4) | precondition 驕募渚蜈･蜉・竊・fail-close / 豁｣蟶ｸ蜈･蜉・竊・file+registry postcondition 謌千ｫ・|
| IT-CONTRACT-02 | `gate` 縺ｮ post + invariant (ﾂｧ4/ﾂｧ5) | gate pass 竊・phase.yaml + gate_runs 險ｼ霍｡ / V-model 鬆・ｺ・invariant |
| IT-CONTRACT-03 | edge docstring (ﾂｧ7縲‘dge 5-8) 竊・螳溯｣・未謨ｰ | @edge-normal/error/boundary/throws 縺・AT 縺ｨ蜿梧婿蜷・trace |

### ﾂｧ1.2 IT-ADAPTER (if-detail D-CONTRACT 逕ｱ譚･)
| IT-ID (蛟呵｣・ | 讀懆ｨｼ蟇ｾ雎｡ | 繧ｷ繝翫Μ繧ｪ |
|---|---|---|
| IT-ADAPTER-01 | adapter intent 竊・邨先棡蝙・(ﾂｧ1/ﾂｧ2) | invokeWorker intent 竊・InvokeResult (mock provider) |
| IT-ADAPTER-02 | 繧ｨ繝ｩ繝ｼ蛻・｡・竊・fail-close (ﾂｧ4) | absent竊壇egradation / auth竊断ail-close / timeout竊痴kip |
| IT-ADAPTER-03 | D-CONTRACT DSL (ﾂｧ5) | mode-routing.yaml / gate-checks.yaml 縺ｮ zod 隱ｭ霎ｼ validate |

### ﾂｧ1.3 IT-MODULE (module-decomposition 逕ｱ譚･)
| IT-ID (蛟呵｣・ | 讀懆ｨｼ蟇ｾ雎｡ | 繧ｷ繝翫Μ繧ｪ |
|---|---|---|
| IT-MODULE-01 | 萓晏ｭ俶婿蜷・(schema 荳譁ｹ蜷代・蠕ｪ迺ｰ遖∵ｭ｢) | module 髢・import 繧ｰ繝ｩ繝輔↓蠕ｪ迺ｰ縺ｪ縺・|
| IT-MODULE-02 | lint 蜈ｱ騾壽ｧ伜ｼ・(loadX竊誕nalyzeX) | loadX (fs) + analyzeX (pure) 縺ｮ邨仙粋蜍穂ｽ・|

### ﾂｧ1.4 IT-STATE (physical-data 逕ｱ譚･)
| IT-ID (蛟呵｣・ | 讀懆ｨｼ蟇ｾ雎｡ | 繧ｷ繝翫Μ繧ｪ |
|---|---|---|
| IT-STATE-01 | state file 竊・zod 隱ｭ霎ｼ/譖ｸ霎ｼ (ﾂｧ5) | 譖ｸ霎ｼ竊定ｪｭ霎ｼ縺ｧ zod parse 謌千ｫ・/ 荳肴ｭ｣ state 竊・fail-close |
| IT-STATE-02 | drive 蛻･蛹ｺ逕ｻ (ﾂｧ6) | 蛹ｺ逕ｻ髫秘屬 + 霍ｨ縺取ｱ壽沒讀懷・ |

### ﾂｧ1.5 IT-ASSET (蜀・Κ雉・肇 roster 逕ｱ譚･縲￣LAN-L5-05 / PLAN-DISCOVERY-02 Discovery confirmed)
| IT-ID (蛟呵｣・ | 讀懆ｨｼ蟇ｾ雎｡ | 繧ｷ繝翫Μ繧ｪ |
|---|---|---|
| IT-ASSET-01 | `roster list` scan竊池egistry (module-decomp ﾂｧ1/ﾂｧ5) | `.claude/agents/*.md` 蜈ｨ莉ｶ縺・registry (id=filename stem) 縺ｫ蜈･繧・(PLAN-DISCOVERY-02 spike = 19 莉ｶ螳溯ｨｼ) / capability class 竓･ model family 縺ｫ豎ｺ螳夊ｫ冶ｧ｣豎ｺ |
| IT-ASSET-02 | `roster check` 竊・guard allowlist 謨ｴ蜷・(internal-proc ﾂｧ4 post) | allowlist 遯∝粋 = missingFromRoster=0 竏ｧ nameMismatches=0 縺ｧ ok/exit 0 / 荵夜屬 (allowlist 縺ｫ縺ゅｊ .md 辟｡縺励’ilename竊馬ame 荳堺ｸ閾ｴ) 豕ｨ蜈･ 竊・**fail-close**/exit 1縲ＯonAllowlisted (be-* / db-schema / devops-deploy) 縺ｯ荵夜屬縺ｧ縺ｪ縺乗里遏･髮・粋 |
| IT-ASSET-03 | `runtime(guard) 竊・roster` 萓晏ｭ俶婿蜷・(module-decomp ﾂｧ4) | roster 縺・runtime/guard 繧・import 縺励↑縺・(蠕ｪ迺ｰ 0)縲らｧｻ陦梧ｮｵ髫・placeholder_deps (waiting_layer:L7) 縺ｮ郢九℃ |

## ﾂｧ2 驥城哩縺倅ｸ隕ｧ (L5 螂醍ｴ・竊・IT 陲ｫ隕・∝ｭ､蜈舌メ繧ｧ繝・け)

- internal-processing ﾂｧ3/ﾂｧ4/ﾂｧ5/ﾂｧ7 DbC 竊・IT-CONTRACT-01縲・3 + roster D-API (`roster list/check`) 竊・IT-ASSET-01縲・2 (`ut-tdd asset` FR-L1-48 縺ｯ L6 carry `waiting_layer:L6` 縺ｧ IT 陲ｫ隕・ｂ L6 蠕瑚ｿｽ縺・∝ｭ､蜈舌〒縺ｪ縺・carry 譏守､ｺ)
- if-detail ﾂｧ1-ﾂｧ5 竊・IT-ADAPTER-01縲・3
- module-decomposition ﾂｧ4 萓晏ｭ俶婿蜷・/ ﾂｧ6 lint 讒伜ｼ・竊・IT-MODULE-01縲・2 + roster module (ﾂｧ1/ﾂｧ5) 竊・IT-ASSET-01/03
- physical-data ﾂｧ5/ﾂｧ6 竊・IT-STATE-01縲・2
- **蟄､蜈・(螂醍ｴ・〒 IT 蛟呵｣懈悴蟇ｾ蠢・ = 0** 繧・L8 譛ｬ襍ｷ逾ｨ縺ｧ讖滓｢ｰ遒ｺ隱阪ら樟譎らせ縺ｧ縺ｯ candidate mapping 縺ｧ縺ゅｊ縲∬ｩｳ邏ｰ case 險ｭ險医・ orphan=0 縺ｧ縺ｯ縺ｪ縺・・
## ﾂｧ3 trace (竭｣ 竊・竭｡)

譛ｬ譖ｸ縺ｮ蜷・IT-* 縺ｯ `docs/design/harness/L5-detailed-design/` 縺ｮ 4 sub-doc 縺ｮ螂醍ｴ・→逶ｸ莠・reference縲・*G5 (隧ｳ邏ｰ險ｭ險医ご繝ｼ繝・= DbC freeze 轤ｹ)** 縺ｧ 4 sub-doc 蜈ｨ菴・竍・譛ｬ譖ｸ 1 doc 縺ｮ pair 螳｣險繧堤｢ｺ螳壹＠縲∝曙譁ｹ蜷・trace freeze 縺ｯ G7 縺ｧ螳滓命 (L3竊猫12 / L4竊猫9 縺ｨ蜷悟梛)縲・
## ﾂｧ4 carry / 谺｡蟾･遞・
- **L8 譛ｬ襍ｷ逾ｨ**: IT-* 蛟句挨繧ｱ繝ｼ繧ｹ螻暮幕 + 驥城哩縺俶ｩ滓｢ｰ遒ｺ隱・- **L7 螳溯｣・*: 蜈ｨ IT-* 繧・vitest 邨仙粋繝・せ繝医↓螟画鋤 (TDD 蠑ｷ蛻ｶ FR-02縲ヽed 蜈郁｡・縲・bC docstring (internal-processing ﾂｧ7) 縺ｮ @edge-* 竊・AT 辣ｧ蜷・- **G7 trace freeze**: 4 artifact 蜿梧婿蜷・12 edge 蜃咲ｵ先凾縺ｫ譛ｬ譖ｸ IT 竊・L5 螂醍ｴ・・ trace 遒ｺ螳・
## Appendix A: L5 back-fill IT coverage candidate map (PLAN-L5-06 / PLAN-L5-07)

### A.1 IT-ASSET additions for skill and drift

| IT-ID | Source contract | Scenario |
|---|---|---|
| IT-ASSET-04 | skill catalog integration (module-decomposition Appendix A.1 / internal-processing Appendix A.1) | `docs/skills/**/*.md` scan produces an in-memory catalog; missing optional roots are reported as empty-with-evidence; no `.ut-tdd` persistent state is created. |
| IT-ASSET-05 | skill recommender/injector integration (PLAN-L5-06) | catalog + task/layer/drive context produces deterministic recommendations and layer-scoped injection sets; scoring and injector signatures remain L6 carry (`waiting_layer:L6`). |
| IT-ASSET-06 | `asset-drift` rule integration (module-decomposition Appendix A.2 / internal-processing Appendix A.2) | rule registry contains `asset-drift`; enrolled agent/skill docs are checked; unresolved drift surfaces through doctor/gate as non-green validation. |
| IT-ASSET-07 | placeholder dependency gap integration (physical-data ﾂｧ7 + PLAN-L5-07) | unresolved placeholder dependencies stay visible until their waiting layer; reaching the layer without materialization fails validation instead of silently passing. |

### A.2 Coverage mapping statement

- PLAN-L5-06 skill contracts -> IT-ASSET-04 and IT-ASSET-05.
- PLAN-L5-07 asset-drift contracts -> IT-ASSET-06 and IT-ASSET-07.
- Existing roster contracts remain covered by IT-ASSET-01 through IT-ASSET-03.
- With these additions, L5 internal asset contracts have L8 rows. Detailed L8 case design is closed by ﾂｧ5: each row has Given/When/Then, fixture, boundary setup, assertions, and negative/edge coverage. Algorithmic detail remains a documented L6 carry, and implementation materialization remains a documented L7 carry.

## ﾂｧ5 Confirmed IT Case Design (G5 Freeze)

This section upgrades the previous candidate skeleton to confirmed integration-test design granularity. Every IT-* row has Given/When/Then, fixture, module boundary setup, assertion, and negative/edge coverage. L6/L7 carry items remain implementation-detail carry only; the integration boundary and expected behavior are frozen here.

| IT-ID | Given | When | Then | Fixture / Boundary | Assertions | Negative / Edge |
|---|---|---|---|---|---|---|
| IT-CONTRACT-01 | A valid and invalid `plan draft` request, a temp `docs/plans` workspace, and an empty plan registry. | The plan draft flow validates frontmatter, writes a PLAN, and updates registry evidence. | Valid input creates a PLAN and registry entry; invalid input fails before write. | CLI -> plan module -> schema -> fs boundary; temp fs fixture. | Exit 0 with file+registry postcondition, or exit 1 with no partial write. | Missing `plan_id`, invalid layer, duplicate ID, readonly target. |
| IT-CONTRACT-02 | A gate request with prior phase state and gate-design ledger fixture. | The gate flow records pass/fail evidence and updates phase state. | Gate pass creates gate_runs evidence and preserves V-model order invariant. | gate module -> phase state -> audit ledger boundary. | Gate status, audit record, and phase transition agree. | Gate skipped out of order, missing evidence, stale park state. |
| IT-CONTRACT-03 | Functions or docs carrying edge annotations and mapped AT references. | Edge docstring scan is compared with L5 DbC and AT trace. | Each edge 5-8 class maps to an AT or explicit carry. | code/doc parser -> trace map boundary. | No orphan `@edge-*`, no AT without source contract. | Unknown edge tag, conflicting normal/error classification. |
| IT-ADAPTER-01 | A mock provider adapter and provider-independent worker intent. | The adapter invokes worker/reviewer intent and normalizes the result. | Result is returned as provider-independent `InvokeResult`. | core -> adapter -> mock provider boundary. | Intent fields preserved; result/error union is valid. | Provider returns malformed payload or missing output. |
| IT-ADAPTER-02 | Adapter error fixtures for absent provider, auth failure, rate limit, and timeout. | The adapter maps each error to fail-close/degradation/skip policy. | Auth fails closed; absent provider degrades only where allowed; timeout is bounded. | adapter -> policy mapper -> CLI exit boundary. | Error class, exit code, and next_action match D-CONTRACT. | Retry exhaustion, mixed partial success, unknown provider error. |
| IT-ADAPTER-03 | `mode-routing.yaml` and `gate-checks.yaml` fixtures. | D-CONTRACT DSL is loaded and validated. | Valid DSL parses; invalid routing/gate definitions fail before execution. | config loader -> zod schema -> workflow boundary. | Schema parse success/failure is deterministic. | Unknown mode, missing gate, circular routing. |
| IT-MODULE-01 | A module import graph containing expected schema-first dependency direction. | Import graph check walks public and internal module imports. | No cycle exists and schema remains one-way dependency root. | src module graph -> dependency analyzer boundary. | Cycle count 0; forbidden reverse import count 0. | Injected cycle, helper importing CLI, lint importing doctor. |
| IT-MODULE-02 | A lint module fixture with `loadX` and pure `analyzeX`. | Loader reads fixtures and analyzer is run with provided docs. | I/O stays in loader, analyzer is deterministic and side-effect free. | fs loader -> pure analyzer -> message boundary. | Same input yields same result; messages match violation set. | Analyzer reading fs, loader hiding parse failure, unstable message order. |
| IT-STATE-01 | Valid and invalid `.ut-tdd` state files plus schema fixtures. | State is written, read back, and parsed through zod. | Valid state round-trips; invalid state fails closed before use. | state fs -> zod schema -> doctor boundary. | Parse result matches schema and preserves IDs. | Missing required field, unknown enum, corrupt JSON/YAML. |
| IT-STATE-02 | Two drive partitions with overlapping artifact IDs. | Drive-scoped state is read and cross-drive contamination is checked. | Each drive remains isolated unless an explicit trace edge allows linkage. | `.ut-tdd/drive/<drive>` -> state loader boundary. | No cross-drive read without declared edge. | Same ID in two drives, missing drive, invalid skip_sub_doc. |
| IT-ASSET-01 | `.claude/agents/*.md` fixture set and roster registry fixture. | `roster list` scans markdown and builds the registry. | Every file becomes one deterministic registry row. | markdown source -> roster module -> registry boundary. | ID equals filename stem; capability class is independent of model family. | Duplicate filename stem, missing name, unsupported metadata. |
| IT-ASSET-02 | Roster registry and guard allowlist fixtures. | `roster check` compares registry names and allowlist entries. | Matching sets pass; missing roster or name mismatch fails closed. | roster module -> guard allowlist boundary. | `missingFromRoster=0` and `nameMismatches=0` for pass. | Non-allowlisted known agents stay informational, not failure. |
| IT-ASSET-03 | Import graph fixture for runtime, guard, and roster modules. | Dependency-direction check verifies `runtime -> roster` only. | Roster never imports runtime/guard; migration placeholder remains explicit. | runtime/guard/roster import boundary. | Cycle count 0; reverse dependency count 0. | Temporary bridge without placeholder, hidden transitive import. |
| IT-ASSET-04 | `docs/skills/**/*.md` fixture and empty optional roots. | Skill catalog scan produces an in-memory catalog. | Present skills are cataloged; missing optional roots return empty-with-evidence. | docs/skills -> skills catalog boundary. | No persistent `.ut-tdd` state is created. | Malformed skill metadata, duplicate skill ID, missing root evidence. |
| IT-ASSET-05 | Skill catalog plus task/layer/drive context. | Recommender/injector computes recommendations and layer-scoped injection set. | Recommendations are deterministic and injection set is scoped to the requested layer. | catalog -> recommender -> injector boundary. | Same input produces same ordered set; unsupported layer fails closed. | Tie score, unknown drive, missing required skill. |
| IT-ASSET-06 | Rule registry containing `asset-drift` and enrolled doc fixtures. | Asset-drift rule runs against agent/skill docs. | Drift is surfaced through doctor/gate as non-green validation. | rule registry -> doc scan -> doctor/gate boundary. | Rule registration exists; violation count maps to non-green output. | HELIX absolute path, raw `helix codex`, empty docs/skills. |
| IT-ASSET-07 | Placeholder dependency records with `waiting_layer` and current layer. | Placeholder check compares unresolved dependency against current layer. | Before waiting layer it remains visible carry; at/after waiting layer unresolved state fails. | physical-data placeholder registry -> vmodel/doctor boundary. | Carry is explicit and becomes failure at threshold. | Missing waiting layer, stale placeholder after materialization, orphan edge. |
## Appendix B: DB Reference-Feedback IT Additions (PLAN-L5-08)

| IT-ID | Given | When | Then | Fixture / Boundary | Assertions | Negative / Edge |
|---|---|---|---|---|---|---|
| IT-DB-01 | Valid PLAN/artifact/gate/finding fixtures and empty `.ut-tdd/harness.db`. | Projection writer records normalized events into SQLite. | Rows exist in plan/artifact/gate/finding projections and can be joined by `plan_id`. | docs/state loaders -> projection-writer -> SQLite boundary. | No orphan projection rows; duplicate replay is idempotent. | Missing `plan_id` and `session_id`, corrupt DB, duplicate key replay. |
| IT-DB-02 | Drive/model/session fixtures across Forward, Add-feature, Reverse, and Recovery modes. | `drive_runs`, `hook_events`, and `model_runs` are projected and joined. | Each run has drive/mode/layer/kind and joins to PLAN/session evidence. | runtime/session log -> state-db boundary. | Cross-drive contamination count is 0; unresolved join becomes finding. | Unknown drive, mode-kind mismatch, dangling session. |
| IT-DB-03 | Skill recommendation rows and skill invocation rows for the same PLAN/session. | Skill metrics are computed by layer/drive/plan. | Firing and acceptance rates are materialized as quality signals. | skill recommender/invocation log -> feedback-engine boundary. | Denominator is recommendations; numerator is actual fired invocations. | Recommendation without invocation, invocation without recommendation, zero denominator. |
| IT-SEARCH-01 | Search index built from PLAN/artifact/finding/skill/model/session fixtures. | `ut-tdd find` queries exact IDs and fuzzy terms. | Ranked references include subject type, ID, path, reason, and evidence path. | search-index -> SQLite -> CLI boundary. | Exact ID wins; stale index is detectable and rebuildable. | Deleted source doc, ambiguous query, redacted content query. |
| IT-FEEDBACK-01 | Open findings and quality signals with repeated stale approval, orphan trace, and schedule lint patterns. | Feedback engine groups signals and emits feedback events. | Repeated gaps become visible feedback events with next_action references. | findings/quality_signals -> feedback-engine boundary. | Event references source findings; auto event does not approve or edit PLAN. | Conflicting severity, closed finding, missing evidence path. |
| IT-AUTOMATION-01 | Workflow/gate/doctor/CI projection fixtures for ready, blocked, and human-required plans. | Automation readiness is evaluated. | Each workflow row is classified and includes blocking evidence where not ready. | workflow_runs/gate_runs/findings -> automation-readiness boundary. | Missing evidence cannot produce ready; blocked rows reference open findings. | Stale gate pass, skipped doctor check, human-required without signoff. |
| IT-GUARDRAIL-01 | Agent-guard, review_evidence, same-model, tests-before-review, and escalation fixtures. | Guardrail decisions are normalized into `guardrail_decisions`. | Allowed/blocked/human-required decisions are queryable by plan/session. | guardrail policy/evidence -> guardrail-ledger -> SQLite boundary. | Same-model cross-agent approval and missing human signoff become block decisions. | Naive self-review, PII scope, missing evidence path. |
| IT-ASSET-DB-01 | Skill/roster/command markdown fixtures with valid, empty, and HELIX-drift cases. | Automation assets are cataloged and indexed. | Valid assets appear in catalog/search; drift and empty catalog become findings. | docs/.claude sources -> asset-catalog -> search-index boundary. | Prompt bodies are not copied; trigger/capability metadata is searchable. | Duplicate asset ID, raw `helix` command, malformed metadata. |
