# open issue の回収地点 (工程 ①〜⑪)

**2026-11-10 時点の open issue 240 件**を、閉じる工程へ割り当てた表です。工程の定義は [README](../README.md) の結論表、工程間の前提は [01_DEPENDENCIES_AND_WORK_PACKAGES.md](01_DEPENDENCIES_AND_WORK_PACKAGES.md) にあります。正本の決定は #530 のコメント 6051336079 (工程順) と、#1078 のコメント 6287013301 (PLAN の縮退 → Pack のデプロイ → 自己導入、PO 判断 2026-10-20) です。2026-10-08 版 (158 件) と 2026-10-13 の追補は、本版で置き換えました。

## 読み方

- 「閉じる工程」は、その工程が終わるまでに閉じる (または close 判定する) という意味です。着手時期ではありません。工程をまたいで先に直してよいものは、従来どおり通常修理で直します。
- 「Pack 公開前の安全修理」は、工程 ② と並行して進め、次の Pack (canary.8) を公開する前に閉じるか、入れないと決める束です。工程 ② の出口と工程 ③ の入口のあいだに置きます。
- 割当は題名・ラベル・親子関係・本文冒頭から判断した計画です。各工程に入るときに本文を読み直し、変わっていれば本表を直します。旧表にあった issue は、今回変えたもの以外、旧表の割当と根拠を引き継いでいます。
- GitHub の sub-issue 親子と矛盾させない規則: 子の工程は親の工程より後にしません。例外は下の「親子の矛盾」に挙げます。
- 工程 ⑨ と ⑪ には、いま回収する issue がありません。⑨ の対象範囲と完了条件は ⑧ のうちに決めます。
- 本表の issue の行は、GitHub から取った一覧と割当の対応からスクリプトで生成しています。題名は GitHub の表記のままです (表の区切りと重なる縦線だけ全角の斜線に置き換えています)。

## 件数

| 工程 | 件数 |
|---|---:|
| Pack 公開前の安全修理 (canary.8。② と並行) | 19 |
| 工程 ② 設計正本の凍結と PLAN の退役 | 61 |
| 工程 ③ 自己導入 | 39 |
| 工程 ④ ディレクトリ再編 | 6 |
| 工程 ⑤ リバースリファクタリング | 68 |
| 工程 ⑥ 要件の再整理と凍結 | 18 |
| 工程 ⑦ テンプレートとスキルの補強 | 12 |
| 工程 ⑧ 反復リリース | 15 |
| 工程 ⑨ リバース工程 | 0 |
| 工程 ⑩ 製本 | 2 |
| 工程 ⑪ チーム投入 | 0 |
| 計 | 240 |

## 2026-11-10 の整理で変えたこと

- **閉じた issue**: #1375 (A6-S3。実装 #1588 と merge 後の main の CI を確かめた)、#1391 (privacy scan。#1454 と #1586 を確かめた)。旧表にあって今回の一覧に無い issue は、それまでに閉じたものです。
- **「Pack 公開前の安全修理」を新設**: PO 判断 (2026-10-20) で順序が「PLAN の縮退 → Pack のデプロイ → 自己導入」になったため、次の Pack に入れる修理と、入れるかどうかを公開の前に決める候補をここに集めました。旧表の「① の受入後に割り当てる」は廃止し、工程 ③ へ移しました。
- **旧表の付け替え提案を採用**: #393 を工程 ① から工程 ⑤ (#873 の束) へ移しました。#676 は工程 ③ (Pack が配る中身の穴) へ移しました。
- **GitHub の親子関係を直した**: 親の無かった 22 件を、該当する成果目標の sub-issue にしました (#958 へ 5 件、#109 へ 3 件、#1084 へ 2 件、#530 へ 3 件、#961 へ 4 件、#877・#1141・#873・#1528 へ各 1 件、#1142 へ 2 件)。工程が親とずれていた #705 を #676 から #877 へ、#1062 を #958 から #1084 へ付け替え、#1033 は #530 の子から外して top-level にしました。下の表の「親」の列は、付け替えた後の状態です。
- **重複の候補**: #1062 (連絡と handover prose の退役) と #1116 (縮退 群1: 連絡経路) は対象が重なります。どちらかへ寄せます。#1037 (PR を作る前の preflight) と #1597 (push の前に、変えた src を参照するテストを洗い出す) も近いので、契約を書くときに 1 本にまとめます。
- **規則と実装の食い違い**: `CLAUDE.md` §PR スコープ規律 5 は「`ut-tdd pr merge` が verdict の REFACTOR 欄を機械で確かめる」と書いていますが、実装 (#1336 / #1337) はまだ merge されていません (`tests/refactor-judgement-gate.test.ts` は `it.fails` のまま)。#1335〜#1337 を工程 ② で閉じるか、規則の記述を現状に合わせます。
- **構想の候補文書に入っていない要求**: #1330 (複数の repo での開発、PO 判断 2026-10-23 で v4 必須) と #1083 (合成ワークフロー) は、構想・要求・要件・受入・決定台帳のどれにも記述がありません。工程 ⑥ の前に、台帳と候補文書へ入れます。

## 親子の矛盾

子の工程が親の工程より後になっているものです。付け替えは control が判断します。

- #791 (⑤) は #1142 (③) の子です。提案: #109 (CI) へ付け替えるか、#1142 の中で工程 ⑤ の残りとして扱う。
- #899 (⑤) は #1142 (③) の子です。提案: #1142 の中で工程 ⑤ の残りとして扱う。
- #1083 (⑧) は #588 (⑥) の子です。提案: 親 #588 は R03 の要件定義 (⑥)。要件に入れた後の実装チケットとして扱う。
- #1226 (⑦) は #1084 (⑤) の子です。提案: #766 か #877 (工程 ⑦) へ付け替える。
- #1327 (⑧) は #530 (⑥) の子です。提案: #530 の下では工程 ⑥ で要件に入れるところまでを扱い、実装は工程 ⑧ のチケットに切り出す。
- #1330 (⑧) は #530 (⑥) の子です。提案: #1327 と同じ。

## 工程別の表

### Pack 公開前の安全修理 (canary.8。② と並行) (19 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #493 | #873 | review custody: 11 経路が単一の attempt_outcome_indeterminate へ潰れ、失敗した attempt の残骸が同一 worktree の再試行を恒久的に塞ぐ | 中断・拒否した review request が残り merge を止める。Pack を配る前に回収経路の有無を確かめる (#1078 6288697358) |
| #693 | #1141 | src/ の非対話 child process 呼び出しに windowsHide を適用する | windowsHide の修正は source で merge 済み。consumer へ届くのは次の Pack (PO 判断 2026-10-20) |
| #971 | #880 | consumer で G1 trace が画面 ID を PM-/HM-/GD- だけで探し、consumer の画面 ID (SC- など) を読めない | Pack の Issue #10 (G1 が consumer の画面 ID を読めない)。次の Pack に入れるかを公開の前に決める (#1078 6288697358) |
| #972 | #676 | consumer で G3 trace が、ハーネス自身にしかない docs/design/harness/L3-functional/business-detail.md を必須で読む | Pack の Issue #11 (G3 がハーネス固有の文書に依存)。同上 |
| #1057 | #364 | consumer の記録用 hook (post-tool-use / session summary) が Windows の負荷時に 5 秒 timeout を超える (Pack #12) | Pack の Issue #12 (Windows の記録 hook が 5 秒を超える)。同上 |
| #1072 | #1062 | consumer で Codex → Claude の通知が届かない: 送り側 (memory add --notify-claude) の案内が配布物に無い | Pack の Issue #13 (Hybrid の返答が対話セッションへ届かない)。同上。親 #1062 (⑤) より前に閉じる |
| #1247 | #1142 | dev 依存 (vitest 2.1.9 系) の脆弱性 critical 3 / high 4 を解消する | Node と dev 依存の脆弱性。canary.8 に含める |
| #1283 | #972 | Forward: #972 (G3 が business-detail.md を必須で読む) の実装 | Pack の Issue #11 (G3 がハーネス固有の文書に依存)。同上 |
| #1313 | #971 | Forward: G1 画面 ID 接頭辞の候補 oracle を正式 ID に昇格する | Pack の Issue #10 (G1 が consumer の画面 ID を読めない)。次の Pack に入れるかを公開の前に決める (#1078 6288697358) |
| #1314 | #971 | Forward: G1 画面 ID 接頭辞の実装 (Green + Refactor) | Pack の Issue #10 (G1 が consumer の画面 ID を読めない)。次の Pack に入れるかを公開の前に決める (#1078 6288697358) |
| #1521 | #1528 | Claude hook の失敗時 block 設定が効かない項目名 (blockOnFailure) で、agent-guard / work-guard が fail-open になっている | guard hook が失敗時に fail-open になる。Pack を公開する前の安全修理 (#1078 6677735417) |
| #1522 | #1528 | 生成 harness-check workflow が runtime の無い CI で検査を全部飛ばして緑になる (偽の緑) | 生成 workflow の偽の緑・空振り。consumer へ新しい Pack を入れた受入証跡が取れるまで open (#1078 6677735417) |
| #1523 | #1528 | 生成 workflow の branch-type guard が PR の実コミットを検査しない (浅い checkout で空振り) | 生成 workflow の偽の緑・空振り。consumer へ新しい Pack を入れた受入証跡が取れるまで open (#1078 6677735417) |
| #1538 | #1528 | Codex の guard hook も失敗時に操作を止める設定が無く、fail-open の可能性がある (#1521 の Codex 側) | guard hook が失敗時に fail-open になる。Pack を公開する前の安全修理 (#1078 6677735417) |
| #1561 | #1528 | Claude Code が 2.1.295 未満だと guard の onFailure が無音で無視され、fail-open のままになる | guard hook が失敗時に fail-open になる。Pack を公開する前の安全修理 (#1078 6677735417) |
| #1589 | #1142 | Node の脆弱性修正版 (11/11 予定) へ pin を上げる | Node と dev 依存の脆弱性。canary.8 に含める |
| #1592 | #1528 | worktree runtime の導入が途中で失敗したときの rollback を、本番の経路で検証する | worktree runtime (#1525) の残り。rollback の検証と、Stop 系 hook の exit code |
| #1600 | #393 | review を拒否したあとに verdict の無い request が残り、その HEAD の merge を止め続ける | 中断・拒否した review request が残り merge を止める。Pack を配る前に回収経路の有無を確かめる (#1078 6288697358) |
| #1602 | #1528 | runtime が無い worktree で、launcher を直接起動する Stop などの hook が exit 2 で停止を止めるおそれがある | worktree runtime (#1525) の残り。rollback の検証と、Stop 系 hook の exit code |

### 工程 ② 設計正本の凍結と PLAN の退役 (61 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #108 | - | Redesign: 設計成果物にL別検証契約を必須化し完了誤判定を防止する | 旧 Redesign。② の仕分けで生存 / supersede / 廃止を判定 |
| #134 | - | Redesign: retire Bun and migrate control plane to TypeScript/Node + Rust | 旧 Redesign。② の仕分けで生存 / supersede / 廃止を判定 |
| #136 | #108 | Design debt: make G9 system-test deferrals owned and exit-bound | 旧 Redesign。② の仕分けで生存 / supersede / 廃止を判定 |
| #149 | #134 | Redesign D0: Node control plane and Resource Kernel design freeze | 旧 Redesign。② の仕分けで生存 / supersede / 廃止を判定 |
| #211 | #1084 | cross-file の断線 (到達不能な export / ファイル) を誰も検出していない — 実測 134 件の値 export が参照ゼロ | PLAN 仕分けと台帳・証跡 gate の整合 (移行 PR の前提) |
| #648 | #588 | v4: Canonical Contract + Derived Projection Architecture (同期を減らし、残った同期を drift 検出と生成に置換、同値の 2 箇所手書き禁止) | 設計正本と派生物の一本化 (設計書保護 gate の土台) |
| #745 | #873 | review receipt に reviewer checkout の base / schema 版を記録し、古い環境の verdict を merge gate で無効化する | receipt chain の直列化解消 (移行を複数 PR で流す前提) |
| #749 | #873 | 同じ review request・同じ attempt に 2 本目の reviewer を起動できてしまい、verdict の identity が衝突する | receipt chain の直列化解消 (移行を複数 PR で流す前提) |
| #753 | #648 | 機械束縛の無い文書 (コア文書・ルール・workflow・skills・design) の鮮度を棚卸しし、将来は鮮度検査を仕組み化する | 設計正本と派生物の一本化 (設計書保護 gate の土台) |
| #872 | #648 | SessionStart などの hook 設定が 3 か所に手書きされている（正本を 1 つにして、組み込みテンプレートを生成物にする） | 設計正本と派生物の一本化 (設計書保護 gate の土台) |
| #894 | #530 | 確定した設計文書にテンプレートの記入欄 (<記入>) が残っていたら止める検査を入れる | 中断中。再開は #958 の出口判定で決める (control 2026-10-19) |
| #913 | #958 | 設計保護 gate の実装 PR 判定が src/ と scripts/ 固定のため、v4 のディレクトリ再編で黙って無効になる | ②(b) の残り。工程 ④ の構成移動より前に閉じる |
| #947 | #958 | v4 移行の進み具合を、撤去数・やり直し回数・リードタイムの 3 指標で測る | ② の凍結の完了判定に使う。以降の工程でも測る |
| #958 | - | v4 工程 ②: 旧設計をリファクタリングして設計正本を凍結する | 工程 ② の親 issue |
| #968 | - | TDD の Refactor 段が実装 PR でほぼ飛ばされている: Red → Green → Refactor の順を運用の正本に入れる | Refactor 段の規律 (#968)。merge gate の REFACTOR 欄まで入っているので、残りを確かめて閉じる |
| #1019 | #958 | V 字の右腕の検証文書が設計文書と対になっていない (L10 の設計、L0 / L11 / L13 の欠落) | 設計正本の凍結 (#958 の子)。右腕の検証文書を設計文書と対にする |
| #1032 | #958 | 設計文書の肥大を検査し、責務ごとの分割を機械が指示するようにする (doc-split gate) | 実装は #1408 で merge 済み。残る完了条件 (2 本の分割で baseline が縮む) を確かめて閉じる |
| #1037 | #958 | PR を作る前に CI の merge 条件をローカルで検査し、赤なら止める preflight (#958) | push の前に CI の落ちを拾う。直列の鎖の詰まりを減らす |
| #1038 | #958 | 設計文書の二重表記を棚卸しして正本を 1 か所に揃え、定義の重複を gate にする (#958) | 設計正本の凍結 (#958)。文書の重複・整理 |
| #1063 | #958 | harness-check CI の所要時間を短縮する (Windows leg の vitest 25 分が律速) | CI の所要時間 (#958 の子)。直列の鎖の律速 |
| #1073 | #958 | gate-static の下限を merge-base 基準にして、baseline 超過分の誤削除も検出する | 設計書保護・oracle の検査の穴。② の凍結の前に塞ぐ |
| #1078 | #959 | PLAN 削除の前に、全 PLAN の意味の行き先と照合証跡がそろっていることを機械で確かめる | PLAN 撤去の本線 (#1078 A4 / A6) |
| #1168 | #1078 | PLAN 撤去で壊れる依存を修理し、PLAN 専用の lint・admission・台帳管理を退役させる (#1078 A4) | PLAN 撤去の本線 (#1078 A4 / A6) |
| #1170 | #1078 | PLAN を物理削除し、残った不要な機構を縮退させる (#1078 A6) | PLAN 撤去の本線 (#1078 A4 / A6) |
| #1202 | #958 | 設計文書から oracle ID への参照が、test-design の宣言に解決するかを検査していない | 設計書保護・oracle の検査の穴。② の凍結の前に塞ぐ |
| #1211 | #1078 | recordGuardrailDecision の本番配線を PO 判断待ちの defer として記録する（A5-C02） | A5 の例外一覧から Issue にしたもの (#1078 の子)。閉じるか ⑤ へ付け替えるかを ② の出口で決める |
| #1212 | #1078 | projection 分割の残作業を追跡する（A5-C26、#977 CD-39） | A5 の例外一覧から Issue にしたもの (#1078 の子)。閉じるか ⑤ へ付け替えるかを ② の出口で決める |
| #1213 | #1078 | mode をまたぐ walkthrough を作る時期を決める（A5-C52） | A5 の例外一覧から Issue にしたもの (#1078 の子)。閉じるか ⑤ へ付け替えるかを ② の出口で決める |
| #1259 | #1063 | 重い同期テスト (最大 約 686 秒) を短縮し、#1247 で引き上げた timeout 定数を下げる | CI の所要時間 (#958 の子)。直列の鎖の律速 |
| #1261 | #1170 | Windows の .cmd shim 経由の provider 起動で %VAR% が展開される (M1) ほか、監査で見つかった low 2 件を直す | A6 の監査で見つかった low (#1170 の子) |
| #1281 | #1261 | Forward: #1261 L2 (gh 起動の timeout と prompt 抑止) の候補 oracle の Red | A6 の監査で見つかった low (#1170 の子) |
| #1293 | #1261 | Forward: test-oracle-strength の helper 解決を実装する (Green → Refactor) | A6 の監査で見つかった low (#1170 の子) |
| #1298 | #1168 | Refactor: PR #1245 で抜けた Refactor 工程を行う | PLAN 撤去の本線 (#1078 A4 / A6) |
| #1300 | #968 | Forward: pr merge が実装 PR の Refactor 工程の有無を確かめる契約を固める | Refactor 段の規律 (#968)。merge gate の REFACTOR 欄まで入っているので、残りを確かめて閉じる |
| #1304 | #968 | Forward: 設計文書とテストにも Refactor 工程を持たせて増える一方を止める仕組みを決める | Refactor 段の規律 (#968)。merge gate の REFACTOR 欄まで入っているので、残りを確かめて閉じる |
| #1312 | #958 | Forward: ガバナンス文書を整理しリファクタと分割の目安を 1 か所に集約する | 設計正本の凍結 (#958)。文書の重複・整理 |
| #1322 | #1261 | Forward: #1261 L2 の候補 oracle を正式 ID に昇格する | A6 の監査で見つかった low (#1170 の子) |
| #1323 | #1261 | Forward: #1261 L2 (gh 起動の timeout と prompt 抑止) の実装 (Green + Refactor) | A6 の監査で見つかった low (#1170 の子) |
| #1335 | #1300 | Forward: merge gate の Refactor 判定欄の oracle ID を正式化する (#1300) | REFACTOR 欄の merge gate は Red (#1353) まで。Green が未実装で、CLAUDE.md §PR スコープ規律 5 の記述と食い違う |
| #1336 | #1300 | Forward: verdict の REFACTOR 欄を抽出して receipt と entry に写す Green (#1300 実装 1) | 同上 (#1300 実装 1) |
| #1337 | #1300 | Forward: merge gate が REFACTOR 欄を確かめて実装 PR を拒否する Green (#1300 実装 2) | 同上 (#1300 実装 2) |
| #1352 | #1304 | refactor(tests): 一時ディレクトリの後片付けを temp-tree の removeTestTree へそろえる | #1304 の子。tests の後片付けをそろえる Refactor |
| #1359 | #1168 | A4: gate_runs を PLAN から切り離し、実行単位で gate-run-coverage を守る (契約 → Red → Green) | Green は #1486 で merge 済み。子の #1468 / #1490 (後続課題) の扱いを決めて閉じる |
| #1376 | #1170 | A6-S4: CLI の --plan を外し、PR trace と review custody を v2 にする | PLAN 撤去の本線 (#1078 A4 / A6) |
| #1378 | #1170 | A6-S6: Pack の雛形と canary を Issue 参照へ移す | PLAN 撤去の本線 (#1078 A4 / A6) |
| #1379 | #1170 | A6-S7: PLAN の CLI・台帳・投影コードを退役し registry から外す | PLAN 撤去の本線 (#1078 A4 / A6) |
| #1380 | #1170 | A6-S8: 規範文書と rule-drift の marker を掃除する | PLAN 撤去の本線 (#1078 A4 / A6) |
| #1419 | #958 | 共有 L7 の SNAPLC 再掲を専用テスト設計へ整理する | 設計正本の凍結 (#958)。文書の重複・整理 |
| #1452 | #958 | Red テストが Green 化後に assertion を実行せずに PASS する抜け道を機械で止める | 設計書保護・oracle の検査の穴。② の凍結の前に塞ぐ |
| #1468 | #1359 | gate-run publish の EEXIST・hard link・staging の 4 軸を Red にする (#1359 の後続) | PLAN 撤去の本線 (#1078 A4 / A6) |
| #1490 | #1359 | #1486 の review で残った gate-run と投影の後続課題を片付ける | PLAN 撤去の本線 (#1078 A4 / A6) |
| #1559 | #873 | baseline_conflict が path の重なりだけで DENY し、並行 PR の merge のたびに再検の往復を増やしている | merge の判定の詰まり。実装 PR が直列の鎖にある |
| #1579 | #1019 | L8 結合検証: engine-swap の検証義務 | 設計正本の凍結 (#958 の子)。右腕の検証文書を設計文書と対にする |
| #1580 | #1019 | L9 総合検証: engine-swap の検証義務 | 設計正本の凍結 (#958 の子)。右腕の検証文書を設計文書と対にする |
| #1581 | #1019 | L10 UX 検証: engine-swap の検証義務 | 設計正本の凍結 (#958 の子)。右腕の検証文書を設計文書と対にする |
| #1582 | #1019 | L11 UAT レビュー: engine-swap の検証義務 | 設計正本の凍結 (#958 の子)。右腕の検証文書を設計文書と対にする |
| #1583 | #1019 | L12 受入とデプロイ: engine-swap の検証義務 | 設計正本の凍結 (#958 の子)。右腕の検証文書を設計文書と対にする |
| #1584 | #1019 | L13 デプロイ後の検証: engine-swap の検証義務 | 設計正本の凍結 (#958 の子)。右腕の検証文書を設計文書と対にする |
| #1585 | #1019 | L14 運用価値の検証: engine-swap の検証義務 | 設計正本の凍結 (#958 の子)。右腕の検証文書を設計文書と対にする |
| #1597 | #109 | 実装 PR の push 前に、変えた src を参照するテストを洗い出して snapshot に含める | push の前に CI の落ちを拾う。直列の鎖の詰まりを減らす |
| #1598 | #958 | 文書 PR の push 前に、上位層の設計文書に残った旧い欄名・用語を検出する | 設計正本の凍結 (#958)。文書の重複・整理 |

### 工程 ③ 自己導入 (39 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #132 | #876 | runtime-env: AI CLI/拡張の設定ドリフトが無検査 (版ずれ/廃止キー/誤配置を同日 3 件実測、doctor 契約化 = PLAN-L6-92) | 自己導入前に runtime 設定とモデル指定を最新化 (V4D-097) |
| #364 | #224 | S5: clean Pack repository publication・2 consumer canary L12 E2E | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #424 | - | Release blocker: project-scoped canonical Memory/notification root across worktrees and providers | 受入条件の棚卸し (2026-10-07) の残りを確かめ、満たしていれば閉じる。子は全部閉じている |
| #481 | #961 | Consumer Pack updater: channel-aware検出・atomic generation switch・自動rollback | 自己導入の前提となる updater / rollback |
| #565 | #364 | S5 child: v0.2.0-canary.1 publication driver — production ports + CLI entry for PLAN-L7-519 adapter | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #626 | #565 | S5 publication adapter split 2: admission observation binding | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #627 | #565 | S5 publication adapter split 3: admitted publish deny path | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #668 | #876 | Codex の project hook が args 非対応で全て無音失敗している (guard 無効化) | 自己導入前に runtime 設定とモデル指定を最新化 (V4D-097) |
| #676 | #364 | Release consumer で開発を開始できない穴: identity / repo-root、生成物、skills と設計テンプレートの配送 (#418 子) | Pack が配る中身の穴は工程 ③ でまとめて塞ぐ (README 結論表) |
| #733 | #876 | Claude 全 family のモデル指定を世代固定からエイリアスへ変え、Sonnet の推奨 effort を high にする | 自己導入前に runtime 設定とモデル指定を最新化 (V4D-097) |
| #792 | #481 | Pack 配布物に build provenance を付け、証明のない配布物を昇格させない | 自己導入の前提となる updater / rollback |
| #809 | #364 | pack-canary-acceptance の証跡を計測値にする (trace 件数・source 監査・credential env・runner digest) | canary.6 の blocker ではないと判定済み。Pack の配布物の修理として ③ で扱う |
| #814 | #364 | consumer の upgrade で既存の設定・state を壊さずに新しい版へ変換する仕組み | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #815 | - | Pack 利用者がハーネスのトラブルを安全に issue 報告できる経路 (書き込みセキュリティを先行) | 別プロジェクトからのフィードバック経路 |
| #821 | #364 | Pack の C1 で実行可能ファイルの mode 100755 が 100644 に落ちる (sync-pack / Windows commit) | canary.6 の blocker ではないと判定済み。Pack の配布物の修理として ③ で扱う |
| #867 | #364 | 配布物の CLI version 表示が release とずれる（package.json は canary.1 固定、sealed consumer では 0.0.0） | Pack 経由の版上げと別プロジェクト投入 (#364 系) |
| #876 | - | AI ランタイムの設定とモデル routing: 設定ドリフトの検知と、モデル指定の世代固定の解消 | 自己導入前に runtime 設定とモデル指定を最新化 (V4D-097) |
| #880 | #364 | G1 が business / screen / P0 FR の集合が空のまま passed=true を返す。consumer で必須とする集合と診断理由を契約に定める | canary.6 の blocker ではないと判定済み。Pack の配布物の修理として ③ で扱う |
| #881 | #364 | canary.4 の tar.gz が無圧縮になっている (#834 で、stored ブロックの fixedGzip 経路に切り替わった回帰) | canary.6 の blocker ではないと判定済み。Pack の配布物の修理として ③ で扱う |
| #889 | #676 | consumer: 公開 asset から導入した直後の consumer で SessionStart の要約に design-quality-load-error / missing-projection が出る | canary.6 の blocker ではないと判定済み。Pack の配布物の修理として ③ で扱う |
| #900 | #1142 | ハーネスのログ・Memory・review 記録に製品の secret や PII が混ざらないようにする | 別プロジェクト投入の前提 (外部監査で高リスク) |
| #901 | #1142 | 配布した hook・設定・テンプレートの改ざんを検出する | 配布物の受入と同じ版 |
| #912 | #961 | Pack 利用者向けの案内を直す: work-guard のコメントの path と README の版の混在 | 別プロジェクト投入の前提 |
| #928 | #961 | canary.6 の Linux 正式受入 (AT-DIST-003、専用 distro) を、実際の利用とバグ報告のあとに行う | 版上げと同じ版で受け入れる |
| #930 | #364 | 入れた consumer runtime を新しい版へ上げられない (consumer_runtime_update_unsupported) | 2026-10-13 に中断し ③ へ集約 (README の「現在地」) |
| #954 | #961 | canary の受入を、変更の無い AT は前回の結果で引き継ぎ、残りを CI に載せる (毎回の手作業テストをやめる) | 自己導入の受入を軽くする前提 |
| #961 | - | v4 工程 ③: canary をハーネス自身に Pack として導入し、Pack 経由の版上げと rollback を実測する | 工程 ③ の親 issue |
| #1069 | #961 | merge の最後に worktree とブランチを片付け、残すものは理由と回収期限を記録する | ③ の着手条件 (worktree・ブランチの全面クリーン化)。実装は ③ の必須条件にしない (#958 6190576516) |
| #1142 | - | v4 の hardening: 信頼境界・secret 混入・配布物の改ざん検出・CI 供給網 | hardening。配布物の改ざん検出と CI の供給網は自己導入の前提 |
| #1384 | #961 | control lane の私物スクリプト (CI 待ち・review 発注・merge queue・着信監視・worktree 回収) を ut-tdd の CLI にする | 進行役の道具 (待機・review・merge・依頼) を製品に入れる (README 結論表 ③) |
| #1465 | #961 | lane が待ち続けずに依頼をかける仕組み (control・ほかの lane・PO への依頼と督促) | 進行役の道具 (待機・review・merge・依頼) を製品に入れる (README 結論表 ③) |
| #1524 | #1528 | 生成 managed block とコマンドが global の ut-tdd と npm scripts を前提にし、consumer でそのまま動かない | consumer の実運用で動かない配布物と経路 (#1528) |
| #1526 | #1528 | consumer が ut-tdd pr merge と review custody を使えず、自作の merge script で運用している | consumer の実運用で動かない配布物と経路 (#1528) |
| #1527 | #1528 | 設計フェーズの consumer が G1〜G3 を CI で回せない (consumer 向け CI gate が setup-smoke だけ) | consumer の実運用で動かない配布物と経路 (#1528) |
| #1528 | - | consumer の実運用で、ハーネスの想定どおりに動かない配布物と経路を直す (v4 改善対象) | consumer の実運用で動かない配布物と経路 (#1528) |
| #1530 | #1528 | 設計文書を層の下のサブフォルダへ分けると、pair-freeze と trace の束縛から黙って外れる | consumer の実運用で動かない配布物と経路 (#1528) |
| #1531 | #1528 | 設計文書の分割規則 (doc-split) が本体だけを対象にしていて、consumer に届かない | consumer の実運用で動かない配布物と経路 (#1528) |
| #1554 | #961 | Claude control lane の PO への過剰エスカレーションを Stop hook で検出する | 進行役の道具 (待機・review・merge・依頼) を製品に入れる (README 結論表 ③) |
| #1565 | #1142 | base64 検証 regex が約6 MBの入力で RangeError を投げる | 入力の頑健性。hardening (#1142) の束で扱う。通常修理で先に直してよい |

### 工程 ④ ディレクトリ再編 (6 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #236 | #875 | workspace hygiene の検査機構が無い — 共有メモリ 65 件が未追跡で他ランタイムに不可視、root に非規約エントリが堆積 | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #384 | #1141 | Redesign: 作業用worktreeのowner・TTL・terminal receipt・安全回収をライフサイクル管理する | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #426 | #384 | P0: legacy worktreeをdry-run・quarantine・receipt付きで安全回収する | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #578 | #384 | ローカル残骸の一括整理: merge 済み branch 107 本・worktree 21 個・未 push branch 78 本・stash 6 件 (v4 切り替え後) | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #661 | #384 | 事故: worktree 削除が node_modules junction を辿り primary の node_modules を全消去 (2026-09-18 再発) | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |
| #689 | - | 開発 repo に旧フレームワーク名 (HELIX) のファイル名・本文が残っている | 新ディレクトリ構成への再編で解消 (名前・配置・作業面) |

### 工程 ⑤ リバースリファクタリング (68 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #70 | #109 | Recovery: ut-tdd doctor full scope がローカルで長すぎる (10分超) — 再試行嵐の根本誘因 | CI / runtime 性能の責務分割 |
| #77 | #98 | snapshot fence が hybrid の相手ランタイム並行活動をテスト残留と誤帰責する (full suite 偽 Red) | CI / runtime 性能の責務分割 |
| #98 | #109 | Redesign: snapshot runner固定費をimmutable prepared cacheとI/O schedulerで再設計 | CI / runtime 性能の責務分割 |
| #109 | - | Redesign: GitHub CI を重要部分に絞って高速化・コストダウンし、内部 CI (ローカル gate) の精度を上げて開発速度を回復する | CI / runtime 性能の責務分割 |
| #124 | #98 | fix(runtime): bound Stop db-refresh memory and snapshot runner preparation | CI / runtime 性能の責務分割 |
| #218 | - | D2: merge gate 配線 — FLAG open / verdict 無し merge の機械 block (incident #210 の機構化) | review custody の信頼性 (実装を製本にした検証・修正) |
| #386 | #873 | review dispatch: Claude family の verdict file 書き込みが permission で拒否され receipt が書かれない (wrapper merge gate が Claude review PR で常に deny) | review custody の信頼性 (実装を製本にした検証・修正) |
| #393 | #873 | review custody: 完了した判定が失われる 3 経路 (envelope parser の全行走査 / receipt に根拠を残さず verdict file を削除 / review-guard の他ランタイム誤帰責) | review custody の束 (#873)。残る経路は子の #915 と #1600 が持つ (旧表の付け替え提案を採用) |
| #401 | #873 | review-live: resolveRepositoryRoot の二重適用が残っている (#397 と同一クラス、PLAN-L6-101 §6-1 未達) | review custody の信頼性 (実装を製本にした検証・修正) |
| #421 | #873 | review request: 同一PR/HEAD/revisionの異memoryId分裂を実行前に拒否する | review custody の信頼性 (実装を製本にした検証・修正) |
| #427 | #450 | lint の shell 起動語判定を単一正本へ集約する (quote 非対応の誤検出/取りこぼしが 3 PR で再発) | Bun 到達経路の残存確認 (残れば修理、無ければ close) |
| #437 | #873 | review custody gate の穴: request の author_family が実 commit author と照合されず、自己 review を通す | review custody の信頼性 (実装を製本にした検証・修正) |
| #439 | #421 | Incident: 閉じられない review request が同一 HEAD の merge gate を恒久 deadlock させる (typed retraction 不在、手動削除で回避) | review custody の信頼性 (実装を製本にした検証・修正) |
| #450 | - | Bun permanent ban: Pack/consumer 実行面の Bun 到達経路を 0 にする (#408 close で宙に浮いた所有の回収) | Bun 到達経路の残存確認 (残れば修理、無ければ close) |
| #454 | #1062 | review live-dispatch: generation marker がループ中に更新されず、稼働中の Claude が 15 分で stale 判定される (本日 3 件の取りこぼし) | 通知経路。GUI 中心化 (2026-10-08) に照らして残すか判定 |
| #460 | #873 | delegation review request writerが実在commit / PR HEAD束縛を迂回する | review custody の信頼性 (実装を製本にした検証・修正) |
| #479 | #873 | Forward scheduler: REBASE_REQUIRED判定とbounded auto-rebase episode | review custody の信頼性 (実装を製本にした検証・修正) |
| #498 | #873 | 運用: closing review dispatch と PR draft state が未束縛で、判定不要の往復が発生する | review custody の信頼性 (実装を製本にした検証・修正) |
| #505 | #386 | review custody の取りこぼし: reviewer が verdict を出しても verdict file を書けず `verdict_file_missing` で receipt が発行されない | review custody の信頼性 (実装を製本にした検証・修正) |
| #552 | #875 | 共有 memory canon に review 依頼・引き継ぎ等の episodic 記録が memory add 経由で素通りする (実測: 配送候補 571 件中 78% が episodic) | 手書き作業の自動化 (実装の整理) |
| #582 | #588 | review request の発行が手作業: CI green → exact-head request → consume 依頼を機械化する | 手書き作業の自動化 (実装の整理) |
| #586 | #875 | 運用ノイズ 3 点: memory add の書き込み先が cwd 非依存、handover CURRENT.json の stale 警告が全コマンドに出る、reviewer の一時 worktree が毎回残置 | 手書き作業の自動化 (実装の整理) |
| #587 | #588 | AI が手書きしている登録・計算作業の棚卸しと自動化 (review_evidence / generates / digest / packet / sub-issue / receipt 転記) | 手書き作業の自動化 (実装の整理) |
| #591 | #588 | 設計・実装の筋が悪い箇所の棚卸し (18 件、v4 R03〜R06 への割付) | 筋の悪い箇所・削除候補の整理と責務分割 |
| #592 | #588 | 削除候補の棚卸し: 作る分だけ削る対照表 (table 46 / module 18 / legacy 3.6k 行 / stale draft 163 / handover 54) | 筋の悪い箇所・削除候補の整理と責務分割 |
| #692 | #588 | Issue projection の CLI 配線と event_digest read-back を実装する | 手書き作業の自動化 (実装の整理) |
| #729 | #109 | CI の fail-fast 化: 軽量 check を重い脚より先に回し、軽量失敗で即返す | CI / runtime 性能の責務分割 |
| #746 | #766 | toolchain と README の整合: @types/node を Node 24 系へ、静的 Vitest バッジを CI 連動へ、vitest / esbuild の更新時期を決める | 筋の悪い箇所・削除候補の整理と責務分割 |
| #759 | #591 | 巨大ファイルの分割: src/cli.ts (4,659 行) ほか 1,500 行超のファイルを振る舞い不変で分ける | 筋の悪い箇所・削除候補の整理と責務分割 |
| #762 | #592 | team 系機能 (ut-tdd team run と team definition) を廃止する | 筋の悪い箇所・削除候補の整理と責務分割 |
| #783 | #777 | ゲートの検出力を数値化する: 判定モジュールへの mutation テストと fast-check | ゲート検出力の実測 (リバースで設計を検証) |
| #787 | #777 | ゲートの見逃し率を監査 sampling で実測する (UTV4-FR-024) | ゲート検出力の実測 (リバースで設計を検証) |
| #789 | #70 | 常時の token 取り込みを削り、harness.db の model_runs 肥大を解消する | CI / runtime 性能の責務分割 |
| #791 | #1142 | CI の供給網と資源の上限を固める (Action の SHA 固定、timeout、runner 固定、ブランチ保護の確認) | ゲート検出力の実測 (リバースで設計を検証) |
| #823 | #822 | Pack 全量の Reverse 試行 (性能測定と設計・実装のずれの洗い出し) | Pack 全量 Reverse 試行 (⑤ の実測) |
| #873 | - | review custody の信頼性: 判定が失われる・誤帰責される・束縛されない経路を塞ぐ | review custody の信頼性 (実装を製本にした検証・修正) |
| #899 | #1142 | agent が読む外部テキストを信頼境界の外として扱い、その lane の権限を絞る | 権限の再編と合わせる |
| #902 | #530 | GitHub や AI provider の停止中は review の偽装 merge を止め、縮退運転を記録する | review custody の束 |
| #907 | #873 | GUI レーンの closing review が merge custody に入らず、正規経路で merge できない | review custody の束 (#873) |
| #915 | #393 | review-guard: 前後の path 集合差だけで書き手を決め、別 lane の変更を reviewer に誤帰責しうる (#393 残経路 2) | review custody の束 (#873)。親子の矛盾は上の節 |
| #926 | #873 | merge の B-wrapper 判定に verdict custody の完全性を含めるか (題名の後半は旧契約の節への参照のため省略) | review custody の束 (#873) |
| #937 | #1141 | worktree-remove-guard と wt-remove.sh が、node_modules が本物のディレクトリ (junction ではない) の worktree を片付けられない | 運用の修理 |
| #963 | - | 共有メモリのライフサイクル管理: PR / issue に紐づくエピソードを、閉じたら archive へ退避する | 契約は 2026-10-13 に merge (#964)。実装は先行して進めてよい |
| #979 | #109 | Windows CI の U-DBCURRENCY-024 が再発: 子の join 結果が空で返る | Windows のテスト環境の不安定。通常修理で先に直してよい |
| #982 | #1084 | 旧契約の残り DoD (DEBT-01〜04) を追跡する: 01 は修理、02〜04 は工程 ⑤ (題名の旧契約 ID は省略) | DEBT-02〜04 は工程 ⑤ (題名のとおり) |
| #998 | #963 | 共有メモリの教訓を運用ルールと機構へ昇格させる (feedback 132 件の棚卸し) | 教訓の昇格は仕組みの棚卸し。共有メモリの束 (#963) |
| #1062 | #1084 | 状態を伝える経路の一本化: メモリを教訓専用に戻し、連絡と handover prose を退役する | 連絡と handover prose の退役。#1116 (縮退 群1: 連絡経路) と対象が重なる |
| #1082 | #1002 | hook の縮退棚卸し: 機能の退役で要らなくなる・縮む hook を、契約のたびに確かめる (#1002 §203 の切り出し) | hook と baseline の縮退の棚卸し (#1002) |
| #1084 | - | 責務の重複した機能群を縮退させる (統合・削除 11 群、退役に依存しない群から着手) | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1093 | #1002 | oracle-test-trace の固定 baseline 89 件が stale 判定の対象外になっている | hook と baseline の縮退の棚卸し (#1002) |
| #1116 | #1084 | 縮退 群1: 連絡経路（#1084） | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1117 | #1084 | 縮退 群2: review の往復（#1084） | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1119 | #1084 | 縮退 群4: team run / delegation / agent-slots / roster（#1084） | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1120 | #1084 | 縮退 群5: 固定ワークフロー（#1084） | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1121 | #1084 | 縮退 群6: 横断ヘルパ（#1084） | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1122 | #1084 | 縮退 群7: Bun / cutover 系 lint（#1084） | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1123 | #1084 | 縮退 群8: G8 / G9 / G10 workflow lint（#1084） | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1124 | #1084 | 縮退 群9: oracle trace / citation baseline（#1084） | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1125 | #1084 | 縮退 群10: production consumer なし（#1084） | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1128 | #1084 | 縮退 群12: harness.db のテーブル（読み手の無い token 行と未使用テーブル）（#1084） | 責務の重複した機能群の縮退 (#1084)。退役に依存しない群は先に着手してよい |
| #1129 | #1141 | subagent の終了後も、その subagent が起動した vitest の snapshot run が親なしで残り、PC を圧迫する（再発） | 実行資源と worktree の事故 (#1141)。通常修理で先に直してよい |
| #1141 | - | 実行資源と worktree の事故を再発させない（親なしの子プロセス・worktree 削除・遅い doctor） | 実行資源と worktree の事故 (#1141)。通常修理で先に直してよい |
| #1231 | #873 | review の author provider の申告を Git の事実に束縛するかを決める (PO 承認境界、#1225 AC-2) | review custody の束 (#873)。PO 承認境界 |
| #1317 | #109 | Windows検証runnerでfile symlink fixtureがEPERMとなる環境前提を明確化する | Windows のテスト環境の不安定。通常修理で先に直してよい |
| #1340 | #1084 | Refactor: ddd-tdd-rules.ts を責務ごとの module に分ける (#1293 で候補値を超えた) | 責務の分割 (Refactor) |
| #1431 | #109 | Windows ローカルで Memory 全件再実行テストがタイムアウトする | Windows のテスト環境の不安定。通常修理で先に直してよい |
| #1459 | #1141 | 終わったのに残っているプロセス・worktree・エージェントの枠を見つけて片付ける仕組み (reap) | 実行資源と worktree の事故 (#1141)。通常修理で先に直してよい |
| #1460 | #1141 | doctor の singleton lock が、生きている doctor の lock も 45 分で回収して二重起動を許す | 実行資源と worktree の事故 (#1141)。通常修理で先に直してよい |

### 工程 ⑥ 要件の再整理と凍結 (18 件)

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
| #1005 | #530 | v4 工程 ⑥: 要件の再整理にあわせて技術スタックを監査し、最終構造に要る技術だけを残す | 題名のとおり工程 ⑥ |

### 工程 ⑦ テンプレートとスキルの補強 (12 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #119 | #877 | disposition catalog の統合主張と profile/正本実体の乖離 (saas/regulated axis 未定義・quota merge 未履行・api-service slot 不在) | テンプレート・スキル補強 |
| #120 | #877 | 検証設計の内容カタログ欠落: テスト技法・テストデータ設計・契約テスト・多軸カバレッジ基準・AI 成果物 eval が未翻訳 | テンプレート・スキル補強 |
| #121 | #877 | ops/appsec/supply-chain 系 semantic item の採否判断が未記録 (not_applicable 明示 or 翻訳の裁定待ちが無音欠落化) | テンプレート・スキル補強 |
| #705 | #877 | V-model テンプレート: 管理 yaml の図・トレース・粒度情報を slot テンプレートへ取り込む対応ルールを決める (#676 後続) | #676 (①) の子だが内容はテンプレート (⑦)。#766 か #877 へ付け替え候補 |
| #727 | #766 | skill 本文を「機械化枠 / 運用枠 / 一般論」で仕分け、運用枠と gate 参照だけに絞る | テンプレート・スキル補強 |
| #765 | #766 | PoC でプロトに差し込んだログを検証の証拠として認め、ログ設計の入力にする | テンプレート・スキル補強 |
| #766 | - | 保守性の棚卸し: 気づける・直せる・戻せる の 12 要素 (harness と consumer template) | テンプレート・スキル補強 |
| #795 | #793 | プロファイルに第 3 軸「デプロイ先」を加え、文書と観点の採用を切り替える | テンプレート・スキル補強 |
| #796 | #793 | consumer 向けインフラ系テンプレートに記入例を入れる (L4 / 025 / 026 / 035 / 038 / L13 / L14) | テンプレート・スキル補強 |
| #877 | - | V-model ZIP の忠実性: semantic item の採否と内容カタログの欠落を埋める | テンプレート・スキル補強 |
| #1196 | #877 | L1 の BR / FR / 画面が L3 の設計文書まで降りていることを確かめる lint が無い | 設計の検査の補強 (L1 → L3 の lint) |
| #1226 | #1084 | consumer 向け UI 標準を §1c とテンプレートへ移し、画面カットの前に 3 条件をそろえる (#1169 A5-C46) | consumer 向け UI 標準のテンプレート。親 #1084 (⑤) からの付け替えを提案 |

### 工程 ⑧ 反復リリース (15 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #303 | #590 | 駆動モデル workflow の自動生成と FLAG 教訓の永続還流 (既存機構の合成) | v4 機能の実装→内部デプロイ→リリース |
| #304 | #303 | S1: workflow suggest — 既存分類/route/skill 機構の合成による駆動別 workflow 生成器 | v4 機能の実装→内部デプロイ→リリース |
| #305 | #303 | S2: レビュー FLAG 類型の構造化格納 (findings) と checklist への永続還流 | v4 機能の実装→内部デプロイ→リリース |
| #413 | #875 | memory のグローバル化とプロジェクト間隔離 (後回し / Pack リリース後) | v4 機能の実装→内部デプロイ→リリース |
| #589 | - | v4 version-up R04 (0.4.0): 低コスト CI・共有 view・順序予測 (提案のみ) | v4 機能の実装→内部デプロイ→リリース |
| #590 | - | v4 version-up R06 (0.6.0): UT 準拠 BugBot (再現可能な局所不具合の限定修理と独立受入) | v4 機能の実装→内部デプロイ→リリース |
| #790 | - | 画面領域: 機械検証とプロトから本番への継承を整える | v4 機能の実装→内部デプロイ→リリース |
| #793 | - | consumer のデプロイ先と環境をモデル化する (プロファイルの第 3 軸、環境 record、デプロイ receipt) | v4 機能の実装→内部デプロイ→リリース |
| #797 | #793 | 環境 record とデプロイ receipt の schema を作る | v4 機能の実装→内部デプロイ→リリース |
| #798 | #793 | G13 のスモークと SLO の観測をデプロイ receipt に束縛する | v4 機能の実装→内部デプロイ→リリース |
| #816 | #224 | リリースノートと CHANGELOG を機械生成する (canary.3 向けの最小版を先行) | v4 機能の実装→内部デプロイ→リリース |
| #875 | - | 共有 memory の衛生: 配送・読み取り・入口検査・未追跡の堆積 | v4 機能の実装→内部デプロイ→リリース |
| #1083 | #588 | 固定ワークフローをやめ、ticket ごとに手順 (Red / Green / Refactor など) を組み上げて発行する (合成ワークフロー、PO 決定 2026-10-16) | 合成ワークフロー (PO 決定)。チケット正本へ切り替える版で扱う。構想の候補文書に未反映 |
| #1327 | #530 | v4 必須: チーム開発と複数 PC で使えるようにする (操作者・PC の識別、共有状態の正本、guard の repo 昇格) | v4 必須 (PO 判断 2026-10-23)。⑥ で要件に入れ、⑧ で実装する。#1330 は候補文書に未反映 |
| #1330 | #530 | v4 必須: 1 つのプロダクトを複数の repo で開発できるようにする (WEB 版とアプリ版など、共有契約と repo をまたぐ変更の管理) | v4 必須 (PO 判断 2026-10-23)。⑥ で要件に入れ、⑧ で実装する。#1330 は候補文書に未反映 |

### 工程 ⑨ リバース工程 (0 件)

いま回収する issue はありません。

### 工程 ⑩ 製本 (2 件)

| issue | 親 | 題名 | 根拠 |
|---|---|---|---|
| #224 | - | 段階リリース管理 (release channel / promotion) を harness の機能ドメインとして追加する | 正式な段階リリース (フル Pack デプロイ) |
| #1033 | - | v4 で作ったシステムの設計書・仕様書を Office へ書き出す: リリース時の運用マニュアル (Word) と構築時の設計書 (Excel) | リリース時の Office 書き出し (README 結論表 ⑩) |

### 工程 ⑪ チーム投入 (0 件)

いま回収する issue はありません。
