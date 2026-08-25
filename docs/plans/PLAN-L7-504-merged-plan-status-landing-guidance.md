---
plan_id: PLAN-L7-504-merged-plan-status-landing-guidance
title: "PLAN-L7-504 (add-impl): merged-plan-status landing violation の是正手順を診断へ埋め込む"
kind: add-impl
layer: L7
drive: db
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-25
updated: 2026-08-25
owner: Codex / Luna
github_issue_id: 390
parent_design: docs/design/harness/L6-function-design/function-spec.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "Luna worker - landing violation の案内文を最小変更で実装する"
  - role: qa
    slot_label: "QA - landing と merged/OK の診断分岐、および confirm 証跡案内を識別検収する"
  - role: tl
    slot_label: "TL - gate 判定・fail-close・artifact ownership の非変更を確認する"
generates:
  - artifact_path: docs/plans/PLAN-L7-504-merged-plan-status-landing-guidance.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-54-merged-plan-status-gate.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-54-merged-plan-status-gate.md
    - docs/plans/PLAN-RECOVERY-20-merged-plan-premerge-landing.md
    - docs/plans/PLAN-REVERSE-504-merged-plan-status-landing-guidance-backfill.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/design/harness/L6-function-design/test-before-review.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/lint/merged-plan-status.ts
    - src/lint/review-evidence.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/390
backprop_decision: not_required
backprop_decision_reason: "既存の判定契約と証跡要件を変更せず、landing violation の操作案内だけを明確化するため。"
review_evidence: []
---

# PLAN-L7-504: merged-plan-status landing violation の是正手順案内

## 1. 目的と根因

Issue #390 の対象は `src/lint/merged-plan-status.ts` が出す **landing 面**の violation message である。
実装 PR が draft PLAN と `generates` の実装成果物を同時に持つと、#162 の三点比較により merge 前に
fail-close する。この検出は正しく、問題は operator が次の正規手順を message から復元できず、CI を
余分に一巡することにある。

## 2. 凍結する変更境界

- `analyzeMergedPlanStatus`、`loadMergedPlanStatusInput`、`checkMergedPlanStatus` の判定、phase、status、
  artifact ownership、fail-close は変更しない。
- `phase=landing` の violation だけに、次の二つの正規形を案内する。
  - **(A) 分割**: PLAN filing PR は draft のまま `generates` を PLAN doc のみにし、pair-freeze cross-review
    後、実装 PR で `generates` 宣言と PLAN の `confirm` を同時に行い、`review_evidence` を記録する。
  - **(B) 単一 PR で confirm**: 実装成果物と同じ PR で PLAN を `confirmed` にし、非著者 closing review の
    `verdict` と canonical receipt を `review_evidence` から引用する。
- confirm 時の証跡として `review_evidence`、`tests_green_at <= reviewed_at`、各 `green_commands` の
  `kind` / `command` / `runner` / `scope` / `exit_code` / `evidence_path` / `output_digest` /
  `anchor_commit` を message に明示する。既存 gate の必須性・検査方式は変更しない。
- `phase=merged` の既存 message と `ok` message は従来の内容を保持する。

## 3. 所有権と V-model trace

実装 PR が所有する実体は `src/lint/merged-plan-status.ts` と `tests/merged-plan-status.test.ts` だけである。
`docs/test-design/harness/L7-unit-test-design.md` は本 PLAN の pair artifact として、同じ 504 番号の
candidate oracle を実装時に `U-*` へ昇格する。

| candidate | 実装時の oracle | 期待結果 |
|---|---|---|
| `CANDIDATE-MPSTATUS-504-001` | landing violation の message | A/B の二経路、正本 path、confirm evidence 要件を含む |
| `CANDIDATE-MPSTATUS-504-002` | merged violation の message | 既存 legacy message を変更しない |
| `CANDIDATE-MPSTATUS-504-003` | `ok=true` の message | 既存 OK message を変更しない |
| `CANDIDATE-MPSTATUS-504-004` | landing 以外の violation に landing guidance を注入する mutation | テストが mutation を検出する |

実装時は上表を `U-MPSTATUS-504-001`〜`U-MPSTATUS-504-004` へ昇格し、Red test と同じ commit で
`tests/merged-plan-status.test.ts` に citation を置く。candidate は未実装中のため test citation として扱わない。

## 4. 工程と Exit

1. [直列] 本 PLAN / Reverse pair と U/CANDIDATE trace を pair-freeze する。
2. [直列] 既存 test surface に landing / merged / OK の識別テストを Red-first で追加する。
3. [直列] `mergedPlanStatusMessages` の landing 分岐だけを実装する。
4. [直列] targeted snapshot、TypeScript、Biome、plan lint / backfill / oracle trace を実行する。
5. [直列] exact HEAD の review evidence と CI を記録し、PR を作成する。merge、approve、Issue close は行わない。

Exit は、landing message が二つの正規形と confirm-time evidence requirements を案内し、merged/OK の
既存 message が不変であり、判定結果の回帰がないことを、上記 test と exact command evidence で示すことである。
