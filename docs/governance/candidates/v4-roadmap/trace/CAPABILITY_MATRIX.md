# 各版で使える範囲（累積）

生成元：data/capabilities.json。すべて将来の対応計画であり、実装・受入済みの表ではない。前版の受入済み機能を継承し、当該行に記す範囲だけ広げる。package番号と、構想v4への対応状態は別。

## 初回Canary〜安全な配布

| 領域 | R00 / 0.2.0-canary.1 | R01 / 0.2.0-canary.2 | R02 / 0.2.0 | R03 / 0.3.0 | R04 / 0.4.0 | R05 / 0.5.0 |
|---|---|---|---|---|---|---|
| UT本体のライセンス | MITの初回Canary | MPL-2.0へ切替（権利確認済み対象） | MPL-2.0へ切替（権利確認済み対象） | MPL-2.0へ切替（権利確認済み対象） | MPL-2.0へ切替（権利確認済み対象） | MPL-2.0へ切替（権利確認済み対象） |
| consumer更新・rollback | 手動更新/advisory | 切替契約と試験設計 | channel/承認/atomic switch/A-B独立回復 | channel/承認/atomic switch/A-B独立回復 | channel/承認/atomic switch/A-B独立回復 | channel/承認/atomic switch/A-B独立回復 |
| 共通JSON正本 | 現行契約を維持 | 現行契約を維持 | 現行契約を維持 | 新規record・対象pilotの共通writer | 新規record・対象pilotの共通writer | active ticket/attempt/controlに適用 |
| 表・図・人間の齟齬受付 | 現行export範囲 | 現行export範囲 | 現行export範囲 | 共通record参照＋自家利用prototype | 実スプシ/依存図/管理viewとadmission往復 | ticket/lease/配布状態も投影 |
| 低コストconsumer CI | 現行検証契約 | 現行検証契約 | 現行検証契約 | 検証計画契約と計測 | 選択検証＋full fallback＋soft予算 | 配布計画とreview/CI容量を連動 |
| 作業順序・所要予測 | 明示的な予測機能なし（今回の追加対象） | 明示的な予測機能なし（今回の追加対象） | 明示的な予測機能なし（今回の追加対象） | 依存/資源/見積り根拠のJSON | 読取専用の順序案・幅/unknown表示 | 実績イベントで再計画、配布とは別判定 |
| 実際の自動配布 | 現行手配経路 | 現行手配経路 | 現行手配経路 | 新dispatchは無効 | 予測のみ・writeしない | 依存/資源/lease/CAS付き自動配布 |
| 4階層チケット・合流 | 既存PLAN/予約/U23資産 | 既存PLAN/予約/U23資産 | 既存PLAN/予約/U23資産 | ticket/owner/admission型 | ticket/owner/admission型 | L4入力から4階層・予約・takeover・合流 |
| 安全境界 | 現行必須保護・重大事故の通常修理 | 脅威/保護対象/責任を定義 | 脅威/保護対象/責任を定義 | 信頼/認可/証跡入力を共通契約化 | consumer検査と権限確認 | 対象作用の隔離/送信/secret/replay/回復受入 |
| 管理責任・委任 | 既存人間判断 | UT/consumer/実行の責任・代理規約 | UT/consumer/実行の責任・代理規約 | 認可付きactor/decision/policy | 判断待ち/予算/責任のview | 失効・takeover・旧policy認可を機械強制 |
| 自動バグ修正 | 通常UT工程で修理 | 通常UT工程で修理 | 通常UT工程で修理 | 新Botは読取/提案のみ | 検出・提案のみ（修正無効） | 共通制御をfixture workerで受入 |
| 工程単位の回復 | 現行受入に必要な事故は修理 | 現行受入に必要な事故は修理 | updater失敗/既存custodyを通常修理 | 共通attempt/terminal契約 | 共通attempt/terminal契約 | CAS/ack-loss/再送/失効/再開の一貫処理 |
| 要求・PoC・製本 | 現行上流工程 | 現行上流工程 | 現行上流工程 | 必要参照と表示面のprototype | 必要参照と表示面のprototype | 必要参照と表示面のprototype |
| 還流・影響再計画 | 現行Reverseを維持 | 現行Reverseを維持 | 現行Reverseを維持 | backflowの共通入力契約 | backflowの共通入力契約 | incident fenceと既存Reverse接続 |
| 論理role/provider-native | 現行provider定義 | 現行provider定義 | 現行provider定義 | 最小role・証拠共通型 | 最小role・証拠共通型 | 配布は共通roleを参照、native旧定義はadapter化 |
| 単一providerの独立review | 現行で認められたprofileのみ | 現行で認められたprofileのみ | 現行で認められたprofileのみ | 証拠区分/attestation型 | 証拠区分/attestation型 | 現行基準を維持、新緩和を有効化しない |
| モデル進化に応じたcontext削減 | 既存最小読取規律 | 既存最小読取規律 | 既存最小読取規律 | packet/model/実績の記録 | 隔離比較と承認した限定削減 | 隔離比較と承認した限定削減 |
| 実トラブルの対策化 | 実証した欠陥を通常修理 | 実証した欠陥を通常修理 | 実証した欠陥を通常修理 | incident/judgement/結果を記録 | incident/judgement/結果を記録 | 共通guard/回復へ接続 |
| 旧機構の退役 | Bun等の現行退役条件 | Bun等の現行退役条件 | Bun等の現行退役条件 | inventory・移行pilot | inventory・移行pilot | 対象active旧writer停止 |
| 構想v4の完成判定 | 現行v3.1受入 | v4 target採択は別承認 | v4 target採択は別承認 | capability単位の適用開始 | capability単位の適用開始 | capability単位の適用開始 |

## BugBot〜構想v4統合受入

| 領域 | R06 / 0.6.0 | R07 / 0.7.0 | R08 / 0.8.0 | R09 / 0.9.0 | R10 / 1.0.0 |
|---|---|---|---|---|---|
| UT本体のライセンス | MPL-2.0へ切替（権利確認済み対象） | MPL-2.0へ切替（権利確認済み対象） | MPL-2.0へ切替（権利確認済み対象） | MPL-2.0へ切替（権利確認済み対象） | MPL-2.0へ切替（権利確認済み対象） |
| consumer更新・rollback | channel/承認/atomic switch/A-B独立回復 | channel/承認/atomic switch/A-B独立回復 | channel/承認/atomic switch/A-B独立回復 | channel/承認/atomic switch/A-B独立回復 | channel/承認/atomic switch/A-B独立回復 |
| 共通JSON正本 | active ticket/attempt/controlに適用 | 対象active PLAN/Reverseへ展開 | 対象active PLAN/Reverseへ展開 | 対象active PLAN/Reverseへ展開 | active旧writer停止・歴史import維持 |
| 表・図・人間の齟齬受付 | ticket/lease/配布状態も投影 | screen/ER/全上流traceまで展開 | screen/ER/全上流traceまで展開 | screen/ER/全上流traceまで展開 | screen/ER/全上流traceまで展開 |
| 低コストconsumer CI | 配布計画とreview/CI容量を連動 | 配布計画とreview/CI容量を連動 | 配布計画とreview/CI容量を連動 | 配布計画とreview/CI容量を連動 | 代表consumerで費用/品質の統合比較 |
| 作業順序・所要予測 | 実績イベントで再計画、配布とは別判定 | 実績イベントで再計画、配布とは別判定 | 実績イベントで再計画、配布とは別判定 | task/role別の実績校正・what-if | 予測誤差・計画変更コストを含む受入 |
| 実際の自動配布 | 依存/資源/lease/CAS付き自動配布 | 依存/資源/lease/CAS付き自動配布 | 依存/資源/lease/CAS付き自動配布 | 校正済み見積りを順位へ反映（権限不変） | 校正済み見積りを順位へ反映（権限不変） |
| 4階層チケット・合流 | L4入力から4階層・予約・takeover・合流 | L2/上流変更からの再compileも統合 | L2/上流変更からの再compileも統合 | L2/上流変更からの再compileも統合 | L2/上流変更からの再compileも統合 |
| 安全境界 | 対象作用の隔離/送信/secret/replay/回復受入 | 対象作用の隔離/送信/secret/replay/回復受入 | provider変更時にも再確認 | provider変更時にも再確認 | 全対応profileの統合攻撃/回復検証 |
| 管理責任・委任 | 失効・takeover・旧policy認可を機械強制 | 失効・takeover・旧policy認可を機械強制 | 失効・takeover・旧policy認可を機械強制 | 失効・takeover・旧policy認可を機械強制 | 失効・takeover・旧policy認可を機械強制 |
| 自動バグ修正 | 限定BugBot→独立検証→通常admission | 限定BugBot→独立検証→通常admission | 限定BugBot→独立検証→通常admission | 対策資産を再利用し再発を追跡 | 対策資産を再利用し再発を追跡 |
| 工程単位の回復 | BugBotが共通回復を利用 | BugBotが共通回復を利用 | BugBotが共通回復を利用 | BugBotが共通回復を利用 | BugBotが共通回復を利用 |
| 要求・PoC・製本 | 必要参照と表示面のprototype | 暫定要求/discovery/S4/画面/製本/compileを統合 | 暫定要求/discovery/S4/画面/製本/compileを統合 | 暫定要求/discovery/S4/画面/製本/compileを統合 | 暫定要求/discovery/S4/画面/製本/compileを統合 |
| 還流・影響再計画 | incident fenceと既存Reverse接続 | 集約/batch decision/再compile/再配布 | 集約/batch decision/再compile/再配布 | 集約/batch decision/再compile/再配布 | 集約/batch decision/再compile/再配布 |
| 論理role/provider-native | 配布は共通roleを参照、native旧定義はadapter化 | 配布は共通roleを参照、native旧定義はadapter化 | native生成を既定・手書き二重writer停止 | native生成を既定・手書き二重writer停止 | native生成を既定・手書き二重writer停止 |
| 単一providerの独立review | 現行基準を維持、新緩和を有効化しない | 現行基準を維持、新緩和を有効化しない | 分離/反証/補償統制を受入後に利用可能 | 分離/反証/補償統制を受入後に利用可能 | 分離/反証/補償統制を受入後に利用可能 |
| モデル進化に応じたcontext削減 | 隔離比較と承認した限定削減 | 隔離比較と承認した限定削減 | model/runtime更新に伴う再評価 | 条件付き注入/rollback/継続縮退 | 条件付き注入/rollback/継続縮退 |
| 実トラブルの対策化 | 修理結果・再発を記録 | 修理結果・再発を記録 | 修理結果・再発を記録 | CASE/適用条件/校正/退役まで循環 | CASE/適用条件/校正/退役まで循環 |
| 旧機構の退役 | 対象active旧writer停止 | PLAN/Reverseのwriter切替 | 旧native role writer停止 | context/skill条件付き退役 | 全MIG監査、残す互換readerにowner/期限 |
| 構想v4の完成判定 | capability単位の適用開始 | capability単位の適用開始 | capability単位の適用開始 | capability単位の適用開始 | 全要求・追加要求・移行/consumer統合受入 |

## 詳細

| capability（計画内ID） | 詳細 |
|---|---|
| CAP-LICENSE UT本体のライセンス | [参照](../migration/04_LICENSE_BOUNDARY.md) |
| CAP-UPDATER consumer更新・rollback | [参照](../migration/02_CONSUMER_UPGRADE_AND_ROLLBACK.md) |
| CAP-JSON 共通JSON正本 | [参照](../migration/01_AUTHORITY_AND_RECORDS.md) |
| CAP-VIEW 表・図・人間の齟齬受付 | [参照](../migration/03_COMPONENT_CUTOVERS.md) |
| CAP-CI 低コストconsumer CI | [参照](../workstreams/02_CI_AND_COST.md) |
| CAP-FORECAST 作業順序・所要予測 | [参照](../workstreams/01_SCHEDULING.md) |
| CAP-DISPATCH 実際の自動配布 | [参照](../workstreams/01_SCHEDULING.md) |
| CAP-TICKET 4階層チケット・合流 | [参照](../releases/R05_0.5.0.md) |
| CAP-SECURITY 安全境界 | [参照](../workstreams/03_SECURITY.md) |
| CAP-GOVERNANCE 管理責任・委任 | [参照](../workstreams/04_GOVERNANCE.md) |
| CAP-BUGBOT 自動バグ修正 | [参照](../workstreams/06_BUGBOT.md) |
| CAP-RECOVERY 工程単位の回復 | [参照](../workstreams/06_BUGBOT.md) |
| CAP-UPSTREAM 要求・PoC・製本 | [参照](../releases/R07_0.7.0.md) |
| CAP-BACKFLOW 還流・影響再計画 | [参照](../migration/01_AUTHORITY_AND_RECORDS.md) |
| CAP-ROLE 論理role/provider-native | [参照](../migration/03_COMPONENT_CUTOVERS.md) |
| CAP-SINGLE 単一providerの独立review | [参照](../releases/R08_0.8.0.md) |
| CAP-CONTEXT モデル進化に応じたcontext削減 | [参照](../workstreams/05_CONTEXT_AND_INCIDENT_LEARNING.md) |
| CAP-LEARNING 実トラブルの対策化 | [参照](../workstreams/05_CONTEXT_AND_INCIDENT_LEARNING.md) |
| CAP-RETIRE 旧機構の退役 | [参照](../migration/00_REPLACEMENT_MATRIX.md) |
| CAP-V4 構想v4の完成判定 | [参照](../releases/R10_1.0.0.md) |
