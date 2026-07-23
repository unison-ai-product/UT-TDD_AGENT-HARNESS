---
plan_id: PLAN-L5-19-repository-document-disposition-ledger
title: "PLAN-L5-19 (add-design/physical-data): repository全docs disposition ledger詳細設計"
kind: add-design
layer: L5
sub_doc: physical-data
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - baseline/final snapshot、disposition、delta境界"
  - role: se
    slot_label: "SE - shard schema、typed edge、生成view"
  - role: qa
    slot_label: "QA - 921件exactly-once、phantom、rename、orphan負系"
generates:
  - artifact_path: docs/governance/repository-document-disposition/manifest.yaml
    artifact_type: yaml_config
  - artifact_path: docs/governance/repository-document-disposition/entries/index.yaml
    artifact_type: yaml_config
  - artifact_path: docs/governance/repository-document-disposition-ledger.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L4-25-repository-docs-engine-swap-audit.md
  blocks:
    - docs/plans/PLAN-L6-74-repository-docs-disposition-auditor-contracts.md
  references:
    - docs/plans/PLAN-L5-16-vmodel-source-profile-physical-data.md
    - docs/plans/PLAN-L5-18-vmodel-contract-right-arm-physical-data.md
    - docs/governance/document-system-map.md
---

# PLAN-L5-19: repository全docs disposition ledger詳細設計

## 基準点と正本

監査baselineは不変に`HEAD 3d232e9c`へ固定する。tracked `docs/**` 921件、`HEAD:docs` tree OID
`310ec6de57cf8313096ea4c0fd95e1cff3db5a48`、`git ls-tree -r -z --name-only 3d232e9c -- docs` raw stream SHA-256
`02b618ce268ca68a7b6636b9aa9216d157c21da45a633b0fbab73126e0f47382`である。本baselineを再採取で上書きせず、
本commit以後の新規/更新/削除/renameはexplicit deltaへmaterializeする。

## 設計範囲

- `manifest.yaml`にschema version、ledger ID、baseline/final snapshot、raw NUL hash algorithm、shard一覧、
  delta列のcanonical digestを持つ。snapshot identityは`canonical-frame-v1`で
  `repository_identity, commit_oid, repository_tree_oid, selection_revision, selection_digest,
  tracked_count, path_stream_hash, zone_set_digest, member_set_digest`をこの順に束縛する。
  各fieldは`uint32be(name UTF-8長) + name UTF-8 + uint64be(value byte長) + value bytes`でframe化し、
  時刻、working tree、OSをidentityへ含めない。
- `repository-documents-v1`は`docs_tree|root_policy|runtime_policy|skills|github_policy`の5 zoneを必須とする。
  baseline 921件は`docs_tree`だけの件数であり、repository全体件数にしない。各zoneの
  selector digest、tree OID又は空bytes、member count、member set digestをzone IDのUTF-8 byte順で
  `zone_set_digest`へ束縛し、zone外のtracked文書は`doc-selection-unclassified`で拒否する。
- zone別shardにbaselineの全pathをmaterialized recordとしてexactly once記載する。selectorは
  authoring commandの入力に限り、展開結果の921 recordとselector digestを同一transactionで固定する。
  detectorがselectorから判断を補完したり、既存relation graphのnode数で921件を代用したりしない。
- baseline recordは`path`、Git blob OID、content SHA-256、zone、disposition、reason、target、PLAN、
  impact tag、authoring provenance、application statusを持つ。`update|merge|supersede|archive`は1件以上の
  typed targetまたはPLAN、`retain|not_applicable`は空でない理由を必須とする。
- application statusは`pending|applied|verified`、canonical applicabilityは
  `applicable|conditional|deferred|not_applicable`だけとする。authoring入力の`defer`は`deferred`、
  `skip`は`not_applicable`へauthoring loaderで正規化し、closure queryへraw語を渡さない。
  `conditional`はreason/observed condition/reevaluation trigger、`deferred`はreason/trigger/PLAN、
  `not_applicable`はreason/deciderを必須とし、他kindではkind固有fieldをNULLに固定する。
- baseline後の`add|modify|delete|rename`は順序付きappend-only deltaとする。renameはbefore/after pathと
  blobを同時に持ち、delete後のmodify、存在pathへのadd、同一path rename、case-fold衝突を拒否する。
  addされた文書にもbaseline recordと同じ判断fieldを持たせ、最終集合に「台帳外の新規文書」を残さない。
  Git差分からrenameを推測しない。raw差分はpath/blob identityによるadd/modify/deleteとして観測し、
  明示rename deltaだけが対応するdelete+addを一つの判断として消費する。明示renameがなければ
  `doc-delta-unregistered`をdeleteとaddの2件として返す。
- projectionはsnapshot/member/disposition/target/PLAN/tag/delta/effective-path/reference/run/findingを
  正規化する。authoring rowのcanonical digestは、field名を含むlength-prefixed UTF-8 frameを
  pathのUnicode NFC・`/`区切り正規形でSHA-256化する。配列は意味上の順序を定義するもの以外を
  stable identity順へsortし、YAML表記順・改行・OS・取得時刻でdigestを変えない。
- Markdown ledgerは生成view、DBは削除可能な検索projectionである。authoring manifest/shard/delta以外へ
  書き戻さず、DB行やfindingからdisposition、target、legacy判断を逆生成しない。

## 物理不変条件

1. `document_snapshots`と`document_snapshot_members`でbaseline/finalのGit objectを全件封印し、
   memberは`(snapshot_id,path)`を主キー、`(snapshot_id,casefold_path)`を一意とする。
2. `document_dispositions`は`(ledger_id,baseline_path)`を主キーとし、baseline memberへ複合FKを持つ。
   target/PLAN/tagはこの複合主キーへ従属し、親のない子、別ledgerへの横断edgeを許さない。
3. `document_delta_events`は`(ledger_id,sequence)`と`delta_id`を一意とし、previous event digestで鎖を作る。
   before/after memberはkind別CHECKと複合FKで拘束する。
4. `document_effective_paths`はbaseline+deltaのreduction projectionであり、
   `(ledger_id,final_snapshot_id,path)`を主キーとする。final snapshot memberと集合が完全一致し、
   origin baseline pathまたはadd deltaのどちらか一方へ必ず辿れる。
5. `document_reference_edges`はfinal snapshotとfrom pathを複合FKで拘束し、targetを
   `document|anchor|plan|spec|test|adr|external`の閉じた型で保持する。repo内targetは実在member/anchor/IDへ
   解決し、parse error、曖昧anchor、unknown schemeをedge 0件へ変換しない。
6. closure runはbaseline/final snapshot、ledger digest、delta chain digest、reference digest、
   parser/policy revisionを固定する。同一入力は同じrun identity/finding ID集合を返し、findingの時刻や
   message文面をidentityへ含めない。

## rebuild / rollback / legacy

- rebuildは固定Git objectとauthoring bundleを全てpreflightした後、temporary table群へ1 transactionで
  materializeする。countだけでなくPK集合、row digest、FK orphan、delta reduction、final member集合、
  reference edge/finding集合を照合してからswapする。parse、FK、digest、write、swapの任意faultでは
  temporary tableを破棄し、直前のGreen projectionとauthoring sourceを不変に保つ。
- projection schema変更はversionを上げ、旧tableの値から欠落dispositionやreferenceを推測backfillしない。
  現行authoring bundleから再構築できない旧行は`legacy_unbound` findingとして隔離し、close条件へ算入しない。
- `docs/archive/**`、historical migration資料、否定文、引用、negative fixtureは監査対象から除外しない。
  zone=`archive|history|fixture`としてexactly once台帳化する一方、旧語の存在だけでcanonical violationにしない。
  canonical文書からarchive/historyへの規範参照、archiveからcanonicalへのauthority主張、legacy commandの
  現行実行例だけをtyped policyでfail-closeする。path prefixだけで意味を推測せず、authored zoneと
  reference edge policyを照合する。

## 受入条件

- missing/duplicate/phantom/case-fold collision、理由/target/PLAN欠落、未台帳add/modify/delete/renameを拒否する。
- final path集合をbaselineとexplicit deltaから再構築でき、final Git snapshotとの差分0、
  pending 0かつtyped cross-reference orphan 0のみ完了とする。
- projection全削除後のrebuildでsnapshot/member/effective path/reference/findingのPK集合とdigestが一致する。
  fault injection後は旧Green projectionのdigestが不変で、部分行とauthoring source更新が0件である。
- rename chain、delete/addによる同名再生成、case-only rename、broken/ambiguous anchor、unknown typed IDを
  stable findingとして検出する。
- 旧前提検出はcanonical assertionに限定し、archive/history/否定文/negative fixtureを誤検知しない。
