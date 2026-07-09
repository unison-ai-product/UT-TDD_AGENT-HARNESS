---
plan_id: PLAN-REVERSE-263-route-mode-kind-backfill
title: "PLAN-REVERSE-263: route_mode-kind consistency design back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: be
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - route_mode-kind back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-263-route-mode-kind-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/add-feature.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
  requires:
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
  references:
    - docs/process/modes/add-feature.md
    - docs/design/harness/L6-function-design/function-spec.md
review_evidence:
  - reviewer: ut-tdd-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T19:49:00+09:00"
    tests_green_at: "2026-07-02T19:48:47+09:00"
    verdict: approve
    scope: "PLAN-L7-263 lint 実装からの design back-fill (add-feature mode doc の kind 限定則 + draft parent-pairing 運用 + L6 function-spec 契約行 + debt 台帳)。TL レビューで frontmatter pairing (parent 参照、0d55f5e 意味論) が confirmed 遷移後も green を保つことを確認済み。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-4-6
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/plan-lint.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T19:48:47+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:d40da6715e120d3a2ab1392b9f86396950aaa54c807d2869dc30336d191d89f5"
        anchor_commit: cee1615f89e473c1dbcd3365c1d4d72c50045156
---

# PLAN-REVERSE-263: route_mode-kind consistency design back-fill

## 状態

2026-07-02 R4 完了。`PLAN-L7-263-route-mode-kind-certificate` の lint 実装
(`route_mode_kind_mismatch`) からの back-fill を実行した。forward_routing は gap-only
(起票運用規則の process / L6 契約追補のみで、L1-L5 要件・設計への影響なし)。

## 背景

route certificate lint は `route_signal` から `route_mode` を検査するが、`route_mode` と `kind` の組み合わせまでは検査していない。add-feature route で `kind: impl` を許すと、add-impl の parent / back-fill 義務が弱くなる可能性がある。

## R1-R4 実施内容 (2026-07-02)

- `docs/process/modes/add-feature.md`: 起票時の kind 選択ルール (`route_mode: add-feature` は
  `add-design`/`add-impl` 限定、lint fail-close)、draft 段階の Reverse pairing は REVERSE 側
  `dependencies.parent` 参照で成立 (requires は landed 後)、debt の着手時昇格規律を追記。
- `docs/design/harness/L6-function-design/function-spec.md`: `routeModeKindViolations` の
  入出力契約 (対応表 / legacy landed 恒久免除 / draft debt 着手時昇格) を追記。
- `docs/governance/route-mode-kind-debt-audit-2026-07-02.md`: 既存 debt 37 本 (landed 5 + draft 32) を台帳固定
  (hard fail へ直行させない段階是正)。
- requirements レベルの対応表全 mode 展開は PO gate として PLAN-L7-263 に残置 (本 R4 では
  add-feature スコープのみ確定)。

## DoD

- [x] route_mode-kind の対応表を設計側 (L6 契約) と一致させる。
- [x] L7 実装 PLAN の lint 仕様と上位設計が一致する。
- [x] 既存 debt を hard fail へ直行させず、段階是正 (台帳 + 着手時昇格) として扱う。
