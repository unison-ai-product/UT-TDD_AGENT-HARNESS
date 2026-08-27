---
plan_id: PLAN-REVERSE-600-claude-inbox-terminal-gc
title: "PLAN-REVERSE-600: Issue #444 Claude inbox terminal GC backfill"
kind: reverse
layer: cross
workflow_phase: R3
confirmed_reverse_type: fullback
drive: be
status: confirmed
route_signal: reverse
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-with-hardening
created: 2026-08-27
updated: 2026-08-27
owner: Codex / TL
parent_design: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - inbox終端規則と配信filterを実装する"
  - role: qa
    slot_label: "QA - Red/Green、mutation、legacy fail-safeを再検収する"
  - role: po
    slot_label: "PO - R3 intent確認と非著者Claude canonical reviewを判定する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-600-claude-inbox-terminal-gc.md
    artifact_type: markdown_doc
  - artifact_path: tests/claude-memory-terminal-gc.test.ts
    artifact_type: test_code
  - artifact_path: src/cli.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  requires: []
  blocks: []
  references:
    - src/runtime/claude-memory-wake.ts
    - src/handover/session-start-digest.ts
    - tests/claude-memory-terminal-gc.test.ts
    - docs/plans/PLAN-REVERSE-472-claude-memory-async-wake-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/444
review_evidence: []
---

# PLAN-REVERSE-600: Issue #444 Claude inbox terminal GC backfill

## R0〜R1

Issue #444 の観測では、claim済み、merge/close済みPR、古いHEADの review envelope が inbox に残り、Stop hook の再起床対象になっていた。本 backfill は通知 entry の終端だけを扱い、review request lifecycle/retraction、memory-sync、他方向の配送は扱わない。

## R2 実装契約

- terminal reason は `claimed`、`pr_merged`、`pr_closed`、`stale_head_replaced` の typed union とする。
- `purpose=review` は canonical receipt identity（request digest/path、memory path、PR、exact HEAD、revision、author family）を marker に保持する。PR/HEAD が不正または不明なら終端しない。
- `purpose=memory` と legacy v2 は既存 envelope の情報だけで扱い、本文からPR/HEADを推測しない。
- terminal marker を共有 runtime root に保存し、inbox JSON と audit/claim 証跡を保持し、配信 filter だけで再起床を抑止する。
- backlog recovery は dry-run を既定にし、apply時も inbox JSON を保持する。

## R3 検証・R4 再合流

`tests/claude-memory-terminal-gc.test.ts` の U-MEMTERM-001〜004 が4 reason、review identity、memory/legacy fail-safe、dry-run、marker保持、wake filter、注入PR observation portの適用を確認する。Node の typecheck/lint/targeted Vitest と mutation相当の負 oracleを実行し、CI draft PR と HARNESS Memory/Claude canonical review依頼を発行する。`waitForClaudeMemory({ pullRequestState })` / `recoverClaudeInboxBacklog({ pullRequestState })` が正規の適用入口であり、CLI hook/SessionStart adapter は read-only `gh pr view` port を渡す。gh/network/parse失敗時は observation を返さず未終端のまま保持する。実装差分は `src/runtime/claude-memory-wake.ts`、`src/handover/session-start-digest.ts`、およびこの境界を配線する `src/cli.ts`、専用test、本PLANに閉じ、#414/#419/#442/#443のファイル、公開処理は変更しない。mergeは人間の判断へ委ねる。
