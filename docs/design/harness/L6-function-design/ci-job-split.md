---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_ci_job_split
pair_artifact: docs/test-design/harness/L7-ci-job-split-test-design.md
parent_doc: docs/design/harness/L5-detailed-design/internal-processing.md
issue: 1981
created: 2026-11-25
---

> **L6 contract marker**: 本書は CI workflow の構造の契約であり、新しい実装関数を持たない。判定は、workflow YAML から取り出した実行計画 `extractExecutionPlan(workflow, lane, event) => CheckEntry[]` と、固定した manifest `tests/fixtures/ci/harness-check-contract.json` の比較で行う。pre: workflow は `.github/workflows/harness-check.yml`。post: 計画が manifest と集合で一致する (欠落・重複・条件の反転・環境の差はすべて不一致)。oracle は `docs/test-design/harness/L7-ci-job-split-test-design.md` の `CANDIDATE-CISPLIT-001`〜`011` が固定する。新しい管理機構は足さない (ADR-001 決定 4)。

# harness-check の Linux job を責務ごとに分ける - 機能設計 (Issue #1981)

## 1. 目的と範囲

`.github/workflows/harness-check.yml` の job `harness-check-linux` は、19 個の step を 1 つの job に持つ。PR の作法、静的検査、統治、回帰が 1 本の列に並び、vitest (約 461 秒) が終わるまで他の検査の結果が見えない。1 つの種類の失敗が出ても、job 名からは何が落ちたか分からない。

この Issue の効果は速さではない。実測 (control、2026-11-25、main の成功 run 5 本の中央値) では、律速は Windows の shard 3/3 (772 秒) であり、Linux を分けても全体の所要時間は変わらない。効果は次の 2 つである。

- vitest 以外の検査 (約 45 秒ぶん) の結果が、回帰の 8〜12 分を待たずに 1 分ほどで出る。
- 失敗が責務ごとの job 名で分かり、1 回の run で複数の種類の失敗が同時に見える。

範囲外 (§8) を除き、本書は job の分け方と、分けても検査の集合が変わらないことの確かめ方だけを定める。

既存の設計文書に、CI workflow の job 構造を持つものは無い (実測: `docs/design/` の `harness-check` を含む文書を確認した。`github-ci-node-version-file.md` は Node の版の参照だけを、`L7-windows-ci-single-snapshot-test-design.md` は Windows の回帰の 1 回実行だけを持つ)。そのため本書を新設する。

## 2. 分けた後の job

| job ID | 責務 | 実行する lane |
|---|---|---|
| `classify` | 変更ファイルを分類し lane を 1 回だけ決める。lane 証跡 (linux 脚) を書く | 常に実行 |
| `harness-check-pr-discipline` | PR の作法 (oracle baseline ratchet、branch-type guard、design-protection、privacy scan) | 常に実行 |
| `harness-check-static` | 静的検査 (typecheck、lint、doc lane checks、doc lane source doctor、audit quality) | 常に実行 (step 単位で lane を見る) |
| `harness-check-linux` | Linux の回帰 (db rebuild、doctor、vitest 全回帰、job summary) | 常に実行 (step 単位で lane を見る。doc lane でも skip しない) |
| `harness-check-windows` | Windows の回帰。**変更しない** | 常に実行 (step 単位で lane を見る) |
| `node-generation-linux` / `node-generation-windows` | Node generation。**変更しない** | 常に実行 |
| `harness-check` | 集約。必須 check 名は変えない (§5) | 常に実行 (`if: always()`) |

`harness-check-linux` の名前は回帰 job が引き継ぐ。名前を残す理由は、`src/lint/github-ci-policy.ts` の `HARNESS_LEGS` と aggregate の期待が、この名前を既に参照しているためである。

Linux の job は `classify` / `harness-check-pr-discipline` / `harness-check-static` / `harness-check-linux` の 4 つである。「統治」を独立の job にしない (#1981 の決定。`doctor` が回帰の job に残るため、統治の job に入る検査が無くなる)。`classify` 以外の 3 つは、すべて `needs: [classify]` を持つ。互いには `needs` を持たず、並列に走る。

## 3. 現行 step から job への対応

現行の `harness-check-linux` の step は 19 個である。次の表は各 step を **ちょうど 1 回** 配置する (準備の 3 step だけは、方針により各 job に複製し、まとめない。§8)。`if` 欄は現行 YAML の値を原文のまま写している。`-` は `if` が無いことを表す。

| # | 現行の step 名 | 現行の `if` | 配置先 |
|---|---|---|---|
| 1 | `checkout` | - | 全 Linux job に複製 |
| 2 | `setup node (harness 実行系の正式 runtime、PLAN-L7-462 step 2)` | - | 全 Linux job に複製 |
| 3 | `install deps (frozen)` | - | 全 Linux job に複製 |
| 4 | `oracle baseline ratchet (required on every PR)` | `${{ github.event_name == 'pull_request' }}` | `harness-check-pr-discipline` |
| 5 | `classify changed files (doc lane vs full, fail-close)` | - | `classify` |
| 6 | `write harness lane evidence` | - | `classify` (§4.3) |
| 7 | `upload harness lane evidence` | - | `classify` (§4.3) |
| 8 | `branch-type guard (commitlint / poc / hotfix)` | - | `harness-check-pr-discipline` |
| 9 | `design-protection (実装 PR の設計書書き換え拒否、fail-close)` | `${{ github.event_name == 'pull_request' }}` | `harness-check-pr-discipline` |
| 10 | `privacy scan (email の形、fail-close)` | - | `harness-check-pr-discipline` (#1981 の決定。PR の内容が規則に合うかの検査で、ratchet・branch-type・design-protection と同じ性質) |
| 11 | `typecheck (tsc --noEmit)` | `${{ steps.classify.outputs.lane == 'full' }}` | `harness-check-static` |
| 12 | `db rebuild (deterministic projection)` | `${{ steps.classify.outputs.lane == 'full' }}` | `harness-check-linux` |
| 13 | `doctor (governance hard gates)` | `${{ steps.classify.outputs.lane == 'full' }}` | `harness-check-linux` (#1981 の決定) |
| 14 | `test — 全回帰 (vitest run)` | `${{ steps.classify.outputs.lane == 'full' }}` | `harness-check-linux` |
| 15 | `doc lane checks (readability / rule-drift)` | `${{ steps.classify.outputs.lane == 'doc' }}` | `harness-check-static` |
| 16 | `doc lane source doctor` | `${{ steps.classify.outputs.lane == 'doc' }}` | `harness-check-static` |
| 17 | `lint (biome)` | - | `harness-check-static` |
| 18 | `audit quality (gate findings)` | `${{ steps.classify.outputs.lane == 'full' }}` | `harness-check-static` |
| 19 | `job summary (UT-TDD projection)` | `${{ always() }}` | `harness-check-linux` (#1981 の決定。doc lane でも job を skip しない) |

分けた後の `if` の書き換えは次のとおりである。lane の参照は `steps.classify.outputs.lane` から `needs.classify.outputs.lane` へ変わる。意味は変えない。`github.event_name == 'pull_request'` と `always()` は変えない。`harness-check-linux` の job 自体は lane で skip しない (doc lane でも実行する)。full 専用の step (12〜14) は、現行と同じ step の `if` で飛ばす。`job summary` は `if: always()` のまま doc lane でも走る。job ごと skip すると、走る検査の集合が変わるためである (#1981 の決定)。step の `if` の意味は manifest が比べる (§6)。

**3.1 step 間のファイルと状態の受け渡し (現行 YAML から洗い出した)**

| 生産する step | 消費する step | 受け渡しの中身 | 扱い |
|---|---|---|---|
| 13 `doctor` | 14 `test` | `${{ runner.temp }}/ut-tdd-doctor-result.json` (`UT_TDD_DOCTOR_RESULT_FILE`)。vitest の fence が doctor を二重実行せず消費する (PLAN-L7-461)。消費は宣言済みの surface が完全一致のときだけで、一致しなければ vitest が従来どおり自走する | 同じ job (`harness-check-linux`) に置く (#1981 の決定) |
| 12 `db rebuild` | 13 `doctor`、14 `test`、19 `job summary` | `.ut-tdd/harness.db` の projection。`job summary` は `openHarnessDb` で読む (`src/github/job-summary.ts`) | 同じ job に置く |
| 5 `classify` | 6、11〜16、18 | step output `lane` | job の outputs へ出し、`needs` で配る (§4) |
| 6 `write harness lane evidence` | 7 `upload harness lane evidence` | `${{ runner.temp }}/lane-evidence.json` と step output `leg` | 同じ job (`classify`) に置く |
| 8 `branch-type guard` | (同じ step 内) | `.ut-tdd-pr-body.txt` | step 内で完結する。分離の影響なし |

`audit quality` (18) は `src/audit/quality.ts` がファイルだけを読むので、`db rebuild` に依らない (実測)。そのため `harness-check-static` に置ける。

## 4. lane の値

### 4.1 決め方

`classify` job は、現行の step 5 と同じコマンド (`node src/cli.ts github classify-changes ... --github-output "$GITHUB_OUTPUT"`) を 1 回だけ実行し、step output `lane` を **job の outputs** `lane` として出す。

他の Linux job は `needs: [classify]` を持ち、`needs.classify.outputs.lane` を読む。各 job が自分で分類し直さない。

### 4.2 読み方 (fail-close)

lane の値は `full` と `doc` の 2 値だけである。次の場合は、暗黙に `full` へも `doc` へも読み替えない。

- `classify` が `success` でない (`failure` / `cancelled` / `skipped`)。
- `lane` が空である。
- `lane` が `full` でも `doc` でもない。

この 3 つは、job の `if` では「どちらでもない」として扱い、**集約 job で必ず失敗させる** (§5)。個々の job の `if` は `== 'full'` と `== 'doc'` の等値比較だけを使い、`!= 'doc'` のような否定で `full` を導かない (導くと、空や未知の値が `full` に読み替わる)。

### 4.3 lane 証跡

step 6 と 7 (lane 証跡の書き出しと upload) は `lane` の値を使うので、`classify` job に置く。artifact 名 `harness-lane-linux-attempt-<run_attempt>` と中身 (`leg: linux`) は変えない。集約 job の `scripts/windows-ci-shard-aggregate.mjs` は `REQUIRED_LEGS` に `linux` を要求し、`harness-lane-<leg>-attempt-<N>` の形の artifact を読むので、名前と leg が変わらなければ集約側の admission は変えずに済む (実測: 同 script と `src/lint/windows-ci-shard-admission.ts` の `LANE_LEGS`)。

Windows の回帰 job は現状のまま、自分で `classify` する (job 間で output を共有しない現行方針を変えない)。Windows を `needs.classify` へ寄せるかどうかは本書の範囲外であり、決めない (#1981 の決定: 変えない。非目標)。

## 5. 集約 job の判定

集約 job `harness-check` は、必須 status check の名前 `harness-check` のまま変えない。branch protection は変更しない。`if: always()` を保ち、`needs` に `classify` と、§2 の全 job を持つ。

判定は次の 3 段で、すべてを満たしたときだけ成功する。1 つでも外れたら失敗する。

1. `needs.classify.result` が `success` で、`needs.classify.outputs.lane` が `full` か `doc` のどちらかである (§4.2)。
2. lane に対応する §5.1 の表のとおり、**各 job の `result` が期待値と完全に一致する**。「`success` か `skipped` なら通す」という緩い判定にしない。期待は全 job が `success` だけであり、`skipped` を期待値に持たない。どの job でも `skipped` を見たら失敗する (§5.1)。
3. `failure` と `cancelled` は、期待が何であっても失敗とする。

現行の集約 job の後続 step (`admit exact Node generation run`、Windows の lane 証跡と shard 証跡の admission) は変えない。

**5.1 lane ごとの期待結果**

| job | lane = `full` | lane = `doc` |
|---|---|---|
| `classify` | `success` | `success` |
| `harness-check-pr-discipline` | `success` | `success` |
| `harness-check-static` | `success` | `success` |
| `harness-check-linux` (回帰) | `success` | `success` |
| `harness-check-windows` (3 shard の matrix 全体) | `success` | `success` |
| `node-generation-linux` | `success` | `success` |
| `node-generation-windows` | `success` | `success` |

どちらの lane でも期待は全 job が `success` である (#1981 の決定)。doc lane でも、`harness-check-static` と `harness-check-linux` は job として実行され、full 専用の step (typecheck、audit quality、db rebuild、doctor、vitest) だけが step の `if` で skip される。`job summary` は `if: always()` で doc lane でも走る。集約は `skipped` を期待値に持たず、どの job でも `skipped` を見たら失敗にする。

## 6. 検査の契約 manifest

分けても「何を検査するか」が変わらないことを、機械で確かめる。確かめる対象は、job の置き場ではなく、**lane と event ごとに実行される検査の集合** である。

### 6.1 置き場と固定の仕方

- 置き場: `tests/fixtures/ci/harness-check-contract.json` (1 ファイル)。
- 固定の元: **分割前の** `harness-check.yml` (本書の起草時点の main `21bbe1643`、485 行)。Red PR で、現行 YAML から取り出した計画と manifest が一致することをテストで示してから (現行で緑)、分割後の構造を求めるテストを足す。
- manifest を **分割後の YAML から生成しない**。生成すると、欠落も重複も manifest に取り込まれ、比べる意味が無くなる。manifest の更新は、検査を意図して足す・外す PR で、設計文書の改訂と一緒に人が書く。

### 6.2 形

manifest は、検査 1 件を 1 つのエントリとする配列を、`lane` (`full` / `doc`) と `event` (`pull_request` / `push`) の組ごとに持つ。エントリの欄は次の 5 つである。

| 欄 | 内容 |
|---|---|
| `check_id` | 検査の識別子。小文字 ASCII の kebab-case。現行の step 名から 1 対 1 に付ける (例: `oracle-baseline-ratchet`、`doctor-full`、`vitest-full`) |
| `command` | 実行するコマンドと引数。`run` の本文 (複数行はそのまま)、または `uses` と `with` |
| `condition` | その lane・event で実行されるかどうか。step の `if` と job の `if` を、lane と event を代入して評価した結果 (実行する / しない) |
| `env` | step の `env` のキーと値の式 (`${{ ... }}` は式のまま) |
| `shell` | 明示された shell。無ければ空 |

準備の 3 step (`checkout`、`setup node`、`install deps`) は manifest に入れない (§8)。

### 6.3 比較

テストは、分割後の workflow から、lane と event の組ごとに「実行される step」を取り出す。取り出しは job の `if` と step の `if` を評価し、`needs` で渡る lane の値を代入する。取り出した計画を、manifest の同じ組と **集合として** 比べる。

- manifest にあって計画に無い検査 (欠落) は不一致である。
- 計画にあって manifest に無い検査は不一致である。
- 同じ `check_id` が計画に 2 回以上現れる (重複) は不一致である。
- `check_id` が同じでも、`command`・`condition`・`env`・`shell` のどれかが違えば不一致である。
- 実行される job の置き場 (どの job に属すか) は比べない。置き場は §3 の表と §5.1 の表で別に確かめる。

## 7. 既存の参照の追従 (Green PR で扱う)

次の既存の参照は、分割で `harness-check-linux` の step の列が変わるため、Green PR で同時に追従させる。本書では中身を変えない。

- `src/lint/github-ci-policy.ts` の `RUNTIME_STEP_MANIFESTS["harness-check-linux"]`、`LANE_SKIPPABLE_FULL_ONLY_STEP_MATCHERS`、`checkLaneSkipSafety` が持つ、`harness-check-linux` の step の完全一致と lane の skip の許可表。新しい job 構成に合わせて、job ごとの期待 step へ分ける。
- `tests/design-protection-repository-contract.test.ts` と `tests/github-ci-node-version-file.test.ts` が `jobs["harness-check-linux"].steps` を直接読む箇所。step の置き場が変わる。
- `harness-check.yml` の冒頭コメント (lane の allowlist の記述) は `tests/change-lane.test.ts` が parse して `DOC_LANE_PREFIXES` と照合する。コメントの該当部分は、分割後も残す。

どの参照をどう直すかの詳細は、Red PR と Green PR で決める。この項は、見落としを防ぐための一覧である。

## 8. 範囲外

- 検査の追加・削除・弱体化はしない。検査の集合は分割の前後で同じである (§6 が確かめる)。
- 準備の step (`checkout`、`setup node`、`npm ci`) を 1 か所にまとめない。composite action や reusable workflow は使わない (advisor 相談の採用結果。準備は 1 job あたり約 7 秒で、まとめても得が小さい。reusable workflow は job の境界・権限・outputs まで変える)。分割後は各 Linux job が同じ 3 step を持つ。
- Windows の shard の偏り (shard 3/3 が 1/3・2/3 より約 2〜3 分長い) の解消と、timeout の設定は #1673 と #1956 が持つ。
- oracle baseline ratchet の shell (約 90 行) を `scripts/` の薄い入口へ出す整理は、#1981 の別 PR で行う。整理の PR は、manifest の `command` の記述を同じ PR で更新して比較を通す。
- branch protection の設定変更。必須 check 名は `harness-check` のままである。
- 実装 (job の分割) は Green PR で行う。本書は契約だけである。
