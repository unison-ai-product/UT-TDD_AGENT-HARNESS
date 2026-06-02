> **PROVISIONAL SPIKE** (PLAN-DISCOVERY-04 S1)。正本でない。終点後 Reverse で実績から再整備される。

# Reverse 駆動モデル

出典: concept v3.1 §2.5 (9-mode ecosystem) / §2.6.1 signal→mode (`drift`) / requirements v1.2 §1.3 kind=reverse / §1.5 workflow_phase R0-R4 / §3.3 reverse_type 別 skip 判定 / §1.8 role=po(R3) / helix-process/reverse-workflow.md (翻案元)

---

## 1. 概要

Reverse は **既存コード・設計・契約が不明な状態**から事実を集め、Forward L0-L14 に安全に接続するための逆引きフロー。drift 検出・未知設計の解明・完了実装の文書整合 (fullback) が主な trigger。Discovery 終点・Scrum increment の昇華先 (fullback) としても機能する。

### frontmatter 早見表 (README 台帳より)

| 項目 | 値 |
|------|----|
| kind | `reverse` |
| drive | 専門職継承 (be/fe/fullstack/db/agent、§1.6 V7。逆引き対象 work の専門職) |
| layer | `cross` |
| workflow_phase | `R0-R4` |
| owner | tl (R3 で po) |
| 承認者 | — (R3 で po 検証必須) |
| Forward 合流点 | R4 `forward_routing` → L1/L3/L4/L5/gap-only (schema enum 5 種) |

---

## 2. phase / フロー構成

| phase | 名称 | 主な作業 | 必須成果物 | skip 判定 (§3.3) |
|-------|------|----------|------------|-----------------|
| R0 | Evidence Acquisition | 対象 (コード/設計/設定) から証拠収集 | evidence map | — |
| R1 | Observed Contracts | API/DB/型/互換契約の観測・抽出 | observed-contracts | `design` / `normalization` type は **R1 skip** |
| R2 | As-Is Design | 現状設計・DAG・影響評価を説明可能にする | as-is-design / DAG | — |
| R3 | Intent Hypotheses | Forward に渡す仮説・gap・routing 候補を作成。**po 検証必須** | intent-hypotheses | — |
| R4 | Gap & Routing | gap を Forward 側に閉塞。`forward_routing` 必須 + `promotion_strategy` 必須 | gap-register / routing | — |

### 5 type 別 skip 判定 (§3.3)

| reverse_type | R1 skip | 備考 |
|-------------|---------|------|
| `code` | なし | R0→R1→R2→R3→R4 フル |
| `design` | R1 skip | R0→R2→R3→R4 |
| `upgrade` | なし | R4 routing が Forward 接続点、RGC なし |
| `normalization` | R1 skip | R0→R2→R3→R4 |
| `fullback` | なし | Discovery 終点・Scrum increment 昇華に使用 |

---

## 3. exit 条件

- R4 `forward_routing` が確定し、gap が Forward 側で閉塞
- open gap が残る場合は `debt` / `readiness-defer` / 新規 plan へ差し戻し
- R4 で Forward の既存 gate 前提を崩す結果が出た場合は該当ゲートを invalidated に戻す (`--invalidate-forward` 相当)

---

## 4. Forward 合流点

R4 `forward_routing` で動的選択。**値は schema enum `VALID_FORWARD_ROUTING` = `L1` / `L3` / `L4` / `L5` / `gap-only` の 5 種に限る** (src/schema/index.ts §3.4):

| Reverse の結論 | `forward_routing` 値 |
|---------------|---------------------|
| 要件そのものが曖昧 | `L1` (→ L1 要求 / L3 要件) または `L3` |
| 設計判断が不足 | `L4` 基本設計 |
| API / DB / contract が不明 | `L5` 詳細設計 |
| Forward に渡す確定経路が無い (gap のみ) | `gap-only` (debt/readiness-defer へ) |

> **⚠ schema gap (S3 verify 所見)**: helix-source の reverse-workflow.md は「実装だけで閉じる→L7」「運用・受入・文書整合 (fullback)→L8-L11」も routing 先に持つが、**UT-TDD の `VALID_FORWARD_ROUTING` enum (5 種) には L7 / L8-L11 が無い**。現状は L7-only / fullback 系を `gap-only` に倒すか別機構で扱う。enum 拡張要否は PLAN-DISCOVERY-04 §verify 所見として DISCOVERY-01 / schema へ feedback。

---

## 5. 必須 role / 承認者

| phase | role | 根拠 | 担当 |
|-------|------|------|------|
| R0-R2 | `tl` | §1.8 owner | 技術的な逆引き・設計復元主担 |
| R3 | `po` | requirements §1.8 R3 必須 | 仮説・intent の妥当性検証 (po 確認なし通過不可) |
| R4 | `tl` | §1.8 owner | routing 確定・gap 閉塞判定 |

---

## 6. 他 mode との連鎖 / 注意

| 接続 | 方向 | 説明 |
|------|------|------|
| Discovery | 組合せ (前段/後段) | 既存コード起因の不明点は Reverse 先行 → Discovery PoC。Discovery 終点 → Reverse fullback で昇華 |
| Scrum | 後段 (必須) | Scrum increment 完了 → Reverse fullback で V-model 正本化 |
| drift signal | 自動起動 | `drift` (schema/contract) を検出したら detection-routing 経由で自動起動 |

翻案注記: helix-process の `helix reverse code R0` 等のコマンドは `ut-tdd` CLI 実装後に置換。`--invalidate-forward` フラグは UT-TDD gate 機構として実装予定 (現状 stub)。type 別成果物ファイル命名 (R0-evidence-map.yaml 等) は helix-process §type 別成果物を踏襲しつつ UT-TDD `.ut-tdd/reverse/` パスへ格納予定。

---

出典再掲: README.md 台帳 §2 / concept v3.1 §2.5-§2.6 / requirements v1.2 §1.3/§1.5/§3.3 / helix-process/reverse-workflow.md
