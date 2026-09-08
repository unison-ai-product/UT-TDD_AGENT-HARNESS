# 実装前の契約衝突を解く（本案の推奨結論）

「後で検討」だけで放置せず、推奨案と受入・決定期限を示す。まだPOの承認や正式ADRへ代入したものではない。

| ID | 衝突/論点 | 本案の推奨 | 決定までに必要なもの / 期限 |
|---|---|---|---|
| DEC-01 | 構想v4とpackage0.2の番号 | 構想v4到達=package1.0案、途中は0.3〜0.9 | 既存tag衝突確認・version採択 / R01 |
| DEC-02 | file正本と既存transactional予約ledger | 旧は移行前authority、共通event/一control writer/CAS adapter受入後に切替 | 2clone/通信断/ack-loss/認証・費用試験 / R03設計、R05有効化 |
| DEC-03 | L4作業追跡とL4をticket化しない条項 | L4のnarrative ownerは一人、文書を追跡するassignmentとL5以下実行ticketを区別 | FR-004/029/035/AC-038整合 / R03 |
| DEC-04 | 全ticketが親必須なら最上位が成立しない | 大=rootは親無し、非rootだけexactly-one、階層飛ばし拒否 | FR-036/AC-047にroot例外を明示 / R05 |
| DEC-05 | 原子だけpath leaseだがadmissionにもlease | コードpath leaseと操作認可leaseを別型で区別 | FR-005/036/054と負系整合 / R03設計、R05強制 |
| DEC-06 | strict rebase/exact-headと再review連鎖 | 初期はcandidate安定化とmerge直列区間、証拠継承はdefault off | 導入するなら同等性証明の別ADR/AC / R04〜R05 |
| DEC-07 | lightで必須4要素だが製本にchecklist必須 | 全profileに機械生成の最低checklist、deepだけ列網羅/独立Gold追加 | FR-056/057とAC-068/069/070整合 / R03プロト前 |
| DEC-08 | 中のrefactorゲートが無意味なコード変更を強制 | 検査は必須、違反無しは根拠付きno-change、必要時のみ修正ticket | FR-052/053/AC-064/065の採択 / R05 |
| DEC-09 | 単一episode昇格禁止と重大欠陥即修理 | 局所修理/封じ込めと汎用policy昇格を別操作 | FR-010とrepair/incident AC / R05前 |
| DEC-10 | view直接編集禁止とシート編集要求 | 表示はreadonly、編集提案surface→discrepancy→admission | source/renderer digest、権限/旧revisionの負系 / R04 |
| DEC-11 | v4宣言で未実装ルールが全面有効化 | target conceptとactive capability/移行scopeを分離 | authority/read orderとmanifest gate / R01〜R03 |
| DEC-12 | 2,000分・soft budgetと実行上限 | 通常目標+導入先の例外金額/上限、未検証PASS禁止 | 実契約/請求と必要検証scope / R04 |
| DEC-13 | 新モデルにするほどcontext削減する誤解 | 同条件ablationで範囲限定、必須契約は保持 | holdout/安全/全費用の事前閾値 / R04評価、R09昇格 |
| DEC-14 | 「人間統括」と自動順序判断 | 人間は優先度/予算/例外policy、通常ready順は決定的処理 | FR-034/050の管理判断と実行判断分離 / R05 |
| DEC-15 | roleか完全移行までBugBotが待つ循環 | R03最小role契約、R05既存adapter接続、R08全native生成 | capability/証拠の同等性 / R03〜R08 |
| DEC-16 | 古いイベントがある状態のdowngrade | write停止・高水位点・互換移行・新event保持、不可ならreadonly/forward repair | schema matrixとphase fault injection / R02〜全版 |

未解決なら対象機能/移行を有効化しない。ただし独立した責務の作業、既存経路の通常修理、無副作用shadowは継続する。すべてを一つの全体gateで止める設計にしない。
