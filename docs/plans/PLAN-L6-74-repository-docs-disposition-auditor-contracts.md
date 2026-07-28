---
plan_id: PLAN-L6-74-repository-docs-disposition-auditor-contracts
title: "PLAN-L6-74 (add-design/function-spec): repository docs disposition / closure auditor契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - init/set/materialize/validate/reference closure契約"
  - role: qa
    slot_label: "QA - missing/phantom/delta/orphan/stale premise oracle"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-19-repository-document-disposition-ledger.md
  requires: []
  blocks:
    - docs/plans/PLAN-L7-422-repository-document-disposition-closure-gate.md
---

# PLAN-L6-74: repository docs disposition / closure auditor契約

- `captureDocsSnapshot`はGit objectからraw NUL path stream/count/tree OID/hashを返し、working treeの一時状態を正本にしない。
- `materializeDispositionBatch`はselectorを最終recordへ展開するcommand、`validateDispositionLedger`はread-only queryとする。
- `analyzeDocumentReferences`はreaderが生成した同一snapshotのtyped edgeをanchor/ID registryとauthority/applicability policyで解決し、現行relation graphのfail-openを再利用しない。
- baseline/delta/final closure、conditional field、target/PLAN、canonical stale assertionを独立finding IDで検証する。
- CLIは`init|materialize|set`をwrite command、`diff|references check|check|report`をqueryに分離し、usage=2、contract violation=1、green=0を固定する。
- reference readerはfrontmatter path、Markdown inline/reference、wiki link、anchor定義、PLAN/spec/test IDをtyped edge化し、parse error/unknown scheme/anchor構文不正を空集合へ変換しない。anchor endpointの欠落・多義はanalyzerが判定する。
- reference reader入力はfinal snapshot digestとsource path/blob OID/content digest/raw bytesを不可分に持ち、
  blob digest不一致をparse前に拒否する。syntax/parser/anchor、URI構文registry、
  frontmatter schema、reader registry revisionをreceiptへ束縛する。
- path/fragmentはPOSIX relative解決、single percent decode、Unicode NFCを順に適用し、root escape、
  encoded separator/dot segment、短縮・多義typed IDをfail-closeする。
- readerはsyntax抽出と正規化、analyzerはsnapshot/anchor/ID registry解決と明示revisionの
  authority/applicability判定を担当し、責務を相互に推測補完しない。

## 設計freeze

repository文書の完了判定は、同一Git treeから取得した`RepositoryDocsSnapshot`、全pathをexactly once
materializeした`DocumentDispositionLedger`、同snapshotのblobから抽出した`DocumentReferenceGraph`、
およびfindingごとの`DocumentDebtRoute`を一度だけjoinして行う。working tree、既存DB projection、
過去reportの件数、selectorの再評価を不足入力の補完へ使わない。

- queryは`captureRepositoryDocsSnapshot`、`analyzeRepositoryDocumentClosure`、
  `verifyDocumentDebtRoutes`に分離し、authoring sourceやDBを更新しない。
- commandは`materializeDispositionBatch`と明示的な`setDisposition`だけとし、query結果から判断を
  自動記入しない。
- missing、phantom、duplicate、case-fold collision、未登録delta、broken reference、
  anchor欠落、canonical assertion staleを別finding IDで返す。
- snapshot queryは`canonical-frame-v1`でrepository/commit/root tree/selection/path/memberと
  5 zoneのselector/tree/member証拠を束縛する。921は`docs_tree`だけのbaseline fixtureとし、
  zone外tracked文書と必須zone欠落をfail-closeする。
- applicabilityはauthoring境界で`skip→not_applicable`、`defer→deferred`へ正規化し、
  closure queryは`applicable|conditional|deferred|not_applicable`だけを受理する。
  application statusは`pending|applied|verified`、kind固有field以外はNULLとする。
- delta closureはpath/blob identityの`add|modify|delete|rename`をsequence replayする。
  Git rename heuristicをauthorityにせず、明示renameがなければdeleteとaddを別findingにする。
- reference edge/parse receiptはsource member、byte range、raw/normalized target、
  parser/syntax/anchor/scheme revisionを`canonical-frame-v1`へ束縛する。同一入力のedge/error集合と
  receipt digestは入力順・OS・localeに依存せず、parse errorをedge 0件の正常結果へ変換しない。
- blocking findingはsnapshot digest、subject path/edge、filing target、PLAN IDへ束縛したdebt routeを
  必須とする。route記録はfindingの解消やclosure Greenを意味しない。
- `U-DOCLEDGER-001..005`、`IT-DOCLEDGER-01..07`、`ST-DOCLEDGER-01..05`を本sliceの実装前Redとして固定する。
  reference解析・canonical assertion・debt routeのunit oracleは後続sliceで再採番する。
  現時点ではoracle実装・Green証拠がないため、本PLANの設計freezeを実装完了と読み替えない。
