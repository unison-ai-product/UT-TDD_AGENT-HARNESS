# UT-TDD-agent-harness 構想書

- **Version**: 2.1
- **対応構想書**: AI駆動開発チーム構想書 v1.1
- **対応運用ルール書**: AI駆動開発チーム運用ルール書 v1.1
- **想定実装エージェント**: Claude Code(複雑タスク・設計判断)、Codex(自律実行・並列処理)
- **対象 OS**:
  - macOS / Linux: ネイティブ動作
  - Windows: **WSL2 必須**(または Git Bash + Python 3.11+ 入り環境)。`.ps1` は提供しない
  - CI: `ubuntu-latest` 固定
- **対象リポジトリ言語**: 言語非依存(Python / Node / Go / Rust などを `scripts/test.sh` ラッパー経由で吸収)
- **必須ローカル依存**: bash 4+ / git 2.30+ / Python 3.11+ / `pip` / `gh` CLI(Phase 0-B のみ)

## v2.1 の主旨(v2.0 からの差分 / 2 回 TL レビュー反映)

v2.0 → v2.1 で **TL レビュー第 1 回 23 件 + 第 2 回 6 件 = 計 29 件** を反映:

| 区分 | 件数 | 主な内容 |
|---|---|---|
| Critical(着手前ブロッカー) | 5 | `ut-tdd` CLI 統一(シェルラッパー) / Windows 対応 WSL2 必須化 / 3 層 YAML を設計仕様書化 / `scrum_reverse_lint` 仕様化 / layer×workflow_phase 排他 |
| High(技術的破綻) | 3 | Required Status Checks 名一致 / `poc.yml` 失敗集計 + exit 1 / 全 job に `actions/checkout` |
| Medium | 3 | `artifact_type` に `test_design` / `test_code` 分離 / bash `nullglob` 全 lint に適用 / Windows 対応の Phase 0 成果物明示 |
| Important | 6 | `test.sh`/`lint.sh` を `exit 0` スタブに / branch×kind 整合チェック / PR チェックボックス機械検証 / `vmodel_lint` Python 化 / `harness-check.yml` と branch workflow 重複排除 |
| Minor | 6 | poc-no-merge-guard `exit 1` / PLAN-MM 命名定義 / matrix 注釈 / `--upgrade` 撤回 / 改定履歴日付 |
| PM 見落とし | 6 | `.pre-commit-config.yaml` サンプル / GHA caching / pyyaml pinning / failure_log concurrency / verify exit 1 必須 / session-end git diff 精緻化 |

## v2.0 → v2.1 設計判断確定

| 判断 | 確定 |
|---|---|
| pre-push と CI のコスト最適化 | **案 B: pre-push は軽量チェック、main merge 時のみフルテスト + SAST + SCA** |
| Windows ネイティブ対応 | **WSL2 必須化、`.ps1` 提供なし**(同期ずれリスク回避) |
| `workflows/` `harness/` YAML 実行基盤 | **設計仕様書として位置付け、interpreter 不要**(エスカレーション判定は JSONL + bash で実現) |
| `ut-tdd` CLI 形式 | **シェルラッパー方式**(`scripts/ut-tdd` ディスパッチャ + `scripts/ut-tdd-<sub>.sh`) |

---

# §1 Why — なぜ UT-TDD-agent-harness か

## 1.1 チーム開発で起こる 4 問題

構想書 v1.1 / 運用ルール書 v1.1 + AI 駆動開発の現実観察から、以下 4 問題が常態化している:

| # | 問題 | 具体的影響 |
|---|------|------------|
| **P1** | 設計・実装・テストの乖離 | AI が「テストも書いた」と言うが設計 doc とテストコードが対応しない、逆ピラミッド化 |
| **P2** | 役割境界が曖昧 | TL/QA/AI実装・保守/UI/UX/発注元 の責任が PR ごとに食い違う、CODEOWNERS 未整備 |
| **P3** | PoC が独り歩き | 仮説検証で書いた PoC コードが本実装で再実装される、知見が文書化されない |
| **P4** | 既存実装への破壊的追加 | AI が「より良い形」と称して既存設計を改変、既存テストを書き換えて回帰検知不能 |

`UT-TDD-agent-harness` はこの 4 問題に **3 つの実装経路 + 機械検証** で構造的に対処する。

## 1.2 名前の意味

| 部分 | 意味 |
|---|---|
| **UT**(Unit Test) | L3.5 機能設計 ① + 単体テスト設計 ③ + 単体テストコード ④ の triple freeze。設計とテストの 1:1 対応を機能粒度で強制 |
| **TDD**(Test-Driven Development) | 設計 ① ↔ テスト設計 ③ pair freeze。テスト設計 doc が無ければ実装段階に進めない |
| **agent** | AI 実装(② コード)が ① 設計と ④ テストコードに挟まれる構造で、AI を「設計とテストの間の自動化層」として位置付ける |
| **harness** | 上記を YAML / hook / GitHub Actions で **機械強制** する土台(構想書 v1.1 用語集「AI エージェントを安全に動かす土台」) |

## 1.3 既存 2 構想書との関係

本書は以下 2 文書を **前提とした実装層** であり、置換するものではない:

| 文書 | 役割 | 本書との関係 |
|---|---|---|
| 構想書 v1.1 | チーム構造・理念・5 段階セキュリティ | 本書 §2-§14 でこれを実装に落とす |
| 運用ルール書 v1.1 | 日常フロー・PR/ブランチ規約・インシデント | 本書 §9 / §11 でこれを CI / ハーネス層に組み込む |

3 文書は `docs/governance/` 配下に共存する:

```
docs/governance/
├── team-charter.md        # ← 構想書 v1.1
├── operations.md          # ← 運用ルール書 v1.1
└── harness-blueprint.md   # ← 本書(UT-TDD-agent-harness 構想書)
```

# §2 ハーネスの設計骨格

## 2.1 3 経路 + 4 補助軸

UT-TDD-agent-harness は **チーム開発で発生する全実装パターン** を 3 つの経路で網羅し、4 つの補助軸で支える:

### 3 つの実装経路

| # | 経路 | トリガー | フロー | 主な kind |
|---|------|----------|--------|-----------|
| **経路 1** | V-model Forward | 発注元 Issue(要件確定) | V-model 4 artifact pair freeze → L4 実装 → 4 段レビュー → Release | `design` + `impl` |
| **経路 2** | Scrum × Reverse 自動 routing | 仮説(要件未確定) | Scrum S0-S4 → 30 cell matrix lookup → Reverse R0-R4 → Forward 合流 | `poc` + `reverse` |
| **経路 3** | add-design / add-impl | 既存 PLAN への拡張要求 | 差分前提固定 → 追補範囲限定 → 既存テスト維持 → 回帰確認 → 双方向 reference 更新 | `add-design` + `add-impl` |

### 4 つの補助軸

| # | 補助軸 | 内容 |
|---|--------|------|
| **補助 1** | 緊急経路(recovery) | hotfix template 7 必須セクション + session 終了前 4 項目 fail-close + postmortem 強制 |
| **補助 2** | GitHub 統制 | 6 ブランチタイプ + 4 workflows + PR/Issue/CODEOWNERS + commitlint + Protected Branch |
| **補助 3** | 3 層抽象化(設計仕様書)| スキル / ワークフロー(`workflows/*.yaml`)/ ハーネス(`harness/*.yaml`)+ L0-L3 reviewer 自動切替。**v2.1: YAML は設計仕様書として参照され、interpreter は導入しない** |
| **補助 4** | チーム責任二極化 | TL 上流 / QA 下流 / AI実装・保守 / UI/UX / 発注元 の 5 役割マトリクス(構想書 v1.1 §2 準拠) |

## 2.2 全体像

```
                       ┌──────────────────────────────────────┐
                       │       発注元(プロダクトオーナー)      │
                       │   WHY / WHAT / 受入基準 / R3 検証     │
                       └────────────────┬─────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
   [要件確定]                       [仮説]                           [既存拡張]
        │                               │                               │
        ▼                               ▼                               ▼
  ┌──────────┐                  ┌──────────────┐               ┌──────────────┐
  │ 経路 1   │                  │   経路 2     │               │   経路 3      │
  │ V-model  │                  │ Scrum×Reverse│               │  add-* 差分    │
  │ Forward  │                  │ 自動 routing │               │     実装      │
  └────┬─────┘                  └──────┬───────┘               └──────┬───────┘
       │                               │                               │
       │ 4 artifact pair freeze        │ S4 decide → matrix lookup     │ 既存テスト維持
       │ (設計⇔テスト設計同時凍結)      │ → R0-R4 → R4 で Forward 合流  │ + 回帰確認
       │                               │                               │
       └───────────────┬───────────────┴───────────────┬───────────────┘
                       │                               │
                       ▼                               ▼
              ┌──────────────────────────────────────────────┐
              │  補助 2: GitHub 統制(全経路の共通基盤)        │
              │   6 ブランチ × 4 workflows × CODEOWNERS       │
              └──────────────────────┬───────────────────────┘
                                     │
                       ┌─────────────┴─────────────┐
                       │                           │
                       ▼                           ▼
              ┌────────────────┐         ┌────────────────┐
              │ 補助 3: 3 層    │         │ 補助 4: チーム  │
              │ 抽象化(設計    │         │ 責任二極化      │
              │ 仕様書)+       │         │ + 4 段レビュー  │
              │ エスカレーション│         │                │
              └────────────────┘         └────────────────┘

              ┌──────────────────────────────────────────────┐
              │ 補助 1: 緊急経路(P0/P1 インシデント発生時)    │
              │   hotfix template + session 終了前 4 項目    │
              │   + postmortem doc 強制                       │
              └──────────────────────────────────────────────┘
```

## 2.3 5 段階セキュリティとの統合(構想書 v1.1 §3 準拠)

構想書 §3.3 の多層防御を、本ハーネスの各補助軸に分散統合:

| セキュリティ段階 | 統合先 | 具体 tool |
|---|---|---|
| Develop | 経路 1 G3 ゲート(API/Schema Freeze 時に threat model 確認) | (人間判断) |
| Commit | pre-commit hook + commitlint(§9.6 完全 YAML) | gitleaks v8.21+ / commitlint v19+ |
| Build | 4 workflows の SAST / SCA / Secret Scan(§9.2)| trivy(SCA)/ codeql(SAST) — Phase 2 で追加 |
| Deploy | hotfix.yml の incident-log + Protected Branch(§8.3 + §9.7)| `gh` CLI |
| Operate | escalation L0-L3 で異常検知 + L10 観測フェーズで Sentry/Uptime Robot/Dependabot アラートを `failure_log.jsonl` へ追記 | Sentry / Uptime Robot / Dependabot |

# §3 frontmatter スキーマ

PLAN doc の YAML frontmatter は **機械検証可能な 9 必須フィールド** + 7 軸の enum で構成する。`ut-tdd plan lint`(§12.1)が CI で fail-close 動作する。

## 3.1 必須 9 フィールド

```yaml
---
plan_id: PLAN-NNN-slug                       # 形式: PLAN-\d{3}(-[a-z0-9-]+)? または PLAN-MM-\d{3}
title: "PLAN-NNN: タイトル"
kind: impl                                    # §3.2 の 11 種から
layer: L4                                     # §3.3 の 15 種から(workflow_phase 使用時は cross 固定)
drive: be                                     # §3.4 の 9 種から
status: draft                                 # draft / confirmed / completed / archived
agent_slots:                                  # §3.7 の役割スロット
  - role: tl
    slot_label: "TL — 設計判断"
  - role: se
    slot_label: "SE — 実装"
generates:                                    # 双方向 trace の起点
  - artifact_path: src/foo.py
    artifact_type: python_module              # §3.6 の 18 種から
dependencies:
  parent: PLAN-NNN-master                     # 親 PLAN(任意)
  requires:                                   # 前提 PLAN
    - PLAN-MMM
  blocks: []                                  # ブロックされる後段 PLAN
---
```

**`PLAN-MM-NNN` 形式の意味**(v2.1 確定): `MM` = **Master Plan**(複数子 PLAN を親 hub として束ねる設計プラン)。子 PLAN の `dependencies.parent` に `PLAN-MM-NNN` を指定する。

## 3.2 VALID_KINDS(11 種)

| kind | 用途 | 主な layer | 経路 |
|---|---|---|---|
| `design` | 設計 doc 起票(D-API / D-DB / D-CONTRACT 等) | L1-L3 | 経路 1 |
| `impl` | 機能実装(L4 Sprint) | L4 | 経路 1 |
| `poc` | 仮説検証(Scrum S0-S4) | (workflow_phase S0-S4) | 経路 2 |
| `reverse` | 設計復元(Reverse R0-R4) | (workflow_phase R0-R4) | 経路 2 |
| `add-design` | 既存設計への追補 | L2-L3 | 経路 3 |
| `add-impl` | 既存実装への機能追加 | L4 | 経路 3 |
| `refactor` | 機能変更なし内部改善 | L4 | 補助 |
| `retrofit` | 既存規約への合わせ込み | L4 | 補助 |
| `recovery` | session 断絶・認識ずれからの再開 | cross | 補助 1 |
| `troubleshoot` | バグ解析・障害対応 | L4 / L7 | 補助 1 |
| `research` | 技術調査 doc | L1-L2 | 経路 1 前段 |

## 3.3 VALID_LAYERS(15 種、L3.5 / L4.5 含む)

| layer | 名称 | 4 artifact 対応(① 設計) |
|---|---|---|
| `L0` | 基盤整備(リポジトリ初期化) | — |
| `L1` | 要件定義 | 要件 / 受入条件 |
| `L2` | 全体設計 | CONCEPT / ADR |
| `L3` | 詳細設計 | D-API / D-DB / D-CONTRACT |
| `L3.5` | **機能設計** | endpoint / 関数 schema |
| `L4` | 実装 | — |
| `L4.5` | 結合 | — |
| `L5` | Visual Refinement | — |
| `L6` | 統合検証 | — |
| `L7` | デプロイ | — |
| `L8` | 受入 | — |
| `L9` | デプロイ検証 | — |
| `L10` | 観測 | — |
| `L11` | 運用学習 | — |
| `cross` | 横断 PLAN(複数 layer に影響、`workflow_phase` 使用時必須) | — |

**L3.5 / L4.5 の存在意義**: L3 詳細設計から L4 実装に直接飛ぶと「機能粒度」が抜け、単体テスト設計の対応先が消える。L3.5 機能設計 + L4.5 結合の介入で **粒度の連続性** を保つ。

## 3.4 VALID_DRIVES(9 種)

| drive | 用途 | L5(Visual Refinement)要否 |
|---|---|---|
| `be` | バックエンド / API / ロジック中心(default) | UI 変更時のみ |
| `fe` | UI / モック駆動 | **常に必要** |
| `fullstack` | BE + FE 同時(Twin Track) | **常に必要** |
| `db` | スキーマ / データモデル中心 | UI 変更時のみ |
| `agent` | AI エージェント / プロンプト設計 | **常に必要**(会話 UI) |
| `scrum` | 仮説検証(経路 2 専用) | — |
| `reverse` | 既存コード逆引き(経路 2 専用) | — |
| `poc` | (`scrum` の補完、PoC 単独実装時) | — |
| `troubleshoot` | 緊急対応(補助 1 専用) | — |

## 3.5 VALID_WORKFLOW_PHASES(Scrum / Reverse 専用、`layer` の代替)

経路 2 では `layer` の代わりに `workflow_phase` を使う。**この場合 `layer: cross` を必須**(`plan_validator.py` の排他チェックで強制):

| workflow_phase | フェーズ |
|---|---|
| `S0` | Backlog 構築(仮説 + 検証質問 + 成功条件) |
| `S1` | Sprint Plan(ゴール + 対象仮説選定) |
| `S2` | PoC 実装(`verify/*.sh` 化) |
| `S3` | Verify(全 verify スクリプト実行 = 回帰蓄積) |
| `S4` | Decide(confirmed / rejected / pivot) |
| `R0` | Evidence Acquisition(証拠収集) |
| `R1` | Observed Contracts(API/DB/型抽出、skip 判定あり) |
| `R2` | As-Is Design(設計復元) |
| `R3` | Intent Hypotheses(意図仮説 + **発注元検証**) |
| `R4` | Gap & Routing(差分 → Forward 接続点決定) |

**排他制約**(`plan_validator.py` が fail-close):
- `kind in [poc, reverse]` → `workflow_phase` 必須、`layer` は `cross` のみ許可
- `kind not in [poc, reverse]` → `layer` 必須、`workflow_phase` 禁止

## 3.6 VALID_ARTIFACT_TYPES(18 種、v2.1 で `test` を `test_design`/`test_code` に分離)

`generates[].artifact_type` に指定可能な値:

| artifact_type | 用途 | V-model |
|---|---|---|
| `design_doc` | 設計ドキュメント(D-API / D-DB / D-CONTRACT 等) | ① |
| `adr_snapshot` | ADR 凍結スナップショット | ① |
| `markdown_doc` | 一般 markdown ドキュメント | — |
| `doc_update` | 既存 doc の更新 | — |
| `python_module` | Python モジュール | ② |
| `script` | Bash / PowerShell スクリプト | ② |
| `cli_extension` | CLI コマンド拡張 | ② |
| `template` | テンプレートファイル | — |
| **`test_design`** | **テスト設計ドキュメント(L1 受入 / L2 総合 / L3 結合 / L3.5 単体)** | **③** |
| **`test_code`** | **テストコード(`tests/` 配下の実装)** | **④** |
| `hook` | Git / CI hook | — |
| `schema_migration` | DB スキーママイグレーション | ② |
| `config` | 設定ファイル(汎用) | — |
| `yaml_config` | YAML 設定 | — |
| `json_config` | JSON 設定 | — |
| `workflow_config` | GitHub Actions workflow / harness YAML | — |
| `github_config` | GitHub 関連設定(CODEOWNERS / PR template 等) | — |
| `other` | 上記に該当しないもの | — |

**v2.1 変更**: v2.0 では `test` 1 種だったが、V-model 4 artifact の `③ テスト設計` と `④ テストコード` を区別するため **`test_design` と `test_code` に分離**。これにより `vmodel_lint` が artifact_type で V-model の 4 区分を機械判別可能になる。

## 3.7 agent_slots(役割スロット)

役割名は構想書 v1.1 §2.3 の 5 役割 + 補助技術ロール:

| role | 担当領域 |
|---|---|
| `po` | 発注元 — 受入条件・R3 Intent 検証・リリース承認 |
| `tl` | 技術責任者 — 設計判断 / アーキ / G2-G3 ゲート / adversarial review |
| `qa` | 品質責任者 — テスト戦略 / G4-G6 ゲート / リリース判定 |
| `aim` | AI実装・保守 — AI への指示 / アラート対応 / エスカレーション |
| `uiux` | UI/UX デザイン — Figma / モック / state-events |
| `se` | (補助)実装委譲先 — Codex / Claude Code |
| `docs` | (補助)ドキュメント担当 — テンプレ起草 / 整合確認 |

# §4 V-model 4 artifact 工程管理(中核)

経路 1(V-model Forward)の中核フレームワーク。経路 2 の R3-R4 後の Forward 合流、経路 3 の add-design / add-impl もすべて本工程に従う。

## 4.1 4 artifact 双方向 trace

ソフトウェア工学の V-model に則り、**4 つの artifact は別文書として存在** し、双方向 reference で trace。同一文書への統合は **V-model 違反**(`vmodel_lint` で fail-close)。

```
   ① 設計層             ←対応関係→         ③ テスト設計層
   docs/design/                            docs/test-design/
        │                                        │
        ▼ 実装                                   ▼ 実装
   ② 実装コード         ←対応関係→         ④ テストコード
   src/                                    tests/
```

### 4 artifact の物理配置

| Artifact | 担当 layer | 配置場所(推奨) | artifact_type | 命名規約 |
|---|---|---|---|---|
| ① 設計 | L1-L3.5 | `docs/design/<feature>/<name>.md` | `design_doc` | 例: `D-API-audit.md` |
| ② 実装コード | L4 | `src/...` | `python_module` / `script` / `cli_extension` 等 | 言語標準 |
| ③ テスト設計 | L1-L3.5(① と同層)| `docs/test-design/<feature>/<name>-test-design.md` | **`test_design`** | 例: `D-API-audit-test-design.md` |
| ④ テストコード | L4(② と同層)| `tests/...` | **`test_code`** | 例: `test_audit.py` |

## 4.2 Layer × Artifact マッピング

| layer | ① 設計 artifact | ③ テスト設計 artifact |
|---|---|---|
| **L1 要件定義** | `docs/design/L1-requirements.md`(要件 + 受入条件)| `docs/test-design/L1-acceptance-test-design.md`(**受入テスト設計**)|
| **L2 全体設計** | `docs/design/L2-master.md` + ADR | `docs/test-design/L2-system-test-design.md`(**総合テスト設計**)|
| **L3 詳細設計** | `docs/design/L3-D-API.md` / `D-DB.md` / `D-CONTRACT.md` | `docs/test-design/L3-integration-test-design.md`(**結合テスト設計**)|
| **L3.5 機能設計** | `docs/design/L3.5-<feature>.md`(endpoint / 関数 schema)| `docs/test-design/L3.5-<feature>-unit-test-design.md`(**単体テスト設計**)|

## 4.3 双方向 trace ルール(6 方向)

各 artifact は対応関係を本文中に明示する。`vmodel_lint` は grep で検証する。

| From → To | 記述方法 | 例 |
|---|---|---|
| ① 設計 → ② 実装コード | 設計に「実装ファイル: `<path>`」| `実装ファイル: src/audit.py` |
| ② 実装コード → ① 設計 | docstring に「契約: `<doc>` §`<n>`」| `"""契約: docs/design/L3-D-API.md §3.1"""` |
| ① 設計 → ③ テスト設計 | 設計に「テスト設計: `<path>`」| `テスト設計: docs/test-design/L3.5-audit-unit-test-design.md` |
| ③ テスト設計 → ① 設計 | テスト設計に「対象設計: `<doc>` §`<n>`」| `対象設計: docs/design/L3-D-API.md §3.1` |
| ③ テスト設計 → ④ テストコード | テスト設計に「テスト実装: `<path>`, U-XXX-001 対応」| `テスト実装: tests/test_audit.py, U-AUD-001〜023` |
| ④ テストコード → ③ テスト設計 | docstring に「DoD 検証: `<doc>` U-XXX-NNN」| `"""DoD 検証: docs/test-design/L3.5-audit-unit-test-design.md U-AUD-001"""` |

## 4.4 Pair freeze ルール(G2-G4 ゲートで fail-close)

> **設計 artifact が完了した時点で、対応するテスト設計 artifact が存在しなければ次フェーズに進めない**

具体的なゲート発火条件:

| ゲート | 確認内容 |
|---|---|
| **G2 設計凍結** | L1 ① ⇔ L1 ③ ペア揃い、L2 ① ⇔ L2 ③ ペア揃い |
| **G3 実装着手** | L3 ① ⇔ L3 ③ ペア揃い、**L3.5 ① ⇔ L3.5 ③ ペア揃い**(これ必須) |
| **G4 実装凍結** | ② 実装コード + ④ テストコードが揃い、双方向 trace の 6 方向すべて存在 |

`ut-tdd doctor --check vmodel`(§12.2)で機械検証。検証 logic は §4.7 / §12 参照。

## 4.5 QA 追加テストの分離(V-model 補足)

L4 実装完了後に QA が追加する **regression / exploratory / edge-case** テストは、L3 結合テスト設計や L3.5 単体テスト設計に **統合してはいけない**。別の L6 統合検証 doc として独立レイヤー化する。

| テスト種別 | 担当 | 設計 doc | タイミング |
|---|---|---|---|
| 単体テスト | aim / se | L3.5 単体テスト設計 | L4 Sprint 内 |
| 結合テスト | aim / se | L3 結合テスト設計 | L4.5 |
| **QA 追加テスト**(regression / exploratory / edge-case)| qa | **`docs/test-design/L6-qa-additional-test-design.md`** | L6 統合検証 |
| 総合テスト(E2E)| qa / aim | L2 総合テスト設計 | L6 |
| 受入テスト | po / qa | L1 受入テスト設計 | L8 受入 |

**禁止**: QA 追加テストを L3.5 単体テスト設計や L3 結合テスト設計の内容と統合すること。`vmodel_lint` で P1 severity(carry 候補)になる。

## 4.6 逆ピラミッド検出(P0 severity)

`① 設計 + ② 実装コード` が存在するが `③ テスト設計 + ④ テストコード` が無い、または ③ ④ が「後付け」状態の PLAN は **逆ピラミッド**。

| 検出 | severity | 動作 |
|---|---|---|
| ① ② 存在、③ ④ 無し | **P0** | G3 / G4 で **fail-close**(マージ不可)|
| ① ② 存在、③ あり ④ 無し | P1 | warning + carry 候補 |
| ② のみ存在、① ③ ④ 無し | **P0** | 「設計なし実装」、G3 で fail-close |
| 双方向 trace 6 方向のいずれか欠落 | P1 | warning + carry note |

## 4.7 vmodel_lint 実装(Python 化、v2.1)

v2.0 では bash + grep の擬似コードだったが、YAML parse / 6 方向 grep / severity 振り分けが複雑なため **Python 実装に切替**。

`scripts/lib/vmodel_validator.py`(本体):

```python
"""V-model 4 artifact 双方向 trace 検証ツール"""
from __future__ import annotations
import re, sys, glob
from pathlib import Path
import yaml

ARTIFACT_TYPE_MAP = {
    "design_doc": "design",
    "python_module": "impl",
    "script": "impl",
    "cli_extension": "impl",
    "schema_migration": "impl",
    "test_design": "test_design",
    "test_code": "test_code",
}

TRACE_PATTERNS = {
    ("design", "impl"):        r"実装ファイル[::]\s*([^\s]+)",
    ("impl", "design"):        r"契約[::]\s*([^\s]+)",
    ("design", "test_design"): r"テスト設計[::]\s*([^\s]+)",
    ("test_design", "design"): r"対象設計[::]\s*([^\s]+)",
    ("test_design", "test_code"): r"テスト実装[::]\s*([^\s,]+)",
    ("test_code", "test_design"): r"DoD\s*検証[::]\s*([^\s]+)",
}

def parse_frontmatter(plan_path: Path) -> dict:
    text = plan_path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return {}
    return yaml.safe_load(m.group(1)) or {}

def classify_artifacts(frontmatter: dict) -> dict[str, list[str]]:
    by_kind = {"design": [], "impl": [], "test_design": [], "test_code": []}
    for entry in frontmatter.get("generates", []):
        atype = entry.get("artifact_type")
        kind = ARTIFACT_TYPE_MAP.get(atype)
        if kind:
            by_kind[kind].append(entry.get("artifact_path", ""))
    return by_kind

def lint_plan(plan_path: Path) -> list[tuple[str, str]]:
    """戻り値: (severity, message) のリスト"""
    fm = parse_frontmatter(plan_path)
    if fm.get("kind") not in ("impl", "add-impl"):
        return []  # impl 系のみ V-model 検証対象

    arts = classify_artifacts(fm)
    findings = []

    # 逆ピラミッド検出(P0)
    has_d, has_i, has_td, has_tc = (bool(arts[k]) for k in ("design", "impl", "test_design", "test_code"))
    if has_d and has_i and not has_td and not has_tc:
        findings.append(("P0", f"{plan_path}: ① ② あり ③ ④ なし(逆ピラミッド)"))
    if has_i and not has_d and not has_td and not has_tc:
        findings.append(("P0", f"{plan_path}: ② のみ(設計なし実装)"))
    if has_d and has_i and has_td and not has_tc:
        findings.append(("P1", f"{plan_path}: ④ テストコード未生成(carry 候補)"))

    # 双方向 trace 6 方向検証
    for design_path in arts["design"]:
        if not Path(design_path).exists():
            continue
        text = Path(design_path).read_text(encoding="utf-8")
        if arts["impl"] and not re.search(TRACE_PATTERNS[("design","impl")], text):
            findings.append(("P1", f"{design_path}: ① → ② trace 欠落"))
        if arts["test_design"] and not re.search(TRACE_PATTERNS[("design","test_design")], text):
            findings.append(("P1", f"{design_path}: ① → ③ trace 欠落"))

    # ② → ①、③ → ①、③ → ④、④ → ③ 同様の検証(省略、本実装で網羅)
    return findings

def main():
    plans = sorted(glob.glob("docs/plans/PLAN-*.md"))
    if not plans:
        print("[vmodel_lint] PLAN ファイル無し、PASS")
        return 0
    all_findings = []
    for plan in plans:
        all_findings.extend(lint_plan(Path(plan)))
    p0 = [f for sev, f in all_findings if sev == "P0"]
    p1 = [f for sev, f in all_findings if sev == "P1"]
    for f in p1: print(f"[P1 WARN] {f}")
    for f in p0: print(f"[P0 FAIL] {f}", file=sys.stderr)
    return 1 if p0 else 0

if __name__ == "__main__":
    sys.exit(main())
```

`scripts/vmodel_lint.sh`(thin wrapper):

```bash
#!/usr/bin/env bash
set -euo pipefail
PY="$(scripts/lib/python_cmd.sh)"
exec $PY scripts/lib/vmodel_validator.py "$@"
```

CI(`harness-check.yml`)で fail-close 動作、ローカル pre-commit でも実行。

# §5 経路 1: V-model Forward(要件確定時の通常開発)

## 5.1 経路 1 全体フロー

```
[L0]  基盤整備(リポジトリ初期化、Branch Protection、Bootstrap)
  │
  ▼
[L1]  要件定義(po + tl)
       ① 要件 doc 起票
       ③ 受入テスト設計 doc 起票(pair freeze)
  ↓ G1: 要件完了ゲート(po + tl 承認)
[L2]  全体設計(tl)
       ① CONCEPT / ADR
       ③ 総合テスト設計(pair freeze)
  ↓ G2: 設計凍結ゲート(tl + adversarial review)
[L3]  詳細設計(tl + uiux)
       ① D-API / D-DB / D-CONTRACT
       ③ 結合テスト設計(pair freeze)
[L3.5] 機能設計(tl)
       ① endpoint / 関数 schema
       ③ 単体テスト設計(pair freeze)★これが UT-TDD の核
  ↓ G3: 実装着手ゲート(API/Schema Freeze + L3.5 pair freeze 確認)
[L4]   実装(aim → se 委譲)
       ② 実装コード
       ④ テストコード
  ↓ G4: 実装凍結ゲート(4 artifact 揃い + 双方向 trace 6 方向)
[L4.5] 結合(aim)
[L5]   Visual Refinement(uiux、drive 別に要否判断)
[L6]   統合検証(qa)
       ③ L6 QA 追加テスト設計
       ④ E2E / regression / exploratory テスト
  ↓ G5/G6: 品質ゲート
[L7]   デプロイ
  ↓ G7: 安定性ゲート
[L8]   受入(po)
[L9]   デプロイ検証
[L10]  観測
[L11]  運用学習
```

## 5.2 経路 1 で使う kind

- 起点: `design`(L1-L3.5 で複数の設計 doc を起票)
- 実装: `impl`(L4)
- 補助: `research`(L1 前段の技術調査)

例:

```yaml
# docs/plans/PLAN-001-user-auth-design.md
plan_id: PLAN-001-user-auth-design
title: "ユーザー認証機能 — 全体設計"
kind: design
layer: L2
drive: be
status: confirmed
agent_slots:
  - role: tl
    slot_label: "TL — 全体設計 + ADR"
generates:
  - artifact_path: docs/design/L2-user-auth.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/L2-user-auth-system-test-design.md
    artifact_type: test_design
  - artifact_path: docs/adr/ADR-001-jwt-vs-session.md
    artifact_type: adr_snapshot
dependencies:
  parent: null
  requires: []
  blocks:
    - PLAN-002-user-auth-impl
```

## 5.3 G1-G11 ゲート(運用ルール書 §1.1 原則 3「main 常時デプロイ可」を機械強制)

各ゲートは `ut-tdd gate <G番号>` CLI(§12)で判定。

| ゲート | 判定者 | 自動判定項目 | 手動判定項目 |
|---|---|---|---|
| **G1** 要件完了 | po + tl | L1 ① ⇔ ③ ペア揃い | 要件曖昧性 / 受入条件の SMART 性 |
| **G2** 設計凍結 | tl + adversarial | L2 ① ⇔ ③ ペア揃い、ADR 揃い | アーキ妥当性 |
| **G3** 実装着手 | tl | L3 + L3.5 pair freeze、API/Schema Freeze | 実装可能性 |
| **G4** 実装凍結 | tl + qa | 4 artifact 揃い + 双方向 trace 6 方向 + カバレッジ 80% | レビュー実施 |
| **G5** Visual 凍結 | uiux + tl | drive=fe/fullstack/agent の場合のみ | デザイン承認 |
| **G6** 品質 | qa | L6 QA 追加テスト doc + E2E PASS + パフォーマンス基準 | 運用準備度 |
| **G7** 安定性 | qa + aim | デプロイ後 watch 期間 PASS | — |
| **G8** 受入 | po | E2E シナリオ全 PASS、受入条件全充足 | 顧客承認 |
| **G9** デプロイ検証 | aim | smoke test PASS、ロールバック手順動作 | — |
| **G10** 観測完了 | aim | SLO / SLI watch 完了 | — |
| **G11** 運用学習完了 | qa + tl | postmortem(発生時のみ)、observability feedback | — |

# §6 経路 2: Scrum × Reverse 自動 routing(PoC → 文書化)

要件未確定 / 仮説検証フェーズの開発を、確定後に通常開発(経路 1)へ合流させる経路。

## 6.1 Scrum モード(S0-S4)

仮説の性質に応じて **6 type** に分類。`agent_slots` の `aim` が PoC 実装を担当、`tl` が S4 decide を担当する。

### Scrum 6 type

| Scrum type | 短縮 | 用途 | time-box |
|---|---|---|---|
| `hypothesis-test` | HT | 市場 fit / ユーザー価値 | 1-2 Sprint |
| `tech-spike` | TS | 新技術の実現可能性 | 0.5-1 Sprint |
| `design-spike` | DS | 設計案比較 | 0.5-2 Sprint |
| `perf-spike` | PS | 性能目標達成可能性 | 0.5-1 Sprint |
| `security-spike` | SS | 脅威モデル + 緩和策 | 0.5-1 Sprint |
| `ux-spike` | UX | ユーザー受容性 | 0.5-1 Sprint |

### Scrum S0-S4 のフロー

```
S0: Backlog 構築(aim)
    docs/scrum/backlog.yaml に 仮説 / 検証質問 / 成功条件 を記述
S1: Sprint Plan(tl + aim)
    対象仮説選定、Sprint ゴール確定
S2: PoC 実装(aim → se 委譲)
    src/poc/ に PoC コード、verify/<hypothesis-id>.sh にスクリプト化
S3: Verify(aim)
    bash verify/*.sh で全 verify を再実行(過去仮説も含む = 回帰検出)
S4: Decide(tl)
    confirmed / rejected / pivot の 3 択
    ut-tdd scrum decide --confirmed --reverse-merge
```

**verify スクリプト規約**(v2.1 強化):
- `verify/<hypothesis-id>.sh` は **意図的に失敗する path を必ず含むこと**(常時 `exit 0` 禁止)
- 失敗ケースが無い検証スクリプトは **検証として無効**(`scrum_reverse_lint` で警告)
- 例: `[ "$RESULT" = "expected" ] || { echo "FAIL: $RESULT"; exit 1; }`

## 6.2 Reverse モード(R0-R4)

Scrum で確定した仮説を、設計文書として復元 → Forward 合流させる経路。

### Reverse 5 type

| Reverse type | 短縮 | 起点 | R1 |
|---|---|---|---|
| `code` | CD | 既存コード + DB + 設定 | 実施 |
| `design` | DG | デザイン資産 | skip |
| `upgrade` | UP | 既存版 + 新版 version diff | 実施 |
| `normalization` | NM | 設計 drift 正規化 | 実施 |
| `fullback` | FB | 実装完遂後の文書整合 | 実施 |

### Reverse R0-R4 のフロー

```
R0: Evidence Acquisition(aim)
    docs/reverse/<hypothesis-id>/R0-evidence/ に PoC 証拠を集約
R1: Observed Contracts(tl)  ※ scrum_type により skip 判定
    API / DB / 型を抽出 → docs/reverse/.../R1-contracts.md
R2: As-Is Design(tl)
    docs/reverse/.../R2-as-is-design.md に設計復元
R3: Intent Hypotheses(po + tl)★ここで発注元承認
    意図仮説 → po が R3 検証 → 受入
R4: Gap & Routing(tl + qa)
    docs/reverse/.../R4-gap.md に「Forward HELIX のどの L に接続するか」を決定
```

## 6.3 30 cell matrix(Scrum × Reverse 自動 routing)

`ut-tdd scrum decide --confirmed --reverse-merge --scrum-type <type>` で matrix lookup → 自動的に `ut-tdd reverse <reverse-type> --from-scrum --scrum-hypothesis <id>` を起動。

| Scrum type \ Reverse type | code (CD) | design (DG) | upgrade (UP) | normalization (NM) | fullback (FB) |
|---|---|---|---|---|---|
| **hypothesis-test** (HT) | **Primary** | Alternative | - | - | Alternative |
| **tech-spike** (TS) | Alternative | **Primary** | Alternative | - | - |
| **design-spike** (DS) | - | **Primary** | - | Alternative | Alternative |
| **perf-spike** (PS) | - | - | **Primary** | Alternative | Alternative |
| **security-spike** (SS) | Alternative | Alternative | - | **Primary** | - |
| **ux-spike** (UX) | - | **Primary** | - | Alternative | Alternative |

凡例: `Primary` = デフォルト routing 先、`Alternative` = `--reverse-type` で明示指定可、`-` = 不適切(明示指定すると `scrum_reverse_lint` が reject)。

## 6.4 R1 skip 判定(Reverse の最適化)

Scrum type に応じて R1(Observed Contracts)を skip するかが決まる:

| Scrum type | Primary Reverse type | R1 実施 | 理由 |
|---|---|---|---|
| hypothesis-test | code | **実施** | 実装コードから契約抽出が必須 |
| tech-spike | design | **skip** | アーキ記録が目的、コード契約抽出不要 |
| design-spike | design | **skip** | デザイン資産から DAG 復元 |
| perf-spike | upgrade | **実施** | 新旧版差分として契約変化を記録 |
| security-spike | normalization | **実施** | セキュリティ契約の正規化 |
| ux-spike | design | **skip** | UX 資産から情報 IA 復元 |

## 6.5 R3 Intent Hypotheses = 発注元承認の意味

R3 は **発注元(po)が直接検証** する唯一のステップ。これは構想書 v1.1 §2.1 全体図で発注元が「WHY / WHAT / 受入基準」を担うことに対応。

| 確認内容 | po の判断 |
|---|---|
| PoC が解こうとした **真の問題** が要件と一致するか | YES / NO / 修正 |
| PoC が示した **解決策** が事業的に妥当か | YES / NO / 修正 |
| R4 で **Forward 合流時の優先度** をどう設定するか | 高 / 中 / 低 / 不採用 |

NO の場合は R3 で **pivot 判定**、Forward 合流せず Scrum S0 に戻す。

## 6.6 Forward 合流(R4 → 経路 1)

R4 で確定した Gap は、Forward HELIX(経路 1)の以下に接続される:

| Gap 種別 | Forward 接続点 |
|---|---|
| 要件が未確定 / 追加要件あり | L1(新規 `design` kind PLAN を起票)|
| アーキ判断が必要 | L2(ADR 起票)|
| 詳細設計が必要 | L3(`design` kind PLAN 起票)|
| 機能設計が必要 | L3.5(`design` kind PLAN 起票)|
| 実装のみ | L4(`impl` kind PLAN 起票)|
| 既存への追加 | 経路 3(`add-design` / `add-impl` kind PLAN 起票)|

Forward 合流後は **経路 1 と同じ V-model 4 artifact フロー** に従う。

## 6.7 経路 2 で使う CLI

```bash
# S0: Backlog に仮説追加
ut-tdd scrum init --scrum-type tech-spike
ut-tdd scrum backlog add --hypothesis H001 --title "gRPC streaming 統合可能性"

# S1-S2: Sprint Plan + PoC 実装
ut-tdd scrum plan
ut-tdd scrum poc --hypothesis H001
# → ローカルで bash verify/H001.sh を書きながら実装

# S3: Verify(全 verify 再実行 = 回帰検出)
ut-tdd scrum verify

# S4: Decide → Reverse 自動 routing
ut-tdd scrum decide --confirmed --reverse-merge --scrum-type tech-spike
# → matrix lookup(§6.3): tech-spike × confirmed → Primary = design
# → 自動実行: ut-tdd reverse design --from-scrum --scrum-hypothesis H001
# → docs/reverse/H001/R0-evidence/ 自動生成

# Alternative の明示指定(matrix §6.3 で Alternative として許可されているもののみ)
ut-tdd scrum decide --confirmed --reverse-merge --scrum-type design-spike --reverse-type fullback
# → matrix lookup: design-spike × fullback は Alternative → OK
```

## 6.8 scrum_reverse_lint.sh の検証項目(v2.1 新規)

`scripts/scrum_reverse_lint.sh` は `ut-tdd doctor` から呼ばれる。`scripts/lib/scrum_reverse_validator.py` の thin wrapper。

検証項目:

1. **kind × workflow_phase 整合**: `kind: poc` PLAN の `workflow_phase` が `S0`-`S4`、`kind: reverse` PLAN の `workflow_phase` が `R0`-`R4`
2. **layer == cross 強制**: `kind in [poc, reverse]` の PLAN は `layer: cross` 固定
3. **matrix 違反検出**: `docs/scrum/backlog.yaml` 内の各 hypothesis で、`scrum_type × confirmed_reverse_type` が §6.3 matrix の `-`(不適切)に該当しないこと
4. **R1 skip 一致**: `docs/reverse/<hypothesis-id>/R1-contracts.md` の存在が §6.4 の R1 実施/skip 判定と一致
5. **`docs/reverse/<id>/` ↔ PLAN frontmatter 整合**: 各 `docs/reverse/<hypothesis-id>/` ディレクトリに対応する `kind: reverse` PLAN frontmatter が存在
6. **verify スクリプト exit 1 path 存在**: `verify/*.sh` の各ファイルに `exit 1` または `return 1` の path が grep でヒットすること(§6.1 規約)

入力 / 出力:

```bash
$ bash scripts/scrum_reverse_lint.sh
[scrum_reverse_lint] checking docs/scrum/backlog.yaml ...
[scrum_reverse_lint] H001: scrum_type=tech-spike, primary=design, R1=skip — OK
[scrum_reverse_lint] H002: matrix violation — hypothesis-test × upgrade is '-' (FAIL)
[scrum_reverse_lint] verify/H001.sh: no exit 1 path detected — WARN
exit 1  # P0 violation
```

# §7 経路 3: add-design / add-impl(追加実装対応)

既存設計・実装への追加・拡張。チーム開発で **最も発生頻度が高いケース**(新規実装より圧倒的多数)。

## 7.1 経路 3 の 5 原則

| 原則 | 内容 |
|---|---|
| **差分前提固定** | 追補対象 PLAN を `requires` で一意特定、差分の起点を明示する |
| **追補範囲限定** | 追加内容を既存と明確に分離、**非対応要件を明文化**する |
| **既存 doc 整合** | 既存仕様との矛盾チェック、整合表現に収斂 |
| **既存テスト維持** | 既存テスト群を維持、必要最小の更新のみ。**既存テストの期待値変更は禁止** |
| **双方向 reference** | 元 PLAN ↔ 追補 PLAN の相互参照を `dependencies.requires` + `related_docs` で必須 |

## 7.2 経路 3 で使う kind

| kind | 用途 | 主な layer |
|---|---|---|
| `add-design` | 既存設計 doc への追補 | L2-L3.5 |
| `add-impl` | 既存実装への機能追加 | L4 |

## 7.3 add-design / add-impl PLAN の構造

```yaml
# docs/plans/PLAN-042-user-auth-add-oauth-design.md
plan_id: PLAN-042-user-auth-add-oauth-design
title: "ユーザー認証 — OAuth ログイン追加(設計追補)"
kind: add-design
layer: L2
drive: be
status: draft
agent_slots:
  - role: tl
    slot_label: "TL — 既存設計との整合判断"
  - role: docs
    slot_label: "Docs — 追補 doc 起草、双方向 reference 確認"
generates:
  - artifact_path: docs/design/L2-user-auth-add-oauth.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/L2-user-auth-add-oauth-system-test-design.md
    artifact_type: test_design
dependencies:
  parent: null
  requires:
    - PLAN-001-user-auth-design   # 追補対象 PLAN(必須)
  blocks:
    - PLAN-043-user-auth-add-oauth-impl
related_docs:
  - docs/design/L2-user-auth.md
  - docs/test-design/L2-user-auth-system-test-design.md
```

## 7.4 既存テスト維持 + 回帰確認

`add-impl` PLAN の DoD には以下が必須:

| DoD 項目 | 検証方法 |
|---|---|
| 既存テスト群を維持(削除・期待値変更なし)| `git diff origin/main..HEAD -- tests/` で既存ファイルに削除・変更がないことを確認 |
| 追加テストが既存と独立 | 新規テストファイルとして配置 |
| 回帰確認 | 全テスト実行(既存 + 追加)で **既存テスト 100% PASS** |
| 影響範囲の数値報告 | カバレッジ差分 / 実行時間差分 / テスト件数差分を PR 説明欄に記載 |

`scripts/regression-check.sh`(言語非依存ラッパー、`scripts/lib/regression_checker.py` 経由)が CI で実行。

## 7.5 追補範囲の明文化

```markdown
## §3 実装計画

### 既存 PLAN 参照
- 追補対象: PLAN-001-user-auth-design
- 既存実装の対象外範囲を確認し、差分対象を固定

### 追加機能スコープ
- 追加するもの:
  - Google OAuth 2.0 サインインフロー
  - JWT トークン発行ロジック拡張
- **非対応**:
  - Apple Sign-In(別 PLAN で対応)
  - Microsoft アカウント(対応予定なし)

### 既存テスト維持
- tests/test_user_auth.py: 既存 23 ケースを維持
- 新規追加先: tests/test_user_auth_oauth.py(新規ファイル)

### 回帰確認
- 既存テスト 23/23 PASS 維持
- 新規テスト 14 ケース追加
- カバレッジ: 78.4% → 81.2%(+2.8pt)
- 実行時間: 2.3s → 2.7s(+0.4s)
```

# §8 補助 1: 緊急経路(recovery / troubleshoot / hotfix)

P0 / P1 インシデント発生時、session 断絶時、認識ずれからの再開を扱う。

## 8.1 recovery kind の 7 必須セクション

`docs/plans/PLAN-NNN-recovery-<incident-id>.md` には以下を必須記述(`ut-tdd plan lint` で検証):

```markdown
## §1 事故記録
## §2 議論順序 timeline
## §3 認識訂正履歴
## §4 中間結論 list
## §5 context 再構築
## §6 再開ポイント
## §7 再発防止
```

## 8.2 session 終了前 4 項目 fail-close(v2.1 精緻化)

ハーネスは session 終了(commit + push)前に以下 4 項目を機械チェック。`scripts/session-end-check.sh`(`scripts/lib/session_end_checker.py` の thin wrapper)が pre-push hook で実行。

| 項目 | v2.1 精緻化された検証方法 |
|---|---|
| 1. 中間結論が docs に永続化 | `git diff origin/HEAD..HEAD -- docs/` で **現 push に含まれる commit の docs/ 変更** を確認(staged/unstaged 含めない) |
| 2. carry 残件明記 | `.ut-tdd/audit/deferred-findings.yaml` に carry note 追加(空ならスキップ可) |
| 3. 認識訂正があれば memory 更新 | recovery kind PLAN を起票していれば自動 OK |
| 4. recovery kind PLAN draft 起票 | 認識訂正がある session(`.ut-tdd/audit/recognition-fixes-this-session` フラグ立っている場合)は recovery PLAN を必ず起票 |

**偽陰性回避**: 項目 1 で「他タスクの docs 変更 != session の中間結論永続化」を区別するため、`origin/HEAD..HEAD` で **このセッションでの差分のみ** を見る。

## 8.3 hotfix の流れ(本番障害対応)

```
[1] #incident に投稿(誰でも、発見者)
       ↓
[2] hotfix/<incident-id> ブランチを main から作成
       ↓
[3] aim or se: 最小修正実装(PR 説明欄に hotfix 宣言)
       ↓
[4] ut-tdd plan create --kind recovery --incident <id>
       → docs/plans/PLAN-NNN-recovery-<id>.md 起票
       → docs/postmortems/<date>-<id>.md 起票テンプレ生成
       ↓
[5] CI: hotfix.yml(§9.2.4 参照)
       → 最小範囲テスト + postmortem field チェック
       ↓
[6] tl + qa の即時承認
       ↓
[7] Squash and Merge → 本番デプロイ
       ↓
[8] 収束後: postmortem 完成、再発防止施策を recovery PLAN §7 に記述
```

## 8.4 postmortem テンプレート

`docs/postmortems/TEMPLATE.md`(運用ルール書 §5.5 準拠):

```markdown
# インシデント報告書: <タイトル>

## 概要
## タイムライン
## 原因(直接 + 根本、5 Whys)
## 機能した仕組み / しなかった仕組み
## 再発防止策
- [ ] 観点リスト追加
- [ ] リグレッションテスト追加
- [ ] AGENTS.md 更新
- [ ] CI ワークフロー追加
## 学び
```

# §9 補助 2: GitHub 統制(全経路の共通基盤)

## 9.1 6 ブランチタイプ ↔ kind マッピング + branch-kind-check

| ブランチタイプ | 形式 | 許容 kind | 対応経路 |
|---|---|---|---|
| `feature/` | `feature/<short-desc>` | `impl` / `design` / `add-impl` / `add-design` | 経路 1 + 経路 3 |
| `poc/` | `poc/<hypothesis-id>` | `poc` | 経路 2 前段 |
| `refactor/` | `refactor/<scope>` | `refactor` / `retrofit` | 補助 |
| `hotfix/` | `hotfix/<incident-id>` | `recovery` / `troubleshoot` | 補助 1 |
| `docs/` | `docs/<scope>` | `add-design` / `research` | 経路 1 / 経路 3 doc |
| `chore/` | `chore/<scope>` | `impl` | 補助 |

**branch-kind-check 検証**(v2.1 新規): `scripts/branch-kind-check.sh` が CI で実行。

```bash
#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob
PY="$(scripts/lib/python_cmd.sh)"

BRANCH="${GITHUB_HEAD_REF:-$(git branch --show-current)}"
PREFIX="${BRANCH%%/*}/"

# main / develop は対象外
case "$PREFIX" in
  feature/|poc/|refactor/|hotfix/|docs/|chore/) ;;
  *) echo "[branch-kind-check] skip (not a feature branch)"; exit 0 ;;
esac

# PR で touched された PLAN を抽出
TOUCHED_PLANS=$(git diff --name-only origin/main..HEAD -- 'docs/plans/PLAN-*.md' || true)
[ -z "$TOUCHED_PLANS" ] && { echo "[branch-kind-check] no PLAN touched, skip"; exit 0; }

# kind を抽出して許容セットと照合
$PY scripts/lib/branch_kind_checker.py --branch-prefix "$PREFIX" --plans "$TOUCHED_PLANS"
```

許容外なら `exit 1` で **fail-close**。

## 9.2 4 GitHub Actions workflows(v2.1: Required Status Checks 名一致 + actions/checkout 完備 + 失敗集計)

**Required Status Checks 名の規約**(v2.1 確定): GitHub の Required Status Checks は **`<job-id>`** で指定する。各 workflow の `name:` ではなく、**`jobs.<job-id>` の id** が status check 名になる(同名 job が複数 workflow にある場合は `<workflow-name> / <job-id>` 形式)。本書では一意な job id を採用して識別の混乱を避ける。

### 9.2.1 feature.yml(経路 1 + 経路 3 主)

```yaml
name: Feature Branch Pipeline
on:
  pull_request:
    branches: [main]
  push:
    branches: ['feature/**']

jobs:
  feature-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
      - run: pip install -r scripts/requirements.txt
      - run: bash scripts/lint.sh
      - run: bash scripts/ut-tdd-plan-lint.sh

  feature-test:
    runs-on: ubuntu-latest
    needs: feature-lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
      - run: pip install -r scripts/requirements.txt
      - run: bash scripts/test.sh

  feature-vmodel-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
      - run: pip install -r scripts/requirements.txt
      - run: bash scripts/vmodel_lint.sh

  feature-branch-kind-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
      - run: pip install -r scripts/requirements.txt
      - run: bash scripts/branch-kind-check.sh
```

**v2.1 変更**: v2.0 にあった `ut-tdd-doctor` job は削除(`harness-check.yml` に集約、§12.3 参照)。重複実行排除でコスト削減効果を確保。

### 9.2.2 poc.yml(経路 2 前段)

```yaml
name: PoC Branch Pipeline
on:
  push:
    branches: ['poc/**']

jobs:
  poc-scrum-verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run all verify scripts (fail-close)
        run: |
          set +e
          shopt -s nullglob
          FAILED=0
          FAILED_LIST=""
          for script in verify/*.sh; do
            echo "=== $script ==="
            bash "$script"
            rc=$?
            if [ $rc -ne 0 ]; then
              FAILED=$((FAILED+1))
              FAILED_LIST="$FAILED_LIST $script"
            fi
          done
          if [ $FAILED -gt 0 ]; then
            echo "FAIL: $FAILED verify scripts failed:$FAILED_LIST"
            exit 1
          fi
          echo "OK: all verify scripts passed"

  poc-no-merge-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: PoC merge guard (fail-close)
        env:
          PR_BASE: ${{ github.event.pull_request.base.ref }}
        run: |
          if [ "${PR_BASE:-}" = "main" ]; then
            echo "FAIL: poc/* ブランチを main に直接 merge することは禁止"
            echo "確定後は ut-tdd scrum decide --confirmed --reverse-merge で Reverse 起動を実施"
            exit 1
          fi
          echo "OK: poc branch is not targeting main"
```

**v2.1 変更**: verify loop に **失敗集計 + exit 1** 追加。`poc-no-merge-guard` を `exit 1` 化(main 向け PR は physically block)。

### 9.2.3 refactor.yml(経路 3 派生)

```yaml
name: Refactor Branch Pipeline
on:
  pull_request:
    branches: [main]
  push:
    branches: ['refactor/**']

jobs:
  refactor-full-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
      - run: pip install -r scripts/requirements.txt
      - run: bash scripts/test.sh

  refactor-degrade-check:
    runs-on: ubuntu-latest
    needs: refactor-full-regression
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: bash scripts/regression-check.sh

  refactor-benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run benchmark (optional)
        run: bash scripts/benchmark.sh || echo "WARN: benchmark not implemented"
```

### 9.2.4 hotfix.yml(補助 1)

```yaml
name: Hotfix Branch Pipeline
on:
  pull_request:
    branches: [main]
  push:
    branches: ['hotfix/**']

jobs:
  hotfix-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
      - run: pip install -r scripts/requirements.txt
      - run: bash scripts/test.sh

  hotfix-postmortem-required:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check postmortem in PR body
        env:
          PR_BODY: ${{ github.event.pull_request.body }}
        run: |
          if echo "$PR_BODY" | grep -qE "ポストモーテム|postmortem"; then
            echo "OK: postmortem section found"
          else
            echo "FAIL: hotfix PR requires postmortem section in body"
            exit 1
          fi

  hotfix-recovery-plan-linked:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bash scripts/recovery-plan-check.sh
```

## 9.3 PR template + チェックボックス機械検証(v2.1 新規)

`.github/pull_request_template.md`:

```markdown
## 種別
<!-- feature / poc / refactor / hotfix / docs / chore -->

## 関連 Issue
<!-- #番号、または「なし」 -->

## PLAN 参照
- plan_id:
- kind:
- ADR ref:

## 変更内容

## V-model 4 artifact 確認
- [ ] ① 設計 artifact が docs/design/ に存在
- [ ] ③ テスト設計 artifact が docs/test-design/ に存在
- [ ] ② 実装コードに「契約: <doc> §<n>」 docstring 記載
- [ ] ④ テストコードに「DoD 検証: <doc> U-XXX-NNN」 docstring 記載

## 検証
- [ ] テスト実行済み(`bash scripts/test.sh`)
- [ ] `bash scripts/vmodel_lint.sh` PASS
- [ ] `ut-tdd doctor` PASS
- [ ] 既存テスト全パス維持(add-* / refactor の場合)

## AI 生成範囲
- [ ] 全て AI 生成
- [ ] 一部 AI 生成(具体的に: ___)
- [ ] 人間が全て作成

## 失敗・問題の文脈(該当する場合)
- target_cluster_id:
- related_failures:
- resolution_summary:

## レビュー観点
```

**チェックボックス機械検証**: `scripts/pr-checkbox-check.sh`(`harness-check.yml` から呼ぶ)。

```bash
#!/usr/bin/env bash
set -euo pipefail
PR_BODY="${PR_BODY:-}"
[ -z "$PR_BODY" ] && { echo "[pr-checkbox-check] PR_BODY not provided, skip"; exit 0; }

# V-model 4 項目: 最低 1 つ checked(初版 PR は全部とは限らない)
VMODEL_CHECKED=$(echo "$PR_BODY" | grep -cE '^\- \[x\] (①|③|②|④)' || true)
[ "$VMODEL_CHECKED" -ge 1 ] || { echo "FAIL: V-model 4 artifact checkboxes: 0 checked"; exit 1; }

# AI 生成範囲: 3 択のうち 1 つ checked
AI_CHECKED=$(echo "$PR_BODY" | grep -cE '^\- \[x\] (全て AI 生成|一部 AI 生成|人間が全て作成)' || true)
[ "$AI_CHECKED" -eq 1 ] || { echo "FAIL: AI 生成範囲 must have exactly 1 checked, got $AI_CHECKED"; exit 1; }

# 検証 4 項目: 全部 checked
VERIFY_CHECKED=$(echo "$PR_BODY" | grep -cE '^\- \[x\] (テスト実行済み|`bash scripts/vmodel_lint\.sh`|`ut-tdd doctor`|既存テスト全パス)' || true)
[ "$VERIFY_CHECKED" -ge 3 ] || { echo "FAIL: 検証 4 項目のうち $VERIFY_CHECKED/4 のみ checked"; exit 1; }

echo "OK: PR checkboxes verified"
```

## 9.4 ISSUE_TEMPLATE 4 種

`.github/ISSUE_TEMPLATE/` 配下:

| ファイル | 用途 |
|---|---|
| `bug_report.md` | バグ報告 |
| `feature_request.md` | 機能要望 |
| `failure_pattern.md` | AI 出力失敗パターン報告(観点リスト追加候補) |
| `design_proposal.md` | 設計提案(新規 design kind PLAN の前段) |

**`failure_pattern` Issue 運用フロー**(v2.1 明文化): qa が **月次でレビュー**、有用なものは `docs/perspectives/<topic>.md` へ昇格(運用ルール書 §3.5 観点リスト育成プロセス)。

## 9.5 CODEOWNERS = 人間承認境界

`.github/CODEOWNERS`:

```
# 全体
* @<tl-handle> @<qa-handle>

# 設計 doc(tl 主導)
/docs/design/                    @<tl-handle>
/docs/adr/                       @<tl-handle>

# テスト設計(qa 主導)
/docs/test-design/               @<qa-handle> @<tl-handle>

# 観点リスト(qa 主導)
/docs/perspectives/              @<qa-handle>

# postmortem(qa 主導)
/docs/postmortems/               @<qa-handle> @<tl-handle>

# ハーネス本体(tl 主導)
/scripts/                        @<tl-handle>
/.github/workflows/              @<tl-handle>
/harness/                        @<tl-handle>
/workflows/                      @<tl-handle>

# governance docs(po + tl + qa 三者)
/docs/governance/                @<po-handle> @<tl-handle> @<qa-handle>

# Reverse R3 Intent(po が R3 検証で touch)
/docs/reverse/*/R3-intent.md     @<po-handle> @<tl-handle>
```

**bootstrap 時の特例**: TL/QA がまだ採用されていない段階では `* @<owner>` 単独で初期化し、採用後に置換する(§14.1)。

## 9.6 commitlint + .pre-commit-config.yaml(v2.1 完全実装サンプル)

### commitlint.config.js

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'test', 'chore', 'perf', 'ci', 'security'
    ]],
    // v2.1: scope は warning レベル(docs/chore で省略許可)
    'scope-empty': [1, 'never'],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
    'header-max-length': [2, 'always', 100],
  }
};
```

### .pre-commit-config.yaml(v2.1 完全サンプル)

```yaml
repos:
  # Secret 検出
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.0
    hooks:
      - id: gitleaks

  # Conventional Commits
  - repo: https://github.com/alessandrojcm/commitlint-pre-commit-hook
    rev: v9.21.0
    hooks:
      - id: commitlint
        stages: [commit-msg]
        additional_dependencies: ['@commitlint/config-conventional']

  # 汎用 cleanup
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-merge-conflict
      - id: detect-private-key

  # ローカル: UT-TDD-agent-harness 固有検証
  - repo: local
    hooks:
      - id: ut-tdd-plan-lint
        name: ut-tdd plan lint
        entry: bash scripts/ut-tdd-plan-lint.sh
        language: system
        pass_filenames: false
        stages: [pre-push]

      - id: vmodel-lint
        name: V-model 4 artifact lint
        entry: bash scripts/vmodel_lint.sh
        language: system
        pass_filenames: false
        stages: [pre-push]

      - id: session-end-check
        name: session 終了前 4 項目
        entry: bash scripts/session-end-check.sh
        language: system
        pass_filenames: false
        stages: [pre-push]
```

### commitlint workflow(独立)

`.github/workflows/commitlint.yml`:

```yaml
name: Commit Lint
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @commitlint/cli @commitlint/config-conventional
      - run: npx commitlint --from=${{ github.event.pull_request.base.sha || 'HEAD~1' }} --to=HEAD --verbose
```

これにより commit log から `type / scope / PLAN-id` を機械抽出可能になる。

## 9.7 Protected Branch + Required Status Checks(v2.1: 実 job id と完全一致)

`main` に対して以下を必須化:

- Require a pull request before merging: **ON**
- Require approvals: **1**(bootstrap 時は 0、TL/QA 採用後 1 へ昇格)
- Require status checks to pass before merging: **ON**
  - **必須 status check の id**(`<job-id>` 形式):
    - `feature-lint`(`feature.yml`)
    - `feature-test`(`feature.yml`)
    - `feature-vmodel-check`(`feature.yml`)
    - `feature-branch-kind-check`(`feature.yml`)
    - `commitlint`(`commitlint.yml`)
    - `harness-check`(`harness-check.yml`)
  - ※ branch type 別に異なる workflow が走るため、Branch Protection は **複数 workflow の status check を OR 条件で扱える GitHub 標準動作** に従う(該当 workflow が走らない場合の必須要件は GitHub が自動で skip 判定)
- Require conversation resolution before merging: **ON**
- Do not allow bypassing the above: **ON**
- Restrict who can push to matching branches: **(空 = 誰も直接 push 不可)**

`scripts/setup-branch-protection.sh`(`gh` CLI 経由)で bootstrap 時に自動設定:

```bash
#!/usr/bin/env bash
set -euo pipefail
REPO="${1:?usage: setup-branch-protection.sh <owner/repo>}"

gh api -X PUT "repos/$REPO/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks.strict=true \
  -f 'required_status_checks.contexts[]=feature-lint' \
  -f 'required_status_checks.contexts[]=feature-test' \
  -f 'required_status_checks.contexts[]=feature-vmodel-check' \
  -f 'required_status_checks.contexts[]=feature-branch-kind-check' \
  -f 'required_status_checks.contexts[]=commitlint' \
  -f 'required_status_checks.contexts[]=harness-check' \
  -F enforce_admins=true \
  -F required_pull_request_reviews.required_approving_review_count=0 \
  -F restrictions=null
```

# §10 補助 3: 3 層抽象化(設計仕様書、v2.1 で interpreter 不要を明記)

**v2.1 重要事項**: `workflows/*.yaml` / `harness/*.yaml` は **人間とAIが参照する設計仕様書** であり、**実行する interpreter は導入しない**。エスカレーション判定は `scripts/check-escalation-stale.sh` + JSONL `failure_log.jsonl` で実現する(§10.5-10.7)。これにより外部依存(Temporal/Prefect 等)を避け、軽量実装を保つ。

## 10.1 3 層の役割分担

```
[層 1] スキル層(docs/skills/*.md)
  ← 「何をすべきか」の知識(個別技術 / 観点リスト)
         ↓ 組み合わせ定義(設計参照のみ)
[層 2] ワークフロー層(workflows/*.yaml)
  ← スキル呼び出し順序の DAG 定義(設計仕様書、人間と AI が参照)
         ↓ 設計参照
[層 3] ハーネス層(harness/*.yaml)
  ← ワークフロー自動実行条件 + ゲート発火 + レビュー注入強度(設計仕様書)
```

## 10.2 層 2: workflows/*.yaml(設計仕様書)

L4 Sprint 標準 8 ステップの例:

```yaml
workflow_id: l4-sprint-standard
version: "1.0"
description: "L4 Sprint 標準 8 ステップ(設計仕様書、AI 参照用)"
drive: [be, fe, fullstack]

steps:
  - id: step-1-entry
    description: "Entry 条件確認"
    on_failure:
      action: escalate
      escalation_target: tl

  - id: step-3-impl
    description: "実装(Codex 委譲 or Claude 直接)"
    depends_on: [step-2-pre-impl]
    on_failure:
      action: retry
      max_retries: 2
      on_max_retries: escalate

  - id: step-4-machine-check
    description: "機械チェック(lint / 型 / vmodel_lint)— mandatory"
    depends_on: [step-3-impl]
    mandatory: true
    on_failure:
      action: escalate
      escalation_target: tl

  # ... 以下省略
```

**実行**: AI(Claude Code / Codex)が PLAN 起票時に本 YAML を読み、step 順序と on_failure 規約を **自然言語指示として** 適用する。専用 interpreter は無い。

## 10.3 層 3: harness/*.yaml(設計仕様書)

G4 実装凍結ゲートの例:

```yaml
harness_id: g4-gate-harness
version: "1.0"
description: "G4 実装凍結ゲート(設計仕様書)"
workflow: l4-sprint-standard

gates:
  - id: gate-vmodel-4artifact
    condition: "vmodel_lint.result == 'pass'"
    action: continue
    on_fail: reject

  - id: gate-test-coverage
    condition: "step-5-test.result == 'pass' AND coverage >= 80"
    action: continue
    on_fail: reject

reviewer_type_matrix:
  L0: agent
  L1: aim
  L2: council
  L3: human
```

**実行**: `ut-tdd gate G4`(§12)が `vmodel_lint` の結果 + カバレッジを取得し、本 YAML の `condition` を **設計参照しつつ bash で実装** する。`condition` 文字列の式言語パーサは導入しない。

## 10.4 エスカレーション L0-L3

```
[L0] Normal     初期状態 / 正常動作
[L1] Elevated   同種失敗 N ≥ 3 回 OR 再失敗 M ≥ 1 回
[L2] Council    同種失敗 N ≥ 7 回 OR 再失敗 M ≥ 3 回
[L3] Human      同種失敗 N ≥ 15 回 OR 再失敗 M ≥ 7 回
```

| Level | reviewer | 動作 |
|---|---|---|
| L0 | agent | AI レビューのみ |
| L1 | aim | AI実装・保守の人間レビュー追加 |
| L2 | council | tl + qa + aim 3 者会議 |
| L3 | human | po 直接通知 + 作業一時停止 |

## 10.5 昇格判定フロー(bash 実装、interpreter なし)

```
scripts/log-failure.sh が failure_log.jsonl に append
  ↓
scripts/check-escalation-level.sh が plan_id + failure_type を集計
  → 同種失敗 N >= 閾値 or 再失敗 M >= 閾値 なら current_level +1
  ↓
ut-tdd doctor が check-escalation-level を呼び、結果を表示
  ↓
review_inject 発火は GitHub Actions に CODEOWNERS mention 追加で実現
```

## 10.6 降格判定(`scripts/check-escalation-stale.sh`)

```
定期実行(GitHub Actions schedule: weekly)
  ↓
plan_id × failure_type ごとに確認:
  違反検出ゼロ 90 日継続 → current_level -1(降格推奨表示のみ、自動降格しない)
  未使用 30 日 → warning
  未使用 90 日 → archive 候補(human 確認後に非アクティブ化)
```

降格 / archive は **human(po または tl)確認後にのみ実行**。`check-escalation-stale.sh` は候補表示のみ。

## 10.7 失敗ログ(.ut-tdd/audit/failure_log.jsonl、v2.1 concurrency 対策)

CI / hook が記録。v2.1 で **書き込み主体を明確化**:

- **ローカル pre-push hook からのみ書き込み**(`scripts/log-failure.sh`)
- **CI からは書き込まない**(代わりに GitHub Actions の job summary に出力、artifact として upload)
- ローカル書き込みは **個人作業中の単一プロセス前提**(競合は実用上発生しない)

```jsonl
{"timestamp":"2026-05-20T10:00:00Z","plan_id":"PLAN-042","failure_type":"vmodel_lint_p0","context":"L3.5 pair freeze missing","level_before":"L0","level_after":"L1"}
{"timestamp":"2026-05-20T11:30:00Z","plan_id":"PLAN-042","failure_type":"vmodel_lint_p0","context":"single trace direction missing","level_before":"L1","level_after":"L1"}
```

**git 管理方針**: `failure_log.jsonl` は **git 管理対象**(チーム共有の audit trail)。`.ut-tdd/cache/` のみ `.gitignore`。

# §11 補助 4: チーム責任二極化

構想書 v1.1 §2.3 の 5 役割を、本ハーネスの全要素にマッピングする。

## 11.1 5 役割の責任マトリクス

| 役割 | 略号 | 上流 / 下流 | 主責任 |
|---|---|---|---|
| **発注元** | po | (両端)| WHY / WHAT / 受入基準 / R3 Intent 検証 / リリース承認 |
| **TL**(技術責任者)| tl | **上流** | 仕様化 / アーキ / G1-G3 ゲート / adversarial review / ハーネス設計 |
| **QA**(品質責任者)| qa | **下流** | テスト戦略 / G4-G6 ゲート / インシデント指揮 / 観点リスト整備 / **failure_pattern Issue 月次レビュー** |
| **AI実装・保守** | aim | (中間)| AI 指示 / アラート対応 / エスカレーション初動 / 4 段レビュー Layer 2 |
| **UI/UX デザイン** | uiux | (横断)| Figma / モック / state-events / L5 Visual Refinement |

## 11.2 役割 × 経路マトリクス

| | 経路 1 Forward | 経路 2 Scrum×Reverse | 経路 3 add-* | 補助 1 緊急 |
|---|---|---|---|---|
| **po** | L1 受入条件 / G1 / L8 受入 | **R3 Intent 検証** | (通常は不要)| P0/P1 で連絡 |
| **tl** | L2-L3.5 設計 / G2-G3 | S4 decide / R1-R2 / R4 routing | 既存 doc 整合判断 | 技術対応指揮 |
| **qa** | G4-G6 / L6 統合検証 | (通常は L6 で合流)| 回帰確認 | インシデント指揮 |
| **aim** | L4 実装委譲 / 4 段 Layer 2 | S0-S3 PoC 実装 / R0 証拠 | 既存テスト維持確認 | 初動アラート対応 |
| **uiux** | L3 UI 設計 / L5 Refinement | UX-spike PoC | 既存 UX との整合 | (通常は不要)|

## 11.3 PR レビュー 4 段階

運用ルール書 §2.4 を実装:

| Layer | レビュアー | 観点 | 応答目安 |
|---|---|---|---|
| **Layer 1** | AI(自動)| コード規約 / 明らかなバグ / 典型的脆弱性 | PR 作成直後 |
| **Layer 2** | aim | テスト不足 / 観点漏れ / 運用影響 / vmodel 整合 | 1 営業日以内 |
| **Layer 3** | tl(必要時)| アーキ判断 / 技術選定の妥当性 / 大規模変更影響 | 1 営業日以内 |
| **Layer 4** | qa(リリース前)| 品質ゲート観点 / E2E / 運用観点 / G6 判定 | リリース前 |

CODEOWNERS で Layer 3 / Layer 4 が **自動アサイン** される。

## 11.4 インシデントエスカレーション

```
発見
  ↓
#incident チャンネル投稿(誰でも、状況 + 影響 + タイムスタンプ)
  ↓
[aim 初動]      影響範囲確認 / 緊急度 P0-P3 判定
  ↓
[qa 指揮]      対応方針 / 関係者招集
  ↓
[tl 技術]      原因切り分け / 修正方針 / hotfix ブランチ作成
  ↓
[該当者]      修正実施(または se 委譲)
  ↓
[po]           顧客対応判断(必要時)
  ↓
収束 → postmortem(48h 以内、P0/P1 必須)
  ↓
[全員]        再発防止策を観点リスト / AGENTS.md / CI に反映
```

## 11.5 役割不在時の代行

| 不在 | 代行 |
|---|---|
| tl | qa が技術判断も代行(慎重に)|
| qa | aim が初動、リリースは保留 |
| po | 顧客影響を判断、不可逆な変更は保留 |
| 全員(深夜等)| 影響軽微なら翌朝、重大なら誰かに連絡 |

# §12 機械検証(CI fail-close)

## 12.1 ut-tdd CLI 統一(v2.1 確定)

**`ut-tdd` CLI はシェルラッパー方式**(`scripts/ut-tdd` ディスパッチャ)。bootstrap 時に `PATH` に `<repo-root>/scripts` を追加する(`scripts/install-hooks.sh` で `.bashrc` / `.zshrc` への追記を案内)。

### scripts/ut-tdd(ディスパッチャ)

```bash
#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SUB="${1:-help}"; shift || true

case "$SUB" in
  plan)
    SUBSUB="${1:-help}"; shift || true
    case "$SUBSUB" in
      lint)     exec bash "$DIR/ut-tdd-plan-lint.sh" "$@" ;;
      create)   exec bash "$DIR/ut-tdd-plan-create.sh" "$@" ;;
      validate) exec bash "$DIR/ut-tdd-plan-lint.sh" "$@" ;;  # alias
      *)        echo "usage: ut-tdd plan {lint|create|validate}"; exit 1 ;;
    esac ;;
  scrum)   exec bash "$DIR/ut-tdd-scrum.sh" "$@" ;;
  reverse) exec bash "$DIR/ut-tdd-reverse.sh" "$@" ;;
  doctor)  exec bash "$DIR/ut-tdd-doctor.sh" "$@" ;;
  gate)    exec bash "$DIR/ut-tdd-gate.sh" "$@" ;;
  help|*)
    cat <<EOF
ut-tdd: チーム開発 AI ハーネス CLI
  ut-tdd plan {lint|create|validate}
  ut-tdd scrum {init|backlog|plan|poc|verify|decide}
  ut-tdd reverse {init|from-scrum} [--reverse-type <type>]
  ut-tdd doctor
  ut-tdd gate <G1-G11>
EOF
    [ "$SUB" = "help" ] && exit 0 || exit 1 ;;
esac
```

### subcommand 完全一覧

| CLI | 役割 | 委譲先スクリプト |
|---|---|---|
| `ut-tdd plan lint` | PLAN frontmatter 検証(§12.2 詳細)| `scripts/ut-tdd-plan-lint.sh` |
| `ut-tdd plan create --kind <kind>` | PLAN テンプレートから新規作成 | `scripts/ut-tdd-plan-create.sh` |
| `ut-tdd plan validate` | `ut-tdd plan lint` のエイリアス | 同上 |
| `ut-tdd scrum init --scrum-type <type>` | Scrum モード初期化 | `scripts/ut-tdd-scrum.sh` |
| `ut-tdd scrum backlog add --hypothesis <id> --title <t>` | 仮説追加 | 同上 |
| `ut-tdd scrum plan` | Sprint Plan | 同上 |
| `ut-tdd scrum poc --hypothesis <id>` | PoC 実装着手 | 同上 |
| `ut-tdd scrum verify` | 全 verify/*.sh 実行 | 同上 |
| `ut-tdd scrum decide --confirmed --reverse-merge` | S4 decide + Reverse 自動 routing | 同上 |
| `ut-tdd reverse <type> --from-scrum --scrum-hypothesis <id>` | Reverse R0 初期化 | `scripts/ut-tdd-reverse.sh` |
| `ut-tdd doctor` | 統合検証(§12.3)| `scripts/ut-tdd-doctor.sh` |
| `ut-tdd gate <G番号>` | ゲート判定(§5.3)| `scripts/ut-tdd-gate.sh` |

## 12.2 ut-tdd plan lint(frontmatter 検証、nullglob + 排他制約)

`scripts/ut-tdd-plan-lint.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob
PY="$(scripts/lib/python_cmd.sh)"

PLANS=(docs/plans/PLAN-*.md)
if [ ${#PLANS[@]} -eq 0 ]; then
  echo "[ut-tdd-plan-lint] PLAN ファイル無し、PASS"
  exit 0
fi

for plan in "${PLANS[@]}"; do
  $PY scripts/lib/plan_validator.py "$plan" || exit 1
done
```

`scripts/lib/plan_validator.py` の検証項目(v2.1 完全版):

1. **plan_id 形式**: `PLAN-\d{3}(-[a-z0-9-]+)?` または `PLAN-MM-\d{3}`(MM = Master Plan)
2. **必須 9 フィールド存在**
3. **kind enum 準拠**(VALID_KINDS 11 種)
4. **layer enum 準拠**(VALID_LAYERS 15 種)
5. **drive enum 準拠**(VALID_DRIVES 9 種)
6. **workflow_phase enum 準拠**(VALID_WORKFLOW_PHASES 10 種、使用時)
7. **agent_slots[].role enum 準拠**
8. **generates[].artifact_type enum 準拠**(VALID_ARTIFACT_TYPES 18 種、v2.1 で `test_design` `test_code` 追加)
9. **reciprocal dependency**: `requires` の相手 PLAN が `blocks` で逆参照
10. **add-* 整合**: `kind: add-*` の場合、`requires` に追補対象 PLAN が必須
11. **recovery 整合**: `kind: recovery` の場合、§1-§7 の 7 セクション存在
12. **layer × workflow_phase 排他**(v2.1 新規):
    - `kind in [poc, reverse]` → `workflow_phase` 必須、`layer == 'cross'`
    - `kind not in [poc, reverse]` → `layer` 必須、`workflow_phase` 禁止

## 12.3 ut-tdd doctor(統合検証、harness-check.yml 集約)

`scripts/ut-tdd-doctor.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

echo "=== ut-tdd doctor ==="

# 1. plan lint(§12.2)
bash scripts/ut-tdd-plan-lint.sh

# 2. vmodel lint(§4.7)
bash scripts/vmodel_lint.sh

# 3. governance 3 doc 揃い
for d in team-charter operations harness-blueprint; do
  test -f "docs/governance/${d}.md" || { echo "FAIL: docs/governance/${d}.md missing"; exit 1; }
done

# 4. 経路 2 整合(scrum_reverse matrix、§6.8)
bash scripts/scrum_reverse_lint.sh

# 5. recovery PLAN freshness(session 終了前 4 項目、read-only モード)
bash scripts/session-end-check.sh --read-only

# 6. escalation stale check(降格候補表示のみ)
bash scripts/check-escalation-stale.sh --warning-only

# 7. branch-kind-check(現ブランチに対して)
bash scripts/branch-kind-check.sh || echo "WARN: branch-kind-check failed (continuing)"

echo "=== ut-tdd doctor PASS ==="
```

## 12.4 harness-check.yml(CI で fail-close、actions/cache + branch-kind-check)

`.github/workflows/harness-check.yml`:

```yaml
name: Harness Check
on:
  pull_request:
    branches: [main]

jobs:
  harness-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip

      - uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('scripts/requirements.txt') }}

      - name: Install Python deps
        run: pip install -r scripts/requirements.txt

      - name: ut-tdd doctor
        run: bash scripts/ut-tdd-doctor.sh

      - name: PR checkbox check
        env:
          PR_BODY: ${{ github.event.pull_request.body }}
        run: bash scripts/pr-checkbox-check.sh
```

**v2.1 変更**:
- `feature.yml` の `ut-tdd-doctor` job を削除し本 workflow に集約(重複排除)
- `actions/cache@v4` で pip cache 共有(GHA 分削減)
- `scripts/requirements.txt` で `pyyaml>=6.0,<7.0` を version pinning

## 12.5 ローカル先行検証(pre-push hook、v2.1: 軽量チェックのみ)

`scripts/install-hooks.sh` が `.pre-commit-config.yaml` 経由で pre-push hook を設定(§9.6 参照)。

pre-push hook は **fail-fast 用の軽量チェック** に限定(数秒以内):

| 実行内容 | 時間目安 | 重い処理? |
|---|---|---|
| `ut-tdd-plan-lint`(frontmatter 検証)| < 1 秒 | × |
| `vmodel_lint`(双方向 trace 検証)| 1〜2 秒 | × |
| `session-end-check`(4 項目)| < 1 秒 | × |
| (フルテスト・SAST・SCA は実行しない)| — | — |

これにより開発者が `--no-verify` でバイパスする動機を抑制する。

## 12.6 CI コスト最適化(v2.1: 案 B 確定の構造)

| イベント | 実行内容 | 時間目安 |
|---|---|---|
| **ローカル pre-push** | 軽量チェック(plan lint + vmodel + session-end)| 数秒 |
| **PR push 時 CI** | 軽量チェック(harness-check + branch workflow の lint/test/vmodel-check)| 約 1-2 分 |
| **main merge 時 CI** | **フルテスト + SAST + SCA + カバレッジ**(真実源)| 数分 |

PR 時にフルテストを走らせない設計により、月の GHA 分数を 60-80% 削減見込み。main merge 時の独立検証が main の品質を保証する。

## 12.7 scripts/requirements.txt(v2.1 新規)

```
pyyaml>=6.0,<7.0
```

`scripts/lib/python_cmd.sh`(v2.1):

```bash
#!/usr/bin/env bash
# Python 3 の実行コマンドを解決して echo
for cmd in python3 "py -3" python; do
  if eval "$cmd --version" >/dev/null 2>&1; then
    eval "$cmd -c 'import sys; sys.exit(0 if sys.version_info[0]>=3 else 1)'" >/dev/null 2>&1 && {
      echo "$cmd"
      exit 0
    }
  fi
done
echo "[error] Python 3 not found. Install Python 3.11+." >&2
exit 1
```

# §13 リポジトリ構造

```
<project-root>/
├── README.md                                  # プロジェクト概要
├── CLAUDE.md                                  # Claude Code 用指示(薄、AGENTS.md を読めと書く)
├── AGENTS.md                                  # AI エージェント共通指示
├── SECURITY.md                                # 脆弱性報告窓口
├── CONTRIBUTING.md                            # 貢献ガイド
├── CHANGELOG.md                               # 変更履歴(SemVer)
│
├── .gitignore                                 # 除外(.ut-tdd/cache/ 等)
├── .gitattributes                             # 改行コード統一(* text=auto eol=lf)
├── .pre-commit-config.yaml                    # §9.6 完全実装サンプル準拠
├── commitlint.config.js                       # §9.6
│
├── docs/
│   ├── governance/
│   │   ├── team-charter.md                    # ← 構想書 v1.1
│   │   ├── operations.md                      # ← 運用ルール書 v1.1
│   │   └── harness-blueprint.md               # ← 本書 v2.1
│   │
│   ├── plans/                                 # PLAN doc(§3 frontmatter 準拠)
│   │   └── PLAN-NNN-<slug>.md
│   │
│   ├── adr/
│   │   ├── README.md
│   │   └── ADR-NNN-<slug>.md
│   │
│   ├── design/                                # ① 設計 artifact(§4.1)
│   │   ├── L1-requirements.md
│   │   ├── L2-master.md
│   │   ├── L3-D-API.md
│   │   └── L3.5-<feature>.md
│   │
│   ├── test-design/                           # ③ テスト設計 artifact(§4.1)
│   │   ├── L1-acceptance-test-design.md
│   │   ├── L2-system-test-design.md
│   │   ├── L3-integration-test-design.md
│   │   ├── L3.5-<feature>-unit-test-design.md
│   │   └── L6-qa-additional-test-design.md
│   │
│   ├── perspectives/                          # 観点リスト(運用ルール書 §3.5)
│   │   ├── general.md
│   │   └── <topic>.md
│   │
│   ├── postmortems/
│   │   ├── TEMPLATE.md
│   │   └── <date>-<id>.md
│   │
│   ├── scrum/
│   │   └── backlog.yaml
│   │
│   ├── reverse/
│   │   └── <hypothesis-id>/
│   │       ├── R0-evidence/
│   │       ├── R1-contracts.md
│   │       ├── R2-as-is-design.md
│   │       ├── R3-intent.md
│   │       └── R4-gap.md
│   │
│   ├── skills/
│   │   └── <category>/<skill-name>/SKILL.md
│   │
│   ├── ARCHITECTURE.md
│   ├── RUNBOOK.md
│   └── INCIDENT_RESPONSE.md
│
├── workflows/                                 # 補助 3 層 2(設計仕様書、interpreter なし)
│   ├── l4-sprint-workflow.yaml
│   ├── reverse-r0-r4-workflow.yaml
│   └── escalation-review-workflow.yaml
│
├── harness/                                   # 補助 3 層 3(設計仕様書、interpreter なし)
│   ├── g2-gate-harness.yaml
│   ├── g3-gate-harness.yaml
│   ├── g4-gate-harness.yaml
│   └── escalation-harness.yaml
│
├── scripts/                                   # 言語非依存ラッパー + 検証
│   ├── ut-tdd                                 # ディスパッチャ(§12.1)
│   ├── ut-tdd-plan-lint.sh
│   ├── ut-tdd-plan-create.sh
│   ├── ut-tdd-scrum.sh
│   ├── ut-tdd-reverse.sh
│   ├── ut-tdd-doctor.sh
│   ├── ut-tdd-gate.sh
│   ├── vmodel_lint.sh                         # § 4.7 Python wrapper
│   ├── scrum_reverse_lint.sh                  # §6.8
│   ├── session-end-check.sh                   # §8.2
│   ├── check-escalation-stale.sh              # §10.6
│   ├── check-escalation-level.sh              # §10.5
│   ├── log-failure.sh                         # §10.5/10.7
│   ├── regression-check.sh                    # §7.4
│   ├── recovery-plan-check.sh                 # 補助 1
│   ├── branch-kind-check.sh                   # §9.1
│   ├── pr-checkbox-check.sh                   # §9.3
│   ├── setup-branch-protection.sh             # §9.7
│   ├── install-hooks.sh                       # §14
│   ├── test.sh                                # 言語別実装(初期は exit 0 スタブ)
│   ├── lint.sh                                # 言語別実装(初期は exit 0 スタブ)
│   ├── benchmark.sh                           # 言語別実装(任意)
│   ├── requirements.txt                       # pyyaml>=6.0,<7.0(§12.7)
│   └── lib/
│       ├── plan_validator.py
│       ├── vmodel_validator.py
│       ├── scrum_reverse_validator.py
│       ├── branch_kind_checker.py
│       ├── session_end_checker.py
│       ├── regression_checker.py
│       ├── python_cmd.sh
│       └── common.sh
│
├── verify/                                    # 経路 2 Scrum verify(exit 1 path 必須)
│   ├── <hypothesis-id>.sh
│   └── ...
│
├── src/                                       # ② 実装コード(言語別)
├── tests/                                     # ④ テストコード(言語別)
│
├── .github/
│   ├── pull_request_template.md               # §9.3
│   ├── CODEOWNERS                             # §9.5
│   ├── dependabot.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   ├── failure_pattern.md
│   │   └── design_proposal.md
│   └── workflows/
│       ├── feature.yml                        # §9.2.1
│       ├── poc.yml                            # §9.2.2
│       ├── refactor.yml                       # §9.2.3
│       ├── hotfix.yml                         # §9.2.4
│       ├── commitlint.yml                     # §9.6
│       └── harness-check.yml                  # §12.4
│
└── .ut-tdd/                                   # ハーネス状態(audit は git 管理、cache は gitignore)
    ├── VERSION
    ├── audit/
    │   ├── failure_log.jsonl                  # §10.7、git 管理対象
    │   └── deferred-findings.yaml             # carry note、git 管理対象
    └── cache/                                 # .gitignore 対象
```

# §14 Phase 0 実装指示

## 14.1 Bootstrap 2 段階(CODEOWNERS デッドロック回避)

### Phase 0-A: ローカル生成

**順序を再整理(v2.1: シークレット保護を最初に)**:

1. **`.pre-commit-config.yaml` を最初に配置 + gitleaks インストール**(secret 流入 0 から保護)
2. リポジトリ root ファイル
   - `README.md` / `CLAUDE.md` / `AGENTS.md` / `SECURITY.md` / `CONTRIBUTING.md` / `CHANGELOG.md`
   - `.gitignore` / `.gitattributes` / `commitlint.config.js`
3. `docs/governance/` 3 点配置
4. `docs/` 配下のディレクトリ + 雛形(adr/README.md / design/ / test-design/ / perspectives/general.md / postmortems/TEMPLATE.md / skills/ / ARCHITECTURE.md / RUNBOOK.md / INCIDENT_RESPONSE.md)
5. `scripts/` 配下のスクリプト群(§13 全件)+ `scripts/requirements.txt`
6. `.github/` 配下(pull_request_template / CODEOWNERS / dependabot.yml / ISSUE_TEMPLATE/ / workflows/)
7. `workflows/` + `harness/` 配下に YAML 配置(設計仕様書、§10)
8. `.ut-tdd/` 配下初期化(`VERSION: 2.1.0` / `audit/failure_log.jsonl` 空 / `audit/deferred-findings.yaml` 空)
9. **実行権限付与**(macOS/Linux: `chmod +x scripts/*.sh scripts/ut-tdd`、**Windows: `git update-index --chmod=+x scripts/*.sh scripts/ut-tdd`** を `install-hooks.sh` で実行)
10. `bash scripts/install-hooks.sh` 実行(Python 依存 + pre-commit + 実行権限)
11. `ut-tdd doctor` 実行(全項目 PASS 確認)

### Phase 0-B: GitHub 反映

12. **初回コミットを main に直接 push**(`feat: UT-TDD-agent-harness 初期化 (bootstrap)`)
    - bootstrap は運用ルール書 §1.1 原則 5「1 PR = 1 変更目的」の例外
    - `CHANGELOG.md` と PR 説明欄に明記
13. **Branch Protection 設定**(`bash scripts/setup-branch-protection.sh <owner/repo>`)
    - Required Status Checks は §9.7 の 6 件(`feature-lint`, `feature-test`, `feature-vmodel-check`, `feature-branch-kind-check`, `commitlint`, `harness-check`)
    - **Approvals 数は初期 0** — README に「**Approvals 0 期間中は CI Status Checks が唯一の砦**」と明示。TL/QA 採用後に 1 へ昇格
14. 以降は通常運用(運用ルール書 §2.4 に従い、すべての変更を PR 経由)

## 14.2 install-hooks.sh の責務(v2.1 完全実装)

```bash
#!/usr/bin/env bash
set -euo pipefail
source scripts/lib/common.sh
PY="$(bash scripts/lib/python_cmd.sh)"

log_info "Python 依存をインストール中..."
$PY -m pip install -r scripts/requirements.txt
$PY -m pip install pre-commit

log_info "pre-commit hook をインストール中..."
pre-commit install
pre-commit install --hook-type pre-push
pre-commit install --hook-type commit-msg

log_info "実行権限を付与中..."
if [ "${OS:-}" = "Windows_NT" ] || [ "${OSTYPE:-}" = "msys" ] || [ "${OSTYPE:-}" = "cygwin" ]; then
  log_info "Windows 環境: git update-index --chmod=+x で executable bit 設定"
  for f in scripts/ut-tdd scripts/*.sh scripts/lib/python_cmd.sh; do
    [ -f "$f" ] && git update-index --chmod=+x "$f" 2>/dev/null || true
  done
else
  chmod +x scripts/ut-tdd scripts/*.sh scripts/lib/python_cmd.sh
fi

log_info "PATH 追加案内:"
cat <<EOF
以下を ~/.bashrc または ~/.zshrc に追加してください:

  export PATH="$(pwd)/scripts:\$PATH"

これにより 'ut-tdd doctor' などのコマンドが利用可能になります。
Windows ネイティブの場合、WSL2 を必須とします。WSL2 内で上記設定を行ってください。
EOF

log_ok "Hooks installed"
```

## 14.3 生成ファイル一覧(優先度付き)

| ファイル | 優先度 | 役割 |
|---|---|---|
| `.pre-commit-config.yaml` | **★★★ 最優先**(secret 保護)| §9.6 |
| `docs/governance/harness-blueprint.md` | ★★★ | 本書 |
| `docs/governance/team-charter.md` | ★★★ | 構想書 v1.1 |
| `docs/governance/operations.md` | ★★★ | 運用ルール書 v1.1 |
| `AGENTS.md` / `CLAUDE.md` | ★★★ | AI 共通指示 |
| `README.md` / `SECURITY.md` | ★★★ | リポ標準 |
| `scripts/ut-tdd` + `scripts/*.sh`(全件)| ★★★ | CLI + 機械検証 |
| `scripts/lib/*.py`(plan/vmodel/scrum_reverse/branch_kind/session_end validator)| ★★★ | 検証本体 |
| `scripts/requirements.txt` | ★★★ | Python 依存 pinning |
| `.github/workflows/*.yml`(6 本)| ★★★ | CI |
| `.github/CODEOWNERS` / `pull_request_template.md` | ★★★ | GitHub 統制 |
| `commitlint.config.js` | ★★★ | commit 規約 |
| `workflows/` + `harness/` YAML(設計仕様書)| ★★☆ | 3 層抽象化 |
| `docs/skills/` 雛形 | ★★☆ | 観点リスト系 |
| `docs/perspectives/general.md` | ★★☆ | 観点リスト初期値 |
| `docs/postmortems/TEMPLATE.md` | ★★☆ | インシデント雛形 |
| `CONTRIBUTING.md` / `CHANGELOG.md` | ★★☆ | 補助 |

## 14.4 検証(最終確認)

bootstrap 完了後、以下を確認:

- [ ] `ut-tdd doctor` が PASS
- [ ] `ut-tdd plan lint`(PLAN ファイルが無くても PASS、`shopt -s nullglob` で空配列を許容)
- [ ] `pre-commit run --all-files` が PASS
- [ ] `git push` 時に pre-push hook が動作(意図的に失敗させて確認)
- [ ] GitHub Actions の `harness-check.yml` が緑になる
- [ ] Branch Protection が `gh api repos/<org>/<repo>/branches/main/protection` で確認できる
- [ ] Windows(WSL2)から `bash scripts/ut-tdd-doctor.sh` が動作する

# §15 用語集

| 用語 | 定義 |
|---|---|
| **ハーネス** | AI エージェントを安全に動かす土台(構想書 v1.1 用語集) |
| **3 経路** | V-model Forward / Scrum × Reverse / add-* の実装経路 3 種 |
| **4 補助軸** | recovery / GitHub 統制 / 3 層抽象化(設計仕様書)/ チーム責任二極化 |
| **V-model 4 artifact** | ① 設計 / ② 実装コード / ③ テスト設計 / ④ テストコード の 4 文書 |
| **Pair freeze** | 設計 artifact 凍結時にテスト設計 artifact も同時凍結するルール |
| **双方向 trace** | 4 artifact 間で 6 方向の reference を相互に持つこと |
| **逆ピラミッド** | ① ② が存在するが ③ ④ が無い / 不完全な状態 |
| **Scrum 6 type** | hypothesis-test / tech-spike / design-spike / perf-spike / security-spike / ux-spike |
| **Reverse 5 type** | code / design / upgrade / normalization / fullback |
| **30 cell matrix** | Scrum 6 type × Reverse 5 type の自動 routing 表 |
| **R3 Intent 検証** | 発注元(po)が Reverse R3 で意図仮説を直接検証するステップ |
| **PLAN** | 工程ルール doc。frontmatter 9 必須フィールド + 本文 §0-5 |
| **PLAN-MM-NNN** | Master Plan。複数子 PLAN を親 hub として束ねる設計プラン |
| **kind** | PLAN の種別(11 種、§3.2)|
| **layer** | V-model フェーズ識別子(15 種、§3.3)|
| **drive** | 駆動タイプ(9 種、§3.4)|
| **workflow_phase** | Scrum / Reverse 専用フェーズ識別子(S0-S4 + R0-R4)|
| **artifact_type** | 成果物種別(18 種、§3.6、v2.1 で test_design/test_code 分離)|
| **agent_slots** | PLAN で割り当てる役割スロット(po / tl / qa / aim / uiux / se / docs)|
| **3 層抽象化** | スキル / ワークフロー / ハーネスの YAML 階層(v2.1: **設計仕様書**として位置付け、interpreter 不要)|
| **エスカレーション L0-L3** | reviewer 自動切替レベル(agent / aim / council / human)|
| **recovery kind** | session 断絶・認識ずれからの再開のための PLAN 種別 |
| **session 終了前 4 項目** | commit/push 前の必須チェック |
| **CODEOWNERS** | GitHub ファイル領域 × レビュアー責任マトリクス |
| **Conventional Commits** | コミットメッセージ規約 |
| **vmodel_lint** | 4 artifact 揃い + 双方向 trace 6 方向を検証する CLI(Python 実装)|
| **ut-tdd doctor** | 統合検証 CLI(plan lint + vmodel + governance + scrum/reverse + recovery 等)|
| **branch-kind-check** | ブランチ prefix と PLAN kind の整合性検証(v2.1)|

# §16 参考文献

## 内部参考(`docs/governance/` 配下)

- `team-charter.md`(AI 駆動開発チーム構想書 v1.1)
- `operations.md`(AI 駆動開発チーム運用ルール書 v1.1)

## 業界 standard

### V-model + 4 artifact 双方向 trace

- NASA SW Engineering Handbook Appendix(V&V 構造)
- IEEE Wikipedia: V-model (software development)
- DO-178C 開発ライフサイクル仕様
- Parasoft: ISO 26262 Requirements Traceability
- CMMI v2.0 SP 1.4 Requirements Management
- IEEE 829-2008 テスト成果物
- ISO/IEC/IEEE 29119-2 テスト設計仕様

### Scrum + Reverse engineering

- Scrum.org — What is a Spike?
- Agile Alliance — Spikes
- Martin Fowler — Exploratory Testing
- SAFe — Spikes (enabler spike)
- Mike Cohn — Spikes(time-box + validated)
- Basecamp Shape Up — Uncertainty Reduction
- OMG MOF 2.0 — Model-Driven Architecture
- arc42 — Reverse Engineering Integration

### GitHub Actions + ブランチパイプライン

- Conventional Commits v1.0.0 specification
- commitlint official docs — @commitlint/config-conventional
- GitHub branch protection rules — required status checks
- GitHub Actions — workflow syntax / job ids / status check names
- CODEOWNERS syntax and examples
- Atlassian — Branch per feature workflow

### 3 層抽象化 + エスカレーション(参考、interpreter は採用せず)

- AWS Step Functions — State Machine Abstraction(参考のみ)
- Temporal.io Workflow Abstraction(参考のみ)
- Prefect Flows & Tasks(参考のみ)
- PagerDuty Escalation Policy Design
- AWS Incident Manager Escalation Plans
- Martin Fowler: Approval Workflow Pattern
- Google SRE — Escalation chapter
- LaunchDarkly Flag Lifecycle(30/90 日閾値)

# §17 改定履歴

| Version | 日付 | 変更内容 | 策定者 |
|---|---|---|---|
| 1.0 | 2026-05-15 | 初版(構想書 v1.0 ベース、`.ai/` マスター + 同期方式)| PM |
| 1.1 | 2026-05-17 | 構想書 v1.1 / 運用ルール書 v1.1 反映 | PM |
| 1.2 | 2026-05-18 | Hook / Skill / Subagent 共通化 + 同期スクリプト方式 | PM |
| 1.3 | 2026-05-20 | Critical 4 + Important 6 解消(TL レビュー第 1 回反映)| TL |
| 2.0 | 2026-05-20 | 全面再設計。3 経路 + 4 補助軸 + V-model 4 artifact + Scrum × Reverse + add-* + GitHub Actions + 3 層抽象化を統合 | PM + TL |
| **2.1** | **2026-05-20** | **TL レビュー第 1+2 回 計 29 件を反映。Critical 5 / High 3 / Medium 3 / Important 6 / Minor 6 / PM 見落とし 6 を解消。設計判断確定(WSL2 必須化 / YAML 設計仕様書化 / `ut-tdd` シェルラッパー統一 / pre-push 軽量化)** | **PM + TL** |

---

**本書は UT-TDD-agent-harness の単独完結設計書である。実装エージェント(Claude Code / Codex)はリポジトリ初期化時に本書 §14 を実装根拠として参照すること。**
