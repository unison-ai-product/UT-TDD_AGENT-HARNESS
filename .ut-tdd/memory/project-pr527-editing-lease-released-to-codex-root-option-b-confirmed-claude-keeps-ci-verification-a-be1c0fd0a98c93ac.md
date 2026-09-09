---
memory_id: memory:project:pr527-editing-lease-released-to-codex-root-option-b-confirmed-claude-keeps-ci-verification-and-non-author-review-coordination--30e2af06e8f1
kind: project
title: "PR527 editing lease released to Codex root; option B confirmed, Claude keeps CI verification and non-author review coordination"
tags: ["codex-owned", "issue-439", "lease-release", "ledger", "pr-527", "rechain"]
updated_at: 2026-09-08T11:55:29.760Z
---

PR #527 の editing lease を Claude から Codex root へ **明示的に release する** (2026-09-08、
root の handoff 提案 `pr527-author-side-sync-handoff-proposed-root-resolves-projection-claude-verifies` を受諾)。

## release 時点の状態 (Claude 確認)

- worktree `C:/dev/ut-issue439-request-terminal-repair`: tracked working tree clean、HEAD `41ff556d` (旧 head のまま)。
  merge 途中状態は残していない (`git merge --abort` 済)。
- untracked manifest 4 件 (`.ut-tdd/issue439-forward-revision2.json` / `-forward-revision3.json` /
  `-issue-projection.json` / `-reverse-revision2.json`) は作成時のまま保存されている。Claude は編集していない。
- Claude は本 worktree への編集を **今後行わない** (release 後は root の所有)。

## 分担 (選択肢 B に確定)

- **root**: 台帳 (`docs/governance/plan-admission-receipts.json`) の author-side 同期。PR #539 と同じ kernel
  projection rechain 手順を使う。同期先は origin/main `ea7658ca` (tracked ledger 180 records)。
  PR 固有 record は 3 件 (PR 内 seq 147-149、command_id `command:issue439-retraction-current-protocol-revision2` /
  `command:issue439-retraction-reverse-revision2` / `command:issue439-retraction-consistency-revision3`、
  L7-518 rev2 / REVERSE-518 rev2 / L7-518 rev3)。他 3 ファイルは衝突しない。
- **Claude**: 同期 commit 後の exact HEAD で required CI を確認し、非著者 canonical closing review を
  正規経路で手配する。旧 head 41ff556d 系の receipt は流用しない。merge は `ut-tdd pr merge` 経由のみ。

## Claude 側の検証済み参考情報 (root の作業短縮用)

- kernel の canonical 式 `trackedReceiptRecordDigest` (`src/kernel/github-closure-receipt.ts:158-176`) は
  origin/main の 180 records の `record_digest` を全件 exact 再現する (mismatch 0、chain 断裂 0)。
  したがって rechain は決定的再計算であり手書き mint ではないことを機械的に示せる。
- #539 の先例を実測で確認済み: PR head e72dcc8a の seq 170-172 が main では seq 176-178 へ移り、
  `command_id` / `receipt_id` / `receipt_digest` / `decision_digest` / `binding` は byte 同一のまま、
  `sequence` / `previous_record_digest` / `record_digest` のみ再計算されていた。同じ変換で足りる。
- 同期後の検証推奨: `plan admission-check --base origin/main --head <new HEAD>`、両 PLAN lint、
  doc-lane doctor、その後 required CI。
