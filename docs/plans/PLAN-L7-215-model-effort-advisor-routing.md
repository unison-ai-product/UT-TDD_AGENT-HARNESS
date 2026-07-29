---
plan_id: PLAN-L7-215-model-effort-advisor-routing
title: "PLAN-L7-215 (impl): model/effort routing defaults and upper-model advisor command"
kind: impl
layer: L7
drive: agent
status: confirmed
created: 2026-07-01
updated: 2026-07-29
owner: Codex
route_signal: feature_addition
route_mode: add-feature
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - model/effort routing and advisor CLI implementation"
  - role: qa
    slot_label: "Codex intra-runtime review - adapter surface and CLI regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-215-model-effort-advisor-routing.md
    artifact_type: markdown_doc
  - artifact_path: AGENTS.md
    artifact_type: markdown_doc
  - artifact_path: CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/schema/team.ts
    artifact_type: source_module
  - artifact_path: src/team/advisor-policy.ts
    artifact_type: source_module
  - artifact_path: src/team/launch-policy.ts
    artifact_type: source_module
  - artifact_path: src/team/model-policy.ts
    artifact_type: source_module
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-launch-policy.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-model-policy.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-75-cost-tiered-provider-router.md
    - docs/plans/PLAN-L7-195-model-override-injection-hardening.md
  references:
    - docs/design/harness/L6-function-design/function-spec.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T17:07:00+09:00"
    tests_green_at: "2026-07-01T17:06:00+09:00"
    verdict: approve
    scope: "Model/effort defaults and advisor command: task intent routing, xhigh/high effort policy, upper-model advisor dry-run/execute CLI, and Pack rule documentation."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T17:02:00+09:00"
        evidence_path: src/team/advisor-policy.ts
        output_digest: "sha256:6fdae49f1f46109de6ac8415f93e011f7f64f329218eb2c07767de6f99b99d8b"
        anchor_commit: adeefa7249deedc6f9029fe866cfe7a67904ccc2
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T17:00:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:4e1c724cd4cd04d3f9ad5efacfe4b7f12ad8a480448127d5ed9b2e7e0e5ddfc2"
        anchor_commit: 5b819e80d5e1f34136847bebbb836477d8c5a6a4
      - kind: unit_test
        command: "bun run vitest run tests\\team-model-policy.test.ts tests\\team-launch-policy.test.ts tests\\team-run.test.ts tests\\team-schema.test.ts tests\\runtime-adapter.test.ts tests\\model-id-ssot.test.ts tests\\cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T17:01:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:c6aa218270dcf1a164768508e4bce5818cef05b59fa102a3846a08492e83de55"
        anchor_commit: 47355c568e05e8f9759bbdca05e1b42618143b1a
      - kind: unit_test
        command: "bun run vitest run tests\\team-model-policy.test.ts tests\\team-launch-policy.test.ts tests\\team-run.test.ts tests\\team-schema.test.ts tests\\runtime-adapter.test.ts tests\\model-id-ssot.test.ts tests\\cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T17:01:00+09:00"
        evidence_path: tests/team-model-policy.test.ts
        output_digest: "sha256:71ad4b26d6540a5bf0a0213d01655dd71ef4352b4ba4c9e6dd5da28b50ad2a6d"
        anchor_commit: adeefa7249deedc6f9029fe866cfe7a67904ccc2
      - kind: unit_test
        command: "bun run vitest run tests\\team-model-policy.test.ts tests\\team-launch-policy.test.ts tests\\team-run.test.ts tests\\team-schema.test.ts tests\\runtime-adapter.test.ts tests\\model-id-ssot.test.ts tests\\cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T17:01:00+09:00"
        evidence_path: tests/team-launch-policy.test.ts
        output_digest: "sha256:e8d3aa782e4e31e9cbd5e2c9f9552a4b732c286f7f6618291304f28578dd3351"
        anchor_commit: a266aad1ab1a7f60fe3f759b30fa4c755a227408
---

# PLAN-L7-215 model / effort / advisor routing

## 2026-07-02 Provider boundary addendum

Pack review の P1/P2 指摘を受け、team schema / model policy が扱う UT-TDD 内部 effort 値と provider CLI が受け取る値を分離する。

- UT-TDD schema は `low` / `medium` / `middle` / `high` / `xhigh` を受け付ける。
- Claude provider 実行境界では `middle` を `medium`、`xhigh` を `high` に正規化し、`--effort` と `CLAUDE_CODE_EFFORT_LEVEL` へ provider-safe な値だけを渡す。
- Codex provider では reasoning effort は launch/evidence metadata として保持し、provider CLI の未確定 effort flag へ raw に転送しない。
- README の provider 起動例は実装契約に合わせ、Codex は `codex exec -`、Claude は `claude --print --input-format text`、タスク本文は stdin と明記する。

## 1. Scope

- docs / research / implementation / lightweight / review / UI/UX の task intent を `selectTeamModel` に追加する。
- Claude 系 effort は `high`、GPT/Codex 系 effort は `middle` を標準にし、軽量 lane は `high`、UI/UX は `xhigh`、高度な review は `high` / `xhigh` へ上げる。
- Sonnet-class Claude または下位 GPT/Codex orchestrator が判断に迷う場合に、Claude Opus または GPT frontier へ相談する `ut-tdd advisor` command を追加する。
- AGENTS / CLAUDE / L6 function spec に Pack 運用ルールとして反映する。

## 2. Acceptance Criteria

- `ut-tdd advisor --json` が upper-model adapter plan を dry-run 出力できる。
- `ut-tdd advisor --execute --json` が既存 adapter と同じ session logging 経路で fake provider を起動できる。
- team model policy は intent と effort 既定を deterministic に返す。
- typecheck / lint / targeted Vitest / DB rebuild が green。

## 3. Evidence

- `bun run typecheck` -> pass。
- `bun run lint` -> pass。
- `bun run vitest run tests\team-model-policy.test.ts tests\team-launch-policy.test.ts tests\team-run.test.ts tests\team-schema.test.ts tests\runtime-adapter.test.ts tests\model-id-ssot.test.ts tests\cli-surface.test.ts --reporter=dot` -> 7 files / 89 tests passed。
- `bun src\cli.ts db rebuild --json` -> `ok=true`。

## 2026-07-29 advisor ルーティング行列改定 (PO ルール、2026-07-14 行列を supersede)

### 設計判断

**前提**: 旧行列は `design` を「技術系判断」に束ねて Sol 一次にしていた。PO 判断
(2026-07-29) は、技術 (どう作るか) と設計・進行 (何をどの順で作るか) を別軸として
分ける。実例として、2026-07-29 のレーン選択相談は `--decision design` で Sol へ
流れたが、これは本来 Fable が受けるべき進行判断だった。

| 判断種別 | 一次 | fallback |
|---|---|---|
| `implementation` / `troubleshooting` (技術) | `gpt-5.6-sol` | `claude-fable-5` |
| `design` / `progress` / `uiux` (設計・進行・デザイン) | `claude-fable-5` | `gpt-5.6-sol` |

採択した方式:

1. `design` の一次を Sol から Fable へ移す。
2. 進行判断の種別 `progress` を新設する (レーン選択・優先順位・着手順・段取り)。
   推論は進行語を technical 語より先に評価する。「CI が fail している PR を先に
   見るか」は `fail` を含むが判断そのものは進行であり、`troubleshooting` へ
   流してはならない (U-ROUTE2-012)。
3. CLI の `--decision` 受理集合を `ADVISOR_DECISION_KINDS` (SSoT) に一致させる。
   旧実装は `design|implementation` をハードコードしており、既存の `uiux` /
   `troubleshooting` が CLI から指定できない drift になっていた。
4. 進行判断の推論は `着手` / `進行` の単独部分一致を使わず、優先順位・着手順・
   `which ... first` など順序判断を表す強いパターンに限定する。実装が「進行中」に
   crash しただけの相談は `troubleshooting` とする。
5. `--provider` は `hybrid` で明示した単一 provider へ固定する override とし、
   cross-provider fallback を構成しない。`claude-only` で Codex、`codex-only` で
   Claude を強制する矛盾は黙って無視せず fail-close する。

不採択と理由:

- **`design` を Sol に残し `progress` だけ Fable にする**: PO 指示が「設計/進行の
  判断は Fable」であり、設計を技術側に残すと指示と実装が食い違う。
- **`adversarial` を Codex 経路限定のまま据え置く**: `design` を Fable へ移すと、
  opus orchestrator に対する敵対検証が黙って消える。敵対検証の判定軸は相談先の
  provider ではなく orchestrator の tier なので、Fable 一次でも `adversarial` に
  切り替える (U-ROUTE2-014 で固定)。

### Evidence

- `bun run test:vitest-snapshot tests/team-model-policy.test.ts` -> 38 passed / 38。
  新規 oracle: U-ROUTE2-011 (進行判断の推論 → Fable 一次)、U-ROUTE2-012 (technical
  語を含む進行判断の寄せ先)、U-ROUTE2-013 (技術判断は Sol 一次のまま)、
  U-ROUTE2-014 (opus 相手は provider 非依存で敵対検証)。
- `bun run typecheck` -> pass。
- `bunx biome check src tests --diagnostic-level=error` -> 0 error。
