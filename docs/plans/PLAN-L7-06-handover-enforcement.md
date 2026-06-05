---
plan_id: PLAN-L7-06-handover-enforcement
title: "PLAN-L7-06 (add-impl): handover-on-completion 規律の機械強制 — checkHandoverDiscipline + Stop-hook warn + doctor surface (IMP-047)"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — checkHandoverDiscipline の純判定 (活動有無→pointer 不在/stale/drift) の DbC / Stop-hook 配線が fail-open を壊さないこと / readPointer の never-throw レビュー (claude-only は code-reviewer 代替)"
  - role: qa
    slot_label: "QA — U-HOVER-010 が活動なし/未生成/fresh/stale/drift の 5 分岐 + readPointer 3 ケースを被覆 / fail-open oracle"
generates:
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
  - artifact_path: tests/handover.test.ts
    artifact_type: test_code
  - artifact_path: .claude/hooks/session-log.ts
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

# PLAN-L7-06 (add-impl): handover-on-completion 規律の機械強制 (IMP-047)

## §0 位置づけ

`PLAN-L6-06-handover-mechanism` が確定した handover 二層機構 (CURRENT.json + md) を土台に、**「PLAN 完了/節目なのに handover 追記なし」を agent 記憶に頼らず機械が surface する** 強制機構を追加する add-impl。improvement-backlog **IMP-047** (PO 指摘: 本 PM が handover 手動生成を忘れた = workflow ギャップ) への feature 対応。

- 駆動モデル: **Add-feature** (既存 L6-06 設計の bottom-up 拡張)。上位整合 (§6.8.5 強制節の明文化) は `PLAN-REVERSE-06` で back-fill。
- 親: `PLAN-L6-06-handover-mechanism` (drive=fullstack 一致)。

## §1 実装する契約

`src/handover/index.ts`:
- `readPointer(deps)`: CURRENT.json を読む。不在/壊れ → null (never throws)。
- `checkHandoverDiscipline(deps, maxHours=24)`: 純判定 + I/O。`resolveHandoverScope` で活動 (active_plan + digest) を確認し、活動が無ければ規律対象外で `[]`。活動ありで CURRENT.json が ①不在 → 未生成 warn / ②stale (`handoverStale`) → stale warn / ③別 plan family を指す (`sameFamilyPlan` 否定) → drift warn を返す。fail-open。

`.claude/hooks/session-log.ts`:
- Stop event の dispatch 後に `checkHandoverDiscipline(nodeHandoverDeps(repoRoot))` を呼び、各 warning を `[ut-tdd handover] ...` として **stderr に出すのみ** (exit 0 維持 = fail-open を壊さない)。内側 try/catch で surface 失敗も飲む。

**機構の射程**: IMP-047 が挙げた 4 surface のうち **doctor checkHandover (既存、PLAN-L7-04 carry 済) + Stop-hook warn (本 PLAN)** の 2 機構で規律を機械化する。`plan lint` 配線は `src/plan/lint.ts` が stub のため別 carry、pre-push hook も未配線 (§4 carry)。

## §工程表

### Step 1: readPointer / checkHandoverDiscipline を ④ テスト先行 (Red)
U-HOVER-010 を `tests/handover.test.ts` に追加 (活動なし/未生成/fresh/stale/drift の 5 分岐 + readPointer 3 ケース)。

### Step 2: src/handover/index.ts に ② 実装 (Green)
`readPointer` / `checkHandoverDiscipline` を実装し U-HOVER-010 を green 化。`sameFamilyPlan` / `handoverStale` を再利用。

### Step 3: Stop-hook 配線
`.claude/hooks/session-log.ts` の Stop 経路に stderr warn を追加 (fail-open 内側)。

### Step 4: review Step (self / code-reviewer)
fail-open 不変・never-throw・Stop-hook が作業を止めないことを review (claude-only = `intra_runtime_subagent` code-reviewer 代替、evidence 記録)。

### Step 5: 回帰 + 用語更新
typecheck 0 / biome CLEAN / `npx vitest run` 全 pass / §6 用語更新。

## §実装計画

| 項目 | 情報源 |
|---|---|
| checkHandoverDiscipline の分岐 (未生成/stale/drift) | 既存資料 (handoverStale/sameFamilyPlan) + IMP-047 backlog |
| Stop-hook fail-open 制約 | 既存資料 (.claude/CLAUDE.md session-log 方針) |
| U-HOVER-010 oracle | 自動生成 (既存 U-HOVER テスト雛形踏襲) |
| 4 surface の射程判断 (2/4 機構で成立) | PM 判断 (lint stub / pre-push 未配線は別 carry) |

## §6 用語更新

- **handover discipline (規律) surface**: PLAN 活動があるのに CURRENT.json が未生成/stale/drift の状態を機械が warn すること。新 FR は起こさず、§6.8.5 の強制側を `checkHandoverDiscipline` で具現化 (用語集追加は REVERSE-06 で back-fill)。
