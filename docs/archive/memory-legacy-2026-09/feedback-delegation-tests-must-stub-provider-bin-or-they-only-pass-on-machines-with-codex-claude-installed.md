---
memory_id: memory:feedback:delegation-tests-must-stub-provider-bin-or-they-only-pass-on-machines-with-codex-claude-installed
kind: feedback
title: "delegation tests must stub provider bin or they only pass on machines with codex claude installed"
tags: ["ci", "delegation", "fail-close", "machine-dependence", "testing"]
updated_at: 2026-07-31T10:58:52.941Z
---

`ut-tdd codex|claude` の delegation コマンドを **in-process で叩く単体テストは、書き方を誤ると
開発機でだけ green になる**。2026-07-31 に PR #212 の CI (linux / windows 両方) で実測。

## 機序

1. `detectMode()` は codex / claude を **実 spawn する** (`isProviderCommandSpawnable` が
   `<bin> --version` を `spawnSync` し exit 0 を要求、`src/runtime/adapter.ts:304`)。
2. provider CLI が無い機械 (CI runner) では mode = `standalone`。
3. `providerAvailable()` は **mode だけ**で決まる (`codex` は `codex-only` / `hybrid` のときのみ true)
   → `buildAdapterPlan().available` が false。
4. delegation の action は `!plan.available` のとき **stderr へ落として stdout へ何も書かない**
   (`src/cli/delegation.ts:222`)。
5. その空 stdout を `JSON.parse` に渡すと `SyntaxError: Unexpected end of JSON input` になり、
   **真因 (provider 不在) が完全に隠れる**。

**Why:** codex/claude が入っている開発機ではローカル 19/19 green が得られてしまう。これは
「テストが通った」のではなく「環境の副作用で通った」だけで、[[feedback-verification-principles]] の
coverage ≠ substance と同型の偽陽性である。CI が別環境だから暴けた。

## How to apply

- delegation / mode 検出を経路に含むテストでは、`UT_TDD_CODEX_BIN` (または `UT_TDD_CLAUDE_BIN`) へ
  **exit 0 のスタブ**を差して mode を機械非依存に固定する。既存作法は
  `tests/cli-surface.test.ts` の `writeFakeProvider` + `UT_TDD_CODEX_BIN`。env は `afterAll` で復元し、
  temp dir を削除する。
- `JSON.parse(capturedStdout)` の前に **空 stdout を診断可能な例外で落とす**。`SyntaxError` に
  化けさせない。
- 一般則として、**単体テストの中で外部 AI CLI を実起動させない**。起動していること自体が
  非決定性の兆候。
- ローカル green と CI 赤が食い違ったら、まず **「自分のテストが環境に依存していないか」** を疑う。
  インフラ障害と決めつけない (PR #208 では実際にインフラ障害だったが、#212 は実障害だった)。
