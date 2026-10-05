---
plan_id: PLAN-L7-722-plan-revision-digest-query
title: "PLAN-L7-722 (add-impl): PLAN revision の canonical_payload_digest を plan
  ledger から書込みゼロで読み出す query 契約"
kind: add-impl
layer: L7
drive: db
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-29
updated: 2026-10-05
owner: Claude control lane (契約 draft) · Codex worker (implementation)
parent_design: docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
backprop_decision: required
backprop_decision_reason: PLAN-L6-71 は plan ledger の正本・migration 契約を定めるが、保存済み
  revision を外部 caller へ読み出す公開 query と read-only open 境界を定義していない (`git show
  origin/main:docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
  | grep -n -i -E "query|read-only|canonical_payload_digest"` が 0 件)。新しい公開契約のため
  PLAN-REVERSE-722 で L6-71 / state-db 不変条件へ逆向き検証する。
pair_artifact: docs/test-design/harness/L7-plan-revision-digest-query-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: Codex worker (Luna) - read-only opener・既存検証の最小抽出・query API を 1 PR =
      1 論点で実装する
  - role: qa
    slot_label: Codex Terra - CANDIDATE-U-PRDQ-001..007 の Red oracle と書込みゼロ mutation
      probe を先に作る
  - role: tl
    slot_label: Claude Opus (非著者) - exact selector・検証再利用・書込みゼロ方式の closing review
generates:
  - artifact_path: docs/plans/PLAN-L7-722-plan-revision-digest-query.md
    artifact_type: markdown_doc
  - artifact_path: src/plan-asset/ledger/plan-revision-digest-query.ts
    artifact_type: source_module
  - artifact_path: tests/plan-revision-digest-query.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-71-plan-asset-canonical-migration-contracts.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-722-plan-revision-digest-query-backfill.md
    - docs/test-design/harness/L7-plan-revision-digest-query-test-design.md
    - docs/plans/PLAN-L7-690-issue-binding-projection-state-contract.md
    - src/plan-asset/ledger/schema.ts
    - src/state-db/index.ts
    - src/plan-admission/node-plan-revision-runner.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/722
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/692
review_evidence:
  - reviewer: Codex Sol (非著者、PR
    review_kind: cross_agent
    worker_model: claude-opus-5
    reviewer_model: gpt-5.6-sol
    verdict: pass
    reviewed_at: 2026-09-29T09:04:29.565Z
    tests_green_at: 2026-09-29T09:02:04Z
    scope: PR
    plan_revision: PLAN-L7-722 r3
    subject_head: c547feac71632130c5f38926735995aecb1b761c
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/722#issuecomment-5887432380
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/36546291932
    green_commands:
      - kind: typecheck
        command: npm run typecheck
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-09-29T09:02:04Z
        evidence_path: tsconfig.json
        output_digest: sha256:da3803fb5e8090f8bf4e48607a8b033c35a574705d52e558245935d2f164cd0c
        anchor_commit: c547feac71632130c5f38926735995aecb1b761c
status: confirmed
github_issue_id: 722
admission_receipt:
  schema_version: v2
  receipt_id: certificate:c8706c35e98920e4d535e0284ef83b00
  command_id: plan-revise:issue-722:pr761-ownership:r4:3e96ba959a14
  admitted_at: 2026-10-05T02:17:03.314Z
  source_digest: sha256:59afaa43cf71d943f135a7f7a0a98a05dfc82026672d1f1e35d3dab77d50075f
  decision_digest: sha256:32b9bc32af4918d9f03ab5d91658cd89afc0f337ffe5bfcb9ab184ca60e6d83e
  receipt_digest: sha256:4ec50b66596021625ef7d97b6b7b5f10a72e3d933d94b9bc3ec5aec8eb954ee7
  binding:
    path: docs/plans/PLAN-L7-722-plan-revision-digest-query.md
    plan_id: PLAN-L7-722-plan-revision-digest-query
    asset_id: plan:d354f79aaae8e1cb50d0b1a77c3ccc76
    revision: 4
    content_digest: sha256:59afaa43cf71d943f135a7f7a0a98a05dfc82026672d1f1e35d3dab77d50075f
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 722
    episode_id: E4-722-plan-revision-digest-query
    projection_state: unprojected
  origin:
    plan_id: PLAN-L6-71-plan-asset-canonical-migration-contracts
    revision: 1
    digest: sha256:00273e7d75e01b678fc97b0602542b6163c68be48026cfa5480a7a736016f3e0
  transition:
    direction: design_to_implementation
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-722-plan-revision-digest-query
    target_revision: 4
    phase: forward_merge
  escape_reason: "PR #761:
    control回答5986928496と既存pair-freeze証跡に基づく新規API/test所有宣言。既存schema/state-dbの所有を\
    重複させず、実装closing PASSは未取得として保持する。"
---

# PLAN-L7-722: PLAN revision digest query (書込みゼロ)

## 1. 目的と境界

Issue #722 は #692 の先行 slice として、#681 後継 PLAN が必要とする「保存済み PLAN revision の
`canonical_payload_digest`」を plan ledger (`.ut-tdd/ledger/harness-ledger.db`、
`src/plan-asset/ledger/schema.ts:1598`) から読み出す口を定める。本 PLAN は docs-only の pair-freeze 契約であり、
実装・Green・非著者 PASS を主張しない。正規 admission は control lane が発行し、本文 frontmatter に手製 receipt を付けない。

plan ledger を単一正本とし、Issue projection・manual bind・FSM・confirm cutoff・PLAN / receipt 発行を混ぜない。
PLAN-L7-690 は draft なので `references` に置き、`requires` にしない。Issue event metadata query (#692) とは別責務である。

## 2. 公開 query

- API: `readPlanRevisionCanonicalPayloadDigest({ alias, assetId, revision })`。DB は内部 adapter に閉じる。
  成功時は immutable DTO `{ ok: true, alias, assetId, revision, canonicalPayloadDigest }` を返す。
- `canonicalPayloadDigest` は検証済み保存値 (lowercase raw 64-hex) に `sha256:` を付けた公開表現とする。
  SQLite 内の raw 表現と公開表現を区別し、manifest の `revision_digest` 規約とは混同しない。
- 失敗は `{ ok: false, reason }` だけを返す。digest・SQL・内部 row・path 以外の DB 詳細を返さない。
- deny reason は次の閉じた集合とする。
  - `invalid_input`: selector 欠落、空 alias / assetId、revision が正整数でない。
  - `alias_binding_mismatch`: exact alias の現在有効な対応が一意でない、または要求 assetId と一致しない。
  - `revision_not_found`: 要求 asset にその revision row が無い。
  - `ledger_unavailable`: DB 不在、非対応 schema version、open 不可、§4 の前提条件違反 (WAL / sidecar / hot journal / lock 競合。lock 競合は待たずに即 deny)。
  - `ledger_integrity_mismatch`: 既存検証が不一致を返した ledger。修復しない。
- CLI `plan revision-digest --alias <alias> --asset-id <assetId> --revision <n> --json` は後続の別 PR
  (§6 PR-2) で配線する。3 selector 必須、成功 exit 0 / 失敗 exit 1、出力は API の DTO と同一である。

## 3. exact binding と既存検証の再利用

1. exact alias の現在有効な対応が一意で、要求 assetId と一致すること。prefix・短縮名の推測、別 asset、曖昧な対応を選ばない。
2. 要求 asset の指定 revision row そのものを返す。歴史 revision も受け付け、latest / nearest へ置換しない。
3. `schemaMatches` / `ledgerRowsValid` (`src/plan-asset/ledger/schema.ts:1131-1207`、現在 private) を、
   `prepare` と `userVersion` だけを要求する狭い read 型 (`Pick<HarnessDb, "prepare" | "userVersion">` 相当) を受ける
   読取専用の共通境界へ最小抽出して呼ぶ。検証ロジックを複製しない。migration 経由で呼ばない。
   両関数が使う文は SELECT と `PRAGMA integrity_check` / `PRAGMA foreign_key_check` / `PRAGMA user_version` だけであり、
   read-only connection で実行できる。
4. `assertAdoptedBase` (`src/plan-admission/node-plan-revision-runner.ts:489`) は active alias / latest row の
   command preflight であり、歴史 revision と全 ledger 検証の代用にしない。
5. 検証と selector 照合は §4 の単一 read transaction 内で同じ connection により行う。別 connection / 別 snapshot の値を混ぜない。
6. raw `HarnessDb`・connection・statement・内部 row・書込み capability を caller へ公開しない。

## 4. 設計判断: 書込みゼロの read-only open 方式 (freeze)

### 前提 (実測)

plan ledger は rollback journal (DELETE) で運用されている。`git grep -n -E "journal_mode" origin/main -- src` の該当は
`src/runtime/cutover-transition.ts:464` だけで、plan-asset / state-db は WAL を設定しない。
scratch fixture による実測 (`scratchpad/issue722/measure-readonly.mjs` / `measure-journal.mjs`、Node v24.13.0、DESIGN-NOTES §2) は次のとおり。

| fixture | M1 `readOnly:true` | M2 URI `mode=ro` | M3 URI `mode=ro&immutable=1` |
|---|---|---|---|
| rollback、sidecar 無し | write 0 | write 0 | write 0 |
| WAL、sidecar 無し | `-wal` 0B と `-shm` 32768B を作る | 同左 | write 0 |
| WAL、live `-wal` 有り | `-shm` bytes が変わる (mtime は不変) | 同左 | WAL を無視し誤読する (`no such table`) |
| rollback、hot journal | - | errcode 776 で拒否、write 0 | 未計測 |
| rollback、並行 writer が EXCLUSIVE | - | errcode 5 (busy) で拒否、write 0 | 未計測 |
| rollback、read txn 中に writer が commit を試みる | - | snapshot は不変、writer 側が busy | - |

### 選択肢

| 案 | 内容 | trade-off |
|---|---|---|
| **(R) 推奨** | rollback 前提の fail-close。open 前に sidecar と header を検査し、`readOnly: true` (正本、`mode=ro` は defense-in-depth。immutable は使わない) で開き、単一 read txn で読む | query 自身の書込み禁止・観測可能な副作用ゼロ・対応形式の制限を別の層として担保する (§4.1)。gate と open の間の TOCTOU は残余リスク (§4.2)。WAL 化された ledger は deny になる (現運用では発生しない) |
| (I) `immutable=1` | lock も sidecar も参照しない | rollback / sidecar 無しでは write 0 だが、live WAL / hot journal / 並行 writer 下で誤読・torn read になる。誤った digest を返すのは deny より悪い |
| (S) temp snapshot copy | DB を一時 dir へ複製して開く | 元 dir には write 0 だが、copy と writer の一貫性が無く (lock を取らない)、一時 dir への書込みが増え、sidecar も複製が必要 |
| (F) readOnly flag 単独 | `DatabaseSync(file,{readOnly:true})` | WAL 下で sidecar を作る / 書き換える (実測)。書込みゼロの証明にならない |
| (C) checkpoint 前提 | WAL を checkpoint させてから読む | checkpoint 自体が書込み。query の責務外 |

### 採択 (R) の手順

1. `assertWithinUtTdd` で path を `.ut-tdd/` 配下に限定する。DB 不在は `ledger_unavailable`。`ensureDir` / DB 作成をしない。
2. 対応形式の gate (open 前): `<db>-wal` か `<db>-shm` が存在すれば `ledger_unavailable` とし、開かない。
3. 対応形式の gate (open 前): DB header 先頭 100 bytes を読取専用 fd で読み、offset 18 / 19 が共に 1 (rollback) でなければ `ledger_unavailable`。
4. `new DatabaseSync(path, { readOnly: true })` で開く。`immutable=1` は使わない。URI `mode=ro` は defense-in-depth として併記してよい (§4.1)。
5. `BEGIN` (deferred) → 既存検証 (最初の read で SHARED lock を取り snapshot が確定する) → selector 照合 → `COMMIT`。`finally` で close する。
6. busy (errcode 5) は **即 deny** (`ledger_unavailable`) とし、`busy_timeout` を設定しない (待機時間・CLI latency・競合時意味論という新契約を増やさないため)。
   hot journal (errcode 776 / SQLITE_READONLY_ROLLBACK) とその他の open / read エラーも `ledger_unavailable`。retry・rollback 実行・修復をしない。
7. 補助 fail-close: close 後に `<db>-wal` / `<db>-shm` の存在を再確認し、存在すれば結果を破棄して `ledger_unavailable` を返す。
   これは transient sidecar を検出できないため TOCTOU の解消ではない (§4.2)。

`-journal` の存否は事前拒否の条件にしない。hot か否かの判定は SQLite の lock 判定に委ね、ro 接続では hot journal を再生できず
errcode 776 で拒否されること、そのとき write 0 であることを実測済みである (DESIGN-NOTES §2 case B)。

### 4.1 保証の 3 層 (混同しない)

| 層 | 何を保証するか | 担い手 | 保証しないこと |
|---|---|---|---|
| (a) query 自身の書込み禁止 | query の connection が DML / DDL / journal 書込みを実行できない | 正本境界は `readOnly: true` (SQLITE_OPEN_READONLY)。URI `mode=ro` は冗長な defense-in-depth | 外部 process の書込み、WAL 下での `-shm` / `-wal` 生成 (実測で (a) だけでは防げない) |
| (b) 観測可能な副作用ゼロ | 外部 writer がいない test 環境で、query の前後に filesystem の差分が無い | test の before / after oracle (§4.3)。production では実行しない | 観測窓の外の transient 変化、並行 writer 下での帰責 |
| (c) 対応形式の制限 | 本 query は WAL の ledger を扱わない | 手順 2 / 3 の sidecar / header gate と手順 7 の補助確認 | gate と open の間の形式変化 (§4.2) |

`readOnly: true` と `mode=ro` は実測でどちらも単独で INSERT を errcode 8 で拒否した (DESIGN-NOTES §2) ため、片方だけを除去する
mutation は原理的に kill できない。**個別除去 mutation は要求せず、両方を除去した書込み可能 open への変異を kill 対象とする** (O6)。
この変異は filesystem 差分を生まない場合がある (読むだけの query は書込み可能な connection でも何も書かない) ので、O6 は観測差分ではなく、
検証完了直後の test 専用 hook から query 自身の connection で `CREATE TABLE ut_tdd_ro_probe(x INTEGER)` を試みる write probe で判定し、
errcode 8 (SQLITE_READONLY) を要求する (実測: 両方 / 片方 = 8、どちらも無し = 0。DESIGN-NOTES fix1)。

### 4.2 残余リスク: TOCTOU (解消したと主張しない)

手順 2 / 3 の gate と手順 4 の open の間に外部 process が ledger を WAL 化するか sidecar を作り、query の後に削除した場合、
手順 7 はそれを検出できない。plan ledger には WAL を設定する経路が無い (`git grep -n journal_mode origin/main -- src` の該当は
`src/runtime/cutover-transition.ts:464` だけ) ことを前提に、この窓は残余リスクとして受容する。ledger を WAL 化する変更は
本 query の前提を壊すため、上位契約の改訂 (PLAN-REVERSE-722 G2) と同時に扱う。

### 4.3 書込みゼロの oracle (反証可能)

観測対象は DB の親 directory の全 entry (名前の sorted listing) と、各 file の SHA-256・size・mtime、および directory 自身の mtime とする。
観測は query 呼出しの直前と、query が返って connection が close された直後の 2 点で行う。fixture 準備の writer は観測開始前に close する。
接続中・SELECT 中の連続観測 (watcher / polling) は行わない。書いて戻す変異は mtime と SHA-256 の変化で検出する。
**mtime だけでは不十分** である (実測: live WAL 下で `-shm` の bytes が変わっても mtime は変わらなかった)。

外部 writer の変更と query 自身の変更は、次の条件で区別する。

- O1〜O4 は観測窓に外部 writer がいない fixture で行う。このとき差分は query 自身に帰責できる。
- O5 と O8 は外部 writer が lock を保持する fixture であり、filesystem の差分は判定に使わない。writer 側のファイル (`-journal`) は
  writer が作ったものとして扱い、判定は query の戻り値 (deny / 値) と、writer 終了後の DB bytes が writer の commit だけで説明できることで行う。

| ID | fixture | 期待 | 検出する変異 |
|---|---|---|---|
| O1 | rollback、sidecar 無し | 成功。前後の listing・SHA-256・size・mtime・dir mtime が一致し、`-journal` / `-wal` / `-shm` が生じない | 書込み可能 open で書いて戻す |
| O2 | WAL、sidecar 無し | `ledger_unavailable`、差分無し | gate 除去 (`-wal` 0B と `-shm` 32768B が生成される) |
| O3 | WAL、live sidecar | `ledger_unavailable`、`-shm` の SHA-256 不変 | gate 除去 (`-shm` の hash が変わる)、`immutable=1` への置換 (deny でなく値を返す) |
| O4 | rollback、hot journal | `ledger_unavailable`、DB と `-journal` の bytes 不変 | rollback 再生・修復の追加 |
| O5 | rollback、別 connection が EXCLUSIVE lock を保持 | `ledger_unavailable` (即時) | `busy_timeout` / retry の追加 (即時に返らない) |
| O6 | rollback、sidecar 無し。検証完了直後の hook で write probe (`CREATE TABLE`) を query の connection 上で試みる | probe が errcode 8 (SQLITE_READONLY) | `readOnly: true` と `mode=ro` の両方を除去した書込み可能 open (probe が成功する) |
| O7 | CLI subprocess (PR-2) | O1 / O2 を subprocess で再実行 | CLI 経路の別 open |
| O8 | snapshot barrier (§4.4) | selector が検証済み snapshot の値を返す | 検証の txn 外移動、selector の別 connection 化 |

### 4.4 snapshot 一貫性の oracle (test seam)

query に test 専用の hook (検証完了直後に 1 回呼ばれる callback。production 経路では未設定) を置く。

1. query が `BEGIN` して既存検証を終える (reader は SHARED を保持し、snapshot が確定している)。
2. hook の中で別 process の writer を起動する。writer は fixture 初期化を持たない専用 entry とし、`busy_timeout` を barrier と selector の所要時間より十分長く (例: 30 秒) 取る。writer は `BEGIN IMMEDIATE` → 対象 revision row の UPDATE → 同期通知 A (`fs.writeSync` で「commit 直前」を出力) → `COMMIT` の順に進む。
3. 同期 A の受信後、独立の probe connection (read-only open) で `SELECT count(*) FROM sqlite_master` を短い間隔で繰り返し、errcode 5 (SQLITE_BUSY) を観測するまで待つ (同期 B、上限 5 秒)。rollback journal では、writer が `COMMIT` で PENDING lock を取ると新規の SHARED が拒否されるので、同期 B は「reader が snapshot を保持したまま writer が commit を試み PENDING で待っている」ことの観測になる。上限内に観測できなければ barrier timeout として Red にする。
4. hook から戻り、query が同じ connection で selector を実行し、`COMMIT` / close する。
5. **reader の close 後にだけ** writer の終了を待つ。reader は読むだけで追加の lock を要求せず、writer は PENDING のまま busy handler で待つので、reader close で writer の EXCLUSIVE 取得と commit が進む (deadlock しない)。
6. 期待: 同期 B を観測し、selector の値が検証済み snapshot の値 (更新前) と一致し、writer が exit 0 で終了し、終了後の DB では当該 row が更新されている。
7. 変異「selector を別 connection で実行する」: PENDING 中の新規 SHARED は拒否されるので、selector は必ず errcode 5 になり 6 と一致しない。変異「検証を transaction 外へ移す」: reader が SHARED を保持しないので writer は待たずに commit し、同期 B が timeout するか、selector が更新後の値または busy を返し、いずれも 6 と一致しない。
8. 決定性の実測: scratch fixture で各 40 回を実行し、正実装は 40/40 Green、上記 2 変異は各 40/40 Red だった (`issue722/fix1/measure-fix1.mjs`、Node v24.13.0、Windows)。

### 4.5 検証コストの上限

既存検証は `PRAGMA integrity_check` と全 table の走査・digest 再計算を行うため、query 1 回のコストは ledger size に比例する。
scratch の代表 fixture で、20,000 revision / 79.6MB が 1.46 秒、100,000 revision / 397.9MB が 6.55 秒だった
(DESIGN-NOTES §2。現 ledger は 512KB)。既存 `ledgerRowsValid` は `.all()` で全 row を読み込むため、メモリも ledger size に比例する。
同形の全 row 読込みは、20,000 revision で RSS +65.2MB、100,000 revision で RSS +377.7MB だった。

- 性能 oracle O9: 20,000 revision 規模の fixture で、query 1 回が 5 秒以内、RSS 増分が 256MB 以内であること (CI の Windows / Linux 両脚)。
  実測値 (1.46 秒 / +65.2MB) に対して約 3〜4 倍の余裕を取る。
- node:sqlite の同期 API は実行中の statement を中断できないため、上限は runtime timeout ではなく test の性能 oracle で担保する。
- 本 query は 1 呼出し = 1 revision の単発照会であり、ループや一括問い合わせに使わない。一括照会が必要になったら別契約とする。
- 上限を満たせない場合でも、`quick_check` への置換や検証の省略で弱めない。検証レベルを分ける上位契約の改訂 (L6-71 の add-design) を別に起票する。

## 5. 対テストと受入

pair test-design の CANDIDATE-U-PRDQ-001..007 を実装 PR で Red→Green にする。CANDIDATE-U-PRDQ-006 は §4.3〜4.5 の O1〜O9 に
揃える追補を**本契約と同じ pair-freeze** で行う (追補案: scratch `issue722/test-design-changes.md`)。全 fixture は独立した一時 DB とし、
main harness.db / ledger を開かない。

- AC1: exact selector と歴史 revision の値を、fixture payload から独立に計算した SHA-256 と照合する (PRDQ-001)。
- AC2: identity / row / chain の単独変異を `ledger_integrity_mismatch` で拒否する (PRDQ-002 / 004)。
- AC3: Node API で O1〜O6 / O8 / O9、CLI subprocess (PR-2) で O7 を満たし、内部 capability を公開しない (PRDQ-006 / 007)。
- AC5: TOCTOU を解消済みと記述しない。§4.2 の残余リスク記述と手順 7 の補助確認が実装と一致する (closing review で確認)。

### 設計判断の記録 (2026-09-29)

- 相談: `gpt-5.6-sol` (`--decision implementation`)。初回判定は FLAG (5 件)。本節と §4.1〜4.5 はその是正である。
- Q1 kind: `add-impl` + Reverse 対を維持する (L6-71 に公開 read 契約が無い)。
- Q2 busy: 即 deny (`ledger_unavailable`)。`busy_timeout` を設定しない。
- Q3 TOCTOU: 残余リスクとして明記し、close 後の sidecar 確認は補助 fail-close として置く。解消とは主張しない。
- Q5 snapshot: test seam (§4.4) を必須とし、構造 review だけに頼らない。
- Q6 コスト: `integrity_check` を維持し、性能 oracle O9 を置く。弱める場合は上位契約改訂を別に起票する。
- Q7 test-design: 同じ pair-freeze で追補する。
- write 境界の正本は `readOnly: true` とし、`mode=ro` は defense-in-depth。個別除去 mutation は要求しない。
- AC4: 検証ロジックの複製が無い (抽出後の `schemaMatches` / `ledgerRowsValid` の定義が 1 箇所)。根拠は `git grep -n "function ledgerRowsValid" -- src` が 1 件であること。

## 6. Schedule

| step | mode | 内容 |
|---|---|---|
| 1 | serial | 本契約と対 test-design を非著者 Claude Opus が pair-freeze review する |
| 2 | serial | control lane が正規 admission / revision と review 証跡を接合する |
| 3 | serial | PR-1: CANDIDATE Red を独立 commit に残す (read-only opener・検証抽出・query API 対象) |
| 4 | serial | PR-1: 最小実装。対象回帰・typecheck・lint・Linux / Windows CI |
| 5 | serial | PR-1: exact-head 非著者 review と正規 receipt gate で merge |
| 6 | serial | PR-2: CLI `plan revision-digest` の配線と O7 (1 PR = 1 論点) |
| 7 | serial | #681 後継 PLAN authoring が検証済み query の値を利用する |

## 7. 非目標

GitHub / network 操作、IssueProjected query、manual bind、FSM / cutoff、ledger migration / repair、
WAL ledger の読取対応、履歴 receipt 書換え、全 PLAN 一括修復、新しい ledger / authority engine。

## PR-1の成果物所有宣言（revision 4）

PR #754のpair-freeze PASSとIssue #722 comment 5887432380の着手指示を根拠に、新規query APIと対testだけを所有宣言する。既存schema/state-dbファイルは元PLAN所有を維持する。PR #761の実装closing PASSは未取得であり、この改訂で完了を主張しない。
