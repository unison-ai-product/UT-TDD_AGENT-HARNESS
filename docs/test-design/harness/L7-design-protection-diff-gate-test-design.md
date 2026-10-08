---
title: "L7 design protection diff gate test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-08
---

# 設計書保護 diff gate テスト設計 (issue #898)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/design-protection-diff-gate.md` である。
本書はその §3 分類規則、§4 拒否規則、§5 出力、§7 CI 接続、§8 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引 (§設計書保護 diff gate) だけを置き、本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-DPROT-*`) だけを宣言する。
正式 ID `U-DPROT-*` への 1:1 の昇格は、Red のテスト (`it.fails`) と同じ契約 PR + Red で行う (設計文書 §10.2)。実装 PR は `it.fails` を `it` に戻して Green を観測するだけで、本書には触れない。
既存の `plan admission-check` の oracle は再定義しない。§2 の再利用部品の挙動不変は、既存の admission テストが無変更で green であることで確かめる。

## 2. fixture

- 純粋関数 (`classifyPullRequestChanges` / `checkDesignProtection`) の行は、`PlanChange` の配列か、`git diff --name-status -z` 形式の bytes を返す fake `GitCommandPort` で作る。
- git 経路の行 (013、014) は temp directory に実 git repository を作る。開発 worktree や実 repository を対象にしない。
- 保護対象の既存ファイルは `docs/design/harness/x.md` と `docs/test-design/harness/y.md` を base に commit して用意する。
- 実装 PR は `src/a.ts` の変更を、scripts の行は `scripts/b.sh` の変更を含めて作る。

## 3. Candidate oracle matrix

| Candidate | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-DPROT-001` | 実装 PR (`src/a.ts` を M) で `docs/design/harness/x.md` を M | `ok=false`、違反 1 件 `protected-modified` (path = x.md)、分類 `implementation` | M を許可にする / 保護 prefix から `docs/design/` を外す |
| `CANDIDATE-U-DPROT-002` | 実装 PR で `docs/design/harness/x.md` を D | `ok=false`、違反 `protected-deleted` | D を許可にする / D を base 側 path で照合しない |
| `CANDIDATE-U-DPROT-003` | 実装 PR で (a) `docs/design/harness/x.md` → `docs/design/harness/z.md` の R、(b) `docs/design/harness/x.md` → `docs/archive/x.md` の R | (a)(b) とも `ok=false`、違反 `protected-renamed` (from = x.md) | rename を head 側 path だけで判定する ((b) が通る) / R を added に丸める |
| `CANDIDATE-U-DPROT-004` | 実装 PR で `docs/design/harness/new.md` を A、および `docs/archive/old.md` → `docs/design/harness/moved.md` の R | `ok=true`、違反 0 件 | A を拒否する / 保護対象外からの rename を拒否する |
| `CANDIDATE-U-DPROT-005` | 実装 PR で `docs/test-design/harness/y.md` を M | `ok=false`、違反 `protected-modified` | 保護 prefix から `docs/test-design/` を外す |
| `CANDIDATE-U-DPROT-006` | `scripts/b.sh` だけを含み src を含まない PR で `docs/design/harness/x.md` を M | `ok=false`、分類 `implementation` | 実装 PR の判定を `src/` だけにする |
| `CANDIDATE-U-DPROT-007` | 実装側の path が rename の `from` だけにある PR (`src/a.ts` → `lib/a.ts` の R) で `docs/design/harness/x.md` を M | `ok=false`、分類 `implementation` | 分類で rename の `from` を見ない |
| `CANDIDATE-U-DPROT-008` | 契約 PR + Red (src も scripts も含まない) で `docs/design/harness/x.md` と `docs/test-design/harness/y.md` を M、別の設計文書を D、`tests/z.test.ts` を A と M | `ok=true`、分類 `non-implementation`、違反 0 件 | 分類を見ずに常に保護規則をかける / `tests/` を実装 PR の発火条件に入れる |
| `CANDIDATE-U-DPROT-009` | src も docs も含まない PR (`README.md` と `.ut-tdd/memory/m.md` を M) | `ok=true`、分類 `non-implementation`、違反 0 件 | 対象外 PR を BLOCK にする |
| `CANDIDATE-U-DPROT-010` | 空の diff (変更 0 件) | `ok=true`、分類 `non-implementation`、`error` なし | 空 diff を入力エラーにする / 空 diff で例外を投げる |
| `CANDIDATE-U-DPROT-011` | Windows のパス区切り: (a) fake git が `docs\design\harness\x.md` を返す、(b) `C:/x` や `../x` を返す、(c) 大文字の `Docs/Design/x.md` と `SRC/a.ts` を M | (a)(b) `ok=false`、`error.code = git-path-invalid` (区切りを `/` へ置換して通さない)。(c) `Docs/` も `SRC/` も対象外として `ok=true` | `\` を `/` に正規化して判定を続ける / 大文字小文字を無視して比較する |
| `CANDIDATE-U-DPROT-012` | fake git が (a) 未知 status `T`、(b) NUL 終端の無い出力、(c) R の path 欠落を返す | 3 つとも `ok=false`、分類 `unknown`、`error.code` はそれぞれ `git-status-unknown` / `git-diff-malformed` / `git-diff-malformed` | 不明 status を読み飛ばす / 部分的に読めた変更だけで判定する |
| `CANDIDATE-U-DPROT-013` | 実 git repository で base に存在しない ref (`refs/heads/nope`)、空文字、改行を含む ref を `--base` に渡して CLI を実行 | 終了 code 1、`design-protection: BLOCK`、`error.code = git-ref-invalid`。違反判定へ進まない | base 解決失敗を「変更 0 件」と扱って PASS にする |
| `CANDIDATE-U-DPROT-014` | 実 git repository で、実装 PR の違反 3 件 (M / D / R) を 1 commit に入れて CLI を `--json` 付きと無しで実行 | 終了 code 1。違反 3 件が path の辞書順で全件出る。人向け出力は BLOCK 行と違反 3 行と分割の案内 1 行 | 最初の違反で打ち切る / 終了 code を 0 にする |
| `CANDIDATE-U-DPROT-015` | 同じ変更集合を順序を入れ替えて 2 回渡す。PLAN (`docs/plans/PLAN-*.md`) の追加を混ぜた版も渡す | 2 回の結果が一致。PLAN の有無で分類と違反が変わらない | 分類を最初の変更だけで決める / PLAN kind を分類に使う |
| `CANDIDATE-U-DPROT-016` | `.github/workflows/harness-check.yml` から `github design-protection` step を消した workflow、および step に `steps.classify.outputs.lane == 'full'` を付けた workflow を `github-ci-policy` にかける | 前者は `missing_step` で fail、後者は lane skip 禁止の既存検査で fail | required step に登録しない / doc lane で skip させる |
| `CANDIDATE-U-DPROT-017` | gate の実行前後で実 git repository の HEAD、index、working tree、object 数を比較する。override を試す入力 (環境変数 `UT_TDD_ALLOW_DESIGN_EDIT=1`、未知の CLI option `--allow`) も与える | 前後で差 0。override の入力は結果を変えない (未知 option は CLI が拒否) | gate が何かを書く / override の入口を足す |

## 4. Gate and scope fence

- 本書の oracle は `docs/design/` と `docs/test-design/` の保護だけを扱う。`tests/` の oracle 保護、追加による実質上書き、push event の検査は対象外 (設計文書 §9)。
- テスト設計の確定・正式 ID への昇格・Red のテストは、src/ も scripts/ も含まない PR (契約 PR + Red) で入れる (設計文書 §10.2)。実装 PR は本書と共有の索引に触れず、Green にするだけにする。本書は昇格のための例外 oracle を持たない。
- candidate の存在だけを Green の証跡にしない。

## 5. Required evidence

実装 PR は次を残す。

- 各 candidate の Red→Green ログ (mutation を入れた Red の再現を含む)。
- 既存 admission テスト (`tests/` の plan-admission 系) が無変更で green であること。
- typecheck / Biome、Linux / Windows / aggregate CI の run ID、exact HEAD、非著者 closing receipt digest。
