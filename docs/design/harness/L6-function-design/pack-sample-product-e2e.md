---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_pack_sample_product_e2e
pair_artifact: docs/test-design/harness/L7-pack-sample-product-e2e-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1276
---

> **L6 contract marker**: `validateSampleProductFixture(fixtureRoot, templates) => SampleProductFixtureValidation`、`installSampleProduct(tarPaths, readEntry, consumerRoot) => SampleProductInstall`、`classifySampleProductRun(manifest, outputs) => SampleProductResult` は unit-test-granularity contract である。DbC は §9 にまとめる。oracle は `docs/test-design/harness/L7-pack-sample-product-e2e-test-design.md` の `CANDIDATE-U-PACKSAMPLE-001〜012` が固定する。

# 見本 product 上で Pack の全 gate を流す E2E (issue #1276)

## 1. 目的と範囲

Pack#10 / #971 (G1 が画面 ID を `PM-` / `HM-` / `GD-` に固定) と Pack#11 / #972 (G3 がハーネスにしか無い
`business-detail.md` を必須で読む) は、ハーネス repo の中で gate を流しても原理的に見つからない。ハーネス repo には
ハーネスの ID と文書が全部あるからである。本書は、Pack を見本 product に入れた後で全 gate を流し、次の 2 種類の
欠陥を fail-close で拾う契約を固める (決定の出所: #961 comment 6356415105、親 #364)。

- 読む path の依存 (`required doc not created` 系の throw、縮退の分岐が無いこと)
- ハーネス固有の固定値 (ID の接頭辞、ハーネスの設計 root、ハーネスだけの見出し)

範囲の決め方:

- 新しい gate・doctor check・CLI command は作らない。`scripts/pack-canary-acceptance.mjs` の install phase と
  verify phase に step を 1 つずつ足す。
- 配送物の在庫の欠落は `docs/design/harness/L6-function-design/pack-delivery-inventory-diff.md` (#1275) が持つ。
  本書はそれに依存しないが、step の順序だけを §6 で決める。
- G1 / G3 の consumer 分岐そのもの (表の列からの ID 抽出、空集合の拒否、出力の形) は
  `docs/design/harness/L6-function-design/consumer-trace-gates.md` が持つ。本書は §8 の出力の形を読むだけで、
  分岐の規則を変えない。
- canary の agent E2E 経路 (`runAgentAuthoringAndGates`、tag `AGENT_E2E_TAG`) は対象外とする。この経路は
  `SC-001` を `PM-01` に写して G1 を通しており (`scripts/pack-canary-acceptance.mjs` の baseline 作成)、
  その通過は本書の合格の証拠にならない。

## 2. 方式判断

advisor 相談: `claude-fable-5-1` / decision `design` / 2026-10-23
(`.ut-tdd/logs/session/advisor-claude-1792727800660.jsonl`)。

| 論点 | 案 | 判定 |
| --- | --- | --- |
| fixture の置き場所 | A: source に tracked directory を置き、template との整合を source 側のテストで強制する | **採用** (場所と整合テスト) |
| | B: runner の mjs に定数で埋め込み、setup が書いた template の表に行だけ足す | 却下。runner が template の markdown 構造に結合し、G8〜G14 の証跡 file を行の追記で作れない |
| | C: Pack の tar に同梱する | **運搬経路として採用** (下記) |
| 合格条件 | #961 の 2 条件だけ | 却下。Pack#10 は throw ではなく `passed=false` の violation として出るので取りこぼす |
| | 2 条件 + gate ごとの `applicable=true` かつ `passed=true` + G1 / G3 の件数一致 | **採用** |

advisor の推奨は A で、運搬は install 時の引数 (`--sample-product <dir>`) だった。C は「publish record の契約に
手が入る」として却下されていた。実測で前提が違ったので、運搬だけ C に override する。

- 実測: `src/setup/distribution.ts` の `CLEAN_ALLOW_PREFIXES` は `tests/` を含む。`tests/fixtures/` 配下の
  tracked file は、いまも clean Pack artifact に入る。tar の digest は既に publish record が束縛しているので、
  publish record の schema と `canaryAssetsForTag` は変わらない。
- 引数で渡すと source checkout が install の入力になり、「release directory と publish record だけを入力にする」
  canary の前提が崩れる。tar から取り出せばこの前提を保てる。

advisor の付けた条件は次のとおり契約に入れる。

1. fixture の各文書の見出しの骨格を、出荷する vmodel template と一致させる (§3.3、source 側のテスト)。
2. fixture に絶対 path とハーネスの設計 root (`docs/design/harness/` / `docs/test-design/harness/`) を書かない (§3.2)。
3. `applicable=false` の gate を黙って合格にしない。G7 の coverage 証跡は fixture に同梱し、免除しない (§3.1)。

## 3. fixture

### 3.1 置き場所と manifest

- 置き場所: `tests/fixtures/sample-product/`。配下の path は consumer layout での相対 path そのものである
  (例: `tests/fixtures/sample-product/docs/design/L2-screen/screen-list.md` は consumer の
  `docs/design/L2-screen/screen-list.md` になる)。
- manifest: `tests/fixtures/sample-product/sample-product.json` (UTF-8、LF)。consumer へは複写しない。

```json
{
  "schema": "ut-tdd.sample-product-fixture/v1",
  "id_namespace": { "requirement": "RQ-", "screen": "SC-", "function": "FN-" },
  "gates": {
    "G1": { "inputs": ["docs/design/L1-requirements/functional-requirements.md", "..."] },
    "G2": { "inputs": ["..."] },
    "...": {},
    "G14": { "inputs": ["..."] }
  },
  "expected_totals": {
    "G1": { "requirements": 3, "screens": 3, "functions": 3 },
    "G3": { "requirements": 3, "functions": 3, "tests": 3 }
  }
}
```

- `gates` のキーは `G1`〜`G14` のちょうど 14 個とする (`G0.5` / `R4` は review だけの gate で、静的検査が無いので
  入れない)。`inputs` は gate ごとに 1 件以上で、fixture に実在する consumer 相対 path に限る。
- `expected_totals` の件数は fixture の表の行数と一致させる。数値は例であり、fixture を作る実装 PR で確定する。

gate ごとの入力クラス (各 1 つ以上を必須とする):

| gate | 入力クラス | 正本 |
| --- | --- | --- |
| G1 / G3 | core 4 文書 (`DOC-L1-REQUIREMENTS` / `DOC-L2-SCREEN` / `DOC-L3-FUNCTIONAL` / `DOC-L12-ACCEPTANCE`) の表 | `consumer-trace-gates.md` §5 / §6 |
| G1〜G6 | 各層の layer pair (設計文書と対になるテスト設計) | `src/gate/static.ts` の `evaluateLayerPairGate` |
| G7 | 上記の L0〜L7 の対、`coverage/coverage-summary.json` (`readCoverageSummary` の閾値 80% を満たす値) | `evaluateG7` (既定の `coverage/coverage-summary.json` を consumer root で読む) |
| G8〜G14 | 各 gate の slot 文書 (`DOC-L8-INTEGRATION-TEST-DESIGN` 〜 `DOC-L14-*`) の検証ケース表と、`docs/process/vmodel-contract.yaml` の `evidence_manifest` が指す証跡一式 | `src/gate/right-arm-static.ts` の `evaluateRightArmStaticGate` |

- G8〜G14 の検証ケース ID は、契約の `case_id_prefix` (`IT-` / `ST-` / `UXV-` / `UAT-` / `AT-` / `SMOKE-` / `OT-`)
  を使う。これは consumer にも課される契約の値であり、ハーネス固有の値ではない。

### 3.2 ID の名前空間と汚染の禁止

- 設計の ID (L1 の `要求ID`、L2 の `画面ID`、L3 の `機能ID` と、それらを引く参照セル) は manifest の
  `id_namespace` だけを使う。要求 `RQ-NNN`、画面 `SC-NNN`、機能 `FN-NNN` (3 桁) とする。L12 の `テストID` は
  G12 の契約 prefix の `AT-NNN` とする。
- fixture の全 file は、次の表 (ハーネス固有値の検出表) のどれにも一致してはならない。一致したら §3.3 の検査で
  `fixture-contaminated` とする。同じ表を §7 の出力検査にも使う。

| id | 正規表現 | 出所 |
| --- | --- | --- |
| `harness-design-root` | `docs/(?:design\|test-design)/harness/` | ハーネスの設計 root (Pack#11) |
| `harness-screen-id` | `\b(?:PM\|HM\|GD)-\d{2}\b` | ハーネスの画面 ID (Pack#10) |
| `harness-business-id` | `\b(?:BR\|UX)-\d{2}\b` | ハーネスの業務 / UX 要求 ID |
| `harness-fr-id` | `\bFR-(?:L1-)?\d{2}\b` | ハーネスの機能要求 ID |
| `harness-nfr-id` | `\bNFR-\d{2}\b` | ハーネスの非機能要求 ID |
| `harness-ac-at-id` | `\bA[CT]-FR-` | ハーネスの AC / AT ID の形 |
| `harness-heading` | `harness 追補` | ハーネスだけの見出し |

- 表は runner の mjs と source 側のテストの 2 箇所に同じ値で置く (runner は source を import できない。
  U-ST-PACKCANARY-009)。2 箇所が一致することを source 側のテストで強制する (§3.3)。

### 3.3 source 側の検査

`validateSampleProductFixture(fixtureRoot, templates) => SampleProductFixtureValidation` は次を検査し、1 件でも
該当すれば `ok=false` とする。finding は `{ code, target, detail }` で、`code`・`target`・`detail` の昇順に並べる。

| code | 条件 |
| --- | --- |
| `fixture-manifest-invalid` | schema 不一致、`gates` のキーが `G1`〜`G14` と一致しない、`expected_totals` の形が違う |
| `fixture-gate-input-missing` | gate の `inputs` が空、または列挙した path が fixture に無い |
| `fixture-contaminated` | fixture の file が §3.2 の検出表に一致する、または絶対 path (`\b[A-Za-z]:[\\/]` か `/(?:home\|Users\|tmp)/`) を含む |
| `fixture-namespace-violation` | core 3 文書 (L1 / L2 / L3) の ID 列の値が `id_namespace` の prefix で始まらない |
| `fixture-template-drift` | vmodel template のある文書で、見出し行 (`#` で始まる行) の列か frontmatter のキー集合が出荷する template と違う |
| `fixture-total-mismatch` | `expected_totals` が fixture の表の行数と違う |
| `detector-table-drift` | runner の検出表と source 側の検出表が違う |

`templates` は `embeddedVModelTemplateAssets()` (出荷する template の bytes) を渡す。build 出力と比べるのは、
consumer が受け取る template の形を試すためである。

## 4. install phase: fixture の取り出しと複写

`installSampleProduct(tarPaths, readEntry, consumerRoot) => SampleProductInstall` を、tag が `AGENT_E2E_TAG` でない
ときだけ、`ut-tdd.project.json` の commit の後、`createConsumerPlan` の前に実行する。

1. `verifyReleaseDirectory` で検証済みの `<tag>.tar.gz` について、`tar -tzf` の path 一覧から
   `tests/fixtures/sample-product/` で始まる通常 file を集める。0 件、または `sample-product.json` が無ければ
   `sample-product-unavailable` で失敗する。
2. 各 file を `tar -xOf` で取り出す。prefix を除いた相対 path に `..`、絶対 path、`.ut-tdd/` / `.git/` 始まりが
   あれば `sample-product-path-invalid:<path>` で失敗する。
3. manifest 以外の file を consumer root の同じ相対 path へ書く (setup が置いた template は上書きする)。
4. 書いた path だけを明示して `git add -- <paths>` し、`canary sample product fixture` で commit する。この commit
   は `consumer_head` に含まれる。
5. evidence に `sample_product: { manifest, files: [{ path, sha256 }] }` を書く (`files` は path の昇順)。

## 5. verify phase: 全 gate と lint の実行

source を forbidden にした後、§6 の位置で次を実行する。どれも既存の `runCli` (consumer の wrapper、
cwd は alternate cwd。wrapper が consumer root を cwd にして起動する) を使う。

1. evidence の `sample_product.files` の各 path を consumer で読み直し、sha256 が違えば
   `sample-product-drift:<path>` で失敗する。
2. `G1`〜`G14` の順に `gate <G> --json` を実行する。label は `sample-product-gate-<G>`。exit 0 と 1 を受け付ける
   (review tier の不合格でも exit 1 になるため)。判定に使うのは JSON の `static_gate` だけで、`review` は見ない。
3. `plan lint --gate G1-trace`、`plan lint --gate G3-trace`、`vmodel lint` を実行する。label は
   `sample-product-lint-g1-trace` / `sample-product-lint-g3-trace` / `sample-product-lint-vmodel`。exit 0 と 1 を
   受け付け、stdout の行を判定に使う。

## 6. 在庫差分 step との順序

verify phase の step は次の順にする。

`doctor-setup-smoke` → `doctor-consumer-profile` → `delivery-inventory` (#1275) → **`sample-product`** (本書) →
`plan-authoring` → 以降は既存のまま

- 在庫差分を先にするのは、配送物が欠けているときに、その欠落を gate の失敗より先に報告するためである。
- 2 つの step は互いの evidence を読まず、片方が無くても他方は動く。`delivery-inventory` の step がまだ無い版では、
  本 step は `doctor-consumer-profile` の直後に置く。
- 本 step は consumer へ書かない (gate が `.ut-tdd/` に書く実行記録を除く)。`plan-authoring` 以降の step の入力
  (`canary-plan-draft.json`) と path が重ならない。

## 7. 合否と失敗の出力

`classifySampleProductRun(manifest, outputs) => SampleProductResult` は、§5 の各出力を次で判定する。finding は
`{ code, target, detail }` で、`target` は gate ID か lint の label である。

| code | 条件 | detail |
| --- | --- | --- |
| `output-invalid` | exit が 0 / 1 以外、gate の stdout が JSON でない、または `static_gate` の `gate` / `applicable` / `passed` / `messages` の型が違う | exit code または欠けた field |
| `gate-not-applicable` | `static_gate.applicable` が `false` | 先頭の message |
| `gate-failed` | `static_gate.passed` が `false`、または lint の exit が 1 | 先頭の message (200 文字まで) |
| `throw-class` | message / lint の行が `/required docs? (?:not created\|could not be read)/i`、`/could not run/i`、`/no deterministic check registered/`、`/no evaluator for/`、`/contract has no obligation/` のどれかに一致 | 一致した正規表現の番号 |
| `harness-value` | message / lint の行が §3.2 の検出表のどれかに一致 | 検出表の id と一致した文字列 |
| `trace-total-mismatch` | G1 / G3 の `consumer column trace` の行の件数が `expected_totals` と違う、またはその行が無い | `<項目>=<実測>!=<期待>` |

- 合格は finding が 0 件のときだけである。#961 の 2 条件 (`throw-class` 0 件、`harness-value` 0 件) に、
  `gate-failed` / `gate-not-applicable` / `trace-total-mismatch` 0 件を加える。理由は §2 のとおり。
- gate を除外する表は持たない。正しい fixture の上で gate が落ちたら Pack の欠陥として Issue に起票し、この
  step は Red のままにする。
- runner は evidence に `sample_product_result: { ok, findings }` を書いてから、`ok=false` なら
  `sample-product-e2e:<件数>:<先頭 20 件の code:target を , で連結>` で throw する (verify phase を失敗させる)。

既知の欠陥がこの判定でどう出るか:

| 欠陥 | 出る finding |
| --- | --- |
| Pack#10 / #971 (G1 の画面 ID 接頭辞の固定) | `gate-failed:G1`、`trace-total-mismatch:G1` (screens が 0) |
| Pack#11 / #972 (G3 が `business-detail.md` を必須で読む) | `gate-failed:G3`、`throw-class:G3`、`harness-value:G3` (`harness-design-root`) |
| 入力クラスの無い gate が黙って通る | source 側の入力感度の検査 (テスト設計の CANDIDATE-U-PACKSAMPLE-005) と、`gate-not-applicable` |

## 8. 既存機構への影響

| 対象 | 変更 |
| --- | --- |
| `tests/fixtures/sample-product/**` | 新規 (fixture と manifest) |
| `scripts/pack-canary-acceptance.mjs` | install phase の §4、verify phase の §5 / §7、検出表の定数 |
| `src/setup/distribution.ts` | 変更なし (`tests/` は既に clean allow) |
| `src/gate/**`、`src/lint/**` | 変更なし (欠陥の修正は各 Issue と `consumer-trace-gates.md` の実装で行う) |
| publish record / `canaryAssetsForTag` | 変更なし |

## 9. DbC

| 関数 | pre | post | invariant |
| --- | --- | --- | --- |
| `validateSampleProductFixture` | `fixtureRoot` は tracked fixture の root | `ok` ⇔ finding 0 件 | 例外で落ちず、不正な入力も finding で返す |
| `installSampleProduct` | tar は `verifyReleaseDirectory` で検証済み | consumer に fixture が commit され、evidence に path と sha256 が載る | source checkout を読まない。書く path は fixture の path だけ |
| `classifySampleProductRun` | `outputs` は §5 の 17 件 (gate 14 件、lint 3 件) | `ok` ⇔ finding 0 件 | gate を除外する経路を持たない。`outputs` の件数が 17 でなければ `output-invalid` |
