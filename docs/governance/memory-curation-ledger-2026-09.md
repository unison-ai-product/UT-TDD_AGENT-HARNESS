# legacy memory corpus 採否台帳 2026-09 (Issue #424 PR-2)

legacy memory corpus (PLAN-L6-104 §3.1 判断 6 / 7) の採否台帳。自動分類は候補提示にだけ使い、採用は 6 基準を全て満たす entry に限る。
採用 entry は `ut-tdd memory add` で 1 件ずつ canonical root へ登録し、その registration receipt の digest を行に束縛する。
untracked source は内容 digest と opaque な local-archive custody id だけを記録し、path・title・本文は書かない。

- スキーマ: `ut-tdd.memory-curation-ledger/v1`
- 基準 commit (PR-2 base): `3a516df69cff073ebddbf90f4ee2b939c451ba82`
- 著者 (author family): `claude-sonnet-5` (claude)
- 非著者 reviewer: `gpt-5.6-sol` (codex family、frontier tier)、対象 exact head `66ff1ac1e7b2ca18e0dc6def0a3b0dae69d78653`、verdict PASS、receipt `rv1-e1ae6a6cb92a0f117a3bed324c0555042ec3d6840bde8592b1cc945726cbf0fc`
- 行数: 1032 件 (tracked 607 / untracked 425)、採用 (adopt) 46 件、不採用 (reject) 986 件、統合元 (merged_from) 5 件

## 6 基準

1. reusable — 再利用可能である
2. evidenced — 現行の canonical doc / code / incident evidence に裏付けがある
3. actionable — 具体的な action / decision rule である
4. episode_independent — PR 番号・exact head・review request・verdict・handoff・進捗から独立している
5. no_secret_pii — secret / PII / 個人環境を含まない
6. deduplicated — 同義語を統合済みで、他の entry と矛盾しない

機械照合は `tests/memory-curation-ledger.test.ts` (U-MEMCUT-024〜028) が `MANIFEST.json` と canonical root に対して行う。

## 台帳本体 (機械照合用 JSON)

```json ut-tdd-memory-curation-ledger
{
 "schema_version": "ut-tdd.memory-curation-ledger/v1",
 "base_commit": "3a516df69cff073ebddbf90f4ee2b939c451ba82",
 "author": {
  "model": "claude-sonnet-5",
  "family": "claude"
 },
 "reviewer": {
  "model": "gpt-5.6-sol",
  "family": "codex",
  "exact_head": "66ff1ac1e7b2ca18e0dc6def0a3b0dae69d78653",
  "verdict": "PASS",
  "receipt": "rv1-e1ae6a6cb92a0f117a3bed324c0555042ec3d6840bde8592b1cc945726cbf0fc"
 },
 "rows": [
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-advisor-fable-rate-limit-codex-frontier-fallback-po.md",
   "source_digest": "776bc10fe758816dfdac075adda45a38b78a67d77e7505910dc7caac1a4a0120",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/team/advisor-policy.ts (fableRoute)",
    "src/team/model-policy.ts (MODEL_IDS)",
    "src/runtime/agent-guard.ts (normalizeModelFamily)"
   ],
   "reason": "advisor design相談のFable rate-limit失敗時にCodex frontierへ自動fallbackする設計はPO確認済みで、現行advisor-policy.ts/model-policy.tsの構造と整合する恒久ルール。",
   "adopt": {
    "memory_id": "memory:feedback:advisor-design-fable-codex-frontier-fallback--82fc24ae76f9",
    "kind": "feedback",
    "title": "advisor design相談でFableがレート上限で失敗したらCodex frontierへの自動fallbackが正しい挙動",
    "tags": [
     "advisor",
     "fallback",
     "model-routing"
    ],
    "registration": {
     "operation_id": "curation-424:776bc10fe758816d",
     "memory_id": "memory:feedback:advisor-design-fable-codex-frontier-fallback--82fc24ae76f9",
     "source_path": ".ut-tdd/memory/feedback-advisor-design-fable-codex-frontier-fallback--82fc24ae76f9.md",
     "content_digest": "cb102ae05a240d9bb6c4be82db8bc02f7f7230ced24c2fafabfc65696d481a86",
     "exit_code": 0
    },
    "receipt_digest": "617c017d7d45097f135941b0b282652d4227d1f47f6f0c750f55ff74f19f5a96"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-artifact-must-be-frozen-before-closing-review.md",
   "source_digest": "4e444433962a9dd84dedae6d17bcf14baaef87008f591628223b51398466d34f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-artifact-must-be-frozen-before-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-bun-final-retirement-inventory-must-include-shipped-skill-instructions.md",
   "source_digest": "57ed8135141ef8e3603f0238655df707ce23782d133cff371a6ce818ec53c801",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-bun-final-retirement-inventory-must-include-shipped-skill-instructions.md",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-checked-zip-a-187-catalog-claim-only.md",
   "source_digest": "1e2257fadb570aa5eef3d0edee0bf8ef7de391d43a1183fbd43c9e0be835f1f0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-checked-zip-a-187-catalog-claim-only.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-ci-github-event-path-ambient-temp-repo-fixture-pr-event.md",
   "source_digest": "bc3103ffa7c4771a837528d0c2ccd55893ad1a195d413cb5033c4d551d4ff034",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-ci-github-event-path-ambient-temp-repo-fixture-pr-event.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-action-pr340-ready-merge.md",
   "source_digest": "bfc25b19b4347b4ab3fa10b95f214cb46f37587295bf0cf2bd5fd339851c6683",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-action-pr340-ready-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-codex-pr-315-review-d3a-root-commit-claude-merge.md",
   "source_digest": "4db4968658dcde7615c7b5ca6a594c61b144e05786a6edf01617f19edf5493d5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-codex-pr-315-review-d3a-root-commit-claude-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-opus-admission-audit-issue108-l-layer-verification-contract-exact-main-2f3f15af.md",
   "source_digest": "847a723838c440e7c0ecf5c2ba3f5bc13bfcf9dfa0faa08ab3d0741f4dc37775",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-opus-admission-audit-issue108-l-layer-verification-contract-exact-main-2f3f15af.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-opus-pre-gate-plan-l7-419-forward-fsm-exact-main-2f3f15af.md",
   "source_digest": "b06bc681e0b9d76614e1976d99b42454f5790b63ba99277ea7b6b84cd23e6dad",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-opus-pre-gate-plan-l7-419-forward-fsm-exact-main-2f3f15af.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-opus-release-endpoint-audit-pack-7e11ec15-vs-source-2f3f15af.md",
   "source_digest": "63513055e92ee204f78204313b227996c051e11fe3bdefebb6e8c13a628495f2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-opus-release-endpoint-audit-pack-7e11ec15-vs-source-2f3f15af.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-p0-task-harness-memory-delivery-and-workspace-parity.md",
   "source_digest": "4d6dce79fae4f343463142bc5a2caeb1f83b3e040d03252afd178707c9a9ab91",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-p0-task-harness-memory-delivery-and-workspace-parity.md",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-p0-task-runtime-db-runaway-and-snapshot-fixed-cost-containment.md",
   "source_digest": "47ef1620291cb28023e0be0235929211841af83ed83604c77bccab93b0cd002b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-p0-task-runtime-db-runaway-and-snapshot-fixed-cost-containment.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-pr-closing-overdue-pr315-pr316-converge-now.md",
   "source_digest": "156135a310b0f3ba54b1d24daa51801cf84f070cb950e1997851eda4932a40d4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-pr-closing-overdue-pr315-pr316-converge-now.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-pr-pr-315-closing-review-pr-d3a-codex.md",
   "source_digest": "2616c5132a3e0c81a3ce25a1d44d30ab5006922fc5a9a1dd8ad85b6ca3ac1278",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-pr-pr-315-closing-review-pr-d3a-codex.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-pr-queue-352-355-356-awaiting-codex-review.md",
   "source_digest": "17f592497e3fb75c7a46a3be8879856ddae6fa3e6aecaf1176c44dd70392d3de",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-pr-queue-352-355-356-awaiting-codex-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-queue-update-shared-harness-memory-split-across-worktrees.md",
   "source_digest": "e54a33fe85e4ba2cdd3b9c3c0cb6239abeb434c31764351bc0c1907095889701",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-queue-update-shared-harness-memory-split-across-worktrees.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-reviewer-output-stalled-terminate-and-rederive-closing-verdict.md",
   "source_digest": "60cf4d5d270cea80ec7322644557bb5e8b0647a72e4caa65e93ec6948bb225d2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-reviewer-output-stalled-terminate-and-rederive-closing-verdict.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-claude-task-u-1-token-run-projection-aggregation-for-issue-178.md",
   "source_digest": "b8519137f32b9fc89838f2753774672a33d9e2b24f95564d016b47e9708f7098",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-claude-task-u-1-token-run-projection-aggregation-for-issue-178.md",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-codex-envelopes-carry-mistyped-full-shas-beyond-the-first-8-hex-digits-resolve-exact-heads-036c71d369d2b6b6.md",
   "source_digest": "92295ba72028f3465a9ae76196314ef194f3d0677e5edd57728cfd7fed379523",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "gh pr view --json headRefOid (実HEAD解決の標準手段)"
   ],
   "reason": "Codex由来のreview envelopeが報告するSHAの先頭8桁しか信頼できない事例が複数回観測されており、実HEAD解決を義務化する技術的に検証可能なルール。",
   "adopt": {
    "memory_id": "memory:feedback:codex-review-envelope-sha-8-head--626c0368e1d9",
    "kind": "feedback",
    "title": "Codexが報告するreview envelopeのSHAは先頭8桁しか正しくない場合がある: 実HEADで再解決してから束縛する",
    "tags": [
     "codex-integration",
     "exact-head",
     "review-envelope"
    ],
    "registration": {
     "operation_id": "curation-424:92295ba72028f346",
     "memory_id": "memory:feedback:codex-review-envelope-sha-8-head--626c0368e1d9",
     "source_path": ".ut-tdd/memory/feedback-codex-review-envelope-sha-8-head--626c0368e1d9.md",
     "content_digest": "9ae6a7e4142d1e1726038346998a17413281a555bc90f2b7ddd7e1527e39d9b1",
     "exit_code": 0
    },
    "receipt_digest": "c96f4db7ca7d660d7ab16c9eb45be7d9fd4fedfc0a82de48412fa67dc3ba33e1"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-codex-ut-tdd-claude.md",
   "source_digest": "7813be8477e61b1065f77170bfffcdeededaa907c90860542d1f4a98b2ffac26",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-codex-ut-tdd-claude.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-confirm-pr-evidence-gate-check-before-push.md",
   "source_digest": "66a54a4cec59016cfa41daf46239002eb0ea6629ef5f4b5f4f3badd66ac78da2",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/lint/review-evidence.ts (KIND_REVIEW_REQUIRED, STATUS_REVIEW_REQUIRED, analyzeReviewEvidence)"
   ],
   "reason": "kind=design/add-design/impl/add-impl かつ status=confirmed/completedへ遷移した瞬間にreview evidence gateが有効化される実装事実に基づく、push前の自己検算ルール。",
   "adopt": {
    "memory_id": "memory:feedback:plan-status-confirmed-push-analyzereviewevidence--93489d948d0a",
    "kind": "feedback",
    "title": "PLANをstatus:confirmedへ遷移するpushの前にanalyzeReviewEvidenceを直接検算する",
    "tags": [
     "ci-red-prevention",
     "plan-lint",
     "review-evidence"
    ],
    "registration": {
     "operation_id": "curation-424:66a54a4cec59016c",
     "memory_id": "memory:feedback:plan-status-confirmed-push-analyzereviewevidence--93489d948d0a",
     "source_path": ".ut-tdd/memory/feedback-plan-status-confirmed-push-analyzereviewevidence--93489d948d0a.md",
     "content_digest": "1d39e69d41d252f07cdcc0d99835752a5ff61a6b3f81edc7f6376a823284aa0f",
     "exit_code": 0
    },
    "receipt_digest": "80c980c52c08b658ea7797b290cc7eacb4249f32eee8474658c85ac225ffb60d"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-consult-ut-tdd-advisor-before-deciding-design-tradeoffs-not-consulting-is-not-the-same-as-not-escalating-to-po.md",
   "source_digest": "9aeab7cd000f95e0007254a8186a43e56225b912c96c0098a020d271fbf57a66",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-consult-ut-tdd-advisor-before-deciding-design-tradeoffs-not-consulting-is-not-the-same-as-not-escalating-to-po.md",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-correction-draft-pair-freeze-plan-stays-draft-by-rule.md",
   "source_digest": "d3982c70ab2f3f4e67a94da0fdf3214dcb345cfbf2e0ab208d74bf12e8d6e316",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §PLAN Filing Rules (draft PLANのgenerates規約)"
   ],
   "reason": "「兄弟PLANの扱いが非対称だから片方が誤り」という判定は規約本文で確認してから行うべきという、レビュー方法論として再利用可能な教訓。draft pair-freezeがreview_evidence空のまま正常であることも規約と一致。",
   "adopt": {
    "memory_id": "memory:feedback:plan--81abf9753343",
    "kind": "feedback",
    "title": "兄弟PLANの扱いの非対称を見つけたら、規約本文で正誤を確認してから指摘する(直近の実例を基準にしない)",
    "tags": [
     "draft-plan",
     "plan-filing",
     "review-methodology"
    ],
    "registration": {
     "operation_id": "curation-424:d3982c70ab2f3f4e",
     "memory_id": "memory:feedback:plan--81abf9753343",
     "source_path": ".ut-tdd/memory/feedback-plan--81abf9753343.md",
     "content_digest": "b1be923841d09a3dada5131a5aa90053e0cd879fbd8810df6f6d8d3cfd0639a3",
     "exit_code": 0
    },
    "receipt_digest": "6a1437508697f141e8068f486999c1dddca416d21e3dba8365f109569e2d0ff6"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-correction-pr-339-closing-review-cited-a-cancelled-run-of-an-older-head-canonical-ci-for-d6-5a4fe0f8c66a4e44.md",
   "source_digest": "6df62718f0593999ee1fc853cbbc710129c78afbd1d318f5588dda8c244c0100",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-correction-pr-339-closing-review-cited-a-cancelled-run-of-an-older-head-canonical-ci-for-d6-5a4fe0f8c66a4e44.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-correction-pr-341-exact-head-e549cd98b46b-claude-review.md",
   "source_digest": "a9ff62a9a2715abfb7772ab2c9f809aab5cfc371a359d5741b1669f495a19da7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-correction-pr-341-exact-head-e549cd98b46b-claude-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-d-pr-302-merged-d2-d-implementation-entry-unlocked-claude-owner.md",
   "source_digest": "a28226daa718039eac0a49a824ba2b896e0081674bea9aa7f209fd724de51b28",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-d-pr-302-merged-d2-d-implementation-entry-unlocked-claude-owner.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-d2-live-review-canonical-writer-claude-d3a-d2-315-review.md",
   "source_digest": "303d06925ea4501ba76d3655b8d2bb8c5e94ce16fb361644bec41534f0553a37",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-d2-live-review-canonical-writer-claude-d3a-d2-315-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-d2-review-dispatch-wrapper-deny-merge-bypass.md",
   "source_digest": "b57429df62e1921b45b75aa7b953551211e2e1e63d91a802791f8cf46d0ee283",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-d2-review-dispatch-wrapper-deny-merge-bypass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-delegating-doc-rescope-say-revise-not-remove-and-check-worktree-head-for-a-live-peer-session--f23580b14132.md",
   "source_digest": "dbc03284d88d1219fc602811f1580dd71faa295f88aecb9d1a38d5adcc0cc2f2",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "委譲時の指示の曖昧さとworktree HEAD確認漏れという2つの独立した再発可能な失敗様式を扱う、具体的な委譲時チェックリスト。",
   "adopt": {
    "memory_id": "memory:feedback:worker-worktree-head--f4b90d1f61d8",
    "kind": "feedback",
    "title": "ドキュメント範囲縮小をworkerへ委譲するときは「削除」ではなく対象節を名指しして「改訂」と指示し、共有worktreeのHEAD分岐を書き込み前に確認する",
    "tags": [
     "delegation",
     "shared-state",
     "worktree"
    ],
    "registration": {
     "operation_id": "curation-424:dbc03284d88d1219",
     "memory_id": "memory:feedback:worker-worktree-head--f4b90d1f61d8",
     "source_path": ".ut-tdd/memory/feedback-worker-worktree-head--f4b90d1f61d8.md",
     "content_digest": "60b076e105a4e1e0afaaface9ec41f9033a094848c2435f5bf27f4390f4d325e",
     "exit_code": 0
    },
    "receipt_digest": "97f5a9ebc13278846458eeb25b9a691dc26b52e7b116b7c5678396b29d3c0998"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-delegation-tests-must-stub-provider-bin-or-they-only-pass-on-machines-with-codex-claude-installed.md",
   "source_digest": "ae446eff487881c39213c176cac053f0a82ce5ad944d9ee5d81f6d4dff33b28a",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/runtime/adapter.ts (isProviderCommandSpawnable, spawnSync)",
    "src/cli/delegation.ts (plan.available)",
    "tests/cli-surface.test.ts (writeFakeProvider, UT_TDD_CODEX_BIN)"
   ],
   "reason": "実装(adapter.ts/delegation.ts)とテスト作法(cli-surface.test.ts)の両方に根拠があり、CI環境依存の偽陽性という再現性のある失敗様式に対する具体的な対処法。",
   "adopt": {
    "memory_id": "memory:feedback:codex-claude-delegation-provider-bin-green--7475b8f0ec37",
    "kind": "feedback",
    "title": "codex/claude delegationを経由するテストはprovider binをスタブしないと開発機でだけgreenになる",
    "tags": [
     "ci-flakiness",
     "delegation",
     "testing"
    ],
    "registration": {
     "operation_id": "curation-424:ae446eff487881c3",
     "memory_id": "memory:feedback:codex-claude-delegation-provider-bin-green--7475b8f0ec37",
     "source_path": ".ut-tdd/memory/feedback-codex-claude-delegation-provider-bin-green--7475b8f0ec37.md",
     "content_digest": "19f0e8ddf5db3b7b5b00bc74eef8f714e96e2b352d187fe750ed495f75b24925",
     "exit_code": 0
    },
    "receipt_digest": "50bfe735af96c24cb2f9daf42dee0c14a198968174770cdb0e8800815b977429"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-design-cross-check-done-plan-l6-50-58-clean-2-fixes-applied.md",
   "source_digest": "8ea47d4714ec02e98c811043007e3baafbfd6fe3bd562994c3d8ee1b4be3fea7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-design-cross-check-done-plan-l6-50-58-clean-2-fixes-applied.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-do-not-commit-exact-head-review-request-memories-into-a-memory-delivery-pr-they-are-episodi-8fe79fe9e61ca24d.md",
   "source_digest": "1381ed7e302ccaa37d3119552a58c7661b477f43df3310a52dc3fa02bd05988e",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    ".ut-tdd/review/requests/*.json (canonical review request projection)"
   ],
   "reason": "メモリ配送PRの検収は追加ファイルを1件ずつ精査するため、review requestのような進行中状態を記録したmemoryが混入すると必ずblockingになる、という配送プロセス固有の再利用可能なルール。",
   "adopt": {
    "memory_id": "memory:feedback:pr-exact-head-review-request-blocking--2f790520308c",
    "kind": "feedback",
    "title": "耐久メモリ配送PRにexact-head review-requestメモリを含めない: エピソード状態としてblockingになる",
    "tags": [
     "memory-delivery",
     "pr-scope",
     "review-request"
    ],
    "registration": {
     "operation_id": "curation-424:1381ed7e302ccaa3",
     "memory_id": "memory:feedback:pr-exact-head-review-request-blocking--2f790520308c",
     "source_path": ".ut-tdd/memory/feedback-pr-exact-head-review-request-blocking--2f790520308c.md",
     "content_digest": "0d8eef4c7be82fc2438d7c67cf28a634b54f4e24496a058cea4a5873c3f65bbc",
     "exit_code": 0
    },
    "receipt_digest": "0753b04f66e993f22178e153ae32dcb26bc0744217361783658d34560527813a"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-do-not-gate-on-self-declared-editable-values.md",
   "source_digest": "ae73804078e4b369ba3f2d4aec7e74ea30874ef3f30623aa2fa7bd910c67f612",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/lint/review-evidence.ts (ReviewEvidenceOptions による観測面注入)"
   ],
   "reason": "自己申告値でのgate設計・形式検査のみでの実在検査の代替・新規checkの挿入順という3つの独立した、繰り返し発生しうるgate設計上の落とし穴。",
   "adopt": {
    "memory_id": "memory:feedback:gate-check-reason--2dca6c3c3361",
    "kind": "feedback",
    "title": "gate設計の教訓: 自己申告値で適用範囲を決めない、形式検査は実在検査の代わりにならない、新規checkは既存reasonの後ろに置く",
    "tags": [
     "gate-design",
     "lint",
     "review-evidence"
    ],
    "registration": {
     "operation_id": "curation-424:ae73804078e4b369",
     "memory_id": "memory:feedback:gate-check-reason--2dca6c3c3361",
     "source_path": ".ut-tdd/memory/feedback-gate-check-reason--2dca6c3c3361.md",
     "content_digest": "baedf77550ea9a81dcda060acefe330cd95e27a62608371c4dc2960b614d4b93",
     "exit_code": 0
    },
    "receipt_digest": "3958697fb220909602a6fd64190bc3ab772d846d84b8ced8cebc05e5ad821fdf"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-errata-on-merged-l6-release-channel-manifest-section-4-it-names-buildcleandistributionplan-c9fff25e16963a22.md",
   "source_digest": "5e2b2e0151a3411c20c1ce5355147a2bbfd960a6d75a9f2e1bbdf76f1079cbb8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-errata-on-merged-l6-release-channel-manifest-section-4-it-names-buildcleandistributionplan-c9fff25e16963a22.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-escalate-to-po-only-when-the-goal-changes-not-when-an-advisor-says-so.md",
   "source_digest": "cc0a65490765b73f7789fb456018bdbcab0125a04183e9feb01a0532addd96cf",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-escalate-to-po-only-when-the-goal-changes-not-when-an-advisor-says-so.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-feedback-pr-335-exact-head-4d0b52d6-implementation-review.md",
   "source_digest": "f9f414b99aac8fdc97b46b01d9dbcb5f4c7700a7a740c3be9fec4c204fc403cd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-feedback-pr-335-exact-head-4d0b52d6-implementation-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-feedback-pr-336-exact-head-5f04b58d-closing-review.md",
   "source_digest": "804b9faa44f898f0742f51a0913f3f67af2db096e1de8547c7f6d98bac3e7f87",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-feedback-pr-336-exact-head-5f04b58d-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-feedback-pr-337-exact-head-5ba4d2df-closure-review.md",
   "source_digest": "955674226b9720e576f7c17b2a73267a760c336e25f0d1e030c114056784730a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-feedback-pr-337-exact-head-5ba4d2df-closure-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-filesystem-lock-ownership-read-then-rename-is-not-cas.md",
   "source_digest": "705bcb80e5dca18ba35e924d6948ba03cf01e0358172b0d0e3382d6c2ec13db5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-filesystem-lock-ownership-read-then-rename-is-not-cas.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-final-role-split-claude-pr-handling-codex-all-non-pr-authoring.md",
   "source_digest": "20b8c21b2f02ec7515c97a0f4ad4eeb62dcac707b6bbe29e0486a7e28c5e6b64",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-final-role-split-claude-pr-handling-codex-all-non-pr-authoring.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-3rd-round-pr-349-exact-head-14e1ec18-src-untouched-across-all-remediations-coding-rule-a7264fae15572943.md",
   "source_digest": "6cf861b0ad2898911efcb069dfbb6adecb76feeb5e01b5f3456835b4547138e1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-3rd-round-pr-349-exact-head-14e1ec18-src-untouched-across-all-remediations-coding-rule-a7264fae15572943.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-4th-round-pr-349-exact-head-9a086edd-coding-rules-7-unchanged-since-first-flag-switche-ab5b234941c3eda1.md",
   "source_digest": "0f673dbf3fb60a68171383cb6e0ee4094f0edce631fa821658e49d910847399b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-4th-round-pr-349-exact-head-9a086edd-coding-rules-7-unchanged-since-first-flag-switche-ab5b234941c3eda1.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-5th-round-pr-349-exact-head-4de12a1c-b-1-b-4-b-5-resolved-new-blocking-green-command-d-d31cdf51d6124a4d.md",
   "source_digest": "e3efbba16e9c6b3548e3685d45156b8ee8fc59519ac54fbdd34b4ac7bf183344",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-5th-round-pr-349-exact-head-4de12a1c-b-1-b-4-b-5-resolved-new-blocking-green-command-d-d31cdf51d6124a4d.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-6th-round-pr-349-exact-head-3b6d36a8-b-6-f-1-resolved-new-blocking-b-7-secret-scan-fal-56333574d610520d.md",
   "source_digest": "0b197c4618fb254eb8fcef3c98e18e5aab86c6eb463f2928420898806aa712cd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-6th-round-pr-349-exact-head-3b6d36a8-b-6-f-1-resolved-new-blocking-b-7-secret-scan-fal-56333574d610520d.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-delta-pr-349-exact-head-029e8fb7-b-1-untouched-src-diff-0-b-4-false-claim-persists-b-5-2c015b3adeb07b5c.md",
   "source_digest": "dfcac747c3579fa183764f8099328f40fdccf6be4c1897d57008d9c9448fce44",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-delta-pr-349-exact-head-029e8fb7-b-1-untouched-src-diff-0-b-4-false-claim-persists-b-5-2c015b3adeb07b5c.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-pr-349-exact-head-31c69e77-forward-fsm-implementation-ci-3-3-failure-blocking-4-coding-2231e0c08cac9a00.md",
   "source_digest": "a5eb5a1f2eea1a79682bd8f81031d5bd290f554d3678a02030e4fd562bedf9e6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-pr-349-exact-head-31c69e77-forward-fsm-implementation-ci-3-3-failure-blocking-4-coding-2231e0c08cac9a00.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-pr-354-exact-head-bdd66595-pf4-acceptance.md",
   "source_digest": "9e5a7b489abb832ca8a5231a8170b720c4fe7be767127fc24116ccb90fb8da8e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-pr-354-exact-head-bdd66595-pf4-acceptance.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-pr-358-exact-head-bb857f14-l6-freeze.md",
   "source_digest": "5e828e594364623dcf98e0dfca08a45a329f783a4fcfbdaa1fb7a7a45db59651",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-pr-358-exact-head-bb857f14-l6-freeze.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-pr-359-exact-head-db00ca0e-master-r4.md",
   "source_digest": "bba74086e3419feda14d0057eb51c3b662672f7f91e7b29c302c10039b6045dc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-pr-359-exact-head-db00ca0e-master-r4.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-pr-365-delta-07b74397-adapter-field-mapping.md",
   "source_digest": "8c89c0f56cf391da500f6730f7c97ac3bf4b76fa13f7764c25538f12bbe44dab",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-pr-365-delta-07b74397-adapter-field-mapping.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-pr-365-exact-head-563825f4-s3-freeze.md",
   "source_digest": "f08974a0dcdb0667727e7b517cb8b9aa0e40f127be07413d8f6b8f068770ef91",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-pr-365-exact-head-563825f4-s3-freeze.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-flag-pr-368-exact-head-ae48ac3d-s3-implementation.md",
   "source_digest": "41bffc8ffad9aee1e6e06171b98f584a840cdcd86d6c3ef924296916a24d725a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-flag-pr-368-exact-head-ae48ac3d-s3-implementation.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-forward-inventory-exact-current-pr349-review-pending-pr350-flag-next-255-path-lease.md",
   "source_digest": "188074789a3e6b0bd1f46d3468005aa1988868df5cfca23dd680054ab781d1a3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-forward-inventory-exact-current-pr349-review-pending-pr350-flag-next-255-path-lease.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-forward-inventory-exact-main-2f3f15af-after-pr341-merge-no-open-implementation-lane.md",
   "source_digest": "575bc791d1dc0fa60b63dbfcf551c6979ad47fd30aaf41fea7366196027aadc0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-forward-inventory-exact-main-2f3f15af-after-pr341-merge-no-open-implementation-lane.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-forward-lane-inventory-pr341-ci.md",
   "source_digest": "afe3437eb7e56ea463494133c5ba2ebdc9211968fef7b6d7d76c1018941d92f6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-forward-lane-inventory-pr341-ci.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-forward-snapshot-fence-claude-root.md",
   "source_digest": "6aa24c9d65c49ba6588d9e67d6c6d2484754b1728a8e3ee23dc3b4c4d9fa39ff",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-forward-snapshot-fence-claude-root.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-forward-wait-pr315-pr316-exact-head-ci-and-claude-review.md",
   "source_digest": "a74e8e5e25b91386e398e91cbd570bb44f37160253321ee7feff3217d25158c0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-forward-wait-pr315-pr316-exact-head-ci-and-claude-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-git-revert-default-subject-fails-the-conventional-commit-guard-use-git-revert-no-commit-and-b1f9190b6f70ec9e.md",
   "source_digest": "c68deec3a04e49028e7e5367fe75b86f0d851de63dd398759b50bc07abb25cee",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-git-revert-default-subject-fails-the-conventional-commit-guard-use-git-revert-no-commit-and-b1f9190b6f70ec9e.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-github-ops-actions-ci-app-merge-queue-po-2026-07-17.md",
   "source_digest": "e0bab40809b8fb7d049df2ce3ca39bdacfe0e841949340fa714078e004c791bc",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §GitHub Issue Hierarchy, §Model / Effort Routing (advisor)"
   ],
   "reason": "PO決定として明記された恒久的なGitHub運用方針で、PR/commit/issue番号を含まない直接的な方針宣言。",
   "adopt": {
    "memory_id": "memory:user:github-actions-ci-github-app-merge-queue--7ae6214cda09",
    "kind": "user",
    "title": "GitHub Actionsへの依存・課金を増やさない方針: 自前CI優先、GitHub App/merge queue不採用",
    "tags": [
     "ci-policy",
     "github-ops",
     "po-decision"
    ],
    "registration": {
     "operation_id": "curation-424:e0bab40809b8fb7d",
     "memory_id": "memory:user:github-actions-ci-github-app-merge-queue--7ae6214cda09",
     "source_path": ".ut-tdd/memory/user-github-actions-ci-github-app-merge-queue--7ae6214cda09.md",
     "content_digest": "73de0fa08b64c19c90e80a1712cddb6e7fe4fd06ad33ede59daff0435f71efd6",
     "exit_code": 0
    },
    "receipt_digest": "9eafea346bf85c5f12ff79020d81924429981ec5e9864c8063cd5aae89fdbcb6"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-github-pr-commented-review-reviewdecision.md",
   "source_digest": "fb3e5f8b9b1a1aebbd70a2978901300ab6bae4a6c4c138b9396407f1a5c137aa",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-github-pr-commented-review-reviewdecision.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-gpt-5-6-effort-crossover-tendency-h4.md",
   "source_digest": "77cb040fa1b2415f3a0bc7fb99e491f2a528c426e1a03e4c31ffb5b6d9347837",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-gpt-5-6-effort-crossover-tendency-h4.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-hybrid-commit-coordination-claude-codex.md",
   "source_digest": "d5ddae90f4ae99194a999af01a214178aa0b842c94be1d44ce8cc145dce0efe4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-hybrid-commit-coordination-claude-codex.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-hybrid-pr-pr-codex.md",
   "source_digest": "82a44f1e41049732b866d6cfffdcb57056ea51d42605230bb47ba302dacb8407",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-hybrid-pr-pr-codex.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-inbox-absence-never-proves-a-review-request-is-absent-reconcile-open-prs-and-canonical-requ-4f019261de4bedca.md",
   "source_digest": "87d136e0de7e1de7f1807a5d063ab330d7fb140034dfedc85f9648e387ce8191",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §引き継ぎ・検証の基準点 = HEAD",
    "src/feedback/review-attestation.ts (isValidReviewRequest)",
    "src/feedback/review-dispatch.ts (analyzeReviewDispatch)"
   ],
   "reason": "inbox通知は依頼側の運用に依存する一方通行の経路であり、GitHubのopen PR一覧とHEADがreview依頼存在の正本であるという、canonical検証手段への参照付きの恒久ルール。",
   "adopt": {
    "memory_id": "memory:feedback:inbox-review-open-pr-canonical-request-pull--36a143eff363",
    "kind": "feedback",
    "title": "inboxの不通知はreview依頼の不在を証明しない: open PRとcanonical requestを能動的にpullで突き合わせる",
    "tags": [
     "hybrid-coordination",
     "inbox",
     "review-request"
    ],
    "registration": {
     "operation_id": "curation-424:87d136e0de7e1de7",
     "memory_id": "memory:feedback:inbox-review-open-pr-canonical-request-pull--36a143eff363",
     "source_path": ".ut-tdd/memory/feedback-inbox-review-open-pr-canonical-request-pull--36a143eff363.md",
     "content_digest": "69b1d1bd9f0542251ed3863634066861eadb2547c3a835dcaae6b7a0dbf510e3",
     "exit_code": 0
    },
    "receipt_digest": "c06a11f9b9c69fc7e31a6c0e5fd854edf74e2003758df76e312bc348b70d68ae"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-issue-218-d2-live-vs-code-review-canonical-writer-wiring-gap.md",
   "source_digest": "b41f55b962bbb2f11f70cf04c1a89f2d398b8693e502d0926f95a552dbefb363",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-issue-218-d2-live-vs-code-review-canonical-writer-wiring-gap.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-issue-325-closed-manually-after-pr-332-merge-because-closes-keyword-did-not-auto-fire-and-f-9328f24b11436530.md",
   "source_digest": "c89f2ed7deb783f4ec5624dbb2087c16c01d26c1d95990aff5de44472385e2e9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-issue-325-closed-manually-after-pr-332-merge-because-closes-keyword-did-not-auto-fire-and-f-9328f24b11436530.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-issue-328-design-freeze-request-routed-to-claude-is-out-of-role-claude-is-pr-only-owner-and-0a5e22f44b5050a0.md",
   "source_digest": "336114e178c58e0755d5e0eb28b3470744507251ab74eb4e170f55bb6d907016",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-issue-328-design-freeze-request-routed-to-claude-is-out-of-role-claude-is-pr-only-owner-and-0a5e22f44b5050a0.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-issue-362-flag-supersedes-initial-closing-request.md",
   "source_digest": "6e9a0d670d9d3e17b106bf7332f84ca4381d66753eab83e6ecbf6ec9ee5f64a4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-issue-362-flag-supersedes-initial-closing-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-issue328-d3a-next-design-slice-repo-local-digest-bound-verdict-evidence.md",
   "source_digest": "dcb078af19cb75889fb39d0d673773443a3d347c956b7cdd96b29ea0d2f0f04a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-issue328-d3a-next-design-slice-repo-local-digest-bound-verdict-evidence.md",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-issue328-d3a-verdict-placement-advisor-recommends-repo-local-digest-bound-runtime.md",
   "source_digest": "b9d9aa6d5439f15a6aba417c30d4f7e69eda0ae96d93af5ee78c7281d8e134d0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-issue328-d3a-verdict-placement-advisor-recommends-repo-local-digest-bound-runtime.md",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-l6-sub-doc-coarse-bucket-topic-doc-per-topic-slug-plan-l7-245.md",
   "source_digest": "49f225b7f13389b64b87edf332f556783178df00ebc613dab81a18fdee702bcf",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-l6-sub-doc-coarse-bucket-topic-doc-per-topic-slug-plan-l7-245.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-lesson-claude-froze-a-redesign-contract-that-issue-178-explicitly-excluded-codex-flag-b1-b2-aa84ad86c8a21398.md",
   "source_digest": "f22dafff55f18db876f6a5a31abb919648f2a556fb0f9f0a7d849ceb48cd67d6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-lesson-claude-froze-a-redesign-contract-that-issue-178-explicitly-excluded-codex-flag-b1-b2-aa84ad86c8a21398.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-lesson-do-not-present-an-impression-as-a-proof-boundary.md",
   "source_digest": "2d13e3747d9f5269959195880a9ecd58dfa47e2a9afc0f87c608a1d32953b69a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-lesson-do-not-present-an-impression-as-a-proof-boundary.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp",
    "screen:personal-path"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-lesson-pr-body-is-part-of-the-artifact-record-fixing-the-plan-without-syncing-the-descripti-4cb86b2ec22311c3.md",
   "source_digest": "de42cbe1afb6815ba4f4fb0eb97f948296c383bf7cb963094ccbcc392aaa5a18",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-lesson-pr-body-is-part-of-the-artifact-record-fixing-the-plan-without-syncing-the-descripti-4cb86b2ec22311c3.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-main-plan-l7-244-draft-pr-290-deliverable-merge-confirm-add-impl-reverse-codex.md",
   "source_digest": "a6de5a56d4cc0de292ed80a53dd5eeac7b85dd80d64a70eaa2559e2c94a4392f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-main-plan-l7-244-draft-pr-290-deliverable-merge-confirm-add-impl-reverse-codex.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-math-max-0-nan-nan-clamp-sla.md",
   "source_digest": "aa73cd33da2875671d00a4b6414839ba657970b1bf66b14e360fb37ca1dd37cc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-math-max-0-nan-nan-clamp-sla.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-memory-backlog-delivery-requires-body-judged-triage-and-pre-delivery-inspection-not-a-bulk-commit.md",
   "source_digest": "a93b6f98db58086a832372147fdee24c7087b8da0f5b093701c9429a5bc46263",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "「証明の強さを実測以上に見せない」「指摘を受けたら同じ性質のものをrepo全体で数え直す」という、繰り返し有効性が確認された2つのレビュー/検証原則。旧版(idx30)を統合。",
   "merged_from": [
    "39979e0a9fef0c2062cc6485cd1db9763085fcc4e88062e725212c299feb4399"
   ],
   "adopt": {
    "memory_id": "memory:feedback:repo--5434d4f6a9af",
    "kind": "feedback",
    "title": "印象を証明として書かない: 全称主張は実測で境界の両側を数え、指摘を受けたら同じ性質のものをrepo全体で数え直す",
    "tags": [
     "falsifiability",
     "review-methodology",
     "self-verification"
    ],
    "registration": {
     "operation_id": "curation-424:a93b6f98db58086a",
     "memory_id": "memory:feedback:repo--5434d4f6a9af",
     "source_path": ".ut-tdd/memory/feedback-repo--5434d4f6a9af.md",
     "content_digest": "3d933633c3fe04645674bb8e7cb403cc713d3edf276f0d5a915ed88a09f7baa2",
     "exit_code": 0
    },
    "receipt_digest": "a89401cb79389b7b9c46cca97265076203cb76d775bbd275dcf96030e467bc9d"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-memory-triage-must-judge-body-content-and-title-based-rescue-reintroduces-episodic-state.md",
   "source_digest": "39979e0a9fef0c2062cc6485cd1db9763085fcc4e88062e725212c299feb4399",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-memory-triage-must-judge-body-content-and-title-based-rescue-reintroduces-episodic-state.md",
    "screen:timestamp"
   ],
   "reason": "merged into 印象を証明として書かない: 全称主張は実測で境界の両側を数え、指摘を受けたら同じ性質のものをrepo全体で数え直す"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-merge-follow-up-hard-gate-plan-status-confirm-merge-pr349-verdict.md",
   "source_digest": "9738fb95d7eef422009d4420cee4c08799963954db6e1686742a1adab974da76",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-merge-follow-up-hard-gate-plan-status-confirm-merge-pr349-verdict.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-merge-ordering-never-merge-a-side-pr-while-a-mainline-pr-holds-a-fresh-receipt-at-its-curre-eda100457bdfc049.md",
   "source_digest": "633b264807bc53171e6293248dbbd9c084d87d3a6a393ac072732da04225584f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-merge-ordering-never-merge-a-side-pr-while-a-mainline-pr-holds-a-fresh-receipt-at-its-curre-eda100457bdfc049.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-monitor.md",
   "source_digest": "c689d36e4aa29f5bd0160080c6e2df34f22b6025657bf17247c554e35f8e1aec",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-monitor.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-never-gh-run-rerun-failed-on-harness-check-node-generation-aggregate-rejects-cross-attempt-90ba23c29713df12.md",
   "source_digest": "34523e0c39aedd023f0ebc5ad507daf8debc72a07b5f6f226a67708ab7eedd43",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "CI再実行手段の選択を誤るとnode-generation aggregateがcross-attempt evidenceを拒否するという、機械の設計(same-run/attempt admission)に基づく具体的で再現可能なルール。",
   "adopt": {
    "memory_id": "memory:feedback:harness-check-gh-run-rerun-failed-evidence-binding-mismatch--f83998e54011",
    "kind": "feedback",
    "title": "harness-checkではgh run rerun --failedを使わない: evidence-binding-mismatchで落ちる",
    "tags": [
     "ci",
     "flake-recovery",
     "node-generation"
    ],
    "registration": {
     "operation_id": "curation-424:34523e0c39aedd02",
     "memory_id": "memory:feedback:harness-check-gh-run-rerun-failed-evidence-binding-mismatch--f83998e54011",
     "source_path": ".ut-tdd/memory/feedback-harness-check-gh-run-rerun-failed-evidence-binding-mismatch--f83998e54011.md",
     "content_digest": "d37f439a234705a1933b0b0bc225ac256d5198945f5c3ca73fb452e63ad4cea8",
     "exit_code": 0
    },
    "receipt_digest": "a636d5fe0caf5c1ffee80ed8af1d26f3163aaa1ece46897d3f1ef706db45f4dd"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-never-stop-a-started-review-dispatch-an-attempt-without-an-outcome-event-blocks-all-later-a-031c89445be48430.md",
   "source_digest": "605b0f9b343bd127f36f9f3961a2cb44b70313859b07bdf4eed9b43b38e5a115",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "attempt開始後の強制停止がcustodyのfail-close(outcome不在)を招き、以降の全attemptを恒久的にブロックするという、機械の挙動に基づく具体的な回避ルール。",
   "adopt": {
    "memory_id": "memory:feedback:review-dispatch-outcome-attempt-attempt--4a4fff588c48",
    "kind": "feedback",
    "title": "開始済みのreview dispatchを途中で止めない: outcomeの無いattemptは以降の全attemptをブロックする",
    "tags": [
     "delegation",
     "review-custody",
     "review-dispatch"
    ],
    "registration": {
     "operation_id": "curation-424:605b0f9b343bd127",
     "memory_id": "memory:feedback:review-dispatch-outcome-attempt-attempt--4a4fff588c48",
     "source_path": ".ut-tdd/memory/feedback-review-dispatch-outcome-attempt-attempt--4a4fff588c48.md",
     "content_digest": "8e55ac1b04c6677c80362bb66a965d3ab68f6d9ae00230b21e7e2111371ee102",
     "exit_code": 0
    },
    "receipt_digest": "0aeee6f628f90f43a04b40932ad32bad82e1b673eba06adf95516abec43ca761"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-p0-diagnosis-at-exact-main-7dbfa4fd-harness-db-4-41gb-is-100-live-data-from-per-turn-token-d848a79a227c4641.md",
   "source_digest": "04fa07a73d16a2ff34818f00345118c819276f48d7a5af84b7e5ebc163200996",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-p0-diagnosis-at-exact-main-7dbfa4fd-harness-db-4-41gb-is-100-live-data-from-per-turn-token-d848a79a227c4641.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pack-independent-release-gap-exact-source-2f3f15af-pack-7e11ec15.md",
   "source_digest": "c69f4cfd1443265c09a561451fff4e031497f4f1bfad3471d55a8eac1e2d6cbc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pack-independent-release-gap-exact-source-2f3f15af-pack-7e11ec15.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pass-forward-344-fresh-opus-pre-gate-at-exact-main-7dbfa4fd-plan-l7-419-implementation-admi-935b926f95d75bd6.md",
   "source_digest": "39262d522bd17de389247d0a8eb6d6cc0c2ca68b2148378f617450e06f4459bd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pass-forward-344-fresh-opus-pre-gate-at-exact-main-7dbfa4fd-plan-l7-419-implementation-admi-935b926f95d75bd6.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pass-merged-pr-349-forward-fsm-implementation-at-exact-head-fa6e8661-merge-62a159ef-self-co-cf179d49870a4e4f.md",
   "source_digest": "020b300b99ffccaa0c363a2e27a75de20c25256b5de4a9f4371550ebd3c26a86",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/lint/review-evidence.ts (green-command-digest note vs hard gate)"
   ],
   "reason": "doctor/CIのfindingをblockingと宣言する前に、そのチェックがhard gateかadvisory noteか、どのcommit/anchorに束縛されているかを確認するという、レビュー判定の誤りを避ける具体的教訓。",
   "adopt": {
    "memory_id": "memory:feedback:doctor-ci-blocking-hard-gate-advisory-note-commit-anchor--3762173f2696",
    "kind": "feedback",
    "title": "doctor/CIの所見をblockingと宣言する前に、hard gateかadvisory noteか、どのcommit/anchorに束縛されているかを確認する",
    "tags": [
     "ci-triage",
     "doctor-gate",
     "review-methodology"
    ],
    "registration": {
     "operation_id": "curation-424:020b300b99ffccaa",
     "memory_id": "memory:feedback:doctor-ci-blocking-hard-gate-advisory-note-commit-anchor--3762173f2696",
     "source_path": ".ut-tdd/memory/feedback-doctor-ci-blocking-hard-gate-advisory-note-commit-anchor--3762173f2696.md",
     "content_digest": "9ecb76c98378233ab3cd5c2be21a809a19de92de63ae4ea26a9dc361a2643226",
     "exit_code": 0
    },
    "receipt_digest": "2fa297aa697f1f6525117e8c0bd4cc483638865900425da5503c43dd4f5efb76"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pass-merged-pr-350-measurement-only-record-at-85bc864c-merge-52c39774-redesign-stays-with-124-169-lane.md",
   "source_digest": "ca3445ef95d4ba47a7ad35c6965c4a694ff7a173b64ada388b34a3add5cae989",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pass-merged-pr-350-measurement-only-record-at-85bc864c-merge-52c39774-redesign-stays-with-124-169-lane.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pass-pr-354-exact-head-8fa5e7d9-pf4-delta.md",
   "source_digest": "498c848ee091ccf5ba6795a49755370c0857591ed17cd7739a39465cd022be55",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pass-pr-354-exact-head-8fa5e7d9-pf4-delta.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pass-pr-358-040a9f85-and-pr-359-25109ce9-delta.md",
   "source_digest": "be2e5c735278cc8d9d5093f7837bdeb898373fa77570feca1f18658b1024d851",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pass-pr-358-040a9f85-and-pr-359-25109ce9-delta.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pass-pr-358-6fba5534-and-pr-359-0e9a7a89-evidence-fixed.md",
   "source_digest": "f1872e49a0689902155b17779953f8c9a817ead3f3be8b7326a18e5d346b1ffc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pass-pr-358-6fba5534-and-pr-359-0e9a7a89-evidence-fixed.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pass-verdict-pr-348-exact-head-3aaab5d3-forward-fsm-evidence-rule-correction-claude-opus-5-931d9644771885a7.md",
   "source_digest": "865e5e88de6cb2325b7c4961266010d71d4f7189fc46f9462324e72e2dbbe43b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pass-verdict-pr-348-exact-head-3aaab5d3-forward-fsm-evidence-rule-correction-claude-opus-5-931d9644771885a7.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pf-3-249-waits-for-pf-2-pr-315-merge.md",
   "source_digest": "0c25d793ee5754d7c6df80515eda051f666eee7b8f8957568cd706d919981ea2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pf-3-249-waits-for-pf-2-pr-315-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-plan-reverse-473-r3-aggregate-review-request-exact-main.md",
   "source_digest": "40f86c57f1ad5b3edb3b91253057fa98963b21dc5069737b967f6775a6132947",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-plan-reverse-473-r3-aggregate-review-request-exact-main.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-plan-reverse-473-r3-codex-aggregate-evidence-exact-main.md",
   "source_digest": "358033da7633a3d50ddab273fa9fe57e3e6794540af44b210b0a9411dab55172",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-plan-reverse-473-r3-codex-aggregate-evidence-exact-main.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-plan-reverse-473-r3-codex-evidence-exact-main-427e07be.md",
   "source_digest": "f949c8a1bdeb04a20ce00e3d7a02e41938e01a5469797ea50f5c1be202e555ae",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-plan-reverse-473-r3-codex-evidence-exact-main-427e07be.md",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-plan-reverse-473-r3-re-review-at-main-427e07be-pass-extended-to-pf-1-through-pf-3-pf-source-44f2ea2f346472ba.md",
   "source_digest": "bf43617ddd123e330fb30c2a6946470d6e0eb87efdb194d0b19b1dad8e008dd9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-plan-reverse-473-r3-re-review-at-main-427e07be-pass-extended-to-pf-1-through-pf-3-pf-source-44f2ea2f346472ba.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-po-2026-07-13.md",
   "source_digest": "d0a2c5fadf903a13fc429aa768db7b068adf84df4f5f7af489c4ef97e55381c9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-po-2026-07-13.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-po-2026-07-16.md",
   "source_digest": "aec4c8ff8f9f59f968fe9d0a10a0199f4dfc4062b926f91c19ef1e5579660b26",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    ".ut-tdd/memory frontmatter (promoted_plan, tags)"
   ],
   "reason": "PO制定のcross-runtime申し送りトーン規約。事実関係の正確さは従来通り要求し、コード/PLAN/PR本文には適用しないという適用範囲の限定を含む恒久ルール。",
   "adopt": {
    "memory_id": "memory:user:feedback--e3e7b904f77a",
    "kind": "user",
    "title": "にゃ！プロトコル: ランタイム間feedbackメモリのトーンは表情絵文字+語尾「にゃ」で協調度/深刻度を示してよい",
    "tags": [
     "communication-protocol",
     "memory-tone",
     "po-rule"
    ],
    "registration": {
     "operation_id": "curation-424:aec4c8ff8f9f59f9",
     "memory_id": "memory:user:feedback--e3e7b904f77a",
     "source_path": ".ut-tdd/memory/user-feedback--e3e7b904f77a.md",
     "content_digest": "b53b6f36d328f458e9637463a3ded7c1110434c24e64e223af6c82237ac8caa5",
     "exit_code": 0
    },
    "receipt_digest": "c4943b928b3c8213b3190886eb3f41571040d073502c4aa1ed4ce7fb6b67ccff"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-po-2026-09-08-run-queued-opus-reviews-in-parallel-one-shot-marker-serialises-them-so-ut-tdd-814542cab4e2cdd3.md",
   "source_digest": "2c2ee4e9f58cfe439d4cef33efd354a1e5693dac303f1a238f41e28a70073a2c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-po-2026-09-08-run-queued-opus-reviews-in-parallel-one-shot-marker-serialises-them-so-ut-tdd-814542cab4e2cdd3.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-po-correction-claude-remains-pr-response-owner-codex-takes-non-pr-work.md",
   "source_digest": "4acb03c57248c6e1839be7192f177dedca01cc4200e9897b3e2c781bba1c92ae",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-po-correction-claude-remains-pr-response-owner-codex-takes-non-pr-work.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-po-transfer-all-active-claude-work-to-codex-stop-claude-mutations.md",
   "source_digest": "db0c4eba4c5234d450ccdf789759fffda917a2720efa98a4e7602f696fc8a3ee",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-po-transfer-all-active-claude-work-to-codex-stop-claude-mutations.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-post-merge-audit-of-pr-341-at-main-2f3f15af-pass-tree-identical-to-ci-green-pr-head-a-1-to-e79a34280a065b9f.md",
   "source_digest": "9d15ab20f3214db2bbd4170022b5aa37bb2883888255390cdd03389ebcc3f334",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-post-merge-audit-of-pr-341-at-main-2f3f15af-pass-tree-identical-to-ci-green-pr-head-a-1-to-e79a34280a065b9f.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-post-merge-pr-341-r4-exact-main-2f3f15af-claude-final-audit.md",
   "source_digest": "314ba0199ee8ab87d5712abf4bb1d8eaa3fa76fcf571916c1737c429e9af6e71",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-post-merge-pr-341-r4-exact-main-2f3f15af-claude-final-audit.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-1-2026-07-14.md",
   "source_digest": "d6a90be55785497483f7524f565bf4bd06edfe8b73c5753c601f9ee09fe82a99",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-1-2026-07-14.md",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-100-flag-stop-refresh-coalescing-and-durable-failure-gaps.md",
   "source_digest": "c4ad77b2970bf903794b4bc39ad2dea225d82507b8fa8a68c19f9ad76f71df80",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-100-flag-stop-refresh-coalescing-and-durable-failure-gaps.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-106-flag-ci-contract-and-l7-test-design-gap.md",
   "source_digest": "be2404a0811973103450bd99356a93dd7df25881363df55e83a8908325db6d4f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-106-flag-ci-contract-and-l7-test-design-gap.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-285-merge-live-dispatch-post-merge-receipt-kind.md",
   "source_digest": "a61774caaf023404e30690e52ce549b6a15495f0a2ed37c55da2f773a0bb8c72",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-285-merge-live-dispatch-post-merge-receipt-kind.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-286-closing-cross-review-flag-codex-exact-head-4634fcdb.md",
   "source_digest": "325da1ef6cb61ae8c5133de35246cf8ce0c8ff0e9b911e82c857b87296d20617",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-286-closing-cross-review-flag-codex-exact-head-4634fcdb.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-287-merge-method-admit-assertion-flag-correction.md",
   "source_digest": "489b4246cacc322f18e00dfef7ad1e104482708428be031610f028d2f13fad75",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-287-merge-method-admit-assertion-flag-correction.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-287-post-merge-custody-corrective-closing-cross-review.md",
   "source_digest": "6c0c36a73ef0a7c1eb970ae314781bb834e4cec3d0713fef68f6932a062f70e9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-287-post-merge-custody-corrective-closing-cross-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-288-live-dispatch-flag-codex-exact-head-45022164.md",
   "source_digest": "5dc996ccc7c23451164d624c826ab8c985c4ab413ed93dc1379881807c279069",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-288-live-dispatch-flag-codex-exact-head-45022164.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-290-blind-review-flag-oracle-provenance-uniqueness-3-codex.md",
   "source_digest": "14309ae1e2e7d83856b1d59e1b1b940f221828c420c3470faa1e8cf20d7ed3bb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-290-blind-review-flag-oracle-provenance-uniqueness-3-codex.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-290-canonical-mirror-fold-flag-correction.md",
   "source_digest": "5f00e3282a8cd13a08535ac67144cdfc2f6268eb13153f9e3f1aa3843188afe2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-290-canonical-mirror-fold-flag-correction.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-290-flag-canonical-oracle-u-phover-002-codex.md",
   "source_digest": "578014b74d10f6c3e6315ee32b069b1dc0a6513ec57f3ca38d8694b9673a01ea",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-290-flag-canonical-oracle-u-phover-002-codex.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-290-flag-correction-canonical-oracle-provenance.md",
   "source_digest": "a6d76ab47ad1af2d87e7c4a30ae00bcacc14f7fbce456d7c781200ed1a1b71e3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-290-flag-correction-canonical-oracle-provenance.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-290-oracle-provenance-author-closing-review-request.md",
   "source_digest": "76e128a3922dda7b6df15f8069710e4ae8bd6abfafb16684fc31a1fd885fa943",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-290-oracle-provenance-author-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-291-exact-head-356d4fa8-memory-timestamp-freshness-flag.md",
   "source_digest": "f20ebd5cc93799069286e6d24232c21ab5fb965c0e697662fb214f5276e9abc0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-291-exact-head-356d4fa8-memory-timestamp-freshness-flag.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-291-feedback-memory-identity-provenance-follow-up.md",
   "source_digest": "893251e95725e4c8ff34b787769c9be1f011410766fe3e41fb74dce2d07ac7fc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-291-feedback-memory-identity-provenance-follow-up.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-295-297-nonauthor-closing-review-request-new-exact-heads-post-298-ci-green.md",
   "source_digest": "4f5326764acd975644cfdb1c2e6c54f2d4855a09a5368507751a45453050e91d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-295-297-nonauthor-closing-review-request-new-exact-heads-post-298-ci-green.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-295-exact-head-ccb0a969-nonauthor-closing-review-pass.md",
   "source_digest": "ae9bd8e63a93e36b72f335a0b3639ce1180cb1a3c40c7da8dc27c4bae17edb3e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-295-exact-head-ccb0a969-nonauthor-closing-review-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-297-exact-head-fa30e32e-nonauthor-closing-review-pass.md",
   "source_digest": "ceb379e3cde5aec1ad42bee32a36c6ff02f999ea8d2932722ff8ec57cd1fd2ef",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-297-exact-head-fa30e32e-nonauthor-closing-review-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-298-exact-head-2dccca32-nonauthor-closing-review.md",
   "source_digest": "9053167e88dd01c17367a81d2cd3322c019da3d0c0b786ffa0355db8550e932f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-298-exact-head-2dccca32-nonauthor-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-298-forward-convergence-correction-review.md",
   "source_digest": "9ad675d6d74c0a16e67ac692e5ba53771649cc7031e5de653201bccdf9c60138",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-298-forward-convergence-correction-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-298-merged-295-297-stale-ci.md",
   "source_digest": "772db044b9e81d4067be2da00d60379cefd47d05fb1e2f80f446ea1fd2766147",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-298-merged-295-297-stale-ci.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-298-nonauthor-closing-review-request.md",
   "source_digest": "0ba5579542652b6521643aa1acb1e97359d0de6afe26649067709445152226cd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-298-nonauthor-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-299-claude-closing-review-flag-bl-1-exactly-1-binding-gated-by-result-ok.md",
   "source_digest": "467394f7c65e285ec4da39b703f25612cfd197b87e9100fd433ef5b1c73194f2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-299-claude-closing-review-flag-bl-1-exactly-1-binding-gated-by-result-ok.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-299-closing-authority-clarification-claude-flag-bl-1-supersedes-same-family-pass.md",
   "source_digest": "74fab5053cc19e560de452295fad030f77e96933be666c84e9675bda9531819a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-299-closing-authority-clarification-claude-flag-bl-1-supersedes-same-family-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-299-d2-b-ci-flag-exact-head-021cb536.md",
   "source_digest": "8cbdf60cd90fc5052061f8199c73b8895b9f60bbeef6b4f42e0c7014abd06159",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-299-d2-b-ci-flag-exact-head-021cb536.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-299-exact-head-38876594-b-3-ambiguous-deny-flag.md",
   "source_digest": "17e2c728cabb223181baba9db349a954c50773ff085768731970c4c324171fb1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-299-exact-head-38876594-b-3-ambiguous-deny-flag.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-299-exact-head-41cd5a5f-deterministic-deny-receipt-flag.md",
   "source_digest": "e2f2ca3b9c2335355a002358b543b9a86b109121264b2b08e8dae7d74376e548",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-299-exact-head-41cd5a5f-deterministic-deny-receipt-flag.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-299-exact-head-c1af2933-deny-receipt-binding-flag-follow-up.md",
   "source_digest": "9ba1b9e7d2b60ae261e5b3a5b9d4f463eec642794810dc2d04e07d55ab3e3f8f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-299-exact-head-c1af2933-deny-receipt-binding-flag-follow-up.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-299-exact-head-da6b297f-ci-failure-follow-up.md",
   "source_digest": "1d8fa3a798d464f32f1613c3a1638e797bf092312ef8453b8b54cccc27fa207d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-299-exact-head-da6b297f-ci-failure-follow-up.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-299-exact-head-da6b297f-closing-pass-with-pr-body-evidence-correction.md",
   "source_digest": "3d5189a26d600135748f966a249a7d12fc161ffe8146c68d79b02eb4dae62bfb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-299-exact-head-da6b297f-closing-pass-with-pr-body-evidence-correction.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-299-nonauthor-closing-review-request-d2-b-merge-gate-exact-head-38876594.md",
   "source_digest": "28dc01cde1fb770db966513c682b6e4f21ef64a3cfd7e6257bce0543de848ee7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-299-nonauthor-closing-review-request-d2-b-merge-gate-exact-head-38876594.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-3rd-review-flag-basename-identity-scope-filter-fail-open-misattribution.md",
   "source_digest": "9cfacad21daa0b6bd58b4897ce1c2c7824ba76cde9ade1ffe54179813fccf4ca",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-3rd-review-flag-basename-identity-scope-filter-fail-open-misattribution.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-4th-review-flag-u-planlint-004-windows-red-ntfs-case-insensitive-fixture.md",
   "source_digest": "e78adee70a2cd012b46179fcb08a03d06081308f15127aadb20d1daf9259049a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-4th-review-flag-u-planlint-004-windows-red-ntfs-case-insensitive-fixture.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-claude-cross-review-flag-path-form-default-lint-false-positives.md",
   "source_digest": "24279f70f8fa8c49075941f32f3ae7a09ce438b978e43f8321b83a0d88b046df",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-claude-cross-review-flag-path-form-default-lint-false-positives.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-38878f77-canonical-path-identity-flag-follow-up.md",
   "source_digest": "a1dd901aa1a278ccc661209a4d6147848a1bdc982869aa13ce48137ca6ab1bde",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-38878f77-canonical-path-identity-flag-follow-up.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-538f078a-path-form-default-lint-flag.md",
   "source_digest": "9155284ccdd7ab2045043f69a55db248952c45d3e07976556f66274db117b1a6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-538f078a-path-form-default-lint-flag.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-5a656021-delegated-claude-pass-weak-no-blocking.md",
   "source_digest": "c4af236c549e7a5ef87605d6d5f2304e290621275aab12ae6e82465d39c26772",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-5a656021-delegated-claude-pass-weak-no-blocking.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-5a656021-windows-ci-green-closing-review.md",
   "source_digest": "c6b3b441b5a775d88d9724e9c429783656e16b2bafcc96c5d417a96efda0b440",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-5a656021-windows-ci-green-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-6d3b29bb-ci-complete-closing-review-request.md",
   "source_digest": "7f2ad3927aad6949139bb096f07bb31698954b20e5dfbc452a293ce6aa64c80e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-6d3b29bb-ci-complete-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-6d3b29bb-windows-scope-filter-flag-follow-up.md",
   "source_digest": "4aa541cf7887d6200161dd8e0b29bc023f653fa95183c6101da7d12164c52a98",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-6d3b29bb-windows-scope-filter-flag-follow-up.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-d47100f6-ci-green.md",
   "source_digest": "f9b4477e8e68d56a207d217eef3dd45813dfee3da737eca7a986798ec65764a2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-d47100f6-ci-green.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-sha-correction-38878f7731b6-canonical-review-request.md",
   "source_digest": "35b9bb039f8d4dd6dc04f092cb3bd451901c3439c6d1907ac249ee46b24968d5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-exact-head-sha-correction-38878f7731b6-canonical-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-issue-296-exact-head-plan-lint-governance.md",
   "source_digest": "df4eb01ee82f5fcce7c71f49e67499fb3f541820aa419ea0c17477d59d5cf3b2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-issue-296-exact-head-plan-lint-governance.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-300-re-review-flag-2nd-windows-path-form-governance-silent-fail-open.md",
   "source_digest": "270b72da48e9fb115ec1f5c650e0ea26ca6b8e393bc63414653be0e9cc5241c2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-300-re-review-flag-2nd-windows-path-form-governance-silent-fail-open.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-301-exact-head-4dc5179-verification-correction-closing-pass.md",
   "source_digest": "adb74ac6df961407a817bd50a3a04feb0d0e4efb3fbde3b62d5ba0844e787a21",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-301-exact-head-4dc5179-verification-correction-closing-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-301-exact-head-4dc5179a-flag.md",
   "source_digest": "3c86554461ae4c001992f3968808c1ad70a76c7cc678c7113d4f30ef0b2e5fd6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-301-exact-head-4dc5179a-flag.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-301-nonauthor-closing-review-request-plan-l7-462-cross-agent-retake.md",
   "source_digest": "aeb3e113c2300b56b9b591bb3a26532aa7cb50dbdbe03e4ed21b266cf0d75238",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-301-nonauthor-closing-review-request-plan-l7-462-cross-agent-retake.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-301-verification-command-correction-frontmatter-test-path.md",
   "source_digest": "3603eed9a6097b21cb55dbcb3aa7562d02b08deeb7ea1d4b84cd43e447b63627",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-301-verification-command-correction-frontmatter-test-path.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-302-d2-d-freeze-flag-exact-head-302e8dcd.md",
   "source_digest": "d1016f350dafe08becdb12dd5870ebb2cead9d0a3134367dacdf55dfee67ab7b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-302-d2-d-freeze-flag-exact-head-302e8dcd.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-302-delta-flag-2-exact-head-b52d77fc.md",
   "source_digest": "f575c5b919ed8cd94d947530de389e6b7f2134ea2144d36dd6e302c450f71fe8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-302-delta-flag-2-exact-head-b52d77fc.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-302-delta-flag-3-exact-head-2edb621e.md",
   "source_digest": "d010d35ceeb23697aec7d45dec5c7a706509373a4b00ef33ab79fc3b1599caa5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-302-delta-flag-3-exact-head-2edb621e.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-302-exact-head-2af03ba2-d2-d-freeze-cross-review-flag.md",
   "source_digest": "6aed9a6827ac132e5e1e54d6c45fe028beb51865c692d82b04863048d14a8a26",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-302-exact-head-2af03ba2-d2-d-freeze-cross-review-flag.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-302-exact-head-2edb621e-closing-delta-pass-blocking-0.md",
   "source_digest": "693d6e5e0d8ea8a87b071c9cdcabf2b9ead24cff1b699a4bb3ca260523d1cc64",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-302-exact-head-2edb621e-closing-delta-pass-blocking-0.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-302-exact-head-302e8dcd-closing-delta-review-flag.md",
   "source_digest": "c49a08c5e027de4af5c3984d2e6d3705aca3be4887ad877e8d1380bf168137e3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-302-exact-head-302e8dcd-closing-delta-review-flag.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-302-exact-head-b52d77fc-closing-delta-review-flag-blocking-2.md",
   "source_digest": "e8d572a1af63466cd2e0eebf296932cf8f72d42ece73190ba667a69955407b0d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-302-exact-head-b52d77fc-closing-delta-review-flag-blocking-2.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-302-review-comment-url.md",
   "source_digest": "8de6673e453d8fbdefc8545e57d74d86bce8248023b4c948b7eba110de9eb9d9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-302-review-comment-url.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-306-claude-closing-review-flag-regex-literal-lexer-swallows-labels.md",
   "source_digest": "cc2d0aa05f11bb936618e26700aba035a427b2ae3416a8cdb11cc859fd462f38",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-306-claude-closing-review-flag-regex-literal-lexer-swallows-labels.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-306-delta-re-review-pass-blocking-0-with-merge-preconditions.md",
   "source_digest": "45a4cc9f0c181f46778a50047eb5b92873324168f0cdbfc87e8b9b81644b6363",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-306-delta-re-review-pass-blocking-0-with-merge-preconditions.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-307-308-309-review-requests-pf-1-fix-delta-pf2-closing-s1-freeze.md",
   "source_digest": "4936e47db26686c76da71bc9f59498a37164c737f341515fd8345129c53b5506",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-307-308-309-review-requests-pf-1-fix-delta-pf2-closing-s1-freeze.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-309-exact-head-ce951518-non-author-re-review-flag-blocking-3.md",
   "source_digest": "9c60867d64abe60fde039794913e5d971ef9d1d54c73ed5c5240fb973d0d804d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-309-exact-head-ce951518-non-author-re-review-flag-blocking-3.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-309-exact-head-e0de8d49-delta-review-pass.md",
   "source_digest": "a363bf8d54cbc65939e97b7868f042b0ccbabf6e3c296c99ab4ce61e41ce28e1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-309-exact-head-e0de8d49-delta-review-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-309-flag-exact-head-e0de8d49-delta.md",
   "source_digest": "66c66ed93b4909930fb4fe5d266d947453f3e007b11ecd70c79dbd310b43cb4c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-309-flag-exact-head-e0de8d49-delta.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-309-flag-workflow-suggest-contract-and-ownership-gaps.md",
   "source_digest": "dafa26b77111d6f66592b24986126bb8a5513fc207a933af01700c890416bee3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-309-flag-workflow-suggest-contract-and-ownership-gaps.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-309-renumber-plan-l6-100-pr-311-l6-99-311-doc-only-closing-review.md",
   "source_digest": "70158b84e33dad2b1918753297013c3c2524d73ff8d49cdcfc43bdb99b265827",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-309-renumber-plan-l6-100-pr-311-l6-99-311-doc-only-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-309-s1-freeze-exact-head-ce951518.md",
   "source_digest": "4fd3a5eedc2d28bbc1e32c30748603714bc880683ae87a6e5ff94c3e6fd5af28",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-309-s1-freeze-exact-head-ce951518.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-309-s1-freeze-exact-head-e0de8d49-merge.md",
   "source_digest": "0069d59b290efe3c92acaae1b160b4ac3a9dbf1357f8c6688436025715ba6fb0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-309-s1-freeze-exact-head-e0de8d49-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-309-s1-freeze-flag-exact-head-b9c3bb75.md",
   "source_digest": "1f4d09defd0c886fd6b4601533517f73a5ca8d8e8781e5126ad732a48ac908ed",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-309-s1-freeze-flag-exact-head-b9c3bb75.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-310-closing-verdict-flag-blocking-0-c313b0fe-pin-follow-up-codex.md",
   "source_digest": "aeef439740e89c5c69f7e2184175ff413c6a25bb9d8806306901134d20c58b97",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-310-closing-verdict-flag-blocking-0-c313b0fe-pin-follow-up-codex.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-310-exact-head-e064a660-ci-green-claude-closing-delta-review.md",
   "source_digest": "4ec116f49e6f8e0480731372b85980c872a44c84ca679fa5ac36eca3ab45a20b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-310-exact-head-e064a660-ci-green-claude-closing-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-310-exact-head-e064a660-claude-closing-delta-pass-weak.md",
   "source_digest": "05f4d6d7b8dd00a67988e5c3e9545755e9b2299133f97b0b68b987ff80505948",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-310-exact-head-e064a660-claude-closing-delta-pass-weak.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-310-exact-head-e064a660-cli-envelope-projection-regression-fixed.md",
   "source_digest": "ca5d4513c5a6f2f34f543c644a9168d8a6c50d3ed6a22c6298d8b62414d0610b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-310-exact-head-e064a660-cli-envelope-projection-regression-fixed.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-311-doc-only-plan-confirm-claude-closing-review-request.md",
   "source_digest": "c6d604a899f88e7c371d214dc510ca26eaf95beff19d5e48500ff994fb0d4eb5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-311-doc-only-plan-confirm-claude-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-311-exact-head-c0362028af2f.md",
   "source_digest": "cfcbf1f0317aa28328113a850e457023730d4b268b49f298d0f266f6ff75f9e4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-311-exact-head-c0362028af2f.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-311-exact-head-f364e48c-ci-green-claude-closing-review-wake.md",
   "source_digest": "596f9b3aa0e041959a372df1109aac84547940e7a47ed8cfb627b27c9bd8bf32",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-311-exact-head-f364e48c-ci-green-claude-closing-review-wake.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-311-pass-weak-blocking-0-merge-f364e48c-pr-302-codex-pass-merge-2edb621e.md",
   "source_digest": "bbb39604a69b26321dff119cfa16f7e0abc70d6c785900b023bdf6c25253e3d4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-311-pass-weak-blocking-0-merge-f364e48c-pr-302-codex-pass-merge-2edb621e.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-312-closing-verdict-flag-blocking-3-21e3efa8-version-token.md",
   "source_digest": "9a99b83b2a2ee7e4a6175e8631481a0de5bc982d3294015090e4a0a6f68e4107",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-312-closing-verdict-flag-blocking-3-21e3efa8-version-token.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-312-control-manifest-explicit-exclusion-new-exact-head-38e00423-claude-delta-review.md",
   "source_digest": "aed645c3959bd26f016b07bd2c762800db0921283d0237ec764abbdbfa73ae6a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-312-control-manifest-explicit-exclusion-new-exact-head-38e00423-claude-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-312-delta-verdict-flag-blocking-1-bf499ea8-control-manifest.md",
   "source_digest": "7a1e40a9accd1a90a6327c313b5460c3bd09b7910561598a4fdedbeac256869e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-312-delta-verdict-flag-blocking-1-bf499ea8-control-manifest.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-312-exact-head-21e3efa8-claude-non-author-pair-freeze-review-request.md",
   "source_digest": "1c24b9cf551c71446c54f07c42e1b930ea8125cbafc9f7c9121bee18d4e75890",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-312-exact-head-21e3efa8-claude-non-author-pair-freeze-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-312-exact-head-38e00423-ci-green-claude-closing-delta-review.md",
   "source_digest": "51843924ca483c80a37d4698b62b45e308054ce75ea22964bb75559172677d98",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-312-exact-head-38e00423-ci-green-claude-closing-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-312-flag-remediation-new-exact-head-bf499ea8-claude-delta-review.md",
   "source_digest": "6162723327f85cee16324c81e0828d85c493b239f89c5f6e41539dc4dab5a324",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-312-flag-remediation-new-exact-head-bf499ea8-claude-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-313-codex-claude-worker-worktree-non-author-closing-reviewer.md",
   "source_digest": "b4c271a0bdb9e57e7c048e59f40ae695a361e8f45f8dfd5307784f9978c9b3c4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-313-codex-claude-worker-worktree-non-author-closing-reviewer.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-313-d2-d-pass-blocking-0-exact-head-49a01579-merge.md",
   "source_digest": "fb218013946320538097161237d3d8402c623c468ed1d6a7ee76f2b04add2c12",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-313-d2-d-pass-blocking-0-exact-head-49a01579-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-313-exact-head-49a01579-b-1-remediation-claude-delta-review.md",
   "source_digest": "dfa9d62daab546576a09df164ae943dea0eb8d3c77195391064bf79b2702b751",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-313-exact-head-49a01579-b-1-remediation-claude-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-313-exact-head-7e00ecc5-all-ci-green-claude-closing-review-ready.md",
   "source_digest": "230a6743bfa9d5784ad34e29df361947b36bfc992969eb4b8e81244097a75728",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-313-exact-head-7e00ecc5-all-ci-green-claude-closing-review-ready.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-313-exact-head-a21ce820-ci-orphan-deliverables-blocking-follow-up.md",
   "source_digest": "1dc250a9814486a1c1d70bebdb303d9c7a60fe5424174f3c17bc6843408a4493",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-313-exact-head-a21ce820-ci-orphan-deliverables-blocking-follow-up.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-313-exact-head-a21ce820-d2-d-cross-review-flag-blocking-3.md",
   "source_digest": "dc3f4d6d89d1565ca445e7112b3da92f8d5f0447a02a30919103fad1705ae0e8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-313-exact-head-a21ce820-d2-d-cross-review-flag-blocking-3.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-313-flag-blocking-1-7e00ecc5-maxbuffer-0.md",
   "source_digest": "d9c41f351bbe327b189bf8f90a2367bd9c62ef0cdbf8660b95686da74f779722",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-313-flag-blocking-1-7e00ecc5-maxbuffer-0.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-313-new-exact-head-7e00ecc5-formatting-only-ci-remediation-claude-closing-review.md",
   "source_digest": "242fedea0c24e4596d02884084fb65fc7bd8fbdde7664fd739a614e5b2cf715c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-313-new-exact-head-7e00ecc5-formatting-only-ci-remediation-claude-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-313-new-exact-head-7e1114f9-d2-d-blocking-remediation-claude-delta-review.md",
   "source_digest": "ec0837a1376191da0b014f458c4c27eb33f6daa02ade8aa02acc89730f6c2486",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-313-new-exact-head-7e1114f9-d2-d-blocking-remediation-claude-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-313-remediation-ownership-moves-to-codex-no-overlap.md",
   "source_digest": "80a6ba5b3839a19a6a5d6bd3b1036d00b2c0d3ad00bc8343d687d47da59b89f2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-313-remediation-ownership-moves-to-codex-no-overlap.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-315-2988fc3b-delta-claude-ci.md",
   "source_digest": "2a229025a934611b9921624afb5fe7ac03afbdb273b1b21f3570d7d0d156750a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-315-2988fc3b-delta-claude-ci.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-315-canonical-remediation-exact-head-aa38cc67.md",
   "source_digest": "24d51b9958775124aa2dc79bcf7fc62e9a9b7b96dcd20f9554d49454ac1eba13",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-315-canonical-remediation-exact-head-aa38cc67.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-315-ci-evidence-digest-remediation-exact-head-52be26f2.md",
   "source_digest": "8f1a4626fe15e3b384fefc71bddb58210a9cafa0d3412fd32af542ebe3b21463",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-315-ci-evidence-digest-remediation-exact-head-52be26f2.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-315-ec02fc12-closing-review-claude-ci-green.md",
   "source_digest": "0fe6779d252028bcb901012c4b9c541190426bd0fdce016580e5e2e0c778ccb1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-315-ec02fc12-closing-review-claude-ci-green.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-315-ec02fc12-flag-blocking-1-validsymlink-backslash-target.md",
   "source_digest": "7d61cd6d71cb94d1f67f36423fdb8cad39d216fb73b1ce20b532305368d663c5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-315-ec02fc12-flag-blocking-1-validsymlink-backslash-target.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-315-exact-head-aa38cc67-all-ci-green-claude-closing.md",
   "source_digest": "9ba0cc27a6ee2577e4e7af93305e822c0b18d57e0d4e2c946ce87ea7714d2cfe",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-315-exact-head-aa38cc67-all-ci-green-claude-closing.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-315-exact-head-ec02fc12-all-ci-green-claude-closing-ready.md",
   "source_digest": "fcfc58cbbdac12db91b4b8e3eea3df6cc4e729b4367cdc386d2e94c09b2f1f6e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-315-exact-head-ec02fc12-all-ci-green-claude-closing-ready.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-315-exact-head-ec02fc12-claude-closing-review-request.md",
   "source_digest": "76f0729c498c68969ca6d38d6c95e2dc1e7f7842c320550b80e07e7f053267a6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-315-exact-head-ec02fc12-claude-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-315-flag-remediation-exact-head-2988fc3b-claude-delta-review.md",
   "source_digest": "320495d3a50edbd031fcc88dea419dc895980c311fdd693c2e682e6cb6d5682e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-315-flag-remediation-exact-head-2988fc3b-claude-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-315-pf-2-materializer-pass-blocking-0-exact-head-aa38cc67-merge.md",
   "source_digest": "55b67224e04803a474219801301ff48de872ab48fd93e0ff4cfd568cb36f2b5e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-315-pf-2-materializer-pass-blocking-0-exact-head-aa38cc67-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-316-315-ci-green-reviewer-verdict.md",
   "source_digest": "8d9b9aba54d56b6940392336313b4bfb208ce957b156d23f6f6282a50b877a61",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-316-315-ci-green-reviewer-verdict.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-316-62cfab64-d3a-freeze-review-claude-ci-green.md",
   "source_digest": "a030a62b78e85f83318d841c0312952262522c031150f8bfa8d4fef94179256f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-316-62cfab64-d3a-freeze-review-claude-ci-green.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-316-71511b1f-flag-blocking-2-live-attestation-wake.md",
   "source_digest": "57ce329515c9084354d171e22b09d3bba175159e6b300d82f27e54fd94f14b09",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-316-71511b1f-flag-blocking-2-live-attestation-wake.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-316-a5bc6b82-delta-claude-ci.md",
   "source_digest": "4442cea383d9b7b20efb1b1b00e89dcef970e1592b9ad486c74878465c54d815",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-316-a5bc6b82-delta-claude-ci.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-316-ci-remediation-exact-head-71511b1f-claude-delta-review.md",
   "source_digest": "71a20888875d1b2c3f8a53511ee8c644d9d35e3eec96591178bf8eb968d13815",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-316-ci-remediation-exact-head-71511b1f-claude-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-316-d3a-freeze-pass-blocking-0-exact-head-a5bc6b82-merge.md",
   "source_digest": "50bdaeae061938ca446095bdefe65acaf140142d9023b3b617e053fa866d6f0f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-316-d3a-freeze-pass-blocking-0-exact-head-a5bc6b82-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-316-exact-a5bc6b82-all-ci-green-closing-verdict-required.md",
   "source_digest": "ec5b79085b34192d4b16270f65827f1304cdd806784702518bd5faae8a42370f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-316-exact-a5bc6b82-all-ci-green-closing-verdict-required.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-316-exact-head-62cfab64-claude-review.md",
   "source_digest": "3d8aeb57f65af5226c3a5a716c3144231cc2e59a88a63b2a9ec0d252e3fb3491",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-316-exact-head-62cfab64-claude-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-316-exact-head-71511b1f-all-ci-green-claude-closing.md",
   "source_digest": "38986c2775f915f62bc42fea9f1f5774ad3821adaa2d24dc5aaf969cddc768b1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-316-exact-head-71511b1f-all-ci-green-claude-closing.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-316-flag-remediation-exact-head-a5bc6b82-claude-delta-review.md",
   "source_digest": "66d673742b6ba175b3a412897d3b6188b70b7e84ba24472bd23e0094aed6d248",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-316-flag-remediation-exact-head-a5bc6b82-claude-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-317-51a373e0-flag-blocking-1-partial-clone-promisor-lazy-fetch-network-0.md",
   "source_digest": "03999fd8641ba65b46bb827a57c2b4a2517e8b652ea6328f6e05973ff8830472",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-317-51a373e0-flag-blocking-1-partial-clone-promisor-lazy-fetch-network-0.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-317-51a373e0-pf-3-freeze-closing-review-claude-ci.md",
   "source_digest": "da29d3a47d0b1fe3a6511e48bd97b49b11d1e80c8e0ce5df170c5893409f82c9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-317-51a373e0-pf-3-freeze-closing-review-claude-ci.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-317-exact-51a373e0-all-ci-green-closing-verdict-required.md",
   "source_digest": "685c72a62d556a25d71af325f17f11eb8cf4294d1d544173eb99f5d0878e9323",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-317-exact-51a373e0-all-ci-green-closing-verdict-required.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-317-exact-head-348ad3da-closing-delta-review-pass-merged-140de959.md",
   "source_digest": "62da4ca907d8550a7b6936b2821c895aa918d0d066210c2582f71f0acd0acca7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-317-exact-head-348ad3da-closing-delta-review-pass-merged-140de959.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-317-merge-path-wrapper-receipt-0-gh-merge-d2-d.md",
   "source_digest": "fdaf527e377a4b0908cb0ede1d050c4dc3622b70daa6b0e5275cff2ed81a3c19",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-317-merge-path-wrapper-receipt-0-gh-merge-d2-d.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-317-pf-3-flag-correction-exact-head-348ad3da.md",
   "source_digest": "9a65ea664c6c6a4586ff2661f008ff2762062bc1c65988d9f9a06952beab08e0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-317-pf-3-flag-correction-exact-head-348ad3da.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-317-pf-3-pair-freeze-claude-closing-review-exact-head-51a373e0.md",
   "source_digest": "d7c2d056cfcb316556b67141cdbb05d6e7ddda0abf6b506777480517de42dc55",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-317-pf-3-pair-freeze-claude-closing-review-exact-head-51a373e0.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-318-8ff56bc4-d3a-inbox-schema-freeze-closing-review-claude-ci.md",
   "source_digest": "1fb7ad2640b6b501e7df1a118d399de187360e1d079bc32000c0dc4846cabdb2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-318-8ff56bc4-d3a-inbox-schema-freeze-closing-review-claude-ci.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-318-claude-blind-review-pass-exact-head-8ff56bc4-merge-ready.md",
   "source_digest": "a011a1b985e5567ec9ffb3f28daa65f9d40bacc0ccac28aa092ecb24ca1541f3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-318-claude-blind-review-pass-exact-head-8ff56bc4-merge-ready.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-318-d3a-schema-follow-up-claude-review-exact-head-8ff56bc4.md",
   "source_digest": "80c33f30fe22b5d536d84d8b8e03d238105856086f5de14aec6afb59f121d756",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-318-d3a-schema-follow-up-claude-review-exact-head-8ff56bc4.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-318-exact-8ff56bc4-all-ci-green-closing-verdict-required.md",
   "source_digest": "9150c19b203a79e6e11398acb3ae8abb706e668dfcdd9e03c23e10b5faa79479",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-318-exact-8ff56bc4-all-ci-green-closing-verdict-required.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-318-exact-head-8ff56bc4-closing-review-pass-merged-ca9d231b.md",
   "source_digest": "79d27e76bb4c0e15f5b67121d0146e8a8772babd495d0167a419ae312ea15754",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-318-exact-head-8ff56bc4-closing-review-pass-merged-ca9d231b.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-318-exact-head-pass-ci-green-immediate-merge-request.md",
   "source_digest": "e34b34a95c8621ce6ad1d37bb0a2eb9b28d4c53cf84e34c2891790446d4130c1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-318-exact-head-pass-ci-green-immediate-merge-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-318-merge-path-policy-violation.md",
   "source_digest": "7a21ec27165c766d51de00541b968ac5fc9f7bfafc18887383cff3152246f075",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-318-merge-path-policy-violation.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-320-closing-review-claude-non-author-exact-head-7529419a-bdda726a.md",
   "source_digest": "103660a5b9636c40d2de8f61104ba0077fe3d37f2b564e13d0421078a3d6f5c5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-320-closing-review-claude-non-author-exact-head-7529419a-bdda726a.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-advisor-progress-decision-codex-must-execute-review-authorship-is-machine-checkable-via-trailer.md",
   "source_digest": "45827433ea06c825950090c9c6d216170c9a4f4b9bb153a937222af38f928622",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "git log --format=%B <base>..<head> | grep -i co-authored (再現可能な検証コマンド)"
   ],
   "reason": "hybrid運用でPR著者familyの機械的判別に使える、検証済みの非対称な検出手段。cross-review族分離の実務判断に直結する。",
   "adopt": {
    "memory_id": "memory:feedback:commit-co-authored-by-author-family-claude-trailer--c3c66869470a",
    "kind": "feedback",
    "title": "commitのCo-Authored-Byトレーラーでauthor familyを非対称に判別できる: Claude著は陽性判定、trailer不在は消去法",
    "tags": [
     "authorship",
     "cross-review",
     "hybrid-coordination"
    ],
    "registration": {
     "operation_id": "curation-424:45827433ea06c825",
     "memory_id": "memory:feedback:commit-co-authored-by-author-family-claude-trailer--c3c66869470a",
     "source_path": ".ut-tdd/memory/feedback-commit-co-authored-by-author-family-claude-trailer--c3c66869470a.md",
     "content_digest": "fa1be58a0c969ddea6dc80673363aaed3e825e21306a67c5beaacab02fa23c80",
     "exit_code": 0
    },
    "receipt_digest": "e5f795b3b103f7576d24be876c94744ea6c641aa2ae3b229a8f014777d1532e7"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-authorship-settled-claude-authored-dbf59e1b-to-0a6fd103-codex-must-review.md",
   "source_digest": "337166cdbc4b0e4f5ba414afee61f3baf8844001b887bb78c16ac8d4e320b107",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-authorship-settled-claude-authored-dbf59e1b-to-0a6fd103-codex-must-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-blocking-verdict-literal-path-delegated-reviewer.md",
   "source_digest": "0a7b52b7802120ddf1da065807d048436f011ebb5fb9deb5826ebb100cbc116e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-blocking-verdict-literal-path-delegated-reviewer.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-bootstrap-merge-pr-head-live-projection.md",
   "source_digest": "010206ebc2ea5f5b9849ddd99719564b70d50d1d9e753bbc2d6ea655157df8e7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-bootstrap-merge-pr-head-live-projection.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-closing-review-flag-blocking-3-exact-head-7529419a-b-1-cli-port-oracle-exact-head-mutation.md",
   "source_digest": "a727f6c7f05e1cb8b56ff7c2edbaabdc73474d1e163e5b7b0f316ed88b8fb37a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-closing-review-flag-blocking-3-exact-head-7529419a-b-1-cli-port-oracle-exact-head-mutation.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-closing-review-pass-blocking-0-at-exact-head-0a6fd103-partial-independence-disclosed.md",
   "source_digest": "5f5e2bbfc2552bbe5050b2f5e446175101011c6cb2d9c83e95560d990d048f14",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-closing-review-pass-blocking-0-at-exact-head-0a6fd103-partial-independence-disclosed.md",
    "screen:pr-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-codex-review-timeout-root-cause-is-main-delegation-lacking-literal-verdict-path-bootstrap-circularity.md",
   "source_digest": "15b5adffb199c89628ce5066fa4e06cbdbf58355da6e2e0fc60aee458bb641fd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-codex-review-timeout-root-cause-is-main-delegation-lacking-literal-verdict-path-bootstrap-circularity.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-delta-closing-review-claude-non-author-exact-head-dbf59e1b.md",
   "source_digest": "30d091b7cf45198bd970f64dec5cd192580d3706a1bfc89398436f8f96ee7a6f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-delta-closing-review-claude-non-author-exact-head-dbf59e1b.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-delta-closing-review-pass-blocking-0-exact-head-dbf59e1b-b-1-b-2-b-3-319-wrapper-merge.md",
   "source_digest": "3d8a2b01e8c964ff396ff01f5b6e5f8c67c35c69437313775dd3735d813fd13d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-delta-closing-review-pass-blocking-0-exact-head-dbf59e1b-b-1-b-2-b-3-319-wrapper-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-escalating-to-po-after-five-reissues-zero-codex-verdict-advisor-condition-met.md",
   "source_digest": "c908f0f0184444ba09646dbd27e38f45000ae9b697c63f54307d500347501ccb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-escalating-to-po-after-five-reissues-zero-codex-verdict-advisor-condition-met.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-canonical-self-bootstrap-follow-up.md",
   "source_digest": "88c36642b7bb5956a8486d4bd897d83b13352ba5892fc8835df29ffdb48e3397",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-canonical-self-bootstrap-follow-up.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-claude-closing-review-request-canonical-wake.md",
   "source_digest": "84391ac0a89ee95e0fc8b09be0361c2bc18b09dd98c1ded4f1ba41b8b4cfa91c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-claude-closing-review-request-canonical-wake.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-claude-closing-review-request-manual-reissue.md",
   "source_digest": "623d9b3d831914e0c9116da3e23b9b7d71d3ca39c750fb6792b73e85a409a3c3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-claude-closing-review-request-manual-reissue.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-claude-closing-review-request-non-author.md",
   "source_digest": "aec2fdb596812e11d74e5afe2346b595ca6ea2f5417b97ae6da591aee0269004",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-claude-closing-review-request-non-author.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-claude-closing-review-request-reissue.md",
   "source_digest": "44af77c7ad0c790da09709d08a6e81b5ec291d1a7584eb79c028c0c9858f5a17",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-claude-closing-review-request-reissue.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-claude-closing-review-request.md",
   "source_digest": "1d5deed8706d62a215191510ed514f8500caba2f674730cc8b57a24489f9f52e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-claude-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-codex-non-author-delta-review-pass.md",
   "source_digest": "d6234a77721e08349c3375237fffe5146fa6265e4317f8aec39db92b89e31579",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-codex-non-author-delta-review-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-codex-non-author-review-timeout-and-routing-correction.md",
   "source_digest": "f10962bca6c19672510e1df4b77110992ccf960802e6bbd517f3457fbc6d01c3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-0a6fd103-codex-non-author-review-timeout-and-routing-correction.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-514d8efd-ci-red-3-3-memory-gate-blocking-1.md",
   "source_digest": "795d93bccae3320dac91720adbe3b5c9c54d2b338e1df5d4aff797c7de69fc26",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-514d8efd-ci-red-3-3-memory-gate-blocking-1.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-dbf59e1b-all-ci-green-delta-review.md",
   "source_digest": "219bcc71755cf0f3285f597be32b27ca2061cf5165be8ba7c9901b8df6c8c014",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-dbf59e1b-all-ci-green-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-root-workspace-closing-verdict.md",
   "source_digest": "1128fb38b72eaa5dc40efc95eef57f0b0c7c736814b66be58f630b2ceb2dfc0c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-exact-head-root-workspace-closing-verdict.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-flag-blocking-1-inbox-filename-truncation-drops-operationid-retry-dispatch-fails.md",
   "source_digest": "ff79b8c1352bf1a22ac6a226fa5dae99cc028291800eb0ee16eb72823fc49ece",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-flag-blocking-1-inbox-filename-truncation-drops-operationid-retry-dispatch-fails.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-merge-blocked-on-missing-receipt-codex-delegated-review-must-complete-to-write-it.md",
   "source_digest": "2e2abb104781b34b8b6ec37669f8093dc51cb9c544b8369accee947524669926",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-merge-blocked-on-missing-receipt-codex-delegated-review-must-complete-to-write-it.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-merged-main-11adcea1-d3a-wired-bootstrap-circularity-resolved-and-my-wrapper-claim-corrected.md",
   "source_digest": "078f62a546b194ca49e7a27380e570e739b5d21af931297b553d7f4f0d34751b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-merged-main-11adcea1-d3a-wired-bootstrap-circularity-resolved-and-my-wrapper-claim-corrected.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-review-request-declined-family-separation-and-pr-320-pass-reaffirmed-at-bdda726a.md",
   "source_digest": "67ca0baf98c567b76414ecb33a58707427ff787ad1fce7f47642e9e30cf68024",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-review-request-declined-family-separation-and-pr-320-pass-reaffirmed-at-bdda726a.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-self-bootstrap-delegated-review-pass-verdict-file-path-receipt-0-merge-review-verdict-contract-env.md",
   "source_digest": "e07f298b24456e00f536130c6784be7e1f430080c609ea1e61af5b1601e2c356",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-self-bootstrap-delegated-review-pass-verdict-file-path-receipt-0-merge-review-verdict-contract-env.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-self-bootstrap-exact-head-0a6fd103-follow-up.md",
   "source_digest": "6d6160788e71c3ecd0ca9544b3fabf345dcdf05e0bb0cd82ee3944b6b95d33fb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-self-bootstrap-exact-head-0a6fd103-follow-up.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-319-verdict-path-exact-head-0a6fd103-ci-3-3-success-u-rvatt-029-behavioral-codex-delta-review.md",
   "source_digest": "f6b31f8276b479e7d36a2e8bcc8bc7cf760ae68b124730df0dea9ed0c9519e99",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-319-verdict-path-exact-head-0a6fd103-ci-3-3-success-u-rvatt-029-behavioral-codex-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-320-closing-pass-blocking-0-wrapper-merge-bun-windows-d2-b-writereceipt-eexist-merge.md",
   "source_digest": "f5a8d924b3e297b1a1dad57a454e6eca0f561442431f54b0062379b74704d97b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-320-closing-pass-blocking-0-wrapper-merge-bun-windows-d2-b-writereceipt-eexist-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-320-conflict-resolved-by-merge-commit-35b808c8-claude-authored-resolution-needs-codex-delta-review.md",
   "source_digest": "a3d03d516c6ffcd92bc3ef198a198463666ef3b2e37672b3bab1e9ec4ecdcfb4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-320-conflict-resolved-by-merge-commit-35b808c8-claude-authored-resolution-needs-codex-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-320-exact-head-35b808c8-codex-delta-review-pass.md",
   "source_digest": "c5d689962b979bcf86b8e94fce36abed69fa2a0f8fb3cb072b7422dbbc4a3730",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-320-exact-head-35b808c8-codex-delta-review-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-320-exact-head-all-ci-green-closing-verdict.md",
   "source_digest": "f96022defc210a8081f33a21225bc1c3535963e64020a0c305d6c2c53e46b31a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-320-exact-head-all-ci-green-closing-verdict.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-320-exact-head-bdda726a-claude-closing-review-request.md",
   "source_digest": "e06e6eb79a583a4c1a3006485239cadc4def4ddcbe9b1cb4a8452972c7b3c4fb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-320-exact-head-bdda726a-claude-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-320-merged-10b7b3c7-wrapper-path-blocked-by-new-d3a-defect-issue-328.md",
   "source_digest": "cc2726cf86fe3ed5558a3c35c9c1d173c6fa57c4f33e134a17b8b2de0ae77f5f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-320-merged-10b7b3c7-wrapper-path-blocked-by-new-d3a-defect-issue-328.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-320-pf-3-root-workspace-closing-review.md",
   "source_digest": "d2e91283f8feb2e26ae107f2685d0793077ac7dc5941812f60e48d9a6604a205",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-320-pf-3-root-workspace-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-320-verdict-already-delivered-2026-08-14-not-unresolved-reissue-loop-needs-stopping.md",
   "source_digest": "e458b0a2489dd1dcf8047f41f525837c0731347845e3d2ac5ec94ca77d09f6c4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-320-verdict-already-delivered-2026-08-14-not-unresolved-reissue-loop-needs-stopping.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-320-wrapper-deny-b-bun-d2-b-writereceipt-node-receipt.md",
   "source_digest": "b6381c906000201efb9782d5df9576b9ea5ec6e77478c204b85f0ac4ab8d64d5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-320-wrapper-deny-b-bun-d2-b-writereceipt-node-receipt.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-323-closing-review-cancellation-superseded-by-324.md",
   "source_digest": "b76ed8952502315ceef4209fa5c7fac72c5d520ddb8f703f3230b41a5ea887af",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-323-closing-review-cancellation-superseded-by-324.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-323-closing-review-flag-blocking-1-exact-head-e58c63f4-u-rvmg-024-source-text-assertion-23bfccb0f98fe3ca.md",
   "source_digest": "009433cfa85764cc605f6bc257e58ab4796eee9119861950cb64a1a41e95e715",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-323-closing-review-flag-blocking-1-exact-head-e58c63f4-u-rvmg-024-source-text-assertion-23bfccb0f98fe3ca.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-323-exact-head-e58c63f4-all-ci-green-closing-review.md",
   "source_digest": "f45cd37ea402e5f3c577e70015ac8b1b362503089d3e3f277941e6a445a14488",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-323-exact-head-e58c63f4-all-ci-green-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-62a722c8-delta-review-table-fixed-blocking-4-remain.md",
   "source_digest": "2e7bdf81b504a13fa2c8793c8dd51570f58f38c3cda347621720b88699658803",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-62a722c8-delta-review-table-fixed-blocking-4-remain.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-aaf5fc7d-oracle-declaration-still-invalid.md",
   "source_digest": "767314f1be1c164c206695bddd0bf0441e44995d4c6d05b05374a6eea4824160",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-aaf5fc7d-oracle-declaration-still-invalid.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-claude-closing-review-adapter-doc-bun-rule-drift-ci-3-3-green.md",
   "source_digest": "8cacad239de29187afdac17c066169b22cee7602182fc6dc8f1394811c416408",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-claude-closing-review-adapter-doc-bun-rule-drift-ci-3-3-green.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-closing-review-flag-blocking-1-at-exact-head-1a6cbb1d-bare-filename-bun-form-fail-open.md",
   "source_digest": "5cf5f07adf986004327641299f45793b4e50a0c32b8fd8d949918d2c83feb3f4",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "regexベースのlintルールを検証するときの2つの具体的手法(最小反証入力ペア/canonical source実import)。シェルヒアドキュメントでのbackslash欠落という再現性のある罠も含む。",
   "adopt": {
    "memory_id": "memory:feedback:regex-lint-source-import-detected-missed--8bdca5d2e153",
    "kind": "feedback",
    "title": "regexベースのlintルールを検証するときは、正本sourceをimportして実挙動を測り、DETECTED/MISSEDを一意に分ける最小入力ペアを作る",
    "tags": [
     "debugging-technique",
     "lint-verification",
     "regex-testing"
    ],
    "registration": {
     "operation_id": "curation-424:5cf5f07adf986004",
     "memory_id": "memory:feedback:regex-lint-source-import-detected-missed--8bdca5d2e153",
     "source_path": ".ut-tdd/memory/feedback-regex-lint-source-import-detected-missed--8bdca5d2e153.md",
     "content_digest": "793a05e00d3b544e803e649a8cdfe148aa629ab593b76b16546021f90ee79a3a",
     "exit_code": 0
    },
    "receipt_digest": "a2eda17e783f8a965aec973f1731b1d30ed7e37fbe54f027e07a24f8b92618bf"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-d17e74fb-full-re-measurement-completes-delta-pass-four-axes-verified.md",
   "source_digest": "b131169d1168a5619ea105e6dcd0cf3c80ea7599f48c736b69e4c2bc7d799372",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-d17e74fb-full-re-measurement-completes-delta-pass-four-axes-verified.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-d7b51a97-delta-flag-blocking-1-bun-fail-open.md",
   "source_digest": "9514fd8e894557332e7d6f9b418ebbacb7c74e899e7c5feeef1edfa4a532afc6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-d7b51a97-delta-flag-blocking-1-bun-fail-open.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/personal-path)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-delta-review-blocking-2-doctor-bun-exact-head-d7b51a97-ci-3-3-success.md",
   "source_digest": "23df6fceec963c644cf6825dfba5ef322c6a4c06d4f9425f350137018dee1aea",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-delta-review-blocking-2-doctor-bun-exact-head-d7b51a97-ci-3-3-success.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-delta-review-blocking-4-exact-head-61221afe-ci-3-3-success.md",
   "source_digest": "589654ef822110a1ff950c1124bef2e5f36ab360746df636ad5e723373c78634",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-delta-review-blocking-4-exact-head-61221afe-ci-3-3-success.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-exact-head-2431ce64-biome-lint-only-failure-doctor-and-full-vitest-green.md",
   "source_digest": "abc1a66d9f98be8e70effe40ac87d936b2e776d759a9adb9cead95ccdf20f78f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-exact-head-2431ce64-biome-lint-only-failure-doctor-and-full-vitest-green.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-exact-head-61221afe-delta-flag-blocking-2.md",
   "source_digest": "91f1d9956a7851d29b98e90c5ed91fc1af341bf882c4bc39e6d3e6b4db469875",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-exact-head-61221afe-delta-flag-blocking-2.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-exact-head-643e49fb-bun-execution-form-coverage.md",
   "source_digest": "3eaa1bbab35a6a8ec92b51cb2844a47590626c0dd85cecf9156d224458bb4606",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-exact-head-643e49fb-bun-execution-form-coverage.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-exact-head-d17e74fb-claude-closing-review-request.md",
   "source_digest": "40cd89f63b9919972f7fcf728243afb359cc24c396ae2919bf30cd7a18ed2f93",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-exact-head-d17e74fb-claude-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-exact-head-d17e74fb-closing-delta-review-pass-blocking-0.md",
   "source_digest": "f067294dc042095f2a5cbe8be4aa494f56f3666a76cc46e4dc2157d4826e7b80",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-exact-head-d17e74fb-closing-delta-review-pass-blocking-0.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-local-aaf5fc7d-blind-review-flag-blocking-4.md",
   "source_digest": "8062769c3f5f2dfa2b0c7890debd5d5661facec19e7d3caaf9548c4414e1c074",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-local-aaf5fc7d-blind-review-flag-blocking-4.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-local-commit-2431ce64-green-push-remote-643e49fb-ci-red.md",
   "source_digest": "e22ff4db996e83249cfec17691563860ccf4dead82bb29e638373d8965fc222a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-local-commit-2431ce64-green-push-remote-643e49fb-ci-red.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-merged-main-b15084c1-and-pr-320-now-needs-rebase-plus-issue-326-filed-for-remaining-bun-surfaces.md",
   "source_digest": "17d5ddbbdf724f1f1e5255e282e5b8d003374fa2c31dff65d875e2dc65b9e9e3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-merged-main-b15084c1-and-pr-320-now-needs-rebase-plus-issue-326-filed-for-remaining-bun-surfaces.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-oracle-62a722c8-remote-head-ci-3-3-green-author-family-closing-review.md",
   "source_digest": "d2885979778ab15df783fd1dc73e4c3eb72051ba4ab8c4a04cb19cf2f4e1054f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-oracle-62a722c8-remote-head-ci-3-3-green-author-family-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-plan-l7-462-completed-draft-plan-l7-488-flag-blocking-4-exact-head-007f9db1.md",
   "source_digest": "b19e08e9bd9b95463d245006799e528c942606f607d2910518ae8b93e2818e90",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-plan-l7-462-completed-draft-plan-l7-488-flag-blocking-4-exact-head-007f9db1.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-remote-head-643e49fb-d7b51a97-superseded-6-3-codex-in-flight.md",
   "source_digest": "5e701164623e8648dc9e6cfc7f9e87171487e5761a1109d454c496f088a1b533",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-remote-head-643e49fb-d7b51a97-superseded-6-3-codex-in-flight.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-sha-head-643e49fbf69d-ci-3-3-failure-u-rdrift-005-008-4.md",
   "source_digest": "5bc05b2d49e05cef4f5911e992efef49a2762d0d087cb63520a7ea8bd0e1414f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-sha-head-643e49fbf69d-ci-3-3-failure-u-rdrift-005-008-4.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-324-use-existing-plan-l7-462-for-trace-and-decision.md",
   "source_digest": "0cb4b9dfb3ae70457002008668e304abea71745921479b2e3cf9c58d8ece01c0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-324-use-existing-plan-l7-462-for-trace-and-decision.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-330-closing-review-pass-at-exact-head-f75798ab-blocking-0-advisory-2.md",
   "source_digest": "3236597d8592dafedb6328c5ab1457ad72436c9baa45bf5f063b81b5f15c0c69",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-330-closing-review-pass-at-exact-head-f75798ab-blocking-0-advisory-2.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-330-flag-blocking-1-completed-after-tests-green-at-is-a-violation-reason-code-not-a-schema-field.md",
   "source_digest": "03d4b10da53f6125d51044ada19f2614624b21ac7305698fb44871d75870730b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-330-flag-blocking-1-completed-after-tests-green-at-is-a-violation-reason-code-not-a-schema-field.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-330-head-churn-five-pushes-in-30-minutes-review-deferred-until-stable-head-with-green-ci.md",
   "source_digest": "9303ac60fdc63e5ccbaed26e14f0b15a7d3ed699d86765058f8da4d6eea78e0f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-330-head-churn-five-pushes-in-30-minutes-review-deferred-until-stable-head-with-green-ci.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-330-merged-main-1d68a10f-pf-4-landed-and-pf-5-251-pair-freeze-unlocked.md",
   "source_digest": "4e97270b2e1e3d9cbe5310b387d1b273683b297c7146dbedfea88e83a745569e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-330-merged-main-1d68a10f-pf-4-landed-and-pf-5-251-pair-freeze-unlocked.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-332-closing-review-flag-blocking-2-exact-head-b2b69a0a-draft-downgrade-and-309-of-373-identity-drift.md",
   "source_digest": "77f860a95667a5733ede547a98c76f6c265a710899bbeac47442b4d083fc2e11",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-332-closing-review-flag-blocking-2-exact-head-b2b69a0a-draft-downgrade-and-309-of-373-identity-drift.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-332-delta-review-at-bd2760a0-b-2-fixed-legacy-path-reuse-b-1-draft-status-still-blocks-merge.md",
   "source_digest": "d835e262a7cd1639b64fb5783fd80aa2a13f972e785a6732a570febe49591574",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-332-delta-review-at-bd2760a0-b-2-fixed-legacy-path-reuse-b-1-draft-status-still-blocks-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-332-fifth-review-flag-new-oracle-id-added-to-shrink-only-citation-debt-baseline-instead-d3d563a40d10ee99.md",
   "source_digest": "74761162d0197fb088b90b66e542a73d4ab48e48b111192114ab44ca6a4c518c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-332-fifth-review-flag-new-oracle-id-added-to-shrink-only-citation-debt-baseline-instead-d3d563a40d10ee99.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-332-fourth-review-flag-ci-red-root-cause-green-command-completed-at-later-than-corrected-tests-green-at.md",
   "source_digest": "1ecd87ca078051986619a8d280269a0610c8a45a140bd202644b64e3808e7c96",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-332-fourth-review-flag-ci-red-root-cause-green-command-completed-at-later-than-corrected-tests-green-at.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-332-merged-main-293663c9-memory-collision-safety-landed-after-six-review-rounds-with-fol-2bac09f2b8f474f1.md",
   "source_digest": "c6a948f8ea93a582e352887a56e368e7019dd064dd4235e3fd91333be545ea7c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-332-merged-main-293663c9-memory-collision-safety-landed-after-six-review-rounds-with-fol-2bac09f2b8f474f1.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-332-sixth-review-flag-stands-with-measured-remediation-declare-oracle-in-test-design-ins-5a7b54a4a269962e.md",
   "source_digest": "ece0a71be95f5c13d4270d201b95ba81a31cff05e99860c97d22d064718f982c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-332-sixth-review-flag-stands-with-measured-remediation-declare-oracle-in-test-design-ins-5a7b54a4a269962e.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-332-third-review-at-70c234d8-code-pass-but-review-evidence-records-pass-verdict-for-a-he-ca1e587fc28b924c.md",
   "source_digest": "6cafdfb257688b6c669222d82c8796965909f59e27f1f349f11854d4ef1d5147",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-332-third-review-at-70c234d8-code-pass-but-review-evidence-records-pass-verdict-for-a-he-ca1e587fc28b924c.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-333-closing-review-flag-exact-head-84a750a4-pf5-pair-freeze-predicate-c-requires-resolve-0c4eff4e6b5f06c7.md",
   "source_digest": "faadb4e5a81222e47be6a8ee7808d773c88247e5cd8bdc2c416e35aa07c45088",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-333-closing-review-flag-exact-head-84a750a4-pf5-pair-freeze-predicate-c-requires-resolve-0c4eff4e6b5f06c7.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-333-exact-head-15e76078-for-re-review.md",
   "source_digest": "14eaced7baa17287ce09df0cb54aee1b42d444e73862c122310ae60fb0bb6a8a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-333-exact-head-15e76078-for-re-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-333-merged-main-aaf348df-pf5-pair-freeze-predicate-c-rewritten-as-static-mapping.md",
   "source_digest": "c03274ae6f785e14cecfa3757e82fc13a7b8ee880c8666fb37682f8643083014",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-333-merged-main-aaf348df-pf5-pair-freeze-predicate-c-rewritten-as-static-mapping.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-334-closing-review-flag-exact-head-4c226c1e-u-relman-018-oracle-claims-3-identity-mutati-aae9d08e51319842.md",
   "source_digest": "5cb90198e11c438c28b575f8b235378689a74a649d2e83a75df32b5b789f6577",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-334-closing-review-flag-exact-head-4c226c1e-u-relman-018-oracle-claims-3-identity-mutati-aae9d08e51319842.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-334-exact-head-7fba4a05-for-re-review.md",
   "source_digest": "f9808f664e544a80d8d046bec1b1e9cfad9963ce63188bbb355a9e263eba6a01",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-334-exact-head-7fba4a05-for-re-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-334-merged-main-2a86771f-and-correction-snapshot-runner-tests-head-so-working-tree-mutat-ba74543d08548397.md",
   "source_digest": "7bb6b4734c78058c9cbd25bb99d6b2e747e8ded6936d85c764c2a7542d69bbb5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-334-merged-main-2a86771f-and-correction-snapshot-runner-tests-head-so-working-tree-mutat-ba74543d08548397.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-335-acfff279-verified-locally-5-of-5-green-and-b-1-mutation-survivor-reproduced-after-pa-828a41611d1ad321.md",
   "source_digest": "79d99c437ec1391168c74c76fd00864eab37e005f4276b499899da5d031bfc6c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-335-acfff279-verified-locally-5-of-5-green-and-b-1-mutation-survivor-reproduced-after-pa-828a41611d1ad321.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-335-closing-verdict-at-exact-head-acfff279-is-flag-blocking-2-already-returned-three-tim-a31c47fd10965424.md",
   "source_digest": "a64cc8ba8d35a243093fe72ac67c2c1dd948893b80166d6352cf47b88a6af374",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-335-closing-verdict-at-exact-head-acfff279-is-flag-blocking-2-already-returned-three-tim-a31c47fd10965424.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-335-exact-head-4d0b52d6-ci-now-green-closing-verdict-pass-confirmed-merge-withheld-becau-9a039fd68d7c60e2.md",
   "source_digest": "0b244af1034d52c75c365f551bb69267e916028fc4a573195fbdcd50c5f13302",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-335-exact-head-4d0b52d6-ci-now-green-closing-verdict-pass-confirmed-merge-withheld-becau-9a039fd68d7c60e2.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-335-exact-head-4d0b52d6-draft-unblock-and-wrapper-merge-request.md",
   "source_digest": "b42bd98ade82d8d175954bbe7ece89df6ff6892b1bb33da8269f3afab045bc17",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-335-exact-head-4d0b52d6-draft-unblock-and-wrapper-merge-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-335-exact-head-4d0b52d6-pass-blocking-0-both-blockings-fixed-and-verified-by-killed-muta-7cd11c3877d5909b.md",
   "source_digest": "a49a8a1ec0211f06eafa779d9098edbff0aa0e97dc8fcc29988c966ca97ad60e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-335-exact-head-4d0b52d6-pass-blocking-0-both-blockings-fixed-and-verified-by-killed-muta-7cd11c3877d5909b.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-335-fifth-duplicate-request-at-same-exact-head-4d0b52d6-standing-pass-restated-no-re-review.md",
   "source_digest": "7e6c1c8b82f25f691878d4d75c5e131e4a8a929e83c76d706e459b50074d72cc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-335-fifth-duplicate-request-at-same-exact-head-4d0b52d6-standing-pass-restated-no-re-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-335-merged-at-exact-head-4d0b52d6-under-po-approval-merge-wrapper-does-not-exist-so-gh-p-c0b5b96bf3a2dd4e.md",
   "source_digest": "cf20fc7b89e20d419760cfb09cde86f431a1b35bb71ed9ac9c4451806202d3f2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-335-merged-at-exact-head-4d0b52d6-under-po-approval-merge-wrapper-does-not-exist-so-gh-p-c0b5b96bf3a2dd4e.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-335-pf5-implementation-closing-review-flag-blocking-2-predicate-c-untested-mutation-surv-9c2643d13730f914.md",
   "source_digest": "a61481b5ba09b9aa8a0440403a53da8eeab127fa62dd85ee682b6896eb221b48",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-335-pf5-implementation-closing-review-flag-blocking-2-predicate-c-untested-mutation-surv-9c2643d13730f914.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-335-review-applies-to-exact-head-acfff279-after-behavior-invariant-parameter-object-refa-601db7c280615c67.md",
   "source_digest": "378aa18dc2ba9baa00077d8f9a6297e2533478f9e63c6f4c4fd1e698b8343890",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-335-review-applies-to-exact-head-acfff279-after-behavior-invariant-parameter-object-refa-601db7c280615c67.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-336-closing-review-at-65bb3c21-pass-blocking-0-audit-sink-moved-to-git-common-dir-outsid-a9289ecd1e0718ab.md",
   "source_digest": "8a76f94532c77f1b43b25d11f41ff394e8806d5e4e39f3de3c90738c9bdce391",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-336-closing-review-at-65bb3c21-pass-blocking-0-audit-sink-moved-to-git-common-dir-outsid-a9289ecd1e0718ab.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-336-d3a-design-freeze-closing-review-flag-blocking-3-digest-preimage-undefined-gitignore-05d92fd39697dc3f.md",
   "source_digest": "87ec1ea33e9e8223019a1bdf357d13c3fcdadc0a3b4e076d2254a7211b9f16e6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-336-d3a-design-freeze-closing-review-flag-blocking-3-digest-preimage-undefined-gitignore-05d92fd39697dc3f.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-336-exact-head-779aa93b-ci-fully-green-but-flag-blocking-3-stands-because-ci-does-not-in-34901f932ebaeb97.md",
   "source_digest": "6bf2ad5ab25efac81283f198c72b6f66ff8f95f1227f594c773518c4510f5ce4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-336-exact-head-779aa93b-ci-fully-green-but-flag-blocking-3-stands-because-ci-does-not-in-34901f932ebaeb97.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-336-merged-at-exact-head-65bb3c21-closing-the-d3a-custody-freeze-open-pr-count-reached-zero-on-2026-08-19.md",
   "source_digest": "2c8902a51c90ca68746c5f0bdeb0c7d09f844810c6f5ea21cf9438dbcdca24b7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-336-merged-at-exact-head-65bb3c21-closing-the-d3a-custody-freeze-open-pr-count-reached-zero-on-2026-08-19.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-336-re-review-at-93ca017f-three-blockings-fixed-grounded-in-existing-canonical-code-but-15f8c1e8c6863c46.md",
   "source_digest": "6b954d55ecd68457d156ceac1d1a1356c01d98e0b4b32951d5c2950ce8d3cca4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-336-re-review-at-93ca017f-three-blockings-fixed-grounded-in-existing-canonical-code-but-15f8c1e8c6863c46.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-336-re-review-at-ba26a580-audit-sink-outside-fence-exemption-same-model-retry-unauthoriz-e25499f54a46bfb1.md",
   "source_digest": "75c41c4040a3bbcb7c68fcc3f91987fd68f00db7f65cd02d56055434b86e28d5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-336-re-review-at-ba26a580-audit-sink-outside-fence-exemption-same-model-retry-unauthoriz-e25499f54a46bfb1.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-336-review-at-5f04b58d-audit-sink-moved-inside-cleanup-target-tree-empty-receipts-dir-ma-357da2f029718c33.md",
   "source_digest": "fb6a4846a95ab9740f676863e40710a6069bd2f17d048024d3b305b06450fd35",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-336-review-at-5f04b58d-audit-sink-moved-inside-cleanup-target-tree-empty-receipts-dir-ma-357da2f029718c33.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-337-closing-review-at-a274247d-pass-blocking-0-producer-fixed-to-session-log-ts-and-side-1c71e0312ebf398e.md",
   "source_digest": "7451da7bfae6ead21dffe4e1a7e85dbac35ad8b8ef32e075ce8b5bea556ed8e1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-337-closing-review-at-a274247d-pass-blocking-0-producer-fixed-to-session-log-ts-and-side-1c71e0312ebf398e.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-337-delta-review-at-5ba4d2df-aggregation-and-cost-blockings-resolved-session-coordinator-afe43a95b999eb05.md",
   "source_digest": "287a2ff0ac34612fc49d9c705a1dd12a93b729258ee8130e652adab62a581045",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-337-delta-review-at-5ba4d2df-aggregation-and-cost-blockings-resolved-session-coordinator-afe43a95b999eb05.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-337-merged-at-exact-head-a274247d-snapshot-fence-producer-frozen-to-session-log-extensio-63c911aaf097c13b.md",
   "source_digest": "7e66f92e4a7ad09496fe19b8041f36a2ff321718b006b08cb71abfe2baf88435",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-337-merged-at-exact-head-a274247d-snapshot-fence-producer-frozen-to-session-log-extensio-63c911aaf097c13b.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-337-re-review-at-63012368-inventory-digest-production-cost-115s-vs-5s-hook-budget-produc-071beedb22cfd7cb.md",
   "source_digest": "fcbac8061be35e9a1f44766244fc07e4d2bdb55a60b417fd07ebf3f38f800764",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-337-re-review-at-63012368-inventory-digest-production-cost-115s-vs-5s-hook-budget-produc-071beedb22cfd7cb.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-337-re-review-at-9b7099ea-duplicate-artifact-ownership-gate-fires-and-ac-1-unsatisfiable-8af72dd0db904376.md",
   "source_digest": "6b7b5b555acc8e5ec7fa55b1b9881e896d4b973219618af221ba8d1a509bd78b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-337-re-review-at-9b7099ea-duplicate-artifact-ownership-gate-fires-and-ac-1-unsatisfiable-8af72dd0db904376.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-337-recovery-11-snapshot-fence-pair-freeze-flag-blocking-3-and-review-request-exact-head-15edae8a4e6d17a3.md",
   "source_digest": "1a407e4b7f453496bfae42ef5acbb708c14953ded13ca331ee866df53f38f639",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-337-recovery-11-snapshot-fence-pair-freeze-flag-blocking-3-and-review-request-exact-head-15edae8a4e6d17a3.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-338-at-2028ab73-ci-red-root-cause-is-unpinned-headsnapshot-callsite-count-and-windows-ci-67ae856f56d8ff00.md",
   "source_digest": "c4f0b2f53d27b004e3b4613f194994e3f789e36201c0c747f94ab3ef37a54509",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-338-at-2028ab73-ci-red-root-cause-is-unpinned-headsnapshot-callsite-count-and-windows-ci-67ae856f56d8ff00.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-338-closing-review-at-7850143b-duplicate-artifact-ownership-ci-red-plus-select-order-cha-1895ee0f79c68a21.md",
   "source_digest": "4d7dda6abc23b7020dfa294e13807d54e4786e154ab5007e98932e5e89e678ec",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-338-closing-review-at-7850143b-duplicate-artifact-ownership-ci-red-plus-select-order-cha-1895ee0f79c68a21.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-338-closing-review-at-8f0f41e6-pass-blocking-0-doc-lane-executes-4-not-102-merge-pending-ci-green.md",
   "source_digest": "a3b72acaf09a260e0373ae9d9f52056ccd2d6ae88732f01e7af386a0b331ab15",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-338-closing-review-at-8f0f41e6-pass-blocking-0-doc-lane-executes-4-not-102-merge-pending-ci-green.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-338-delta-review-at-84a81563-three-blockings-fixed-but-doc-lane-now-executes-all-102-che-a12e76699e7627fa.md",
   "source_digest": "215488ec06a8c90848f54c9d33c1a86ddd6a587dc9724a9b99cdff8126210a09",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "「出力(envelope)を絞ること」と「実行を絞ること」は別の契約であるという、コスト最適化を目的とするgate/CI設計で一般的に有効な区別。",
   "adopt": {
    "memory_id": "memory:feedback:envelope-oracle--43bbe268cfb0",
    "kind": "feedback",
    "title": "「出力(envelope)を絞る」ことと「実行を絞る」ことは別の契約: コスト削減が目的なら実行件数を oracle にする",
    "tags": [
     "ci-cost",
     "doctor",
     "gate-design"
    ],
    "registration": {
     "operation_id": "curation-424:215488ec06a8c908",
     "memory_id": "memory:feedback:envelope-oracle--43bbe268cfb0",
     "source_path": ".ut-tdd/memory/feedback-envelope-oracle--43bbe268cfb0.md",
     "content_digest": "d784c62f8463e856f02edf6e5d298f6818f843cb31984090e38c3bb4c31f8953",
     "exit_code": 0
    },
    "receipt_digest": "9598ca679954ebe4e5fa1f917e06e5f31a4693d51c912f3572b6243729ab6d68"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-338-exact-head-2028ab73-ci-red-remediation-handoff.md",
   "source_digest": "1740796f1a86b9a28a2b9e0ef217bbbda7dbda480e7287c48a98e22672b9761f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-338-exact-head-2028ab73-ci-red-remediation-handoff.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-338-merged-at-exact-head-8f0f41e6-closing-issue-314-verdict-must-go-to-both-pr-comment-a-f34961ff14855f9d.md",
   "source_digest": "96c91b4f47b9aac79464201278e77ad1433e4876390c4051791654309dd30117",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-338-merged-at-exact-head-8f0f41e6-closing-issue-314-verdict-must-go-to-both-pr-comment-a-f34961ff14855f9d.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-339-delta-at-1cf0b4cc-oracle-orphans-fixed-but-generates-still-declares-11-pre-owned-pat-ad17149a9fb73d2f.md",
   "source_digest": "e6c618f1701fedb43b0d9655ef47994504e972b6469297ddf2c47791da4c2ebe",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-339-delta-at-1cf0b4cc-oracle-orphans-fixed-but-generates-still-declares-11-pre-owned-pat-ad17149a9fb73d2f.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-339-merged-at-exact-head-d60ea682-d3a-custody-implementation-verified-1-1-against-the-fr-ff6d8fa3ce35b49d.md",
   "source_digest": "423a16c2b91772c273ed9e8d1d3ffa47d15147e07fbb26cc004c90d0f1fddbc5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-339-merged-at-exact-head-d60ea682-d3a-custody-implementation-verified-1-1-against-the-fr-ff6d8fa3ce35b49d.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-339-review-at-db0b36bbebc3-flag-blocking-1-generates-declares-11-pre-owned-paths-only-2-ed3765ca68dfed32.md",
   "source_digest": "cd09edc6928b73abfa4291e8a6f099c9b636b0f27fe72cf27f8de87049f74a83",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-339-review-at-db0b36bbebc3-flag-blocking-1-generates-declares-11-pre-owned-paths-only-2-ed3765ca68dfed32.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-339-second-blocking-u-rvatt-033-and-u-rvatt-036-promoted-to-test-design-without-any-test-363e30b19ce3292c.md",
   "source_digest": "db5d094f9108e8a201ee1acebd426bf1778a8e6917c5655cfddf12dab6c041c2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-339-second-blocking-u-rvatt-033-and-u-rvatt-036-promoted-to-test-design-without-any-test-363e30b19ce3292c.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-340-claude-non-author-closing-review-request-exact-head.md",
   "source_digest": "6c0c591dd5a6b9272306247a49aab2f0517e899d51618cf64321f39b9115b817",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-340-claude-non-author-closing-review-request-exact-head.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-340-codex-cross-review-pass-weak-exact-head.md",
   "source_digest": "fe52ecc61f0fcf04cadf6fe665b54ba6018a0791a71de8c183eb00e59b081643",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-340-codex-cross-review-pass-weak-exact-head.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-340-review-request-claude-authored-plan-l7-463-ci-measurement-addendum-needs-codex-non-a-8c15d58aaff29e7e.md",
   "source_digest": "7364c6c4dc589b3947181c5d2cd8b632339dff371b2fb595884bf6b29c6a98ae",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-340-review-request-claude-authored-plan-l7-463-ci-measurement-addendum-needs-codex-non-a-8c15d58aaff29e7e.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-341-ci-correction-exact-head-e549cd98-claude-delta-review.md",
   "source_digest": "57c3e903d5681e4651fec58ff8d2f8f3569a7c23f53f36ae27bb99477f76766b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-341-ci-correction-exact-head-e549cd98-claude-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-341-delta-closing-review-at-exact-head-7fbe432a-content-pass-only-the-r4-review-evidence-block-remains.md",
   "source_digest": "e2847711e17427fe51c282644353a9757b18845d3cfaba1176423c86d94d8f8d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-341-delta-closing-review-at-exact-head-7fbe432a-content-pass-only-the-r4-review-evidence-block-remains.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-341-exact-e549cd98-source-doc-lane-doctor-green.md",
   "source_digest": "a9270c524c66e9b32837e4f731e8614525f72c84d9da182c52722d3e687d36f7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-341-exact-e549cd98-source-doc-lane-doctor-green.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-341-merged-at-exact-head-19d26a47-as-2f3f15af-open-prs-now-0-a-2-contract-ambiguity-carr-bf31407b7b44590f.md",
   "source_digest": "4ca36342fc823c4c18e33a145c24170ded3b1f22f507f3fb56bc9d7d8d5ee5cc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-341-merged-at-exact-head-19d26a47-as-2f3f15af-open-prs-now-0-a-2-contract-ambiguity-carr-bf31407b7b44590f.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-341-r4-closing-evidence-exact-head-19d26a47-re-review.md",
   "source_digest": "e02d36bf313cbaf2dadb532eb3161c0080c068ab35e555ef7aa5daf5a2ef06c3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-341-r4-closing-evidence-exact-head-19d26a47-re-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-341-r4-closing-review-at-exact-head-54095c49-flag-blocking-1-review-evidence-attributes-b595bd6b2f921cc4.md",
   "source_digest": "ec560e4e6623983ddf66d92f200c366f002c8072bc1e0b88dc4e56a8f18c7fb8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-341-r4-closing-review-at-exact-head-54095c49-flag-blocking-1-review-evidence-attributes-b595bd6b2f921cc4.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-341-r4-exact-head-54095c49-ci-correction-and-claude-closing-review.md",
   "source_digest": "2af098c450f9eda528d1c66c9f32b8b0e9f9415f74e922327320d563d717e986",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-341-r4-exact-head-54095c49-ci-correction-and-claude-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-341-r4-exact-head-e15c0c93-root-workspace-claude-closing-review.md",
   "source_digest": "83fea0a18f4ddf2bf0739fa67be9d96abd19bcff1af6a995669ee5d69c67cb87",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-341-r4-exact-head-e15c0c93-root-workspace-claude-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-341-r4-flag-1-correction-exact-head-7fbe432a5-claude-re-review.md",
   "source_digest": "1e8c5b1540d0f8808aa5acd132b3eb91537cff6e6cbc5648d385ed0311e716aa",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-341-r4-flag-1-correction-exact-head-7fbe432a5-claude-re-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-343-closing-review-at-0a75fada-flag-duplicate-fsm-candidate-ledger-caused-by-my-own-pre-6e36d6ea9b4f7c06.md",
   "source_digest": "564945c593011c77730fb9f038a3d9c42e75a7569ecd50b9abbaa045a805301d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-343-closing-review-at-0a75fada-flag-duplicate-fsm-candidate-ledger-caused-by-my-own-pre-6e36d6ea9b4f7c06.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-343-merged-at-exact-head-4002f208-as-f4c1bac2-fsm-candidate-duplication-resolved-by-rena-54b52187b551236b.md",
   "source_digest": "8ae6e9ac8bcdd7de39434dcafa8032ad859670e8c65a1e41b8fe6af93701b2ef",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-343-merged-at-exact-head-4002f208-as-f4c1bac2-fsm-candidate-duplication-resolved-by-rena-54b52187b551236b.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-344-forward-fsm-exact-main-opus-pre-gate-request.md",
   "source_digest": "27b12836ee969759bce7a6941d9221782c87731c5ddc49037406d4a985624d62",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-344-forward-fsm-exact-main-opus-pre-gate-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-346-closing-review-at-91f3ae86-flag-blocking-2-fsm-state-has-no-defined-relation-to-fron-78010c5e54969acd.md",
   "source_digest": "240371ac011f736700c6e27a95af38f1ec5420b75f50a265f94e89623315575a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-346-closing-review-at-91f3ae86-flag-blocking-2-fsm-state-has-no-defined-relation-to-fron-78010c5e54969acd.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-346-merged-at-exact-head-875312d3-as-665e3cba-fsm-contract-tables-materialized-ledger-vs-030098a38a4eb98e.md",
   "source_digest": "2633ec999670471951405a0fe283d33427c187065c3ad7df88e6df2b54246085",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-346-merged-at-exact-head-875312d3-as-665e3cba-fsm-contract-tables-materialized-ledger-vs-030098a38a4eb98e.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-348-merged-by-claude-origin-main-7dbfa4fd-post-merge-ci-green-344-fresh-pre-gate-base-fixed.md",
   "source_digest": "dd6863149ac86d595313ff574643fea8928c93d9377aeac9634838e4ad7ca085",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-348-merged-by-claude-origin-main-7dbfa4fd-post-merge-ci-green-344-fresh-pre-gate-base-fixed.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-348-pass-exact-head-3aaab5d3-merge-request-and-344-gate-handoff.md",
   "source_digest": "ad6ea1031603dcb139d35a02e195a48beea3a71917fc6a5d319669c02fe255d5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-348-pass-exact-head-3aaab5d3-merge-request-and-344-gate-handoff.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-348-root-workspace-ci-green-exact-head-3aaab5d3-review-wake.md",
   "source_digest": "b1e53cc93e75f9ae4dc1ed2da14697850f37ca82c96c58efbec369fc6b822c6f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-348-root-workspace-ci-green-exact-head-3aaab5d3-review-wake.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-350-codex-cross-review-flag-exact-head-47ad591b.md",
   "source_digest": "a681e16c7d00303ae9640f420a2860569652a23b3e22deb6eedbded4d42cd749",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-350-codex-cross-review-flag-exact-head-47ad591b.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-352-sol-closing-flag-exact-head-04528528.md",
   "source_digest": "3c1926255c548c206db96570ccab185a20304644d07d9d200c2a7e46b4faba26",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-352-sol-closing-flag-exact-head-04528528.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-355-issue-353-filename-bound-review-request.md",
   "source_digest": "e8f6b2aed9723b263bb4a44e4e7be9fc96a838e7ef6e01a4b18ba7a9aa36ea35",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-355-issue-353-filename-bound-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-355-merged-and-memoryfilenamefor-validation-follow-up.md",
   "source_digest": "01df4a4e49a2979d785acddd9ebb4c919c709cf2ed5f2cda50e0b3208f36c453",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-355-merged-and-memoryfilenamefor-validation-follow-up.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-361-claude-claude-non-author-review.md",
   "source_digest": "3cdc93eb9683d28928cc49f783d004e5f1ee14ecfc526e4c6cee25f5a3327c28",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-361-claude-claude-non-author-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-361-codex-non-author-flag-exact-head-8d1dc6be.md",
   "source_digest": "850d037d3691cb56e14fee2bb32f15a2aa84d29f5546435633bc2c090ccafde3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-361-codex-non-author-flag-exact-head-8d1dc6be.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-361-exact-head-9f2089d-claude-non-author-closing-review-request.md",
   "source_digest": "7c14f9a3770bc9d8f68041af6be8bdca02038ba1401ffbbbcca3915fd06fc4ae",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-361-exact-head-9f2089d-claude-non-author-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-361-exact-head-9f2089d-codex-non-author-closing-pass.md",
   "source_digest": "bf49ccb87cc46f92b34e3562fdada2c00a13242a4f2bb0c891b753c340e3a725",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-361-exact-head-9f2089d-codex-non-author-closing-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-361-flag-remediated-at-exact-head-2bb4e6d5.md",
   "source_digest": "32cd7773a5f2b4709f48d7183a9f3954831f1ad2f9819062672a62cd1b318b92",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-361-flag-remediated-at-exact-head-2bb4e6d5.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-365-exact-head-0449c711-opus-pass-and-ci-green-merge-handoff.md",
   "source_digest": "11073a84cba8d7a79f193fdc77c43d28e2b0604376a0be2ee02169ba52958f56",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-365-exact-head-0449c711-opus-pass-and-ci-green-merge-handoff.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-365-merge-now-exact-head-0449c711-no-evidence-commit-required.md",
   "source_digest": "55432eae5e4e915754998effa5164858815b7102ceb1e0267e07575d3cefbead",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-365-merge-now-exact-head-0449c711-no-evidence-commit-required.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-365-merged-with-plan-l6-102-still-draft-and-issue-360-closed.md",
   "source_digest": "2b63654da7f1894a3c51fe6f50b7098a1ff8224a5762f80997042567a4dbcd9d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-365-merged-with-plan-l6-102-still-draft-and-issue-360-closed.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-366-codex-non-author-pass-exact-head-96079e62.md",
   "source_digest": "861d25b61b6c922759c04c12b307c3b5c77ab0b6101e5066bcdc92aff18d41b5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-366-codex-non-author-pass-exact-head-96079e62.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-368-delta-review-at-6d6c3b21-flag-blocking-1-reviewrevision-splice-hole.md",
   "source_digest": "0100f1490100514ddc2095489ba2196cc763865c2cbd96905819589e243e4fd2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-368-delta-review-at-6d6c3b21-flag-blocking-1-reviewrevision-splice-hole.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-368-delta-review-at-f86a73fe-flag-blocking-1-imp-077-completed-after-tests-green-at.md",
   "source_digest": "68b0d14fab49880b6588899d22044dacd96f0c752790871fef5f2cddf3963e1c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-368-delta-review-at-f86a73fe-flag-blocking-1-imp-077-completed-after-tests-green-at.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-368-exact-head-7a9f9afe-root-workspace-claude-closing-review.md",
   "source_digest": "11d5d16d6658476defc1250cd483b9f09ac9b04ae9678f2bfca500d9df6df943",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-368-exact-head-7a9f9afe-root-workspace-claude-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-368-exact-head-ac755bb-claude-flag-evidence-nesting.md",
   "source_digest": "d7d4eb1d70cc1a1907ab08009a5b5be81792891b3e531ea1ce53bb6b6c162ab1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-368-exact-head-ac755bb-claude-flag-evidence-nesting.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-368-exact-head-ac755bb0-claude-closing-re-review.md",
   "source_digest": "16560326a1ca8056307f63a2e51a10f76a10ecaa3a5c7eb508de61d3511c14ec",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-368-exact-head-ac755bb0-claude-closing-re-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-368-exact-head-ac755bb0-claude-closing-review.md",
   "source_digest": "c76bf2f7b9dd7a8edc7236972ab760c8ae6ba507119aceda19933e91f9cdf8ec",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-368-exact-head-ac755bb0-claude-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-368-pass-4721ffd6-pr-370-pass-6eabc349-mutant-probe-oracle.md",
   "source_digest": "f410b5913bb7b5a6b04d6958253b5d184ee393f2ebb267da0f6dba4358b0636b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-368-pass-4721ffd6-pr-370-pass-6eabc349-mutant-probe-oracle.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-368-review-at-7a9f9afe-source-fix-correct-but-the-added-regression-does-not-fail-without-it.md",
   "source_digest": "66997510e430c0fed6c08dd954e95099061eef80735c8e612356a07b21de1233",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-368-review-at-7a9f9afe-source-fix-correct-but-the-added-regression-does-not-fail-without-it.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-369-exact-head-5816fc0-all-ci-green-claude-closing-review.md",
   "source_digest": "c33712e255d71f65b08f6f88a6b85a2dc5c03fb33b7dfe141af6272a37e19d48",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-369-exact-head-5816fc0-all-ci-green-claude-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-369-exact-head-5816fc0-claude-non-author-closing-review-request.md",
   "source_digest": "7f085dc61cd0bd0cd2f50c9d82ff722166245774614f060b7889b7f6dc861505",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-369-exact-head-5816fc0-claude-non-author-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-369-exact-head-5816fc0-codex-non-author-closing-pass.md",
   "source_digest": "a706517d764f5bb3ad92769fafbc254151a0ee25493c60a14e52fe98c0d263e3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-369-exact-head-5816fc0-codex-non-author-closing-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-369-exact-head-5816fc0-codex-pass-record-for-author-custody.md",
   "source_digest": "d9089e7e7f813e216a3afd492c4fd4208aae21184fb0b5db715c902875d0fdab",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-369-exact-head-5816fc0-codex-pass-record-for-author-custody.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-369-exact-head-7ff171a-codex-flag-immediate-base-landing-gate.md",
   "source_digest": "cdebfa10dc1bfda17184c153427c481ae1824e1e13f4b65dbdf793e6d192efac",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-369-exact-head-7ff171a-codex-flag-immediate-base-landing-gate.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-370-exact-head-161135f-claude-flag-session-presence-remediation.md",
   "source_digest": "714b41c8ae21085c348b4eba2f367be02f200ab41a6c4abdece194fe7205618d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-370-exact-head-161135f-claude-flag-session-presence-remediation.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-370-exact-head-161135f2-claude-closing-review.md",
   "source_digest": "0e272e3003d93a765a36e52c3a300740e76f87066c104a54988e43961ebe512a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-370-exact-head-161135f2-claude-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-370-exact-head-6eabc349-all-ci-green-claude-closing-review.md",
   "source_digest": "860f721a013da7169ceb0415b472e6e6c3794494fbd58864c63e574db0a73ea2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-370-exact-head-6eabc349-all-ci-green-claude-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-370-exact-head-6eabc349-claude-closing-pass.md",
   "source_digest": "f642047fc1e1460bba239653ed104d7ab8669a3a733ec2c2608a1f9a3f5b1d3d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-370-exact-head-6eabc349-claude-closing-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-370-review-at-161135f2-presence-active-contract-vs-impl-vs-oracle.md",
   "source_digest": "29c4eb185f32065060364de6acb6b984d26a88c49c2de7e15050fd2f4024773c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-370-review-at-161135f2-presence-active-contract-vs-impl-vs-oracle.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-claude-po-2026-07-10.md",
   "source_digest": "1d13b8e1432ad942db5b8d185ae7e04772f8526af4947c54e6951a00f06b467a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-claude-po-2026-07-10.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-comment-truncation-breaks-verdict-delivery.md",
   "source_digest": "7f621a117e0ddb564c266e82ca71b548bded8718571a18555546c7b8b2b21fc1",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "PRコメント投稿時のエスケープ崩れによる本文切断という、cross-review verdictの伝達を壊す具体的な技術的失敗様式と対処法。",
   "adopt": {
    "memory_id": "memory:feedback:pr-backtick-raw-body--9682087438d9",
    "kind": "feedback",
    "title": "PRコメント本文がbacktickエスケープ崩れで途中終端することがある: 受け手はraw bodyで末尾を確認し、部分対応で済ませない",
    "tags": [
     "cross-review",
     "pr-comment",
     "verdict-delivery"
    ],
    "registration": {
     "operation_id": "curation-424:7f621a117e0ddb56",
     "memory_id": "memory:feedback:pr-backtick-raw-body--9682087438d9",
     "source_path": ".ut-tdd/memory/feedback-pr-backtick-raw-body--9682087438d9.md",
     "content_digest": "a24229f04790c3749fbc75221459ab6a9ffd0b9dccea5dc8d0a4eb0be924b5ba",
     "exit_code": 0
    },
    "receipt_digest": "d3552b63a9a832bf97758559634e4ef75f8a679fbf08d0307422584a84378d4b"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-family--5909b773ed48.md",
   "source_digest": "11541bf9237499878240f2d2af4399192f790ac950e2745e0484186d30a025b9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-family--5909b773ed48.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (review-episode/personal-path)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-harness-po-2026-07-15.md",
   "source_digest": "6c4922c6bf8399f5f81bbd3c931d8e127b159f6bf3deda94ebd9120b875acbab",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §引き継ぎ・検証の基準点 = HEAD (永続教訓は共有HARNESSメモリへ昇格する)"
   ],
   "reason": "PO制定の恒久ルール。PRコメントは相手ランタイムのSessionStart digestに載らず、次セッションから不可視になるという既存canonical原則(HARNESSメモリ昇格)を具体化したもの。",
   "adopt": {
    "memory_id": "memory:feedback:cross-review-pr-harness--725b0b63090c",
    "kind": "feedback",
    "title": "cross-reviewの所見はPRコメント止まりにしない: 同内容をHARNESSメモリへも昇格する",
    "tags": [
     "cross-review",
     "hybrid-coordination",
     "memory-promotion"
    ],
    "registration": {
     "operation_id": "curation-424:6c4922c6bf8399f5",
     "memory_id": "memory:feedback:cross-review-pr-harness--725b0b63090c",
     "source_path": ".ut-tdd/memory/feedback-cross-review-pr-harness--725b0b63090c.md",
     "content_digest": "db99ec3e6a5e90950b696df22c595fa6377b7c62d4fa87f190abe2ee96f93e95",
     "exit_code": 0
    },
    "receipt_digest": "5c6b93c5e93163453f1b027048b93456929981cdbe2a83d0bd382fdecdb3eba2"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-merge-cross-family-review-2026-07-14.md",
   "source_digest": "a5161f38545e1033e7c545ae65245d0a4ea41059ec0b4f50ee74d70e2407c428",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-merge-cross-family-review-2026-07-14.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-po-2026-07-16.md",
   "source_digest": "93ae9dd256e9c3ee4281fbc5a70cf4b939efa060b4021233c050ad69fe66d487",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §UT-TDD Workflow (Forward: implement -> trace-freeze -> review -> accept)"
   ],
   "reason": "PO制定の恒久ルール。工程内レビューとPR後クロスレビューで判定責務の所在を明確に分離する、cross-review運用の骨格。",
   "adopt": {
    "memory_id": "memory:user:pr-pr-pr--e319d7c7d3fe",
    "kind": "user",
    "title": "クロスレビューはPR作成前の工程内レビュー、PRはその完了後の受け渡し、PR後レビューでサブエージェントは確認補助まで",
    "tags": [
     "cross-review",
     "subagent-delegation",
     "workflow"
    ],
    "registration": {
     "operation_id": "curation-424:93ae9dd256e9c3ee",
     "memory_id": "memory:user:pr-pr-pr--e319d7c7d3fe",
     "source_path": ".ut-tdd/memory/user-pr-pr-pr--e319d7c7d3fe.md",
     "content_digest": "e66ff6cc65a12af1bbb65a7da00d5e0ac43cab0a21dd0cf6ba5378961c1ae839",
     "exit_code": 0
    },
    "receipt_digest": "4b587064bed90c2559606eaf0874922c653750d42d3d29abf79ab6ce7c913ab4"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr-pr-codex-po-2026-07-16.md",
   "source_digest": "e2f94b7521eb67d6df88034ecf5dacf95654f541f3d4c24f292eaff2c0b1c85d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr-pr-codex-po-2026-07-16.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr306-doc-only-confirm-head-d68a0958-claude-delta-re-review-request.md",
   "source_digest": "d37f08c2e66b832d50a79defe8ef64b603422f721a18d0396f47e104271fae12",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr306-doc-only-confirm-head-d68a0958-claude-delta-re-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-0e3e6229-forward-spine-correction-claude-delta-review.md",
   "source_digest": "d7ca580f1f621b0074139ec404c8126a9c6a586860801cc01633b1be2bce4786",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-0e3e6229-forward-spine-correction-claude-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-11c994eb-ci-green-claude-closing-rereview-ready.md",
   "source_digest": "26bd31db3ff6c46c0d4b43db4085e40e6ec6a735fec3fb7619cb59257cfff8ab",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-11c994eb-ci-green-claude-closing-rereview-ready.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-11c994eb-claude-closing-re-review-request.md",
   "source_digest": "8c9167d7ff015d631f90991e536071c0d43cd73d5ac1b4c1636d6c129b89ca17",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-11c994eb-claude-closing-re-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-5e47ac23-claude-closing-review-request-corrected.md",
   "source_digest": "6c5f8fd0fab988721f268d17950fdee4f6180bd9d1d0ea2ee82267e481c41117",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-5e47ac23-claude-closing-review-request-corrected.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-69fbb4fa-claude-closing-review-request.md",
   "source_digest": "4c73a26ad4678313be0ad833fe128b46e6e291f190fca0eca0d8f4f84f550c5b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-69fbb4fa-claude-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-e5fe3a1e-claude-closing-review-request.md",
   "source_digest": "7b38d2235315821ea56e5f4718207bfec753801abcf283dfbb59e6d49b4521c4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr306-exact-head-e5fe3a1e-claude-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr310-exact-head-c313b0fe-ci-green-claude-closing-review-ready.md",
   "source_digest": "9323a6c34fffd1b4d8f20b507c38239fa317fd3222ed119548f549be0792170a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr310-exact-head-c313b0fe-ci-green-claude-closing-review-ready.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr310-exact-head-c313b0fe-l6-completion-remediation-claude-review.md",
   "source_digest": "7466d0feb2485f0f39971a5504091f3b5d44094f934cb8183748acfe41065994",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr310-exact-head-c313b0fe-l6-completion-remediation-claude-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr310-exact-head-c313b0fe-non-author-closing-review-pass-weak.md",
   "source_digest": "dc41055f4d56b3155b68f4dca0d58af84e33f296da78f06393fac7936c2d41cc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr310-exact-head-c313b0fe-non-author-closing-review-pass-weak.md",
    "screen:pr-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr310-exact-head-d2d30d1b-claude-closing-review-request.md",
   "source_digest": "8fb81bc33cecfb84726905a4e9c80541a069d0237f80903ad5c672965d7874f0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr310-exact-head-d2d30d1b-claude-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr310-exact-head-de07b9a9-ci-remediation-claude-closing-review.md",
   "source_digest": "6a8760ac5cd5641a50d570f2ea5b93cd2924a41a502f74e22ad170427edf0cd9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr310-exact-head-de07b9a9-ci-remediation-claude-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr332-exact-head-0e7e3c01-plan-confirmed-closing-review-request.md",
   "source_digest": "4148b4fb554c16be9dda7355db3c1f97b5e10eb220013863cb452052730b754e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr332-exact-head-0e7e3c01-plan-confirmed-closing-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr332-exact-head-70c234d8-ci-evidence-correction-delta-review.md",
   "source_digest": "053a69cff1ff79f1724edc9362f36f71459578605016842ae4a6e8e531e37f96",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr332-exact-head-70c234d8-ci-evidence-correction-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr332-exact-head-a9d40657-non-author-closing-review.md",
   "source_digest": "0446061add0417d45804408c22edbe8e968077c4e1f8b410e8d9fd4b0b7f376a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr332-exact-head-a9d40657-non-author-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr334-exact-head-7fba4a05-pf4-identity-oracle-delta-review.md",
   "source_digest": "6d60f8ae84953a991a547d9ff296827c66e0466955a17d105bb9ca10b087584d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr334-exact-head-7fba4a05-pf4-identity-oracle-delta-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-4d0b52d6-claude-delta-closing-review.md",
   "source_digest": "5bd2baa2d4fc948253d20aef16a737001ed9a4bc3bcc0494f1d2666e0e147f18",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-4d0b52d6-claude-delta-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-4d0b52d6-pf5-blocking-correction-and-a2-binding-review.md",
   "source_digest": "e0f0eb3d99a1956a84109f9176f7e81595b47756bd88fa610770694069bd9de4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-4d0b52d6-pf5-blocking-correction-and-a2-binding-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-982a4294-pf5-implementation-non-author-closing-review.md",
   "source_digest": "cc51f6f95da3bce91c9f3c6cb12d7f8cef011d6919db3762676ac6d721ac22af",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-982a4294-pf5-implementation-non-author-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-acfff279-all-ci-green-non-author-closing-review.md",
   "source_digest": "e93dcad33854ef180771041cf00d9125c6a76e5ed01d81e55f46cd5e3d2021e5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-acfff279-all-ci-green-non-author-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-acfff279-pf5-max-source-params-correction-review.md",
   "source_digest": "7d614ed8fac9826c6a25d4bd985bf2c77a1b5e828bb07cd656beac405fc17093",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-acfff279-pf5-max-source-params-correction-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-b99b0cc1-pf5-convergence-correction-non-author-review.md",
   "source_digest": "fb5e80194b54246f7c797ca991189140ab0b2969bb59ffcbb21395f02325088e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr335-exact-head-b99b0cc1-pf5-convergence-correction-non-author-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr336-exact-head-779aa93b-ci-green-closing-review.md",
   "source_digest": "4b37800d5c0ed617555e0c3d2f183c385b18cdb5555bbebfb6ed920e6adb5cfd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr336-exact-head-779aa93b-ci-green-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr336-exact-head-779aa93b-d3a-design-freeze-claude-cross-review.md",
   "source_digest": "2ec98fc1f9522843b59706472bd66cdd8e89322fc09117605c8d59522bff1219",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr336-exact-head-779aa93b-d3a-design-freeze-claude-cross-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr336-flag-remediation-exact-head-93ca017f-claude-re-review.md",
   "source_digest": "702555c5430a88a8426cb993e6d6f6e8403281814d746e4039e4c634fdeef1ab",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr336-flag-remediation-exact-head-93ca017f-claude-re-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr337-exact-head-d8c718d0-snapshot-fence-pair-freeze-claude-review.md",
   "source_digest": "a0f6c87f2ac928101e9581c17f408d677fea1fe17c22ded8f75cc0350b6a1888",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr337-exact-head-d8c718d0-snapshot-fence-pair-freeze-claude-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr337-flag-remediation-exact-head-9b7099ea-claude-re-review.md",
   "source_digest": "f3653f62e74567127907e37253e669a312039299354f41c108c98e4a80caff45",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr337-flag-remediation-exact-head-9b7099ea-claude-re-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr350-exact-head-85bc864c-codex-non-author-pass.md",
   "source_digest": "d97b69010f71f132cebb07c972eea04a0558b5517e0c1cd1e0c7df4b0f5baac2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr350-exact-head-85bc864c-codex-non-author-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr351-pf3-closing-review-flag-advisory-blocking-eager-collector-ci-exit-timeout.md",
   "source_digest": "9f7dc112fdf70104fdd0ae20a60d5333bec2099ff3d2ead5c5143e384d99d96e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr351-pf3-closing-review-flag-advisory-blocking-eager-collector-ci-exit-timeout.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr63-blind-cross-review-flag-reentry-certificate-e8-e11-descent-codex.md",
   "source_digest": "ad8f31d063b4fa6e2fe80076682057fb8a028749b2f846d20d11ec1f45ef21fc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr63-blind-cross-review-flag-reentry-certificate-e8-e11-descent-codex.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-pr63-rereview-flag-l6-84-certificate-evidence-binding-codex.md",
   "source_digest": "5d5245c041abc6c4ab9cf0796e0af9831f6d82e77ec61a86591ecea58274b085",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-pr63-rereview-flag-l6-84-certificate-evidence-binding-codex.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-probe-whether-a-worktree-node-modules-shares-storage-with-primary-before-folding-it-entry-c-4558771afba18691.md",
   "source_digest": "8e2dff5aa89906bff24d94c2bc9d04ab05d8aaf8acefcc5629c813c81dfd598a",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "MSYS_NO_PATHCONV=1 cmd /c \"rmdir <wt>/node_modules\" (junction unlink手順)",
    "git worktree remove"
   ],
   "reason": "実害(全CLI起動不能)を伴うincidentが複数回発生した再現性の高いWindows/git worktree運用リスクで、probe技術による判定方法を含む具体的な回避策。旧版3件を統合。",
   "merged_from": [
    "656d225f5a34b6bcd5bc4cfb3dfc92402764eadeef0dea45222ac5ae541aa39f",
    "ce5173f41603bc5709f03648ba77051208b32c250e67930db0a87725406fb569",
    "2fd5ec9b543e99612cfefdae9189dd13475c83d449fe98c2c9a283d7b2883a25"
   ],
   "adopt": {
    "memory_id": "memory:feedback:worktree-node-modules-primary-probe-entry--8cfb0722b59b",
    "kind": "feedback",
    "title": "worktreeを畳む前にnode_modulesがprimaryと実体共有しているか probe で判定する: entry数や見た目では区別できない",
    "tags": [
     "git-worktree",
     "node_modules",
     "windows-pitfall"
    ],
    "registration": {
     "operation_id": "curation-424:8e2dff5aa89906bf",
     "memory_id": "memory:feedback:worktree-node-modules-primary-probe-entry--8cfb0722b59b",
     "source_path": ".ut-tdd/memory/feedback-worktree-node-modules-primary-probe-entry--8cfb0722b59b.md",
     "content_digest": "598f4a254056e2e47dff5970cb7cced0275cacde463d52c8d339ab7aa8b6356c",
     "exit_code": 0
    },
    "receipt_digest": "6e80d1941c252dc09a8869607639ba921c739e1e03a8cf12ea9576d97fd93fc3"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-process-violation-pr-551-commit-b64cf1ab-hand-edited-a-memory-body-in-place-memory-add-refu-022f92926d94b89f.md",
   "source_digest": "7057028c2b7a8e1dd2639064a644692b9af28e25e8569b1b1767e47d01501cf7",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/memory/service.ts (isSameEntry, memory add の重複拒否挙動)"
   ],
   "reason": "ツールの実装挙動(bodyが同一なら無変更で返し、異なれば例外を投げる)に基づく、手編集を検出する具体的で機械的なチェック方法。",
   "adopt": {
    "memory_id": "memory:feedback:updated-at-ut-tdd-memory-add-body--61c23b161a59",
    "kind": "feedback",
    "title": "メモリ本文の手編集はupdated_at不変で検出できる: ut-tdd memory addはbody同一なら無変更返却、異なれば例外を投げる",
    "tags": [
     "hand-edit-detection",
     "memory-integrity",
     "process-violation"
    ],
    "registration": {
     "operation_id": "curation-424:7057028c2b7a8e1d",
     "memory_id": "memory:feedback:updated-at-ut-tdd-memory-add-body--61c23b161a59",
     "source_path": ".ut-tdd/memory/feedback-updated-at-ut-tdd-memory-add-body--61c23b161a59.md",
     "content_digest": "38fe7aa89caf6f896520942192cc89142c1664fc44a37273c53b36434c4311a9",
     "exit_code": 0
    },
    "receipt_digest": "f56d0516e7d05524a010d129b6ee6e7aeac5a6bc6d3530563d9db610c6917659"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-re-issue-pr-319-exact-head-0a6fd103-closing-review.md",
   "source_digest": "97f028409538a36fd767e0beea6bac893e7d1c581dce2779ae1ef9507c19b6f5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-re-issue-pr-319-exact-head-0a6fd103-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-re-issue-pr-320-exact-head-bdda726a-closing-review.md",
   "source_digest": "bc2ecd4f9c18566233b6d7cbe6cd14bef3fa53be4ae0608bfc2e0d94d53e95fd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-re-issue-pr-320-exact-head-bdda726a-closing-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-rebase-byte-review-main-id--55a75e7a0052.md",
   "source_digest": "430b2e9033ad4c6b80fdc3cbc0c584e2709e3c72b61a0ea9892177165a538333",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-rebase-byte-review-main-id--55a75e7a0052.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-reissue-pr-319-exact-head-0a6fd103-claude-closing-review-request-non-author.md",
   "source_digest": "e21f2f677963af1cad52139cb8f0df1fd91dac21f3e162fc44645346025d2b0b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-reissue-pr-319-exact-head-0a6fd103-claude-closing-review-request-non-author.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-review-reject-then-fix-is-forbidden.md",
   "source_digest": "9f5c37beb69e1f9b6fd5fea203147d2b2463b188448a207c81a3f71ead433f4c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-review-reject-then-fix-is-forbidden.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-review-request-to-codex-pr-350-token-run-projection-granularity-contract-freeze-claude-auth-9178c38f10fc9a4f.md",
   "source_digest": "1fb3e710b8f7dd546818fd40d01ca63b122d9442aaffc6c96b2a84c75aaea698",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-review-request-to-codex-pr-350-token-run-projection-granularity-contract-freeze-claude-auth-9178c38f10fc9a4f.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-shared-memory-data-loss-observed-2026-08-17-same-title-re-add-destroyed-three-review-requests.md",
   "source_digest": "a23b7ec4f449643df05842e77e4d0637e86feaec5a7c0994b154ade29b995f7e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-shared-memory-data-loss-observed-2026-08-17-same-title-re-add-destroyed-three-review-requests.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-snapshot-runner-commit-head-commit.md",
   "source_digest": "0778b67d81349499b575fb216efad8ae6e3fd9d05176dd9022f08a522c463799",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-snapshot-runner-commit-head-commit.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-spec-driven-is-the-base-principle-coverage-substance.md",
   "source_digest": "8d9eae22636c4e7cf6e97dde0331ef3e2e15cb0e0ca925d0acfb4a7af7426afd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-spec-driven-is-the-base-principle-coverage-substance.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-spec-ir-detector-scope-evidence-doc-relation-plan-l7-429.md",
   "source_digest": "43b149ecf3584e4b9ddab3854c335564ec8023f8601fd6b5923997af2d5a99dd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-spec-ir-detector-scope-evidence-doc-relation-plan-l7-429.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-squash-merge-makes-anchor-unreachable-from-main.md",
   "source_digest": "efcd1c4de294faf0e8916335a9bf3f39dc86d72aa58d38c4fa4a7bdfbe79cb3a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-squash-merge-makes-anchor-unreachable-from-main.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-stale-index-lock-po-2026-07-16.md",
   "source_digest": "4ae284966cf6a667f4cc9e397f0b44215b1fd0c32d259e9756d468e1d9045e3e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-stale-index-lock-po-2026-07-16.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-standing-directive-round3-plan-prioritization-and-blocking-dependencies.md",
   "source_digest": "b926ba50ff381164a16d5724e4228d20bc3f2510b7594b1022f9ae0f53f96baa",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-standing-directive-round3-plan-prioritization-and-blocking-dependencies.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-standing-directive-vmodel-gap-round-2-plan-l6-54-58.md",
   "source_digest": "b00bb5576371e426130165c4ab624105b36be94e15813558f7b7a725b6d3d53e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-standing-directive-vmodel-gap-round-2-plan-l6-54-58.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-standing-directive-vmodel-gap-round-3-filed-plan-l4-20-21-l5-14-l6-59-66-reverse-395.md",
   "source_digest": "b79a1df3635b6585b5a4b4a25b09b4114153e09bf5fe3d1b922203a5a53ccfd4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-standing-directive-vmodel-gap-round-3-filed-plan-l4-20-21-l5-14-l6-59-66-reverse-395.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-standing-directive-vmodel-upgrade-gaps-filed-plan-l6-50-53.md",
   "source_digest": "2d9328a63fe2bdd2c3ffe7d84216f5aded9e2637989bd389ef341a0428885884",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-standing-directive-vmodel-upgrade-gaps-filed-plan-l6-50-53.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-strict-custody-verdict-file-harness-envelope-is-mandatory-and-any-line-starting-with-a-lowe-ec97fbf9e79a32d1.md",
   "source_digest": "7c5b9459ea57c98be252edcef2fe0f23879b2bcfac36cc366733264fbc231dc3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-strict-custody-verdict-file-harness-envelope-is-mandatory-and-any-line-starting-with-a-lowe-ec97fbf9e79a32d1.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-supersede-r3-review-exact-main-39846e9.md",
   "source_digest": "26c4475a39c8c05dbff40291e0a4e1a69f3959a5e622d35b7f1d013ac40ff22d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-supersede-r3-review-exact-main-39846e9.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-supersede-r3-review-exact-main-427e07be.md",
   "source_digest": "b8a81cde9c1dbeccc5a06936eebfca02559aa7ecd4abbcd378009b083c2402c2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-supersede-r3-review-exact-main-427e07be.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-supersede-u-1-task-exact-main-427e07be.md",
   "source_digest": "fd643562380c19b3aafb6a17ea44ac059bbb3644010b889add4a53ce546ad086",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-supersede-u-1-task-exact-main-427e07be.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-task-commit-pr-po-2026-07-16.md",
   "source_digest": "3d250c26051b32d8889b81bbcb1f58f17a9954ceb4db9aa73cb68d8298f89ccb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-task-commit-pr-po-2026-07-16.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-test-opid-verify.md",
   "source_digest": "293556239f7d9d51f413cde6bdbaa24a7f4a1f4d4e24ec86f9d9d20478a2d333",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-test-opid-verify.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-triage-229-premise-partially-corrected-spawn-agent-is-guarded-not-deferred-real-gaps-are-wa-00260e7faa9243e7.md",
   "source_digest": "d5c8ea23119b9e212c113da25fc2eeea601ec47b9ea6ecbea5f064dd207ea2b5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-triage-229-premise-partially-corrected-spawn-agent-is-guarded-not-deferred-real-gaps-are-wa-00260e7faa9243e7.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-u-1-contract-correction-stop-refresh-unfiltered-on-disk-path-and-plan-l7-454-governance.md",
   "source_digest": "75084b9b8579f511ec742e5fede7913102eab4461f25061b5544940753c7ce65",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-u-1-contract-correction-stop-refresh-unfiltered-on-disk-path-and-plan-l7-454-governance.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-urgent-forward-344-fresh-opus-pre-gate-exact-main-7dbfa4fd.md",
   "source_digest": "d904f5945d3cb800cfdee58cca941a544150ce1971bf66fcddded032026a727a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-urgent-forward-344-fresh-opus-pre-gate-exact-main-7dbfa4fd.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-validate-worker-generated-manifests-with-json-parse-and-a-real-shell-before-feeding-the-cli-b79742fcf210b06a.md",
   "source_digest": "6575c765bfffda55e8c5a09f5c1eec3003cbd206d2d2f7f588749be75efc502f",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    ".ut-tdd/review/receipts/ (canonical receiptによる検収)"
   ],
   "reason": "worker(委譲先モデル)が誤ったshellを想定してmanifestを生成しうるという、hybrid/multi-shell環境固有の再発リスクに対する具体的な検収手順。",
   "adopt": {
    "memory_id": "memory:feedback:worker-manifest-json-cli-db-json-parse-shell-receipt-diff--22839c57fac6",
    "kind": "feedback",
    "title": "workerのmanifest/JSONはCLI/DB投入前にJSON.parseと実shellで検証し、receiptとdiffで検収する",
    "tags": [
     "manifest-validation",
     "multi-shell",
     "worker-delegation"
    ],
    "registration": {
     "operation_id": "curation-424:6575c765bfffda55",
     "memory_id": "memory:feedback:worker-manifest-json-cli-db-json-parse-shell-receipt-diff--22839c57fac6",
     "source_path": ".ut-tdd/memory/feedback-worker-manifest-json-cli-db-json-parse-shell-receipt-diff--22839c57fac6.md",
     "content_digest": "fbd13df807b7995e5538db55069d676932bb247d0a68f527fb822098338e7ef6",
     "exit_code": 0
    },
    "receipt_digest": "05c7c4e9239081b2ed06773689d30ddc4336cf74f94e880c2877e3f051584edc"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-verification-baseline-head-not-shared-tree.md",
   "source_digest": "85193235217e2f7ce683be05c23db0b44049f27eb61e84d20859cf1ef923969d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-verification-baseline-head-not-shared-tree.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-verify-the-review-request-exact-head-resolves-to-a-real-commit-before-consuming-the-envelope.md",
   "source_digest": "4b03b0c84a4320df4b330d435484a6bd00d3d323a1066a74611daa656a94ae39",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/feedback/review-attestation.ts (formatのみ検証、実在性は未検査)"
   ],
   "reason": "review request dispatchの検証が40桁hexの書式のみで実在確認をしないという実装事実に基づく、恒久的に有効な防御手順。",
   "adopt": {
    "memory_id": "memory:feedback:review-request-exact-head-commit-git-cat-file--4dbeaedc2846",
    "kind": "feedback",
    "title": "review requestを消費する前にexact HEADが実在commitへ解決できるかgit cat-fileで確認する",
    "tags": [
     "exact-head",
     "integrity-check",
     "review-dispatch"
    ],
    "registration": {
     "operation_id": "curation-424:4b03b0c84a4320df",
     "memory_id": "memory:feedback:review-request-exact-head-commit-git-cat-file--4dbeaedc2846",
     "source_path": ".ut-tdd/memory/feedback-review-request-exact-head-commit-git-cat-file--4dbeaedc2846.md",
     "content_digest": "5ea769af0b95f42e8beff949971a4ce4a0d53669085e0cfa3dbe0fc6a3416974",
     "exit_code": 0
    },
    "receipt_digest": "f33362d13a6b50abe4ef9cb52d9d3e0ee891dacf813de048161e2297ebca0cc5"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-verify-upstream-canonical-plan-before-judging-a-contract-point-undetermined-or-po-bound.md",
   "source_digest": "797ff2f90f6972ae37b719a7491786dd8cd20d43da6305d47c0f30c5d46e8165",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §PO判断への反射的エスカレーション禁止"
   ],
   "reason": "「PO判断待ち」というラベルを貼る前に上流canonical PLANを確認するという、既存canonical原則(advisor相談と実測を経ずにPOへ上げることを禁じる)を具体化した、再発性の高い誤判定パターンへの対処。",
   "adopt": {
    "memory_id": "memory:feedback:closing-review-po-canonical-plan--200813203e70",
    "kind": "feedback",
    "title": "closing reviewで「契約未確定/PO判断待ち」と判定する前に、上流のcanonical PLANを必ず確認する",
    "tags": [
     "plan-hierarchy",
     "po-escalation",
     "review-methodology"
    ],
    "registration": {
     "operation_id": "curation-424:797ff2f90f6972ae",
     "memory_id": "memory:feedback:closing-review-po-canonical-plan--200813203e70",
     "source_path": ".ut-tdd/memory/feedback-closing-review-po-canonical-plan--200813203e70.md",
     "content_digest": "750f6cf55c256ee5ca59ec07c4c5d6bb15d1485ba6de32da5ddfaabb3b47b1e8",
     "exit_code": 0
    },
    "receipt_digest": "d59eb55aae8a0e70b096c7e62dbc1bdf8cab204f8defebefab0d43550f354f01"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-vitest-snapshot-runner-windows-workspace-fence-harness-db-hash.md",
   "source_digest": "fedf6a846632dfee58f25cd143a47fb3f3781d8a38120bb5c8ead2bf175f226b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-vitest-snapshot-runner-windows-workspace-fence-harness-db-hash.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-windows-junction-inside-worktree-destroys-shared-node-modules.md",
   "source_digest": "861a28255613fe876bb2a483490d98cf859e335924510c72349a2f1ab8dec390",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-windows-junction-inside-worktree-destroys-shared-node-modules.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-windows-junction-into-a-temp-worktree-turned-worktree-removal-into-deletion-of-the-shared-node-modules.md",
   "source_digest": "9b40ac6fe3249ebb2d4de43f883c9744a9fe73ef258edb2982e96e420994154e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-windows-junction-into-a-temp-worktree-turned-worktree-removal-into-deletion-of-the-shared-node-modules.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-windows-worktree-node-modules-junction-is-deleted-through-by-git-worktree-remove-force.md",
   "source_digest": "4e43b7240efe26748894a0eb69916d10c456734485cd10de96299c3c2e50b8cc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-windows-worktree-node-modules-junction-is-deleted-through-by-git-worktree-remove-force.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (no rule)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-work-guard-marker-cross-session-race-powershell-tool-not-session-logged-2026-07-17-audit.md",
   "source_digest": "3901a0109e96e3db7e686809052a1072ab11ce8be0b214aa16cb0a63a633a976",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-work-guard-marker-cross-session-race-powershell-tool-not-session-logged-2026-07-17-audit.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-worktree-branch-pr-205.md",
   "source_digest": "577609b9577d1d6f1cc7f76e2d1034d09b514f61ea87ac369dd2f7563ad88b4b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-worktree-branch-pr-205.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/feedback-worktree-ci-block-pr351-b-3.md",
   "source_digest": "a9c9ead182b16aee153a3552d937632bb73e0a00c7fc44e31052af72d94862f1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/feedback-worktree-ci-block-pr351-b-3.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-2026-07-09-9-codex.md",
   "source_digest": "0e059712d5c355383753fb87c798aa954a67c1721e178b9f3091dede2730e129",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-2026-07-09-9-codex.md",
    "screen:timestamp"
   ],
   "reason": "時点依存の監査/状態スナップショットであり、日付・件数・PLAN番号に強く依存する進捗記述のため恒久ルールとして独立しない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-2026-07-13-codex.md",
   "source_digest": "b6e3286e0a36fb1e8853f7cc6c1ac4048ff8aac495f9df78550b0eb8f586a8b3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-2026-07-13-codex.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-146-doc-ledger-freeze-review.md",
   "source_digest": "964822890a09d2e9d404c98f115b667834d76413588182f4a5df924ed0f1e46a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-146-doc-ledger-freeze-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-147-doc-snapshot-review.md",
   "source_digest": "28c4b87b54640c08a74a82b98b5fe4035dba59d5673b42d2f0cabb7261cace28",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-147-doc-snapshot-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-154-node-control-plane-d0n-review.md",
   "source_digest": "342b81ddc1b64da7a7de8c3f5121ab83f48372408eb8991b50d36ca5a9cc5bbb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-154-node-control-plane-d0n-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-155-node-toolchain-f0a-review.md",
   "source_digest": "738d74312674e42ca4cc1b7f1096cecf8da6f74e0a7e869affb461c318f16f12",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-155-node-toolchain-f0a-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-156-resource-kernel-d0r-review.md",
   "source_digest": "b4af25935f4159f2f23aa2076283ab737fd00b11dc3e33056792187ed66f3552",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-156-resource-kernel-d0r-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-181-advisor-routing-cross-review-request.md",
   "source_digest": "617ed72df3124c42f64033acb66d1a23b7d8e00ea66421852503fc2382a578b0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-181-advisor-routing-cross-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-189-doctor-single-run-cross-review-request.md",
   "source_digest": "cc902e0dcc6afa63ed0d521261d26c5d89a4ffa6c3d9b02c0d10e08c010b2fb7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-189-doctor-single-run-cross-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-197-exact-head-862a7a5f-cross-review-request.md",
   "source_digest": "d36ad06dae6dadf5d5643cbd757a48f559a53e070ac504f5ffd8eedc2ef9f00b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-197-exact-head-862a7a5f-cross-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-197-exact-head-f4fbfa90-artifact-final-review-request.md",
   "source_digest": "c373774d82e7a4a45b04921392e6bb558ab09b2eda4003bd7f04efbf14ceb391",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-197-exact-head-f4fbfa90-artifact-final-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-197-exact-head-f877a576-artifact-review-pass.md",
   "source_digest": "26883323c8a0851d709e4777d12d07e0889f37850011fab27f9cedad89706d42",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-197-exact-head-f877a576-artifact-review-pass.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-198-exact-head-8826e87b-cross-review-request.md",
   "source_digest": "7a4a11f360efd2cb171f60245e736bb5e44e86deba417f9ae0651fc6831a9f31",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-198-exact-head-8826e87b-cross-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-200-bun-inventory-cross-review-request.md",
   "source_digest": "d849196942e250ac8cfd4efd7f0e8ba9c33b5f0b0e605f192f8ca72817a31def",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-200-bun-inventory-cross-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-pr-210-exact-head-0cbf3df8-closing-blind-review-flag.md",
   "source_digest": "e110096e8fe7b8ca3272b5e7719a934ef90cbc9c65e6d956d1ac03edaa2b8193",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-pr-210-exact-head-0cbf3df8-closing-blind-review-flag.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-claude-w0-forward-escape-node-worker-review.md",
   "source_digest": "42eee98a9bacd68965ec6301724b351edf9f2b56fc8e1ae6220d8d5c72bbd639",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-claude-w0-forward-escape-node-worker-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-codex-issue-206-oracle-uniqueness.md",
   "source_digest": "0f1df76b1f3cfee9a6eb000a79524a52b2bbf20d6554159adc0e6dcd9d425ee4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-codex-issue-206-oracle-uniqueness.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-codex-plan-l6-81-agent-registry-l7-431-433.md",
   "source_digest": "391793acb6b5dfe11c5fc8f5709f1b02f4e61651d6f5e12ec1dda21bd310fad6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-codex-plan-l6-81-agent-registry-l7-431-433.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-codex-pr-60-po-2026-07-14.md",
   "source_digest": "e0c4753ebff7ed164b5766bcc86632cdb96e8e64653723a90ab7dccd07d360f4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-codex-pr-60-po-2026-07-14.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-codex-pr-61.md",
   "source_digest": "c6cb3cc8be558d28a21657028216f2f44ca4331566aa230ff15c90b2a4334c25",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-codex-pr-61.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-codex-pr-65-plan-l1-08-blind-cross-review.md",
   "source_digest": "2562a3733f4d37ad41eceefa07adbb8c0ef501c2499c358cb4ab6b6c24c2e397",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-codex-pr-65-plan-l1-08-blind-cross-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-codex-request-unblock-merged-plan-status-debt.md",
   "source_digest": "565bea721e24d9ea83831e1cbd2ed0fe88b9925dfdda5edf98ffe4d2d2bd3419",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-codex-request-unblock-merged-plan-status-debt.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-cross-lineage-admission-receipts-must-not-be-cherry-picked.md",
   "source_digest": "d36a4f3833b256270cb1da31f1ef0f421b029858674c896d9e8a9d120b02874e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-cross-lineage-admission-receipts-must-not-be-cherry-picked.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-d1-f3-main-green-d3-211-receipt-209.md",
   "source_digest": "06c6d5dcdd9faa8b742e4ba6a9e7cb18830f716eee77c84540038e1fb5425a09",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-d1-f3-main-green-d3-211-receipt-209.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-d1-receipt-a-sla-1-d1-d3-d2-d3-claude.md",
   "source_digest": "cdc06870abc3725051e1f8a24abf39c3bb324ef511ff7abdbe44a6d05d3a8b5e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-d1-receipt-a-sla-1-d1-d3-d2-d3-claude.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-d3-trusted-custody-unverified-family-merge-d2.md",
   "source_digest": "f7406c4979833118bcb96a1b4c6104886aae5d19bf3d8542b0546451423cf7d6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-d3-trusted-custody-unverified-family-merge-d2.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-d3a-merged-ae4e4c12-main-green-d3b-transport-gap-and-verdict-file-decision.md",
   "source_digest": "52b89864d240f721eb94db76ca9aa86e1915c23352aa10d0420bbffb9a6ed70c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-d3a-merged-ae4e4c12-main-green-d3b-transport-gap-and-verdict-file-decision.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-engine-swap-codex-l7-421-po-2026-07-13.md",
   "source_digest": "9bf2b575dd4dd4a0d1aa3efe67bb58bd2d5c4acc5e22a9245b276cf2e9bbe601",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-engine-swap-codex-l7-421-po-2026-07-13.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-engine-swap.md",
   "source_digest": "73b747d3d7369228c6cdcde4ab4e41c4a0a25e284e4cd503e01d1c26aa25eef0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-engine-swap.md",
    "screen:timestamp"
   ],
   "reason": "時点依存の監査/状態スナップショットであり、日付・件数・PLAN番号に強く依存する進捗記述のため恒久ルールとして独立しない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-fable-5-7-13-rate-limit.md",
   "source_digest": "4a98323adfb336cd4d31df64fe68bedb07c440e379dce69453df269fc4246cbc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-fable-5-7-13-rate-limit.md",
    "screen:timestamp"
   ],
   "reason": "時点依存の監査/状態スナップショットであり、日付・件数・PLAN番号に強く依存する進捗記述のため恒久ルールとして独立しない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-feedback-lifecycle-source-of-truth-separation.md",
   "source_digest": "9a1a7a1bbfbbae47eda89936442f9bc7a4a7c9c72e550bdaa1144a5e0b18d1a9",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "harness.db(再構築可能なprojection)とappend-onlyなlifecycle logの責務分離という、feedback処理系のアーキテクチャ原則。SSoT分離は再利用可能な設計判断。",
   "adopt": {
    "memory_id": "memory:reference:feedback-lifecycle-harness-db-feedback-ack-close-supersede--f6efcffc2272",
    "kind": "reference",
    "title": "feedback lifecycleの正本分離: 再構築可能なharness.dbはfeedback消化状態(ack/close/supersede)の正本にしない",
    "tags": [
     "feedback-architecture",
     "harness-db",
     "source-of-truth"
    ],
    "registration": {
     "operation_id": "curation-424:9a1a7a1bbfbbae47",
     "memory_id": "memory:reference:feedback-lifecycle-harness-db-feedback-ack-close-supersede--f6efcffc2272",
     "source_path": ".ut-tdd/memory/reference-feedback-lifecycle-harness-db-feedback-ack-close-supersede--f6efcffc2272.md",
     "content_digest": "fdd5508e0589b2705c1d1516eec1f3085c5d28393405eecef912ab1b453b67e2",
     "exit_code": 0
    },
    "receipt_digest": "f99b3c2b33eef84cbb0c6dd2c530ae48783078401e1ee62e9ddb8a8cf9573081"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-forward-dependency-checkpoint-pr368-exact-7a9f9afe-before-s4.md",
   "source_digest": "058a4f56492f2938e05af84087749fb3737eb7cd2b2c5fd7c2e31dc8c9afe388",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-forward-dependency-checkpoint-pr368-exact-7a9f9afe-before-s4.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-forward-dependency-checkpoint-pr368-flag-before-s4.md",
   "source_digest": "e24380d8d5a3a328da36229bb1def26fee41f2355354a700c7786962f4044eea",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-forward-dependency-checkpoint-pr368-flag-before-s4.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-forward-dependency-checkpoint-pr368-waiting-before-s4.md",
   "source_digest": "934359e7ba29132424c1d3ebc0881dfaf7f0df538effeb3e1c30681838f6f0bf",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-forward-dependency-checkpoint-pr368-waiting-before-s4.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-forward-dependency-checkpoint-pr369-ci-and-s4-lease.md",
   "source_digest": "30936e70686283ea8b75b729a6aaa98cc227cb39036b18fe3f3548879ac2dce7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-forward-dependency-checkpoint-pr369-ci-and-s4-lease.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-forward-ready-zero-while-pr-365-awaits-canonical-merge.md",
   "source_digest": "42d62dc4696517e735187d3070c06e83db789fa01401f512aca92266108c0946",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-forward-ready-zero-while-pr-365-awaits-canonical-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-forward-release-lane-dependency-wait-after-pf-3.md",
   "source_digest": "63d64ec4e1a625212ea56a99db9fb4ad00558e7418d28a7f52416dfc80a25a9a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-forward-release-lane-dependency-wait-after-pf-3.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-github-merge-head-branch.md",
   "source_digest": "cffd704fed6ec19087ddae2536c7399d5047b8e15faad83254ca72e480f9abf1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-github-merge-head-branch.md",
    "screen:timestamp"
   ],
   "reason": "時点依存の監査/状態スナップショットであり、日付・件数・PLAN番号に強く依存する進捗記述のため恒久ルールとして独立しない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-harness-2026-07-09-high-finding2-plan-l7-302-324.md",
   "source_digest": "2ce6ee196d994d605f0b6aa9ffecd534b0bc42985b23984c6aaf4c245f673323",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-harness-2026-07-09-high-finding2-plan-l7-302-324.md",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-incident-detached-stop-db-refresh-bun-runaway-locked-harness-db.md",
   "source_digest": "2fbf8c3fd5e28fe89fc619bdedd8f3908fda7143e3791a5b076711d8725d2771",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-incident-detached-stop-db-refresh-bun-runaway-locked-harness-db.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-incident-parallel-node-test-saturation-cross-lane-taskkill.md",
   "source_digest": "e74b1e9513c4925e590c1c1d9265c0bb272c0a2b873785d86f2df05a6f71c1f4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-incident-parallel-node-test-saturation-cross-lane-taskkill.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-incident-pr-103-merged-with-plan-recovery-16-still-draft.md",
   "source_digest": "647cc84e5352917bcf8746ce00129ca1bfe374f2920398492e8c74045b70d476",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-incident-pr-103-merged-with-plan-recovery-16-still-draft.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-incident-pr-210-merged-with-open-flag-2026-08-03.md",
   "source_digest": "e01e304c6f7a954938cd98679ec9fa30c58420e2ad7386bb399db7d85b389b06",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-incident-pr-210-merged-with-open-flag-2026-08-03.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-issue-108-admission-audit-at-main-2f3f15af-gap-is-real-and-unmet-but-l6-89-not-implementatio-2e0de39135284229.md",
   "source_digest": "8e862677e7e8960e9a33fa0f225a575c1fe74f9e65ddef61a7f11b40fe7ff8b0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-issue-108-admission-audit-at-main-2f3f15af-gap-is-real-and-unmet-but-l6-89-not-implementatio-2e0de39135284229.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-issue-193-ci-109.md",
   "source_digest": "2cbbd5eea417668b6abf8da456544dd56f7fc8db81b857b5647fb3cd60823647",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-issue-193-ci-109.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-issue-209-blocked-by-redesign-supersede-contract.md",
   "source_digest": "3a2ee2e23bbaa3489c019b36516d92d1fe63eb71b24a95f411e978218696654d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-issue-209-blocked-by-redesign-supersede-contract.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-issue-303-305-filed-drive-model-workflow-autogen-flag-feedback-loop.md",
   "source_digest": "d9d663dc9821f07e95b27b2d350e2f8df641c7eee03e61adf0e86d9c26aafb5c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-issue-303-305-filed-drive-model-workflow-autogen-flag-feedback-loop.md",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-issue-344-forward-fsm-implementation-admission-pre-gate-at-main-f4c1bac2-flag-l6-72-declares-efc0e6a8a842934b.md",
   "source_digest": "a5e0be94e6ff767ebfac6d6b787715cfd1ed891ab97320891c3ce1823f96450b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-issue-344-forward-fsm-implementation-admission-pre-gate-at-main-f4c1bac2-flag-l6-72-declares-efc0e6a8a842934b.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-issue-344-forward-fsm-pre-gate-re-derived-at-main-665e3cba-flag-9-of-12-canonical-events-hav-ccd19ee3726b1752.md",
   "source_digest": "c610ab7008f5cad651a2ece5f4eb9b4a194ff5874f3ebed2ab70d3f3e0c65cad",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-issue-344-forward-fsm-pre-gate-re-derived-at-main-665e3cba-flag-9-of-12-canonical-events-hav-ccd19ee3726b1752.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-issue-500-exact-head-pack-ci-bun-ban--ff5b04fe0804.md",
   "source_digest": "e587e70b417b9c129df37794839352fcda1d9334de838429688d10f6085c6e34",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-issue-500-exact-head-pack-ci-bun-ban--ff5b04fe0804.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-issue-77-snapshot-fence-opus-pre-gate-no-re-freeze-needed-all-five-points-already-frozen-at-0ccd76b9cafbe962.md",
   "source_digest": "479fad471f7ee36dd1ac9effacac806fec4b3ba418eb20bd241db6d76b8a7efb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-issue-77-snapshot-fence-opus-pre-gate-no-re-freeze-needed-all-five-points-already-frozen-at-0ccd76b9cafbe962.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-main-debt-blocks-all-pr-ci.md",
   "source_digest": "589b6c27796931a16f48937d73c53a510eb44dbeb486584463e2d54111465b5a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-main-debt-blocks-all-pr-ci.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-p0-2-delivery-parity-measured-oldest-first-delivery-plus-prose-only-supersession-keeps-stale-9ec5d7aa7c00b777.md",
   "source_digest": "3a71ef177eeea29b9d324ff3d7dbfeead792baaf6b374c2a876e897fd125fa50",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-p0-2-delivery-parity-measured-oldest-first-delivery-plus-prose-only-supersession-keeps-stale-9ec5d7aa7c00b777.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-p0-task-pack-harness-db-4-73gb-root-cause-is-per-turn-token-run-rows-from-external-codex-ses-34d05257282eed74.md",
   "source_digest": "f3d2b9d33ce30232e82c8f046dce17102a0676a2c1e765853d524ca6d981bdc5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-p0-task-pack-harness-db-4-73gb-root-cause-is-per-turn-token-run-rows-from-external-codex-ses-34d05257282eed74.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pack-release-endpoint-audit-at-source-2f3f15af-vs-pack-7e11ec15-flag-pf-1-to-pf-5-have-zero-4fc6f02408fc5b1d.md",
   "source_digest": "7d2728776cff582e6f28414741a9a0254e90101de215e49529aa9e505d2a8542",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pack-release-endpoint-audit-at-source-2f3f15af-vs-pack-7e11ec15-flag-pf-1-to-pf-5-have-zero-4fc6f02408fc5b1d.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-phase-0-b-branch-protection-3-2026-07-13.md",
   "source_digest": "425b7fb1953232be9bd2dc5a14209a228ae3e270e5a23ec43fb97809b2dd003d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-phase-0-b-branch-protection-3-2026-07-13.md",
    "screen:timestamp"
   ],
   "reason": "時点依存の監査/状態スナップショットであり、日付・件数・PLAN番号に強く依存する進捗記述のため恒久ルールとして独立しない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-plan-l7-419-forward-fsm-opus-pre-gate-at-main-2f3f15af-flag-not-admissible-7-of-8-fsm-oracle-e88a6ca14250d965.md",
   "source_digest": "507c939d5ef296a985f7daea82783364a6a25dad704a02d4bb75cddaf33f0140",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-plan-l7-419-forward-fsm-opus-pre-gate-at-main-2f3f15af-flag-not-admissible-7-of-8-fsm-oracle-e88a6ca14250d965.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-plan-l7-462-cross-review-retake-codex-frontier-pr-284-286.md",
   "source_digest": "9f636b61c1840a3a20dfc6c80c64e75b3967a0668a153c314c3398ab6b87f526",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-plan-l7-462-cross-review-retake-codex-frontier-pr-284-286.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-plan-l7-462-step-1-pr-279-verdict-merge-step-2-3.md",
   "source_digest": "2112b53e22ff903dee0e7697066d21aeb99952f61267deb81a053359478f8146",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-plan-l7-462-step-1-pr-279-verdict-merge-step-2-3.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-po-block-goal-2026-07-28-mechanism-repair-6-7-d0-forward-3-4-codex-train-assignment.md",
   "source_digest": "8aa90700d0ec3d03d003d781efef2f7b823ff050499e7e782e72b5a259191949",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-po-block-goal-2026-07-28-mechanism-repair-6-7-d0-forward-3-4-codex-train-assignment.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-po-forward-2026-07-31-f1-199-f2-183-f3-191-f4-169.md",
   "source_digest": "d30299ea0ac6c1db951ddb796fed55160762986ca857d64a182878c36230809f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-po-forward-2026-07-31-f1-199-f2-183-f3-191-f4-169.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-po-forward-d0-pr-train-order-2026-07-30-codex-pr-handling.md",
   "source_digest": "a1637b3a197a3fb931faf32699ed0dc924c16a308e9d963fb39b35f7ac9d9ee4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-po-forward-d0-pr-train-order-2026-07-30-codex-pr-handling.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-po-issue-157-codex-goal-handover-2026-07-27.md",
   "source_digest": "9e09d1950872590f1bd40fbfeaf284551c2e219213d9d27bb036ba5be3cd93ee",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-po-issue-157-codex-goal-handover-2026-07-27.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-104-codex-2026-07-17.md",
   "source_digest": "fd272d09404653b9e6add4f8ef27780b0b64edf83e60978c9238169be48e3759",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-104-codex-2026-07-17.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-114-request-codex-review-merge.md",
   "source_digest": "1485fc9e3b65ee179f427081d7e3fb5b03bb0380681df612bbd031f9bfe78f8f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-114-request-codex-review-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-115-request-codex-review-merge.md",
   "source_digest": "d8bbccc91d48cc513a35cca83a1103b5f09076483c59a8dd8ea18ba39a7fec53",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-115-request-codex-review-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-116-request-codex-review-merge.md",
   "source_digest": "11a461d61910f97c814b89c8712dfca1a6843a7f11c6b758b322c38162edb1d8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-116-request-codex-review-merge.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-125-stop-refresh-windowshide-main-worktree-codex.md",
   "source_digest": "33453f247086a45afee40c2b9e1fca6cfd8f8317377947b8a10cd9da04383a8f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-125-stop-refresh-windowshide-main-worktree-codex.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-126-ci-plan-l7-457-generates-3-codex.md",
   "source_digest": "17626842d30f275038c4ea0d9fca12b1c38686e911f7eabd9fff37129e45c776",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-126-ci-plan-l7-457-generates-3-codex.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-126-codex-2026-07-22.md",
   "source_digest": "76284fc3fb4a4c17c0db5e15f6a60b2e0c918c5eee1640d7f8d5cc253e34ca39",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-126-codex-2026-07-22.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-154-db-projection-claim-blind-boundaries.md",
   "source_digest": "aca90b719ff994cdc75502fd06535ff44f5efa3ac0451265ba9edc349fb2e106",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-154-db-projection-claim-blind-boundaries.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-154-db-projection-coverage-ci-red.md",
   "source_digest": "a7191a88418305a381201846800df69f3944c00259c47b9b3cdda8b90b04b7f4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-154-db-projection-coverage-ci-red.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-154-db-projection-markdown-state-machine.md",
   "source_digest": "cde90dd91155309f9ce4b94457b735dcb95aa961f54ba797a8c3e0dc08c5e316",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-154-db-projection-markdown-state-machine.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-154-db-projection-semantic-boundary.md",
   "source_digest": "eed4644255a8aeb9dfb8fa0bc845a348debf169372ccf62624c972e8639eabe7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-154-db-projection-semantic-boundary.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-154-forward-route-metadata-correction.md",
   "source_digest": "b02773a08565f4bd381de889819587d98cd8999d3d9c7b17944de4fb7fec5ecf",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-154-forward-route-metadata-correction.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-154-independent-review-flag.md",
   "source_digest": "8230ee6acdf3456be83179db817773565592fc19dc96f9d88dbf5c8448f5d3d0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-154-independent-review-flag.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-154-managed-trust-overengineering-final-withdrawal.md",
   "source_digest": "46eb37c58bc534b32f8561c595d243f9d906415c965794397da2e2c98da9f833",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-154-managed-trust-overengineering-final-withdrawal.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-155-spec-blind-flag-and-f0a-remediation.md",
   "source_digest": "fb8be2755165ee33670fef6ef7e379cf90f23dab9e549d45b60ff2d1407d5bc3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-155-spec-blind-flag-and-f0a-remediation.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-156-claim-review-flag-remediation.md",
   "source_digest": "c74fe6bd5344890bcff4668b23b33b620c6ce646035d949b42802eea9724fd20",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-156-claim-review-flag-remediation.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-196-exact-head-ea4ef71e-fixture-manifest-re-review-request.md",
   "source_digest": "b9d0e6b94ee45d78d87e211af2b90a178a89fc9c35a3907ac6d7c668380660dc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-196-exact-head-ea4ef71e-fixture-manifest-re-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-197-blocking-state-2026-07-30-dependency-decision-and-artifact-freeze.md",
   "source_digest": "76cdf2cf1ab1c50ec21a8c7666032b065dd2d598199b4424fda2f2155e654859",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-197-blocking-state-2026-07-30-dependency-decision-and-artifact-freeze.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-202-issue-199-fence-cross-review-codex-exact-head-2a5cadc2.md",
   "source_digest": "3304eb3d3582000388d8faa137e92eb8cb50c0697a5741e815f071bbc5ce187e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-202-issue-199-fence-cross-review-codex-exact-head-2a5cadc2.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-204-main-ci-green-203-open.md",
   "source_digest": "9bd813b0a10bc2eddb9899a4dc601d7f4ccc90896ae9e9410a6d4ef12397080a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-204-main-ci-green-203-open.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-204-merge-issue-203-live-lane-carry-203-close.md",
   "source_digest": "2137152dcec800cbf4519139a5401bfc5f157c14a04f64045e9c685bf3c00bee",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-204-merge-issue-203-live-lane-carry-203-close.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-205-d1-receipt-fable-sol-a-sla-1-po.md",
   "source_digest": "57cfc859a8ca693f933fb99fb9cb6320afb53dfcacc45280dc4036e60fe181e1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-205-d1-receipt-fable-sol-a-sla-1-po.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-205-d1-review-dispatch-cross-review-claude-pr-204-flag.md",
   "source_digest": "0185419a1e762cc72357f6fdb670a607c80132882ec9361f4f5b655a1179bd7a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-205-d1-review-dispatch-cross-review-claude-pr-204-flag.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-208-exact-head-09e5d84c-ci-baseline.md",
   "source_digest": "a99d7c7964ce9a750d91f6e9115eb53e765561508c11829ba8490e3308fb6d86",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-208-exact-head-09e5d84c-ci-baseline.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-208-issue-183-cross-review-pr-205-flag-receipt-po.md",
   "source_digest": "9adc8204dcadf70b94380d258a3c4907ef97b2a8221991ecf1dd03eee7648aee",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-208-issue-183-cross-review-pr-205-flag-receipt-po.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-210-foundation-closure-exact-review-at-a5337a9c.md",
   "source_digest": "c136ecb80f7817965dd7be1955eba430bae88179c13541a425d4707b00e3ef80",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-210-foundation-closure-exact-review-at-a5337a9c.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-210-foundation-closure-opus-closing-review-request-at-4bde7404.md",
   "source_digest": "05ebeb030908c7dc4f3ab6e92a10bd05fc91a4dd67e52f664e1f4b98e4b0bc03",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-210-foundation-closure-opus-closing-review-request-at-4bde7404.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-210-foundation-closure-opus-closing-review-request-at-b462eba5.md",
   "source_digest": "dd5f0372fb75b6e539af0d6e08f2c77dfb2f9f7e1d21cc8942fcd4f96c77a1ef",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-210-foundation-closure-opus-closing-review-request-at-b462eba5.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-212-exact-head-8e5cae7f-codex-closing-cross-review-request.md",
   "source_digest": "719698a93fb0caf425118071d548199431d1b5424cb2da541d1e08ec4a575366",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-212-exact-head-8e5cae7f-codex-closing-cross-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-214-closing-review-flag-identity-execute-temp-dir-leak.md",
   "source_digest": "e2872c71a6b3d8ab938c22208ada056f2ea537232f37d8911212119a9de5f3f8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-214-closing-review-flag-identity-execute-temp-dir-leak.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-214-d3b-e2e-receipt-proof-and-close.md",
   "source_digest": "3e6a698dfc5b9dae5c9fedba96c67b1d644e330fd8e57a36c82a565b89a29dc9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-214-d3b-e2e-receipt-proof-and-close.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-214-exact-head-10582f0a-codex-closing-cross-review-request.md",
   "source_digest": "0f8dcc9cc1fc1b4cf529691fb64cc85957ae768298fa8d046cec2c2ae95e6d71",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-214-exact-head-10582f0a-codex-closing-cross-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-214-exact-head-245d649c-codex-closing-cross-review-rerequest.md",
   "source_digest": "97c1e7a1caeb865d82d4d9191e6759eb12d1cc59adea2fc0ce1433beac6bdd46",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-214-exact-head-245d649c-codex-closing-cross-review-rerequest.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-214-exact-head-3b8e92d5-codex-closing-cross-review-rerequest.md",
   "source_digest": "6111db9cb02bbff72d145d74ff68cda5f549a781f37b45bb2e9dcb874b0bb770",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-214-exact-head-3b8e92d5-codex-closing-cross-review-rerequest.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-219-exact-head-5c0fd9e7-codex-closing-cross-review-rerequest.md",
   "source_digest": "4d2d0a0d549605249b4bd6d5ffaa67754a0f33d627adbe2d64e37879f714467e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-219-exact-head-5c0fd9e7-codex-closing-cross-review-rerequest.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-219-exact-head-ea7e7815-codex-closing-cross-review-request.md",
   "source_digest": "e8e8177b6a1b6b262653b445ccd3681883c24b4241130462b6b8ea16735ab91f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-219-exact-head-ea7e7815-codex-closing-cross-review-request.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-276-inbox-retention-flag-exact-head-review.md",
   "source_digest": "a97245736dcfda36834267b97b0fd9aa338f44b839b659ada51266ab787ae34a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-276-inbox-retention-flag-exact-head-review.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-278-verdict-less-merge-blocking-flag-bl-2.md",
   "source_digest": "c3a16c700a6999d1747ccde2fe783afc4e9948bc64112f5ea5c5dba280445dd2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-278-verdict-less-merge-blocking-flag-bl-2.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-281-verdict-merge-3-flag-follow-up-pr.md",
   "source_digest": "03ac4abe9ea8404e745549add59aa8db328f91b61114bfeea242cae124a84004",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-281-verdict-merge-3-flag-follow-up-pr.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-285-d3d-trusted-custody-closing-cross-review-codex-exact-head-9dff5570.md",
   "source_digest": "13f19009227cb7f7c034d5d724ad8c0833156dcdc3f267d378303f56b4770b01",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-285-d3d-trusted-custody-closing-cross-review-codex-exact-head-9dff5570.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-288-plan-l7-465-d3-live-cross-review-codex-family-exact-head-ce68bdbb.md",
   "source_digest": "d43e8991b6debc40b0a0c90f9abfa55bc2d0d232f94acd3f4071b043633aca1d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-288-plan-l7-465-d3-live-cross-review-codex-family-exact-head-ce68bdbb.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-290-post-merge-plan-l7-244-ownership-correction.md",
   "source_digest": "1cc0b02bd8b0e1ba79b1cde3f1b151a2f176d2de8b6f4153cc08253f0b22f5a0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-290-post-merge-plan-l7-244-ownership-correction.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-299-merged-d2-b-merge-gate-landed-plan-l7-465.md",
   "source_digest": "22c6d56f15b7ac5024afbc5694cc8a26c0c25e0c09d5a92702e61ea33b96fce8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-299-merged-d2-b-merge-gate-landed-plan-l7-465.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-300-merged-and-main-ci-green.md",
   "source_digest": "0d0ef2c8439c9eab4eaef248c4fc2358d77972f140c737174e26392fd71e011d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-300-merged-and-main-ci-green.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-306-merged-oracle-cited-but-not-declared-reverse-gate-landed-259.md",
   "source_digest": "50a49694cfc29b11c87dfee1c8f21c1043963b37fc0a8f95cd3c7b82add76771",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-306-merged-oracle-cited-but-not-declared-reverse-gate-landed-259.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-368-exact-head-4721ffd6-closing-pass-and-s4-dependency-checkpoint.md",
   "source_digest": "1fcfa610a98bbfa828dbe17ffb8d4231e0304c587d96016a17baf5a8f4b652c0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-368-exact-head-4721ffd6-closing-pass-and-s4-dependency-checkpoint.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr-88-codex-2026-07-17.md",
   "source_digest": "2c853890cec9391e77278a2546f0091878a10be3d4cc27cf74709cd38b28f596",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr-88-codex-2026-07-17.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr63-pass-e8-e9-test-design-plan-5.md",
   "source_digest": "2df98bcd95d658c1427d9c11564fcca18cbdc56012cc49a99b1e6f0f95c932d7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr63-pass-e8-e9-test-design-plan-5.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr63-pass-weak-e8-e9-6-artifact-it-reentry-01-1.md",
   "source_digest": "1aceb7314c3a295c77a436635c53f244cf7a351d2215454d7552ed3abd354d0d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr63-pass-weak-e8-e9-6-artifact-it-reentry-01-1.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr63-pr65-merged-flag-resolved-by-claude-2026-07-15.md",
   "source_digest": "28a1dba86829dcd913beccb2b62e4fe03c3e248d3027d32d1b374de0db0cdf43",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr63-pr65-merged-flag-resolved-by-claude-2026-07-15.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-pr66-plan-reverse-280-r2-skill-root-cli-doc-sync-r3-r4-l7-277.md",
   "source_digest": "747c5aaa20ab74237f1f248f546734d5eeb018459e457c515290d1df9a503f67",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-pr66-plan-reverse-280-r2-skill-root-cli-doc-sync-r3-r4-l7-277.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-process-violation-pr-268-271-verdict-less-merge-2026-08-06.md",
   "source_digest": "ee386dbd729681bde958d8fa58baecde2275e9ec222805dcabbac93c4f771566",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-process-violation-pr-268-271-verdict-less-merge-2026-08-06.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-process-violation-pr-285-plan-l7-465-draft-deliverable-merge-main-2026-08-07.md",
   "source_digest": "5651be073d3e8b2f875caaf1b9df3817dd90388f2ead9021c7edec099e57637e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-process-violation-pr-285-plan-l7-465-draft-deliverable-merge-main-2026-08-07.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-process-violation-pr-300-merged-before-claude-closing-pass-receipt-2026-08-13.md",
   "source_digest": "096b5f14a6da6d366386b9e7053f32b06652f825fbc959683898ea2bf581b804",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-process-violation-pr-300-merged-before-claude-closing-pass-receipt-2026-08-13.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:review-episode",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-repository-placement-must-separate-git-durable-state-and-scratch.md",
   "source_digest": "c7b5f951f3f1479721546681f7649e3e337059ead6b5b8e6b6db03cbac8d07b9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-repository-placement-must-separate-git-durable-state-and-scratch.md",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (review-episode/issue-number/personal-path)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-shared-harness-memory-has-not-been-committed-since-2026-08-13-and-is-split-per-worktree-488-12117f2643a47d5c.md",
   "source_digest": "4b7d056f1c7a16c265c7926ec331f3b46bc9d26a61d1b68c9771f4e7c041208e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-shared-harness-memory-has-not-been-committed-since-2026-08-13-and-is-split-per-worktree-488-12117f2643a47d5c.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-skill-admission-gate-codex-freeze-add-impl-plan-l7-411.md",
   "source_digest": "2f9a98972b8e0dea5450afad3ffccbcd330e27084c5d3b7abeedc94885da0985",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-skill-admission-gate-codex-freeze-add-impl-plan-l7-411.md",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (review-episode)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-stacked-pr-harness-check-trigger-debt.md",
   "source_digest": "60d5fb3ac4195e6f16d49b14f2d917efe2195d6f54b8fcfeea3498f955da90c0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-stacked-pr-harness-check-trigger-debt.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-u-1-diagnosis-the-disk-growth-engine-is-the-unfiltered-ingestion-in-stop-refresh-not-only-pe-37bb3e5cec49e185.md",
   "source_digest": "cc6c3c4de13876e98402eb322447255846734a91ac72d64a021254c8553dbcce",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-u-1-diagnosis-the-disk-growth-engine-is-the-unfiltered-ingestion-in-stop-refresh-not-only-pe-37bb3e5cec49e185.md",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-u-1-opus-pre-gate-frozen-no-new-plan-no-supersedes-no-generates-change-stop-refresh-ts-has-e-c4862b6f26257c77.md",
   "source_digest": "efc8abb25b8b7411d63d755b7d541aa8822efedb35c71f7d97be9b7e5780a8cd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-u-1-opus-pre-gate-frozen-no-new-plan-no-supersedes-no-generates-change-stop-refresh-ts-has-e-c4862b6f26257c77.md",
    "screen:pr-number",
    "screen:issue-number",
    "screen:commit-hash",
    "screen:timestamp"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-v-model-engine-swap-policy.md",
   "source_digest": "e30045faa3396b9e01e940c97c7f21f545b733959d4282fc495ed6b3ec579779",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-v-model-engine-swap-policy.md",
    "screen:timestamp"
   ],
   "reason": "時点依存の監査/状態スナップショットであり、日付・件数・PLAN番号に強く依存する進捗記述のため恒久ルールとして独立しない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-vitest-full-suite-ut-tdd-gate-runs-g4-doctor-orphan.md",
   "source_digest": "f9f31e81b7b690fe34a3833cc4a91f1f0d5b29e4bcc306c86909184cde27bf80",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-vitest-full-suite-ut-tdd-gate-runs-g4-doctor-orphan.md",
    "screen:timestamp"
   ],
   "reason": "時点依存の監査/状態スナップショットであり、日付・件数・PLAN番号に強く依存する進捗記述のため恒久ルールとして独立しない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-windows-env-pitfalls.md",
   "source_digest": "9bf3bb019e046aa0e1b693df51e94d9a44e4c3bf2b258439a008f2ebb0c394b3",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md (readability gate, mojibake fail-close)",
    "src/lint/readability.ts"
   ],
   "reason": "Windows/POSIX混在環境固有の運用上の落とし穴で、readability gate等の既存機構と整合する具体的な注意点。",
   "adopt": {
    "memory_id": "memory:reference:windows-bash-tool-mojibake-gate-cmd-spawn--4065145dff86",
    "kind": "reference",
    "title": "Windows開発環境の落とし穴: Bash tool制限/日本語ファイル名/mojibake gate/.cmd spawn盲点",
    "tags": [
     "ci-blind-spot",
     "readability",
     "windows"
    ],
    "registration": {
     "operation_id": "curation-424:9bf3bb019e046aa0",
     "memory_id": "memory:reference:windows-bash-tool-mojibake-gate-cmd-spawn--4065145dff86",
     "source_path": ".ut-tdd/memory/reference-windows-bash-tool-mojibake-gate-cmd-spawn--4065145dff86.md",
     "content_digest": "02a03f976c5ca21e52a0fc2a09c5d89974b915172514df8e4cb1fe110d5575a4",
     "exit_code": 0
    },
    "receipt_digest": "a92f1023d52b744a40167118ce41361ec028b658ce0f0ee7992cdb12e7b1e1d1"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/project-zip-entry-encoding-and-separator-portability.md",
   "source_digest": "fac583271bec8655bf135ffd60b724b602005baefa283c628d95f5055a07a126",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/project-zip-entry-encoding-and-separator-portability.md",
    "screen:timestamp"
   ],
   "reason": "時点依存の監査/状態スナップショットであり、日付・件数・PLAN番号に強く依存する進捗記述のため恒久ルールとして独立しない (episode_independent不成立)。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/reference-fix-memory-dir-eexist-on-bun.md",
   "source_digest": "20647f6ff69b6de6eba1ec4f124ab059dcc7e7434e39714692031d6de37fa156",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/reference-fix-memory-dir-eexist-on-bun.md",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "PR番号・commit・issue番号・時点実測に強く依存する参照であり、現行の恒久ドキュメントから独立した再利用可能な参照として残せない、または裏付け不明。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/reference-how-to-mint-review-revision-for-ut-tdd-claude-role-reviewer.md",
   "source_digest": "9d7948c6b1fcd335ec933e7b84665ebf852218cf6876e4bfc0188ece58889bf6",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/feedback/review-verdict-custody.ts (canonicalReviewRevision, 60-90行)"
   ],
   "reason": "review-verdict-custody.tsの実装(digest計算対象フィールド、rv1-prefixの意味)に直接裏付けられた、実行可能な操作手順。",
   "adopt": {
    "memory_id": "memory:reference:ut-tdd-claude-role-reviewer-review-revision-rv1-prefix-strict-custody--0234fe9c05f9",
    "kind": "reference",
    "title": "ut-tdd claude --role reviewer 実行時の --review-revision の作り方: rv1-prefixがstrict custodyを起動する",
    "tags": [
     "cli-usage",
     "review-custody",
     "review-revision"
    ],
    "registration": {
     "operation_id": "curation-424:9d7948c6b1fcd335",
     "memory_id": "memory:reference:ut-tdd-claude-role-reviewer-review-revision-rv1-prefix-strict-custody--0234fe9c05f9",
     "source_path": ".ut-tdd/memory/reference-ut-tdd-claude-role-reviewer-review-revision-rv1-prefix-strict-custody--0234fe9c05f9.md",
     "content_digest": "81a667eaa584c40d0e4b17da10b78d074e456fe071ff4a4da4812b9ca8920f01",
     "exit_code": 0
    },
    "receipt_digest": "7c610aed217f56d59807f6aa54cfdc1ba9041999933d045d265bfcfcfa4a5850"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/reference-junction-worktree-git-worktree-remove-force-main-node-modules.md",
   "source_digest": "656d225f5a34b6bcd5bc4cfb3dfc92402764eadeef0dea45222ac5ae541aa39f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/reference-junction-worktree-git-worktree-remove-force-main-node-modules.md",
    "screen:timestamp"
   ],
   "reason": "merged into worktreeを畳む前にnode_modulesがprimaryと実体共有しているか probe で判定する: entry数や見た目では区別できない"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/reference-ut-tdd-advisor-execute-provider-2026-08-07-dry-run.md",
   "source_digest": "3089db884f53f6d3b880d48deff9e3fa6a69d8fc8599da96bfad9e413063c7a7",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §PO判断への反射的エスカレーション禁止 (advisor unavailableの扱い)"
   ],
   "reason": "既存canonical原則(advisor双方利用不能時の扱い)を、実際の無応答症状(dry-runは正常・実spawnが返らない)の診断手順として具体化した実務ルール。",
   "adopt": {
    "memory_id": "memory:feedback:advisor-execute-1--dc470036c31c",
    "kind": "feedback",
    "title": "advisor --executeが無応答のときは待ち続けず、1試行だけ記録して高影響境界か既存契約から一意に決まるかで仕分ける",
    "tags": [
     "advisor",
     "escalation",
     "failure-diagnosis"
    ],
    "registration": {
     "operation_id": "curation-424:3089db884f53f6d3",
     "memory_id": "memory:feedback:advisor-execute-1--dc470036c31c",
     "source_path": ".ut-tdd/memory/feedback-advisor-execute-1--dc470036c31c.md",
     "content_digest": "8e24b83c97f1deb518cba7fef2527cd781c84f090a2c1f416f3d8b8160e364cb",
     "exit_code": 0
    },
    "receipt_digest": "1c1b35bceb75565810a27421870b51356d9afe8327df66fc38a4728580290315"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/reference-workflow-dispatch-default-branch-d3d-live.md",
   "source_digest": "3c59660d48646ea2d5238910b092bf2fe39f87bd663a33359f88dbb2f613834e",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "GitHub Actions workflow_dispatchの仕様(default branch必須)に基づく、設計判断に直接影響する再利用可能な制約事実。",
   "adopt": {
    "memory_id": "memory:reference:github-workflow-dispatch-default-branch-feature-branch-workflow-merge--b0ce37c21790",
    "kind": "reference",
    "title": "GitHub workflow_dispatchはdefault branch必須: feature branch限定の新規workflowはmerge前に結合試験できない",
    "tags": [
     "ci-design",
     "github-actions",
     "workflow-dispatch"
    ],
    "registration": {
     "operation_id": "curation-424:3c59660d48646ea2",
     "memory_id": "memory:reference:github-workflow-dispatch-default-branch-feature-branch-workflow-merge--b0ce37c21790",
     "source_path": ".ut-tdd/memory/reference-github-workflow-dispatch-default-branch-feature-branch-workflow-merge--b0ce37c21790.md",
     "content_digest": "ff9e0dc028e3f5d5d21ef7c7e1cd1222bd29798c04f84f5178da020932b1247c",
     "exit_code": 0
    },
    "receipt_digest": "ae8aea69b592f01502fa690a7e7c032e0f3c2eaa4788a3168ff6de7d343b0fb4"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/user-db-github-forward.md",
   "source_digest": "201609e24477f6d139a2a022ac2a9327af31d0e1cfdbe67c47418b8a645c7040",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "GitHub状態を正本にせず、HARNESS DBから冪等投影・再送するという、Forward再合流パイプラインの恒久的な設計原則。PR/commit/日付を含まない設計宣言。",
   "adopt": {
    "memory_id": "memory:user:forward-github-harness-db--780b677a5a18",
    "kind": "user",
    "title": "Forward再合流パイプライン設計原則: GitHubを正本にせずHARNESS DBから冪等投影・再送する",
    "tags": [
     "execution-ledger",
     "forward-pipeline",
     "po-decision"
    ],
    "registration": {
     "operation_id": "curation-424:201609e24477f6d1",
     "memory_id": "memory:user:forward-github-harness-db--780b677a5a18",
     "source_path": ".ut-tdd/memory/user-forward-github-harness-db--780b677a5a18.md",
     "content_digest": "6ae6bafd76b0ae0ebc12146939e76b765c6d635c73fd0854ec93b8efecc70d62",
     "exit_code": 0
    },
    "receipt_digest": "d973648ab87e52700ebb1681df62fa13ff84bc26ed4de62415969bd8a479156a"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/user-forward-escape-issue-requires-a-drive-model.md",
   "source_digest": "aa1dbe4dec0a31717d62229b5e8a88abf43c8effe9c6af1a8517b15433406a17",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §GitHub Issue Hierarchy"
   ],
   "reason": "Forward escapeとGitHub Issue起票の対応関係を定めるPO恒久ルールで、drive_model選択の必須化という具体的な機械可検査ルールを含む。",
   "adopt": {
    "memory_id": "memory:user:forward-escape-github-issue-drive-model-origin-plan-escape-re-entry--62ece56af813",
    "kind": "user",
    "title": "Forward escapeのGitHub Issue起票はdrive_model選択を必須とし、origin PLAN/escape理由/re-entry方針を束縛する",
    "tags": [
     "drive-model",
     "forward-escape",
     "github-issue"
    ],
    "registration": {
     "operation_id": "curation-424:aa1dbe4dec0a3171",
     "memory_id": "memory:user:forward-escape-github-issue-drive-model-origin-plan-escape-re-entry--62ece56af813",
     "source_path": ".ut-tdd/memory/user-forward-escape-github-issue-drive-model-origin-plan-escape-re-entry--62ece56af813.md",
     "content_digest": "004447716dbcda50458da5164a158bf6bf1377be49a049484582fdff34ec0932",
     "exit_code": 0
    },
    "receipt_digest": "ccf59fade8bc0d0fa498f5102bd6ed7e6d7288eb9c9599f74fbaaa6d03d99e26"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/user-forward-escape-issues-are-design-learning-telemetry.md",
   "source_digest": "df02da2567516a1ef32efb8da97f25640ddf4fe1ec37ca92ce1f6e450a8e348b",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §GitHub Issue Hierarchy"
   ],
   "reason": "Forward escape Issueを単なる不具合チケットではなく型付き設計学習telemetryとして扱うPO恒久ルール。再現率削減という明確な最適化目標を持つ。",
   "adopt": {
    "memory_id": "memory:user:forward-escape-issue-telemetry--986270ba597f",
    "kind": "user",
    "title": "Forward escape Issueは単なる不具合チケットではなく型付き設計学習telemetryとして扱う",
    "tags": [
     "design-telemetry",
     "forward-escape",
     "github-issue"
    ],
    "registration": {
     "operation_id": "curation-424:df02da2567516a1e",
     "memory_id": "memory:user:forward-escape-issue-telemetry--986270ba597f",
     "source_path": ".ut-tdd/memory/user-forward-escape-issue-telemetry--986270ba597f.md",
     "content_digest": "a51cd7ed02360ef56de2fd56b49912cceebe4440998b6c5a23d857994f6ac9b6",
     "exit_code": 0
    },
    "receipt_digest": "64f40250c94ec86838cb64ba17de3138389b1d788b1b0d49bb49ec9be4ff1403"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/user-github-issue-is-the-forward-escape-boundary.md",
   "source_digest": "da6f147b563ce3f493e7c062c6ba9b863107ac7c54a9fb32fd4db6f91f9bdfb7",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §UT-TDD Workflow (Forward: plan -> pair-freeze -> implement -> trace-freeze -> review -> accept)"
   ],
   "reason": "GitHub Issueを正規Forward経路には不要としつつ、escapeの境界を定義するPO恒久ルール。既存のForwardワークフロー定義と直接整合する。",
   "adopt": {
    "memory_id": "memory:user:github-issue-forward-forward-escape--ff1303fac3b3",
    "kind": "user",
    "title": "GitHub Issueは正規Forward経路には不要で、Forward経路を離れる作業(escape)の境界としてのみ必要",
    "tags": [
     "forward-escape",
     "github-issue",
     "workflow-boundary"
    ],
    "registration": {
     "operation_id": "curation-424:da6f147b563ce3f4",
     "memory_id": "memory:user:github-issue-forward-forward-escape--ff1303fac3b3",
     "source_path": ".ut-tdd/memory/user-github-issue-forward-forward-escape--ff1303fac3b3.md",
     "content_digest": "33783114b56b35396331d7ee723d51c692e69a385ce314f9eb93e6f8abc765fc",
     "exit_code": 0
    },
    "receipt_digest": "d6ea12507224c34edd40ea02b41f189a484606e111a428c945695da2ce29705f"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/user-po-bun-permanent-ban-node-rust-target.md",
   "source_digest": "ebd23980fbaeadb7ab8abc083570a2ae1902d17b14e94c8a5e06e31b32b1d600",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "archive:docs/archive/memory-legacy-2026-09/user-po-bun-permanent-ban-node-rust-target.md",
    "screen:issue-number",
    "screen:timestamp"
   ],
   "reason": "既存のCLAUDE.md記載事項と重複するか、PR/issue番号・時点実測に強く依存し恒久ルールとして独立しない。"
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/user-po-claude-pr-merge-responsibility-and-post-merge-safety.md",
   "source_digest": "c542ae4131396e51d4d17106c975833f072e98b5abb0579564d39471c06bf640",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §運用規律の再締結 (merge protocol)"
   ],
   "reason": "PR対応を「レビューして相手待ちで止める」のではなくCI通過からmerge、合流後安全確認まで完遂するというPO運用ルール。merge禁止の明示がある場合の優先も明記。",
   "adopt": {
    "memory_id": "memory:user:pr-ci-merge--f7cfa9818d88",
    "kind": "user",
    "title": "PR対応依頼はCI通過からmerge、合流後安全確認まで完遂する: 「レビューして相手待ち」で止めない",
    "tags": [
     "merge-ownership",
     "po-rule",
     "pr-completion"
    ],
    "registration": {
     "operation_id": "curation-424:c542ae4131396e51",
     "memory_id": "memory:user:pr-ci-merge--f7cfa9818d88",
     "source_path": ".ut-tdd/memory/user-pr-ci-merge--f7cfa9818d88.md",
     "content_digest": "e8db6a9cc8f8bc4d3eb07ae749573bc97dafe55dd96544a2c2ff882fd6861fc8",
     "exit_code": 0
    },
    "receipt_digest": "beac1d1fbb091d4650185a50bbf5c42ba563ce0f767e7236483e30d0054f35db"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/user-po-claude-pr-request-poll-30m.md",
   "source_digest": "877f6c161b8394d350b07103ee511997c327ffe91359b5ca6c0928bff22cbe6f",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "Claude Codeの巡回運用の頻度・確認範囲を定める具体的な運用ルール。stale進捗メモの増殖を避ける注意も含む。",
   "adopt": {
    "memory_id": "memory:user:claude-code-30-harness-pr-cross-review--c0e5cfce8d12",
    "kind": "user",
    "title": "Claude Codeは作業中30分単位で共有HARNESSメモリを巡回しPR対応・cross-review依頼の追加/更新を確認する",
    "tags": [
     "memory-polling",
     "operational-cadence",
     "po-rule"
    ],
    "registration": {
     "operation_id": "curation-424:877f6c161b8394d3",
     "memory_id": "memory:user:claude-code-30-harness-pr-cross-review--c0e5cfce8d12",
     "source_path": ".ut-tdd/memory/user-claude-code-30-harness-pr-cross-review--c0e5cfce8d12.md",
     "content_digest": "cc7937bfe4923488c94f822a6cdf592965347a7d47dd448c9aed66d51b82879d",
     "exit_code": 0
    },
    "receipt_digest": "a2c821879da39ec57c2afaf454f7bce28028250b7d3b245d2c50894f1edfb75d"
   }
  },
  {
   "source": "tracked",
   "archive_path": "docs/archive/memory-legacy-2026-09/user-po-interaction-rules.md",
   "source_digest": "e21c6faaacafb83335bf7ff06029e98f1cc59aa3c5a6903779f790666a8c1cdd",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §コミュニケーション (報連相) (日本語チャット規約は既存)"
   ],
   "reason": "コミュニケーション・handover・停止基準・工程記録・Recovery扱いという複数の独立したPO確立ルールの短い束。既存CLAUDE.mdに未反映の項目(改善する=実装する、強制停止=最高severity、Recoveryは本線扱い等)を補う。",
   "adopt": {
    "memory_id": "memory:user:po-plan-handover-severity-recovery--dc90c1be77ec",
    "kind": "user",
    "title": "PO対話規約の要点: 「改善する」は実装を意味し、PLAN完了時はhandover必須、強制停止は最高severity、Recoveryは本線扱い",
    "tags": [
     "po-communication",
     "po-rule",
     "workflow-discipline"
    ],
    "registration": {
     "operation_id": "curation-424:e21c6faaacafb833",
     "memory_id": "memory:user:po-plan-handover-severity-recovery--dc90c1be77ec",
     "source_path": ".ut-tdd/memory/user-po-plan-handover-severity-recovery--dc90c1be77ec.md",
     "content_digest": "4af0f67f2d1d46a1567debffb47ebe12eb6f1a80026a853c6dac7b0de66a04fb",
     "exit_code": 0
    },
    "receipt_digest": "6a3e765497f2056d1445e6509e7510aba1e14bc4e3a918e91878b2e65f5e0eaf"
   }
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:733534b60837291cddeaa8d7",
   "source_digest": "65f7f4e17021796b7cbebabafaf8a0703be54a97a94a35adffb8d0e997b91f53",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:733534b60837291cddeaa8d7",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:095b052ca592bb31710c2c94",
   "source_digest": "01559524e2e54bd5740922ed3dd7216534670b68d96da4c4803899edfbc54a5d",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "tests/*.test.ts (mutation probeの一般的作法)"
   ],
   "reason": "同一guardの重複箇所を取り違えて到達不能な複製を消してしまうケースと、snapshot runnerが未commit変更を含まず実行されないケースという、独立した2つのmutation probe失敗様式を統合。",
   "merged_from": [
    "991f4d6e51f99767e86d5cedb9ee543023818098bc84786373cdbea0b144a8a2"
   ],
   "adopt": {
    "memory_id": "memory:feedback:mutation-probe-snapshot-runner-worktree--49d7eaab4415",
    "kind": "feedback",
    "title": "mutation probeのチェックリスト: 消した出現箇所を行番号で確認する、snapshot runnerを使わずworktreeで直接実行する",
    "tags": [
     "falsifiability-probe",
     "mutation-testing",
     "testing-methodology"
    ],
    "registration": {
     "operation_id": "curation-424:01559524e2e54bd5",
     "memory_id": "memory:feedback:mutation-probe-snapshot-runner-worktree--49d7eaab4415",
     "source_path": ".ut-tdd/memory/feedback-mutation-probe-snapshot-runner-worktree--49d7eaab4415.md",
     "content_digest": "02871693f01e50fcf19c91240fa9e5b1d1174031acdff77c8ff04f5b8ecee4db",
     "exit_code": 0
    },
    "receipt_digest": "ecaaefb50fc7b31f16e102bb56f748c1ad9269e82cb96b659c64fa7c2cbcae3c"
   }
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:32edce3341b7000d8e60d148",
   "source_digest": "15f5807638356311ad1c73a1057a56fa5a16994371da26063baf69c83b8ab4d5",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/plan-admission/plan-ledger-rehydrator.ts"
   ],
   "reason": "rehydrator実装の前提(HEAD canonical digestとterminal receiptのcontent_digestの一致)を検証せずに採否判断すると、実装・review完了後に発覚するという、legacy PLAN移行手法選択時の具体的な検証手順。",
   "adopt": {
    "memory_id": "memory:feedback:legacy-plan-rehydration-head-digest-terminal-receipt-content-digest--1ef98d72a7b7",
    "kind": "feedback",
    "title": "legacy PLANのrehydration選択前にHEAD digestとterminal receiptのcontent_digest一致を実測する",
    "tags": [
     "content-digest",
     "plan-migration",
     "rehydration"
    ],
    "registration": {
     "operation_id": "curation-424:15f5807638356311",
     "memory_id": "memory:feedback:legacy-plan-rehydration-head-digest-terminal-receipt-content-digest--1ef98d72a7b7",
     "source_path": ".ut-tdd/memory/feedback-legacy-plan-rehydration-head-digest-terminal-receipt-content-digest--1ef98d72a7b7.md",
     "content_digest": "0f2f056072164e81ac1ecc109f95cad5f8e3280039ed591c293e573ebc82cc5b",
     "exit_code": 0
    },
    "receipt_digest": "f00f04bbf95be1e3d430e27e9a1366fb53462ce07129e34640a43de323f2edb5"
   }
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:efafd8921bb3d626c38a285d",
   "source_digest": "d9a65a31e0c6a241863bd2b47256f82b32c53cb8fecf0916e89fdaf259a9c95e",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §PLAN Rules (doctor gateの正本はSSoT参照)"
   ],
   "reason": "doctor gateが失敗したとき、lintコードの記憶ではなくgate自体のremediationメッセージと所有契約(対応するPLAN)を読むという、再発しやすい誤判定を避けるレビュー手順。",
   "adopt": {
    "memory_id": "memory:feedback:doctor-gate-lint-gate-remediation-plan--04be072adfaa",
    "kind": "feedback",
    "title": "doctor gateが失敗したら、lintコードの記憶ではなくgate自体のremediationメッセージと所有契約(対応PLAN)を読んでから是正順序を指示する",
    "tags": [
     "doctor-gate",
     "plan-hierarchy",
     "review-methodology"
    ],
    "registration": {
     "operation_id": "curation-424:d9a65a31e0c6a241",
     "memory_id": "memory:feedback:doctor-gate-lint-gate-remediation-plan--04be072adfaa",
     "source_path": ".ut-tdd/memory/feedback-doctor-gate-lint-gate-remediation-plan--04be072adfaa.md",
     "content_digest": "5b2bc0df20ae596176e4beae959655b14d7b92e1f65163d7e872484da1560b38",
     "exit_code": 0
    },
    "receipt_digest": "ae19a3e30c3dff56f869d009c4350fd2b13ec49cc96cea7493d797902f9f7bfd"
   }
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a5759549ba7703c156cc415a",
   "source_digest": "5609b2a6b6da3ec811ca5df0bb83a1960b9b0c8969aef792dfdf7dc6371e202e",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/runtime/adapter.ts (buildAdapterPlan)",
    "src/cli/delegation.ts",
    ".claude/settings.local.json (allowlist)"
   ],
   "reason": "Claude familyのclosing reviewがexact head worktreeでnodeを実行できないという現行の制約と、その暫定運用(control laneが実測を代行しblind packetへ添付)を記述した実務ルール。",
   "adopt": {
    "memory_id": "memory:feedback:claude-closing-review-exact-head-worktree-node-control-lane-blind-packet--0cf6ed02cea5",
    "kind": "feedback",
    "title": "Claude closing reviewはexact head worktreeでnode直接実行不可: control laneが実測してblind packetへ添付する",
    "tags": [
     "blind-review",
     "claude-review-lane",
     "sandbox-limitation"
    ],
    "registration": {
     "operation_id": "curation-424:5609b2a6b6da3ec8",
     "memory_id": "memory:feedback:claude-closing-review-exact-head-worktree-node-control-lane-blind-packet--0cf6ed02cea5",
     "source_path": ".ut-tdd/memory/feedback-claude-closing-review-exact-head-worktree-node-control-lane-blind-packet--0cf6ed02cea5.md",
     "content_digest": "bb2eb5adb3359b964412f870542a1fc16dc16d73905a653b6be818b9c04eb840",
     "exit_code": 0
    },
    "receipt_digest": "2e9b3eff8871f36053b5cfa68e7e1326fa4eab8f7f04f79336971acf8d899f93"
   }
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:bd974a57d541ce1a85622b2f",
   "source_digest": "30b440bf8c5107cec6cab40f79202b14dcfe5c58fcd2cc4986e78c3b68ad64ee",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "repo構造上の一般原則(具体パス無し)"
   ],
   "reason": "doctor CI出力のgrepパターンを特定の件数表記に固定すると別件数の違反行を取りこぼすという、CI/doctorログ調査手法上の一般的な罠。",
   "adopt": {
    "memory_id": "memory:feedback:ci-doctor-violation-grep-violation-1--c3aecad71fb2",
    "kind": "feedback",
    "title": "CI/doctorログのviolation行をgrepするときは件数表記(violation 1等)にパターンを固定しない",
    "tags": [
     "ci-triage",
     "doctor-output",
     "grep-pitfall"
    ],
    "registration": {
     "operation_id": "curation-424:30b440bf8c5107ce",
     "memory_id": "memory:feedback:ci-doctor-violation-grep-violation-1--c3aecad71fb2",
     "source_path": ".ut-tdd/memory/feedback-ci-doctor-violation-grep-violation-1--c3aecad71fb2.md",
     "content_digest": "f4b48f4db579a42f6306cb0a18f0bfbc1bb703a7758ec5ba62013c249d637ff0",
     "exit_code": 0
    },
    "receipt_digest": "8c504a497a83e25ba0922c28f38bf0f8df807d95cfe891f0a3620278b02967d1"
   }
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1c5051e47673eb72943ab1b3",
   "source_digest": "d4b27b50e5ed4dbc41fba8aedab76970d4de41f2b607c93d7d013cdb4aefc656",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1c5051e47673eb72943ab1b3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:689583a1d1d9d937b842b06c",
   "source_digest": "98f369ab8b113f77f0fe286eaa931c0673cb433ea4d8369ac13fe1e92ae5b5f3",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "CLAUDE.md §運用規律の再締結 (same_family_reviewer機械強制)"
   ],
   "reason": "PO判断として記録された恒久ルール。族分離の機械強制(same_family_reviewer検査)は緩めず、判断コストの小さい編集の著者性論争で本線を止めないという運用上のバランス。",
   "adopt": {
    "memory_id": "memory:user:verdict-family--3b3dfdb8146e",
    "kind": "user",
    "title": "数行程度の小さな編集の著者性をめぐって本線を止めない: verdictを出すfamilyの族分離は機械強制のまま維持する",
    "tags": [
     "cross-review",
     "family-separation",
     "po-rule"
    ],
    "registration": {
     "operation_id": "curation-424:98f369ab8b113f77",
     "memory_id": "memory:user:verdict-family--3b3dfdb8146e",
     "source_path": ".ut-tdd/memory/user-verdict-family--3b3dfdb8146e.md",
     "content_digest": "197bf49e4b9ebf07171eeedf11714b7815dc31fbc49f607419b8264c0b4d9dd2",
     "exit_code": 0
    },
    "receipt_digest": "6bdbb6470f8fbeab300a36ce8109e32fad071d88e9d3a94a0ec39de0b0d594c4"
   }
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b057d7272fc1434accd5f8ae",
   "source_digest": "9899c00d4c20540bd15ff4de2dacb982efbe625cabd6b85bb452fc577c56cff9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b057d7272fc1434accd5f8ae",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2f48e099c9da01f81594268b",
   "source_digest": "f45d6b93e435b5811dda67191a14f3bce3664554e8f3ac6007d906636202c083",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    "src/runtime/adapter.ts (provider commandをspawnする経路)"
   ],
   "reason": "provider CLIの実体パスがPATHから外れて起動失敗するという再現性のある症状と、90秒未満での終了を起動失敗の兆候として扱う診断順序。個人ホームパスは除去。",
   "adopt": {
    "memory_id": "memory:feedback:provider-review-90-path-provider-cli--4cb8d9f9e477",
    "kind": "feedback",
    "title": "provider reviewが90秒未満で終了したら判定内容ではなくPATH上のprovider CLI解決を先に疑う",
    "tags": [
     "path-diagnosis",
     "provider-review",
     "review-custody"
    ],
    "registration": {
     "operation_id": "curation-424:f45d6b93e435b581",
     "memory_id": "memory:feedback:provider-review-90-path-provider-cli--4cb8d9f9e477",
     "source_path": ".ut-tdd/memory/feedback-provider-review-90-path-provider-cli--4cb8d9f9e477.md",
     "content_digest": "08026575d41b9a6f0c2b58dda2605b90e9f0eec4709172975dd9c5eab084c1c0",
     "exit_code": 0
    },
    "receipt_digest": "711c6b508a7b28ea4aaf58cad32ffb1e823875ec7b2345d7f9f46f467de2428a"
   }
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:fa2f1e51eaf31b9817407bb2",
   "source_digest": "ce5173f41603bc5709f03648ba77051208b32c250e67930db0a87725406fb569",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:fa2f1e51eaf31b9817407bb2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "merged into worktreeを畳む前にnode_modulesがprimaryと実体共有しているか probe で判定する: entry数や見た目では区別できない"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3c80e6b145964bd89f42c2b3",
   "source_digest": "985378c9f8448a12849dc2e9250d93a9b621fdc0a83f0b1495fc7a668a6d7b82",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3c80e6b145964bd89f42c2b3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b0055949da13df79c36e4487",
   "source_digest": "f5cc1fc81443616a589484927ff4bf25040892899ff6467c93aa9f5a1755f637",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b0055949da13df79c36e4487",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:81e601611793fdb1bc734e71",
   "source_digest": "991f4d6e51f99767e86d5cedb9ee543023818098bc84786373cdbea0b144a8a2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:81e601611793fdb1bc734e71",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "merged into mutation probeのチェックリスト: 消した出現箇所を行番号で確認する、snapshot runnerを使わずworktreeで直接実行する"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4e2024735b66316bef555d4b",
   "source_digest": "2fd5ec9b543e99612cfefdae9189dd13475c83d449fe98c2c9a283d7b2883a25",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4e2024735b66316bef555d4b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "merged into worktreeを畳む前にnode_modulesがprimaryと実体共有しているか probe で判定する: entry数や見た目では区別できない"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:651661864cf13e5f705aa043",
   "source_digest": "0296bcce050ca6b41f9fea8ba012672b396f9fdf84b01d00f645423df7ddc601",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:651661864cf13e5f705aa043",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2456b79ee12a943c6c2951fc",
   "source_digest": "e8503570c4c802d927148bce77085f27ce0f836e639ca5cacced4bd6b3ad32c7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2456b79ee12a943c6c2951fc",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (review-episode/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:129870afd0ebc04f5cf53dd6",
   "source_digest": "36fd53d4e0909aac4292bca6ac26d2127d0aeaae27a9167644cfd2103adbd218",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:129870afd0ebc04f5cf53dd6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:46b3c131f16727ca9dd89986",
   "source_digest": "a166d2aa6669f3ab8b1da642f0531f51589d7994bf54c9cb64e60e215396572c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:46b3c131f16727ca9dd89986",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:707baf659a989b52f85dfd91",
   "source_digest": "481de6612ddd4d3563f264104555a2ee803eff7171e3fa24b3a9bc296de51b51",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:707baf659a989b52f85dfd91",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:191819137b63bb6d3c48a8f2",
   "source_digest": "52de8b1c3e3568dd9b078db360ce293573a2e4f435727d796c5e4563f9b28780",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:191819137b63bb6d3c48a8f2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:00a186f796fbac192a1490d3",
   "source_digest": "9f29909bda3cdd2bbecd3b590b29c984be6552dd1feb390e7194b0f45ac3d293",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:00a186f796fbac192a1490d3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7c90f1928a58556c9a2d01cb",
   "source_digest": "8cfb04f094835aee2d0a89ceec669bd1572b189e2be00f6ee1f14c454b6f5b2a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7c90f1928a58556c9a2d01cb",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4dd4728799652849f59db263",
   "source_digest": "0781831b422130a6b1c74ba7eb2d9910105fc4ddfda4c16d7f1509bb918ce940",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4dd4728799652849f59db263",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:06bb9af53618f32e5df070f6",
   "source_digest": "1d92756ee1a52f86212f02afbdfd6644aea0de6a1ae7ca8a5a35be75868b79d8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:06bb9af53618f32e5df070f6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e4218ee01b2a66bc5afd1bf8",
   "source_digest": "5960a982e6710196427f0a74a596a4af5c4ac1a30a84c51f68d1fa96c572081c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e4218ee01b2a66bc5afd1bf8",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:fe34fc3a5fdf3010043cba53",
   "source_digest": "60f5644b887474395986c81a7a8d206281feb30ac4e881587c349160770e4218",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:fe34fc3a5fdf3010043cba53",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f426f3d442b7e350961bb7a2",
   "source_digest": "d0a3ae0c5852accd51ad683c09426011e7e6632dfed6589cc25b213dcad9395e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f426f3d442b7e350961bb7a2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d32cc98baeb3a7170e9573fc",
   "source_digest": "08501c11e3751c331da368209bd96aa22a5e7badbe6f4f4553b7b8ed3e50f1fb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d32cc98baeb3a7170e9573fc",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:18dd25be660bca41e2aa17a4",
   "source_digest": "64bd2598bb18b498f4494fda8150b6faaba327b0216626271143e202f8ed0bb7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:18dd25be660bca41e2aa17a4",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b711aa4bb8ada4d67ab9a3c2",
   "source_digest": "f79063ccc203762e7dac220231d597f9b80ffee78cadf7a5cf979c76acec2c96",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b711aa4bb8ada4d67ab9a3c2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:928283f43634dab5abe2e46e",
   "source_digest": "30ee0e6652ede12f9231062e42753831bcd1e96f2b4bb2e552b592fdedb33e79",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:928283f43634dab5abe2e46e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "PR番号・commit hash・issue番号・review request/verdict/receiptへの参照を除去すると、固有のエピソード実行記録以上の恒久ルールが残らない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e9c805bf68f72ca20f0cdc86",
   "source_digest": "e5521e048f8949bb3a8afc859068f8f1de8b4d4b34657cc4c4871f50748326d7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e9c805bf68f72ca20f0cdc86",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0a5845e539e3c2363a31d9fe",
   "source_digest": "69f78263562d7c95a1b6dbabde97f161da5bcd8b4ee9b83a6f520f6118b08495",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0a5845e539e3c2363a31d9fe",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: decision rule present but carries pr-number/commit-hash/review-episode/issue-number: adopt only if the rule survives without the episode"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7651c26407c96535464243d4",
   "source_digest": "7fd70c06aa157f43ca07cdc94a28094bfb1ba092434eb0c75debd055e5c0546d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7651c26407c96535464243d4",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ebfe99a2ed4b400b9a350f7d",
   "source_digest": "c1377d701699d4659237dbd05b010c8af3ab4f6ee2949fd16d3000cf9474c968",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ebfe99a2ed4b400b9a350f7d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a0de29449d749b2e5c9695a1",
   "source_digest": "61fa994fef31aaaf4a89abf4530c204835661e855b87c8c3627a983aa3e006e0",
   "decision": "adopt",
   "criteria": {
    "reusable": true,
    "evidenced": true,
    "actionable": true,
    "episode_independent": true,
    "no_secret_pii": true,
    "deduplicated": true
   },
   "evidence": [
    ".ut-tdd/review/requests/ (canonical review requestの保管場所)"
   ],
   "reason": "同一exact headに対して複数laneが同時にreview requestをmintする競合を防ぐ、hybrid運用の具体的な確認手順。",
   "adopt": {
    "memory_id": "memory:feedback:review-request-dispatch-exact-head-request-ut-tdd-review-requests--773b558e0a81",
    "kind": "feedback",
    "title": "review requestをdispatchする前に、同じexact headに対する既存requestが.ut-tdd/review/requests/に無いか確認する",
    "tags": [
     "hybrid-coordination",
     "race-condition",
     "review-dispatch"
    ],
    "registration": {
     "operation_id": "curation-424:61fa994fef31aaaf",
     "memory_id": "memory:feedback:review-request-dispatch-exact-head-request-ut-tdd-review-requests--773b558e0a81",
     "source_path": ".ut-tdd/memory/feedback-review-request-dispatch-exact-head-request-ut-tdd-review-requests--773b558e0a81.md",
     "content_digest": "8a04a12dbde4981e58ecd07417e53956a97c6231f91580269f8f715ac9b46d17",
     "exit_code": 0
    },
    "receipt_digest": "6fda8e8ebcfe2df07f1ea5bb7852e627fa8f33eafb5d77ad32f4987ffed39d95"
   }
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c626e4b94f90babfd60765ba",
   "source_digest": "138f56b7e7b78ee428e9f4cde0e173cd2a6bd6e6a54f3920ad626b616f2a519e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c626e4b94f90babfd60765ba",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f4321c9eb3d91a6075c4469f",
   "source_digest": "cc859131acb4bae054079d6dbe92ed41ca233855f6d0143b9282888823d8fe59",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f4321c9eb3d91a6075c4469f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:11cda00cb0534ae76164ac7e",
   "source_digest": "813725c2f015a8a8d91c4150a3d3fa674ed5d9fa44cc5316fbbfaa06ff8bab1b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:11cda00cb0534ae76164ac7e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:80d88262944a5680d3aeb2f0",
   "source_digest": "e97c8c0e5362d7916cb8982bedf38150c4fda1f9d856d357823130ea145ff1f3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:80d88262944a5680d3aeb2f0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:467af869d6f69e8ecbbac375",
   "source_digest": "7d9e28729d8b6bfcbebc44e5d2990a64b0dbccf5e3e5903ad6736fd11776eead",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:467af869d6f69e8ecbbac375",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:185f7a4e64b9688e78aad53a",
   "source_digest": "c8d61567d00ee3a6a7a6e41d1af4aa36e51e14f164da763d87b007e470dc4096",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:185f7a4e64b9688e78aad53a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0475dda0820307dea2da0cd8",
   "source_digest": "db82a8641a680e0a3a0546972dcdf67df4bc5e1b81f2560b3e0f8bd623ca8ef8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0475dda0820307dea2da0cd8",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:bd3054446a9002979775ac34",
   "source_digest": "04daae950402952aade35aa4579cfb068e649d5061dcbfdc717b709b741e4bfc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:bd3054446a9002979775ac34",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5688f153f878a461791a6552",
   "source_digest": "5501e1c1ddb3d20dddc0ea0c42749955b5d99bb7c8236d8ac2bbf186f1932fdf",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5688f153f878a461791a6552",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b5714cfb31e223d8a016ea41",
   "source_digest": "e03fa0f332523dd3a14fb42ae83adf89c8d45076df00e4b6e5d3f6bd0ef4d433",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b5714cfb31e223d8a016ea41",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:77f5c2833f4d5270b54d9db4",
   "source_digest": "b436531518e6a9f4e241659131d55fa480478ebc217121ddfeb8e8a2daa9e18d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:77f5c2833f4d5270b54d9db4",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:53f9843aa14cd6afcabc9b44",
   "source_digest": "7ec290847036946f79935c598b08264d807eacfb74a49730095750ea9c324f19",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:53f9843aa14cd6afcabc9b44",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2035ba99ac3e4f94ad0a880c",
   "source_digest": "0f714769a9080f27c082176dde4ef65d00447279355e076e731f2b4c6b46ee41",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2035ba99ac3e4f94ad0a880c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a87f60555da8a6ec7c07e5be",
   "source_digest": "719ab003bd002e36afaa6e7eb8b7a633f9583c18b6f64a4b1467c9708b263b51",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a87f60555da8a6ec7c07e5be",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:95d8807e8a32dc4dfe5ae9a8",
   "source_digest": "badfe7e8b18e268770c88484fbb9b0d91d78cc0324902d843201235d2e992a07",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:95d8807e8a32dc4dfe5ae9a8",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:912d5aeddf108fded32eec41",
   "source_digest": "27becf2583ba91390540723aa92dc29c28917577366a29f01dba8dbe6b110ce5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:912d5aeddf108fded32eec41",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5c3ea04bbb21239aee6e0ff0",
   "source_digest": "85380c4c3f53b6b0287e9e467564ede063f30d5c5688deeafdee444393292ba1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5c3ea04bbb21239aee6e0ff0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:756cb2d28c7c092872313018",
   "source_digest": "23037eda7cea0b52137b2b66dabd3296a7a84ae215314de2c2254a1e018cad25",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:756cb2d28c7c092872313018",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2231144c7daca2dc9292c18e",
   "source_digest": "92e4806e3c12b8fbbae1aa920235d9451b5f94bfc58316f9e5a90c5558c77e08",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2231144c7daca2dc9292c18e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:9e98813275339ac54d5e8024",
   "source_digest": "7214405c83717a87a3a725855e6c2b2682e97bccbc59b973534deb9aa16d2a60",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:9e98813275339ac54d5e8024",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d61a8c9d4a071f9a4c465134",
   "source_digest": "dc2dc81dda094de5191c8d22cc88471d2ec20b95ce52e815f3232de474175e17",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d61a8c9d4a071f9a4c465134",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0130632b87a408397c1787e7",
   "source_digest": "83f9ffca56cb9bd63d1d783f94f07378ed9f8f70e4571505f15649bb08625c36",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0130632b87a408397c1787e7",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:97dab20ed272d9f401486df1",
   "source_digest": "5e9ea0de2546c238b5a8dafe247ec3601b365b82825581f514f42e856ae4192b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:97dab20ed272d9f401486df1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:96a1b91cc7d6298e2f783bf4",
   "source_digest": "fa0da9351075287f47b3dad7cfa3ed931e87fc536e02c38e2accfc353bbbc93c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:96a1b91cc7d6298e2f783bf4",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1ca33192289f3a06301d3d90",
   "source_digest": "c678a72bd50e3cb86c958e01d7e830eb1b5425d766d73409c7a51c1be10417e1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1ca33192289f3a06301d3d90",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4b609403badd344584d6d379",
   "source_digest": "a54195c3f6cdb4d7814570a5724b753e2eb6cf50f96fb8c59d8b890e1aa7a834",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4b609403badd344584d6d379",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4c0e3922bcc07c95ceb4b917",
   "source_digest": "229b1f9ca13722a18524eaea48c6f7458a683a0bc55e08cc84b283f3618a07d9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4c0e3922bcc07c95ceb4b917",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c5ebde0813b075c152b387c5",
   "source_digest": "3b1c5a0844229904c9bf6929440d25745ea74d7c34ee91b07e0b3d5a5a4ae52e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c5ebde0813b075c152b387c5",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c4d821acee7326c3989073ac",
   "source_digest": "6721274d49a1f5acdaee22a43378578cbea5a9d2c2f58f8cfe273e94da2a767a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c4d821acee7326c3989073ac",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:548d2954d5d226a1317bd39c",
   "source_digest": "56b85225b57d94cabcf50b8a61d81253be368358799e59fc7ba9ce2fe58a3ef9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:548d2954d5d226a1317bd39c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e4bf08ca7a3cdb800af54b57",
   "source_digest": "33fb2045325a0c236e286e00843b1d9f89c58d24bee6e07e6ba82172f3a57682",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e4bf08ca7a3cdb800af54b57",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:febe55b80c1f5475084829a3",
   "source_digest": "71c68709de45572a56f8885485c459fc06fc4308cdf7bacf3f7bca2d44db255c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:febe55b80c1f5475084829a3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c1912fc406e936b83013af72",
   "source_digest": "a816106d3a85b06f854f007bd92a382ee45126a07c940b5f48669cdbdf5f3872",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c1912fc406e936b83013af72",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:638cdbdd5cdd6fdce7401f37",
   "source_digest": "86fbdd4105bd141f5591db9787558dfedd278092e4f3023e243e59cfe62fc221",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:638cdbdd5cdd6fdce7401f37",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:08b2ed93a3e57f7a1c7c0359",
   "source_digest": "65e49080858a4db25b2bf11253630186f3d00f5c1b1f2458b80eab448f7ae815",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:08b2ed93a3e57f7a1c7c0359",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d52ada51e23aa7bcb4e3ffad",
   "source_digest": "7502366ec22a4c34b90b28641bdd7f6e183e99ee3b4c99a0d193448e978d038a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d52ada51e23aa7bcb4e3ffad",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f7bce30d2498779980c6b77c",
   "source_digest": "48092d958c368c2f29f186c346dc3f3eae8461ed5b05351272ac2ae841b8c0e4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f7bce30d2498779980c6b77c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0fc0b685aa5f96140b30c7d0",
   "source_digest": "f260e3d097f2d7d1fcf5d8f5c98209c07a9d1c13992a151302ea83f551cb78b0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0fc0b685aa5f96140b30c7d0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a796adf175a11b0055de7121",
   "source_digest": "3ce851fde013fdbe324f9a3bec0afb0186bcdd1b85fd94c80c59371e3053207a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a796adf175a11b0055de7121",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1b418abcfc104a2b40f359e0",
   "source_digest": "e2274f28249a07fcb505f0bef3bd898a8386b0bc9c0a2ad19d8dc444e4c658a7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1b418abcfc104a2b40f359e0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f165afc7b12cae18be9c6a3a",
   "source_digest": "f22a54f0760abdf5966eeafb77a247a108012de94aae83b55195fdd5f402c6e5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f165afc7b12cae18be9c6a3a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:97a5b2c3048056b89004b421",
   "source_digest": "9e5617bc0aeb95493a7d71f41ce7d3402993f6958b94c234f83689bd80dc6266",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:97a5b2c3048056b89004b421",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1fa2c5e53d1fac440ff94585",
   "source_digest": "09cf37a87e6a709336ea1a1b49367cc85cb6ec122347463e910177fa89b1f64b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1fa2c5e53d1fac440ff94585",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:8dbb44e53e2d53dae335b86a",
   "source_digest": "06c8e482b8e91653cbe654c9d47f594e2779f5431c24e9875eb56268d02d72d5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:8dbb44e53e2d53dae335b86a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5be967a63020c9151d772849",
   "source_digest": "49fdf33ab3b0a07b780f0314ea02eab8cfb3a3df011c9c067ee5e5a196bdfb91",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5be967a63020c9151d772849",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:85c145eb28a6c6a3b12bc93f",
   "source_digest": "f677462dc424caabaa10944af561e5c5e1f2b0847db229a1624e4ac6b308415a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:85c145eb28a6c6a3b12bc93f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2b16efad05f031ce60efaaa3",
   "source_digest": "a08fbbae323522eecc45d4428ad65d22cef776f5a784a01f762bf1e9789806d5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2b16efad05f031ce60efaaa3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:18bc3a4d7cc51d9669eed325",
   "source_digest": "b2d2f0a56187affd58271eca6d4982e30ad7af9aad9d1ae62c9ad2822c47105f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:18bc3a4d7cc51d9669eed325",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:bd4e94fb7e996c79bde75901",
   "source_digest": "a4ddd790bb409d7492874779bb6548a4ad4fe65416092ff74e2a7032d942caa9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:bd4e94fb7e996c79bde75901",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2f0768893ce716f84ff053b3",
   "source_digest": "9189cabc955e5810178c61b6e9820d2e9d195c35ad534657047cf917741e63d4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2f0768893ce716f84ff053b3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:cc898031cb25adfb4189952f",
   "source_digest": "9233a14f7cec92a9aec7988dcc9d94f924eaf28db10ba06cc685d190232c2e4b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:cc898031cb25adfb4189952f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d655032e9464a426a4ca539a",
   "source_digest": "65f3c7d7e25c2227030e2938f434e2cf2726bced240297a5d8e4674d97a2e719",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d655032e9464a426a4ca539a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:dda56410c1c0a56dc707f100",
   "source_digest": "bef6e8b59dc279128a2a4bb8499b4aef147c9fd517fa0febd7c6286920d1aa87",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:dda56410c1c0a56dc707f100",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:612d90baded9556909f51c91",
   "source_digest": "df5af5cab31d92c45c04521c93eadeacc61418edd65d20b04165eff9a93542e2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:612d90baded9556909f51c91",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0ab4b09f42a4fbf2409cd3a2",
   "source_digest": "67ed7d6b5a72111d0bc2cc4673e3fae2b833fc7b21898422e88c934216831156",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0ab4b09f42a4fbf2409cd3a2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7749a25e35a78afb873d0c16",
   "source_digest": "b6038c06f5ebd587d555144849f3547004b4c1ec2c2b7c63ae98f4a64dd1b7c3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7749a25e35a78afb873d0c16",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0c4def8b072b7836062c7cb5",
   "source_digest": "d46dd51b01599bf8da1de255a76cb609d052963839a83176b0fed0b44831a927",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0c4def8b072b7836062c7cb5",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d4980ad3186b4e04925651ac",
   "source_digest": "33165f160b8b973e0a6d4f41eeb391e184714036cb6414cd7f78ae674191b66d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d4980ad3186b4e04925651ac",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e15b3336eebade64be188506",
   "source_digest": "f120f6c361a17233fa6d680bd985cad6e6cb0ed84b1dd613d08cf9c9232ef229",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e15b3336eebade64be188506",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c3c0e2ff60c22588b141bdcf",
   "source_digest": "ba859bd2dbba9994ad0e3e056406bc12aabe85f0b556510484c56867bacc7d88",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c3c0e2ff60c22588b141bdcf",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:92aa9255cba65e9773711a61",
   "source_digest": "43455b577765a958bb3560bc5fad3a9b162886cf625dfa41b3f202737bc958ec",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:92aa9255cba65e9773711a61",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:83497ccbdfac5a80ffdce913",
   "source_digest": "0625e48351089544fabc12f336363b27ea35d84655920ef852a2328df63abee1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:83497ccbdfac5a80ffdce913",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:6dd9ac96eba468e5efaba808",
   "source_digest": "1c99416f9cb571e4774c3943dfaac0a61c61b8b666ba6c73a59e6a4b08208e38",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:6dd9ac96eba468e5efaba808",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d24bd766f85ab4dda8be0fab",
   "source_digest": "aa86ce5e8b426d1c73b9d91470b8c905d98d4da17f6e95a54cc00fec612ba454",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d24bd766f85ab4dda8be0fab",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3fe8ff7de18ecb266162f36b",
   "source_digest": "c053bd8b87a280acfce619d9db9459534486629f766ec0bdb57a71a4632fb9d2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3fe8ff7de18ecb266162f36b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3ae264c34952e1d40733da35",
   "source_digest": "83f96dc24202dc66f526aef108fbd12c925be38e89ed6a96648457810f1395e1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3ae264c34952e1d40733da35",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d8dee3e33c4ffd88352d076f",
   "source_digest": "4e2bbfdab12222f815f31dbbb9ef651c52dcfc65c3c1b2b1f3e64d2526121a35",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d8dee3e33c4ffd88352d076f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1c5f5c559648360f23c99570",
   "source_digest": "e27a202bee6cf072ada6dab78aee2493b10293f4ee9f12ad0b279ed0482ead0c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1c5f5c559648360f23c99570",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a7a0a6376f483e66e6a93910",
   "source_digest": "26feb5dc6beb70869e49d771049f435626e2e0235bf2a0953929f1b9e6913336",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a7a0a6376f483e66e6a93910",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:44d139290e4925b5390495c6",
   "source_digest": "306ef8729278c2cff5318c86995a30b755d4ec3faa7c0a149e9b5f31a3684d9e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:44d139290e4925b5390495c6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e05ff58b4e0ab9ee1345dcbe",
   "source_digest": "c837880e050eaf786350931d3786e9288b353c724e880ea7a0a8f0802bc0630a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e05ff58b4e0ab9ee1345dcbe",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:dee1aa1480362d3d4bb71dde",
   "source_digest": "08ac193ef573669da12c1b43b2f7b5d76461bfa3f5ec28cdd61c66389e774692",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:dee1aa1480362d3d4bb71dde",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:75ead246f9a120f406e4729e",
   "source_digest": "fa693485303b16544b1ebdeaa0d9a672780a78a9f3355860cbe50851159ec0cf",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:75ead246f9a120f406e4729e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3a448ea88d8158dd8cc66004",
   "source_digest": "6d9eb7850476975579662b82434c2a669a6072ea6141a14d1fc6320bd8082608",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3a448ea88d8158dd8cc66004",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e16ce8b2c3bb93d536d21d5e",
   "source_digest": "6cee5f4bf3247ed8e949c5cd214dfe42455f4b4558dc8bc4b19ee5dadc3e066b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e16ce8b2c3bb93d536d21d5e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a478f9b9f8660040e2d1ae2c",
   "source_digest": "3c549353eee6d202ccde1bf4607a50e04b72e1f37ef9f00a372b312c1f878586",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a478f9b9f8660040e2d1ae2c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:8d02bd7838f3af93f2cc06df",
   "source_digest": "4cea485ebe03edf00452f186abfc6dcd7753db45e9066277ec9c4e66efe793ea",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:8d02bd7838f3af93f2cc06df",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a8e90271a11193feed4535e1",
   "source_digest": "f11d85ddfff55f1ff18145859fdf2a0e54ec8ecf16f8d6576a22243c72382f56",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a8e90271a11193feed4535e1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:14c4abaab246db3100f22bab",
   "source_digest": "9719e08d71586cc04343e594f11cfb24b6b5ec8bd3961f825b148d006b6a4fae",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:14c4abaab246db3100f22bab",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e07679ce4c4fecfcc86d222c",
   "source_digest": "94294a308cce91c8c225301a24e95d3b197bbc9803d4abb30dd3f00ca3c4ca4e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e07679ce4c4fecfcc86d222c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:30ec5c36cc7b1ebca193e2a8",
   "source_digest": "335b4d2799b16e13af32b332d3773bdc93e1989d64170a728ce8f230794ffc6a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:30ec5c36cc7b1ebca193e2a8",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:38ac28fbee7877b26d6c8a95",
   "source_digest": "90a21b149d9067e12886cd170e4d7dfc9f212fab1d5cff32d52327265ad8e1fb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:38ac28fbee7877b26d6c8a95",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d6fc12fdaaf4782cec3cf684",
   "source_digest": "524c99bebd09c9acb796e859de5f52a0a5c0080203b2580a5a168693a72bd17c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d6fc12fdaaf4782cec3cf684",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:98c6590928f5c48b7050c5a9",
   "source_digest": "e7d53d96ac25d7106b4bd4d5f37072efc070fa4ddc25849a66577a9ecf222092",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:98c6590928f5c48b7050c5a9",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5262de3475ee626e6b6ae7d7",
   "source_digest": "86f344fddc3e858afa2dee19dc142ce9d23a6601d6b7e1bee531b81e17e07414",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5262de3475ee626e6b6ae7d7",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b02c8565f63ae50b5bde254f",
   "source_digest": "8f216bacf38043e3efaa6a57d96543e30fa3c2f192ac6ce9afd9d41da65278c9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b02c8565f63ae50b5bde254f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:70265c9b3230e24259c6c829",
   "source_digest": "3e35a7252a7d3fea3d53bb578304c8e4a8a706ea8e5c55441d5c4810ab2251b6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:70265c9b3230e24259c6c829",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:24545afc105ed0aa6ee8c9d9",
   "source_digest": "65c1a1f9c5720ba53fec62ebd90128fce060983b3877da3b4e7995f1b9696657",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:24545afc105ed0aa6ee8c9d9",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:8880c19e840a32d5203e502f",
   "source_digest": "9f5e657ce331217f63a52db751b56ce778b7caf3973cb4612a2e99dc7e59688c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:8880c19e840a32d5203e502f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a59f8c567d1519ed48ee1232",
   "source_digest": "48ca501075d6b3b4b46dcd6d0d9768abf43c2c1e8e13f5c8d6eadd564834bfd9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a59f8c567d1519ed48ee1232",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:be0251ba486c1f415cd2dadf",
   "source_digest": "b3b2e38660c9333db008dfe6f90c0fe578ed3d64f6604fa5a47685d46936e07e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:be0251ba486c1f415cd2dadf",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f5405772c5932f913cdc6191",
   "source_digest": "1ca604ee470276ab48fa5a56f461b40d9c67b42df7bdf1b9f1fd50f967b11c34",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f5405772c5932f913cdc6191",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/progress/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:817687a2c8e2383c702c718f",
   "source_digest": "d3239601cb8019a6da81e0529830086df516a57d745f2bfd3c3dc45239304036",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:817687a2c8e2383c702c718f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a868ae12f56097f9ac75c2db",
   "source_digest": "41498fcee55926351e7c472d66d21324b70a9180093e28666e1e633f9312cfb2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a868ae12f56097f9ac75c2db",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f4a1955bcaf7f1f1b6cb0ab3",
   "source_digest": "f91588dc8ebb1e274ef4934917603704e48074cde54c003e9a682845acca3c5c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f4a1955bcaf7f1f1b6cb0ab3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3bc0349e4ccada1fb9448a16",
   "source_digest": "486a241cb9c1cedd8a098139bb96e1fc8e097cf87396f3bfb0d893ccfcff151b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3bc0349e4ccada1fb9448a16",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4ed78c9d7a70b87807739ac4",
   "source_digest": "905685e68a97459768382295dac1ee885ecc77093fe30b7f955653910867cef4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4ed78c9d7a70b87807739ac4",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:fb4f36843fdbeba0e43c2c37",
   "source_digest": "63abd12329c39bce1d250d6e1f2fdfe8a9b70fa1f7b5549c18cbcea9318e42a2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:fb4f36843fdbeba0e43c2c37",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:60ba4d6687bb25850948a570",
   "source_digest": "88e05109031c89663f20755d7c7676a30815fc6c7372e3f779d2e474470f9fe2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:60ba4d6687bb25850948a570",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f1584418fac8b5f08739f0c1",
   "source_digest": "ad612f3ffe73008c23feeae8c233d844235b9323d560ceb239164e52084f819b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f1584418fac8b5f08739f0c1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:bd0d990a93736c980987d060",
   "source_digest": "dc461e6d60abbedb79f027b294cf0e209aa92e77c8c6689e00b4210640b71535",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:bd0d990a93736c980987d060",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:70ba08822966c98a23252d3e",
   "source_digest": "afdf641136a7f3491373a72729173f47a953bfe3f0826687cde3cba55b96f924",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:70ba08822966c98a23252d3e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:bb660212e8db4d9b76812d91",
   "source_digest": "27d1d94cd06c47d5f2c5102a1baa2d52ea973cfc1f632d1bb35c96479884b4ac",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:bb660212e8db4d9b76812d91",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7a6c408cbf28c91c693cf56d",
   "source_digest": "aaf8f2effbec543f61464aad882ed6ed96774172b6abe2603364303d47e507b7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7a6c408cbf28c91c693cf56d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3de844a27e7b82bb1723b6c5",
   "source_digest": "ee6d208167b716dd4af970b15fb64b294cdf7bda1aaaaacc4f73ac33ea964a47",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3de844a27e7b82bb1723b6c5",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f9e8e92c09b7aca93efc867c",
   "source_digest": "a7bc5d0a930f11da2deb5384a43b4d97eb9402c3b71563a2b2c5a71b12678d70",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f9e8e92c09b7aca93efc867c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:42c87a5c81b7aac29f3dfbb6",
   "source_digest": "00f52287031dacedec8c9726800c4d7130fd39193c4abf9ee5e56aa267cd6c35",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:42c87a5c81b7aac29f3dfbb6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:34af1e2137a2b1d5663903af",
   "source_digest": "98b007a09c7bd2c439f4a66443c6001f34aa77bf3cc48c020b16184f431d4d8f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:34af1e2137a2b1d5663903af",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:08d394a32a52659440c645a3",
   "source_digest": "be194374e3c7cb69202d3f90c57a692c7f5a6b606c21ec24dfa97dbcab013f33",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:08d394a32a52659440c645a3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d7d972252b26f42beb102332",
   "source_digest": "1598ddb0127662cf62687a5a39471fb59546d275a8bdd3bfe23a7373839ccd3f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d7d972252b26f42beb102332",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1a1b232b8fd69a9ce7c60413",
   "source_digest": "0cefd32051d292cd316cc43a06bd918d55724a3c4e5494a7f7bbe2cca9ce36fa",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1a1b232b8fd69a9ce7c60413",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:530f3c4fc0e35af302286cbd",
   "source_digest": "ba97db6c152081a785115e6f308f4f3bfc613135a9c3707f33772a2b77a90d7e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:530f3c4fc0e35af302286cbd",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ce4d15d5f8a4c5c3801a81f2",
   "source_digest": "e8c86377a861da2e1fe755c050fa831b7e63e16358192a9da2aea6e1f0a190ba",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ce4d15d5f8a4c5c3801a81f2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:31be45ddddf0d6d3c87ecc83",
   "source_digest": "4cf61a17b99b6c2a71eaedc3c1a75e3028095a9eb0b53ba9055107de53e2699a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:31be45ddddf0d6d3c87ecc83",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1b099fe3da5ac4a62fb45855",
   "source_digest": "028c6912f86fdf0e90d5f03d4c49bb7f79b71c340290b9361d1e3c80ceb608a9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1b099fe3da5ac4a62fb45855",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "時点依存の監査/状態スナップショットであり、日付・件数・PLAN番号に強く依存する進捗記述のため恒久ルールとして独立しない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d249e4ab33de1a25144f431b",
   "source_digest": "3b4bd8ab86ccd99f086b1b60761f1222bd31da00824e2a3b9efb3a45951fa8b8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d249e4ab33de1a25144f431b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:07ee0585264d0ca66ee4497c",
   "source_digest": "51ab2e80045d76daeca4f95ad92b942a266cd3946b93946648a599e8b2df5d0e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:07ee0585264d0ca66ee4497c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:99befe40579b012d1ccc5dfa",
   "source_digest": "a382a8a19ed37442c5c8a2d8687edff589d20a27fa357c6482af123768e4a409",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:99befe40579b012d1ccc5dfa",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e48638ab87e479aa69aa61a6",
   "source_digest": "bd3f2ead350ee023cd05aaf5c32bdef1bb06faa081b6e7aab5e81f01b58f8ee3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e48638ab87e479aa69aa61a6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:8ab3b01aab1240c569b74723",
   "source_digest": "12c4bfae49fa80b05305600c58026f7fa042e59e651bd8da8844c531cc839bb6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:8ab3b01aab1240c569b74723",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:db046a3becc2f7a58279346c",
   "source_digest": "9f5ed4dc51b61aa477c240ddb2bba70027345d13c201bbcd7fedf6b02cf9a126",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:db046a3becc2f7a58279346c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:360989d2c5b6ccc33f1cc012",
   "source_digest": "9c2c24dc7edcfc8c8799fb75c4669c229e698062d23356a198b2e699d7c115a0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:360989d2c5b6ccc33f1cc012",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c5bf0d8675050ecb5efd9641",
   "source_digest": "45728b5fc58f7b83c8fc41e8e52cf65ba4a5c7f9113d91e95edb276e2e7967a2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c5bf0d8675050ecb5efd9641",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:8591d11671a7a5fc201ec272",
   "source_digest": "8f0b69bf456d858357071d0ef5e03e3e6a0636a7da28eeb48884cd45a845dfc1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:8591d11671a7a5fc201ec272",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5a6a0fd8fb14872d75c49b28",
   "source_digest": "f7d8e815c279c1def410ff4713127e0ce5c5510cefee7da9b3d2e6a51bad3b76",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5a6a0fd8fb14872d75c49b28",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:bac859330de5c49bd85c35e7",
   "source_digest": "fda1107322586fad006d4d4c317524b96a23e9ec2a5d21614d7ae7ddcfc00e75",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:bac859330de5c49bd85c35e7",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:add1ae2ff8769254ffb06e97",
   "source_digest": "b655f4addb85fc41bdc4e4f8c83b029184da279ebda4342188202cee142b5953",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:add1ae2ff8769254ffb06e97",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e34608219d2ff8901aacb8bb",
   "source_digest": "794b2051d0ca3627fe8aa82ee8d2156e37aba2ea664e91db3efca970c1648c8f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e34608219d2ff8901aacb8bb",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1e6f247341766ba4b00e25ac",
   "source_digest": "b0346b7d163f5d14cb48bc6a10ab4b1c96225e385d6afd08ddf69b4206e9e7d9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1e6f247341766ba4b00e25ac",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5e0f1ff9b00e6065300fd86b",
   "source_digest": "8e3e5169fb06251c5409d295fa7f9b23dbad54c6c646fa18e1b021f9506562a1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5e0f1ff9b00e6065300fd86b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2bd1e5cc644ce2f08ef8ace1",
   "source_digest": "052f7de355d745d1006573a01675a58cd823e31f63f6356946ad82988abc2784",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2bd1e5cc644ce2f08ef8ace1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e9d8272b427ede6f1c53e717",
   "source_digest": "27f0578662bc424c1695d3e6d5068fb1913e87bad72607322a5d9f1e735197c9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e9d8272b427ede6f1c53e717",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:621661eca1842c1f6d4cac12",
   "source_digest": "554480cdcfd1c28c373208add37a3b0a72d1705a011dc1bdc9e125eef0e4b1f5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:621661eca1842c1f6d4cac12",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ee90a58a0827ced058f0d0da",
   "source_digest": "88504646e8848ac81d7b559724ffc69eb3058211b2c6b68f33e3f55c9ef13e5a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ee90a58a0827ced058f0d0da",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3a65c8cac60ede1ef273e1f1",
   "source_digest": "b4aa04deae6a0e26e5004119d2dca0bd933cbfef4c23ad8c59d73ede39d72e74",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3a65c8cac60ede1ef273e1f1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:09c54914e792f66b1de9c74f",
   "source_digest": "39e448021cc012e4dc2d49a438f5a6392557fb8e30f78a0cab1e04070813858c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:09c54914e792f66b1de9c74f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:19483fe7b120af9f98746e3d",
   "source_digest": "1dad607f9c94fbb0e878a16d545130daaa29b5acb8ba2b8dd5ee389ab5688039",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:19483fe7b120af9f98746e3d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:975e2c9373c3b081a94d0cbc",
   "source_digest": "8b73d90de3122aa8441bfc32a96d9368b0904a726709291f7a54f281f3d8044c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:975e2c9373c3b081a94d0cbc",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ba6d6f83a4514fddb6fa3235",
   "source_digest": "a11144b3e4b0dd235cfa15b14517d378f36e74c98e317254b2db0d802aa00906",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ba6d6f83a4514fddb6fa3235",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:26e52d69563c43db37724e73",
   "source_digest": "3bcf5819a62dd54ca5fcbf4a8fa277f50d3048167b6568673ed1ab4d16a3d8f7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:26e52d69563c43db37724e73",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4a931370c8c7b3486efc8b04",
   "source_digest": "d33eca068a0a0cc466b4e446db4a87bfbf0df864fd74e993c5690a2b430e8af2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4a931370c8c7b3486efc8b04",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7c3457b3091476b364dbfcdf",
   "source_digest": "6337684bd0f4a81a9a501318eeb121c8022a22d40593743aeb20239b340f1793",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7c3457b3091476b364dbfcdf",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0340b554816535d6f6c5f74b",
   "source_digest": "2abd61e8e4537d0ddfb8e374bed7c8a81365c42443745e0e1fdf1ce555103874",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0340b554816535d6f6c5f74b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:fc9c8d42a2daf53730c4c77c",
   "source_digest": "dc6b63bb22d4359ad838b84074a26969b0032cc56ff272a9af7f513b43ec651d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:fc9c8d42a2daf53730c4c77c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ca05c31ef705ae6d6c836b08",
   "source_digest": "ee571942f48f932ccbfd9a83fe19fc4f1aa32a1d0a57aa61de03858fd8a96832",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ca05c31ef705ae6d6c836b08",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2629ce2c565d1559f8aaf4ae",
   "source_digest": "0cf0913bb85bd0731802d4d610b33bb69fb0cb252c1a388ade22c4f53038d2a4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2629ce2c565d1559f8aaf4ae",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e0b09b8a23a702f77c346cf2",
   "source_digest": "776ba74d69a3066dbc05070358201f8bf3911a6e880e298aa68ed934ea7d33a3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e0b09b8a23a702f77c346cf2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b0535dc3a56a035f8599de9c",
   "source_digest": "a1c41137098a07552955b3dba7d29200a144c98d789eee32bc81e626c6c8e61c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b0535dc3a56a035f8599de9c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:dfaa7f10bc3297d54d9f713f",
   "source_digest": "e8e22985cc020015a4b91256fcabb96e373ec37e4467b0c91ce1c7c45f0aeec3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:dfaa7f10bc3297d54d9f713f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e15d15267562c04964261585",
   "source_digest": "4eea4cdcc067e53d8c5e50186f6b41c9694d1e8a2ec387e3ab98c778963ee935",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e15d15267562c04964261585",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f17716bf07d2b7170a7b2edb",
   "source_digest": "fc46c7eab46d8ebdbe80c8f5cb54ba703ffd4bf2529cfa12a14388f1546e4230",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f17716bf07d2b7170a7b2edb",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b43ac4983e02b378c0f8430d",
   "source_digest": "84f924ebbf6e3a5f4ac22766650832c69f5bbe20845aa8a53562d911cfc3e980",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b43ac4983e02b378c0f8430d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5887c05e0358b9f59d7c71c2",
   "source_digest": "b4fe38e458344965c135f0b13235477256ab8502b5de3f27e4ebb1e246a32e54",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5887c05e0358b9f59d7c71c2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:24310530d3fbe983bf90f01e",
   "source_digest": "d6f466aa671efb1688217a6d1b540f1d1df511bbd852468b1287edf72fbdacb5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:24310530d3fbe983bf90f01e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e2d055551f738b0671023fd2",
   "source_digest": "1c2d45da08bf83493e9d56208dce218782d7ded8141bb1faf1fb22b2bf1a0899",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e2d055551f738b0671023fd2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:78861bb7c3a327e3a9d38bed",
   "source_digest": "0b3bf208c65fdef38d9fd6c310c9dbeb965138e966927f78be826a876939009b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:78861bb7c3a327e3a9d38bed",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:331ade8c21177bc93a51eac1",
   "source_digest": "a922bb7c17f8869fd2840bbdfafdf930f6340d94ad4eeed550cd977db93cd508",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:331ade8c21177bc93a51eac1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ba826c9cb685c732b5c75543",
   "source_digest": "07873a37d3e4e3c088cf7b4a489ed2646cc1e40288b323f7898b37d182b4c548",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ba826c9cb685c732b5c75543",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:673c5a8736ffc0300b72569a",
   "source_digest": "cb85cb95d26b1c30873263b66fc6ddfd09a293a989ccfb9acc8f316802d39e79",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:673c5a8736ffc0300b72569a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0abafd4f1061a297af2bf301",
   "source_digest": "edb21f3e192c926c612f72d70efdd5896e110eb9b3e5c8de7357e36fb9c9e433",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0abafd4f1061a297af2bf301",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:05321e8bb72f39b74a1a120e",
   "source_digest": "a6a64e3a59f431ec532935617c5444c9bc6eb756a5b82479a1665abafb5714bd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:05321e8bb72f39b74a1a120e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d7485cdf346858b1aa761f29",
   "source_digest": "d321a0a42cd025c810b4fa8340741ad638823e9cbf089600f7d4801386274d9f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d7485cdf346858b1aa761f29",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1e540adddfb95b898e57cca2",
   "source_digest": "9293e61f70c54b68a0860832f320fa60f40d58891d18aaafba2b16fa1c9c0dcb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1e540adddfb95b898e57cca2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:9672816aeaaff17637e1c678",
   "source_digest": "bec8f434db6ee3934866a695604d1e64956acf5f2f140299542aff3d842acbe1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:9672816aeaaff17637e1c678",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e117c175306c1056bb85b439",
   "source_digest": "85e3d16565254d9cb4c93d1516692aaa17acbeb9382ec9c71f8128a70e230a76",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e117c175306c1056bb85b439",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7cdeb66b9e91f44ac33d4575",
   "source_digest": "4fd26f0972f60dc2db059c309b9adeff75695125c9d2e3c6d059bea1b68da57f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7cdeb66b9e91f44ac33d4575",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a31669c364514588bfe869ce",
   "source_digest": "63336d511fdd7e63bc9685417d501199397dbe854b393d86b4b599c3bef82e66",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a31669c364514588bfe869ce",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:357742317bc52c2e15b5c89e",
   "source_digest": "d51814c534d959af98c86aeb48d3cc296231c832e0b4e3ea346212357e3fff4b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:357742317bc52c2e15b5c89e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4859306a5e147959cb4605ff",
   "source_digest": "0244f5f38537f167b0222461dd3d7c4dd3c7e81a53f02813e12e4e5a797e18f2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4859306a5e147959cb4605ff",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f3f259144525f8b72dc94069",
   "source_digest": "26dd3a2a6a84887d193647634481eb2c0a6cdf1024e20971624f6b57358c9746",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f3f259144525f8b72dc94069",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7e6fa9b0239079760edeff63",
   "source_digest": "5375e0247e837a5b75558a893bbb018a3d1ad6ab8b716dfd309916d7d4e09fed",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7e6fa9b0239079760edeff63",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5f35c59987a3f5ffd75f6764",
   "source_digest": "101818806a62193da85edd5b4d27fabeef563595e8f6dabef0ac26afe2a76a18",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5f35c59987a3f5ffd75f6764",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d538113019a46740d68e8822",
   "source_digest": "cac6cfc8cabf5ca5ae48a89f0f4940287a5aa9ca7be9e9d93a70ddbd6babd828",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d538113019a46740d68e8822",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:843bd94775a10892e730eed2",
   "source_digest": "1ab9286dec9bda4185db92bb4fe33e102d8989c876c086bee8b6449ef0cda3cc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:843bd94775a10892e730eed2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:56de21a97ad0aaee1d0f5899",
   "source_digest": "418168cf995e02c2f4664c9503b68565abad924ab5a5c2c0c3c78fe2ab638e5c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:56de21a97ad0aaee1d0f5899",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:211b52909d3e174d5b3f650f",
   "source_digest": "eb9121ecd265d4ca6c1f085978689b51cf67efa235d2030373e4251295cac36f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:211b52909d3e174d5b3f650f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:28dd533834a85ee466a0833d",
   "source_digest": "eb6a0b0f7263c979d12983a3fe6506a4649ee8e95705a89dc533511ad6407b8e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:28dd533834a85ee466a0833d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:63178b488c9f88dc354f220f",
   "source_digest": "cc8487938d4803cf1bf787dd1aee017c04ede471904cb1473ba86d7a34161a0f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:63178b488c9f88dc354f220f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:04c1552188bbe1ca271ddbed",
   "source_digest": "79bca0c182ad2aeaad9ab12f3a69b93b85f37cd16b569366fe0acb43cc0bfa83",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:04c1552188bbe1ca271ddbed",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:22dcbfb62439ad21eebe801f",
   "source_digest": "55a805b67b999fdbe4fa9d0f97d8e04ce452ec99ef4bfeb52bf5ae71d53b0a97",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:22dcbfb62439ad21eebe801f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c4a016867d4257f9f4319416",
   "source_digest": "74fac08a9000ac87f2be7ca4f8701b8a9032975d1d3d0acc3d00dbaa87fcf42d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c4a016867d4257f9f4319416",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:444dc11828b3b94d733c7e91",
   "source_digest": "947ba5eba29b5f7420438f42141ef70a2202dcc500370345f3c7d90d82915395",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:444dc11828b3b94d733c7e91",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:66e2eb49e5d3025dbc136c6e",
   "source_digest": "1e8917a1e36d6c00d8d5d8d01cb4faafbf66737fc47d29d569a84074cacd19d3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:66e2eb49e5d3025dbc136c6e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5210d1f5da3bd3d6a9857f46",
   "source_digest": "d209cee9b694ea1f45bcc62a471ce476f57a533292ea86b8502b1c429b516fef",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5210d1f5da3bd3d6a9857f46",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b09070441ec9f6c913a5dd1a",
   "source_digest": "51511f62f46e11246164c501bdd57e36fe16186fc4b476ff3ba65aaf852487d9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b09070441ec9f6c913a5dd1a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:04d01240a1300eb602211d25",
   "source_digest": "e661061de68a2aba149068df5ce80e6973ade50b7068769432d8d9af3443fce7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:04d01240a1300eb602211d25",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3b4c529e508434ae245cf7b2",
   "source_digest": "f3b6baf5835737bffb5b79574650fd41ff2441f9fb48709349ed1870205003f9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3b4c529e508434ae245cf7b2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5dbb60cc26f5876661603c95",
   "source_digest": "3975a817be42a0fcab840458344f569a9793e5bd3bf9baaa2a03eb4375570d2a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5dbb60cc26f5876661603c95",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:373d7cfc3f4e8390814aabd6",
   "source_digest": "da0c2344797de66f45dbfa7c8622cc2acbf787b222fd7662f8b2f5aaffc9c860",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:373d7cfc3f4e8390814aabd6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:6ee5da7214aa41bcbf3e1fae",
   "source_digest": "c92bebafafcc631d07a0d6c9c1483e75b4046cab4ab71f715832e2328b81a1d0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:6ee5da7214aa41bcbf3e1fae",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1abb76e0c38b6722a0e7d66c",
   "source_digest": "5381e2f3d939607e761b91e8b3475b3abd6b97d14fcb80fb2480cb4ebdcb8ae1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1abb76e0c38b6722a0e7d66c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:da4bb08b0a67f510c273a2cb",
   "source_digest": "c8edc6a83b6dcb126072002f311cdea608363bb87572aec8287c2531bc7307a4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:da4bb08b0a67f510c273a2cb",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:086215f8753323a8eed8c014",
   "source_digest": "916e9415234f36aa401913b585703aa7407d82af363fcf12b2e7f39d47bb97f2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:086215f8753323a8eed8c014",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4a7e6e5f8918fffd2aa1a211",
   "source_digest": "ec68ec6b315f1e6a56e12f9fe6fa470870e1692821c444d913ed6ac4f0235817",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4a7e6e5f8918fffd2aa1a211",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c3194dfdb53590a836c77e10",
   "source_digest": "93bd87e14cca33f004f8e96b95bb2edc2b50bdc55a5bcf5e1441745dea47cb67",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c3194dfdb53590a836c77e10",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e9b3eb2b36e14a5a199c48f6",
   "source_digest": "ced4abab377b863b3688642b4ce5edb04d1bd38ee97adf357c2d40909c0c217e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e9b3eb2b36e14a5a199c48f6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e91abe63fcca7f640211b298",
   "source_digest": "d2e65d8de25e9faa7b1ca9531c5825dcbe040f35cc90e458eedd4c5df8e04cf2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e91abe63fcca7f640211b298",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d076badc84c839888c110b1c",
   "source_digest": "9c51148add96d989f7866f2c8fcc4ed0818a81c42463c387e5ef441b53737f5d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d076badc84c839888c110b1c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ec6a9988bf434c55ab593349",
   "source_digest": "84fd64bd6a08b0f97e3a5bb9cc962896137a45fda06e685eccba96e869cd6fd2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ec6a9988bf434c55ab593349",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:bae5240a6421d758adf91f23",
   "source_digest": "401e22e0170dec5dd0587be25dd9019e4ab43092801bde507b524d5d69b25954",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:bae5240a6421d758adf91f23",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d325fbb6f39a14620745c8d4",
   "source_digest": "ed171d548f9b6138d0e835ebbc9f625374c293a2f52d35719c9d2890b7cefc78",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d325fbb6f39a14620745c8d4",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2904a3c7be508cd6050e3856",
   "source_digest": "41b451c4f5698eee587a3cd89c8fb31772004d15c17edcce04519811381a2685",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2904a3c7be508cd6050e3856",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:96dcf883f1680146b41e912a",
   "source_digest": "b0dee0c9213cc0bf4edd78f93140d4633aa862a0164dd96e93e19eb8d148153b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:96dcf883f1680146b41e912a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ac081eee52e072c0367e2064",
   "source_digest": "18a9e48be044a45029c1ce354f2f9dd0a3cf8fff5df447df36629fd59ba2f125",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ac081eee52e072c0367e2064",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:87bed3784433e42ef40b4f8d",
   "source_digest": "9cfd0f985bfd32df6c136cdfd675064c5b2b0b262aa830e0c5054745cac9b520",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:87bed3784433e42ef40b4f8d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e691e3abaee651e3870bc295",
   "source_digest": "64edd6396a1d97a1e65cd84f1048b252c0b9701d08b9374c3a3cf68b756e4b02",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e691e3abaee651e3870bc295",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4b56c851186a2c3c46dad594",
   "source_digest": "588354d9498608933774b07a5230585b314a877a1d2bade01c239f9118b76209",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4b56c851186a2c3c46dad594",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:6dbc2eb7abb264d12ce80f54",
   "source_digest": "6043203cb2ac33bd4d9dd6cb2dc313a174428be12429e0c53ac471edd2874d9e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:6dbc2eb7abb264d12ce80f54",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:775fdbc5e8b12ebcf834816f",
   "source_digest": "58728dea581d92eda41861034052dc7622dac8a41e0d03072746804d8d824b5a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:775fdbc5e8b12ebcf834816f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:65c90faa9a52530dc6d4b6d4",
   "source_digest": "cb14c6af567e4d26b63054abc3e6db5618d095d1f7abe5c6d1d19279bd599fd0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:65c90faa9a52530dc6d4b6d4",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:fb3479fae1875d305181bc61",
   "source_digest": "414dcf5a40245bc1daa8decff7aad277ce2cb18581957d7aae0744128f809c66",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:fb3479fae1875d305181bc61",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:88d81adfa1b5bf6e5711c545",
   "source_digest": "64751b176f67c273d8f88695c8e0ac8bb519f7b525ad95a1189aff741b854c28",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:88d81adfa1b5bf6e5711c545",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:48185873587cb5b12446fef1",
   "source_digest": "63b550033a4489962ff3ae99b74f69d32859921c7b60c9d74d48f84b3efc577e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:48185873587cb5b12446fef1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:9185441ba1f4c605c944e16d",
   "source_digest": "2d2313f3a9ae342a6dd7d5546cd2f2b06c6724082e77f84c137a0f5a2da01fd8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:9185441ba1f4c605c944e16d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c003ea3b4c067cd075529041",
   "source_digest": "c1505d3da4c4613b401d8ad6482b95984314fa2df777956510ad49f54cc1c761",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c003ea3b4c067cd075529041",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3a55b02e876836341d44f98d",
   "source_digest": "545145673cfaef7ee5cffc91dcd384af31d3d2039cfac4108b4b785d89b6388f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3a55b02e876836341d44f98d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d4635ff3a30249b152d3a123",
   "source_digest": "91bd6f6a2ac6c3c25207d4e0f1a18e02de32c011c202d3be93b71ad10ba8b0d3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d4635ff3a30249b152d3a123",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:9335d5d479162a43d99602f8",
   "source_digest": "94982571128fb95fb979afb44563575a9b7b11d856158c5cc30a2626c2950aa3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:9335d5d479162a43d99602f8",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0206bc301afa3ea07b65e517",
   "source_digest": "8e019b8c6085fae946752dccbca52bc7d8c14915cf9149880733b38a177a668d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0206bc301afa3ea07b65e517",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a0b3c8722b4588c44cb3620e",
   "source_digest": "e39047e82a0884882265dd8d9314f365b7d444bd3692c81c860482a2e8ed7f9f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a0b3c8722b4588c44cb3620e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f2c8f11cf9db27c9f74962de",
   "source_digest": "cb3469265e9085b20bb407d791f50a88475a141071f5dc917e2fb930b8f9a8dc",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f2c8f11cf9db27c9f74962de",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b22c237e7d4347b320dbb149",
   "source_digest": "463361bbd9b8fd58e38daf1a68b9540d67e114d981a1c145fbdc064526b46809",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b22c237e7d4347b320dbb149",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:17fd1c98ededfdcd8c2dce05",
   "source_digest": "00612a9170e245eedbdc509487c3935f3b7e617ac40c817c440703386993ebff",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:17fd1c98ededfdcd8c2dce05",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0c2a409f66d0912ea66aa116",
   "source_digest": "eee5ea537e18eb5179cc57c479331e74b63ae18a3a438807f533fe555fead5f5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0c2a409f66d0912ea66aa116",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d7c798c186f9a35914f4de16",
   "source_digest": "661cb3d04cd5ab1ab1f15d1aa2a754e331fa771aefe806ae31aced81f2498dd0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d7c798c186f9a35914f4de16",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ef481f113cddd79c106a8aa4",
   "source_digest": "c4369b33479d6b1f47cc6f3a7c0f8590c1271c80249f2a10574c312d35bef8ba",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ef481f113cddd79c106a8aa4",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e5f32d81f240cae8d975a2f7",
   "source_digest": "453d7e5072582452125363b647b18157147a3a45a4a17db85c8ef512a8e98790",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e5f32d81f240cae8d975a2f7",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:61bae89224a962d9c9e5df57",
   "source_digest": "1fba38883684d1c47195f9752b1ac9a58e9fe65f0e031b030be90190899cb493",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:61bae89224a962d9c9e5df57",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7e5020a34ece529ff461c651",
   "source_digest": "6f6522ad10d4c1c92117bbbcaa97a1e7a6695d8a68aab9d2b933c72790d7d24f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7e5020a34ece529ff461c651",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:115e9051943a93d5fa8e7d13",
   "source_digest": "0a41dd9f98497d82862f17837d3aebbecd245d8edccf1252b1fc41fa2910107f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:115e9051943a93d5fa8e7d13",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4d6ec3be3c61fbfc08e3f9c6",
   "source_digest": "6dc3b3c50ec9c63559efedc9de3a21ed1cc65fc1c6ae81b71ff829df4462fbda",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4d6ec3be3c61fbfc08e3f9c6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a7c18a5b55398480bc7fe57b",
   "source_digest": "99d11e2ed9e2db5b8534ef8a5ee1a5c75b1d29c3ea09eed35ab9e1815e2cd7c3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a7c18a5b55398480bc7fe57b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5246302ef3875c4ef5fc0be6",
   "source_digest": "a933424c83bd25df9c905b1e9d1c01566a0da73122898aa0a5dca4681cf3722c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5246302ef3875c4ef5fc0be6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:02a05e243c5584a0aafbb04e",
   "source_digest": "5cd3042698e52ec3c51d013979b8a5beef9938a702cc7e34b79383b80cb3228b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:02a05e243c5584a0aafbb04e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b41197848d244f40068e6f44",
   "source_digest": "2ff99f90e9e1e5a8d49ee81267d228f3045134c2910f8db795e5663c41cef160",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b41197848d244f40068e6f44",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1c6a5f063f48aaee4571e712",
   "source_digest": "df92798e9c22d5dbe89fb100daf1e811c9cc8554bfac1504771cedab54494248",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1c6a5f063f48aaee4571e712",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:074e02e961464206814d33b9",
   "source_digest": "51924c552b9ad45d87f403de297d0df932d6683e936bc7e2dcb770c529adbbea",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:074e02e961464206814d33b9",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:07e6a586373f9eaf181a7ca6",
   "source_digest": "6edb2636e1825f82c4218aa43cb39c1b2196dc38682a789a119398cbaeeb10b0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:07e6a586373f9eaf181a7ca6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:131db840d4d1681549435a82",
   "source_digest": "008271fdc33398d24ba8e01a157d64d0675500ef51b524de86efbfd86ed7f23b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:131db840d4d1681549435a82",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:9590ab933e9cee670f11fa72",
   "source_digest": "3d982a1eeb2c5b6c93577f3d628ac65e52dd07b112ed302d44a8dc761f6f69fd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:9590ab933e9cee670f11fa72",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:858dbccba4c0d8432bd94c05",
   "source_digest": "148b057f792c9eaefa830e36af0a103b2e6cb99a42b3daf73f4bc377f742ff91",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:858dbccba4c0d8432bd94c05",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2936d4355ad321acaa34922b",
   "source_digest": "79566931fb1a72ee8c7ee1acc98f455ae63d185f3bba225f9e1dd382e3c7c0a5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2936d4355ad321acaa34922b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f1a02468f44fc59c477ab9e6",
   "source_digest": "ad7c1df150618b78c6a067317af9659a3d73c5a26b67cfdd53eb40cc5eca80bb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f1a02468f44fc59c477ab9e6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:74196d4c92d3d0e2fa6ad5e5",
   "source_digest": "af1e7597033ef17df1a3dc11b4faf0569597a5668b837e9515c2d697dc5c138d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:74196d4c92d3d0e2fa6ad5e5",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:bb31d2673d5e490a670489f0",
   "source_digest": "40da05aa12814109baf9523e92a83a4e945235929b3c6fd74e38483d1968b8f1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:bb31d2673d5e490a670489f0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ff22f05309ee8fb9492935a9",
   "source_digest": "227ccf5636f8b4b0f1095fb2932e4cd861b022d8c722938b83679d7405b92090",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ff22f05309ee8fb9492935a9",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4ff8ddcfdc411b02993189d1",
   "source_digest": "fe5ab05511b53691b8775d3e00bd50a43f2cd8c9f264bf1aac6a0def0e9f027b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4ff8ddcfdc411b02993189d1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:df424885322ec2b5963bb017",
   "source_digest": "6bf9fa9b5537a82874986119880f81c05b9b6fe090b74ba125698f61b9d4cd9c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:df424885322ec2b5963bb017",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4c54391aa4a205526a239d6c",
   "source_digest": "bbad2f72242126a7102d5babf1e6c1de4ba5296d08af999465ca92face07da25",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4c54391aa4a205526a239d6c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:dd296b8879e44face5cf7d2c",
   "source_digest": "138c134ca2fd877d8ee04606ce97014ceb055764f086ffb471ae7f3b0f537934",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:dd296b8879e44face5cf7d2c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ff2a77c0feb918417bc21682",
   "source_digest": "6f0aad709f237f752b7dc3a3a0c64ee0bcf409471f9ce56d1fa62acfb019d88d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ff2a77c0feb918417bc21682",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:65bbe187b24fe36fc30d7777",
   "source_digest": "f84e99cae70e0f7b89287a7acb9c0593f92565cd90c75d22a3ee0c6ccbb0b947",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:65bbe187b24fe36fc30d7777",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d3c0e4ba8b0e2de15be32e71",
   "source_digest": "6cbabdb7c56b31698b97afdfcc7888a6f2efdbd36eefe60b0d5df9de94e0f47a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d3c0e4ba8b0e2de15be32e71",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:10842e07326e4987e84589fc",
   "source_digest": "0ea992a006a7d31d044e427bad01dcc14e27910b99fb356459e226bb324ce58a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:10842e07326e4987e84589fc",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:9c6b22b04f7145f6a0b6202d",
   "source_digest": "d5bfe5f3a0deeee3a9dc8337e0f0bb1f590ad790ade0c83538088e9eb070e598",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:9c6b22b04f7145f6a0b6202d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f85e02107809707040e212bc",
   "source_digest": "b469371016cac1301a48d75e113895952cb2817e57d6a520417e1869b4bccfd6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f85e02107809707040e212bc",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2e23e002abe86d1f4ca9d32a",
   "source_digest": "aa06b996de0797a552ba27764178a2c3fab507580e2229606797b7caed632ca0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2e23e002abe86d1f4ca9d32a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:8569937b4124c40483a63eef",
   "source_digest": "7890f6e7cb8b3e1fb21200953f51e4bd68312322b3282727706c15939c602b47",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:8569937b4124c40483a63eef",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7504373d84e9e11482ed1d04",
   "source_digest": "18fbc521ebafe075e9d35e00b6210a4e48a48f485494ecdebf9927b576b47c37",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7504373d84e9e11482ed1d04",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:647b74ec5c5407e100a07a29",
   "source_digest": "106ca100534e179c9ed45db267406d6c23f8399b9eaea9eb132b591107e2279a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:647b74ec5c5407e100a07a29",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c91d1035f7b47d2da94ee7d6",
   "source_digest": "0f904ad997e86ee366f76315d4a62e9589188a0d75ae2f77b875812af62ae3bd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c91d1035f7b47d2da94ee7d6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:456ee2eb17bd496eece89085",
   "source_digest": "81c676aed474aa6cd9ad6408b0606f681c315ebbd9b6f0a4c9c1a9a03cd69b67",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:456ee2eb17bd496eece89085",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:56bc82d4af41c9f1eb3b020b",
   "source_digest": "4cfe97cbcd381af166e924db240b0b965ef53ba69473d96be71236df70b7e417",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:56bc82d4af41c9f1eb3b020b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:8d3707873e788a54ba24baa4",
   "source_digest": "9e0f15f3e237197f8d30f9b91688294f63049d6fc322858c1df9c505438a5937",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:8d3707873e788a54ba24baa4",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3e24a6bd6bb05f09b3c57f60",
   "source_digest": "67781fec83ae174761a67023c88d5ed39e35aa03ec2070652f59251278402608",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3e24a6bd6bb05f09b3c57f60",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:202d3e4ca90dedacc46cb493",
   "source_digest": "6e27145f03f51b7fc232b0c3a873c0ea9f05439c32a3ae87015180e0a0fc2b2d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:202d3e4ca90dedacc46cb493",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3c35b340098addfd18397262",
   "source_digest": "df1473eedfc90fb1f1fad5c47e507d0cb91feceb059f20f9340702d3881c6b15",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3c35b340098addfd18397262",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2e78cf5dc7cb2564224f79a3",
   "source_digest": "3c28147e638de3a817fb69888c1284379676d8355baeab648afcaac738558123",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2e78cf5dc7cb2564224f79a3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:67538c917b006e94fda5031d",
   "source_digest": "33bf4e808c4ae4b5e566f06dbee926f039f5e2ad88e6239cd03f52dcacb64e3d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:67538c917b006e94fda5031d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:79f032a531290a1579efa7b6",
   "source_digest": "352fd42705f4613deb7807e9277e2f40b550292048fa07723353367ba4ac4aa8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:79f032a531290a1579efa7b6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e95b27b808a1c045713881bd",
   "source_digest": "ab2454208af0a042edcdb29b7d520031c8d0e3e7793f1e2894ffe827208c49d5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e95b27b808a1c045713881bd",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:17cca0b31cbe653b8e20bdbd",
   "source_digest": "57e6203629b8e310dfa0e113934736f9875757513ee52b80e8fb25dd479ccd94",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:17cca0b31cbe653b8e20bdbd",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:34c7ca4c78f70589c43762aa",
   "source_digest": "c1475c81819af2c39d734c9d1fdfbc85e245666090498febdf1b48e1f2848331",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:34c7ca4c78f70589c43762aa",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ca044560302d5944d783efaf",
   "source_digest": "b766e034f800b3e11ac13f23a72bc8d3e94b23d85f33982586d8a4fdb02ed3c2",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ca044560302d5944d783efaf",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:9817e187d98fe820f77824e2",
   "source_digest": "7807207aa58c3ff7b1eff458a9409fc6c7601a4996559eaecf8cdef31caee32b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:9817e187d98fe820f77824e2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5881da87a8f5c8beb658e719",
   "source_digest": "02c26cf9c819db2affbccd14ba4755b8f25ab2274112f7d81f49db01c04f5b2e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5881da87a8f5c8beb658e719",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a7b18e27181672bb346d0f12",
   "source_digest": "2bed3c168db9805ff7b57d92319f128133a61b5aaedf490e93fdf7190f341811",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a7b18e27181672bb346d0f12",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:954752554fa35d157a397f8e",
   "source_digest": "b9cf3808a3ae576829875d26c5ee1ab8000ba1c8513713bf5a22d5fbab6ec0f7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:954752554fa35d157a397f8e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:867b3217237687d5522d3888",
   "source_digest": "b915bb374a04dc906b812e14539a3c57348eddb022df48163d854531b1f15cbf",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:867b3217237687d5522d3888",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:429efb56264decc3d253afe3",
   "source_digest": "e8a8ef2cbf11c7a63d077388d888ac7e3201a0c9666c4062e491e51b60cc5bb5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:429efb56264decc3d253afe3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b5b02a20e6016a11251910e1",
   "source_digest": "e4ed1ff92386c1a59ac85209c6fac871f34524be3f6218b09c129715e6969152",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b5b02a20e6016a11251910e1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:9ff85825bdfce71f5f205dd5",
   "source_digest": "f238ae86c1dc1a7eacb107d39a6c2ec183b8ba96aae05e4e07d00e7bdc7735fd",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:9ff85825bdfce71f5f205dd5",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5f05898bbae7d2c2a0d8fb5c",
   "source_digest": "d3816a1de88087743f3ffbf31eec59542c22e4d6f23c18061811c9b550a8b0be",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5f05898bbae7d2c2a0d8fb5c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:14ca1c9473cec188db515e36",
   "source_digest": "a40b1835f70dbd4eb1450b7ee4fce358d17215f1bbb2ace72aa046c060ac2c9a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:14ca1c9473cec188db515e36",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7fc8b55c5641e36784157c61",
   "source_digest": "efd6a7cb47e8b8eaaca696f6b44b31c830daff7b6eac4047e57c4e283f19745f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7fc8b55c5641e36784157c61",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:54d6e7cbcdcaa9cc23010ed6",
   "source_digest": "697d52f9abd5da78bea25e84c48dc007233a28b640a396849f81792085429f5d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:54d6e7cbcdcaa9cc23010ed6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e57463488e386c9f98c7ce97",
   "source_digest": "a58d12483cc0f2e8c0c1382ef3350fcf289d49ba3e7fb1a8a9abc7d91d98329b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e57463488e386c9f98c7ce97",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c3498b2ab013677d245f0437",
   "source_digest": "ccf337060c21bfe82378668b117b5df27621565e9dd5142d07f25109545409af",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c3498b2ab013677d245f0437",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:005bd9db6eb0da25fabcb66a",
   "source_digest": "ecc950acda30829a8a0661c8d7edc1ef8b31a1dfde435679ee684b240f4c13af",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:005bd9db6eb0da25fabcb66a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ab6e681e599e6790d7cf7b96",
   "source_digest": "c2e2e7d290f08cf069beaac3399bdeee1d338982652140fc3f7ab2e48d990bec",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ab6e681e599e6790d7cf7b96",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:6e56bfb0d788da71c940d9eb",
   "source_digest": "321d078b49e70809a703d86ff58d3f710e8a5200265cf4fe62960d9738276d81",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:6e56bfb0d788da71c940d9eb",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:65a7895b9e7d18e3518be5e2",
   "source_digest": "024447438840133a5aa94b8a0e418614d9a028e06b4d72a935ae7be49df63f13",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:65a7895b9e7d18e3518be5e2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:65c7f11440d8094c5f44bd0b",
   "source_digest": "685fca4b91b0520930bbf1b13e16805a2aa03896bbaa0a010e2660817e49a536",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:65c7f11440d8094c5f44bd0b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3cb8e7648fe77d461f2e785e",
   "source_digest": "e1816f1067262fcfc12dbfdb12361e9cf7d7e33ee15835c2b68ebc0a9ca78e58",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3cb8e7648fe77d461f2e785e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f5678d3580c5cc273f29a48a",
   "source_digest": "eb8a469f68b9d62a29f1cdf9beefcfa5fa05047573cfc6c20ff17a5cbcfba023",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f5678d3580c5cc273f29a48a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:aae93dc1b87a68d1b9fe82d2",
   "source_digest": "6907291dedabf47d7add7b63d30d780dca106521f6adf74dd2d37272ac52f27d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:aae93dc1b87a68d1b9fe82d2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c362d194fb358de5fa200e25",
   "source_digest": "c34d478b06f26667b430938670e4417d24216961212e0a64a0cba46b558c33fa",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c362d194fb358de5fa200e25",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:19f0a4d26a6bc00e9306aa1b",
   "source_digest": "f71927e1efeff4b2550c091dc7d78cf15264bc514680abb8ede1eddb73fa83fb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:19f0a4d26a6bc00e9306aa1b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:db954c80ef6d9663b66d3be5",
   "source_digest": "e2ad9b81960a6b9a9497f1eaadf44aa16fa2460aa6780582cfed9f593b6bbd3b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:db954c80ef6d9663b66d3be5",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:33fb3dc361cdf362b2d1dbc0",
   "source_digest": "3c4f8404ebbf276c05d2da4a22347f82d550e6f336b4bb12f7ce2dcb102e1324",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:33fb3dc361cdf362b2d1dbc0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b7675ca79a0676dbd2c85604",
   "source_digest": "be1a17ab28259d4ae0af108cd909e3826814cc1fab7b0948533c39b7e3157cde",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b7675ca79a0676dbd2c85604",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:baf752d1d36437ae2fdf42cf",
   "source_digest": "be44e9dde16f82e92d40b1e14c0759125d0ef9704901309078fea49e1848e1a4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:baf752d1d36437ae2fdf42cf",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:dbaa58c701f5c304c0e6a969",
   "source_digest": "962335efa2b0c9dd4163da9be6afb05d208ad522a82a015b97b70534d58c69b3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:dbaa58c701f5c304c0e6a969",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d23161dd9d3808f6eaff704a",
   "source_digest": "d36cb645d3dd358c185a2308509788eeb121e0a2caa137526a61967aa8c401b7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d23161dd9d3808f6eaff704a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:6b0f9a84d481775b7f402dff",
   "source_digest": "f11492331134611c0c663d1f86cf56ee55f6ae8a0da89766efb86c154715baf8",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:6b0f9a84d481775b7f402dff",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:044f393781ef75cd348f223b",
   "source_digest": "854259ba43d0b1035d2985aad156613dae71a1fc70eeea69b9dea62cc9541998",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:044f393781ef75cd348f223b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:44408b3710ffddbd98c44569",
   "source_digest": "af0de9d3df6617239e3e990cbf00b051c08dfa769a4feecefdab57fcca24930d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:44408b3710ffddbd98c44569",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:21b0f517263bbf25341b1cca",
   "source_digest": "68473c47858319ff8381a40416af8cb94462676109f5bc7f16da9e048d9f7513",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:21b0f517263bbf25341b1cca",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a35b9e42d31c85742a8da7ab",
   "source_digest": "8a9bf4a508ee2982badc47a7109255075e8570803973835085228b8d7c7127ba",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a35b9e42d31c85742a8da7ab",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ebb3a204215b8c0f29336f57",
   "source_digest": "0866bf33b6e0e55d35aa18e80486cb6244243284313cfbd4fc4c22dde43f422f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ebb3a204215b8c0f29336f57",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d7aba9517f55bd948c2b640b",
   "source_digest": "da1effb70c39bffd54f080d50b6a336002af89694853495c01514aadd8adff3b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d7aba9517f55bd948c2b640b",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5ec7ae74f1e8572f3124b492",
   "source_digest": "bd466d560cecaed9e8ffda44f637f7d2505cb662014472f28721191dd2704461",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5ec7ae74f1e8572f3124b492",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:6cf0f957e0304ef207f2e479",
   "source_digest": "3b43a7d82a6399ec35c9b83cabde0b1c2fd5db5c359daa3433414257f7c46c66",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:6cf0f957e0304ef207f2e479",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4e26f010c4f66becac6dfae0",
   "source_digest": "08d7d876fec8136d061364bc8e08f7748c9d17fc9f023ce58d1840c72f3488a9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4e26f010c4f66becac6dfae0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b30a7d6c21138fe4854c761e",
   "source_digest": "280df805f3bc4e264d2941e43f2f0b481a4acd5c31c4b71473d29beeb4870901",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b30a7d6c21138fe4854c761e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c2f9cc25bfbea22b2215b518",
   "source_digest": "b06bd90dfa6c465da5224ac480f5f4935cc67395cfb50b779e07d43c63f751fe",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c2f9cc25bfbea22b2215b518",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d772c9c5f3f6ed299d3c343a",
   "source_digest": "42829fb762e37f6eae701a3705e03ee4c876d6baf11a509f35ddd44108c8d62d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d772c9c5f3f6ed299d3c343a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:da5405acbcf5b905a3ae4ee2",
   "source_digest": "a0cad484c8f7c0e5ad26d85eb641da673dcd91e1b0c54e7a276e62a37e1d25fa",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:da5405acbcf5b905a3ae4ee2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ef14f23a46f670963b860fbf",
   "source_digest": "f4a85ce733f8d6638c3ec128668a16baafe97eea688dd8fa212eb239f1cc79ff",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ef14f23a46f670963b860fbf",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:000c396ef699d8a6a696d2a5",
   "source_digest": "16a7800d632765db40ff1f5a0be79855e34696a6842720c0f879b8baf7017fb6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:000c396ef699d8a6a696d2a5",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:89364bbcbe629bf5d13228f9",
   "source_digest": "241e1425d6df8c74f84e762990adaaf5bc2950d85de6f2c909c00dbc7a6702e4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:89364bbcbe629bf5d13228f9",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:63b9217c561289b499e74c1e",
   "source_digest": "db1979471e4714d88932f470b4fffe14d1e7bddbf81329f33ca1e48e2d64cc09",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:63b9217c561289b499e74c1e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d0351e63ab03e54958c33cd8",
   "source_digest": "7b8de7420a928fa683bf7b09940922e2681c65391dd11d9fe57effa4142d33f0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d0351e63ab03e54958c33cd8",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1a22ccf65f4059aadc5cfa51",
   "source_digest": "6dcd397aaf134cd6cc90d368c0bc7ec11681e714178006b7e30ac0998afcee87",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1a22ccf65f4059aadc5cfa51",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7ec8f1897b498a76e7102c87",
   "source_digest": "027c4edd713935746c1508bf5edbf269ebfff5729a5c8ce20eba21d985de546b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7ec8f1897b498a76e7102c87",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7a74f31b226a0f3ce8c84dec",
   "source_digest": "c33144d1f945dd75df4a465f7b222a0cca793139037bce1005764b2ba49910a4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7a74f31b226a0f3ce8c84dec",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5e62a56fb6621ee5dc048dff",
   "source_digest": "5080c39f66f7972b6f7cbfa110477540a7bc773060921ac8b503f33b4a1b1566",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5e62a56fb6621ee5dc048dff",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:8ea1b24080a33147362d83f2",
   "source_digest": "fa84a7788a1a279bc8086e3c89667555b2c82ac31ed17a8007c4fd0c5adb0c93",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:8ea1b24080a33147362d83f2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d808468d67e3cc67fddb60ee",
   "source_digest": "d16595eedb91fb8dc90367ffd0417e8823b40d0ee580aeb3ef47654b34555725",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d808468d67e3cc67fddb60ee",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:e5ac18854695f1927e3e3205",
   "source_digest": "1c430082567bb425621550cd54a8e380704eb5517873da0e14f88fb1d908ec1c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:e5ac18854695f1927e3e3205",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:9bc3f0c474ccc85066ba92d0",
   "source_digest": "d623a10a8f8b7f9f048e22812cd4fa8084ff6c3bb755a524e75d8aaddaba100f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:9bc3f0c474ccc85066ba92d0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:71e5e051b5ab70efe904865d",
   "source_digest": "6fa4c9d0da52212c1a5794d1f6f8778f136639d99e2de480bd6acdd3e46e6eee",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:71e5e051b5ab70efe904865d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:de9d7bd3d6c81e0e89c5f293",
   "source_digest": "c35c3f2ab1fc6f2c788a1bc650605f9e29f66ce0b05ec69a67f13656c9286f39",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:de9d7bd3d6c81e0e89c5f293",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:8abb7acedd1cc0ed7ed124b7",
   "source_digest": "66f979334cead05a7ad161745d7f00f3446e856f466f0b568d119867a7a9a71c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:8abb7acedd1cc0ed7ed124b7",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:52ff4cd514c40a8169955f92",
   "source_digest": "a20a16c40018dc86ca206061bab77b3ad61f536bbee399a895f2fcd5d897e399",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:52ff4cd514c40a8169955f92",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:993bb60c943f93358a1ef4bc",
   "source_digest": "3b2ae998d7689ee3beeefef5da26eff725a55e7f97c9d6f4b8bd13a686a7558a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:993bb60c943f93358a1ef4bc",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:8c09306c0c0080537fb86c6f",
   "source_digest": "8d86552624601258ee68682e70872a38bae72a1a0f184e69b37adf07ec8c10bf",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:8c09306c0c0080537fb86c6f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:3a233454fc40f902efedd15d",
   "source_digest": "17f51ca905f671a97c85ddb73c6830fc6ab88b363ba4e2d10075227bb94226bb",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:3a233454fc40f902efedd15d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f4c2a6ce4b5b22cd693ceb16",
   "source_digest": "e0578c860697f03488d089828fd244a2275ba03a1643c96b4f88ee3a54630771",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f4c2a6ce4b5b22cd693ceb16",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:094ab16029f77ffbf732a9a8",
   "source_digest": "d9e21ad2f512d5cf1f68b45655af26b4a25571c14ddb46a3f18baac4f3d4a453",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:094ab16029f77ffbf732a9a8",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4d449c81c660623deba5a9c7",
   "source_digest": "3173cca765f63e70202bd06af113855afbc1933925ea91ef5ac46783f55ef570",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4d449c81c660623deba5a9c7",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b3523b2448d69d74b14196f3",
   "source_digest": "6a031de2cb81a72f6d0a66abbc2b01c8a93af7dc072dd34847cd080577a40116",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b3523b2448d69d74b14196f3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:6ff315d5a5783570a17c42ab",
   "source_digest": "6bc72d5e0763347b7d8bfc35d35781e9f7e48f25d53554a5b3052e5ed4149ba6",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:6ff315d5a5783570a17c42ab",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:2805a740b669304be2e834e9",
   "source_digest": "835d0c1561681092d252c4a4dd2c6d40101098f90e4eac7a456b37886ca7c3a3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:2805a740b669304be2e834e9",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d3fefc390133a64abdcdecd0",
   "source_digest": "16ef342816e41bfdaaa686d1ad12c74864394f45d99544f0098ef9cef8c2b230",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d3fefc390133a64abdcdecd0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:06d3cd56f69bf16bc8c211c0",
   "source_digest": "a2d36a06adcda49e32d57f5599507349e0c6aaf5db5fa203bf51946c7b7df5f7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:06d3cd56f69bf16bc8c211c0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:76898c7975587e9bda3d1d40",
   "source_digest": "569cf8f420f0a3fcfaabe3292f1ac467b992cbff5442c05536bc6f6343281767",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:76898c7975587e9bda3d1d40",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f884118a7770b48b3129d83f",
   "source_digest": "93231d758968cfdb0f6c7ec89f208e715320c0925f628d61d45c14e4b98830f0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f884118a7770b48b3129d83f",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:bfba894c7c42307d16ce68e5",
   "source_digest": "39a258a5a523f0419a8674692c215836d8be55d3bf6db452c9fb2f7d1e90ede1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:bfba894c7c42307d16ce68e5",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f073329e92a896ba56146ecf",
   "source_digest": "11a80f4c7fc7619677c97a1d25cbd17fecf75a9940a54defadbe5d6222b547f4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f073329e92a896ba56146ecf",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4e0e8e94a6b4a0609e5cbf0e",
   "source_digest": "d2c3d384b4d2ebbec797af042296ea3257e309b6b59c03ab699a072a17952d11",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4e0e8e94a6b4a0609e5cbf0e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d982df1052a3ae55c7149f3e",
   "source_digest": "a8fe172aedbfcace940b2ce3c860586d2a197241d3aa91154533ef562aff15e1",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d982df1052a3ae55c7149f3e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:6bd819dce08cda1be4e8074a",
   "source_digest": "f2056e52e50658d79c00a43f27ca287fc9a45ecb17fc85a8548650246e53c6de",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:6bd819dce08cda1be4e8074a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:c9660b4e75352047d8df28e1",
   "source_digest": "ea69063a57171bc5ab259b24e16b8703156ab812002d04c0e8d0aacf666ae03f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:c9660b4e75352047d8df28e1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a6318729bfa0db2001282397",
   "source_digest": "3dd73d02bd16afcb247d8a927f18d5e88ef2f774a53951cb081504c24be90ad0",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a6318729bfa0db2001282397",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/timestamp)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:47b378d6a5024c0946469651",
   "source_digest": "132aaf1624e222834ce92cc7b73e54b586c679c4fe2413cac0b192fa8face627",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:47b378d6a5024c0946469651",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d87e3e41305d73c72827f6e6",
   "source_digest": "66b9c872dc0e372288912663e56cec15ef9666e1882f201c6d4e6464fb62845f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d87e3e41305d73c72827f6e6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ed5293a390aaac691ea7b35e",
   "source_digest": "0ea41217bbd3b30290caaa4f3546341ede94fb1649f2f16272be244533718618",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ed5293a390aaac691ea7b35e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:7a409633adf2dd1b72d1a968",
   "source_digest": "fa1dc7c0690ec669f2d292b37958efc2b65e70c7977b23ff8d4795829188b65f",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:7a409633adf2dd1b72d1a968",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a64c0d1c953d75e9dd694c87",
   "source_digest": "5571206c250f88cd9cc449e9b417a01d68e428240cc8276e54516e338b930db5",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a64c0d1c953d75e9dd694c87",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:fb32a5318dad0fb7b680b213",
   "source_digest": "e42db6b1b9df6db38c0663275102c9d6b38b68466bef8424bda7585f2f15100b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:fb32a5318dad0fb7b680b213",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0fcab1bf624f9513475e7462",
   "source_digest": "d26ee8c27fb1ec98ff8735471863d54eef0641b194ae31accd9da38943449f43",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0fcab1bf624f9513475e7462",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:100ac2959ecf130292d5f74a",
   "source_digest": "a1c5d4c9885758b5017dc459563777e3490142e8407aec80c89dbccd51fee9aa",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:100ac2959ecf130292d5f74a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:da6d7cad39aba435b312ddf2",
   "source_digest": "2aca89205b3e75bd925066ea23909d5f19475fe35c04fd8af5934b1c9d69ca34",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:da6d7cad39aba435b312ddf2",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:0414cfcd094100939c656901",
   "source_digest": "a83929a245f15956111ac53d028a4126a531f21f7b957b570f01e44099c895c3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:0414cfcd094100939c656901",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a85c25c18235ad54ec630bd7",
   "source_digest": "bbba5ee5f96c282ef86a7accc35368101d9b22e8bc74974717e6aa989b8dd2c4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a85c25c18235ad54ec630bd7",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:9cfb9cab874f23b70a320cb4",
   "source_digest": "5aafff1f06f7d930736886c117869f13ee92b4849af1a2bceee9958123e9db49",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:9cfb9cab874f23b70a320cb4",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d56afeb6473fc2d71d570d8a",
   "source_digest": "1cfa7d9d075865de627e77d3cd8fc5d89e794efd343069a7a76f0abd6053ab20",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d56afeb6473fc2d71d570d8a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:646be7f6d260451742055070",
   "source_digest": "849d164b74d59e8b8d64582b8b87dd37e69f19e3e4d0972de9d32c0220bdb985",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:646be7f6d260451742055070",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:65e7b3830013e79f66b453f6",
   "source_digest": "dac2726a408a5e1aa297985a2a4ac4e199ba1ae24d871550640711a90e9ebc78",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:65e7b3830013e79f66b453f6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f354e3c4c826d0cfe175d64d",
   "source_digest": "b76115efac7e43d2c79c82a730a962201900fad53b302d5e234b9a6daa18889a",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f354e3c4c826d0cfe175d64d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:128a40527b9f360ec58202f6",
   "source_digest": "41b33c5007e46f971e0a85c8ff6ae3739ac36338c736ad7428acb9fcb9dadf16",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:128a40527b9f360ec58202f6",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:ccf0365335a611f80fbe1abf",
   "source_digest": "787e083d63eb7a1a656a97fc1513baf7a1a62e6e9e68534eb8efe2667d9d1ce9",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:ccf0365335a611f80fbe1abf",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a35c63cc5351e2d91fbab58e",
   "source_digest": "77df06818b4a0eaa53c1544ce274f7cacf94e42ae7a8803fe2782f844509387e",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a35c63cc5351e2d91fbab58e",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a8b30820d16277e2e52ed3f1",
   "source_digest": "55ed1f7b4f5efce06279b3a95d7b2d1db1dfddbcf7a4babf223f150dd7543c69",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a8b30820d16277e2e52ed3f1",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f66e727eb4adcd2e3965a4c7",
   "source_digest": "8b3b734544fd82e6f810d1dc46e322f7d08dac3c5a548d58ce63e1f93df48b9d",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f66e727eb4adcd2e3965a4c7",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:1e5ab74baf8daba44b9aaf84",
   "source_digest": "76e5c6dd46318d9ca2c8158a413a032c11bc7351969e29bc5c522390413d3f9b",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:1e5ab74baf8daba44b9aaf84",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:309e11fc8bcb9c462c38e187",
   "source_digest": "fadc6b56a1fbdeaf872457207880150e7c44fb26f2fa98eca9dcb573e5099f78",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:309e11fc8bcb9c462c38e187",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "時点依存の監査/状態スナップショットであり、日付・件数・PLAN番号に強く依存する進捗記述のため恒久ルールとして独立しない (episode_independent不成立)。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:f0269e7389631d4fc60eb4cb",
   "source_digest": "9b3dd7c1f63c02d84f7429b95ea9a3fa8157f1324dd6def81f8979db69e154a3",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:f0269e7389631d4fc60eb4cb",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:a10574c69887859fa8b60f0d",
   "source_digest": "7765d41488cfdda6033d74a3cb51ed3a48f0fe920a80b9a69d20c4c62d86b5e4",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:a10574c69887859fa8b60f0d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:4e6001df60ab81b06ac0d591",
   "source_digest": "00cc3b408e151ed6a915ee900eb9dfb05b0c8921bb2397cd84a92959abd35e88",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:4e6001df60ab81b06ac0d591",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:491b5795256cbd4856ba1920",
   "source_digest": "a0a08ba913d29960e279418a7fa41e2713a07c3e85200838a6ad70919ca87ac7",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:491b5795256cbd4856ba1920",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:42b3a617a4254bbe558b799a",
   "source_digest": "432fc1f5a24f359923161bad4cae54cdbde331b59d06b8ac81d4d9580ebeee35",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:42b3a617a4254bbe558b799a",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:b84650978cef9f32e6493e4d",
   "source_digest": "58b745ead626c3aeafdb50bc20dc702d6156c432beacbfaef02271e22f222673",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:b84650978cef9f32e6493e4d",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:d89cb2ee52840796043f605c",
   "source_digest": "62a550041cca6e214aabad32bd77cefe0259de006aec0cc757ddc0e8fdaf1d4c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:d89cb2ee52840796043f605c",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:422aef02410a2bf799d89db3",
   "source_digest": "356636b014af906b30eee75512653daad6ceb11b4d776e7414779c49f909e153",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:422aef02410a2bf799d89db3",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (pr-number/commit-hash/review-episode/progress/issue-number/personal-path)"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:5e6a991390f5e696f8a01de0",
   "source_digest": "09f8cdd95ef00f6b0f4264c94c11a5ff68e716bc3736177d3e0e35cc0b068b4c",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:5e6a991390f5e696f8a01de0",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "PR番号・commit・issue番号・時点実測に強く依存する参照であり、現行の恒久ドキュメントから独立した再利用可能な参照として残せない、または裏付け不明。"
  },
  {
   "source": "untracked",
   "custody_id": "local-archive:12628579b3bc31e60c382594",
   "source_digest": "ffdbfef5250c4f1f348e713e7eedfffbd013da0d44bedcecf1d91706d79e3c50",
   "decision": "reject",
   "criteria": {
    "reusable": false,
    "evidenced": false,
    "actionable": false,
    "episode_independent": false,
    "no_secret_pii": true,
    "deduplicated": false
   },
   "evidence": [
    "custody:local-archive:12628579b3bc31e60c382594",
    "criterion:reusable=false",
    "criterion:evidenced=false",
    "criterion:actionable=false",
    "criterion:episode_independent=false",
    "criterion:deduplicated=false"
   ],
   "reason": "自動分類: episodic (no rule)"
  }
 ]
}
```
