---
plan_id: PLAN-L7-05-biome-debt
title: "PLAN-L7-05 (refactor): repo 既存 biome 負債を解消し harness-check CI に biome lint を有効化 (機能変更なし、113 test green 維持が安全網)"
kind: refactor
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
backfill_required: false  # refactor 機能不変 (dead code 削除 + biome --write、契約/挙動の変更なし) → KIND_BACKFILL conditional で Reverse 不要。doctor backfill 行は note のみ。
agent_slots:
  - role: tl
    slot_label: "TL — 機能不変 (113 test green 維持) / dead code 削除の妥当性 (g3-trace 陳腐化 regex) / useLiteralKeys が TS strict と非競合 / CI biome 有効化のレビュー (claude-only は code-reviewer 代替)"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
github_issue_id: null
generates: []
dependencies:
  parent: null
  requires: []
  blocks: []
---

# PLAN-L7-05 (refactor): repo 既存 biome 負債を解消し CI に biome lint を有効化

## §0 位置づけ

`harness-check.yml` が negative carry として無効化していた **biome lint** を有効化するため、その前提である **repo 既存 biome 負債を解消する** Refactor (機能変更なし)。負債は当初想定 (`cli.ts` / `detect.ts` / `g3-trace.ts` / `entity-coverage.ts` / `forced-stop.ts` / `setup.test.ts`) より広く、全 scan で `src/setup/index.ts` / `src/runtime/session-log.ts` / `src/schema/frontmatter.ts` / `tests/{schema,forced-stop,session-log,handover}.test.ts` も対象だった (計 13 ファイル、project pinned biome = `npm run lint` で確認。当初 `npx biome` 最新版での「CLEAN」判定は版差による誤りだった)。

- 駆動モデル: **Refactor** (kind=refactor、L7 実装スプリント、機能不変)。
- 安全網: **既存 113 test + typecheck 0 を不変に保つ** = 振る舞い不変の機械保証。biome violation 0 が達成条件。
- 効果: biome を CI Required gate (集約 harness-check) の subjob に追加でき、style drift を機械強制できる (§6.9)。

## §1 負債インベントリと対応方針 (pinned biome)

| rule | 件数 | 該当 | 対応 | 安全性 |
|------|------|------|------|--------|
| `lint/style/useTemplate` | 6 | cli.ts | 文字列連結 → テンプレリテラル (auto-fix) | 振る舞い等価 |
| `lint/complexity/useLiteralKeys` | 3 | detect.ts | `process.env["X"]` → `process.env.X` (auto-fix) | **tsconfig に `noPropertyAccessFromIndexSignature` 無し (strict のみ) → ドット記法は TS 合法**。typecheck 0 が gate |
| `lint/correctness/noUnusedVariables` | 5 | g3-trace.ts | **dead 定数 5 本 (FR_L1_REGEX/FR_L3_REGEX/AC_REGEX/AT_REGEX/NFR_REGEX) を削除** | 各定数の参照回数=1 (定義のみ)。実マッチングは行 61/70/85… の**より厳密な inline regex** (表行・見出しアンカー付き) を使用 = 定数は陳腐化。削除で振る舞い不変 (rewire しない) |
| `lint/complexity/useOptionalChain` | 1 | (auto 検出) | optional chain 化 (auto-fix) | 振る舞い等価 |
| `format` | 3 | entity-coverage.ts / g3-trace.ts 他 | biome format (auto-fix) | 整形のみ |
| `assist/source/organizeImports` | 複数 | cli.ts / forced-stop.ts / setup.test.ts / schema.test.ts / session-log.test.ts | import 並べ替え (auto-fix) | 整形のみ |
| `lint/correctness/noUnusedImports` | 1 | handover.test.ts | 未使用 import 削除 (auto-fix) | 振る舞い不変 |
| 追加検出 | — | setup/index.ts (useLiteralKeys+format) / schema.test.ts (useLiteralKeys) / frontmatter.ts (format) / forced-stop.test.ts / session-log.test.ts (format) | 全 scan で判明 (初期インベントリ外)。auto-fix | 整形/等価 |

> **判断ポイント (TL review 対象)**: ① g3-trace.ts の 5 定数削除 — noUnusedVariables の biome auto-fix は `_` prefix だが、本件は**陳腐化 dead code ゆえ削除が正** (inline regex が現行の正しいロジック、定数とは pattern が異なる)。② detect.ts useLiteralKeys — `process.env.X` が TS strict で通ること (tsconfig 無 `noPropertyAccessFromIndexSignature`) を typecheck で実証。

## §工程表

### Step 1: auto-fix (safe + unsafe-but-equivalent)
`./node_modules/.bin/biome check --write --unsafe <対象ファイル>` で useTemplate / useLiteralKeys / useOptionalChain / format / organizeImports を一括修正 (g3-trace の noUnusedVariables は除外し手動削除)。**pinned biome 本体を使う** (npx 最新は版差で不可)。

### Step 2: g3-trace.ts dead 定数を手動削除
FR_L1_REGEX / FR_L3_REGEX / AC_REGEX / AT_REGEX / NFR_REGEX (+ doc コメント) を削除。inline regex は不変。

### Step 3: 振る舞い不変の検証 (安全網)
`npm run typecheck` (0) + `npx vitest run` (**113 pass 不変** = 機能変更なしの機械保証) + `npm run lint` (**biome 0**)。

### Step 4: CI に biome subjob 追加 — **PO 判断で deferred (2026-06-04)**
`.github/workflows/harness-check.yml` に `bun run lint` step を追加する変更は実装・ローカル commit まで行ったが、**push に workflow スコープ token が必要** ([[project_github_push_workflow_scope]]) で、PO が「今はいらない」と判断したためローカル commit を破棄し **deferred** とした (§4 carry)。biome 負債解消 (Step 1-3) は完了・push 済 (`27efe75`) なので、`bun run lint` ローカル実行で品質は担保される。CI 有効化は token 入手時に follow-up。

### Step 5: review (review 前置 MUST)
`code-reviewer` で 機能不変 (113 green) / dead code 削除の妥当性 / useLiteralKeys 非競合 / CI 配線をレビュー。cross-agent 不在を evidence 記録。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| 負債インベントリ | `npm run lint` (pinned biome) の rule×file 集計 (2026-06-04) |
| g3-trace dead 定数の判定 | 定数参照回数=1 + inline regex (行 61/70/85/106/125/136) が現行ロジック = 定数陳腐化 |
| detect.ts useLiteralKeys 安全性 | `tsconfig.json` (strict のみ、noPropertyAccessFromIndexSignature 無) → ドット記法 TS 合法 |
| CI biome 配線 | `.github/workflows/harness-check.yml` 既存 negative carry コメント + `package.json` lint script |
| 振る舞い不変の安全網 | 既存 113 test (refactor = 機能変更なし、全 green 維持が DoD) |

## §3 成否

- `npm run lint` (pinned biome) = **violation 0** ✅ (push 済 `27efe75`)
- `npm run typecheck` = 0 / `npx vitest run` = **113 pass 不変** (機能変更なしの機械保証) ✅
- `harness-check.yml` の biome subjob 追加 = **deferred** (PO 判断 2026-06-04、workflow スコープ token 未入手、§4 carry)
- code-reviewer review APPROVE (機能不変 / dead code 削除妥当 / useLiteralKeys 非競合) ✅
- 旧 carry「repo 既存 biome 負債解消」をクローズ。「CI 有効化」は carry へ繰り越し

## §4 carry

- **CI biome subjob 有効化 (deferred)**: `harness-check.yml` に `bun run lint` step を足す変更は確定済だが、`.github/workflows` の push に workflow スコープ PAT が必要 ([[project_github_push_workflow_scope]])。PO が「今はいらない」と判断 (2026-06-04)。token 入手時に follow-up commit で有効化する (repo は既に biome CLEAN なので即 green)。
- §6.3 の branch-type subjob (commitlint / poc-no-merge-guard / hotfix-postmortem-required) は別 PLAN (本 PLAN は biome subjob のみ)。
