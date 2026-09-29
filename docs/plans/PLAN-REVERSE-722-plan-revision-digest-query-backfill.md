---
plan_id: PLAN-REVERSE-722-plan-revision-digest-query-backfill
title: "PLAN-REVERSE-722: PLAN revision digest query 契約の逆向き確認"
kind: reverse
layer: cross
drive: db
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-29
updated: 2026-09-29
owner: Claude control lane (契約 draft) · Codex worker (implementation)
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: PLAN-L6-71 の ledger 正本・revision identity・digest
  検証の意味は変えず、 既存検証を読取専用の境界から呼ぶ公開 query を L7 で追加するだけのため。state-db の path 不変条件
  (`.ut-tdd/` 配下限定) は read-only opener でも維持する。L6-71 に read 経路の記述が無いことは R4 で gap
  として routing する。
parent_design: docs/plans/PLAN-L7-722-plan-revision-digest-query.md
agent_slots:
  - role: tl
    slot_label: Claude Opus / Codex Sol - L6-71 と L7-722 の境界 (単一正本・検証の再利用・書込みゼロ) を逆向き検証する
  - role: qa
    slot_label: Codex Terra - CANDIDATE-U-PRDQ-001..007 を独立照合し、latest
      代用・検証複製・sidecar 生成・immutable 誤読を攻撃する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-722-plan-revision-digest-query-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-722-plan-revision-digest-query.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
    - docs/test-design/harness/L7-plan-revision-digest-query-test-design.md
    - docs/plans/PLAN-L7-690-issue-binding-projection-state-contract.md
    - src/plan-asset/ledger/schema.ts
    - src/state-db/index.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/722
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/692
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 722
admission_receipt:
  schema_version: v2
  receipt_id: certificate:33607416b53a67051b1d75d8635b3c0e
  command_id: plan-revise:issue-722:drive-parent-align:reverse:r2:c43caf233a1c
  admitted_at: 2026-09-29T08:46:52.728Z
  source_digest: sha256:f14b6956a8da5f5d490d77e2f3c7ab0c31d8875c06aea51d4d31271a297cacd8
  decision_digest: sha256:4ec360bb4837e820fc0e78dde25e1958dd81875d55734571fda0e5d00815c986
  receipt_digest: sha256:076afcaa9bc57ea11d38202328626eb201d4f221869b9da88c9afc36e0ee9258
  binding:
    path: docs/plans/PLAN-REVERSE-722-plan-revision-digest-query-backfill.md
    plan_id: PLAN-REVERSE-722-plan-revision-digest-query-backfill
    asset_id: plan:b235c569fdf230ce852a5f1914689142
    revision: 2
    content_digest: sha256:f14b6956a8da5f5d490d77e2f3c7ab0c31d8875c06aea51d4d31271a297cacd8
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 722
    episode_id: E4-722-plan-revision-digest-query
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-71-plan-asset-canonical-migration-contracts
    revision: 1
    digest: sha256:00273e7d75e01b678fc97b0602542b6163c68be48026cfa5480a7a736016f3e0
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-722-plan-revision-digest-query
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #722: 親 PLAN-L7-722 rev 2 の drive (db) と一致させる。本文・R0 の内容は不変。"
---

# PLAN-REVERSE-722: PLAN revision digest query の逆向き確認

## R0 対象

PLAN-L7-722 が追加する公開 query (`readPlanRevisionCanonicalPayloadDigest`) と read-only open 境界が、
上位契約 PLAN-L6-71 と state-db の不変条件に矛盾しないことを確認する。

## R1 観測 (現行 source)

- `schemaMatches` / `ledgerRowsValid` は private で、migration 経路だけから呼ばれる (`src/plan-asset/ledger/schema.ts:1131-1207`)。
- `openHarnessDb` は `ensureDir` と書込み可能 open を行う (`src/state-db/index.ts:99-103`)。read-only としては流用できない。
- `assertAdoptedBase` は latest revision の preflight だけを行う (`src/plan-admission/node-plan-revision-runner.ts:489`)。
- plan ledger は rollback journal で運用され、WAL を設定する経路が plan-asset / state-db に無い (`git grep -n journal_mode origin/main -- src`)。

## R2 照合

| 上位の観点 | L7-722 の扱い | 判定 |
|---|---|---|
| ledger 単一正本 (L6-71) | ledger の検証済み row だけを返し、別正本を作らない | 整合 |
| revision identity | exact alias / assetId / revision。latest 代用を禁止 | 整合 |
| digest 検証 | 既存 `ledgerRowsValid` の canonical payload 再 hash を再利用する | 整合 (複製禁止を AC4 で担保) |
| state-db path 不変条件 | read-only opener も `assertWithinUtTdd` を通す | 整合 |
| 書込み経路 | migration / rehydration / repair を呼ばない。ro 接続で SQLite が write を拒否する | 整合 |

## R3 gap

- G1: L6-71 に「保存済み revision の外部読出し経路」の記述が無い。意味変更は無いため文言追補の要否を R4 で判断する。
- G2: ledger の journal mode (rollback) が文書化された不変条件になっていない。L7-722 は WAL を deny することでこの前提に依存する。
  上位へ「plan ledger は rollback journal」を明記するかを R4 で routing する。

## R4 routing

G1 / G2 は gap-only とし、L6-71 の confirmed 意味を変えない。文言追補が必要と判定した場合は、別の add-design 改訂として起票する。
