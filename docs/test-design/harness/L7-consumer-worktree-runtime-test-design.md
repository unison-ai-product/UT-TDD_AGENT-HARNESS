---
title: "L7 consumer worktree runtime test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/consumer-worktree-runtime.md
status: confirmed
updated: 2026-11-04
issue: 1525
---

# consumer worktree の runtime 入口 テスト設計 (issue #1525)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/consumer-worktree-runtime.md` (未実装の目標契約) の §3 入口、§4 案内、§5 不変条件である。共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書が詳細の正本である。この pair-freeze では候補 ID (`CANDIDATE-U-CWTRT-*`) だけを宣言する。正式化は設計書保護 gate の三段階に従う。

## 2. fixture

- 一時ディレクトリに git repo を作り、`git worktree add` で linked worktree を作る。実 repo・実 `.git`・実ネットワークは使わない。
- main の runtime は、テスト用に生成した小さな Release directory と anchor digest から既存の導入経路で入れる。キャッシュは一時 repo の `git-common-dir` 配下に置く。
- launcher の行 (007 / 008) は、生成された launcher と guard の argv を子プロセスで実行し、stderr と exit code を観測する。

## 3. 候補の oracle

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `CANDIDATE-U-CWTRT-001` | 同じ版の導入 | 入力: main に版 A が有効、キャッシュに版 A の Release、linked worktree。期待: `setup --worktree <path>` が成功し、worktree の identity の `release_id` / `artifact_set_digest` / `compiled_esm_digest` が main と一致し、launcher 経由の guard が exit 0 で動く。反例: digest を照合せず最新または別の版を入れる実装。main の bundle をコピーして identity が worktree と合わない実装。 |
| `CANDIDATE-U-CWTRT-002` | キャッシュの再利用と明示の Release 入力 | 入力 (a): キャッシュに版 A の検証済み Release がある。期待: ネットワーク関数を呼ばず (呼ぶと失敗する stub を渡す)、検証を通して導入する。入力 (b): キャッシュが無く、Release 入力の引数も無い。期待: `worktree_entry_cache_missing` で何も書かない。入力 (c): キャッシュが無く、`--consumer-runtime-release` に版 A の正当な Release directory、`--expected-consumer-digest` にその anchor を併記する。期待: 成功し、worktree の identity が main と一致し、main の active pointer・キャッシュ (作られないまま)・他の worktree の bytes が不変。入力 (d): (c) の anchor を不正な値にする、または版 B の正当な Release とその anchor を渡す。期待: 検証失敗または `worktree_entry_pin_mismatch` で拒否し、worktree・main・キャッシュ・他の worktree に書き込みを残さない。反例: キャッシュ無しのとき黙って取得する実装、検証せずキャッシュを信用する実装、キャッシュが無ければ引数に関係なく常に `worktree_entry_cache_missing` を返す実装、明示の Release 入力で anchor や版を照合しない実装。 |
| `CANDIDATE-U-CWTRT-003` | 改ざんの拒否 | 入力: キャッシュの asset を 1 byte 変える、または別の版の asset と差し替える。期待: 検証失敗または `worktree_entry_pin_mismatch` で、worktree に runtime・launcher を残さない (巻き戻す)。反例: 検証を通ったあとに pin 照合を省く実装、失敗後に半端な bundle が残る実装。 |
| `CANDIDATE-U-CWTRT-004` | main 未導入の拒否 | 入力: main に active pointer が無い。期待: `worktree_entry_main_not_activated` で書き込みなし、メッセージが main での setup を案内する。反例: キャッシュの版を勝手に採用して worktree だけ導入する実装。 |
| `CANDIDATE-U-CWTRT-005` | pin を変えない | 入力: 版 A の main、キャッシュに版 A と版 B。期待: 導入後も main の active pointer・キャッシュ・他の worktree の bytes が不変、worktree に版 B が入る経路が無い (版 B を指す引数・環境変数を渡しても版 A のまま、または拒否)。版 A を指す正当な明示の Release 入力は拒否せず導入する (002 の (c))。worktree に既に別の版があれば `consumer_runtime_update_unsupported`。反例: 引数で版を選べる実装、worktree 導入が main の pointer を書き換える実装。 |
| `CANDIDATE-U-CWTRT-006` | main worktree の扱い | 入力: `--worktree` に main worktree の path、および git 管理外の path。期待: 何も書かず `worktree_entry_not_linked` で exit 非 0 (no-op の成功にしない)。反例: main を成功扱いで終える実装、git 管理外へ runtime を書く実装。 |
| `CANDIDATE-U-CWTRT-007` | launcher の案内 (runtime 欠落) | 入力: launcher はあるが active pointer が無い。期待: stderr に符号と、実行すべきコマンド (`setup --worktree <絶対パス>`) を含む文が出て、exit 2。他の deny 符号 (`consumer_runtime_digest_mismatch` など) は従来どおり符号のみ・exit 78。反例: 案内を出しつつ exit 0 にする実装、全 deny 符号へ案内を広げる実装、`MODULE_NOT_FOUND` のスタックを出す実装。 |
| `CANDIDATE-U-CWTRT-008` | guard の起動断片 (launcher 欠落) | 入力: launcher 自体が無い worktree で、生成された consumer の agent-guard / work-guard の argv を実行する。期待: stderr に案内文 1 つ、exit 2、`MODULE_NOT_FOUND` を含まない。launcher があるときは従来の launcher を起動する。記録 / session hook の argv は従来のまま。反例: 記録 hook まで起動断片に置き換える実装、launcher の有無を見ずに常に案内を出す実装。 |
| `CANDIDATE-U-CWTRT-009` | 案内の経路 | 入力: 007 / 008 の出力。期待: block 理由は guard と同じ stderr + exit 2 の経路 (`.claude/hooks/agent-guard.ts` の block と同じ)。案内文が 1 つのコマンドを名指しする。反例: stdout だけに出す実装。 |

## 4. 段の扱い

- 001〜009 は設計書保護の三段階に従う。登録と Red の PR が `it.fails` として入れ、`src` を含まない昇格 PR が正式 ID (`U-CWTRT-001`〜`009`) に改め、実装 PR が `it` に戻す。
- 受け入れには、実際の Claude Code で runtime の無い worktree の Edit が案内つきで止まることを 1 回確かめた記録を含める (自動テストの oracle ではない)。
