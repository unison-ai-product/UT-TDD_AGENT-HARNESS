---
plan_id: PLAN-L2-00-master
title: "PLAN-L2-00 (Master hub): L2 画面設計 materialization — 15 画面 (PM/HM/GD、PM-06 設計書ビューア含む) を placeholder から本設計へ + child PLAN 合成"
kind: design
layer: L2
drive: be
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: PM (Opus) / PO (人間)
master_hub: true
review_evidence:
  - reviewer: PM (Opus) hub structural review (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "L2 materialization hub の構造レビュー: child PLAN 分割 (screen-list/flow/ui-element/wireframe) sequence + phantom 参照 (不在だった PLAN-L2-01〜04) の解消 + V-pair (mock→L10, IMP-039/058) モデル + roadmap 登録を 4 sub-doc 全 confirmed 後に回す方針 (途中登録の rollup frontier 撹乱回避) を確認。第1 child screen-list の content materialization は pmo-sonnet (sonnet) が approve。doctor green。G2 freeze (status confirmed 昇格) は PO サインオフ gate ゆえ本 hub では実行せず Step 4 に残す。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL — L2 画面設計レビュー (intra_runtime_subagent)"
  - role: po
    slot_label: "PO — 共有用画面の設計承認 (timing: backend 完成後の materialization 発火)"
generates:
  - artifact_path: docs/plans/PLAN-L2-00-master.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - PLAN-L1-03-screen-requirements
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
---

# PLAN-L2-00 (Master hub): L2 画面設計 materialization

## 0. Objective

backend (検証コア) が完成し、画面が映すデータ (harness.db 52 表) が実在に至ったため、PO 指示
(2026-06-22「ほぼ実装が揃ったので今 L2 に戻り共有用画面を作る」) を受け、**placeholder のまま
宙ぶらりんだった L2 画面設計を本材料化**する。L1 で確定済みの 15 画面 (PM 6 + HM 8 + GD 1、
**PM-06 設計書ビューア = 2026-06-22 PO 指示で追加**) を正本に、L2 の 4 sub-doc を placeholder →
confirmed へ昇格させる。

## 1. Problem (画面系が宙ぶらりん、2026-06-22 監査で発見)

- L2 画面設計 4 doc は **リポジトリ唯一の `status=placeholder`** (他の全設計層は confirmed)。
- README が指す材料化 PLAN `PLAN-L2-01〜04` が**存在しなかった** (phantom 参照)。
- L2 を所有/生成する PLAN ゼロ、roadmap/master 未登録。
- freeze ゲートが placeholder を **park 扱い**して `[L0-L6] freeze 完了` と緑化 = PO が「必須実施」と
  宣言した層が未設計のまま「設計凍結完了」と読めるマスキング ([[feedback_coverage_not_substance]])。

## 2. Fix — child PLAN 合成 (本 hub が束ねる)

L1 画面要求 (`screen-requirements.md`、confirmed 551 行) を上流 baton とし、4 sub-doc を順に本起票:

| child PLAN | sub-doc | 役割 | 必須/省略可 |
|---|---|---|---|
| PLAN-L2-01-screen-list | screen-list | 15 画面 ID × URL 設計 × 認証認可 × ステート保持 | **必須** |
| PLAN-L2-02-screen-flow | screen-flow | 6 遷移シナリオ + カテゴリ間 deep-link の trigger/条件/戻る挙動 | **必須** |
| PLAN-L2-03-ui-element | ui-element | 主要 UI コンポーネント (PM-01 4 階層プルダウン / HM-02 heat map 等) | **必須** |
| PLAN-L2-04-wireframe | wireframe | Low-Fi ASCII レイアウト (High-Fi はケース別 / L10) | 省略可 (Low-Fi default) |

> **V-pair (IMP-039/058)**: L2 の ③ ペアは **wireframe mock 自体** (`pair_artifact: wireframe.md`、右腕 L10)。
> `docs/test-design/` に独立 L10 test-design doc は作らない (mock が pair を担う設計意図)。

## 3. Sequence

1. 本 hub (PLAN-L2-00) で材料化を anchor (phantom 参照解消)。 — [x]
2. PLAN-L2-01 screen-list 本起票 + doctor green。 — [x] (371d1df)
3. PLAN-L2-02 screen-flow → PLAN-L2-03 ui-element → PLAN-L2-04 wireframe を順に本起票。 — [x] (4 sub-doc 全 child PLAN confirmed、doc は placeholder 維持)
3b. **PM-06 設計書ビューア追加 (2026-06-22 PO 指示)**: L1 screen-requirements + L2 4 sub-doc + L14 OT-47 へ反映 (14→15 画面、孤児 0、doctor doc-consistency screens=15 green)。HM-01 機能一覧→PM-06 deep-link も追加 (機能一覧から画面要求を辿る)。 — [x]
4. 4 sub-doc doc を placeholder → confirmed (G2 freeze、PO サインオフ) 後: **L2 を roadmap に登録** (G-DESIGN.L2 gate + spans) し program-coverage の band 欠落を是正 (rollup 整合のため全 confirmed 後にまとめて登録、途中登録で frontier 撹乱を避ける)。
5. L10 UX refinement (High-Fi 判断) → src/web 実装 (Phase B) へ接続。

## 4. Acceptance Criteria

- [x] phantom 参照 (PLAN-L2-01〜04) を実在 PLAN へ解消する hub を確立。
- [x] 4 sub-doc を placeholder → confirmed (**G2 freeze、PO サインオフ 2026-06-22**「L2 いったん閉じる、画面モック」、gate-design §2 G2=PASS)。
- [x] 「park マスキング」解消: verification [L0-L3] が 8/12+4park → **12/12 confirmed 孤児0**、program-coverage park 0。L2 は既存 forward band 内に被覆済ゆえ別 roadmap entry 不要 (confirm で park 解消、roadmap-rollup bands 5/5 park 0)。
- [x] doctor green (gate-confirm / pair-freeze 39 pair 孤児0 / verification 39/39 / readability mojibake 0)。

## 5. Out of scope

- src/web 画面**実装** = L2 設計 + L10 確定後の Phase B (本 hub は L2 設計の materialization まで)。
- 標準成果物カタログ拡張 (帳票/batch/mail 等の sub_doc 型化) = 別議題 (downstream プロダクト形状確定後)。
