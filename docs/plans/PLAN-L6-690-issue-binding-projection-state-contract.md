---
plan_id: PLAN-L6-690-issue-binding-projection-state-contract
title: "PLAN-L6-690 (add-design): issue binding の projection_state 契約"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-24
updated: 2026-09-25
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-issue-binding-projection-state-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: L6 issue binding 契約の追加であり、L0/L1 要件の意味は変更しないため
agent_slots:
  - role: tl
    slot_label: TL - projection_state 契約と cutoff 条項
  - role: se
    slot_label: SE - issue binding の admission / receipt 境界
  - role: qa
    slot_label: QA - 全ゼロ・unprojected・projected 欠落の oracle
generates:
  - artifact_path: docs/plans/PLAN-L6-690-issue-binding-projection-state-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-issue-binding-projection-state-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
  requires: []
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/690
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/692
    - docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
    - src/schema/route-filing.ts
  blocks: []
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 690
admission_receipt:
  schema_version: v2
  receipt_id: certificate:52a5162977415352a94d9d4456000288
  command_id: plan-draft:issue-690:projection-state-contract:1
  admitted_at: 2026-09-25T00:00:00.000Z
  source_digest: sha256:eff3ba923849638c38b92fa18a3632c72118836015dc996220ba087a99543ffb
  decision_digest: sha256:9c9cc03354e9bff26ede85091784aec4c510e7faff899f78f05307d634621d27
  receipt_digest: sha256:cb6f55a0f941a476311e9aff7264c6b477967934037b2e4b9df2793e9ce46bd0
  binding:
    path: docs/plans/PLAN-L6-690-issue-binding-projection-state-contract.md
    plan_id: PLAN-L6-690-issue-binding-projection-state-contract
    asset_id: plan:52a5162977415352a94d9d4456000288
    revision: 1
    content_digest: sha256:eff3ba923849638c38b92fa18a3632c72118836015dc996220ba087a99543ffb
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 690
    episode_id: issue-690
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L6-83-forward-escape-issue-contract
    revision: 1
    digest: sha256:00ddb0c033085b1d2f49edc57a7c6f44d92c5dc8bb3eeac334fc4df50a4876d1
  reentry:
    target_plan_id: PLAN-L6-83-forward-escape-issue-contract
    target_revision: 1
    phase: forward_merge
  escape_reason: issue binding projection_state 契約の設計判断を追加する
---

# PLAN-L6-690: issue binding の `projection_state` 契約

## 1. 目的と境界

Issue #690 の実測では、`projectForwardEscapeIssue` は CLI に配線されておらず、実在する
`IssueProjected` row はない。また、`docs/plans/` 配下に全ゼロの `projection_digest` を持つ
PLAN が 21 件ある。この状態で全ゼロを新しい証明書へ再発行すると、存在しない投影を証明した
ことになるため許可しない。

本 PLAN は、issue binding の真の状態を表す契約を freeze する設計 PR である。実装、既存履歴
receipt の書換え、21 件の一括是正、Issue projection の発行経路の配線は含めない。

## 2. 設計判断（freeze）

### 2.1 issue binding の schema

issue binding は次の形を正本とする。

```yaml
issue:
  provider: github
  issue_id: 690
  episode_id: issue-690
  projection_state: projected
  projection_digest: sha256:<64桁の16進数> # projected のときだけ必須
```

未投影の場合は、同じ binding を次の形で表す。

```yaml
issue:
  provider: github
  issue_id: 690
  episode_id: issue-690
  projection_state: unprojected
```

- `projection_state` は必須で、値は `projected` または `unprojected` の閉じた enum とする。
- `projection_state: projected` では、検証済みの `projection_digest` を必須とする。digest は
  canonical な `sha256:<64桁の16進数>` とし、全ゼロ値を拒否する。
- `projection_state: unprojected` では `projection_digest` を持たない。欠落を `null` や
  空文字で代用せず、field 自体を省略する。
- `issue_id` の存在だけでは projection 済みの根拠にならない。Issue body や推測値を digest
  の代用にしない。

### 2.2 全ゼロ digest と既存履歴の扱い

- `plan draft` / `plan revise` による新しい revision で、全ゼロの `projection_digest` を
  入力した場合は fail-close とする。`projected` の digest として受理してはならない。
- 既存の PLAN、tracked receipt、receipt chain は書き換えない。履歴の全ゼロ値を新しい
  certificate へ再発行する一括是正も行わない。
- 既存 PLAN は、次に revision を発行する個別の機会に、実投影が無いことを確認したうえで
  `projection_state: unprojected` へ移す。履歴を遡及して修正しない。

### 2.3 実装 PR の境界（1 PR = 1 論点）

契約を実装へ降下する後続 PR は、次の 4 か所を最小変更の対象とする。

1. `src/schema/frontmatter.ts` — issue binding の discriminated schema と全ゼロ拒否。
2. `src/plan-admission/policy.ts` — `projected` / `unprojected` の admission 判定。
3. `src/plan-admission/tracked-receipt-renderer.ts` — receipt への state/digest の正規出力。
4. `src/cli/plan-revise.ts` / `src/cli/plan-draft.ts` — manifest schema と入力境界。

この PR では上記の実装ファイルを変更しない。Issue projection の read-back や CLI 配線を
同梱して契約論点を増やさない。

### 2.4 cutoff 条項と別 issue

本物の projection を発行・読み取る配線は、既に日本語で起票済みの Issue #692（Issue #418 の
正式な sub-issue）へ分離する。この PR では #692 を重複起票しない。#692 の範囲は次のとおり
である。

- `projectForwardEscapeIssue` を正規 CLI 経路へ配線する。
- `eventsFor` の read-only lookup で、検証済み `IssueProjected` row の `event_digest`、
  `command_id`、`sequence` を読み戻す。
- Issue projection digest と PLAN ledger の `canonical_payload_digest` (`revision_digest`)
  を別の read-only query として扱い、欠落・曖昧性・chain/digest 不一致を typed fail-close
  する。
- #452 が所有する既存の forward-escape journal / `IssueProjected` domain port を再実装せず、
  将来の PLAN-L7-437 の projector / inbox / reconciler / outbox worker も先取りしない。

#692 の配線が merge された後は、新規 confirm で `projection_state: unprojected` を使用できない
ようにする。この cutoff は既存 receipt の書換えや一括是正を意味せず、配線後に発行する新規
revision の入力境界だけに適用する。

### 2.5 oracle の方針

falsifiable な候補 oracle は pair artifact に置く。未実装の候補を Green と主張せず、後続の
実装 PR で Red→Green を観測したテストだけを正規 oracle へ昇格する。

## 3. 受入条件

- [ ] issue binding の必須 `projection_state` と、state ごとの digest 排他条件が freeze されている。
- [ ] `projected` の全ゼロ digest、`unprojected` の digest 付き入力、`projected` の digest 欠落が拒否対象として明記されている。
- [ ] 新 revision の全ゼロ拒否、既存履歴不変、次回 revision での個別 `unprojected` 移行、一括是正なしが明記されている。
- [ ] 実装対象 4 か所と 1 PR = 1 論点の境界が明記されている。
- [ ] #692 の CLI 配線/read-back と cutoff 条項が分離されている。
- [ ] 3 件の falsifiable oracle が `docs/test-design/harness/L7-issue-binding-projection-state-test-design.md` にある。

## 4. 非目標

- production source、schema、admission policy、renderer、CLI manifest の変更。
- 実投影 row の作成、GitHub Issue の再作成、SQLite/DB handle の利用側公開。
- 既存の全ゼロ digest を持つ PLAN または receipt の書換え・再発行・一括 migration。
- #692 の実装や、実在しない digest の推測・placeholder 生成。

## 5. 参照した実測と判断

- Issue #690 本文・コメント（2026-09-24）: CLI 未配線、全ゼロ PLAN 21 件、方式 A の採択。
- Issue #692: projection 発行経路と `event_digest` read-back の後続実装。
- `docs/plans/PLAN-L6-83-forward-escape-issue-contract.md`: Issue projection の既存設計親。
- `docs/plans/PLAN-L6-86-drive-plan-admission-contract.md`: Forward 外 admission と issue binding の境界。

## 6. Schedule

| step | mode | 内容 | 成果物 |
|---|---|---|---|
| 1 | serial | Issue #690、既存 PLAN、route SSoT、既存親契約の重複確認 | 本 PLAN の契約境界 |
| 2 | parallel | 設計判断（§2）と L7 pair artifact の oracle 候補を freeze | PLAN / test-design |
| 3 | serial | #692 の別 issue / formal sub-issue 関係と cutoff 参照を確認 | #692 |
| 4 | serial | docs-only の lint と指定検証を実行し、契約 PR を draft PR 化 | 検証結果 / draft PR |

## 7. 後続降下

本 PLAN の確認後、実装 PR は §2.3 の 4 か所に限定し、§2.5 の 3 oracle を実装する。
projection の発行・read-back・cutoff の実装は #692 の責務であり、本 PLAN の実装 PRへ取り込まない。
