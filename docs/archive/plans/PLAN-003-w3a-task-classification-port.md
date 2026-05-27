---
plan_id: PLAN-003-w3a-task-classification-port
title: "PLAN-003: W3a task classification port (effort + type + dispatcher)"
kind: impl
layer: L4
drive: be
status: archived
created: 2026-05-22
confirmed_at: 2026-05-22
completed_at: 2026-05-22
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
    slot_label: "Docs -- prompt template / cutover doc 更新"
generates:
  - artifact_path: src/ut_tdd/task/__init__.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/task/effort.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/task/classifier.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/task/orchestration.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/tests/test_task_effort.py
    artifact_type: test_code
  - artifact_path: src/ut_tdd/tests/test_task_classifier.py
    artifact_type: test_code
  - artifact_path: src/ut_tdd/tests/test_task_orchestration.py
    artifact_type: test_code
  - artifact_path: docs/templates/prompts/effort-classify.md
    artifact_type: template
dependencies:
  parent: null
  requires:
    - PLAN-001-w1-plan-schema-lint-port
    - PLAN-002-w2-vmodel-trace-lint-port
  blocks: []
related_adr: []
related_docs:
  - docs/governance/ut-tdd-agent-harness-requirements_v1.1.md
  - docs/migration/helix-to-ut-tdd-cutover-strategy.md
  - docs/migration/helix-porting-map.md
---

## §0 PLAN

W3a 第3波の前段 (W3 を 2 PLAN 分割: 本 PLAN = W3a = task classification、後続 PLAN-004 = W3b = skill subsystem)。HELIX vendor から effort 分類 / task type 推定 / task dispatch の 3 module を `src/ut_tdd/task/` へ adapt port する。UT-TDD requirements_v1.1 §7.2 仕様 (task classify / task estimate JSON output) に整合させ、`ut-tdd task classify` / `ut-tdd task estimate` の核心 engine を確立する。

## §1 目的

W1/W2 で凍結した plan / vmodel lint engine を踏み台に、PLAN 起票 / sprint 開始時の経路判定を機械化する基盤を整える:

- vendor `effort_classifier.py` (8.6 KB) を `src/ut_tdd/task/effort.py` に port、三点見積 + risk_factor を出力する `EffortEstimate` を提供
- vendor `task_type_inference.py` (3.0 KB) を `src/ut_tdd/task/classifier.py` に port、kind/drive/size/complexity を推定する `classify_task` を提供
- vendor `task_dispatcher.py` (6.4 KB) を `src/ut_tdd/task/dispatcher.py` に port、classify 結果 + estimate 結果から orchestration の routing 推奨を返す `dispatch_task` を提供
- vendor `cli/templates/prompts/effort-classify.md` を `docs/templates/prompts/effort-classify.md` に port、LLM 委譲時の prompt 正本を保持 (本 PLAN では rule-based path 優先、LLM 呼び出しは W3b skill subsystem 統合時)

W3a 範囲外として明示 carry:
- `ut-tdd task classify` / `ut-tdd task estimate` CLI binding は W6 (`ut-tdd doctor` / runtime detection) で総合実装
- LLM 委譲 (fast-checker class へ escalate) は W3b で skill_recommender と一括統合 (Codex sandbox blocker 解消後)
- `task classify --diff origin/main...HEAD` の diff parse path は CLI binding 時に実装

## §2 背景

- W1 plan_lint + W2 vmodel_lint が完成し、PLAN frontmatter / 4 artifact + 8 edge / kind dispatcher が確立した。次の必須機能は **タスク受領時の経路判定** で、これ無しでは G0.5 (企画突合) / G1 (要件完了) が rule-based で機械化できない
- HELIX vendor は `task_type_inference.py` で kind/drive/size を hard-coded keyword で推定する rule-based、`effort_classifier.py` で三点見積を出す。UT-TDD §7.2 仕様の JSON contract に揃えれば port 可能
- `task_dispatcher.py` は HELIX role/model 名 (gpt-5.5 high 等) を hard-coded で出力する。UT-TDD では `cli/config/models.yaml` ではなく **capability class** (`frontier-reviewer` / `worker` / `fast-checker` 等) で抽象化する仕様 (§7.1) のため、model 名 hard-code を rewrite
- UT-TDD では HELIX skill 体系 (`~/ai-dev-kit-vscode/skills/`) を直接参照しない。skill 推挙は W3b で `docs/skills/*.md` を canonical として再実装

## §3 実装計画 (Sprint 標準 8 ステップ)

### Step 1: Sprint .1 Entry / vendor 解析

- `vendor/helix-source/cli/lib/effort_classifier.py` / `task_type_inference.py` / `task_dispatcher.py` を Read
- vendor test (test_effort_classifier 6.4 KB / test_task_type_inference 1.8 KB / test_task_dispatcher 0.6 KB) の pattern 確認
- vendor prompt template `cli/templates/prompts/effort-classify.md` (0.8 KB) の structure 確認
- UT-TDD §7.2 JSON contract との drift table 作成 (model 名 hard-code / capability class / orchestration escalation 等)
- 成果物: `docs/plans/PLAN-003-sprint-1-analysis.md`

### Step 2: Sprint .2 着手前調査 / skeleton

- `src/ut_tdd/task/` package 新設 (W1/W2 と並列、`src/ut_tdd/` 直下から分離)
- W1 で port 済の plan_validator の VALID_KINDS / VALID_DRIVES / VALID_LAYERS を reuse
- skeleton: `effort.py` (EffortEstimate dataclass + estimate stub) / `classifier.py` (ClassificationResult dataclass + classify_task stub) / `dispatcher.py` (DispatchRecommendation dataclass + dispatch_task stub)

### Step 3: Sprint .3 機能設計 + adapt port

- §7.2 task classify JSON contract: `{kind, drive, size, complexity, split_required, recommended_path, recommended_gates, confidence, reasons}` を出力
- §7.2 size 判定 3 軸 (file count / changed lines / API-DB-ops impact) の最大値ルールを実装
- §7.2 task estimate JSON contract: `{optimistic, most_likely, pessimistic, expected, risk_factor, buffered, story_points, risks}` を出力 + PERT 式 `expected = (o + 4*m + p) / 6`
- §7.2 orchestration 連携: classify confidence < 0.7 → `frontier-reviewer` review、risk_factor ≥ 1.6 or production impact → `frontier-reviewer` review
- vendor model 名 hard-code (gpt-5.5 high / claude-sonnet-4-6 等) を **capability class** (`frontier-reviewer` / `worker` / `fast-checker`) に rewrite
- HELIX role 廃止 (ROLE_MAP), UT-TDD §1.8 VALID_ROLES (7 種: po/tl/qa/aim/uiux/se/docs) に合わせる

### Step 4: Sprint .4 test rewrite

- vendor test pattern を流用しつつ、UT-TDD §7.2 JSON contract を fixture で網羅
- 主要 case:
  - kind 推定 (impl / design / refactor / poc / reverse / recovery 等)
  - drive 推定 (be / fe / fullstack / db / agent)
  - size 判定 (XS / S / M / L / XL の境界、3 軸 max ルール)
  - complexity 推定 (low / medium / high)
  - split_required (XL → true)
  - confidence 計算 (rule match count ベース)
  - reasons (理由文字列の生成)
  - estimate: 三点見積、risk_factor 計算、buffered_hours = expected * risk_factor
  - dispatch: escalation 経路 (frontier-reviewer / tl review / fast-checker)

### Step 5: Sprint .5 機械チェック sweep

- `python3 -m py_compile` で全 module syntax 確認
- `pytest src/ut_tdd/tests/` で W1 124 + W2 35 + W3a 追加分の全 PASS 確認

### Step 6: Sprint .6 prompt template port + dogfood

- vendor `effort-classify.md` を `docs/templates/prompts/effort-classify.md` に port、UT-TDD capability class 化に合わせて HELIX model 名を除去
- PLAN-001 / PLAN-002 / PLAN-003 を入力にして classify + estimate を dogfood、各 PLAN の JSON 出力を carry note に記録

### Step 7: Sprint .7 code-reviewer subagent レビュー

- code-reviewer subagent で W3a 実装を 5 軸 (機能性 / 安全性 / 保守性 / テスト / §7.2 仕様準拠) でレビュー
- P0 → in-place fix、P1 → carry note、P3 → carry PLAN

### Step 8: Sprint .8 commit + carry note

- 1 PLAN = 1 commit (`feat(W3a): port HELIX task classifier/effort/dispatcher to UT-TDD`)
- §6 carry note に Sprint .1 drift、Sprint .7 review 結果、PLAN-004 (W3b) への引継ぎを記録

## §4 受入条件 / DoD

- [ ] Step 1〜8 のすべてが該当 section に存在
- [ ] `generates` の 8 artifact がすべて作成済
- [ ] `src/ut_tdd/task/__init__.py` + `effort.py` + `classifier.py` + `dispatcher.py` が py_compile clean
- [ ] vendor 3 test file 相当の test_task_*.py が src/ut_tdd/tests/ に存在し、すべて PASS
- [ ] pytest 全件 PASS (W1 124 + W2 35 + W3a 追加分)
- [ ] §7.2 task classify JSON contract が fixture で網羅
- [ ] §7.2 task estimate PERT 式 (expected = (o+4m+p)/6) + buffered = expected * risk_factor が test で検証
- [ ] §7.2 size 判定 3 軸 max ルールが境界 test で検証
- [ ] vendor model 名 hard-code が capability class に rewrite 済
- [ ] effort-classify.md prompt template が UT-TDD capability class 準拠
- [ ] code-reviewer APPROVE
- [ ] frontmatter `kind == impl`、§0〜§5 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: PLAN-001-w1-plan-schema-lint-port (requires)、PLAN-002-w2-vmodel-trace-lint-port (requires)、PLAN-004-w3b-skill-subsystem-port (本 PLAN-003 後続、未起票)
- 関連 ADR: なし
- 参照 docs:
  - `docs/governance/ut-tdd-agent-harness-requirements_v1.1.md` §7.1 / §7.2
  - `docs/migration/helix-to-ut-tdd-cutover-strategy.md` Mode 1
  - `docs/migration/helix-porting-map.md` W3 行

## §6 carry note

(Sprint 進行中に追記)

### Sprint .1 解析所見 (2026-05-22)

詳細は [PLAN-003-sprint-1-analysis.md](PLAN-003-sprint-1-analysis.md)。

主要 drift (Sprint .1 で 10 件抽出、影響度大):
- **D1**: vendor effort_classifier の LLM 委譲 path は scope 外 → rule scoring (`score_task`/`map_to_effort`) のみ流用、LLM 委譲は W3b (PLAN-004 skill_recommender) で skill subsystem と統合
- **D4**: vendor task_type は 4 種日本語 (実装/レビュー/設計/調査) → UT-TDD VALID_KINDS 11 種への rewrite が必要 (regex pattern 拡張)
- **D5**: vendor `task_dispatcher.py` は実は **automation allowlist execution** (helix:command/shell:script/http:webhook) で §7.2 orchestration とは別物 → W3a port 対象外、`task/orchestration.py` を新規実装、vendor port 評価は PLAN-003-c carry
- **D7/D8/D9**: task estimate (PERT) + size 判定 3 軸 max + §7.2 JSON contract (kind/drive/size/complexity/recommended_gates/...) はすべて vendor に無く新規実装

scope 改訂: generates から `task/dispatcher.py` + test 削除、`task/orchestration.py` + test 追加

### Sprint .2-.6 実装結果 (2026-05-22 session 2)

| Sprint | 内容 | 結果 |
|---|---|---|
| .2 | `src/ut_tdd/task/` package + 3 module skeleton | `__init__.py` + `effort.py` + `classifier.py` + `orchestration.py` 作成、py_compile clean |
| .3 | §7.2 JSON contract + size 3 軸 max + PERT + capability class escalation | 実装 1 パスで完遂 (skeleton-then-rewrite 二段は単一エージェント運用で非効率と判断、Sprint .2/.3 統合) |
| .4 | test rewrite (§7.2 contract 全網羅) | test_task_effort.py 31 / test_task_classifier.py 56 / test_task_orchestration.py 42 = 129 件追加 |
| .5 | pytest 全回帰 | **288 PASS** (W1 124 + W2 35 + W3a 129)、所要 0.75s |
| .6 | prompt template port + dogfood | `docs/templates/prompts/effort-classify.md` 作成、PLAN-001/002/003 dogfood (下表) |

#### Sprint .5 修正 1 件 (in-place)

- XL escalation `_XL_PATTERNS` の `\b` 配置で「新規モジュール」が Japanese 単独 alt として未マッチ → `\b英単語\b | 日本語alt` 形式に分離。Python regex の `\b` は ASCII word-char 境界しか見ないため、Japanese 単独 keyword は `\b` 外へ。

#### Sprint .6 dogfood 結果 (PLAN-001/002/003 を classify + estimate + orchestration に投入)

| PLAN | kind | drive | size | complexity | confidence | risk_factor | buffered_hours | capability_class |
|---|---|---|---|---|---|---|---|---|
| PLAN-001 | impl | be | M | high | 1.00 | 1.2 (cross-platform) | 15.6 | worker |
| PLAN-002 | impl | be | M | medium | 1.00 | 1.0 | 6.5 | worker |
| PLAN-003 | impl | be | null (軸入力なし) | medium | 0.90 | 1.0 | 7.8 | worker |

PLAN-003 で size=null になるのは §7.2 想定外 path (3 軸 (files/lines/api+db) すべて入力なし)。CLI binding (W6) で `--files` / `--lines` / `--diff` から自動取得する設計とし、本 W3a ではエンジン側の null 扱いを許容 (carry note 明示)。

### Sprint .7 code-reviewer 所見

総合判定: **APPROVE_WITH_MINOR**。Critical 0 / Important 4 / Minor 4。

#### in-place fix 済 (Important 3 件 + Minor 1 件)

| ID | 内容 | 修正 |
|---|---|---|
| Important [1] | `_size_from_files` / `_size_from_lines` に XS 生成パスが無く §7.2 table の XS バケット (1 file / docs typo / small config) を engine が出力できない | `_size_from_files(1) → XS`、`_size_from_lines(<=20) → XS` 追加。api+db axis は `api or db` の時のみ寄与 (False+False で default S 加算しない) するよう厳密化、files=1 単独で XS を返す semantic を確保 |
| Important [3] | `score_task` の size hint が XL / XS 未対応で `score_task(size="XL")` が L と同点補正にしかならず XL が過小見積もりになる可能性 | `size == "XL" → max(total, 10)` / `"XS" → min(total, 3)` を追加 |
| Important [4] (誤検知) | reviewer は「`_BUG_FIX_RE` 等の Japanese alt が `\b` 内 (vendor 流) で残っている」と指摘したが、当該箇所は最初から `\b(ascii)\b | japanese` 形式で正しい。vendor 側のみ broken。設計意図を明示する comment を追加 |
| Minor [M1] | `orchestration.py:129` Rule 5 コメントの `research` 列挙が実装と不整合 (research は Rule 7 fast-checker) | コメントから `research` を除き Rule 7 routing を注記 |

#### test 追加 (5 件、Important [1][2][3] 確認)

- `test_size_files_only_XS` / `test_size_lines_only_XS` (Important [1] 確認)
- `test_xl_escalation_only_promotes_L` (XS/S 不昇格、Important [1] 派生)
- `test_classify_task_poc_with_scrum_drive_via_frontmatter` (Important [2] frontmatter で scrum drive 指定)
- `test_score_task_size_XL_lifts_floor_to_10` / `test_score_task_size_XS_caps_to_3` (Important [3] 確認)

pytest 全回帰: **293 PASS** (W1 124 + W2 35 + W3a 134、129+5)、所要 0.93s。

#### carry (PLAN-003 後段)

- **Minor [M2]**: `_recommended_gates` で使う `G3.8` の出典 (gate-policy.md §X 参照) を docstring 追記 → PLAN-003-e として carry (W6 ut-tdd doctor / gate 整理で gate-policy.md UT-TDD 化と合わせて反映)
- **Minor [M3]**: `__init__.py.__all__` から `score_task` / `map_to_complexity` の internal helper を外す → 利用実態を W3b 接続後に判断、本 W3a では public 維持
- **Minor [M4]**: `sys.path.insert` を conftest.py に集約 → W1/W2 と同方式で統一済、pyproject.toml に src layout 追加するタイミング (W6 doctor 整理時) で carry → PLAN-003-f

### W3a 範囲外 carry

- **PLAN-003-b**: `ut-tdd task classify --diff origin/main...HEAD` の git diff parse path (CLI binding 時に実装)
- **PLAN-003-c**: vendor `task_dispatcher.py` (automation allowlist execution = helix:command/shell:script/http:webhook 3 種を allowlist で実行する infra) の UT-TDD への port 評価。本 W3a の §7.2 orchestration 連携とは別物
- **PLAN-003-d**: size=null 出力時 (3 軸すべて軸入力なし) を CLI binding (W6) で `--files` / `--lines` / `--diff` から自動取得する設計に統合
- **PLAN-003-e**: `classifier._recommended_gates` の `G3.8` 出典 (gate-policy.md UT-TDD 化) を docstring に明示 (Sprint .7 Minor [M2])
- **PLAN-003-f**: `sys.path.insert` を conftest.py に集約 (Sprint .7 Minor [M4]、pyproject.toml src layout 追加時に W6 で統合)
- **PLAN-004 (W3b)**: skill_catalog + skill_classifier + skill_recommender port (~46 KB vendor、LLM 委譲経路を含む)
- **W6 連携**: `ut-tdd task classify` / `ut-tdd task estimate` CLI binding 統合 (W6 doctor / runtime detection)
- **PLAN-CODEX-FIX**: Codex Windows AppContainer sandbox 8009001d (W3a 進行中も Opus 直接実装 fallback、W3b で LLM 委譲を本格化する前に解消必要)

### Sprint .2-.8 引継ぎ完了 (2026-05-22 session 2)

Sprint .1 commit 後の session 2 (本 session) で Sprint .2 〜 Sprint .8 を完遂。
ステータス: `status: completed` 候補 (Sprint .8 commit 完了時点で `confirmed → completed` 遷移)。
