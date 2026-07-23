---
memory_id: memory:project:claude-pr-146-doc-ledger-freeze-review
kind: project
title: "Claudeへの依頼: PR #146 repository document ledger設計freezeレビュー"
tags: ["claude", "cross-review", "pr-146", "vmodel", "document-ledger", "design-freeze"]
updated_at: 2026-07-23T21:38:00+09:00
---

PR #146のexact design HEAD `efc4c786`を、
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
  - baseline/delta/finalが同一receiptで閉じ、add/modify/delete/renameを推測補完しないか確認する。
  - Git rename heuristicをauthorityにせず、明示rename欠落をdelete/add findingへ分けるか確認する。
  - snapshot/member、typed target/PLAN/tag、append-only delta chain、typed reference、
    transactional swap/rollback、legacy隔離のkey/FK/digest契約を攻撃する。
  - catalog `done`、path存在、keyword hit、debt route済みだけでclosure Greenにしないことを確認する。
  - A-187 claim-only、slot不在、semantic pendingを隠さずrouteするか確認する。
  - `U-DOCLEDGER-001..010`、`IT-DOCLEDGER-01..07`、
    `ST-DOCLEDGER-01..05`、`ST-DOCSEM-01..08`のL-pair完全性を確認する。
  - detectorに設計を合わせず、L7-422が本設計から導出される契約になっているか確認する。

Codex側予備証拠はNode/Vitest、readability/design-language、
plan lint、deliverable/implementation trace、`git diff --check` Green。`9bbe88d9`までに
baseline 921件を`docs_tree` zoneへ限定し、root/runtime/skills/github policy zoneと
未分類fail-close、root tree/selector/member byte契約、zone集合digest、`canonical-frame-v1`、
applicability/application status/nullability、modify/rename権威契約をL4/L5/L6/L7へ逆反映した。
さらにdelta reducer、decision exact-once、snapshot/operation/member provenance、
empty-chain/poison/case-fold契約を凍結した。旧 `c6265989` FLAGのB/C/Dと、
`6e3efeab` / `cb081f76` / `1eba2f10` / `2613c561` の追加契約を最新HEADから再攻撃する。
加えてU006 reference readerを、snapshot-bound blob取得→pure reader→endpoint/policy analyzerへ
3段分離した。syntax/path/anchor/URI正規化、reader/frontmatter schema registry、
edge/receipt/finding canonical frame、source×reader exactly-once、property/mutation Redが
検出器都合で縮退していないか攻撃する。
追補HEADではreader draftと完成edge/error/receiptのanti-spoof境界、sealed blob authority、
blocked resultのdiscriminated union、Green graph snapshot identity、syntax registry binding、
loader await中TOCTOU、input/reader getter、closed reason、immutable diagnosticsを設計・テスト対へ
明記した。旧HEADのPASSを流用せず`efc4c786`を再レビューする。
これらはauthor説明として採用せず、Claude側で
exact HEADから再実測・再導出する。

`U-DOCLEDGER-001..010`はtest実体未着地を示す意図的Redである。ID削除やbaseline除外で
Green化せず、設計review後にstacked実装でtest backlinkを先に置き、その後に実装を閉じる。

FLAG/PASS/PASS-WEAK、attack log、exact HEAD、実走command、exit code、時刻、output digestを
本メモとPRへ返す。PASSでもPLAN statusは自動変更せず、review evidenceを正規revisionへ記録する。
