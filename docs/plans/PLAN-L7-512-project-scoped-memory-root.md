---
plan_id: PLAN-L7-512-project-scoped-memory-root
title: "PLAN-L7-512 (add-impl): project-scoped canonical Memory and notification root"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-26
updated: 2026-08-26
owner: PO / TL
github_issue_id: 424
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
pair_artifact: docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
backprop_decision: required
backprop_decision_reason: "Pack導入先のproject identity、provider配送、worktree共有、migration fail-closeをL7からReverse検証する。"
agent_slots:
  - role: se
    slot_label: "SE - tracked project identityからcanonical corpusとruntime busを解決する"
  - role: qa
    slot_label: "QA - cross-worktree/provider parity、project isolation、migration conflictを検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-512-project-scoped-memory-root.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  requires: []
  blocks:
    - PLAN-L6-101-pack-independent-multi-consumer-acceptance
  references:
    - ut-tdd.project.json
    - src/runtime/claude-memory-wake.ts
    - src/memory/service.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/424
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/420
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/432
review_evidence: []
---

# PLAN-L7-512: project-scoped canonical Memory and notification root

## 1. Outcome

同じtracked `repository_identity`とGit common-dirを持つ全worktreeは、primary worktreeの
`.ut-tdd/memory`を唯一のauthored corpusとして読み書きし、Git common-dir配下のproject digest namespaceを
transient notification busとして共有する。絶対pathはidentityに含めず、別projectは本文・通知・claim・receiptを
共有しない。

## 2. Fail-close contract

- current HEADとprimary HEADのproject identity欠落・driftをtyped denyする。
- common-dir、realpath、junction/symlink解決後のroot escapeをtyped denyする。
- notification envelopeはproject、memory、operation、producer provider/session、target provider/sessionを束縛する。
- project mismatchはread/claimを0とし、別projectのentryを消費済みにしない。
- legacy worktree corpusへ無音fallbackしない。全linked worktreeをinventoryしてから移行する。
- 同一ID・同一digestだけをdedupeし、同一ID・異digestは全variantをquarantineへ保存する。
- migrationはsource inventoryをfile handleへ再束縛し、durable transaction markerから中断renameをrollback/recoveryする。
- completionは現物corpus digestと一致するときだけreplayし、欠落・改変・別operationを成功扱いしない。
- transactionの保証境界は同一host上のprocess crash／強制終了までとする。Windowsでdirectory fsyncが提供されない面の
  power-loss durabilityは本sliceの保証に含めず、未完了markerまたは現物不一致を次回起動時にfail-closeする。

## 3. Implementation slices

本PRは契約と対になるcandidateだけをfreezeする。次の成果物はpair-freeze後の原子的な実装PRが所有し、
本PRの`generates`へ先行登録しない。

1. canonical root resolverとproject-namespaced transient bus。
2. Memory CLI、live review、Claude wakeのcanonical root結線。
3. project-bound provider envelopeとclaim guard。
4. inventory、dedupe、conflict quarantine、transaction recovery、completion fence。
5. clean Pack setupからのCodex/Claude parityと別project isolation E2E。

## 4. Scope boundary

global領域にMemory本文は置かない。Issue #413のglobal lessons、semantic ranking、cloud memory serviceは扱わない。
本PLANの`confirmed`は、本文と対になるtest-designが非著者pair-freeze review、docs CI、canonical receiptを
満たし、実装開始条件として固定されたことだけを表す。実装candidateのGreen、Reverse R4、Issue #424の完了、
またはPack受入完了を意味しない。これらの完了主張は、後続実装PRのexact HEADで全candidate、
Linux/Windows/aggregate CI、非著者closing PASS、canonical receiptが揃うまで禁止する。
clean Pack parityは、#420のconsumer-local sealed runtimeと#432のtracked identity bootstrapを
機械的前提とする。両依存をfixtureの事前seedやsetup元Pack参照で代替しない。
