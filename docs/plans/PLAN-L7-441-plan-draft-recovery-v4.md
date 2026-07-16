---
plan_id: PLAN-L7-441-plan-draft-recovery-v4
title: "PLAN-L7-441 (add-impl): PLAN Draft強制終了recovery v4"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex / Claude
parent_design: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - journal v4・recoverable publisher・fencing state machine"
  - role: qa
    slot_label: "QA - F0-F9/FX kill point・assessment digest・gate oracle"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-441-plan-draft-recovery-v4.md
    artifact_type: markdown_doc
  - artifact_path: src/plan-admission/sqlite-draft-journal.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-atomic-draft-publisher.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/draft-recovery.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-draft-recovery.ts
    artifact_type: source_module
  - artifact_path: tests/plan-draft-crash-recovery.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  references:
    - docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
    - docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
  blocks:
    - docs/plans/PLAN-L7-440-plan-admission-cutover.md
---

# PLAN-L7-441: PLAN Draft強制終了recovery v4

## 目的

通常例外のrollbackだけでなく、`SIGKILL`、`TerminateProcess`、電断後にもfilesystemとSQLiteの状態を
再構成できるdurable recoveryを実装する。process内token、例外handler、ledger receiptの存在だけを
回復証拠にしない。

## 状態と永続証拠

journal v4は`intent / staging / staged / publishing / published / ledger_committed /
journal_committed / finalizing / finalized / recovery_required / rolled_back`をappend-only eventで保持する。
artifact child streamにはordinal、logical/target/temp/rollback relative path、before/staged/after digest、
`existed_before`、artifact phaseを記録する。operation ID、repo/base identity、owner session/pid/host、
fencing token、failure class/code、recovery attempt/action/resultも永続化する。

publisherは`prepare / advanceArtifact / inspect / rollback / finalize`へ分割し、補助pathをoperation IDから
決定論生成する。各rename前後にevent appendとfile/directory fsyncを行う。journalのstatus/list/inspectは
read-onlyとし、receipt発見だけでcommitへ自動昇格しない。

## Recovery CLIとgate

- `plan draft status [--command] [--json]`: clean/block/corruptをexit 0/2/3で返す。
- `plan draft list --state unresolved|all`: 未完operationを列挙する。
- `plan draft recover --command <id> --strategy roll-forward|rollback|finalize
  --expected-assessment-digest <sha> [--execute]`: 既定dry-run。execute時はfencing lockと再assessmentを必須にする。

session startとpre-pushは同じrecovery gateを実行する。fresh CIはgitignored local DBを直接観測できないため、
tracked aux禁止、receipt整合、必要時のrecovery-clearance projectionだけを担当する。この責務差を隠さない。

## AC

- [ ] F0〜F9とFXの全kill pointを永続証拠だけでclean/rollback/roll-forward/ambiguousへ分類する。
- [ ] ledger未commitだけをrollback可能とし、ledger commit後はdigest一致時だけroll-forward/finalizeする。
- [ ] partial publish、backup欠落、digest不一致、event/current改ざんを自動修復せずquarantineする。
- [ ] recovery strategy、assessment digest、fencing token、actor、結果をappend-onlyで残す。
- [ ] finalized以外をsession start/pre-pushでfail-closeし、cleanup pendingもcleanと称さない。

## Red oracle

各rename前後、DB commit直前直後、journal commit直前直後、finalize途中でprocessを強制終了する。
old/new digest、補助path、ledger receipt、event、currentの各一項改ざんをFXへ分類する。v3の`find()`は
ledger receiptだけではartifact postimageを証明できないため`recovery_required`へ遮断し、v4 recoveryだけが
検証済みassessmentからroll-forwardを許可する。receiptだけの自動commitを復活させるmutation、または
process token依存、assessment再検証、fencing、全artifact照合のいずれかを削るmutationをsurvivor 0にする。
