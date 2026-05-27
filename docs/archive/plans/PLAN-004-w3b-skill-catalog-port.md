---
plan_id: PLAN-004-w3b-skill-catalog-port
title: "PLAN-004: W3b-A skill catalog port (rule-based catalog + §7.2 skill suggest engine)"
kind: impl
layer: L4
drive: be
status: archived
created: 2026-05-22
confirmed_at: 2026-05-22
owner: PM (Opus)
agent_slots:
  - role: po
    slot_label: "PO -- スコープ判断・受入承認"
  - role: tl
    slot_label: "TL -- 設計レビュー・契約凍結"
  - role: se
    slot_label: "SE -- 機能実装 (Codex blocker 中は Opus 直接実装 fallback)"
  - role: qa
    slot_label: "QA -- テスト戦略・品質判定"
  - role: docs
    slot_label: "Docs -- skill doc seed / migration doc 更新"
generates:
  - artifact_path: src/ut_tdd/skill/__init__.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/skill/catalog.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/skill/suggest.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/tests/test_skill_catalog.py
    artifact_type: test_code
  - artifact_path: src/ut_tdd/tests/test_skill_suggest.py
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - PLAN-001-w1-plan-schema-lint-port
    - PLAN-002-w2-vmodel-trace-lint-port
    - PLAN-003-w3a-task-classification-port
  blocks: []
related_adr: []
related_docs:
  - docs/governance/ut-tdd-agent-harness-requirements_v1.1.md
  - docs/migration/helix-to-ut-tdd-cutover-strategy.md
  - docs/migration/helix-porting-map.md
---

## §0 PLAN

W3 第 2 段 (W3a 後段) として `vendor/helix-source/cli/lib/skill_catalog.py` (590 行) を `src/ut_tdd/skill/` へ adapt port する。LLM 委譲経路 (`skill_classifier.py` 167 行 + `skill_recommender.py` 349 行 = 516 行) は Codex Windows AppContainer sandbox 8009001d blocker 中 exercise 不能なため、本 PLAN-004 では **rule-based catalog + rule-based skill suggest** のみ port し、LLM 委譲は **PLAN-005 (W3b-B)** として PLAN-CODEX-FIX 解消後に carry する。

handover §5 では W3b = catalog + classifier + recommender 3 セットを 1 PLAN で扱う想定だったが、Sprint .1 解析の結果 W3a 同様 scope 縮小判断 (D5 vendor `task_dispatcher.py` を別物として W3a port 対象外にしたのと同パターン) を採る。

## §1 目的

UT-TDD `ut-tdd skill suggest` (§7.2) の母集団を作る rule-based catalog engine を確立する:

- `src/ut_tdd/skill/catalog.py`: `docs/skills/*.md` (§7.2 仕様 path) を walk して frontmatter (YAML、W1 で使用済の PyYAML) から catalog dict を生成
- `src/ut_tdd/skill/suggest.py`: §7.2 `ut-tdd skill suggest` JSON contract (`{required:[], optional:[], missing:[]}`) を rule-based matching (triggers + verification + helix_layer) で実装
- `vendor_candidate=true` 表示 (未移植 skill を gate input に乗せない)
- W3b-A scope 外: classifier (LLM 分類)、recommender (LLM 推挙)、references walk、JSONL classifier 連携 → すべて PLAN-005 (W3b-B) へ carry

## §2 背景

- W3a (PLAN-003) で task classify + estimate + orchestration の rule-based engine が確立。`recommended_path` / `recommended_gates` から **どの工程で・どの skill が要るか** の推挙が次の必要機能
- §7.2 `skill suggest` は PLAN / diff / text → `docs/skills/*.md` 候補を返す。本実装が無いと G3 (実装着手) / G4 (実装凍結) で skill 適用 audit を機械化できない
- vendor `skill_catalog.py` (PyYAML 不使用の bespoke parser 590 行) は W1 で確立した `yaml.safe_load` 路線と drift。bespoke parser は port せず置き換える
- vendor `skills_root/<category>/<name>/SKILL.md` という 3 階層構造を前提とするが、§7.2 は `docs/skills/*.md` flat 構造を仕様化。port 時に rewrite が必要
- vendor `command_mapper.derive_commands` は HELIX command 名 (`helix-codex` / `helix-claude` 等) に直結。UT-TDD は `ut-tdd` 名前空間で別物 → port 時に rewrite or skip 判定要
- UT-TDD では HELIX skill 体系 (`~/ai-dev-kit-vscode/skills/`) を直接参照しない (CLAUDE.md `vendor/helix-source/` は read-only source material)。skill canonical は `docs/skills/*.md`

## §3 実装計画 (Sprint 標準 8 ステップ)

### Step 1: Sprint .1 Entry / vendor 解析

- `vendor/helix-source/cli/lib/skill_catalog.py` 590 行を Read、`_parse_mapping` / `_extract_frontmatter` / `_build_skill_entry` / `build_catalog` / `find_skill` / `_build_jsonl_entry` のコア API を把握
- `vendor/helix-source/cli/lib/skill_classifier.py` 167 行 (LLM 委譲、本 W3b-A scope 外) と `skill_recommender.py` 349 行 (LLM 委譲、本 W3b-A scope 外) を briefly 参照、W3b-B carry 内容を確定
- vendor `cli/lib/skill_jsonl_schema.py` (ALLOWED_AGENTS / ALLOWED_PHASES / validate_entry) のうち、W3b-A で rule-based suggest が必要とする部分を抽出
- UT-TDD §7.2 `skill suggest` JSON contract と vendor `helix skill search` 出力との drift table 作成
- 成果物: `docs/plans/PLAN-004-sprint-1-analysis.md`

### Step 2: Sprint .2 着手前調査 / skeleton

- `src/ut_tdd/skill/` package 新設 (W1/W2/W3a と並列、`src/ut_tdd/` 直下から分離)
- W1 で port 済の `plan_frontmatter.py` (PyYAML 経路) を reuse
- skeleton: `catalog.py` (`CatalogEntry` dataclass + `build_catalog` stub + `find_skill` stub) / `suggest.py` (`SuggestionResult` dataclass + `suggest_skills` stub)
- `docs/skills/` ディレクトリ新設 (empty、本 PLAN-004 では catalog 読み込み対象として準備)

### Step 3: Sprint .3 機能設計 + adapt port

- §7.2 catalog entry contract: `{id, name, path, description, helix_layer, triggers, verification, agent_default, source_hash}` (UT-TDD 仕様に整合、vendor JSONL からは references / classification / commands を除外し W3b-B carry)
- §7.2 `skill suggest` JSON contract: `{required: [{skill, reason, confidence}], optional: [...], missing: [{skill, vendor_candidate, reason}]}`
- rule-based matching:
  - PLAN frontmatter `layer` → catalog entry `helix_layer` 一致で候補に上げる
  - task text → catalog entry `triggers` regex match で候補
  - `verification` field を `recommended_gates` に紐付けて required/optional 振り分け
  - catalog に無いが PLAN/text が指す skill (例: `R4 promotion_strategy` 言及あるが `reverse-pack` skill 不在) → `missing` + `vendor_candidate=true`
- vendor bespoke YAML parser → PyYAML `yaml.safe_load` に置換
- vendor `skills_root/<cat>/<name>/SKILL.md` 構造 → `docs/skills/<id>.md` flat 構造に rewrite
- vendor `command_mapper` / classification metadata / references walk は W3b-B carry

### Step 4: Sprint .4 test rewrite

- vendor `test_skill_catalog.py` の test pattern を流用、UT-TDD §7.2 JSON contract を fixture で網羅
- 主要 case:
  - catalog 構築 (empty dir → skill_count=0 / 単一 skill / 複数 skill)
  - frontmatter 必須 field 不在の skip + warn
  - `find_skill` (id 完全一致 / name fallback / 不在)
  - suggest required/optional/missing 振り分け
  - PLAN frontmatter layer match による required 提示
  - triggers regex match による optional 提示
  - vendor_candidate=true の missing 提示
  - confidence floor / cap
  - save_catalog + load_catalog round-trip

### Step 5: Sprint .5 機械チェック sweep

- `python3 -m py_compile` で全 module syntax 確認
- `pytest src/ut_tdd/tests/` で W1 124 + W2 35 + W3a 134 + W3b-A 追加分の全 PASS 確認

### Step 6: Sprint .6 skill doc seed + dogfood

- `docs/skills/` に最小限の seed (例: `design-pack.md` / `test-pack.md` / `reverse-pack.md` / `operations-pack.md`)。§7.2 サンプル JSON で言及される 4 skill のみ最小実装
- PLAN-001 / PLAN-002 / PLAN-003 を入力にして `suggest_skills` を dogfood、JSON 出力を carry note に記録

### Step 7: Sprint .7 code-reviewer subagent レビュー

- code-reviewer subagent で W3b-A 実装を 5 軸 (機能性 / 安全性 / 保守性 / テスト / §7.2 仕様準拠) でレビュー
- P0 → in-place fix、P1 → carry note、P3 → carry PLAN

### Step 8: Sprint .8 commit + carry note

- 1 PLAN = 1 commit (`feat(W3b-A): port HELIX skill_catalog to UT-TDD rule-based engine`)
- §6 carry note に Sprint .1 drift、Sprint .7 review 結果、PLAN-005 (W3b-B) への引継ぎを記録

## §4 受入条件 / DoD

- [ ] Step 1〜8 のすべてが該当 section に存在
- [ ] `generates` の 5 artifact がすべて作成済
- [ ] `src/ut_tdd/skill/__init__.py` + `catalog.py` + `suggest.py` が py_compile clean
- [ ] vendor test_skill_catalog.py 相当の test_skill_catalog.py + test_skill_suggest.py が `src/ut_tdd/tests/` に存在し、すべて PASS
- [ ] pytest 全件 PASS (W1 124 + W2 35 + W3a 134 + W3b-A 追加分)
- [ ] §7.2 `skill suggest` JSON contract が fixture で網羅 (required / optional / missing 3 field + confidence + reason)
- [ ] PyYAML 採用 (vendor bespoke YAML parser 置換)
- [ ] `docs/skills/` flat 構造 (vendor 3 階層から rewrite)
- [ ] code-reviewer APPROVE
- [ ] frontmatter `kind == impl`、§0〜§5 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: PLAN-001 (requires)、PLAN-002 (requires)、PLAN-003 (requires)、PLAN-005-w3b-b-skill-llm-port (本 PLAN-004 後段、未起票)
- 関連 ADR: なし
- 参照 docs:
  - `docs/governance/ut-tdd-agent-harness-requirements_v1.1.md` §7.1 (capability class) / §7.2 (skill suggest)
  - `docs/migration/helix-to-ut-tdd-cutover-strategy.md` Mode 1
  - `docs/migration/helix-porting-map.md` W3 行

## §6 carry note

(Sprint 進行中に追記)

### W3b-A 範囲外 carry

- **PLAN-005 (W3b-B)**: `skill_classifier.py` + `skill_recommender.py` LLM 委譲経路 port (Codex 委譲を rule-based の補完 boundary case で実行)。PLAN-CODEX-FIX 先行解消推奨
- **PLAN-004-b**: vendor `command_mapper.derive_commands` の UT-TDD command 名前空間 (`ut-tdd codex` / `ut-tdd skill` 等) 対応版 port (W6 CLI binding と同期)
- **PLAN-004-c**: skill `references/*.md` walk + intro 抽出 (vendor `_extract_reference_intro` 相当)。`docs/skills/<id>/references/` 構造を採用するか `docs/skills/*.md` flat のみとするかは UT-TDD spec 拡張要
- **PLAN-004-d**: JSONL catalog (`skill-catalog.jsonl`) + classification metadata (status: pending/approved/manual) port (PLAN-005 LLM 経路に同期)
- **PLAN-CODEX-FIX**: Codex Windows AppContainer sandbox 8009001d (W3a と同じ、未解消)
