---
plan_id: PLAN-L6-53-adversarial-review-mechanism
title: "PLAN-L6-53 (add-design): 敵対検証機構 (ZIP review 相当、3層防御 第2/3層)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-40-route-filing-review-surface.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - 敵対検証パケット / 判定規約の契約"
  - role: qa
    slot_label: "QA - PASS-WEAK / 抜き打ち指名の検証設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-53-adversarial-review-mechanism.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-40-route-filing-review-surface.md
  requires:
    - docs/plans/PLAN-L7-384-route-filing-review-surface.md
  references:
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L6-53: 敵対検証機構 (ZIP review 相当、3層防御 第2/3層)

## 0. 背景 (ZIP 比較監査 2026-07-08、PO 指示による代理起票)

ZIP の 3 層防御のうち第 2 層 (敵対検証 `review.py`) と第 3 層 (人間抜き打ち・検出器劣化
監視) に相当する機構が未起票。HARNESS の cross-review / frontier gate は「別モデルが
レビューする」までで、攻撃パケット生成・反駁判定・抜き打ち指名は持たない。
過去監査の教訓「L7 監査で機構自身が false-confidence」に直結する層。

## 1. 設計スコープ (ZIP 仕様の HARNESS 翻訳)

1. **リスク加重抽出**: fail/blocked 履歴・証跡薄・高ファンアウト・直近更新から検証対象
   ID を機械抽出し、ブラインドパケットを生成する。
2. **攻撃者/防御者分離**: 別セッション・別プロバイダ割当 (hybrid の worker≠reviewer 分離
   に接続)。作成関与モデルはどちらの役にも就けない。
3. **判定規約**: 有効攻撃 4 種 (二読み実証 / テスト未カバー境界 / 証跡から再確認手順が
   組めない / テスト緑でも要件未充足の反例)。反駁されない攻撃 1 つで FLAG、全反駁で
   PASS、no_attack (試行ログ必須) は PASS-WEAK。
4. **第 3 層**: PASS 群の約 1 割 + PASS-WEAK を人間抜き打ちへ機械指名。検出器自身への
   定期敵対検証 (年 1 回相当) を工程管理表に登録する。

## 1.1 ZIP 実装 (tools/review.py) から保持する設計判断

- **ランダム床**: リスク加重抽選で全 ID に基礎点 1 を残す。リスクスコアを低く保てば監査を
  回避できるというグッドハート化を成立させない。
- **引用反駁規約**: 防御者は提示情報の引用のみを根拠に反駁する。引用で排除できない攻撃には
  反駁を書かない (書けないことが正しい判定)。意見の応酬を判定規則レベルで排除する。
- **no_attack の試行ログ**: 攻撃なし宣言には試行した攻撃と不成立理由を最低 3 件。ログなしの
  no_attack は無効。
- **冪等指名**: 抜き打ち指名は seed 固定で run 間安定させ、human_check 記入まで同じ対象を
  指し続ける (再抽選による指名逃れを不可能にする)。
- **HARNESS 移植時の改善 (ZIP からの逸脱点)**: ZIP は抜き打ち抽選 seed をソース直書きに
  しており、ソースを読める監査対象 AI は指名を事前計算できる。HARNESS では seed を
  人間管理の環境変数または AI 非可読の外部保管とし、ソース/DB に埋め込まない。

## 2. 受け入れ条件 (design freeze 時)

- パケット schema・役割割当制約・判定規約・抜き打ち指名の L6 contract が固定される。
- attacks/verdicts の改変禁止 (追記のみ) が guard/doctor で機械強制される設計になる。
