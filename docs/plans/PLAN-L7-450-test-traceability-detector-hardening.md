---
plan_id: PLAN-L7-450-test-traceability-detector-hardening
title: "PLAN-L7-450 (add-impl): test-traceability 検出器の強化 (remediation 導線分岐 / 多重所有 warn / scripts・.claude trace 盲点 / 再蓄積 standing gate) (issue #92)"
kind: add-impl
layer: L7
drive: db
status: confirmed
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
review_evidence:
  - reviewer: intra_runtime_subagent
    review_kind: intra_runtime_subagent
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    tests_green_at: "2026-07-17T15:58:00+09:00"
    reviewed_at: "2026-07-17T15:59:00+09:00"
    verdict: pass
    scope: "PLAN-L7-450 の W1-W4 実装、deliverable debt 台帳の日本語 prose、U-TESTHYGIENE-028 の診断可能性を確認。"
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-17T15:58:00+09:00"
        evidence_path: .ut-tdd/audit/A-PR96-round6-typecheck.log
        output_digest: "sha256:5a3973f79ed9becd"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-17T15:58:00+09:00"
        evidence_path: .ut-tdd/audit/A-PR96-round6-lint.log
        output_digest: "sha256:882bd8da2b6c657"
generates:
  - artifact_path: docs/plans/PLAN-L7-450-test-traceability-detector-hardening.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/artifact-ownership.ts
    artifact_type: source_module
  - artifact_path: src/lint/deliverable-plan-trace.ts
    artifact_type: source_module
  - artifact_path: src/trace/generate-deliverable-trace-debt-audit.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/doctor/source-trace.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/artifact-ownership.test.ts
    artifact_type: test_code
  - artifact_path: tests/deliverable-plan-trace.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: docs/governance/deliverable-trace-debt-audit.md
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

confirmed (2026-07-17、issue #92 の PLAN 化。2026-07-17 検出器全数監査 = PR #89 CI Red 起点)。
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
  無警告で last-wins 採用する。監査時に疑った PLAN-REVERSE-448 / PLAN-L7-448 は再照合の結果、
  異なる artifact_path を宣言しており実例ではなかった。このため合成 fixture で退化を固定し、
  live repo は重複 0 を正例として固定する。
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
   `duplicate-artifact-ownership` finding を投影する。legacy baseline 外の新規重複は fail-close とし、
   last-wins で所有者を暗黙確定しない。既存重複が棚卸しで判明した場合だけ、所有候補・理由・
   解消期限を持つ baseline 台帳へ明示し、台帳外の重複は拒否する。
3. **W3**: trace 網を scripts/ と .claude/ へ拡張する。設計判断 (Step 1): impl-plan-trace の
   対象 root 拡張か、独立 check (`deliverable-plan-trace`) の新設か。既存 baseline (歴史的
   無宣言物) は `docs/governance/deliverable-trace-debt-audit.md` に `artifact_path` / `owner_plan` /
   `justification` / `promote_by` を持つ縮小専用台帳として固定し、実装側集合との双方向一致を
   hard gate で検査する。台帳外の増分は fail-close する。
4. **W4**: 新規 test file (tests/ 配下 *.test.ts) が PLAN generates に無い場合の**増分 hard gate**を
   追加する。既存 debt は W3 と同じ監査台帳へ明示し、台帳外の新規 orphan は同一PRのCIで
   fail-closeする。doctor は集計と remediation を表示するが、severityをwarnへ弱めない。

## Steps (TDD Red 先行)

| Step | 内容 | mode |
|---|---|---|
| 1 | W3 方式の設計判断 (trace 拡張 vs 新設 check) + baseline 棚卸し | 直列 |
| 2 | W1/W2 unit oracle Red → projection 改修 | 直列 |
| 3 | W3/W4 unit oracle Red → 台帳双方向一致 + 増分 fail-close gate 実装 | 直列 |
| 4 | real-repo regression (W2/W3/W4 の台帳外増分 0 で green、合成重複/orphan fixture は Red) | 直列 |
| 5 | cross-provider blind review (非 author runtime) → confirm | 直列 |

## DoD

- [ ] W1: missing-test-plan-id の next_action が所有候補 PLAN status で分岐する (unit oracle 固定)。
- [ ] W2: 合成 fixture の多重所有が `duplicate-artifact-ownership` でfail-closeし、live repoは
      台帳外重複0でgreenとなる。所有者をlast-winsで暗黙確定しない。
- [ ] W3: scripts/.claude の無宣言 merged 成果物が縮小専用baseline台帳 + 増分方式で検出される。
      台帳と実装側集合の片方向欠落もfailし、台帳済み歴史物だけはfailしない。
- [ ] W4: 新規 orphan test file の台帳外増分がCIでfail-closeする (宣言なし fixture でexit非0、
      宣言ありでgreen)。doctor表示とCI判定が同じfinding集合を参照する。
- [ ] PLAN-REVERSE-450 R0-R4 で実装観測が L6/test-design へ gap-only backfill されている。
