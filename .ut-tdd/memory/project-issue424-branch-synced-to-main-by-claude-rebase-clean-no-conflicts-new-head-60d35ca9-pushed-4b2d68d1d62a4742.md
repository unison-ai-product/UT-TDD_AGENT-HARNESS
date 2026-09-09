---
memory_id: memory:project:issue424-branch-synced-to-main-by-claude-rebase-clean-no-conflicts-new-head-60d35ca9-pushed-28-28-tests-green-at-exact-head-pr-creation-stays-with-root--8007b4aee5e2
kind: project
title: "Issue424 branch synced to main by Claude: rebase clean (no conflicts), new head 60d35ca9 pushed, 28/28 tests green at exact head; PR creation stays with root"
tags: ["claude-owned", "exact-head", "issue-424", "memory-migration", "rebase", "sync"]
updated_at: 2026-09-08T12:04:43.626Z
---

Issue #424 memory-migration branch の current-main 同期を Claude が実施した (2026-09-08)。
root の handoff (`issue424-clean-handoff-released-for-claude-main-sync-and-verification`) に対する ownership 受領と結果報告。

## ownership

`C:/dev/ut-issue424-memory-migration` / `work/add-feature-issue424-memory-migration` の編集 lease を Claude が受領し、
同期のみを実施した。実装ファイル・テストの内容は変更していない (追加/削除/改変なし)。custody と既存証跡は保持。
primary `harness.db` には触っていない。DB copy / row 手挿入 / revision reset / 新 Recovery 起票はしていない。

## 同期結果

- 旧 HEAD: `8216e72604d3eb4de724db15c55c4887c968ff9b` (merge-base `84cd7f89`)
- 同期先: origin/main `ea7658ca0e0b2734bf08263718ced109f788cd48`
- **conflict は 0 件** (`git merge-tree --write-tree origin/main 8216e726` が CONFLICT なしで tree
  `7a5822c3b84003bd4d66cab668b299e99ef0362c` を返した)。台帳 (`plan-admission-receipts.json`) は本 branch の
  変更対象外であり、#527 で発生した rechain 問題は起きない。
- 方式: **rebase** (9 commit を main の上に再適用、conflict なし)。branch は remote 未 push だったため
  force-push は不要で、通常 push で完了した。他ランタイムの公開履歴を書き換えていない。
- 新 HEAD: `60d35ca9104d7f4b80f84ab8dbc3cf1ccc1a0911` (origin へ push 済、upstream 設定済)
- 差分は base に対して 4 files / +1215 のみ:
  `src/memory/project-memory-migration-transaction.ts`、`src/memory/project-memory-migration.ts`、
  `tests/project-memory-migration-transaction.test.ts`、`tests/project-memory-migration.test.ts`

## exact-head 検証 (新 HEAD 60d35ca9)

- `node scripts/run-vitest-snapshot.ts tests/project-memory-migration.test.ts tests/project-memory-migration-transaction.test.ts --reporter=dot`
  → **2 files / 28 passed / 0 failed**、duration 174.67s、snapshot fence と cleanup を含めて exit 0。
  root が 8216e726 で得た 28/28 と同数で、rebase による退行は無い。
- GitHub CI は `on: pull_request` と `push: [main]` のため、PR 未作成の branch push では起動しない。
  root が pre-PR acceptance を保持しているとのことなので、**PR 作成は root 側**とし、Claude は PR 作成後の
  exact-head CI 確認と非著者 review 手配を担当する。

## 未主張

本 branch は inventory / conflict quarantine と process-crash recovery を示すのみで、canonical migration の完成、
provider parity、Issue #424 全体の完了は主張しない (root の申告どおり)。closing PASS も出していない。
