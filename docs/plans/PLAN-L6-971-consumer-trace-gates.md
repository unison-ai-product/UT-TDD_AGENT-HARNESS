---
plan_id: PLAN-L6-971-consumer-trace-gates
title: "PLAN-L6-971 (add-design): consumer で動く G1 / G3 trace の契約"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-14
updated: 2026-10-14
owner: Claude (契約PR) / Codex (契約レビュー) / control (割当)
parent_design: docs/design/harness/L6-function-design/function-spec.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: TL - harness / consumer の分岐規則、同じ gate 名の 2 つの意味、空集合の扱いを freeze する
  - role: se
    slot_label: SE - 表の固定と ID 抽出、注入可能な reader、出力の形を定義する
  - role: qa
    slot_label: QA - consumer 分岐で harness 専用文書を読まないこと、表と参照の負例を反証可能にする
origin:
  plan_id: PLAN-L6-01-function-spec
  revision: 3
  digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
reentry:
  target_plan_id: PLAN-L6-01-function-spec
  target_revision: 3
  phase: forward_merge
escape_reason: "Issue #971 / #972 / #880: freeze the consumer branch of G1-trace
  and G3-trace as an add-feature design increment."
generates:
  - artifact_path: docs/plans/PLAN-L6-971-consumer-trace-gates.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/design/harness/L6-function-design/function-spec.md
  requires: []
  blocks: []
  references:
    - docs/design/harness/L6-function-design/consumer-trace-gates.md
    - docs/test-design/harness/L7-consumer-trace-gates-test-design.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/lint/g1-trace.ts
    - src/lint/g3-trace.ts
    - src/plan/lint.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/971
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/972
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/880
status: draft
sub_doc: function-spec
github_issue_id: 971
admission_receipt:
  schema_version: v2
  receipt_id: certificate:001ff66ae3b64ea010094219d033d04d
  command_id: plan-draft:issue-971:PLAN-L6-971:r1-20261014
  admitted_at: 2026-10-14T02:48:00.125Z
  source_digest: sha256:e9cb7fedac015792fcdcbc1d65a55224d4136d74038f808b269891be186fb4cf
  decision_digest: sha256:38de0a60e961675ccc400d6cfcad5113f3ceff1c8693032896680597bc04028a
  receipt_digest: sha256:eae01ce3d3978e73286c548486acf600ec0c2b243f682594142cab44983f453a
  binding:
    path: docs/plans/PLAN-L6-971-consumer-trace-gates.md
    plan_id: PLAN-L6-971-consumer-trace-gates
    asset_id: plan:001ff66ae3b64ea010094219d033d04d
    revision: 1
    content_digest: sha256:e9cb7fedac015792fcdcbc1d65a55224d4136d74038f808b269891be186fb4cf
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 971
    episode_id: issue-971
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-01-function-spec
    revision: 3
    digest: sha256:5fe765b966ef316728549d73c69c99569c54c8aedfeebaa68dba83f1f32ed479
  reentry:
    target_plan_id: PLAN-L6-01-function-spec
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #971 / #972 / #880: freeze the consumer branch of G1-trace
    and G3-trace as an add-feature design increment."
---

# PLAN-L6-971 (add-design): consumer で動く G1 / G3 trace の契約

## 上流の設計 revision digest

- `docs/design/harness/L6-function-design/consumer-trace-gates.md@a7024bd844db67f1c75a6304c8be3d5c677f24f7` sha256:046af797d0041665a28d2bbff33fa6c6f8c36d2ad8fca17d554c7ee17ae6b6eb
- `docs/test-design/harness/L7-consumer-trace-gates-test-design.md@a7024bd844db67f1c75a6304c8be3d5c677f24f7` sha256:23912fde8b26113c28cc86bd36bedab9cfaed6c96189f55f988e25f33838f780
- `docs/design/harness/L6-function-design/function-spec.md@a7024bd844db67f1c75a6304c8be3d5c677f24f7` sha256:6735d00e9ce5548bfa8e7af0ea42cb51e3c55d2b969db082e108fb27ae3fcbb8

## 引き渡し物

- `docs/design/harness/L6-function-design/consumer-trace-gates.md` (本 PLAN で凍結する設計文書)
- `docs/test-design/harness/L7-consumer-trace-gates-test-design.md` (対になるテスト設計)
- `docs/test-design/harness/L7-unit-test-design.md` の索引節 (consumer trace gate)

## 検証の対

- 設計 ↔ テスト設計: 上記の設計文書と専用テスト設計の対 (gate / テストレベル / 検証手法はテスト設計側に書く)

## 完了条件

- [ ] 引き渡し物が上流 digest の revision と整合し、非著者 family の review が PASS
- [ ] `ut-tdd plan lint` exit 0
