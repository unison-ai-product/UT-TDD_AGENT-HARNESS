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
> **件数確定**: screen は画面 14 件 (PM 5 + HM 8 + GD 1)、3 カテゴリ Bounded Context (PM/HM/GD)。PO 承認 2026-05-28 全件 AI 推奨採用。根拠: UX-02 / BR-06 / FR-L1-20/FR-L1-29 から導出。旧 SCR-NN 体系は廃止 (移行注記は §6 参照)。
> **L3 接続規約**: `next_pair_freeze: L3`。L3 PLAN は本 sub-doc 全件を `dependencies.requires` に列挙する。

# UT-TDD Agent Harness — L1 画面要求 (screen)

> **PO 判断 carry**: 画面要求は L2 モック検証で lift する。本 sub-doc では業務要求視点の必要画面のみ列挙し、UI 具体化は L2 に委ねる (FR-L1-29 参照)。
> **実装状態**: 全 14 画面は not-implemented (NFR-08 実装宣言の真実性)。

## §1 画面一覧

3 カテゴリ Bounded Context (DDD) に従い分類する:

- **PM** (Project Management): 案件遂行 / 動的 / PO 主 / 毎日利用
- **HM** (Harness Management): harness 改善 / 動的 / 運用者主 / 必要時利用
- **GD** (Guide & Docs): 静的知識ベース / 参照用

---

### §1.PM PM 画面群 (5 件) — V-model 駆動、案件遂行

業務目的: 進捗・担当・詰まりの把握が主眼。機能内容の詳細は PLAN ビュー link 経由で参照する。

| 画面 ID | 画面名 | 主要目的 | 対応 BR/FR |
|---------|--------|---------|-----------|
| **PM-01** | プロジェクト俯瞰ダッシュボード | 4 階層プルダウン (俯瞰 / 工程 / 割当 / 詳細) による案件横断可視化 | BR-06 / UX-02 / FR-L1-20 / FR-L1-08 |
| **PM-02** | 工程ビュー | 工程単位 deep-dive (進捗・担当・詰まりのみ、URL `/project/<案件>/L<N>`) | FR-L1-01 / FR-L1-04 |
| **PM-03** | Gate + 詰まり要因ビュー | gate 通過状況 + 証跡 + next_action + 発生中トラブル横断 | FR-L1-05 / UX-03 |
| **PM-04** | Trace ビュー | 4 artifact 双方向 trace + W-model pair 状態統合 | FR-L1-03 / FR-L1-18 / BR-07 |
| **PM-05** | Handover ビュー | CURRENT.json 可視化、起動時 auto 表示 (S6=a) | handover / FR-L1-01 |

#### §1.PM.01 PM-01 プロジェクト俯瞰ダッシュボード 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | 4 階層プルダウン: (1) 俯瞰 = 案件 × L0-L14 heat map / (2) 工程 = 選択工程の全案件横断 / (3) 割当 = 案件 × 担当負荷・AI スロット使用率 / (4) 詳細 = 案件 × 工程の sub-doc 展開。各 cell は詳細展開可能 |
| **操作要素** | プルダウン階層切替 / 案件 × L フェーズ cell クリック → PM-02 工程ビュー遷移 / フィルタ (mode/phase/status/drive) / 更新トリガー手動ボタン / gate fail 案件ハイライト |
| **更新頻度** | 30 秒ポーリング (S2=b)、gate fail 時は即時反映 (B8: ≤ 5 分) |
| **状態種別** | 正常 (緑) / 警告 (黄、drift 検出) / エラー (赤、gate fail) / 空 (PLAN 0 件) / 読み込み中 |
| **実装状態** | not-implemented |

#### §1.PM.02 PM-02 工程ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | 未完了 sub-doc 一覧 / stale PLAN list / 担当 AI スロット / carry 件数 / 工程別進捗率 / 詰まり案件一覧。機能内容の詳細は PLAN ビュー (HM-01 経由) link で参照 |
| **操作要素** | PLAN 行クリック → PM-03 Gate ビュー遷移 / carry 詳細展開 / 担当 AI スロット確認 |
| **更新頻度** | 30 秒ポーリング (S2=b)、工程変化時に即時 |
| **状態種別** | 正常 / stale あり (黄) / gate blocked (赤) / pair freeze 済 / trace freeze 済 |
| **実装状態** | not-implemented |

#### §1.PM.03 PM-03 Gate + 詰まり要因ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | gate ID / 判定結果 (pass/fail/bypass) / 証跡一覧 (artifact リンク) / fail 理由テキスト / next_action (1 アクション明示) / サインオフ者 (PO/TL) / bypass 承認記録リンク。**発生中トラブル横断**: 種別 / 検出時刻 / 影響範囲 / next_action (gate fail + drift + handover stale + 暴走シグナルを一覧化) |
| **操作要素** | next_action テキストコピー / 証跡ファイル参照リンク / AI 指示テキスト生成 (copy-paste 用) / HM-05 Audit ログ参照遷移 / PM-01 ダッシュボード戻り |
| **更新頻度** | gate 実行直後に即時表示 (B8: gate fail 即時) / 30 秒ポーリング (S2=b) |
| **状態種別** | pass (緑) / fail (赤、next_action 強調) / bypass (黄、audit 記録必須) / pending (未判定) |
| **色分け必須** | 正常/警告/失敗を即視認 (緑/黄/赤、CC3 詳細データテーブル必須・問題箇所視覚化) |
| **実装状態** | not-implemented |

#### §1.PM.04 PM-04 Trace ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | 上流 ID → 下流 ID の双方向 trace グラフ / デグレ箇所ハイライト / trace 抜け漏れ一覧 / 整合率 (D-05 対応) / PLAN 別フィルタ。**W-model pair 状態統合**: L1↔L14 / L2↔L10 / L3↔L12 / L4↔L9 / L5↔L8 / L6↔L7 の各 pair freeze 状態一覧。trace 切れ詳細行 / W-pair 未 freeze 行を詳細テーブルで表示 |
| **操作要素** | trace ノードクリック → 対象 doc リンク / フィルタ (PLAN/phase/status) / HM-07 Doctor 結果参照遷移 |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 整合 (緑) / 抜け漏れあり (赤ハイライト) / W-pair 未 freeze (黄) / 空 (trace 未登録) |
| **実装状態** | not-implemented |

#### §1.PM.05 PM-05 Handover ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | CURRENT.json 可視化 (next_action / 現 phase / 未解決 carry / 最終 gate 結果) / CURRENT.json 全項目表示 / carry 詳細一覧 / セッション引き継ぎ履歴 / archive 期限 (30 日表示) |
| **操作要素** | next_action 実行 → 該当 PM ビュー遷移 / PLAN 参照 → PM-02 工程ビュー / handover archive 確認 / next_action AI 指示テキストコピー |
| **更新頻度** | セッション開始時 auto 表示 (S6=a) / 30 秒ポーリング (S2=b) |
| **状態種別** | 引き継ぎあり (next_action 強調) / 引き継ぎなし / stale (30 日超) / 読み込み中 |
| **実装状態** | not-implemented |

---

### §1.HM HM 画面群 (8 件) — 機能可視化 + トラブル/ログ改善 + 学び

業務目的: harness 改善・診断・運用者が必要時に使用。

| 画面 ID | 画面名 | 主要目的 | 対応 BR/FR |
|---------|--------|---------|-----------|
| **HM-01** | 機能一覧ビュー | FR-L1 41 件 × implementation_status 可視化 (3 階層プルダウン) | FR-L1-20 / FR-L1-29 |
| **HM-02** | カバレッジヒートマップビュー | 機能可視化・弱点診断 (観点 8 × 軸 5 = 40 通り heat map) | FR-L1-12 / BR-06 |
| **HM-03** | 配線図ビュー | 静的アーキ + 動的エラー赤表示 (CC1=a 採用) | FR-L1-07 / FR-L1-18 |
| **HM-04** | データベース閲覧ビュー | `.ut-tdd/` state 全 table + 整合性チェック結果 (CC1=a 採用) | FR-L1-07 / FR-L1-18 |
| **HM-05** | Audit / 実行ログビュー | AI 実行ログ + agent guard 判定 + budget + skill 注入タブ統合 (S8=b) | FR-L1-09 / FR-L1-20 / FR-L1-12 |
| **HM-06** | Recovery ビュー | 暴走対応 + 再開ポイント + CLI ロールバックコマンドコピー (S5=b) | FR-L1-10 |
| **HM-07** | Doctor 結果ビュー | `ut-tdd doctor` 全量検出の構造化表示 | FR-L1-18 / `ut-tdd doctor` |
| **HM-08** | AI 効果データ + Learning Engine ビュー | BR-21 連動、skill/model 評価 + recipe 蓄積 + L3 forward carry | BR-21 / FR-L1-12 |

#### §1.HM.01 HM-01 機能一覧ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | 3 階層プルダウン: (1) 整備率% サマリ / (2) カテゴリ別 (P0/P1/P2) / (3) FR-L1-NN 機能個別。FR-L1 全 41 件を installed/partial/not-implemented + 担当 PLAN で詳細テーブル表示 |
| **操作要素** | プルダウン階層切替 / FR-L1 行クリック → 担当 PLAN 参照 / フィルタ (status/priority) / 未実装一覧エクスポート |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 整備率高 (緑) / 部分整備 (黄) / 未整備 (赤) / 空 |
| **実装状態** | not-implemented |

#### §1.HM.02 HM-02 カバレッジヒートマップビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | 観点 8 (skill/command/detector/template/state/hook/docs/tests) × 軸 5 (L/drive/mode/phase/BR-FR) = 40 通り heat map。カバレッジ密度を色密度で表現 |
| **操作要素** | heat map cell クリック → 不足項目一覧表示 + 起票候補テキスト生成 (AI 指示 copy-paste 用) / 観点・軸フィルタ切替 |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 高カバレッジ (濃緑) / 中 (黄) / 低 (赤) / 未集計 |
| **実装状態** | not-implemented |

#### §1.HM.03 HM-03 配線図ビュー 詳細 (CC1=a 採用)

| 観点 | 内容 |
|------|------|
| **情報要素** | 静的アーキ図 (コンポーネント・接続線) + **動的エラー赤表示**: hook 発火失敗 / AI provider 接続失敗 / 9 drive 区画状態。接続線詳細テーブル: 起点 / 終点 / 状態 / 最終チェック時刻 |
| **操作要素** | 接続線クリック → 詳細表示 / エラー箇所ハイライト / GD-01 Architecture ドキュメント参照リンク |
| **更新頻度** | 30 秒ポーリング (S2=b)、hook 発火失敗時は即時反映 |
| **状態種別** | 正常 (緑) / 警告 (黄) / 障害 (赤) / 未接続 (灰) |
| **色分け必須** | 動的画面で正常/警告/失敗を即視認 (緑/黄/赤、CC3 問題箇所視覚化) |
| **実装状態** | not-implemented |

#### §1.HM.04 HM-04 データベース閲覧ビュー 詳細 (CC1=a 採用)

| 観点 | 内容 |
|------|------|
| **情報要素** | `.ut-tdd/` state 全 table の行データ (raw data に近い粒度) + **整合性チェック結果**: orphan record / drift / 不正値の検出。各 table の整合性チェック結果サマリ |
| **操作要素** | table 切替 / 行フィルタ / 整合性チェック再実行トリガー / 問題行 AI 指示テキストコピー |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 整合 (緑) / orphan あり (黄) / 不正値あり (赤) / 空 table |
| **色分け必須** | 動的画面で正常/警告/失敗を即視認 (緑/黄/赤、CC3 問題箇所視覚化) |
| **実装状態** | not-implemented |

#### §1.HM.05 HM-05 Audit / 実行ログビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | invocation_log 全列: date / model / role / task / result / token / cost。agent guard 判定履歴 (allow/block/bypass) / budget 使用量 / 逸脱警告一覧 / bypass 承認記録。**skill 注入タブ** (S8=b): 推奨 skill 一覧・FR-L1-12 |
| **操作要素** | フィルタ (日付/agent/result) / skill 注入タブ切替 / bypass 詳細展開 / PM-03 Gate ビュー参照遷移 |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 正常 / bypass 使用中 (黄警告) / guard block 多発 (赤警告) / 空 |
| **実装状態** | not-implemented |

#### §1.HM.06 HM-06 Recovery ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | 暴走状態ログ (検出日時・種別) / 再開ポイント一覧 (最終正常 gate) / 認識訂正履歴 / **CLI ロールバックコマンドコピー** (S5=b、UI 直接実行なし) / cutover 状態。recovery_log 全列 + 再開ポイント候補一覧 |
| **操作要素** | CLI コマンドコピーボタン (クリップボード) / HM-05 Audit 参照遷移 / Recovery 収束後 → PM-01 ダッシュボード戻り |
| **更新頻度** | 30 秒ポーリング (S2=b) / 暴走検出時は即時通知 |
| **状態種別** | 正常 (Recovery 不要) / 暴走検出中 (赤) / ロールバック待ち (黄) / 収束済 (緑) |
| **実装状態** | not-implemented |

#### §1.HM.07 HM-07 Doctor 結果ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | `ut-tdd doctor` 全量検出結果: W-model 順序違反 / entity カバレッジ / hook 状態 / phase 整合 / carry 未解決。重要度別分類 (error/warn/info) 全行。検出件数サマリ (D-03 対応) |
| **操作要素** | 詳細展開 / PM-04 Trace ビュー参照遷移 / PM-02 工程ビュー参照遷移 / doctor 再実行トリガー / 問題行 AI 指示テキストコピー |
| **更新頻度** | doctor 実行時に即時反映 / 30 秒ポーリング (S2=b) |
| **状態種別** | クリーン (緑、0 件) / 警告あり (黄) / エラーあり (赤、D-03 = 0 件違反) / 実行前 (未取得) |
| **実装状態** | not-implemented |

#### §1.HM.08 HM-08 AI 効果データ + Learning Engine ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | BR-21 連動: skill/model 評価結果 / recipe 蓄積一覧 / AI 効果データ (task 成功率・コスト効率)。**L3 forward carry**: 詳細データテーブル仕様は L3 で確定 |
| **操作要素** | skill/model フィルタ / recipe 詳細展開 / HM-05 Audit ログ参照遷移 / GD-01 Learning 参照リンク |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | データあり (緑) / 蓄積中 (黄) / データなし (灰) |
| **実装状態** | not-implemented |

---

### §1.GD GD 画面群 (1 件) — 静的知識ベース

業務目的: 参照用ガイド・ドキュメント集約。動的更新なし。

| 画面 ID | 画面名 | 主要目的 | 対応 BR/FR |
|---------|--------|---------|-----------|
| **GD-01** | ガイド/ドキュメント統合ビュー | 左サイドナビ切替による静的知識ベース提供 | UX-03 / FR-L1-29 / FR-L1-44 |

#### §1.GD.01 GD-01 ガイド/ドキュメント統合ビュー 詳細

左サイドナビカテゴリ一覧:

| カテゴリ | 内容 |
|---------|------|
| **Troubleshooting** | 頻出トラブル + 解決手順。PM-03 gate fail / HM-03 配線図エラー / HM-04 DB 不整合 等の対処フロー |
| **Architecture** | 旧 HM-02 配線図 doc 版を統合。静的アーキ図 + コンポーネント説明 + 依存関係 |
| **Onboarding** | UT-TDD 使い方。初めての PLAN 起票 / 途中導入 FR-L1-44 連動 / 環境セットアップ手順 |
| **Tutorial** | Walk-through 形式のステップバイステップガイド |
| **CLI Reference** | `ut-tdd` コマンド一覧・オプション・使用例 |
| **FAQ** | よくある質問と回答 |
| **Changelog** | harness バージョン履歴・破壊的変更注記 |

| 観点 | 内容 |
|------|------|
| **情報要素** | 左サイドナビ (カテゴリ切替) + 右コンテンツ表示エリア (Markdown レンダリング) |
| **操作要素** | カテゴリ切替 / 内部リンク / 外部 doc 参照リンク / 検索 (Phase B) |
| **更新頻度** | 静的 (手動更新のみ)。**Phase B で Learning Engine 連動半自動更新** (BB3=b carry) |
| **状態種別** | 表示中 / ページ未存在 (404 表示) |
| **実装状態** | not-implemented |

---

## §2 画面遷移シナリオ

3 カテゴリ間 deep-link を含む主要遷移シナリオ 6 パターン (L1 要求レベル、詳細遷移図は L2 で具体化):

### シナリオ 1: Forward 通常進行 (PM 内)

- PM-01 ダッシュボード → PM-02 工程ビュー: 案件 × L フェーズ cell クリック
- PM-02 工程ビュー → PM-03 Gate + 詰まり要因ビュー: gate 結果詳細へ
- PM-03 Gate ビュー → PM-01 ダッシュボード: pass → 工程表更新確認

### シナリオ 2: Gate fail 時の next_action 参照 (PM → HM → GD 横断)

- PM-03 Gate + 詰まり要因ビュー: fail 検知、next_action 確認
- PM-03 → HM-05 Audit / 実行ログビュー: AI 実行ログ・bypass 記録確認
- HM-05 → GD-01 Troubleshooting: 解決手順参照 → AI 指示テキスト copy-paste
- 修正後 → PM-03 Gate ビュー: 再判定

### シナリオ 3: Incident 発生時 (PM → HM 横断)

- PM-01 ダッシュボード: 障害シグナル受信 (赤アラート)
- PM-01 → HM-06 Recovery ビュー: 暴走状態確認 + CLI コマンドコピー
- HM-06 → HM-05 Audit ビュー: audit ログ確認
- HM-05 → PM-01 ダッシュボード: 収束確認・mode 正常化

### シナリオ 4: セッション再開時 (Handover → PM)

- PM-05 Handover ビュー: セッション起動時 auto 表示 (S6=a)
- PM-05 → PM-02 工程ビュー: next_action に従い工程確認
- PM-02 → PM-03 Gate + 詰まり要因ビュー: 前回中断 gate の状態確認
- PM-01 ダッシュボード: 4 階層プルダウンで現在 phase 確認

### シナリオ 5: harness 弱点診断 → 改善起票 (HM → GD)

- HM-02 カバレッジヒートマップ: 弱点 cell クリック → 不足項目一覧表示
- HM-02 → HM-01 機能一覧ビュー: 該当 FR-L1 の implementation_status 確認
- HM-01 → GD-01 Architecture: アーキ構造確認 + 起票候補テキスト copy-paste

### シナリオ 6: Doctor 検出 → Trace 修正 (HM → PM)

- HM-07 Doctor 結果ビュー: エラー検出 (W-model 順序違反 / carry 未解決)
- HM-07 → PM-04 Trace ビュー: trace 切れ・W-pair 未 freeze 確認
- PM-04 → PM-02 工程ビュー: 対象 sub-doc 確認・修正
- 修正後 → HM-07: doctor 再実行で収束確認

---

## §3 表示・操作要望

### §3.1 横断原則 (CC2/CC3 採用、PO 承認 2026-05-28 全件)

| 要望 | 内容 | 適用範囲 |
|------|------|---------|
| **人間主導 + AI 補助原則** (CC2) | 画面は人間が異常検知・問題箇所特定するためのもの。AI 単独自動化に依存せず人間の判断補助を最優先。AI は CLI 経由のみ、UI 操作なし (S-01 整合) | 全 14 画面 |
| **詳細データテーブル必須** (CC3) | 各画面でサマリだけでなく raw data に近い詳細表示を提供。異常検知可能な粒度。サマリのみの画面禁止 | 全 14 画面 |
| **AI への指示テキスト copy-paste UI** | 自動修正ボタンより、人間が AI に貼り付けて指示する用のテキスト生成を優先。PM-03 / HM-04 / HM-07 で必須 | 動的画面全般 |
| **問題箇所視覚化 (色分け強化)** | 動的画面で正常/警告/失敗を即視認 (緑/黄/赤)。PM-03 Gate / HM-03 配線図 / HM-04 DB / PM-01 ダッシュボードで必須 | PM-01/PM-03/HM-03/HM-04 |

### §3.2 採用済み要望 (前 commit b0d0fbf 確定済、維持)

| 要望 | 業務的根拠 |
|------|-----------|
| **重要度・色分け表示** (gate fail = 赤 / pass = 緑 / warn = 黄) | UX-03: gate 失敗時に next_action 明確 |
| **リアルタイム更新** (hook イベント受信で自動反映) | BR-06: リアルタイム横断可視化 / FR-L1-07: state 自動登録 |
| **フィルタリング** (mode / phase / status / drive で絞り込み) | BR-06: 複数案件横断。PM-01 での案件数が多い場合に必要 |
| **next_action 明示** (gate fail 時・handover 時に「次にすること」を 1 クリックで確認) | UX-03 / BR-05 |
| **AI 実行ログの視認性** (agent guard 判定 / budget 残量 / 逸脱警告を目立つ位置に) | FR-L1-09 / Audit ビュー HM-05 |
| **trace マップのビジュアル化** (上流→下流 ID の接続グラフ、デグレ箇所をハイライト) | BR-07 / FR-L1-03 |
| **CLI 出力との一貫性** (CLI 出力文言と画面表示文言が一致) | UX-03: オンボーディングの滑らかさ |
| **クロスプラットフォーム** (Windows / macOS / Linux ネイティブブラウザで動作) | NFR-01 |
| **Desktop 専用** (S9=a、モバイル非対応。レスポンシブ対応範囲外として明示) | S9=a PO 承認 2026-05-28 |
| **30 秒ポーリング更新** (S2=b、WebSocket 不使用。全画面共通の更新間隔) | S2=b / B8: ≤ 5 分 |
| **PLAN ビューはパース構造化表示** (S3=b、原文テキスト表示でなく frontmatter / セクション構造を解析して表示) | S3=b / FR-L1-01 |
| **Recovery ロールバックは CLI コマンドコピー** (S5=b、UI から直接ロールバック実行しない。CLI コマンドをクリップボードコピーする UI のみ提供) | S5=b / 安全性担保 |
| **Handover セッション開始時 auto 表示** (S6=a、セッション起動時に CURRENT.json が存在すれば PM-05 を先頭表示) | S6=a / `ut-tdd session start` |
| **dark mode 不要、light モードのみ** (MVP スコープ外、Phase B 以降に持ち越し) | Q30 採用 / scope 削減 |
| **i18n 不要、日本語固定** (MVP 期間中は日本語 UI のみ、多言語対応は scope 外) | Q31 採用 / scope 削減 |
| **アクセシビリティ WCAG 2.1 AA 意識** (強制ではないが設計時に意識する。critical 操作の keyboard 操作対応を最低限とする) | Q32 採用 / NFR 連動 |

### §3.3 トップナビゲーション (X2=b 採用、常時ナビバー)

```
[PM ▼] [HM ▼] [GD ▼] [Settings]
PM: 案件・PLAN・進捗 (毎日)
HM: harness 改善・診断 (必要時)
GD: ガイド・トラブルシューティング (参照)
```

---

## §4 関連 doc

L2 画面設計 sub-doc 4 種への carry (旧 SCR-NN → PM/HM/GD-NN 再採番を反映):

> **L2 必須実施判定 (2026-05-28 PO 指摘で修正)**: drive=be であっても ut-tdd は **「UI を持つ be」** (14 画面 dashboard) のため、**画面要求 3 sub-doc (screen-list / screen-flow / ui-element) は必須実施**、wireframe (High-Fi モック) のみ省略可 (Low-Fi で代替、High-Fi は L10 UX refinement)。PLAN-L2-03 は `skip_sub_doc: ["L2-wireframe"]` + 理由明記で省略可。詳細は concept §3.7「L2 sub-doc skip ルール」参照。

| L2 sub-doc | 役割 | 本 L1 からの引き継ぎ | 必須/省略可 |
|-----------|------|---------------------|-------------|
| `docs/design/harness/L2-screen/screen-list.md` | 画面 ID・各画面の役割確定 | PM-01〜PM-05 / HM-01〜HM-08 / GD-01 の役割定義 (画面数 14) | **必須** |
| `docs/design/harness/L2-screen/screen-flow.md` | 遷移図・条件・イベント詳細 | §2 遷移シナリオ 6 パターン (PM↔HM↔GD 横断 deep-link 含む) | **必須** |
| `docs/design/harness/L2-screen/ui-element.md` | 主要 UI コンポーネント・入力/表示/操作要素 | §1 全画面操作要素 / §3 操作要望 (AI 指示テキストコピー UI 含む) | **必須** |
| `docs/design/harness/L2-screen/wireframe.md` | 各画面のレイアウト・情報配置 (Low-Fi で OK) | §3 表示要望 / §1.PM.01〜§1.GD.01 情報要素。**主要画面 (PM-01 4 階層 / HM-02 heat map / HM-03 動的配線 / HM-04 DB / GD-01 サイドナビ) は Low-Fi ASCII art で構造を示す** | **省略可** (Low-Fi 推奨、High-Fi モックは L10 UX refinement) |

その他参照:

- L1 業務要求: `docs/design/harness/L1-requirements/business-requirements.md`
- L1 機能要求: `docs/design/harness/L1-requirements/functional-requirements.md` (FR-L1-20/29/30/44)
- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`

---

## §5 画面ペルソナと利用シナリオ (3 カテゴリ整合、PO 承認 2026-05-28)

### §5.1 画面ユーザー定義

| ペルソナ | 主使用カテゴリ | 補助 | 利用頻度 |
|---------|--------------|------|---------|
| **PO (Product Owner)** | **PM 画面群 (5 件)** — 案件遂行・gate サインオフ・進捗把握 | HM-05 (gate 後 audit たまに) / HM-07 (PO 自身が doctor 起動) / GD-01 (使い方確認) | 毎日 |
| **harness 運用者** | **HM 画面群 (8 件)** — harness 改善・診断・状態確認 | PM-01 (PO サポート) / GD-01 (Architecture/Troubleshooting) | 必要時 |
| **新規参画者** | **GD-01** — Onboarding + Tutorial | PM-01 (案件状況把握) | 導入期 |

> **AI エージェントは UI を直接操作しない。** AI (Claude Code / Codex) は CLI 経由のみで harness と連携し、画面ビューはすべて人間ペルソナのための可視化インターフェースである (S-01 / CC2 人間主導原則)。

### §5.2 ペルソナ別主要利用画面

| ペルソナ | 最優先画面 | 補助画面 |
|---------|-----------|---------|
| PO | PM-01 (俯瞰把握) / PM-03 (gate サインオフ) / PM-05 (Handover) | PM-02 / PM-04 / HM-05 / HM-07 / GD-01 |
| harness 運用者 | HM-07 (doctor 結果) / HM-05 (Audit) / HM-06 (Recovery) / HM-03 (配線図) | PM-01 / HM-01 / HM-02 / HM-04 / GD-01 |
| 新規参画者 | GD-01 (Onboarding/Tutorial) | PM-01 |

---

## §6 Bounded Context 宣言 (DDD 整合)

### §6.1 カテゴリ境界

| Bounded Context | 画面 | 責任範囲 | 変更頻度 |
|----------------|------|---------|---------|
| **PM** (Project Management) | PM-01〜PM-05 | 案件遂行に関わる進捗・担当・詰まり・gate・trace・handover | 毎日変化する動的状態 |
| **HM** (Harness Management) | HM-01〜HM-08 | harness 自体の機能・配線・DB・ログ・診断・改善・学習 | 必要時変化する動的状態 |
| **GD** (Guide & Docs) | GD-01 | 静的知識ベース (操作ガイド・アーキ・Troubleshooting) | 手動更新 (Phase B で半自動) |

### §6.2 カテゴリ間 deep-link 許容

カテゴリ間の遷移は情報参照目的に限り許容する (双方向 deep-link):

- PM-03 Gate fail → HM-05 Audit ログ (原因調査)
- PM-03 / HM-04 → GD-01 Troubleshooting (解決手順参照)
- HM-07 Doctor → PM-04 Trace (検出内容確認)
- HM-02 カバレッジ → HM-01 機能一覧 (不足箇所確認)
- PM-05 Handover → PM-02 工程ビュー (next_action 実行)

カテゴリ間での **状態書き込み・直接操作は禁止**。操作は各カテゴリ内画面で完結させる。

### §6.3 旧 SCR-NN 体系から PM/HM/GD-NN への移行注記

旧 SCR-NN 体系は本 doc より完全廃止。L2 sub-doc 作成時は PM/HM/GD-NN 採番を使用する。

| 旧 ID | 新 ID | 備考 |
|-------|-------|------|
| SCR-01 (ダッシュボード + SCR-08 統合) | PM-01 | 4 階層プルダウンに発展 |
| SCR-02 (PLAN ビュー) | PM-02 工程ビュー に機能分割 | PLAN 内容詳細は HM-01 経由 |
| SCR-03 (Gate 判定ビュー) | PM-03 | 詰まり要因横断を統合 |
| SCR-04 (Audit ビュー) | HM-05 | HM カテゴリへ移動 |
| SCR-05 (Recovery ビュー) | HM-06 | HM カテゴリへ移動 |
| SCR-06 (Handover ビュー) | PM-05 | PM カテゴリへ移動 |
| SCR-07 (Trace ビュー) | PM-04 | W-model pair 状態統合 |
| SCR-08 | SCR-01 統合済 → PM-01 に吸収 | 独立 ID なし |
| SCR-11 (Doctor 結果ビュー) | HM-07 | HM カテゴリへ移動 |
| (新規) | HM-01 | 機能一覧ビュー (新設) |
| (新規) | HM-02 | カバレッジヒートマップビュー (新設) |
| (新規) | HM-03 | 配線図ビュー (CC1=a 再採用) |
| (新規) | HM-04 | データベース閲覧ビュー (CC1=a 再採用) |
| (新規) | HM-08 | AI 効果データ + Learning Engine ビュー (新設) |
| (新規) | GD-01 | ガイド/ドキュメント統合ビュー (新設) |
