---
plan_id: PLAN-L7-141-web-dashboard-component-derived
title: "PLAN-L7-141 (impl): src/web 中央UI 再実装 — ui-element §2 設計部品から降ろす component-derived 15画面 (L7-102 table-dumper prototype を破棄して再起票)"
kind: impl
layer: L7
drive: fe
status: draft
created: 2026-06-24
updated: 2026-06-24
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L2-screen/screen-list.md
supersedes:
  - PLAN-L7-102-web-dashboard-phase-b
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE — src/web 中央UI を ui-element §2 部品から component-derived 実装"
  - role: tl
    slot_label: "TL — 実装レビュー (cross_agent / intra_runtime_subagent)"
generates:
  - artifact_path: docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L2-03-ui-element.md
  references:
    - docs/plans/PLAN-L7-102-web-dashboard-phase-b.md
---

# PLAN-L7-141 (impl): src/web 中央UI 再実装 (component-derived)

## 0. なぜ再起票か (PO 2026-06-24「画面のほうは一度破棄。使い物にならないから要件を正して再起票」)

`PLAN-L7-102-web-dashboard-phase-b` (confirmed) が生んだ `src/web` は、L2 ui-element §2 の
設計部品 (`HierarchyPulldown` / `HeatmapGrid` / `LayerTemplate` 等) から降ろさず、harness.db を
`SELECT` して汎用テーブル描画する **table-dumper prototype** だった (中央UIの mission=工程管理表を
測れない、[[feedback_central_ui_kouteihyou_mission_not_coverage]])。さらに画面 V-model 鎖
`L2 設計+Low-Fi mock → L10 UX refinement/High-Fi mock → src/web 実装` の **L10 を飛ばして**
実装に着手していた。よって prototype を破棄し、要件 (component-derived + 段階順) を正して再起票する。

L7-102 は本 PLAN が `supersedes` で引き継ぐ (errata 規律、.claude/CLAUDE.md / PLAN-L7-89)。
prototype コード (`src/web/*.ts`) と `tests/web.test.ts`、`cli web` command は破棄済 (本 PLAN 着手時に
再生成)。`screen` projection (`PLAN-L7-96`、doc 正本→harness.db read-model) は基盤として保持。

## 1. 要件 (正した前提)

1. **component-derived**: 各画面は L2 ui-element §2 の設計部品から構成する。汎用 table dumper 禁止。
2. **段階順 (V-model)**: `L2 → L10 (UX refinement / High-Fi mock) → impl`。L10 pair-freeze 到達まで
   `implemented_screens` を立てない (`screen-impl-pair-freeze` gate が fail-close)。
3. **mission で測る**: 完遂判定は工程管理表 (mission) で行う。描画数や implemented flip の coverage で
   「Phase B 完遂」と名乗らない ([[feedback_coverage_not_substance]])。
4. **read-only + CLI コピー action** (screen-list §3 S5=b)、**画面ID↔URL 1:1** (screen-list §2) は L7-102 で
   妥当だった制約として踏襲。

## 2. Scope (着手時)

- `src/web/` を ui-element §2 部品ベースで再構築 (render 部品 → 画面 → router/app/server)。
- `cli web` command 再配線、`tests/web.test.ts` を部品単位で再設計。
- L10 (UX refinement) 設計が未到達なら本 PLAN はそこで block (段階順を破らない)。

## 3. Acceptance Criteria

- 15 画面が ui-element §2 部品から構成され、table-dumper 描画が無い。
- `screen-impl-pair-freeze` gate green かつ L10 到達後にのみ `implemented_screens` を宣言。
- mission (工程管理表) で進捗が測れる。
- doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。

## 4. Schedule

- mode: serial。
- Step 1 ✓ (2026-06-24): **L10 設計を起票・authored + cross-reviewed**。`docs/design/harness/L10-ux/`
  (visual-design.md + tokens.yaml)。L2→L10 の設計降下完遂 (§6)。confirmed 昇格は G10 PO サインオフ。
- Step 2: ui-element §2 部品の render 実装。
- Step 3: 画面 → router/app/server 配線 + tests。
- Step 4: review → confirmed。

## 5. 壊さない / 再発させない

- table-dumper への逆戻りを `screen-impl-pair-freeze` + 本 AC で塞ぐ。
- `screen` projection (L7-96) と L2 設計群は破棄対象でない (read-model / 設計は保持・要件を正すのみ)。
- L10 を飛ばさない (段階順を破った L7-102 の再発防止)。

## 6. L10 設計降下完遂 記録 (2026-06-24、Step 1)

L2 ui-element §2 部品から component-derived で L10 UX-refinement 設計を authored し、L2→L10 の設計降下を
完遂した (read-only + CLI コピー S5=b 前提を維持)。

**成果物**:
- `docs/design/harness/L10-ux/visual-design.md` — 15 画面の component-derived High-Fi 設計 (§4 部品 / §5 画面合成 = table-dumper 不在の確認 / §3.4 a11y WCAG 2.2 AA / §6 visual regression)。
- `docs/design/harness/L10-ux/tokens.yaml` — デザイントークン SSOT (FR-30、WCAG 2.2 AA 目標、token 名一意 = AC-FR-30-02 充足)。

**review_evidence (intra_runtime_subagent)**:
- reviewer: code-reviewer (claude-sonnet-4-6) / worker: claude-opus-4-8 (PM)。hybrid だが Codex live dispatch は別途任意 (本 land は sonnet cross-review を採用)。
- reviewed_at: 2026-06-24 / verdict: **APPROVE (Critical 0)**。
- scope: component-derived (汎用テーブル 1 枚で代替不能、§5) / L2 grounding (新規部品・画面の発明なし) / token 健全性 (一意・5 状態・WCAG AA 目標) / a11y (WCAG 2.2 AA) / 誠実性 (status=draft、implemented 詐称なし)。
- Important 3 件 解決済: I-1 (`SeverityBadge`=`StatusBadge` alias 明記 + §5 HM-07 に StatusBadge 追記) / I-2 (HM-04・HM-07 の「再実行トリガー」を S5=b の `CopyButton`(CLI 文字列) と明記、L2 §2 脱落の High-Fi 補完) / I-3 (WCAG 2.2 と AC-FR-30-03 の 2.1 不一致 → oracle 更新を visual-design §7 governance carry に列挙)。Minor 4 件 (M-1〜M-4) 反映済。
- 緑証跡: 本 commit 時点で doctor EXIT 0 / plan lint EXIT 0 (検証ログ参照)。

**次工程**: G10 (UX 磨き完了) PO サインオフ → L10 doc `confirmed` 昇格 → Step 2-4 (実装)。
中央UI「フロント編集/送信」方向 (PO 2026-06-24) が確定すれば、本 L10 設計に edit/submit affordance を
back-prop する (read-only 維持の最小形 = 既存 `CopyButton`/`NextActionCard` の指示生成への延長)。
