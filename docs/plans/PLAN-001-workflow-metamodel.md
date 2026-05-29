---
plan_id: PLAN-001-workflow-metamodel
title: "PLAN-001 (kind=poc): workflow メタモデル検証 (①必須+②駆動モデル→PLAN合成→駆動プラン→exit→fullback がきれいに回るか)"
kind: poc
layer: cross
workflow_phase: S1
drive: poc
status: draft
decision_outcome: null
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: po
    slot_label: "PO — 検証対象 item 選定 + 成否最終判断"
  - role: tl
    slot_label: "TL — workflow メタモデル設計レビュー (別 runtime)"
generates:
  - artifact_path: docs/plans/PLAN-001-workflow-metamodel.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/design/harness/L3-functional/functional-requirements.md
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-001 (kind=poc): workflow メタモデル検証 (駆動プラン / S1)

## §0 位置づけ

これは **Forward 凍結 PLAN ではなく 検証 (PoC) 駆動プラン**。対話で固めた「workflow メタモデル」自身が `hypothesis`（高不確実）なため、**triage 原則を自己適用**し、spec 凍結より「回して確かめる」を先行する（PO 指示「ワークフローを先にきれいに動かすなら検証で起票」）。現在 `workflow_phase: S1`（plan = この駆動プラン）。

> **これ自体がメタ dogfood**: 「②検証ドライブを PLAN が triage で取り込んだ」最初の実例。

## §1 重要前提 — workflow 機械骨格は schema に既存 (A-54 後の調査発見)

「新規構築」ではなく「**既存骨格が実タスクできれいに回るか**」の検証である。`src/schema/index.ts` に既存:

| メタモデル要素 | 既存 schema |
|---|---|
| ②駆動モデル | `kind` = poc/reverse/refactor/retrofit/recovery/troubleshoot/research、`drive` = poc/scrum/reverse |
| 駆動プラン (PoC) | `kind=poc` + `workflow_phase ∈ {S0..S4}` + `layer=cross` |
| exit verdict | `decision_outcome` = confirmed / rejected / pivot (S4 必須) |
| fullback (V字回帰) | `kind=reverse` + R0-R4 + `forward_routing` (L1/L3/L4/L5/gap-only) |
| **exit 3 分岐 (PO 案)** | `promotion_strategy`: **redesign**(=throwaway 再設計) / **reuse-with-hardening**(=promote+実装ゲート) / reuse-as-is / **discard**(=reject) |

→ PO の「throwaway / promote / reject」は既存 enum にほぼ 1:1 対応。**promote+実装ゲート = `reuse-with-hardening`** が既にある（逆ピラミッド防止ガードは schema 済）。

## §2 何を検証 (hypothesis)

> 「①必須スケルトン + ②ケースバイケース駆動モデル → PLAN 合成 → ②介入で駆動プラン spawn → exit (`decision_outcome`) → fullback (`kind=reverse` + `promotion_strategy`) → V字回帰」のワークフローが、**実 hypothesis item に対し 詰まらず・過剰process にならず・1 周クリーンに回る**。

## §3 どう検証 (method)

dogfood。実 hypothesis item を 1 件選び、ワークフローを**手動で 1 周通す**:
triage (maturity=hypothesis 判定) → 駆動プラン (kind=poc) spawn → S2 PoC → S3 verify → S4 `decision_outcome` → `kind=reverse` fullback (`promotion_strategy` 選択) → V字 (forward_routing 先) 復帰。各段の成果物が無理なく書けるかを観察。

## §4 検証基盤

harness 自走前 (Discovery/PoC ワークフロー FR-L1-15 未実装) のため **手動 + 既存 schema/frontmatter lint/PLAN 雛形**で回す。基盤自体は使い捨て可。

## §5 成否基準

- **confirmed**: 1 周 詰まりなし / 各段の成果物が無理なく書ける / 過剰 process 感なし (NFR-07 整合) / exit・fullback を既存 enum で表現できる
- **rejected**: どこかで詰まる / 層越境が必要 / 既存 enum で表現できない欠落がある (→ schema 拡張要件として fullback)

## §6 exit 3 分岐 (既存 enum マップ)

| PO 分岐 | decision_outcome | promotion_strategy (R4) | 補足 |
|---|---|---|---|
| reject | rejected (or pivot) | discard | 学びのみ記録 → 負債 |
| throwaway (再設計で本格版) | confirmed | redesign | contracts/学びのみ fullback、実装し直し |
| promote (PoC 改善→実装化) | confirmed | reuse-with-hardening | **実装ゲート (TDD/coverage/trace) 通過必須**。未通過は redesign 降格 (reuse-as-is は gate 通過時のみ) |

## §7 検証対象 item (PO 確定: 2026-05-29)

**確定 = FR-L1-41 (drive 自動判定)**: concrete・bounded・genuinely uncertain（PLAN/コード/拡張子から drive を信頼性高く分類できるか?）。full cycle を exercise しつつ実 FR を de-risk できる。
（検討した代替: orchestration_mode routing+縮退 / validation framework 自体（メタで抽象的）。両者は不採用、必要なら後続 PoC で。）

> 次工程: この FR-L1-41 を題材に S2 PoC（最小 drive-classifier 実験）を実行 → S3 verify → S4 decision_outcome → fullback。

## §8 carry → 機能設計 (L6)

詳細メカニクスは機能設計 carry（過剰詳細化しない）: 駆動プランテンプレ実フィールド / `decision_outcome × promotion_strategy` 状態遷移 / promote-gate 具体品質バー / 検証ツールボックス (Web/概念/技術) 手順・検証基盤仕様。

## §9 DoD (S1 完了条件)

- [x] §7 検証対象 item を PO が確定 (FR-L1-41、2026-05-29)
- [ ] TL (別 runtime) が §1-§6 のメタモデル↔既存 schema マッピングをレビュー
- [ ] confirmed なら S2 PoC PLAN へ進行 / S4 で `decision_outcome` 記録
