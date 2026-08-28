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

### 3.3 BAN 検出側 lint

`src/lint/runtime-portability.ts` / `src/lint/github-ci-policy.ts` / `src/lint/rule-drift.ts` /
`src/lint/toolchain-pin.ts` の Bun 参照は **BAN を検出し fail-close する側**である。
撤去すると gate が消える。本 PLAN では不変とする。

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
よって **AC3 は本 PLAN の Scope 外** (Issue #450 の Slice 2) である。

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

**S1-b → S1-a → S1-c**。前提が閉じる前に下流を着工しない。

理由: 生成物から Bun が消えて初めて readiness の Bun 要求が無意味になり、
Pack/consumer acceptance fixture が Bun 非依存になって初めて CI の `setup-bun` を落とせる。

各 slice は 1 PR = 1 論点とし、exact-head CI と非著者 review receipt を個別に閉じる。

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

## 6. 不変条件

1. consumer readiness は Bun の有無に依存しない。
2. setup が生成した consumer tree に Bun 実行子への到達経路が存在しない。
3. source repo の `build` script は本 PLAN では不変である。
4. BAN 検出側 lint の Bun 参照は本 PLAN では不変である。

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
