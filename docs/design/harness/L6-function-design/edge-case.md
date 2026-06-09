---
layer: L6
sub_doc: edge-case
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-02-edge-case.md
v2_import: docs/migration/v2-import-ledger.md
---

> **L6 contract marker**: `deriveEdgeCaseOracle(input: EdgeCaseInput) => EdgeCaseOracle` is the unit-test-granularity contract. DbC pre/post/invariant maps each function signature to edge coverage. L7 oracle family: U-EDGE-001..005.


> **SSoT 参照**: 関数 signature = [function-spec.md](./function-spec.md) §1/§2 / edge docstring 枠 = [internal-processing.md](../L5-detailed-design/internal-processing.md) §7 (G5 凍結) / fail-close 形式 = internal-processing §6。本 doc は各関数に `@edge-normal/error/boundary/throws` の 4 観点を per-function 確定する (L6、IMP-014)。
>
> **V-pair**: `pair_artifact = L7-unit-test-design.md` (L6↔L7)。各 edge → U-* test oracle (孤児 0)。
> **edge 5-8 形式** (internal-processing §7): `@edge-normal`→01 / `@edge-error`→02 / `@edge-boundary`→03 / `@throws`→exit code。**trace 先の系統分岐**: L7 単体テストは **U-***-NN (本 doc の右列)、L12 受入テストは **AT-***-NN (internal-processing §7 の AT-* は受入系)。L6↔L7 pair では U-* が正本 oracle。

# UT-TDD Agent Harness — L6 機能設計: エッジケース (Edge-Case)

function-spec §1/§2 の各関数に **正常/異常/境界/throws の 4 観点**を確定する (PLAN-L6-02)。internal-processing §7 で G5 凍結した docstring 枠を関数別に展開し、L7 単体テスト U-* の oracle とする。**G6 凍結対象**。

## §1 実装済関数の 4 観点 edge (function-spec §1)

### §1.1 `analyzeX` (5 lint 共通様式)
| 観点 | edge | → U-* |
|---|---|---|
| `@edge-normal` | docs 注入で全 totals > 0 / orphans == [] → ok=true | U-FUNC-01 |
| `@edge-error` | orphans 非空 → ok=false (fail-close、exit 1 経由) | U-EDGE-02 |
| `@edge-boundary` | 空 docs 注入 → totals == 0 を「非空虚」違反として検出 (虚 pass 防止) | U-EDGE-03 |
| `@throws` | 不正 source 形状 → throw (loadX 段で fs error) / exit 1 | U-CORE |

### §1.2 `evaluateAgentGuard`
| 観点 | edge | → U-* |
|---|---|---|
| `@edge-normal` | allowlist 内 + model 明示 + family 一致 → `code=0` | U-FUNC-02 |
| `@edge-error` | allowlist 外 / model 無指定 / family 不一致 → `code=2` (exit 2 は hook shim) | U-EDGE-02 |
| `@edge-boundary` | `allowRaw=true` (UT_TDD_ALLOW_RAW_AGENT=1) bypass → `bypassed=true` + message warn (理由記録) | U-EDGE-03 |
| `@throws` | stdin/JSON 解析失敗 → `code=2` (fail-close、安全性検証不能を pass させない。exit は shim) | code=2 |

### §1.3 `detectMode`
| 観点 | edge | → U-* |
|---|---|---|
| `@edge-normal` | claude+codex 検出 → hybrid / claude のみ → claude-only | U-FUNC-03 |
| `@edge-error` | (副作用なし純粋検出のため異常系は probe 失敗→standalone 縮退) | U-FUNC-03 |
| `@edge-boundary` | binary 不在 / env 未設定 → standalone | U-EDGE-03 |
| `@throws` | (throw しない設計 — 検出不能は standalone へ縮退) | — |

### §1.4 `lintPlan` / `lintVmodel` / `runDoctor`
| 観点 | edge | → U-* |
|---|---|---|
| `@edge-normal` | 妥当 frontmatter / 12 edge 孤児 0 / error 0 → ok=true exit 0 | U-FUNC-04 |
| `@edge-error` | 循環依存 / 孤児 / error≥1 → ok=false exit 1 | U-EDGE-02 |
| `@edge-boundary` | path 省略 (カレント) / 空 PLAN / state 不在 | U-EDGE-03 |
| `@throws` | path 不在 → Error + next_action (internal-processing §6) / exit 1 | exit 1 |

## §2 core 操作の異常/境界系 (function-spec §2、fail-close 形式)

> 形式 = internal-processing §6: `Error: <理由> (<FR-ID>) / next_action: <アクション> / exit 1`。

| 操作 | `@edge-error` (異常) | `@edge-boundary` (境界) | `@throws` |
|---|---|---|---|
| `plan draft` | plan_id 重複 → exit 1 / kind-layer 不整合 (例 charter≠L0) | sub_doc 必須層で未指定 | frontmatterSchema parse 失敗 → ZodError / exit 1 (原子性: file 不変) |
| `gate <G-ID>` | 前工程未通過 → exit 1 (V-model 順序) | G-ID 範囲外 / gate-checks.yaml 不在 | check.run() 例外 → fail-close |
| `trace check` | 孤児 edge ≥1 → exit 1 | generates 空宣言 | PLAN registry 不在 → Error / exit 1 |
| `sprint check` | Red commit が Green の後 → TDD 違反 exit 1 | test ファイル path 解決不能 | L6 未凍結で sprint check → pre 違反 |

> bypass (PO 専属 S-03): `UT_TDD_*_BYPASS=1` → warn + audit (PO ID + 理由必須) + exit 0 (internal-processing §6)。

## §3 IMP-033 rule engine の edge (function-spec §4)

| rule 型 | `@edge-error` | `@edge-boundary` |
|---|---|---|
| `pair-exists` | pair doc 不在 → violation | 新規 doc 追加直後 (auto-enroll 前) |
| `ref-resolves` | path 参照先不在 → violation | 相対 path / シンボリックリンク |
| `trace-bidir` | 片方向のみ (孤児) → violation | 自己参照 |
| `upstream-coverage` | 下流 ID が上流 ID に未接続 → violation | optional upstream が明示 defer |
| `count-matches` | 宣言 ≠ 実カウント (ドリフト) → violation | 件数 0 宣言 |
| `id-format` | PlanId / FR-ID / U-ID が正規式に不一致 → violation | legacy ID は明示 alias がある場合のみ許容 |
| `dup-id` | ID 重複 → violation | 大文字小文字差異 |
| `glossary-delta` | §6 用語更新が glossary/back-merge に未反映 → violation | 新規 term なしの明示 |
| `dependency-drift` | 実 import ≠ 期待マップ / 循環 → violation | fs 隔離端点 (依存方向対象外) |
| `backlog-format` | IMP-ID / status / 候補 enum が形式不一致 → violation | candidate から confirmed backlog への昇格前 |

> 全 rule = 純粋関数 (FR-05 決定論)。violation は fail-close (gate binding で G_N が exit 反映)。

## §4 trace 方針 (edge ↔ U-* / AT-*)

- 各 `@edge-normal/error/boundary` は L7 単体テスト U-* (§1 表の右列) と双方向 trace
- `@throws` は exit code 規約 (1=検証 fail / 2=guard block) と整合
- L7 実装時に各 export 関数の docstring へ `@edge-*` を転記し、`ut-tdd vmodel lint` が edge 5-8 ↔ U-*/AT-* を照合 (孤児 0、carry)

## §5 carry → L7 実装

- `@edge-*` docstring の実関数転記 = L7 (function-spec WBS の各 Sprint)
- edge → U-* テストコード変換 = L7 entry (TDD Red 先行)
- edge↔U-*/AT-* 照合 lint (`vmodel lint` edge 5-8) = L7 (rule engine `trace-bidir` の適用)
- **G6 freeze**: 本 doc の 4 観点 edge を function-spec と共に凍結 (L7 oracle 正本)
