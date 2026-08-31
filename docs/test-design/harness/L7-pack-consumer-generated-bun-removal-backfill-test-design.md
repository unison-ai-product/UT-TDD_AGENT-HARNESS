---
artifact_type: test_design
layer: cross
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-524-pack-consumer-generated-bun-removal
---

# L7 test design: S1-b 生成 consumer Bun 到達経路撤去

Forward は `PLAN-L7-524-pack-consumer-generated-bun-removal.md`、Reverse 対は
`PLAN-REVERSE-524-pack-consumer-generated-bun-removal-backfill.md` である。

## 1. Oracle 対応

| 正規 ID | 実測 | 所有テスト |
|---|---|---|
| U-PACKBUN-003 | setup が生成した consumer tree 全体を再帰走査し Bun 到達 0 件 | `tests/setup-bun-removal.test.ts` |
| U-PACKBUN-004 | 生成経路5軸の単独復活が期待 finding 集合と完全一致して Red | `tests/setup-bun-removal.test.ts` |
| U-PACKBUN-006 | BAN lint の凍結サンプルを rule 単位で fail-close、source build を保持 | `tests/ban-lint-detection-power.test.ts` |

## 2. 変異と期待値

同じ clean tree を毎回生成し、まず baseline が空であることを確認する。shebang、run-bun path、
consumer workflow、adapter guidance、generated package script を個別に変異させ、各変異で
期待される path / rule / 件数の集合と完全一致させる。U-PACKBUN-006 は Bun / Bunx / `.cmd` /
`.exe` の実行形、module import、global reference、Pack CI deny rule、direct graph parity を
独立入力として実行する。単なる非空 assertion は使用しない。

## 3. 非証明事項

S1-a readiness、S1-c source CI、Node producer、Pack publication、Issue #418 の統合受入はこの
slice の対象外であり、それぞれの正本と child Issue で検証する。
