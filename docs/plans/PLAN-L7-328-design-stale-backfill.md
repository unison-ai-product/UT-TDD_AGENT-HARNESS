---
plan_id: PLAN-L7-328-design-stale-backfill
title: "PLAN-L7-328 (impl): L5 module-decomposition の凍結 stale 是正 — lint 5 file/stub 記述の実態 back-fill"
kind: refactor
layer: L7
drive: be
status: draft
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "L5 module-decomposition の stale 記述を HEAD 実態へ更新するのみ。設計の意味・スコープ・上位要件は不変。固定数は書かず正本参照へ置換するため再 stale もしない。"
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/module-decomposition.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 (wave Q0 先頭推奨、docs のみ・Codex 無衝突)"
  - role: tl
    slot_label: "TL - back-fill 内容のレビュー (固定数直書き禁止原則の遵守確認)"
  - role: se
    slot_label: "SE - module-decomposition.md の記述更新"
generates:
  - artifact_path: docs/plans/PLAN-L7-328-design-stale-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L4-basic-design/architecture.md
---

# PLAN-L7-328 (impl): L5 module-decomposition の凍結 stale 是正

## Status

**version-up parked (v2)**。A-182 所見 DQ-1/DQ-3 (QU-1)。PO 指示 2026-07-03「アップデートでプラン化」。

## 背景 (実測 2026-07-03、A-182 §2)

- `docs/design/harness/L5-detailed-design/module-decomposition.md:28` が lint module を「`src/lint/*.ts` (5 file)」と記述。現物は 78 ファイル (`git ls-files 'src/lint/*.ts' | wc -l`)。§6 の lint 共通様式説明も 5 lint 前提のまま。
- 同 doc L29-30 が `plan/lint.ts` を「stub」、`vmodel/lint.ts` を「stub（仮実装）」と記述。現物は 953 行 / 427 行の完全実装。
- 影響: 後続エージェントが L5 設計 doc を信じると「lint は 5 種」「plan lint は未実装」と誤認し、重複実装や誤った依存方針を誘発する (DQ-1/DQ-3)。L4 architecture.md は現役 (module-drift lint が機械保証) だが L5 が凍結スナップショットのまま。

## スコープ (1 要件: module-decomposition.md の記述を HEAD 実態へ back-fill する)

1. L28 の「(5 file)」を撤去し、**固定数を直書きしない** (architecture.md 既定「件数は code が正本」に従い「拡張継続中、実数は `src/lint/` が正本」形式へ) — Codex の抽出リファクタ進行中に数字を書くと即再 stale するため。
2. L29-30 の「stub」記述を「実装済」へ更新し、実装証跡 PLAN-ID を明記。
3. §6 の「5 lint はテンプレート」前提の記述を「共通様式 (load/analyze/Messages)」の一般形へ更新。lint gate 様式の正本化は PLAN-L7-335 (QU-8) が担い、本 PLAN は既述の是正のみ (スコープ縮小をしない/広げない)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 該当 3 箇所の現物突合 (Grep 再実測 — 起票時行番号は snapshot) | 直列 |
| 2 | back-fill 編集 + readability green 確認 | 直列 |

## DoD

- [ ] module-decomposition.md に「5 file」「stub」の stale 記述が残存しない (grep で 0 件)
- [ ] 固定ファイル数の直書きが増えていない (数字でなく正本参照で記述)
- [ ] `bun src/cli.ts doctor` の readability / doc 系 check green

## 実装ノート (後続モデル向け)

- 触るファイル: `docs/design/harness/L5-detailed-design/module-decomposition.md` のみ (docs-only、コード無変更)。
- kind は活性化時に §6 手順で昇格判断 (docs back-fill のため reverse back-fill 型が自然)。
