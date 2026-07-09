---
plan_id: PLAN-L4-21-domain-vo-coding-constraints
title: "PLAN-L4-21 (add-design): ドメイン実装方針 (値オブジェクト) + クラス・メソッド設計規約拡張 (ZIP 94/95 相当)"
kind: add-design
layer: L4
sub_doc: function
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L5
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - 値オブジェクト方針とクラス・メソッド構造規約の適用範囲判断 (harness 自身の domain class 量に見合う優先度確認)"
generates:
  - artifact_path: docs/plans/PLAN-L4-21-domain-vo-coding-constraints.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/governance/coding-rules.md
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L4-21: ドメイン実装方針 (値オブジェクト) + クラス・メソッド設計規約拡張

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `94_ドメイン実装方針・値オブジェクト設計書` は完全コンストラクタ・不変値オブジェクト (VO)・
生成/再構築分離により AI 生成コードでも不正状態を作らせない実装方針を定義する。`docs/governance/`・
`docs/design/` 配下を grep した結果「値オブジェクト」「完全コンストラクタ」「create/reconstruct分離」の
語は0件で、概念自体が UT-TDD 側に存在しないことを確認した。

ZIP `95_クラス・メソッド設計規約書` はネスト段数上限・メソッド行数/引数数目安・CQS (コマンドクエリ分離)・
循環的複雑度上限などの機械判定可能な構造規約を定義する。`coding-rules.md` には `max-source-params`
(引数3)・`no-explicit-any`・`structured-error-handling` は部分一致するが、ネスト段数・メソッド行数・
循環的複雑度・CQS・else 回避規約は同ファイルに存在しない。

harness 自身の domain class 量は薄いため優先度は中〜低だが、AI 実装エージェント (be-logic 等) が
生成するコードの構造規律として、既存 `coding-rules.md` の拡張という形で起票する。

## 1. 設計スコープ

1. 値オブジェクト (完全コンストラクタ・不変・生成/再構築分離) の適用方針を、harness 自身の domain
   class (該当箇所があれば) を対象に設計する。適用対象が薄い場合はガイドラインとしての位置づけに
   留める判断も可とする。
2. ネスト段数上限・メソッド行数目安・循環的複雑度上限・CQS 規約を、既存 `coding-rules.md` の機械 lint
   (biome/ESLint 相当ルール) へ追加可能な形で設計する。VO 方針 (1) と構造規約 (2) は起票クラスタは
   共有するが、design freeze 時の契約は以下のとおり分離した基準で個別に固定する。

## 2. 受け入れ条件 (design freeze 時)

**値オブジェクト方針 (1)**:
- 適用範囲 (harness 自身の domain class 全体に必須 / 新規 domain class のみ / ガイドライン止まり)
  が PO/TL 判断で確定する。
- 対象成果物 (どの module/class が VO 化対象か) が具体的に列挙される。

**クラス・メソッド構造規約 (2)**:
- 追加する rule id (例: `max-nesting-depth`, `max-method-lines`, `max-cyclomatic-complexity`, `cqs`)
  ごとに閾値が数値で固定される。
- enforcement surface (biome lint / CI gate / doctor のどこで強制するか) が明記される。
- 既存コードが閾値超過する場合の例外方針 (grandfathering の有無、期限) が明記される。
- 構造規約が既存 `coding-rules.md` の機械 lint と非破壊で統合される。
