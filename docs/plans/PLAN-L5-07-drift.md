---
plan_id: PLAN-L5-07-drift
title: "PLAN-L5-07 (design/drift): L5 隧ｳ邏ｰ險ｭ險・窶・蜀・Κ雉・肇 drift lint (asset-drift rule) 縺ｮ module 邨仙粋邊貞ｺｦ back-fill (FR-L1-49)"
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
    scope: "L5 asset-drift freeze. Rule registration, fail-close, and placeholder dependency contracts are paired to L8 IT-ASSET-06..07 with GWT-level coverage."
created: 2026-06-01
updated: 2026-06-08
owner: PM (Opus) / PO (莠ｺ髢・
agent_slots:
  - role: tl
    slot_label: "TL 窶・asset-drift rule 縺ｮ IMP-033 rule engine 邨仙粋 (module 逋ｻ骭ｲ譁ｹ蠑・ 縺ｮ繝ｬ繝薙Η繝ｼ (蛻･ runtime)"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
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
    - docs/governance/gate-design.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
  references:
    - docs/plans/PLAN-L4-13-drift-lint.md
    - docs/adr/ADR-002-dependency-direction-and-auto-map.md
    - docs/migration/internal-asset-inventory.md
related_adr: docs/adr/ADR-004-internal-asset-ts-control-boundary.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-07 (design/drift): L5 蜀・Κ雉・肇 drift lint module 邨仙粋邊貞ｺｦ back-fill

## ﾂｧ0 PLAN

L4-13 (drift-lint縲：R-L1-49) 縺ｮ L5 隧ｳ邏ｰ蛹悶・*per-requirement PLAN** ([[feedback-plan-per-requirement]])縲・4=system 竊・譛ｬ PLAN L5=module 邨仙粋邊貞ｺｦ (竍猫8) 竊・L6=蛻､螳夐未謨ｰ莉墓ｧ・(竍猫7)縲・*譁ｰ隕・lint module 繧呈焔譖ｸ縺阪○縺・IMP-033 cross-check rule engine 縺ｮ rule 蝙・`asset-drift` 繧､繝ｳ繧ｹ繧ｿ繝ｳ繧ｹ**縺ｨ縺励※螳溽樟 (architecture ﾂｧ4.1)縲よ・譫懃黄 = module-decomposition 蠅怜・ 竍・L8 繝壹い縲・
## ﾂｧ1 逶ｮ逧・
L4 architecture ﾂｧ4.1 縺ｮ `asset-drift` rule 繧・**module 邨仙粋邊貞ｺｦ**縺ｸ隧ｳ邏ｰ蛹・ 竭 rule engine (gate-design ﾂｧ5 rule registry) 縺ｸ縺ｮ `asset-drift` 逋ｻ骭ｲ譁ｹ蠑・(module 邨仙粋)縲≫贈 doc registry 縺・`.claude/agents/*.md` / `docs/skills/` 繧・scan 縺・auto-enroll 縺吶ｋ邨仙粋縲≫造 fail-close 邨瑚ｷｯ (doctor/gate exit) 縺ｮ邨仙粋縲≫促 DB 譛ｪ蜈・ｶｳ讀懃衍 (placeholder_deps) 縺ｨ縺ｮ邨ｱ蜷医ょ推讀懈渊鬆・岼縺ｮ蛻､螳夐未謨ｰ (HELIX 繝代せ讀懷・ / allowlist 辣ｧ蜷・/ regex) 縺ｯ L6 carry縲・
## ﾂｧ2 閭梧勹

- 荳頑ｵ・ architecture ﾂｧ4.1 (asset-drift = IMP-033 rule 蝙・ / gate-design ﾂｧ5 rule registry (`asset-drift` 逋ｻ骭ｲ貂医、-86) / ﾂｧ7 L7 carry
- 譌｢蟄・dependency-drift (ADR-002/IMP-032) 縺ｨ荳ｦ鄂ｮ (荳｡譁ｹ IMP-033 rule)
- 讀懈渊鬆・岼 (inventory ﾂｧ1): HELIX 邨ｶ蟇ｾ繝代せ谿句ｭ・/ `helix codex` 逶ｴ蜿ｩ縺・/ `docs/skills/` 遨ｺ / roster竊波uard allowlist 謨ｴ蜷・- 蠅・阜: ADR-004 (drift lint = 螻､2 逡ｪ莠ｺ縲［arkdown 豁｣譛ｬ縺ｫ HELIX 蜑肴署縺梧ｮ九ｉ縺ｪ縺・° fail-close)

## §3 工程表 (Step + 進捗)

### Step 1: [直列] asset-drift rule 結合定義
直列理由: downstream_dependency
module-decomposition と gate-design rule registry に asset-drift rule の module 結合を定義する。

### Step 2: [直列] doc registry auto-enroll 定義
直列理由: downstream_dependency
Step 1 の rule 境界を前提に、.claude/agents/*.md と docs/skills/ の scan / auto-enroll 対象を定義する。

### Step 3: [直列] fail-close / placeholder_deps 統合
直列理由: downstream_dependency
Step 1/2 の検査対象を doctor / gate exit と DB 未充足検知 placeholder_deps に接続する。

### Step 4: [直列] 検査項目 trace の確定
直列理由: downstream_dependency
Step 1-3 の rule 実行経路に、HELIX path residue、command residue、docs/skills vacancy、roster allowlist の検査項目を割り当てる。

### Step 5: [直列] 依存方向の物理保証
直列理由: downstream_dependency
Step 1-4 の rule / registry / fail-close 境界を import graph へ反映し、rule が engine に従属する構造を確認する。

### Step 6: [直列] L8 IT-ASSET pair 接続
直列理由: downstream_dependency
Step 1-5 の asset-drift 契約を L8 IT-ASSET の Given/When/Then と placeholder_deps へ接続する。

### Step 7: [直列] L6/L7 carry の確定
直列理由: downstream_dependency
Step 1-6 の rule 境界を L6 rule signature / regex / allowlist と L7 rule engine implementation へ引き継ぐ。

### Step 8: [直列] review
直列理由: downstream_dependency
self / pmo-sonnet / codex-tl review で、asset-drift rule 境界、placeholder_deps、L8 IT-ASSET の対称性を確認する。

## §3.1 実装計画

- 情報源: docs/design/harness/L5-detailed-design/module-decomposition.md / docs/design/harness/L5-detailed-design/physical-data.md / docs/test-design/harness/L8-integration-test-design.md
- L5 では asset-drift rule の module 結合と placeholder_deps 統合を freeze し、runtime 実装は行わない。
- L6 で rule signature / regex / allowlist を仕様化し、L7 で rule engine に実装する。
- G5 freeze は Step 8 review と L8 IT-ASSET の Given/When/Then 粒度確認後に行う。
## ﾂｧ4 蜿怜・譚｡莉ｶ / DoD

- [x] module-decomposition ﾂｧ4 縺ｫ `asset-drift` rule 繧・IMP-033 rule 蝙九→縺励※邨仙粋險倩ｿｰ (譁ｰ隕・lint 謇区嶌縺阪○縺・
- [x] auto-enroll (doc registry scan) + fail-close 邨瑚ｷｯ (doctor/gate) 縺ｮ邨仙粋
- [x] 讀懈渊鬆・岼 4 遞ｮ繧・inventory ﾂｧ1 / ADR-004 縺ｨ trace
- [x] DB 譛ｪ蜈・ｶｳ讀懃衍 (placeholder_deps) 邨ｱ蜷・- [x] dependency-drift (ADR-002) 縺ｨ荳ｦ鄂ｮ (荳｡譁ｹ IMP-033縲∽ｺ碁㍾螳夂ｾｩ縺ｪ縺・
- [x] L8 IT-ASSET (drift) 繝壹い + 譛ｪ遒ｺ螳・placeholder_deps + 萓晏ｭ俶・遉ｺ
- [x] 蛻､螳夐未謨ｰ signature/regex 繧・L6 carry (waiting_layer:L6) / engine 螳溯｣・・ L7
- [x] ﾂｧ6 逕ｨ隱樊峩譁ｰ / ﾂｧ7 讖溯・隕∵ｱよ峩譁ｰ
- [x] self-review 騾夐℃ (G5 蜀・freeze 蜑阪↓蜀榊ｮ滓命)

## ﾂｧ5 髢｢騾｣ PLAN / ADR / docs

- 髢｢騾｣ PLAN: 隕ｪ = PLAN-L5-00-master / L4 = PLAN-L4-13-drift-lint / 蜈・ｼ・= PLAN-L5-05-roster / PLAN-L5-06-skill / 蠕檎ｶ・= PLAN-L6-NN-drift (蛻､螳夐未謨ｰ莉墓ｧ・
- 髢｢騾｣ ADR: ADR-004 (蠅・阜逡ｪ莠ｺ) / ADR-002 (dependency-drift 荳ｦ鄂ｮ)
- 蜿ら・: architecture ﾂｧ4.1 / gate-design ﾂｧ5 / inventory ﾂｧ1

## ﾂｧ6 逕ｨ隱樊峩譁ｰ (living glossary delta)

| 逕ｨ隱・| 遞ｮ蛻･ | 螳夂ｾｩ / 螟画峩轤ｹ | L0 ﾂｧ10 back-merge |
|---|---|---|---|
| asset-drift | 蜿ら・ | IMP-033 rule 蝙・(蜀・Κ雉・肇 .md 縺ｮ HELIX 蜑肴署繝ｻroster竊波uard 荵夜屬讀懷・)縲Ｅependency-drift 縺ｨ荳ｦ鄂ｮ | back-merge 荳崎ｦ・|

## ﾂｧ7 讖溯・隕∵ｱよ峩譁ｰ (FR registry delta)

> **讖溯・隕∵ｱよ峩譁ｰ縺ｪ縺・*縲・R-L1-49 (L1 襍ｷ逾ｨ貂・ 縺ｮ module 邨仙粋隧ｳ邏ｰ蛹悶・R-L1-49 竊・L5 險ｭ險郁ｦ∫ｴ 竊・L8 IT-ASSET 縺ｮ trace 繧呈磁邯壹・
