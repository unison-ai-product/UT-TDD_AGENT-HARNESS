---
layer: L5
sub_doc: internal-processing
status: confirmed
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
> **V-pair**: `pair_artifact = L8-integration-test-design.md` (L5↔L8 集合 pair)。
> **粒度境界 (IMP-018)**: 本 doc = 内部操作の how (DbC pre/post)。外部境界の契約は [if-detail.md](./if-detail.md) が担当。

# UT-TDD Agent Harness — L5 詳細設計: 内部処理 / D-API (Internal-Processing)

module-decomposition の公開 IF に処理ロジックと Design by Contract を付与する (PLAN-L5-03)。**G5 = DbC freeze 点** (document-system-map §3) の凍結対象を本 doc が確定する。

## §1 D-API 対象操作の棚卸し

> **実装状態 列の正本注記 (2026-06-22 reconciliation)**: 本 §1 の「実装状態」列は L5 確定時点 (early) のスナップショットで、その後 L7 実装で landed した項目を反映せず stale 化していた (`doctor`=scaffold / `plan lint`=stub / `gate`=未 等の過小表記)。**現行の実装状態の正本は `src/cli.ts` + `src/doctor/` 実装と roadmap/program-coverage 機械状態**であり、本表は参照スナップショットとして実態に更新する。残る `未` は設計確定済・未材料化の carry (workflow-mode command / `plan draft` / 専用 `roster list/check` CLI = L7/Phase-B 材料化待ち)。

| 操作 | module | 実現 FR | 実装状態 |
|---|---|---|---|
| `plan draft` | (plan/cli) | FR-01 | 未 (carry: PLAN/registry 自動生成 command。現状は手動 author + `plan lint`) |
| `plan lint` | plan | FR-04 | 実装済 (`src/plan/lint.ts`、doctor plan-schedule/governance) |
| `gate <G-ID>` | (doctor/cli) | FR-05 | 実装済 (`cli.ts gate <id>` + `src/gate/`) |
| `trace check` | vmodel | FR-03 | 実装済 (doctor g1/g3-trace・impl-plan-trace・oracle-test-trace + vmodel lint 経由。専用 `trace check` command は carry) |
| `sprint check` | (workflow) | FR-02 | 未 (carry: TDD Red→Green enforcement command。現状は build/test skill + review-evidence 順序 gate で代替) |
| `doctor` | doctor | FR-18 | 実装済 (`src/doctor/` 60+ hard gate) |
| `evaluateAgentGuard` | runtime | FR-09 | 実装済 |
| `detectMode` | runtime | FR-13 | 実装済 |
| `roster list` | roster | FR-L1-46 | 一部 (capability resolver `resolveRosterCapability` + asset catalog scan 実装済。専用 `roster list` CLI は carry、PLAN-DISCOVERY-02 spike 実証) |
| `roster check` | roster | FR-L1-46/48 | 一部 (guard allowlist 整合は asset-drift gate で実装済。専用 `roster check` CLI は carry) |
| `ut-tdd asset` | roster | FR-L1-48 | 実装済 (`cli.ts asset catalog/builder`)。内部資産 inventory/管理拡張は carry |

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
| `roster list` | `.claude/agents/*.md` scan → registry (id=filename stem、name/model 抽出) → capability class + model family resolve → 一覧出力 (id 昇順、副作用なし read-only) |
| `roster check` | scan→registry → guard `SUBAGENT_ALLOWLIST` と突合 (allowlistedPresent / nonAllowlisted [Codex 委譲組] / missingFromRoster / nameMismatches) → **乖離 (missingFromRoster>0 ∨ nameMismatches>0) で fail-close** → report/exit |

> 共通: 入力 → **zod validate** → state 読込 → 処理 → state 書込 → 出力/exit。副作用は cli/hook 端点に隔離 (module-decomposition §4)。

## §3 DbC precondition (事前条件 = 呼び出し側保証)

| 操作 | Precondition |
|---|---|
| `plan draft` | title 非空 / kind∈VALID_KINDS / layer∈VALID_LAYERS / (design+L1-L6 なら sub_doc 指定) |
| `gate <G-ID>` | G-ID∈G0.5-G14 / 前工程 gate passed (V-model 順序、FR-13) / gate-checks.yaml 存在 |
| `trace check` | 対象 PLAN が registry に存在 / generates 宣言あり |
| `sprint check` | L6 機能設計確定 / 対象 test ファイル path 解決可 |
| `doctor` | (前提なし、いつでも実行可) / detector/lint が読む doc/state が path 解決可 |
| `evaluateAgentGuard` | input に subagent_type 存在 / ctx に allowlist 提供 |
| `roster list` / `roster check` | `.claude/agents/` が path 解決可 / `roster check` は guard `SUBAGENT_ALLOWLIST` が参照可 |

## §4 DbC postcondition (事後条件 = 操作保証)

| 操作 | Postcondition |
|---|---|
| `plan draft` | file 生成 ∧ registry 登録 ∧ frontmatter 全必須 field 充足 ∧ exit 0。失敗時は file 不変 (原子性) |
| `plan lint` | `{ok, messages[]}` を返す ∧ frontmatter 妥当 ∧ 循環依存なしで ok=true/exit 0、違反で ok=false/exit 1 ∧ state 不変 (read-only) |
| `gate <G-ID>` | phase.yaml.gates[G-ID].status ∈ {passed,failed,bypassed} ∧ gate_runs 証跡生成 ∧ exit 0(pass)/1(fail) |
| `trace check` | report に 12/12 edge 結果 ∧ 孤児あれば fail-close ∧ exit 反映 |
| `sprint check` | TDD trace 記録 (Red commit→Green commit) ∧ Red-first 順序確認 ∧ exit 0(pass)/1(TDD 違反) |
| `doctor` | 全 detector 結果を severity 別集約 ∧ error 0 件で exit 0 / 1 件以上で exit 1 ∧ 実行記録 audit ∧ state 不変 |
| `detectMode` | `RuntimeDetection` オブジェクト返却 ∧ mode ∈ {standalone,claude-only,codex-only,hybrid} ∧ 副作用なし (純粋検出) |
| `evaluateAgentGuard` | decision.block ∈ {true,false} ∧ block 時 exit 2 ∧ audit 記録 (bypass は warn+pass) |
| `roster list` | registry (id=filename stem + capability⊥model) を id 昇順で返す ∧ state 不変 (read-only scan) |
| `roster check` | allowlist 突合 report 生成 ∧ **missingFromRoster=0 ∧ nameMismatches=0 で ok/exit 0、乖離ありで fail-close/exit 1** ∧ state 不変。PLAN-DISCOVERY-02 で nonAllowlisted=4 (be-* / db-schema / devops-deploy = Codex 委譲組) は乖離でなく既知集合 |

## §5 DbC invariant (常に真、data.md §6 の操作レベル写像)

| invariant | 対応 data.md §6 | 操作横断保証 |
|---|---|---|
| state は zod 妥当な状態のみ永続化 | (物理 schema) | 全書込操作が validate 後に serialize |
| 逆ピラミッド禁止 | Artifact 不変条件 | gate/trace 操作が design+impl→test 必須を強制 |
| V-model 順序 (前工程未完で後着手不可) | Workflow | gate/plan draft が phase 順序 check (D-03=0) |
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
- 例: `Error: kind=charter は layer=L0 のみ (§1.3)` / `Error: G3 未通過、L4 着手不可 (V-model 順序遵守)`

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

## Appendix A: L5 internal asset D-API back-fill (PLAN-L5-06 / PLAN-L5-07)

### A.1 skill operations

PLAN-L5-06 adds the following D-API contracts to the L5 internal-processing scope:

| operation | processing flow | DbC summary |
|---|---|---|
| `skill catalog` | scan `docs/skills/**/*.md` -> parse skill metadata -> build in-memory catalog -> return sorted catalog entries | pre: skills directory is readable or explicitly absent; post: no persistent state is written; invariant: layer-1 skill source docs are never rewritten by catalog loading |
| `skill recommend` | load catalog -> normalize task/layer/drive context -> score candidates -> return deterministic ranked list | pre: catalog entries are parsed; post: ranking is deterministic for identical inputs; invariant: recommender has no provider/runtime side effect |
| `skill inject` | consume recommendation set -> build layer-scoped injection list -> hand off to provider adapter intent | pre: selected skills resolve to existing docs; post: injection set contains paths + reasons, not copied skill bodies; invariant: ADR-004 layer-1/layer-2 boundary remains intact |

Function-level scoring, tie-breaks, and injector schemas are L6 carry; provider prompt materialization is L7.

### A.2 asset-drift operations

PLAN-L5-07 adds the following D-API contracts to the L5 internal-processing scope:

| operation | processing flow | DbC summary |
|---|---|---|
| `asset drift check` | load enrolled asset docs -> run `asset-drift` rule predicates -> aggregate violations -> surface doctor/gate result | pre: rule registry contains `asset-drift`; post: unresolved drift produces non-green validation result; invariant: this rule does not replace dependency-drift |
| `asset enroll` | scan `.claude/agents/*.md` and `docs/skills/**/*.md` -> normalize asset IDs -> produce registry input for rule execution | pre: scan roots are known; post: absent optional roots become empty sets with evidence, not silent success; invariant: scanner follows the `loadX -> analyzeX` lint pattern |
| `placeholder gap check` | read placeholder dependency markers -> compare waiting layer and materialization state -> report unresolved gaps | pre: artifact metadata is readable; post: unresolved placeholder dependencies remain visible until the waiting layer is reached; invariant: gap visibility is fail-close, not manual memory |

Predicate signatures and regex details are L6 carry; rule-engine wiring is L7.
## Appendix B: Harness DB Feedback D-API (PLAN-L5-08)

| operation | processing flow | DbC summary |
|---|---|---|
| `recordProjectionEvent` | receive normalized PLAN/artifact/gate/hook/model/skill/finding event -> validate IDs -> upsert projection row -> return row reference | pre: event has `plan_id` or `session_id`; post: row is queryable by ID; invariant: projection write never rewrites source docs |
| `rebuildHarnessDb` | scan docs/state/log digests -> truncate projection tables -> replay normalized records -> recompute search index and quality signals | pre: repo root is known and DB path is under `.ut-tdd/`; post: rebuild is deterministic; invariant: no secret/raw transcript is copied |
| `computeSkillMetrics` | read `skill_recommendations` + `skill_invocations` -> compute firing and acceptance rates by layer/drive/plan | pre: recommendation rows exist or denominator is explicit zero; post: rates are stored as `quality_signals`; invariant: missing logs become findings, not fabricated success |
| `findReference` | parse query -> search `search_index` + direct ID tables -> return ranked references with path, ID, reason, evidence | pre: DB exists or rebuild is requested; post: result includes source table and evidence path; invariant: search is read-only |
| `emitFeedbackEvents` | read open findings/quality signals -> group by pattern -> create feedback event and suggested next action | pre: findings are normalized; post: repeated gaps are visible as feedback events; invariant: automatic event creation does not auto-approve PLAN changes |
| `evaluateAutomationReadiness` | read workflow/gate/doctor/CI projections -> classify each plan/workflow as ready, blocked, or human-required | pre: workflow and gate IDs are known; post: readiness row references blocking evidence; invariant: missing evidence cannot produce ready |
| `recordGuardrailDecision` | receive normalized guardrail decision -> verify escalation/human boundary -> store decision and evidence path | pre: guardrail name and decision are known; post: block/allow/human-required is queryable; invariant: human-required cannot be downgraded by DB projection |
| `catalogAutomationAssets` | scan skill/roster/command docs -> extract metadata -> record automation assets and drift status -> update search index | pre: source path is under approved docs/.claude roots; post: catalog rows have path and asset_type; invariant: prompt bodies and secrets are not copied |

Failure policy: corrupt DB, migration mismatch, or projection orphan is a doctor finding. For commands whose purpose is validation, unresolved projection errors are fail-close; for passive logging hooks, the hook is fail-open but records a minimal failure event when possible.
