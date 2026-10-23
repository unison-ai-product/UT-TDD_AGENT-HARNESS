---
title: "L7 pack delivery inventory diff test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/pack-delivery-inventory-diff.md
status: confirmed
issue: 1275
updated: 2026-10-23
---

# Pack の在庫差分 テスト設計 (issue #1275)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/pack-delivery-inventory-diff.md` である。
本書はその §3 manifest、§4 source 側の検査、§5 consumer 側の観測、§6 比較と失敗の出力、§8 DbC を検証する
oracle を定義する。ID は未実装の間 `CANDIDATE-U-PACKINV-NNN` とし、実装 PR で test が置かれた行を同番号の
`U-PACKINV-NNN` へ 1:1 で昇格する。既存の `U-PACKTPL-*` / `U-RCDEV-*` / `U-ST-PACKCANARY-*` は再採番・再所有しない。
共有の `L7-unit-test-design.md` には索引を置かない (本書が正本)。

所有 test:

- source 側 (`collectDeliveryRegistry` / `validateDeliveryInventoryManifest` / authoring family):
  `tests/pack-delivery-inventory.test.ts` (新規)
- consumer 側 (`observeConsumerInventory` / `diffDeliveryInventory` / runner の step): `tests/pack-canary-acceptance.test.ts`
  (既存。offline の fixture consumer で検証し、実 release は使わない)

## 2. 共通 fixture

- **source fixture**: 実 repo の `git ls-files` と実 manifest `docs/templates/delivery/inventory.json` (実 repo 回帰)、
  およびそれを 1 軸だけ変えた複製。
- **consumer fixture**: 一時ディレクトリに、正常形の manifest が期待する通りの `.ut-tdd/assets/skills/`、
  `.claude/commands/*.md`、`.claude/settings.json`、`.codex/hooks.json` を置き、`vmodel template` の起動は
  injected `run` で manifest の各 id に 1 path を返す stub にする。tar の path 一覧は authoring の全 path を含む。
  正常形の除外は `codex:subagent-stop` と `codex:claude-memory-wake` の 2 件 (設計 §3 の例) とする。

## 3. source 側の oracle

| ID | oracle | 違反 / mutation (Red になるべき変異) |
| --- | --- | --- |
| CANDIDATE-U-PACKINV-001 | 実 repo の tracked path と port index から `collectDeliveryRegistry` を作り、実 manifest に `validateDeliveryInventoryManifest` を掛けると `ok=true`、finding 0 件 (実 repo 回帰)。kind ごとに `expected ∪ excluded` が登録簿と一致し、`expected ∩ excluded = ∅` | (m1) `skills/` に tracked skill を 1 本足し manifest を更新しない → `registry-unclassified:skill:<id>`。(m2) manifest の skill `expected` から 1 件消す → 同じ finding |
| CANDIDATE-U-PACKINV-002 | `collectDeliveryRegistry` は build 出力に依存しない: `embeddedSkillAssets()` / `embeddedVModelTemplateAssets()` を空にする stub を入れても登録簿は変わらない | (m) 登録簿の skill を埋め込み集合から作る → stub 下で件数が減り失敗 (設計 §2 条件 1、案C と同じ穴の検出) |
| CANDIDATE-U-PACKINV-003 | hook の登録簿は `REQUIRED` × `claude` / `codex` で、`claude` の期待 invocation は `{ command: "node", args: wrapperHookArgs(id) }`、`codex` は `codexCommandString(wrapperHookArgs(id))` と完全一致する | (m1) manifest の `claude:work-guard` の args を `["hook","work-guard"]` (wrapper 抜き) にする → `hook-command-drift:hook:claude:work-guard`。(m2) `REQUIRED` に hook を 1 件足し manifest を更新しない → `registry-unclassified:hook:claude:<id>` と `registry-unclassified:hook:codex:<id>` |
| CANDIDATE-U-PACKINV-004 | 除外の理由が無い・空文字・空白だけ・文字列でない、の各 1 軸変異で `exclusion-reason-missing:<kind>:<id>` が出て `ok=false`。他の finding を伴わない | (m) reason の検査を外す → 4 変異とも `ok=true` になり失敗 |
| CANDIDATE-U-PACKINV-005 | 登録簿に無い id を `excluded` に置くと `exclusion-stale`、`expected` に置くと `expected-not-in-registry` | (m) 実在検査を外す → 死んだ除外が残り `ok=true` で失敗 (設計 §2 条件 2) |
| CANDIDATE-U-PACKINV-006 | 同じ id を `expected` と `excluded` の両方に置く、または `expected` に 2 回置くと `classified-twice` | (m) 重複検査を外す → `ok=true` で失敗 |
| CANDIDATE-U-PACKINV-007 | `schema` 不一致、kind の欠落・余剰、配列でない、昇順でない、の各 1 軸変異で `manifest-invalid`。不正な JSON 値でも例外で落ちず finding で返る | (m1) kind 欠落を許す → 失敗。(m2) 例外を投げる実装 → 例外 assert で失敗 |
| CANDIDATE-U-PACKINV-008 | port index のどの行からも参照されない tracked file を `docs/templates/vmodel/` に 1 本足すと `registry-unclassified:template:vmodel-file:<path>`。`excluded` に理由付きで置くと解消する。`docs/templates/adapter/**` / `github/**` は template の登録簿に入らない | (m1) (c) の収集を外す → 足した file が見過ごされ失敗。(m2) adapter 雛形を登録簿に入れる → 正常形で `registry-unclassified` が出て失敗 |
| CANDIDATE-U-PACKINV-009 | `AUTHORING_TEMPLATE_INVENTORY` に family `delivery inventory` があり、`validateAuthoringTemplateInventory` が `ok=true`。`git ls-files` から作った clean plan の `artifactPaths` に manifest が exactly once。manifest を入力 path から除くと `missingRequired` に `docs/templates/delivery/inventory.json` が載り `ok=false` (Pack から manifest が落ちる変異) | (m) family を足さない → manifest が allowlist 外で `artifactPaths` に出ず失敗 |
| CANDIDATE-U-PACKINV-010 | `inspectPackAuthoringEntries` は manifest が CRLF、mode `100755`、JSON として壊れている、§3 の形でない、の各変異で `line-ending:` / `mode:` / `parse:` の error を返す | (m) manifest を parse 対象に加えない → 壊れた manifest が `ok=true` で失敗 |

## 4. consumer 側の oracle

| ID | oracle | 違反 / mutation (Red になるべき変異) |
| --- | --- | --- |
| CANDIDATE-U-PACKINV-011 | 正常形の consumer fixture で `observeConsumerInventory` → `diffDeliveryInventory` が `ok=true`、finding 0 件。除外 2 件 (codex の `subagent-stop` / `claude-memory-wake`) が観測されないことは差にならない。verify phase は `doctor-consumer-profile` の後、`plan-authoring` の前に label `delivery-inventory` を transcript に残し、`consumer_head` は変わらない | (m1) step を外す → transcript に label が無く失敗。(m2) `vmodel template` を `--dry-run` 無しで起動する → consumer に file が増え `consumer-head-drift` 系で失敗 |
| CANDIDATE-U-PACKINV-012 | **hook が Pack から落ちる**: consumer の `.claude/settings.json` から `claude-memory-wake` の hook を 1 件除くと `inventory-missing:hook:claude:claude-memory-wake`、`.codex/hooks.json` から `work-guard` を除くと `inventory-missing:hook:codex:work-guard`。verify phase は `delivery-inventory-diff:1:...` で throw し、evidence の `delivery_inventory_result.ok` は false | (m1) hook の観測を `consumer-setup-smoke` の固定一覧 (`SETUP_SMOKE_*`) で代用する → `claude-memory-wake` の欠落を見逃し失敗。(m2) 比較を `args` の部分一致にする → wrapper 抜きの hook を一致と誤認し失敗 |
| CANDIDATE-U-PACKINV-013 | **skill が欠ける**: consumer の `.ut-tdd/assets/skills/` から 1 本消すと `inventory-missing:skill:<path>`。manifest に無い file を 1 本足すと `inventory-unexpected:skill:<path>`。symlink を 1 本置くと `inventory-unexpected` | (m1) skill の観測を件数だけにする → 1 本消して 1 本足す変異で件数が一致し見逃して失敗。(m2) symlink を通常 file として数える → 失敗 |
| CANDIDATE-U-PACKINV-014 | **template / command が欠ける**: tar の path 一覧から `docs/templates/plan/impl/template.md` を除くと `inventory-missing:template:authoring:docs/templates/plan/impl/template.md`。`vmodel template --optional <id>` の stub を exit 1 にする、または 0 件 / 2 件を返すようにすると `inventory-missing:template:vmodel-optional:<id>`。`.claude/commands/` から 1 本消すと `inventory-missing:command:<name>` | (m1) vmodel を 1 回の起動の件数合計で判定する → 1 件欠落と 1 件重複の組で見逃して失敗。(m2) authoring を consumer root の file で探す → 正常形でも missing になり失敗 |
| CANDIDATE-U-PACKINV-015 | **除外の理由が無い manifest が tar に入っている**: tar から取り出した manifest の `excluded[0].reason` を空文字にすると、source 側の検査を経ていなくても runner が `inventory-manifest-invalid:hook:codex:subagent-stop` を返し throw する。除外にある `codex:subagent-stop` が consumer に観測されると `inventory-excluded-present:hook:codex:subagent-stop` | (m1) runner 側の manifest 再検査を外す → 空理由の除外で差が許され失敗。(m2) 除外を「観測されても可」と扱う → excluded-present が出ず失敗 |
| CANDIDATE-U-PACKINV-016 | install phase で manifest を tar から取り出せない (path 不在) と `delivery-inventory-unavailable` で失敗し、evidence に `delivery_inventory` が空のまま verify へ進まない。取り出せた場合、evidence の `delivery_inventory.sha256` は取り出した bytes の sha256 と一致する。finding は `code`・`kind`・`id` の昇順で、throw の message は先頭 20 件までを含む | (m1) 取り出し失敗を空 manifest として続行する → install phase が成功扱いになり、unavailable の assert で失敗。(m2) finding を観測順に出す → 順序 assert で失敗 |

## 5. 実装後の検証接続

実装 PR では、Red (`it.fails`) を先に通常 commit し、Green → Refactor の順に進める (`skills/test-driven-development.md`)。
各 candidate を `U-PACKINV-*` へ同番号で昇格し、実テストの path と exact HEAD を PR に記録する。実 release を使った
受入 (AT-DIST-003 の canary) で `delivery-inventory` step が green であることは本書の oracle ではなく、release 受入の
証跡として扱う。
