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

## Node control-plane system oracle（Issue #152 D0-N）

| ID | System oracle | Green条件 |
|---|---|---|
| `ST-NODE-CUTOVER-01` | Bun未導入clean host bootstrap | Windows/Linuxでverified Node imageから`status/doctor/targeted test`完走 |
| `ST-NODE-CUTOVER-02` | detector self-host | NodeだけでBun ban detectorとgovernance detectorが完走しcoverage欠測0 |
| `ST-NODE-CUTOVER-03` | runtime process zero | CLI/hook/doctor/test中のBun executable/descendant 0、observer欠測0 |
| `ST-NODE-CUTOVER-04` | no fallback | Node image欠落・破損・version/revision drift時にBun/tsx/shell起動0 |
| `ST-NODE-CUTOVER-05` | generation atomicity | crash/rollback/並行readerでpartial generation観測0 |
| `ST-NODE-CUTOVER-06` | CI aggregate | Node Linux/Windows + harness Linux/Windowsが同一HEAD/run attemptで全Green |
| `ST-NODE-CUTOVER-07` | cutover ordering | parity receipt無しの旧経路削除、node_primary後fallback、期限なしallowlistを拒否 |
| `ST-NODE-CUTOVER-08` | final deletion | Bun lock/cache/bootstrap/compatibility codeとproduction allowlistが物理的に0 |

Resource Kernel / Rust companionのsystem oracleは別D0-R/L9 pairが所有する。本節はその未着地を理由に
Node build image、authoring qualification、main正常化をblockしない。

## §9 資源統制Execution Kernelシステムテスト設計（PLAN-L4-32）

本節は `PLAN-L4-32-resource-governed-execution-kernel.md` の L4↔L9 pair であり、
`AC-RGK-01..15` を実装前の **Red system oracle** として固定する。対象は単一processではなく、
hook、doctor、DB projection、snapshot、local CIを横断する実行system全体である。root PIDの終了、
一時directoryの削除、`windowsHide`、またはdomain commandのexit 0だけをGreen証拠にしてはならない。

### §9.1 AC-RGK Redシステムoracle

全ケースは、最初に未実装または契約違反fixtureで期待どおりRedになることを保存してから実装へ降下する。
正oracleは要求されたsystem outcome、負oracleは一見成功に見える不完全実装を拒否する条件である。

| ST-ID / AC | system fixture / fault | 正oracle (Green条件) | 負oracle (必ずRed) |
|---|---|---|---|
| `ST-RGK-01` / `AC-RGK-01` | budget欠落、負値、無制限値、不正cwd、shell文字列、強制不能policy、managed root生成失敗を各1件投入 | validation/capability拒否は`managed_root_created=false`。control process起動時は別identity/cleanupを保存し、root/custodyなしで固有terminal | managed root生成後validation、control processをroot未生成証拠へ混同、暗黙無制限化、欠測PIDを0で補完 |
| `ST-RGK-02` / `AC-RGK-02` | Windowsでnormal/deadline/cancel、Assign/handoff失敗、worker/companion/custodian/supervisor crash、custodian+supervisor同時喪失、old epoch/nonce replay、nested/breakaway競合を個別注入 | handoff失敗はsuspended PIDを一度もresumeせずreap。単独crashはnonce照合recovery、二者喪失はlast-handle killと独立active 0、欠測は`custody_failure` | commit前user code、stale nonce操作、deadline owner消失、dual crash証拠欠測success、rootだけkill、child残存 |
| `ST-RGK-03` / `AC-RGK-03` | Linuxでclone3経路を実行し、非対応kernel、事後attach fallback、handoff barrier、特権uid/capability、double-fork、broker/service-manager単独・同時crash、old epoch/nonceを注入。macOSへ同じhard要求を投入 | 最初からcgroup所属し、handoff前user code 0。単独crashはrecovery、同時crashはpersisted identityからkill/reapまたは欠測fail-close。開始caseは`populated=0`、zombie 0 | 事後attachをhard custody受理、stale nonce操作、deadline owner消失、dual crashを無証拠success、process groupだけでhard custody成功 |
| `ST-RGK-04` / `AC-RGK-04` | wall、CPU、memory、process count、stdout、stderrの各上限を独立に超過 | 超過資源に対応する固有exit kind、要求値、適用値、観測peak、policy revision、termination/reap順序をreceiptに保存し、managed orphan 0 | 全超過を`timeout`へ丸める、観測不能値を要求値で埋める、出力打切り後もprocessが生存 |
| `ST-RGK-05` / `AC-RGK-05` | root先行exit、journal flush失敗、lease解放遅延、terminal transaction/outbox crashを個別注入 | custody空/reap後、`lease_released + finished + sealed receipt`が同一commit position/digestでdurable exactly-once | root exit時finished、terminal片肺、flush前success、lease残存、orphan未確認を0扱い |
| `ST-RGK-06` / `AC-RGK-06` | intent/started/termination-requested各時点でlauncherまたはKernelをcrashし、PID再利用fixtureを混在 | 再起動reconcilerがcustody identityとjournalから未完了attemptを一度だけ収束し、無関係な再利用PIDをkillせず、二重producer・未記録childとも0 | PIDだけで所有判定、同一executionの再実行、未完了attemptのsuccess化、未知childの放置 |
| `ST-RGK-07` / `AC-RGK-07` | source種別ごとの変更、削除、rename、schema/projector version更新、manifest破損からなる選択corpus | dirty sourceとtransitive dependentだけ更新し、各caseの全canonical table digestがclean full rebuildと一致。transaction失敗時は旧revisionを保持 | row countだけ比較、非対象tableの全再構築、stale tableをGreen、partial commit、full rebuildを増分と称する |
| `ST-RGK-08` / `AC-RGK-08` | 同一work key要求とrevision/deadline/memory/termination/capabilityを変えた非互換要求を混在 | 保証互換keyはProducerReceipt exactly one、callerごとのRequestReceipt exactly oneと`coalesced_to`を持つ。waiter cancel/deadlineはproducerと独立terminal | producer receiptをcallerへ複製、request receipt欠落、input revisionだけでcoalesce、非互換合流、waiter cancelでproducer誤停止 |
| `ST-RGK-09` / `AC-RGK-09` | CAS hit、miss、producer failure、cancel、publish競合、consumer mutation、GC競合を注入 | hit時producer/preparation起動0。missは検証済objectだけatomic publishし、全失敗経路でpartial object、lease、temp process 0。object digestは不変 | hitでも準備script実行、未検証object公開、失敗lease残存、consumerがCAS本体を変更、実行中objectをGC |
| `ST-RGK-10` / `AC-RGK-10` | hook、doctor、snapshot、local CIを同時要求し、memory headroom不足とqueue deadline超過を注入 | admissionが開始前に拒否またはpolicy順で待機させ、managed外process 0、visible shell 0、orphan 0。各要求に拒否/実行receiptが残る | とりあえず起動後kill、`cmd.exe`/PowerShell/conhostの一瞬表示、直接spawn、拒否要求の証跡欠落 |
| `ST-RGK-11` / `AC-RGK-11` | lifecycle各barrierでcrash/retryし、同一`execution_id`へ複数attemptを発行 | event sequenceはappend-onlyかつ欠番・上書きなし、各`attempt_id`のterminal receiptはexactly-once | mutable status rowをevent/receipt兼用、retryでattempt identityを再利用、terminal eventだけまたはreceiptだけ残存 |
| `ST-RGK-12` / `AC-RGK-12` | required capabilityを一つずつ欠落、空集合、probe/journal/token barrierを各一箇所除去したadapter matrixでadmission | control process/probe事実を別記し、全不足・token不正caseが`managed_root_created=false`の`capability_failure`。probe commandのlauncher call 0 | handshakeだけでexecute、control/rootを単一boolean化、warning、skip、PID polling、soft limitへ暗黙縮退 |
| `ST-RGK-13` / `AC-RGK-13` | DB値型・row順・localeと、untracked/submodule/symlink/mode/EOL/toolchain/envを一要素ずつ変化 | semantic同値DBは同digest、意味差は別digest。CAS identityの意味差は別key、欠落fieldはhit 0 | row count比較、型消失、未追跡入力無視、unknown identityでcache hit |
| `ST-RGK-14` / `AC-RGK-14` | target別bundleへbinary欠落、digest/署名/SBOM/protocol/target不一致、probe差替え、権限不足を一つずつ注入し、既知良好bundleへのrollbackを実行 | 静的不一致はcontrol process起動0、probe不一致はmanaged root 0。rollbackはmanifest単位で対象OS custody oracleを再通過。TS/Rust責務重複0 | 未検証control起動、probe差替え後execute、PATH探索、runtime download、片側rollback、direct spawn fallback、Rust側domain/policy/journal実装 |
| `ST-RGK-15` / `AC-RGK-15` | Bun binary/lockfile/APIを除いたclean checkoutでinstall、doctor、L7-L9、Windows/Linux aggregate CI、Pack acceptanceを実行し、新規Bun依存fixtureを投入 | 全surfaceがNode control plane + Rust companionでGreen、新規Bun依存はlintでRed、tracked Bun実行依存/compatibility code/例外0 | 現CIを消してGreen扱い、Bun不在caseをskip、testだけBun残存、互換期限後もdebt継続、Node parity前に旧経路削除 |

Issue #124のparent-loss/timeout acceptanceは次の経路別AND matrixで量閉じする。各セルでworker exit、custody empty、
lease release、terminal receipt、managed orphan 0の五条件を同じ`attempt_id`で証明し、別caseの証拠を合成しない。

| route | fault barrier | 必須終端 |
|---|---|---|
| parent loss before worker start | admission後・spawn前 | process生成0、lease release、terminal receipt |
| parent loss after worker start | custody attach・lease取得後 | worker/descendant exit、custody empty、lease release、terminal receipt |
| timeout during preparation | snapshot/DB producer barrier内 | producer tree exit、partial publish 0、lease release、terminal receipt |
| timeout during test execution | `test_start` barrier後 | test tree exit、custody empty、lease release、terminal receipt |

### §9.2 プラットフォーム能力matrix

`required`を強制できないrunnerはskipやbest effortへ縮退せず、当該platformのsystem acceptanceをRedとする。
任意capabilityは代替の最低保証を満たした場合だけ条件付きGreenとし、実際に選択したadapter/capabilityをreceiptへ記録する。

| capability / oracle | Windows | Linux | macOS |
|---|---|---|---|
| process-tree custody (required) | `CREATE_SUSPENDED`、Job attach後resume、非継承handle、nested Job negotiation | cgroup v2へ開始前attach + subreaper + 常駐broker | hard custody要求はunsupportedとして開始前fail-close |
| crash時のcustody維持 (required) | Job handleを所有する常駐custodianと別監督境界を実機fault injection | 常駐broker/journal reconcile、`cgroup.kill` | hard crash-surviving custody要求は開始前fail-close |
| graceful/forced termination | policy指定のgraceful request後にJob全体強制終了 | cgroup配下へgraceful signal後に`cgroup.kill` | root session範囲だけのconditional capability。descendant custody要求では開始前fail-close |
| descendant reap / orphan zero (required) | Job active process 0と独立OS process snapshotの両方 | `cgroup.events populated=0`、subreaperによるzombie 0、独立probe | 同等証明不能のclassificationは開始前fail-close |
| CPU/memory/process budget | Job CPU rate/time、job memory、active process limit。強制不能値はadmission拒否 | cgroup v2ならcpu/memory/pids、無ければ強制可能な組合せのみ受理 | OSで強制可能な上限のみ受理。強制不能なhard要求はadmission拒否 |
| wall/output budget | Kernel monotonic deadline、bounded pipe、Job tree termination | Kernel monotonic deadline、bounded pipe、cgroup tree termination | managed descendantを生成不能とadmissionで証明できるroot-only classificationだけconditional。tree/外部spawn可能性があれば開始前fail-close |
| hidden native launch (required) | native executable+argv、`CREATE_NO_WINDOW`相当、`windowsHide`。暗黙shell 0 | native executable+argv。暗黙shell 0 | native executable+argv。暗黙shell 0 |
| hermetic cache execution (cache利用時required) | filesystem/env/tool allowlist、network deny、完全access traceをsandboxで強制 | namespace/seccomp等で同等強制 | 全capabilityを強制できないcache利用classificationは開始前fail-close |
| platform evidence source | Job identity/accounting、ETWまたはOS process snapshot、journal | cgroup/procfs/process-group snapshot、journal | process-group/kqueueまたはOS process snapshot、journal |

### §9.3 故障注入corpusと同値性

- **process tree**: normal、root early-exit、SIGTERM/terminate無視、child/grandchild増殖、launcher crash、
  Kernel crash、PID再利用、custody attach失敗、journal flush失敗を決定的barrierで注入する。Windowsではさらに
  workerのみ死亡、custodianのみ死亡、Job handle継承試行、nested Job limit競合、breakaway試行を別fixtureで注入し、
  user code開始前拒否または別監督境界からの回収を個別に証明する。
- **budget**: wall/CPU/memory/process/outputを一度に一種類だけ超過させ、複合超過では最初に観測した
  termination causeと全観測値を残す。test自身のhost OOMをoracleにせず、隔離runner内の小さい上限で再現する。
- **DB equivalence**: create/update/delete/rename、依存edge変更、schema/projector version変更、corrupt manifestを含む
  corpusについて、incremental DBとfresh full rebuildをschema/table/column/index/trigger/view identity、primary-key順、
  PK無しtableの全column canonical sort、SQLiteのNULL/signed integer/IEEE-754 real（NaN/Infinity/-0を含む）/UTF-8 text/blobの
  型tagとbyte表現をlength framingしたdigestで比較する。reader transaction中にwriterをcommitさせるfixtureでも一つの
  snapshot revisionだけを読むことを証明し、異なるrevisionのrowを混在させない。timestamp、temporary path、row order等の非意味値は
  schema宣言済normalizerだけで除外し、列自体を暗黙に比較から落とさない。
- **CAS identity**: source-selection manifest、tracked tree、staged/unstaged/untracked fixture、submodule/LFS、lockfile、
  runtime/preparation executable、OS/architecture/filesystem capability、env allowlist、mode/symlink/EOL、snapshot schema、
  preparation policyの各要素を一つずつ変え、意味差は必ず別keyになることを検証する。manifest外の巨大生成物は走査せず、
  manifest外に必要fixtureが現れたcaseはhitでなくfindingとする。同一semantic inputは列挙順に依存せず同じkeyとなる。
- **CAS fault**: producer crash、disk full、atomic rename失敗、lease timeout、publish競合、consumer cancel、GC競合を
  注入し、公開済みobject集合が「fault前の完全object」または「検証済み新object」のどちらかだけになることを確認する。
- **CAS overlay/hermeticity**: staged/unstaged/untrackedの同一path差、delete/rename/type-change、case-fold collisionを順序付きreducerへ
  入れ、canonical final-tree manifestと実materialize treeをbyte比較する。sandbox内producerにroot外file、未宣言env、network、ambient
  PATH toolを読ませ、全てdeny + hit取消 + findingになることを確認する。宣言access policy/tool digestの変更は別key、同じ宣言下の
  観測traceはkeyでなくreceiptへ結び、宣言外accessを含むtraceではartifact無効化になることを確認する。
- **detached HEAD / test fence**: snapshot準備中にsource working treeとbranch tipを更新しても、materialize対象はreceiptの
  `subject_revision`と一致するdetached HEADから動かないことを確認する。test processへ渡すfence tokenはsubject SHA、CAS key、
  snapshot sealを結び、欠落・不一致・準備後のmutationではtest開始前に拒否する。cache hitや増分DBが別revisionのfenceを
  再利用したcase、detached HEAD外pathを参照したcaseを負oracleとしてRedにする。

### §9.4 証拠schema

各 `ST-RGK-*` attemptはcontrol側`control_not_created | control_started | probe_recorded | control_stopped`と、workload側
`root_not_created | root_created_not_started | root_started | empty_proven | released`の直積でoutcomeを保存する。
単一`process_created`への縮退、各variantの必須field欠落、subject revision不一致、
後付け集計だけのorphan 0はGreenにしない。secret値とstdout/stderr本文は保存せず、bounded artifact digestを用いる。

| field | 型 / 必須条件 | oracle用途 |
|---|---|---|
| `schema_version`, `st_id`, `ac_id`, `execution_id`, `attempt_id` | non-empty、固定version | 論理要求、oracle、attemptのexactly-once対応 |
| `subject_revision`, `working_delta_digest`, `input_revision` | immutable digest | 検証対象とDB/CAS identityの固定 |
| `platform`, `runner_id`, `adapter`, `capabilities`, `capability_decision` | OS/version/adapter revision/要求・強制可否・不足集合 | capability matrixの実選択証明 |
| `control_process_created`, `control_process_identity`, `control_phase`, `control_cleanup` | verified companion/custodian/brokerの生成事実。未生成は理由付きN/A | probe実行主体とmanaged root未生成を混同しない |
| `managed_root_created`, `managed_root_identity`, `workload_phase` | 利用者command rootの生成事実。control processとは独立必須 | admission前workload 0、created-not-started、startedの区別 |
| `probe_digest`, `probe_journal_position`, `admission_token_digest` | probe実行時必須。tokenはattempt/nonce/bundle/probe/deadline結合 | probe→durable append→admission barrierの順序証明 |
| `authority_identity`, `authority_epoch`, `custody_nonce`, `handoff_commit`, `deadline_owner` | custody生成時必須。dual crash時もlast durable valueを保存 | atomic handoff、stale replay拒否、deadline継続の証明 |
| `bundle_manifest_digest`, `core_digest`, `companion_digest`, `protocol_digest`, `target_triple`, `sbom_digest`, `signature_identity`, `rollback_from` | native companion利用時必須。rollback無しは理由付きN/A | AC-RGK-14の完全bundle identity、供給網検証、片側rollback禁止 |
| `control_plane_runtime`, `bun_dependency_inventory`, `migration_debt_revision`, `compatibility_deadline` | runtime identityとtracked Bun依存件数。Bun撤去後も0件証拠を保存 | AC-RGK-15のNode parity、永久BAN、期限付き撤去証明 |
| `spec_digest`, `policy_revision`, `requested_budget`, `applied_budget` | canonical specと単位付き上限 | 暗黙緩和・自己申告の検出 |
| `journal_events`, `terminal_receipt_digest` | monotonic sequenceとevent digest、terminal封印回数 | lifecycle順序、exactly-once receipt、crash reconcile、flush証明 |
| `custody_identity`, `custodian_or_broker_identity`, `root_pid`, `descendant_observations` | started時必須。created-not-startedはPID/reapと作成済みcustody、未作成は理由付きN/A | PID単独でない所有権・process tree証明 |
| `phase_timing`, `resource_observations` | 各phase start/end/duration、wall/CPU/peak memory/process/outputと測定source | 固定準備費、budget cause、実測値の照合 |
| `exit_kind`, `native_exit`, `managed_orphan_count`, `reap_result` | native_exit/orphan/reapはmanaged root created/started時必須。root未作成は理由付きN/A | termination outcomeとorphan zero |
| `journal_flush_receipt`, `released_leases` | durable position/digest、lease ID一覧 | root exit後の完了barrier証明 |
| `db_receipt` | DB phase実行時必須。未実行は理由付き`not_applicable` | AC-RGK-07/08同値性とrollback |
| `cas_receipt` | CAS phase実行時必須。未実行は理由付き`not_applicable` | AC-RGK-08/09 identityとsingle-flight |
| `admission_receipt` | concurrency key、headroom、decision、queue/deadline | AC-RGK-01/10の開始前判定 |
| `independent_probe` | probe tool/revision、PID+start key+sentinel/custody event、連続process create/exit stream、Windows WinEvent/ETW CREATE/SHOW stream、collector heartbeat/sequence/drop count/interactive-session coverage、artifact snapshot | 瞬間window・lineage離脱・観測欠測を含む独立反証。gap/drop/対象session未観測ならGreen禁止 |
| `fault_id`, `fault_barrier`, `oracle_result` | 注入位置、期待/実測、Red/Green | faultが実際に発火したことの証明 |

### §9.5 終了条件 / defect routing

`AC-RGK-01..15`が各1件以上のpositive Greenと、表で指定したnegative Redを持ち、Windows/Linuxのrequired行が
実runner evidenceで満たされ、macOSの不足capabilityがfail-closeし、managed orphan 0がKernel receiptと独立probeの両方で一致した場合だけ
L9をGreenにする。DBは全corpusでincremental/full digest一致、CASはidentity分離・single-flight・fault atomicityの
全てを満たし、さらに§9.6 performance convergence oracleの全run/envelopeをGreenにすること。未実装・runner不足・測定不能はpassではなくRedまたは明示deferであり、PLAN-L4-32のconfirmed条件や
Issue #124 close条件を満たさない。

失敗がL4 contract/capability選択に由来する場合はRedesign、L5/L6境界・method契約ならForward設計差替え、実装不良ならL7、
fault fixtureまたは測定方法の不備ならL9へrouteする。検出器の例外追加やplatform skipで設計要求を縮めてはならない。

### §9.6 Issue #124 性能収束oracle

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
