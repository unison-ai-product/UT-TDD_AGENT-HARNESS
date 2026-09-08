# UT-TDD：構想v4までのリリース・置換・移行ロードマップ

**文書版2.0／2026-09-08。** 前版v1.3のテーマ表を、配布版ごとの利用可能範囲・旧新置換・切替条件へ分割した計画書です。作業順序予測を正式な追補案に含めます。GitHubへのコミット、実ライセンス変更、runtime実装、CI実行、製品受入は行っていません。

## 結論：何をどの版へ載せるか

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

**構想v4.0とpackage4.0.0は同じではありません。** 現在のpackageは0.2.0-canary.1です。本計画では構想v4統合受入をpackage1.0.0へ対応付けます。版割当は今回の具体案であり、公開済みtagでも正式採番の完了でもありません。[GH-PKG][GH-PR517]

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
| 元の32BR・59FR・72ACをどの版で閉じるか | [trace/REQUIREMENT_COVERAGE.md](trace/REQUIREMENT_COVERAGE.md) / [AC_COVERAGE.md](trace/AC_COVERAGE.md) |
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

```sh
python tools/render_roadmap.py --check
python tools/validate_roadmap.py
```

このPythonは配布した計画資料のオフライン整合検査用です。UT本体のTypeScript/Node方針の変更、CIへの導入、scheduler/BugBotの実装を意味しません。外部通信やGitHub書込みはしません。
