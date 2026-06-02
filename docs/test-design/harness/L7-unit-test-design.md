---
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: draft
pair_artifact: docs/design/harness/L6-function-design/
parent_doc: docs/plans/PLAN-L6-00-master.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l6_function_spec: docs/design/harness/L6-function-design/function-spec.md
related_l6_edge_case: docs/design/harness/L6-function-design/edge-case.md
next_pair_freeze: L6
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-29
updated: 2026-05-29
---

# UT-TDD Agent Harness — L7 単体テスト設計 (④ / U-*)

> **layer**: L7 (単体テスト設計 — 実装スプリント内で TDD Red 先行) / **artifact**: ④ テスト設計 (V-model 右、② L6 機能設計 と対)
> **pair (V-model L6↔L7)**: `docs/design/harness/L6-function-design/{function-spec,edge-case}.md` 2 sub-doc ↔ 本書 1 doc
> **status**: draft (placeholder skeleton — L6 機能設計確定に伴い pair を物質化。U-* 詳細は L7 entry (TDD Red) で展開)
> **PLAN**: `docs/plans/PLAN-L6-{01,02}-*.md` の pair_artifact / DoD で本書参照
> **特殊性**: L6↔L7 は最短ペア。L7 は単体テスト設計と実装スプリントが同層 — 本書 U-* は L7 entry で先行 ④ テストコード (TDD Red、§1.10 line 671) に変換される oracle。

## §0 量閉じ原則 (L6 ↔ L7)

L6 機能設計の各**関数 signature + DbC + edge** が L7 単体テスト (U-*) で被覆されること (孤児 = 0)。DbC 契約から test oracle を導出 (document-system-map §3)。

- **function-spec §1/§2**: 関数 signature + pre/post + pseudocode → 契約遵守 U-* 必須
- **function-spec §4**: rule engine 10 型 (IMP-033) → rule 単位 U-* 必須
- **edge-case**: `@edge-normal/error/boundary/throws` (4 観点) → edge 単位 U-* 必須
- 孤児 = 0 (`ut-tdd vmodel lint` の edge 5-8 照合に接続)

## §1 単体テスト (U-*) — placeholder skeleton

> L7 = 個別関数の **単体**を対象 (最小単位、純粋関数中心)。既存 vitest 66 test が seed (analyzeX/evaluateAgentGuard/detectMode/frontmatter)。個別 U ケースは L7 entry で展開。

### §1.1 U-FUNC (function-spec §1 関数 signature 由来)
| U-ID (候補) | 検証対象 | oracle (DbC) |
|---|---|---|
| U-FUNC-01 | `analyzeX` 純粋性 + post (orphans/totals) | 同入力→同出力、orphans==[]⟺ok (既存 seed) |
| U-FUNC-02 | `evaluateAgentGuard` allowlist/model/family | block 判定 + fail-close (既存 seed) |
| U-FUNC-03 | `detectMode` mode 決定 | mode∈4種、副作用なし (既存 seed) |
| U-FUNC-04 | `lintPlan`/`lintVmodel` 本実装 | frontmatter validate / 12 edge (stub→本、L7.2/L7.3) |

### §1.2 U-CORE (function-spec §2 pseudocode 由来)
| U-ID (候補) | 検証対象 | oracle |
|---|---|---|
| U-CORE-01 | `planDraft` pseudocode (§2.1) | pre 違反→exit1 / 原子性 (失敗時 file 不変) |
| U-CORE-02 | `runGate` 決定論 (§2.2) | AI 非依存、V-model 順序 / 証跡生成 |
| U-CORE-03 | `traceCheck` 12 edge (§2.3) | 孤児→fail-close exit1 |
| U-CORE-04 | `sprintCheck` Red-first (§2.4) | Red commit precedes Green |

### §1.3 U-RULE (function-spec §4 IMP-033 rule engine 由来)
| U-ID (候補) | 検証対象 | oracle |
|---|---|---|
| U-RULE-01 | 10 rule 型 各純粋関数 | pair-exists/ref-resolves/trace-bidir/... 各 RuleResult |
| U-RULE-02 | auto-enroll (§4.3) | frontmatter scan → 該当 rule 自動適用 |
| U-RULE-03 | 既存 5 lint の rule 吸収 | g3-trace 等が rule インスタンスとして等価 |

### §1.4 U-EDGE (edge-case 由来)
| U-ID (候補) | 検証対象 | oracle |
|---|---|---|
| U-EDGE-01 | `@edge-normal` 4 観点 | 正常代表 → AT-01 trace |
| U-EDGE-02 | `@edge-error` fail-close | 異常 → AT-02 / exit code |
| U-EDGE-03 | `@edge-boundary` | 境界 → AT-03 (空入力/不正 frontmatter/path 不在/循環) |

### §1.5 U-SLOG (session-log 由来、PLAN-L6-03 add-design / session-log.md §3)
| U-ID | 検証対象 | oracle (DbC) |
|---|---|---|
| U-SLOG-001 | `resolveActivePlan` | state ファイル優先 / branch (`add/<plan>`) fallback / 解決不能=`null` (throw しない) |
| U-SLOG-002 | `recordEvent` | 正常 append / **不正入力でも throw せず 0 (fail-open)** / 秘匿: `summary` に Bash 引数値・credential・PII が含まれない (`sanitize` 後) |
| U-SLOG-003 | `compressPlanDigest` | events→digest 集計正当 / 同一 (plan,session) 再適用で **idempotent** (session-guard で二重計上なし) / `prev` マージ / `updated_at = max(prev, events)` 巻き戻りなし / `failures` は ts dedupe |
| U-SLOG-004 | `onStop` | session 終了で `.ut-tdd/logs/plan/<plan_id>.digest.json` が生成/更新、常に 0 / **plan_id=null のみの session は digest を書かない** |
| U-SLOG-005 | `onSessionStart` | session_start event を append し常に 0 (fail-open)、I/O 失敗でも throw しない |

### §1.6 U-FSF (forced-stop フィードバック由来、PLAN-L6-04 add-design / forced-stop-feedback.md §2-§3)
| U-ID | 検証対象 | oracle (DbC) |
|---|---|---|
| U-FSF-001 | `detectDanglingTurn` | **純関数**。session_end で閉じたターン=`{dangling:false, from:null}` / `tool_use` 後に session_end 無し=`{dangling:true, from:<最後の session_end 直後の ts>}` / **`session_end` 皆無で `tool_use`/`user_prompt` あり=`{dangling:true, from:events[0].ts}`** / **`user_prompt` のみ trailing (session_end なし)=`{dangling:true}`** / 空 events=`{dangling:false, from:null}` |
| U-FSF-002 | `recordForcedStop` | 正常時 `forced_stop` event を append / **不正入力でも throw せず (fail-open)** / **append された entry に自由テキスト本文 (`message`/`text`/`content`) を含まず、`next_message_ref` が文字列で存在** |
| U-FSF-003 | `classifyFeedback` | 非同期。mock classifier で `mistake`/`feedback` + `attention` 反映 / **classifier が reject/throw/不正出力なら `feedback`+`low`+`unclassified` に倒す** (取りこぼし回避、強制停止 default=やらかし側) |
| U-FSF-004 | `recordFeedback` | `category="feedback"` のみ記載 (`recovery_proposed=attention==="high"`) / **`category="mistake"` は no-op** / **`plan_id=null` は書かない (skip)** / 同一 `ts` idempotent / `summary`/`reason` は `sanitize` 済 (生文・PII・credential なし) |
| U-FSF-005 | `pendingRecoveryProposals` | `recovery_proposed===true && resolved_at===undefined` のみ返す / `resolved_at` 設定済は除外 / **不正 JSON 行はスキップし valid 行のみ返す** / 空時 `[]` |

## §2 量閉じ一覧 (L6 設計 → U 被覆、孤児チェック)

- function-spec §1 関数 → U-FUNC-01〜04
- function-spec §2 pseudocode → U-CORE-01〜04
- function-spec §4 rule engine → U-RULE-01〜03
- edge-case 4 観点 → U-EDGE-01〜03
- **session-log.md §3 関数 (resolveActivePlan/recordEvent/compressPlanDigest/onStop/onSessionStart) → U-SLOG-001〜005** (add-feature 差分、PLAN-L6-03。孤児 0)
- **forced-stop-feedback.md §2.3 関数 (detectDanglingTurn/recordForcedStop/classifyFeedback/recordFeedback/pendingRecoveryProposals) → U-FSF-001〜005** (add-feature 差分、PLAN-L6-04。孤児 0)
- **孤児 (設計で U 未被覆) = 0** を L7 entry で機械確認

## §3 trace (④ → ②)

本書の各 U-* は `docs/design/harness/L6-function-design/` の 2 sub-doc (signature/DbC/edge) と相互 reference。**G6 (機能設計凍結)** で 2 sub-doc ⇔ 本書 1 doc の pair 宣言を確定し、L7 entry (TDD Red) で先行 ④ テストコードに変換 (§1.10 line 671)。双方向 trace freeze は G7 で実施。

## §4 carry / 次工程

- **L7 entry (TDD Red)**: 全 U-* を vitest 単体テストに先行変換 (FR-02、Red 先行、未実装理由のみで fail 可)
- **L7 実装**: function-spec WBS (§5) の Sprint L7.1〜L7.7 を Red→Green→3点R で実装。DbC docstring (`@edge-*`) を実関数へ転記
- **G7 trace freeze**: 4 artifact 双方向 12 edge 凍結時に本書 U ↔ L6 設計の trace 確定
