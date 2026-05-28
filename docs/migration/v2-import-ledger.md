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

| # | 採択項目 | 反映先 |
|---|---|---|
| **A-33** | **画面要求 3 カテゴリ Bounded Context 分離 (PM/HM/GD)** (2026-05-28): PO 指摘「プロジェクト管理と UT ハーネス管理の画面分離 + 静的ガイドカテゴリ」を受け、SCR-NN 体系廃止・PM-NN / HM-NN / GD-NN に再採番。プロジェクト運用画面 (PM) / ハーネス管理・健全性画面 (HM) / ガイド・ドキュメント (GD) の 3 BC に分離 | `docs/design/harness/L1-requirements/screen-requirements.md` §1 画面一覧・採番体系 |
| **A-34** | **PM 画面群 V-model 駆動再設計** (2026-05-28): 「機能内容は PM の主題ではない」採用、PM 画面は進捗・担当・詰まり 3 軸に絞る。PM-01 プロジェクト俯瞰ダッシュボード = 4 階層プルダウン (俯瞰/工程/割当/詳細)、PM-02 工程ビュー = L0-L14 テンプレート駆動 (機能内容除外)、PM-03 Gate + 詰まり要因ビュー (横断)、PM-04 Trace ビュー + W-pair 統合、PM-05 Handover ビュー | `docs/design/harness/L1-requirements/screen-requirements.md` §PM 画面群 |
| **A-35** | **HM 拡張 8 画面化** (2026-05-28): 旧 SCR-04 Audit → HM-05、旧 SCR-05 Recovery → HM-06、旧 SCR-11 Doctor → HM-07 に再 ID。新規 5 画面追加: HM-01 機能一覧 (FR-L1 41 件 × implementation_status) / HM-02 カバレッジヒートマップ (観点 8 × 軸 5 = 40 通り) / HM-03 配線図 (動的、hook/provider/drive エラー赤表示、前回 doc 化専用判断を撤回し画面化採用) / HM-04 DB 閲覧 (state 整合性チェック付き、前回 CLI 専用判断を撤回し画面化採用) / HM-08 AI 効果データ + Learning Engine (BR-21 L3 carry、旧 SCR-14 AI 効果データを HM に統合再採番) | `docs/design/harness/L1-requirements/screen-requirements.md` §HM 画面群 |
| **A-36** | **GD カテゴリ新設 + §3 横断原則 4 件追加** (2026-05-28): 静的ガイド専用カテゴリとして GD-01 ガイド/ドキュメント統合ビュー (左サイドナビ切替 7 カテゴリ: Troubleshooting / Architecture / Onboarding / Tutorial / CLI / FAQ / Changelog) を新設。§3 横断原則に 4 件追加: 人間主導 + AI 補助 (S-01「AI は UI 操作なし」整合) / 全画面で詳細データテーブル必須 (サマリのみ画面 0 件) / AI 指示 copy UI 全画面配置 / 問題箇所視覚化 (正常/警告/失敗 = 🟢/🟡/🔴 色分け、HM-03/04 + PM-03 で動作確認対象) | `docs/design/harness/L1-requirements/screen-requirements.md` §GD 画面群 / §3 横断原則 |
| **A-37** | **L2 sub-doc skip ルール修正 (drive=be 全 skip 撤回)** (2026-05-28): PO 指摘「L2 スキップすんな。モックは作らなくてもせめて画面要求は作れよ」に従い、旧 concept §3.7「be (BE-only) = L2 全 skip 可」を「**be (UI を持つ) = 画面要求 3 sub-doc (screen-list / screen-flow / ui-element) 必須、wireframe (High-Fi モック) のみ省略可**」に修正。BE-only (UI 完全不在) のみ全 skip 可として明確に区別。画面要求の機械検証義務は drive 非依存で必須。ut-tdd 自身は 14 画面 dashboard を持つ「UI を持つ be」のため L2 画面要求 3 sub-doc 必須実施 | `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` §3.7 L2 sub-doc skip ルール / `docs/plans/PLAN-L1-03-screen-requirements.md` §0 + §7 carry / `docs/design/harness/L1-requirements/screen-requirements.md` §4 関連 doc |
| **A-38** | **G1-trace sub-gate 新設 (業務 ⇔ 画面 ⇔ 機能 双方向 trace 整合)** (2026-05-28): PO 指摘「本来は要求と画面要求を照らし合わせるゲートがいるな」に従い、G1 内 sub-gate (gate 番号は増やさず content/pair/trace の 3 段構造) として G1-trace を新設。機械検証ルール 4 件: R1 (BR/UX → 画面 12 件 block) / R2 (画面 → BR/UX/FR-L1 14 画面 block) / R3 (FR-L1 P0 18 件 block、P1-P2 warn) / R4 (screen sub-doc requires 整合 warn)。SSoT: screen §5 trace マトリクス (新規 6 sub-section)、functional §1「対応画面」列、business §10.3.1 連動注記。L14 OT-45 で被覆 (件数 44→45)。DD1=a + DD2=a 採用 (P0 のみ必須 block) | `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` §3.3.1 G1 sub-gate 構造 / `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` §1.10.H G1-trace lint / `docs/design/harness/L1-requirements/screen-requirements.md` §5 trace マトリクス / `docs/design/harness/L1-requirements/functional-requirements.md` §1 対応画面列 / `docs/design/harness/L1-requirements/business-requirements.md` §10.3.1 / `docs/test-design/harness/L1-operational-test-design.md` OT-45 |
| **A-39** | **L2-screen フォルダ新設 + wireframe 柔軟方針** (2026-05-28): PO 指示「L2 のフォルダ作っておいてこっちでモック吸収する」に従い、`docs/design/harness/L2-screen/` フォルダを新設し README + 4 sub-doc placeholder (screen-list / screen-flow / ui-element / wireframe) を起票。wireframe 運用は **Low-Fi (ASCII art) を harness 内デフォルト**、High-Fi モックはケース別判断 (harness 内保持 OR 外部依頼)。A-40 で「必ず外部にはならない」+ back-propagation 注記を追加修正 | `docs/design/harness/L2-screen/README.md` 新設 / `docs/design/harness/L2-screen/wireframe.md` placeholder / `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` §3.7 注記追記 / `docs/plans/PLAN-L1-03-screen-requirements.md` §7 carry / `docs/design/harness/L1-requirements/screen-requirements.md` §4 関連 doc |
| **A-40** | **wireframe 方針 PO 訂正 (必ず外部にはならない + 外部依頼時 back-propagation)** (2026-05-28): A-39 の表現「PO 外部吸収方針確定」が強すぎたため PO 訂正「必ず外部にはならないからな」に従い修正。**「外部吸収」→「外部依頼」表現に統一** (PO が外部に依頼する動詞的表現で明確化)。High-Fi モックは **ケース別判断** (harness 内保持 OR 外部依頼)、外部依頼は **許容オプションで必須ではない**。さらに PO 追加指示「外部依頼の場合は要件修正が入るかなら。L2 で本来やる工程をある程度確定した状態で出すんだから」を反映し、**外部依頼時の運用フロー** を wireframe.md に明示: (1) L2 確定 input を外部に渡す (確定状態が前提) → (2) 外部成果物が戻る → (3) harness 側レビュー → (4) 要件不整合あれば L1 screen / business / functional 修正 → **G1-trace (R1-R4) 再検証必須** → (5) L10 UX refinement へ。「要件修正 back-propagation は通常運用」として想定する | `docs/design/harness/L2-screen/wireframe.md` (status=placeholder + 外部依頼運用フロー追加) / `docs/design/harness/L2-screen/README.md` (柔軟方針 + back-propagation 注記) / `docs/design/harness/L2-screen/ui-element.md` (ケース別判断表現に修正) / `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` §3.7 (back-propagation 注記追記) / `docs/plans/PLAN-L1-03-screen-requirements.md` §7 carry (外部依頼選択時の back-propagation 明示) / `docs/design/harness/L1-requirements/screen-requirements.md` §4 関連 doc (柔軟方針) |
| **A-41** | **G1 readiness v8 Minor 5 件全件修正 (PO (b) 選択反映)** (2026-05-28): PO 選択 (b)「Minor 5 件の一部修正要請」を受け、全 5 件 + Bonus 1 件を G1 凍結前に修正。Minor 1: `frontmatterBaseSchema` に `v2_import: z.string().optional()` を追加 + テスト追加 (PLAN frontmatter で v2_import 任意フィールドが受理されることを vitest で検証、9 pass / 0 fail) — schema 正本外問題を解消。Minor 2: PLAN-L1-05 §4 冒頭に「Step 数差異の注記」追加 — Step 1〜8 = 8 step 構成の根拠 (§0 集約 readiness 整備責務) を明示、他 4 PLAN との差異を doc 化、業務影響なし。Minor 3: L14 OT-07 合否目安に **観測タイミング = L14 運用観測 (commit hook + CI gate) / 具体指標 = L3 AC で確定** の区分を追加 — 「L3 送り」表現を観測タイミング明示に改善 (§0 量閉じ原則と整合)。Minor 4: screen §4 に **§4.1 L3 PLAN 接続規約** サブセクション新設 — R4-screen-requires / 画面 ID 引用 / L2 carry 接続 / 横断原則 4 件継承 / G1-trace 継承 の 5 規約を表で定義、L3 起票時の最低 PLAN セット (PLAN-L3-01〜03) を明記。Minor 5: business §10.2 散文 1 段落を **L4 carry 表 7 行 (集約境界 / 値オブジェクト / entity ID 規約 / ライフサイクル / 不変条件 / 集約間整合性 / entity ↔ schema CLI 整合検出)** に箇条書き化 — 機械検証可能化、L4 PLAN (PLAN-L4-04) との接続規約も追記。Bonus: L2-screen wireframe.md の重複セクション 2 件 (§93-99 「L10 UX refinement との関係」 / §101-105 「carry / 次工程」) を削除 — §62-74 の既存記述と完全重複していたため | `src/schema/frontmatter.ts` (v2_import 追加) / `tests/frontmatter.test.ts` (v2_import テスト追加) / `docs/plans/PLAN-L1-05-nfr.md` §4 (Step 数注記) / `docs/test-design/harness/L1-operational-test-design.md` OT-07 (観測タイミング区分) / `docs/design/harness/L1-requirements/screen-requirements.md` §4.1 (L3 PLAN 接続規約) / `docs/design/harness/L1-requirements/business-requirements.md` §10.2 (箇条書き化) / `docs/design/harness/L2-screen/wireframe.md` (重複削除) |
| **A-42** | **L3 起票フレーム着地 (G1 PASS 後、L3 機能要件 sub-doc 構造立ち上げ)** (2026-05-28): PO「次に進んで」(G1 v8 PASS 解釈) を受け、L3 機能要件 sub-doc 構造をフレームレベルで起票。L3 PLAN 3 件起票: PLAN-L3-01 (FR + AC 詳細化、L2 deep-link、P0 18 件先行) / PLAN-L3-02 (BR-21 詳細化 + HM-08 連動 + FR-L1-36/38/43 Phase B carry、scope は Learning Engine 系のみで FR 一般詳細化と重複回避) / PLAN-L3-03 (NFR-01〜16 IPA グレード Lv + 受入閾値 + L4 ADR carry)。各 PLAN は frontmatter (next_pair_freeze=L12) + §0-§7 + ヒアリング項目 + 工程表 + DoD + carry を完備。`docs/design/harness/L3-functional/` フォルダ新設 + README + 3 sub-doc placeholder (functional-requirements / business-detail / nfr-grade)。L12 受入テスト設計 placeholder 起票 (`docs/test-design/harness/L3-acceptance-test-design.md`、L3 3 sub-doc ↔ L12 1 doc pair)。**L3 scope 分離**: screen / technical sub-doc は L3 で起こさない (screen = L1 + L2 で完結 / technical = L4 ADR + L4 基本設計に直送)。**G3-trace 候補設計**: L1 G1-trace と同様の構造で 4 軸 (R1 BR→L3 / R2 FR-*→AC→AT / R3 AT→要求 / R4 NFR→閾値→AT) 想定、本 PLAN Step 6 で確定。**CC2 carry 強制**: 各 L3 sub-doc は人間主導 + AI 補助原則を「人間判断点」明示で継承 | `docs/plans/PLAN-L3-01-functional-detail.md` 新設 / `docs/plans/PLAN-L3-02-business-detail.md` 新設 / `docs/plans/PLAN-L3-03-nfr-grade.md` 新設 / `docs/design/harness/L3-functional/README.md` 新設 / `docs/design/harness/L3-functional/functional-requirements.md` placeholder / `docs/design/harness/L3-functional/business-detail.md` placeholder / `docs/design/harness/L3-functional/nfr-grade.md` placeholder / `docs/test-design/harness/L3-acceptance-test-design.md` placeholder |
| **A-43** | **L3 ヒアリング項目 TL レビュー反映 (elicitation AI-first 原則適用、PO 直問 36 → 2 件削減)** (2026-05-28): PO 指摘「TL レビューでヒアリングは減らした？」を受け、A-42 で起票した PLAN-L3-01〜03 の §3 ヒアリング項目 計 36 件 (U-L3-1〜11 / U-BR21-1〜10 / U-NFR3-1〜15) を TL レビュー視点で再仕分け。memory [[feedback-elicitation-ai-first]] / [[feedback-elicitation-and-self-review]] 原則に従い、AI 推奨採用可能な項目を 🆕 draft 着地に変換、L4/Phase B 専決項目を ➡️ carry に明示、真に PO 判断が必要なものだけ ❓ で残す。**結果**: PLAN-L3-01 = 11/11 件 AI 採用 (PO 直問 0 件) / PLAN-L3-02 = 9/10 件 AI 採用 (PO 直問 1 件 = U-BR21-9 Phase B 着手条件) / PLAN-L3-03 = 14/15 件 AI 採用 + 4 件 ➡️ carry (PO 直問 1 件 = U-NFR3-1〜6 集約 IPA グレード Lv 全体方針)。**PO 直問削減**: 36 → 2 件 (94% 削減)。各 🆕 項目に TL 推奨採用根拠 (技術判断 / 業界標準 / 既存規約整合) を明示し、PO は G3 readiness 整備時に他項目と合わせて確認可能化。L1 G1 readiness 時の elicitation AI-first パターン (V1〜CC3 全 32 問 → 5 sub-doc + PASS サインオフのみに集約) を L3 で再現 | `docs/plans/PLAN-L3-01-functional-detail.md` §3 (全 11 項目 TL レビュー反映 + 凡例更新) / `docs/plans/PLAN-L3-02-business-detail.md` §3 (10 項目中 9 件 AI 採用 + 1 件 PO 必須残し) / `docs/plans/PLAN-L3-03-nfr-grade.md` §3 (15 項目 TL レビュー再仕分け + IPA Lv 集約 + 4 件 carry 明示) |
| **A-44** | **L3 ヒアリング項目 PO 直問 0 件達成 (PO 指摘「で、何が聞きたいの？」反映、AI 採用範囲再格上げ)** (2026-05-28): A-43 で残した PO 直問 2 件 (U-BR21-9 Phase B 着手条件 / U-NFR3-1〜6 集約 IPA Lv 全体方針) を PO 指摘「で、何が聞きたいの？」を受けて再評価。両件とも TL/AI で確定可能な範囲 (KPI 整合 + 業界標準 IPA 公式 sample 整合) と判定し、AI 採用に格上げ。**結果**: U-BR21-9 → 🆕 (Phase A G14 通過 + KPI D-07 ≥ 50% AND 条件、workflow 工程整合判断) / U-NFR3-1〜6 → 🆕 (可用性 Lv2 / 性能 Lv2 / 保守性 Lv3 / 移行性 Lv2 / セキュリティ Lv3 / 環境 Lv3、IPA 公式 sample 整合)。**PO 直問削減**: 36 → 2 → **0 件 (100% 削減)**。L3 PLAN 3 件全件「PO 判断対象 = 0 件」状態で本起草フェーズに進行可能。PO が後続で個別 override を要請した場合は L4 PLAN / Phase B 着手 PLAN で再調整可能 (本 PLAN は draft 着地状態で carry) | `docs/plans/PLAN-L3-02-business-detail.md` §3 (U-BR21-9 を ❓ → 🆕 採用根拠明記) / `docs/plans/PLAN-L3-03-nfr-grade.md` §3 (IPA Lv 集約を ❓ → 🆕 + 各 NFR 対応 Lv 詳細根拠明記) |
| **A-49** | **PO 指摘「要件定義で規定した機能一覧より増えているよね？追記してあるの？」反映 — L3→L1 back-propagation (FR-L1-45 doc-reviewer 追加 + FR-19→FR-45 リネーム、ID 衝突解消)** (2026-05-28): PO 指摘で L3 で追加した FR (A-47 Critical C-02 で起草した doc-reviewer FR) が L1 functional §1 に back-propagation されていなかった + L1 FR-L1-19 (Learning Engine、P1) と L3 FR-19 (doc-reviewer) で **ID 衝突** していた事実が発覚。**修正内容**: (a) L1 functional §1 表に **FR-L1-45 (doc-reviewer、BR-08 派生、P0)** 行追加 (件数 41 → 42、P0 18 → 19) / (b) L1 functional §1.1 翻案注記に「FR-L1-45 = L3 back-propagation 由来」明記 / (c) **L1 functional §1.2 「L3 back-propagation 由来 FR-L1 carry note」新設** = back-propagation 手順 6 step 明文化 (1: L3 発見 / 2: L3 起草 / 3: L1 §1 表追加 / 4: screen §5 紐付け / 5: ledger 記録 / 6: lint 件数更新) + 将来 add-design 候補 (FR-L1-multi-01/02) 宣言 / (d) L1 §5 BR-FR 対応で BR-08 → FR-L1-09 + FR-L1-45 に拡張 / (e) L3 functional FR-19 → FR-45 リネーム (見出し / AC × 3 / §2 冒頭表) + ID 衝突注記明示 / (f) L12 受入テスト AT-FR-19-* → AT-FR-45-* リネーム / (g) screen §5.3 P0 表 (18 → 19 件) に FR-L1-45 行追加 + §5.6 R3 件数更新 / (h) g3-trace.test.ts 件数更新 (41 → 42、FR-45 存在確認 assertion 追加)。**全 vitest 45 pass / 0 fail 維持**。**意義**: L3 で発見した新 FR を L1 に back-propagation する手順を **正本ルール化** (business §10.1.1 entity と同様の DDD evolution)。今後 L4-L7 で発見される新 FR も同手順で L1 に反映 | `docs/design/harness/L1-requirements/functional-requirements.md` §1 表 + §1.1 翻案 + §1.2 新設 + §5 / `docs/design/harness/L3-functional/functional-requirements.md` §2 FR-45 リネーム / `docs/test-design/harness/L3-acceptance-test-design.md` AT-FR-45-* / `docs/design/harness/L1-requirements/screen-requirements.md` §5.3 + §5.4 + §5.6 / `tests/g3-trace.test.ts` 件数 + assertion |
| **A-48** | **PO 指摘「機能一覧やドメインチェックのテストが走るべき」反映 — g3-trace lint + entity-coverage lint 実装 (vitest 45 pass)** (2026-05-28): PO 指摘を受け、A-47 で pmo-sonnet 手動 matrix で確認した内容を **vitest で機械強制化**。実装: (a) `src/lint/g3-trace.ts` (~180 行): markdown 5 doc (L1 functional / L3 functional / L3 business-detail / L3 nfr-grade / L12 受入テスト) を fs 読込 + regex で ID 抽出 (FR-L1-NN / FR-NN / AC-FR-NN-NN / AT-* / NFR-NN) + trace map 構築 + 孤児検出 (R1-R3 + NFR R4) / (b) `tests/g3-trace.test.ts` (10 test pass): L1 FR-L1 41 件 / L3 FR 19 件 / AC 60+ 件 / AT 80+ 件 / L1 NFR 14 件 (09/10 欠番) 抽出確認 + 4 孤児ルール全 PASS / (c) `src/lint/entity-coverage.ts` (~80 行): business §10.1 (主要 12 entity) + §10.1.1 (L3 由来 11 entity) を section 切り出し + 表行 regex で抽出 + 重複検出 / (d) `tests/entity-coverage.test.ts` (4 test pass): primary 12 件 + derived 11 件 + 計 23 件全件 unique + anti-corruption layer (primary と derived 別カテゴリ) 検証。**ESM module 互換性修正**: `import.meta.dir` (bun) → `fileURLToPath(import.meta.url) + dirname` (vitest/Node 互換)。**全 vitest 31 → 45 pass / 0 fail 維持** (+14 件追加)。pmo-sonnet matrix で「人手確認 = G3 readiness v3」だった項目を **L7 carry → 即時実装** に格上げ。L4 以降の FR/entity 追加時も CI で自動検知 | `src/lint/g3-trace.ts` 新規 / `src/lint/entity-coverage.ts` 新規 / `tests/g3-trace.test.ts` 新規 / `tests/entity-coverage.test.ts` 新規 |
| **A-47** | **PO 指摘「要件定義項目すべてカバー？」反映 — pmo-sonnet カバレッジ matrix + Critical 4 件解消 + P1 13 件 carry 明示 + D-01/D-04 補完 (G3 readiness v3)** (2026-05-28): PO 指摘「要件定義項目はすべてカバーできているの？」を受け pmo-sonnet (sonnet) で L1 5 sub-doc + governance × L3 3 sub-doc + L12 受入テスト の **カバレッジ matrix** (18 群 × 約 111 項目) を作成。**結果**: Critical 4 件 (G3 PASS 阻害リスク) + Important 10 件 + Minor 5 件発見。**Critical 4 件即座解消**: (C-01) UX-01 (3 バランス価値体験) AT 未設定 → functional §3.2 で AC-UX-01-01 (D-03=0 + D-04≥80% + D-06=0 + D-07≥70% の 3 軸全件 pass) + L12 §1.2 で AT-UX-01 追加 / (C-02) BR-08 doc-reviewer 独立 FR 不在 (G3 lint 孤児リスク) → functional §2 末尾に **FR-19 doc-reviewer 必須召喚** 新規起草 (AC 3 件 = 正常召喚 / 未召喚で G3 fail-close / PO bypass UT_TDD_DOC_REVIEWER_BYPASS) + L12 §1.1 で AT-FR-19-01〜03 / (C-03) NFR-03 (AI mode 非依存) nfr-grade エントリ・AT 不在 → nfr-grade §1 可用性表に NFR-03 行追加 (Lv2、4 mode 全動作 / mode 別差異 0) + L12 §1.3 で AT-NFR-03 / (C-04) opus override 禁止 AT 不在 → L12 §1.1 末尾に AT-FR-09-04 追加 (`Agent({subagent_type: pmo-sonnet, model: opus})` → fail-close exit 2、pdm-* 以外への opus 指定 block)。**Important 重点解消**: P1 13 件 (FR-L1-23〜30/37/39/42/44 + FR-L1-31/32) の L4 carry 明示 note を functional §3.1 に追記 (carry 先 + 受入条件 placeholder)、L4 PLAN 起票者の依存漏れ予防 / D-01 (PLAN 起票数) + D-04 (回帰検出率) を nfr-grade §3 に NFR-D01 / NFR-D04 行追加 + L12 §1.3 で AT 追加。**AT 件数**: 87 → 95 件 (Phase A 即実装 83 + carry 12)。**残 Important 6 件 + Minor 5 件**: G3 後 L4 起票時 carry として明示 (handover lifecycle / kind 固有 AC / G4-G14 / hook SessionStart/Stop / 問題視覚化 / UX-02 専用 AT / 工程専門 mode / cross layer / DORA 新 KPI / back-prop AT)。G1-trace R1/R2/R3 全 PASS 維持 (UX-01 漏れ解消で R1 完全) | `docs/design/harness/L3-functional/functional-requirements.md` §2 FR-19 新規 + §3.1 P1 carry 明示 + §3.2 UX-01 AC / `docs/design/harness/L3-functional/nfr-grade.md` §1 NFR-03 行 + §3 NFR-D01 / NFR-D04 行 / `docs/test-design/harness/L3-acceptance-test-design.md` §1.1 AT-FR-09-04 + AT-FR-19-01〜03 / §1.2 AT-UX-01 / §1.3 AT-NFR-03 + AT-NFR-D01 + AT-NFR-D04 / §1.4 件数まとめ更新 / `docs/handover/G3-readiness-report-2026-05-28.md` v3 |
| **A-46** | **PO 指摘 4 件反映 — 6 subagent 並列調査 + L1 entity back-propagation + L3 carry 拡張 (G3 readiness v2)** (2026-05-28): PO 指摘 (1)「コーディングルールはいつ作るの？」 (2)「ドメインの更新は？」 (3)「web 検索とかした？技術的にフォークできるものはなかった？解決の最速手段や改善のポイントもここで見つけたほうが良いんじゃない？」 (4)「pdm は呼ばなくていいの？」 を受け、AI-first 原則 (memory [[feedback-elicitation-ai-first]]) の Web 検索部分が抜けていた反省で 6 subagent を並列起動: pmo-tech-fork × 3 (BDD-AC / DDD entity + CLI / state / hook + coding standards / linter、sonnet) + pmo-tech-docs × 1 (V-model+AI / IPA × ISO 25010 + SonarQube / DDD back-propagation + Neurosymbolic Guard、sonnet) + pdm-tech-innovation × 1 (DORA + SPACE + Stripe/Linear、opus) + pdm-marketing-innovation × 1 (JTBD + NSM + Crossing Chasm + PLG + multi-team、opus)。pdm-* は agent-guard で opus 固定 (sonnet override block)、weekly quota 消費覚悟。**結果反映**: (a) L1 business §10.1.1 に L3 由来 entity 11 件 back-propagation 追加 (acceptance_criterion / acceptance_test / plan_evaluation / skill_evaluation / model_evaluation / poc_evaluation / ipa_grade / cutover_command / kpi_metric / evaluation_batch / derived_view、各 L4 carry 明示) + back-propagation protocol 4-step 宣言 / (b) L1 business §9 carry に 12 件追加: D-10〜D-13 (DORA) / D-14〜D-17 (SPACE) / BR-JTBD-01 + UX-04 / BR-NSM-01 / BR-TTV-01 / BR-multi-01/02 + FR-L1-multi-01/02 / back-propagation protocol / NFR 3-tier classification / Neurosymbolic Guard Pattern / Testable Contract as Freeze Gate / (c) L3 functional §7.1-§7.3 に fork 候補 6 領域 + PdM 提案 9 件 + 設計手法 4 件を集約、各 sub-doc §7/§9 carry に分散参照 / (d) G3 readiness v2 更新で PO 指摘 4 件反映明示。**残 PO 指摘 2 件は別 commit で governance 改善対応**: (i) PLAN 起票時の Web 検索 + フォーク + pdm 組込 process 改善 (PLAN テンプレ §3 ヒアリングに Step 0 = 外部調査追加) / (ii) agent-guard に opus pdm-* 系の追加制約 (明示 --allow 必要、weekly quota 保護)。Innovation Manager 役割は Opus 自身が兼ねて quota 節約 | `docs/design/harness/L1-requirements/business-requirements.md` §10.1.1 + §10.2 + §9 / `docs/design/harness/L3-functional/functional-requirements.md` §7.1-§7.3 / `docs/design/harness/L3-functional/business-detail.md` §9.1 / `docs/design/harness/L3-functional/nfr-grade.md` §7.4.1-§7.4.2 / `docs/handover/G3-readiness-report-2026-05-28.md` v2 |
| **A-45** | **L3 sub-doc 本起草完了 (3 sub-doc + L12 受入テスト 4 doc、G3 readiness v1 PASS)** (2026-05-28): PO「b」(L1 と同パターン、AI + TL レビューで確定 + PO サマリ確認) を受け、L3 機能要件 sub-doc 3 件 + L12 受入テスト設計 1 doc を本起草完了。**functional-requirements.md** (~400 行): FR-01〜18 (P0 18 件) を L3 で詳細化、各 FR に Given-When-Then AC 3 件 (正常/異常/境界、計 54 AC)、対応画面 / mode / drive / 人間判断点 (CC2) 列必須化、§3 carry 宣言 (P1/P2 = L4 / FR-L1-19 = Phase B / FR-L1-36/38/43 = PLAN-L3-02 委譲)、§4 screen §5 G1-trace 継承 + AC レベル拡張 6 件、§5 9 mode 被覆 (P0 で 6 mode 直接) + drive 軸 + 人間判断点全件サマリ。**business-detail.md** (~300 行): BR-21 評価サイクル 4 軸 (§1 PLAN 単位 default + §2 5 指標 + §3 sprint 末 + §4 半自動人間承認)、§5 HM-08 連動 (4 ソース統合 + 30 秒ポーリング + AI 指示 copy UI)、§6 Phase A/B 境界 (Phase A 宣言のみ + Phase B 着手条件 AND)、§7 FR-BR21-36/38/43 各 AC 2 件 (計 6 AC、Phase B carry)、CC2 carry 強化。**nfr-grade.md** (~250 行): 6 IPA 大項目 Lv2-3 確定 (TL 採用 = 内製ツール想定で過剰投資回避)、各 NFR に IPA Lv + 受入閾値 + 測定方法 + pass 条件 + AC、KPI integrated (D-02/05/06/07/09)、§7 carry (NFR-02/15 L4 ADR + NFR-09 L4 + NFR-17 Phase B PII redaction)。**L3-acceptance-test-design.md** (~300 行): AT-* 87 件量閉じ (AT-FR 54 + AT-BR21 15 + AT-NFR 18)、Phase A 即実装 75 件 + L4/Phase B carry 12 件、§4 G3-trace 機械検証 R1-R4 全 PASS (人手確認、機械実装は L7 carry)、孤児 0。PLAN-L3-01/02/03 Step 1-6 進捗反映 (Step 7 review は G3 readiness 集約で実施)。**G3-readiness-report-2026-05-28.md** (v1) 起票: PASS 判定 / PO 直問 0 件 / 確認事項 3 + サマリ 1 / commit chain | `docs/design/harness/L3-functional/functional-requirements.md` 本起草 / `docs/design/harness/L3-functional/business-detail.md` 本起草 / `docs/design/harness/L3-functional/nfr-grade.md` 本起草 / `docs/test-design/harness/L3-acceptance-test-design.md` 本起草 / `docs/plans/PLAN-L3-01-functional-detail.md` §4 Step 進捗 / `docs/plans/PLAN-L3-02-business-detail.md` §4 Step 進捗 / `docs/plans/PLAN-L3-03-nfr-grade.md` §4 Step 進捗 / `docs/handover/G3-readiness-report-2026-05-28.md` 新設 |
