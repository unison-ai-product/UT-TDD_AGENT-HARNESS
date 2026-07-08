---
plan_id: PLAN-L6-66-code-minimalism-skill
title: "PLAN-L6-66 (add-design): code-minimalism スキル新設 (ZIP .claude/skills/vmodel-code-minimalism 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - code-minimalism skill の docs/skills(reference) vs runtime skills/ 配置境界確認"
generates:
  - artifact_path: docs/plans/PLAN-L6-66-code-minimalism-skill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/design/harness/L6-function-design/skill-index.md
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-66: code-minimalism スキル新設

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `.claude/skills/vmodel-code-minimalism/SKILL.md` は「書く前に立ち止まる」7段階の問いと
ハードコード嗅覚チェックリストによる最小コード判断プロセスを定義する。UT-TDD 側 `skills/` には
`refactoring.md`・`debt-register.md` があるが、これらは**事後対応** (既に書かれたコードの整理・負債登録)
であり、「書く前」の思考プロセスに特化した skill は無いと確認した。

配置境界に注意する: root `skills/` (56 件確認済み、`skills/SKILL_MAP.md` で索引化) が Pack runtime
skill content の正本であり、`docs/skills/` ディレクトリは現時点でリポジトリ内に存在しない
(裏取り: `ls docs/skills/` = 該当なし)。過去の記述で `docs/skills/vmodel-code-minimalism.md` を
「既存の reference-only doc」と誤って前提していたため訂正する。本 skill は root `skills/` に
新規追加する一択であり、配置境界の判断は不要 (誤りの訂正、advisor 相談・Codex クロスレビューで検出)。

## 1. 設計スコープ

1. 「書く前に立ち止まる」7段階の問い + ハードコード嗅覚チェックリストを UT-TDD の既存 skill 形式
   (frontmatter + 判断基準) に翻案し、root `skills/` へ新規追加する。
2. 追加後は `skills/SKILL_MAP.md` の索引に反映する。
3. 既存 `refactoring.md`・`debt-register.md`・`incremental-implementation.md`・
   `spec-driven-development.md` との役割境界 (事前の書く前判断 vs 事後の整理・負債登録・
   段階実装・spec 駆動) を明記し、重複が無いことを確認する。

## 2. 受け入れ条件 (design freeze 時)

- skill が root `skills/` に配置され、`skills/SKILL_MAP.md` に索引登録される。
- 既存 skill (`refactoring.md`/`debt-register.md`/`incremental-implementation.md`/
  `spec-driven-development.md` 等) との役割重複がないことが明記される。
