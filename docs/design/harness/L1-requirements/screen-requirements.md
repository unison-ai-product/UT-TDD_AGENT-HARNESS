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
> **件数確定**: screen は画面 7 件 (SCR-01〜07 + SCR-11、L1 要求レベル、L2 で具体化)。SCR-08 は SCR-01 に統合済 (S4=a、PO 承認 2026-05-28)。根拠: UX-02 / BR-06 / FR-L1-20/FR-L1-29 から導出。
> **L3 接続規約**: `next_pair_freeze: L3`。L3 PLAN は本 sub-doc 全件を `dependencies.requires` に列挙する。

# UT-TDD Agent Harness — L1 画面要求 (screen)

> **PO 判断 carry**: 画面要求は L2 モック検証で lift する。本 sub-doc では業務要求視点の必要画面のみ列挙し、UI 具体化は L2 に委ねる (FR-L1-29 参照)。

## §1 画面一覧

業務要求・機能要求から導出される必要画面 (L1 要求レベル):

| 画面 ID | 画面名 | 主要目的 | 対応 BR/FR |
|---------|--------|---------|-----------|
| **SCR-01** | ダッシュボード (工程表) | 複数プロダクト / 案件の工程表・進捗・詰まり・フェーズをリアルタイム横断可視化。**Mode ステータス常時表示パネル含む** (SCR-08 統合、S4=a) | BR-06 / UX-02 / FR-L1-20 / FR-L1-08 |
| **SCR-02** | PLAN ビュー | 単一 PLAN の詳細確認 (工程表 / 実装計画 / generates / requires / status)。パース済構造化表示 (S3=b) | FR-L1-01 / FR-L1-04 |
| **SCR-03** | Gate 判定ビュー | ゲート通過状況・証跡一覧・fail 理由 + next_action 表示 | FR-L1-05 / UX-03 |
| **SCR-04** | Audit ビュー | AI 実行ログ・逸脱警告・budget 使用状況・agent guard 判定履歴。**skill 注入ビューをタブ統合** (S8=b) | FR-L1-09 / FR-L1-20 / FR-L1-12 |
| **SCR-05** | Recovery ビュー | 暴走状態ログ・再開ポイント・認識訂正履歴・cutover ロールバック CLI コマンドコピー表示 (S5=b) | FR-L1-10 |
| **SCR-06** | Handover ビュー | セッション間引き継ぎ状態 (CURRENT.json の可視化)・next_action 確認。セッション開始時 auto 表示 (S6=a) | handover / FR-L1-01 |
| **SCR-07** | Trace ビュー | 上流 ID → 下流 ID の双方向 trace 整合マップ・デグレ / 抜け漏れ一覧 | FR-L1-03 / FR-L1-18 / BR-07 |
| **SCR-11** | Doctor 結果ビュー | `ut-tdd doctor` 全量検出結果の構造化表示 (SCR-07 と分離独立、S7=a) | FR-L1-18 / `ut-tdd doctor` |

### §1.1 SCR-01 ダッシュボード 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | PLAN 一覧テーブル (〜30 件、S1=b) / 現在 mode・phase / gate 最新状態 (pass/fail/warn) / AI 委譲状況サマリ / Mode ステータスパネル (9 mode 位置・drift 状況、SCR-08 統合) / sprint 残日数 / 直近 KPI (D-01/D-02/D-07) |
| **操作要素** | PLAN 行クリック → SCR-02 遷移 / フィルタ (mode/phase/status/drive) / 更新トリガー手動ボタン / gate fail 案件ハイライト表示 |
| **更新頻度** | 30 秒ポーリング (S2=b)、gate fail 時は即時反映 (B8: ≤ 5 分) |
| **状態種別** | 正常 (green) / 警告 (yellow、drift 検出) / エラー (red、gate fail) / 空 (PLAN 0 件) / 読み込み中 |

### §1.2 SCR-02 PLAN ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | PLAN frontmatter (id/title/drive/phase/status) / 工程表 (L-phase 進捗) / generates・requires リスト / sprint 一覧・現 sprint 状態 / gate 履歴 / carry 一覧 / 4 artifact trace 状態 |
| **操作要素** | gate 詳細 → SCR-03 遷移 / trace 確認 → SCR-07 遷移 / skill 注入タブ切替 (SCR-04 統合分) / PLAN 原文リンク |
| **更新頻度** | 30 秒ポーリング (S2=b)、PLAN 編集イベント受信時に即時 |
| **状態種別** | 正常 / gate blocked (赤バナー) / carry 未解決 (黄) / pair freeze 済 / trace freeze 済 |

### §1.3 SCR-03 Gate 判定ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | gate ID / 判定結果 (pass/fail/bypass) / 証跡一覧 (artifact リンク) / fail 理由テキスト / next_action (1 アクション明示) / サインオフ者 (PO/TL) / bypass 使用有無 + audit 記録リンク |
| **操作要素** | next_action コピー / 証跡ファイル参照リンク / ダッシュボード戻り |
| **更新頻度** | gate 実行直後に即時表示 (B8: gate fail 即時) |
| **状態種別** | pass (緑) / fail (赤、next_action 強調) / bypass (黄、audit 記録必須) / pending (未判定) |

### §1.4 SCR-04 Audit ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | agent guard 判定履歴 (allow/block/bypass) / AI 委譲ログ (model/role/task/result) / budget 使用量 / 逸脱警告一覧 / bypass 承認記録 / **skill 注入タブ** (S8=b: 推奨 skill 一覧・FR-L1-12) |
| **操作要素** | フィルタ (日付/agent/result) / skill 注入タブ切替 / bypass 詳細展開 |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 正常 / bypass 使用中 (黄警告) / guard block 多発 (赤警告) / 空 |

### §1.5 SCR-05 Recovery ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | 暴走状態ログ (検出日時・種別) / 再開ポイント (最終正常 gate) / 認識訂正履歴 / ロールバック CLI コマンド表示 (S5=b: UI 直接実行なし) / cutover 状態 |
| **操作要素** | CLI コマンドコピーボタン (クリップボード) / Audit ビュー参照 → SCR-04 遷移 / Recovery 収束後 → SCR-01 戻り |
| **更新頻度** | 30 秒ポーリング (S2=b) / 暴走検出時は即時通知 |
| **状態種別** | 正常 (Recovery 不要) / 暴走検出中 (赤) / ロールバック待ち (黄) / 収束済 (緑) |

### §1.6 SCR-06 Handover ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | CURRENT.json 可視化 (next_action / 現 phase / 未解決 carry / 最終 gate 結果) / セッション引き継ぎ履歴 / archive 期限 (30 日表示) |
| **操作要素** | next_action 実行 → 該当 SCR 遷移 / PLAN 参照 → SCR-02 / handover archive 確認 |
| **更新頻度** | セッション開始時 auto 表示 (S6=a) / 30 秒ポーリング (S2=b) |
| **状態種別** | 引き継ぎあり (next_action 強調) / 引き継ぎなし / stale (30 日超) / 読み込み中 |

### §1.7 SCR-07 Trace ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | 上流 ID → 下流 ID の双方向 trace グラフ / デグレ箇所ハイライト / trace 抜け漏れ一覧 / 整合率 (D-05 対応) / PLAN 別フィルタ |
| **操作要素** | trace ノードクリック → 対象 doc リンク / フィルタ (PLAN/phase/status) / Doctor 結果参照 → SCR-11 遷移 |
| **更新頻度** | 30 秒ポーリング (S2=b) |
| **状態種別** | 整合 (緑) / 抜け漏れあり (赤ハイライト) / 空 (trace 未登録) |

### §1.11 SCR-11 Doctor 結果ビュー 詳細

| 観点 | 内容 |
|------|------|
| **情報要素** | `ut-tdd doctor` 全量検出結果 (W-model 順序違反 / entity カバレッジ / hook 状態 / phase 整合 / carry 未解決) / 重要度別分類 (error/warn/info) / 検出件数サマリ (D-03 対応) |
| **操作要素** | 詳細展開 / Trace ビュー参照 → SCR-07 遷移 / PLAN 参照 → SCR-02 / doctor 再実行トリガー |
| **更新頻度** | doctor 実行時に即時反映 / 30 秒ポーリング (S2=b) |
| **状態種別** | クリーン (緑、0 件) / 警告あり (黄) / エラーあり (赤、D-03 = 0 件違反が崩れている) / 実行前 (未取得) |

## §2 画面遷移の要望

主要遷移シナリオ 6 パターン (S10=b、L1 要求レベル、詳細遷移図は L2 で具体化):

### シナリオ 1: Forward 通常進行

- ダッシュボード (SCR-01) → PLAN ビュー (SCR-02): 案件クリック
- PLAN ビュー (SCR-02) → Gate 判定ビュー (SCR-03): gate 結果詳細へ
- Gate 判定ビュー (SCR-03) → ダッシュボード (SCR-01): pass → 工程表更新

### シナリオ 2: Gate fail 時の next_action 参照

- Gate 判定ビュー (SCR-03) → PLAN ビュー (SCR-02): fail → next_action 参照
- PLAN ビュー (SCR-02) → Trace ビュー (SCR-07): trace 抜け漏れ確認
- Trace ビュー (SCR-07) → Doctor 結果ビュー (SCR-11): doctor 検出詳細

### シナリオ 3: Incident 発生時

- ダッシュボード (SCR-01) → Recovery ビュー (SCR-05): 障害シグナル受信 (赤アラート)
- Recovery ビュー (SCR-05) → Audit ビュー (SCR-04): audit ログ確認
- Audit ビュー (SCR-04) → ダッシュボード (SCR-01): 収束確認

### シナリオ 4: セッション再開時 (Handover)

- Handover ビュー (SCR-06) auto 表示 → PLAN ビュー (SCR-02): next_action に従い PLAN 参照
- PLAN ビュー (SCR-02) → Gate 判定ビュー (SCR-03): 前回中断 gate の状態確認
- SCR-01 Mode ステータスパネルで現在 phase 確認 (SCR-08 統合)

### シナリオ 5: Recovery 収束後の正常 mode 復帰

- Recovery ビュー (SCR-05) 収束済 → ダッシュボード (SCR-01): mode 正常化確認
- ダッシュボード (SCR-01) → PLAN ビュー (SCR-02): 中断前 PLAN の再開
- PLAN ビュー (SCR-02) → Gate 判定ビュー (SCR-03): 中断 gate からの再判定

### シナリオ 6: Discovery S0→S4 の画面遷移

- ダッシュボード (SCR-01) → PLAN ビュー (SCR-02): Discovery mode PLAN 確認
- PLAN ビュー (SCR-02) → Audit ビュー (SCR-04): PoC 実行ログ確認 (S1→S3)
- Gate 判定ビュー (SCR-03): S4 decide gate 判定
- Gate pass → ダッシュボード (SCR-01): Forward 合流後の工程表更新

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
| **Desktop 専用** (S9=a、モバイル非対応。レスポンシブ対応範囲外として明示) | S9=a PO 承認 2026-05-28 |
| **30 秒ポーリング更新** (S2=b、WebSocket 不使用。全画面共通の更新間隔) | S2=b / B8: ≤ 5 分 |
| **PLAN ビューはパース構造化表示** (S3=b、原文テキスト表示でなく frontmatter / セクション構造を解析して表示) | S3=b / FR-L1-01 |
| **Recovery ロールバックは CLI コマンドコピー** (S5=b、UI から直接ロールバック実行しない。CLI コマンドをクリップボードコピーする UI のみ提供) | S5=b / 安全性担保 |
| **Handover セッション開始時 auto 表示** (S6=a、セッション起動時に CURRENT.json が存在すれば SCR-06 を先頭表示) | S6=a / `ut-tdd session start` |
| **dark mode 不要、light モードのみ** (MVP スコープ外、Phase B 以降に持ち越し) | Q30 採用 / scope 削減 |
| **i18n 不要、日本語固定** (MVP 期間中は日本語 UI のみ、多言語対応は scope 外) | Q31 採用 / scope 削減 |
| **アクセシビリティ WCAG 2.1 AA 意識** (強制ではないが設計時に意識する。critical 操作の keyboard 操作対応を最低限とする) | Q32 採用 / NFR 連動 |

## §4 関連 doc

L2 画面設計 sub-doc 4 種への carry:

| L2 sub-doc | 役割 | 本 L1 からの引き継ぎ |
|-----------|------|---------------------|
| `docs/design/harness/L2-screen/screen-list.md` | 画面 ID・各画面の役割確定 | SCR-01〜07 + SCR-11 の役割定義 (画面数 7。SCR-08 は SCR-01 統合済) |
| `docs/design/harness/L2-screen/screen-flow.md` | 遷移図・条件・イベント詳細 | §2 遷移シナリオ 6 パターン |
| `docs/design/harness/L2-screen/wireframe.md` | 各画面のレイアウト・情報配置 | §3 表示要望 / §1.1〜1.11 情報要素 (SCR-11 wireframe 追加) |
| `docs/design/harness/L2-screen/ui-element.md` | 主要 UI コンポーネント・入力/表示/操作要素 | §1.1〜1.11 操作要素 / §3 操作要望 |

その他参照:

- L1 業務要求: `docs/design/harness/L1-requirements/business-requirements.md`
- L1 機能要求: `docs/design/harness/L1-requirements/functional-requirements.md` (FR-L1-20/29/30)
- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`

## §5 画面ペルソナと利用シナリオ (Q36 採用、PO 承認 2026-05-28)

### §5.1 画面ユーザー定義

| ペルソナ | 主/副 | 利用目的 | アクセス権 |
|---------|------|---------|-----------|
| **PO (ユーザー)** | 主 | スコープ確認・gate サインオフ判断・進捗把握・next_action 確認 | 全画面 read + gate サインオフ操作 |
| **harness 運用者** | 副 | state 確認・hook 状態確認・doctor 結果確認・Recovery 対応 | 全画面 read + doctor/Recovery 操作 |

> **AI エージェントは UI を直接操作しない。** AI (Claude Code / Codex) は CLI 経由のみで harness と連携し、画面ビューはすべて人間ペルソナのための可視化インターフェースである (S-01 / `.claude/CLAUDE.md` Guard Rules)。

### §5.2 ペルソナ別主要利用画面

| ペルソナ | 最優先画面 | 補助画面 |
|---------|-----------|---------|
| PO | SCR-01 (進捗把握) / SCR-03 (gate サインオフ) / SCR-06 (Handover) | SCR-02 / SCR-07 |
| harness 運用者 | SCR-11 (doctor 結果) / SCR-04 (Audit) / SCR-05 (Recovery) | SCR-01 / SCR-07 |
