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
issue: 1360
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
type PairDoc = { path: string; layer: string | null; pairArtifact: string | null; pairTargetExists?: boolean }
type PairOrphan = { path: string; reason: "pair-missing" | "ref-unresolved" | "trace-orphan" | "design-uncovered"; detail: string }
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
  # rule 4 design-uncovered / rule 5 右 pair_artifact の実在: §8
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
- §8 の規則 4・5 も同じ実 repo ガード (`orphans == []`) で締める。
- §8 の規則 4・5 も同じ実 repo ガード (`orphans == []`) で締める。
- 純関数 + 実 repo ガードのみ。新 hook 不要 (governance-enforcement / backfill-pairing と同方式)。

## §7 検証タイミングの機械発火 (IMP-068、PLAN-L6-11 / L7-12)

> pair-freeze lint (§1-§6) の status 集計を **V-model 層群**単位に拡張し、**検証ロードマップの「いつ検証するか」を人の記憶でなく V-model 構造で機械発火**させる (崩れ防止の全体調整)。

### §7.1 検証発火単位 (層群)

`VERIFICATION_GROUPS` = **L0-L3 (上流: 要求〜要件) / L4-L6 (設計: 基本〜機能) / L0-L6 (全設計層) / L0-L7 (左腕+谷、実装検証サイクルゲート)**。L0 = 価値検証で design doc なし、L7 は実装 band として PLAN-L7-43 で追加 (freeze 判定は他の層群と同じ §7.2 の条件のみ)。

### §7.2 freeze 完了判定 (発火条件)

- 層群の全 design sub-doc が **draft 0 かつ pair 孤児 0 かつ confirmed ≥ 1** → **freeze 完了 (検証サイクル発火可)**。
- **placeholder は park (意図的保留、例: L2 screen track の G2 DEFER) として発火を妨げない** (A-100 の L0-L3 core freeze と整合)。
- draft (未着手/作業中) が 1 件でもあれば **Forward 進行中** (検証発火しない = 定常)。
- **L0-L7 を含む全層群の freeze は、上記の設計文書の状態 (draft 0 かつ pair 孤児 0 かつ confirmed ≥ 1) だけで判定する**。automation PLAN の status / review_evidence / generates を freeze の条件にしない。
- L0-L7 に automation PLAN の証跡を求めていたのは、導入時の一度きりの bootstrap 条件である。この条件は `ec6bb2185295f769bf420e2f353750d26f310f0d` の時点で満たされている (必須とした PLAN はすべて `status: confirmed`、review_evidence と generates を持つ)。当時の証跡は #1165 (A1) の固定 SHA 読み取り専用 archive に残るので、以後 freeze 判定からは参照しない。

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

## §8 被覆と右腕の実在 (#1019 方針 (a)、#1078 の検査漏れ 2 件)

§2 の rule 1〜3 は、左 (設計) の文書から右 (test-design) へ向かう検査だけである。このため、右の `pair_artifact` が実在しない path を指していても、左の文書のどれかがその右の文書を指さない限り検出されない。また、dir を `pair_artifact` に持つ右の文書は「その dir の文書を 1 本も名指ししなくても」成立してしまう。本節は、新しい文書や見出しの規約を作らずに、この 2 つを既存の `analyzePairFreeze` の規則として足す。

**規則 4 (被覆、`design-uncovered`)**: `isDesignSubDoc` を満たす左の文書 D は、次のどちらかで被覆される。どちらも満たさない D は `design-uncovered` 孤児とし、`path` に D、`detail` に期待する右の文書の形 (`pair_artifact: <D>` または `pair_artifact: <dir(D)>` の文書が D を名指しすること) を書く。

- (a) 右の文書で `pair_artifact == D` (path の完全一致、dir 表記の末尾 `/` は無視) のものがある。
- (b) 右の文書で `pair_artifact == dir(D)` のものがあり、その文書の内容が D を名指しする。名指しは **repo 相対 path の部分文字列一致を優先**する。path が無く basename だけの言及は、その basename が `isDesignSubDoc` を満たす左の文書の中で一意なときに限り、D の名指しとして認める。一意でない basename (`functional-requirements.md` は L1 と L3 にある) は path でしか名指しにならず、basename だけの言及はどちらの D も被覆しない。dir が違う右の文書が名指ししても被覆にならない。

名指しの判定は、既存の `l8-coverage-missing` と同じく、右の文書の内容全体に対する部分文字列一致とする (frontmatter・フェンス・語境界の除外は設けない。frontmatter・フェンス・語境界をすべて除外すると、未被覆が 4 本から 25 本へ増える。実測)。この甘さ (`plan-screen-list.md` が `screen-list.md` を名指しと数えうる) は、本節では許容し、厳格化は別の論点とする。basename の fallback は、既存の右の文書が basename で書かれていることを認める移行措置であり、path 表記への書き換えを妨げない。

**既存の `l8-coverage-missing` の扱い**: `lintForwardFreezeContract` の L8 と L5 の検査 (L8 test-design が `REQUIRED_L5_VERIFICATION_DOCS` の basename を名指しするか) は、規則 4 (b) の特殊ケースである。reason の名前 `l8-coverage-missing` は**変えず残す** (`ForwardFreezeContractViolation` の union、`checkForwardFreezeContract` の出力と既存テストの oracle が参照するため)。検査の実体は規則 4 の判定関数を共有し、入力 (対象の L5 の文書の集合と L8 の文書) と出力 (reason / detail に basename) は従来と同じにする。`REQUIRED_L5_VERIFICATION_DOCS` の固定リストは、規則 4 が L5 全体を被覆するので、固定である必要が無くなった時点で別の PR で外す (本節の範囲外)。

**規則 5 (右の `pair_artifact` の実在、`ref-unresolved`)**: 右の文書 (`docs/test-design/` 配下の全 `.md`) のうち `pair_artifact` を持つものは、その値が次のいずれかを満たす。満たさないものは `ref-unresolved` 孤児とし、`path` に右の文書、`detail` に値を書く (rule 2 の reason を右の文書へ広げる)。

- repo の実在 path (file または dir)。
- アーカイブ表記 `plans-archive-<YYYYMMDD>:<path>`。git の tag `plans-archive-<YYYYMMDD>` が実在し、その tag の tree に `<path>` の blob が実在すること (`git cat-file -e <tag>:<path>`)。

アーカイブ表記は、**形式の確認だけにせず tag と blob の解決まで確かめる**。形式だけでは、path の綴りの誤りと tag の取り違えという、実在しない path を指す検査漏れと同じ種類の欠陥が通ってしまう。解決の費用は右の文書 1 件につき `git cat-file` 1 回で、現状のアーカイブ参照は 7 件、tag は固定 SHA の不変参照である。tag が取得されていない clone (shallow、`--no-tags`) では解決できず fail-close になる。実装 PR は、`harness-check` が tag を取得する前提を確かめる。`analyzePairFreeze` は純関数のまま保つため、実在の判定 (fs と git) は `loadPairDocs` が行い、結果を `PairDoc.pairTargetExists` に載せて渡す (§1 の型。`pair_artifact` が無い文書は未設定)。

**規則 6 (走査の向き)**: 規則 4 は左から、規則 5 は右からの走査である。規則 5 の対象は、左のどの文書にも指されていない右の文書を含む、`docs/test-design/` 配下の全 `.md` とする (現状 `docs/test-design/` 配下の `.md` は `docs/test-design/harness/**` だけで、`loadPairDocs` が既に読む)。`pair_artifact` を持たない右の文書 (現状 43 本の L7 の topic 文書など) は規則 5 の対象外であり、孤児にしない。右の文書に `pair_artifact` を必須にするかは、本節では決めない。

**実測 (2026-11-04、origin/main `19bd86908`)**: 対象の左の文書 (L1〜L6 の設計 .md、README と roadmap を除く) は 85 本、右の文書は 82 本 (うち `pair_artifact` を持つもの 39 本)。規則 4 で被覆されない左の文書は、basename の fallback を認めると **4 本** (`L1-requirements/vmodel-upgrade-requirements.md`、`L3-functional/screen-functional.md`、`L3-functional/upstream-schedule-reconciliation.md`、`L4-basic-design/ui-standard.md`)、path の一致だけにすると 28 本 (上の 4 本と、L2 の 5 本と L6 の 19 本が basename でしか名指しされていない)。規則 5 で実在しない右の `pair_artifact` は **2 本** (`L7-issue-binding-projection-state-test-design.md` → `docs/plans/PLAN-L7-690-...`、`L7-plan-revision-digest-query-test-design.md` → `docs/plans/PLAN-L7-722-...`。どちらも #1078 A6 の付け替え対象)。アーカイブ表記の 7 本は tag と blob が解決する。
