---
plan_id: PLAN-L7-356-wave-team-orchestration
title: "PLAN-L7-356 (impl): wave-runner — PLAN 束から team 定義を生成し並列レーンで消化する (Codex オーケストレーション既定化)"
kind: impl
layer: L7
drive: agent
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
    slot_label: "PO - v2 活性化時期 + 並列レーン数の上限とコスト予算の承認"
  - role: tl
    slot_label: "TL - lane 生成規則 (model/effort/締め権限なし) と hot-zone 突合のレビュー"
  - role: se
    slot_label: "SE - team plan generator + surface + AGENTS.md/CLAUDE.md 追記"
generates:
  - artifact_path: docs/plans/PLAN-L7-356-wave-team-orchestration.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-183-runtime-parity-vendor-lessons-audit-2026-07-03.md
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
    - docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
    - docs/plans/PLAN-L7-350-hot-zone-intent-registry.md
    - docs/plans/PLAN-L7-253-orchestrator-model-identity-advisor-triggers.md
    - src/team/run.ts
---

# PLAN-L7-356 (impl): wave-runner — PLAN 束の並列レーン消化

## Status

**version-up parked (v2)**。PO 指示 2026-07-03「Codex はオーケストレーションをあまりしない — 対策を取り、オーケストレーションさせて実装速度を上げたい」。

## 背景 (実測 2026-07-03)

- **並列 subagent slot 31 件は全て Claude 側発火** (pmo-sonnet 19 / pmo-project-explorer 9 / ut-tdd-tl 3、slot_source=agent_guard)。**Codex 側の並列発火 = 0** — PO 観察をデータが裏付け。
- 委譲自体は機能している (model_runs 634 行、codex 系 425 / claude 系 145) が全て**直列**。`ut-tdd team run` (worker/reviewer 分離・model/effort policy・`buildTeamRunPlan` 実装済) は **example YAML 1 本のみで実質未使用** — 並列化の道具は在るのに「PLAN 束 → team 定義」を作る入口が無く、手書き YAML が障壁。
- AGENTS.md「TL Driven Mode」は gate 判断権限の定義であり、fan-out プロトコルを含まない。
- **方式の要**: Codex 内部の spawn_agent 多重化には依存しない (A-183 PY-7 = 実 payload 未検証、memory 既知「presence≠spawnable」) — **ハーネス介在型** (team run が `codex exec` を並列プロセスとして起動する既存経路) で実現する。runtime 中立なので Claude orchestrator でも同じコマンドで fan-out できる (LENS-PY 原則)。

## スコープ (1 要件: PLAN 束を 1 コマンドで並列レーン化し、オーケストレーションを両 runtime の既定動作にする)

1. **team plan generator**: `ut-tdd team plan --plans <id,id,...> [--out <yaml>]` — 指定 PLAN 群から team 定義を生成する:
   - worker lane = PLAN 1 本につき 1 レーン。model = spark/mini 級 GPT/Codex (CLAUDE.md routing「軽量並列レーン」既定、effort high)、**締め権限なし** (confirmed flip 不可を定義に明記)。
   - reviewer lane = worker と別 family (JUDGMENT_GATES 整合)。
   - 生成時検査: 対象 PLAN の依存充足 (`requires` の status)・未決分岐なし (T3 と同判定)・**touch 領域の非重複** (generates/references から推定。L7-350 landed 後は hot-zone registry と突合)。重複があれば直列へ落とすか警告。
2. **fan-out プロトコルの規則化**: AGENTS.md (TL Driven Mode) と CLAUDE.md へ同文で追記 —「並列可の独立 PLAN が 2 本以上あるとき、orchestrator は team plan → team run で fan-out する。lane は実装のみ、判断ゲートは orchestrator + advisor (L7-253 T1) が握る」。doc 非対称を作らない (A-183 PY-5 型回避)。
3. **オーケストレーション実績の可視化**: runtime 別の並列レーン数・委譲数を status / baseline sentinel (L7-313) へ surface — 「Codex がオーケストレーションするようになったか」を prose でなく実測で検証する (LENS-DE: 発火実績)。team_runner slot の記録経路は既存 (`executeTeamRunPlan`) を再利用。
4. コスト安全弁: 並列レーン数上限 (既定 3、PO 承認 slot) + L7-255 の effort 注入が landed していれば lane ごとの effort を明示注入 (未 landed なら provider 既定のまま + その旨を plan 出力に表示)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | lane 生成規則・上限・コスト予算の PO/TL 確定 | 直列 (先行) |
| 2 | team plan generator + 生成時検査 + tests | 直列 |
| 3 | 実 wave (例: A-182 の並列可 PLAN 2-3 本) で dry-run → 実走 smoke | 直列 |
| 4 | AGENTS.md / CLAUDE.md 追記 + 実績 surface | 直列 |

## DoD

- [ ] `team plan --plans <2本>` が worker/reviewer lane 付き YAML を生成し `team run` (dry-run) が受理する (test 固定)
- [ ] touch 領域が重複する PLAN 束で警告 or 直列化される (test 固定)
- [ ] lane 定義に「締め権限なし」が機械表現され、reviewer が別 family (test 固定)
- [ ] 実走 smoke 1 回の evidence (Codex orchestrator 起点が望ましい)
- [ ] status/sentinel に runtime 別レーン実績が表示される
- [ ] `bun run test` full green

## 実装ノート (後続モデル向け)

- 実装の中核は「PLAN frontmatter → TeamDefinition 変換」— `buildTeamRunPlan`/`selectTeamModel` は既存資産をそのまま使い二重実装しない。
- 速度の源泉は lane の並列度より「**orchestrator が実装を持たない**」こと — Codex orchestrator は lane の起動・検収・commit 統合に徹し、自分でコードを書かない運用を AGENTS.md 追記で明示する。
- 活性化時 kind は add-design + add-impl 対へ昇格 (機構新設、Reverse pairing 必須)。
