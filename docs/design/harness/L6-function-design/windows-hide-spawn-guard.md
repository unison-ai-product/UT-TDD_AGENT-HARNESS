---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_windows_hide_spawn_guard
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: pending (issue #693。台帳の Claude 手番で plan draft により起票する)
---

> **L6 contract marker**: `analyzeWindowsHide(sources, baseline) => WindowsHideResult` は unit-test-granularity contract である。DbC pre/post/invariant は §7 にまとめる。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§子プロセスの windowsHide 検査) に置き、詳細 (CANDIDATE-U-WHIDE-001〜012) は専用の `docs/test-design/harness/L7-windows-hide-spawn-guard-test-design.md` が固定する。

# 子プロセスの windowsHide 検査 — 関数設計 (issue #693)

## 1. 目的

Windows では、Node の `child_process` で起動した子プロセスに `windowsHide: true` が無いと、子プロセスごとに console window が開いて画面がちらつく。テスト・doctor・review の委譲・hook・`ut-tdd pr merge` は git / gh を何百回も起動するので、作業中の画面が点滅し続ける (PO 報告、2026-10-13。#683 / PR #684 で provider 経路だけを直した後も再発した)。

2026-10-13 の走査では、`src/`・`scripts/`・`.claude/hooks/`・`tests/` の `child_process` 呼び出し 482 件のうち 401 件に `windowsHide` が無かった。そのうち約 90 件が製品側 (CLI・doctor の lint・hook・git hook) で、約 330 件がテストである。個別に直しても、新しい呼び出しが足されれば再発する。

本設計は、`windowsHide: true` の無い呼び出しを doctor で機械的に拒否する検査を定める。既存の違反は件数の baseline に記録し、領域ごとの PR で 0 まで減らす。

## 2. 対象

- **走査対象のファイル**: `src/`・`scripts/`・`.claude/hooks/`・`tests/` 配下の `.ts` / `.mts` / `.mjs` / `.cjs` / `.js`。`node_modules/` と `docs/` は対象外。
- **対象の呼び出し**: `node:child_process` (または `child_process`) から import した `spawn` / `spawnSync` / `execFile` / `execFileSync` / `exec` / `execSync`。名前付き import の別名 (`import { spawnSync as run }`) と namespace import (`import * as cp` → `cp.spawnSync`) も含める。`fork` は Node の options に `windowsHide` が無いので対象外とする。
- 正規表現の `.exec()` や SQLite の `db.exec()` のように、`child_process` から import していない同名の呼び出しは対象外 (import の解決で区別する)。

## 3. 判定規則

1 件の呼び出しは、options 引数が次のどちらかを満たすときだけ適合とする。

1. object literal で、`windowsHide` プロパティの値が literal の `true` である。spread (`...base`) と並んでいてもよいが、`windowsHide: true` は literal の中に直接書かれていなければならない。
2. 同じファイル内の `const` 宣言を指す識別子で、その初期化子が 1. を満たす object literal である。

それ以外は違反とし、理由を 2 種に分ける。

- `windows-hide-missing`: options が無い、または object literal に `windowsHide` が無い、または値が `true` 以外。
- `windows-hide-unverifiable`: options が関数呼び出し・別ファイルの値・条件式など、上の 2 形で静的に確かめられない。

options 引数の位置は API ごとに決まっている: `spawn` / `spawnSync` / `execFile` / `execFileSync` は第 2 引数が配列なら第 3 引数、そうでなければ第 2 引数。`exec` / `execSync` は第 2 引数。

例外は設けない。`stdio: "inherit"` で親の console を共有する呼び出しにも `windowsHide: true` を付ける (新しい console を作らないので、付けても動作は変わらない)。

## 4. baseline (既存違反の記録)

- 既存の違反は `src/lint/windows-hide-baseline.ts` に「ファイル path → 違反件数」として記録する。
- ファイルの違反件数が baseline を**超えた**ら fail-close する (`windows-hide-new`)。新しい呼び出しは必ず `windowsHide: true` 付きで書く。
- ファイルの違反件数が baseline を**下回った**ら、baseline の更新を求めて fail-close する (`windows-hide-stale-baseline`)。直したら同じ PR で baseline を減らす。baseline は縮小のみ可で、増やす変更は §6 の領域 PR を含めて認めない。
- baseline に無いファイルで違反が出たら `windows-hide-new` とする。

## 5. doctor への接続

- doctor の check 名は `windows-hide`、CI の doctor (governance hard gates) で fail-close する。
- 出力は違反ごとに `path:line:reason`、末尾に `checked=<走査ファイル数> calls=<対象呼び出し数> violations=<baseline 外の違反数> baseline=<baseline 合計>`。

## 6. baseline を 0 にする順序

領域ごとに 1 PR とし (1 PR = 1 論点)、点滅への寄与が大きい順に進める。各 PR は対象領域の呼び出しに `windowsHide: true` を足し、baseline の該当行を同じ PR で削る。

1. `.claude/hooks/` と `scripts/git-hooks/` (tool 呼び出しと push のたびに走る)
2. `src/` の git / gh 呼び出し (`src/cli.ts`、`src/feedback/`、`src/plan-admission/` ほか。review の委譲と `pr merge` の経路)
3. `src/lint/` と `src/doctor/` (doctor の経路)
4. `src/` の残りと `scripts/`
5. `tests/support/` と `tests/` (テスト実行時の点滅)

## 7. 不変条件 (DbC)

- Pre: 入力は走査対象のファイルの path と内容の列、および baseline。読み取りだけを行い、ファイルを書かない。
- Post: `ok` は `windows-hide-new` / `windows-hide-stale-baseline` が 0 件のときだけ true。違反は path と行で一意に並べ、入力の順序に依存しない。
- Invariant: 適合の判定は §3 の 2 形だけで行い、実行時の値や他ファイルを推測しない。推測できないものは `windows-hide-unverifiable` として違反に数える。

## 8. 範囲外

- `fork` と worker thread。
- `child_process` を介さない外部プロセス起動 (例: shell script 内の起動)。shell script は既存の `runtime-portability` の範囲とする。
- 実行時に console window が開いたかの観測。本検査は静的な規則だけを扱う。

## 9. 根拠

- issue #693 (2026-09-25 の監査、`src/` だけで 99 件中 82 件が非対話で未対応)、#683 / PR #684 (provider 経路の修正)。
- 2026-10-13 の走査 (482 件中 401 件が未対応、製品側 約 90 件)。
- PO 指示 (2026-10-13): 「CI 走った時に PowerShell の画面がちかちかする現象 … 恒久的に対策してくれない？」
