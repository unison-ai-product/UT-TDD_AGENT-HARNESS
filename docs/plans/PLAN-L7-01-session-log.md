---
plan_id: PLAN-L7-01-session-log
title: "PLAN-L7-01 (add-impl): session-log 実装 — hook 3本 + src/runtime/session-log.ts + 単体テスト (U-SLOG)"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-02
updated: 2026-06-12
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-12"
    tests_green_at: "2026-06-12"
    verdict: approve_after_fixes
    scope: "L7 completion audit A-135: U-SLOG artifacts exist, target tests and full npm test green, G4/G7 codex-only checklist review passed with .ut-tdd/audit/A-135-l7-completion-review-checklist.yaml."
parent_design: docs/design/harness/L6-function-design/session-log.md
agent_slots:
  - role: tl
    slot_label: "TL — 実装/型/fail-open のレビュー (claude-only は code-reviewer 代替)"
  - role: qa
    slot_label: "QA — U-SLOG テスト戦略 (L7 impl 必須 role §1.8)"
generates:
  - artifact_path: src/runtime/session-log.ts
    artifact_type: source_module
  - artifact_path: .claude/hooks/session-log.ts
    artifact_type: source_module
  - artifact_path: tests/session-log.test.ts
    artifact_type: test_code
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-03-session-log.md
  requires:
    - docs/plans/PLAN-L6-03-session-log.md
  blocks: []
---

# PLAN-L7-01 (add-impl): session-log 実装

## §0 位置づけ

`PLAN-L6-03-session-log` (add-design) の ① 機能設計 + ③ 単体テスト設計 (U-SLOG-001〜005) を ② 実装 + ④ テストコードに落とす add-impl。**Add-feature 標準ライフサイクル 経路 B (add-feature.md §1.1)** の impl 段階。完了後、後段 `PLAN-REVERSE-NN` で L3 要件へ back-fill する。

- 親設計: `docs/design/harness/L6-function-design/session-log.md` (parent_design 必須、§1.1.parent_design)。
- パターン: agent-guard (hook shim + 純粋関数分離)。ただし **fail-OPEN** (常に exit 0)。
- drive=fullstack (親 add-design 一致)。

## §工程表

### Step 1: src/runtime/session-log.ts (② 本体)
型 (SessionEvent/PlanDigest/SessionLogDeps) + `sanitize` / `summarize` / `resolveActivePlan` / `recordEvent` / `compressPlanDigest` / `onSessionStart` / `onPostToolUse` / `onStop` / `dispatch`。I/O・clock・branch を deps 注入。`compressPlanDigest` は純関数・session-guard で idempotent。

### Step 2: tests/session-log.test.ts (④、TDD Red→Green)
U-SLOG-001〜005 を vitest 化 (③ 設計 L7-unit-test-design.md §1.5)。deps mock で I/O/now 注入。fail-open (不正入力で throw せず 0) を検証。

### Step 3: .claude/hooks/session-log.ts (hook shim)
bun entry。stdin JSON 読取 → `hook_event_name` で dispatch → 常に exit 0 (fail-open)。argv fallback。

### Step 4: 配線
`.claude/settings.json` に SessionStart / PostToolUse(Edit|Write|MultiEdit|Bash) / Stop を登録 (**blockOnFailure なし = fail-open**)。`.gitignore` に `.ut-tdd/logs/` 追加。`.claude/CLAUDE.md` の active hook 記述を更新 (guard + session-log)。

### Step 5: review (self-review 前置 MUST)
`code-reviewer` (TL 代替) で実装/型/fail-open/idempotency をレビュー。cross-agent 不在を記録。

### Step 6: 命名テスト + 全回帰
`npx vitest run`。U-SLOG 全 pass + 既存 72 緑維持。

## §実装計画

| 項目 | 情報源 |
|------|--------|
| 関数 signature / DbC / pseudocode | parent_design `session-log.md` §3-§4 |
| hook shim (stdin→dispatch、fail-open) | 既存 `.claude/hooks/agent-guard.ts` パターン (ただし exit 0 化) |
| deps 注入 (I/O/now/branch) | agent-guard の純粋関数分離 + session-log.md §3 SessionLogDeps |
| settings.json 登録形 | session-log.md §5 (hook_event_name 分岐) |
| gitignore 規約 | 既存 `.ut-tdd/audit/*.jsonl` / `state/*` の gitignored 規約 |

## §6 用語更新 (§G.9)

L6 (PLAN-L6-03) で導入した セッションログ / PLAN ダイジェスト / fail-open hook / active PLAN 解決 を実装語として確定 (新規語なし、L6 定義を踏襲)。

## §7 成否

- src/runtime/session-log.ts + .claude/hooks/session-log.ts + tests/session-log.test.ts 揃い、U-SLOG-001〜005 全 pass
- 既存 72 テスト緑維持、fail-open (ログ失敗で作業を止めない) を test で実証
- settings.json で 3 hook activate (blockOnFailure なし)、.gitignore に logs/
- code-reviewer self-review APPROVE (Critical 0)
- 後段 `PLAN-REVERSE-NN-session-log` (fullback, forward_routing=L3) で L3 要件 back-fill へ接続

## §8 carry (self-review = GO-with-fixes 反映 + 残)

**本 session 修正済**: I-2 (commit target=undefined で commits 汚染防止) / I-1 (同一バッチ同一 session multi-event テスト追加) / I-3+M-1 (設計 session-log.md を impl に整合: branch fallback 突合なし・event_counts Partial)。

**carry (G7 後の通常保守 or Reverse 段で確認)**: M-2 (SessionStart で session_id 欠落時の uuid fallback、Claude Code hook spec 要確認) / M-4 (safeName コメントに percent-encode 明記) / M-5 (CLAUDE_PROJECT_DIR fallback の agent-guard との非対称コメント) / commit hash の実取得 (現状 commits は取得可能時のみ=空)。

**別件 finding (本 feature 外)**: `npm run lint` (biome) が既存ファイル (cli.ts useTemplate / detect.ts useLiteralKeys / g3-trace.ts unused var / entity-coverage.ts/frontmatter.ts format / schema.test.ts organizeImports) で fail。repo 全体の biome 負債 → 別途 Refactor PLAN で解消すべき (improvement-backlog)。
