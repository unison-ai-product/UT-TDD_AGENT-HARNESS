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

### §7.1 Repository Document Ledger system oracle (PLAN-L4-25)

| ST-ID | Given / When | system oracle | 負例・exit |
|---|---|---|---|
| `ST-DOCSEM-01` | 固定Git commitの全tracked repository documentsをzone別baseline captureする | commit/root tree/selection digest、zone別tree/member/path digest/countが再現し、OS/working tree差で変化しない。921は`docs_tree`だけ | 必須zone欠落、未分類文書、working tree採取、改行join、baseline上書きはfail |
| `ST-DOCSEM-02` | baseline recordとexactly-one decision付きexplicit add/modify/delete/rename deltaからfinalを構築する | baseline/decision/delta chain/replay exactly once、final tracked path/blob exactly once、missing/duplicate/phantom/case-fold collision 0 | 自己申告decision、snapshot未束縛、renameをGit heuristicで推測、未台帳/illegal/chain改竄delta、final path/blob不一致はfail |
| `ST-DOCSEM-03` | 各recordのmeaningを評価する | responsibility/audience/input/consumer/canonical assertionが揃い、keyword hitでなくtarget実体と比較できる | 意味欠落、archive文を現行assertion化、存在だけのsubstance greenはfail |
| `ST-DOCSEM-04` | profile/capability/reference文書のapplicabilityを判定する | 条件、観測値、理由、decider、再評価triggerが揃い、未評価とNAを区別する | target slot不在、条件未評価、理由なしNAをclosedにしない |
| `ST-DOCSEM-05` | authorityとdispositionを適用する | 責務ごとのcanonical 1件、全referenceにも処置あり、update/merge/supersede/archive/retain/NAの後条件を満たす | referenceを処置として使用、generated view手編集、重複canonical、target/PLAN欠落はfail |
| `ST-DOCSEM-06` | 全final docのtyped referencesを解析する | path/anchor/PLAN full ID/spec/test/supersessionとsemantic responsibilityが一意に解決する | parse error→edge 0、anchor欠落、短縮PLAN多義、supersession cycle、archiveへのcanonical inboundはfail |
| `ST-DOCSEM-07` | merge/supersede/rename/delete後にclosureを実行する | stale inbound 0、semantic mismatch 0、applicability conflict 0、orphan 0。集合digestを同一receiptへ束縛する | path存在だけ、旧path inbound残存、source/target意味不一致はfail |
| `ST-DOCSEM-08` | A-187 findingをledgerへ移し再判定する | claim-only/slot不在/partialはopenを維持し、security等は適用後blob+L9 pairでのみ解消。catalog doneとpending_review競合はpending | catalog status、keyword、テスト件数だけでfindingをclosedにしない |

`ST-DOCSEM-01..08`の全mandatory caseが同一final snapshotに対してpassし、closure receiptの
`pending/missing/duplicate/phantom/semantic_mismatch/orphan/stale_inbound`が全て0の場合だけ
`ST-ENGINE-05`をpassとする。検証器がL4 record field、disposition、targetを生成した場合は検証不能でありfailとする。

### Repository docs closure system oracle (PLAN-L6-74)

| ST-ID | whole-system scenario | acceptance / defect routing |
|---|---|---|
| `ST-DOCLEDGER-01` | commit済みbaselineからsnapshotを取得し、全tracked repository docsをmaterializeしてCLI/DB/doctor/reportを通す | 同一commit/tree/snapshot digestでpath exactly once、pending/orphan/phantom/delta 0。数量だけ一致する別treeは拒否 |
| `ST-DOCLEDGER-02` | baseline後に文書add/modify/delete/rename、broken link、anchor削除、canonical本文差替えを同時に行う | 全変異をtyped findingとして検出し、未台帳/illegal/chain改竄delta又はstale assertionが一件でもあればprogram accept禁止 |
| `ST-DOCLEDGER-03` | blocking findingをdebt PLANへrouteし、続いてsnapshot又はfinding payloadを変更する | 初回routeはfindingを隠さずblockedを維持し、変更後はroute staleとして再審査を要求。route済みを完了へ読み替えない |
| `ST-DOCLEDGER-04` | DB projectionと過去reportを削除して同一Git treeからrebuildし、全surfaceのclosure結果を比較する | identity/finding/route requirement/exitが再現し、working tree又はDBから不足判断を補完しない。差はL6 contract、L7 wiring、L9 oracleへ分離route |
| `ST-DOCLEDGER-05` | Green projectionがある状態でparse/FK/write/swap faultを順次注入し、archive/history/fixtureを含む全zoneを再評価する | 任意faultで旧Green projectionとauthoring sourceを保持し、部分commit 0。旧語の単純存在を許容しつつ、canonical authorityのlegacy逆流だけをfail-closeする |

`ST-DOCLEDGER-01..05`は実装前TDD Redである。`ST-ENGINE-05`の集約文だけ、既存baseline receipt、
又はreference件数0を本oracleのGreen証拠にしない。

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
