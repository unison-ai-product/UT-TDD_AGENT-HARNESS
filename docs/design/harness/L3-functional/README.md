---
layer: L3
doc_type: index
status: confirmed
parent_doc: docs/design/harness/L1-requirements/
created: 2026-05-28
updated: 2026-06-02
---

# L3 機能要件 sub-doc (harness)

L1 業務要求 / 機能要求 / NFR を L3 機能要件 (FR-* + AC-* + IPA グレード値) に詳細化する sub-doc 群。

## 構成 (3 sub-doc)

| sub-doc | 役割 | status | 担当 PLAN |
|---------|------|--------|-----------|
| `functional-requirements.md` | FR-* + AC-* (Given-When-Then) 詳細化、画面紐付き / mode / drive / 人間判断点 | draft | PLAN-L3-01-functional-detail |
| `business-detail.md` | BR-21 詳細化 + HM-08 連動 + FR-L1-36/38/43 (Learning Engine、Phase B carry) | draft | PLAN-L3-02-business-detail |
| `nfr-grade.md` | NFR-01〜17 の IPA グレード Lv + 受入閾値 + 測定方法 + pass 条件 | draft | PLAN-L3-03-nfr-grade |

> **scope 分離**: L3 では screen / technical sub-doc を起こさない。screen は L1 + L2-screen で完結 (L10 UX 磨きへ continue)、technical は L4 ADR / L4 基本設計に直送。

## companion doc (sub_doc ではない)

| doc | 役割 | status |
|-----|------|--------|
| `roadmap.md` | 検証/改善ロードマップ (L0-L14 を横断する 7 フェーズ + 2 ゲート、PO /goal 2026-06-04)。L3 マイルストーンで起票する**設計層の計画 doc**。V-model の標準 sub_doc (テスト設計と pair する artifact) ではなく、L12 受入テストとは pair しない companion。CLAUDE.md Read Order / AGENTS.md Core Reads が常時参照する | draft |

> roadmap.md は `sub_doc` enum (functional-requirement / business-requirement / nfr-grade) の対象外。G3 pair freeze の trace 対象にも含めない (pair artifact を持たないため)。詳細・配置根拠は roadmap.md §6 / IMP-036 を参照。

## L1 ↔ L3 ↔ L12 接続

- **上流 (L1 baton)**: L1 5 sub-doc + L2-screen placeholder を全件 `dependencies.requires` で列挙 (G1-trace R4 充足規約、screen §4.1 参照)。L2-screen は L3 の未充足依存ではなく、L2 着手時に PLAN-L2-01〜04 で本起票する明示 carry として扱う。
- **下流 (L3 → L12 pair)**: 本 sub-doc 3 件全体 ↔ `docs/test-design/harness/L3-acceptance-test-design.md` 1 doc (V-model L3↔L12 pair)
- **下流 (L3 → L4)**: L4 PLAN (PLAN-L4-01〜05) は本 sub-doc 全件を `dependencies.requires` に列挙

## 横断原則継承 (CC2 carry)

screen §4.1 で carry 宣言した「人間主導 + AI 補助原則 (CC2)」を L3 全機能要件で「**人間判断点**」明示として強制する (各 FR-* に「人間判断点」列、各 NFR-* に PO 承認必須範囲明示)。

## G3 ゲート (L3 pair freeze)

L3 3 sub-doc + L12 受入テスト 1 doc の pair freeze を **G3** で確定する。**正規式モデル (PLAN-RECOVERY-02)**: L3 の検証本質 = 本番受入 (L12)。画面要求は L1 (screen sub-doc) が担い L3 では起こさない (L2=L1 フェーズ分離、本 README §scope 分離と一致)。G3 内 sub-gate 候補 (L1 G1-trace と同様の構造):

- **G3-content**: 各 sub-doc の必須 § 完備
- **G3-pair**: L3 sub-doc ⇔ L12 受入テスト pair 整合
- **G3-trace**: FR-L1 → FR-L3 / FR-L3 → AC / AC → 受入テスト / NFR → 閾値 → 受入テスト の 4 方向 trace 整合 (機械検証、`ut-tdd plan lint --gate G3-trace`)

詳細は L3 sub-doc 本起票 + PLAN-L3-01〜03 Step 6 で確定する。`ut-tdd plan lint --gate G3-trace` は L7 実装済みで、G3-trace は `ut-tdd doctor` の hard gate としても集約される。G3 freeze 前は機械検証結果と L12 acceptance test design の宣言 trace を合わせてレビューする。
