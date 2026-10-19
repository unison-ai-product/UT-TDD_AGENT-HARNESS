---
title: "L7 snapshot runner lifecycle test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-19
pair_artifact: docs/design/harness/L6-function-design/snapshot-runner-lifecycle.md
---

# snapshot runner の寿命 テスト設計 (issue #1129)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/snapshot-runner-lifecycle.md` である (**未実装の目標契約**)。
本書はその §3 生きている runner の寿命規則、§4 lease と sweeper、§5 OS 別の差、§6 fail-close / fail-open、§8 の DbC と不変条件を検証する oracle を定める。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引 (§snapshot runner の寿命) だけを置き、本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-SNAPLC-*`) だけを宣言する。工程は次のとおり。

1. **契約 PR (本 PR)**: 候補 oracle の宣言と、純関数の候補 Red (`it.fails`、001〜012・018・019・021) を `tests/snapshot-runner-lifecycle.test.ts` に入れる。実プロセスの oracle (013〜017・020) は**候補のまま**で、テストも昇格もここでは行わない (`src/` と `scripts/` を変えない契約 PR では、実プロセス fixture を要する検証を Red にできない)。
2. **実プロセスの Red 追加 (src/ を含まない)**: 013〜017・020 の `it.fails` を `CANDIDATE-U-SNAPLC-*` の引用で追加する。開発 repo を読む場合は `test-repository-isolation` の登録行をこの PR の `src/` 変更として入れる。
3. **昇格 (src/ を含まない)**: 引用の揃った候補 (全件) の正式 ID `U-SNAPLC-*` への昇格と、テスト名の引用の書き換えを同じ PR で入れる。正式宣言を citation より先に作らない (`oracle-test-trace`、設計保護 gate §10.2 / §10.3)。
4. **実装 PR (L6 §9 の 4〜6)**: `it.fails` を `it` に戻して Green にする。実装 PR は `docs/test-design/` を変えない。

**Red の読み方 (弱い Red であることの明示)**: 本 PR の時点では対象 module (`src/runtime/snapshot-run-lease.ts`) が存在せず、動的 import の失敗が `it.fails` を通す。これは個々の guard が Red である証拠ではない。実装 PR は候補ごとに mutation probe (対象の規則を 1 つ外して落ちること) を取ってから `it` に戻す。

## 2. fixture

- 001〜012・018・019・021 は純関数 (`classifyLiveness` / `decideParentWatch` / `planSweep`) と、port を stub した `killTree` 呼び出し規則のテストで、ファイルシステム・環境変数・時刻・実プロセスを使わない。入力は L6 §4.2 の型 (`ProcessEntry` / `SnapshotLease`) を手で組み、最小の完備 fixture を基準に 1 点だけ壊す。
- 013〜017・020 は実プロセスの oracle で、`detached: true` で起動した `親 → 子 → 孫` の fixture を使う (L6 §1 実測 6: `detached` を付けない子は実行環境の job で親と一緒に消えるので、生存の oracle にならない)。Windows と POSIX の両方で実行し、OS に無い面は skip ではなく OS 別の期待値を持つ。判定は `Get-CimInstance Win32_Process` / `ps` の再観測で行い、コマンド出力の文面は読まない。
- 実プロセスの oracle は自分が起動した fixture の pid だけを kill する。終了時に必ず後始末する (残した fixture は本 issue が扱う事故そのものである)。

## 3. 候補 oracle

| ID | 入力 | 期待 | 殺す mutant |
|---|---|---|---|
| `CANDIDATE-U-SNAPLC-001` | `classifyLiveness` に (a) 同 pid・同 startToken、(b) 観測 null (不在)、(c) 同 pid・別 startToken、(d) `"query_failed"`、(e) recorded の startToken が null | (a) `alive`、(b)(c) `dead`、(d)(e) `unknown` (L6 §8 事後) | pid だけで alive 判定する (pid 再利用で他プロセスを alive 扱い) / query 失敗を dead にする |
| `CANDIDATE-U-SNAPLC-002` | `decideParentWatch` に (a) 観測が dead、(b) alive、(c) unknown を `consecutiveUnknown` 1 / 2 / 3 / 10 で | (a) `stop_parent_lost`、(b) `continue`、(c) 常に `continue`。`emitUnknownDiagnostic` は unknown かつ `consecutiveUnknown` が 3 のときだけ true (L6 §3.4、I2) | 1 回の unknown を停止にする / 診断を毎回出す |
| `CANDIDATE-U-SNAPLC-003` | `planSweep` に `table: "query_failed"` と stale に見える lease 2 件 | `kill` と `removePaths` と `reapedRunIds` が空で、2 件とも `skipped: query_failed` (L6 S1) | 取得失敗でも lease だけで kill / 削除に進む |
| `CANDIDATE-U-SNAPLC-004` | runner が alive (同 pid・同 token) の lease。child も alive で子孫あり、`roots` は tmp 配下で実在形 | `kill` 空・`removePaths` 空・`skipped: runner_alive` (L6 S2、I5) | 生きている runner の木や root を回収する (他 lane の誤爆) |
| `CANDIDATE-U-SNAPLC-005` | runner が dead、owner は alive。stage.child が alive で token 一致、子孫が ppid 連鎖 (win32) で 2 段、無関係なプロセス 1 件 | `kill` は child と子孫 2 件だけ (pid 昇順)。無関係なプロセスと owner は含まれない。`reapedRunIds` に当該 runId (L6 S3・S4、I1) | owner が alive だと回収を止める / 連鎖の外を巻き込む |
| `CANDIDATE-U-SNAPLC-006` | runner が dead。stage.child の pid が**別の生きたプロセス** (別 token) に占有されている | その占有者を `kill` に含めない。lease は `skipped: identity_unproven` (L6 S6、F の退けた理由) | 記録した pid をそのまま kill する |
| `CANDIDATE-U-SNAPLC-007` | win32。runner dead で stage.child が dead。次の 3 履歴を現在のプロセス表で表す: (a) child.pid が空きで、`ppid == child.pid`・`startOrder` が child 以後の孫が生存、(b) child.pid を別 token の別プロセスが占有し、孫の startOrder が占有者より前、(c) 同じで孫が占有者より後、(d) 孫の startOrder が child より前 | (a)〜(d) すべて `kill` が空で `skipped: identity_unproven`。lease の古さと現在の表の整合から所有を導かない。root は削除対象に残り lease は回収済みとして扱う (L6 S5、I9)。Sol r1 の反例 (child 死亡 → 同 pid の別プロセス起動 → その子起動 → 別プロセス死亡) は (a) と同じ表になるので (a) が反例そのもの | 順序・占有の整合で孫を victim にする (pid 再利用で無関係な子を kill する) |
| `CANDIDATE-U-SNAPLC-008` | posix。(a) stage.child (leader) が alive で token 一致、同じ `pgid` の生存者 2 件と別 pgid の生存者 1 件、(b) leader が dead で同じ pgid の生存者が 2 件 (元の group が全滅して同じ pgid の新 group ができた履歴と区別できない) | (a) leader と同じ pgid の 2 件だけが `kill` (pid 昇順、別 pgid は含まれない)、(b) `kill` 空・`skipped: identity_unproven` (L6 S4・S5、I9) | pgid だけで選ぶ / leader の死後に残った group を古い lease から kill する |
| `CANDIDATE-U-SNAPLC-009` | stage.child または孫の `startToken` が null (取得不能) | その identity は `kill` に入らず `skipped: identity_unproven` (L6 S6、I1) | token が無いものを pid 一致で kill する |
| `CANDIDATE-U-SNAPLC-010` | lease の `roots` に (a) tmp 配下で名前が規則に一致するもの、(b) tmp の外、(c) tmp 直下だが名前が規則外、(d) tmp 配下だがさらに深い path、(e) `..` を含む path | `removePaths` に入るのは (a) だけ (L6 S7) | root の検証を省き任意の path を削除する |
| `CANDIDATE-U-SNAPLC-011` | 順序を入れ替えた同じ入力 (leases・table) を 2 回 | 2 回の結果が deep equal で、`kill` は pid 昇順、`removePaths` と `reapedRunIds` は辞書順 (L6 §4.2 型、I7) | 入力順や時刻・環境に依存する |
| `CANDIDATE-U-SNAPLC-012` | table に `node` / `vitest` という名前・コマンド文字列を持つが lease の child とも子孫とも pgid も無関係なプロセスを多数入れる | どれも `kill` に入らない (L6 I1)。名前を入力に持つ型でもない (`ProcessEntry` は名前を持たない) | 名前・コマンド文字列で victim を選ぶ |
| `CANDIDATE-U-SNAPLC-013` (実プロセス) | `detached` fixture の 親→子→孫 で、runner 役の fixture が親 (ppid) の死を観測する。親を kill する | 親の観測に成功し続ける条件で、親の死から約 12 秒 (`PARENT_POLL_MS` + 観測 5 秒 + 停止猶予 5 秒) 以内に、子・孫が消え、tmp root と lease が消え、終了コードが 75 (L6 §3.5・3.6 の条件付き期限) | 親監視が event loop の外で動かない (spawnSync のまま) / 木の一部が残る |
| `CANDIDATE-U-SNAPLC-014` (実プロセス) | runner 役の fixture を強制終了 (POSIX: SIGKILL、Windows: `taskkill /F`) し、別の lane の生きた fixture runner がもう 1 本ある状態で次の runner 起動 (sweeper) | 強制終了した run の子孫と root と lease が回収され、別 lane の生きた runner の木・root・lease は無傷 (L6 §4.2、I5) | sweeper が他 lane を巻き込む / hard kill の残骸を放置する |
| `CANDIDATE-U-SNAPLC-015` (実プロセス) | stage の切り替わり (child の終了直後・次 child の spawn 直前) に親を kill する | 次の stage の child が 1 本も起動されない (L6 §3.5 ①、I3) | 停止判定の前に次の stage を spawn する |
| `CANDIDATE-U-SNAPLC-016` (実プロセス) | port の観測を `query_failed` にした runner 役の fixture に、親が生きたまま 10 回分の poll を経過させる | 木を止めず終了せず、診断行が 1 回だけ出る (L6 §3.4、I2) | unknown で停止する / 診断が毎回出る |
| `CANDIDATE-U-SNAPLC-017` (実プロセス) | lease の置き場を書き込み不能にした runner 役の fixture | 重い stage を 1 つも起動せず `lifecycle_unavailable` で非 0 終了する (L6 §3.1、§6) | 警告だけで続行する |
| `CANDIDATE-U-SNAPLC-018` | port を stub した停止処理で、runner の pid と child の pid を区別して `killTree` の呼び出しを記録する (win32 / posix) | 呼ばれるのは child (win32) / `-pgid` (posix) だけで、runner 自身の pid は一度も渡されない。終了は cleanup の後 (L6 §3.5、I6) | 自分自身に tree kill を掛け cleanup が走らない |
| `CANDIDATE-U-SNAPLC-019` | stub の `killTree` が (a) 日本語・英語・空の出力で終了コード 0、(b) 出力は成功文だが終了コード非 0、(c) 終了コード 0 だが再観測で生存 | 判定は終了コードと再観測だけで決まる。(a) は成功、(b) は失敗、(c) は生存者あり (lease を残す)。出力の文面は結果に影響しない (L6 I8、I4) | `成功しました` のような文面を解析する |
| `CANDIDATE-U-SNAPLC-020` (実プロセス) | SubagentStop hook から sweeper を呼ぶ入口に、stale な lease と生きた runner の lease を置いて 3 秒の予算で実行 | stale だけを回収し、生きた runner には触れず、予算内に戻る。sweeper が失敗しても hook は 0 を返し診断を 1 行出す (L6 §4.3 fail-open) | hook が subagent との相関を要求する / 失敗で hook を落とす |
| `CANDIDATE-U-SNAPLC-021` | `decideParentWatch` に unknown を `consecutiveUnknown` 14 / 15 / 16 で。さらに 15 回目の観測が dead / alive のとき | 14 は `continue`、15 と 16 は `stop_parent_unobservable`。観測が dead なら回数に関わらず `stop_parent_lost`、alive なら `continue` (L6 §3.4・3.6、I2) | 観測不能が無期限に続く / 15 回未満で停止する / dead より unobservable を優先して判定を取り違える |

## 4. 既存 oracle への影響

既存の oracle の改訂表は無い。runner の既存の oracle (`tests/vitest-snapshot-runner.test.ts`、`tests/windows-ci-single-snapshot.test.ts`) は、stage の順序・cleanup の規則・workflow の構造を扱い、寿命の規則を持たない。Green 2 で stage を非同期化するとき、既存 oracle の期待値 (stage の順序・終了コードの伝搬・`finishSnapshotCleanup` の AggregateError 規則) を変えてはならない。変える必要が出たら契約改訂へ戻る。
