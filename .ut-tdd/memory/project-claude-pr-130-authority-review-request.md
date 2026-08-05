---
memory_id: memory:project:claude-pr-130-authority-review-request
kind: project
title: "Claudeへの依頼: PR #130 authority分離後のcross-review"
tags: ["claude", "cross-review", "pr-130", "plan-recovery-16", "redesign"]
updated_at: 2026-07-23T18:35:00+09:00
---

PR #130のexact implementation HEAD
`d30708e133dab4e86c976824fdcb5fb7bc148b1c`を、非authorのClaude側で
claim-blind / spec-blind cross-reviewする。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/130
- branch: `work/redesign-planasset-genesis-adoption`
- current PR HEAD: `d37d428d9bb35a138c68f290b218c1464e3fc796`
  (implementation HEAD後のmemory-only commit)
- 対象:
  - `PLAN-L7-452-forward-escape-contract-red`
  - `PLAN-RECOVERY-16-plan-revision-authoring`
  - source blob authority / reviewed implementation authority分離
  - schema v14、migration certificate、transaction、strict manifest、
    Git ancestry、2-comment durable outbox
- 必須攻撃:
  - source commit `79ffe9b3`のPLAN `status: draft`をlossless rev1 genesisとして扱い、
    review PASSだけで`confirmed`を自己申告しないこと。
  - `reviewedImplementationCommit`がsource commitと別authorityで、実在・exact OID・
    source ancestorをtransaction前にfail-closeすること。
  - certificate / migration row / comment metadataが
    `sourceAuthorityDigest`、`reviewedImplementationAuthorityDigest`、
    `trustedStatus`をcanonical保存・replay照合すること。
  - v13旧rowを推測backfillせずuntrusted隔離すること。
  - stale owner、lease takeover、create intent、POST前後crash、片肺、
    projected drift、exact replayを攻撃すること。
- CI:
  - run `29993948199`
  - Windows Green
  - Linux 2667 passed / 1 failed。唯一のRedは
    `PLAN-RECOVERY-16`の`confirm + review_evidence`未記録
  - aggregateはLinux Redを正しくfail-close

PASS/FLAG/PASS-WEAK、attack log、exact HEAD、実走command、exit code、時刻、
output digestを本メモとPRへ返す。PASS後はrev1 draft genesis→通常revision rev2 confirmedの
順で正規authoringし、旧superseded evidenceは履歴保持する。

**2026-07-23 Claude blind cross-review 完了 (実装 HEAD `d30708e1`、PR HEAD d37d428dはmemory-onlyを確認)**: 総合**PASS** (claim-blind PASS / spec-blind PASS-WEAK)、substanceブロッカーなし・merge推奨。必須攻撃5系統は全REFUTED: (1) successorは`revision===1 && status==="draft"`強制 + `trustedStatus`型literal `"draft"`でconfirmed経路が型レベル不在、source `79ffe9b3`=draftをgit実測; (2) `assertReviewAuthority`がtransaction前にexact OID + `merge-base --is-ancestor`をfail-close (U-PA-REBASE-031でmigrate未呼出を実走確認、79ffe9b3→d30708e1子孫実測YES); (3) 3 digest+trustedStatusのrow/cert/comment正準永続とreplay全一致束縛 (tampered→replay-binding-invalid実走緑); (4) ADD COLUMN DEFAULT無しでbackfillなし、NULL-authority行はquarantine分岐 (非ブロッキング残: 同分岐の直接テスト無し、現行書込では到達不能 — 回帰テスト1本を後続hardening推奨); (5) fencing/takeover世代/chain digest/idempotent projected/command-conflict/partial-stateをU-GEN-040/041・U-PA-REBASE-040/047等で実走緑。計**208 tests green** (Node v24/vitest 2.1.9、独立worktree、log sha256付き再現表4 lane、09:38-09:43 UTC、全exit 0)。CI run 29993948199実測: Linux唯一のRed = doctor merged-plan-status「RECOVERY-16未confirm」= コード欠陥でなく構造的fail-close。**正路: 本PASSをPLAN-RECOVERY-16のreview_evidenceへ記録→confirm→doctor解消→merge** (rev1 draft genesis→rev2 confirmedの正規authoringはCodex側)。live `gh issue view`観測 (issue #102/#143実body照合) はrun時依存で未実測。結果はPR #130コメント (issuecomment-5057054373) に記録済み。
