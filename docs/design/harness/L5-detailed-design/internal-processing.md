---
layer: L5
sub_doc: internal-processing
status: draft
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
plan: docs/plans/PLAN-L5-03-internal-processing.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: 機能 = [function.md](../L4-basic-design/function.md) / module 公開 IF = [module-decomposition.md](./module-decomposition.md) / DbC = Meyer ([document-system-map](../../../governance/document-system-map.md) §3) / 物理 state = [physical-data.md](./physical-data.md)。本 doc は公開 IF に **処理ロジック + DbC (pre/post/invariant)** を付与する (D-API、IEEE 1016 §5)。
>
> **用語更新 (G.9) / 機能要求更新 (G.10) の所在**: per-工程 delta は生成元 [PLAN-L5-03](../../../plans/PLAN-L5-03-internal-processing.md) の §6/§7 に記録。
> **W-pair**: `pair_artifact = L8-integration-test-design.md` (L5↔L8 集合 pair)。
> **粒度境界 (IMP-018)**: 本 doc = 内部操作の how (DbC pre/post)。外部境界の契約は [if-detail.md](./if-detail.md) が担当。

# UT-TDD Agent Harness — L5 詳細設計: 内部処理 / D-API (Internal-Processing)

module-decomposition の公開 IF に処理ロジックと Design by Contract を付与する (PLAN-L5-03)。**G5 = DbC freeze 点** (document-system-map §3) の凍結対象を本 doc が確定する。

## §1 D-API 対象操作の棚卸し

| 操作 | module | 実現 FR | 実装状態 |
|---|---|---|---|
| `plan draft` | (plan/cli) | FR-01 | 未 |
| `plan lint` | plan | FR-04 | stub |
| `gate <G-ID>` | (doctor/cli) | FR-05 | 未 |
| `trace check` | vmodel | FR-03 | stub |
| `sprint check` | (workflow) | FR-02 | 未 |
| `doctor` | doctor | FR-18 | scaffold |
| `evaluateAgentGuard` | runtime | FR-09 | 実装済 |
| `detectMode` | runtime | FR-13 | 実装済 |

## §2 操作別 処理フロー

| 操作 | 処理ステップ |
|---|---|
| `plan draft` | 入力(title/kind/layer/drive) → frontmatter 構築 → zod validate (frontmatterSchema) → 重複 plan_id check → file 生成 + registry 登録 → exit 0 |
| `plan lint` | path 読込 → frontmatter parse → zod validate → 循環依存 check → §必須 check → `{ok,messages}` |
| `gate <G-ID>` | gate-checks.yaml ロード → 各 check 決定論実行 (AI 呼ばない) → pass/fail → phase.yaml + gate_runs 証跡 → exit 0/1 |
| `trace check` | PLAN generates 読込 → 4 artifact 存在確認 → 双方向 12 edge 照合 → report |
| `sprint check` | Red test 存在確認 → 本体実装 commit 順序確認 → TDD trace 記録 → pass/fail |
| `doctor` | 全 detector/lint 実行 (g3-trace/entity-coverage/fr-registry/doc-consistency/improvement-backlog + state 突合) → severity 別集約 → error 1件以上で exit 1 |
| `detectMode` | env/binary probe (claude/codex 検出) → mode 決定 (standalone/claude-only/codex-only/hybrid) → `RuntimeDetection` (副作用なし) |
| `evaluateAgentGuard` | input(subagent_type/model) → allowlist check → model 明示 check → family 一致 check → `GuardDecision` |

> 共通: 入力 → **zod validate** → state 読込 → 処理 → state 書込 → 出力/exit。副作用は cli/hook 端点に隔離 (module-decomposition §4)。

## §3 DbC precondition (事前条件 = 呼び出し側保証)

| 操作 | Precondition |
|---|---|
| `plan draft` | title 非空 / kind∈VALID_KINDS / layer∈VALID_LAYERS / (design+L1-L6 なら sub_doc 指定) |
| `gate <G-ID>` | G-ID∈G0.5-G14 / 前工程 gate passed (W-model 順序、FR-13) / gate-checks.yaml 存在 |
| `trace check` | 対象 PLAN が registry に存在 / generates 宣言あり |
| `sprint check` | L6 機能設計確定 / 対象 test ファイル path 解決可 |
| `doctor` | (前提なし、いつでも実行可) / detector/lint が読む doc/state が path 解決可 |
| `evaluateAgentGuard` | input に subagent_type 存在 / ctx に allowlist 提供 |

## §4 DbC postcondition (事後条件 = 操作保証)

| 操作 | Postcondition |
|---|---|
| `plan draft` | file 生成 ∧ registry 登録 ∧ frontmatter 全必須 field 充足 ∧ exit 0。失敗時は file 不変 (原子性) |
| `gate <G-ID>` | phase.yaml.gates[G-ID].status ∈ {passed,failed,bypassed} ∧ gate_runs 証跡生成 ∧ exit 0(pass)/1(fail) |
| `trace check` | report に 12/12 edge 結果 ∧ 孤児あれば fail-close ∧ exit 反映 |
| `doctor` | 全 detector 結果を severity 別集約 ∧ error 0 件で exit 0 / 1 件以上で exit 1 ∧ 実行記録 audit |
| `evaluateAgentGuard` | decision.block ∈ {true,false} ∧ block 時 exit 2 ∧ audit 記録 (bypass は warn+pass) |

## §5 DbC invariant (常に真、data.md §6 の操作レベル写像)

| invariant | 対応 data.md §6 | 操作横断保証 |
|---|---|---|
| state は zod 妥当な状態のみ永続化 | (物理 schema) | 全書込操作が validate 後に serialize |
| 逆ピラミッド禁止 | Artifact 不変条件 | gate/trace 操作が design+impl→test 必須を強制 |
| W-model 順序 (前工程未完で後着手不可) | Workflow | gate/plan draft が phase 順序 check (D-03=0) |
| agent model allowlist | Plan agent_slot | agent-guard が全 Agent 呼出で強制 |
| 集約間 ID 参照整合 | 集約間整合 | doctor が参照先存在を check |

## §6 fail-close エラーパターン (統一形式)

```
Error: <理由> (<FR-ID> / <根拠>)
next_action: <ユーザーが取るべき具体アクション>
exit code: 1 (検証 fail) / 2 (guard block, hook)
```

- function.md AC 異常系 (AC-FR-01-02 等) と 1:1 整合
- bypass (PO 専属 S-03): `UT_TDD_*_BYPASS=1` → warn + audit (PO ID + 理由必須) + exit 0
- 例: `Error: kind=charter は layer=L0 のみ (§1.3)` / `Error: G3 未通過、L4 着手不可 (W-model 順序遵守)`

## §7 edge case docstring (IMP-014、edge 5-8、G5 freeze 対象)

requirements §2.3 の ②実装↔④テスト 双方向 trace edge のうち **edge 5-8** = 関数 docstring に正常/異常/境界/エラーの 4 観点を記述する形式。**G5 = DbC freeze 点**で凍結。

```
/**
 * <関数の役割>
 * @precondition <呼び出し前提>           // DbC pre (§3)
 * @postcondition <保証する事後状態>      // DbC post (§4)
 * @invariant <処理中常に真>              // DbC invariant (§5)
 * @edge-normal <正常系の代表>            // edge 5 → AT-*-01
 * @edge-error <異常系 + fail-close>      // edge 6 → AT-*-02
 * @edge-boundary <境界系>                // edge 7 → AT-*-03
 * @throws <エラー型と exit code>         // edge 8
 */
```

> docstring の `@edge-*` は L12/L8 の AT-* と双方向 trace (孤児 0)。L7 実装時に関数 docstring へ転記し、`ut-tdd vmodel lint` が edge↔AT 照合 (carry)。

## §8 carry → L6 機能設計 / L7 実装

- 各操作の **アルゴリズム pseudocode** = L6 機能設計 (IEEE 1016 §5.7、IMP-019)
- DbC docstring (§7 形式) の **関数への転記** = L7 実装 (各 export 関数 + vitest describe-it = AT)
- **edge↔AT trace lint** (`vmodel lint` の edge 5-8 照合) = L7
- 外部操作 (adapter 経由) の DbC = if-detail (PLAN-L5-04、IMP-018 の how 側を本 doc と分担)
- **G5 freeze**: 本 doc の DbC (pre/post/invariant + edge docstring 形式) を G5 で凍結 (document-system-map §3)
