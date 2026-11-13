---
title: "L7 snapshot runner argv test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
updated: 2026-10-30
pair_artifact: docs/design/harness/L6-function-design/snapshot-runner-argv.md
issue: 1469
---

# snapshot runner の argv 境界 テスト設計 (issue #1469)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/snapshot-runner-argv.md` である (未実装の目標契約)。本書の正式 oracle `U-SNAPARG-001` / `U-SNAPARG-002` は、Red PR #1479 で候補 Red として登録・確認した契約を、Red 証拠の引用後に正式 ID へ昇格したものである。対応する test name と挙動は `tests/snapshot-runner-argv-candidates.test.ts` に置く。src/scripts を含む実装と `it.fails` の解除は後続の Green 段階で行う。

## 2. fixture と実行境界

runner の起動境界を子プロセス fixture と spawn preload の注入で観測する。本物の clone、install、DB rebuild、Vitest は起動しない。help と unknown の候補では clone/install/DB rebuild/Vitest の入口が呼ばれないことを記録済み spawn から判定する。許可 option の互換テストでは clone/install/DB rebuild/Vitest の各子プロセスを fixture 内で stub し、Vitest entrypoint に到達したときの argv を比較する。fixture setup・preload・子プロセス起動の失敗は候補 Red とみなさない。

## 3. 正式 oracle

| ID | 軸 / 入力 | 期待 | 落とす退行 |
|---|---|---|---|
| `U-SNAPARG-001` | `--help` と `-h` を個別に起動 | どちらも usage を表示して exit `0`。clone、install、DB rebuild、Vitest の spawn は 0 件 | alias の片方の欠落、help の non-zero、help 後に重い stage を開始 |
| `U-SNAPARG-002` | `-z` と `--not-a-vitest-option` をそれぞれ単独で起動 | exit は非 `0`。未知 option の診断・当該 token・clone/install/DB rebuild/Vitest の spawn 0 件、許可 option の一覧、独立 token としての `--` の説明を3つの独立した assertion 群で確認する | 未知 option の透過、diagnostic 欠落、一覧の欠落、separator の案内欠落、clone/install/DB rebuild/Vitest のいずれかを起動してから未知 option で失敗 |
| `U-SNAPARG-003` | `--minWorkers=1` と `--minWorkers 1` を `parseSnapshotRunnerArgs` に渡す | どちらも `kind: "unknown-option"` で `token` は `--minWorkers`。Vitest 4 で削除された option を受理しない (Red: 実装が受理している間は `it.fails`) | 削除済み option の受理、Vitest 側での `Unknown option` 失敗 |
| `U-SNAPARG-004` | runner が報告する許可 option の一覧の各 option を、固定版 Vitest の実際の CLI 定義 (stub なし) で解析する | 全 option が `checkUnknownOptions` を通る。値取り option は値つき、`--browser` は bare で検査する。Vitest 4.1.12 では `--minWorkers` が残る間に赤くなる | 固定版の Vitest が拒否する option を許可集合に残す退行 |

## 4. 既存互換テスト (candidate ではなく通常 `it`)

以下は新しい候補 ID を作らず、現行利用を保つ通常の互換テストとして固定する。どのケースも fake Vitest 境界に到達した argv が入力 token と一致し、本物の外部 stage は起動しない。

| 軸 | 入力例 | 期待 |
|---|---|---|
| `-t` の alias・値空白形式 | `-t` + `name pattern` | `run` の後ろに同じ 2 token を渡す |
| 値取り option の equals 形式 | `-t=name pattern`, `--testNamePattern=name pattern`, `--reporter=dot`, `--maxWorkers=2`, `--shard=1/2` | 各 token を分割・再解釈せず順序どおり渡す |
| 値取り option の空白形式 | `--testNamePattern`, `--reporter`, `--maxWorkers`, `--shard` の後に値 | option と値を別 token のまま順序どおり渡す |
| caller 追加分 | `--exclude` / `--pool` の空白・equals 形式 | どちらの書式も受理し、値を保って渡す。`--exclude` は複数指定も順序保持する |
| 値なし option | `--browser` | bare token をそのまま渡す |
| positional test path | `tests/one.test.ts` | path を加工せず渡す |
| separator escape hatch | `--`, `--not-a-vitest-option`, `opaque positional value` | separator と tail 全体をそのまま順序保持して渡す |
| watch batch-only 互換 | `--watch`, `-w`, `--watch=<value>` を separator 前後でそれぞれ指定 | 現行 batch-only 診断で非 `0`。clone と Vitest の spawn は 0 件。allowlist 判定の透過より batch-only の拒否を優先する |

`--minWorkers` は §4 の互換対象から外した (Vitest 4 で削除、`U-SNAPARG-003` が拒否を固定する)。`tests/snapshot-runner-argv-candidates.test.ts` の `--minWorkers` の受理ケースと許可 token 一覧は、実装 PR (Green) で削除する。§2 の stub は Vitest を差し替えるため option の受理可否を検出できず、受理可否の検査は `U-SNAPARG-004` が実際の CLI 定義で担う。

## 5. 境界と重複の回避

既存 oracle `U-TESTHYGIENE-045` / `U-TESTHYGIENE-046` は watch 拒否と watch script 不在を所有する。本書の `U-SNAPARG-001` / `U-SNAPARG-002` は help と unknown-option の新契約を所有し、watch を新しい oracle として重ねない。通常互換テストは現在の `assertBatchVitestArgs` の観測を固定する。separator は allowlist 判定だけを省略し、watch を通す迂回路にはしない (control #6513968105)。
