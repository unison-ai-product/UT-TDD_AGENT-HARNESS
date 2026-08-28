---
plan_id: PLAN-REVERSE-524-pack-consumer-generated-bun-removal-backfill
title: "PLAN-REVERSE-524: 生成成果物 Bun 撤去の backfill"
kind: reverse
layer: cross
drive: agent
route_signal: design_gap
route_mode: reverse
status: draft
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-08-28
updated: 2026-08-28
owner: PM / PO / Claude
github_issue_id: 470
parent_design: docs/plans/PLAN-L7-524-pack-consumer-generated-bun-removal.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
agent_slots:
  - role: qa
    slot_label: "QA - 生成 tree 走査と BAN lint 検出能力を独立変異で再検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-524-pack-consumer-generated-bun-removal-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-524-pack-consumer-generated-bun-removal.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
    - docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
review_evidence: []
---

# PLAN-REVERSE-524

## R0

Forward (`PLAN-L7-524`) の実装 PR と対で R1 へ移り、Red→Green と oracle registry 昇格を束縛する。

R2 では次の変異を一つずつ適用し、対応する oracle だけが Red になることを独立に検証する。

1. `distribution.ts` の `delete scripts.build` を戻すと `U-PACKBUN-004` の (e) 軸だけが Red になる。
2. 生成 template の `#!/usr/bin/env bun` shebang を戻すと (a) 軸だけが Red になる。
3. `common/run-bun.ts` launcher を戻すと (b) 軸だけが Red になる。
4. 生成 consumer CI の `oven-sh/setup-bun@v2` を戻すと (c) 軸だけが Red になる。
5. BAN lint の deny rule / debt allowlist / pin をそれぞれ緩めると、
   `U-PACKBUN-006` の対応サンプルだけが Red になる。

R3 で `PLAN-L7-522` §6 の不変条件 1〜4 との突き合わせを記録し、R4 で Forward へ戻す。
