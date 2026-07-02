---
plan_id: PLAN-L7-250-layer-question-catalog
title: "PLAN-L7-250 (impl): L 単位分岐質問カタログ + harness-native エリシテーション (初開発ナビ)"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/process/forward/L00-L06-design-phase.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 質問カタログの内容承認 (何を必ず聞くか) と提示様式の確定"
  - role: tl
    slot_label: "TL - 分岐設計 (回答→routing/doc slot/skip) と既存機構合成のレビュー"
  - role: se
    slot_label: "SE - カタログ schema + elicit CLI + 回答記録の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-250-layer-question-catalog.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-219-gate-phase-elicitation-guide.md
    - src/workflow/design-elicitation.ts
    - docs/process/gates.md
    - docs/process/modes/README.md
---

# PLAN-L7-250 (impl): L 単位分岐質問カタログ + harness-native エリシテーション

## Status

draft 起票 (PO 発案 2026-07-02:「ロック中の AskUserQuestion をカスタマイズして UT ハーネスの分岐質問に適合できないか。L 単位の質問リスト化で初開発でも迷わない体制が組める」)。

## 方針境界 (最初に固定)

- **chat の AskUserQuestion ツールは封印継続** (PO ルール 2026-06-02)。本機構はその UI を復活させるものではなく、「構造化質問 + 選択肢 + 分岐」という設計概念だけを **harness native (CLI / doc / DB)** に翻案する。
- agent から PO への提示は常に **平易な prose** (内部 gap 番号で聞かない)。カタログは「聞くべきことの SSoT」であり、聞き方はチャット規約に従う。

## 背景 — 素材は分散して実在、束ねる質問カタログが無い

初開発 (fresh consumer) で「この層で何を決めるべきか / どの選択肢があるか / 答えによって次がどう変わるか」が分散していて迷う:

- L00-L06-design-phase.md の per-layer sub-doc 必須/選択表 (drive 依存の分岐が既にある)
- gates.md の gate ごとの確認対象列 (拡張案 = PLAN-L7-219、future park 中)
- modes README §4 の signal → mode routing 表 (入口分岐)
- `task classify` / `team suggest` (難易度・編成の分岐判定は機械化済み)
- `src/workflow/design-elicitation.ts` — design-bottomup 用 elicitation engine の実装前例 (既存機構を合成し再発明しない設計)

## スコープ

1. **質問カタログ (宣言的正本)**: L0-L14 ごとに「質問 / 選択肢 / 分岐先 (次質問・mode routing・doc slot・skip 条件) / 記録先 (frontmatter / state / DB)」を schema 付き宣言形式で定義。gate 断面 (G0.5-G14) も同カタログの view とする。
2. **elicit CLI**: `ut-tdd elicit --layer <L>` / `--gate <G>` / `--start` (初開発ナビ: L0 から順に未回答項目を案内)。出力は prose (人間可読)。`--json` で agent 消費用。
3. **回答の永続化**: 回答を DB (elicitation_responses 系) + 対応 frontmatter/state へ記録。回答が分岐条件 (route eval / task classify) へ接続 — design-elicitation の合成パターンを踏襲。
4. **未回答の可視化**: 必須質問の未回答を doctor が surface (導入は advisory、fail-close 化は運用実績を見て PO 判断)。
5. **PLAN-L7-219 との関係**: L7-219 (gates.md 確認対象列の拡張、version_target: future) は本カタログの gate 断面に内包され得る。活性化時に統合 or supersede を判断し、双方向参照を残す (plan-supersession 規律)。

## 拡張アイディア (カタログに載せる質問源の候補、実装時に PO と選定)

- 層別: L0 (誰の何の課題か / 価値検証の形)、L1 (FR/NFR/画面/技術の必須確定点)、L3 (AC 粒度 / NFR グレード)、L4 (アーキ選択肢 / security slot)、L5/L6 (V-pair 粒度)、L7 (TDD 経路 / チーム編成)、L8-L14 (検証帯 / 運用 checklist = PLAN-L7-249 と接続)
- mode 入口: 「作れるか不明か」「既存実装があるか」等の分岐 → signal → mode routing へ直結

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | カタログ schema + L1 縦 1 本 (質問→分岐→記録) の PoC | 直列 |
| 2 | PO 内容承認 (何を必ず聞くか) → L0-L14 展開 | 直列 |
| 3 | elicit CLI + 回答永続化 + routing 接続 | 直列 |
| 4 | doctor surface (advisory) + 初開発ナビ (--start) + fresh consumer smoke | 直列 |

## DoD

- [ ] fresh consumer で `elicit --start` が L0 から未回答必須項目を prose で案内する (smoke 固定)
- [ ] 回答が DB へ記録され、分岐 (routing/skip) が回答に追従する (test 固定)
- [ ] chat AskUserQuestion への依存が一切ない (実装は CLI/doc native のみ)
