---
layer: L4
executed_at_layer: L9
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L4-basic-design/
parent_doc: docs/plans/PLAN-L4-00-master.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l4_data: docs/design/harness/L4-basic-design/data.md
related_l4_architecture: docs/design/harness/L4-basic-design/architecture.md
related_l4_function: docs/design/harness/L4-basic-design/function.md
related_l4_external_if: docs/design/harness/L4-basic-design/external-if.md
related_l4_security: docs/design/harness/L4-basic-design/security.md
related_plan_l4_internal: docs/plans/PLAN-L4-10-internal-asset-master.md
next_pair_freeze: L4
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-29
updated: 2026-05-29
---

# UT-TDD Agent Harness — L9 総合テスト設計 (④ / ST-*)

> **layer (作成層 = V-pair key)**: L4 (基本設計) / **executed_at_layer (実施層)**: L9 (総合テスト) / **artifact**: ④ テスト設計 (V-model 右、② L4 基本設計 全 sub-doc と対)
> **pair (V-model L4↔L9)**: `docs/design/harness/L4-basic-design/{data,architecture,function,external-if}.md` 4 sub-doc 全体 ↔ 本書 1 doc
> **status**: confirmed (G4/A-101 freeze — ST カテゴリ ⇔ L4 設計要素の被覆を凍結、孤児 0)。個別 ST ケース (Given-When-Then) は検証 band (L8-L14) / L9 本起票で展開する。L7 implemented evidence now covers the former ST-ASSET roster/skill carry rows.
> **PLAN**: `docs/plans/PLAN-L4-{01..04}-*.md` の pair_artifact / DoD で本書参照

## §0 量閉じ原則 (L4 ↔ L9)

L4 基本設計の各設計要素が L9 総合テスト (ST-*) で被覆されること (孤児 = 0)。

- **data.md**: 5 集約の不変条件 (§6) / 集約間整合 (§7) / state schema (§8) → 整合性 ST 必須
- **architecture.md**: building block 依存方向 (§3、schema 一方向・循環禁止) / fail-close (§2/§5) / hook 配線 (§6) → 統合 ST 必須
- **function.md**: CLI コマンド (§2) / workflow オーケストレーション (§3 = Forward spine + 9 駆動モデル + 2 工程専門) / signal→mode routing 優先度 (§3.2) / 機能間依存 (§7) → end-to-end ST 必須
- **external-if.md**: 境界 DbC (§3) / 失敗時 degradation (§4) / adapter (§6) → 境界統合 ST 必須
- 孤児 = 0 (機械検証は L7 で `ut-tdd vmodel lint` / trace check に接続)

## §1 総合テスト (ST-*) — ST カテゴリ凍結 / GWT は検証 band 展開

> 本節は L4 設計要素から導出する ST カテゴリ (被覆を G4 で凍結、孤児 0)。個別 ST ケース (Given-When-Then) は検証 band (L8-L14) / L9 本起票で展開する。

### §1.1 ST-DATA (data.md 由来 — 集約整合 / state schema)

| ST-ID (候補) | 検証対象 (data.md) | 想定シナリオ | 機械検証 (carry) |
|---|---|---|---|
| ST-DATA-01 | 逆ピラミッド禁止不変条件 (§6) | design+impl 存在で test_design+test_code 不在 → G6/G7 fail-close | vitest 統合 (L7) |
| ST-DATA-02 | V_MODEL_PAIRS 不変条件 (§6) | pair が 6 組外 → 検出 | vitest |
| ST-DATA-03 | 集約間整合 (§7、artifact.trace↔plan.generates) | 不整合 → doctor 検出 | vitest doctor |
| ST-DATA-04 | state schema ↔ src/schema 突合 (§8) | enum 齟齬 → doctor check_business_entity_coverage | vitest doctor |
| ST-DATA-05 | review 前置証跡 不変条件 (§6 Plan、IMP-071) | confirmed/completed の design/impl/add-* PLAN が review_evidence 無し → doctor `checkReviewEvidence` fail-close (hard) | vitest doctor (U-REVIEW-006 実 repo ガード、実装済) |
| ST-DATA-06 | 宣言型 spec IR 論理モデル (§1.1 / §8.1) | SpecDef / SpecRelation / ScheduleEntry / ActivationEntry / DetectorFinding が既存集約境界に割り当てられ、DB projection が authoring source に昇格しない。L5/L8 では IT-SPECIR-01..04 へ降下し、U3 L7 で vitest DB projection + doctor coverage に落とす | vitest DB projection + doctor coverage (U3 L7) |

### §1.2 ST-ARCH (architecture.md 由来 — 統合 / 依存方向 / fail-close)

| ST-ID (候補) | 検証対象 (architecture.md) | 想定シナリオ | 機械検証 (carry) |
|---|---|---|---|
| ST-ARCH-01 | 依存方向 schema 一方向・循環禁止 (§3) | 循環 import 導入 → 検出 (D-03=0) | dependency lint (L7) |
| ST-ARCH-02 | fail-close (§2/§5) | guard/lint/gate が exit≠0 で停止 | vitest 統合 |
| ST-ARCH-03 | agent-guard hook 配線 (§6) | PreToolUse(Agent) で allowlist/model 検証 | vitest agent-guard (既存) |
| ST-ARCH-04 | CLI ↔ module 統合 (§3.1) | status/doctor/plan/vmodel end-to-end | vitest CLI 統合 |

### §1.3 ST-FUNC (function.md 由来 — コマンド / workflow end-to-end)

| ST-ID (候補) | 検証対象 (function.md) | 想定シナリオ | 機械検証 (carry) |
|---|---|---|---|
| ST-FUNC-01 | 駆動モデル end-to-end 遷移 (§3.1、11 種 + Verify 右肺入口) | 各駆動モデルが入口 signal で発動 → 固有 phase/step を経て → 出口 contract を満たす (例: Discovery S0→S4 で confirmed=verify 成功必須 / Reverse R0→R4 で forward_routing 確定)。Verify は右肺入口として同じ routing surface に載るが、左肺駆動モデルには数えない | vitest workflow 統合 (L7) |
| ST-FUNC-01b | Forward spine 合流 contract (§3.1 出口列) | 各駆動モデルの出口が**正しい Forward L 工程へ合流** (Reverse=L1/L3/L4/L5/gap-only の 5値 / Scrum は L8-L14 へ合流不可=IMP-044 / Refactor=L7 内部完結で L1/L4 不変) | vitest workflow 統合 |
| ST-FUNC-02 | 機能間依存 (§7) | plan draft→hook→registry / gate→trace→detector の連鎖 | vitest 統合 |
| ST-FUNC-03 | TDD 強制 (FR-02、§2 sprint) | Red→Green→refactor 順序 + 本体先行で fail-close | vitest 統合 |
| ST-FUNC-04 | signal→mode routing 優先度 (§3.2、FR-08) | 競合 signal で **Incident>Recovery>Reverse>Refactor** の優先度で routing (例: env=prod 障害 + drift 同時 → Incident 優先) / interrupt 4 分岐 | vitest routing |
| ST-FUNC-05 | mode↔kind 非1:1 (§3.2) | Discovery/Scrum が同一 kind=poc で mode 識別 / Incident が troubleshoot+recovery の 2 PLAN に分割 (recovery.requires に troubleshoot 宣言) / Add-feature が add-design+add-impl | vitest 統合 (frontmatter + dependencies) |
| ST-FUNC-06 | 人間サインオフ + execution mode 別 review tier (§3.1/§3.6) | Recovery=tl+po / Incident=オンコール+tl+pm / Retrofit config_drift=tl のサインオフ無しに exit させない (fail-close、mode-invariant)。**判断ゲートの review tier が execution mode で縮退** (hybrid=cross-agent / claude-only・codex-only=intra_runtime_subagent hard / standalone=人間必須)、`ut-tdd gate` が status mode を参照し self-review が cross-agent に化けない | vitest `gate-review-tier.test.ts` + CLI `ut-tdd gate` smoke (mode 別) |
| ST-FUNC-07 | skill 文脈注入 (§3.4、FR-12) | `skill suggest` が PLAN context (kind/layer/drive) から ranked 推挙 + 注入規約を返し、**全 skill を常時ロードしない** (必要 step のみ注入) | vitest skill (L7) |
| ST-FUNC-08 | design-bottomup end-to-end (§3.1、画面後付け駆動) | **Given** 既存 backend + FE 要件未確定、**When** `design_bottomup` 系 signal で発動、**Then** backend 由来 FE 要件 elicitation → mock 具体化 (L2) → add-design (L2-L6) → add-impl (L7) を経て、要件 (L1/L3) は Reverse back-fill で bottom-up 後追い合流する (DISCOVERY-07 feasibility 由来) | vitest workflow 統合 (L7) |
| ST-FUNC-09 | version-up end-to-end (§3.1、後送要件駆動) | **Given** 現バージョンで後送された要件、**When** `version_deferral` 系 signal で deferral 台帳へ記録し次バージョン着手、**Then** 台帳 → add-feature 決定表へ合流 → add-design (L3-L6) として同型化する (着手まで PLAN 化しない) | vitest workflow 統合 |
| ST-FUNC-10 | FilingTarget と工程表 SSoT (§3.2.1) | **Given** detector / doctor / route eval が signal を検出し、**When** filing 先を提示する、**Then** mode だけでなく current_location / schedule_entry / allowed_kinds / layer_band / sub_doc_hint / pairing_obligation / activation_profile を L4 設計 SSoT 由来で返し、設計に無い filing target を検出系が創作しない | vitest routing + DB projection 統合 |

> 個別 FR の AC レベル受入は L12 受入テスト (AT-*) が担う。L9 は **複数 FR/module をまたぐ統合挙動**を対象 (L12 との責務分界)。駆動モデルの状態遷移 pseudocode / CLI signature は L4 §3.6 で L5/L6 へ defer のため、ST-FUNC は **system 粒度の遷移成立・合流先・優先度・サインオフ**を対象 (関数粒度の単体は L7 U-* が担う)。

### §1.3.1 ST-ASSET (function.md §1.1 由来 — 内部資産 roster/command system 挙動、A-85)

> L4=L9 総合テスト粒度で**書ける範囲のみ**。関数粒度 (各 subcommand signature / capability resolver アルゴリズム) は仕様未確定のため **placeholder + 依存明示** (back-fill 対象、§4)。

| ST-ID (候補) | 検証対象 (function §1.1) | 想定シナリオ (system 粒度) | 機械検証 (carry) |
|---|---|---|---|
| ST-ASSET-01 | roster registry SSoT (FR-L1-46) | `.claude/agents/*.md` (層1) を roster が読み、全 subagent が roster metadata に登録される (孤児 subagent = 0) | vitest roster (L7) |
| ST-ASSET-02 | roster ↔ guard allowlist 整合 | roster の allowlist と agent-guard enforcement が一致 (二重定義・乖離 0、不一致→fail-close) | vitest 統合 (agent-guard 既存 + roster) |
| ST-ASSET-03 | 内部資産 command end-to-end (FR-L1-48) | `ut-tdd roster list/check` / `ut-tdd asset` が system として動く | vitest CLI 統合 |
| ST-ASSET-05 | skills building block (FR-L1-47、architecture §3) | Implemented L7 evidence: `src/workflow/contracts.ts#catalogSkills`, `src/workflow/contracts.ts#recommendSkills`, and `src/workflow/contracts.ts#suggestSkillInjection`; projection-backed assets continue through `src/skill-engine/recommend.ts` and `src/state-db/projection-writer.ts`. | `tests/workflow-contracts.test.ts` + vitest skills + dependency lint |
| ST-ASSET-06 | 内部資産 drift lint (FR-L1-49、architecture §4.1) | Current hard gate slice is implemented: legacy source/path residue / legacy runtime delegation residue / docs-skills vacancy / guard allowlist missing agent docs → fail-close. Roster capability resolution is covered by ST-ASSET-07 evidence. | vitest `asset-drift` rule (implemented) |
| ST-ASSET-07 | roster↔guard 整合 (Critical-2、function §1.1) | Implemented L7 evidence: `src/runtime/agent-slots.ts#resolveRosterCapability` resolves role/capability from roster snapshots without provider credentials, and guard allowlist drift remains fail-closed through `src/lint/asset-drift.ts`. | `tests/agent-slots.test.ts` U-FR-L1-46 + `tests/asset-drift.test.ts` |
| **ST-ASSET-04 (placeholder、欠番は意図的)** | **各 subcommand / skill recommender / drift 判定の関数仕様** | L6 now has function-level signatures / U-* oracles for the implemented asset-drift slice. Remaining system-test detail for unimplemented roster / skill recommender / command surfaces is **implementation-detail carry**, not a Phase 2 blocker. | A-118 carry: L7/L9 back-fill when roster/skills command surfaces materialize |

### §1.4 ST-EXT (external-if.md 由来 — 境界統合 / degradation)

| ST-ID (候補) | 検証対象 (external-if.md) | 想定シナリオ | 機械検証 (carry) |
|---|---|---|---|
| ST-EXT-01 | AI runtime 境界 DbC (§3) | agent-guard 通過後のみ AI 起動 / invocation_log append | vitest (adapter mock) |
| ST-EXT-02 | fail-close / degradation (§4) | Codex 不在→claude-only / **Claude 不在→codex-only** / 双方不在→standalone (4 execution mode 縮退、function §3.6 整合) | vitest mode 統合 |
| ST-EXT-03 | VCS・CI 境界 (§3) | ローカル gate 証跡 ↔ CI 再実行一致 (NFR-13) | GHA workflow test |
| ST-EXT-04 | adapter 隔離 (§6) | core が provider SDK 直依存しない (intent のみ) | dependency lint |
| ST-EXT-05 | CLI user boundary (§2/§3/§4、PLAN-REVERSE-395) | `ut-tdd --help` / representative subcommands / `--json` command / hard gate failure が、as-is command catalog と終了コード規約 (success=0、validation/gate failure=1、guard block=2) に従う。shell completion はこの catalog を入力にし、存在しない command path を候補化しない | CLI surface smoke + vitest CLI integration |
| ST-EXT-06 | security 境界 (`docs/design/harness/L4-basic-design/security.md` §5-§9、PLAN-L4-29、ZIP-DOC-102 相当) | STRIDE 脅威モデル (§5) の各対策が agent-guard/work-guard/escalation gate として実際に fail-close する / 供給網 (§6) preflight が violation 時に materialize を止める / 秘密非保持 (§7) を secret-scan narrow guard + 横断 scan が補強する / 監査ログ要件 (§8) の記録先が実在する (review_evidence 必須化・foreign-edit-overrides.jsonl) | vitest agent-guard / work-guard / secret-scan / doctor `checkReviewEvidence` (既存) + `PLAN-L6-62` distribution preflight |

## §2 量閉じ一覧 (L4 設計要素 → ST 被覆、孤児チェック)

- data.md §6 不変条件 10 件 → 被覆対応 (m-3 明示): 逆ピラミッド/4-artifact 系 → **ST-DATA-01**、V_MODEL_PAIRS/集約境界系 → **ST-DATA-02**、§7 集約間整合 6 件 → **ST-DATA-03**、state schema↔src/schema 系 → **ST-DATA-04**、**review 前置証跡 (IMP-071、PLAN-L4-06 追加) → ST-DATA-05**、§1.1/§8.1 宣言型 spec IR / DB projection 境界 → **ST-DATA-06** (既存 10 不変条件 + U3 IR 境界を 6 ST に束ねて全数被覆、孤児 0)
- architecture.md §3 依存方向 / §2 品質目標 → ST-ARCH-01〜04
- function.md §3 workflow オーケストレーション (Forward spine + 9 駆動モデル + 2 工程専門) → ST-FUNC-01 (遷移) / ST-FUNC-01b (Forward 合流) / §3.2 routing 優先度 → ST-FUNC-04 / §3.2 mode↔kind → ST-FUNC-05 / §3.1 サインオフ + §3.6 execution mode 別 review tier → ST-FUNC-06 / §3.4 skill (FR-12) → ST-FUNC-07 / §3.6 execution mode degradation → ST-EXT-02 (external-if §4 と共有) / §7 依存 → ST-FUNC-02。孤児 0 (9 駆動 + spine + 工程専門 2 + routing + skill + execution mode 3+1 パターンが全て被覆)
- **function.md §1.1 C12 内部資産 roster/command (FR-L1-46/48) → ST-ASSET-01〜03 / architecture §3 skills (FR-L1-47) → ST-ASSET-05 / architecture §4.1 drift lint (FR-L1-49) → ST-ASSET-06/07 implemented evidence (`src/runtime/agent-slots.ts`, `src/workflow/contracts.ts`, `src/lint/asset-drift.ts`)**
- external-if.md §3 境界 4 / §4 degradation → ST-EXT-01〜04
- external-if.md §2/§3/§4 CLI user boundary (PLAN-REVERSE-395) → ST-EXT-05
- **security.md §5-§9 (脅威モデル/供給網/鍵・秘密/監査ログ、PLAN-L4-29) → ST-EXT-06** (ZIP-DOC-102 相当の security verification 接続、孤児 0 に含める)
- **孤児 (設計要素で ST 未被覆) = 0** を L9 本起票で機械確認する。Current hard evidence is pair-freeze orphan 0 + implemented asset-drift slice + L7 roster/skill/command contract evidence. No active ST-ASSET L7 carry remains in this document.

## §3 trace (④ → ②)

本書の各 ST-* は `docs/design/harness/L4-basic-design/{data,architecture,function,external-if}.md` の設計要素と相互 reference する。**G4 (基本設計ゲート)** で 4 sub-doc 全体 ⇔ 本書 1 doc の pair 宣言を確定し、双方向 trace freeze は G7 (trace freeze) で実施する (L3↔L12 と同型)。

## §4 carry / 次工程

- **L9 本起票**: ST-* 個別ケース (Given-When-Then) の展開 + 量閉じ機械確認。L8 統合テスト設計 (L5↔L8 pair) と整合
- **L7 実装**: 全 ST-* を vitest 統合テスト / GHA workflow に変換 (TDD 強制 FR-02、Red 先行)
- **L8 接続**: 統合テスト設計 (module 間 contract test) は L5 詳細設計 (D-API) 確定後に L8 で展開、L9 はその上位の system test
- **G7 trace freeze**: 4 artifact 双方向 12 edge の凍結時に本書 ST ↔ L4 設計の trace を確定

## §6 G9-WORKFLOW

test_strategy: risk-based system verification tied to L4 basic-design contracts.
test_plan: select ST cases by system behavior family and cross-module workflow risk.
test_conditions: each selected ST case has Given/When/Then and whole-system fixture.
coverage_items: ST-* coverage is mapped to data, architecture, function, asset, and external-boundary families.
test_procedures: run the mapped vitest/doctor/CI commands and capture exit codes.
execution_evidence: system evidence manifest records command, ST IDs, paths, and result.
exit_criteria: all mandatory selected ST cases pass or explicit defer exists.
defect_routing: failed ST cases route to L9 correction, Reverse, Refactor, Recovery, or Incident by scope.
verification_design: system environment, data reality, measurement method, evaluation threshold, and execution procedure are explicit for selected ST-* coverage.

## §7 Engine-swap system acceptance design (PLAN-L4-22〜28)

| ST-ID | whole-system oracle | exit / defect routing |
|---|---|---|
| `ST-ENGINE-01` | source 109→item 163→targetとprofile 8をCLI/DB/doctorで同じidentityとして追跡できる | 不一致はL4/L5設計またはprojection defectへroute |
| `ST-ENGINE-02` | PLAN v1全件をv2 canonical DTOへ変換し、rename/revision/event/evidenceをappend-onlyで説明できる | loss/collision未判断はaccept禁止 |
| `ST-ENGINE-03` | 正規Forward全遷移を通り、各illegal transitionが全surfaceで同じfinding/exitになる | policy誤りはL6、wiring誤りはL7へroute |
| `ST-ENGINE-04` | authored contractからG8-G14 obligationsを生成し、linked verify PLAN/evidence/exit/defect routeを全層で検証する | 欠落層はprogram accept禁止 |
| `ST-ENGINE-05` | baseline全tracked docsをexactly once判断し、最終delta/cross-reference/stale premiseを閉包する | pending/orphan/phantomが1件でもあればL4-25継続 |
| `ST-ENGINE-06` | PlanAsset/FSM/Contract/Disposition/Profile/SelfProofのmodule graph cycle 0、CQS、invalid state生成不能を検証する | 新規違反はmerge blocker、既存はdebt PLAN必須 |
| `ST-ENGINE-07` | 163 item全件でverified 3面または理由付きconditional/NA、partial/gap debt routeを確認する | pendingまたはroute欠落はaccept禁止 |
| `ST-ENGINE-08` | rule/registry/receipt/surface exactly once、mutation survivor 0、正常fixture false-positive 0を独立processで証明する | self-proof無しruleは未統制扱い |

G4 pair-freezeは本節とL4-22〜28を双方向traceし、L5/L8、L6/L7へ順に降下する。system greenだけで
設計判断やsemantic verdictを補完せず、失敗原因が上流contractならReverse、実装ならL7、verification設計ならL9へrouteする。

## §8 Execution Ledger / GitHub system acceptance (PLAN-L4-30、2026-07-15)

| ST-ID | whole-system scenario | acceptance / defect routing |
| --- | --- | --- |
| `ST-EPISODE-01` | 通常ForwardをL0からacceptまで通す | Execution Ledgerは連続するがIssue/PR projectionは0。Issue強制ならL4/L6 defect |
| `ST-EPISODE-02` | block/reject/Reverse/Recovery/Incident/Scrum-PoC/preemptive/deferでForward外へ出る | 全経路が`drive_model`・origin revision・escape reason・reentry target付きIssueへ収束。欠落経路はaccept禁止 |
| `ST-EPISODE-03` | GitHub停止中にForward外作業を進め、復旧後に再送 | Ledger正本を失わず、復旧後Issue/PRが各1件へ収束。二重作成はadapter defect |
| `ST-REENTRY-01` | 駆動モデル内検証からForward再合流まで進める | E6→中間test→certificate→合流→合流後testの順を満たし、両testの片方欠落ではPRを作らない |
| `ST-PRMERGE-01` | 合流後test Greenからdraft PR、cross-provider review、main mergeへ進める | certificate/check/review/PRがexact SHA一致した場合だけmerge。force-push時は再検証 |
| `ST-CLOSURE-01` | merge後main CI、Issue close、学習fact生成まで進める | E15は全後処理成功時だけ到達し、Forward外遷移数をdrive/origin/reason/reentry別に再現できる |

L4↔L9の量閉じ条件は、通常Forward 1系統とForward外の全列挙経路が上表のどれかへexactly once対応し、
GitHub可用性がLedgerの正本性を左右しないこと。検出器はこの設計列挙から生成・検査し、未設計経路を自動創作しない。

## Node control-plane候補system oracle（Issue #152 D0-N）

以下はD0時点では設計候補であり、F0/Q0の対応system testと実装を同一commitへ追加した場合だけ
`ST-NODE-CUTOVER-*`へ昇格する。

| 候補ID | System oracle | Green条件 |
|---|---|---|
| `CAND-NODEBOOT-201` | Bun未導入clean host bootstrap | Windows/Linuxでverified Node imageから`status/doctor/targeted test`完走 |
| `CAND-NODEBOOT-202` | detector self-host | NodeだけでBun ban detectorとgovernance detectorが完走しcoverage欠測0 |
| `CAND-NODEBOOT-203` | runtime process zero | CLI/hook/doctor/test中のBun executable/descendant 0、observer欠測0 |
| `CAND-NODEBOOT-204` | no fallback | Node image欠落・破損・version/revision drift時にBun/tsx/shell起動0 |
| `CAND-NODEBOOT-205` | generation atomicity | crash/same-revision rollback/並行readerでpartial generation観測0。cross-revision rollbackはunsupported |
| `CAND-NODEBOOT-206` | CI aggregate | Node Linux/Windows + harness Linux/Windowsが同一HEAD/run attemptで全Green |
| `CAND-NODEBOOT-207` | slice admission + genesis付き5-state cutover receipt chain | D0 ReviewBundle+BootstrapEnvelope→F0a→F0b→F0c→Q0 SliceAdmission direct ref→genesis reachability、mode別2 lane、kind別typed evidence、fresh CutoverAdmission、負債2件を要求する。wrapper/alias/未定義root/独自issuer key ID、fork、片lane、stale/replay、crash partialを拒否 |
| `CAND-NODEBOOT-208` | final deletion | Bun lock/cache/bootstrap/compatibility codeとproduction allowlistが物理的に0 |
| `CAND-NODEBOOT-209` | live canonical cutover ledger backup | `.ut-tdd/ledger/cutover-ledger.db`書込並行時もonline backupが単一headと全refsの一貫snapshotになる |
| `CAND-NODEBOOT-210` | disaster restore rehearsal | trusted backup復元後のhead、refs、typed objectsが元ledgerとexact一致しchain-only検証Green |
| `CAND-NODEBOOT-211` | migration interruption | 全barrierの失敗注入でschema/data/versionが旧状態へtransaction rollback |
| `CAND-NODEBOOT-212` | cutover DB version incompatibility | cutover DB独自registryが未知newer schemaとdowngradeを起動前に拒否しcanonical bytes不変 |
| `CAND-NODEBOOT-213` | 3 DB boundary / projection rebuild independence | harness projection DB再構築後もcutover DBとPLAN ledger DBのhead/refs/object digestが不変 |

Resource Kernel / Rust companionのsystem oracleは別D0-R/L9 pairが所有する。本節はその未着地を理由に
Node build image、authoring qualification、main正常化をblockしない。

## §9 資源統制Execution Kernelシステムテスト設計（PLAN-L4-32）

本節は `PLAN-L4-32-resource-governed-execution-kernel.md` の L4↔L9 pair であり、
`AC-RGK-01..15` のIDを維持する。D0-R merge gateでactiveなのは
`AC-RGK-01..06/11/12/14/15`であり、resource budget、process-tree custody、capability、terminal receipt、
signed companion bundleだけを実装前の **Red system oracle** として固定する。
`AC-RGK-07..10/13`は要件を削除せずIssue #152 later performance/control-plane waveへ明示deferし、
D0-R merge gateへ含めない。root PIDの終了、`windowsHide`、またはdomain commandのexit 0だけを
active IDのGreen証拠にしてはならない。

### §9.1 AC-RGK Redシステムoracle

全ケースは、最初に未実装または契約違反fixtureで期待どおりRedになることを保存してから実装へ降下する。
正oracleは要求されたsystem outcome、負oracleは一見成功に見える不完全実装を拒否する条件である。

| ST-ID / AC | system fixture / fault | 正oracle (Green条件) | 負oracle (必ずRed) |
|---|---|---|---|
| `ST-RGK-01` / `AC-RGK-01` | budget欠落、負値、無制限値、不正cwd、shell文字列、強制不能policy、managed root生成失敗を各1件投入 | validation/capability拒否は`managed_root_created=false`。control process起動時は別identity/cleanupを保存し、root/custodyなしで固有terminal | managed root生成後validation、control processをroot未生成証拠へ混同、暗黙無制限化、欠測PIDを0で補完 |
| `ST-RGK-02` / `AC-RGK-02` | Windowsでnormal/deadline/cancel、Assign/handoff失敗、worker/companion/custodian/supervisor crash、custodian+supervisor同時喪失、old epoch/nonce replay、nested/breakaway競合を個別注入 | handoff失敗はsuspended PIDを一度もresumeせずreap。単独crashはnonce照合recovery、二者喪失はlast-handle killと独立active 0、欠測は`custody_failure` | commit前user code、stale nonce操作、deadline owner消失、dual crash証拠欠測success、rootだけkill、child残存 |
| `ST-RGK-03` / `AC-RGK-03` | Linuxでclone3経路を実行し、非対応kernel、事後attach fallback、handoff barrier、特権uid/capability、double-fork、broker+通常recovery supervisor dual-crash、old epoch/nonceを注入。macOSへ同じhard要求を投入 | managed root開始前にbroker外durable deadline ownerへattempt/cgroup/deadlineをcommit。dual-crash後も期限内`cgroup.kill`、bounded recovery、`populated=0`、zombie 0、managed orphan 0まで実行する。ownerをarm不能ならroot生成前拒否 | 事後attachをhard custody受理、stale nonce操作、brokerだけがdeadline所有、dual-crash後に欠測findingだけ残してprocess生存、process groupだけでhard custody成功 |
| `ST-RGK-04` / `AC-RGK-04` | wall、CPU、memory、process count、stdout、stderrの各上限を独立に超過 | 超過資源に対応する固有exit kind、要求値、適用値、観測peak、policy revision、termination/reap順序をreceiptに保存し、managed orphan 0 | 全超過を`timeout`へ丸める、観測不能値を要求値で埋める、出力打切り後もprocessが生存 |
| `ST-RGK-05` / `AC-RGK-05` | root先行exit、journal flush失敗、lease解放遅延、terminal transaction/outbox crashを個別注入 | custody空/reap後、`lease_released + finished + sealed receipt`が同一commit position/digestでdurable exactly-once | root exit時finished、terminal片肺、flush前success、lease残存、orphan未確認を0扱い |
| `ST-RGK-06` / `AC-RGK-06` | intent/started/termination-requested各時点でlauncherまたはKernelをcrashし、PID再利用fixtureを混在 | 再起動reconcilerがcustody identityとjournalから未完了attemptを一度だけ収束し、無関係な再利用PIDをkillせず、二重producer・未記録childとも0 | PIDだけで所有判定、同一executionの再実行、未完了attemptのsuccess化、未知childの放置 |
| `ST-RGK-07` / `AC-RGK-07` **DEFERRED** | DB incremental/full rebuild同値性corpus | Issue #152 later performance/control-plane waveでGreen化。本D0-RではID・期待値だけを保持 | D0-Rのmerge判定へ偽Greenとして算入 |
| `ST-RGK-08` / `AC-RGK-08` **DEFERRED** | single-flight互換性、Request/Producer receipt、waiter独立terminal | Issue #152 later performance/control-plane waveでGreen化。本D0-RではID・期待値だけを保持 | D0-Rのmerge判定へ偽Greenとして算入 |
| `ST-RGK-09` / `AC-RGK-09` **DEFERRED** | snapshot CAS identity、hermetic materialize、publish/lease/GC fault | Issue #152 later performance/control-plane waveでGreen化。本D0-RではID・期待値だけを保持 | D0-Rのmerge判定へ偽Greenとして算入 |
| `ST-RGK-10` / `AC-RGK-10` **DEFERRED** | hook/doctor/snapshot/local CI横断のqueue/headroom admission、visible shell 0 | Issue #152 later performance/control-plane waveでGreen化。本D0-RではID・期待値だけを保持 | D0-Rのmerge判定へ偽Greenとして算入 |
| `ST-RGK-11` / `AC-RGK-11` | lifecycle各barrierでcrash/retryし、同一`execution_id`へ複数attemptを発行 | event sequenceはappend-onlyかつ欠番・上書きなし、各`attempt_id`のterminal receiptはexactly-once | mutable status rowをevent/receipt兼用、retryでattempt identityを再利用、terminal eventだけまたはreceiptだけ残存 |
| `ST-RGK-12` / `AC-RGK-12` | capability欠落、probe/journal/token barrier除去、token authenticator/issuer/operation/nonce偽造、spawn/resume lease欠落/変異、Recovery生成variant、shutdown-before-empty、wall jump/restart matrix | 全不足・偽造・token/lease迂回caseでmanaged root 0。valid cleanupはtoken期限後も可能、shutdownはempty/reap後だけ。effective monotonic deadline延長0 | 自己署名token、lease無しattach、Recoveryから生成/resume、running shutdown、clock rollbackで延長、control/root単一boolean化、soft limit縮退 |
| `ST-RGK-13` / `AC-RGK-13` **DEFERRED** | DB canonical digestとCAS完全identityの一要素mutation | Issue #152 later performance/control-plane waveでGreen化。本D0-RではID・期待値だけを保持 | D0-Rのmerge判定へ偽Greenとして算入 |
| `ST-RGK-14` / `AC-RGK-14` | target別bundleへbinary欠落、digest/署名/SBOM/protocol/target/D0-N receipt不一致を一つずつ注入し、旧componentをfloor超の新sequence manifestへ再review・再署名 | 静的不一致はcontrol process起動0。旧manifest復帰は拒否し、新manifestだけがtrust/target/実OS custody oracleを再通過。TS/Rust責務重複0 | 未検証control起動、旧sequence復帰、PATH探索、runtime download、片側rollback、direct spawn fallback、Rust側domain/policy/journal実装 |
| `ST-RGK-15` / `AC-RGK-15` | PR #154 D0-Nのcutover receiptを入力し、native companion/bundle/Cargo差分へBun binary/API/lock/runtime dependencyを一要素ずつ注入 | D0-N prerequisite一致かつnative差分のBun依存増分0 | D0-Rがglobal cutover完了を再判定、またはnative経路へBun依存を追加 |

Issue #124のparent-loss/timeout acceptanceは次の経路別AND matrixで量閉じする。各セルでworker exit、custody empty、
lease release、terminal receipt、managed orphan 0の五条件を同じ`attempt_id`で証明し、別caseの証拠を合成しない。

| route | fault barrier | 必須終端 |
|---|---|---|
| parent loss before worker start | admission後・spawn前 | process生成0、lease release、terminal receipt |
| parent loss after worker start | custody attach・lease取得後 | worker/descendant exit、custody empty、lease release、terminal receipt |
| timeout during preparation | companion-managed preparation fixture内 | producer tree exit、custody empty、lease release、terminal receipt |
| timeout during test execution | `test_start` barrier後 | test tree exit、custody empty、lease release、terminal receipt |

### §9.2 プラットフォーム能力matrix

`required`を強制できないrunnerはskipやbest effortへ縮退せず、当該platformのsystem acceptanceをRedとする。
任意capabilityは代替の最低保証を満たした場合だけ条件付きGreenとし、実際に選択したadapter/capabilityをreceiptへ記録する。

| capability / oracle | Windows | Linux | macOS |
|---|---|---|---|
| process-tree custody (required) | `CREATE_SUSPENDED`、Job attach後resume、非継承handle、nested Job negotiation | cgroup v2へ開始前attach + subreaper + 常駐broker | hard custody要求はunsupportedとして開始前fail-close |
| crash時のcustody維持 (required) | Job handleを所有する常駐custodianと別監督境界を実機fault injection | broker外durable deadline ownerを開始前armし、dual-crash後も期限内`cgroup.kill`→bounded recovery | hard crash-surviving custody要求は開始前fail-close |
| graceful/forced termination | policy指定のgraceful request後にJob全体強制終了 | cgroup配下へgraceful signal後に`cgroup.kill` | root session範囲だけのconditional capability。descendant custody要求では開始前fail-close |
| descendant reap / orphan zero (required) | Job active process 0と独立OS process snapshotの両方 | `cgroup.events populated=0`、subreaperによるzombie 0、独立probe | 同等証明不能のclassificationは開始前fail-close |
| CPU/memory/process budget | Job CPU rate/time、job memory、active process limit。強制不能値はadmission拒否 | cgroup v2ならcpu/memory/pids、無ければ強制可能な組合せのみ受理 | OSで強制可能な上限のみ受理。強制不能なhard要求はadmission拒否 |
| wall/output budget | Kernel monotonic deadline、bounded pipe、Job tree termination | Kernel monotonic deadline、bounded pipe、cgroup tree termination | managed descendantを生成不能とadmissionで証明できるroot-only classificationだけconditional。tree/外部spawn可能性があれば開始前fail-close |
| hidden native launch (required) | native executable+argv、`CREATE_NO_WINDOW`相当、`windowsHide`。暗黙shell 0 | native executable+argv。暗黙shell 0 | native executable+argv。暗黙shell 0 |
| hermetic cache execution **(DEFERRED: AC-RGK-09/13)** | later waveでfilesystem/env/tool allowlist、network deny、access traceを検証 | later waveでnamespace/seccomp等を検証 | later waveでcache利用classificationを検証 |
| platform evidence source | Job identity/accounting、ETWまたはOS process snapshot、journal | cgroup/procfs/process-group snapshot、journal | process-group/kqueueまたはOS process snapshot、journal |

### §9.3 故障注入corpusと同値性

- **process tree**: normal、root early-exit、SIGTERM/terminate無視、child/grandchild増殖、launcher crash、
  Kernel crash、PID再利用、custody attach失敗、journal flush失敗を決定的barrierで注入する。Windowsではさらに
  workerのみ死亡、custodianのみ死亡、Job handle継承試行、nested Job limit競合、breakaway試行を別fixtureで注入し、
  user code開始前拒否または別監督境界からの回収を個別に証明する。
- **budget**: wall/CPU/memory/process/outputを一度に一種類だけ超過させ、複合超過では最初に観測した
  termination causeと全観測値を残す。test自身のhost OOMをoracleにせず、隔離runner内の小さい上限で再現する。
- **DEFERRED — DB equivalence (`ST/AC-RGK-07`)**: create/update/delete/rename、dependency、schema/projector、
  reader/writer競合、canonical typed digest、failure rollbackを含むcorpusはIssue #152 later
  performance/control-plane waveで実行する。
- **DEFERRED — single-flight (`ST/AC-RGK-08`)**: 保証互換key、Request/Producer receipt、waiter cancel/deadline、
  producer crashのcorpusは同later waveで実行する。
- **DEFERRED — CAS identity/fault/hermeticity (`ST/AC-RGK-09/13`)**: tracked/staged/unstaged/untracked overlay、
  submodule/LFS、mode/symlink/EOL、toolchain/env、publish/lease/GC、undeclared access、detached HEAD/test fenceの
  全要件を同later waveで実行する。
- **DEFERRED — control-plane admission (`ST/AC-RGK-10`)**: hook/doctor/snapshot/local CI同時負荷、
  memory headroom、queue deadline、visible shell 0、managed外process 0を同later waveで実行する。

deferred corpusはD0-R merge結果へ算入しないが、後続waveで削除・緩和してよい要件ではない。
後続waveは次の詳細契約をそのまま引き継ぐ。

- `ST-RGK-07`: create/update/delete/rename、dependency edge、schema/projector version、corrupt manifestを含む。
  incrementalとfresh full rebuildをschema/table/column/index/trigger/view identity、PK順、PK無しtableの全column
  canonical sort、NULL/signed integer/IEEE-754 real/UTF-8 text/blobの型tag付きlength framingで比較する。
  reader/writer競合でも単一snapshot revisionを読み、failure時は旧revisionへtransaction rollbackする。
- `ST-RGK-08`: 同一`work_key`でもrevision/deadline/budget/termination/capabilityが保証互換でなければcoalesceしない。
  producerはexactly once、各callerは独立`RequestReceipt`と`coalesced_to`を持ち、waiter cancel/deadlineでproducerを
  誤停止しない。
- `ST-RGK-09/13`: source-selection manifest、tracked/staged/unstaged/untracked overlay、submodule/LFS、lockfile、
  runtime/preparation executable、OS/architecture/filesystem capability、env allowlist、mode/symlink/EOL、
  snapshot schema/policyをidentityへ含める。producer crash、disk full、rename、lease、publish、consumer cancel、
  GC faultでも完全objectだけを公開し、root外file・未宣言env/network/PATH accessを拒否する。
  detached HEAD/test fenceは`subject_revision + CAS key + snapshot seal`を結び、別revision再利用を拒否する。
- `ST-RGK-10`: hook/doctor/snapshot/local CIを同時要求し、memory headroom不足とqueue deadline超過を独立注入する。
  開始前rejectまたはpolicy順queue、managed外process 0、visible shell 0、orphan 0、要求単位receiptを必須にする。

### §9.4 証拠schema

固定70-field相当のflat receiptは採用しない。各attemptは次の最小`RgkEvidenceCoreV1`だけを必須top-levelとし、
詳細はschema-version付きtyped extension artifactへ分離してdigest参照する。coreまたは対象ACが要求するextensionの
欠落・schema不一致・digest不一致はGreenにしない。

| core field | 型 / 必須条件 | oracle用途 |
|---|---|---|
| `schema_version` | `rgk-evidence-core/v1` | parser・migration境界 |
| `oracle_id` | `{st_id, ac_id, fault_id?}` | ST/AC/faultのexact対応 |
| `subject_revision` | immutable revision digest | 検証対象固定 |
| `execution_identity` | `{execution_id, attempt_id}` | retry/recovery分離 |
| `platform_identity` | `{platform, runner_id, adapter_revision}` | 実adapter固定 |
| `spec_digest` | canonical ExecutionSpec + policy revision digest | budget/capability要求固定 |
| `capability_evidence_digest` | `CapabilityEvidenceV1` digest | required/observed/missing、probe、token barrier |
| `process_outcome` | control/workload phaseを分離したclosed union | control processとmanaged rootの非混同 |
| `event_chain_digest` | append-only event range digest | lifecycle順序・crash reconcile |
| `custody_evidence_digest` | `CustodyEvidenceV1` digest | custody identity、handoff、broker外deadline owner、kill/reap/orphan 0 |
| `resource_evidence_digest` | `ResourceEvidenceV1` digest | requested/applied/observed budgetとexit cause |
| `bundle_evidence_digest` | `BundleEvidenceV1` digest | manifest、trust-policy revision、activation floor、D0-N prerequisite、Bun差分0 |
| `independent_probe_digest` | `IndependentProbeV1` digest | PID単独でないorphan 0反証 |
| `terminal_receipt_digest` | sealed ExecutionReceipt digest | exactly-once terminal |
| `oracle_result` | expected/observed/resultのdigest付きclosed result | fault発火とRed/Green判定 |

`process_outcome`はcontrol側`not_created | started | probe_recorded | stopped`とworkload側
`not_created | created_not_started | started | empty_proven | released`を別discriminantで持つ。
`CustodyEvidenceV1`はLinux dual-crash時にdeadline ownerのarmed fact、absolute deadline、
`termination_policy.recovery_grace_ms`、導出したrecovery deadline、`cgroup.kill`時刻、
recovery deadline内の`populated=0`、zombie 0、managed orphan 0を必須にする。欠測findingだけではGreenにしない。
`BundleEvidenceV1`は詳細fieldを維持するが、Node cutover/activationの状態機械を複製せずPR #154 receiptを参照するだけとする。
deferred AC-RGK-07..10/13のDB/CAS/single-flight/control-plane extensionはlater waveで別schema versionとして追加し、
D0-R coreへ空fieldやN/A列を固定しない。secret値とstdout/stderr本文は保存せずbounded artifact digestを用いる。
later waveは少なくとも`DbEquivalenceEvidenceV1`（source/dirty-set/full・incremental digest、transaction outcome）、
`SingleFlightEvidenceV1`（work key、producer/request receipt、compatibility decision、waiter terminal）、
`CasEvidenceV1`（input/key/materialized digest、hit/miss、producer、lease/publish/GC、access trace、test fence）、
`ControlPlaneAdmissionEvidenceV1`（surface、headroom、queue/deadline decision、process/window/orphan observation）を定義し、
それぞれのdigestを後続schemaのcoreから参照する。これらのfieldをD0-RでN/A埋めして検証済みに見せない。

### §9.5 終了条件 / defect routing

D0-R merge gateはactive ID `AC-RGK-01..06/11/12/14/15`が各1件以上のpositive Greenと指定negative Redを持ち、
Windows/Linux required行が実runner evidenceで満たされ、macOS不足capabilityが開始前fail-closeし、managed orphan 0が
Kernel receiptと独立probeの両方で一致した場合だけGreenにする。Linux dual-crashはbroker外deadline ownerが
期限内kill→bounded recovery→reap/orphan 0を完遂することを必須とし、測定不能・証拠欠測だけのfail-closeを代替にしない。

deferred ID `AC-RGK-07..10/13`と§9.6はD0-R merge gateへ算入しない。これらはIssue #152 later
performance/control-plane waveのGreen条件であり、Issue #124全体closeまでには解消する。deferをpassへ読み替えたり、
D0-RがDB/CAS/local CI admissionやNode activationを所有した証拠に使ったりしない。

失敗がL4 contract/capability選択に由来する場合はRedesign、L5/L6境界・method契約ならForward設計差替え、実装不良ならL7、
fault fixtureまたは測定方法の不備ならL9へrouteする。検出器の例外追加やplatform skipで設計要求を縮めてはならない。

### §9.6 Issue #124 性能収束oracle（DEFERRED — #152 later performance/control-plane wave）

Windows/Linuxの各runnerで、同一subject revisionに対するhook/Stop、DB refresh、targeted testのcold/warm attemptを
最低3回ずつ採取し、全attemptが閾値内でなければRedとする。60秒間に20回のStop eventを投入し、producer同時数1以下、各event受付から10秒以内のlease収束、
managed orphan 0、visible shell 0、request帰属processに加えてcustodian/broker/shared DB producerを含むservice全体の
測定開始前30秒間、対象serviceがidleかつqueue/lease 0の時に同じPID/start-key集合を1秒間隔で採取した中央値をbaselineとする。
observer自身は別custodyに置き会計から分離し、そのCPU/memoryも欠測判定用に保存する。会計windowは最初のStop投入`t0`から
最後のlease解放`t_last`まで（最大70秒）とし、tailを切らない。全windowで新規processと既存custodian/broker/shared producerのbaseline超過分を合算し、peak working set 512MiB以下、
20 event合計CPU 30秒以下をversion 1 envelopeとする。各単発attemptも
peak 512MiBとCPU 5秒を超えない。共有serviceへ処理を移してrequest会計から
外すことを禁止し、execution/attempt/work key別帰属値とservice総量の両方をreceiptへ残す。
warm hook/Stopは1回5秒以内かつfull DB rebuildを起動しない。targeted testはcold/warmともWindows 30秒、Linux 20秒以内に
`test_start` barrierへ到達しなければRedとする。runner classのCPU/RAM下限はpolicyに固定し、満たさないrunnerは測定不能を
passにせずadmission拒否する。observer heartbeat、sequence gap、drop count、対象interactive session coverageのいずれかが欠測なら
visible shell 0を主張しない。各runはphase timing、cache decision、producer count、orphan countを保存し、
中央値だけでtail、失敗、欠測を隠さない。runner classまたはpolicy revisionが変わった結果を同一baselineへ混ぜない。

### §9.7 signed bundle trust / anti-rollback system oracle

Windows/Linuxのclean runnerで、bundle外のversioned `TrustDecisionPort`とTS側`BundleActivationPort`をfault injectionする。
companion digest、protocol descriptor、SBOM、target、sequence、D0-N generation receipt digest、manifest署名の一要素差替え、
port欠測、floor未満、同sequence別payloadを全てcontrol process 0かつaccepted fact不変で拒否する。

rollback fixtureは旧manifestを直接再利用しない。旧componentを現在floorより大きい新sequence manifestへ再review・再署名し、
現在D0-N generation receiptとの互換性を含む通常oracleを再通過した場合だけ受理する。trust/activation portの各公開barrierで
faultを注入し、partial accepted factを作らず、旧accepted fact又は利用停止のどちらかへ閉じる。
PKI rotation、secure clock、re-anchor、SQLite等の物理方式はD0-RのGreen条件に含めず、後続installer/release revisionが所有する。
