---
plan_id: PLAN-L6-600-codex-review-wake-contract
title: "PLAN-L6-600 (add-design): Codex review wake の契約 freeze"
kind: add-design
layer: L6
sub_doc: function-spec
drive: be
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-09-15
updated: 2026-09-15
owner: Codex / TL
github_issue_id: 600
parent_design: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
backprop_decision: not_required
backprop_decision_reason: "既存の cross-review と async wake 要件を Codex provider 側へ具体化する docs-only 差分であり、L0-L3 要件を変更しない。"
agent_slots:
  - role: tl
    slot_label: "TL - canonical request、wake、receipt の信頼境界を freeze する"
  - role: se
    slot_label: "SE - project inbox、FIFO、terminal marker、hook surface の契約を定義する"
  - role: qa
    slot_label: "QA - publish failure、backlog、orphan、retry の反証可能な oracle を定義する"
generates:
  - artifact_path: docs/plans/PLAN-L6-600-codex-review-wake-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  requires:
    - docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/feedback/live-review-projection.ts
    - src/runtime/claude-provider-envelope.ts
    - src/runtime/claude-memory-wake.ts
    - src/cli/review-live.ts
    - src/cli.ts
    - .codex/hooks.json
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/600
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/604
review_evidence: []
---

# PLAN-L6-600: Codex review wake の契約 freeze

## 0. 目的と位置付け

Issue #600 は、Claude 著 PR の canonical review request が永続化された後、Codex reviewer へ
typed wake を配送できない欠落を扱う。現行の `src/cli.ts` は
`registerLiveReviewCommands(review)` を依存注入なしで組み立て、Codex provider の publisher が
未提供のまま `codex_review_wake_unavailable` になる。

本 PLAN は **docs-only の pair-freeze** であり、source、test code、hook config、inbox、receipt、
request の実体を生成しない。PR #604 の既存実装を正本へ昇格させるものではなく、実装 PR が方式を
その場で発明しないための契約と検証 oracle を先に固定する。Claude 側 wake の既存契約、
`#540` cutover files、review custody/receipt の信頼根は変更しない。

## 1. 凍結契約

### 1.1 canonical request と wake の順序

`review live-dispatch` は subject（exact HEAD と PR binding）を検証し、canonical request を
`.ut-tdd/review/requests/<requestDigest>.json` へ exclusive-create で永続化した後にだけ、typed
Codex wake を発行する。request が作成できない、または request の identity が不正な場合は
Codex inbox、hook surface、deferred/backlog の downstream write を 0 にする。

request 永続化後の wake 失敗は、次の既存 result shape に収束させる。

```ts
type CodexWakeDispatchFailure = {
  ok: false;
  reason:
    | "codex_review_wake_unavailable"
    | "review_wake_publish_failed"
    | "codex_review_wake_projection_conflict";
  backlog: {
    requestDigest: string;
    requestPath: string;
  };
};
```

`backlog` は canonical request の identity を再発行せずに再配送するための typed state である。
既存 request を削除・上書き・再 mint してはならない。wake publish が同じ canonical bytes の
retry であれば一件へ収束し、同じ identity の異なる bytes は conflict として fail-close する。

### 1.2 project-scoped Codex inbox

Codex wake は current worktree、PID、global broadcast、PR comment、固定の利用者 home を宛先に
推測してはならない。`requireProjectMemoryRoot(repoRoot)` が返す
`runtimeBusRoot`（`<git-common-dir>/ut-tdd-runtime/projects/<projectNamespace>`）を正本とし、
次の path だけを使う。

```text
<runtimeBusRoot>/codex-memory-wake/inbox/<entryStem>.json
```

inbox entry は既存 provider envelope v4 (`schemaVersion = "ut-tdd.claude-inbox/v4"`) を使い、
`purpose="review"`、`target.scope="session"`、`target.provider="codex"`、project ID、
memory ID、request digest/path、PR、exact HEAD、review revision、author family を束縛する。
producer は `provider="claude"`、Codex の論理受信 session は
`CODEX_REVIEW_TARGET_SESSION` で固定する。Codex inbox は Claude inbox と同じ directory に混ぜず、
project namespace を越えて読まない。

publish は inbox directory を安全に作成した後、mode `0600` の exclusive-create を行う。同一 path
に同一 canonical bytes が既にあれば成功扱い、異なる bytes または entry identity/path の不整合は
`codex_review_wake_projection_conflict` で fail-close し、既存 bytes を変更しない。

### 1.3 machine-readable hook surface

Codex project hook の `SessionStart` または `Stop` から、同じ current project の
`node src/cli.ts hook codex-memory-wake` を呼ぶ。hook surface は stdout の JSON object と exit code
を契約とし、schema は `ut-tdd.codex-memory-wake/v1` とする。

pending は次の shape、exit code `2` とする。`deliveryConfirmed` は必ず `false` であり、surface
観測を receipt/配送成功として扱わない。

```json
{
  "schema": "ut-tdd.codex-memory-wake/v1",
  "status": "pending",
  "deliveryConfirmed": false,
  "envelopePath": "<project-scoped absolute path>",
  "requestDigest": "<16-64 lowercase hex>",
  "pr": 123,
  "exactHead": "<40 lowercase hex>",
  "reviewRevision": "<non-empty string>",
  "reason": "codex_review_pending"
}
```

empty は `{"schema":"ut-tdd.codex-memory-wake/v1","status":"empty","deliveryConfirmed":false}`
で exit code `0` とする。未知 schema、project/target 不一致、path escape、破損 JSON は surface
から除外し、削除や別宛先への再配送で隠蔽せず、consumer が観測可能な typed invalid state とする。
hook の stderr/stdout を review verdict、receipt、merge authority の入力にしてはならない。

### 1.4 claim、consume、terminalize、FIFO、orphan

Codex は hook が返した **exact `envelopePath`** を
`node src/cli.ts review live-consume --envelope <path> --json` へ渡す。consumer は canonical
request、provider envelope v4、project/target、PR、exact HEAD、review revision、反対族 provider を
再検証し、Codex の reviewer delegation と canonical receipt projection が成功した後だけ inbox を
terminalize する。

- surface だけでは claim 済みとみなさない。receipt-producing consumer が成功するまで
  `deliveryConfirmed=false` の pending entry を保持する。
- 成功時は entry identity、request identity、PR、HEAD、revision、author family、terminal reason
  `claimed` を持つ terminal marker を mode `0600` で exclusive-create し、対応する inbox projection
  だけを削除する。marker は監査 retention（既存 runtime の7日）後に明示 namespace から prune する。
- consumer の provider unavailable、identity mismatch、verdict/receipt write failure、exit
  non-zero は typed fail-close とし、terminal marker と inbox 削除を行わない。次の hook cycle で
  同じ envelope を再配送できる。
- FIFO は valid Codex review entries を `createdAt`、同値時は entry identity の deterministic
  順で一件ずつ surface する。古い entry の失敗や orphan が後続 valid request を head-of-line
  block しないが、orphan を valid receipt として進めたり、黙って削除したりしない。
- malformed、schema 非互換、project/target 不一致、entry stem/path 不一致、terminal marker
  との identity 不一致は `codex_review_wake_envelope_invalid` 相当の typed invalid state として
  fail-close する。元の bytes は保持し、管理者が修復または再発行できる状態を残す。

### 1.5 production composition の境界

`registerLiveReviewCommands` は injected test ports を受けられるが、production CLI の composition
は Codex publisher を必須注入する別 entrypoint（現行実装案では
`registerProductionLiveReviewCommands`）を使う。`src/cli.ts` の production assembly が optional
publisher のままに戻る変異を、実 composition を起動する test oracle が検出する。Claude publisher
の既存経路と Codex publisher は同一 request identity を共有するが、互いの inbox/consumer を
読み替えない。

## 2. scope boundary

この docs-only freeze に含むものは、上記の schema、project-scoped path、producer/target identity、
request-before-wake ordering、failure/backlog shape、hook stdout/exit code、FIFO/terminal/orphan
semantics、production composition の観測点、および L7 candidate oracle である。

含まないものは、source 実装、`.codex/hooks.json` の変更、CLI command の追加、consumer/delegation
の実体、既存 inbox の replay/GC、receipt/custody、Claude wake、#540 cutover、Issue close、merge で
ある。これらは本 PLAN の pair-freeze 後に、1 PR = 1 論点で後続実装する。

## 3. pair と candidate oracle

L7 の候補 oracle は `docs/test-design/harness/L7-unit-test-design.md` の
`CANDIDATE-CODEXWAKE-*` 節を正本とする。実装 PR では各 candidate に test path、write count、
exact identity、exit code、再配送結果を citation し、実測できたものだけ `U-*` へ昇格する。

## 4. Schedule と出口

1. [直列] 本 PLAN と L7 candidate oracle を pair-freeze し、非著者 review を取得する。
2. [直列] plan lint、readability、diff check を exact HEAD で実行する。
3. [後続] Codex wake source/hook/consumer を bounded implementation PR として実装し、targeted
   test、typecheck、Biome、Linux/Windows CI、非著者 closing review を取得する。

本 PLAN の confirmed 化は Codex wake の方式を固定するだけであり、実装、receipt、Issue close、
merge authority、Claude/#540 の状態を意味しない。
