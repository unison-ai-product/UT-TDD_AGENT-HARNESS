---
plan_id: PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze
title: "PLAN-L7-489 (impl): PF-4 sync-pack channel adapter 内部結線 pair-freeze"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
status: draft
created: 2026-08-17
updated: 2026-08-17
owner: PM / Codex
parent_design: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: aim
    slot_label: "AIM - manifest/channel と PF-3 resolver の責務境界を固定する"
  - role: tl
    slot_label: "TL - 三値attestation、exact digest、外部結線0の独立レビュー"
  - role: se
    slot_label: "SE - adapter application seam と既存resolver/materializer再利用境界を設計する"
  - role: qa
    slot_label: "QA - CANDIDATE-RELMAN-006 の attested/mismatch/unavailable oracle を固定する"
generates:
  - artifact_path: docs/plans/PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
  requires:
    - PLAN-L7-487-isolated-git-artifact-resolver-pf3
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/250
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/249
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/251
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/224
github_issue_id: 250
review_evidence: []
---

# PLAN-L7-489: PF-4 sync-pack channel adapter 内部結線 pair-freeze

## 0. 位置づけ

Issue #250 のPF-4は、PF-3のisolated Git resolverがmainへ到達した後に、
`sync-pack --channel` の内部adapterだけを実装可能な契約へ固定するsliceである。
上流のmanifest/channel契約は `PLAN-L7-473`、PF-3のartifact取得は
`PLAN-L7-487` が所有する。本PLANはそれらを上書きせず、PF-4の内部結線境界だけを
docs-only pair-freezeとして固定する。

本PRは実装を含めない。`src/setup/release-channel-adapter.ts` と
`tests/release-channel-adapter.test.ts` は、pair-freeze merge後の実装PRで初めて
`generates`へ追加する。既存の `CANDIDATE-RELMAN-006` はpair artifact上の正本であり、
本PRでは共通test-design台帳を変更しない。

## 1. 契約

- 入力はmanifestのselected channelとimmutable release recordを正本とし、
  `artifactSourceCommit` と期待artifact digestをPF-3 resolver/materializerへそのまま渡す。
- adapterの判定結果は `attested` / `mismatch` / `unavailable` の三値を保持する。
  `unavailable`を`mismatch`やbooleanへ丸めない。
- application coreはresolver/materializer/copy/writeをportとして受け、呼出順と各portの
  countをテストから観測できる。PF-4では内部compositionのみを扱う。
- CLI公開、Pack checkoutの実copy、filesystem mutation、GitHub/外部network、commit/pushは
  PF-4のpair-freezeおよび実装PRの対象外で、呼出count 0を維持する。外部結線はPF-5の
  aggregate admissionで別途判定する。
- PF-3のcurrent worktree/current HEAD依存なし、network補完なし、object不在時fail-closeの
  契約を再発明せず再利用する。

## 2. 対応oracle

`CANDIDATE-RELMAN-006` を唯一のPF-4候補とし、実装PRで次を1:1に昇格する。

1. manifest/channelがrelease recordとdigestに一致する場合は`attested`。
2. bytesまたはdigestが一致しない場合は`mismatch`。
3. selected revision/objectが解決不能、入力schemaが不正、portが失敗した場合は
   `unavailable`。この場合copy/write/外部公開は0件。

## 3. 工程と出口

1. 本docs-only PLANのpair-freezeをcross-reviewし、exact HEADとCIを確認してmainへmergeする。
2. merge後に別PRでadapter application coreとU-RELMAN-006を実装し、既存PF-3 portを注入する。
3. 実装PRのclosing reviewで三値、digest、port count、外部結線0を実測し、PASS後にのみ
   PF-5 (#251) のpair-freezeを開始する。

## 4. スコープ境界

Pack repoへの同期、clean allowlistへの公開、channelのpromotion/rollback、manifestの
一般化、PF-5のfinal-tree admissionは本PLANへ混ぜない。#250の実装が完了するまで
Issue #250はcloseせず、`Refs #250`としてpair-freeze成果だけを記録する。
