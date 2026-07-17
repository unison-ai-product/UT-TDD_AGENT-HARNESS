---
plan_id: PLAN-L7-450-test-traceability-detector-hardening
title: "PLAN-L7-450 (add-impl): test-traceability 検出器の強化 (remediation 導線分岐 / 多重所有 warn / scripts・.claude trace 盲点 / 再蓄積 standing gate) (issue #92)"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-17
updated: 2026-07-17
owner: PO / Claude (起票) / Codex (実装)
parent_design: docs/plans/PLAN-L7-44-harness-db-master.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - projection detector 改修 + trace gate 拡張"
  - role: qa
    slot_label: "QA - 検出器改修の unit oracle Red 先行 (正例/負例/退化排除)"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-450-test-traceability-detector-hardening.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires: []
  references:
    - docs/plans/PLAN-REVERSE-450-test-traceability-detector-backfill.md
    - docs/plans/PLAN-L7-143-harness-db-warn-remediation.md
    - docs/plans/PLAN-L7-144-warn-remediation-parity-and-join.md
    - src/state-db/projection-writer.ts
    - src/lint/merged-plan-status.ts
    - src/doctor/source-trace.ts
---

# PLAN-L7-450 (add-impl): test-traceability 検出器の強化

## Status

draft 起票 (2026-07-17、issue #92 の PLAN 化。2026-07-17 検出器全数監査 = PR #89 CI Red 起点)。
Reverse pairing は PLAN-REVERSE-450。

## 背景 — 機構は健全、ただし構造弱点 4 件

PR #89 (missing-test-plan-id 66 件解消) の過程で test-traceability 検出器群を全数監査した。
rebuild は tree-current (truncate→再投影で stale residue なし)、merged-plan-status /
plan-artifact-existence / impl-plan-trace / missing-test-plan-id の相補網に矛盾は無い。
一方で以下の構造弱点を確認した (issue #92):

- **W1 remediation 導線矛盾**: missing-test-plan-id (warn) の解消手段「generates へ宣言」は、
  所有 PLAN が draft のとき merged-plan-status (hard) が禁止する。正しい導線 (confirm と同時に
  宣言) が warn の next_action に現れない。PR #89 が CI Red で実証。
- **W2 多重所有 silent last-wins**: `planGeneratedPathMap` は同一 artifact_path の複数 PLAN 宣言を
  無警告で last-wins 採用する (実例: PLAN-REVERSE-448 と PLAN-L7-448 の同一 doc 二重宣言)。
- **W3 scripts/.claude の trace 盲点**: impl-plan-trace は src/ のみ、missing-test-plan-id は
  tests/ のみを被覆する。merged-plan-status は宣言済み generates しか見ないため、scripts/ と
  .claude/ に無宣言で merge された成果物だけが trace 網の外に残る。
- **W4 再蓄積 standing gate 不在**: missing-test-plan-id は PLAN-L7-143 が 111 件 backfill、
  PLAN-L7-144 が「0 のまま」を AC 記録した後、66 件まで再蓄積した (PR #89 は 3 回目の掃除)。
  issue #80 (green-command-digest) と同族の debt re-accumulation。

live-tree 測定の hybrid transience は本 PLAN のスコープ外 (issue #77 系へ合流)。

## スコープ

1. **W1**: `projectTestCaseCatalog` の missing-test-plan-id finding 生成時に、導入 commit 由来の
   所有候補が特定できる場合は候補 PLAN の status を参照し、next_action を分岐する —
   confirmed 所有候補あり=「generates へ宣言」、draft 所有候補あり=「PLAN confirm と同時に宣言
   (merged-plan-status 整合)」、候補なし=従来文言。
2. **W2**: `planGeneratedPathMultiMap` で複数 PLAN が同一 artifact_path を宣言した場合に
   `duplicate-artifact-ownership` warn finding を投影する (採用規則は現行 last-wins を維持しつつ
   明示化)。
3. **W3**: trace 網を scripts/ と .claude/ へ拡張する。設計判断 (Step 1): impl-plan-trace の
   対象 root 拡張か、独立 check (`deliverable-plan-trace`) の新設か。既存 baseline (歴史的
   無宣言物) は棚卸しして baseline ledger 化し、増分のみ fail-close する。
4. **W4**: 新規 test file (tests/ 配下 *.test.ts) が PLAN generates に無い場合の**増分 gate** を
   追加する。初期は warn 集計 (doctor)、閾値運用の実績を見て fail-close 昇格 (W3 と同じ
   baseline + 増分方式。再蓄積カーブを止めることが AC)。

## Steps (TDD Red 先行)

| Step | 内容 | mode |
|---|---|---|
| 1 | W3 方式の設計判断 (trace 拡張 vs 新設 check) + baseline 棚卸し | 直列 |
| 2 | W1/W2 unit oracle Red → projection 改修 | 直列 |
| 3 | W3/W4 unit oracle Red → gate 実装 (baseline + 増分 fail-close) | 直列 |
| 4 | real-repo regression (現 repo で W2 実例が warn 化、増分 0 で green) | 直列 |
| 5 | cross-provider blind review (非 author runtime) → confirm | 直列 |

## DoD

- [ ] W1: missing-test-plan-id の next_action が所有候補 PLAN status で分岐する (unit oracle 固定)。
- [ ] W2: 多重所有が `duplicate-artifact-ownership` warn として投影される (REVERSE-448/L7-448 の
      実例が real-repo regression で検出される)。
- [ ] W3: scripts/.claude の無宣言 merged 成果物が baseline + 増分方式で検出される (負例:
      baseline 済み歴史物は fail しない)。
- [ ] W4: 新規 orphan test file の増分が doctor で検出される (再蓄積 regression: 宣言なし test
      追加 fixture で fail、宣言ありで green)。
- [ ] PLAN-REVERSE-450 R0-R4 で実装観測が L6/test-design へ gap-only backfill されている。
