---
plan_id: PLAN-L7-263-route-mode-kind-certificate
title: "PLAN-L7-263 (add-impl): route_mode-kind consistency lint + debt 台帳 + 着手時昇格"
kind: add-impl
layer: L7
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - route_mode-kind consistency decision"
  - role: tl
    slot_label: "TL - route certificate lint scope review"
generates:
  - artifact_path: docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    artifact_type: markdown_doc
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint-policy.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint-types.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-212-route-certificate-governance.md
  requires: []
  references:
    - docs/process/modes/add-feature.md
    - src/plan/lint.ts
    - src/lint/backfill-pairing.ts
    - src/schema/route-map.ts
review_evidence:
  - reviewer: ut-tdd-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T19:49:00+09:00"
    tests_green_at: "2026-07-02T19:48:47+09:00"
    verdict: approve
    scope: "route_mode=add-feature の kind を add-design/add-impl に限定する route_mode_kind_mismatch lint。legacy landed 5 本は恒久免除、draft debt 32 本は draft の間のみ免除 (着手時昇格を fail-close)。台帳 doc と allowlist の同期はテスト固定。TL 指摘の route_mode 削除 bypass は同 slice 内で fail-close 化し追認 approve 済み。codex provider は config.toml service_tier 非互換で不能のため intra_runtime_subagent fallback を記録。"
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
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T19:48:47+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:e3603e7eb4eb142cd34c564f1d7721955f0328a637e0732b29484ce3069215f9"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T19:48:47+09:00"
        evidence_path: src/plan/lint-policy.ts
        output_digest: "sha256:c16ea403b4042990e07558d56a6f1ffdc27854acc0b4217cfa7a089a4f8ee786"
  - reviewer: codex-cli
    review_kind: cross_agent
    reviewed_at: "2026-07-02T22:52:00+09:00"
    tests_green_at: "2026-07-02T19:48:47+09:00"
    verdict: approve
    scope: "gpt-5.5 cross-runtime 監査 (PO /goal のモデル配分制約 = 難関レビューを gpt-5.5 で実施)。commit cee1615 の slice (route_mode_kind_mismatch lint + debt 台帳 + 着手時昇格 + bypass fail-close) を desk review し findings なしで approve。台帳と plan file の整合は機械照合 (全 promoted 行 = add-impl + REVERSE pairing、全 open 行 = kind:impl status:draft) PASS。"
    worker_model: claude-fable-5
    reviewer_model: gpt-5.5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/plan-lint.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T19:48:47+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:d40da6715e120d3a2ab1392b9f86396950aaa54c807d2869dc30336d191d89f5"
---

# PLAN-L7-263: route_mode-kind consistency lint

## 状態

2026-07-02 実装着手 (PO /goal 指示)。本 PLAN 自身を kind=add-impl + PLAN-REVERSE-263 pairing の正規形へ昇格した (昇格実例第 1 号)。draft 段階の pairing は REVERSE 側 `dependencies.parent` 参照で成立させる (デッドロック解消 `0d55f5e` により機械的に成立する)。

## 背景

add-feature mode は `add-design` と `add-impl` を内包する運用で、独立した `kind: add-feature` は存在しない。一方で、既存 PLAN の一部に `route_mode: add-feature` と `kind: impl` の組み合わせがあり、add-impl に必要な parent / Reverse back-fill 義務を回避した形になり得る。

この盲点は refactoring-driven model の起票品質に関わる。route certificate lint が `route_signal` と `route_mode` の整合だけを見て、`kind` との整合を見ないためである。

## 根本原因 (2026-07-02 実証): draft add-impl はデッドロックで成立しない

本 PLAN を正規形 (kind=add-impl + PLAN-REVERSE-263 の双方向 requires) で起票試行した結果、現行ルールの衝突を実証した:

- `requires_not_ready` (plan-governance): requires 先は `READY_DEPENDENCY_STATUSES = {confirmed, completed}` のみ — **draft を requires にできない** (`src/plan/lint-policy.ts:21`)。
- `KIND_BACKFILL[add-impl] = required` (backfill-pairing): **draft 段階から** REVERSE plan の requires による参照を要求 (`src/lint/backfill-pairing.ts:8,157`)。

両立する起票が存在しない (REVERSE が draft add-impl を requires すると前者に違反、requires を外すと後者の reverseOrphan)。**37 本が kind=impl に流れた慣行の構造要因はこのデッドロック**であり、個々の起票ミスだけではない。よって本 lint の実装 slice は整合検査の追加と同時に**デッドロック解消**を含める: 案 (a) backfill の pairing 判定に REVERSE plan の `dependencies.parent` 参照を許容 (requires は landed 後に張る)、案 (b) `requires_not_ready` に reverse-pairing エッジの例外を設ける — 選定は TL レビュー + PO 確定。解消後、本 PLAN と既存 debt を add-impl + Reverse pairing へ昇格する (昇格実例第 1 号)。

## 候補スコープ

- `route_mode: add-feature` では `kind` を `add-design` / `add-impl` に限定する。
- 既存 PLAN への一括 hard fail は避け、enforcement date と debt 台帳を分ける。
- debt 台帳の扱いは `PLAN-REVERSE-263-route-mode-kind-backfill.md` で設計 back-fill として検討する。
- draft の add-impl と Reverse pairing が `requires_not_ready` / backfill-pairing でデッドロックしないよう、parent 参照許容または reverse-pairing edge 例外を検討する。
- 実装する場合は `src/plan/lint.ts` と route map 周辺に限定し、GitHub 操作や release 操作へは広げない。

## 実装 (2026-07-02)

- 対応表: `ROUTE_MODE_ALLOWED_KINDS` (`src/plan/lint-policy.ts`)。初期スコープは
  `add-feature -> {add-design, add-impl}` のみ (本 PLAN の候補スコープどおり)。他 mode への拡張は表追加で行う。
  **PO 確定 (2026-07-02): 対応表は当面 add-feature 限定で凍結。全 mode 先回り展開はせず、
  back-fill 義務免除と同種の実害が観測された mode (第一候補: reverse / recovery) から個別に展開する。**
- 検査: `routeModeKindViolations` (`src/plan/lint.ts`)、violation reason `route_mode_kind_mismatch`。
- debt 台帳: `docs/governance/route-mode-kind-debt-audit-2026-07-02.md` (legacy landed 5 + draft debt 32)。
  コード側 allowlist との同期はテストで fail-close。
- 着手時昇格: draft debt は draft の間のみ免除。status が draft 以外へ遷移すると fail。
- デッドロック解消: 案(a) REVERSE `dependencies.parent` 参照による draft 段階 pairing は `0d55f5e` で
  先行着地済み。本 PLAN はその上で昇格実例第 1 号として運用形を確立した。

## 2026-07-09 追補: route_mode-layer band hardening

Vモデル改善 ZIP 精読後の追加実装として、PLAN-L6-38 の `routeModeKindLayer` 契約を
`analyzePlanGovernance` に降ろした。既存の `route_mode -> kind` 判定は維持し、同じ debt
allowlist を使って `route_mode -> layer band` を別 violation reason
`route_mode_kind_layer_mismatch` として surface する。

- `src/plan/lint-policy.ts`: `ROUTE_MODE_LAYER_BANDS` を追加。
- `src/plan/lint-types.ts`: `route_mode_kind_layer_mismatch` を PLAN governance violation reason に追加。
- `src/plan/lint.ts`: `routeModeKindLayerViolations` を追加し、`analyzePlanGovernance` へ配線。
- `tests/plan-lint.test.ts`: `U-PLANGOV-011v4` で `verify` の L7 誤配置と `add-feature` の L2 誤配置を fail-close し、L9 verify 正常系を固定。
- 設計反映: `docs/design/harness/L6-function-design/function-spec.md` と
  `docs/test-design/harness/L7-unit-test-design.md` に、現行実装済み範囲と `promote_by`
  期限 hardening の残 carry を分離して記録。

## DoD

- [x] route_mode-kind の対応表を定義する (add-feature スコープ。全 mode 展開は PO gate として残置)。
- [x] 新規の不整合 PLAN を plan lint で fail させる (`route_mode_kind_mismatch`、regression test 固定)。
- [x] 既存 debt を台帳化し、段階是正 (着手時昇格) として surface する。
- [x] process (docs/process/modes/add-feature.md) へ back-fill する (PLAN-REVERSE-263)。
- [x] route_mode の layer band を PLAN governance lint に追加し、`route_mode_kind_layer_mismatch`
      と `U-PLANGOV-011v4` で Vモデル層の誤配置を fail-close する。
