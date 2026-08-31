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
| `U-PACKBUN-001` | Bun executableとBun homeを到達不能にしたclean consumer fixtureでNode実setupを実行 | 対応NodeとGitがあればsetupとreadinessが成功する。旧Bun gateを戻す単軸変異でRed |
| `U-PACKBUN-002` | readiness checksを取得し、supported / below-range / above-range Node fixtureを個別評価 | Bun checkと導入案内は0。Node rangeとGitのtyped checkが存在し、range guard削除またはBun文言復活の単軸変異でRed |

実装oracleは `tests/setup-bun-readiness.test.ts` が所有する。source workflow、生成template、
sealed runtime producerはこのtest designの証明範囲外とする。
