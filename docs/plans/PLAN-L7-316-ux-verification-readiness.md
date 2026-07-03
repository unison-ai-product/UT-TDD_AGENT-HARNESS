---
plan_id: PLAN-L7-316-ux-verification-readiness
title: "PLAN-L7-316 (impl): UX 検証態勢の整備 — 操作必須項目・ユーザビリティ観点・UXV ケースの L10 前拡充"
kind: impl
layer: L7
drive: fe
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L4-basic-design/ui-standard.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 活性化時期 (L10 pair-freeze 進入と連動) と heuristics セットの承認"
  - role: tl
    slot_label: "TL - screen spec 必須欄と UXV ケース体系の設計レビュー"
  - role: se
    slot_label: "SE (fe-design/fe-test 系) - 観点表 + UXV ケース + gate 拡張の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-316-ux-verification-readiness.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/governance/audit-lens-catalog.md
    - docs/design/harness/L6-function-design/screen-spec.md
    - docs/design/harness/L5-detailed-design/ui-detail.md
---

# PLAN-L7-316 (impl): UX 検証態勢の整備

## Status

**version-up parked (v2)**。PO 指摘 (2026-07-03)「FE/UI-UX は実際に稼働する機会がないため、検証・テスト・観点の抜け漏れ・デザインセンスが弱い。操作上絶対に必要な項目の抜け漏れ、業務要求・ユーザー要求・ユーザビリティが弱い」。活性化タイミングは **L10 pair-freeze 進入と連動** (mock 段階で重くしない — screen-impl-pair-freeze gate が段階を管理しており、実装宣言の前に検証態勢が先回りで整っていることが本 PLAN の価値)。

## 背景 (実測 2026-07-03)

- UXV ケースは **5 件 / 画面 15** (doctor `g10-ux-workflow: uxv_cases=5, mandatory_uxv=5`)。1 画面あたり 0.33 ケースで、操作横断の観点 (エラー・空状態・権限など) を体系で持たない。
- 中央 UI は mock 段階 (`screen-impl-pair-freeze: 実装宣言なし`)。「実装が無いから UX 検証も無い」状態が続いており、これは skill 実発火 0 と同じ「実走なし = 検証されない」パターンの FE 面。
- FE 設計 doc カバレッジ gate (frontend-design-coverage) は 6 層 green だが、これは **doc の存在と § 構造**の保証であり、操作必須項目やユーザビリティ観点の**中身の網羅**は測っていない (`coverage ≠ substance`)。
- 監査観点は監査レンズカタログ LENS-UX (同日追加) に資産化済み。本 PLAN はその是正実装側。

## スコープ (1 要件: L10 進入時に UX 検証が実装に追いつく態勢を機械資産として整備する)

1. **操作必須項目の観点表 (正本)**: `docs/design/harness/L4-basic-design/ui-standard.md` に「全画面共通の操作必須項目」節を新設 — 空状態 / エラー表示 / ローディング / 取消・戻る / 権限別表示 / キーボード操作 / 操作フィードバック / 破壊的操作の確認。各項目に「省略可能な画面種別」を明記 (全画面一律強制はしない — 形骸化防止)。
2. **screen spec 必須欄**: L6 screen-spec の標準 § 構造 (sub-doc-section-structure gate の検査対象) に「操作必須項目チェック表」欄を追加。15 画面の既存 spec へは欄のみ追加し、中身の記入は各画面の L10 着手時 (欄の存在を gate が検査、中身は pair-freeze review が検査)。
3. **UXV ケース体系の拡充**: G10 の UXV ケースを「heuristics 由来 (観点表 × 画面)」+「業務フロー由来 (L1 業務要求の主要動線)」の 2 系で再設計し、`uxv_cases` を画面横断観点でケース化 (目標値は設計時に TL/PO が確定 — 数値目標でなく観点網羅を DoD とする)。
4. **usability 要求の降下 trace**: usability 系 NFR の画面別 AC への降下を trace key で接続 (既存 descent-obligation 機構の適用拡張。新機構は作らない)。
5. **fe-design レビューの正規化**: L10 pair-freeze の判定材料に fe-design (Sonnet xhigh、既存 routing 規約) のデザインレビュー evidence を要求する運用を screen-impl-pair-freeze の手順 doc に明記 (デザインセンスは機械 gate で測れない — 測れないものはレビュー主体を明示するのが本 PLAN の立場)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 観点表の設計 + heuristics セット承認 (TL/PO) | 直列 |
| 2 | ui-standard への観点表 + screen spec 必須欄 (sub-doc gate 拡張含む) | 直列 |
| 3 | UXV ケース体系の再設計 + G10 manifest 更新 | 直列 |
| 4 | usability NFR の descent trace 接続 | Step 3 と並列 |
| 5 | fe-design レビュー正規化 (手順 doc) + regression test | 直列 |

## DoD

- [ ] ui-standard に操作必須項目の正本表が存在し、sub-doc gate が screen spec の該当欄を検査する (test 固定)
- [ ] UXV ケースが観点表の全項目を最低 1 ケースずつ被覆する (G10 manifest で機械確認)
- [ ] usability 系 NFR が画面 AC へ trace され descent-obligation で追跡される (doctor 確認)
- [ ] L10 pair-freeze 手順に fe-design レビュー evidence の要求が明記される

## 実装ノート (後続モデル向け)

- 触るファイル: `docs/design/harness/L4-basic-design/ui-standard.md`、`docs/design/harness/L6-function-design/screen-spec.md` (+ 各画面 spec)、sub-doc 構造 gate (`src/lint/sub-doc-section-structure.ts`)、G10 manifest 群 (`docs/test-design/` の UXV 帯)、trace 系。
- 設計変更 (L4/L6 doc) を含むため、活性化時は kind を add-design/add-impl へ分割昇格し Reverse pairing を用意する (§6 活性化手順参照)。1 PLAN のまま実装しない — 本 PLAN は態勢整備の親であり、活性化時に design 面 / gate 面 / ケース面へ分割するのが正 (bundle 宣言の先行例として扱う)。
- 「観点の抜け漏れ」を機械で完全には防げない。機械層は「欄の存在 + ケースの被覆」まで、中身の質は fe-design レビューと LENS-UX 監査 (四半期) が受け持つ、という二層設計を崩さない。
