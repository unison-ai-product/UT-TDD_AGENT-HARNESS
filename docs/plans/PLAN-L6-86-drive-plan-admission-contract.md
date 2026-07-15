---
plan_id: PLAN-L6-86-drive-plan-admission-contract
title: "PLAN-L6-86 (add-design): 駆動モデル準拠PLAN Admission契約"
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
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - 許可tuple / Admission Policy / authoring transaction"
  - role: qa
    slot_label: "QA - unknown・backdate・archived・直接編集のfail-close oracle"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
  blocks:
    - docs/plans/PLAN-L7-435-drive-plan-admission-impl.md
---

# PLAN-L6-86: 駆動モデル準拠PLAN Admission契約

## 目的

規定外PLANを事後lintだけでなく、正式な `ut-tdd plan draft` の書込み前に拒否する。
通常ForwardはIssueを要求しない。Forward外の駆動モデルへ遷移する場合だけ、`drive_model`
（`route_mode`の閉じた値域）、origin PLAN/revision/state、escape reason、再合流先、GitHub Issueを
同一Admission証明書へ束縛する。

## 正本決定表

許可判定は独立したkind集合とlayer集合の直積ではなく、次の一行一tupleを正本とする。

`signal → route_mode → episode_kind → (kind, layer, sub_doc, workflow_phase) → branch_prefix → issue_policy → pairing → origin/reentry → approval → gate`

`route_mode`は駆動モデル、`drive`は実装専門職であり混同を拒否する。Incidentの
`troubleshoot/L7` と `recovery/cross` のような相関は別tupleで表し、存在しない直積を許可しない。

駆動モデルの判定軸は起点（監査・PoC・Issue等）でも先行実装の保存/廃棄でもなく、**遷移方向**である。
`reverse`は`実装 → 設計`へ引き戻し、実装事実を設計へ追従・正規化してForwardへ合流する。`redesign`は
`設計 → 実装`へ降下し、監査レポート・PoC破棄・外部変化・上流判断などを入力に設計を先に修正・差替え、
Forward合流後にその設計から実装する。保存/廃棄はmodeを選ぶ主軸ではないが、矛盾する状態を拒否する:
Reverseは`preserved`、redesignは`discarded`または`none`だけを許可する。`redesign`は起点証拠、
既存設計の`supersedes`対象、Forward合流先、合流後に開始する
実装PLAN/revisionをreceiptへ束縛する。これにより内部探索・外部探索・update起票から設計修正、実装、
中間検証、Forward再合流までを一つの閉ループにする。

## Admission順序と原子性

1. signalを分類し、未知・曖昧・低信頼はForwardへのfallbackなしで拒否する。
2. 署名済みの許可tupleへkind/layer/sub_doc/workflow phase/branchを照合する。
3. 通常ForwardはIssueなしを許可する。Forward escape（Reverse、redesign、incident等）はIssue、origin、escape reason、drive model、
   reentry targetを全て必須とする。
4. frontmatter単体検査、prospectiveなcross-record governance、工程表登録を検証する。
5. 全検証Green後にだけdurable authoring journalへintentを記録する。SQLite Unit of Workを開始して
   ID reservationとPlanAsset/ledger appendを未commitで行い、そのreceiptからauthoring sourceとtracked
   projectionを生成する。両成果物のtemp write/fsync/rename完了後にSQLiteをcommitし、最後にjournalを
   terminalへ進める。利用者入力のdigest・receipt・projection本文を正本にしない。

通常の拒否・失敗時はPLAN file、reservation、ledger、DB projection、GitHub outboxを一件も残さない。
ファイルシステムとSQLiteは単一transactionにできないため、DB commit前の通常例外はfile restoreとDB
rollbackの双方を検証し、曖昧なら成功に倒さない。強制終了時はjournalを未完としてfail-closeし、次回起動・
hook・CIがledger receipt、preimage、postimage、temp/rollback fileを照合してrecoveryまたは明示rollbackを
完了するまで正本扱いしない。再起動不能なprocess内tokenをrecovery証拠にせず、必要なpathとdigestはjournal
eventへ永続化する。単純なDB先行またはfile先行の二段書込みは禁止する。`--force`はname collision解決だけに
限定し、Admission拒否を回避できない。

## 改ざん防止と多層検証

`plan draft`を唯一の正式authoring入口とする。admission receiptはsource hash、asset/revision、
route decision digest、origin、Issue bindingを持つ。直接`docs/plans/PLAN-*.md`を追加・編集した場合は
hook、pre-push、PR CIがreceipt不在またはdigest staleとしてfail-closeする。GitHub Issue webhookも
signature/dedupe/enum/originを検証し、不正なものはquarantineしてPLANへ進めない。

CIで再現可能な正本はローカルSQLiteだけに置かない。`plan draft`はSQLite journalと同一commandから
tracked append-only receipt projectionを出力し、receipt v2がpath、plan_id、asset/revision、本文を含む
canonical content digest、command_id、receipt digestを束縛する。差分fenceはGit base/headのPLANと
tracked projectionを照合し、手製receipt、別PLANへのコピー、rename、本文だけの改竄を拒否する。

## Red oracle

- `CANDIDATE-PADM-001`: 正常Forward tupleだけがIssueなしで許可される。
- `CANDIDATE-PADM-002`: unknown/ambiguous signalはForwardへfallbackせずwrite 0で拒否される。
- `CANDIDATE-PADM-003`: kind/layer/phase/branchの一軸変異を拒否する。
- `CANDIDATE-PADM-004`: Forward escapeでIssue/drive/origin/reentryの一項欠落を拒否する。
- `CANDIDATE-PADM-005`: created backdate、archived、新規route_mode欠落、`--force`での回避を拒否する。
- `CANDIDATE-PADM-006`: schedule未登録・stale・target不一致を拒否する。
- `CANDIDATE-PADM-007`: admission後のfrontmatter改ざんをhook/pre-push/CIが拒否する。
- `CANDIDATE-PADM-008`: command replayは同一receiptへ収束し、payload差替えは拒否する。

## AC

- [ ] 許可tupleが駆動モデル、kind、layer、phase、branch、Issue、pairingを一つの機械表で表す。
- [ ] `ut-tdd plan draft`は書込み前にAdmissionを通し、拒否時の副作用は0である。
- [ ] 通常ForwardはIssueなし、Forward escapeはIssue必須を機械的に区別する。
- [ ] unknown/archived/backdate/direct-edit/forceの各回避経路がfail-closeする。
- [ ] L7-435でunit/property/mutation/CLI/hook/CI oracleをRed→Greenにし、Reverse backfillを行う。
