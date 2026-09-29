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
  receipt_id: certificate:01997f957b6bd4b4da0dcd48cf5fcc6f
  command_id: plan-revise:issue-733:sonnet-alias:plan:r2:653764d57a0c
  admitted_at: 2026-09-29T01:27:07.834Z
  source_digest: sha256:24240d3fae9e2dc2c0c6afe12aec5d2877538780962cc56931b036ec4d8c4615
  decision_digest: sha256:f141ec3a04ab17c05a12cef3ae477890d9bd564c510ed36b6c1f1ba921a69e2e
  receipt_digest: sha256:ab3875cbae65de769fc325ed2d183174ef721f8d5d2fd1d83e05832aceab4db1
  binding:
    path: docs/plans/PLAN-L7-733-sonnet-alias-effort-high.md
    plan_id: PLAN-L7-733-sonnet-alias-effort-high
    asset_id: plan:f0bcd70afbb592bba5d40bc3382cf326
    revision: 2
    content_digest: sha256:24240d3fae9e2dc2c0c6afe12aec5d2877538780962cc56931b036ec4d8c4615
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
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #733 PR #734 非著者レビュー r1 FLAG の是正: D3 の「ラダー外も high」が
    policyEffort の実装と矛盾していたため、Sonnet family id の正規化に改め AC-2 と
    CANDIDATE-U-SONALIAS-007 に反映する。"
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
   base 列挙と escalateShallowResponse の「base=high 帯」列挙に sonnet を追加。ラダー / capability rank の参照キーを
   Sonnet family で正規化する (D3): `\bsonnet\b` に一致する Claude の model id (`sonnet` / `claude-sonnet-5` /
   `claude-sonnet-5-5` 等) は `MODEL_IDS.claude.sonnet` のエントリを引く。`policyEffort` / `escalateShallowResponse` /
   `MODEL_CAPABILITY_RANK` 参照の 3 箇所がこの正規化を共有する。Opus / Haiku / Fable / Codex 系の exact-key 参照は変えない。
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

### D3. Sonnet family id の正規化 (rev 2 で訂正)

rev 1 は「ラダー外の id は従来既定 Claude=high に落ちるので実害なし」と書いたが誤り。`policyEffort`
(`src/team/model-policy.ts`) はラダー外かつ intent が implementation / test / lightweight のとき provider 判定より先に
`middle` を返す。明示 `--model claude-sonnet-5` や解決後 id (`claude-sonnet-5-5`) で走る Sonnet が `middle` になり、
AC-2「Sonnet 既定 high」が id の綴りで破れる (非著者レビュー r1 の実測: implementation / simple / explicit model で
`sonnet=high`、`claude-sonnet-5=middle`、`claude-sonnet-5-5=middle`)。

採択: ラダーと capability rank の参照キーを Sonnet family で正規化する (scope 1)。PO 指示は「Sonnet の推奨 effort を high」
であり、id の綴り (alias / 世代付き / 解決後) で結果が変わるのは指示に反する。正規化は Sonnet family に限る —
alias 化するのは Sonnet だけで、Opus / Haiku / Fable の id は本 PLAN で変えないため、他 family を正規化する理由がない。
family 判定は agent-guard の `normalizeModelFamily` と同じ `\bsonnet\b` 規則を使い、runtime → team の import 禁止
(module-boundary) に触れないよう team 層内に閉じた 1 関数とする。

却下: AC-2 を alias 経路だけに限定し、世代付き / 解決後 id の `middle` を受容する案。PO 指示の範囲を実装都合で狭めるため。

残る副作用 (受容): token telemetry は transcript の `message.model` (解決後 id) を記録し、`claude-sonnet-5-5` は
`pricingKeyFor` の prefix 規則で `claude-sonnet-5` 単価に一致する。Sonnet 5.5 の単価が異なる場合は旧単価で計上される —
価格表は本 PLAN 非スコープのため別 issue で扱う。

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
| CANDIDATE-U-SONALIAS-007 | intent=implementation・difficulty=simple・明示 model で `selectTeamModel` の reasoning_effort が `sonnet` / `claude-sonnet-5` / `claude-sonnet-5-5` のいずれも `high`、`escalateShallowResponse` がいずれも high → opus/middle、`claude-opus-5` / `claude-haiku-4-5` の結果は正規化前と不変 (正規化を外す mutation で `claude-sonnet-5=middle` に戻り Red) |
| CANDIDATE-U-SONALIAS-006 | 生成 adapter テンプレートの Sonnet effort 記述が high、Opus は middle のまま |

## 実装順序 (serial)

1. (serial) 本 PLAN の pair-freeze: 非著者 frontier (Codex Sol) で cross-review。
2. (serial) 実装 PR 1 本 (スコープ 1〜6)。generates の成果物宣言と confirm は同 PR で行う。

## 受入条件

- AC-1: Sonnet 指定箇所が `sonnet` で、世代固定が残らない (CANDIDATE-U-SONALIAS-001/002)。
- AC-2: Sonnet 既定 effort が high (frontmatter / ラダー / 共通ルール文 / adapter テンプレート)。alias / 世代付き / 解決後のどの Sonnet id でも同じ (CANDIDATE-U-SONALIAS-001/003/006/007)。
- AC-3: model-id-ssot-drift / model-id-doc-drift / rule-drift / agent-guard / setup 系テストが green。
- AC-4: token-tracker 価格表は無変更。

## 改訂履歴

- rev 1: 初回起票。
- rev 2: 非著者レビュー r1 の FLAG (D3 の「ラダー外も high」が `policyEffort` の実装と矛盾) を是正。D3 を Sonnet family id の正規化に改め、scope 1・AC-2 に反映、CANDIDATE-U-SONALIAS-007 を追加。
