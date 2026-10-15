# UT-TDD：構想v4までのリリース・置換・移行ロードマップ

**文書版2.3／2026-10-14 (版2.2 は 2026-10-13、版2.1 は 2026-10-08、版2.0 は 2026-09-08)。** 版2.3 では、PO の指示 (2026-10-14) に合わせて、② の進め方を「PLAN を消して壊れる依存だけを外し、② の中で PLAN を退役させる」に改め、PLAN 退役から ⑧ までの暫定の運用と、⑩ の Office 書き出し (#1033) を足しました。版2.2 では、2026-10-13 時点の現在地 (下の「現在地」)、工程 ③ への版上げの集約、移行の進み具合の 3 指標を足しました。 版2.0 の版別計画を、2026-10-08 に PO が決めた v4 完遂までの工程順 ①〜⑪ (#530 コメント 6051336079、補足 6051373331) に合わせて直しました。**工程順が版割当より優先します。** 版割当が工程順と食い違う箇所は工程順に合わせ、決められない対応は「⑥ で確定」としています。runtime 実装・CI 実行・製品受入は行っていません。

## 結論：工程 ①〜⑪ と配布版

| 工程 | やること | 配布版 | 旧 R との対応 |
|---|---|---|---|
| ① | 現行のリリースパックを出す。完了条件は (1) canary.6 の公開、(2) 公開 asset からの AT-DIST-003 (015〜019) と AT-835-008 の PASS、(3) #418 のクローズ の 3 点 (6052098864)。#393 (review custody の取りこぼし) と #894 (記入欄の残存検査) を並行で直す | 0.2.0-canary.6 | R00 を閉じる。R01 のライセンス切替は Apache-2.0 で実施済み (#682) |
| ② | 設計正本を凍結し、PLAN を退役させる。(a) 設計書を保護する gate (実装 PR で設計書・oracle を書き換えられず、変更は契約改訂 PR に限る) を入れる (#898)、(b) `src/` の module と設計文書の対応表を作り、ずれごとに原因を判定する (#960、#977。設計の欠陥は Redesign、設計が古いだけなら設計を実装に合わせる、実装だけの欠陥は Red / Green の修理 PR)、(c) **PLAN を消して壊れる依存を外す** (PO 2026-10-14、#958 の計測): `docs/plans/` を消した tree で doctor とテストを流し、壊れたものを C (テストを止める依存) → B (PLAN を入力・証拠として読む検査。読み先を設計文書へ付け替える) → A (PLAN を管理する検査。PLAN と一緒に退役) の順に、1 件 1 チケットで直列に直す。PLAN の中身 (DoD・oracle・契約) を 1 件ずつ判定し直すことはしない、(d) 設計文書の肥大を止める (doc-split gate #1032、L6 completion の単一 L7 依存を外す #1035)、(e) PLAN を一括で退役させ (退役 commit の SHA を #958 に記録)、digest で凍結する。完了条件は、(1) PLAN を消した状態で doctor とテストが通ること、(2) 未実装の契約が失われていないこと (PLAN にだけあった未実装の契約が、設計文書の「未実装の目標契約」か open の issue に残っていることを、退役の PR で確かめる)、の両方。新しい PLAN の起票・confirm と台帳の変更は、② の開始以降は行わない (#1011 は ⑧ の入力として保留)。実装 PR では設計書を書き換えない ((b) の gate)。振る舞い不変の責務分割は ⑤。移行は複数 PR に分ける | なし。ただし (d) で実装を直した場合は、出口が次の canary の切り替え点になる | 新設。R03 の契約 inventory (SL-R03-01) の前提になる |
| ③ | その時点の最新 canary を開発ハーネス自身に Pack consumer として導入し、Pack 経由で版上げする (更新・保持確認・rollback を実測)。版上げの仕組み (#930 の runtime 更新、#481 の updater、#928 の Linux 受入、#867 の version 表示) はここでまとめて作る。同じ consumer root で導入 → 執筆 → 独立レビュー → merge gate を連続で通す E2E を、版上げと rollback の前後で実測する (#961)。前提として、前の版へ戻す rollback と、緊急時に source の CLI で動ける退避路を用意する。並行して別プロジェクトへ投入し、フィードバックを受ける | その時点の最新 canary を自己導入し、次の canary へ Pack 経由で更新する (③ の blocker 修理もこの版に入れる) | R02 の rollback / updater (#481) を前提として前倒し。2 consumer 受入 (#364) もここ |
| ④ | 新ディレクトリ構成へ再編する | 次の canary (構成変更の版。旧構成からの更新と rollback を受入で確かめる) | 新設 |
| ⑤ | リバースリファクタリング: 実装を製本として設計を検証・修正し、責務を分割する | 次の canary (振る舞いが変わらないことを、④ と同じ受入で結果に差が無いことで確かめる) | 新設。構想書 §移行 (Reverse を右腕として回す) の最初の周回 |
| ⑥ | 要件を再整理して凍結する。版割当 (R02〜R10 の中身と順序) と trace の再計算もここで確定する | なし | 全 R の範囲を見直す |
| ⑦ | テンプレートとスキルを補強してから設計する | 次の canary (consumer へ配るテンプレート・スキルが変わるため) | 新設 |
| ⑧ | 実装→内部デプロイ→リリースのサイクルを回す。PLAN は ② で退役済みなので、最初の版で、② から使っている暫定の運用 (下の「PLAN 退役から ⑧ までの暫定の運用」) を tracked のチケット正本へ切り替える。そのとき、簡易の複数人運用を同時に入れる (下の「簡易の複数人運用」)。⑨ の対象範囲と完了条件は ⑧ が終わる前に決める | 0.3.0〜0.9.0 を各版 canary だけで出す (候補順は旧 R02〜R09、⑥ で確定。0.2.0 stable は出さない) | R02〜R09 |
| ⑨ | リバース工程に入り、設計と検証を行う | 1.0.0 の rc | 新設 (R10 の前段) |
| ⑩ | 設計正本を直し、設計・実装・仕様書を整え、フル Pack をデプロイする。リリース時に、運用マニュアル (Word) と構築時の設計書 (Excel) を正本から一方向に書き出す (#1033) | 1.0.0 | R10 |
| ⑪ | 別プロジェクト案件にチームで投入する | 1.0.0 以降 | 新設 |

工程を通した規則 (補足 3): ③ から並行する別プロジェクトのフィードバックは、そのサイクルで直すのを blocker だけにし、それ以外は ⑤ か ⑥ の backlog に積みます。open issue をどの工程で閉じるかは [execution/04_ISSUE_INTAKE.md](execution/04_ISSUE_INTAKE.md) にあります。

リリースの切り替え点の規則と工程ごとの一覧は [00_VERSION_STRATEGY.md](00_VERSION_STRATEGY.md) の「リリースの切り替え点」にあります。**正式版は 1.0.0 だけです (PO 決定 2026-10-13、#530 コメント 6139060937)。** 0.2.0 stable は出さず、⑧ の 0.3.0〜0.9.0 も canary だけで出します (rc と正式版は作りません)。

## 現在地 (2026-10-14)

| 工程 | 状態 | 親 issue / 根拠 |
|---|---|---|
| ① | **完了**。canary.6 を公開し、#418 を閉じた。続けて canary.7 を main の修理だけで公開した (2026-10-09、Windows 受入 PASS、#946) | #946 |
| ② | **進行中**。設計書保護 gate の Red と正式 oracle は merge 済み (#1012、#985)、実装 (Green) が残る。対応表 (#960) は完了。2026-10-14 に進め方を変更: PLAN を消した tree の計測で、doctor の検査 25 件 (C 1 / B 14 / A 10) とテストの前処理 (`db rebuild`) が壊れることが分かった (#958 comment 6163921093)。C の `db rebuild` (T1) と B の `l6-completion` (#1035、T2) から直している (#959)。PLAN ごとの再判定と還流の PR は止めた | #958 |
| ③ | 未着手。着手条件は ② の凍結完了と、worktree・ブランチの全面クリーン化 (下の「③ の着手条件」) | #961 |

**版2.3 で置き換える旧記述**: ② の進め方と ⑧ の PLAN 廃止について、本 README の版2.3 の記述が、同じ dir の旧い記述より優先する。置き換える旧記述は、`00_VERSION_STRATEGY.md` の「⑧ の最初の版で PLAN を廃止する」、`execution/01_DEPENDENCIES_AND_WORK_PACKAGES.md` の「② で全 PLAN を仕分け、生きている PLAN の契約を反映し設計を再編する」、`execution/04_ISSUE_INTAKE.md` の「#959 は全 PLAN の仕分け」と、② の (a)〜(d) を旧い定義で参照している箇所。これらの文書は、② の作業で触るときに版2.3 に合わせて直す。

**PLAN 退役から ⑧ までの暫定の運用 (2026-10-14、#958 comment 6164646092)**: ② で PLAN を退役させてから、⑧ でチケットの正本へ切り替えるまでは、新しい仕組みを作らず次で管理する。
- 作業の単位と所有者: GitHub Issue (#958 / #959 などの sub-issue)。担当レーンと完了条件 (checklist) を issue 本文に書く。
- 契約: 設計文書と test-design。L6 文書は `issue:` で所有者を示す (#1035 の実装後)。
- 独立レビュー: PR ごとの非著者 family の closing review と receipt。merge は `ut-tdd pr merge`。
- 証拠: PR・receipt・CI run。
- 旧 PLAN の履歴: 退役 commit の SHA から git の履歴でたどる。
- 未実装の契約: 設計文書の「未実装の目標契約」と open の issue で追う。

**③ の着手条件: worktree・ブランチの全面クリーン化 (PO 指示 2026-10-13)**: ③ でハーネス自身に Pack を導入する前に、作業用の worktree とブランチを全面的に片付ける。自己導入の前後で状態を比べるとき、残った worktree・ブランチ・未追跡の作業物が混ざらないようにするためである。完了条件は次のとおり。
- `C:/dev/` 直下の作業 worktree (レーン・review 用を含む) が、作業中の PR に対応するものだけになっている。片付けは 1 件ずつ、tip が main に入っていることを確かめてから行い、`node_modules` の junction を先に外す。
- remote と local のブランチが、main・作業中の PR・保護すべき履歴だけになっている。tip が main に無いブランチは、消す前に PR か issue で扱いを決める。保護すべき履歴の一覧はこの作業の PR に残す。
- main checkout の未追跡ファイル (`.ut-tdd/handover/` の一時資料など) が、追跡すべきものと退避するものに仕分けられている。
- 片付けた件数と、残したものとその理由を、③ の親 issue (#961) に記録する。

**canary.8 の扱い (PO 判断 2026-10-13)**: canary.8 を「版上げできる版」として先に出す計画は中断した。単独では手動で asset と digest を指定する経路しか作れず、自動検出・rollback (#481)、Linux (#928)、旧版からの更新が揃わないためである。版上げは工程 ③ (#961) でまとめて作り、その時点の canary として出す。中断点と再開手順は #930 の中断記録コメントにある。canary.7 は、版上げ無し・Windows のみ・修正は ③ 以降の版で届く、という前提で試験導入に使ってよい。

## 移行の進み具合の指標 (#947)

各工程の完了判定には、機能の追加数ではなく管理コストの縮退を使う。仕組みは作らず、基準値と同じく手で測る。

1. **撤去できた旧機構・重複契約の数**: 工程 ② の凍結では、新しく足す契約と同じ数以上の退役対象を列挙することを完了の条件にする。
2. **1 チケットを完了するまでの CI・レビュー・やり直しの回数**: PR ごとの CI run 数、FLAG 数、rechain の回数。基準値は直近 40 PR で CI 86 回 (失敗・キャンセル 32 回)、FLAG receipt 26 件 (#947)。
3. **要求の確定から検証済みの merge までの実測時間**: 基準値は Issue→merge の中央値 48.0h、PR→merge の中央値 1.09h (#947)。

試験導入の評価では、あわせて次を比べる (外部監査 2026-10-13): 実チケットが完了まで収束するか、ハーネスを使わない場合より修正回数・レビュー回数・総リードタイムが減るか、ハーネス自身の修理と証跡管理の工数が実装の工数を上回っていないか。

## 簡易の複数人運用 (PO 2026-10-08)

チケットへ切り替えた時点から、複数人で回せる形にします。R05 (0.5.0) のチケット自動発行・lease・動的な再計画は待ちません。

- 配り方は「最初にまとめて配り、各自が消化する」にします。サイクルの初めに、互いに依存しない機能・責務の単位でチケットを複数枚切り (UTV4-FR-032)、触る path が重ならないことを確かめてから一度に配ります。各自は自分に割り当てられた分だけを消化します。途中で配り直したり取り合ったりしないので、lease や動的な再計画が無くても衝突が起きにくくなります。依存が残る部分は、先にインターフェースだけを決めるチケットを切ります。サイクル中に新しく出た作業は次のサイクルで配ります。blocker だけは例外として、その場で 1 人に割り当てます。
- チケットの正本は repo の tracked ファイル (1 記録 = 1 ファイル) です (UTV4-FR-004 / FR-006)。全員が git の main で同じ正本を共有します。主担当は 1 人 (UTV4-FR-003) で、着手の宣言 (claim) もチケットの記録に残し、claim 済みへの 2 件目は deny します (UTV4-FR-005)。担当替えは付け替えの記録を残します (UTV4-FR-030)。成果物は PR です。GitHub の Issue / Sub-issue / assignee は正本からの一方向の投影で、GitHub 側の編集を正本へ読み戻しません。
- review の証跡は PR の exact-head receipt に置き (UTV4-FR-004)、receipt は 1 記録 = 1 ファイルの正本、harness.db は正本から作り直せる索引にします (UTV4-FR-006)。これで誰の clone からでも、同じ receipt を merge の判定に使えます。receipt を git の中に置くか外に置くかは要件の未確定事項 U-1 なので、この版の前に決めます。現状は receipt と harness.db が clone ごとの手元にしかないため (`.ut-tdd/review/receipts/` と `.ut-tdd/harness.db` は gitignore)、別の人の clone では merge できません。この修理は #907 (GUI で出した review が正規の receipt にならない) と同じ根なので、#907 と一緒に直します。
- チケットの消化を GitHub Projects で見られるようにします。Projects も正本からの一方向の投影です。列と項目はチケットの記録と PR・CI・review・merge の事実から一方向に同期し、人が手で状態を動かす入力にはしません (UTV4-FR-012)。状態は「未着手 (assignee なし) → 着手 (claim 済み) → PR あり → review PASS → merge 済み」で、子チケットの消化数を親へ集計します。同期の仕組みは新しく作らず、PLAN 単位で動いている既存の `src/github/project-v2.ts` (`syncForwardProject`) の単位をチケットへ付け替えます。
- 入れる時期: ⑧ の最初の版。PLAN は ② で退役済み (UTV4-FR-007 を前倒し) なので、暫定の Issue 運用からチケット正本へ切り替える版にし、その時点で複数人に対応させます。⑪ のチーム投入より前に、運用の実績を作るためです。

## 参考：版2.0 の版別範囲 (2026-09-08)

下表は版2.0 の版別範囲です。**R02〜R10 の中身と順序は ⑥ で見直します。** R00/R01 の行は実績と食い違っています (Pack は canary.1〜5 を公開済み、ライセンスは MPL-2.0 ではなく Apache-2.0)。

| 配布版案 | 利用可能にする範囲 | まだ有効にしないもの |
|---|---|---|
| 0.2.0-canary.1 | 現行MITの初回Pack-only受入 | v4新機能をCanaryの追加blockerにしない |
| 0.2.0-canary.2 | **UT本体のMPL-2.0移行**、管理・権利・対象版の定義 | 過去MIT版の書換え、機能全有効化 |
| 0.2.0 | updater、A/B独立更新・rollback、現行運用基盤 | v4全体の完成主張 |
| 0.3.0 | **共通JSON契約・reader/writer・移行adapter** | 予測だけを根拠とする配布、書込BugBot |
| 0.4.0 | consumer低コストCI、表・図、**読取専用の作業順序予測** | 自動配布、推定値の確定時刻扱い |
| 0.5.0 | 4階層ticket、**制約付き配布・再計画**、排他・安全・回復 | 実Botによる自動修正 |
| 0.6.0 | **UT準拠の限定BugBot**、再現→修正→独立受入 | 自己承認、検査緩和、無限retry |
| 0.7.0 | 上流要求・PoC・画面製本、backflow・再compile、active PLAN移行 | 学習器のauthority変更 |
| 0.8.0 | provider-native生成、単一providerの補償統制、能力再評価 | provider名だけを根拠とする独立性認定 |
| 0.9.0 | 対策資産・context縮退・低価格化、**実績で校正する順序予測** | 新モデルだから安全/速いという無根拠昇格 |
| 1.0.0 | **構想v4の全範囲・移行・consumer統合受入**とpublic API安定化 | 未移行のactive二重writer・架空のPASS |

**構想v4.0とpackage4.0.0は同じではありません。** 2026-10-13 時点で Pack は 0.2.0-canary.7 まで公開済みです (prerelease、Windows 受入 PASS、#946)。source の package.json の表示は 0.2.0-canary.1 のままです (#867)。本計画では構想v4統合受入をpackage1.0.0へ対応付けます。版割当は今回の具体案であり、公開済みtagでも正式採番の完了でもありません。[GH-PKG][GH-PR517]

## 読む入口

| 確認したいこと | ファイル |
|---|---|
| 版番号、patch/minor、channel、サポート、branchのルール | [00_VERSION_STRATEGY.md](00_VERSION_STRATEGY.md) |
| 各版の差分・対応範囲 | [01_RELEASE_MATRIX.md](01_RELEASE_MATRIX.md) → `releases/`の11文書 |
| 各版時点で何がどこまで使えるか（累積） | [trace/CAPABILITY_MATRIX.md](trace/CAPABILITY_MATRIX.md) |
| 現行資産の再利用・変更しないもの | [02_CURRENT_BASELINE.md](02_CURRENT_BASELINE.md) |
| 20領域の旧→新、既定化、旧writer停止、退役判定 | [migration/00_REPLACEMENT_MATRIX.md](migration/00_REPLACEMENT_MATRIX.md) |
| JSON/PLAN/権限の一正本移行と失敗回復 | [migration/01_AUTHORITY_AND_RECORDS.md](migration/01_AUTHORITY_AND_RECORDS.md) |
| consumerの段階更新・状態互換・rollback | [migration/02_CONSUMER_UPGRADE_AND_ROLLBACK.md](migration/02_CONSUMER_UPGRADE_AND_ROLLBACK.md) |
| CI/role/Memory/図などの個別置換 | [migration/03_COMPONENT_CUTOVERS.md](migration/03_COMPONENT_CUTOVERS.md) |
| 実コード面と契約族別のread/write切替 | [migration/05_SURFACE_AND_SCHEMA_PLAN.md](migration/05_SURFACE_AND_SCHEMA_PLAN.md) |
| MPL対象、旧MIT、第三者、コピーされる生成物 | [migration/04_LICENSE_BOUNDARY.md](migration/04_LICENSE_BOUNDARY.md) |
| 順序予測・配布・再計画の仕様案と14受入ケース | [workstreams/01_SCHEDULING.md](workstreams/01_SCHEDULING.md) |
| AI/CIコスト、セキュリティ、管理、context、BugBot | `workstreams/02`〜`06` |
| 実装順・並行可能範囲・責務別作業単位 | [execution/01_DEPENDENCIES_AND_WORK_PACKAGES.md](execution/01_DEPENDENCIES_AND_WORK_PACKAGES.md) |
| #517へ渡す短い差し込み指示 | [execution/02_PR517_INTEGRATION.md](execution/02_PR517_INTEGRATION.md) |
| 実装前に採択する16契約判断 | [execution/03_CONTRACT_DECISIONS.md](execution/03_CONTRACT_DECISIONS.md) |
| open issue を閉じる工程 | [execution/04_ISSUE_INTAKE.md](execution/04_ISSUE_INTAKE.md) |
| 旧候補 (32BR・59FR・72AC) をどの版で閉じるか。現行の候補は 49BR・76FR・89AC (release 必須 41) で、対応表の再計算は ⑥ | [trace/REQUIREMENT_COVERAGE.md](trace/REQUIREMENT_COVERAGE.md) / [AC_COVERAGE.md](trace/AC_COVERAGE.md) |
| 今回までの追加13要求 | [trace/ADDITIONS.md](trace/ADDITIONS.md) |
| 出典と、行った資料検査の範囲 | [SOURCES.md](SOURCES.md) / [VALIDATION.md](VALIDATION.md) |

## 実装担当へ渡す単位

最初に版規則と当該release文書を読み、その版のSL、対象MIG、FR/AC、該当workstreamだけを渡します。全資料を毎回promptへ投入しません。Markdownは方針説明、`data/*.json`はこの**計画資料**の版・依存・対応表の正本です。製品の実行用schemaやapproval recordではありません。ただし `data/*.json` の版・channel・公開手順 (例: `data/releases.json` の R02 / 0.2.0 stable、「canary/rc で A/B 検証後 stable channel へ」) は版2.0 (2026-09-08) の旧参考です。工程順 ①〜⑪ と、正式版を 1.0.0 だけにする PO 決定 (2026-10-13、#530 コメント 6139060937) と食い違う箇所は、上の結論表と [00_VERSION_STRATEGY.md](00_VERSION_STRATEGY.md) を正とします。

各release文書は「できること／未対応／旧新／依存／作業単位／受入／有効化／切戻し／退役／要求対応／読取範囲」を持ちます。既定化はそのconsumerの承認と移行成立後であり、全導入先への強制更新ではありません。

## 新旧を入れ替える共通原則

`棚卸し → 旧を正本のままshadow読取 → 同等性検証 → 対象writerを停止 → 変換 → 差分照合 → 新writerだけを有効化 → 旧はreadonly → 証拠付き退役`

併存は「二重writer」ではありません。同一recordの書込み正本は常に一つです。新世代で書き込んだ後のrollbackは単なる古いsnapshot復元ではなく、増分・副作用・schema互換を検査します。歴史PLAN/旧receiptを削除して帳尻を合わせません。

予測・チケット生成・配布は別責務です。先行taskが予測時刻になっても、それだけでは着手できません。実際の依存証拠・権限・資源・leaseを直前に再確認します。

## 前版からの移設表

| v1.3の章/段階 | 本版の主な置き場 |
|---|---|
| §1〜3 方針・M0〜M6 | 00/01、release別文書、累積capability表 |
| §4 MPL | migration/04、R01 |
| §5 JSON・費用 | migration/01、workstreams/02、R03/R04 |
| §6 自動修正・回復 | workstreams/06、R05/R06 |
| §7.1〜7.5 元v4機能 | 全FR/ACのtrace、R04〜R09、migration/03 |
| §7.6 安全性 | workstreams/03、R01/R03/R05の先行境界 |
| §7.7〜7.8 context/対策 | workstreams/05、R03計測→R09昇格 |
| §7.9 管理体制 | workstreams/04、R01方針→R03契約→R05強制 |
| §8 契約論点 | execution/03、migration全体 |
| §9〜10 対応・測定 | trace、data、各版AC・作業単位 |
| §13 #517差し込み | execution/02 |
| 今回追加の順序予測 | workstreams/01、07、R03/R04/R05/R09、RM-ADD-12 |

前版は履歴として保持します。本版が版配分/移行順の最新版です。旧版の「詳細は後で」の割当だけを併用して、別々の実行計画を立てないでください。

## 資料検査の再実行

版2.0 の python 検査 tool は repo に収容していません ([INTAKE_MANIFEST.md](INTAKE_MANIFEST.md))。版2.1 で行った検査と結果は [VALIDATION.md](VALIDATION.md) にあります。
