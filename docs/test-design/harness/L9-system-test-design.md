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
| ST-FUNC-01 | 駆動モデル end-to-end 遷移 (§3.1、9 種) | 各駆動モデルが入口 signal で発動 → 固有 phase/step を経て → 出口 contract を満たす (例: Discovery S0→S4 で confirmed=verify 成功必須 / Reverse R0→R4 で forward_routing 確定) | vitest workflow 統合 (L7) |
| ST-FUNC-01b | Forward spine 合流 contract (§3.1 出口列) | 各駆動モデルの出口が**正しい Forward L 工程へ合流** (Reverse=L1/L3/L4/L5/gap-only の 5値 / Scrum は L8-L14 へ合流不可=IMP-044 / Refactor=L7 内部完結で L1/L4 不変) | vitest workflow 統合 |
| ST-FUNC-02 | 機能間依存 (§7) | plan draft→hook→registry / gate→trace→detector の連鎖 | vitest 統合 |
| ST-FUNC-03 | TDD 強制 (FR-02、§2 sprint) | Red→Green→refactor 順序 + 本体先行で fail-close | vitest 統合 |
| ST-FUNC-04 | signal→mode routing 優先度 (§3.2、FR-08) | 競合 signal で **Incident>Recovery>Reverse>Refactor** の優先度で routing (例: env=prod 障害 + drift 同時 → Incident 優先) / interrupt 4 分岐 | vitest routing |
| ST-FUNC-05 | mode↔kind 非1:1 (§3.2) | Discovery/Scrum が同一 kind=poc で mode 識別 / Incident が troubleshoot+recovery の 2 PLAN に分割 (recovery.requires に troubleshoot 宣言) / Add-feature が add-design+add-impl | vitest 統合 (frontmatter + dependencies) |
| ST-FUNC-06 | 人間サインオフ + execution mode 別 review tier (§3.1/§3.6) | Recovery=tl+po / Incident=オンコール+tl+pm / Retrofit config_drift=tl のサインオフ無しに exit させない (fail-close、mode-invariant)。**判断ゲートの review tier が execution mode で縮退** (hybrid=cross-agent / claude-only・codex-only=intra_runtime_subagent hard / standalone=人間必須)、`ut-tdd gate` が status mode を参照し self-review が cross-agent に化けない | vitest `gate-review-tier.test.ts` + CLI `ut-tdd gate` smoke (mode 別) |
| ST-FUNC-07 | skill 文脈注入 (§3.4、FR-12) | `skill suggest` が PLAN context (kind/layer/drive) から ranked 推挙 + 注入規約を返し、**全 skill を常時ロードしない** (必要 step のみ注入) | vitest skill (L7) |

> 個別 FR の AC レベル受入は L12 受入テスト (AT-*) が担う。L9 は **複数 FR/module をまたぐ統合挙動**を対象 (L12 との責務分界)。駆動モデルの状態遷移 pseudocode / CLI signature は L4 §3.6 で L5/L6 へ defer のため、ST-FUNC は **system 粒度の遷移成立・合流先・優先度・サインオフ**を対象 (関数粒度の単体は L7 U-* が担う)。

### §1.3.1 ST-ASSET (function.md §1.1 由来 — 内部資産 roster/command system 挙動、A-85)

> L4=L9 総合テスト粒度で**書ける範囲のみ**。関数粒度 (各 subcommand signature / capability resolver アルゴリズム) は仕様未確定のため **placeholder + 依存明示** (back-fill 対象、§4)。

| ST-ID (候補) | 検証対象 (function §1.1) | 想定シナリオ (system 粒度) | 機械検証 (carry) |
|---|---|---|---|
| ST-ASSET-01 | roster registry SSoT (FR-L1-46) | `.claude/agents/*.md` (層1) を roster が読み、全 subagent が roster metadata に登録される (孤児 subagent = 0) | vitest roster (L7) |
| ST-ASSET-02 | roster ↔ guard allowlist 整合 | roster の allowlist と agent-guard enforcement が一致 (二重定義・乖離 0、不一致→fail-close) | vitest 統合 (agent-guard 既存 + roster) |
| ST-ASSET-03 | 内部資産 command end-to-end (FR-L1-48) | `ut-tdd roster list/check` / `ut-tdd asset` が system として動く | vitest CLI 統合 |
| ST-ASSET-05 | skills building block (FR-L1-47、architecture §3) | Implemented L7 evidence: `src/workflow/contracts.ts#catalogSkills`, `src/workflow/contracts.ts#recommendSkills`, and `src/workflow/contracts.ts#suggestSkillInjection`; projection-backed assets continue through `src/skills/recommend.ts` and `src/state-db/projection-writer.ts`. | `tests/workflow-contracts.test.ts` + vitest skills + dependency lint |
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

## §2 量閉じ一覧 (L4 設計要素 → ST 被覆、孤児チェック)

- data.md §6 不変条件 10 件 → 被覆対応 (m-3 明示): 逆ピラミッド/4-artifact 系 → **ST-DATA-01**、V_MODEL_PAIRS/集約境界系 → **ST-DATA-02**、§7 集約間整合 6 件 → **ST-DATA-03**、state schema↔src/schema 系 → **ST-DATA-04**、**review 前置証跡 (IMP-071、PLAN-L4-06 追加) → ST-DATA-05** (10 不変条件を 5 ST に束ねて全数被覆、孤児 0)
- architecture.md §3 依存方向 / §2 品質目標 → ST-ARCH-01〜04
- function.md §3 workflow オーケストレーション (Forward spine + 9 駆動モデル + 2 工程専門) → ST-FUNC-01 (遷移) / ST-FUNC-01b (Forward 合流) / §3.2 routing 優先度 → ST-FUNC-04 / §3.2 mode↔kind → ST-FUNC-05 / §3.1 サインオフ + §3.6 execution mode 別 review tier → ST-FUNC-06 / §3.4 skill (FR-12) → ST-FUNC-07 / §3.6 execution mode degradation → ST-EXT-02 (external-if §4 と共有) / §7 依存 → ST-FUNC-02。孤児 0 (9 駆動 + spine + 工程専門 2 + routing + skill + execution mode 3+1 パターンが全て被覆)
- **function.md §1.1 C12 内部資産 roster/command (FR-L1-46/48) → ST-ASSET-01〜03 / architecture §3 skills (FR-L1-47) → ST-ASSET-05 / architecture §4.1 drift lint (FR-L1-49) → ST-ASSET-06/07 implemented evidence (`src/runtime/agent-slots.ts`, `src/workflow/contracts.ts`, `src/lint/asset-drift.ts`)**
- external-if.md §3 境界 4 / §4 degradation → ST-EXT-01〜04
- **孤児 (設計要素で ST 未被覆) = 0** を L9 本起票で機械確認する。Current hard evidence is pair-freeze orphan 0 + implemented asset-drift slice + L7 roster/skill/command contract evidence. No active ST-ASSET L7 carry remains in this document.

## §3 trace (④ → ②)

本書の各 ST-* は `docs/design/harness/L4-basic-design/{data,architecture,function,external-if}.md` の設計要素と相互 reference する。**G4 (基本設計ゲート)** で 4 sub-doc 全体 ⇔ 本書 1 doc の pair 宣言を確定し、双方向 trace freeze は G7 (trace freeze) で実施する (L3↔L12 と同型)。

## §4 carry / 次工程

- **L9 本起票**: ST-* 個別ケース (Given-When-Then) の展開 + 量閉じ機械確認。L8 統合テスト設計 (L5↔L8 pair) と整合
- **L7 実装**: 全 ST-* を vitest 統合テスト / GHA workflow に変換 (TDD 強制 FR-02、Red 先行)
- **L8 接続**: 統合テスト設計 (module 間 contract test) は L5 詳細設計 (D-API) 確定後に L8 で展開、L9 はその上位の system test
- **G7 trace freeze**: 4 artifact 双方向 12 edge の凍結時に本書 ST ↔ L4 設計の trace を確定
