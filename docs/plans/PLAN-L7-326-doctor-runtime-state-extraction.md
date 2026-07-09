---
plan_id: PLAN-L7-326-doctor-runtime-state-extraction
title: "PLAN-L7-326 (refactor): doctor runtime-state extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "doctor の単一巨大 entry から handover / agent-slots の runtime-state surface を分離する局所リファクタリングであり、要求・受入条件の意味変更を伴わない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-325-doctor-lint-gate-extraction.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor runtime-state extraction"
generates:
  - artifact_path: docs/plans/PLAN-L7-326-doctor-runtime-state-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/runtime-state.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-325-doctor-lint-gate-extraction.md
  requires: []
  references:
    - src/doctor/index.ts
    - tests/doctor.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T14:03:00+09:00"
    tests_green_at: "2026-07-03T14:02:00+09:00"
    verdict: approve
    scope: "doctor runtime-state surface の抽出境界、public re-export、handover outstanding anchor の index 側維持、循環 import 回避を確認。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T13:50:00+09:00"
        evidence_path: src/doctor/runtime-state.ts
        output_digest: "sha256:c2c533e14373dfebbe924163045bdf6fbb51719d9eb46f38cb132ea01eb3b49f"
        anchor_commit: 4d11f58e16139827b2d7b312449513810a7467a8
      - kind: lint
        command: "bunx biome check src\\doctor\\index.ts src\\doctor\\runtime-state.ts tests\\doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T14:01:00+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:cc98b627d2d15a7bba15efb9484e853080f83af73449fabd1e0939aa1fa09aa1"
        anchor_commit: 4d11f58e16139827b2d7b312449513810a7467a8
      - kind: smoke
        command: "bun -e \"import { checkAgentSlots, checkHandover, checkHandoverDisciplineMessages, nodeDoctorDeps } from './src/doctor/index.ts'; console.log([checkAgentSlots, checkHandover, checkHandoverDisciplineMessages, nodeDoctorDeps].map((f) => typeof f).join(','))\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T14:01:00+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:cc98b627d2d15a7bba15efb9484e853080f83af73449fabd1e0939aa1fa09aa1"
        anchor_commit: 4d11f58e16139827b2d7b312449513810a7467a8
      - kind: smoke
        command: "bun -e \"import { checkAgentSlots, checkHandover, checkHandoverDisciplineMessages } from './src/doctor/index.ts'; const deps = { repoRoot: '/repo', now: '2026-07-03T00:00:00.000Z', readText: () => null, listDir: () => [] }; console.log(checkHandover(deps)); console.log(checkHandoverDisciplineMessages(deps).length >= 0); console.log(checkAgentSlots({ repoRoot: '/repo', now: () => deps.now, readText: () => null, writeText: () => {}, newId: () => 'x' }));\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T14:02:00+09:00"
        evidence_path: src/doctor/runtime-state.ts
        output_digest: "sha256:c2c533e14373dfebbe924163045bdf6fbb51719d9eb46f38cb132ea01eb3b49f"
        anchor_commit: 4d11f58e16139827b2d7b312449513810a7467a8
---

# PLAN-L7-326: doctor runtime-state extraction

## 背景

`src/doctor/index.ts` は doctor の実行集約に加えて、handover pointer / handover discipline / agent-slots warning surface の runtime-state 実装も保持していた。PLAN-L7-325 で lint gate adapter を分離した後も、doctor 本体に runtime-state I/O 依存が残っており、今後の doctor 分割で見通しが悪くなる。

## 変更

- `src/doctor/runtime-state.ts` を追加し、`DoctorDeps`、`handoverDeps`、`checkHandoverDisciplineMessages`、`checkHandover`、`checkAgentSlots`、`doctorSlotsDeps`、`nodeDoctorDeps` を移動する。
- `src/doctor/index.ts` は doctor の実行集約、hard gate aggregation、`checkHandoverOutstandingAnchor(handoverDeps(deps))` の呼び出しを維持し、新 module から import / re-export する。
- `tests/doctor.test.ts` に public re-export の維持を確認する regression を追加する。

## 非対象

- doctor message の意味変更。
- handover / agent-slots の warning / hard gate 境界変更。
- `checkHandoverOutstandingAnchor` の移動。

## 検証

- `bun run typecheck`
- `bunx biome check src\\doctor\\index.ts src\\doctor\\runtime-state.ts tests\\doctor.test.ts`
- `bun -e` による public re-export smoke。
- `bun -e` による `checkHandover` / `checkHandoverDisciplineMessages` / `checkAgentSlots` の直接呼び出し smoke。

補足: `bun run vitest run tests\\doctor.test.ts -t "runtime-state re-exports|checkHandover|checkAgentSlots" --reporter=dot` と `bun test tests\\doctor.test.ts -t "runtime-state re-exports"` は、この session では runner が無出力で停止したため green evidence には採用しない。対象 surface は上記 smoke と typecheck / Biome で確認した。

## DoD

- [x] runtime-state surface が `src/doctor/runtime-state.ts` に分離されている。
- [x] `src/doctor/index.ts` の public re-export が維持されている。
- [x] handover outstanding anchor の doctor 側 hard gate 呼び出しが維持されている。
- [x] Source の静的検証と smoke が green である。
