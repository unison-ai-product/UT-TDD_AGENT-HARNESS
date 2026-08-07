---
plan_id: PLAN-L7-482-oracle-provenance-uniqueness
title: "PLAN-L7-482 (impl): oracle 宣言 provenance uniqueness の実装済み slice"
kind: impl
layer: L7
sub_doc: function-spec
drive: be
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-07
updated: 2026-08-07
owner: PM / TL
parent_design: docs/test-design/harness/L8-integration-test-design.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - oracle 宣言 site の provenance-aware uniqueness を実装する"
  - role: qa
    slot_label: "QA - mirror / collision / stale baseline の regression を検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-482-oracle-provenance-uniqueness.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/oracle-id-duplicate-baseline.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-244-right-arm-citation-gate.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-244-right-arm-citation-gate.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/206
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/290
github_issue_id: 206
backprop_decision: not_required
backprop_decision_reason: "既存 PLAN-L7-244 の citation gate に対する内部検出強化であり、L0-L6 要件・設計・外部仕様を変更しない。上流への逆伝播は不要。"
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-07T11:37:53Z"
    tests_green_at: "2026-08-07T11:18:48Z"
    verdict: approve
    scope: >-
      PR #290 の非author blind closing review。exact HEAD c7695a6b に対して、同一 ID・別説明の
      新規衝突を検出すること、構造的 mirror だけを抑制すること、既知衝突 U-PHOVER-002 /
      IT-MODULE-01 の provenance baseline と stale 検出、既存 collectOracleIds 契約、25 件の
      regression test、Linux/Windows/aggregate CI (run 31172768913) を確認した。PR merge 後に
      親 PLAN が draft のまま成果物を所有していたため、本 PLAN はその実装済み slice の ownership
      を正規化する事後修正であり、親 PLAN 全体の完了を宣言しない。
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    citations:
      - "PR #290 comment 5216555327 (PASS-WEAK; exact HEAD c7695a6b)"
      - "GitHub Actions run 31172768913 (Linux/Windows/aggregate success)"
      - "commit 3e7082aa (detector correction)"
      - "commit c7695a6b (HARNESS review evidence)"
    green_commands:
      - kind: unit_test
        command: "GitHub Actions run 31172768913 (harness-check-linux/windows/aggregate)"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-08-07T11:18:48Z"
        evidence_path: tests/oracle-test-trace.test.ts
        output_digest: "sha256:0ab02fe8117a7ec0d9359944d8584f846cdc29a7f42f436085b9d7d9e2bba26b"
        anchor_commit: c7695a6b98c2969d7d9254f386f482b7d8cbb513
---

# PLAN-L7-482: oracle 宣言 provenance uniqueness

## 位置づけ

本 PLAN は Issue #206 のうち、PR #290 (`db756e21`) で main に着地した実装済み slice を
正規の PLAN ownership として固定する。親の `PLAN-L7-244-right-arm-citation-gate` は defer
規格化・IT-CONTRACT disposition など未完了スコープを持つため draft のまま維持し、本 PLAN の
confirmed を親 PLAN 全体の完了とは解釈しない。

## 対象と所有

- `src/lint/oracle-id-duplicate-baseline.ts` を本 PLAN が一意に所有する。
- `src/lint/oracle-test-trace.ts` と `tests/oracle-test-trace.test.ts` は既存の
  `PLAN-REVERSE-41-substance-lints` が所有するため、重複 ownership を作らない。
- 同一 oracle ID の別説明再利用を provenance (path / line / description / ID cell) で検出し、
  構造契約された candidate/confirmed と Resource Kernel overview/freeze の mirror のみを抑制する。
- 既知の `U-PHOVER-002` / `IT-MODULE-01` は provenance 付き ratchet baseline とし、stale と新規衝突を
  fail-close する。#259 の cited-but-not-declared 逆向き検査は対象外とする。

## 検証対

PR #290 で Red test → detector → doctor/CI wiring → exact-head CI → 非author closing review の
順序を実施済み。exact HEAD は `c7695a6b98c2969d7d9254f386f482b7d8cbb513`、GitHub Actions
run `31172768913` は Linux / Windows / aggregate が成功、Claude の nonauthor verdict は
`PASS-WEAK` (merge 可) である。残存所見 (mirror 内側の追加意味再利用、site 無し declared ID、
同一説明コピペ再採番) は PR #290 の scope/DoD に記載された非 blocking 範囲であり、本 ownership
修正で意味を拡張しない。

なお PR #290 の commit/session 証跡には author の実モデル ID が保存されていないため、frontmatter
の `worker_model: gpt-5.6-luna` は当時の Codex 実装レーン routing 既定を示す記録であり、未確認の
実呼出しを断定するものではない。

## DoD

- [x] Issue #206 の provenance-aware uniqueness 実装を main に merge 済み成果物として一意に所有する。
- [x] 構造的 mirror 以外の同一 ID・別説明を検出し、既知衝突 baseline と stale を ratchet する。
- [x] `collectOracleIds` の Set/配列契約と既存の正当な再引用を維持する。
- [x] exact-head CI と非author closing review の証跡を frontmatter に固定する。

## Exit

本 PLAN の生成物は main に存在し、review evidence と exact-head CI の証跡が揃っている。
親 PLAN-L7-244 の未完了スコープは本 PLAN の exit に影響せず、別 slice として継続する。
