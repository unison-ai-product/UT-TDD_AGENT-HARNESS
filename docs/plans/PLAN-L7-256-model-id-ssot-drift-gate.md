---
plan_id: PLAN-L7-256-model-id-ssot-drift-gate
title: "PLAN-L7-256 (impl): model ID SSoT drift gate"
kind: impl
layer: L7
drive: agent
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "既存の model routing / setup adapter template 契約の drift 是正。上位要求の意味変更はなく、MODEL_IDS SSoT と runtime asset 境界の機械オラクルを追加する小 slice。"
created: 2026-07-02
updated: 2026-07-09
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - model ID drift boundary review"
  - role: se
    slot_label: "SE - SSoT drift regression and current drift correction"
generates:
  - artifact_path: docs/plans/PLAN-L7-256-model-id-ssot-drift-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/team/model-policy.ts
    artifact_type: source_module
  - artifact_path: src/team/advisor-policy.ts
    artifact_type: source_module
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: src/state-db/token-tracker.ts
    artifact_type: source_module
  - artifact_path: tests/model-id-ssot-drift.test.ts
    artifact_type: test_code
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-model-policy.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-run.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
    - src/team/model-policy.ts
    - src/runtime/agent-guard-policy.ts
    - src/setup/templates.ts
    - src/lint/rule-drift.ts
review_evidence:
  - reviewer: codex
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T19:09:03+09:00"
    tests_green_at: "2026-07-09T19:09:03+09:00"
    verdict: approve
    scope: "MODEL_IDS SSoT drift の現 drift 是正。active .claude/agents frontmatter、docs/templates/adapter disk mirror、BUILTIN_GITHUB_TEMPLATES、team/advisor model routing、token pricing fallback を対象に、旧 model literal へ依存した oracle を MODEL_IDS 参照へ置換。full lint gate 拡張は Deferred に残す。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\model-id-ssot-drift.test.ts tests\\setup.test.ts tests\\team-model-policy.test.ts tests\\team-run.test.ts tests\\task-classify.test.ts tests\\token-tracker.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T19:09:03+09:00"
        evidence_path: tests/model-id-ssot-drift.test.ts
        output_digest: "sha256:deeb257f306463332312514a1d010b0044819a687eeb2686ea34dbd40790424e"
        anchor_commit: 1afa132c9368fc362706db102880e020d7ba3d24
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T19:09:03+09:00"
        evidence_path: src/team/model-policy.ts
        output_digest: "sha256:7dc400d40eebafe4b2dbaf30311193697b76ff1d587ee7aa1fcd980ebc1d7cac"
        anchor_commit: 1afa132c9368fc362706db102880e020d7ba3d24
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T19:09:03+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:8b1cc68d565af29ccecd32e0c9a317de735061cff1133b048d8bdc67f1f6eb12"
        anchor_commit: 1afa132c9368fc362706db102880e020d7ba3d24
---

# PLAN-L7-256: model ID SSoT drift gate

## 背景

A-177 F-5/F-9 で、`MODEL_IDS` を正本としているにもかかわらず、runtime agent frontmatter、setup adapter template、テスト期待値が旧 model ID を個別保持して drift していることが分かった。代表例は次の通り。

- `.claude/agents/pdm-*` が `claude-opus-4-7` のまま、`MODEL_IDS.claude.opus` は `claude-opus-4-8`。
- setup adapter template が `claude-sonnet-4-6` / `claude-haiku-4-5-20251001` / `claude-opus-4-7` を直書き。
- team/model policy tests が旧 Sonnet literal を oracle にしており、SSoT 更新を退行扱いする。

## 今回の切り出し

過剰リファクタリングを避け、今回の slice は **現 drift 是正 + 再発防止 regression** に限定する。

- `src/team/model-policy.ts`: `MODEL_IDS.claude.sonnet` を `claude-sonnet-5` に更新。
- `src/team/advisor-policy.ts`: 旧世代 Sonnet / Haiku current model も family 判定で advisor より下位として扱う。
- `src/state-db/token-tracker.ts`: `claude-sonnet-5` の pricing fallback を追加。
- `src/setup/templates.ts`: Claude/GPT model ID を `MODEL_IDS` 参照に寄せ、adapter docs に model routing defaults を明記。
- `.claude/agents/*.md` と `docs/templates/adapter/**`: 旧 model ID を現 SSoT に同期。
- `tests/model-id-ssot-drift.test.ts`: real repo agent frontmatter と disk template mirror が `MODEL_IDS` / built-in template と drift しないことを固定。
- 既存 team/setup tests の旧 literal oracle を `MODEL_IDS` 参照へ置換。

## Deferred

以下は PLAN-L7-256 の full scope だが、今回の小 slice では未実装として残す。

- ~~`.claude/CLAUDE.md` の allowlist 記載と `SUBAGENT_ALLOWLIST` の機械突合~~ → 2026-07-03 PO 承認で
  doc 5 件 (be-api/be-logic/db-schema/devops-deploy/refactor-scout) を追記し、
  `tests/model-id-ssot-drift.test.ts` U-MODELID-SSOT (d) で fail-close 化 (CI harness-check の
  vitest で発火。`rule-drift` への組み込みは任意の将来改善)。
- `docs/plans/` の数値 prefix 一意性 gate。
- `src/setup/templates.ts` 以外の全 model literal を fail-close する lint rule。

## DoD

- [x] active `.claude/agents/*.md` frontmatter model が `MODEL_IDS.claude` catalog 内だけになる。
- [x] `docs/templates/adapter/**` の disk mirror が `BUILTIN_GITHUB_TEMPLATES` と一致する。
- [x] setup adapter agent templates が `MODEL_IDS.claude` catalog 外の model ID を出さない。
- [x] team/model policy tests が旧 Sonnet literal ではなく `MODEL_IDS` を oracle にする。

## Deferred backlog

- [x] allowlist doc と code allowlist の drift を fail-close で検出する (U-MODELID-SSOT (d)、2026-07-03)。
- PLAN numeric prefix drift を fail-close で検出する。
- `src/setup/templates.ts` 以外の model literal を lint rule で段階的に減らす。
