---
plan_id: PLAN-L7-458-node-self-hosted-bun-ban-foundation
title: "PLAN-L7-458 (add-impl): Node self-hosted Bun permanent-ban foundation"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-22
updated: 2026-07-23
owner: PO / Codex
github_issue_id: 152
parent_design: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - scanner object、debt baseline、Node build/bootstrap、SQLite adapter"
  - role: qa
    slot_label: "QA - detector self-host、delta/compliance分離、Bun process 0、mutation oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/bun-migration-debt.yaml
    artifact_type: config
  - artifact_path: docs/governance/node-toolchain-provenance.json
    artifact_type: json_config
  - artifact_path: src/lint/bun-permanent-ban.ts
    artifact_type: source_module
  - artifact_path: src/runtime/node-bootstrap.ts
    artifact_type: source_module
  - artifact_path: src/runtime/runtime-image-observer.ts
    artifact_type: source_module
  - artifact_path: scripts/build-node.mjs
    artifact_type: script
  - artifact_path: package-lock.json
    artifact_type: config
  - artifact_path: tsconfig.node.json
    artifact_type: json_config
  - artifact_path: tests/bun-permanent-ban.test.ts
    artifact_type: test_code
  - artifact_path: tests/node-self-host-bootstrap.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-image-observer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
  requires: []
  blocks: []
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/plans/PLAN-L4-33-node-control-plane-redesign.md
    - docs/plans/PLAN-L5-26-node-generation-activation.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/plans/PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - package.json
    - src/cli.ts
    - src/state-db/index.ts
    - scripts/run-vitest-snapshot.ts
review_evidence: []
---

# PLAN-L7-458: Node self-hosted Bun permanent-ban foundation

本PLANはIssue #152のD0-N設計を正本とし、Issue #153の一時bootstrap envelopeを恒久的なwaiverへ転用しない。Resource Kernel / Rust companionの設計・実装は別sliceであり、本PLANの開始条件でもF0のblockerでもない。

本PLANと直接上流L6-93は`status=draft`で同時authoring中のため、`parent`とL6側`blocks` edgeを保持しつつ
`dependencies.requires=[]`とする。draft中は実装開始を禁止する。L6が`confirmed`となり、review/admission
receiptが当該subject revisionへ一致するまでactivationは`node-activation-admission-not-ready`でfail-closeする。

## 1. Program boundary

本PLANは段階programである。現在のPR #154はD0-N設計だけを扱い、実装はF0a→F0b→F0c→Q0の順に
独立sliceで進める。Node self-host成立後、Bun scanner/ban auditの候補ID、test、実装を本PLANの後続revisionで
定義する。Node基盤とBun禁止をsame PR/sliceへ束ねず、F0完了をBun-ban final完了と呼ばない。

## 2. Gate semantics

- `delta guard`: frozen inventory digestに対する新規・変更・owner/期限喪失findingをRedにする。差分が無くてもoverall complianceをGreenにしない。
- `compliance`: `Compliant | NonCompliant | Indeterminate`の三値。既存production debtが1件でもあれば`NonCompliant`、coverage欠測なら`Indeterminate`で、どちらもaggregate Red。
- `zero`: production pathのfindingが1件でもあればRed。最終cutoverまで意図的にRedを維持する。
- `coverage`: scanner対象、parse結果、unknown executable artifact、runtime observer gapを集約し、欠測時は両modeをRedにする。
- negative fixture: detector ID、fixture root、期待findingをtyped registryへ隔離し、production allowlistとして利用不能にする。

## 3. Object分割

`ManifestScanner`、`ModuleSpecifierScanner`、`RuntimeGlobalScanner`、`ProcessArgvScanner`、`WorkflowHookScanner`、`PackScanner`、`CurrentDocScanner`、`RuntimeImageScanner`は短いpure objectとして`BanFinding`を返す。`BanInventory`がcanonical path、detector ID、evidence digestでsort/dedupeし、`DeltaGuard`と`CompliancePolicy`を別objectとして判定する。filesystem/process収集はportに隔離し、scannerへambient cwd/PATHを渡さない。

`NodeBootstrap`はreview済みlock graphからcompiled ESM entrypointを生成・照合し、実際に起動したNode/npm executable identity、external dependency closure、core digest、package-lock digest、build policy、subject revisionを`NodeBootstrapReceipt`へ封印する。CLIとreceiptは同一immutable generationへ置き、append-only activation markerで公開する。readerはvalidated markerの最高complete sequenceだけを採用し、途中失敗や並行readerへpartial generationを見せない。Node失敗時にBun、tsx、bunx、TS直実行へfallbackしない。

## 4. TDD order

1. unit `CAND-NODEBOOT-001..017`、integration `CAND-NODEBOOT-101..106`、system `CAND-NODEBOOT-201..208`、cutover unit `CAND-CUTOVER-001..008`を候補oracleとしてfreezeする。各候補は対応するtest codeと実装をowner revisionの同一commitへ追加し、Red実測を記録した場合だけ正式昇格する。D0文書だけでは一件も正式test IDを名乗らない。
2. F0aはexact pin、clean `npm ci`、lock graph再現性だけをRed→Green化する。
3. F0bはcompiled generation、receipt、executable custody、activation admissionをRed→Green化する。
4. F0cはLinux/Windows jobとaggregateをRed→Green化する。
5. Q0はNode self-hostを独立検証する。
6. Node self-host成立後の後続revisionでBun scanner/ban auditのTDD順序とfinal DoDを定義する。

frontmatterの`generates`はprogram全体の予定artifact一覧であり、現在のPR #154が全てを生成済みという意味ではない。
F0aはtoolchain/lock、F0bはbootstrap/generation、F0cはworkflow、Q0はqualification evidenceだけを生成する。
Bun scanner、debt manifest、ban audit成果物は後続revisionまで未生成である。

### 4.1 Node bootstrap候補トレース（設計Red）

現mainには`tests/node-self-host-bootstrap.test.ts`、`src/runtime/node-bootstrap.ts`、
`scripts/build-node.mjs`、`package-lock.json`、`tsconfig.node.json`が未着地である。
したがって以下は`CAND-NODEBOOT-001..005`の設計Redであり、Green又は正式`U-*`と主張しない。
対応test codeと実装を同じF0 sliceへ追加し、Red実測後にだけ正式昇格する。

| 候補ID | 実装／境界 | Red oracle |
|---|---|---|
| `CAND-NODEBOOT-001` | `NodeBootstrapReceipt`が実Node/npm identity、compiled ESM CLI、external dependency closure、`package-lock.json`、build policy、subject revisionを単一receiptで封印する | 正常receiptをloadし、各digest、`compiled-esm-only`、candidate revisionを照合 |
| `CAND-NODEBOOT-002` | ambient processからentrypointを推測せず、receipt欠落又はdraft上流からのactivationをfail-closeする | `node-bootstrap-receipt-missing`、`node-activation-admission-not-ready`を検証 |
| `CAND-NODEBOOT-003` | compiled CLI／Node executable／lock graphのsealed byte driftを個別に拒否する | 3 mutation caseが各digest mismatchを検証 |
| `CAND-NODEBOOT-004` | `../`、absolute path、symlinkでrepository/generation外へescapeする | repository/generation外のpathをprocess生成前に拒否 |
| `CAND-NODEBOOT-005` | marker publish各barrierでcrashさせ、二readerを競合させる | validated最高complete markerが指す旧または新generationだけを観測 |
| `CAND-NODEBOOT-006` | npm env identityだけを正規値へspoofする | 実npm executable/version/digest不一致をprocess生成前に拒否 |
| `CAND-NODEBOOT-007` | Node欠落・破損・version driftを注入する | Bun/bunx/tsx/TS直実行/shell fallbackのspawn call 0 |
| `CAND-NODEBOOT-008` | Windowsでsealed invocationを実行する | `shell=false`、`windowsHide=true`、receipt内absolute executable/entrypointだけを使用 |
| `CAND-NODEBOOT-009` | version文字列が同じ別npm CLI、または改竄npm CLIへ差替える | reviewed distribution provenanceのexpected CLI digest不一致で拒否 |
| `CAND-NODEBOOT-010` | POSIX marker write/sync/close/unique rename前後でprocess crashする | parent sync可能時に実施し、最高complete markerが旧または新generationだけを返す |
| `CAND-NODEBOOT-011` | Windows marker各barrierでprocess crashし、power-loss simulationを別case化する | process crashは旧/新completeのみ。power loss後はcomplete 1件以上なら最大、0件ならfail-close |
| `CAND-NODEBOOT-012` | 同時writerをbarrierで逆順完了させようとする | global lease winnerだけがN+1をpublishし、loserはretry無しfail-close、distinct sequence逆順0 |
| `CAND-NODEBOOT-013` | crash残留`dist/node-publish.lock/`をowner欠落/PID終了/time経過で回復・steal・clearするmutation | readerはcomplete marker利用可、publisherは永久fail-close、回復/手動削除API 0 |
| `CAND-NODEBOOT-014` | automatic GC、generation deletion API、cleanup経由deleteを注入する | F0 scanner/ASTで削除surface 0、全immutable generation保持 |
| `CAND-NODEBOOT-015` | same-revision rollbackとcross-revision rollbackを混線する | 同一revisionだけ新marker、cross-revision API 0/fail-close、git revert新revisionへroute |
| `CAND-NODEBOOT-016` | Windows F0 receiptへpower-loss durable claimを注入する | unsupported claimを拒否し、Resource Kernel trust floorへのdeferを保持 |
| `CAND-NODEBOOT-017` | L6 draft、admission欠落、review欠落でF0 commandを要求する | F0a/F0b command dispatch 0、`node-activation-admission-not-ready` |

### 4.2 Cutover候補unit trace

| 候補ID | Red入力 | Green oracle |
|---|---|---|
| `CAND-CUTOVER-001` | 空chain又は不正genesis | uninitialized、開始不可。null previous fieldsと正規evidenceだけでgenesis |
| `CAND-CUTOVER-002` | valid chain reducer | chain headとprojection stateが一致 |
| `CAND-CUTOVER-003` | 各edgeのrequired evidence | edge別kind/count/producer/revision/digest/exitをexact照合 |
| `CAND-CUTOVER-004` | 別edge用又は不足evidence | append前にfail-close |
| `CAND-CUTOVER-005` | receipt/evidence replay | subject revision又はchain head不一致で拒否 |
| `CAND-CUTOVER-006` | 非隣接skip/reverse | transition 0 |
| `CAND-CUTOVER-007` | receipt/chain digest mutation | projection前に拒否 |
| `CAND-CUTOVER-008` | DB/UI state直接更新 | validated chain由来projectionだけを返す |

予定実装トレースは`src/runtime/node-bootstrap.ts`、`scripts/build-node.mjs`、
`src/state-db/stop-refresh.ts`、compiled Nodeを呼ぶhook設定、CLI wrapper、snapshot runnerへ接続する。
これらが未着地の現在はNode bootstrap境界もRedであり、既存Bun test Greenを代替証拠にしない。

## 5. Slice acceptance

- [ ] D0-N: 設計、candidate trace、ownership、draft admissionがreview済みである。
- [ ] F0a: exact pin、clean `npm ci`、lock graph再現性がGreenである。
- [ ] F0b: sealed generation、loader、executable custody、activation receiptがGreenである。
- [ ] F0c: Linux/Windows jobとaggregateがGreenである。
- [ ] Q0: Node self-host qualificationと独立reviewがtested commitへ一致する。
- [ ] Bun-ban final: Node self-host後のPLAN revisionがscanner/ban audit候補と物理削除DoDを定義し、別途完了する。

PR #154/F0の完了はBun-ban final完了を意味しない。

## 6. Issue #153 bootstrap envelopeのslice別gate

同じgate案をIssue #153の[review FLAG follow-up](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/153#issuecomment-5065921409)へ記録した。GitHubコメント単独を正本にせず、本節と差異が出た場合は設計修正を先に行う。

- **D0-N**: candidate IDだけを持ち、plan/frontmatter/readability/traceがGreen。current Bunとtarget Nodeを区別し、実装Greenを主張しない。
- **F0a (toolchain)**: static exact Node/npm pin、clean `npm ci`、lock graph reproducibilityだけをRed→Green化する。
- **F0b (sealed build)**: runtime npm substitute、Node missing、receipt closure（unit 006/007/009）、subject revision、immutable generation、exact mkdir lease、append marker、crash/power-loss境界、same-revision rollback、GC/delete/recovery API 0をRed→Green化する。
- **F0c (CI)**: Node Linux/Windowsと既存harness Linux/Windowsを同一HEAD/run attemptでaggregateし、failure/cancel/skipを非successにする。
- **Q0**: compiled Node CLIでfixture authoringとreceipt verifyを行い、Bun/bunx/tsx/TS/shell process 0を独立観測する。
- 全sliceでcandidate-owned CI Redは0とする。Issue #153が許容できるのは継承main負債`PLAN-RECOVERY-16` / `PLAN-L7-452`だけであり、上記gate、detector、receipt、reviewをwaiveしない。

### CAND ownership

| Slice | Candidate ownership |
|---|---|
| F0a toolchain | `CAND-NODEBOOT-017`, `101` |
| F0b sealed build | `CAND-NODEBOOT-001..016`, `102`, `205` |
| F0c CI | `CAND-NODEBOOT-103..106`, `206` |
| Q0 | `CAND-NODEBOOT-201..204` |
| cutover revision | `CAND-CUTOVER-001..008`, `CAND-NODEBOOT-207` |
| final deletion | `CAND-NODEBOOT-208` |

候補は一つのownerだけを持つ。F0a/F0b/F0cを再結合せず、各sliceのtest+implementation同一commitでのみ正式IDへ昇格する。

`CAND-BUNBAN-*`はD0-Nでは定義もfreezeもしない。Node self-hostが動作した後、既存のBun禁止PLANを
別revisionで更新して候補IDとoracleを定義する。それ以前に未定義IDのGreenまたは予約済みを主張しない。
