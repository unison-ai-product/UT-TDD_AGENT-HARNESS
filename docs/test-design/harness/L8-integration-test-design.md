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

# UT-TDD Agent Harness — L8 結合テスト設計 (④ / IT-*)

> **layer (作成層 = V-pair key)**: L5 (詳細設計) / **executed_at_layer (実施層)**: L8 (結合テスト) / **artifact**: ④ テスト設計 (V-model 右、② L5 詳細設計 全 sub-doc と対)
> **pair (V-model L5↔L8)**: `docs/design/harness/L5-detailed-design/{physical-data,module-decomposition,internal-processing,if-detail}.md` 4 sub-doc 全体 ↔ 本書 1 doc
> **status**: draft (placeholder skeleton — L5 設計確定に伴い pair を物質化。IT-* 詳細は L8 本起票で展開、L3↔L12 / L4↔L9 と同型)
> **PLAN**: `docs/plans/PLAN-L5-{01..04}-*.md` の pair_artifact / DoD で本書参照

## §0 量閉じ原則 (L5 ↔ L8)

L5 詳細設計の各契約 (DbC) が L8 結合テスト (IT-*) で被覆されること (孤児 = 0)。

- **internal-processing**: 各操作の DbC pre/post/invariant (§3/§4/§5) + edge docstring (§7) → 契約遵守 IT 必須
- **if-detail**: adapter 詳細契約 (§1-§5) + エラー分類→fail-close (§4) → 境界統合 IT 必須
- **module-decomposition**: module 間の公開 IF 呼び出し (依存方向) → module 結合 IT 必須
- **physical-data**: state file ↔ zod の読込/書込整合 (§5) → 永続化結合 IT 必須
- 孤児 = 0 (L7 で `ut-tdd vmodel lint` の edge 5-8 照合に接続)

## §1 結合テスト (IT-*) — placeholder skeleton

> L8 = module 間 / 内外境界の **結合**を対象 (L9 system test より下位、L12 受入 AT より実装寄り)。個別 IT ケースは L8 本起票で展開。

### §1.1 IT-CONTRACT (internal-processing DbC 由来)
| IT-ID (候補) | 検証対象 | シナリオ |
|---|---|---|
| IT-CONTRACT-01 | `plan draft` の pre/post (§3/§4) | precondition 違反入力 → fail-close / 正常入力 → file+registry postcondition 成立 |
| IT-CONTRACT-02 | `gate` の post + invariant (§4/§5) | gate pass → phase.yaml + gate_runs 証跡 / V-model 順序 invariant |
| IT-CONTRACT-03 | edge docstring (§7、edge 5-8) ↔ 実装関数 | @edge-normal/error/boundary/throws が AT と双方向 trace |

### §1.2 IT-ADAPTER (if-detail D-CONTRACT 由来)
| IT-ID (候補) | 検証対象 | シナリオ |
|---|---|---|
| IT-ADAPTER-01 | adapter intent → 結果型 (§1/§2) | invokeWorker intent → InvokeResult (mock provider) |
| IT-ADAPTER-02 | エラー分類 → fail-close (§4) | absent→degradation / auth→fail-close / timeout→skip |
| IT-ADAPTER-03 | D-CONTRACT DSL (§5) | mode-routing.yaml / gate-checks.yaml の zod 読込 validate |

### §1.3 IT-MODULE (module-decomposition 由来)
| IT-ID (候補) | 検証対象 | シナリオ |
|---|---|---|
| IT-MODULE-01 | 依存方向 (schema 一方向・循環禁止) | module 間 import グラフに循環なし |
| IT-MODULE-02 | lint 共通様式 (loadX→analyzeX) | loadX (fs) + analyzeX (pure) の結合動作 |

### §1.4 IT-STATE (physical-data 由来)
| IT-ID (候補) | 検証対象 | シナリオ |
|---|---|---|
| IT-STATE-01 | state file ↔ zod 読込/書込 (§5) | 書込→読込で zod parse 成立 / 不正 state → fail-close |
| IT-STATE-02 | drive 別区画 (§6) | 区画隔離 + 跨ぎ汚染検出 |

### §1.5 IT-ASSET (内部資産 roster 由来、PLAN-L5-05 / PLAN-DISCOVERY-02 Discovery confirmed)
| IT-ID (候補) | 検証対象 | シナリオ |
|---|---|---|
| IT-ASSET-01 | `roster list` scan→registry (module-decomp §1/§5) | `.claude/agents/*.md` 全件が registry (id=filename stem) に入る (PLAN-DISCOVERY-02 spike = 19 件実証) / capability class ⊥ model family に決定論解決 |
| IT-ASSET-02 | `roster check` ↔ guard allowlist 整合 (internal-proc §4 post) | allowlist 突合 = missingFromRoster=0 ∧ nameMismatches=0 で ok/exit 0 / 乖離 (allowlist にあり .md 無し、filename↔name 不一致) 注入 → **fail-close**/exit 1。nonAllowlisted (be-* / db-schema / devops-deploy) は乖離でなく既知集合 |
| IT-ASSET-03 | `runtime(guard) → roster` 依存方向 (module-decomp §4) | roster が runtime/guard を import しない (循環 0)。移行段階 placeholder_deps (waiting_layer:L7) の繋ぎ |

## §2 量閉じ一覧 (L5 契約 → IT 被覆、孤児チェック)

- internal-processing §3/§4/§5/§7 DbC → IT-CONTRACT-01〜03 + roster D-API (`roster list/check`) → IT-ASSET-01〜02 (`ut-tdd asset` FR-L1-48 は L6 carry `waiting_layer:L6` で IT 被覆も L6 後追い、孤児でなく carry 明示)
- if-detail §1-§5 → IT-ADAPTER-01〜03
- module-decomposition §4 依存方向 / §6 lint 様式 → IT-MODULE-01〜02 + roster module (§1/§5) → IT-ASSET-01/03
- physical-data §5/§6 → IT-STATE-01〜02
- **孤児 (契約で IT 未被覆) = 0** を L8 本起票で機械確認

## §3 trace (④ → ②)

本書の各 IT-* は `docs/design/harness/L5-detailed-design/` の 4 sub-doc の契約と相互 reference。**G5 (詳細設計ゲート = DbC freeze 点)** で 4 sub-doc 全体 ⇔ 本書 1 doc の pair 宣言を確定し、双方向 trace freeze は G7 で実施 (L3↔L12 / L4↔L9 と同型)。

## §4 carry / 次工程

- **L8 本起票**: IT-* 個別ケース展開 + 量閉じ機械確認
- **L7 実装**: 全 IT-* を vitest 結合テストに変換 (TDD 強制 FR-02、Red 先行)。DbC docstring (internal-processing §7) の @edge-* ↔ AT 照合
- **G7 trace freeze**: 4 artifact 双方向 12 edge 凍結時に本書 IT ↔ L5 契約の trace 確定

## Appendix A: L5 back-fill IT coverage closure (PLAN-L5-06 / PLAN-L5-07)

### A.1 IT-ASSET additions for skill and drift

| IT-ID | Source contract | Scenario |
|---|---|---|
| IT-ASSET-04 | skill catalog integration (module-decomposition Appendix A.1 / internal-processing Appendix A.1) | `docs/skills/**/*.md` scan produces an in-memory catalog; missing optional roots are reported as empty-with-evidence; no `.ut-tdd` persistent state is created. |
| IT-ASSET-05 | skill recommender/injector integration (PLAN-L5-06) | catalog + task/layer/drive context produces deterministic recommendations and layer-scoped injection sets; scoring and injector signatures remain L6 carry (`waiting_layer:L6`). |
| IT-ASSET-06 | `asset-drift` rule integration (module-decomposition Appendix A.2 / internal-processing Appendix A.2) | rule registry contains `asset-drift`; enrolled agent/skill docs are checked; unresolved drift surfaces through doctor/gate as non-green validation. |
| IT-ASSET-07 | placeholder dependency gap integration (physical-data §7 + PLAN-L5-07) | unresolved placeholder dependencies stay visible until their waiting layer; reaching the layer without materialization fails validation instead of silently passing. |

### A.2 Coverage closure statement

- PLAN-L5-06 skill contracts -> IT-ASSET-04 and IT-ASSET-05.
- PLAN-L5-07 asset-drift contracts -> IT-ASSET-06 and IT-ASSET-07.
- Existing roster contracts remain covered by IT-ASSET-01 through IT-ASSET-03.
- With these additions, L5 internal asset contracts have no unpaired L8 integration-test design item; algorithmic detail remains a documented L6 carry, and implementation materialization remains a documented L7 carry.
