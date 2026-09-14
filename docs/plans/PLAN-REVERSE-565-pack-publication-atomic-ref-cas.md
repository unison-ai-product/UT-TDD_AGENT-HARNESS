---
plan_id: PLAN-REVERSE-565-pack-publication-atomic-ref-cas
title: "PLAN-REVERSE-565: Pack publication atomic ref CAS contract backfill"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-14
updated: 2026-09-14
owner: Codex / Sol
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: required
backprop_decision_reason: 実現不能なPR merge擬似CASをL6のbefore-state CASへ戻し、server-side exact ref leaseと最小bypass authorityへ再降下する。
parent_design: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
pair_artifact: docs/test-design/harness/L7-pack-publication-atomic-ref-cas-test-design.md
agent_slots:
  - role: tl
    slot_label: Claude Opus - L6 before-state CASとL7 exact leaseの同値性を非著者検証する
  - role: qa
    slot_label: Terra - concurrency、authority、crash、payload境界の独立Redを検証する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-565-pack-publication-atomic-ref-cas.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-L7-532-pack-publication-driver.md
    - docs/test-design/harness/L7-pack-publication-atomic-ref-cas-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/565
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 565
---

# PLAN-REVERSE-565: Pack publication atomic ref CAS contract backfill

## R0: gap

GitHub PR merge APIのhead SHA条件をbase SHA条件と誤認したため、client readとmerge writeの間のTOCTOUを閉じられない。
原子性を弱めず、L6のbefore-state CASをGit serverのexact ref leaseへ再降下する。

## R1: 上位不変条件

`PLAN-L6-63`のbefore-state CAS、human-approved mutation、read-back、indeterminate保持と、`PLAN-L7-508`のsealed
exact bytes/file mode/assets/control digestを維持する。変更するのはmain mutation primitiveと、そのprimitiveだけを使える
dedicated authorityである。FSM順序、release identity、promotion、rollbackは変更しない。

## R2: 逆向き証明

- exact leaseに含むexpected OIDはsealed intentのexpected main SHAとbyte一致する。
- pushed headはadmitted PR exact headとbyte一致し、そのtreeはsealed stagingから再計算したexpected treeと一致する。
- branch/PR writeは独立したfresh preparation operationのapproval/journal/receiptに属し、non-author review後のread-only
  publication admissionが初めてmain CAS intentをsealする。外部手作りPRと別operation receiptはauthorityにならない。
- server rejection、response loss、post-write read-back driftはいずれもsuccess 0・後続write 0である。
- remoteが同じheadへ先行した`up-to-date` exit 0は当該operationの成功ではない。porcelainのactual-update statusを
  read-backと共に要求し、欠落・`=`・parse不能をfail-closeする。
- non-bypass preparation App（Contents + Pull requests write）とbypass publication CAS App（Contents write、Pull requests
  writeなし）は別installation/token/operationであり、相互代用できない。preparationだけはsealed tree差分にworkflow
  entry変更があるoperationでWorkflows writeを必須、変更無しでは同権限を過剰としてdenyする。CAS Appは常にPR/Workflows
  writeなしである。unconditional force/main updateは生成されない。
- receipt欠落・破損をremote successへ丸めず、完全journalとremote read-backが同じreceiptを再構成できる場合だけ回復する。
- bounded adapter sliceがpreparation/admissionを2入口へ分け、`mergePullRequestCas`を
  `applyReviewedHeadWithLease({ repository, targetRef, expectedMainOid, reviewedHeadOid })`へ置換する。成功観測の
  `{ targetRef, expectedMainOid, reviewedHeadOid, actualUpdateStatus: "updated", postReadOid }`は同sliceのcallerが全fieldを
  検証してからjournal digestへ束縛する。`PublicationRun.authorize()`/`mutate()`と`planned_nonce_consumed`/
  `read_back_observation` appendはL7-519 adapter責務に残し、production ApprovalPortへ移さない。production-port sliceは
  exact lease/porcelain/post-readの実装だけを所有しadapter diff 0とする。no-op portで旧FSMを偽装せず、phase間でnonceを
  再利用しない。
- expected actor/repo/main/tagの4軸preflight、raw asset upload/download、tree/blob/sidecar再計算、annotated tag
  dereferenceを実API schemaで構成し、production portsと`publishPackCanary`のfull FSMで一体検証する。
- release visible後はdurable pauseし、pointer専用second preparation→non-author review→admission→exact CASへ進む。各phaseの
  operation/nonce/journal/receiptとfresh prep/CAS tokenをfirst cycleから分離し、crash時は最後のdurable phaseからwrite 0で再開する。

## R3: 攻撃面

PR merge APIへの差戻し、expected OID無しlease、`--force`、ruleset無効化、human/PAT authority、client lock、read-backだけの
CAS主張、seal後PR作成の循環、外部手作りPR、preparation receipt replay、no-op port偽装、phase間nonce再利用、
preparation/CAS authority tokenの相互代用、same-head `up-to-date`の成功扱い、
payloadのargv化、receipt直書き、incomplete journalからの成功推測を独立に攻撃する。
workflow entryをsealed集合から除外・旧bytes補完する実装、workflow変更時のpreparation権限不足、変更無し時の権限過剰、
CAS AppへのWorkflows permission追加も独立に攻撃する。
release visibleをpublishedへ丸める、second PR/reviewを省略する、first receipt/head/nonce/tokenをsecond cycleへ流用する、
review待ちにpreparation tokenを保持する、CAS AppへPull requests writeを足す実装も独立に攻撃する。
さらにadapter本体のscope混入、未使用identity preflight、fake-only API field、base64 asset upload、listing digest信用、
個別port testだけでfull FSMを主張する実装を攻撃する。

## R4: Forward再合流

pair artifactの全candidateが後続implementationでRed→Greenとなり、Linux/Windows/aggregate CIと非著者closing receiptが
同一exact HEADへ束縛された後だけPR-1へ再合流する。#574の既存headは再利用しない。
