---
plan_id: PLAN-L6-81-vmodel-specialist-agent-registry
title: "PLAN-L6-81 (add-design): V モデル専門エージェント registry — layer × drive × task-kind 行列と context pack 注入"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-14
updated: 2026-07-14
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - registry schema / 生成 adapter / drift gate の契約"
  - role: qa
    slot_label: "QA - blind-review 隊の context 遮断と帰責判定の検証設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-81-vmodel-specialist-agent-registry.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/plans/PLAN-L7-430-task-kind-model-routing-v2.md
    - docs/plans/PLAN-L6-53-adversarial-review-mechanism.md
    - docs/plans/PLAN-L7-302-context-tiering.md
    - docs/plans/PLAN-L7-426-codex-native-subagents.md
    - src/skill-engine/
    - src/team/model-policy.ts
    - .claude/agents/blind-reviewer.md
---

# PLAN-L6-81 (add-design): V モデル専門エージェント registry

## 0. 位置づけ / PO 指示 (2026-07-14 チャット)

PLAN-L7-430 で確定した標準割当 (task-kind × model × effort ladder) を「エージェントの
中身に書く」のではなく **HARNESS 所有の registry 側パラメータ**へ昇格し、V モデルに沿った
タスク分解 / コンテキスト注入管理で専門エージェント化する。Claude Code 標準
(`.claude/agents`) にも Codex 標準にも依存せず、**HARNESS が agent 定義の単一正本を持ち、
両 runtime へは生成 (射影) する** (PO 方針 2026-07-14)。

既存 PLAN との関係 (重複起票せず改修で対応):

- PLAN-L6-53 (敵対検証機構): blind-review の判定規約はそちらが正本。本 PLAN は
  「blind-review **隊** を registry 上の第一級 agent 種として定義し、context 遮断を
  registry の機械属性にする」拡張のみ担う。
- PLAN-L7-302 (context tiering): 常時必読 context の動的ロード化はそちらが正本。本 PLAN の
  context pack は 302 の tier 機構を「agent 単位のスコープ」として消費する側。
- PLAN-L7-426 (Codex native subagents): `.codex/agents` 生成 adapter はそちらの実装を
  registry からの射影に付け替える (生成元が手書き `.claude/agents` → registry へ変わる)。

## 1. registry 行列 (単一正本)

agent 定義 = **layer × drive × task-kind** の行列 1 行。格納は `.ut-tdd/agents/*.yaml`。

| 属性 | 内容 | 正本 |
|---|---|---|
| layer | V モデル層 (L4-L8 等)。担当成果物の層 | 本 registry |
| drive | 専門職 (5 種 taxonomy)。PLAN frontmatter の drive と同語彙 | 既存 drive taxonomy |
| task_kind | test / implementation / design / docs / research / review / uiux (L7-430 の intent 語彙) | model-policy TASK_INTENTS |
| model / effort | 標準割当 + effort ladder から**参照** (直書き禁止) | MODEL_IDS / MODEL_EFFORT_LADDER |
| context_pack | 注入する context のスコープ宣言 (下記 §2) | 本 registry + L7-302 tier |
| skills | 注入する skill の allowlist (skill-engine 連動、下記 §3) | skills/ + skill-engine |
| generates / forbidden_paths | 出せる成果物種と触れない領域 (pair 制約の機械強制) | 本 registry |
| blind | context 遮断属性 (下記 §4)。true の agent には作成側文脈を渡さない | 本 registry |

生成 (射影): `ut-tdd agents sync` が `.claude/agents/*.md` と `.codex/agents` (L7-426) を
registry から生成。doctor に drift gate (生成物 ≠ registry 由来で fail-close) を追加。

## 2. context pack (コンテキストを「持たせない」管理)

- 層スコープ注入: L6 agent には function-spec + 対象 contract のみ、L7 テスト実装者には
  凍結済み test-design + 対象モジュール契約のみ。governance 全文は注入しない。
- 不変条件: **層が下がるほど注入 context は小さくなる**。下位帯モデル (spark high /
  mini xhigh) は context 純度と effort で能力を補う (L7-430 ladder の設計意図)。
- 実装は PLAN-L7-302 の tier 機構を agent スコープの selector として使う。

## 3. skill 連動 (PO 指示)

- registry の `skills` 属性が skill-engine (`ut-tdd skill suggest` / injection) と連動し、
  agent 起動時に該当 skill だけを注入する (bulk-load 禁止の既存原則を agent 単位で機械化)。
- skill 側 frontmatter に `applicable_agents` (または layer/drive セレクタ) を追加し、
  推薦は双方向 (agent→skill allowlist、skill→agent セレクタ) の交差で決める。

## 4. blind-review 隊 (context 遮断の第一級化、PO 強調)

- **純粋にコンテキストを持たせない** review 専任 agent 群を registry 上の種として定義する:
  作成者の主張・意図・自己評価・チャット文脈を一切注入せず、成果物 + 凍結 spec + 実走
  テストだけを渡す (L6-53 の claim-blind / spec-blind 2 lane 規約を継承)。
- **テスト実装者と実装者を分ける** (Terra=テスト実装 / Luna=実装、L7-430 で既に席が分離)。
  作成系 3 役 (設計者 / テスト実装者 / 実装者) が独立していると、blind review の red/green
  パターンから**帰責が機械的に切り分けられる**:
  - 設計 blind (spec-blind) が FLAG → 設計が悪い
  - 凍結テストが実装で red かつテスト blind が PASS → 実装が悪い
  - テスト blind が FLAG (バグ版で red にならない等の oracle 不全) → テストが悪い
- 帰責判定は gate_runs / findings へ記録し、モデル入替判定 (L7-430 追補 3:
  トークン × 単価 × クリティカル発見数) の材料にする。

## 5. タスク分解との接続

- PLAN schedule step 単位で `(layer, drive, kind)` → registry 参照 → 専門 agent 起動
  (tier-router へ食わせる)。pair 制約 (design↔test-design) は `generates` 宣言で機械強制。
- 「浅い」時は `escalateShallowResponse`、想定未満 orchestrator は
  `advisorHeavyUseRecommended` で advisor 多用 (L7-430 の制御弁をそのまま使う)。
- ゲート対応: pair-freeze=設計レビュー / trace-freeze=実装レビュー / accept=ブラインド
  レビュー (REVIEW_LANES、非作成側 provider)。

## AC (L7 実装 PLAN へ引き継ぐ受入条件の骨子)

- [ ] registry schema (layer/drive/task_kind/context_pack/skills/blind/generates) が
      schema 検証つきで定義され、`ut-tdd agents sync` の生成物と drift gate がテストで
      固定されている。
- [ ] model/effort が registry に直書きされず MODEL_IDS / MODEL_EFFORT_LADDER 参照である
      ことが lint で fail-close する。
- [ ] blind=true agent の起動経路で作成側文脈が注入されないことが負例テストで固定されている。
- [ ] skill 連動 (agent→skill allowlist 交差) が skill-engine テストで固定されている。
- [ ] 帰責 3 分類 (設計/テスト/実装) の判定パターンが L7 test design に oracle として
      同期されている。
