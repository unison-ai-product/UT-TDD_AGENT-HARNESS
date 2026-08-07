---
plan_id: PLAN-L7-462-bun-runtime-withdrawal
title: "PLAN-L7-462 (troubleshoot): Bun runtime 撤退 — Node 一本化の段階移行 (PO 方針 2026-07-28)"
kind: troubleshoot
layer: L7
drive: agent
route_signal: incident
route_mode: incident
status: completed
created: 2026-07-28
updated: 2026-08-07
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
  - artifact_path: src/lint/import-specifier.ts
    artifact_type: source_module
  - artifact_path: tests/import-specifier.test.ts
    artifact_type: test_code
  - artifact_path: src/lint/erasable-syntax.ts
    artifact_type: source_module
  - artifact_path: tests/erasable-syntax.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-460-db-refresh-resource-guardrails.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - .ut-tdd/memory/project-incident-detached-stop-db-refresh-bun-runaway-locked-harness-db.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence:
  - reviewer: claude-opus-5
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-06T15:20:00+09:00"
    tests_green_at: "2026-08-06T15:10:00+09:00"
    verdict: approve
    scope: >-
      PR-A (import 指定子 codemod + 再流入 lint、PR #273) の blind review。Codex frontier
      利用上限中のため intra_runtime_subagent として記録 (cross_agent を僭称しない。上限解除後に
      Codex 側 cross review を取り直す)。経過: freeze 初版 FLAG (blocking 4) → errata FLAG
      (blocking 1) → 実装初回 FLAG (BL-1: scanner regex-literal desync、盲点 26/634) →
      TS AST 置換 + canary 全数回帰で PASS (blocking 0) → delta 追認 PASS 維持 (6702a692)。
      reviewer 側実測: canary mutation 634 全数 26→0、敵対入力 29 ケース、変更 7 ファイルの
      値保存分類、PR-A gate 実走 (specifiers 1531 / violations 0)。
    worker_model: claude-fable-5
    reviewer_model: claude-opus-5
    # green_commands は author 側実走 (reviewer 実測は scope 欄の列挙が正)。
    green_commands:
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts tests/import-specifier.test.ts tests/lint-wiring.test.ts tests/doctor-test-repository-isolation.test.ts tests/impl-plan-trace.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-06T15:10:00+09:00"
        evidence_path: src/lint/import-specifier.ts
        output_digest: "sha256:06fcceb1057a6db761142deea340b6e466ba1c5d7dc18b836aee6b3ef062d758"
        anchor_commit: 6702a692929b1639183616babe35cfc1968622cb
  - reviewer: claude-opus-5
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-07T00:30:00+09:00"
    tests_green_at: "2026-08-06T23:50:00+09:00"
    verdict: approve
    scope: >-
      step 2 (PR #277/#278/#279/#280/#281/#283) の blind review 累積。CI 構成契約 freeze の
      再審 FLAG 是正 (run-bun launcher 実態訂正 / bun 実発火 10 ファイル帰属 / exit criteria
      測定 gate) を経て PR #283 で closing PASS。Codex frontier 利用上限中のため
      intra_runtime_subagent (retake は Issue #252 で追跡)。
    worker_model: claude-fable-5
    reviewer_model: claude-opus-5
  - reviewer: claude-opus-5
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-07T15:40:00+09:00"
    tests_green_at: "2026-08-07T15:20:00+09:00"
    verdict: approve
    scope: >-
      step 3 (PR #284) の blind review 4 ラウンド + delta 追認。FLAG 原文と閉塞判定は
      .ut-tdd/review/plan-l7-462-step3-blind-review-flags.md に永続化。最終 PASS は
      HEAD ef27022b、delta 追認 PASS は merge HEAD cc3ed37f (CI run 31154290456 両 leg
      success を reviewer が独立確認)。reviewer 実測: 敵対 probe 31 ケース、pin 全数
      slack=0、実 repo lint ok=true checked=642、48 tests green。Codex frontier 利用上限中
      のため intra_runtime_subagent (retake は Issue #252 で追跡)。
    worker_model: claude-fable-5
    reviewer_model: claude-opus-5
---

# PLAN-L7-462 (troubleshoot): Bun runtime 撤退 — Node 一本化の段階移行

注: 実装 deliverable (.claude/settings.json / package.json / harness-check.yml /
run-vitest-snapshot.ts / runtime-portability.ts) は既存ファイルのため draft 段階の
generates には載せない (merged-plan-status / duplicate-artifact-ownership 対策)。
実装 PR で generates を更新し confirm と同時に宣言する。~~ADR-002 は step 4 の実装 PR で
宣言する (phantom 回避)。~~ **是正 (2026-08-07)**: ADR 新設は不要 — §完了記録の step 4 是正
注記を参照。前提 PLAN-L7-460 は
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

**step 2 の CI 構成契約 (freeze 2026-08-06、advisor 諮問済み — 案A 採択)。**
advisor (implementation、`gpt-5.6-sol`、`ut-tdd advisor --execute`、発火ログ
2026-08-06) の推奨どおり、CI は setup-node を harness の正式実行系とし、
**setup-bun は Pack/consumer acceptance テストの fixture 依存としてのみ併置残置**
する。理由 (repo 実測): `tests/distribution-acceptance.test.ts` (`runBun`) と
`tests/setup.test.ts` (U-SETUP-009b 系、`UT_TDD_BUN_BINARY`) の consumer wrapper
実発火 oracle は bun バイナリ実体を spawn しており、setup-bun を除去すると
oracle ごと赤化する。consumer templates (`src/setup/templates.ts` の run-bun.ts)
の launcher は既に node (`node:child_process` の `spawn(findBun(), ...)`) だが、
**bun を子プロセスとして PATH 解決・起動する契約** (`findBun()`) が残っており、
この bun 子プロセス契約の除去は Pack scope (no-go 中) への越境になるため本 PLAN
では行わない (Bun グローバル API 依存 1 ファイルの計数 (§設計判断冒頭) とは別物 —
あちらは `Bun.write` であり run-bun.ts template は Bun API を使わない)。

- AC-2 の「setup-node 構成」の解釈: **harness 実行系 (install / typecheck / db
  rebuild / doctor / test runner / cli 呼び出し) が node で起動されること**。
  bun 呼び出しは distribution/setup acceptance テスト内に限定され、workflow 上の
  setup-bun step に fixture 用である旨をコメント明記する。
- 対抗案と棄却理由: (B) 同 PR で consumer templates / acceptance oracle も node 化
  — Pack scope 外への越境 + PR 肥大 (スコープ規律違反) で棄却。(C) distribution 系
  テストの CI exclude — gate 弱体化で棄却。
- **setup-bun 撤去の exit criteria** (Pack 解禁時の後続 PLAN が declare する):
  consumer templates / wrapper / acceptance oracle から **bun 子プロセス起動と
  `findBun()` PATH 契約を除去**し終え、bun 実発火 spawn が repo から 0 件に
  なった時点で setup-bun step と `UT_TDD_BUN_BINARY` 契約を同時撤去する。
  「0 件」の測定 command:
  `grep -rEn '"bun"|\x27bun\x27|spawn.*bun|findBun' src/ tests/ scripts/ .claude/hooks/ package.json .github/workflows/ --include="*.ts" --include="*.yml" --include="*.json"`
  の実発火 spawn ヒット (文字列一致でなく spawn 引数として bun を渡す箇所) を
  人手判定でなく step 3 の runtime-portability lint 反転 (AC-3) が fail-close で
  数えることを終状態とする。残置 bun は PO 永久 BAN 決定 (Issue #134、
  「既存依存は migration debt として inventory 化し段階撤去」) の migration debt
  として本 PLAN と Issue #134 に帰属する — 完了状態への読み替えを禁止する。
- step 1 blind review 申し送りの帰属 (2026-08-06)。**bun 実発火サイトは計 10
  ファイル** (freeze 時実測、再審 blind review C1 で 2 サイト追補):
  - **step 2 で node 化する (harness 実行系の oracle / 起動系統、fixture 依存では
    ない)**: `tests/cli-surface.test.ts` / `tests/gate-static.test.ts` /
    `tests/update-check.test.ts` / `tests/write-encoding-guard.test.ts` の CLI
    実発火 launcher、`tests/secret-scan-diff.test.ts` の hook 実発火 spawn、
    `tests/global-setup-fence.test.ts:8` の snapshot runner 起動
    (`UT_TDD_BUN_BINARY ?? resolveBunBinary()`) — runner 本体の node 化
    (step 2 本文) と同時に追随する。加えて `.claude/hooks/session-log.ts:42` の
    後方互換 shim (`spawnSync("bun", [src/cli.ts, ...])`) — settings.json は
    step 1 PR-C で node swap 済みだが、この shim は settings.json 側の swap に
    覆われない (concept v3.1 と L6 design session-log.md が正本として記載する
    入口のため、shim 本体の spawn を node へ swap する)。
  - **fixture 例外 (setup-bun 残置の根拠、Pack 解禁時の後続 PLAN へ deferral)**:
    `tests/distribution-acceptance.test.ts` **全体** (runBun (:45-56) に加え
    :89/93 のテストが書き出す偽 `ut-tdd` shim も bun を exec する — 本ファイルは
    consumer/Pack acceptance oracle であり step 2 の node 化対象に含めない)、
    `tests/setup.test.ts` の U-SETUP-009b 系 (consumer wrapper の bun fallback
    実発火)、`src/cli/distribution.ts:113` の `bun --version` probe (Pack
    toolchain 検出、try/catch fail-soft — consumer 側 toolchain が bun である
    限り必要な検出であり、Pack 解禁時の後続 PLAN で bun 子プロセス契約と同時に
    撤去する)。
  `test:cli` が CI 未実行で `runtime-hook-entrypoints.test.ts` の Windows 面が
  gate 外である点は step 2 で windows leg の対象へ含めるか exclusion 理由を
  workflow へ明記する。

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
- step 4 (serial): ~~ADR-002 (Node runtime 一本化) を draft し ADR-001 の runtime
  節を supersede (言語 = TypeScript は不変)。PO 採択で confirm。~~
  **是正 (2026-08-07)**: ADR 新設は不要。ADR-001 の decision 節は 2026-07-24 改訂で
  既に「TypeScript (strict) / Node 24.13.0 正本 + Bun は新規禁止・既存は Issue #152/#134
  の期限付き migration debt」を宣言しており、本 PLAN の終状態はその実装である
  (新たな方式判断が発生していないため ADR の対象外)。また ADR-002 番号は
  ADR-002-dependency-direction-and-auto-map.md が既使用。step 4 の残作業は本完了記録の
  確定のみへ縮退した。

## スコープ外

- TypeScript 7 (ネイティブ tsc) への更新 — 別件 (typecheck 高速化)。
- vitest 自体の差し替え、Pack 配布バイナリの実装 (方式メモまで)。
- db-refresh の資源上限 (PLAN-L7-460 の責務)。

## AC

- AC-1: 全 hook が Node 起動で発火する回帰テストが green (SessionStart / Stop /
  PostToolUse の実発火 oracle、prose 主張禁止)。
- AC-2: CI 両 leg が setup-node 構成で green になった実 run URL を evidence として
  引用 (before = setup-bun 構成の直近 green run)。
- AC-3: 新規の bun: import / Bun グローバル参照 / **bun 実発火 spawn 引数**
  (`spawn`/`spawnSync`/`execFile*` 系の第 1 引数に bun を渡す箇所 —
  `src/lint/runtime-portability.ts` の既存 spawn 引数クラス検出器の拡張) が
  lint で fail-close する回帰テストが green (許可リスト方式の恒久 bypass は禁止。
  step 2 freeze の fixture 例外 3 サイトのみ、Issue #134 debt 帰属を明記した
  期限付き例外として扱う)。
- AC-4: db-refresh incident 系 oracle (PLAN-L7-460 の AC-1〜3) が移行後も green。
- AC-5: 全 `.ts` (src/ tests/ scripts/ .claude/hooks/) が node strip-only で構文
  解析可能であることを検証する回帰 gate が green (vitest は esbuild 経由で
  strip-only 違反を検出できないため独立 gate が必要 — blind review B2)。あわせて
  相対 import 指定子の再流入 lint (拡張子なし / `.js` 指定子の両方を fail-close)
  が green。

## 完了記録 (2026-08-07)

各 AC の evidence (falsifiable claim には根拠 run / PR を引用、`coding ≠ substance`):

- **AC-1** (hook の Node 起動実発火): PR #278 (hooks node 化) + PR #279 (実発火 helper の
  node 直 spawn 化、blind review BL-2 追随)。oracle は
  `tests/runtime-hook-entrypoints.test.ts` / `tests/hook-native-launcher.test.ts`。
- **AC-2** (CI setup-node 構成 green): GitHub Actions run **31100893368** /
  **31140910029** (step 2、linux/windows 両 leg success)。setup-bun は
  distribution/setup acceptance fixture 依存として注記付き残置 (§step 2 の CI 構成契約)。
- **AC-3** (bun 再流入 fail-close): PR #284 (merge squash 4d500690)。
  `bun-runtime-spawn` (間接形 5 クラス含む) / `bun-module-import` /
  `bun-global-reference` (typeof / globalThis / process.versions.bun 形含む) の 3 ルール +
  count-pin 化 debt allowlist (pin 全数 slack=0 を reviewer 実測)。回帰 =
  U-RPORT-015〜018。恒久 bypass 面の残課題 (同数 swap の静的不可視) は限界注記 +
  Issue #134 後続 (AST 化) へ帰属。
- **AC-4** (db-refresh incident 系 oracle): PLAN-L7-460 の AC oracle は step 2/3 の CI
  run (上記 AC-2 / merge run 31154290456) に含まれ green 維持。
- **AC-5** (strip-only gate + import 指定子 lint): PR #273 (PR-A codemod + lint) /
  PR #277 (PR-B erasable 化 + strip-only gate)。oracle は
  `tests/import-specifier.test.ts` / `tests/erasable-syntax.test.ts`。

step 3 の blind review 証跡 (FLAG 原文 4 ラウンド分) は
`.ut-tdd/review/plan-l7-462-step3-blind-review-flags.md`。process note: PR #284 の merge
実行は delta 追認 verdict の受領と近接しており、merge 操作は Codex 側で行われた
(verdict 自体は同 HEAD cc3ed37f で PASS、CI run 31154290456 success を独立確認済み)。
