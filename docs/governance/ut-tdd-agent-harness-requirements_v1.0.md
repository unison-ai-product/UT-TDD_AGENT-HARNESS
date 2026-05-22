# UT-TDD-agent-harness 要件定義書

- **Version**: 1.0
- **Status**: Superseded. 現行正本は `ut-tdd-agent-harness-requirements_v1.1.md`。
- **対応構想書**: `ut-tdd-agent-harness-concept_v3.0.md`
- **位置付け**: 要件定義 (L1-L2 受入条件層)
- **想定読者**: Phase 0 Bootstrap 担当 (AI 実装エージェント + TL)
- **対象 OS**:
  - Windows / macOS / Linux: ネイティブ動作を第一級対応
  - Windows: PowerShell entrypoint を提供し、Git Bash 依存を局所化する
  - macOS / Linux: POSIX shell entrypoint を提供する
  - WSL2: 任意の互換実行環境。必須条件にはしない
  - CI: `ubuntu-latest` を基準にしつつ、Windows smoke を追加する

## 本書の位置付け

本書は構想書 v3.0 に対する **要件定義 (HOW を満たす条件)** を確定する。**実装詳細 (Python コード / YAML 全文 / hook script 本体)** は将来の個別 PLAN-XXX 詳細設計で詰める。本書では以下を確定する:

- frontmatter スキーマ (enum 完全表)
- V-model 4 artifact 工程要件 (Pair freeze / 4 artifact trace freeze の fail-close 条件)
- Scrum × Reverse 30 cell matrix (R1 skip 列)
- 各経路の受入条件
- GitHub 統制要件 (`harness-check` 単一 Required Status Check 方針)
- 機械検証要件 (validator の I/O 仕様)
- escalation 要件 (level 算出仕様)
- Phase 0 受入条件 (0-A / 0-B)

## v1.0 で TL Round 3 Critical を fix

| # | 元 Critical | v1.0 での fix 箇所 |
|---|-------------|---------------------|
| C1 | Pair freeze 工程曖昧 | §2.2 で「L4 前 = ①⇔③ Pair freeze (G1-G3)」/「L4 後 = 4 artifact trace freeze (G4)」を fail-close 条件として分離記述 |
| C2 | vmodel_validator が kind 限定 | §7.2 で「validator は kind 別に検証経路を分岐」と仕様化、design 系 PLAN も G2/G3 で検証対象 |
| C3 | 6方向 trace 検証が 2方向のみ | §2.4 で「双方向 12 directed edge を個別検証」を必須化、4 必須方向と 8 派生方向に分類 |
| C4 | R1 skip 判定が scrum_type 固定 | §3.3 30 cell matrix に「R1 実施/skip」列を持たせ、reverse_type を主キーとする |
| C5 | poc-no-merge-guard event 抜け | §6.4 で poc → main 物理ブロック要件を確定 (`pull_request` event 必須、harness-check 内 subjob 化) |
| C6 | Required Status Checks OR 前提誤り | §6.2 で「`harness-check` 1 本に集約、内部分岐」を確定 |
| C7 | failure_log git 管理矛盾 | §8.4 で「failure_log は local-ignore、チーム共有 audit は GitHub Actions artifact / Issue 経路」と確定 |
| C8 | escalation level +1 漸進 | §8.2 で「target_level = max(threshold satisfied) の冪等算出」を確定 |

---

# §1 PLAN frontmatter スキーマ要件

PLAN ドキュメントの YAML frontmatter は **機械検証可能な必須フィールド** + **enum 制約** で構成する。`ut-tdd plan lint` (§7.1) が CI / pre-push で fail-close 動作する。

## 1.1 必須 9 フィールド

```yaml
---
plan_id: PLAN-NNN-slug                       # 形式: PLAN-\d{3}(-[a-z0-9-]+)? または PLAN-MM-\d{3}
title: "PLAN-NNN: タイトル"
kind: impl                                    # §1.3 の 11 種から
layer: L4                                     # §1.4 の 15 種から (workflow_phase 使用時は cross 固定)
drive: be                                     # §1.6 の 9 種から
status: draft                                 # §1.2 の VALID_STATUSES から
agent_slots:                                  # §1.8 の役割スロット
  - role: tl
    slot_label: "TL — 設計判断"
generates:                                    # 双方向 trace の起点
  - artifact_path: src/foo.py
    artifact_type: python_module              # §1.7 の 18 種から
dependencies:                                 # 親 PLAN / 前提 PLAN / ブロック対象
  parent: PLAN-NNN-master
  requires: []
  blocks: []
---
```

### kind=poc / kind=reverse の variant

```yaml
---
plan_id: PLAN-NNN-slug
title: "..."
kind: poc                                     # または reverse
layer: cross                                  # 必ず cross
workflow_phase: S2                            # §1.5 の S0-S4 / R0-R4 から (必須)
drive: scrum                                  # または reverse / poc / troubleshoot
status: draft
agent_slots:
  - role: aim
    slot_label: "AIM — PoC 実装"
generates: []
dependencies:
  parent: null
  requires: []
  blocks: []
---
```

排他制約 (validator が fail-close):

- `kind in [poc, reverse]` → `workflow_phase` 必須、`layer` は `cross` のみ許可
- `kind not in [poc, reverse]` → `layer` 必須、`workflow_phase` 禁止

## 1.2 VALID_STATUSES (4 種)

| status | 意味 |
|--------|------|
| `draft` | 起票直後、未承認 |
| `confirmed` | TL 承認済み、実装/設計着手可 |
| `completed` | 工程完了、参照のみ |
| `archived` | 非アクティブ化、将来参照のみ |

## 1.3 VALID_KINDS (11 種)

| kind | 用途 | 主な layer | 経路 |
|------|------|------------|------|
| `design` | 設計 doc 起票 (D-API / D-DB / D-CONTRACT 等) | L1-L3 | 経路 1 |
| `impl` | 機能実装 (L4 Sprint) | L4 | 経路 1 |
| `poc` | 仮説検証 (Scrum S0-S4) | (workflow_phase) | 経路 2 |
| `reverse` | 設計復元 (Reverse R0-R4) | (workflow_phase) | 経路 2 |
| `add-design` | 既存設計への追補 | L2-L3 | 経路 3 |
| `add-impl` | 既存実装への機能追加 | L4 | 経路 3 |
| `refactor` | 機能変更なし内部改善 | L4 | 補助 |
| `retrofit` | 既存規約への合わせ込み | L4 | 補助 |
| `recovery` | session 断絶・認識ずれからの再開 | cross | 補助 1 |
| `troubleshoot` | バグ解析・障害対応 | L4 / L7 | 補助 1 |
| `research` | 技術調査 doc | L1-L2 | 経路 1 前段 |

## 1.4 VALID_LAYERS (15 種、L3.5 / L4.5 含む)

| layer | 名称 | 4 artifact 対応 (① 設計) |
|-------|------|--------------------------|
| `L0` | 基盤整備 (リポジトリ初期化) | — |
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
| `cross` | 横断 PLAN (workflow_phase 使用時必須) | — |

## 1.5 VALID_WORKFLOW_PHASES (10 種、Scrum / Reverse 専用)

| workflow_phase | フェーズ |
|---------------|----------|
| `S0` | Backlog 構築 |
| `S1` | Sprint Plan |
| `S2` | PoC 実装 (`verify/*.sh` 化) |
| `S3` | Verify (回帰蓄積) |
| `S4` | Decide (confirmed / rejected / pivot) |
| `R0` | Evidence Acquisition |
| `R1` | Observed Contracts (skip 判定あり、§3.3 参照) |
| `R2` | As-Is Design |
| `R3` | Intent Hypotheses (**po 検証**) |
| `R4` | Gap & Routing (Forward 接続点決定) |

## 1.6 VALID_DRIVES (9 種)

| drive | 用途 | L5 (Visual Refinement) 要否 |
|-------|------|----------------------------|
| `be` | バックエンド / API / ロジック中心 (default) | UI 変更時のみ |
| `fe` | UI / モック駆動 | **常に必要** |
| `fullstack` | BE + FE 同時 (Twin Track) | **常に必要** |
| `db` | スキーマ / データモデル中心 | UI 変更時のみ |
| `agent` | AI エージェント / プロンプト設計 | **常に必要** (会話 UI) |
| `scrum` | 仮説検証 (経路 2 専用) | — |
| `reverse` | 既存コード逆引き (経路 2 専用) | — |
| `poc` | PoC 単独実装時 | — |
| `troubleshoot` | 緊急対応 (補助 1 専用) | — |

## 1.7 VALID_ARTIFACT_TYPES (18 種、test_design / test_code 分離済)

| artifact_type | 用途 | V-model |
|---------------|------|---------|
| `design_doc` | 設計ドキュメント (D-API / D-DB / D-CONTRACT 等) | ① |
| `adr_snapshot` | ADR 凍結スナップショット | ① |
| `markdown_doc` | 一般 markdown ドキュメント | — |
| `doc_update` | 既存 doc の更新 | — |
| `python_module` | Python モジュール | ② |
| `script` | Bash / PowerShell スクリプト。Windows 配布で必要な `.ps1` shim は提供対象 | ② |
| `cli_extension` | CLI コマンド拡張 | ② |
| `template` | テンプレートファイル | — |
| `test_design` | **テスト設計ドキュメント** (L1 受入 / L2 総合 / L3 結合 / L3.5 単体) | **③** |
| `test_code` | **テストコード** (`tests/` 配下の実装) | **④** |
| `hook` | Git / CI hook | — |
| `schema_migration` | DB スキーママイグレーション | ② |
| `config` | 設定ファイル (汎用) | — |
| `yaml_config` | YAML 設定 | — |
| `json_config` | JSON 設定 | — |
| `workflow_config` | GitHub Actions workflow / harness YAML | — |
| `github_config` | GitHub 関連設定 (CODEOWNERS / PR template 等) | — |
| `other` | 上記に該当しないもの | — |

## 1.8 VALID_ROLES (7 種、agent_slots.role の enum)

| role | 必須/任意 | 主担当 |
|------|-----------|--------|
| `po` | (kind=recovery / G1 / G8 で必須) | 発注元 — 受入条件・R3 Intent 検証・リリース承認 |
| `tl` | (kind=design / impl / add-* / poc / reverse で必須) | 技術責任者 — 設計判断 / G2-G3 ゲート |
| `qa` | (kind=impl / add-impl で必須) | 品質責任者 — テスト戦略 / G4-G6 ゲート |
| `aim` | (kind=poc / recovery / troubleshoot で必須) | AI実装・保守 |
| `uiux` | (drive=fe / fullstack / agent の L3 / L5 で必須) | UI/UX デザイン |
| `se` | (任意) | 実装委譲先 — Codex / Claude Code |
| `docs` | (任意) | ドキュメント担当 |

PLAN 種別ごとの最低 slot 構成は本表の「必須」条件で機械検証する。

## 1.9 dependencies スキーマ

```yaml
dependencies:
  parent: PLAN-NNN-master | null              # Master Plan 親 (任意)
  requires:                                   # 前提完了 PLAN リスト (status=completed 必須)
    - PLAN-MMM
  blocks:                                     # ブロックされる後段 PLAN
    - PLAN-LLL
  references:                                 # (任意) 参照のみ
    - PLAN-KKK
```

validator は `requires` の status を完了状態で機械検証する (§7.2)。

## 1.10 受入条件 (frontmatter スキーマ)

- [ ] PLAN-XXX のすべてが §1.1 (通常 variant) または §1.1 (poc/reverse variant) の必須 9 フィールドを持つ
- [ ] enum 違反 → `ut-tdd plan lint` で exit 1 (fail-close)
- [ ] `kind in [poc, reverse]` の PLAN は `layer: cross` 必須、それ以外は `workflow_phase` 禁止
- [ ] agent_slots の role enum は §1.8 の 7 種のみ
- [ ] agent_slots の必須 role 不在 (kind 別) → validator が fail-close

---

# §2 V-model 4 artifact 工程要件

## 2.1 4 artifact の物理配置 (確定)

| Artifact | 配置場所 | artifact_type | 命名規約 |
|---|---|---|---|
| ① 設計 | `docs/design/<feature>/<name>.md` | `design_doc` | 例: `D-API-audit.md` |
| ② 実装コード | `src/...` | `python_module` / `script` / `cli_extension` 等 | 言語標準 |
| ③ テスト設計 | `docs/test-design/<feature>/<name>-test-design.md` | `test_design` | 例: `D-API-audit-test-design.md` |
| ④ テストコード | `tests/...` | `test_code` | 例: `test_audit.py` |

## 2.2 2 段階 freeze の fail-close 条件 (C1 fix)

### 段階 A: Pair freeze (設計⇔テスト設計、L4 前)

L4 実装着手前に、設計 artifact と対応するテスト設計 artifact が **同時に存在しなければ次ゲートを通さない**。

| ゲート | Pair freeze 対象 | fail-close 条件 |
|--------|------------------|------------------|
| **G1** 要件完了 | L1 ① 要件 doc ⇔ L1 ③ 受入テスト設計 | 片方欠落 → fail |
| **G2** 設計凍結 | L2 ① CONCEPT/ADR ⇔ L2 ③ 総合テスト設計 | 片方欠落 → fail |
| **G3** 実装着手 | L3 ① D-API/D-DB ⇔ L3 ③ 結合テスト設計、**L3.5 ① 機能設計 ⇔ L3.5 ③ 単体テスト設計** | 片方欠落 → fail |

### 段階 B: 4 artifact trace freeze (L4 後)

L4 実装完了時に、4 artifact 揃いと双方向 trace 6 pair の **両方** を検証。

| ゲート | trace freeze 対象 | fail-close 条件 |
|--------|------------------|------------------|
| **G4** 実装凍結 | ① ② ③ ④ 揃い + §2.4 の双方向必須 4 方向 + カバレッジ ≥ 80% | いずれか欠落 → fail |

## 2.3 双方向 trace の記述要件

| Pair / 方向 | 記述方法 | 例 |
|------------|----------|----|
| ① 設計 → ② 実装コード | 設計に「実装ファイル: `<path>`」 | `実装ファイル: src/audit.py` |
| ② 実装コード → ① 設計 | docstring に「契約: `<doc>` §`<n>`」 | `"""契約: docs/design/L3-D-API.md §3.1"""` |
| ① 設計 → ③ テスト設計 | 設計に「テスト設計: `<path>`」 | `テスト設計: docs/test-design/L3.5-audit-unit-test-design.md` |
| ③ テスト設計 → ① 設計 | テスト設計に「対象設計: `<doc>` §`<n>`」 | `対象設計: docs/design/L3-D-API.md §3.1` |
| ③ テスト設計 → ④ テストコード | テスト設計に「テスト実装: `<path>`, U-XXX-NNN 対応」 | `テスト実装: tests/test_audit.py, U-AUD-001〜023` |
| ④ テストコード → ③ テスト設計 | docstring に「DoD 検証: `<doc>` U-XXX-NNN」 | `"""DoD 検証: docs/test-design/L3.5-audit-unit-test-design.md U-AUD-001"""` |

## 2.4 双方向 12 directed edge の検証要件 (C3 fix)

4 artifact は無向 6 pair = 双方向 12 directed edge。**G4 では以下 4 必須 directed edge を検証する**:

| # | Directed edge | Pair | 必須 |
|---|--------------|------|------|
| 1 | ① 設計 → ② 実装コード | ①⇔② | ✓ |
| 2 | ② 実装コード → ① 設計 | ①⇔② | ✓ |
| 3 | ① 設計 → ③ テスト設計 | ①⇔③ | ✓ |
| 4 | ③ テスト設計 → ① 設計 | ①⇔③ | ✓ |
| 5 | ③ テスト設計 → ④ テストコード | ③⇔④ | ✓ |
| 6 | ④ テストコード → ③ テスト設計 | ③⇔④ | ✓ |
| 7 | ① 設計 → ④ テストコード | ①⇔④ | 派生 (5+3 経由) |
| 8 | ④ テストコード → ① 設計 | ①⇔④ | 派生 (6+4 経由) |
| 9 | ② 実装コード → ③ テスト設計 | ②⇔③ | 派生 (5+? — 任意) |
| 10 | ③ テスト設計 → ② 実装コード | ②⇔③ | 派生 |
| 11 | ② 実装コード → ④ テストコード | ②⇔④ | ✓ (test_code が src を import) |
| 12 | ④ テストコード → ② 実装コード | ②⇔④ | ✓ (同上) |

→ **必須 8 directed edge** = #1, #2, #3, #4, #5, #6, #11, #12 (validator は最低この 8 方向を fail-close 検証)。残り 4 方向は派生として推奨検証。

## 2.5 QA 追加テストの分離 (V-model 補足)

L4 実装完了後に QA が追加する **regression / exploratory / edge-case** テストは、L3 結合テスト設計や L3.5 単体テスト設計に **統合してはいけない**。

| テスト種別 | 担当 | 設計 doc | タイミング |
|-----------|------|----------|------------|
| 単体テスト | aim / se | L3.5 単体テスト設計 | L4 Sprint 内 |
| 結合テスト | aim / se | L3 結合テスト設計 | L4.5 |
| **QA 追加テスト** (regression / exploratory / edge-case) | qa | **`docs/test-design/L6-qa-additional-test-design.md`** | L6 統合検証 |
| 総合テスト (E2E) | qa / aim | L2 総合テスト設計 | L6 |
| 受入テスト | po / qa | L1 受入テスト設計 | L8 受入 |

`vmodel_lint` は L3/L3.5 設計 doc 内に L6 QA テスト記述があれば **P1 (warning)** を出す。

## 2.6 逆ピラミッド検出 (P0 severity)

| 検出 | severity | 動作 |
|------|----------|------|
| ① ② 存在、③ ④ 無し | **P0** | G3 / G4 で fail-close (マージ不可) |
| ① ② 存在、③ あり ④ 無し | P1 | warning + carry 候補 |

## 2.7 受入条件 (V-model 工程)

- [ ] G1-G3 通過時に Pair freeze (①⇔③) 不在なら CI が exit 1
- [ ] G4 通過時に 4 artifact 揃い不在、または §2.4 の必須 8 directed edge のいずれかが欠落なら CI が exit 1
- [ ] L3/L3.5 設計 doc 内に L6 QA 追加テスト記述があれば P1 warning
- [ ] 逆ピラミッド (① ② のみ存在) なら P0 fail-close

---

# §3 経路 2: Scrum × Reverse 30 cell matrix 要件

## 3.1 30 cell matrix の意義

Scrum で確定した仮説 (`scrum_type` 6 種) と、本実装に昇格させるための Reverse 経路 (`reverse_type` 5 種) を機械的に組み合わせ、各 cell に「R1 実施/skip」「Primary 推奨」「Alternative 許容」を持たせる。

## 3.2 6 × 5 = 30 cell の Primary mapping (推奨)

|  | reverse: code | reverse: design | reverse: upgrade | reverse: normalization | reverse: fullback |
|--|--------------|-----------------|------------------|------------------------|-------------------|
| **hypothesis-test** | **Primary** | Alt | Alt | Alt | Alt |
| **tech-spike** | Alt | **Primary** | Alt | Alt | Alt |
| **design-spike** | Alt | **Primary** | Alt | Alt | Alt |
| **perf-spike** | Alt | Alt | **Primary** | Alt | Alt |
| **security-spike** | **Primary** | Alt | Alt | Alt | Alt |
| **ux-spike** | Alt | **Primary** | Alt | Alt | Alt |

`tech-spike × code` のような Alternative routing も許容する。S4 decide 時に `confirmed_reverse_type` を frontmatter に明示し、Primary 推奨外の選択でも validator は許容する (warning のみ)。

## 3.3 R1 (Observed Contracts) 実施/skip の判定 (C4 fix)

R1 skip 判定は **解決済み `reverse_type` を主キーとする**。`scrum_type` 固定ではない。

| reverse_type | R1 (Observed Contracts) |
|-------------|--------------------------|
| `code` | **実施** (PoC コードから契約抽出が中核) |
| `design` | **skip** (デザイン資産起点、コード契約は別の R2 で起こす) |
| `upgrade` | **実施** (既存版と新版差分から契約抽出) |
| `normalization` | **skip** (設計 drift 修正、R2 で normalize 設計を起こす) |
| `fullback` | **実施** (実装完遂後の文書整合、R1 で文書 gap 抽出) |

`scrum_reverse_lint` は frontmatter の `confirmed_reverse_type` を読んで本表で R1 必須/skip を判定する。`scrum_type` は judgement に使わない。

## 3.4 経路 2 → 経路 1 合流のルール

R4 outcome の `forward_routing` フィールドで Forward 接続点を明示:

| forward_routing | 合流先 | 用途 |
|-----------------|--------|------|
| `L1` | Forward L1 (要件) | 仮説確定だが要件構造化未了 |
| `L2` | Forward L2 (全体設計) | 仮説 + 全体設計まで決まった |
| `L3` | Forward L3 (詳細設計) | 仮説 + 設計が R2 で揃い、L3 から実装着手 |
| `gap-only` | Forward Backlog (新 PLAN 起票) | Gap 整理のみ、L1 から再開 |

## 3.5 受入条件 (経路 2)

- [ ] kind=poc PLAN は frontmatter に `scrum_type` を持つ (validator が enum 検証)
- [ ] kind=reverse PLAN は frontmatter に `confirmed_reverse_type` を持つ
- [ ] R1 phase の PLAN は §3.3 の R1 実施対象 reverse_type のみ許容 (skip 対象は exit 1)
- [ ] R4 完了 PLAN は `forward_routing` を必須 (§3.4 の 4 値)
- [ ] poc/* ブランチから main への直 PR は §6.4 で物理ブロック

---

# §4 経路 3: add-* 受入条件

## 4.1 add-design / add-impl の禁則 (3 原則)

| 原則 | 機械検証 |
|------|----------|
| **既存設計を改変しない** | `git diff origin/main..HEAD -- docs/design/` で `--diff-filter=DM` (既存ファイル削除/変更) 検出 → exit 1 |
| **既存テストを変更しない** | `git diff origin/main..HEAD -- tests/` で `--diff-filter=DM` 検出 → exit 1。新規追加 (`--diff-filter=A`) は許容 |
| **回帰確認必須** | `harness-check` 内で既存テスト全 PASS を確認、未通過なら exit 1 |

## 4.2 add-* PLAN の frontmatter 要件

- `dependencies.parent` で既存 PLAN を必須指定
- `kind=add-design` PLAN の `generates` には新規 `design_doc` + 新規 `test_design` のペアを必須
- `kind=add-impl` PLAN の `generates` には新規 `python_module/script/cli_extension` 等 + 新規 `test_code` を必須

## 4.3 双方向 reference 更新

add-* 完了時、既存 PLAN との双方向 reference を更新:

- 親 PLAN の `dependencies.references` に子 add-* PLAN ID を追加
- 子 PLAN の `dependencies.parent` を必須

## 4.4 受入条件 (経路 3)

- [ ] `kind=add-design` / `kind=add-impl` の PLAN は `dependencies.parent` を必須
- [ ] `git diff --diff-filter=DM docs/design/` または `git diff --diff-filter=DM tests/` が non-empty なら exit 1
- [ ] 既存テスト回帰 PASS なら harness-check 通過、いずれか fail なら exit 1
- [ ] 親 PLAN の `references` 更新が PR に含まれること (validator で機械検証)

---

# §5 補助 1: 緊急経路 (recovery / hotfix) 受入条件

## 5.1 recovery kind の本文 7 必須セクション

recovery kind の PLAN は本文に以下 7 セクションを必須:

| # | セクション | 内容 |
|---|-----------|------|
| 1 | 事故記録 | timestamp / impact / 検知元 |
| 2 | 議論順序 timeline | 発生 → 検知 → 対応の時系列 |
| 3 | 認識訂正履歴 | 当初仮説 → 実際の状況の差分 |
| 4 | 中間結論 list | 対応中に判明した中間判断 |
| 5 | context 再構築 | session 復帰時に必要な前提 |
| 6 | 再開ポイント | 次セッションでどこから再開するか |
| 7 | 再発防止 | 観点リスト / CI チェック追加案 |

`ut-tdd plan lint` は recovery kind PLAN の本文に 7 セクション header (h2 / `## §1 事故記録` 形式) があるか機械検証。

## 5.2 hotfix ブランチの要件

| 要件 | 機械検証 |
|------|----------|
| `hotfix/*` ブランチからの PR は postmortem doc を必須 | PR body に `## Postmortem` セクションがある (checkbox not required) |
| postmortem doc は `docs/postmortem/<plan-id>.md` に配置 | path 存在確認 |
| `hotfix/*` PR は recovery kind PLAN へリンク | PR body に `recovery PLAN: PLAN-XXX` の記述 |
| postmortem 完了期限: 48h (P0/P1 のみ必須) | 自動 reminder (Issue label `postmortem-overdue`) |

## 5.3 session 終了前 fail-close (4 項目)

ローカル pre-push hook が以下 4 項目を全て検証。1 つでも fail なら push 中止 (exit 1):

| # | 項目 | 検証方法 |
|---|------|----------|
| 1 | **設計 ⇔ 実装 ⇔ テストの整合性** | `vmodel_lint` 軽量版 (current branch の差分対象のみ) |
| 2 | **未 commit ファイルの取り残し** | `git status --porcelain` が non-empty なら fail |
| 3 | **認識ずれの記録** | session 中に `failure_log.jsonl` への追記があれば recovery PLAN 起票推奨 (warning) |
| 4 | **次セッションへの引き継ぎメモ** | `.ut-tdd/handover/CURRENT.md` の `updated_at` が 24h 以内なら OK (それ以外は warning) |

## 5.4 受入条件 (補助 1)

- [ ] kind=recovery PLAN は本文 7 セクションを持つ (validator が h2 header 存在を検証)
- [ ] hotfix/* PR は postmortem doc + recovery PLAN リンクを必須
- [ ] pre-push hook が §5.3 の 4 項目を fail-close 検証
- [ ] postmortem 48h 超過時に Issue label 自動付与

---

# §6 補助 2: GitHub 統制要件

## 6.1 ブランチタイプとリンクする kind

| ブランチ prefix | 対応 kind |
|----------------|-----------|
| `feature/*` | `impl` |
| `poc/*` | `poc` |
| `reverse/*` | `reverse` |
| `add/*` | `add-impl` / `add-design` |
| `hotfix/*` | `recovery` / `troubleshoot` |
| `refactor/*` | `refactor` / `retrofit` |

`branch-kind-check` (§7.3) が PR 起票時に prefix と PLAN kind の整合を機械検証する。

## 6.2 Required Status Checks の集約方針 (C6 fix)

**`harness-check` ワークフロー 1 本のみを Branch Protection の Required Status Checks に指定**。

- 全 PR 共通の必須 check は `harness-check` のみ
- `harness-check` 内部で branch prefix を識別し、branch type 別 subjob を呼び分け
- branch type 別の subjob (例: `poc-no-merge-guard`, `hotfix-postmortem-required`) は `harness-check` 内で呼ばれるため自動的に merge gate となる
- Required Status Checks には登録しない (集約された `harness-check` のみで gate)

これにより:
- GitHub の「pending で詰まる」問題を回避 (走らない workflow が Required に居座らない)
- branch type 固有 check が gate として機能 (`harness-check` 経由)

具体的な `harness-check` 内部分岐ロジックの実装詳細 (job 定義 / step 順序 / 並列度) は将来の個別 PLAN-XXX で詳細設計する。

## 6.3 harness-check 内 subjob リスト

| subjob | 適用 branch | 内容 |
|--------|------------|------|
| `plan-lint` | 全 PR | frontmatter schema 検証 |
| `vmodel-lint` | feature/* / add/* / refactor/* | §2 の 4 artifact + trace 検証 |
| `branch-kind-check` | 全 PR | branch prefix と PLAN kind の整合 |
| `scrum-reverse-lint` | poc/* / reverse/* | §3 の 30 cell matrix 検証 |
| `poc-no-merge-guard` | poc/* | main 向け PR を物理ブロック (C5 fix) |
| `hotfix-postmortem-required` | hotfix/* | postmortem doc + recovery PLAN リンク確認 |
| `commitlint` | 全 PR | Conventional Commits 形式 |
| `regression-test` | feature/* / add/* | 既存テスト PASS |

## 6.4 poc → main 直 merge 物理ブロック (C5 fix)

| 要件 | 仕様 |
|------|------|
| event trigger | `harness-check.yml` は `pull_request: branches: [main]` event で実行 (push event 単独では不可) |
| 検出ロジック | PR head が `poc/*` で base が `main` なら subjob `poc-no-merge-guard` が exit 1 |
| 例外 | なし (poc/* は S4 confirmed 後に Reverse → feature/* で再 PR する) |

## 6.5 CODEOWNERS bootstrap 2-stage

CODEOWNERS は Required Status Checks で参照されるため、bootstrap 直後は循環依存になり得る (CODEOWNERS が存在しないと protection を設定できない、protection を設定しないと CODEOWNERS が機能しない)。回避策:

### Phase 0-A (リポジトリ初期化、CODEOWNERS なしで進める)

- 全 PR は branch protection なしで merge 可能
- `harness-check` workflow は配備するが Required 化しない
- `@<bootstrap-owner>` (1 名) が全 PR レビュー

### Phase 0-B (CODEOWNERS 配備 + Required 化)

- CODEOWNERS を `tl-team` / `qa-team` / `po-team` などのチームに割り当て
- `harness-check` を Required Status Checks に登録
- Branch Protection の `required_pull_request_reviews.required_approving_review_count` を 1 に設定
- bootstrap-owner から各 owner team へレビュー責任を移管

## 6.6 commitlint 設定

Conventional Commits v1.0.0 準拠。型は `feat / fix / docs / style / refactor / test / chore / perf / ci / build / revert` のみ許容。

```
type(scope): subject
↓
feat(auth): JWT 認証を追加
fix(api): null pointer 例外を修正
```

PR 内の全 commit が Conventional Commits 形式に従う (`harness-check` 内 `commitlint` subjob で検証)。

## 6.7 受入条件 (補助 2)

- [ ] `harness-check` のみを Branch Protection の Required Status Checks に指定
- [ ] `harness-check` 内で §6.3 の 8 subjob が呼ばれる
- [ ] poc/* → main の PR が `poc-no-merge-guard` で exit 1
- [ ] hotfix/* → main の PR が postmortem doc + recovery PLAN リンクなしで exit 1
- [ ] 全 commit が Conventional Commits 形式 (commitlint subjob で検証)
- [ ] Phase 0-A → 0-B 2-stage で CODEOWNERS bootstrap

---

# §7 機械検証要件

## 7.1 ut-tdd CLI 構成

`ut-tdd` は **シェルラッパー方式** で実装する。

```
scripts/
├── ut-tdd                    # ディスパッチャ (bash)
├── ut-tdd-plan-lint.sh       # plan lint
├── ut-tdd-vmodel-lint.sh     # vmodel lint
├── ut-tdd-doctor.sh          # 統合チェック
├── ut-tdd-gate.sh            # G1-G11 ゲート判定
└── lib/
    ├── plan_validator.py     # PLAN frontmatter 検証 (Python)
    ├── vmodel_validator.py   # V-model 4 artifact 検証 (Python)
    └── python_cmd.sh         # Python interpreter 判定
```

ディスパッチャの subcommand:

| Subcommand | 用途 |
|------------|------|
| `ut-tdd plan lint` | frontmatter schema 検証 |
| `ut-tdd vmodel lint` | 4 artifact + trace 検証 |
| `ut-tdd doctor` | plan + vmodel + governance + scrum/reverse + recovery 統合検証 |
| `ut-tdd gate G<N>` | G1-G11 ゲート判定 |

詳細実装は将来の個別 PLAN-XXX で詰める。

## 7.2 vmodel_validator I/O 仕様 (C2/C3 fix)

### kind 別検証経路の分岐 (C2 fix)

```
input: PLAN ファイル または PLAN ディレクトリ
output:
  - exit 0: 全 P0/P1 検出なし
  - exit 1: P0 検出あり (fail-close)
  - stderr: P1 warning (carry 候補)

検証フロー:
  for each PLAN file:
    parse frontmatter (kind / generates / dependencies)
    case kind:
      design / add-design / research:
        → §2.2 段階 A (Pair freeze ①⇔③) を G1-G3 対象で検証
      impl / add-impl:
        → §2.2 段階 A (G3 まで) + §2.2 段階 B (G4 で 4 artifact trace) 検証
      poc / reverse:
        → workflow_phase に応じた検証 (詳細は将来 PLAN-XXX)
      recovery / troubleshoot:
        → §5.1 の 7 セクション header 検証
      refactor / retrofit:
        → 既存 trace の不変性のみ検証 (新規 trace 不要)
```

### 双方向 12 directed edge の検証 (C3 fix)

vmodel_validator は §2.4 の **必須 8 directed edge** を個別検証する。grep ベースだけでなく path 正規化と参照先 path/id 一致まで確認する:

```
for each directed_edge in [#1..#12 from §2.4]:
  if directed_edge in necessary_8:
    extract source artifact path from PLAN.generates
    extract target reference from source artifact content
    normalize both paths to canonical form
    verify target file exists
    verify target file has back-reference to source (双方向)
    if any check fails → P0 finding
  else:
    perform soft check (warn only)
```

実装詳細は将来の個別 PLAN-XXX で詰める。本書では入出力契約と必須検証項目を確定する。

## 7.3 branch-kind-check 仕様

```
input: PR head branch name + PR で touched された PLAN files
output:
  - exit 0: branch prefix と全 touched PLAN の kind が §6.1 表で整合
  - exit 1: 不整合検出

判定:
  prefix = branch_name.split('/')[0]
  expected_kinds = §6.1 表で prefix から決まる
  for each PLAN file touched:
    if PLAN.kind not in expected_kinds → exit 1
```

`harness-check` 内 subjob として `|| exit 1` で fail-close 動作 (v2.1 の `|| echo WARN` は誤り、削除)。

## 7.4 pre-commit / pre-push hook の責任分離

| Hook | 検証内容 | 想定時間 |
|------|----------|----------|
| **pre-commit** | gitleaks / commitlint format / 軽量 lint (markdown / yaml) | < 5s |
| **pre-push** | §5.3 session 終了前 4 項目 + 軽量 plan lint | < 15s |
| **harness-check (CI on PR)** | §6.3 の 8 subjob (重い検証 + 全テスト) | 数分 |

`vmodel_lint` の完全検証は **pre-push と CI のみ** で実行。pre-commit には乗せない (commit を頻繁に阻害するため)。

## 7.5 受入条件 (機械検証)

- [ ] `ut-tdd plan lint` が §1 の全 enum 違反を fail-close
- [ ] `ut-tdd vmodel lint` が §7.2 の kind 別経路で正しく分岐
- [ ] §7.2 の必須 8 directed edge を fail-close 検証
- [ ] `branch-kind-check` が prefix 不整合で exit 1 (echo WARN ではない)
- [ ] pre-commit / pre-push / CI の責任分離 (§7.4) を守る
- [ ] `ut-tdd doctor` が plan + vmodel + governance + scrum/reverse + recovery を統合検証

---

# §8 補助 3: エスカレーション要件

## 8.1 L0-L3 reviewer 自動切替

| Level | reviewer | 動作 |
|-------|----------|------|
| L0 | agent | AI レビューのみ |
| L1 | aim | aim の人間レビュー追加 |
| L2 | council | tl + qa + aim 3 者会議 |
| L3 | human | po 直接通知 + 作業一時停止 |

## 8.2 level 算出仕様 (C8 fix)

### 閾値定義

| Level | 同種失敗 N (累計) | 再失敗 M (累計) |
|-------|------------------|-----------------|
| L1 | ≥ 3 | ≥ 1 |
| L2 | ≥ 7 | ≥ 3 |
| L3 | ≥ 15 | ≥ 7 |

### 冪等算出ロジック

```
input:
  - plan_id × failure_type で集計した同種失敗回数 N
  - 同 plan_id × failure_type の再失敗回数 M
output:
  target_level = max(level satisfied by either N or M threshold)

例:
  N=15, M=0 → L3 (N が L3 閾値を満たす)
  N=2, M=4 → L2 (M が L2 閾値、L3 は未達)
  N=0, M=0 → L0

注: target_level は冪等算出 (現 level に +1 漸進ではない)
```

### 昇格イベント記録

```
{
  "timestamp": "2026-05-20T10:00:00Z",
  "plan_id": "PLAN-042",
  "failure_type": "vmodel_lint_p0",
  "n_failures": 15,
  "m_refails": 0,
  "level_before": "L0",
  "level_after": "L3"
}
```

## 8.3 降格判定 (`check-escalation-stale.sh`)

定期実行 (GitHub Actions schedule: weekly):

| 期間 | 動作 |
|------|------|
| 違反検出ゼロ 90 日継続 | 降格 **推奨表示のみ** (自動降格しない) |
| 未使用 30 日 | warning |
| 未使用 90 日 | archive 候補 (human 確認後に非アクティブ化) |

降格 / archive は **human (po または tl) 確認後にのみ実行**。スクリプトは候補表示のみ。

## 8.4 failure_log の取扱い (C7 fix)

| ログ種別 | 位置 | git 管理 | 書き込み主体 |
|---------|------|---------|--------------|
| **個人作業ログ** | `.ut-tdd/audit/failure_log.jsonl` | **`.gitignore`** | ローカル pre-push hook / `scripts/log-failure.sh` |
| **チーム共有 audit (PR/CI)** | GitHub Actions job summary + artifact / Issue label | (Actions が管理) | CI job |
| **escalation 集計** | 個人ログ + チーム共有を `check-escalation-level.sh` が併用集計 | — | スクリプト |

### `.gitignore` 必須エントリ

```
.ut-tdd/audit/failure_log.jsonl
.ut-tdd/cache/
```

### `check-escalation-level.sh` の集計仕様

```
1. ローカル failure_log.jsonl を読む (個人ログ)
2. GitHub Actions API で同 plan_id の過去 90 日 artifact を取得 (チーム共有)
3. 両者を併用集計し N / M を算出
4. §8.2 の冪等算出で target_level を決定
5. 結果を `.ut-tdd/audit/escalation_state.json` (これは git 管理) に書く
```

### CODEOWNERS 動的注入の禁止

v2.1 で記述していた「CODEOWNERS mention を level に応じて動的追加」は実装不能 (CODEOWNERS は静的 path owner)。代替手段:

| 代替 | 仕組み |
|------|--------|
| PR comment | Actions が level 昇格時に `@<owner>` 付き comment を投稿 |
| label 制御 | `escalation-L2` / `escalation-L3` ラベルを PR に自動付与 |
| review request | Actions が `pulls/{number}/requested_reviewers` API で動的追加 |

## 8.5 受入条件 (エスカレーション)

- [ ] `check-escalation-level.sh` が §8.2 の冪等算出で target_level を出す
- [ ] N=15 を初回観測した場合に L3 (Human 通知) が即発火する
- [ ] failure_log.jsonl が `.gitignore` 対象
- [ ] チーム共有 audit が GitHub Actions artifact + Issue label 経由
- [ ] CODEOWNERS 動的注入を実装しない (PR comment / label / review request で代替)

---

# §9 リポジトリ構造要件

## 9.1 ディレクトリ構造

```
<repo-root>/
├── .github/
│   ├── CODEOWNERS                                # §6.5
│   ├── ISSUE_TEMPLATE/
│   │   ├── recovery.md                           # recovery kind 起票テンプレート
│   │   └── add-feature.md                        # add-* 起票テンプレート
│   ├── PULL_REQUEST_TEMPLATE.md                  # §6.6 / checkbox 4 項目
│   └── workflows/
│       ├── harness-check.yml                     # Required Status Check 集約 (§6.2)
│       └── escalation-stale.yml                  # weekly cron
├── .ut-tdd/
│   ├── audit/
│   │   ├── failure_log.jsonl                     # 個人ログ (.gitignore)
│   │   └── escalation_state.json                 # git 管理 (§8.4)
│   ├── cache/                                    # .gitignore
│   └── handover/
│       └── CURRENT.md                            # §5.3 session 引き継ぎメモ
├── .pre-commit-config.yaml                       # gitleaks / commitlint format / 軽量 lint
├── .gitignore                                    # §8.4 必須エントリ
├── commitlint.config.js                          # §6.6
├── docs/
│   ├── governance/
│   │   ├── team-charter.md                       # 構想書 v1.1
│   │   ├── operations.md                         # 運用ルール書 v1.1
│   │   └── harness-blueprint.md                  # 構想書 v3.0 + 本書
│   ├── plans/
│   │   └── PLAN-NNN-*.md                         # PLAN 起票
│   ├── design/
│   │   └── <feature>/<name>.md                   # ① 設計
│   ├── test-design/
│   │   └── <feature>/<name>-test-design.md       # ③ テスト設計
│   ├── adr/
│   │   └── ADR-NNN-*.md                          # ADR
│   ├── postmortem/
│   │   └── <plan-id>.md                          # §5.2 hotfix postmortem
│   └── skills/                                   # §8 補助 3 層 1 スキル
├── src/                                          # ② 実装コード
├── tests/                                        # ④ テストコード
├── scripts/
│   ├── ut-tdd                                    # ディスパッチャ
│   ├── ut-tdd-plan-lint.sh
│   ├── ut-tdd-vmodel-lint.sh
│   ├── ut-tdd-doctor.sh
│   ├── ut-tdd-gate.sh
│   ├── install-hooks.sh                          # Phase 0-A
│   ├── setup-branch-protection.sh                # Phase 0-B
│   ├── check-escalation-level.sh
│   ├── check-escalation-stale.sh
│   ├── log-failure.sh
│   ├── requirements.txt                          # pyyaml>=6.0,<7.0
│   └── lib/
│       ├── plan_validator.py
│       ├── vmodel_validator.py
│       └── python_cmd.sh
├── workflows/                                    # §8 補助 3 層 2 (設計仕様書)
│   └── *.yaml
└── harness/                                      # §8 補助 3 層 3 (設計仕様書)
    └── *.yaml
```

## 9.2 受入条件 (構造)

- [ ] §9.1 の全ディレクトリ + 必須ファイルが Phase 0-A 完了時に存在
- [ ] `.gitignore` に §8.4 のエントリが含まれる
- [ ] `scripts/requirements.txt` に `pyyaml>=6.0,<7.0` 等の pin
- [ ] `docs/design/` と `docs/test-design/` のディレクトリペアが対応

---

# §10 Phase 0 受入条件

Phase 0 は **CODEOWNERS bootstrap 2-stage** で進める (§6.5)。

## 10.1 Phase 0-A: リポジトリ初期化 (CODEOWNERS なし)

### 受入条件 (11 項目)

| # | 条件 | 検証 |
|---|------|------|
| 1 | リポジトリ初期化 (`git init` or 既存 clone) | `git rev-parse --show-toplevel` 通る |
| 2 | §9.1 の全ディレクトリ作成 | `ls -d` で全 dir 存在 |
| 3 | `.gitignore` に §8.4 エントリ | `grep failure_log.jsonl .gitignore` 通る |
| 4 | `.pre-commit-config.yaml` 配備 | gitleaks + commitlint format + 軽量 lint |
| 5 | `commitlint.config.js` 配備 | Conventional Commits 設定 |
| 6 | `scripts/ut-tdd*` + `scripts/lib/*` 配備 | `bash scripts/ut-tdd --help` 通る |
| 7 | `scripts/requirements.txt` 配備 | `pyyaml>=6.0,<7.0` 含む |
| 8 | `python -m pip install -r scripts/requirements.txt` 通る | exit 0 |
| 9 | `chmod +x scripts/*.sh scripts/ut-tdd*` | `[ -x scripts/ut-tdd ]` 通る |
| 10 | `scripts/install-hooks.sh` 実行 | pre-commit / pre-push hook が `.git/hooks/` に配置 |
| 11 | `scripts/install-hooks.sh` 内に gitleaks binary 導入手順を含む | `pre-commit run gitleaks --all-files` 通る |

### Phase 0-A 完了基準

- 上記 11 項目全て pass
- `harness-check.yml` ワークフローは存在するが Required Status Checks に登録しない (bootstrap-owner 1 名で全 PR レビュー)
- bootstrap-owner は `@<bootstrap-owner>` (placeholder) としてリポジトリ管理者 1 名

## 10.2 Phase 0-B: CODEOWNERS + Branch Protection (運用 Stage)

### 受入条件 (3 項目)

| # | 条件 | 検証 |
|---|------|------|
| 1 | `.github/CODEOWNERS` に `tl-team` / `qa-team` / `po-team` 等の team を path 別アサイン | `gh api repos/<owner>/<repo>/codeowners/errors` で errors なし |
| 2 | Branch Protection を main に設定 (`harness-check` を required、required_approving_review_count=1) | `gh api repos/<owner>/<repo>/branches/main/protection` で確認 |
| 3 | テスト PR (適当な docs 修正) を起票し、§6.3 の 8 subjob 全てが PR 上で context として出現 | PR の Checks タブで 8 status 表示 |

### Phase 0-B 完了基準

- 上記 3 項目全て pass
- bootstrap-owner から team に移管完了
- 以後の全 PR は `harness-check` を必須として merge

## 10.3 Phase 0 全体の受入条件

- [ ] Phase 0-A の 11 項目 + Phase 0-B の 3 項目 = 計 14 項目すべて pass
- [ ] テスト PR で `harness-check` 緑 + CODEOWNERS auto-assign 動作確認
- [ ] §5.3 の pre-push 4 項目が動作 (handover/CURRENT.md なしで warning が出る等)

---

# §11 用語差分

構想書 v3.0 §10 の用語集を正本とする。本書では以下の追加用語のみ定義:

| 用語 | 定義 |
|---|---|
| **VALID_STATUSES** | frontmatter `status` の enum: draft / confirmed / completed / archived |
| **VALID_KINDS** | frontmatter `kind` の enum (11 種、§1.3) |
| **VALID_LAYERS** | frontmatter `layer` の enum (15 種、§1.4) |
| **VALID_WORKFLOW_PHASES** | frontmatter `workflow_phase` の enum (10 種、§1.5) |
| **VALID_DRIVES** | frontmatter `drive` の enum (9 種、§1.6) |
| **VALID_ARTIFACT_TYPES** | frontmatter `generates[].artifact_type` の enum (18 種、§1.7) |
| **VALID_ROLES** | frontmatter `agent_slots[].role` の enum (7 種、§1.8) |
| **必須 8 directed edge** | §2.4 の vmodel_validator 必須検証対象 |
| **harness-check subjob** | `harness-check` 内で呼ばれる 8 種の検証 (§6.3) |

---

# §12 改定履歴

| Version | 日付 | 変更内容 | 策定者 |
|---|---|---|---|
| **1.0** | **2026-05-20** | **初版。構想書 v3.0 と分離して要件定義のみを記述。TL Round 3 Critical 8 件 (C1-C8) を全 fix** | **PM + TL** |

---

**本書は UT-TDD-agent-harness の要件定義書である。構想 (WHY/WHAT) は `ut-tdd-agent-harness-concept_v3.0.md` を、各 enum・スクリプト・workflow YAML の実装詳細は将来の個別 PLAN-XXX 詳細設計を参照。**
