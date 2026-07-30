---
plan_id: PLAN-L7-462-bun-runtime-withdrawal
title: "PLAN-L7-462 (troubleshoot): Bun runtime 撤退 — Node 一本化の段階移行 (PO 方針 2026-07-28)"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
status: draft
created: 2026-07-28
updated: 2026-07-28
backprop_decision: not_required
backprop_decision_reason: "Harness 自身の実行 runtime の差し替えであり、製品の外部 requirement / design / test-design 契約は変えない。言語は TypeScript のまま (ADR-001 の言語選定は不変、runtime 節のみ改訂対象)。"
owner: PM / PO
agent_slots:
  - role: aim
    slot_label: "AIM - TS 実行方式 (type-stripping / tsx / prebuild) と移行順序の設計判断"
  - role: tl
    slot_label: "TL - hook 起動系統の等価性と lint 反転 (fail-close 境界) のレビュー"
  - role: se
    slot_label: "SE - hooks / scripts / CI / snapshot runner の Node swap 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md
    artifact_type: markdown_doc
  - artifact_path: docs/adr/ADR-002-node-runtime-unification.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-460-db-refresh-resource-guardrails.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - .ut-tdd/memory/project-incident-bun-session-db-refresh-runaway-on-2026-07-27.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-462 (troubleshoot): Bun runtime 撤退 — Node 一本化の段階移行

注: 実装 deliverable (.claude/settings.json / package.json / harness-check.yml /
run-vitest-snapshot.ts / runtime-portability.ts) は既存ファイルのため draft 段階の
generates には載せない (merged-plan-status / duplicate-artifact-ownership 対策)。
実装 PR で generates を更新し confirm と同時に宣言する。前提 PLAN-L7-460 は
draft のため requires の ready 条件を満たさず references 扱い (実装順序は
Schedule step 0 で拘束)。

## 背景 (PO 方針 2026-07-28「Bun はトラブル多いから差し替えたい」)

Bun 起因・Bun 関与のトラブルが反復している:

1. session db-refresh 暴走 (2026-07-27 incident、working set 4.55GB / harness.db
   4.57GB、Bun 起動 detached プロセス)。
2. Windows での `.cmd` spawn の CI 盲点 (`bun.cmd` 経由 spawn の挙動差)。
3. Windows console flash (hook 起動時の shell ホスト、PR #125 対応中)。
4. Windows SQLite handle 解放遅延 (CI windows leg のコメントに明記)。

## 移行コストの実測 (2026-07-28)

差し替えは当初想定より軽い。コードベースは runtime-portable 設計が既に入っている:

- SQLite: `src/state-db/index.ts` が **bun:sqlite / node:sqlite の二重ドライバ**
  (PLAN-L7-45)。`runtime-portability` lint が両ドライバ可視を機械強制、
  `test:node-fallback` 回帰も既備。
- Bun グローバル API 依存は 1 ファイル (`src/doctor/test-repository-isolation.ts`)。
- Node 24.13.0 導入済み。src/scripts に enum / namespace / decorator /
  tsconfig paths は **0 件** (grep 実測) → Node 24 ネイティブ type-stripping で
  TS を直接実行できる (bundler / loader 依存を増やさない選択肢が現実)。

残る結合は entrypoint 層のみ: package.json scripts (`bun run` / `bun build
--compile`)、`.claude/settings.json` hooks (`bun src/cli.ts ...`)、CI
(`setup-bun` / `bun install --frozen-lockfile` / `bun x vitest`)、
`scripts/run-vitest-snapshot.ts` の `bun.cmd` spawn。

## R3 spike: Bun 依存点の全数棚卸し (機械導出、2026-07-30)

順序契約 (`.ut-tdd/memory/project-po-forward-d0-pr-train-order-2026-07-30-codex-pr-handling.md`
S2 / 改訂 2 の R3) の第一タスク「修理でなく実測」を、散文でなく **enumerator + 実 repo 回帰**で
固定した。実装は `src/lint/bun-dependency-inventory.ts`、oracle は
`tests/bun-dependency-inventory.test.ts`。

**件数・総数を本文に書かない** (#146 の `total: 848` ハードコードと同型のずれの再発防止)。
内訳は次で導出する:

```
bunInventoryMessages(analyzeBunDependencies(loadBunDependencyDocs(repoRoot)))
```

### 依存点表 (surface → 撤退 step)

surface カタログは enumerator 側 (`BUN_SURFACES`) と本表の**双方向**で照合される
(`crossCheckPlanSurfaces`、孤児 0 / step 不一致 0 を回帰で fail-close)。片側だけの追加は赤。

| surface | 対象 | 主な結合の型 | 撤退 step |
| --- | --- | --- | --- |
| `claude-hooks` | `.claude/settings.json` の hook command / `.claude/hooks/*` | execution (`run-bun.ts` shim 経由の native Bun 起動、shebang) | `step-1` |
| `package-scripts` | `package.json` の scripts / engines | execution (`bun run` / `bun build --compile`) + toolchain (`engines.bun`) | `step-2` |
| `ci-workflow` | `.github/workflows/*` | toolchain (`setup-bun` / `bun install`) + execution (`bun src/cli.ts`) | `step-2` |
| `os-entrypoint` | `scripts/ut-tdd` / `scripts/ut-tdd.ps1` | execution (thin wrapper の Bun 解決と起動) | `step-2` |
| `test-runner` | `scripts/run-vitest-snapshot.ts` | execution (Bun binary 解決 / spawn) + api (`Bun.which` / `Bun.gc`) | `step-2` |
| `git-hook` | `scripts/git-hooks/*` | execution (pre-push dispatcher と scanner の shebang) | `step-2` |
| `lockfile` | `bun.lock` / `bunfig.toml` | toolchain (Bun 固有 lockfile) | `step-2` |
| `core-source` | `src/**` | api (`bun:sqlite` 動的 require / `globalThis.Bun` 特徴検出) + policy (Bun 前提を機械強制している lint) | `step-3` |

### 分類 (coupling) の定義

- `execution`: Bun バイナリ / Bun runtime が実際に起動される。Node 一本化を**直接ブロック**する。
- `api`: `bun:` builtin module の読み込み、または `Bun.*` グローバルの実呼び出し。
- `toolchain`: インストーラ / lockfile / CI セットアップ / Bun 版要件。
- `policy`: 文字列リテラル・コメント上の言及 (lint の期待値や検出テーブル)。実行経路ではない。
- `unclassified`: 上のどれでもない Bun 言及。**hook / CI / entrypoint / runner 面では fail-close**
  (棚卸し漏れを無音で通さない)。`src/` は policy 既定 (api / execution / toolchain 検出が先に当たる)。

### 実測で判明した本 PLAN 自身の誤り (errata)

1. 上記「移行コストの実測」節の「Bun グローバル API 依存は 1 ファイル
   (`src/doctor/test-repository-isolation.ts`)」は**誤り**。同ファイルの `Bun.write` 出現は
   AST 検出テーブルの**文字列リテラル**であり実呼び出しではない (`policy`)。実際の Bun
   グローバル / モジュール結合は `scripts/run-vitest-snapshot.ts` (`Bun.which` / `Bun.gc`) と
   `src/state-db/index.ts` (runtime 判定 + `nodeRequire("bun:sqlite")`) にある。
   回帰: 「検出テーブルの文字列を api と誤判定しない」「動的 `bun:` require を api と数える」。
2. `bun:sqlite` は **static import ではなく runtime 分岐越しの動的 require** であり、
   `from "bun:` 系 grep では 0 件に見える。撤退手順を grep 前提で書くと取り落とす。
3. hook 面は既に `.claude/hooks/run-bun.ts` shim (native `bun.exe` 探索 + spawn) を経由する。
   step 1 の作業対象は個々の hook 行ではなく **shim 1 点**であり、shim を Node 起動へ置換すれば
   hook 面の execution 結合はまとめて落ちる (settings.json の args は shim を指しているため)。
4. 分類器自身の実測で潰した誤検出: `ubuntu-latest` / `AuthoringBundle` / 正規表現内
   `\bunimplemented` の部分一致。token 境界 + camelCase 境界のみを認める検出に修正済み
   (回帰ケースあり)。散文の grep 件数を棚卸しの根拠にしてはならない実例。

### 撤退順序の fail-close 境界 (step ごと)

- `step-1` (`claude-hooks`): shim を Node 起動へ置換後、`claude-hooks` surface の `execution`
  件数が **0 へ落ちる**ことを oracle にする (現状 > 0 を主張する回帰があるので、撤退完了時に
  この assertion を反転させる = 完了判定が機械側に残る)。
- `step-2` (`package-scripts` / `ci-workflow` / `os-entrypoint` / `test-runner` / `git-hook` /
  `lockfile`): CI 両 leg green の実 run URL を evidence とし、同 surface 群の `execution` /
  `toolchain` が 0 になることを oracle にする。`bun.lock` 削除は `package-lock` 移行と同一 PR。
- `step-3` (`core-source`): `runtime-portability` の Bun 要求 (`package-missing-bun-engine` /
  `package-missing-compiled-build` / `sqlite-driver-fallback-missing`) を反転する前に、
  `api` 件数 0 を先に満たす (逆順にすると二重ドライバが消える前に lint が緩む)。
- `step-4` (ADR-002): 上記 3 step の oracle が green の状態でのみ confirm へ上げる。

### 本 slice に含めないもの (境界の明示)

- hook / CI / entrypoint の実際の Node 化 (step 1-2 の実装)。本 slice は read-only 実測のみ。
- `runtime-portability` lint の反転 (step 3)。現状 lint は Bun を**要求**しており、棚卸しと
  同時に反転すると撤退前に fail-close が緩む。
- `docs/` の Bun 言及の是正 (PR #182 が扱った面)。走査面は runtime surface に限定する。

## 設計判断 (TL レビューで確定、実装前)

- **TS 実行方式**: 推奨 = Node 24 ネイティブ type-stripping (`node src/cli.ts`)。
  理由: 依存追加ゼロ・ビルド段不要 (enum 等の blocker 0 件を実測済み)。
  対抗: (a) tsx loader (依存 +1、erasable でない構文も通る)、(b) esbuild
  prebuild (起動最速だがビルド段が hook 経路に入る)。採択は PLAN 設計判断節へ記録。
- **配布バイナリ**: `bun build --compile` の代替は Node SEA か「bundle + node
  実行」の 2 案。配布 (Pack) は現在 no-go 中のため、本 PLAN では方式メモまで。

## Schedule (段階移行 — 事故った場所から順に Node へ)

- step 0 (前提、別 PLAN): PLAN-L7-460 = db-refresh の Node 経路固定 + Bun 起動
  fail-close。
- step 1 (serial): hooks 起動系の Node 化 — `.claude/settings.json` の全 hook を
  `node` 起動へ swap し、SessionStart / PostToolUse / Stop / SubagentStop の
  発火等価性を回帰で固定。console flash 抑止 (PR #125 系) と整合させる。
- step 2 (step 1 の後、serial): scripts / snapshot runner / CI の swap —
  package.json scripts、`run-vitest-snapshot.ts` の spawn 系統、CI の
  setup-bun → setup-node + lockfile 移行 (bun.lock → package-lock)。CI 両 leg
  green の実 run URL を evidence 化。
- step 3 (step 2 と並列): `runtime-portability` lint の反転 — 「bun:sqlite 併記
  必須」を「node:sqlite 主・bun 依存の新規追加 fail-close」へ更新し、Bun 残滓の
  再流入を機械で止める。Bun グローバル API 1 ファイルの置換もここ。
- step 4 (serial): ADR-002 (Node runtime 一本化) を draft し ADR-001 の runtime
  節を supersede (言語 = TypeScript は不変)。PO 採択で confirm。

## スコープ外

- TypeScript 7 (ネイティブ tsc) への更新 — 別件 (typecheck 高速化)。
- vitest 自体の差し替え、Pack 配布バイナリの実装 (方式メモまで)。
- db-refresh の資源上限 (PLAN-L7-460 の責務)。

## AC

- AC-1: 全 hook が Node 起動で発火する回帰テストが green (SessionStart / Stop /
  PostToolUse の実発火 oracle、prose 主張禁止)。
- AC-2: CI 両 leg が setup-node 構成で green になった実 run URL を evidence として
  引用 (before = setup-bun 構成の直近 green run)。
- AC-3: 新規の bun: import / Bun グローバル参照が lint で fail-close する回帰
  テストが green (許可リスト方式の恒久 bypass は禁止)。
- AC-4: db-refresh incident 系 oracle (PLAN-L7-460 の AC-1〜3) が移行後も green。
