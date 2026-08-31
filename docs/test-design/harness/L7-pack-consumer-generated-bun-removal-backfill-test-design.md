---
artifact_type: test_design
layer: cross
executed_at_layer: L7
status: draft
plan_id: PLAN-REVERSE-524-pack-consumer-generated-bun-removal-backfill
---

# PLAN-REVERSE-524 対の test design

この test design は、`PLAN-L7-524` の実装で観測された差分を、既存の
`PLAN-L7-522` の freeze へ逆向きに照合するための対である。新しい Bun 撤去契約や
親 PLAN の acceptance condition は追加しない。親の正本は
`docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md`、実装の正本は
`docs/plans/PLAN-L7-524-pack-consumer-generated-bun-removal.md` である。

## R1: observed contract

- `U-PACKBUN-003` / `U-PACKBUN-004` は生成 consumer tree の到達経路と、その検出 oracle の
  negative control を所有する。
- `U-PACKBUN-006` は source `package.json` の `build` script と BAN 検出側 lint の能力を
  保護する。source の build script は不変であり、生成 `package.json` の build script
  除去とは別軸である。
- `PLAN-L7-522` §3.3 の behavioral sample は、検出結果の存在だけでなく、対応 rule と
  件数を固定して判定する。別の Bun 到達形が同じ結果を作っても、変異した軸を隠せない
  よう各入力を独立に実行する。

## R2: mutation matrix and expected result

同一の clean generated tree を各 case で作り直す。baseline は finding 0 件でなければ
ならない。各変異後は下表の finding 集合と**完全一致**させ、`not.toEqual([])` では判定
しない。

| Oracle | 独立変異 | 期待結果 |
| --- | --- | --- |
| `U-PACKBUN-004` | `ut-tdd.mjs` に Bun shebang を追加 | `ut-tdd.mjs` の `Bun shebang` と `bun executable` の 2 件 |
| `U-PACKBUN-004` | `run-bun.ts` と `findBun()` を生成 | `run-bun.ts` の `run-bun path` / `findBun function` / `bun executable` の 3 件 |
| `U-PACKBUN-004` | consumer workflow に `setup-bun` / install / run を追加 | `harness-check.yml` の `setup-bun action` と `bun executable` の 2 件 |
| `U-PACKBUN-004` | adapter 文書へ Bun 実行形を追加 | `ut-tdd-test.md` の `bun executable` 1 件 |
| `U-PACKBUN-004` | 生成 `package.json` の test script を `bun run` に変異 | `package.json` の `bun executable` 1 件 |
| `U-PACKBUN-006` | runtime-portability の `spawnSync("bun", ...)` / `.cmd` / `.exe` を各一軸で入力 | 各入力が `bun-runtime-spawn` 1 件 |
| `U-PACKBUN-006` | rule-drift の command を `bun` / `bunx` / `.cmd` / `.exe` で各一軸で入力 | 各入力が `bun execution form` 1 件 |
| `U-PACKBUN-006` | `package.json` と `bun.lock` の direct graph を不一致化 | `bun-direct-parity-drift` 1 件 |

この matrix の入力は `tests/setup-bun-removal.test.ts` と
`tests/ban-lint-detection-power.test.ts` が実際に生成・変異・評価する。テスト宣言だけを
証跡にせず、detached snapshot runner の出力を R3 の引用元とする。

## R3: executed evidence

実装 exact HEAD で次を実行する。

```text
node scripts/run-vitest-snapshot.ts tests/setup-bun-removal.test.ts tests/ban-lint-detection-power.test.ts
npm run typecheck -- --pretty false
npm run lint
node src/cli.ts plan lint docs/plans/PLAN-REVERSE-524-pack-consumer-generated-bun-removal-backfill.md
```

各 command の exit code、実行時刻、output digest、anchor commit は
`PLAN-REVERSE-524` の `review_evidence.green_commands` に束縛する。U004 は 5 件の
実生成 tree mutation、U006 は spawn 3 件 + command 4 件を含む全 mutation が実走し、
survivor 0 であることを要求する。

## R4: backfill decision and Forward routing

実装は `PLAN-L7-522` §2.1 / §2.1.1 / §3.3 の既存契約を実体化しただけであり、要件、
L4/L5/L6 の意味、外部契約、運用ポリシーを変更しない。したがって
`backprop_decision: not_required` とし、理由を「既存の #469 freeze を実装・変異証跡へ
束縛し、新しい要件・設計語彙を追加していないため」と固定する。

Forward へは `gap-only` / `reuse-as-is` で戻す。`PLAN-L7-522` の既存 freeze evidence、
`PLAN-L7-524` の所有境界、#471/#472/#487/#463 の実装範囲はこの対で変更しない。
