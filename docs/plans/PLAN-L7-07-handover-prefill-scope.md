---
plan_id: PLAN-L7-07-handover-prefill-scope
title: "PLAN-L7-07 (add-impl): handover prefill のノイズ低減 — dedupeDigests + scopeToActive (IMP-048)"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — sameFamilyPlan の - 境界 prefix 判定 / dedupeDigests の union 集約と最長 id 正本化 / scopeToActive の空 handover fallback / 後方互換 (既定は dedup のみ) のレビュー (claude-only は code-reviewer 代替)"
  - role: qa
    slot_label: "QA — U-HOVER-008/009 が family 判定・union dedup・scope 絞り・fallback を被覆 / 既存 U-HOVER-001 後方互換を破らないこと"
generates:
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
  - artifact_path: tests/handover.test.ts
    artifact_type: test_code
  - artifact_path: src/cli.ts
    artifact_type: source_module
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-06-handover-mechanism.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: approve
    scope: "code-reviewer 2周 APPROVE (cluster1 commit 5b09ee5 で L7-06/L7-07 一括 review) (handover 2026-06-04)"
---

# PLAN-L7-07 (add-impl): handover prefill のノイズ低減 (IMP-048)

## §0 位置づけ

`ut-tdd handover` の §1-§2 auto-prefill が session-log digest の当日全 PLAN を含み、bare plan_id (`PLAN-L7-04`) と slug 付き (`PLAN-L7-04-handover-mechanism`) が **同一 PLAN を `unknown` ゴーストとして二重計上** していた (session-2 handover で実証)。improvement-backlog **IMP-048** への feature 対応。

- 駆動モデル: **Add-feature** (L6-06 設計の bottom-up 拡張)。
- 親: `PLAN-L6-06-handover-mechanism` (drive=fullstack 一致)。

## §1 実装する契約

`src/handover/index.ts`:
- `sameFamilyPlan(a, b)`: `a===b` または一方が他方の `-` 境界 prefix なら同 family (誤マッチ防止: `PLAN-L7-0` ⊄ `PLAN-L7-04`)。
- `dedupeDigests(raw)`: family ごとに group 化し、最長 id (= 最具体 slug) を正本に commits/files/sessions/failures を union 集約 (重複除去)。
- `resolveHandoverScope(deps, opts?)`: 収集後は **常に dedup**。`opts.scopeToActive && active_plan` のとき active family の digest のみへ絞る。active family が digest に無ければ全件 fallback (空 handover 回避)。既定 (opts 無し) は dedup のみ = 後方互換。
- `HandoverArgs.scopeToActive` を `runHandover` から `resolveHandoverScope` へ伝播。

`src/cli.ts`: `ut-tdd handover --scope-active` フラグ追加。

## §工程表

### Step 1: sameFamilyPlan / dedupeDigests / scopeToActive を ④ テスト先行 (Red)
U-HOVER-008 (family 判定 + union dedup) / U-HOVER-009 (scope 絞り + fallback) を追加。

### Step 2: src/handover/index.ts に ② 実装 (Green)
純関数 `sameFamilyPlan` / `dedupeDigests` + `resolveHandoverScope` の opts 拡張。`failures` は `{ts,summary}[]` のため JSON-key で dedup。

### Step 3: CLI 配線
`--scope-active` フラグを `runHandover` の `scopeToActive` へ。

### Step 4: review Step (self / code-reviewer)
後方互換 (既定 dedup のみ・U-HOVER-001 不変)・誤マッチ防止・空 handover fallback を review (claude-only = code-reviewer 代替、evidence 記録)。

### Step 5: 回帰 + 用語更新 + スモーク
typecheck 0 / biome CLEAN / `npx vitest run` 全 pass / `handover --dry-run --scope-active` スモークでノイズ低減を確認 / §6 用語更新。

## §実装計画

| 項目 | 情報源 |
|---|---|
| bare/slug ゴーストの実害 | 既存資料 (session-2 handover の `unknown` 重複) |
| - 境界 prefix 判定 | PM 判断 (誤マッチ防止のため startsWith(`${short}-`)) |
| union 集約の dedup キー (failures は object) | 既存資料 (PlanDigest 型 failures={ts,summary}[]) |
| 空 handover fallback 方針 | PM 判断 (scope 絞りで空になるなら全件へ戻す) |

## §6 用語更新

- **plan family / dedup 正本化**: bare plan_id と slug 付きを同一 PLAN family と見なし、最長 (最具体) id を正本に digest を畳む。handover prefill の `unknown` ゴーストを排除 (用語集追加は REVERSE-06 で back-fill)。
