---
plan_id: PLAN-L4-25-repository-docs-engine-swap-audit
title: "PLAN-L4-25 (add-design): repository全docs disposition・DDD/OOP・FSM/右腕波及監査"
kind: add-design
layer: L4
sub_doc: architecture
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: "TL - 全tracked docsの責務・正本階層・更新判断"
  - role: se
    slot_label: "SE - DDD/OOP、FSM/PLAN v2、contract-derived detectorの設計波及"
  - role: qa
    slot_label: "QA - snapshot件数、exactly-once、orphan、stale assumptionの閉包"
  - role: docs
    slot_label: "Docs - 日本語正本、重複/廃止/統合、cross-reference更新"
generates:
  - artifact_path: docs/governance/repository-document-disposition-ledger.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/repository-document-disposition/manifest.yaml
    artifact_type: yaml_config
  - artifact_path: docs/governance/repository-document-disposition/entries/index.yaml
    artifact_type: yaml_config
  - artifact_path: docs/governance/document-system-map.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-22-vmodel-source-disposition-profile-ssot.md
    - docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
    - docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
    - docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
---

# PLAN-L4-25: repository全docs disposition・DDD/OOP・FSM/右腕波及監査

## 1. 目的

repository内の全tracked documentをsnapshot単位でinventoryし、今回のengine-swapに対する
`update|merge|retain|supersede|archive|not_applicable`をexactly once記録する。ZIP 109件の監査だけで
既存HARNESS正本の全面見直しを代替しない。

## 2. 必須観点

- canonical/reference/archive境界、重複責務、stale count/path/status/route/gate表現
- Forward FSM、PLAN Asset v2、revision-bound evidenceへの波及
- source 109→item 163→target slot dispositionへの接続
- L8-L14/G8-G14 contract、L11/L13 process evidence、roadmap park撤去への波及
- bounded context、aggregate、value object、invariant、port/repository、CQS等DDD/OOP設計のL4-L6全正本への波及
- class/method設計が縮退・欠落しているdomainを検出し、PLAN-L4-26のobject/method設計へ接続
- ZIP 163 semantic itemのHARNESS実装正しさをPLAN-L4-27で全件検証し、存在確認だけのgreenを禁止
- concept/requirements/ADR/design/test-design/process/governance/PLAN間の参照更新

## 3. 受入条件

- 監査開始commit、repository root tree、`repository-documents-v1` selection/zone証拠をledger headerへ固定する。
- `docs_tree|root_policy|runtime_policy|skills|github_policy`を必須zoneとし、921件は`docs_tree`だけの
  baseline fixtureとして保持する。zone外tracked文書を暗黙除外しない。
- path集合hashは各zoneについて`git ls-tree -r -z --name-only <baseline_commit> -- <selector>`の
  raw NUL streamを`sha256`で算出し、working treeやOS依存の改行joinを使わない。
- baselineの全tracked docsがexactly once現れ、未判断・重複・存在しないpathが0件である。
- `update|merge|supersede|archive`はtarget artifact/PLAN、`retain|not_applicable`は判断理由を持つ。
- DDD/OOP波及対象のL4-L6正本、FSM/PLAN v2対象、右腕対象をtagで検索できる。
- classを使わない判断も理由とpure function/VO/port境界を持ち、設計欠落を「非OOP」で正当化しない。
- 旧前提 `572|107文書|~150 items|3 profiles|最小影響|L8-L14恒久park` のcanonical残存が0件である。
- 更新完了後の全docsを再snapshotし、未処理deltaとcross-reference orphanを0にする。
- baseline後のadd/modify/delete/renameは明示deltaとして保持し、baseline exactly-onceと最終path/blob集合の双方を閉包する。
  renameはGit heuristicから推測せず、明示renameがなければdelete/addとして扱う。
- detectorはledgerを読み、監査対象/判断/targetを推測生成しない。

## 4. 降下先

文書群ごとのadd-design/reverse/update PLAN、cross-reference migration、readability/design-language/doc-consistency gateを
同一program内で起票する。大きさを理由に対象文書を除外しない。

## 5. L4 freeze契約

### 5.1 台帳が表すもの

repository document disposition ledgerはファイル一覧でも、検出器が走査時に推測する分類結果でもない。
`baseline_commit`に存在した全tracked repository documentsと、その後の明示deltaを対象に、各文書の意味、適用条件、
正本上の位置付け、今回のengine-swapでの処置、参照閉包を人間がauthoringした判断台帳である。

台帳の1 recordは少なくとも次の事実を不可分に保持する。

| 契約面 | 必須内容 |
|---|---|
| identity | baseline/finalのpath、Git blob OID、content digest。renameは旧pathと新pathを同じdelta identityへ束縛する |
| meaning | 文書が所有する責務、対象読者、上流入力、下流consumer、canonical assertionの要約 |
| applicability | canonical `applicable | conditional | deferred | not_applicable`、判定条件、判断主体、理由、再評価trigger。authoring語`skip|defer`は境界で正規化 |
| authority | `canonical | reference | generated_view | archive`。同じ責務のcanonical ownerは1件だけ |
| disposition | §5.2の処置、理由、target、実行PLAN、適用状態 |
| impact | DDD/OOP、FSM/PLAN Asset、right-arm、source/item、駆動モデル、runtime、distributionへの影響tag |
| references | typed outbound edge、期待するinbound edge、anchor、参照時に引き継ぐ意味 |
| evidence | 判断根拠、レビュー根拠、適用後blob、closure run。存在確認だけをsubstance証拠にしない |

`meaning`は自由な一行メモで済ませない。責務・入力・consumer・canonical assertionが欠けるrecordは
「ファイルは数えたが設計資産を理解していない」ためpendingである。archive/history/negative fixtureに現れる語を
現行設計のassertionとして数えない。

### 5.2 dispositionの意味

| disposition | 意味 | 必須後条件 |
|---|---|---|
| `update` | identityとcanonical責務を維持し、内容を新設計へ更新する | targetは自己path。適用後blobと変更PLANを記録 |
| `merge` | 責務を別canonical文書へ統合し、重複正本を消す | target canonical、移送する意味、旧pathの最終処置を記録 |
| `retain` | 現状が新設計と整合し、変更せず保持する | 整合理由と比較対象を記録。未確認をretainにしない |
| `supersede` | 新canonicalへ置換し、旧文書を現行参照から外す | successor、参照書換え、旧pathのarchive/delete処置を記録 |
| `archive` | 現行正本ではない履歴証拠として保存する | canonicalからの参照禁止範囲と、必要なhistorical linkを記録 |
| `not_applicable` | 条件評価の結果、当該repositoryには適用しない | applicability条件、観測値、再評価trigger、判断主体を記録 |

`reference`はdispositionではなくauthorityである。reference文書にも`retain|update|supersede|archive|not_applicable`
の処置が必要であり、「参考だから未判断」を許さない。`generated_view`はgenerator/input schemaをtargetに持ち、
手編集でclosureを作らない。

### 5.3 applicabilityの閉じ方

- `applicable`は現在の条件で適用され、application status=`pending|applied|verified`を別fieldで持つ。
- `conditional`は正本profile/capability ID、観測条件、理由、再評価triggerを持つ。条件未評価はpendingであり
  `not_applicable`ではない。
- `deferred`は理由、再評価trigger、解消PLANを必須とする。
- `not_applicable`は理由と判断主体を必須とし、適用性の既定値にしない。
- authoring入力の`skip`は`not_applicable`、`defer`は`deferred`へloaderで正規化し、queryへraw語を渡さない。
- target slotが存在しないreferenceはclosedではない。slot追加、別targetへの再判断、または理由付き
  `not_applicable`のいずれかを設計者が選ぶまでpendingとする。

この契約によりA-187の`ZIP-DOC-054/055/059/063/066/068`のような「profileで判断するがslotがない」
状態と、`ZIP-DOC-041`のようなtarget方針との衝突を、catalogの`done`だけで隠せない。

### 5.4 reference closure

reference closureは「link先pathが存在する」だけでは成立しない。全final tracked docについて次を満たす。

1. frontmatter path、Markdown inline/reference link、wiki link、anchor、PLAN/spec/test IDをtyped edgeとして読む。
2. sourceが渡す意味とtargetが所有する意味が一致する。target存在だけのedgeは未検証である。
3. canonical edgeはarchive、削除path、generated viewを正本として参照しない。
4. supersede/merge/rename/delete deltaは全inbound edgeを書き換え、旧pathへのcanonical inboundを0にする。
5. anchor、PLAN full ID、spec/test IDが一意に解決する。短縮PLAN番号の多義性はfail-closeする。
6. reference targetのapplicabilityが未評価、またはsourceとprofile条件が矛盾する場合はopen findingにする。
7. parse不能、未知scheme、循環するsupersession、case-fold collisionを空集合やwarningへ縮退しない。

closureの単位はbaselineだけでなくfinal snapshotである。baseline record全件exactly once、explicit delta全件、
final path全件、typed edge全件が同じclosure runへ束縛され、`pending=0 / missing=0 / duplicate=0 /
phantom=0 / semantic_mismatch=0 / orphan=0 / stale_inbound=0`の時だけ完了する。

### 5.5 A-187 dispositionへの適用

A-187のfindingは台帳recordへ移し、監査文だけを完了根拠にしない。

- claim-only/target誤指定は`meaning`とtargetのcanonical assertion比較でopenにする。
- profile slot不在はapplicability未評価としてopenにする。
- securityのように設計実体とL9 pairが追加されたものは、新blobとsemantic edgeを証拠に再判定する。
- semantic catalogの`done`とself-assessmentの`pending_review`が競合する場合、弱い`done`へ寄せずpendingを維持する。
- partial/missingは必ずtarget PLANと再検証条件を持ち、存在確認やkeyword hitでclosedにしない。

## 6. L4↔L9 pair freeze

`ST-DOCSEM-01..08`を`docs/test-design/harness/L9-system-test-design.md`の正規pairとする。
L9は本節からoracleを導出し、record fieldや許容値を独自追加しない。L4変更時は対応STとfixtureを同じ差分で
更新し、L9 greenだけでmeaning/applicability/disposition判断を創作しない。
