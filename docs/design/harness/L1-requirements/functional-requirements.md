---
layer: L1
sub_doc: functional
status: draft
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L3
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: ユビキタス言語 = [L0 概念層 §10 用語集](../../../governance/ut-tdd-agent-harness-concept_v3.1.md#10-用語集) / 業界標準整合 = L0 §11 / Bounded Context = L0 §2.5 9-mode。本 doc は L0 を parent_doc reference とし、用語独自定義は行わない (anti-corruption layer)。
> **件数確定**: functional は FR-L1-35 件で確定 (P0: 18 / P1: 12 / P2: 5。根拠: 2026-05-28 v2 HELIX-workflows 正本由来、`docs/migration/v2-import-ledger.md §5.1 A-24 / §6`)。
> **L3 接続規約**: `next_pair_freeze: L3`。L3 PLAN は本 sub-doc 全件を `dependencies.requires` に列挙する。

# UT-TDD Agent Harness — L1 機能要求 (functional)

> **L1 機能要求 ≠ L3 機能要件**: 本 sub-doc の FR-L1-* は「ユーザー視点で何の機能を望むか」= **要求**。L3 機能要件 (FR-*) は「システムが満たすべき仕様 + AC」= **要件**。本 sub-doc は L3 の入力であり別物。

## §1 機能一覧

FR-L1-01〜35 全件 (v2-import-ledger §6 より転写、1:1 コピー):

| FR-L1-NN | 機能要求名 (1 行) | 出典 doc | 必要 input | 出力 output | 重要度 |
|---|---|---|---|---|---|
| **FR-L1-01** | V字モデル (L0-L14) 全工程の PLAN 起票・進捗管理機能 | L0-concept / L1-requirements / L3〜L14 | 工程・機能名・記載項目 | PLAN ファイル (工程表 + 実装計画内蔵) | P0 |
| **FR-L1-02** | TDD 強制フロー (テストファースト順序厳守・実装先行禁止) | L7-implementation | L6 機能設計 (関数仕様 / クラス設計 / エッジケース) | テストコード (red) → 本体実装 (green) | P0 |
| **FR-L1-03** | V字 双方向 trace (設計 ⇔ テスト設計 4 artifact ペア確認) | test-perspective-gate / db-integration | 設計 PLAN + テスト設計 PLAN | trace 整合レポート、抜け漏れ検出 | P0 |
| **FR-L1-04** | PLAN kind による逸脱記録・ドキュメント生成計画 (kind + generates + requires) | deviation-plan-map | モード種別・成果物パス・依存 PLAN | kind 付き PLAN レコード、generates 宣言 | P0 |
| **FR-L1-05** | 決定論的 static ゲート (fail-close、gate-checks.yaml、AI 不要) | automation-gate-map | 工程・成果物・数値品質 | pass/fail 判定、ゲート証跡 (.ut-tdd/phase.yaml) | P0 |
| **FR-L1-06** | V モデル本線 state 一元管理 (plan_registry / code_catalog / contract_registry / skill_catalog 等 6 種) | db-integration | PLAN / コード / テスト / カバレッジ | 成果物間の一致管理、drift 検証結果 | P0 |
| **FR-L1-07** | state 自動登録 (5 イベント hook: PLAN 起票 / コード変更 / Codex 実行 / ゲート通過 / 停止) | db-auto-registration | hook イベント | state 自動更新、手動登録漏れ排除 | P0 |
| **FR-L1-08** | 検出 → モード自動ルーティング (drift / 劣化 / 暴走 / 障害 → Recovery / Incident / Reverse / Refactor) | detection-routing | 検出シグナル | モード発動トリガー、対応 kind PLAN 起票 | P0 |
| **FR-L1-09** | AI エージェントガード (agent_mandatory 監査 / budget 上限 / gate fail-close / lock) | recovery-workflow | AI 操作ログ、役割定義 | 逸脱警告・停止、audit ログ | P0 |
| **FR-L1-10** | Recovery 収束フロー (再開ポイント確定 / 認識訂正履歴 / cutover_orchestrator ロールバック) | recovery-workflow | 暴走状態ログ、PLAN | recovery-log (再開ポイント・認識訂正履歴) | P0 |
| **FR-L1-11** | 横断 4 機構 (interrupt / debt / drift-check / readiness) のモード進行非ブロック発動 | cross-cutting-mechanisms | 割り込みイベント / 負債台帳 / drift / 保留 | sprint interrupted / debt-register / 乖離レポート / 後工程 PLAN 先送り | P0 |
| **FR-L1-12** | L 単位 文脈注入 (スキル / ワークフロー / 必須 agent / 推奨 command / orchestration の 5 要素) | layer-context-injection | L 種別、vmodel-semantics.yaml 注入セット定義 | AI の選択空間限定、迷い排除 | P0 |
| **FR-L1-13** | Forward ワークフロー (L0 → L14 順行、PLAN → pair-freeze → implement → trace-freeze → review → accept) | automation-gate-map / L0〜L14 全工程 | 工程ゲート通過条件 | 工程進行、ゲート証跡 | P0 |
| **FR-L1-14** | Reverse ワークフロー (5 type: code/design/upgrade/normalization/fullback、R0-R4 + RGC) | reverse-workflow | 既存コード / 設計文書 / 依存 | Rn 成果物 (evidence / contracts / as-is-design / gap-register / routing) | P0 |
| **FR-L1-15** | Discovery ワークフロー (仮説 → PoC → verify → decide、Hypothesis status 管理、4 象限 Trigger 判定) | discovery-workflow | 仮説定義、verify script | poc PLAN、verify script、confirmed/rejected 判定 | P0 |
| **FR-L1-16** | Incident ワークフロー (本番障害: 検出 → hotfix → 即リリース → 収束 → V モデル昇華) | incident-workflow | 本番障害アラート / SLO 逸脱 | troubleshoot/recovery PLAN、postmortem、L14 フィードバック | P0 |
| **FR-L1-17** | CI/PR 連携 (ローカルゲート証跡 → CI 証跡検証 → branch protection PR 許可、ブランチ × モード対応) | ci-pr-workflow | ゲート証跡、push イベント | PR 許可/拒否、CI チェック結果 | P0 |
| **FR-L1-18** | 横断検出 (依存漏れ / 契約漏れ / 接続欠損 / デグレ) を ut-tdd doctor で一括集約 | cross-detection | detector 全種実行結果 | 横断検出レポート、モードルーティング先 | P0 |
| **FR-L1-19** | Learning Engine (成功実行 recipe 蓄積・頻出トラブル予防ルール化・スキル推薦改善・L 単位注入更新) | learning-engine | feedback_hook 5 軸 / skill 発火ログ / recovery-log / interrupt 履歴 / detector 結果 | recipe (pattern_key 付き)、予防ルール、推薦精度改善 | P1 |
| **FR-L1-20** | 観測・計測層 (5 hook で AI 実行を全量ログ化、発火 / トラブル / 精度 / 予算のメトリクス集約) | observability-metrics | AI 実行イベント全種 | invocation_log / action_logs / gate_runs / accuracy_score / budget_events、dashboard メトリクス | P1 |
| **FR-L1-21** | テスト観点 W 字ゲート (設計項目へのテスト観点抜け検出 + レベル間重複検出を static で fail-close) | test-perspective-gate | 設計 PLAN + テスト設計 PLAN、テストレベル定義 | 観点抜け一覧、重複観点一覧、pass/fail | P1 |
| **FR-L1-22** | FE detector 5 軸 (mock-promotion / design-token-drift / a11y-regression / visual-regression / state-transition-drift) の決定論的判定 | fe-detector-spec | L2 モック / デザイントークン SSOT / スクリーンショット / 画面遷移定義 | DetectorResult (pass/fail+詳細)、CI 証跡 | P1 |
| **FR-L1-23** | Scrum インクリメント → V モデル昇華フロー (ut-tdd reverse fullback で L1/L3/L4-L6/L8-L9 へ統合) | scrum-workflow | スプリント完成インクリメント | F0-F4 成果物、V モデル各工程ドキュメント追補 | P1 |
| **FR-L1-24** | Add-feature ワークフロー (影響範囲差分追補、add-design / add-impl で既存 PLAN に requires 接続) | add-feature-workflow | 既存 PLAN、追加要求 | add-design / add-impl PLAN、追補ドキュメント | P1 |
| **FR-L1-25** | Refactor ワークフロー (振る舞い不変を axis-11 regression で機械検証、kind=refactor) | refactor-workflow | 対象コード、既存テスト (保護網) | refactor PLAN、module、テスト緑確認結果 | P1 |
| **FR-L1-26** | Retrofit ワークフロー (影響評価 retrofit-matrix + 段階移行 config 更新、kind=retrofit) | retrofit-workflow | 移行対象構造・依存 | retrofit-matrix、config、回帰テスト結果 | P1 |
| **FR-L1-27** | Research ワークフロー (技術調査 → 比較評価 → ADR、kind=research、generates=research-memo + ADR) | research-workflow | 調査課題、選択肢・制約 | research-memo、ADR | P1 |
| **FR-L1-28** | UT-TDD W 2 段設計 (Phase 1 一般システム + Phase 2 エージェント昇華を L10 で合流、drive=agent 追加) | two-stage-agent-design | Phase 1/2 各 L9 成果物 | L10 合流済み成果物、L11-L14 統合フロー | P1 |
| **FR-L1-29** | 画面設計ワークフロー (L2: IA → 画面一覧・遷移 → ワイヤーフレーム Low-Fi/High-Fi → モックアップ → ユーザビリティテスト → コンポーネント化) | screen-design-workflow | L1 要求定義 | L2 成果物 (画面一覧 / 遷移図 / ワイヤーフレーム / UI 要素)、G2 モック凍結 | P1 |
| **FR-L1-30** | フロントデザイン UX ワークフロー (L10: ビジュアルデザイン → デザイントークン SSOT → a11y → ビジュアル回帰 → UX 磨き上げ) | frontend-design-workflow | L9 総合テスト結果、L2 ワイヤーフレーム | L10 成果物、デザイントークン定義、L11 への引き渡し | P1 |
| **FR-L1-31** | コンテキスト管理・自動走行 (Claude+Codex セッションクリーナー PoC: context 0.70 で fresh 再起動、handover 引き継ぎ) | continuous-run-context-management | context 使用率、handover.CURRENT.md | fresh Claude セッション、作業継続、サブスク課金内維持 | P2 |
| **FR-L1-32** | フォルダ構成ルール (helix-process 文書 → 既存 docs/ への統合方針、tests 分散の役割明確化) | folder-structure-review | repo 文書群 | docs/ への配置マッピング定義 | P2 |
| **FR-L1-33** | 既存資産棚卸し・充足度マッピング (コマンド / スキル / detector / template / state / hook / docs / tests の網羅確認) | asset-mapping | リポジトリ全資産 | 充足度レポート、不足項目リスト | P2 |
| **FR-L1-34** | スキル・コマンド穴の優先順位管理 (vmodel-semantics 注入セット定義 / ut-tdd recover / ut-tdd route / retrofit skill 等) | integration-map | 穴リスト、設計確定済み仕様 | 優先順位付き実装タスクリスト | P2 |
| **FR-L1-35** | 基盤整備状況の可視化 (実装済み / 設計済み・実装未 / 未設計の 3 区分で検証・テスト・検出基盤を一覧表示) | infra-readiness | 各機構の実装状況 | 整備状況一覧 (区分付き) | P2 |

### §1.1 HELIX 固有名 → UT-TDD 翻案注記 (anti-corruption layer)

FR-L1 35 件は HELIX-workflows 正本由来 (v2-import-ledger §6.1)。HELIX 固有実装名は UT-TDD 文脈で以下のように読み替える (concept §3.1.2.2 DDD anti-corruption layer 原則):

| HELIX 固有名 | UT-TDD 翻案 | 該当 FR-L1 |
|--------------|-------------|----------|
| `helix.db` (SQLite) | `.ut-tdd/` 配下のファイルベース state (core + audit/event + derived views)、ADR-001 で SQLite は採用せず | FR-L1-06, FR-L1-07 |
| `helix-doctor` | `ut-tdd doctor` | FR-L1-18 |
| `helix-codex` | `ut-tdd codex` | FR-L1-09 |
| `helix-recover` / `helix-route` (HELIX 穴) | `ut-tdd recover` / `ut-tdd route` (P2 carry、FR-L1-34) | FR-L1-34 |
| `vmodel-semantics.yaml` | `docs/skills/<L>-injection.yaml` (UT-TDD では skill 注入を doc + YAML で正本化、interpreter なし) | FR-L1-12 |
| `axis-09` / `axis-11` / `axis-15-19` (HELIX detector 番号) | UT-TDD 独自 detector 番号体系 (L3/L4 で再採番、現状は HELIX 番号を出典 reference として残す) | FR-L1-22, FR-L1-25 |
| `gate-checks.yaml` | UT-TDD でも同名 path で扱う (`docs/governance/gate-checks.yaml`、L4 carry) | FR-L1-05 |
| `helix-process/` doc 群 | UT-TDD では `docs/helix-process/` への取り込みではなく、`vendor/helix-source/docs/v2/process/` を read-only reference として参照 (FR-L1-32 で fold) | FR-L1-32 |
| `helix-bench` / `helix-pr` 等 | `ut-tdd bench` / `ut-tdd pr` 等の同等命令体系 (L4 CLI 設計 carry) | FR-L1-17, FR-L1-20 |
| `feedback_hook` (HELIX 5 軸) | `.ut-tdd/hooks/feedback.ts` (Bun、ADR-001 整合) | FR-L1-19, FR-L1-20 |
| `cutover_orchestrator` | `ut-tdd cutover` (Recovery 収束専用、L4 carry) | FR-L1-10 |

注記の目的: HELIX 由来知見を概念的に取り込みつつ、実装は UT-TDD 独自 (TS/Bun + ファイルベース state + 個別 CLI) で再構築する。

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
| BR-08 | FR-L1-09 | AI ガード (doc-reviewer 召喚機能は §5 末 carry) |
| BR-13〜19 (Audit framework 由来) | FR-L1-04, FR-L1-05, FR-L1-17 | PLAN kind / static gate / CI 連携 |
| BR-20 (local DB) | FR-L1-06 | V モデル本線 state 一元管理 |
| BR-20 (ダッシュボード Phase A) | FR-L1-20 | 観測・計測層 (Phase A: local DB + local dashboard) |
| BR-20 (ダッシュボード Phase B) | FR-L1-20 + L3 forward carry | server sync + telemetry + self-improvement (Phase B、§5 末 carry) |

### carry note: doc-reviewer 召喚機能 (BR-08 下流)

doc-reviewer (pmo-sonnet とは責務分離した doc 品質専用 read-only reviewer) の独立 FR としての機能要求は、L3 機能要件への forward carry とする。詳細: role 定義 (model / 召喚 trigger / coverage 監査) = `docs/migration/v2-import-ledger.md §2 F-5`。

### carry note: ダッシュボード Phase A/B (BR-06 / BR-20 下流)

- **Phase A** (local DB + local dashboard): FR-L1-20 (観測・計測層) + FR-L1-06 (state 一元管理) で基盤確立。L3 機能要件で dashboard 機能仕様を具体化。
- **Phase B** (server sync + telemetry + self-improvement): L3 forward carry。PGlite + ElectricSQL 等のアーキ候補は L4 技術要求 §2 で ADR-002 候補として検討。

## §6 関連 doc

- L1 業務要求: `docs/design/harness/L1-requirements/business-requirements.md`
- L0 概念層: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- v2 import ledger (FR-L1 全件出典): `docs/migration/v2-import-ledger.md §6`
- L14 運用テスト設計: `docs/test-design/harness/L1-operational-test-design.md`
- L1 技術要求: `docs/design/harness/L1-requirements/technical-requirements.md`
