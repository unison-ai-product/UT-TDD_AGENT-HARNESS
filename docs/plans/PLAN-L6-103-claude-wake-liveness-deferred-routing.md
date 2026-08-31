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

## 0. 目的と既存 PLAN との関係

Issue #454 は、`waitForClaudeMemory` の generation marker が待機開始時に一度だけ更新されるため、
稼働中の Claude VS Code session が 15 分後に stale と判定される欠落を扱う。既存の
`PLAN-L7-472` / `PLAN-REVERSE-472` は inbox、atomic claim、workspace identity、canonical request
保全を既に定義している。本 PLAN はその契約を置き換えず、liveness 判定と失敗時 routing の型・順序だけを
pair-freeze する bounded な設計追補である。

本 PR は **docs-only の pair-freeze** であり、source、test code、hook、CLI、request/queue の実体、
receipt、migration は生成しない。`PLAN-L7-472` の実装完了、#444 の terminal GC、#454 の Issue 完了を
意味しない。

## 1. frozen contract

### 1.1 typed routing

配送判定は次の二値だけを返す。文字列、path、表示名、現在の worktree から宛先を推測しない。

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

`live` は、generation marker が schema-compatible で、候補が **ちょうど一つ**、かつ fresh の場合だけである。
`deferred` は、schema-compatible な候補がちょうど一つだが stale の場合だけであり、同じ marker から得た
同じ `workspaceId` を保持する。stale を別 workspace へ再解決したり、broadcast へ拡張したりしない。

候補が 0 件、2 件以上、schema 非互換、破損、identity 検証不能の場合は route を返さず typed deny とし、
canonical request、live publish、deferred queue の write はすべて 0 とする。`workspaceId` の空値、
wildcard、global broadcast、PID、PR comment、現在の worktree 推測は入力にも出力にも使わない。

### 1.2 canonical request → routing の順序

live/deferred のいずれも、最初に canonical request を正本として永続化する。request persistence が成功した
後だけ route を評価し、次の順序を不変条件とする。

```text
canonical request (exclusive-create / same-content retry)
  → exactly-one generation candidate の identity/schema/freshness 検証
  → live publish または same-ID deferred queue
```

canonical request の失敗・identity mismatch・schema failure は route と下流 write を 0 にする。既存 request の
再 mint、request digest/path/HEAD/revision の変更、通知本文の trust 昇格は認めない。

stale の一候補だけは `deferred` として同じ `workspaceId` を持つ queue item を一度だけ作る。queue の idempotency
key は canonical request identity と target `workspaceId` から決定し、同一 operation/content の retry は同じ一件へ
収束する。異なる content の同一 operation は conflict として deny し、既存 bytes を変更しない。

### 1.3 heartbeat の identity 境界

`waitForClaudeMemory` は polling loop の heartbeat で marker を更新してよい。ただし marker の closed schema、
generation、canonical `workspaceId`、自身の session identity を検証して成功した後だけ renew する。検証前、検証失敗、
別 generation、別 workspace、未知 schema、破損 marker は touch しない。heartbeat の時計は注入可能な monotonic/fake
clock とし、wall-clock の mtime を信頼根にしない。検証済み identity の heartbeat が 15 分を越えても fresh 判定を
維持することを oracle で反証可能にする。

## 2. scope boundary

含むものは、既存 `resolveLiveClaudeWorkspace` / `waitForClaudeMemory` の typed live/deferred 結果、generation
identity 検証後の marker renew、canonical persistence 前の publish 禁止、exclusive-create retry 収束、および
L6 memory ↔ L7 unit-test-design の trace である。

明示的に含めないものは、wildcard/global broadcast、PID inference、PR-comment fallback、current-worktree inference、
#424 project-scoped root migration、#493 review-custody reason 分解、#494 手書き memory/frontmatter 修復、#444
terminal GC、queue 実装、CLI/hook/source/test code、既存 request の一括 replay である。これらを理由に本契約の deny を
緩和しない。

## 3. pair と candidate oracle

L6 正本は `docs/design/harness/L6-function-design/memory.md`、L7 の検証設計は
`docs/test-design/harness/L7-unit-test-design.md` の Issue #454 delta 節である。未実装の候補は
`CANDIDATE-*` とし、実装 PR で test citation とともに昇格する。

| candidate | 入力変異 | 期待結果（反証可能な観測） |
| --- | --- | --- |
| `CANDIDATE-MEMWAKE-LIVENESS-001` | fake clock で 15 分超を進め、generation identity 検証済み heartbeat を反復 | marker が renew され、候補は `live`。検証済み heartbeat を止めた対照系は stale になる |
| `CANDIDATE-MEMWAKE-LIVENESS-002` | schema-compatible marker を一つだけ stale にする | canonical request persistence 後、同じ `workspaceId` の `deferred` queue が一件だけ作られる |
| `CANDIDATE-MEMWAKE-LIVENESS-003` | stale marker を二つ配置する | ambiguous deny、canonical request/live/deferred の write は 0 |
| `CANDIDATE-MEMWAKE-LIVENESS-004` | marker JSON を破損または schema 非互換にする | typed deny、write 0。推測宛先や wildcard は出ない |
| `CANDIDATE-MEMWAKE-LIVENESS-005` | 同一 operation/content を直列・並列 retry する | exclusive-create は一件へ収束し、queue/live publish の重複は 0 |
| `CANDIDATE-MEMWAKE-LIVENESS-006` | canonical request writer を失敗させてから publish を試みる | request 未永続化時の publish/queue は 0（request persists before publish） |

## 4. Schedule と出口

1. [直列] 本 PLAN と既存 PLAN-L7-472 の Issue #454 delta を pair-freeze する。
2. [並列] L6 memory の typed routing/heartbeat/順序記述と L7 candidate oracle を同期する。
3. [直列] 非著者 review、plan lint、doc lane、diff check を exact HEAD で取得する。
4. [後続] 実装 PR が candidate を `U-*` へ昇格し、Linux/Windows/aggregate の実測と Reverse 要否を確定する。

本 PLAN の confirmed 化は設計と L7 candidate の整合だけを意味し、実装、Issue close、merge authority、#424/#493/#494
の解決を意味しない。
