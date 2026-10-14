---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_pack_consumer_isolation
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
---

# Pack 単独・2 consumer 隔離受入契約 (issue #224 S4 / #357)

## 1. 位置づけと責務境界

Issue #224 の S4 を、Pack artifact だけから二つの下流 product を同時に運用できる受入契約として bounded 化する。
PF-1〜PF-5 は source 側で release artifact を決定・検証・原子的に admit する内部配布 core であり、本書はその成果を
consumer へ導入した後の runtime 隔離を所有する。

次の責務は変更しない。

- Pack repository 側の tag / release / revert runbook は `release-channel-manifest.md` と staged release の設計が持つ。
- source 側の aggregate admission は PF-5 (`release-channel-manifest.md` §8) が持つ。
- review / merge の authority は D1 / D2 / D3 が持つ。
- promotion と rollback の gate 判定は `release-channel-manifest.md` §9 が持つ。

本書は Pack publish、`sync-pack` copy、promotion engine、rollback engine を実装しない。これらを一つの PR へ混ぜず、
独立した L7 implementation の子 Issue へ分ける。実装済みの検証は `src/setup/consumer-local-runtime-admission.ts` と
`tests/consumer-local-runtime-admission.test.ts` (`U-PACKISO-001..007`) にある。

## 2. 正本と runtime 境界

1. consumer の正本は、各 product repository 内の Pack artifact、product-local configuration、product runtime root である。
   source development repository、source worktree、source `.ut-tdd`、source harness DB、source PLAN / test-design / evidence、
   ローカルの Pack checkout は、runtime discovery の入力にしてはならない。
2. `consumerRoot` は各 product の canonical repository root、`runtimeRoot` はその product だけが所有する runtime state root とする。
   DB、Memory、PLAN projection、lock、hook state、review receipt、evidence は `runtimeRoot` の外を参照・列挙・再利用しない。
   A と B が同一 OS user でも、root identity が異なれば state identity は異なる。
3. Pack version は consumer ごとの immutable artifact identity (version、artifact digest、source revision) に束縛する。
   一方の consumer が upgrade / rollback しても、他方の設定、version pin、state、history、filesystem、process、receipt を書き換えない。
4. 受入入力は、PF-5 が成功として返した sealed release artifact だけである。manifest / digest / revision の mismatch、
   artifact unavailable、namespace / path escape、unknown version は、consumer 導入前に typed failure とし、対象 consumer を含む
   全 write を 0 にする。consumer は manifest の materializer version に従い、受領した artifact の destination path、mode、
   content bytes から artifact set digest を独立に再計算する。PF-5 receipt や manifest の申告 digest を計算入力として信用せず、
   再計算値が receipt と manifest の両方と一致した場合だけ受理する。

## 3. 二 consumer 受入シナリオ

fixture は互いに別の temporary root を持つ Product A / B とし、source repository、source worktree、local Pack checkout を
fixture から除外する。Pack artifact 以外の開発元 path を、環境変数、current directory、config、symlink、junction で注入しても、
成功へ fallback しない。

| シナリオ | 操作 | 必須観測 | 対応 oracle |
| --- | --- | --- | --- |
| 独立導入 | A / B を同じ Pack version から個別に初期化 | 各 runtime root だけに state が生成され、cross-root の read / write が 0 | `CANDIDATE-PACKISO-002` |
| 異 version 共存 | A を v1、B を v2 の artifact へ束縛 | version / digest / revision、hook / lock / DB / receipt が互いに不変 | `CANDIDATE-PACKISO-003` |
| 片系 upgrade | B を実行したまま A だけ v1 から v2 へ進める | A の切替は atomic。B の実行と全状態が不変 | `CANDIDATE-PACKISO-004` |
| 片系 rollback | B を実行したまま A だけ直前の attested artifact へ戻す | A は決定論的に旧 identity へ戻り、B の実行・version・history は不変 | `CANDIDATE-PACKISO-005` |
| 局所障害 | A の artifact / receipt / lock を不正化する | A は fail-close。B は read / write / process を要求されず継続できる | `CANDIDATE-PACKISO-006` |
| source 不在 | development repo / worktree / local Pack checkout を物理的に存在させない | Pack artifact だけから独立導入を再現する | `CANDIDATE-PACKISO-001` |

## 4. fail-close と原子性

- 導入、upgrade、rollback は、対象 consumer の private staging で完結させる。commit 前の失敗では、その consumer の prior
  bytes / mode / path / state を不変にする。復旧の証明に失敗した場合は、成功にも未変更にも丸めず、typed `rollback_failed` /
  `indeterminate` を返す。
- A の失敗を B への recovery 対象として波及させない。共有グローバル lock、共有 DB、共有 runtime root、source 側 fallback、
  version 最新化による暗黙 upgrade は、すべて禁止する。
- evidence / receipt は product identity と artifact identity を同時に保持する。artifact だけ、または product だけが一致する
  既存記録を、他 consumer の成功根拠へ再利用してはならない。

## 5. containment と deny の副作用 (PLAN-REVERSE-496 R4 の backfill、2026-08-25)

PR #374 の実装と `U-PACKISO-001..006` を非著者が R3 で aggregate 再検収した結果、次の 2 点を受入契約へ戻した。既存の PF-1〜PF-5、
promotion gate、Pack copy の責務は変更しない。

1. consumer / runtime root の containment は、`realpath` で canonical 化した空間に対して **1 回だけ**判定する。lexical path と
   canonical path に同じ helper を重ねて「二重防御」に見せてはならない。二段判定を採る場合は、各段が別の入力・別の脅威を
   検出し、片方を除去する mutation を oracle が殺すことを要求する。
2. admission が `namespace_escape`、identity / digest mismatch、artifact unavailable、unknown version、invalid input のいずれかで
   deny した場合、PF-5 の apply / staging / restore / pointer / publish port の呼び出しは **すべて 0** である。deny 判定後に
   telemetry 以外の副作用を追加してはならない。この 2 点目の oracle が `CANDIDATE-PACKISO-007` である
   (deny 理由を 1 軸ずつ変異し、全 apply 系 port の call count 0 と prior state 不変を観測する)。

## 6. 検証の対

oracle は `docs/test-design/harness/L7-unit-test-design.md` の「Pack単独・2 consumer隔離受入候補」節 (`CANDIDATE-PACKISO-001..007`、
実装で同番号の `U-PACKISO-*` へ昇格済み) にある。canary の境界検証は `L12-pack-internal-canary-test-design.md` が本書を
正本として再利用する。
