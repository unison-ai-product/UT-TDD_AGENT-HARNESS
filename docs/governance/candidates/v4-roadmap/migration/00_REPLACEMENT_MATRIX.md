# 新旧置換・維持・退役マトリクス

生成元：data/migration_manifest.json。各Rは[版一覧](../01_RELEASE_MATRIX.md)参照。defaultは対象scope/consumerでの承認済み切替であり、全導入先への自動適用ではない。退役審査版でも証拠不足なら削除せず理由と残存ownerを記録する。

旧writer停止は対象recordの旧書込み停止を指す。licenseや既定policyは「旧規定を新規配布へ適用しない開始点」であり、既存許諾の取消しではない。併存期間でも同一recordの二重writerは許さない。

| ID/領域 | 旧 → 新 | 準備 / 既定 / 旧writer停止 / 退役審査 | 残すもの |
|---|---|---|---|
| MIG-01 license | 本体MIT・Packの対応表示 → 権利処理済みUTコードをMPL-2.0へ | R01 / R01 / R01 / R01 | 過去MIT許諾/asset、第三者の元notice |
| MIG-02 authority | v3.1正本参照とv4候補 → v4 target＋有効capability/実装・受入状態 | R01 / R03 / R10 / R10 | 未移行scopeの旧契約、正規V-pair/routeFiling |
| MIG-03 record | 既存file/Markdown/実行ledgerの正本所在 → record classごとのJSON正本と共通writer、DBはprojection | R03 / R03 / R07 / R10 | Markdown narrative、legacy reader、元record履歴 |
| MIG-04 PLAN | frontmatterが状態/依存/reviewを保持 → 対象active PLANのrecord化frontmatter＋本文参照 | R03 / R05 / R07 / R10 | 歴史PLAN本文/ID/pair/source証拠、readonly loader |
| MIG-05 custody | request/attempt/receipt欠損や孤立の個別回復 → typed terminal/correction世代と共通admission | R02 / R05 / R05 / R10 | 原request/FLAG/旧receiptとそのHEAD |
| MIG-06 Memory通信 | worktree/provider別root・通知状態の分散 → project identity束縛のbusと共通delivery/terminal | R00 / R00 / R00 / R03 | 本来のproject固有記憶と過去delivery履歴 |
| MIG-07 予約/チケット | 手選択PLAN番号と断片的割当 → U23共通work item/予約と原子lease | R03 / R05 / R05 / R10 | 既存予約domain/operation_id、旧PLANの参照 |
| MIG-08 作業順序 | 依存/WIPはあるが順序予測契約が未具体化 → proposal→actual readiness→制約付きdispatch | R03 / R05 / R05 / R10 | 人間の優先順位policy、手動例外の理由 |
| MIG-09 consumer CI | 固定workflow/既存CIとの重複 → verification planとrisk/予算に応じた選択実行 | R03 / R04 / R04 / R10 | full fallback・release全受入・必要なOS検証 |
| MIG-10 view | 断片的export/手更新の表/図 → source identity付きspreadsheet/図・discrepancy受付 | R03 / R04 / R04 / R07 | 独立narrative/旧snapshot、viewは編集受付と表示を分離 |
| MIG-11 role | 手書きnative agent＋routing/guardの二重定義 → 論理role record→provider-native生成 | R03 / R08 / R08 / R10 | 既存の権限/証拠義務、readonly旧定義 |
| MIG-12 context | 一般説明・全履歴・重複tool出力の蓄積 → 最小contract packetと条件付きretrieval | R03 / R09 / R09 / R10 | 現在の要求/AC/HEAD/安全、監査履歴 |
| MIG-13 知識資産 | memory/skillの無期限proseと手整理 → applicability/寿命/実録provenance/quarantine | R03 / R09 / R09 / R10 | 引用元・旧対策と後継・事故record |
| MIG-14 Reverse | PLAN/REVERSE文書対をレーン別管理 → backflow record＋影響集合＋文書projection | R03 / R07 / R07 / R10 | narrative設計判断・元V-pair・履歴 |
| MIG-15 updater | tag advisory＋手動更新 → channel plan/承認/generation switch/rollback | R01 / R02 / R02 / R10 | 旧normal generation、必要source、consumer state |
| MIG-16 worktree | 放置branch/dirty/未pushの個別対処 → owner/lease/ancestor/cleanに基づくGC plan | R03 / R05 / R05 / R10 | 未merge/dirty/未push/active leaseは保持 |
| MIG-17 security | prompt/協調scopeに寄った制約 → モデル外認可・実行/送信/情報/証拠隔離 | R01 / R05 / R05 / R10 | 有効な旧保護とincident手順 |
| MIG-18 管理 | 暗黙兼務/代理/例外 → 人間owner・旧policy認可・委任失効・read-only管理view | R01 / R05 / R05 / R10 | 単独運用の明示例外、human authority |
| MIG-19 適応/モデル | 上方向tier選択と手動見直し → calibration・下方向routing・対策寿命 | R03 / R09 / R09 / R10 | 独立判断の最低要件と受入済みprofile |
| MIG-20 schema/互換面 | 旧field/token/schema/archiveがactive surfaceへ残る → inventoryと移行receiptで原子的に退役 | R03 / R09 / R10 / R10 | 履歴/readonly import/第三者表示 |

## 置換しないもの
TypeScript/Node、L0-L14、正規V-pair、Forward/Reverse/Recovery、routeFilingの責務、独立検証、Git成果物の事実、consumerの主権は継承する。R07のReverse record化はworkflow自体の廃止ではない。MPL切替はsource公開方針でありlicense管理Botの新設ではない。

## scope別移行record
各MIGの対象file/record集合、元/先digest、writer世代、変換器version、authority、実測、rollback可否はdata/migration_manifest.jsonを入口に下流PLANで確定する。ここには架空の実行済みreceiptを入れない。
