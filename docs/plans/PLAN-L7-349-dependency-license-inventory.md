---
plan_id: PLAN-L7-349-dependency-license-inventory
title: "PLAN-L7-349 (impl): 依存の脆弱性・license 台帳 — CI 脆弱性検査 + Pack (MIT) third-party license 適合表"
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
    slot_label: "PO - v2 活性化時期 (license は Pack 公開物のコンプラ事項 — エスカレーション対象)"
  - role: tl
    slot_label: "TL - 脆弱性検査ツールの選定 (bun/npm audit 系)"
  - role: se
    slot_label: "SE - CI step + license 台帳生成"
generates:
  - artifact_path: docs/plans/PLAN-L7-349-dependency-license-inventory.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-183-runtime-parity-vendor-lessons-audit-2026-07-03.md
---

# PLAN-L7-349 (impl): 依存の脆弱性・license 台帳

## Status

**version-up parked (v2)**。A-183 所見 OR-1。PO 指示 2026-07-03。**license はライセンス変更に準ずる安全境界 (CLAUDE.md Safety Boundaries) — 台帳の判定結果は PO レビュー必須**。

## 背景 (実測 2026-07-03、A-183 §1)

- CI (harness-check.yml) の「audit quality」は自製コード監査で、**依存パッケージの脆弱性検査 (`bun audit` 相当) は存在しない**。
- Pack は MIT で公開しているが、**third-party license の適合表が無い** — 依存は runtime 3 本 (commander/yaml/zod) + dev 5 本と極小で、整備コストは低いのに未着手 (OR-1)。

## スコープ (1 要件: 依存の脆弱性と license 適合を機械検査可能にする)

1. CI に依存脆弱性検査 step を追加 (bun の audit 機能の現状を TL が確認し、無ければ `npm audit --package-lock-only` 等の代替を選定)。警告時は fail でなく report (warn-first、既知 advisory の免除台帳 + ratchet 付き)。
2. license 台帳: 依存 8 本 (transitive 含む lockfile 全体) の license を機械抽出し、MIT 配布との適合を判定した表を docs/governance/ へ生成。**判定結果は PO レビュー** (安全境界)。
3. Pack 側: sync-pack の対象に license 台帳 (NOTICE 相当) を含めるかを distribution 系 PLAN と整合 (重複起票しない — 参照接続のみ)。
4. 依存追加時の定常化: lockfile 変更を検知したら台帳再生成を促す doctor warn (軽量)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 検査ツール選定 (TL) | 直列 (先行) |
| 2 | CI step + 免除 ratchet | 直列 |
| 3 | license 抽出 + 台帳生成 + PO レビュー | 直列 |

## DoD

- [ ] CI に脆弱性検査 step が存在し green (実行ログ)
- [ ] license 台帳が lockfile 全依存を被覆 (件数突合)
- [ ] PO レビュー記録 (review_evidence)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 依存が極小なので手作業でも 1 時間だが、**台帳の恒常再生成 (機構) まで作るのが本 PLAN の価値** (一回性の是正は機構ではない — DV 教訓)。
- 活性化時 kind は add-impl へ昇格。
