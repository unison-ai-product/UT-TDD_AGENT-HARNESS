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

> **L6 contract marker**: 本書は snapshot runner の排他 (`snapshot-runner-lock.md`、以下「本体」) のうち、**取得・検証・解放の手順とその安全性の論証**、**記録の読み取りと生存の分類と失敗の扱い**の契約である (未実装の目標契約)。純関数 `interpretSnapshotLockRead(read) => SnapshotLockReadResult` と `classifySnapshotLockClaim(record, presence, observed) => ClaimState`、手順 `acquireSnapshotLock(options, deps) => SnapshotLockAcquisition` の型と DbC (I1〜I12) は本体 §11 にある。oracle は本体と同じ `docs/test-design/harness/L7-snapshot-runner-lock-test-design.md` の候補 ID `CANDIDATE-U-SNAPLOCK-001`〜`031` が固定する (本書の規則を主に検証するのは 005〜007、014〜025、030、031)。

# snapshot runner の lock の取得の手順と記録の読み取り — 関数設計 (issue #1665)

## 1. 位置付け

本体から、方式の中心である 2 つの責務を分けた。本体の §5 と §7 は本書の §2 と §3 を指す 1 行だけを持つ。本書の中の「本体 §n」は本体の節、「§n」は本書の節である。I1〜I12 は本体 §11 の不変条件を指す。lock の範囲・置き場 (本体 §4)、待ち方と順番 (本体 §6)、入れ子と CI (本体 §8)、終了コードと出力 (本体 §9)、型と DbC (本体 §11) は本体に残る。

## 2. 世代ファイルによる取得と解放

### 2.1 現在の世代

lock dir の一覧 (readdir) に現れる `gen-<g>.json` の最大の `g` を `m` とし、世代 `m` を**現在の世代**と呼ぶ。現在の世代の状態は次の 4 つで、判定の順序と読み取りの失敗の扱いは §3 が正本である。

| 状態 | 条件 |
|---|---|
| なし | `gen-*.json` が 1 つも無い |
| 空き (`free`) | 一覧に `released-<m>` が在る (世代ファイルを読まない) |
| 生存 (`live`) | `released-<m>` が無く、記録が読めて、§3 の分類が `live` |
| 古い (`stale`) | `released-<m>` が無く、記録が読めて、§3 の分類が `stale` |

### 2.2 取得の手順 (acquire モード、本体 §8)

1. 自分の identity (`{ pid, startToken }`) を観測する。`startToken` が文字列で得られなければ、queue にも世代ファイルにも書かずに `unavailable` (exit 3) で終える。
2. 待つ場合 (上限が正) は `queue/<lockId>.json` を書く (本体 §4 の公開の規則)。
3. 次を繰り返す: lock dir を一覧し、現在の世代と待っている者を §3 で読んで分類し、`decideSnapshotLockStep` (本体 §6) で次の行動を決める。読み取りが `absent` (§3.1) なら、その回の判定を捨てて 3 をやり直す。
4. 行動が `attempt` (世代番号 `n = m + 1`、世代が無ければ `n = 1`) なら、記録を `tmp/<lockId>.json` に全て書いて閉じ、`link(tmp/<lockId>.json, gen-<n>.json)` を試す。`EEXIST` なら別の者が先にその番号を作ったので、3 へ戻る。それ以外の失敗は `unavailable` で終える。どの場合も `tmp/<lockId>.json` は消す (消せなくても続ける)。
5. **検証**: link が成功したら、lock dir をもう一度一覧し、`n` より大きい番号の `gen-<k>.json` が 1 つでも在るかを見る。
   - 在れば、自分は holder ではない (`gen-<n>.json` は、一覧を読んでから link するまでの間に整理で消えた番号を作り直した**孤児**である)。孤児の世代ファイルは消さず、`released-<n>` も作らずに 3 へ戻る。孤児は以後どの判定にも現れず (§2.3 の補題 1)、後の整理で消える。
   - 無ければ、世代 `n` の holder である。
   - 一覧に失敗したら、`released-<n>` を作ってから (作れなくても) `unavailable` で終える。holder だったかどうかを確かめられないので run を始めず、自分の番号は空きにして返す (孤児だった場合も、空きの印は判定に影響しない)。
6. holder になったら自分の queue entry を消し (消せなくても続ける)、§2.4 の整理を行ってから run を始める。

**古い世代は消さない**。`stale` の世代 `m` は、次の世代 `m+1` を作ることで置き換える。

### 2.3 安全性の論証 (停止時間に依らない)

**不変条件 S**: どの時点でも、「世代 `g` を手順 5 で holder と確定し、`released-<g>` を作っておらず、まだ生きている process」は高々 1 つである。

前提は次の 3 つで、時刻・待ち時間・停止の長さを使わない。

- P1 (link の排他): 同じ名前への link は、在るなら `EEXIST` で失敗し、無いなら 1 者だけが成功する (本体 §2 実測 4。Linux の `link(2)` も同じ)。
- P2 (一覧): readdir の 1 回の呼び出しの間ずっと存在するファイルは、その結果に必ず現れる (POSIX の readdir と NTFS の列挙の規則。一覧の途中で作られた・消されたファイルは現れても現れなくてもよい)。
- P3 (`stale` の永続): §3 で `stale` とした holder は既に死んでおり、生き返らない (K1〜K3 はどれも「記録の process はもう居ない」ことの観測である。identity の port は同じ process に対して常に同じ startToken を返す、本体 §11 の前提)。`free` (`released-<g>` が在る) も消えるまで続き、`released-<g>` が消えるのは `gen-<g>.json` と一緒に整理されるときだけである。

**補題 1 (最大の番号は消えない)**: `gen-<k>.json` を消すのは、手順 5 で holder と確定した世代 `g` の holder が `k ≤ g − 32` を整理する場合だけで (I2)、そのとき `gen-<g>.json` が在るので `k` は最大ではない。よって一覧の最大値は時間とともに減らない。

**補題 2 (検証の意味)**: 手順 5 の一覧に `n` より大きい番号が無ければ、link の時点で `n` より大きい番号は在らず、link の直前の最大値はちょうど `m = n − 1` だった。理由: link の時点で `k > n` が在れば、補題 1 によりその後の最大値は `k` 以上で、最大の番号のファイルは一覧の間ずっと在るので P2 により一覧に現れる。また、自分が手順 3 で `m` を読んだ後に最大値は減らない (補題 1) ので、link の直前の最大値は `m` 以上 `n − 1` 以下、すなわち `m` である。

**S の論証**: 新しい holder が生まれるのは、手順 5 の検証を通ったときだけである。補題 2 より、そのとき link の直前の最大値は `m` で、その世代は手順 3 で自分が `free` か `stale` と判定したものである (`live` なら `attempt` しない、本体 §6)。P3 よりその判定は link の時点でも成り立つので、世代 `m` の holder は解放済みか死んでいる。世代 `m` より前の世代の holder は、帰納法により世代 `m` が作られた時点で既に解放済みか死んでいる。よって新しい holder と同時に生きている holder は無い。

**各段で止まった場合** (どの段でも任意の時間止まりうる):

| 止まる・死ぬ位置 | 何が起きるか |
|---|---|
| 一覧の後、link の前 | 判定は P3 により古くならない。その間に番号が進んでいれば、link は `EEXIST` か (番号が整理されていれば) 孤児になり、手順 5 で弾かれる。reviewer の反例 (世代 1 を読んで止まる → 世代 2〜34 が進み、世代 34 の整理で `gen-2` が消える → `gen-2` の link が成功) は、検証で `gen-34` が見えるので holder にならない |
| link の後、検証の前 | 自分の記録 (生きた pid) が最大なら、他者は `live` と判定して待つ。孤児なら最大ではないので他者の判定に現れない |
| 検証の後 (holder) | 他者は `live` と判定して待つ。検証の結果は「link の時点で最大だった」という過去の事実で、その後の停止で崩れない (この点が「取得後の単なる再読」と違う。再読は現在の状態を見るが、検証は補題 1・2 により link の時点の状態を確定させる) |
| 死ぬ (どの段でも) | 最大の世代の記録が死んだ pid を指すので `stale` になり、次の者が置き換える。孤児なら何も起きない。link の前なら何も残らない (`tmp/` の残骸は状態に使わない) |
| 整理の途中 | 整理は最大でない番号だけを消す (補題 1) ので、途中で止まっても不変条件に影響しない |
| pid の再利用 | 死んだ holder の pid を別の process が使っても、identity の観測で startToken が違えば `stale` (K3)。観測するまでは `live` で、安全側 (待つ) に倒れる |

**使わない基本操作**: `rename` は在る target を黙って置き換える (本体 §2 実測 4) ので、世代ファイルの作成に使わない。`open(…, "wx")` (`O_EXCL`) も排他的だが、作った直後の空のファイルが他者に見え、壊れた記録と区別できないので使わない。`mkdir` は排他的だが中身を持てない。doctor の singleton (本体 §2 実測 3) は、早い者を勝ちとする claim の一覧・TTL による回収・読めない claim の回収・fail-open のどれも本書の要件と合わないので流用しない。

### 2.4 解放と整理

解放: 世代 `g` の holder は、run (cleanup を含む) が終わった後に `released-<g>` を排他的に作る。**他の世代の印を作らず、どの世代ファイルも消さず rename もしない**。作るのに失敗したら (`EEXIST` を除く) `snapshot-lock: release-failed reason=<code>` の行を出し、例外を投げず、run の終了コードを変えない。印が無くても、holder が終了すれば記録は `stale` になり、次の者が置き換える。

整理: 手順 5 で holder と確定した世代 `g` の holder は、一覧に現れた `k ≤ g − 32` の `gen-<k>.json` と `released-<k>` を消す (失敗は無視し、run を止めない)。**整理が番号を作り直せる状態にしても安全である**: 消えた番号を誰かが link で作っても、補題 2 によりその者は手順 5 で孤児と判定される。32 は診断のために残す履歴の量であり、排他の安全性はこの値に依らない (1 にしても破れない)。`tmp/` の残骸 (link の前に process が殺された場合) は消さない。状態には使わず、大きさも小さいからである。

## 3. 記録の読み取りと古い claim の判定

### 3.1 記録の読み取り (`interpretSnapshotLockRead`)

世代ファイルと queue entry の読み取りの結果を、次の 3 つと「読めた」に分ける。判定は上の行から順に行い、最初に当てはまった行で決まる。

| # | 読み取りの結果 | 区分 | 現在の世代の記録 | 待っている者の記録 |
|---|---|---|---|---|
| R0 | (読む前) 一覧に `released-<m>` が在る | — | 読まずに `free` | — |
| R1 | 読み取りが `ENOENT` で失敗した (一覧の後に消えた) | `absent` | その回の判定を捨て、§2.2 の手順 3 をやり直す。置き換えも unavailable もしない | その者は去ったので数えない |
| R2 | 読み取りが `ENOENT` 以外の code で失敗した (`EACCES` / `EPERM` / `EIO` / `EBUSY` など。code が無ければ `UNKNOWN`) | `unavailable` | **holder を置き換えず** `unavailable` (exit 3、`reason=<code>`) で終える | 同じく `unavailable` で終える |
| R3 | 読めたが壊れている (JSON として解釈できない、`schema` が 1 でない、`lockId` が空でない文字列でない、`runner.pid` が正の整数でない、`runner.startToken` が空でない文字列でない) | `unavailable` | `unavailable` (`reason=malformed`) で終える | 同じく `unavailable` で終える |
| R4 | 読めて、R3 に当たらない | 読めた | §3.2 で分類する | §3.2 で分類する |

- 読めない記録・壊れた記録を `stale` にしない。holder が生きていて、その記録だけが一時的に読めない (権限、ウイルス対策の lock、媒体の障害) 場合に置き換えると、2 本が同時に走るからである。壊れた記録は 本体 §4 の公開の規則の下では生じないので、自動の回収はせず、`reason=malformed` と `lock=<dir>` を出して人に知らせる。
- `absent` を「読めない」と区別するのは、整理 (§2.4) で正当に消えた番号を、止まっていた者が読もうとする場合があるからである。現在の世代の記録が `absent` でも、それを根拠に次の番号を作らない (もう一度一覧すれば、より大きい最大値が見える。補題 1)。
- lock dir の一覧 (`readdir`) の失敗、lock dir の作成の失敗は、R2 と同じく `unavailable` で終える。

### 3.2 生存の分類 (`classifySnapshotLockClaim`)

`classifySnapshotLockClaim(record, presence, observed) => "live" | "stale"`。入力の記録は §3.1 の R4 (読めた) だけである。**時刻を入力に持たない** (#1460 の「生きている holder を経過時間で回収する」誤りを型の段階で作らない)。

| # | 条件 | 結果 |
|---|---|---|
| K1 | `presence` が `false` (`kill(pid, 0)` が `ESRCH`) | `stale` |
| K2 | 観測が `null` (port がその pid の process は無いと答えた) | `stale` |
| K3 | 観測が identity で、その `startToken` が文字列かつ記録の `startToken` と違う (pid の再利用) | `stale` |
| K4 | それ以外 (観測が一致、観測が `"query_failed"`、今回は観測していない、観測の startToken が `null`、`presence` が `"unknown"`) | `live` |

- `presenceFromKill(code)`: 例外なしは `true`、`EPERM` は `true` (在るが触れない)、`ESRCH` は `false`、それ以外は `"unknown"`。
- 観測の失敗を `stale` にしないので、観測が失敗し続ける間は holder を回収しない。その間の待ちは上限で打ち切られる。これは「生きている holder を誤って回収する」より安全な側の誤りである。
- 記録に非 null の startToken を必須にしたので (§2.2 手順 1)、pid が再利用されても、次に identity を観測した時点 (最長 300 秒後) で K3 により回収できる。この時間は回収の遅れであり、安全性 (§2.3) には関わらない。

### 3.3 失敗の扱いの一覧 (正本)

| 操作 | 失敗の扱い |
|---|---|
| 自分の identity の観測 | `unavailable` (§2.2 手順 1) |
| lock dir と `queue/` / `tmp/` の作成、`tmp/` への書き込み、queue entry の rename | `unavailable` |
| lock dir の一覧 (手順 3 と手順 5) | `unavailable` (手順 5 では `released-<n>` を作ってから) |
| 記録の読み取り | §3.1 の R1〜R3 |
| 世代ファイルへの link | `EEXIST` は手順 3 へ戻る。それ以外は `unavailable` |
| `released-<g>` の作成 (解放) | `release-failed` の行を出し、終了コードを変えない (§2.4) |
| unlink (tmp、自分の queue entry、stale の待っている者、整理) | 無視する。どれも排他の判定に使う記録ではない |
