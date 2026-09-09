---
memory_id: memory:feedback:pr-448-linux-ci-red-route-mode-kind-mismatch-agent-slots-missing-test-isolation-callsite-drift--082d0e4dcdc0
kind: feedback
title: "PR 448 Linux CI red: route mode kind mismatch, agent_slots missing, test isolation callsite drift"
tags: ["ci-red", "plan-governance", "pr-448", "route-filing"]
updated_at: 2026-08-27T08:50:26.814Z
---

## Linux CI 赤の内訳 (run 33055116780, PR 起因 3 件)

### 1. `plan-governance` — violation 8 件 / 928 PLAN

```
invalid_frontmatter=2, route_certificate_mismatch=2, route_mode_kind_mismatch=2,
parent_drive_mismatch=1, requires_not_ready=1
sample: docs/plans/PLAN-L7-520-review-execution-outcome.md:invalid_frontmatter(agent_slots:invalid_type(undefined)),
        docs/plans/PLAN-REVERSE-520-review-execution-outcome-backfill.md:invalid_front…
```

**(a) `agent_slots` 欠落** — 両 PLAN とも frontmatter に `agent_slots` が無く `invalid_type(undefined)`。

**(b) route certificate の mode/kind 不整合** — SSoT (`src/schema/route-filing.ts`) 実測:

| mode | allowed_kinds | layer_band |
|---|---|---|
| `refactor` | `["refactor"]` | `["L7"]` |
| `retrofit` | `["retrofit"]` | `["L7"]` |
| `add-feature` | `["add-design","add-impl"]` | `["L3-L6","L7"]` |

- `PLAN-L7-520`: `route_mode: refactor` × `kind: add-impl` → **不許可**。
  `add-impl` を通すのは `add-feature` か `design-bottomup` のみ。
- `PLAN-REVERSE-520`: `route_mode: retrofit` × `kind: reverse` → **不許可**。
  `reverse` を許すのは `reverse` mode (layer `cross`)。

新規実装契約なら `PLAN-L7-520` は `route_mode: add-feature`、Reverse 対は `route_mode: reverse` が
整合します。ただし **§3-3 単独へ絞り込む**なら (別コメント参照)、そもそも新規 add-impl PLAN ではなく
既存 PLAN への slice 追加、あるいは `refactor` kind での起票のほうが実態に合います
(受理条件を変えず情報破壊だけを直す = behavior invariant + regression fence)。

**(c) `requires_not_ready=1`** — `requires: [PLAN-L7-493-d3a-repo-local-verdict-custody]` の
status を確認してください。`requires` は confirmed / completed のみ、draft への依存は
`references` へ回す規約です。

### 2. `test-repository-isolation` — callsite drift

```
callsite-drift:tests/review-live-cli.test.ts:isolated_fixture:expected=2:actual=3
```

`tests/review-live-cli.test.ts` の isolated fixture 呼出が 2 → 3 に増えており、
登録側の期待値と乖離しています。

### 3. change lane

```
change lane: full (non-doc-lane-path (fail-close):
  docs/plans/PLAN-L7-520-…, docs/plans/PLAN-REVERSE-520-…, docs/test-design/harness/L7-revi…)
```

doc lane 迂回ではなく full lane が選択されており、これは想定どおり (情報として記録)。

Windows leg はまだ pending です。
