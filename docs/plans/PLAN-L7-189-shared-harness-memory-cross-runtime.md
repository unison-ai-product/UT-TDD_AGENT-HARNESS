---
plan_id: PLAN-L7-189-shared-harness-memory-cross-runtime
title: "PLAN-L7-189 (impl): HARNESS 共有 memory を Claude Code と Codex で共通化する"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-29
updated: 2026-07-01
owner: Codex TL / PO
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - ut-tdd memory CRUD + .ut-tdd/memory authored markdown -> harness.db projection + SessionStart surface"
  - role: tl
    slot_label: "TL - canonical=harness.db projection / authored=.ut-tdd/memory / secret 非投影のレビュー"
  - role: qa
    slot_label: "QA - cross-runtime 共有、projection、fail-close の単体検証"
generates:
  - artifact_path: src/memory/index.ts
    artifact_type: source_module
  - artifact_path: src/secret.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-core.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-indexes.ts
    artifact_type: source_module
  - artifact_path: tests/memory.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/handover-mechanism.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
  references:
    - docs/plans/PLAN-L6-06-handover-mechanism.md
    - docs/plans/PLAN-L5-08-harness-db-feedback.md
review_evidence:
  - reviewer: codex
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T18:34:00+09:00"
    tests_green_at: "2026-07-01T18:34:00+09:00"
    verdict: approve
    notes:
      - "Claude/Codex の共有文脈を .ut-tdd/memory authored markdown と harness.db memory_entries projection に分離した。"
      - "SessionStart surface は feedback surface と同じ fail-open/read-only 方針で配線した。"
      - "secret-like payload は write と parse の両方で fail-close する。"
    green_commands:
      - kind: lint
        command: "bunx biome check --write src\\memory\\index.ts src\\secret.ts tests\\memory.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T18:30:16+09:00"
        evidence_path: src/memory/index.ts
        output_digest: "sha256:37d1aa074805b1dda71c31f761759ae5e99784ea4d4e4fb85622cfe68397e5e5"
      - kind: unit_test
        command: "bun run vitest run tests\\memory.test.ts tests\\dependency-drift.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T18:30:18+09:00"
        evidence_path: tests/memory.test.ts
        output_digest: "sha256:883c7b171a76cf86ef01d2f7a91b6245e39a67b43f694bc698aecacb9abfdc16"
      - kind: integration_test
        command: "bun run vitest run tests\\projection-writer.test.ts tests\\db-projection-coverage.test.ts tests\\db-projection-ingestion.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T18:22:58+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:76825939ad6fd3e16a3c4225beada88354d62666a8deade364be07280e0c3320"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T18:30:22+09:00"
        evidence_path: src/schema/harness-db.ts
        output_digest: "sha256:bc3266345c2c1ff13a8e248912bbc4bd86a5bf845c2eda7330e6d65ac3010841"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T18:30:23+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:eccbd8a33367495b48d5c6af7651194e11bd9579a3528a888c1dab912c6981b0"
      - kind: smoke
        command: "bun src\\cli.ts db rebuild"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T18:32:00+09:00"
        evidence_path: docs/design/harness/L4-basic-design/architecture.md
        output_digest: "sha256:33ab09f8da631e3a58ef5fea44cb44d3b27bee5a7f3f4c8c9d418c6c5c6fb7eb"
      - kind: doctor
        command: "bun src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T18:33:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:eccbd8a33367495b48d5c6af7651194e11bd9579a3528a888c1dab912c6981b0"
---

# PLAN-L7-189 (impl): HARNESS 共有 memory

## 0. 背景

Claude Code と Codex の実行中コンテキストは `feedback_events` と SessionStart surface で一部共有できるが、PO 判断、配布先、運用上の好み、過去レビューで確定した注意点のような curated memory は Claude 専用 memory や prose handover に寄りやすかった。

この PLAN では、共有 memory の authored source を `.ut-tdd/memory/*.md`、query/read model を `harness.db.memory_entries` として定義し、Claude Code と Codex の両方が `ut-tdd memory` CLI と SessionStart surface から同じ文脈を読めるようにする。

## 1. Scope

### IN

- `.ut-tdd/memory/*.md` の authored memory 形式。
- `memory_entries` table と `idx_memory_kind_updated` index。
- `ut-tdd memory add/list/recall`。
- `rebuildHarnessDb` での deterministic projection。
- SessionStart での `harness.db memory` surface。
- secret-like payload の fail-close。

### OUT

- 個人 global memory の移行。
- Claude 専用 memory file の自動同期。
- Pack に dogfood の `.ut-tdd/memory` 内容を同梱すること。
- raw transcript / credential / PII の保存。

## 2. 実装

- `src/memory/index.ts` を追加し、write/load/parse/select/render を集約した。
- `src/secret.ts` を追加し、state-db / memory / search / audit が共有する secret-like token detector を下位 module に分離した。
- `src/schema` の registry を schema version 19 に上げ、`memory_entries` table と index を追加した。
- `src/state-db/projection-writer.ts` に `projectMemoryEntries` を追加した。
- `src/cli.ts` に `memory add/list/recall` と SessionStart surface を追加した。
- L5 physical-data、L6 handover-mechanism、L7 unit-test-design へ V-pair の設計追記を行った。
- `tests/memory.test.ts` で authored markdown、secret fail-close、DB projection、surface rendering を検証した。

## 3. 受け入れ結果

- Claude/Codex は同じ `ut-tdd memory` CLI surface で共有 memory を扱える。
- canonical は `harness.db.memory_entries` projection、authored source は `.ut-tdd/memory/*.md` として分離された。
- SessionStart は feedback surface と同じ fail-open 方針で共有 memory を表示する。
- secret-like payload は authored file 作成前、または parse 時に拒否される。

## 4. 残境界

- 実際の Claude memory から `.ut-tdd/memory` への移行は個人 state を触るため別判断。
- Pack には機構を配布し、dogfood の `.ut-tdd/memory` 実データは含めない。
