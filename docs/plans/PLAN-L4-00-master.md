---
plan_id: PLAN-L4-00-master
title: "PLAN-L4-00 (Master hub): L4 基本設計 — 必須/選択 triage + child PLAN 合成"
kind: design
layer: L4
drive: fullstack
status: draft
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
dependencies:
  parent: null
  requires:
    - docs/design/harness/L3-functional/functional-requirements.md
  references:
    - docs/governance/document-system-map.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L4-00 (Master hub): L4 基本設計 — 必須/選択 triage + child 合成

## §0 位置づけ

L4 (基本設計) を **メタモデル ①必須 + ②プロダクト選択** で起票するための Master hub (要件 §1.10.G.13 の導線適用)。G3 = PASS (A-60) を前提に、document-system-map (A-61) の業界標準 grounding を反映して L4 child PLAN を合成する。

## §1 triage (UT-TDD harness のプロダクト特性)

| 軸 | UT-TDD の特性 | L4 sub-doc への影響 |
|---|---|---|
| drive | TS CLI/library + agent orchestration (be/agent/fullstack/db) | architecture / function / data 必須 |
| UI 有無 | **core は CLI/library。UI (PM/HM/GD 14 画面) は L1 で要求確定済だが L2 モック未検証** | screen は **defer (skip)** |
| 外部連携 | GitHub / Claude / Codex / Sentry / Uptime Robot / Dependabot | **external-if 必須** (DbC 境界契約) |
| DB 有無 | file-based state (`.ut-tdd/`)、SQLite 不採用 (ADR-001) | data sub-doc が file-based state schema + ドメインモデルを担う |

## §2 L4 sub-doc 合成結果 (必須/選択 区分 = G.13)

| sub-doc | 区分 | 判定 | child PLAN |
|---|---|---|---|
| **data** | ① 必須 | 起票 (ドメインモデル 12 entity + state schema + DbC invariant、L1 §10.2 carry) | **PLAN-L4-01-data** |
| **architecture** | ① 必須 | 起票 (方式設計 arc42 §4 + ADR §9 + TS module 構成 + hook/CI 配線) | **PLAN-L4-02-architecture** |
| **function** | ① 必須 | 起票 (L3 FR 26 件 + P1 carry 9 件の機能 building block、arc42 §5) | **PLAN-L4-03-function** |
| **external-if** | ② 選択 | **起票** (外部連携あり: GitHub/Claude/Codex/Sentry の DbC pre/post 境界契約) | **PLAN-L4-04-external-if** |
| **screen** | ② 選択 | **skip/defer (PO 承認済 2026-05-29)** | — (skip_sub_doc 記録) |

> **screen skip 理由** (PO 承認済 2026-05-29): `harness core は CLI/library 優先。UI (PM/HM/GD 14 画面) は L1 screen-requirements で要求確定済だが、L2 モック検証 (G2) 前のため L4-screen は L2 完了後に別途起票する (defer)。BE/CLI/agent drive 主体の現段階では UI 設計確定は時期尚早`。
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

各 child は W-pair = **L9 総合テスト設計** (`docs/test-design/harness/L9-system-test-design.md`、L4↔L9)。

## §4 L4 carry 反映 (backlog / G3 audit 由来)

child PLAN 起票時に以下を織り込む:
- **IMP-017 (Z1)**: architecture と external-if を別 sub-doc に分離済 (本合成で達成)
- **IMP-018 (Z2)**: external-if (what/形状) ↔ L5 D-API (how/contract) の粒度境界を external-if PLAN に明記
- **IMP-023/025 (E1/E3)**: architecture sub-doc に ADR テンプレ (arc42 §9) + arc42 §5 ビューマッピングを必須化
- **IMP-013 (G3)**: function PLAN で FR-L1-20 (invocation_log) と business-detail §2/§5 接続を明示
- **IMP-014 (G3)**: data/external-if PLAN で DbC pre/post/invariant を L5 docstring (edge 5-8) へ繋ぐ carry を明示

## §5 DoD (Master hub 完了条件)

- [ ] §2 の必須 3 + 選択 1 = child PLAN 4 件を起票 (data/architecture/function/external-if)
- [ ] screen skip を PO 承認 + skip_sub_doc に reason 記録
- [ ] 各 child が L9 総合テスト設計と pair_artifact 接続
- [ ] 全 child 完了で G4 (基本設計ゲート) readiness へ
