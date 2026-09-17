---
plan_id: PLAN-REVERSE-566-memory-clean-cut-replacement
title: "PLAN-REVERSE-566: project memory clean-cut replacement backfill"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-16
updated: 2026-09-16
owner: Claude control lane
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: required
backprop_decision_reason: 置換後の non-read 保証は Slice 4 migration 契約に無い新契約であり、上位
  L6-104 の不変条件 (canonical-only read、archive は read root の外、削除禁止) へ逆向きに束縛する。
parent_design: docs/plans/PLAN-L7-566-memory-clean-cut-replacement.md
pair_artifact: docs/test-design/harness/L7-memory-clean-cut-replacement-test-design.md
agent_slots:
  - role: tl
    slot_label: 非著者 frontier reviewer - L6-104 の supersede 境界と L7-566 の成果物所有の同値性を検証する
  - role: qa
    slot_label: Terra - archive 再帰 scan、linked worktree fallback、同一 memory_id 異
      digest の独立 Red を検証する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-566-memory-clean-cut-replacement.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-566-memory-clean-cut-replacement.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-104-memory-clean-cut-replacement.md
    - docs/plans/PLAN-L7-512-project-scoped-memory-root.md
    - docs/test-design/harness/L7-memory-clean-cut-replacement-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/424
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 424
admission_receipt:
  schema_version: v2
  receipt_id: certificate:e3491ae517cd2e52ee50387694b8b65d
  command_id: plan-draft:issue-424:memory-clean-cut-impl:reverse:1
  admitted_at: 2026-09-16T03:59:42.578Z
  source_digest: sha256:dd253cef6938d31d31b574ff3ec6542a37b5b99dd1c4ae3b4d57f4d752794c52
  decision_digest: sha256:a17e8398029c0cd22f60b996fc4be5003cddeb159d9676175d4668ccc01f47b7
  receipt_digest: sha256:e5febf0c6d03898d589f706c03aa3df0094d6642f2286ee9f9edd5dd3a3bf86e
  binding:
    path: docs/plans/PLAN-REVERSE-566-memory-clean-cut-replacement.md
    plan_id: PLAN-REVERSE-566-memory-clean-cut-replacement
    asset_id: plan:e3491ae517cd2e52ee50387694b8b65d
    revision: 1
    content_digest: sha256:dd253cef6938d31d31b574ff3ec6542a37b5b99dd1c4ae3b4d57f4d752794c52
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 424
    episode_id: E4-424-memory-clean-cut-replacement
    projection_digest: sha256:3752d540f8d100945ac0f194391370fa52ceb76ecd501d3a6f010927eb87450e
  origin:
    plan_id: PLAN-L7-566-memory-clean-cut-replacement
    revision: 1
    digest: sha256:c30ef41c357f89e40d199f792199f4947ea130e0c2f86eb9e17fd080214fbc64
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-566-memory-clean-cut-replacement
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #424 PR-1: Reverse backfill pair for PLAN-L7-566 (R0;
    post-replacement non-read guarantee bound to the PLAN-L6-104 invariants)"
---

# PLAN-REVERSE-566: project memory clean-cut replacement backfill

## R0: gap

`PLAN-L7-512` Slice 4 は legacy corpus を inventory / quarantine / recovery で migrate する前提だったが、PO 決定
(2026-09-15、Issue #424) は migrate せず clean-cut で置換する。migration 実装を撤去した後、「runtime が legacy を
読まない」ことを保証する契約が既存 Slice 4 の oracle には存在しない。本 Reverse はその gap を L6-104 の不変条件へ
逆向きに束ね、`PLAN-L7-566` の PR-2 実装が満たすべき上位条件を固定する。

## R1: 上位不変条件

- 全 production reader・DB・CLI・provider・doctor / status は project-scoped canonical root だけを読む (L6-104 §1)。
- legacy corpus は削除せず、archive は runtime の read root の外に置く。tracked は `docs/archive/memory-legacy-2026-09/`、
  untracked は gitignore 対象の local archive (L6-104 §3.1 判断 4)。
- supersede の範囲は `PLAN-L7-512` Slice 4 の条項と対応 `generates` 2 件に限る。Slice 1/3 の canonical root、
  provider envelope、Pack parity は変更せず継承する (L6-104 §2)。
- untracked corpus の path / title / 本文は commit する成果物に含めない (secret / PII 未レビュー)。

## R2: 逆向き証明

- canonical entry、archive の有効 entry、linked worktree legacy の別 entry、archive 側 adversarial entry (同一
  `memory_id` 異 digest / frontmatter 破損 / symlink) を同時に置いた fixture で、全 consumer が canonical-only の結果を
  返す (pair artifact §4.1)。archive を再帰 scan する reader が 1 つでもあれば Red。
- migration 撤去後、production import graph・`CONTRACT_ROWS`・oracle 宣言・`PLAN-L7-512` `generates` のいずれにも
  migration 成果物が残らない (pair artifact §4.2、PR-1 で Green)。
- rename digest manifest の各 entry は旧 path と archive path の bytes digest が一致し、tracked corpus 以外を含まない
  (pair artifact §4.3)。
- curation ledger の採用 entry は `ut-tdd memory add` の receipt に 1:1 で束縛され、`ut-tdd db rebuild` 後の
  `memory_entries` は curated canonical corpus と一致する (pair artifact §4.4 / §4.5)。

## R3: 攻撃面

archive を read root 内に置く実装、linked worktree の legacy corpus へ無音 fallback する reader、同一 `memory_id` の
archive 側 variant を canonical に昇格させる dedupe、untracked の本文を summary / manifest に転記する実装、
`generates` を手編集して phantom を隠す PLAN 改訂、oracle 宣言を baseline へ退避して orphan を消す変更、
migration module を別名で復活させる import を独立に攻撃する。

## R4: Forward再合流

pair artifact の PR-2 候補が Red→Green となり、Linux / Windows / aggregate CI と非著者 closing receipt が同一 exact head
へ束縛された後、`PLAN-L7-566` を confirmed へ遷移させて Forward へ再合流する。PR-1 の exact head は再利用しない。
