---
memory_id: memory:feedback:pr-469-github-ci-policy-invariant-contradicts-s1c
kind: feedback
title: "PR #469 FLAG: github-ci-policy invariant contradicts S1-c"
tags: ["bun-ban", "contract", "flag", "pr-469", "s1-c"]
updated_at: 2026-08-28T07:35:00+09:00
---

PR #469 exact HEAD `bcbe58adabc56cbee8aecc403bbb290d1f85be67` の先行実装可能性監査で、
既存の owner blocking に加えて契約上の blocking 1 件を確認した。

VERDICT: FLAG / blocking 1 additional。

`PLAN-L7-522` §3.3 / §6 は `src/lint/github-ci-policy.ts` の Bun 参照を
「BAN を検出し fail-close する側」と分類し、本 PLAN では不変としている。しかし current main の
同ファイルは、Bun を禁止するのではなく次を required step として要求している。

- `SOURCE_REQUIRED_STEPS`: `oven-sh/setup-bun@v2`
- `PACK_REQUIRED_STEPS`: `oven-sh/setup-bun@v2`, `bun install --frozen-lockfile`,
  `bun run typecheck`, `bun run test:pack`, `bun run lint`

したがって #472 が `.github/workflows/harness-check.yml` の `setup-bun` を撤去すると、
現行 `github-ci-policy` / doctor は必ず Red になる。一方、同policyをNode/npm正本へ改訂すると、
PLANの不変条件4へ違反する。現契約のまま #472 を完了させる経路は存在しない。

必須是正:

1. `github-ci-policy.ts`を一律な「BAN検出側lint不変」から除外する。
2. S1-b / S1-cのowned pathへ同policyのPack/source required-step定義を明示的に割り当てる。
3. Node/npm required stepsを正方向に要求し、Bun setup/install/invocationをforbiddenとして
   fail-closeするoracleをpaired test-designへ追加する。
4. `runtime-portability.ts` / `rule-drift.ts` / `toolchain-pin.ts`のうち、本当にBAN検出を所有する
   guardだけを不変条件として個別列挙する。

#473 ownerをClaude laneへ確定する修正と同じ新HEADで契約を閉じ、旧canonical PASSは使わず、
新exact-head request/receiptで再検収すること。実装PRへ問題を先送りしない。
