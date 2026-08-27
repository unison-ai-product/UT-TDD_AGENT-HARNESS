---
plan_id: PLAN-L6-85-automated-pr-cross-review-merge-contract
title: "PLAN-L6-85 (add-design/function-spec): certificate駆動draft PR・cross
  review・main merge契約"
kind: add-design
layer: L6
drive: agent
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
    slot_label: TL - PR lifecycle・accept・merge gate判定
  - role: se
    slot_label: SE - GitHub port/outbox/reconciliation契約
  - role: qa
    slot_label: QA - HEAD/CI/review freshness・障害再開oracle
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
status: draft
sub_doc: function-spec
github_issue_id: 213
admission_receipt:
  schema_version: v2
  receipt_id: certificate:fce32baf2decfd7f43c2f8b10b345906
  command_id: command:pr210-reverse-backfill:2:1785497598366
  admitted_at: 2026-07-31T11:33:18.366Z
  source_digest: sha256:7f822e8cbc533306baccbf4702fc01c3ebb9133a4b3baec8ac84359c99ed156f
  decision_digest: sha256:07ec83f12c07e854b4218d806fab36dac4fccf407d63fe87aa17ed8bcf1cd9a8
  receipt_digest: sha256:29efb0d2e3a988b54d915c8814db722e140d916efedc3c5bfdea6b679ce9597c
  binding:
    path: docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
    plan_id: PLAN-L6-85-automated-pr-cross-review-merge-contract
    asset_id: plan:legacy:12217dd457a8fedb0c1df1449559998db289a4d264dbda0de6e35396b03cb3c0
    revision: 2
    content_digest: sha256:7f822e8cbc533306baccbf4702fc01c3ebb9133a4b3baec8ac84359c99ed156f
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 213
    episode_id: E4-213
    projection_digest: sha256:bc53329c5463b7eb8e9e9f65a6b57824e7207ff8fe6160f4c8ba066c7343bd97
  origin:
    plan_id: PLAN-L6-85-automated-pr-cross-review-merge-contract
    revision: 1
    digest: sha256:5b1935f5314f207166b138bd0798e44c25a09e765efbacef951d6254db94cf26
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L6-85-automated-pr-cross-review-merge-contract
    target_revision: 2
    phase: forward_merge
  escape_reason: "PR #210で確定したGitHub Forward Foundation実装事実のgap-only reverse backfill"
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
- live wakeはreviewer providerごとの受信面へ配送する。Claude reviewerだけがClaude inbox/workspaceを解決し、Codex reviewerではCodex受信面を明示的に解決する。未実装・利用不能な受信面はtyped unavailableで停止し、無関係なClaude workspaceを解決してはならない。
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

## 8. GitHub object binding / closure契約（Reverse backfill 2026-07-31）

branch、Issue、draft PR、CI、review、mergeは同じ`plan_id`、PLAN revision、
`project_item_id`、exact PR HEADへbindingする。PR traceの`plan_revision`とIssue番号は明示必須で、
local scheduleから欠落値を補完しない。Project itemのrevision/HEAD不一致は`不整合`として
fail-closeし、遅延観測で現在HEADを上書きしない。

repository同期はremote snapshotをSQLite transaction外で観測し、revision、HEAD、provider identity、
closure条件を検証した後、確定したbinding群を単一transactionでcommitする。main以外をbaseにした
mergeへ`main:*` check binding又はverified closureを発行しない。

完了status又はGitHub approval表示はclosure証拠の代替ではない。次が同じrevision/HEADへ揃うまで
`merge-closure`で阻害する。

- PR HEAD上とmain merge SHA上のexact required `harness-check` identity
- closed Issueと同期済みProject item
- canonical PLAN frontmatter由来のclaim-blind/spec-blind cross-provider receipt
- PR traceに記録した両lane結合digest
- accepted PLAN状態とmain base custody

closure receiptはrepository同期だけが生成し、汎用の手動観測入口から作成できない。receiptは
PLAN ID/revision、PR number/HEAD、merge SHA、PR/main check ID、review receipt digest、Issue closeを
型付きで保持する。自己digestは改変検知に用い、真正性はproviderから再観測したidentity、
canonical PLAN source、DB projectionの一致で検証する。同一PLANの正式revision更新は同じmerge
identityへ再収束できるが、異PLANへの再割当は拒否する。stale replayは既存証拠を後退させない。
