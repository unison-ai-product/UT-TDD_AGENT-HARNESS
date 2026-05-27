# PLAN-003 Sprint .1 -- vendor task classification 解析

> 親 PLAN: [PLAN-003-w3a-task-classification-port.md](PLAN-003-w3a-task-classification-port.md)
> 日付: 2026-05-22
> 担当: PM (Opus) 直接解析 (Codex sandbox blocker のため)

## §1 解析対象

| vendor path | size | 役割 |
|---|---|---|
| `vendor/helix-source/cli/lib/effort_classifier.py` | 8.6 KB | LLMClassifierBase 継承 + rule-based scoring + Codex 委譲 |
| `vendor/helix-source/cli/lib/task_type_inference.py` | 3.0 KB | rule-based regex で 4 種 (実装/レビュー/設計/調査) 推定 |
| `vendor/helix-source/cli/lib/task_dispatcher.py` | 6.4 KB | **automation allowlist execution** (helix:command/shell:script/http:webhook) |
| `vendor/helix-source/cli/lib/tests/test_effort_classifier.py` | 6.4 KB | scoring + LLM mock pattern |
| `vendor/helix-source/cli/lib/tests/test_task_type_inference.py` | 1.8 KB | 4 種推定の pattern |
| `vendor/helix-source/cli/lib/tests/test_task_dispatcher.py` | 0.6 KB | allowlist exec の smoke |
| `vendor/helix-source/cli/templates/prompts/effort-classify.md` | 0.8 KB | LLM 委譲 prompt |

## §2 vendor vs UT-TDD §7.2 仕様 drift

### Drift table (重要度順、10 件)

| # | 項目 | vendor | UT-TDD §7.2 | 影響 | 対応 |
|---|---|---|---|---|---|
| **D1** | effort_classifier の LLM 委譲 path | LLMClassifierBase 継承で Codex 呼び出し | rule-based + 必要時 capability class escalation (LLM 委譲は W3b で skill_recommender と統合) | **大** | W3a では `score_task`/`map_to_effort` (rule 部分) のみ流用、LLM path 削除 |
| **D2** | HELIX cache (`.helix/budget/cache/classify`) | 30 日 TTL ファイル cache | UT-TDD cache layer 未策定 | 中 | 削除、in-memory のみ |
| **D3** | HELIX role 名 hard-code | tl/se/pg/fe/qa/security/dba/devops/docs/research/legacy/perf 12 種 | UT-TDD §1.8 7 種 (po/tl/qa/aim/uiux/se/docs) + capability class (frontier-reviewer/worker/fast-checker) | 中 | rewrite |
| **D4** | task_type 推定の出力 | 4 種日本語 (実装/レビュー/設計/調査/不明) | UT-TDD VALID_KINDS 11 種 (impl/design/poc/reverse/troubleshoot/refactor/retrofit/research/add-design/add-impl/recovery) | **大** | 4→11 rewrite (regex pattern 拡張) |
| **D5** | task_dispatcher.py の正体 | automation allowlist execution (helix:command/shell:script/http:webhook を allowlist で実行する infra) | UT-TDD §7.2 orchestration 連携 (capability class escalation) は全く別物 | **大** | **W3a port 対象外**。`task/orchestration.py` を新規実装で §7.2 を満たす。vendor task_dispatcher.py の port 評価は別 PLAN (PLAN-003-c) |
| **D6** | model_registry.py / defaults_loader.py 依存 | resolve_role_model() 経由で `cli/config/models.yaml` を引く | UT-TDD では models.yaml を持たない、capability class で抽象化 (§7.1) | 中 | 依存削除、constants 化 |
| **D7** | task estimate (PERT 三点見積) | **vendor に存在しない** | §7.2 で必須 (optimistic / most_likely / pessimistic / expected = (o+4m+p)/6 / risk_factor 1.0-2.0 / buffered = expected * risk_factor / story_points / risks) | **大** | **UT-TDD で新規実装** |
| **D8** | size 判定 3 軸 max ルール | vendor は files / lines 個別判定で max 取りなし | §7.2 で「3 軸 (file count / changed lines / API-DB-ops impact) の最大値を size とする」 | 中 | **新規実装** |
| **D9** | JSON contract | `{effort, score, breakdown, reason, recommended_thinking, split_recommended}` | §7.2 task classify: `{kind, drive, size, complexity, split_required, recommended_path, recommended_gates, confidence, reasons}` | **大** | 新規実装、互換性なし |
| **D10** | task_type explicit marker | `[タスク種別]: 実装` で frontmatter override | UT-TDD では PLAN frontmatter `kind` フィールドが正本、explicit marker は補助 | 小 | marker pattern 流用、PLAN frontmatter `kind` 優先 |

## §3 W3a scope 再評価

### 当初 PLAN-003 §3 (起票時) vs Sprint .1 後改訂

**当初**: 3 vendor module (effort_classifier + task_type_inference + task_dispatcher) を 1:1 で port

**Sprint .1 後の改訂提案**:
- ~~vendor `task_dispatcher.py` port~~ → **scope 外** (D5、別物 = automation allowlist。`task/dispatcher.py` を generates から削除し、PLAN-003-c carry)
- vendor `effort_classifier.py` → **scope 縮小** (`score_task`/`map_to_effort` rule 部分のみ流用、LLM 委譲 + cache + model_registry は削除)
- vendor `task_type_inference.py` → **rewrite** (4 種 → 11 kind 拡張、PLAN frontmatter `kind` 優先)
- **新規実装**: `task/orchestration.py` で §7.2 capability class escalation、task estimate (PERT) を新規実装
- 新規 carry: PLAN-003-c (vendor task_dispatcher.py port 評価)

### 改訂版 W3a 成果物

| artifact | 内容 |
|---|---|
| `src/ut_tdd/task/__init__.py` | package init |
| `src/ut_tdd/task/effort.py` | rule-based scoring (vendor `score_task`/`map_to_effort` 流用) + PERT 三点見積 (新規) |
| `src/ut_tdd/task/classifier.py` | §7.2 task classify JSON contract (kind 11 種推定 + drive + size 3 軸 max + complexity + split_required + recommended_gates + confidence + reasons) |
| `src/ut_tdd/task/orchestration.py` | §7.2 capability class escalation 判定 (frontier-reviewer / worker / fast-checker) |
| `src/ut_tdd/tests/test_task_effort.py` | scoring + PERT fixture |
| `src/ut_tdd/tests/test_task_classifier.py` | §7.2 JSON contract 全 field 網羅 |
| `src/ut_tdd/tests/test_task_orchestration.py` | escalation 経路 fixture (confidence < 0.7 / risk_factor ≥ 1.6 / production impact) |
| `docs/templates/prompts/effort-classify.md` | UT-TDD capability class 化、HELIX model 名除去 |

## §4 上位 5 落とし穴 (Sprint .3 実装注意)

1. **PLAN frontmatter `kind` 優先 vs 推定**: UT-TDD では PLAN frontmatter `kind` が正本。classify は frontmatter があれば parse 結果優先、無ければ regex 推定 (`--text` mode のみ regex pure)
2. **size 3 軸 max の lines 推定**: `--text` 入力で changed lines を知る方法が無い → context 引数 (`--files`/`--lines`) で外部入力前提、推定不能なら size=`unknown` (§7.2 想定外、本 W3a で `null` 扱い + carry)
3. **complexity vs effort の混同**: vendor `effort` (low/medium/high/xhigh) は §7.2 `complexity` に相当。「effort = 工数 (時間)」「complexity = 難度」で言葉を切り分ける
4. **capability class の正本**: §7.1 で `frontier-reviewer` / `worker` / `fast-checker` の 3 class を確立。`tl/se/pg` ではない (HELIX role と混同しない)
5. **JSON contract の field 順 + null 扱い**: §7.2 サンプル JSON の field 順を保つ (kind→drive→size→...)。`confidence: null` は禁止、最低 0.5 floor

## §5 次 Sprint プラン (本 session では Sprint .1 まで)

**本 session 完了**: Sprint .1 (vendor 解析 + drift table + scope 縮小提案)

**次 session で実施 (Sprint .2-.8)**:
- Sprint .2 skeleton: `src/ut_tdd/task/` package + 3 module skeleton (`effort.py`/`classifier.py`/`orchestration.py`)
- Sprint .3 rewrite: §7.2 JSON contract + size 3 軸 max + PERT 三点見積 + capability class escalation
- Sprint .4 test rewrite: vendor pattern 流用 + §7.2 contract 網羅
- Sprint .5 pytest 全回帰 (W1 124 + W2 35 + W3a 追加)
- Sprint .6 prompt template port + dogfood (PLAN-001/002/003 を classify + estimate)
- Sprint .7 code-reviewer
- Sprint .8 commit

## §6 PLAN-003 §3/§6 改訂への反映

本 Sprint .1 解析を受けて PLAN-003 §3 / §6 を以下に改訂する:

- §3 `generates` から `task/dispatcher.py` + `test_task_dispatcher.py` を削除、`task/orchestration.py` + `test_task_orchestration.py` を追加
- §3 Step 3 に「vendor task_dispatcher.py は automation allowlist であり別物、§7.2 orchestration は新規実装」を明示
- §6 W3a 範囲外 carry に `PLAN-003-c: vendor task_dispatcher.py (automation allowlist) port 評価` を追加
- §6 Sprint .1 解析所見セクションに本 doc summary を追記
- §6 Sprint .2-.8 を次 session 引継ぎとして明示
