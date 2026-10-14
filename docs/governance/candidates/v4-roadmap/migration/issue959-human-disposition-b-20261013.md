# #959 Bレーンの人読分類候補

一次表 `06_PLAN_DISPOSITION_FIRST_PASS.json` の下位成果物であり、新しい台帳・PLAN・実行時正本ではない。最終分類、工程②の完了、削除・archive・mergeの権限は宣言しない。

## 固定した入力

- source commit: `3ca0692d6c6a180b058c492475080be2a140e667`
- 一次表blob: `01871fad5745eb86cced27f8b197464223dcfbc8`
- B監査入力SHA-256: `75e5bd34ba8b6952a911894bf2144a5649fc26e1161a1b1bfedb6e9e12780e14`
- L7の543完全IDを一次表の順序で出力した。同じ番号でも完全IDが異なれば別件である。入力の2件のL6文脈行はBの件数に含めない。

## 候補件数

| 候補 | 件数 | 意味 |
| --- | ---: | --- |
| 生きている | 257 | 現契約・直接oracle・実装endpointで根拠づけられた限定責務。PLAN全体の完了・移管済みとは異なる。 |
| 保留 | 286 | 個別owner・対・直接oracle・責務移管・受入に未解決点がある。廃止や未監査ではない。 |
| 廃止予定 | 0 | statusや生成先の欠落だけで廃止を認定しない。 |
| supersede済み | 0 | 一方向参照・部分移管・成果物のarchiveだけでPLAN全体の置換を認定しない。 |

## 判定基準

status、generates、source pathの実在だけでは判定しない。完全IDごとにowner、個別上位契約、直接oracle、実装endpointを区別し、保持する限定範囲と未解決carryを各行へ残す。共通helperや隣接機能が存在するだけでは、そのPLAN全体の責務移管を証明しない。

PLAN-L7-421の2件は、数値coreの曖昧なIssue参照を後継・退役の根拠にせず、それぞれの完全IDで確認したright-arm gateとtest-hygiene fenceの限定責務を保持する。PLAN-L7-400/401の過去bundleとPLAN-L7-403の現ownerも分ける。PLAN-L7-58は取得・料金計算・表示専用走査を保持し、退役対象のDB ingestを復活させない。PLAN-L7-835のrev4証跡をrev5受入の完了証拠へ流用しない。

## 検証と限界

- 543件の完全ID・source blob OID・SHA-256・bytes・一次表の順序を固定Gitと照合した。不一致0。
- 監査入力の逐語引用2,787件を固定Gitで照合した。不一致0。公開JSONは重複する同一引用を2,703件のcatalogへ集約し、各行は参照IDで結ぶ。
- 日本語訳は3区間で原scope/whyへ対応させ、543件の完全ID・順序・空欄・参照文字列保持を確認した。原文はsourceScope/sourceReasonとして残した。
- 構造・引用・翻訳の内部点検は、意味分類の非著者closingを代替しない。controlがOpus reviewと三レーンの結合・最終判断を行う。
- 元PLAN、設計、実装、tests、台帳、DBは変更しない。過去のGreenやstatusから現在の実装・受入・移管完了を推測しない。
- 実移行前に現mainの契約との鮮度差分を確認する。固定sourceの候補から現在の削除許可を導かない。

classificationIsFinalはfalseのまま保持する。
