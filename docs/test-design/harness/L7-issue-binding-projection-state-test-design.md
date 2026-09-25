---
title: "PLAN-L6-690 issue binding projection_state — L7 test design"
artifact_type: test_design
layer: L6
executed_at_layer: L7
status: draft
pair_artifact: docs/plans/PLAN-L6-690-issue-binding-projection-state-contract.md
parent_doc: docs/plans/PLAN-L6-690-issue-binding-projection-state-contract.md
created: 2026-09-24
updated: 2026-09-25
---

# PLAN-L6-690 issue binding `projection_state` — L7 test design

## 1. 位置付け

この文書は `PLAN-L6-690-issue-binding-projection-state-contract.md` の pair artifact である。
契約 PR では production source と test code を追加せず、後続実装 PR が Red→Green を測れる
falsifiable な oracle 候補だけを freeze する。

テスト対象の想定入力は issue binding の object であり、Issue #690 の未投影状態を digest の
推測で埋めない。`null`、空文字、未知 field は「省略」と同一視しない。

## 2. Candidate oracle matrix

| Candidate | Stimulus / mutation | Falsifiable oracle |
|---|---|---|
| `CANDIDATE-U-ISSUEBIND-001` | `projection_state: projected` の issue binding に全ゼロの `sha256:` digest を与え、`plan draft` と `plan revise` の新 revision admission を各々実行する。 | 両経路が全ゼロを typed fail-close し、PLAN source、tracked receipt、receipt chain の新規 write が 0 件になる。全ゼロを別 certificateへ変換して成功扱いにしない。 |
| `CANDIDATE-U-ISSUEBIND-002` | `projection_state: unprojected` と `projection_digest` なしの issue binding を `plan draft` と `plan revise` に与える。 | schema / admission が受理し、正規出力にも `projection_state: unprojected` が残る。`projection_digest` key、`null`、空文字を出力しない。 |
| `CANDIDATE-U-ISSUEBIND-003` | `projection_state: projected` から `projection_digest` を削除する。または `null` / 空文字へ変異する。 | schema / admission が typed fail-close し、projected を digest なしで成功扱いにしない。新規 source、receipt、ledger append は 0 件になる。 |

## 3. 実装 PR への昇格規律

- 上記 3 件は候補であり、この契約 PR では `U-*` の正規 IDへ昇格しない。
- 後続実装 PR は `src/schema/frontmatter.ts`、`src/plan-admission/policy.ts`、
  `src/plan-admission/tracked-receipt-renderer.ts`、`src/cli/plan-draft.ts` / `plan-revise.ts`
  の実際の経路を通して、各候補の Red→Green を観測する。
- 失敗時の write 件数は、実 repository の `.ut-tdd/harness.db` ではなく test fixture の
  isolated ledger / repository を用いて測定する。
- `projectForwardEscapeIssue` の CLI 配線、`eventsFor` の `event_digest` read-back、配線後の
  `unprojected` cutoff は Issue #692 の別責務であり、この pair artifact の oracle に混ぜない。

## 4. 対象外

- 既存 receipt の訂正、一括 migration、全ゼロ履歴の再発行。
- 実在しない `IssueProjected` row の生成や digest 推測。
- Issue #692 の projection journal / PLAN ledger read-only query の実装。
