---
plan_id: PLAN-L6-103-claude-wake-liveness-deferred-routing
title: "PLAN-L6-103 (add-design): Claude wake liveness と deferred routing の pair-freeze"
kind: add-design
layer: L6
sub_doc: function-spec
drive: be
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-31
updated: 2026-08-31
owner: Codex / TL
github_issue_id: 454
parent_design: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: "既存のasync wake設計を実装前のliveness判定とdeferred routingへ明確化する差分であり、L0-L3要件を変更しない。"
agent_slots:
  - role: tl
    slot_label: "TL - live/deferred routing と既存 request 正本の境界を凍結する"
  - role: se
    slot_label: "SE - generation identity 検証後 heartbeat と exclusive-create の順序を定義する"
  - role: qa
    slot_label: "QA - stale/ambiguous/corrupt/fake-clock/retry の falsifiable oracle を固定する"
generates:
  - artifact_path: docs/plans/PLAN-L6-103-claude-wake-liveness-deferred-routing.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  requires:
    - docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-472-claude-memory-async-wake-backfill.md
    - docs/design/harness/L6-function-design/memory.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/444
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/454
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/424
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/493
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/494
review_evidence: []
---

# PLAN-L6-103: Claude wake liveness と deferred routing の pair-freeze

> **訂正記録 (2026-08-31)**: 本 PLAN の初版と親 `PLAN-L7-472` の Issue #454 delta にあった
> 「routing deny では canonical request も write 0」という表現は、既存の request backlog 保全契約および
> `U-MEMWAKE-007` の実測と矛盾していた。本 PLAN は親 PLAN 全体を supersede せず、Issue #454 delta の
> request副作用、現行4値APIとの境界、deferred queue schema/lifecycleだけをこの訂正本文で固定する。
> 親側の訂正参照は `PLAN-L7-472` の同日付 Correction note とする。

## 0. 目的と既存 PLAN との関係

Issue #454 は、`waitForClaudeMemory` の generation marker が待機開始時に一度だけ更新されるため、
稼働中の Claude VS Code session が 15 分後に stale と判定される欠落を扱う。既存の
`PLAN-L7-472` / `PLAN-REVERSE-472` は inbox、atomic claim、workspace identity、canonical request
保全を既に定義している。本 PLAN はその契約を置き換えず、liveness 判定と失敗時 routing の型・順序だけを
pair-freeze する bounded な設計追補である。

本 PR は **docs-only の pair-freeze** であり、source、test code、hook、CLI、request/queue の実体、
receipt、migration は生成しない。`PLAN-L7-472` の実装完了、#444 の terminal GC、#454 の Issue 完了を
意味しない。

## 1. 凍結契約

### 1.1 typed routing と現行 API との差分

配送判定の新しい composition が返す結果は次の二値だけとする。文字列、path、表示名、現在の
worktree から宛先を推測しない。

```ts
type ClaudeWakeRoute =
  | { kind: "live"; workspaceId: string }
  | {
      kind: "deferred";
      workspaceId: string;
      reason: "stale_workspace";
      requestDigest: string;
    };
```

`live` は、generation marker が schema-compatible で、論理 workspace 候補が一つ、かつその workspace
group に fresh marker が少なくとも一つある場合だけである。`deferred` は、論理 workspace 候補が一つで、
その group の有効 marker が全て stale の場合だけであり、同じ marker から得た同じ `workspaceId` を保持する。
stale を別 workspace へ再解決したり、broadcast へ拡張したりしない。

ここで **current `resolveLiveClaudeWorkspace` の4値契約を変更しない**。現行 API は
`no_live_claude_workspace` / `ambiguous_live_claude_workspace` /
`stale_claude_workspace` / `incompatible_claude_workspace_schema` を返し、stale は従来どおり deny
（`U-MEMWAKE-007`）である。本 PLAN の意図的な差分は、後続実装の新しい route composition が、現行 API の
`stale_claude_workspace`（valid marker が一つの workspace group に属し全て stale）を
`deferred` へ写像することだけである。既存 API の stale oracle を書き換えたり、同じ `U-*` を再定義したりしない。

候補が 0 件、2 workspace group 以上、schema 非互換、破損、identity 検証不能の場合は route を返さず
current typed deny とする。deny は downstream の live publish / inbox publish / deferred queue write を
0 にするが、canonical request の扱いは §1.2 の request-before-route 契約に従う。`workspaceId` の空値、
wildcard、global broadcast、PID、PR comment、現在の worktree 推測は入力にも出力にも使わない。

### 1.2 canonical request → routing の順序と deny の副作用

live/deferred のいずれも、最初に canonical request を正本として永続化する。request persistence が成功した
後だけ route を評価し、次の順序を不変条件とする。

```text
canonical request (exclusive-create / same-content retry)
  → generation marker の identity/schema/freshness 検証
  → live publish または same-ID deferred queue
```

canonical request は **routing deny の場合も backlog として保持する**。新規 request なら一度だけ
exclusive-create し、同一内容の retry なら既存 request をそのまま再利用する（この場合も request record は
存在し続ける）。identity/schema/freshness の deny で 0 にするのは live wake、inbox publish、deferred queue
などの **downstream write** であり、canonical request の write を 0 とする意味ではない。したがって deny の
observable effect は次の通りである。

| 状態 | canonical request | live wake / inbox | deferred queue |
| --- | --- | --- | --- |
| routing deny（no target / ambiguous / incompatible / corrupt） | 新規なら1件を保持、retryなら同一既存1件を保持 | 0 | 0 |
| request persistence failure | 保持できない | 0 | 0 |
| live | 1件を保持 | 1件 | 0 |
| deferred | 1件を保持 | 0 | 1件 |

request persistence failure は route deny ではなく、route 評価を開始しない typed failure とする。既存 request の
再 mint、request digest/path/HEAD/revision の変更、通知本文の trust 昇格は認めない。`requestPath` は
`.ut-tdd/review/requests/<requestDigest>.json` の正本を指し、deny 時も削除しない。

stale の一 workspace group だけは `deferred` として同じ `workspaceId` を持つ queue item を一度だけ作る。queue の
idempotency key は canonical request identity と target `workspaceId` から決定し、同一 operation/content の retry は
同じ一件へ収束する。異なる content の同一 operation は conflict として deny し、既存 bytes を変更しない。

### 1.2.1 deferred queue の namespace、schema、lifecycle

これは未実装 queue の方式を実装 PR が発明しないための契約である。既存 `inbox/*.json` や generation marker と
同じ namespace に置かず、`runtimeRoot` を `<git-common-dir>/ut-tdd-runtime/claude-memory-wake` としたとき、
次の path を唯一の正本とする。

```text
runtimeRoot/deferred/<idempotencyKey>.json
runtimeRoot/deferred/promoted/<idempotencyKey>.json
```

`readInbox` は `runtimeRoot/inbox/*.json` だけを読む。deferred entry を inbox entry として暗黙解釈したり、
root の既存 GC に混ぜたりしない。deferred entry は次の exact JSON object とする（追加 key、path traversal、
絶対 path は不可）。JSON の canonical bytes は RFC 8785/JCS とし、`idempotencyKey` は
`sha256(JCS([requestDigest, targetWorkspaceId]))` の lower-case hex 64 桁とする。

| key | 型 / 凍結値 |
| --- | --- |
| `schemaVersion` | literal `ut-tdd.claude-deferred/v1` |
| `purpose` | literal `review`（この deferred queue は canonical review request 専用。通常 memory inbox は対象外） |
| `idempotencyKey` | 上記の `sha256:` なし lower-case hex 64 桁 |
| `requestDigest` | lower-case hex 16〜64 桁 |
| `requestPath` | `.ut-tdd/review/requests/<requestDigest>.json`（相対 canonical path） |
| `operationId` | 空でない文字列 |
| `targetWorkspaceId` | lower-case hex 64 桁 |
| `targetGeneration` | 検証済み marker の generation、空でない文字列 |
| `createdAt` | RFC 3339 timestamp |
| `eligibleAfter` | RFC 3339 timestamp（初回は `createdAt` 以上） |

promotion marker は queue と別の exact JSON object とし、path は上記 `promoted/` 配下に固定する。

| key | 型 / 固定値 |
| --- | --- |
| `schemaVersion` | literal `ut-tdd.claude-deferred-promotion/v1` |
| `idempotencyKey` | queue item と同一の lower-case hex 64 桁 |
| `requestDigest` | queue item と同一の lower-case hex 16〜64 桁 |
| `targetWorkspaceId` | queue item と同一の lower-case hex 64 桁 |
| `inboxEntryId` | queue item から導出された非空文字列 |
| `promotedAt` | RFC 3339 timestamp |

queue item の identity は `(requestDigest, targetWorkspaceId)` であり、`operationId` や marker の mtime を key に
しない。producer は canonical request の存在を検証した後、stale exact-one group に限り `deferred/<key>.json` を
exclusive-create する。同一 canonical bytes は成功扱い、同一 key の異なる bytes は
`claude_deferred_projection_conflict` として既存 bytes を変更しない。

consumer は、対象 `workspaceId` の generation identity を検証して fresh になった Claude VS Code session の
SessionStart/Stop wake boundary だけで deferred directory を読む。`targetWorkspaceId` が自身と一致し、request
path/digest、schema、key、queueの保存時に記録した `targetGeneration` が検証できる item だけを対象にする。
`targetGeneration` は stale 判定時の証拠であり、再起動後の新しい generation と一致することは要求しない。
現 session の fresh marker が同じ workspace IDであることを別途検証し、まず `inbox/<entry-stem>.json` を
同一 canonical entry として exclusive-create し、次に `deferred/promoted/<key>.json` を exclusive-create する。
既存 inbox または promoted marker が同一 bytes なら retry は成功扱いとし、異なる bytes は conflict にする。
queue item は監査用に保持し、promotion 後に削除・上書きしない。promotion marker が無い場合も inbox の同一
identity を再検証して idempotently marker を補完できる。identity 不一致、破損、replay、duplicate、期限外 item は
inbox を作らず fail-close とし、broadcast や別 workspace への再配送をしない。

deferred item と promotion marker の retention は既存 runtime の7日 retentionに揃える。GC は
`deferred/` と `deferred/promoted/` を明示的に走査し、`createdAt`/`promotedAt`（marker の場合）から7日を超えた
ものだけを削除する。未昇格 item、破損 item、promoted item を `inbox` GC の glob で削除してはならない。GC と
promotion が競合した場合は、atomic rename/claim または同等の single-flight で一方を勝者にし、勝者不明なら
削除せず次回へ回す。

### 1.2.2 marker の計数と混在状態

exact-one の計数単位を混同しない。raw `.generation` **marker record 数**は診断値として保持するが、route の
候補数は、各 schema-compatible marker の canonical `workspaceId` で group 化した **logical workspace 数**とする。
group 内の freshness は次で集約する。

| marker 状態 | group の集約 |
| --- | --- |
| 有効 marker が1件以上 fresh | `fresh`（fresh wins） |
| 有効 marker が0件 fresh、1件以上 stale | `stale` |
| schema非互換 / corrupt / identity検証不能が1件でもある | 全体 `incompatible` deny |

このため、duplicate marker が同一 workspace のみなら raw count が2以上でも logical count は1であり、全て stale
なら `deferred`、一つでも fresh なら `live` となる。fresh + stale が同一 workspace なら `live`、fresh + stale が
別 workspace なら logical workspace が2つなので `ambiguous`、stale + incompatible または fresh + incompatible
は current typed `incompatible_claude_workspace_schema` deny とする。複数 stale が別 workspace なら `ambiguous`。
この表を route、test oracle、診断表示の共通正本とする。

deny reason の正規化は次の通りであり、新しい理由名をこの pair-freeze で創作しない。

| 観測 | current `resolveLiveClaudeWorkspace` reason | 新 route composition |
| --- | --- | --- |
| 有効 marker なし | `no_live_claude_workspace` | typed deny（request backlog保持、downstream write 0） |
| logical workspace group が2以上 | `ambiguous_live_claude_workspace` | typed deny（request backlog保持、downstream write 0） |
| logical group が1つで有効 markerが全て stale | `stale_claude_workspace` | `deferred`（request保持後 queue 一件） |
| schema非互換、破損、identity検証不能が1件以上 | `incompatible_claude_workspace_schema` | typed deny（request backlog保持、downstream write 0） |

### 1.3 heartbeat の identity 境界

`waitForClaudeMemory` は polling loop の heartbeat で marker を更新してよい。ただし marker の closed schema、
generation、canonical `workspaceId`、自身の session identity を検証して成功した後だけ renew する。検証前、検証失敗、
別 generation、別 workspace、未知 schema、破損 marker は touch しない。heartbeat の時計は注入可能な monotonic/fake
clock とし、wall-clock の mtime を信頼根にしない。検証済み identity の heartbeat が 15 分を越えても fresh 判定を
維持することを oracle で反証可能にする。

## 2. scope boundary

含むものは、既存 `resolveLiveClaudeWorkspace` の4値結果から新 route composition へ写像する typed live/deferred
差分、`waitForClaudeMemory` の generation identity 検証後の marker renew、canonical persistence 後の publish 禁止、
exclusive-create retry 収束、deferred queue の上記 schema/lifecycle、及び L6 memory ↔ L7 unit-test-design の trace である。

明示的に含めないものは、wildcard/global broadcast、PID inference、PR-comment fallback、current-worktree inference、
#424 project-scoped root migration、#493 review-custody reason 分解、#494 手書き memory/frontmatter 修復、#444
terminal GC、deferred queue の実装コード、CLI/hook/source/test code、既存 request の一括 replay である。queue の
schema と lifecycle は本 pair-freeze に含めるが、実装は後続 PR で行い、これらを理由に本契約の deny を緩和しない。

## 3. pair と candidate oracle

L6 正本は `docs/design/harness/L6-function-design/memory.md`、L7 の検証設計は
`docs/test-design/harness/L7-unit-test-design.md` の Issue #454 delta 節である。未実装の候補は
`CANDIDATE-*` とし、実装 PR で test citation とともに昇格する。

| candidate | 入力変異 | 期待結果（反証可能な観測） |
| --- | --- | --- |
| `CANDIDATE-MEMWAKE-LIVENESS-001` | fake clock で 15 分超を進め、generation identity 検証済み heartbeat を反復 | marker が renew され、候補は `live`。検証済み heartbeat を止めた対照系は stale になる |
| `CANDIDATE-MEMWAKE-LIVENESS-002` | schema-compatible marker を一つだけ stale にする | canonical request を一件保持した後、同じ `workspaceId` の schema固定 queue が一件だけ作られる |
| `CANDIDATE-MEMWAKE-LIVENESS-003` | stale marker を二つ配置する（別 workspace） | ambiguous typed deny、canonical request は一件保持、live/inbox/deferred の downstream write は0 |
| `CANDIDATE-MEMWAKE-LIVENESS-004` | marker JSON を破損または schema 非互換にする | typed deny、canonical request は一件保持、live/inbox/deferred の downstream write は0。推測宛先や wildcard は出ない |
| `CANDIDATE-MEMWAKE-LIVENESS-005` | 同一 operation/content を直列・並列 retry する | request は一件へ収束し、同一 key の queue/live publish は各一件。異内容は conflict・既存 bytes 不変 |
| `CANDIDATE-MEMWAKE-LIVENESS-006` | canonical request writer を失敗させてから publish を試みる | request 未永続化時の publish/queue は 0（request persists before publish） |
| `CANDIDATE-MEMWAKE-LIVENESS-007` | 同一 workspace に fresh/stale marker、または別 workspace に fresh/stale markerを混在 | 同一 workspace は fresh wins=`live`、別 workspace は `ambiguous`。incompatible 混在は typed incompatible deny |
| `CANDIDATE-MEMWAKE-LIVENESS-008` | deferred queue の key/path/schema/target を一軸ずつ変異し、fresh session で promotion/retry | exact schema/identity の一件だけ inboxへ昇格し、duplicate/replay/conflict/期限切れは inbox write 0 |

## 4. Schedule と出口

1. [直列] 本 PLAN と既存 PLAN-L7-472 の Issue #454 delta を pair-freeze する（既存 U-MEMWAKE-007 は変更しない）。
2. [並列] L6 memory の typed routing/heartbeat/request backlog/queue/混在記述と L7 candidate oracle を同期する。
3. [直列] 非著者 review、plan lint、doc lane、diff check を exact HEAD で取得する。
4. [後続] 実装 PR が candidate を `U-*` へ昇格し、Linux/Windows/aggregate の実測と Reverse 要否を確定する。

本 PLAN の confirmed 化は設計と L7 candidate の整合だけを意味し、実装、Issue close、merge authority、#424/#493/#494
の解決を意味しない。
