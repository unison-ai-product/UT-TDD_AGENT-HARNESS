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
対象実装は `src/lint/skill-assignment.ts`、`src/assets/catalog.ts`、`src/skills/recommend.ts`、`src/skills/scaffold.ts`、`src/schema/harness-db-tables-core.ts` とする。

開発 repo では既存互換のため `docs/skills/` を読み続けられる。一方、配布用 Pack repo では利用者が直接見る開発 OS の部品として root `skills/` を標準配置とする。実装は `skills/` が存在する場合にこれを優先し、存在しない場合だけ `docs/skills/` に fallback する。

> **L6 契約マーカー**: `analyzeSkillAssignments`、`scoreSkill`、`scanSkillCatalog`、`catalogAutomationAssets`、`scaffoldSkill` は unit-test 粒度の契約である。DoD の pre/post/invariant は `docs/test-design/harness/L7-unit-test-design.md` §1.24 `U-SKILL-IDX-001..008` と §1.24a `U-SKILL-NEW-001..003` に対応する。

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
scoreSkill(ctx: SkillRecommendationContext, asset: AutomationAsset) => number
scanSkillCatalog(root: string) => SkillCatalogEntry[]
catalogAutomationAssets(input: AssetCatalogInput) => AutomationAsset[]
scaffoldSkill(input: SkillScaffoldInput, deps: SkillScaffoldDeps) => SkillScaffoldResult
```

| 関数 | 入力 | 出力 | 不変条件 | oracle |
|---|---|---|---|---|
| `analyzeSkillAssignments` | skill file path と frontmatter metadata | `SkillAssignmentResult` | `docs.length > 0` かつ violation 0 のときだけ `ok=true`。未知 L 層、未知駆動、未知 category、索引不能 skill を違反にする。 | U-SKILL-IDX-001..005 |
| `scoreSkill` | task context と catalog asset | 0..1 の決定的 score | L 層/駆動一致だけで飽和させず、metadata overlap で同点退避する。同一入力は同一出力を返す。 | U-SKILL-IDX-006..007 |
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
return min(1, round2(score))
```

`metadataOverlap` は `kind`、`drive`、`workflowMode`、理由記述、`skill_type`、`category`、`domain_tags`、`triggers` の token 重なりを数える。これにより L 層と駆動モデルだけで top-5 が同点になる状態を避ける。

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

配布用 Pack repo では root `skills/` を標準 skill root とする。`scanSkillCatalog`、`catalogAutomationAssets`、`loadSkillAssignmentDocs` は `skills/` が存在する場合にこれを標準 root とし、存在しない場合だけ `docs/skills/` に fallback する。

この配置は「docs は説明、skills は実行時に推薦・注入される部品」という見え方を守るための配布境界である。root `skills/` と `docs/skills/` を同時に必須にはしない。重複登録を避けるため、実際の scan は片方の root だけを選ぶ。
