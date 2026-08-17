---
plan_id: PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze
title: "PLAN-L7-489 (impl): PF-4 sync-pack channel adapter 内部結線 pair-freeze"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
status: confirmed
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
    slot_label: "QA - U-RELMAN-006 の attested/mismatch/unavailable oracle を検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/release-channel-adapter.ts
    artifact_type: source_module
  - artifact_path: tests/release-channel-adapter.test.ts
    artifact_type: test_code
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
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-17T11:40:42Z"
    tests_green_at: "2026-08-17T11:40:42Z"
    verdict: pass
    worker_model: codex
    reviewer_model: claude-opus-5
    scope: "PR #329 のdocs-only pair-freeze契約レビュー。実装コードの挙動・U-RELMAN-006の実装検証は本entryの対象外で、#330のclosing reviewで別途判定する。"
    evidence_path: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/329"
    anchor_commit: 8bfaf23f857ec8c098d3b5aeb5c61afe39ef14e1
    green_commands:
      - kind: lint
        command: "node src/cli.ts plan lint"
        runner: node
        scope: targeted
        exit_code: 0
        evidence_path: docs/plans/PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze.md
        output_digest: "sha256:e2833a9a2c7c0f78d3dbfeb8e625d09434a20420fe673246d8a2e1e3e8dda131"
        anchor_commit: e2c008219483da92849effed03eca497664ced74
        completed_at: "2026-08-17T12:07:57Z"
---

# PLAN-L7-489: PF-4 sync-pack channel adapter 内部結線 pair-freeze

## 0. 位置づけ

Issue #250 のPF-4は、PF-3のisolated Git resolverがmainへ到達した後に、
`sync-pack --channel` の内部adapterだけを実装可能な契約へ固定するsliceである。
上流のmanifest/channel契約は `PLAN-L7-473`、PF-3のartifact取得は
`PLAN-L7-487` が所有する。本PLANはそれらを上書きせず、PF-4の内部結線境界だけを
docs-only pair-freezeとして固定する。

pair-freeze merge後の実装PRで、`src/setup/release-channel-adapter.ts` と
`tests/release-channel-adapter.test.ts` を同じcommitで追加し、pair artifact上の
`CANDIDATE-RELMAN-006`を`U-RELMAN-006`へ昇格する。

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

`U-RELMAN-006` はPF-4唯一の候補から昇格した実装oracleであり、次を1:1に固定する。

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
