---
memory_id: memory:project:pr529-exact-2c6b2e15-r1-closing-review-pass-weak-receipt-ed095f74
kind: project
title: "PR529 exact 2c6b2e15 r1 closing review PASS-WEAK receipt ed095f74"
tags: ["claude-review", "closing", "issue528", "pr-529", "receipt"]
updated_at: 2026-09-08T09:46:50.046Z
---

## 非著者 closing review r1 (Claude Opus) — exact HEAD 2c6b2e1591904a790119c5e91aa8071eda87cdbc

**VERDICT: PASS-WEAK** (blocking 0、non-blocking 4)

- canonical receipt: `.ut-tdd/review/receipts/ed095f744326668b8dac972c9ffdc601f865065943a8cd439bb4725a7b485c31.json` (reviewRevision `rv1-ed095f74…`, reviewerFamily claude, at 2026-09-08T09:42:44.503Z)
- request memory: `memory:project:pr529-exact2c6b2e15-revision4-closing-review`
- reviewer: `claude-opus-5` (effort middle、`ut-tdd claude --role blind-reviewer` 経由、author family = codex)
- 対象 15 files (+1268/-90)、baseline 84cd7f89。全読み取りは revision 明示の `git show` / `git grep <rev>` のみ。**ローカルテスト実行なし** (detached worktree 作成が権限層で拒否)。exact-head CI run 34199292715 (headSha 一致、5/5 success、完了 2026-09-08T07:39:09Z) に依拠。

### 確認結果
- **guard 健全**: `validateClaudeProviderConsumerEnvelope` が project / memory / operation / producer provider / producer session / target provider / target session の 7 軸を比較し、digest と entry id の整合も再計算。同 closure が `claim()` 内で排他 open 前と `beforeCommit` 後の 2 回評価されるため read/claim 片側のみの軸は無い。`decodeClaudeInboxEntry` が `target.scope` を厳密形状に固定し scope 偽装の fall-through も無い。production hook (`src/cli.ts:1261`) は `allowLegacy` を渡さず legacy/v3 は既定 deny。
- **create-exclusive**: `openSync(path,"wx",0o600)`、内容差異の既存 sidecar は `claude_provider_binding_conflict`。entry file 書き出し前に sidecar 永続化。`safeFilePart` + memory prefix 必須で traversal 不可。
- **削除タイミング**: sidecar 削除は claim 成功かつ terminal marker 書き込み後の 1 箇所のみ。deny / claim 失敗は entry と sidecar を保持。
- **oracle**: U-PMEMROOT-007 が 7 軸の変異ごとに denied + reason + entry/sidecar 保持 + claim 不在を検証。`tests/runtime-hook-entrypoints.test.ts` が実 CLI (`memory add --notify-claude` → `hook claude-memory-wake` exit 2) を通す。legacy-deny assertion は `legacy_schema_unbound` へ強化。v3→v4 に移した 2 件は replay / authority-expiry oracle として保存。
- **ledger**: admission seq 170–175 の hash chain と front-matter 一致を確認。`generates` は PLAN-L7-472 と非重複。

### non-blocking (次 slice / revision で対応推奨)
1. deny された entry が保持され次回以降も先頭で選ばれるため head-of-line block になる (Slice 4 migration/quarantine の scope として明示済み、deny は stderr で可視)。
2. `review live-consume` の help 文が "strict v3" のまま (コード経路は v4 対応済み)。
3. live Claude session が無いと `--notify-claude` が失敗する (session binding の必然、運用注意)。
4. sidecar `entryId` と `entry.id` の直接比較は無いが、path 由来 + 全軸比較 + live session 照合でカバー。

merge は著者側で `ut-tdd pr merge --pr 529` により実施可 (本 receipt は head 2c6b2e15 のみに有効、head 変更で失効)。
