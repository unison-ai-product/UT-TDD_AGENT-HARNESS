# UT-TDD：構想v4までのリリース・置換・移行ロードマップ

**文書版2.1／2026-10-08 (版2.0 は 2026-09-08)。** 版2.0 の版別計画を、2026-10-08 に PO が決めた v4 完遂までの工程順 ①〜⑪ (#530 コメント 6051336079、補足 6051373331) に合わせて直しました。**工程順が版割当より優先します。** 版割当が工程順と食い違う箇所は工程順に合わせ、決められない対応は「⑥ で確定」としています。runtime 実装・CI 実行・製品受入は行っていません。

## 結論：工程 ①〜⑪ と配布版

| 工程 | やること | 配布版 | 旧 R との対応 |
|---|---|---|---|
| ① | 現行のリリースパックを出す。完了条件は (1) canary.6 の公開、(2) 公開 asset からの AT-DIST-003 (015〜019) と AT-835-008 の PASS、(3) #418 のクローズ の 3 点 (6052098864)。#393 (review custody の取りこぼし) と #894 (記入欄の残存検査) を並行で直す | 0.2.0-canary.6 | R00 を閉じる。R01 のライセンス切替は Apache-2.0 で実施済み (#682) |
| ② | 旧設計をリファクタリングして設計正本を凍結する。順序は (a) 全 PLAN を「生きている / supersede 済み / 廃止予定」に仕分けて量を確定する、(b) 設計書を保護する gate (実装 PR で設計書・oracle を書き換えられず、変更は契約改訂 PR に限る) を入れる、(c) 実装と設計の参照照合: `src/` の module と設計文書の対応表を作り、設計の無い実装・実装の無い設計・内容のずれを列挙する、(d) ずれごとに証拠を集め、原因が上流 (設計) にあるかを判定する。設計の欠陥なら Redesign (route `redesign`: 差し替える既存設計を 1 件 supersede し、設計から実装へ降りる) で設計を直し、実装は Forward の Red / Green PR で作り直す。設計が古いだけなら設計を実装に合わせる。実装だけの欠陥なら Red / Green の修理 PR にする。併せて設計側のリファクタリング (生きている PLAN の契約の反映、重複の統合、責務単位への再編、欠落の補完) を行う、(e) 凍結。実装 PR では設計書を書き換えない ((b) の gate)。振る舞い不変の責務分割は ⑤。移行は複数 PR に分ける | なし。ただし (d) で実装を直した場合は、出口が次の canary の切り替え点になる | 新設。R03 の契約 inventory (SL-R03-01) の前提になる |
| ③ | canary.6 を開発ハーネス自身に Pack consumer として導入し、Pack 経由で版上げする (更新・保持確認・rollback を実測)。前提として、前の版へ戻す rollback と、緊急時に source の CLI で動ける退避路を用意する。並行して別プロジェクトへ投入し、フィードバックを受ける | その時点の最新 canary を自己導入し、次の canary へ Pack 経由で更新する (③ の blocker 修理もこの版に入れる) | R02 の rollback / updater (#481) を前提として前倒し。2 consumer 受入 (#364) もここ |
| ④ | 新ディレクトリ構成へ再編する | 次の canary (構成変更の版。旧構成からの更新と rollback を受入で確かめる) | 新設 |
| ⑤ | リバースリファクタリング: 実装を製本として設計を検証・修正し、責務を分割する | 次の canary (振る舞いが変わらないことを、④ と同じ受入で結果に差が無いことで確かめる) | 新設。構想書 §移行 (Reverse を右腕として回す) の最初の周回 |
| ⑥ | 要件を再整理して凍結する。版割当 (R02〜R10 の中身と順序) と trace の再計算もここで確定する | なし | 全 R の範囲を見直す |
| ⑦ | テンプレートとスキルを補強してから設計する | 次の canary (consumer へ配るテンプレート・スキルが変わるため) | 新設 |
| ⑧ | 実装→内部デプロイ→リリースのサイクルを回す。最初の版で PLAN を廃止してチケットへ切り替えるとき、簡易の複数人運用を同時に入れる (下の「簡易の複数人運用」)。⑨ の対象範囲と完了条件は ⑧ が終わる前に決める | 0.2.0 stable と 0.3.0〜0.9.0 (候補順は旧 R02〜R09、⑥ で確定) | R02〜R09 |
| ⑨ | リバース工程に入り、設計と検証を行う | 1.0.0 の rc | 新設 (R10 の前段) |
| ⑩ | 設計正本を直し、設計・実装・仕様書を整え、フル Pack をデプロイする | 1.0.0 | R10 |
| ⑪ | 別プロジェクト案件にチームで投入する | 1.0.0 以降 | 新設 |

## 簡易の複数人運用 (PO 2026-10-08)

チケットへ切り替えた時点から、複数人で回せる形にします。R05 (0.5.0) のチケット自動発行・lease・動的な再計画は待ちません。

- 共有の正本は GitHub に置きます。チケットは Issue / Sub-issue (UTV4-FR-004)、着手の宣言 (claim) は assignee と作業 branch (UTV4-FR-005)、主担当は 1 人 (UTV4-FR-003)、成果物は PR、担当替えは付け替えの記録を残す (UTV4-FR-030)。
- review の結果を PR に紐づけて検証できる形で残し、誰の clone からでも merge の判定に使えるようにします。現状は receipt と harness.db が clone ごとの手元にしかないため (`.ut-tdd/review/receipts/` と `.ut-tdd/harness.db` は gitignore)、別の人の clone では merge できません。この修理は #907 (GUI で出した review が正規の receipt にならない) と同じ根なので、#907 と一緒に直します。
- 入れる時期: ⑧ の最初の版。PLAN の廃止 (UTV4-FR-007) と同じ版にし、チケットが PLAN に代わる時点で複数人に対応させます。⑪ のチーム投入より前に、運用の実績を作るためです。

工程を通した規則 (補足 3): ③ から並行する別プロジェクトのフィードバックは、そのサイクルで直すのを blocker だけにし、それ以外は ⑤ か ⑥ の backlog に積みます。open issue をどの工程で閉じるかは [execution/04_ISSUE_INTAKE.md](execution/04_ISSUE_INTAKE.md) にあります。

リリースの切り替え点の規則と工程ごとの一覧は [00_VERSION_STRATEGY.md](00_VERSION_STRATEGY.md) の「リリースの切り替え点」にあります。0.2.0 stable を ③ の直後に出すか ⑧ の最初に出すかは、⑥ で確定します。

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

**構想v4.0とpackage4.0.0は同じではありません。** 2026-10-08 時点で Pack は 0.2.0-canary.5 まで公開済みで、canary.6 が工程 ① です (source の package.json の表示は 0.2.0-canary.1 のまま、#867)。本計画では構想v4統合受入をpackage1.0.0へ対応付けます。版割当は今回の具体案であり、公開済みtagでも正式採番の完了でもありません。[GH-PKG][GH-PR517]

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

最初に版規則と当該release文書を読み、その版のSL、対象MIG、FR/AC、該当workstreamだけを渡します。全資料を毎回promptへ投入しません。Markdownは方針説明、`data/*.json`はこの**計画資料**の版・依存・対応表の正本です。製品の実行用schemaやapproval recordではありません。

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
