---
plan_id: PLAN-L7-512-project-scoped-memory-root
title: "PLAN-L7-512 (add-impl): project-scoped canonical Memory and notification root"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
created: 2026-08-26
updated: 2026-09-16
owner: PO / TL
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
pair_artifact: docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
backprop_decision: required
backprop_decision_reason: Pack導入先のproject
  identity、provider配送、worktree共有、migration fail-closeをL7からReverse検証する。
agent_slots:
  - role: se
    slot_label: SE - tracked project identityからcanonical corpusとruntime busを解決する
  - role: qa
    slot_label: QA - cross-worktree/provider parity、project isolation、migration
      conflictを検証する
generates:
  - artifact_path: docs/plans/PLAN-L7-512-project-scoped-memory-root.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
    artifact_type: test_design
  - artifact_path: src/runtime/project-memory-root.ts
    artifact_type: source_module
  - artifact_path: src/runtime/claude-provider-envelope.ts
    artifact_type: source_module
  - artifact_path: tests/project-memory-root.test.ts
    artifact_type: test_code
  - artifact_path: tests/project-memory-pack-parity.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  requires: []
  blocks:
    - PLAN-L6-101-pack-independent-multi-consumer-acceptance
  references:
    - ut-tdd.project.json
    - src/runtime/project-memory-root.ts
    - src/runtime/claude-provider-envelope.ts
    - tests/project-memory-root.test.ts
    - src/runtime/claude-memory-wake.ts
    - src/memory/service.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/424
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/420
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/432
review_evidence:
  - reviewer: claude
    review_kind: cross_agent
    reviewed_at: 2026-08-27T03:16:10Z
    tests_green_at: 2026-08-27T02:00:02Z
    verdict: pass
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: claude-opus-5
    plan_revision: 086714e6992ed05b1af57e01e23551b75f9bb737
    subject_head: 086714e6992ed05b1af57e01e23551b75f9bb737
    evidence_path: docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
    anchor_commit: 086714e6992ed05b1af57e01e23551b75f9bb737
    scope: "PR #431 docs-only pair-freeze の非著者 closing review。canonical request
      rv1-54611aa61710ade721e40f50d29800b0c070aa1abd4ea289f8acde1f7d432205 を
      `ut-tdd review live-consume` で消費し、receipt は verdict=PASS / blocking 0 /
      reviewerFamily=claude を exact HEAD 086714e6 に対して記録している。対象は本 PLAN・
      PLAN-REVERSE-512・対の L7 test-design の 3 doc のみで、実装 candidate の Green、
      Reverse R4、Issue #424 の完了、Pack 受入完了は主張しない。非 blocking 指摘 (U-PMEMROOT-007 が
      §2 の束縛 5 軸のうち memory / operation を変異させていない) は 本 commit で test-design
      を是正して解消した。 worker_model / effort は receipt・request・commit 086714e6
      (trailer 無し)・PR 本文の いずれにも記録が無く、Codex session corpus
      の実測から確定した。2026-08-26/27 の Codex session で PLAN-L7-512 に触れた turn_context は
      authoring 窓 (01:16Z / 01:57Z / 02:05Z / 02:07Z / 02:18Z / 02:26Z / 02:29Z)
      が全て gpt-5.6-luna / effort high であり、gpt-5.6-sol / low は 03:08Z 以降の
      review・verdict 相でのみ出現する。PLAN-L7-508 が同 family・同作業種別に対して 記録している値
      (gpt-5.6-luna / high) とも一致する。Codex から実値の申告があれば 本欄を訂正する。Issue #429
      が本欄の手書き運用そのものを所有する。"
    citations:
      - .ut-tdd/review/receipts/54611aa61710ade721e40f50d29800b0c070aa1abd4ea289f8acde1f7d432205.json
      - "docs/test-design/harness/L7-project-scoped-memory-root-test-design.md:
        CANDIDATE-U-PMEMROOT-001..009 / CANDIDATE-P-PMEMROOT-001..005"
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/33031193910
    green_commands:
      - kind: unit_test
        command: GitHub harness-check run 33031193910 (harness-check-linux /
          harness-check-windows / harness-check aggregate)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-08-27T02:00:02Z
        evidence_path: docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
        output_digest: sha256:9915a36da94c09fce865175a865ce008e21a90f965b143f9b9b99843b97d8cef
        anchor_commit: 086714e6992ed05b1af57e01e23551b75f9bb737
      - kind: vmodel_lint
        command: node src/cli.ts plan lint
          docs/plans/PLAN-L7-512-project-scoped-memory-root.md
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: 2026-08-27T02:00:02Z
        evidence_path: docs/plans/PLAN-L7-512-project-scoped-memory-root.md
        output_digest: sha256:58fa0495e096315c0e67d7d9050497b51fcca04640d419b54aed88a8387ad90b
        anchor_commit: 086714e6992ed05b1af57e01e23551b75f9bb737
  - reviewer: codex-tl-integration
    review_kind: intra_runtime_subagent
    reviewed_at: 2026-09-08T06:56:53.664Z
    tests_green_at: 2026-09-08T06:55:46.693Z
    verdict: PASS blocking 0; Claude Opus non-author closing review pending
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: codex
    plan_revision: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
    subject_head: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
    anchor_commit: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
    evidence_path: tests/claude-memory-wake.test.ts
    scope: "Issue #528 / PLAN-L7-512 Slice 3 の bounded implementation。project-bound
      provider envelope、publisher create-exclusive binding sidecar、production
      consumer claim guard、 Memory/review の実compositionを実装し、legacy v2/v3
      は明示的移行条件なしに typed deny と entry 保持とした。U-PMEMROOT-007 の各semantic
      axis、coherent envelope/id/filename spoof、claim 0、entry/sidecar
      retentionを検証した。 Slice 4 migration/quarantine、Slice 5 Pack parity、#439、Bun
      laneは対象外。 Opus non-author closing reviewは未実施であり、ここでは実装candidateの証跡だけを記録する。
      rootは24126d45のsnapshot終了コード0を確認済み。本改訂の時刻は証跡再確認時刻であり、実行終了時刻の再構成ではない。
      CI指摘のmax-source-paramsをオブジェクト引数化で是正。HEAD 6ce594c2でsnapshot 3 files/9
      passed/37 skipped、reference検証・cleanupを含むexit
      0を06:54:47.721Zに確認。旧時刻欠落entryは本実測で置換し、過去履歴はarchive refに保存。closing未実施。"
    citations:
      - "src/runtime/claude-provider-envelope.ts: v4 envelope schema, digest,
        and consumer validation"
      - "src/runtime/claude-memory-wake.ts: create-exclusive binding sidecar and
        production claim guard"
      - "tests/claude-memory-wake.test.ts: U-PMEMROOT-007 and review composition"
      - "tests/runtime-hook-entrypoints.test.ts: U-MEMWAKE-007 production hook
        composition"
      - 89de38593e0a5264480ed5b305c1718bdc3b89b6
    green_commands:
      - kind: integration_test
        command: 'node scripts/run-vitest-snapshot.ts tests/claude-memory-wake.test.ts
          tests/claude-memory-terminal-gc.test.ts
          tests/runtime-hook-entrypoints.test.ts -t
          "PMEMROOT-007|U-RVATT-025|U-MEMTERM-001|U-MEMTERM-003|U-MEMWAKE-001補遺|U-MEMWAKE-007:
          CLI hook delivers" --pool=forks --reporter=dot'
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: 2026-09-08T06:54:47.721Z
        evidence_path: tests/claude-memory-wake.test.ts
        output_digest: sha256:38c98a6ff2f2983a5e1725fd928369f6e7d780dfa7db2d2d547482a287f9de4e
        anchor_commit: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
      - kind: typecheck
        command: node node_modules/typescript/bin/tsc --noEmit --pretty false
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: 2026-09-08T06:55:46.693Z
        evidence_path: src/runtime/claude-memory-wake.ts
        output_digest: sha256:357a451c5b7c3db96ef728aed9a202762618476b23a63b338365ed72bece9cf4
        anchor_commit: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
      - kind: lint
        command: node node_modules/@biomejs/biome/bin/biome check
          src/runtime/claude-provider-envelope.ts
          src/runtime/claude-memory-wake.ts tests/claude-memory-wake.test.ts
          tests/runtime-hook-entrypoints.test.ts
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: 2026-09-08T06:55:43.328Z
        evidence_path: src/runtime/claude-memory-wake.ts
        output_digest: sha256:357a451c5b7c3db96ef728aed9a202762618476b23a63b338365ed72bece9cf4
        anchor_commit: 6ce594c2087d8cd802bc3579b70ade9fbf912b43
  - reviewer: codex-issue544-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: 2026-09-09T02:41:26.549Z
    tests_green_at: 2026-09-09T02:32:41.000Z
    verdict: PASS blocking 0; Claude Opus non-author closing review pending
    worker_model: gpt-5.6-luna
    effort: high
    reviewer_model: gpt-5.6-sol
    plan_revision: 69896336069c4fc41184876c16f01230d96dad9e
    subject_head: 69896336069c4fc41184876c16f01230d96dad9e
    anchor_commit: 69896336069c4fc41184876c16f01230d96dad9e
    evidence_path: tests/project-memory-migration.test.ts
    scope: "Issue #544 / PLAN-L7-512 Slice 4a。linked worktree inventoryとunique /
      dedupe / conflict分類だけを対象とし、U-PMEMINV-001..008をexact HEADで検証した。canonical
      apply、quarantine transaction、recovery、completion marker、Pack
      parity、Reverse R2以降は未完了。"
    citations:
      - src/runtime/project-memory-migration.ts
      - tests/project-memory-migration.test.ts
      - "docs/test-design/harness/L7-project-scoped-memory-root-test-design.md:
        U-PMEMINV-001..008"
    green_commands:
      - kind: unit_test
        command: node scripts/run-vitest-snapshot.ts
          tests/project-memory-migration.test.ts --pool=forks --maxWorkers=2
          --minWorkers=1 --reporter=dot
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: 2026-09-09T02:32:41.000Z
        evidence_path: tests/project-memory-migration.test.ts
        output_digest: sha256:578308c0fa04dc07aa07c55e63ad66f983759415e2ea445bf84563f7fc6d0f9e
        anchor_commit: 69896336069c4fc41184876c16f01230d96dad9e
status: confirmed
github_issue_id: 544
admission_receipt:
  schema_version: v2
  receipt_id: certificate:0887b4b525c84ee49fd37e2873cad714
  command_id: plan-revise:issue-424:pr2-ownership-move:r10:0d42c71d1a79
  admitted_at: 2026-09-18T03:54:24.330Z
  source_digest: sha256:17ec13c32a55c79c2e57444616043603fc442e17d613386d2c35addd19344a06
  decision_digest: sha256:e6e1a0a9c6b4dd6163731acf75b0bfebd8accc243e9a86676c9470dc0db93d48
  receipt_digest: sha256:cb8d1e8fac5369d0ee802965934bca856cf3ce80708f76b636362731d52bedfb
  binding:
    path: docs/plans/PLAN-L7-512-project-scoped-memory-root.md
    plan_id: PLAN-L7-512-project-scoped-memory-root
    asset_id: plan:legacy:68706e293ae2c96738a8e3263bac3e01e7cde64cdb7c3ed8e53805922662bc30
    revision: 10
    content_digest: sha256:17ec13c32a55c79c2e57444616043603fc442e17d613386d2c35addd19344a06
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 544
    episode_id: E4-544-project-memory-inventory
    projection_digest: sha256:bea56244b34bd74d709278dcab8fb5fd50024b05be6edc9d61b6ec5123d3f450
  origin:
    plan_id: PLAN-L6-104-memory-clean-cut-replacement
    revision: 1
    digest: sha256:5e05d3835164cd42c563329ae3eee17a6e564e1c2856c23dd90f182e84d2cca6
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-512-project-scoped-memory-root
    target_revision: 10
    phase: forward_merge
  escape_reason: "Issue #424 PR-2 (PR #644): PLAN-L7-566 confirm に伴い
    tests/memory-clean-cut-removal.test.ts の暫定所有を 566 へ移管 (rev 9 注記どおり)。契約変更なし。"
---

# PLAN-L7-512: project-scoped canonical Memory and notification root

> **訂正 (2026-09-16)**: 本 PLAN の Slice 4 に属する migration / inventory / quarantine / recovery /
> completion 条項と、`generates` の `src/runtime/project-memory-migration.ts` /
> `tests/project-memory-migration.test.ts` は、PO 判断 (2026-09-15、Issue #424) により
> `PLAN-L6-104-memory-clean-cut-replacement` が supersede する。Slice 1/3 の project-scoped canonical
> root、`src/runtime/project-memory-root.ts`、`src/runtime/claude-provider-envelope.ts`、clean Pack
> parity は本 PLAN の契約として有効なまま継承する。`generates` の 2 件は、実装を撤去する後続 PR
> (Issue #424 PR-1) の confirm と同時に削除する。
>
> **本 revision (rev 7) の吸収範囲**: rev 6 発行後に canonical revise を経ずに commit `6efae246` で
> 加えられていた `updated: 2026-09-11` と `tests/project-memory-pack-parity.test.ts` の `generates`
> 登録を、既存 ledger rev 6 (`canonical_payload_digest faf0d000…`) を base として本 revision で明示的に
> 吸収する。これは `6efae246` の直接編集を遡って canonical と認定するものではなく、観測済みの drift を
> 失わずに append-only lineage へ復帰させるための是正である。rev 6 の embedded content digest は
> `sha256:e3e3cad0…`、drift 後の HEAD content digest は `sha256:e43a97bd…`。

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

元のpair-freeze（PR #431）では、実装前の契約だけを凍結し、後続実装の成果物を
`generates`へ先行登録しなかった。PR #512のSlice 1でcanonical rootとproject identityの
成果物を着地させ、Issue #528のSlice 3でprovider envelopeとclaim guardを追加した。
既存のMemory CLI／wake、review-live、hook、terminal testの所有は各既存PLANに残し、
本PLANへ重複登録しない。本PLANが新たに所有するSlice 3成果物は
`src/runtime/claude-provider-envelope.ts`だけである。inventory／recovery、Pack parityは
後続sliceであり、本証跡はそれらを生成済みと主張しない。

1. canonical root resolverとproject-namespaced transient bus。
2. Memory CLI、live review、Claude wakeのcanonical root結線。
3. project-bound provider envelopeとclaim guard。
4. inventory、dedupe、conflict quarantine、transaction recovery、completion fence。
5. clean Pack setupからのCodex/Claude parityと別project isolation E2E。

本改訂はIssue #544のSlice 4aだけを所有し、linked worktree inventoryと
unique / dedupe / conflictの決定論的分類をruntime境界で実装する。canonical apply、quarantine transaction、
crash recovery、completion marker、Pack parityは後続へ残す。

rev 8 (Issue #424 PR-1、2026-09-16): `PLAN-L6-104-memory-clean-cut-replacement` §5 PR-1 により、Slice 4 の
実装 `src/runtime/project-memory-migration.ts` と `tests/project-memory-migration.test.ts` を削除し、本 PLAN の
`generates` から同 2 件を外した。Slice 4 は本 PLAN では実装しない (supersede の範囲は rev 7 の注記のとおり)。

rev 9 (同 PR): 撤去を固定する oracle test `tests/memory-clean-cut-removal.test.ts` (`U-MEMCUT-012`〜`016`、
pair artifact は `L7-memory-clean-cut-replacement-test-design.md` §4.2) を本 PLAN の `generates` が暫定所有する。
実装 PLAN `PLAN-L7-566` は draft のため出荷物を所有できない (`merged-plan-status`)。566 が confirmed へ遷移する
Issue #424 PR-2 の完了時に所有を 566 へ移す。

## 4. Scope boundary

global領域にMemory本文は置かない。Issue #413のglobal lessons、semantic ranking、cloud memory serviceは扱わない。
本PLANの`confirmed`は、本文と対になるtest-designが非著者pair-freeze review、docs CI、canonical receiptを
満たし、実装開始条件として固定されたことだけを表す。実装candidateのGreen、Reverse R4、Issue #424の完了、
またはPack受入完了を意味しない。これらの完了主張は、後続実装PRのexact HEADで全candidate、
Linux/Windows/aggregate CI、非著者closing PASS、canonical receiptが揃うまで禁止する。
clean Pack parityは、#420のconsumer-local sealed runtimeと#432のtracked identity bootstrapを
機械的前提とする。両依存をfixtureの事前seedやsetup元Pack参照で代替しない。

rev 10 (Issue #424 PR-2、2026-09-16): `PLAN-L7-566` が confirmed へ遷移したため、rev 9 で暫定所有していた
`tests/memory-clean-cut-removal.test.ts` (`U-MEMCUT-012`〜`016`) の所有を 566 の `generates` へ移し、本 PLAN の `generates` から外した
(`duplicate-artifact-ownership` の二重所有を作らない)。本 PLAN の契約・status は変えない。
