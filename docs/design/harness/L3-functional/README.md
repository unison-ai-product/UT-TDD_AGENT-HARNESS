---
layer: L3
doc_type: index
status: placeholder
parent_doc: docs/design/harness/L1-requirements/
created: 2026-05-28
---

# L3 機能要件 sub-doc (harness)

L1 業務要求 / 機能要求 / NFR を L3 機能要件 (FR-* + AC-* + IPA グレード値) に詳細化する sub-doc 群。

## 構成 (3 sub-doc)

| sub-doc | 役割 | status | 担当 PLAN |
|---------|------|--------|-----------|
| `functional-requirements.md` | FR-* + AC-* (Given-When-Then) 詳細化、画面紐付き / mode / drive / 人間判断点 | placeholder | PLAN-L3-01-functional-detail |
| `business-detail.md` | BR-21 詳細化 + HM-08 連動 + FR-L1-36/38/43 (Learning Engine、Phase B carry) | placeholder | PLAN-L3-02-business-detail |
| `nfr-grade.md` | NFR-01〜16 の IPA グレード Lv + 受入閾値 + 測定方法 + pass 条件 | placeholder | PLAN-L3-03-nfr-grade |

> **scope 分離**: L3 では screen / technical sub-doc を起こさない。screen は L1 + L2-screen で完結 (L10 UX 磨きへ continue)、technical は L4 ADR / L4 基本設計に直送。

## L1 ↔ L3 ↔ L12 接続

- **上流 (L1 baton)**: L1 5 sub-doc + L2-screen placeholder を全件 `dependencies.requires` で列挙 (G1-trace R4 充足規約、screen §4.1 参照)
- **下流 (L3 → L12 pair)**: 本 sub-doc 3 件全体 ↔ `docs/test-design/harness/L3-acceptance-test-design.md` 1 doc (W-model L3↔L12 pair)
- **下流 (L3 → L4)**: L4 PLAN (PLAN-L4-01〜05) は本 sub-doc 全件を `dependencies.requires` に列挙

## 横断原則継承 (CC2 carry)

screen §4.1 で carry 宣言した「人間主導 + AI 補助原則 (CC2)」を L3 全機能要件で「**人間判断点**」明示として強制する (各 FR-* に「人間判断点」列、各 NFR-* に PO 承認必須範囲明示)。

## G3 ゲート (L3 pair freeze)

L3 3 sub-doc + L12 受入テスト 1 doc の pair freeze を **G3** で確定する。G3 内 sub-gate 候補 (L1 G1-trace と同様の構造):

- **G3-content**: 各 sub-doc の必須 § 完備
- **G3-pair**: L3 sub-doc ⇔ L12 受入テスト pair 整合
- **G3-trace**: FR-L1 → FR-L3 / FR-L3 → AC / AC → 受入テスト / NFR → 閾値 → 受入テスト の 4 方向 trace 整合 (機械検証、`ut-tdd plan lint --gate G3-trace`)

詳細は L3 sub-doc 本起票 + PLAN-L3-01〜03 Step 6 で確定する。
