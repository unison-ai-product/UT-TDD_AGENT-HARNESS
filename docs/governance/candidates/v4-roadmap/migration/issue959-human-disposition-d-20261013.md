# PLAN人読分類候補 — lane D

Issue #959、control指定6143704640に従う一次表の下位証跡。新しい台帳・PLAN・設計正本ではない。

## 固定入力と範囲

- source commit: `3ca0692d6c6a180b058c492475080be2a140e667`
- 一次表: `06_PLAN_DISPOSITION_FIRST_PASS.json`、Git blob `01871fad5745eb86cced27f8b197464223dcfbc8`
- Recovery 21件、Reverse 225件、計246件。完全な`planId`で識別し、同番号のL7/Reverseを混同しない。
- 隣接JSONは一次表のD行順に並べ、各行にsource commit、PLAN path/blob/SHA-256、候補区分、理由、根拠参照を記録する。

## 候補件数

| 候補区分 | 件数 |
|---|---:|
| 生きている | 118 |
| supersede済み | 0 |
| 廃止予定 | 1 |
| 保留 | 127 |
| 合計 | 246 |

全件に候補と理由はあるが、最終区分確定ではない。`classificationIsFinal: false`を維持する。保留は未読という意味ではなく、責務の移管・終了・現在ownerを現根拠だけでは断定しないという候補判断である。

## 判定基準

status、generatesの存在/欠損、sourceの現存だけで存続・退役を決めない。後継参照は両側と対象範囲を照合し、部分backfillをwhole replacementへ広げない。現在の契約・未完の継続責務と、完了済み工程・過去の証跡を区別する。

Reverse-533は未実装撤回を自身とL6-104の双方が明示するため廃止予定候補とした。これはformal supersedeではなく、archived admission拒否によりdraft据置された撤回である。L7-512はmigration部分だけが対象、Reverse-512やroot/envelope/Pack parityは残る。実archive/削除許可とはしない。

## 検証と限界

- 一次表Dの246件と候補の完全ID集合・一意性・順序を照合する。
- 各PLANのblob OID、byte数、SHA-256を固定Git sourceへ直接照合する。
- evidenceの`note`は読取内容の解釈であり、逐語引用ではない。参照位置の存在検査だけを意味判定PASSとして扱わない。
- 固定sourceから現在mainまでに共有設計・test-designも変わっている。三者照合/実移管時は別のexact sourceで再検収する。固定sourceの根拠を現在契約へ自動流用しない。
- 後継statusの完了、runtime利用実態、canonical admissionの現在受理、全PLAN移管はこの表から証明しない。
- Opus非著者reviewとcontrolの結合・最終判定は未完。PLAN本文、receipt projection、DB、設計、oracleは変更しない。

変更はこのJSON/Markdownの2ファイルだけ。scratchは準備資料に留め、正本として昇格しない。
