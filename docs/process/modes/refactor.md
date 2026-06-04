> **正本化済** (PLAN-REVERSE-01 で DISCOVERY-04 dogfood 実績から正本化、2026-06-04)。docs/process は forward/modes/gates の運用正本。規範変更は concept/requirements (上位正本) 先行 → 本 dir へ反映する。

# Refactor 駆動モデル

出典: concept v3.1 §2.5 (Refactor mode) / §2.6.1 (signal→mode routing) / requirements v1.2 §1.3 VALID_KINDS / §1.6 kind×drive matrix / §1.8 必須 role

---

## 1. 概要

振る舞いを変えず内部構造を改善する mode。機能追加でもバグ修正でもない **純粋な技術的負債解消**。

| 項目 | 値 |
|------|-----|
| kind | `refactor` |
| drive | `be` / `fe` / `fullstack` / `db` / `agent` |
| layer | `L7` |
| workflow_phase | **禁止** (phase なし) |
| owner | `se` + `tl` |
| 承認者 | — (人間サインオフ不要) |
| 自動 routing signal | `debt_degradation` / `code_smell` / `structural` |

---

## 2. phase / フロー構成

```
保護網整備 → 小ステップ変更 → テスト緑確認 → commit → 反復
```

| Step | 内容 | 成果物 |
|------|------|--------|
| 1. 保護網整備 | テストが無ければゴールデンマスターで現挙動を固定 | テストコード (④) |
| 2. 小ステップ変更 | 一度に大きく変えず、責務分離・命名改善・重複排除を小刻みに | 実装差分 (②) |
| 3. テスト緑確認 | 各ステップで `vitest run` / `ut-tdd gate G7` (既存テスト) を実行 | CI pass 記録 |
| 4. commit | ステップごとに `refactor(scope): ...` メッセージで記録 | commit log |
| 5. 反復 | 目標負債解消まで 1-4 を繰り返す | — |

---

## 3. exit 条件

| 条件 | 検証方法 |
|------|---------|
| 振る舞い不変 | L8/L9 既存テスト全件緑維持 |
| 負債解消 | PLAN 起票時に記述した対象 (code_smell / structural) の解消記録 |
| 4 artifact trace 維持 | G7 directed edge (② ↔ ③ / ② ↔ ④) が欠落しないこと |

---

## 4. Forward 合流点

- **L7 内部改善のみ** — L1 要求・L4 設計は不変。合流先の設計文書を書き換えない。
- L8/L9 は保護網として**流用** (追加 test design 不要)。
- 振る舞い変化が判明した場合は直ちに中断 → 機能追加なら Add-feature、開発中バグなら `troubleshoot`、本番障害なら Incident へ切替。

---

## 5. 必須 role / 承認者

| role | 責務 |
|------|------|
| `se` | 実装変更主体 (worker class) |
| `tl` | リファクタ方針レビュー・G7 確認 (frontier-reviewer class) |

人間サインオフは不要。ただし L8/L9 が赤になった場合は tl が判断ゲートを持つ。

---

## 6. 他 mode との連鎖 / 注意

| 状況 | 遷移先 |
|------|--------|
| 機能を追加したくなった | Add-feature へ切替 |
| バグを直したくなった | 開発中は `troubleshoot`、本番障害は Incident へ切替 |
| 依存・基盤の更新が必要 | Retrofit へ切替 (Refactor より広い) |
| `code_smell` signal が自動検出 | detection-routing 経由で本 mode に自動 routing (§2.6.1) |

注: kind=refactor の PLAN は `parent_design` 任意、`workflow_phase` フィールドを持ってはならない (validator fail-close)。
