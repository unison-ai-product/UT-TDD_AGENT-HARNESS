# 正本・JSON・旧新writerの移行手順

対象：MIG-02/03/04/05/07/14/18/20。実施版：R03の基盤、R05の実行、R07のactive範囲完了、R10の旧能動系退役。

## 1. 形式変換とauthority移行を分ける

JSONへ転記しただけでは正本は変わらない。record classごとにauthority source・writer epoch・旧→新ID対応・正本化条件を宣言する。narrativeの要求/設計本文はMarkdown＋typed blockを維持する。DBは受入済みevent/fileから再生成可能なquery projectionへ寄せるが、現行ledgerを影響分析なしに単なるcacheへ変更しない。

特に#480の予約は既存のtransactional ledgerをauthorityとする前提がある一方、v4候補はfile正本を要求する。この差を隠さず、下記の共有裁定adapterと原子的イベント受理を設計・受入してから対象scopeを移す。準備中は旧ledgerだけが権限を持つ。[GH-480][GH-PR517-FR]

## 2. 移行state machine（計画案）

`inventoried → shadow_read → equivalence_verified → write_fenced → transformed → reconciled → new_writer_active → legacy_read_only → retirement_eligible`

failureは明示状態として記録し、後続へ飛ばさない。各ステップの主体は共通migration/admissionであり、モデルがファイルを書いただけでは成立しない。

| 段階 | 実操作 | 証拠/中断時 |
|---|---|---|
| inventory | 対象id/path、元bytes/hash、参照、active/pending/historyを確定 | 不明な件数/消費者はunknown、移行対象から隠さない |
| shadow | 旧正本を新readerで読み、機械表現だけ作る | 副作用/新approvalなし。変換できないものをquarantine |
| equivalence | ID・内容・判定・参照集合を比較 | prose解釈差は人間へ。差分0は形式同値の範囲を明示 |
| fence | 対象scopeの新規writeを止め、active operationをdrain/checkpoint | global停止ではなく影響scope。lease保有者へ通知 |
| transform | 一時領域へ変換し元/先digest、変換器版、schemaを固定 | 再試行は同じoperation idで同じ結果 |
| reconcile | 正本・event・DB/view再構築と高水位点を照合 | 欠落/重複/参照切れなら切替不可 |
| activate | 新writer epochを一度だけ採択、旧writerを拒否 | read-afterで実際の採択を確認してから再開 |
| retire | 利用消費者と互換期間の受入後に旧能動経路を停止 | 歴史reader/source/noticeは必要な限り保持 |

## 3. 分散裁定の具体案

既定提案は**既存U23の論理的な単一control writer＋共有Git上のappend-only control eventを原子的に採択するadapter**。新しい有料DB/常駐SaaSを必須にしない。新stateは受理済みJSON eventからreplayし、DBはそのprojectionとする。control用ref/格納先の実名称は下流設計で決めるが、一般のmain作業branchと混ぜない。

候補処理は観測したcontrol tipを基に合法性・権限・command digestを検査し、新commit/eventを作り、non-force fast-forwardの原子的更新で受理する。競合した候補は最新tipで再評価し、成功者をread-afterで確定する。任意のactorがeventを置いたことだけではgrantにせず、trusted control writerの認証/検証済み発行根拠を要求する。branch保護が使えない環境でも偽grantを受理しない仕組みを受入する。単なるhashは認証ではない。

これは実装済み方式の主張ではなくADR候補。既存ledgerの原子性・append-only・非信頼入力拒否・障害時再開と同等以上であることを2 clone/通信断/ack-lossで証明できなければ採用しない。Git API使用量と計画/イベント費用も測る。制御eventの更新ごとに製品全回帰を起動する構成は避けるが、正規のcontrol admission検証は省かない。

単一機内は既存transactionを利用してよいが、それをそのまま複数cloneの分散lockと呼ばない。共有裁定へ到達できないときは新規の排他write/grantを停止。署名済みのオフライン委任を別設計なしに追加しない。閲覧・検出・独立した無副作用の分析は継続可能。

## 4. PLAN/Reverseの移行単位

- R03：新record型とlegacy adapter、移行対象一覧を作る。旧PLAN全文の一括変換はしない。
- R05：新機能が触るactive PLANについて、専用Reverse対でfrontmatter状態/依存/reviewをrecord化。本文はdigest参照。旧frontmatterがgenerated表示になった対象は直接編集拒否。
- R07：v4運用に参加するactive PLAN/Reverseの対象集合を閉じる。移行していない歴史文書はreadonlyで参照し、その値を現在のauthorityとして再浮上させない。
- R10：active scopeの旧writerが残っていないことを検査。archive/readonly importを残すことは不完全移行ではない。

承認/decision/review履歴を「変換したから新たに承認済み」にしない。元のsubject・時刻・主体・有効期限・用途を維持する。失効済みのapproval/lease/receiptを新schemaへ移して復活させない。

## 5. rollbackの限界

新writer有効化前は一時成果物を捨て旧正本へ戻せる。有効化後は新しいeventと外部作用があるため、古いsnapshotへの単純restoreは禁止。writer停止→高水位点と新規event保存→逆変換/旧reader互換検査→適合時のみ復帰。非互換ならreadonlyで保持し、forward repairを行う。データ破棄や外部merge取消を「原子的rollback」と表示しない。
