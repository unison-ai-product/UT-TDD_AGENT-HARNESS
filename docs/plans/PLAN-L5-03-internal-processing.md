---
plan_id: PLAN-L5-03-internal-processing
title: "PLAN-L5-03 (design/internal-processing): L5 隧ｳ邏ｰ險ｭ險・窶・蜀・Κ蜃ｦ逅・/ D-API (蜃ｦ逅・Ο繧ｸ繝・け + DbC pre/post/invariant docstring縲‘dge 5-8)"
kind: design
layer: L5
sub_doc: internal-processing
drive: be
status: confirmed
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "L5 internal-processing freeze. DbC, fail-close, and edge docstring contracts are paired to L8 IT-CONTRACT with GWT-level coverage."
created: 2026-05-29
updated: 2026-06-08
owner: PM (Opus) / PO (莠ｺ髢・
agent_slots:
  - role: tl
    slot_label: "TL 窶・D-API 蜃ｦ逅・Ο繧ｸ繝・け / DbC 螂醍ｴ・・繝ｬ繝薙Η繝ｼ (蛻･ runtime)"
generates:
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
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L4-basic-design/function.md
  references:
    - docs/governance/document-system-map.md
related_adr: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L5-03 (design/internal-processing): L5 蜀・Κ蜃ｦ逅・/ D-API

## ﾂｧ0 PLAN

L5 Master (`PLAN-L5-00-master`) ﾂｧ2 縺ｮ 竭 蠢・・sub-doc縲景nternal-processing縲阪ｒ隧ｳ邏ｰ蛹悶☆繧・design PLAN縲ょ・蜉・= `docs/design/harness/L5-detailed-design/internal-processing.md`縲Ｎodule-decomposition 縺ｮ蜈ｬ髢矩未謨ｰ (D-API) 縺ｫ **蜃ｦ逅・Ο繧ｸ繝・け + Design by Contract (precondition/postcondition/invariant)** 繧剃ｻ倅ｸ弱＠縲！MP-014 (竭｡螳溯｣・・竭｣繝・せ繝・docstring縲‘dge 5-8) 繧貞㍾邨先ｺ門ｙ縺吶ｋ縲・
## ﾂｧ1 逶ｮ逧・
module-decomposition 縺ｮ蜈ｬ髢・IF 繧・**蜃ｦ逅・ｻ墓ｧ・+ DbC 螂醍ｴ・*縺ｸ隧ｳ邏ｰ蛹悶☆繧・ 竭 荳ｻ隕∵桃菴懊・蜃ｦ逅・ヵ繝ｭ繝ｼ (蜈･蜉帶､懆ｨｼ竊貞・逅・・state 譖ｴ譁ｰ竊貞・蜉・縲≫贈 蜷・桃菴懊・ pre/post/invariant (Meyer DbC縲‥ocument-system-map ﾂｧ3)縲≫造 fail-close 繧ｨ繝ｩ繝ｼ繝代ち繝ｼ繝ｳ (exit code + next_action)縲≫促 edge case (G3 carry IMP-014 縺ｮ edge 5-8 = 逡ｰ蟶ｸ/蠅・阜縺ｮ docstring 蠖｢蠑・縲・6 讖溯・險ｭ險・(pseudocode) / L7 螳溯｣・(vitest) 縺ｮ蜈･蜉帙・
## ﾂｧ2 閭梧勹

- 荳頑ｵ・ module-decomposition (蜈ｬ髢・IF) / function.md ﾂｧ2 (CLI 繧ｳ繝槭Φ繝・ ﾂｧ7 (讖溯・髢謎ｾ晏ｭ・
- 讌ｭ逡梧ｨ呎ｺ・ DbC (Meyer) + IEEE 1016 ﾂｧ5 (Design Description) + ISO 29119 (繝・せ繝亥庄閭ｽ螂醍ｴ・
- L5 carry: IMP-014 (竭｡竊披促 docstring edge 5-8 繧・L7 蜈･蜿｣蜑阪↓蜃咲ｵ・= G5 = DbC freeze 轤ｹ縲‥ocument-system-map ﾂｧ3)
- IMP-018: external-if (what) 竊・譛ｬ doc (D-API how) 縺ｮ邊貞ｺｦ蠅・阜 (if-detail 縺ｨ蛻・球)

## §3 工程表 (Step + 進捗)

### Step 1: [直列] D-API 対象操作の棚卸し
直列理由: downstream_dependency
function.md §2 CLI command と module public function から、DbC 記述対象の操作を選定する。

### Step 2: [直列] 操作別処理フローの定義
直列理由: downstream_dependency
Step 1 の対象操作ごとに input -> validation -> state read -> process -> state write -> output / exit code を定義する。

### Step 3: [直列] DbC precondition の定義
直列理由: downstream_dependency
Step 2 の処理フローを前提に、呼び出し前に満たすべき状態・frontmatter・gate 前提を定義する。

### Step 4: [直列] DbC postcondition の定義
直列理由: downstream_dependency
Step 2/3 の処理と入力条件を前提に、state update、evidence、exit code の保証を定義する。

### Step 5: [直列] DbC invariant の定義
直列理由: downstream_dependency
Step 3/4 の契約を横断して、data.md §6 の集約不変条件と操作レベルの不変条件を整合させる。

### Step 6: [直列] fail-close error pattern の定義
直列理由: downstream_dependency
Step 3-5 の契約違反を fail-close 形式へ落とし込み、error reason、next_action、exit code を統一する。

### Step 7: [直列] edge case docstring trace の接続
直列理由: downstream_dependency
Step 3-6 の DbC / fail-close を、IMP-014 edge 5-8 と L8 IT-* の境界ケースへ接続する。

### Step 8: [直列] L6/L7 carry の確定
直列理由: downstream_dependency
Step 1-7 の処理契約を L6 pseudocode / function signature と L7 TypeScript + vitest へ引き継ぐ。

### Step 9: [直列] review
直列理由: downstream_dependency
self / pmo-sonnet / codex-tl review で、DbC 粒度、L8 IT-* 粒度、L6/L7 carry の整合を確認する。

## §3.1 実装計画

- 情報源: docs/design/harness/L5-detailed-design/internal-processing.md / docs/design/harness/L4-basic-design/function.md / docs/test-design/harness/L8-integration-test-design.md
- L5 では internal-processing.md の D-API / DbC 記述を freeze し、runtime 実装は行わない。
- L6 で function signature / pseudocode へ具体化し、L7 で TypeScript 実装と vitest へ落とす。
- G5 freeze は Step 9 review と L8 IT-* の Given/When/Then 粒度確認後に行う。
## ﾂｧ4 蜿怜・譚｡莉ｶ / DoD

- [x] Step 1縲・ 縺ｮ縺吶∋縺ｦ縺・`internal-processing.md` 縺ｫ蟄伜惠
- [x] 荳ｻ隕∵桃菴・(譛菴・8 謫堺ｽ・ 縺ｫ蜃ｦ逅・ヵ繝ｭ繝ｼ + DbC pre/post/invariant 縺悟ｭ伜惠
- [x] fail-close 繧ｨ繝ｩ繝ｼ繝代ち繝ｼ繝ｳ邨ｱ荳蠖｢蠑上′蟄伜惠 (function AC 逡ｰ蟶ｸ邉ｻ縺ｨ謨ｴ蜷・
- [x] edge case docstring 蠖｢蠑・(IMP-014縲‘dge 5-8) 縺檎｢ｺ螳壹＠ G5 freeze 貅門ｙ (L8 隧ｳ邏ｰ邊貞ｺｦ逶｣譟ｻ蠕後↓蜀咲｢ｺ隱・
- [x] DbC 縺・data.md ﾂｧ6 髮・ｴ・ｸ榊､画擅莉ｶ縺ｨ謨ｴ蜷・(莠碁㍾螳夂ｾｩ縺ｧ縺ｪ縺乗桃菴懊Ξ繝吶Ν蜀吝ワ)
- [x] ﾂｧ6 逕ｨ隱樊峩譁ｰ / ﾂｧ7 讖溯・隕∵ｱよ峩譁ｰ 縺悟ｭ伜惠
- [x] frontmatter `kind == design`縲・ｧ0縲慊ｧ7 螳悟ｙ

## ﾂｧ5 髢｢騾｣ PLAN / ADR / docs

- 髢｢騾｣ PLAN: 隕ｪ = PLAN-L5-00-master / 蜑・= module-decomposition / 荳ｦ陦・= if-detail
- 蜿ら・ docs: function.md / module-decomposition.md / document-system-map.md ﾂｧ3 (DbC)

## ﾂｧ6 逕ｨ隱樊峩譁ｰ (living glossary delta)

| 逕ｨ隱・| 遞ｮ蛻･ | 螳夂ｾｩ / 螟画峩轤ｹ | L0 ﾂｧ10 back-merge |
|---|---|---|---|
| Design by Contract (pre/post/invariant) | 蜿ら・ | Meyer 讓呎ｺ冶ｪ・(document-system-map ﾂｧ3 縺ｧ蟆主・貂・縲∫峡閾ｪ螳夂ｾｩ縺帙★蜿ら・ | back-merge 荳崎ｦ・|

> 蜀・Κ蜃ｦ逅・ｨｭ險医・ DbC 讓呎ｺ冶ｪ槭・驕ｩ逕ｨ縲よ眠隕上ラ繝｡繧､繝ｳ逕ｨ隱槭・蟆主・縺励↑縺・・
## ﾂｧ7 讖溯・隕∵ｱよ峩譁ｰ (FR registry delta)

> 迴ｾ譎らせ: **讖溯・隕∵ｱよ峩譁ｰ縺ｪ縺・* (internal-processing 縺ｯ譌｢蟄俶ｩ溯・縺ｮ蜃ｦ逅・ｻ墓ｧ伜喧縲よ眠隕・FR-L1 縺ｯ逕溘∪縺ｪ縺・ｦ玖ｾｼ縺ｿ)縲・
