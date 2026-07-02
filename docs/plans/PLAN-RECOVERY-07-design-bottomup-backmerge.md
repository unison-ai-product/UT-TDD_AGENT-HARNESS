---
plan_id: PLAN-RECOVERY-07-design-bottomup-backmerge
title: "PLAN-RECOVERY-07 (recovery): design-bottomup mode の正本 back-merge 未着地の解消"
kind: recovery
layer: cross
drive: agent
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: aim
    slot_label: "AIM - back-merge 収束サイクルの主担当"
  - role: po
    slot_label: "PO - concept §2.5 9→10 mode 規範変更のサインオフ (規範変更は concept/requirements 先行)"
  - role: tl
    slot_label: "TL - modes README 台帳 / passage lint / 正本 doc の 3 点同期レビュー"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-07-design-bottomup-backmerge.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-DISCOVERY-07-design-bottomup-mode.md
  references:
    - .ut-tdd/audit/A-173-drive-model-coverage-audit-2026-07-02.md
    - docs/process/modes/README.md
    - src/lint/drive-model-passage.ts
---

# PLAN-RECOVERY-07 (recovery): design-bottomup mode の正本 back-merge 未着地の解消

## Status

draft 起票 (PO /goal 指示 2026-07-02)。PO 確認済み (2026-07-02): DISCOVERY-07 Step 5 は「未着手の可能性 = 意図的 park ではない」扱い。

## 根本原因 (A-173 F-1、deviation)

PLAN-DISCOVERY-07 (status=confirmed) の Step 5 が要求する back-merge が未着地のまま機械層だけ稼働:

- `docs/process/modes/design-bottomup.md` 不在
- modes README §2 台帳・§3 対応表に未掲載
- concept §2.5 が 9-mode のまま (10 mode 化未反映、PO サインオフ必須の規範変更)
- `src/lint/drive-model-passage.ts` EXPECTED_MODES (9 種) に未登録 (version-up も同様に未登録)

「実装したが正本へ戻していない」class の逸脱 ([[feedback_impl_must_backfill_to_design]] と同型)。

## 再発防止 (recovery exit 3 要件)

- **root cause**: confirmed 化と Step 成果物着地の順序逆転 + 新 mode 追加時にカタログ列挙群 (README/passage lint/concept) を同期する機械強制の不在。
- **guard/test の具体変更点**: (a) back-merge 一式の着地 (design-bottomup.md 起票 + README 台帳 + concept §2.5 PO サインオフ + EXPECTED_MODES へ design-bottomup / version-up 追加)、(b) mode カタログの SSoT 突合 lint (route-map の mode 集合 ⊆ modes README 台帳 を fail-close) を追加し、次の新 mode で再発させない。
- **L14 route**: mode カタログ drift の運用検証観点として L14 へ記録。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | concept §2.5 の 10 mode 化 (PO サインオフ、規範変更先行) | 直列 |
| 2 | design-bottomup.md 正本起票 + README 台帳/対応表反映 | 直列 |
| 3 | EXPECTED_MODES 追加 (design-bottomup / version-up) + カタログ SSoT 突合 lint | 直列 |
| 4 | DISCOVERY-07 Step 5 の完了記録 (correction note) | 直列 |

## DoD

- [ ] route-map に存在する全 mode が modes README 台帳と正本 doc を持つ (突合 lint green)
- [ ] drive-model-passage lint が 11 mode を要求して green
- [ ] concept §2.5 の mode 数と台帳が一致 (PO サインオフ記録付き)
