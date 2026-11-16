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

> **L6 contract marker**: 本書は snapshot runner (`scripts/run-vitest-snapshot.ts`) の**同時実行の排他**の契約である (未実装の目標契約)。判定は `src/runtime/snapshot-runner-lock.ts` の純関数 (`resolveSnapshotLockMode` / `parseSnapshotLockWaitMs` / `presenceFromKill` / `interpretSnapshotLockRead` / `classifySnapshotLockClaim` / `decideSnapshotLockStep` / `identityProbeDue` / `snapshotStageEnv` / `snapshotLockDir`) が持ち、ファイルの操作と process の観測は port 越しに注入する。型と DbC は §11 にまとめる。oracle は `docs/test-design/harness/L7-snapshot-runner-lock-test-design.md` の候補 ID `CANDIDATE-U-SNAPLOCK-001`〜`031` が固定する。行番号と実測は 2026-11-13 の `main` (`09ce4e761`)、Windows 11、node v24.22.3 で取った。

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
| 3 | doctor の singleton (`src/doctor/singleton-lock.ts`) は `<repo>/.ut-tdd/state/doctor-lock/claims` に claim を置く checkout 単位の lock で、2 本目は exit 2 と holder の pid で拒否する。45 分を超えた lock は pid が生きていても回収し (#1460、未修正)、読めない・壊れた claim も stale として回収する (`readLockRecord`)。lock の障害は fail-open である | 同ファイルの `doctorLockClaimsPath` / `isStaleDoctorLock` / `readLockRecord` |
| 4 | Windows で `fs.linkSync(tmp, target)` は target が在れば `EEXIST` で失敗し、在る内容を変えない。`fs.renameSync(a, target)` は在る target を**黙って置き換える** | 使い捨ての node スクリプト (`.ut-tdd/handover/control-tools/` の一時 dir、実行後に削除) |
| 5 | `process.kill(<存在しない pid>, 0)` は `ESRCH` を投げる。自分の pid への呼び出しは 200 ms で約 1,500 回できる (待ちの間の生存確認に使える軽さ) | 同上 |
| 6 | `os.tmpdir()` は Git Bash から起動した node で `C:\Users\<user>\AppData\Local\Temp` を返した。Codex lane と review worktree で同じ値になるかは未実測 (§15) | 同上 |
| 7 | テストが runner の entrypoint を子 process として起動する経路がある。`tests/global-setup-fence.test.ts` (U-TESTHYGIENE-043) は実 runner を起動し、`tests/snapshot-runner-argv-candidates.test.ts` は spawn を preload で横取りして、clone より前に起きる spawn の列を固定している | 各テストファイル |
| 8 | 2026-11-13 の CI (run 43378612411、docs だけの PR) で、U-SNAPLC-022 の reference の clone が exit 128、U-TESTHYGIENE-050 の副作用の数が 0 のはずが 1 になった。どちらも共有の `os.tmpdir()` を使う | #1665 のコメント 6846162539 |

## 3. 設計判断 (方式の候補と推奨)

排他の置き場と仕組みについて、次の 3 案を比べた。

| 案 | 内容 | 長所 | 短所 |
|---|---|---|---|
| A | user の tmp dir に置いた lock dir で、**世代番号つきの holder ファイルを hard link で排他的に作り、作った後に自分より大きい番号が無いことを確かめる** (§5)。古い holder は消さずに次の世代で置き換える | Node の標準 API だけで OS をまたいで書ける。holder の情報 (pid・checkout) をそのまま表示できる。安全性が「最大の番号は消えない」という単調性だけで決まり、process の停止時間に依らない (§5.3) | pid の再利用を見分けるために process の開始時刻 (startToken) の観測が要る (Windows で 1 回数秒)。lock の範囲が `os.tmpdir()` の一致に依存する |
| B | OS が process の死と同時に解放する予約 (Windows の named pipe、Linux の abstract socket) を排他に使う | 古い lock の判定が要らない | Node に予約の持ち主の pid を問い合わせる API が無く、表示用の記録を別に持つので正本が 2 つになる。macOS には abstract socket が無く、ファイルの socket では古い lock の問題が戻る。sandbox の namespace で予約が分かれるかは未実測 |
| C | doctor の singleton をそのまま流用し、checkout ごとに lock を掛ける | 実装済みの仕組みを使える | 別の worktree・別の lane・review worktree の実行を排他できず、#1665 の要件を満たさない。45 分の TTL で生きた holder を回収する誤り (#1460) と、読めない claim を stale とする扱いも引き継ぐ |

**推奨は A**。理由: B の利点 (回収が要らない) は、A でも「holder の削除をしない世代方式」と「時刻を使わない identity の判定」で同じ安全性に届き、B の短所 (正本が 2 つ、OS 別の実装、未実測の namespace) を負わずに済む。C は要件を満たさない。

あわせて次を決めた (相談の経緯は §15)。

| 論点 | 決定 | 理由 |
|---|---|---|
| 範囲 | `os.tmpdir()` 単位 (この PC では全 lane が同じ user なので PC 単位) | runner は既に一時 root を `os.tmpdir()` に作っており、書き込めることが確かめられている唯一の場所である。checkout には依らない |
| 取れないとき | **既定は即時に exit 2** (holder の pid を表示)。`UT_TDD_SNAPSHOT_LOCK_WAIT_MS` に正の値を与えたときだけ、その時間を上限に順番を待つ | 既定で長く待つと lane が止まり、呼び出し元の tool の timeout に先に殺される。手での空き判定を無くすことは、判定を runner の中で原子的に行うことで達成でき、待つかどうかは呼び出し元が選べばよい |
| reviewer の実行 | 同じ lock に入る。例外も優先もない | runner は自分の役割を確かめる手段を持たない。役割で優先を付けると、名乗るだけで割り込める口ができる |
| 待つ順番 | 待つ者どうしは到着順 (FIFO)。即時の exit 2 を選んだ者も、先に待っている者を追い越さない | 40 分待っても順番が来ない事態 (control の観測) を、到着順と待ち位置の表示で防ぐ。順番は公平さのための規則で、排他の安全性は順番に依らない (§5.3) |
| 小さい実行の別枠 | 設けない (枠は 1 つ) | 対象が 1〜2 ファイルでも clone・`npm ci`・`db rebuild` の固定費は同じで、メモリと CPU を食うのはこの固定費である。#98 で固定費が下がったら見直す |
| lock の障害 | **走るかどうかの判定に使う操作の失敗は fail-close** (exit 3、理由を表示)。判定に使わない片付けの失敗は無視する。区別は §7.2 の表が正本 | 障害時に lock なしで走ると、排他の要件を黙って破る。片付け (古い世代の整理、tmp の削除、stale の待っている者の削除) は排他の安全性に関わらないので、その失敗で run を止めない |
| CI | 排他を掛けない (`CI` が `true` のとき) | CI は job ごとに別の機械である |

## 4. lock の範囲と置き場

- lock dir は `snapshotLockDir(tmpRoot) = join(tmpRoot, "ut-tdd-snapshot-runner-lock")` で、`tmpRoot` は `os.tmpdir()`。**checkout (repo root) を入力に持たない**ので、同じ tmp dir を使う全ての checkout・lane・review worktree が 1 つの lock を共有する。
- 名前は `ut-tdd-vitest-` で始めない。一時 root を数える既存のテスト (U-TESTHYGIENE-050 / 051) と、寿命の契約の回収規則 (`snapshot-runner-lifecycle.md` §4.2 S7 の名前の規則) の対象に入らないようにするためである。
- 中身:
  - `gen-<g>.json`: 世代 `g` (1 から増える整数) の holder の記録。§5 の手順でだけ作り、作った後は変更しない。
  - `released-<g>`: 世代 `g` が正常に終わった印。世代 `g` の holder だけが作る。
  - `queue/<lockId>.json`: 待っている者の記録 (待つ場合だけ)。
  - `tmp/<lockId>.json`: hard link や rename の元にする作業用のファイル。
- 記録は必ず `tmp/` に全て書いて閉じてから、link (世代ファイル) か rename (queue entry、名前は自分だけのもの) で公開する。**公開された記録は最初から完全な内容を持つ**ので、読めた内容が壊れているのは、この契約の外の書き込みか媒体の障害である (§7.1 の「壊れている」を fail-close にする根拠)。
- 前提: lock dir の中のファイルを runner 以外 (人の手、他の tool) が消したり書き換えたりしないこと。これを破った場合の排他は保証しない。
- 限界: user ごとに `os.tmpdir()` が違う構成 (別の OS user、WSL2 と Windows の混在、`TMP` を書き換える sandbox) では lock が分かれる。分かれたことが見えるように、lock の行には必ず `lock=<dir>` を出す (§9)。

## 5. 世代ファイルによる取得と解放

**5.1 現在の世代**

lock dir の一覧 (readdir) に現れる `gen-<g>.json` の最大の `g` を `m` とし、世代 `m` を**現在の世代**と呼ぶ。現在の世代の状態は次の 4 つで、判定の順序と読み取りの失敗の扱いは §7 が正本である。

| 状態 | 条件 |
|---|---|
| なし | `gen-*.json` が 1 つも無い |
| 空き (`free`) | 一覧に `released-<m>` が在る (世代ファイルを読まない) |
| 生存 (`live`) | `released-<m>` が無く、記録が読めて、§7 の分類が `live` |
| 古い (`stale`) | `released-<m>` が無く、記録が読めて、§7 の分類が `stale` |

**5.2 取得の手順 (acquire モード、§8)**

1. 自分の identity (`{ pid, startToken }`) を観測する。`startToken` が文字列で得られなければ、queue にも世代ファイルにも書かずに `unavailable` (exit 3) で終える。
2. 待つ場合 (上限が正) は `queue/<lockId>.json` を書く (§4 の公開の規則)。
3. 次を繰り返す: lock dir を一覧し、現在の世代と待っている者を §7 で読んで分類し、`decideSnapshotLockStep` (§6) で次の行動を決める。読み取りが `absent` (§7.1) なら、その回の判定を捨てて 3 をやり直す。
4. 行動が `attempt` (世代番号 `n = m + 1`、世代が無ければ `n = 1`) なら、記録を `tmp/<lockId>.json` に全て書いて閉じ、`link(tmp/<lockId>.json, gen-<n>.json)` を試す。`EEXIST` なら別の者が先にその番号を作ったので、3 へ戻る。それ以外の失敗は `unavailable` で終える。どの場合も `tmp/<lockId>.json` は消す (消せなくても続ける)。
5. **検証**: link が成功したら、lock dir をもう一度一覧し、`n` より大きい番号の `gen-<k>.json` が 1 つでも在るかを見る。
   - 在れば、自分は holder ではない (`gen-<n>.json` は、一覧を読んでから link するまでの間に整理で消えた番号を作り直した**孤児**である)。孤児の世代ファイルは消さず、`released-<n>` も作らずに 3 へ戻る。孤児は以後どの判定にも現れず (§5.3 の補題 1)、後の整理で消える。
   - 無ければ、世代 `n` の holder である。
   - 一覧に失敗したら、`released-<n>` を作ってから (作れなくても) `unavailable` で終える。holder だったかどうかを確かめられないので run を始めず、自分の番号は空きにして返す (孤児だった場合も、空きの印は判定に影響しない)。
6. holder になったら自分の queue entry を消し (消せなくても続ける)、§5.4 の整理を行ってから run を始める。

**古い世代は消さない**。`stale` の世代 `m` は、次の世代 `m+1` を作ることで置き換える。

**5.3 安全性の論証 (停止時間に依らない)**

**不変条件 S**: どの時点でも、「世代 `g` を手順 5 で holder と確定し、`released-<g>` を作っておらず、まだ生きている process」は高々 1 つである。

前提は次の 3 つで、時刻・待ち時間・停止の長さを使わない。

- P1 (link の排他): 同じ名前への link は、在るなら `EEXIST` で失敗し、無いなら 1 者だけが成功する (§2 実測 4。Linux の `link(2)` も同じ)。
- P2 (一覧): readdir の 1 回の呼び出しの間ずっと存在するファイルは、その結果に必ず現れる (POSIX の readdir と NTFS の列挙の規則。一覧の途中で作られた・消されたファイルは現れても現れなくてもよい)。
- P3 (`stale` の永続): §7 で `stale` とした holder は既に死んでおり、生き返らない (K1〜K3 はどれも「記録の process はもう居ない」ことの観測である。identity の port は同じ process に対して常に同じ startToken を返す、§11 の前提)。`free` (`released-<g>` が在る) も消えるまで続き、`released-<g>` が消えるのは `gen-<g>.json` と一緒に整理されるときだけである。

**補題 1 (最大の番号は消えない)**: `gen-<k>.json` を消すのは、手順 5 で holder と確定した世代 `g` の holder が `k ≤ g − 32` を整理する場合だけで (I2)、そのとき `gen-<g>.json` が在るので `k` は最大ではない。よって一覧の最大値は時間とともに減らない。

**補題 2 (検証の意味)**: 手順 5 の一覧に `n` より大きい番号が無ければ、link の時点で `n` より大きい番号は在らず、link の直前の最大値はちょうど `m = n − 1` だった。理由: link の時点で `k > n` が在れば、補題 1 によりその後の最大値は `k` 以上で、最大の番号のファイルは一覧の間ずっと在るので P2 により一覧に現れる。また、自分が手順 3 で `m` を読んだ後に最大値は減らない (補題 1) ので、link の直前の最大値は `m` 以上 `n − 1` 以下、すなわち `m` である。

**S の論証**: 新しい holder が生まれるのは、手順 5 の検証を通ったときだけである。補題 2 より、そのとき link の直前の最大値は `m` で、その世代は手順 3 で自分が `free` か `stale` と判定したものである (`live` なら `attempt` しない、§6)。P3 よりその判定は link の時点でも成り立つので、世代 `m` の holder は解放済みか死んでいる。世代 `m` より前の世代の holder は、帰納法により世代 `m` が作られた時点で既に解放済みか死んでいる。よって新しい holder と同時に生きている holder は無い。

**各段で止まった場合** (どの段でも任意の時間止まりうる):

| 止まる・死ぬ位置 | 何が起きるか |
|---|---|
| 一覧の後、link の前 | 判定は P3 により古くならない。その間に番号が進んでいれば、link は `EEXIST` か (番号が整理されていれば) 孤児になり、手順 5 で弾かれる。reviewer の反例 (世代 1 を読んで止まる → 世代 2〜34 が進み、世代 34 の整理で `gen-2` が消える → `gen-2` の link が成功) は、検証で `gen-34` が見えるので holder にならない |
| link の後、検証の前 | 自分の記録 (生きた pid) が最大なら、他者は `live` と判定して待つ。孤児なら最大ではないので他者の判定に現れない |
| 検証の後 (holder) | 他者は `live` と判定して待つ。検証の結果は「link の時点で最大だった」という過去の事実で、その後の停止で崩れない (この点が「取得後の単なる再読」と違う。再読は現在の状態を見るが、検証は補題 1・2 により link の時点の状態を確定させる) |
| 死ぬ (どの段でも) | 最大の世代の記録が死んだ pid を指すので `stale` になり、次の者が置き換える。孤児なら何も起きない。link の前なら何も残らない (`tmp/` の残骸は状態に使わない) |
| 整理の途中 | 整理は最大でない番号だけを消す (補題 1) ので、途中で止まっても不変条件に影響しない |
| pid の再利用 | 死んだ holder の pid を別の process が使っても、identity の観測で startToken が違えば `stale` (K3)。観測するまでは `live` で、安全側 (待つ) に倒れる |

**使わない基本操作**: `rename` は在る target を黙って置き換える (§2 実測 4) ので、世代ファイルの作成に使わない。`open(…, "wx")` (`O_EXCL`) も排他的だが、作った直後の空のファイルが他者に見え、壊れた記録と区別できないので使わない。`mkdir` は排他的だが中身を持てない。doctor の singleton (§2 実測 3) は、早い者を勝ちとする claim の一覧・TTL による回収・読めない claim の回収・fail-open のどれも本書の要件と合わないので流用しない。

**5.4 解放と整理**

解放: 世代 `g` の holder は、run (cleanup を含む) が終わった後に `released-<g>` を排他的に作る。**他の世代の印を作らず、どの世代ファイルも消さず rename もしない**。作るのに失敗したら (`EEXIST` を除く) `snapshot-lock: release-failed reason=<code>` の行を出し、例外を投げず、run の終了コードを変えない。印が無くても、holder が終了すれば記録は `stale` になり、次の者が置き換える。

整理: 手順 5 で holder と確定した世代 `g` の holder は、一覧に現れた `k ≤ g − 32` の `gen-<k>.json` と `released-<k>` を消す (失敗は無視し、run を止めない)。**整理が番号を作り直せる状態にしても安全である**: 消えた番号を誰かが link で作っても、補題 2 によりその者は手順 5 で孤児と判定される。32 は診断のために残す履歴の量であり、排他の安全性はこの値に依らない (1 にしても破れない)。`tmp/` の残骸 (link の前に process が殺された場合) は消さない。状態には使わず、大きさも小さいからである。

## 6. 待ち方と順番

- 待ち時間の上限は `parseSnapshotLockWaitMs(env.UT_TDD_SNAPSHOT_LOCK_WAIT_MS)` で決める。未設定または空文字は `0`、10 進の数字だけの文字列はその値 (ミリ秒)、それ以外 (負号・小数・空白・英字・`Number.MAX_SAFE_INTEGER` 超え) は誤りで、lock にも一時 root にも触れずに終了コード 1 で終える。
- runner の引数には option を足さない (`snapshot-runner-argv.md` の受理集合を変えない)。
- 順番 (`decideSnapshotLockStep`): 自分と、`live` に分類した待っている者のうち、`queuedAt` が最も早い者 (同じなら `lockId` の辞書順で前の者) を先頭とする。`stale` の待っている者は数えない。**現在の世代が `live` でなく、かつ自分が先頭のときだけ** `attempt` (次の世代の番号は「現在の世代の番号 + 1」、世代が無ければ 1) とする。そうでなく、待った時間が上限以上なら `give_up`、それ以外は `wait`。取得できる状態なら、上限を過ぎていても `give_up` より `attempt` を先にする。
- 即時の exit 2 (上限 0) の者は queue entry を書かないが、自分の `queuedAt` は試した時刻なので、先に待っている者を追い越さない。
- 順番は公平さの規則であり、2 者が同時に自分を先頭と判定しても、排他は §5.3 が守る (link の `EEXIST` と検証)。
- 1 回の繰り返しの間隔は 2,000 ms。現在の世代と待っている者の生存は毎回 `process.kill(pid, 0)` で確かめ、identity (startToken) の観測は `identityProbeDue` が真のときだけ行う (初めて見た記録、または前回の観測から 300,000 ms 以上たった記録)。この間隔は回収の速さだけを決め、安全性には関わらない。
- 待っている者の記録のうち `stale` と分類したものは、見た者が消す (失敗は無視する)。`live` の記録は消さない。queue entry の名前は起動ごとの `lockId` なので、消した名前に別の者の記録が入れ替わることは無い。
- `busy` と `unavailable` で終えるときも、自分の queue entry を消す (失敗は無視する)。

## 7. 記録の読み取りと古い claim の判定

**7.1 記録の読み取り (`interpretSnapshotLockRead`)**

世代ファイルと queue entry の読み取りの結果を、次の 3 つと「読めた」に分ける。判定は上の行から順に行い、最初に当てはまった行で決まる。

| # | 読み取りの結果 | 区分 | 現在の世代の記録 | 待っている者の記録 |
|---|---|---|---|---|
| R0 | (読む前) 一覧に `released-<m>` が在る | — | 読まずに `free` | — |
| R1 | 読み取りが `ENOENT` で失敗した (一覧の後に消えた) | `absent` | その回の判定を捨て、§5.2 の手順 3 をやり直す。置き換えも unavailable もしない | その者は去ったので数えない |
| R2 | 読み取りが `ENOENT` 以外の code で失敗した (`EACCES` / `EPERM` / `EIO` / `EBUSY` など。code が無ければ `UNKNOWN`) | `unavailable` | **holder を置き換えず** `unavailable` (exit 3、`reason=<code>`) で終える | 同じく `unavailable` で終える |
| R3 | 読めたが壊れている (JSON として解釈できない、`schema` が 1 でない、`lockId` が空でない文字列でない、`runner.pid` が正の整数でない、`runner.startToken` が空でない文字列でない) | `unavailable` | `unavailable` (`reason=malformed`) で終える | 同じく `unavailable` で終える |
| R4 | 読めて、R3 に当たらない | 読めた | §7.2 で分類する | §7.2 で分類する |

- 読めない記録・壊れた記録を `stale` にしない。holder が生きていて、その記録だけが一時的に読めない (権限、ウイルス対策の lock、媒体の障害) 場合に置き換えると、2 本が同時に走るからである。壊れた記録は §4 の公開の規則の下では生じないので、自動の回収はせず、`reason=malformed` と `lock=<dir>` を出して人に知らせる。
- `absent` を「読めない」と区別するのは、整理 (§5.4) で正当に消えた番号を、止まっていた者が読もうとする場合があるからである。現在の世代の記録が `absent` でも、それを根拠に次の番号を作らない (もう一度一覧すれば、より大きい最大値が見える。補題 1)。
- lock dir の一覧 (`readdir`) の失敗、lock dir の作成の失敗は、R2 と同じく `unavailable` で終える。

**7.2 生存の分類 (`classifySnapshotLockClaim`)**

`classifySnapshotLockClaim(record, presence, observed) => "live" | "stale"`。入力の記録は §7.1 の R4 (読めた) だけである。**時刻を入力に持たない** (#1460 の「生きている holder を経過時間で回収する」誤りを型の段階で作らない)。

| # | 条件 | 結果 |
|---|---|---|
| K1 | `presence` が `false` (`kill(pid, 0)` が `ESRCH`) | `stale` |
| K2 | 観測が `null` (port がその pid の process は無いと答えた) | `stale` |
| K3 | 観測が identity で、その `startToken` が文字列かつ記録の `startToken` と違う (pid の再利用) | `stale` |
| K4 | それ以外 (観測が一致、観測が `"query_failed"`、今回は観測していない、観測の startToken が `null`、`presence` が `"unknown"`) | `live` |

- `presenceFromKill(code)`: 例外なしは `true`、`EPERM` は `true` (在るが触れない)、`ESRCH` は `false`、それ以外は `"unknown"`。
- 観測の失敗を `stale` にしないので、観測が失敗し続ける間は holder を回収しない。その間の待ちは上限で打ち切られる。これは「生きている holder を誤って回収する」より安全な側の誤りである。
- 記録に非 null の startToken を必須にしたので (§5.2 手順 1)、pid が再利用されても、次に identity を観測した時点 (最長 300 秒後) で K3 により回収できる。この時間は回収の遅れであり、安全性 (§5.3) には関わらない。

**7.3 失敗の扱いの一覧 (正本)**

| 操作 | 失敗の扱い |
|---|---|
| 自分の identity の観測 | `unavailable` (§5.2 手順 1) |
| lock dir と `queue/` / `tmp/` の作成、`tmp/` への書き込み、queue entry の rename | `unavailable` |
| lock dir の一覧 (手順 3 と手順 5) | `unavailable` (手順 5 では `released-<n>` を作ってから) |
| 記録の読み取り | §7.1 の R1〜R3 |
| 世代ファイルへの link | `EEXIST` は手順 3 へ戻る。それ以外は `unavailable` |
| `released-<g>` の作成 (解放) | `release-failed` の行を出し、終了コードを変えない (§5.4) |
| unlink (tmp、自分の queue entry、stale の待っている者、整理) | 無視する。どれも排他の判定に使う記録ではない |

## 8. 入れ子の実行と CI

`resolveSnapshotLockMode({ env, current, currentPresence })`:

1. `env.CI === "true"` なら `skip_ci`。lock dir に触れない (値が `"true"` 以外なら CI として扱わない)。
2. `env.UT_TDD_SNAPSHOT_LOCK_TOKEN` が空でなく、現在の世代の記録の `lockId` と一致し、その世代に `released` の印が無く、holder の `presence` が `false` でなければ `nested`。
3. それ以外は `acquire`。

- 呼び出しの順序: `acquireSnapshotLock` は最初に `resolveMode({ env, current: null, currentPresence: null })` を呼び、`skip_ci` ならそこで終える (lock dir を読まない)。そうでなければ lock dir を一覧して現在の世代を §7.1 で読み、`unavailable` ならそこで終え (mode に依らない)、`absent` なら一覧からやり直し、読めたら (R0 の `free` なら記録を読まず `current` を null として) `resolveMode` をもう一度呼んで `nested` か `acquire` を決める。
- `nested` と `skip_ci` は、lock dir へ書かず、identity の port を呼ばない (子 process を起動しない)。`nested` の判定に使うのはファイルの読み取りと `process.kill(pid, 0)` だけである。clone より前の spawn の列を固定している既存のテスト (§2 実測 7) を壊さないためである。
- token の受け渡し: 取得した runner は、stage の子 process に渡す環境へ `UT_TDD_SNAPSHOT_LOCK_TOKEN=<自分の lockId>` を足す (`snapshotStageEnv(env, acquisition)`)。`nested` と `skip_ci` は環境を変えない (受け継いだ token はそのまま子へ渡る)。entrypoint は `deps.run(args, repoRoot, stageEnv)` を呼び、既定の `run` は `runSnapshotTests(args, repoRoot, getuid, stageEnv)` (第 4 引数は省略可能で、既定は `process.env`) に渡す。`runSnapshotTests` はこの環境を全 stage の子の環境の基にする。既存の 3 引数の呼び出しは変わらない。
- **保証の範囲**: 排他は「最上位の runner どうし」の間だけで成り立つ。holder の Vitest の中から起動された入れ子の runner は holder の実行の一部であり、入れ子どうしは排他しない (今も並列に走っている)。holder が死んだ後に残った子孫 (`npm ci` / Vitest / 入れ子) は、寿命の契約 (`snapshot-runner-lifecycle.md`) が止めるまで、次の世代の実行と重なりうる。
- `CI=true` をローカルで設定すると排他を外せる。これは迂回の口として残る既知の限界で、規範文書で禁じる (§14 の後続)。

## 9. 終了コードと出力

| 終了コード | 意味 |
|---|---|
| 0 / 1 | 従来どおり (検証の成否、runner の誤り。待ち時間の値の誤りも 1) |
| 2 | **busy**: 別の最上位の runner が持っていて、上限まで待っても (既定は待たずに) 取れなかった。一時 root も clone も作らない |
| 3 | **unavailable**: §7.3 の表で `unavailable` とした失敗 (lock dir の一覧・作成・書き込み、記録の読み取りの R2 / R3、`EEXIST` 以外の link の失敗、自分の identity を得られない)。一時 root も clone も作らない |
| 75 | 寿命の契約の `EXIT_PARENT_LOST` (変えない) |

出力は全て stderr で、各行の先頭を `snapshot-lock:` とし、値は `key=value` で並べる。行の文面は oracle で解析しない (`key=` の有無と値だけを見る)。

| 場面 | 行 |
|---|---|
| 取得 | `snapshot-lock: acquired generation=<g> waited_ms=<n> lock=<dir>` |
| busy | `snapshot-lock: busy holder_pid=<pid> holder_repo=<path> since=<acquiredAt> generation=<g> waited_ms=<n> lock=<dir>` と、待つには `UT_TDD_SNAPSHOT_LOCK_WAIT_MS` を使うこと・死んだ holder は次の起動で置き換えられることを示す 2 行目 |
| unavailable | `snapshot-lock: unavailable reason=<code> lock=<dir>` (`reason` は §7.1 の code か `malformed`) |
| 解放の失敗 | `snapshot-lock: release-failed reason=<code> generation=<g> lock=<dir>` |
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
  runner: { pid: number; startToken: string };  // 書くときは非 null が必須 (§5.2 手順 1)
  repoRoot: string;                             // 表示用
  queuedAt: string;                             // ISO 8601 (UTC)
  generation: number | null;                    // gen ファイルは g、queue entry は null
  acquiredAt: string | null;
}
export type SnapshotLockRead = { kind: "text"; text: string } | { kind: "error"; code: string | null };
export type SnapshotLockReadResult =
  | { kind: "ok"; record: SnapshotLockRecord }
  | { kind: "absent" }
  | { kind: "unavailable"; reason: string };    // R2 は code (null なら "UNKNOWN")、R3 は "malformed"
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
export function interpretSnapshotLockRead(read: SnapshotLockRead): SnapshotLockReadResult;
export function classifySnapshotLockClaim(record: SnapshotLockRecord, presence: Presence, observed: ProcessObservation | "not_observed"): ClaimState;
export function decideSnapshotLockStep(input: SnapshotLockStepInput): SnapshotLockStep;
export function identityProbeDue(lastProbeMs: number | null, nowMs: number): boolean;
export function snapshotStageEnv(env: NodeJS.ProcessEnv, acquisition: SnapshotLockAcquisition): NodeJS.ProcessEnv;
```

`acquireSnapshotLock(options: { tmpRoot; repoRoot; env; maxWaitMs }, deps)` の `deps` は、ファイル操作 (`mkdir` / `writeFile` / `rename` / `link` / `readFile` / `readdir` / `unlink`)、`presence(pid)`、`observeIdentity(pid)`、`now()`、`sleep(ms)`、`write(line)`、`resolveMode`、`interpretRead`、`classify`、`decide` を持ち、`resolveMode` / `interpretRead` / `classify` / `decide` の既定は上の純関数である。`readFile` の例外は `{ kind: "error", code: err.code ?? null }` に、成功は `{ kind: "text", text }` に包んで `interpretRead` に渡す。entrypoint は `runSnapshotRunnerMain(argv, env, deps) => number` (終了コード。run の例外は解放の後にそのまま投げ直し、従来どおり未捕捉の例外として終了コード 1 になる) で、`deps` は `acquire`・`release` (既定は acquired の handle の `release()` を呼ぶ)・`run`・`parseWaitMs`・`stageEnv`・`getuid`・`write` を持つ。busy と unavailable の行 (§9) は entrypoint が `SnapshotLockAcquisition` から作り、待ち始め・待っている間・取得・解放の失敗・入れ子・CI の行は `acquireSnapshotLock` と `release()` が出す。

前提: identity の port (`observeIdentity`) は、同じ process に対して生きている間ずっと同じ `startToken` を返す (§5.3 の P3)。これを満たさない観測 (書式の揺れ、丸め) は K3 の誤判定を生むので、実装 (§14 の 4) は正規化した値を返す。

| 区分 | 内容 |
|---|---|
| I1 | claim を経過時間で `stale` にしない。`classifySnapshotLockClaim` は時刻を入力に持たず、取得の手順も記録の `acquiredAt` を判定に使わない |
| I2 | runner は世代ファイルと `released` の印を、作成と §5.4 の整理 (手順 5 で holder と確定した世代 `g` の holder による `g − 32` 以下) 以外で消さず rename もしない。他の世代の印を作らない (手順 5 の一覧の失敗で自分の番号 `n` の印を作る場合を除く) |
| I3 | holder になるのは、link の成功と手順 5 の検証 (一覧に `n` より大きい番号が無い) の両方を満たしたときだけである。`EEXIST` は他者の取得、それ以外の link の失敗は `unavailable` |
| I4 | 自分の startToken が文字列で得られないとき、queue entry も世代ファイルも書かない |
| I5 | `nested` と `skip_ci` は lock dir へ書かず、identity の port を呼ばない |
| I6 | 引数の判定 (help / 未知の option / watch)、root の判定、待ち時間の値の解釈は取得より前に終え、一時 root と clone は取得より後に始める |
| I7 | 解放は run (cleanup を含む) が終わった後に行い、run が失敗したときも行う。解放の失敗は例外にせず、終了コードを変えない |
| I8 | lock dir は `tmpRoot` だけから決まり、名前は `ut-tdd-vitest-` で始まらない |
| I9 | 判定関数は純粋である (OS・時刻・環境変数を自分では読まず、引数で受ける) |
| I10 | 待っている間の出力は、待ち始め 1 行、60,000 ms ごとに 1 行、結果 1 行である |
| I11 | 記録の読み取りの失敗 (R2) と壊れた記録 (R3) は、holder も待っている者も置き換えず `unavailable` にする。`stale` にするのは §7.2 の K1〜K3 だけである |
| I12 | 排他の安全性 (§5.3 の S) は、時刻・待ち時間・観測の間隔・整理の余裕 (32) のどれにも依らない |

## 12. 既存の契約との関係

- `snapshot-runner-argv.md`: option を足さない。lock の取得は引数の判定の後なので、help・未知の option・watch の拒否は lock に触れない (同書 I1 を保つ)。
- `snapshot-runner-lifecycle.md`: identity の形 (§3.2) と観測の結果の型 (`ProcessObservation`) をそろえる。起動時の順序は「lock の取得 → lease (同書 §3.1) → stage」、解放は同書の cleanup と lease の削除の後とし、終了コード 75 の経路でも解放する。同書の回収規則は lock dir に触れない (§4)。
- `doctor-singleton-lock.md` / `src/doctor/singleton-lock.ts`: コードは流用しない (§5.3 の「使わない基本操作」)。「2 本目は exit 2 と holder の pid」という利用者から見た振る舞いだけをそろえる。doctor の読めない claim を stale とする扱いと TTL は #1460 で扱う。
- 共有の索引 `docs/test-design/harness/L7-unit-test-design.md` と `function-spec.md` には、本 PR では行を足さない (§14 の後続)。

## 13. 受け入れ条件

- [ ] 本書と `L7-snapshot-runner-lock-test-design.md` が非著者 family の review で PASS する。
- [ ] `CANDIDATE-U-SNAPLOCK-001`〜`031` の Red、正式 ID への昇格、Green が §14 の順で入り、Refactor の commit がある (または「Refactor なし (理由)」)。
- [ ] 実測 1: 別の worktree で runner を 2 本同時に起動すると、既定では 2 本目が exit 2 と holder の pid・`lock=` を出し、自分の pid の一時 root を作らない。
- [ ] 実測 2: `UT_TDD_SNAPSHOT_LOCK_WAIT_MS` を与えた 3 本は到着順に 1 本ずつ走り、待っている間は §9 の行だけを出す。
- [ ] 実測 3: holder を強制終了すると、待っている者が次の世代を作って走り始める (経過時間ではなく §7.2 の K1 / K3 による)。
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

## 15. advisor の相談・review の指摘と未実測の点

相談: `ut-tdd advisor --decision implementation --current-model claude-opus-5-5 --execute` → `gpt-6.1-sol` (exit 0、2026-11-13)。相談した当初の案は「単一の `holder.json` を link で作り、古い holder は rename して消す。lock の障害は fail-open。既定は 30 分待つ」だった。

| advisor の指摘 | 扱い |
|---|---|
| 古い holder の回収の競合 (X と Y が死んだ H を見る → X が消す → Z が作る → Y が Z のものを消す) で 2 本が同時に持てる。消す前に読み直しても隙間が残る | **採用**: holder の削除をやめ、世代番号を進める方式にした (§5、I2)。現在の世代を消す者は居ない |
| fail-open は排他の要件を直接破る。`EEXIST` とその他の失敗を分けよ | **採用**: fail-close で exit 3 (§3、§7.3、I3) |
| 入れ子の token は同じ実行の子孫である証明にならない。保証を最上位の runner どうしに限るか、子の寿命まで持つ契約が要る | **採用**: 保証を最上位どうしに限定し、子孫の寿命は寿命の契約に任せると明記した (§8) |
| 既定は即時の exit 2 がよい。30 分という値に根拠が無い | **採用**: 既定 0、待つのは明示したときだけ (§6) |
| pid の再利用への最小策は、取得時に非 null の startToken を必須にすること | **採用** (§5.2 手順 1、I4)。観測の失敗は保持し、待つ者が 300 秒ごとに観測し直す |
| B (OS の予約) を退ける根拠として namespace の分離は未検証で弱い | **採用**: B を退ける理由を、正本が 2 つになることと macOS の abstract socket の不在に置き換え、namespace は未実測と書いた (§3) |

closing review (r1、非著者 family) の FLAG と扱い:

| 指摘 | 扱い |
|---|---|
| 整理 (`g − 32` 以下の削除) の後、止まっていた取得者が消えた番号を link で作り直すと holder になり、生存中の最大の世代と同時に走る。「32 世代進むことは無い」は保証されない | **採用**: link の後に一覧し、自分より大きい番号が在れば孤児として退く検証を足した (§5.2 手順 5、I3)。安全性は「最大の番号は消えない」という単調性から導き、停止時間・32 の値に依らない (§5.3、I12)。検出する oracle は 030 |
| 「記録が読めない → stale」(旧 K1) と「lock の読み書き障害 → fail-close」が衝突し、生存中の holder の記録だけが読めないと次の世代を取れてしまう | **採用**: 読み取りを absent / 読み取りの失敗 / 壊れている / 読めた に分け、失敗と壊れた記録は置き換えずに `unavailable` とした (§7.1、§7.3、I11)。`classifySnapshotLockClaim` は読めた記録だけを受ける。検出する oracle は 007 と 031 |

未実測の点 (Green の前に測り、本書に追記する):

- Codex lane (sandbox の中を含む) と review worktree で `os.tmpdir()` が Claude lane と同じになるか、hard link が許されるか (実測 6)。違えば lock が分かれるので、範囲の決め方を改める。
- Windows で identity の観測 (PowerShell 経由の CIM) にかかる時間と失敗の頻度。待っている者の 300 秒ごとの観測の負荷が許せるか。
- Linux の `/proc/<pid>/stat` の starttime と macOS の `ps -o lstart=` での identity の取得 (本書では未実測)。
- Windows でウイルス対策などが記録の読み取りに一時的な `EBUSY` / `EPERM` を返す頻度。多ければ R2 の exit 3 が増える (安全側だが利便を損なう)。その場合も R2 を `stale` に変えず、読み取りの再試行の回数を足す改訂で扱う。
- §5.3 の P2 (一覧の間ずっと在るファイルは必ず現れる) は POSIX と NTFS の列挙の規則による前提で、本書では実測していない。
