# PLAN-001 Sprint .1 — Vendor Module Analysis Report

Date: 2026-05-22
Executed by: Claude Code general-purpose subagent (read-only)
Source PLAN: `docs/plans/PLAN-001-w1-plan-schema-lint-port.md`

## Scope

vendor/helix-source/cli/lib/plan_*.py 6 本 + tests 5 本 + templates 2 本 + UT-TDD requirements §1.2-1.8 enum 突合。Read / Grep / Glob のみ、ファイル変更なし。

## 1. enum drift サマリ

| enum | vendor 状況 | UT-TDD 要件 | drift 種別 | W1 対応 |
|---|---|---|---|---|
| VALID_STATUSES | enum 定数なし、`finalized` 含む 3 値 hardcoded | 4 値 (draft/confirmed/completed/archived) | **finalize path 再設計** | Sprint .3 — VALID_STATUSES 定数化 + plan_frontmatter finalize ロジック書換え |
| VALID_KINDS | 11 値 完全一致 | 11 値 | 一致 | 移植のみ |
| VALID_LAYERS | 15 値（L3.8 欠如） | 16 値 (L3.8 含む) | 1 値追加 | Sprint .3 — L3.8 追加 |
| VALID_DRIVES | 9 値 完全一致 | 9 値 | 一致 | 移植のみ |
| VALID_WORKFLOW_PHASES | 10 値 (S0-S4, R0-R4) 一致 | 同 | 一致 | 移植のみ |
| VALID_DECISION_OUTCOMES | **未実装** | 3 値 (confirmed/rejected/pivot) | **新規追加** | Sprint .3 — 定数 + validator + テスト |
| VALID_ARTIFACT_TYPES | 16 値 (`test`/`binary` 含む) | 19 値 (`test_design`/`test_code`/`skill_doc`/`workflow_config`/`github_config` 含む、`test`/`binary` なし) | **最大の drift** — 全 fixture + template + 本文の `artifact_type: test` 言及を書換え | Sprint .3-.4 — V-model 4 artifact 分離（critical） |
| VALID_ROLES | **`cli/ROLE_MAP.md` 外部 runtime read** | 7 値 (po/tl/qa/aim/uiux/se/docs) 固定 | **設計変更** — enum ハードコード化、ROLE_MAP 依存除去 | Sprint .3 — load_valid_roles() 撤去 |
| kind × drive matrix | **vendor 未実装** | §1.6 後段で許可マッピング規定 | **新規 validator** | Sprint .3 |
| (kind, workflow_phase) pair | **vendor 未実装** (kind∈{poc,reverse} 必須までしか check なし) | §1.5 で許可ペア表規定 | **新規 validator** | Sprint .3 |
| fail-close vs warn-only | vendor は warn-only mode 固定 (always exit 0) | §7 で fail-close (exit 0/2/1 三段階) | **exit code 設計変更** | Sprint .3 |

## 2. module 構造サマリ

### 2.1 plan_frontmatter.py (237 行)
- 公開 API: `finalize_plan_files`, `resolve_plan_doc_path`, `PlanFrontmatterError`
- 依存: vendor 内部 `yaml_parser`, `concurrent_lock`
- HELIX 混入: `HELIX_PLAN_FRONTMATTER_FAIL_STAGE` 環境変数、`.helix/plans` hardcoded、`status="finalized"` ハードコード書込
- OS 依存: `concurrent_lock._flock_*` は POSIX flock 由来 → Windows 第一級対応のため `portalocker` 追加 or stdlib `msvcrt` 分岐が必要

### 2.2 plan_parser.py (371 行)
- 公開 API: `parse_frontmatter`, `upsert_plan`, `detect_cycle`, `main`
- 依存: PyYAML + **vendor 内部 `migrations.v35_plan_registry`**（v35 SQLite schema 7 テーブル必須）
- HELIX 混入: docstring の "契約: PLAN-092 §5/§7/§8"、`.helix/helix.db` 探索
- **W1 推奨**: SQLite upsert 部分は本 PLAN 範囲外（W2 以降）。`parse_frontmatter` のみ移植し warning 出力に留める軽量版

### 2.3 plan_schema.py (228 行)
- 公開 API: `PLAN_ID_RE`, mini plan ID 系統、`evaluate_g2_design_evidence`, CLI `g2-check`
- HELIX 混入: `MINI_PLAN_ID_RE`/`MPLAN-` 概念全体、`DESIGN_SHARD_DIRS = ("D-API","D-DB","D-ARCH","D-TEST","D-THREAT")` 直書き、`.helix/{mini-plans,plans,phase.yaml}` 参照
- `PLAN_ID_RE` が UT-TDD §1.10 形式 (`^PLAN-\d{3}(-[a-z0-9-]+)?$` / `^PLAN-MM-\d{3}$`) と非互換
- **W1 推奨**: mini-plan 系統と `evaluate_g2_design_evidence` は範囲外（mini-plan 全削除、G2 evidence は別 PLAN で再設計）

### 2.4 plan_validator.py (487 行)
- 公開 API: `VALID_*` 定数群、`PlanFrontmatter` dataclass、`load_frontmatter`, `validate_plan`, `detect_dependency_cycle`
- **`load_valid_roles()` が `cli/ROLE_MAP.md` を runtime read** → UT-TDD 移植時に最初に潰す必要 (P0)
- `_plan_search_directories` が module 配置から `parents[2]` で repo root 逆算 → src/ut_tdd 配置で path 階層が変わるため **`UT_TDD_PROJECT_ROOT` 環境変数 or 引数化** 必須
- 常に exit 0 (warn-only) → fail-close へ exit code 設計変更要

### 2.5 plan_lint.py (431 行)
- 公開 API: `Finding`, `_lint_plan`, CLI `--duplicates`
- HELIX 混入: `draft|finalized|completed` ハードコード × 4、`SELF_REFERENCE_PLAN_NUMBERS = {36, 37}` HELIX PLAN ID 直書き、`plan_number < 36` retroactive skip
- 本文 ASSERTIVE_PATTERNS / `SECTION_2_1_RE` / `W_ITEM_RE` は HELIX template §2.1 W-NNN 構造前提
- OS 依存なし（pure text）

### 2.6 plan_deps_helper.py (309 行)
- 公開 API: `resolve_project_root`, `dependency_payload`, `render_dependency_tree`, `generates_payload`, `reverse_generates_lookup`
- HELIX 混入: `HELIX_PROJECT_ROOT` 環境変数 (line 19)
- `docs/plans/PLAN-*.md` glob は UT-TDD §1.10 と一致 → OK
- OS 依存: `Path.as_posix()` で正規化済、Windows 中立

### 2.7 import 関係

```
plan_frontmatter ── yaml_parser, concurrent_lock      (vendor 内部)
plan_parser     ── yaml, migrations.v35_plan_registry  (vendor 内部、W1 範囲外推奨)
plan_schema     ── yaml_parser                         (vendor 内部)
plan_validator  ── yaml, ROLE_MAP.md (filesystem)     (W1 で除去)
plan_lint       ── stdlib のみ                          (self-contained)
plan_deps_helper── yaml, plan_validator                (内部依存)
```

外部依存は PyYAML のみ。vendor 内部 `yaml_parser` / `concurrent_lock` / `migrations/` は別途扱い判断必要。

## 3. test module 構造サマリ

| test | 件数 | 主 fixture | HELIX 依存 | OS 依存 | W1 対応 |
|---|---|---|---|---|---|
| test_plan_frontmatter.py (191 行) | 4 + 11 parametrize | tmp_path, `FAIL_STAGE_ENV` | `parents[3]` repo root, **vendor PLAN-001〜011 body hash 固定** | `os.replace` 同名 lock 干渉懸念 | parametrize 11 件削除、UT-TDD 独自 fixture で再構築 |
| test_plan_parser.py (420 行) | ~11 | in-memory sqlite + v35 migrate | PLAN-092, ROLE_MAP, ADR-026 文字列 | 中立 | **W1 範囲外保留**（SQLite 移植連動） |
| test_plan_schema.py (142 行) | ~9 | tmp_path | `.helix/{plans,mini-plans}`, `D-API/D-DB/D-ARCH`, PLAN-019/020/021/022 hardcoded | 中立 | mini-plan 全削除で 3-4 cases に縮小 |
| test_plan_validator.py (319 行) | ~16 | tmp_path, **subprocess + `python3` hardcoded** | ROLE_MAP 経由 | **Windows 第一級 fail 確実** | `sys.executable` 化必須 |
| test_plan_deps_helper.py (196 行) | ~5 | tmp_path | PLAN-091〜093 ID, ROLE_MAP, `cli/helix-plan` artifact 例 | 中立 | 比較的素直に通せる |

横断問題:
- 全 test が `sys.path.insert(0, LIB_DIR)` で cli/lib を直接 import → src/ut_tdd 配置で全面書換え
- `test_plan_validator.py` の Windows subprocess invocation は最大の OS 依存

## 4. template 差分

### 4.1 impl/template.md (79 行)
- 必須 frontmatter: plan_id / title / kind=impl / layer=L4 / drive=be / status=draft / created / owner / agent_slots / generates / dependencies
- HELIX 混入: `parent: PLAN-091`, `artifact_type: test`, ADR-NNN-related, `helix code find`, `helix code stats`, `helix/HELIX_CORE.md`, `skills/SKILL_MAP.md`, agent_slots に `pm-advisor/se/pmo-sonnet`
- UT-TDD 主語化が必要な行: L21, L25, L29-32, L36-37, L41-43, L49, L57, L67, L75

### 4.2 design/template.md (72 行)
- 必須 frontmatter: 同上 (kind=design / layer=L2)
- HELIX 混入: PLAN-091/PLAN-087/ADR-021 等、`helix codex --role tl-advisor`、`cli/templates/plan/design/template.md`、HELIX_CORE.md, docs/commands/index.md, SKILL_MAP.md, ROLE_MAP.md
- 本文 §3 Step 1-5 (Web 検索 / tl-advisor adversarial / ADR snapshot / PLAN 起票 / 双方向 trace) を UT-TDD §6 (GitHub 統制) と整合させて要減量

## 5. Sprint .2-.6 移植への含意

### 5.1 PLAN-001 §3 範囲の tighten 推奨

**範囲外に carry**:
- `plan_parser.py` の SQLite v35 upsert 部分 → W2 別 PLAN
- `plan_schema.py` の `evaluate_g2_design_evidence` (HELIX D-shard 依存) → 別 PLAN
- mini-plan (MPLAN-NNN) サポート全体 → UT-TDD 要件不在のため **削除**
- `test_plan_parser.py` の SQLite 依存テスト → W2 連動

**範囲内追加**:
- VALID_STATUSES / VALID_DECISION_OUTCOMES 定数 + 排他 validator + テスト
- kind × drive matrix validator + テスト
- (kind, workflow_phase) pair 許可表 + validator + テスト
- `load_valid_roles()` 廃止 + `VALID_ROLES` enum ハードコード
- exit code 0/2/1 三段階 fail-close 化
- VALID_ARTIFACT_TYPES の `test` → `test_design`/`test_code` 分離（全 fixture + template 書換え横断）
- `concurrent_lock._flock_*` の Windows 対応 (`portalocker` または `msvcrt` 分岐)
- `test_plan_validator.py` の `python3` → `sys.executable` 化

### 5.2 pyproject.toml の依存

最低限: `PyYAML + pytest`。Windows 厳密対応なら `portalocker` 追加。標準ライブラリ + これら 2-3 件で十分始まる。

### 5.3 落とし穴 Top 3

1. **`load_valid_roles()` ROLE_MAP runtime read**: 先に潰さないと validator 起動時 FileNotFoundError → 全 test fail。Sprint .3 で最優先
2. **`test_plan_validator.py` `python3` hardcoded subprocess**: Windows native で fail。Sprint .5 test 実装時に `sys.executable` 化必須
3. **`test_plan_frontmatter.py` の vendor PLAN-001〜011 body hash 固定**: UT-TDD 配置で `parents[3]` は別物。delete 推奨、削除前に「legacy 保証なし」リスクを文書化

## 6. 参考: 主要絶対パス

- 要件: `docs/governance/ut-tdd-agent-harness-requirements_v1.1.md`
- vendor module: `vendor/helix-source/cli/lib/plan_{frontmatter,parser,schema,validator,lint,deps_helper}.py`
- vendor tests: `vendor/helix-source/cli/lib/tests/test_plan_*.py`
- vendor templates: `vendor/helix-source/cli/templates/plan/{impl,design}/template.md`
- vendor 補助: `vendor/helix-source/cli/lib/{yaml_parser,concurrent_lock}.py`, `vendor/helix-source/cli/lib/migrations/v35_plan_registry.py`, `vendor/helix-source/cli/ROLE_MAP.md`
