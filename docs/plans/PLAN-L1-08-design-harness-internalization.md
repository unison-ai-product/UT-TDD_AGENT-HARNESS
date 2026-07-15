---
plan_id: PLAN-L1-08-design-harness-internalization
title: "PLAN-L1-08 (research): Design Harness 内蔵化 要件差分・program 定義 (UX-FE Continuity Contract、charter L0-01 配下)"
kind: research
layer: L1
sub_doc: function-spec
drive: fullstack
status: draft
route_signal: research
route_mode: research
created: 2026-07-15
updated: 2026-07-15
owner: PO / Claude (Fable orchestrator)
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L10-ux-validation-test-design.md
next_pair_freeze: L10
agent_slots:
  - role: po
    slot_label: "Experience Owner - 利用者価値/事業価値/継続利用/表現方針の統合判断"
  - role: tl
    slot_label: "TL - V-model/契約統合、engine-swap inject 整合"
  - role: uiux
    slot_label: "UIUX - Pattern/responsive/motion 規則設計"
  - role: qa
    slot_label: "QA - gate/receipt/UX evidence 設計"
generates:
  - artifact_path: docs/plans/PLAN-L1-08-design-harness-internalization.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/plans/PLAN-L4-22-vmodel-source-disposition-profile-ssot.md
    - docs/plans/PLAN-L4-25-repository-docs-engine-swap-audit.md
    - docs/plans/PLAN-L6-70-source-catalog-profile-resolver-contracts.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - skills/browser-testing-and-screen-verification.md
    - src/lint/screen-impl-pair-freeze.ts
---

# PLAN-L1-08 (research): Design Harness 内蔵化 要件差分・program 定義

## 目的

既存 Forward spine (L0-L14) へ UX-FE Continuity Contract を内蔵し、L2 画面仮説
から L7 実装、L10 実検証までを同一意味 ID で機械保証する。新しい描画 engine /
mode / layer / DB 正本は作らない。

## 設計正本 (design source)

設計パッケージ `ut-tdd-design-harness-internalization-v0_2.zip`
(v0.2-r23、sha256:b1c142b4aa7b99f5ac78d50c3f7e873ac108154df369fee38a47790f042b10ce、
リポジトリ root、未追跡の提案材料)。00-17 章 + ADR 草案 + schemas 8+3 本 +
skill-pack + templates/patterns + checklists。docs/ への正式材料化は D9 決定後の
Slice 1 で行う (それまで docs/ に proposal を展開しない — catalog 外 md の
findings 増殖防止)。

## レビュー証跡 (材料段階)

- cross-family blind review: `ut-tdd codex --role blind-reviewer --model
  gpt-5.6-sol --execute` (2026-07-15)。v0.2-r15 に対し **FLAG 3 所見**
  (claim 導出の schema 非強制 / consumer hard 化条件未成立 / 製品固有値隔離
  未担保) → **r16 で全所見を schema constraints (LEDGER-C*/RCPT-C*/PROF-C*/
  UXFB-C*/IM-C*) + AC-16-A/B へ機械強制として反映**。
- intra_runtime レビュー: Claude opus TL 監査 (条件付き go、I-1〜I-4/M-1〜M-5)
  → r16 で全件反映 (9.11 doctor 単一正本表、AC-16-A 全 check 化、D9→D8 順序
  固定、consumer 再基準、ほか)。
- 機械検証: MANIFEST 68 件 = 実ファイル完全一致、CHECKSUMS 全 sha256 照合 OK。
- 各 leaf PLAN の confirm 前に、対象 slice 単位の再レビュー (hybrid cross-family)
  を実施する。本節は材料段階の証跡であり、実装 green の claim ではない。

## 設計判断 (PO 採択 2026-07-15 "GO")

| ID | 判断 | 採択 |
|---|---|---|
| D8 | engine-swap との順序 | **選択肢1: 設計マージ先行**。未 freeze の engine-swap 設計 PLAN (L4-22 / L4-25 / L6-70 系) へ UI 要求 (ID family / 契約 field / doc 種別) を設計入力として inject。freeze 済み設計に触る場合は additive revision + supersedes。inject は「要求の宣言」までとし UI 検出器実装は本プログラム側 slice に残す |
| D9 | sub_doc 粒度整合 | 推奨採択: **UI overlay 専用 coarse bucket を 1 つだけ追加** (per-topic slug 増殖はしない、PLAN-L7-245 整合)。bucket 名と catalog schema 変更の詳細は Slice 0/1 の leaf PLAN で確定し、**D8 inject より前に確定する** (決定順序 D9 → D8) |
| D10 | 将来 120 doc カタログ対応 | inject 時は「カタログ語彙へ収束する方針宣言」まで。対応表 (51 画面検証 / 72 フロントエンド設計) の実体化はカタログ取り込み (engine-swap 管轄) 時 |
| D11 | 参考収集→PAT-* 昇格 | pmo-tech-docs / pmo-tech-fork 流用のパイプラインを後続設計 (優先度は catalog 稼働後) |
| 判定権限 | 機械ゲート依存の禁止 | 機械は「劣化経路の遮断と evidence の偽装不能化」まで。G2 合意 / L10 実感評価 / preference 採否 / 意匠多義解釈の確定は必ず人間 (PO/Experience Owner)。L 勾配 (V 字両端=高協調、谷=自律) を team 定義の step 宣言として機械化する |

## Hard invariants (パッケージ 00/ADR より)

- no independent design engine / no new V-model layer / no DB-as-authoring-source
- no L2 implementation class freeze
- no implemented claim without mission evidence (schema fail-close、LEDGER-C1/C2)
- no G10 close without real rendering evidence
- consumer への hard gate は配布先ローカル dogfood 再基準 (AC-16-B)

## Program bands (leaf PLAN 分解の骨格、親 = PLAN-L0-01 charter)

| Band | 内容 | Gate |
|---|---|---|
| P0 | Slice 0: 工程順矛盾の Recovery/Reverse 正規化 (screen-impl-pair-freeze 分解置換、implemented/ux_verified 分離) + D9 確定 | Recovery close |
| P0.5 | PM-03 1 画面の垂直 PoC (S0-S4): L2 ループ → 最小 binding → 最小 mission → receipt → doctor 発火。**偽装 receipt 負例 fixture の mutation survivor 0** を self-proof。ブラウザ自動化依存の Native Windows 動作確認。S4 で go/no-go | S4 decide |
| P1 | D8 inject: engine-swap 設計 PLAN への UI 要求宣言差し込み | 対象 PLAN review |
| P2-P7 | L2 schema / L4 rule pack / L5 binding / L6 readiness / L7 mission gate / G10 拡張 (パッケージ 12 章 Slice 1-7) | G2/G4/G5/G6/G7/G10 |
| P8 | central UI dogfood 4 画面 (PM-01/PM-03/HM-05/HM-07) | G10 |
| P9 | Pack 配布 (中央固有物除外、consumer warning 開始) | release |

本 PLAN は L1-06/L1-07 と同じ kind=research (要件差分の調査・凍結)。設計実体は
L3-L6 の add-design leaf、実装は L7 の add-impl leaf として起票する。
kind=add-impl の leaf は Required Reverse pairing に従い PLAN-REVERSE-* を
双方向 pair で同時起票する。leaf は起票前に `ut-tdd plan lint` を通す。

## AC (master 完了条件)

- [ ] D9 が leaf PLAN として確定し catalog schema 変更が review 済み
- [ ] P0.5 垂直 PoC が S4 decide で go (receipt self-proof: 負例全 fail 実測)
- [ ] engine-swap inject 対象 PLAN に UI 要求節と `requires` back-reference
- [ ] パッケージ 14 章 AC-01〜AC-16-B が leaf PLAN へ全件割当 (孤児 AC 0)
- [ ] central UI 4 画面が mission-derived implemented + G10 evidence
- [ ] Pack artifact set に中央 UI 固有実体が含まれない (PROF-C2 負例 fixture)
