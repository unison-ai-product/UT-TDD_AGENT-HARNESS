---
layer: L9
artifact_type: test_design
status: draft
pair_artifact: docs/design/harness/L4-basic-design/
parent_doc: docs/plans/PLAN-L4-00-master.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l4_data: docs/design/harness/L4-basic-design/data.md
related_l4_architecture: docs/design/harness/L4-basic-design/architecture.md
related_l4_function: docs/design/harness/L4-basic-design/function.md
related_l4_external_if: docs/design/harness/L4-basic-design/external-if.md
next_pair_freeze: L4
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-29
updated: 2026-05-29
---

# UT-TDD Agent Harness — L9 総合テスト設計 (④ / ST-*)

> **layer**: L9 (総合/システムテスト設計) / **artifact**: ④ テスト設計 (W-model 右、② L4 基本設計 全 sub-doc と対)
> **pair (W-model L4↔L9)**: `docs/design/harness/L4-basic-design/{data,architecture,function,external-if}.md` 4 sub-doc 全体 ↔ 本書 1 doc
> **status**: draft (placeholder skeleton — L4 設計確定に伴い pair を物質化。ST-* 詳細は L9 本起票で展開、L3↔L12 と同型)
> **PLAN**: `docs/plans/PLAN-L4-{01..04}-*.md` の pair_artifact / DoD で本書参照

## §0 量閉じ原則 (L4 ↔ L9)

L4 基本設計の各設計要素が L9 総合テスト (ST-*) で被覆されること (孤児 = 0)。

- **data.md**: 5 集約の不変条件 (§6) / 集約間整合 (§7) / state schema (§8) → 整合性 ST 必須
- **architecture.md**: building block 依存方向 (§3、schema 一方向・循環禁止) / fail-close (§2/§5) / hook 配線 (§6) → 統合 ST 必須
- **function.md**: CLI コマンド (§2) / 11 mode workflow (§3) / 機能間依存 (§7) → end-to-end ST 必須
- **external-if.md**: 境界 DbC (§3) / 失敗時 degradation (§4) / adapter (§6) → 境界統合 ST 必須
- 孤児 = 0 (機械検証は L7 で `ut-tdd vmodel lint` / trace check に接続)

## §1 総合テスト (ST-*) — placeholder skeleton

> 本節は L4 設計要素から導出する ST カテゴリの骨格。個別 ST ケース (Given-When-Then) は L9 本起票で展開する。

### §1.1 ST-DATA (data.md 由来 — 集約整合 / state schema)

| ST-ID (候補) | 検証対象 (data.md) | 想定シナリオ | 機械検証 (carry) |
|---|---|---|---|
| ST-DATA-01 | 逆ピラミッド禁止不変条件 (§6) | design+impl 存在で test_design+test_code 不在 → G6/G7 fail-close | vitest 統合 (L7) |
| ST-DATA-02 | W_MODEL_PAIRS 不変条件 (§6) | pair が 6 組外 → 検出 | vitest |
| ST-DATA-03 | 集約間整合 (§7、artifact.trace↔plan.generates) | 不整合 → doctor 検出 | vitest doctor |
| ST-DATA-04 | state schema ↔ src/schema 突合 (§8) | enum 齟齬 → doctor check_business_entity_coverage | vitest doctor |

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
| ST-FUNC-01 | 11 mode workflow (§3) | Forward/Reverse/Discovery/Incident/Recovery/Refactor/Retrofit/Add-feature/Scrum/Research + 工程専門 2 の end-to-end 遷移 | vitest workflow 統合 (L7) |
| ST-FUNC-02 | 機能間依存 (§7) | plan draft→hook→registry / gate→trace→detector の連鎖 | vitest 統合 |
| ST-FUNC-03 | TDD 強制 (FR-02、§2 sprint) | Red→Green→refactor 順序 + 本体先行で fail-close | vitest 統合 |
| ST-FUNC-04 | mode routing (FR-08) | drift/劣化/暴走/障害 → 優先度 routing | vitest routing |

> 個別 FR の AC レベル受入は L12 受入テスト (AT-*) が担う。L9 は **複数 FR/module をまたぐ統合挙動**を対象 (L12 との責務分界)。

### §1.4 ST-EXT (external-if.md 由来 — 境界統合 / degradation)

| ST-ID (候補) | 検証対象 (external-if.md) | 想定シナリオ | 機械検証 (carry) |
|---|---|---|---|
| ST-EXT-01 | AI runtime 境界 DbC (§3) | agent-guard 通過後のみ AI 起動 / invocation_log append | vitest (adapter mock) |
| ST-EXT-02 | fail-close / degradation (§4) | Codex 不在→claude-only / 双方不在→standalone | vitest mode 統合 |
| ST-EXT-03 | VCS・CI 境界 (§3) | ローカル gate 証跡 ↔ CI 再実行一致 (NFR-13) | GHA workflow test |
| ST-EXT-04 | adapter 隔離 (§6) | core が provider SDK 直依存しない (intent のみ) | dependency lint |

## §2 量閉じ一覧 (L4 設計要素 → ST 被覆、孤児チェック)

- data.md §6 不変条件 9 件 → ST-DATA-01〜04 (集約) / §7 整合 6 件 → ST-DATA-03
- architecture.md §3 依存方向 / §2 品質目標 → ST-ARCH-01〜04
- function.md §3 11 mode / §7 依存 → ST-FUNC-01〜04
- external-if.md §3 境界 4 / §4 degradation → ST-EXT-01〜04
- **孤児 (設計要素で ST 未被覆) = 0** を L9 本起票で機械確認 (現 placeholder は骨格宣言まで)

## §3 trace (④ → ②)

本書の各 ST-* は `docs/design/harness/L4-basic-design/{data,architecture,function,external-if}.md` の設計要素と相互 reference する。**G4 (基本設計ゲート)** で 4 sub-doc 全体 ⇔ 本書 1 doc の pair 宣言を確定し、双方向 trace freeze は G7 (trace freeze) で実施する (L3↔L12 と同型)。

## §4 carry / 次工程

- **L9 本起票**: ST-* 個別ケース (Given-When-Then) の展開 + 量閉じ機械確認。L8 統合テスト設計 (L5↔L8 pair) と整合
- **L7 実装**: 全 ST-* を vitest 統合テスト / GHA workflow に変換 (TDD 強制 FR-02、Red 先行)
- **L8 接続**: 統合テスト設計 (module 間 contract test) は L5 詳細設計 (D-API) 確定後に L8 で展開、L9 はその上位の system test
- **G7 trace freeze**: 4 artifact 双方向 12 edge の凍結時に本書 ST ↔ L4 設計の trace を確定
