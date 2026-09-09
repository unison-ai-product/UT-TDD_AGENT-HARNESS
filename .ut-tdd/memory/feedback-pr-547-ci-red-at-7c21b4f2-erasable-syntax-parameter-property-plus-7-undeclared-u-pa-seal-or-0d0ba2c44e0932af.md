---
memory_id: memory:feedback:pr-547-ci-red-at-7c21b4f2-erasable-syntax-parameter-property-plus-7-undeclared-u-pa-seal-oracles--b5fef053271c
kind: feedback
title: "PR 547 CI red at 7c21b4f2: erasable-syntax parameter property plus 7 undeclared U-PA-SEAL oracles"
tags: ["ci", "erasable-syntax", "issue542", "oracle-trace", "pr547"]
updated_at: 2026-09-09T04:35:57.880Z
---

## CI 赤の切り分け (head 7c21b4f2d410480d2b68912a15f3bca2f330cbee、非著者 Claude による事実報告)

`harness-check-linux` fail (run 34309449209 / job 102332876108)。原因は **doctor の 2 件**で、
typecheck / Vitest / Biome は通っています。windows は本報告時点で pending。
exact-head review は CI green 後に回すため、先に事実だけ返します。

### 1. `erasable-syntax` violation 1 件 (fail-close)

```
doctor: erasable-syntax — violation 1 件 (node strip-only で実行不能、PLAN-L7-462 PR-B):
src/plan-asset/ledger/sealed-lineage-local-migration.ts
(TypeScript parameter property is not supported in strip-only mode)
```

該当は本 PR で追加された行です。

- `src/plan-asset/ledger/sealed-lineage-local-migration.ts:83`
  `constructor(private readonly repoRoot: string) {}`

`private readonly` を constructor 引数に付ける parameter property は型情報の除去だけでは消えないため、
node の strip-only 実行 (`nodeAuthority`) で落ちます。同ファイル 149 行の既存 constructor は
`constructor(db, options)` + 本体代入という書き方で、この規律に従っています。同じ形へ直すのが最短です。

```ts
private readonly repoRoot: string;
constructor(repoRoot: string) {
  this.repoRoot = repoRoot;
}
```

### 2. `oracle-test-trace` の宣言漏れ 7 件

```
doctor: oracle-test-trace — ⚠ test-label citation が test-design 未宣言 7 件 (baseline 外):
U-PA-SEAL-004, U-PA-SEAL-005, U-PA-SEAL-006, U-PA-SEAL-007, U-PA-SEAL-008,
U-PA-SEAL-009, U-PA-SEAL-010。test-design に正確な ID 行を追加する。
```

実測した現状:

- `tests/plan-asset/sealed-lineage-local-migration.test.ts` は本 head で `U-PA-SEAL-001..010` を citation。
- `docs/test-design/` 配下に `U-PA-SEAL` の宣言は **1 件も存在しない** (`git grep -ln "U-PA-SEAL" 7c21b4f2 -- docs/test-design` が空)。
- 既存 3 件 (`001` / `002` / `003`) が通っていたのは `src/lint/oracle-test-citation-baseline.ts:288-290` の
  **baseline allowlist に登録済み**だったためで、test-design 宣言があったからではありません。
- main 側で `U-PA-SEAL` に言及しているのは `internal-processing.md` (私が #543 で書いた 付録 E の
  「`U-PA-SEAL-001..003` を relax しない」という文言) と上記 baseline、そして test 本体だけです。

したがって新規 7 件は baseline にも test-design にも無いため fail します。是正は
**baseline への追記ではなく test-design への宣言**が筋です (baseline は既存債務の凍結枠であり、
新規 oracle を足す場所ではない)。#543 の 付録 E.6 が要求した負系 oracle 群がまさにこの 7 件に対応するはずなので、
`PLAN-RECOVERY-16` の pair test-design (`docs/test-design/harness/L8-integration-test-design.md`、
付録 E 冒頭で pair と明記) に ID 行を追加する形が契約と整合します。

どちらも実装ロジックの誤りではなく、規律面の 2 点です。ご確認ください。
