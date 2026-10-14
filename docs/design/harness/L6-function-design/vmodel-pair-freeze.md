---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_vmodel_pair_freeze
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-06-05
plan: docs/plans/PLAN-L6-10-vmodel-pair-lint.md
---

# vmodel pair-freeze lint — 機能設計 (① / PLAN-L6-10、IMP-067)

> **V-pair**: `pair_artifact = L7-unit-test-design.md §1.13` (L6↔L7)。DbC 契約から単体テスト oracle (U-VPAIR-*) を導出。

## §0 スコープ

`src/vmodel/lint.ts` stub のうち **設計層 pair freeze 検証** = design doc ⇔ test-design doc の `pair_artifact` 双方向整合・孤児0。function-spec §4 の rule 1 `pair-exists` / rule 2 `ref-resolves` / rule 3 `trace-bidir` の最小インスタンス化。G1-G6 各層の pair freeze を機械担保し、requirements §6.8.3 (設計 PLAN 完了 PR で `vmodel-lint` 必須) に接続する。

**スコープ外**: G7 の 4 artifact 12 directed edge trace (`traceCheck`、function-spec §2.3 / requirements §2.4)。これは L7 trace freeze の別マイルストーンで、本 lint は設計層 (① 設計 ⇔ ③ テスト設計) の pair のみを見る。

## §1 関数仕様 (signature + DbC)

| 関数 | signature | pre | post |
|---|---|---|---|
| `loadPairDocs` | `(root?: string) => PairDoc[]` | root 省略時カレント repo | `docs/design/harness/**` + `docs/test-design/harness/**` の全 `.md` の frontmatter (path/layer/pair_artifact) を読む。read-only |
| `analyzePairFreeze` | `(docs: PairDoc[]) => PairFreezeResult` | docs は loadPairDocs 出力 | `{ok, orphans[], pairs}`、純関数 (I/O なし)、orphan 0 で ok=true |
| `pairFreezeMessages` | `(r: PairFreezeResult) => string[]` | — | 人間可読の文言 (孤児なし→"OK"、孤児あり→reason 別文言) |
| `lintVmodel` | `(path?: string) => LintResult` | 同 function-spec §1.3 | 本実装: loadPairDocs→analyzePairFreeze→pairFreezeMessages。孤児で ok=false |

### 型

```
type PairDoc = { path: string; layer: string | null; pairArtifact: string | null }
type PairOrphan = { path: string; reason: "pair-missing" | "ref-unresolved" | "trace-orphan"; detail: string }
type PairFreezeResult = { ok: boolean; orphans: PairOrphan[]; pairs: number }
```

## §2 検査ロジック (pseudocode)

```
function analyzePairFreeze(docs):
  designDocs = docs.filter(d => d.path startsWith "docs/design/harness/" and inScope(d))
  byPath     = index docs by path
  orphans = []
  pairs   = 0
  for d in designDocs:
    pa = d.pairArtifact
    # rule 1 pair-exists
    if pa is null:        orphans.push({d.path, "pair-missing", "layer "+d.layer}); continue
    # rule 2 ref-resolves ("self" は byPath 解決に失敗し ref-unresolved 孤児になる — 例外分岐なし)
    target = byPath.get(pa)
    if target is null:    orphans.push({d.path, "ref-unresolved", pa}); continue
    # rule 3 trace-bidir
    if pa startsWith "docs/test-design/":
        back = target.pairArtifact                                # test-design は dir 集合参照
        if back is null or not dirOf(d.path).startsWith(stripTrailingSlash(back)) and not back == dirOf(d.path):
            orphans.push({d.path, "trace-orphan", "test-design が "+dirOf(d.path)+" を逆参照しない"})
        else: pairs++
    else: orphans.push({d.path, "ref-unresolved", "未知の pair 形式: "+pa})
        # design→design 参照 (旧 L2 group hub) は非対応 (PLAN-RECOVERY-09 で self-pair 例外と共に撤去)
  return { ok: orphans == [], orphans, pairs }
```

## §3 対象選定規約 (inScope)

- **対象** = `docs/design/harness/L{1..6}-*/​*.md` のうち frontmatter に `layer ∈ {L1..L6}` を持つ **設計 sub-doc**。
- **除外** (検査対象外、孤児にしない):
  - **index doc** = basename `README.md` (sub-doc を束ねる親 index で、自身は pair を持たない)。
  - **living doc** = `roadmap.md` (検証/改善 anchor、freeze 対象外 = pair を持たない companion)。
  - 除外は **basename 固定リスト** (`README.md` / `roadmap.md`) で判定 (frontmatter フラグに依存しない明示規約)。
- **self-pair / L2 group hub は撤去済み (PLAN-RECOVERY-09、2026-07-07)**: 旧規約 (IMP-039/058
  「wireframe mock 自体が③ペア、L10 独立 doc 不要」) は PO 裁定なき作り込みで、欠落を lint から
  隠す例外だったため撤去。L2 sub-doc は全て `docs/test-design/harness/L10-ux-validation-test-design.md`
  を直接参照する (rule 3 双方向の正規形)。`self` および design→design 参照は `ref-unresolved` 孤児。
- **③ doc の命名標準 (PLAN-RECOVERY-09、機械検査 = doctor `test-design-naming`)**:
  `docs/test-design/harness/` 直下は `L<右腕層>-<kebab>-test-design.md` (右腕層 = L7 谷/L8/L9/
  L10/L12/L14) のみ許可し、frontmatter `executed_at_layer` は filename 層と一致必須。左腕層命名の
  再流入と標準外 doc の無断追加は fail-close (明示許可: README.md / proposal-document-coverage-routing.md)。
- test-design 側の `pair_artifact` は **ディレクトリ集合参照** (例 `docs/design/harness/L4-basic-design/`) で、design sub-doc の所在 dir を含めば双方向成立。
- **ルート直下 doc** = `docs/design/harness/<file>.md` (例: 移行 stub `L1-business-requirements.md` = `# (moved)`) は **2 階層 sub-doc でない**ため対象外。`designLayerFromPath` は `L<N>-<topic>/<file>.md` の **2 階層構造のみ**マッチする (ルート直下 stub の暗黙除外。stub 自体の整理は別途 carry)。
- **検算 (実 repo)**: regex マッチ 33 − EXCLUDED 3 (L2/L3 の `README.md` ×2 + `roadmap.md` ×1) = 検査対象 30 = 双方向成立 30 pair (孤児0)。全対象が pair 成立 = 見逃し0。

## §4 function-spec §4 rule との対応 (忠実性)

| 本 lint の検査 | function-spec §4 rule | 忠実性 |
|---|---|---|
| pair-missing | rule 1 `pair-exists` (設計 doc に pair が存在) | layer L1-L6 sub-doc に pair_artifact 必須 (requirements §436) |
| ref-unresolved | rule 2 `ref-resolves` (path 参照が repo 内実在) | byPath 解決失敗 = 不実在 |
| trace-orphan | rule 3 `trace-bidir` (A→B に B→A 逆参照、孤児0) | test-design dir 集合参照の双方向 |

> 本 lint は IMP-033 クロスチェックエンジン (10 rule 汎用形) の **pair 系 3 rule の先行実装**。汎用 rule registry への吸収は IMP-033 本実装時 (Phase 後続)。

## §5 既存 lint との非重複境界

| 既存 | 検査軸 | 本 lint との関係 |
|---|---|---|
| `doc-consistency` | carry 整合 / 画面ID実在 / NFR件数 | 軸が異なる (pair_artifact 双方向を見ない) = 非重複 |
| `backfill-pairing` | Reverse 孤児 / §6 用語→§10 glossary | 駆動モデル back-fill であり pair_artifact 双方向は対象外 = 非重複 |
| `g3-trace` (§H) | L1↔L14 OT 量閉じ (BR/UX → OT-*) | trace 内容 (ID 被覆) であり frontmatter pair リンクは対象外 = 非重複 |

## §6 実 repo ガード方針

- `tests/vmodel-pair.test.ts` で **実 repo 完全性回帰** (`analyzePairFreeze(loadPairDocs()) ⇒ orphans == []`) を CI vitest ベクトルに乗せ fail-close。
- `runDoctor` に `checkPairFreeze` を **hard/fail-close** で配線 (`pairFreeze.ok` を `runDoctor.ok` に連動)。
- 純関数 + 実 repo ガードのみ。新 hook 不要 (governance-enforcement / backfill-pairing と同方式)。

## §7 検証タイミングの機械発火 (IMP-068、PLAN-L6-11 / L7-12)

> pair-freeze lint (§1-§6) の status 集計を **V-model 層群**単位に拡張し、**検証ロードマップの「いつ検証するか」を人の記憶でなく V-model 構造で機械発火**させる (崩れ防止の全体調整)。

### §7.1 検証発火単位 (層群)

`VERIFICATION_GROUPS` = **L0-L3 (上流: 要求〜要件) / L4-L6 (設計: 基本〜機能) / L0-L6 (全設計層) / L0-L7 (左腕+谷、実装検証サイクルゲート)**。L0 = 価値検証で design doc なし、L7 は実装 band として PLAN-L7-43 で追加。

### §7.2 freeze 完了判定 (発火条件)

- 層群の全 design sub-doc が **draft 0 かつ pair 孤児 0 かつ confirmed ≥ 1** → **freeze 完了 (検証サイクル発火可)**。
- **placeholder は park (意図的保留、例: L2 screen track の G2 DEFER) として発火を妨げない** (A-100 の L0-L3 core freeze と整合)。
- draft (未着手/作業中) が 1 件でもあれば **Forward 進行中** (検証発火しない = 定常)。

### §7.3 関数

| 関数 | signature | post |
|---|---|---|
| `loadPairDocs` (§1 拡張) | `(root?) => PairDoc[]` | `status` フィールドを追加で読む |
| `analyzeVerificationGroups` | `(docs, orphans) => GroupReadiness[]` | 層群ごとに confirmed/draft/placeholder/孤児を集計 + frozen 判定 (純関数) |
| `verificationGroupMessages` | `(groups) => string[]` | freeze 完了 (park 表示) / Forward 進行中 の surface |
| doctor `checkVerificationGroups` | `(repoRoot) => string[]` | hard/fail-close surface (`verificationGroups.ok` は doctor.ok 連動) |

### §7.3.1 FR test-perspective alias の定義

| Function | Signature | 前提 | 事後 | 不変条件 | oracle |
|---|---|---|---|---|---|
| `analyzeTestPerspectiveGate` | analyzeTestPerspectiveGate(input: TestPerspectiveInput, deps: TestPerspectiveDeps) => TestPerspectiveResult | design/test-design pair docs と declared test viewpoints を与える。 | layer ごとの missing / duplicate test perspective coverage を返す。 | required test viewpoint が欠ける場合、pair presence だけでは不十分とする。 | U-FR-L1-21 |

### §7.4 「機械発火」の範囲

surface まで (doctor が「層群 X freeze 完了 → 検証サイクル発火可」を機械的に告げる)。**検証 PLAN の起票は人間トリガー** (concept §2.6 signal→mode と同じく、機械は提示・人間が起票)。検証サイクルの自動起票は後続 carry。

## §8 Forward freeze contract (L2 prototype 合意 / L5 検証設計の被覆、PLAN-L6-48 / PLAN-L7-393 / VMS-010)

> 本節は pair-freeze lint (§1-§7) の隣に置く別契約で、L2 画面の prototype 合意と L5 詳細設計の L8 検証設計を、
> L3 凍結・実装着手の前提として機械検査する。実装は `src/vmodel/lint.ts` の `analyzeForwardFreezeContracts` /
> `forwardFreezeContractMessages` と doctor full profile の `forward-freeze-contracts` check。oracle は L7 の
> `U-FREEZE-CONTRACT-001..004` (TVMS-010 / TVMS-011)。

### §8.1 検査対象と条件

| 対象 | 条件 | 違反 reason |
|---|---|---|
| L2 screen 6 件 (`business-flow` / `screen-detail` / `screen-flow` / `screen-list` / `ui-element` / `wireframe`) | `status=confirmed`、`pair_artifact=docs/test-design/harness/L10-ux-validation-test-design.md`、`next_pair_freeze=L10`、本文か status に G2 / PO / サインオフ / 合意 / prototype 等の合意 marker | `l2-doc-missing` / `l2-status-not-confirmed` / `l2-pair-mismatch` / `l2-next-freeze-mismatch` / `l2-prototype-evidence-missing` |
| L5 detailed-design 5 件 (`if-detail` / `internal-processing` / `module-decomposition` / `physical-data` / `ui-detail`) | `status=confirmed`、`pair_artifact=docs/test-design/harness/L8-integration-test-design.md`、`next_pair_freeze=L8` | `l5-doc-missing` / `l5-status-not-confirmed` / `l5-pair-mismatch` / `l5-next-freeze-mismatch` |
| L8 integration test design | `status=confirmed`、`pair_artifact=docs/design/harness/L5-detailed-design/`、frontmatter `executed_at_layer=L8`、L5 5 件の basename をすべて本文に含む (`ui-detail.md` も L5 の一部として L8 が被覆する)、`IT-ID / Given / When / Then` 表を持つ | `l8-test-design-missing` / `l8-test-design-not-confirmed` / `l8-pair-mismatch` / `l8-execution-layer-mismatch` / `l8-coverage-missing` / `l8-gwt-missing` |

### §8.2 不変条件

- L2 の placeholder / carry の存在だけでは prototype 合意の凍結とみなさない (合意 marker を必須にする)。
- L5 の pair frontmatter が緑でも、L8 側が GWT 表か L5 文書の被覆を欠けば検証設計は未整備とみなす。
- 検出器は設計差分を創作しない。対象 path は上の定数集合で固定し、正本は既存の design / test-design 文書から読む。

### §8.3 受け入れ条件

- doctor に `forward-freeze-contracts - OK (checked=12, l2=6, l5=5)` が現れる。
- L2 合意 marker 欠落、L8 被覆欠落、real repo green を `tests/vmodel-forward-freeze-contracts.test.ts` が検証する。
- typed spec 台帳 (`docs/governance/vmodel-typed-spec-definitions.md`) に VMS-010 / TVMS-010 が宣言元として現れる。
