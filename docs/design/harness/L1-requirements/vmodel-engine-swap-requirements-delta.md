---
layer: L1
sub_doc: technical
status: confirmed
revision_track: additive
revision_base_artifact: docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
pair_artifact: docs/test-design/harness/L14-vmodel-engine-swap-operational-test-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_br: docs/design/harness/L1-requirements/vmodel-upgrade-requirements.md
next_pair_freeze: L4
plan: docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
created: 2026-07-10
updated: 2026-07-10
---

# Vモデルengine-swap 要件delta

## 1. revision境界

本書は`PLAN-L1-06`でconfirmed済みの`vmodel-upgrade-requirements.md`を変更せず、その上に積むadditive deltaである。
既存VUP-REQ-01〜08とreview evidenceは旧artifactに固定し、本書はchecked ZIP再監査とPO指示から追加された
full-scope engine-swap要求だけを所有する。chassis継承を理由に全docs、Forward、workflow、PLAN、実装、検証の見直しを縮小しない。

## 2. VUP-REQ-08A: source/item/profileの全件性

HarnessはPoC / Standard / Enterpriseのsize軸とWeb / Mobile / Desktop / CLI / APIServiceのproduct軸を合成し、
109 numbered source docs、21 categories、163 semantic itemsをHARNESS targetへ理由付きで追跡しなければならない。

受入条件:

- source disposition、source-target edge、semantic item assessmentがtracked authoring sourceとして存在する。
- 8 profileのoverlayが対象、必須、defer、対象外を決定論的に解決する。
- pending/gapをverifiedとして扱わず、gapはowner/exit付きdebt PLANへ送る。

## 3. VUP-REQ-09: Forward FSMとPLAN Asset v2

HarnessはForwardをappend-only state transitionとして執行し、PLANをrename/layer移動から独立したimmutable identity、
revision、alias history、revision-bound evidenceを持つ設計資産として管理しなければならない。

受入条件:

- `plan → pair-freeze → red-freeze → implement → trace-freeze → review → accept`が許可遷移とguardを持つ。
- stale/expired/wrong revision evidenceではacceptできない。
- legacy PLANはadapterで読めるが、新規authoringと意味変更はPLAN Asset v2へ移行する。

## 4. VUP-REQ-10: 設計由来の右腕gate

HarnessはL0〜L14、G0.5〜G14、V-pair、成果物、case ID、evidence、exit criteria、defect routingを宣言型contractに保持し、
detector/doctor/roadmap obligationをそのvalidated DTOから導出しなければならない。

受入条件:

- L8〜L14にengine-swapへlinkedした`kind: verify` PLANが存在し、各層の実行証拠を個別に閉じる。
- contract欠落、重複定数、生成drift、無関係/archived/draft verifyによるfalse-greenをfail-closeする。
- detector自身は独立meta-verifierとmutation receiptで自己証明され、survivor 0になる。

## 5. program波及

U18a〜gを通じ、L4/L5/L6/L7/L8〜L14、repository全tracked docs、DDD/OOP class/method設計、163 item監査、
detector self-proofへ降下する。本書のconfirmedはL1要求deltaのpair-freeze承認を表し、下流program完遂を表さない。
