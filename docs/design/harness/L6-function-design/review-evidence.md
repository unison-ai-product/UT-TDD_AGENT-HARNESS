---
layer: L6
artifact_type: design_doc
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-06-05
plan: docs/plans/PLAN-L6-12-review-evidence.md
---

> **L6 contract marker**: `analyzeReviewEvidence(input: ReviewEvidenceInput) => ReviewEvidenceResult` is the unit-test-granularity contract. DbC pre/post/invariant maps review evidence presence and tier checks to U-REVIEW-001..008.


# review-evidence lint — 機能設計 (① / PLAN-L6-12、IMP-071)

> **V-pair**: `pair_artifact = L7-unit-test-design.md §1.15` (L6↔L7)。DbC 契約から単体テスト oracle (U-REVIEW-*) を導出。

## §0 スコープ

**review 前置 MUST の機械強制**。review 前置 (CLAUDE.md / requirements §7.8.7 / concept §2.1.2.1) は doc-only で src に強制が無く (grep 0 / plan lint=stub / doctor 非検査)、freeze (status→confirmed) / commit が review 証跡ゼロで素通りした (harness が柱 2「doc×機械厳格化」を自分のレビュー規律で破る under-design、IMP-071)。concept §2.1.2.1 は「review 記録が無ければ gate exit 1」と機械ゲート設計済だが未実装だった。本設計は **design/impl 系 PLAN が confirmed (gate/freeze 到達) なのに `review_evidence` を持たない**ことを doctor が surface する純関数 lint を定義する (既定 hard-gate、実 repo back-fill 完了後に hard 化)。

**スコープ外**: review の中身の質判定 (人間/agent の責務)。本 lint は「review 前置が記録されたか」の presence のみを機械保証する。

## §1 schema: review_evidence (frontmatter)

`src/schema/frontmatter.ts` に optional array で追加。1 PLAN に複数 entry (初回 review + freeze 後の増分追補) を append する。

```yaml
review_evidence:
  - reviewer: code-reviewer            # agent 種別 or 人間 role
    review_kind: intra_runtime_subagent # cross_agent | intra_runtime_subagent | human
    reviewed_at: "2026-06-05"           # ISO 日付
    verdict: approve                    # approve | approve_after_fixes | request_changes 等
    scope: "..."                        # 任意: 何をレビューしたか
```

- `review_kind` enum は concept §2.1.2.1 の review tier と一致: **cross_agent** (hybrid、別 runtime/model) / **intra_runtime_subagent** (claude/codex 単体、専門サブエージェント) / **human** (standalone / escalation 境界)。

## §2 純関数 (analyze)

```text
analyzeReviewEvidence(plans: ParsedReviewPlan[]) -> { missing, ok }
```

- **Precondition**: plans = 全 PLAN (archived は内部除外)。
- **対象選定 (過検知回避の根拠)**:
  - `KIND_REVIEW_REQUIRED = {design, add-design, impl, add-impl}` — 設計/実装の凍結が gate (G/R) を伴う kind。charter/poc/reverse/recovery/troubleshoot/refactor/retrofit/research は review 推奨だが confirmed=gate 到達の MUST 対象外 (過検知回避、§1.8 必須 role と整合)。
  - `STATUS_REVIEW_REQUIRED = {confirmed, completed}` — gate/freeze 到達点のみ。draft は未確定で対象外。
- **Postcondition**: `missing` = 対象 kind × 対象 status × `hasEvidence=false` の {plan_id, kind} 群。`ok = missing.length===0`。
- **hasReviewEvidence(content)**: `review_evidence:` ブロック直後に `- reviewer:` entry が ≥1 ある presence のみ検出 (shape 検証は zod frontmatterSchema が担う、二重実装回避)。

## §3 I/O loader + messages

- `loadReviewPlans(repoRoot)`: `docs/plans/` を flat 列挙し **`.md` かつ `PLAN-` prefix** のみ対象 (サブディレクトリ archive/_template はディレクトリエントリ=拡張子なしで除外 + prefix ガードで二重防御)、`parseReviewPlan` で {plan_id, kind, status, hasEvidence} に。
- `reviewEvidenceMessages(result)`: missing 0 → `"OK"` / missing あり → 件数 + plan_id 列 + 「review_evidence に reviewer/review_kind/verdict を記録」。

## §4 doctor 配線 (hard 判定、2026-06-05 昇格済)

`checkReviewEvidence(repoRoot)` を `runDoctor` に **hard 判定** (ok=false → `runDoctor.ok` 連動で fail-close) で配線。I/O 失敗も violation として ok=false を返す。backfill/scrum-reverse/propagation と同じ hard 群。

## §5 段階導入の経緯 (hard、完了)

- **初期投入**: 既存 confirmed design/impl PLAN の多くが review_evidence 未記録 (history)。doctor が件数 surface、CI は green 維持。back-fill は段階 (各 freeze の audit/handover に review 記録は存在、構造化は incremental)。
- **hard 化 (2026-06-05、完了)**: 履歴 15 件を back-fill (missing 29→0。実在 review 記録のみ転記、未記録 2 件は code-reviewer 事後 review、truncate 2 件は scope 明記の honest 記録) → `runDoctor.ok` に連動 + CI fail-close (U-REVIEW-006 実 repo ガードを `missing==[]` へ昇格)。これで **新規 design/impl PLAN の review-skip freeze が機械で止まる状態が完成**。

## §6 既存 lint との非重複

- **backfill-pairing** (impl⇔Reverse / glossary) = 「設計へ戻したか」。**review-evidence** = 「review 前置を通したか」。検査軸が直交、重複なし。
- **pair-freeze** (design⇔test-design) = ペア存在。review-evidence は review 規律。別関心。

## §7 carry

> back-fill (missing 0) と hard 化は 2026-06-05 完了 (§4/§5 に反映済)。残 carry:

- freeze 後増分追補の review (本事故の核) を確実に append させる運用補助 (将来 hook 候補) — 未着手。
- (review 由来) backfill-pairing の `checkBackfill` comment と実挙動の不整合は解消済み。`normalizeTerm` 単体テスト追加は別 IMP carry。
