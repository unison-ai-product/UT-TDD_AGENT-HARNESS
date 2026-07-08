---
layer: L1
sub_doc: technical
status: confirmed
pair_artifact: docs/test-design/harness/L14-operational-test-design.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L4
---

# UT-TDD Agent Harness - Vモデル刷新 要件差分

> **位置付け**: 本 doc は `PLAN-L0-01-vmodel-harness-upgrade-charter` から派生する L1 要件差分である。既存の
> `ut-tdd-agent-harness-requirements_v1.2.md` や L1 既存 sub-doc を即時置換しない。後続 U2-U7 で正本 doc へ
> 波及更新するための再凍結入力として扱う。

## 1. 前提

`Vモデル設計ドキュメント_clean.zip` は、工程表、宣言型 spec、trace 検査、activation/profile、DDD/OOP
設計を含む上流設計素材である。UT-TDD 側では ADR-001 に従い、ZIP 内 tooling を product runtime として直接
移植しない。概念を TypeScript/Bun core、PLAN/frontmatter、design docs、test-design、`.ut-tdd/harness.db`
projection へ翻訳する。

今回の刷新は「片肺で Forward だけを駆動する」状態を改善し、左肺の設計下降と右肺の検証上昇が同じ工程表、
trace、DB projection を読む構成へ寄せる。最初の要件粒度は L1 に留め、機能設計、内部処理、DB schema、
実装は後続 L4-L7 PLAN で分割する。

## 2. 現状との差分

| 軸 | 現状 | ZIP から取り込む改善 | L1 要件化の方針 |
|---|---|---|---|
| 現在地把握 | PLAN と status はあるが、工程表・RAG・V-pair・採用状態の統一表現は局所的 | `schedule.py` 相当の工程表、前後関係、進捗、RAG、adoption | 工程管理表を PLAN/DB/status の共通入力にする |
| 駆動モデル選択 | route signal / route_mode はあるが、起票時の layer / sub_doc / pairing 強制はまだ弱い | layer ごとのリスクと V-pair を前提に駆動方向を選ぶ | `routeFiling` が mode だけでなく filing target を返す |
| 宣言型設計 | frontmatter / relation graph / docs が分散 | `spec.defines` と trace closure | design IR と DB projection の正本境界を定義する |
| 検出 | lint/doctor が file scan と projection を併用 | spec / schedule / activation / trace を横断検出 | detector は DB query を一次探索面にする |
| 右肺 | `kind=verify` は導入済みだが quality loop は初期段階 | 検証結果が trace / schedule / RAG と接続 | L8-L14 の検証結果を defect routing へ返す |
| DDD/OOP | DDD/TDD strictness と boundary lint はある | 集約、値オブジェクト、不変条件、契約を設計時点で固定 | 設計 doc に保守性・拡張性の事前制約を持たせる |
| PLAN 資産化 | PLAN は工程管理と証跡を兼ねるが粒度が揺れる | activation/profile/schedule/trace を構造化 | PLAN を将来検索・再利用できる設計資産にする |

## 3. 要件

### VUP-REQ-01: 工程管理表による現在地の一級化

Harness は、各 PLAN / design artifact / test-design artifact について、現在の工程位置、V-pair、前提工程、
進捗、RAG、採用状態を構造化して保持できなければならない。

受入条件:

- PLAN または後続 design IR から schedule entry を導出できる。
- `ut-tdd status` / `doctor` / DB query が同じ現在地情報を参照する。
- 工程表は人間の進行帳であると同時に、AI の次アクション選択入力になる。
- 工程管理表の専用 authoring source は `docs/governance/vmodel-upgrade-schedule.md` とし、掲載 PLAN はこの表を
  PLAN frontmatter fallback より優先する。
- `.ut-tdd/harness.db` は projection であり、正本は工程管理表 / PLAN / docs / test-design に置く。

### VUP-REQ-02: 駆動モデル選択の厳格化

Harness は、起票時に signal から mode だけを返すのではなく、`kind`、`layer_band`、`sub_doc_hint`、
`pairing_obligation`、`forward_insufficient_reason` を含む filing target を返さなければならない。

受入条件:

- Forward を正規経路とし、非 Forward mode は入口条件と理由を持つ。
- feature / version-up / design-bottomup 由来の作業は、設計層を skip して cold L7 に入れない。
- 片肺の実装作業ではなく、左肺設計と右肺検証のどちらへ入るかを filing target で明示する。
- 例外は audit 可能な escape governance を持つ。

### VUP-REQ-03: 宣言型 spec IR と DB projection

Harness は、要求、機能、設計、テスト、検証、ドメイン要素を宣言型 ID と関係で表現する design IR を持たなければならない。

受入条件:

- `spec.defines` 相当の宣言を UT-TDD の doc/frontmatter/body block のいずれかへ正規配置する。
- design IR は `spec_defs`、`trace_edges`、`activation_entries`、`schedule_entries` などへ projection できる。
- `schedule_entries` は専用工程管理表を第一入力とし、未掲載 PLAN のみ PLAN frontmatter から後方互換 fallback する。
- undefined reference、unreferenced definition、missing test、ledger mismatch を DB query で検出できる。
- 既存 PLAN / design docs を一括置換せず、activation/profile で段階導入する。

### VUP-REQ-04: DB 接続による検出系の探索性向上

Harness の検出系は、file scan の結果だけでなく harness DB 上の関係、履歴、状態、品質 signal を探索して、
起票候補を見つけやすくしなければならない。

受入条件:

- detector finding は artifact ID、関係 ID、工程位置、route candidate を持つ。
- `doctor` は finding を PLAN 起票候補、Reverse、refactor、verify、version-up へ分類できる。
- 検出結果は一回限りのログで終わらず、quality signal として再投影・再検索できる。
- DB schema 変更は後続 L5/L7 PLAN で行い、本 doc では要件境界だけを定める。

### VUP-REQ-05: 両肺 Vモデル quality loop

Harness は、L0-L7 の設計・実装側と L8-L14 の検証側を対にし、右肺の結果を左肺の改善起票へ戻せなければならない。

受入条件:

- `kind=verify` の PLAN は検証層、対象左肺 artifact、検証結果、defect routing を持つ。
- L8-L14 の evidence は `completed` 判定だけでなく、改善候補の signal として保存される。
- 検証結果から recovery / reverse / refactor / add-design / version-up のいずれへ戻すかを routing できる。

### VUP-REQ-06: DDD/OOP による保守性・拡張性の事前設計

Harness は、実装前に bounded context、aggregate、value object、不変条件、domain service、repository port を
設計 doc で定義し、後続実装がその境界を越えないよう検査できなければならない。

受入条件:

- L4-L6 の design docs は、主要 domain object と不変条件を trace 可能にする。
- 実装層は設計済み aggregate / value object / port を参照する。
- 重複実装、境界漏れ、依存逆転違反は detector finding として扱う。
- 保守性・拡張性は「あとでリファクタ」ではなく、設計時点の受入条件に入れる。

### VUP-REQ-07: PLAN / workflow の資産形式化

Harness は、PLAN を一時的な作業メモではなく、将来の検索、再利用、検出、レビューに耐える資産として保持しなければならない。

受入条件:

- PLAN は目的、現在地、工程表、activation/profile、trace、review evidence、defect routing を構造化して持てる。
- workflow docs は Forward / Reverse / version-up / verify の接続点を明示する。
- PLAN の粒度は L1 要件、L3 機能、L4-L6 設計、L7 実装、L8-L14 検証の責務境界に合わせる。
- 既存 PLAN の履歴改ざんはしない。新形式への移行は version-up wave として行う。

### VUP-REQ-08: activation / profile による段階導入

Harness は、全ドキュメントを一括で同じ粒度へ書き換えず、PoC / Web / Standard / Enterprise などの
profile と activation で必要範囲を制御しなければならない。

受入条件:

- profile ごとに必須 artifact、検査粒度、許容 defer を定義できる。
- activation されていない doc は「未対応」と「対象外」を区別する。
- version-up parked と active draft を status / DB / doctor で混同しない。

## 4. 非対象

- ZIP 内 Python tooling の製品実行経路への移植。
- 既存 `ut-tdd-agent-harness-requirements_v1.2.md` の即時置換。
- DB schema、CLI、lint 実装の即時変更。
- L4-L6 の詳細設計や class / module 設計の確定。

## 5. 後続分割

| 波 | 後続 PLAN の主題 | 本 doc から渡す要求 |
|---|---|---|
| U2 | 工程表と駆動モデル選択の厳格化 | VUP-REQ-01 / 02 |
| U3 | 宣言型 spec IR | VUP-REQ-03 |
| U4 | DB 接続による検出強化 | VUP-REQ-04 |
| U5 | DDD/OOP 設計強化 | VUP-REQ-06 |
| U6 | PLAN / workflow の資産形式化 | VUP-REQ-07 / 08 |
| U7 | 右肺 quality loop | VUP-REQ-05 |

## 6. G1 凍結条件

- 本 doc の要件 ID が後続 PLAN の `dependencies.references` または本文 trace に現れる。
- U2-U7 のどの波がどの既存正本 doc を改訂するかが PLAN 化されている。
- L14 運用テスト設計側で、VUP-REQ-01〜08 の運用検証方針が定義される。
- PO/TL が「既存 chassis を活かし、上流から engine / handling / safety を入れ替える version-up」として承認する。
