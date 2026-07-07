---
plan_id: PLAN-L7-345-toolchain-pin-gate
title: "PLAN-L7-345 (impl): toolchain 版ずれ gate — biome 実行版 ↔ package.json pin の突合 (実害 4 回以上の biome drift の機械化)"
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
    slot_label: "PO - v2 活性化時期 + exact pin 化 (caret 除去) の追認"
  - role: tl
    slot_label: "TL - 検査対象 toolchain の範囲 (biome/bun/vitest) レビュー"
  - role: se
    slot_label: "SE - doctor check + pin 変更"
generates:
  - artifact_path: docs/plans/PLAN-L7-345-toolchain-pin-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-183-runtime-parity-vendor-lessons-audit-2026-07-03.md
---

# PLAN-L7-345 (impl): toolchain 版ずれ gate

## Status

**version-up parked (v2)**。A-183 所見 LM-1 (教訓機構化率監査で唯一の「実害複数回 × 機構ゼロ」)。PO 指示 2026-07-03。

## 背景 (実測 2026-07-03、A-183 §1)

- `biome lint` ≠ `biome check` と biome 版ずれの教訓は prose (update 戦略 §4.3) のみで、git log 上に是正 commit が最低 4 件 (4856c69 / 6063723 / 78a5d9a / d0821ae 系。biome 関連 commit は計 10 件) — **反復実害があるのに機構ゼロ**の代表例。
- toolchain pin も薄い: engines は `bun>=1.3` のみ、biome は `^2.4.15` (caret = 環境ごとに解決が揺れ得る)、bunfig/.tool-versions なし。Claude 機と Codex 機で解決版が割れると format 差分が commit 汚染になる (実害の発生機序)。

## スコープ (1 要件: toolchain 実行版と宣言版の乖離を機械検出する)

1. doctor check `toolchain-pin` (warn-first): `bunx biome --version` 実行結果と package.json の宣言を突合し、乖離で warn。bun 実行版 (`Bun.version`) と engines も同時突合。
2. biome を exact pin (`2.4.15`、caret 除去) へ変更 — **PO 追認 slot** (更新運用が手動になるトレードオフを明示)。
3. push 前規律 (`biome check` full) は pre-push hook 拡張が自然だが、**hooks 配布は L7-347 のスコープ** — 本 PLAN は doctor 検出まで (境界宣言)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | exact pin 化の PO 追認 | 直列 (先行) |
| 2 | toolchain-pin check + tests | 直列 |
| 3 | pin 変更 + lockfile 更新 + full lint/test green | 直列 |

## DoD

- [ ] 版乖離 fixture が warn (test 固定)
- [ ] biome exact pin 後に `bun run lint` green
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 検査は fail-open (bunx 失敗で doctor を赤くしない)。lockfile (bun.lock) が正本、check は「lockfile と実行環境の一致」を見る。
- 活性化時 kind は add-impl へ昇格。
