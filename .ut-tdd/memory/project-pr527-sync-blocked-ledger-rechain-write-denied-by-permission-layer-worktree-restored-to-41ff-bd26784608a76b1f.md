---
memory_id: memory:project:pr527-sync-blocked-ledger-rechain-write-denied-by-permission-layer-worktree-restored-to-41ff556d-method-verified-options-a-b-c-for-po--0e7eb09ed39f
kind: project
title: "PR527 sync blocked: ledger rechain write denied by permission layer; worktree restored to 41ff556d, method verified, options A/B/C for PO"
tags: ["blocked", "issue-439", "ledger", "po-decision", "pr-527", "rebase-owner", "rechain"]
updated_at: 2026-09-08T11:19:01.849Z
---

PR #527 current-main 同期の進捗と blocker (Claude、2026-09-08)。ownership 予約は
`pr527-current-main-sync-ownership-reserved-by-claude-...` のとおり継続。worktree は **旧 HEAD のまま復旧済み**
(merge --abort、41ff556d、tracked working tree clean、Codex の untracked manifest 4 件は不変)。

## 完了した部分

- 旧 HEAD `41ff556d339cdcb56c47a375365ee2fcdd640d94`、同期先 origin/main `ea7658ca0e0b2734bf08263718ced109f788cd48` (tracked ledger 180 records) を記録。
- 衝突範囲を確定: `docs/governance/plan-admission-receipts.json` のみ。他 3 ファイルは衝突なし
  (`git merge --no-commit --no-ff origin/main` で実測、その後 abort)。
- PR #527 固有の ledger record を 3 件に特定 (PR 内 seq 147-149、command_id
  `command:issue439-retraction-current-protocol-revision2` / `...-reverse-revision2` / `...-consistency-revision3`、
  L7-518 rev2 / REVERSE-518 rev2 / L7-518 rev3)。
- 解決方式を #539 の先例と実測で一致させた: PR head e72dcc8a の seq 170-172 が main では 176-178 へ移り、
  `command_id` / `receipt_id` / `receipt_digest` / `decision_digest` / `binding` は byte 同一、
  `sequence` / `previous_record_digest` / `record_digest` のみ再計算されていた。
- kernel の canonical 式 (`trackedReceiptRecordDigest`、`src/kernel/github-closure-receipt.ts:158-176`) が
  origin/main の 180 records の `record_digest` を全件 exact 再現することを確認 (mismatch 0、chain 断裂 0)。
  したがって rechain は決定的な再計算であり、手書き mint ではないことが機械的に示せる。
- rechain スクリプトを用意済み (main 180 records を順序ごと byte 保存 → PR 固有 3 records を再 anchor して append →
  全件 digest 再検証 + chain 検証で fail-fast)。

## blocker: 実行が権限層で拒否された

台帳ファイルへ書き込む段階で Claude Code の auto-mode classifier が拒否した (2 回、`node <script>` 形式)。
台帳は governance 配下の受理台帳であり、書き込みを伴う操作は現在の権限設定では通らない。
PO の明示許可が必要なため、ここで停止して報告する。中途状態は残していない。

## 選択肢 (PO 判断待ち)

A. PO が Claude に当該書き込みを許可し、Claude が rechain → merge commit → push → CI → Codex 非著者 receipt まで完走する。
B. 著者側 (Codex root) が #539 と同じ手順で台帳 conflict を解決し、Claude は新 HEAD での CI 確認と
   非著者 review の手配のみを担当する (ownership の分割)。
C. #527 を一旦 parked にし、release lane (#420 / #424) を優先する。

推奨は B。台帳 append は著者 family の authoring 操作であり、#539 で実績がある。Claude は verification と
review 手配で価値を出せる。A も内容的には安全 (再計算の全件自己検証つき) だが、権限解除が必要。

## 未変更の確約

`ut-tdd pr merge` 以外の merge 経路は使わない。旧 head 41ff556d 系 receipt は流用しない。
#517 / #537 / #538 は parked のまま再 rebase しない。consumer (#420) / Memory (#424) の worktree には触っていない。
