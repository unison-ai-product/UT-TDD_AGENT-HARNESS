# 開発原価・consumer CIの最適化

対象：RM-ADD-02/03/06、R03契約→R04実用→各版で監査。狙いは実プロジェクトへUTを入れた際の固定的Actions負担を減らすこと。公開UTの無料枠だけの話にしない。

## 変更の単位

source自体の品質検証、Packの配布smoke、consumerで開発するアプリの検証を区別。consumer既存CIで済んでいる検査をUTが別名で再実行しない。ただし同等性を照合できない外部PASSは採用しない。元workflow/branch保護を無断上書きしない。

| 場面 | 軽量にする方法 | 残す検証 |
|---|---|---|
| 作業中 | resource上限付き隔離環境で対象testを反復 | 型/契約/再現/必要な結合条件 |
| Draft | 合意したquick validation、obsolete run取消 | 認可・source/検証契約の整合 |
| merge候補 | scope確定後の必要集合実行 | exact subject、独立review、riskで昇格したOS/回帰 |
| main | merge状態と証拠の差分確認 | candidateとmainの同等性不明なら再検証 |
| release/定期 | 重い回帰を集約 | clean、移行/回復、必要OS、選択漏れ監査 |

最初から全fullを削除せず、timing/flaky/fixture/clock/重複setup修理を先行。sourceの全回帰契約を変えるなら要件・test obligation・aggregate・実行信頼境界・templateを同じ変更計画で扱う。[GH-CI][GH-PACKCI]

## budgetは安全義務を変えない

月2,000分程度は通常目標。所有アカウントの他private repositoryと共有する枠・課金契約・OSごとの計上を実際の情報で確認する。支出0と未取得は別。料金をハードコードせず版付き入力として扱う。必須検査は予算不足でPASS化せず、事前許可範囲の超過、任意検査延期、適切な別環境を選ぶ。無制限の超過承認ではない。[WEB-BILLING]

consumerにはquality obligation profileとexecution cost policyを分けて持たせる。budget/standard/strict等のラベルだけで必須ACを減らさない。追加常駐runner/有料サービスは総費用で優位と実証した場合だけ任意導入。ローカル実行へ移して開発PCを落とす案も不採用。

## 評価データセット

実際のconsumerから機微除去した代表変更系列を用意し、doc-only、runtime、schema、UI、依存、security、releaseを分類。新旧selectorで同一base/headとpolicy/環境を使い、required集合、実行費用、見逃し、誤拒否、再実行を比較。小規模な全量比較だけから全プロジェクトで同じ節約率を約束しない。

合格条件は対象集合での必須義務/identity欠落ゼロ、正常mergeとrelease受入の成立、総費用/待機改善と事前に定めた品質許容差。改善の数値は測定後に記録し、ここで架空の削減率を埋めない。

## 手戻り削減

着手packetに現在の要求/AC/HEAD/scopeを渡す。接口と結合testを先行。provisional依存は再compile可能な局所変更に分割。semantic reviewより前に機械指摘を処理し、指摘をまとめる。最終review→mergeの間を短くし、実装量だけでWIPを増やさない。schedulerはレビュー/CI容量も考慮する。

費用=AI全attempt+tool/API+CI総稼働+保存+人手+保守。月額契約の枠消費と現金支出を混ぜない。AI費用を減らすための新しい巨大監査サービスの固定費を見落とさない。
