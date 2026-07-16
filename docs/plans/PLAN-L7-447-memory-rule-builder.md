---
plan_id: PLAN-L7-447-memory-rule-builder
title: "PLAN-L7-447 (add-impl): メモリ→機構化ビルダー (rule-candidate マーカーと PLAN scaffold)"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / Claude (起票) / Codex (実装)
parent_design: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE (Codex) - memory rules CLI (list / scaffold) の実装"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-447-memory-rule-builder.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  requires: []
  references:
    - .ut-tdd/memory/feedback-po-2026-07-16.md
    - docs/plans/PLAN-L7-445-ops-rule-mechanization.md
    - docs/plans/PLAN-L7-446-model-policy-enforcement.md
---

# PLAN-L7-447 (add-impl): メモリ→機構化ビルダー

## 背景 (PO 方針 2026-07-16)

ルールはメモリ永続化で終わらせず機構化する。ただし機構化候補の発見はメモリ運用の中で起きるため、
「このメモリはルール化 (機械強制) すべき」を書き残す形式と、それを PLAN 起票へ流す
ビルダーを作る。にゃ！プロトコル (`.ut-tdd/memory/feedback-po-2026-07-16.md`) の
猫絵文字スケールを拡張し、機構化候補マーカーを機械可読にする。

## スコープ

1. **マーカー形式**: にゃ！プロトコルへ機構化候補マーカーを追加 — 本文/タイトル先頭の
   `🐈‍⬛` (黒猫 = 「機構に変身待ちにゃ」) と、frontmatter tag `rule-candidate`。
   マーカーには望ましい enforcement 面 (doctor チェック / hook / CLI gate / lint / schema) を
   1 行で添える。
2. **`ut-tdd memory rules list`**: `.ut-tdd/memory/` を走査し、rule-candidate マーカー付き
   エントリを enforcement 面別に一覧する (未処理 / PLAN 起票済み / 機構化済みの状態付き)。
3. **`ut-tdd memory rules scaffold <memory-id>`**: 候補メモリから PLAN draft を scaffold する
   (plan_id 採番、kind=add-impl + Reverse pairing 雛形、背景にメモリ本文を引用、
   enforcement 面から generates 候補を提案)。起票後はメモリ側 frontmatter に
   `promoted_plan: <plan_id>` を書き戻し、「機構化済み、正本は実装」ポインタ運用へ移す。
4. **doctor `rule-candidate-staleness`**: rule-candidate のまま N 日 (例 14 日) 放置された
   メモリを warn surface し、機構化待ち行列が埋没しないようにする。
5. **メモリ 20K 圧縮ルールの機械化 (PO 例示 2026-07-16)**: メモリ運用ルール自体も prose に
   しない先行例として、サイズ予算を doctor チェック化する — 単一エントリ上限 (例 20KB) と
   総量/エントリ数の警告閾値を定義し、超過は `memory add` 時に fail-close、既存超過は doctor で
   warn + 圧縮候補 (最終更新が古い順・promoted_plan 済みで実装が正本になったもの) を提示する。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | マーカー形式の確定 + にゃ！プロトコル memory 更新 | 直列 |
| 2 | memory rules list + test | 直列 |
| 3 | scaffold + promoted_plan 書き戻し + test | 直列 |
| 4 | staleness doctor チェック + test | 並列可 (Step 3 と独立) |
| 5 | memory サイズ予算 (20K) gate + doctor チェック + test | 並列可 (Step 3 と独立) |
| 6 | typecheck + targeted green + doctor 実走 | 直列 (最後) |

## DoD

- [ ] rule-candidate マーカー付きメモリが list で enforcement 面別に列挙される (test 固定)
- [ ] scaffold が schema 適合の PLAN draft を生成し、メモリへ promoted_plan を書き戻す (test 固定)
- [ ] マーカー無しメモリを誤検出しない (test 固定)
- [ ] 放置候補が doctor で warn される (test 固定)
- [ ] サイズ予算超過の memory add が fail-close し、既存超過が doctor で圧縮候補付き warn になる (test 固定)
