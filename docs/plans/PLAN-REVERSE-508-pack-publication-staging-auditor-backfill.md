---
plan_id: PLAN-REVERSE-508-pack-publication-staging-auditor-backfill
title: "PLAN-REVERSE-508: local Pack publication staging/auditor backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R4
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
review_evidence:
  - reviewer: claude
    review_kind: cross_agent
    reviewed_at: "2026-08-27T03:15:16Z"
    tests_green_at: "2026-08-26T08:20:48Z"
    verdict: "R2 時点の非著者 closing review 成立 (PASS / blocking 0)。R4 再合流は未了のため status は draft"
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: claude-opus-5
    subject_head: 8143ce40f6df3f56ebcee9d745d6f38422e1912f
    evidence_path: tests/pack-publication-staging.test.ts
    anchor_commit: 8143ce40f6df3f56ebcee9d745d6f38422e1912f
    scope: >-
      Forward 対の PLAN-L7-508 と同一 exact HEAD 8143ce40 に対する非著者 closing review の
      Reverse 側記録。receipt は
      rv1-6945ce76a9e1c90246e2a61a1a50058ffb46664b494480e08b8c2c4f8036755b。
      本 entry は R2 までの検証が非著者 PASS を得たことのみを主張し、R3/R4 の完了、
      remote publication candidate の実装、Issue #403 の完了は主張しない。
      worker_model / effort は receipt・request・commit trailer・PR record の
      いずれにも記録が無く、Codex session corpus (~/.codex/sessions) の turn_context 実測から
      確定した。2026-08-26/27 の Codex 実行系は gpt-5.6-luna (effort high) と
      gpt-5.6-sol (effort low) の 2 つだけで、創出レーンが luna/high、review・verdict レーンが
      sol/low に分かれている。実値の申告があれば本欄を訂正する。Issue #429 が本欄の
      手書き運用そのものを所有する。
    citations:
      - ".ut-tdd/review/receipts/6945ce76a9e1c90246e2a61a1a50058ffb46664b494480e08b8c2c4f8036755b.json"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/32946157460"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/pack-publication-staging.test.ts --reporter=dot"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-26T08:20:48Z"
        evidence_path: tests/pack-publication-staging.test.ts
        output_digest: "sha256:4221e846816dce13f1d6581eab3042dc43e552f8075e122690eb533b73567c46"
        anchor_commit: 8143ce40f6df3f56ebcee9d745d6f38422e1912f
  - reviewer: codex-tl-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-09-14T02:56:08Z"
    tests_green_at: "2026-09-14T02:56:08Z"
    verdict: "R3 aggregate再検収 PASS; 上位契約差分 0; Claude non-author closing review pending"
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: gpt-5.6-sol
    plan_revision: cedee07d0450eff20c0677ce701a18ca7bb2731d
    subject_head: cedee07d0450eff20c0677ce701a18ca7bb2731d
    evidence_path: tests/pack-publication-staging.test.ts
    anchor_commit: cedee07d0450eff20c0677ce701a18ca7bb2731d
    scope: >-
      current origin/main の #410 (PR #410) local staging/auditor と #466 (PR #466) remote
      adapter を aggregate 再検収した。U-PACKPUB-STAGE-001..010 (14 tests) と
      U-PACKPUB-REMOTE-010..032 (51 tests) を同一 isolated snapshot で実行し、sealed
      staging plan → injected remote adapter の境界、typed deny/partial/indeterminate、
      remote write 0 の preflight、mutation 後の read-back を確認した。source/worktree/
      development DB/PLAN/evidence/local Pack checkout への実行時依存、実 remote mutation、
      Pack publication、Canary は検査・実行していない。
    citations:
      - "docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md"
      - "docs/plans/PLAN-L7-519-pack-publication-adapter.md"
      - "tests/pack-publication-staging.test.ts"
      - "tests/pack-publication-adapter.test.ts"
      - "docs/test-design/harness/L7-unit-test-design.md: U-PACKPUB-STAGE-001..010"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/pack-publication-staging.test.ts tests/pack-publication-adapter.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-09-14T02:56:08Z"
        evidence_path: tests/pack-publication-staging.test.ts
        output_digest: "sha256:4221e846816dce13f1d6581eab3042dc43e552f8075e122690eb533b73567c46"
        anchor_commit: cedee07d0450eff20c0677ce701a18ca7bb2731d
      - kind: typecheck
        command: "npx tsc --noEmit --pretty false"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-09-14T02:56:08Z"
        evidence_path: src/setup/pack-publication-staging.ts
        output_digest: "sha256:92db0caefffc9d63ed6fd2e32a0d11c542bbfc263fb773f50916029b36e0db08"
        anchor_commit: cedee07d0450eff20c0677ce701a18ca7bb2731d
      - kind: lint
        command: "npx biome check src/setup/pack-publication-staging.ts src/setup/pack-publication-adapter.ts tests/pack-publication-staging.test.ts tests/pack-publication-adapter.test.ts"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-09-14T02:56:08Z"
        evidence_path: src/setup/pack-publication-adapter.ts
        output_digest: "sha256:4cdd9f7f887648412158d1754755a19cfa3f8bc8e1a04bfe4c76cb73e88cfa01"
        anchor_commit: cedee07d0450eff20c0677ce701a18ca7bb2731d
      - kind: vmodel_lint
        command: "node --experimental-strip-types src/cli.ts plan lint docs/plans/PLAN-REVERSE-508-pack-publication-staging-auditor-backfill.md"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-09-14T02:56:08Z"
        evidence_path: docs/test-design/harness/L7-unit-test-design.md
        output_digest: "sha256:3826a91bf07765346ba55cd4b1a76d3fb56468548dfa6e047f8f3a7b1515b5d7"
        anchor_commit: cedee07d0450eff20c0677ce701a18ca7bb2731d
status: confirmed
created: 2026-08-25
updated: 2026-09-14
owner: Codex / Luna
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: "local staging/auditorはconfirmed L6境界を変更せず、remote publication候補を未実装のまま保持するため。"
parent_design: docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
github_issue_id: 403
agent_slots:
  - role: tl
    slot_label: "TL - local/remote境界とtyped failureの逆向き検証"
  - role: qa
    slot_label: "QA - U-PACKPUB-STAGE-001..010の独立oracle検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-508-pack-publication-staging-auditor-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-505-pack-staged-release-rollback-backfill.md
    - docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
    - docs/plans/PLAN-L7-500-pack-publication-assets-pure-domain.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/setup/pack-publication-staging.ts
    - tests/pack-publication-staging.test.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/403
---

# PLAN-REVERSE-508

## R0 / R1: Forward契約の逆向き確認

`PLAN-L6-63`と`PLAN-REVERSE-505`が固定したpublication境界のうち、remote writeを必要としない
`CANDIDATE-PACKPUB-001/002`だけを`PLAN-L7-508`へ降下した。manifest v2とdeterministic assetsの
既存所有権を再実装せず、sealed local staging planとobserved result auditorへ合成する。

## R2: 実装・oracle実測

`U-PACKPUB-STAGE-001..010`は、semantic control snapshot、exact commit/asset inventory、immutable
bytes、snapshot/apply/restore fault、apply exactly once、partial/indeterminate監査を独立に検出する。
Luna worker実装をCodex preflightで検証した。Claude closing FLAGでasset欠落・digest/bytes drift、
control digest driftのreason oracle不足とrelease/channel節境界衝突を実測したため、Red 13/14を経て
domain separatorと要素数prefixを追加した。detached HEAD snapshot 14/14 Green、TypeScript、Biomeを
同じremediation revisionへ束縛し、commit/assets/control digestの各分岐を独立に検出する。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | Pack独立配布・consumer隔離要求を変更しない。 |
| L4-basic-design | not_impacted | local stagingとremote publicationのcomponent境界を維持する。 |
| L5-detailed-design | not_impacted | 新しい永続schema、CLI、remote adapterを導入しない。 |
| L6-function-design | not_impacted | PLAN-L6-63のfail-close、CAS、rollback契約を縮小・変更しない。 |
| L7-unit-test-design | updated | U-PACKPUB-STAGE-001..010を個別oracleとして登録した。 |

## R3: aggregate再検収

current `origin/main` (`cedee07d0450eff20c0677ce701a18ca7bb2731d`) に到達済みの #410 (PR #410)
local staging/auditor と #466 (PR #466) remote adapter を、単体テストの合算ではなく同一
isolated snapshot 上の aggregate として再検収した。

| 境界 | main上の既存証跡 | 再検収結果 |
| --- | --- | --- |
| local staging/auditor | `src/setup/pack-publication-staging.ts` / `tests/pack-publication-staging.test.ts` / `U-PACKPUB-STAGE-001..010` | 14 tests Green。explicit entries、semantic control digest、immutable bytes、snapshot/apply/restore、exact observation の typed outcome を確認 |
| remote adapter | `src/setup/pack-publication-adapter.ts` / `tests/pack-publication-adapter.test.ts` / `U-PACKPUB-REMOTE-010..032` | 51 tests Green。sealed intent、mutation単位 approval/nonce、journal、実 write count、read-back、partial/indeterminate、reconciliation を確認 |
| aggregate boundary | staging plan → injected adapter ports | adapter は sealed staging plan のみを入力し、source worktree/開発DB/PLAN/evidence/local Pack checkout/実 credential を読まない。preflight deny は remote write 0、mutation後の不確定状態は成功へ丸めないことを確認 |

上位 `PLAN-L6-63` / `PLAN-REVERSE-505` の local/remote 境界、explicit inventory、typed
fail-close、append-only remote FSM、supersede-forward rollback を再読し、今回の実装・oracleは
local candidate `CANDIDATE-PACKPUB-001/002` と remote candidate `CANDIDATE-PACKPUB-003/004` の
既存所有を変更していないと判定した。上位契約、requirements、L4/L5/L6、既存 test-design に
追加差分はない。実 remote mutation、Pack公開、tag/Release、channel promotion、Canary、
consumer E2E は実行していない。

## R4: gap-only / reuse-as-is closure

R3 aggregate再検収で上位差分は 0 件だったため、`forward_routing: gap-only` と
`promotion_strategy: reuse-as-is` を確定する。既存 #410/#466 の実装・テスト・契約を再実装せず、
そのまま後続 Forward slice の入力として再利用する。`CANDIDATE-PACKPUB-003/004` の remote
approval/CAS、Pack commit/tag/Release、channel promotion、supersede-forward rollback は
未実装の後続責務として保持し、この PLAN の完了条件や Pack／Canary の公開完了へ水増ししない。

R4の判定は、requirements / L4-basic-design / L5-detailed-design / L6-function-design を
`not_impacted`、L7既存 oracle の aggregate再検収を `updated` とする。新規の上位設計・source・
test-design・公開物は生成しない。PR作成後に Claude の非著者 closing review を exact HEAD へ
依頼し、レビュー成立前は merge・Issue close・Pack公開を行わない。
