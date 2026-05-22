# Session Handover — 2026-05-22 (session 2 終了時)

> 目的: W3a 完遂 + W3b Sprint .1 boundary の進捗を次 session に引き継ぐ。
> session: 2026-05-22 session 2 (W3a Sprint .2-.8 完遂 → W3b PLAN-004 起票 + Sprint .1 解析)
> 担当: PM (Opus) 直接実装 (Codex sandbox blocker 継続)

## §1 現在の状態

### 完了 wave

| wave | PLAN | commit | 内容 |
|---|---|---|---|
| W1 | PLAN-001 | `aeac1d3` | HELIX vendor plan_schema/lint/validator/frontmatter/deps_helper/parser 6 module port。124 PASS、code-reviewer APPROVE |
| W2 | PLAN-002 | `bc58bfa` | vmodel_lint を §2.4 必須 8 directed edge graph 検証へ rewrite。35 test PASS、code-reviewer APPROVE_WITH_MINOR (Important 4 件 in-place fix 済) |
| W3a Sprint .1 | PLAN-003 | `7411a49` | PLAN-003 起票 + vendor 解析 (drift table 10 件) + scope 改訂 |
| **W3a Sprint .2-.8** | PLAN-003 | **`75a6927`** | task classification + effort + orchestration 3 module port。**134 test 追加** (累計 293 PASS)、§7.2 JSON contract 全 field 網羅、code-reviewer APPROVE_WITH_MINOR (Important 3 件 + Minor 1 件 in-place fix 済)、PLAN-001/002/003 dogfood 済 |

### 進行中 wave

| wave | PLAN | 状態 | 次 step |
|---|---|---|---|
| W3b-A | PLAN-004 | **Sprint .1 完了 (vendor 解析 + scope 縮小)、Sprint .2-.8 未着手** | Sprint .2 skeleton 作成から再開 |

### 累計 git history

```
75a6927 feat(W3a): port HELIX task classification + effort + orchestration to UT-TDD
7411a49 chore(W3a): PLAN-003 起票 + Sprint .1 解析 + session handover (boundary)
bc58bfa feat(W2): port HELIX vmodel lint to UT-TDD V-model 4 artifact + 8 edge engine
aeac1d3 feat(W1): port HELIX plan schema/lint engine to UT-TDD src/ut_tdd
dff1d78 chore: tighten local runtime ignores
3da408d docs: clarify UT-TDD source of truth
98a7774 docs: initialize UT-TDD agent harness
```

### 累計 test 状況

- pytest **293 PASS** (W1 124 + W2 35 + W3a 134)、0.52s
- self-validator dogfood: PLAN-001 / PLAN-002 / PLAN-003 / PLAN-004 すべて exit 0
- vmodel_lint dogfood: PLAN-001 / PLAN-002 / PLAN-003 exit_code=2 (P1 only)、PLAN-004 exit_code=1 (E7/E8 fail = Sprint .4 で test 作成すれば解消する期待動作、PLAN-003 と同パターン)

## §2 W3b-A Next Action (次 session 開始時の最初の作業)

### 着手前に再読すべき doc

1. `docs/plans/PLAN-004-w3b-skill-catalog-port.md` (frontmatter + §0-§6、Sprint .1 改訂済)
2. `docs/plans/PLAN-004-sprint-1-analysis.md` (drift 10 件 + scope 縮小提案)
3. `docs/governance/ut-tdd-agent-harness-requirements_v1.1.md` §7.1 (capability class) / §7.2 (skill suggest JSON contract: required/optional/missing)
4. `vendor/helix-source/cli/lib/skill_catalog.py` (590 行、`_extract_frontmatter` / `_build_skill_entry` / `build_catalog` / `find_skill` を中心に流用、bespoke YAML parser は port せず PyYAML 置換)
5. `src/ut_tdd/plan_frontmatter.py` (W1 で確立した PyYAML 経路、`yaml.safe_load` 再利用)

### Sprint .2 着手手順

1. `src/ut_tdd/skill/__init__.py` 新設
2. `src/ut_tdd/skill/catalog.py` skeleton:
   - `CatalogEntry` dataclass (id / name / category / path / description / helix_layer / triggers / verification / agent_default / source_hash)
   - `build_catalog(skills_root: Path) -> dict[str, Any]` (`docs/skills/*.md` walk、PyYAML 経路)
   - `find_skill(catalog, skill_id) -> dict | None` (id 完全一致 → name fallback)
   - `save_catalog(catalog, path)` / `load_catalog(path)` (JSON round-trip)
3. `src/ut_tdd/skill/suggest.py` skeleton:
   - `SuggestionResult` dataclass (required: list / optional: list / missing: list)
   - `suggest_skills(catalog, *, plan_frontmatter=None, task_text=None) -> SuggestionResult`
   - `_match_required()` / `_match_optional()` / `_detect_missing_vendor_candidates()`
4. `docs/skills/` directory 新設 (本 PLAN-004 Sprint .6 で seed 起票、Sprint .2 では空 dir で OK)

### Sprint .3 rewrite で注意 (Sprint .1 §4 落とし穴)

- **flat 構造の category 取得**: `docs/skills/<id>.md` (flat) では path から category を得られない。frontmatter `metadata.category` を必須にする (validator 違反 → catalog skip + warn)。skill seed 起票時に強制
- **PyYAML 採用**: vendor bespoke `_parse_mapping` / `_normalize_frontmatter_value` を全廃、`yaml.safe_load(content_between_---)` を使用。CSV 形式 (`triggers: a, b, c`) は禁止、YAML flow style (`triggers: [a, b, c]`) または block style のみ許可
- **§7.2 required/optional/missing 判定 rule** (rule-based):
  - required: PLAN frontmatter `layer` が catalog entry `helix_layer` に一致 AND `verification` field で gate 言及 (例: G3.8 → test-pack)
  - optional: triggers regex が text match するが PLAN layer に直接対応しない
  - missing: PLAN/text が指す skill (例: `R4 promotion_strategy`) が catalog に不在 → vendor_candidate=true
- **vendor_candidate hard-coded reference**: hard-coded reference list (例: `R4`/`promotion_strategy` → `reverse-pack` / `postmortem` → `operations-pack`) で代用。W3b-B (PLAN-005) で LLM 補完統合
- **HELIX role / capability class 整合**: vendor `_default_agent()` が返す `tl/se/pg` を §1.8 VALID_ROLES 7 種 + §7.1 capability class に rewrite。catalog entry の `agent_default` は capability class (`frontier-reviewer` / `worker` / `fast-checker`) で持つ

### Sprint .4 test fixture 必須網羅

- §7.2 JSON contract 全 field (required/optional/missing 各 entry の skill / reason / confidence / vendor_candidate)
- catalog build: empty dir / 単一 skill / 複数 skill / frontmatter 不在 skip
- find_skill: id 完全一致 / name fallback / 不在
- save/load JSON round-trip
- suggest: PLAN layer 一致 required / triggers regex optional / vendor_candidate missing
- confidence floor 0.5 / cap 1.0

## §3 環境制約 (継続中)

### Codex sandbox blocker (継続)

- Windows AppContainer sandbox で PowerShell 起動 8009001d error (memory [project_codex_windows_sandbox.md] 参照)
- W3a 進行中も Opus 直接実装 fallback で完遂
- W3b-A も同様 Opus 直接実装 fallback で進行可能 (rule-based のみのため LLM 委譲不要)
- W3b-B (PLAN-005 LLM 委譲 path) は PLAN-CODEX-FIX 解消が前提

### Windows cp932 encoding (継続)

- ASCII marker (`[OK]` / `[FAIL]` / `[WARN]` / `[SKIP]` / `[DEBT]`) + em-dash `--` 統一済
- 新規 module でも踏襲

### Pre-commit hook (継続)

- `.git/hooks/pre-commit` の `cli.lib.skip_annotation_linter` 不在 skip patch 適用済 (PLAN-001-f carry)
- secret scan / drift-check は維持

## §4 carry PLAN 一覧 (未起票、次 session で起票候補)

### W1 由来 (継続)

- **PLAN-001-b**: SQLite v35 plan_registry upsert + migrations port (W2 timeframe、未着手)
- **PLAN-001-c**: G2 evidence evaluator (HELIX D-shard → UT-TDD V-model 4 artifact)
- **PLAN-001-d**: cross-platform lock portalocker swap 検討
- **PLAN-001-e**: §1.8 required role conditions + §1.9 requires status=completed 検証
- **PLAN-001-f**: `.git/hooks/pre-commit` の UT-TDD 化整理 (W7 hook cutover 候補)

### W2 由来 (継続)

- **PLAN-002-b**: §2.7 coverage ≥80% 検証 (coverage.py / pytest-cov integration)
- **PLAN-002-c**: §2.2 段階 A2 G3.8 TDD Red freeze (pytest collection mode + 失敗理由分類 plugin)
- **PLAN-002-d**: vmodel_loader + vmodel-semantics.yaml port
- **PLAN-002-e**: vendor deliverables.json → 不要判定済、再評価のみ carry
- **PLAN-002-f**: test_vmodel_lint.py の test_design artifact 化 (W3 entry までに `docs/test-design/W2-vmodel-lint-unit-test-design.md` 起票)

### W3a 由来 (PLAN-003 §6 carry note 確定済)

- **PLAN-003-b**: `ut-tdd task classify --diff origin/main...HEAD` git diff parse path
- **PLAN-003-c**: vendor `task_dispatcher.py` (automation allowlist execution) の UT-TDD port 評価
- **PLAN-003-d**: size=null 出力時 (3 軸入力なし) を CLI binding (W6) で `--files` / `--lines` / `--diff` 自動取得
- **PLAN-003-e**: `classifier._recommended_gates` `G3.8` 出典 (gate-policy.md UT-TDD 化) docstring 追記
- **PLAN-003-f**: `sys.path.insert` を conftest.py に集約 (W6 src layout 整理時)

### W3b-A 由来 (本 session 起票)

- **PLAN-005 (W3b-B)**: `skill_classifier.py` + `skill_recommender.py` LLM 委譲経路 port (PLAN-CODEX-FIX 解消後)
- **PLAN-004-b**: vendor `command_mapper.derive_commands` の UT-TDD command 名前空間対応 (W6 CLI binding 同期)
- **PLAN-004-c**: skill `references/*.md` walk + intro 抽出 (`docs/skills/<id>/references/` 拡張要)
- **PLAN-004-d**: JSONL catalog + classification metadata port (PLAN-005 LLM 経路同期)

### 環境

- **PLAN-CODEX-FIX**: Codex Windows AppContainer sandbox 8009001d (未解消、W3b-B 着手前に解消推奨)

## §5 次 wave 候補 (W3b-A 完遂後)

- **W3b-B PLAN-005**: skill_classifier + skill_recommender LLM 委譲 port。PLAN-CODEX-FIX 先行解消が望ましい
- **W4**: team orchestration (`ut-tdd team run` の `hybrid` mode 実装)
- **W5**: handover/session recovery (`ut-tdd handover` CLI、本 SESSION-doc を機械生成可能に)
- **W6**: setup/doctor/runtime detection (CLI binding 統合)
- **W7**: Claude Code hooks/agents (本 repo の `.claude/hooks/` 13 unused HELIX hook 整理)

詳細 wave map: `docs/migration/helix-porting-map.md`

## §6 cutover 進捗 (Mode 0-3、`docs/migration/helix-to-ut-tdd-cutover-strategy.md` 参照)

- 現在 **Mode 1**: HELIX drive + UT-TDD asset 部分 cutover
  - W1 (plan-lint) / W2 (vmodel-lint) / W3a (task classification) cutover 済
  - W3b-A (skill catalog) 進行中
- 次 Mode 2 (UT-TDD drive smoke) には W6 で `ut-tdd doctor` / `ut-tdd setup` / `ut-tdd status` 完成が前提
- Mode 3 (UT-TDD-only) には W7 で `.claude/hooks/` 全 cutover が前提

## §7 次 session 開始時のチェックリスト

1. `git log --oneline -7` で最新 commit を確認 (期待: 本 handover commit が最新)
2. `git status` で working tree が clean なことを確認 (`.claude/hooks/` 等の untracked は本 session scope 外で残る)
3. 本 handover doc + `docs/plans/PLAN-004-w3b-skill-catalog-port.md` + `docs/plans/PLAN-004-sprint-1-analysis.md` を Read
4. `PYTHONPATH=src python3 -m pytest src/ut_tdd/tests/ -q` で 293 PASS を再確認
5. Sprint .2 (`src/ut_tdd/skill/` skeleton 作成) から再開

## §8 開いている問い (次 session で再評価)

- W3b-A Sprint .6 で seed する `docs/skills/*.md` 4 件 (`design-pack` / `test-pack` / `reverse-pack` / `operations-pack`) の中身をどこまで作るか (最小 frontmatter のみ vs 本文も込み)
- `docs/skills/` flat 構造の category field 必須化を frontmatter validator に組み込むか (W3b-A Sprint .3 で判断)
- vendor_candidate hard-coded reference list を W3b-A scope に入れるか PLAN-004-e として切り出すか (Sprint .3 着手時の規模次第)
- W3b-B PLAN-005 起票タイミング: W3b-A Sprint .8 完遂直後 vs PLAN-CODEX-FIX 解消後
