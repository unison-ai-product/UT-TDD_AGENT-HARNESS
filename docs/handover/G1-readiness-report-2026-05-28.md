---
doc_id: G1-readiness-report-2026-05-28
title: "L1 G1 readiness report — PO サインオフ最終判断材料 (v3: 画面要求 14 画面 PM/HM/GD 全面再編 完了)"
status: ready-for-PO-final-signoff
created: 2026-05-28
updated: 2026-05-28
owner: PM (Opus)
related_audit: |
  Phase 1 acdc5ccd (pmo-sonnet 再被覆監査) +
  Phase 2 ad3c4989 + aba43aef + a39bf4b8 + ae9d79db (画面/業務/統合 20 機能/Reverse+onboarding) +
  Phase 3 ac2517e7 + a008e781 (Step A screen 14 画面再編 + Step C ledger/OT 再採番)
---

# L1 G1 readiness report (2026-05-28、v3 最終版)

> **判定**: **PASS** (Critical 0 / Important 0 / Minor 5 任意 carry)
> **本 v3 で追加された変更**: 画面要求 14 画面 PM/HM/GD 全面再編 + 4 横断原則 + 3 カテゴリ Bounded Context (PO 凍結前追加ヒアリング全件採用)
> **PO に求める判断**: L1 業務要求の **G1 ゲート凍結最終サインオフ** (5 sub-doc + 5 PLAN + L14 OT 44 件 + 14 画面 の pair freeze、L3 起票への進行承認)

## §1 サマリ (PO スキャン用)

| 項目 | 状態 |
|---|---|
| **L1 5 sub-doc** (v2 HELIX-workflows 正本構造 + PO 追加ヒアリング 32 問 + 画面要求 14 画面再編 反映) | ✅ 起票完了 (business 313 行 / functional 235 行 / screen **337 行** / technical 188 行 / nfr 142 行) |
| **L1 5 PLAN** (全件 ✅ 確定マーキング、DoD 全件 ✅、status: ready-for-G1-signoff) | ✅ 起票完了 (PLAN-L1-03 は v3 全面書換) |
| **L14 運用テスト設計** (**OT-44 件**、5 sub-doc + 14 画面 全件被覆、孤児 0) | ✅ 起票完了 (前 31 件 + 新規 13 件 = 44 件) |
| **FR-L1 機能要求** (HELIX 由来 35 + PO directed 6 = 41 件確定) | ✅ functional §1 (P0:18 / P1:18 / P2:5) |
| **NFR 体系** (IPA 6 大項目 + ISO 25010 二軸、NFR-16 onboarding 互換性) | ✅ NFR-14 件 (NFR-09/10 連動欠番) |
| **BR 業務要求** (BR-01〜08 + UX-01〜03 + BR-21 + §3.3.2 人間主導原則) | ✅ business §1.2 + §11 BR-21 + §3.3.2 (新規) |
| **業務 KPI** (D-01〜D-09) | ✅ business §6.5 |
| **ステークホルダー権限分離** (S-01〜S-05、harness 運用者ロール) | ✅ business §4 |
| **9 mode 統一合流原則 + Add-feature 例外** | ✅ business §3.3.1 + technical §6 |
| **画面要求** (**14 画面 PM 5 + HM 8 + GD 1、3 カテゴリ Bounded Context、4 横断原則**) | ✅ screen §1.PM/HM/GD + §3 横断原則 + §6 Bounded Context (v3 全面再編) |
| **3 カテゴリ Bounded Context** (PM / HM / GD、DDD 整合) | ✅ business §10.3.1 + screen §6 |
| **人間主導 + AI 補助原則** (CC2) | ✅ business §3.3.2 + screen §3.1 横断原則 |
| **詳細データテーブル必須** (CC3) | ✅ screen §3.1 横断原則 + 全 14 画面で実装 |
| **DDD ドメイン entity** (12 entity + skill/detector 参照注記) | ✅ business §10 + §10.4 |
| **subagent guard** (環境非依存 TS、許可リスト 15 / model 明示 / fail-close) | ✅ 実装済 (commit 30a9299) |
| **Phase 2 追加 4 subagent 監査** + **Phase 3 Step A/C subagent** 全件 PO 承認 | ✅ V1-CC3 全件 AI 推奨採用、screen 14 画面再編完了 |

## §2 G1 PO サインオフ確認事項 (5 点)

### 確認 1: L1 業務要求 (BR-01〜08 + UX-01〜03 + BR-21) + §3.3.2 人間主導原則

`docs/design/harness/L1-requirements/business-requirements.md` (313 行)

- BR-01〜08: 既存 8 件
- UX-01〜03: 既存 3 件
- **BR-21 新規**: AI 実行成果評価 (P2、L3 carry)
- **§3.3.1 9 mode 統一合流原則** + Add-feature 例外
- **§3.3.2 人間主導 + AI 補助原則** (CC2、v3 新規): AI 単独自動化に依存しない、人間判断補助最優先
- **§4 ステークホルダー** harness 運用者ロール (S-04)
- **§6.5 業務 KPI D-01〜D-09**
- **§10.3.1 画面要求 3 カテゴリ Bounded Context** (v3 新規、X1=a 採用)
- **§10.4 skill/detector 参照注記** (B9=c)

### 確認 2: L1 機能要求 (FR-L1 41 件 = HELIX 由来 35 + PO directed 6)

`docs/design/harness/L1-requirements/functional-requirements.md` + `docs/migration/v2-import-ledger.md §6`

- P0: 18 件 / P1: 18 件 / P2: 5 件
- 新規 P1 6 件: FR-L1-37 (model 推挙) / FR-L1-39 (タスク難易度) / FR-L1-40 (drive 別 state) / FR-L1-41 (drive 自動判定) / FR-L1-42 (Claude↔Codex 引継ぎ) / FR-L1-44 (途中導入 onboarding)
- L3 forward carry: FR-L1-36 (skill 評価) / FR-L1-38 (model 評価) / FR-L1-43 (PoC 計測) (BR-21 経由、P2)
- 既存 FR 拡張: FR-L1-06/08/12/14/16/19/20 (7 件)
- §2 利用シナリオ 8 件 (既存 5 + Refactor/Retrofit/Recovery 追加)

### 確認 3: L1 非機能要求 (NFR-14 件、IPA 6 大項目)

`docs/design/harness/L1-requirements/nfr.md` (142 行) — NFR-16 onboarding 互換性 (FR-L1-44 連動)

### 確認 4: L1 画面要求 (**14 画面 PM/HM/GD、4 横断原則、Bounded Context**) **★ v3 大幅変更**

`docs/design/harness/L1-requirements/screen-requirements.md` (337 行)

**PM (5 画面、案件遂行、PO 主)**:
- PM-01 プロジェクト俯瞰ダッシュボード (4 階層プルダウン: 俯瞰/工程/割当/詳細)
- PM-02 工程ビュー (L0-L14 共通テンプレート、進捗・担当・詰まり 3 軸、機能内容除外)
- PM-03 Gate + 詰まり要因ビュー (トラブル横断)
- PM-04 Trace ビュー (4 artifact + W-pair 統合)
- PM-05 Handover ビュー (起動時 auto 表示)

**HM (8 画面、harness 改善、運用者主)**:
- HM-01 機能一覧ビュー (FR-L1 41 件 × implementation_status)
- HM-02 カバレッジヒートマップビュー (観点 8 × 軸 5 = 40 通り、弱点診断)
- HM-03 配線図ビュー (動的、エラー赤表示、CC1=a 再採用)
- HM-04 データベース閲覧ビュー (整合性チェック付き、CC1=a 再採用)
- HM-05 Audit / 実行ログビュー (skill 注入タブ統合)
- HM-06 Recovery ビュー (CLI ロールバックコピー)
- HM-07 Doctor 結果ビュー
- HM-08 AI 効果データ + Learning Engine ビュー (BR-21 L3 carry)

**GD (1 画面、静的ガイド)**:
- GD-01 ガイド/ドキュメント統合ビュー (左サイドナビ 7 カテゴリ: Troubleshooting / Architecture / Onboarding / Tutorial / CLI / FAQ / Changelog)

**§3 横断原則 4 件追加** (v3 新規、CC2/CC3 採用):
- 人間主導 + AI 補助原則
- 詳細データテーブル必須 (サマリのみ画面禁止)
- AI への指示テキスト copy-paste UI
- 問題箇所視覚化 (🟢/🟡/🔴 色分け)

**§6 Bounded Context 宣言** (v3 新規、X1=a 採用): PM/HM/GD 3 カテゴリ分離、SCR-NN → PM/HM/GD-NN 移行注記

### 確認 5: L14 運用テスト設計 (OT-44 件確定、14 画面全件被覆)

`docs/test-design/harness/L1-operational-test-design.md`

- 前 31 件 (OT-01〜31) + 新規 13 件 (OT-32〜44) = **44 件確定**
- 14 画面被覆 OT: PM (OT-32〜35) / HM (OT-36〜40) / GD (OT-41) / 横断原則 (OT-42〜44)
- 孤児 0 (BR/FR-L1/SR/TR/NFR 全件被覆確認済)

## §3 G1 後 carry (Minor 5 件 + L3 carry、任意)

### Minor 5 件 (任意 carry)

1. 5 PLAN frontmatter `v2_import` フィールド schema 正本外 (機械検証 warn しない)
2. PLAN-L1-05 Step 数が他 4 PLAN と異なる (Step 8 vs 7) — 業務影響なし
3. L14 OT 合否目安「L3 送り」表現 → 観測タイミング区分追加 (L3 carry)
4. screen §4 L3 PLAN 接続記述薄い (L2 起票時に補強)
5. business §10.2 散文 → 箇条書き形式 (機械検証可能化、L3 carry)

### L3 forward carry (確定済、L3 起票時に必須参照)

- **BR-21 (AI 実行成果評価) → FR-L1-36/38/43 の L3 詳細化**
- BR-22 (AI リソース最適配分) → F3=c で保留、Phase B 再検討
- 既存 FR 拡張 7 件の AC 詳細化
- B1 (チーム規模)、B2 (gate サインオフ権限)、B3 (PoC 期間上限) → L3 業務要件で再確認
- NFR-09 rule parity (U-補-3 連動、欠番のまま L3 carry)
- Phase B telemetry (NFR-16 連動、PII redaction / GDPR / audit trail)
- **「人間主導 + AI 補助」原則を L3 全機能要件で「人間判断点」明示** (CC2 carry、v3 新規)
- **GD-01 Learning Engine 半自動更新** (BB3=b、Phase B carry)

### L2 forward carry (画面要求、v3 新規)

- 14 画面の wireframe lift (PM-01 4 階層 / HM-02 heat map / HM-03 動的配線 / HM-04 DB / GD-01 サイドナビ)
- 3 カテゴリ間 deep-link URL 設計
- PLAN-L2-01〜04 接続規約 (14 画面 `dependencies.requires`)

### L4 carry

- 14 画面の実装方式 (Tauri / Electron / 純 Web) は L4 ADR で確定

## §4 commit chain (G1 readiness 整備の全 commit)

```
30a9299 subagent guard 環境非依存 TS
b08eb7f v2-import-ledger 初期取り込み
fd64a3b OT-01〜13
8b8c065/6cd3326/f88c5e8 Audit Framework + machine/AI + dev-CI + feature-unit + human-as-residue
5208934 governance L1-L6 sub-doc + 駆動別表 + PLAN 内蔵物 + AP-11〜13
ae6bc71 v2 4 sub-doc 落とし 23 項目 (DDD + SSoT + IPA×ISO 25010 + state schema 二層)
3588cf9 FR-L1 35 件 (HELIX-workflows 47 doc 由来) v2-import-ledger §6 保存
d9992f1 L1 design 5 sub-doc 分割 (B-1) + L14 OT 量閉じ拡張 (B-3)
2a49286 PLAN-L1-01 → 5 PLAN 分割 (B-2)
d2facad business §1.4 体系自己宣言 + functional §1.1 HELIX 翻案注記
cdd6598 G1 audit Critical 4 件修正
1b148e1 G1 readiness report 起票 v1
b0d0fbf Step 1+2: 5 sub-doc + 5 PLAN + ledger + L14 OT 更新 (PO 追加ヒアリング 32 問反映、G1 readiness v2)
<本commit> Step A/B/C: 画面要求 14 画面 PM/HM/GD 全面再編 + §3 横断原則 4 件 + 3 カテゴリ Bounded Context (G1 readiness v3)
```

合計 14 commit、L1 G1 readiness v3 整備完了。

## §5 PO 最終判断依頼

以下のいずれかを返答ください:

- **(a) G1 最終 PASS サインオフ** (推奨) → **L1 凍結確定**、**L3 機能要件 sub-doc 起票** (PLAN-L3-01〜03) へ進行
- **(b) Minor 5 件の一部を G1 前に修正要請** → 該当項目を指定
- **(c) NG (追加スコープ修正)** → 追加要求 / 修正要件を指定

(a) を推奨。Critical 0 / Important 0 / Minor 5 件は任意 carry。PO 追加ヒアリング (V1〜CC3、計 32 + 4 + 約 30 問) 全件 AI 推奨採用、画面要求 14 画面 PM/HM/GD 全面再編完了。

---

**evidence** (PO がスキャン読みで詳細確認できる順):

- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- L1 要件定義書: `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- v2 取り込み軌跡: `docs/migration/v2-import-ledger.md` (§5 A-25〜A-36 + §6)
- L1 5 sub-doc: `docs/design/harness/L1-requirements/*.md`
- L1 5 PLAN: `docs/plans/PLAN-L1-0{1,2,3,4,5}-*.md` (PLAN-L1-03 は v3)
- L14 OT: `docs/test-design/harness/L1-operational-test-design.md` (OT-44 件)
- 監査結果: Phase 1 acdc5ccd + Phase 2 4 subagent (ad3c4989/aba43aef/a39bf4b8/ae9d79db) + Phase 3 Step A/C (ac2517e7/a008e781)
