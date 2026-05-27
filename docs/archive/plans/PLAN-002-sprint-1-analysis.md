# PLAN-002 Sprint .1 — vendor vmodel 解析

> 親 PLAN: [PLAN-002-w2-vmodel-trace-lint-port.md](PLAN-002-w2-vmodel-trace-lint-port.md)
> 日付: 2026-05-22
> 担当: PM (Opus) 直接解析 (Codex sandbox blocker のため)

## §1 解析対象

| vendor path | size | 役割 |
|---|---|---|
| `vendor/helix-source/cli/lib/vmodel_loader.py` | 17,723 B | `config/vmodel-semantics.yaml` schema validator (spine/drives/lifecycle) |
| `vendor/helix-source/cli/lib/vmodel_lint.py` | 9,890 B | PLAN markdown 内の 4 種 path pattern count ベース lint |
| `vendor/helix-source/cli/lib/tests/test_vmodel_lint.py` | 10,948 B | 12 test (LintResult / grandfather / draft skip / strict exit) |
| `vendor/helix-source/cli/lib/tests/test_vmodel_loader.py` | 2,028 B | (未読、Sprint .4 で確認) |
| `vendor/helix-source/cli/lib/tests/test_vmodel_loader_lifecycle.py` | 2,155 B | (未読、Sprint .4 で確認) |
| `vendor/helix-source/cli/lib/tests/test_vmodel_multi_drive.py` | 2,719 B | (未読、Sprint .4 で確認) |
| `vendor/helix-source/cli/templates/state/vmodel.json` | 未読 | (Sprint .6 で必要時 Read) |
| `vendor/helix-source/cli/templates/state/deliverables.json` | 未読 | (Sprint .6 で必要時 Read) |

## §2 vendor vs UT-TDD 仕様 drift

### Drift table (重要度順)

| # | 項目 | vendor 実装 | UT-TDD 仕様 (§2 / §7.3) | 影響度 | 対応 |
|---|---|---|---|---|---|
| **D1** | 検証 algorithm | 4 種 path pattern を count、count>0 で complete (`_count_refs`) | 必須 8 directed edge を個別検証、path 正規化 + 参照先存在 + 相互一致 (§2.4) | **大** | **rewrite** (count → edge graph 検証) |
| **D2** | exit code | 2 段階 (0 / 1) | **3 段階** (0 / 2 / 1)、P1 only → exit 2 | 中 | constants 追加 (`EXIT_P1_ONLY = 2`) |
| **D3** | grandfather 機構 | `deferred-findings.yaml` から `DF-PLAN-NNN-AUDIT-001 + status:open` を抽出 + `VMODEL_ENFORCEMENT_DATE = 2026-05-18` 前の created date を legacy 扱い | UT-TDD は carry rule (P0/P1/P2/P3) で吸収。HELIX 固有の enforcement date hardcode は廃止 | 中 | **削除**、UT-TDD carry rule (将来 PLAN で実装) で再吸収 |
| **D4** | semantic config | `cli/config/vmodel-semantics.yaml` schema validator (vmodel_loader.py) | UT-TDD には対応 config 不在。§2 spec は markdown 仕様で直接 lint 可能 | **大** | **vmodel_loader port を削除**、scope から除外 |
| **D5** | kind 別経路分岐 | なし (全 PLAN 一律 4 ref count) | design/add-design/research → 段階 A only、impl/add-impl → A+B、poc/reverse → workflow_phase 別、recovery/troubleshoot → §5.1 header、refactor/retrofit → 不変性 (§7.3) | 大 | 新規実装 (kind dispatcher) |
| **D6** | L6 QA 分離 | なし | L3/L3.5 設計内に L6 QA 記述で P1 warning、L6 追加 test code が L6 QA design への trace 欠落で P0 fail-close (§2.5) | 中 | 新規実装 |
| **D7** | 逆ピラミッド検出 | なし | ①② 存在 + ③④ 無 → P0、①② + ③ あり ④ 無 → P1 (§2.6) | 中 | 新規実装 |
| **D8** | Pair freeze 検証 (G1-G3) | なし | G1: L1 要件 ⇔ L1 受入テスト設計、G2: L2 CONCEPT/ADR ⇔ 総合テスト設計、G3: L3 D-API/D-DB ⇔ 結合テスト設計 + L3.5 機能設計 ⇔ 単体テスト設計 (§2.2 段階 A) | 大 | 新規実装 (layer dispatcher) |
| **D9** | G3.8 TDD Red freeze | なし | L3.5 ③ 単体テスト設計 ⇔ L3.8 ④ 先行単体テストコード、失敗理由分類 (§2.2 段階 A2) | 大 | scope 外 carry (PLAN-002-c、pytest collection plugin が必要) |
| **D10** | G4 coverage ≥80% | なし | §2.7 で coverage tool 統合必須 | 中 | scope 外 carry (PLAN-002-b、coverage tool integration) |
| **D11** | path constant | `HELIX_ROOT` / `PLANS_DIR` / `DEFERRED_FINDINGS` (HELIX absolute) | `UT_TDD_PROJECT_ROOT` env / `.ut-tdd/` state | 小 | constant rename + env var 化 (W1 と同パターン) |
| **D12** | yaml parser | `import yaml` (PyYAML) + `yaml is None` fallback | PyYAML>=6.0 (W1 で固定済) | 小 | fallback path 削除 |
| **D13** | DESIGN_PATTERN | `D-API\|D-DB\|D-CONCEPT\|D-FUNC\|docs/v2/L3-detailed-design/` | UT-TDD §2.1: `docs/design/<feature>/<name>.md` | 中 | pattern rewrite |
| **D14** | TEST_DESIGN_PATTERN | `L4-test-design\|PLAN-\d+(?:[A-Z])?-(?:unit\|integration\|system\|acceptance)-test-design\.md\|D-TEST-DESIGN` | UT-TDD §2.1: `docs/test-design/<feature>/<name>-test-design.md` | 中 | pattern rewrite |
| **D15** | TEST_CODE_PATTERN | `cli/lib/tests/test_[a-zA-Z0-9_]+\.py` | UT-TDD §2.1: `tests/...` | 小 | pattern rewrite |
| **D16** | IMPL_PATTERN | `cli/lib/[a-zA-Z0-9_/]+\.py` | UT-TDD §2.1: `src/...` | 小 | pattern rewrite |

## §3 W2 scope 再評価

### 当初 PLAN-002 §3 (起票時) vs Sprint .1 後改訂

**当初**:
- vmodel_loader.py port (17 KB)
- vmodel_lint.py port (10 KB、adapt)
- 4 test file port

**Sprint .1 後の改訂提案**:
- ~~vmodel_loader.py port~~ → **削除** (D4: semantic config 不在、§2 直接 lint で十分)
- vmodel_lint.py → **rewrite** (D1: count → edge graph)
- ~~test_vmodel_loader*.py 3 file port~~ → **削除** (D4 連動)
- test_vmodel_lint.py の structure 流用、内容 rewrite
- 新規追加: 必須 8 edge 個別検証 fixture (D1)、kind dispatcher fixture (D5)、L6 QA / 逆ピラミッド fixture (D6/D7)、Pair freeze fixture (D8)
- scope 外 carry: G3.8 TDD Red (PLAN-002-c)、coverage ≥80% (PLAN-002-b)、vmodel_loader (PLAN-002-d、semantic config が必要になったら)

### 改訂版 W2 成果物

| artifact | 内容 |
|---|---|
| `src/ut_tdd/vmodel_lint.py` | 必須 8 edge graph 検証 + kind dispatcher + L6 QA 分離 + 逆ピラミッド + exit 0/2/1 |
| `src/ut_tdd/tests/test_vmodel_lint.py` | 上記 5 要素の test fixture、UT-TDD §2.7 受入条件網羅 |
| `docs/templates/state/vmodel.json` | (Sprint .6 で vendor template と §2 を対照後判断、L3.8 + L6 QA 追加) |
| `docs/templates/state/deliverables.json` | (Sprint .6 で同上) |

## §4 上位 5 落とし穴 (Sprint .3 実装注意)

1. **edge graph 表現**: 必須 8 edge を `EDGE_ID = (artifact_from, artifact_to, direction, description)` の構造化 enum で持つ。grep ベースに retrofit しない
2. **path 正規化の罠**: 設計 doc 内 `実装ファイル: <path>` の `<path>` を resolve するとき、相対 path / repo root 相対 / Windows 区切り混在を吸収。`pathlib.Path` + `Path.resolve()` で統一
3. **kind dispatcher の fail-close**: kind が VALID_KINDS に無い場合、§7.3 では「将来 PLAN で詰める」とあるが、UT-TDD 仕様としては fail-close (exit 1) が安全。default reject
4. **L6 QA 検出の正規表現**: L3/L3.5 設計内に「QA-XXX-NNN」「L6-qa-additional」の文字列があれば P1。誤検出回避のため code block 内は除外
5. **逆ピラミッド検出順序**: ①② 存在判定 → ③④ 存在判定 → ③④ 両方無 → P0 / ③ あり ④ 無 → P1。③ 無 ④ あり (テストコードだけある) は別扱い (warn 推奨、§2.6 表に無いが追加 carry 候補)

## §5 次 Sprint プラン

- Sprint .2 (skeleton): `src/ut_tdd/vmodel_lint.py` の dataclass + EDGE_ID enum + EXIT 定数 + 関数 stub 作成
- Sprint .3 (実装): 8 edge 個別検証 + kind dispatcher + L6 QA / 逆ピラミッド + exit code 0/2/1
- Sprint .4 (test): vendor test pattern (12 test) を流用しつつ rewrite、UT-TDD §2.7 受入条件網羅
- Sprint .5 (sweep): pytest + py_compile
- Sprint .6 (template): vendor vmodel.json / deliverables.json を読んで §2 と対照、L3.8 + L6 QA 追加
- Sprint .7 (review): code-reviewer subagent
- Sprint .8 (commit): 1 PLAN = 1 commit

## §6 PLAN-002 §3/§6 改訂への反映

本 Sprint .1 解析を受けて PLAN-002 §3 / §6 を以下に改訂する:

- §3 `generates` から `vmodel_loader.py` + 3 test file を削除
- §3 Step 3 に「count → edge graph rewrite」を明示
- §6 W2 範囲外 carry に `PLAN-002-d: vmodel_loader.py + vmodel-semantics.yaml port` を追加
