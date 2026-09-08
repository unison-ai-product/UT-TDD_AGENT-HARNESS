---
plan_id: PLAN-REVERSE-518-review-request-retraction-backfill
title: "PLAN-REVERSE-518: review request retraction backfill"
kind: reverse
layer: cross
drive: fullstack
route_signal: design_gap
route_mode: reverse
confirmed_reverse_type: design
created: 2026-08-27
updated: 2026-09-08
owner: PO / TL
parent_design: docs/plans/PLAN-L7-518-review-request-retraction.md
pair_artifact: docs/test-design/harness/L7-review-request-retraction-test-design.md
agent_slots:
  - role: qa
    slot_label: QA - exact HEAD で権限逸脱・class 述語・append-only 性・gate 除外を独立変異で再検証する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-518-review-request-retraction-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-518-review-request-retraction.md
  requires: []
  blocks: []
  references:
    - docs/test-design/harness/L7-review-request-retraction-test-design.md
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 439
admission_receipt:
  schema_version: v2
  receipt_id: certificate:40d4e5acc36e82117cd92af19318a5da
  command_id: command:issue439-retraction-reverse-revision2
  admitted_at: 2026-09-08T01:54:25.929Z
  source_digest: sha256:9504fa943b9189a7e69cbbe31ba14808d6dfc49d7c69c2e2a14e4f0dd590409a
  decision_digest: sha256:5e871f2b15755be4017b39dff4cf947400bedd638225f1dd36e0598e3f0109b9
  receipt_digest: sha256:a71ccf0f6426c13872437db7621e04ccfc4435f8ca6028fcc76684defd2a2d49
  binding:
    path: docs/plans/PLAN-REVERSE-518-review-request-retraction-backfill.md
    plan_id: PLAN-REVERSE-518-review-request-retraction-backfill
    asset_id: plan:legacy:2fb18f8069e22a3b19fbe187c63885f32af28d8c2374d81920a0f336668a24b9
    revision: 2
    content_digest: sha256:9504fa943b9189a7e69cbbe31ba14808d6dfc49d7c69c2e2a14e4f0dd590409a
  route:
    signal: design_gap
    mode: reverse
  issue:
    provider: github
    issue_id: 439
    episode_id: E4-439-request-terminal-repair
    projection_digest: sha256:7745336f0557edf50883a7baaed439c4408db78b490534297d14f061ad4e49b0
  origin:
    plan_id: PLAN-L7-518-review-request-retraction
    revision: 1
    digest: sha256:d3792608d4e5949ad6d252f9e7cb2627ee59a9659a9da88cd6f0119d4524bb82
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-518-review-request-retraction
    target_revision: 2
    phase: forward_merge
  escape_reason: Issue439 current closing protocol and typed request terminal repair
---

# PLAN-REVERSE-518

## R0

Forward 契約の pair-freeze 中。freeze 後の実装 PR で R1 へ移り candidate を正式 oracle へ昇格し、
R2 で retraction 権限・class 別述語・append-only 性・merge gate 除外を独立変異、R3 で PR #430 /
PR #441 の実事例 fixture を aggregate 検収し、R4 で上位契約へ再合流する。

R2 で必ず攻撃側から検証する項目。いずれも「retraction が fail-close gate からの self-service
脱出口にならない」という契約の中心主張を否定しにいく変異である。

- verdict 済 request を retract できないこと。
- reviewer family が一方的に無効化できないこと。
- `unclosable` を自己申告で通せないこと。
- retracted 単独で `merge_ready` へ到達しないこと。
- **request ファイルの手動削除で gate 集合から外れないこと** (ledger 由来の集合であること)。
- **ledger を消して gate が緩まないこと** (`ledger_unavailable` fail-close)。
- **verdict と retraction の二重終端が作れないこと** (UNIQUE + CAS)。
- **競合 retraction が両方成立しないこと**、**ack-loss が成功扱いにならないこと**。
- **replacement graphのself/cycle、leafのcanonical closing receipt欠落・FLAG・digest driftが拒否されること**。
- **同じrepository/PR/HEAD/authorFamilyでないreplacementが拒否されること**。
- **Git factsやfamily claimをauthorityへ昇格せず、writer側の成功だけでgateが通らないこと**。
- **`unclosable` retraction 後・merge 前の provenance snapshot 差し替えが通らないこと**。
- **ledger 導入境界より前の mint 不在が偽陽性にならないこと**、**境界以降に例外が無いこと**。

R3 では PR #430 (手動削除で解消された dead-end) と PR #441 (競合 mint) の実事例を fixture として
再現し、本機構下では手動削除を要さずに回復すること、および削除を試みても gate が緩まないことを
aggregate 検収する。

PLAN-L7-517はGit factsのみを供給し、provider family authorityを供給しない。
supersededのR3は既存exact-HEAD closing protocolを用いる。unclosableはPLAN-L7-465の独立authorityが
実装・検収されるまでdenyを維持し、そのpositive実証なしに本Reverse全体のR4・Issue439完了を主張しない。

## 今回の回復受入 (PR #519 / #526)

R3では各旧requestと全attemptを保持したfixtureで、正規CLIのtyped superseded発行からmerge gateまでを通す。
同じHEADの有効なclosing PASSは必須であり、receipt複製・request削除・HEAD進行・別identity再reviewは代替にならない。
対象requestの後着FLAG、異なるreplacement receipt、二重terminal、lease競合、ack-lossを単独に変異させる。
既存requestをledgerへ取り込む場合はidentityと内容digestを保ち、導入境界を理由に未終端requestを捨てない。
この文書更新はR0の契約整合であり、CLI実装や実運用回復を完了した証拠ではない。
