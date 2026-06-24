---
plan_id: PLAN-L7-89-plan-errata-supersession-gate
title: "PLAN-L7-89 (troubleshoot): PLAN 誤記対策 — safety-claim 規律明文化 + supersedes 双方向 errata gate (plan-supersession)"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-22
updated: 2026-06-22
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "PO 指摘『プランの誤記への対策』(2026-06-22) に対応。誘因 = PLAN-L7-86 の review_evidence/AC が『kind filter は false-positive を出さない / blast radius 0』と断定したが実際は false-negative の盲点だった (= 自由記述の誤った主張を機械が検証しない、coding≠substance)。prose の真偽は一般に機械化不能ゆえ、(1) 規律明文化と (2) 機械化できる errata 整合の 2 段で対策。(1) .claude/CLAUDE.md PLAN Rules に『falsifiable な safety/completeness 主張 (blast radius 0 / no false positive / N green) は断定でなくテスト/コマンド引用で裏付ける』+『confirmed PLAN の誤記は後継で supersedes 宣言 + 原 PLAN に訂正注記』を追記。(2) schema に optional `supersedes: string[]` を追加し、doctor plan-supersession (hard) が『宣言された supersede 先が実在 + 原 PLAN に core-id back-reference 有』を fail-close。適用: L7-87 が supersedes=[L7-86] を宣言、L7-86 は訂正注記で双方向化。blast radius: 既存 PLAN で supersedes 宣言は L7-87 の 1 件のみ → 他 PLAN は対象外で green 維持。test 11 ケース (planCoreId/parseSupersedes/analyze 5 + loader/check 2)。typecheck/Biome/Vitest/doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - PLAN errata supersession gate + safety-claim discipline"
generates:
  - artifact_path: docs/plans/PLAN-L7-89-plan-errata-supersession-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/plan-supersession.ts
    artifact_type: source_module
  - artifact_path: src/schema/frontmatter.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/plan-supersession.test.ts
    artifact_type: test_code
  - artifact_path: .claude/CLAUDE.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-87-merged-plan-status-kind-independent.md
  requires:
    - docs/plans/PLAN-L6-09-governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-89 (troubleshoot): PLAN errata supersession gate + safety-claim discipline

## 0. Objective

PLAN に書かれる**誤った主張 (誤記)** への対策を入れる。誘因は本セッションで発見した
PLAN-L7-86 の誤記 — review_evidence/AC が「kind filter は false-positive を出さない /
blast radius 0」と断定したが、実際は false-**negative** の盲点を「問題なし」と誤って
framing したもの。機械はその真偽を一切見ていなかった。

## 1. Problem の弁別

- **一般に機械化できないもの**: 任意の prose の真偽。「この設計は妥当」「安全」等の自由記述を
  検証する gate は作れず、作ると主張すること自体が本リポが最も警戒する false-confidence の罠。
- **機械化できるもの**: ① falsifiable な主張 (blast radius 0 / no false positive / N green) は
  prose 断定でなく**テスト**で担保できる。② 誤記が後継 PLAN で訂正されたなら、その errata リンクが
  **双方向**であることは機械検証できる (片肺 = 原 PLAN が誤った主張のまま放置、を検知)。

## 2. Fix (2 段)

### 2.1 規律の明文化 (layer 1+2)

`.claude/CLAUDE.md` PLAN Rules に「PLAN claim discipline」を追記:

- falsifiable な safety/completeness 主張は、それを担保するテスト/コマンドを引用する
  (prose 断定禁止)。prose の機械的代替は real-repo regression test であって文章ではない。
- confirmed PLAN の主張が誤りと判明したら silent 上書きせず、後継が `supersedes: [旧 plan_id]`
  を宣言し、原 PLAN に後継を名指す訂正注記を付ける。

### 2.2 機械強制 (layer 3): plan-supersession gate

- schema (`src/schema/frontmatter.ts`): optional `supersedes: string[]` を追加 (errata back-link)。
- lint (`src/lint/plan-supersession.ts`): PLAN P が `supersedes: [X...]` を宣言したら各 X について
  ① X が実在する plan_id ② X の本文が P の core-id (`PLAN-<cat>-<n>`、word-boundary) を含む
  (= 双方向 back-reference) を検査。欠落 → violation。`supersedes` 非宣言の PLAN は対象外
  (prose 真偽は機械化しない)。
- doctor (`src/doctor/index.ts`): `checkPlanSupersession` を hard gate (ok 連動) として配線。

### 2.3 適用

- `PLAN-L7-87` に `supersedes: [PLAN-L7-86-merged-plan-status-deliverable-scope]` を宣言。
- `PLAN-L7-86` に PLAN-L7-87 を名指す訂正注記 (誤記の supersede) を追記済 → 双方向成立。

## 3. Acceptance Criteria — met

- [x] `supersedes` schema field を追加 (optional、後方互換)。
- [x] plan-supersession lint が「実在しない supersede 先」「back-reference 欠落の片肺 errata」を fail-close。
- [x] `supersedes` 非宣言 PLAN は対象外 (誤記の有無は判定しない = prose 真偽を機械化しない)。
- [x] core-id は word-boundary 比較 (`PLAN-L7-87` が `PLAN-L7-870` を誤マッチしない)。
- [x] L7-87↔L7-86 の errata が双方向で green。既存他 PLAN は supersedes 非宣言で blast radius 0。
- [x] PLAN claim discipline を .claude/CLAUDE.md に明文化。
- [x] test 11 ケース。typecheck / Biome / Vitest / doctor green。

## 4. Out of scope

- **prose の真偽そのものの機械検証**: 一般に不能ゆえ実装しない (false-confidence の罠を避ける)。
  本 gate は「宣言された errata の整合」のみを強制する。safety-claim をテストで裏付ける規律 (layer 1)
  は doc + reviewer 判断で担保 (機械化は falsifiable 主張のテスト化という間接形)。
- handover の「残件なし」等の false-state は別系統 (status/handover surface、merged-plan-status / IMP-139)。
