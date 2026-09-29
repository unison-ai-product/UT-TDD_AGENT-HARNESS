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
| CANDIDATE-U-PRDQ-001 | A/X/revision 1、続いて revision 2。CLI と API を同じ fixture へ呼ぶ | exact tuple と各 payload の独立 digest が一致。revision 1 で latest を返す変異を検出 |
| CANDIDATE-U-PRDQ-002 | alias 欠落/別 alias、A と Y の組合せ、複数有効 alias の破損を別々に与える | invalid_input または alias_binding_mismatch。破損 ledger は integrity deny。digest 無し。alias/asset guard 除去を正常 ledger 上の mismatch で検出 |
| CANDIDATE-U-PRDQ-003 | revision 0/負数/非整数、X に無い番号、Y にだけある番号を別々に与える | invalid_input または revision_not_found。latest/他 asset への fallback を検出 |
| CANDIDATE-U-PRDQ-004 | canonical payload bytes/保存 digest、plan_alias_events の event_digest、plan_draft_journal_events の sequence/previous_event_digest を各々単独変異 | ledger_integrity_mismatch。selector は正常に維持し、検証呼出し除去を検出。row digest 以外の chain 軸では row digest を再計算し、chain 検査自身を観測する |
| CANDIDATE-U-PRDQ-005 | DB 不在・schema 非対応・open 不可・破損 DB | ledger_unavailable または ledger_integrity_mismatch。DB 作成/migration/rehydration/repair に逃げない |
| CANDIDATE-U-PRDQ-006 | Node API で次を各々実行: (O1) rollback・sidecar 無しの成功 query、(O2) WAL・sidecar 無し、(O3) WAL・live sidecar、(O4) hot journal、(O5) 別 connection が EXCLUSIVE lock を保持、(O6) O1 と同 fixture で書込み可能 open 変異、(O8) snapshot barrier (§2.1)、(O9) 20,000 revision fixture の性能。CLI subprocess では (O7) O1 / O2 を再実行する | O1: 成功、観測値が前後で完全一致し `-journal` / `-wal` / `-shm` が生じない。O2 / O3: `ledger_unavailable`、観測値不変 (O3 は `-shm` の SHA-256 不変)。O4: `ledger_unavailable`、DB と `-journal` の bytes 不変。O5: 待たずに `ledger_unavailable`。O6: `readOnly: true` と `mode=ro` の両方を除去した変異を観測差分で kill する (片方だけの除去 mutation は要求しない)。O8: §2.1。O9: 1 回 5 秒以内かつ RSS 増分 256MB 以内。gate 除去は O2 / O3、`immutable=1` 置換は O3 (値を返す)、`busy_timeout` / retry 追加は O5 (即時に返らない) で検出する。DML / DDL / migration / receipt / PLAN write は 0 |
| CANDIDATE-U-PRDQ-007 | API/CLI の成功・失敗値を検査し、不正値では exit 1 を期待 | DTO の exact key set。DB/statement/row/capability/SQL 詳細を返さない。成功だけ exit 0、失敗では digest を返さない |

### 2.1 snapshot barrier (CANDIDATE-U-PRDQ-006 O8)

query の test 専用 hook (検証完了直後に 1 回呼ばれる callback。production 経路では未設定) を使う。

1. query が `BEGIN` して既存検証を終える。
2. hook 内で別 process の writer を起動し、writer が `BEGIN IMMEDIATE` (RESERVED) に達したことを同期で待つ。writer は対象 revision row を更新して commit する。
3. hook から戻り、query が selector を実行し、`COMMIT` / close する。
4. reader の close 後にだけ writer の終了を待つ (selector 前に writer の commit を待つと rollback journal で deadlock し得る)。
5. 期待: selector の値が検証済み snapshot の値 (更新前) と一致し、writer 終了後の DB では当該 row が更新されている。
6. 変異: 検証を transaction 外へ移す / selector を別 connection で実行する。どちらも更新後の値か busy になり 5 と一致しない。

## 3. 実行規律

実装前に Red を単独 commit に残し、Node canonical snapshot で対象テストを実行する。正規 U への昇格は Green 後、PLAN revision と同じ control transaction の証跡に接合する。変異検証は変更 tree を直接対象にし、HEAD を捕捉する snapshot runner で mutant を無視して Green としない。

## 4. 非対象

#692 の manual bind/FSM/cutoff/IssueProjected、#681 の launcher 修理、GitHub 実在確認、DB の修復・初期化、新たな ledger 正本。gate と open の間の TOCTOU の検出 (PLAN-L7-722 §4.2 の残余リスク。本 test-design は解消を主張しない)。
