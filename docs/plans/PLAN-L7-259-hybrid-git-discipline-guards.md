---
plan_id: PLAN-L7-259-hybrid-git-discipline-guards
title: "PLAN-L7-259 (impl): hybrid git 規律の機械化 (stage 方法 / history 破壊 / branch protection surface)"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
agent_slots:
  - role: po
    slot_label: "PO - solo main-direct 運用と防御強度のバランス確定 (block か warn か)"
  - role: tl
    slot_label: "TL - git hook 拡張の誤検知境界レビュー (hybrid 正常運用を塞がない)"
  - role: se
    slot_label: "SE - hook/lint 実装"
parent_design: docs/design/harness/L6-function-design/cross-review-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
generates:
  - artifact_path: docs/plans/PLAN-L7-259-hybrid-git-discipline-guards.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - src/runtime/work-guard.ts
    - src/setup/branch-protection.ts
---

# PLAN-L7-259 (impl): hybrid git 規律の機械化

## Status

draft 起票 (A-178 G-5)。

## 背景 — hybrid の生命線が全て prose のみ

CLAUDE.md「Hybrid 多ランタイム commit 協調」は必須規律だが機械裏付けゼロ:

- `git add -A`/`git add .` 禁止 → pre-commit は staged **内容**の secret 検査のみで staging **方法**は無検査。相手ランタイムの in-flight 変更を巻き込んだ commit を機械では止められない。
- 他ランタイム commit の reset/revert/checkout/force 禁止 → pre-rebase 等 git hook は sample のまま。
- force-push 防止 → pre-push は PII 検査のみ。GitHub branch protection は opt-in (`--apply`+interactive) で常時適用の証跡なし。

## スコープ

1. **巻き込み commit 検査 (pre-commit 拡張)**: staged file のうち「現 session が触っていない + 相手ランタイム in-flight とみなせる」file を work-guard と同じ判定情報で検出し warn/block (強度は PO 判断)。work-guard の Edit 時点防御を commit 時点まで延長する二段目。
2. **history 破壊検知**: pre-rebase / reflog 照合で「自分が作っていない commit を書き換える操作」を warn。force-push は pre-push で検知し明示確認を要求。
3. **branch protection の可視化**: 適用状態 (有効/無効) を doctor surface に出す (適用の強制はしない — solo main-direct 運用 ([[feedback_main_direct_solo]]) と両立させる)。
4. 全て hybrid 正常運用 (相手 commit の上に積む rebase/stack) を塞がない誤検知境界を test で固定。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 防御強度 (block/warn) と誤検知境界の確定 (PO+TL) | 直列 |
| 2 | pre-commit 巻き込み検査 実装 | 直列 |
| 3 | history 破壊検知 + branch protection surface | 直列 |
| 4 | regression test (正常 hybrid フローが通る / 巻き込みが検知される) | 直列 |

## DoD

- [ ] session 非接触 file の staged が warn/block される (test 固定)
- [ ] 正常な rebase/stack フローが誤検知されない (test 固定)
- [ ] branch protection 状態が doctor で見える
