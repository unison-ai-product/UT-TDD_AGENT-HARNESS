---
layer: L1
sub_doc: screen
status: draft
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L3
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: ユビキタス言語 = [L0 概念層 §10 用語集](../../../governance/ut-tdd-agent-harness-concept_v3.1.md#10-用語集) / 業界標準整合 = L0 §11 / Bounded Context = L0 §2.5 9-mode。本 doc は L0 を parent_doc reference とし、用語独自定義は行わない (anti-corruption layer)。
> **件数確定**: screen は画面候補 6〜10 件 (L1 要求レベル、L2 で具体化)。根拠: UX-02 / BR-06 / FR-L1-20/FR-L1-29 から導出 (2026-05-28)。
> **L3 接続規約**: `next_pair_freeze: L3`。L3 PLAN は本 sub-doc 全件を `dependencies.requires` に列挙する。

# UT-TDD Agent Harness — L1 画面要求 (screen)

> **PO 判断 carry**: 画面要求は L2 モック検証で lift する。本 sub-doc では業務要求視点の必要画面のみ列挙し、UI 具体化は L2 に委ねる (FR-L1-29 参照)。

## §1 画面一覧

業務要求・機能要求から導出される必要画面 (L1 要求レベル):

| 画面 ID | 画面名 | 主要目的 | 対応 BR/FR |
|---------|--------|---------|-----------|
| **SCR-01** | ダッシュボード (工程表) | 複数プロダクト / 案件の工程表・進捗・詰まり・フェーズをリアルタイム横断可視化 | BR-06 / UX-02 / FR-L1-20 |
| **SCR-02** | PLAN ビュー | 単一 PLAN の詳細確認 (工程表 / 実装計画 / generates / requires / status) | FR-L1-01 / FR-L1-04 |
| **SCR-03** | Gate 判定ビュー | ゲート通過状況・証跡一覧・fail 理由 + next_action 表示 | FR-L1-05 / UX-03 |
| **SCR-04** | Audit ビュー | AI 実行ログ・逸脱警告・budget 使用状況・agent guard 判定履歴 | FR-L1-09 / FR-L1-20 |
| **SCR-05** | Recovery ビュー | 暴走状態ログ・再開ポイント・認識訂正履歴・cutover ロールバック操作 | FR-L1-10 |
| **SCR-06** | Handover ビュー | セッション間引き継ぎ状態 (CURRENT.json の可視化)・next_action 確認 | handover / FR-L1-01 |
| **SCR-07** | Trace ビュー | 上流 ID → 下流 ID の双方向 trace 整合マップ・デグレ / 抜け漏れ一覧 | FR-L1-03 / FR-L1-18 / BR-07 |
| **SCR-08** | Mode ステータスビュー | 現在の 9 mode 位置・phase 状態・drift 状況のサマリ | FR-L1-08 / mode state |

## §2 画面遷移の要望

主要遷移シナリオ (L1 要求レベル、詳細遷移図は L2 で具体化):

### Mode 遷移時

- ダッシュボード (SCR-01) → PLAN ビュー (SCR-02): 案件クリック
- PLAN ビュー (SCR-02) → Gate 判定ビュー (SCR-03): gate 結果詳細へ
- Mode ステータスビュー (SCR-08) → Recovery ビュー (SCR-05): 暴走検出時

### Gate 通過時

- Gate 判定ビュー (SCR-03) → ダッシュボード (SCR-01): pass → 工程表更新
- Gate 判定ビュー (SCR-03) → PLAN ビュー (SCR-02): fail → next_action 参照

### Incident 発生時

- ダッシュボード (SCR-01) → Recovery ビュー (SCR-05): 障害シグナル受信
- Recovery ビュー (SCR-05) → Audit ビュー (SCR-04): audit ログ確認

### セッション再開時 (Handover)

- Handover ビュー (SCR-06) → PLAN ビュー (SCR-02): next_action に従い PLAN 参照
- Handover ビュー (SCR-06) → Mode ステータスビュー (SCR-08): phase 確認

## §3 表示・操作への要望

| 要望 | 業務的根拠 |
|------|-----------|
| **重要度・色分け表示** (gate fail = 赤 / pass = 緑 / warn = 黄) | UX-03: gate 失敗時に next_action 明確 |
| **リアルタイム更新** (hook イベント受信で自動反映) | BR-06: リアルタイム横断可視化 / FR-L1-07: state 自動登録 |
| **フィルタリング** (mode / phase / status / drive で絞り込み) | BR-06: 複数プロダクト横断。SCR-01 での案件数が多い場合に必要 |
| **next_action 明示** (gate fail 時・handover 時に「次にすること」を 1 クリックで確認) | UX-03 / BR-05 |
| **AI 実行ログの視認性** (agent guard 判定 / budget 残量 / 逸脱警告を目立つ位置に) | FR-L1-09 / Audit ビュー SCR-04 |
| **trace マップのビジュアル化** (上流→下流 ID の接続グラフ、デグレ箇所をハイライト) | BR-07 / FR-L1-03 |
| **CLI 出力との一貫性** (CLI 出力文言と画面表示文言が一致) | UX-03: オンボーディングの滑らかさ |
| **クロスプラットフォーム** (Windows / macOS / Linux ネイティブブラウザで動作) | NFR-01 |

## §4 関連 doc

L2 画面設計 sub-doc 4 種への carry:

| L2 sub-doc | 役割 | 本 L1 からの引き継ぎ |
|-----------|------|---------------------|
| `docs/design/harness/L2-screen/screen-list.md` | 画面 ID・各画面の役割確定 | SCR-01〜08 の役割定義 |
| `docs/design/harness/L2-screen/screen-flow.md` | 遷移図・条件・イベント詳細 | §2 主要遷移シナリオ |
| `docs/design/harness/L2-screen/wireframe.md` | 各画面のレイアウト・情報配置 | §3 表示要望 |
| `docs/design/harness/L2-screen/ui-element.md` | 主要 UI コンポーネント・入力/表示/操作要素 | §3 操作要望 |

その他参照:

- L1 業務要求: `docs/design/harness/L1-requirements/business-requirements.md`
- L1 機能要求: `docs/design/harness/L1-requirements/functional-requirements.md` (FR-L1-20/29/30)
- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
