---
plan_id: PLAN-L7-470-review-dispatch-analyzer-ownership
title: "PLAN-L7-470 (troubleshoot): review dispatch analyzer の出荷物所有分離"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
route_signal: incident
route_mode: incident
created: 2026-07-31
updated: 2026-07-31
owner: PM / PO
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-465に定義済みのD1 dispatch lifecycleと実装の意味論は変更せず、draft設計PLANと完成済み出荷物のライフサイクルを分離してgenerates所有を確定する。"
agent_slots:
  - role: aim
    slot_label: "AIM - incident #201 / #202 のdispatch未着手・恒久停止境界を分析"
  - role: se
    slot_label: "SE - dispatch analyzerとU-RVDISP oracleの実装"
  - role: tl
    slot_label: "TL - identity/FSM/fail-close境界と出荷物所有の独立監査"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
parent_design: docs/plans/PLAN-L7-465-cross-review-author-binding.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
generates:
  - artifact_path: docs/plans/PLAN-L7-470-review-dispatch-analyzer-ownership.md
    artifact_type: markdown_doc
  - artifact_path: src/feedback/review-dispatch.ts
    artifact_type: source_module
  - artifact_path: src/feedback/review-verdict-contract.ts
    artifact_type: source_module
  - artifact_path: tests/review-dispatch.test.ts
    artifact_type: test_code
  - artifact_path: tests/review-verdict-contract.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-465-cross-review-author-binding.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-94-cross-review-session-attestation.md
    - docs/plans/PLAN-L6-13-cross-review-enforcement.md
review_evidence:
  - reviewer: claude-opus-5-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-31T08:20:40Z"
    tests_green_at: "2026-07-31T08:18:53Z"
    verdict: approve
    worker_model: gpt-5.6-sol
    reviewer_model: claude-opus-5
    scope: "PR #205 exact HEAD 329e1be7 のclosing review。後発FLAG findingsの安全側集約、request以前receiptの分離、通知dedupe oracle、same-family/PASS-WEAK/replay/入力順、設計記述と実装の一致を別providerのOpusが静的全経路で再監査しPASS。Tera delta監査、ローカル52/52・統合201/201、CI Linux/Windows/aggregate successを別途実測した。"
    green_commands:
      - kind: unit_test
        command: "bun test tests/review-dispatch.test.ts (52 pass, 0 fail)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-31T08:13:00Z"
        evidence_path: tests/review-dispatch.test.ts
        output_digest: "sha256:aaecaf57bd06209c8ea32d0e65bbb851a337d522b3be1d2c18ea8d5b77183446"
        anchor_commit: 329e1be7d6b35f9f404c433115a1b42542fec913
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-31T08:13:00Z"
        evidence_path: src/feedback/review-dispatch.ts
        output_digest: "sha256:902333ec0cbcfc172cc0b5c02a341b519543b1d6c3ec83cee86dc327c5026add"
        anchor_commit: 329e1be7d6b35f9f404c433115a1b42542fec913
      - kind: lint
        command: "bun test tests/review-dispatch.test.ts tests/plan-lint.test.ts tests/frontmatter.test.ts tests/review-evidence.test.ts tests/merged-plan-status.test.ts tests/green-command-digest.test.ts (201 pass, 0 fail)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-31T08:13:00Z"
        evidence_path: docs/test-design/harness/L7-unit-test-design.md
        output_digest: "sha256:ee01e53f0af860693bb3fc69eb700036943d5a76259e4aebb5a552507bc3cee5"
        anchor_commit: 329e1be7d6b35f9f404c433115a1b42542fec913
      - kind: integration_test
        command: "GitHub Actions harness-check run 30615431150 (Linux/Windows/aggregate success)"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-07-31T08:18:52Z"
        evidence_path: tests/review-dispatch.test.ts
        output_digest: "sha256:aaecaf57bd06209c8ea32d0e65bbb851a337d522b3be1d2c18ea8d5b77183446"
        anchor_commit: 329e1be7d6b35f9f404c433115a1b42542fec913
---

# PLAN-L7-470: review dispatch analyzer の出荷物所有分離

## 1. 目的

`PLAN-L7-465` が定義する D1 dispatch lifecycle の完成済み出荷物を、本 PLAN が所有する。
`PLAN-L7-465` は cross-review session attestation 全体の設計降下であり、D1 以外の
AC-1〜AC-5が未完了なので `draft` を維持する。一方、次の D1 出荷物は実装・テスト済みである。

- `src/feedback/review-dispatch.ts`
- `tests/review-dispatch.test.ts`

これらを draft PLAN の `generates` に置くと、`merged-plan-status` と
`deliverable-plan-trace` の要求が衝突する。完成判定が D1 analyzer の検証だけで閉じる本 PLANへ
所有を分離し、設計未完了を偽って `PLAN-L7-465` を confirm しない。

## 2. 実装契約

正本の状態遷移・後続境界は `PLAN-L7-465` の「dispatch lifecycle」節とする。本 PLANは次を
出荷物の完了条件として固定する。

1. identity は `(memoryId, pr, exactHead, reviewRevision)`。
2. 現行 exact identity の有効な非author family `verdict` は先行 receipt がなくても終端証拠
   として受理する。ack / in_review の欠落は非blocking診断であり、`merge_ready` を妨げない。
3. author family と同一 family の verdict receipt は承認に使わない。ack / in_review は
   非blocking進捗診断とし、別familyの有効verdictを無効化しない。
4. 古い HEAD の receipt は現 HEAD の有効 verdict を無効化せず、古い verdict で
   `merge_ready` にもしない。
5. PR observation の競合、不正時刻、不正SHA、replay競合は fail-close。
6. 完全重複 replay は冪等で、孤児artifactは identity付きdiagnosticへ残す。
7. `merge_ready` は非author family PASS系 verdict、三者HEAD一致、CI green、PR open、
   fail-close reason不在の全条件が揃った場合だけ到達する。
8. SLA breach は verdict 未到達60分の一段だけ。ack/start SLAはD3 producer完成まで
   発生させず、不正/future request時刻は `ageMinutes: null` としてfail-closeする。
9. stale HEAD / unmerged CLOSED / MERGED は終端としてSLAを止める。request無しMERGEDと
   verdict無しMERGEDは手順違反としてfail-closeし、旧requestの恒久redを作らない。
   MERGED観測のheadを全requestのexactHead集合へ横断照合し、旧HEAD requestだけで
   merge先HEADのrequest欠落を隠せない。

## 3. 設計と検証の対

| 設計境界 | 対応oracle |
| --- | --- |
| 基本FSM、SLA、自己承認拒否、HEAD一致 | `U-RVDISP-001`〜`012` |
| identity、時刻、family、verdict-anchorのfail-close | `U-RVDISP-013`〜`020` |
| request replayの冪等・競合 | `U-RVDISP-021` |
| old HEAD隔離、PR観測欠落、reason付き非ready | `U-RVDISP-022`〜`024` |
| unrelated/matching malformed artifactの診断分離 | `U-RVDISP-025`〜`026` |
| PR観測の競合と冪等replay | `U-RVDISP-027`〜`028` |
| receipt時刻順と終端証拠の分離、uppercase SHA拒否 | `U-RVDISP-029`〜`030` |
| well-formed orphan診断とexactHead別通知identity | `U-RVDISP-031` |
| timezone明示ISO timestampと不正時刻のSLA fail-close | `U-RVDISP-032` |
| 同一instantのtimestamp表現差を除外したreplay identity | `U-RVDISP-033` |
| verdict単独PASS/FLAG、same-family/old HEAD拒否、old ack隔離 | `U-RVDISP-034`〜`037` |
| verdict単一SLA、malformed/順序/identity拒否 | `U-RVDISP-038`〜`041` |
| receipt/PR入力順に依存しない決定論 | `U-RVDISP-042` |
| stale/CLOSED/MERGED終端、孤児MERGED fail-close | `U-RVDISP-043`〜`046` |
| stale requestとmerge先HEAD requestの横断照合 | `U-RVDISP-047`〜`048` |
| author family併存時のcross-family verdict保全、不正MERGED孤児のfail-close | `U-RVDISP-049`〜`050` |
| 競合FLAGのblocking保全、request以前receiptと有効後続receiptの分離 | `U-RVDISP-051`〜`052` |

## 4. スコープ外

- receipt / request のDB永続化とingestion。
- GitHub APIからのPR observation取得。
- session-start / doctor / CI hard gateへの配線。
- SLA超過通知、reviewer再割当、merge自動化。

これらは順序契約 **D3→D2→D4** で実装する。本 PLANをconfirmしても D2〜D4の完了を意味しない。

## 5. AC

- AC-1: `U-RVDISP-001`〜`052` が全件green。
- AC-2: `tsc --noEmit` とBiomeがgreen。
- AC-3: identity/FSM/replay/diagnosticを独立監査し、未反証attackがない。
- AC-4: `impl-plan-trace` / `deliverable-plan-trace` で上記2出荷物の孤児が0。
- AC-5: `PLAN-L7-465` はdraftを維持し、未実装のsession attestationを偽完了にしない。

## レビュー状態

本 PLAN は exact HEAD `329e1be7` に対する non-author providerのOpus closing reviewで
`PASS`、Tera delta監査で`PASS`、ローカル52/52・統合201/201、CI Linux/Windows/aggregate
successを確認し、上記証跡と同時に`confirmed`へ遷移した。`PLAN-L7-465`はD3/D2/D4が未完のため
`draft`を維持し、本PLANの確定をsession attestation全体の完了とは扱わない。
