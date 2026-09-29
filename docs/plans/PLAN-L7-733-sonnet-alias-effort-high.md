---
plan_id: PLAN-L7-733-sonnet-alias-effort-high
title: "PLAN-L7-733 (retrofit): Sonnet のモデル指定を世代固定 claude-sonnet-5 からエイリアス
  sonnet へ変え、既定 effort を high にする (issue #733)"
kind: retrofit
layer: L7
drive: agent
route_signal: upgrade
route_mode: retrofit
created: 2026-09-29
updated: 2026-09-29
owner: PM / PO
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
backprop_decision: not_required
backprop_decision_reason: Model / Effort Routing 原則 (創出=worker tier、判断=frontier
  tier、xhigh を既定で配らない) は不変。 MODEL_IDS.claude.sonnet の値と Sonnet 帯の effort 既定値だけを
  PO 指示 (2026-09-29) で更新する retrofit であり、新規 L0/L1 要件ではない。
agent_slots:
  - role: se
    slot_label: SE (Codex worker) — MODEL_IDS / guard catalog / MODEL_EFFORT_LADDER
      / templates.ts / agent frontmatter / 共通ルール文の更新
  - role: qa
    slot_label: QA — CANDIDATE-U-SONALIAS-001〜006 の実装と既存 U-ROUTE2-012 / U-MODELID-SSOT の追随
  - role: tl
    slot_label: TL (非著者 frontier = Codex Sol) — ladder 形状と族判定・provider 判定の不変性レビュー
generates:
  - artifact_path: docs/plans/PLAN-L7-733-sonnet-alias-effort-high.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-430-task-kind-model-routing-v2.md
    - docs/plans/PLAN-L7-256-model-id-ssot-drift-gate.md
    - docs/plans/PLAN-L7-414-agent-guard-claude5-family-rank.md
  blocks: []
  references: []
review_evidence: []
status: draft
github_issue_id: 733
admission_receipt:
  schema_version: v2
  receipt_id: certificate:f0bcd70afbb592bba5d40bc3382cf326
  command_id: plan-draft:issue-733:sonnet-alias:1
  admitted_at: 2026-09-29T01:14:10.498Z
  source_digest: sha256:81568f634eea18fd132ceb935a90cb706661125c143a9bdddca09a7d060f71e8
  decision_digest: sha256:0093bae84b2497a1e2f9f395a221bcb5f44f3145f71c54c3376c059a17c2a604
  receipt_digest: sha256:a41e23c428f6bb3fa4b582905ac87d850bd73f8250790ca7dda9b5174474d0f6
  binding:
    path: docs/plans/PLAN-L7-733-sonnet-alias-effort-high.md
    plan_id: PLAN-L7-733-sonnet-alias-effort-high
    asset_id: plan:f0bcd70afbb592bba5d40bc3382cf326
    revision: 1
    content_digest: sha256:81568f634eea18fd132ceb935a90cb706661125c143a9bdddca09a7d060f71e8
  route:
    signal: upgrade
    mode: retrofit
  issue:
    provider: github
    issue_id: 733
    episode_id: E4-733-sonnet-alias
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-430-task-kind-model-routing-v2
    revision: 1
    digest: sha256:1c9c096934033372475e7b46bc978f47021628e98e7ffebf4a29b8ad984d100e
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-733-sonnet-alias-effort-high
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #733: PO 指示 (2026-09-29) で Sonnet のモデル指定を世代固定
    claude-sonnet-5 からエイリアス sonnet へ変え、既定 effort を high にする。PLAN-L7-430 の model
    routing を弱めず世代追随させる retrofit の新規起票。"
---

# PLAN-L7-733 (retrofit): Sonnet エイリアス化と既定 effort high

## 目的

PO 指示 (2026-09-29、issue #733、確定事項): Sonnet 5.5 のリリースを受け、`claude-sonnet-5` の世代固定をやめて
エイリアス `sonnet` で最新 Sonnet に解決させる。あわせて Sonnet の既定 effort を `high` にする。

## route 判定

- `refactor` は pairing obligation が behavior invariant (`src/schema/route-filing.ts` refactor 節) であり、既定 effort
  `middle`→`high` の変更は振る舞い変更なので不適合。
- 世代更新 (upgrade / dependency_outdated) は `retrofit` (`src/schema/route-map.ts` retrofit tokens)、tuple
  `retrofit/retrofit/L7` (`src/plan-admission/policy.ts` ADMISSION_TUPLES)。先例は同じ model routing を改定した
  `docs/plans/PLAN-L7-430-task-kind-model-routing-v2.md` (retrofit / dependency_outdated)。
- branch prefix は `work/retrofit-` 必須 (`src/plan-admission/policy.ts` expectedPrefix)。

## スコープ (実装 PR 1 本、論点 = Sonnet 指定の世代非固定化)

1. `src/team/model-policy.ts`: `MODEL_IDS.claude.sonnet = "sonnet"`、JSDoc 更新。`MODEL_EFFORT_LADDER[sonnet]` を
   `{ base: "high", escalate: { model: MODEL_IDS.claude.opus, effort: "middle" } }` (shallow なし) へ。ラダー JSDoc の
   base 列挙と escalateShallowResponse の「base=high 帯」列挙に sonnet を追加。
2. `src/runtime/agent-guard-policy.ts`: `CLAUDE_MODEL_FAMILY_CATALOG.sonnet = "sonnet"`。
3. `src/setup/templates.ts`: adapter CLAUDE.md の Sonnet 行 effort を `high (xhigh for UI/UX)`、adapter
   `.claude/CLAUDE.md` の「Opus / Sonnet reasoning effort defaults to middle」を Opus=middle / Sonnet=high に分離。
   `docs/templates/adapter/` の mirror を再生成 (agents 9 本 + CLAUDE.md + .claude/CLAUDE.md)。
4. `.claude/agents/` の 9 本 (be-api / be-logic / db-schema / devops-deploy / pmo-project-explorer / pmo-sonnet /
   pmo-tech-docs / pmo-tech-fork / pmo-tech-news): `model: sonnet`、`effort: high`。pmo-sonnet / pmo-tech-news の
   description にある「Sonnet medium thinking」を high へ。
5. 共通ルール文: `CLAUDE.md` / `AGENTS.md` の Model / Effort Routing 節 (Sonnet の model id 表記と effort ラダー:
   base を Opus/Terra=middle、Sonnet/Luna/spark/mini=high、shallow 行から Sonnet を外し、escalate は Sonnet→Opus middle
   のまま)、`.claude/CLAUDE.md` §委譲と判断層 の Sonnet 表記。
6. tests: 下記 §テスト設計。

非スコープ: `src/state-db/token-tracker.ts` の価格表 (外部 pricing 正本、issue AC で変更禁止)。確定 PLAN 本文・
review_evidence の reviewer_model / worker_model、memory curation ledger、歴史的証跡を模した test fixture。

## 設計判断

### D1. ラダー形状

base=high 帯は shallow を持たず、浅ければ xhigh ではなくモデルを上げる (`src/team/model-policy.ts`
escalateShallowResponse の既存規律、PO 2026-07-28)。Sonnet を base=high にする以上、shallow を持たせると
`xhigh` を既定で配ることになり U-ROUTE2-014 に反する。よって `base: high`、shallow なし、escalate = Opus `middle`。
既存 escalateShallowResponse は `escalateFrom = shallow ?? base` なので、sonnet/high → opus/middle は無変更で成立する。

### D2. alias の妥当性 (実測)

- family 判定: `normalizeModelFamily` は `\bsonnet\b` 照合 (`src/runtime/agent-guard.ts`)、`"sonnet"` → sonnet
  (既存 `tests/agent-guard.test.ts` で assert 済み)。asset catalog の modelFamily も同じ正規表現 (`src/assets/catalog.ts`)。
- provider 判定: `modelProviderFromId` は `includes("sonnet")` で claude を返す (`src/schema/index.ts`)。
  checkCrossAgentModelPair / release-promotion-rollback-gate の provider 判定は変更不要。
- team schema の model override は `sonnet` を family alias として受理済み (`src/schema/team.ts`)。
- model-id-doc-drift の形状正規表現 (`src/lint/model-id-doc-drift.ts`) は `claude-<name>-<n>` 形のみを拾うため alias は
  offender にならない (function-spec は symbol 参照のみで影響なし)。

### D3. 既知の副作用 (受容)

- MODEL_EFFORT_LADDER / MODEL_CAPABILITY_RANK は exact id キー。明示 `--model claude-sonnet-5` や解決後 id
  (例 `claude-sonnet-5-5`) はラダー外となり従来既定 (Claude = high) に落ちる。値は high で一致するため実害なし。
- token telemetry は transcript の `message.model` (解決後 id) を記録する。`claude-sonnet-5-5` は
  `pricingKeyFor` の prefix 規則で `claude-sonnet-5` 単価に一致する (残差 `-5` が数字始まり)。Sonnet 5.5 の単価が
  異なる場合は黙って旧単価で計上される — 価格表は本 PLAN 非スコープのため別 issue で扱う。

## テスト設計

既存 oracle の追随:
- `tests/team-model-policy.test.ts` U-ROUTE2-012: `base(MODEL_IDS.claude.sonnet)` を `high` へ、タイトルを
  「opus/terra=middle, sonnet/luna/spark/mini=high」へ。
- `tests/team-model-policy.test.ts` 「keeps explicit Claude engine family …pmo-sonnet」: reasoning_effort `middle`→`high`、コメント更新。
- `tests/team-model-policy.test.ts` U-ROUTE2-013: sonnet のコメント「middle → high → opus middle」を「high → opus middle」へ (assert は不変で成立)。
- U-MODELID-SSOT (a)(b)(c)(e)(f) と `tests/setup.test.ts` / `tests/setup-agent-floor.test.ts` は MODEL_IDS symbol 参照のため
  frontmatter・mirror を同時更新すれば無改変で green。

新規 oracle (実装 PR で追加、本 head では未実装):

| ID | oracle |
|---|---|
| CANDIDATE-U-SONALIAS-001 | `.claude/agents` の sonnet family 9 本の frontmatter が `model: sonnet` かつ `effort: high` |
| CANDIDATE-U-SONALIAS-002 | `MODEL_IDS.claude.sonnet === "sonnet"` かつ `CLAUDE_MODEL_FAMILY_CATALOG` と等価、世代 suffix (`/-\d/`) を含まない |
| CANDIDATE-U-SONALIAS-003 | `MODEL_EFFORT_LADDER[sonnet]` が base=high・shallow 未定義・escalate=opus/middle、escalateShallowResponse(sonnet, high) → opus/middle、(sonnet, middle) → null |
| CANDIDATE-U-SONALIAS-004 | `normalizeModelFamily("sonnet")` と agent-guard が `model: sonnet` frontmatter を sonnet family と解決し、haiku 要求を downgrade で拒否 |
| CANDIDATE-U-SONALIAS-005 | `checkCrossAgentModelPair("sonnet", MODEL_IDS.codex.frontier)` が ok・workerProvider=claude、`("sonnet", MODEL_IDS.claude.opus)` が same_provider |
| CANDIDATE-U-SONALIAS-006 | 生成 adapter テンプレートの Sonnet effort 記述が high、Opus は middle のまま |

## 実装順序 (serial)

1. (serial) 本 PLAN の pair-freeze: 非著者 frontier (Codex Sol) で cross-review。
2. (serial) 実装 PR 1 本 (スコープ 1〜6)。generates の成果物宣言と confirm は同 PR で行う。

## 受入条件

- AC-1: Sonnet 指定箇所が `sonnet` で、世代固定が残らない (CANDIDATE-U-SONALIAS-001/002)。
- AC-2: Sonnet 既定 effort が high (frontmatter / ラダー / 共通ルール文 / adapter テンプレート) (CANDIDATE-U-SONALIAS-001/003/006)。
- AC-3: model-id-ssot-drift / model-id-doc-drift / rule-drift / agent-guard / setup 系テストが green。
- AC-4: token-tracker 価格表は無変更。
