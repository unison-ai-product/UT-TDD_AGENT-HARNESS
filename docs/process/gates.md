> **PROVISIONAL SPIKE** (PLAN-DISCOVERY-04 S1)。正本でない。終点後 Reverse で実績から再整備される。

# ゲート体系 (G0.5-G14) — Forward + mode 横断集約

出典: concept v3.1 §3.1 各層 gate / requirements v1.2 §2.2 Pair freeze + trace freeze / §7.8.3 requires_human_approval 承認者 / §7.8.5 横断検出

---

## 1. gate 一覧表

| gate | タイミング (L 遷移) | 確認対象 | fail 時動作 |
|------|-------------------|---------|------------|
| **G0.5** | L0 → L1 | 企画書が L1 業務要求へ trace できるか (軽量: 方向性・整合破綻のみ) | block → L0 修正 |
| **G1** | L1 完了 | 3 sub-gate 全通過: G1-content (5 sub-doc 揃い) / G1-pair (L1↔L14 OT ペア孤児 0) / G1-trace (BR/UX→画面 trace) | block → 当該 sub-gate へ戻る (fail-close、§2.2) |
| **G2** | L2 完了 | ワイヤーモック / 画面要求凍結 | block → L2 修正 |
| **G3** | L3 完了 | FR+AC ⇔ 受入テスト設計 ペア凍結 / AC 不在 → fail | block → L3 修正 |
| **G4** | L4 完了 | アーキ/ADR ⇔ 総合テスト設計 ペア凍結 | block → L4 修正 |
| **G5** | L5 完了 | D-API/D-DB/D-CONTRACT ⇔ 結合テスト設計 凍結 (API/Schema Freeze) | block → L5 修正 |
| **G6** | L6 完了 | 関数 signature + WBS ⇔ 単体テスト設計 凍結 | block → L6 修正 |
| **G7** | L7 完了 | 4 artifact trace freeze: ① 4 artifact 揃い / ② 必須 8 directed edge 全充足 / ③ coverage ≥ 80% — **3 条件いずれか欠落 → exit 1** (§2.2 R-C3 fix) | exit 1 → L7 差分修正 |
| **G8** | L8 完了 | 結合テスト品質 (概念定義、機械化は将来 PLAN) | block → L8 修正 |
| **G9** | L9 完了 | 総合テスト品質 (概念定義、機械化は将来 PLAN) | block → L9 修正 |
| **G10** | L10 完了 | UX 磨き品質 (概念定義) | block → L10 修正 |
| **G11** | L11 完了 | 総合レビュー + UAT (概念定義) | block → L11 修正 |
| **G12** | L12 完了 | デプロイ + 受入テスト通過 | block → L12 修正 |
| **G13** | L13 完了 | デプロイ後検証 (概念定義) | block → L13 修正 |
| **G14** | L14 完了 | 運用検証 (概念定義) | block → L14 修正 |

注: G8-G14 の機械検証条件は概念定義に留まる。機械化は将来の個別 PLAN で詳細設計する (§2.2 末尾、**PLAN 未起票 — Reverse 正本化後に起票し PLAN_ID をリンクで埋める**)。G1-G7 は §2.2 段階 A/B で機械化済み (または計画済み)。

---

## 2. G7 (4 artifact trace freeze) 詳細

G7 は L7 実装完了の唯一の exit gate。以下 3 条件をすべて満たすまで exit 1 で block する (§2.2 段階 B、R-C3 fix)。

| 条件 | 内容 |
|------|------|
| ① 4 artifact 揃い | ① 設計 (docs/design/) / ② 実装コード (src/) / ③ テスト設計 (docs/test-design/) / ④ テストコード (tests/) が対象スコープ分揃っていること |
| ② 必須 8 directed edge | §2.4 で定義された ① ↔ ②、① ↔ ③、② ↔ ④、③ ↔ ④ の 8 方向すべてに孤児が無いこと |
| ③ coverage ≥ 80% | `ut-tdd gate G7` が coverage 80% 以上を確認 |

詳細メカニクス: `docs/process/forward/` 各 L 定義 (将来 L07-implementation.md §4) に委譲。G7 は trace freeze の集約 entry point として機能する。

---

## 3. 人間サインオフ必須ゲート (§7.8.3)

以下のゲート/条件は **承認記録なしで当該コマンドを実行すると exit 1** (§7.8.3)。承認記録は `.ut-tdd/audit/` に append。

| 引き金 mode/条件 | 承認者 (人間サインオフ) | 備考 |
|-----------------|----------------------|------|
| **Recovery 起動** | `tl` (リオープン確認) + `po` (スコープ承認) | `recovery` mode 開始時 |
| **prod Incident** (`env=prod`) | オンコール + `tl` + `pm` の三者 | `env=prod` または `regression_prod` signal |
| **config_drift Retrofit** | `tl` 単独 (環境影響限定) | `config_drift` signal の Retrofit 起動時 |
| **L0 G0.5** (frontier-reviewer adversarial) | `frontier-reviewer` (別 runtime) | `hybrid` mode 時。`standalone`/`claude-only` 時は subagent self-review で代替 (§7.8.2) |
| **L12 リリース承認** | `po` サインオフ必須 | デプロイ + 受入完了後の本番リリース |

---

## 4. 横断検出ゲート (§7.8.5)

`ut-tdd doctor` / `ut-tdd plan lint` に束ねられる横断検出器。いずれも fail-close で該当 mode への接続を強制する。

| 検出器 | fail 条件 | 接続先 mode |
|--------|----------|------------|
| `drift-check` (schema/contract drift) | 設計↔実装のコントラクト不一致 | **Reverse** (normalization) |
| `connection-deficiency` (§7.8.7 DEP-2) | コンポーネント間接続の欠損 | **Reverse** または **Refactor** (影響範囲による) |
| `relation-graph` (DEP-1) | orphan / cycle / レイヤリング違反 | **Refactor** または **Reverse** |
| `test-perspective-gate` (TST-2) | テスト観点の抜け / レベル間重複 | 当該 L の設計層へ差し戻し (G1-G6 再通過) |
| `doc-drift` | 設計文書と実装の乖離 (drift) | **Reverse** (R0 起点) |
| `regression_dev` (開発中回帰) | テスト緑が壊れた | **Recovery** (human approval 必須) |
| `regression_prod` (本番回帰) | `env=prod` での回帰 | **Incident** (三者承認必須) |
| `debt_degradation` / `code_smell` | コード劣化検出 | **Refactor** |
| `dependency_outdated` / `upgrade` | 依存陳腐化 | **Retrofit** (upgrade preflight 必須) |

検出は `.ut-tdd/` state を参照し、`helix.db` には依存しない (§7.8.5)。`--static-only` フラグで AI 不要の機械判定のみ実行可能。
