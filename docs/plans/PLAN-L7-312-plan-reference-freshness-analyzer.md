---
plan_id: PLAN-L7-312-plan-reference-freshness-analyzer
title: "PLAN-L7-312 (refactor): PLAN reference freshness analyzer foundation"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "draft PLAN の stale 行番号参照を検出するための pure analyzer と既存 route_mode_kind_mismatch の誘導文強化であり、公開 CLI contract / doctor hard gate / 上位設計の意味は変更しない。doctor 接続と 32 本 back-fill は別スライスに分離する。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/governance/route-mode-kind-debt-audit-2026-07-02.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - PLAN reference freshness analyzer foundation"
generates:
  - artifact_path: docs/plans/PLAN-L7-312-plan-reference-freshness-analyzer.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint-types.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
  requires: []
  references:
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T11:43:53+09:00"
    tests_green_at: "2026-07-03T11:43:45+09:00"
    verdict: approve
    scope: "route_mode_kind_mismatch detail を debt 台帳と PLAN-L7-263 へ誘導し、draft PLAN の <path>.ts:<line> 参照 freshness を hard gate へ接続しない pure analyzer として追加する。subagent 2 本で doctor hard gate 非接続、Pack 境界、32 本 back-fill 分離を確認済み。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T11:41:17+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:8222027be581c8bb3949ec045a969b882ac70a389f86d44b42944557668781a8"
        anchor_commit: 52aecbe9ea434425b8a02fa4c375dc46347bab18
      - kind: unit_test
        command: "bun run vitest run tests\\plan-lint.test.ts -t \"route_mode_kind|code-line references\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T11:41:17+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:4e98421692ab8912295d4620e3933d1952e92affde89d1824e422c8a7c7950a6"
        anchor_commit: 52aecbe9ea434425b8a02fa4c375dc46347bab18
      - kind: unit_test
        command: "bun run test:pack"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T11:43:45+09:00"
        evidence_path: tests/readability.test.ts
        output_digest: "sha256:ad6468a3bb93493c37fc6fa194e3384b844c131a6b30a62bd9042f7ad8213228"
        anchor_commit: c18872c85c31a3a316cdcc0290cf55348f11b69d
---

# PLAN-L7-312: PLAN reference freshness analyzer foundation

## 背景

route_mode / kind debt は PLAN-L7-263 で fail-close されたが、失敗時の detail は「なぜ・どこを見て直すか」への誘導が弱かった。
また draft PLAN に残る `file.ts:NNN` 形式の行番号参照は、リファクタリング進行で stale 化しやすい。

## 変更

- `route_mode_kind_mismatch` detail に `docs/governance/route-mode-kind-debt-audit-2026-07-02.md` と `PLAN-L7-263` への誘導を追加する。
- `analyzePlanReferenceFreshness()` を `src/plan/lint.ts` に追加し、draft PLAN の missing path / out-of-range line を finding として返す。
- analyzer は pure function のままにし、`doctor` / governance hard gate へは接続しない。

## 非対象

- debt 32 本への references back-fill。
- `doctor` への advisory 表示接続。
- confirmed/completed PLAN の歴史的行番号引用の判定。

## 検証

- `bun run typecheck`
- `bun run vitest run tests\\plan-lint.test.ts -t "route_mode_kind|code-line references" --reporter=dot`
- `rg -n "analyzePlanReferenceFreshness" src tests docs`

## DoD

- [x] route mismatch detail が debt 台帳と PLAN-L7-263 へ誘導する。
- [x] draft PLAN の missing path / line out-of-range を analyzer が finding として返す。
- [x] analyzer が doctor hard gate へ接続されていない。
