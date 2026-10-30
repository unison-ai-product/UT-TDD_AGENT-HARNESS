---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_snapshot_runner_argv
pair_artifact: docs/test-design/harness/L7-snapshot-runner-argv-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1469
---

> **L6 contract marker**: `parseSnapshotRunnerArgs(args: readonly string[]) => SnapshotRunnerArgs` は snapshot runner (`scripts/run-vitest-snapshot.ts`) の argv 境界に関する unit-test-granularity contract である。正式 oracle は `U-SNAPARG-001` / `U-SNAPARG-002`。oracle の詳細と既存互換軸は `docs/test-design/harness/L7-snapshot-runner-argv-test-design.md` が固定する。

> **状態**: 本書は issue #1469 の**未実装の目標契約**である。既存 runner が一部の境界を既に実装していることは、契約全体が実装済みであることを意味しない。実装はこの契約と L7 の Red を固定した後に行う。方式変更が必要なら実装を止め、本書と対になる L7 を同時に改訂する。

# snapshot runner の argv 境界 — 関数設計 (issue #1469)

## 1. 目的と範囲

`scripts/run-vitest-snapshot.ts` は、commit 済み snapshot に対する batch 実行の入口である。Vitest の任意の option 定義を動的に参照すると、Vitest の更新で runner の受理範囲まで変わる。本契約では repo 内の実利用に必要な option だけを明示し、help・許可 option・test path・separator・未知 option の境界を clone より前に判定する。

範囲は runner の argv 判定と Vitest への argv 受け渡しに限る。snapshot の作成、Vitest 自身の option 意味論、install / DB rebuild の動作変更は含めない。

## 2. 正規契約

### 2.1 option 集合

runner は Vitest の option 定義を introspect せず、次の明示的な集合だけを wrapper 側で認識する。

| 分類 | 受理する token | 値の扱い |
|---|---|---|
| 値を取る | `-t`, `--testNamePattern` | `--option value` と `--option=value` の両方を受理する |
| 値を取る | `--reporter`, `--maxWorkers`, `--minWorkers`, `--shard` | `--option value` と `--option=value` の両方を受理する |
| 値を取る | `--exclude`, `--pool` | `--option value` と `--option=value` の両方を受理する |
| 値を取らない | `--browser` | bare token のみ受理する |

受理した option、値、test path、その他の passthrough token は、Vitest に渡す際に token の内容と相対順序を変えない。同じ値取り option の複数出現も元の順序のまま渡す。

### 2.2 help

runner の help として `--help` または `-h` を指定したときは、usage を表示して終了コード `0` で終了する。clone、npm install、DB rebuild、Vitest は開始しない。separator の後ろは §2.3 の透過対象であり、runner の help として解釈しない。help と未知 option を混在させた場合の優先順位は本契約では追加しない。

### 2.3 test path と separator

- `-` で始まらない argv token は test path として扱い、token をそのまま Vitest に渡す。
- 最初の `--` と、それより後ろの全 token は wrapper の allowlist 判定対象外とし、`--` 自体を含めて順序・内容を変えず Vitest に渡す。これは allowlist に無い Vitest option を指定する明示的な escape hatch である。

### 2.4 batch-only の watch 拒否

snapshot runner は batch-only であり、`-w`、`--watch`、`--watch=<value>` は通常の許可 option ではない。既存の拒否を維持し、watch 要求を受けた場合は batch-only を示して非 `0` で終了し、clone と Vitest を開始しない。

この拒否は最初の `--` より後ろにも適用する。§2.3 の透過は未知 option の allowlist 判定だけを省くものであり、既存の batch-only 安全条件 (`assertBatchVitestArgs`) がそれに優先する。`-- --watch`、`-- -w`、`-- --watch=<value>` も clone 前に非 `0` で拒否する。

### 2.5 未知 option

最初の `--` より前で `-` から始まり、help・watch・許可集合のいずれにも該当しない token は未知 option として拒否する。エラーは clone 開始前に発生し、終了コードは `0` 以外とする。メッセージには問題の token、wrapper が受け付ける option の一覧、`--` の使い方を含める。拒否時には clone・npm install・DB rebuild・Vitest を開始しない。

## 3. 許可集合の根拠と更新条件

現行 caller の確認対象は package scripts (`--exclude`)、Windows shard (`--shard`)、test-design の直接実行 (`-t` / `--reporter` / `--pool`)、verification profile (`--browser`) である。利用中の option が漏れている場合は、その caller と値の有無を確認してから本書と L7 の明示集合へ追加する。Vitest の内部 option 定義を自動的に許可集合へ取り込まない。

## 4. 不変条件

| ID | 不変条件 |
|---|---|
| I1 | help と未知 option の分岐は、clone と Vitest より前に完了する |
| I2 | runner は Vitest の option 全体を暗黙に許可せず、本書の allowlist と separator escape hatch のみを使う |
| I3 | 許可 option の値・位置、positional test path、separator passthrough は入力 argv の token を損なわない |
| I4 | watch は snapshot と整合しないため、batch-only 拒否を維持する |
