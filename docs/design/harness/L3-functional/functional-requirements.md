---
layer: L3
sub_doc: functional
status: placeholder
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_l1_functional: docs/design/harness/L1-requirements/functional-requirements.md
related_l1_screen: docs/design/harness/L1-requirements/screen-requirements.md
next_pair_freeze: L12
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-28
---

# L3 機能要件 (functional) — placeholder

> **status**: placeholder。PLAN-L3-01-functional-detail で本起票する。

## 本起票時の構造 (PLAN-L3-01 §5 実装計画に対応)

| § | 内容 | 入力 |
|---|------|------|
| §1 | 目的・背景 (L3 詳細化目的、L1 baton 継承宣言) | L1 functional §1 |
| §2 | FR-* + AC-* 一覧 (本体、P0 18 件先行) | L1 FR-L1 41 件 + screen §5 trace |
| §3 | carry 宣言 (P1/P2 L4/Phase B carry) | U-L3-2 / U-L3-3 確定 |
| §4 | 画面 trace (L2 deep-link、PM/HM/GD カテゴリ別) | screen §5 G1-trace + L2-screen |
| §5 | 9 mode × FR 整合 + drive タグ + 人間判断点 (CC2 carry) | business §3.3.1 + §3.3.2 |
| §6 | 関連 doc | L1 5 sub-doc + L2-screen + L12 |
| §7 | carry / 次工程 (L4) | L4 carry list |

## L1 → L3 trace (継承)

L1 FR-L1-01〜44 (41 件) 全件を L3 FR-* + AC-* に詳細化する (孤児 L1 FR = 0)。screen §5 G1-trace マトリクスを継承し、AC レベルで画面紐付きを展開する。

## CC2 carry (人間主導 + AI 補助原則)

screen §4.1 で carry 宣言した CC2 を L3 全 FR-* で「**人間判断点**」列として強制する (各 FR の AC に「人間承認必須」マーカーを付与可能)。
