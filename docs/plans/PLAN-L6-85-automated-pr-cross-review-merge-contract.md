---
plan_id: PLAN-L6-85-automated-pr-cross-review-merge-contract
title: "PLAN-L6-85 (add-design/function-spec): certificate駆動draft PR・cross review・main merge契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - PR lifecycle・accept・merge gate判定"
  - role: se
    slot_label: "SE - GitHub port/outbox/reconciliation契約"
  - role: qa
    slot_label: "QA - HEAD/CI/review freshness・障害再開oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
  requires:
    - docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
  references:
    - docs/templates/github/common/PULL_REQUEST_TEMPLATE.md
    - docs/design/harness/L6-function-design/cross-review-enforcement.md
    - docs/design/harness/L6-function-design/test-before-review.md
  blocks:
    - docs/plans/PLAN-L7-439-cross-review-merge-learning-closure.md
---

# PLAN-L6-85: certificate駆動draft PR・cross review・main merge契約

## 1. 目的

eligibleなReentryCertificateからdraft PRを自動生成し、同じHEADに対するCIと別provider cross reviewを
揃え、Forward accept判定後にだけmainへmergeする。PR作成成功を完了扱いせず、
`certificate -> draft PR -> CI -> review -> accept -> merge -> main検証`を一つの監査可能なstate machineにする。

## 2. PR生成契約

`RequestDraftPullRequest`はcertificate ID/digest、source branch/HEAD、base branch/revision、Issue back-reference、
origin/reentry tuple、drive model、test evidence digestを必須とする。eligibleでないcertificate、stale base、
dirty/unpushed HEAD、同一certificateの別PRは拒否する。

生成PRは必ずdraftで開始し、bodyに次を含む。

- off-Forward Issueへの`Refs`と、close可能時だけの`Closes`
- origin asset/revision/L/state、drive model、reentry target
- intermediate/post-reentry test profileとdigest
- dependency impact/backprop結果、既知gap、rollback/recovery route
- ReentryCertificate ID/digestとsubject HEAD

PR bodyは説明用projectionであり、accept判定はExecution Ledgerのtyped evidenceを正本として行う。

## 3. Cross review契約

- author/workerと異なるprovider familyをreviewerに割り当てる。別model名でも同一providerならcross reviewではない。
- claim-blind laneはartifact + spec/AC + reviewer自身が取得したtest/CIを判定する。
- spec-blind laneはartifact単体の矛盾、dead path、境界欠落、危険な権限・副作用を攻撃する。
- reviewはCI green後に開始し、verdictは`PASS | PASS-WEAK | FLAG`とattack/refutation citationを持つ。
- PASS-WEAKは3件以上のattack trialを必要とする。FLAG未解消、review時刻逆転、reviewer provider同一、
  review後のHEAD更新はaccept不可とする。
- review comment投稿失敗時もLedger receiptを保持するが、GitHubへreconcileされるまでmerge不可とする。

## 4. HEAD / CI / accept / merge gate

`evaluatePullRequestAcceptance`は以下を全て満たす同一subject HEADだけを`accepted`にする。

1. ReentryCertificateがeligibleかつbase/headに対してfresh。
2. draft PRが存在し、Issue・origin・drive model・reentry targetのprojectionが一致。
3. universal `harness-check`のrequired contextが成功し、runのhead SHAがPR HEADと一致。
4. required local/integration/system profileがgreenで、tests-before-review順序を満たす。
5. 別providerのclaim-blind/spec-blindに未解消FLAGがない。
6. PLAN/Forward FSMの`reviewed -> accepted` evidence policyを満たす。
7. branch protection、approval、人間signoff対象、security/PII/production escalationを満たす。

accept後に`MarkReadyForReview`、`RequestMerge`を順にappendする。merge methodはrepository policyに従い、
main SHA/merge commit/PR number/closed Issue/CI runを`MergeObserved`として記録する。
merge直前にHEAD/base/review/CIを再読込し、変化があればacceptをstale化して再検証する。
merge後main CI失敗は成功を上書きせず`PostMergeRegressionDetected`をappendし、新しいRecovery/Incident Issueへrouteする。

## 5. GitHub障害耐性

- GitHub mutationはoutbox commandとして永続化し、timeout/rate-limit/5xx/応答喪失を同じidempotency keyで再送する。
- create PR/review/mergeの応答不明時はまずremoteをqueryし、存在確認前に再作成しない。
- exponential backoff + jitter、retry budget、`retry_after`、circuit open、manual resumeをtyped eventで残す。
- GitHub不通中もlocal test/review packet生成は進められるが、remote CI確認・review projection・mergeはfail-closeする。
- 復旧時はLedgerとGitHub snapshotを双方向reconcileし、外部だけに存在するPR/mergeやforce-pushをfinding化する。
- credentials、provider transcript、secretはLedger/PR bodyへ保存せず、ID/digest/redacted summaryだけを保持する。

## 6. L6↔L7 pair / oracle

`U-PRFLOW-*` / `P-PRFLOW-*`で次を固定する。

1. eligible certificateだけがdraft PRを一度だけ作れる。
2. CI run SHA、reviewed SHA、certificate subject SHA、PR HEADのいずれかが違えばaccept/merge不可。
3. authorとreviewerのprovider family同一、FLAG残存、tests-before-review違反を拒否する。
4. draft解除、accept、mergeの順序を飛ばすevent列がterminal successへ到達しない。
5. timeout直後のremote成功、rate-limit、5xx、circuit-open、再開でPR/mergeが重複しない。
6. merge直前force-push/base更新をstale化し、古いCI/reviewを流用しない。
7. merge後main CI failureがoff-Forward IssueとRecovery/Incident routeを生成する。

## 7. AC

- [ ] eligible certificateからのみ、完全なtrace bodyを持つdraft PRが冪等生成される。
- [ ] 別provider cross reviewとclaim-blind/spec-blind verdictが同一HEADへ固定される。
- [ ] HEAD/CI/test/review/accept/mergeの全gateが順序付きかつfail-closeである。
- [ ] GitHub障害、応答喪失、rate-limit、force-pushから重複・誤mergeなく再開できる。
- [ ] merge後main CIとIssue closeを観測し、退行は新しいoff-Forward routeへ戻す。
- [ ] `U/P-PRFLOW-*` Red、独立review、L7-439実装、Reverse backfill後にconfirmed化する。

## 8. GitHub object binding / closure契約

branch作成、draft PR、CI、review、mergeは同じ`plan_id`と`project_item_id`へbindingする。
各provider eventは対象HEADを伴い、stale HEADのCI成功・承認・merge結果を現在ゲートへ
流用してはならない。

PR traceの`plan_revision`は明示必須であり、local schedule revisionからのfallbackは禁止する。
repository同期はremote snapshotをSQLite transaction外で観測し、revision/HEAD/closure条件を
検証した後、確定したbinding群を単一transactionでcommitする。network/API呼出しをtransaction
内へ持ち込まない。

PR bindingが選択したexact HEADとProject itemの`head_sha`が同一revision内で競合する場合は、
PR HEADを保持して同期状態を`不整合`にする。Project itemの遅延観測が新しいPR HEADを
上書きしてはならない。

merge後はmain上の必須CIとaccept evidenceを確認してからPLANを完了し、Project itemの
現在ゲート、CI状態、レビュー状態、対象HEAD、同期状態を更新する。同じclosure処理で
後続PLANを再評価し、新たに解放された項目を`着手可能`へ投影する。

完了statusはclosure証拠の代替ではない。CI成功、review承認、Project同期、main CI成功を含む
検証済みmerge receiptが同じPLAN revisionとPR HEADへ結合されるまで`merge-closure`で阻害する。
merge receiptはrepository同期だけが生成し、汎用の手動観測入口から作成できない。後続観測で
main CI、Issue close又はaccept条件が崩れた場合は同じprovider identityのreceiptを失効させ、
古い成功receiptを完了判定へ再利用しない。

closure receiptは`plan_id`、PLAN revision、PR number/HEAD、merge SHA、PR/main双方の
required `harness-check` identity、claim-blind/spec-blind各receipt digest、Issue close結果を
型付きで保持し、自己digestを検証する。各review receiptはPLAN正本由来の`cross_agent`
evidence自身にimmutableなPLAN revisionとsubject HEADを持ち、lane、worker/reviewerの異なる
provider family、PASS系verdict、tests-before-review順序、attack trial、citationを満たす。
両laneの結合digestがPR traceの`review_receipt_digest`と一致しなければならない。read projectionも
現在の両lane evidenceからdigestを再計算し、HEAD更新、片lane欠落、レビュー撤回・差替え後に
古いclosure receiptを有効化しない。DB rowだけを直接注入しても証拠にはならず、`source`は
repository root配下のcanonical `docs/plans/*.md`に限定し、その現行frontmatterに全fieldが
exactly once存在することをsync/read双方で再照合する。
