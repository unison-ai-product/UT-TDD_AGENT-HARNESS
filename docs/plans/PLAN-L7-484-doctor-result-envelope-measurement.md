---
plan_id: PLAN-L7-484-doctor-result-envelope-measurement
title: "PLAN-L7-484 (impl): doctor result envelope の実測面投影"
kind: impl
layer: L7
sub_doc: function-spec
drive: agent
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-13
updated: 2026-08-13
owner: PO / TL
parent_design: docs/design/harness/L6-function-design/doctor-result-envelope-measurement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - measured doctor execution と envelope writer を実装する"
  - role: qa
    slot_label: "QA - setup-smoke/profile/strict option の偽申告を mutation 検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-484-doctor-result-envelope-measurement.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-461-ci-cost-speedup-phase2.md
  requires: []
  blocks: []
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/193
    - docs/plans/PLAN-L6-99-doctor-result-envelope-measurement-contract.md
    - docs/design/harness/L6-function-design/doctor-result-envelope-measurement.md
    - docs/test-design/harness/L7-unit-test-design.md
github_issue_id: 193
backprop_decision: not_required
backprop_decision_reason: >-
  既存 envelope producer の実測値投影を修正する内部 fail-close 強化であり、L0-L6 の要求・
  外部CLI機能は変更しない。L6 契約は本実装の pair として同じ PR で固定する。
review_evidence:
  - reviewer: claude-pr310-closing-delta
    review_kind: cross_agent
    reviewed_at: "2026-08-13T12:15:00Z"
    tests_green_at: "2026-08-13T11:29:58Z"
    verdict: pass-weak
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    scope: "PR #310 exact HEAD e064a6605fd44ae50087f3927862c4143deb04ef。U-DOCTORENV-016 が doctor CLI を実発火して measured envelope projection を固定し、旧投影 mutation を殺すことを Claude non-author reviewer が確認。CI run 31694626856 は同 HEAD で全 required job SUCCESS。"
    lane: claim-blind
    subject_head: "e064a6605fd44ae50087f3927862c4143deb04ef"
    attack_trials: 4
    citations:
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/310#issuecomment-5280288483"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/31694626856"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/cli-surface.test.ts -t U-DOCTORENV-016"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-13T11:22:48Z"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:181ab4f9befec61fe37921f1fe1bc6fee5f5e1c70647fbf7ca2dd079017b4c3f"
        anchor_commit: e064a6605fd44ae50087f3927862c4143deb04ef
---

# PLAN-L7-484: doctor result envelope の実測面投影

## V-model 対

| 層 | 正本 | 検証対 |
|---|---|---|
| L6 | `doctor-result-envelope-measurement.md` | 実測面の pre/post/invariant |
| L7 | `runDoctorMeasured` と envelope writer | `U-DOCTORENV-012..016` |
| L8 | CLI `doctor --result-file` 配線 | `U-DOCTORENV-016` の実発火CLI回帰 |

## 工程

1. [直列] 縮小実行が full を偽申告する既存挙動を Red で固定する。
2. [直列] doctor result と実行 check IDs / resolved profile を同じ measured object で返す。
3. [直列] writer は measured surface だけを直列化し、schema と consumer 照合へ strict telemetry を追加する。
4. [直列] exact-head CI と非author closing review を取得する。

回帰防止として、CLIの `--result-file` 投影式を実プロセスで起動する `U-DOCTORENV-016` を
実装と同じPRに含める。手組み envelope の consumer 判定だけではCLI投影の旧実装復帰を検出できないためである。

## 完了条件

- [x] setup-smoke / named profile / toolchain の envelope が full consumer に拒否される。
- [x] default full 実行だけが実測 check IDs と全 strict options を持つ再利用候補になる。
- [x] 既存 CI の doctor single-run envelope 消費を維持する。
- [x] Linux / Windows / aggregate CI と非author review が揃うまで merge しない。
