---
title: "PLAN revision digest query の L7 対テスト設計"
artifact_type: test_design
layer: L7
executed_at_layer: L7
status: draft
pair_artifact: docs/plans/PLAN-L7-722-plan-revision-digest-query.md
parent_doc: docs/plans/PLAN-L7-722-plan-revision-digest-query.md
created: 2026-09-28
updated: 2026-09-28
---

# PLAN revision digest query の対テスト設計

対応 PLAN: `docs/plans/PLAN-L7-722-plan-revision-digest-query.md`。Issue #722。現時点は docs-only candidate freeze であり、以下の oracle は未実行。正式 PLAN admission は control lane が接合する。

## 1. 共通 fixture

既存 ledger の正規 writer を test setup だけで使って独立した一時 DB を作る。alias A に asset X、revision 1/2 の異なる canonical payload を記録し、別 alias B/asset Y を用意する。期待 digest は fixture payload から独立に SHA-256 を計算する。production query 自身に writer を呼ばせない。破損を作る SQL は test setup に限定し、main harness.db を使わない。

書込みゼロの fixture は rollback journal と WAL の両方を用意する。WAL は sidecar (`-wal` / `-shm`) が無い開始状態と、writer の commit が checkpoint 前で live sidecar がある状態を分ける。rollback はさらに hot journal (spill 途中の DB と `-journal` の複製) と、別 connection が EXCLUSIVE lock を保持する状態を用意する。Node `DatabaseSync(..., { readOnly: true })` だけでは WAL DB の読取りで `-wal` / `-shm` が生成・変更される (実測) ため、接続フラグを write-0 の証拠にしない。

観測は query 呼出しの直前と、query が返って connection が close された直後の 2 点で行う。観測値は DB 親 directory の全 entry の sorted listing、各 file の SHA-256・size・mtime、directory 自身の mtime とする。mtime だけでは判定しない (live WAL 下で `-shm` の bytes が変わっても mtime が変わらない実測がある)。接続中・SELECT 中の連続観測 (watcher / polling) は行わない。書いて戻す変異は mtime と SHA-256 の変化で検出する。

外部 writer の変更との区別: fixture 準備の writer は観測開始前に close する。外部 writer が lock を保持する fixture (EXCLUSIVE lock、snapshot barrier) では filesystem 差分を判定に使わず、query の戻り値と、writer 終了後の DB bytes が writer 自身の commit だけで説明できることで判定する。

## 2. 候補 oracle

| ID | 入力・単独変異 | 期待・判別軸 |
|---|---|---|
| CANDIDATE-U-PRDQ-001A (PR-1 受入) | A/X/revision 1、続いて revision 2。Node API (`readPlanRevisionCanonicalPayloadDigest`) だけを同じ fixture へ呼ぶ | exact tuple と各 payload の独立 digest が一致。revision 1 で latest を返す変異を検出 |
| CANDIDATE-U-PRDQ-001C (PR-2 受入) | 001A と同じ fixture。CLI `plan revision-digest` を subprocess で呼ぶ | CLI の標準出力が 001A の API 値と exact 一致。PR-1 では対象外 (CLI 未実装で Red は PR-2 の Red commit に置く) |
| CANDIDATE-U-PRDQ-002 | alias 欠落/別 alias、A と Y の組合せ、複数有効 alias の破損を別々に与える | invalid_input または alias_binding_mismatch。破損 ledger は integrity deny。digest 無し。alias/asset guard 除去を正常 ledger 上の mismatch で検出 |
| CANDIDATE-U-PRDQ-003 | revision 0/負数/非整数、X に無い番号、Y にだけある番号を別々に与える | invalid_input または revision_not_found。latest/他 asset への fallback を検出 |
| CANDIDATE-U-PRDQ-004 | canonical payload bytes/保存 digest、plan_alias_events の event_digest、plan_draft_journal_events の sequence/previous_event_digest を各々単独変異 | ledger_integrity_mismatch。selector は正常に維持し、検証呼出し除去を検出。row digest 以外の chain 軸では row digest を再計算し、chain 検査自身を観測する |
| CANDIDATE-U-PRDQ-005 | DB 不在・schema 非対応・open 不可・破損 DB | ledger_unavailable または ledger_integrity_mismatch。DB 作成/migration/rehydration/repair に逃げない |
| CANDIDATE-U-PRDQ-006 | Node API で次を各々実行: (O1) rollback・sidecar 無しの成功 query、(O2) WAL・sidecar 無し、(O3) WAL・live sidecar、(O4) hot journal、(O5) 別 connection が EXCLUSIVE lock を保持、(O6) O1 と同 fixture で write probe (§2.3)、(O8) snapshot barrier (§2.1)、(O9) 20,000 revision fixture の性能、(O10) busy_timeout 値 (§2.4)、(O11) 試行回数 (§2.5)。CLI subprocess では (O7) O1 / O2 を再実行する | O1: 成功、観測値が前後で完全一致し `-journal` / `-wal` / `-shm` が生じない。O2 / O3: `ledger_unavailable`、観測値不変 (O3 は `-shm` の SHA-256 不変)。O4: `ledger_unavailable`、DB と `-journal` の bytes 不変。O5: 上限 500 ms 以内に `ledger_unavailable` を返す (§2.2)。O6: 書込み可能 open 変異は filesystem 差分を生まない場合がある (SELECT / PRAGMA / BEGIN / COMMIT だけの query は書込み可能な connection でも何も書かない) ので、観測差分では判定しない。代わりに、検証完了直後の test 専用 hook に write probe (`tryWrite()`: query の connection 上で `CREATE TABLE ut_tdd_ro_probe(x INTEGER)` を試み、errcode を返す) を渡し、errcode 8 (SQLITE_READONLY) を要求する。`readOnly: true` と `mode=ro` の両方を除去した変異では probe が成功 (errcode 0) し、決定的に Red になる。片方だけの除去では errcode 8 のままなので kill を要求しない (実測: 両方 / readOnly のみ / mode=ro のみ = 8、どちらも無し = 0。`issue722/fix1/measure-fix1.mjs`)。probe は production 経路では未設定の hook からだけ呼ばれ、公開 API に connection を出さない。O8: §2.1。O9: 1 回 5 秒以内かつ RSS 増分 256MB 以内。O10: query の connection の実効 `busy_timeout` が 0 (§2.4)。O11: busy 中の open がちょうど 1 回で、最初の失敗操作後に再実行が無い (§2.5)。gate 除去は O2 / O3、`immutable=1` 置換は O3 (値を返す)、`busy_timeout` / retry 追加のうち 500 ms 以上待つものは O5 で、500 ms 未満の短い待機・retry は O10 / O11 で独立に検出する。DML / DDL / migration / receipt / PLAN write は 0 |
| CANDIDATE-U-PRDQ-007A (PR-1 受入) | API の成功・失敗値を検査 | DTO の exact key set。DB/statement/row/capability/SQL 詳細を返さない。失敗値では digest を返さない |
| CANDIDATE-U-PRDQ-007C (PR-2 受入) | CLI の成功・失敗値を検査し、不正値では exit 1 を期待 | 成功だけ exit 0、失敗は exit 1 で digest を出力しない。CLI 出力も 007A と同じ key set に限り内部詳細を出さない。PR-1 では対象外 |

### 2.1 snapshot barrier (CANDIDATE-U-PRDQ-006 O8)

query の test 専用 hook (検証完了直後に 1 回呼ばれる callback。production 経路では未設定) を使う。

1. query が `BEGIN` して既存検証を終える (reader は SHARED を保持し、snapshot が確定している)。
2. hook の中で別 process の writer を起動する。writer は fixture 初期化を持たない専用 entry とし、`busy_timeout` を barrier と selector の所要時間より十分長く (例: 30 秒) 取る。writer は `BEGIN IMMEDIATE` → 対象 revision row の UPDATE → 同期通知 A (`fs.writeSync` で「commit 直前」を出力) → `COMMIT` の順に進む。
3. 同期 A の受信後、独立の probe connection (read-only open) で `SELECT count(*) FROM sqlite_master` を短い間隔で繰り返し、errcode 5 (SQLITE_BUSY) を観測するまで待つ (同期 B、上限 5 秒)。rollback journal では、writer が `COMMIT` で PENDING lock を取ると新規の SHARED が拒否されるので、同期 B は「reader が snapshot を保持したまま writer が commit を試み PENDING で待っている」ことの観測になる。上限内に観測できなければ barrier timeout として Red にする。
4. hook から戻り、query が同じ connection で selector を実行し、`COMMIT` / close する。
5. **reader の close 後にだけ** writer の終了を待つ。reader は読むだけで追加の lock を要求せず、writer は PENDING のまま busy handler で待つので、reader close で writer の EXCLUSIVE 取得と commit が進む (deadlock しない)。
6. 期待: 同期 B を観測し、selector の値が検証済み snapshot の値 (更新前) と一致し、writer が exit 0 で終了し、終了後の DB では当該 row が更新されている。
7. 変異「selector を別 connection で実行する」: PENDING 中の新規 SHARED は拒否されるので、selector は必ず errcode 5 になり 6 と一致しない。変異「検証を transaction 外へ移す」: reader が SHARED を保持しないので writer は待たずに commit し、同期 B が timeout するか、selector が更新後の値または busy を返し、いずれも 6 と一致しない。
8. 決定性の実測: scratch fixture で各 40 回を実行し、正実装は 40/40 Green、上記 2 変異は各 40/40 Red だった (`issue722/fix1/measure-fix1.mjs`、Node v24.13.0、Windows)。

### 2.2 O5 即時性の上限

- **上限**: 500 ms (固定値。fixture の件数に依存させない)。
- **計時区間**: 開始 = 別 connection が EXCLUSIVE lock を取得し保持が確認できた直後、API 呼出しの直前 (`performance.now()`)。終了 = API が戻り値を返した時点 (内部で connection が close されるまでを含む)。lock holder は計時区間の全体と、その後 5 秒以上 (retry / `busy_timeout` が働けば区間を超えて待てる長さ) 保持する。fixture 準備と初回の module load は計時に含めない (測定前に O1 相当の warm-up 呼出しを 1 回行う)。
- **失敗条件**: (a) 経過時間が 500 ms 以上、または (b) 戻り値が `{ ok: false, reason: "ledger_unavailable" }` でない、のいずれか。判定は単発の wall-clock 1 回ではなく 3 回連続で実測し、3 回とも 500 ms 未満を Green とする (1 回でも超えたら Red。平均で隠さない)。
- **導出 (実装の引用)**: PR #761 の head `c2e7462420784817fb0e8a3542f8aadc694d024b` で、`src/plan-asset/ledger/plan-revision-digest-query.ts` は `openReadOnlyHarnessDb(databasePath, { repoRoot })` で開き、`src/state-db/index.ts` の `openNativeReadOnly` は `new DatabaseSync(path, { readOnly: true })` で、`timeout` option も `PRAGMA busy_timeout` も設定しない。ledger query 経路 (`plan-revision-digest-query.ts` / `src/plan-asset/ledger/schema.ts`) に `busy_timeout` / retry の記述は 0 件。同 head の repo 内で他の経路が設定している値は `src/execution/sqlite-forward-escape-journal.ts:148` の `PRAGMA busy_timeout = 5000`、`src/runtime/cutover-transition.ts:464` と `src/runtime/node-slice-admission.ts:492` の `PRAGMA busy_timeout=1000` である。変異として持ち込まれ得る最小の先例は 1000 ms なので、上限はその半分の 500 ms とした。ロック競合時に待たない正実装は fixture の open / close だけで返るので 500 ms に対し十分な余裕があり、Windows CI の file system jitter (数十 ms 級) でも誤 Red になりにくい。
- **検出できる変異**: `busy_timeout` ≥ 500 ms の追加、合計待機が 500 ms 以上になる retry / sleep 追加。500 ms 未満の待機・retry (例: 100 ms の 1 回 retry) は本 oracle (wall-clock) では検出できないため、PLAN-L7-722 の「`busy_timeout` を設定せず retry しない」規則は独立の O10 (§2.4、timeout 値) と O11 (§2.5、試行回数) で falsify する。本 oracle は 500 ms の即時性だけを担い、短い retry を許容する意味ではない。
- **未確定事項 (open question)**: (1) 500 ms は repo 先例の 1000 ms からの導出であり、Windows CI での実測分布は未取得。実装 PR の Red→Green 時に O5 の実測値 (3 回) を PR に記録し、必要なら control lane が契約改訂で上限を調整する。(2) `node:sqlite` `DatabaseSync` の既定 `timeout` は実測で 0 (`new DatabaseSync(p, { readOnly: true })` 後の `PRAGMA busy_timeout` が `timeout: 0`、`{ timeout: 100 }` 指定時は 100。Node v24.13.0)。これを O10 の期待値 0 の根拠とする。

### 2.3 write probe (CANDIDATE-U-PRDQ-006 O6)

§2.1 と同じ検証完了直後の hook に `tryWrite()` を渡す。`tryWrite()` は query 自身の connection で `CREATE TABLE ut_tdd_ro_probe(x INTEGER)` を実行し、成功なら 0、失敗なら SQLite errcode を返す。temp table (`CREATE TEMP TABLE`) は read-only connection でも成功するので使わない。期待は errcode 8。hook 未設定時 (production) は probe を実行しない。書込み可能 open 変異では probe が成功して fixture に table が増えるが、fixture は test ごとに作り直すので他の oracle に影響しない。

### 2.4 busy_timeout 値 (CANDIDATE-U-PRDQ-006 O10、PR-1)

PLAN-L7-722 の「`busy_timeout` を設定しない」を、wall-clock に依らず値で falsify する。

- **seam (新規 production module / seam 不要)**: Vitest で `src/state-db/index.ts` の export `openReadOnlyHarnessDb` に call-through spy を置く (先例: `tests/release-consumer-setup-artifacts.test.ts:202` 以降)。spy は実関数を呼び、返った実 connection を透過的に包む。包む対象は `beginReadTransaction` / `commitReadTransaction` / `userVersion` / `prepare` / `close` の全てである。`userVersion` は `src/state-db/index.ts:157-161` で `native.prepare('PRAGMA user_version').get()` を直接呼び、返却 wrapper の `prepare` を通らない。`prepare` だけの spy は最初の busy 操作を見逃すので、`userVersion` の透過 wrap は必須とする。
- **fixture path の確認**: spy は open の第 1 引数が test fixture の ledger DB パスであることを assert する (別 DB を開く経路を測らない)。
- **観測**: 実 `close()` の直前に、実 connection で `PRAGMA busy_timeout` を読み `timeout` 列を記録する。open 直後ではなく close 直前に読むので、open 後に `PRAGMA busy_timeout = N` を発行する変異も観測できる。この probe の `PRAGMA` は spy の下位 (実 connection への直接呼出し) で行い、O11 の試行回数には**数えない**。
- **fixture**: O1 と同じ成功 fixture と、O5 と同じ lock 競合 fixture の両方で実行する。
- **期待**: 両方で記録値が `0`。
- **検出する変異**: `new DatabaseSync(path, { readOnly: true, timeout: N })` (N > 0、100 ms を含む)、`PRAGMA busy_timeout = N` の発行。いずれも記録値が N となり Red。
- **補足**: 既定が 0 であることは別 in-memory `DatabaseSync` の診断 (Node v24.13.0、`{timeout:0}`) であり、既定値の根拠にとどまる。実 query connection の値は本 oracle が実測する。

### 2.5 試行回数 (CANDIDATE-U-PRDQ-006 O11、PR-1)

PLAN-L7-722 の「retry しない」を、待機時間に依らず試行回数で falsify する。O5 のテスト (`tests/plan-revision-digest-query.test.ts:425-451`) は EXCLUSIVE lock 下の 1 回呼出しの 500 ms 判定であり、query の既存 `testHook` は schema 読取り後に呼ばれて lock 下では到達しないため、retry oracle には使えない。

- **seam**: §2.4 と同じ spy。
- **1 attempt の定義 (凍結)**: query 層の 1 attempt = `openReadOnlyHarnessDb` への 1 回の呼出し。同一 connection 上の個々の操作 (`beginReadTransaction` / `userVersion` / `prepare` / statement 実行) は、その attempt の内訳として別個にも数える。spy 自身の `PRAGMA busy_timeout` probe は production の attempt に含めない。
- **fixture**: O5 と同じ lock 競合 (別 connection が EXCLUSIVE を保持)。
- **期待**: API は `{ ok: false, reason: "ledger_unavailable" }` を返し、`openReadOnlyHarnessDb` がちょうど 1 回。さらに最初に busy となる操作 (lock 競合下では `beginReadTransaction` または `userVersion`) の失敗後に、同じ種別の操作が再実行されない (種別ごとの呼出し回数が各 1 以下で、`beginReadTransaction` + `userVersion` + `prepare` の合計が、最初の失敗操作より後に増えない)。
- **検出する変異**: 100 ms 待っての open 全体の retry (open 回数 2)、`BEGIN` / `userVersion` / statement の失敗を捕捉しての loop (種別ごとの回数が 2 以上)。O5 の 500 ms 上限内に収まっても Red。
- **限界**: `node:sqlite` adapter 内部の再試行は外側の呼出し回数からは見えない。query 層で検出できる retry とは区別し、adapter 内部の待機は O10 の `timeout` 値 0 だけが担う。

## 3. 実行規律

実装前に Red を単独 commit に残し、Node canonical snapshot で対象テストを実行する。正規 U への昇格は Green 後、PLAN revision と同じ control transaction の証跡に接合する。変異検証は変更 tree を直接対象にし、HEAD を捕捉する snapshot runner で mutant を無視して Green としない。

### 3.1 PR-2 実装済み CLI oracle

以下は `tests/plan-revision-digest-query.test.ts` の CLI subprocess oracle であり、API 単体の U-PRDQ-001A / 007A とは別の検証である。候補全体を一括昇格せず、実装済みケースが覆う枝だけを対応づける。

| 正式 U | 実装済みケースと検査 | 対応する候補範囲 |
|---|---|---|
| U-PRDQ-008 | O7/O1 成功 fixture で既存 API の exact DTO と CLI JSON を比較し、成功 key set、exit 0、filesystem/sidecar 不変を確認 | CANDIDATE-U-PRDQ-001C、CANDIDATE-U-PRDQ-006 O7/O1、CANDIDATE-U-PRDQ-007C の成功枝 |
| U-PRDQ-009 | O7/O2 WAL fixture で `ledger_unavailable` の exact API DTO と CLI JSON、失敗 key set、exit 1、digest 不在、filesystem 不変を確認 | CANDIDATE-U-PRDQ-006 O7/O2、CANDIDATE-U-PRDQ-007C の失敗枝 |
| U-PRDQ-010 | CLI revision 0 を既存 API に委譲し、`invalid_input` の exact DTO、exit 1、digest 不在を確認 | CANDIDATE-U-PRDQ-007C の不正値枝 |

この対応は上記3ケースの範囲に限り、候補の他の selector、破損状態、CLI 入力枝を実装済みとは主張しない。

## 4. 非対象

#692 の manual bind/FSM/cutoff/IssueProjected、#681 の launcher 修理、GitHub 実在確認、DB の修復・初期化、新たな ledger 正本。gate と open の間の TOCTOU の検出 (PLAN-L7-722 §4.2 の残余リスク。本 test-design は解消を主張しない)。
