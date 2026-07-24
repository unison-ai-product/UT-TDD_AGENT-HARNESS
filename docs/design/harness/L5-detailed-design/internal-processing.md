---
layer: L5
sub_doc: internal-processing
status: confirmed
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
plan: docs/plans/PLAN-L5-26-node-generation-activation.md
replacement_issue: 152
predecessor_plan: docs/plans/PLAN-L5-03-internal-processing.md
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

## Appendix C: 駆動モデルルーター内部処理 (PLAN-L5-10)

> **SSoT**: 外部設計 (signal → mode / mode↔kind 非1:1 / 失敗 routing 全順序) = [function.md](../L4-basic-design/function.md) §3.1/§3.2。本 Appendix はその契約を機械的に守らせる **L5 内部処理 (モジュール/処理フロー粒度)** を確定する。関数 signature / pre-post 契約の粒度は L6 function-spec (PLAN-L6-38) へ descent し、本 doc では書かない。実装実体は `src/schema/route-map.ts` (signal 決定表) + `src/plan/lint-policy.ts` / `src/plan/lint.ts` (kind/layer 制約) + doctor check 群 (後続 add-impl)。
>
> **最上位原則 (PO 2026-07-07 確定): Forward 正規**。ルーティングの既定は Forward (V-model spine を設計先行で降りる正道)。非 Forward 駆動モデルは「Forward では解決できない」入口条件 (L4 §3.1 固有 signal) が立つときに限り選択され、トリガ条件を `forward_insufficient_reason` として機械記録する。本原則は [add-feature.md](../../../process/modes/add-feature.md) §1.1「経路 B = 最頻・default」の**既定の向きのみ**を supersede する (経路 B は「要件後追いで足りる」条件が立つときの条件付き経路として存続。経路 B でも add-design→add-impl の親子連鎖は従来どおり必須)。
>
> **原理 (両肺の役割と検証可能性設計、PO 2026-07-07)**: V-model の左肺 (≤L7) は「どういうシステムを
> 作るか」の設計、右肺 (L8 以降) は「どうシステムを評価・検証するか」である。従って **①設計は右肺の
> 検証本質から逆規定される**: 各左腕層の①は、対の右腕層が評価を成立させるための**ログ・計測・評価点の
> 設計 (observability-by-design) を同梱する義務**を負い、③テスト設計はその計測点を oracle として使う。
> 観測点が設計・実装に無ければ右肺は測れない — 検証可能性は後付けできない (FR-L1-20 観測・計測層は
> この原理の機構面であり、「検証戦略は設計時に組む」という運用規律の設計面の根拠でもある)。
>
> **原理 (完備性 invariant、PO 2026-07-07)**: Forward が正規である理由は、**Forward が最終的にシステム全体を表す「設計資産 (①③) × システム実態 (②) × テスト実態 (④)」の完備集合として収束しなければならない**からである。非 Forward 駆動モデルは一時的な迂回であり、出口で必ず Forward へ合流して (concept §2.5) この完備集合へ寄与しない限り完了と認めない。ルーターがこの invariant に仕える: (i) 迂回の入口を条件ゲートで絞り (本 Appendix)、(ii) 迂回の出口合流を既存機械 gate — `forward-convergence` (未集約 landed impl 0) / pair-freeze (①⇔③ 孤児 0) / G7 4-artifact trace / `scrum-reverse` / R4 forward_routing — で強制し、(iii) cold L7 禁止 (C.3) で「設計資産に対応物を持たない実態」の発生自体を塞ぐ。設計資産・実態・テストのいずれかが欠けたままの状態は、経路を問わず終着状態ではない。

### C.1 default-Forward 評価フロー

routing 評価は次の 3 段で行い、fall-through の終着は常に Forward とする (mode 決定不能 = Forward、fail-open な mode 濫用を構造的に排除):

| step | 処理 | 判定 |
|---|---|---|
| (i) 失敗系 signal 評価 | 入力 signal を L4 §3.2 失敗 routing **全順序 (Incident > Recovery > Reverse > Refactor)** で評価。複数競合時は上位を採る。token 一致は最長一致 (`regression_prod` を汎用 `regression` に吸わせない) | 一致 → 当該 mode + `forward_insufficient_reason` = 一致 signal/条件 |
| (ii) 能動 mode 固有 signal 評価 | Retrofit / Add-feature / Scrum / Research / Discovery **+ 拡張 3 mode (design-bottomup / version-up / verify、C.2 暫定 band)** の固有 signal (L4 §3.1 入口 signal 列 + `ROUTE_SIGNAL_MAP` の拡張 token) を評価 | 一致 → 当該 mode + `forward_insufficient_reason` = 一致 signal/条件 (拡張 3 mode の signal が fall-through で Forward に落ちることはない) |
| (iii) fall-through | (i)(ii) いずれも不一致 (未知 token 含む) | **Forward** を返す。未知 token は warn 記録 |

- **非 Forward 決定の invariant**: `forward_insufficient_reason` (トリガ signal + 「Forward では解決できない」条件) 無しに非 Forward の filing target を生成しない。
- **audit 記録**: 非 Forward 決定は `.ut-tdd/audit/route-approval.jsonl` と同型の append-only 記録 (`.ut-tdd/audit/` 配下) に `{signal, mode, forward_insufficient_reason, decided_at}` を残す。escalation 境界 signal は従来どおり mode 非依存で `requires_human_approval=true` に昇格 (L4 §3.2、変更なし)。

### C.2 routeFiling 決定表 (L4 §3.1 表 = single source)

`route eval` は mode 止まりを廃止し、**filing target** `{ mode, allowed_kinds, layer_band, sub_doc_hint, pairing_obligation, forward_insufficient_reason?, origin?, requires_human_approval }` の完全形を emit する (origin = 非 Forward、特に reverse の出所参照。requires_human_approval = escalation 境界昇格の結果。invariant が参照する値はすべてこの型形状に含まれ、契約・実装・テストが同一 object を見る)。決定表は L4 §3.1 表 + §3.2 の mode↔kind 非1:1 注記から機械化する (設計判断(b): kind→layer 制約を add-feature 1 mode から**全 mode へ横展開**し、`allowed_kinds` 未定義 mode = kind 無制約の穴を塞ぐ):

| mode (駆動モデル) | allowed_kinds (許可 kind) | layer_band (許可 layer 帯) | sub_doc_hint (sub_doc 指示) | pairing_obligation (ペア義務) |
|---|---|---|---|---|
| **forward** (既定) | design / impl | design→L1-L6 / impl→L7 (設計祖先必須、C.3) | layer 別 sub_doc (schema VALID_SUB_DOCS) | 通常 V-pair (pair-freeze) |
| **discovery** | poc | cross | — (workflow_phase S0-S4) | confirmed poc は Reverse 昇華必須 (doctor `scrum-reverse`) |
| **scrum** | poc | cross | — (workflow_phase S0-S4) | S4 受入 + Reverse fullback 完了まで exit 不可 (L8-L14 直接合流禁止) |
| **reverse** | reverse | cross | — (workflow_phase R0-R4) | R4 `forward_routing` (L1/L3/L4/L5/gap-only) + 再入先 pair-freeze gate |
| **recovery** | recovery | cross | — (phase なし) | 再発防止 doc + tl/po 人間サインオフ |
| **incident** | troubleshoot + recovery | troubleshoot→L7 / recovery→cross | — | recovery PLAN の `requires` に troubleshoot PLAN 宣言 + 恒久策 Reverse 経由昇華 |
| **refactor** | refactor | L7 | — | 振る舞い不変 (regression fence + linked test_id、G7 edge 維持) |
| **retrofit** | retrofit | L7 | — | L8 回帰 + preflight (upgrade)。アーキ/DB 変更時は L4/L5 追補を連鎖 |
| **add-feature** | add-design / add-impl | add-design→L3-L6 / add-impl→L7 | add-design→着地 layer の design sub_doc (最頻 L6 function-spec) | add-impl は対の Reverse (fullback, forward_routing=L3) pairing 必須 (KIND_BACKFILL)。`kind=impl` 単独は禁止 |
| **research** | research | L1-L4 | — | ADR 記録 + Forward 接続先 (L1 or L4) 明記 |
| **design-bottomup** | add-design / add-impl | add-design→L2-L6 (screen 系 sub_doc) / add-impl→L7 | L2 screen 系 sub_doc | add-feature と同型 (Reverse back-fill) |
| **version-up** | add-design | L3-L6 | — | 後送要件の deferral 台帳記録 (着手時に add-feature 決定表へ合流) |
| **verify** | verify | L8-L14 | — | 検証 evidence + defect_routing。失敗・品質所見は Forward / Reverse / Refactor / Recovery へ routing |

- `design-bottomup` / `version-up` / `verify` は route-map 実装 (`ROUTE_SIGNAL_MAP`) 由来の拡張 mode。L4 §3.1 表への外部設計 back-fill は L4 add-design carry とし、本表では各 mode の暫定 band で fail-close する (kind 無制約に戻さない)。**本表の「single source = L4 §3.1」の正本性はこの L4 back-fill 完了で完成する** — それまで拡張 3 mode の band は暫定であり、L4 との一致検証 (U-ROUTE-R1) の照合対象は L4 §3.1 掲載 mode に限る (L5 が外部設計正本を先行拡張したままにしない = altitude/SSoT 規律)。
- **spine 閉域後の intake 制約 (PO 2026-07-07)**: `forward` 行の plain `design` / `impl` 起票は **Forward spine の初回降下 (未閉領域) にのみ存在し得た経路**である。本 harness は既に L14 到達・`forward-convergence` 稼働済みであり、**現段階で plain `kind=impl` の L7 新規起票はそもそも成立しない (常に fail-close)**。新規の実装作業は必ず駆動モデル経由 — **add-feature (add-design→add-impl + Reverse pairing) / incident (troubleshoot) / refactor / retrofit** — で入り、出口の Forward 合流義務を負う。plain design/impl による spine 再開を許すと Forward が永遠に閉じない (完備性 invariant の帰結: 閉じた完備集合への変更は、合流義務を持つ駆動モデル経由でのみ入る)。
- **PLAN plane の区別**: PLAN の layer は「その層の成果物をどう作るか」の作業計画 plane であり、設計内容そのものの plane とは別 — L7 PLAN は実装の手順計画なので設計の成立が前提 (C.3)、L6 PLAN は L6 設計書の作成計画である。既存の plain `kind=impl` PLAN 群 (route-mode-kind debt 台帳) は現段階ではカテゴリ不成立であり、着手時の add-impl + Reverse pairing への昇格 (C.4) が唯一の正規化経路。

### C.2b stage-aware intake (Forward 進行段階が起票可能集合を決める、PO 2026-07-07)

routing は signal だけでなく **Forward spine の進行段階** を入力に取り、段階ごとに起票可能な filing を
限定する (進行段階の機械 source = roadmap rollup / forward-convergence / plan_registry):

| spine 進行段階 | 起票可能な filing | 説明 |
|---|---|---|
| L1-L7 初回降下中 (未閉領域) | 当該未閉層の plain `design`/`impl` + 駆動モデル | spine 本体を降りる正道。**Forward は両肺の設計 doc を書く工程である**: 左肺① (どういうシステムを作るか + 計測・評価点) と右肺③+検証戦略 (どう評価・検証し、いつ L8+ 検証 PLAN を発火するか) を対で書き、pair-freeze (G1-G6) で対凍結する。右肺 doc は右腕層の資産だが、その執筆・凍結は Forward 降下の一部 |
| **L8-L14 上昇中〜到達後 (現況)** | **検証サイクル (機械発火) + 駆動モデル**: 右腕の検証実行は verification roadmap の機械発火 (V-model layer group の Forward freeze 完了時) で駆動し、変更系は reverse / add-feature (add-design→add-impl) / refactor / retrofit / recovery / incident / discovery / research / scrum / design-bottomup / version-up (拡張 2 mode は C.2 暫定 band) のみ | plain design/impl は成立しない。**Reverse が本体設計修正の主経路になり、右腕上昇以降は Reverse 起票が構造的に増える** (設計と実態の乖離は Reverse でしか正されないため)。右腕層 (L8-L14) は④実行の場であり設計 doc を持たない — その③テスト設計は左腕ペア層の `docs/test-design/harness/*` (L1↔L14 運用 / L3↔L12 受入 / L4↔L9 総合 / L5↔L8 結合 / L6↔L7 単体) が正本。③の欠落・修正も Reverse (fullback) で左腕ペアとして back-fill する。**③を直すタイミングは常に「①を直す同一 PLAN・同一 freeze」であり、③単独の後回しスケジュールは存在しない** (Reverse は R2 ③逆復元→R4 ③状態確定が exit 条件 / add-design は pair_artifact 同時追補 / ④実行で③の誤り発覚時は defect routing でその場修正 or Reverse) |

- **両肺設計の義務 (PO 2026-07-07)**: 設計は両肺に必要である。左肺 doc = どういうシステムを作るか
  (計測・評価点の同梱義務は上記原理)。**右肺 doc = ③テスト設計 + 検証戦略 + 検証設計** の 3 点 —
  ③ = 何を確かめるか (テストケース/oracle)、検証戦略 = いつ・何を・どの基準で L8 以降の検証 PLAN
  として起票するか、**検証設計 = その検証を成立させる方法の設計** (検証環境・データ実在性・計測方法・
  評価基準・実行手順 — concept §2.3「検証本質 = その設計が効いているかを、対応する環境・データ実在性で
  検証する」の設計面)。**右肺 3 点の記述粒度は左肺ペア層の設計粒度に一致させる** (設計粒度=テスト設計
  粒度の原則を検証戦略・検証設計へ拡張: L8 結合 = L5 のモジュール間契約粒度 / L9 総合 = L4 の方式粒度 /
  L10 UX = L2 の画面粒度 / L12 受入 = L3 の FR/AC 粒度 / L14 運用 = L1 の業務要求粒度。左肺より粗い
  検証設計は評価不能、細かすぎる検証設計は保守不能な過剰指定として design gate で弾く)。
- **BDD の組み込み (PO 2026-07-07)**: 右肺 3 点は **振る舞い駆動 (BDD)** で書く。
  (1) **記述形式 = Given/When/Then シナリオ**: ③テストケースと検証設計の実行手順は GWT の振る舞い
  仕様として書く (既存 IT-* 表の Given/When/Then 列はこの標準の実例。integration-gwt lint が機械検査)。
  (2) **ユビキタス言語**: シナリオの語彙は L0 glossary・左肺設計と共有し、独自語を作らない
  (glossary/terminology 整合は既存 lint が担保)。振る舞いの主語は実装内部でなくシステムの振る舞い
  (ユーザー/運用者/連携システムから観測可能な挙動) とする。
  (3) **executable specification / living documentation**: 受入粒度 (L12↔L3) では FR/AC を BDD
  シナリオとして書き、④で実行可能な仕様 = 生きた文書とする。シナリオが実行されない・実装と乖離した
  状態は right-arm の drift として検出対象 (DDD/TDD 規律 = ddd-tdd-rules gate と対を成す BDD 面)。

### C.2c 縛りルールの外部化 (project 単位 bind、PO 2026-07-07)

本 Appendix の縛りルール群は harness 実装へのハードコードでなく、**project-local policy として外部化**し、
Pack consumer が **project 単位で bind** できる形にする (route-map override / approval-policy.yaml の
既存パターンを踏襲):

| 外部化対象 | policy 表現 | 既定 |
|---|---|---|
| routeFiling 決定表 (C.2: mode × allowed_kinds × layer_band × pairing) | `.ut-tdd/config/` 配下の宣言 config (zod validate、fail-close) | Pack 同梱の既定表 (L4 §3.1 由来) |
| ①⇔③ 対応表 (どの層の設計がどのテスト設計と対か) | 同上 (pair map) | V-model 正規式 (L1↔L14 / L3↔L12 / L4↔L9 / L5↔L8 / L6↔L7 / L2↔L10) |
| 右肺 3 点セット要件 + 粒度マーカー | 同上 (必須節・マーカー語彙) | 本 Appendix C.2b の標準 |
| stage-aware intake (spine 段階 × 起票可能集合) | 同上 | C.2b の 2 段階表 |
| escape governance (promote_by / justification) | 台帳 audit doc + config | C.4 |

- **強化のみ許容 (weaken 禁止)**: project 側の bind は既定の追加・厳格化のみ可能とし、既定ルールの
  緩和・削除は shrinkage guard と同型の fail-close で弾く (proposal-document-coverage の
  llm-shrinkage-ignored パターンを踏襲)。
- **未作成は永続エラー (PO 2026-07-07)**: bind された policy は project の「作るべき成果物の宣言」で
  あり、宣言された成果物 (両肺 doc / 3 点セット / ペア) が存在しない限り doctor は **「作ってない」
  エラーを出し続ける** (一度きりの warn や時間経過での消音はしない — absence-blindness の根治)。
  黙らせる方法は 2 つだけ: **作る**、または**理由付きの明示 opt-out 宣言** (project 非該当の宣言。
  無言の欠落と区別され、opt-out 一覧は doctor 出力に常時表示されて不可視化しない)。
- config 読込は既存規約に従う: zod validate / 不正・legacy 依存混入は exit 1 / `.ut-tdd/` 境界内。
- 実装 carry (C.6): 決定表・pair map・粒度マーカーの config loader + 既定 config の Pack 同梱 +
  doctor が「project bind が既定より弱くないこと」を検査する。検証戦略が右肺 doc に無ければ L8 以降の
  PLAN は起票されず、**L8+ PLAN が存在しない = 本当に検証したかが機械的に不明** (L7 の tests が保証
  するのは関数・機能の正常動作 = 単体のみ。システム評価 — 結合・総合・UX・受入・運用 — の実行証跡は
  L8+ PLAN でしか担保されない)。
- **機械的欠陥 (carry → 後続 add-impl)**: 現行 schema は L8-L14 layer を取れる kind を持たない
  (`ALLOWED_LAYER_BY_KIND`: design→L1-L6 / impl 系→L7 / research→L1-L4 / 横断→cross)。つまり検証
  実行 PLAN は**構造的に起票不能**であり、これが「L8 以降に PLAN が無い」の根本原因。検証 PLAN の
  kind/layer envelope (右肺 doc の検証戦略から機械発火し、L8-L14 layer を正規に取れる kind) の新設を
  C.6 carry に含める。検証実行の証跡は gate_runs 永続化 (PLAN-L7-363 系) と対で閉じる。

- **コード修正 → Reverse 義務**: L8 以降でコード (②実態) に触れる変更は、どの駆動モデルで入った
  場合でも、**最終的に Reverse で本体設計 (L1-L6 の L設計資産) を修正して閉じる**。本体外の設計
  (追補・周辺 doc) は他駆動モデルで起票してよいが、L設計への影響があれば最終的に L設計を直す義務は
  免除されない。
- **branch/main 原理**: 駆動モデル = **設計を汚さないために切る branch**、Forward spine = **main**。
  branch を切ったら main へ戻す (merge) のが完了条件であり、戻さない branch は完了と認めない —
  これが「出口は必ず Forward 合流」(concept §2.5) と完備性 invariant の操作的意味である。
- **Reverse の出所必須 invariant (PO 2026-07-07)**: Reverse は cold start しない。Reverse 起票は必ず
  機械記録された出所 (provenance) を持つ — Discovery 終点 / Scrum increment 完了 / drift-check 検出 /
  add-feature 経路 B の back-fill 義務 / Recovery exit の上位整合 / L8 以降のコード修正義務 — の
  いずれかから到達する。**出所なき standalone Reverse が正当なのは「既に動いているプロジェクトへの
  harness 途中導入」(既存未文書化資産の onboarding) ただ一つ**であり、routeFiling は reverse の
  filing target に出所参照 (origin signal / origin PLAN) を必須で含め、出所なしは途中導入 signal の
  場合のみ許容する (それ以外は fail-close)。
- **処理フロー**: signal → C.1 評価 → mode 確定 → 本決定表 lookup → filing target 構築 → (非 Forward なら) `forward_insufficient_reason` 付与 + audit 記録 → emit。intake 時 (PLAN write / `route eval`) に同じ決定表で `route_mode` × `kind` × `layer` を検証し、逸脱をその場で surface する (post-hoc doctor 依存の縮小)。

### C.3 layer 強制 + L7 cold intake 禁止の処理フロー

| check | 処理 | fail-close 条件 |
|---|---|---|
| `route_mode_kind_layer` | PLAN frontmatter の `(route_mode, kind, layer)` を C.2 決定表と照合。`ROUTE_MODE_ALLOWED_KINDS` を全 mode へ拡張し、さらに kind ごとの layer band を検証 (schema `ALLOWED_LAYER_BY_KIND` の kind→layer envelope に mode 文脈を重ねる) | kind ∉ allowed_kinds、または layer ∉ layer_band → `route_mode_kind_layer_mismatch` |
| `l7-cold-intake` (doctor) | `layer=L7` の impl 系 PLAN (`impl` / `add-impl`) について `dependencies.parent` 連鎖を registry 上で遡上し、**設計層 PLAN (L4/L5/L6 の `design`/`add-design`) への到達**を判定する。連鎖は parent → parent … の推移閉包 (循環は plan lint の循環依存 check で既に排除)。legacy landed / draft-debt 台帳 (C.4) 登載分は例外評価 | 設計祖先ゼロの cold L7 起票 → `l7_cold_intake` violation |

- 現行 schema は add-\* のみ parent 必須で plain `kind=impl` は parent 不要という穴があり、これが「いきなり L7」を許してきた。本 check はその穴を塞ぐ: **設計先行 (design-first)、または add-impl + Reverse back-fill のいずれか**を構造的に強制し、feature signal に対する `kind=impl` 単独 (設計層 skip) を禁止する。
- bottom-up の順序自由 (要件 L1/L3 の後追い back-fill、add-feature.md 経路 B) は変えない。禁止するのは「設計層 PLAN が親子連鎖のどこにも産出されない」経路のみ。

### C.4 免除台帳の統治 (escape governance、draft-debt allowlist)

`ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS` (lint-policy.ts) の免除を無期限 escape にしない governance 処理:

| 処理 | 内容 | fail-close |
|---|---|---|
| `promote_by` 期限 | 台帳 (正本: `docs/governance/route-mode-kind-debt-audit-2026-07-02.md` 系 audit doc) の各 entry に `promote_by` (add-impl + Reverse pairing への昇格期限) を必須付与 | 期限超過かつ未昇格 → doctor fail-close (draft のままでも通さない) |
| 新規追加 gate | allowlist へ新規 plan_id を追加する変更は、台帳 audit doc への `justification` (なぜ正規形で組めないか + promote_by) 追記が同一変更内に必須 | justification 無き新規 `kind=impl` + `route_mode=add-feature` 追加 → fail-close |
| 昇格検証 | status が draft 以外へ遷移する時点で add-impl + Reverse pairing への昇格を検証 (既存 lint 挙動を維持) | 未昇格の着手 → fail-close (既存) |

### C.5 add-impl two-phase intake (デッドロック解消)

escape の根本原因 = draft `add-impl` の `requires_not_ready` × `KIND_BACKFILL[add-impl]=required` デッドロックを、**two-phase intake** で解く:

| phase | 処理 | ready 要求 |
|---|---|---|
| **intake (draft)** | add-impl PLAN と対の Reverse PLAN を**同時 draft 起票可能**とする。add-impl 側の Reverse 参照は required だが、参照先 Reverse が `draft` でも intake を許容する (Reverse 側は `dependencies.parent` に add-impl PLAN を指定して pairing 成立、add-feature.md 準拠) | 参照の存在のみ (status 不問) |
| **confirm (昇格)** | いずれかの PLAN が `confirmed` へ昇格する時点で、**双方の pairing が ready** (相互参照が解決済 + Reverse 側の forward_routing 宣言済) であることを要求する | 双方 ready でなければ昇格 fail-close |

- これにより bottom-up 経路が `kind=impl` (back-fill 免除) へ逃げず `kind=add-impl` で正規に組める。invariant: intake 緩和は draft 間のみ — confirmed 以降の状態空間は従来の READY_DEPENDENCY_STATUSES 規律と同一で、緩和が完了系 gate へ漏れない。**実装 carry (C.6)**: 現行 `READY_DEPENDENCY_STATUSES` は `confirmed/completed` のみで draft 参照は `requires_not_ready` になるため、lint に **add-impl↔Reverse pairing 限定の draft 例外**を明示追加する (汎用の draft 許容にはしない)。

### C.6 carry → L6 / L7

- `routeFiling` / `routeModeKindLayer` / `assertL7HasDesignAncestor` / `FilingTarget` の **関数 signature + pre/post/invariant + エッジケース** = L6 function-spec 追補 (PLAN-L6-38)。
- route-map / lint-policy / lint / doctor (`l7-cold-intake`) の**実装** = 後続 add-impl (L7)。
- `design-bottomup` / `version-up` の L4 §3.1 外部設計 back-fill = L4 add-design carry。
- 結合テスト設計ペア = L8-integration-test-design (pair_artifact、PLAN-L5-10 Step 4)。

### C.7 変動点外部化設計 (externalization by design、C.2c の一般化、PO 2026-07-07)

> **適用範囲**: C.2c は本 router Appendix の縛りルールを外部化する具体適用。C.7 はそれを**全設計 doc の
> 変動点へ一般化した左肺設計義務**であり、router 固有でない (観測性設計 = FR-L1-20 と同格に、設計時に
> 「何が変わりうるか + どう外部化するか」を書く)。配置は左肺義務 locus (両肺原理 §C 冒頭 / C.2c) に
> 合わせるが、将来 design-methodology 専用 doc を新設する場合は C.7 を移送する (forward note)。

**原理**: 変動点 (variation point / hotspot) = 変更・追加が頻出する箇所。これを設計時に外部化
(config / registry / policy) し、**外部化設計を当該設計 doc に内包**する。ハードコード → 後日 retrofit
(self-pair = RECOVERY-09/REVERSE-12 の 3 commit / version-up band = PLAN-L4-17) という高コスト失敗
モードの発生源を潰す。既に本標準を満たす例 = route-map override / harness-db table registry / C.2c。
**射程の精度 (over-claim 防止)**: 本 lint が潰すのは**宣言された変動点**の発生源のみ。「変動点だと誰も気づかず宣言しなかった」(under-declaration = self-pair / version-up の実際の原因) は宣言駆動 lint では検出できないため、**下記判定基準による分類チェックを L1-L6 設計 gate の TL レビュー必須項目**とする (cross-review が under-declaration の最終防衛線)。

**変動点の判定基準 (過大外部化 = speculative generality / YAGNI の防止)**: 以下のいずれかに該当する
箇所**のみ**を変動点として宣言する。該当しない箇所 (真に固定・単一実装・普遍不変条件) は**外部化しない**
— 変動しないものの外部化は純損失 (間接化・config-drift 検出面の増大)。

| 変動点類型 | 例 | 外部化機構 |
|---|---|---|
| (a) project/consumer ごとに異なる | 縛りルール・承認ポリシー・閾値 | policy config (`.ut-tdd/config/`) |
| (b) 種類が増える集合 | mode / kind / gate / rule / view / adapter / DB table | registry (単一正本 append) |
| (c) 差し替え可能な実装 | renderer / diagram adapter / provider | adapter interface + profile |
| (d) 閾値・語彙・対応表 | 対応表 (①⇔③ pair map) / signal 語彙 / 粒度マーカー | data-driven config |

(a) と (d) の軸違い: (a) は **project 間で値が変わる** 軸、(d) は **同一 project 内で複数入力に対応する表** の軸 (両者は直交し、両方該当もあり得る)。

**外部化設計の内容 (設計 doc に内包する変動点表)**: 各変動点に {① 何が変わるか / ② 外部化機構
(config schema・registry・policy hook) / ③ 固定される契約・不変条件 (変わらない核) / ④ config 不在時の
fail-close 既定} を宣言する。④は「config/registry が不在、**または registry 内に参照キーが無い (未知 mode/kind 等)** 場合は Pack 同梱の既定へ fail-close (安全側)」を既定とする。**未知キーの fail-open (制約なしとして通す) を禁止**する — これは version-up 穴 (`if (!allowedKinds) return []` = キー欠落時に無制約 [] を返した) の直接教訓であり、registry 型 (類型 b) の外部化設計は未知キー fail-close を必須要件とする。

**理由付き opt-out**: 変動しないと判断した箇所は「非該当」を**理由付きで明示**する (無言の非外部化と
区別。opt-out 一覧は doctor 出力に常時表示して不可視化しない)。opt-out 理由は自由記述でなく **4 類型
(a)-(d) のいずれにも該当しない根拠**を述べる (判定基準への反証。形骸理由 = hollow rationalization の
禁止、PLAN claim discipline と同精度)。理由不十分 (実質空 / 4 類型への言及なし) または TL 承認 record
無しは無効 = fail。C.2c opt-out 規約を厳格化した形。

**機械強制 (設計時 lint 契約、fail-close)**: 宣言された変動点に外部化設計 (config schema か registry
参照) が無ければ doctor は**永続エラー**を出し続ける (C.2c「未作成は永続エラー」と同型、一度きり warn
や時間経過での消音はしない = absence-blindness 根治)。黙らせる方法は 2 つだけ: **外部化を作る**、
または**理由付き opt-out 宣言**。lint の**実装は後続 add-impl (L7) の scope** (C.6 carry)。本標準は
C.7 の設計 + lint 契約まで。

**carry (C.6 追加)**: 変動点宣言マーカー parser / 外部化存在検査の**関数 signature + pre/post/invariant
は L6 function-spec 追補 (C.6 と同型)**、実装は後続 add-impl (L7)。外部化の存在判定は種別を問わず
**「zod schema か registry ファイルへの相対パス参照が設計 doc 本文にあるか」の単一機械判定に統一**する
(adapter/config/registry の grey zone を作らない)。他 layer 設計 author への周知 = coding-rules.md へ
C.7 相互参照を追加 (Important-3 対応)。結合テスト設計 = L8 (宣言×外部化なし→fail / opt-out→pass /
config・registry 不在→既定 fail-close / 未知キー→fail-close)。

## Node build generation内部処理（Issue #152 D0-N）

1. Node build generation receiptの`subject_revision`は当該sliceのcandidate HEADへ固定する。review済みtoolchain provenanceはNode公式distribution archive SHA-256（OS/arch別）、同梱npm `11.6.2`のCLI relative path・expected SHA-256、`packageManager`/`engines`/lockfile identityを結ぶ。実Node/npm executableを絶対pathで解決し、version文字列だけでなくexpected digest/provenanceへ照合する。
2. `npm ci`のlock graph、external runtime dependency closure、builder/source graphをcanonical digest化する。同じversionを自己申告する別npm CLIへの差替えもdigest不一致として拒否する。
3. private temporary generationへcompiled ESMとreceiptを生成し、全digest・path containment・symlink境界を再検証する。
4. generation内fileをflushし、POSIXでは可能な場合parent directoryも同期した後、immutable generation名へrenameする。activation markerはtemporary write→file sync→close後、存在しない一意final名へ同一filesystem renameする。Windows Node-onlyではprocess-crash atomicityを保証するが、power-loss後の最新marker persistenceを保証済みと主張しない。
5. writerはexact path `dist/node-publish.lock/`をNode標準のatomic `mkdir`だけで取得する。`open("wx")`、別path、OS helper等の代替backendは禁止する。取得後にvalidated markerのmax sequenceを読み、`N+1`を割り当ててpublishし、最後に自分が正常完了した同一process内だけでleaseをreleaseする。同時writerはretryせずfail-closeする。
6. lock directory内の`owner.json`は診断情報であり、欠落・破損してもlockを保持する。crash残留lockは永久fail-closeで、F0bにrecovery/steal/clear APIを作らず、手動削除もしない。marker rename後にcrashした場合もreaderはcomplete markerを利用できるがpublisher livenessは停止する。後続recovery PLANまでpublishを再開しない。
7. readerはtemp、parse不能、digest不一致、generation未完成markerを無視し、検証可能complete markerが1件以上なら最大sequenceを返す。0件ならfail-closeする。power loss後に旧markerが必ず残るとは主張しない。

envの`npm_config_user_agent`は証拠に使用せず、実npm executable/version/digestを測定する。receipt欠落、
cross-revision replay、dependency/path/symlink drift、unknown field、partial generationはprocess生成前に
fail-closeする。失敗時のBun/bunx/tsx/TS直実行/shell fallbackは存在しない。

`GenerationPublisher`はtemp generation、exact publish lock、activation markerだけを所有する。F0bではautomatic GCとgeneration削除APIを禁止し、全immutable generationを保持する。reader leaseと安全なreclamationを設計する後続PLANまでGCをdeferし、cleanupはtempと正常完了した同一processが保有するlockに限定する。

F0b rollbackは同一`subject_revision`の検証済み旧generationを指す、より大きいsequenceのmarker appendだけを許す。cross-revision rollbackはunsupportedでfail-closeする。通常のcross-revision復帰はgit revertで新revisionを作りF0a/F0bを再実行する。Resource Kernelまたは別PLANが設計されるまでtarget revision変更APIを持たない。

### Node slice admission状態機械

#### 共通`GitObjectId`

全receipt graphのrevision/HEAD fieldは
`GitObjectId = "git-sha1:" + 40 lowercase hex | "git-sha256:" + 64 lowercase hex`だけを使う。
対象はSliceAdmission/SliceEvidenceのsubject、CutoverAdmission candidate、CutoverTransition subject、
ReviewLane/ReviewBundle subject、L6Confirmation subject及びpayload内revisionである。
raw hex、uppercase、prefix/length不一致、algorithm変換、field間の別表現を拒否する。

slice admissionは`d0_admitted → f0a_complete → f0b_complete → f0c_complete → q0_complete`の
一方向typed FSMとする。D0 genesisはreview済みかつadmission済みD0 draftを入力として
`slice_id=d0`、`predecessor_receipt_digest=null`で作る。各後続commandは直前stateのreceipt digestを入力し、
target sliceとsubject revisionへ拘束した`SliceAdmissionReceipt`をappendする。F0aはD0 genesis、F0bはF0a
`f0a.static-custody`、F0cはF0b `f0b.sealed-generation`、Q0はF0c `f0c.os-jobs` aggregateを
exactly one要求する。receipt欠落、別slice、別revision、失敗、replay、skipはcandidate commitのmerge
admissionでfail-closeする。

`SliceAdmissionReceipt` coreのzod正本は`src/schema/node-slice-admission.ts`であり、唯一のschemaは
fieldは`{ schema_version, slice_id, predecessor_receipt_digest, subject_revision,
required_input_receipt_digests, decision, producer, receipt_digest }`である。
`schema_version="node-slice-admission.v1"`、`slice_id=d0|f0a|f0b|f0c|q0`、
`decision=approved|rejected`、producerはPLAN-L7-458 ownership表の正規owner IDとする。
required input digestsはslice別registry順の重複なしarrayである。coreはexact 8 fieldsで、
`receipt_digest`を除く
`[schema_version,slice_id,predecessor_receipt_digest,subject_revision,required_input_receipt_digests,`（前半）
decision,producer]`のexact 7-field orderをUTF-8固定順JSON array、decimal byte-length frame、
SHA-256 lowercase hexで封印する。field欠落又は順序変更を拒否する。
positive transitionは直前approved receipt、同一subject lineage、全required input成功時だけapprovedをappendする。
negative transitionは欠落、rejected input、owner不一致、revision drift、skip/replayをtyped rejected receiptとして
残し、次stateへ進めない。
coreは後述のexact `AttestedReceiptEnvelope<SliceAdmissionReceipt>`へ格納する。
`predecessor_receipt_digest`、`required_input_receipt_digests`及び後続からの参照は、すべて対象coreではなく
outer envelopeの`receipt_digest`を保持する。core `receipt_digest`はenvelope内の`record`整合性検証だけに使い、
content-addressed lookup、FSM edge又はdeduplication keyには使わない。

#### `NODE-SLICE-INPUT-REGISTRY-v1`

`required_input_receipt_digests`は下表のrow順に固定し、同一row内は`plan_id`順とする。

| slice | predecessor | required kind / count | producer | revision規則 |
|---|---|---|---|---|
| `d0` | `null` | `ReviewBundleReceipt` / 1（exact 2 lane） | `review-bundle-gate` | candidate HEAD（候補） |
| `d0` | `null` | `AttestedTrackedReceiptRecord` / exact 4（PLAN-L4-33、L5-26、L6-93、L7-458各1） | `plan-admission-attestation-gate` | 各latest formal revisionかつcontent binding一致 |
| `f0a` | approved `d0` / 1 | `f0a.static-custody` / 1 | `f0a-gate` | producer ancestor |
| `f0b` | approved `f0a` / 1 | `f0b.sealed-generation` / 1 | `f0b-gate` | producer ancestor |
| `f0c` | approved `f0b` / 1 | `f0c.os-jobs` / 1 | `f0c-gate` | producer ancestor |
| `q0` | approved `f0c` / 1 | `q0.authoring` / 1、`q0.runtime-no-fallback` / 1 | `q0-authoring`、`q0-runtime` | candidate HEAD |

`TrackedReceiptRecord`は`tracked-receipt-projection.ts` / `diff-fence.ts`のcanonical実型、すなわち
`sequence, previousRecordDigest, recordDigest, commandId, receiptId, receiptDigest, decisionDigest,（正本）
binding{path,planId,assetId,revision,contentDigest}`を正本とする。このhash chainの
`issuerAuthenticity=not_verified`だけではD0 eligibilityを満たさない。`AttestedTrackedReceiptRecord`は
`{schema_version,tracked_record,tracked_record_digest,producer_owner_id,attestation_producer,（固定）
record_digest,attestation,receipt_digest}`のexact wrapperである。`tracked_record`はcanonical全fieldを保持し、
`schema_version="attested-tracked-receipt.v1"`だけを許し、unknown versionを拒否する。
`record_digest`はattestation前の先行5 field、`receipt_digest`はnested attestationを含む先行7 fieldを
固定tuple/length-frame/SHA-256 lowerhexで封印する。canonical tracked record全体とそのdigestを既存nested `EvidenceAttestation`
`{ schemaVersion:"evidence-attestation/v1", algorithm:"hmac-sha256", authorityId, keyVersion, signature }`
へ束縛する正式wrapperである。producerとrecordDigestはattestation内fieldではなく、
`EvidenceAttestationVerifierPort.verify({ producer, recordDigest }, attestation)`のinputとして渡す。
`tracked_record_digest`はembedded `tracked_record.recordDigest`とexact一致しなければならず、
wrapper側だけを再計算したdigest、別recordのdigest又はaliasを拒否する。
D0 graphへ4 wrapperをtyped object/refとして格納し、unsigned/self-hash-only/forged/untrusted、欠落、重複、wrong plan、非latest revision、
candidate artifactとのcontent/path binding driftをadmission前に拒否する。

`CAND-NODEBOOT-017..020`は編集開始前の自己gateではない。各sliceのcandidate testとadmission
schema/runtimeをTDD順で当該slice product changeより先に作り、同じcandidate commitへ含める。
merge admissionがその完成commitに対してgateを実行し、approved receiptが無ければmergeを拒否する。
admission kernelは`src/runtime/node-slice-admission.ts`、pair testは
`tests/node-slice-admission.test.ts`であり、D0→F0a→F0b→F0c→Q0の正規ownerは
PLAN-L7-458 ownership表を正本とする。

このFSMはD0設計mergeと後続slice acceptanceだけを扱う。production activation、hook/runtime switch、
Bun final deletion、cutover transitionは、L6 confirmedかつD0 review/admissionがcandidate HEADへ
一致し、validated Q0及びrequired inherited debt evidenceが揃うまで別のproduction gateが拒否する。
Issue #153は継承負債2件の記録でありwaiver、receipt又はtrust rootではない。

`SliceAdmissionReceipt`は上記implementation slice専用で、cutover又はfinal revisionの許可には流用しない。
cutover用zod正本`src/schema/cutover-transition.ts`は、別schemaとして
field `CutoverAdmissionReceipt { schema_version, edge_id, candidate_head, artifact_digest, prior_validated_receipt_digest, l6_confirmation_receipt_digest, execution_mode, decision, producer_owner_id, attestation_producer, authority_id, record_digest, attestation, receipt_digest }`
を持つ。`schema_version="cutover-admission.v1"`、
decisionは`approved|rejected`、candidate headとedgeをexact bindingする。genesis admissionはvalidated
Q0 `SliceAdmissionReceipt`をpriorに要求し、以後は直前validated cutover receiptをpriorに要求する。
`record_digest`はnested attestationと自身以降を除く先行11 field、`receipt_digest`はnested attestationを含み自身を除く
先行13 fieldを固定順canonical tuple+length frame+SHA-256で封印する。`authority_id`はnested
`EvidenceAttestation.authorityId`とexact一致させる。`execution_mode`は同candidateの
ReviewBundleReceipt、両ReviewLaneReceipt及びadmission実行時にcomposition rootが観測したmodeとexact一致させる。
許可FSMは`q0_validated → genesis_approved → inventory_to_shadow_approved → shadow_to_primary_approved → primary_to_bun_removed_approved → bun_removed_to_sealed_approved`だけとする。

| edge_id | `producer_owner_id` | `attestation_producer` | allowed `authority_id` | allowed `keyVersion` |
|---|---|---|---|---|
| `cutover.genesis` | `cutover-genesis-authority` | `ci` | `ut-tdd-cutover-genesis` | `v1` |
| `cutover.inventory-frozen.node-shadow` | `cutover-shadow-authority` | `ci` | `ut-tdd-cutover-shadow` | `v1` |
| `cutover.node-shadow.node-primary` | `cutover-primary-authority` | `ci` | `ut-tdd-cutover-primary` | `v1` |
| `cutover.node-primary.bun-removed` | `cutover-removal-authority` | `ci` | `ut-tdd-cutover-removal` | `v1` |
| `cutover.bun-removed.sealed` | `cutover-seal-authority` | `ci` | `ut-tdd-cutover-seal` | `v1` |

各cutover/final revisionはexact candidate HEADに対してfresh admissionを発行できるが、authority/key
version、prior receipt、edge、owner→EvidenceProducer写像又は`authority_id == attestation.authorityId`が
上表と一致しなければrejectedとする。この5 rowを`CUTOVER-ADMISSION-PRODUCER-MAP-v1`のclosed setとし、
unknown owner、wrong producer、authority ID driftをfail-closeする。別revisionのadmission replay、
上表以外のtrusted CI authority/keyによる署名もedge authority replayとして拒否する。
slice admission流用、skip、同一edge二重approvedを拒否する。

### Node切替receipt chain

cutover writerはvalidated latest receiptを読み、5状態の隣接一方向遷移だけを受理する。各guardはinventory freeze、
Node parity aggregate、fallback/process 0、final deletion+独立reviewの順に対応する。canonical receiptへ
下記唯一schemaのfieldを封印して`receipt_digest`を計算しappendする。
invalid/skip/reverse/replay/digest不一致はappend前にfail-closeする。read modelはreceipt chainを
foldして再構築し、DB/UIから状態を直接書き換えない。

edge evidence registryはtransition discriminatorごとにrequired kind/count/producer/revision rule/digest/exit successを
固定する。以下のregistryだけをcutover evidence契約の正本とし、PLAN、L6、test-designはRegistry IDを
規範参照してkind/producer IDを再定義しない。

#### `CUTOVER-EVIDENCE-REGISTRY-v1`

| 遷移ID | kind ID | 件数 | producer ID | revision規則 |
|---|---|---:|---|---|
| `cutover.genesis` | `inventory.freeze` | 1 | `inventory-freezer` | `candidate-head` |
| `cutover.genesis` | `review.bundle` | 1 | `review-bundle-gate` | `candidate-head` |
| `cutover.genesis` | `admission.approved` | 1 | `admission-gate` | `candidate-head` |
| `cutover.genesis` | `design.l6-confirmed` | 1 | `l6-confirmation-gate` | `candidate-head` |
| `cutover.inventory-frozen.node-shadow` | `f0a.static-custody` | 1 | `f0a-gate` | `producer-ancestor` |
| `cutover.inventory-frozen.node-shadow` | `f0b.sealed-generation` | 1 | `f0b-gate` | `producer-ancestor` |
| `cutover.inventory-frozen.node-shadow` | `f0c.os-jobs` | 1 | `f0c-gate` | `producer-ancestor` |
| `cutover.inventory-frozen.node-shadow` | `review.bundle` | 1 | `review-bundle-gate` | `candidate-head` |
| `cutover.inventory-frozen.node-shadow` | `admission.approved` | 1 | `admission-gate` | `candidate-head` |
| `cutover.node-shadow.node-primary` | `q0.authoring` | 1 | `q0-authoring` | `candidate-head` |
| `cutover.node-shadow.node-primary` | `q0.runtime-no-fallback` | 1 | `q0-runtime` | `candidate-head` |
| `cutover.node-shadow.node-primary` | `review.bundle` | 1 | `review-bundle-gate` | `candidate-head` |
| `cutover.node-shadow.node-primary` | `admission.approved` | 1 | `admission-gate` | `candidate-head` |
| `cutover.node-primary.bun-removed` | `inventory.zero` | 1 | `ban-audit` | `candidate-head` |
| `cutover.node-primary.bun-removed` | `pack.acceptance` | 1 | `pack-gate` | `candidate-head` |
| `cutover.node-primary.bun-removed` | `review.bundle` | 1 | `review-bundle-gate` | `candidate-head` |
| `cutover.node-primary.bun-removed` | `admission.approved` | 1 | `admission-gate` | `candidate-head` |
| `cutover.bun-removed.sealed` | `debt.plan-recovery-16.repaired` | 1 | `plan-recovery-16-gate` | `candidate-head` |
| `cutover.bun-removed.sealed` | `debt.plan-l7-452.repaired` | 1 | `plan-l7-452-gate` | `candidate-head` |
| `cutover.bun-removed.sealed` | `issue.153-closed` | 1 | `github-evidence` | `candidate-head` |
| `cutover.bun-removed.sealed` | `aggregate.success` | 1 | `aggregate-gate` | `candidate-head` |
| `cutover.bun-removed.sealed` | `review.bundle` | 1 | `review-bundle-gate` | `candidate-head` |
| `cutover.bun-removed.sealed` | `admission.approved` | 1 | `admission-gate` | `candidate-head` |

全rowでEdge ID、kind ID、producer ID、count、revision rule、digest、successをexact照合する。receipt schemaは
種別で分離する。`SliceEvidenceReceipt`は`kind_id`でdiscriminateし、共通field
`{ schema_version, edge_id, kind_id, producer_owner_id, attestation_producer, subject_revision,（固定）
success, reference_kind, referenced_receipt_digest, payload_object_receipt_digest, payload_digest,（固定）
record_digest, attestation, receipt_digest }`を持つ。
`review.bundle`は`referenced_receipt_digest=AttestedReceiptEnvelope<ReviewBundleReceipt>.receipt_digest`、
`admission.approved`は`referenced_receipt_digest=CutoverAdmissionReceipt.receipt_digest`を必須とする。
その他generic payload kindだけが`payload_object_receipt_digest`と`payload_digest`を持つ。`schema_version`は
`cutover-evidence.v1`とする。`subject_revision`はregistryのrevision規則でdiscriminateし、
`producer-ancestor` rowではproducer commit、`candidate-head` rowではcandidate HEADをexact保持する。
正規型`GitObjectId = "git-sha1:" + 40 lowercase hex | "git-sha256:" + 64 lowercase hex`だけを許す。
現repositoryのSHA-1 object IDは`git-sha1:<40hex>`として保持する。algorithm prefixなし、長さ混同、
uppercase又は同じhexを別algorithmへ付け替えたrevision replayを拒否する。
`record_digest`はnested attestation、自身及び`receipt_digest`を除いた
`schema_version,edge_id,kind_id,producer_owner_id,attestation_producer,subject_revision,success`（前半）と
`reference_kind,referenced_receipt_digest|null,payload_object_receipt_digest|null,payload_digest|null`（後半）
の固定11-field tupleを封印する。`receipt_digest`はその11 field、`record_digest`及びnested
`EvidenceAttestation`を固定順に封印する。
outer content-addressed objectの唯一のidentityとlookup keyは`receipt_digest`である。
generic kindの`payload_digest`はpayload contentのdigestに限定し、object lookup、参照edge、deduplication keyへ流用しない。
generic payloadの実体は
`EvidencePayloadObject { schema_version, kind_id, payload_schema, payload_bytes, payload_digest,`（前半）
`producer_owner_id, attestation_producer, record_digest, attestation, receipt_digest }`（後半）
のexact schemaで保存する。`record_digest`はnested attestationと自身以降を除く先行7 field、
`receipt_digest`は先行9 fieldを固定順で封印する。`SliceEvidenceReceipt.payload_object_receipt_digest`だけで
`schema_version`はliteral `evidence-payload-object.v1`だけを許す。
`payload_bytes`はdecoded payloadのRFC 8785 canonical JSONをUTF-8 encodeしたbyte列をRFC 4648
base64url（`-`/`_` alphabet、paddingなし）で表す。標準base64、padding付き、非canonical JSON、invalid UTF-8、
duplicate key又はdecode→再encode不一致を拒否する。このobjectを取得し、base64url decodeしたbytesから
SHA-256 lowercase hex `payload_digest`を再計算してreceipt側とexact一致させる。
さらに両receipt間で`kind_id`、`producer_owner_id`、`attestation_producer`及びregistryで定めた
`payload_schema`をexact照合する。cross-kind、cross-owner、wrong producer又は別schema payloadのreceipt replayを拒否する。

#### `CUTOVER-PAYLOAD-SCHEMA-REGISTRY-v1`

decoded payloadの共通exact base fieldsは
`{ schema_version:"evidence-payload.v1", schema_id:payload_schema literal, kind_id:string literal,`（共通前半）
`subject_revision:GitObjectId, observed_at:RFC3339 UTC, result:"success" }`である。外側
`SliceEvidenceReceipt.subject_revision`とexact equality、`EvidencePayloadObject.payload_schema == decoded.schema_id`
を要求する。追加fieldを許可せず、下表のkind別required fieldsを加えた
closed discriminated unionをRFC 8785 canonicalizeする。`uint`はJSON整数かつ`0..2^53-1`、digestは
`sha256:` prefix付き64 lowercase hexである。

| kind ID | payload_schema | kind別required fields（型 / domain / semantic predicate） |
|---|---|---|
| `inventory.freeze` | `inventory-freeze.v1` | `inventory_digest:digest`, `entry_count:uint` / freeze対象全件を数える |
| `design.l6-confirmed` | `l6-confirmation-evidence.v1` | `plan_id:"PLAN-L6-93-node-bootstrap-contract"`, `plan_revision:uint`, `status:"confirmed"`, `content_digest:digest` / subjectとformal revision一致 |
| `f0a.static-custody` | `f0a-static-custody.v1` | `node_version:string`, `npm_version:string`, `lock_digest:digest` / exact pinとclean lock graph一致 |
| `f0b.sealed-generation` | `f0b-sealed-generation.v1` | `image_digest:digest`, `generation:uint`, `fallback_count:0` / sealed generation成功 |
| `f0c.os-jobs` | `f0c-os-jobs.v1` | `workflow_revision:GitObjectId`, `run_id:string`, `run_attempt:uint>0`, `linux:{subject_revision:GitObjectId,run_id:string,run_attempt:uint,conclusion:"success",digest:digest}`, `windows:{同型}` / `workflow_revision == subject_revision == linux.subject_revision == windows.subject_revision && run_id/run_attemptが両OSと一致 && 両conclusion=="success"` |
| `q0.authoring` | `q0-authoring.v1` | `fixture_digest:ContentDigest`, `case_manifest_envelope_digest:ReceiptDigest`, `executed_case_ids:string[] unique` / immutable manifest期待set equality |
| `q0.runtime-no-fallback` | `q0-runtime-no-fallback.v1` | `runtime_digest:ContentDigest`, `case_manifest_envelope_digest:ReceiptDigest`, `executed_case_ids:string[] unique`, `bun_process_count:0`, `fallback_count:0` / immutable manifest expected set equalityかつNode-only |
| `inventory.zero` | `inventory-zero.v1` | `scan_digest:digest`, `bun_reference_count:0` / inventory全対象0 |
| `pack.acceptance` | `pack-acceptance.v1` | `pack_digest:digest`, `accepted:true` / clean Pack acceptance |
| `debt.plan-recovery-16.repaired` | `plan-recovery-16-repair.v1` | `plan_id:"PLAN-RECOVERY-16-plan-revision-authoring"`, `repair_receipt_digest:digest` / formal repair済み |
| `debt.plan-l7-452.repaired` | `plan-l7-452-repair.v1` | `plan_id:"PLAN-L7-452-forward-escape-contract-red"`, `repair_receipt_digest:digest` / formal repair済み |
| `issue.153-closed` | `github-issue-closure.v1` | `issue_id:153`, `state:"closed"`, `event_digest:digest` / trusted closure event |
| `aggregate.success` | `aggregate-success.v1` | `profile_id:"harness-check"`, `profile_revision:1`, `required_lane_ids:string[] unique`, `required_lane_set_digest:digest`, `workflow_revision:GitObjectId`, `run_id:string`, `run_attempt:uint>0`, `lanes:[{lane_id:string unique,subject_revision:GitObjectId,run_id:string,run_attempt:uint,outcome:"success"}]`, `aggregate:"success"` / profile exact set equalityかつ全lane success |

generic kindはこのclosed registryのexact 1 rowを要求する。`review.bundle`と`admission.approved`はtyped refであり
payload schema registryへ入れない。未知kind/schema、row追加を伴わないschema文字列又はcross-row再利用はfail-closeする。

#### `CASE-MANIFEST-v1`

`ReceiptDigest`はprefixなし64 lowercase hexで、core/outer `receipt_digest`、refs、DB PKにだけ使う。
`ContentDigest`は`sha256:`+64 lowercase hexでartifact/content/required setにだけ使う。相互変換やprefix省略/
付加を許さず、算出時と検証時にprefix有無をexact照合する。
ContentDigestの全算出式は必ず文字列`"sha256:" + SHA-256-lowerhex(preimage)`を返す。
`IdentityDigest`はContentDigest subtypeである。canonical identity object
`{identity_schema:"ut-tdd-identity.v1",provider,runtime_family,stable_subject_id}`をRFC 8785 canonicalize→
UTF-8→`"sha256:"+lowerhex`で算出する。
`SessionIdentityDigest`もContentDigest subtypeで、canonical object
`{session_schema:"ut-tdd-session.v1",provider,runtime_family,provider_issued_session_id}`を同じ式で算出する。
provider-issued attestationを必須とし、raw session stringやaliasを受理しない。
#### `MANAGED-SESSION-TRUST-REGISTRY-v1`

| revision | provider | runtime_family | authorityId | algorithm | keyVersion | valid_from | valid_until |
|---:|---|---|---|---|---|---|---|
| 1 | `openai` | `codex` | `ut-tdd-managed-codex-session-v1` | `ed25519` | `session-key-v1` | `2026-01-01T00:00:00Z` | `2027-01-01T00:00:00Z` |
| 1 | `anthropic` | `claude` | `ut-tdd-managed-claude-session-v1` | `ed25519` | `session-key-v1` | `2026-01-01T00:00:00Z` | `2027-01-01T00:00:00Z` |
| 1 | `human` | `human` | `ut-tdd-managed-human-session-v1` | `ed25519` | `session-key-v1` | `2026-01-01T00:00:00Z` | `2027-01-01T00:00:00Z` |

この3 rowをclosed setとし、standalone humanもhuman rowだけを使う。実key値は文書へ保存せずcomposition-root
key handleへ解決する。D0正本はimmutable v1/revision 1だけで、unknown provider/runtime/authority/key/revisionを拒否する。
v1の実行経路にrotationは0である。将来は別additive PLAN/design revisionと新registry ID v2をreview/admit後に実装し、
v1を書き換えない。

`ManagedSessionAttestation`は
`{schemaVersion:"managed-session-attestation.v1",trust_registry_id:"MANAGED-SESSION-TRUST-REGISTRY-v1",`
`trust_registry_revision:1,algorithm:"ed25519",authorityId,keyVersion,issued_at:RFC3339,signature}`
のexact schemaである。
`ManagedSessionAttestationVerifierPort.verify({provider,runtimeFamily,payloadBytes},attestation)`を使い、
composition rootのclosed trust registryでprovider/runtime→allowed authorityId/algorithm/keyVersionを固定する。
codex/claude/human/standaloneのUT-TDD managed delegation/session gateが発行し、外部provider API署名を仮定しない。
unknown/wrong/expired key、forgery、algorithm drift、cross-provider replayを拒否する。
`issued_at`がv1 rowの`[valid_from,valid_until)`内だけ発行/検証を許し、expiry後は新receipt発行0かつ全admission
fail-closeとする。active signing-key compromiseの自動検出、rotation、revocationはD0実行経路に存在しない。
侵害が外部security incidentとして報告された時点で該当authorityを運用停止し、managed-session verification、
admission、cutoverを全面fail-closeする。既存receiptはmerge又はactivationの根拠に使わない。再開にはsecurity/PO承認の
別ADR/PLAN、新registry ID v2、再review、再issueが必要であり、immutable v1自体は書き換えない。この境界はmachine
Green oracle又はhistorical determinism claimではなく、明示的な高影響運用境界である。

`SessionIdentityReceipt` coreは
`{schema_version:"session-identity.v1",provider,runtime_family,provider_issued_session_id,stable_subject_id,`（前半）
`identity_digest:IdentityDigest,session_identity_digest:SessionIdentityDigest,managed_session_attestation:ManagedSessionAttestation,producer_owner_id:"session-identity-gate",`
`receipt_digest:ReceiptDigest}`（後半）のexact 10/self除外9-field preimageを持つ。self除外9 fieldsのcanonical
objectをRFC 8785→UTF-8→SHA-256 raw ReceiptDigest化する。managed attestationとouter EvidenceAttestationを
二段検証する。Attested envelopeへ格納しcore/outer ownerを一致、closed mapでEvidenceProducer `ci`へ写像する。
producer/verifier共通の唯一の署名payloadはcanonical combined object
`{identity_schema:"ut-tdd-identity.v1",stable_subject_id,session_schema:"ut-tdd-session.v1",provider,`
`runtime_family,provider_issued_session_id,trust_registry_id:"MANAGED-SESSION-TRUST-REGISTRY-v1",`
`trust_registry_revision:1,issued_at}`のRFC 8785 UTF-8 bytesである。
同じmanaged authorityがstable subjectとsessionを同時証明し、IdentityDigest/SessionIdentityDigestを再導出する。

producer自己申告から分離したimmutable `CaseManifestObject` coreを保存する。exact schemaは
`{schema_version:"case-manifest.v1",subject_revision:GitObjectId,source_artifact_id:"NODE-Q0-CASE-MANIFEST-v1",`（前半）
`source_artifact_path:"docs/test-design/harness/L8-integration-test-design.md",source_test_design_artifact_digest:ContentDigest,`
`expected_case_ids:string[] unique sorted nonempty,required_set_digest:ContentDigest,producer_owner_id:"q0-case-manifest-gate",`（後半）
receipt_digest}`である。selfを除くexact 8-field tupleをcore preimageとし、`receipt_digest`はこのtupleの
RFC 8785 canonical JSONをUTF-8化してSHA-256 lowerhexを取ったexact値とする。
`AttestedReceiptEnvelope<CaseManifestObject>`へ格納する。ownerはEvidenceProducer `ci`へ写像し、
lookup/refはouter envelope digestだけを使う。Q0 payloadは`case_manifest_envelope_digest`を参照し、
manifest subjectとpayload subjectを一致させ、executed IDsとexpected IDsのexact set equalityを要求する。
`expected_case_ids`はUTF-8 code-point昇順のunique arrayとし、`required_set_digest`は
`SHA-256(lowerhex)(UTF-8(RFC8785 canonical JSON(expected_case_ids)))`のexact値を要求する。
`source_test_design_artifact_digest`の唯一のpreimageはmarker間のsingle parsed JSON objectをRFC 8785
canonicalizeしてUTF-8化したbytesであり、doc全体、marker行、改行を含めない。
artifact extractionは上記pathのraw Markdown bytesをUTF-8 LFとして読む。開始行exact
`` `NODE-Q0-CASE-MANIFEST-v1-BEGIN` ``と終了行exact
`` `NODE-Q0-CASE-MANIFEST-v1-END` ``を各1行、開始→終了順で要求し、前後空白0とする。
両行間はnonblank JSON line exact 1行だけを許す。JSONのrequired/allowed fieldsはexact
`{artifact_id,schema_version,expected_case_ids}`で、artifact/schema literalを照合し、
unknown/missing/duplicate keyを拒否する。RFC 8785 canonicalizeしたobjectのUTF-8 bytesからartifact digestを計算する。
manifestの`expected_case_ids`はparsed JSON arrayと順序を含めexact一致させ、subset/extra/order drift/duplicateを拒否する。
core `producer_owner_id`はouter `producer_owner_id`と一致させ、closed owner mapによりouter
`attestation_producer == "ci"`を要求する。typed object storeは
`UNIQUE(subject_revision, evidence_type='q0-case-manifest')`を保証し、同一outer digestの再登録だけを冪等成功、
同一subjectで異なるdigestを競合拒否する。これはhead/CAS/version registryではない。
`q0.authoring`とclosed literal `q0.runtime-no-fallback`は同じCaseManifest outer digestを参照する。EvidencePayloadObjectから
CaseManifest outer digestへのtyped edgeを`cutover_evidence_refs`へ保存する。各`q0.authoring`/
`q0.runtime-no-fallback` EvidencePayloadObjectは`edge_kind='q0.case-manifest'`, `ordinal=0`のedge exact 1を持ち、
reducerはそのedgeだけを辿る。別edge kind/ordinal、複数、missing/orphan/different-manifest参照はfail-closeする。
manifest変更は新subject revisionと通常のreview/admissionを必要とし、runtime mutable registry/head/removal APIは0とする。

#### `AGGREGATE-PROFILE-REGISTRY-v1`

| profile_id | revision | 必須lane exact set |
|---|---:|---|
| `harness-check` | 1 | `harness-check-linux`, `harness-check-windows`, `harness-check-aggregate` |

`required_lane_set_digest`はsorted required IDsのcanonical JSON UTF-8 bytesのSHA-256である。
payload required setとobserved lane setはprofile exact setへ一致させ、duplicate、extra、missing、
profile/revision drift、aggregate laneだけの自己成功を拒否する。
`object_digest` / `evidence_digest`を`receipt_digest`のaliasとして受理せず、nested payloadも各typed
receipt自身の`receipt_digest`だけで取得する。
`CutoverTransitionReceipt`の唯一のschemaは
fieldは`{ schema_version, registry_id, transition_id, sequence, subject_revision, previous_state, current_state, evidence_set_digest, review_digest, admission_digest, previous_receipt_digest, receipt_digest }`である。
`schema_version="cutover-transition.v1"`、`registry_id="CUTOVER-EVIDENCE-REGISTRY-v1"`、
`transition_id`は該当Edge ID、`subject_revision`はtransition candidate HEADとする。
全production edgeで`review.bundle` / `admission.approved` rowをexactly one要求するため、
`review_digest` / `admission_digest`は非nullかつ各evidence receiptの`receipt_digest`とexact一致する。
`admission.approved`は`CutoverAdmissionReceipt`だけを指し、`SliceAdmissionReceipt`を受理しない。
別名`evidence_digest`又は`chain_digest`をtransition receipt fieldとして受理しない。
`candidate-head` evidenceはcandidate HEADとexact一致する。
`producer-ancestor` evidenceは各producer commitをexact保持し、candidate HEADが全producer commitの
descendantであるancestry closureを要求する。producer commitがcandidate HEAD自身又はそのancestorでない場合、
同一evidence digest/commitの再利用、既に消費したreceipt、previous chain head不一致をそれぞれ
non-ancestor、stale/replay、chain mismatchとしてappend前に拒否する。transition receiptは全producer
receiptを次の唯一の手順で`evidence_set_digest`へ封印し、別candidate HEADへの流用を拒否する。

1. registryに記載したrow順を`row_ordinal`として固定し、各receiptを
   配列`[schema_version, registry_id, transition_id, row_ordinal, edge_id, kind_id, producer_owner_id,
   attestation_producer,
   subject_revision, receipt_digest, success]`のJSON tupleへ射影する。`receipt_digest`が
   kind別`referenced_receipt_digest`又は`payload_digest`を含むevidence receipt全体を封印するため、payload mutationも集合digestへ伝播する。
2. 同一`(edge_id, kind_id, producer_owner_id, attestation_producer, subject_revision, receipt_digest)`又は同一expected rowの
   duplicateをhash前に拒否し、registry row orderへstable sortする。
3. 各tupleをUTF-8・無空白・固定array順のcanonical JSONへencodeし、
   `<UTF-8 byte length in decimal>:<JSON bytes>`でlength-frameして連結する。
4. 連結byte列のSHA-256 lowercase hexを`evidence_set_digest`とする。OS path separator、改行、
   locale、object key iterationは入力に含めない。
5. `receipt_digest`は上記12 fieldのうち自身だけを除いた固定順JSON arrayを同じlength-frame規則で
   encodeし、SHA-256 lowercase hexで算出する。`previous_receipt_digest`は直前の`receipt_digest`又は
   genesisの`null`だけを許す。

`cutover.bun-removed.sealed`は`debt.plan-recovery-16.repaired`と
`debt.plan-l7-452.repaired`の両typed rowを必須とし、片方だけ、旧generic `debt.repair`、
未知PLAN IDは拒否する。

`WorkProvenanceEventReceipt` coreは
`{schema_version:"candidate-work-provenance.v1",base_revision:GitObjectId,subject_revision:GitObjectId,`
`product_commit:GitObjectId,author_provider:string,author_identity_digest:IdentityDigest,author_session_identity_envelope_digest:ReceiptDigest,runtime_family:string,`
`touched_paths:string[] sorted unique nonempty,touched_paths_digest:ContentDigest,producer_owner_id:"candidate-work-provenance-gate",receipt_digest:ReceiptDigest}`
のexact 12 fields/self除外11-field RFC 8785/UTF-8/SHA-256 raw ReceiptDigest preimageを持ち、自身のdigestを
preimageへ入れない。Attested envelopeへ格納しcore/outer ownerを一致、closed mapで`ci`へ写像し、
provider/session attestationを検証する。
参照SessionIdentityReceiptのprovider/runtime_familyはWorkEventのauthor_provider/runtime_familyとexact一致し、
session canonical objectからSessionIdentityDigestを再導出する。
WorkEvent `author_identity_digest`はSessionIdentityReceipt `identity_digest`とexact一致する。
pathはGit tree由来repo-relative UTF-8 NFC、separator `/`、case-sensitiveとし、absolute、`.`、`..`、
backslash、NUL、invalid UTF-8を拒否する。`touched_paths_digest`はexact arrayのRFC 8785→UTF-8→ContentDigestである。

`CandidateAuthorshipReceipt` coreのself除外10 fieldsは次のfield orderのcanonical objectをRFC 8785→UTF-8→
SHA-256 raw ReceiptDigest化する。
`{schema_version:"candidate-authorship.v1",subject_revision:GitObjectId,`（前半）
`artifact_digest:ContentDigest,base_revision:GitObjectId,author_identity_digest_set:IdentityDigest[] sorted unique nonempty,`
`runtime_family_set:string[] sorted unique nonempty,author_session_identity_envelope_digests:ReceiptDigest[] sorted unique nonempty,`
`work_provenance_event_envelope_digests:ReceiptDigest[] sorted unique nonempty,work_provenance_set_digest:ContentDigest,`
`producer_owner_id:"candidate-custody-gate",receipt_digest:ReceiptDigest}`（後半）の
exact 11 fields/self除外10-field preimageを持ちAttested envelopeへ格納する。trusted custody gate→`ci`とし、
provider/session verifierがbase..subjectの全product-writing eventからsetsを再導出する。missing/unattested/
forged/omitted writerを拒否し、自由な`author_identity`自己申告fieldを廃止する。
work event outer ReceiptDigest arrayをRFC 8785→UTF-8→`sha256:`+lowerhex化して
`work_provenance_set_digest`を再導出する。authorship→event edgeは
`edge_kind='authorship.work-event'`, `ordinal=array index`のexact Nとし、missing/orphan/extra/order/digest mismatchを拒否する。
base..subjectはfirst-parent linearだけを許しmerge commitを拒否する。各commitとfirst parentのdiffから得る
全Git tracked changed paths exact set（除外0）を対応event `touched_paths`と一致させる。untracked/gitignored
runtime stateはGit diffに存在しない。candidate coverageはevent arraysの
path unionを直接比較しdigestから復元しない。commit/path omission、foreign subject/base/session/identityを拒否する。

`ReviewBundleReceipt`は`{ schema_version, artifact_digest, subject_revision, base_revision,
authorship_envelope_digest, execution_mode, lanes, receipt_digest }`のexact 8 fields/self除外7-field preimageで、
`schema_version="review-bundle.v1"`、lanesはexactly twoである。
各`ReviewLaneReceipt`は`{ schema_version, lane_id, verdict, artifact_digest, subject_revision, provider,
reviewer_model, execution_mode, runtime_family, reviewer_identity_digest:IdentityDigest, reviewer_session_identity_envelope_digest:ReceiptDigest, receipt_digest }`とし、lane IDは
`schema_version="review-lane.v1"`だけを許し、unknown versionを拒否する。
`claim-blind` / `spec-blind`を各1、verdictは両方`PASS`だけを許す。両laneのartifact/revisionはbundleと一致し、
`execution_mode=hybrid`ではprovider、session、identityがlane間で異なり、reviewer identity/session/runtimeは
authorship receiptのauthor setsともdisjointである。
`codex-only|claude-only`ではprovider/runtime familyの一致を許す一方、reviewer model、session、
identityがlane間で異なり、reviewerはauthorとも異なる。異model2 laneを用意できなければfail-closeする。
`standalone`はAI/subagent laneを禁止し、distinct human reviewer 2名を要求する。両laneは
`provider=human, reviewer_model=none, runtime_family=human`、異なるidentity/session/evidenceで、
authorとも異ならなければならない。人間2名を用意できなければfail-closeする。
各laneは`receipt_digest`以外のexact 11 fieldを
`[schema_version,lane_id,verdict,artifact_digest,subject_revision,provider,reviewer_model,`（前半）
execution_mode,runtime_family,reviewer_identity_digest,reviewer_session_identity_envelope_digest]`の順で固定tuple/length-frame/SHA-256規則へ
封印する。field欠落、順序変更、version除外又は旧10-field preimageを拒否する。
bundleはlaneを`claim-blind, spec-blind`順へ固定し、`receipt_digest`以外のexact 7 field
`[schema_version, artifact_digest, subject_revision, base_revision, authorship_envelope_digest, execution_mode,`（前半）
`lanes=[claim-blind.receipt_digest,spec-blind.receipt_digest]]`（後半）
を同じ規則で封印する。`lanes`に格納する2 digestは各lane coreではなく
`AttestedReceiptEnvelope<ReviewLaneReceipt>.receipt_digest`である。そのbundle coreを包むouter envelope receipt digestを
`review.bundle` evidence receiptが参照し、
transitionの`review_digest`はそのevidence receipt `receipt_digest`と一致する。片lane、PASS以外、
重複lane、artifact/revision drift、mode別independence違反は拒否する。
bundleと両laneの`execution_mode`はactual admission modeとexact一致し、mixed/stale modeを拒否する。
bundle→authorship outer digestのtyped refは`edge_kind='review.authorship'`, `ordinal=0` exact 1とし、
D0 top-level 5 inputsは維持する。
bundle/authorshipのsubject、artifact、baseをexact一致させ、baseはPR admission requestのreview base/merge-base
GitObjectIdと一致させる。base drift/range truncation/cross-candidateを拒否する。reviewer IdentityDigest setと
author/reviewer session envelopeをchain-only検証してSessionIdentityDigestを再導出し、envelope digestと
SessionIdentityDigestの双方をdisjoint比較する。WorkEvent→sessionとReviewLane→sessionは各
`edge_kind='identity.session'`, `ordinal=0` exact 1とする。
ReviewLane参照SessionIdentityReceiptのprovider/runtime_familyはlane provider/runtime_familyとexact一致する。
ReviewLane `reviewer_identity_digest`もSessionIdentityReceipt `identity_digest`とexact一致し、raw aliasは比較入力にしない。

| `producer_owner_id` | `attestation_producer` |
|---|---|
| `inventory-freezer` | `ci` |
| `review-bundle-gate` | `ci` |
| `admission-gate` | `ci` |
| `l6-confirmation-gate` | `ci` |
| `f0a-gate` | `ci` |
| `f0b-gate` | `ci` |
| `f0c-gate` | `ci` |
| `q0-authoring` | `ci` |
| `q0-runtime` | `ci` |
| `ban-audit` | `ci` |
| `pack-gate` | `ci` |
| `plan-recovery-16-gate` | `ci` |
| `plan-l7-452-gate` | `ci` |
| `github-evidence` | `ci` |
| `aggregate-gate` | `ci` |
| `plan-admission-attestation-gate` | `ci` |
| `q0-case-manifest-gate` | `ci` |
| `candidate-custody-gate` | `ci` |
| `candidate-work-provenance-gate` | `ci` |
| `session-identity-gate` | `ci` |

この20 rowを`CUTOVER-EVIDENCE-PRODUCER-MAP-v1`のclosed setとする。slice admission owner 5種は
PLAN-L7-458 `SliceAdmission producer registry`のclosed setとして全て`ci`へ写像する。review lane ownerは
lane providerと同じ`human|codex|claude`、PO approval ownerは`po`へ写像する。

owner IDはrecord preimageへ封印し、verifierには既存enumの`attestation_producer`だけを渡す。
unknown/wrong mappingを拒否し、producerを`ci`へ丸めても署名対象recordDigest内のowner bindingを維持する。
`hybrid`ではprovider/runtime familyを分離する。`codex-only` / `claude-only`でprovider差を
構成できない場合に限り、異なるmodelかつ独立sessionのintra-runtime 2 laneを許可する。同一model、
同一session、author自身のlaneは全modeで禁止し、Issue #153でもclaim-blind/spec-blind exact 2 laneを減免しない。
standaloneは上記human 2 lane以外を許可しない。

`ReviewLaneReceipt`、`ReviewBundleReceipt`、`CandidateAuthorshipReceipt`、`WorkProvenanceEventReceipt`、`SessionIdentityReceipt`、`SliceAdmissionReceipt`、`CaseManifestObject`の各core receiptは
`AttestedReceiptEnvelope { schema_version, producer_owner_id, attestation_producer, record,`（前半）
record_digest, attestation, receipt_digest }`のexact 7-field wrapperへ格納する。`record_digest`は
`schema_version="attested-receipt-envelope.v1"`だけを許し、unknown versionを拒否する。
`record_digest`は`[schema_version,producer_owner_id,attestation_producer,record]`のexact 4-field tuple、
wrapper `receipt_digest`は自身を除くexact 6-field tupleを封印する。core `receipt_digest`も再計算し、
CandidateAuthorship core `producer_owner_id`はouter ownerと一致し、outer `attestation_producer`はclosed mapの`ci`とexact一致する。
`EvidenceAttestationVerifierPort.verify({producer: attestation_producer, recordDigest: record_digest},`（検証入力）
attestation)`を構成する。core schemaを曖昧に拡張せずproducer、record digest、nested attestationを
chainだけから復元する。
SliceAdmission coreの`producer`はcanonical `producer_owner_id`として解釈し、outer envelopeの
`producer_owner_id`とexact一致させる。core/outer owner差、outer `attestation_producer`のwrong mapping又は
同じ署名を別ownerへ移したreplayを拒否する。

`SliceAdmissionReceipt`、`CutoverAdmissionReceipt`は
既存`EvidenceRecord` / `EvidenceAttestation`契約を必須利用し、独自の署名booleanや自己申告を持たない。
各recordはproducer、subject revision、source commit、edge/slice binding、canonical record digestと、
nested attestation `{ schemaVersion, algorithm, authorityId, keyVersion, signature }`を持ち、composition root固定
`EvidenceAttestationVerifierPort`のtrusted verifierがeligibleと判定したものだけを数える。
独自`issuer_key_id`は導入しない。unsigned、forged signature、unknown/untrusted authority又はkey version、
producer/subject/edge binding不一致は監査保存しても
gate件数には数えない。review lane independenceは上記execution mode別条件だけを正本とする。

freshとは、bundle/admissionがtransition candidate HEADとそのartifact digestへexact拘束され、
まだどのtransitionにも消費されていないことをいう。review後にproduct commitが追加されればrevision/
artifact mismatchで失効する。`admission.approved`は同じcandidate HEADに対する正規ownerのapproved
`CutoverAdmissionReceipt`を封印し、transitionの`admission_digest`はそのevidence receipt digestと一致する。

chain entryはtransition receiptとその全immutable evidence receiptsを同じappend recordへ保存する。
したがって外部review service又はIssueを再照会せず、chainだけでreview bundle、admission、evidence set、
receipt digestを再検証できる。`initializeCutoverChain`は`sequence=0`かつ
`expected_previous_receipt_digest=null`のCASだけを許す。`appendCutoverTransition`は
`sequence=latest.sequence+1`、`expected_previous_receipt_digest=latest.receipt_digest`を要求する。
writerはchain headに対するexclusive lock内でcompare-and-swapし、receipt/evidenceを単一atomic transactionでappendする。
CAS loserは`cutover-write-conflict`でretryせず、double genesis、同一headからのfork、partial/crash appendを残さない。

保存するtyped evidence unionは`SliceEvidenceReceipt | EvidencePayloadObject |`（先頭）、
`AttestedReceiptEnvelope<ReviewLaneReceipt> | AttestedReceiptEnvelope<ReviewBundleReceipt> |`（レビュー）、
`AttestedReceiptEnvelope<CandidateAuthorshipReceipt> | AttestedReceiptEnvelope<WorkProvenanceEventReceipt> | AttestedReceiptEnvelope<SessionIdentityReceipt> | AttestedReceiptEnvelope<SliceAdmissionReceipt> | AttestedReceiptEnvelope<CaseManifestObject> |`（残り）、
CutoverAdmissionReceipt | AttestedTrackedReceiptRecord | L6ConfirmationReceipt`である。`L6ConfirmationReceipt`は
`{schema_version,plan_id,plan_revision,status,content_digest,subject_head,tracked_record_digest,`（前半）
producer_owner_id,attestation_producer,record_digest,attestation,receipt_digest}`のexact schemaである。
`schema_version="l6-confirmation.v1"`だけを許し、unknown versionを拒否する。
`record_digest`は先行9 field、`receipt_digest`はrecord digest+nested attestationを含む先行11 fieldを
固定tuple/length-frame/SHA-256 lowerhexで封印する。
verifier inputは`{producer,recordDigest}`とし、draft/unconfirmed/wrong plan/stale head/unsigned、
schemaVersion/algorithm欠落、forged/untrustedを拒否する。
content-addressed objectとして保存し、transition→evidence、bundle→2 lane、CutoverAdmission→validated Q0
`AttestedReceiptEnvelope<SliceAdmissionReceipt>`又はprior cutoverと`L6ConfirmationReceipt`のdirect参照edgeを持つ。
各参照はouter envelope `receipt_digest`だけでlookupする。core `receipt_digest`又はaliasからのlookupは拒否する。
各`SliceAdmissionReceipt`は
`predecessor_receipt_digest`と`required_input_receipt_digests`をexplicit refとして保存する。D0
`SliceAdmissionReceipt`は既存`AttestedReceiptEnvelope<ReviewBundleReceipt>`のouter receipt digestへのtyped root refを必須とするため、
Q0→F0c→F0b→F0a→D0 rootsを外部再照会なしで辿れる。reducerはroot transitionから全参照を
digest照合しながら再帰走査し、欠落、型違い、cycle、orphan、attestation不一致を拒否する。

物理backendは専用`<repo>/.ut-tdd/ledger/cutover-ledger.db`のSQLiteだけとし、file ownership正本は
[physical-data.md](physical-data.md) §2.7.1を参照する。
全canonical tableはSQLite `STRICT`とする。head tableは`cutover_chain_heads(chain_id TEXT PRIMARY KEY NOT NULL CHECK(length(chain_id)>0), head_digest TEXT, head_sequence INTEGER NOT NULL CHECK(head_sequence>=0), version INTEGER NOT NULL, CHECK((head_digest IS NULL AND head_sequence=0 AND version=0) OR (head_digest IS NOT NULL AND head_sequence>=0 AND version>=1 AND length(head_digest)=64 AND head_digest NOT GLOB '*[^0-9a-f]*'))) STRICT`、
receipt tableは`cutover_transition_receipts(chain_id TEXT NOT NULL CHECK(length(chain_id)>0), sequence INTEGER NOT NULL CHECK(sequence>=0), receipt_digest TEXT NOT NULL CHECK(length(receipt_digest)=64 AND receipt_digest NOT GLOB '*[^0-9a-f]*'), receipt_json TEXT NOT NULL, UNIQUE(chain_id,sequence), UNIQUE(receipt_digest)) STRICT`、
evidence object tableは`cutover_evidence_objects(receipt_digest TEXT PRIMARY KEY NOT NULL CHECK(length(receipt_digest)=64 AND receipt_digest NOT GLOB '*[^0-9a-f]*'), object_digest TEXT NOT NULL CHECK(length(object_digest)=64 AND object_digest NOT GLOB '*[^0-9a-f]*'), evidence_type TEXT NOT NULL, subject_revision TEXT GENERATED ALWAYS AS (CASE WHEN evidence_type='q0-case-manifest' THEN json_extract(payload_json,'$.record.subject_revision') END) STORED, payload_json TEXT NOT NULL, attestation_json TEXT NOT NULL, CHECK(object_digest=receipt_digest), CHECK(evidence_type IN ('slice-evidence','evidence-payload','review-lane','review-bundle','candidate-authorship','candidate-work-provenance','session-identity','slice-admission','q0-case-manifest','cutover-admission','tracked-receipt','l6-confirmation')), CHECK(evidence_type!='q0-case-manifest' OR subject_revision IS NOT NULL)) STRICT`、
参照tableは`cutover_evidence_refs(from_receipt_digest TEXT NOT NULL CHECK(length(from_receipt_digest)=64 AND from_receipt_digest NOT GLOB '*[^0-9a-f]*'), to_receipt_digest TEXT NOT NULL CHECK(length(to_receipt_digest)=64 AND to_receipt_digest NOT GLOB '*[^0-9a-f]*'), edge_kind TEXT NOT NULL CHECK(length(edge_kind)>0), ordinal INTEGER NOT NULL CHECK(ordinal>=0), UNIQUE(from_receipt_digest,edge_kind,ordinal)) STRICT`
を正本とする。writerは
`CREATE UNIQUE INDEX uq_cutover_q0_manifest_subject ON cutover_evidence_objects(subject_revision) WHERE evidence_type='q0-case-manifest'`
も正本DDLとして作成する。`subject_revision`はnullable GitObjectId canonical textだがCaseManifestではNOT NULL相当CHECKとする。
同digest insertだけを冪等成功とし、同subject別digestのUNIQUE violationをfail-closeする。
JSON validity、typed decode、schema literal、GitObjectIdはinsert前とread後の双方で検証する。
versioned migrationはadditive可能な変更だけ`ALTER`し、constraint変更はtransaction内でcanonical new tableを作り、既存`evidence_type`全rowをdecode/validateしてcopyし、
row countと全receipt/object digest一致を照合後にrename swapしてpartial indexを作る。unknown/null、decode、
copy、count/digest、rename/indexのどこかが失敗すれば全rollbackする。fresh/migrated schemaは同一とする。
decoded typed union kindとDB `evidence_type`のexact equalityをinsert/read双方で要求する。
projection rebuildはcutover DBのsingle read transaction snapshotからstaging generationへ全投影し、
complete marker後だけprojection側でatomic publishする。並行appendは次generationへ送り世代混在を0とし、
canonical DBは不変とする。
`PRAGMA journal_mode=WAL`、`PRAGMA synchronous=FULL`のconnectionで`BEGIN IMMEDIATE`し、
evidence/receipt insert後の更新SQLは
文`UPDATE cutover_chain_heads SET head_digest=?, head_sequence=?, version=version+1 WHERE chain_id=? AND head_digest IS ? AND head_sequence=? AND version=?`
を実行する。affected rowがexactly 1でなければ
全insertをrollbackして`cutover-write-conflict`、retry 0とする。genesisは事前作成した
seedは`{head_digest:null,head_sequence:0,version:0}`、first transition receiptはsequence 0、CAS後headは
`{digest,head_sequence:0,version:1}`とする。以後next receipt/head sequenceはN+1で、NULL復帰とdouble genesisを拒否する。
append前に同一transactionで`head_sequence == MAX(cutover_transition_receipts.sequence)`かつ
`head_digest == MAX sequence rowのreceipt_digest`を検証する。
receipt 0件かつnull headのgenesisだけを例外とし、gap/driftは全rollbackする。
commit成功をWAL/fsync barrier完了とし、その後だけreceiptを返す。process crash又はcommit errorはrollbackし、
head/receipt/evidenceが部分可視にならない。抽象in-memory lockや別DBをproduction証拠にしない。

cutover DBは独自migration registryと`user_version`を所有するcanonical sourceである。
`.ut-tdd/harness.db`はrebuildable projectionだけ、`.ut-tdd/ledger/harness-ledger.db`はPLAN ledgerだけを所有する。
projection writerはcutover DBをread-onlyで読み派生viewを再生成できるが、
docs/git/logからledger receiptを再発行又は上書きしない。backupはSQLite online backup APIで一貫snapshotを作り、
head digest/versionとbackup digestを別receiptへ封印する。recoveryはtrusted backupのintegrity check、
schema version、head chain全検証後のatomic file replaceだけを許し、projection sourceからの復元を拒否する。
migrationはbackup完了後の`BEGIN IMMEDIATE`内でadditive DDL+全chain検証+`user_version`更新をatomic実行し、
失敗時rollback、未知newer version/downgradeをfail-closeする。

## 付録 D: Resource Kernelワイヤ・カストディ内部処理 (PLAN-L5-25)

本節は`PLAN-L4-32`をL5へ降下し、`L8-integration-test-design.md`の
`IT-RGK-PHYS-001..026`と対を成す。Node control planeはdomain/policy/journal/receipt sealを所有し、
Rust companionはstrict wireとprivileged OS custody factだけを所有する。両者に同じpolicy reducerや
journalを置かない。新規Bun runtime/API/test pathは永久禁止する。

### D.1 厳格ワイヤ処理

Node `CustodyClient`は署名済bundleから絶対pathのcompanionを選び、shellを介さないargv、bounded stdin/stdout、
absolute deadlineで起動する。frameは4-byte big-endian length + UTF-8 JSON一件で、unknown/missing/duplicate field、
unknown enum、oversize、partial frame、末尾byteを拒否する。stdoutはprotocol専用、diagnosticはbounded stderrへ分離する。
request/responseは`protocol_version + request_id + expected_bundle_digest`を照合し、別requestの応答を合成しない。
wire commandはlauncherを持たない`ProbeRequest`とsealed `AdmissionToken`必須の`ExecuteRequest`へ分離する。
probe factをjournalへappendしtokenへ結ぶまでmanaged rootを生成せず、responseは`control_process_created`と
`managed_root_created`を別identity/phaseで返す。空required capabilityやhandshake成功をexecute許可にしない。

### D.2 カストディ・ライフサイクル

`absent → prepared → attached_suspended → running → terminating → empty_proven → released`だけを合法とする。
Windowsはsuspended create後にJob assignが成功するまでresumeしない。Linuxはuser code開始時点からtarget cgroupに属し、
事後attachをhard custodyとして受理しない。root exitはterminalではなく、Job emptyまたは`populated=0`とreap証拠が揃って
初めて`empty_proven`となる。client/launcher crash後もcustodian/brokerがdeadlineとtree custodyを保持する。
custody authorityはepoch/attempt/nonce/deadline/policy digestをdurable化し、OS custodyへのatomic handoff commit前は
resume/execを禁止する。WindowsはJob handle境界、Linuxはbroker外durable deadline ownerがNode/companion切断後も
terminate→empty/reapを遂行する。Linux ownerはmanaged root開始前にarmし、broker+通常recovery supervisorのdual crash後も
期限内`cgroup.kill`→bounded recovery→`populated=0`・zombie 0・managed orphan 0まで閉じる。
ownerを強制不能なら開始前拒否し、欠測findingや`custody_failure`だけで既存workloadの生存を代替しない。

### D.3 ポート/障害境界

Rust portは`probe/createCustody/spawnAttached/resume/observe/terminateTree/proveEmpty/release`を提供し、OS factだけを返す。
Nodeはfactをappend-only journalへ保存してterminal receiptを封印する。bundle/protocolの静的不一致はcontrol process起動前、
unsupported・権限不足・probe不一致はmanaged root生成前にfail-closeし、Node直spawn、Bun経路、PID polling、soft limitへfallbackしない。
companion crash、client crash、SCM/broker crash、pipe切断、journal commit失敗を独立に注入できなければL5 freeze未達とする。

### D.4 バンドル/ロールバック

target別companion binary、versioned protocol descriptor、SBOM、manifest署名、D0-N generation receipt digestだけを
companion bundleへ固定する。Node runtime、Node core、generation artifact、activation markerはD0-Nの所有であり、
D0-R bundleへ複製しない。実行時download、PATH探索、未検証companionへの差替えを禁止する。

`TrustDecisionPort`はbundle外のversioned installer/release policyでcanonical manifestを判定し、
decision digestを返す。TS側は`bundle_sequence + manifest_digest + trust_decision_digest +
d0n_generation_receipt_digest`のaccepted factをdurableにcompare-and-advanceし、floor未満、同sequence別payload、
port欠測をfail-closeする。SQLite、PKI、rotation/revocation、secure clock、re-anchorの物理方式はD0では固定しない。

旧componentへ戻す場合も旧manifestは再利用しない。現在floorより大きい新sequenceで、旧componentと現在互換な
D0-N receiptを再review・再署名し、通常のL8/L9 oracleを再通過したmanifestだけを受理する。
受理不能なら旧direct-spawnへ戻さず利用停止する。
