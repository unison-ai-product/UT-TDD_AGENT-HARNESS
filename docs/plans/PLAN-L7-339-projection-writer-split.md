---
plan_id: PLAN-L7-339-projection-writer-split
title: "PLAN-L7-339 (impl): projection-writer.ts (2,703 行) の投影ドメイン別分割 (hybrid 衝突源の解消)"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 (Codex 抽出リファクタ完了がトリガー — 同時進行は最悪の衝突面)"
  - role: tl
    slot_label: "TL - 分割単位 (投影ドメイン境界) のレビュー"
  - role: se
    slot_label: "SE - 分割実装 + regression fence (実装主担当は Codex routing 推奨)"
generates:
  - artifact_path: docs/plans/PLAN-L7-339-projection-writer-split.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/plans/PLAN-L7-230-runtime-projection-extraction.md
---

# PLAN-L7-339 (impl): projection-writer 分割

## Status

**version-up parked (v2)**。A-182 所見 AQ-4/AQ-7 (QU-12)。PO 指示 2026-07-03「アップデートでプラン化」。**活性化トリガー = Codex の doctor/CLI 抽出路線の完了** (projection-writer は同路線の次の自然な標的 — 重複起票・衝突を避けるため、活性化前に Codex 側の同種 PLAN 有無を必ず確認し、存在すればそちらへ合流して本 PLAN は supersedes 整理)。

## 背景 (実測 2026-07-03、A-182 §2)

- `src/state-db/projection-writer.ts` が **2,703 行** — src 第 2 の megafile。lint 6 モジュール (change-impact / descent-obligation / relation-graph / review-evidence / roadmap-registry / verification-profile) を直 import し DB 投影の全ロジックを保持 (AQ-4)。
- 新 lint gate の投影追加のたびに巨大ファイル集中編集 — cli.ts と並ぶ hybrid 並行編集の 2 大コンフリクト源。L7-147 (refactor-candidate-detector) の split-module 閾値を大幅超過。
- state-db→lint の import は正方向 (逆流 0 確認済) だが、analyze 直呼びで gate 変更が state-db test へ波及する結合 (AQ-7) — 分割で自然緩和。

## スコープ (1 要件: projection-writer を投影ドメイン別サブモジュールへ分割し、entry を薄く保つ — behavior-invariant)

1. `src/state-db/projections/` を新設し、投影ドメイン別 (plan 系 / descent・trace 系 / roadmap 系 / relation 系 / telemetry 系 — 境界は TL レビュー) に分割。
2. `projection-writer.ts` は集約 entry として export を維持 (呼び出し側の変更ゼロ = 非破壊)。
3. regression fence: `bun run test` full green + `ut-tdd db rebuild` の投影結果が分割前後で一致 (行数・代表行の突合)。
4. 先例 = L7-230 (runtime-projection-extraction、landed) の分割様式に従う。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | Codex 側の同種 PLAN 有無確認 + 分割境界の TL レビュー | 直列 (先行) |
| 2 | ドメイン別分割 (ドメイン単位で commit を刻む) | 直列 (同一ファイル起点のため) |
| 3 | regression fence (db rebuild 前後突合 + full test) | 直列 |

## DoD

- [ ] projection-writer.ts が集約 entry のみ (実装ロジックの大半が projections/ 配下へ移動、目安 <400 行)
- [ ] 呼び出し側 (cli / doctor) の import 変更ゼロ
- [ ] `ut-tdd db rebuild` の投影結果が分割前後で一致 (突合ログを review_evidence に記録)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- Model routing: 実装主担当は Codex (GPT/Codex 系 = 実装ワーカー既定) を推奨。Claude 側は起票・レビュー。
- 活性化時 kind は refactor へ昇格 (route_signal=code_smell)。
