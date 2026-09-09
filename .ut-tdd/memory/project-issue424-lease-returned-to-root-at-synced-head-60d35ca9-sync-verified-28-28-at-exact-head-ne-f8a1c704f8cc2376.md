---
memory_id: memory:project:issue424-lease-returned-to-root-at-synced-head-60d35ca9-sync-verified-28-28-at-exact-head-next-canonical-apply-and-startup-fence-remain-with-root--f37f3c441d89
kind: project
title: "Issue424 lease returned to root at synced head 60d35ca9; sync verified 28/28 at exact head, next canonical apply and startup fence remain with root"
tags: ["codex-owned", "issue-424", "lease-return", "plan-l7-512", "sync"]
updated_at: 2026-09-08T12:11:37.464Z
---

Issue #424 の editing lease を Claude から Codex root へ **明示的に返却する** (2026-09-08)。
同期タスクは完了しており、次の実装 (canonical apply + startup fence) は root の所有で進めてよい。

## 返却時点の状態

- worktree `C:/dev/ut-issue424-memory-migration`、branch `work/add-feature-issue424-memory-migration`
- HEAD `60d35ca9104d7f4b80f84ab8dbc3cf1ccc1a0911` (origin へ push 済、upstream 設定済、working tree clean)
- 旧 HEAD `8216e726` から main `ea7658ca` への rebase 済み。conflict 0 件、force-push 不要 (remote 未 push だったため)。
- 実装・テストの内容は無変更 (4 files / +1215 のまま)。custody と既存証跡は保持。
- exact head 検証: `node scripts/run-vitest-snapshot.ts tests/project-memory-migration.test.ts
  tests/project-memory-migration-transaction.test.ts --reporter=dot` → 2 files / 28 passed、
  fence と cleanup を含めて exit 0 (duration 174.67s)。root の 8216e726 での 28/28 と同数で退行なし。
- Claude は以後この worktree を編集しない。

## 未了 (root の申告を Claude 側でも受領)

- PLAN-L7-512 rev4 の U005 / P005: unique/dedupe の byte 保存 canonical apply と next-start completion fence。
  既存の `ProjectMemoryMigration.dryRun` / `BoundSources` / `OperationRecords` / `resolveProjectMemoryRoot` を再利用し、
  新 authority を作らない。
- `src/cli.ts` の `runSessionStartSideEffects` / `readMemoryThroughService` に migration fence が無い。
  json startup がこれを迂回しないこと。
- `writeMemory` は ID / frontmatter / timestamp を再生成するため migration copier ではない。
- P002 / P003 の clean Pack parity は #420 / #432 の実前提が揃った後 (source fixture では代替しない)。
- 現 branch は inventory / conflict quarantine と process-crash recovery のみを示し、canonical migration の完成、
  provider parity、Issue #424 の完了は主張しない。

## Claude 側の残タスク

PR 作成後の exact-head CI 確認と非著者 review 手配のみ (PR 作成は root の pre-PR acceptance に従う)。
