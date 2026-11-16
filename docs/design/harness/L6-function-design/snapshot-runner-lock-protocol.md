---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_snapshot_runner_lock_protocol
parent_doc: docs/design/harness/L6-function-design/snapshot-runner-lock.md
pair_artifact: docs/test-design/harness/L7-snapshot-runner-lock-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-16
issue: 1665
---

> **L6 contract marker**: 本書は snapshot runner の排他 (`snapshot-runner-lock.md`、以下「本体」) のうち、**取得・解放の手順とその安全性の論証**、**記録の読み取りと生存の分類と失敗の扱い**の契約である (未実装の目標契約)。純関数 `interpretSnapshotLockRead(read) => SnapshotLockReadResult` と `classifySnapshotLockClaim(record, presence, observed) => ClaimState`、手順 `acquireSnapshotLock(options, deps) => SnapshotLockAcquisition` の型と DbC (I1〜I12) は本体 §11 にある。oracle は本体と同じ `docs/test-design/harness/L7-snapshot-runner-lock-test-design.md` の候補 ID `CANDIDATE-U-SNAPLOCK-001`〜`032` (022 と 030 は退役) が固定する (本書の規則を主に検証するのは 005〜007、014〜021、023〜025、031、032)。

# snapshot runner の lock の取得の手順と記録の読み取り — 関数設計 (issue #1665)

## 1. 位置付け

本体から、方式の中心である 2 つの責務を分けた。本体の §5 と §7 は本書の §2 と §3 を指す 1 行だけを持つ。本書の中の「本体 §n」は本体の節、「§n」は本書の節である。I1〜I12 は本体 §11 の不変条件を指す。lock の範囲・置き場 (本体 §4)、待ち方と順番 (本体 §6)、入れ子と CI (本体 §8)、終了コードと出力 (本体 §9)、型と DbC (本体 §11) は本体に残る。

方式は r2 の review (本体 §15) で改めた。世代ファイルを**連続する番号で作り、一度作ったら消しも置き換えもしない**。現在の世代は**決まった名前を前へたどって**求め、一覧 (readdir) を排他の判定に使わない。整理 (古い世代の削除) と、link の後の一覧による検証は持たない。

## 2. 世代ファイルによる取得と解放

### 2.1 現在の世代

世代ファイルは `gen-1.json`, `gen-2.json`, … の連続した番号で、在る番号は常に `1..M` の切れ目の無い範囲である (§2.3 の補題 1)。**現在の世代**は在る番号の最大 `M` で、次の **walk** で求める。

1. 開始の番号 `s` を決める。同じ取得の中で前に在ると確かめた番号があれば、その最大を `s` とする (既知の番号)。無ければ hint (§2.4) を読み、`gen-<h>.json` が在ると確かめられたら `s = h`、`gen-<h>.json` が `ENOENT` なら `s = 1` とする (hint 自体が無い・読めない・壊れているときも `s = 1`)。`gen-<h>.json` の読み取りが `ENOENT` 以外で失敗したときは、世代ファイルの読み取りの失敗として §3.1 の R2 に従う。
2. `gen-<s>.json` から番号を 1 つずつ増やしながら、決まった名前で読む。最初に `ENOENT` (§3.1 の R1) になった番号を `n` とすると、`M = n − 1` である (`s = 1` で `gen-1.json` が無ければ世代は「なし」)。
3. 読めた世代ファイルは、作った後に変わらないので、読んだ内容をそのまま使ってよい。

現在の世代の状態は次の 4 つで、判定の順序と読み取りの失敗の扱いは §3 が正本である。

| 状態 | 条件 |
|---|---|
| なし | `gen-1.json` が無い |
| 空き (`free`) | `released-<M>` が在る (決まった名前で確かめる。世代ファイルの中身は分類に使わない) |
| 生存 (`live`) | `released-<M>` が無く、記録が読めて、§3 の分類が `live` |
| 古い (`stale`) | `released-<M>` が無く、記録が読めて、§3 の分類が `stale` |

### 2.2 取得の手順 (acquire モード、本体 §8)

1. 自分の identity (`{ pid, startToken }`) を観測する。`startToken` が文字列で得られなければ、queue にも世代ファイルにも書かずに `unavailable` (exit 3) で終える。
2. 待つ場合 (上限が正) は `queue/<lockId>.json` を書く (本体 §4 の公開の規則)。
3. 次を繰り返す: walk (§2.1) で現在の世代 `M` とその状態を求め、待っている者を §3 で読んで分類し、`decideSnapshotLockStep` (本体 §6) で次の行動を決める。
4. 行動が `attempt` (世代番号 `M + 1`、世代が無ければ 1) なら、記録を `tmp/<lockId>.json` に全て書いて閉じ、`link(tmp/<lockId>.json, gen-<M+1>.json)` を試す。
   - 成功すれば、世代 `M + 1` の holder である。**検証のための一覧はしない**。
   - `EEXIST` なら、別の者がその番号を先に作った。`gen-<M+1>.json` を既知の番号に加えて 3 へ戻る (walk はそこから続く)。**読まずに先の番号を試すことはしない**。
   - それ以外の失敗は `unavailable` で終える。
   - どの場合も `tmp/<lockId>.json` は消す (消せなくても続ける)。
5. holder になったら自分の queue entry を消し、hint に自分の世代番号を書いて (§2.4。どちらも失敗しても続ける)、run を始める。

**世代 `n + 1` への link を試してよいのは、同じ取得の中で `gen-<n>.json` を読み、世代 `n` を `free` か `stale` と判定した後だけである** (`n = 0` は `gen-1.json` が無いと読んだ後)。hint の値や一覧から番号を推して link することはしない (I3)。

### 2.3 安全性の論証 (停止時間と一覧に依らない)

**前提** (時刻・待ち時間・停止の長さ・一覧の完全性を使わない):

- A1 (link の排他): 同じ local の fs の上で、同じ名前への link は、在るなら `EEXIST` で失敗して在るものを変えず、無いなら 1 者だけが成功する (本体 §2 実測 4。Linux の `link(2)` も同じ)。network fs は範囲外 (本体 §4)。
- A2 (不変): `gen-*.json` と `released-*` は、作った後に誰も消さず、rename せず、書き換えない (runner はそうしない。I2。人や他の tool による変更は契約の外、本体 §4)。
- A3 (完全な公開): 記録は tmp に書き切って閉じてから link で公開するので、在る世代ファイルは最初から完全である (本体 §4)。
- A4 (死の判定): §3.2 で `stale` とするのは、記録の process がもう居ないと観測した場合だけである (`kill(pid, 0)` の `ESRCH`、port が「その pid の process は無い」と答えた、startToken が違う)。identity の port は同じ process に生きている間ずっと同じ startToken を返す。`process.kill(pid, 0)` が成功しても同じ process である証明にはならないので、それだけで `live` 以外を導かない (同じ pid の別 process かどうかは startToken でだけ判定する)。

**補題 1 (切れ目が無い)**: `gen-<n+1>.json` は `gen-<n>.json` を読んだ後にだけ作られ (§2.2 の最後の段落)、A2 により `gen-<n>.json` は消えない。よって在る番号は常に `1..M` で、`M` は時間とともに減らない。

**補題 2 (古い link は失敗する)**: 取得者 A が世代 `n` を読んで判定し、止まっている間に `gen-<n+1>.json` が作られていれば、A2 によりそれは消えないので、A の `link(…, gen-<n+1>.json)` は A1 により `EEXIST` で失敗する。

**不変条件 S**: どの時点でも、「世代 `g` の link に成功し、`released-<g>` を作っておらず、生きている process」は高々 1 つである。

**論証**: 世代 `k` の holder を `H_k` とする (A1 により各番号の holder は高々 1 人)。`H_{k+1}` が link に成功したのは、`gen-<k>.json` を読み、世代 `k` を `free` (`released-<k>` が在る) か `stale` (`H_k` が死んでいる、A4) と判定した後である。A2 により `released-<k>` は消えず、死んだ process は生き返らないので、この判定は link の時点でも、その後もずっと成り立つ。よって `H_{k+1}` が holder になった時点で `H_k` は解放済みか死んでおり、帰納法により `H_1 … H_k` も同じである。生きていて解放していない holder は、最大の番号の holder だけである。この論証は、判定から link までの間にどれだけ止まっても、何世代が進んでも変わらない (進んでいれば補題 2 で link が失敗する)。

**止まる・死ぬ位置ごとの扱い** (どの段でも任意の時間止まりうる):

| 位置 | 何が起きるか |
|---|---|
| walk の途中 | 読んだ世代ファイルは変わらない (A2)。止まっている間に世代が進んでも、次の link が補題 2 で `EEXIST` になり、walk が続きから進む |
| 判定の後、link の前 (r2 の反例: 世代 1 を `free` と読んで止まり、その間に世代 2〜100 が進む) | `gen-2.json` は在り続けるので、A の link は `EEXIST`。A は世代 2 から walk を続け、世代 100 が `live` なら待つ。一覧の取りこぼしは結論に関わらない (一覧を使わない) |
| link の後 | A は holder。他者は A の記録 (生きた pid) を `live` と判定して待つ |
| 死ぬ (どの段でも) | link の前なら何も残らない (`tmp/` の残骸は状態に使わない)。link の後なら A の世代が `stale` になり、次の者が `M + 1` を作る |
| pid の再利用 | 死んだ holder の pid を別の process が使っても、identity を観測して startToken が違えば `stale` (K3)。観測するまでは `live` で、安全側 (待つ) に倒れる |
| hint が古い・低い・壊れている | hint は walk の開始点に過ぎず、link の根拠にならない (§2.2 の最後の段落)。誤った hint は walk の長さか fallback を変えるだけである |

**使わない基本操作**: `rename` は在る target を黙って置き換える (本体 §2 実測 4) ので、世代ファイルの作成に使わない。`open(…, "wx")` (`O_EXCL`) も排他的だが、作った直後の空のファイルが他者に見え、壊れた記録と区別できないので使わない。`mkdir` は排他的だが中身を持てない。一覧 (readdir) は、途中で作られた・消されたファイルを含むかどうかが決まっていないので、排他の判定に使わない (使うのは待っている者の一覧だけで、それは順番のための公平さの情報である、本体 §6)。

### 2.4 解放・履歴・hint

**解放**: 世代 `g` の holder は、run (cleanup を含む) が終わった後に `released-<g>` を排他的に作る (中身は使わない)。**他の世代の印を作らず、どのファイルも消さず rename もしない**。作るのに失敗したら (`EEXIST` を除く) `snapshot-lock: release-failed reason=<code>` の行を出し、例外を投げず、run の終了コードを変えない。印が無くても、holder が終了すれば記録は `stale` になり、次の者が置き換える。

**履歴は消さない**: 整理 (古い世代の削除) を持たない。1 回の run ごとに `gen-<g>.json` (数百 byte) と `released-<g>` (空) の 2 つが増え、上限なく残る。消すと補題 2 が崩れる (消えた番号への古い link が成功し、生きている holder と同時に走る。r1 と r2 の FLAG がこの形だった)。**稼働中の整理を後から足してはならない**。履歴を詰める (compaction) 必要が出たら、全ての runner が止まっていることを前提にした別の契約として扱い、本書の範囲外とする。

**walk の費用と hint**: hint が無いと、walk は `gen-1.json` から `M` 個のファイルを読む。1 日 100 run なら 1 年で約 36,500 個で、1 回の walk が重くなる。これを抑えるため、lock dir に助言の **hint** ファイル (`hint`、中身は 10 進の世代番号) を置く。

- holder は取得の後に、自分の世代番号を `tmp/` に書いて `hint` へ rename する (置き換えてよい。失敗は無視する)。
- 読む側は、`hint` を 1 以上の整数として読めて、かつ `gen-<h>.json` が在るときだけ、そこから walk を始める。`hint` が無い・読めない (どの code でも)・数として解釈できない・`gen-<h>.json` が無い (大きすぎる) ときは、`gen-1.json` から始める。
- hint は lock の記録ではない。古くて小さい値でもよく (walk が長くなるだけ)、排他の判定にも link の根拠にも使わない。hint の読み書きの失敗は `unavailable` にしない (§3.3)。
- 待っている者は、2 回目以降の walk を前回の `M` (既知の番号) から始めるので、hint を読み直さない。

## 3. 記録の読み取りと古い claim の判定

### 3.1 記録の読み取り (`interpretSnapshotLockRead`)

世代ファイルと queue entry の読み取りの結果を、次の 3 つと「読めた」に分ける。判定は上の行から順に行い、最初に当てはまった行で決まる。

| # | 読み取りの結果 | 区分 | 現在の世代の記録 (walk の中) | 待っている者の記録 |
|---|---|---|---|---|
| R0 | (読む前) `released-<M>` が在る | — | 世代 `M` の記録は分類に使わず `free` | — |
| R1 | 読み取りが `ENOENT` で失敗した | `absent` | まだ在ると確かめていない番号なら、walk の終わり (§2.1)。**既知の番号** (同じ取得の中で在ると確かめた番号) なら、A2 が破られているので `unavailable` (`reason=generation_missing`) | その者は去ったので数えない |
| R2 | 読み取りが `ENOENT` 以外の code で失敗した (`EACCES` / `EPERM` / `EIO` / `EBUSY` など。code が無ければ `UNKNOWN`) | `unavailable` | **holder を置き換えず** `unavailable` (exit 3、`reason=<code>`) で終える | 同じく `unavailable` で終える |
| R3 | 読めたが壊れている (JSON として解釈できない、`schema` が 1 でない、`lockId` が空でない文字列でない、`runner.pid` が正の整数でない、`runner.startToken` が空でない文字列でない) | `unavailable` | `unavailable` (`reason=malformed`) で終える | 同じく `unavailable` で終える |
| R4 | 読めて、R3 に当たらない | 読めた | §3.2 で分類する | §3.2 で分類する |

- 読めない記録・壊れた記録を `stale` にしない。holder が生きていて、その記録だけが一時的に読めない (権限、ウイルス対策の lock、媒体の障害) 場合に置き換えると、2 本が同時に走るからである。壊れた記録は 本体 §4 の公開の規則の下では生じないので、自動の回収はせず、`reason=malformed` と `lock=<dir>` を出して人に知らせる。
- walk の途中の世代 (`M` より前) の記録は、R2 / R3 に当たれば同じく `unavailable` で終える (読めないものを読み飛ばして先へ進まない)。
- `released-<M>` の確かめは、`ENOENT` なら「無い」、それ以外の失敗は R2 と同じく `unavailable` である。
- hint は記録ではないので、この表の対象外である (§2.4)。

### 3.2 生存の分類 (`classifySnapshotLockClaim`)

`classifySnapshotLockClaim(record, presence, observed) => "live" | "stale"`。入力の記録は §3.1 の R4 (読めた) だけである。**時刻を入力に持たない** (#1460 の「生きている holder を経過時間で回収する」誤りを型の段階で作らない)。

| # | 条件 | 結果 |
|---|---|---|
| K1 | `presence` が `false` (`kill(pid, 0)` が `ESRCH`) | `stale` |
| K2 | 観測が `null` (port がその pid の process は無いと答えた) | `stale` |
| K3 | 観測が identity で、その `startToken` が文字列かつ記録の `startToken` と違う (pid の再利用) | `stale` |
| K4 | それ以外 (観測が一致、観測が `"query_failed"`、今回は観測していない、観測の startToken が `null`、`presence` が `"unknown"`) | `live` |

- `presenceFromKill(code)`: 例外なしは `true`、`EPERM` は `true` (在るが触れない)、`ESRCH` は `false`、それ以外は `"unknown"`。`true` は「その pid の process が在る」だけを意味し、記録の process と同じかどうかは K3 でだけ判定する (§2.3 の A4)。
- 観測の失敗を `stale` にしないので、観測が失敗し続ける間は holder を回収しない。その間の待ちは上限で打ち切られる。これは「生きている holder を誤って回収する」より安全な側の誤りである。
- 記録に非 null の startToken を必須にしたので (§2.2 手順 1)、pid が再利用されても、次に identity を観測した時点 (最長 300 秒後) で K3 により回収できる。この時間は回収の遅れであり、安全性 (§2.3) には関わらない。

### 3.3 失敗の扱いの一覧 (正本)

| 操作 | 失敗の扱い |
|---|---|
| 自分の identity の観測 | `unavailable` (§2.2 手順 1) |
| lock dir と `queue/` / `tmp/` の作成、`tmp/` への書き込み、queue entry の rename | `unavailable` |
| 世代ファイル・queue entry の読み取り | §3.1 の R1〜R3 |
| `released-<M>` の確かめ | `ENOENT` は「無い」。それ以外は `unavailable` |
| `queue/` の一覧 (待っている者を数える) | `unavailable` |
| 世代ファイルへの link | `EEXIST` は手順 3 へ戻る。それ以外は `unavailable` |
| `released-<g>` の作成 (解放) | `release-failed` の行を出し、終了コードを変えない (§2.4) |
| hint の読み取り・書き込み | 無視する (読めなければ `gen-1.json` から walk する)。hint は排他の判定に使わない |
| unlink (tmp、自分の queue entry、stale の待っている者) | 無視する。どれも排他の判定に使う記録ではない。世代ファイルと `released-*` は unlink しない |
