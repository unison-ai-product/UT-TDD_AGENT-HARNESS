---
plan_id: PLAN-L7-191-distribution-helix-wording-erasure
title: "PLAN-L7-191 (impl): 配布面の HELIX 連想抹消 — 配布対象(ALLOW)の system doc 6 ファイルから HELIX 記述を除去。正規方法論 doc(ADR-001/005・governance/README)は中立化、test fixture は generic legacy token へ改名、dogfood 移行 doc 2 本は denylist で配布除外"
kind: impl
layer: L7
drive: be
status: draft
version_target: future
created: 2026-06-29
updated: 2026-06-29
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE — ADR/README の HELIX 名・配布外 doc への dangling link 中立化 + test fixture 改名 + dogfood 移行 2 doc の CLEAN_DENY 追加(+test)"
  - role: tl
    slot_label: "TL — ADR-001 は binding・配布(外向き)・extraction-plan は ADR-005 で supersede 済の確認、解体でなく配布除外で意味保持のレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-191-distribution-helix-wording-erasure.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/plans/PLAN-L7-68-provider-dispatch-portability.md
---

# PLAN-L7-191 (impl): 配布面の HELIX 連想抹消

## 優先度: version-up parked / 将来版へ保全 (PO 2026-06-29)

PO 決定 (2026-06-29): いまは配布クローズを優先。本対応も将来版へ保全 (`status=draft` + `version_target: future`)。

> 注: 本 PLAN は配布クローズに最も近い (配布面の hygiene)。**現行の HELIX 記述は reference-only として
> 正しい** (誤りでなく present なだけ) ので v1 で as-is 出荷しても破綻はせず、deferral は低リスク。
> もし v1 リリースで HELIX 連想ゼロを要するなら、6 ファイルと小さいので本 PLAN を現行クローズへ前倒し可能
> (PO 指示で activation)。

## 0. 前提 (調査結論 2026-06-29)

runtime (src/scripts/tests) の `HELIX_` env・helix command・vendor snapshot は除去済 (PLAN-L7-68、
`grep HELIX_ src`=0、`vendor/helix-source` ABSENT、`.helix/` ABSENT)。残るのは **配布対象(ALLOW)面の
system doc 6 ファイル**のみ。migration/archive/audit/handover/設計群は **非配布** (CLEAN_DENY) のため対象外
(歴史・監査証跡は削除しない = extraction-plan §99 / 監査改ざん禁止)。正本原則 =
[[feedback_helix_is_reference_only_not_runtime_naming]]。

## 1. Scope

### IN (本 PLAN) — 配布 ALLOW 面の 6 ファイル
- **中立化 (正規方法論 doc・配布する)**:
  - `docs/adr/ADR-001-...md` (L6, L77): `helix CLI`→「legacy 外部 drive CLI」、配布外 migration doc への
    dangling link 除去。
  - `docs/adr/ADR-005-...md` (L6): 配布外 doc(`helix-to-ut-tdd-cutover-strategy`/extraction-plan) への参照を中立化/除去。
  - `docs/governance/README.md` (L15): `helix-porting-map.md` 等への参照を「source snapshot 概念」へ中立化。
- **改名 (test fixture・配布する)**:
  - `tests/workflow-contracts.test.ts` (L213, L550): `helix reverse`/`helix doctor` を generic legacy token
    (例 `legacy-cli reverse`) へ。legacy 拒否 gate の意味は不変、連想消去に有効。
- **配布除外 (dogfood 移行 doc・解体しない)**:
  - `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md` (25 件、ADR-005 で supersede 済の dogfood 移行計画)
  - `docs/governance/runtime-parity-l0-l3-design-audit-2026-06-02.md` (4 件、本 repo の L0-L3 移行監査)
  - → 本文を抉る (解体) のでなく `src/setup` の `CLEAN_DENY` へ追加して**配布パッケージから落とす** (+test)。

### OUT (本 PLAN では作らない)
- 非配布の migration/archive/audit/handover/設計群の HELIX 削除 (歴史・監査証跡、削除対象でない)。
- いま実装すること (version-up parked。ただし PO 指示で現行クローズへ前倒し可)。

## 2. Acceptance Criteria
- 配布パッケージ (clean-distribution artifactPaths) に HELIX 痕が残らない。
- ADR-001/005・README の意味 (決定内容) を変えずに HELIX 名・dangling link のみ除去。
- dogfood 移行 2 doc が clean-distribution から除外される (denylist test で機械保証)。
- migration/archive/audit の HELIX (歴史証跡) は不変。
- doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。

## 3. Schedule
- mode: serial。
- Step 0: 配布 ALLOW 面の HELIX 言及確定 (6 ファイル、調査済) と除外 vs 中立化の振り分け確認。
- Step 1: ADR-001/005・README の HELIX 名・dangling link 中立化。
- Step 2: test fixture を generic legacy token へ改名。
- Step 3: dogfood 移行 2 doc を CLEAN_DENY へ追加 + clean-distribution 除外 test。
- Step 4: clean-distribution artifactPaths に HELIX 0 を検証 → review → confirmed。

## 4. 壊さない / 再発させない
- ADR は binding・配布は外向き。決定内容を改変しない (名前と dangling link のみ除去)。
- 歴史・監査証跡を削除しない (extraction-plan §99 / 監査改ざん禁止)。
- 配布は不可逆ゆえ PO 承認後に実行 ([[project_harness_distribution_public_private_boundary]])。
