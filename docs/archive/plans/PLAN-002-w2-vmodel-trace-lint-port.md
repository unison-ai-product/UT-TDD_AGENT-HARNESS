---
plan_id: PLAN-002-w2-vmodel-trace-lint-port
title: "PLAN-002: W2 V-model trace lint port (vmodel_loader / vmodel_lint / templates/state)"
kind: impl
layer: L4
drive: be
status: archived
created: 2026-05-22
confirmed_at: 2026-05-22
owner: PM (Opus)
agent_slots:
  - role: po
    slot_label: "PO — スコープ判断・受入承認"
  - role: tl
    slot_label: "TL — 設計レビュー・契約凍結"
  - role: se
    slot_label: "SE — 機能実装 (Codex blocker 中は Opus 直接実装 fallback)"
  - role: qa
    slot_label: "QA — テスト戦略・品質判定"
  - role: docs
    slot_label: "Docs — template / cutover doc 更新"
generates:
  - artifact_path: src/ut_tdd/vmodel_lint.py
    artifact_type: python_module
  - artifact_path: src/ut_tdd/tests/test_vmodel_lint.py
    artifact_type: test_code
  - artifact_path: docs/templates/state/vmodel.json
    artifact_type: template
dependencies:
  parent: null
  requires:
    - PLAN-001-w1-plan-schema-lint-port
  blocks: []
related_adr: []
related_docs:
  - docs/governance/ut-tdd-agent-harness-requirements_v1.1.md
  - docs/migration/helix-to-ut-tdd-cutover-strategy.md
  - docs/migration/helix-porting-map.md
---

## §0 PLAN

W2 第2波。HELIX vendor (`vendor/helix-source/cli/lib/vmodel_*.py`) から V-model trace lint engine を `src/ut_tdd/` へ adapt port する。UT-TDD requirements_v1.1 §2.1-2.7 (4 artifact + 必須 8 directed edge + G3.8 + L6 QA 分離) と §7.3 (exit code 0/2/1) に整合させ、`ut-tdd vmodel lint` の核心となる検証 engine を確立する。

## §1 目的

W1 で凍結した plan_schema / plan_lint engine を踏み台に、V-model 4 artifact (① 設計 / ② 実装 / ③ テスト設計 / ④ テストコード) の双方向 trace 検証 engine を載せる。**Sprint .1 解析の結果、当初想定の vmodel_loader port は不要 (UT-TDD §2 に対応する semantic config が無く、§2 markdown 仕様で直接 lint 可能) と判明したため、scope を vmodel_lint.py 1 module に絞り rewrite する**。

- vendor `vmodel_lint.py` (9,890 B) を **count ベース → §2.4 必須 8 directed edge 個別検証へ rewrite**。`src/ut_tdd/vmodel_lint.py` に置く
- vendor `test_vmodel_lint.py` の構造を流用しつつ、UT-TDD §2.7 受入条件 (Pair freeze / 8 edge / kind dispatcher / L6 QA / 逆ピラミッド) を網羅する fixture へ rewrite
- vendor `cli/templates/state/vmodel.json` / `deliverables.json` を `docs/templates/state/` に port、L3.8 と L6 QA doc-first trace を追加

W2 範囲外として明示 carry:
- `ut-tdd vmodel lint` CLI binding は W6 (`ut-tdd doctor` / runtime detection) で総合実装
- coverage ≥80% 検証 (§2.7) は coverage tool 統合が前提のため W2 範囲外。`PLAN-002-b` として carry
- G3.8 TDD Red freeze の pytest collection 検証 (§2.2 段階 A2) は pytest plugin integration が必要なため `PLAN-002-c` として carry
- vmodel_loader.py + `cli/config/vmodel-semantics.yaml` port は UT-TDD で対応 config が必要になった時点で `PLAN-002-d` として再評価 (現時点では §2 markdown 仕様で十分)
- vendor `deliverables.json` (HELIX V2 の 30 D-* deliverable × feature 単位 state) は UT-TDD では PLAN frontmatter `generates` が deliverable trace を担うため不要。`PLAN-002-e` として「HELIX V2 D-* 30 種を UT-TDD で正本化するか」の判断のみ carry

## §2 背景

- W1 で plan_lint / plan_validator が UT-TDD §1 仕様準拠で完成。次の必須 lint である vmodel_lint を載せないと G3 / G3.8 / G4 が機械検証できない
- HELIX vendor は 8 directed edge を 12 directed edge として実装しており、UT-TDD §2.4 の R-I5 fix (必須 8 + warn 4 の分離) に合わせて再実装が必要
- UT-TDD §7.3 R-I7 fix で exit code 3 段階 (0 / 2 / 1) が定義された。vendor は 2 段階 (0 / 1) なので exit code logic を rewrite
- UT-TDD §2.5 で L6 QA 追加テストが正本化された。vendor は QA 追加テスト分離概念を持たないため新規実装
- cutover-strategy Mode 1 で plan-lint hook は部分 cutover 済。vmodel-lint も同様に W6 で hook 統合する

## §3 実装計画 (Sprint 標準 8 ステップ)

### Step 1: Sprint .1 Entry / vendor 解析

- `vendor/helix-source/cli/lib/vmodel_loader.py` (17,723 B) と `vmodel_lint.py` (9,890 B) を Read
- vendor 4 test file (`test_vmodel_loader.py`, `test_vmodel_lint.py`, `test_vmodel_loader_lifecycle.py`, `test_vmodel_multi_drive.py`) の test pattern と fixture 構造を確認
- `vmodel.json` / `deliverables.json` template の現状フォーマット確認
- UT-TDD §2 / §7.3 との **drift table** 作成 (HELIX 12 edge → UT-TDD 8+4、HELIX 2-state exit → UT-TDD 3-state exit、HELIX QA 分離なし → UT-TDD §2.5 追加)
- 成果物: `docs/plans/PLAN-002-sprint-1-analysis.md`

### Step 2: Sprint .2 着手前調査 / skeleton

- W1 と同様、`src/ut_tdd/__init__.py` への新 module 追加方針確認
- `helix code find vmodel` 相当の流用候補確認 (W1 で port 済の `plan_validator.py` の exit code pattern を流用)
- skeleton 作成: `src/ut_tdd/vmodel_loader.py` (空 dataclass + load 関数 stub) + `src/ut_tdd/vmodel_lint.py` (exit code 関数 + check 関数 stub)

### Step 3: Sprint .3 機能設計 + テスト設計 pair freeze + rewrite

- vendor の **count ベース lint を捨て、§2.4 必須 8 directed edge graph 検証へ rewrite**:
  - 各 edge を `EDGE_ID = (artifact_from, artifact_to, direction, description)` として enum 化
  - `verify_edge_N(plan, repo_root) -> EdgeResult` の 1 関数 / edge mapping (8 関数)
  - path 正規化 (`pathlib.Path.resolve()`) + 参照先存在 + 相互一致を確認
- §7.3 exit code 0/2/1 を `EXIT_OK = 0` / `EXIT_P1_WARNING_ONLY = 2` / `EXIT_P0_FAIL = 1` として constants 定義
- §7.3 kind 別経路分岐: `design / add-design / research` → 段階 A、`impl / add-impl` → A+B、`poc / reverse` → workflow_phase 別 (scope 外 TODO)、`recovery / troubleshoot` → §5.1 header 検証、`refactor / retrofit` → 不変性のみ。kind 不明は fail-close
- §2.2 段階 A Pair freeze: G1 L1 要件 ⇔ L1 受入テスト設計、G2 L2 CONCEPT/ADR ⇔ 総合テスト設計、G3 L3 D-API/D-DB ⇔ 結合テスト設計 + L3.5 機能設計 ⇔ 単体テスト設計
- §2.5 L6 QA 追加テスト分離: L3/L3.5 設計 doc 内に L6 QA テスト記述があれば P1 warning、L6 追加テストコードが L6 QA 設計 doc trace を欠けば P0 fail-close
- §2.6 逆ピラミッド検出: ①② 存在 + ③④ 無し → P0、①② 存在 + ③ あり ④ 無し → P1
- vendor の grandfather 機構 (`deferred-findings.yaml` + `VMODEL_ENFORCEMENT_DATE = 2026-05-18` legacy) は **削除**、UT-TDD carry rule (P0/P1/P2/P3) で別途吸収
- vendor の path constant (`HELIX_ROOT` / `PLANS_DIR`) を `UT_TDD_PROJECT_ROOT` env / `.ut-tdd/plans/` へ rewrite
- DESIGN/IMPL/TEST_DESIGN/TEST_CODE pattern を vendor `cli/lib/*` → UT-TDD `src/...` / `tests/...` / `docs/design/<feature>/` / `docs/test-design/<feature>/` に rewrite

### Step 4: Sprint .4 テスト rewrite

- vendor `test_vmodel_lint.py` の構造 (tmp_path fixture / `_write_plan` helper / monkeypatch pattern) を流用しつつ、count ベース fixture を edge 個別検証 fixture に rewrite
- UT-TDD §2.7 受入条件を網羅する fixture:
  - 必須 8 edge の各 fail case (E1〜E8 個別)
  - exit code 0/2/1 の境界 case (clean / P1 only / P0 あり)
  - kind 別経路の正常 / 異常 case (design / impl / refactor / recovery / unknown)
  - 逆ピラミッド検出 P0 case
  - L6 QA 追加テスト分離 P0/P1 case
  - Pair freeze 不在の G1-G3 fail case

### Step 5: Sprint .5 機械チェック sweep

- `python3 -m py_compile` で全 module syntax 確認
- `pytest src/ut_tdd/tests/` で W1 124 PASS + W2 追加分の全 PASS 確認
- `pytest -m windows_only` / `-m posix_only` marker 動作確認

### Step 6: Sprint .6 template port + dogfood

- `vendor/helix-source/cli/templates/state/vmodel.json` を `docs/templates/state/vmodel.json` に port
  - L3.8 (TDD Red freeze 対象 artifact) 追加
  - L6 QA additional test design path 追加
- `vendor/helix-source/cli/templates/state/deliverables.json` を `docs/templates/state/deliverables.json` に port
- PLAN-001.md / PLAN-002.md を vmodel_lint で dogfood (現時点では trace 不在になる carry を WARN として許容)

### Step 7: Sprint .7 code-reviewer subagent レビュー

- code-reviewer subagent で W2 実装を 5 軸 (機能性 / 安全性 / 保守性 / テスト / V-model) でレビュー
- P0 → in-place fix、P1 → carry note、P3 → carry PLAN

### Step 8: Sprint .8 commit + carry note

- 1 PLAN = 1 commit (`feat(W2): port HELIX vmodel trace lint to UT-TDD src/ut_tdd`)
- §6 carry note に Sprint .1 drift、Sprint .7 review 結果、PLAN-002-b/c carry を記録

## §4 受入条件 / DoD

- [ ] Step 1〜8 のすべてが該当 section に存在
- [ ] `generates` の 4 artifact (vmodel_lint.py + test + vmodel.json + deliverables.json) がすべて作成済
- [ ] `src/ut_tdd/vmodel_lint.py` が py_compile clean
- [ ] `src/ut_tdd/tests/test_vmodel_lint.py` が pytest PASS
- [ ] pytest 全件 PASS (W1 124 + W2 追加分)
- [ ] §2.4 必須 8 directed edge が個別 check 関数として実装され、path 正規化 + 参照先存在 + 相互一致まで検証
- [ ] §7.3 exit code 0/2/1 の境界 test 通過
- [ ] §2.2 段階 A Pair freeze (G1-G3) fixture 通過
- [ ] §2.5 L6 QA 分離 + §2.6 逆ピラミッド検出が test fixture で網羅
- [ ] kind dispatcher が 11 kind すべてで正常分岐 (poc/reverse は workflow_phase TODO で skip)
- [ ] vmodel.json / deliverables.json template が L3.8 + L6 QA を含む
- [ ] code-reviewer APPROVE
- [ ] frontmatter `kind == impl`、§0〜§5 完備

## §5 関連 PLAN / ADR / docs

- 関連 PLAN: PLAN-001-w1-plan-schema-lint-port (W1, requires)、PLAN-002-b (coverage ≥80% 検証、carry)、PLAN-002-c (G3.8 pytest collection 検証、carry)、PLAN-002-d (vmodel_loader + vmodel-semantics.yaml port、Sprint .1 解析で削減、必要になったら carry)
- 関連 ADR: なし
- 参照 docs:
  - `docs/governance/ut-tdd-agent-harness-requirements_v1.1.md` §2.1-2.7 / §7.3
  - `docs/migration/helix-to-ut-tdd-cutover-strategy.md` Mode 1
  - `docs/migration/helix-porting-map.md` W2 行 (35行目)

## §6 carry note

(Sprint 進行中に追記)

### Sprint .1 解析所見 (2026-05-22)

詳細は [PLAN-002-sprint-1-analysis.md](PLAN-002-sprint-1-analysis.md)。

主要 drift (Sprint .1 で 16 件抽出、影響度大):
- **D1**: vendor の count ベース lint → §2.4 必須 8 directed edge graph 検証へ rewrite
- **D4**: vmodel_loader.py + vmodel-semantics.yaml は UT-TDD §2 直接 lint で十分 → W2 scope から除外、PLAN-002-d carry
- **D5/D8**: kind 別経路分岐 + G1-G3 Pair freeze は vendor に無く UT-TDD で新規実装
- **D6/D7**: L6 QA 分離 + 逆ピラミッド検出は vendor に無く UT-TDD §2.5/§2.6 で新規実装
- **D3**: vendor grandfather + VMODEL_ENFORCEMENT_DATE は UT-TDD carry rule (P0/P1/P2/P3) で吸収、削除

scope 縮小: generates 8 artifact → 4 artifact (vmodel_loader 系 4 削除)

### Sprint .7 code-reviewer 所見 (2026-05-22)

**Verdict**: APPROVE_WITH_MINOR

Important (4 件、in-place fix 適用済):
- **I1**: E1-E6 regex code block false positive → `_strip_code_blocks` helper 追加、markdown のみ code fence + HTML コメント除去
- **I2**: `_layer_of_artifact` heuristic false positive → startswith prefix 一致を優先、ADR snapshot は §2.2 G2 ルールで L2 に明示マップ
- **I3**: L6 QA P0 判定の path 部分文字列依存 (`"qa" in path`) → `tests/L6/` 配下 OR `test_qa_` prefix の厳格パターンに置換
- **I4**: test_vmodel_lint.py 自身の test_design artifact 化が省略 → **time-box**: W3 (PLAN-003) entry までに `docs/test-design/W2-vmodel-lint-unit-test-design.md` を起票し、test_vmodel_lint.py docstring に DoD 検証 trace を追加

Minor (3 件):
- **M1**: PATH_PATTERNS top-level compile → 許容範囲、将来 `@functools.cache` 候補としてコメント残す (本 W2 では実施せず)
- **M2**: format_text marker dict に P2 不在 → `[DEBT]` を追加で fix
- **M3**: `re.escape(module)` で空 module 名の防衛 → 早期 skip ガード既存、コメント追加なし

仕様準拠 fix (review 質問由来):
- **S1**: ARTIFACT_TYPE_TO_KIND の `hook` → IMPL を削除 (§1.7 で hook は V-model `—` 扱い)。schema_migration / cli_extension / script は ② のまま維持

reviewer 評価された good practices:
- `_edge_skip_when_missing` の共通 helper 化で 8 edge skip logic 一貫性
- `highest_severity` の P0 early return で aggregate 短絡評価
- 全 result dataclass `frozen=True` で不変性保証

### W2 範囲外 carry

- **PLAN-002-b**: §2.7 coverage ≥80% 検証。coverage tool (coverage.py / pytest-cov) 統合 + threshold 設定 + CI 連携が必要
- **PLAN-002-c**: §2.2 段階 A2 G3.8 TDD Red freeze 検証。pytest collection mode + 失敗理由分類 (未実装 vs 構文エラー) の plugin integration
- **W6 連携**: `ut-tdd vmodel lint` CLI binding は W6 で実装 (`ut-tdd doctor` と統合)
- **W7 連携**: pre-push hook に vmodel_lint 統合 (W7 hook cutover)
