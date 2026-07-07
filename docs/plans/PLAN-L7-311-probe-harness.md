---
plan_id: PLAN-L7-311-probe-harness
title: "PLAN-L7-311 (impl): probe harness — guard/gate/hook の実走検証を常設化する fixture 駆動プローブ"
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
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期とプローブ対象の優先順"
  - role: tl
    slot_label: "TL - fixture 隔離設計 (実 repo 状態を汚さない) のレビュー"
  - role: se
    slot_label: "SE - probe runner + fixture 群 + 証跡記録の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-311-probe-harness.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/governance/audit-lens-catalog.md
    - docs/plans/PLAN-L7-258-guard-firing-evidence.md
    - docs/plans/PLAN-L7-188-verification-strategy-design-time-logging.md
---

# PLAN-L7-311 (impl): probe harness — 実走検証の常設化

## Status

**version-up parked (v2)**。PO 指摘 (2026-07-03)「テスト戦略は十分だが、発見と観察、検証の手段が薄い」の**検証**面への対応。

## 背景

このハーネスの検証はテスト (vitest) と静的走査 (lint/doctor) が厚い一方、「**機構を本物の経路で実走させて発火を確かめる**」手段が常設されていない:

- 検証戦略の正本 (L7-188、confirmed) は「projection 単独を verified と認めず、実走 evidence を捕捉する」を原則化したが、実走の**実施手段**は各 PLAN が都度発明している (または省略している)。
- 実例: skill_invocations 1,580 件全部 auto-projection・実発火 0 (2026-06-29 発覚)。ユニットテストは green でも、hook → engine → 記録の実経路は誰も走らせていなかった。
- L7-258 (guard-firing-evidence、draft) は「実運用中に発火した証跡の記録」を扱う。本 PLAN はその対 — **オンデマンドで意図的に発火させて確かめる**側。両輪で「働いているはずの番人が本当に働くか」を運用中いつでも検証可能にする。

## スコープ (1 要件: 主要 guard/gate/hook を fixture で実走させ、発火/不発火を provenance 付き証跡として返す常設手段)

1. **probe runner** (`ut-tdd probe run <probe-id>` / `--all`): 各 probe = { 対象機構, 違反 fixture (発火すべき入力), 正常 fixture (発火してはならない入力), 期待結果 }。実行結果 (fired / not-fired / error + stdout/stderr) を `.ut-tdd/evidence/probes/<probe-id>-<date>.json` に記録。
2. **隔離設計**: fixture は一時 worktree または `.ut-tdd/tmp/` 内の隔離コピーで実行し、**実 repo の状態・DB・ログを汚さない** (probe の副作用が別の検出器を誤発火させない)。ここが本 PLAN 最大の設計作業で TL レビュー必須。
3. **初期 probe セット** (優先順): (a) agent-guard (allowlist 外 subagent / model 欠落 → block) (b) work-guard (foreign edit → block、marker 一回性) (c) plan lint の fail-close 群 (route certificate 欠落 / debt bypass) (d) commit-msg hook (e) SessionStart surface (actionable が実際に表示されるか)。各 probe は「発火すべき入力で発火」と「正常入力で不発火」の両方向を必ず持つ (半方向 probe は誤安心を生む)。
4. **検証への接続**: probe 結果 evidence は review_evidence の green_commands として cite 可能な形式にする (実走 evidence の標準供給源になる)。doctor へは配線しない (probe は能動実行の手段であり常時 gate ではない — 常時化の判断は運用実績を見て別途)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 隔離設計 (worktree/tmp、DB 分離) + probe 定義書式 (TL) | 直列 |
| 2 | probe runner + 証跡記録 | 直列 |
| 3 | 初期 probe セット (a)-(e) 実装 | Step 2 後、相互に並列 |
| 4 | regression test (両方向判定 / 隔離が実 repo を汚さない / evidence 形式) | 直列 |

## DoD

- [ ] `probe run --all` が初期セット全 probe の fired/not-fired を判定し evidence を書く (実走結果を review_evidence に記録)
- [ ] 違反 fixture で不発火 (番人が寝ている) が exit 1 で報告される (test 固定)
- [ ] probe 実行前後で実 repo の git status / harness.db 行数が不変 (test 固定)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/probe/` (新規)、`src/cli.ts` (probe サブコマンド)、`.claude/hooks/` の各 guard は**変更しない** (probe は外から入力を与えるだけ)。
- guard 系 probe は hook の stdin JSON 契約に依存する — 契約は `.claude/hooks/agent-guard.ts` / `work-guard.ts` の実装から読み取り、probe fixture 側に契約バージョン注記を残す (hook 契約が変わったら probe が error で気付ける)。
- **Windows 第一級**: hook 実行は bun spawn 経由。spawn 層を触る場合は Windows 実機で必ず実走。
- probe の追加は「新しい fail-close 機構を作った PLAN が、対応 probe を同時に追加する」を将来の作法にする (本 PLAN の DoD ではなく、活性化後に CLAUDE.md/作法 doc へ 1 行追記を提案)。

## 2026-07-03 A-183 追補 (VD-1: vendor 実 payload の fixture 再捕捉)

A-183 (LENS-VD) 所見 VD-1: 本 PLAN の probe fixture は「hook 実装から読み取った契約」の自己整合性検証であり、**vendor 実体 (Claude Code / codex.exe) が実際に送る payload との突合を含まない**。file_path の構造変更時に work-guard が fail-open (targets=[] → pass) へ倒れる経路が最重シナリオ。

スコープに以下を追加する: probe fixture の契約バージョンは **vendor 実バイナリからの実 payload 捕捉で更新する** (一度捕捉 → 定点再捕捉して diff)。捕捉 fixture の置き場は L7-351 (spawn_agent payload fixture) と共有する。
