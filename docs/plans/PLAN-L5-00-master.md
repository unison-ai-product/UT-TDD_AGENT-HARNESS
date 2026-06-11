---
plan_id: PLAN-L5-00-master
title: "PLAN-L5-00 (Master hub): L5 詳細設計 — 必須/選択 triage + child PLAN 合成"
kind: design
layer: L5
drive: fullstack
status: confirmed
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: cross_agent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "G5 L5 master freeze。Cross-agent review (Codex が L5-01..08 + L8 GWT を authored、Claude が検証): 要件→L5→L8 descent の中身確認 (physical-data 物理 schema 実在 / L8 IT-* GWT)、文字化け除去、harness.db は柱3 フィードバック機構として ADR-007 で正式化。"
    worker_model: codex
    reviewer_model: claude-opus-4-8
created: 2026-05-29
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
master_hub: true
agent_slots:
  - role: tl
    slot_label: "TL — L5 詳細設計 (DbC contract / module 分割 / 物理 schema) のレビュー (別 runtime)"
  - role: po
    slot_label: "PO — 認証・秘密管理方式 / ADR-002/003 起票要否の承認"
generates:
  - artifact_path: docs/plans/PLAN-L5-00-master.md
    artifact_type: markdown_doc
roadmap:
  layer: L5
  gates:
    - id: G-DESIGN.L5
      name: L5 詳細設計 freeze
      exit_criteria: "L5 詳細設計 sub-doc (internal-processing/module-decomposition/physical-data/if-detail + 内部資産拡張 roster/skill/drift + harness-db-feedback) が全 child PLAN で confirmed、L5↔L9 V-pair 整合、G5 PASS 台帳と一致"
  spans:
    - plan_id: PLAN-L5-01-physical-data
      after_gate: entry
      before_gate: G-DESIGN.L5
    - plan_id: PLAN-L5-02-module-decomposition
      after_gate: entry
      before_gate: G-DESIGN.L5
    - plan_id: PLAN-L5-03-internal-processing
      after_gate: entry
      before_gate: G-DESIGN.L5
    - plan_id: PLAN-L5-04-if-detail
      after_gate: entry
      before_gate: G-DESIGN.L5
    - plan_id: PLAN-L5-05-roster
      after_gate: entry
      before_gate: G-DESIGN.L5
    - plan_id: PLAN-L5-06-skill
      after_gate: entry
      before_gate: G-DESIGN.L5
    - plan_id: PLAN-L5-07-drift
      after_gate: entry
      before_gate: G-DESIGN.L5
    - plan_id: PLAN-L5-08-harness-db-feedback
      after_gate: entry
      before_gate: G-DESIGN.L5
dependencies:
  parent: null
  requires:
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L4-basic-design/external-if.md
  references:
    - docs/governance/document-system-map.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-00 (Master hub): L5 詳細設計 — 必須/選択 triage + child 合成

## §0 位置づけ

L5 (詳細設計 = 内部設計) を **メタモデル ①必須 + ②プロダクト選択** で起票する Master hub (要件 §1.10.G.13 導線)。G4 = CONDITIONAL PASS (A-67) を前提に、L4 基本設計 4 sub-doc を詳細化する。L5 sub-doc enum (§1.10.G.1) = `internal-processing / module-decomposition / physical-data / if-detail` (4 種)。V-pair = **L8 結合テスト設計** (L5↔L8)。

## §1 triage (UT-TDD harness のプロダクト特性)

| 軸 | UT-TDD の特性 | L5 sub-doc への影響 |
|---|---|---|
| 内部処理 | CLI/lint/gate/workflow の処理ロジック (DbC pre/post) | internal-processing 必須 |
| モジュール | architecture §3 の 7 building block の内部分割 | module-decomposition 必須 |
| データ | file-based state (`.ut-tdd/`、JSON/YAML) を SSoT とし、`.ut-tdd/harness.db` SQLite を **projection / feedback DB に採用** ([ADR-007](../adr/ADR-007-harness-db-sqlite-projection.md)、PLAN-L5-08 で詳細化。当初 ADR-001 は SQLite を defer したが ADR-007 で解除) | physical-data 必須 (物理 schema = JSON フィールド型 + SQLite projection table) |
| 外部連携 | GitHub/Claude/Codex/Sentry の境界詳細契約 (D-CONTRACT) | **if-detail 必須** (external-if §7 の how 側) |

> L5 sub-doc に screen 系はない (画面は L1/L2/L10)。4 sub-doc いずれもプロダクト適合のため **skip 候補なし**。

## §2 L5 sub-doc 合成結果 (必須/選択 区分 = G.13)

| sub-doc | 区分 | 判定 | L4 由来 (詳細化元) | child PLAN |
|---|---|---|---|---|
| **physical-data** | ① 必須 | 起票 (D-DB、`.ut-tdd/` state の物理 schema = JSON フィールド型/必須任意/default、data.md §8 詳細化) | data.md | **PLAN-L5-01-physical-data** |
| **module-decomposition** | ① 必須 | 起票 (architecture §3 building block の内部分割、関数群/責務/公開 IF) | architecture.md | **PLAN-L5-02-module-decomposition** |
| **internal-processing** | ① 必須 | 起票 (D-API、CLI/lint/workflow の処理ロジック + DbC pre/post docstring、edge 5-8 / IMP-014) | function.md | **PLAN-L5-03-internal-processing** |
| **if-detail** | ② 選択 | **起票** (外部連携あり: GitHub/Claude/Codex/Sentry の詳細契約 D-CONTRACT、external-if §7 の how 側) | external-if.md | **PLAN-L5-04-if-detail** |
| **内部資産 (roster/skill/drift)** | ① 必須 (後発、L4-10〜13 由来) | **per-requirement child 3 件** ([[feedback-plan-per-requirement]]、PO 確定): roster+command (FR-L1-46/48) / skill (FR-L1-47) / drift (FR-L1-49)。既存 module-decomposition + internal-processing へ増分 (新規 sub-doc 起こさず) | architecture/function (L4) | **PLAN-L5-05-roster / PLAN-L5-06-skill / PLAN-L5-07-drift** |

> **内部資産 per-requirement 化 (A-92)**: 内部資産の L5 back-fill は当初 1 PLAN (lump) で起票したが、PO 基準「設計書化が要る要件ごとに 1 PLAN」([[feedback-plan-per-requirement]]) に従い **L4-11/12/13 と同じ per-requirement 構造**に分割 (roster/skill/drift)。各 child は physical-data 増分**不要** (roster/skill = in-memory scan-on-demand、永続 state なし、A-90)。

## §3 実行順 (child 依存)

```
PLAN-L5-01-physical-data (foundational: data.md §8 → 物理 schema)
        │
        ├─→ PLAN-L5-02-module-decomposition (architecture §3 → module 内部、physical-data を使う)
        │            │
        │            ├─→ PLAN-L5-03-internal-processing (module の関数処理 + DbC、module 確定後)
        │            └─→ PLAN-L5-04-if-detail (external-if §7 → 詳細契約、module 境界に配線)
```

1. **PLAN-L5-01-physical-data** (起点、物理 schema)
2. **PLAN-L5-02-module-decomposition** (physical-data を使う)
3. **PLAN-L5-03-internal-processing** / **PLAN-L5-04-if-detail** (module 確定後、並行可)
4. **PLAN-L5-05-roster** / **PLAN-L5-06-skill** / **PLAN-L5-07-drift** (内部資産 per-requirement、module-decomposition + internal-processing 確定後に増分。roster→skill→drift 並行可、各 ⇔ L8 IT-ASSET)

各 child は V-pair = **L8 結合テスト設計** (`docs/test-design/harness/L8-integration-test-design.md`、L5↔L8)。内部資産 child は IT-ASSET が pair。

## §4 L5 carry 反映 (G4 escalation / backlog 由来)

child PLAN 起票時に以下を織り込む:
- **IMP-014 (G3 carry)**: ②実装↔④テスト docstring (DbC pre/post/invariant、edge 5-8) を internal-processing で設計し L7 入口前に凍結
- **IMP-018 (Z2)**: external-if (what/形状) ↔ L5 D-API (how/contract 詳細) の粒度境界を if-detail で確定 (二重定義回避)
- **IMP-026**: requirements §1.10.G.1 の VALID_SUB_DOCS を `src/schema` zod enum 化 (physical-data で SubDoc 値オブジェクトの物理化を設計)
- **G4 escalation ①**: ADR-002/003 (依存方向 / adapter 境界) の起票要否を module-decomposition / if-detail 着手時に PO/TL 判断
- **G4 escalation ②**: 認証・秘密管理方式の確定を if-detail で設計 + security 監査 + PO 承認 (⚠ 人間確認必須、本 PLAN では確定しない)

## §5 DoD (Master hub 完了条件)

- [x] §2 の必須 3 + 選択 1 = child PLAN 4 件を起票 (physical-data/module-decomposition/internal-processing/if-detail)
- [x] **内部資産 per-requirement child 3 件を起票** (PLAN-L5-05-roster / L5-06-skill / L5-07-drift、A-92、[[feedback-plan-per-requirement]])
- [x] skip 候補なし (L5 全 sub-doc がプロダクト適合) を記録
- [x] 各 child が L8 結合テスト設計と pair_artifact 接続 (L8 §5 で全 IT-* を GWT 粒度に展開済み = candidate skeleton から confirmed へ upgrade、A-104)
- [x] G4 escalation ①② を child PLAN の §4 carry に織り込み
- [x] 全 child 完了で G5 (詳細設計ゲート = DbC freeze 点、document-system-map §3) freeze 済 (A-104 PASS、認証/秘密管理は human/security carry)
## Appendix B: PLAN-L5-08 Add-Design Registration (2026-06-08)

PLAN-L5-08-harness-db-feedback is registered as a post-freeze add-design child for the DB reference-feedback and automation-foundation mechanism. It binds the user request to FR-L1-05/06/07/09/12/13/17/18/19/20/33/37/39/40/41/45/46/47/48/49, descends the missing schema/module/D-API/CLI/search/feedback/automation/guardrail/asset-catalog detail to L5, and pairs the additions to L8 IT-DB/IT-SEARCH/IT-FEEDBACK/IT-AUTOMATION/IT-GUARDRAIL/IT-ASSET-DB rows. It does not roll back or replace PLAN-L5-01..07.
