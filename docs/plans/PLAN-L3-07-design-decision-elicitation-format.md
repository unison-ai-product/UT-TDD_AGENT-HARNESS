---
plan_id: PLAN-L3-07-design-decision-elicitation-format
title: "PLAN-L3-07 (add-design): 設計判断エリシテーション共通フォーマット — AskUserQuestion の設計判断特化 + Codex markdown 等価表現"
kind: add-design
layer: L3
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-13
updated: 2026-07-13
owner: PM / PO
parent_design: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "PO インタラクション運用ルールの追加 (workflow 規約 + skill 内容 + adapter ルール文言) であり、harness の L0/L1 要件・runtime 実装を変えない。"
agent_slots:
  - role: aim
    slot_label: "AIM — フォーマット設計 (設計判断の対象/非対象の線引き、両ランタイム等価性)"
  - role: tl
    slot_label: "TL — CLAUDE.md/AGENTS.md 改訂が rule-drift・既存 PO ルールと矛盾しないことのレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L3-07-design-decision-elicitation-format.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/design-decision-elicitation.md
    artifact_type: markdown_doc
  - artifact_path: skills/design-decision-elicitation.md
    artifact_type: markdown_doc
  - artifact_path: CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: AGENTS.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-53-adversarial-review-mechanism.md
review_evidence: []
---

# PLAN-L3-07 (add-design): 設計判断エリシテーション共通フォーマット

## 背景

PO 要望 (2026-07-13): AskUserQuestion を「設計判断に特化して聞く」用途に
カスタマイズしたい。かつ Codex 側にも同等の聞き方が欲しい。

AskUserQuestion は組み込みツールでスキーマ改造はできないため、
(1) 使用範囲を設計判断に限定する運用ルール、(2) 質問フォーマット (前提 +
選択肢 2〜4 + trade-off + 推奨 + preview) を固定する skill、(3) Codex 用の
markdown 等価表現 (`## 設計判断依頼` 表) の 3 点で実現する。従来 PO ルールの
「AskUserQuestion 不使用」は「設計判断に限り使用可 (対話セッションのみ)」へ改訂。

## 工程表

### Step 1: [直列] 共通フォーマット定義
- `docs/governance/design-decision-elicitation.md` を canonical として作成。
  対象/非対象の線引き、共通ルール 7 項、Claude 側 / Codex 側の実装を定義。

### Step 2: [並列] skill 化
- `skills/design-decision-elicitation.md` (skill.v1) を作成し、decision_points
  で聞き方の判断分岐を機械可読化する。

### Step 3: [並列] adapter ルール改訂
- `CLAUDE.md` / `AGENTS.md` のコミュニケーション節へ設計判断エリシテーション
  ルールを追加 (両ランタイム同文趣旨、rule-drift 方針と同じ divergence 防止)。

### Step 4: [直列] 検証
- 直列理由 = **verification_gate**。`ut-tdd plan lint`、`ut-tdd doctor`
  (rule-drift / readability を含む) green を確認。

## 設計判断

1. ツール改造ではなく **運用ルール + skill + 等価 markdown 表現** の 3 層で実現する
   (AskUserQuestion のスキーマは変更不能)。
2. 非対話 / autonomous セッションでは AskUserQuestion を使わず、最終報告に
   選択肢表を載せて次回入力を待つ (応答を待てないため)。
3. hook による機械強制 (`PreToolUse(AskUserQuestion)` guard) は本 slice では
   見送り、運用逸脱が観測されたら後続 slice で fail-close 化する (過剰機構化の回避)。

## 後続候補 (PO 示唆 2026-07-13、本 slice 対象外)

- **ステージ紐付きエリシテーション**: harness.db `schedule_entries` (工程表 projection、
  SessionStart digest の current/next/blocked 判定) と設計判断依頼を結合し、質問へ
  plan_id + current_location を自動付与、採択結果を DB へ投影する。step 粒度の
  自己ステージ認識は PLAN-L7-419 (Forward FSM) の実装が前提。

## DoD

- [ ] `docs/governance/design-decision-elicitation.md` が存在し、両ランタイムの
      実装方法を定義している。
- [ ] `skills/design-decision-elicitation.md` が skill.v1 schema に適合する。
- [ ] `CLAUDE.md` / `AGENTS.md` に同趣旨のルール節がある。
- [ ] `ut-tdd plan lint` / `ut-tdd doctor` が green。
