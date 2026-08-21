---
plan_id: PLAN-L7-498-green-command-anchor-reachability
title: "PLAN-L7-498 (add-impl): 新規 green_command entry の anchor 到達可能性を PR 基準で検査する (issue #367)"
kind: add-impl
layer: L7
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-08-21
updated: 2026-08-21
owner: PO / Claude
github_issue_id: 367
parent_design: docs/design/harness/L6-function-design/test-before-review.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: aim
    slot_label: "AIM - 検査基準点を main ではなく PR に置く境界と、基準点が解決できない面の縮退規則の確定"
  - role: qa
    slot_label: "QA - squash merge 済み anchor と捏造 anchor の両方を fixture 化し、CI の clone 形状で実測する"
generates:
  - artifact_path: docs/plans/PLAN-L7-498-green-command-anchor-reachability.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-497-green-command-anchor-required.md
  requires:
    - PLAN-L7-497-green-command-anchor-required
  blocks: []
  references:
    - docs/plans/PLAN-L7-303-digest-commit-anchor.md
    - docs/plans/PLAN-REVERSE-498-green-command-anchor-reachability-backfill.md
    - src/lint/review-evidence.ts
    - src/lint/green-command-digest.ts
    - src/lint/merged-plan-target-evidence.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/367
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-498: 新規 green_command entry の anchor 到達可能性検査

## 1. 事故と、なぜ字面検査では足りないか

`PLAN-L7-497` (issue #191) で `anchor_commit` を全 entry 必須にしたが、検査は
**`^[0-9a-f]{7,40}$` の字面のみ**である。したがって `0000...0` のような**実在しない 40 桁**を
書いても `review-evidence` gate を通る。

さらに `green-command-digest` は commit 不在を `unverifiable` として**無視する**
(GC / shallow 対応の意図的な fail-open)。よって捏造 anchor は digest 監査も素通りする。

結果、「anchor があるので証跡は永続検証可能」という主張が**実在しない anchor でも成立する**。
`PLAN-L7-303` が anchor 方式で得ようとした「測定時点の固定」は、字面だけでは成立しない。

## 2. 設計判断 (freeze)

### 判断点 1: 基準点をどこに置くか

| 案 | 内容 | 判定 |
|---|---|---|
| A | main から到達可能かを検査する | **実測で棄却済み** |
| B | **PR が新規追加した entry の anchor を、その PR の head から到達可能かで検査する** | **採択** |
| C | 検査しない (現状維持) | 不採択 |

**A を棄却した根拠 (issue #367 の実測)**: `PLAN-L6-101` の anchor `040a9f85` は PR #358 の
pre-merge head であり、その head で CI が 3/3 green を出して merge の根拠になった**正しい anchor**
である。しかし #358 は squash merge で `03e61b86` になり branch も削除されたため、main から到達
不能である。CI の fresh clone には object 自体が無い。**squash merge 運用では「anchor が main から
到達不能」ことが正常状態**であり、捏造と区別できない。実測で 29 件の false positive を出した。

**B を採る根拠**: 記録した本人の branch 上なら anchor は必ず到達可能なので、捏造 anchor は落ちる。
merge 後に到達不能になっても、その時点で検査済みなので再検査しない = squash merge と両立する。

### 判断点 2: 「新規追加した entry」をどう判定するか

**PR diff (`mergeBase..HEAD` の `docs/plans/*.md` 差分) から導出する。自己申告値を使わない。**

`PLAN-L7-497` の初版は `completed_at` (書き手が編集できる値) で新旧を判定しようとして迂回可能に
なった。同じ轍を踏まない。diff は書き手が偽装できない (偽装するには実際にその内容を commit する
必要があり、その時点で anchor も branch 上に存在することになる)。

### 判断点 3: 到達可能性の判定方法

**`git merge-base --is-ancestor <anchor> <PR head>` を使う。`git cat-file -e` を使わない。**

`cat-file -e` は **object がローカルに存在するか**を見るだけで、環境依存である。実際 PR #361 の
実在検査はローカル clone に fetch 残骸があったため全件通り、**CI で初めて 29 件落ちた**。
`--is-ancestor` は祖先関係という実在の関係を見るので、fetch 状態に左右されにくい。

### 判断点 4: 基準点が解決できない面をどうするか

**`mergeBaseSha` と `subjectHeadSha` の**両方**が解決できたときだけ検査を有効化し、片方でも
欠けたら検査ごと落とす (縮退)。**推測で violation を作らない。

これは `PLAN-RECOVERY-20` が `merged-plan-status` の三点比較で採ったのと同じ規律である。
欠け方は (a) PR event が無い (ローカル doctor / 非 PR 実行)、(b) event はあるが object を解決
できない (shallow / branch 削除後) の 2 通りで、どちらも「分からない」という点で同じなので同じ
扱いにする。

CI の `pull_request` run では両方が揃うため、本 issue が対象とする PR CI での fail-close は
失われない。

## 3. 実装契約

`review-evidence` へ violation reason を 1 つ追加する:

| reason | 条件 |
|---|---|
| `unreachable_anchor_commit` | PR が新規追加した green_command entry の `anchor_commit` が PR head から到達不能 |

既存の `missing_anchor_commit` / `invalid_anchor_commit` (`PLAN-L7-497`) と
`green-command-digest` の `unverifiable` fail-open は**変更しない**。本 PLAN は「新規 entry の
anchor が実在すること」だけを足す。

入力は `resolveMergedPlanTargetEvidence` が既に持つ `mergeBaseSha` / `subjectHeadSha` を再利用し、
新しい解決経路を作らない。

## 4. 受入条件

1. 新規追加 entry が `0000...0` のような到達不能 anchor を持つとき fail-close する。
2. **squash merge 済みで main から到達不能な既存 entry は落ちない** (実 repo の全 entry が通過する
   ことを実測で確認する。prose の claim で代替しない)。
3. `mergeBaseSha` / `subjectHeadSha` のいずれかが解決できない面では検査ごと落ちる (2 面とも回帰化)。
4. **CI の clone 形状を前提条件として明示的に確認する。** 「ローカルで通った」を根拠にしない
   (issue #367 の注意書き。PR #361 の実在検査がこれで 29 件の false positive を出した)。

## 5. 非目標

- 既存 entry の anchor 実在検査 (squash merge 後は原理的に判定不能)。
- merge 後の再検査。
- `green-command-digest` の `unverifiable` を fail-close へ変えること (GC / shallow で正当に
  検証不能な面が実在するため)。
