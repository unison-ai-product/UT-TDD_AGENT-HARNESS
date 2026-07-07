---
plan_id: PLAN-L7-365-harness-db-currency-hook
title: "PLAN-L7-365 (impl): harness.db on-disk currency の自動維持 + staleness gate"
kind: impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-07
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - rebuild trigger と staleness 判定の設計レビュー"
  - role: se
    slot_label: "SE - hook 駆動 rebuild + token ingest 統合 + doctor staleness"
generates:
  - artifact_path: docs/plans/PLAN-L7-365-harness-db-currency-hook.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/plans/PLAN-L7-348-runtime-state-recoverability.md
    - src/state-db/projection-writer.ts
    - src/doctor/db-projection.ts
    - src/runtime/session-log.ts
    - .claude/settings.json
---

# PLAN-L7-365 (impl): harness.db on-disk currency の自動維持

## Status

draft 起票 (2026-07-07 DB三ループ監査。Major 所見: canonical な handover/query 面が「rebuild し忘れ」に
依存)。着手時は add-impl + Reverse pairing へ昇格 (route_mode=add-feature debt)。

## 背景

- どの workflow hook も永続 harness.db を rebuild しない。SessionStart/PostToolUse/Stop/SubagentStop は
  `.ut-tdd/logs/session/*.jsonl` への追記のみ (`src/runtime/session-log.ts`)。doctor は
  `:memory:` の使い捨て DB を rebuild する (`src/doctor/db-projection.ts`) ため on-disk は更新されない。
- `rebuildHarnessDb` (`src/state-db/projection-writer.ts`) は token/cost ingest を含まないため、
  on-disk の model_runs コスト行は `db rebuild` 後も別途 `ut-tdd telemetry scan` が必要。
- 帰結: 完全自動捕捉された session イベントですら `ut-tdd db rebuild` を手動実行するまで on-disk DB から
  queryable にならない。SessionStart takeover surface (PLAN-L7-110) は canonical な引き継ぎ面なのに
  **stale な on-disk を読む**。データ喪失は無い (JSONL + docs が source of truth、rebuild は決定的) が、
  currency を自動化・強制する機構が皆無で staleness を検出する gate も無い。
- **PLAN-L7-348** は同じ DB でも **backup/recoverability** 軸 (disaster recovery) を扱う別 PLAN。本 PLAN は
  **currency (鮮度)** 軸に限定し、references で相互参照して混同を防ぐ。

## スコープ

1. **hook 駆動 currency**: Stop (session summary) hook で on-disk harness.db を決定的に rebuild する
   (or 差分投影)。rebuild は fail-open で session 終了を妨げない。token ingest も統合し `telemetry scan`
   の別実行依存を解消する。
2. **staleness gate**: on-disk DB の投影 source (docs/plans mtime + session jsonl tail) と DB の
   `source_hash` を突き合わせ、乖離を検出する `db-currency` doctor check を追加する。
3. takeover surface / `find` / `progress artifacts` 等の DB 読取り consumer が stale を読む場合に警告する。

## 非対象

- backup / recovery ledger / recovery-probe は **PLAN-L7-348** の scope。
- projection ロジック自体の変更はしない (currency 維持のみ)。

## §3 工程表

### Step 1: rebuild trigger + staleness 判定設計 (TL) [直列]

hook rebuild の fail-open 境界、token ingest 統合点、staleness の source_hash 突合方式を確定する。
後続実装がこの契約に依存 (downstream_dependency)。

### Step 2: Stop hook 駆動 on-disk rebuild + token ingest 統合 [直列]

`session-log.ts` の Stop 経路とrebuild パイプラインの共有状態を編集するため直列 (shared_state)。

### Step 3: db-currency doctor check [並列]

on-disk DB の source_hash 乖離検出。独立 module のため並列可。

### Step 4: currency regression test [並列]

hook rebuild 後に session イベントが on-disk から queryable、rebuild 例外が session 終了を妨げない
ことを固定。別 test file のため並列可。

### Step 5: cross-runtime レビュー (pmo-sonnet / codex) [直列]

fail-open 境界と staleness 閾値、L7-348 との軸分離を別ランタイムでレビュー (downstream_dependency)。

## §3.1 実装計画

`src/runtime/session-log.ts` の onStop に on-disk rebuild + token ingest 呼出を追加 (try/catch fail-open)
→ `projection-writer.ts` の rebuild に token ingest を統合 → `src/doctor/` に `checkDbCurrency` を追加し
check-registry へ登録 → `tests/` に currency + fail-open regression を追加。Pack runtime へ反映。

## DoD / 受入基準

- [ ] Stop hook 後に on-disk harness.db が最新 session イベントを含む (`bun run src/cli.ts db rebuild`
      を手動実行せずとも queryable、test 固定)。
- [ ] `db rebuild` / hook rebuild 後に token/cost 行が別 `telemetry scan` 無しで存在する。
- [ ] `ut-tdd doctor` の `db-currency` が on-disk DB の staleness を検出する。
- [ ] rebuild 例外が session 終了を妨げない (fail-open regression test green)。
- [ ] references が PLAN-L7-348 (recoverability 軸) を明示し軸分離が記録されている。
