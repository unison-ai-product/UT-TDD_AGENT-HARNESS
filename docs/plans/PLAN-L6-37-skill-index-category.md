---
plan_id: PLAN-L6-37-skill-index-category
title: "PLAN-L6-37 (add-design): skill 索引モデルの機能設計 — 索引キー = L + 駆動モデル + メタデータ、L/駆動が共に空のときだけ category(domain/project) 付与、recommender の score 飽和を de-saturate (DISCOVERY-03 §6 / L5-06 §6 の L6 carry discharge、FR-L1-47/FR-L1-12 拡張)"
kind: add-design
layer: L6
drive: agent
status: confirmed
created: 2026-06-30
updated: 2026-07-01
owner: PM (Opus) / PO (human)
agent_slots:
  - role: tl
    slot_label: "TL — 索引キー (L+駆動+メタデータ) と category fallback 規約 / indexable-by-something fail-close / de-saturate スコア再設計 / 配布境界 (workflow+domain 同梱・project 利用側 author) / 既存 skill-assignment・catalog・recommend との非重複境界のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/skill-index.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
implemented_by: docs/plans/PLAN-L7-211-skill-index-category-materialization.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - PLAN-L5-06-skill
    - PLAN-DISCOVERY-03-skill-design
  references:
    - docs/plans/PLAN-L4-12-skill-pack.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/adr/ADR-005-distribution-model-and-central-ui.md
review_evidence:
  - reviewer: Codex
    review_kind: intra_runtime_subagent
    reviewed_at: 2026-07-01T18:12:00+09:00
    verdict: pass
    scope: "PLAN-L6-37 local close: skill-index design, U-SKILL-IDX/U-SKILL-NEW test design, category/indexable/de-saturate distribution boundary"
    tests_green_at: 2026-07-01T18:12:00+09:00
    green_commands:
      - kind: unit_test
        command: bun run vitest run tests/skill-assignment.test.ts tests/skill-recommend.test.ts tests/asset-catalog.test.ts tests/skill-scaffold.test.ts --reporter=dot
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-01T18:10:58+09:00
        evidence_path: tests/skill-assignment.test.ts
        output_digest: "sha256:3b60f7070da1e86ff814669c0be470fa55c5816122d6c67e73e1db361dd3e7e6"
        anchor_commit: da9049e6d1ad0dd1c8d7a7332ead45339e4c9dc9
      - kind: unit_test
        command: bun run vitest run tests/skill-assignment.test.ts tests/skill-recommend.test.ts tests/asset-catalog.test.ts tests/skill-scaffold.test.ts --reporter=dot
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-01T18:10:58+09:00
        evidence_path: tests/skill-recommend.test.ts
        output_digest: "sha256:d81427f0e99ca96135340712542b7a28d8ef370aaf47fa71033b6d16ff221a76"
        anchor_commit: e468ece632d7fd29c4dd3dbef301c2b38e847082
      - kind: unit_test
        command: bun run vitest run tests/skill-assignment.test.ts tests/skill-recommend.test.ts tests/asset-catalog.test.ts tests/skill-scaffold.test.ts --reporter=dot
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-01T18:10:58+09:00
        evidence_path: tests/asset-catalog.test.ts
        output_digest: "sha256:79fc89eec778b9e6c5d317efc8752cb2eef7e5052df7fe179965415a105bf7b4"
        anchor_commit: da5bd2811dee2708d0d3ca8105baff5893f2b618
      - kind: unit_test
        command: bun run vitest run tests/skill-assignment.test.ts tests/skill-recommend.test.ts tests/asset-catalog.test.ts tests/skill-scaffold.test.ts --reporter=dot
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: 2026-07-01T18:10:58+09:00
        evidence_path: tests/skill-scaffold.test.ts
        output_digest: "sha256:c357ebd21caa8f164ea9415f364d13caa032fb25acc2fed9c0a25f0abe35e439"
        anchor_commit: e468ece632d7fd29c4dd3dbef301c2b38e847082
      - kind: typecheck
        command: bun run typecheck
        runner: bun
        scope: full
        exit_code: 0
        completed_at: 2026-07-01T18:11:04+09:00
        evidence_path: docs/design/harness/L6-function-design/skill-index.md
        output_digest: "sha256:99f20045a262862f3f9756694cbe755819af9334668a6afe0cf2e9b43d10e18f"
        anchor_commit: e468ece632d7fd29c4dd3dbef301c2b38e847082
      - kind: lint
        command: bun run lint
        runner: bun
        scope: full
        exit_code: 0
        completed_at: 2026-07-01T18:11:02+09:00
        evidence_path: docs/test-design/harness/L7-unit-test-design.md
        output_digest: "sha256:6bbdfc8c25eb4ad7a213b55ff4eea645847840623e4799b771b27373a908bfdb"
        anchor_commit: b3904eca7a50e185da4aeb1fa4177f0b3b64e271
---

# PLAN-L6-37 (add-design): skill 索引モデルの機能設計

## §0 位置づけ

[[PLAN-DISCOVERY-03-skill-design]] の S3 live 検証 (2026-06-22) が、本 PLAN が解く問題を既に**実測・記録済**である:
recommender のスコアが **layer + drive_model の 2 軸**しか持たないため top-5 が score=1 に飽和し、層弁別が効かず
不適 skill (lint gate に browser-testing/api 等) が上位混入する。その carry が「**category タグ + 工程(layer/gate)
タグで de-saturate するのが正しい改良方向**」(DISCOVERY-03 §6 / [[PLAN-L5-06-skill]] §6、`waiting_layer:L6`) として
登録されている。本 add-design はこの **登録済 L6 carry の discharge** であり、net-new スコープではない。

加えて現状の skill 索引は **workflow/駆動モデル一色**で、PO 指摘 (2026-06-30) の「シチュエーションで引く
**ドメインスキル** (ライティング / 技術ドメイン) / **プロジェクトスキル** (業界慣例)」を構造的に表現できない。
根拠 = コードが証言している:

- [src/lint/skill-assignment.ts](../../src/lint/skill-assignment.ts) が `applies_to.drive_models` を**全 skill 必須**にしており
  (`missing-drive-models` fail-close)、駆動モデルに紐づかない skill はそもそも登録できない (=強制 workflow 化)。
- [src/skill-engine/recommend.ts](../../src/skill-engine/recommend.ts) `scoreSkill` は layer 一致 +0.35 / drive 一致 +0.35 が支配的で、
  メタデータ (trigger/role/capability) 軸の寄与が弱い。
- 既存 `skill_type` 値は process/orchestration/design-contract/verification/review/testing/drive-reverse… の
  **全部ワークフロー系**で、domain/project の区分が無い。

## §1 ロックした索引ルール (PO 確定 2026-06-30)

> **索引キー = L + 駆動モデル + メタデータ。**
> **L も駆動モデルも無い skill だけ `category` を付与し、category + メタデータで索引する。**

これを機能設計に落とす:

1. **L/駆動の任意化**: `applies_to.layers` / `applies_to.drive_models` を**任意**にする。workflow skill は従来どおり両方
   を持ち L+駆動で索引される (現行スコア維持)。
2. **category fallback**: `applies_to.layers` と `applies_to.drive_models` が**両方空のときだけ `category` 必須**。
   `category ∈ {domain, project}` (workflow は L/駆動を持つので category は暗黙 = 省略可)。空欄 skill は
   category + メタデータ (trigger / domain_tags / industry) で索引する。
3. **indexable-by-something の fail-close**: lint を「`drive_models` 必須」から
   「**L+駆動 か category のどちらかで必ず索引可能**」へ反転する。これにより**強制 workflow 化をやめつつ、
   どこからも引けない無索引 skill (死蔵) は依然 fail-close で落とす** ([[project_descent_absence_blindness]] の
   「不在 fail-close = 落とさない仕組み」と一致)。
4. **de-saturate**: scoreSkill に「L/駆動が空なら category + メタデータ (domain_tags/trigger keyword) で採点する」分岐を
   加え、score=1 飽和と同点アルファベット順退化を解消する (DISCOVERY-03 §5 実測限界の是正)。

## §2 配布境界 (ADR-005 / 公開・非公開境界と整合)

3 カテゴリは配布境界に綺麗に効く ([[project_harness_distribution_public_private_boundary]]):

- **workflow (駆動モデル強化) + domain (ライティング/技術ドメイン)** = 汎用 → **harness 同梱の製品 skill** (`docs/skills/`)。
- **project (業界慣例)** = 案件固有 → **harness には同梱せず、利用側プロジェクトが author する拡張ポイント**
  (利用側の `.ut-tdd/` or プロジェクト側 skills root)。

→ project skill は `docs/skills/` (本リポの dogfood 製品 skill) の登録対象ではない、という**置き場の分界**を設計に明記する。

## §工程表 (Step)

### Step 1: [直列] 機能設計 doc 起草 (skill-index.md)
直列理由 = **file_conflict** (skill-index.md を新規作成)。
`docs/design/harness/L6-function-design/skill-index.md` に以下を純関数仕様 + DbC + pseudocode で記述:
- **skill.v1 frontmatter schema の正本化** (現状 design 未記載 = lint コードに暗黙。これを設計へ昇格): 必須/任意
  フィールド、`applies_to.{layers,drive_models}` 任意化、`category`/`domain_tags`/`industry` の追加。
- **索引キーの定義** (L + 駆動 + メタデータ) と **category fallback 条件** (L/駆動が共に空 → category 必須)。
- **`analyzeSkillAssignments` の判定反転** (drive_models 必須 → indexable-by-something fail-close) の純関数仕様。
- **`scoreSkill` の de-saturate 分岐** (L/駆動空時の category+メタデータ採点) の関数仕様。
- **catalog (`scanSkillCatalog`/automation_assets) の `category` 列追加** と FTS トークン合流の IF。
- 配布境界 (§2) の設計根拠。
- 既存 `skill-assignment` / `catalog` / `recommend` との**非重複境界**を明記 (二重定義なし)。

### Step 2: [直列] L7-unit テスト設計 (③ ペア) 追記
直列理由 = **downstream_dependency** (Step 1 の関数仕様に対応する U-ID を起こす)。
`docs/test-design/harness/L7-unit-test-design.md` に U-SKILL-IDX-001〜 を追記:
- domain skill (L/駆動空 + category=domain + domain_tags) が**登録できる** (旧 lint なら missing-drive-models で落ちたもの)。
- 無索引 skill (L/駆動空 + category 無) が **fail-close で落ちる** (indexable-by-something)。
- de-saturate: 同一工程で score が飽和せず弁別される回帰観点 (DISCOVERY-03 §5 の score=1 退化を surface)。
- workflow skill の既存スコア (L+駆動) が**不変**である回帰観点 (非破壊保証)。
- U-SKILL-IDX は本サイクルでは Red 骨格 (`it.todo`) = forward-citation のみ (oracle-test-trace green)。実アサーション化は
  L7 add-impl の出口条件。

### Step 3: [直列] FR back-fill 接続
直列理由 = **downstream_dependency**。
FR-L1-47 (skill pack curate) / FR-L1-12 (L 単位 skill 注入) を**拡張**として接続する (**新 FR 採番しない**、
L1 functional §7 の「既存 FR 拡張」方針に従う = [[PLAN-L6-35-descent-obligation]] と同型)。category/索引キーの descent を
FR → L6 設計要素 → L7 U-ID の trace で結ぶ。

### Step 4: [直列] review
直列理由 = **downstream_dependency**。
Step 1〜3 を self / code-reviewer (claude-only のため intra_runtime_subagent) で 5 軸レビュー。

## §3 スコープ境界 (本 PLAN 外 = 後続 add-impl)

本 PLAN のスコープは **機能設計 (L6) + ③ テスト設計 (L6↔L7 V-pair) まで**。以下は**後続 add-impl PLAN** (実装):
- `src/lint/skill-assignment.ts` の判定反転 (indexable-by-something)。
- `src/assets/catalog.ts` の `category` 列追加 + search トークン合流 + schema (automation_assets) 変更。
- `src/skill-engine/recommend.ts` `scoreSkill` の de-saturate 分岐実装 + vitest。
- `docs/skills/*.md` 既存 pack の category 付与 (workflow は省略可、domain 候補に付与)。
- **skill creator / scaffolder** (`ut-tdd skill new`: 規約準拠の雛形生成 + SKILL_MAP 追記 + lint 自走) は索引モデル確定後の
  別 add-feature。本 PLAN ではスコープ外として記録する (順序 = 索引モデル → creator)。

## §4 受入条件 / DoD

- [ ] skill-index.md に索引キー (L+駆動+メタデータ) + category fallback + skill.v1 schema 正本化 + de-saturate 関数仕様を記述
- [ ] indexable-by-something fail-close の判定反転を純関数仕様 + DbC で記述 (強制 workflow 化の解消 + 無索引 fail-close 維持)
- [ ] 配布境界 (workflow+domain 同梱 / project 利用側 author) を設計根拠に明記
- [ ] L7-unit テスト設計に U-SKILL-IDX (domain 登録可 / 無索引 fail-close / de-saturate / workflow 不変) を Red 骨格で追記
- [ ] FR-L1-47/FR-L1-12 拡張接続 (新 FR 採番なし) + trace
- [ ] 既存 skill-assignment/catalog/recommend との非重複境界明記 (二重定義なし)
- [ ] §用語更新 (living glossary delta)
- [ ] self / code-reviewer レビュー通過 + lint/typecheck/vitest/doctor green を確定前に確認

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: 親 = PLAN-L6-00-master / 上流 = PLAN-L5-06-skill (L5 module 結合) / 由来 carry = PLAN-DISCOVERY-03-skill-design §6 /
  兄弟 = PLAN-L4-12-skill-pack (L4 system) / 後続 = (別 add-impl) skill 索引 impl + (別 add-feature) skill creator
- 関連 ADR: ADR-004 (層1 markdown 正本 / 層2 TS) / ADR-005 (配布境界) / ADR-002 (依存方向)
- 参照: src/lint/skill-assignment.ts / src/assets/catalog.ts / src/skill-engine/recommend.ts / docs/skills/SKILL_MAP.md

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| skill 索引キー | 新規 | skill を引く軸 = L + 駆動モデル + メタデータ。workflow skill は L+駆動、domain/project skill は category+メタデータで索引 | back-merge 要 (§10 skill 節) |
| skill category | 新規 | L/駆動が共に空の skill に付与する区分 = domain (分野知: ライティング/技術ドメイン) / project (案件固有: 業界慣例)。workflow は L/駆動を持つので暗黙 | back-merge 要 |
| indexable-by-something | 新規 | skill は L+駆動 か category のどちらかで必ず索引可能でなければならない (fail-close)。無索引 skill = 死蔵 = 違反 | back-merge 要 |

## §7 機能要求更新 (FR registry delta)

> **新 FR 採番なし**。FR-L1-47 (skill pack curate) / FR-L1-12 (L 単位 skill 注入) の**索引モデル拡張**として接続する
> (L1 functional §7「既存 FR 拡張、新採番しない」方針)。FR-L1-47/12 → skill-index.md 設計要素 → L7 U-SKILL-IDX の trace を結ぶ。
</content>
</invoke>
