---
plan_id: PLAN-REVERSE-524-pack-consumer-generated-bun-removal-backfill
title: "PLAN-REVERSE-524: 生成成果物 Bun 撤去の backfill"
kind: reverse
layer: cross
drive: agent
route_signal: design_gap
route_mode: reverse
status: draft
workflow_phase: R4
confirmed_reverse_type: design
created: 2026-08-28
updated: 2026-08-31
owner: PM / PO / Codex takeover
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: "既存の #469 freeze を実装・変異証跡へ束縛し、新しい要件・設計語彙を追加していないため。"
github_issue_id: 470
parent_design: docs/plans/PLAN-L7-524-pack-consumer-generated-bun-removal.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-generated-bun-removal-backfill-test-design.md
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

## R1: 観測契約の確定

`PLAN-L7-524` の実装範囲を `PLAN-L7-522` §2.1 / §2.1.1 / §3.3 と照合した。
R1 で確認した所有境界は、生成 consumer tree、生成 `package.json` の script、Node
wrapper launcher、および U-PACKBUN-003/004/006 の oracle だけである。readiness (#471)、
source CI (#472)、Node producer (#473)、CI短縮 (#490) は本対の対象外である。

共有の親 test-design は `PLAN-L7-522` の freeze artifact として保持し、本 child では
`L7-pack-consumer-generated-bun-removal-backfill-test-design.md` を追加の R1-R4 pairing
artifact とする。この追加 artifact は新規契約を定義せず、親の候補表と実装 test の
対応・変異結果を記録する。

## R2: 実変異による Red 証跡

`tests/setup-bun-removal.test.ts` の clean generated tree 生成後に、生成経路 (a)〜(e) を
各 case で独立に変異し、baseline 0 件と case 固有の完全な finding 集合を照合した。
`tests/ban-lint-detection-power.test.ts` では runtime-portability の spawn `bun` / `.cmd` /
`.exe`、rule-drift の command `bun` / `bunx` / `.cmd` / `.exe` を別入力として実行し、
各々の対応 rule 1 件だけを要求する。これにより別軸の事前 finding が変異を隠す余地を
除いた。具体的な matrix は対の test-design §R2 に固定する。

実装された全 mutation は `U-PACKBUN-004` 5 case と `U-PACKBUN-006` の behavioral /
structural case として実際に runner から実行される。未実行の宣言を R2 の証拠にはしない。

## R3: 検証と trace

R3 の green command は exact implementation HEAD へ束縛する。最低限、detached snapshot
runner の U004/U006 targeted suite、typecheck、Biome、PLAN lint を実行し、U004 の 5
mutation と U006 の独立 spawn/command variants が survivor 0 であることを記録する。
親 `PLAN-L7-522` の freeze revision/evidence は変更せず、child の実装 HEAD と実測結果だけを
この PLAN と pairing artifact に追加する。

## R4: backfill と Forward 合流

実装差分は既存 freeze の実体化であり、requirements、L4/L5/L6 の意味、外部契約、運用
ポリシーを変更しない。このため `backprop_decision: not_required` とし、
`forward_routing: gap-only` / `promotion_strategy: reuse-as-is` で Forward へ戻す。
親 freeze の R4 を再定義せず、#471/#472/#487/#463 を取り込まない。

## R4 status boundary

この PLAN の `status: confirmed` は、親契約への backfill 判定と child pairing の確定を
示す。PR #478 の merge-ready / Issue #470 完了 / Issue #418 canary-ready は意味しない。
non-author closing review と exact-head CI が未到着の間は、PRをdraftとして保持し、review
evidence の `pending` entry を PASS と解釈しない。
