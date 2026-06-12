---
plan_id: PLAN-L6-17-gate-confirm
title: "PLAN-L6-17 (add-design): gate-confirm coupling lint 機能設計 (IMP-079)"
kind: add-design
layer: L6
drive: agent
status: confirmed
created: 2026-06-08
updated: 2026-06-08
owner: PM / Codex TL
agent_slots:
  - role: tl
    slot_label: "TL - gate-design §2 台帳と confirmed doc status の coupling を関数粒度で設計"
generates:
  - artifact_path: docs/design/harness/L6-function-design/gate-confirm.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires: []
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    worker_model: codex:gpt-5.4
    reviewer_model: claude:pmo-sonnet
    tests_green_at: "2026-06-09T13:00:00+09:00"
    reviewed_at: "2026-06-09T13:10:23+09:00"
    verdict: approve
    scope: "G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR coverage and guardrail coverage reviewed"
---

# PLAN-L6-17 (add-design): gate-confirm coupling lint 機能設計 (IMP-079)

## §0 位置づけ

design/test-design doc が `status: confirmed` になるには、該当 layer の gate が `docs/governance/gate-design.md` §2 台帳で PASS している必要がある。G5 park のまま L5/L8 を confirmed にした freeze 偽装を、review_evidence とは別軸で surface する。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] gate-design §2 parser 設計
直列理由: downstream_dependency
`G<N>` / `L<N>` / status cell を抽出し、PASS 判定と parse 失敗時 skip を定義する。

### Step 2: [直列] confirmed doc loader 設計
直列理由: downstream_dependency
`docs/design/harness/**` と `docs/test-design/harness/**` の frontmatter から layer/status を読む。

### Step 3: [直列] analyzer / messages 設計
直列理由: downstream_dependency
confirmed doc の layer -> gate 写像と gate PASS 有無を突合し、violation message を定義する。

### Step 4: [直列] review
直列理由: downstream_dependency
self/pmo-sonnet review で gate PASS 判定、park 時 violation、parse failure fail-open を確認する。

## §3.1 実装計画

- 情報源: `docs/governance/gate-design.md` §2、`src/lint/review-evidence.ts`、`src/lint/module-drift.ts`。
- L7 で `src/lint/gate-confirm.ts`、doctor `checkGateConfirm`、`tests/gate-confirm.test.ts` を実装する。
- doctor 配線は hard/fail-close とし、`gateConfirm.ok` を `runDoctor.ok` に連動する。

## §6 用語更新

新規 glossary term は追加しない。IMP-079 は既存の gate / confirmed / freeze / doctor の coupling 強化として扱う。

## §8 DoD

- [ ] gate-design §2 parser と confirmed doc loader の設計がある
- [ ] parse 失敗時 skip(fail-open) が明記されている
- [ ] L7 add-impl / REVERSE pairing が起票されている
