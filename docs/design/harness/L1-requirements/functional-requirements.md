---
layer: L1
sub_doc: functional
status: confirmed
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L3
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: ユビキタス言語 = [L0 概念層 §10 用語集](../../../governance/ut-tdd-agent-harness-concept_v3.1.md#10-用語集) / 業界標準整合 = L0 §11 / Bounded Context = L0 §2.5 9-mode。本 doc は L0 を parent_doc reference とし、用語独自定義は行わない (anti-corruption layer)。
> **件数確定**: functional は **FR-L1-51 件で確定 (P0: 19 / P1: 24 / P2: 8)** (A-49 ledger で FR-L1-45 doc-reviewer back-propagation 追加、2026-05-28)。内訳: FR-L1-01〜35 は v2 source snapshot reference 設計概念参照 (v2-import-ledger §5.1 A-24 / §6)、FR-L1-37/39/40/41/42/44 は PO directed 新規 6 件 (2026-05-28)、**FR-L1-45 は L3 back-propagation 由来 (A-47 Critical C-02 → A-49 で L1 反映、BR-08 派生 P0)**、**FR-L1-50 は DDD/TDD strictness automation 追加 (PO directed 2026-06-09、IMP-097..101)**、**FR-L1-51 は artifact progress color projection 追加 (PLAN-L7-56 / PLAN-REVERSE-56、2026-06-22)**、**FR-L1-36 は P2 から昇格 (skill evaluation 実装済み、PLAN-L7-53、2026-06-15)**、**FR-L1-43 は P2 から昇格 (PoC success measurement 実装済み、PLAN-L7-53、2026-06-15)**、**FR-L1-38 は P2 から昇格 (model evaluation 実装済み、PLAN-L7-53、2026-06-15)**。
> **L3 接続規約**: `next_pair_freeze: L3`。L3 PLAN は本 sub-doc 全件を `dependencies.requires` に列挙する。

# UT-TDD Agent Harness — L1 機能要求 (functional)

> **L1 機能要求 ≠ L3 機能要件**: 本 sub-doc の FR-L1-* は「ユーザー視点で何の機能を望むか」= **要求**。L3 機能要件 (FR-*) は「システムが満たすべき仕様 + AC」= **要件**。本 sub-doc は L3 の入力であり別物。

## §1 機能一覧

FR-L1-01〜35: v2-import-ledger §6 より転写 (1:1 コピー)。FR-L1-37/39/40/41/42/44: PO directed 新規 6 件 (2026-05-28)。FR-L1-45: L3→L1 back-propagation (A-49、2026-05-28)。FR-L1-46〜49: 内部資産 UT-TDD 化 (BR-22 派生、Recovery PLAN-RECOVERY-01 / A-79、2026-05-29)。FR-L1-50: DDD/TDD strictness automation (PO directed 2026-06-09)。FR-L1-51: artifact progress color projection (PLAN-L7-56 / PLAN-REVERSE-56、2026-06-22)。FR-L1-36: P2 carry から昇格 (PLAN-L7-53 実装済み、2026-06-15)。FR-L1-43: P2 carry から昇格 (PLAN-L7-53 実装済み、2026-06-15)。FR-L1-38: P2 carry から昇格 (PLAN-L7-53 実装済み、2026-06-15)。**計 51 件**:

| FR-L1-NN | 機能要求名 (1 行) | 出典 doc | 必要 input | 出力 output | 重要度 | 対応画面 (G1-trace) |
|---|---|---|---|---|---|---|
| **FR-L1-01** | V字モデル (L0-L14) 全工程の PLAN 起票・進捗管理機能 | L0-concept / L1-requirements / L3〜L14 | 工程・機能名・記載項目 | PLAN ファイル (工程表 + 実装計画内蔵) | P0 | PM-02 / PM-01 |
| **FR-L1-02** | TDD 強制フロー (テストファースト順序厳守・実装先行禁止) | L7-implementation | L6 機能設計 (関数仕様 / クラス設計 / エッジケース) | テストコード (red) → 本体実装 (green) | P0 | PM-02 (L7 工程) / HM-07 |
| **FR-L1-03** | V字 双方向 trace (設計 ⇔ テスト設計 4 artifact ペア確認) | test-perspective-gate / db-integration | 設計 PLAN + テスト設計 PLAN | trace 整合レポート、抜け漏れ検出 | P0 | **PM-04 (直接)** / HM-07 |
| **FR-L1-04** | PLAN kind による逸脱記録・ドキュメント生成計画 (kind + generates + requires) | deviation-plan-map | モード種別・成果物パス・依存 PLAN | kind 付き PLAN レコード、generates 宣言 | P0 | PM-02 / HM-01 |
| **FR-L1-05** | 決定論的 static ゲート (fail-close、gate-checks.yaml、AI 不要) | automation-gate-map | 工程・成果物・数値品質 | pass/fail 判定、ゲート証跡 (.ut-tdd/phase.yaml)。※ extended (既存 source capability W1/W2/W13 突合、2026-06-04): `ut-tdd gate <G>` は `ut-tdd status` の execution mode を参照し、判断ゲート (G0.5/G2/G4-G7/R4) では cross-agent / intra_runtime_subagent review 証跡を必須化する。gate / plan lint / vmodel lint / security guard の判定は runtime 差で分岐させず fail-close の単一ルールに寄せる | P0 | **PM-03 (直接)** / HM-07 |
| **FR-L1-06** | V モデル本線 state 一元管理 (plan_registry / code_catalog / contract_registry / skill_catalog 等 6 種) | db-integration | PLAN / コード / テスト / カバレッジ | 成果物間の一致管理、drift 検証結果。※ extended: drive 別 state 区画 (FR-L1-40 と連動)、V モデル正本 DB の SSoT 強化 | P0 | **HM-04 (直接 DB 閲覧)** / HM-01 |
| **FR-L1-07** | state 自動登録 (5 イベント hook: PLAN 起票 / コード変更 / Codex 実行 / ゲート通過 / 停止)。※ extended (PLAN-REVERSE-02 fullback、2026-06-02): **session-log hook (SessionStart/PostToolUse/Stop) が session イベントを fail-open で記録し PLAN 単位ダイジェストに圧縮** → handover/audit/FR-L1-19 へ接続。state 自動登録 (fail-close) とは別系統の観測 hook (実装 src/runtime/session-log.ts、PLAN-L6-03/L7-01)。※ extended (PLAN-REVERSE-03 fullback、2026-06-02): session-log の facet として **forced-stop 検出** (SessionStart で dangling session を強制停止と推定 → 是正フィードバックのみ記録 → concept §2.6.1 `forced_stop`=`agent_runaway` 級 Recovery trigger、起票は人間 yes、実装 src/runtime/forced-stop.ts、PLAN-L6-04/L7-02) | db-auto-registration | hook イベント | state 自動更新、手動登録漏れ排除、session ダイジェスト、forced-stop フィードバック | P0 | HM-04 / HM-03 (hook 配線) |
| **FR-L1-08** | 検出 → モード自動ルーティング (drift / 劣化 / 暴走 / 障害 → Recovery / Incident / Reverse / Refactor) | detection-routing | 検出シグナル | モード発動トリガー、対応 kind PLAN 起票。※ extended: drive 自動判定 (FR-L1-41) を入力に加える | P0 | PM-01 (Mode ステータス) / HM-03 (drive 判定 配線) |
| **FR-L1-09** | AI エージェントガード (agent_mandatory 監査 / budget 上限 / gate fail-close / lock) | recovery-workflow | AI 操作ログ、役割定義 | 逸脱警告・停止、audit ログ | P0 | **HM-05 (直接 agent guard audit)** / HM-03 |
| **FR-L1-10** | Recovery 収束フロー (再開ポイント確定 / 認識訂正履歴 / cutover_orchestrator ロールバック) | recovery-workflow | 暴走状態ログ、PLAN | recovery-log (再開ポイント・認識訂正履歴)。※ extended (A-54 audit 軸1 C-04): recovery kind PLAN は `aim` 必須 + 7 必須セクション (事故記録 / 議論順序 / 認識訂正履歴 / 中間結論 / context 再構築 / 再開ポイント / 再発防止、L0 §6.2)。hotfix ブランチは postmortem doc 存在 + recovery PLAN 紐付けを Branch Protection で必須化 (L0 §6.3、FR-L1-17 連動)。※ extended (既存 source capability W17 突合、2026-06-04): lock / job queue / rollback / cutover rehearsal は Recovery 収束と本番・準本番の安全停止に属する release hardening 能力として扱い、既定開発経路では任意、Recovery / Incident / Deploy 系 PLAN では証跡化対象にする | P0 | **HM-06 (直接)** / PM-03 |
| **FR-L1-11** | 横断 4 機構 (interrupt / debt / drift-check / readiness) のモード進行非ブロック発動 | cross-cutting-mechanisms | 割り込みイベント / 負債台帳 / drift / 保留 | sprint interrupted / debt-register / 乖離レポート / 後工程 PLAN 先送り | P0 | PM-03 (詰まり要因) / HM-07 |
| **FR-L1-12** | L 単位 文脈注入 (スキル / ワークフロー / 必須 agent / 推奨 command / orchestration の 5 要素) | layer-context-injection | L 種別、vmodel-semantics.yaml 注入セット定義 | AI の選択空間限定、迷い排除。※ extended: 工程別スキル推挙システム (FR-L1-37 と連動) を含める。skill_catalog の各 L エントリに「推挙スコア + 選定理由」フィールド。※ extended (A-54 audit 軸1 C-01/I-03): 5 要素のうち orchestration は `orchestration_mode` 5 値 enum {pm_lead / claude_judge / claude_judge_codex_impl / codex_impl_qa_verify / claude_design_impl} (L0 §2.6.4) を注入し、各値の「誰が判断し誰が実装するか」を確定。hybrid 不在時は L0 §2.1.2.1 縮退規則に従い silent fallback を禁止し不在を明示記録 (FR-L1-08 連動、判断ゲートは必ず execution mode を参照)。※ extended (既存 source capability W3/W4/W10 突合、2026-06-04): `ut-tdd task classify` / `ut-tdd task estimate` / `ut-tdd skill suggest` / `ut-tdd team run` を本機能の実行面として扱い、team run は frontier-reviewer / worker / fast-checker へ役割分離し、同一 runtime + model による作成・承認の兼任を禁止する | P0 | HM-05 (skill 注入タブ) / HM-02 |
| **FR-L1-13** | Forward ワークフロー (L0 → L14 順行、PLAN → pair-freeze → implement → trace-freeze → review → accept) | automation-gate-map / L0〜L14 全工程 | 工程ゲート通過条件 | 工程進行、ゲート証跡。※ extended (既存 source capability W4/W13 突合、2026-06-04): `ut-tdd review --uncommitted` を trace-freeze 後 / accept 前の差分レビュー導線として扱い、未コミット差分・設計/テスト/コード3点trace・依存/重複/機能整合を evidence に残す | P0 | PM-01 / PM-02 |
| **FR-L1-14** | Reverse ワークフロー (5 type: code/design/upgrade/normalization/fullback、R0-R4 + RGC) | reverse-workflow | 既存コード / 設計文書 / 依存 | Rn 成果物 (evidence / contracts / as-is-design / gap-register / routing)。※ extended: onboarding context (FR-L1-44 の前段) として R0-R4 を再利用可能。Scrum (FR-L1-23 fullback) / Incident (FR-L1-16 収束後恒久化) も Reverse の closure mechanism を共通再利用 | P0 | PM-02 (Reverse 工程) / HM-07 |
| **FR-L1-15** | Discovery ワークフロー (仮説 → PoC → verify → decide、Hypothesis status 管理、4 象限 Trigger 判定) | discovery-workflow | 仮説定義、verify script | poc PLAN、verify script、confirmed/rejected 判定 | P0 | PM-02 (Discovery 工程) / HM-05 |
| **FR-L1-16** | Incident ワークフロー (本番障害: 検出 → hotfix → 即リリース → 収束 → V モデル昇華) | incident-workflow | 本番障害アラート / SLO 逸脱 | troubleshoot/recovery PLAN、postmortem、L14 フィードバック。※ extended: Reverse fullback 経由で V モデル昇華 | P0 | PM-03 (障害シグナル) / HM-06 |
| **FR-L1-17** | CI/PR 連携 (ローカルゲート証跡 → CI 証跡検証 → branch protection PR 許可、ブランチ × モード対応) | ci-pr-workflow | ゲート証跡、push イベント | PR 許可/拒否、CI チェック結果。※ extended (既存 source capability W8 突合、2026-06-04): `harness-check` は単一 Required Status Check とし、内部で branch-kind-check / commitlint / plan-lint / vmodel-lint / regression-test / poc-no-merge-guard / hotfix-postmortem-required / scrum-reverse-lint を branch type 別に適用する。commitlint / CODEOWNERS / branch protection は `ut-tdd setup` の team phase と接続する | P0 | PM-03 (gate 証跡) / HM-07 |
| **FR-L1-18** | 横断検出 (依存漏れ / 契約漏れ / 接続欠損 / デグレ) を ut-tdd doctor で一括集約 | cross-detection | detector 全種実行結果 | 横断検出レポート、モードルーティング先 | P0 | **HM-07 (直接 Doctor)** / PM-04 |
| **FR-L1-19** | Learning Engine (成功実行 recipe 蓄積・頻出トラブル予防ルール化・スキル推薦改善・L 単位注入更新) | learning-engine | feedback_hook 5 軸 / skill 発火ログ / recovery-log / interrupt 履歴 / detector 結果 | recipe (pattern_key 付き)、予防ルール、推薦精度改善。※ extended: スキル破棄・改修自動化を含む。skill_rating 閾値以下を廃止候補としてフラグ、削除は人間確認必須 (F6=a、CLAUDE.md destructive 禁止事項)。ログ型失敗/成功蓄積 (event-sourced recipe log) を recipe store 実装方式として明記。※ extended (A-54 audit 軸1 C-02): 「失敗を仕組みに変換」原則 (L0 §1.4) に基づき GitHub PR / GHA / job summary から失敗 event を pull し、失敗種別の集計・同種反復検出・再発防止 PLAN 自動提案へ接続する (チーム共有 audit。failure_log local とは分離 L0 §8.5、escalation L0-L3 §8.3 の入力経路) | P1 | HM-08 / GD-01 |
| **FR-L1-20** | 観測・計測層 (5 hook で AI 実行を全量ログ化、発火 / トラブル / 精度 / 予算のメトリクス集約) | observability-metrics | AI 実行イベント全種 | invocation_log / action_logs / gate_runs / accuracy_score / budget_events、dashboard メトリクス。※ extended: スキル使用パラメータ + モデルパラメータ + トラブル計測 + トークン/利用コスト の 4 軸を計測対象に追加 (L3 で AC 詳細化、F7=b に従い L1 はスコープ宣言のみ) | P1 | HM-05 / HM-08 |
| **FR-L1-21** | テスト観点 W 字ゲート (設計項目へのテスト観点抜け検出 + レベル間重複検出を static で fail-close) | test-perspective-gate | 設計 PLAN + テスト設計 PLAN、テストレベル定義 | 観点抜け一覧、重複観点一覧、pass/fail | P1 | PM-04 |
| **FR-L1-22** | FE detector 5 軸 (mock-promotion / design-token-drift / a11y-regression / visual-regression / state-transition-drift) の決定論的判定 | fe-detector-spec | L2 モック / デザイントークン SSOT / スクリーンショット / 画面遷移定義 | DetectorResult (pass/fail+詳細)、CI 証跡 | P1 | HM-07 (L2/L4 carry) |
| **FR-L1-23** | Scrum インクリメント → V モデル昇華フロー (ut-tdd reverse fullback で L1/L3/L4-L6/L8-L9 へ統合) | scrum-workflow | スプリント完成インクリメント | **F0-fullback-evidence.yaml / F1-fullback-contracts.yaml / F2-fullback-as-is-review.md / F3-fullback-handover-checklist.yaml / F4-fullback-routing.md** の 5 generates (kind=fullback 必須宣言、FR-L1-04 適用)、V モデル各工程ドキュメント追補 | P1 | PM-02 |
| **FR-L1-24** | Add-feature ワークフロー (影響範囲差分追補、add-design / add-impl で既存 PLAN に requires 接続) | add-feature-workflow | 既存 PLAN、追加要求 | add-design / add-impl PLAN、追補ドキュメント | P1 | PM-02 |
| **FR-L1-25** | Refactor ワークフロー (振る舞い不変を axis-11 regression で機械検証、kind=refactor) | refactor-workflow | 対象コード、既存テスト (保護網) | refactor PLAN、module、テスト緑確認結果 | P1 | PM-02 |
| **FR-L1-26** | Retrofit ワークフロー (影響評価 retrofit-matrix + 段階移行 config 更新、kind=retrofit) | retrofit-workflow | 移行対象構造・依存 | retrofit-matrix、config、回帰テスト結果 | P1 | PM-02 |
| **FR-L1-27** | Research ワークフロー (技術調査 → 比較評価 → ADR、kind=research、generates=research-memo + ADR) | research-workflow | 調査課題、選択肢・制約 | research-memo、ADR | P1 | PM-02 / GD-01 (ADR) |
| **FR-L1-28** | UT-TDD W 2 段設計 (Phase 1 一般システム + Phase 2 エージェント昇華を L10 で合流、drive=agent 追加) | two-stage-agent-design | Phase 1/2 各 L9 成果物 | L10 合流済み成果物、L11-L14 統合フロー | P1 | (L10 carry、画面紐付け薄い) |
| **FR-L1-29** | 画面設計ワークフロー (L2: IA → 画面一覧・遷移 → ワイヤーフレーム Low-Fi/High-Fi → モックアップ → ユーザビリティテスト → コンポーネント化) | screen-design-workflow | L1 要求定義 | L2 成果物 (画面一覧 / 遷移図 / ワイヤーフレーム / UI 要素)、G2 モック凍結 | P1 | PM-02 (L2 工程進捗管理) |
| **FR-L1-30** | フロントデザイン UX ワークフロー (L10: ビジュアルデザイン → デザイントークン SSOT → a11y → ビジュアル回帰 → UX 磨き上げ) | frontend-design-workflow | L9 総合テスト結果、L2 ワイヤーフレーム | L10 成果物、デザイントークン定義、L11 への引き渡し | P1 | (L10 carry) |
| **FR-L1-31** | コンテキスト管理・自動走行 (Claude+Codex セッションクリーナー PoC: context 0.70 で fresh 再起動、handover 引き継ぎ) | continuous-run-context-management | context 使用率、handover.CURRENT.json | fresh Claude セッション、作業継続、サブスク課金内維持 | P2 | PM-05 (Handover) |
| **FR-L1-32** | フォルダ構成ルール (source process reference 文書 → 既存 docs/ への統合方針、tests 分散の役割明確化) | folder-structure-review | repo 文書群 | docs/ への配置マッピング定義 | P2 | GD-01 (Architecture) |
| **FR-L1-33** | 既存資産棚卸し・充足度マッピング (コマンド / スキル / detector / template / state / hook / docs / tests の網羅確認) | asset-mapping | リポジトリ全資産 | 充足度レポート、不足項目リスト。※ extended (既存 source capability W11/W12/W16 突合、2026-06-04): workflow/task/agent builder、audit/metrics/dashboard、asset/code catalog は本機能の棚卸し対象に含め、Phase 0 の必須開発導線ではなく、後続 PLAN の候補機能・trace hint・CI summary として分類する | P2 | HM-01 / HM-02 |
| **FR-L1-34** | スキル・コマンド穴の優先順位管理 (vmodel-semantics 注入セット定義 / ut-tdd recover / ut-tdd route / retrofit skill 等) | integration-map | 穴リスト、設計確定済み仕様 | 優先順位付き実装タスクリスト | P2 | HM-02 |
| **FR-L1-35** | 基盤整備状況の可視化 (実装済み / 設計済み・実装未 / 未設計の 3 区分で検証・テスト・検出基盤を一覧表示) | infra-readiness | 各機構の実装状況 | 整備状況一覧 (区分付き) | P2 | HM-01 |
| **FR-L1-36** | スキル評価システム (per-skill rating / adoption / success / unused flag を skill_invocations + plan_registry から projection) | BR-21 / PLAN-L7-53 (2026-06-15 P2 carry から昇格) | skill_invocations.accepted=1 件、plan_registry.status、asOf timestamp | skill_evaluations projection (skill_rating 0.0-1.0、adoption_count、success_count、unused_flag)。cold-start = 0 行。unused = 30 日以内発火なし。削除は人手のみ | P2 | HM-05 |
| **FR-L1-37** | モデル/エフォート推挙システム (task × drive × L 別 model + reasoning effort 動的選定) | PO directed (2026-05-28) | task 分類結果 (FR-L1-39)、drive、L 層、budget 残量 | 推奨 model ID、reasoning effort 値、選定根拠ログ。FR-L1-12 (L 単位注入) の model 粒度拡張。FR-L1-39 上流 input。※ extended (既存 source capability W3/W4 突合、2026-06-04): `ut-tdd task estimate` と `ut-tdd skill suggest` の出力を入力に、frontier-reviewer / worker / fast-checker の capability class と reasoning effort を選定する | P1 | HM-08 |
| **FR-L1-38** | model 評価システム (per-model success rate を model_runs + plan_registry から projection、opt-in) | BR-21 / PLAN-L7-53 (2026-06-15 P2 carry から昇格) | model_runs (run_id, runtime, model, role, drive, plan_id, started_at, completed_at, evidence_path)、plan_registry.status、.ut-tdd/config/model-opt-in.yaml (enabled:true で有効化) | model_evaluations projection (model PK、success_rate REAL 0.0-1.0、run_count INTEGER、success_count INTEGER、evaluated_at TEXT)。opt-in 無効 = 0 行。cold-start = 0 行。cost 効率は token telemetry 未実装のため declared follow-up (PLAN-L7-53) | P2 | HM-08 |
| **FR-L1-39** | タスク難易度測定システム (規模 / 依存 / 不確実性 × drive 別スコアリング) | PO directed (2026-05-28) | PLAN 内容 (kind/generates/requires)、過去実行ログ、drive | task_complexity_score (P0/P1/P2 分類)、推奨エフォート。FR-L1-37 上流。FR-L1-05 の事前 triage。※ extended (既存 source capability W3 突合、2026-06-04): `ut-tdd task classify --text/--plan/--diff` を公開I/Oとし、kind / drive / size / complexity / risk flags を構造化して plan lint・gate・skill suggest に渡す | P1 | HM-08 / HM-05 |
| **FR-L1-40** | drive 別 state 分離管理 (`.ut-tdd/drive/<drive>/`、skip_sub_doc 機械強制) | PO directed (2026-05-28) | drive 種別 (PLAN frontmatter)、L 層 | drive 別 state 区画、skip_sub_doc 自動検証結果。FR-L1-06 (state 一元管理) の drive 軸 extension | P1 | HM-04 |
| **FR-L1-41** | drive 自動判定システム (PLAN/コード/依存から drive を自動分類 → orchestration_mode routing) | PO directed (2026-05-28) | PLAN 内容、コードファイル拡張子・パターン | drive 判定結果、orchestration_mode routing 先。FR-L1-08 (mode 自動 routing) の drive 軸拡張 | P1 | HM-03 |
| **FR-L1-42** | AI プロバイダ間引継ぎ連携 (Claude ↔ Codex のみ、context+PLAN+budget 連携渡し) | PO directed (2026-05-28) | handover/CURRENT.json、mode.yaml、invocation_log、PLAN 位置 | provider-handover パッケージ、fresh セッション起動確認。FR-L1-31 (コンテキスト管理) の provider 拡張 | P1 | HM-03 / PM-05 |
| **FR-L1-43** | PoC サクセス計測 (confirmed / rejected / pivot 件数から成功率を projection) | BR-21 / PLAN-L7-53 (2026-06-15 P2 carry から昇格) | plan_registry (kind=poc, decision_outcome∈{confirmed,rejected,pivot}) | poc_evaluations projection (poc_success_rate 0.0-1.0、confirmed_count、rejected_count、pivot_count、total_count)。cold-start = 0 行。決定未記録 PoC は分母除外 | P2 | HM-08 |
| **FR-L1-44** | 途中導入 onboarding workflow (既存プロジェクトへの harness baseline 確立) | PO directed (2026-05-28) | 既存コード/docs/PLAN 資産一覧、`.ut-tdd/` 未初期化状態 | `.ut-tdd/` 初期 baseline、既存資産 → state import レポート、onboarding 完了 gate 証跡。FR-L1-14 の前段 context、FR-L1-07 初回 import 引継ぎ、FR-L1-26 段階移行と組合せ | P1 | GD-01 (Onboarding) |
| **FR-L1-45** | doc-reviewer 必須召喚 (大規模 doc 改定 / gate evidence / pair freeze の品質観点 4 軸チェック、BR-08 派生) | L3 back-propagation (A-47 → A-49) | trigger event (doc 改定 / gate / pair freeze)、doc-reviewer role 定義 | doc-reviewer 召喚記録 `.ut-tdd/audit/doc-reviews/<timestamp>.json`、品質観点 4 軸 (整合/網羅/一貫/明確) チェック結果、未召喚で gate (G1/G3/G7/G11) 通過禁止 (fail-close)、PO bypass = `UT_TDD_DOC_REVIEWER_BYPASS=1` + audit | P0 | PM-03 / HM-05 |
| **FR-L1-46** | subagent roster の UT-TDD 化 (capability class 化 / model family / guard 統合 / legacy source 前提除去) | A-77 棚卸 (internal-asset-inventory.md) / BR-22 | `.claude/agents/*.md`、guard allowlist | UT-TDD 正本 roster (rename + harden 済)、legacy source 前提残存 0 | P1 | HM-02 |
| **FR-L1-47** | skill pack の UT-TDD curate (UT-TDD 版 SKILL_MAP / core-optional-drop 区分 / ut-tdd CLI trigger / legacy source 用語除去) | A-77 棚卸 / BR-22 | source skill reference、SKILL_MAP | `docs/skills/*.md` skill pack + UT-TDD 版 SKILL_MAP | P1 | HM-02 |
| **FR-L1-48** | 内部資産 command の ut-tdd CLI subcommand 化 (dashboard / asset / builder 等) | A-77 棚卸 / rebuild map W11/W12/W16 / BR-22 | legacy CLI binaries 70 件 / docs/commands 19 件 | `ut-tdd` subcommand 体系 | P1 | HM-02 |
| **FR-L1-49** | 内部資産 drift lint (legacy absolute path残存 / docs-skills 空 / roster↔guard 整合の機械検証) | A-77 棚卸 / IMP-033 rule engine / BR-22 | roster / skill pack / guard allowlist | drift 検出レポート (fail-close) | P1 | HM-07 |
| **FR-L1-50** | DDD/TDD 厳格化 automation (domain boundary / invariant trace / Red-first evidence / oracle strength / integration GWT) | PO directed 2026-06-09 / IMP-097..101 | DDD/TDD rule SSoT、PLAN evidence、source/test docs、L7/L8 test-design | doctor lint findings、workflow anchor、L7 oracle、L8 GWT compliance | P1 | HM-07 / PM-04 |
| **FR-L1-51** | artifact progress color projection (実装中 / 依存未確認 / テスト済みを harness.db で赤黄緑に正規化) | PLAN-L7-56 / PLAN-REVERSE-56 (2026-06-22) | source artifact、covered-by test edge、impact_results、recovery PLAN | `artifact_progress` projection、`ut-tdd progress artifacts` rows、linked test/dependency reason | P1 | HM-04 / PM-01 |

### §1.0.1 source internal asset機能カバレッジ監査 (2026-06-02)

本監査は [internal-asset-inventory.md](../../../migration/internal-asset-inventory.md) / source inventory / porting map を入力に、source snapshot 側の runtime 内部資産機能が L1 機能一覧に載っているかを確認した結果である。結論: **新規 FR 採番の追加漏れはなし**。不足候補 FR-AST-1〜4 は既に **FR-L1-46〜49** として反映済み。ただし FR-L1-48 の対象に `builder` 系 command asset が明示されていなかったため、同一 FR 内で W11/W12/W16 と `docs/commands` 19 件 / legacy CLI binaries 70 件を明記した。

| source asset capability | 実測 / evidence | L1 被覆 | 判定 |
|---|---:|---|---|
| subagent roster | active 19 件 = vendor 19 件。現状 byte 一致で未 harden | FR-L1-46 + FR-L1-49 | 被覆済み。TS 化対象は roster registry / capability resolver / guard / drift lint。prompt 本文は markdown 正本 |
| skill pack | vendor `SKILL.md` 107 件、UT-TDD `docs/skills` 0 件 | FR-L1-47 + FR-L1-12 + FR-L1-49 | 被覆済み。TS 化対象は catalog / recommender / injector / lint。skill 本文は curate 後 markdown 正本 |
| command assets | `docs/commands` 19 件、legacy CLI binaries 70 件 | FR-L1-48 + 既存 core CLI FR (FR-L1-01/05/10/11/13/14/17/18/20/23/33/34/37/39/42) | 被覆済み。動作は TS/Bun subcommand として再実装、command docs は UT-TDD CLI docs へ curate |
| cli/lib capability waves | W1〜W17 | 各 wave は FR-L1-01〜49 の該当 FR に接続。runtime 内部資産 gap は FR-L1-46〜49 で閉塞 | 被覆済み。Python port ではなく TS/Bun 再実装 |

**無修正転用の境界**: runtime として無修正転用できる legacy source 資産は **0 件**。`vendor source snapshot` は read-only evidence / regression idea としてのみ無修正参照できる。実行ロジック、hook、CLI、guard、catalog、lint は UT-TDD 所有パスで TS/Bun 再実装する。`.claude/agents/*.md` と `docs/skills/**/*.md` は TS literal 化せず markdown 正本として扱うが、legacy source 前提除去・role/capability class 化・用語置換・trigger 整備は必須。

### §1.1 legacy source 固有名 → UT-TDD 翻案注記 (anti-corruption layer)

FR-L1 35 件は source snapshot reference 設計概念参照 (v2-import-ledger §6.1)。legacy source 固有実装名は UT-TDD 文脈で以下のように読み替える (concept §3.1.2.2 DDD anti-corruption layer 原則):

| legacy source 固有名 | UT-TDD 翻案 | 該当 FR-L1 |
|--------------|-------------|----------|
| legacy SQLite DB | `.ut-tdd/` 配下の YAML/JSON state + UT-TDD 独自の `.ut-tdd/harness.db` SQLite projection DB。legacy schema は採用せず、V-model state / model_runs / trace / coverage / findings を projection として保存する | FR-L1-06, FR-L1-07 |
| legacy doctor command | `ut-tdd doctor` | FR-L1-18 |
| legacy codex command | `ut-tdd codex` | FR-L1-09 |
| legacy recover / route commands (legacy source 穴) | `ut-tdd recover` / `ut-tdd route` (P2 carry、FR-L1-34) | FR-L1-34 |
| `vmodel-semantics.yaml` | `docs/skills/<L>-injection.yaml` (UT-TDD では skill 注入を doc + YAML で正本化、interpreter なし) | FR-L1-12 |
| `axis-09` / `axis-11` / `axis-15-19` (source detector 番号) | UT-TDD 独自 detector 番号体系 (L3/L4 で再採番、現状は source reference number を出典 reference として残す) | FR-L1-22, FR-L1-25 |
| `gate-checks.yaml` | UT-TDD でも同名 path で扱う (`docs/governance/gate-checks.yaml`、L4 carry) | FR-L1-05 |
| source process doc 群 | UT-TDD では source process docs を read-only reference として参照し、工程定義の正本は `docs/process/` に置く (FR-L1-32 で fold) | FR-L1-32 |
| legacy bench / PR commands | `ut-tdd bench` / `ut-tdd pr` 等の同等命令体系 (L4 CLI 設計 carry) | FR-L1-17, FR-L1-20 |
| `feedback_hook` (legacy source 5 軸) | `.ut-tdd/hooks/feedback.ts` (Bun、ADR-001 整合) | FR-L1-19, FR-L1-20 |
| `cutover_orchestrator` | `ut-tdd cutover` (Recovery 収束専用、L4 carry) | FR-L1-10 |
| legacy interrupt command (cross-cutting-mechanisms.md 行 18) | `ut-tdd interrupt` (Sprint 割り込みイベント記録、L4 CLI 設計 carry) | FR-L1-11 |
| legacy debt command | `ut-tdd debt` (技術負債台帳登録、L4 CLI 設計 carry) | FR-L1-11 |
| legacy drift-check command | `ut-tdd drift-check` (drift 検出非ブロック実行、L4 CLI 設計 carry) | FR-L1-11 |
| legacy readiness command | `ut-tdd readiness` (後工程 PLAN 先送り判定、L4 CLI 設計 carry) | FR-L1-11 |

| (対応 source reference doc なし) | FR-L1-44 (途中導入 onboarding workflow) は source reference側に対応 doc なし、UT-TDD 独自設計 (PO directed 2026-05-28) | FR-L1-44 |
| (対応 source reference doc なし) | FR-L1-37 (モデル/エフォート推挙システム) は source reference側に対応 doc なし、UT-TDD 独自設計 (PO directed 2026-05-28) | FR-L1-37 |
| (対応 source reference doc なし) | FR-L1-38/39 (model 評価 / タスク難易度測定) は source reference側に対応 doc なし、UT-TDD 独自設計 (PO directed 2026-05-28)。FR-L1-38 は PLAN-L7-53 で実装済み (2026-06-15) | FR-L1-38, FR-L1-39 |
| (対応 source reference doc なし) | **FR-L1-45 (doc-reviewer) は UT-TDD 独自設計、L3 back-propagation 由来 (A-47 Critical C-02 「BR-08 派生 FR が L3 に不在で G3 lint 孤児リスク」 → A-49 で L1 に追加、BR-08 派生 P0)** | FR-L1-45 |

注記の目的: source-derived 知見を概念的に取り込みつつ、実装は UT-TDD 独自 (TS/Bun + ファイルベース state + 個別 CLI) で再構築する。

### §1.2 L3 back-propagation 由来 FR-L1 carry note (A-49 ledger、2026-05-28)

L3 詳細化フェーズで発生した「L1 に存在しない新概念」を L1 functional §1 に back-propagation する (DDD evolution、business §10.1.1 entity 同様の手順)。**L3 着手 = L1 凍結ではなく、L3 で発生した必須 FR は L1 に逆方向で追加する** ことを A-49 で正本ルール化:

| 新 FR-L1-ID | 業務要求由来 | 優先度 | L3 詳細化先 | 追加理由 |
|------------|------------|--------|------------|---------|
| **FR-L1-45** | BR-08 (doc 品質継続レビュー) | P0 | L3 FR-45 (functional §2) | A-47 pmo-sonnet matrix で「BR-08 対応 FR が L3 に不在 = G3 lint 孤児」検出。L3 で FR 起草 + L1 back-propagation |
| **FR-L1-51** | BR-20 / BR-06 / BR-07 (state DB + progress visibility + trace drift) | P1 | L3 carry / L4 function block / L5 physical-data | PLAN-L7-56 で artifact_progress が L5/L7 に先行実装され、上位の要件・機能一覧・基本設計が赤状態だったため PLAN-REVERSE-56 で fullback |

**back-propagation 手順** (business §10.1.1 entity と同様):
1. L3 詳細化フェーズで新概念発見
2. L3 sub-doc で新 FR 起草 (新規 ID 採番)
3. **L1 functional §1 表に同 ID で行追加** (carry note ではなく正式エントリ)
4. screen sub-doc §5 G1-trace マトリクスに紐付け追加
5. ledger に back-propagation 記録 (kind=reverse + confirmed_reverse_type=design に準ずる)
6. g3-trace lint test の件数更新 (vitest)

> **漏れ監査の自動化 (A-57、要件 §1.10.G.10)**: 上記 6 step のうち step 3 (§1 登録) / step 4 (screen §5 紐付け) / step 6 (件数整合) は `src/lint/fr-registry-audit.ts` で機械強制される (漏れ 5 型: 登録漏れ / 欠番 / 属性 / 件数整合 / 画面被覆)。各工程の PLAN は §7 機能要求更新 (FR registry delta) に新規 / 拡張 FR を記載してから back-merge する (登録機構)。手動 audit (A-51/52/54) はこの lint へ移行し、外部 corpus (legacy source 47 doc) 完全性突合のみ periodic subagent 監査 (tier-2) として残す。

**将来 add-design 候補 (L1 未追加、carry のみ)**:
- BR-multi-01/02 派生: FR-L1-multi-01 (tenant 分離) / FR-L1-multi-02 (cross-team handover) → Phase B carry (A-46 ledger)
- BR-JTBD-01 / BR-NSM-01 / BR-TTV-01 派生 FR → L4 add-design 候補

## §2 利用シナリオ

### シナリオ 1: Forward (新機能開発)

1. PO が L0 企画書を起票し G0.5 を通過
2. L1 業務要求 5 sub-doc を起票、G1 でペア freeze (L1 ↔ L14)
3. L3 機能要件 sub-doc を起票 (BR-* から FR-* trace)、G3 でサインオフ
4. L4-L6 設計層を起票、G4-G6 で凍結
5. L7 TDD 実装スプリント: Red → 本体実装 → 3 点レビュー → Green
6. L8-L9 結合・総合テスト、G8-G9 で通過
7. L11 UAT、G11 で PO 最終承認、L13 リリース

### シナリオ 2: Reverse (既存コードのドキュメント化)

1. 既存コードを入力に R0 (evidence 収集)
2. R1 (contracts 抽出) → R2 (as-is design 生成) → R3 (gap 特定) → R4 (Forward 合流ルーティング)
3. Forward の L3 or L4 に合流し、不足部分を設計・テスト起票

### シナリオ 3: Discovery (PoC)

1. 仮説を起票 (kind=poc、S0 backlog)
2. S1 plan → S2 PoC 実装 → S3 verify (検証 script) → S4 decide (confirmed/rejected)
3. confirmed なら Forward L3 に合流、rejected なら負債台帳に記録

### シナリオ 4: Incident (本番障害)

1. 本番障害検出 → Incident ワークフロー起動 (FR-L1-16)
2. hotfix PLAN 起票 → 緊急 fix → 即リリース
3. postmortem 起票 → L14 運用テスト設計フィードバック → V モデル昇華

### シナリオ 5: Add-feature (既存機能拡張)

1. 追加要求を受け、既存 PLAN を特定
2. add-design PLAN 起票 (kind=add-design、requires 接続)
3. add-impl PLAN 起票 → 影響範囲差分追補 → G7 通過

### シナリオ 6: Refactor (既存コードの振る舞い不変リファクタ)

1. リファクタ対象コードを特定し、kind=refactor で PLAN 起票 (FR-L1-25)
2. 既存テストを保護網として確認 (振る舞い不変を事前保証)
3. axis-11 regression 機械検証を実施 (決定論的 pass/fail)
4. G7 通過後 Forward 復帰 (design artifact 変更なし、PLAN trace 更新)

### シナリオ 7: Retrofit (移行対象構造の段階移行)

1. 移行対象構造を特定し、kind=retrofit で PLAN 起票 (FR-L1-26)
2. retrofit-matrix で影響評価 (依存・インターフェース・テスト影響)
3. 段階 config 更新 → L4-L7 へ追補追加 (追補ドキュメント生成)
4. 回帰テスト実施 → pass で Forward 復帰

### シナリオ 8: Recovery (暴走/障害シグナル収束)

1. drift / 劣化 シグナルを検出 (FR-L1-08)
2. ut-tdd doctor で横断集約 (FR-L1-18)
3. mode 自動 routing で Recovery / Incident / Reverse / Refactor を選択
4. 再開ポイント確定 + 認識訂正履歴記録 (FR-L1-10)
5. 標準 Forward (L0-L14) 復帰

## §3 操作とデータの流れ

### PLAN 起票 → 依存関係確立

```
ユーザー指示 → ut-tdd plan draft
  → PLAN ファイル生成 (frontmatter + §工程表 + §実装計画)
  → plan_registry 自動登録 (FR-L1-07)
  → generates[] / requires[] で依存グラフ確立 (FR-L1-04)
```

### Gate 判定 + 証跡化

```
ut-tdd gate <G-ID>
  → gate-checks.yaml ロード (FR-L1-05)
  → static check 全件実行 (AI 不要、決定論的)
  → pass → .ut-tdd/phase.yaml 更新 + CI 証跡出力 (FR-L1-17)
  → fail → next_action 明示 + block (fail-close)
```

### Mode 判定 + Forward 復帰

```
drift/劣化/暴走 シグナル検出 (FR-L1-08)
  → ut-tdd doctor 横断集約 (FR-L1-18)
  → mode 自動ルーティング (Recovery / Incident / Reverse / Refactor)
  → 収束後 Forward 合流ポイント確定 (FR-L1-10)
```

### Trace + Inventory + Query

```
ut-tdd trace
  → artifact ↔ PLAN ↔ テスト設計の双方向 ID 照合 (FR-L1-03)
  → balance_ratio 計測 (test_count / design_count)
  → デグレ検出レポート生成 (FR-L1-18、BR-07 連携)
```

## §4 入出力

| 区分 | 内容 |
|------|------|
| **入力** | ユーザー指示 / PLAN ファイル / commit / hook イベント (5 種: PLAN 起票 / コード変更 / Codex 実行 / ゲート通過 / 停止) |
| **出力** | `.ut-tdd/` state 更新 / gate 判定 report / dashboard メトリクス / next_action メッセージ |

## §5 上流 baton 反映

BR-* と FR-L1-* の対応表:

| BR-ID | 対応 FR-L1-ID | 対応概要 |
|-------|---------------|---------|
| BR-01 | FR-L1-01, FR-L1-13 | V字モデル全工程 PLAN + Forward ワークフロー |
| BR-02 | FR-L1-09, FR-L1-17 | AI ガード + CI/PR 連携 (role 境界機械強制) |
| BR-03 | FR-L1-03, FR-L1-18 | 双方向 trace + 横断検出 (デグレ防止) |
| BR-04 | FR-L1-15 | Discovery ワークフロー (PoC→契約化→合流) |
| BR-05 | FR-L1-04, FR-L1-05 | PLAN kind + static gate (規約違反機械検知) |
| BR-06 | FR-L1-20 | 観測・計測層 (dashboard メトリクス供給) |
| BR-07 | FR-L1-03, FR-L1-18 | 双方向 trace + デグレ横断検出 (ratchet 3 軸) |
| BR-08 | FR-L1-09, **FR-L1-45** | AI ガード + **doc-reviewer 必須召喚 (A-49 で FR-L1-45 として L3 back-propagation 追加、P0)** |
| BR-13〜19 (Audit framework 由来) | FR-L1-04, FR-L1-05, FR-L1-17 | PLAN kind / static gate / CI 連携 |
| BR-20 (local DB) | FR-L1-06, FR-L1-51 | V モデル本線 state 一元管理 + artifact progress color projection |
| BR-20 (ダッシュボード Phase A) | FR-L1-20 | 観測・計測層 (Phase A: local DB + local dashboard) |
| BR-20 (ダッシュボード Phase B) | FR-L1-20 + L3 forward carry | server sync + telemetry + self-improvement (Phase B、§5 末 carry) |
| BR-21 (AI 実行成果評価) | FR-L1-36 (昇格済み) / FR-L1-38 (昇格済み) / FR-L1-43 (昇格済み) | スキル評価 (PLAN-L7-53 実装済み) / model 評価 (PLAN-L7-53 実装済み) / PoC サクセス計測 (PLAN-L7-53 実装済み) |

### carry note: doc-reviewer 召喚機能 (BR-08 下流)

doc-reviewer (pmo-sonnet とは責務分離した doc 品質専用 read-only reviewer) の独立 FR としての機能要求は、L3 機能要件への forward carry とする。詳細: role 定義 (model / 召喚 trigger / coverage 監査) = `docs/migration/v2-import-ledger.md §2 F-5`。

### carry note: AI 実行成果評価 (BR-21 下流)

- **BR-21** (AI 実行成果評価) の業務目標: スキル発火精度・モデル選定適切性・PoC の成否を定量評価し、Learning Engine (FR-L1-19) のフィードバック精度を高める。
- **FR-L1-36** (スキル評価システム)、**FR-L1-38** (model 評価システム)、**FR-L1-43** (PoC サクセス計測) はすべて PLAN-L7-53 で実装済み (2026-06-15 P2 carry から昇格)。BR-21 の 3 件すべてが実装完了。

### carry note: ダッシュボード Phase A/B (BR-06 / BR-20 下流)

- **Phase A** (local DB + local dashboard): FR-L1-20 (観測・計測層) + FR-L1-06 (state 一元管理) で基盤確立。L3 機能要件で dashboard 機能仕様を具体化。
- **Phase B** (server sync + telemetry + self-improvement): L3 forward carry。PGlite + ElectricSQL 等のアーキ候補は L4 技術要求 §2 で ADR-002 候補として検討。

## §6 関連 doc

- L1 業務要求: `docs/design/harness/L1-requirements/business-requirements.md`
- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- v2 import ledger (FR-L1 全件出典): `docs/migration/v2-import-ledger.md §6`
- L14 運用テスト設計: `docs/test-design/harness/L1-operational-test-design.md`
- L1 技術要求: `docs/design/harness/L1-requirements/technical-requirements.md`
## §7 Request/Requirement Bundle: DB Reference Feedback + Automation Foundation (2026-06-08)

ユーザー要求「機械的なチェックとDB参照構造で抜け漏れ・依存関係・ゆがみを検出し、V-modelだけでなく各駆動モデル、各ログ、スキル発火率までデータ化して検索コストも下げる」は、既存 FR-L1 では複数行に分散している。以下を束ねて Phase A の L5 降下対象にする。

| User request | Covered FR-L1 | Current gap | L5 descent |
|---|---|---|---|
| V-model 製本 state を SQLite に自動登録し、ゆがみ・漏れを並べて検出する | FR-L1-06 / FR-L1-07 / FR-L1-18 / FR-L1-20 | `harness.db` の投影 table はあるが、品質 signal と feedback event の束ね方が薄い | physical-data §9 / internal-processing Appendix B / L8 IT-DB |
| V-model 以外の駆動モデルごとの状態・実行結果も保存する | FR-L1-08 / FR-L1-37 / FR-L1-39 / FR-L1-40 / FR-L1-41 | drive と mode の違いは定義済みだが、`drive_runs` / `mode_transition` と各 log の join key が L5 で未明確 | physical-data §9.2 / module-decomposition Appendix B |
| session / hook / gate / model run / finding を参照グラフ化する | FR-L1-07 / FR-L1-19 / FR-L1-20 | log→handover→state DB の橋渡しはあるが、DB 参照構造・index・検索 surface が未固定 | physical-data §9.3 / if-detail Appendix B |
| skill 発火率、推薦採用率、model/effort 適切性を学習 input にする | FR-L1-12 / FR-L1-19 / FR-L1-20 / FR-L1-37 | skill firing log は要求済みだが、発火率 numerator/denominator と推薦理由の保存粒度が未固定 | physical-data §9.2 / internal-processing Appendix B |
| 探すコストを下げる | FR-L1-06 / FR-L1-18 / FR-L1-20 / FR-L1-39 | code/find 相当は要求にあるが、DB search index と `ut-tdd find` の対象・出力が未固定 | if-detail Appendix B / L8 IT-SEARCH |
| workflow 自動化の ready 判定を data-backed にする | FR-L1-05 / FR-L1-13 / FR-L1-17 / FR-L1-18 / FR-L1-24 | workflow/gate/CI は定義済みだが、どの自動化が ready / blocked / human-required かを DB 上で横断検索する粒度が未固定 | physical-data §9.1 / internal-processing Appendix B / L8 IT-AUTOMATION |
| guardrail の安全性を証跡化し、越権や silent pass を防ぐ | FR-L1-05 / FR-L1-09 / FR-L1-10 / FR-L1-17 / FR-L1-45 | agent-guard / review_evidence / escalation 境界はあるが、fail-open/fail-close 判定・human signoff・禁止データ非保存を同じ参照構造で並べる L5 契約が不足 | physical-data §9.1 / if-detail Appendix B / L8 IT-GUARDRAIL |
| skill / roster / command docs を自動化基盤として catalog 化する | FR-L1-12 / FR-L1-33 / FR-L1-46 / FR-L1-47 / FR-L1-48 / FR-L1-49 | skill/roster/command の棚卸しと drift lint は要求済みだが、trigger/role/capability/drift/search を DB projection に入れる粒度が未固定 | module-decomposition Appendix B / internal-processing Appendix B / L8 IT-ASSET-DB |
| UT 実行履歴を evidence DB 化する (A-122) | FR-L1-02 / FR-L1-06 / FR-L1-17 / FR-L1-18 / FR-L1-20 / FR-L1-50 | `tests_green_at` はあるが、どの UT がどの PLAN / FR / U-* oracle / artifact を証明したか、Bun/vitest/doctor/lint の実行履歴・flake・duration regression を query する要求粒度が不足 | physical-data §9.4 / function-spec `recordTestRunEvidence` / L8 IT-DB |
| 定量 green profile と定性 review を束ねる (A-122) | FR-L1-05 / FR-L1-17 / FR-L1-18 / FR-L1-20 / FR-L1-45 / FR-L1-50 | `tests_green_at <= reviewed_at` は順序のみ保証し、required command profile / runner / scope / exit code / evidence digest を要求として固定していない | test-before-review §8 `GreenDefinition` / function-spec `evaluateGreenDefinition` |
| DB projection 実装 profile を固定する (A-122) | FR-L1-06 / FR-L1-07 / FR-L1-17 / FR-L1-18 / FR-L1-20 | DB が projection であることは定義済みだが、Bun `bun:sqlite`、schema_version、deterministic rebuild、migration fixture、doctor integration の受入条件が requirements 側に薄い | requirements §6.8.7 / physical-data §9.4 / IMP-110 |
| CI / hook / OS evidence matrix を残す (A-122) | FR-L1-07 / FR-L1-17 / FR-L1-18 / FR-L1-20 | Windows PowerShell / Bash / Bun / Claude hook / CI の green evidence を同じ profile で比較できず、片側 smoke 欠落が定性レビュー頼みになる | requirements §6.8.7 / GreenDefinition / IMP-114 |
| 横断 relation graph / impact expansion / 図化を DB projection 化する (A-124) | FR-L1-05 / FR-L1-06 / FR-L1-07 / FR-L1-17 / FR-L1-18 / FR-L1-19 / FR-L1-20 / FR-L1-24 / FR-L1-49 / FR-L1-50 | `module-drift` / `asset-drift` / `change-impact` は局所検査であり、変更ファイルから関連 FR/PLAN/design/test/DB table/diagram を列挙できない。外部ツールを導入しても gate SSoT と DB projection に接続されなければ全体一貫性を保証できない | requirements §6.8.9 / physical-data §9.5 / ADR-002 A-124 addendum / IMP-118..120 |
| artifact progress を赤黄緑で DB projection 化する (PLAN-L7-56 / PLAN-REVERSE-56) | FR-L1-01 / FR-L1-02 / FR-L1-03 / FR-L1-06 / FR-L1-18 / FR-L1-20 / FR-L1-51 | 実装済み artifact が上位設計・依存確認・テスト証跡と連動していない場合、人間の記憶や会話に依存して更新漏れが起きる。artifact ごとの「赤=依存未確認/未回収」「黄=実装中/未テスト」「緑=linked test + dependency clear」を DB で問える粒度が不足 | requirements §6.8.6 / §6.8.7 / physical-data §9.5 / PLAN-L7-56 |
| MCP server / 外部テスト基盤 profile を workflow trigger 化する (A-125) | FR-L1-05 / FR-L1-06 / FR-L1-07 / FR-L1-17 / FR-L1-18 / FR-L1-19 / FR-L1-20 / FR-L1-24 / FR-L1-45 / FR-L1-49 / FR-L1-50 | Playwright MCP / GitHub MCP / MCP Inspector / Docker MCP Toolkit / Vitest Browser Mode / Testcontainers / MSW などは検証環境を強化できるが、profile・allow-list・trigger・DB evidence 化がないと権限肥大と gate 外実行になる | requirements §6.8.10 / physical-data §9.6 / ADR-002 A-125 addendum / IMP-121..124 |
| 正本ドキュメントを spreadsheet / Excel / PPTX へ変換する (A-126) | FR-L1-05 / FR-L1-06 / FR-L1-07 / FR-L1-17 / FR-L1-18 / FR-L1-20 / FR-L1-24 / FR-L1-33 / FR-L1-45 / FR-L1-50 | 企画・要件定義・詳細設計・PLAN・ADR・テスト設計は Markdown 正本として存在するが、人間レビュー向けの表計算 / Excel / PPTX 変換 surface がない。変換物が正本化すると trace と gate truth が崩れるため、source anchor と DB projection で派生物として扱う必要がある | requirements §6.8.11 / physical-data §9.7 / ADR-002 A-126 addendum / IMP-126 |

不足判定: 多くの要求は既存 FR に入っている。**本当はできるが気づいていないだけ**の領域は、FR-L1-05/06/07/09/12/13/17/18/19/20/33/37/39/40/41/45/46/47/48/49 に分散済みだった。A-122 で追加確認した UT evidence / GreenDefinition / DB collector / CI matrix は FR-L1-02/06/07/17/18/20/45/50 の拡張要求として扱い、新 FR 採番はしない。A-124 の横断 relation graph / 図化 / tool adapter も FR-L1-05/06/07/17/18/19/20/24/49/50 の DB reference-feedback + automation + drift lint 拡張として扱い、新 FR 採番はしない。A-125 の MCP server / 外部テスト基盤 profile / workflow trigger も FR-L1-05/06/07/17/18/19/20/24/45/49/50 の automation + verification evidence + security gate 拡張として扱い、新 FR 採番はしない。A-126 の正本ドキュメント export も FR-L1-05/06/07/17/18/20/24/33/45/50 の documentation + DB projection + review evidence 拡張として扱い、新 FR 採番はしない。PLAN-L7-56 の artifact progress color projection は、artifact 単位の赤黄緑状態という user-visible な進捗管理 semantics を追加したため **FR-L1-51 として新規採番**し、PLAN-REVERSE-56 で requirements / L1 / L3 / L4 / L5 へ fullback する。未充足は、これらを **一体の DB reference-feedback + automation-foundation + UT evidence history + cross-artifact relation graph + external verification profile + canonical document export + artifact progress color projection 機構として受入条件化し、L5/L6 詳細設計へ同じ参照粒度で落とすこと**だった。PLAN-L5-08、A-122 addendum、A-124 addendum、A-125 addendum、A-126 addendum、PLAN-L7-56 / PLAN-REVERSE-56 で L5/L6/L7 へ add-design / fullback として降下する。
