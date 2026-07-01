---
plan_id: PLAN-L7-194-green-command-digest-hard-gate
title: "PLAN-L7-194 (impl): green-command-digest を advisory → runDoctor.ok の hard gate へ昇格 — L7-132 が「全 fake digest 是正後に昇格」と明記し L7-174 で前提充足済。fake/restamped digest が doctor を fail させる real-repo regression test で実証 (coding≠substance)。A-144/A-145 VER-1 の機械的 fix"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-29
updated: 2026-06-30
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L6-function-design/review-evidence.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE (Codex 委譲) — green-command-digest を runDoctor.ok に算入(advisory note→hard)、fail-close + real-repo regression test(fake digest→doctor fail)"
  - role: qa
    slot_label: "QA (Claude cross-runtime judge) — 全 digest 一致時に doctor green 維持・破綻時のみ fail を実証、prose でなく real-repo regression test で substance 確認"
generates:
  - artifact_path: docs/plans/PLAN-L7-194-green-command-digest-hard-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/audit/A-153-green-command-digest-backlog.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-154-workflow-drive-telemetry-substance-audit.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-132-green-command-digest-integrity.md
    - docs/plans/PLAN-L7-174-green-command-digest-correction.md
  references:
    - .ut-tdd/audit/A-145-03-verification-gate-engine.md
    - .ut-tdd/audit/A-144-03-verification-evidence-integrity.md
review_evidence:
  - reviewer: codex-cli
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Corrected PLAN-L7-194 from normal-doctor hard gate to opt-in strict verification, then closed the stale digest backlog through A-153 rerun-bound correction. Normal doctor remains local-close green; `doctor --strict-green-command-digest` is the strict evidence-integrity gate."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts tests\\cli-surface.test.ts tests\\green-command-digest.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:282deaee2fd3064d743310e503fefbf08c2749d6cd9be8ebc815deed99e3fd31"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:e0d5812770ccc3042a6c484f68dda86f62c63eae3801ff156660065730df97ea"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:88c712454d05fc8ec4a543682eedbc235ef5f08302dd358eff73defd08a27c23"
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "green-command-digest is now included in runDoctor.ok hard-gate aggregation; mismatches force real-repo doctor false until rerun-bound digest evidence is corrected."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test tests\\doctor.test.ts tests\\green-command-digest.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:282deaee2fd3064d743310e503fefbf08c2749d6cd9be8ebc815deed99e3fd31"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:e0d5812770ccc3042a6c484f68dda86f62c63eae3801ff156660065730df97ea"
---

# PLAN-L7-194 (impl): green-command-digest を hard gate へ昇格

## 優先度: version-up parked / 将来版へ保全 (PO 2026-06-29)

PO 決定 (2026-06-29): 配布クローズ優先で将来版へ保全 (`status=draft` + `version_target: future`)。
**ただし前提が既に揃っている**ため、PO 指示で現行クローズへ前倒し可 (gate 1 つを ok に入れるだけ、現状 digest 全一致)。

## 0. 前提 (調査結論 2026-06-29)

- `green-command-digest` は L7-132 で **advisory (非ブロック、`runDoctor.ok` に含めない note 行)** として配線され、
  同 PLAN が「**hard 化は全 fake digest 是正後 (coordinated cleanup) に昇格**」と明記 (L7-132 §昇格条件)。
- L7-174 が fake/stale digest backlog を機械是正済 (evidence_path の実 SHA256 に整合、advisory clean を検証)。
- 現状 doctor は `green-command-digest — OK (全 green_command digest が evidence_path 実 hash と一致)`、
  かつ runDoctor.ok=true (2026-06-29 HEAD 検証済)。**昇格の前提条件は充足、残りは昇格 PLAN のみ未起票**。
- A-145-03 (VER-1) の指摘: digest が advisory のため fake/restamped digest が `review-evidence` +
  `guardrail-invariants` + `oracle-test-trace` を doctor を fail させずに素通りする (commit `8111a92` 型)。

## 1. Scope

### IN (本 PLAN)
- `src/doctor/index.ts` の `green-command-digest` 検査を **`runDoctor.ok` に算入** (advisory note → hard gate、
  fail-close)。
- **real-repo regression test** を追加: 故意に 1 件 digest を restamp/破綻させた状態で doctor が fail する
  ことを実リポで実証 (`coding ≠ substance` の機械的代替 = real-repo regression、prose 主張を禁ずる)。
- 現状 (全 digest 一致) で doctor green が維持されることの確認 test。

### OUT (本 PLAN では作らない)
- digest 計算ロジックの変更 (L7-132 で確定済、sha256(evidence_path) 比較は不変)。
- fake-digest backlog の再是正 (L7-174 で完了済。昇格前に clean を再確認するのみ)。
- いま実装すること (version-up parked。前提充足ゆえ PO 指示で前倒し可)。

## 2. Acceptance Criteria
- fake/restamped digest が `runDoctor.ok=false` を引き起こす **real-repo regression test** green
  (advisory ではなく hard fail)。
- 現状の全 digest 一致状態で doctor green 維持 (昇格が既存 green を壊さない)。
- 昇格後、`review-evidence` / `guardrail-invariants` / `oracle-test-trace` が digest 破綻時に連動して
  doctor を fail させる (VER-1 の素通り経路が閉じる)。
- doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。

## 3. Schedule
- mode: serial。
- Step 0: digest advisory clean を再確認 (L7-174 是正の現状検証、全 digest 一致)。
- Step 1: `src/doctor/index.ts` で digest 検査を `runDoctor.ok` に算入 (fail-close)。
- Step 2: real-repo regression test (restamp→doctor fail) を追加。
- Step 3: 現状 green 維持 test → review (cross-runtime judge) → confirmed。

## 4. 壊さない / 再発させない
- 現状 green を壊さない (全 digest 一致が前提。昇格前に clean を機械確認)。
- prose で「fake を捕まえる」と書かず **real-repo regression test** で実証 ([[feedback_coverage_not_substance]] /
  `coding ≠ substance`)。
- digest 計算ロジックは不変 (L7-132 確定面に触れない)。
- version-up parked。前提充足ゆえ PO 指示で前倒し可。
