---
layer: L3
sub_doc: business
status: placeholder
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_l1_screen: docs/design/harness/L1-requirements/screen-requirements.md
next_pair_freeze: L12
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-28
---

# L3 業務要件詳細 (business-detail) — BR-21 + HM-08 + Phase B carry — placeholder

> **status**: placeholder。PLAN-L3-02-business-detail で本起票する。
> **scope**: BR-21 (AI 実行成果評価) + FR-L1-36/38/43 (Learning Engine、P2) + HM-08 画面連動。**FR 一般詳細化は PLAN-L3-01 が担当 (重複回避)**。

## 本起票時の構造 (PLAN-L3-02 §5 実装計画に対応)

| § | 内容 | 入力 |
|---|------|------|
| §1 | 評価対象 (PLAN 単位 default + 補助単位) | U-BR21-1 確定 |
| §2 | 評価指標 (5 指標 + KPI D-07 整合) | U-BR21-2 確定 |
| §3 | 改善サイクル (sprint 末 + 任意手動) | U-BR21-3 確定 |
| §4 | 改善アクション (全件「人間承認必須」、CC2) | U-BR21-4 確定 |
| §5 | HM-08 連動 (データソース 4 件 + 表示頻度 + AI 指示 copy UI) | U-BR21-5〜7 確定 |
| §6 | Phase B carry (Phase A 範囲 + Phase B 着手条件) | U-BR21-8〜10 確定 |
| §7 | FR-L1-36/38/43 詳細化 (AC 形式は PLAN-L3-01 と整合) | L1 functional + AC テンプレ |

## L1 → L3 trace (継承)

- L1 BR-21 詳細 (business §11) → 本 sub-doc §1〜§6 で評価サイクル詳細化
- L1 FR-L1-36/38/43 → 本 sub-doc §7 で AC 付き詳細化
- L1 HM-08 (screen §1.HM.08) → 本 sub-doc §5 で連動規約確定

## CC2 carry (人間主導 + AI 補助原則)

§4 改善アクションは全件「**人間承認必須**」(自動修正禁止)。§5 HM-08 は AI 指示 copy UI で「改善 PLAN 起票テキスト」を生成 (人間が AI に貼り付けて指示する設計)。
