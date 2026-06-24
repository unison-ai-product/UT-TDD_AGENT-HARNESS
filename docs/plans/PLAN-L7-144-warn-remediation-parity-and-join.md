---
plan_id: PLAN-L7-144-warn-remediation-parity-and-join
title: "PLAN-L7-144 (troubleshoot): guardrail advisory full projection-gate parity (correct PLAN-L7-143 same-model asymmetry per concept §2.1.2.1) + unresolved-join work-context exemption"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-24
updated: 2026-06-24
owner: PM (Opus) / PO (人間)
supersedes:
  - PLAN-L7-143-harness-db-warn-remediation
backprop_decision: not_required
backprop_decision_reason: "Harness self-application projection false-positive remediation. (1) corrects PLAN-L7-143's same-model asymmetry to FULL projection-gate parity, aligning the non-blocking advisory with the doctor hard gate AND concept §2.1.2.1 (intra_runtime_subagent Tier ② is same-model by design); (2) exempts free-form work-context plan_id labels from the FK-resolution check. SSoT inspectGuardrailInvariants, doctor hard gate, and write-path fail-close are all unchanged. No product requirement / design / test-design contract change — this aligns the projection to the EXISTING design contract."
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-24T18:35:00+09:00"
    tests_green_at: "2026-06-24T18:34:00+09:00"
    verdict: pass
    scope: "PM (Opus) self-review: (1) same-model-self-review advisory now scoped to review_kind=cross_agent (full parity with doctor checkGuardrailInvariants + concept §2.1.2.1 Tier ②), correcting PLAN-L7-143's asymmetry; (2) checkResolvablePlanJoin exempts audit-cycle / compound work-context plan_id labels. Verified via targeted vitest (15 pass), db rebuild (same-model 38->0, unresolved-join 95->0, prior 3 stay 0), typecheck/biome/doctor."
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/guardrail-invariant-advisory.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T18:34:00+09:00"
        evidence_path: tests/guardrail-invariant-advisory.test.ts
        output_digest: "sha256:6db39c54697b5f638deb7972368e178458385cdb68a047d5da5e362e97c5ae23"
  - reviewer: codex-gpt-5.x
    review_kind: cross_agent
    reviewed_at: "2026-06-24T18:39:00+09:00"
    tests_green_at: "2026-06-24T18:34:00+09:00"
    verdict: approve
    scope: "Cross-runtime (codex/gpt-5.x) desk review explicitly REVERSING the asymmetry it approved in PLAN-L7-143, given concept §2.1.2.1 evidence. Q1 (full parity correct, L7-143 asymmetry contradicts design, parity supersedes) TRUE; Q2 (detector still armed for cross_agent same-model/provider impersonation) TRUE; Q3 (audit/compound work-context exemption correct, dangling single-PLAN ref still flagged) TRUE; Q4 (SSoT + doctor hard gate + write-path fail-close unchanged) TRUE; Q5 (supersedes + bidirectional back-reference is the right errata discipline) TRUE. Verdict approve."
    worker_model: claude-opus-4-8
    reviewer_model: codex-gpt-5.x
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/guardrail-invariant-advisory.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T18:34:00+09:00"
        evidence_path: tests/guardrail-invariant-advisory.test.ts
        output_digest: "sha256:6db39c54697b5f638deb7972368e178458385cdb68a047d5da5e362e97c5ae23"
agent_slots:
  - role: tl
    slot_label: "TL — guardrail advisory parity + join exemption"
  - role: aim
    slot_label: "AIM — concept §2.1.2.1 design verification + cross-runtime review"
generates:
  - artifact_path: docs/plans/PLAN-L7-144-warn-remediation-parity-and-join.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/guardrail-invariant-advisory.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-143-harness-db-warn-remediation.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-144 (troubleshoot): full projection-gate parity + unresolved-join exemption

## 0. 検出 (harness.db feedback_events、PO「全部潰しておいて」2026-06-24)

PLAN-L7-143 で 3 件の actionable warn を是正したが、残 2 件を切り分けた段階で
**PLAN-L7-143 自身の判断 (same-model asymmetry) が設計 (concept §2.1.2.1) と矛盾**
していたことが判明した。本 PLAN は残 2 件を是正し、その過程で L7-143 の誤判断を訂正する。

| 検出 | 件数 | 是正 |
|---|---|---|
| `guardrail-invariant-advisory:same-model-self-review` | 38 | §1 (parity 訂正) |
| `unresolved-join` | 95 | §2 (work-context 除外) |

## 1. same-model advisory の full projection-gate parity (PLAN-L7-143 の訂正)

### 1.1 PLAN-L7-143 の誤り

PLAN-L7-143 §2/§5/§7 は「same-model-self-review は意図的に scoping しない (回避可能な
nudge ゆえ warn を hard block より広く保つ)」という **asymmetry** を採用した。これは
**concept §2.1.2.1 と矛盾**する。

§2.1.2.1 の review 強度 3 ティアは、単一 runtime の正規代替である **Tier ② 専門サブ
エージェント review** を「同一 runtime 内・別 context/persona・adversarial・checklist 駆動」
と定義し、明示的に **「②は同一モデルである事実を必ず記録し (`review_kind:
intra_runtime_subagent`)、cross-provider 要件には数えない」** と述べている。つまり
**intra_runtime_subagent の同一モデルは設計上 sanctioned な正規 tier** であり、欠陥ではない。
`same_model_approval: forbidden` (核心ルール2) は **cross_agent review が同一モデルで
cross-provider を僭称する場合**に限る。

doctor の hard gate (`src/doctor/index.ts` checkGuardrailInvariants) は既にこの設計を
codify し、same-model **と** same-provider の両方を `review_kind=cross_agent` のみ
hard-block している。L7-143 は same-provider だけ projection を gate に合わせ、same-model を
asymmetry のまま残したため、projection だけが設計・gate と乖離していた。

### 1.2 是正

`projectGuardrailInvariantAdvisories` で **same-model-self-review も same-provider-cross-review と
同じく `review_kind=cross_agent` 限定**にし、doctor hard gate + 概念 §2.1.2.1 と完全整合させる
(full parity)。secret-evidence / human-required-without-evidence は review_kind 非依存で常時適用
(gate と同じ)。SSoT (`inspectGuardrailInvariants`) と write-path fail-close は不変。

実データ上、38件の same-model は全て intra_runtime_subagent (claude-opus×25 / gpt-5.4×9 /
codex×3 / human×1) = 設計 sanctioned な Tier ②。cross_agent の同一モデル (=僭称) は現存せず、
是正後 same-model advisory は 0 になるが、検出器は cross_agent 僭称に対して armed のまま残る。

## 2. unresolved-join の work-context 除外

`checkResolvablePlanJoin` は任意 projection 行の `plan_id` が plan_registry に解決しないと
`unresolved-join` を出す。95件は全て `hook_events` で、plan_id が **PLAN でない作業コンテキスト
ラベル** だった:

- audit-cycle id (例 `A-136-cycle-p4-verification-audit`)
- 複数 PLAN を跨ぐ複合ラベル (`PLAN-a+b+c` 形)

hook_events は「その時アクティブだった作業」を記録するため、これらは単一 PLAN の foreign key
ではなく dangling 参照でもない。**是正**: audit 形 (`^A-\d`) / 複合 (`+` を含む) の plan_id を
FK 解決要求から除外。削除/改名済みの**具体的な単一 `PLAN-...` 参照は引き続き flag** する
(既存テスト `model_runs:run-with-missing-plan` = `PLAN-L7-46-missing` は不変で検出)。

## 3. Acceptance Criteria

- db rebuild 後、`same-model-self-review` == 0 かつ `unresolved-join` == 0。
- PLAN-L7-143 で是正済みの 3 件 (`redacted-sensitive-field` / `same-provider-cross-review` /
  `missing-test-plan-id`) は 0 のまま。
- cross_agent の同一モデル/同一 provider review は引き続き advisory を発火 (検出器 armed)。
- 具体的単一 PLAN 参照の未解決は `unresolved-join` を引き続き発火。
- SSoT / doctor hard gate / write-path fail-close は挙動不変。
- typecheck / biome / vitest / doctor / plan lint green。

## 4. 再発防止

- `tests/guardrail-invariant-advisory.test.ts`: cross_agent same-model/same-provider は発火、
  intra_runtime_subagent same-model/same-provider は **両方とも抑止**されることを機械固定
  (full parity の回帰防止)。
- `tests/projection-writer.test.ts`: audit/複合 work-context label が `unresolved-join` を
  出さず、具体的単一 PLAN 参照の未解決は出すことを機械固定。

## 5. supersession (PLAN-L7-143 との errata)

本 PLAN は **PLAN-L7-143 の same-model asymmetry 判断のみ**を supersede する (§1)。
PLAN-L7-143 の他の成果 — Fix1 (document-export `\b` redaction)、Fix2 (16 test registration)、
Fix3 (same-provider scoping) — は**正しく、有効なまま存続**する。PLAN-L7-143 には本 PLAN への
訂正 back-reference 注記を追記済 (双方向 errata、doctor plan-supersession)。

## 6. 壊さない

- SSoT (`inspectGuardrailInvariants`) は不変 — projection が surface する範囲のみ gate と整合。
- 検出器は cross_agent 僭称 (同一モデル/同一 provider を cross と称する) に armed のまま。
- work-context 除外は具体的単一 PLAN 参照の dangling 検出を弱めない。
