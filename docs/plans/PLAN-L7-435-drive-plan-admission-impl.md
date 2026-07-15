---
plan_id: PLAN-L7-435-drive-plan-admission-impl
title: "PLAN-L7-435 (add-impl): 駆動モデル準拠PLAN Admission実装"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - Admission policy・draft command・receipt・tamper fence"
  - role: qa
    slot_label: "QA - tuple/property/mutation/atomicity/CLI oracle"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
    artifact_type: markdown_doc
  - artifact_path: src/plan-admission/policy.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/diff-fence.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/admission-check.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/git-diff-adapter.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/tracked-receipt-projection.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-admission.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-draft-service.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-draft-command-digest.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-draft-command-assembler.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-draft-ledger-adapter.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/tracked-receipt-renderer.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-plan-draft-runner.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-atomic-draft-publisher.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/sqlite-draft-journal.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-draft.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/plan-draft-ledger.ts
    artifact_type: source_module
  - artifact_path: src/plan-asset/ledger/schema.ts
    artifact_type: source_module
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: tests/plan-admission.test.ts
    artifact_type: test_code
  - artifact_path: tests/frontmatter.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-admission-diff-fence.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-admission-tracked-receipt-projection.test.ts
    artifact_type: test_code
  - artifact_path: tests/admission-check.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/ledger-schema.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-asset/plan-draft-ledger.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-draft-service.test.ts
    artifact_type: test_code
  - artifact_path: tests/sqlite-draft-journal.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-atomic-draft-publisher.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-draft-command-digest.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-draft-command-assembler.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-draft-ledger-adapter.test.ts
    artifact_type: test_code
  - artifact_path: tests/tracked-receipt-renderer.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-plan-draft-runner.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-plan-draft.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  requires: []
  references:
    - docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  blocks:
    - docs/plans/PLAN-L7-440-plan-admission-cutover.md
    - docs/plans/PLAN-L7-441-plan-draft-recovery-v4.md
---

# PLAN-L7-435: 駆動モデル準拠PLAN Admission実装

## 実装範囲

`PlanAdmissionPolicy`をpure domain/application境界に置き、`ut-tdd plan draft`、PLAN lint、
branch-kind、hook/pre-push/CIが同じ許可tupleを読む。detectorはこの表を生成せず、許可tuple以外を
Admission candidateに昇格させない。

`transition_direction`をmode判定の正本とする。`reverse`は`implementation_to_design`だけを許可し、
`実装 → Reverse → Forward合流`を記録する。`redesign`は`design_to_implementation`だけを許可し、
起点証拠、対象設計の差替え（`supersedes`）、Forward合流先、合流後に実装するPLANを同一receiptに
束縛する。先行実装の保存/廃棄は補助証跡であり、両者を混用してmodeを選ばない。

CLIは次の状態機械を一つのSagaとして扱う。利用者が`payload_digest`、receipt、tracked projection本文を
自己申告する入口は設けず、検証済みcommand envelopeからcanonical digestを一度だけ計算する。

1. `VALIDATED`: policy、prospective governance、工程表、path、衝突を副作用なしで検証する。
2. `INTENT`: command digest、対象path、preimage情報をdurable journalへ記録する。この時点から未完了は
   session start、hook、pre-push、CIをfail-closeする。
3. `PREPARED`: 決定論的temp/rollback pathとpreimage digestを記録し、backupをfsyncする。正本fileと
   ledger currentはまだ変更しない。
4. `LEDGER_PENDING`: `BEGIN IMMEDIATE`内でreservation、PlanAsset/revision、admission receiptをappendする。
   ledger portは自己commitせず、呼出し側のUnit of Workへ参加する。
5. `STAGED`: ledger receiptからfrontmatter receiptとtracked append-only projectionを生成し、二成果物を
   temp write/fsyncする。projectionをreceipt確定前に生成しない。
6. `PUBLISHED`: backup rename、target rename、directory fsyncを完了する。複数pathを単一filesystem
   transactionとは称さない。
7. `DB_COMMITTED`: 全targetの公開成功後だけSQLite transactionをcommitする。
8. `COMMITTED`: receipt、command、postimage digestの一致を確認してjournalをterminalにし、補助fileを
   冪等cleanupする。

DB commit前の通常例外は、target restore、DB rollback、receipt不存在確認の順に補償し、journal以外の
PLAN file、active reservation、ledger current、tracked projection、GitHub outboxを0件に戻す。restoreまたは
rollback結果が曖昧なら成功や`ROLLED_BACK`に倒さず`RECOVERY_REQUIRED`とする。DB commit後にjournal commitが
失敗した場合は、次回recoveryがledger receiptとsource/projectionのpostimage digestを照合してroll-forwardする。

強制終了後はjournal、ledger receipt、preimage、postimage、temp、rollback fileをcommand単位の排他lease下で
分類する。receiptなしでpreimageへ復元できる場合だけrollbackし、receiptありで両postimageが一致する場合だけ
commitへ収束する。それ以外は自動修復せずquarantineし、`plan recovery-list`と明示的`plan recover`で扱う。
process内tokenだけをrecovery証拠にせず、再起動後に必要なpathとdigestをjournal eventへ永続化する。

failure injection、replay、concurrent reservation、temp rename失敗、DB commit直前直後の強制終了を含め、
通常失敗時の0件と、強制終了時にrecovery完了まで正本扱いしないことを証明する。SQLiteとGit管理Markdownを
単一transactionと偽装しない。

## AC

- [ ] unknown signalのForward fallbackをauthoring入口で廃止する。
- [ ] Incident等の相関tuple、Forward/escapeのIssue policy、origin/reentry、pairingを同一policyで判定する。
- [ ] direct PLAN editとreceipt staleをhook/pre-push/CIでfail-closeする。
- [ ] `U-PADM-*` / property / mutation / CLI実行がGreenとなり、Red oracle候補を実装oracleへ昇格する。
- [ ] REVERSE-435で実装観測をL4-L6/L7 test-designへgap-only backfillする。

## テスト証跡

`U-PADM-001`〜`060` の一意なoracle IDを
`docs/test-design/harness/L7-unit-test-design.md` の同一IDへ対応させる。Green判定は上記`generates`の
test moduleを固定スナップショットで実行し、同一IDの重複が0件であることをtrace gateで確認する。
未実装の強制終了recoveryとGitHub ingressは `CANDIDATE-PADM-009`〜`010` のまま保持し、Greenと称さない。
