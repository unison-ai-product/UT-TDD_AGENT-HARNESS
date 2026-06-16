---
layer: L6
sub_doc: function-spec-addendum
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
parent_doc: docs/plans/PLAN-L6-09-governance-enforcement.md
plan: docs/plans/PLAN-L6-09-governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
created: 2026-06-04
---

# L6 機能設計 (addendum) — governance enforcement lints (A/B/C, IMP-064/065/051)

> **layer (作成層 = V-pair key)**: L6 (機能設計) / **pair**: L7-unit-test-design §1.12 (U-SCRUMREV / U-PROP / doctor-hard)
> **位置づけ**: plan lint engine (`src/plan/lint.ts` stub) の本実装を待たず、**今 session で2回再発した process 漏れ (IMP-064 PoC→Reverse 欠落 / IMP-065 L0→L3 伝播漏れ)** を CI で止めるための最小 enforcement。純関数 lint + 実 repo vitest ガードで「CI が回す vitest」ベクトルに乗せ fail-close 化する (新 hook 不要)。

## §1 対象と非対象

- **対象**: ① scrum-reverse lint (A、IMP-064) / ② backfill hard-fail の doctor.ok 連動 (B、IMP-051) / ③ propagation lint (C、IMP-065)。
- **非対象 (DEFER)**: plan lint engine 本体 (§1.10 全ルール) / vmodel-lint (layer pairing、state DB 依存) / cross-check engine 汎用形 (IMP-033) / kind×layer guard (§1.6 PO 確定待ち)。本 addendum は「安く今入る 3 本」に限定する。

## §2 関数仕様

### §2.1 scrum-reverse lint (`src/lint/scrum-reverse.ts`)

- `analyzeScrumReverse(plans): { pocOrphans, badReverseRefs, ok }`。
- **pocOrphans**: `kind=poc` ∧ `decision_outcome=confirmed` ∧ `promotion_strategy ∉ {redesign}` ∧ それを requires/references する `kind=reverse` PLAN が無い。→ §1.2「confirmed poc は reverse PLAN を起こす」違反 (IMP-064)。redesign は throwaway 再設計で Forward 再実装のため Reverse 不要 (concept §10.2、例 DISCOVERY-02)。
- **badReverseRefs**: `kind=reverse` が requires/references する poc が `decision_outcome≠confirmed` (rejected/pivot/未確定)。→ §1.2 line 139「rejected/pivot への接続は exit 1」。
- `ok = pocOrphans=0 ∧ badReverseRefs=0`。path 末尾一致は `/id.md` 境界固定 (別 id suffix 誤マッチ防止、backfill-pairing と同方針)。

### §2.2 backfill hard-fail の doctor.ok 連動 (B、`src/doctor/index.ts`)

- 既存 `analyzeBackfill.ok` (required orphan=0 ∧ glossary gap=0) は実装済だが doctor は `ok:true` 固定だった。
- `checkBackfillResult(repoRoot): { messages, ok }` を追加し `runDoctor.ok = backfill.ok ∧ scrumRev.ok ∧ propagation.ok` に連動。handover/agent-slots は warn-only (鮮度/運用 surface、ok を落とさない)。
- CI fail-close は既存 `tests/backfill-pairing.test.ts U-BACKFILL-006` (実 repo ガード) が担う。doctor.ok 連動は local `ut-tdd doctor` の parity。

### §2.3 propagation lint (`src/lint/propagation.ts`)

- `analyzePropagation(conceptText, requirementsText): { conceptOnly, requirementsOnly, ok }`。
- 両 doc の `| signal | mode |` ヘッダを持つ routing テーブル**だけ**から signal 列 token を抽出し集合一致を要求 (`extractSignals`)。他テーブル (decision_outcome/reverse_type/kind) は巻き込まない。interrupt 行は subtype 表記が非対称ゆえ除外。
- `ok = conceptOnly=0 ∧ requirementsOnly=0`。concept §2.6 (上位 narrative) ⇔ requirements §7.8.1 (機械 routing SSoT) の signal 語彙ドリフトを検出 (IMP-065)。

### §2.4 FR gate/review aliases

These aliases bind FR-L1-05 and FR-L1-17 to this addendum so the FR coverage matrix cannot point to prose-only governance scope.

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `evaluateGateReview` | evaluateGateReview(input: GateReviewInput, deps: GateReviewDeps) => GateReviewResult | gate id, execution mode, review kind, worker model, and reviewer/checklist evidence are supplied. | returns pass only for valid cross-agent, intra-runtime, or human review evidence by mode. | naive self-review and same-model approval are never valid judgment-gate evidence. | U-FR-L1-05 |
| `checkReviewEvidence` | checkReviewEvidence(input: ReviewEvidenceInput, deps: ReviewEvidenceDeps) => ReviewEvidenceResult | target PLAN frontmatter and current test/doctor evidence are supplied. | returns violations for missing review evidence, invalid review tier, or test-after-review ordering. | confirmed/completed design or implementation PLANs cannot silently skip review evidence. | U-FR-L1-17 |
| `analyzeRuleDrift` | analyzeRuleDrift(docs: RuleAdapterDocs) => RuleDriftResult | AGENTS / CLAUDE adapter docs are supplied as text. | returns missing shared markers and forbidden legacy adapter markers for old runtime command routing, env prefixes, local state paths, and agent names. | adapter docs cannot silently reintroduce legacy runtime routing while marker parity remains green. | U-RDRIFT-001..004 |

Type/pseudocode substance:

| function | type body | pseudocode / implementation_state |
|---|---|---|
| `evaluateGateReview` | `GateReviewInput { gate_id; execution_mode; review_kind; worker_model; reviewer_model?; human_signoff?; checklist_evidence[] } -> GateReviewResult { ok; violations[]; accepted_tier }` | implemented by `src/gate/review-tier.ts`; pseudocode = load gate policy, reject same-model self approval, accept cross-agent/intra-runtime/human only when required evidence exists |
| `checkReviewEvidence` | `ReviewEvidenceInput { plan_path; frontmatter; tests_green_at?; reviewed_at?; doctor_ok? } -> ReviewEvidenceResult { ok; missing[]; stale_approval[]; ordering_violations[] }` | implemented by `src/lint/review-evidence.ts`; pseudocode = parse PLAN review_evidence, require reviewer/verdict for confirmed/completed, reject draft approve residue and test-after-review ordering |

## §3 統合点

- `src/doctor/index.ts`: 3 lint を `runDoctor` に hard-fail 連動 (warn-only の handover/agent-slots と分離)。
- 各 lint に実 repo vitest ガード (U-SCRUMREV-005 / U-PROP-004 / 既存 U-BACKFILL-006) → CI (vitest) で fail-close。

## §4 fail-close 段階

- 本 addendum = **CI vitest ガード + doctor.ok hard-fail** の2点で fail-close。
- DEFER: pre-push hook / plan lint engine への統合 (§1.10 ルールと一括強制) は `src/plan/lint.ts` 本実装時。

## §6 用語更新

- **scrum-reverse lint**: PoC confirmed (redesign 除く) ⇔ Reverse 合流 / reverse→confirmed poc 参照の整合検査 (§1.2)。→ concept §10.3 へ back-merge。
- **propagation lint**: concept §2.6 ⇔ requirements §7.8.1 の signal 語彙一致検査 (L0⇔L3 伝播ドリフト検出)。→ concept §10.3 へ back-merge。
