---
title: "L7 snapshot runner lock test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/snapshot-runner-lock.md
status: confirmed
updated: 2026-11-13
issue: 1665
---

# snapshot runner の同時実行の排他 テスト設計 (issue #1665)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/snapshot-runner-lock.md` (未実装の目標契約) である。本書はその §4 lock の範囲と置き場、§5 世代ファイルによる取得と解放、§6 待ち方と順番、§7 古い claim の判定、§8 入れ子の実行と CI、§9 終了コードと出力、§10 Vitest の一時 dir の衝突、§11 の DbC を検証する oracle を、候補 ID `CANDIDATE-U-SNAPLOCK-001`〜`029` で宣言する。共有の `docs/test-design/harness/L7-unit-test-design.md` には、この PR では索引の行を足さない (設計 §14 の 3 で足す)。

進め方は設計保護 gate の三段階に従う。

1. **Red**: 候補 ID を引用した `it.fails` を `tests/snapshot-runner-lock.test.ts` に入れる (029 は `tests/snapshot-root-hygiene.test.ts`)。各 Red の前提 (fixture が作れる、stub が呼ばれる、一時 dir が在る) は、同じ準備処理を使う対の通常 `it` で確かめ、準備の失敗が期待どおりの失敗に紛れないようにする (#1452 と同じ流儀)。
2. **昇格 (src を含まない)**: 接頭辞 `CANDIDATE-` を外した正式 ID `U-SNAPLOCK-*` へ全件改め、テスト名の引用を同時に書き換える。正式 ID を引用より先に作らない (`oracle-test-trace`)。
3. **実装 PR**: `it.fails` を `it` に戻して Green にする。実装 PR は `docs/test-design/` を変えない。

**Red の弱さの明示**: 対象の module (`src/runtime/snapshot-runner-lock.ts`) が無い間、動的 import の失敗で `it.fails` が通る。これは個々の規則が Red である証拠ではない。Green の PR は、§4 の表の変異を 1 つずつ入れて、対応する oracle がちょうど 1 つ落ちることを確かめてから `it` に戻す。

## 2. テストレベルと fixture

- **block A (純関数)**: `resolveSnapshotLockMode` / `parseSnapshotLockWaitMs` / `presenceFromKill` / `classifySnapshotLockClaim` / `decideSnapshotLockStep` / `identityProbeDue` / `snapshotStageEnv` / `snapshotLockDir` を直接呼ぶ。ファイル・環境変数・時刻・実 process を使わない。入力は設計 §11 の型を手で組み、最小の完備な入力を基準に 1 点だけ変える。
- **block B (取得と解放の手順)**: `acquireSnapshotLock` と解放を、ファイル操作を記録する偽の io (操作名と path を順に記録し、ファイルの中身を map で持つ) と、`presence` / `observeIdentity` / `now` / `sleep` / `write` の stub で呼ぶ。**`resolveMode` / `classify` / `decide` は stub にする** (純関数の変異が block B に漏れないようにするため)。`decide` の stub は「現在の世代が無いか `free` か `stale` なら次の世代の `attempt`、`live` なら待った時間が上限に届くまで `wait`、届いたら `give_up`」に固定する。env は `{}` (CI も token も無い) を基準にし、lock dir の期待値は `snapshotLockDir(tmpRoot)` から計算する。016 だけは link の排他を実物で確かめるため、`mkdtemp` で作った一時 dir の実 fs を使う。
- **block C (入口の関数)**: `runSnapshotRunnerMain(argv, env, deps)` を、`acquire` / `release` / `run` / `parseWaitMs` / `stageEnv` / `write` の stub と `getuid` の注入で呼び、呼び出しの順序と終了コードと stderr を観測する。
- **block D (テストの衛生)**: `tests/support/` の `ownSnapshotRootEntries(names, pid)` を直接呼ぶ。
- 開発 repo の作業 tree を読むテストは無い (`repositoryReadContracts` の登録は要らない)。

## 3. 候補 oracle

### 3.1 block A (純関数)

| ID | 対象 | 入力 | 期待 (設計の節) |
|---|---|---|---|
| `CANDIDATE-U-SNAPLOCK-001` | `resolveSnapshotLockMode` | current は null。env が (a) `{ CI: "true" }` (b) `{ CI: "false" }` (c) `{ CI: "1" }` (d) `{ CI: "" }` (e) `{}` | (a) `skip_ci`、(b)〜(e) `acquire` (§8 の 1) |
| `CANDIDATE-U-SNAPLOCK-002` | `resolveSnapshotLockMode` | env に CI は無い。current は世代 3 (lockId `L3`、released でない)、presence true を基準に、(a) token `L3` (b) token `L9` (c) token `L3` で presence false (d) token `L3` で released (e) token 無し (f) token `L3` で presence `"unknown"` | (a)(f) `nested`、(b)(c)(d)(e) `acquire` (§8 の 2) |
| `CANDIDATE-U-SNAPLOCK-003` | `parseSnapshotLockWaitMs` | `undefined` / `""` / `"0"` / `"120000"` / `"-1"` / `"1.5"` / `" 5"` / `"5s"` / `"9007199254740992"` | 前の 4 つは ok で 0 / 0 / 0 / 120000、後ろの 5 つは `ok: false` (§6) |
| `CANDIDATE-U-SNAPLOCK-004` | `presenceFromKill` と `classifySnapshotLockClaim` | code が null / `"EPERM"` / `"ESRCH"` / `"EINVAL"`。有効な記録を presence `"unknown"`・観測 `"not_observed"` で分類 | true / true / false / `"unknown"`。分類は `live` (§7) |
| `CANDIDATE-U-SNAPLOCK-005` | `classifySnapshotLockClaim` | 有効な記録、presence false、観測が (a) `"not_observed"` (b) 記録と同じ identity | 両方 `stale` (§7 K2) |
| `CANDIDATE-U-SNAPLOCK-006` | `classifySnapshotLockClaim` | 有効な記録 (startToken `T1`)、presence true、観測が (a) 同じ pid で `T2` (b) `"query_failed"` (c) null (d) 同じ pid で `T1` (e) 同じ pid で startToken null (f) `"not_observed"` | (a)(c) `stale`、(b)(d)(e)(f) `live` (§7 K3〜K5) |
| `CANDIDATE-U-SNAPLOCK-007` | `classifySnapshotLockClaim` | presence true・観測 `"not_observed"` で、記録が (a) `"unreadable"` (b) startToken が null (c) startToken が `""` (d) pid が 0 (e) lockId が無い | 全て `stale` (§7 K1) |
| `CANDIDATE-U-SNAPLOCK-008` | `decideSnapshotLockStep` | waited 0、max 600000。(a) current null、live の待っている者 A (queuedAt t1)、self は t2 (> t1) (b) current stale で (a) と同じ (c) current free、A と self の queuedAt が同じで lockId は A=`a`・self=`b` (d) (c) で A=`b`・self=`a` (e) current free、A は (t2, `a`)、self は (t1, `z`) | (a)(b)(c) `wait`、(d)(e) `attempt`。世代番号は検査しない (§6 の順番) |
| `CANDIDATE-U-SNAPLOCK-009` | `decideSnapshotLockStep` | waited 0、max 600000。(a) current null、待っている者は stale の S (queuedAt t0) だけ、self は t1 (b) current null で待っている者なし (c) current free 世代 7 (d) current stale 世代 7 | (a) `attempt`、(b) 世代 1 の `attempt`、(c)(d) 世代 8 の `attempt` (§6、§5) |
| `CANDIDATE-U-SNAPLOCK-010` | `decideSnapshotLockStep` | 待っている者なし。current live 世代 2 で (a) waited 59999・max 60000 (b) waited 60000・max 60000 (c) waited 0・max 0。current free で (d) waited 70000・max 60000 | (a) `wait`、(b)(c) `give_up`、(d) `attempt` (§6 の上限) |
| `CANDIDATE-U-SNAPLOCK-011` | `identityProbeDue` | (前回, 今) が (null, 0) / (1000, 300999) / (1000, 301000) / (1000, 1000) | 順に true / false / true / false (§6) |
| `CANDIDATE-U-SNAPLOCK-012` | `snapshotStageEnv` | base env が `{ PATH: "p" }` と `{ PATH: "p", UT_TDD_SNAPSHOT_LOCK_TOKEN: "old" }` の 2 つ。acquisition が (a) acquired (lockId `L5`) (b) nested (c) skipped_ci | (a) 両方の base で token が `L5`、他の key は base と同じ。(b)(c) 返り値が base と deep equal (§8 の token の受け渡し) |
| `CANDIDATE-U-SNAPLOCK-013` | `snapshotLockDir` | tmpRoot が `/t` と `C:\t` | `join(tmpRoot, "ut-tdd-snapshot-runner-lock")`。名前は `ut-tdd-vitest-` で始まらず、寿命の契約の名前の規則 `ut-tdd-vitest-(head-\|cache-)?\d+-\d+` に一致しない (§4、I8) |

### 3.2 block B (取得と解放の手順)

| ID | 対象 | 入力 | 期待 (設計の節) |
|---|---|---|---|
| `CANDIDATE-U-SNAPLOCK-014` | nested / skip_ci の経路 | 世代 1 (lockId `L1`) が在る lock dir。`resolveMode` の stub が (a) `nested` (b) `skip_ci` | (a) `{ kind: "nested", generation: 1 }` と `snapshot-lock: nested` の行、(b) `{ kind: "skipped_ci" }` と `snapshot-lock: skipped reason=ci` の行。両方とも書き込み系の操作 (mkdir / writeFile / rename / link / unlink) が 0 回、`observeIdentity` の呼び出しが 0 回 (§8、I5) |
| `CANDIDATE-U-SNAPLOCK-015` | 経過時間を使わない | 世代 1 の記録の `acquiredAt` と `queuedAt` が now の 10 時間前。`classify` の stub は常に `live`。maxWait 4000 | busy で holder は世代 1。`gen-2.json` は作られず、`gen-1.json` は残る (§7、I1) |
| `CANDIDATE-U-SNAPLOCK-016` | 排他的な作成 (実 fs) | 一時 dir の lock dir に、他者の記録の `gen-2.json` を置く。`decide` の stub は 1 回目に世代 2 の `attempt`、2 回目以降は `give_up` を返す | 1 回目の link は `EEXIST` で失敗し、`gen-2.json` の中身は他者の記録のまま。結果は busy (§5 手順 4、I3) |
| `CANDIDATE-U-SNAPLOCK-017` | 解放 | (a) 世代 5 の handle で、現在も世代 5 (b) 世代 5 の handle で、世代 6 が在る | 両方とも新しく作られるのは `released-5` だけ。`gen-5.json` と `gen-6.json` は消えず rename もされない。(b) で `released-6` は作られない (§5 の解放、I2) |
| `CANDIDATE-U-SNAPLOCK-018` | I/O の失敗 | (a) link が `EPERM` を投げる (b) readdir が `EACCES` を投げる | 各々 `{ kind: "unavailable" }` で reason が `EPERM` / `EACCES`。世代ファイルを作らず、busy も返さない (§5 手順 4、§9、I3) |
| `CANDIDATE-U-SNAPLOCK-019` | 自分の queue entry の後始末 | maxWait 4000 で (a) current が live (stub) のまま上限に届く (b) current が無く取得する | (a) busy、(b) acquired。両方とも終了時に `queue/<自分の lockId>.json` が無い (§5 手順 5、§6) |
| `CANDIDATE-U-SNAPLOCK-020` | stale の世代の置き換え | 世代 3 (`classify` の stub は `stale`)、待っている者なし | acquired で世代 4。操作の記録で、`gen-4.json` への link の成功より前に `gen-3.json` の unlink も rename も無い (§5 の「古い世代は消さない」、I2) |
| `CANDIDATE-U-SNAPLOCK-021` | 待っている者の記録 | current は live (stub)。queue に S (`classify` の stub は `stale`) と L (`live`)。maxWait 4000 | 終了時に S の記録は消え、L の記録は残る (§6 の最後の項) |
| `CANDIDATE-U-SNAPLOCK-022` | 整理 | `gen-1`〜`gen-39` と `released-1`〜`released-39` が在り、current は世代 39 の free | 世代 40 を取得する。`gen-1`〜`gen-8` と `released-1`〜`released-8` が消え、`gen-9`〜`gen-39` と `released-9`〜`released-39` は残る (§5 の整理) |
| `CANDIDATE-U-SNAPLOCK-023` | 自分の identity | `observeIdentity(自分の pid)` が (a) `"query_failed"` (b) null (c) startToken null の identity | 各々 `{ kind: "unavailable" }` で、書き込み系の操作が 0 回 (§5 手順 1、I4) |
| `CANDIDATE-U-SNAPLOCK-024` | 待っている間の行 | 時計を注入する。current は世代 1 が live で、130,000 ms 後に `released-1` が現れる。maxWait 600000 | `waiting` 1 行、`still-waiting` 2 行 (60,000 ms と 120,000 ms)、`acquired` 1 行の計 4 行だけ (§9、I10) |
| `CANDIDATE-U-SNAPLOCK-025` | 範囲 | 同じ tmpRoot で repoRoot が違う 2 回の取得。1 回目は取得して解放しない。2 回目は maxWait 0 で、`classify` の stub は 1 回目の記録を `live` とする | 2 回目は busy で、holder の lockId が 1 回目のもの (§4、I8) |

### 3.3 block C (入口の関数)

| ID | 対象 | 入力 | 期待 (設計の節) |
|---|---|---|---|
| `CANDIDATE-U-SNAPLOCK-026` | 取得より前の判定 | argv が `--help` / `--not-an-option` / `--watch`、getuid が 0、`parseWaitMs` の stub が `{ ok: false }` (各々別のケース) | `acquire` の stub が 1 回も呼ばれない (I6) |
| `CANDIDATE-U-SNAPLOCK-027` | 順序と解放 | 普通の argv。`acquire` の stub は acquired、`stageEnv` の stub は目印の env を返す。(a) `run` の stub が正常に戻る (b) `run` の stub が例外を投げる | (a) `acquire` → `stageEnv` → `run` → `release` の順に 1 回ずつ呼ばれ (取得より前の判定との順序は 026 が見るので、ここでは検査しない)、`run` の第 3 引数が目印の env。(b) `release` が `run` の後に呼ばれ、`run` の例外がそのまま投げ直される (I6、I7、§8) |
| `CANDIDATE-U-SNAPLOCK-028` | busy と unavailable | `acquire` の stub が (a) busy (holder の pid 4242、lockDir `D`) (b) unavailable (reason `EPERM`、lockDir `D`) | (a) 終了コード 2、(b) 3。両方とも `acquire` より後に `run` も `release` も呼ばれない。(a) の stderr に `holder_pid=4242` と `lock=D`、(b) に `reason=EPERM` と `lock=D` がある (§9) |

### 3.4 block D (テストの衛生)

| ID | 対象 | 入力 | 期待 (設計の節) |
|---|---|---|---|
| `CANDIDATE-U-SNAPLOCK-029` | `ownSnapshotRootEntries` | pid 123 で names が `ut-tdd-vitest-123-1`、`ut-tdd-vitest-head-123-1`、`ut-tdd-vitest-cache-123-1`、`ut-tdd-vitest-456-1`、`ut-tdd-vitest-1230-1`、`ut-tdd-vitest-leases`、`ut-tdd-snapshot-runner-lock`、`other` | 最初の 3 つだけを返す (§10) |

## 4. 変異 × oracle の表

正しい実装を基準に、規則を 1 か所だけ壊した変異を先に列挙した。表の ● はその変異で落ちる oracle、・ は落ちない oracle である。各行の ● はちょうど 1 つで、各列の ● は 1 つ以上である (表の下の検出数)。

**block をまたいで検出が重ならない理由**: block A の oracle は純関数だけを呼ぶので、block B〜D の変異 (取得の手順・entrypoint・helper) は結果を変えない。block B の oracle は `resolveMode` / `classify` / `decide` を stub にし、env に CI も token も持たず、lock dir の期待値を `snapshotLockDir` から計算するので、block A の変異は結果を変えない (M24 / M25 の観測の間隔も、block B は 014 と 023 以外で観測の回数を検査せず、014 は観測しない経路、023 は自分の identity を間隔に依らず 1 回観測する経路である)。block C の oracle は `acquire` / `release` / `run` / `parseWaitMs` / `stageEnv` を stub にするので、block A と B の変異は結果を変えない。block D は helper だけを呼ぶ。

#### block A (純関数)

| 変異 | 内容 | 001 | 002 | 003 | 004 | 005 | 006 | 007 | 008 | 009 | 010 | 011 | 012 | 013 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M01 | CI が `"true"` でも skip しない | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M02 | CI が空でない任意の値で skip する | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M03 | token が現在の lockId と違っても nested にする | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M04 | holder の presence が false でも nested にする | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M05 | released の世代でも nested にする | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M06 | 不正な待ち時間の値を既定値として受ける | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M07 | 未設定のときの既定値が 0 でない | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M08 | `EPERM` を false にする | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M09 | `ESRCH` を unknown にする | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M10 | presence unknown を stale にする | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M11 | presence false を live にする | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M12 | startToken の不一致を見ない | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M13 | 観測の `"query_failed"` を stale にする | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M14 | 観測の null を live にする | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M15 | 読めない記録を live にする | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ |
| M16 | 必須の値の検査を外す | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ |
| M17 | 先頭でなくても attempt する | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ |
| M18 | lockId だけで順番を決める | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ |
| M19 | stale の待っている者を先頭に数える | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ |
| M20 | attempt の世代番号を現在の番号のままにする | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ |
| M21 | 上限を過ぎても give_up しない | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ |
| M22 | 上限の 1 ms 前に give_up する | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ |
| M23 | 取得できる状態でも上限を過ぎたら give_up する | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ |
| M24 | identity を初回しか観測しない | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ |
| M25 | identity を毎回観測する | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ |
| M26 | 取得したとき token を stage の環境に足さない | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ |
| M27 | skip_ci で token を足す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ |
| M28 | lock dir の名前を `ut-tdd-vitest-` で始める | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● |
| 検出数 | | 2 | 3 | 2 | 3 | 1 | 3 | 2 | 2 | 2 | 3 | 2 | 2 | 1 |

block A の中で重ならない理由: 分類の規則は K1 (記録の検査) → K2 (presence) → K3 / K4 (観測) → K5 の順に効く。005 は presence false なので K3 / K4 の変異 (M12〜M14) が効かず、006 は有効な記録・presence true なので K1 / K2 の変異 (M11、M15、M16) と presence の写像の変異 (M08〜M10) が効かない。004 は観測が `"not_observed"` なので M12〜M14 が効かない。007 は K1 で決まるので後ろの規則の変異が効かない。008 は stale の待っている者を持たず、`action` だけを検査し、待った時間は上限よりずっと小さい。009 は live の待っている者が self だけなので先頭の判定と順番の変異 (M17 / M18) が効かず、010 は待っている者を持たず `action` だけを検査する。001 は token を持たず、002 は CI を持たない。

#### block B (取得と解放の手順)

| 変異 | 内容 | 014 | 015 | 016 | 017 | 018 | 019 | 020 | 021 | 022 | 023 | 024 | 025 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M29 | nested / skip_ci で lock dir に書くか identity の port を呼ぶ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M30 | nested / skip_ci の行を出さない | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M31 | acquiredAt の経過 (#1460 と同じ 45 分) で live の世代を置き換える | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M32 | 既存の世代ファイルを上書きする | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M33 | 解放で世代ファイルを消すか rename する | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M34 | 解放で自分でなく現在の世代の印を作る | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M35 | lock の I/O の失敗で lock なしに進む | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M36 | `EEXIST` 以外の link の失敗を busy にする | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M37 | give_up のとき自分の queue entry を残す | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ |
| M38 | 取得のとき自分の queue entry を残す | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ |
| M39 | stale の世代を置き換えない | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ |
| M40 | 次の世代の link より前に現在の世代ファイルを消すか rename する | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ |
| M41 | stale の待っている者の記録を残す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ |
| M42 | live の待っている者の記録を消す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ |
| M43 | 整理で `g − 32` より新しい世代を消す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ |
| M44 | 整理をしない | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ |
| M45 | 自分の startToken が得られなくても書く | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ |
| M46 | 待っている間に何も出さない | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ |
| M47 | 繰り返しごとに still-waiting を出す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ |
| M48 | lock dir を checkout から決める | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● |
| 検出数 | | 2 | 1 | 1 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 1 |

block B の中で重ならない理由: 各 oracle は自分の対象の観測だけを検査する。015 と 021 は current が live なので link を試さず (M32 / M36 が効かない)、自分の queue entry を検査しない (M37 が効かない)。016 は link が `EEXIST` なので M36 が効かない。018 は既存の世代ファイルへの作成を起こさない (M32 が効かない)。019 は他の待っている者を持たない (M41 / M42 が効かない)。020 は link の成功より前の操作だけを検査するので、link の後に走る整理の変異 (M43 / M44) と queue entry の変異 (M38) が効かない。022 は current が free なので置き換えの変異 (M39 / M40) が効かない。023 は I/O の失敗を起こさない (M35 が効かない)。015 以外の oracle は、記録の `acquiredAt` を開始時の now にし、偽の時計で 130,000 ms 以内に終わるので M31 が効かない。014 は取得の手順に入らない。

#### block C (入口の関数)

| 変異 | 内容 | 026 | 027 | 028 |
|---|---|---|---|---|
| M49 | 引数・root・待ち時間の判定より前に取得する | ● | ・ | ・ |
| M50 | 取得より前に run を呼ぶ | ・ | ● | ・ |
| M51 | run の完了より前に解放する | ・ | ● | ・ |
| M52 | run が失敗したとき解放しない | ・ | ● | ・ |
| M53 | stageEnv の結果を run に渡さない | ・ | ● | ・ |
| M54 | busy / unavailable の後に run か release を呼ぶ | ・ | ・ | ● |
| M55 | busy を 2、unavailable を 3 以外の終了コードにする | ・ | ・ | ● |
| M56 | busy の行に `holder_pid=` か `lock=`、unavailable の行に `reason=` か `lock=` が無い | ・ | ・ | ● |
| 検出数 | | 1 | 4 | 3 |

block C の中で重ならない理由: 026 は取得に届かないので、取得の後の変異 (M50〜M56) が効かない。027 は acquired の経路だけなので、busy / unavailable の変異 (M54〜M56) が効かない。027 は取得より前の判定との順序を検査しないので、M49 も効かない。028 は「`acquire` より後の」呼び出しだけを検査するので、`acquire` の前に `run` を呼ぶ M50 は 028 では落ちない。M51〜M53 は acquired の経路の中の変異で、busy / unavailable の経路を通らない。

#### block D (テストの衛生)

| 変異 | 内容 | 029 |
|---|---|---|
| M57 | 接頭辞 `ut-tdd-vitest-` だけで照合する | ● |
| M58 | pid の直後の `-` を照合しない | ● |
| 検出数 | | 2 |

## 5. 受け入れの実測 (oracle ではない)

設計 §13 の実測 1〜6 は、2 本以上の実 runner と実 process を使う 1 回の確認であり、自動テストの oracle にしない (表の「ちょうど 1 つ」の性質を、多くの規則をまとめて通る試験で崩さないため)。Green 2 の PR で手順と結果 (使った worktree、出た `snapshot-lock:` の行、終了コード) を PR 本文に残す。

- 実測 1 と 2 は、別々の worktree から同時に起動する。
- 実測 3 は holder を `taskkill /F` (Windows) / `kill -9` (Linux) で止め、待っている者が次の世代を作るまでの時間を記録する。
- 実測 4 は、runner の下で U-TESTHYGIENE-043 を含む 1 ファイルを流す。
- 実測 6 は、Claude lane・Codex lane・review worktree の各 runner の `lock=` を比べる。値が違えば設計 §4 の範囲の決め方へ戻る。

## 6. 注記

- 本書の候補は、昇格前に正式な oracle として扱わない。
- U-TESTHYGIENE-050 / 051 の oracle の意味は変えない。029 の helper を使うように両テストの観測の範囲を狭めるのは、テストだけの PR (設計 §14 の 6) で行う。
- 既存の runner の oracle (`tests/vitest-snapshot-runner.test.ts`、`tests/snapshot-runner-argv-candidates.test.ts`、`tests/global-setup-fence.test.ts`、`tests/windows-ci-single-snapshot.test.ts`) の期待値は変えない。CI では `skip_ci`、runner の下では `nested` になり、どちらも子 process を起動しないので、clone より前の spawn の列 (U-SNAPARG の互換の検査) は変わらない。変える必要が出たら設計の改訂へ戻る。
- 変異の ID (`M01`〜`M58`) は本書の中だけの番号であり、oracle の ID ではない。
