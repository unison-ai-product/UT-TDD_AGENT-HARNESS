---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_snapshot_runner_lifecycle
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-10-19
issue: 1129
---

> **L6 contract marker**: 本書は snapshot runner (`scripts/run-vitest-snapshot.ts`) の**プロセス寿命**の契約である。判定は `src/runtime/snapshot-run-lease.ts` の純関数 (`classifyLiveness` / `decideParentWatch` / `planSweep`) が持ち、OS への問い合わせ (プロセス表の取得・kill) は port 越しに注入する。DbC は §8 にまとめる。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§snapshot runner の寿命) に置き、詳細 (`CANDIDATE-U-SNAPLC-001`〜) は専用の `docs/test-design/harness/L7-snapshot-runner-lifecycle-test-design.md` が固定する。

> **状態**: 本書は **未実装の目標契約** である (issue #1129、親 #1141)。§1 の「現状」は 2026-10-19 時点の実測で、§2 以降の「目標」はまだ実装されていない。実装は §9 の順に別 PR で入れる。実装 PR は本書の方式を変えない (方式変更が要るなら PR を止めて本書の改訂へ戻る)。

# snapshot runner の寿命 — 関数設計 (issue #1129)

## 1. 目的と現状実測

subagent (または親 shell) が終わった後も、その配下で起動された `node scripts/run-vitest-snapshot.ts` の full suite が親を失ったまま動き続け、tinypool worker が十数本・最大 470MB・CPU 数十分を消費した (2026-10-19、#1104 の Green 担当 subagent。2026-10-05 にも同じ事故があり、メモリにだけ記録されて仕組みになっていなかった)。目的は、**親の喪失で runner と配下の木が止まり、runner 自身が殺された場合も残骸が安全に回収される**ことを機械で保証することである。

| # | 実測 | 測定 |
|---|---|---|
| 1 | runner の全 stage (git clone / `npm ci` / `db rebuild` / vitest) は `spawnSync(stdio: "inherit")` の逐次実行である。vitest stage 中、runner の event loop は塞がっており、同一プロセスの timer による親監視は動かない | `scripts/run-vitest-snapshot.ts` の `run()` と `runSnapshotTests()` |
| 2 | cleanup は `try/finally` のみで、runner が SIGKILL / `TerminateProcess` されると tmp (`ut-tdd-vitest-<pid>-<ts>` ほか 2 本) も worker も残る | 同 `finally` 節 |
| 3 | プロセス木を殺す helper は無い。`src/` と `scripts/` に `taskkill` も `process.kill(-pgid)` も無く、あるのは生存確認の `process.kill(pid, 0)` だけ (`src/doctor/singleton-lock.ts`) | `grep -rn "taskkill\|process.kill\|detached" src scripts` |
| 4 | `agent-slots` の slot は pid を持たず、SubagentStop payload も終了 subagent の slot_id / pid を持たない。release は FIFO 近似 (count-exact / identity-approximate) である | `docs/design/harness/L6-function-design/agent-slots.md` §2.3 `releaseOldestGuardSlot` |
| 5 | **Windows では、親が死んでも子孫の `ParentProcessId` は死んだ親の pid のまま残り、子孫は生き続ける** (`detached: true` で起動した 親→子→孫 で親を `taskkill /F` した後、子と孫が生存し、孫の ParentProcessId は子、子の ParentProcessId は死んだ親の pid のままだった)。生き残った子の pid に `taskkill /PID <子> /T /F` を実行すると子と孫が止まった | 使い捨て node スクリプトを `Get-CimInstance Win32_Process` で観測 (2026-10-19、Windows 11 / node v24.13.0) |
| 6 | 同じ実験で、`detached` を付けない子は親の `taskkill /F` と同時に消えた。これはエージェントの実行環境が job で包んでいるためで、**素の子孫の生存を再現するには `detached: true` で起動する fixture が要る** (oracle の前提) | 同上 |
| 7 | `taskkill /PID <死んだ pid>` は「見つかりません」で失敗する。死んだ runner の pid を起点に `/T` で木を辿ることはできない。出力は OS の表示言語で変わる (実測は日本語) ので、文面は解析しない | 同上 |

つまり、(a) runner が生きている間の親喪失は runner が自分で気づければ止められる (§3)。(b) runner が先に死んだ場合は、生き残った子孫を**記録した子の identity から**辿るしかない (§4)。(c) 実測 4 のとおり、SubagentStop 側から「どの subagent の runner か」は決められないので、誤爆を避けるには所有の根拠を lease に持つ必要がある。

## 2. 方式 (採用)

**B + C**。B = runner 自身の親喪失検知と木の停止、C = lease による所有の記録と、死んだ runner の残骸の回収 (sweeper)。

- **責務の置き場所**
  - `scripts/run-vitest-snapshot.ts`: 薄い orchestration。stage を**非同期 spawn** で逐次実行し、lease の書き込みと親監視を配線する。判定を持たない。
  - `src/runtime/snapshot-run-lease.ts` (実装 PR で新設): lease の型、identity の型、純関数の判定 (`classifyLiveness` / `decideParentWatch` / `planSweep`)。I/O を持たない。
  - `src/runtime/process-port.ts` (実装 PR で新設): `observeProcesses()` と `killTree()` の OS 別実装 (§5)。Windows と POSIX の差はここに閉じ込める。
  - SubagentStop hook (`src/cli.ts hook subagent-stop`): sweeper を呼ぶだけ (§4.3)。subagent との相関は取らない。
- **runtime に依らない**: 寿命の管理は runner が持つので、Claude / Codex のどちらが起動しても同じ。hook は救済の追加の入口にすぎない。

## 3. 生きている runner の寿命規則 (B)

1. **起動前の準備**: runner は重い stage を始める前に、(i) 自分と直接の親の identity を取得し、(ii) lease を書き (§4.1)、(iii) sweeper を 1 回走らせる (§4.2)。(i)(ii) のどれかが成立しなければ重い stage を始めず、`lifecycle_unavailable` で終了する (fail-close)。
2. **identity**: `ProcessIdentity = { pid: number; startToken: string }`。`startToken` は OS が与える開始時刻を表す不透明な文字列で、**等価比較だけに使う** (Windows は CIM `CreationDate` の FILETIME、Linux は `/proc/<pid>/stat` の starttime、その他の POSIX は `LC_ALL=C ps -o lstart=` の原文)。pid の再利用は「同じ pid で startToken が違う」ことで検出する。
3. **親の定義**: 親 = 起動時の `process.ppid`。runner は `UT_TDD_SNAPSHOT_PARENT_POLL_MS` (既定 2000) ごとに親の liveness を観測する。stage の child は非同期 `spawn` で動かし、event loop を塞がない (実測 1 の是正)。
4. **判定 (`decideParentWatch`)**: 観測が `dead` (pid が無い、または同じ pid で startToken が違う) なら `stop_parent_lost`。`alive` なら `continue`。`unknown` (観測の失敗) は、`consecutiveUnknown` (今回の観測を含む連続 unknown 回数) が `MAX_CONSECUTIVE_UNKNOWN` (15) 未満なら `continue` で、3 のときだけ診断行 (`snapshot-lifecycle parent-liveness-unknown`) を 1 回出す。**15 回連続して観測できないときは fail-close で `stop_parent_unobservable`** とし、§3.5 の停止手順を `stop_parent_lost` と同じに実行する (親が生きているか分からないまま重い run を無期限に続けない)。1 回の観測 (Windows は PowerShell) はタイムアウト 5 秒・再試行なしとする。**1 回の unknown を dead とみなして殺さない**。
5. **`stop_parent_lost` の手順** (順序は固定): ① 新しい stage を起動しない (以後の stage はスキップする)。② 現在の stage の child の木を止める (§5)。③ 木が消えたことを再観測で確かめる。④ 既存の cleanup (reference の unseal と 3 つの root の削除) を実行する。⑤ lease を削除する (④ と ③ が成功したときだけ。失敗したら lease を残し、次の sweeper に委ねる)。⑥ 終了コード `75` (`EXIT_PARENT_LOST`) で終了する。**runner は自分自身に tree kill を掛けない** (掛けると ④⑤ が走らない)。
6. **回収の期限 (B、条件付き)**: 保証するのは**観測に成功し続ける場合だけ**で、親の死から `PARENT_POLL_MS` (2 秒) + 観測 5 秒 + 木の停止 (猶予 5 秒、POSIX は SIGTERM→猶予後 SIGKILL) = 約 12 秒以内である。観測が失敗し続ける場合は、最悪でも `MAX_CONSECUTIVE_UNKNOWN` × (`PARENT_POLL_MS` + 観測 5 秒) = 105 秒の後に `stop_parent_unobservable` で停止を始め、さらに停止猶予 5 秒を足した時間で打ち切る。親の死と観測不能が重なっても、この上限を超えて続けない。
7. **正常終了と失敗**: 従来どおり (stage の終了コードを伝え、cleanup は `finishSnapshotCleanup` の規則のまま)。lease は cleanup の成功後に削除する。

## 4. lease と sweeper (C)

### 4.1 lease

- 置き場: `join(tmpdir(), "ut-tdd-vitest-leases")/<runId>.json`。`runId` は起動ごとのランダム値 (pid 名から導かない)。tmp の root 名 (`ut-tdd-vitest-<pid>-<ts>` 等) は従来のまま。
- 内容 (`SnapshotLease`): `{ schema: 1, runId, runner: ProcessIdentity, owner: ProcessIdentity, roots: string[], stage: { name: string; child: ProcessIdentity & { pgid?: number } } | null, createdAt }`。`roots` は snapshot / reference / cache の 3 つの絶対パス。
- 更新: stage の child を spawn した直後に `stage` を更新し、stage の終了で `null` にする。書き込みは「一時ファイルへ書いて rename」の原子的な置換にする。
- 起動時に lease を書けない場合は §3.1 のとおり fail-close。

### 4.2 sweeper (`planSweep` + 実行)

入力は lease の一覧、プロセス表 (または `query_failed`)、tmp root。判定規則:

| # | 規則 | 結果 |
|---|---|---|
| S1 | プロセス表が取れない (`query_failed`) | 何も kill せず何も削除しない。全 lease を `skipped: query_failed` で報告する |
| S2 | `runner` が `alive` (同 pid で同 startToken) | 触らない (`skipped: runner_alive`)。B が担当する |
| S3 | `runner` が `dead` | stale。残骸の回収に進む (owner の生死は見ない。runner が死んだ run は誰も結果を読めず、cleanup も誰も実行しないため) |
| S4 | stale lease の `stage.child` が `alive` で startToken 一致 | child と、その子孫 (Windows は ParentProcessId の連鎖、POSIX は同じ pgid) を victim にする。child の pid は child が生きている間は再利用されないので、連鎖は本物である |
| S5 | `stage.child` が `dead` (不在、または同 pid で startToken 違い) | **孫・group の生存者を victim にしない** (`skipped: identity_unproven`)。記録した child が連続して存在していたことを、古い lease と現在のプロセス表だけでは証明できない (child の死亡 → 同 pid の別プロセスの起動 → その子の起動、という履歴や、元の group の全滅 → 同じ pgid の新 group、という履歴が、現在の表では本物の孫・group と区別できない)。ただし child が死んでいる run には証明できる生存部分が無いので、S7 の root 削除と S8 の lease 削除は行う |
| S6 | identity を証明できない (startToken を取得できない、Windows で順序が決まらない 等) | victim にしない (`skipped: identity_unproven`) |
| S7 | 回収後の root 削除 | lease の `roots` に載っていて、かつ tmp root 直下で名前が `ut-tdd-vitest-(head-\|cache-)?\d+-\d+` に一致するものだけ。リンクは辿らない。削除に失敗したら lease を残す |
| S8 | victim の終了を再観測で確認でき、root が消えた | lease を削除する。それ以外は残す |

型 (実装 PR で `snapshot-run-lease.ts` に置く。ここで形を固定する):

```ts
export interface ProcessIdentity { pid: number; startToken: string | null }   // null = 取得できなかった
export interface ProcessEntry extends ProcessIdentity {
  ppid: number;
  pgid: number | null;         // POSIX のみ。Windows は null
  startOrder: number | null;   // Windows の FILETIME (順序比較用)。POSIX は null
}
export type Liveness = "alive" | "dead" | "unknown";
export type ProcessObservation = ProcessIdentity | null | "query_failed";
export function classifyLiveness(recorded: ProcessIdentity, observed: ProcessObservation): Liveness;
export function decideParentWatch(
  input: { owner: ProcessIdentity; observed: ProcessObservation; consecutiveUnknown: number },
): { action: "continue" | "stop_parent_lost" | "stop_parent_unobservable"; emitUnknownDiagnostic: boolean };
export function planSweep(
  input: { leases: SnapshotLease[]; table: ProcessEntry[] | "query_failed"; tmpRoot: string; platform: "win32" | "posix" },
): { kill: ProcessIdentity[]; removePaths: string[]; skipped: { runId: string; reason: SweepSkipReason }[]; reapedRunIds: string[] };
export type SweepSkipReason = "query_failed" | "runner_alive" | "identity_unproven";
```

`startToken` が `null` の identity は常に `unknown` / `identity_unproven` に倒れる (証明できないものは kill しない)。`kill` と `removePaths` と `reapedRunIds` は決定的な順 (pid 昇順 / path の辞書順 / runId の辞書順) で返す。

sweeper は例外を投げない (never throws)。結果は `{ reaped: runId[]; skipped: {runId, reason}[]; killed: ProcessIdentity[]; removed: string[] }` で、runner と hook は 1 行に要約して出す。

### 4.3 呼び出し点

- runner の起動時 (§3.1、必須)。
- SubagentStop hook (別 PR、§9): `planSweep` が `runner_alive` の lease には触れないので、**終了した subagent の runner かどうかを判定する必要がない** (実測 4 の相関不能を迂回する)。hook は 3 秒で打ち切り、失敗は握りつぶさず 1 行の診断を出して続行する (fail-open。hook を止めない)。
- 回収の期限 (C): 次の runner 起動または次の SubagentStop まで。**期限は保証しない**。「runner の kill 後、次の起動を待たず一定時間内に回収する」ことが AC になったときは、方式 D (§7) を別契約で追加する。

## 5. OS 別の差

| 項目 | Windows | POSIX |
|---|---|---|
| プロセス表 | `Get-CimInstance Win32_Process` の `ProcessId` / `ParentProcessId` / `CreationDate` (PowerShell。sweeper の表取得はタイムアウト 10 秒・1 回再試行、親の liveness の観測は 5 秒・再試行なし) | Linux は `/proc`、その他は `LC_ALL=C ps -A -o pid=,ppid=,pgid=,lstart=` |
| child の起動 | `detached: false` (木は `ParentProcessId` で辿る) | `detached: true` で child を自分の process group の長にする (`pgid == child.pid`) |
| 木の停止 | `taskkill /PID <child> /T /F`。**判定は終了コードと再観測で行い、出力は解析しない** (表示言語依存、実測 7)。runner 自身の pid には使わない | `kill(-pgid, SIGTERM)` → 猶予後 `kill(-pgid, SIGKILL)` |
| runner 死亡後の孫 | `ParentProcessId` が死んだ pid のまま残る (実測 5)。ただし S5 のとおり、child が死んだ後の孫は**所有を証明できないので回収しない** | init に re-parent されるので ppid は辿れない。leader (child) が生存して token 一致のときだけ pgid で辿る。leader が死んだ group は回収しない |
| 親喪失の挙動 (素の状態) | 子孫は生き続ける | 子孫は生き続ける (SIGHUP は端末の無い実行では来ない) |
| 限界 | 照合と `taskkill` の間の競合が残る (child の生存と token は §4.2 S4 の判定時点のもの) | pgid を離脱して setsid した子孫は辿れない。child の死後に残った group は回収されない |

どちらの OS でも、Job Object のような「親が死ねば OS が子孫を殺す」仕組みは使えない (Node に API が無く、PowerShell 経由の job は PowerShell と一緒に死ぬ)。

## 6. 失敗時の方針 (fail-close / fail-open)

| 場面 | 方針 |
|---|---|
| 起動時に lease を書けない、親または自分の identity を取れない | **fail-close**: 重い stage を始めず `lifecycle_unavailable` で終了。警告だけで続行しない (続行すると今回の事故の条件を作る) |
| 実行中、親が `dead` と確認できた | **fail-close**: 手順 §3.5 で止める |
| 実行中、親の liveness が `unknown` | `MAX_CONSECUTIVE_UNKNOWN` (15) 未満は **fail-open** (続行し診断を残す。1 回の不明を死亡扱いしない)。15 回連続したら **fail-close** (`stop_parent_unobservable`、§3.5 の手順、終了コード 75) |
| sweeper がプロセス表を取れない / identity を証明できない | **fail-open で何もしない**: kill も削除もせず、`skipped` に理由を残す |
| sweeper 自体の失敗 (例外) | never throws。runner 起動は止めない (診断を 1 行出す) |
| 木の停止後も生存者が残る | lease を残して終了コード 75。次の sweeper が再試行する |

## 7. 退けた案

| 案 | 内容 | 退けた理由 |
|---|---|---|
| A | SubagentStop hook だけで子孫を回収する | 終了 subagent の pid / slot_id を payload が持たず (実測 4)、他 lane の runner を殺す誤爆を避けられない。Claude 専用で Codex に効かない。本案では「所有の根拠は lease、hook は救済の入口」に降格した |
| D | detached の watchdog プロセスが runner と親の両方を監視する | runner の kill 後も一定時間内に回収できる利点はあるが、watchdog 自身の寿命管理 (watchdog を誰が見張るか) が増え、最小実装原則に反する。「次の起動を待たない回収」が AC になったときに別契約で追加する |
| E | OS の job / 子孫の自動 kill (Job Object) | Node 標準にも本リポジトリの依存にも API が無く、native module を持ち込むと Node authority sealed の方針と衝突する。PowerShell 経由の job は PowerShell と共に終わる |
| F | runner が pid だけを lease に持ち、pid の一致で kill する | pid は再利用される。advisor の指摘どおり、記録した pid を信用すると他のプロセスを殺す。startToken による identity を必須にした |
| G | 全 stage を `spawnSync` のまま、別 thread で親を監視する | `spawnSync` は呼び出しスレッドを塞ぐだけで worker thread は動くが、子の木を止める責務が同一プロセスの外に出て、停止後の cleanup の順序 (§3.5) を保証できない。非同期 spawn のほうが線が少ない |

## 8. DbC と不変条件

| 区分 | 内容 |
|---|---|
| 事前 | `classifyLiveness(recorded, observed)`: `observed` は `ProcessIdentity` / `null` (不在) / `"query_failed"` のいずれか。`decideParentWatch` の `consecutiveUnknown` は 0 以上の整数 |
| 事後 | `classifyLiveness`: 不在、または同 pid で startToken 違いは `dead`、同 pid・同 startToken は `alive`、`query_failed` は `unknown`。`planSweep`: `kill` に載る identity は必ず §4.2 の S4 / S5 を満たす。`removePaths` は S7 を満たす |
| I1 | identity (pid + startToken) を証明できないプロセスを kill しない (名前・コマンド文字列・pid だけの一致では kill しない) |
| I2 | 1 回の `unknown` は `dead` ではなく、kill も削除も起こさない。連続 `MAX_CONSECUTIVE_UNKNOWN` 回の unknown だけが自分の run の停止 (`stop_parent_unobservable`) を起こし、他のプロセスの kill には繋がらない |
| I3 | `stop_parent_lost` の後に新しい stage を spawn しない |
| I4 | lease を削除するのは、木の消滅を再観測で確認し、root の削除に成功した後だけ |
| I5 | 生きている runner の lease・root・child に sweeper は触れない (S2) |
| I6 | runner は自分自身に tree kill を掛けない。終了は cleanup の後の `process.exit` である |
| I7 | 判定関数 (`classifyLiveness` / `decideParentWatch` / `planSweep`) は純粋で、OS・時刻・環境変数を読まない |
| I8 | 外部コマンドの出力文面を解析しない (終了コードと再観測だけを使う) |
| I9 | kill の根拠は「記録した identity が現在まで連続して生存している」ことだけで、現在の表の ppid / pgid / 開始時刻の整合は根拠にならない。連続生存を証明できない子孫・group は回収しない (S5、S6) |

## 9. 実装 PR の順序 (1 PR = 1 論点)

1. **契約 PR (本 PR)**: 本書 + `L7-snapshot-runner-lifecycle-test-design.md` + 純関数分の候補 Red (`it.fails`)。`src/` と `scripts/` を変えない。実プロセスの oracle (013〜017・020) は**候補のまま**で、テストも昇格もここでは行わない。
2. **実プロセスの Red 追加 (src/ を含まない)**: 013〜017・020 の `it.fails` を `CANDIDATE-U-SNAPLC-*` の引用で追加する。
3. **昇格 (src/ を含まない)**: 引用の揃った候補 (全件) を正式 ID `U-SNAPLC-*` へ昇格し、テスト名の引用を書き換える。正式宣言を citation より先に作らない (`oracle-test-trace` と設計保護 gate §10.2 / §10.3)。
4. **Green 1**: `src/runtime/snapshot-run-lease.ts` の純関数 + `process-port.ts` (Windows / POSIX) + その単体テスト。
5. **Green 2**: runner の非同期化・lease 書き込み・親監視・§3.5 の停止手順 (実プロセスの oracle `CANDIDATE-U-SNAPLC-013`〜)。
6. **Green 3**: SubagentStop hook からの sweeper 呼び出し。

各 Green PR は `it.fails` を `it` に戻す最小実装で、Refactor commit または「Refactor なし (理由)」を PR 本文に書く。

## 10. advisor の相談結果と実測による検証 (2026-10-19)

相談: `ut-tdd advisor --decision implementation --current-model claude-sonnet-5-5 --execute` → `gpt-6.1-sol` (exit 0)。

| advisor の判断 | 扱い |
|---|---|
| B + C を推奨。A は所有者特定の根拠にしない。D は「次の起動を待たない回収」が AC のときだけ | **採用** (§2、§7) |
| lease に pid を記録するだけでは安全でない (pid 再利用) | **採用**: identity = pid + startToken (§3.2、I1) |
| 木の停止順序: 新規 spawn を止める → 木を止める → 消滅を確認 → 一時領域を削除 → 終了。自分自身に `taskkill /T /F` しない | **採用** (§3.5、I6) |
| fail-open / fail-close: 死亡が確認できたら fail-close、不明は fail-open、起動時に監視を準備できなければ fail-close、ownership を証明できない sweeper は何もしない | **採用** (§6) |
| 「`taskkill /T` は runner 死亡後の任意の孤児を確実に列挙する仕組みではない」 | **採用 (実測で補強)**: 死んだ runner の pid を起点にはできない (実測 7)。生き残った**子の pid** からなら Windows では `/T` で木を止められる (実測 5) が、それは child が**連続して生存し token が一致するとき**に限る。Sol r1 の指摘で、child 死亡後の孫・group は pid / pgid の再利用と区別できないため S5 で回収しないことにした |
| 不足する証拠: ① Claude / Codex 各経路の直接の親の寿命 ② Windows の creation time の取得方法 ③ runner 強制終了後の tinypool の実際の木 ④ 回収期限 | ② は `Get-CimInstance Win32_Process` の `CreationDate` で取得できることを実測 (実測 5)。④ は §3.6 (B) と §4.3 (C) で分けて定義。① ③ は未確定で §11 に残す |

## 11. 未確定事項 (Green PR で実測する)

- ① 直接の親が短命な wrapper (例: shell を起動して即終了する起動経路) の場合、正常な実行が `parent_lost` になる。Green 2 で Claude の Bash 経路・Codex の GUI lane 経路での `process.ppid` の寿命を実測し、必要なら親の定義を改訂する (本書の方式は変えず、§3.3 の親の定義だけを改訂する)。
- ③ runner を強制終了した後の tinypool worker の実際の木。Green 1 の実プロセス oracle で `detached: true` の fixture を使って確認する。
- PowerShell の起動コストが高い環境での `lifecycle_unavailable` の頻度。Green 2 でタイムアウト値を実測して固定する。
