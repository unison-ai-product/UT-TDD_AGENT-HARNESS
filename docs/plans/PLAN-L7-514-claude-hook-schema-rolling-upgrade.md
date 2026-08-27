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

## 2. 正規 generation marker と upgrade authority

今回の正本は、既存実装の`ut-tdd.claude-wake-generation/v1` JSONと
`ut-tdd.claude-inbox/v3`である。未出荷の`generation/v2`や`generation/v3`をこのPLANで発明しない。
既存v1を維持したまま、現行v1 markerへruntime source revisionとgeneration capabilityを追加する
後方互換の拡張を実装対象とする。v1の意味を破壊する変更やschema bumpが必要になった場合は、別PLANで
pair-freezeしてから扱い、本PLANの実装へ再帰的に混ぜない。

```json
{
  "schema": "ut-tdd.claude-wake-generation/v1",
  "generation": "<opaque generation id>",
  "runtimeSourceRevision": "<full source revision>",
  "generationSchema": "ut-tdd.claude-wake-generation/v1",
  "inboxSchema": "ut-tdd.claude-inbox/v3",
  "workspaceId": "<canonical workspace id>",
  "sessionId": "<Claude VS Code session id>",
  "issuedAt": "<RFC3339 timestamp>"
}
```

`runtimeSourceRevision`は起動したUT-TDD runtimeのfull revisionへ束縛し、`workspaceId`は#416/#422の
canonical resolverが算出する値をそのまま使う。path、表示名、worktree相対位置をworkspace identityの
代替にしない。markerの必須フィールド、schema値、型、canonical identityが一つでも欠ける・変わる・
解析不能な場合はactiveとみなさない。既存のv1 readerが未知の追加フィールドを読み飛ばせても、現行
upgrade authorityはrequired capabilityの欠落を互換と判定しない。

旧text形式、runtime source revisionを持たない旧v1 JSON、fake JSON、未知のgeneration schemaは、現行v1と
`inbox/v3`の組合せとして黙って受理しない。これらは`legacy_generation_marker`、
`generation_capability_missing`、または`generation_schema_mismatch`を含むtyped `restart_required`
handoffへ変換し、新規claimを0にする。inbox v3はmarkerのgeneration schemaとは別の必須軸であり、どちらか
一方の一致だけで互換と判定してはならない。

### upgrade authority の所在

すでに起動済みの旧hook processには、将来のsource revisionやschema driftを検出して自力更新する権限は
ない。旧hookは従来どおり`pid:timestamp`のgeneration markerを書き続けるだけであり、markerをv1 JSONへ
自己変換したり、新しいruntime revisionを推測したりしてはならない。更新済みdispatcher/VS Code bootstrap
の**upgrade supervisor**が、各dispatch/restart/claim前に公開されたmarker capabilityと現在要求される
runtime source revision・generation schema・inbox schema・workspace IDを比較する唯一のauthorityである。

supervisorは不一致を検知すると、旧hookのclaim/dispatch authorityを即時失効させ、old marker digest、
process/session、workspace、required/current capability、reasonを束縛した`restart_required` handoffを
atomicに残す。その後、旧processを`superseded`として終了または再起動待ちへ移し、更新済みbootstrapだけが
同じworkspaceで現行v1 JSON markerを登録できる。旧hookが後から書く`pid:timestamp`はauthorityを回復せず、
旧processの遅着claimも0とする。

## 3. rolling upgrade と fail-close 不変条件

1. upgrade supervisorがhook起動・dispatch・restart・claimの境界で、marker、現在のruntime source revision、
   generation schema、inbox schema、canonical workspace IDを同一snapshotで検証する。検証完了前のwake、
   dispatch、claim、consumeは0とする。
2. supervisorが旧processのmarkerをcurrent capabilityと比較し、不一致、欠落、legacy、破損、foreign workspace
   を検出した場合、旧hookのauthorityを失効させ、理由、old marker identity、required capability、対象workspace
   を束縛した`restart_required` handoffをatomicに残す。handoff自体はrequest、envelope、receiptを作成・変更しない。
3. 更新済みbootstrapだけがcanonical workspaceに対する現行v1 markerをatomicに登録し、旧generationを明示的に
   `superseded`へ遷移させる。同一workspaceのactive generationは常にexactly oneとし、旧markerを消して証跡を失わせない。
4. supersessionは同一workspace、許可された旧generation、現行source revision、単調なactivation sequenceの
   全条件を満たすCASとしてupgrade supervisorが行う。条件が揃わない複数markerをhookが勝手に選ばず、
   `multiple_active_generations`または`generation_supersession_conflict`でfail-closeする。
5. stale marker、fake JSON、foreign workspace、schema不一致、replayされたhandoff、複数active markerは
   wake/claimを0とし、既存entryを消費済みにしない。既存request/envelopeのidentity、digest、HEAD、revisionを
   再発行・書換えしてはならない。
6. crash、kill、restart途中のpartial writeでは、次回起動がactivation journalと現物markerのdigestを照合し、
   一意なactive generationを再構成できない限り`restart_required`またはtyped denyで停止する。中間状態を
   成功扱いせず、旧generationのclaim権限を復活させない。
7. #416/#422の`resolveLiveClaudeWorkspace`、Git common-dir inbox、target workspace identity、既存の
   `live-dispatch`/`live-consume`を再利用する。upgrade supervisorはdispatcher/bootstrapの権限境界として
   配置し、routingの別実装、global memory、通知本文によるtrustは追加しない。

## 4. 既存requestを保全するE2E契約

restart前に保存された#423の既存envelopeと#410の既存requestをfixtureへ再生成しない。各identity、operation、
HEAD、PLAN revision、request digestを記録してからupgrade supervisorによる旧markerのdrift検出を実走し、次の
順序を証明する。

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

1. [直列] 現行v1 marker parser、source/schema/workspace binding、legacy判定。
2. [直列] typed `restart_required` handoff、claim gate、handoff replay fence。
3. [直列] activation CAS、旧generation supersession、exact-one active projection。
4. [並列] crash/restart/replayのcross-platform oracleと、#423/#410既存identity E2E。
5. [直列] Linux/Windows/aggregate CI、Reverse R1–R4、非著者closing receipt。

## 6. 非対象

- reviewer verdictの内容、verdict schema、手動receipt生成、proseからのreceipt投影。
- merge wrapperのbypass、直接merge、既存review request identityの再mint。
- Pack publication、consumer runtime、stable/canary promotion。
- #416/#422が所有するlive routing、workspace resolver、通知信頼根の別実装。

## 7. 完了条件

- 現行v1 markerのsource revision・generation schema・inbox schema・workspace ID bindingをRed→Greenで実測する。
- 旧hookの`pid:timestamp`継続書込み、legacy text/旧v1/fake/foreign/stale/multiple markerとcrash/restart/replayを
  supervisor経由でtyped fail-closeする。旧hook自身の自動upgradeは成功扱いにしない。
- restart_required handoff後も#423 envelopeと#410 requestを同じidentityでconsume/redispatchできる。
- Windows/Linux/aggregate CI、PLAN lint、targeted test、非著者Claude Opus 5 closing receiptを同一revisionへ束縛する。
- PLAN-REVERSE-514をR1→R4へ進め、#416/#422の既存契約へbackpropする。
