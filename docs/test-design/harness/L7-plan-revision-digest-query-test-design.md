# PLAN revision digest query の対テスト設計

対応 PLAN: `docs/plans/PLAN-L7-722-plan-revision-digest-query.md`。Issue #722。現時点は docs-only candidate freeze であり、以下の oracle は未実行。正式 PLAN admission は control lane が接合する。

## 1. 共通 fixture

既存 ledger の正規 writer を test setup だけで使って独立した一時 DB を作る。alias A に asset X、revision 1/2 の異なる canonical payload を記録し、別 alias B/asset Y を用意する。期待 digest は fixture payload から独立に SHA-256 を計算する。production query 自身に writer を呼ばせない。破損を作る SQL は test setup に限定し、main harness.db を使わない。

## 2. 候補 oracle

| ID | 入力・単独変異 | 期待・判別軸 |
|---|---|---|
| CANDIDATE-U-PRDQ-001 | A/X/revision 1、続いて revision 2。CLI と API を同じ fixture へ呼ぶ | exact tuple と各 payload の独立 digest が一致。revision 1 で latest を返す変異を検出 |
| CANDIDATE-U-PRDQ-002 | alias 欠落/別 alias、A と Y の組合せ、複数有効 alias の破損を別々に与える | invalid_input または alias_binding_mismatch。破損 ledger は integrity deny。digest 無し。alias/asset guard 除去を正常 ledger 上の mismatch で検出 |
| CANDIDATE-U-PRDQ-003 | revision 0/負数/非整数、X に無い番号、Y にだけある番号を別々に与える | invalid_input または revision_not_found。latest/他 asset への fallback を検出 |
| CANDIDATE-U-PRDQ-004 | canonical payload bytes/保存 digest、alias event digest、sequence/previous digest を各々単独変異 | ledger_integrity_mismatch。selector は正常に維持し、検証呼出し除去を検出。どの既存検証に由来する変異か記録 |
| CANDIDATE-U-PRDQ-005 | DB 不在・schema 非対応・open 不可・破損 DB | ledger_unavailable または ledger_integrity_mismatch。DB 作成/migration/rehydration/repair に逃げない |
| CANDIDATE-U-PRDQ-006 | 正常/異常 query 前後で DB/WAL/SHM bytes・存在と親 directory entries を比較。adapter 書込み境界も計測 | DML/DDL/append/migration/receipt/PLAN write が 0。途中で書いて戻す変異も write-deny 計測で検出。CLI subprocess でも確認 |
| CANDIDATE-U-PRDQ-007 | API/CLI の成功・失敗値を検査し、不正値では exit 1 を期待 | DTO の exact key set。DB/statement/row/capability/SQL 詳細を返さない。成功だけ exit 0、失敗では digest を返さない |

## 3. 実行規律

実装前に Red を単独 commit に残し、Node canonical snapshot で対象テストを実行する。正規 U への昇格は Green 後、PLAN revision と同じ control transaction の証跡に接合する。変異検証は変更 tree を直接対象にし、HEAD を捕捉する snapshot runner で mutant を無視して Green としない。

## 4. 非対象

#692 の manual bind/FSM/cutoff/IssueProjected、#681 の launcher 修理、GitHub 実在確認、DB の修復・初期化、新たな ledger 正本。
