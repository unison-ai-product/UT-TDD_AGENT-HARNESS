---
layer: L12
artifact_type: test_design
status: placeholder
pair_artifact: docs/design/harness/L3-functional/
parent_doc: docs/design/harness/L3-functional/README.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l3_functional: docs/design/harness/L3-functional/functional-requirements.md
related_l3_business: docs/design/harness/L3-functional/business-detail.md
related_l3_nfr: docs/design/harness/L3-functional/nfr-grade.md
next_pair_freeze: L3
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-28
---

# UT-TDD Agent Harness — L3 受入テスト設計 (④ / AT-*) — placeholder

> **layer**: L12 (受入テスト設計) / **artifact**: ④ 受入テスト設計 (W-model 右、② L3 全 sub-doc と対)
> **pair (W-model L3↔L12)**: `docs/design/harness/L3-functional/{functional-requirements,business-detail,nfr-grade}.md` の 3 sub-doc 全体 ↔ 本書 1 doc
> **status**: placeholder。L3 sub-doc 本起票 + PLAN-L3-01〜03 進行に合わせて本起票する
> **PLAN**: `docs/plans/PLAN-L3-{01..03}-*.md` Step 6 / DoD (3 PLAN すべての DoD で本書を参照)

## 本起票時の構造 (L1 OT 同様、軽量原則 + 量閉じ)

| § | 内容 |
|---|------|
| §0 | 量閉じ原則 (L3↔L12): 全 FR-* / AC-* / NFR-* は最低 1 AT に被覆 (孤児 = 0) |
| §1 | 受入テスト (AT-*) 本体 |
| §2 | 量閉じ一覧 (要求 → AT 被覆、孤児チェック)、sub-doc 別 |
| §3 | trace (④ → ②): AT ⇔ L3 FR-*/AC-*/NFR-* 相互 reference |

## 量閉じ予定範囲 (本起票時の対象)

- **FR-* (PLAN-L3-01 出力)**: L3 で詳細化される FR-* + AC-* (P0 18 件先行、P1/P2 は L4/Phase B carry)
- **business-detail (PLAN-L3-02 出力)**: BR-21 評価サイクル + HM-08 連動 + FR-L1-36/38/43 (Phase B carry 宣言確認)
- **nfr-grade (PLAN-L3-03 出力)**: NFR-01〜16 (14 件) の閾値達成確認 (機械検証 + 観測)

## AT-* と OT-* の違い (L14 OT との対比)

| 軸 | OT-* (L14) | AT-* (L12) |
|----|-----------|------------|
| 観点 | 運用で観測する pass 条件 (方向性) | 受入条件 (閾値 + pass 判定) |
| 粒度 | 量閉じ (要求 1 件に最低 1 OT) | AC レベル (FR の AC-* 全件に AT 対応推奨) |
| 数値しきい値 | L3 / L12 へ送り | **本書で確定** (NFR 閾値含む) |
| pair | L1 5 sub-doc ↔ L14 OT 1 doc | L3 3 sub-doc ↔ L12 AT 1 doc |

## G3-trace 機械検証連動 (L1 G1-trace と同様の構造想定)

L3 sub-doc 本起票後、`ut-tdd plan lint --gate G3-trace` で以下 4 軸の双方向 trace 整合を機械検証する (L1 G1-trace R1-R4 と同様):

- **R1**: 全 BR/UX/FR-L1 → L3 FR-* / business-detail 紐付き
- **R2**: 全 L3 FR-* → AC-* → AT-* 紐付き (孤児 FR-* 禁止)
- **R3**: 全 AT-* → L3 要求紐付き (孤児 AT 禁止)
- **R4**: NFR-* → 閾値 → AT-* 紐付き (NFR 孤児禁止)

詳細ルールは PLAN-L3-01 Step 6 / PLAN-L3-03 Step 6 で確定。
