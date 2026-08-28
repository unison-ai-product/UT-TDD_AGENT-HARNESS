---
plan_id: PLAN-L7-521-review-consume-subject-snapshot-binding
title: "PLAN-L7-521 (add-impl): review consume subject snapshotをexact HEADへ束縛する"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-28
updated: 2026-08-28
owner: PM / PO / Codex
github_issue_id: 465
parent_design: docs/plans/PLAN-L7-465-cross-review-author-binding.md
pair_artifact: docs/test-design/harness/L7-review-consume-subject-snapshot-binding-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - consume subject snapshotとcanonical receipt commit境界の独立検収"
  - role: se
    slot_label: "SE - pre/post subject guardとtyped denyの最小実装"
  - role: qa
    slot_label: "QA - HEAD/dirty/churnの独立mutationとside-effect 0検証"
generates:
  - artifact_path: docs/plans/PLAN-L7-521-review-consume-subject-snapshot-binding.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-review-consume-subject-snapshot-binding-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-465-cross-review-author-binding.md
  requires:
    - PLAN-L7-465-cross-review-author-binding
    - PLAN-L7-520-review-receipt-supersession-contract
  blocks: []
  references:
    - docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
    - docs/plans/PLAN-L7-518-review-request-retraction.md
    - docs/plans/PLAN-L7-520-review-receipt-supersession-contract.md
    - docs/plans/PLAN-REVERSE-521-review-consume-subject-snapshot-binding-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/cli/review-live.ts
    - src/feedback/live-review-projection.ts
    - tests/review-live-cli.test.ts
    - tests/live-review-projection.test.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/465
review_evidence: []
backprop_decision: required
backprop_decision_reason: "reviewerが実際に読んだrepository snapshotとcanonical receiptのsubject custodyを強化するため、D3a契約へReverse検証を戻す。"
---

# PLAN-L7-521: review consume subject snapshot binding

## 1. Objective / TL;DR

`review live-consume`がreviewerを起動する直前とcanonical receiptを確定する直前に、実際のrepository
snapshotをcanonical requestの`exactHead`へ束縛する。review中にHEADまたはtracked contentが変わった場合、
consumerはreview結果をcanonical receiptへ昇格せず、typed reasonでfail-closeする。

## 2. Observed gap

Issue #465では同一セッション中に3回、request persist後からreview consumeまでの間にHEADまたはworking
treeが変化した。現行`dispatchLiveReview`はrequest永続化前にcommit実在性とPR HEADを検査するが、
`consumeLiveReview`はcanonical requestとenvelopeのidentityだけを比較し、reviewerが読むcheckoutのHEADと
tracked bytesを検査しない。

`PLAN-L7-465`が凍結した「stale HEADはfail-closeする」という不変条件は維持する。本PLANは既存PLANを
上書きせず、consume時のrepository snapshotとreceipt commit境界をadditiveに具体化する。

## 3. Scope

- review開始直前のsubject snapshot検査
- reviewer終了後かつcanonical receipt確定前のsubject snapshot再検査
- delegation childのreview execution resultと親consumerのcanonical receipt projectionの分離
- HEAD mismatchとdirty treeのtyped reason
- 許容するuntracked `.ut-tdd/**` runtime stateの境界
- deny時のreview execution、canonical receipt、PR comment、feedback Memoryの副作用契約
- pre/post検査を個別に破壊するmutation oracle

## 4. Non-goals

- Issue #439 / `PLAN-L7-518`のrequest retraction、mint ledger、滞留request回収
- `PLAN-L7-520`のattempt retry、audit event、create-exclusive custody semanticsの再定義
- reviewer用worktreeの作成・lease・cleanup
- tree SHA一致を旧verdict再利用の根拠にすること
- dispatch側のPR HEAD検査（Issue #456で実装済み）

## 5. Subject snapshot contract

### 5.1 Canonical observation

consumerは次の2軸を同一repository rootから観測する。

1. `git rev-parse HEAD`がrequestの40桁`exactHead`とbyte一致する。
2. `git status --porcelain=v1 -z --untracked-files=all`を分類し、tracked staged/unstaged変更が0件である。

untracked entryはcanonical repository root配下の`.ut-tdd/**`だけを許可する。`.ut-tdd/**`であっても
tracked fileの変更は許可しない。`.ut-tdd/**`外のuntracked entry、rename/copyのsourceまたはdestination、
submodule dirty、unmerged entry、status decode不能、Git command失敗はdirtyとしてfail-closeする。

symlinkやjunctionによる文字列上の`.ut-tdd/`偽装を許可しない。consumerはGitが返したrepo-relative pathを
正規化し、absolute、`..`、NUL decode不能を拒否する。ignored fileはGit statusの入力集合外であり、本PLANは
ignored stateをreview subjectへ昇格しない。

### 5.2 Two-phase fence

consumerは次の順序を守る。

1. canonical requestとreview envelopeのidentityを照合する。
2. `before_review` snapshotを取得し、HEADとdirty境界を検査する。
3. 検査成功時だけreviewerを1回起動する。
4. reviewerが終了した後、canonical receipt writeより前に`before_receipt` snapshotを再取得する。
5. 両snapshotが同じ`exactHead`を示し、両方のdirty集合が空の場合だけreceipt projectionを確定する。

`consumeLiveReview`をauthoritative fence ownerとする。`before_review`成功後だけdelegation childを起動し、
delegation childはprovider reviewerを実行してverdict artifact、spawn由来attestation、result identityだけを返す。
delegation childは`projectReviewVerdict`を呼ばず、canonical receiptを一件も書かない。

親`consumeLiveReview`は`runReview`がexecution resultを返した直後に`before_receipt` snapshotを取得する。
post fence成功後だけ、親consumerが所有するprojection portを通じて`projectReviewVerdict`を呼び、
`PLAN-L7-520`のcreate-exclusive custody semanticsを再利用してcanonical receiptをexactly once確定する。
post denyではprojection port呼出0、canonical receipt write 0とする。

このseam移動は`src/cli/delegation.ts`（childのreceipt projection除去とexecution result DTO）、
`src/feedback/live-review-projection.ts`（pre/post fenceと親projection順序）、`src/cli/review-live.ts`（port配線）、
`src/feedback/review-attestation.ts`（親から呼べるprojection/persist境界）を本PLANのimplementation scopeとして
明示所有する。result DTOまたはport型は同責務の専用moduleへ分離してよい。

post検査を`publishReceipt`（PR comment / feedback Memory派生投影）だけの前へ置く実装は禁止する。
delegation childがcanonical receiptを生成したままouter consumerへpost検査だけを追加する実装も禁止する。
post検査失敗後に既存receiptを削除・上書きして帳尻を合わせることも禁止する。

### 5.3 Typed deny

| Condition | Typed reason | Phase |
| --- | --- | --- |
| `HEAD != exactHead`、HEAD解決不能 | `consume_head_moved` | `before_review` / `before_receipt` |
| tracked変更、許可外untracked、status解決不能 | `consume_tree_dirty` | `before_review` / `before_receipt` |

reasonはCLI exit 1とJSON resultへ同じ値で貫通する。phaseは診断情報であり、reason identityを増殖させない。

## 6. Side-effect contract

| Failure point | Reviewer execution | Canonical receipt | PR comment / feedback Memory |
| --- | ---: | ---: | ---: |
| `before_review` deny | 0 | 0 | 0 |
| reviewer execution failure | 1 | 0 | 0 |
| `before_receipt` deny | 1 | 0 | 0 |
| 全条件成立 | exactly 1 | create-exclusive exactly 1 | receipt成功後だけ各1 |

本表のreviewer executionはprovider reviewer processのspawn回数を指す。`runReview`正常返却時点でも
canonical receiptは0件でなければならない。
review中の変化はreviewer起動後にしか観測できないため、`before_receipt` denyでreviewer execution 0を主張しない。
ただしcanonical receiptと全派生投影は0を厳守する。失敗attemptのretry/audit/retractionは本PLANで再定義せず、
`PLAN-L7-520`と`PLAN-L7-518`の所有境界へ送る。

## 7. Tree identityの非権限境界

実装は診断用にcommit tree OIDを観測してよい。ただしtree OID一致を別commit・rebase後のverdict流用、
request identity置換、receipt再束縛へ使用しない。判定対象はrequestが指すexact commitと、そのcheckout上で
reviewerが読んだclean tracked snapshotである。

## 8. Acceptance criteria

1. pre HEAD mismatchは`consume_head_moved`となり、reviewer/receipt/派生投影が全て0になる。
2. pre tracked dirtyと許可外untrackedは`consume_tree_dirty`となり、reviewer/receipt/派生投影が全て0になる。
3. untracked `.ut-tdd/**`だけの差は許可され、正常reviewを阻害しない。
4. review中のHEAD移動またはtracked変更はpost検査でtyped denyとなり、canonical receiptと派生投影が0になる。
5. post検査を削除、またはcanonical receipt write後へ移動するmutationは専用oracleでRedになる。
6. delegation childはexecution resultだけを返し、`runReview`返却時点のcanonical receiptが0件になる。
7. 親consumerはpost fence成功後だけ`projectReviewVerdict`を呼び、pass時はcreate-exclusive persist exactly once、
   post deny時はpersist 0になる。
8. `PLAN-L7-520`のattempt custodyとcreate-exclusive semanticsを再定義せず、確定済み契約として再利用する。
9. Linux / Windows / aggregate CIと非著者closing reviewがexact implementation HEADでGreen/PASSになる。

`src/feedback/review-attestation.ts`は`PLAN-L7-520` implementationとpathが重なるため、#521 implementationは
同レーンのmain着地後に開始する。docs-only pair-freezeは並行できるが、production path leaseを並行取得しない。

## 9. Schedule

1. [並列] 本PLAN、Reverse R0、対test-designでpre/post snapshot契約をpair-freezeする。
2. [直列] 非著者reviewでcanonical receipt commit前のpost fenceを検収する。
3. [直列] `PLAN-L7-520` implementationのmain着地後、別PRでchild execution result、親pre/post fence、
   親receipt projectionをRed→Greenする。
4. [直列] Reverse R1→R3でmutationと実repository churnをaggregate検収する。
5. [直列] Reverse R4で`PLAN-L7-465` / `PLAN-L7-493`へgap-only backfillしてmerge gateへ戻す。
