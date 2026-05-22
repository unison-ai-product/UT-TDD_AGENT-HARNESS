# PLAN-004 Sprint .1 -- vendor skill catalog 解析

> 親 PLAN: [PLAN-004-w3b-skill-catalog-port.md](PLAN-004-w3b-skill-catalog-port.md)
> 日付: 2026-05-22
> 担当: PM (Opus) 直接解析 (Codex sandbox blocker のため)

## §1 解析対象

| vendor path | size | 役割 |
|---|---|---|
| `vendor/helix-source/cli/lib/skill_catalog.py` | 590 行 (20 KB) | YAML frontmatter parser + skill walk + catalog 生成 + find_skill + JSONL catalog |
| `vendor/helix-source/cli/lib/skill_classifier.py` | 167 行 (8.7 KB) | **LLM 委譲** (Codex 経由 skill 分類)、W3b-A scope 外 |
| `vendor/helix-source/cli/lib/skill_recommender.py` | 349 行 (18 KB) | **LLM 委譲** (Codex 経由 skill 推挙)、W3b-A scope 外 |
| `vendor/helix-source/cli/lib/skill_jsonl_schema.py` | 219 行 (8.1 KB) | ALLOWED_AGENTS / ALLOWED_PHASES / validate_entry (JSONL classifier 連携) |
| `vendor/helix-source/cli/lib/skill_dispatcher.py` | 868 行 (32 KB) | catalog + recommender + delegation runner (本 W3b-A 対象外、PLAN-005 後段判定) |
| `vendor/helix-source/cli/lib/tests/test_skill_catalog.py` | (要確認) | catalog 単体 test |
| `vendor/helix-source/cli/lib/tests/test_skill_catalog_integration.py` | (要確認) | catalog 統合 test |

## §2 vendor vs UT-TDD §7.2 仕様 drift

### Drift table (重要度順、10 件)

| # | 項目 | vendor | UT-TDD §7.2 | 影響 | 対応 |
|---|---|---|---|---|---|
| **D1** | YAML parser | bespoke `_parse_mapping` / `_parse_list` / `_parse_scalar` (PyYAML 不使用、~150 行) | W1 で PyYAML 採用済 (`yaml.safe_load`) | **大** | bespoke parser を全置換、PyYAML 使用 |
| **D2** | skill 配置構造 | `skills_root/<category>/<name>/SKILL.md` (3 階層、`~/ai-dev-kit-vscode/skills/` 前提) | `docs/skills/*.md` flat (§7.2 spec) | **大** | flat 構造前提に rewrite。`category` field は frontmatter から取得 |
| **D3** | command_mapper 依存 | `derive_commands()` で HELIX command (`helix-codex` / `helix-claude` / `helix-skill`) を catalog に embed | UT-TDD は `ut-tdd` 名前空間で別物 | 中 | W3b-A では command embed を skip (entry に `commands` field を含めない)、W6 CLI binding と同期して PLAN-004-b で追加 |
| **D4** | references walk | `skill_md.parent / "references" / *.md` を walk して title + intro 抽出 | UT-TDD spec で references 構造は未明示 | 中 | W3b-A scope 外 (PLAN-004-c carry)、flat 構造のみ対応 |
| **D5** | JSONL catalog (classification 連携) | `_build_jsonl_entry` で classification status (pending/approved/manual) と source_hash を export、`skill_classifier` がこの skeleton を更新 | UT-TDD は LLM 分類経路を W3b-B (PLAN-005) で実装、本 W3b-A は不要 | 中 | W3b-A は **JSON catalog のみ** port (`save_catalog`/`load_catalog`)、JSONL は PLAN-004-d carry |
| **D6** | LLM 委譲経路 (classifier + recommender) | `skill_classifier.SkillClassifier` + `skill_recommender._run_recommender()` が Codex 委譲 | Codex Windows sandbox 8009001d blocker 中 exercise 不能 | **大** | W3b-A では LLM 委譲 path 全削除、PLAN-005 (W3b-B) で PLAN-CODEX-FIX 解消後に統合 |
| **D7** | §7.2 skill suggest 出力 | vendor `helix skill search` JSON: `{recommendations: [{skill_id, score, ...}]}` (rank ベース) | §7.2: `{required: [{skill, reason, confidence}], optional: [...], missing: [{skill, vendor_candidate, reason}]}` (3 bucket 振り分け) | **大** | **新規実装** (vendor 出力を rewrite) |
| **D8** | trigger matching | vendor `skill_classifier` は LLM に投げて triggers を更新 (frontmatter triggers は seed) | W3b-A では frontmatter `triggers` を rule-based regex として直接 match | 中 | W3b-A 採用、PLAN-005 で LLM 補完 boundary case 追加 |
| **D9** | agent default | vendor `_default_agent()` で skill_id / category / phases から HELIX role (tl/se/pg/security/qa) を返す | UT-TDD §1.8 VALID_ROLES 7 種 (po/tl/qa/aim/uiux/se/docs) + §7.1 capability class (frontier-reviewer/worker/fast-checker) | 中 | rewrite (capability class 抽象化、HELIX role 名は保存しない) |
| **D10** | vendor_candidate=true 表示 | vendor では vendor_candidate 概念無し (UT-TDD で新規仕様化) | §7.2: 未移植 skill は `vendor_candidate=true` で表示し正本化なしに gate input にしない | 中 | **新規実装** (catalog 不在 skill 言及時、missing bucket に vendor_candidate=true で出力) |

## §3 W3b-A scope 再評価

### 当初 handover §5 (W3b 想定) vs Sprint .1 後改訂

**当初**: skill_catalog + skill_classifier + skill_recommender 3 modules を 1 PLAN (PLAN-004) で port (~46 KB vendor)

**Sprint .1 後の改訂提案**:
- ~~vendor `skill_classifier.py` port~~ → **scope 外** (D6、LLM 委譲、W3b-B PLAN-005 carry)
- ~~vendor `skill_recommender.py` port~~ → **scope 外** (D6、LLM 委譲、W3b-B PLAN-005 carry)
- vendor `skill_catalog.py` → **scope 縮小** (YAML parser → PyYAML、3 階層 → flat、command_mapper / references / JSONL は除外して W3b-A 軽量化)
- **新規実装**: `src/ut_tdd/skill/suggest.py` で §7.2 `{required/optional/missing}` JSON contract を rule-based matching で実装
- 新規 carry: PLAN-005 (W3b-B classifier + recommender LLM 委譲) + PLAN-004-b (command embed) + PLAN-004-c (references walk) + PLAN-004-d (JSONL catalog)

### 改訂版 W3b-A 成果物

| artifact | 内容 |
|---|---|
| `src/ut_tdd/skill/__init__.py` | package init |
| `src/ut_tdd/skill/catalog.py` | rule-based catalog 構築 (`docs/skills/*.md` walk → frontmatter PyYAML parse → CatalogEntry dataclass) + find_skill + save/load |
| `src/ut_tdd/skill/suggest.py` | §7.2 skill suggest JSON contract (required/optional/missing rule-based matching、PLAN frontmatter `layer` / task text `triggers` regex / `verification` field を使用) |
| `src/ut_tdd/tests/test_skill_catalog.py` | catalog 構築 + frontmatter parse + find_skill + save/load round-trip |
| `src/ut_tdd/tests/test_skill_suggest.py` | §7.2 JSON contract 全 field 網羅 + required/optional/missing 振り分け + vendor_candidate=true |
| `docs/skills/*.md` (W3b-A Sprint .6 で seed) | §7.2 サンプルで言及される 4 skill (`design-pack` / `test-pack` / `reverse-pack` / `operations-pack`) を最小実装 |

## §4 上位 5 落とし穴 (Sprint .3 実装注意)

1. **`docs/skills/*.md` flat 構造 vs vendor 3 階層**: vendor は `category/name/SKILL.md` で category を path から取得。UT-TDD flat 構造では category を frontmatter (`metadata.category` field) から取得する必要。skill seed 起票時に強制 (validator 違反 → catalog skip + warn)
2. **PyYAML 採用時の vendor 互換性**: vendor bespoke parser は `[a, b, c]` 文字列を list に展開する `_normalize_frontmatter_value` を持つ。PyYAML は `[a, b, c]` (YAML flow style) を list に展開できるが、`triggers: a, b, c` (CSV) は文字列のまま。UT-TDD では **YAML flow style か block style のみ正規** とし、CSV は禁止する frontmatter 規約を確立
3. **§7.2 required/optional/missing の判定基準**: vendor は LLM 推挙の rank score、UT-TDD W3b-A は rule-based。**判定 rule の明示が必要**:
   - required: PLAN frontmatter `layer` が catalog entry `helix_layer` に一致 AND `verification` field で gate 言及 (例: G3.8 → test-pack)
   - optional: triggers regex が text match するが PLAN layer に直接対応しない
   - missing: PLAN/text が指す skill (例: `R4 promotion_strategy`) が catalog に不在 → vendor_candidate=true
4. **vendor_candidate=true の判定**: 「PLAN/text が言及するが catalog に不在」の判定 rule をどう作るか。HELIX vendor では skill_id list を持つが UT-TDD W3b-A は flat docs/skills のみ。**hard-coded reference list** (例: `R4`/`promotion_strategy` → `reverse-pack` / `postmortem` → `operations-pack`) で代用、W3b-B で LLM 補完
5. **catalog の保存形式と round-trip**: vendor JSON (`save_catalog` → `json.dumps(indent=2)`) と JSONL (`write_jsonl_catalog` → 1 entry/行)。W3b-A は **JSON のみ** port、JSONL は PLAN-004-d carry。`load_catalog` / `find_skill` の round-trip テストを必ず Sprint .4 に含める

## §5 次 Sprint プラン (本 session は Sprint .1 まで、PLAN-003 と同パターン)

**本 session 完了**: Sprint .1 (vendor 解析 + drift table + scope 縮小提案)

**次 session で実施 (Sprint .2-.8)**:
- Sprint .2 skeleton: `src/ut_tdd/skill/` package + 2 module skeleton (`catalog.py`/`suggest.py`)
- Sprint .3 rewrite: §7.2 catalog entry contract + skill suggest 3 bucket 振り分け + capability class 整合
- Sprint .4 test rewrite: vendor pattern 流用 + §7.2 contract 網羅
- Sprint .5 pytest 全回帰 (W1 124 + W2 35 + W3a 134 + W3b-A 追加)
- Sprint .6 skill doc seed + dogfood (PLAN-001/002/003 を suggest)
- Sprint .7 code-reviewer
- Sprint .8 commit

## §6 PLAN-004 §3/§6 改訂への反映

本 Sprint .1 解析を受けて PLAN-004 §3 / §6 を以下に改訂する (起票時点で反映済):

- §0 で「W3b = catalog + classifier + recommender 3 セット」想定を「W3b-A = catalog のみ」に縮小、classifier + recommender は PLAN-005 (W3b-B) として PLAN-CODEX-FIX 後段に carry
- §3 Step 1 で vendor 3 module の port 対象判定を明示 (catalog のみ + suggest 新規実装)
- §6 carry に PLAN-005 / PLAN-004-b/c/d を列挙
