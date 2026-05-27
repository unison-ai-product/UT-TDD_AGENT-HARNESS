---
plan_id: PLAN-001
title: "PLAN-001: W1 — PLAN schema and lint port"
kind: impl
layer: L4
drive: be
status: archived
created: 2026-05-22
owner: "PM (Opus)"
agent_slots:
  - role: po
    slot_label: "PO — スコープ判断・受入承認"
  - role: tl
    slot_label: "TL — adapt 設計レビュー（UT_TDD_PROJECT_ROOT 対応、enum 同期）"
  - role: se
    slot_label: "SE — src/ut_tdd/ 配下 Python 移植実装"
  - role: docs
    slot_label: "Docs — テンプレ＆ガバナンス docs 整合チェック"
generates:
  - artifact_path: src/ut_tdd/plan_frontmatter.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/plan_parser.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/plan_schema.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/plan_validator.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/plan_lint.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/plan_deps_helper.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/tests/test_plan_frontmatter.py
    artifact_type: test_code
  - artifact_path: src/ut_tdd/tests/test_plan_parser.py
    artifact_type: test_code
  - artifact_path: src/ut_tdd/tests/test_plan_schema.py
    artifact_type: test_code
  - artifact_path: src/ut_tdd/tests/test_plan_validator.py
    artifact_type: test_code
  - artifact_path: src/ut_tdd/tests/test_plan_deps_helper.py
    artifact_type: test_code
  - artifact_path: src/ut_tdd/tests/test_plan_lint.py
    artifact_type: test_code
  - artifact_path: docs/templates/plan/impl/template.md
    artifact_type: template
  - artifact_path: docs/templates/plan/design/template.md
    artifact_type: template
dependencies:
  parent: null
  requires: []
  blocks:
    - PLAN-002
    - PLAN-006
related_docs:
  - docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md
  - docs/migration/helix-porting-map.md
  - docs/migration/helix-source-inventory.md
finalized: 2026-05-22
---

## §0 PLAN

UT-TDD Agent Harness の最優先 wave（W1）として、HELIX snapshot の `cli/lib/plan_*.py` 5 本 + テスト + impl/design template を `src/ut_tdd/` 配下へ adapt 移植する。本 PLAN は HELIX 流（PLAN-NNN + gate）で進める porting 期間中の起票第1号。

## §1 目的

`ut-tdd plan lint` の中核となる PLAN frontmatter parser / schema / validator / lint engine を UT-TDD 所有のコードとして確立する。これにより:

- PLAN-002 以降の W2/W3/W4 PLAN を UT-TDD-owned lint で検証できる
- `helix` CLI を経由せず PLAN を機械検証できる足場ができる
- `requirements_v1.1.md` の VALID_* enum を schema 側で正本化できる

## §2 背景

- 現状、PLAN lint は HELIX snapshot (`vendor/helix-source/`) 経由でしか動かない。porting 期間中は HELIX で代行できるが、UT-TDD 独自運用に切替えるためには W1 を最初に通す必要がある。
- porting-map では W1 が P0、`reuse_class=adapt`。`copy-with-rename` ではなく、enum / path / 名称の置換と `requirements_v1.1.md` への整合が必須。
- vendor 側 `plan_lint.py` は status 整合（draft/finalized/completed の文中表記 vs frontmatter）を主に検査する軽量 lint。enum drift fixture は `plan_schema.py` 側に追加する。

## §3 範囲（Sprint .1 知見で 2026-05-22 改訂）

詳細根拠は `docs/plans/PLAN-001-sprint-1-analysis.md` 参照。

### 含む（W1 本体）

- `vendor/helix-source/cli/lib/plan_frontmatter.py` → `src/ut_tdd/plan_frontmatter.py`
  - `.helix` default を `.ut-tdd` へ
  - `HELIX_PLAN_FRONTMATTER_FAIL_STAGE` → `UT_TDD_*` rename
  - **`status = "finalized"` ハードコード を VALID_STATUSES (draft/confirmed/completed/archived) と整合する `confirmed`/`completed` 書込へ再設計**
  - **POSIX `flock` 依存の `concurrent_lock._flock_*` を Windows 対応へ（`portalocker` 追加 or `msvcrt` 分岐）**
- `vendor/helix-source/cli/lib/plan_parser.py` → `src/ut_tdd/plan_parser.py`（**SQLite upsert 部分は除外、`parse_frontmatter` のみ 軽量版**）
- `vendor/helix-source/cli/lib/plan_schema.py` → `src/ut_tdd/plan_schema.py`（**mini-plan 系統と `evaluate_g2_design_evidence` は除外**、`PLAN_ID_RE` を UT-TDD §1.10 形式へ）
- `vendor/helix-source/cli/lib/plan_validator.py` → `src/ut_tdd/plan_validator.py`
  - **`load_valid_roles()` 廃止、VALID_ROLES enum (po/tl/qa/aim/uiux/se/docs) を定数化**
  - **VALID_STATUSES / VALID_DECISION_OUTCOMES / VALID_ARTIFACT_TYPES (test→test_design/test_code 分離) / kind×drive matrix / (kind, workflow_phase) pair validator を新規追加**
  - **L3.8 を VALID_LAYERS に追加**
  - **exit code を 0/2/1 三段階 fail-close へ（warn-only mode から変更）**
  - **`_plan_search_directories` の `parents[2]` 逆算を `UT_TDD_PROJECT_ROOT` 環境変数または引数化**
- `vendor/helix-source/cli/lib/plan_lint.py` → `src/ut_tdd/plan_lint.py`
  - `draft|finalized|completed` ハードコード → UT-TDD 4 値
  - `SELF_REFERENCE_PLAN_NUMBERS = {36, 37}` / `plan_number < 36` 削除
- `vendor/helix-source/cli/lib/plan_deps_helper.py` → `src/ut_tdd/plan_deps_helper.py`（`HELIX_PROJECT_ROOT` → `UT_TDD_PROJECT_ROOT`）
- 補助 module の最低限移植: `vendor/.../yaml_parser.py` は直接 PyYAML 使用へ置換（独自 wrapper を持ち込まない）
- 対応する pytest 5 本のうち以下を port:
  - test_plan_frontmatter: parametrize 11 件削除、UT-TDD 独自 fixture で再構築
  - test_plan_schema: mini-plan テスト削除、残 3-4 cases へ縮小
  - test_plan_validator: `python3` → `sys.executable` 化、ROLE_MAP 依存除去、新規 enum / matrix / pair validator のテスト追加
  - test_plan_deps_helper: 素直に port、PLAN-091 ID を UT-TDD PLAN ID へ書換え
  - **test_plan_parser は SQLite v35 依存のため W1 範囲外**（PLAN-001-b として carry、W2 で実施）
- `vendor/helix-source/cli/templates/plan/impl/template.md` → `docs/templates/plan/impl/template.md`（UT-TDD 主語化、`artifact_type: test` → `test_code`、agent_slots を UT-TDD 7 role へ）
- 同 `design/template.md` も同時 port
- `pyproject.toml` 最低限 skeleton（PyYAML + pytest、Windows 厳密対応なら portalocker）

### 含まない（別 PLAN へ carry）

- **PLAN-001-b（W1 後段、別 PLAN として起票予定）**: `plan_parser.py` の SQLite v35 plan_registry upsert + `migrations/v35_plan_registry.py` 移植 + `test_plan_parser.py` port
- **PLAN-001-c（別 PLAN として起票予定）**: `plan_schema.py` の `evaluate_g2_design_evidence` を UT-TDD §2 V-model 4 artifact 評価に再設計
- W6 `ut-tdd plan lint` CLI entrypoint shim（PowerShell / POSIX）— Python module までで止める
- W7 hook 連携（.claude/settings.json）
- W4 team runner との接続
- 全 PLAN template（impl / design 以外、recovery / poc / refactor 等は後続 wave）
- `helix` CLI の置き換え（porting 期間中は HELIX 流継続、`ut-tdd` 化は別 PLAN）
- mini-plan (MPLAN-NNN) サポート — UT-TDD 要件不在のため **完全削除、復活させない**

## §4 実装計画（HELIX Sprint 8 ステップ準拠）

### Sprint .1: Entry / 着手前調査

- vendor の plan_*.py を Read（全 6 ファイル）
- vendor tests Read（test_plan_frontmatter / parser / schema / validator / deps_helper）
- enum drift 発見: `requirements_v1.1.md` VALID_* と vendor 現在値の差分を表化
- skeleton 確認: `src/ut_tdd/__init__.py`, `pyproject.toml`, `src/ut_tdd/tests/__init__.py` の有無

### Sprint .2: skeleton 作成（最小）

- `src/ut_tdd/__init__.py`（空）
- `src/ut_tdd/tests/__init__.py`（空）
- `pyproject.toml`: pytest が動く最低限のみ。dependency は標準ライブラリで足る前提
- `conftest.py` は必要なら追加

### Sprint .3: 機能 port（adapt）

- 6 module を順に copy → rename → 内部書き換え
- 書き換え軸:
  - `from helix.*` / `from cli.lib.*` 相対 import を `from ut_tdd.*` 絶対 import へ
  - `.helix` リテラルを `.ut-tdd` へ（path defaults）
  - VALID_KIND / VALID_LAYER / VALID_DRIVE / VALID_STATUS を `requirements_v1.1.md` と差分突合
  - HELIX_PROJECT_ROOT 環境変数は UT_TDD_PROJECT_ROOT として残し HELIX 名は移植元コメントに留める
  - Windows path（大文字 / 小文字 mismatch）は realpath 比較ではなく `Path.resolve()` 統一

### Sprint .4: tests port

- vendor test 5 本を `src/ut_tdd/tests/` へ
- import path 修正、`.helix` リテラルを `.ut-tdd` へ
- fixture path（temp dir）は OS 中立に
- 追加: enum drift fixture（`requirements_v1.1.md` ↔ schema の整合 1 ケース）

### Sprint .5: 機械チェック + 全テスト

- `python -m py_compile src/ut_tdd/*.py`
- `python -m pytest src/ut_tdd/tests/ -q`
- 失敗 0 を確認
- `src/ut_tdd/plan_lint.py` を impl template に走らせて lint clean を確認

### Sprint .6: docs/templates 整備

- impl template と design template を `docs/templates/plan/impl/template.md` / `docs/templates/plan/design/template.md` へ copy + UT-TDD 主語化
- 自身（PLAN-001.md）に対しても新 lint が clean に通ることを確認

### Sprint .7: レビュー + carry note

- セルフレビュー：4 artifact trace（PLAN ↔ test design ↔ code ↔ test code）の確認
- 残 debt を §6 へ記録
- pmo-sonnet レビューは porting 期間内ではコスト判断で skip 可（理由を §6 に明記）

### Sprint .8: Exit / commit

- §5 DoD checklist 全 ✓
- 1 commit にまとめる（W1 = 1 トピック原則）

## §5 受入条件 / DoD

- [ ] `src/ut_tdd/plan_{frontmatter,parser,schema,validator,lint,deps_helper}.py` 6 本が存在
- [ ] `src/ut_tdd/tests/test_plan_*.py` 5 本が port されており `pytest` が PASS
- [ ] `python -m py_compile src/ut_tdd/plan_*.py` が exit 0
- [ ] `python -m src.ut_tdd.plan_lint docs/plans/PLAN-001-w1-plan-schema-lint-port.md` が clean
- [ ] `docs/templates/plan/impl/template.md` と `docs/templates/plan/design/template.md` が存在
- [ ] schema VALID_* が `requirements_v1.1.md` と一致（drift fixture 添付）
- [ ] `.helix` リテラルが移植先コード本文に残らない（コメントの「移植元」言及は OK）
- [ ] Windows + POSIX 両対応（PathLib 使用 / OS 固定パス不使用）
- [ ] HELIX 流ゲート: G3（API/Schema Freeze 相当）として schema 凍結を確認、G4 として実装＆test 完了
- [ ] 1 commit、メッセージは `feat(plan-lint): port W1 plan schema and lint engine to src/ut_tdd`

## §6 carry note / debt

- W7 hook 連携は別 PLAN（本 PLAN では `.claude/settings.json` を触らない）
- `ut-tdd` CLI shim は W6 PLAN で扱う
- pmo-sonnet review は subagent 未登録のため general-purpose で代替（Sprint .1 実績）
- enum drift fixture は最小 1 ケース。全 enum 網羅は W2 以降

### Sprint .1 知見由来 carry（2026-05-22 追記）

- **PLAN-001-b として別起票**: `plan_parser.py` の SQLite v35 plan_registry upsert + migrations 移植 + `test_plan_parser.py` SQLite 依存 case port。W2（PLAN-002 vmodel lint）と同時期実施想定
- **PLAN-001-c として別起票**: `plan_schema.py` の `evaluate_g2_design_evidence` を UT-TDD §2 V-model 4 artifact 評価器へ再設計（HELIX D-shard 命名規約からの脱却）
- **PLAN-001-d 検討**: `concurrent_lock` を `portalocker` ベース or stdlib `msvcrt`/`fcntl` 分岐の cross-platform util へ再実装。W1 では最低限の Windows fallback で凌ぐ
- ROLE_MAP.md 廃止は本 PLAN で確定 → UT-TDD 7 role enum (`po/tl/qa/aim/uiux/se/docs`) が `src/ut_tdd/plan_validator.py` に hardcode される。将来 role を増やすときは `requirements_v1.1.md §1.8` と同時更新する運用に切替え
- test_plan_frontmatter の vendor PLAN-001〜011 hash 固定 fixture 削除に伴う「legacy 保証なし」リスクは W1 commit で文書化（UT-TDD は vendor PLAN の bit-for-bit 互換を保証しない、独自テストで等価性を担保）

### Sprint .7 code-reviewer 指摘由来 carry（2026-05-22 追記、APPROVE 判定下の P1 carry 3 件 + P3 carry）

- **[P1] §1.8 必須 role 条件 (kind/layer 別) validator 未実装**: requirements §1.8 D で規定される「`kind in [design, impl, add-design, add-impl]` → `tl 必須`、`kind=impl かつ layer=L4` → `qa 追加必須`、`kind in [poc, recovery, troubleshoot]` → `aim 必須`、`layer in [L1, L8]` → `po 必須`」を `validate_agent_slots` に追加。PLAN-001-e として独立起票推奨
- **[P1] §1.9 requires 先 PLAN の status=completed 機械検証未実装**: requirements §1.10 E。PLAN-001-e または W2 で併合
- **[P3] msvcrt.LK_LOCK busy-loop CPU スタベーション対策**: 通常負荷では問題ないが CI 並列実行で `.lock` 競合時に CPU 100%。`LK_NBLCK` + `time.sleep(0.05)` リトライへ変更、または PLAN-001-d で `portalocker` swap に統合
- **[適用済の小修正、本 PLAN 内で完了]**:
  - `plan_lint.PLAN_ID_LINE_RE` を `plan_validator.PLAN_ID_RE` と同形式に統一 (MM-NNN の 3+ 桁許容、slug 多セグメント許容)
  - `kind in [poc, reverse]` かつ `workflow_phase is None` 時の layer=cross 強制 warning 追加
  - `plan_validator.py` docstring に「最終同期: requirements v1.1 §1.2-1.8 (2026-05-22)」明記
  - `pyproject.toml` から `portalocker` 宣言削除 (実装は `msvcrt` 直接呼出)
  - `plan_lint._lint_plan` の `_resolve_plan_number` dead code を comment 化

### W7/W8 接続用 carry

- `.claude/hooks/pretooluse-agent-guard.sh` は agent-guard 用途のみ enable。残 13 hook script は HELIX runtime (`cli/lib/helix-common.sh`, `helix.db`) 強依存のため未 enable、W7 で UT-TDD-owned hook 再実装時に整理
- `.claude/agents/*.md` 19 件は helix init 配置のままで動作確認済 (pmo-sonnet smoke PASS)、W7 で UT-TDD-spec の subagent 定義へ整理
- helix init が生成した `docs/design/L2-design.md`, `docs/requirements/L1-requirements.md`, `docs/features/PLAN-001/D-*` は HELIX template scaffolding で UT-TDD 経路では参照しない。本 commit には含めない、W7/W8 で整理または削除

## §7 関連 PLAN / 参照

- 関連 PLAN: なし（本 PLAN が初回）
- 後続 blocks: PLAN-002（W2 vmodel lint）、PLAN-006（W6 doctor）
- 参照 docs:
  - `docs/governance/ut-tdd-agent-harness-extraction-plan_v0.1.md` §切り出し順 Step 4-5
  - `docs/migration/helix-porting-map.md` Wave W1 行
  - `docs/migration/helix-source-inventory.md`
  - `docs/governance/ut-tdd-agent-harness-requirements_v1.1.md` VALID_* テーブル
