# AIの進化に合わせ、説明を減らし実トラブルを対策にする

R03はrecord/packet識別と計測、R04は限定比較、R05/R06は共通guard/修理、R08はmodel/provider更新評価、R09は継続的calibration/退役。新しいmemory engineや学習Planeを作らない。

## 残す情報・減らす情報

| 情報 | 方針 |
|---|---|
| 人間主権/安全義務 | 最小境界を伝え実際はtool/UTで強制。モデル進化で義務を消さない |
| 今の要求/設計/AC/HEAD/残作業 | 必要scopeを保持。事前学習で知っているはずと推測しない |
| 一般実装手順・冗長な説明 | 無注入/短縮/必要時取得を比較し、品質/費用が成立する範囲で削減 |
| 事故固有のworkaround | 適用task/model/OS/版を限定し、失効/再検証を持つ |
| 完了済みepisode/raw log | 通常packetに反復注入しない。監査保存とon-demand取得は別 |
| guard/testで強制済み規則 | 長い注意書きを二重保持せず、理由・正規入口・回復先だけ示す |

## トラブルから対策まで

`incident/finding→機微除去/出所確認→再現/根因→dedupe→対策先判断→通常修理/Reverse→回帰/独立review→有効化→再発/副作用→再検証/retire`

保存失敗なら保存/終端、通知なら配送、権限ならtool認可、契約誤りなら上流を直す。どの問題もCLAUDE.mdの注意書き増量で済ませない。場面依存の判断だけは出所/反例/適用条件付きCASEへ。単発重大欠陥は正規緊急経路で修理し、汎用policyへの無審査昇格とは区別。

対策recordは元incident、cause、適用/非適用、対象版、owner、正負test、guard/修理先、実績、失効条件、replacement/rollbackを参照する。既存Evidence Ledgerとregistryに追加し、BugBot専用に複製しない。

## モデル更新時の評価方法

1. task/role、modelの取得可能revision、CLI/SDK、tool、packet/policy、実行条件を固定。取得できない識別子はunknown。
2. 同一モデル内でcontext差だけ比較し、モデル更新そのものの比較は別に行う。
3. 同じ代表案件、正常/境界/事故再現/攻撃、独立holdoutで評価。未来の結果を学習済み正解として混ぜない。
4. 成功・見逃し・誤拒否・再発・human overrideと全attempt token/CI/待ち/費用を比較。入力tokenだけで評価しない。
5. 必要サンプルと許容差をrisk別に前もって決め、不十分なら未判定。scope限定rollout、悪化時に検証済みprofileへ戻す。

model名が新しい/高い/大きいから自動で説明を減らさない。減らせなかったtaskを失敗扱いしない。provider-native context機能が使えるときはadapterで検証して利用し、内側ループをUTで二重実装することを既定にしない。

## 学習と退役の安全条件

新知識はcandidate。approvalやactive policyを学習器が自動生成しない。prompt injection、別project/reviewer漏洩、retired asset再浮上を検査。発火0は安全策不要の証明ではなく、代替手段・反証・適用条件も見る。履歴を削除せず、常時注入・機構への移管・資産退役を別操作として記録する。

## コスト

全モデル/全PRの比較を固定起動しない。変更profileの対象taskと定期代表集合へ限定し、評価処理自体のAI/CIコストもsoft budgetへ含める。schedulerがその評価を本体開発のcritical taskと競合させる場合は、事前のcapacity policyで調整する。
