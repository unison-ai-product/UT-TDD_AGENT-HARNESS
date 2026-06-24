---
plan_id: PLAN-L7-143-harness-db-warn-remediation
title: "PLAN-L7-143 (troubleshoot): harness.db actionable-warn remediation — document-export over-redaction (\\b), guardrail same-provider advisory projection-gate parity, and missing-test-plan-id registration backfill"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-24
updated: 2026-06-24
owner: PM (Opus) / PO (人間)
backprop_decision: not_required
backprop_decision_reason: "Harness self-application false-positive remediation + retroactive traceability registration. (1) document-export redact regex over-matched innocent hyphenated words; (2) the guardrail invariant PROJECTION advisory is aligned to the EXISTING doctor hard gate's review_kind scoping (the SSoT inspectGuardrailInvariants and the doctor fail-close gate are unchanged — only the non-blocking warn projection); (3) 16 pre-discipline harness-gate test files are registered for V-model traceability. No product requirement / design / test-design contract changes."
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-24T17:46:00+09:00"
    tests_green_at: "2026-06-24T17:44:30+09:00"
    verdict: pass
    scope: "PM (Opus) self-review of the three fixes: (Fix1) \\b word-boundary on the sk- redact pattern eliminates the 16 over-redactions while keeping a real standalone sk- key redacted (U-DOCEXPORT-005 + new U-DOCEXPORT-005b); (Fix3) same-provider-cross-review advisory scoped to review_kind=cross_agent to match the doctor hard gate (concept §2.1.2.1), same-model-self-review intentionally left unscoped; (Fix2) 16 unregistered harness-gate test files registered to this PLAN as their single traceability anchor. Verified via targeted vitest (19 pass), db rebuild (16/101/111 -> 0), typecheck, biome, doctor."
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/document-export.test.ts tests/guardrail-invariant-advisory.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T17:44:00+09:00"
        evidence_path: tests/guardrail-invariant-advisory.test.ts
        output_digest: "sha256:6db39c54697b5f638deb7972368e178458385cdb68a047d5da5e362e97c5ae23"
  - reviewer: codex-gpt-5.x
    review_kind: cross_agent
    reviewed_at: "2026-06-24T17:57:00+09:00"
    tests_green_at: "2026-06-24T17:44:30+09:00"
    verdict: approve
    scope: "Cross-runtime (codex/gpt-5.x) desk review of Fix1/Fix3/Fix2 via `ut-tdd codex --role qa --execute`. Q1 (Fix1 \\b no false-negative, sk-ant- still matches) TRUE; Q2 (same-provider scoped, same-model unscoped asymmetry sound) TRUE; Q3 (single-anchor retroactive registration is cleanest closure) TRUE; Q4 (SSoT + doctor hard gate + write-path fail-close unchanged, only non-blocking surfaces moved) TRUE. Verdict approve."
    worker_model: claude-opus-4-8
    reviewer_model: codex-gpt-5.x
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/document-export.test.ts tests/guardrail-invariant-advisory.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T17:44:00+09:00"
        evidence_path: tests/guardrail-invariant-advisory.test.ts
        output_digest: "sha256:6db39c54697b5f638deb7972368e178458385cdb68a047d5da5e362e97c5ae23"
agent_slots:
  - role: tl
    slot_label: "TL — document-export redact + guardrail advisory scoping"
  - role: aim
    slot_label: "AIM — detection triage + test-registration backfill + cross-runtime review"
generates:
  - artifact_path: docs/plans/PLAN-L7-143-harness-db-warn-remediation.md
    artifact_type: markdown_doc
  - artifact_path: src/export/document-export.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/agent-guard.test.ts
    artifact_type: test_code
  - artifact_path: tests/asset-drift.test.ts
    artifact_type: test_code
  - artifact_path: tests/doc-consistency.test.ts
    artifact_type: test_code
  - artifact_path: tests/drive-model-passage.test.ts
    artifact_type: test_code
  - artifact_path: tests/entity-coverage.test.ts
    artifact_type: test_code
  - artifact_path: tests/fr-registry-audit.test.ts
    artifact_type: test_code
  - artifact_path: tests/g3-trace.test.ts
    artifact_type: test_code
  - artifact_path: tests/gate-review-tier.test.ts
    artifact_type: test_code
  - artifact_path: tests/handover-completion-wording.test.ts
    artifact_type: test_code
  - artifact_path: tests/placeholder-deps.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-id-naming.test.ts
    artifact_type: test_code
  - artifact_path: tests/rule-automation-closure.test.ts
    artifact_type: test_code
  - artifact_path: tests/rule-drift.test.ts
    artifact_type: test_code
  - artifact_path: tests/schema.test.ts
    artifact_type: test_code
  - artifact_path: tests/sub-doc-catalog-drift.test.ts
    artifact_type: test_code
  - artifact_path: tests/sub-doc-section-structure.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-74-task-risk-whole-word-match.md
    - docs/plans/PLAN-L7-48-readiness-guardrail.md
    - docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
---

# PLAN-L7-143 (troubleshoot): harness.db actionable-warn remediation

> **訂正 (errata, 2026-06-24)**: 本 PLAN の §2/§5/§7 で採用した
> 「same-model-self-review advisory は意図的に scoping しない (asymmetry)」という判断は
> **誤り**で、**PLAN-L7-144 が full projection-gate parity に訂正**した。concept §2.1.2.1 は
> intra_runtime_subagent (Tier ②) の同一モデルを設計上 sanctioned としており、advisory が
> それを叩くのは設計・doctor hard gate と矛盾していた。same-model も same-provider と同じく
> `review_kind=cross_agent` 限定が正しい。本 PLAN の他の成果 (Fix1 redaction `\b` /
> Fix2 test registration / Fix3 same-provider scoping) は正しく、有効なまま存続する。

## 0. 検出 (harness.db feedback_events、PO「包めて進めて」2026-06-24)

`ut-tdd feedback list` の actionable(warn)上位に3つの修正対象 debt が滞留していた。
敵対的検証 (workflow harness-db-detection-audit + PM 直接裏取り + Codex cross-runtime) で
3件を「実 false-positive / traceability gap」、残り (same-model 37 / unresolved-join 95) を
別性質と切り分けた。本 PLAN は前者3件を1つの triage anchor で是正する。

| 検出 | 件数 | 種別 | 是正 |
|---|---|---|---|
| `redacted-sensitive-field` | 16 | document-export の過剰 redaction | Fix1 |
| `guardrail-invariant-advisory:same-provider-cross-review` | 101 | projection と hard gate の review_kind scoping 乖離 | Fix3 |
| `missing-test-plan-id` | 111 (16 file) | テストの PLAN 未登録 (traceability gap) | Fix2 |

## 1. Fix1 — document-export over-redaction (src/export/document-export.ts)

`redactText` の API キー pattern が語境界の無い `sk` ハイフン pattern で、innocent な
ハイフン語の **内部** に現れる `sk` ハイフン部分文字列を機微キーと誤認していた:

- `task-classify` / `risk-policy` / `desk-review` / `task-complexity` / `task-capable` の中の
  ta-sk / ri-sk / de-sk 部分が `sk` ハイフン pattern に一致していた。
- 16 の正本 doc (functional-requirements / requirements_v1.2 / 複数 PLAN / test-design 等) が
  毎 rebuild で `redacted-sensitive-field` を1件ずつ発火 (= 16件)。raw-payload field 用の
  pattern-2 は全 doc 0件で無関係 (本 PLAN でもその field 名 literal は書かない、self-trigger 回避)。

**是正**: pattern 先頭に `\b` 語境界を付与。実キーは空白/引用符に続く standalone token なので
redaction を維持し、`task`/`risk`/`desk` のように直前が word 文字の `sk` 部分文字列には
一致しない。PLAN-L7-74 の whole-word risk-match と同型の対処。
(本 PLAN 本文では standalone な `sk` ハイフン例示語を書かない — 修正後は正しく redaction
されるため、self-trigger を避ける。)

## 2. Fix3 — guardrail same-provider advisory の projection-gate parity (src/state-db/projection-writer.ts)

doctor の hard gate (`src/doctor/index.ts` checkGuardrailInvariants、concept §2.1.2.1) は既に
`same-model-self-review` / `same-provider-cross-review` を **`review_kind=cross_agent` のみ**
hard-block し、`intra_runtime_subagent` (単一 runtime の正規 review tier) は許容している。
ところが `projectGuardrailInvariantAdvisories` は review_kind を見ず **全 review_kind** に
advisory を発火させていた = projection と gate の乖離。

実データ上、101件の `same-provider-cross-review` は **全て `intra_runtime_subagent` 由来**
(codex/codex-intra ×57、claude-opus/claude-sonnet ×21、codex-gpt5/intra ×15 など)。
`cross_agent` レビューは全て真にクロス provider (claude↔codex) で違反0。つまり101件は
単一 runtime で **構造的に不可避** な同一 provider を「違反」と誤標識した noise。

**是正**: projection で `same-provider-cross-review` を **`review_kind=cross_agent` 限定** に
し、gate と整合させる。`same-model-self-review` は **意図的に scoping しない**: 同一モデルが
自分の出力を見る self-review はどの tier でも回避可能 (例 opus worker + sonnet reviewer) で、
warn nudge を hard block より広く保つのが正しい (= 37件は by-design の nudge、本 PLAN で消さない)。
SSoT (`inspectGuardrailInvariants`) と write-path fail-close は不変、surface する advisory のみ調整。

## 3. Fix2 — missing-test-plan-id registration backfill

16のテストファイルが **どの PLAN の `generates` にも登録されておらず** (test-case catalog の
`planByPath` 引き当てに失敗 → 111 test-case が `missing-test-plan-id`)。これらは
harness self-application の lint/guard/governance gate テストで、generates-registration 規律が
入る前の IMP/audit cycle で導入された (git 履歴上 clean な所有 PLAN を持たない)。さらにその
source module の一部 (agent-guard / asset-drift / doc-consistency / entity-coverage /
fr-registry-audit / g3-trace / schema / sub-doc-catalog-drift / sub-doc-section-structure) も
未登録、`handover/index.ts` / `schema/frontmatter.ts` は複数 PLAN 共有で **clean な1:1 所有が無い**。

**是正方針 (散在でなく単一 anchor)**: 確定済み PLAN へ任意属性で散らす (gate risk + 恣意的
attribution = coverage≠substance) のを避け、本 remediation PLAN を **16テストの単一
traceability anchor** として `generates` 登録する。これは「production」でなく「retroactive
registration」であることを本節で明記する (落とさない仕組みの honest な closure)。

対象16ファイル: agent-guard / asset-drift / doc-consistency / drive-model-passage /
entity-coverage / fr-registry-audit / g3-trace / gate-review-tier /
handover-completion-wording / placeholder-deps / plan-id-naming / rule-automation-closure /
rule-drift / schema / sub-doc-catalog-drift / sub-doc-section-structure (`tests/*.test.ts`)。

## 4. Acceptance Criteria

- db rebuild 後、`redacted-sensitive-field` == 0、`guardrail-invariant-advisory:same-provider-cross-review` == 0、`missing-test-plan-id` == 0。
- `guardrail-invariant-advisory:same-model-self-review` は **維持** (cross_agent 限定にしない)。
- `inspectGuardrailInvariants` (SSoT) と doctor hard gate / write-path fail-close は挙動不変。
- 実キー (`sk-` + standalone token) は引き続き redaction される (U-DOCEXPORT-005)。
- innocent な `task-`/`risk-`/`desk-` 語は redaction されない (U-DOCEXPORT-005b)。
- typecheck / biome / vitest / doctor / plan lint green。

## 5. 再発防止 (coverage≠substance)

- `tests/document-export.test.ts` U-DOCEXPORT-005b: innocent hyphenated 語が redact されず
  `redacted-sensitive-field` finding を出さないことを機械固定。
- `tests/guardrail-invariant-advisory.test.ts`: cross_agent same-provider は発火、
  intra_runtime_subagent same-provider は抑止、intra same-model は発火することを機械固定
  (asymmetry の回帰防止)。

## 6. 残差 / スコープ外 (別件)

- Fix2 で判明した **9 orphan source module** (上記、テストの source 自体が未登録) は
  missing-test-plan-id (テスト面) の対象外。impl-plan-trace は doctor を fail させていない
  ため本 PLAN では登録せず、別 traceability backfill の候補として残す (スコープ creep 回避)。
- `unresolved-join` 95 / `same-model-self-review` 37 は本 PLAN 対象外 (前者は hook_events の
  履歴 join 性質、後者は by-design nudge)。

## 7. 壊さない / 再発させない

- 検出器ロジック自体 (document-export の redaction 意図、guardrail SSoT、doctor hard gate) は
  緩めない。是正は (1) regex の語境界、(2) projection の review_kind scoping (gate と整合)、
  (3) registration のみ。
- same-model-self-review advisory を消さない (asymmetry を明文化し回帰テストで固定)。
- registration は production を僭称せず retroactive である旨を §3 に明記。
