---
plan_id: PLAN-L7-435-drive-plan-admission-impl
title: "PLAN-L7-435 (add-impl): 駆動モデル準拠PLAN Admission実装"
kind: add-impl
layer: L7
drive: agent
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-29
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - Admission policy・draft command・receipt・tamper fence"
  - role: qa
    slot_label: "QA - tuple/property/mutation/atomicity/CLI oracle"
review_evidence:
  - reviewer: claude-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-16T11:40:00+09:00"
    tests_green_at: "2026-07-16T11:30:00+09:00"
    verdict: approve
    scope: "PR #64 landed slice の blind cross-review (author 主張遮断 packet、Claude opus-tier blind-reviewer / Fable orchestrator)。Lane B (内部健全性) PASS-WEAK: 原子性/rollback/path-traversal/digest 自己申告排除の攻撃 4 系統すべて不成立を引用確認。Lane A (claim-blind) FLAG 4 件は全て本 PLAN/L7-440 の未チェック AC として宣言済み staged scope と照合し解消 (backdate 回避・工程表検証・hook/pre-push/CI 接続・force 実証は未 landed の残スコープであり本 confirm の claim に含めない)。follow-up 義務: U-PADM-006 の元 schedule oracle を別 ID 再採番で復元し、残 AC 完了まで L6-86 を confirmed にしない。verdict 正本 = .ut-tdd/memory/project-pr64-verdict-lane-b-pass-weak-lane-a-flag-staged-scope-follow-up-3.md"
    worker_model: gpt-5.6
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: unit_test
        command: "harness-check CI @0d439589 (gh pr checks 64 SUCCESS: typecheck / vitest 全回帰 / biome / doctor)"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-07-16T11:30:00+09:00"
        evidence_path: tests/plan-admission.test.ts
        output_digest: "sha256:ebb53045e7e24f85b605fd2313cb86aa27d4bf489346a8de19beb69c0e29d252"
        anchor_commit: 561054a8f88f15fe73b8e699aff0536f4a56e877
  - reviewer: Codex recovery identity adversarial reviewers
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-16T17:11:06+09:00"
    tests_green_at: "2026-07-16T17:10:02+09:00"
    verdict: pass
    scope: "HEAD 975984a3 のRecovery identity fix-forwardを独立2 laneで再レビュー。code lane PASS、test lane PASS-WEAK。M系列新規予約、zero-padding衝突、Recovery ID×Forward Admission、source字段単独変異、issueRequired/余剰decision property改ざん、routeTupleDigest非決定性、replay重複、regex driftを攻撃し、未反駁attack 0。PASS-WEAKはreviewerがGreenを重複実行せず、親が固定snapshotを実行したため。"
    worker_model: gpt-5
    reviewer_model: gpt-5
    green_commands:
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts tests/plan-id-identity.test.ts tests/plan-id-taxonomy.test.ts tests/plan-draft-command-assembler.test.ts tests/node-plan-draft-runner.test.ts tests/plan-admission-tracked-receipt-projection.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-16T17:10:02+09:00"
        evidence_path: tests/node-plan-draft-runner.test.ts
        output_digest: "sha256:e69fd63c64fa65b8fcb06019d5229f48ff7313119349a8a957d24a187e0014ff"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
generates:
  - artifact_path: docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
    artifact_type: markdown_doc
  - artifact_path: src/plan-admission/policy.ts
    artifact_type: source_module
  - artifact_path: src/schema/frontmatter.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint-policy.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/diff-fence.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/admission-check.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/git-diff-adapter.ts
    artifact_type: source_module
  - artifact_path: tests/plan-admission-git-diff-adapter.test.ts
    artifact_type: test_code
  - artifact_path: src/plan-admission/tracked-receipt-projection.ts
    artifact_type: source_module
  - artifact_path: src/cli/plan-admission.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-draft-service.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-draft-command-digest.ts
    artifact_type: source_module
  - artifact_path: src/kernel/plan-draft-command-digest.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-draft-command-assembler.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/plan-draft-ledger-adapter.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/tracked-receipt-renderer.ts
    artifact_type: source_module
  - artifact_path: src/plan-admission/node-plan-draft-runner.ts
    artifact_type: source_module
  - artifact_path: src/schema/plan-id.ts
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
  - artifact_path: tests/plan-id-taxonomy.test.ts
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
  - artifact_path: tests/plan-id-identity.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-lint.test.ts
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

PLAN ID は共有identity parserを正本とし、`L0`〜`L14` / `DISCOVERY` / `REVERSE` / `RECOVERY` / `M`
のtokenと2桁以上のordinalを一度だけ解釈する。draftで予約できるidentityは`M`以外かつordinal 1以上に限定し、
tokenとAdmissionのkind/layer、source frontmatterとAdmission tupleが一致した場合だけledgerを開く。
これによりForward外IssueからRecoveryへ入る正規経路をL層限定regexで拒否する実装driftを解消し、
設計に検出・実行系を追従させる。

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

> 注記 (2026-07-16 confirm 時): 本 confirm は PR #64 で landed した slice (policy/receipt/draft Saga/diff-fence/tamper fence) を対象とする。未チェックの AC は残スコープ (hook/pre-push/CI 接続 = PLAN-L7-440、backdate/工程表/force oracle 復元) であり、完了主張には含めない (claim discipline)。

- [x] unknown signalのForward fallbackをauthoring入口で廃止する。(blind cross-review で反例不成立を確認、tests/plan-admission.test.ts green)
- [x] Incident等の相関tuple、Forward/escapeのIssue policy、origin/reentry、pairingを同一policyで判定する。(同上、policy.ts evaluatePlanAdmission + frontmatter superRefine の二重実装を確認)
- [x] PLAN ID token・ordinalを共有parserで解釈し、Recoveryを含むidentity/source/Admissionの不一致をledger・filesystem副作用前に拒否する。(U-PADM-061〜065、HEAD 975984a3 fixed snapshot 47 Green + independent PASS/PASS-WEAK)
- [ ] direct PLAN editとreceipt staleをhook/pre-push/CIでfail-closeする。
- [ ] `U-PADM-*` / property / mutation / CLI実行がGreenとなり、Red oracle候補を実装oracleへ昇格する。
- [ ] REVERSE-435で実装観測をL4-L6/L7 test-designへgap-only backfillする。

### Issue #163 additive delta: PLAN numeric identity 一意性

PLAN IDの一意性はslugを含む全文字列ではなく、共有
`parsePlanIdIdentity` が返す `namespace + numeric ordinal` を正本とする。
これによりslug違いとzero padding違い（`070` / `70`）を同一座標として
`duplicate_plan_identity` でfail-closeする。

既存衝突は `LEGACY_PLAN_ID_COLLISION_DEBT` のexact setだけを期限付きで許容する。
座標だけのallowlistにはせず、既存集合への3件目追加、構成plan_idの差し替えは拒否する。
衝突の一方を削除して解消した座標は許容し、debt集合を新規衝突の温存理由にしない。

- [x] slug違いとzero padding違いを同一numeric identityとして拒否する
  (`U-PLANGOV-002a` / `002b`)。
- [x] legacy exact setだけを許容し、3件目・構成差し替えを拒否し、衝突解消後は許容する
  (`U-PLANGOV-002c`〜`002f`)。
- [x] Issue #163 → PLAN-L7-435 delta → L7 test-design → `src/plan/lint.ts` /
  `src/plan/lint-policy.ts` → `tests/plan-lint.test.ts` を同一traceにする。

## テスト証跡

`U-PADM-001`〜`065` の一意なoracle IDを
`docs/test-design/harness/L7-unit-test-design.md` の同一IDへ対応させる。Green判定は上記`generates`の
test moduleを固定スナップショットで実行し、同一IDの重複が0件であることをtrace gateで確認する。
未実装の強制終了recoveryとGitHub ingressは `CANDIDATE-PADM-009`〜`010` のまま保持し、Greenと称さない。
