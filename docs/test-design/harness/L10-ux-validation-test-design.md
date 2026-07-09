---
layer: L2
executed_at_layer: L10
artifact_type: test_design
status: draft
pair_artifact: docs/design/harness/L2-screen/
parent_doc: docs/design/harness/L2-screen/README.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l2_wireframe: docs/design/harness/L2-screen/wireframe.md
related_l10_design: docs/design/harness/L10-ux/visual-design.md
next_pair_freeze: L2
created: 2026-07-07
updated: 2026-07-07
---

# UT-TDD Agent Harness — L10 UX 検証テスト設計 (UXV-*)

> **layer (作成層 = V-pair key)**: L2 (画面) / **executed_at_layer (実施層)**: L10 (UX 検証) /
> **artifact**: UX 検証テスト設計 (V-model 右腕、L2 全 sub-doc と対)
> **pair (V-model L2↔L10)**: `docs/design/harness/L2-screen/` 全 sub-doc
> (business-flow / screen-detail / screen-flow / screen-list / ui-element / wireframe) ↔ 本書 1 doc
> **出自 (PLAN-RECOVERY-09)**: 旧 self-pair 規約 (IMP-039/058「wireframe mock 自体が③ペア・L10 独立
> doc 不要」) は PO 裁定なき作り込みであり撤去。UXV case 定義を
> [L10 visual-design.md](../../design/harness/L10-ux/visual-design.md) から本書へ移設し、右腕層
> 3 点セット (テスト設計 + 検証戦略 + 検証設計) の正本とする。
> **実行時期**: UXV の実行は src/web 実装 (L7、PLAN-L7-141) 成立後 (実レンダリング検証)。設計は
> Forward で本書に凍結する (右肺設計義務)。

## §0 量閉じ原則 (L2 ↔ L10)

- 全 L2 sub-doc (6 件) / UXV family 対応必須 (本書 §2 の対応表で機械可読)
- UXV 必須 family 5 種 (VISUAL / TOKEN / A11Y / VRT / REVIEW、`g10-ux-workflow` lint が
  selected + mandatory の family 欠落を fail-close)
- 孤児 = 0 (機械検証 `ut-tdd doctor` pair-freeze + `g10-ux-workflow`)

## §1 検証戦略 (G10-WORKFLOW)

test_strategy: L2 screen contracts と L4 FE design standards に紐づく risk-based UX verification。
test_plan: visual、token、accessibility、visual-regression、UX-review risk により UXV case を選択する。
test_conditions: 選択した各 UXV case は具体的な rendered evidence または reviewable evidence path を持つ。
coverage_items: UXV-* coverage は visual、token、a11y、VRT、UX review family へ map する。
test_procedures: 対応する vitest/doctor/render/review command を実行し、exit code を記録する。
execution_evidence: UX evidence manifest は command、UXV ID、path、result を記録する。
exit_criteria: 必須の選択済み UXV case はすべて pass、または明示的な defer を持つ。
defect_routing: 失敗した UXV case は scope に応じて L10 correction、L2/L4 back-prop、Reverse、Incident へ route する。
verification_design: 検証環境、実データ/レンダリング条件、計測方法、評価基準、実行手順を選択 UXV-* ごとに明示する。

## §2 UX 検証テストケース (UXV-*、GWT)

BDD 形式 (Given/When/Then = 前提/操作/期待結果)。用語は L0 glossary の ubiquitous language に従う。
粒度 = 左ペア (L2 画面設計群) と同一: 各 family は対応する L2 sub-doc の契約単位で検証する。

| UXV ID | 前提 (Given) | 操作 (When) | 期待結果 (Then) | 対応 L2/L4 契約 |
|---|---|---|---|---|
| UXV-VISUAL-01 | L2 wireframe と L4 UI standard が存在する | G10 visual review が選択される | Evidence は visual decision を具体的な screen/component artifact に紐づける | wireframe.md / screen-detail.md |
| UXV-TOKEN-01 | L4 tokens.yaml が FE token SSoT である | G10 token verification が選択される | Evidence は token contract が workflow/FE coverage checks から到達可能であることを示す | ui-element.md / L4 tokens.yaml |
| UXV-A11Y-01 | WCAG/a11y expectations が L4 UI standard に存在する | G10 accessibility verification が選択される | Evidence は a11y requirements を executable または reviewable checks に紐づける | screen-list.md / L4 ui-standard.md |
| UXV-VRT-01 | visual regression が frontend-design の必須 green signal である | G10 VRT verification が選択される | visual-regression path または明示的 defer がなければ Evidence が G10 close を block する | screen-flow.md / business-flow.md |
| UXV-REVIEW-01 | UX polish は row presence を超える judgement を必要とする | G10 review が選択される | Evidence は L11 handoff 前に review route と exit criteria を記録する | L2 全 sub-doc (総合) |

## §3 検証設計 (環境・実データ・計測・評価)

- **環境**: 実レンダリング検証 (src/web 実装後)。vitest / doctor / render / review command を
  実行主体とし、runner・scope・exit code を manifest に記録する。
- **実データ実在性**: evidence manifest (`.ut-tdd/evidence/g10-ux/*.json`,
  schema `g10-ux-evidence-v1`) の evidence_path は repo 内実在 path のみ許可
  (許可 prefix: `.ut-tdd/evidence/` / `docs/` / `src/` / `tests/`)。存在しない path・repo 外
  path は violation (fail-close)。
- **計測**: command ごとに `exit_code` (0 必須) と `output_digest` (`sha256:` 64 hex) を記録し、
  coverage 行は evidence path + command_id で照合可能にする。
- **評価基準 (exit)**: `all_mandatory_passed=true` / `failed_mandatory_count=0` /
  `stale_defer_count=0` / `doctor_check=g10-ux-workflow`。必須 family (VISUAL/TOKEN/A11Y/VRT/
  REVIEW) の selected・mandatory 欠落は G10 close を block する。
- **機械検証**: `src/lint/g10-ux-workflow.ts` (doctor check `g10-ux-workflow`) が本書の
  G10-WORKFLOW marker・UXV case 数 (≥5)・manifest 整合を検査する。
