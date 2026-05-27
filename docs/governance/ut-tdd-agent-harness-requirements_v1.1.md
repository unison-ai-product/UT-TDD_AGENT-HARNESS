# UT-TDD-agent-harness 要件定義書

> **⚠️ Superseded (2026-05-27)**: 本書は **`ut-tdd-agent-harness-requirements_v1.2.md` に置き換えられた旧版**。現行正本ではない。v1.2 で L0-L14 + W-model / 9-mode / 配線要件 / 実装言語 = TypeScript (ADR-001) を反映。参照は v1.2 を使うこと。本書は履歴として残置。

- **Version**: 1.1
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

本書は構想書 v3.0 に対する **要件定義 (HOW を満たす条件)** を確定する。**実装詳細 (Python コード / YAML 全文 / hook script 本体)** は将来の個別 PLAN-XXX 詳細設計で詰める。

| 文書 | 役割 | 抽象レベル |
|------|------|------------|
| 構想書 v3.0 | 概念 / 経路 / 補助軸 / 役割 | L1 概念 |
| 本書 (要件定義書 v1.1) | 受入条件 / enum / fail-close 条件 / Phase 0 受入条件 | L1-L2 要件 |
| 個別 PLAN-XXX (将来) | validator 実装 / workflow YAML / hook script | L3 詳細設計 |

## v1.1 で TL Round 4 Critical 8 + Important 9 を fix

| # | 問題 | v1.1 fix |
|---|------|----------|
| R-C1 | S4 outcome (rejected/pivot) が frontmatter 表現不能 | §1.2 `VALID_DECISION_OUTCOMES` 専用 enum 追加、§1.1 variant に `decision_outcome` フィールド追加 |
| R-C2 | §1.1 schema 詳細が §1.10 受入条件未反映 | §1.10 にフィールド単位の機械検証条件を列挙 |
| R-C3 | G4 trace 必須が「4 方向」と「8 directed edge」で矛盾 + coverage 80% 未反映 | §2.7 で「4 artifact + 必須 8 directed edge + coverage ≥80% のいずれか欠落で exit 1」に統一 |
| R-C4 | pre-push 4 項目 fail-close vs warning 矛盾 | §5.3 で item 1-2 = fail-close / item 3-4 = warning に明示分離、§5.4 を整合 |
| R-C5 | design/research kind に branch prefix なし | §6.1 表に全 11 kind 網羅、`docs/*` / `chore/*` 等を追加 |
| R-C6 | Phase 0-A CODEOWNERS なしと §9.1 必須矛盾 | §9.1 に「Phase 0-A 必須 / 0-B 追加必須 / 自動生成」の 3 種別を列挙、CODEOWNERS は 0-B 追加扱い |
| R-C7 | failure_log.jsonl .gitignore vs 必須構造矛盾 | §9.1 で「`.ut-tdd/audit/` ディレクトリ自体が必須、`failure_log.jsonl` は生成時に作成」と明記 |
| R-C8 | テスト PR 8 subjob 全出現は branch type 別矛盾 | §10.2 で branch type 別テスト PR matrix を表化、`non-applicable` subjob は `skipped` 扱い |
| R-I1 | poc/reverse の workflow_phase 対応範囲未制約 | §1.5 に `kind=poc → S0-S4 / kind=reverse → R0-R4` 制約を fail-close 条件として追加 |
| R-I2 | drive × kind 互換性未定義 | §1.6 に kind × drive 許可 matrix を追加 |
| R-I3 | 必須 role 条件未列挙 | §1.8 に kind/drive/layer/gate 別の必須 role 表を追加 |
| R-I4 | PLAN 対象 path / 除外 path 未定義 | §1.10 で `docs/plans/PLAN-*.md` のみ対象、`archived` 除外を明記 |
| R-I5 | §2.4 #11/#12 の方向性検証定義不足 | §2.4 で ②→④ と ④→② の検証根拠を分離 (manifest / coverage map 等) |
| R-I6 | add-* diff 判定の base 揺れ | §4.1 で canonical diff rule を固定 |
| R-I7 | vmodel_validator P1-only exit code 未定義 | §7.3 で `exit 2 = P1 warning のみ` を明記 |
| R-I8 | touched PLAN 0 件時の fail-close 未定義 | §7.4 で PLAN 必須 branch type と例外 branch type を表で定義 |
| R-I9 | pre-commit config 検証コマンド未明記 | §10.1 で `pre-commit run --all-files` 等の検証コマンドを明記 |

---

# §1 PLAN frontmatter スキーマ要件

PLAN ドキュメントの YAML frontmatter は **機械検証可能な必須フィールド** + **enum 制約** で構成する。`ut-tdd plan lint` (§7.1) が CI / pre-push で fail-close 動作する。

## 1.1 必須 9 フィールド (通常 variant)

```yaml
---
plan_id: PLAN-NNN-slug                       # 形式: PLAN-\d{3}(-[a-z0-9-]+)? または PLAN-MM-\d{3}
title: "PLAN-NNN: タイトル"
kind: impl                                    # §1.3 の 11 種から
layer: L4                                     # §1.4 の 16 種から
drive: be                                     # §1.6 の 9 種から
status: draft                                 # §1.2 の VALID_STATUSES から
agent_slots:                                  # §1.8 の役割スロット
  - role: tl
    slot_label: "TL — 設計判断"
generates:                                    # 双方向 trace の起点
  - artifact_path: src/foo.py
    artifact_type: python_module              # §1.7 の 19 種から
dependencies:                                 # 親 PLAN / 前提 PLAN / ブロック対象
  parent: PLAN-NNN-master                     # null 可
  requires: []
  blocks: []
---
```

## 1.1.poc kind=poc variant (Scrum 専用、R-C1 fix)

```yaml
---
plan_id: PLAN-NNN-slug
title: "..."
kind: poc                                     # 固定
layer: cross                                  # 固定
workflow_phase: S2                            # §1.5 から (S0-S4 のみ許容)
drive: scrum                                  # §1.6 の poc 対応 drive のみ許容
status: draft
decision_outcome: null                        # S4 到達時のみ §1.2.2 から指定
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

## 1.1.reverse kind=reverse variant (Reverse 専用、R-C1 fix)

```yaml
---
plan_id: PLAN-NNN-slug
title: "..."
kind: reverse
layer: cross
workflow_phase: R2                            # §1.5 から (R0-R4 のみ許容)
drive: reverse
status: draft
confirmed_reverse_type: code                  # §3.3 から (code / design / upgrade / normalization / fullback)
forward_routing: null                         # R4 到達時のみ §3.4 から指定
promotion_strategy: null                      # R4 到達時のみ §3.4 から指定
agent_slots:
  - role: tl
    slot_label: "TL — Reverse 主導"
generates: []
dependencies:
  parent: null
  requires: []
  blocks: []
---
```

## 1.1 排他制約 (validator が fail-close)

- `kind in [poc, reverse]` → `workflow_phase` 必須、`layer` は `cross` のみ許可
- `kind not in [poc, reverse]` → `layer` 必須、`workflow_phase` 禁止
- `kind=poc` → `workflow_phase ∈ {S0,S1,S2,S3,S4}` のみ許可 (R-I1 fix)
- `kind=reverse` → `workflow_phase ∈ {R0,R1,R2,R3,R4}` のみ許可 (R-I1 fix)
- `kind=poc + workflow_phase=S4` → `decision_outcome` 必須 (R-C1 fix)
- `kind=reverse + workflow_phase=R4` → `forward_routing` 必須
- `kind=reverse + workflow_phase=R4` → `promotion_strategy` 必須
- `kind=reverse` の起点は `decision_outcome=confirmed` の poc PLAN のみ許可。`rejected` / `pivot` から reverse へ接続する参照は exit 1

## 1.2 VALID_STATUSES (4 種)

| status | 意味 |
|--------|------|
| `draft` | 起票直後、未承認 |
| `confirmed` | TL 承認済み、実装/設計着手可 |
| `completed` | 工程完了、参照のみ |
| `archived` | 非アクティブ化、将来参照のみ |

## 1.2.2 VALID_DECISION_OUTCOMES (S4 outcome 専用、R-C1 fix)

`kind=poc` の `workflow_phase=S4` 到達時に必須。

| decision_outcome | 意味 | 後続経路 |
|------------------|------|----------|
| `confirmed` | 仮説検証成功、本実装へ昇格 | Reverse R0 へ接続 (`reverse` kind PLAN を新規起票) |
| `rejected` | 仮説却下、本実装しない | PLAN を `status=archived` に遷移 |
| `pivot` | 仮説修正、別方向で再検証 | 新規 `poc` kind PLAN を起票 (旧 PLAN は `archived`) |

## 1.3 VALID_KINDS (11 種)

| kind | 用途 | 主な layer | 経路 |
|------|------|------------|------|
| `design` | 設計 doc 起票 (D-API / D-DB / D-CONTRACT 等) | L1-L3 | 経路 1 |
| `impl` | 機能実装 (L4 Sprint) | L4 | 経路 1 |
| `poc` | 仮説検証 (Scrum S0-S4) | cross | 経路 2 |
| `reverse` | 設計復元 (Reverse R0-R4) | cross | 経路 2 |
| `add-design` | 既存設計への追補 | L2-L3 | 経路 3 |
| `add-impl` | 既存実装への機能追加 | L4 | 経路 3 |
| `refactor` | 機能変更なし内部改善 | L4 | 補助 |
| `retrofit` | 既存規約への合わせ込み | L4 | 補助 |
| `recovery` | session 断絶・認識ずれからの再開 | cross | 補助 1 |
| `troubleshoot` | バグ解析・障害対応 | L4 / L7 | 補助 1 |
| `research` | 技術調査 doc | L1-L2 | 経路 1 前段 |

## 1.4 VALID_LAYERS (16 種、L3.5 / L3.8 / L4.5 含む)

| layer | 名称 | 4 artifact 対応 (① 設計) |
|-------|------|--------------------------|
| `L0` | 基盤整備 (リポジトリ初期化) | — |
| `L1` | 要件定義 | 要件 / 受入条件 |
| `L2` | 全体設計 | CONCEPT / ADR |
| `L3` | 詳細設計 | D-API / D-DB / D-CONTRACT |
| `L3.5` | **機能設計** | endpoint / 関数 schema |
| `L3.8` | **TDD Red** | 先行単体テストコード / failing test |
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

| workflow_phase | 対応 kind | フェーズ |
|---------------|----------|----------|
| `S0` | poc | Backlog 構築 |
| `S1` | poc | Sprint Plan |
| `S2` | poc | PoC 実装 (`verify/*.sh` 化) |
| `S3` | poc | Verify (回帰蓄積) |
| `S4` | poc | Decide (decision_outcome 必須) |
| `R0` | reverse | Evidence Acquisition |
| `R1` | reverse | Observed Contracts (§3.3 で reverse_type 別 skip 判定) |
| `R2` | reverse | As-Is Design |
| `R3` | reverse | Intent Hypotheses (**po 検証**) |
| `R4` | reverse | Gap & Routing (forward_routing 必須) |

validator は `(kind, workflow_phase)` ペアが本表に存在しなければ fail-close。

## 1.6 VALID_DRIVES (9 種) + kind × drive 互換性 matrix (R-I2 fix)

### 9 種

| drive | 用途 | L5 (Visual Refinement) 要否 |
|-------|------|----------------------------|
| `be` | バックエンド / API / ロジック中心 | UI 変更時のみ |
| `fe` | UI / モック駆動 | **常に必要** |
| `fullstack` | BE + FE 同時 (Twin Track) | **常に必要** |
| `db` | スキーマ / データモデル中心 | UI 変更時のみ |
| `agent` | AI エージェント / プロンプト設計 | **常に必要** (会話 UI) |
| `scrum` | 仮説検証 (経路 2 専用) | — |
| `reverse` | 既存コード逆引き (経路 2 専用) | — |
| `poc` | PoC 単独実装時 | — |
| `troubleshoot` | 緊急対応 (補助 1 専用) | — |

### kind × drive 許可 matrix (R-I2 fix)

| kind | 許可 drive |
|------|-----------|
| `design` | `be / fe / fullstack / db / agent` |
| `impl` | `be / fe / fullstack / db / agent` |
| `poc` | `scrum / poc` |
| `reverse` | `reverse` |
| `add-design` | `be / fe / fullstack / db / agent` (親 PLAN と一致必須) |
| `add-impl` | `be / fe / fullstack / db / agent` (親 PLAN と一致必須) |
| `refactor` | `be / fe / fullstack / db / agent` |
| `retrofit` | `be / fe / fullstack / db / agent` |
| `recovery` | `troubleshoot` |
| `troubleshoot` | `troubleshoot` |
| `research` | `be / fe / fullstack / db / agent` |

validator は本表で組み合わせ違反を fail-close。

## 1.7 VALID_ARTIFACT_TYPES (19 種、test_design / test_code 分離済)

| artifact_type | 用途 | V-model |
|---------------|------|---------|
| `design_doc` | 設計ドキュメント | ① |
| `adr_snapshot` | ADR 凍結スナップショット | ① |
| `skill_doc` | UT-TDD 正本化済み skill doc (`docs/skills/*.md`) | — |
| `markdown_doc` | 一般 markdown ドキュメント | — |
| `doc_update` | 既存 doc の更新 | — |
| `python_module` | Python モジュール | ② |
| `script` | Bash / PowerShell スクリプト。Windows 配布で必要な `.ps1` shim は提供対象 | ② |
| `cli_extension` | CLI コマンド拡張 | ② |
| `template` | テンプレートファイル | — |
| `test_design` | **テスト設計ドキュメント** | **③** |
| `test_code` | **テストコード** | **④** |
| `hook` | Git / CI hook | — |
| `schema_migration` | DB スキーママイグレーション | ② |
| `config` | 設定ファイル (汎用) | — |
| `yaml_config` | YAML 設定 | — |
| `json_config` | JSON 設定 | — |
| `workflow_config` | GitHub Actions workflow / harness YAML | — |
| `github_config` | GitHub 関連設定 (CODEOWNERS / PR template 等) | — |
| `other` | 上記に該当しないもの | — |

## 1.8 VALID_ROLES (7 種) + 必須 role 条件 (R-I3 fix)

### 7 種

| role | 主担当 |
|------|--------|
| `po` | 発注元 — 受入条件・R3 Intent 検証・リリース承認 |
| `tl` | 技術責任者 — 設計判断 / G2-G3 ゲート |
| `qa` | 品質責任者 — テスト戦略 / G4-G6 ゲート |
| `aim` | AI実装・保守 |
| `uiux` | UI/UX デザイン |
| `se` | 実装委譲先 — Codex / Claude Code |
| `docs` | ドキュメント担当 |

### kind × layer × drive 別の必須 role (R-I3 fix)

validator は以下条件を fail-close 検証:

| 条件 | 必須 role |
|------|-----------|
| `kind in [design, impl, add-design, add-impl]` の任意 PLAN | **`tl` 必須** |
| `kind=impl / add-impl` の L4 PLAN | **`qa` 追加必須** |
| `kind=poc / recovery / troubleshoot` の任意 PLAN | **`aim` 必須** |
| `drive in [fe, fullstack, agent]` かつ `layer in [L3, L3.5, L5]` | **`uiux` 必須** |
| `layer=L1`(要件定義) または `layer=L8`(受入) | **`po` 必須** |
| `kind=reverse + workflow_phase=R3`(Intent 検証) | **`po` 必須** |
| `kind=recovery` | **`aim` 必須** (本文 7 セクションのため) |

`se` と `docs` は任意 role (実装委譲・ドキュメント担当を slot に立てる場合のみ)。

## 1.9 dependencies スキーマ

```yaml
dependencies:
  parent: PLAN-NNN-master | null              # Master Plan 親 (任意)
  requires:                                   # 前提完了 PLAN リスト (status=completed 必須)
    - PLAN-MMM-slug
  blocks:                                     # ブロックされる後段 PLAN
    - PLAN-LLL-slug
  references:                                 # (任意) 参照のみ
    - PLAN-KKK-slug
```

validator は `requires` の各 PLAN の `status=completed` を機械検証。

## 1.10 受入条件 (frontmatter スキーマ、R-C2 / R-I4 / R-P1 fix)

### 対象 path (R-I4 fix)

- 対象: `docs/plans/PLAN-*.md` glob のみ
- 除外: PLAN frontmatter で `status: archived` のもの
- 例外 path (lint 対象外): `docs/plans/archive/`, `docs/plans/_template/`

### 機械検証条件 (R-C2 fix)

#### A. plan_id

- [ ] 形式が `^PLAN-\d{3}(-[a-z0-9-]+)?$` または `^PLAN-MM-\d{3}$` に一致 (`ut-tdd plan lint` で正規表現検証)
- [ ] リポジトリ内で plan_id がユニーク (重複検出 → exit 1)

#### B. enum 検証

- [ ] `kind` ∈ §1.3 VALID_KINDS (11 種) — 違反 → exit 1
- [ ] `layer` ∈ §1.4 VALID_LAYERS (16 種、`cross` 含む) — 違反 → exit 1
- [ ] `drive` ∈ §1.6 VALID_DRIVES (9 種) — 違反 → exit 1
- [ ] `status` ∈ §1.2 VALID_STATUSES (4 種) — 違反 → exit 1
- [ ] `workflow_phase` ∈ §1.5 VALID_WORKFLOW_PHASES (使用時のみ、10 種) — 違反 → exit 1
- [ ] `decision_outcome` ∈ §1.2.2 VALID_DECISION_OUTCOMES (kind=poc + workflow_phase=S4 のみ、3 種) — 違反 → exit 1
- [ ] `generates[].artifact_type` ∈ §1.7 VALID_ARTIFACT_TYPES (19 種) — 違反 → exit 1
- [ ] `agent_slots[].role` ∈ §1.8 VALID_ROLES (7 種) — 違反 → exit 1

#### C. 排他制約

- [ ] §1.1 排他制約のすべてに合致
- [ ] §1.5 `(kind, workflow_phase)` ペアが許可表に存在
- [ ] §1.6 `(kind, drive)` ペアが kind × drive 許可 matrix に存在 (R-I2)
- [ ] `kind=add-*` の場合、`drive` が親 PLAN の `drive` と一致

#### D. 必須 role

- [ ] §1.8 の必須 role 条件をすべて満たす (kind/layer/drive/gate ごとの必須 role が agent_slots に存在)

#### E. dependencies

- [ ] `dependencies.requires` の各 PLAN が `status=completed` (未完了 PLAN を requires に持つ → exit 1)
- [ ] `dependencies.parent` が存在する場合、当該 PLAN が repo 内に存在
- [ ] `kind=add-*` の場合、`dependencies.parent` が必須 (null 不可)

#### F. enum source-of-truth と drift 検知 (R-P1 fix)

- **正本**: 本書 §1 の各 enum 表が正本。
- **validator 同期方針**: `src/ut_tdd/plan_validator.py` の VALID_* リテラルは本書 §1 表から手動同期。drift 検知のため、`src/ut_tdd/plan_validator.py` 冒頭に「最終同期: requirements vM.N §1.X」コメントを必須化、`ut-tdd doctor` が本書の更新日と validator のコメントを比較し 30 日以上乖離なら warning。
- **将来移行**: 将来的に enum を YAML schema ファイル (`docs/governance/schema/frontmatter-schema.yaml`) に切り出して両者が読み込む構造にする (個別 PLAN-XXX で詳細設計)。

---

# §2 V-model 4 artifact 工程要件

## 2.1 4 artifact の物理配置

| Artifact | 配置場所 | artifact_type | 命名規約 |
|----------|----------|---------------|----------|
| ① 設計 | `docs/design/<feature>/<name>.md` | `design_doc` | 例: `D-API-audit.md` |
| ② 実装コード | `src/...` | `python_module` / `script` / `cli_extension` 等 | 言語標準 |
| ③ テスト設計 | `docs/test-design/<feature>/<name>-test-design.md` | `test_design` | 例: `D-API-audit-test-design.md` |
| ④ テストコード | `tests/...` | `test_code` | 例: `test_audit.py` |

## 2.2 3 段階 freeze の fail-close 条件

### 段階 A: Pair freeze (設計⇔テスト設計、L4 前)

| ゲート | Pair freeze 対象 | fail-close 条件 |
|--------|------------------|------------------|
| **G1** 要件完了 | L1 ① 要件 doc ⇔ L1 ③ 受入テスト設計 | 片方欠落 → fail |
| **G2** 設計凍結 | L2 ① CONCEPT/ADR ⇔ L2 ③ 総合テスト設計 | 片方欠落 → fail |
| **G3** 実装着手 | L3 ① D-API/D-DB ⇔ L3 ③ 結合テスト設計、L3.5 ① 機能設計 ⇔ L3.5 ③ 単体テスト設計 | 片方欠落 → fail |

### 段階 B: 4 artifact trace freeze (L4 後)

| ゲート | trace freeze 対象 | fail-close 条件 (R-C3 fix で統一) |
|--------|------------------|------------------------------------|
| **G4** 実装凍結 | 以下 3 条件をすべて満たす: ① 4 artifact (① + ② + ③ + ④) 揃い / ② §2.4 の **必須 8 directed edge** すべて満たす / ③ カバレッジ ≥ 80% | いずれか欠落 → exit 1 |

### 段階 A2: TDD Red freeze (④ テストコード先行、L4 前)

G3 通過後、L4 実装へ入る前に、L3.5 単体テスト設計に対応する ④ 単体テストコードを先行作成する。対象テストは未実装の ② 実装理由で fail してよいが、構文エラー・import 経路不備・fixture 不備で fail してはいけない。

| ゲート | Red freeze 対象 | fail-close 条件 |
|--------|------------------|------------------|
| **G3.8** TDD Red 固定 | L3.5 ③ 単体テスト設計 ⇔ L3.8 ④ 先行単体テストコード | ③ に対応する ④ が無い / テストが収集不能 / 失敗理由が未実装以外 → fail |

## 2.3 双方向 trace の記述要件

| Pair / 方向 | 記述方法 | 例 |
|------------|----------|----|
| ① 設計 → ② 実装コード | 設計に「実装ファイル: `<path>`」 | `実装ファイル: src/audit.py` |
| ② 実装コード → ① 設計 | docstring に「契約: `<doc>` §`<n>`」 | `"""契約: docs/design/L3-D-API.md §3.1"""` |
| ① 設計 → ③ テスト設計 | 設計に「テスト設計: `<path>`」 | `テスト設計: docs/test-design/L3.5-audit-unit-test-design.md` |
| ③ テスト設計 → ① 設計 | テスト設計に「対象設計: `<doc>` §`<n>`」 | `対象設計: docs/design/L3-D-API.md §3.1` |
| ③ テスト設計 → ④ テストコード | テスト設計に「テスト実装: `<path>`, U-XXX-NNN 対応」 | `テスト実装: tests/test_audit.py, U-AUD-001〜023` |
| ④ テストコード → ③ テスト設計 | docstring に「DoD 検証: `<doc>` U-XXX-NNN」 | `"""DoD 検証: docs/test-design/L3.5-audit-unit-test-design.md U-AUD-001"""` |

## 2.4 双方向 12 directed edge の検証要件 (R-I5 fix)

4 artifact は無向 6 pair = 双方向 12 directed edge。G4 では以下 **必須 8 directed edge** を fail-close 検証する (残り 4 directed edge は warn 推奨):

| # | Directed edge | Pair | 検証方法 | 必須 |
|---|--------------|------|----------|------|
| 1 | ① 設計 → ② 実装コード | ①⇔② | 設計 doc 内に「実装ファイル: `<path>`」が存在し、参照先 path が repo 内に存在 | ✓ |
| 2 | ② 実装コード → ① 設計 | ①⇔② | 実装ファイル docstring に「契約: `<doc>` §`<n>`」が存在し、参照先が #1 と相互一致 | ✓ |
| 3 | ① 設計 → ③ テスト設計 | ①⇔③ | 設計 doc 内に「テスト設計: `<path>`」が存在し、参照先が repo 内に存在 | ✓ |
| 4 | ③ テスト設計 → ① 設計 | ①⇔③ | テスト設計 doc に「対象設計: `<doc>` §`<n>`」が存在し、参照先が #3 と相互一致 | ✓ |
| 5 | ③ テスト設計 → ④ テストコード | ③⇔④ | テスト設計 doc に「テスト実装: `<path>`, U-XXX-NNN 対応」が存在し、参照先 test_*.py が repo 内に存在 | ✓ |
| 6 | ④ テストコード → ③ テスト設計 | ③⇔④ | テストコード docstring に「DoD 検証: `<doc>` U-XXX-NNN」が存在し、参照先が #5 と相互一致 | ✓ |
| 7 | ② 実装コード → ④ テストコード | ②⇔④ | 実装 PLAN の `generates` に test_code 成果物があり、`tests/` 配下に対応 test_*.py が存在 | ✓ |
| 8 | ④ テストコード → ② 実装コード | ②⇔④ | テストコード内に対応 `src/` モジュールへの `import` または相対参照が存在 (R-I5: manifest / coverage map / import graph のいずれかで検証) | ✓ |
| 9 | ① 設計 → ④ テストコード | ①⇔④ | (派生: #3 + #5 経由で推論可能) | warn |
| 10 | ④ テストコード → ① 設計 | ①⇔④ | (派生: #6 + #4 経由で推論可能) | warn |
| 11 | ② 実装コード → ③ テスト設計 | ②⇔③ | (派生: #2 + #3 経由で推論可能) | warn |
| 12 | ③ テスト設計 → ② 実装コード | ②⇔③ | (派生: #4 + #1 経由で推論可能) | warn |

## 2.5 QA 追加テストの分離 (V-model 補足)

| テスト種別 | 担当 | 設計 doc | タイミング |
|-----------|------|----------|------------|
| 単体テスト | aim / se | L3.5 単体テスト設計 | L4 Sprint 内 |
| 結合テスト | aim / se | L3 結合テスト設計 | L4.5 |
| **QA 追加テスト** (regression / exploratory / edge-case) | qa | **`docs/test-design/L6-qa-additional-test-design.md`** | L6 統合検証 |
| 総合テスト (E2E) | qa / aim | L2 総合テスト設計 | L6 |
| 受入テスト | po / qa | L1 受入テスト設計 | L8 受入 |

`vmodel_lint` は L3/L3.5 設計 doc 内に L6 QA テスト記述があれば **P1 (warning)** を出す。

実装後レビューで見つかった不足観点は、以下のどちらかで扱う。

- **仕様・受入の不足**: `add-design` / `add-impl` として差分 PLAN を起票し、再度 Pair freeze / Red freeze / trace freeze を通す。
- **品質保証観点の追加**: L6 QA 追加テスト設計を先に正本化し、その後で対応する追加テストコードを書く。L3/L3.5 の frozen test design には混ぜない。

### L6 QA 追加テストの正本化ルール

L6 QA 追加テストは、レビュー指摘から直接 `tests/` を増やしてはいけない。必ず以下の順序で作成する。

1. `docs/test-design/<feature>/L6-qa-additional-test-design.md` に追加観点、対象リスク、対象仕様/実装、test id (`QA-XXX-NNN`) を記録する。
2. 追加テストコードを `tests/` に作成し、docstring またはコメントに `DoD 検証: docs/test-design/<feature>/L6-qa-additional-test-design.md QA-XXX-NNN` を記述する。
3. `vmodel_lint` は L6 追加テストコードから L6 QA 追加テスト設計への trace が無い場合、P0 fail-close とする。
4. 追加観点が仕様不足や受入条件変更を意味する場合は、L6 追加テストではなく `add-design` / `add-impl` に差し戻す。

## 2.6 逆ピラミッド検出 (P0 severity)

| 検出 | severity | 動作 |
|------|----------|------|
| ① ② 存在、③ ④ 無し | **P0** | G3 / G4 で fail-close (マージ不可) |
| ① ② 存在、③ あり ④ 無し | P1 | warning + carry 候補 |

## 2.7 受入条件 (V-model 工程、R-C3 fix で統一)

- [ ] G1-G3 通過時に Pair freeze (①⇔③) 不在 → exit 1
- [ ] G3.8 通過時に L3.5 ③ に対応する先行 ④ 単体テストコードが存在し、未実装理由の failing test として収集可能
- [ ] G4 通過時に **以下 3 条件をすべて満たす** (いずれか欠落 → exit 1):
  - [ ] 4 artifact (①+②+③+④) 揃い
  - [ ] §2.4 の **必須 8 directed edge** すべて pass
  - [ ] カバレッジ ≥ 80%
- [ ] L3/L3.5 設計 doc 内に L6 QA 追加テスト記述があれば P1 warning
- [ ] L6 QA 追加テストコードが L6 QA 追加テスト設計 doc への trace を持たなければ P0 fail-close
- [ ] 逆ピラミッド (① ② のみ存在) → P0 fail-close

---

# §3 経路 2: Scrum × Reverse 30 cell matrix 要件

## 3.1 30 cell matrix の意義

Scrum で確定した仮説 (`scrum_type` 6 種) と本実装に昇格させるための Reverse 経路 (`reverse_type` 5 種) を機械的に組み合わせ、各 cell に Primary 推奨を持たせる。R1 skip 判定は §3.3 で `reverse_type` を主キーに行う (構想書 v3.0 §4.4 確定)。

## 3.2 30 cell の Primary mapping (推奨)

|  | reverse: code | reverse: design | reverse: upgrade | reverse: normalization | reverse: fullback |
|--|--------------|-----------------|------------------|------------------------|-------------------|
| **hypothesis-test** | **Primary** | Alt | Alt | Alt | Alt |
| **tech-spike** | Alt | **Primary** | Alt | Alt | Alt |
| **design-spike** | Alt | **Primary** | Alt | Alt | Alt |
| **perf-spike** | Alt | Alt | **Primary** | Alt | Alt |
| **security-spike** | **Primary** | Alt | Alt | Alt | Alt |
| **ux-spike** | Alt | **Primary** | Alt | Alt | Alt |

`scrum_reverse_lint` は Primary 外の選択を warning のみで許容、Alt cell でも fail にはしない。

### S4 outcome ごとの接続ルール

| decision_outcome | 許可される次工程 | 禁止 |
|------------------|------------------|------|
| `confirmed` | `reverse` kind PLAN を新規起票し、R0 から開始 | poc/* から main 直 merge |
| `rejected` | PLAN を `archived` にして終了 | reverse 起票 / feature 昇格 |
| `pivot` | 旧 PLAN を `archived` にし、新規 `poc` kind PLAN を S0 から起票 | 旧 PoC の reverse 起票 / feature 昇格 |

`scrum_reverse_lint` は reverse PLAN の `dependencies.requires` または `references` が `decision_outcome=confirmed` の poc PLAN を指していることを検証する。未確認 PoC、rejected、pivot への参照は exit 1。

## 3.3 R1 (Observed Contracts) 実施/skip の判定

R1 skip 判定は **解決済み `confirmed_reverse_type` を主キーとする** (構想書 v3.0 §4.4 確定):

| confirmed_reverse_type | R1 (Observed Contracts) |
|------------------------|--------------------------|
| `code` | **実施** (PoC コードから契約抽出が中核) |
| `design` | **skip** (デザイン資産起点、R2 で起こす) |
| `upgrade` | **実施** (既存版と新版差分から契約抽出) |
| `normalization` | **skip** (設計 drift 修正、R2 で normalize) |
| `fullback` | **実施** (実装完遂後の文書整合、R1 で文書 gap 抽出) |

`scrum_reverse_lint` は `(confirmed_reverse_type, workflow_phase=R1)` ペアが skip 対象 (`design` / `normalization`) であれば exit 1。

## 3.4 経路 2 → 経路 1 合流のルール

R4 outcome の `forward_routing` で Forward 接続点を明示:

| forward_routing | 合流先 |
|-----------------|--------|
| `L1` | Forward L1 (要件) — 仮説確定だが要件構造化未了 |
| `L2` | Forward L2 (全体設計) |
| `L3` | Forward L3 (詳細設計) |
| `gap-only` | Forward Backlog (新 PLAN 起票)、L1 から再開 |

R4 outcome の `promotion_strategy` で PoC / 検証成果物の扱いを明示:

| promotion_strategy | 意味 | 必須条件 |
|--------------------|------|----------|
| `reuse-as-is` | PoC 成果を最小修正で機能化する | 既に設計 trace / テスト設計 / Red test / security check が揃う。PoC 直 merge ではなく feature PR で再検証 |
| `reuse-with-hardening` | PoC 成果を土台に本番品質へ補強する | 追加の design/test-design、security/performance hardening PLAN、回帰テストを追加 |
| `redesign` | PoC は知見だけ採用し、実装は再設計する | R4 gap から L1/L2/L3 のいずれかに戻り、PoC コードは main に入れない |
| `discard` | PoC 成果を採用しない | rejected 相当の知見として archive。feature 昇格不可 |

判定基準:

- 契約・セキュリティ・データモデル・運用要件が PoC と本番で同等なら `reuse-as-is` 候補。
- 非機能要件、認証/認可、データ永続化、監査、パフォーマンス、運用設計が不足するなら `reuse-with-hardening` または `redesign`。
- PoC が仮説検証専用の throwaway code、mock、手作業前提、外部 API/secret 直書き、テスト欠落を含むなら `redesign`。
- 検証結果が目的に合わないなら `discard`。

`reuse-as-is` / `reuse-with-hardening` でも `poc/*` から main へ直接 merge してはいけない。必ず `feature/*` PR として Forward の Pair freeze / Red freeze / trace freeze / harness-check を通す。

## 3.5 受入条件 (経路 2)

- [ ] kind=poc PLAN は frontmatter に `scrum_type` (= S0-S2 までは null 可、S3 以降必須) を持つ
- [ ] kind=poc + workflow_phase=S4 は `decision_outcome` 必須 (R-C1)
- [ ] kind=reverse PLAN は frontmatter に `confirmed_reverse_type` を必須
- [ ] kind=reverse PLAN は `decision_outcome=confirmed` の poc PLAN だけを起点にできる
- [ ] `decision_outcome=rejected/pivot` の poc PLAN から reverse / feature 昇格する参照は exit 1
- [ ] R1 phase の PLAN は §3.3 の R1 実施対象 `confirmed_reverse_type` のみ許容 (skip 対象は exit 1)
- [ ] R4 完了 PLAN は `forward_routing` を必須 (§3.4 の 4 値)
- [ ] R4 完了 PLAN は `promotion_strategy` を必須 (§3.4 の 4 値)
- [ ] `promotion_strategy=reuse-as-is` は trace / test / security 条件が揃わなければ exit 1
- [ ] `promotion_strategy in [reuse-as-is, reuse-with-hardening]` でも feature PR で Forward gate を通さなければ main merge 不可
- [ ] poc/* ブランチから main への直 PR は §6.4 で物理ブロック

---

# §4 経路 3: add-* 受入条件

## 4.1 add-design / add-impl の禁則 (3 原則、R-I6 fix で canonical 化)

### canonical diff rule

| 検出対象 | 検出コマンド (canonical) |
|---------|------------------------|
| 既存設計ファイルの変更/削除 | `git diff --name-only --diff-filter=DM origin/main...HEAD -- docs/design/` |
| 既存テストコードの変更/削除 | `git diff --name-only --diff-filter=DM origin/main...HEAD -- tests/` |
| 新規ファイルの追加 | `git diff --name-only --diff-filter=A origin/main...HEAD -- <path>` (許容) |

- `origin/main...HEAD` (3 dots) で merge base からの差分を取得
- `--diff-filter=DM` で D(削除) と M(変更) のみ抽出
- `--diff-filter=A` で A(追加) のみ抽出

### 禁則 → fail-close

| 原則 | 機械検証 |
|------|----------|
| **既存設計を改変しない** | canonical diff rule の検出対象 `docs/design/` で `--diff-filter=DM` が non-empty → exit 1 |
| **既存テストを変更しない** | canonical diff rule の検出対象 `tests/` で `--diff-filter=DM` が non-empty → exit 1 |
| **回帰確認必須** | `harness-check` 内で既存テスト全 PASS を確認、未通過 → exit 1 |

## 4.2 add-* PLAN の frontmatter 要件

- `dependencies.parent` で既存 PLAN を必須指定 (null 不可)
- `drive` は親 PLAN と一致 (§1.6 kind × drive matrix で fail-close)
- `kind=add-design` PLAN の `generates` には新規 `design_doc` + 新規 `test_design` のペアを必須
- `kind=add-impl` PLAN の `generates` には新規 `python_module/script/cli_extension` 等 + 新規 `test_code` を必須

## 4.3 双方向 reference 更新

add-* 完了時、既存 PLAN との双方向 reference を更新:

- 親 PLAN の `dependencies.references` に子 add-* PLAN ID を追加
- 子 PLAN の `dependencies.parent` を必須

## 4.4 受入条件 (経路 3)

- [ ] `kind=add-*` の PLAN は `dependencies.parent` 必須 (null → exit 1)
- [ ] `drive` が親 PLAN と一致 (不一致 → exit 1)
- [ ] §4.1 canonical diff rule で `docs/design/` または `tests/` の DM が non-empty → exit 1
- [ ] 既存テスト回帰 PASS なら harness-check 通過、いずれか fail → exit 1
- [ ] 親 PLAN の `references` 更新が PR に含まれる (validator が機械検証)

---

# §5 補助 1: 緊急経路 (recovery / hotfix) 受入条件

## 5.1 recovery kind の本文 7 必須セクション

| # | セクション header | 内容 |
|---|------------------|------|
| 1 | `## §1 事故記録` | timestamp / impact / 検知元 |
| 2 | `## §2 議論順序 timeline` | 発生 → 検知 → 対応の時系列 |
| 3 | `## §3 認識訂正履歴` | 当初仮説 → 実際の状況の差分 |
| 4 | `## §4 中間結論 list` | 対応中に判明した中間判断 |
| 5 | `## §5 context 再構築` | session 復帰時に必要な前提 |
| 6 | `## §6 再開ポイント` | 次セッションでどこから再開するか |
| 7 | `## §7 再発防止` | 観点リスト / CI チェック追加案 |

`ut-tdd plan lint` は recovery kind PLAN の本文に上記 7 セクション header (h2、`## §N <名称>` 形式) があるか機械検証。1 つでも欠落 → exit 1。

## 5.2 hotfix ブランチの要件

| 要件 | 機械検証 |
|------|----------|
| `hotfix/*` ブランチからの PR は postmortem doc を必須 | PR body に `## Postmortem` セクションがある (`harness-check` の `hotfix-postmortem-required` subjob) |
| postmortem doc は `docs/postmortem/<plan-id>.md` に配置 | path 存在確認 |
| `hotfix/*` PR は recovery kind PLAN へリンク | PR body に `recovery PLAN: PLAN-XXX` の記述 |
| postmortem 完了期限 | merge 完了から 48h (P0/P1 のみ必須、§5.2.1) |

### 5.2.1 postmortem 48h SLA の起算と severity 判定 (R-P2 fix)

| 項目 | 仕様 |
|------|------|
| **起算 timestamp** | hotfix PR の merge 完了時刻 (`gh api` の `merged_at`) |
| **severity source** | `recovery PLAN` 本文の §1 事故記録に `severity: P0 \| P1 \| P2 \| P3` を必須記述、これを source-of-truth とする |
| **対象範囲** | `severity ∈ {P0, P1}` のみ 48h SLA 適用、P2/P3 は SLA なし |
| **自動 reminder** | weekly cron `escalation-stale.yml` が `merged_at + 48h` を超過した未 close postmortem を検出し、PR に `postmortem-overdue` label を自動付与 |

## 5.3 session 終了前 fail-close (4 項目、R-C4 fix で fail-close と warning を明示分離)

ローカル pre-push hook が以下 4 項目を検証:

| # | 項目 | 検証方法 | 判定 |
|---|------|----------|------|
| 1 | **設計 ⇔ 実装 ⇔ テストの整合性** | `vmodel_lint` 軽量版 (current branch の差分対象のみ、§2.4 必須 8 directed edge の P0 のみ検査) | **fail-close (exit 1)** |
| 2 | **未 commit ファイルの取り残し** | `git status --porcelain` が non-empty | **fail-close (exit 1)** |
| 3 | **認識ずれの記録** | session 中に `failure_log.jsonl` 追記があれば recovery PLAN 起票推奨 | **warning** (exit 0、stderr) |
| 4 | **次セッションへの引き継ぎメモ** | `.ut-tdd/handover/CURRENT.md` の `updated_at` が 24h 以内 | **warning** (exit 0、stderr) |

→ item 1-2 は push を中止、item 3-4 は push 続行 + warning。

## 5.4 受入条件 (補助 1、R-C4 fix で §5.3 と整合)

- [ ] kind=recovery PLAN は本文 7 セクション header (`## §N`) を持つ (validator が機械検証)
- [ ] hotfix/* PR は postmortem doc + recovery PLAN リンクを必須
- [ ] pre-push hook が §5.3 の判定列に従う:
  - item 1 (vmodel 整合) と item 2 (未 commit) → fail-close (exit 1)
  - item 3 (failure_log) と item 4 (handover) → warning (exit 0、stderr 出力)
- [ ] §5.2.1 の SLA 起算 (`merged_at + 48h`) を超過した未 close postmortem に `postmortem-overdue` label が自動付与

---

# §6 補助 2: GitHub 統制要件

## 6.1 ブランチタイプ × kind の対応 (R-C5 fix で全 11 kind 網羅)

`branch-kind-check` (§7.4) が PR 起票時に prefix と PLAN kind の整合を機械検証する。

| ブランチ prefix | 対応 kind | 用途 |
|----------------|-----------|------|
| `feature/*` | `impl` | 通常実装 (経路 1) |
| `design/*` | `design` (R-C5 fix) | 設計 doc 起票 (経路 1) |
| `research/*` | `research` (R-C5 fix) | 技術調査 (経路 1 前段) |
| `poc/*` | `poc` | 仮説検証 (経路 2 Scrum) |
| `reverse/*` | `reverse` | 設計復元 (経路 2 Reverse) |
| `add/*` | `add-impl` / `add-design` | 既存拡張 (経路 3) |
| `hotfix/*` | `recovery` / `troubleshoot` | 緊急 (補助 1) |
| `refactor/*` | `refactor` / `retrofit` | 内部改善 |
| `docs/*` | (PLAN 不要、例外) | ドキュメントのみ修正 (§7.4 例外 branch) |
| `chore/*` | (PLAN 不要、例外) | 雑務 (依存更新、CI 設定変更等) |

`docs/*` と `chore/*` は PLAN 起票不要の例外 branch (§7.4 で `branch-kind-check` の対象外として扱う)。ただし `docs/skills/*.md` の追加・更新は harness behavior に影響するため例外扱いしない。`skill_doc` 成果物を持つ PLAN 付き branch (`design/*` または `add/*`) で扱う。

## 6.2 Required Status Checks の集約方針

**`harness-check` ワークフロー 1 本のみを Branch Protection の Required Status Checks に指定**。

- 全 PR 共通の必須 check は `harness-check` のみ
- `harness-check` 内部で branch prefix を識別し、branch type 別 subjob を呼び分け
- branch type 別の subjob (例: `poc-no-merge-guard`, `hotfix-postmortem-required`) は `harness-check` 内で呼ばれるため自動的に merge gate となる
- Required Status Checks には登録しない (集約された `harness-check` のみで gate)

実装詳細 (job 定義 / step 順序 / 並列度) は将来の個別 PLAN-XXX で詳細設計する。

## 6.3 harness-check 内 subjob リスト + branch type 適用 matrix (R-C8 fix)

| subjob | feature | design | research | poc | reverse | add | hotfix | refactor | docs | chore |
|--------|---------|--------|----------|-----|---------|-----|--------|----------|------|-------|
| `plan-lint` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| `vmodel-lint` | ✓ | ✓ | — | — | — | ✓ | — | ✓ | — | — |
| `branch-kind-check` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| `scrum-reverse-lint` | — | — | — | ✓ | ✓ | — | — | — | — | — |
| `poc-no-merge-guard` | — | — | — | ✓ | — | — | — | — | — | — |
| `hotfix-postmortem-required` | — | — | — | — | — | — | ✓ | — | — | — |
| `commitlint` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `regression-test` | ✓ | — | — | — | — | ✓ | ✓ | ✓ | — | — |

→ `harness-check` 内部で適用 subjob を選択し、非適用 subjob は **`skipped` ステータス** で報告 (PR の Checks タブには表示されるが gate に影響しない)。

`harness-check` は PR 通過要件の正本である。ローカル hook は開発者体験と手戻り削減のための早期検知に限定し、全量テスト・重い検証・回帰確認は GitHub Actions 上で実行する。

## 6.4 poc → main 直 merge 物理ブロック

| 要件 | 仕様 |
|------|------|
| event trigger | `harness-check.yml` は `pull_request: branches: [main]` event で実行 |
| 検出ロジック | PR head が `poc/*` で base が `main` なら subjob `poc-no-merge-guard` が exit 1 |
| 例外 | なし (poc/* は S4 confirmed 後に Reverse → feature/* で再 PR する) |

## 6.5 CODEOWNERS bootstrap 2-stage

### Phase 0-A (リポジトリ初期化、CODEOWNERS なし)

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
- [ ] `harness-check` 内で §6.3 matrix に従い 8 subjob が branch type 別に呼ばれる
- [ ] 非適用 subjob は `skipped` ステータスで報告 (R-C8)
- [ ] poc/* → main の PR が `poc-no-merge-guard` で exit 1
- [ ] hotfix/* → main の PR が postmortem doc + recovery PLAN リンクなしで exit 1
- [ ] 全 commit が Conventional Commits 形式 (commitlint subjob で検証)
- [ ] Phase 0-A → 0-B 2-stage で CODEOWNERS bootstrap

---

# §7 機械検証要件

## 7.1 ut-tdd CLI 構成

`ut-tdd` は **薄い OS 別ラッパー + Python core** で実装する。Windows / macOS / Linux の entrypoint は同一 Python core を呼び、OS 差分は wrapper 層に閉じ込める。Windows では PowerShell entrypoint を提供し、Git Bash が必要な既存 hook / shell script は明示的に bridge する。

```
scripts/
├── ut-tdd                    # POSIX / Git Bash ディスパッチャ
├── ut-tdd.ps1                # Windows PowerShell ディスパッチャ
├── ut-tdd-plan-lint.sh
├── ut-tdd-vmodel-lint.sh
├── ut-tdd-doctor.sh
├── ut-tdd-gate.sh
├── install-hooks.sh
├── install-hooks.ps1
└── python_cmd.sh
```

PowerShell と POSIX shell の entrypoint は同じ `python -m ut_tdd.cli` を呼び、検証結果と exit code を一致させる。`scripts/` 配下は薄い entrypoint / installer / CI helper に限定し、validator や runtime 判定などの実体は `src/ut_tdd/` に置く。OS 片系だけが通る状態は Phase 0 受入不可とする。

### 実行モード検出

`ut-tdd` は Claude Code / Codex 連携を必須にしない。起動時に runtime を検出し、以下の mode を `.ut-tdd/state/runtime.json` に記録する。

| mode | 検出条件 | 動作方針 |
|------|----------|----------|
| `claude-only` | `.claude/` 設定または Claude Code hook が存在し、Codex CLI が未検出 | Claude hook / prompt 生成 / handover を有効化。Codex 委譲は `not-available` |
| `codex-only` | `AGENTS.md` または Codex CLI が存在し、Claude Code runtime が未検出 | Codex TL 駆動 / review / plan lint / doctor を有効化。Claude hook 操作は `not-available` |
| `hybrid` | Claude Code runtime と Codex CLI の両方を検出 | `team run` / role delegation / cross-agent handover を有効化 |
| `standalone` | どちらも未検出 | `setup` / `doctor` / `plan lint` / `vmodel lint` / `gate` のローカル検証のみ有効化 |

`runtime.json` は generated state とし、Git 管理しない。`ut-tdd status --json` は `mode`, `available_runtimes`, `missing_runtimes`, `optional_adapters`, `enabled_commands`, `disabled_commands`, `next_action` を返す。

### 複数 AI orchestration

`hybrid` mode または `task-capable` 以上の optional adapter が複数ある場合、`ut-tdd team run` は以下の原則で role を割り当てる。モデルの実名は頻繁に変わるため、要件定義では能力クラスを正本とし、実モデル名は `.ut-tdd/teams/*.yaml` または local override で指定する。

| capability_class | 用途 | 推奨割当 | 禁止事項 |
|------------------|------|----------|----------|
| `frontier-reviewer` | 要件分解、設計判断、R4 合流判定、G2/G3/G4 レビュー、security/design critique | 現在作業中の AI とは別 provider / 別 runtime の最上位モデルクラス | 自分が生成した設計を単独承認すること |
| `worker` | 実装、テスト追加、ドキュメント更新、リファクタ、機械的修正 | 実行コストと速度のバランスがよい実装向けモデルクラス | 要件・設計・受入条件を独断で変更すること |
| `fast-checker` | lint 補助、要約、差分分類、チェックリスト生成、smoke 診断 | 低コスト高速モデルクラス | merge 可否や設計承認を出すこと |

#### role × capability_class matrix

| role | primary class | fallback | 備考 |
|------|---------------|----------|------|
| `tl` | `frontier-reviewer` | current runtime self-review + P1 warning | 設計判断、G2/G3、R4、promotion_strategy |
| `qa` | `frontier-reviewer` | `worker` + CI evidence 必須 | G4/G6、追加 QA test design、risk review |
| `aim` | `worker` | current runtime | 実装監視、PoC、修正指示 |
| `se` | `worker` | current runtime | L4 実装、テスト追加 |
| `docs` | `worker` | `fast-checker` + human/cross review | 文書更新、skill_doc 正本化 |
| `po` | human | `frontier-reviewer` は助言のみ | 受入・優先度・本番影響は人間判断 |

#### orchestration YAML 例

```yaml
team_id: default-hybrid
policy:
  prefer_cross_provider_review: true
  same_model_approval: forbidden
  single_runtime_review_severity: P1
members:
  - role: tl
    capability_class: frontier-reviewer
    runtime: claude
    model: local-override
  - role: se
    capability_class: worker
    runtime: codex
    model: local-override
  - role: qa
    capability_class: frontier-reviewer
    runtime: codex
    model: local-override
budgets:
  frontier-reviewer: 30
  worker: 60
  fast-checker: 10
```

#### orchestration 判定

`ut-tdd team run --definition .ut-tdd/teams/<team>.yaml` は実行前に以下を検証する。

1. `members[].role` が §1.8 の role enum に含まれる。
2. `members[].capability_class` が `frontier-reviewer / worker / fast-checker` のいずれか。
3. `budgets` の合計が 100。
4. `prefer_cross_provider_review=true` の場合、reviewer と実装担当が別 runtime / 別 provider である。
5. 別 runtime が無い場合は実行を止めず、`single_runtime_review_severity=P1` として handover / job summary に warning を残す。
6. `same_model_approval=forbidden` の場合、設計作成者と承認者の `runtime + model` が同一なら exit 1。

`frontier-reviewer` は high-cost 扱いのため、L2/L3/R4/G2/G3/G4/G6 など判断品質が結果を左右する場面に限定する。通常の実装・整形・単純テスト追加に常用しない。

### Optional AI IDE adapters

Cursor / Google Antigravity / GitHub Copilot などは、Claude Code / Codex と同列の必須 runtime にはしない。検出できるものだけ optional adapter として扱い、adapter 不在で `doctor` / `lint` / `gate` を fail にしない。

| adapter | 検出例 | 連携 level | 方針 |
|---------|--------|------------|------|
| `cursor` | `cursor` CLI / Cursor config / VSCode 系拡張 | detect / status / prompt handoff / CLI task | CLI が利用可能なら task 実行 adapter を提供。無い場合は検出のみ |
| `antigravity` | `antigravity` CLI / Antigravity config | detect / status / CLI task / hosted runtime | CLI が利用可能なら background agent 実行候補。Claude Code を内部呼び出しできる場合は `hosted_runtimes` に記録し、仕様変更が速いため fail-open で扱う |
| `copilot` | `gh copilot` / `github.copilot` extension | detect / status / prompt assist | `gh copilot` が preview のため、自動実装主体ではなく assist adapter として扱う |
| `other` | user-defined adapter config | detect / status | `.ut-tdd/adapters/*.yaml` で拡張可能 |

adapter 結果は `.ut-tdd/state/tool-adapters.json` に generated state として保存する。`ut-tdd adapter list --json` は adapter name、probe_status、version、capabilities、missing、hosted_runtimes、stability (`stable` / `preview` / `experimental`)、integration_level、safe_commands を返す。

`hosted_runtimes` は Antigravity など IDE / adapter の内側から Claude Code や他 agent runtime を呼べる場合に使う。これは中核 runtime 検出 (`claude-only` / `codex-only` / `hybrid`) には直接加算しない。理由は、呼び出し元 adapter の UI / CLI 契約に依存し、Claude Code CLI を直接制御できる状態と同じ保証を置けないためである。

#### capability probe 段階

adapter は「存在する」と「harness から連携できる」を分けて判定する。`ut-tdd adapter probe <name>` は以下の順で評価し、到達した最大段階を `integration_level` として返す。

| integration_level | 意味 | 代表 probe |
|-------------------|------|------------|
| `not-installed` | ツール本体が見つからない | command / app path / extension scan が全て不一致 |
| `detected` | インストールまたは拡張は見つかった | `cursor` / `antigravity` / `gh` / extension ID の存在 |
| `configured` | project-local または user config を読める | settings / auth / adapter yaml を検出 |
| `callable` | CLI help / version が exit 0 | `<tool> --version` / `<tool> --help` / `gh copilot --help` |
| `task-capable` | harness から安全な task / prompt handoff を開始できる | safe command allowlist に一致し、dry-run が通る |
| `roundtrip-capable` | 実行結果を機械回収できる | JSON output / exit code / generated file / PR comment を回収可能 |
| `unsupported` | 検出済みだが自動連携に使わない | GUI 専用、preview 出力不安定、allowlist 不在 |

`detected` だけでは `ut-tdd adapter run` を許可しない。`adapter run` は `task-capable` 以上、かつ `safe_commands` に含まれる command のみ実行する。`roundtrip-capable` でない adapter は実行後に「人間確認待ち」として handover に記録する。

#### adapter JSON 例

```json
{
  "name": "cursor",
  "probe_status": "ok",
  "integration_level": "task-capable",
  "version": "1.0.0",
  "capabilities": ["open-workspace", "prompt-handoff"],
  "hosted_runtimes": [],
  "missing": ["json-result"],
  "stability": "preview",
  "safe_commands": ["open-workspace", "prompt-handoff"]
}
```

ディスパッチャの subcommand:

| Subcommand | 用途 |
|------------|------|
| `ut-tdd status` | mode / runtime / handover / next action の状態確認 |
| `ut-tdd plan lint` | frontmatter schema 検証 |
| `ut-tdd vmodel lint` | 4 artifact + trace 検証 |
| `ut-tdd doctor` | 統合検証 |
| `ut-tdd self-test` | harness 内蔵の小テスト (CLI routing / schema smoke / fixture smoke) |
| `ut-tdd setup` | 初期ディレクトリ / hook / local config の bootstrap |
| `ut-tdd task classify` | 入力文 / PLAN / diff から kind / drive / size / complexity を仮判定 |
| `ut-tdd task estimate` | 三点見積もり + リスク係数で effort_hours / story_points を算出 |
| `ut-tdd skill suggest` | PLAN / diff / text から適用 skill pack 候補を推挙 |
| `ut-tdd gate G<N>` | G1-G11 ゲート判定 |
| `ut-tdd claude ...` | Claude Code 用 prompt / hook 状態操作。`claude-only` / `hybrid` で有効 |
| `ut-tdd codex ...` | Codex CLI 実行。`codex-only` / `hybrid` で有効 |
| `ut-tdd team run ...` | Claude Code × Codex 連携実行。`hybrid` のみ有効 |
| `ut-tdd handover ...` | mode をまたぐ引き継ぎ状態の確認・更新 |
| `ut-tdd adapter list` | optional AI IDE adapter の検出状態を表示 |
| `ut-tdd adapter probe <name>` | adapter の integration_level と capability を再判定 |
| `ut-tdd adapter run <name> ...` | safe_commands に含まれる adapter command のみ実行 |

詳細実装は将来の個別 PLAN-XXX で詰める。

### mode 別コマンド保証

| command group | standalone | claude-only | codex-only | hybrid |
|---------------|------------|-------------|------------|--------|
| `setup` / `status` / `doctor` | ✓ | ✓ | ✓ | ✓ |
| `plan lint` / `vmodel lint` / `gate` | ✓ | ✓ | ✓ | ✓ |
| `task classify` / `task estimate` / `skill suggest` | ✓ | ✓ | ✓ | ✓ |
| `claude` / Claude hook guard | — | ✓ | not-available | ✓ |
| `codex` | — | not-available | ✓ | ✓ |
| `team run` | — | not-available | not-available | ✓ |
| `handover` | local only | ✓ | ✓ | ✓ |

`not-available` は exit 2 とし、stderr に不足 runtime と fallback command を出す。検証系コマンド (`lint` / `doctor` / `gate`) は mode 不足だけで exit 1 にしない。

## 7.2 task classifier / effort / skill suggestion I/O 仕様

### `ut-tdd task classify`

入力文、PLAN frontmatter、または diff から、作業経路の初期判定を返す。AI runtime が無い環境でも rule-based で動作する。

```bash
ut-tdd task classify --text "audit log の vmodel lint を追加"
ut-tdd task classify --plan docs/plans/PLAN-123-audit.md
ut-tdd task classify --diff origin/main...HEAD
```

JSON 出力:

```json
{
  "kind": "impl",
  "drive": "agent",
  "size": "M",
  "complexity": "medium",
  "split_required": false,
  "recommended_path": "forward",
  "recommended_gates": ["G3", "G3.8", "G4"],
  "confidence": 0.82,
  "reasons": ["cli_extension touched", "tests required", "no db migration"]
}
```

#### size / complexity 判定

| 判定 | 目安 | 動作 |
|------|------|------|
| `XS` | 1 file / docs typo / small config | PLAN 不要候補。ただし `docs/skills/*.md` は例外なく PLAN 必須 |
| `S` | 1-3 files / 100 行以下 / API・DB 変更なし | 軽量 Forward |
| `M` | 4-10 files / 101-500 行 / API または DB 片方 | 通常 Forward + G3.8 |
| `L` | 11+ files / 501+ 行 / API+DB / 複数 role | 分割推奨、frontier-reviewer review |
| `XL` | 新規 module / cross-platform / security / production impact | 分割必須、Master PLAN 推奨 |

3 軸 (file count / changed lines / API-DB-ops impact) の最大値を `size` とする。`XL` は `split_required=true`。

### `ut-tdd task estimate`

三点見積もりとリスク係数で effort を出す。見積もりは約束ではなく planning input として扱う。

```bash
ut-tdd task estimate --plan docs/plans/PLAN-123-audit.md
ut-tdd task estimate --text "Windows 対応込みで CLI を追加"
```

JSON 出力:

```json
{
  "optimistic_hours": 3,
  "most_likely_hours": 6,
  "pessimistic_hours": 12,
  "expected_hours": 6.5,
  "risk_factor": 1.4,
  "buffered_hours": 9.1,
  "story_points": 5,
  "risks": ["cross-platform shell", "CI matrix update"]
}
```

算出:

```
expected_hours = (optimistic + 4 * most_likely + pessimistic) / 6
buffered_hours = expected_hours * risk_factor
```

`risk_factor` は 1.0-2.0。cross-platform / security / external API / migration / unclear requirement があるほど上げる。

### `ut-tdd skill suggest`

PLAN / diff / text から、適用する `docs/skills/*.md` の候補を返す。未移植 skill は `vendor_candidate=true` として表示し、正本化なしに gate input にしない。

```bash
ut-tdd skill suggest --plan docs/plans/PLAN-123-audit.md
ut-tdd skill suggest --text "追加機能設計と QA 追加テストを整理"
```

JSON 出力:

```json
{
  "required": [
    {"skill": "design-pack", "reason": "add-design", "confidence": 0.91},
    {"skill": "test-pack", "reason": "G3.8 and L6 QA trace", "confidence": 0.88}
  ],
  "optional": [
    {"skill": "reverse-pack", "reason": "R4 promotion_strategy mentioned", "confidence": 0.62}
  ],
  "missing": [
    {"skill": "operations-pack", "vendor_candidate": true, "reason": "postmortem reference"}
  ]
}
```

### orchestration 連携

| command | primary class | escalation |
|---------|---------------|------------|
| `task classify` | `fast-checker` / rule-based | `L` / `XL` / confidence < 0.7 → `frontier-reviewer` review |
| `task estimate` | rule-based + `fast-checker` | risk_factor ≥ 1.6 or production impact → `frontier-reviewer` review |
| `skill suggest` | `fast-checker` / rule-based | missing required skill or vendor_candidate → `tl` review |

## 7.3 vmodel_validator I/O 仕様 (R-I7 fix で exit code 3 段階明記)

### exit code 仕様

| exit code | 意味 |
|-----------|------|
| **0** | 全 P0 / P1 検出なし (clean pass) |
| **2** | P1 warning のみ検出 (carry 候補、push 続行可) — R-I7 fix |
| **1** | P0 検出あり (fail-close) |

stderr に P0 / P1 メッセージを出力。CI は `exit 0 or exit 2 = pass`、`exit 1 = fail-close` として扱う。

### kind 別検証経路の分岐

```
input: PLAN ファイル または PLAN ディレクトリ (§1.10 対象 path で絞り込み)

検証フロー:
  for each PLAN file in §1.10 対象:
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

### 双方向 8 directed edge 検証 (§2.4)

vmodel_validator は §2.4 の **必須 8 directed edge** を個別検証する。grep ベースだけでなく path 正規化と参照先 path/id 一致まで確認する。実装詳細は将来の個別 PLAN-XXX で詰める。本書では入出力契約と必須検証項目を確定する。

## 7.4 branch-kind-check 仕様 (R-I8 fix で PLAN 必須 / 例外 branch を表化)

### PLAN 必須 branch と例外 branch

| ブランチ prefix | PLAN 必須 | touched PLAN 0 件時の動作 |
|----------------|-----------|---------------------------|
| `feature/*` / `design/*` / `research/*` / `poc/*` / `reverse/*` / `add/*` / `hotfix/*` / `refactor/*` | **必須** | exit 1 (PLAN 不在 → fail-close) |
| `docs/*` / `chore/*` | 不要 | exit 0 (lint 対象外、skip) |
| その他 prefix | 不要 | exit 1 (unknown prefix → fail-close) |

### 判定ロジック

```
input: PR head branch name + PR で touched された PLAN files
output:
  - exit 0: branch prefix と全 touched PLAN の kind が §6.1 表で整合 (または例外 branch)
  - exit 1: 不整合検出 (PLAN 必須 branch で PLAN 0 件 / 不一致)

判定:
  prefix = branch_name.split('/')[0]
  if prefix in {docs, chore} and not touches("docs/skills/*.md"): exit 0  # 例外 branch
  if prefix not in §6.1 表: exit 1   # unknown prefix
  expected_kinds = §6.1 表で prefix から決まる
  touched_plans = PR diff から PLAN ファイル抽出
  if len(touched_plans) == 0: exit 1  # PLAN 必須 branch で 0 件
  for each PLAN file in touched_plans:
    if PLAN.kind not in expected_kinds: exit 1
  exit 0
```

`harness-check` 内 subjob として `|| exit 1` で fail-close (`|| echo WARN` は禁止)。

## 7.5 pre-commit / pre-push hook の責任分離

| Hook | 検証内容 | 想定時間 |
|------|----------|----------|
| **pre-commit** | gitleaks / commitlint format / 軽量 lint (markdown / yaml) + `ut-tdd self-test --smoke` | < 5s |
| **pre-push** | §5.3 session 終了前 4 項目 + 軽量 plan lint + 差分対象 self-test | < 15s |
| **harness-check (CI on PR)** | §6.3 の 8 subjob (重い検証 + 全テスト + 回帰確認) | 数分 |

`vmodel_lint` の完全検証は **pre-push と CI のみ** で実行。pre-commit には乗せない。

### test tier と実行場所

| tier | 内容 | 実行場所 | 目的 |
|------|------|----------|------|
| `smoke` | CLI 起動、subcommand routing、schema fixture、adapter probe dry-run | local hook / `ut-tdd self-test --smoke` | 即時フィードバック |
| `changed` | 差分 PLAN / 差分 script / 差分 docs の lint と軽量 validator | pre-push / PR | push 前の手戻り削減 |
| `full` | 全 PLAN lint、完全 vmodel lint、全テスト、回帰確認、branch matrix | GitHub Actions `harness-check` | PR 通過要件 |
| `nightly` | 長い adapter probe、cross-platform matrix、optional integration | GitHub Actions schedule | flake / 環境差分検出 |

原則として、`full` と `nightly` をローカル hook の必須経路に入れない。ローカルで実行したい場合は明示コマンド (`ut-tdd self-test --full`) とする。

## 7.6 受入条件 (機械検証)

- [ ] `ut-tdd plan lint` が §1 の全 enum 違反を fail-close
- [ ] `ut-tdd vmodel lint` が §7.3 の kind 別経路で正しく分岐し、§7.3 の 3 段 exit code を返す
- [ ] §2.4 の必須 8 directed edge を fail-close 検証
- [ ] `branch-kind-check` が §7.4 の判定ロジックに従い fail-close (echo WARN ではない)
- [ ] `branch-kind-check` が PLAN 必須 branch で touched PLAN 0 件なら exit 1
- [ ] `branch-kind-check` が `docs/*` / `chore/*` を例外として skip (exit 0)
- [ ] pre-commit / pre-push / CI の責任分離 (§7.5) を守る
- [ ] `ut-tdd self-test --smoke` はネットワーク不要・外部 AI runtime 不要で通る
- [ ] PR merge gate は GitHub Actions `harness-check` のみを正本とし、ローカル hook 成否だけを merge 条件にしない

---

# §7.7 HELIX skill pack 移植要件

HELIX 由来 skill は `vendor/helix-source/` から直接実行しない。UT-TDD で使うものだけを `docs/skills/*.md` に **skill pack** として正本化し、`artifact_type=skill_doc` の PLAN 成果物として管理する。

## 7.7.1 移植候補 skill pack

| skill pack | 主な移植元 | UT-TDD での用途 |
|------------|------------|-----------------|
| `planning-pack` | requirements-handover / dev-policy / schedule-wbs | 企画、要件、WBS、引継ぎ |
| `design-pack` | design-doc / api-contract / db / ui | L2-L3 設計、追加機能設計、契約固定 |
| `implementation-pack` | coding / code-review / error-fix / refactoring | L4 実装、レビュー、修正 |
| `test-pack` | testing / verification / quality-lv5 | TDD Red、V-model、追加 QA テスト |
| `reverse-pack` | reverse-r0/r1/r2/r3/r4/rgc | 既存実装からの契約抽出、合流判定 |
| `operations-pack` | runbook / deploy / incident / postmortem | L6 以降の運用、障害、再発防止 |

## 7.7.2 移植時の変換ルール

- `HELIX` 固有名、個人プロジェクト前提、WSL2 固定、絶対パスは UT-TDD 用語と相対パスへ置換する。
- `Claude Code` 固定の指示は `runtime_mode` (`standalone` / `claude-only` / `codex-only` / `hybrid`) に従う表現へ置換する。
- external API / secret / credential を前提にする手順は core skill へ入れず、optional adapter 側に隔離する。
- skill は「知識・観点・チェックリスト」までを持つ。GitHub Actions や hook の実行条件は workflow / harness 側に置く。

## 7.7.3 成果物一致原則への接続

skill pack は単独の助言文書ではなく、以下の gate に接続する。

| 原則 | 接続先 | fail-close 条件 |
|------|--------|----------------|
| 追加機能設計は既存設計を破壊しない | `add-design` / `add-impl` | 親 PLAN なし、親 PLAN と drive 不一致、既存 design/test の delete/modify |
| ドキュメント、実装、テストは一致する | `vmodel_lint` | §2.4 の必須 8 directed edge 欠落 |
| 追加 QA テストは doc-first | L6 QA 追加テスト | L6 QA test design への trace 欠落 |
| 実装後レビューは追加テストへ還元する | `test-pack` + `review` | 指摘が test design / regression test / debt register のいずれにも残らない |
| 検証成果の機能化は R4 で判定する | `reverse-pack` | `promotion_strategy` 欠落、または reuse 条件未達 |

## 7.7.4 受入条件

- [ ] 移植済み skill は `docs/skills/*.md` に配置され、PLAN の `generates` に `artifact_type=skill_doc` として記録される
- [ ] skill doc は対応する workflow / harness / gate を明記する
- [ ] HELIX 固有名、個人絶対パス、WSL2 固定表現が残らない
- [ ] `skill_doc` 更新 PR は `docs/*` 例外ではなく、PLAN 付き branch (`design/*` または `add/*`) で扱う
- [ ] skill pack は vendor snapshot を直接参照せず、UT-TDD 正本化済みの本文を参照する

---

# §8 補助 3: エスカレーション要件

## 8.1 L0-L3 reviewer 自動切替

| Level | reviewer | 動作 |
|-------|----------|------|
| L0 | agent | AI レビューのみ |
| L1 | aim | aim の人間レビュー追加 |
| L2 | council | tl + qa + aim 3 者会議 |
| L3 | human | po 直接通知 + 作業一時停止 |

## 8.2 level 算出仕様

### 閾値定義

| Level | 同種失敗 N (累計) | 再失敗 M (累計) |
|-------|------------------|-----------------|
| L1 | ≥ 3 | ≥ 1 |
| L2 | ≥ 7 | ≥ 3 |
| L3 | ≥ 15 | ≥ 7 |

### 冪等算出ロジック (構想書 v3.0 §8.3 確定)

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
```

target_level は **冪等算出**。current_level に +1 漸進ではない。

### 昇格イベント記録

```jsonl
{"timestamp":"2026-05-20T10:00:00Z","plan_id":"PLAN-042","failure_type":"vmodel_lint_p0","n_failures":15,"m_refails":0,"level_before":"L0","level_after":"L3"}
```

## 8.3 降格判定 (`check-escalation-stale.sh`)

定期実行 (GitHub Actions schedule: weekly):

| 期間 | 動作 |
|------|------|
| 違反検出ゼロ 90 日継続 | 降格 **推奨表示のみ** (自動降格しない) |
| 未使用 30 日 | warning |
| 未使用 90 日 | archive 候補 (human 確認後に非アクティブ化) |

降格 / archive は **human (po または tl) 確認後にのみ実行**。

## 8.4 failure_log の取扱い (構想書 v3.0 §8.5 確定)

| ログ種別 | 位置 | git 管理 | 書き込み主体 |
|---------|------|---------|--------------|
| **個人作業ログ** | `.ut-tdd/audit/failure_log.jsonl` | **`.gitignore`** | ローカル pre-push hook / `scripts/log-failure.sh` |
| **チーム共有 audit (PR/CI)** | GitHub Actions job summary + artifact / PR comment (audit 集計用、N/M 集計対象)。PR label は状態表示のみ | (Actions が管理) | CI job |
| **状態表示** | PR label (`escalation-L2` / `escalation-L3`) | (Actions が管理) | Actions が level 昇格時に付与 |

### GitHub failure corpus

組織としての失敗学習は、GitHub 上の証跡から pull する。`failure_log.jsonl` は個人作業ログであり、N/M 集計や再発傾向の正本にしない。

| Source | 取得例 | 用途 |
|--------|--------|------|
| Workflow runs / jobs | `gh api repos/{owner}/{repo}/actions/runs` / `jobs` | CI 失敗種別、再失敗回数、対象 branch |
| Job logs | `gh run view --log` または Actions API | pytest / lint / vmodel / branch-kind-check の failure_type 抽出 |
| Workflow artifacts | `harness-check` audit artifact | 機械可読な failure event 正本 |
| PR comments / reviews | GitHub Issues / Pulls API | review 指摘が test / PLAN / skill に変換されたか確認 |
| PR labels | `escalation-L*`, `postmortem-overdue` | 状態表示。N/M 集計の入力にはしない |
| Checks conclusion | Checks API | required check の pass/fail と skipped subjob の確認 |

failure event の最小 schema:

```json
{
  "timestamp": "2026-05-21T00:00:00Z",
  "repo": "org/repo",
  "pr_number": 123,
  "run_id": 456,
  "job_name": "harness-check",
  "subjob": "vmodel-lint",
  "plan_id": "PLAN-123",
  "failure_type": "vmodel_lint_p0",
  "severity": "P0",
  "converted_to": ["regression-test", "add-design"],
  "evidence_url": "https://github.com/org/repo/actions/runs/456"
}
```

`converted_to` が空の failure event は §8.6 の失敗変換ループで P1 warning とし、同種失敗が閾値を超えた場合は §8.2 の escalation 対象にする。

### `.gitignore` 必須エントリ

```
.ut-tdd/audit/failure_log.jsonl
.ut-tdd/audit/escalation_state.json
.ut-tdd/cache/*
!.ut-tdd/cache/.gitkeep
```

### `check-escalation-level.sh` の集計仕様

```
1. GitHub Actions API で同 plan_id の過去 90 日 artifact を取得 (チーム共有監査ログ)
2. job summary / artifact 内の failure event から N / M を算出
3. ローカル failure_log.jsonl は読み込まない (個人 advisory のみ)
4. §8.2 の冪等算出で target_level を決定
5. 結果を GitHub Actions artifact / PR label / PR comment に書く。ローカル実行時のみ `.ut-tdd/audit/escalation_state.json` に advisory cache を生成する
```

PR label (`escalation-L2` 等) は **集計対象外** (状態表示のみ、N/M に含めない)。

### CODEOWNERS 動的注入の禁止

CODEOWNERS は静的 path owner のため、level に応じた動的注入は実装不能。代替手段:

| 代替 | 仕組み |
|------|--------|
| PR comment | Actions が level 昇格時に `@<owner>` 付き comment を投稿 |
| label 制御 | `escalation-L2` / `escalation-L3` ラベルを PR に自動付与 |
| review request | Actions が `pulls/{number}/requested_reviewers` API で動的追加 |

## 8.5 受入条件 (エスカレーション)

- [ ] `check-escalation-level.sh` が §8.2 の冪等算出で target_level を出す
- [ ] N=15 を初回観測した場合に L3 (Human 通知) が即発火する
- [ ] failure_log.jsonl が `.gitignore` 対象
- [ ] チーム共有 audit が GitHub Actions artifact / job summary / PR comment 経由であり、PR label は状態表示のみ、個人 failure_log は N/M 集計対象外
- [ ] `escalation_state.json` は git 管理されず、ローカル advisory cache として扱われる
- [ ] CODEOWNERS 動的注入を実装しない (PR comment / label / review request で代替)

## 8.6 失敗変換ループの受入条件

構想書 v3.0 §1.4 の「失敗を仕組みに変換する原則」を、以下の機械検証・成果物更新で扱う。

| 入力 event | 必須変換先 | 機械検証 |
|------------|------------|----------|
| `vmodel_lint` P0 | 修正 commit または `add-design` / `add-impl` PLAN | P0 が残る PR は `harness-check` exit 1 |
| レビューで見つかったテスト不足 | L6 QA 追加テスト設計 + `QA-XXX-NNN` test | L6 QA trace 欠落は §2.5 により P0 |
| session 断絶・認識ずれ | `.ut-tdd/handover/CURRENT.md` または `recovery` PLAN | pre-push は handover なしを warning、recovery 7 セクション欠落を exit 1 |
| PoC confirmed | Reverse PLAN + R4 `forward_routing` + `promotion_strategy` | §3.4 の R4 必須 field 欠落は exit 1 |
| 同種失敗の反復 | escalation L0-L3 event | §8.2 の冪等算出で target_level を出す |
| AI の自己承認 | cross-agent review または P1 warning | `same_model_approval=forbidden` 時は §7.1 orchestration で exit 1 |

失敗 event を単なるコメントで close してはいけない。以下のいずれにも変換されない場合、`harness-check` は P1 warning を出す。

- test / regression test
- design or add-design PLAN
- recovery PLAN / postmortem
- debt register / deferred finding
- skill pack update
- orchestration policy update
- handover note

---

# §9 リポジトリ構造要件

## 9.1 ディレクトリ構造 + Phase 別必須種別 (R-C6 / R-C7 fix で 3 種別に分類)

凡例:
- **A**: Phase 0-A 完了時に必須
- **B**: Phase 0-B 完了時に追加必須
- **G**: 生成時作成 (Phase 0 では不要、利用時に hook / script が作成)

```
<repo-root>/
├── .github/
│   ├── CODEOWNERS                                # B (R-C6 fix: 0-B 追加必須)
│   ├── ISSUE_TEMPLATE/
│   │   ├── recovery.md                           # A
│   │   └── add-feature.md                        # A
│   ├── PULL_REQUEST_TEMPLATE.md                  # A
│   └── workflows/
│       ├── harness-check.yml                     # A (Required 化は 0-B)
│       └── escalation-stale.yml                  # A (weekly cron)
├── .ut-tdd/
│   ├── audit/                                    # A (ディレクトリのみ、.gitkeep)
│   │   ├── failure_log.jsonl                     # G (R-C7 fix: pre-push 実行時に生成、git 管理しない)
│   │   └── escalation_state.json                 # G (local advisory cache、git 管理しない)
│   ├── cache/                                    # A (.gitignore、.gitkeep)
│   ├── state/                                    # A (ディレクトリのみ、.gitkeep)
│   │   ├── runtime.json                          # G (mode 検出結果、git 管理しない)
│   │   └── tool-adapters.json                    # G (optional adapter 検出結果、git 管理しない)
│   ├── teams/                                    # A (orchestration 定義、default YAML は管理対象)
│   │   ├── default-hybrid.yaml                   # G (team run 利用時に作成)
│   │   └── local*.yaml                           # G (個人 model / command override、git 管理しない)
│   └── handover/                                 # A
│       └── CURRENT.md                            # G (session 引き継ぎ時に生成 or 編集)
├── .pre-commit-config.yaml                       # A
├── .gitignore                                    # A (§8.4 エントリ含む)
├── commitlint.config.js                          # A
├── docs/
│   ├── governance/                               # A
│   │   ├── ai-dev-team-concept_v1.1.md           # A (構想書 v1.1)
│   │   ├── ai-dev-team-operations_v1.1.md       # A (運用ルール書 v1.1)
│   │   ├── ut-tdd-agent-harness-concept_v3.0.md  # A (構想書 v3.0)
│   │   └── ut-tdd-agent-harness-requirements_v1.1.md  # A (本書)
│   ├── plans/                                    # A (ディレクトリのみ)
│   │   └── PLAN-NNN-*.md                         # G
│   ├── design/                                   # A (ディレクトリのみ)
│   ├── test-design/                              # A (ディレクトリのみ)
│   ├── adr/                                      # A (ディレクトリのみ)
│   ├── postmortem/                               # A (ディレクトリのみ)
│   └── skills/                                   # A (ディレクトリのみ、構想書 §8 補助 3 層 1)
├── src/                                          # A
│   └── ut_tdd/                                  # A (Python package)
│       ├── __init__.py                          # A
│       ├── cli.py                               # A
│       ├── plan_validator.py                    # A
│       ├── vmodel_validator.py                  # A
│       ├── runtime/                             # A
│       └── doctor/                              # A
├── tests/                                        # A (ディレクトリのみ、.gitkeep)
├── scripts/
│   ├── ut-tdd                                    # A
│   ├── ut-tdd.ps1                                # A (Windows PowerShell entrypoint)
│   ├── ut-tdd-plan-lint.sh                       # A
│   ├── ut-tdd-vmodel-lint.sh                     # A
│   ├── ut-tdd-doctor.sh                          # A
│   ├── ut-tdd-gate.sh                            # A
│   ├── install-hooks.sh                          # A
│   ├── install-hooks.ps1                         # A (Windows PowerShell hook installer)
│   ├── setup-branch-protection.sh                # A (実行は 0-B)
│   ├── check-escalation-level.sh                 # A
│   ├── check-escalation-stale.sh                 # A
│   ├── log-failure.sh                            # A
│   ├── requirements.txt                          # A
│   └── python_cmd.sh                             # A
├── workflows/                                    # A (構想書 §8 補助 3 層 2 設計仕様書)
│   └── *.yaml                                    # G
└── harness/                                      # A (構想書 §8 補助 3 層 3 設計仕様書)
    └── *.yaml                                    # G
```

## 9.2 受入条件 (構造)

- [ ] Phase 0-A 完了時に **A 種別** の全ディレクトリ + 必須ファイルが存在
- [ ] Phase 0-B 完了時に **B 種別** が追加で存在 (CODEOWNERS)
- [ ] **G 種別** は Phase 0 では存在しないことを許容 (clean checkout 後の lint で生成有無を要求しない)
- [ ] `.gitignore` に §8.4 のエントリ (`failure_log.jsonl` / `escalation_state.json` / `.ut-tdd/cache/*` + `.gitkeep` 例外) が含まれる
- [ ] `.ut-tdd/state/runtime.json` は generated state として Git 管理されない
- [ ] `.ut-tdd/state/tool-adapters.json` は generated state として Git 管理されない
- [ ] `.ut-tdd/teams/local*.yaml` は個人 model / command override として Git 管理されない
- [ ] `scripts/requirements.txt` に `pyyaml>=6.0,<7.0` 等の pin
- [ ] `docs/design/` と `docs/test-design/` のディレクトリペアが対応

---

# §10 Phase 0 受入条件

## 10.1 Phase 0-A: リポジトリ初期化 (CODEOWNERS なし、R-I9 fix で検証コマンド明記)

### 受入条件 (11 項目)

| # | 条件 | 検証コマンド |
|---|------|--------------|
| 1 | リポジトリ初期化 | `git rev-parse --show-toplevel` exit 0 |
| 2 | §9.1 の全 **A 種別** ディレクトリ作成 | `for d in <dirs>; do test -d $d; done` exit 0 |
| 3 | `.gitignore` に §8.4 エントリ | bash: `grep -q 'failure_log.jsonl' .gitignore && grep -q 'escalation_state.json' .gitignore && grep -q '.ut-tdd/cache/\\*' .gitignore && grep -q '!.ut-tdd/cache/.gitkeep' .gitignore` / PowerShell: `Select-String` で同等確認 |
| 4 | `.pre-commit-config.yaml` 配備 + 動作 | **`pre-commit run --all-files`** exit 0 (gitleaks / commitlint format / 軽量 lint パス) — R-I9 |
| 5 | `commitlint.config.js` 配備 | `npx --no-install commitlint --help` exit 0 |
| 6 | `scripts/ut-tdd*` 配備 + 動作 | bash: `bash scripts/ut-tdd --help && bash scripts/ut-tdd setup --dry-run && bash scripts/ut-tdd status --json` / PowerShell: `powershell -NoProfile -ExecutionPolicy Bypass -Command "& { & ./scripts/ut-tdd.ps1 --help; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & ./scripts/ut-tdd.ps1 setup --dry-run; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & ./scripts/ut-tdd.ps1 status --json; exit $LASTEXITCODE }"` がどちらも exit 0 |
| 7 | `scripts/requirements.txt` 配備 | `grep -q 'pyyaml' scripts/requirements.txt` exit 0 |
| 8 | Python 依存導入 | `python -m pip install -r scripts/requirements.txt` exit 0 |
| 9 | 実行権限 / Windows shim 確認 | bash: `[ -x scripts/ut-tdd ] && [ -x scripts/install-hooks.sh ]` / PowerShell: `powershell -NoProfile -Command "& { if (!(Test-Path ./scripts/ut-tdd.ps1) -or !(Test-Path ./scripts/install-hooks.ps1)) { exit 1 } }"` がどちらも exit 0 |
| 10 | hook install 実行 | bash: `bash scripts/install-hooks.sh` / PowerShell: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-hooks.ps1` がどちらも exit 0 |
| 11 | gitleaks binary が pre-commit 経由で動作 | **`pre-commit run gitleaks --all-files`** exit 0 — R-I9 |

### Phase 0-A 完了基準

- 上記 11 項目全て pass
- Linux/macOS POSIX shell と Windows PowerShell の Phase 0-A smoke が両方 pass
- `harness-check.yml` ワークフローは存在するが Required Status Checks に登録しない
- bootstrap-owner 1 名で全 PR レビュー

## 10.2 Phase 0-B: CODEOWNERS + Branch Protection (運用 Stage、R-C8 / R-P2 fix)

### 前提権限 (R-P2 fix)

| 権限 | 要件 |
|------|------|
| GitHub repository | admin 権限 |
| GitHub token (`GH_TOKEN`) | `repo` + `admin:org` (CODEOWNERS team 参照用) scope |
| Local 環境 | `gh auth login` 済み |

### 受入条件 (3 項目)

| # | 条件 | 検証コマンド |
|---|------|--------------|
| 1 | `.github/CODEOWNERS` に team 別 path アサイン | `gh api "repos/$REPO/codeowners/errors" --jq '.errors \| length'` が 0 |
| 2 | Branch Protection を main に設定 (`harness-check` を required、required_approving_review_count=1) | `gh api "repos/$REPO/branches/main/protection" --jq '.required_status_checks.contexts[]'` に `harness-check` が含まれる |
| 3 | テスト PR matrix で `harness-check` の subjob 適用が §6.3 と一致 (R-C8 fix) | 以下 branch type 別テスト PR matrix を参照 |

### branch type 別テスト PR matrix (R-C8 fix)

`harness-check` の subjob 適用が §6.3 表と一致することを branch type 別に検証する。各 branch から軽微な変更で PR を起票し、Checks タブに以下 subjob が **適用 (✓) または skipped (—)** として表示されることを確認。

| テスト PR | 確認対象 (適用 subjob) | skipped 確認 |
|-----------|------------------------|--------------|
| `feature/test-bootstrap` (impl PLAN 同梱) | plan-lint / vmodel-lint / branch-kind-check / commitlint / regression-test | poc-no-merge-guard / hotfix-postmortem-required / scrum-reverse-lint |
| `poc/test-bootstrap` (poc PLAN 同梱) | plan-lint / branch-kind-check / scrum-reverse-lint / poc-no-merge-guard / commitlint | vmodel-lint / hotfix-postmortem-required / regression-test |
| `docs/test-bootstrap` (PLAN なし、軽微修正) | commitlint | plan-lint / vmodel-lint / branch-kind-check 他 (例外 branch) |

→ 「適用」subjob は exit 0 で緑、「skipped」subjob は `skipped` ステータスで表示される。

### Phase 0-B 完了基準

- 上記 3 項目全て pass (matrix 3 種の test PR で確認)
- bootstrap-owner から team に移管完了
- 以後の全 PR は `harness-check` を必須として merge

## 10.3 Phase 0 全体の受入条件

- [ ] Phase 0-A の 11 項目 + Phase 0-B の 3 項目 = 計 14 項目すべて pass
- [ ] §10.2 の branch type 別テスト PR matrix で `harness-check` subjob 適用が §6.3 と一致
- [ ] §5.3 の pre-push 4 項目が動作 (handover/CURRENT.md なしで warning が出る等)

---

# §11 用語差分

構想書 v3.0 §10 の用語集を正本とする。本書では以下の追加用語のみ定義:

| 用語 | 定義 |
|---|---|
| **VALID_STATUSES** | frontmatter `status` の enum: draft / confirmed / completed / archived |
| **VALID_DECISION_OUTCOMES** | frontmatter `decision_outcome` の enum: confirmed / rejected / pivot (kind=poc + workflow_phase=S4 のみ) |
| **VALID_KINDS** | frontmatter `kind` の enum (11 種、§1.3) |
| **VALID_LAYERS** | frontmatter `layer` の enum (16 種、§1.4) |
| **VALID_WORKFLOW_PHASES** | frontmatter `workflow_phase` の enum (10 種、§1.5) |
| **VALID_DRIVES** | frontmatter `drive` の enum (9 種、§1.6) |
| **VALID_ARTIFACT_TYPES** | frontmatter `generates[].artifact_type` の enum (19 種、§1.7) |
| **VALID_ROLES** | frontmatter `agent_slots[].role` の enum (7 種、§1.8) |
| **必須 8 directed edge** | §2.4 の vmodel_validator 必須検証対象 (#1-#8、残り #9-#12 は warn) |
| **harness-check subjob** | `harness-check` 内で呼ばれる 8 種の検証 (§6.3) |
| **canonical diff rule** | §4.1 で確定した `git diff --name-only --diff-filter=DM origin/main...HEAD -- <path>` |
| **exit 2 (P1 only)** | `vmodel_validator` が P1 warning のみ検出時の exit code (§7.3) |

---

# §12 改定履歴

| Version | 日付 | 変更内容 | 策定者 |
|---|---|---|---|
| 1.0 | 2026-05-20 | 初版。構想書 v3.0 と分離して要件定義のみを記述 | PM + TL |
| **1.1** | **2026-05-20** | **Codex TL Round 4 (追突レビュー) で指摘された Critical 8 + Important 9 を全 fix。S4 outcome enum 追加 / G4 fail-close 条件統一 / pre-push fail-close と warning 分離 / branch prefix 全 11 kind 網羅 / Phase 0-A/0-B 必須ファイル区別 / failure_log の必須性とディレクトリ性の整理 / テスト PR matrix 化 / drive×kind matrix / 必須 role 表 / canonical diff rule / exit code 3 段階 / pre-commit 検証コマンド明記** | **PM + TL** |

---

**本書は UT-TDD-agent-harness の要件定義書である。構想 (WHY/WHAT) は `ut-tdd-agent-harness-concept_v3.0.md` を、各 enum・スクリプト・workflow YAML の実装詳細は将来の個別 PLAN-XXX 詳細設計を参照。**
