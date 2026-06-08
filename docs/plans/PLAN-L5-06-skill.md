---
plan_id: PLAN-L5-06-skill
title: "PLAN-L5-06 (design/skill): L5 隧ｳ邏ｰ險ｭ險・窶・skill catalog/recommender/injector 縺ｮ module 邨仙粋邊貞ｺｦ back-fill (FR-L1-47)"
kind: design
layer: L5
sub_doc: module-decomposition
drive: fullstack
status: confirmed
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "L5 skill module freeze. Catalog/recommender/injector module contracts are paired to L8 IT-ASSET-04..05 with GWT-level coverage."
created: 2026-06-01
updated: 2026-06-08
owner: PM (Opus) / PO (莠ｺ髢・
agent_slots:
  - role: tl
    slot_label: "TL 窶・skills module 蜀・Κ蛻・牡 (catalog/recommender/injector) 縺ｮ邨仙粋蠅・阜繝ｬ繝薙Η繝ｼ (蛻･ runtime)"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
skip_sub_doc: []
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
dependencies:
  parent: docs/plans/PLAN-L5-00-master.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
  references:
    - docs/plans/PLAN-L4-12-skill-pack.md
    - docs/migration/internal-asset-inventory.md
related_adr: docs/adr/ADR-004-internal-asset-ts-control-boundary.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-06 (design/skill): L5 skill module 邨仙粋邊貞ｺｦ back-fill

## ﾂｧ0 PLAN

L4-12 (skill-pack縲：R-L1-47) 縺ｮ L5 隧ｳ邏ｰ蛹悶・*per-requirement PLAN** ([[feedback-plan-per-requirement]])縲・4=system 竊・譛ｬ PLAN L5=module 邨仙粋邊貞ｺｦ (竍猫8) 竊・L6=髢｢謨ｰ莉墓ｧ・(竍猫7)縲よ・譫懃黄 = module-decomposition (+ skill 豕ｨ蜈･謫堺ｽ懊・ internal-processing) 蠅怜・ 竍・L8 繝壹い縲・
## ﾂｧ1 逶ｮ逧・
L4 architecture ﾂｧ3.1 skills building block 繧・**module 邨仙粋邊貞ｺｦ**縺ｸ隧ｳ邏ｰ蛹・ 竭 `skills` module 縺ｮ蜀・Κ蛻・牡 (catalog 讒狗ｯ・/ recommender / injector 縺ｮ 3 蜀・Κ雋ｬ蜍・縲≫贈 `docs/skills/**/*.md` (螻､1) 竊・豕ｨ蜈･繧ｻ繝・ヨ (螻､2) 縺ｮ邨仙粋 IF縲≫造 skill 豕ｨ蜈･/謗ｨ謖吶・ D-API 謫堺ｽ・(internal-processing)縲Ｓecommender 繧ｹ繧ｳ繧｢繝ｻinjector 縺ｮ L 蛻･豕ｨ蜈･繧ｻ繝・ヨ縺ｯ L6 carry縲・
## ﾂｧ2 閭梧勹

- 荳頑ｵ・ architecture ﾂｧ3.1 skills building block (`loadCatalog()`/`recommendSkill()`/`injectByLayer()`縲∽ｾ晏ｭ・schema/fs)
- 蠅・阜: ADR-004 (螻､1 skill 譛ｬ譁・markdown 豁｣譛ｬ / 螻､2 catalog-injector TS)
- data 謨ｴ蜷・(A-90): skill catalog = in-memory scan-on-demand縲∵ｰｸ邯・state 縺ｪ縺・(physical-data 蠅怜・荳崎ｦ・
- 譌｢蟄・L5 (A-88 隱ｿ譟ｻ): module-decomposition ﾂｧ1/ﾂｧ5 縺ｫ skill stub 譌｢蜃ｺ 竊・蜀・Κ蛻・牡繧貞・菴灘喧
- 騾｣謳ｺ: FR-L1-12 (L 蜊倅ｽ・skill 豕ｨ蜈･) / FR-L1-37 (model 謗ｨ謖・

## §3 工程表 (Step + 進捗)

### Step 1: [直列] skill module 内部分割の確定
直列理由: downstream_dependency
module-decomposition の skill stub を catalog / recommender / injector の内部責務へ分割する。

### Step 2: [直列] 層1/層2 結合境界の確定
直列理由: downstream_dependency
Step 1 の責務を前提に、docs/skills markdown と catalog-injector TypeScript の結合 IF を定義する。

### Step 3: [直列] skill 推挙/注入 D-API / DbC の確定
直列理由: downstream_dependency
Step 1/2 の境界を internal-processing の recommend / inject 操作と pre/post/invariant へ接続する。

### Step 4: [直列] 依存方向の物理保証
直列理由: downstream_dependency
Step 1-3 の module 境界を import graph へ反映し、skills -> schema/fs の一方向依存として確認する。

### Step 5: [直列] L8 IT-ASSET pair 接続
直列理由: downstream_dependency
Step 1-4 の skill 契約を L8 IT-ASSET の Given/When/Then と placeholder_deps へ接続する。

### Step 6: [直列] L6/L7 carry の確定
直列理由: downstream_dependency
Step 1-5 の module / D-API 境界を L6 recommender scoring / injector signature と L7 implementation へ引き継ぐ。

### Step 7: [直列] review
直列理由: downstream_dependency
self / pmo-sonnet / codex-tl review で、skill module 境界、placeholder_deps、L8 IT-ASSET の対称性を確認する。

## §3.1 実装計画

- 情報源: docs/design/harness/L5-detailed-design/module-decomposition.md / docs/design/harness/L5-detailed-design/internal-processing.md / docs/test-design/harness/L8-integration-test-design.md
- L5 では skill module と skill 推挙/注入 D-API の設計を freeze し、runtime 実装は行わない。
- L6 で recommender scoring / injector signature を仕様化し、L7 で catalog / recommender / injector を実装する。
- G5 freeze は Step 7 review と L8 IT-ASSET の Given/When/Then 粒度確認後に行う。
## ﾂｧ4 蜿怜・譚｡莉ｶ / DoD

- [x] module-decomposition 縺ｮ skill stub 繧貞・驛ｨ蛻・牡蜈ｷ菴灘喧 (catalog/recommender/injector縲∽ｾ晏ｭ・schema/fs 荳譁ｹ蜷・
- [x] 螻､1/螻､2 邨仙粋蠅・阜 (ADR-004) + curate 蛹ｺ蛻・婿驥・(繧｢繝ｫ繧ｴ繝ｪ繧ｺ繝縺ｯ L6 carry)
- [x] internal-processing 縺ｫ skill 謗ｨ謖・豕ｨ蜈･ D-API + DbC
- [x] L8 IT-ASSET (skill) 繝壹い + 譛ｪ遒ｺ螳・placeholder_deps + 萓晏ｭ俶・遉ｺ
- [x] recommender/injector 縺ｮ髢｢謨ｰ莉墓ｧ倥ｒ L6 carry (waiting_layer:L6) / curate 螳御ｺ・・ L7 (螳溯｣・憾諷玖ｧ｣豸亥梛)
- [x] L4 architecture ﾂｧ3.1 縺ｨ縺ｮ 1:1 謨ｴ蜷・(莠碁㍾螳夂ｾｩ縺ｪ縺・
- [x] ﾂｧ6 逕ｨ隱樊峩譁ｰ / ﾂｧ7 讖溯・隕∵ｱよ峩譁ｰ
- [x] self-review 騾夐℃ (G5 蜀・freeze 蜑阪↓蜀榊ｮ滓命)

## ﾂｧ5 髢｢騾｣ PLAN / ADR / docs

- 髢｢騾｣ PLAN: 隕ｪ = PLAN-L5-00-master / L4 = PLAN-L4-12-skill-pack / 蜈・ｼ・= PLAN-L5-05-roster / PLAN-L5-07-drift / 蠕檎ｶ・= PLAN-L6-NN-skill (髢｢謨ｰ莉墓ｧ・
- 髢｢騾｣ ADR: ADR-004 / ADR-002 (萓晏ｭ俶婿蜷・
- 蜿ら・: architecture ﾂｧ3.1 / internal-asset-inventory ﾂｧ2 / FR-L1-12/37

## ﾂｧ6 逕ｨ隱樊峩譁ｰ (living glossary delta)

| 逕ｨ隱・| 遞ｮ蛻･ | 螳夂ｾｩ / 螟画峩轤ｹ | L0 ﾂｧ10 back-merge |
|---|---|---|---|
| skill catalog / injector | 蜿ら・ | 蜀・Κ雉・肇 skill 縺ｮ registry/豕ｨ蜈･讖滓ｧ・(螻､2 TS)縲・DR-004 逕ｱ譚･縺ｮ螳溯｣・畑隱・| back-merge 荳崎ｦ・|

## ﾂｧ7 讖溯・隕∵ｱよ峩譁ｰ (FR registry delta)

> **讖溯・隕∵ｱよ峩譁ｰ縺ｪ縺・*縲・R-L1-47 (L1 襍ｷ逾ｨ貂・ 縺ｮ module 邨仙粋隧ｳ邏ｰ蛹悶・R-L1-47 竊・L5 險ｭ險郁ｦ∫ｴ 竊・L8 IT-ASSET 縺ｮ trace 繧呈磁邯壹・
