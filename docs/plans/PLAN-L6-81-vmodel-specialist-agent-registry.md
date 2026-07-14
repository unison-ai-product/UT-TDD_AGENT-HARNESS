---
plan_id: PLAN-L6-81-vmodel-specialist-agent-registry
title: "PLAN-L6-81 (add-design): V モデル専門エージェント registry — layer × drive × task-kind 行列と context pack 注入"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-14
updated: 2026-07-14
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - registry schema / 生成 adapter / drift gate の契約"
  - role: qa
    slot_label: "QA - blind-review 隊の context 遮断と帰責判定の検証設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-81-vmodel-specialist-agent-registry.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/plans/PLAN-L7-430-task-kind-model-routing-v2.md
    - docs/plans/PLAN-L6-53-adversarial-review-mechanism.md
    - docs/plans/PLAN-L7-302-context-tiering.md
    - docs/plans/PLAN-L7-426-codex-native-subagents.md
    - src/skill-engine/
    - src/team/model-policy.ts
    - .claude/agents/blind-reviewer.md
---

# PLAN-L6-81 (add-design): V モデル専門エージェント registry

## 0. 位置づけ / PO 指示 (2026-07-14 チャット)

PLAN-L7-430 で確定した標準割当 (task-kind × model × effort ladder) を「エージェントの
中身に書く」のではなく **HARNESS 所有の registry 側パラメータ**へ昇格し、V モデルに沿った
タスク分解 / コンテキスト注入管理で専門エージェント化する。Claude Code 標準
(`.claude/agents`) にも Codex 標準にも依存せず、**HARNESS が agent 定義の単一正本を持ち、
両 runtime へは生成 (射影) する** (PO 方針 2026-07-14)。

既存 PLAN との関係 (重複起票せず改修で対応):

- PLAN-L6-53 (敵対検証機構): blind-review の判定規約はそちらが正本。本 PLAN は
  「blind-review **隊** を registry 上の第一級 agent 種として定義し、context 遮断を
  registry の機械属性にする」拡張のみ担う。
- PLAN-L7-302 (context tiering): 常時必読 context の動的ロード化はそちらが正本。本 PLAN の
  context pack は 302 の tier 機構を「agent 単位のスコープ」として消費する側。
- PLAN-L7-426 (Codex native subagents): `.codex/agents` 生成 adapter はそちらの実装を
  registry からの射影に付け替える (生成元が手書き `.claude/agents` → registry へ変わる)。

## 1. registry 行列 (単一正本)

agent 定義 = **layer × drive × task-kind** の行列 1 行。格納は `.ut-tdd/agents/*.yaml`。

| 属性 | 内容 | 正本 |
|---|---|---|
| layer | V モデル層 (L4-L8 等)。担当成果物の層 | 本 registry |
| drive | 専門職 (5 種 taxonomy)。PLAN frontmatter の drive と同語彙 | 既存 drive taxonomy |
| task_kind | test / implementation / design / docs / research / review / uiux (L7-430 の intent 語彙) | model-policy TASK_INTENTS |
| model / effort | 標準割当 + effort ladder から**参照** (直書き禁止) | MODEL_IDS / MODEL_EFFORT_LADDER |
| context_pack | 注入する context のスコープ宣言 (下記 §2) | 本 registry + L7-302 tier |
| skills | 注入する skill の allowlist (skill-engine 連動、下記 §3) | skills/ + skill-engine |
| generates / forbidden_paths | 出せる成果物種と触れない領域 (pair 制約の機械強制) | 本 registry |
| blind | context 遮断属性 (下記 §4)。true の agent には作成側文脈を渡さない | 本 registry |

生成 (射影): `ut-tdd agents sync` が `.claude/agents/*.md` と `.codex/agents` (L7-426) を
registry から生成。doctor に drift gate (生成物 ≠ registry 由来で fail-close) を追加。

## 2. context pack (コンテキストを「持たせない」管理)

- 層スコープ注入: L6 agent には function-spec + 対象 contract のみ、L7 テスト実装者には
  凍結済み test-design + 対象モジュール契約のみ。governance 全文は注入しない。
- 不変条件: **層が下がるほど注入 context は小さくなる**。下位帯モデル (spark high /
  mini xhigh) は context 純度と effort で能力を補う (L7-430 ladder の設計意図)。
- 実装は PLAN-L7-302 の tier 機構を agent スコープの selector として使う。

## 3. skill 連動 (PO 指示)

- registry の `skills` 属性が skill-engine (`ut-tdd skill suggest` / injection) と連動し、
  agent 起動時に該当 skill だけを注入する (bulk-load 禁止の既存原則を agent 単位で機械化)。
- skill 側 frontmatter に `applicable_agents` (または layer/drive セレクタ) を追加し、
  推薦は双方向 (agent→skill allowlist、skill→agent セレクタ) の交差で決める。

## 4. blind-review 隊 (context 遮断の第一級化、PO 強調)

- **純粋にコンテキストを持たせない** review 専任 agent 群を registry 上の種として定義する:
  作成者の主張・意図・自己評価・チャット文脈を一切注入せず、成果物 + 凍結 spec + 実走
  テストだけを渡す (L6-53 の claim-blind / spec-blind 2 lane 規約を継承)。
- **テスト実装者と実装者を分ける** (Terra=テスト実装 / Luna=実装、L7-430 で既に席が分離)。
  作成系 3 役 (設計者 / テスト実装者 / 実装者) が独立していると、blind review の red/green
  パターンから**帰責が機械的に切り分けられる**:
  - 設計 blind (spec-blind) が FLAG → 設計が悪い
  - 凍結テストが実装で red かつテスト blind が PASS → 実装が悪い
  - テスト blind が FLAG (バグ版で red にならない等の oracle 不全) → テストが悪い
- 帰責判定は gate_runs / findings へ記録し、モデル入替判定 (L7-430 追補 3:
  トークン × 単価 × クリティカル発見数) の材料にする。

## 5. タスク分解との接続

- PLAN schedule step 単位で `(layer, drive, kind)` → registry 参照 → 専門 agent 起動
  (tier-router へ食わせる)。pair 制約 (design↔test-design) は `generates` 宣言で機械強制。
- 「浅い」時は `escalateShallowResponse`、想定未満 orchestrator は
  `advisorHeavyUseRecommended` で advisor 多用 (L7-430 の制御弁をそのまま使う)。
- ゲート対応: pair-freeze=設計レビュー / trace-freeze=実装レビュー / accept=ブラインド
  レビュー (REVIEW_LANES、非作成側 provider)。

## 6. 「読ませる」ではなく機械強制 (PO 指摘 2026-07-14: 指示しないとオーケストレーションしない)

document-first + machine enforcement の原則どおり、標準割当は読解依存にしない:

1. **自動ロード層**: CLAUDE.md / AGENTS.md の routing 節 (L7-430 で更新済み) は両 runtime が
   セッション開始時に必ず読み込む。rule-drift gate で両者の乖離を fail-close。
2. **wrapper 層 (既に機械強制)**: `ut-tdd team run` / `codex` / `claude` 委譲は
   `selectTeamModel` + effort ladder をコードで解決する。読んだかどうかに依存しない。
3. **guard 層 (本 PLAN で拡張)**: agent-guard (PreToolUse hook) を registry 参照へ拡張し、
   生の Agent 呼び出しでも task-kind に対する**想定外の model/effort 指定を fail-close**する
   (現行の model floor 検査の上位互換)。orchestrator が routing を「忘れて」いても通らない。
4. **SessionStart digest 層**: session start hook の digest に「現セッションの orchestrator
   model と標準期待 (`STANDARD_ORCHESTRATION_EXPECTATION`) の比較 + advisor 多用推奨」を
   1 行 surface する (下回りの自覚を毎セッション自動注入)。

## 7. 実装契約 (L7 へ渡す確定設計、2026-07-14 設計確定)

### 7.1 registry schema (`.ut-tdd/agents/<agent-id>.yaml`)

```yaml
agent_id: l7-test-implementer        # kebab-case、ファイル名と一致 (unique)
layer: L7                            # L0-L14
drive: agent                         # 既存 drive taxonomy (5 種) の値のみ
task_kind: test                      # model-policy TASK_INTENTS の値のみ
runtime: both                        # claude | codex | both — 射影先
purpose: "凍結 test-design から red テストを実装する"
prompt: |                            # runtime 中立の system prompt 本文
  ...
context_pack:                        # 注入スコープ宣言 (L7-302 tier selector)
  include:
    - docs/test-design/harness/L7-unit-test-design.md#<対象節>
    - "target_module_contracts"      # 動的 selector (実装時に解決)
  exclude_defaults: true             # governance 全文等の既定除外
skills: [test]                       # skills/ の skill 名 allowlist
blind: false                         # true = 作成側文脈の注入禁止 (blind-review 隊)
generates: [tests/]                  # 出せる成果物 prefix
forbidden_paths: [src/, docs/design/]
max_turns: 20
```

- **model / effort は書かない** (禁止 field)。射影時に `selectTeamModel` +
  `MODEL_EFFORT_LADDER` が task_kind から解決する。lint で直書きを fail-close。
- schema 検証は zod (`src/schema/agent-registry.ts` 新設)。unknown field は error。

### 7.2 生成 (射影) contract — `ut-tdd agents sync`

- 入力: `.ut-tdd/agents/*.yaml` 全件。出力: `.claude/agents/<id>.md` (frontmatter =
  name/description/tools/model/effort/memory/maxTurns + prompt 本文) と `.codex/agents`
  (PLAN-L7-426 の生成経路へ接続)。
- 生成物先頭に `<!-- generated from .ut-tdd/agents/<id>.yaml — DO NOT EDIT -->` marker。
- `--check` モード: 生成せず drift 検出のみ (CI/doctor 用)。doctor gate
  `agent-registry-drift` は marker 欠落 / 内容不一致 / registry に無い生成物残留で
  fail-close。手書き agent の暫定共存は `legacy_agent_allowlist` (縮小専用) で管理し、
  移行完了で空にする。

### 7.3 guard 拡張 contract (agent-guard)

- 入力 stdin の `subagent_type` を registry の `agent_id` へ解決し、(a) model が
  task_kind の標準割当 family を下回る場合 block (現行 floor 検査の上位互換)、
  (b) `blind: true` の agent への prompt に作成側文脈 marker (`author_claims` 等の
  packet field) が含まれる場合 block。
- registry 不在 agent は従来 allowlist へ fallback (移行期)、allowlist にも無ければ
  従来どおり block。

### 7.4 SessionStart digest 追記 contract

- digest 末尾に 1 行: `orchestration: model=<current> phase=<inferred> expected=<expected>
  advisor_heavy_use=<bool>` (`STANDARD_ORCHESTRATION_EXPECTATION` /
  `advisorHeavyUseRecommended` を使用)。

### 7.5 L7 oracle 一覧 (test design へ同期する骨子、U-AGREG-001..)

| ID | oracle |
|---|---|
| U-AGREG-001 | schema: 正例 yaml が parse され、unknown field / model 直書きが reject |
| U-AGREG-002 | sync: yaml→claude md 生成が決定的 (同一入力→同一出力、marker 付与) |
| U-AGREG-003 | drift: 生成物の手編集 / registry 外残留 / marker 欠落で doctor fail-close |
| U-AGREG-004 | guard: task_kind 標準割当を下回る model 指定の Agent 呼び出しが block |
| U-AGREG-005 | blind: blind=true agent への author_claims 注入が block (負例) |
| U-AGREG-006 | 帰責: (設計blind FLAG / 凍結テスト red+テストblind PASS / テストblind FLAG) の 3 パターンが findings に帰責ラベル付きで記録される |
| U-AGREG-007 | skill 連動: agent の skills allowlist と skill セレクタの交差のみ注入される |
| U-AGREG-008 | 移行: legacy_agent_allowlist が縮小専用 (追加で lint fail) |

### 7.6 実装分割 (Codex への委譲単位)

1. **L7-431 (add-impl + REVERSE pair)**: schema + sync + drift gate (U-AGREG-001..003, 008)
2. **L7-432 (add-impl + REVERSE pair)**: guard 拡張 + SessionStart digest (U-AGREG-004..005 + digest)
3. **L7-433 (add-impl + REVERSE pair)**: blind 隊 packet / 帰責記録 / skill 連動 (U-AGREG-006..007、L6-53 の判定規約と接続)
4. **L7-435 (add-impl + REVERSE pair)**: 検証パターン軸 + 招集型検証チーム (§8、U-AGREG-009..011)
5. 既存 32 agent (.claude/agents 20 + global 12) の registry 移行は 1 の後に機械変換 + 個別レビューで実施。

## 8. 検証パターン軸と招集型検証チーム (muster、PO 追補 2026-07-14)

### 8.1 検証パターン語彙 (第一級 ID)

registry に検証パターンのタグ軸を追加する。語彙は固定 enum (追加は本 PLAN 改訂で行う):

| pattern_id | 内容 | 既存実体 |
|---|---|---|
| regression | テスト実走 + evidence (digest/receipt) | Vitest U-* oracle / harness-check |
| negative | 負例・mutation fail-close 証明 | detector 負例、mutation survivor 0 |
| spec-trace | spec(SSoT) と成果物の trace 突合 | pair_artifact / descent / plan lint |
| blind | claim-blind / spec-blind 判定 | blind-reviewer、§4 blind 隊 |
| adversarial | 反証専任攻撃 | advisor adversarial mode |
| cross-family | 別プロバイダ/モデル族レビュー | hybrid cross-review |
| multi-lens | レンズ別並行検証 (correctness/security/perf/a11y)、critical 発見数評価 | L7-430 追補 3 の入替基準 |
| panel | N 案独立生成→採点→合成 | judge panel 型 workflow |
| fault-attribution | 帰責分離 (設計/テスト/実装) | §4 帰責 3 分類 |

### 8.2 task_kind → 招集の 2 段引き

招集は **task_kind → パターン集合 → パターン担当可能 agent** の 2 段引きとし、
task_kind→agent の直引きは禁止 (パターン/agent の追加が routing 変更なしで効くように)。

標準プリセット (`MUSTER_PRESETS`、model-policy 同様コード正本):

| task_kind | 招集パターン |
|---|---|
| design | spec-trace + adversarial + panel |
| implementation | regression + negative + blind + cross-family |
| test | negative + fault-attribution + blind(spec-blind) |
| docs | spec-trace + 軽量 lint (readability) |
| uiux | multi-lens (a11y/style/visual) |
| research | multi-lens + completeness critic |
| security/infra 接触 | multi-lens(security) + regression (実走 evidence 必須) |

### 8.3 registry / 実装への反映

- schema (§7.1) に `verify_patterns: [regression, ...]` field を追加 (その agent が
  **担当できる**検証パターンの宣言。enum 外は reject)。
- 招集エントリポイント: `ut-tdd verify muster --target <pr|plan|gate> ...` が
  (a) 変更対象から task_kind/layer を解決、(b) MUSTER_PRESETS でパターン集合を引き、
  (c) registry の verify_patterns 交差で member を選抜して team definition を合成する。
  hybrid では blind/cross-family lane を非作成側 provider に割当 (§5 のゲート対応と同一原則)。
- 判定集約は PASS / PASS-WEAK / FLAG を review_evidence + findings に記録し、
  pattern_id をモデル入替判定 (トークン × 単価 × critical 発見数) の集計キーにする。
- 実装 slice: **L7-435 (add-impl + REVERSE pair)** — MUSTER_PRESETS + `verify muster` +
  team definition 合成 (U-AGREG-009..011)。L7-431 (schema) が先行依存。

### 8.4 追加 oracle

| ID | oracle |
|---|---|
| U-AGREG-009 | schema: verify_patterns の enum 外値が reject される |
| U-AGREG-010 | muster: task_kind→preset→agent 交差の選抜が決定的で、直引き経路が存在しない |
| U-AGREG-011 | muster: hybrid で blind/cross-family lane が作成側 provider へ割り当てられない (負例) |

## AC (L7 実装 PLAN へ引き継ぐ受入条件の骨子)

- [ ] registry schema (layer/drive/task_kind/context_pack/skills/blind/generates) が
      schema 検証つきで定義され、`ut-tdd agents sync` の生成物と drift gate がテストで
      固定されている。
- [ ] model/effort が registry に直書きされず MODEL_IDS / MODEL_EFFORT_LADDER 参照である
      ことが lint で fail-close する。
- [ ] blind=true agent の起動経路で作成側文脈が注入されないことが負例テストで固定されている。
- [ ] skill 連動 (agent→skill allowlist 交差) が skill-engine テストで固定されている。
- [ ] 帰責 3 分類 (設計/テスト/実装) の判定パターンが L7 test design に oracle として
      同期されている。
- [ ] agent-guard が registry の task-kind 割当に反する model/effort 指定を fail-close する
      (負例テストで固定)。SessionStart digest に orchestrator model と標準期待の比較が
      surface される。
- [ ] 検証パターン軸 (§8): verify_patterns enum 検証、muster 2 段引きの決定性、
      hybrid での非作成側 lane 割当が負例つきで固定されている (U-AGREG-009..011)。
