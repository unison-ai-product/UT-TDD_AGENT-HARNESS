# #959 Fレーンの人読分類候補

この成果物は一次表 `06_PLAN_DISPOSITION_FIRST_PASS.json` の下位候補であり、新しい台帳・PLAN・実行時正本ではない。最終分類、工程②の完了、削除やarchiveの権限を宣言しない。

## 固定した入力

- source commit: `3ca0692d6c6a180b058c492475080be2a140e667`
- 一次表blob: `01871fad5745eb86cced27f8b197464223dcfbc8`
- F監査入力SHA-256: `7f15ff339a54ed5341c23fd5d5c9d287a33493863b16d7c933c289be51935cf1`
- 対象: Fレーン218完全ID。一次表の順序を維持し、番号が同じでも完全IDが異なれば別件として扱う。

## 候補件数

| 候補 | 件数 | 意味 |
| --- | ---: | --- |
| 生きている | 106 | 個別の現契約または限定責務を保持する根拠がある。PLAN全体の実装・検証・移管完了ではない。 |
| 保留 | 98 | 個別owner・対・直接oracle・責務移管などの根拠に未解決点がある。廃止や未監査とは別。 |
| 廃止予定 | 14 | PLAN運用面の将来方針に対応する限定責務の候補。契約・証拠の削除許可ではない。 |
| supersede済み | 0 | 一方向参照や部分移管だけでPLAN全体の置換を認定しない。 |

## 判定基準

status、generates、source pathの実在だけでは分類しない。現ownerの明示、個別機能契約、対になるoracle、コード・直接テストの対応を区別し、確認できる限定範囲と残る責務を各行の理由に残した。

r1是正ではL1-01..05を、未解決carry・依存移管のため保留へ訂正した。設計文書に契約があるだけではwhole-PLANの廃止予定を認定しない。他の廃止予定候補も理由に明示した限定責務だけを対象とし、残carryや削除許可を含めない。L1-01/02/03、PLAN-M-01、L4-13のlive code参照は、退役前に先に解消する依存として各行と固定Git証拠へ追記した。

JSONのsourceReason/sourceCandidateLabelとvalidationの入力集計は原監査入力の履歴として保持する。訂正後の分類件数は公開summaryとrecordsで示し、reviewCorrectionにcontrolコメントを記録した。

r2では廃止予定14件すべてを、固定sourceの`src/`・`tests/`に対し完全IDとbare core IDの両方で再検索した。M-00のproduction参照・実repo検証を含む10行へ依存を追加し、65件の逐語参照を固定Gitへ束縛した。bare core参照は完全IDへの結合が未確定なので、責務移管・廃止の証明と区別する。検索で直接参照が見つからなかった4行もJSONのdependencyScanへ記録したが、動的・意味上の依存の不存在は主張しない。taxonomy/identity fixtureとproductionの直接依存も区別し、いずれも廃止前の照合対象として保持する。

L6-63はlocal stagingの限定契約を保持する一方、remote publication・stable昇格・rollback等の未完責務を切り分ける。L6-83/86、L8-01、L9-01も個別の限定責務を保持する候補であり、Forward/右腕/実行閉包全体の完了を意味しない。

## 検証と限界

- 218行のsource blob OID・SHA-256・bytes・一次表完全ID対応を検証。不一致0。
- 元の証拠参照先157パスに加え、r1ではlive codeと直接testの6参照を固定Git objectへ束縛した。参照IDの未定義0。
- 元の数値行範囲の逐語引用377件は変更せず、r1の6件を追加して固定Git bytesとの一致を検証した。不一致0。残る190件は複合参照などで逐語検査の対象外であり、解釈として区別する。
- r2の65追加参照も固定Git bytes・SHA・サイズとの一致を検証した。不一致0。候補ラベル・source bindings・元reason・元参照はr1から変更していない。
- 上記は構造・固定source・引用の検証であり、意味分類のclosing reviewの代わりではない。
- 元PLAN、設計、実装、tests、台帳、DBは変更しない。本文の過去Greenを現HEADの検証として流用しない。
- 現mainの共有契約は固定sourceから進むため、実移行前に鮮度差分を検証する。
- 各行の理由は日本語で記載し、原文はJSONのsourceReasonに保持する。英語理由127件を個別翻訳し、共通hold文7件は同じ原文パターンに限って日本語化した。残り84件の日本語理由は原文を維持した。翻訳scratchのcomplete:falseは、候補の最終確定とは別の作業中表示として保持する。

controlが非著者reviewと三レーンの結合・最終判断を行う。
