> **PROVISIONAL SPIKE** (PLAN-DISCOVERY-04 S1)。正本でない。終点後 Reverse で実績から再整備される。

# Add-feature 駆動モデル

出典: concept v3.1 §2.5 (Add-feature mode) / requirements v1.2 §1.3 VALID_KINDS (`add-design`/`add-impl`) / §1.6 drive matrix / §1.8 必須 role / §1.10 E (dependencies.parent 必須)

---

## 1. 概要

既存システム (Forward/V-model doc 体系あり) への新機能追加 mode。フル工程をゼロから通すのではなく、**影響範囲の差分だけを追補**する。`add-design` と `add-impl` の 2 kind を内包し、独立した `add-feature` kind は存在しない。

| 項目 | 値 |
|------|-----|
| kind | `add-design` (設計追補 L3-L6) + `add-impl` (実装追補 L7) を内包 |
| drive | 親 PLAN の drive と一致 (§1.6) |
| layer | `L3`-`L7` (影響範囲による) |
| workflow_phase | **禁止** (phase なし) |
| owner | `aim` + `tl` |
| 承認者 | — (人間サインオフ不要) |
| 自動 routing signal | `feature_addition` / `scope_extension` |

---

## 2. phase / フロー構成

```
影響範囲特定 → 追加要求・要件追補 → add-design → add-impl → テスト確認 → V-model 統合
```

| Step | 内容 | 成果物 |
|------|------|--------|
| 1. 影響範囲特定 | 既存 L1-L14 doc のどこに影響するか洗い出す | 影響範囲メモ |
| 2. 追加要求・要件追補 | 必要なら L1/L3 に追補。既存 doc は不変で追記扱い | L1/L3 差分 |
| 3. add-design | L4/L5/L6 に追補設計。`dependencies.parent` に親 PLAN 必須 | add-design PLAN |
| 4. add-impl | L7 実装。`dependencies.parent` に親 impl PLAN 必須 | add-impl PLAN + ② |
| 5. 既存テスト確認 + 追加テスト | L8/L9 で既存テスト影響確認、追加テスト起票 | ③ + ④ 差分 |
| 6. V-model 統合 | 追補を該当工程ファイルに反映し、双方向 trace 更新完了 | trace 更新記録 |

---

## 3. exit 条件

| 条件 | 検証方法 |
|------|---------|
| 追補が該当工程ファイルに反映済 | docs/design/ + docs/test-design/ の差分確認 |
| 双方向 trace 更新完了 | G7 8 directed edge に孤児が無いこと |
| 既存テスト緑維持 | L8/L9 CI pass |
| `dependencies.parent` 設定済 | validator (§1.10 E) が fail-close 検証 |

---

## 4. Forward 合流点

- **既存 L1-L14 を維持しつつ L3/L7 差分を追補**。削除・上書きでなく追加記述。
- 影響範囲に応じて L1 / L3 / L4-L7 に直接接続。
- L8/L9 で既存テストへの影響を確認する。
- L11 UAT フィードバックの巻き取りは **add-design** で起票 (既存 doc を直接変更しない)。

---

## 5. 必須 role / 承認者

| role | 責務 |
|------|------|
| `aim` | 影響範囲特定・追補設計・監視 |
| `tl` | 設計判断・V-model 統合レビュー (frontier-reviewer class) |

---

## 6. 他 mode との連鎖 / 注意

| 状況 | 前段/遷移 |
|------|----------|
| 追加要件が未確定 | **Discovery** を前段に挟む (S0-S4 で仮説検証) |
| 既存設計の逆引きが必要 | **Reverse** を前段に挟む (R0-R4 で実装遡及) |
| 機能追加でなく構造改善 | **Refactor** へ切替 |
| 依存・基盤変更が必要 | **Retrofit** へ切替 |

重要注記:
- `add-design` / `add-impl` どちらも `dependencies.parent` が null の場合 validator は exit 1 (§1.10 E)。
- drive は親 PLAN と一致させる。不一致は §1.6 matrix 違反で fail-close。
- 4 artifact (①②③④) の追補セットを新規 Forward と同じ規律で揃えること (AP-8 逆ピラミッド禁止)。
