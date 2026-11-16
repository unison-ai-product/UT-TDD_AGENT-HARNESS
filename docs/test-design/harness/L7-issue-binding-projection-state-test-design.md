---
title: "PLAN-L7-690 issue binding projection_state — L7 test design"
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
pair_artifact: docs/plans/PLAN-L7-690-issue-binding-projection-state-contract.md
parent_doc: docs/plans/PLAN-L7-690-issue-binding-projection-state-contract.md
created: 2026-09-24
updated: 2026-09-25
---

# PLAN-L7-690 issue binding `projection_state` — L7 test design

## 1. 位置付け

この文書は `PLAN-L7-690-issue-binding-projection-state-contract.md` の pair artifact である。
契約 PR では production source と test code を追加せず、後続実装 PR が Red→Green を測れる
falsifiable な oracle 候補だけを freeze する。

テスト対象の想定入力は issue binding の object であり、Issue #690 の未投影状態を digest の
推測で埋めない。`null`、空文字、未知 field は「省略」と同一視しない。既存 revision の
frontmatter / receipt と、新規 revision の admission を同じ schema 必須条件で扱わない。

## 2. Candidate oracle matrix

| Candidate | Stimulus / mutation | Falsifiable oracle |
|---|---|---|

## 3. 実装 PR への昇格規律

- 上記 5 件は契約 PR (#700) では候補 (`CANDIDATE-U-ISSUEBIND-*`) として freeze し、実装 PR (#690) で意味を変えずに正規 ID `U-ISSUEBIND-001`〜`005` へ昇格した。
- 後続実装 PR は `src/schema/frontmatter.ts`、`src/plan-admission/policy.ts`、
  `src/plan-admission/tracked-receipt-renderer.ts`、`src/cli/plan-draft.ts` / `plan-revise.ts`
  `src/plan-admission/plan-revision-command-assembler.ts`、
  `src/plan-admission/node-plan-revision-runner.ts` の実際の経路を通して、各候補の Red→Green を観測する。
- 失敗時の write 件数は、実 repository の `.ut-tdd/harness.db` ではなく test fixture の
  isolated ledger / repository を用いて測定する。
- `projectForwardEscapeIssue` の CLI 配線、`eventsFor` の `event_digest` read-back、配線後の
  `unprojected` cutoff は Issue #692 の別責務であり、この pair artifact の oracle に混ぜない。

## 4. 対象外

- 既存 receipt の訂正、一括 migration、全ゼロ履歴の再発行。
- 実在しない `IssueProjected` row の生成や digest 推測。
- Issue #692 の projection journal / PLAN ledger read-only query の実装。
