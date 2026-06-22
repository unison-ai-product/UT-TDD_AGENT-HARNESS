---
plan_id: PLAN-L4-00-master
title: "PLAN-L4-00 (Master hub): L4 基本設計 — 必須/選択 triage + child PLAN 合成"
kind: design
layer: L4
drive: fullstack
status: confirmed
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
master_hub: true   # 複数 sub-doc child を束ねる hub (G.3 単一 sub_doc 規則の例外、PLAN-MM 様式)
agent_slots:
  - role: tl
    slot_label: "TL — L4 方式設計/契約のレビュー (別 runtime)"
  - role: po
    slot_label: "PO — screen skip 等プロダクト選択の承認"
generates:
  - artifact_path: docs/plans/PLAN-L4-00-master.md
    artifact_type: markdown_doc
roadmap:
  layer: L4
  gates:
    - id: G-DESIGN.L4
      name: L4 基本設計 freeze
      exit_criteria: "L4 基本設計 sub-doc (architecture/function/screen/data/external-if + 内部資産拡張 roster/skill-pack/drift-lint) が全 child PLAN で confirmed、L4↔L10 V-pair freeze 整合、G4 PASS 台帳と一致"
  spans:
    - plan_id: PLAN-L4-01-data
      after_gate: entry
      before_gate: G-DESIGN.L4
    - plan_id: PLAN-L4-02-architecture
      after_gate: entry
      before_gate: G-DESIGN.L4
    - plan_id: PLAN-L4-03-function
      after_gate: entry
      before_gate: G-DESIGN.L4
    - plan_id: PLAN-L4-04-external-if
      after_gate: entry
      before_gate: G-DESIGN.L4
    - plan_id: PLAN-L4-05-workflow-orchestration
      after_gate: entry
      before_gate: G-DESIGN.L4
    - plan_id: PLAN-L4-06-design-refresh
      after_gate: entry
      before_gate: G-DESIGN.L4
    - plan_id: PLAN-L4-10-internal-asset-master
      after_gate: entry
      before_gate: G-DESIGN.L4
    - plan_id: PLAN-L4-11-roster
      after_gate: entry
      before_gate: G-DESIGN.L4
    - plan_id: PLAN-L4-12-skill-pack
      after_gate: entry
      before_gate: G-DESIGN.L4
    - plan_id: PLAN-L4-13-drift-lint
      after_gate: entry
      before_gate: G-DESIGN.L4
dependencies:
  parent: null
  requires:
    - docs/design/harness/L3-functional/functional-requirements.md
  references:
    - docs/governance/document-system-map.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve
    scope: "A-101 G4 L4 audit 4 軸 PASS (pmo-sonnet TL 代替、claude-only)"
---

# PLAN-L4-00 (Master hub): L4 基本設計 — 必須/選択 triage + child 合成

## §0 位置づけ

L4 (基本設計) を **メタモデル ①必須 + ②プロダクト選択** で起票するための Master hub (要件 §1.10.G.13 の導線適用)。G3 = PASS (A-60) を前提に、document-system-map (A-61) の業界標準 grounding を反映して L4 child PLAN を合成する。

## §1 triage (UT-TDD harness のプロダクト特性)

| 軸 | UT-TDD の特性 | L4 sub-doc への影響 |
|---|---|---|
| drive | TS CLI/library + agent orchestration (be/agent/fullstack/db) | architecture / function / data 必須 |
| UI 有無 | **core は CLI/library。UI (PM/HM/GD 15 画面) は L1 で要求確定済だが L2 モック未検証** | screen は **defer (skip)** |
| 外部連携 | GitHub / Claude / Codex / Sentry / Uptime Robot / Dependabot | **external-if 必須** (DbC 境界契約) |
| DB 有無 | `.ut-tdd/` YAML/JSON state + `.ut-tdd/harness.db` SQLite projection DB (ADR-001) | data sub-doc が state schema + projection feedback DB + ドメインモデルを担う |

## §2 L4 sub-doc 合成結果 (必須/選択 区分 = G.13)

| sub-doc | 区分 | 判定 | child PLAN |
|---|---|---|---|
| **data** | ① 必須 | 起票 (ドメインモデル 12 entity + state schema + DbC invariant、L1 §10.2 carry) | **PLAN-L4-01-data** |
| **architecture** | ① 必須 | 起票 (方式設計 arc42 §4 + ADR §9 + TS module 構成 + hook/CI 配線) | **PLAN-L4-02-architecture** |
| **function** | ① 必須 | 起票 (L3 FR 26 件 + P1 carry 9 件の機能 building block、arc42 §5) | **PLAN-L4-03-function** |
| **external-if** | ② 選択 | **起票** (外部連携あり: GitHub/Claude/Codex/Sentry の DbC pre/post 境界契約) | **PLAN-L4-04-external-if** |
| **screen** | ② 選択 | **skip/defer (PO 承認済 2026-05-29)** | — (skip_sub_doc 記録) |
| **内部資産 (roster/skill/command/drift)** | ① 必須 (後発、Recovery 由来) | **起票済** (FR-L1-46〜49 = BR-22 派生。architecture/function/data/external-if へ増分、新規 sub-doc は起こさない) | **PLAN-L4-10-internal-asset (sub-master) → L4-11/12/13** |

> **内部資産 sub-master 統合 (A-90)**: 内部資産次元 (FR-L1-46〜49) は当初 Recovery (PLAN-RECOVERY-01) 由来で **PLAN-L4-10 を独立 root** として起票したが、L4 ツリーの根が 2 本になり「G4 再 audit スコープ曖昧 / data.md・external-if 取り残し」を招いた。**PLAN-L4-10 を本 Master の sub-master に従属**させ (parent=L4-00、REC-001 は references)、L4 を単一ツリーに統合。内部資産は architecture/function への増分に加え、**data.md (roster/skill = in-memory scan-on-demand で非 entity、5 集約不変) / external-if (内部資産 fs は外部境界でない (f)) も A-90 で整合**させた (cross-sub-doc 沈黙 gap 解消)。

> **screen skip 理由** (PO 承認済 2026-05-29): `harness core は CLI/library 優先。UI (PM/HM/GD 15 画面) は L1 screen-requirements で要求確定済だが、L2 モック検証 (G2) 前のため L4-screen は L2 完了後に別途起票する (defer)。BE/CLI/agent drive 主体の現段階では UI 設計確定は時期尚早`。
> child PLAN 起票状況: **PLAN-L4-01-data 起票済 (2026-05-29)**。次 = L4-02-architecture / L4-03-function / L4-04-external-if。

## §3 実行順 (child 依存)

```
PLAN-L4-01-data (foundational: ドメインモデル/不変条件)
        │
        ├─→ PLAN-L4-02-architecture (data を building block に配置、方式/ADR)
        │            │
        │            └─→ PLAN-L4-04-external-if (architecture 境界に外部契約を配線)
        │
        └─→ PLAN-L4-03-function (data + architecture 上に機能 building block 詳細)
```

1. **PLAN-L4-01-data** (起点、最も基盤。`src/schema` 既存実装の設計裏付け)
2. **PLAN-L4-02-architecture** (data を使う)
3. **PLAN-L4-03-function** / **PLAN-L4-04-external-if** (architecture 確定後、並行可)
4. **PLAN-L4-10-internal-asset (sub-master)** → L4-11 (roster/command→function+architecture) / L4-12 (skill→architecture) / L4-13 (drift→architecture)。**data.md / external-if.md への整合 (非 entity / fs 境界) は A-90 で back-fill 済**。architecture.md は L4-02 + L4-11/12/13 の多重 generates のため、**L4-13 を architecture 増分の最終責任**とする (DoD 完成確認は L4-13 §4)。

```
PLAN-L4-01-data ─┬─→ L4-02-architecture ─┬─→ L4-04-external-if
                 │                        └─→ L4-10-internal-asset (sub-master)
                 └─→ L4-03-function              └→ L4-11 / L4-12 / L4-13
```

各 child は V-pair = **L9 総合テスト設計** (`docs/test-design/harness/L9-system-test-design.md`、L4↔L9)。内部資産 child は ST-ASSET-01〜07 が pair。

## §4 L4 carry 反映 (backlog / G3 audit 由来)

child PLAN 起票時に以下を織り込む:
- **IMP-017 (Z1)**: architecture と external-if を別 sub-doc に分離済 (本合成で達成)
- **IMP-018 (Z2)**: external-if (what/形状) ↔ L5 D-API (how/contract) の粒度境界を external-if PLAN に明記
- **IMP-023/025 (E1/E3)**: architecture sub-doc に ADR テンプレ (arc42 §9) + arc42 §5 ビューマッピングを必須化
- **IMP-013 (G3)**: function PLAN で FR-L1-20 (invocation_log) と business-detail §2/§5 接続を明示
- **IMP-014 (G3)**: data/external-if PLAN で DbC pre/post/invariant を L5 docstring (edge 5-8) へ繋ぐ carry を明示

## §5 DoD (Master hub 完了条件)

- [x] §2 の必須 3 + 選択 1 = child PLAN 4 件を起票 (data/architecture/function/external-if)
- [x] screen skip を PO 承認 + skip_sub_doc に reason 記録
- [x] 各 child が L9 総合テスト設計と pair_artifact 接続
- [x] **内部資産 sub-master (L4-10→11/12/13) を本 Master に統合** (A-90、根 1 本化、data/external-if 整合 back-fill)
- [x] **L4 全体 (4 sub-doc 統合 + 内部資産増分) で G4 再 audit → CONDITIONAL PASS** (A-91、Critical 0、4軸 PASS、2026-06-01)。旧 G4 COND PASS (A-67) は FR-L1-01〜45 スコープで内部資産 (FR-L1-46〜49) を含まなかったため、**内部資産を含む全体スコープで G4 を再判定** (gate-design §1.1 Recovery 合流時の forward ゲート再通過原則 / gate §2 台帳に A-91 記録)。残条件 = child PLAN-L4-11/12/13 起票済 / ST-ASSET-04 placeholder は doctor 追跡。**これで L5 降下可**
- [x] **A-100 park → A-101 正規式 G4 再確定 (2026-06-05)**: 旧 A-91 (内部資産含む COND PASS、正規式前) は **historical**。RECOVERY-02 正規式モデル確定後、A-100 で G4 を park。**A-101 で core 4 doc ⇔ L9 を正規式 V-model (L4⇔L9 総合) で G4 audit → 4 軸 PASS** (intra_runtime_subagent = pmo-sonnet、TL 代替)。L4 4 doc + L9 + PLAN-L4-00〜04 を confirmed。**内部資産 L4-10〜13 は別スコープで未 freeze** (ST-ASSET、L6/L7 carry)。記録 = gate §2 台帳 A-101 / `.ut-tdd/audit/A-101-g4-l4-freeze.md`
- [x] **A-102 G4 add-design freeze (workflow オーケストレーション、2026-06-05)**: A-101 後の粒度監査で確定した function §3 の under-design (workflow mode 群 + FR-12 skill = 外部設計判断なし) を **add-design PLAN-L4-05** で解消。function §3 を Forward spine + 9 駆動モデル + 2 工程専門の外部設計へ deepening + L9 ST-FUNC ペア + IMP-069 (mode taxonomy reconcile) / IMP-070 (commander ADR-006) 解消。**4 軸 PASS** (code-reviewer、I-1/I-2 修正後)。記録 = gate §2 台帳 A-102 / `.ut-tdd/audit/A-102-g4-workflow-orchestration.md`

### §5.1 G4 全体再 audit の合格基準 (A-90)

gate-design §3 標準 4 軸を L4 全 4 sub-doc + 内部資産増分の統合スコープで判定:
- **A1 上流 trace**: FR-L1 全件 (FR-L1-46〜49 含む) が L4 設計に着地、孤児 0
- **A2 DoD**: child PLAN (L4-01〜04 + L4-10〜13 + L4-完成 gap-fill) の §4 全件充足
- **A3 V-pair**: L4 4 sub-doc ⇔ L9 (ST-DATA/ARCH/FUNC/EXT/ASSET) の相互参照、孤児 0
- **A4 sub-doc 間整合**: 内部資産が data (非 entity) / architecture (building block) / function (C12) / external-if ((f) fs 境界) で**矛盾なく整合** (A-90 で C-1/C-2/I-1 解消済)、循環 0
- Critical(blocker) = 0 で (CONDITIONAL) PASS
