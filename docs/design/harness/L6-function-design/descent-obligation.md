---
layer: L6
artifact_type: design_doc
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-06-12
plan: docs/plans/PLAN-L6-35-descent-obligation.md
traces: FR-L1-03
---

# descent-obligation ledger — 機能設計 (① / PLAN-L6-35、FR-L1-03 抜け漏れ検出)

> **V-pair**: `pair_artifact = L7-unit-test-design.md §1.22 (U-DESC-001〜008)` (L6↔L7)。DbC 契約から単体テスト oracle (U-DESC-*) を導出。
> **trace key**: `FR-L1-03` (V字双方向 trace、設計⇔テスト設計ペア確認、抜け漏れ検出, P0)。新 FR 採番せず既存 FR の降下不足を埋める。

## §0 スコープ — なぜ pair-freeze だけでは落ちるか

`pair-freeze` (`vmodel-pair-freeze.md §2`) は **存在する design sub-doc を駆動** (`designDocs = docs.filter(...)`) して各 doc の `pair_artifact` 双方向を検証する **document-driven** 方式である。これは「在る doc の link が正しいか」は見るが、「**在るべき下流/pair 成果物が無い**」を検出できない (`pair_artifact` 宣言の無いホップ・`explicit_l7_defer` のホップは loop に入らず、edge も孤児も出ない = **absence-blindness**)。

A-136 後の skill 片肺 (`src/skills/recommend.ts` + テストコード着地済だが L6 単体テスト設計が不在) は、この absence-blindness ゆえに `pair-freeze` / `impl-plan-trace` (src→PLAN ID 被覆) / `oracle-test-trace` (oracle→test コード citation) を全て素通りした。

本 lint は検査の向きを反転する: **上流 (要件 FR registry) + 層隣接 obligation matrix から「存在すべき下流/pair 成果物の集合」を生成し、不在を fail-close** する。降下鎖 `要求 L1 → 要件 L3 → 基本 L4 → 詳細 L5 → 機能 L6 → 実装 L7 ⇔ 単体テスト設計` の各ホップで「上流が在るなら下流が在るべき」を機械生成し、`document-system-map.md §重要(4)` の「pair 未充足を DB 側で fail-close 検知する」意図を実体化する。

**スコープ外**: G7 の 4 artifact 12 directed edge trace (`traceCheck`、function-spec §2.3) と change-impact 波及 (`relation-graph.ts analyzeRelationImpact`)。本 lint は **freeze 時点の降下完全性** (各 trace key の鎖が層を取りこぼさず揃っているか) のみを見る。lint 実装 / harness.db `descent_obligations` projection / doctor 配線は L7 (別 add-impl PLAN)。

## §1 関数仕様 (signature + DbC)

L6 contract marker — inline signature (関数 = 単体テスト設計粒度、oracle = U-DESC-001〜008):

- `loadDescentAdjacency(root?: string) => DescentAdjacency`
- `loadTraceKeyedArtifacts(root?: string) => TraceKeyedArtifact[]`
- `loadDeferLedger(root?: string) => DeferEntry[]`
- `generateObligations(artifacts: TraceKeyedArtifact[], adjacency: DescentAdjacency) => Obligation[]`
- `analyzeDescentObligations(artifacts: TraceKeyedArtifact[], adjacency: DescentAdjacency, defers: DeferEntry[]) => DescentResult`
- `descentObligationMessages(r: DescentResult) => string[]`

各関数の pre/post (DbC) は次表。oracle は U-DESC-* (L7-unit §1.22) と 1:1:

| 関数 | signature | pre | post |
|---|---|---|---|
| `loadDescentAdjacency` | `(root?: string) => DescentAdjacency` | root 省略時カレント repo | 層隣接 obligation rule 集合 (descent + pair) を SSoT (`document-system-map.md §1` 機械データ / 専用 `descent-adjacency` テーブル) から読む。read-only |
| `loadTraceKeyedArtifacts` | `(root?: string) => TraceKeyedArtifact[]` | root 省略時カレント repo | requirements / design / test-design / source / test を走査し `(traceKey, layer, role, path, status)` を抽出。trace key = frontmatter `traces:` または FR-id 命名規約。read-only |
| `loadDeferLedger` | `(root?: string) => DeferEntry[]` | root 省略時カレント repo | open defer (`explicit_l7_defer` / `placeholder_deps`) を `(traceKey, fromLayer, waitingLayer, waitingSpec, dischargeCondition, owner)` で返す。read-only |
| `generateObligations` | `(artifacts: TraceKeyedArtifact[], adjacency: DescentAdjacency) => Obligation[]` | artifacts=loadTraceKeyedArtifacts 出力 | **核心**: 各 trace key × present artifact から「必須下流/pair 成果物」を adjacency rule に従い**生成**。純関数 (I/O なし)。下流の自己宣言に依存しない (上流駆動) |
| `analyzeDescentObligations` | `(artifacts: TraceKeyedArtifact[], adjacency: DescentAdjacency, defers: DeferEntry[]) => DescentResult` | 上記 3 入力 | obligation を satisfied / deferred / unmet に分類 + impl-ahead 違反 + trace key 単位 chain サマリを返す。純関数。unmet (有効 defer 無し) > 0 または impl-ahead > 0 で ok=false |
| `descentObligationMessages` | `(r: DescentResult) => string[]` | — | 人間可読 (全充足→"OK"、unmet / impl-ahead → reason 別文言 + 該当 trace key/layer) |

> doctor 配線 `checkDescentObligation` (副作用端点 = load×3 → analyzeDescentObligations → messages) は純関数群と責務が異なるため §6 実 repo ガード方針で扱う (vmodel-pair-freeze.md の §1 純関数 / §6 doctor 分離に合わせる、M-2)。

### 型

```
type Layer = "L0"|"L1"|...|"L14"
type ArtifactRole = "requirement" | "design" | "test-design" | "source" | "test"
type ArtifactStatus = "active" | "park" | "defer" | "placeholder"
type DescentRuleKind = "descent" | "pair" | "impl-guard"  # 左腕降下 / 右腕 V-pair / impl-ahead 専用 (M-1)
type ObligationCondition = "active" | "impl-present"  # 生成トリガ
type RuleFrom = Layer | "*"   # "*" = impl-guard 専用 sentinel (src/test 着地が起点、特定 Layer に紐づかない、M-1)

type DescentAdjacency = { rules: AdjacencyRule[] }
type AdjacencyRule = { from: RuleFrom; to: Layer; kind: DescentRuleKind; condition: ObligationCondition; note: string }

type TraceKeyedArtifact = { traceKey: string; layer: Layer; role: ArtifactRole; path: string; status: ArtifactStatus }
type DeferEntry = { traceKey: string; fromLayer: Layer; waitingLayer: Layer; waitingSpec: string; dischargeCondition: string; owner: string }

type Obligation = { traceKey: string; fromLayer: Layer; requiredLayer: Layer; kind: DescentRuleKind; reason: string }
type ObligationStatus = "satisfied" | "deferred" | "unmet"
type GradedObligation = { ob: Obligation; status: ObligationStatus }
type UnmetObligation = Obligation
type ImplAheadViolation = { traceKey: string; landedAt: Layer; undischarged: DeferEntry }
type ChainSummary = { traceKey: string; layers: Layer[]; complete: boolean; firstGap: Layer | null }
type DescentFinding = { traceKey: string; code: "untraceable" | "duplicate-key" | "invalid-defer"; detail: string }

type DescentResult = {
  ok: boolean
  graded: GradedObligation[]
  unmet: UnmetObligation[]
  implAhead: ImplAheadViolation[]
  chains: ChainSummary[]
  findings: DescentFinding[]
}
```

## §2 層隣接 obligation matrix (SSoT、document-system-map §1 由来)

降下 (左腕) と V-pair (右腕) を機械可読 rule に落とす。`condition` が生成トリガ:

| from | to | kind | condition | note |
|---|---|---|---|---|
| L1 | L3 | descent | active | 要求 FR が active なら要件 (FR-*/AC-*) が在るべき |
| L3 | L4 | descent | active | 要件が active なら基本設計が在るべき |
| L4 | L5 | descent | active | 基本設計→詳細設計 |
| L5 | L6 | descent | active | 詳細設計→機能設計 (関数仕様) |
| L6 | L7 | pair | active | **機能設計⇔単体テスト設計の V-pair (必然)**。pair-freeze と同義だが生成は上流駆動 |
| L5 | L8 | pair | impl-present | 詳細設計⇔結合テスト設計 (impl 着地時に必須化) |
| L4 | L9 | pair | impl-present | 基本設計⇔総合テスト設計 |
| L3 | L12 | pair | impl-present | 要件⇔受入テスト設計 |
| `*` (src/test) | L4..L7 | impl-guard | impl-present | **impl-ahead**: src が在るなら L4/L5/L6 設計 + L7 テスト設計が全て discharge 済であるべき。`from:"*"` sentinel = 起点が特定 Layer でなく impl 着地そのもの (M-1)。検出は §3 経路② |

> `condition: active` = 上流成果物が `active` (park/defer/placeholder でない) のとき obligation 生成。`condition: impl-present` = その trace key の source/test が存在するとき生成 (impl-ahead ガードの土台)。matrix は **単一正本** (現状 6 lint に暗黙分散している層隣接規則を集約)。

## §3 検査ロジック (pseudocode)

```
function analyzeDescentObligations(artifacts, adjacency, defers):
  findings = []
  # E1: trace key 健全性 — untraceable 成果物は finding に積み byKey grouping から除外 (I-2)。
  #     null/empty key グループを obligation ループに渡さない (unmet/implAhead に混入させない)。
  traceable = []
  for a in artifacts:
    if a.traceKey is null/empty: findings.push({traceKey:"", "untraceable", a.path})
    else: traceable.push(a)
  # E8: duplicate
  detect duplicate (traceKey, layer, role) collisions in traceable -> findings "duplicate-key"
  byKey = group traceable by traceKey

  graded = []; unmet = []; implAhead = []; chains = []
  for key, group in byKey:
    present = set(group.layer where status == "active")   # park/placeholder は active 扱いしない (E6)
    hasImpl = group has role in {source, test}
    obligations = generateObligations(group, adjacency)    # 上流駆動で必須集合を生成
    unmetLayers = set()                                    # I-3: 経路②の二重登録防止用
    for ob in obligations:
      # I-1: satisfied は active のみ (park/placeholder の stub を satisfied と詐称させない、E6 と統一)
      satisfiedBy = group has artifact at ob.requiredLayer with status == "active"
      if satisfiedBy:
        graded.push({ob, "satisfied"}); continue
      d = deferFor(defers, key, ob.requiredLayer)
      if d is present and (d.dischargeCondition empty or d.owner empty):  # E4: 無効 defer
        findings.push({key, "invalid-defer", ob.requiredLayer})          # I-4: invalid-defer finding を発火
        graded.push({ob, "unmet"}); unmet.push(ob); unmetLayers.add(ob.requiredLayer)
      elif d is present and not hasImpl:                  # E3/E5: 有効 defer ∧ impl 未着地のみ免責
        graded.push({ob, "deferred"})
      else:                                               # 不在・defer 無し / impl 着地済で defer 無効化 (E2/E5)
        graded.push({ob, "unmet"}); unmet.push(ob); unmetLayers.add(ob.requiredLayer)
    # E5: impl-ahead (経路② = obligation 非依存の全 defer scan)。obligation を emit しなかった層
    #     (例 condition 未充足) の取り残し defer も捕捉する。I-3: graded.unmet と排他にする。
    if hasImpl:
      for d in openDefers(defers, key) where d.waitingLayer in {L4,L5,L6,L7}:
        if d.waitingLayer not in unmetLayers:              # 二重登録防止 (exclusive)
          implAhead.push({key, landedAt = lowest src layer, undischarged = d})
    chains.push(summarizeChain(key, present, obligations))  # firstGap = 最初の unmet 層
  return {
    ok: unmet == [] and implAhead == [] and findings == [],
    graded, unmet, implAhead, chains, findings
  }

# deferFor: (key, layer) に対応する defer entry を返す (無ければ null)。有効性は呼び出し側で判定。
# openDefers: key の未 discharge defer 全件 (waitingLayer 別)。obligation 生成有無に依存しない (経路②)。
# generateObligations: 各 active artifact の layer から adjacency.rules を引き、condition (active /
#   impl-present) を満たす to-layer を Obligation として emit (下流の宣言を一切参照しない、上流駆動)。
```

## §4 edge case (→ U-DESC oracle 対応)

| # | ケース | 期待挙動 | oracle |
|---|---|---|---|
| E1 | trace key を持たない成果物 | `untraceable` finding (ok=false) | U-DESC-002 |
| E2 | 義務付けられた下流/pair が不在・defer 無し | `unmet` (fail-close) ← **skill 片肺の本体** | U-DESC-004 |
| E3 | 不在だが有効 defer (discharge条件+owner) あり・impl 未着地 | `deferred` (ok 維持) | U-DESC-005 |
| E4 | defer に discharge条件 or owner が欠落 | `invalid-defer` finding を発火し `unmet` 扱い (免責しない) | U-DESC-005 |
| E5 | src/test 着地済 + 設計/テスト設計 defer 未 discharge | `impl-ahead` 違反 (defer で免責しない、fail-close) ← **skill 片肺の核** | U-DESC-006 |
| E6 | 上流が park / placeholder | descent obligation を生成しない (pair-freeze park 規約と整合) | U-DESC-007 |
| E7 | reverse 方向 (src 先行 authoring) | obligation は方向非依存に生成。Reverse drive が上流 obligation を discharge | U-DESC-006/008 |
| E8 | 同一 trace key の重複・循環 | `duplicate-key` finding | U-DESC-002 |

## §5 既存 lint との非重複境界

| 既存 | 検査軸 | 本 lint との関係 |
|---|---|---|
| `vmodel pair-freeze` | **存在する** design doc の `pair_artifact` 双方向 (document-driven) | 本 lint は **上流駆動で在るべき pair を生成し不在を検出** (absence-detecting) = pair-freeze の一般化・非重複 (pair-freeze は本 lint の `kind=pair, condition=active` 部分集合の document-driven 近似) |
| `impl-plan-trace` | src → PLAN generates ID 被覆 | trace key の**層降下完全性**は見ない = 非重複 |
| `l6-fr-coverage` / `l6-completion` | FR → L6 登録**件数** | pair 実在 / impl-ahead / 不在 substance は見ない = 非重複 ([[feedback_coverage_not_substance]]) |
| `oracle-test-trace` | oracle → test **コード** citation | test-design **doc** の実在 (V-pair) は見ない = 非重複 |
| `relation-graph analyzeRelationImpact` | 変更 path の波及 (change-impact) | freeze 時点の降下完全性でなく変更時の波及 = 非重複 |

> 本 lint は relation-graph.ts の node/edge substrate (`requirement`/`design`/`test-design`/`source`/`test` node、`derives-from`/`pairs`/`generates`/`covered-by` edge) を再利用し、降下 edge (`refines` L_n→L_m) + obligation 生成器を上乗せする (再発明しない)。

## §6 実 repo ガード方針

- `tests/descent-obligation.test.ts` (L7) で **実 repo の現存 drop を回帰固定**: 導入時点で **skill subsystem の片肺 (FR-L1-47 系の L6 test-design 不在 / impl-ahead) が `unmet` / `impl-ahead` として surface される**ことをベクトル化 (Phase 0 = 既存 drop の一掃検出)。是正後はそのベクトルが 0 件へ収束する。
- 純関数 (load×3 = 副作用端点) + 実 repo ガード。新 hook 不要 (pair-freeze / module-drift と同方式)。
- `runDoctor` に `checkDescentObligation` を **hard/fail-close** で配線 (副作用端点 = load×3 → analyzeDescentObligations → messages → `runDoctor.ok`)。
- **hard 昇格完了 (機械判定、M-3)**: 実 repo で `analyzeDescentObligations` の `unmet==[] ∧ implAhead==[] ∧ findings==[]` が green のため、`runDoctor.ok` 連動 + G6/G7 freeze の hard ブロックへ切替済み。
- harness.db `descent_obligations` projection table (柱3 feedback、queryable) は L7 で追加。設計⇔実装⇔テストのズレを次サイクルへ返す。

## §7 段階導入 (崩れ防止)

- **Phase 0**: matrix SSoT + `analyzeDescentObligations` を実 repo に被せ、現存 drop (skill 片肺ほか) を一掃検出する。現在は doctor hard gate。
- **Phase 1**: trace key frontmatter (`traces:`) を全成果物に必須化 + obligation 生成を **hard gate** 化。
- **Phase 2**: defer ledger discharge + impl-ahead ガード + harness.db projection + G6/G7 freeze 配線。
