---
layer: L1
executed_at_layer: L14
artifact_type: test_design
status: confirmed
revision_track: additive
revision_base_artifact: docs/test-design/harness/L14-operational-test-design.md
pair_artifact: docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
next_pair_freeze: L1
plan: docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
created: 2026-07-10
updated: 2026-07-10
---

# Vモデルengine-swap 要件delta 運用テスト設計

本書は既存`L14-operational-test-design.md`のconfirmed OT-01〜47を変更せず、`PLAN-L1-07`のadditive L1 deltaだけと対になる。
confirmed化はOT設計のpair-freeze承認を表し、OT実行完了やengine-swap program完遂を表さない。

| 要求 | 運用oracle | green条件 |
|---|---|---|
| VUP-REQ-08A | OT-VUP-008A | 109 source / 21 category / 163 item / 8 profileを全削除再構築してorphan 0、gapはdebtへrouteされる |
| VUP-REQ-09 | OT-VUP-009 | illegal Forward transition、stale evidence、wrong revisionでacceptを拒否する |
| VUP-REQ-10 | OT-VUP-010 | contract由来detectorの全ruleが独立mutationで発火し、survivor 0のreceiptを残す |

## G14-WORKFLOW

test_strategy: active engine-swap revisionだけを既存L1/L14 freezeと分離してrisk-basedに検証する。
test_plan: U18a〜gおよびL8〜L14 verify PLANのevidence manifestをOT-VUP IDへ結合する。
test_conditions: source/item/profile/FSM/PLAN revision/contract/detector mutationの正負入力を用意する。
coverage_items: VUP-REQ-08A/09/10、U18a〜g、L8〜L14、全docs/163 item/self-proof。
test_procedures: db rebuild、doctor、CLI/process exit、mutation、CI、PO/TL signoffを実行する。
execution_evidence: OT ID、asset revision、commit、command、exit、finding code、receipt、signoffを記録する。
exit_criteria: 必須OTがpassし、pending/gap/debt/mutation survivorが未記録のままacceptされない。
defect_routing: owning left layer、Reverse、Recovery、debt PLAN、次サイクルL0 feedbackへrouteする。
verification_design: 実行環境、独立oracle、mutation operator、証拠freshnessをOTごとに固定する。

## VUP-REQ-01〜08 の候補 OT (PLAN-L1-06 の還流)

`vmodel-upgrade-requirements.md` の VUP-REQ-01〜08 は、旧 pair とされる `L14-operational-test-design.md` に対応する OT 行を持たない
(`VUP` の出現が 0 件であることを 2026-10-14 に確認した)。上の表は VUP-REQ-08A / 09 / 10 だけを持つ。
PLAN-L1-06 の Step 4 は、この運用検証方針を後続 U7 で追加すると定めたまま未着手である。下表は各要求の受入条件を運用 oracle に写した候補で、
正式な OT ID への昇格は、運用側の実行環境と証跡が揃った段階で行う。

| 候補 | 要求 | 運用 oracle (green 条件) |
|---|---|---|
| CANDIDATE-OT-VUP-001 | VUP-REQ-01 | 工程管理表 (`vmodel-upgrade-schedule.md`) の掲載 PLAN について、`ut-tdd status`・`doctor`・DB の `schedule_entries` が同じ現在地を示す。掲載された PLAN は PLAN frontmatter より表を優先する |
| CANDIDATE-OT-VUP-002 | VUP-REQ-02 | 起票 signal から filing target (`kind` / `layer_band` / `sub_doc_hint` / `pairing_obligation` / `forward_insufficient_reason`) が返る。feature・version-up・design-bottomup 由来の作業が設計層を飛ばして cold L7 に入れない |
| CANDIDATE-OT-VUP-003 | VUP-REQ-03 | `spec.defines` を projection した後、未定義参照・参照されない定義・テスト欠落・台帳不一致を DB query が検出する。既存 PLAN / design を一括置換しない |
| CANDIDATE-OT-VUP-004 | VUP-REQ-04 | detector の finding が artifact ID・関係 ID・工程位置・route candidate を持ち、`doctor` が起票候補 (Reverse / refactor / verify / version-up など) に分類する。結果を quality signal として再検索できる |
| CANDIDATE-OT-VUP-005 | VUP-REQ-05 | `kind=verify` の PLAN が検証層・対象の左肺 artifact・結果・defect routing を持ち、失敗が recovery / reverse / refactor / add-design / version-up のどれかへ route される |
| CANDIDATE-OT-VUP-006 | VUP-REQ-06 | 主要な domain object と不変条件が L4〜L6 の設計から trace でき、境界漏れ・重複実装・依存逆転が detector の finding になる |
| CANDIDATE-OT-VUP-007 | VUP-REQ-07 | PLAN が目的・現在地・工程表・trace・review evidence・defect routing を構造化して持つ。既存 PLAN の履歴を改ざんしない |
| CANDIDATE-OT-VUP-008 | VUP-REQ-08 | profile ごとの必須 artifact・許容 defer を解決でき、「未対応」と「対象外」を区別する。version-up parked と active draft を status・DB・doctor が混同しない |
