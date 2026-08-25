plan_id: PLAN-L7-503-review-custody-delegation-root
title: "review custody delegation の Git toplevel 固定"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: defect_fix
route_mode: fix
created: 2026-08-25
updated: 2026-08-25
owner: Codex / Luna
github_issue_id: 396
parent_design: docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
pair_artifact: docs/test-design/harness/review-custody-delegation-root-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: "呼出し元ディレクトリに依存しないreview custody rootをD3a運用契約へ戻す。"
agent_slots:
  - role: se
    slot_label: "Luna worker - delegation repository-root normalization"
  - role: qa
    slot_label: "TDD - nested Git directory receipt-path oracle"
  - role: tl
    slot_label: "Codex - exact revision and gate verification"
  - role: qa
    slot_label: "Claude Opus 5 - non-author closing review"
generates:
  - artifact_path: docs/plans/PLAN-L7-503-review-custody-delegation-root.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/review-custody-delegation-root-test-design.md
    artifact_type: markdown_doc
  - artifact_path: tests/review-delegation-root.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
  requires:
    - docs/plans/PLAN-L7-502-review-head-eligibility-supersession.md
  blocks: []
  references:
    - src/cli/delegation.ts
    - src/feedback/repository-root.ts
    - docs/plans/PLAN-REVERSE-503-review-custody-delegation-root-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/396
review_evidence: []
---

# PLAN-L7-503

## Bounded implementation

`ut-tdd claude --execute` がGit repositoryのサブディレクトリから起動された場合でも、
review request、attempt、verdict permission、receipt projection、session guardの全てが
同じGit toplevelをcustody rootとして使用する。`src/feedback/repository-root.ts`の
`resolveRepositoryRoot`を境界関数として再利用し、既存のD3a verdict schema、attempt番号、
cleanup、linked worktree収集の契約は変更しない。

既存の`PLAN-L7-493`が所有するdelegation sourceは再宣言しない。本PLANは#396で発見された
呼出し元依存のfollow-upだけを対象とし、Execution Episode、D1/D2/D3の別実装、Pack公開は
含めない。

## Invariants

1. Git subdirectory、repository root、linked worktreeのいずれから実行しても、同じ
   request digestのverdict/receipt rootがGit toplevelへ正規化される。
2. Claudeの`Edit(<relative verdict path>)`許可は正規化後rootから計算され、root外pathを
  許可しない。
3. 非Gitのisolated fixtureは従来どおりfixture rootを保持し、Git markerだけを見つけて
     解決不能な場合はfail-closeする。

## Exit

- ネストしたGitディレクトリから実provider adapterを実走させるTDD oracleをGreenにする。
- typecheck、Biome、targeted snapshot、PLAN lint、Linux/Windows/aggregate CIをGreenにする。
- PLAN-REVERSE-503をR1→R4へ進め、exact-head Claude Opus 5 non-author receiptを取得する。
- 正規review receipt gateを通した後だけmergeする。
