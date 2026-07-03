---
plan_id: PLAN-L7-340-cli-registrar-completion
title: "PLAN-L7-340 (impl): cli.ts (2,878 行) の registrar 分割完遂 + withDb ラッパーによる try/finally 複製排除"
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
    slot_label: "PO - v2 活性化時期 + Codex CLI 抽出路線との分担確定 (重複起票禁止)"
  - role: tl
    slot_label: "TL - registrar 分割単位と withDb 設計のレビュー"
  - role: se
    slot_label: "SE - 分割実装 (実装主担当は Codex routing 推奨)"
generates:
  - artifact_path: docs/plans/PLAN-L7-340-cli-registrar-completion.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - docs/plans/PLAN-L7-223-cli-distribution-registrar-extraction.md
    - docs/plans/PLAN-L7-229-cli-feedback-registrar-extraction.md
---

# PLAN-L7-340 (impl): cli registrar 分割完遂

## Status

**version-up parked (v2)**。A-182 所見 AQ-1 (QU-13)。PO 指示 2026-07-03「アップデートでプラン化」。**活性化前提 = Codex CLI 抽出路線 (L7-223/229/284〜286 で部分 landed、現在も継続中) との分担確定** — Codex が既に同型の抽出を進めているため、本 PLAN は「残り全 command の完遂」を宣言する統合枠。Codex 側で後継 PLAN が起票されたらそちらへ合流し supersedes 整理する。

## 背景 (実測 2026-07-03、A-182 §1/§2)

- `src/cli.ts` が **2,878 行 / .command 92 / .action 61** — src 最大の megafile。action 内に openHarnessDb → try/finally → close の複製が 18+ 箇所 (AQ-1)。
- delegation / distribution / feedback は registrar 抽出済み (`src/cli/` 3 ファイル 931 行) — 様式先例あり。残り 80+ command が cli.ts 直書きのまま。
- 影響: 毎 PLAN のコマンド追加が単一巨大ファイル集中編集 — hybrid 最大のコンフリクト源、AI の誤挿入リスク。

## スコープ (1 要件: 残り command を registerXxxCommands 様式で src/cli/ へ分割し、DB open/close 複製を排除する)

1. コマンドグループ別 registrar (`src/cli/plan.ts`, `hook.ts`, `route.ts`, `db.ts` 等 — 分割単位は TL レビュー) へ段階移動。cli.ts は program 構築 + registrar 呼び出しのみへ (目安 <400 行)。
2. `withDb(fn)` ラッパー (open → migrate → try/finally close) を state-db に追加し、action 内の複製 18+ 箇所を置換。
3. あわせて cli→lint 直 import (AQ-3、PLAN-L7-341) の整理と同時実施が効率的 — ただしスコープは分離維持 (1 PLAN = 1 要件)。
4. regression fence: cli-surface 系テスト + full test green (コマンド surface の同一性を L7-334 の値一致テストが守る)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | Codex 路線との分担確定 (PO/TL) + 分割単位レビュー | 直列 (先行) |
| 2 | withDb ラッパー + 置換 | 直列 |
| 3 | グループ別 registrar 移動 (グループ単位で commit) | 直列 (同一ファイル起点) |
| 4 | regression fence | 直列 |

## DoD

- [ ] cli.ts が registrar 呼び出し中心の薄い entry (目安 <400 行)
- [ ] action 内の openHarnessDb try/finally 複製が 0 (withDb 経由)
- [ ] コマンド surface が分割前後で同一 (`--help` 全出力の突合ログを review_evidence に記録)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- Model routing: 実装主担当は Codex 推奨 (既にこの路線の主担当)。Claude 側は本 PLAN の統合枠維持とレビュー。
- 活性化時 kind は refactor へ昇格。
