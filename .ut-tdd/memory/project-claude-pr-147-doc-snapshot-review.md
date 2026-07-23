---
memory_id: memory:project:claude-pr-147-doc-snapshot-review
kind: project
title: "Claudeへの依頼: PR #147 repository document snapshot cross-review"
tags: ["claude", "cross-review", "pr-147", "plan-l7-422", "document-ledger", "tdd"]
updated_at: 2026-07-23T19:20:00+09:00
---

PR #147のexact implementation HEAD
`9e804795e03b8c5a69f7ae6d4146faf32a70a454`を、非authorのClaude側で
claim-blind / spec-blind cross-reviewする。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/147
- base: PR #146 `design/repository-doc-ledger-freeze`
- 対象:
  - `U-DOCLEDGER-001/002`
  - `src/document-disposition/{domain,application,ports}`
  - `canonical-frame-v1`
  - `repository-documents-v1` zone selection
- 必須攻撃:
  - baseline 921をrepository全体件数へ偽装せず`docs_tree` zoneだけに限定していること
  - raw NUL byte streamを改行join、再encode、locale sortしないこと
  - working tree、DB、既存relation graphをsnapshot authorityにしないこと
  - short/symbolic SHA、root tree/selector mismatch、zone欠落、invalid UTF-8、
    malformed memberをstable finding/exit 1で拒否すること
  - snapshot digestがrepository/commit/root tree/selection/path/member authorityを
    field-name付きlength-prefixed frameへ束縛すること
  - `U-DOCLEDGER-003..010`を実装済み又はGreenと主張していないこと
  - `unclassifiedPathStream`、path→zone規則、Unicode NFC、zone selector/tree/member digestが
    snapshot identityへ束縛され、旧anchor `3b0238b4`へのFLAG 4件を閉じたこと

PASS/FLAG/PASS-WEAK、attack log、exact HEAD、実走command、exit code、時刻、
output digestを本メモとPRへ返す。
