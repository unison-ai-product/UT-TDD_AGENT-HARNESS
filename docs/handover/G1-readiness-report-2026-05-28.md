---
doc_id: G1-readiness-report-2026-05-28
title: "L1 G1 readiness report — PO サインオフ判断材料"
status: ready-for-PO-signoff
created: 2026-05-28
owner: PM (Opus)
related_audit: Agent acdc5ccd6f31ae951 (pmo-sonnet 再被覆監査)
---

# L1 G1 readiness report (2026-05-28)

> **判定**: **PASS** (Critical 0 / Important 8 G1 後 carry / Minor 5 任意 carry、CONDITIONAL PASS → Critical 全件解消で PASS 確定)
> **PO に求める判断**: L1 業務要求の **G1 ゲート凍結サインオフ** (5 sub-doc + 5 PLAN + L14 OT の pair freeze)

## §1 サマリ (PO スキャン用、これだけ読めば判定可能)

| 項目 | 状態 |
|---|---|
| **L1 5 sub-doc** (v2 HELIX-workflows 正本構造) | ✅ 起票完了 (business / functional / screen / technical / nfr、計 738 行) |
| **L1 5 PLAN** (各 PLAN に工程表 + 実装計画内蔵、h3 Step 形式) | ✅ 起票完了 (PLAN-L1-01〜05、計 702 行) |
| **L14 運用テスト設計** (OT-01〜17、5 sub-doc 量閉じ) | ✅ 起票完了 (孤児要求 0) |
| **FR-L1 機能要求** (HELIX-workflows 正本由来 35 件) | ✅ functional sub-doc §1 に転写完了 (P0: 18 / P1: 12 / P2: 5) |
| **NFR 体系** (IPA 非機能要求グレード 6 大項目 + ISO 25010 二軸) | ✅ NFR-01〜08 + NFR-11〜15 (13 件、09/10 は U-補-3 連動欠番) |
| **DDD ドメイン entity** (anti-corruption layer、L0 用語と 1:1) | ✅ business §10 で 12 entity 表 + L4 carry 7 項目 + SSoT 3 参照 |
| **体系自己宣言** (V-model / 9 mode / 9 駆動 / PLAN 内蔵物 等 11 項目) | ✅ business §1.4 |
| **subagent guard** (環境非依存 TS、許可リスト 15 / model 明示 / fail-close) | ✅ 実装済 (commit 30a9299) |
| **Phase 2 再被覆監査** (pmo-sonnet、機械検証相当) | ✅ Critical 0 (修正済) / Important 8 G1 後 carry / Minor 5 任意 |

## §2 G1 PO サインオフ確認事項

PO は以下 3 点を確認し OK / NG を判断:

### 確認 1: L1 業務要求 (BR-01〜08 + UX-01〜03) の正本確定

`docs/design/harness/L1-requirements/business-requirements.md`

- BR-01: AI 委譲しても 1 案件を L0-L14 通せる
- BR-02: 複数人チーム gate / レビュー / 役割境界
- BR-03: AI 実装の安全委譲 (回帰検知)
- BR-04: PoC 契約化 (独り歩き防止)
- BR-05: PLAN 単位 + phase-aware ID + 規約違反機械検知
- BR-06: ダッシュボード (リアルタイム横断可視化)
- BR-07: デグレ禁止 (ratchet 3 軸)
- BR-08: doc-reviewer (doc 品質継続レビュー)
- UX-01: 価値 3 バランス (process / safety / automation)
- UX-02: ダッシュボード体験
- UX-03: gate/lint 失敗時 next_action 明確性

### 確認 2: L1 機能要求 (FR-L1-01〜35) の HELIX-workflows 正本由来採用

`docs/design/harness/L1-requirements/functional-requirements.md` + `docs/migration/v2-import-ledger.md §6`

- P0 18 件: V字 全工程 PLAN / TDD 強制 / 4 artifact trace / decision-deterministic gate / state 一元管理 / state 自動登録 / mode 自動 routing / AI ガード / Recovery 収束 / cross-cutting / 文脈注入 / Forward / Reverse / Discovery / Incident / CI/PR / 横断検出
- P1 12 件: Learning Engine / 観測計測 / W 字ゲート / FE detector / Scrum / Add-feature / Refactor / Retrofit / Research / W 2 段設計 / 画面設計 / フロントデザイン
- P2 5 件: コンテキスト管理 / フォルダ構成 / 資産棚卸 / 穴管理 / 整備状況可視化

### 確認 3: L1 非機能要求 (NFR-13 件、IPA 6 大項目準拠)

`docs/design/harness/L1-requirements/nfr.md`

| IPA 大項目 | NFR |
|---|---|
| 可用性 | NFR-01 (cross-platform) / NFR-06 (fail-close) |
| 性能・拡張性 | NFR-07 (実務完成度) / NFR-12 (machine×AI 2 層) / NFR-15 (server-optional) |
| 運用・保守性 | NFR-02 (更新性) / NFR-05 (GitHub 正本) / NFR-08 (実装宣言真実性) / NFR-13 (dev-local+CI 二重) / NFR-14 (human-as-residue) |
| 移行性 | NFR-04 (言語非依存) / NFR-03 (AI mode 非依存) |
| セキュリティ | NFR-11 (GHA 役割分離) + concept §2.4 5 段階 + OWASP + EU AI Act Article 14 |
| システム環境 | NFR-01 / ADR-001 (TS/Bun) |

## §3 G1 後 carry (Important / Minor、L3 着手前に解決)

### Important 8 件

1. business §7 OT 参照「OT-01〜13」→「OT-01〜11」修正 (Minor-1 と統合)
2. **functional §5 BR-13〜19 参照に対応する business 本文定義不在** (PO declared 項目を business に追記要)
3. business §10.2 散文 → 箇条書き形式 (機械検証可能化)
4. technical/nfr blockquote ラベル「L3 接続規約」→「L4 接続規約」(nfr は本 commit で修正済)
5. OT-14 量閉じ根拠の明示 (P0 18 件代表 5 機能 → L3 AC で個別化)
6. PLAN-L1-03 blocks に L2 PLAN 起票後追記
7. nfr §3 NFR-02 重複記載解消
8. PLAN-L1-01 §1 baton 記述「BR-01〜19 + NFR-11〜15」の実態整合

### Minor 5 件

1. business §7 末行「OT-01〜13」数字誤り (Important-1 と統合解消可)
2. screen §4 L3 PLAN 接続記述薄い
3. 5 PLAN frontmatter `v2_import` フィールド schema 正本外
4. PLAN-L1-05 Step 数が他 4 PLAN と異なる (Step 8 vs 7)
5. L14 OT 合否目安「L3 送り」表現 → 観測タイミング区分追加

## §4 commit chain (G1 readiness 整備の全 commit)

```
30a9299 Opus-lock guard 環境非依存 TS 再生 (subagent guard 実装)
b08eb7f v2-import-ledger + BR-07/08/NFR-08 draft (v2 初期取り込み)
fd64a3b 運用テスト設計 OT-01〜13
8b8c065/6cd3326/f88c5e8 GHA Audit Framework + machine/AI + dev-CI + feature-unit + human-as-residue
5208934 governance L1-L6 sub-doc + 駆動別表 + PLAN 内蔵物 + AP-11〜13
ae6bc71 v2 4 sub-doc 落とし 23 項目 (DDD + SSoT + cross-cutting + IPA×ISO 25010 + state schema 二層 + skill 注入 + drift 解消)
3588cf9 FR-L1 35 件 v2-import-ledger §6 保存 + concept 参照
d9992f1 L1 design 5 sub-doc 分割 (B-1) + L14 OT 量閉じ拡張 (B-3)
2a49286 PLAN-L1-01 → 5 PLAN 分割 (B-2) + 工程表 + 実装計画内蔵
d2facad business §1.4 体系自己宣言 + functional §1.1 HELIX 翻案注記
cdd6598 G1 readiness audit Critical 4 件修正
```

合計 11 commit、L1 G1 readiness 整備完了。

## §5 PO 判断依頼

以下のいずれかを返答ください:

- **(a) G1 PASS サインオフ** → L1 凍結、L3 機能要件 sub-doc 起票 (PLAN-L3-01〜03 起票) へ進む
- **(b) Important / Minor の一部を G1 前に修正要請** → 該当項目を指定、修正後再判定
- **(c) NG (追加スコープ修正)** → 追加要求 / 修正要件を指定

(a) を推奨。Important 8 件 + Minor 5 件は G1 後 carry で L3 着手前に解決する設計 (CONDITIONAL PASS 条件)。

---

**evidence** (PO がスキャン読みで詳細確認できる順):

- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- L1 要件定義書: `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md`
- v2 取り込み軌跡: `docs/migration/v2-import-ledger.md` (§5 + §6)
- L1 5 sub-doc: `docs/design/harness/L1-requirements/*.md`
- L1 5 PLAN: `docs/plans/PLAN-L1-0{1,2,3,4,5}-*.md`
- L14 OT: `docs/test-design/harness/L1-operational-test-design.md`
- 監査結果: 本 report § 1 (Agent acdc5ccd6f31ae951、Critical 0 / Important 8 / Minor 5)
