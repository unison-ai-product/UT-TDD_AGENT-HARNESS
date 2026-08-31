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

親の凍結 test-design は `PLAN-L7-522` §3.3 の候補表を正本とする。本 artifact は S1-b の
実装 test と変異結果を R1-R4 へ束ねる trace であり、S1-a readiness、S1-c source CI、
Node producer、Pack publication の oracle を取り込まない。

| 正規 ID | 実測 | 所有テスト |
|---|---|---|
| `U-PACKBUN-003` | setup が生成した consumer tree 全体を再帰走査し Bun 到達 0 件 | `tests/setup-bun-removal.test.ts` |
| `U-PACKBUN-004` | 生成経路5軸の単独復活が期待 finding 集合と完全一致して Red | `tests/setup-bun-removal.test.ts` |
| `U-PACKBUN-006` | BAN lint の凍結サンプルを rule 単位で fail-close、source build を保持 | `tests/ban-lint-detection-power.test.ts` |

## 2. 変異と期待値

同じ clean tree を毎回生成し、まず baseline が空であることを確認する。shebang、run-bun path、
consumer workflow、adapter guidance、generated package script を個別に変異させ、各変異で
期待される path / rule / 件数の集合と完全一致させる。negative-control の5 case は相互に
混ぜず、1 case でも期待集合から外れたら Red とする。detection-power 検査は Bun / Bunx / `.cmd` /
`.exe` の実行形、module import、global reference、Pack CI deny rule、direct graph parity を
独立入力として実行する。単なる非空 assertion は使用しない。behavioral 検査を、deny rule
本数・allowlist path・pin の構造比較で代替してはならない。

## 3. Issue #450 AC 対応

S1-b が所有する AC2 は親 test-design の生成 tree / negative-control oracle、および全 slice 共通の
detection-power oracle である。
AC1 / `001` / `002` は #471、AC4 / `005` は #472、AC3 / Node-only sealed runtime は
#473 系列が所有する。

## 4. 非証明事項

S1-a readiness、S1-c source CI、Node producer、Pack publication、Issue #418 の統合受入はこの
slice の対象外であり、それぞれの正本と child Issue で検証する。
