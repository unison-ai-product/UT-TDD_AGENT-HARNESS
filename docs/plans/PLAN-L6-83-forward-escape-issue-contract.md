---
plan_id: PLAN-L6-83-forward-escape-issue-contract
title: "PLAN-L6-83 (add-design/function-spec): Forward外遷移Issue・駆動モデル選択契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-21
review_evidence:
  - reviewer: claude-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-21T18:22:40+09:00"
    verdict: flag
    scope: >-
      claim-blind FLAG / spec-blind PASS-WEAK。生存 finding 2 件で draft 差し戻し:
      (1) §5 oracle 1-6 が U-EXISSUE-001..006 として未執筆 (CANDIDATE-* のみ、
      U-EXISSUE-007..016 は実在) で L6-L7 pair-freeze が部分未完。(2) §2 の三面
      route_mode 照合の成立点 (escape PLAN の materialization がどの E-state から
      可用か) が未定義。2 点を閉じて再レビュー後に confirmed 化する。詳細と
      同日訂正は A-189。
    worker_model: codex-gpt-5
    reviewer_model: claude-opus-4-8
owner: PO / Codex
parent_design: docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - Forward内外の境界とIssue起票不変条件"
  - role: se
    slot_label: "SE - Execution Ledger command・GitHub projection port契約"
  - role: qa
    slot_label: "QA - drive_model欠落・重複・障害時oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
  requires:
    - docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
  references:
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/plans/PLAN-L6-50-execution-assignment-ledger.md
    - docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
  blocks:
    - docs/plans/PLAN-L7-436-execution-ledger-episode-domain.md
    - docs/plans/PLAN-L7-437-github-issue-projection-inbound.md
    - docs/plans/PLAN-L6-84-drive-model-reentry-verification-contract.md
---

# PLAN-L6-83: Forward外遷移Issue・駆動モデル選択契約

## 1. 目的と境界

通常のForward降下・上昇を、機械的都合だけでIssue分割しない。既に承認されたForwardの
`origin_asset_id` / `origin_revision_id` / `origin_layer` / `origin_state` の範囲内を正規遷移する間は、
Execution LedgerのeventとPLAN revisionが追跡スパインであり、追加Issueは不要である。

一方、Forwardの正規辺を外れて先行調査、PoC、障害復旧、逆引き、設計戻し、負債返済などへ遷移する場合は、
その理由と戻り先を失わないため **off-Forward Issueを遷移前に必須化**する。対象modeは少なくとも
Reverse / Recovery / Incident / Discovery / Scrum / Refactor / Retrofit / Add-feature / Research /
Design-bottomup / Version-upである。`blocked` / `rejected` / `reopened` / `superseded` / `preemptive` /
`defer`はescape typeであり、signalとoriginからこの11駆動モデルの一つを明示選択する。未知mode・未選択はfail-closeする。

## 2. Command / value object契約

`RequestForwardEscape` commandは次を必須入力とする。

| field | 契約 |
|---|---|
| `command_id` | 冪等key。同じpayloadの再送は同じ結果を返し、異なるpayloadの再利用は拒否 |
| `origin_asset_id` | 遷移元PLAN/設計資産の安定ID。pathだけを正本にしない |
| `origin_revision_id` | 遷移判断時のimmutable revision。currentへの暗黙追従を禁止 |
| `origin_layer` | `L0..L14`の明示値 |
| `origin_state` | Forward FSMの遷移元state |
| `escape_reason` | 実観測signal、既存負債、先行理由またはPoC仮説 |
| `drive_model` | off-Forwardの実行方式。空、技術driveとの取り違え、未知値を拒否 |
| `reentry_target_asset_id` / `reentry_target_revision_id` | 合流先の実在assetとimmutable revision。自由記述の戻り先は禁止 |
| `reentry_target_layer` | 検証後に合流すべきForward layer |
| `reentry_target_state` | 合流を試行するForward FSM state |
| `issue_projection` | GitHub owner/repository、title/body/labelsのprojection指示 |

`drive_model`はL4 function §3.1の11値を正本とし、`drive: be|fe|fullstack|db|agent|normal`とは別value objectとする。
Issue body、Execution Ledger event、PLAN `route_mode`の3面が同じ正規化値を持つまで遷移を許可しない。
テンプレートのcheckboxや自由記述が存在するだけでは選択済みと判定しない。

## 3. IssueとExecution Ledgerの責務分離

- Execution Ledgerがauthoring sourceであり、GitHub Issueは外部協調用projectionである。
- Issue番号やURLをLedgerのidentityにしない。Ledger eventはGitHub障害中もappendできる。
- `ForwardEscapeRequested`の後、Issue作成成功で`IssueProjected`、失敗で`IssueProjectionDeferred`をappendする。
- GitHub成功応答はrepository/node ID/issue number/URL/observed revision/digestを記録し、同一commandの重複Issueを防ぐ。
- Issue本文はorigin 4-tuple、escape reason、drive model、reentry target、PLAN IDを含み、projection digestで改変を検出する。
- Issue作成前にoff-Forward実行を開始しない。GitHub障害時も、Ledger上のdeferred receiptと人間承認を持つ場合であっても、
  E4のremote bindingを確認するまでE5（off-Forward実行開始）以降へ遷移しない。
- GitHub障害時もE3のdurable requestまでは記録できるが、E4のremote bindingを確認するまでE5以降へ進めない。
  緊急Recovery/Incidentもこの順序を迂回せず、GitHub不通時は人間escalationと安全確保だけを別episodeに記録する。

## 4. 判定関数

- `classifyForwardBoundary(transition)`は`inside_forward | forward_escape | invalid`を返す。
- `validateForwardEscape(command, ledger)`は欠落field、stale revision、不正state/layer、未知drive model、
  reentry target欠落、重複commandをstructured violationとして返す。origin/reentryはいずれもLedgerの
  asset/revision/state lookupで実在を確認し、throwや推測補完をしない。
- `projectForwardEscapeIssue(validatedE2, githubPort, journal)`はE2 typed eventだけを受理する副作用portであり、
  生commandからの迂回を許さない。構造上E2に見える自己申告eventもLedger発行のopaque certificateを
  custody portで照合できなければ拒否する。E3 queued、deferred、E4 bindingはdurable append receipt取得後だけ返す。
- GitHub成功bindingは期待repository/body digestと、正のissue number、node ID、HTTPS URL、observed revisionを
  全て照合する。不正成功応答はE4にせずDeferredへ落とす。
- `reconcileIssueProjection(ledger, githubSnapshot)`は外部Issueの削除、改変、重複、別repository投影をfinding化する。

## 5. L6↔L7 pair / oracle

L7 test-designに`U-EXISSUE-*`を追加し、少なくとも次をmutationで固定する。

1. 通常Forward辺はIssueなしで通り、off-Forward辺だけがIssueを要求する。
2. `drive_model`空・未知・技術drive混入・Issue/Ledger/PLAN不一致は全てfail-closeする。
3. stale `origin_revision_id`と不正なL/state組合せを拒否する。
4. command再送はIssueを重複作成せず、payload差分のある同一IDを拒否する。
5. GitHub timeout/rate-limit/5xx時もLedger eventを失わず、backoff後に同一projectionを再開できる。
6. Issue本文からorigin/reentry/drive modelのいずれかを除くmutationを検出する。
7. 生commandのprojection、存在しないorigin/reentry revision、不正GitHub成功bindingを拒否する。
8. Deferred後にprocessを再生成してもdurable journalから同じoutbox intentを再開し、Issue 1件へ収束する。
9. SQLiteをclose/reopenしてE2 certificateとE3/E4 digest chainを復元し、改変・別payload replayを拒否する。
10. remote成功後のjournal append失敗をGitHub失敗へ誤変換せず、同じidempotency keyのcreate-or-getで再開する。
11. 空のowner/repository/title/labelsはE2発行前に拒否する。
12. SQLiteのjournal JSON/digestまたはE2 certificateを直接改変し、close/reopen後の読取でfail-closeする。

## 6. AC

- [ ] Forward内とoff-Forwardの境界が閉じた分類表としてL6 function-specへ固定される。
- [ ] 通常Forwardに不要Issueを強制せず、off-ForwardだけがIssueなしで開始不能になる。
- [ ] off-Forward Issueの`drive_model`が必須かつ三面一致でfail-closeする。
- [ ] origin asset/revision/L/stateとreentry targetがLedger/Issue双方へ保存される。
- [ ] GitHub障害時のdeferred/retry/reconcileが冪等で、記録消失・重複Issueがない。
- [ ] `U-EXISSUE-*` Red、独立review、L7-436実装、Reverse backfillを経てconfirmed化する。
