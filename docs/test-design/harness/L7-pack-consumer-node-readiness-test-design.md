---
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-527-pack-consumer-node-readiness
---

# L7 test design: consumer Node readiness (S1-a)

Forwardは `docs/plans/PLAN-L7-527-pack-consumer-node-readiness.md`、Reverseは
`docs/plans/PLAN-REVERSE-527-pack-consumer-node-readiness-backfill.md`。

| Oracle | Stimulus | Expected |
| --- | --- | --- |
| `U-PACKBUN-001` | Bun executableとBun homeを到達不能にしたclean consumer fixtureで実setupを実行 | 対応NodeとGitがあればsetupとreadinessが成功する。`bunOk`をANDへ戻す単軸変異でRed |
| `U-PACKBUN-002` | readiness全体を取得し、supported / below-range / above-range / missing / invalid `engines.node` fixtureを個別評価 | `checks`、`ci.requires`、`rollback.commands`のBun文字列は0。Node missing、missing/invalid/out-of-range (`below-range` / `above-range`) は blocking、CI・rollbackはNode/npm経路だけを提示し、Node rangeとGitのtyped checkが存在する。range guard削除、Bun check復活、CI/rollbackへのBun command再導入の各単軸変異でRed |

`U-PACKBUN-002` の負系 fixture は同一の readiness oracle で個別に実行する。missing
`engines.node` は `node engines.node (missing)` と
`package.json engines.node is missing; cannot verify the Node runtime`、invalid range は
`node@<range>` と observed version を含む install message、missing `nodeVersion` は
`node@<range>` と `observed none` を返し、いずれも `readiness.ok=false` とする。supported
range と out-of-range range guard も個別に実行し、guard を常時 true にする単軸変異は
必ず Red になる。

実装oracleは `tests/setup-bun-readiness.test.ts` が所有する。受入 fixture は移行中のため
install/status/setup/typecheck に Bun を使うが、distribution plan の実行側は `process.execPath` で
Node を直接起動する。source workflow、生成template、sealed runtime producerはこのtest designの
証明範囲外とする。
