---
plan_id: PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill
title: "PLAN-REVERSE-534: D3b provider evidence composition backfill"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-11
updated: 2026-09-11
owner: Claude / Fable (pair-freeze) · Codex worker (implementation)
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: PLAN-L7-562 の producer 契約と PLAN-L7-465 §D3c の
  authority 政策を変更せず、 既存 custody 事実から producer 入力を導出する結線を逆向き検証するだけのため。
parent_design: docs/plans/PLAN-L7-534-d3b-provider-evidence-composition.md
pair_artifact: docs/test-design/harness/L7-d3b-provider-evidence-composition-test-design.md
agent_slots:
  - role: tl
    slot_label: Sol / Claude Opus - L7-562 producer 契約と L7-534 composition 境界を逆向き検証する
  - role: qa
    slot_label: Terra - CANDIDATE-U-D3BCOMP-001..014 を独立照合し、operator 文字列受理・fact 推定・
      再読込省略・replay 転用を攻撃する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-534-d3b-provider-evidence-composition.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
    - docs/plans/PLAN-L7-503-review-custody-delegation-root.md
    - docs/plans/PLAN-L7-562-d3b-provider-judgment.md
    - docs/plans/PLAN-REVERSE-562-d3b-provider-judgment-backfill.md
    - docs/test-design/harness/L7-d3b-provider-evidence-composition-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/570
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 570
admission_receipt:
  schema_version: v2
  receipt_id: certificate:12a8cb75b3ed72b98621ca0f22d4dc09
  command_id: plan-draft:issue-570:reverse:1
  admitted_at: 2026-09-11T06:24:45.920Z
  source_digest: sha256:274583a16714f6bb3a5c75a25b5982d02ce9eacab97de55861605379d9c90098
  decision_digest: sha256:fd03437e455c6b9cdfbe1c74f77f384e1175380aa8af769fe76a19ed682d8a08
  receipt_digest: sha256:36db7666834ec8020d020080fb0583e5af2e40144898b56a2b6c5a513dba0720
  binding:
    path: docs/plans/PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill.md
    plan_id: PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill
    asset_id: plan:12a8cb75b3ed72b98621ca0f22d4dc09
    revision: 1
    content_digest: sha256:274583a16714f6bb3a5c75a25b5982d02ce9eacab97de55861605379d9c90098
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 570
    episode_id: E4-570-d3b-provider-evidence-composition
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L6-85-automated-pr-cross-review-merge-contract
    revision: 2
    digest: sha256:7f822e8cbc533306baccbf4702fc01c3ebb9133a4b3baec8ac84359c99ed156f
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-534-d3b-provider-evidence-composition
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #570 D3b provider evidence composition Reverse backfill pair (R0)"
---

# PLAN-REVERSE-534: D3b provider evidence composition の逆向き確認

## R0: 対象境界

Issue #570 の composition (request / receipt / `attempt_completed` → evidence envelope → producer → artifact
再読込 → runner の bytes 再計算) を、`PLAN-L7-562` の producer 契約、`PLAN-L7-493` / `L7-503` の custody 配置、
`PLAN-L7-465` §D3c の authority 政策の接合面として確認する。L7-562 が所有する payload / canonicalization /
artifact 配置と、L7-465 が所有する `unverified_family` 終端を別の仕様として再定義しない。

## R1: Forward 契約の逆向き分解

- **入力導出の閉包**: composition の全入力は request file、receipt、`attempt_completed` audit event、tracked
  project identity の 4 つだけから来る (`-001..-003`)。verdict envelope の自己申告行・memory・PR comment は
  入力ではない。
- **invocation fact の実在性**: 成功 attempt の provider / model は現状どこにも記録されないため、
  `delegation.ts` に `attempt_completed` を 1 行足す。event の欠落・重複・supersede は typed deny で、
  receipt から遡って推定しない (`-004..-006`)。
- **evidence document の忠実性**: receipt の verdict / findings をそのまま `provider-judgment-evidence/v1` に写す。
  整列はするが dedup はしない (`-007`、`-008`)。
- **artifact の自己検証**: producer の戻り値を信用せず再読込して digest / identity を検証する (`-009`)。producer の
  typed failure は透過する (`-010`)。
- **runner の導出化**: operator 文字列 env は presence で拒否し、bytes から digest / ref を再計算し、identity を PR facts
  と照合する (`-011..-013`)。CLI は artifact path と ref 以外を出さない (`-014`)。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | cross-review の非著者性と custody の fail-close 要求を変更しない。 |
| L4-basic-design | not_impacted | review custody / provider 分離の責務境界を変更しない。 |
| L5-detailed-design | updated (additive) | audit event kind に `attempt_completed` を追加する (既存 optional field のみ使用、DB schema 変更なし)。 |
| L6-function-design | not_impacted | D3a / D3b / D3c / D3d の役割定義 (`PLAN-L7-465`) を変更しない。 |
| L7-unit-test-design | updated | 実装 PR で `U-D3BCOMP-*` を共有 `L7-unit-test-design.md` へ 1:1 登録する。`CANDIDATE-D3B-*` は変更しない。 |
| L12-acceptance-test-design | not_impacted | #541 seal の受入は #541 側が所有する。 |

## R2: candidate / oracle 対応

| Candidate | 実装 PR | Red 入力 | Green oracle |
| --- | --- | --- | --- |
| 001 | PR-1 | digest / ref / provider / model / family を引数・env・stdin で渡す | 型で拒否または `identity_mismatch`、write 0 |
| 002 | PR-1 | request file の欠落・schema 不正・digest 再計算不一致 | `request_unavailable`、write 0 |
| 003 | PR-1 | receipt の head / revision / pr が request と不一致 | `identity_mismatch`、write 0 |
| 004 | PR-1 | `attempt_completed` 無し (receipt のみ) | `invocation_fact_unavailable`、write 0 |
| 005 | PR-1 | `attempt_completed` 2 件 (provider が異なる) | `invocation_fact_ambiguous`、write 0 |
| 006 | PR-1 | `attempt_completed` 後に `superseded_attempt`、または receiptDigest 不一致 | `evidence_superseded` / `identity_mismatch`、write 0 |
| 007 | PR-1 | receipt の blockingFindings に重複 | `evidence_schema_invalid`、write 0 |
| 008 | PR-1 | receipt FLAG + findings 空、PASS + findings 非空 | producer の `judgment_schema_invalid` を透過、artifact 0 |
| 009 | PR-1 | producer 戻り後に artifact bytes を改変 (fake port) | `artifact_verification_failed`、artifact 残置 0 |
| 010 | PR-1 | 同一 attempt を 2 回 compose | 2 回目は `replay: true`、envelope / artifact の write 0 |
| 011 | PR-2 | `UT_TDD_CUSTODY_JUDGMENT_DIGEST` / `PROVIDER_EVIDENCE_REF` を設定 | `operator_supplied_judgment_forbidden`、exit 非 0、draft 0 |
| 012 | PR-2 | artifact bytes を 1 byte 改変 | 再計算 digest ≠ payload の identity 整合失敗、draft 0 |
| 013 | PR-2 | 別 PR / head の artifact bytes を渡す | `judgment_identity_mismatch`、draft 0 |
| 014 | PR-2 | CLI 出力に payload / findings を含める実装へ変異 | stdout は artifact path と ref のみ |

## R3: gap 分類と backfill

非著者の claim-blind / spec-blind review が、次を攻撃する。

- composition が receipt の `reviewerFamily` や verdict envelope 行から provider / model を推定していないか
- `attempt_completed` が無い履歴に対して fact を捏造・補完していないか
- artifact の再読込を省略して producer の戻り値を信用していないか
- runner に operator 文字列の fallback (deprecated 警告だけ) が残っていないか
- bytes 再計算後の identity 照合を省き、別 PR の artifact を転用できないか
- #541 seal / #540 / #487 / `harness.db` 直接書込が混入していないか

gap は L7-534 の contract 改訂 (revision N+1) で閉じ、`PLAN-L7-562` / `PLAN-L7-465` の契約変更が必要なら
`backprop_decision` を `required` へ改訂して当該 PLAN へ戻す。

## R4: Forward 再合流条件

- PR-1 (composition module + `attempt_completed`) と PR-2 (runner / CLI) が別 PR で main 到達し、各々の exact HEAD に
  Linux / Windows / aggregate Green と非著者 closing receipt が存在する。
- `CANDIDATE-U-D3BCOMP-001..014` が同番号の `U-D3BCOMP-*` へ 1:1 昇格し、同一 implementation revision の
  Red→Green 実測を引用している。
- PR #569 が main 到達済みで、composition が呼ぶ producer export が本 PLAN §1 の実測と一致している。
- PR #557 の実 artifact 生成と #541 seal は本 PLAN の完了に含めない。

## Scope boundary

`PLAN-L7-562` / `L7-465` / `L7-493` / `L7-503` の所有 oracle を再宣言しない。provider invocation の外部真正性
(D3d) は本 reverse では扱わない。
