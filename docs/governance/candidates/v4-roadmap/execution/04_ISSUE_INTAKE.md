# open issue の回収地点 (工程 ①〜⑪)

**2026-10-08 時点の open issue 157 件と、その後に起票した canary.6 の blocker #911 の計 158 件**を、閉じる工程へ割り当てた表です。工程の定義は [README](../README.md) の結論表、工程間の前提は [01_DEPENDENCIES_AND_WORK_PACKAGES.md](01_DEPENDENCIES_AND_WORK_PACKAGES.md) にあります。正本の決定は #530 のコメント 6051336079 (工程順) と 6051373331 (補足 4 点・前倒し 2 件) です。

## 読み方

- 「閉じる工程」は、その工程が終わるまでに閉じる (または close 判定する) という意味です。着手時期ではありません。工程をまたいで先に直してよいものは、従来どおり通常修理で直します。
- 割当は題名・ラベル・親子関係・本文冒頭から判断した計画です。各工程に入るときに本文を読み直し、変わっていれば本表を直します。
- GitHub の sub-issue 親子と矛盾させない規則: 子の工程は親の工程より後にしません。例外は下の「親子の矛盾」に挙げます。
- close 候補は理由を挙げただけで、閉じていません。閉じるかどうかは control が確かめてから決めます。
- 工程 ⑨ と ⑪ には、いま回収する issue がありません。⑨ の対象範囲と完了条件は ⑧ のうちに決めます (補足 3)。

## 件数

| 工程 | 件数 |
|---|---:|
| ① 現行リリースパック canary.6 | 7 |
| ①の受入後に ③ か ⑤ へ割り当てる | 6 |
| ② PLAN を設計へ反映し設計正本を凍結 | 28 |
| ③ canary.6 自己導入と別プロジェクト投入検証 | 16 |
| ④ 新ディレクトリ構成へ再編 | 7 |
| ⑤ リバースリファクタリング | 48 |
| ⑥ 要件再整理・凍結 | 17 |
| ⑦ テンプレート・スキル補強 | 10 |
| ⑧ 実装→内部デプロイ→リリースの反復 | 14 |
| ⑨ リバース工程 | 0 |
| ⑩ 設計正本の修正とフル Pack デプロイ | 1 |
| ⑪ 別プロジェクトのチーム投入 | 0 |
| close 候補 | 4 |
| 計 | 158 |

## 親子の矛盾

- #705 (V-model テンプレートの対応ルール) は #676 (工程 ①) の子ですが、内容はテンプレート補強 (工程 ⑦) です。#766 か #877 への付け替えを提案します (付け替えは control が判断)。

## 工程別の表

### 工程 ① (7 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #393 | #873 | review custody: 完了した判定が失われる 3 経路 (envelope parser の全行走査 / receipt に根拠を残さず verdict file を削除 / review-guard の他ランタイム誤帰責) | PO 決定で ① と並行に前倒し (6051373331) |
| #418 | #364 | S5 child: Pack-only upper-flow internal canary smoke (Windows/Linux) | canary.6 受入 (#418) の子 |
| #676 | #418 | Release consumer で開発を開始できない穴: identity / repo-root、生成物、skills と設計テンプレートの配送 (#418 子) | canary.6 受入 (#418) の子 |
| #835 | #418 | Windows consumer の Claude SessionStart hook が 5 秒 timeout で cancelled になり session 記録が残らない (#418 子) | canary.6 受入 (#418) の子 |
| #890 | #835 | perf(session-start): Windows consumer の SessionStart が初回 21.8 秒かかり、同時に 2 つ目のセッションができる | 計測で canary.6 の blocker と判明したため ① に残す。#909 で修理済み |
| #911 | #418 | canary.6 blocker: model routing と agent guard の model ID を現行世代へ揃える | 別プロジェクトへの導入検証で判明した canary.6 の blocker |
| #894 | #530 | 確定した設計文書にテンプレートの記入欄 (<記入>) が残っていたら止める検査を入れる | PO 決定で ⑦ を待たず前倒し (6051373331) |

### ①の受入後に割り当てる (6 件)

①の完了条件には入れません。canary.6 の blocker ではないためです (6052098864)。canary.6 の受入結果を見て、③ か ⑤ の表へ移し、上の件数表も合わせて直します。

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #758 | #676 | Windows CI で release-consumer 系の同期 process テスト (U-RCDEV-005 / 026) が間欠的に status=null / ETIMEDOUT で落ちる | canary.6 の blocker ではない (6052098864) |
| #809 | #418 | pack-canary-acceptance の証跡を計測値にする (trace 件数・source 監査・credential env・runner digest) | canary.6 の blocker ではない (6052098864) |
| #821 | #364 | Pack の C1 で実行可能ファイルの mode 100755 が 100644 に落ちる (sync-pack / Windows commit) | canary.6 の blocker ではない (6052098864) |
| #880 | #418 | G1 が business / screen / P0 FR の集合が空のまま passed=true を返す。consumer で必須とする集合と診断理由を契約に定める | canary.6 の blocker ではない (6052098864) |
| #881 | #418 | canary.4 の tar.gz が無圧縮になっている (#834 で、stored ブロックの fixedGzip 経路に切り替わった回帰) | canary.6 の blocker ではない (6052098864) |
| #889 | #676 | consumer: 公開 asset から導入した直後の consumer で SessionStart の要約に design-quality-load-error / missing-projection が出る | canary.6 の blocker ではない (6052098864) |

### 工程 ② (28 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #102 | #98 | Recovery: legacy PLAN revision authoring欠落でRedesign supersessionが閉じない | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #108 | - | Redesign: 設計成果物にL別検証契約を必須化し完了誤判定を防止する | 旧 Redesign。② の仕分けで生存 / supersede / 廃止を判定 |
| #128 | #145 | Redesign: PLAN-L7-421 numeric core衝突をPlanAsset revision/rekeyで解消する | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #129 | #102 | Redesign: legacy PlanAsset genesis adoptionとIssue E4循環を解消する | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #134 | - | Redesign: retire Bun and migrate control plane to TypeScript/Node + Rust | 旧 Redesign。② の仕分けで生存 / supersede / 廃止を判定 |
| #136 | #108 | Design debt: make G9 system-test deferrals owned and exit-bound | 旧 Redesign。② の仕分けで生存 / supersede / 廃止を判定 |
| #143 | #129 | Recovery: seal PLAN-RECOVERY-16 rev1-5 and create rebase genesis asset | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #149 | #134 | Redesign D0: Node control plane and Resource Kernel design freeze | 旧 Redesign。② の仕分けで生存 / supersede / 廃止を判定 |
| #158 | #108 | add-design: 宣言済・未実装 oracle の Red-freeze record が無く design-freeze PR が構造的に green 不能 | 旧 Redesign。② の仕分けで生存 / supersede / 廃止を判定 |
| #164 | #874 | genesis revision 1 が receipts projection に非掲載で cross-asset 検証に限界 | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #209 | #874 | 自己 supersede の実データ 7 件が未修正 — admission_receipt の再発行で baseline を空へ縮小する (issue #183 の残債) | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #211 | #874 | cross-file の断線 (到達不能な export / ファイル) を誰も検出していない — 実測 134 件の値 export が参照ゼロ | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #367 | #874 | green_command の anchor_commit が実在検査されず、全 0 の 40 桁 hex でも通る | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #461 | #874 | green-command digestが到達不能なlocal-only anchor commitを恒久skipする | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #585 | #588 | ローカル ledger が main と不整合: primary の plan_revisions は 6 asset のみ、PLAN 改訂は worktree ごとの ledger で回っている | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #623 | #874 | No canonical path to archive a receipt-era PLAN (admission forbids archived while schema and lints accept it) | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #630 | #874 | PLAN schema cannot express a partial (slice-scoped) supersession, while route=redesign mandates exactly one supersedes | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #648 | #588 | v4: Canonical Contract + Derived Projection Architecture (同期を減らし、残った同期を drift 検出と生成に置換、同値の 2 箇所手書き禁止) | 設計正本と派生物の一本化 (設計書保護 gate の土台) |
| #711 | - | merge 時の自動 re-chain と、機械検証した簿記差分での再検免除で PLAN receipt の直列化を解消する | receipt chain の直列化解消 (移行を複数 PR で流す前提) |
| #718 | #711 | open PR の receipt・PLAN・コード衝突を事前に予告する read-only advisory（#711 の子） | receipt chain の直列化解消 (移行を複数 PR で流す前提) |
| #745 | #711 | review receipt に reviewer checkout の base / schema 版を記録し、古い環境の verdict を merge gate で無効化する | receipt chain の直列化解消 (移行を複数 PR で流す前提) |
| #749 | #711 | 同じ review request・同じ attempt に 2 本目の reviewer を起動できてしまい、verdict の identity が衝突する | receipt chain の直列化解消 (移行を複数 PR で流す前提) |
| #753 | #648 | 機械束縛の無い文書 (コア文書・ルール・workflow・skills・design) の鮮度を棚卸しし、将来は鮮度検査を仕組み化する | 設計正本と派生物の一本化 (設計書保護 gate の土台) |
| #832 | #874 | plan revise で frontmatter の sub_doc が黙って落ちる (PLAN-L6-105/106/107 で欠落) | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #848 | #789 | FR の退役を l6-fr-coverage が表現できない (退役 FR にも oracle / substance を要求する) | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #866 | #648 | PLAN テンプレートどおりに書くと用語更新・工程表の gate が無音で素通りする | 設計正本と派生物の一本化 (設計書保護 gate の土台) |
| #872 | #648 | SessionStart などの hook 設定が 3 か所に手書きされている（正本を 1 つにして、組み込みテンプレートを生成物にする） | 設計正本と派生物の一本化 (設計書保護 gate の土台) |
| #874 | - | PLAN 台帳と証跡 gate の整合: gate が表現できない・矛盾する・素通りする穴を塞ぐ | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |

### 工程 ③ (16 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #132 | #876 | runtime-env: AI CLI/拡張の設定ドリフトが無検査 (版ずれ/廃止キー/誤配置を同日 3 件実測、doctor 契約化 = PLAN-L6-92) | 自己導入前に runtime 設定とモデル指定を最新化 (V4D-097) |
| #364 | #224 | S5: clean Pack repository publication・2 consumer canary L12 E2E | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #481 | - | Consumer Pack updater: channel-aware検出・atomic generation switch・自動rollback | 自己導入の前提となる updater / rollback |
| #565 | #364 | S5 child: v0.2.0-canary.1 publication driver — production ports + CLI entry for PLAN-L7-519 adapter | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #624 | #364 | PR #608 process closure (three-remediation cap) and split refile plan for the Pack publication adapter slice (#565 PR-A) | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #625 | #624 | S5 publication adapter split 1: preparation receipt and intent | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #626 | #624 | S5 publication adapter split 2: admission observation binding | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #627 | #624 | S5 publication adapter split 3: admitted publish deny path | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #668 | #876 | Codex の project hook が args 非対応で全て無音失敗している (guard 無効化) | 自己導入前に runtime 設定とモデル指定を最新化 (V4D-097) |
| #733 | #876 | Claude 全 family のモデル指定を世代固定からエイリアスへ変え、Sonnet の推奨 effort を high にする | 自己導入前に runtime 設定とモデル指定を最新化 (V4D-097) |
| #735 | #876 | GPT 系 (Codex) の model id を CLI 経路で実測し、通る世代へ更新する | 自己導入前に runtime 設定とモデル指定を最新化 (V4D-097) |
| #792 | #481 | Pack 配布物に build provenance を付け、証明のない配布物を昇格させない | 自己導入の前提となる updater / rollback |
| #814 | #364 | consumer の upgrade で既存の設定・state を壊さずに新しい版へ変換する仕組み | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #815 | - | Pack 利用者がハーネスのトラブルを安全に issue 報告できる経路 (書き込みセキュリティを先行) | 別プロジェクトからのフィードバック経路 |
| #867 | #364 | 配布物の CLI version 表示が release とずれる（package.json は canary.1 固定、sealed consumer では 0.0.0） | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #876 | - | AI ランタイムの設定とモデル routing: 設定ドリフトの検知と、モデル指定の世代固定の解消 | 自己導入前に runtime 設定とモデル指定を最新化 (V4D-097) |

### 工程 ④ (7 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #236 | #875 | workspace hygiene の検査機構が無い — 共有メモリ 65 件が未追跡で他ランタイムに不可視、root に非規約エントリが堆積 | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #384 | #141 | Redesign: 作業用worktreeのowner・TTL・terminal receipt・安全回収をライフサイクル管理する | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #426 | #384 | P0: legacy worktreeをdry-run・quarantine・receipt付きで安全回収する | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #578 | #384 | ローカル残骸の一括整理: merge 済み branch 107 本・worktree 21 個・未 push branch 78 本・stash 6 件 (v4 切り替え後) | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #661 | #384 | 事故: worktree 削除が node_modules junction を辿り primary の node_modules を全消去 (2026-09-18 再発) | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #689 | - | 開発 repo に旧フレームワーク名 (HELIX) のファイル名・本文が残っている | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #696 | #689 | PLAN の保守改訂と rename 契約: legacy PLAN を正規経路で改訂・改名できるようにする (#689 の前提) | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |

### 工程 ⑤ (48 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #70 | #109 | Recovery: ut-tdd doctor full scope がローカルで長すぎる (10分超) — 再試行嵐の根本誘因 | CI / runtime 性能の責務分割 |
| #77 | #98 | snapshot fence が hybrid の相手ランタイム並行活動をテスト残留と誤帰責する (full suite 偽 Red) | CI / runtime 性能の責務分割 |
| #98 | #109 | Redesign: snapshot runner固定費をimmutable prepared cacheとI/O schedulerで再設計 | CI / runtime 性能の責務分割 |
| #109 | - | Redesign: GitHub CI を重要部分に絞って高速化・コストダウンし、内部 CI (ローカル gate) の精度を上げて開発速度を回復する | CI / runtime 性能の責務分割 |
| #124 | #98 | fix(runtime): bound Stop db-refresh memory and snapshot runner preparation | CI / runtime 性能の責務分割 |
| #218 | - | D2: merge gate 配線 — FLAG open / verdict 無し merge の機械 block (incident #210 の機構化) | review custody の信頼性 (実装を製本にした検証・修正) |
| #229 | - | 通知経路が Claude 片方向: Claude→Codex の即時配送が存在せず、parity gate も不在を検知していない | 通知経路。GUI 中心化 (2026-10-08) に照らして残すか判定 |
| #242 | #875 | memory-sync hard gate が CI では原理的に発火せず、共有メモリ 65 件の未配送を 2 週間検出できなかった | 手書き作業の自動化 (実装の整理) |
| #386 | - | review dispatch: Claude family の verdict file 書き込みが permission で拒否され receipt が書かれない (wrapper merge gate が Claude review PR で常に deny) | review custody の信頼性 (実装を製本にした検証・修正) |
| #401 | #873 | review-live: resolveRepositoryRoot の二重適用が残っている (#397 と同一クラス、PLAN-L6-101 §6-1 未達) | review custody の信頼性 (実装を製本にした検証・修正) |
| #421 | - | review request: 同一PR/HEAD/revisionの異memoryId分裂を実行前に拒否する | review custody の信頼性 (実装を製本にした検証・修正) |
| #427 | #450 | lint の shell 起動語判定を単一正本へ集約する (quote 非対応の誤検出/取りこぼしが 3 PR で再発) | Bun 到達経路の残存確認 (残れば修理、無ければ close) |
| #429 | #588 | review evidence の記録を手書き YAML から生成コマンドへ移す (順序制約と digest 意味論を機械が知っている) | 手書き作業の自動化 (実装の整理) |
| #437 | #873 | review custody gate の穴: request の author_family が実 commit author と照合されず、自己 review を通す | review custody の信頼性 (実装を製本にした検証・修正) |
| #439 | #421 | Incident: 閉じられない review request が同一 HEAD の merge gate を恒久 deadlock させる (typed retraction 不在、手動削除で回避) | review custody の信頼性 (実装を製本にした検証・修正) |
| #444 | #229 | Incident: Claude inbox の entry が終端状態を持たず、merge 済み作業の通知で再起床し続ける (184 件滞留、再起床 8 回中 7 回が完了済み) | 通知経路。GUI 中心化 (2026-10-08) に照らして残すか判定 |
| #450 | - | Bun permanent ban: Pack/consumer 実行面の Bun 到達経路を 0 にする (#408 close で宙に浮いた所有の回収) | Bun 到達経路の残存確認 (残れば修理、無ければ close) |
| #454 | #444 | review live-dispatch: generation marker がループ中に更新されず、稼働中の Claude が 15 分で stale 判定される (本日 3 件の取りこぼし) | 通知経路。GUI 中心化 (2026-10-08) に照らして残すか判定 |
| #460 | #873 | delegation review request writerが実在commit / PR HEAD束縛を迂回する | review custody の信頼性 (実装を製本にした検証・修正) |
| #479 | #873 | Forward scheduler: REBASE_REQUIRED判定とbounded auto-rebase episode | review custody の信頼性 (実装を製本にした検証・修正) |
| #493 | #873 | review custody: 11 経路が単一の attempt_outcome_indeterminate へ潰れ、失敗した attempt の残骸が同一 worktree の再試行を恒久的に塞ぐ | review custody の信頼性 (実装を製本にした検証・修正) |
| #494 | #875 | Claude wake: 手書き memory (frontmatter 欠落) が memory reader を fail-close させ、review 依頼 13 件が Claude に一度も surface されなかった | 手書き作業の自動化 (実装の整理) |
| #498 | #873 | 運用: closing review dispatch と PR draft state が未束縛で、判定不要の往復が発生する | review custody の信頼性 (実装を製本にした検証・修正) |
| #505 | #386 | review custody の取りこぼし: reviewer が verdict を出しても verdict file を書けず `verdict_file_missing` で receipt が発行されない | review custody の信頼性 (実装を製本にした検証・修正) |
| #552 | #588 | 共有 memory canon に review 依頼・引き継ぎ等の episodic 記録が memory add 経由で素通りする (実測: 配送候補 571 件中 78% が episodic) | 手書き作業の自動化 (実装の整理) |
| #562 | #873 | D3b verified review judgment producer: derive custody inputs from canonical provider evidence | review custody の信頼性 (実装を製本にした検証・修正) |
| #582 | #588 | review request の発行が手作業: CI green → exact-head request → consume 依頼を機械化する | 手書き作業の自動化 (実装の整理) |
| #586 | #875 | 運用ノイズ 3 点: memory add の書き込み先が cwd 非依存、handover CURRENT.json の stale 警告が全コマンドに出る、reviewer の一時 worktree が毎回残置 | 手書き作業の自動化 (実装の整理) |
| #587 | #588 | AI が手書きしている登録・計算作業の棚卸しと自動化 (review_evidence / generates / digest / packet / sub-issue / receipt 転記) | 手書き作業の自動化 (実装の整理) |
| #591 | #588 | 設計・実装の筋が悪い箇所の棚卸し (18 件、v4 R03〜R06 への割付) | 筋の悪い箇所・削除候補の整理と責務分割 |
| #592 | #588 | 削除候補の棚卸し: 作る分だけ削る対照表 (table 46 / module 18 / legacy 3.6k 行 / stale draft 163 / handover 54) | 筋の悪い箇所・削除候補の整理と責務分割 |
| #619 | #386 | Claude blind-reviewer cannot execute tests at the exact head (no --add-dir / exec allowedTools in review lane) | review custody の信頼性 (実装を製本にした検証・修正) |
| #692 | #588 | Issue projection の CLI 配線と event_digest read-back を実装する | 手書き作業の自動化 (実装の整理) |
| #693 | #683 | src/ の非対話 child process 呼び出しに windowsHide を適用する | 筋の悪い箇所・削除候補の整理と責務分割 |
| #722 | #692 | PLAN revision の canonical_payload_digest を読み出す read-only query（#692 の先行 slice、#681 の前提） | 手書き作業の自動化 (実装の整理) |
| #729 | #109 | CI の fail-fast 化: 軽量 check を重い脚より先に回し、軽量失敗で即返す | CI / runtime 性能の責務分割 |
| #746 | #766 | toolchain と README の整合: @types/node を Node 24 系へ、静的 Vitest バッジを CI 連動へ、vitest / esbuild の更新時期を決める | 筋の悪い箇所・削除候補の整理と責務分割 |
| #759 | #591 | 巨大ファイルの分割: src/cli.ts (4,659 行) ほか 1,500 行超のファイルを振る舞い不変で分ける | 筋の悪い箇所・削除候補の整理と責務分割 |
| #762 | #592 | team 系機能 (ut-tdd team run と team definition) を廃止する | 筋の悪い箇所・削除候補の整理と責務分割 |
| #782 | - | CI にセキュリティの基本検査を足す: 依存の脆弱性監査と CodeQL (SAST) | ゲート検出力の実測 (リバースで設計を検証) |
| #783 | #777 | ゲートの検出力を数値化する: 判定モジュールへの mutation テストと fast-check | ゲート検出力の実測 (リバースで設計を検証) |
| #787 | #777 | ゲートの見逃し率を監査 sampling で実測する (UTV4-FR-024) | ゲート検出力の実測 (リバースで設計を検証) |
| #789 | #70 | 常時の token 取り込みを削り、harness.db の model_runs 肥大を解消する | CI / runtime 性能の責務分割 |
| #791 | #782 | CI の供給網と資源の上限を固める (Action の SHA 固定、timeout、runner 固定、ブランチ保護の確認) | ゲート検出力の実測 (リバースで設計を検証) |
| #823 | #822 | Pack 全量の Reverse 試行 (性能測定と設計・実装のずれの洗い出し) | Pack 全量 Reverse 試行 (⑤ の実測) |
| #825 | #823 | ut-tdd claude に隔離実行 profile を追加する (#823 全量 Reverse の前提) | Pack 全量 Reverse 試行 (⑤ の実測) |
| #856 | #587 | 新規ファイルを足す実装 PR で deliverable-plan-trace と review-evidence 順序が循環し、confirm まで CI を緑にできない | 手書き作業の自動化 (実装の整理) |
| #873 | - | review custody の信頼性: 判定が失われる・誤帰責される・束縛されない経路を塞ぐ | review custody の信頼性 (実装を製本にした検証・修正) |

### 工程 ⑥ (17 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #530 | - | 構想 v4.0 候補の採択準備: リリース・置換・移行ロードマップ v2.0 の取り込みと PR #517 の分割版上げ | v4 要求・要件・受入の再整理と凍結 |
| #533 | #530 | S2: concept v4.0 候補へ版別有効化・compiler/planner/dispatcher 分離・新旧入替原則を追加 | v4 要求・要件・受入の再整理と凍結 |
| #534 | #530 | S3: L1 要求候補へ RM-ADD-01..13 の BR refinement と真の追加 BR | v4 要求・要件・受入の再整理と凍結 |
| #535 | #530 | S4: L3 要件候補へ順序予測・共通 JSON・actual readiness・版互換/移行の FR 追加 | v4 要求・要件・受入の再整理と凍結 |
| #536 | #530 | S5: L10 受入候補へ SCHED-01..14 と版/移行/コスト/権限の AC 追加 | v4 要求・要件・受入の再整理と凍結 |
| #575 | #530 | 構想 v4.0 候補の修正: 管理知能 (意味分類・チケット発行) と PLAN 新規発行停止 | v4 要求・要件・受入の再整理と凍結 |
| #588 | - | v4 version-up R03 (0.3.0): 共通 JSON 正本・チケット土台・管理知能の要件定義 | v4 要求・要件・受入の再整理と凍結 |
| #593 | #588 | R03 要件: 利用者・権限 registry (複数人間 + AI lane を同じ principal モデルで扱う) | v4 要求・要件・受入の再整理と凍結 |
| #767 | #588 | 非機能要求を IPA 非機能要求グレードの大項目×中項目で取捨選択する (L1 template と harness nfr) | v4 要求・要件・受入の再整理と凍結 |
| #768 | #588 | クラウド基盤の初期決定を「後から変えにくい順」に台帳化し、L4 freeze 前の確定を必須にする (AWS profile) | v4 要求・要件・受入の再整理と凍結 |
| #769 | #575 | concept v4 候補: WBS エンジン (決定台帳と PLAN graph から作業分解・順序・並列可否を生成する) | v4 要求・要件・受入の再整理と凍結 |
| #770 | #588 | concept v4 候補: 工程×役割の RACI を V-model の正本に入れ、運用レビューとスプリント前決定を規則化する | v4 要求・要件・受入の再整理と凍結 |
| #777 | #588 | テスト戦略をリスク起点の 8 ステップで組み立てる (harness 自身と consumer テンプレート) | v4 要求・要件・受入の再整理と凍結 |
| #778 | #588 | 検証戦略: レビュー・静的解析・FMEA・FTA・STPA・形式手法を、確かめたいことに応じて選ぶ | v4 要求・要件・受入の再整理と凍結 |
| #784 | #588 | HARNESS 成熟度を「AI の段階 ⓪〜⑧ × 提供モード (引ける / 支援 / 制御)」で定義する | v4 要求・要件・受入の再整理と凍結 |
| #822 | #530 | 構想 v4 候補: V 字の右腕を Reverse とリファクタリングによる証拠固めの定常工程にする | v4 要求・要件・受入の再整理と凍結 |
| #871 | #530 | v4 候補: 検証済みライブラリの登録簿と、内部部品カタログ | v4 要求・要件・受入の再整理と凍結 |

### 工程 ⑦ (10 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #119 | #877 | disposition catalog の統合主張と profile/正本実体の乖離 (saas/regulated axis 未定義・quota merge 未履行・api-service slot 不在) | テンプレート・スキル補強 |
| #120 | #877 | 検証設計の内容カタログ欠落: テスト技法・テストデータ設計・契約テスト・多軸カバレッジ基準・AI 成果物 eval が未翻訳 | テンプレート・スキル補強 |
| #121 | #877 | ops/appsec/supply-chain 系 semantic item の採否判断が未記録 (not_applicable 明示 or 翻訳の裁定待ちが無音欠落化) | テンプレート・スキル補強 |
| #705 | #676 | V-model テンプレート: 管理 yaml の図・トレース・粒度情報を slot テンプレートへ取り込む対応ルールを決める (#676 後続) | #676 (①) の子だが内容はテンプレート (⑦)。#766 か #877 へ付け替え候補 |
| #727 | #766 | skill 本文を「機械化枠 / 運用枠 / 一般論」で仕分け、運用枠と gate 参照だけに絞る | テンプレート・スキル補強 |
| #765 | #766 | PoC でプロトに差し込んだログを検証の証拠として認め、ログ設計の入力にする | テンプレート・スキル補強 |
| #766 | - | 保守性の棚卸し: 気づける・直せる・戻せる の 12 要素 (harness と consumer template) | テンプレート・スキル補強 |
| #795 | #793 | プロファイルに第 3 軸「デプロイ先」を加え、文書と観点の採用を切り替える | テンプレート・スキル補強 |
| #796 | #793 | consumer 向けインフラ系テンプレートに記入例を入れる (L4 / 025 / 026 / 035 / 038 / L13 / L14) | テンプレート・スキル補強 |
| #877 | - | V-model ZIP の忠実性: semantic item の採否と内容カタログの欠落を埋める | テンプレート・スキル補強 |

### 工程 ⑧ (14 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #145 | - | Redesign: 27 PLAN numeric-core collisions and schedule truth drift | v4 機能の実装→内部デプロイ→リリース |
| #303 | #590 | 駆動モデル workflow の自動生成と FLAG 教訓の永続還流 (既存機構の合成) | v4 機能の実装→内部デプロイ→リリース |
| #304 | #303 | S1: workflow suggest — 既存分類/route/skill 機構の合成による駆動別 workflow 生成器 | v4 機能の実装→内部デプロイ→リリース |
| #305 | #303 | S2: レビュー FLAG 類型の構造化格納 (findings) と checklist への永続還流 | v4 機能の実装→内部デプロイ→リリース |
| #413 | #875 | memory のグローバル化とプロジェクト間隔離 (後回し / Pack リリース後) | v4 機能の実装→内部デプロイ→リリース |
| #480 | #145 | PLAN authoring: 採番予約ticketとtransactional auto-allocationで並行作成時の番号重複を防止 | v4 機能の実装→内部デプロイ→リリース |
| #589 | - | v4 version-up R04 (0.4.0): 低コスト CI・共有 view・順序予測 (提案のみ) | v4 機能の実装→内部デプロイ→リリース |
| #590 | - | v4 version-up R06 (0.6.0): UT 準拠 BugBot (再現可能な局所不具合の限定修理と独立受入) | v4 機能の実装→内部デプロイ→リリース |
| #790 | - | 画面領域: 機械検証とプロトから本番への継承を整える | v4 機能の実装→内部デプロイ→リリース |
| #793 | - | consumer のデプロイ先と環境をモデル化する (プロファイルの第 3 軸、環境 record、デプロイ receipt) | v4 機能の実装→内部デプロイ→リリース |
| #797 | #793 | 環境 record とデプロイ receipt の schema を作る | v4 機能の実装→内部デプロイ→リリース |
| #798 | #793 | G13 のスモークと SLO の観測をデプロイ receipt に束縛する | v4 機能の実装→内部デプロイ→リリース |
| #816 | #224 | リリースノートと CHANGELOG を機械生成する (canary.3 向けの最小版を先行) | v4 機能の実装→内部デプロイ→リリース |
| #875 | - | 共有 memory の衛生: 配送・読み取り・入口検査・未追跡の堆積 | v4 機能の実装→内部デプロイ→リリース |

### 工程 ⑨ (0 件)

該当なし。

### 工程 ⑩ (1 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #224 | - | 段階リリース管理 (release channel / promotion) を harness の機能ドメインとして追加する | 正式な段階リリース (フル Pack デプロイ) |

### 工程 ⑪ (0 件)

該当なし。

### close 候補 (4 件、実際には閉じていない)

| issue | 親 | 題名 | 理由 |
|---|---|---|---|
| #131 | #229 | hybrid: Codex 側から ut-tdd claude 委譲が発火せずクロスレビュー原則が素通り (痕跡照合 gate 化 = PLAN-L6-93) | CLI 委譲の素通り検知。runtime 間は GUI 中心・CLI は局所 review のみ (2026-10-08) で前提が消えた |
| #139 | #229 | Automation: Claude Code polls HARNESS memory for PR requests every 30 minutes | 30 分ごとの memory polling。GUI 中心の連携 (2026-10-08) で不要 |
| #424 | - | Release blocker: project-scoped canonical Memory/notification root across worktrees and providers | 子 5 件はすべて closed。親固有 AC を確かめて close |
| #738 | #876 | Opus レビューと advisor を Claude CLI から Agent ツール subagent へ寄せる | Opus review を subagent へ寄せる案。subagent 基本撤廃 (V4D-098) と逆向き |
