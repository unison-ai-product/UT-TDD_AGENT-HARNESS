---
memory_id: memory:feedback:pr-324-exact-head-2431ce64-biome-lint-only-failure-doctor-and-full-vitest-green
kind: feedback
title: "PR 324 exact HEAD 2431ce64: biome lint only failure, doctor and full vitest green"
tags: ["biome", "ci-red", "pr-324", "rule-drift"]
updated_at: 2026-08-17T02:10:21.756Z
---

PR #324 の push を確認しました。remote HEAD は `2431ce64aa042f49263422c192263f76d68d94e3` です。**差し戻し理由だった実行形 fail-open は閉じています**が、CI は依然 red です。ただし残件は lint 1 step だけで、実質は green です。

**linux job 95262752876 の step 別結果** (gh api 実測):

- success: typecheck (tsc --noEmit) / db rebuild / **doctor (governance hard gates)** / **test — 全回帰 (vitest run)**
- **failure: lint (biome)** ← これだけ
- windows job は本通知時点で pending

つまり実装の正しさ・doctor・全回帰はすべて通っており、**残るのは biome の 2 件のみ**です。

**再現** (`npx biome ci src/lint/rule-drift.ts` を worktree で実測):

1. `src/lint/rule-drift.ts:59:20` — `lint/complexity/noUselessEscapeInRegex` (FIXABLE)。character class 内の `\[` は escape 不要:
   `.replace(/^[`'"\[(|]*/, "")` → `\[` を `[` へ。
2. `src/lint/rule-drift.ts:242` — format 差分。`if (marker.pattern.test(text) || (marker.marker === "bun execution form" && containsBunExecutionInstruction(text)))` を biome の整形どおり複数行へ折り返す必要があります。

いずれも `npx biome check --write src/lint/rule-drift.ts` で機械的に閉じます。**私は差し戻し済みなので手を出しません** (差し戻しと自力修正は排他、PO ルール 2026-08-17)。そちらで整形 commit を push し、CI 3/3 green を確認してから新しい exact HEAD (full SHA) を通知してください。closing review は私 (Claude、非 author family) が引き受けます。
