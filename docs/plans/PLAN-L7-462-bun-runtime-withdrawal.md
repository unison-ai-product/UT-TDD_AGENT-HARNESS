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
updated: 2026-07-29
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
  - artifact_path: docs/adr/ADR-010-node-runtime-unification.md
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

## 位置付け (決定事項であり選好ではない)

Bun 撤退は **PO 決定 2026-07-22「Bun は永久 BAN」** の実行であり、方針検討ではない
(正本 = issue #134 `Redesign: retire Bun and migrate control plane to TypeScript/Node + Rust`、
共有 memory `user-po-bun-permanent-ban-node-rust-target`、ADR-001 は改訂済みで Bun を
新規依存・fallback・検出器 runtime として禁止済み)。本 PLAN は #134 の段階移行を担う
実行計画であり、採否を再検討する PLAN ではない。2026-07-29 errata: 旧記述は背景を
「PO 方針 2026-07-28 (差し替えたい)」とだけ書き、決定日・issue #134 に接続していなかった。

## 背景 (反復した Bun 起因トラブル)

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
  **2026-07-29 実測で判明した反転対象 (この step の必須内訳)**: 現行
  `src/lint/runtime-portability.ts` は Bun を *強制* しており、決定と逆を向いている。
  `package-missing-bun-engine` (`engines.bun` 欠落を error)、build script への
  `bun build --compile` 要求 (`:122`)、git hook dispatcher を「thin bun dispatcher」と
  要求 (`:306`)。この 3 点を反転しない限り、Bun を外した瞬間にゲート自身が赤化して
  撤退が機械的に不可能になる。
- step 4 (serial): ADR-010 (Node runtime 一本化) を draft し ADR-001 の runtime
  節を supersede (言語 = TypeScript は不変)。PO 採択で confirm。
  2026-07-29 errata: 旧 generates は `ADR-002-node-runtime-unification.md` を宣言して
  いたが `ADR-002-dependency-direction-and-auto-map.md` が既存で **番号衝突**していた。
  空き番号は ADR-010 (001〜009 使用済み、実測)。

## 記述の先行禁止 (2026-07-29、実測にもとづく errata の境界)

決定事項の明示 (「Bun は永久 BAN、新規採用禁止」) と、**現状記述の Node 化**は別物である。
後者を撤去 slice より先に doc へ書くと、doc が実装について嘘をつく。2026-07-29 に一度
やってしまい、CI が 5 テストで検出した (`U-SETUP-004b2` / `U-SETUP-011e` /
`U-MODELID-SSOT (b)` / `github-ci-policy` / doctor aggregate baseline)。

実測 (この repo、2026-07-29):

- `npm ci` — `package-lock.json` が存在しない (lockfile は `bun.lock` のみ) ため不成立。
- `npm test` — `package.json` の `test` script が `bun run test:vitest-snapshot` へ委譲。
- `node src/cli.ts` — `ERR_MODULE_NOT_FOUND` (extension-less import) で起動しない。

したがって次の 3 面は **Schedule の該当 slice と同一 PR でしか書き換えない**:

1. `docs/templates/github/common/*.yml` (consumer へ配られる実 CI。先行させると壊れた
   workflow を配布する) — `BUILTIN_GITHUB_TEMPLATES` の mirror と同時。
2. `docs/test-design/**` の oracle 行 (実装済み挙動の記述であり、願望を書く場所ではない)。
3. README / governance の**コマンド例** (読者がそのまま実行する)。

方針の宣言 (「禁止」「撤去対象」「PLAN-L7-462 で段階撤去中」) は現時点で真なので、
本 PR のように先行して書いてよい。区別の基準は「今日 shell で叩いて通るか」。

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
- AC-5: `runtime-portability` の Bun 強制 3 点 (`package-missing-bun-engine` /
  `bun build --compile` 要求 / thin bun dispatcher 要求) が反転され、Bun 非依存の
  package.json + hook 構成で doctor が green になる回帰テストが存在する
  (「反転した」という prose ではなく、実 repo 構成に対するゲート実行を証跡とする)。
