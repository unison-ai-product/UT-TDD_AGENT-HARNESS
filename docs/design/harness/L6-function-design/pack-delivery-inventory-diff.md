---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_pack_delivery_inventory_diff
pair_artifact: docs/test-design/harness/L7-pack-delivery-inventory-diff-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1275
---

> **L6 contract marker**: `collectDeliveryRegistry(input) => DeliveryRegistry`、`validateDeliveryInventoryManifest(manifest, registry) => DeliveryInventoryValidation`、`observeConsumerInventory(consumerRoot, runCli) => ObservedInventory`、`diffDeliveryInventory(manifest, observed) => DeliveryInventoryDiff` は unit-test-granularity contract である。DbC (pre / post / invariant) は §8 にまとめる。oracle は `docs/test-design/harness/L7-pack-delivery-inventory-diff-test-design.md` の `CANDIDATE-U-PACKINV-001〜016` が固定する。

# Pack の在庫差分 — source と導入後 consumer の比較 (issue #1275)

## 1. 目的と範囲

Pack#13 / #1072 / #676 では、source にある配送物 (skill・テンプレートなど) が導入後の consumer に届かず、
それを検出する検査が無かった。本書は、source 側の在庫 (command / hook / skill / template) と導入後の consumer が
実際に持つものを比べ、**除外理由のある差だけを許し、それ以外の差を fail-close にする**契約を固める
(決定の出所: #961 comment 6356415105、親 #676)。

- 新しい gate・doctor check・CLI command は作らない。次の既存機構を広げる。
  - `src/setup/authoring-template-inventory.ts` (authoring family の正本と、`buildCleanDistributionPlan` の
    `missingRequired`)
  - `scripts/pack-canary-acceptance.mjs` の verify phase (既に `doctor --profile consumer-setup-smoke` を流す
    step 列)
- 見本 product 上の E2E (読む path の依存、ハーネス固有の固定値) は #364 の範囲であり、本書は扱わない。
- `src/doctor/setup-smoke.ts` (`consumer-setup-smoke` profile) は変更しない。consumer の中には source 側の
  一覧が無く、consumer 内で比べると bundle 由来の期待と bundle 由来の実在の自己比較になる (§2 案C)。

## 2. 方式判断 (期待一覧を比較地点へ運ぶ方法)

canary runner は source tree を forbidden にして、release directory と publish record だけを入力に動く。
そのため source 側の期待一覧を比較地点へ運ぶ方法を決める必要があった。

| 案 | 内容 | 判定 |
| --- | --- | --- |
| A | source の登録簿から期待一覧と除外表を作り、Pack の tar に manifest として同梱する。canary は既存の `tar -xOf` で取り出して consumer の観測と比べる | **採用** |
| B | canary の起動側が source checkout から期待一覧を作り、引数で runner に渡す | 却下。source の無い状態で再現するという canary の目的に反し、publish record にも束縛されない |
| C | bundle の build 時に期待一覧を埋め込み、consumer 内の doctor が自己比較する | 却下。build が落としたものは期待側からも落ち、差が 0 のまま通る |

advisor 相談: `claude-fable-5-1` / decision `design` / 2026-10-23
(`.ut-tdd/logs/session/advisor-claude-1792726988323.jsonl`)。推奨は案A で、次の 3 条件を付けた。本書は 3 条件を
すべて契約に入れる。

1. 期待一覧は build 出力 (`src/shared/embedded-skills.ts` の埋め込み集合、`src/setup/vmodel-template-assets.ts`
   の列挙) と独立な登録簿から作り、source 側のテストで「manifest = 登録簿 − 除外表」を強制する (§4)。
2. 除外対象が登録簿に実在することを fail-close にする (§4 `exclusion-stale`)。
3. manifest の置き場所と digest の束縛を先に決める (§3)。

manifest は tracked file として commit し、生成物にはしない。生成物にすると materializer に新しい出力経路が
要るためである。tracked にすると、登録簿が変わるたびに manifest の更新が要るが、更新漏れは §4 の
source 側検査が Red にする。

## 3. manifest の置き場所と形式

- 置き場所: `docs/templates/delivery/inventory.json` (UTF-8、LF、mode `100644`)。
- `AUTHORING_TEMPLATE_INVENTORY` に family `delivery inventory` を 1 件足す
  (`sourcePrefix` = `artifactPrefix` = `docs/templates/delivery/`、`requiredArtifactPaths` =
  `["docs/templates/delivery/inventory.json"]`)。これで既存の仕組みがそのまま効く。
  - Pack の artifact set に manifest が無ければ、`buildCleanDistributionPlan` の `missingRequired` に載り
    `ok=false` になる。
  - `validateAuthoringArtifactSet` の missing / duplicate / unknown 判定と、`inspectPackAuthoringEntries` の
    mode / LF / parse 検査の対象になる。parse 検査には `JSON.parse` と §3 の形の検査を加える。
- digest の束縛: publish record は tar の digest を持つ。manifest は tar の中にあるので、tar digest で間接的に
  束縛される。publish record の schema と canary の asset 集合 (`canaryAssetsForTag`) は変えない。

形式:

```json
{
  "schema": "ut-tdd.delivery-inventory/v1",
  "skill":    { "expected": ["SKILL_MAP.md", "..."], "excluded": [] },
  "command":  { "expected": ["build", "..."], "excluded": [] },
  "hook": {
    "expected": [
      { "id": "claude:agent-guard", "command": "node", "args": [".ut-tdd/bin/ut-tdd.mjs", "hook", "agent-guard"] },
      { "id": "codex:agent-guard", "command": "<codexCommandString(wrapperHookArgs(\"agent-guard\")) の値>" }
    ],
    "excluded": [
      { "id": "codex:subagent-stop", "reason": "Codex に SubagentStop surface が無い" },
      { "id": "codex:claude-memory-wake", "reason": "Claude Stop hook の asyncRewake 専用" }
    ]
  },
  "template": {
    "expected": ["authoring:docs/templates/plan/design/template.md", "vmodel-slot:<doc_type_id>", "vmodel-optional:ZIP-DOC-NNN"],
    "excluded": [{ "id": "vmodel-file:docs/templates/vmodel/<path>", "reason": "<理由>" }]
  }
}
```

- `excluded[].reason` は前後の空白を除いて 1 文字以上の文字列とする。除外表はこの manifest の中だけに置き、
  別ファイルや TS 定数に二重に持たない。
- `expected` / `excluded` は各 kind の中で id の昇順に並べる (差分を読みやすくするため。順序違いは
  `manifest-invalid`)。

## 4. source 側の登録簿と manifest の検査

登録簿は build 出力に依存しない次の正本から作る。

| kind | 登録簿の正本 | id |
| --- | --- | --- |
| skill | `git ls-files skills` のうち `.md` / `.yaml` (`.gitkeep` を除く) | `skills/` からの相対 path |
| command | `git ls-files .claude/commands` のうち `*.md` | 拡張子を除いた file 名 |
| hook | `src/lint/project-hook.ts` の `REQUIRED` × provider `claude` / `codex` | `<provider>:<REQUIRED id>` |
| template | (a) `AUTHORING_TEMPLATE_ARTIFACT_PATHS` から manifest 自身を除いたもの、(b) port index `docs/templates/vmodel/README.md` の slot source 行と optional 行、(c) `git ls-files docs/templates/vmodel` のうち (b) のどの行からも参照されない file | (a) `authoring:<path>`、(b) `vmodel-slot:<doc_type_id>` / `vmodel-optional:<ZIP-DOC-NNN>`、(c) `vmodel-file:<path>` |

(c) は登録簿には入るが、consumer への配送単位ではないので `excluded` に理由付きで置くか、port index に行を
足すかのどちらかを求める。`docs/templates/adapter/**` と `docs/templates/github/**` は setup が書く adapter /
GitHub 雛形の原本であり、consumer での実在は command / hook の kind と `consumer-setup-smoke` の必須 file で
観測するので、template の登録簿には入れない。

`collectDeliveryRegistry(input) => DeliveryRegistry` は `trackedPaths` (git の tracked path 一覧)、
`portIndex` (README.md の本文) を受け取り、上表の id 集合と、hook ごとの期待 invocation
(`claude`: `{ command: "node", args: wrapperHookArgs(id) }`、`codex`: `codexCommandString(wrapperHookArgs(id))`)
を返す。file system・環境変数・build 出力を読まない。

`validateDeliveryInventoryManifest(manifest, registry) => DeliveryInventoryValidation` は次を検査し、
1 件でも該当すれば `ok=false` とする。各 finding は `{ code, kind, id }` で、`code` 昇順・`kind` 昇順・`id` 昇順に並べる。

| code | 条件 |
| --- | --- |
| `manifest-invalid` | `schema` 不一致、kind の欠落・余剰、`expected` / `excluded` が配列でない、昇順でない |
| `registry-unclassified` | 登録簿にあるが `expected` にも `excluded` にも無い |
| `expected-not-in-registry` | `expected` にあるが登録簿に無い |
| `exclusion-stale` | `excluded` にあるが登録簿に無い |
| `exclusion-reason-missing` | `reason` が無い、文字列でない、または空白だけ |
| `classified-twice` | 同じ id が `expected` と `excluded` の両方にある、またはどちらかに 2 回以上ある |
| `hook-command-drift` | hook の `expected` の `command` / `args` が登録簿の期待 invocation と一致しない |

この検査は、実 repo の tracked path と実際の manifest を入力にする owner test で CI に載る
(`coding ≠ substance`。新しい doctor check にはしない)。

## 5. consumer 側の観測

`scripts/pack-canary-acceptance.mjs` は source を import できない (U-ST-PACKCANARY-009 で単独コピーして起動する)
ため、観測と比較は runner の中に mjs で実装する。

- install phase: release directory を検証した後、既存の authoring template と同じく
  `tar -xOf <tag>.tar.gz docs/templates/delivery/inventory.json` で manifest を取り出し、`tar -tzf` で tar の
  path 一覧を取る。evidence に `delivery_inventory: { path, sha256, manifest, tar_paths }` を記録する。取り出しに
  失敗したら `delivery-inventory-unavailable` で失敗する。
- verify phase (source を forbidden にした後): `doctor-consumer-profile` の直後、`plan-authoring` の前に
  `observeConsumerInventory(consumerRoot, runCli) => ObservedInventory` を実行する。

| kind | consumer 側の観測 |
| --- | --- |
| skill | `.ut-tdd/assets/skills/` 配下の通常 file の相対 path (symlink は観測値に入れず `inventory-unexpected` にする) |
| command | `.claude/commands/*.md` の file 名 (拡張子を除く) |
| hook | `.claude/settings.json` の各 hook の `{ command, args }` と、`.codex/hooks.json` の各 hook の `command` 文字列。manifest の `expected` / `excluded` の invocation と完全一致したものを、その id として観測する。どれにも一致しない hook は id `unknown:<provider>:<表示文字列>` で観測する |
| template | `authoring:<path>` は install phase の `tar_paths` に含まれるか。`vmodel-slot:<id>` / `vmodel-optional:<id>` は id ごとに `vmodel template --slot <id>` / `--optional <id>` に `--dry-run --json` を付けて wrapper で起動し、exit 0 で `written` と `skipped` の合計がちょうど 1 件なら観測する。`vmodel-file:` は consumer への配送単位ではないので観測しない |

`--dry-run` は書き込みをしないので、`consumer_head` の drift 検査には影響しない。

## 6. 比較と失敗の出力

`diffDeliveryInventory(manifest, observed) => DeliveryInventoryDiff` は kind ごとに次を判定する。

| code | 条件 |
| --- | --- |
| `inventory-manifest-invalid` | manifest が §3 の形でない、または `excluded[].reason` が空 (runner 側でも再検査する。source 側の検査を経ていない tar でも素通りさせない) |
| `inventory-missing` | `expected` にあるが観測されない |
| `inventory-unexpected` | 観測されたが `expected` にも `excluded` にも無い |
| `inventory-excluded-present` | `excluded` にあるのに観測された (除外理由が事実と食い違っている) |

- `ok` は finding が 0 件のときだけ true。finding は `{ code, kind, id }` を `code`・`kind`・`id` の昇順に並べる。
- runner は transcript に label `delivery-inventory` の行を残し、evidence に `delivery_inventory_result:
  { ok, findings }` を書いてから、`ok=false` なら `delivery-inventory-diff:<件数>:<先頭 20 件の code:kind:id を , で連結>`
  で throw する (既存 step と同じく verify phase を失敗させる)。
- 除外 (`excluded`) にある id が観測されないことは差として扱わない。これが「理由付きの差だけを許す」の
  唯一の経路である。

## 7. 既存機構への影響

| 対象 | 変更 |
| --- | --- |
| `src/setup/authoring-template-inventory.ts` | family `delivery inventory` の追加、`collectDeliveryRegistry` / `validateDeliveryInventoryManifest` の追加 |
| `src/setup/pack-authoring-smoke.ts` | manifest path の parse 検査 (`JSON.parse` と §3 の形) |
| `src/setup/distribution.ts` | 変更なし (`AUTHORING_TEMPLATE_ARTIFACT_PATHS` 経由で `missingRequired` に manifest が入る) |
| `scripts/pack-canary-acceptance.mjs` | install phase の manifest 取り出し、verify phase の観測・比較 step |
| `docs/templates/delivery/inventory.json` | 新規 (tracked manifest) |
| `src/doctor/setup-smoke.ts` | 変更なし (§1) |

## 8. DbC

| 関数 | pre | post | invariant |
| --- | --- | --- | --- |
| `collectDeliveryRegistry` | `trackedPaths` は repo 相対で `/` 区切り | 4 kind の id 集合を返す。同じ入力なら同じ出力 | build 出力・作業ツリー・環境変数を読まない |
| `validateDeliveryInventoryManifest` | registry は `collectDeliveryRegistry` の出力 | `ok` ⇔ finding 0 件。`ok` なら kind ごとに `expected ∪ excluded = 登録簿`、`expected ∩ excluded = ∅`、全 `reason` が非空 | 例外で落ちず、不正な入力も finding で返す |
| `observeConsumerInventory` | install evidence が検証済みで、source path は forbidden | 4 kind の観測集合を返す | consumer へ書き込まない (`vmodel template` は `--dry-run` だけ) |
| `diffDeliveryInventory` | manifest は tar から取り出した値 | `ok` ⇔ finding 0 件 | 差を許す経路は `excluded` だけで、理由の無い除外は許さない |
