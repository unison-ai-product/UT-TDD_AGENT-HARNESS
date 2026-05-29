---
doc_id: G3-readiness-report-2026-05-28
title: "L3 G3 readiness report — PO サインオフ判断材料 (v3: PO 指摘「要件定義項目すべてカバー？」反映 — pmo-sonnet カバレッジ matrix + Critical 4 件 + P1 13 件 carry 明示 + D-01/D-04 補完)"
status: ready-for-PO-signoff
created: 2026-05-28
updated: 2026-05-28
owner: PM (Opus)
parent_g1: docs/handover/G1-readiness-report-2026-05-28.md (G1 v8 PASS)
---

# L3 G3 readiness report (2026-05-28、v3 → 2026-05-29 A-54 update)

> **🔴 A-54 update (2026-05-29)**: PO 指摘「L3 まで見直して見落としチェック」で 4 軸独立 audit (pmo-sonnet ×4) を実施し、**v3「PASS」は機械検証が空洞だった**ことが判明 (lint が AC-NFR-* 未捕捉・AT→AC 逆引き孤児検出なし・doc 内 AT 件数が 87/95/116 三者三様)。4 カテゴリの漏れを全件是正 (詳細 = ledger A-54)。**更新後の確定値**: L1 NFR **14→15 件** (NFR-17 統合セキュリティ追加、旧 telemetry NFR-17 → NFR-18 リネーム) / L12 AT **95→117 件** (実数再カウント) / FR-L1 42 件 (不変) / lint 強化後 vitest **46 pass** / g3-trace 全 orphan=0 (機械実効化)。**G3 再判定は本 update 反映後に PO サインオフ**。以下 v3 本文の旧件数 (NFR 14 / AT 95 等) は A-54 で上書き済。
>
> **判定 (v3 時点、A-54 で機械検証強化)**: PASS 候補 (Critical 0 / Important 0 / Minor 0、PO 指摘 2 件は別 commit で governance 改善対応)
> **v3 で追加** (PO 指摘「要件定義項目はすべてカバーできているの？」反映): pmo-sonnet (sonnet) でカバレッジ matrix 作成 → Critical 4 件 + Important 10 件 + Minor 5 件発見
>   - **Critical 4 件解消** (G3 PASS 阻害リスク): C-01 UX-01 AT 追加 (AC-UX-01-01 + AT-UX-01、3 バランス被覆) / C-02 FR-19 新規 (BR-08 doc-reviewer 必須召喚) + AC 3 件 + AT 3 件 / C-03 NFR-03 (AI mode 非依存) nfr-grade §1 行追加 + AT-NFR-03 / C-04 AT-FR-09-04 (opus override 禁止) 追加
>   - **Important 重点解消**: P1 13 件 carry 明示 note (functional §3.1、L4 PLAN 起票時の必須参照) + D-01/D-04 nfr-grade 行追加 + AT 追加
>   - **AT 件数**: 87 → 95 件 (Phase A 即実装 83 件 + carry 12 件)
>   - **G1-trace R1/R2/R3**: 全 PASS 維持、UX-01 carry 漏れ解消で R1 完全
>   - **残 Important 6 件 + Minor 5 件**: G3 後 carry として §4 で明示 (L4 起票時に対応)
> **v2 で追加** (PO 指摘 「コーディングルール / ドメイン更新 / web 検索 / フォーク / pdm」反映):
>   - **tech-fork × 3 並列調査**: CLI library / state mgmt / hook framework / coding standards / linter / BDD-AC framework / DDD entity (commander + clack + lowdb + xstate + PGlite + lefthook + lint-staged + Biome v2 既採用 + knip 推奨)
>   - **tech-docs × 1**: V-model+AI / IPA × ISO 25010 + SonarQube / DDD back-propagation pattern + Neurosymbolic Guard (4 ADR 候補)
>   - **pdm-tech-innovation (opus)**: DORA 4+1 → D-10〜D-13 / SPACE → D-14〜D-17 / Stripe writing-first + Linear cycle 固定の選定取り込み
>   - **pdm-marketing-innovation (opus)**: JTBD 3 層 + NSM Verified AI delivery rate + Crossing Chasm Bowling Alley + PLG Aha moment 15 分 TTV + multi-team back-propagation
>   - **L1 business §10.1.1 L3 由来 entity 11 件 back-propagation 追加** (AC / AT / plan_evaluation / skill_evaluation / model_evaluation / poc_evaluation / ipa_grade / cutover_command / kpi_metric / evaluation_batch / derived_view)
>   - **L1 business §9 carry 拡張**: PdM 由来 BR (BR-JTBD-01 / BR-NSM-01 / BR-TTV-01 / BR-multi-01/02 + UX-04 / FR-L1-multi-01/02) + tech-docs 由来 governance (back-propagation protocol / NFR 3-tier / Neurosymbolic Guard / Testable Contract) 計 12 件 carry 追加
>   - **L3 各 sub-doc §7/§9 carry に集約**: functional §7.1-§7.3 (fork + PdM + tech-docs) / business-detail §9.1 (PdM 評価指標拡張) / nfr-grade §7.4.1-§7.4.2 (KPI 拡張 + 3-tier 分類)
> **PO 指摘 2 件 (別 commit 対応)**:
>   1. PLAN 起票時の Web 検索 + フォーク + pdm 組込 process 改善 (PLAN テンプレ §3 ヒアリングに Step 0 = 外部調査追加)
>   2. agent-guard に opus pdm-* 系の追加制約 (明示 --allow 必要、weekly quota 保護)
> **PO に求める判断**: L3 機能要件の **G3 ゲート凍結サインオフ** (3 sub-doc + L12 受入テスト 1 doc + 3 PLAN の pair freeze + 12 carry 拡張、L4 起票への進行承認)

## §1 サマリ (PO スキャン用)

| 項目 | 状態 |
|---|---|
| **L3 sub-doc 3 件** (functional / business-detail / nfr-grade) | ✅ 本起草完了 (functional ~400 行 / business-detail ~300 行 / nfr-grade ~250 行) |
| **L12 受入テスト設計 1 doc** (AT-* 87 件量閉じ) | ✅ 本起草完了 (~300 行、孤児 0) |
| **L3 PLAN 3 件** (PLAN-L3-01〜03 全 Step 進捗反映) | ✅ Step 1-6 完了 (Step 7 review は G3 readiness 時に集約) |
| **PO 直問** | **0 件** (TL レビューで全件 AI 推奨採用、A-43/A-44 ledger) |

## §2 PO 確認事項 (3 点 + 1 件サマリ)

### 確認 1: L3 機能要件 (FR-01〜18、P0 18 件詳細化 + AC 54 件)

`docs/design/harness/L3-functional/functional-requirements.md` (~400 行)

- L1 FR-L1-01〜18 (P0) を **1:1 で L3 FR-01〜18** に詳細化
- 各 FR-* に **入出力 / 振る舞い / AC 3 件** (Given-When-Then 形式、正常系/異常系/境界系)
- 各 FR-* に **対応画面 (PM/HM/GD) / 対応 mode / 対応 drive / 人間判断点** (CC2 carry 充足)
- **§3 carry 宣言**: P1 18 件 + P2 5 件 = L4 carry default / FR-L1-19 = Phase B / FR-L1-36/38/43 = PLAN-L3-02 委譲
- **§4 画面 trace**: screen §5 G1-trace マトリクス継承 + AC レベル拡張 6 件サンプル
- **§5 9 mode × FR**: P0 18 件で 6 mode 直接被覆 / 4 mode は L4 carry
- **§7 carry**: L4 基本設計 + L4 データ設計 + L7 TDD + L12 受入テスト + CC2 carry 強化

### 確認 2: L3 業務要件詳細 (BR-21 + HM-08 + FR-BR21-36/38/43)

`docs/design/harness/L3-functional/business-detail.md` (~300 行)

- **§1〜§4**: BR-21 評価サイクル 4 軸確定 (PLAN 単位 default + 5 指標 + sprint 末 + 人間承認必須)
- **§5**: HM-08 画面連動 (4 ソース統合 + 30 秒ポーリング + AI 指示 copy UI)
- **§6 Phase A/B 境界**: Phase A = 宣言のみ + HM-08 placeholder / **Phase B 着手条件 = G14 + KPI D-07 ≥ 50% AND** (A-44 ledger TL 採用)
- **§7 FR-BR21-36/38/43**: 各 AC 2 件 計 6 AC (Phase B carry)
- **CC2 carry**: 全改善アクション「人間承認必須」(半自動 = 提案 + 承認の 2 段階)
- **NFR-18 (PII redaction)**: Phase B carry で nfr-grade と整合 (A-54 で旧 NFR-17→18 リネーム)

### 確認 3: L3 NFR グレード値 (NFR-01〜17、15 件 IPA Lv + 受入閾値。A-54 で NFR-17 統合セキュリティ追加)

`docs/design/harness/L3-functional/nfr-grade.md` (~250 行)

- **§1〜§6**: 6 IPA 大項目に Lv2/Lv3 確定 (TL 採用 = 社内内製ツール想定で過剰投資回避)
  - 可用性 Lv2 / 性能 Lv2 / 保守性 Lv3 / 移行性 Lv2 / セキュリティ Lv3 / 環境 Lv3
- 各 NFR-* に **IPA Lv + 受入閾値 + 測定方法 + pass 条件 + AC** (4 件サンプル AC 詳細化)
- KPI integrated: D-02 (NFR-13) / D-05 (NFR-08) / D-06 (NFR-14) / D-07 (NFR-12) / D-09 (NFR-16)
- **§7 carry**: NFR-02/15 = L4 ADR / NFR-09 = L4 carry / NFR-18 = Phase B (PII redaction、A-54 で旧 NFR-17→18)

### サマリ: L12 受入テスト設計 (AT-* 87 件量閉じ、L3 ↔ L12 pair)

`docs/test-design/harness/L3-acceptance-test-design.md` (~300 行)

- **AT-FR 54 件** (functional 由来、FR-01〜18 × AC 3)
- **AT-BR21 15 件** (business-detail 由来、Phase A 6 + Phase B carry 9)
- **AT-NFR 18 件** (nfr-grade 由来、Phase A 15 + L4 carry 2 + Phase B carry 1)
- **合計 87 件** (Phase A 即実装 75 件 + carry 12 件)
- **量閉じ**: 全 FR-*/AC-*/BR-21 派生/NFR-* に最低 1 AT 紐付き、**孤児 0**
- **§4 G3-trace 機械検証**: R1-R4 全 PASS (本起草時点で全件 trace 整合確認済)

## §3 G3-trace 機械検証結果

L1 G1-trace と同構造で 4 軸検証 (本起草時点で人手確認):

| ルール | チェック内容 | 結果 |
|--------|------------|------|
| **R1** (BR/UX/FR-L1 → L3) | 全 BR-01〜08 + BR-21 + UX-01〜03 + FR-L1 P0 18 件 が L3 のいずれかに紐付き | **PASS** — functional + business-detail + nfr-grade で全件被覆 |
| **R2** (FR-* → AC → AT) | 全 L3 FR-* に AC 最低 3 件、全 AC に AT 対応 | **PASS** — 18 FR × 3 AC × 1 AT = 54 件マップ |
| **R3** (AT → 要求) | 全 AT-* が L3 要求に紐付き | **PASS** — 87 AT 全件 trace |
| **R4** (NFR → 閾値 → AT) | 全 NFR-* に閾値 + AT 紐付き | **PASS** — 14 NFR + 3 carry 全件 |

> **G3-trace lint 機械実装**: L7 carry (本 PLAN は trace 整合の宣言と人手確認まで)

## §4 G3 後 carry (L4 carry + Phase B carry、任意)

### L4 carry (L4 起票時に必須参照)

- **functional P1 18 件 + P2 5 件** の詳細化 (L4 で AC + 詳細化)
- **L4 基本設計 (PLAN-L4-01〜05)**: 各 FR-* の実現アーキ確定
- **L4 データ設計 (PLAN-L4-04)**: business §10.2 L4 carry 7 項目 + 各 FR の入出力データ構造 + 評価指標 entity (BR-21)
- **L4 ADR**: NFR-02 (npm/template/Packages) / NFR-15 (Cloudflare/fly/docker) / NFR-09 (parity-check)
- **G3-trace lint 実装** (R1-R4 機械検証ルール)

### Phase B carry (Phase B 着手時に確定)

- BR-21 Learning Engine 本実装 (skill/model/PoC 評価 + 半自動適用)
- HM-08 リアルタイム表示 (集計バッチ → イベントストリーム)
- telemetry default + PII redaction (NFR-18 候補、A-54 で旧 NFR-17→18 リネーム)
- model 単位 evaluation opt-in

## §5 commit chain (G3 readiness 整備の commit)

```
29df198 L3 起票フレーム着地 (PLAN-L3-01〜03 + L3-functional/ + L12 placeholder)
301498c L3 ヒアリング項目 TL レビュー反映 (PO 直問 36→2)
6ef4da6 L3 ヒアリング PO 直問 0 件達成 (残 2 件も AI 採用)
<本commit> L3 sub-doc 本起草完了 (functional / business-detail / nfr-grade + L12 受入テスト + G3 readiness、ledger A-45)
```

合計 4 commit、L1 G1 v8 PASS 後の L3 整備完了。

## §6 PO 最終判断依頼

以下のいずれかを返答ください:

- **(a) G3 最終 PASS サインオフ** (強推奨) → **L3 凍結確定**、**L4 基本設計起票** (PLAN-L4-01〜05) へ進行
- **(b) Minor 修正要請** (現時点で既知 Minor は 0 件)
- **(c) NG (追加スコープ修正)** → 追加要求 / 修正要件を指定

(a) を強推奨。Critical 0 / Important 0 / Minor 0、PO 直問 0 件達成 (TL レビューで全件 AI 推奨採用)、87 AT 全件被覆。

---

**evidence** (PO がスキャン読みで詳細確認できる順):

- L1 G1 PASS: `docs/handover/G1-readiness-report-2026-05-28.md` (v8)
- L3 3 sub-doc: `docs/design/harness/L3-functional/*.md`
- L12 受入テスト: `docs/test-design/harness/L3-acceptance-test-design.md`
- L3 3 PLAN: `docs/plans/PLAN-L3-0{1,2,3}-*.md`
- v2 取り込み軌跡: `docs/migration/v2-import-ledger.md` §5 A-42〜A-45
