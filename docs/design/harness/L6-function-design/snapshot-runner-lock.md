---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_snapshot_runner_lock
pair_artifact: docs/test-design/harness/L7-snapshot-runner-lock-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-13
issue: 1665
---

> **L6 contract marker**: 本書は snapshot runner (`scripts/run-vitest-snapshot.ts`) の**同時実行の排他**の契約である (未実装の目標契約)。判定は `src/runtime/snapshot-runner-lock.ts` の純関数 (`resolveSnapshotLockMode` / `parseSnapshotLockWaitMs` / `presenceFromKill` / `classifySnapshotLockClaim` / `decideSnapshotLockStep` / `identityProbeDue` / `snapshotStageEnv` / `snapshotLockDir`) が持ち、ファイルの操作と process の観測は port 越しに注入する。型と DbC は §11 にまとめる。oracle は `docs/test-design/harness/L7-snapshot-runner-lock-test-design.md` の候補 ID `CANDIDATE-U-SNAPLOCK-001`〜`029` が固定する。行番号と実測は 2026-11-13 の `main` (`09ce4e761`)、Windows 11、node v24.22.3 で取った。

# snapshot runner の同時実行の排他 — 関数設計 (issue #1665)

## 1. 目的と範囲

ローカルの対象 snapshot は 1 台の PC で 1 本ずつ流す運用だが、順番待ちは各 lane の worker が「空いているか」を自分で判定する口頭の規則で、2026-11-13 の 1 日で 3 通りに崩れた (#1665 本文の表)。午後は非著者 reviewer の実行 4 本が並び、author 側の worker が 40 分待っても空きが来なかった (#1665 の control コメント)。目的は、**runner 自身が PC 単位の排他を持ち、判定と起動のあいだの競合を無くす**ことである。

範囲は次のとおり。

- runner の entrypoint (`import.meta.main` の経路) での lock の取得・待ち・解放・古い lock の回収。
- 入れ子の実行 (runner の Vitest の中から runner を起動するテスト) と CI での扱い。
- Vitest の一時 dir (`<tmp>/ut-tdd-vitest-*`) の衝突の扱い (§10)。

範囲外: runner の固定費の削減 (#98)、終わったのに残っている process の片付け (#1459、および寿命の契約 `snapshot-runner-lifecycle.md`)、doctor の lock の回収の修正 (#1460)。

## 2. 現状の実測

| # | 実測 | 測定 |
|---|---|---|
| 1 | runner に排他は無い。stage (clone / `npm ci` / `db rebuild` / Vitest) は `spawnSync` で逐次に走り、実行中は event loop が塞がる (holder が定期的に生存を書き込む方式は今は取れない) | `scripts/run-vitest-snapshot.ts` の `run()` と `runSnapshotTests()` |
| 2 | 一時 root は `os.tmpdir()` 直下の `ut-tdd-vitest-<pid>-<ms>`、`ut-tdd-vitest-head-<pid>-<ms>`、`ut-tdd-vitest-cache-<pid>-<ms>` である。同時に生きている process の pid は重ならないので、runner どうしで名前は衝突しない | 同 `runSnapshotTests()` |
| 3 | doctor の singleton (`src/doctor/singleton-lock.ts`) は `<repo>/.ut-tdd/state/doctor-lock/claims` に claim を置く checkout 単位の lock で、2 本目は exit 2 と holder の pid で拒否する。45 分を超えた lock は pid が生きていても回収する (#1460、未修正) | 同ファイルの `doctorLockClaimsPath` / `isStaleDoctorLock` |
| 4 | Windows で `fs.linkSync(tmp, target)` は target が在れば `EEXIST` で失敗し、在る内容を変えない。`fs.renameSync(a, target)` は在る target を**黙って置き換える** | 使い捨ての node スクリプト (`.ut-tdd/handover/control-tools/` の一時 dir、実行後に削除) |
| 5 | `process.kill(<存在しない pid>, 0)` は `ESRCH` を投げる。自分の pid への呼び出しは 200 ms で約 1,500 回できる (待ちの間の生存確認に使える軽さ) | 同上 |
| 6 | `os.tmpdir()` は Git Bash から起動した node で `C:\Users\<user>\AppData\Local\Temp` を返した。Codex lane と review worktree で同じ値になるかは未実測 (§15) | 同上 |
| 7 | テストが runner の entrypoint を子 process として起動する経路がある。`tests/global-setup-fence.test.ts` (U-TESTHYGIENE-043) は実 runner を起動し、`tests/snapshot-runner-argv-candidates.test.ts` は spawn を preload で横取りして、clone より前に起きる spawn の列を固定している | 各テストファイル |
| 8 | 2026-11-13 の CI (run 43378612411、docs だけの PR) で、U-SNAPLC-022 の reference の clone が exit 128、U-TESTHYGIENE-050 の副作用の数が 0 のはずが 1 になった。どちらも共有の `os.tmpdir()` を使う | #1665 のコメント 6846162539 |

## 3. 設計判断 (方式の候補と推奨)

排他の置き場と仕組みについて、次の 3 案を比べた。

| 案 | 内容 | 長所 | 短所 |
|---|---|---|---|
| A | user の tmp dir に置いた lock dir で、**世代番号つきの holder ファイルを hard link で排他的に作る** (§5)。古い holder は消さずに次の世代で上書きする | Node の標準 API だけで OS をまたいで書ける。holder の情報 (pid・checkout) をそのまま表示できる。共有の名前を誰も消さないので、回収の競合で 2 本が同時に持つ経路が無い | pid の再利用を見分けるために process の開始時刻 (startToken) の観測が要る (Windows で 1 回数秒)。lock の範囲が `os.tmpdir()` の一致に依存する |
| B | OS が process の死と同時に解放する予約 (Windows の named pipe、Linux の abstract socket) を排他に使う | 古い lock の判定が要らない | Node に予約の持ち主の pid を問い合わせる API が無く、表示用の記録を別に持つので正本が 2 つになる。macOS には abstract socket が無く、ファイルの socket では古い lock の問題が戻る。sandbox の namespace で予約が分かれるかは未実測 |
| C | doctor の singleton をそのまま流用し、checkout ごとに lock を掛ける | 実装済みの仕組みを使える | 別の worktree・別の lane・review worktree の実行を排他できず、#1665 の要件を満たさない。45 分の TTL で生きた holder を回収する誤り (#1460) も引き継ぐ |

**推奨は A**。理由: B の利点 (回収が要らない) は、A でも「holder の削除をしない世代方式」と「時刻を使わない identity の判定」で同じ安全性に届き、B の短所 (正本が 2 つ、OS 別の実装、未実測の namespace) を負わずに済む。C は要件を満たさない。

あわせて次を決めた (相談の経緯は §15)。

| 論点 | 決定 | 理由 |
|---|---|---|
| 範囲 | `os.tmpdir()` 単位 (この PC では全 lane が同じ user なので PC 単位) | runner は既に一時 root を `os.tmpdir()` に作っており、書き込めることが確かめられている唯一の場所である。checkout には依らない |
| 取れないとき | **既定は即時に exit 2** (holder の pid を表示)。`UT_TDD_SNAPSHOT_LOCK_WAIT_MS` に正の値を与えたときだけ、その時間を上限に順番を待つ | 既定で長く待つと lane が止まり、呼び出し元の tool の timeout に先に殺される。手での空き判定を無くすことは、判定を runner の中で原子的に行うことで達成でき、待つかどうかは呼び出し元が選べばよい |
| reviewer の実行 | 同じ lock に入る。例外も優先もない | runner は自分の役割を確かめる手段を持たない。役割で優先を付けると、名乗るだけで割り込める口ができる |
| 待つ順番 | 待つ者どうしは到着順 (FIFO)。即時の exit 2 を選んだ者も、先に待っている者を追い越さない | 40 分待っても順番が来ない事態 (control の観測) を、到着順と待ち位置の表示で防ぐ |
| 小さい実行の別枠 | 設けない (枠は 1 つ) | 対象が 1〜2 ファイルでも clone・`npm ci`・`db rebuild` の固定費は同じで、メモリと CPU を食うのはこの固定費である。#98 で固定費が下がったら見直す |
| lock の障害 | **fail-close** (exit 3、理由を表示) | 障害時に lock なしで走ると、排他の要件を黙って破る。障害は表示されるので、その lane で直せる |
| CI | 排他を掛けない (`CI` が `true` のとき) | CI は job ごとに別の機械である |

## 4. lock の範囲と置き場

- lock dir は `snapshotLockDir(tmpRoot) = join(tmpRoot, "ut-tdd-snapshot-runner-lock")` で、`tmpRoot` は `os.tmpdir()`。**checkout (repo root) を入力に持たない**ので、同じ tmp dir を使う全ての checkout・lane・review worktree が 1 つの lock を共有する。
- 名前は `ut-tdd-vitest-` で始めない。一時 root を数える既存のテスト (U-TESTHYGIENE-050 / 051) と、寿命の契約の回収規則 (`snapshot-runner-lifecycle.md` §4.2 S7 の名前の規則) の対象に入らないようにするためである。
- 中身:
  - `gen-<g>.json`: 世代 `g` (1 から増える整数) の holder の記録。§5 の手順でだけ作り、作った後は変更しない。
  - `released-<g>`: 世代 `g` が正常に終わった印。世代 `g` の holder だけが作る。
  - `queue/<lockId>.json`: 待っている者の記録 (待つ場合だけ)。
  - `tmp/<lockId>.json`: hard link の元にする作業用のファイル。link を試した直後に作成者が消す。
- 限界: user ごとに `os.tmpdir()` が違う構成 (別の OS user、WSL2 と Windows の混在、`TMP` を書き換える sandbox) では lock が分かれる。分かれたことが見えるように、lock の行には必ず `lock=<dir>` を出す (§9)。

## 5. 世代ファイルによる取得と解放

**現在の世代**は、lock dir にある `gen-<g>.json` の最大の `g` (= `m`) である。現在の世代の状態は次の 4 つ。

| 状態 | 条件 |
|---|---|
| なし | `gen-*.json` が 1 つも無い |
| 空き (`free`) | `released-<m>` が在る |
| 生存 (`live`) | `released-<m>` が無く、§7 の判定が `live` |
| 古い (`stale`) | `released-<m>` が無く、§7 の判定が `stale` |

取得の手順 (acquire モード、§8):

1. 自分の identity (`{ pid, startToken }`) を観測する。`startToken` が文字列で得られなければ、queue にも世代ファイルにも書かずに `unavailable` (exit 3) で終える。
2. 待つ場合 (上限が正) は `queue/<lockId>.json` を書く (`tmp/` に書いて rename。名前は自分だけのもの)。
3. 次を繰り返す: 現在の世代と待っている者を読み、§7 で分類し、`decideSnapshotLockStep` (§6) で次の行動を決める。
4. 行動が `attempt` なら、記録を `tmp/<lockId>.json` に全て書いて閉じ、`link(tmp/<lockId>.json, gen-<m+1>.json)` を試す。成功すれば世代 `m+1` の holder である。`EEXIST` なら別の者が先に取ったので、3 へ戻る。それ以外の失敗は `unavailable` で終える。どちらの場合も `tmp/<lockId>.json` は消す。
5. 取得に成功したら自分の queue entry を消し、§5 の整理を行う。

**古い世代は消さない**。`stale` の世代 `m` は、次の世代 `m+1` を作ることで置き換える。世代ファイルは最大の番号だけが意味を持ち、作成は link で 1 者だけが成功するので、「回収した者が消した直後に別の者が作り、さらに別の者がそれを消す」という競合 (advisor の反例、§15) の経路が無い。

解放: 世代 `g` の holder は、run (cleanup を含む) が終わった後に `released-<g>` を排他的に作る。**他の世代の印を作らず、どの世代ファイルも消さず rename もしない**。自分の世代が既に置き換えられていても、作るのは自分の `released-<g>` だけである。

整理: 世代 `g` を取得した holder は、`k ≤ g − 32` の `gen-<k>.json` と `released-<k>` を消す (失敗は無視し、run を止めない)。32 世代の余裕を置くのは、一覧を読んでから link するまでの間に 32 世代進むことは無く、消した番号を誰かが作り直す経路が無いからである。`tmp/` の残骸 (link の前に process が殺された場合) は消さない。状態には使わず、大きさも小さいからである。

## 6. 待ち方と順番

- 待ち時間の上限は `parseSnapshotLockWaitMs(env.UT_TDD_SNAPSHOT_LOCK_WAIT_MS)` で決める。未設定または空文字は `0`、10 進の数字だけの文字列はその値 (ミリ秒)、それ以外 (負号・小数・空白・英字・`Number.MAX_SAFE_INTEGER` 超え) は誤りで、lock にも一時 root にも触れずに終了コード 1 で終える。
- runner の引数には option を足さない (`snapshot-runner-argv.md` の受理集合を変えない)。
- 順番 (`decideSnapshotLockStep`): 自分と、`live` に分類した待っている者のうち、`queuedAt` が最も早い者 (同じなら `lockId` の辞書順で前の者) を先頭とする。`stale` の待っている者は数えない。**現在の世代が `live` でなく、かつ自分が先頭のときだけ** `attempt` (次の世代の番号は「現在の世代の番号 + 1」、世代が無ければ 1) とする。そうでなく、待った時間が上限以上なら `give_up`、それ以外は `wait`。取得できる状態なら、上限を過ぎていても `give_up` より `attempt` を先にする。
- 即時の exit 2 (上限 0) の者は queue entry を書かないが、自分の `queuedAt` は試した時刻なので、先に待っている者を追い越さない。
- 1 回の繰り返しの間隔は 2,000 ms。現在の世代と待っている者の生存は毎回 `process.kill(pid, 0)` で確かめ、identity (startToken) の観測は `identityProbeDue` が真のときだけ行う (初めて見た記録、または前回の観測から 300,000 ms 以上たった記録)。
- 待っている者の記録のうち `stale` と分類したものは、見た者が消す。`live` の記録は消さない。

## 7. 古い claim の判定

`classifySnapshotLockClaim(record, presence, observed) => "live" | "stale"`。**時刻を入力に持たない** (#1460 の「生きている holder を経過時間で回収する」誤りを型の段階で作らない)。

| # | 条件 | 結果 |
|---|---|---|
| K1 | 記録が読めない、または必須の値 (`lockId`、`runner.pid` の正の整数、`runner.startToken` の空でない文字列) が欠ける | `stale` |
| K2 | `presence` が `false` (`kill(pid, 0)` が `ESRCH`) | `stale` |
| K3 | 観測が `null` (port がその pid の process は無いと答えた) | `stale` |
| K4 | 観測が identity で、その `startToken` が文字列かつ記録の `startToken` と違う (pid の再利用) | `stale` |
| K5 | それ以外 (観測が一致、観測が `"query_failed"`、今回は観測していない、観測の startToken が `null`、`presence` が `"unknown"`) | `live` |

- `presenceFromKill(code)`: 例外なしは `true`、`EPERM` は `true` (在るが触れない)、`ESRCH` は `false`、それ以外は `"unknown"`。
- 観測の失敗を `stale` にしないので、観測が失敗し続ける間は holder を回収しない。その間の待ちは上限で打ち切られる。これは「生きている holder を誤って回収する」より安全な側の誤りである。
- 記録に非 null の startToken を必須にしたので (§5 手順 1)、pid が再利用されても、次に identity を観測した時点 (最長 300 秒後) で K4 により回収できる。

## 8. 入れ子の実行と CI

`resolveSnapshotLockMode({ env, current, currentPresence })`:

1. `env.CI === "true"` なら `skip_ci`。lock dir に触れない (値が `"true"` 以外なら CI として扱わない)。
2. `env.UT_TDD_SNAPSHOT_LOCK_TOKEN` が空でなく、現在の世代の記録の `lockId` と一致し、その世代に `released` の印が無く、holder の `presence` が `false` でなければ `nested`。
3. それ以外は `acquire`。

- `nested` と `skip_ci` は、lock dir へ書かず、identity の port を呼ばない (子 process を起動しない)。`nested` の判定に使うのはファイルの読み取りと `process.kill(pid, 0)` だけである。clone より前の spawn の列を固定している既存のテスト (§2 実測 7) を壊さないためである。
- token の受け渡し: 取得した runner は、stage の子 process に渡す環境へ `UT_TDD_SNAPSHOT_LOCK_TOKEN=<自分の lockId>` を足す (`snapshotStageEnv(env, acquisition)`)。`nested` と `skip_ci` は環境を変えない (受け継いだ token はそのまま子へ渡る)。entrypoint は `deps.run(args, repoRoot, stageEnv)` を呼び、既定の `run` は `runSnapshotTests(args, repoRoot, getuid, stageEnv)` (第 4 引数は省略可能で、既定は `process.env`) に渡す。`runSnapshotTests` はこの環境を全 stage の子の環境の基にする。既存の 3 引数の呼び出しは変わらない。
- **保証の範囲**: 排他は「最上位の runner どうし」の間だけで成り立つ。holder の Vitest の中から起動された入れ子の runner は holder の実行の一部であり、入れ子どうしは排他しない (今も並列に走っている)。holder が死んだ後に残った子孫 (`npm ci` / Vitest / 入れ子) は、寿命の契約 (`snapshot-runner-lifecycle.md`) が止めるまで、次の世代の実行と重なりうる。
- `CI=true` をローカルで設定すると排他を外せる。これは迂回の口として残る既知の限界で、規範文書で禁じる (§14 の後続)。

## 9. 終了コードと出力

| 終了コード | 意味 |
|---|---|
| 0 / 1 | 従来どおり (検証の成否、runner の誤り。待ち時間の値の誤りも 1) |
| 2 | **busy**: 別の最上位の runner が持っていて、上限まで待っても (既定は待たずに) 取れなかった。一時 root も clone も作らない |
| 3 | **unavailable**: lock dir の読み書き・link の失敗 (`EEXIST` と `ENOENT` 以外)、または自分の identity を得られない。一時 root も clone も作らない |
| 75 | 寿命の契約の `EXIT_PARENT_LOST` (変えない) |

出力は全て stderr で、各行の先頭を `snapshot-lock:` とし、値は `key=value` で並べる。行の文面は oracle で解析しない (`key=` の有無と値だけを見る)。

| 場面 | 行 |
|---|---|
| 取得 | `snapshot-lock: acquired generation=<g> waited_ms=<n> lock=<dir>` |
| busy | `snapshot-lock: busy holder_pid=<pid> holder_repo=<path> since=<acquiredAt> generation=<g> waited_ms=<n> lock=<dir>` と、待つには `UT_TDD_SNAPSHOT_LOCK_WAIT_MS` を使うこと・死んだ holder は次の起動で置き換えられることを示す 2 行目 |
| unavailable | `snapshot-lock: unavailable reason=<code> lock=<dir>` |
| 待ち始め | `snapshot-lock: waiting position=<k>/<n> holder_pid=<pid> lock=<dir>` (1 回) |
| 待っている間 | `snapshot-lock: still-waiting waited_ms=<n> position=<k>/<n>` (60,000 ms ごとに 1 行。繰り返しごとには出さない) |
| CI | `snapshot-lock: skipped reason=ci` |
| 入れ子 | `snapshot-lock: nested generation=<g> holder_pid=<pid>` |

`holder_repo` は表示のためだけの値で、判定には使わない。

## 10. Vitest の一時 dir の衝突

- **runner どうし**: 一時 root の名前は pid とミリ秒を含み、同時に生きている process の pid は重ならないので衝突しない (§2 実測 2)。lock はさらに最上位の実行を直列にする。名前の規則は変えない (寿命の契約の回収規則が依存している)。
- **1 回の Vitest の中のテストファイルどうし** (§2 実測 8、推定): U-TESTHYGIENE-050 / 051 は、実行の前後で `os.tmpdir()` の `ut-tdd-vitest-` で始まる名前を比べ、増えた名前を数えて `finally` で消す。別の worker で同時に走る `tests/snapshot-runner-lifecycle.test.ts` (U-SNAPLC-022〜024) が `runSnapshotTests` で作った一時 root も「増えた名前」に入るので、050 は副作用を 1 と数え、051 はその root を消す。消された root を元に reference を clone するので exit 128 になる。この 2 つの失敗が同じ run で起きたこととも整合する。**lock では防げない** (同じ runner の中の衝突であり、CI では lock を掛けない)。
- 規則: 共有の `os.tmpdir()` を観測するテストは、自分の process の pid を含む名前 (`ut-tdd-vitest-<pid>-`、`ut-tdd-vitest-head-<pid>-`、`ut-tdd-vitest-cache-<pid>-`) だけを数え、消してよいのも自分が作った名前だけとする。判定は `tests/support/` の helper `ownSnapshotRootEntries(names, pid)` に置く。`<pid>` の直後の `-` まで照合する (pid 123 の観測が pid 1230 の root を拾わない)。lock dir と寿命の契約の lease dir (`ut-tdd-vitest-leases`) も数えない。
- この変更はテストだけで、050 / 051 の oracle の意味 (`docs/test-design/harness/L7-unit-test-design.md` の索引行) は変わらない。

## 11. 型と DbC

```ts
export interface ProcessIdentity { pid: number; startToken: string | null }   // snapshot-runner-lifecycle.md §4.2 と同じ形
export type ProcessObservation = ProcessIdentity | null | "query_failed";
export type Presence = true | false | "unknown";
export interface SnapshotLockRecord {
  schema: 1;
  lockId: string;                               // 起動ごとの randomUUID
  runner: { pid: number; startToken: string };  // 書くときは非 null が必須 (§5 手順 1)
  repoRoot: string;                             // 表示用
  queuedAt: string;                             // ISO 8601 (UTC)
  generation: number | null;                    // gen ファイルは g、queue entry は null
  acquiredAt: string | null;
}
export type ClaimState = "live" | "stale";
export interface SnapshotLockStepInput {
  self: { lockId: string; queuedAt: string };
  current: { generation: number; state: "free" | "live" | "stale" } | null;
  waiters: { lockId: string; queuedAt: string; state: ClaimState }[];  // self を含まない
  waitedMs: number;
  maxWaitMs: number;
}
export type SnapshotLockStep = { action: "attempt"; generation: number } | { action: "wait" } | { action: "give_up" };
export type SnapshotLockMode = "skip_ci" | "nested" | "acquire";
export type SnapshotLockAcquisition =
  | { kind: "acquired"; lockId: string; generation: number; release: () => void }
  | { kind: "nested"; generation: number }
  | { kind: "skipped_ci" }
  | { kind: "busy"; holder: SnapshotLockRecord | null; waitedMs: number; lockDir: string }
  | { kind: "unavailable"; reason: string; lockDir: string };
export function resolveSnapshotLockMode(input: {
  env: { CI?: string; UT_TDD_SNAPSHOT_LOCK_TOKEN?: string };
  current: { record: SnapshotLockRecord; released: boolean } | null;
  currentPresence: Presence | null;
}): SnapshotLockMode;
export function parseSnapshotLockWaitMs(raw: string | undefined): { ok: true; ms: number } | { ok: false; message: string };
export function presenceFromKill(errorCode: string | null): Presence;
export function snapshotLockDir(tmpRoot: string): string;
export function classifySnapshotLockClaim(record: SnapshotLockRecord | "unreadable", presence: Presence, observed: ProcessObservation | "not_observed"): ClaimState;
export function decideSnapshotLockStep(input: SnapshotLockStepInput): SnapshotLockStep;
export function identityProbeDue(lastProbeMs: number | null, nowMs: number): boolean;
export function snapshotStageEnv(env: NodeJS.ProcessEnv, acquisition: SnapshotLockAcquisition): NodeJS.ProcessEnv;
```

`acquireSnapshotLock(options: { tmpRoot; repoRoot; env; maxWaitMs }, deps)` の `deps` は、ファイル操作 (`mkdir` / `writeFile` / `rename` / `link` / `readFile` / `readdir` / `unlink`)、`presence(pid)`、`observeIdentity(pid)`、`now()`、`sleep(ms)`、`write(line)`、`resolveMode`、`classify`、`decide` を持ち、`resolveMode` / `classify` / `decide` の既定は上の純関数である。entrypoint は `runSnapshotRunnerMain(argv, env, deps) => number` (終了コード。run の例外は解放の後にそのまま投げ直し、従来どおり未捕捉の例外として終了コード 1 になる) で、`deps` は `acquire`・`release` (既定は acquired の handle の `release()` を呼ぶ)・`run`・`parseWaitMs`・`stageEnv`・`getuid`・`write` を持つ。busy と unavailable の行 (§9) は entrypoint が `SnapshotLockAcquisition` から作り、待ち始め・待っている間・取得・入れ子・CI の行は `acquireSnapshotLock` が出す。

| 区分 | 内容 |
|---|---|
| I1 | claim を経過時間で `stale` にしない。`classifySnapshotLockClaim` は時刻を入力に持たず、取得の手順も記録の `acquiredAt` を判定に使わない |
| I2 | runner は世代ファイルと `released` の印を、作成と §5 の整理 (`g − 32` 以下) 以外で消さず rename もしない。他の世代の印を作らない |
| I3 | 取得は link の成功だけで成り立つ。`EEXIST` は他者の取得、それ以外の失敗は `unavailable` |
| I4 | 自分の startToken が文字列で得られないとき、queue entry も世代ファイルも書かない |
| I5 | `nested` と `skip_ci` は lock dir へ書かず、identity の port を呼ばない |
| I6 | 引数の判定 (help / 未知の option / watch)、root の判定、待ち時間の値の解釈は取得より前に終え、一時 root と clone は取得より後に始める |
| I7 | 解放は run (cleanup を含む) が終わった後に行い、run が失敗したときも行う |
| I8 | lock dir は `tmpRoot` だけから決まり、名前は `ut-tdd-vitest-` で始まらない |
| I9 | 判定関数は純粋である (OS・時刻・環境変数を自分では読まず、引数で受ける) |
| I10 | 待っている間の出力は、待ち始め 1 行、60,000 ms ごとに 1 行、結果 1 行である |

## 12. 既存の契約との関係

- `snapshot-runner-argv.md`: option を足さない。lock の取得は引数の判定の後なので、help・未知の option・watch の拒否は lock に触れない (同書 I1 を保つ)。
- `snapshot-runner-lifecycle.md`: identity の形 (§3.2) と観測の結果の型 (`ProcessObservation`) をそろえる。起動時の順序は「lock の取得 → lease (同書 §3.1) → stage」、解放は同書の cleanup と lease の削除の後とし、終了コード 75 の経路でも解放する。同書の回収規則は lock dir に触れない (§4)。
- `doctor-singleton-lock.md` / `src/doctor/singleton-lock.ts`: コードは流用しない (checkout 単位で、claim を一覧して早い者を勝ちとする方式であり、#1460 の修正もそちらで扱う)。「2 本目は exit 2 と holder の pid」という利用者から見た振る舞いだけをそろえる。
- 共有の索引 `docs/test-design/harness/L7-unit-test-design.md` と `function-spec.md` には、本 PR では行を足さない (§14 の後続)。

## 13. 受け入れ条件

- [ ] 本書と `L7-snapshot-runner-lock-test-design.md` が非著者 family の review で PASS する。
- [ ] `CANDIDATE-U-SNAPLOCK-001`〜`029` の Red、正式 ID への昇格、Green が §14 の順で入り、Refactor の commit がある (または「Refactor なし (理由)」)。
- [ ] 実測 1: 別の worktree で runner を 2 本同時に起動すると、既定では 2 本目が exit 2 と holder の pid・`lock=` を出し、自分の pid の一時 root を作らない。
- [ ] 実測 2: `UT_TDD_SNAPSHOT_LOCK_WAIT_MS` を与えた 3 本は到着順に 1 本ずつ走り、待っている間は §9 の行だけを出す。
- [ ] 実測 3: holder を強制終了すると、待っている者が次の世代を作って走り始める (経過時間ではなく §7 の K2 / K4 による)。
- [ ] 実測 4: runner の下で U-TESTHYGIENE-043 (runner を子として起動するテスト) を流すと、入れ子として busy にならずに終わる。
- [ ] 実測 5: CI の log に `snapshot-lock: skipped reason=ci` が出て、lock dir を作らない。
- [ ] 実測 6: Claude lane、Codex lane、review worktree の runner が同じ `lock=` を出す。
- [ ] U-TESTHYGIENE-050 / 051 が他のテストファイルの一時 root を数えず、消さない。
- [ ] 規範文書と worker への指示から、手で空きを判定する手順を外す (§14 の後続)。

## 14. 実装の順序と後続

1. **契約 PR (本 PR)**: 本書と L7 のテスト設計。`src/` と `scripts/` を変えない。
2. **Red (`src/` を含まない)**: `CANDIDATE-U-SNAPLOCK-*` を引用した `it.fails` を `tests/snapshot-runner-lock.test.ts` に入れる。029 の helper の Red も同じ PR に入れてよい。
3. **昇格 (`src/` を含まない)**: 引用のそろった候補を正式 ID `U-SNAPLOCK-*` に改め、テスト名の引用を書き換える。共有の索引の行はこのときに足す。
4. **Green 1**: `src/runtime/snapshot-runner-lock.ts` (純関数と `acquireSnapshotLock` / 解放) と、単一の pid の identity の観測 (`src/runtime/process-identity.ts`。Windows は CIM の `CreationDate`、Linux は `/proc/<pid>/stat` の starttime、その他は `LC_ALL=C ps -o lstart=`。timeout 5 秒・再試行なし)。寿命の契約の port が後から入るときは、この観測を共有する。寿命の契約の `src/runtime/snapshot-run-lease.ts` は作らない (同書の候補 Red を予定外に通してしまうため)。
5. **Green 2**: `scripts/run-vitest-snapshot.ts` の entrypoint (`runSnapshotRunnerMain`)、stage の環境の受け渡し、終了コード 2 / 3。
6. **テストの衛生 (§10、テストだけ)**: `ownSnapshotRootEntries` と 050 / 051 の観測の範囲。他の段と独立で、先に入れてよい。
7. **規範文書 (別の作業の範囲)**: `CLAUDE.md` / `AGENTS.md` / worker への指示から手での空き判定を外し、exit 2 / 3 の扱い、`UT_TDD_SNAPSHOT_LOCK_WAIT_MS`、ローカルで `CI=true` を設定しないことを書く。

## 15. advisor の相談と未実測の点

相談: `ut-tdd advisor --decision implementation --current-model claude-opus-5-5 --execute` → `gpt-6.1-sol` (exit 0、2026-11-13)。相談した当初の案は「単一の `holder.json` を link で作り、古い holder は rename して消す。lock の障害は fail-open。既定は 30 分待つ」だった。

| advisor の指摘 | 扱い |
|---|---|
| 古い holder の回収の競合 (X と Y が死んだ H を見る → X が消す → Z が作る → Y が Z のものを消す) で 2 本が同時に持てる。消す前に読み直しても隙間が残る | **採用**: holder の削除をやめ、世代番号を進める方式にした (§5、I2)。共有の名前を誰も消さない |
| fail-open は排他の要件を直接破る。`EEXIST` とその他の失敗を分けよ | **採用**: fail-close で exit 3 (§3、I3) |
| 入れ子の token は同じ実行の子孫である証明にならない。保証を最上位の runner どうしに限るか、子の寿命まで持つ契約が要る | **採用**: 保証を最上位どうしに限定し、子孫の寿命は寿命の契約に任せると明記した (§8) |
| 既定は即時の exit 2 がよい。30 分という値に根拠が無い | **採用**: 既定 0、待つのは明示したときだけ (§6) |
| pid の再利用への最小策は、取得時に非 null の startToken を必須にすること | **採用** (§5 手順 1、I4)。観測の失敗は保持し、待つ者が 300 秒ごとに観測し直す |
| B (OS の予約) を退ける根拠として namespace の分離は未検証で弱い | **採用**: B を退ける理由を、正本が 2 つになることと macOS の abstract socket の不在に置き換え、namespace は未実測と書いた (§3) |

未実測の点 (Green の前に測り、本書に追記する):

- Codex lane (sandbox の中を含む) と review worktree で `os.tmpdir()` が Claude lane と同じになるか、hard link が許されるか (実測 6)。違えば lock が分かれるので、範囲の決め方を改める。
- Windows で identity の観測 (PowerShell 経由の CIM) にかかる時間と失敗の頻度。待っている者の 300 秒ごとの観測の負荷が許せるか。
- Linux の `/proc/<pid>/stat` の starttime と macOS の `ps -o lstart=` での identity の取得 (本書では未実測)。
