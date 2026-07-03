---
plan_id: PLAN-L7-319-raw-os-purity
title: "PLAN-L7-319 (impl): raw-OS 純度検証 — Pack の自己適用混入スキャン + day-0 起動検証 + Pack lag 検出"
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
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 生化境界 (OS 本体 / 自己適用) の分類承認と v2 活性化時期"
  - role: tl
    slot_label: "TL - 混入スキャンの除外規則 (正当な参照) と day-0 環境隔離のレビュー"
  - role: se
    slot_label: "SE - purity スキャン + day-0 smoke + lag 検出の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-319-raw-os-purity.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/audit-lens-catalog.md
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - .ut-tdd/audit/A-172-pack-comprehensive-review-2026-07-02.md
    - docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
    - docs/plans/PLAN-L7-233-personal-path-guard-generalization.md
    - docs/plans/PLAN-L7-252-pack-sync-explicit-stage-commands.md
---

# PLAN-L7-319 (impl): raw-OS 純度検証

## Status

**version-up parked (v2)**。PO 指摘 (2026-07-03)「Pack は自己開発を外した生の OS。生化するための観点が必要」。観点の正本 = 監査レンズカタログ **LENS-RW** (同日追加)。本 PLAN はその機械化 — 既存の個別対処 (RECOVERY-06 = consumer doctor、L7-233 = 個人パス、L7-266/267/282 = source-only test guard) を**系統化**する。

## 背景

source repo の成果物には OS 本体と自己適用の歴史 (481 PLAN、A-17x 監査、self 校正の閾値) が混在する。消費者は**自分史ゼロ** (PLAN 0 本・空 DB) で OS を起動するため、次の 3 種の欠陥が Pack 側でのみ顕在化する:

1. **混入**: OS 経路の doc/skill/gate が self-repo の PLAN ID・監査 doc・個人環境を参照する (RECOVERY-06 の consumer exit 1 が実例)。
2. **day-0 誤動作**: 「self-repo では常に何かが在る」前提の check が、空状態で誤発火または無意味な green を返す。
3. **Pack lag**: sync-pack は手動一方向で、Pack が source からどれだけ遅れているかを検出する機構が無い (「腐り続けるもの」の配布版)。

既存起票は個別事例への対処であり、「生化純度」を横断検証する機構が無い。

## スコープ (1 要件: Pack artifact set の生化純度を機械検証可能にする)

1. **purity スキャン** (`ut-tdd distribution purity-scan`): sync-pack の対象 artifact set に対し (a) self PLAN ID / A-1xx 監査参照 (b) 個人パス (c) `.ut-tdd/audit` 自分史参照 を走査。**正当な参照の除外規則** (例: OS が自分の setup 手順 doc を参照する等) は allowlist でなく「除外理由付き台帳」で管理 (taxonomy A2 の条件: 台帳 + 出口 + ratchet)。
2. **day-0 smoke の系統化**: RECOVERY-06 の fresh-consumer smoke を拡張し、「空 `.ut-tdd/` + PLAN 0 本」の隔離環境で setup → status → doctor → plan lint (0 本) の全 exit 0 を検証する再実行可能ジョブ (Pack CI: L7-235/268 の枠に載せる)。self-repo 前提で day-0 に誤発火する check を検出したら、check 側に「空状態の定義」を追加する是正を個別起票。
3. **閾値出自の台帳**: doctor/lint の数値基準 (advisory 閾値・baseline) に「self 由来 / 普遍」の出自ラベルを付け、self 由来の値が Pack profile でそのまま使われていないかを検査 (verification_profiles の Pack profile 側で上書き可能に)。
4. **Pack lag 検出**: sync-pack 実行時に source HEAD SHA を Pack 側 manifest へ記録し、`ut-tdd distribution status` が「Pack が source の何 commit 後ろか / 最終 sync からの日数」を表示。閾値超過は advisory (配布判断は人間)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 生化境界の分類規則 + 除外台帳の設計 (TL/PO — OS 本体/自己適用の線引きは PO 確認ゲート) | 直列 |
| 2 | purity スキャン実装 | 直列 |
| 3 | day-0 smoke 拡張 (隔離環境) | Step 2 と並列 |
| 4 | 閾値出自台帳 + Pack profile 上書き | 直列 |
| 5 | Pack lag 検出 (sync manifest + status 表示) | Step 3 と並列 |
| 6 | regression test (混入 fixture 検出 / day-0 全 green / lag 表示) | 直列 |

## DoD

- [ ] 混入 fixture (self PLAN 参照を仕込んだ doc) が purity-scan で検出される (test 固定)
- [ ] 除外台帳に無い自己適用参照が Pack artifact set に 0 件 (実走結果を review_evidence に記録)
- [ ] day-0 隔離環境で setup → status → doctor → plan lint が全 exit 0 (Pack CI ジョブで再実行可能)
- [ ] `distribution status` が Pack lag (commit 差 / 日数) を表示する (test 固定)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/distribution/` (sync-pack 実装の隣に purity-scan / lag)、`src/cli.ts`、Pack CI workflow (L7-235/268 の成果物)、verification_profiles (L5 physical-data の既存テーブル)。
- **判定の主語は常に「自分史ゼロの消費者」**。source で green は証拠にならない (LENS-RW の中心原理)。
- day-0 環境は L7-311 (probe harness) の隔離設計と共有できる — 両方活性化する場合は隔離基盤を先に 1 回だけ作る (重複実装しない)。
- sync-pack は「commit/push しない」現行契約 (CLAUDE.md) を維持 — lag manifest の記録も staged 提示までとし、Pack repo への書き込みは人間レビュー後。
