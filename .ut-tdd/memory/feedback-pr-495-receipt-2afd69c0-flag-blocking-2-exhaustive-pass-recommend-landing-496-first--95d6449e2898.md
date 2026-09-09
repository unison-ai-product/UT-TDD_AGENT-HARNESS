---
memory_id: memory:feedback:pr-495-receipt-2afd69c0-flag-blocking-2-exhaustive-pass-recommend-landing-496-first--95d6449e2898
kind: feedback
title: "PR 495 receipt 2afd69c0 FLAG blocking 2 exhaustive pass; recommend landing 496 first"
tags: ["canonical-receipt", "claude-review", "pr"]
updated_at: 2026-08-31T08:51:15.472Z
---

# PR #495 canonical review receipt (exact head `44f35266`) — **FLAG / blocking 2**

- receipt digest: `2afd69c0131563378a5ec05394defd9a5750d172f72315fa6346cd359f09baad`
- reviewer_family: claude / `claude-opus-5` (review-lane, effort middle)
- at: 2026-08-31T08:49:48Z
- required CI: Linux / Windows / aggregate 3/3 SUCCESS
- 先行 receipt `4a8adc0e` / `bfa2dbb7` は再利用していません

**これは網羅パスです。** 「残存 blocking を 1 回で全部出す」指示で回しました。
今回の 2 件は**新しい層の発見ではなく、直前 2 件の未閉鎖**です。doc 側は直したが
oracle 側 / 開示範囲が追随していない、という形です。

## blocking 1: `engines.node` の missing/invalid fail-close が全 oracle 未被覆 (直前 blocking 1 の未閉鎖)

契約 doc 3 箇所は「missing/invalid は blocking」と宣言しています:

- `L6 setup-solo-team.md:119`「Node が missing、engines.node が missing/invalid … なら blocking」
- `L7-unit-test-design.md:132`「… は blocking / 単軸 mutation … range guard の削除を Red とする」
- paired test design `U-PACKBUN-002` Stimulus「supported / below-range / above-range /
  **missing / invalid** engines.node fixture を個別評価」

しかし同一 HEAD の実測では、`requiredNodeVersion` に `null` を渡す呼び出しも invalid range
fixture も `nodeVersion=null` も **tests/ 全体で 0 件**です (検証済み:
`grep -rn requiredNodeVersion tests/ | grep -E 'null|undefined|""|invalid'` → 0 hits。
`tests/setup.test.ts:981/1018/1037/1050/1079/1091` と
`tests/setup-bun-readiness.test.ts:154-165` は全て valid な文字列 pair)。

したがって `src/setup/distribution.ts:256-260` の `range &&` / `validRange(range)` fail-close、
:332 の check 名 `"node engines.node (missing)"`、:341 の message は**一度も実行されません**。
`satisfiesRequiredNode` を「range 欠落時 true」に変異させても両テストは Green のままです。
`Reverse-527 §R2` の単軸変異集合にもこの軸がありません。

PR body 行 8「preserve fail-close behavior for missing/invalid Node constraints」は
根拠コマンドの無い prose claim であり、`coding ≠ substance` に該当します。

## blocking 2: readiness の `ci.requires` が同一 HEAD の生成 CI と矛盾する (直前 blocking 2 の未閉鎖)

**本 PR が新たに作った乖離です。**

`src/setup/distribution.ts:391-401` は
`ci.workflow=".github/workflows/harness-check.yml"`、
`ci.requires=[actions/checkout@v4, actions/setup-node@v4, "npm ci --no-audit --no-fund",
"npm run typecheck", "npm test"]` を返します。

しかし同一 HEAD で setup が生成する**その実ファイル** (`src/setup/templates.ts:627-641`) は

```
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun run test
```

のままです (実測確認済み)。さらに `transformCleanDistributionArtifact` が生成 package.json に
`scripts.test="bun run test:pack"` を書くため、readiness が指示する `npm test` すら Bun 経由に
なります。

base との差分を取ると、`ci.requires` は本 PR が `bun run typecheck` →
`npm ci --no-audit --no-fund` / `npm run typecheck` へ書き換えたものです
(`git diff 7cc60772 44f35266 -- src/setup/distribution.ts` で確認)。
**本 PR 以前は ci.requires と生成 workflow が一致していました。**

`PLAN-L7-522 §5.1` (行 284-291) は S1-a 先行時にこの「readiness の主張が実態とずれる」中間状態を
PR に明記せよと要求しますが、PR body 行 24 と `PLAN-L7-527 §3` の開示は
**"generated hook" と landing 先 #496 のみ**を名指しており、生成 consumer CI workflow /
生成 package.json `scripts.test` の乖離を覆っていません。
加えて `ci.requires` を生成 workflow へ束縛する oracle が存在せず、
`U-PACKBUN-002` (`tests/setup-bun-readiness.test.ts:139-147`) は npm 配列を literal で固定して
乖離を追認しています。

## 収束のための順序提案 (convergence driver として)

blocking 2 は #495 単独では素直に閉じません。取りうるのは:

- **(推奨) #496 (S1-b) を先に着地させ、その上で #495 を rebase する。**
  生成 template が npm 化されれば `ci.requires` と実ファイルが一致し、乖離自体が消えます。
  これは `PLAN-L7-522 §5.1` が当初から推奨していた順序 (「S1-b を S1-a より先に置く」) であり、
  §5.1 の開示義務も発生しなくなります。
- (次善) `ci.requires` を生成 workflow の現状 (Bun) に戻し、#496 着地時に一括で npm 化する。
  ただし S1-a の目的である「readiness を Node/npm-only にする」は達成されません。
- (非推奨) 乖離を §5.1 開示で追認する。利用者に偽の CI 要件を提示し続けることになります。

いずれにせよ blocking 1 (missing/invalid の oracle 追加) は #495 内で独立に閉じられます。

## merge gate

FLAG のため `ut-tdd pr merge --pr 495` は deny します。
