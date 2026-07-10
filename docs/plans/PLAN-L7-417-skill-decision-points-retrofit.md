---
plan_id: PLAN-L7-417-skill-decision-points-retrofit
title: "PLAN-L7-417 (retrofit): baseline 54 skill への decision_points 遡及付与 — 品質3要件 (decision-usefulness) を既存カタログへ拡張"
kind: retrofit
layer: L7
drive: agent
status: draft
route_signal: upgrade
route_mode: retrofit
backprop_decision: not_required
backprop_decision_reason: "skill-admission.md §12 が defer した「既存 skill の遡及審査」の content slice。admission gate の設計・実装 (PLAN-L6-67 / PLAN-L7-411、Codex lane) には触れず、skills/ 配下の frontmatter/本文のみを設計 §4.3 の decision_points 構造へ追随更新する。上位設計の意味変更なし。"
created: 2026-07-10
updated: 2026-07-10
owner: PM (Claude)
parent_design: docs/design/harness/L6-function-design/skill-admission.md
agent_slots:
  - role: se
    slot_label: "SE — skills/*.md へ decision_points 付与 + 一般語 prose の具体化 (pmo-sonnet 分担)"
  - role: tl
    slot_label: "TL — 付与された decision_points の非一般性・本文整合の抜き取りレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-417-skill-decision-points-retrofit.md
    artifact_type: markdown_doc
  - artifact_path: skills/
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-67-skill-admission-gate.md
  requires: []
  references:
    - docs/design/harness/L6-function-design/skill-admission.md
    - docs/plans/PLAN-L7-411-skill-admission-gate.md
review_evidence: []
---

# PLAN-L7-417 (retrofit): baseline 54 skill への decision_points 遡及付与

kind=retrofit の根拠: skill カタログの挙動仕様 (索引・推薦・注入) は不変のまま、
skill-admission.md (confirmed) が導入した品質 3 要件のうち **decision-usefulness
(判断有用性)** の構造項目 `decision_points` を、baseline 凍結済みの既存 skill へ
遡及追随させる更新であるため (upgrade → retrofit route)。設計 §12 が「既存 skill の
遡及審査 = 別 PLAN で漸進」と defer した slice を本 PLAN が引き受ける。

## 目的

安価な worker モデルが skill を読んだだけで上位モデル相当の判断を再現できるよう、
各 skill の暗黙判断を反証可能な `decision_points` として外部化する。判断の質を
モデルの地力でなく skill 側へ移す (cheap-model uplift)。

## decision_points 構造 (設計 §4.3 準拠、frontmatter)

```yaml
decision_points:
  - when: "<判断が分岐する具体的状況>"
    choose: "<採る選択>"
    over: "<捨てる選択>"
    because: "<反証可能な根拠>"
```

- 各 skill 3〜8 件。本文に既にある判断を構造化する (新規の意味生成は本文と矛盾
  しない範囲に限る)。コマンド実行を指示する skill には Windows/PowerShell の
  shell 方言分岐 (PO 指摘 2026-07-10) を含める。
- 一般語のみの項目は禁止 (設計 §4.3 denylist と同型):
  "適切に" / "状況による" / "注意する" / "be careful" / "use good judgement" 等。
- choose/over は具体的な選択肢の対でなければならない (A over B 形式)。

## 工程表

### Step 1: [並列] skills/*.md への decision_points 付与 (8 分担)
- SKILL_MAP.md を除く 54 skill を 8 batch に分割し pmo-sonnet lane で並列付与。
  本文の一般語 prose は同時に具体化してよいが、手順・工程の意味は変更しない。

### Step 2: [直列] 機械検証 + 抜き取りレビュー
- 直列理由 = **downstream_dependency**。全 54 skill の decision_points 存在 +
  4 キー完備 + denylist 非該当をスクリプトで機械検証。frontmatter YAML parse +
  `ut-tdd doctor` (skill-assignment lint 含む) exit 0。TL 抜き取りレビュー。

## AC

- [ ] SKILL_MAP.md を除く skills/*.md 全件に `decision_points` が 3 件以上あり、
      各項目が when/choose/over/because の 4 キーを持つ (検証スクリプトで機械確認)。
- [ ] denylist 一般語のみの項目が 0 件 (同スクリプト)。
- [ ] 全 skill frontmatter が YAML として parse 可能、`ut-tdd doctor` exit 0。
- [ ] `bun run typecheck && bun run lint && bun run test` green (HEAD 基準)。
- [ ] PLAN-L7-411 (admission gate 実装、Codex lane) の対象ファイルに触れていない。

## 非目標

- admission gate 本体 (src/skill-engine/admission.ts 等) の実装 — PLAN-L7-411 (Codex)。
- SKILL_MAP.md の再生成 — renderSkillCatalogIndex 実装後に機械生成 (設計 §7.3)。
- novelty (重複統合) の遡及判定 — 後続 slice。
