---
plan_id: PLAN-L7-402-agent-definition-allowlist-coverage-check
title: "PLAN-L7-402 (troubleshoot): agent 定義 ↔ agent-guard allowlist の drift 検出 (doctor advisory)"
kind: troubleshoot
layer: L7
drive: agent
status: draft
route_signal: incident
route_mode: incident
created: 2026-07-09
updated: 2026-07-09
owner: PM / PO
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "既存 agent-guard (PLAN-L7-XXX 系サブエージェントガード) の非対称性を可視化する doctor advisory 追加であり、新規 L0/L1 要件ではない。harness self-application。"
agent_slots:
  - role: aim
    slot_label: "AIM - doctor advisory 実装 (allowlist ↔ 定義ファイル差分検出)"
  - role: se
    slot_label: "SE - 実装委譲 + regression test"
  - role: po
    slot_label: "PO - 検出された drift (未使用グローバル agent 定義等) の是正方針決定 (allowlist 追加 / 退避)"
generates:
  - artifact_path: docs/plans/PLAN-L7-402-agent-definition-allowlist-coverage-check.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/agent-definition-coverage.ts
    artifact_type: source_module
  - artifact_path: tests/doctor-agent-definition-coverage.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - .claude/CLAUDE.md
    - docs/governance/context-efficiency-audit-2026-07-09.md
---

# PLAN-L7-402 (troubleshoot): agent 定義 ↔ allowlist drift 検出

## 0. 目的

`.claude/agents/` (プロジェクト) と `~/.claude/agents/` (グローバル、環境依存で内容が変わりうる) に
存在する agent 定義のうち、`.claude/CLAUDE.md` の agent-guard allowlist に **載っていないもの** を
doctor advisory で可視化する。allowlist 外の agent 定義は `agent-guard.ts` が呼び出し時に必ず
block するため、載せたまま放置すると「呼べないのに毎セッションコンテキストへ注入され続ける」死重に
なる (F4、下記実測)。是正方針の決定 (allowlist へ追加するか、退避するか) は PO 判断に残すが、
**気づけない状態を機械で無くす** のが本 PLAN の scope。

## 1. 背景 (`docs/governance/context-efficiency-audit-2026-07-09.md` F4 より)

`~/.claude/agents/` (グローバル、全プロジェクト共有) に 12 件の agent 定義があり、うち
`be-api`/`be-logic`/`code-reviewer`/`db-schema`/`devops-deploy`/`qa-test`/`security-audit` の 7 件は
本リポジトリ `.claude/agents/` にプロジェクト版が存在するが、残る
`fe-a11y`/`fe-component`/`fe-design`/`fe-style`/`fe-test` の 5 件 (実測 15,572 バイト) は
プロジェクト版が無く、グローバル定義がそのまま毎セッションの利用可能 agent 一覧に載る。

しかし `.claude/CLAUDE.md` の agent-guard allowlist (19 件) にこの 5 件は含まれていない。呼び出しても
`agent-guard.ts` が exit 2 で必ず block するにもかかわらず、毎セッション ~15.6KB 分コンテキストへ
載り続けている。絶対量は小さいが、この harness を使うすべての Claude Code プロジェクトに横断的に
乗る固定コストであり、しかも **今は誰も気づいていない** (本監査で偶然発覚した)。

対応先そのもの (グローバル `~/.claude/agents/` の是正) は repo 外の判断のため本 PLAN の scope 外だが、
「今後また同じ drift が無音で発生する」ことを防ぐ検出機構は repo 内で実装できる。

## 2. Scope

- `.claude/agents/*.md` + (存在すれば) `~/.claude/agents/*.md` の agent 定義一覧を走査し、各定義名が
  `.claude/CLAUDE.md` の agent-guard allowlist に含まれるかを機械チェックする doctor advisory
  (`checkAgentDefinitionAllowlistCoverage` 相当) を追加する。
- 未使用 (allowlist 外) の agent 定義が見つかった場合、advisory (非 blocking) として
  「定義はあるが allowlist に無く呼び出せない agent: <名前一覧>」を報告する。
  **hard gate ではない** (グローバル環境の是正強制は repo の権限外、doctor は fail-open で報告のみ)。
- グローバル `~/.claude/agents/` ディレクトリが存在しない環境 (CI 等) では無音 skip
  (fail-open、環境依存パスへの必須依存を作らない)。

## 3. Non-Scope

- グローバル `~/.claude/agents/` からの実際のファイル移動・削除・allowlist への追加自体は対象外
  (PO 判断待ち、本監査 F4 参照)。
- agent-guard.ts 自体の allowlist 判定ロジック変更は対象外 (既存の block 挙動は変更しない)。
- プロジェクト `.claude/agents/*.md` とグローバル同名ファイルの内容差分検出 (drift) は別スライス。

## 4. Steps (未着手)

| Step | 内容 | mode |
|---|---|---|
| 1 | `.claude/CLAUDE.md` の allowlist セクションを解析するパーサ (既存 `agent-guard.ts` の
     allowlist 定義との単一ソース化を検討 — 現状 allowlist は `.claude/CLAUDE.md` の prose と
     `agent-guard.ts` 実装のどちらが正本か確認する) | 直列 |
| 2 | agent 定義ファイル一覧 (`.claude/agents/*.md` + `~/.claude/agents/*.md`、後者は存在時のみ)
     の収集 | Step 1 と並列可 |
| 3 | doctor advisory 実装 (`src/doctor/agent-definition-coverage.ts`) + `src/doctor/index.ts` への
     wiring | Step 1・2 の後 |
| 4 | regression test (`tests/doctor-agent-definition-coverage.test.ts`): allowlist 外定義あり/なし、
     グローバル dir 不在の 3 パターンを固定 | Step 3 の後 |

## 5. DoD

- [ ] `.claude/agents/` + (存在時) `~/.claude/agents/` の agent 定義のうち allowlist 外のものを
      doctor advisory で一覧表示する (test 固定)
- [ ] allowlist 外の定義が無い場合は無音 (退行なし、test 固定)
- [ ] グローバル agent ディレクトリ不在環境では fail-open で無音 skip (test 固定)
- [ ] advisory は non-blocking (`ut-tdd doctor` の exit code に影響しない)
- [ ] typecheck / Biome / Vitest / `ut-tdd doctor` green

## 6. Verification (実施時に記録)

- `bun run vitest run tests/doctor-agent-definition-coverage.test.ts --reporter=dot`
- `bun run typecheck`
- `bun run src/cli.ts doctor` (advisory が意図通り出ることを目視確認)
