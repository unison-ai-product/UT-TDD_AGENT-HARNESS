# 既存コード面・契約族ごとの入替先

この表は着手先を具体化するための**移行対象inventory案**。既存pathは前版の実読またはPR #517の固定HEAD調査に基づき、新方式の責務は今回の提案。現mainの全fileを網羅した削除manifestではない。実作業では対象tree、reader/writer/consumer一覧、ownerを再確認してSL/PLANへ束縛する。新module名だけを大量予約せず、既存責務へ実装する。[GH-PR517-PLAN][GH-PKG][GH-CI][GH-U23]

## 1. どの面を改訂するか

| 既存面・識別子 | 旧方式の役割 | 新方式の責務と切替版 | そのまま残す境界 |
|---|---|---|---|
| `LICENSE` / `package.json` / Packの対応表示 | source MIT / 配布表記 | R01で対象UTコードMPL、source取得方法とthird-party区分 | old tag・配布許諾・他者notice |
| `docs/governance/ut-tdd-agent-harness-concept_v3.1.md` / #517候補 | 現行authorityと未承認v4 | R01でtarget採択、R03から対象capability、R10でactive互換面監査 | v3.1由来の未置換scopeを勝手に無効化しない |
| `docs/plans/**` のstatus/dependencies/review_evidence | narrativeと制御metadataの同居 | R03 reader/adapter、R05触るactive対象、R07 active全体を正規移行、R10旧writer停止確認 | narrative・ID・V-pair・旧履歴 |
| `plan_id_reservation_events` / `plan_id_reservations` | 既存予約・排他・再実行 | R03共通操作へのadapter、R05編集前予約・ticket統合 | #480のtransaction/replay、一意性。別番号DBを作らない |
| U23（PLAN-L4-30/L5-23/L6-83〜85） | Execution Episode / outbox/inbox / projection | R05人間・AI割当、stage別計画と実行、R07全上流compile | event/inbox/outboxの責務、GitHubはprojection |
| `.ut-tdd/review/receipts` / review_evidence / review wrapper | exact-headレビュー保管 | R03型・judgement接続、R05attempt/訂正/終端/独立admission | 元FLAG/receipt/subjectと発行根拠 |
| `.ut-tdd/memory` / `src/memory` / `src/runtime/claude-memory-wake.ts` | 知識・連絡・通知 | R00現行project隔離、R03record参照、R05通信回復、R09知識の寿命管理 | project/blind分離、監査証拠 |
| `.github/workflows/harness-check.yml` | UT sourceの全回帰とaggregate | R04検証責務/証拠契約を先に改訂して重複を整理 | source検査自体をconsumer費用の名目で無差別削除しない |
| `docs/templates/github/common/pack-harness-check.yml` とsetup側生成処理 | Pack smoke / 導入側への配布面 | R04 source/Pack/consumerの差分inventoryと既存CI合流 | consumerの元workflow/権限/保護を尊重 |
| `scripts/run-vitest-snapshot.ts` / snapshot-stage timing | 隔離検証・時間計測 | 計測と通常修理は先行、R04準備重複と選択検証を評価 | 参照snapshot保護、cleanup失敗を成功扱いしない |
| `src/export/document-export.ts` | dataset/hash/CSV・Markdown基礎 | R04実際の表・図・discrepancy往復、R07全上流面 | source digestと出力digestを混同しない |
| `.claude/agents/*.md` / `.claude/hooks/agent-guard.ts` / `src/team/delegation-routing.ts` | native役割とroutingの二重定義 | R03論理roleの最小型、R05共通guard、R08native定義を生成し旧writer停止 | domain知識はskill、独立reviewとtool制約 |
| `skills/` / `src/skill-engine/` / `CLAUDE.md` / `AGENTS.md` | 適用知識・運用説明 | R03packet計測、R04限定ablation、R09最小packet/対策/退役 | current要求/AC/安全義務、共通route入口 |
| `src/setup/update-check.ts` / PLAN-L6-63系列 | tag advisory / 配布契約 | R02 channel→sealed plan→approval→switch→回復 | stateとruntimeの分離、A/B独立 |

## 2. record/schema族の版間互換をどう管理するか

packageのminorとschemaの版を同じ数字にしない。familyごとに`schema_id / schema_revision / readable_versions / writable_version / migration_ref / source_authority`をmanifestへ持たせる案。実際のID/版番号はR03で既存schemaと照合して採択し、本資料が勝手に既存DBのschema versionを進めることはしない。

| 契約族 | R03の到達点 | 能動利用を閉じる版 | 新旧writerの境界 |
|---|---|---|---|
| project/actor/decision/policy | 信頼する発行者、scope、revision、認可された更新 | R03レコード認可、R05実行時委任/失効 | 同一role変更を新policy自身で自己認可しない |
| requirement/design/AC reference | 正規ID・版・digest、本文/typed blockの参照 | R03既存参照、R07 discovery/製本 | 正本の本文をlossyなJSON要約で置換しない |
| finding/judgement/evidence | 事実/仮説/判定/保管/検証の別、既存producer接続 | R03、後続種類も同契約 | record無しのadmissionを拒否。昔のraw logを承認にしない |
| verification plan/result | 必要集合、環境、選択理由、actual結果 | R04 | 選択計画と実行結果を分け、skipをPASS化しない |
| work item/admission/attempt | 階層、owner、義務、予算、試行・訂正・終端 | R05 | 対象scopeで旧割当/直merge writerを停止 |
| schedule/estimate/resource | 観測と仮説、as-of、幅/unknown、policy入力 | R04予測、R05dispatch、R09校正 | proposalの発行はleaseを発行しない |
| discovery/PoC/prototype/backflow | 共通参照・イベントの必要最小型 | R07 | active上流のwriter切替。旧Reverseは履歴/生成viewへ |
| role/capability/adapter | 共通roleと証拠義務の必要最小 | R05既存adapter、R08native生成 | native手書きとrecordの双方を正本にしない |
| knowledge/context/countermeasure | 元incident、model/task、packet、退役参照 | R09 | 旧skill/proseの常時注入を対象ごとに停止、履歴保持 |

## 3. 新規導入・既存導入・旧版取込を別々に受入する

新規導入はその版のaccepted schemaとdefault capabilityから開始する。既存導入は元version/active作業/pending event/DB/Memory/CI/権限のinventoryから移行planを作る。旧版取込はreadonlyで未知を明示し、writerを有効にする前に必要な段階移行を行う。

各族は、旧のみ・新のみ・移行中・旧runtimeが新recordへ触れるケースを試験する。後方互換readerがあることと、旧writerを許してよいことを区別する。原則はexpand（読取対応）→移行→一writer切替→contract（旧能動面停止）。

切戻しは単にschema番号を下げる操作ではない。新しく受理したevent/権限失効/外部副作用を旧版が表現できるか検査し、不可能ならwrite停止＋forward repairを選ぶ。検証なしの自動DB downgradeは行わない。
