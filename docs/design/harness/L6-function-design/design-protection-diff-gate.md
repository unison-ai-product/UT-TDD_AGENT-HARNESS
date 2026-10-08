---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_design_protection_diff_gate
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-834-design-protection-diff-gate.md
---

> **L6 contract marker**: `checkDesignProtection(input: DesignProtectionInput) => DesignProtectionResult` は unit-test-granularity contract である。DbC pre/post/invariant は §8 にまとめる。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§設計書保護 diff gate) に置き、詳細 (CANDIDATE-U-DPROT-001〜026) は専用の `docs/test-design/harness/L7-design-protection-diff-gate-test-design.md` が固定する。

# 設計書保護 diff gate — 関数設計 (issue #898)

## 1. 目的

実装 PR の中で設計文書やテスト設計を書き換えられないようにする。
契約 (設計文書とテスト設計) は実装より先に freeze し、review を経てから実装する。
実装 PR がその契約を同時に書き換えると、review 済みの契約と実装が一緒に動き、契約が検証の正本でなくなる。
この gate は、PR の変更 path の集合だけを見て、その書き換えを CI で fail-close に止める。

方式は issue #898 の control コメント (案 D、2026-10-08) で決定済みである。
本書はその決定を関数契約に落とすだけで、方式を変えない。

## 2. 入力

入力は base commit と head commit の 2 つの ref である。
gate は `git diff --name-status -z --find-renames <base> <head>` を pathspec なしで 1 回読む。
pathspec を付けない理由は、分類 (§3) に `src/` と `scripts/` の変更も必要だからである。

各変更は次の 4 種に正規化する。

| git status | 正規化後 | 扱う path |
|---|---|---|
| `A` | added | head 側 path |
| `M` | modified | 同一 path |
| `D` | deleted | base 側 path |
| `R<score>` | renamed | base 側 `from` と head 側 `path` の両方 |

- rename は `--find-renames` の既定類似度で検出する。
- rename は「`from` の削除 + `path` の追加」として §4 の拒否規則にかける (control 決定の「変更 + 削除として扱う」)。
- 上の 4 種以外の status は不明として fail-close にする (§5 の `error`、code `git-status-unknown`)。既存 `parseNameStatus` と同じ扱いで、挙動を変えない。
  - `C<score>` (copy): gate は `--find-copies` を付けないので、通常は出ない。git config `diff.renames=copies` などで出た場合も、copy を added として読み替えずに fail-close にする。PR 全体 (契約 PR を含む) が BLOCK になるが、CI の checkout に config は無いので通常の運用では起きない。
  - `T` (file と symlink などの type 変更) も fail-close にする。
- mode だけの変更 (例: `100644` → `100755`) は git が `M` として出す。gate は内容と mode を区別せず modified として扱う (保護対象なら §4 で拒否)。
- diff は base tree と head tree の 2 点比較で、途中の commit 履歴を見ない。break 検出 (`-B`) も使わない。
  したがって途中の commit で削除して同じ path に追加し直した変更は、内容か mode が base と違えば `M`、同一なら変更なしになる。
  「削除して作り直す」形で保護対象の書き換えを added に見せることはできない。
- path は git が出す POSIX 形式の相対 path をそのまま使う。`\`、絶対 path、`.` / `..` を含む path は不正として fail-close にする。
- path の比較は大文字と小文字を区別する (git tree の path と同じ)。

## 3. 分類規則

PR の種別は変更 path の集合だけで決める。PLAN の kind、branch 名、PR 本文には依存しない。

- **実装 PR**: 変更 path (rename は `from` と `path` の両方) のどれか 1 つが `src/` または `scripts/` で始まる PR。
- **非実装 PR**: それ以外の PR。この gate は何も拒否しない。

契約 PR (src も scripts も含まず、設計文書だけを直す PR) は非実装 PR として通る。
src も docs も含まない PR も非実装 PR で、この gate の対象外である。

## 4. 拒否規則

保護対象は `docs/design/` と `docs/test-design/` の配下にある全ファイルである。
実装 PR でだけ、次の規則を適用する。

| 正規化後の変更 | 保護対象との関係 | 判定 |
|---|---|---|
| modified | path が保護対象 | 拒否 (`protected-modified`) |
| deleted | path が保護対象 | 拒否 (`protected-deleted`) |
| renamed | `from` が保護対象 | 拒否 (`protected-renamed`。保護対象の外へ出す rename も含む) |
| renamed | `from` が保護対象外で `path` だけが保護対象 | 許可 (保護対象への新規追加と同じ) |
| added | path が保護対象 | 許可 |

例外経路は作らない。override の marker、PR label、環境変数も作らない。
format の一括修正や文字化け修正のように src と docs を同時に直す変更も、PR を分けて出す。

## 5. 出力

`checkDesignProtection` は次の結果を返す。

| field | 内容 |
|---|---|
| `ok` | 違反 0 件かつ入力エラーなしのときだけ `true` |
| `classification` | `implementation` / `non-implementation` / `unknown` (入力エラー時) |
| `implementationPaths` | 分類の根拠になった `src/` / `scripts/` の path (先頭から最大 5 件) |
| `violations` | `{ code, path, from? }` の配列。code は `protected-modified` / `protected-deleted` / `protected-renamed` |
| `error` | 入力エラーのときだけ `{ code, detail }`。code は既存の `GitDiffAdapterErrorCode` をそのまま使う |

- 違反は全件を path の辞書順で返す。最初の 1 件で打ち切らない。
- base の解決失敗、diff の読み取り失敗、不明 status、不正 path はすべて `ok=false` にする (fail-close)。
  - ref の解決失敗は `resolveCommit` の既存の扱いどおり `git-ref-invalid` になる。
  - ref の解決後に `git diff` の実行自体が失敗した場合は `git-command-failed` になる。これを「変更 0 件」として扱ってはならない (空 diff の PASS と区別する)。
- 終了 code は `ok=true` で 0、それ以外で 1 とする。`plan admission-check` (`src/cli/plan-admission.ts`) と同じ規約である。
- 人が読む出力は `design-protection: PASS` / `design-protection: BLOCK` の 1 行と、違反 1 件につき 1 行である。
  BLOCK の行には「契約の変更は src/scripts を含まない別 PR に分ける」旨を 1 行添える。
- `--json` で結果オブジェクトをそのまま出す。

## 6. 実装方式と既存資産の再利用

新しい仕組みは最小にし、既存の git 読み取り層を再利用する。

| 部品 | 方式 |
|---|---|
| git の実行 | `src/plan-admission/git-diff-adapter.ts` の `GitCommandPort` / `SystemGitCommandPort` をそのまま使う |
| commit の解決 | 同 file の `resolveCommit` を export して使う (挙動は変えない) |
| NUL 区切りの分解と path の検査 | 同 file の `splitNul` / `requirePath` を export して使う (挙動は変えない) |
| name-status の解釈 | 同 file の `parseNameStatus` から PLAN path の絞り込みを外した汎用版 `parseNameStatusEntries(fields)` を切り出す。既存の `parseNameStatus` はその結果を PLAN path で絞るだけにする。既存の admission テストは無変更で green のままであること |
| 変更の型 | `src/plan-admission/diff-fence.ts` の `PlanChange` (added / modified / deleted / renamed) をそのまま使う |
| エラーの型 | `GitDiffAdapterError` と `GitDiffAdapterErrorCode` をそのまま使う |
| 判定 | 新規 `src/github/design-protection.ts` に純粋関数 `classifyPullRequestChanges(changes) => "implementation" \| "non-implementation"` と `checkDesignProtection(input) => DesignProtectionResult` を置く |
| CLI | `ut-tdd github design-protection --base <ref> --head <ref> [--json]` を `src/cli.ts` の既存 `github` command group に 1 つ足す |

再利用しないもの:

- `src/github/change-lane.ts` の `GitDiffNamesPort` は `--name-only` で status を持たない。追加と変更を区別できないので使わない。
- `src/lint/branch-kind.ts` は working tree の `git status` を読むので、CI の PR 差分を見られない。使わない。
- PLAN admission の receipt 照合 (`diff-fence.ts`) には載せない。PLAN admission は v4 R05 で削除予定だからである (§7)。

v4 R05 で `src/plan-admission/` を削除するとき、本 gate が import している git 読み取り部品は削除できない。
削除すると typecheck が落ちるので、黙って消えることはない。そのときに中立な場所へ移す。

## 7. CI への接続点

既存の `.github/workflows/harness-check.yml` の `jobs.harness-check-linux.steps` に step を 1 つ足す。新しい workflow は作らない。
`harness-check-windows` と `node-generation-*` には足さない。

- 位置: `plan admission-check (PLAN 編集の receipt 照合、fail-close)` step の直後、`typecheck (tsc --noEmit)` step の前。
- 実行条件: step の `if` を `${{ github.event_name == 'pull_request' }}` にする。main への push の diff は複数 PR にまたがり、契約 PR と実装 PR が 1 つの diff に混ざって誤って拒否されるからである。lane (`steps.classify.outputs.lane`) による skip は付けない。
- 呼び出し: `env.BASE_SHA` に `${{ github.event.pull_request.base.sha }}` を置き、`run` を `node src/cli.ts github design-protection --base "$BASE_SHA" --head "${{ github.sha }}"` にする。`shell`、`id`、`continue-on-error` は付けない。
- `github.sha` は PR の merge commit で、その第 1 親が base.sha である。2 点 diff は「この PR が main に入れる変更」と一致する。

workflow だけを直しても CI policy は通らない。`src/lint/github-ci-policy.ts` の `checkLaneSkipSafety` は、各 runtime leg の
`steps` を `RUNTIME_STEP_MANIFESTS` と、順序込みの完全一致 (`canonicalSemantic` で正規化した JSON の比較) で照合する。
一致しなければ `missing_runtime_leg` (detail `jobs.<leg>.steps must exactly match the ordered canonical semantic manifest`) になる。
そのため、同じ実装 PR で次の 2 つを workflow と同時に直す。

1. `RUNTIME_STEP_MANIFESTS["harness-check-linux"]` の、`plan admission-check` の `step(...)` と `typecheck` の `run(...)` の間に、
   上の step と同じ `name` / `if` / `env` / `run` を持つ `step(...)` を 1 つ足す。`if` と式は既存の `githubExpression(...)` で組む。
   `name` は workflow と manifest で同じ文字列にする (例: `design-protection (実装 PR の設計書書き換え拒否、fail-close)`)。
2. `SOURCE_REQUIRED_STEPS` に `{ label: "design protection", any: ["github design-protection"] }` を足す。step が消えたときに、
   manifest 不一致とは別に `missing_step` でも検出するためである。

workflow と manifest の片方だけを直す PR は、`missing_runtime_leg` で fail する。
- PLAN admission とは独立に動く。PLAN を含むかどうかで結果は変わらない。
- v4 では Ticket / Gate の同じ規則へ移す。分類と拒否は path 集合だけで決まるので、そのまま移せる。

## 8. 不変条件 (DbC)

| contract point | 不変条件 |
|---|---|
| pre | `baseRef` と `headRef` は空でなく、NUL / LF / CR を含まない (既存 `resolveCommit` の検査そのもの。違反は `git-ref-invalid`)。それ以外の文字 (tab など) は検査せずに `git rev-parse --verify` へ渡し、解決できなければ同じく `git-ref-invalid` になる |
| post (分類) | 分類は変更 path の集合だけで決まる。PLAN kind、branch 名、PR 本文、変更の順序に依存しない |
| post (許可) | 非実装 PR では `violations=[]` かつ `ok=true` (入力エラーがなければ) |
| post (拒否) | 実装 PR で保護対象の既存ファイルを M / D / R した変更 1 件につき違反 1 件 |
| post (追加) | added と、保護対象外から保護対象への rename は違反にしない |
| invariant (fail-close) | 入力エラーは `ok=true` にならない。空の diff は「非実装 PR」で `ok=true` (読めた上で 0 件だから) |
| invariant (読み取り専用) | gate は git object も working tree も書き換えない |
| invariant (例外なし) | override の入口 (marker、label、環境変数、CLI option) を持たない |

## 9. 範囲外

- `tests/` の oracle の保護。oracle ID の無い既存テスト (baseline 433 件) があるため初版では扱わない。oracle ID 付きテストに限る後続として扱う。
- 「新規追加は可」を使った実質的な上書き (既存と矛盾する設計文書を新しく足すこと)。`duplicate-artifact-ownership` など他の検査の範囲である。
- `docs/governance/` や `docs/plans/` の保護。PLAN の編集は PLAN admission (`plan admission-check`) が見る。
- clean Pack の consumer workflow (`docs/templates/github/common/pack-harness-check.yml`) への展開。
- main への push event での検査。保護は PR の時点で効かせる (理由は §7)。

## 10. テスト設計の確定と oracle 昇格の運用 (PO 決定)

### 10.1 実測

直近 60 件の merge のうち、src / scripts を含む実装 PR は 17 件だった。
そのうち 11 件が `docs/test-design/` の既存ファイルを M していた。`docs/design/` を M / D / R した実装 PR は 0 件だった。
test-design の書き換えの多くは、`CANDIDATE-*` を正式 ID へ昇格して共有の `docs/test-design/harness/L7-unit-test-design.md` へ登録する編集である。
一部 (#870) は実装 PR の中で契約文そのものを書き換えていた。これはこの gate が止めたい形である。

測定は次の手順で再現できる。
`git log --first-parent --merges -n 60 main` の各 merge `m` について `git diff --name-status m^1 m` を取る。
`src/` か `scripts/` を含むものの中で、`^(M|D|R\d*)\tdocs/design/` と `^(M|D|R\d*)\tdocs/test-design/` に当たる PR をそれぞれ数える。

### 10.2 決定 (issue #898 comment 6052938069、案 B)

- 保護対象は `docs/design/` と `docs/test-design/` の両方のままにする。例外は作らない。
- テスト設計の確定、`CANDIDATE-*` から正式 ID への昇格、Red のテストは、src/ も scripts/ も含まない PR で入れる (契約 PR + Red)。
- 実装 PR (src/ か scripts/ を含む PR) はテスト設計に触れない。先に入った Red のテストを Green にするだけにする。
- `tests/` は gate の発火条件に入れない。契約 PR + Red が `tests/` を変えても非実装 PR のままである (§3)。
- 契約 PR + Red で入れる Red のテストは、main の CI を赤にしないよう Vitest の `it.fails` で書く (失敗している間は pass 扱いになる)。実装 PR は `it.fails` を `it` に戻して Green にする。この戻しは `tests/` の変更なので、この gate には当たらない。実装が先に通ってしまうと `it.fails` 自体が fail するため、Red が実際に赤だったことも CI で確かめられる。

この運用では、昇格と Red を入れる PR は src/ を含まないので、この gate を通る。
実装 PR は src/ を含むので、昇格や登録のために test-design を書き換えると §4 で拒否される。

## 11. 根拠

- v4 候補 `docs/governance/candidates/ut-tdd-concept-v4-requirements.md` の UTV4-FR-052 と、`docs/governance/candidates/ut-tdd-concept-v4-acceptance.md` の UTV4-AC-064。
- `CLAUDE.md` §PR スコープ規律 (1 PR = 1 論点、契約 freeze が実装 PR の前提)。
- issue #898 の control コメント (案 D の決定) と PO 決定 (comment 6052938069、案 B、§10.2)。
