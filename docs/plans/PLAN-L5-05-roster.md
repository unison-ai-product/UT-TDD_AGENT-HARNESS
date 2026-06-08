---
plan_id: PLAN-L5-05-roster
title: "PLAN-L5-05 (design/roster): L5 隧ｳ邏ｰ險ｭ險・窶・subagent roster + command 縺ｮ module 邨仙粋邊貞ｺｦ back-fill (FR-L1-46/48)"
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
    scope: "L5 roster/command freeze. Roster module, guard integration, and command contracts are paired to L8 IT-ASSET-01..03 with GWT-level coverage."
created: 2026-06-01
updated: 2026-06-08
owner: PM (Opus) / PO (莠ｺ髢・
agent_slots:
  - role: tl
    slot_label: "TL 窶・roster module 蜀・Κ蛻・牡 / capability resolver / command D-API 縺ｮ邨仙粋蠅・阜繝ｬ繝薙Η繝ｼ (蛻･ runtime)"
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
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
  references:
    - docs/plans/PLAN-L4-11-roster.md
    - docs/migration/internal-asset-inventory.md
related_adr: docs/adr/ADR-004-internal-asset-ts-control-boundary.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-05 (design/roster): L5 roster + command module 邨仙粋邊貞ｺｦ back-fill

## ﾂｧ0 PLAN

L4-11 (roster+command縲：R-L1-46/48) 縺ｮ L5 隧ｳ邏ｰ蛹悶・*per-requirement PLAN** (PO 遒ｺ螳・2026-06-01縲瑚ｨｭ險域嶌蛹悶′隕√ｋ隕∽ｻｶ縺斐→縺ｫ 1 PLAN縲阪ー[feedback-plan-per-requirement]])縲・4=system 邊貞ｺｦ 竊・譛ｬ PLAN L5=module 邨仙粋邊貞ｺｦ (竍猫8) 竊・L6=髢｢謨ｰ莉墓ｧ・(竍猫7)縲よ・譫懃黄 = module-decomposition + internal-processing 蠅怜・ 竍・L8 邨仙粋繝・せ繝郁ｨｭ險医・繧｢縲・
## ﾂｧ1 逶ｮ逧・
L4 function ﾂｧ1.1 roster building block + ﾂｧ2 CLI 繧・**module 邨仙粋邊貞ｺｦ**縺ｸ隧ｳ邏ｰ蛹・ 竭 `roster` module 譁ｰ險ｭ (蜀・Κ髢｢謨ｰ鄒､/雋ｬ蜍・蜈ｬ髢・IF)縲≫贈 capability class 隗｣豎ｺ縺ｮ module 蜀・・蜑ｲ縲≫造 蜀・Κ雉・肇 command (`ut-tdd roster`/`ut-tdd asset`) 縺ｮ D-API 謫堺ｽ・+ DbC縲≫促 roster竊波uard `runtime 竊・roster` 荳譁ｹ蜷醍ｵ仙粋 (遘ｻ陦梧ｮｵ髫主性繧)縲る未謨ｰ signature 縺ｯ L6 carry縲・
## ﾂｧ2 閭梧勹

- 荳頑ｵ・ function ﾂｧ1.1 (roster building block縲∝ｱ､1/螻､2縲〉oster竊暖uard 荳譁ｹ蜷・ / ﾂｧ2 CLI / architecture ﾂｧ3.1 (roster module縲∽ｾ晏ｭ・schema/fs)
- 蠅・阜: ADR-004 (螻､1 markdown 豁｣譛ｬ / 螻､2 TS)
- data 謨ｴ蜷・(A-90): roster = in-memory scan-on-demand縲∵ｰｸ邯・state 縺ｪ縺・(physical-data 蠅怜・荳崎ｦ√’s 豁｣譛ｬ)
- 譌｢蟄・L5 (A-88 隱ｿ譟ｻ): module-decomposition ﾂｧ1/ﾂｧ5 縺ｫ roster 譛ｪ險倩ｼ・(譁ｰ險ｭ)縲∥gent-guard ﾂｧ2.3 螳溯｣・ｸ亥ｮ悟ｙ

## §3 工程表 (Step + 進捗)

### Step 1: [直列] roster module 責務境界の確定
直列理由: downstream_dependency
module-decomposition の inventory / 責務境界を更新し、roster module の public IF と依存方向を確定する。

### Step 2: [直列] capability class 解決責務の分離
直列理由: downstream_dependency
Step 1 の roster 境界を前提に、capability class load / classify / resolve の責務を module 内部へ割り当てる。

### Step 3: [直列] roster command D-API / DbC の確定
直列理由: downstream_dependency
Step 1/2 の責務を internal-processing の roster list / check / asset 系 D-API と pre/post/invariant へ接続する。

### Step 4: [直列] roster と guard の移行結合定義
直列理由: downstream_dependency
Step 3 の D-API を runtime guard 移行段階へ接続し、循環依存を作らない一方向結合を定義する。

### Step 5: [直列] 依存方向の物理保証
直列理由: downstream_dependency
Step 1-4 の module 境界を import graph へ反映し、roster -> schema/fs の一方向依存として確認する。

### Step 6: [直列] L8 IT-ASSET pair 接続
直列理由: downstream_dependency
Step 1-5 の roster 契約を L8 IT-ASSET の Given/When/Then と placeholder_deps へ接続する。

### Step 7: [直列] L6/L7 carry の確定
直列理由: downstream_dependency
Step 1-6 の module / D-API 境界を L6 subcommand signature と L7 roster implementation へ引き継ぐ。

### Step 8: [直列] review
直列理由: downstream_dependency
self / pmo-sonnet / codex-tl review で、roster module 境界、placeholder_deps、L8 IT-ASSET の対称性を確認する。

## §3.1 実装計画

- 情報源: docs/design/harness/L5-detailed-design/module-decomposition.md / docs/design/harness/L5-detailed-design/internal-processing.md / docs/test-design/harness/L8-integration-test-design.md
- L5 では roster module と command D-API の設計を freeze し、runtime 実装は行わない。
- L6 で subcommand signature / capability resolver を仕様化し、L7 で roster module と guard 分離を実装する。
- G5 freeze は Step 8 review と L8 IT-ASSET の Given/When/Then 粒度確認後に行う。
## ﾂｧ4 蜿怜・譚｡莉ｶ / DoD

> **Discovery 遒ｺ螳・(PLAN-DISCOVERY-02縲・026-06-01)**: 譛ｬ PLAN 縺ｮ險ｭ險亥・螳ｹ縺ｯ roster Discovery (PLAN-DISCOVERY-02縲〔ind=poc) 縺ｧ **險ｭ險遺・莉ｮ螳溯｣・・讀懆ｨｼ竊堤｢ｺ螳・* 繧・1 蜻ｨ縺・`decision_outcome=confirmed`縲ら｢ｺ險ｼ蠎ｦ縲御ｽ弱阪□縺｣縺・capability resolver / roster竊波uard 謨ｴ蜷医′ spike 縺ｧ螳溯ｨｼ謌千ｫ九ら｢ｺ螳夊ｨｭ險・= **ID=filename stem / capability class 竓･ model family / nameMismatch WARN / `roster check` = allowlist 遯∝粋 fail-close**縲よ悽 PLAN 縺ｯ縺昴・遒ｺ螳壹ｒ Forward 縺ｧ L5 險ｭ險域嶌縺ｫ蜿肴丐 (redesign: spike 遐ｴ譽・・譛ｬ螳溯｣・・ L7)縲・
- [x] module-decomposition 縺ｫ `roster` module 譁ｰ險ｭ (ﾂｧ1 inventory + ﾂｧ5 雋ｬ蜍吝｢・阜 + 萓晏ｭ俶婿蜷第ｳｨ險倥∽ｾ晏ｭ・schema/fs 荳譁ｹ蜷・
- [x] capability class 隗｣豎ｺ縺ｮ module 蜀・・蜑ｲ = **capability竓･model** 縺ｧ遒ｺ螳・(FR-L1-37 model 謗ｨ謖吶∈縺ｮ蜈･蜉帙・ C12 螟悶→譏守､ｺ)
- [x] internal-processing 縺ｫ command D-API (`roster list/check`) + DbC pre/post (ﾂｧ1/ﾂｧ2/ﾂｧ3/ﾂｧ4)
- [x] roster竊波uard `runtime 竊・roster` 荳譁ｹ蜷醍ｵ仙粋 + 遘ｻ陦梧ｮｵ髫・placeholder_deps (蠕ｪ迺ｰ縺ｪ縺励《pike 縺ｧ迚ｩ逅・｢ｺ隱・
- [x] L8 IT-ASSET-01縲・3 (roster) 繝壹い + ﾂｧ2 驥城哩縺俶磁邯・- [x] 髢｢謨ｰ signature / resolver 繧｢繝ｫ繧ｴ繝ｪ繧ｺ繝 / parse zod 蛹・/ 繝代せ隗｣豎ｺ繧・L6 carry (waiting_layer:L6)
- [x] L4 function ﾂｧ1.1 / architecture ﾂｧ3.1 縺ｨ縺ｮ 1:1 謨ｴ蜷・(莠碁㍾螳夂ｾｩ縺ｪ縺励《elf-review pmo-sonnet 遒ｺ隱・
- [x] ﾂｧ6 逕ｨ隱樊峩譁ｰ / ﾂｧ7 讖溯・隕∵ｱよ峩譁ｰ (FR delta 縺ｪ縺励：R-L1-46/48 隧ｳ邏ｰ蛹・
- [x] self-review (pmo-sonnet) 騾夐℃ = 謨ｴ蜷域・遶九！mportant 2 (`ut-tdd asset` L6 carry 譏守､ｺ / spike 邨檎ｷｯ蜑企勁) 譏ｯ豁｣貂・(G5 蜀・freeze 蜑阪↓蜀榊ｮ滓命)
- **carry (self-review Minor)**: `ut-tdd asset` (FR-L1-48) D-API 縺ｯ L6 隧ｳ邏ｰ蛹・(`waiting_layer:L6`縲∵悽 PLAN 縺ｯ roster command 繧堤｢ｺ螳壹∥sset 縺ｯ roster 繝代ち繝ｼ繝ｳ蠕瑚ｿｽ縺・ / L8 IT-ASSET-01 縺ｯ L6 譛ｬ襍ｷ逾ｨ縺ｧ縲茎can 蜈ｨ莉ｶ縲阪→縲慶apability竓･model 隗｣豎ｺ縲阪↓蛻・牡

## ﾂｧ5 髢｢騾｣ PLAN / ADR / docs

- 髢｢騾｣ PLAN: 隕ｪ = PLAN-L5-00-master / L4 = PLAN-L4-11-roster / 蜈・ｼ・= PLAN-L5-06-skill / PLAN-L5-07-drift / 蠕檎ｶ・= PLAN-L6-NN-roster (髢｢謨ｰ莉墓ｧ・
- 髢｢騾｣ ADR: ADR-004 / ADR-002 (萓晏ｭ俶婿蜷・
- 蜿ら・: function ﾂｧ1.1/ﾂｧ2 / architecture ﾂｧ3.1 / internal-asset-inventory

## ﾂｧ6 逕ｨ隱樊峩譁ｰ (living glossary delta)

| 逕ｨ隱・| 遞ｮ蛻･ | 螳夂ｾｩ / 螟画峩轤ｹ | L0 ﾂｧ10 back-merge |
|---|---|---|---|
| roster / capability class | 蜿ら・ | 蜀・Κ雉・肇 subagent registry (螻､2 TS) 縺ｨ蛻・｡槭・DR-004 逕ｱ譚･縺ｮ螳溯｣・畑隱・| back-merge 荳崎ｦ・|

## ﾂｧ7 讖溯・隕∵ｱよ峩譁ｰ (FR registry delta)

> **讖溯・隕∵ｱよ峩譁ｰ縺ｪ縺・*縲・R-L1-46/48 (L1 襍ｷ逾ｨ貂・ 縺ｮ module 邨仙粋隧ｳ邏ｰ蛹悶・R-L1-46/48 竊・L5 險ｭ險郁ｦ∫ｴ 竊・L8 IT-ASSET 縺ｮ trace 繧呈磁邯壹・
