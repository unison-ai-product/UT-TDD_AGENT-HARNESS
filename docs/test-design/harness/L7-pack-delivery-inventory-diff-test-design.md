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
本書はその §3 manifest、§4 source 側の検査 (adapter / GitHub 雛形の配送先対応を含む)、§5 consumer 側の観測と実行順、§6 比較と失敗の出力、§8 DbC を検証する
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
  `.claude/commands/*.md`、`.claude/settings.json`、`.codex/hooks.json` と、template の `setup:<path>` 全件の file
  (`.claude/agents/*.md`、`.github/workflows/*.yml`、`.github/ISSUE_TEMPLATE/*.md`、`.github/PULL_REQUEST_TEMPLATE.md` など)
  を置く。`vmodel template` の起動は injected `run` の **記録つき stub** にする: 呼ばれた argv をすべて記録し、
  argv に `--dry-run` があれば manifest の各 id に 1 path を返して何も書かず、`--dry-run` が無ければ実コマンドと同じく
  consumer root に 1 file を書く。tar の path 一覧は authoring の全 path を含む。
  正常形の除外は hook の `codex:claude-memory-wake` と `codex:subagent-stop` の 2 件 (どちらも設計 §3 のとおり
  invocation を持つ) と、template の `setup-template:docs/templates/github/common/pack-harness-check.yml` /
  `setup-template:docs/templates/github/team/CODEOWNERS` / `setup-template:docs/templates/github/team/setup-branch-protection.sh`
  とする。
- **consumer file 状態**: consumer root の `.git/` を除く全 file の (相対 path, sha256) の集合。無書き込みの比較に使う。

## 3. source 側の oracle

| ID | oracle | 違反 / mutation (Red になるべき変異) |
| --- | --- | --- |
| CANDIDATE-U-PACKINV-001 | 実 repo の tracked path と port index から `collectDeliveryRegistry` を作り、実 manifest に `validateDeliveryInventoryManifest` を掛けると `ok=true`、finding 0 件 (実 repo 回帰)。kind ごとに `expected ∪ excluded` が登録簿と一致し、`expected ∩ excluded = ∅` | (m1) `skills/` に tracked skill を 1 本足し manifest を更新しない → `registry-unclassified:skill:<id>`。(m2) manifest の skill `expected` から 1 件消す → 同じ finding |
| CANDIDATE-U-PACKINV-002 | `collectDeliveryRegistry` は build 出力に依存しない: `embeddedSkillAssets()` / `embeddedVModelTemplateAssets()` を空にする stub を入れても登録簿は変わらない | (m) 登録簿の skill を埋め込み集合から作る → stub 下で件数が減り失敗 (設計 §2 条件 1、案C と同じ穴の検出) |
| CANDIDATE-U-PACKINV-003 | hook の登録簿は `REQUIRED` × `claude` / `codex` で、`claude` の期待 invocation は `{ command: "node", args: wrapperHookArgs(id) }`、`codex` は `codexCommandString(wrapperHookArgs(id))` と完全一致する。この一致は `expected` と `excluded` の両方の hook に掛かる | (m1) manifest の `claude:work-guard` の args を `["hook","work-guard"]` (wrapper 抜き) にする → `hook-command-drift:hook:claude:work-guard`。(m2) `REQUIRED` に hook を 1 件足し manifest を更新しない → `registry-unclassified:hook:claude:<id>` と `registry-unclassified:hook:codex:<id>`。(m3) `excluded` の `codex:subagent-stop` の `command` を別の hook の文字列にする、または `command` を消す → `hook-command-drift:hook:codex:subagent-stop` (除外 hook の invocation 検査を外すと runner が同じ id を復元できない manifest が通り失敗) |
| CANDIDATE-U-PACKINV-004 | 除外の理由が無い・空文字・空白だけ・文字列でない、の各 1 軸変異で `exclusion-reason-missing:<kind>:<id>` が出て `ok=false`。他の finding を伴わない | (m) reason の検査を外す → 4 変異とも `ok=true` になり失敗 |
| CANDIDATE-U-PACKINV-005 | 登録簿に無い id を `excluded` に置くと `exclusion-stale`、`expected` に置くと `expected-not-in-registry` | (m) 実在検査を外す → 死んだ除外が残り `ok=true` で失敗 (設計 §2 条件 2) |
| CANDIDATE-U-PACKINV-006 | 同じ id を `expected` と `excluded` の両方に置く、または `expected` に 2 回置くと `classified-twice` | (m) 重複検査を外す → `ok=true` で失敗 |
| CANDIDATE-U-PACKINV-007 | `schema` 不一致、kind の欠落・余剰、配列でない、昇順でない、の各 1 軸変異で `manifest-invalid`。不正な JSON 値でも例外で落ちず finding で返る | (m1) kind 欠落を許す → 失敗。(m2) 例外を投げる実装 → 例外 assert で失敗 |
| CANDIDATE-U-PACKINV-008 | port index のどの行からも参照されない tracked file を `docs/templates/vmodel/` に 1 本足すと `registry-unclassified:template:vmodel-file:<path>`。`excluded` に理由付きで置くと解消する。`docs/templates/adapter/**` / `github/**` の file は `vmodel-file:` にはならず、CANDIDATE-U-PACKINV-017 の `setup:` / `setup-template:` で扱う | (m1) (c) の収集を外す → 足した file が見過ごされ失敗。(m2) (c) の収集範囲を `docs/templates/` 全体に広げる → adapter 雛形が `vmodel-file:` として正常形で `registry-unclassified` になり失敗 |
| CANDIDATE-U-PACKINV-009 | `AUTHORING_TEMPLATE_INVENTORY` に family `delivery inventory` があり、`validateAuthoringTemplateInventory` が `ok=true`。`git ls-files` から作った clean plan の `artifactPaths` に manifest が exactly once。manifest を入力 path から除くと `missingRequired` に `docs/templates/delivery/inventory.json` が載り `ok=false` (Pack から manifest が落ちる変異) | (m) family を足さない → manifest が allowlist 外で `artifactPaths` に出ず失敗 |
| CANDIDATE-U-PACKINV-010 | `inspectPackAuthoringEntries` は manifest が CRLF、mode `100755`、JSON として壊れている、§3 の形でない、の各変異で `line-ending:` / `mode:` / `parse:` の error を返す | (m) manifest を parse 対象に加えない → 壊れた manifest が `ok=true` で失敗 |
| CANDIDATE-U-PACKINV-017 | **adapter / GitHub 雛形の配送先対応** (設計 §4 template の (d) / (e))。実 repo の登録簿で、`COMMON_FILES` のうち雛形が tracked な entry ごとに `setup:<consumer 側の path>` が 1 件ずつあり (例: `setup:.claude/agents/qa-test.md`、`setup:.github/PULL_REQUEST_TEMPLATE.md`、`setup:.github/workflows/harness-check.yml`)、id にバックスラッシュを含まない。`docs/templates/adapter/**` / `github/**` の tracked file で `COMMON_FILES` から参照されないもの (`pack-harness-check.yml`、`team/*`) は `setup-template:<path>` として `excluded` に理由付きで置かれ、実 manifest で `ok=true` | (m1) `docs/templates/adapter/.claude/agents/<新規>.md` を tracked に足し `COMMON_FILES` に載せない → `registry-unclassified:template:setup-template:docs/templates/adapter/.claude/agents/<新規>.md`。(m2) manifest の template `expected` から `setup:.claude/agents/qa-test.md` を消す → `registry-unclassified:template:setup:.claude/agents/qa-test.md`。(m3) (d) / (e) の収集を外す → (m1) / (m2) が `ok=true` になり失敗。(m4) consumer 側の path を `path.win32.join` の結果のまま id にする → バックスラッシュを含む id の assert で失敗 |

## 4. consumer 側の oracle

| ID | oracle | 違反 / mutation (Red になるべき変異) |
| --- | --- | --- |
| CANDIDATE-U-PACKINV-011 | 正常形の consumer fixture で `observeConsumerInventory` → `diffDeliveryInventory` が `ok=true`、finding 0 件。除外 (hook 2 件、`setup-template:` 3 件) が観測されないことは差にならない。**無書き込み**: 記録つき stub が受けた `vmodel template` の argv はすべて `--dry-run` と `--json` を含み、観測の前後で consumer file 状態が同じ。verify phase は `doctor-consumer-profile` の後、`plan-authoring` の前に label `delivery-inventory` を transcript に残す | (m1) step を外す → transcript に label が無く失敗。(m2) `vmodel template` を `--dry-run` 無しで起動する → argv の assert で失敗し、stub が consumer に file を書くので前後の file 状態の比較でも失敗 (`consumer-head-drift-since-install` は verify の開始時だけの検査で、file の追加では HEAD も変わらないので oracle にしない) |
| CANDIDATE-U-PACKINV-012 | **hook が Pack から落ちる** (関数単体と verify phase を分ける)。関数単体: consumer の `.claude/settings.json` から `claude-memory-wake` の hook を 1 件除くと `observeConsumerInventory` → `diffDeliveryInventory` が `inventory-missing:hook:claude:claude-memory-wake`、`.codex/hooks.json` から `work-guard` を除くと `inventory-missing:hook:codex:work-guard`。verify phase: `claude-memory-wake` の欠落は `consumer-setup-smoke` の固定一覧に無いので doctor を通り、verify は `delivery-inventory-diff:1:...` で throw し、evidence の `delivery_inventory_result.ok` は false。`codex:work-guard` の欠落は固定一覧 (`SETUP_SMOKE_SHARED_INVOCATIONS`) にあるので、verify は `smoke-command-failed:doctor-consumer-profile` で先に失敗し、transcript に label `delivery-inventory` は無い (設計 §5 の実行順) | (m1) hook の観測を `consumer-setup-smoke` の固定一覧 (`SETUP_SMOKE_*`) で代用する → `claude-memory-wake` の欠落を見逃し失敗。(m2) 比較を `args` の部分一致にする → wrapper 抜きの hook を一致と誤認し失敗。(m3) 在庫比較を doctor より前に置く → `codex:work-guard` の欠落で失敗 step が `delivery-inventory` になり、順序の assert で失敗 |
| CANDIDATE-U-PACKINV-013 | **skill が欠ける**: consumer の `.ut-tdd/assets/skills/` から 1 本消すと `inventory-missing:skill:<path>`。manifest に無い file を 1 本足すと `inventory-unexpected:skill:<path>`。symlink を 1 本置くと `inventory-unexpected` | (m1) skill の観測を件数だけにする → 1 本消して 1 本足す変異で件数が一致し見逃して失敗。(m2) symlink を通常 file として数える → 失敗 |
| CANDIDATE-U-PACKINV-014 | **template / command が欠ける**: tar の path 一覧から `docs/templates/plan/impl/template.md` を除くと `inventory-missing:template:authoring:docs/templates/plan/impl/template.md`。`vmodel template --optional <id>` の stub を exit 1 にする、または 0 件 / 2 件を返すようにすると `inventory-missing:template:vmodel-optional:<id>`。`.claude/commands/` から 1 本消すと `inventory-missing:command:<name>` | (m1) vmodel を 1 回の起動の件数合計で判定する → 1 件欠落と 1 件重複の組で見逃して失敗。(m2) authoring を consumer root の file で探す → 正常形でも missing になり失敗 |
| CANDIDATE-U-PACKINV-015 | **除外の理由が無い manifest が tar に入っている**: tar から取り出した manifest の `excluded[0].reason` を空文字にすると、source 側の検査を経ていなくても runner が `inventory-manifest-invalid:hook:codex:claude-memory-wake` を返し throw する。**除外した hook が consumer にある**: consumer の `.codex/hooks.json` に manifest の `excluded` が持つ `codex:subagent-stop` の `command` と同じ文字列の hook を 1 件足すと、runner は source を import せずに id `codex:subagent-stop` を復元し `inventory-excluded-present:hook:codex:subagent-stop` を返す (doctor は追加 hook で失敗しないので、verify phase でもこの finding で throw する) | (m1) runner 側の manifest 再検査を外す → 空理由の除外で差が許され失敗。(m2) 除外を「観測されても可」と扱う → excluded-present が出ず失敗。(m3) hook の照合を `expected` の invocation だけにする → 足した hook が `unknown:codex:...` として `inventory-unexpected` になり、excluded-present の assert で失敗 |
| CANDIDATE-U-PACKINV-016 | install phase で manifest を tar から取り出せない (path 不在) と `delivery-inventory-unavailable` で失敗し、evidence に `delivery_inventory` が空のまま verify へ進まない。取り出せた場合、evidence の `delivery_inventory.sha256` は取り出した bytes の sha256 と一致する。finding は `code`・`kind`・`id` の昇順で、throw の message は先頭 20 件までを含む | (m1) 取り出し失敗を空 manifest として続行する → install phase が成功扱いになり、unavailable の assert で失敗。(m2) finding を観測順に出す → 順序 assert で失敗 |
| CANDIDATE-U-PACKINV-018 | **adapter / GitHub 雛形が consumer に届かない**: consumer から `.claude/agents/qa-test.md` を消すと `inventory-missing:template:setup:.claude/agents/qa-test.md`、`.github/PULL_REQUEST_TEMPLATE.md` を消すと `inventory-missing:template:setup:.github/PULL_REQUEST_TEMPLATE.md`。どちらも `consumer-setup-smoke` の固定一覧に無いので doctor を通り、verify phase は `delivery-inventory-diff:1:...` で throw する。通常 file を同名の symlink に置き換えると観測されず `inventory-missing` | (m1) `setup:` の観測を `SETUP_SMOKE_REQUIRED_FILES` で代用する → 2 件の欠落を見逃し失敗。(m2) `setup:` を観測しない (旧設計の「範囲外」) → 欠落が `ok=true` で通り失敗。(m3) symlink を通常 file として数える → 失敗 |

## 5. 実装後の検証接続

実装 PR では、Red (`it.fails`) を先に通常 commit し、Green → Refactor の順に進める (`skills/test-driven-development.md`)。
各 candidate を `U-PACKINV-*` へ同番号で昇格し、実テストの path と exact HEAD を PR に記録する。実 release を使った
受入 (AT-DIST-003 の canary) で `delivery-inventory` step が green であることは本書の oracle ではなく、release 受入の
証跡として扱う。
