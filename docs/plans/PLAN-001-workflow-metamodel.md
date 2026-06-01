---
plan_id: PLAN-001-workflow-metamodel
title: "PLAN-001 (kind=poc): workflow メタモデル検証 (①必須+②駆動モデル→PLAN合成→駆動プラン→exit→fullback がきれいに回るか)"
kind: poc
layer: cross
workflow_phase: S3
drive: poc
status: draft
decision_outcome: null
created: 2026-05-29
updated: 2026-06-01
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

これは **Forward 凍結 PLAN ではなく 検証 (PoC) 駆動プラン**。対話で固めた「workflow メタモデル」自身が `hypothesis`（高不確実）なため、**triage 原則を自己適用**し、spec 凍結より「回して確かめる」を先行する（PO 指示「ワークフローを先にきれいに動かすなら検証で起票」）。**`workflow_phase: S3`（verify）に進行（A-93、2026-06-01）**: 検証対象を FR-L1-41 単体から **L1-L5 V-model dogfooding 全体**に拡張し（PO 確定 = option A）、実際に通したメタモデルの所見を S3 verify として記録する（§7/§7.1）。S4 `decision_outcome` は PO。

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

## §1.1 Discovery の適用範囲 — 確証が持てない「設計」にも適用 (PO 確定 2026-06-01)

Discovery (kind=poc 駆動プラン) は **要件・成功条件の未確定 (concept §2.5「要件未確定 / 実現性不透明」) だけでなく、確証が持てない『設計』にも適用する**。設計が紙上で確定できない（実現性・妥当性が不透明な）場合、確証を装って進めて後で大手戻りするのでなく、**Discovery として起票し検証で設計を確定させる**。

**起票パターン (PO 指示): 設計 → 仮実装 → 検証 → 設計確定**

| 段 | workflow_phase | 内容 |
|---|---|---|
| 1. **設計 (provisional)** | S1 | 確証の持てない設計を暫定で書く（placeholder / 仮説を許容、紙上で無理に確定しない） |
| 2. **仮実装 (PoC spike)** | S2 | 設計を確かめるための **使い捨て可の仮実装**（本実装でない、`poc/*` ブランチ）。設計が成立するか手で当てる |
| 3. **検証** | S3 | 仮実装で設計が成立するか検証（詰まり / 欠落 / 不整合を観察）。設計の妥当性が実証されるか |
| 4. **設計確定** | S4 | `decision_outcome`: **confirmed** → 設計を確定し Forward 本実装へ（出口 = `promotion_strategy`、§6: reuse-with-hardening で実装ゲート通過 / redesign で再設計）/ **rejected・pivot** → 設計を直す |

これにより **「確証なき設計を確証ありと偽って Forward 凍結 → 後で大手戻り」を構造的に防ぐ**（紙上設計の過信を、仮実装による実証で置換）。決定権は `decision_outcome` (S4、PO 所有)。仮実装は使い捨て前提なので `poc/*` から main 直 PR は物理ブロック (concept §4.x)、confirmed 後に Reverse 経由で本実装する。

> **正本反映経路**: 本拡張は metamodel PoC (本 PLAN) の検証結果。S4 confirmed 時に concept §2.5 Discovery 定義（現在「要件未確定」のみ）へ「設計未確証」適用を promote する（未凍結メタモデルの正規反映、[[project_workflow_metamodel_poc]]）。それまでは本 §1.1 が暫定正本。

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

## §7 検証対象 (当初 FR-L1-41 → L1-L5 dogfooding 全体に拡張、PO 確定 option A 2026-06-01)

**当初 (2026-05-29) = FR-L1-41 (drive 自動判定)** 単体を題材に full cycle を 1 周回す予定だった。
**拡張 (A-93、option A) = L1-L5 V-model dogfooding 全体**: 実際には FR-L1-41 単体でなく、**L1 要求 → L3 要件 → L4 基本設計 → L5 詳細設計を実 dogfood し続けた**こと自体が、メタモデル (①必須+②駆動→PLAN合成→exit→fullback) の遥かに richer な検証になっている。よって検証スコープを L1-L5 dogfooding 全体に拡張し、その所見を §7.1 に S3 verify として記録する（FR-L1-41 は包含される）。

> **PO 叱責の意味 (A-93)**: L1-L5 で「やった」検証を、本 PoC 工程 (S2/S3) に **通して記録していなかった**。重い軽いで省いたのでなく、通すこと自体を失念。本 §7.1 がその記録（やった記録を残すために通す、[[feedback-process-for-record-not-weight]]）。

## §7.1 S3 verify 記録 — L1-L5 dogfooding 所見 (A-93、decision は S4=PO)

メタモデルを L1-L5 に適用して観察した「回った / 詰まった」。**詰まりは大半がメタモデル欠陥でなく『適用エラー』**で、検証 (review/audit/PO) が捕捉し是正できた = メタモデルの「詰まらず回り、逸脱を検出する」仮説 (§5) を支持する方向。最終 verdict は S4 (PO)。

**回った (hypothesis 支持):**
- ①必須スケルトン (L0-L14 + V-pair) を document-system-map で業界 grounding → 各層の成果物が無理なく定義できた
- PLAN 合成 (master hub + child triage) が L1/L3/L4/L5 で機能。kind/layer/workflow_phase/decision_outcome 等 既存 schema で表現できた (層越境なし)
- gate G_N (G1/G3/G4 + 4軸 audit) が機能。Recovery 合流時の G4 再 audit も既存機構で回った
- ②駆動モデルの実適用: **Recovery** (PLAN-REC-001、premise gap を Step1-5 で収束・close) / **Discovery=本 PoC** が回った
- placeholder_deps + back-fill を DB(state) 完全性で機械保証する設計が成立 (孤児0 収束)

**詰まった (= 適用エラー / メタモデル言語化不足、すべて検証が捕捉し是正):**
| 詰まり | 原因 | 是正 | 種別 |
|---|---|---|---|
| L4 で Master 2 本並列 (L4-00 / L4-10) | Recovery 由来 child を単一 root に従属させる原則の適用漏れ | A-90 統合 | 適用エラー |
| L5 で 4 FR を 1 PLAN に lump | 「PLAN=設計書化要件ごと」の言語化不足 | A-92 per-requirement 分割 + [[feedback-plan-per-requirement]] | 言語化不足→確定 |
| 粒度の混同 (PLAN 数 vs V-pair) | PLAN 組織化軸と設計内容粒度軸の未分離 | A-81/A-92 で 2 軸明文化 | 言語化不足→確定 |
| 内部資産増分で data.md/external-if 取り残し | cross-sub-doc 整合の適用漏れ | A-90 gap-fill + G4 再 audit | 適用エラー |
| 工程を「重い」で軽量化しようとした | process-for-record 原則の違反 | PO 叱責 → [[feedback-process-for-record-not-weight]] | 原則違反→確定 |

**メタモデル refinement (本 dogfooding で確定した学び、正本へ反映済):**
- 粒度=V-pair / PLAN=要件ごと / 単一root / placeholder+back-fill+DB保証 / process-for-record / **Discovery-for-design (§1.1、本 A-93 追加)**

> **S4 への申し送り (PO 判断材料)**: メタモデルは「詰まらず1周」とまでは言えない（適用エラーで数回詰まった）が、**詰まりは検証で全件捕捉・是正でき、メタモデル本体の欠陥でなく言語化不足/適用ミス**だった。confirmed (refinement 込みで採用) / pivot (言語化を強化して再検証) のいずれかが候補。decision_outcome は PO。

## §8 carry → 機能設計 (L6)

詳細メカニクスは機能設計 carry（過剰詳細化しない）: 駆動プランテンプレ実フィールド / `decision_outcome × promotion_strategy` 状態遷移 / promote-gate 具体品質バー / 検証ツールボックス (Web/概念/技術) 手順・検証基盤仕様。

## §9 DoD (S1→S3 進行、S4 は PO)

- [x] §7 検証対象を PO が確定 (当初 FR-L1-41 2026-05-29 → L1-L5 dogfooding 全体に拡張 option A 2026-06-01)
- [x] **S2 PoC = L1-L5 dogfooding を実施**（メタモデルを実層に適用）
- [x] **S3 verify = §7.1 に所見記録**（回った / 詰まった / refinement、A-93）
- [x] **Discovery 適用範囲拡張 (確証なき設計、設計→仮実装→検証→確定) を §1.1 に明記** (PO 2026-06-01)
- [ ] TL (別 runtime) が §1-§6 + §7.1 所見をレビュー
- [ ] **S4 = PO が `decision_outcome` 記録** (confirmed / rejected / pivot)。confirmed なら §1.1 を concept §2.5 へ promote + refinement 群を正本反映確認
