---
plan_id: PLAN-L7-188-verification-strategy-design-time-logging
title: "PLAN-L7-188 (impl): 検証戦略を first-class に — 設計時に観測点(実 provenance ログ)を仕込み、L7 実装フローに debug(実走で実証拠捕捉)を挟み、projection 単独の fired/used/works 主張を fail-close する検証 gate。題材=skill 縦1本"
kind: impl
layer: L7
drive: be
status: draft
version_target: future
created: 2026-06-29
updated: 2026-06-29
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L3-functional/roadmap.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE — 実 provenance(実 session_id/source) telemetry emit + skill 実発火記録 + projection 区別 gate の実装"
  - role: tl
    slot_label: "TL — 検証 obligation の上流生成・不在 fail-close・projection 単独=未検証の不変条件レビュー"
  - role: qa
    slot_label: "QA — 実走 evidence(L7 debug)を accept 前提にする検証戦略のテスト設計"
generates:
  - artifact_path: docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
  references:
    - docs/plans/PLAN-L7-70-skill-pack-curation.md
    - docs/plans/PLAN-L5-08-harness-db-feedback.md
---

# PLAN-L7-188 (impl): 検証戦略 (設計時ログ + L7 debug 実走 + projection fail-close gate)

## 優先度: version-up parked / 将来版へ保全 (PO 2026-06-29)

PO 決定 (2026-06-29): いまはクローズへ向けた **配布準備** を優先する。本 capability は破棄でなく
**将来版へ保全** する (`status=draft` + `version_target: future`、version-up 駆動モデル)。

- いまは Forward freeze / 配布スコープに入れない (現行クローズに新規挿入しない)。
- archived ではない — 将来版で add-feature により Forward へ合流する。
- `ut-tdd status` の outstanding に version-up parked として計上される (保全 = 完了ではない)。
- 再開条件: 配布クローズ着地後、PO 指示で activation。

## 0. なぜ (skill が実証した片肺)

テスト戦略 (impl⇔仕様 = V-model の谷の単体テスト) だけでは、**右腕 (統合された実システムが実データ/実
セッションで目的を示すか)** が片肺になる。実証 = skill: recommend/inject/54 pack/単体テスト全緑なのに、
`skill_invocations` 全 1580 件が `source=auto-projection:review-evidence`・distinct session_id=1(空) で
**実セッション発火 0**。SessionStart も skill を自動注入していない。**検証の代わりに projection が座って
いた** ([[feedback_coverage_not_substance]] が検証側で再発)。正本原則は
[[feedback_verification_strategy_design_time_logging]]。

差し込み口は 2 つで相補 (「もしくは」でなく両方要る):

1. **設計時にログを仕込む (センサー)** — 実挙動を観測する event を実 provenance (実 session_id/実 source)
   付きで emit。ログが無ければ読む実信号が無く projection が代役で埋まる。
2. **L7 実装フローに debug (実走) を入れる (強制点)** — 実装を実運用で実際に動かし実証拠を生む。走らせ
   なければセンサーは無音。

## 1. Scope

### IN (本 PLAN)
- **設計時 observability 義務**: 各 capability の設計時に「観測点 + provenance」を test 設計と同 V-pair 粒度で
  宣言し、実装に実ログ emit を仕込む (bolt-on 不可)。
- **L7 debug 実走 evidence**: 現行 `implement → trace-freeze → review → accept` に
  `implement → 実走で実証拠捕捉(debug) → trace-freeze → ...` を挟み、fired/used/works を主張する capability は
  **実 provenance 付き実走 evidence を review_evidence に持つ** ことを accept 前提にする (`green_command` =
  単体緑 evidence の「実挙動」版)。
- **検証 gate (projection fail-close)**: `source` が実 provenance でない fired/used/works 系 falsifiable
  主張 (projection 単独) を doctor gate が **未検証として fail-close**。検証 obligation は上流生成・不在 fail-close
  ([[project_descent_absence_blindness]] の右腕版、[[feedback_vmodel_state_db_completeness]] の検証版)。
- **第一縦1本 = skill**: 実 skill 発火を `session_id` + `source=runtime`(非 projection) で記録 → projection と
  区別 → 「firing/used 主張が projection 単独なら fail-close」。これが最初の L7 debug-evidence 実例になり、
  プロセス/検証ロードマップへ昇格して横展開する雛形になる。

### OUT (本 PLAN では作らない)
- 谷の単体テスト戦略の作り直し (谷は健全、対象は右腕)。
- いま実装すること (version-up parked、現行クローズに挿入しない)。

## 2. Acceptance Criteria
- usage/firing/works 系 falsifiable 主張は実 provenance evidence を要求し、projection 単独は gate が fail-close。
- skill 縦1本で「実セッション発火が session_id 付きで記録され、projection と機械的に区別される」ことを実証。
- 設計時 observability 宣言 ↔ test 設計の V-pair 対応が機械チェックされる (不在 fail-close)。
- doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。

## 3. Schedule
- mode: serial。
- Step 0: 正本原則 ([[feedback_verification_strategy_design_time_logging]]) を概念/要件 (上位正本) へ反映し
  検証ロードマップへ降ろす (規範変更は concept/requirements 先行)。
- Step 1: skill を題材に実 provenance telemetry (`source=runtime` + 実 session_id) emit を設計時ログとして実装。
- Step 2: L7 フローに実走 debug-evidence ステップを定義し review_evidence スキーマへ接続。
- Step 3: projection 単独 fail-close の検証 gate (doctor) を実装。
- Step 4: 検証 (実発火記録 / projection 区別 / 不在 fail-close) → review → confirmed。横展開へ。

## 4. 壊さない / 再発させない
- projection を verified と名乗らせない (coverage ≠ substance を検証側で再発させない)。
- observability は設計義務であり後付けにしない。実走しない実装を accept しない。
