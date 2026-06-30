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

## Appendix A: L5 内部資産 D-API back-fill (PLAN-L5-06 / PLAN-L5-07)

### A.1 skill 操作

PLAN-L5-06 は、次の D-API contract を L5 internal-processing scope へ追加する。

| 操作 | 処理フロー | DbC 要約 |
|---|---|---|
| `skill catalog` | `docs/skills/**/*.md` を scan -> skill metadata を parse -> in-memory catalog を構築 -> sort 済み catalog entries を返す | pre: skills directory は readable または明示的に absent。post: persistent state は書かない。invariant: catalog loading は layer-1 skill source docs を rewrite しない |
| `skill recommend` | catalog を load -> task/layer/drive context を normalize -> candidates を score -> deterministic ranked list を返す | pre: catalog entries は parse 済み。post: 同一入力の ranking は deterministic。invariant: recommender は provider/runtime side effect を持たない |
| `skill inject` | recommendation set を consume -> layer-scoped injection list を作成 -> provider adapter intent へ hand off | pre: selected skills は existing docs に解決される。post: injection set は paths + reasons を含み、skill bodies は copy しない。invariant: ADR-004 layer-1/layer-2 boundary を維持する |

Function-level scoring、tie-break、injector schema は L6 carry とする。provider prompt materialization は L7 で扱う。

### A.2 asset-drift 操作

PLAN-L5-07 は、次の D-API contract を L5 internal-processing scope へ追加する。

| 操作 | 処理フロー | DbC 要約 |
|---|---|---|
| `asset drift check` | enrolled asset docs を load -> `asset-drift` rule predicates を run -> violations を aggregate -> doctor/gate result として surface | pre: rule registry は `asset-drift` を含む。post: unresolved drift は non-green validation result を生む。invariant: この rule は dependency-drift を置き換えない |
| `asset enroll` | `.claude/agents/*.md` と `docs/skills/**/*.md` を scan -> asset IDs を normalize -> rule execution 用 registry input を生成 | pre: scan roots は既知。post: optional root が absent の場合は evidence 付き empty set とし、silent success にしない。invariant: scanner は `loadX -> analyzeX` lint pattern に従う |
| `placeholder gap check` | placeholder dependency markers を read -> waiting layer と materialization state を compare -> unresolved gaps を report | pre: artifact metadata は readable。post: waiting layer 到達まで unresolved placeholder dependencies は visible。invariant: gap visibility は fail-close であり manual memory にしない |

Predicate signature と regex detail は L6 carry とする。rule-engine wiring は L7 で扱う。
## Appendix B: Harness DB feedback D-API 機能 (PLAN-L5-08)

| 操作 | 処理フロー | DbC 要約 |
|---|---|---|
| `recordProjectionEvent` | normalized PLAN/artifact/gate/hook/model/skill/finding event を receive -> IDs を validate -> projection row を upsert -> row reference を返す | pre: event は `plan_id` または `session_id` を持つ。post: row は ID で queryable。invariant: projection write は source docs を rewrite しない |
| `rebuildHarnessDb` | docs/state/log digests を scan -> projection tables を truncate -> normalized records を replay -> search index と quality signals を recompute | pre: repo root は既知で DB path は `.ut-tdd/` 配下。post: rebuild は deterministic。invariant: secret/raw transcript は copy しない |
| `computeSkillMetrics` | `skill_recommendations` + `skill_invocations` を read -> layer/drive/plan 別の firing rate と acceptance rate を compute | pre: recommendation rows が存在する、または denominator は明示的 zero。post: rates は `quality_signals` に保存される。invariant: missing logs は findings とし、success を fabricate しない |
| `findReference` | query を parse -> `search_index` + direct ID tables を search -> path、ID、reason、evidence 付き ranked references を返す | pre: DB が存在する、または rebuild が requested。post: result は source table と evidence path を含む。invariant: search は read-only |
| `emitFeedbackEvents` | open findings/quality signals を read -> pattern ごとに group -> feedback event と suggested next action を作成 | pre: findings は normalized。post: repeated gaps は feedback events として visible。invariant: automatic event creation は PLAN changes を auto-approve しない |
| `evaluateAutomationReadiness` | workflow/gate/doctor/CI projections を read -> 各 plan/workflow を ready、blocked、human-required に classify | pre: workflow と gate IDs は既知。post: readiness row は blocking evidence を参照する。invariant: missing evidence は ready を生成できない |
| `recordGuardrailDecision` | normalized guardrail decision を receive -> escalation/human boundary を verify -> decision と evidence path を store | pre: guardrail name と decision は既知。post: block/allow/human-required は queryable。invariant: human-required は DB projection で downgrade できない |
| `catalogAutomationAssets` | skill/roster/command docs を scan -> metadata を extract -> automation assets と drift status を record -> search index を update | pre: source path は approved docs/.claude roots 配下。post: catalog rows は path と asset_type を持つ。invariant: prompt bodies と secrets は copy しない |

Failure policy: corrupt DB、migration mismatch、projection orphan は doctor finding とする。validation 目的の command では unresolved projection errors は fail-close とし、passive logging hook では hook は fail-open だが可能な限り minimal failure event を記録する。
