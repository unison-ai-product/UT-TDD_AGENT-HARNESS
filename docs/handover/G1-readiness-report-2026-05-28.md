---
doc_id: G1-readiness-report-2026-05-28
title: "L1 G1 readiness report — PO サインオフ最終判断材料 (v2: 追加ヒアリング 32 問完了反映)"
status: ready-for-PO-final-signoff
created: 2026-05-28
updated: 2026-05-28
owner: PM (Opus)
related_audit: Agent acdc5ccd6f31ae951 (pmo-sonnet 再被覆監査) + 追加 4 subagent (画面/業務/論点/統合)
---

# L1 G1 readiness report (2026-05-28、v2 最終版)

> **判定**: **PASS** (Critical 0 / Important 0 / Minor 5 任意 carry、PO 追加ヒアリング 32 問全件採用済み)
> **PO に求める判断**: L1 業務要求の **G1 ゲート凍結最終サインオフ** (5 sub-doc + 5 PLAN + L14 OT 31 件の pair freeze、L3 起票への進行承認)

## §1 サマリ (PO スキャン用、これだけ読めば判定可能)

| 項目 | 状態 |
|---|---|
| **L1 5 sub-doc** (v2 HELIX-workflows 正本構造 + PO 追加ヒアリング 32 問反映) | ✅ 起票完了 (business 298 行 / functional 拡張 / screen 202 行 / technical 188 行 / nfr 142 行) |
| **L1 5 PLAN** (各 PLAN ヒアリング項目を ✅ 確定マーキング済み、DoD 全件 ✅) | ✅ 起票完了 (PLAN-L1-01〜05) |
| **L14 運用テスト設計** (OT-01〜31、5 sub-doc 量閉じ、孤児 0) | ✅ 起票完了 (新規 OT-18〜31 = 14 件追加) |
| **FR-L1 機能要求** (HELIX-workflows 由来 35 + PO directed 新規 6 = 41 件確定) | ✅ functional §1 (P0: 18 / P1: 18 / P2: 5) |
| **NFR 体系** (IPA 6 大項目 + ISO 25010 二軸タグ、NFR-16 新規追加) | ✅ NFR-14 件 (NFR-01〜08 + NFR-11〜16、NFR-09/10 連動欠番) |
| **BR 業務要求** (BR-01〜08 + UX-01〜03 + BR-21 新規) | ✅ business §1.2 + §11 BR-21 (AI 実行成果評価) |
| **業務 KPI** (D-01〜D-09) | ✅ business §6.5 (gate 通過率 ≥90% / W-model 順序遵守違反 0 等) |
| **ステークホルダー権限分離** (S-01〜S-05、harness 運用者ロール追加) | ✅ business §4 (5 ロール、AI = commit 禁止、運用者 = state 編集権) |
| **9 mode 統一合流原則 + Add-feature 例外** | ✅ business §3.3.1 + technical §6 (Reverse closure mechanism 共通再利用、Add-feature は直接 Forward 差分) |
| **画面要求** (SCR 7 画面、SCR-08 統合 / SCR-11 新規、6 遷移シナリオ) | ✅ screen §1 + §2 (情報要素 / 操作要素 / 更新頻度 / 状態種別 全画面詳細化) |
| **DDD ドメイン entity** (12 entity + skill/detector 参照注記) | ✅ business §10 + §10.4 (entity 化なし、B9=c 採用) |
| **subagent guard** (環境非依存 TS、許可リスト 15 / model 明示 / fail-close) | ✅ 実装済 (commit 30a9299) |
| **追加 4 subagent 監査** (画面 48 問 + 業務 48 問 + 統合 20 機能 + Reverse 合流) | ✅ 全件 AI 推奨で PO 承認、5 sub-doc + 5 PLAN + ledger + OT に反映 |

## §2 G1 PO サインオフ確認事項

PO は以下 4 点を確認し OK / NG を判断:

### 確認 1: L1 業務要求 (BR-01〜08 + UX-01〜03 + BR-21) の正本確定

`docs/design/harness/L1-requirements/business-requirements.md` (298 行)

- BR-01〜08: 既存 8 件 (L0-L14 通し / 複数人 team / AI 委譲安全 / PoC 契約化 / PLAN lint / ダッシュボード / デグレ禁止 / doc 品質)
- UX-01〜03: 既存 3 件 (3 バランス価値 / ダッシュボード体験 / next_action 明確)
- **BR-21 新規** (F2=a 採用): AI 実行成果の継続評価と改善サイクル (P2、Phase B 中心、FR-L1-36/38/43 L3 carry)
- **§1.4 体系自己宣言** MVP 業務最重要 3 要素確定 (B10=a): V-model + Forward / 4 artifact + 3 段階 freeze / AI ガード
- **§3.3.1 9 mode 統一合流原則** + Add-feature 例外注記
- **§4 ステークホルダー** harness 運用者ロール追加 (S-04)
- **§6.5 業務 KPI D-01〜D-09** 表 (gate 通過率 ≥90% 等)
- **§10.4 skill/detector 参照注記** (B9=c、entity 化なし)

### 確認 2: L1 機能要求 (FR-L1 41 件 = HELIX 由来 35 + PO directed 6) の正本採用

`docs/design/harness/L1-requirements/functional-requirements.md` + `docs/migration/v2-import-ledger.md §6`

- **P0 18 件**: V字全工程 PLAN / TDD 強制 / 4 artifact trace / decision-deterministic gate / state 一元管理 / state 自動登録 / mode routing / AI ガード / Recovery 収束 / cross-cutting / 文脈注入 / Forward / Reverse / Discovery / Incident / CI/PR / 横断検出
- **P1 18 件** (12 既存 + 6 新規 PO directed): Learning Engine / 観測計測 / W字ゲート / FE detector / Scrum / Add-feature / Refactor / Retrofit / Research / W 2 段設計 / 画面設計 / フロントデザイン / **FR-L1-37 model 推挙** / **FR-L1-39 タスク難易度** / **FR-L1-40 drive 別 state** / **FR-L1-41 drive 自動判定** / **FR-L1-42 provider 間引継ぎ (Claude↔Codex)** / **FR-L1-44 途中導入 onboarding**
- **P2 5 件**: コンテキスト管理 / フォルダ構成 / 資産棚卸 / 穴管理 / 整備状況可視化
- **L3 forward carry**: FR-L1-36 (skill 評価) / FR-L1-38 (model 評価) / FR-L1-43 (PoC 計測) (BR-21 経由、P2)
- **既存 FR 拡張**: FR-L1-06/08/12/14/16/19/20 (7 件、※ extended 注記)
- **§2 利用シナリオ**: 既存 5 + 新規 3 (Refactor / Retrofit / Recovery) = 8 シナリオ

### 確認 3: L1 非機能要求 (NFR-14 件、IPA 6 大項目準拠 + NFR-16 新規)

`docs/design/harness/L1-requirements/nfr.md` (142 行)

| IPA 大項目 | NFR |
|---|---|
| 可用性 | NFR-01 (cross-platform) / NFR-06 (fail-close) / **NFR-16 (onboarding 互換性)** |
| 性能・拡張性 | NFR-07 (実務完成度) / NFR-12 (machine×AI 2 層) / NFR-15 (server-optional + Claude↔Codex handover 注記) |
| 運用・保守性 | NFR-02 (更新性) / NFR-05 (GitHub 正本) / NFR-08 (実装宣言真実性) / NFR-13 (dev-local+CI + gate 通過率 ≥90% 注記) / NFR-14 (human-as-residue + agent guard bypass 監査注記) |
| 移行性 | NFR-04 (言語非依存) / NFR-03 (AI mode 非依存) |
| セキュリティ | NFR-11 (GHA 役割分離) + concept §2.4 5 段階 + OWASP + EU AI Act Article 14 + **agent guard bypass = PO 承認 + audit (B6=b)** |
| システム環境 | NFR-01 / ADR-001 (TS/Bun) |

### 確認 4: L1 画面要求 (SCR 7 画面、SCR-11 新規、6 遷移)

`docs/design/harness/L1-requirements/screen-requirements.md` (202 行)

- SCR-01〜07 + **SCR-11 (doctor 結果ビュー、S7=a)**、SCR-08 (Mode ステータス) は SCR-01 ヘッダー統合 (S4=a)
- 各 SCR で **情報要素 + 操作要素 + 更新頻度 + 状態種別** 詳細化
- 6 遷移シナリオ (S10=b、Recovery 復帰 + Discovery 追加)
- Desktop 専用 (S9=a、モバイル非対応)
- 30 秒ポーリング (S2=b、WebSocket 不使用)
- PLAN ビュー = パース構造化 (S3=b)
- Handover セッション開始時 auto 表示 (S6=a)
- Recovery ロールバック = CLI コマンドコピー (S5=b、UI 直接実行なし)

## §3 G1 後 carry (Minor 5 件、任意 carry、L3 着手前に解決推奨)

旧 Important 8 件は本 v2 で全件解決済み (PO 追加ヒアリング 32 問採用で吸収)。

### Minor 5 件 (任意 carry)

1. 5 PLAN frontmatter `v2_import` フィールド schema 正本外 (機械検証で warn しない)
2. PLAN-L1-05 Step 数が他 4 PLAN と異なる (Step 8 vs 7) — 業務影響なし
3. L14 OT 合否目安「L3 送り」表現 → 観測タイミング区分追加 (L3 carry)
4. screen §4 L3 PLAN 接続記述薄い (L2 起票時に補強)
5. business §10.2 散文 → 箇条書き形式 (機械検証可能化、L3 carry)

### L3 forward carry (確定済、L3 起票時に必須参照)

- BR-21 (AI 実行成果評価) → FR-L1-36/38/43 の L3 詳細化
- BR-22 (AI リソース最適配分) → F3=c で保留、Phase B 再検討
- 既存 FR 拡張 7 件の AC 詳細化
- B1 (チーム規模)、B2 (gate サインオフ権限)、B3 (PoC 期間上限) → L3 業務要件で再確認
- NFR-09 rule parity (U-補-3 連動、欠番のまま L3 carry)
- Phase B telemetry (NFR-16 連動、PII redaction / GDPR / audit trail)

## §4 commit chain (G1 readiness 整備の全 commit、本 commit 含む)

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
<本commit> Step 1+2: 5 sub-doc + 5 PLAN + ledger + L14 OT 更新 (PO 追加ヒアリング 32 問反映)
```

合計 13+ commit、L1 G1 readiness v2 整備完了。

## §5 PO 最終判断依頼

以下のいずれかを返答ください:

- **(a) G1 最終 PASS サインオフ** (推奨) → L1 凍結確定、L3 機能要件 sub-doc 起票 (PLAN-L3-01〜03 = 業務要件 / 機能要件 / 非機能要件) へ進行
- **(b) Minor 5 件の一部を G1 前に修正要請** → 該当項目を指定、修正後再判定
- **(c) NG (追加スコープ修正)** → 追加要求 / 修正要件を指定

(a) を推奨。Critical 0 / Important 0 / Minor 5 件は任意 carry で L3 着手前に解決する設計。PO 追加ヒアリング 32 問は全件 AI 推奨採用済み、追加論点 4 問 (Reverse 合流 + onboarding) も解消済み。

---

**evidence** (PO がスキャン読みで詳細確認できる順):

- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- L1 要件定義書: `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- v2 取り込み軌跡: `docs/migration/v2-import-ledger.md` (§5 A-25〜A-32 + §6)
- L1 5 sub-doc: `docs/design/harness/L1-requirements/*.md` (business/functional/screen/technical/nfr)
- L1 5 PLAN: `docs/plans/PLAN-L1-0{1,2,3,4,5}-*.md`
- L14 OT: `docs/test-design/harness/L1-operational-test-design.md` (OT-01〜31)
- 監査結果: Phase 2 acdc5ccd6f31ae951 (CONDITIONAL PASS → PASS) + Phase v2 追加 4 subagent (ad3c4989 + aba43aef + a39bf4b8 + ae9d79db)
