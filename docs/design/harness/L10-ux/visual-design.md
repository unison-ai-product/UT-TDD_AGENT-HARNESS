---
layer: L10
status: placeholder
parent_doc: docs/design/harness/L2-screen/wireframe.md
pair_artifact: docs/design/harness/L2-screen/wireframe.md  # L2↔L10 self-pair (IMP-039/058: wireframe mock 自体が③ペアを担い L10 独立 test-design doc を作らない)。L2 全 sub-doc を束ねた検証は impl 後の本 L10 で行う
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
plan: docs/plans/PLAN-L4-14-ui-standard.md
superseded_design_role: docs/design/harness/L4-basic-design/ui-standard.md
created: 2026-06-24
updated: 2026-06-24
---

# L10 UX 磨き (placeholder) — impl 後の UX 確定 / WCAG 検証

> **層配置是正 (PLAN-L4-14、2026-06-24)**: 本 doc は当初 (`d8a5d2c`) **再利用 FE 設計標準 (部品/色/
> design tokens)** を author していたが、それは impl **前**に要る方式設計/開発標準であり L10 ではなく
> **L4** に降ろすのが正しい (`data` = DB 設計標準の FE 対応物、document-system-map §1b)。よって設計標準の
> substance は [L4 ui-standard.md](../L4-basic-design/ui-standard.md) + [L4 tokens.yaml](../L4-basic-design/tokens.yaml)
> へ re-home した。本 L10 doc は **impl 後の UX 磨き / WCAG 実比検証 (L2 の右腕ペア、`V_MODEL_PAIRS`
> L2↔L10)** の placeholder として残す。

## L10 の役割 (impl 後)

L10 = **UX 磨き** (document-system-map §1 L10 行「FE デザイン確定 / UX 検証」、WCAG 2.2 / ISO 9241-110)。
src/web 実装 (L7、PLAN-L7-141) が成立した **後**に、実装済 UI を磨き、a11y/visual を実レンダリングで検証する
工程。L2 ワイヤーモックの右腕ペア (IMP-039/058: mock 自体が ③ pair を担い、`docs/test-design/` に独立
test-design doc は作らない)。

## なぜ今は placeholder か

- 再利用 FE 設計標準 (部品/色/tokens、impl 前に要る) は [L4 ui-standard](../L4-basic-design/ui-standard.md) が持つ。
- L10 が担うのは **impl 後**の UX 磨きと WCAG 実比検証だが、src/web 実装 (L7-141) が未着手のため、磨く対象が
  まだ存在しない。よって本 doc は実装到達後に author する (forward 順: L4 設計標準 → L7 impl → 本 L10 磨き)。
- `confirmed` 昇格は G10 (UX 磨き完了) の PO サインオフ。G10 の機械検証は本版では概念定義 (requirements §6.8、
  L8-L14 は将来 PLAN)。

## trace

- 上流: [L2 wireframe](../L2-screen/wireframe.md) (mock = self-pair) + [L4 ui-standard](../L4-basic-design/ui-standard.md) (FE 設計標準) + L7 src/web 実装。
- 下流: G10 UX 承認 → L11 総合レビュー+UAT。

## §6 G10-WORKFLOW

test_strategy: L2 screen contracts と L4 FE design standards に紐づく risk-based UX verification。
test_plan: visual、token、accessibility、visual-regression、UX-review risk により UXV case を選択する。
test_conditions: 選択した各 UXV case は具体的な rendered evidence または reviewable evidence path を持つ。
coverage_items: UXV-* coverage は visual、token、a11y、VRT、UX review family へ map する。
test_procedures: 対応する vitest/doctor/render/review command を実行し、exit code を記録する。
execution_evidence: UX evidence manifest は command、UXV ID、path、result を記録する。
exit_criteria: 必須の選択済み UXV case はすべて pass、または明示的な defer を持つ。
defect_routing: 失敗した UXV case は scope に応じて L10 correction、L2/L4 back-prop、Reverse、Incident へ route する。

| UXV ID | 前提 | 操作 | 期待結果 |
|---|---|---|---|
| UXV-VISUAL-01 | L2 wireframe と L4 UI standard が存在する | G10 visual review が選択される | Evidence は visual decision を具体的な screen/component artifact に紐づける |
| UXV-TOKEN-01 | L4 tokens.yaml が FE token SSoT である | G10 token verification が選択される | Evidence は token contract が workflow/FE coverage checks から到達可能であることを示す |
| UXV-A11Y-01 | WCAG/a11y expectations が L4 UI standard に存在する | G10 accessibility verification が選択される | Evidence は a11y requirements を executable または reviewable checks に紐づける |
| UXV-VRT-01 | visual regression が frontend-design の必須 green signal である | G10 VRT verification が選択される | visual-regression path または明示的 defer がなければ Evidence が G10 close を block する |
| UXV-REVIEW-01 | UX polish は row presence を超える judgement を必要とする | G10 review が選択される | Evidence は L11 handoff 前に review route と exit criteria を記録する |
