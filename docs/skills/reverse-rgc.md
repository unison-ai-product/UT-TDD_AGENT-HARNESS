---
schema_version: skill.v1
name: reverse-rgc
skill_type: drive-reverse
applies_to:
  layers: [L6, L8]
  drive_models: [Reverse, Retrofit, Refactor]
upstream: vendor/helix-source/skills/workflow/reverse-rgc
---

# Reverse RGC: Gap Closure

Forward UT-TDD の L6/L8 pass 後に、Reverse で特定した gap が閉塞したか検証する。

## 適用タイミング

- Forward UT-TDD の L6/L8 通過後
- Reverse で特定した gap の閉塞確認を実施する時
- `docs/reverse/rgc/` 配下に証跡束を作成する時

---

## 1. RGC の目的

RGC は Forward 実装完了後に、Reverse で発見した gap が本当に閉じたかを再検証する層である。

目的:
- Forward pass と Reverse gap 閉塞を接続する
- `gap_register` の open/partial/closed を確定する
- 閉塞済み gap の証拠を束ねる
- 未閉塞 gap を次ループへ戻す

---

## 2. 前提条件

実行前に以下を満たす:
- Forward の L6 または L8 が `pass`
- `docs/reverse/gap_register.md` が存在
- 各 gap に owner と routing が定義済み

重要: 閉塞判定の完全自動化は前提としない。**手動検証を正**とし、自動集計ツールは補助として利用する。

---

## 3. 入力と出力

### 入力
- `docs/reverse/gap_register.md`
- Forward 側の検証証跡（テスト/デプロイ/承認）

### 出力
- `docs/reverse/rgc/RGC-evidence-bundle.md`
- 必要に応じて `docs/reverse/rgc/RGC-summary.yaml`

---

## 4. Evidence Bundle テンプレート

```markdown
# RGC Evidence Bundle

## メタ情報
- generated_at: YYYY-MM-DD
- source_gap_register: docs/reverse/gap_register.md
- forward_status: L6 pass / L8 pass

## Gap Closure Matrix
| gap_id | closure_status | closure_evidence | test_ref | deploy_ref | po_approval |
|---|---|---|---|---|---|
| GAP-001 | closed | 入力値バリデーション追加で再発なし | tests/api/order.spec.ts#negative_amount | deploy-2026-04-16-01 | PO-2026-04-16 |
| GAP-002 | partial | 設計修正は完了、移行タスク残 | tests/arch/service-boundary.spec.ts | deploy-2026-04-16-01 | pending |

## Open Gap
- GAP-002: 残課題と次 routing を明記
```

必須列: `gap_id` / `closure_evidence` / `test_ref` / `deploy_ref` / `po_approval`

---

## 5. 閉塞判定ルール

判定値:
- `closed`: 再発防止証拠あり、受入条件を満たす
- `partial`: 一部解消、残課題あり
- `open`: 未解消

判定基準:
- test ref が再現テストとして有効
- deploy ref が該当修正を含む
- PO 承認が必要な gap は承認が付与済み

判定禁止:
- 証拠が口頭のみ
- test/deploy のいずれかが欠けている

---

## 6. R4 gap_register 参照ルール

RGC は R4 出力を正本入力として扱う。

参照時の必須チェック:
- `gap_id` が一意
- `routing` が空でない
- `status` が open/partial/closed のいずれか

不整合時: R4 に差し戻して gap_register を修正。RGC を一時 `blocked` にする。

---

## 7. L8 受入との紐付け

- L8 pass は Forward 受入の証拠
- RGC pass は Reverse gap 閉塞の証拠

紐付け方法:

```yaml
acceptance_link:
  forward_acceptance_ref: L8-acceptance-2026-04-16
  po_approval: PO-2026-04-16
```

---

## 8. open_gap 残存時のエスカレーション

open または partial が残る場合:
1. 残存 gap を列挙
2. 次の routing（L1-L4）を再設定
3. owner と期限を再設定
4. 人間承認が必要な項目をエスカレーション

必須エスカレーション対象:
- 本番影響
- 認証/決済
- 個人情報
- ライセンス

---

## 9. 運用シーケンス

```text
Forward L6/L8 pass
  -> R4 gap_register 読み込み
  -> Evidence Bundle 作成
  -> gap ごとに closed/partial/open 判定
  -> open_gap の再 routing
  -> RGC 結果確定
```

---

## 10. 完了判定

RGC を `done` とする条件:
- `docs/reverse/rgc/RGC-evidence-bundle.md` が存在
- 全 gap に `closure_evidence` が記載
- open_gap は次 routing と owner が設定済み
- L8 受入参照が記録済み

## type 別 operational notes

| type | phase-specific action | skip / gate note |
|---|---|---|
| code | gap closure を Forward 完了後に検証 | 全 gap closed で RGC pass |
| design | UX/UI の閉塞検証 | 全 gap closed で RGC pass |
| upgrade | (RGC skip) | upgrade 完了で代替判定 |
| normalization | drift normalize 後の閉塞検証 | normalize 反映で RGC pass |
| fullback | 文書 alignment 完了の閉塞検証 | 文書整合で RGC pass |
