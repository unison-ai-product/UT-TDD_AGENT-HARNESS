---
plan_id: PLAN-L7-68-provider-dispatch-portability
title: "PLAN-L7-68: provider dispatch を維持した Codex worker の限定書込み権限"
kind: troubleshoot
layer: L7
drive: agent
created: 2026-06-16
updated: 2026-10-06
backprop_decision: required
backprop_decision_reason: このrevisionはCodex workerのwrite能力とunknown role
  fail-close制約を追加提案する。対応するReverse pair/ownerを通常の起票経路で成立させ、confirmation前に差分を合流する。
owner: Codex TL
review_evidence: []
agent_slots:
  - role: tl
    slot_label: TL - provider dispatch portability
  - role: aim
    slot_label: incident境界とnon-goalの確認
generates:
  - artifact_path: docs/plans/PLAN-L7-68-provider-dispatch-portability.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-34-tool-adapter-probes.md
  requires:
    - .ut-tdd/audit/A-137-unusable-provider-dispatch-audit.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/design/harness/L6-function-design/handover-mechanism.md
  references:
    - docs/plans/PLAN-REVERSE-68-codex-worker-sandbox-backfill.md
    - docs/test-design/harness/L7-codex-worker-sandbox-test-design.md
pair_artifact: docs/test-design/harness/L7-codex-worker-sandbox-test-design.md
route_signal: incident
route_mode: incident
status: draft
github_issue_id: 676
admission_receipt:
  schema_version: v2
  receipt_id: certificate:df1cf44eb5d161a350417fac49dff8e3
  command_id: plan-revise:issue-676:codex-worker-sandbox:legacy-bootstrap:20261006
  admitted_at: 2026-10-06T05:18:20.218Z
  source_digest: sha256:876ac10a8dfd184256f5a2aaf30520f379b2cbb92b6002dc00a0a1f66b1ba2f8
  decision_digest: sha256:5cd9ce1cf9a70e654b59b032fbaae43c81dea7aea289d851b2247d73a5e291cc
  receipt_digest: sha256:c0ed0c94fbcb9029adad58b61d31296df696218d71ef99ee3f9f31456730be43
  binding:
    path: docs/plans/PLAN-L7-68-provider-dispatch-portability.md
    plan_id: PLAN-L7-68-provider-dispatch-portability
    asset_id: plan:legacy:0d8b50f6f96daa7e97ca0b511fe54720e653b146f3e3ce46d0b1dcb37b51c88b
    revision: 2
    content_digest: sha256:876ac10a8dfd184256f5a2aaf30520f379b2cbb92b6002dc00a0a1f66b1ba2f8
  route:
    signal: incident
    mode: incident
  issue:
    provider: github
    issue_id: 676
    episode_id: incident-676-codex-worker-sandbox-contract-20261006
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-676-release-consumer-dev-start
    revision: 24
    digest: sha256:aad8875239a4b5ea94d844a89553421ca77be2b5fe04bf6d0d933f299fbf1734
  reentry:
    target_plan_id: PLAN-L7-676-release-consumer-dev-start
    target_revision: 24
    phase: forward_merge
  escape_reason: "Issue #676で承認されたCodex
    workerのworkspace-write認可境界を提案する。gate/advisor非writer、unknown role
    fail-close、Claude・custody・routing・SessionStart不変を維持する。"
---
# PLAN-L7-68: provider dispatch portability and Codex worker sandbox boundary

## 0. 目的

既存 provider dispatch を維持し、Issue #676 の承認に基づいてCodex成果物workerのworkspace-write認可境界を追加する。これは新能力のproposalであり、旧confirmed revisionが誤りだったとの訂正ではない。

## 1. 対象範囲

- Codex workspace-write grant候補は se、docs、be-api、be-logic、db-schema、devops-deploy の6 roleのみ。
- gate、advisor、管理・調査およびその他既知roleはnon-writer。aimは認識済みnon-writer、unknown Codex roleはprovider spawn前にfail-close。
- 既存lower-level role policyを再利用し、runtime→team importと新source moduleを禁止する。
- Claude argv/environment、model routing、reviewer custody、stdin、provider resolution、およびSessionStartは変更しない。
- 詳細な候補oracleは docs/test-design/harness/L7-codex-worker-sandbox-test-design.md の独立補足pairに置く。共通L7-unit-test-design.mdは編集しない。

## 2. 受入条件（未達・未実装）

CANDIDATE-U-ADAPTER-SANDBOX-001..006 の全候補を実装・確認するまでは未達とする。候補は正常系、6 roleごとの一度だけの付与、gate/non-writer/aimへのwrite非付与、正規経路とdirect adapter経路双方でunknown role spawn 0、Claude/model-routing/custody不変を含む。OS/providerの実sandbox状態を測ったとの主張はしない。

## 3. Reverse / 上位差分

新しいwrite-capabilityとfail-close制約はReverse pairで既存provider function designへ戻す。PLAN-REVERSE-68-codex-worker-sandbox-backfillがR0..R4を通り、専用L7 pairと上位設計差分がreviewされるまではこの契約をconfirmedにしない。新しいL6 documentは作らない。

## 4. 検証

必要なtest/typecheck/lint/doctor/CIは未実行。本candidateは契約draftであり、実装・test・greenを主張しない。

### 旧 confirmed revision 本文 (歴史記録; 現行経路の検証主張ではない)

以下は旧revisionの記録であり、特にBunコマンド・旧検証手順・confirmedという結論は今回の経路で再実施または再承認していない。新revisionの達成証拠として扱わない。


# PLAN-L7-68: provider dispatch portability and handover split

## 0. Objective

Close A-137 by making provider dispatch actually spawnable, by making runtime availability capability-based, and by separating machine-readable provider handover from explicit human handover.

## 1. Scope

Allowed changes:

- native Claude/Codex binary resolution in the shared runtime adapter;
- Windows `.cmd` / `.bat` invocation handling;
- `team run --execute` routing through the same provider invocation path as single-provider execution;
- provider availability detection through spawnability probes;
- `UT_TDD_CLAUDE_BIN` / `UT_TDD_CODEX_BIN` override names;
- removal of legacy wrapper env coupling from provider execution;
- provider handover `handover_kind: "mechanical"`;
- explicit handover markdown that carries judgement and next actions.

Out of scope:

- changing external provider CLI behavior;
- depending on `helix` commands as UT-TDD product runtime;
- storing secrets or raw provider transcripts in handover files.

## 2. Acceptance Criteria

- `ut-tdd status` reports provider availability only when provider commands are spawnable.
- `ut-tdd codex --execute` can resolve Codex through native auto-discovery or `UT_TDD_CODEX_BIN`.
- `ut-tdd claude --execute` can resolve Claude through native auto-discovery or `UT_TDD_CLAUDE_BIN`.
- `team run --execute` uses the shared provider invocation path.
- Windows command scripts are invoked without Node shell/args deprecation warnings.
- Provider handover packages include `handover_kind: "mechanical"`.
- Explicit handover markdown includes the human-readable state and does not rely on provider JSON for nuanced judgement.
- UT-TDD-owned runtime/test surfaces no longer require legacy HELIX provider override or raw-wrapper env names.

## 3. Verification

Required before closing:

- `bunx vitest run tests/runtime-adapter.test.ts tests/runtime.test.ts`
- `bunx vitest run tests/runtime-hook-entrypoints.test.ts tests/cli-surface.test.ts tests/provider-handover.test.ts`
- `bun run typecheck`
- `bun run lint`
- `bun run src\\cli.ts doctor`
- `rg "HELIX_CODEX_BIN|HELIX_CLAUDE_BIN|HELIX_ALLOW_RAW" src tests docs/handover .ut-tdd/handover --glob "!vendor/**"`

## 4. Current Status

Implementation is confirmed for the PLAN-L7-68 slice after targeted tests, typecheck, lint, and doctor cleanup. PLAN-L7-69 remains a separate draft ticket for expanded encoding-corruption automation.


### 旧 confirmed revision の所有・review 履歴

旧revisionが次の成果物をgeneratesとして宣言した履歴を保持する。このdraftがそれらを再生成する、または過去所有を黙って撤回する意味ではない。confirmation/implementation transitionで所有宣言を再評価する。

- src/runtime/adapter.ts (source_module)
- src/runtime/detect.ts (source_module)
- src/cli.ts (source_module)
- src/runtime/provider-handover.ts (source_module)
- tests/runtime-adapter.test.ts (test_code)
- tests/runtime.test.ts (test_code)
- tests/runtime-hook-entrypoints.test.ts (test_code)
- tests/cli-surface.test.ts (test_code)
- tests/provider-handover.test.ts (test_code)
- docs/handover/handover-mechanical-explicit.md (markdown_doc)
- .ut-tdd/audit/A-137-unusable-provider-dispatch-audit.md (markdown_doc)

旧revisionのreview evidenceはそのrevisionの履歴であり、本draftのreviewではない:

- {"reviewer":"codex-self-review","review_kind":"intra_runtime_subagent","reviewed_at":"2026-06-16","tests_green_at":"2026-06-16","verdict":"pass","scope":"Provider dispatch portability, capability-based runtime detection, handover mechanical/explicit split, and HELIX runtime-env separation. Critical 0 / High 0 in self-review; full regression evidence is recorded in session output.","worker_model":"codex-gpt-5","reviewer_model":"codex-gpt-5-intra-runtime-review"}

旧pair_artifactは docs/test-design/harness/L7-unit-test-design.md。現在は共有pairの編集を避け、独立補足pairを提案する。
