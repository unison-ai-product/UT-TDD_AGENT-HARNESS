# 起点の事実と、既存資産の再利用

確認日：2026-09-08。main `84cd7f896f7dfbd67b38b250b5a943eaee3f6640`、#517 HEAD `c21b54fb0d3f2d5a73a7826cc41233634456cac9`。
mainは#521のBun最終撤去「契約」merge。package.jsonは`0.2.0-canary.1`、MIT、`bun build`表記が残る。従って契約mergeを物理撤去済みとしない。#517はdraft/openの候補。[GH-MAIN][GH-PKG][GH-PR517]

このロードマップは全件進捗監査ではない。既存Issueの完了/未完は着手時に取得し直し、閉じた修理を新テーマとして重複起票しない。前版中の過去の件数・CI状態・待ち時間を現在値へ転記しない。

| 起点/責務 | 再利用するもの | 追加/置換するもの | 境界 |
|---|---|---|---|
| V-model/route | L0-L14、正規pair、Forward/Reverse/Recovery、routeFiling | 入力の機械化・backflow集約 | 別workflow engineを作らない |
| PLAN/予約 | 既存PlanAssetとreservation ledger、operation/replay | 編集前予約・ticket接続・分散裁定 | #480を拡張。Git treeの空き番号推定をauthorityにしない |
| U23 | Execution Ledger、event/outbox/inbox、GitHub projection設計 | 複数人間・4階層・schedule/lease/admission | 設計があることと実装済みは別 |
| review/custody | exact-head、非著者、canonical receipt | 欠損/終端/訂正/失効/再開と新record接続 | 古いPASSの付替え禁止 |
| Memory | project identity、root/busと隔離要求 | 対策資産lifecycle、適用範囲、context計測 | author/reviewerのcontext混入禁止 |
| CI | source full、Pack smoke、aggregate、snapshot timing | consumerと既存CIの重複削減/選択計画 | source全部をconsumerの現状と決めつけない |
| export | `src/export/document-export.ts`のdataset/hash/CSV系の基礎 | 実spreadsheet生成・図・編集提案の往復 | metadataにxlsxと書くだけでは出力成功ではない |
| provider | 既存native agent、guard/routing、実行adapter | role正本から生成、能力profile、別sessionの実証 | 同じroleを二系統で維持しない |
| distribution | sealed generation/publication契約 | #481 updater、#364 A/B・stable受入 | 新ライセンス表示の配布整合も必要 |

## 既存Issueの処理順を決めるルール

#487/#424/#418など現行Canaryの必須事項はR00。#481/#364の後続運用完成はR02。#480はR03/R05。#439/#505/#493/#494/#454/#524や通知/GCの事故は、Canary/既存運用を阻害するものを待たず通常修理し、その契約を後続共通recordへ移す。#413のproject横断学習はR09でopt-in/隔離付きにする。

「今openだからv4へ先送り」「v4で似た機構を作るから今は無限retry」は採らない。現行修理の責務と、新capabilityの受入責務を明示的に分ける。
