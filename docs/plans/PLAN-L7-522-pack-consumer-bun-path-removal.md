---
plan_id: PLAN-L7-522-pack-consumer-bun-path-removal
title: "PLAN-L7-522 (add-impl): Pack/consumer 実行面の Bun 到達経路撤去"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-28
updated: 2026-08-28
owner: PM / PO / Claude
parent_design: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
next_pair_freeze: L7
transition_direction: design_to_implementation
implementation_disposition: none
github_issue_id: 450
agent_slots:
  - role: se
    slot_label: "SE - 生成 template / readiness / CI から Bun 経路を撤去し Node 経路へ差し替える"
  - role: qa
    slot_label: "QA - Bun 不在 consumer の readiness、生成 tree の到達経路 0、negative control を実測する"
  - role: tl
    slot_label: "TL - L6-93 §5 の削除禁止条項との境界と、BAN 検出側 lint の不変性を非著者検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
  requires:
    - PLAN-L6-101-pack-independent-multi-consumer-acceptance
  blocks: []
  references:
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    - docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/134
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/450
review_evidence: []
---

# PLAN-L7-522: Pack/consumer 実行面の Bun 到達経路撤去

## 1. 目的

Pack/consumer の**実行面**から Bun 到達経路を 0 にする。対象は `ut-tdd setup` の readiness 判定、
setup が consumer リポジトリへ生成する成果物、および source repo の CI が Pack/consumer acceptance
fixture のために導入している Bun である。

source repo の `package.json` `build` script (`bun build src/cli.ts --compile`) には**触らない**。
理由は §3 に記す。

本 PLAN は Issue #450 の bounded slice であり、canonical parent は Issue #134 である。
Issue #418 (Pack-only internal canary smoke) の HARD predecessor に当たる。

## 2. 実測インベントリ (`origin/main` `ebda2a21`)

撤去対象は以下に限る。いずれも実測で位置を確定している。

### 2.1 setup が consumer へ生成する成果物

| 位置 | 内容 |
|---|---|
| `src/setup/templates.ts:234` | `#!/usr/bin/env bun` (hook shim の shebang) |
| `src/setup/templates.ts:270-296` | `common/run-bun.ts` — `findBun()` / `bun.exe` 探索 / `spawn(findBun(), …)` |
| `src/setup/templates.ts:699-703` | 上記を `.ut-tdd/bin/run-bun.ts` として配置 |
| `src/setup/templates.ts:624-646` | 生成 consumer CI の `oven-sh/setup-bun@v2` / `bun install --frozen-lockfile` / `bun .ut-tdd/bin/ut-tdd.mjs github guard` / `bun run typecheck` / `bun run test` |
| `src/setup/templates.ts:604` | 案内文の `bun run typecheck` / `bun run lint` |
| `src/setup/distribution.ts:217` | 生成 `package.json` の `"test": "bun run test:pack"` |

**初版のインベントリは不完全だった** (Issue #450 §A をそのまま写したため)。#470 の実装が
`CANDIDATE-U-PACKBUN-003` を実走したところ、生成 tree に 4 件の Bun 到達が残った
(2026-08-28 実測、`.claude/commands/ut-tdd-test.md` / `.claude/settings.json` /
`.codex/hooks.json` / `package.json`)。**contract freeze の目的どおり実装前に検出された**ので、
インベントリを次で補完する。

| 位置 | 内容 |
|---|---|
| `docs/templates/adapter/.claude/settings.json` | hook launcher 引数 `".ut-tdd/bin/run-bun.ts"` ×7 |
| `docs/templates/adapter/.codex/hooks.json` | 同 ×5 |
| `docs/templates/adapter/.claude/commands/ut-tdd-test.md:8` | 案内文の `bun run typecheck` / `bun run lint` |
| `src/setup/distribution.ts:207-223` | `transformCleanDistributionArtifact` が source の `scripts.build` (`bun build src/cli.ts --compile`) を生成 `package.json` へ**素通し**している |

`templates.ts` の文字列表だけを撤去しても、**生成された hook は存在しない launcher を指したまま**に
なる。したがって launcher 契約の consumer である次の 2 つも同一 PR で追随する
(これは BAN 検出側 lint ではなく hook launcher 契約であり、§3.3 の保護対象ではない):

- `src/lint/project-hook.ts:69` `WRAPPER_HOOK_LAUNCHER = ".ut-tdd/bin/run-bun.ts"`
- `src/doctor/setup-smoke.ts:20, 32, 79` — 同 launcher の存在と起動形を検査している

### 2.1.1 設計判断: 生成 `package.json` の `build` script は**生成時に落とす** (採択)

`transformCleanDistributionArtifact` は source の `package.json` を写して consumer 用へ変換するため、
`PLAN-L6-93` §5.2 が source repo で維持を義務づけている `"build": "bun build src/cli.ts --compile"` が
生成 tree へそのまま流れ込む。これは #450 AC2 (生成 tree の Bun reachable path 0) に反する。

**source の `build` script は不変のまま、`transformCleanDistributionArtifact` が生成成果物から
`scripts.build` を除去する。** これで L6-93 §5.2 の削除禁止 (source 側) と #450 AC2 (生成側) は
両立し、どちらの契約も改訂を要さない。両者が衝突して見えたのは、保護対象が source の script であり
生成物の script ではないことを区別していなかったためである。

consumer は Pack から配布された成果物を使うのであって `bun build` で自作しないので、
生成 tree に `build` script が存在する必然性は無い (`PLAN-L6-93` §5.3 の実測:
「Pack 配布は `dist/` を運ばず、consumer 経路は `bun build` に一切到達しない」と整合する)。

### 2.2 setup の readiness gate

| 位置 | 内容 |
|---|---|
| `src/setup/distribution.ts:251` | `hasMinimumBun(version, "1.3.0")` |
| `src/setup/distribution.ts:330-332` | check 名 `bun>=1.3`、不在時 `Install Bun 1.3 or newer before setup` |
| `src/setup/distribution.ts:373` | `ok: bunOk && input.hasGit && …` — **Bun 不在で readiness 全体が false** |
| `src/setup/distribution.ts:354-357` | 案内文が native Bun launcher を前提 |
| `src/setup/distribution.ts:386-402` | 推奨コマンド列が `oven-sh/setup-bun@v2` / `bun install` |
| `src/cli/distribution.ts:138-197` | `bun --version` probe (win32 は ComSpec 経由)、`~/.bun/bin` 探索、`bunVersion` 供給 |

### 2.3 source repo の CI

| 位置 | 内容 |
|---|---|
| `.github/workflows/harness-check.yml:68, 189` | `oven-sh/setup-bun@v2` ×2 (コメントは「Pack/consumer acceptance fixture のみ」) |

## 3. 非 Scope (撤去してはならないもの)

### 3.1 `package.json` の `build` script

`PLAN-L6-93` §5.2 は次を freeze している:

> **維持**: `package.json` の `build` script (`bun build --compile`)。**§5.4 の 2 receipt
> (sealed build receipt と Node parity receipt) が双方とも成立するまで** rollback 手段として保持する。
> **片側成立での撤去は禁止**であり、撤去境界は §5.4 が唯一の正本である。

§5.4 は 2 receipt の存在だけでは不十分とし、`subject_revision` / `generation_id` /
`artifact_digest` / `retirement_subject` の 4 要素 tuple が完全一致することを要求する。
部分一致による撤去は `CAND-NODEBOOT-023` が fail-close する。

本 PLAN はこの条件を成立させないので、`build` script に触れない。

### 3.2 producer 実装

`buildNodeGeneration` / `publishActivation` / `loadNodeGeneration` は `PLAN-L6-93` が所有し、
`implementation_target` は `PLAN-L7-458` である。本 PLAN では実装しない。

### 3.3 BAN 検出側 lint — 保護対象は「検出能力」であり、条文の逐語不変ではない

`src/lint/runtime-portability.ts` / `src/lint/github-ci-policy.ts` / `src/lint/rule-drift.ts` /
`src/lint/toolchain-pin.ts` の Bun 参照は **BAN を検出し fail-close する側**である。
撤去すると gate が消える。

**ただし「これら 4 file の Bun 参照を一切変更しない」は過剰であり、S1-c の正しい実装を Red にする。**
本 PLAN の初版はここを誤っていた (PR #469 の非著者 review、canonical receipt
`47144e188043136d08552df64a8147b32069af8a7885b5d26b2ffa553b58c52f` の指摘により是正)。
file ごとに扱いが異なるので分けて契約する。

| file | 現状 (2026-08-28 実測) | 本 slice での扱い |
|---|---|---|
| `github-ci-policy.ts` | `:143` / `:156-160` / `:334` が `oven-sh/setup-bun@v2` / `bun install --frozen-lockfile` / `bun run typecheck` / `bun run test:pack` / `bun run lint` を **required step として要求**している | **S1-c で追随変更する。** `setup-bun` を撤去すれば required step 側は必ず Red になる。要求側だけを Node 経路へ差し替え、**検出側 (Pack CI が raw vitest を使うことの deny 等) は減らさない** |
| `runtime-portability.ts` | `:478-485` の debt allowlist は `seen > pinned` で違反にする **上限 pin** であり、Bun 参照が減る方向は自由 (`:100` が明示) | **追随変更不要。** S1-b が debt を減らしても Red にならない |
| `rule-drift.ts` / `toolchain-pin.ts` | 生成物・readiness・source CI のいずれも参照していない | **不変** |

**保護する不変条件は「Bun を検出して fail-close する能力が減らないこと」**であり、条文の逐語一致ではない。
検出能力を落とす変更 (deny rule の削除、allowlist への新規 path 追加、pin 値の引き上げ) は本 slice の全 PR で禁止する。

**ただし件数・集合・数値だけでは「同数のまま matcher を弱める」変更を検出できない** (例: deny rule の
本数を保ったまま正規表現を緩める)。したがって検出能力は **behavioral に測る**: 既知の Bun 到達
サンプル集合を lint へ入力し、**各サンプルが依然として fail-close されること**を要求する。
件数・集合・pin の比較はこの behavioral 検査の補助であって代替ではない
(PR #469 の delta review、canonical receipt
`d7f287eef4f52be8e5fa917ccefd28c78a894ea4687692853a9b48001efb8f5f` の指摘により追加)。

**サンプル集合は実装時判断に流さず、ここで freeze する** (同 review 2 巡目、canonical receipt
`e421a78ac7e43088…` の指摘)。未収載の matcher 分岐が残れば、その分岐の同数弱体化は Green のまま通るためである。

| # | sample (Bun 到達形) | lint | rule | 由来 |
|---|---|---|---|---|
| 1 | `spawnSync("bun", args)` (`bun.exe` / `bun.cmd` 各形を含む) | `runtime-portability.ts` | `bun-runtime-spawn` | `BUN_SPAWN_PATTERN` 分岐 1 |
| 2 | `findBun(` | 同 | 同 | 分岐 2 (撤去する `run-bun.ts` の中核) |
| 3 | `?? "bun"` | 同 | 同 | 分岐 3 |
| 4 | `"/c", "bun"` | 同 | 同 | 分岐 4 (win32 ComSpec 経路) |
| 5 | `["bun", [` | 同 | 同 | 分岐 5 |
| 6 | `exec bun` | 同 | 同 | 分岐 6 |
| 7 | `"bun:sqlite"` | 同 | `bun-module-import` | `BUN_IMPORT_PATTERN` |
| 8 | `Bun.write(` | 同 | `bun-global-reference` | `BUN_GLOBAL_PATTERN` 分岐 1 |
| 9 | `typeof Bun` | 同 | 同 | 分岐 2 |
| 10 | `).Bun` | 同 | 同 | 分岐 3 |
| 11 | `globalThis.Bun` | 同 | 同 | 分岐 4 |
| 12 | `process.versions.bun` | 同 | 同 | 分岐 5 |
| 13 | Pack CI step が `vitest run` を直接呼ぶ workflow | `github-ci-policy.ts` | `forbidden_raw_vitest` (`:182-185`) | 検出側 (S1-c で触らない) |
| 13b | Pack CI step が `bun run test` (`test:pack` ではない) を呼ぶ workflow | `github-ci-policy.ts` | `forbidden_source_full_tests` (`:186-190`) | 同上。`13` とは別 rule なので別サンプルが要る |
| 14 | adapter doc の Hooks 節が `bun` / `bunx` / `bun.cmd` / `bun.exe` を実行指示する | `rule-drift.ts` | `bun execution form` marker | |
| 15 | `package.json` と `bun.lock` の direct graph 不一致 | `toolchain-pin.ts` | `bun-direct-parity-drift` | |

**網羅性は「期待 violation の凍結」で測る。分岐の機械列挙は要求しない。**

006 の目的は **検出能力の低下 (weakening) を検出すること**であって、将来追加される分岐まで覆うことでは
ない。両者を混同すると機構が肥大する。上表の 16 サンプルは **期待 violation (lint / rule / 件数) ごと
凍結**し、oracle は実行結果が凍結値と一致することを要求する。

この形で閉じる経路:

- **分岐の削除** — 対応サンプルが violation を出さなくなり Red。
- **同数のままの matcher 緩和** — 同上。件数が変わらなくても、その分岐を刺激するサンプルが
  落ちるので Red。
- **rule の削除 / allowlist への path 追加 / pin 引き上げ** — 同上。

**既存 rule への分岐追加は weakening ではない** (検出が増えるだけ) ので、006 が Red になる必要はない。
新分岐がサンプル未収載でも、その分岐は本 slice が依拠していないものであり、保護対象ではない。

したがって PR #469 delta review 3 巡目 (canonical receipt `99b1e8a0f24beaed…`) が求めた
「lint に matcher を export させ、`source` を alternation 分解して分岐単位の網羅を assert する」は
**採らない**。理由は 2 つある。

1. **目的に対して過剰である。** weakening 検出には期待 violation の凍結で十分であり、export 追加と
   正規表現の構文解析は `docs/governance/coding-rules.md` の最小実装原則に反する。
2. **保護対象の lint を触る要求になる。** §3.3 は BAN 検出側 lint を本 slice で変更しない前提であり、
   oracle の都合で protected file に export を足すのは順序が逆である。

**現時点の分岐網羅は上表の「由来」列が担保する。** `BUN_SPAWN_PATTERN` の 6 分岐、
`BUN_GLOBAL_PATTERN` の 5 分岐、`BUN_IMPORT_PATTERN`、および述語 rule の各 reason を
`src/lint/` から実測して 1 対 1 で対応付けた (2026-08-28)。これは一度きりの導出であり、
将来 lint 側に分岐が増えた場合の追随は本 slice の責務ではない (増加は weakening ではないため)。

## 4. 設計判断: Issue #450 受入条件 3 の読み替え

### 4.1 前提

Issue #450 の受入条件 3 は次のとおり:

> `dist/ut-tdd` 相当の sealed runtime を **Node のみ**で生成できることの実測
> (`package.json:31` の置換)。

「置換」は §3.1 が禁じる「撤去」に読める。かつ撤去条件の成立には `buildNodeGeneration` producer が
必要であり、producer は現在 `origin/main` の `src/` に存在しない
(`git grep -l "NodeBootstrapReceipt\|buildNodeGeneration" origin/main -- src/` = 0 件)。
したがって AC3 は定義上 producer 完成前に閉じられない。

### 4.2 検討した選択肢

| 案 | 内容 | 評価 |
|---|---|---|
| A | `PLAN-L6-93` を confirm し producer を実装してから AC3 を閉じる | 契約整合。ただし本 slice の外 |
| B | 境界を縮小し source 側の Bun build debt を許容する契約改訂 | §5.2 が既に「維持」を freeze しているため、実質は現行契約そのもの。改訂は不要 |
| C | build backend を Node SEA (`--experimental-sea-config` + postject) へ差し替えて循環だけ先に切る | **不可**。`buildNodeGeneration` の責務が sealed generation 生成そのもの (§1) であり、§5.4 の tuple を経ずに `build` script を触ると `CAND-NODEBOOT-023` が fail-close する。実装 PR 内のビルド方式発明は PR スコープ規律 §2 違反 |

### 4.3 採択

**A を採る。** AC3 は「`bun build` を削除する」ではなく
「Node-only の sealed generation 経路を `buildNodeGeneration` として実装し、§5.4 の 2 receipt +
tuple 一致を成立させる」と読む。`package.json` の実削除は条件成立後の別 commit とする。
よって **AC3 は本 PLAN の Scope 外** (Issue #450 の Slice 2 = child Issue #473) である。

根拠: §5.4 が「撤去境界は §5.4 が唯一の正本である」と自ら宣言しており、既存の責務境界から
一意に決まる。PO 判断を要さない。

### 4.4 advisor 相談記録

`ut-tdd advisor --decision design --current-model claude-opus-5 --execute`
(provider=claude / model=`claude-fable-5`) で相談した。回答は当初の「循環しているので C で先に切る」
という見立てを 2 点で反証した:

1. AC1 は sealed runtime を要求していない (`bunOk` 撤去のみ)。循環は `PLAN-L7-516` 実装 PR の
   `(sealedRuntime ? true : bunOk)` という設計選択の産物であり構造的制約ではない。
2. C は A の代替にならない (§4.2 の C 欄の理由)。

この 2 点を repo 実測で検証したうえで採択した。Issue #450 のコメントで Codex lane も
同一の読み替えを承認している (2026-08-28)。

## 5. 実装順序契約

### 5.0 拘束する順序: **S1-b → S1-c** のみ

`S1-c` は「`setup-bun` を除いても Pack/consumer acceptance fixture が Green」(AC4) を要求するので、
fixture が Bun 非依存になっている必要がある。それを与えるのが `S1-b` である。
**これが唯一の実在する依存**であり、契約として拘束する。

**`S1-a` は順序自由である。** `S1-a` の readiness 契約 (`bunOk` 撤去 → Node 検査) は生成 tree の
状態を前提にせず、`S1-a → S1-b → S1-c` でも AC1 / AC2 / AC4 と全 oracle が成立する。
実在しない依存を順序契約にしない (本 PLAN の初版はここを過剰拘束していた。PR #469 の非著者 review、
canonical receipt `5b16bfc6d1921ac1e83712f10b39716c0410a24baa57be79e6430da2a81cc70e` の指摘により是正)。

### 5.1 推奨順序 (拘束しない): S1-b を S1-a より先に置く

`S1-a` を単独で先に landing させると、**readiness が `ok: true` を返すのに生成された hook は
まだ Bun を要求する**中間状態が発生する。Bun 未導入の consumer から見ると
「setup は通ったのに hook が動かない」という形になり、readiness の主張が実態とずれる。

これは oracle の成否ではなく利用者から見た整合性の問題なので、**推奨に留め契約にはしない**。
`S1-a` を先に出す場合は、この中間状態が存在することを PR に明記すること。

### 5.2 共通

各 slice は 1 PR = 1 論点とし、exact-head CI と非著者 review receipt を個別に閉じる。

### 5.3 slice ↔ child Issue 束縛

`#450` は親 Epic として維持し、各 slice を GitHub の正式な sub-issue として所有する
(`docs/governance/github-issue-hierarchy.md` §3。本文の `Parent: #N` は親子関係の代替にしない)。

| slice | child Issue | owner | requires | blocks |
| --- | --- | --- | --- | --- |
| S1-b (生成成果物) | #470 | Claude lane | なし | #472 |
| S1-a (readiness) | #471 | Claude lane | なし (順序自由、§5.0) | PR #463 の rebase (§S1-a) |
| S1-c (source CI) | #472 | Claude lane | #470 | なし |
| Slice 2 (Node producer / `build` script 撤去) | #473 | Claude lane (Opus contract gate; bounded workerは規定router) | `PLAN-L6-93` §5.4 tuple 成立 | なし |

`#450` は上記 4 child が全て close し、かつ親固有 AC (AC1〜AC4 の統合証跡) が揃うまで close しない。
Slice 2 (#473) は本 PLAN の対象外であり (§4.3)、`PLAN-L6-93` → `PLAN-L7-458` 系列が契約と実装を所有する。

### S1-b: 生成成果物から Bun を撤去

§2.1 の全項目を対象とし、置換先は Node/npm 経路とする。

### S1-a: readiness から Bun 検査を撤去

§2.2 の全項目を対象とし、`hasMinimumBun` / `bunOk` を撤去して
`engines.node` 準拠の node バージョン検査 + git 検査へ差し替える。

`PLAN-L7-516` の実装 PR (#463) が `src/setup/distribution.ts` に導入した
`(sealedRuntime ? true : bunOk)` は、本 slice で `bunOk` 自体が消えるため競合する。
**S1-a を正とし、S1-a merge 後に #463 側を最新 main へ rebase して Node readiness へ畳む。**
#463 側で S1-a の責務を重複実装しない (Issue #450 で Codex lane と合意済み)。

### S1-c: source CI から `setup-bun` を撤去

§2.3 の 2 箇所を撤去する。`package.json` の `build` script は §3.1 により不変。

**`src/lint/github-ci-policy.ts` の required step を同一 PR で追随変更する** (§3.3)。
`setup-bun` を workflow から消しながら lint が `setup-bun` を要求したままにすると必ず Red になるため、
撤去と追随は分離できない。追随は required step 側に限り、検出側の deny rule には触れない。

## 6. 不変条件

1. consumer readiness は Bun の有無に依存しない。
2. setup が生成した consumer tree に Bun 実行子への到達経路が存在しない。
3. source repo の `build` script は本 PLAN では不変である。
4. BAN 検出側 lint の **Bun 検出能力**は減らない (§3.3)。`github-ci-policy.ts` の required step は
   S1-c で Node 経路へ追随変更するが、deny rule の削除・allowlist への path 追加・pin 引き上げは行わない。

## 7. 完了条件

- [ ] S1-b / S1-a / S1-c の 3 PR がいずれも exact-head CI Green と非著者 canonical receipt を持つ
- [ ] 対の test-design の候補 oracle が正規 ID へ昇格し、`oracle-test-trace` が Green
- [ ] 不変条件 1〜4 が §8 の oracle で機械実測されている
- [ ] Issue #418 の HARD 条件との突き合わせ結果が記録されている

## 8. 検証

対の test-design は `docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md`。
候補 oracle は `CANDIDATE-U-PACKBUN-001..006` を宣言する。
prefix `U-PACKBUN` が既存 registry と衝突しないことは
`grep -o "U-PACKBUN-[0-9]*" docs/test-design/harness/L7-unit-test-design.md` が 0 件であることで
確認した (2026-08-28 実測)。

## 9. 非証明事項

本 PLAN の confirm は pair-freeze の確定のみを意味し、S1-b / S1-a / S1-c の実装、
producer 実装 (Slice 2)、Issue #418 の受入、`package.json` `build` script の撤去を意味しない。
