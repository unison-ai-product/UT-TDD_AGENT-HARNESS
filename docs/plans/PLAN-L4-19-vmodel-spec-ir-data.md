---
plan_id: PLAN-L4-19-vmodel-spec-ir-data
title: "PLAN-L4-19 (add-design/data): Vモデル宣言型 spec IR と DB projection 論理モデル"
kind: add-design
layer: L4
sub_doc: data
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/design/harness/L4-basic-design/data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T12:30:00+09:00"
    tests_green_at: "2026-07-08T12:30:00+09:00"
    verdict: approve
    scope: "U3 L4 data 設計 slice。Vモデル改善に伴う宣言型 spec IR を SpecDef / SpecRelation / ScheduleEntry / ActivationEntry / DetectorFinding として既存集約境界へ割り当て、DB projection は検出補助であって authoring source に昇格しないことを明文化した。FilingTarget は PLAN-L4-18 の function SSoT から導出し、検出系が layer/sub_doc/pairing を創作しない境界を確認した。"
    green_commands:
      - kind: lint
        command: "bun run src/cli.ts plan lint docs/plans/PLAN-L4-19-vmodel-spec-ir-data.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T12:30:00+09:00"
        evidence_path: docs/design/harness/L4-basic-design/data.md
        output_digest: "sha256:4be256e1f7f65eba42729c326f60e4f363b4fe903226f43179024500bddf5914"
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T12:30:00+09:00"
        evidence_path: docs/test-design/harness/L9-system-test-design.md
        output_digest: "sha256:df04161596b89f391952b4302011ab1ded3c730d8294a11a4e2fa0df92f97f96"
agent_slots:
  - role: tl
    slot_label: "TL - spec IR / DB projection の集約境界判断"
  - role: se
    slot_label: "SE - L4 data と L9 system test design の追補"
  - role: qa
    slot_label: "QA - projection が authoring source 化しない不変条件確認"
generates:
  - artifact_path: docs/plans/PLAN-L4-19-vmodel-spec-ir-data.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-01-data.md
  requires:
    - PLAN-L1-06-vmodel-upgrade-requirements
    - PLAN-L4-18-roadmap-drive-selection-hardening
  blocks:
    - PLAN-L5-physical-vmodel-spec-ir
    - PLAN-L7-vmodel-spec-ir-projection
  references:
    - docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/test-design/harness/L9-system-test-design.md
---

# PLAN-L4-19: Vモデル宣言型 spec IR と DB projection 論理モデル

## 0. 役割

本 PLAN は U3 として、Vモデル改善に伴う「宣言型によるデータベース引き込み」を L4 data 設計へ差し込む。目的は DB を設計正本にすることではなく、docs / PLAN / test-design / 工程表から宣言的な仕様要素を抽出し、`.ut-tdd/harness.db` に検出しやすい projection として持たせることである。

## 1. 設計判断

- `SpecDef` は Artifact 集約配下の仕様定義 entity とし、設計文書・PLAN・test-design の章や frontmatter から抽出する。
- `SpecRelation` は Artifact 集約配下の trace / relation entity とし、仕様間の defines / requires / verifies / pairs / derives を表す。
- `ScheduleEntry` と `ActivationEntry` は Workflow 集約配下の projection input とし、工程管理表・活性化 profile・対象外理由を保持する。
- `DetectorFinding` は derived_view であり、設計正本ではない。検出結果は FilingTarget を直接決めず、PLAN-L4-18 の `FilingTarget` SSoT に渡す候補である。
- DB projection は query 可能性を上げるための読みモデルであり、docs/YAML/JSON 正本との齟齬は doctor finding として fail-close する。

## 2. 変更内容

1. L4 data に spec IR 論理モデルを追加する。
2. SQLite projection DB の候補 table を `spec_defs` / `spec_relations` / `schedule_entries` / `activation_entries` / `detector_route_candidates` として明記する。
3. L9 system test design に ST-DATA-06 を追加し、projection が authoring source に昇格しないことを検証対象にする。
4. G9 evidence manifest では ST-DATA-06 を deferred として登録し、U3 L7 実装 slice で vitest / doctor へ落とす。

## 3. 受け入れ条件

- L4 data の spec IR は既存 5 集約境界を壊さず、Artifact / Workflow / derived_view に割り当てられている。
- DB projection table は検索補助として定義され、正本は docs/YAML/JSON に残る。
- L9 に ST-DATA-06 が存在し、U3 L7 の実装検証へ追跡できる。
- `plan lint`、`db rebuild`、`doctor` が green。

## 4. 後続 slice

- U3 L5: 物理 schema / projection writer / migration 方針を確定する。
- U3 L6-L8: projection contract と oracle を定義する。
- U3 L7: `spec_defs` / `spec_relations` / schedule / activation projection を実装する。
- U4: DB projection を検出系・起票候補・doctor finding surface へ接続する。
