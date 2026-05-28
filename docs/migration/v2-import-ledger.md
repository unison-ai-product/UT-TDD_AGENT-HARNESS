# HELIX v2 Import Ledger — 採択 / 保留 / 見送り の軌跡

> 目的: HELIX v2 (helix-workflows を L0→L1 で dogfooding した更新分) から UT-TDD へ**何を取り込み / 後段に回し / 見送ったか**を 1 本で追跡する採択台帳。
> 由来: `RetryYN/ai-dev-kit-vscode` `origin/main` (2026-05-28 時点)。v2 docs = `docs/v2/L0-helix-workflows/concept.md` / `docs/v2/L1-REQUIREMENTS.md` / `docs/v2/L1-requirements/*` / `docs/plans/L0,L1/*`。
> 起票: 2026-05-28 (session 28a)。本台帳自体が v2 の「移行 PLAN = 採択軌跡を残す」パターンの dogfood。
> 注: HELIX は PLAN を**日本語ファイル名**で管理するが、UT-TDD は Windows 文字化け回避で**英語ファイル名のみ** ([[memory: filename-english-only]])。取り込み時に翻訳する。

## 0. 取り込み方針

v2 は HELIX 自身を「プロダクト」として L0→L1 要求定義した内容で、UT-TDD の self-dogfooding と構造が同型。**設計概念のみ**取り込み、HELIX の実装 (Python/bash/helix.db/SQLite) は port せず ADR-001 (TS/Bun) で必要時に作り直す。W-model 規律を最優先し、confirmed L1 は G1 凍結前の今だけ安く拡張する。

## 1. 採択 (adopted — 本 session で正本へ反映済 or 反映中)

| # | 取り込み項目 | 反映先 | status |
|---|---|---|---|
| A-1 | **デグレ禁止** (上流変更が下流の対応を伴わず通るのを防ぐ。3 軸 = 上流→下流 ID 追随 / balance_ratio regression / trace 切れ) | L1 **BR-07** (draft) | 反映済 (機構は L3/L4 送り) |
| A-2 | **doc 品質の継続レビュー** (doc 専用 read-only reviewer = doc-reviewer、pmo-sonnet と責務分離) | L1 **BR-08** (draft) | 反映済 (role 定義は L3 FR) |
| A-3 | **実装宣言の真実性** (設計 doc の CLI/file/schema に implementation_status 列必須、机上宣言禁止) | L1 **NFR-08** (draft) | 反映済 (必須フォーマットは L3+ 全 doc) |
| A-4 | **subagent guard の機械強制** (許可リスト + model 明示 + override 禁止、fail-close) | `.claude/hooks/agent-guard.ts` 他 (commit `30a9299`) | **実装済**。HELIX bash+python3 を環境非依存 TS に再生 |
| A-5 | **subagent 定義の model frontmatter 必須** | `.claude/agents/*.md` (既存 19 件、全件 model 設定済) | 確認済。Opus 継承事故の構造的防止 |

### L0→L1 PLAN 作法 (process、本 session 以降の起票に適用)

v2 の L0→L1 進め方から、UT-TDD の PLAN 起票方法へ取り込む差分 (現行 PLAN-L1-01 = 単一 elicitation PLAN との比較):

| # | v2 パターン | 適用方針 |
|---|---|---|
| P-1 | **L1 を関心別に複数 PLAN 分割** (業務/機能/非機能/技術) + 業務先行→残り並列起票 | L3 以降の PLAN を関心別に分割し、ロール責務と並列化を明示する |
| P-2 | **工程間移行 PLAN を独立起票** (L0 baton を採択/保留/見送りに仕分けた軌跡を記録) | 本 ledger がその役割。今後の工程移行でも軌跡 PLAN を残す |
| P-3 | **frontmatter `pairs_test_design` に L14/L12 doc パスを列挙**して pair freeze を機械宣言 | 次の運用テスト設計 PLAN から PLAN frontmatter に pair を明記 |
| P-4 | **L0 concept §8 に「バトン (L1-IN-*)」節**を内蔵 (確定/未決を構造化して L1 へ引き渡し) | concept_v3.1 に L0→L1 baton 節を追補 (別 todo) |
| P-5 | **工程表に review Step を固定** (tl-advisor/self-review = gate evidence) | PLAN §工程表に self-review Step を明示 (self-review 前置ルールと整合) |

## 2. 保留 → forward (後段の工程で要求化・設計する)

| # | 項目 | 送り先 | メモ |
|---|---|---|---|
| F-1 | **並列エージェント・オーケストレーション** (タスク依存分解 → 最大 8 スロット並列ディスパッチ + 稼働チェック) | **L3 FR** | ハーネス中核機能。現状は .claude/CLAUDE.md の散文ポリシー + PM 手作業のみ (機械実装なし)。concept §2.6 配線 / requirements §7.8 に連結。PO 判断 = 「L3 要求化のみ」(2026-05-28) |
| F-2 | **machine / AI gate 判定分離** (static_subchecks は AI ゼロ、AI は設計判断のみ) | **L3/L4** | `ut-tdd doctor` / gate 設計の基本方針として参照 |
| F-3 | **balance_ratio 量閉じ性** (test_count / design_count ≥ 1.0、孤児テスト 0) | **L3/L12** | BR-07 ratchet の計測軸。要件-テスト対応に限定適用が現実的 |
| F-4 | **Reverse Gateway 整流** (Non-Forward 成果を正本へ直接書かず closure pipeline 経由) | **L2/L4** | 将来 Reverse/Incident mode 追加時の設計参考。現行は Forward/Scrum のみ |
| F-5 | **doc-reviewer role の実体** (model/召喚 trigger/coverage 監査) | **L3 FR** | BR-08 の下流 |
| F-6 | **implementation_status 必須フォーマット**の全設計 doc 適用 | **L3 以降の doc 規約** | NFR-08 の下流 |

## 3. 見送り (rejected — 現時点の規模・方針に合わない)

| # | 項目 | 見送り理由 |
|---|---|---|
| R-1 | **6 db 分離 + Event Sourcing** (helix.db 50+ table) | UT-TDD は SQLite すら未導入。現行ファイルベース state (`.ut-tdd/`) と規模が合わない。BR-06 ダッシュボードの DB 要求と合わせて L2/L4 で再検討 |
| R-2 | **9 mode 入口判定 + Bounded Context 10 分割 (DDD)** | 現行は Forward/Scrum の 2 mode のみ。BC 分離は複雑化が先走る。mode 追加時に再検討 |
| R-3 | **G1 conditional_approve (TL 経由の軽量承認)** | UT-TDD は PO=ユーザーが主判断者で単独 mode 主体。TL-advisor 経由の制度は馴染まない。self-review 前置で代替 |

## 4. 整合・留意

- **BR-06 ダッシュボード vs concept §8.1 軽量制約**の緊張 (既知、L2/L4 解決) は v2 の dashboard-design / helix.db と R-1 に関連。v2 の DB 設計を参考にしつつ UT-TDD は軽量を維持する判断は L2 entry。
- L1 追記 (BR-07/08・NFR-08) は **draft / G1 凍結前**。運用テスト設計 (L14 pair) で対応 OT を起こし、G1 で PO 確定する。

## 5. v2 全面構造取り込み (2026-05-28 後段、本 session 確定)

PO 指示「V モデルとモデル駆動を全部同じにしろ」を受け、v2 process docs (`vendor/helix-source/docs/v2/process/L00-L14`) + HELIX SKILL_MAP `§駆動タイプ別 L2〜L11` を **正本** として全面採用。§1-§3 の個別取り込みより上位の構造採用。

### 5.1 採択 (adopted、本 session で governance に反映)

| # | 採択項目 | 反映先 |
|---|---|---|
| **A-6** | **L1 sub-doc 構造** (業務 / 機能 / 画面 / 技術 / 非機能 の 5 sub-doc。L1 機能要求 ≠ L3 機能要件) | concept §3.1.2.1 / requirements §1.10.G / 構想書 §3.5 AP-11 |
| **A-7** | **L2-L6 sub-doc 構造** (L2=4 / L3=3 / L4=5 / L5=4 / L6=3。各 sub-doc が PLAN 単位) | concept §3.1.3.1 / requirements §1.10.G.1 / 構想書 §3.5 AP-12 |
| **A-8** | **PLAN 内蔵物原則** (PLAN = 機能 doc 単位、工程表 + 実装計画を内蔵、review Step 固定組み込み) | concept §3.6 / requirements §1.10.G.4 / 構想書 §3.5 AP-13 |
| **A-9** | **駆動別 L2-L14 挙動表** (be/fe/db/fullstack/agent × L2-L14 の中身とゲート判定。L10 要否 + L2 sub-doc skip ルール) | concept §3.7 / requirements §1.10.G.3 (drive × sub_doc 整合) |
| **A-10** | **sub_doc / skip_sub_doc frontmatter フィールド** (machine 強制) | requirements §1.10.G.2 |
| **A-11** | **L1 pair 修正** (L1 全 sub-doc ↔ L14 運用テスト設計 1 doc) | test-design/harness/L1-operational-test-design.md §0/§4 |
| **A-12** | **5 sub-doc 必須 § 構造の正本転写** (HELIX-workflows 実体 doc 4 件から各 sub-doc の §1〜§10 までを必須化) | concept §3.1.2.1 5 sub-doc 表 |
| **A-13** | **業務要求 §3.3 cross-cutting 横断機構** (interrupt / debt / drift-check / readiness) | concept §3.1.2.1 business 行 §3 |
| **A-14** | **業務要求 §6 業務スコープ外** (本 BR で扱わない FR / 画面 / 技術 / NFR / 実装の明示的除外) | concept §3.1.2.1 business 行 §6 |
| **A-15** | **業務要求 §7 L14 運用テスト pair 対応表** (BR-* ⇔ OT-* 1:1) | concept §3.1.2.1 business 行 §7 |
| **A-16** | **業務要求 §9 carry / 既知の不足 + §9.1 上流 baton carry 一覧** | concept §3.1.2.1 business 行 §9 |
| **A-17** | **業務要求 §10 業務 entity 列挙 (DDD ドメイン一覧)** + §10.1 主要業務 entity 一覧 + §10.2 L4 carry + §10.3 SSoT 参照 | concept §3.1.2.1 business 行 §10 / §3.1.2.2 / requirements §1.10.G.7 |
| **A-18** | **L0 → L1 → L4 ドメイン継承チェーン** (anti-corruption layer 原則、L1 entity は L0 用語と 1:1、独自定義禁止) | concept §3.1.2.2 (新節) / requirements §1.10.G.7 |
| **A-19** | **機能要求 §5 上流 baton 反映** (L0 企画書バトン項目と FR-L1-* の対応表 + carry 先) | concept §3.1.2.1 functional 行 §5 |
| **A-20** | **NFR §7 IPA × ISO 25010 二軸タグ表** (全 NFR-ID × IPA 大項目 × ISO 25010 特性) + §3 冒頭 carry 宣言 + §8 carry 接続記述 | concept §3.1.2.1 nfr 行 §7 |
| **A-21** | **技術要求 §4-§7** (state schema 二層構造 / 工程別 skill 注入機構 / 9 mode 共通基盤 / drift 解消方針「新規 drift 0 件 / week」) | concept §3.1.2.1 technical 行 §4-§7 |
| **A-22** | **4 doc 共通ヘッダー要素** (SSoT 参照宣言ブロック / 件数確定宣言 / L3 接続規約 / frontmatter pair_artifact + related_l0 + related_br + next_pair_freeze) | concept §3.1.2.3 (新節) / requirements §1.10.G.2 / §1.10.G.8 |
| **A-23** | **sub-doc 必須 § 機械検証 + ドメイン継承チェーン検証 + 共通ヘッダー要素検証** | requirements §1.10.G.6 / §1.10.G.7 / §1.10.G.8 |
| **A-24** | **HELIX-workflows 正本 47 doc 全件抽出 → L1 機能要求 (FR-L1-01〜35) 候補確定** (P0: 18 件 = UT-TDD core 必須 / P1: 12 件 = 推奨採用 / P2: 5 件 = 参考のみ) | 本 ledger §6 (新) に全件保存、L1 機能要求 sub-doc 起票時 (Step B-1) に転写 |

---

## §6 HELIX-workflows 正本由来 FR-L1 候補リスト (2026-05-28 確定、L1 機能要求 sub-doc 起票時の正本ネタ)

> 出典: `c:\Users\micro\Downloads\HELIX-workflows\helix-process\` 配下 47 doc (Group A 19 横断・配線 / Group B 11 mode workflow + 工程専門 2 / Group C 15 L0-L14 工程定義)。Agent (pmo-sonnet, model:sonnet) で全件 Read + 構造抽出 (`agentId: af1dfb471e21882c8`)。
> 重要度: **P0** = UT-TDD core 必須 (18 件) / **P1** = 推奨採用 (12 件) / **P2** = 参考のみ (5 件)。
> Step B-1 で `docs/design/harness/L1-requirements/functional-requirements.md` に転写、§1 機能一覧の正本となる。

| FR-L1-NN | 機能要求名 (1 行) | 出典 doc | 必要 input | 出力 output | 重要度 |
|---|---|---|---|---|---|
| FR-L1-01 | V字モデル (L0-L14) 全工程の PLAN 起票・進捗管理機能 | L0-concept / L1-requirements / L3〜L14 | 工程・機能名・記載項目 | PLAN ファイル (工程表 + 実装計画内蔵) | P0 |
| FR-L1-02 | TDD 強制フロー (テストファースト順序厳守・実装先行禁止) | L7-implementation | L6 機能設計 (関数仕様 / クラス設計 / エッジケース) | テストコード (red) → 本体実装 (green) | P0 |
| FR-L1-03 | V字 双方向 trace (設計 ⇔ テスト設計 4 artifact ペア確認) | test-perspective-gate / db-integration | 設計 PLAN + テスト設計 PLAN | trace 整合レポート、抜け漏れ検出 | P0 |
| FR-L1-04 | PLAN kind による逸脱記録・ドキュメント生成計画 (kind + generates + requires) | deviation-plan-map | モード種別・成果物パス・依存 PLAN | kind 付き PLAN レコード、generates 宣言 | P0 |
| FR-L1-05 | 決定論的 static ゲート (fail-close、gate-checks.yaml、AI 不要) | automation-gate-map | 工程・成果物・数値品質 | pass/fail 判定、ゲート証跡 (.ut-tdd/phase.yaml) | P0 |
| FR-L1-06 | V モデル本線 state 一元管理 (plan_registry / code_catalog / contract_registry / skill_catalog 等 6 種) | db-integration | PLAN / コード / テスト / カバレッジ | 成果物間の一致管理、drift 検証結果 | P0 |
| FR-L1-07 | state 自動登録 (5 イベント hook: PLAN 起票 / コード変更 / Codex 実行 / ゲート通過 / 停止) | db-auto-registration | hook イベント | state 自動更新、手動登録漏れ排除 | P0 |
| FR-L1-08 | 検出 → モード自動ルーティング (drift / 劣化 / 暴走 / 障害 → Recovery / Incident / Reverse / Refactor) | detection-routing | 検出シグナル | モード発動トリガー、対応 kind PLAN 起票 | P0 |
| FR-L1-09 | AI エージェントガード (agent_mandatory 監査 / budget 上限 / gate fail-close / lock) | recovery-workflow | AI 操作ログ、役割定義 | 逸脱警告・停止、audit ログ | P0 |
| FR-L1-10 | Recovery 収束フロー (再開ポイント確定 / 認識訂正履歴 / cutover_orchestrator ロールバック) | recovery-workflow | 暴走状態ログ、PLAN | recovery-log (再開ポイント・認識訂正履歴) | P0 |
| FR-L1-11 | 横断 4 機構 (interrupt / debt / drift-check / readiness) のモード進行非ブロック発動 | cross-cutting-mechanisms | 割り込みイベント / 負債台帳 / drift / 保留 | sprint interrupted / debt-register / 乖離レポート / 後工程 PLAN 先送り | P0 |
| FR-L1-12 | L 単位 文脈注入 (スキル / ワークフロー / 必須 agent / 推奨 command / orchestration の 5 要素) | layer-context-injection | L 種別、vmodel-semantics.yaml 注入セット定義 | AI の選択空間限定、迷い排除 | P0 |
| FR-L1-13 | Forward ワークフロー (L0 → L14 順行、PLAN → pair-freeze → implement → trace-freeze → review → accept) | automation-gate-map / L0〜L14 全工程 | 工程ゲート通過条件 | 工程進行、ゲート証跡 | P0 |
| FR-L1-14 | Reverse ワークフロー (5 type: code/design/upgrade/normalization/fullback、R0-R4 + RGC) | reverse-workflow | 既存コード / 設計文書 / 依存 | Rn 成果物 (evidence / contracts / as-is-design / gap-register / routing) | P0 |
| FR-L1-15 | Discovery ワークフロー (仮説 → PoC → verify → decide、Hypothesis status 管理、4 象限 Trigger 判定) | discovery-workflow | 仮説定義、verify script | poc PLAN、verify script、confirmed/rejected 判定 | P0 |
| FR-L1-16 | Incident ワークフロー (本番障害: 検出 → hotfix → 即リリース → 収束 → V モデル昇華) | incident-workflow | 本番障害アラート / SLO 逸脱 | troubleshoot/recovery PLAN、postmortem、L14 フィードバック | P0 |
| FR-L1-17 | CI/PR 連携 (ローカルゲート証跡 → CI 証跡検証 → branch protection PR 許可、ブランチ × モード対応) | ci-pr-workflow | ゲート証跡、push イベント | PR 許可/拒否、CI チェック結果 | P0 |
| FR-L1-18 | 横断検出 (依存漏れ / 契約漏れ / 接続欠損 / デグレ) を ut-tdd doctor で一括集約 | cross-detection | detector 全種実行結果 | 横断検出レポート、モードルーティング先 | P0 |
| FR-L1-19 | Learning Engine (成功実行 recipe 蓄積・頻出トラブル予防ルール化・スキル推薦改善・L 単位注入更新) | learning-engine | feedback_hook 5 軸 / skill 発火ログ / recovery-log / interrupt 履歴 / detector 結果 | recipe (pattern_key 付き)、予防ルール、推薦精度改善 | P1 |
| FR-L1-20 | 観測・計測層 (5 hook で AI 実行を全量ログ化、発火 / トラブル / 精度 / 予算のメトリクス集約) | observability-metrics | AI 実行イベント全種 | invocation_log / action_logs / gate_runs / accuracy_score / budget_events、dashboard メトリクス | P1 |
| FR-L1-21 | テスト観点 W 字ゲート (設計項目へのテスト観点抜け検出 + レベル間重複検出を static で fail-close) | test-perspective-gate | 設計 PLAN + テスト設計 PLAN、テストレベル定義 | 観点抜け一覧、重複観点一覧、pass/fail | P1 |
| FR-L1-22 | FE detector 5 軸 (mock-promotion / design-token-drift / a11y-regression / visual-regression / state-transition-drift) の決定論的判定 | fe-detector-spec | L2 モック / デザイントークン SSOT / スクリーンショット / 画面遷移定義 | DetectorResult (pass/fail+詳細)、CI 証跡 | P1 |
| FR-L1-23 | Scrum インクリメント → V モデル昇華フロー (ut-tdd reverse fullback で L1/L3/L4-L6/L8-L9 へ統合) | scrum-workflow | スプリント完成インクリメント | F0-F4 成果物、V モデル各工程ドキュメント追補 | P1 |
| FR-L1-24 | Add-feature ワークフロー (影響範囲差分追補、add-design / add-impl で既存 PLAN に requires 接続) | add-feature-workflow | 既存 PLAN、追加要求 | add-design / add-impl PLAN、追補ドキュメント | P1 |
| FR-L1-25 | Refactor ワークフロー (振る舞い不変を axis-11 regression で機械検証、kind=refactor) | refactor-workflow | 対象コード、既存テスト (保護網) | refactor PLAN、module、テスト緑確認結果 | P1 |
| FR-L1-26 | Retrofit ワークフロー (影響評価 retrofit-matrix + 段階移行 config 更新、kind=retrofit) | retrofit-workflow | 移行対象構造・依存 | retrofit-matrix、config、回帰テスト結果 | P1 |
| FR-L1-27 | Research ワークフロー (技術調査 → 比較評価 → ADR、kind=research、generates=research-memo + ADR) | research-workflow | 調査課題、選択肢・制約 | research-memo、ADR | P1 |
| FR-L1-28 | UT-TDD W 2 段設計 (Phase 1 一般システム + Phase 2 エージェント昇華を L10 で合流、drive=agent 追加) | two-stage-agent-design | Phase 1/2 各 L9 成果物 | L10 合流済み成果物、L11-L14 統合フロー | P1 |
| FR-L1-29 | 画面設計ワークフロー (L2: IA → 画面一覧・遷移 → ワイヤーフレーム Low-Fi/High-Fi → モックアップ → ユーザビリティテスト → コンポーネント化) | screen-design-workflow | L1 要求定義 | L2 成果物 (画面一覧 / 遷移図 / ワイヤーフレーム / UI 要素)、G2 モック凍結 | P1 |
| FR-L1-30 | フロントデザイン UX ワークフロー (L10: ビジュアルデザイン → デザイントークン SSOT → a11y → ビジュアル回帰 → UX 磨き上げ) | frontend-design-workflow | L9 総合テスト結果、L2 ワイヤーフレーム | L10 成果物、デザイントークン定義、L11 への引き渡し | P1 |
| FR-L1-31 | コンテキスト管理・自動走行 (Claude+Codex セッションクリーナー PoC: context 0.70 で fresh 再起動、handover 引き継ぎ) | continuous-run-context-management | context 使用率、handover.CURRENT.md | fresh Claude セッション、作業継続、サブスク課金内維持 | P2 |
| FR-L1-32 | フォルダ構成ルール (helix-process 文書 → 既存 docs/ への統合方針、tests 分散の役割明確化) | folder-structure-review | repo 文書群 | docs/ への配置マッピング定義 | P2 |
| FR-L1-33 | 既存資産棚卸し・充足度マッピング (コマンド / スキル / detector / template / state / hook / docs / tests の網羅確認) | asset-mapping | リポジトリ全資産 | 充足度レポート、不足項目リスト | P2 |
| FR-L1-34 | スキル・コマンド穴の優先順位管理 (vmodel-semantics 注入セット定義 / ut-tdd recover / ut-tdd route / retrofit skill 等) | integration-map | 穴リスト、設計確定済み仕様 | 優先順位付き実装タスクリスト | P2 |
| FR-L1-35 | 基盤整備状況の可視化 (実装済み / 設計済み・実装未 / 未設計の 3 区分で検証・テスト・検出基盤を一覧表示) | infra-readiness | 各機構の実装状況 | 整備状況一覧 (区分付き) | P2 |
| FR-L1-37 | model 推挙 (タスク性質・drive・コスト制約から最適 AI model を推薦し、agent 呼び出し前に候補提示) | learning-engine / layer-context-injection | タスク種別・drive・NFR-12 budget 制約 | model 推薦リスト (理由付き)、agent 呼び出し時の model 候補 | P1 |
| FR-L1-39 | タスク難易度推定 (PLAN 内容・drive・依存 skill から難易度スコアを算出し、委譲先 [Codex PE/SE/TL] を自動選定) | layer-context-injection / automation-gate-map | PLAN frontmatter・依存 FR・drive 種別 | 難易度スコア・委譲先推奨・所要時間見積 | P1 |
| FR-L1-40 | drive 別 state 区画 (be/fe/db/agent 等 9 drive ごとに `.ut-tdd/state/<drive>/` を分離管理し、区画跨ぎ汚染を skip_sub_doc で機械防止) | db-integration / db-auto-registration | drive 種別・PLAN frontmatter | drive 別 state ディレクトリ・skip_sub_doc 強制レポート | P1 |
| FR-L1-41 | drive 自動判定 (リポジトリ構成・PLAN 内容・ファイル拡張子から drive を推定し、frontmatter 未指定時の補完と不整合検出を行う) | db-integration / automation-gate-map | リポジトリ構成・PLAN 本文・拡張子一覧 | drive 推定結果・補完提案・不整合警告 | P1 |
| FR-L1-42 | AI provider 引継ぎ (Claude ↔ Codex セッション切替時に handover.CURRENT.json を経由して context・PLAN 状態・audit ログを引き継ぐ) | continuous-run-context-management / recovery-workflow | handover.CURRENT.json・PLAN registry・audit log | provider 切替後の context 連続性・作業継続可否レポート | P1 |
| FR-L1-44 | 途中導入 onboarding workflow (既存リポジトリへ UT-TDD を段階導入する際、baseline PLAN を自動生成し skip_sub_doc で欠損 sub-doc を機械強制回避しつつ段階整備する) | PO directed 2026-05-28 / retrofit-workflow | 既存 repo 構成・有無 sub-doc 一覧 | baseline PLAN セット・skip_sub_doc 設定・onboarding 進捗ダッシュボード | P1 |
| *(L3 carry)* | **FR-L1-36 (skill 評価) / FR-L1-38 (model 評価) / FR-L1-43 (PoC 計測)** — BR-21「AI 実行成果評価」経由で L3 以降に forward。L1 では BR-21 の宣言 carry として存在し OT-18 で確認のみ | — | — | — | P2 |

### §6.1 取り込み判断 (UT-TDD 文脈での翻案)

- HELIX 固有実装名 (`helix.db` / `helix-doctor` / `helix-recover` 等) は UT-TDD 文脈で `.ut-tdd/` state / `ut-tdd doctor` 等に置換
- HELIX-workflows の axis-* detector 番号体系 (axis-09 / axis-11 / axis-15-19 等) は UT-TDD では別系統として再採番
- P0 18 件は L1 機能要求 sub-doc の §1 機能一覧で確定、L3 で FR-* (機能要件) に詳細化
- P1 12 件 (HELIX-workflows 由来) + **P1 6 件 (PO directed 2026-05-28 新規)** = P1 計 18 件は L1 sub-doc で要求として宣言、L3/L4 で実装方式を ADR 化
- P2 5 件 (HELIX-workflows 由来) は L1 §5 forward に記載 (L3-L4 carry、運用整備系)

**出典カテゴリ区分 (A-28〜A-32 由来の新規 FR/NFR/BR は以下カテゴリで追跡)**:

| 出典カテゴリ | 対象 ID | 根拠 |
|---|---|---|
| HELIX-workflows 正本由来 | FR-L1-01〜35 | `helix-process/` 47 doc 全件 Read (agentId: af1dfb471e21882c8) |
| PO directed (2026-05-28) | FR-L1-37 / FR-L1-39 / FR-L1-40 / FR-L1-41 / FR-L1-42 / FR-L1-44 / NFR-16 / BR-21 | PO 判断 + Step 1 sub-doc 詳細化 session。HELIX-workflows に対応 doc なし、UT-TDD 固有追加 |
| L3 forward carry (BR-21 経由) | FR-L1-36 / FR-L1-38 / FR-L1-43 | BR-21「AI 実行成果評価」の下流 FR 候補。L1 では宣言のみ、L3 で FR-* 詳細化 |

### 5.2 派生 doc 再編 (next commit、本 ledger に予告)

A-6〜A-11 の governance 確定 (本 commit) を受け、次 commit で派生 doc を v2 構造に再編する:

| # | 再編対象 | 変更内容 |
|---|---|---|
| **B-1** | `docs/design/harness/L1-business-requirements.md` (単一 doc) | `docs/design/harness/L1-requirements/{business,functional,screen,technical,nfr}-requirements.md` の 5 sub-doc に分割。既存 BR-01〜08 / NFR-01〜08 / UX-01〜03 / Audit framework 由来 / Dashboard 由来を 5 sub-doc に再分配 |
| **B-2** | `docs/plans/PLAN-L1-01-business-requirements.md` (単一 PLAN) | PLAN-L1-01〜05 の 5 PLAN に分割。各 PLAN に工程表 + 実装計画を内蔵 (構想書 §3.6) |
| **B-3** | `docs/test-design/harness/L1-operational-test-design.md` | OT-01〜13 の trace 先を 5 sub-doc に再 reference。新規 sub-doc 由来要求の OT 追加は §3 量閉じ拡張で |

B-1〜B-3 は本 ledger 確定後に別 commit で実施。

### 5.3 v2 process L0-L14 と UT-TDD layer の整合確認 (2026-05-28)

UT-TDD concept §3 / requirements §1.4 はすでに **V2 L0-L14 + W-model + pair (L1↔L14 / L2↔L10 / L3↔L12 / L4↔L9 / L5↔L8 / L6↔L7) + G0.5-G14** を整合採用済 (v3.1 / v1.2 で完了)。本 session 追加分は **各 layer 内の sub-doc 構造 + 駆動別挙動 + PLAN 内蔵物** であり、L 番号体系自体の変更ではない。

### 5.4 9 駆動の確認

UT-TDD requirements §1.6 が定義する 9 駆動 (be/fe/fullstack/db/agent/scrum/reverse/poc/troubleshoot) は v2 HELIX SKILL_MAP の主要 4 (be/fe/scrum/fullstack) + エッジ 2 (db/agent) と整合 (poc/reverse/troubleshoot は経路 2/補助 1 専用)。**駆動 enum 自体の変更不要**、§3.7 挙動表を追加するのみで v2 取り込み完了。

### 5.5 sub-doc 解像度上げ (2026-05-28 Step 1 — 5 sub-doc 詳細化・新規追加)

PO 承認のもと、5 sub-doc をそれぞれ解像度アップ。本 ledger §5 に A-25〜A-32 として記録する。

| # | 採択項目 | 反映先 |
|---|---|---|
| **A-25** | **screen sub-doc 解像度上げ** (S1-S10 採用、SCR 7 画面確定: SCR-01〜07/11、SCR-08 統合、SCR-11 doctor 結果ビュー新規、各 SCR 情報要素/操作要素/更新頻度/状態種別 詳細化、6 遷移シナリオ [Recovery 復帰 + Discovery 追加]) | `docs/design/harness/L1-requirements/screen-requirements.md` |
| **A-26** | **business sub-doc 解像度上げ** (B1-B10 採用、§6.5 業務 KPI D-01〜D-09 表新設、§10.4 skill/detector 参照注記追加) | `docs/design/harness/L1-requirements/business-requirements.md` |
| **A-27** | **新規 BR-21「AI 実行成果の継続評価と改善サイクル」** (P2、Phase B 中心。FR-L1-36/38/43 の L3 carry pair 起点。F2=a 採用) | business-requirements.md §1 / §7 pair 表 |
| **A-28** | **新規 FR-L1-37/39/40/41/42 (5 件、全 P1)** (FR-L1-37: model 推挙 / FR-L1-39: タスク難易度推定 / FR-L1-40: drive 別 state 区画 / FR-L1-41: drive 自動判定 / FR-L1-42: provider 引継ぎ。F1=b 採用) | functional-requirements.md §1 / 本 ledger §6 |
| **A-29** | **新規 FR-L1-44 (途中導入 onboarding workflow)** (P1。論点2 採用 = baseline 段階作成 + skip_sub_doc 機械強制) | functional-requirements.md §1 / 本 ledger §6 |
| **A-30** | **§3.3 cross-cutting に「9 mode 統一合流原則」追記 + Add-feature 例外注記** (論点1 採用: Scrum/PoC/Reverse は V モデル昇華で収束。Add-feature のみ例外的差分追補) | business-requirements.md §3.3 |
| **A-31** | **新規 NFR-16「onboarding 互換性」** (FR-L1-44 連動、P2。NFR 件数 14 件確定) | nfr.md §1 |
| **A-32** | **drive 別 state 区画 (FR-L1-40) + AI provider 引継ぎ (FR-L1-42) technical 追記** (9 mode 統一合流原則段落 + onboarding bootstrap 行追加) | technical-requirements.md §4-§7 |

> 参照 commit: Step 1 並列更新 (2026-05-28)
