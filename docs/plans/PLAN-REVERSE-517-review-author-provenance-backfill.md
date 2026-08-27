---
plan_id: PLAN-REVERSE-517-review-author-provenance-backfill
title: "PLAN-REVERSE-517: review author provenance backfill"
kind: reverse
layer: cross
drive: fullstack
route_signal: design_gap
route_mode: reverse
status: draft
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-08-27
updated: 2026-08-27
owner: PO / TL
github_issue_id: 437
parent_design: docs/plans/PLAN-L7-517-review-author-provenance.md
pair_artifact: docs/test-design/harness/L7-review-author-provenance-test-design.md
agent_slots:
  - role: qa
    slot_label: "QA - exact HEAD で誤申告・unknown・混在 family・digest 移行を独立変異で再検証する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-517-review-author-provenance-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-517-review-author-provenance.md
  requires: []
  blocks: []
  references:
    - docs/test-design/harness/L7-review-author-provenance-test-design.md
review_evidence: []
---

# PLAN-REVERSE-517

## R0

Forward 契約の pair-freeze 中。freeze 後の実装 PR で R1 へ移り candidate を正式 oracle へ昇格し、
R2 で誤申告の双方向・unknown 既定・混在 family・digest 移行を独立変異、R3 で受理点と merge gate の
二重照合および PR #430 再現 fixture を aggregate 検収し、R4 で上位契約へ再合流する。

R2 で必ず攻撃側から検証する項目:

- 申告値へ fallback する経路が残っていないこと。
- provenance 書き込み失敗が成功扱いにならないこと。
- 旧 schema request の遡及再解釈が起きないこと。
- **worker 自身が自分の provenance を書ける経路が残っていないこと** (信頼根の分離が実効であること)。
- **dispatch 開始時宣言だけで family が確定してしまわないこと** (完了時 commit-set binding の必須性)。
- **receipt 発行後・merge 前の provenance 差し替えが通らないこと** (TOCTOU)。
- **旧 schema であることが照合免除として使えないこと** (grandfather 条項の不在)。
- **混在 contributor family set が多数派へ丸められないこと**。

R3 では #430 型の誤申告 request を fixture として再現し、移行期間中でも自己 review / merge へ
到達しないことを aggregate 検収する。
