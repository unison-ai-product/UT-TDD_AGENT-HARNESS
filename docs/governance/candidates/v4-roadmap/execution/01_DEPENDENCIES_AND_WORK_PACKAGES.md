# 開発依存とPR分割

版の公開順と実装の着手順を区別する。R02の運用基盤とR03の契約開発はR01後に並行可能。BugBotの実装/有効化はR03＋R05の共通契約/安全受入後。高度な予測校正R09をR05の配布開始条件にはしない。

| 版 | 開発開始に必要な受入 | 公開前提 |
|---|---|---|
| R00 0.2.0-canary.1 | 現行M0入力 | 現行GO条件 |
| R01 0.2.0-canary.2 | R00 | R00 |
| R02 0.2.0 | R01 | R01 |
| R03 0.3.0 | R01 | R02 |
| R04 0.4.0 | R03 | R03 |
| R05 0.5.0 | R04 | R04 |
| R06 0.6.0 | R05 | R05 |
| R07 0.7.0 | R05 | R06 |
| R08 0.8.0 | R05, R07 | R07 |
| R09 0.9.0 | R06, R07, R08 | R08 |
| R10 1.0.0 | R02, R03, R04, R05, R06, R07, R08, R09 | R09 |

## 開発DAGの要点

```text
R00 → R01 ┬→ R02（更新・A/B stable）──────────────────────┐
          └→ R03 JSON → R04 CI/view/予測 → R05 配布/安全 ├→ R10 統合
                                             ├→ R06 BugBot ─┤
                                             └→ R07 上流 → R08 native ─┤
                                                      R06+R07+R08 → R09 学習/校正 ┘
```

これはタスク完了予測ではなく設計上のHARD依存。各scopeの成果を先行して開発する場合も、受入が必要な有効化を前倒ししない。

## PRの切り方

各SLは作業パッケージであり、GitHub Issue/PLAN採番は未実施。現行責務と重複するなら既存Issue/PLANへ接続する。SL内部は必要に応じ「契約/pair-freeze」「実装＋対になるtest」「移行」「有効化/旧経路停止」へ分割する。1PRの中で未承認方式の実装とauthority昇格を混ぜない。

source/context/JSONの変更を全レーンで同時に始めず、writer/インターフェース契約を先に固定し、非競合の実装へ配る。CI/reviewer枠を見ずにPRを大量投入しない。最終review前にbaseを固め、merge直列区間を短くする。

## 作業パッケージ一覧

| ID | 成果 | 検証 | 先行SL |
|---|---|---|---|
| SL-R00-01 Bun/Memory残務を現行契約で閉じる | 既存#487/#424・対応PLANを再読し、未実装と既対応を区別 | 現行回帰と正負oracle | 版の開発前提 |
| SL-R00-02 clean releaseから再現 | source checkout削除後の両OS fixture | release identityに束縛した#418証拠 | SL-R00-01 |
| SL-R01-01 権利/適用境界の棚卸し | 著作権・コピー・依存・生成物の一覧、除外と根拠 | 権利判断と対象集合 | 版の開発前提 |
| SL-R01-02 ライセンス整合切替 | 本体/Pack/license metadataの一括整合 | 表示/対象source取得の確認 | SL-R01-01 |
| SL-R01-03 管理とtarget authority採択 | 寄稿・公開・例外・supported範囲、#517差分 | 採択recordと旧新参照表 | SL-R01-02 |
| SL-R02-01 候補解決と承認 | #481 resolver/plan/approval slice | malformed/無承認でwrite 0 | 版の開発前提 |
| SL-R02-02 取得・切替・回復 | staging/digest/Windows lock/migration gate | 各phase fault injection | SL-R02-01 |
| SL-R02-03 A/B system受入 | 異版・片系故障・再開・auditor | 両OSと非著者closing | SL-R02-02 |
| SL-R03-01 契約inventoryとslice設計 | 既存JSON/ledger/schemaと重複照合、source id/版/意味の表 | 旧新参照の抜けゼロ | 版の開発前提 |
| SL-R03-02 reader/writer/validator実装 | validate/read/propose/admit/replayの共通論理操作 | 型・認可・revision・再試行の正負oracle | SL-R03-01 |
| SL-R03-03 record移行pilot | 限定した新規とactive recordを移行、旧writer fence | 同値性/再構築/中断切戻し | SL-R03-02 |
| SL-R03-04 小さい人間向け面のprototype | schemaに沿う異常系fixtureとfindingを人が記録 | 後続viewの要求を確認 | SL-R03-03 |
| SL-R04-01 baselineと影響選択 | 代表private consumerの変更系列、既存workflow inventory | 見逃しと費用の同分母比較 | 版の開発前提 |
| SL-R04-02 view往復 | 正本更新→生成→discrepancy→承認→再生成 | 改変/旧revision/権限外編集拒否 | SL-R04-01 |
| SL-R04-03 順序予測のshadow | SCHED-01〜14と固定fixture、ready集合と合流見込み | 実績と予定の分離・依存違反0 | SL-R04-02 |
| SL-R04-04 CI/default profile切替 | 導入先dry-runと承認、同一HEAD/attemptを照合 | 既存保護を維持したpilot | SL-R04-03 |
| SL-R05-01 排他/回復を先に受入 | 競合する2 process/2 clone、期限切れ、ack-loss | exactly-one winnerと再開 | 版の開発前提 |
| SL-R05-02 ticket/compiler/admission接続 | 既存U23/PLAN/FSM、root例外、操作lease区別 | 合法/禁止遷移 | SL-R05-01 |
| SL-R05-03 scheduleを実配布へ接続 | proposal/dispatchを別処理にし、CAS時に再検査 | stale planで副作用0 | SL-R05-02 |
| SL-R05-04 資源・安全・合流受入 | review/CI/人間capacity、異project隔離、refactor境界 | 通常仕事と攻撃/故障からの回復 | SL-R05-03 |
| SL-R06-01 read-only検出とrepair policy | 対象バグ種別/除外scopeを宣言 | 検出精度とルール無複製 | 版の開発前提 |
| SL-R06-02 dry-runと再現 | 正常・再現不可・契約矛盾を切り分け | 許可前にソースwrite 0 | SL-R06-01 |
| SL-R06-03 限定writeと受入 | 小scope実装、回帰、独立review、通常merge | R05ゲート通過が必須 | SL-R06-02 |
| SL-R06-04 再発/原価観測 | 全attempt・CI・人手・fallback | 局所成功を全体品質と偽らない | SL-R06-03 |
| SL-R07-01 intake/discovery/PoC | 既存IR/routeに接続しS4と暫定状態を実装 | human authority正負oracle | 版の開発前提 |
| SL-R07-02 screen/製本 | 同形fixture、異常系、light必須とchecklist整合 | 正常/異常画面と意味照合 | SL-R07-01 |
| SL-R07-03 backflow/recompile | dedupe/fence/差分集合/上流batch判断 | 影響集合の完全性 | SL-R07-02 |
| SL-R07-04 active PLAN/Reverse移行 | 既存ID/pair/historyの保持 | 一正本・read-after・回復 | SL-R07-03 |
| SL-R08-01 role同値化 | 現行tools/floor/権限/closing義務の棚卸し | 旧新生成差分を検証 | 版の開発前提 |
| SL-R08-02 adapter/guard切替 | 生成定義とdrift拒否 | authorがroleを自己緩和できない | SL-R08-01 |
| SL-R08-03 profile受入 | blind session・namespace・oracle再実行・sampling | 各profile正負証拠 | SL-R08-02 |
| SL-R08-04 能力drift反映 | モデル更新の比較/制限/不明値 | schedule/contextへ影響範囲のみ通知 | SL-R08-03 |
| SL-R09-01 対策assetとcalibration | 入力/結論/後続結果/owner/寿命を接続 | CI成功だけをGoldにしない | 版の開発前提 |
| SL-R09-02 context ablation比較 | 同modelで文脈差、別にmodel更新差を測る | 独立holdout/攻撃/正常系 | SL-R09-01 |
| SL-R09-03 限定昇格/退役 | shadow→人間採否→限定rollout→監視 | 悪化で旧検証済みpacket | SL-R09-02 |
| SL-R09-04 予測改善 | 計画当時の入力固定、外れ/未完了も集計 | baseline比較とcalibration | SL-R09-03 |
| SL-R10-01 機能別受入を閉じる | trace/AC/追加条件の欠落検査 | 受入証拠のcoverage | 版の開発前提 |
| SL-R10-02 legacy移行と統合 | 実稼働データcopy、pending operation、別PC、A/B | 移行/失敗/回復の実測 | SL-R10-01 |
| SL-R10-03 契約安定化とrelease | CLI/JSON/manifest/help/ライセンス/保守を照合 | 必要CI/独立review/人間GO | SL-R10-02 |

## 完了の記録

各SLに設計/実装path、test id、run/subject、review receipt、migration evidence、有効化policy版を後で結ぶ。空欄を「済」と補完しない。Rは全必須SLと統合受入・rollbackが成立してから昇格。PR mergeだけで版の受入を完了にしない。
