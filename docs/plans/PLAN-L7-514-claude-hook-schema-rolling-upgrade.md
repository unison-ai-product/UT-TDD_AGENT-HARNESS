---
plan_id: PLAN-L7-514-claude-hook-schema-rolling-upgrade
title: "Claude VS Code hook generation schema の rolling upgrade"
kind: add-impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-08-27
updated: 2026-08-27
owner: PO / TL
github_issue_id: 433
parent_design: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
pair_artifact: docs/test-design/harness/L7-514-claude-hook-schema-rolling-upgrade-test-design.md
backprop_decision: required
backprop_decision_reason: "長寿命Claude hookのschema driftと再起動境界をL6のlive workspace routing契約へ戻し、既存request identityを保全する。"
agent_slots:
  - role: se
    slot_label: "Luna worker - generation marker activation と restart handoff の最小実装"
  - role: qa
    slot_label: "Terra - crash/restart/replay と cross-platform identity oracle"
  - role: tl
    slot_label: "Sol - #416/#422との責務境界、exact-one active generation、fail-close判定"
  - role: qa
    slot_label: "Claude Opus 5 - non-author exact-head closing review"
generates:
  - artifact_path: docs/plans/PLAN-L7-514-claude-hook-schema-rolling-upgrade.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  requires:
    - docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-416-active-upgrade-frontier-right-arm-gate.md
    - docs/plans/PLAN-L7-472-claude-memory-async-wake.md
    - docs/design/harness/L6-function-design/memory.md
    - src/runtime/claude-memory-wake.ts
    - src/cli/review-live.ts
    - src/feedback/live-review-projection.ts
    - docs/plans/PLAN-REVERSE-514-claude-hook-schema-rolling-upgrade-backfill.md
    - docs/test-design/harness/L7-514-claude-hook-schema-rolling-upgrade-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/433
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/416
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/422
review_evidence: []
---

# PLAN-L7-514: Claude VS Code hook generation schema の rolling upgrade

## 1. 目的と境界

PR #422（Issue #416）で固定した live workspace routing は、対応する schema の generation markerを
読める稼働中の Claude VS Code workspaceだけへwakeを配送する。しかし、main更新前から長時間生存する
Claude hook processが旧text markerを残したままだと、現行hookは互換性を推測できず、#410・#423・#431の
既存requestを消費する前に停止する。このPLANは、長寿命processを無言で継続させず、明示的な再起動handoffを
経由して現行schemaへ安全に更新する契約をfreezeする。

本PRはpair-freeze専用であり、source、test、hook、CLI、receiptを生成しない。`confirmed`への遷移は
契約とtest-designの非著者reviewを固定するだけで、実装、Reverse R4、Issue #433完了、#410/#423/#431の
mergeを意味しない。実装は後続のbounded PRが所有し、そこで`generates`を実装成果物へ更新する。

## 2. wire schema、capability profile、upgrade authority

### 2.1 generation marker wire schema

generation markerのwire schemaは、既存実装の`ut-tdd.claude-wake-generation/v1`をそのまま正本とする。
v1のclosed field setは`schema`、`generation`、`workspaceId`、`inboxSchema`の4項目であり、
`inboxSchema`は`ut-tdd.claude-inbox/v3`へ固定する。必須fieldの欠落、不正型、未知additional fieldを
fail-closeする。v1へfieldを追加して「後方互換」とは扱わない。将来fieldを増やす場合はgeneration wire
schema bumpを別PLANでpair-freezeする。

```json
{
  "schema": "ut-tdd.claude-wake-generation/v1",
  "generation": "<opaque generation id>",
  "workspaceId": "<canonical workspace id>",
  "inboxSchema": "ut-tdd.claude-inbox/v3"
}
```

旧`pid:timestamp` text、fake JSON、必須field欠落、未知field、別wire schemaをv1として黙って受理しない。
`workspaceId`は#416/#422のcanonical resolverが算出する値を使い、path、表示名、worktree相対位置を代替にしない。

### 2.2 capability profile

runtime互換性はgeneration markerへfieldを足さず、marker digestへ束縛した別のclosed record
`ut-tdd.claude-wake-capability/v1`で公開する。このrecordは次だけを持つ。

```json
{
  "schema": "ut-tdd.claude-wake-capability/v1",
  "generation": "<same generation id>",
  "workspaceId": "<same canonical workspace id>",
  "markerDigest": "sha256:<generation marker bytes>",
  "runtimeSourceRevision": "<provenance only; exact equality is not required>",
  "capabilityRevision": 1,
  "policyDigest": "sha256:<canonical capability policy>",
  "authorityEpoch": 1
}
```

capability profileも未知additional fieldを拒否する。将来のadditive extensionは既存profileへfieldを足さず、
profile schemaまたはcapability revisionの更新を別pair-freezeで定義する。これにより、未知field拒否と将来拡張を
同時に主張しない。

supervisorはrepository-owned policyから`resolveRequiredClaudeWakeCapability()`を一度だけ呼び、
`requiredWireSchema`、`requiredInboxSchema`、`requiredProfileSchema`、`requiredPolicyDigest`、
`minimumCompatibleRevision`を得る。published profileの許容関係は次の全ANDである。

1. marker wire schema、inbox schema、profile schemaがrequired値とexact一致する。
2. generation、workspace ID、marker digestがmarker/profile間でexact一致する。
3. `capabilityRevision >= minimumCompatibleRevision`である。
4. `policyDigest == requiredPolicyDigest`である。
5. `runtimeSourceRevision`はcanonical compatibility resolverが同じpolicy digestとcapability revisionへ
   登録済みと判定する。subject worktreeとlive workspaceのGit commit完全一致は要求しない。

`runtimeSourceRevision`はprovenanceとcompatibility index lookupにだけ使う。supervisor自身のHEAD、subject PR HEAD、
live workspace HEADとのexact equalityを要求して、互換policyを持つ別commitを拒否してはならない。逆に、単に
新しいcommit、祖先/子孫commit、同一treeであることだけでは互換と判定せず、canonical policy digestとminimum
compatible revisionのANDを必須とする。

### upgrade authority の所在

すでに起動済みの旧hook processには、将来のsource revisionやschema driftを検出して自力更新する権限は
ない。旧hookは従来どおり`pid:timestamp`のgeneration markerを書き続けるだけであり、markerをv1 JSONへ
自己変換したり、新しいruntime revisionを推測したりしてはならない。更新済みdispatcher/VS Code bootstrap
の**upgrade supervisor**が、activation/dispatch/restart時にpublished marker/profileとcanonical required
capability policyを比較する唯一のupgrade authorityである。claim時のauthority確認は、後述のepoch/lease token
CASだけが行い、検証済みsnapshotをclaim commitまで持ち越さない。

supervisorは不一致を検知すると、authority recordをCASしてepochを増加し、旧lease tokenを失効させてから、
old marker digest、process/session、workspace、required/current capability、reasonを束縛した
`restart_required` handoffをatomicに残す。その後、旧processを`superseded`として終了または再起動待ちへ移し、
更新済みbootstrapだけが同じworkspaceで現行v1 JSON markerとcapability profileを登録できる。旧hookが後から
書く`pid:timestamp`はauthorityを回復せず、旧epoch/tokenによる遅着claimも0とする。

## 3. rolling upgrade と fail-close 不変条件

1. upgrade supervisorがhook起動・dispatch・restartの境界で、marker、capability profile、required policy、
   canonical workspace IDを同一snapshotで検証する。検証完了前のwake、dispatch、claim、consumeは0とする。
2. supervisorが旧processのmarkerをcurrent capabilityと比較し、不一致、欠落、legacy、破損、foreign workspace
   を検出した場合、旧hookのauthorityを失効させ、理由、old marker identity、required capability、対象workspace
   を束縛した`restart_required` handoffをatomicに残す。handoff自体はrequest、envelope、receiptを作成・変更しない。
3. 更新済みbootstrapだけがcanonical workspaceに対する現行v1 marker、capability profile、authority recordを
   atomicに登録し、旧generationを明示的に`superseded`へ遷移させる。同一workspaceのactive generationは常に
   exactly oneとし、旧markerを消して証跡を失わせない。
4. supersessionは同一workspace、許可された旧generation、compatible capability、単調増加するauthority epochの
   全条件を満たすCASとしてupgrade supervisorが行う。条件が揃わない複数markerをhookが勝手に選ばず、
   `multiple_active_generations`または`generation_supersession_conflict`でfail-closeする。
5. stale marker、fake JSON、foreign workspace、schema不一致、replayされたhandoff、複数active markerは
   wake/claimを0とし、既存entryを消費済みにしない。既存request/envelopeのidentity、digest、HEAD、revisionを
   再発行・書換えしてはならない。
6. claim transactionは、envelope未claim、marker/profile digest、workspace/generation、current authority epoch、
   lease token digest、有効期限、provider/sessionを一つのCASへ束縛する。revocationはhandoffより先にepochを増加し
   tokenをrotateするため、検証後・claim commit前に失効した旧hookのCASは必ず負け、envelopeとclaimを変更しない。
7. crash、kill、restart途中のpartial writeでは、次回起動がactivation journalと現物markerのdigestを照合し、
   一意なactive generationを再構成できない限り`restart_required`またはtyped denyで停止する。中間状態を
   成功扱いせず、旧generationのclaim権限を復活させない。
8. #416/#422の`resolveLiveClaudeWorkspace`、Git common-dir inbox、target workspace identity、既存の
   `live-dispatch`/`live-consume`を再利用する。upgrade supervisorはdispatcher/bootstrapの権限境界として
   配置し、routingの別実装、global memory、通知本文によるtrustは追加しない。

## 4. 既存requestを保全するE2E契約

### 4.1 固定する実在identity

| PR | project | Memory ID | operation | provider/session | exact HEAD | review revision | 保存artifact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #423 | `unison-ai-product/UT-TDD_AGENT-HARNESS` | `memory:project:pr-423-canonical-delta-request-exact-f829e941--61f2bbb92c29` | existing envelope `pr423-live-dispatch-f829e941` / observed claim `pr423-current-main-redispatch-after434-v3` | producer `codex` / consumer `claude` / captured authorized session `a78e55c2-5ee4-4f4c-97dc-6f5ddafe4809` | `f829e9414d0f14aa67d3e62364865d3c291ca995` | `rv1-89b41293dbf4c9843dc9d769e03aecf6efd5b4898832ce58bd099065042d5ade` | request `.ut-tdd/review/requests/89b41293dbf4c9843dc9d769e03aecf6efd5b4898832ce58bd099065042d5ade.json` (`sha256:7003aaf749833abfff8de71768e47939fea4284c98fb498767e772c371f49b18`)、inbox capture `memory_project_pr-423-canonical-delta-request-exact-f829e941--61f2bbb92c29_workspace_7afb1c8e925d4c39da2d7420fc8365237d9be85f7fa034870e951cec704367_241955f71d0d.json` (`sha256:85d394797a61f40be3a4cd88be9b9613c743d0036add56742ac07830879538ef`)、observed claim `memory_project_pr-423-canonical-delta-request-exact-f829e941--61f2bbb92c29_workspace_a499d29b294a9f210e69612cb85e1094c692b29c0c56ddaed4ac250fd3d924_9aa9077f933e.claim` (`sha256:9a8e832a5c14b41651e62c9789512eaed4f98dd38e147a3f8b2ed3254605a392`) |
| #410 | `unison-ai-product/UT-TDD_AGENT-HARNESS` | `memory:project:pr-410-exact-head-closing-review-request-at-8143ce40--a48ed94cd3fe` | `pr410-existing-8143ce40` | producer `codex` / consumer `claude` / observed session `a78e55c2-5ee4-4f4c-97dc-6f5ddafe4809` | `8143ce40f6df3f56ebcee9d745d6f38422e1912f` | `rv1-6945ce76a9e1c90246e2a61a1a50058ffb46664b494480e08b8c2c4f8036755b` | request `.ut-tdd/review/requests/6945ce76a9e1c90246e2a61a1a50058ffb46664b494480e08b8c2c4f8036755b.json` (`sha256:75defbd585e1328cf25c4638ce6fb7d49c7e819a0d951e6a9b00dfebba41d47f`)、observed claim `memory_project_pr-410-exact-head-closing-review-request-at-8143ce40--a48ed94cd3fe_workspace_a499d29b294a9f210e69612cb85e1094c692b29c0c56ddaed4ac250_0f839a03fd05.claim` (`sha256:d9e936a6b1b0486ac40b084ab2b8bda175ff55e6324acaf50f62ba28da264210`) |

### 4.2 operational E2E とcross-platform fixtureの分離

operational E2Eは上表のgitignored request、Git common-dir inbox/claim、実Claude VS Code restartをその場で使う。
絶対path、timestamp、新しいsession IDはhost-local evidenceとして記録するが、tracked fixtureへ混ぜない。#423は
保存済みenvelopeを再発行せずconsumeし、#410は保存済みrequestを同じreview revisionのままredispatchする。

cross-platform testは、後続実装PRが上表のSHA-256で検証したpayloadを
`tests/fixtures/claude-hook-schema-rolling-upgrade/{pr-423-envelope,pr-423-request,pr-410-request,pr-410-claim}.json`
へimmutable captureとして置く。absolute pathとtimestampはfixture metadataへ正規化するが、project、Memory ID、
operation、provider、session、exact HEAD、review revision、request digestは変更しない。fixture Greenはlive restart
成功の代替証拠にせず、operational E2Eと両方を必須とする。

各fixtureではproject、Memory ID、operation、producer/consumer provider、session、exact HEAD、review revisionを
一軸ずつ独立変異し、他軸とdigestを整合させたままでもclaim/consume/redispatchがtyped deny、write 0になることを
検証する。複数軸を同時に壊して最初のguardだけで落ちる偽oracleを禁止する。

restart前に各identityとartifact digestを記録してからupgrade supervisorによる旧markerのdrift検出を実走し、
次の順序を証明する。

```text
旧marker / 旧process
  → restart_required handoff（claim 0）
upgrade supervisor / updated bootstrap
  → 旧hook authority revoke・superseded・終了/再起動要求
現行v1 JSON hook activation
  → active generation exactly 1
既存 #423 envelope
  → 同一identityで live-consume
既存 #410 request
  → 同一identityで live-redispatch
```

restart後の成功だけでなく、handoff replay、旧processの遅着claim、foreign workspaceのmarker混入、
同一requestの再送、activation crash後の再起動を負例にする。成功条件はcanonical receiptの手生成やmerge
bypassではなく、既存request identityを維持した通常のlive経路で観測する。

## 5. 実装スライス（後続PRへ移管）

1. [直列] closed v1 wire parser、capability profile、required policy resolver、legacy判定。
2. [直列] typed `restart_required` handoff、authority epoch/lease token/CAS、handoff replay fence。
3. [直列] activation CAS、旧generation supersession、exact-one active projection。
4. [並列] immutable cross-platform fixtureとgitignored operational #423/#410 E2E。
5. [直列] Linux/Windows/aggregate CI、Reverse R1–R4、非著者closing receipt。

## 6. 非対象

- reviewer verdictの内容、verdict schema、手動receipt生成、proseからのreceipt投影。
- merge wrapperのbypass、直接merge、既存review request identityの再mint。
- Pack publication、consumer runtime、stable/canary promotion。
- #416/#422が所有するlive routing、workspace resolver、通知信頼根の別実装。

## 7. 完了条件

- closed v1 marker、capability profile、policy digest、minimum compatible revision、workspace ID bindingをRed→Greenで実測する。
- 旧hookの`pid:timestamp`継続書込み、legacy text/旧v1/fake/foreign/stale/multiple markerとcrash/restart/replayを
  supervisor経由でtyped fail-closeする。旧hook自身の自動upgradeは成功扱いにしない。
- revocation直前/直後のclaim競合で旧epoch/tokenの遅着claimが0、envelope保持になることを実測する。
- restart_required handoff後も上表の#423 envelopeと#410 requestを同じidentityでconsume/redispatchできる。
- Windows/Linux/aggregate CI、PLAN lint、targeted test、非著者Claude Opus 5 closing receiptを同一revisionへ束縛する。
- PLAN-REVERSE-514をR1→R4へ進め、#416/#422の既存契約へbackpropする。
