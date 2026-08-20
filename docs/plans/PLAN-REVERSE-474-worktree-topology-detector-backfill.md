---
plan_id: PLAN-REVERSE-474-worktree-topology-detector-backfill
title: "PLAN-REVERSE-474: worktree topology 検出契約の上流合流判定"
kind: reverse
layer: cross
drive: be
route_signal: drift
route_mode: reverse
confirmed_reverse_type: design
created: 2026-08-05
updated: 2026-08-20
owner: PM / PO
parent_design: docs/plans/PLAN-L7-474-worktree-topology-detector.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - L4/L6への合流要否と advisory境界を判定する"
  - role: qa
    slot_label: "QA - 実装済みoracleと凍結契約の照合を行う"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-474-worktree-topology-detector-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-475-worktree-topology-pf1-pure-analyzer.md
    - docs/plans/PLAN-L7-476-worktree-topology-pf2-os-collector.md
    - docs/plans/PLAN-L7-477-worktree-topology-pf3-doctor-advisory.md
    - docs/plans/PLAN-L7-478-worktree-topology-pf4-migration-acceptance.md
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    - docs/design/harness/L6-function-design/governance-enforcement.md
    - docs/test-design/harness/L7-unit-test-design.md
workflow_phase: R0
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
status: draft
review_evidence: []
---

# PLAN-REVERSE-474: worktree topology 検出契約の上流合流判定

## R0 観測証跡（pair-freeze時点）

Issue #232 は、登録worktreeが増加しても `git worktree prune` が directory 不在しか扱わず、
link破損と終了済みclean worktreeを判定できないという観測から起票された。
現時点で凍結できる差分は「双方向link健全性、保全優先のliveness、advisory oracle」である。

R0 は実装観測ではない。実装、テスト、実測件数、green verdictは未取得であり、本PLANは
それらを完了済みとして扱わない。

PR #243の実装commitは回収可能な履歴資料であり、R1以降の完了証拠ではない。PF1〜PF3の
landed事実を順に観測してからR1〜R3を進め、PF4がaggregate acceptanceを検証した時点でのみR4を行う。

## 上流合流の問い

1. `.git` / admin 双方向のlink契約を L6 governance-enforcement へ恒久契約として追記すべきか。
2. `dirty` 優先、detached HEADの保持ref到達可能性、finding面のretirable除外を、L4配置移設の
   安全条件へ反映すべきか。
3. stable topology identity集合とdigestを `PLAN-L4-34` の移設前後 acceptance comparator として
   参照させるべきか。

## R1〜R4 判定（PF4 aggregate acceptance）

### R1: 上流impact判定

1. **L6 governance-enforcement: not_impacted**。双方向linkの検査はrepository配置とmigration inputの
   責務であり、実行時governance enforcementへ新しいhard gateを導入しない。PF3のdoctor surfaceも
   advisoryのままなので、L6へ同一契約を複製しない。
2. **L4 placement safety: backfill_required**。dirty優先、retirable除外、detached保持ref到達可能性は
   cutover前に観測する安全入力として必要である。削除権限へ変換せず、#232のread-only reportをS2の
   `worktree-inventory` portへ渡す前提だけをL4へ記録する。
3. **L4 migration comparator: backfill_required**。healthy件数一致だけでは別worktreeへの置換を検出
   できない。許可remap後identity集合digestとfindings 0のANDをL4へ明記する。

### R2: gap-only backfill

`PLAN-L4-34` §4へtopology acceptance inputを追記した。新しいcutover runner、state writer、doctor
hard gate、cleanup/prune/repairは追加していない。L6は上記R1-1のnot_impactedにより変更しない。

### R3: 実装oracle照合

- `U-WTTOPO-013`は`tests/worktree-topology-migration.test.ts`で、同じhealthy件数でもidentity集合が
  異なるbefore/afterを`identity_mismatch`として拒否し、合法remap後の一致だけを受理する。
- `U-WTTOPO-018`は文書に固定したliteral preimage hexとSHA-256を独立に計算し、byte/length変異と
  不正remapを拒否する。期待値はproduction helperで再計算していない。

### R4: Forward再合流判定

PF1〜PF3のmain到達後、PF4はaggregate acceptanceをGreenにした。R1/R2で必要なL4差分だけを反映し、
L6への重複backfillは不要と判定したため、**PF4のexact HEAD closing PASSとmerge後に限り**、masterの
post-R4 stepへ再合流可能とする。この判定はmaster confirm、Issue #232 close、配置cutoverを先取りしない。

## Schedule

- R0 [完了]: Issue #232 と pair-freeze から上流差分候補を記録した。
- R1 [直列・PF1/PF2 landed後]: add-impl の実装事実と L4/L6既存契約を照合し、各問いを
  `backfill_required` または `not_impacted` と理由付きで判定する。
- R2 [直列・PF3 landed後]: R1で必要と判定された面だけを上流へ gap-only 追記する。
- R3 [直列・PF1〜PF4]: 各ownerの`CANDIDATE-WTTOPO-*`を実装test citationと同じcommitで
  対応する確定 `U-*` IDへ昇格し、実装とのトレースを照合する。
- R4 [直列・PF4のみ]: aggregate移設acceptanceとbyte vector Green後にForward再合流を判定する。
  PF1〜PF3やmasterから先行完了してはならない。
- post-R4 [直列・master所有]: PF4 merge後に全子landedとR4完了を確認し、master専用exact HEAD closing
  PASS後だけ`PLAN-L7-474`をconfirmedへ遷移してIssue #232をcloseする。これはPF4 exitではない。

## AC

- AC-1: 上記三問いを未判定のまま残さない。
- AC-2: R2は必要な差分だけを上流へ反映し、既存設計を重複させない。
- AC-3: R3は実装テストの結果を根拠にする。pair-freeze時の文書だけをgreen根拠にしない。
