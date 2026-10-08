# セキュリティ動向調査と v4 要件への反映案 (2026-10-08)

## 0. 先に結論

- v4 要件 (UTV4-FR-001〜076) は「統制と証跡」に強い。
- 一方、次の領域に対応する FR が無い (ギャップ)。
  - プロンプト注入対策
  - MCP / hook / 設定の完全性
  - agent の最小権限と秘密情報の保護
  - 秘密情報スキャン / SAST / SCA の gate
  - 検知 (SOC 相当) とインシデント対応の runbook
  - 敵対的テスト (red team)
  - release asset の署名と来歴
- FR-074 (依存登録簿) と FR-038 (機微の遮断) と FR-037 (incident record) は部分的に使える。
- 提案は 8 件の新規 FR 候補 (第 5 章)。

## 1. 調査の信頼度について (先に断る)

- 2026-09-01 以降の事案は、一次情報を直接確認できたものと、二次集計経由のものがある。表で区別した。
- 二次集計は SmartScope の個人ブログ集計 (2026-10-08 更新)。同ブログ自身が「網羅ではない」と書いている。
- 検索で JPCERT/CC・NISC・PPC の 9 月以降の公式注意喚起は見つからなかった。存在しないとは言えない。「未確認」とする。
- 件数の多くは「可能性のある最大件数」。確定漏えい件数ではない。

## 2. (a) 2026年9月以降の国内インシデント

### 2.1 一次情報で確認できたもの

| 公表日 | 組織 | 内容 | 侵入経路 | URL |
|---|---|---|---|---|
| 2026-09-16 | Helpfeel (Gyazo) | 約 2,362 万件のユーザー情報と、画像メタデータ約 4.9 億件が流出。9/11 に攻撃、9/12 に遮断、9/15 に個情委へ報告 | 画像アップロードサーバーの脆弱性で任意コマンド実行 | https://corp.helpfeel.com/news/news-20260916-1 |
| 2026-09-11 | デジタル庁 (GSS) | 約 24.6 万件が漏えいの可能性。6/25 に検知、7/9 に原因特定 | VPN 機器の脆弱性を突かれ、保守事業者アカウントでサーバーのファイルへ到達 | https://www.digital.go.jp/news/2026-0911-01 |

### 2.2 ScanNetSecurity 9 月一覧 (2 ページ目、21 件。見出しベース、一次未確認)

一覧: https://scan.netsecurity.ne.jp/special/3359/202609/ (不正アクセス原因別、page=2)

- 有効な認証情報の悪用: 三井不動産 (9/7、最大 5.5 万件) https://scan.netsecurity.ne.jp/article/2026/09/07/56140.html
- リスト型攻撃: ヨネックス オンラインショップ (9/1) https://scan.netsecurity.ne.jp/article/2026/09/01/56091.html
- ランサムウェア: T&K TOKA (9/7)、赤武エンジニアリング (9/2)、サンコーテクノ ベトナム子会社 (9/1)
- Web アプリ / CMS の脆弱性: 東京都管工事工業協同組合の改ざん (9/4)、イエローハット Web 予約システム (9/2、最大約 180 万会員)
- 内部 BI ツールへの侵入: VOISING (9/7)
- 銀行システムへの不正アクセス: 01 銀行 (9/7)
- サポート詐欺を伴う侵入: エスケーアイマネージメント (9/1)

### 2.3 二次集計から拾った大規模事案 (SmartScope、2026-09-01〜10-07、同ブログが企業発表と照合済みと記載)

集計元: https://smartscope.blog/blog/japan-data-breach-list-tier-2026-09-10/
集計は 123 件、うち 10 万件以上は 23 件。侵入経路が書かれた 10 万件以上の事案は、脆弱性 9、委託先管理画面への不正ログイン 2、設定ミス 1、不明 11 (同ブログ集計)。

- 脆弱性: LEAN BODY (9/15、約 44 万件、社内分析ツール Metabase の脆弱性)、VOISING (9/30、約 17 万件、BI ツールの未パッチ脆弱性)、White Essence (10/5、約 105 万件、予約サイトのプログラムの脆弱性)、GMO リサーチ&AI (10/5、最大 94.8 万件)、MrMax (10/6、最大 174 万件)
- 委託先 (サプライチェーン): 大和証券と シチズン時計 (どちらも委託先 Scala 経由、10/5 と 10/6)、旭化成ファーマ (委託先運営サイト、10/6)、第一生命 (人事システムへの第三者アクセス、10/2)
- 設定ミス: i-plug OfferBox (10/5、最大 31.4 万人。侵入ではない)
- 件数の大きいもの (原因は未公表または調査中): EPARK リラク&ビューティ (9/24、約 2,218 万件)、焼肉キング アプリ (10/5、1,079 万件)、タイムズカー (9/28、約 660 万アカウント)、さくらインターネット (9/10、約 136 万アカウント)
- 各社の一次 URL は上記 SmartScope ページに列挙されている。個別の一次確認は未実施。

### 2.4 共通の根本原因 (観測できた範囲)

1. 公開面の脆弱性が未パッチのまま悪用される (VPN 機器、アップロードサーバー、CMS、BI / 分析ツール)。
2. 内部ツール (BI、Metabase) がインターネットから到達できる。
3. 委託先・保守事業者のアカウントや管理画面が突破口になる。
4. 有効な認証情報の悪用、リスト型攻撃。
5. 検知が遅い。デジタル庁は 6/25 に検知し、公表は 9/11。
6. 影響範囲の特定に時間がかかり、公表が段階的になる (続報が多い)。

これは IPA 10大脅威 2026 の組織向け上位 (ランサム、サプライチェーン、脆弱性悪用) と整合する。AI 起因の事案は、この期間の国内の一次情報では確認できなかった。

## 3. (b) 現行ガイダンス

| ガイダンス | 要点 | URL |
|---|---|---|
| IPA 情報セキュリティ10大脅威 2026 (2026-01-29 公表) | 組織向け: 1 ランサム、2 サプライチェーン・委託先、3 AI の利用をめぐるサイバーリスク (初選出)、4 脆弱性悪用、5 標的型、6 地政学、7 内部不正、8 リモートワーク、9 DDoS、10 BEC | https://www.ipa.go.jp/security/10threats/10threats2026.html |
| 経産省 サイバーセキュリティ経営ガイドライン Ver3.0 (2023-03) と IPA プラクティス集第4版 (2026-04-28) | 経営者の 3 原則と重要 10 項目。サプライチェーン全体への目配りを含む。AI 固有の記載の有無は未確認 | https://www.meti.go.jp/policy/netsecurity/downloadfiles/guide_v3.0.pdf |
| AI事業者ガイドライン 第1.2版 (総務省・経産省、2026-03-31) | AI エージェントとフィジカル AI の定義・リスク・対策を追記。法的拘束力のないソフトロー | https://www.soumu.go.jp/main_content/001059316.pdf (改訂元 PDF の候補。版の確認は要確認) |
| IPA AISI「AIセーフティに関する評価観点ガイド」 第1.20版 (2026-07) | AI エージェントシステムを踏まえ、評価観点と項目例を拡充 | https://aisi.go.jp/output/output_framework/guide_to_evaluation_perspective_on_ai_safety/ |
| IPA AI セキュリティ短信 (2026年3月号) | Security for AI の動向とインシデント事例 | https://scan.netsecurity.ne.jp/article/2026/04/07/54993.html |
| OWASP Top 10 for LLM Applications 2025 | LLM01 プロンプトインジェクション、02 機微情報の開示、03 サプライチェーン、04 データ / モデル汚染、05 不適切な出力処理、06 過剰な権限 (Excessive Agency)、07 システムプロンプト漏えい、08 ベクトル / 埋め込み、09 誤情報、10 無制限消費 | https://genai.owasp.org/2024/11/17/owasp-reveals-updated-2025-top-10-risks-for-llms-announces-new-llm-project-sponsorship-program-and-inaugural-sponsors/ |
| OWASP Top 10 for Agentic Applications 2026 (2025-12-09 公表) | 確認できたのは ASI01 エージェント目標ハイジャック、ASI02 ツールの誤用、ASI03 ID と権限の悪用、ASI09 人間とエージェントの信頼の悪用、ASI10 暴走エージェント。ASI04〜08 は二次情報でも確認できず「要確認」。公式ページで確認すること | https://genai.owasp.org/ |
| NIST SP 800-218 (SSDF) と SP 800-218A (生成 AI 向け community profile、2024-07-26 最終) | 800-218A は AI モデル開発向けの追加プラクティス。SP 800-218 Rev.1 (SSDF 1.2) は 2025-12-17 に初版ドラフト、最終版は確認できず | https://csrc.nist.gov/projects/SSDF |
| CISA 等の多機関ガイダンス「エージェント型 AI システムの保護」(2026-05) | 国内文書ではない。内容は未精読 | https://www.mayerbrown.com/ja/insights/publications/2026/06/multi-agency-guidance-on-securing-agentic-ai-systems |

注: 800-218A は「AI モデルを作る側」向けで、本ハーネスは「AI エージェントを使う側」。そのまま適用はできない。SSDF 本体の「PW (ソフトウェア作成)」「RV (脆弱性対応)」を主に参照するのがよい。

## 4. (c) AI コーディングエージェント固有の攻撃面

信頼度の注記: 以下は二次情報が中心。CVE 番号は NVD での確認が必要。

| 攻撃面 | 実例と根拠 | ハーネスへの関係 |
|---|---|---|
| Issue / PR / ドキュメント経由のプロンプト注入 | 2026-04 に Johns Hopkins が Claude Code の security-review action、Gemini CLI、Copilot の coding agent が Issue 本文・PR タイトル・隠し HTML コメントを命令として処理することを示した。2026-08-05 の Black Hat USA 2026 で Novee Security が、権限のないアカウントの Issue から CI の秘密情報に到達できると報告 (CVE-2026-54316 と言及。要 NVD 確認)。Microsoft は Claude Code Action で /proc/self/environ から API キーを読めた問題を報告し、2.1.128 で緩和されたとされる。出典: https://labs.cloudsecurityalliance.org/research/csa-research-note-ai-coding-agent-ci-prompt-injection-202608/ (CSA ノートは AI 支援生成で未レビューと明記) | 本ハーネスは Issue / PR / review コメントを入力にする (FR-004, FR-036, FR-038)。信頼境界の定義が必要 |
| 悪意ある MCP サーバーとツール汚染 | Invariant Labs が tool poisoning を定義。2025 の CVE-2025-6514 (mcp-remote)、CVE-2025-49596 (MCP Inspector)、CVE-2025-54136 (Cursor)。Context7 MCP の CVE-2026-75130 は報告ありだが、CVSS 値は未確認 | MCP / tool の許可リストと pin が無い |
| agent による秘密情報の持ち出し | 上記 Issue 経由の事例 (環境変数、/proc、1 文字ずつの covert channel)。npm ワーム Shai-Hulud 系は Claude Code や MCP の設定ファイルも狙った (2026-04 の @bitwarden/cli 侵害の報告) | 開発者 PC の認証情報と agent の到達範囲を分離する必要がある |
| 依存の混乱と typosquatting (agent による導入) | Shai-Hulud は 2025-09 に初報、2025-11 に 2.0、2026-04 に Third Coming と mini 版、2026-05-12 にソースが公開され派生 600 超のパッケージ (CSA 集計。二次情報)。JPCERT/CC の注意喚起は未確認。agent が `npm install` を自動実行すると preinstall スクリプトが走る | FR-074 の登録簿が直接効く。ただし install スクリプト実行の制御は未記載 |
| hook / 設定の汚染 | リポジトリ内の `.claude/settings.json`、hooks、`.mcp.json`、skills は clone しただけでコード実行や権限拡大の入口になりうる。本ハーネス自身も hook を consumer repo へ配る | 設定の完全性 (署名・digest 検証) が無い |

国内で agent 起因と確認できた漏えい事案は、今回の調査範囲では見つからなかった。

## 5. (d) ハーネスへ取り込む観点と FR マッピング

凡例: 「あり」=既存 FR が実質的に覆う。「部分」=一部のみ。「ギャップ」=対応 FR なし。

| # | 観点 | 現状の FR | 判定 | 具体的な提案 |
|---|---|---|---|---|
| 1 | プロンプト注入 (Issue / PR / docs / ツール出力) | FR-001 (承認は AI 解釈から作らない)、FR-038 (本文は意味正本にしない) が間接的に防ぐ | 部分 | 新 FR-A「信頼境界」。外部由来テキスト (Issue、PR、コメント、依存の README、MCP 出力) を untrusted と型付けする。untrusted を入力に持つ lane は、書き込み・秘密情報・ネットワークの権限を持たない。判断は FR-041 の judgement record に残す |
| 2 | agent の最小権限と秘密情報の保護 | FR-002 (RACI)、FR-049 (role の許可 tool 種別) が土台 | 部分 | 新 FR-B「agent 実行環境」。role record の「許可 tool 種別」に、ファイル読取範囲・環境変数の継承・外向き通信先を加える。`.env`、`~/.ssh`、`/proc` 等の読取を既定 deny。CI の agent には長期の秘密情報を渡さず、短命トークンのみ |
| 3 | MCP サーバーと tool の統制 | なし | ギャップ | 新 FR-C。MCP サーバー / tool を FR-074 の登録簿に載せ、版を pin する。tool description の digest を記録し、変化したら承認を取り直す (rug pull 対策) |
| 4 | hook / 設定 / skill の完全性 | FR-049 (generated view の drift は fail-close)、FR-025 (surface class) | 部分 | 新 FR-D。consumer repo に入れる hook・設定・skill は、release asset の manifest digest と照合する。差異は doctor が fail-close。clone 直後の自動実行を許さない (信頼確認後に有効化) |
| 5 | 依存の混乱 / typosquatting / ワーム | FR-074 (登録簿、lint fail-close、脆弱性審査、定期再検査) | あり (部分的) | FR-074 を補強: (1) agent による依存追加は登録簿 PR を経由する (2) install スクリプトを既定で無効化 (3) lockfile と provenance の検証 (4) 公開直後の版を一定期間避ける (cooldown) |
| 6 | 秘密情報スキャン (secret scanning) | FR-038 は intake の遮断のみ | ギャップ | 新 FR-E の一部。commit 前 (hook)・PR (CI)・ログ / receipt / Evidence Ledger への書込み前の 3 点で検査。検出時は block し、ローテーション手順を incident へ |
| 7 | SAST / DAST / SCA | FR-074 (SCA の一部)、FR-064 (影響テスト選定) | ギャップ | 新 FR-E「脆弱性診断 gate」。SAST と SCA を CI の必須 oracle とする。consumer product 向けには DAST を L10 (システムテスト) の AT として宣言できるようにする (FR-065 の AT 宣言に「セキュリティ」種別を足す) |
| 8 | 脆弱性管理と公開面の棚卸し (今回の事案の最頻原因) | FR-074 の「定期検査」のみ | ギャップ | 新 FR-F。資産台帳 (公開面、VPN / 外部接続、BI などの内部ツール、委託先アカウント) と、重大な脆弱性の対応期限 (SLA) を持つ。consumer product の L13 (デプロイ後検証) で公開面を検証する |
| 9 | release asset の署名と来歴 | FR-071 (installed release が規律を判定)、FR-070 | ギャップ | 新 FR-G。compiled Node bundle に SBOM、署名、ビルド来歴 (SLSA 相当) を付け、install 時に検証する。配布の信頼根は設計判断として freeze (方式の trade-off があるため advisor 相談の対象) |
| 10 | SOC 相当: ログと検知 | FR-012 (進捗の自動導出)、FR-041 (judgement record)、FR-072 (作業ログ)。hook event は FR-038 に出てくる | 部分 | 新 FR-H の一部。security event (guard 拒否、foreign-edit override、権限外の tool 呼出、秘密情報検出、untrusted 入力で権限操作を試みた記録) を型付きで記録し、改ざん検知可能にする。検知ルールと alert の triage 区分 (重大度と owner) を持つ。1 人開発でも省略しない (FR-033 と同じ考え方) |
| 11 | インシデント対応 runbook | FR-037 (stop-the-line incident record)、FR-031 (差し戻し) | 部分 | FR-037 を拡張: セキュリティ incident の型を足す。内容は、封じ込め (トークン失効、hook 無効化、release の取下げ)、影響範囲 (FR-064 の依存 graph)、通知判断 (個人情報なら個情委への報告と本人通知の期限を確認)、事後の backflow (FR-048)。runbook は文書正本、訓練記録は receipt |
| 12 | white-hat / red team (agent パイプラインへの敵対的テスト) | FR-051 (反証試行の記録)、FR-024 (mutation 検証) | ギャップ | 新 FR-H の一部。敵対的テストの corpus (注入入りの Issue、汚染 MCP、偽の receipt、改ざん hook) を repo に持ち、リリースごとに CI で実行して guard が止めることを oracle にする。外部の脆弱性報告窓口 (SECURITY.md) と、四半期ごとの red team 演習。結果は judgement record と同じ形式で残す |
| 13 | 委託先・外部サービスの管理 | FR-074 (ライセンス・保守) | 部分 | 外部 SaaS・AI provider・MCP を「委託先」として登録し、データ送信範囲 (PII・秘密情報を送らない) を FR-038 の遮断規則と対にする |
| 14 | AI の利用ポリシー (10大脅威 3位、AI事業者ガイドライン) | FR-023 / FR-024 (provider topology) | 部分 | 送信してよいデータの分類を定め、provider ごとに許可を持つ。AI事業者ガイドライン 1.2 の「エージェント」節との対応表を設計文書に置く |

## 6. 優先順位 (推奨)

1. 高: #1 信頼境界、#2 最小権限、#6 秘密情報スキャン、#4 設定の完全性。理由: agent を使う以上、直接の攻撃面になる。実装も小さい。
2. 高: #5 依存の補強、#9 release asset の署名。理由: 既に Shai-Hulud 系が Claude Code / MCP 設定を狙っている。配布物が compiled bundle なので影響が大きい。
3. 中: #7 SAST / SCA の gate、#10 セキュリティ event の記録、#11 incident runbook。
4. 中: #3 MCP 統制 (MCP を使い始めた時点で高に上げる)、#8 脆弱性管理 (consumer product 側の話であり、ハーネス本体の優先度は一段下)。
5. 低 (後続): #12 red team 演習の定期化 (corpus の整備は #1 と同時に始める)。

## 7. 注意と要確認

- 「最小実装を優先する」原則に従い、新 FR を 8 本そのまま積まない。FR-A と FR-B は 1 本に、FR-E と FR-H は第一段を「検知して止める」だけにする案が妥当。
- 方式選択に trade-off がある項目 (署名方式、sandbox の実現手段、Windows での通信制御) は advisor 相談の対象。
- 認証・認可、秘密情報、外部 API 前提に触れる変更は高影響境界。着手前に PO 承認が要る。
- 要確認の一覧:
  - OWASP Agentic の ASI04〜08 の名称。
  - CVE-2026-75130 と CVE-2026-54316 の NVD 記録と CVSS。
  - SP 800-218 Rev.1 の最終化の有無。
  - 経産省ガイドラインの AI 関連の追記の有無。
  - 9 月以降の JPCERT/CC・NISC・個情委の公式注意喚起。
  - 二次集計の各件の一次情報 (Helpfeel とデジタル庁のみ確認済み)。
- 詳細精読が要る対象は `pmo-tech-docs` へ: OWASP Agentic 公式の全項目、AI事業者ガイドライン 1.2 のエージェント節、CISA 等の多機関ガイダンス。採用可否の評価が要る対象 (SAST / secret scanner のツール選定) は `pmo-tech-fork` へ。

## 8. 公式リンク (日付付き)

- 2026-01-29 IPA 10大脅威 2026: https://www.ipa.go.jp/security/10threats/10threats2026.html
- 2026-03-31 AI事業者ガイドライン 第1.2版 (総務省・経産省): 上記 PDF (版は要確認)
- 2026-04-28 IPA 経営ガイドライン プラクティス集第4版: IPA 公表 (URL 未確認)
- 2026-07 IPA AISI 評価観点ガイド 第1.20版: https://aisi.go.jp/output/output_framework/guide_to_evaluation_perspective_on_ai_safety/
- 2026-09-11 デジタル庁 GSS: https://www.digital.go.jp/news/2026-0911-01
- 2026-09-16 Helpfeel (Gyazo): https://corp.helpfeel.com/news/news-20260916-1
- 2025-12-09 OWASP Agentic Top 10 / 2024-11-18 OWASP LLM Top 10 2025: https://genai.owasp.org/
- 2024-07-26 NIST SP 800-218A / 2025-12-17 SP 800-218 Rev.1 ipd: https://csrc.nist.gov/projects/SSDF
