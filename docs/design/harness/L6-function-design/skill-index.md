---
layer: L6
sub_doc: skill-index
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l1_functional: docs/design/harness/L1-requirements/functional-requirements.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-37-skill-index-category.md
implemented_by: docs/plans/PLAN-L7-211-skill-index-category-materialization.md
---

# skill 索引モデル

本書は `skill.v1` メタデータをどの軸で検出、推薦、生成するかを定義する L6 機能設計である。
対象実装は `src/lint/skill-assignment.ts`、`src/assets/catalog.ts`、`src/skill-scoring/scoring.ts`、`src/skill-engine/recommend.ts`、`src/skill-engine/scaffold.ts`、`src/schema/harness-db-tables-core.ts` とする。

開発 repo では既存互換のため `docs/skills/` を読み続けられる。一方、配布用 Pack repo では利用者が直接見る開発 OS の部品として root `skills/` を標準配置とする。実装は `skills/` が存在する場合にこれを優先し、存在しない場合だけ `docs/skills/` に fallback する。

> **L6 契約マーカー**: `analyzeSkillAssignments`、`scoreSkill`、`scoreSkillDetailed`、`scanSkillCatalog`、`catalogAutomationAssets`、`scaffoldSkill` は unit-test 粒度の契約である。DoD の pre/post/invariant は `docs/test-design/harness/L7-unit-test-design.md` §1.24 `U-SKILL-IDX-001..011` と §1.24a `U-SKILL-NEW-001..003` に対応する。

## 1. 索引キー

skill は次の 3 軸のいずれかで検索可能でなければならない。

| 軸 | frontmatter | 主な対象 |
|---|---|---|
| L 層 | `applies_to.layers` | workflow skill |
| 駆動モデル | `applies_to.drive_models` | workflow skill |
| メタデータ | `category`, `domain_tags`, `industry`, `triggers` | domain / project skill |

不変条件:

```text
indexable(skill) =
  nonEmpty(applies_to.layers)
  OR nonEmpty(applies_to.drive_models)
  OR category in {domain, project}
```

`workflow` skill は L 層または駆動モデルを持つ。`domain` / `project` skill は L 層と駆動モデルが空でも、`category` とメタデータで検索可能にする。どの軸でも検索できない skill は `not-indexable` として fail-close する。

## 2. frontmatter 契約

標準 frontmatter:

```yaml
schema_version: skill.v1
name: <slug>
skill_type: <string>
category: workflow | domain | project
applies_to:
  layers: [L0..L14]
  drive_models: [Forward, Reverse, Recovery, Scrum, Discovery, Refactor, Retrofit, Add-feature, Research]
domain_tags: [writing, testing]
industry: <string>
triggers: <string>
```

必須項目は `name` と `skill_type` である。`category` は任意だが、L 層と駆動モデルが空の場合は `domain` または `project` が必要である。

## 3. 契約関数

単体テスト粒度の signature:

```text
analyzeSkillAssignments(input: SkillAssignmentDoc[]) => SkillAssignmentResult
scoreSkill(ctx: SkillRecommendationContext, asset: AutomationAsset, options?: SkillScoreOptions) => number
scoreSkillDetailed(ctx: SkillRecommendationContext, asset: AutomationAsset, options?: SkillScoreOptions) => SkillScoreDetails
scanSkillCatalog(root: string) => SkillCatalogEntry[]
catalogAutomationAssets(input: AssetCatalogInput) => AutomationAsset[]
scaffoldSkill(input: SkillScaffoldInput, deps: SkillScaffoldDeps) => SkillScaffoldResult
```

| 関数 | 入力 | 出力 | 不変条件 | oracle |
|---|---|---|---|---|
| `analyzeSkillAssignments` | skill file path と frontmatter metadata | `SkillAssignmentResult` | `docs.length > 0` かつ violation 0 のときだけ `ok=true`。未知 L 層、未知駆動、未知 category、索引不能 skill を違反にする。 | U-SKILL-IDX-001..005 |
| `scoreSkill` / `scoreSkillDetailed` | task context と catalog asset と任意の runtime learning signal | 0..1 の決定的 score / matched token / learning adjustment / exclusion reason | L 層/駆動一致だけで飽和させず、metadata overlap と runtime-provenance learning で同点退避する。同一入力は同一出力を返す。CLI 推奨と DB projection は同じ scoring 実装を使う。 | U-SKILL-IDX-006..007,009..011 |
| `scanSkillCatalog` | `skills/**/*.md` または `docs/skills/**/*.md` | skill catalog entries | skill 本文を保存せず、path、id、routing metadata、検索 token、drift finding だけを返す。 | U-SKILL-IDX-008 |
| `catalogAutomationAssets` | enrolled asset docs | `automation_assets` projection | `category` と `domain_tags` を projection と検索 token に反映する。 | U-SKILL-IDX-008 |
| `scaffoldSkill` | skill 生成入力と既存 path set | 生成予定 path、content、finding | 上書きしない。生成後 frontmatter は `analyzeSkillAssignments` で indexable である。 | U-SKILL-NEW-001..003 |

## 4. 推薦スコア

`scoreSkill(ctx, asset)` は次の比重で推薦値を並べる。

```text
score = 0.15
if ctx.layer matches asset.applies_layers: score += 0.30
if ctx.workflowMode matches asset.applies_drive_models: score += 0.30
score += metadataOverlap(ctx, asset) capped at 0.20
if quality/review/test keyword matches: score += 0.05
if category in {domain, project} and metadata overlaps: score += 0.10
score += learningAdjustment(runtime-provenance skill_evaluations only)
return min(1, round2(score))
```

`metadataOverlap` は `kind`、`drive`、`workflowMode`、理由記述、`skill_type`、`category`、`domain_tags`、`triggers` の token 重なりを数える。これにより L 層と駆動モデルだけで top-5 が同点になる状態を避ける。

`learningAdjustment` は runtime 実発火に由来する `skill_evaluations` だけを入力にする。`skill_invocations.source LIKE "runtime-hook:%"` から作った adoption/success/unused signal は加点・減点へ反映してよいが、`auto-projection:*` の間接推定行を学習実績として扱ってはいけない。これは projection 再構築の副作用で推薦が自己増幅することを防ぐための fail-close 境界である。

`scoreSkillDetailed` は推薦理由のために `matchedTokens`、`learningAdjustment`、`excluded`、`exclusionReason` を返す。CLI `skill suggest` の reason は少なくとも `skill=<skill_id>`、matched token、learning 状態を含め、候補ごとに同一文言へ潰してはいけない。DB projection (`projectSkillTelemetry`) は同じ scorer を呼ぶ。2 重実装で CLI と DB rebuild の順位が乖離する状態は不変条件違反である。

`skill-map*` と全 L 層×全駆動の review/checklist 系 wildcard 資産は、workflow skill と同じ関連度 scoring 候補に入れない。`skills/review-checklist.yaml` のような gate checklist SSoT は人間または gate 評価のためのデータ資産であり、任意 PLAN の `required` skill 候補として常時浮上させない。

## 5. 配布境界

`workflow` と `domain` は harness が配布する製品 skill として扱う。Pack repo では root `skills/` に同梱する。`project` は利用側 project 固有の拡張であり、`ut-tdd skill new --category project` は利用側 root の `.ut-tdd/skills/` を出力先とする。これにより開発 OS の標準 skill と consumer 固有 skill を分離する。

`ut-tdd skill new` の product skill 出力先は既定で `skills/` とする。既存開発 repo で `docs/skills/` を使う必要がある場合は、実装上の依存注入で `productSkillRoot` を上書きできる。

## 6. テスト対応

本設計は `docs/test-design/harness/L7-unit-test-design.md` の `U-SKILL-IDX-*` と `U-SKILL-NEW-*` で検証する。

- `tests/skill-assignment.test.ts`
- `tests/skill-recommend.test.ts`
- `tests/asset-catalog.test.ts`
- `tests/skill-scaffold.test.ts`

## 7. 配布 repo の skill 配置

配布用 Pack repo では root `skills/` を標準 skill root とする。`scanSkillCatalog`、`catalogAutomationAssets`、`loadSkillAssignmentDocs` は `skills/` が存在する場合にこれを標準 root とし、存在しない場合だけ `docs/skills/` に fallback する。clean export / package では、source 側に旧互換の `docs/skills/*` しか存在しない場合でも、配布 artifact path は `skills/*` へ正規化して出力する。

この配置は「docs は説明、skills は実行時に推薦・注入される部品」という見え方を守るための配布境界である。root `skills/` と `docs/skills/` を同時に必須にはしない。重複登録を避けるため、実際の scan は片方の root だけを選ぶ。

配布 adapter の `.claude/agents/*.md` は、roster の配布物であると同時に `agent-guard`
の実 hook 発火で検証される runtime asset として扱う。各 subagent template は `model:`
frontmatter を必ず持つ。`pmo-haiku` / `pmo-project-scout` / `refactor-scout` は haiku
family、`pdm-*` は opus family、それ以外の同梱 subagent は sonnet family とする。
filesystem template と built-in fallback は同一の model metadata を出力し、model ID は
`src/team/model-policy.ts` の `MODEL_IDS` を SSoT とする。runtime `.claude/agents/*.md`、
`docs/templates/adapter/**` の disk mirror、built-in fallback の drift は L7 unit test
(`tests/setup.test.ts` U-SETUP-009a / `tests/model-id-ssot-drift.test.ts` U-MODELID-SSOT)
で固定する。

## 8. relation graph 投影

root `skills/` は配布物と consumer-facing runtime asset の正規 root であるため、relation graph の design-like node として投影する。`src/graph/loader.ts` は `skills/**/*.md` を走査し、`skills/SKILL_MAP.md` の変更が `missing-projection` に落ちないことを `tests/relation-graph-loader.test.ts` の real-repo fence で確認する。
