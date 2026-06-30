---
layer: L6
sub_doc: function-spec
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
plan: docs/plans/PLAN-L6-18-review-evidence-stale.md
---

> **L6 contract marker**: `analyzeReviewEvidence(input: ReviewEvidenceInput) => ReviewEvidenceResult` は unit-test 粒度の contract とする。DbC pre/post/invariant は stale approval residue を U-REVIEW-007..008 に map する。

# review-evidence stale approval lint - 機能設計 (IMP-080)

## §1 Scope（範囲）

この add-design は `review-evidence` を reverse direction に拡張する。`status: draft` または downgrade 済みの PLAN は、approval verdict 付き `review_evidence` を保持してはいけない。そのような record は un-freeze 後に残った stale approval evidence である。

この check は既存の confirmed/completed missing-evidence rule を維持しつつ、既存の `reviewEvidence.ok` doctor path を通じて stale approval detection を hard violation として追加する。

## §2 Functions（関数）

| 関数 | contract |
|---|---|
| `extractReviewEntries(content)` | `review_evidence` entry から reviewer、review kind、timestamp、tests timestamp、verdict を抽出する。 |
| `analyzeReviewEvidence(plans)` | 既存の missing-evidence rule に、non-confirmed plan 向け stale approval detection を追加する。 |
| `reviewEvidenceMessages(result)` | missing evidence message と stale approval message を分けて出力する。 |

## §3 Stale Approval Rule（失効 approval ルール）

target statuses は `confirmed` / `completed` 以外のすべての status とする。review entry に `verdict: approve`、`verdict: approve_after_fixes`、`verdict: pass` のいずれかがあれば、その PLAN を `staleApprovalViolations` に報告する。

Accepted cases（許容ケース）:

- approval evidence を持つ `confirmed` または `completed`。
- `review_evidence` を持たない `draft`。
- `request_changes` など non-approval evidence を持つ `draft`。

Rejected case（拒否ケース）:

- approval verdict を持つ `draft`。

## §4 Test Oracle（テスト oracle）

`tests/review-evidence.test.ts` と `docs/test-design/harness/L7-unit-test-design.md` で covered とする。

| ID | oracle |
|---|---|
| U-REVIEW-007 | draft + `verdict=approve` -> stale approval violation を返す |
| U-REVIEW-008 | confirmed + approve、および evidence なし draft -> ok を返す |
