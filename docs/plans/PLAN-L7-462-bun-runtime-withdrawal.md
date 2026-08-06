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
updated: 2026-08-06
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
  - artifact_path: src/lint/import-specifier.ts
    artifact_type: source_module
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

## 設計判断 (freeze 2026-08-06、advisor 諮問済み)

**採択: Node 24 ネイティブ type-stripping (`node src/cli.ts`)。** advisor
(implementation、`ut-tdd advisor --execute`、Codex frontier 利用上限のため
fallback = claude-fable-5、発火ログ 2026-08-06) が同方式を推奨し、前提を repo
実測で検証した上で採択する。

実測 (2026-08-06、基準 = 計測時点の main HEAD `11816bfd`。初版 freeze の数値は blind
review FLAG で是正済み — 過小計数 grep / `.js` 指定子クラスの欠落 / 基準 commit 不明。
対象 scope は **4 ディレクトリ全域 (src/ tests/ scripts/
.claude/hooks/)** — tests/ を除外しない):

- 拡張子なし相対 import **1319 行** (内訳: src/ + scripts/ + .claude/hooks/ = 755、
  tests/ = 564。Node ESM は拡張子必須で `ERR_MODULE_NOT_FOUND`)。根拠:
  `grep -rEn 'from "\.\.?/[^"]*"' src/ .claude/hooks/ scripts/ tests/ --include="*.ts" |
  grep -vc '\.ts"\|\.js"\|\.json"'` (alternation は BRE のため `\|`)。`.ts` 拡張子付き
  import は node 24.13.0 / bun 1.3.14 の両方で動作を実証済み。tsconfig へ
  `allowImportingTsExtensions: true` を追加する (noEmit 下で許可。
  `verbatimModuleSyntax: true` 既設のため型 import 残存の危険も既に封じられている)。
- **相対 `.js` 指定子が 219 行** (4 ディレクトリ、値/型全位置) 実在し、全て `.ts`
  実ファイルを指す (`find src -name "*.js"` = 0)。根拠:
  `grep -rEn '"\.\.?/[^"]*\.js"' src/ .claude/hooks/ scripts/ tests/ --include="*.ts" | wc -l`。
  うち 3 件は型位置の `import("./x.js").T` で strip 時に消えるが、指定子統一のため
  codemod で同様に `.ts` へ書き換える。node は `ERR_MODULE_NOT_FOUND`、bun は解決する
  ため bun 併用中は不可視の blocker。
- **parameter properties が概算 54 箇所 / 27 ファイル** (正確な scope は AC-5 /
  PR-B の strip-only gate が機械決定する概算値。tests/ scripts/ 含む、複数行
  constructor を含む計数)。初版 freeze の「18 箇所 / 13 ファイル」は 1 行 constructor
  のみの grep で、起票時と同種の grep 盲点を再生産していた (blind review A1)。根拠:
  `constructor\s*\(([^)]*)\)` を dotall で全 match し
  `(private|public|protected|readonly)\s+\w` を param 単位で計数。素の type-stripping
  は複数行形でも `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` で fail することを実走確認。
  `--experimental-transform-types` は通るが experimental flag を hook 恒久経路に
  置かない。→ 全 54 箇所を明示 field 代入へ機械是正し erasable-only を維持する。
- 変数引数の dynamic import / require: **0 件**。enum / namespace: **0 件**。
- node 起動実測: 0.138s (単一 `.ts` module + 相対 `.ts` import 1 本を `time node
  main.ts` で 1 回計測した wall-clock。hook timeout 5s に対し十分)。

対抗案と棄却理由:

- (b) tsx loader: 依存 +1、hook 5s 制約下で毎回 loader 起動を払い、erasable でない
  構文も通すため「Node type-stripping で動く」という本 PLAN の終状態検証を汚す。
- (c) esbuild prebuild: hook 経路にビルド段と stale-artifact 問題 (編集→ビルド忘れ
  →古い挙動) を持ち込み、fail-close 設計と相性が悪い。

**step 1 の PR 構成契約** (blind review B3 を反映し不変条件境界で分割):

- PR-A: tsconfig + import 指定子 codemod (拡張子なし 1319 行 + `.js` 指定子 219 行、
  **4 ディレクトリ全域 — tests/ を含む**) + 再流入 lint (「相対 import は実在する
  `.ts` ファイルを指す拡張子必須」— 拡張子なしだけでなく `.js` 指定子も fail-close、
  lint scope も同じ 4 ディレクトリ = AC-5 と一致)。gate と対象 codemod は同一 PR
  (分割すると全体赤化か再流入)。
- PR-B: parameter properties 54 箇所の erasable 化 + erasable-only 再流入 gate
  (全 `.ts` — tests/ 含む — を node strip-only で構文検証する回帰)。
- PR-C: hooks の `bun` → `node` 差し替え (PR-A/B の後)。

着工同期点条項 (#268 close 待ち) は 2026-08-06 の #268 merge により充足済み。
機械 diff は即 commit・即 push する。

- **配布バイナリ**: `bun build --compile` の代替は Node SEA か「bundle + node
  実行」の 2 案。配布 (Pack) は現在 no-go 中のため、本 PLAN では方式メモまで。

## Schedule (段階移行 — 事故った場所から順に Node へ)

- step 0 (前提、別 PLAN): PLAN-L7-460 = db-refresh の Node 経路固定 + Bun 起動
  fail-close。
- step 1 (serial、設計判断節の PR-A/B/C 構成に従う): まず code を Node 実行可能へ
  是正 (PR-A: import 指定子 codemod + 拡張子 lint、PR-B: erasable 化 +
  erasable-only gate)、その後 hooks 起動系の Node 化 (PR-C) — `.claude/settings.json`
  の全 hook を `node` 起動へ swap し、SessionStart / PostToolUse / Stop /
  SubagentStop の発火等価性を回帰で固定。console flash 抑止 (PR #125 系) と
  整合させる。
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
- AC-5: 全 `.ts` (src/ tests/ scripts/ .claude/hooks/) が node strip-only で構文
  解析可能であることを検証する回帰 gate が green (vitest は esbuild 経由で
  strip-only 違反を検出できないため独立 gate が必要 — blind review B2)。あわせて
  相対 import 指定子の再流入 lint (拡張子なし / `.js` 指定子の両方を fail-close)
  が green。
