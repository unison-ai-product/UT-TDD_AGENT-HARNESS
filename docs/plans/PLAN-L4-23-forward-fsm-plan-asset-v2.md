---
plan_id: PLAN-L4-23-forward-fsm-plan-asset-v2
title: "PLAN-L4-23 (add-design): append-only Forward FSM + PLAN Asset v2"
kind: add-design
layer: L4
sub_doc: function
drive: fullstack
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/process/forward/overview.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: "TL - Forward state/transition/exception と legacy migration 判断"
  - role: se
    slot_label: "SE - immutable asset/revision/evidence ledger と canonical parser"
  - role: qa
    slot_label: "QA - illegal transition、stale evidence、rebuild identity の oracle"
generates:
  - artifact_path: docs/adr/ADR-008-forward-fsm-plan-asset-v2.md
    artifact_type: adr_snapshot
  - artifact_path: docs/process/forward/overview.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/plan-asset-v2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  blocks: []
  references:
    - docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
    - docs/process/gates.md
    - docs/governance/vmodel-upgrade-schedule.md
review_evidence:
  - reviewer: "Codex plan-asset/FSM design reviewers"
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T23:03:00+09:00"
    tests_green_at: "2026-07-10T23:00:20+09:00"
    verdict: approve
    worker_model: gpt-5
    reviewer_model: gpt-5
    scope: "PLAN Asset/FSMを独立read-only review。ledger DB、identity framing、event/projection分離、evidence policy、CLI envelope、exception/property contractを反復検査しCritical 0 / Important 0。実装・検収権限は未委譲。"
---

# PLAN-L4-23: append-only Forward FSM + PLAN Asset v2

## 1. 問題

現行 Forward は PLAN frontmatter status、gate Markdown、schedule RAG、review evidence、DB workflow row を個別に持つが、
許可遷移と現在 revision を一つの状態機械として執行しない。baseline `origin/main@71a023b2` のPLAN 686件にはnumeric core collisionが18群あり、
path/full slug への依存は rename・再分類・長期再利用に耐えない。

## 2. 設計範囲

1. `proposed→planned→pair_freeze_ready→pair_frozen→red_frozen→implementing→implementation_complete→trace_freeze_ready→trace_frozen→review_ready→reviewed→accepted→archived` を正規遷移とする。
2. `blocked|superseded|rejected|reopened` は理由と revision/exception event を必須にする。
3. PLAN v2 は immutable `asset_id`、human-readable alias、revision、artifact ID、dependency asset ID、evidence policy を持つ。
4. transition/evidence は append-only ledger とし、subject revision/source commit/digest/expiry を結合する。
5. v1 PLAN は canonical v2 DTO adapter で読み、新規 authoring と意味変更時に v2 へ昇格する。
6. schedule/gate/trace/review/accept detector は canonical parser/FSM verdict を共有する。

## 3. 受入条件

- pair freeze 前の implement、Red evidence 無しの implement、trace freeze 前の review、review/test不足の accept を拒否する。
- rename/layer変更で `asset_id` が変わらず、revision 更新後も旧 evidence を改変しない。
- stale/expired/別revision evidence は accept に使用できない。
- legacy PLAN 全件を canonical DTO へ損失なく変換し、numeric core collision を migration ledger に列挙する。
- `workflow status|transition|explain` と `plan migrate|validate|revise` のCLI契約を定義する。
- projection 全削除/rebuild 後も transition/evidence identity と reduction 結果が一致する。

## 4. 降下先

L5 ledger schema、L6 FSM/guard/evidence policy、L7 CLI/projection/migration、L9 system/E2E verification を後続起票する。
