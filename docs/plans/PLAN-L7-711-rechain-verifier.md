---
plan_id: PLAN-L7-711-rechain-verifier
title: "PLAN-L7-711 (add-impl): re-chain 差分の whitelist 検証器 verifyRechainDelta
  の実装 (#711 S2)"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-10-05
updated: 2026-10-06
owner: Claude control lane (PLAN 起票) · Codex worker (S2 implementation) · 非著者
  frontier reviewer
parent_design: docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md
backprop_decision: required
backprop_decision_reason: PLAN-L6-711 rev 5 (receipt revision 5) は検証器の入力形 (§2.6)
  と判定規則 (§2.3) を freeze するが、S2 の実装で初めて確定する事項 (verifierDigest の domain separator
  を v2 とすること、 intermediatePlans の key 集合の組み方、legacy bootstrap 経路 asset の拒否)
  が契約本文の意味と一致するかは 実装側からしか検証できない。PLAN-REVERSE-711 で L6-711 §2.3 / §2.6
  へ逆向き照合し、意味の差が見つかった 場合だけ L6-711 の add-design 改訂として別に起票する。
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: Codex worker - verifyRechainDelta (pure function 1 module) を L6-711
      §2.6 の入力形に束縛して実装する
  - role: qa
    slot_label: Codex worker - U-RECHAIN-001..007、011、012、014..018 の正系・負系と mutation
      を先に Red で置く
  - role: tl
    slot_label: 非著者 frontier reviewer - 本 PLAN の pair-freeze と、PR
generates:
  - artifact_path: docs/plans/PLAN-L7-711-rechain-verifier.md
    artifact_type: markdown_doc
  - artifact_path: src/plan-admission/rechain-verifier.ts
    artifact_type: source_module
  - artifact_path: tests/rechain-verifier.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-711-rechain-verifier-backfill.md
    - docs/plans/PLAN-L6-711-merge-time-receipt-rechain-contract.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/plan-admission/plan-revision-command-assembler.ts
    - src/plan-admission/tracked-receipt-renderer.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/711
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/839
review_evidence:
  - reviewer: gpt-6.1-sol
    review_kind: cross_agent
    reviewed_at: 2026-10-06T06:04:22.801Z
    tests_green_at: 2026-10-06T06:01:36Z
    verdict: pass
    worker_model: claude-opus-5-5
    reviewer_model: gpt-6.1-sol
    subject_head: 25a9b4effc4a3c3bacc4872d8acef1d1f962f294
    scope: "PR 839 exact head 25a9b4effc4a3c3bacc4872d8acef1d1f962f294 に対する非著者
      post-green evidence review (Sol、receipt 694231e1…、verdict PASS / blocking
      0 / reviewer family codex)。(a) 先行の rev 2 は CI green 前の review (#841 の Sol
      PASS) を引用していたため 8c033d16 で取り下げ、本 review で積み直した。(b) 本 PLAN の confirm 前は新規
      test file が deliverable-plan-trace の orphan-deliverable で fail-close し CI
      が green になり得ないため、green 証跡は subject head での local node 実行とする (evidence dir
      の local-green-meta.txt: start 2026-10-06T05:55:34Z / end
      2026-10-06T06:01:36Z)。typecheck と lint の completed_at は各ログ (local-tsc.log
      / local-biome.log) の最終書込み時刻 (mtime) であり、meta の window 内かつ tests_green_at
      以前にある。(c) closing review r3 は 56738104 で PASS。"
    green_commands:
      - kind: unit_test
        command: node scripts/run-vitest-snapshot.ts tests/rechain-verifier.test.ts
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: 2026-10-06T06:01:36Z
        evidence_path: tests/rechain-verifier.test.ts
        output_digest: sha256:45fc91c32a301193019446a33d58bdb1144c088894cf760810bb7cf232135b04
        anchor_commit: 25a9b4effc4a3c3bacc4872d8acef1d1f962f294
      - kind: typecheck
        command: npx tsc --noEmit
        runner: node
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T05:56:15.358Z
        evidence_path: src/plan-admission/rechain-verifier.ts
        output_digest: sha256:15da40126c6ef008de1c5572441d145bfba4a4afef3067bd8ecf97da694ce550
        anchor_commit: 25a9b4effc4a3c3bacc4872d8acef1d1f962f294
      - kind: lint
        command: biome check src/plan-admission/plan-revision-command-assembler.ts
          src/plan-admission/rechain-verifier.ts
          src/plan-admission/tracked-receipt-renderer.ts
          tests/rechain-verifier.test.ts
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: 2026-10-06T05:56:16.742Z
        evidence_path: src/plan-admission/rechain-verifier.ts
        output_digest: sha256:15da40126c6ef008de1c5572441d145bfba4a4afef3067bd8ecf97da694ce550
        anchor_commit: 25a9b4effc4a3c3bacc4872d8acef1d1f962f294
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/839
      - .ut-tdd/review/receipts/694231e1d5b1b1a4444a51032c4f49b34a6eb793801962fcd0f0381ac6976678.json
      - .ut-tdd/review/packets/pr839-25a9b4ef/evidence/
status: confirmed
github_issue_id: 711
admission_receipt:
  schema_version: v2
  receipt_id: certificate:753e830b3256315b6b97d6f9cb53b0f9
  command_id: plan-revise:issue-711:s2-verifier-confirm:post-green:r2
  admitted_at: 2026-10-06T06:11:23.880Z
  source_digest: sha256:722243eaa92f5ded0bab77e62469d3d9a4e7e1a5dc73bbd7cd76b1a54b14d964
  decision_digest: sha256:a26ef5d9c190745591e7df9aa9942f980811178d74f4d2c0b193f226b72f7a77
  receipt_digest: sha256:3b6fa488757d74b6ef25e3c3d4b44ee8b6ed74853e357689b7b2a2e15e6d5a1e
  binding:
    path: docs/plans/PLAN-L7-711-rechain-verifier.md
    plan_id: PLAN-L7-711-rechain-verifier
    asset_id: plan:f2a61a3ad7d3b7301f0fc4238d529547
    revision: 2
    content_digest: sha256:722243eaa92f5ded0bab77e62469d3d9a4e7e1a5dc73bbd7cd76b1a54b14d964
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 711
    episode_id: E4-711-merge-time-receipt-rechain
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-711-merge-time-receipt-rechain-contract
    revision: 5
    digest: sha256:1fc671f67f150f9b3f19478b370ec781f973c41c9b544c086f6f8a5084d6fb39
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-711-rechain-verifier
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #711 S2: PR #839 の実装
    (src/plan-admission/rechain-verifier.ts と tests/rechain-verifier.test.ts) を
    generates に宣言し、exact head 25a9b4ef に対する非著者 post-green evidence review (Sol
    PASS) を review_evidence に記録して confirm する。契約本文は変えない。"
---

# PLAN-L7-711: re-chain 差分の whitelist 検証器 verifyRechainDelta の実装 (#711 S2)

## 1. 目的と境界

PLAN-L6-711 (add-design、receipt revision 5) が freeze した whitelist 検証器を、L7 の実装単位として所有する PLAN である。
対象は L6-711 §6 の S2 (`verifyRechainDelta`、pure function 1 module) で、実装 PR は #839
(`work/add-feature-issue711-s2-verifier-v2-20261005`) である。

本 PLAN は L6-711 の契約本文を変えない。S3 (adapter `readRechainSnapshot`、`ut-tdd pr merge` への配線、
U-RECHAIN-008..010 / 013、CLAUDE.md の例外文言) は本 PLAN の対象外であり、L6-711 §6 の S3 として別に扱う。

起票の経緯: #839 の CI (Linux doctor) が `deliverable-plan-trace - violation: orphan-deliverable tests/rechain-verifier.test.ts`
で red になった。L6-711 は design PLAN であり自分自身しか generates に持たないため、新規 source_module と test の所有者が
存在しない。`merged-plan-status` の landing 是正手順 (A) と precedent #722 (PLAN-L7-722 + PLAN-REVERSE-722 を
generates = 自分自身だけで起票 → pair-freeze → confirm → 実装 PR で generates 追加) に従い、所有 PLAN を分割起票する。

## 2. S2 の scope (L6-711 rev 5 の契約条項との対応)

| L6-711 の節 | S2 で実装する内容 |
| --- | --- |
| §2.2 PLAN 差分の再適用規則 | base = `merge-base(H, M)` を前提にした path 単位 3-way、`generates` 末尾と §8 末尾の append-only 連結 |
| §2.3-1〜4 | 非簿記 path の拒否、append-only 領域外変更の拒否、追加 record の件数・対象の照合、親の直接束縛 (`R^1 = X`、`X^1 = H`、`X^2 = M`) |
| §2.3-5 | 待機中に `M` が作成・所有した path の再所有拒否 |
| §2.3-6 | 正規 assembler による admission の完全な再導出、許容項目の列挙、`A_H` と H の `decision_digest` の照合、`receipt_digest` の再導出 (preimage の源は §2.3-6 の表)、同一 asset 複数再発行時の base の連鎖と `intermediatePlans` の key 集合の完全一致 |
| §2.6 | 検証器の入力形 (`RechainInput`) と `verifierDigest` (`stableJson` + `sha`、版付き domain separator) |

検証器が使う既存 module は、所有を移さずに参照だけする。
`src/plan-admission/plan-revision-command-assembler.ts` は PLAN-RECOVERY-16、`src/plan-admission/tracked-receipt-renderer.ts`
は PLAN-L7-435 が所有する。#839 による両ファイルの変更は、各所有 PLAN の範囲内の最小抽出として扱う。

## 3. pair-freeze の対象 (oracle の対応)

pair は `docs/test-design/harness/L7-unit-test-design.md` の「PLAN-L6-711 S2 re-chain 差分の whitelist 検証器」節である
(#839 で L6-711 §4 の CANDIDATE-U-RECHAIN-* を U-RECHAIN-* として登録する)。対になるテストは `tests/rechain-verifier.test.ts`。

| oracle | L6-711 の根拠 | 細分 (test 名の接頭辞) |
| --- | --- | --- |
| U-RECHAIN-001..007 | §2.2 / §2.3-1〜4 | 001〜007 |
| U-RECHAIN-011 | §2.3-5 | 011 |
| U-RECHAIN-012 | §2.3-6 (admission の再導出と許容項目) | 012 (m1〜m3) |
| U-RECHAIN-014 | §2.6-7 (両側変更の非簿記 path) | 014 |
| U-RECHAIN-015 | §2.2 / §2.6 (base = `merge-base(H, M)`、stacked PR) | 015 |
| U-RECHAIN-016 | §2.6 (`verifierDigest`) | 016。domain separator は `ut-tdd.rechain-verifier.v2` |
| U-RECHAIN-017 | §2.3-6 (`receipt_digest` の再導出) | 017a 任意 digest、017b actor 定数以外、017c sourceCommit が `M` 以外、017d legacy bootstrap 経路 asset |
| U-RECHAIN-018 | §2.3-6 (同一 asset 複数再発行、`intermediatePlans`) | 018a 正系、018b〜018f 負系と mutation m1〜m4、018g 複数再発行が無いとき `intermediatePlans` は空 |

pair-freeze review で確かめること:

1. 上表の細分が L6-711 §4 の CANDIDATE-U-RECHAIN-016〜018 の正系・負系・mutation を漏れなく覆うこと。
2. `verifierDigest` の domain separator を v2 にすることが §2.6 の「版付き」の範囲内であり、契約の意味変更でないこと。
3. S3 の oracle (008〜010、013) を S2 に混ぜていないこと。

## 4. 受入

- AC1: U-RECHAIN-001..007、011、012、014..018 が green。各 mutation を入れると対応する oracle が red になる (#839 の test で示す)。
- AC2: 検証器は pure function であり、Git・file system・network に触れない (adapter は S3)。
- AC3: 新規 source_module は `src/plan-admission/rechain-verifier.ts` の 1 個だけ (§PR スコープ規律 3)。
- AC4: 本 PLAN の confirm 後、#839 が main を取り込み、`plan revise` で generates に
  `src/plan-admission/rechain-verifier.ts` (source_module) と `tests/rechain-verifier.test.ts` (test_code) を追加する。

## 5. Schedule

| step | mode | 内容 |
| --- | --- | --- |
| 1 | serial | 本 PLAN と PLAN-REVERSE-711 を generates = 自分自身だけで起票する |
| 2 | serial | 非著者 frontier reviewer が本 PLAN の pair-freeze (§3) を review する |
| 3 | serial | PASS と CI green の後に preflight review_evidence を付けて confirm し、merge する |
| 4 | serial | #839 が main を取り込み、`plan revise` で generates を追加する (AC4) |
| 5 | serial | #839 の exact head 非著者 closing review と正規 receipt gate で merge する |

## 6. 非目標

S3 (adapter・wrapper 配線・CLAUDE.md 文言)、L6-711 の契約本文の変更、既存 receipt の書換え。
