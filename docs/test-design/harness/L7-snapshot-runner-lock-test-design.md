---
title: "L7 snapshot runner lock test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/
parent_doc: docs/design/harness/L6-function-design/snapshot-runner-lock.md
status: confirmed
updated: 2026-11-17
issue: 1665
---

# snapshot runner の同時実行の排他 テスト設計 (issue #1665)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/snapshot-runner-lock.md` (未実装の目標契約) と、そこから取得の手順と記録の読み取りを分けた `docs/design/harness/L6-function-design/snapshot-runner-lock-protocol.md` (以下「手順書」、同じく本書を対に持つ) である。2 本の設計を 1 本で受けるので、frontmatter の `pair_artifact` は両者の置き場の dir を指し、`parent_doc` で本体を指す (`L7-confirmed-document-placeholder-detection-test-design.md` と同じ形)。本書は設計の §4 lock の範囲と置き場、手順書 §2 世代ファイルによる取得と解放、§6 待ち方と順番、手順書 §3 記録の読み取りと古い claim の判定、§8 入れ子の実行と CI、§9 終了コードと出力、§10 Vitest の一時 dir の衝突、§11 の DbC を検証する oracle を、候補 ID `CANDIDATE-U-SNAPLOCK-001`〜`032` で宣言する (022 と 030 は r2 で退役。§6)。共有の `docs/test-design/harness/L7-unit-test-design.md` には、この PR では索引の行を足さない (設計 §14 の 3 で足す)。

進め方は設計保護 gate の三段階に従う。

1. **Red**: 候補 ID を引用した `it.fails` を `tests/snapshot-runner-lock.test.ts` に入れる (029 は `tests/snapshot-root-hygiene.test.ts`)。Red は 2 段に分ける。**Red 1** は新規 module `src/runtime/snapshot-runner-lock.ts` が対象の oracle (block A・B と、`tests/` の helper を見る block D)。この段が足してよい `src/` は、設計保護 gate (`design-protection-diff-gate.md` §10.3 手順 1') の例外の範囲、すなわち新規 module の契約形の stub (と必要な登録) だけで、既存 module には触れない。**Red 2** は入口 (block C の 026〜028、対象は既存の `scripts/run-vitest-snapshot.ts` の `runSnapshotRunnerMain`) で、設計 §14 の Green 2 の直前に、テストだけの PR として入れる。Red 2 は `src/` も `scripts/` も変えず (stub を足さない)、`runSnapshotRunnerMain` が未実装の間の失敗は、動的 import した module の属性が無いことによる (下の「Red の弱さ」と同じ扱い)。各 Red の前提 (fixture が作れる、stub が呼ばれる、一時 dir が在る) は、同じ準備処理を使う対の通常 `it` で確かめ、準備の失敗が期待どおりの失敗に紛れないようにする (#1452 と同じ流儀)。
2. **昇格 (src を含まない)**: 接頭辞 `CANDIDATE-` を外した正式 ID `U-SNAPLOCK-*` へ、段ごとに (Red 1 の候補は Red 1 の後、026〜028 は Red 2 の後に) 改め、テスト名の引用を同時に書き換える。正式 ID を引用より先に作らない (`oracle-test-trace`)。
3. **実装 PR**: `it.fails` を `it` に戻して Green にする。実装 PR は `docs/test-design/` を変えない。

**Red の弱さの明示**: 対象の module (`src/runtime/snapshot-runner-lock.ts`) が無い間、動的 import の失敗で `it.fails` が通る (stub がある間は、stub が oracle の期待を満たさない fail-close の値を返すことで通る。stub は成功側の値を返さない)。Red 2 では、`runSnapshotRunnerMain` が無い属性参照の失敗で通る。Red に対の通常 `it` が要るのは、これらの失敗が準備の失敗と区別できないためで、通常 `it` が確かめるのは準備 (fixture・stub の deps・一時 dir) であって、まだ無い関数の存在ではない。これは個々の規則が Red である証拠ではない。Green の PR は、§4 の表の変異を 1 つずつ入れて、対応する oracle がちょうど 1 つ落ちることを確かめてから `it` に戻す。

## 2. テストレベルと fixture

- **block A (純関数)**: `resolveSnapshotLockMode` / `parseSnapshotLockWaitMs` / `presenceFromKill` / `interpretSnapshotLockRead` / `classifySnapshotLockClaim` / `decideSnapshotLockStep` / `identityProbeDue` / `snapshotStageEnv` / `snapshotLockDir` を直接呼ぶ。ファイル・環境変数・時刻・実 process を使わない。入力は設計 §11 の型を手で組み、最小の完備な入力を基準に 1 点だけ変える。
- **block B (取得と解放の手順)**: `acquireSnapshotLock` と解放を、ファイル操作を記録する偽の io (操作名と path を順に記録し、ファイルの中身を map で持つ) と、`presence` / `observeIdentity` / `now` / `sleep` / `write` の stub で呼ぶ。**`resolveMode` / `interpretRead` / `classify` / `decide` は stub にする** (純関数の変異が block B に漏れないようにするため)。`interpretRead` の stub は「text は JSON.parse して ok (失敗は unavailable `malformed`)、error は code が `ENOENT` なら absent、それ以外は unavailable (reason は code)」に固定する。`decide` の stub は「現在の世代が無いか `free` か `stale` なら次の世代の `attempt`、`live` なら待った時間が上限に届くまで `wait`、届いたら `give_up`」に固定する。env は `{}` (CI も token も無い) を基準にし、lock dir の期待値は `snapshotLockDir(tmpRoot)` から計算する。016 だけは link の排他を実物で確かめるため、`mkdtemp` で作った一時 dir の実 fs を使い、`link` だけを step hook 付きの包み (下記) にする。偽の io の `readdir` は `queue/` の一覧にだけ答える (世代の判定に readdir を使わない、設計 I12)。hint は、明記したケース以外では無い (`ENOENT`)。`repoRoot` は 025 以外で `tmpRoot` と同じ値にする (lock dir を checkout から決める変異 M51 が 025 にだけ効くようにするため)。世代ファイルの作成の失敗を注入するときは、その path への作成の操作 (link のほか、writeFile / rename で作る実装でも同じ) に掛ける (作成の操作を差し替える変異 M33 が 016 にだけ効くようにするため)。
- **step hook** (016 / 031 で使う): io は、操作 (名前・path・何回目か) ごとに 1 回だけ走る callback を登録できる。callback は操作の**前**に走り、fs の中身 (016 は実 fs、それ以外は偽の fs の map) を書き換えてよい。これにより「取得者が判定の後・link の前で任意の時間止まり、その間に他者が何世代も進む」状況を、実時間や thread を使わずに決定的に作る。callback は例外を投げて、その操作の失敗 (code つき) を注入することもできる。
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
| `CANDIDATE-U-SNAPLOCK-004` | `presenceFromKill` と `classifySnapshotLockClaim` | code が null / `"EPERM"` / `"ESRCH"` / `"EINVAL"`。有効な記録を presence `"unknown"`・観測 `"not_observed"` で分類 | true / true / false / `"unknown"`。分類は `live` (手順書 §3.2) |
| `CANDIDATE-U-SNAPLOCK-005` | `classifySnapshotLockClaim` | 有効な記録、presence false、観測が (a) `"not_observed"` (b) 記録と同じ identity | 両方 `stale` (手順書 §3.2 K1) |
| `CANDIDATE-U-SNAPLOCK-006` | `classifySnapshotLockClaim` | 有効な記録 (startToken `T1`)、presence true、観測が (a) 同じ pid で `T2` (b) `"query_failed"` (c) null (d) 同じ pid で `T1` (e) 同じ pid で startToken null (f) `"not_observed"` | (a)(c) `stale`、(b)(d)(e)(f) `live` (手順書 §3.2 K2〜K4) |
| `CANDIDATE-U-SNAPLOCK-007` | `interpretSnapshotLockRead` | (a) error `ENOENT` (b) error `EACCES` (c) error `EIO` (d) error code null (e) text `"{"` (f) 有効な記録で startToken が null (g) startToken が `""` (h) pid が 0 (i) lockId が無い (j) schema が 2 (k) 有効な記録の text | (a) `absent`。(b)(c) unavailable で reason が `EACCES` / `EIO`、(d) reason `UNKNOWN`。(e)〜(j) unavailable で reason `malformed`。(k) ok で record が入力と deep equal (手順書 §3.1 R1〜R4) |
| `CANDIDATE-U-SNAPLOCK-008` | `decideSnapshotLockStep` | waited 0、max 600000。(a) current null、live の待っている者 A (queuedAt t1)、self は t2 (> t1) (b) current stale で (a) と同じ (c) current free、A と self の queuedAt が同じで lockId は A=`a`・self=`b` (d) (c) で A=`b`・self=`a` (e) current free、A は (t2, `a`)、self は (t1, `z`) | (a)(b)(c) `wait`、(d)(e) `attempt`。世代番号は検査しない (§6 の順番) |
| `CANDIDATE-U-SNAPLOCK-009` | `decideSnapshotLockStep` | waited 0、max 600000。(a) current null、待っている者は stale の S (queuedAt t0) だけ、self は t1 (b) current null で待っている者なし (c) current free 世代 7 (d) current stale 世代 7 | (a) `attempt`、(b) 世代 1 の `attempt`、(c)(d) 世代 8 の `attempt` (§6、手順書 §2.2) |
| `CANDIDATE-U-SNAPLOCK-010` | `decideSnapshotLockStep` | 待っている者なし。current live 世代 2 で (a) waited 59999・max 60000 (b) waited 60000・max 60000 (c) waited 0・max 0。current free で (d) waited 70000・max 60000 | (a) `wait`、(b)(c) `give_up`、(d) `attempt` (§6 の上限) |
| `CANDIDATE-U-SNAPLOCK-011` | `identityProbeDue` | (前回, 今) が (null, 0) / (1000, 300999) / (1000, 301000) / (1000, 1000) | 順に true / false / true / false (§6) |
| `CANDIDATE-U-SNAPLOCK-012` | `snapshotStageEnv` | base env が `{ PATH: "p" }` と `{ PATH: "p", UT_TDD_SNAPSHOT_LOCK_TOKEN: "old" }` の 2 つ。acquisition が (a) acquired (lockId `L5`) (b) nested (c) skipped_ci | (a) 両方の base で token が `L5`、他の key は base と同じ。(b)(c) 返り値が base と deep equal (§8 の token の受け渡し) |
| `CANDIDATE-U-SNAPLOCK-013` | `snapshotLockDir` | tmpRoot が `/t` と `C:\t` | `join(tmpRoot, "ut-tdd-snapshot-runner-lock")`。名前は `ut-tdd-vitest-` で始まらず、寿命の契約の名前の規則 `ut-tdd-vitest-(head-\|cache-)?\d+-\d+` に一致しない (§4、I8) |

### 3.2 block B (取得と解放の手順)

| ID | 対象 | 入力 | 期待 (設計の節) |
|---|---|---|---|
| `CANDIDATE-U-SNAPLOCK-014` | nested / skip_ci の経路 | 世代 1 (lockId `L1`) が在る lock dir。`resolveMode` の stub が (a) `nested` (b) 常に `skip_ci` | (a) `{ kind: "nested", generation: 1 }` と `snapshot-lock: nested` の行、(b) `{ kind: "skipped_ci" }` と `snapshot-lock: skipped reason=ci` の行。両方とも書き込み系の操作 (mkdir / writeFile / rename / link / unlink) が 0 回、`observeIdentity` の呼び出しが 0 回。(b) は lock dir への操作 (readFile / readdir を含む) が 0 回 (§8、I5) |
| `CANDIDATE-U-SNAPLOCK-015` | 経過時間を使わない | 世代 1 の記録の `acquiredAt` と `queuedAt` が now の 10 時間前。`classify` の stub は常に `live`。maxWait 4000 | busy で holder は世代 1。`gen-2.json` は作られず、`gen-1.json` は残る (手順書 §3.2、I1) |
| `CANDIDATE-U-SNAPLOCK-016` | 消えない番号への link の排他 (実 fs、r2 の FLAG の interleaving) | 一時 dir の lock dir に `gen-1.json` と `released-1` (世代 1 は free)。自分 A は walk で世代 1 を読み、世代 2 を `attempt` する。maxWait 0。(a) step hook で、A の `gen-2.json` への link の直前に、他者 H の記録の `gen-2.json` を置く (`classify` の stub は H を `live`) (b) 同じ位置の hook で、他者が世代 2〜100 を順に取得した状態を置く: `gen-2`〜`gen-100` と `released-2`〜`released-99`、`gen-100` は H (`live`) | (a)(b) とも、A の link は `gen-2.json` への 1 回だけで `EEXIST` になり、`gen-2.json` の中身は他者の記録のまま。結果は busy で、holder は (a) 世代 2、(b) 世代 100。`snapshot-lock: acquired` の行が無い (手順書 §2.2 手順 4、§2.3 の補題 2、I3) |
| `CANDIDATE-U-SNAPLOCK-017` | 解放 | (a) 世代 5 の handle で、現在も世代 5 (b) 世代 5 の handle で、世代 6 が在る (c) (a) で `released-5` の作成が `EIO` を投げる | (a)(b) 新しく作られるのは `released-5` だけ。`gen-5.json` と `gen-6.json` は消えず rename もされない。(b) で `released-6` は作られない。(c) `release()` は例外を投げず、`snapshot-lock: release-failed` の行に `reason=EIO` があり、`gen-5.json` は残る (手順書 §2.4、I2、I7) |
| `CANDIDATE-U-SNAPLOCK-018` | link と解放の印の確かめの失敗 | maxWait 0。(a) lock dir が空で、`gen-1.json` の作成 (link) が `EPERM` を投げる (b) `gen-1.json` (`classify` の stub は `stale`) が在り、`released-1` の readFile が `EACCES` を投げる | 各々 `{ kind: "unavailable" }` で reason が `EPERM` / `EACCES`。世代ファイルを作らず、busy も返さない。(b) は link が 0 回 (手順書 §2.2 手順 4、§3.1、§3.3、I3) |
| `CANDIDATE-U-SNAPLOCK-019` | 自分の queue entry の公開と後始末 | maxWait 4000 で (a) current が live (stub) のまま上限に届く (b) current が無く取得する (c) current が無く、手順 4 の `gen-1.json` の作成 (link) が `EPERM` を投げる | 3 つとも、偽の io の操作の記録に、自分の `queue/<自分の lockId>.json` を作る操作 (rename の移動先、または writeFile の path) が 1 回以上あり、かつ終了時にその path が無い。**観測するのは自分の queue entry の公開の有無と終了時の有無だけで、結果の種類 (busy / acquired / unavailable) は検査しない** (結果の種類は (a) が 015、(b) が 020、(c) が 018 の観測である)。上限が正なので 3 つとも手順 2 で公開する (手順書 §2.2 手順 2・5、§6)。「公開が 1 回以上」を足したのは、queue を作らない stub でも「終了時に無い」が成り立ち、全件 `it.fails` の Red にならないためである (r1b の FLAG) |
| `CANDIDATE-U-SNAPLOCK-020` | stale の世代の置き換えと、消さないこと | `gen-1`〜`gen-3` と `released-1`・`released-2` が在り、世代 3 は `classify` の stub で `stale`、待っている者なし | acquired で世代 4。取得の全体 (walk から hint の書き込みまで) で、**操作の時点で偽の fs に既に在る** `gen-*` と `released-*` への書き込み系の操作が 0 回で、`gen-1`〜`gen-3` と `released-1`・`released-2` は残り、中身も開始時のままである。数える操作は unlink、rename の移動元、rename の移動先 (置き換え)、writeFile の path の 4 つで、rename は**移動元と移動先の両方**を見る。操作の前に無い path (新しい世代 `gen-4.json` を含む) への作成は数えない。新しい世代の path を link 以外で作ること、競合者の記録を上書きすることは 016 の観測である (手順書 §2.2、§2.4、I2、境界は §4.2) |
| `CANDIDATE-U-SNAPLOCK-021` | 待っている者の記録 | current は live (stub)。queue に S (`classify` の stub は `stale`) と L (`live`)。maxWait 4000 | 終了時に S の記録は消え、L の記録は残る (§6) |
| `CANDIDATE-U-SNAPLOCK-023` | 自分の identity | `observeIdentity(自分の pid)` が (a) `"query_failed"` (b) null (c) startToken null の identity | 各々 `{ kind: "unavailable" }` で、書き込み系の操作が 0 回 (手順書 §2.2 手順 1、I4) |
| `CANDIDATE-U-SNAPLOCK-024` | 待っている間の行 | 時計を注入する。current は世代 1 が live で、130,000 ms 後に `released-1` が現れる。maxWait 600000 | `waiting` 1 行、`still-waiting` 2 行 (60,000 ms と 120,000 ms)、`acquired` 1 行の計 4 行だけ (§9、I10) |
| `CANDIDATE-U-SNAPLOCK-025` | 範囲 | 同じ tmpRoot で repoRoot が違う 2 回の取得。1 回目は取得して解放しない。テストは 1 回目の後に hint を消す (hint の変異が 025 に効かないようにするため)。2 回目は maxWait 0 で、`classify` の stub は 1 回目の記録を `live` とする | 2 回目は busy で、holder の lockId が 1 回目のもの (§4、I8) |
| `CANDIDATE-U-SNAPLOCK-031` | 記録の読み取りの境界 (r1 の FLAG 2) | `gen-1.json` (他者の記録) が在り `released-1` は無い。link はどの番号にも成功する (偽の io)。maxWait 0 で (a) `gen-1.json` の readFile が `EACCES` を投げる (b) 同じく `EIO` (c) `gen-1.json` の中身が `"{"`。(d) maxWait 4000、`classify` の stub は `live`。step hook で、2 回目の walk の `gen-1.json` の readFile の直前に `gen-1.json` を偽の fs から消す (e) `gen-1.json` は無く、maxWait 4000 で待っている者 W の `queue/W.json` の readFile が `EACCES` を投げる | (a)(b)(c) unavailable で reason が `EACCES` / `EIO` / `malformed`、`gen-2.json` への link が 0 回、`classify` の stub の呼び出しが 0 回。(d) unavailable で reason `generation_missing`、link が 0 回。(e) unavailable で reason `EACCES`、`gen-1.json` への link が 0 回 (手順書 §3.1、§3.3、I11) |
| `CANDIDATE-U-SNAPLOCK-032` | hint は助言に過ぎない | `gen-1`〜`gen-5` と `released-1`〜`released-4` が在り、世代 5 は `classify` の stub で `live`、maxWait 0。hint が (a) `3` (低い) (b) `abc` (c) `50` (大きすぎる) (d) readFile が `EACCES` を投げる (e) 無い。(f) `released-5` も在り、hint は `50` | (a)〜(e) busy で holder は世代 5、link が 0 回、unavailable を返さない。(f) acquired で世代 6、link は `gen-6.json` への 1 回だけ、終了時の hint の中身が `6` (手順書 §2.1、§2.4、I12) |

退役した候補: `CANDIDATE-U-SNAPLOCK-022` (古い世代の整理) と `CANDIDATE-U-SNAPLOCK-030` (link の後の一覧による検証) は、r2 で整理と検証の一覧を設計から撤去したので退役させた。番号は再利用しない。

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

正しい実装を基準に、規則を 1 か所だけ壊した変異を先に列挙した。表の ● はその変異で落ちる oracle、・ は落ちない oracle である。各行の ● はちょうど 1 つで、各列の ● は 1 つ以上である (表の下の検出数)。表は §4.5 の手順で機械的に数えて確かめた。

**block をまたいで検出が重ならない理由**: block A の oracle は純関数だけを呼ぶので、block B〜D の変異 (取得の手順・entrypoint・helper) は結果を変えない。block B の oracle は `resolveMode` / `interpretRead` / `classify` / `decide` を stub にし、env に CI も token も持たず、lock dir の期待値を `snapshotLockDir` から計算するので、block A の変異は結果を変えない (M25 / M26 の観測の間隔も、block B は 014 と 023 以外で観測の回数を検査せず、014 は観測しない経路、023 は自分の identity を間隔に依らず 1 回観測する経路である)。block C の oracle は `acquire` / `release` / `run` / `parseWaitMs` / `stageEnv` を stub にするので、block A と B の変異は結果を変えない。block D は helper だけを呼ぶ。

### 4.1 block A (純関数)

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
| M15 | `ENOENT` 以外の読み取りの失敗を absent にする | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ |
| M16 | `ENOENT` を unavailable にする | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ |
| M17 | 必須の値の検査を外す (壊れた記録を ok にする) | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ |
| M18 | 先頭でなくても attempt する | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ |
| M19 | lockId だけで順番を決める | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ |
| M20 | stale の待っている者を先頭に数える | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ |
| M21 | attempt の世代番号を現在の番号のままにする | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ |
| M22 | 上限を過ぎても give_up しない | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ |
| M23 | 上限の 1 ms 前に give_up する | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ |
| M24 | 取得できる状態でも上限を過ぎたら give_up する | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ |
| M25 | identity を初回しか観測しない | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ |
| M26 | identity を毎回観測する | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ |
| M27 | 取得したとき token を stage の環境に足さない | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ |
| M28 | skip_ci で token を足す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ |
| M29 | lock dir の名前を `ut-tdd-vitest-` で始める | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● |
| 検出数 | | 2 | 3 | 2 | 3 | 1 | 3 | 3 | 2 | 2 | 3 | 2 | 2 | 1 |

block A の中で重ならない理由: 分類の規則は K1 (presence) → K2 / K3 (観測) → K4 の順に効く。005 は presence false なので K2 / K3 の変異 (M12〜M14) が効かず、006 は presence true なので K1 の変異 (M11) と presence の写像の変異 (M08〜M10) が効かない。004 は観測が `"not_observed"` なので M12〜M14 が効かない。読み取りの解釈 (M15〜M17) は `interpretSnapshotLockRead` だけの変異で、`classifySnapshotLockClaim` を呼ぶ 004〜006 は解釈済みの記録を直接渡すので効かず、007 は分類を呼ばない。008 は stale の待っている者を持たず、`action` だけを検査し、待った時間は上限よりずっと小さい。009 は live の待っている者が self だけなので先頭の判定と順番の変異 (M18 / M19) が効かず、010 は待っている者を持たず `action` だけを検査する。001 は token を持たず、002 は CI を持たない。

### 4.2 block B (取得と解放の手順)

| 変異 | 内容 | 014 | 015 | 016 | 017 | 018 | 019 | 020 | 021 | 023 | 024 | 025 | 031 | 032 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M30 | nested / skip_ci で lock dir に書くか identity の port を呼ぶ (skip_ci で lock dir を読むことを含む) | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M31 | nested / skip_ci の行を出さない | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M32 | acquiredAt の経過 (#1460 と同じ 45 分) で live の世代を置き換える | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M33 | 新しい世代の path を link でなく rename / writeFile で作り、既に在る他者の記録を上書きする | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M34 | link の `EEXIST` の後、その番号を読まずに先の番号への link を試す | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M35 | 解放で世代ファイルを消すか rename する | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M36 | 解放で自分でなく現在の世代の印を作る | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M37 | 解放の印の作成の失敗で例外を投げるか行を出さない | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M38 | link の失敗で lock なしに進む | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M39 | `EEXIST` 以外の link の失敗を busy にする | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M40 | `released-<M>` の確かめの `ENOENT` 以外の失敗を「無い」か「在る」とみなして進む | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M41 | give_up のとき自分の queue entry を残す | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M42 | 取得のとき自分の queue entry を残す | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M43 | unavailable のとき自分の queue entry を残す | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| M44 | stale の世代を置き換えない | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ |
| M45 | 取得の中で `gen-*` か `released-*` を消すか rename する (変種: (a) 取得の後に古い世代を消す整理を足す、(b) link の前に現在の世代ファイルを消す、(c) stale の世代の置き換えで、取得の開始時点で在る `gen-*` か `released-*` を rename の移動先として (または writeFile で) 上書きする。§4.5 の模型は 3 つの変種を確かめる) | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ |
| M46 | stale の待っている者の記録を残す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ |
| M47 | live の待っている者の記録を消す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ |
| M48 | 自分の startToken が得られなくても書く | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ |
| M49 | 待っている間に何も出さない | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ |
| M50 | 繰り返しごとに still-waiting を出す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ |
| M51 | lock dir を checkout から決める (`snapshotLockDir(repoRoot)`) | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ |
| M52 | 現在の世代の読み取りが unavailable のとき、その世代を stale として次の世代を試す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ |
| M53 | 既知の番号の `ENOENT` を walk の終わりとみなす | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ |
| M54 | 待っている者の読み取りが unavailable のとき、その者を数えずに進む | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● | ・ |
| M55 | `gen-<h>.json` の有無を確かめずに、hint の次の番号への link を試す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● |
| M56 | `gen-<h>.json` が無いとき `gen-1.json` から walk せず、世代なしとして `gen-1.json` への link を試す | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● |
| M57 | hint の読み取りが `ENOENT` 以外で失敗したとき unavailable で終える | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● |
| M58 | 数として解釈できない hint で unavailable で終える | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● |
| M59 | 取得の後に hint を書かない | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ・ | ● |
| M70 | 待つ場合 (上限が正) でも自分の queue entry を公開しない | ・ | ・ | ・ | ・ | ・ | ● | ・ | ・ | ・ | ・ | ・ | ・ | ・ |
| 検出数 | | 2 | 1 | 2 | 3 | 3 | 4 | 2 | 2 | 1 | 2 | 1 | 3 | 5 |

block B の中で重ならない理由: 各 oracle は自分の対象の観測だけを検査する。

- 015 と 021 は current が live なので link を試さず (M33 / M34 / M38 / M39 / M44 が効かない)、自分の queue entry を検査しない (M41〜M43 が効かない)。
- 016 は link が `EEXIST` になる唯一の oracle で、M34 はここでだけ効く (他の oracle では link が成功するか試されない)。016 は取得に届かず、`gen-*` の削除を検査しないので、M45 (取得の中の削除) は結果を変えない (link の前に `gen-1.json` を消しても、`gen-2.json` への link は `EEXIST` のままである)。
- 018 は (a) lock dir が空で読む記録が無く、(b) 記録が読めるので、読み取りの変異 (M52〜M54) が効かない。maxWait 0 なので queue entry を書かない (M43 が効かない)。M38 と M39 は (a)、M40 は (b) で落ちる。
- 019 は queue entry の公開の有無と終了時の有無だけを検査し、結果の種類を検査しないので、(c) の link の失敗を busy や lock なしに変える M38 / M39 でも entry は消える (落ちない)。M70 (公開しない) は、上限が正の 019 だけが見る (015・020・021・031 は自分の queue entry の公開を検査しない)。
- 020 は current が stale で `EEXIST` を起こさない (M34 が効かない)。hint を検査しない (M59 が効かない)。
- **020 と 016 の境界 (M33 と M45 の (c))**: 020 は、操作の時点で既に在る `gen-*` / `released-*` に作用する書き込み系の操作を、rename の移動元と移動先の両方で数える。操作の前に無い path への作成は数えないので、M33 (新しい世代 `gen-4.json` を rename で作る) は 020 では数えられず (移動先が無い)、020 の fixture には競合者が居ないので上書きも起きない。逆に M45 の (c) (既存の `gen-3.json` を rename の移動先にする) は、020 の fixture では既存の履歴への作用として数えられる。016 は書き込み系の操作の回数を検査せず、link の `EEXIST` と、他者が置いた記録の中身が残ることだけを検査するので、stale の置き換えを通らない 016 では M45 の (c) は結果を変えない。移動先が既存の履歴を置き換える場合は 020 が検出し、新しい世代の path を link 以外の操作で作る場合は、競合者の記録の有無に依らず 016 だけが検出する。
- 017 は解放だけを呼ぶので取得の変異が効かず、020 は取得だけを呼ぶので解放の変異 (M35〜M37) が効かない。
- 023 は I/O の失敗を起こさない (M38 / M40 が効かない)。
- 031 は link を試す前に読み取りで決まるので、link・置き換え・hint の変異が効かない。(d) は 2 回目の walk で既知の `gen-1.json` が消えているので、M53 では世代なしとして `gen-1.json` への link が成功して落ちる。
- 032 だけが hint を置くので、hint の変異 (M55〜M59) は 032 でだけ効く。他の oracle は hint が無く (`ENOENT`)、M57 / M58 の条件 (`ENOENT` 以外の失敗、解釈できない値) に当たらない。032 は記録を全て読めて (M52〜M54 が効かない)、`EEXIST` を起こさず (M34)、削除を検査しない (M45)。
- M33 (作成の操作の差し替え) は、作成の失敗の注入を作成の操作に掛けるので (§2)、018 (a) と 019 (c) では失敗が同じように起きて結果を変えない。`EEXIST` で既存を守ることを観測するのは 016 だけである。
- M51 (lock dir を checkout から決める) は、025 以外は `repoRoot` が `tmpRoot` と同じなので結果を変えない。
- M55 (hint の次の番号への直接の link) は、025 では 1 回目の後に hint を消すので効かない。
- 015 以外の oracle は、記録の `acquiredAt` を開始時の now にし、偽の時計で 130,000 ms 以内に終わるので M32 が効かない。014 は取得の手順に入らない。

### 4.3 block C (入口の関数)

| 変異 | 内容 | 026 | 027 | 028 |
|---|---|---|---|---|
| M60 | 引数・root・待ち時間の判定より前に取得する | ● | ・ | ・ |
| M61 | 取得より前に run を呼ぶ | ・ | ● | ・ |
| M62 | run の完了より前に解放する | ・ | ● | ・ |
| M63 | run が失敗したとき解放しない | ・ | ● | ・ |
| M64 | stageEnv の結果を run に渡さない | ・ | ● | ・ |
| M65 | busy / unavailable の後に run か release を呼ぶ | ・ | ・ | ● |
| M66 | busy を 2、unavailable を 3 以外の終了コードにする | ・ | ・ | ● |
| M67 | busy の行に `holder_pid=` か `lock=`、unavailable の行に `reason=` か `lock=` が無い | ・ | ・ | ● |
| 検出数 | | 1 | 4 | 3 |

block C の中で重ならない理由: 026 は取得に届かないので、取得の後の変異 (M61〜M67) が効かない。027 は acquired の経路だけなので、busy / unavailable の変異 (M65〜M67) が効かない。027 は取得より前の判定との順序を検査しないので、M60 も効かない。028 は「`acquire` より後の」呼び出しだけを検査するので、`acquire` の前に `run` を呼ぶ M61 は 028 では落ちない。M62〜M64 は acquired の経路の中の変異で、busy / unavailable の経路を通らない。

### 4.4 block D (テストの衛生)

| 変異 | 内容 | 029 |
|---|---|---|
| M68 | 接頭辞 `ut-tdd-vitest-` だけで照合する | ● |
| M69 | pid の直後の `-` を照合しない | ● |
| 検出数 | | 2 |

### 4.5 表の機械的な確認

表の ● の数だけでは、oracle の文面が検査すると書いた観測と、§4 の「重ならない理由」との食い違いを検出できない (r3 の指摘: 019 (c) が結果の種類を検査すると書きながら、§4.2 は検査しないとしていた)。そこで、契約の手順を変異の旗つきで模した使い捨ての模型 (PR の外、`.ut-tdd/handover/control-tools/wf-1685-r1/model.mjs`) で、各 oracle の文面どおりの観測を評価し、変異ごとに落ちる oracle の集合を求めて、ちょうど 1 つでありかつ本書の ● と一致すること、正しい実装ではどの oracle も落ちないこと、各 oracle が 1 つ以上の変異で落ちることを確かめた。block B は §2 の stub (resolveMode / interpretRead / classify / decide) を使う。M45 は 2 つの変種の両方を確かめた。2026-11-16 の結果は「MODEL OK」(oracle 30 件、変異 69 件と変種 1 件) だった。

2026-11-17 (r1b の契約改訂) に、019・020・016 の文面どおりの観測 (019 は公開の記録と終了時の有無、020 は既存の履歴に作用する操作の数え方、016 は `EEXIST` と他者の記録の中身) を模した使い捨ての script で確かめた結果は次のとおりである。正しい実装では 3 件とも落ちず、M33 は 016 だけ、M45 の (a) (c) は 020 だけ、M70 と M41 は 019 だけが落ち、queue を作らない stub では 019 の観測が成り立たない (Red になる)。M70 は表の置き場が 4.2 だが番号は最後なので、番号の連続・重複なしは表の順でなく番号の集合で数える。

あわせて、4.1〜4.4 の表を次の規則で数える: 行頭が `| M` の行を変異の行とし、その行の ● の数がちょうど 1 であること、表の見出しの oracle の列ごとに ● が 1 つ以上あること、変異の番号が `M01` から連続して重複しないこと、表の下の「検出数」の行が数えた値と一致すること。2026-11-16 (r2 の是正の後) に本書へ適用した結果は、変異 69 件・oracle 30 件 (退役した 022 と 030 を除く) で、違反は 0 件だった (結果の全文は PR #1685 の是正コメント)。

## 5. 受け入れの実測 (oracle ではない)

設計 §13 の実測 1〜6 は、2 本以上の実 runner と実 process を使う 1 回の確認であり、自動テストの oracle にしない (表の「ちょうど 1 つ」の性質を、多くの規則をまとめて通る試験で崩さないため)。Green 2 の PR で手順と結果 (使った worktree、出た `snapshot-lock:` の行、終了コード) を PR 本文に残す。

- 実測 1 と 2 は、別々の worktree から同時に起動する。
- 実測 3 は holder を `taskkill /F` (Windows) / `kill -9` (Linux) で止め、待っている者が次の世代を作るまでの時間を記録する。
- 実測 4 は、runner の下で U-TESTHYGIENE-043 を含む 1 ファイルを流す。
- 実測 6 は、Claude lane・Codex lane・review worktree の各 runner の `lock=` を比べる。値が違えば設計 §4 の範囲の決め方へ戻る。
- 停止の位置による排他の安全性 (手順書 §2.3) は実時間の競合で確かめない。決定的に再現できる 016 (step hook) が oracle である。
- 実測 7 (世代 10,000 個での walk の時間) は、性能の記録であり oracle にしない。

## 6. 注記

- 本書の候補は、昇格前に正式な oracle として扱わない。
- U-TESTHYGIENE-050 / 051 の oracle の意味は変えない。観測の範囲を狭める方式は、029 の helper ではなく、`tests/support/private-tmpdir.ts` の `usePrivateTmpdir()` に定める (#1755)。これは `os.tmpdir()` の解決元である `TMPDIR` / `TEMP` / `TMP` を、test ごとの空の一時ルートへ切り替える。旧記述の「029 の helper を使う」は、この方式で置き換える。
- 方式の理由: 別のテストファイルは別 worker で並行に走り、同じ OS の一時ディレクトリへ `ut-tdd-vitest-*` を作る。`<pid>-<ms>` で決まる runner の snapshot dir も衝突する。専用ルートへ切り替えれば、観測も衝突も自分のテストの中だけで決まる。
- 050 の観測の境界: `usePrivateTmpdir()` が返す専用ルートだけを見る。`runSnapshotTests` が uid=0 で例外を投げた後、そのルートの `readdirSync` が空であることを確かめる (snapshot の副作用が 0)。共有の `os.tmpdir()` 全体は見ない。期待値 (副作用なし) は変えない。051 も同じ専用ルートの下で動かす (存在しない repo root はその下に置く)。
- candidate の cleanup と `onTestFinished` の順序: `verifySnapshotCandidate` (`tests/support/snapshot-candidate.ts`) は action の前に `usePrivateTmpdir()` を呼ぶ。candidate の `cleanup()` は `verifySnapshotCandidate` の内側で、action の後に呼ぶ。環境変数の復元と専用ルートの削除は `onTestFinished` で行い、test 本体 (`verifySnapshotCandidate` を含む) が終わった後に走る。そのため、cleanup は専用ルートがまだ在る間に走り、復元と削除はその後になる。失敗時にも `onTestFinished` は走る。
- 既存の runner の oracle (`tests/vitest-snapshot-runner.test.ts`、`tests/snapshot-runner-argv-candidates.test.ts`、`tests/global-setup-fence.test.ts`、`tests/windows-ci-single-snapshot.test.ts`) の期待値は変えない。CI では `skip_ci`、runner の下では `nested` になり、どちらも子 process を起動しないので、clone より前の spawn の列 (U-SNAPARG の互換の検査) は変わらない。変える必要が出たら設計の改訂へ戻る。
- 変異の ID (`M01`〜`M70`) は本書の中だけの番号であり、oracle の ID ではない。
- r1b (#1712 の FLAG への契約改訂、2026-11-17): 019 の観測を「queue entry の公開の有無と終了時の有無」へ広げ (M70 を追加)、020 と 016 の境界 (rename の移動元と移動先の数え方、M33 と M45 の (c)) を定め、Red を Red 1 と Red 2 に分けた (§1、設計 §14)。019 の旧観測は、全件 `it.fails` の Red にならない (stub でも成り立つ) ため置き換えた。
- 候補 ID の 030 / 031 は r1 の review の後に、032 は r2 の review の後に足した。番号は block の順でなく追加の順で、029 (block D) の後に続く。
- r2 で退役した候補: 022 (整理) と 030 (検証の一覧)。設計から性質ごと無くなったので、表の列からも外した。番号は再利用しない。016 は「既存の世代ファイルを上書きしない」という性質を保ったまま、r2 の FLAG の interleaving (止まっていた取得者の link が、消えない後の番号で `EEXIST` になる) を加えた。020 は、取得の全体で何も消さないことを検査するように広げた。
