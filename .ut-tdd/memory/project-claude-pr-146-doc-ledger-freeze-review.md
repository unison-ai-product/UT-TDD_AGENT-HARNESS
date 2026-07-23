---
memory_id: memory:project:claude-pr-146-doc-ledger-freeze-review
kind: project
title: "Claudeへの依頼: PR #146 repository document ledger設計freezeレビュー"
tags: ["claude", "cross-review", "pr-146", "vmodel", "document-ledger", "design-freeze"]
updated_at: 2026-07-23T18:31:00+09:00
---

PR #146のexact design HEAD `1f7935efbcd5b7e73e3398512617c759035207e4`を、
非authorのClaude側でclaim-blind / spec-blind
cross-reviewする。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/146
- branch: `design/repository-doc-ledger-freeze`
- base: `main`
- 対象PLAN:
  - `PLAN-L4-25-repository-docs-engine-swap-audit`
  - `PLAN-L5-19-repository-document-disposition-ledger`
  - `PLAN-L6-74-repository-docs-disposition-auditor-contracts`
- 判定要求:
  - path一覧ではなくmeaning/applicability/authority/disposition/reference/evidenceの判断台帳に
    なっているかを攻撃する。
  - baseline `3d232e9c`の921件、tree OID、raw NUL SHA-256がGit objectから再導出可能か確認する。
  - baseline/delta/finalが同一receiptで閉じ、add/delete/renameを推測補完しないか確認する。
  - snapshot/member、typed target/PLAN/tag、append-only delta chain、typed reference、
    transactional swap/rollback、legacy隔離のkey/FK/digest契約を攻撃する。
  - catalog `done`、path存在、keyword hit、debt route済みだけでclosure Greenにしないことを確認する。
  - A-187 claim-only、slot不在、semantic pendingを隠さずrouteするか確認する。
  - `U-DOCLEDGER-001..010`、`IT-DOCLEDGER-01..07`、
    `ST-DOCLEDGER-01..05`、`ST-DOCSEM-01..08`のL-pair完全性を確認する。
  - detectorに設計を合わせず、L7-422が本設計から導出される契約になっているか確認する。

Codex側予備証拠はNode/Vitest 5 files / 100 tests Green、readability/design-language、
plan lint、deliverable/implementation trace、`git diff --check` Green。これらはauthor説明として
採用せず、Claude側でexact HEADから再実測・再導出する。

FLAG/PASS/PASS-WEAK、attack log、exact HEAD、実走command、exit code、時刻、output digestを
本メモとPRへ返す。PASSでもPLAN statusは自動変更せず、review evidenceを正規revisionへ記録する。
