---
plan_id: PLAN-L7-236-audit-doc-curation
title: "PLAN-L7-236 (refactor): 監査所見 smell 群の doc curation (公開残渣 + 実装宣言 drift)"
kind: refactor
layer: L7
drive: be
status: draft
backprop_decision: not_required
backprop_decision_reason: "doc curation 自体が設計 doc への記述訂正 (backprop の実施) であり、追加の Reverse 逆流対象となる新規実装を持たない"
route_signal: code_smell
route_mode: refactor
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/governance/document-system-map.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - doc 記述修正 (behavior-invariant)"
  - role: tl
    slot_label: "TL - change-impact (設計 doc 訂正の digest 波及) レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-236-audit-doc-curation.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-172-pack-comprehensive-review-2026-07-02.md
    - .ut-tdd/audit/A-173-drive-model-coverage-audit-2026-07-02.md
    - .ut-tdd/audit/A-174-forward-design-test-pair-audit-2026-07-02.md
---

# PLAN-L7-236 (refactor): 監査所見 smell 群の doc curation

## Status

draft 起票 (PO /goal 2026-07-02、A-172/173/174 の smell 群を 1 curation バッチへ集約)。behavior-invariant (コード挙動変更なし)。

## スコープ (出典別)

- **A-172 doc-residue**: 公開 governance/process doc の非同梱物デッドリンク 6+ (recovery-workflow.md:73 / modes/recovery.md:130-132 / document-system-map.md:80 / concept_v3.1.md:1131)、read order の ../adr 参照、repository-structure.md の source tree 記述、README badge `internal (private)`、SKILL_MAP 自己記述、estimation.md の task classify 虚偽記述、package.json version 乖離、[[feedback_*]] wikilink 残 (docs 4 + src コメント)。
- **A-173 F-8**: refactor.md の stale skill path (`docs/skills/` → root `skills/`)、modes README「9-mode」表記。
- **A-174 F-2**: confirmed 設計 doc の実装宣言 drift — module-decomposition.md:29-30「stub」、architecture.md:108「将来 telemetry」、function.md:36 C9「将来」(NFR-08 抵触候補、change-impact 対象)。
- **A-174 F-6**: L7-unit-test-design.md:42「placeholder skeleton」見出し。

## 制約

- 設計 doc (L4/L5) の訂正は change-impact rule (src→design 同期) に従い、digest 波及は green 再実行付き coordinated 訂正 (mechanical restamp 不可)。
- Pack 側は source 修正後の sync-pack 反映で伝播 (直接編集しない)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | source doc 群の記述修正 (デッドリンク → plain text / 脚注化、drift 訂正) | 直列 |
| 2 | README badge / version / SKILL_MAP / estimation.md 修正 | 1 と並列 |
| 3 | doctor + readability + green 再実行 → Pack sync | 直列 |

## DoD

- [ ] Pack 内 (sync 後) の非同梱物への markdown リンク = 0
- [ ] 設計 doc の実装宣言が実態と一致 (stub/将来 表記の解消 or 正当理由の明記)
