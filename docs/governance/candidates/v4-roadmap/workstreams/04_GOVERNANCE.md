# 管理体制・誰が何を決めるか

R01で意味契約、R03で共通JSON、R04でmanagement view、R05で認可/任免/代理/例外/回復を強制する。役職や管理Botの数を増やす企画ではない。

| 責務 | 判断の範囲 | 自動化する範囲 |
|---|---|---|
| PO/製品責任者 | 上位要求、license、製品方向、release範囲の変更 | 調査・候補・証拠比較 |
| 統括メンテナー | 依存/優先度policy、WIP/capacity、例外予算、blockedの返却先 | 通常ready taskの並べ替え、通知集約、進捗projection |
| 領域owner | contract/JSON/CI/security/role/学習/配布の責任 | 対象scopeのplan/実装/検証支援 |
| reviewer/admitter | 独立検証、証拠に基づくmerge受入 | 機械検査/receipt照合、許可済み低riskの処理 |
| release/incident owner | 公開・rollback・脆弱性・保守version・復旧判断 | 手順実行・影響集約・監視 |

一人が管理責務を兼務してよい。独立レビューは自己sessionで代替しない。単独運用はself-admissionを明示して既存の補償監査へ。複数人では必要分離を実actorに割り当てる。実在しない2人目、鍵、メール、SLAをこの資料が補完しない。

## 三つの主権

UT開発元は共通製品を管理。consumerは自分の要求・予算・本番・外部送信・学習opt-in・CIを管理。AI laneは委任された仕事を実行。UTのpackage更新だけでconsumerの権限・費用・コード・データ同意を変更できない。

## 承認を減らし、越権を防ぐ

通常は一度採択したpolicy内で自動処理する。schedule順序の微調整ごとに人間へ承認を投げない。人間はdeadline/release scope/capacity/支出例外/高影響作用/policy変更を判断する。例外には対象・理由・期限・補償策・復帰条件を要求し、期限切れで自動延長しない。

owner任命・代理・退出は旧有効policyが認可し、新ownerの自己申告でその変更を許可しない。代理候補を置いても二重の有効ownerを作らない。credential/token/未消費approval/leaseも退出時に失効を点検。代理不在なら保護作用だけ待機し、独立作業まで全停止させない。

## 管理面に表示するもの

現在release/有効capability、owner/代理、ready/blocked/WIP、review/CI/mergeの待ち、次の解放条件、予定と実績、費用/未取得、移行進捗、残余risk、期限付き例外、profile変更。正本eventから生成し、表の手編集やモデル自己申告を進捗にしない。

## この計画を管理する単位

Rは利用者へ公開できる機能境界。SLは一つの実装論点、MIGは旧新移行責務。いずれも正式Issue/PLANへの対応を登録してから着手。各SLはownerと依存/ACを持ち、完了はmergeだけでなく要求するintegration evidenceで閉じる。会議周期を固定せず、差分・例外・公開前・重大incidentで非同期の判断を行う。

CODEOWNERSなどGitHub補助設定を、単体で認可/三者分離の保証と呼ばない。導入先の利用可能な保護能力を調べ、未強制部分を明示。寄稿と権利、supported versions、廃止予告はR01/R02から実際の保守能力に合わせ整備する。
