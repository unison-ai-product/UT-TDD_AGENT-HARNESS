---
memory_id: memory:feedback:pr-546-ci-red-at-5737752d-is-a-single-dependency-drift-module-cycle-memory-runtime-memory-introduced-by-src-memory-project-memory-migration-ts--1e9c5c131def
kind: feedback
title: "PR #546 CI red at 5737752d is a single dependency-drift module cycle memory -> runtime -> memory introduced by src/memory/project-memory-migration.ts"
tags: ["ci", "dependency-drift", "issue544", "module-cycle", "pr546"]
updated_at: 2026-09-09T02:42:23.906Z
---

## CI 赤の切り分け (head 5737752deaf029e0d0feffbcc15223cbd46d178a、非著者 Claude による事実報告)

`harness-check-linux` fail (run 34303473371 / job 102315280093) の原因は **1 件のみ**です。exact-head review は
CI green 後に回すため、先に事実だけ返します。

```
doctor: dependency-drift — ⚠ 1 件
doctor: dependency-drift — module-cycle: module cycle: memory -> runtime -> memory
```

log 全体で `⚠` / violation はこの 1 件だけで、typecheck・Vitest・Biome・他の doctor check はすべて OK
(`impl-plan-trace` OK、`oracle-test-trace` OK、`db-*` OK、`design-language` / `readability` OK)。
`Process completed with exit code 1` の直前まで他の失敗はありません。

### 閉路の実体

新規 `src/memory/project-memory-migration.ts` が runtime 側を import しており、既存の逆向き辺と閉じます。

- `src/memory/project-memory-migration.ts:7` → `../runtime/project-memory-root.ts`
- 同 `:8` → `../runtime/worktree-topology.ts`
- 同 `:12` → `../runtime/worktree-topology-collector.ts`
- 既存 `src/runtime/project-memory-root.ts:6` → `../memory/index.ts` (これが閉じる辺)
- 既存 `src/runtime/claude-memory-wake.ts:16-17`、`src/runtime/claude-provider-envelope.ts:2-3` も runtime → memory

つまり **runtime → memory は既存の確立した向き**で、今回追加された memory → runtime が逆流して閉路になっています。

### 方式判断 (著者側の選択)

1. **モジュールを `src/runtime/` へ置く** — runtime は既に memory へ依存しているので閉路は生じない。
   inventory は worktree topology (runtime 関心事) を主入力にしているため、責務としてもこちら寄り。
2. **依存を反転して port 注入にする** — `projectMemoryRoot` / topology 解析を引数 (関数) で受け取り、
   `src/memory/` からは runtime を import しない。memory 側に置く必要がある場合はこちら。

どちらでも閉路は解けますが、`generates` の所有と PLAN-L7-512 の層宣言に整合する側を選ぶ必要があるため、
著者判断としてお返しします。`harness-check-windows` は本報告時点でまだ pending です。
