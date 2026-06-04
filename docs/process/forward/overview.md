> **PROVISIONAL SPIKE** (PLAN-DISCOVERY-04 S1)。正本でない。終点後 Reverse で実績から再整備される。

# Forward ワークフロー概要 (V-model L0-L14)

出典: concept v3.1 §2.3 / §3.1 / requirements v1.2 §1.4

---

## 1. Forward とは

Forward は「要件・設計・契約が確定した状態」から **L0 企画 → L14 運用検証** を V 字で進む、UT-TDD の中核経路。
他のすべての mode (Scrum / Reverse / Discovery / Recovery / Refactor / Retrofit / Add-feature) は最終的に Forward に合流する。

---

## 2. V 字構造の 3 区画

```
左腕 (設計降下)        谷         右腕 (検証上昇)
L0 企画
L1 要求定義                        L14 運用検証
L2 画面設計                        L10 UX 磨き
L3 要件定義                        L12 デプロイ+受入
L4 基本設計                        L9 総合テスト
L5 詳細設計                        L8 結合テスト
L6 機能設計
                    L7 実装
```

| 区画 | レイヤー | 役割 |
|------|---------|------|
| 左腕 | L0-L6 | ① 設計 + ③ テスト設計 を同層でペア凍結 |
| 谷 | L7 | ② 実装コード + ④ テストコード (TDD Red 先行) |
| 右腕 | L8-L14 | 左腕ペアの ③ テスト設計を ④ テストコードとして実施 |

---

## 3. TDD-first 原則

- 左腕の各層で **① 設計 ⇔ ③ テスト設計** を同時に起票・凍結する (Pair freeze、G1-G6)。
- 谷 L7 に入る前に L6 単体テスト設計に対応する **④ テストコードを先行作成 (TDD Red)** し、その状態で実装を開始する。
- テスト設計 doc なしの「テストも書いた」は **逆ピラミッド**として G6/G7 で fail-close する (AP-8)。

---

## 4. V-pair ペア表 (左腕 ⇔ 右腕)

| 左腕 (設計層) | ③ テスト設計 (左で作成・凍結) | V-pair (右腕・実施工程) |
|--------------|------------------------------|-------------------------|
| L1 要求定義 | 運用テスト設計 | L14 運用検証 |
| L2 画面設計 | ワイヤーモック自体がペア | L10 UX 磨き |
| L3 要件定義 | 受入テスト設計 | L12 デプロイ+受入 |
| L4 基本設計 | 総合テスト設計 | L9 総合テスト |
| L5 詳細設計 | 結合テスト設計 | L8 結合テスト |
| L6 機能設計 | 単体テスト設計 | L7 実装スプリント内 |

出典: concept v3.1 §2.3 V-model 表 / requirements v1.2 §1.4 VALID_LAYERS

> **表外レイヤーの扱い (L0 / L7 / L13 / L2 ⇔ L10、IMP-039)**:
> - **L0 企画**: ③ テスト設計ペアを持たない (G0.5 は trace 軽量確認のみ)。
> - **L7 実装**: V 字の谷であり、左腕ペアの ①③ を受け取り ②④ を作る工程。ペア表の左右いずれにも現れない (表は左腕設計層のみ掲載)。
> - **L13 デプロイ後検証**: 直接の左腕ペアを持たない (L12 の続き、実環境 smoke)。
> - **L2 ⇔ L10**: L2 画面設計の ③ ペアは「**ワイヤーモック自体**」であり、L10 用の独立 test-design doc は `docs/test-design/` に作成しない (mock が ③ を兼ねる)。L2⇔L10 の右腕 doc 不在は「欠落」ではなく設計意図。

---

## 5. 4 artifact と別置き原則

| Artifact | 種別 | 配置 |
|----------|------|------|
| ① 設計 | 文書 | `docs/design/` |
| ② 実装コード | コード | `src/` |
| ③ テスト設計 | 文書 | `docs/test-design/` |
| ④ テストコード | コード | `tests/` |

① と ③ を同一文書に混在させない (AP-1/AP-2)。
③ と ④ も同一ファイルに混在させない (AP-3)。

出典: concept v3.1 §2.3 4 artifact / requirements v1.2 §2.1

---

## 6. 3 段階 freeze

| Freeze 段階 | タイミング | 凍結対象 | ゲート |
|------------|-----------|----------|--------|
| **A: Pair freeze** | L7 着手前 (各設計層) | ① + ③ ペア | G1-G6 |
| **A2: TDD Red freeze** | L7 最初のステップ | ③ + ④ 単体テスト先行 | L7 entry |
| **B: 4 artifact trace freeze** | L7 完了後 | ① + ② + ③ + ④ の 8 directed edge | G7 |

出典: concept v3.1 §2.3 3 段階 freeze

---

## 7. gate 体系 (概念)

| gate | タイミング | 確認対象 (概念) |
|------|-----------|----------------|
| G0.5 | L0 → L1 | 企画書が L1 業務要求へ trace できるか |
| G1 | L1 完了 | 5 sub-doc 揃い + L1↔L14 OT ペア + 業務⇔画面⇔機能 trace |
| G2 | L2 完了 | ワイヤーモック (or 画面要求) 凍結 |
| G3 | L3 完了 | FR+AC ⇔ 受入テスト設計 ペア凍結 |
| G4 | L4 完了 | アーキ/ADR ⇔ 総合テスト設計 ペア凍結 |
| G5 | L5 完了 | D-API/D-DB/D-CONTRACT ⇔ 結合テスト設計 凍結 (API/Schema Freeze) |
| G6 | L6 完了 | 関数 signature + WBS ⇔ 単体テスト設計 凍結 |
| G7 | L7 完了 | 4 artifact trace (必須 8 directed edge + coverage ≥ 80%) |
| G8-G9 | L8/L9 完了 | 結合・総合テスト品質 |
| G10-G14 | L10-L14 完了 | UX / UAT / デプロイ / 運用品質 |

詳細な fail-close 条件は requirements v1.2 §2.2。

---

## 8. このドキュメントの位置付けと残作業

この forward 定義は **spike (PROVISIONAL)** であり、以下は別 Step で扱う。

- 各 mode (Scrum / Reverse / Discovery / Recovery / Add-feature) の詳細 → `docs/process/modes/`
- gate の機械検証条件 → `docs/process/gates.md`
- drive 別 (be/fe/db/fullstack/agent) の挙動差異 → concept v3.1 §3.7 を参照

詳細メカニクスは carry とし、spike 完了後に Reverse (R0-R4) で実績から再整備する。
