---
title: "L7 merge gate consumer test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/merge-gate-consumer.md
status: confirmed
updated: 2026-11-04
issue: 1526
---

# merge gate の consumer 対応 テスト設計 (issue #1526)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/merge-gate-consumer.md` である。本書は §2 CI 状態の enum、§3 必須 check の設定、§4 draft と競合、§5 既定ブランチと適用外を検証する oracle を定義する。共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。

この pair-freeze では候補 ID (`CANDIDATE-U-MGCONS-*`) だけを宣言する。正式化は設計書保護 gate の三段階で、各段の Red PR が引用し、src を含まない昇格 PR で `U-MGCONS-*` へ 1:1 で昇格する。

## 2. fixture

- 注入した `gh` と `git` の reader だけを使う。実ネットワークと実 repo は読まない。
- rollup は `gh pr view --json statusCheckRollup` の形の配列を手で書く。設定ファイルと baseline ファイルは temp directory に置く。
- 1 つの行は規則を 1 本だけ殺すように、入力の書き方を 1 つだけ変える。

## 3. 候補行

| ID | 入力 | 期待 (oracle) |
|---|---|---|
| `CANDIDATE-U-MGCONS-001` | 設定なし。(a) 空の rollup (b) 全件 SUCCESS (c) FAILURE を含む (d) `conclusion` が空のものを含む (e) SKIPPED のみ | (a) `not_run` (b) `green` (c) `failed` (d) `pending` (e) `skipped`。反例: 空の rollup を `green` にする |
| `CANDIDATE-U-MGCONS-002` | 状態が `failed` / `pending` / `not_run` / `skipped` の 4 fixture で merge を試みる | reason はそれぞれ `ci_failed` / `ci_pending` / `ci_not_run` / `ci_skipped` で互いに異なり、`gh pr merge` 呼び出し 0。`green` では reason に ci が現れない |
| `CANDIDATE-U-MGCONS-003` | FAILURE と pending が混在、pending と SKIPPED が混在 | 優先順どおり `failed`、`pending` になる |
| `CANDIDATE-U-MGCONS-004` | 設定ファイルなし。(a) 既存 `U-RVMG-010`・`035`〜`046` の fixture を enum 版の期待値で再実行 (b) 単独の `{conclusion:"SUCCESS"}` (`status` 欠落) (c) 単独の `{conclusion:"SUCCESS",status:"IN_PROGRESS"}` | (a) 緑・deny の結論が現行と同一 (回帰)。本体 repo の挙動が変わらない (b) (c) ともに `green` (現行 `evaluateChecksGreen` が true を返す境界)。反例: `status` を見て `pending` にする |
| `CANDIDATE-U-MGCONS-005` | `requiredChecks: ["build"]`。`build` が SUCCESS、名前の無い別 check が FAILURE | `green`。指定外は無視される |
| `CANDIDATE-U-MGCONS-006` | `requiredChecks: ["build","test"]`。rollup は `build` の SUCCESS 1 件だけで、`test` に一致するエントリが無い | `not_run` で deny (`ci_not_run`)。反例: 一致したエントリだけで判定し、欠けた `test` を無視して green にする |
| `CANDIDATE-U-MGCONS-007` | `requiredChecks: ["build"]`。`build` の最新 run が SKIPPED | `skipped` で deny (`ci_skipped`)。反例: skipped を pass として扱う |
| `CANDIDATE-U-MGCONS-008` | 設定が (a) 壊れた JSON (b) `requiredChecks` が空配列 (c) string 以外を含む (d) 余分な key を持つ | すべて `merge_gate_config_invalid` で deny。設定を無視して緩めない |
| `CANDIDATE-U-MGCONS-009` | checks 緑・review `merge_ready` で、(a) `isDraft: true` (b) `mergeable: "CONFLICTING"` (c) `mergeable: "UNKNOWN"` (d) `isDraft` / `mergeable` 欠落 | (a) `draft` (b) `conflicting` (c) `mergeable_unknown` で deny、`gh pr merge` 呼び出し 0。(d) は `gh PR facts invalid`。`isDraft: false` かつ `MERGEABLE` では draft 系 reason が出ない |
| `CANDIDATE-U-MGCONS-010` | `gh repo view` が既定ブランチ `trunk` を返す repo | fetch の refspec・merge-base・差分の比較先が `origin/trunk`。`origin/main` を使わない |
| `CANDIDATE-U-MGCONS-011` | (a) `gh repo view` が失敗 (b) 名前が空・不正 | `baseline_conflict_unknown` で deny。競合なしにしない |
| `CANDIDATE-U-MGCONS-012` | (a) baseline ファイルが 2 つとも無い repo (b) 片方だけ有る repo (c) 本体 repo と同じ両方有り・既定ブランチ `main` | (a) 判定を行わず `baseline: "not_applicable"` (pass と区別) (b) 有る方の gate だけ判定 (c) 現行と同一の gate・refspec で `U-RVMG-047`〜`049` の結論が変わらない |
| `CANDIDATE-U-MGCONS-013` | 注入した git reader で、設定の中身を 4 か所で変える: fetch 後の `origin/<既定ブランチ>` 先端は `["build"]`、fetch 前の古い `origin/<既定ブランチ>` は `["test"]`、PR のブランチは `["lint"]`、作業ツリーは `["docs"]`。rollup は `build` SUCCESS と `test` FAILURE | `green` (remote 先端の `["build"]` だけを使った結果)。reader の呼び出し順が fetch (`+refs/heads/<既定ブランチ>:refs/remotes/origin/<既定ブランチ>`) → ls-tree → `git show origin/<既定ブランチ>:ut-tdd.merge-gate.json` で、PR ブランチと作業ツリーを読む呼び出しが 0。反例: 古い ref を読む (`failed`)、PR ブランチか作業ツリーを読む (`not_run`)、fetch を省く |
| `CANDIDATE-U-MGCONS-014` | rollup は全件 SUCCESS。(a) `gh repo view` が失敗 (b) fetch が非 0 (c) ls-tree が非 0 (d) ls-tree は名前を返し `git show` が非 0 (e) fetch 成功・ls-tree が exit 0 で出力が空 | (a)〜(d) は `merge_gate_config_invalid` で deny、`gh pr merge` 呼び出し 0 (e) は設定なしとして全エントリを判定し `green`。反例: 取得の失敗を設定なしとして通す |
