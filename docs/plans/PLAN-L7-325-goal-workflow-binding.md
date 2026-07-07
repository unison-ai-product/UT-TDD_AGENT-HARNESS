---
plan_id: PLAN-L7-325-goal-workflow-binding
title: "PLAN-L7-325 (impl): goal×駆動モデル結合 — 起点を駆動モデル選定に固定し、goal 条件を mode exit contract に機械束縛する"
kind: impl
layer: L7
drive: agent
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - goal 文テンプレートの承認と v2 活性化時期"
  - role: tl
    slot_label: "TL - exit-check の判定境界 (block でなく advisory から) のレビュー"
  - role: se
    slot_label: "SE - goal synth + drive exit-check の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-325-goal-workflow-binding.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/harness-v2-update-strategy.md
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - docs/plans/PLAN-L7-242-mode-exit-enforcement-batch.md
    - docs/plans/PLAN-L7-253-orchestrator-model-identity-advisor-triggers.md
    - docs/plans/PLAN-L7-237-research-drive-hardening.md
---

# PLAN-L7-325 (impl): goal×駆動モデル結合

## Status

**version-up parked (v2)**。PO 発案 (2026-07-03)「ゴールを自分で作って設定してワークフローに従う方が駆動漏れが少ない。起点を駆動モデル選定にしちゃう」。

## 背景

- A-178 が特定した制御層の穴の筆頭は「**無記録発火**」— 作業が駆動モデルの選定・記録を経ずに始まり、mode の exit 義務 (back-fill / R4 / handover) が漏れる。現状の /goal 運用は goal 文が自由記述で、駆動モデルとの結合が無い (今セッションの /goal も route 記録なしで開始された — 本 PLAN の起票自体が実例)。
- 一方で部品は揃っている: route 判定 (`ut-tdd task classify` + A-156 ledger)、mode exit contract (L7-240/241/242 系)、Claude 側の goal Stop hook (条件成立まで停止をブロック)。**欠けているのは「task → route → goal 文」の合成と「goal 条件 → exit contract」の機械束縛**。

## スコープ (1 要件: セッションの起点を駆動モデル選定に固定し、goal 充足判定を mode exit contract で機械化する)

1. **`ut-tdd goal synth --task "..."`**: (a) route eval を実行し mode を確定・記録 (A-156 ledger + drive run 起票 — 無記録発火の解消点) (b) 確定 mode の exit contract から **goal 文を生成** — 日本語 1 段落 + 機械検証条件の列挙 (例: 「reverse R0→R4 完了、`ut-tdd plan lint` exit 0、backprop_decision 記録済、`ut-tdd drive exit-check` exit 0」)。PO はこの文を Claude の `/goal` に貼る (Codex 側は session 冒頭指示に使う — 両 runtime 同文)。
2. **`ut-tdd drive exit-check`**: active drive run の exit contract 充足を判定する軽量コマンド (既存 exit 強制群の判定を 1 コマンドに集約、exit 0/1)。goal 文の最終条件はこれに固定する — **goal 充足の自己申告を排し、機械判定にする** (coverage≠substance の goal 版)。
3. **Stop hook advisory**: 既存 `Stop: session summary` に「active drive run が exit 未達のまま停止しようとしている」警告を追加。**block はしない** (誤 block = forced-stop 級の実害。block 化は advisory の運用実績を見て PO 判断 — 段階導入)。
4. **template の資産化**: mode 別 goal 文テンプレート (11 駆動 + Forward) を doc 化し、goal synth が参照。テンプレは exit contract の変更に追随する (contract が正、テンプレは表示形)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | goal 文テンプレート + exit-check 判定境界の設計 (TL/PO) | 直列 |
| 2 | drive exit-check 実装 (既存 exit 群の集約) | 直列 |
| 3 | goal synth 実装 (route eval 接続 + 文生成) | 直列 |
| 4 | Stop hook advisory + adapter doc (CLAUDE.md/AGENTS.md へ運用手順) | 直列 |
| 5 | regression test (mode 別 goal 文 / exit 未達で exit-check 1 / 達成で 0 / 無記録発火が synth 経由で記録される) | 直列 |

## DoD

- [ ] `goal synth` が route 記録付きで mode 別 goal 文を生成する (test 固定)
- [ ] `drive exit-check` が exit contract 未達で exit 1、充足で exit 0 (test 固定)
- [ ] Stop hook が exit 未達停止に advisory を出す (test 固定、block しないことも test 固定)
- [ ] 生成 goal 文の検証条件がすべて実行可能コマンドである (cited-command 系 lint で機械確認)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/cli.ts` (goal synth / drive exit-check — Codex 抽出後の登録形式に従う)、`src/workflow/` (exit contract 集約)、session summary hook 経路、CLAUDE.md/AGENTS.md (運用 1 節、rule-drift marker 整合)。
- 依存の実質: exit contract が未強制の mode が残っている間は exit-check が「何も検査しない green」になる — **L7-242 の消化が先行依存** (未強制 mode は exit-check が `not_enforced` を明示表示し、無検査 green を偽装しない)。
- /goal は Claude Code built-in であり orchestrator が自分で打てない — 「自分で作って設定」の実装形は「synth が文を作る → PO が貼る」の半自動。完全自動化 (SessionStart で自動 goal 化) は誤 goal 固定のリスクがあるため本 PLAN では見送り、運用実績後に判断。
