---
plan_id: PLAN-L7-733-sonnet-alias-effort-high
title: "PLAN-L7-733 (retrofit): Claude 全 family のモデル指定を世代固定 ID からエイリアス (opus /
  fable / sonnet / haiku) へ変え、Sonnet の既定 effort を high にする (issue #733)"
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
  tier、xhigh を既定で配らない、族分離) は不変。 Claude 全 family (Fable / Opus / Sonnet / Haiku)
  の model 指定値を世代固定 ID から Claude Code エイリアスへ置き換え、Sonnet 帯の effort 既定値だけを PO 指示
  (2026-09-29) で更新する retrofit であり、新規 L0/L1 要件ではない。 GPT/Codex 系 ID は変更しない。
agent_slots:
  - role: se
    slot_label: SE (Codex worker) — MODEL_IDS.claude / guard catalog / ladder・rank の
      family 正規化 / provider・override の alias 受理 / templates.ts / agent
      frontmatter / 共通ルール文の更新
  - role: qa
    slot_label: QA — CANDIDATE-U-SONALIAS-001〜009 の実装と既存 live-value oracle の追随
  - role: tl
    slot_label: TL (非著者 frontier = Codex Sol) — ladder 形状・family 正規化・provider
      判定・tier-router 不変条件のレビュー
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
  receipt_id: certificate:8104a7bcf5801eec9b0f71ec28e610bc
  command_id: plan-revise:issue-733:sonnet-alias:plan:r3:9214e2983b40
  admitted_at: 2026-09-29T01:50:25.871Z
  source_digest: sha256:867e8b6beb743e9c90cdc0f3d6b2d83a0d68ce627a81d87dfa8851e18a0ef880
  decision_digest: sha256:ed47b4b86649a314e35bab3a24e24ce9afa8139f39bce5625710f33bde3417a2
  receipt_digest: sha256:ca6323ad45bcf34529eb26e401e398b5cef7935e35aa010be15f71d974e6c2bd
  binding:
    path: docs/plans/PLAN-L7-733-sonnet-alias-effort-high.md
    plan_id: PLAN-L7-733-sonnet-alias-effort-high
    asset_id: plan:f0bcd70afbb592bba5d40bc3382cf326
    revision: 3
    content_digest: sha256:867e8b6beb743e9c90cdc0f3d6b2d83a0d68ce627a81d87dfa8851e18a0ef880
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
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #733 PR #734: PO 指示 (2026-09-29) で対象を Sonnet から Claude 全
    family (Fable / Opus / Sonnet / Haiku) のエイリアス化へ拡大する。GPT 系は #735 で別に扱う。"
---

# PLAN-L7-733 (retrofit): Claude 全 family のエイリアス化と Sonnet 既定 effort high

## 目的

PO 指示 (2026-09-29、issue #733、確定事項): Sonnet 5.5 のリリースを受け、Claude の世代固定 ID をやめる。当初
(rev 1〜2) は Sonnet のみが対象だったが、PO 指示 (2026-09-29) で **Claude 全 family** に拡大する。
`claude-fable-5` / `claude-opus-5` / `claude-sonnet-5` / `claude-haiku-4-5` を指定している live な箇所は、すべて
Claude Code のエイリアス `fable` / `opus` / `sonnet` / `haiku` に置き換え、各 family の最新モデルへ自動解決させる。

effort 既定値: Sonnet は `high` へ変更 (rev 2 と同じ)。Opus は `middle`、Fable は `low` のまま、Haiku は現行既定
(ラダー外 = 従来既定) のまま。

**GPT/Codex 系 ID は明示的に対象外** (固定のまま)。Codex CLI には検証済みの「最新」エイリアスが無く、ChatGPT
アカウント経由の CLI では `gpt-6-*` ID が 400 を返す。GPT 系の扱いは別 issue で検証する。

## route 判定

- `refactor` は pairing obligation が behavior invariant (`src/schema/route-filing.ts` refactor 節) であり、既定 effort
  `middle`→`high` の変更と、エイリアス経由の解決先モデル変更は振る舞い変更なので不適合。
- 世代更新 (upgrade / dependency_outdated) は `retrofit` (`src/schema/route-map.ts` retrofit tokens)、tuple
  `retrofit/retrofit/L7` (`src/plan-admission/policy.ts` ADMISSION_TUPLES)。先例は同じ model routing を改定した
  `docs/plans/PLAN-L7-430-task-kind-model-routing-v2.md` (retrofit / dependency_outdated)。
- branch prefix は `work/retrofit-` 必須 (`src/plan-admission/policy.ts` expectedPrefix)。

## 対象箇所の棚卸し (実測)

実測コマンド: `git grep -nE "claude-(opus-5|fable-5|sonnet-5|haiku-4-5)" -- . ':!docs/plans' ':!docs/archive' ':!node_modules' ':!.ut-tdd'`
(rev 3 起票 head で実行)。

### 変更対象 (live な指定値)

- `src/team/model-policy.ts:16-20` — `MODEL_IDS.claude.{fable,opus,sonnet,haiku}` (SSoT)。
  `STANDARD_ORCHESTRATION_EXPECTATION` / `MODEL_CAPABILITY_RANK` / `REVIEW_LANE_MODELS` / `PLAN_AGENT_MODELS` /
  `MODEL_EFFORT_LADDER` / `src/task/tier-router-policy.ts:13-16` `TIER_TABLE` は symbol 参照なので値は自動追随する。
- `src/runtime/agent-guard-policy.ts:31-36` — `CLAUDE_MODEL_FAMILY_CATALOG` (runtime 層の複製、
  `tests/model-id-ssot-drift.test.ts` (f) が MODEL_IDS.claude との等価を強制)。
- `.claude/agents/*.md` の `model:` 行 20 本 (いずれも 5 行目):
  - Opus 8 本: blind-reviewer / code-reviewer / pdm-innovation-manager / pdm-marketing-innovation /
    pdm-tech-innovation / qa-test / security-audit / ut-tdd-tl → `model: opus` (effort は現行値のまま)。
  - Sonnet 9 本: be-api / be-logic / db-schema / devops-deploy / pmo-project-explorer / pmo-sonnet / pmo-tech-docs /
    pmo-tech-fork / pmo-tech-news → `model: sonnet`、`effort: high`。
  - Haiku 3 本: pmo-haiku / pmo-project-scout / refactor-scout → `model: haiku` (effort は現行値のまま)。
- `docs/templates/adapter/.claude/agents/*.md` の同 20 本 — `src/setup/templates.ts:14-16` の
  `CLAUDE_OPUS` / `CLAUDE_SONNET` / `CLAUDE_HAIKU` (MODEL_IDS symbol) から生成される mirror。再生成で追随する。
- `docs/templates/adapter/CLAUDE.md:21-23`、`docs/templates/adapter/.claude/CLAUDE.md:16-17` — 同じく
  `src/setup/templates.ts` 由来の生成 mirror。effort 記述 (`src/setup/templates.ts:257` / `:324`) も更新対象。
- 共通ルール文 (prose):
  - `CLAUDE.md:92` (advisor の design 一次 `claude-fable-5`)、`:361` (frontier reviewer tier `claude-opus-5`)、
    `:371-373` (Opus / Sonnet / Haiku の task-kind 割当)、`:391` (top reviewer Opus)、`:396` (デザイン/UI 判断 Fable)。
  - `AGENTS.md:172-174`、`:187`、`:197` (CLAUDE.md と同内容)。
  - `.claude/CLAUDE.md:125` (advisor Fable)、`:157` (文書作成 = Sonnet)。
- alias 受理の欠落 (D4 で詳述、本 PLAN で追加):
  - `src/schema/index.ts:277-293` `modelProviderFromId` — `sonnet` / `opus` / `haiku` は `includes` で claude 判定
    されるが **`fable` が無く、alias `fable` は `unknown` になる**。
  - `src/schema/team.ts:48-58` `modelOverrideSchema` — family alias 許可リストが `haiku` / `sonnet` / `opus` / `local`
    のみで **`fable` を拒否する**。

### 歴史的記録・例示 (変更しない)

- `docs/governance/memory-curation-ledger-2026-09.md:9` / `:31` / `:2231` / `:2243` — 2026-09 の curation 実施記録
  (author model・archive path)。
- `docs/test-design/harness/L7-pack-authoring-template-scope-test-design.md:85` — advisor 合意形成の実施記録。
- `docs/governance/candidates/ut-tdd-concept-v4-requirements.md:27` — advisor 相談記録 (日付付き)。
- `docs/design/harness/L6-function-design/cross-review-enforcement.md:27` — `worker_model` に記録される値の例示。
  review_evidence は解決後の実 ID を記録する欄であり、世代付き ID の例示として妥当。
- `src/memory/curation-ledger.ts:22-25` `BLIND_REVIEW_FRONTIER_MODELS.claude = "claude-opus-5"` — **分類: provenance
  verifier (routing 値ではない)**。`:356-358` で ledger に記録済みの `reviewer.model` と exact 比較する検証定数であり、
  どのモデルで実行するかを決める値ではない。現行 ledger の reviewer は `gpt-5.6-sol` (codex) で claude 側の値は
  出荷済み ledger では使われていない。alias に変えると「記録には解決後 ID が入る」前提と噛み合わず、
  逆に Claude reviewer の記録 (`claude-opus-5`) を reject する。したがって本 PLAN では変えない。
  ただし family 世代固定の潜在問題 (Claude reviewer が `claude-opus-5-5` を記録すると `reviewer-not-frontier`) は
  残るため、family 正規化比較への移行は別 issue で扱う (§残存リスク)。
- tests の履歴 fixture (§テスト設計 既存 oracle の分類を参照)。

### 非スコープ

- `src/state-db/token-tracker.ts:59-66` — 外部 pricing 正本 (価格表)。issue AC で変更禁止。
- GPT/Codex 系 ID (`MODEL_IDS.codex.*`、`gpt-*` の prose 表記) — PO 指示で対象外 (別 issue)。
- `src/assets/catalog.ts:56` / `:194-196` の `model_family` union は `fable` を持たないが、fable を指定する agent /
  asset は存在しないため本 PLAN では触れない。
- 確定 PLAN 本文・review_evidence の reviewer_model / worker_model。

## スコープ (実装 PR 1 本、論点 = Claude 指定の世代非固定化)

1. `src/team/model-policy.ts`:
   - `MODEL_IDS.claude = { fable: "fable", opus: "opus", sonnet: "sonnet", haiku: "haiku" }`、JSDoc を「Claude Code
     エイリアス、各 family の最新へ解決」に更新。
   - `MODEL_EFFORT_LADDER[sonnet]` を `{ base: "high", escalate: { model: MODEL_IDS.claude.opus, effort: "middle" } }`
     (shallow なし) へ。Fable / Opus のエントリは値不変。ラダー JSDoc の base 列挙と escalateShallowResponse の
     「base=high 帯」列挙に sonnet を追加。
   - D3 の family 正規化関数を追加し、下記の全 exact-key lookup が共有する。
2. `src/team/delegation-routing.ts:81-83` `ladderBaseEffort` — D3 の正規化関数経由でラダーを引く。
3. `src/runtime/agent-guard-policy.ts:31-36`: `CLAUDE_MODEL_FAMILY_CATALOG` を alias へ (MODEL_IDS.claude と等価)。
4. `src/schema/index.ts` `modelProviderFromId` に `fable` を claude 判定として追加。`src/schema/team.ts`
   `modelOverrideSchema` の alias 許可リストとエラーメッセージに `fable` を追加 (D4)。
5. `src/setup/templates.ts`: adapter CLAUDE.md の Sonnet 行 effort を `high (xhigh for UI/UX)`、adapter
   `.claude/CLAUDE.md` の「Claude Opus / Sonnet reasoning effort defaults to `middle`」を Opus=middle / Sonnet=high に
   分離。model 表記は MODEL_IDS symbol 由来なので alias へ自動追随する。`docs/templates/adapter/` の mirror を再生成
   (agents 20 本 + CLAUDE.md + .claude/CLAUDE.md)。
6. `.claude/agents/` 20 本: `model:` を alias へ。Sonnet 9 本は `effort: high` へ、pmo-sonnet / pmo-tech-news の
   description にある「Sonnet medium thinking」を high へ。Opus / Haiku の effort は変えない。
7. 共通ルール文: `CLAUDE.md` / `AGENTS.md` の Model / Effort Routing 節と PO 判断エスカレーション節の Claude ID を
   alias 表記へ (例: Opus (`opus`)、advisor 一次 `fable`)。effort ラダー記述は base を Opus/Terra=middle、
   Sonnet/Luna/spark/mini=high、shallow 行から Sonnet を外し、escalate は Sonnet→Opus middle のまま。
   `.claude/CLAUDE.md` §着手前 advisor 合意形成・§委譲と判断層 の Claude ID も alias へ。GPT 系表記は変えない。
8. tests: 下記 §テスト設計。

## 設計判断

### D1. ラダー形状

base=high 帯は shallow を持たず、浅ければ xhigh ではなくモデルを上げる (`src/team/model-policy.ts`
escalateShallowResponse の既存規律、PO 2026-07-28)。Sonnet を base=high にする以上、shallow を持たせると
`xhigh` を既定で配ることになり U-ROUTE2-014 に反する。よって `base: high`、shallow なし、escalate = Opus `middle`。
既存 escalateShallowResponse は `escalateFrom = shallow ?? base` なので、sonnet/high → opus/middle は無変更で成立する。
Fable (low → middle → Sol low) と Opus (middle → high → Sol low) の形状は変えない。

### D2. alias の妥当性 (実測)

- family 判定: `normalizeModelFamily` (`src/runtime/agent-guard.ts:75-84`) は catalog 値との一致または
  `\b(family)\b` 照合で判定する。alias 化後は catalog 値 = family 名なので両条件は同値になり、`opus` / `fable` /
  `sonnet` / `haiku` と世代付き ID のどちらも一意に解決する。frontmatter からの解決 (`src/cli.ts:494-502`
  resolveAgentFamilyFromRepo) も同関数を通るため floor 判定は不変。
- provider 判定: `modelProviderFromId` (`src/schema/index.ts:277-293`) は `sonnet` / `opus` / `haiku` を claude と
  判定する。`fable` は判定されない (D4)。
- advisor: `src/team/advisor-policy.ts:86-92` の orchestrator family 判定と `:202-227` isLowerThanAdvisor は
  `includes` による family 照合なので alias でも世代付き ID でも同じ結果になる。`fableRoute` (`:112-115`) は
  `MODEL_IDS.claude.fable` を返すため advisor の Claude 相談は `--model fable` で起動する (D5)。
- model-id-doc-drift (`src/lint/model-id-doc-drift.ts`) は `claude-<name>-<n>` 形のみを拾い、対象は
  `docs/design/harness/L6-function-design/function-spec.md` だけなので alias は offender にならない。
- `tests/model-id-ssot-drift.test.ts` (a)(c) は frontmatter の `model:` が `Object.values(MODEL_IDS.claude)` に含まれる
  ことを要求する。frontmatter と SSoT を同時に alias 化すれば成立し、片側だけを変えると Red になる (drift 検出は維持)。

### D3. Claude model id の family 正規化 (rev 2 の Sonnet 限定を一般化)

rev 1 は「ラダー外の id は従来既定 Claude=high に落ちるので実害なし」と書いたが誤り。`policyEffort`
(`src/team/model-policy.ts`) はラダー外かつ intent が implementation / test / lightweight のとき provider 判定より先に
`middle` を返す。明示 `--model claude-sonnet-5` や解決後 id (`claude-sonnet-5-5`) で走る Sonnet が `middle` になり、
AC-2「Sonnet 既定 high」が id の綴りで破れる (非著者レビュー r1 の実測: implementation / simple / explicit model で
`sonnet=high`、`claude-sonnet-5=middle`、`claude-sonnet-5-5=middle`)。rev 2 はこれを Sonnet 限定の正規化で是正した。

rev 3 では全 Claude family を alias 化するため、同じ問題が全 family に広がる: ラダー・rank のキーが `opus` / `fable`
になると、明示 `claude-opus-5` や解決後 `claude-opus-5-5` は exact-key で外れ、Opus/Fable の effort が ladder 値から
policy 既定へ、`advisorHeavyUseRecommended` が「未知モデル = 下回る扱い」(true) へ振れる。

採択: team 層内に 1 関数 (例: `claudeFamilyKey(model: string): string`) を置き、`\b(fable|opus|sonnet|haiku)\b` に
**ちょうど 1 family** が一致する model id はその family の `MODEL_IDS.claude[family]` (= alias) へ写し、それ以外
(Codex / GPT 系、未知、複数一致) は入力をそのまま返す。規則は `normalizeModelFamily` と同じ単語境界・曖昧時は
非正規化 (fail-closed 側 = exact-key 参照のまま) とし、runtime → team の import 禁止 (module-boundary) に触れないよう
runtime 層の関数は import しない。

この関数を共有しなければならない exact-key lookup (実測 `grep -rn "MODEL_EFFORT_LADDER\|MODEL_CAPABILITY_RANK" src`):

| 箇所 | 参照 | 正規化しない場合の破れ |
|---|---|---|
| `src/team/model-policy.ts:187` escalateShallowResponse | `MODEL_EFFORT_LADDER[input.model]` | `claude-opus-5` / middle で null (Opus → high の shallow が消える) |
| `src/team/model-policy.ts:512` policyEffort | `MODEL_EFFORT_LADDER[input.model]` | 明示 Sonnet 世代付き ID が middle、Fable 世代付き ID が low でなく policy 既定 |
| `src/team/model-policy.ts:88-89` advisorHeavyUseRecommended | `MODEL_CAPABILITY_RANK[currentModel / expected]` | `--current-model claude-opus-5` が「下回る」(true) に反転 |
| `src/team/delegation-routing.ts:82` ladderBaseEffort | `MODEL_EFFORT_LADDER[model]` | 明示 `--model claude-opus-5` の review role が ladder middle でなく fallback |

escalateShallowResponse の返り値の `model` は、入力が shallow 段 (同モデル継続) の場合は **呼び出し元が渡した id を
そのまま返す** (正規化後の alias に書き換えない。明示 ID の意思を保つ)。escalate 段は ladder の escalate 値 (Opus
なら `MODEL_IDS.codex.frontier`、Sonnet なら `MODEL_IDS.claude.opus` = `opus`) を返す。

Codex / GPT 系 ID は exact-key のまま (正規化関数は Codex 系を素通しする)。Haiku はラダー外のままなので正規化後も
ラダーを引かず従来既定に落ちる (AC: Haiku 既定不変)。

却下: AC-2 を alias 経路だけに限定し、世代付き / 解決後 id の結果差を受容する案。PO 指示の範囲を実装都合で狭めるため。
却下: ラダー / rank に alias と世代付き ID を両方キーとして持たせる案。世代が進むたびにキー追加が要り、世代非固定化の
目的に反する。

### D4. alias 受理の欠落是正 (`fable`)

`sonnet` / `opus` / `haiku` は既に provider 判定と team schema の alias として受理されているが、`fable` は受理されて
いない (棚卸し参照)。alias 化後に `MODEL_IDS.claude.fable = "fable"` が review_evidence の worker/reviewer model や
team 定義の model override に現れると、`modelProviderFromId("fable") = "unknown"` で `checkCrossAgentModelPair` が
unknown provider として fail-close し、`modelOverrideSchema` は parse error になる。よって両方に `fable` を追加する。
追加は既存 3 family と同じ `includes` / 許可リスト方式に揃え、判定規則は変えない。

### D5. CLI argv への alias 流入と probe 義務

alias は CLI argv に直接流れる: `src/runtime/adapter.ts:379-382` が Claude 起動時に
`[...CLAUDE_STDIN_ARGS, "--model", intent.model, "--effort", <effort>]` を組む (`CLAUDE_MODEL_FLAG` は
`src/runtime/adapter-policy.ts:7`)。経路は正規委譲 (`ut-tdd claude --role <role>`、判断ゲート role は
`REVIEW_LANE_MODELS` = `opus`) と advisor (`fableRoute` = `fable`)。Codex 側 argv (`-m <gpt-id>`) は不変。

Claude Code の `--model` は `opus` / `sonnet` / `haiku` alias を受理する前提だが、**`fable` alias の受理は未検証**で
ある。よって実装 PR は、4 alias それぞれについて Claude CLI が受理し該当 family のモデルへ解決したことを示す probe を
PR 本文と review_evidence に記録する (例: `claude --print --model <alias> --effort low` に短い prompt を渡し、
transcript / JSON 出力の `model` が該当 family の ID であることを記録。CLI version も併記)。
いずれかの alias が拒否された場合、その family だけ世代固定を残す等の方式変更は実装 PR 内で発明せず、PR を止めて
本 PLAN の契約改訂へ戻る (§PR スコープ規律 2)。

Agent tool (`.claude/agents` frontmatter / Agent 呼び出しの `model` 引数) は `opus` / `sonnet` / `haiku` alias を
受理する。`fable` を frontmatter に持つ agent は存在しないため Agent 経路に `fable` は流れない。

### D6. tier-router 不変条件

`src/task/tier-router-policy.ts:12-19`: `TIER_TABLE` = T0 {claude: opus, codex: sol} / T1 {sonnet, luna} /
T2 {haiku, spark}、`FRONTIER_MODELS = Set(Object.values(TIER_TABLE.T0))`。`resolveModel` (`:41-48`) の「worker role は
T0 に解決しない」は tier ラベルで判定しており model 値に依存しないため alias 化で不変。追加で確認すべき不変条件:

- T0 / T1 / T2 の Claude 値が alias 化後も互いに異なる (`opus` / `sonnet` / `haiku`) — worker が frontier model に
  解決しないことの値レベルの担保。
- `FRONTIER_MODELS.has` は exact 比較。alias 化後は `opus` のみを含み `claude-opus-5` は含まない。src 内の
  `.has` 利用は無く (`tests/tier-router.test.ts:86` / `:95` のみ)、router 自身が返す値は alias なので破れない。
  明示 ID を frontier 判定に使う新規コードを書く場合は D3 の正規化を通すこと (本 PLAN では追加しない)。
- ladder の escalate 先が正規化後も frontier と一致する: Sonnet → `MODEL_IDS.claude.opus` (= `TIER_TABLE.T0.claude`)、
  Opus / Fable → `MODEL_IDS.codex.frontier` (= `TIER_TABLE.T0.codex`)。

### 残存リスク (受容)

- token telemetry は transcript の `message.model` (解決後 id) を記録し、`pricingKeyFor` の prefix 規則で既存単価に
  一致する。新世代 (例 Sonnet 5.5) の単価が異なる場合は旧単価で計上される — 価格表は非スコープのため別 issue。
- alias は Claude Code 側のリリースで解決先が変わるため、同じ PLAN / review_evidence でも時期により実モデルが異なる。
  review_evidence には解決後の実 ID を記録する運用 (既存) で再現性を担保する。
- `src/memory/curation-ledger.ts:22-25` の Claude frontier verifier は世代固定のまま残る (棚卸し参照、別 issue)。

## テスト設計

### 既存 oracle の分類

live 値を assert しており追随が必要:

- `tests/team-model-policy.test.ts:701-703` U-ROUTE2-012: `base(MODEL_IDS.claude.sonnet)` を `high` へ、タイトルを
  「opus/terra=middle, sonnet/luna/spark/mini=high」へ。
- `tests/team-model-policy.test.ts` 「keeps explicit Claude engine family …pmo-sonnet」: reasoning_effort `middle`→`high`、
  コメント更新。
- `tests/team-model-policy.test.ts` U-ROUTE2-013 (`:740-748` 付近): sonnet のコメント「middle → high → opus middle」を
  「high → opus middle」へ (assert は不変で成立)。
- `tests/team-run.test.ts:514`: `expect(qa?.model_selection.model).toBe("claude-opus-5")` は live な router 出力の
  literal なので `MODEL_IDS.claude.opus` 参照へ。

symbol 参照で無改変 green (frontmatter / mirror / SSoT の同時更新が前提):

- `tests/model-id-ssot-drift.test.ts` (a)(b)(c)(e)(f)、`tests/setup.test.ts:471-491`、`tests/setup-agent-floor.test.ts`、
  `tests/tier-router.test.ts`、`tests/delegation-routing.test.ts`、`tests/team-model-policy.test.ts` の
  `MODEL_IDS.claude.*` 参照群、`tests/team-run.test.ts:148` / `:152` / `:557`。
- `tests/setup.test.ts:491` の旧世代拒否正規表現 (`claude-opus-4-7|claude-sonnet-4-6|20251001`) は alias で当然成立。

歴史的 fixture / 明示 ID の通過を assert しており変更しない:

- `tests/agent-guard.test.ts:42` / `:45` (`normalizeModelFamily` が世代付き ID を解決すること。alias 化後も必要な性質)。
- `tests/team-model-policy.test.ts:261` (旧世代 sonnet / haiku を advisor より下位と判定)。
- `tests/cli-surface.test.ts:655-677` (明示 `--model claude-opus-5` が argv へ素通しされること)。
- `tests/live-review-projection.test.ts:49`、`tests/provider-judgment-composition.test.ts` / `tests/provider-judgment.test.ts` /
  `tests/review-receipt-supersession.test.ts` / `tests/review-verdict-custody.test.ts` の attestation / verdict の
  `model` (記録済み reviewer model の fixture)。
- `tests/github-forward-store.test.ts:62`、`tests/github-repository-bindings.test.ts`、
  `tests/release-promotion-rollback-gate.test.ts`、`tests/review-evidence.test.ts:41` の worker/reviewer model fixture。
- `tests/asset-catalog.test.ts:274`、`tests/token-tracker.test.ts:382` (外部入力 / 価格表 fixture)。
- `tests/advisor*.test.ts` は Claude 世代付き literal を持たない (実測 grep 0 件)。

### 新規 oracle (実装 PR で追加、本 head では未実装)

| ID | oracle | 検出する mutation |
|---|---|---|
| CANDIDATE-U-SONALIAS-001 | `.claude/agents` の全 20 本の `model:` が `opus` / `sonnet` / `haiku` のいずれか (世代 suffix `/-\d/` を含まない)、Sonnet 9 本は `effort: high`、Opus / Haiku agent の effort は現行値 | いずれか 1 本の frontmatter を世代付き ID に戻す / Sonnet agent の effort を medium に戻す |
| CANDIDATE-U-SONALIAS-002 | `MODEL_IDS.claude` の 4 値がそれぞれ family 名と等しく (`{fable:"fable", opus:"opus", sonnet:"sonnet", haiku:"haiku"}`)、`CLAUDE_MODEL_FAMILY_CATALOG` と等価で、いずれも `/-\d/` を含まない | 任意 1 family を世代付き ID に戻す / catalog 側だけ戻す |
| CANDIDATE-U-SONALIAS-003 | `MODEL_EFFORT_LADDER[sonnet]` が base=high・shallow 未定義・escalate=opus/middle、escalateShallowResponse(sonnet, high) → opus/middle、(sonnet, middle) → null。Fable (low/middle/Sol low) と Opus (middle/high/Sol low) のエントリは不変 | Sonnet に shallow=xhigh を足す / base を middle に戻す / Opus・Fable エントリを変える |
| CANDIDATE-U-SONALIAS-004 | `normalizeModelFamily` が 4 alias をそれぞれの family に解決し、agent-guard が `model: opus` の agent に対する sonnet 要求と `model: sonnet` の agent に対する haiku 要求を downgrade で拒否 | catalog 値と family の対応を入れ替える / floor 判定が alias を unknown に倒す |
| CANDIDATE-U-SONALIAS-005 | `checkCrossAgentModelPair` が `("sonnet"/"opus"/"haiku"/"fable", MODEL_IDS.codex.frontier)` で ok・workerProvider=claude、`("sonnet", MODEL_IDS.claude.opus)` が same_provider、`modelProviderFromId("fable") === "claude"`、`modelOverrideSchema.parse("fable")` が成功 | `modelProviderFromId` / `modelOverrideSchema` から `fable` を外す (D4) |
| CANDIDATE-U-SONALIAS-006 | 生成 adapter テンプレートの Sonnet effort 記述が high、Opus は middle のまま、Claude model 表記が alias | templates.ts の Sonnet effort を middle に戻す / Opus を high にする |
| CANDIDATE-U-SONALIAS-007 | 各 family で alias / 世代付き ID / 解決後 ID (例 `sonnet` / `claude-sonnet-5` / `claude-sonnet-5-5`、`opus` / `claude-opus-5` / `claude-opus-5-5`、`fable` / `claude-fable-5`、`haiku` / `claude-haiku-4-5-20251001`) が、intent=implementation・difficulty=simple・明示 model の `selectTeamModel` reasoning_effort、`escalateShallowResponse` の次段 (effort と escalate 先)、`advisorHeavyUseRecommended` の結果、`resolveDelegationRouting` (review role・明示 model) の ladder effort で alias と同じ値になる。shallow 段の返り値 model は入力 ID のまま。Codex ID (`gpt-5.6-sol` / `gpt-5.6-terra` / `gpt-5.6-luna` / spark / mini) の結果は正規化導入前と同一 | 正規化関数を 4 lookup のいずれか 1 箇所で外す (その箇所の世代付き ID が Red) / 正規化が Codex ID を書き換える / 複数一致を正規化する |
| CANDIDATE-U-SONALIAS-008 | tier-router 不変条件: `TIER_TABLE` の Claude 値 T0/T1/T2 が互いに異なり、`FRONTIER_MODELS` に `MODEL_IDS.claude.opus` と `MODEL_IDS.codex.frontier` が含まれ T1/T2 値を含まない。全 worker role × 全 difficulty で `resolveModel` の結果が FRONTIER_MODELS に含まれない。ladder の escalate 先 (Sonnet → opus、Opus/Fable → Sol) が T0 値と一致する | T1 Claude 値を opus に変える / Sonnet の escalate 先を sonnet 自身や haiku に変える |
| CANDIDATE-U-SONALIAS-009 | `ut-tdd claude --role reviewer --dry-run` と advisor の Claude route の argv が `--model opus` / `--model fable` を含む (alias が素通しされる)。加えて実装 PR は D5 の CLI probe 記録 (4 alias、CLI version 付き) を PR 本文と review_evidence に持つ (unit test では外部 CLI を叩かないため evidence で担保) | argv 組み立てで alias を世代付き ID へ再展開する / probe 記録なしで confirm する |

## 実装順序 (serial)

1. (serial) 本 PLAN の pair-freeze: 非著者 frontier (Codex Sol) で cross-review。
2. (serial) 実装 PR 1 本 (スコープ 1〜8)。D5 の CLI probe を実装前に取得し、`fable` 拒否時は契約改訂へ戻る。
   generates の成果物宣言と confirm は同 PR で行う。

## 受入条件

- AC-1: Claude 全 family (Fable / Opus / Sonnet / Haiku) の live な指定箇所 (MODEL_IDS.claude、guard catalog、
  agent frontmatter 20 本とその mirror、adapter テンプレート、共通ルール文) が alias で、世代固定が残らない。
  歴史的記録・provenance verifier は棚卸しの分類どおり残す (CANDIDATE-U-SONALIAS-001/002/006)。
- AC-2: Sonnet 既定 effort が high (frontmatter / ラダー / 共通ルール文 / adapter テンプレート)。Opus は middle、
  Fable は low、Haiku は現行既定のまま。いずれの family も alias / 世代付き / 解決後のどの ID でも effort・rank・
  escalate が同じ (CANDIDATE-U-SONALIAS-001/003/006/007)。
- AC-3: model-id-ssot-drift / model-id-doc-drift / rule-drift / agent-guard / setup / tier-router / delegation-routing 系
  テストが green。alias `fable` が provider 判定・team schema で受理される (CANDIDATE-U-SONALIAS-004/005/008)。
- AC-4: token-tracker 価格表は無変更。
- AC-5: GPT/Codex 系 ID (`MODEL_IDS.codex.*` の値、ラダー・rank の Codex エントリ、共通ルール文の `gpt-*` 表記) は
  無変更 (CANDIDATE-U-SONALIAS-007 の Codex 側 assert と diff で確認)。
- AC-6: 実装 PR が 4 alias の Claude CLI 受理 probe を記録している (CANDIDATE-U-SONALIAS-009)。

## 改訂履歴

- rev 1: 初回起票。
- rev 2: 非著者レビュー r1 の FLAG (D3 の「ラダー外も high」が `policyEffort` の実装と矛盾) を是正。D3 を Sonnet family id の正規化に改め、scope 1・AC-2 に反映、CANDIDATE-U-SONALIAS-007 を追加。
- rev 3: PO 指示 (2026-09-29) で対象を Claude 全 family に拡大 (GPT 系は対象外、別 issue)。棚卸し節を新設し
  (live / 歴史的記録 / 非スコープ、`src/memory/curation-ledger.ts` を provenance verifier と分類)、D3 を全 Claude
  family の正規化と 4 lookup 箇所の列挙に一般化、D4 (`fable` alias の provider 判定・team schema 受理)、
  D5 (CLI argv への alias 流入と probe 義務)、D6 (tier-router 不変条件) を追加。CANDIDATE-U-SONALIAS-001/002/007 を
  一般化し 008 / 009 を追加、AC-1/AC-2 を更新、AC-5 (Codex ID 不変) / AC-6 (CLI probe) を追加。
