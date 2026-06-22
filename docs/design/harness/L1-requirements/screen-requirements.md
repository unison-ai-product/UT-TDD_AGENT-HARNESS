---
layer: L1
sub_doc: screen
status: confirmed
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L3
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: ユビキタス言語 = [L0 概念層 §10 用語集](../../../governance/ut-tdd-agent-harness-concept_v3.1.md#10-用語集) / 業界標準整合 = L0 §11 / Bounded Context = L0 §2.5 9-mode。本 doc は L0 を parent_doc reference とし、用語独自定義は行わない (anti-corruption layer)。
> **件数確定**: screen は画面 15 件 (PM 6 + HM 8 + GD 1)、3 カテゴリ Bounded Context (PM/HM/GD)。PO 承認 2026-05-28 全件 AI 推奨採用 (14 件)。**PM-06 設計書ビューアを 2026-06-22 PO 指示で追加** (設計書 Markdown/YAML/Mermaid を見やすくレンダリングしプレビュー、プロジェクト単位)。根拠: UX-02 / BR-06 / FR-L1-20/FR-L1-29 から導出。旧 SCR-NN 体系は廃止 (移行注記は §6 参照)。
> **L3 接続規約**: `next_pair_freeze: L3`。L3 PLAN は本 sub-doc 全件を `dependencies.requires` に列挙する。

# UT-TDD Agent Harness — L1 画面要求 (screen)

> **PO 判断 carry**: 画面要求は L2 モック検証で lift する。本 sub-doc では業務要求視点の必要画面のみ列挙し、UI 具体化は L2 に委ねる (FR-L1-29 参照)。
> **正規式モデル (PLAN-RECOVERY-02、L2=L1 フェーズ分離)**: 画面要求は本 sub-doc (L1) が正本 — 画面の本質は L1 (要求) に内包する。L2 は画面設計のフェーズ分離 (フェーズが大きいため分離) で、画面詳細は L5 詳細設計へ分配。検証本質 = 実データ検証 (本番の実データで画面が成立するか、L10 で実施)。
> **実装状態**: 全 15 画面は not-implemented (NFR-08 実装宣言の真実性)。
> **配置 (ADR-005 D2)**: 本 UI は **中央・全 project 横断の team 管理ツール**であり、project-local でない。**全員の GitHub project repo を data backbone** に読み、harness 工程の粒度で詳細可視化する (GitHub native 可視化の工程・詳細版)。`案件横断` = チーム全 project 横断の意。backend (中央/team server) 配置・通信境界は L2 設計 (ADR-005 D2、ADR-003 §IMP-031)。Phase A local dashboard はその bootstrap (technical-requirements §2 carry note)。

## §1 画面一覧

3 カテゴリ Bounded Context (DDD) に従い分類する:

- **PM** (Project Management): 案件遂行 / 動的 / PO 主 / 毎日利用
- **HM** (Harness Management): harness 改善 / 動的 / 運用者主 / 必要時利用
- **GD** (Guide & Docs): 静的知識ベース / 参照用

---

### §1.PM PM 画面群 (6 件) — V-model 駆動、案件遂行

業務目的: 進捗・担当・詰まりの把握が主眼。機能内容の詳細は PLAN ビュー link 経由で参照する。

| 画面 ID | 画面名 | 主要目的 | 対応 BR/FR |
|---------|--------|---------|-----------|
| **PM-01** | プロジェクト俯瞰ダッシュボード | 4 階層プルダウン (俯瞰 / 工程 / 割当 / 詳細) による案件横断可視化 | BR-06 / UX-02 / FR-L1-20 / FR-L1-08 |
| **PM-02** | 工程ビュー | 工程単位 deep-dive (進捗・担当・詰まりのみ、URL `/project/<案件>/L<N>`) | FR-L1-01 / FR-L1-04 |
| **PM-03** | Gate + 詰まり要因ビュー | gate 通過状況 + 証跡 + next_action + 発生中トラブル横断 | FR-L1-05 / UX-03 |
| **PM-04** | Trace ビュー | 4 artifact 双方向 trace + V-model pair 状態統合 | FR-L1-03 / FR-L1-18 / BR-07 |
| **PM-05** | Handover ビュー | CURRENT.json 可視化、起動時 auto 表示 (S6=a) | handover / FR-L1-01 |
| **PM-06** | 設計書ビューア | L0-L14 設計書ツリーを Markdown/YAML/Mermaid 整形プレビュー (プロジェクト単位、共有用) | BR-01 / BR-07 / FR-L1-01 / FR-L1-32 |

#### §1.PM.01 PM-01 プロジェクト俯瞰ダッシュボード 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-01 / BR-06 / UX-02 / FR-L1-01 / FR-L1-08 / FR-L1-13 / FR-L1-20 |
| **情報要素** | 4 階層プルダウン: (1) 俯瞰 = 案件 × L0-L14 heat map / (2) 工程 = 選択工程の全案件横断 / (3) 割当 = 案件 × 担当負荷・AI スロット使用率 / (4) 詳細 = 案件 × 工程の sub-doc 展開。各 cell は詳細展開可能 |
| **操作要素** | プルダウン階層切替 / 案件 × L フェーズ cell クリック → PM-02 工程ビュー遷移 / フィルタ (mode/phase/status/drive) / 更新トリガー手動ボタン / gate fail 案件ハイライト |
| **更新頻度** | 30 秒ポーリング (S2=b)、gate fail 時は即時反映 (B8: ≤ 5 分) |
| **状態種別** | 正常 (緑) / 警告 (黄、drift 検出) / エラー (赤、gate fail) / 空 (PLAN 0 件) / 読み込み中 |
| **実装状態** | not-implemented |

#### §1.PM.02 PM-02 工程ビュー 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-01 / BR-04 / FR-L1-01 / FR-L1-02 / FR-L1-04 / FR-L1-13 / FR-L1-14 / FR-L1-15 / FR-L1-23 / FR-L1-29 |
| **情報要素** | 未完了 sub-doc 一覧 / stale PLAN list / 担当 AI スロット / carry 件数 / 工程別進捗率 / 詰まり案件一覧。機能内容の詳細は PLAN ビュー (HM-01 経由) link で参照。**Scrum S-phase ステート carry** (A-52 audit I-03、L3 carry): drive=scrum 案件は S0 backlog / S1 plan / S2 PoC / S3 verify / S4 decide のステート遷移を 1 行ずつ表示 (FR-L1-23 fullback F0-F4 generates との接続) — UI 具体は L2 で確定 |
| **操作要素** | PLAN 行クリック → PM-03 Gate ビュー遷移 / carry 詳細展開 / 担当 AI スロット確認 |
| **更新頻度** | 30 秒ポーリング (S2=b)、工程変化時に即時 |
| **状態種別** | 正常 / stale あり (黄) / gate blocked (赤) / pair freeze 済 / trace freeze 済 |
| **実装状態** | not-implemented |

#### §1.PM.03 PM-03 Gate + 詰まり要因ビュー 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-02 / BR-05 / UX-03 / FR-L1-05 / FR-L1-11 / FR-L1-16 / FR-L1-17 |
| **情報要素** | gate ID / 判定結果 (pass/fail/bypass) / 証跡一覧 (artifact リンク) / fail 理由テキスト / next_action (1 アクション明示) / サインオフ者 (PO/TL) / bypass 承認記録リンク。**発生中トラブル横断**: 種別 / 検出時刻 / 影響範囲 / next_action (gate fail + drift + handover stale + 暴走シグナルを一覧化) |
| **操作要素** | next_action テキストコピー / 証跡ファイル参照リンク / AI 指示テキスト生成 (copy-paste 用) / HM-05 Audit ログ参照遷移 / PM-01 ダッシュボード戻り / **interrupt 発動・resume CLI テキストコピー** (A-52 audit C-01、cross-cutting-mechanisms.md 4 機構の operate 経路、`ut-tdd interrupt` / `ut-tdd interrupt resume` CLI コマンド文字列をワンクリックコピー、実際の発動は CLI 側で受付。UI 直接発動禁止 S5=b と整合) |
| **更新頻度** | gate 実行直後に即時表示 (B8: gate fail 即時) / 30 秒ポーリング (S2=b) |
| **状態種別** | pass (緑) / fail (赤、next_action 強調) / bypass (黄、audit 記録必須) / pending (未判定) |
| **色分け必須** | 正常/警告/失敗を即視認 (緑/黄/赤、CC3 詳細データテーブル必須・問題箇所視覚化) |
| **実装状態** | not-implemented |

#### §1.PM.04 PM-04 Trace ビュー 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-01 / BR-03 / BR-07 / FR-L1-03 / FR-L1-18 |
| **情報要素** | 上流 ID → 下流 ID の双方向 trace グラフ / デグレ箇所ハイライト / trace 抜け漏れ一覧 / 整合率 (D-05 対応) / PLAN 別フィルタ。**V-model pair 状態統合**: L1↔L14 / L2↔L10 / L3↔L12 / L4↔L9 / L5↔L8 / L6↔L7 の各 pair freeze 状態一覧。trace 切れ詳細行 / V-pair 未 freeze 行を詳細テーブルで表示 |
| **操作要素** | trace ノードクリック → 対象 doc リンク / フィルタ (PLAN/phase/status) / HM-07 Doctor 結果参照遷移 |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 整合 (緑) / 抜け漏れあり (赤ハイライト) / V-pair 未 freeze (黄) / 空 (trace 未登録) |
| **実装状態** | not-implemented |

#### §1.PM.05 PM-05 Handover ビュー 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | UX-03 / FR-L1-01 |
| **情報要素** | CURRENT.json 可視化 (next_action / 現 phase / 未解決 carry / 最終 gate 結果) / CURRENT.json 全項目表示 / carry 詳細一覧 / セッション引き継ぎ履歴 / archive 期限 (30 日表示) |
| **操作要素** | next_action 実行 → 該当 PM ビュー遷移 / PLAN 参照 → PM-02 工程ビュー / handover archive 確認 / next_action AI 指示テキストコピー |
| **更新頻度** | セッション開始時 auto 表示 (S6=a) / 30 秒ポーリング (S2=b) |
| **状態種別** | 引き継ぎあり (next_action 強調) / 引き継ぎなし / stale (30 日超) / 読み込み中 |
| **実装状態** | not-implemented |

#### §1.PM.06 PM-06 設計書ビューア 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-01 / BR-07 / FR-L1-01 / FR-L1-32 |
| **情報要素** | **L0-L14 設計書ツリー** (layer × sub-doc、各ノードに status バッジ placeholder/confirmed/frozen + pair-freeze 状態)。選択 doc を **見やすくレンダリングしてプレビュー**: Markdown 本文 (見出し/表/リスト/コード) + YAML frontmatter 構造化表示 + **Mermaid 図 / ASCII 図** の描画。doc 内見出しの目次。trace は PM-04 へ deep-link。プロジェクト単位 (`:case` スコープ、共有用) |
| **操作要素** | ツリーノードクリック → 本文プレビュー / layer・status・drive フィルタ / 目次ジャンプ / 内部リンク (doc 間) ナビゲーション / PM-04 Trace ビュー参照遷移 / AI 指示テキストコピー (doc パス + 該当箇所、CC2)。**read-only** (編集なし、S5=b) |
| **更新頻度** | 30 秒ポーリング (S2=b)、設計書更新時に反映 |
| **状態種別** | confirmed (緑) / placeholder (黄) / frozen (青) / 未作成 (灰) / 読み込み中 |
| **実装状態** | not-implemented |

---

### §1.HM HM 画面群 (8 件) — 機能可視化 + トラブル/ログ改善 + 学び

業務目的: harness 改善・診断・運用者が必要時に使用。

| 画面 ID | 画面名 | 主要目的 | 対応 BR/FR |
|---------|--------|---------|-----------|
| **HM-01** | 機能一覧ビュー | FR-L1 47 件 × implementation_status 可視化 (3 階層プルダウン) | FR-L1-20 / FR-L1-29 |
| **HM-02** | カバレッジヒートマップビュー | 機能可視化・弱点診断 (観点 8 × 軸 5 = 40 通り heat map) | FR-L1-12 / BR-06 |
| **HM-03** | 配線図ビュー | 静的アーキ + 動的エラー赤表示 (CC1=a 採用) | FR-L1-07 / FR-L1-18 |
| **HM-04** | データベース閲覧ビュー | `.ut-tdd/` state 全 table + 整合性チェック結果 + artifact progress 赤黄緑 projection (CC1=a 採用) | FR-L1-07 / FR-L1-18 / FR-L1-51 |
| **HM-05** | Audit / 実行ログビュー | AI 実行ログ + agent guard 判定 + budget + skill 注入タブ統合 (S8=b) | FR-L1-09 / FR-L1-20 / FR-L1-12 |
| **HM-06** | Recovery ビュー | 暴走対応 + 再開ポイント + CLI ロールバックコマンドコピー (S5=b) | FR-L1-10 |
| **HM-07** | Doctor 結果ビュー | `ut-tdd doctor` 全量検出の構造化表示 | FR-L1-18 / `ut-tdd doctor` |
| **HM-08** | AI 効果データ + Learning Engine ビュー | BR-21 連動、skill/model 評価 + recipe 蓄積 + L3 forward carry | BR-21 / FR-L1-12 |

#### §1.HM.01 HM-01 機能一覧ビュー 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-06 / UX-02 / FR-L1-33 / FR-L1-35 |
| **情報要素** | 3 階層プルダウン: (1) 整備率% サマリ / (2) カテゴリ別 (P0/P1/P2) / (3) FR-L1-NN 機能個別。FR-L1 全 47 件を installed/partial/not-implemented + 担当 PLAN + **対応画面 (screen §5 trace、各 FR がどの画面要求で実現されるか)** で詳細テーブル表示 |
| **操作要素** | プルダウン階層切替 / FR-L1 行クリック → 担当 PLAN 参照 / **FR-L1 行 → 対応画面要求参照 (screen §5 trace の対応画面 ID) + PM-06 設計書ビューアで screen-requirements 本文プレビュー** (機能一覧から画面要求を辿れる、PO 指示 2026-06-22) / フィルタ (status/priority) / 未実装一覧エクスポート |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 整備率高 (緑) / 部分整備 (黄) / 未整備 (赤) / 空 |
| **実装状態** | not-implemented |

#### §1.HM.02 HM-02 カバレッジヒートマップビュー 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-06 / BR-22 / FR-L1-33 / FR-L1-34 / FR-L1-35 / FR-L1-46 / FR-L1-47 / FR-L1-48 / FR-L1-49 |
| **情報要素** | 観点 8 (skill/command/detector/template/state/hook/docs/tests) × 軸 5 (L/drive/mode/phase/BR-FR) = 40 通り heat map。カバレッジ密度を色密度で表現 |
| **操作要素** | heat map cell クリック → 不足項目一覧表示 + 起票候補テキスト生成 (AI 指示 copy-paste 用) / 観点・軸フィルタ切替 |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 高カバレッジ (濃緑) / 中 (黄) / 低 (赤) / 未集計 |
| **実装状態** | not-implemented |

#### §1.HM.03 HM-03 配線図ビュー 詳細 (CC1=a 採用)

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-03 / FR-L1-07 / FR-L1-08 / FR-L1-40 / FR-L1-42 |
| **情報要素** | 静的アーキ図 (コンポーネント・接続線) + **動的エラー赤表示**: hook 発火失敗 / AI provider 接続失敗 / 9 drive 区画状態。接続線詳細テーブル: 起点 / 終点 / 状態 / 最終チェック時刻。**detection-routing モード遷移可視化 carry** (A-52 audit I-01、L3 carry): detection-routing.md 4 象限 (drift / 劣化 / 暴走 / 障害) → モード発動 (Recovery / Incident / Reverse / Refactor) の動的経路を矢印表示、現在 active な遷移を強調 (FR-L1-08 連動) — UI 具体は L2 で確定 |
| **操作要素** | 接続線クリック → 詳細表示 / エラー箇所ハイライト / GD-01 Architecture ドキュメント参照リンク |
| **更新頻度** | 30 秒ポーリング (S2=b)、hook 発火失敗時は即時反映 |
| **状態種別** | 正常 (緑) / 警告 (黄) / 障害 (赤) / 未接続 (灰) |
| **色分け必須** | 動的画面で正常/警告/失敗を即視認 (緑/黄/赤、CC3 問題箇所視覚化) |
| **実装状態** | not-implemented |

#### §1.HM.04 HM-04 データベース閲覧ビュー 詳細 (CC1=a 採用)

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-05 / BR-07 / BR-20 / FR-L1-06 / FR-L1-07 / FR-L1-51 |
| **情報要素** | `.ut-tdd/` state 全 table の行データ (raw data に近い粒度) + **整合性チェック結果**: orphan record / drift / 不正値の検出。各 table の整合性チェック結果サマリ。`artifact_progress` は赤=依存未確認/未回収、黄=実装中/未テスト、緑=linked test + dependency clear を表示 |
| **操作要素** | table 切替 / 行フィルタ / 整合性チェック再実行トリガー / 問題行 AI 指示テキストコピー |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 整合 (緑) / orphan あり (黄) / 不正値あり (赤) / 空 table |
| **色分け必須** | 動的画面で正常/警告/失敗を即視認 (緑/黄/赤、CC3 問題箇所視覚化) |
| **実装状態** | not-implemented |

#### §1.HM.05 HM-05 Audit / 実行ログビュー 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-02 / BR-03 / BR-08 / FR-L1-09 / FR-L1-12 / FR-L1-20 |
| **情報要素** | invocation_log 全列: date / model / role / task / result / token / cost。agent guard 判定履歴 (allow/block/bypass) / budget 使用量 / 逸脱警告一覧 / bypass 承認記録。**skill 注入タブ** (S8=b): 推奨 skill 一覧・FR-L1-12。**hook 発火ログタブ carry** (A-52 audit I-02、L3 carry): db-auto-registration.md 5 hook (PLAN 起票 / コード変更 / Codex 実行 / ゲート通過 / 停止) の発火成否・自動登録結果・未登録エラーを別タブで一覧表示 (observability-metrics.md action_logs 由来、FR-L1-07/20 連動) — UI 具体は L2 で確定 |
| **操作要素** | フィルタ (日付/agent/result) / skill 注入タブ切替 / bypass 詳細展開 / PM-03 Gate ビュー参照遷移 |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 正常 / bypass 使用中 (黄警告) / guard block 多発 (赤警告) / 空 |
| **実装状態** | not-implemented |

#### §1.HM.06 HM-06 Recovery ビュー 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | UX-03 / FR-L1-10 / FR-L1-16 |
| **情報要素** | 暴走状態ログ (検出日時・種別) / 再開ポイント一覧 (最終正常 gate) / 認識訂正履歴 / **CLI ロールバックコマンドコピー** (S5=b、UI 直接実行なし) / cutover 状態。recovery_log 全列 + 再開ポイント候補一覧 |
| **操作要素** | CLI コマンドコピーボタン (クリップボード) / HM-05 Audit 参照遷移 / Recovery 収束後 → PM-01 ダッシュボード戻り |
| **更新頻度** | 30 秒ポーリング (S2=b) / 暴走検出時は即時通知 |
| **状態種別** | 正常 (Recovery 不要) / 暴走検出中 (赤) / ロールバック待ち (黄) / 収束済 (緑) |
| **実装状態** | not-implemented |

#### §1.HM.07 HM-07 Doctor 結果ビュー 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-03 / BR-05 / BR-07 / FR-L1-02 / FR-L1-11 / FR-L1-18 |
| **情報要素** | `ut-tdd doctor` 全量検出結果: V-model 順序違反 / entity カバレッジ / hook 状態 / phase 整合 / carry 未解決。重要度別分類 (error/warn/info) 全行。検出件数サマリ (D-03 対応) |
| **操作要素** | 詳細展開 / PM-04 Trace ビュー参照遷移 / PM-02 工程ビュー参照遷移 / doctor 再実行トリガー / 問題行 AI 指示テキストコピー |
| **更新頻度** | doctor 実行時に即時反映 / 30 秒ポーリング (S2=b) |
| **状態種別** | クリーン (緑、0 件) / 警告あり (黄) / エラーあり (赤、D-03 = 0 件違反) / 実行前 (未取得) |
| **実装状態** | not-implemented |

#### §1.HM.08 HM-08 AI 効果データ + Learning Engine ビュー 詳細

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-21 / FR-L1-19 / FR-L1-20 |
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

| 観点 | 内容 |
|------|------|
| **対応 BR/UX/FR-L1** | BR-08 / UX-03 / FR-L1-19 / FR-L1-27 / FR-L1-32 / FR-L1-44 |

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

- HM-07 Doctor 結果ビュー: エラー検出 (V-model 順序違反 / carry 未解決)
- HM-07 → PM-04 Trace ビュー: trace 切れ・V-pair 未 freeze 確認
- PM-04 → PM-02 工程ビュー: 対象 sub-doc 確認・修正
- 修正後 → HM-07: doctor 再実行で収束確認

---

## §3 表示・操作要望

### §3.1 横断原則 (CC2/CC3 採用、PO 承認 2026-05-28 全件)

| 要望 | 内容 | 適用範囲 |
|------|------|---------|
| **人間主導 + AI 補助原則** (CC2) | 画面は人間が異常検知・問題箇所特定するためのもの。AI 単独自動化に依存せず人間の判断補助を最優先。AI は CLI 経由のみ、UI 操作なし (S-01 整合) | 全 15 画面 |
| **詳細データテーブル必須** (CC3) | 各画面でサマリだけでなく raw data に近い詳細表示を提供。異常検知可能な粒度。サマリのみの画面禁止 | 全 15 画面 |
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

> **L2 必須実施判定 (2026-05-28 PO 指摘で修正)**: drive=be であっても ut-tdd は **「UI を持つ be」** (15 画面 dashboard) のため、**画面要求 3 sub-doc (screen-list / screen-flow / ui-element) は必須実施**、wireframe (High-Fi モック) のみ省略可 (Low-Fi で代替、High-Fi は L10 UX refinement)。PLAN-L2-03 は `skip_sub_doc: ["L2-wireframe"]` + 理由明記で省略可。詳細は concept §3.7「L2 sub-doc skip ルール」参照。

| L2 sub-doc | 役割 | 本 L1 からの引き継ぎ | 必須/省略可 |
|-----------|------|---------------------|-------------|
| `docs/design/harness/L2-screen/screen-list.md` | 画面 ID・各画面の役割確定 | PM-01〜PM-06 / HM-01〜HM-08 / GD-01 の役割定義 (画面数 15) | **必須** |
| `docs/design/harness/L2-screen/screen-flow.md` | 遷移図・条件・イベント詳細 | §2 遷移シナリオ 6 パターン (PM↔HM↔GD 横断 deep-link 含む) | **必須** |
| `docs/design/harness/L2-screen/ui-element.md` | 主要 UI コンポーネント・入力/表示/操作要素 | §1 全画面操作要素 / §3 操作要望 (AI 指示テキストコピー UI 含む) | **必須** |
| `docs/design/harness/L2-screen/wireframe.md` | 各画面のレイアウト・情報配置 (Low-Fi で OK) | §3 表示要望 / §1.PM.01〜§1.GD.01 情報要素。**主要画面 (PM-01 4 階層 / HM-02 heat map / HM-03 動的配線 / HM-04 DB / GD-01 サイドナビ) は Low-Fi ASCII art で構造を示す** | **省略可 + 柔軟方針** (A-39/A-40 採用、Low-Fi デフォルト harness 内、**High-Fi モックは ケース別判断**: harness 内保持 OR 外部依頼。外部依頼は許容オプションで必須ではない。外部依頼時は要件 back-propagation あり) |

その他参照:

- L1 業務要求: `docs/design/harness/L1-requirements/business-requirements.md`
- L1 機能要求: `docs/design/harness/L1-requirements/functional-requirements.md` (FR-L1-20/29/30/44)
- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`

### §4.1 L3 PLAN 接続規約 (R4 充足規約、Minor 4 G1 readiness v8 で強化 2026-05-28)

L3 機能要件 PLAN (PLAN-L3-NN) 起票時、本 screen sub-doc との接続は以下の規約に従う:

| 規約 | 内容 | 検証 |
|------|------|------|
| **R4-screen-requires** | L3 PLAN frontmatter `dependencies.requires` に本 sub-doc (`docs/design/harness/L1-requirements/screen-requirements.md`) + business + functional の 3 軸を全件列挙する (§5 R4 注記と整合) | `ut-tdd plan lint --gate G1-trace` で機械検証 (requirements §1.10.H R4) |
| **画面 ID 引用** | L3 PLAN 本文で対象画面 (PM/HM/GD-NN) を ID 引用する場合、本 §1 で宣言した 15 画面のみ許可 (旧 SCR-NN 体系は §7.3 移行表で廃止確認) | doc-reviewer (BR-08) でレビュー |
| **L2 carry 接続** | L3 PLAN は L2 画面設計 4 sub-doc (`docs/design/harness/L2-screen/*.md`) を `dependencies.requires` に列挙する。L2 が placeholder の場合は L2 PLAN-L2-01/02/04 起票を先行させる (PLAN-L1-03 §7 carry と整合) | L3 起票時に手動確認、L2 確定後に `ut-tdd plan lint` |
| **横断原則 4 件継承** | §3.1 横断原則 (人間主導 + AI 補助 / 詳細データテーブル必須 / AI copy-paste UI / 問題箇所視覚化) は L3 全機能要件で「人間判断点」明示として forward carry (business §3.3.2 CC2 連動) | L3 PLAN review で確認 (CC2 carry) |
| **G1-trace 継承** | L3 PLAN 起票時、本 sub-doc §5 trace マトリクス R1-R4 検証結果を継承し、L3 FR 追加・拡張時に再検証 (requirements §1.10.H lint ルール) | `ut-tdd plan lint --gate G1-trace` 再実行 |

> **L3 起票時の最低 PLAN セット**: PLAN-L3-01 (FR 詳細化 / L2 deep-link) + PLAN-L3-02 (BR-21 詳細化 / HM-08 連動) + PLAN-L3-03 (NFR グレード値確定) が screen sub-doc を `requires` に列挙する想定 (G1 readiness §3 L3 forward carry 連動)。

---

## §5 BR/UX/FR-L1 ⇔ 画面 trace マトリクス (G1-trace pair)

> **R4 注記 (L3 PLAN 起票時必須)**: L3 PLAN は `dependencies.requires` に business (BR/UX) + functional (FR-L1) + screen (PM/HM/GD-NN) の全件を列挙すること。本 L1 sub-doc の frontmatter は `related_br` のみ保持するが、L3 PLAN が業務・機能・画面の 3 軸を `requires` で宣言することで R4 を充足する。

### §5.1 BR ⇔ 画面 trace 表 (R1 検証用)

R1: BR-01〜08 + BR-21 + BR-22 + UX-01〜03 = 13 件全て、最低 1 画面に紐付く (孤児 BR 禁止)。

| BR-ID | 主画面 | 副画面 | trace 根拠 |
|-------|--------|--------|-----------|
| **BR-01** | PM-01 / PM-02 | PM-04 (Trace) / PM-06 (設計書) | L0-L14 通し進捗の俯瞰 + 工程 deep-dive + trace 整合 + 設計書プレビュー |
| **BR-02** | PM-03 (Gate サインオフ) | HM-05 (audit) | 複数人 gate 役割境界 + 権限分離 audit |
| **BR-03** | PM-04 / HM-07 (Doctor) | HM-05 (audit) | 回帰検知 trace + Doctor + AI 実行 audit |
| **BR-04** | PM-02 (Discovery 工程) | HM-05 (PoC ログ) | PoC 進捗 + 契約化合流 + audit |
| **BR-05** | PM-03 (詰まり要因) | HM-07 (lint 結果) | PLAN lint 違反検知 + 詰まり要因 |
| **BR-06** | **PM-01 (直接)** / HM-01 | GD-01 (Architecture) | ダッシュボード = 直接実現 |
| **BR-07** | PM-04 (Trace + V-pair) | HM-07 (Doctor) / PM-06 (設計書) | ratchet 3 軸 = trace 切れ / balance_ratio / ID 追随 + 設計書本文確認 |
| **BR-08** | HM-05 (audit) | GD-01 (doc Troubleshooting) | doc-reviewer 召喚記録 audit |
| **BR-21** | **HM-08 (直接、L3 carry)** | GD-01 (Learning Engine 連動) | AI 効果評価 + recipe 蓄積 |
| **BR-22** | **HM-02 (カバレッジ、直接)** | HM-05 (audit) / GD-01 (Architecture) | 内部資産 roster / skill pack / command の UT-TDD 化状況 + drift lint |

### §5.2 UX ⇔ 画面 trace 表 (R1 検証用)

| UX-ID | 主画面 | 副画面 | trace 根拠 |
|-------|--------|--------|-----------|
| **UX-01** | 全画面 (横断) | (CC2 人間主導原則で全画面体現) | 3 バランス価値の体験指標 |
| **UX-02** | **PM-01 / HM-01 (直接)** | HM-02 (カバレッジ) | ダッシュボード体験 |
| **UX-03** | PM-03 (next_action 提示) / PM-05 (Handover) / HM-06 (Recovery CLI コピー) | GD-01 (Troubleshooting) | gate fail / handover / Recovery で next_action 明確 |

### §5.3 FR-L1 P0 ⇔ 画面 trace 表 (R3 必須対象 — 19 件全件、A-49 で FR-L1-45 追加)

R3: FR-L1 P0 19 件全て最低 1 画面に紐付く (孤児 P0 FR-L1 禁止、block)。P1/P2 は warn。

| FR-L1-ID | 主画面 | 副画面 | trace 根拠 |
|----------|--------|--------|-----------|
| **FR-L1-01** (V字 PLAN 起票管理) | PM-02 | PM-01 / PM-05 | 工程ビュー + 俯瞰 + handover 連動 |
| **FR-L1-02** (TDD 強制フロー) | PM-02 (L7 工程) | HM-07 | TDD 順序 doctor 検出 |
| **FR-L1-03** (V字双方向 trace) | **PM-04 (直接)** | HM-07 | Trace ビュー = 直接実現 |
| **FR-L1-04** (PLAN kind / generates / requires) | PM-02 | HM-01 | kind 別 PLAN 表示 |
| **FR-L1-05** (決定論的 static gate) | **PM-03 (直接)** | HM-07 | Gate 判定ビュー = 直接実現 |
| **FR-L1-06** (V モデル本線 state 一元管理) | **HM-04 (直接 DB 閲覧)** | HM-01 | state 構造可視化 |
| **FR-L1-07** (state 自動登録 5 イベント hook) | HM-04 | HM-03 (配線図 hook) | hook イベント可視化 |
| **FR-L1-08** (検出→モード自動ルーティング) | PM-01 (Mode ステータス) | HM-03 (drive 判定 配線) | mode 自動 routing |
| **FR-L1-09** (AI ガード) | **HM-05 (直接 agent guard audit)** | HM-03 | AI 実行 audit + bypass 監視 |
| **FR-L1-10** (Recovery 収束) | **HM-06 (直接)** | PM-03 | Recovery ビュー = 直接実現 |
| **FR-L1-11** (横断 4 機構 interrupt/debt/drift/readiness) | PM-03 (詰まり要因) | HM-07 | interrupt/debt/drift/readiness 表示 |
| **FR-L1-12** (L 単位文脈注入) | HM-05 (skill 注入タブ) | HM-02 (カバレッジ) | skill 注入状態 |
| **FR-L1-13** (Forward ワークフロー) | PM-01 / PM-02 | PM-03 | Forward 進捗 + gate |
| **FR-L1-14** (Reverse ワークフロー) | PM-02 (Reverse 工程) | HM-07 | Reverse R0-R4 状態 |
| **FR-L1-15** (Discovery ワークフロー) | PM-02 (Discovery 工程) | HM-05 | Discovery S0-S4 + PoC ログ |
| **FR-L1-16** (Incident ワークフロー) | PM-03 (障害シグナル) | HM-06 (hotfix) | Incident 検出 + 対応 |
| **FR-L1-17** (CI/PR 連携) | PM-03 (gate 証跡) | HM-07 | CI gate 通過状態 |
| **FR-L1-18** (横断検出 ut-tdd doctor 一括集約) | **HM-07 (直接 Doctor)** | PM-04 | Doctor 全量検出 = 直接実現 |
| **FR-L1-45** (doc-reviewer 必須召喚、A-49 back-propagation) | **PM-03 (Gate サインオフ前 review trigger)** | HM-05 (audit ログ) | BR-08 派生 P0、未召喚で gate fail-close |

### §5.4 FR-L1 P1/P2 ⇔ 画面 trace 表 (warn 対象 — 孤児許容)

P1/P2 は warn 程度で紐付け推奨。孤児 P1/P2 は block しない。ただし DB projection として実装済みの進捗可視化機能は、更新漏れ防止のため対応画面を明示する。

| FR-L1-ID | 主画面 | trace 根拠 |
|----------|--------|-----------|
| **FR-L1-19** (Learning Engine) | HM-08 / GD-01 | AI 効果 + Troubleshooting 半自動更新 |
| **FR-L1-20** (観測・計測層) | HM-05 / HM-08 | invocation_log / accuracy_score 表示 |
| **FR-L1-21** (テスト観点 W 字ゲート) | PM-04 / HM-07 | V-pair 状態 + Doctor 検出 |
| **FR-L1-22** (FE detector 5 軸) | HM-07 (Doctor) | detector 検出結果表示 |
| **FR-L1-23** (Scrum → V モデル昇華) | PM-02 | 工程ビューで Scrum → V 昇華進捗 |
| **FR-L1-24** (Add-feature ワークフロー) | PM-02 | 工程ビューで Add-feature 工程 |
| **FR-L1-25** (Refactor ワークフロー) | PM-02 | 工程ビューで Refactor 工程 |
| **FR-L1-26** (Retrofit ワークフロー) | PM-02 | 工程ビューで Retrofit 工程 |
| **FR-L1-27** (Research ワークフロー) | GD-01 / PM-02 | Research ガイド + 工程ビュー |
| **FR-L1-28** (UT-TDD W 2 段設計) | PM-04 | Trace ビューで W 2 段状態 |
| **FR-L1-29** (画面設計ワークフロー L2) | PM-02 | L2 工程進捗 (本 sub-doc 自体が L2 前段) |
| **FR-L1-30** (フロントデザイン UX L10) | PM-02 | L10 工程進捗 |
| **FR-L1-31** (コンテキスト管理) | PM-05 (Handover) | handover 引継ぎ + 文脈管理 (functional 整合、A-54) |
| **FR-L1-32** (フォルダ構成) | GD-01 (Architecture) | 構成ガイド参照 |
| **FR-L1-33** (既存資産棚卸) | HM-01 / HM-02 | 機能一覧 + カバレッジで棚卸 |
| **FR-L1-34** (スキル・コマンド穴管理) | HM-02 (カバレッジ) | カバレッジ heat map で穴可視化 |
| **FR-L1-35** (基盤整備状況可視化) | HM-01 / HM-02 | 機能一覧 + カバレッジで整備状況 |
| **FR-L1-37** (モデル/エフォート推挙) | HM-08 | AI 効果データで推挙根拠 |
| **FR-L1-39** (タスク難易度測定) | HM-08 | AI 効果データ + cost 分析 |
| **FR-L1-40** (drive 別 state 分離管理) | HM-03 (配線図 9 drive) | 9 drive 区画状態可視化 |
| **FR-L1-41** (drive 自動判定) | HM-03 | drive 判定結果表示 |
| **FR-L1-42** (AI プロバイダ間引継ぎ) | HM-03 (接続状態) / PM-05 | provider 接続 + 引継ぎ状態 (functional 整合、A-54) |
| **FR-L1-44** (途中導入 onboarding) | GD-01 (Onboarding カテゴリ) | 使い方 doc 参照 |
| **FR-L1-51** (artifact progress color projection) | HM-04 / PM-01 | artifact_progress rows と俯瞰ダッシュボードの赤黄緑状態 |

### §5.5 画面 → BR/UX/FR-L1 逆 trace 表 (R2 検証用 — 孤児画面 0)

R2: 全 15 画面が最低 1 つの BR/UX/FR-L1 に紐付く (孤児画面禁止、block)。

| 画面 ID | 対応 BR/UX | 対応 FR-L1 |
|---------|-----------|-----------|
| **PM-01** | BR-01 / BR-06 / UX-02 | FR-L1-01 / FR-L1-08 / FR-L1-13 / FR-L1-20 |
| **PM-02** | BR-01 / BR-04 | FR-L1-01 / FR-L1-02 / FR-L1-04 / FR-L1-13 / FR-L1-14 / FR-L1-15 / FR-L1-29 |
| **PM-03** | BR-02 / BR-05 / UX-03 | FR-L1-05 / FR-L1-11 / FR-L1-16 / FR-L1-17 / FR-L1-45 |
| **PM-04** | BR-01 / BR-03 / BR-07 | FR-L1-03 / FR-L1-18 |
| **PM-05** | UX-03 | FR-L1-01 / FR-L1-31 / FR-L1-42 |
| **PM-06** | BR-01 / BR-07 | FR-L1-01 / FR-L1-32 |
| **HM-01** | BR-06 / UX-02 | FR-L1-33 / FR-L1-35 |
| **HM-02** | BR-06 / BR-22 | FR-L1-33 / FR-L1-34 / FR-L1-35 / FR-L1-46 / FR-L1-47 / FR-L1-48 / FR-L1-49 |
| **HM-03** | BR-03 | FR-L1-07 / FR-L1-08 / FR-L1-40 / FR-L1-42 |
| **HM-04** | BR-05 / BR-07 / BR-20 | FR-L1-06 / FR-L1-07 / FR-L1-51 |
| **HM-05** | BR-02 / BR-03 / BR-08 | FR-L1-09 / FR-L1-12 / FR-L1-20 |
| **HM-06** | UX-03 | FR-L1-10 / FR-L1-16 |
| **HM-07** | BR-03 / BR-05 / BR-07 | FR-L1-02 / FR-L1-11 / FR-L1-18 |
| **HM-08** | BR-21 | FR-L1-19 / FR-L1-20 |
| **GD-01** | BR-08 / UX-03 | FR-L1-19 / FR-L1-27 / FR-L1-32 / FR-L1-44 |

### §5.6 G1-trace 機械検証チェック結果サマリ

| ルール | チェック内容 | 結果 |
|--------|------------|------|
| **R1** (BR/UX → 画面): 孤児 BR 禁止 (block) | BR-01〜08 + BR-21 + BR-22 + UX-01〜03 = 13 件全て最低 1 画面に紐付き | PASS — 孤児 0 件 |
| **R2** (画面 → BR/UX/FR-L1): 孤児画面禁止 (block) | 15 画面 (PM 6 + HM 8 + GD 1) 全て最低 1 件紐付き (PM-06 = BR-01/BR-07 + FR-L1-01/FR-L1-32) | PASS — 孤児 0 件 |
| **R3** (FR-L1 P0 → 画面 必須): 孤児 P0 FR-L1 禁止 (block) | FR-L1 P0 19 件全て最低 1 画面に紐付き (P1/P2 は warn、A-49 で FR-L1-45 追加) | PASS — P0 孤児 0 件 |
| **R4** (`dependencies.requires` 整合): business + functional 必須 | L3 PLAN 起票時に BR/UX + FR-L1 + screen 全件 requires 列挙 (§5 冒頭注記) | 宣言済 — L3 起票時に充足 |

---

## §6 画面ペルソナと利用シナリオ (3 カテゴリ整合、PO 承認 2026-05-28)

### §6.1 画面ユーザー定義

| ペルソナ | 主使用カテゴリ | 補助 | 利用頻度 |
|---------|--------------|------|---------|
| **PO (Product Owner)** | **PM 画面群 (6 件)** — 案件遂行・gate サインオフ・進捗把握・設計書プレビュー | HM-05 (gate 後 audit たまに) / HM-07 (PO 自身が doctor 起動) / GD-01 (使い方確認) | 毎日 |
| **harness 運用者** | **HM 画面群 (8 件)** — harness 改善・診断・状態確認 | PM-01 (PO サポート) / GD-01 (Architecture/Troubleshooting) | 必要時 |
| **新規参画者** | **GD-01** — Onboarding + Tutorial | PM-01 (案件状況把握) | 導入期 |

> **AI エージェントは UI を直接操作しない。** AI (Claude Code / Codex) は CLI 経由のみで harness と連携し、画面ビューはすべて人間ペルソナのための可視化インターフェースである (S-01 / CC2 人間主導原則)。

### §6.2 ペルソナ別主要利用画面

| ペルソナ | 最優先画面 | 補助画面 |
|---------|-----------|---------|
| PO | PM-01 (俯瞰把握) / PM-03 (gate サインオフ) / PM-05 (Handover) | PM-02 / PM-04 / PM-06 (設計書プレビュー) / HM-05 / HM-07 / GD-01 |
| harness 運用者 | HM-07 (doctor 結果) / HM-05 (Audit) / HM-06 (Recovery) / HM-03 (配線図) | PM-01 / HM-01 / HM-02 / HM-04 / GD-01 |
| 新規参画者 | GD-01 (Onboarding/Tutorial) | PM-01 |

---

## §7 Bounded Context 宣言 (DDD 整合)

### §7.1 カテゴリ境界

| Bounded Context | 画面 | 責任範囲 | 変更頻度 |
|----------------|------|---------|---------|
| **PM** (Project Management) | PM-01〜PM-06 | 案件遂行に関わる進捗・担当・詰まり・gate・trace・handover・設計書プレビュー | 毎日変化する動的状態 |
| **HM** (Harness Management) | HM-01〜HM-08 | harness 自体の機能・配線・DB・ログ・診断・改善・学習 | 必要時変化する動的状態 |
| **GD** (Guide & Docs) | GD-01 | 静的知識ベース (操作ガイド・アーキ・Troubleshooting) | 手動更新 (Phase B で半自動) |

### §7.2 カテゴリ間 deep-link 許容

カテゴリ間の遷移は情報参照目的に限り許容する (双方向 deep-link):

- PM-03 Gate fail → HM-05 Audit ログ (原因調査)
- PM-03 / HM-04 → GD-01 Troubleshooting (解決手順参照)
- HM-07 Doctor → PM-04 Trace (検出内容確認)
- HM-02 カバレッジ → HM-01 機能一覧 (不足箇所確認)
- PM-05 Handover → PM-02 工程ビュー (next_action 実行)
- PM-02 工程ビュー / PM-04 Trace → PM-06 設計書ビューア (設計書本文プレビュー、PM 内)

カテゴリ間での **状態書き込み・直接操作は禁止**。操作は各カテゴリ内画面で完結させる。

### §7.3 旧 SCR-NN 体系から PM/HM/GD-NN への移行注記

旧 SCR-NN 体系は本 doc より完全廃止。L2 sub-doc 作成時は PM/HM/GD-NN 採番を使用する。

| 旧 ID | 新 ID | 備考 |
|-------|-------|------|
| SCR-01 (ダッシュボード + SCR-08 統合) | PM-01 | 4 階層プルダウンに発展 |
| SCR-02 (PLAN ビュー) | PM-02 工程ビュー に機能分割 | PLAN 内容詳細は HM-01 経由 |
| SCR-03 (Gate 判定ビュー) | PM-03 | 詰まり要因横断を統合 |
| SCR-04 (Audit ビュー) | HM-05 | HM カテゴリへ移動 |
| SCR-05 (Recovery ビュー) | HM-06 | HM カテゴリへ移動 |
| SCR-06 (Handover ビュー) | PM-05 | PM カテゴリへ移動 |
| SCR-07 (Trace ビュー) | PM-04 | V-model pair 状態統合 |
| SCR-08 | SCR-01 統合済 → PM-01 に吸収 | 独立 ID なし |
| SCR-11 (Doctor 結果ビュー) | HM-07 | HM カテゴリへ移動 |
| (新規) | HM-01 | 機能一覧ビュー (新設) |
| (新規) | HM-02 | カバレッジヒートマップビュー (新設) |
| (新規) | HM-03 | 配線図ビュー (CC1=a 再採用) |
| (新規) | HM-04 | データベース閲覧ビュー (CC1=a 再採用) |
| (新規) | HM-08 | AI 効果データ + Learning Engine ビュー (新設) |
| (新規) | GD-01 | ガイド/ドキュメント統合ビュー (新設) |
