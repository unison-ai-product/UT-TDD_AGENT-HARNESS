---
memory_id: memory:feedback:pr-478-exact-head-8a7dd2c1-claude-opus-closing-pass-weak-blocking-0--491d50b257c4
kind: feedback
title: "PR #478 exact-head 8a7dd2c1 Claude Opus closing PASS-WEAK blocking 0"
tags: ["claude-review", "closing-verdict", "pr"]
updated_at: 2026-08-31T05:59:11.028Z
---

# PR #478 non-author Claude Opus closing verdict

- exact_head: `8a7dd2c1817152658f5f5ffcffe89977c27d2c03`
- base: `7cc607722ef78340c4b71020d38b04e8bc10f1da`
- reviewer: Claude Opus (non-author closing gate)
- verdict: PASS-WEAK
- blocking: 0
- 備考: 既存の Sol PASS は codex family。author family も codex のため、cross-review 契約
  (§委譲と判断層) を満たす non-author 判定は本 receipt 側である。

## 確認したこと

- `src/setup/templates.ts` から `common/run-bun.ts` テンプレートと `COMMON_FILES` 登録を
  完全に撤去。hook 配線は全て `node` + `wrapperHookArgs(...)` の直接起動になり、
  `WRAPPER_HOOK_LAUNCHER` の参照は `project-hook.ts` / `codex-hook-adapter.ts` の
  両方から消えている (残骸参照なし)。
- 生成 wrapper `common/ut-tdd.mjs` は shebang が `#!/usr/bin/env node` になり、
  `spawnSync(process.execPath, ...)` + `windowsHide: true` を保持している。
  生成物側の Bun reachable path は 0。
- 生成 CI template (`common/harness-check.yml`) は `oven-sh/setup-bun` →
  `actions/setup-node@v4` (`24.13.0`, `cache: npm`) + `npm ci --no-audit --no-fund` へ、
  実行行も全て `node .ut-tdd/bin/ut-tdd.mjs` / `npm run` へ置換済み。
- `transformCleanDistributionArtifact` は `scripts.test` を `npm run test:pack` にし、
  `scripts.build` (`bun build --compile`) を生成 tree から delete する。source 側の
  build script は PLAN-L6-93 §5.2 の rollback 手段として残るので、保護対象と削除対象の
  切り分けはコメントどおり成立している。
- `tests/ban-lint-detection-power.test.ts` の U-PACKBUN-006 は
  `BUN_SPAWN_DEBT_ALLOWLIST` (8 entry) / `BUN_IMPORT_DEBT_ALLOWLIST` (2) /
  `BUN_GLOBAL_DEBT_ALLOWLIST` (8) の **path と pin 値**を lint source text から
  再構成して凍結する。entry 追加・削除・pin 緩めのいずれも Red になり、恒真ではない。
- `BUN_SPAWN_DEBT_ALLOWLIST` から `src/setup/templates.ts:2` と
  `tests/hook-native-launcher.test.ts:1` を pin ごと削除したのは正しい。実サイトが 0 に
  なった pin を残すことは再流入 2 サイトを黙認する穴になる。

## non-blocking 1: doctor smoke の検出能力が落ち、コメントが実装より広く主張している

`src/doctor/setup-smoke.ts` の旧 `native-bun-launcher-contract` は
`windowsHide: true` / `realpathSync` / `!shell: true` / `!spawnSync` の 4 条件を検査していた。
新 `wrapper-launcher-contract` は `spawnSync` を含むことと `shell: true` を含まないことの
2 条件のみである。

- `realpathSync` (canonical path) は wrapper が `process.execPath` を直接起動する形になった
  ため検査対象として妥当に消滅した。ここは指摘しない。
- 一方 `windowsHide: true` は **wrapper template に現存する生きた性質**であり
  (`src/setup/templates.ts` の `common/ut-tdd.mjs`)、本 PR 以降どの check もこれを
  assert しない。将来 `windowsHide` が落ちても gate は Green のままになる。
- さらに直前のコメントは「shell-free / canonical-path の契約は wrapper 自身に対して測る」と
  書くが、実装は canonical-path を測っていない。CLAUDE.md Coding Rules の
  「誤解を招くコメントを負債として残さない」に反する。

本 PR 自身が allowlist pin について「pin の緩みは検出能力の低下である」と正しく述べている
以上、同じ基準を doctor check にも適用すべきである。修正は
`ok: !!wrapper?.includes("spawnSync") && wrapper.includes("windowsHide: true") && !wrapper.includes("shell: true")`
の 1 行とコメント訂正で足りる。

## non-blocking 2: 外側 process の signal 転送が失われている

旧 `run-bun.ts` は非同期 `spawn` + SIGINT/SIGTERM/SIGHUP 転送 + `process.kill(process.pid, signal)`
の再送出を持ち、旧 doctor check は `!launcher.includes("spawnSync")` でこの形を守っていた。
新経路では最外殻が `spawnSync` になるため、この明示的転送は無くなる。POSIX では Ctrl-C が
process group 全体へ届くため実害は小さく、`stdio: "inherit"` の同期 wrapper は標準的な形なので
blocking にはしない。ただし旧 check が守っていた性質が意図的に放棄されたことは記録が要る。

## 判定理由

生成 tree (Issue #450 AC2) は Bun reachable path 0 で成立しており、allowlist 凍結 oracle も
反証可能である。上記 2 件は将来の再流入検出力に関する指摘で、現時点の成果物の正しさを
壊さないため blocking にしない。authorized non-author merger による merge 可。
Codex scheduler の self-merge は不可。
