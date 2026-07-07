---
plan_id: PLAN-L7-229-cli-feedback-registrar-extraction
title: "PLAN-L7-229 (refactor): CLI feedback registrar extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
created: 2026-07-02
updated: 2026-07-02
owner: Codex
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant CLI command registrar extraction. The public feedback command names and behavior are preserved; only the implementation boundary and help wording are cleaned. No product requirement, L4/L6 design contract, persisted schema, or GitHub operation semantics changed."
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - CLI feedback registrar extraction"
  - role: qa
    slot_label: "Codex - feedback CLI regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-229-cli-feedback-registrar-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/cli/feedback.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-228-doctor-roadmap-verification-extraction.md
  requires:
    - docs/plans/PLAN-L7-02-forced-stop-feedback.md
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
references:
  - src/cli.ts
  - src/cli/feedback.ts
  - tests/cli-surface.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T15:40:00+09:00"
    tests_green_at: "2026-07-02T15:40:00+09:00"
    verdict: approve
    scope: "CLI feedback command refactor: feedback list/classify/pending move out of src/cli.ts into src/cli/feedback.ts while preserving the public command surface."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T15:40:00+09:00"
        evidence_path: src/cli/feedback.ts
        output_digest: "sha256:ebb0fc80ce4f7e2b87ce29c94c82d5f341ec3d576385c2423c2a471e5a26df12"
      - kind: unit_test
        command: "bun run vitest run tests\\cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T15:40:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:ea067199cbaed343e048b15f22dc59b38d33e2210cafe0cf4ae12f8f129bc6c8"
---

# PLAN-L7-229: CLI feedback registrar extraction

## 目的

`src/cli.ts` は provider routing、doctor、setup、feedback、memory などを単一ファイルへ集約しており、command 追加時の衝突と文字化け混入を見逃しやすい。特に feedback command は forced-stop recovery 由来の自己開発寄り文言を CLI 本体に抱えており、汎用 harness のフィードバック運用 surface として読みにくい。

この slice では `feedback list` / `feedback classify` / `feedback pending` を `src/cli/feedback.ts` に抽出し、`src/cli.ts` は registrar 呼び出しだけに寄せる。command 名と挙動は維持しつつ、CLI help 文言を文字化けなしの provider-neutral な説明へ整える。

## 変更

- `registerFeedbackCommands(program)` を追加し、feedback command 群を `src/cli/feedback.ts` へ移す。
- `src/cli.ts` から feedback 専用 import と command 実装を削除する。
- `feedback classify` の help / error / pending 表示を文字化けなしの文言へ更新する。
- `tests/cli-surface.test.ts` に feedback command registrar の smoke を追加する。

## デグレ対策

- `feedback --help` が `list` / `classify` / `pending` を引き続き公開することを検証する。
- `feedback classify --text ...` が既存の managed classifier request JSON を返すことを検証する。
- full doctor と Pack setup smoke で clean distribution 側の command surface も確認する。
