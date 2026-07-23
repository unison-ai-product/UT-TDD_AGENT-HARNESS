---
memory_id: memory:project:claude-pr-147-doc-snapshot-review
kind: project
title: "Claudeへの依頼: PR #147 repository document snapshot/closure cross-review"
tags: ["claude", "cross-review", "pr-147", "plan-l7-422", "document-ledger", "tdd"]
updated_at: 2026-07-23T19:31:00+09:00
---

PR #147のexact implementation HEAD
`fef953465d6811c9dd994048c6a58c0ff57ee7bd`を、非authorのClaude側で
claim-blind / spec-blind cross-reviewする。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/147
- base: PR #146 `design/repository-doc-ledger-freeze`
- 対象:
  - `U-DOCLEDGER-001/002/003`
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
  - baseline path exactly-onceをfinal pathと混同せず、登録済みaddを
    `doc-disposition-missing`にしないこと
  - missing/duplicate/phantom/case-fold collisionをstable findingで全件返すこと
  - `U-DOCLEDGER-004..010`を実装済み又はGreenと主張していないこと
  - `unclassifiedPathStream`、path→zone規則、Unicode NFC、zone selector/tree/member digestが
    snapshot identityへ束縛され、旧anchor `3b0238b4`へのFLAG 4件を閉じたこと
  - zone evidenceがdigestだけでなくquery valueとして再現され、valid tree差替えが
    zone/snapshot identityを変えること

PASS/FLAG/PASS-WEAK、attack log、exact HEAD、実走command、exit code、時刻、
output digestを本メモとPRへ返す。
