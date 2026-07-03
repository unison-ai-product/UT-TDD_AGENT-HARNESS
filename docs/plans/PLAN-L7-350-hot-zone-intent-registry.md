---
plan_id: PLAN-L7-350-hot-zone-intent-registry
title: "PLAN-L7-350 (impl): hot-zone 事前宣言 registry — 作業域 intent の宣言・surface・追突警告 (hybrid 追突の事前調整機構)"
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
    slot_label: "PO - v2 活性化時期 + 宣言の強制度 (任意 or 必須) の決定"
  - role: tl
    slot_label: "TL - registry 形式と stale 掃除の設計レビュー"
  - role: se
    slot_label: "SE - registry + SessionStart surface + work-guard 連携"
generates:
  - artifact_path: docs/plans/PLAN-L7-350-hot-zone-intent-registry.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-183-runtime-parity-vendor-lessons-audit-2026-07-03.md
---

# PLAN-L7-350 (impl): hot-zone 事前宣言 registry

## Status

**version-up parked (v2)**。A-183 所見 OR-3 (PO の追突質問 2026-07-03 への機構的回答)。PO 指示 2026-07-03。

## 背景 (A-183 §2)

- hybrid 追突防止の現行装備は **work-guard (事後 block)** と **git status/log の人力確認 (毎回)** のみ。「これから src/cli.ts を触る」という**事前の意図宣言**を相手ランタイムへ伝える機構が無い (OR-3)。
- 実害の型: 同日に L7-325 番号衝突 (第 5 組)、staged 混線 (60ba09b)、リファクタ hot zone の回避判断が毎回オーケストレータの記憶頼み。

## スコープ (1 要件: 作業域 intent を宣言・共有し、重複域の着手前に警告する)

1. **registry**: `.ut-tdd/state/hot-zones.json` — entry = {runtime, session_id, paths (glob 可), plan_id, declared_at, ttl}。`ut-tdd zone claim/release/list` CLI。
2. **surface**: SessionStart (session start hook) で相手ランタイムの active zone を表示 — 「Codex が src/cli.ts を claim 中」を着手前に見える化。
3. **work-guard 連携 (warn 段)**: 相手の claim 域へ Edit する時に warn (block はしない — 宣言は調整であって所有権ではない。強制度は PO slot)。
4. **stale 掃除**: ttl 超過 entry は sweep (Stop hook or session start) — 宣言しっぱなしで域を占有し続けられない (劣化ベクトル C 型の予防)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 強制度 (warn/block) と ttl の PO/TL 決定 | 直列 (先行) |
| 2 | registry + CLI + tests | 直列 |
| 3 | SessionStart surface + work-guard warn 連携 | 直列 |
| 4 | AGENTS.md / CLAUDE.md へ運用 1 節 (宣言してから触る) | 直列 |

## DoD

- [ ] claim → 相手セッションの session start に表示される (実走 evidence)
- [ ] claim 域への foreign edit が warn (test 固定)
- [ ] ttl 超過 entry が sweep される (test 固定)
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- Codex 側も同一 CLI を叩けるため runtime 対称 (A-183 LENS-PY の教訓 — 新機構は最初から両 runtime で設計する)。
- 活性化時 kind は add-design + add-impl 対へ昇格。
