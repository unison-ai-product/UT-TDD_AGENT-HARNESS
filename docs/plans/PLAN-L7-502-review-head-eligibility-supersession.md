---
plan_id: PLAN-L7-502-review-head-eligibility-supersession
title: "PLAN-L7-502 (add-impl): review履歴と現HEAD merge eligibilityの分離"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-24
updated: 2026-08-24
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L7-470-review-dispatch-analyzer-ownership.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - historical audit と exact-current-HEAD merge eligibility の境界レビュー"
  - role: se
    slot_label: "SE - D2-B merge gate の current HEAD projection を最小実装"
  - role: qa
    slot_label: "QA - old-head FLAG/current-head PASS、same-head FLAG、head change、root配置のRed oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-502-review-head-eligibility-supersession.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-470-review-dispatch-analyzer-ownership.md
  requires:
    - docs/plans/PLAN-L7-470-review-dispatch-analyzer-ownership.md
  blocks: []
  references:
    - docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
    - docs/plans/PLAN-L7-470-review-dispatch-analyzer-ownership.md
    - docs/plans/PLAN-REVERSE-502-review-head-eligibility-supersession-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/feedback/review-dispatch.ts
    - src/feedback/review-merge-gate.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/392
github_issue_id: 392
backprop_decision: required
backprop_decision_reason: "現HEADだけをmerge許可対象にする新しい判定境界を追加するため、既存のcross-review merge契約へReverse検証を戻す。"
review_evidence: []
---

# PLAN-L7-502: review履歴と現HEAD merge eligibilityの分離

## 1. 既存契約との境界

PLAN-L7-470 が所有する D1 analyzer は、request・receipt・PR observation の全履歴を
identity付きで分析し、旧 HEAD を `stale_head` として監査面へ残す。U-RVDISP-047〜052 は
旧 HEAD 隔離、現 HEAD request の欠落、競合 FLAG の blocking 保全を既に固定している。
本 PLAN はその監査出力を削らず、D2-B merge gate が全履歴の `result.ok` をそのまま
merge eligibilityへ流用しない境界だけを追加する。

## 2. 凍結する意味論

1. analyzer の `entries` と `diagnostics` は旧 HEAD を含む全履歴を保持する。audit evidenceを
   current-head projection の都合で削除・上書きしない。
2. merge eligibility は、PR observation の **exact current HEAD** と一致する request/receipt
   だけで判定する。旧 HEAD の FLAG、SLA breach、validation reason は監査へ残すが、現 HEAD
   projectionの判定理由へ混入させない。
3. 旧 HEAD FLAG の後に現 HEAD の非author `PASS` receipt がある場合、現 HEAD requestの
   他条件が揃えば mergeを許可する。旧 FLAGのentry・finding・diagnosticは消去しない。
4. 同じ exact HEAD の FLAG は常に blocking とし、PASS receiptが同居しても mergeを許可しない。
5. HEAD が変わったのに現 HEAD request/receipt が無い場合は denyする。旧 HEAD のPASSだけで
   新 HEADを承認してはならない。
6. review input のroot/worktree配置だけを変えても、同じfactsと履歴から得る判定は同一である。
   実行時はGit common directoryに属する全linked worktreeの`.ut-tdd/review/{requests,receipts}`を
   deterministicに収集し、canonical JSON重複を除去する。Git管理下でworktree列挙に失敗した場合は
   root-localへ黙って縮退せず、fail-closeする。非Gitのisolated fixtureだけはfixture rootを単独入力とする。

## 3. スコープ

`src/feedback/review-merge-gate.ts` の current-head projection と、その U-RVMG 回帰を対象とする。
linked worktree間のevidence収集を同じD2-B入力境界へ含める。
`src/feedback/review-dispatch.ts` の全履歴監査モデル、receipt schema、custody path、#389/#384/#388
の資産と経路は変更しない。

## 4. 完了条件

- U-RVMG の旧 HEAD FLAG→現 HEAD PASS supersession、same-head FLAG blocking、HEAD変更時の
  current receipt欠落 deny、root/worktree配置不変 oracle、linked worktree間のevidence共有 oracleがGreen。
- `PLAN-L7-470` の U-RVDISP-047〜052 と audit出力を維持する。
- typecheck、Biome、targeted tests、PLAN lint がGreen。draft PLANのgeneratesは本PLAN自身に
  限定し、実装成果物の所有は実装確認時に更新する。
