---
memory_id: memory:project:issue541-audit-upgraded-to-exhaustive-all-7-harness-ledger-db-read-only-checked-zero-l6-93-aliases-and-zero-seal-certificates-wording-corrected-in-541-and-542--c390a9ed1829
kind: project
title: "Issue541 audit upgraded to exhaustive: all 7 harness-ledger.db read-only checked, zero L6-93 aliases and zero seal certificates; wording corrected in 541 and 542"
tags: ["audit", "claude-decision", "issue-541", "issue-542", "ledger", "sealed-lineage"]
updated_at: 2026-09-08T11:29:06.636Z
---

Codex root の精度訂正依頼 (memory feedback:issue541-evidence-precision-only-inspected-ledgers-not-all-worktrees)
への対応 (Claude、2026-09-08)。訂正を受け入れ、さらに未開封だった 2 件を Claude が読んで全数監査に格上げした。

## 実施

`C:/dev` と `<user-home>` 配下 (深さ 5) の `harness-ledger.db` を検索して 7 件を検出し、**全件を read-only で開いた**。

- L6-93 alias を `plan_aliases` に持つ ledger: **0 件**
- `plan_lineage_migration_certificates` の row: **合計 0 件** (先例 seal の実入力はどの ledger にも残っていない)
- 内訳: primary (`UT-TDD-agent-harness`)、`ut-issue420-runtime-adapter-contract` (稼働中、read-only で開封)、
  `ut-issue432-project-identity-bootstrap-impl`、`ut-issue439-request-terminal-repair`、
  `ut-issue487-bun-final-retirement-contract`、`ut-issue487-bun-final-retirement-impl`、
  `ut-issue528-project-memory-envelope`
- `.claude/worktrees/l6-91-disposition-claim-integrity` の ledger も開封し、alias 1 件のみで L6-93 は無し。
- 書き込みは一切していない。稼働中 worktree の tracked file にも触っていない。

## Issue 本文の修正

#541 と #542 の該当行を書き換えた。「他 worktree の ledger にも無い」という広い主張を root 監査に帰責する形を止め、
root の先行監査は 4 件対象 (稼働中 consumer adapter ledger と旧 L6-91 ledger は未開封) と明記した上で、
全数主張は Claude の再監査に基づくものとして根拠と内訳を書いた。

## 結論への影響

recovery contract gap の独立成立は変わらない。加えて、先例 seal の 3 digest 実入力が
**どのローカル ledger にも存在しない**ことが全数で確定したため、「先例からの preimage 逆算は不可能」は
推定ではなく実測になった。#542 の契約新規 freeze という結論はより強くなった。

## 現状の役割

Claude: #542 (契約 freeze、L5 internal-processing seal 節へ docs-only PR → cross-review) → #541 (seal 実行)。
root: #540 の contract draft / test mapping と consumer / Memory の Forward 実装。
#527 の main 同期は台帳書き込みが権限層で拒否され PO 判断待ち (A: 許可、B: 著者側で台帳解決、C: parked)。
