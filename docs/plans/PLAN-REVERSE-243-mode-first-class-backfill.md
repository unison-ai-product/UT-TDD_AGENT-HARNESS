---
plan_id: PLAN-REVERSE-243-mode-first-class-backfill
title: "PLAN-REVERSE-243: mode 第一級化 (route_mode 正本) の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
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
    slot_label: "TL - mode 第一級化 back-fill review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-243-mode-first-class-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-243-mode-first-class-db-projection.md
  requires: []
review_evidence:
  - reviewer: ut-tdd-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T21:27:00+09:00"
    tests_green_at: "2026-07-02T21:16:03+09:00"
    verdict: approve
    scope: "PLAN-L7-243 からの L5/L6 設計 back-fill (physical-data route_mode field + function-spec drive-db 契約更新)。mode 第一級化: route_mode frontmatter を宣言正本に採用 (案A 変形、AI 推奨・PO 追認は残タスクとして明示)。plan_registry.route_mode 列 + mode-catalog 導出で drive_runs.mode / skill drive_model を置換、REQUIRED_CURRENT_MODES 5 値を expectedModes 突合 + mode_catalog_unmapped fail-close へ変更。再投影実測 9 mode 分散・refactor/troubleshoot の Forward 誤投影 0。TL が導出優先順位/置換完全性/フォールバック/下流影響/テスト固定を確認し approve。codex provider 不能につき intra_runtime_subagent fallback。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-4-6
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/mode-catalog.test.ts tests/drive-db-registration.test.ts tests/projection-writer.test.ts tests/skill-recommend.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T21:16:03+09:00"
        evidence_path: tests/mode-catalog.test.ts
        output_digest: "sha256:dd3a7a9e3e5d0c4a65cb31c4d55be2391ab1d74d5247e8387359649dc08e29b2"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T21:16:03+09:00"
        evidence_path: src/schema/mode-catalog.ts
        output_digest: "sha256:6eebf2218afee38df1b5c9c8eb1bb849b42bd9aecc8440dad246bc7a82cc2976"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T21:16:03+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:d3fbe43294b7768bf68c29ca7bc4df7ea4386734aabf32beff1f825e89a99504"
---

# PLAN-REVERSE-243: mode 第一級化 (route_mode 正本) の設計 back-fill

## R0 Evidence

PLAN-L7-243 が mode 宣言正本 = `route_mode` frontmatter を採用し、`plan_registry.route_mode`
列 + `src/schema/mode-catalog.ts` 導出 + drive-db-registration のカタログ突合を実装した。
L5 physical-data / L6 function-spec の記述が旧導出 (plan_id prefix 4 分岐、
`REQUIRED_CURRENT_MODES` 5 値) のままの gap を back-fill する。

## R1 Observed Gap

- physical-data.md §2.1 Plan に route_mode field が無かった (drive_runs.mode の導出規則も未記述)。
- function-spec.md D 節の drive-db-registration 契約が `REQUIRED_CURRENT_MODES` ハードコードを
  正本と記述していた。

## R2 Alignment

route certificate lint (PLAN-L7-212/263) の route_mode を mode 宣言正本として再利用する
(新 field なし)。mode doc カタログ (docs/process/modes/) との差分は `mode_catalog_unmapped`
で fail-close。方式の PO 追認は PLAN-L7-243 の PO gate に残置。

## R3 / R4 Outcome

- physical-data.md §2.1 へ `route_mode` field と導出規則 (route_mode → prefix → kind) を追記。
- function-spec.md の drive-db-registration 契約を expectedModes 突合 + `mode_catalog_unmapped`
  fail-close へ更新 (`LEGACY_REQUIRED_MODES` は legacy stats のみ)。
- forward_routing は gap-only (要件レベルの変更なし。既存 route certificate 系の物理設計精緻化)。

## DoD

- [x] L7 実装 (mode-catalog / route_mode 列 / カタログ突合) と L5/L6 設計記述が一致する。
- [x] 旧導出 (prefix 4 分岐 / ハードコード 5 値) の記述が設計正本から除去される。
- [x] 方式決定の PO gate が PLAN-L7-243 に明示されている。
