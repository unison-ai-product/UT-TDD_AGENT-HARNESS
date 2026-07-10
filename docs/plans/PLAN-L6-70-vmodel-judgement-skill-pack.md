---
plan_id: PLAN-L6-70-vmodel-judgement-skill-pack
title: "PLAN-L6-70 (add-design): vmodel-docgen 由来の判断 skill 群新設 — 設計/実装/テスト/検証/ビジュアルの着眼・必須項目を cheap-model uplift として skills/ へ追加"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PM (Claude)
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence: []
agent_slots:
  - role: se
    slot_label: "SE — zip 資料 (107/96/98/52 + 同梱 SKILL.md 群) から skill 翻案・新規作成 (pmo-sonnet 分担)"
  - role: tl
    slot_label: "TL — 既存 skill との役割境界 (novelty) + decision_points 品質の抜き取りレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L6-70-vmodel-judgement-skill-pack.md
    artifact_type: markdown_doc
  - artifact_path: skills/
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/design/harness/L6-function-design/skill-admission.md
    - docs/design/harness/L6-function-design/skill-index.md
    - docs/plans/PLAN-L6-66-code-minimalism-skill.md
    - docs/plans/PLAN-L7-417-skill-decision-points-retrofit.md
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-70: vmodel-docgen 由来の判断 skill 群新設

## 0. 背景

PO 提供の `Vモデル設計ドキュメント_checked.zip` (vmodel-docgen-clean、109 種設計書 + 同梱
7 SKILL.md) には、A-185 (機能 gap マイニング) が対象にしなかった **判断知識** — 各 L・各設計書
での着眼点・必須項目・アンチパターン — が含まれる。これを skills/ (Pack runtime skill 正本) の
既存形式 (skill.v1 frontmatter + decision_points、PLAN-L7-417 で全 skill へ導入済) に翻案して
新設し、安価な worker モデルが上位モデル相当の設計/実装/テスト/検証/ビジュアル判断を再現
できるようにする (cheap-model uplift)。

PLAN-L6-66 (code-minimalism skill 新設、draft) と 1 skill が重なるため、本 PLAN の
code-minimalism slice は L6-66 の設計スコープ (§1〜2) をそのまま実装する (二重起票でなく取り込み。
L6-66 は本 PLAN の完了で AC 充足)。

## 1. 設計スコープ (新設 skill 群)

zip 資料 → skill の対応 (ファイル名は英語、本文は既存 skills/ 慣例に合わせ英語):

| 新設 skill | 主 source | 中身 (着眼・必須項目) |
|---|---|---|
| code-minimalism | 同梱 vmodel-code-minimalism + 96 | 書く前 7 段の問い / ハードコード嗅覚 / 依存追加判断 / 生成AI時代の運用 (L6-66 スコープ) |
| test-breakage-thinking | 同梱 vmodel-test-thinking + 06-09/28/109 | 壊れ方視点カタログ (ゼロ一多境界異物/時間順序/状態空欄/権限/失敗系/オラクル) / 深さ配分 / 探索規律 / 止め時 |
| visual-state-verification | 同梱 vmodel-visual-review + 51/37/72-75 | 9 状態マトリクス / 違和感の言語化語彙 / VRT 差分判定 / a11y 3 体験 / AI 自己認識 |
| design-tailoring-and-granularity | 同梱 vmodel-design-judgement + 52/107 | 文書の採否 (na 基準) / 規模別粒度 / 決定の記録先マップ / 1 要件 1 検証可能文 |
| screen-driven-requirements | 107 §4 + 02/03/29 | L2 要求⇄画面往復による潜在要求引き出し / 発散→MoSCoW 収束 / プロト合意なき凍結禁止 |
| contract-envelope-design | 107 §5 + 104/91/32/33 | 契約の一般化 (ヘッドルーム) / エンベロープ内変更自由・拡張=版管理 / 差し替え点設計 |
| vmodel-drive-direction | 107 §3/§6/§7 + 98 | 駆動方向はリスク依存 (ドメイン=テスト先/フロント=実装先/契約先) / アジャイル×V スライス / AI 時代の所有権配置 |
| design-principles-pillars | 96 + 94/95 | 設計原則 (7 つの柱) / ドメイン実装方針・値オブジェクト / クラス・メソッド設計規約の判断規準 |

敵対検証 (同梱 vmodel-substance-review + 49) は既存 `adversarial-review.md` と重なるため、
新設でなく**既存 skill への追補** (攻撃 4 類型 / 防御は引用のみ / no_attack 試行ログ / PASS-WEAK)
とする。重複が薄いと判明した場合のみ新設に切り替える。

各 skill の要件:

- skill.v1 frontmatter (`applies_to.layers` / `drive_models` は UT-TDD の層体系で表現。
  zip の L1〜L12 は本文中で source 概念として言及可)。
- `decision_points` 3〜8 件 (設計 §4.3、denylist 一般語禁止、A over B 形式)。
- 既存 skill との役割境界を本文に明記 (novelty。例: test-breakage-thinking は testing.md の
  戦略/レベル論と相補で、ケース発想の質を扱う)。
- `skills/SKILL_MAP.md` trigger table へ索引登録。

## 2. 工程表

### Step 1: [並列] skill ドラフト作成 (pmo-sonnet 5 分担 + pmo-tech-docs 1 補強)
- 各 lane が担当 source (scratchpad 展開済 zip) と近縁既存 skill を読み、新設/追補を作成。
- pmo-tech-docs は設計原則/テスト思考の外部裏付け (テックブログ/公式 doc) を補強材料として収集。

### Step 2: [直列] 機械検証 + 抜き取りレビュー
- 直列理由 = **downstream_dependency**。decision_points 検証スクリプト (L7-417 のもの) で
  新設分を機械確認、frontmatter YAML parse、`ut-tdd doctor` / `ut-tdd plan lint` exit 0、
  SKILL_MAP 索引整合。TL 抜き取りレビュー。

## 3. AC

- [ ] 上表 8 skill (+ adversarial-review 追補) が skills/ に存在し、各 frontmatter が
      skill.v1 で parse 可能、decision_points 3 件以上・4 キー完備・denylist 非該当
      (検証スクリプトで機械確認)。
- [ ] SKILL_MAP.md trigger table に新設 skill が登録される。
- [ ] 既存 skill との役割境界が各 skill 本文に明記される (L6-66 AC の一般化)。
- [ ] `bun run typecheck && bun run lint && bun run test` green (HEAD 基準) +
      `ut-tdd doctor` exit 0。
- [ ] PLAN-L7-411 (admission gate 実装、Codex lane) の対象ファイルに触れていない。

## 4. 非目標

- harness 機能追加 (整合性 gate / 図面 / 規模プロファイル等、A-185 §C) — 別 PLAN。
- 既存 54 skill の書き換え (adversarial-review への追補を除く) — L7-417 完了済。
- zip の Python ツール群の移植 (ADR-001)。
