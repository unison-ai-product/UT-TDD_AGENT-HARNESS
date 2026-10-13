---
title: "L7 design protection diff gate test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-13
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
- git 経路の行 (013、014、022、023) は temp directory に実 git repository を作る。CLI の終了 code を注入した git port で見る行 (032) と、入力境界の行 (031) は実 git を使わない。開発 worktree や実 repository を対象にしない。
- 保護対象の既存ファイルは `docs/design/harness/x.md` と `docs/test-design/harness/y.md` を base に commit して用意する。
- 実装 PR は `src/a.ts` の変更を、scripts の行は `scripts/b.sh` の変更を含めて作る。
- 単一定義点の行 (027) は実 repo の `docs/governance/repository-structure.md` を読む。028 と 029 は `paths` 引数か fake の変更列を使う純粋関数の行、030 は実 repo と temp の実 git repository の行である。
- CI policy の行 (016、024〜026) は、実 repo の workflow を読み込んだ `GithubWorkflowDoc` を複製し、1 点だけ変えて `analyzeGithubCiPolicy` にかける。
- 各行は L6 の規則を 1 本だけ殺すように作る。D / R は `docs/design/` (002 / 003) と `docs/test-design/` (018 / 019) を別の行で固定する。ref の解決失敗 (013) と diff の実行失敗 (020) も別の行で固定する。

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
| `CANDIDATE-U-DPROT-009` | (a) src も docs も含まない PR (`README.md` と `.ut-tdd/memory/m.md` を M)、(b) `.claude/hooks/work-guard.ts` と `docs/design/harness/x.md` を M、(c) `.github/workflows/harness-check.yml` と `docs/test-design/harness/y.md` を M。いずれも src/scripts は含まない | すべて `ok=true`、分類 `non-implementation`、違反 0 件。初版の非保証境界を観測するもので、全実行系保護の成功例ではない | 対象外 PR を BLOCK にする / 初版の分類を承認なしに hooks/workflows へ拡張する |
| `CANDIDATE-U-DPROT-010` | 空の diff (変更 0 件) | `ok=true`、分類 `non-implementation`、`error` なし | 空 diff を入力エラーにする / 空 diff で例外を投げる |
| `CANDIDATE-U-DPROT-011` | Windows のパス区切り: (a) fake git が `docs\design\harness\x.md` を返す、(b) `C:/x` や `../x` を返す、(c) 大文字の `Docs/Design/x.md` と `SRC/a.ts` を M | (a)(b) `ok=false`、`error.code = git-path-invalid` (区切りを `/` へ置換して通さない)。(c) `Docs/` も `SRC/` も対象外として `ok=true` | `\` を `/` に正規化して判定を続ける / 大文字小文字を無視して比較する |
| `CANDIDATE-U-DPROT-012` | fake git が (a) 未知 status `T`、(b) NUL 終端の無い出力、(c) R の path 欠落を返す | 3 つとも `ok=false`、分類 `unknown`、`error.code` はそれぞれ `git-status-unknown` / `git-diff-malformed` / `git-diff-malformed` | 不明 status を読み飛ばす / 部分的に読めた変更だけで判定する |
| `CANDIDATE-U-DPROT-013` | 実 git repository で CLI を実行し、`--base` に argv で運べる不正な ref を渡す: (a) base に存在しない ref (`refs/heads/nope`)、(b) 空文字、(c) tab を含む ref | すべて終了 code 1、`design-protection: BLOCK`、`error.code = git-ref-invalid`。(b) は `resolveCommit` の事前検査で、(a)(c) は `git rev-parse --verify` の失敗で `git-ref-invalid` になる。NUL / LF / CR は argv に載らない (または OS 依存になる) ので、この行では扱わず 031 で固定する | 解決できない ref を空 diff として PASS にする / `git-ref-invalid` 以外の code に丸める |
| `CANDIDATE-U-DPROT-014` | 実 git repository で、実装 PR の違反 3 件 (M / D / R) を 1 commit に入れて CLI を `--json` 付きと無しで実行 | 終了 code 1。違反 3 件が path の辞書順で全件出る。人向け出力は BLOCK 行と違反 3 行と分割の案内 1 行 | 最初の違反で打ち切る / 終了 code を 0 にする |
| `CANDIDATE-U-DPROT-015` | 同じ変更集合を順序を入れ替えて 2 回渡す。PLAN (`docs/plans/PLAN-*.md`) の追加を混ぜた版も渡す | 2 回の結果が一致。PLAN の有無で分類と違反が変わらない | 分類を最初の変更だけで決める / PLAN kind を分類に使う |
| `CANDIDATE-U-DPROT-016` | `RUNTIME_STEP_MANIFESTS` は正しく更新したまま、workflow の `jobs.harness-check-linux.steps` から design-protection step を消す。別の入力として、step の `if` を `${{ steps.classify.outputs.lane == 'full' }}` に替える。両方を `analyzeGithubCiPolicy` にかける | 前者は `missing_runtime_leg` と `missing_step` (label `design protection`) の両方。後者は `missing_runtime_leg` | `SOURCE_REQUIRED_STEPS` に登録しない (前者で `missing_step` が出ない) / doc lane で skip させる |
| `CANDIDATE-U-DPROT-017` | gate の実行前後で実 git repository の HEAD、index、working tree、object 数を比較する。override を試す入力 (環境変数 `UT_TDD_ALLOW_DESIGN_EDIT=1`、未知の CLI option `--allow`) も与える | 前後で差 0。override の入力は結果を変えない (未知 option は CLI が拒否) | gate が何かを書く / override の入口を足す |
| `CANDIDATE-U-DPROT-018` | 実装 PR (`src/a.ts` を M) で `docs/test-design/harness/y.md` を D。`docs/design/` は変更しない | `ok=false`、違反 1 件 `protected-deleted` (path = y.md) | 保護 prefix の照合を D について `docs/design/` だけにする / test-design の D を許可する |
| `CANDIDATE-U-DPROT-019` | 実装 PR で (a) `docs/test-design/harness/y.md` → `docs/test-design/harness/y2.md` の R、(b) `docs/test-design/harness/y.md` → `docs/archive/y.md` の R。`docs/design/` は変更しない | (a)(b) とも `ok=false`、違反 `protected-renamed` (from = y.md) | 保護 prefix の照合を R について `docs/design/` だけにする / test-design の R を許可する |
| `CANDIDATE-U-DPROT-020` | fake `GitCommandPort` で `rev-parse` は base / head とも 40 hex を返し、`diff` の実行だけが `GitDiffAdapterError("git-command-failed")` を投げる | `ok=false`、分類 `unknown`、`error.code = git-command-failed`、違反 0 件。CLI の終了 code は 032 で固定する (この行は `checkDesignProtection` の結果だけを見る) | diff の実行失敗を捕まえて空 diff (変更 0 件) として PASS にする / code を `git-ref-invalid` に丸める |
| `CANDIDATE-U-DPROT-021` | fake git が copy status を返す: (a) 実装 PR 形 `C75` + `src/a.ts` → `docs/design/harness/c.md`、(b) 契約 PR 形 `C90` + `docs/design/harness/x.md` → `docs/design/harness/x-copy.md` | (a)(b) とも `ok=false`、分類 `unknown`、`error.code = git-status-unknown` | `C` を added (コピー先の追加) として読み替える ((a) が PASS する) / `C` を読み飛ばす |
| `CANDIDATE-U-DPROT-022` | 実 git repository で、`src/a.ts` の M と同じ commit に `git update-index --chmod=+x docs/design/harness/x.md` (内容は不変) を入れる。別の入力として、src を含まない PR で同じ mode 変更だけを入れる | 前者は `ok=false`、違反 `protected-modified` (path = x.md)。後者は `ok=true` | blob の内容 digest だけで変更を判定し、mode だけの `M` を無視する |
| `CANDIDATE-U-DPROT-023` | 実 git repository で base から 2 commit 進める。commit 1 で `src/a.ts` を M し `docs/design/harness/x.md` を削除、commit 2 で同じ path に x.md を追加する。(a) 内容を変えて追加、(b) base と同じ bytes・mode で追加 | (a) `ok=false`、違反 `protected-modified` (added と見なさない)。(b) x.md は変更なしとして違反 0 件、`ok=true` | commit を 1 本ずつ辿り、最後の commit の `A` を見て (a) を許可する / 途中の `D` を見て (b) を拒否する |
| `CANDIDATE-U-DPROT-024` | 実装 PR の完成形 (workflow の `jobs.harness-check-linux.steps` と `RUNTIME_STEP_MANIFESTS["harness-check-linux"]` の両方に、L6 §7 の位置・`name`・`if`・`env`・`run` で step を足す) を、実 repo の workflow に対して `analyzeGithubCiPolicy` にかける | `ok=true`。`missing_runtime_leg` も `missing_step` も出ない | workflow だけを直し manifest を更新しない (`missing_runtime_leg` で fail する) |
| `CANDIDATE-U-DPROT-025` | manifest は正しく更新したまま、workflow 側の step を 1 点ずつ変える: (a) `if` を削除 (push でも動く)、(b) `if` を `${{ always() }}` に変更、(c) `plan admission-check` の前へ移動、(d) `typecheck` の後へ移動、(e) `continue-on-error: true` を追加、(f) 同じ step を `harness-check-windows` にも追加 | (a)〜(e) は `jobs.harness-check-linux` の `missing_runtime_leg`。(f) は `jobs.harness-check-windows` の `missing_runtime_leg` | manifest 照合を順序なしの集合比較にする ((c)(d) が通る) / `if` を比較から外す ((a)(b) が通る) |
| `CANDIDATE-U-DPROT-026` | 実 repo の `.github/workflows/harness-check.yml` を parse し、`jobs.harness-check-linux.steps` から `run` に `github design-protection` を含む step を取り出す | ちょうど 1 件。`if` は `${{ github.event_name == 'pull_request' }}` と完全一致。`env` は `BASE_SHA` だけで値は `${{ github.event.pull_request.base.sha }}` と完全一致 (`|| github.event.before` を含まない)。024 と合わせて manifest 側も同じ値に固定される | workflow と manifest を揃えて `if` を外す (025 は manifest との一致しか見ないので通る) / base に push の `before` を混ぜる |
| `CANDIDATE-U-DPROT-027` | 実 repo の `docs/governance/repository-structure.md` §3.1 の 2 つの表 (判定 path、保護 path) を読み、`IMPLEMENTATION_PATH_PREFIXES` / `PROTECTED_PATH_PREFIXES` と比べる。加えて、(a) 表の見出しを変えた文書、(b) 表の行を 0 件にした文書、(c) 表に `lib/` を 1 行足した文書を同じ比較関数にかける | 実 repo では両方とも集合として一致。(a)(b) は「表を読めない」で失敗し、空集合同士の一致として通さない。(c) は判定 path の不一致で失敗し、差分に `lib/` を示す。加えて (d) 2 つの表それぞれの行の順序を入れ替えた文書 (定数は据え置き) は一致する | 定数か表の片方だけを変えても通る / 表が読めないとき空集合を返して、空の定数と一致させる / 順序込みで比べて、並べ替えだけで赤にする ((d) が失敗する) |
| `CANDIDATE-U-DPROT-028` | `paths = { implementation: ["product/"], protected: ["spec/design/"] }` を渡す。(a) `product/a.ts` と `spec/design/x.md` を M、(b) `src/a.ts` と `spec/design/x.md` を M、(c) `product/a.ts` と `docs/design/harness/x.md` を M | (a) `ok=false`、分類 `implementation`、違反 `protected-modified` (path = spec/design/x.md)。(b) 分類 `non-implementation`、`ok=true`。(c) 分類 `implementation`、違反 0 件、`ok=true` | 分類か拒否の関数の中に `src/` / `docs/design/` を直接書き、`paths` を無視する ((a) が PASS、(b) が BLOCK になる) |
| `CANDIDATE-U-DPROT-029` | 実装 PR で (a) `src/a.ts` → `product/a.ts` の R (既定の定数のまま)、(b) `scripts/b.sh` → `tools/b.sh` の R、(c) `src/a.ts` → `src/sub/a.ts` の R、(d) `paths.implementation = ["src/", "product/"]` を渡して (a) と同じ R、(e) `src/a.ts` → `docs/design/harness/moved.md` の R | (a)(b)(e) は `ok=false`、違反 `implementation-moved-out` 1 件だけ (path = 移動先、from = 移動元)。(e) は保護対象への rename の許可 (004) より移動の拒否が優先する。(c)(d) は違反 0 件、`ok=true` | 判定 path の外への rename を許可する ((a) が PASS) / 判定 path の中での rename まで拒否する ((c) が BLOCK) / 移動先の判定に定数ではなく固定の `src/` を使う ((d) が BLOCK) / 保護対象への rename の許可を先に判定する ((e) が PASS) |
| `CANDIDATE-U-DPROT-030` | 実 repo の HEAD で `git ls-files` を読み、`IMPLEMENTATION_PATH_PREFIXES` と `PROTECTED_PATH_PREFIXES` の各 prefix の配下の追跡ファイルを数える。加えて、temp の実 git repository で `src/` 配下を全部 `product/` へ動かした commit (定数は据え置き) に同じ確認をかける | 実 repo では各 prefix とも 1 件以上。temp repository では `src/` が 0 件で失敗し、空の prefix に `src/` を示す | 置き場の存在を確かめない (全部を動かしても 027 が一致のまま通る) / working tree を読み、追跡されていないファイルで空を見逃す |
| `CANDIDATE-U-DPROT-031` | 呼び出し回数を数える fake `GitCommandPort` を渡し、`baseRef` を (a) NUL を含む文字列、(b) LF を含む文字列、(c) CR を含む文字列にして `checkDesignProtection` を呼ぶ。`headRef` は正常な 40 hex | 3 つとも `ok=false`、分類 `unknown`、`error.code = git-ref-invalid`。fake port の呼び出しは 0 回 | ref を検査せずに git へ渡し、`rev-parse` の失敗経路で同じ `git-ref-invalid` に見せる (fake port が呼ばれるので殺せる) |
| `CANDIDATE-U-DPROT-032` | `runDesignProtectionCommand` に fake `GitCommandPort` を注入する。(a) `rev-parse` は 40 hex を返し `diff` だけが `GitDiffAdapterError("git-command-failed")` を投げる、(b) 違反 0 件の正常な diff を返す、(c) 違反 1 件 (実装 PR で x.md を M) の diff を返す | (a) 終了 code 1、出力に `design-protection: BLOCK` と `git-command-failed`。(b) 終了 code 0、`design-protection: PASS`。(c) 終了 code 1 | 終了 code を違反の件数から計算する ((a) が 0 になる) / diff の実行失敗を CLI で握りつぶす |

## 4. Gate and scope fence

- 本書の oracle は `docs/design/` と `docs/test-design/` の保護だけを扱う。`tests/` の oracle 保護、追加による実質上書き、push event の検査は対象外 (設計文書 §9)。
- テスト設計の確定・正式 ID への昇格・Red のテストは、src/ も scripts/ も含まない PR (契約 PR + Red) で入れる (設計文書 §10.2)。実装 PR は本書と共有の索引に触れず、Green にするだけにする。本書は昇格のための例外 oracle を持たない。
- 開発 repo 自身を読む oracle (現時点では 016、024〜027、030) の Red は、`test-repository-isolation` の登録行と一緒に別の PR で入れる (L6 §10.3)。昇格は全件を契約 PR + Red で行う。
- candidate の存在だけを Green の証跡にしない。
- 契約 PR + Red で、`src/github/design-protection.ts` がまだ無いために import が失敗して `it.fails` が成立しても、それは各 guard の Red の証拠にならない。実装 PR は、候補ごとに L6 の規則を 1 本だけ殺す mutation を入れて Red になることを確かめ、そのログを §5 の証跡に残す (issue #898 の契約確認、2026-10-13)。
- 009(b)(c) は L6 §3 / §9 の初版の非保証境界を固定する。workflow 内容の CI policy 検査016/024〜026とは別である。issue #973 で分類対象を広げると決めた場合は、その契約改訂で009(b)(c)の期待を `implementation` / `BLOCK` に反転する。
- 027〜030 は L6 §3.1 の単一定義点と、表と定数を据え置いた移動の検出を固定する (issue #913)。工程 ④ の移動 PR は repository-structure.md §3.1 の表と定数を同時に直し、027 を Green のまま通す。移動後の実際の path で実装 PR が BLOCK になる Red→Green は、その移動 PR が自分の差分で示す。現行001〜026を移動後の証明へ流用しない。

## 5. Required evidence

実装 PR は次を残す。

- 各 candidate の Red→Green ログ (mutation を入れた Red の再現を含む)。
- 既存 admission テスト (`tests/` の plan-admission 系) が無変更で green であること。
- typecheck / Biome、Linux / Windows / aggregate CI の run ID、exact HEAD、非著者 closing receipt digest。
