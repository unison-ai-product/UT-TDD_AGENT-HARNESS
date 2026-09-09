---
memory_id: memory:feedback:pr-546-r1-verdict-pass-at-e695ef64-read-only-inventory-verified-no-memory-to-runtime-cycle-path-keys-are-git-realpath-derived-ledger-183-187-pure-append-with-all-digests-recomputed--0d39b8f72253
kind: feedback
title: "PR #546 r1 verdict PASS at e695ef64: read-only inventory verified, no memory-to-runtime cycle, path keys are git+realpath derived, ledger 183->187 pure append with all digests recomputed"
tags: ["issue544", "pass", "pr546", "review", "verdict"]
updated_at: 2026-09-09T03:43:59.919Z
---

## 非著者 closing review r1 (Claude `claude-opus-5`) — exact HEAD e695ef640ecbfccabf5a23971a3e4a1262ddaaf8

**VERDICT: PASS** (blocking 0)

- canonical receipt: `.ut-tdd/review/receipts/cb22e73baaaee90dd5c160d94d2b709a02df9895cd68fd31087dc5dbaff224cc.json` (reviewerFamily claude, at 2026-09-09T03:42:33Z)
- request memory: `review-request-pr546-e695ef64` (依頼は `f02f0218` を正本とし、stray word のある `bc7f2e92` は supersede 済みとして evidence にしていない)
- exact-head CI: run 34306522785 5/5 success
- baseline: merge-base `e0309c769ba8fb33f04274e9b2ff36c44e297def`

### 検証済み

- **read-only 性**: `node:fs` からの import は `lstatSync` / `readdirSync` / `readFileSync` の 3 つだけ。
  `writeFileSync` / `rm` / `rename` / `mkdir` 相当の副作用は実装中に存在しない。injectable な
  `MemoryMigrationPorts` も `collect` / `read` の 2 read port のみ。CLI surface / apply / audit の混入なし
  (1 PR = 1 論点)。
- **依存の向き**: `project-memory-migration.ts` の import は runtime 内 3 本 + `../memory/index.ts` に留まり、
  `src/memory/` 配下から runtime への import は **0 件**。`memory -> runtime -> memory` の閉路は再発なし。
- **path 同一性 (今回の核心)**: 実装は path key を caller 引数から**一切**取っていない。`worktrees` は
  collector 由来 (`normalizeTopologyPath(realpathSync.native(...))`)、突き合わせ相手の
  `canonicalProjectRoot` は `realpathSync(dirname(gitCommonDir))` で `gitCommonDir` は
  `git rev-parse --path-format=absolute --git-common-dir` 出力。`repoRoot` は `-C` の cwd としてのみ使用。
  よって綴り差で fail-close する経路は本 head に無い。
- **修理が期待値合わせでないこと**: 期待値を実測へ書き換えたのではなく、誤った oracle (caller 引数の
  `mkdtemp` path) を spec 上正しい独立 oracle (`git rev-parse --show-toplevel` 由来) へ差し替えている。
  実装が使う導出 (`--git-common-dir` + `realpathSync.native`) とは別経路なので、caller 綴りが漏れる退行が
  起きれば `tests/project-memory-migration.test.ts:96-101` が落ちる。追加された `dryRun(linked)` 一致
  (同 116 行) は entry-point 不変性の独立 oracle。
- **oracle 8 件**: `U-PMEMINV-001..008` が 1 対 1 で存在、id 重複 0。負系は 003 (invalid frontmatter /
  read 失敗)、004 (foreign HEAD)、005 (incomplete topology)、006 (non-regular source)、007 (junction)、
  008 (malformed UTF-8 / BOM)。partial inventory 不在は `toEqual({ok:false, reason})` の完全一致で、
  「source を読む前に拒否」は `reads` カウンタ 0 assertion で支えられている。
- **ledger 追記性**: +64/-0 の純 tail append。baseline record の書き換え 0 件。追記は sequence 184..187 の
  4 件 (L7-512 r5 / REVERSE-512 r5 / L7-512 r6 / REVERSE-512 r6)、飛び番・巻き戻しなし。chain は
  baseline 末尾 sequence 183 の `sha256:037ad192…` から 187 まで連続。`command_id` / `receipt_id` 重複 0。
  両 PLAN の `admission_receipt` は revision 6 の entry を指す。revision 5・6 の 2 段追記は途中 head の
  admission が残っているだけで説明可能。
- **PLAN hygiene**: Reverse 対が双方向参照、両 PLAN `requires: []`、新規 2 artifact の `generates` 所有は
  L7-512 のみ (他 PLAN と重複なし)、route certificate は `kind: add-impl` を許す、green claim に根拠コマンド
  (`node scripts/run-vitest-snapshot.ts …`) と exit code が添付。

### 非 blocking の注記

1. `realpathSync` (8.3 短縮名を展開しない) と `realpathSync.native` (展開する) の理論上の非対称が
   baseline の `project-memory-root.ts` に残る。ただし本 PR の変更対象外で、8.3 alias が実在する環境
   (前 head の Windows job) で両導出が同一の長い綴りへ収束していることが実測で示されている。
2. 追加 oracle は primary / linked という入口の違いを突いており、同一ディレクトリの短縮名 / 長い名前という
   綴り差そのものは突いていない (fixture の両 root がともに `mkdtemp` 由来)。

### reviewer 環境の制約 (verdict 本文にも明記済み)

`record_digest` を kernel formula で再計算する node script が環境の承認拒否で実行できず、chain 連続性と
CI の receipt gate による間接確認に留まっている (working tree 読みでの代替はしていない)。
**Claude root 側で別途 kernel formula による再計算を行い、下記のとおり一致を確認した。**

```
base=183 head=187 baselinePreserved=true digestMismatch=0 chainBreak=0
idDuplicates=0
 seq 184 PLAN-L7-512-project-scoped-memory-root rev 5
 seq 185 PLAN-REVERSE-512-project-scoped-memory-root-backfill rev 5
 seq 186 PLAN-L7-512-project-scoped-memory-root rev 6
 seq 187 PLAN-REVERSE-512-project-scoped-memory-root-backfill rev 6
```

187 record 全件を `trackedReceiptRecordDigest` の式 (`src/kernel/github-closure-receipt.ts:158-176`) で
再計算し **digest mismatch 0 / chain break 0**、baseline 183 record は byte 一致で保存、
`command_id` / `receipt_id` の重複 0 を確認した。追記 4 件の plan / revision も上記のとおり。

PASS のため merge 可。`ut-tdd pr merge --pr 546` で正規経路のみを使う。
