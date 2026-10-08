# ニュース調査: 情報漏えい・障害 (2026-08 〜 2026-10-08) と v4 要件への対応

調査日: 2026-10-08。手段は web search のみ。記事本文を全件は読めていない。多くは検索要約ベース。
信頼度の凡例: [複数報道] = 2 媒体以上が一致。[単独報道] = 1 媒体のみ。[要確認] = 日付や内容に疑義。
注意: 検索結果には集約サイト・ベンダーブログが多い。障害の「原因」は公式 PIR が未公開のものが多い。

---

## (a) 情報漏えい・不正アクセス

### 日本国内

| 日付 | 会社 | 漏えい内容・規模 | 攻撃経路 | 原因 (報道) | 信頼度 |
|---|---|---|---|---|---|
| 10/2 侵入、10/5 公表 | GMO リサーチ&AI (GMO インターネットグループ) の「infoQ」 | 最大 94 万 8,498 件。氏名・住所・電話・メール・生年月日・暗号化パスワード・会員ID・保有ポイント。ポイント不正交換 611 件 (約 287 万円) | 脆弱性悪用 (ソフト名は不明) | infoQ が使うソフトの脆弱性 | [複数報道] NHK・共同通信・デイリー・ライブドア。件数表記は 94 万 / 95 万で揺れ。原因の記述は rocket-boys のみ [単独報道] |
| 9/11 検知 (9/16 公表) | Helpfeel「Gyazo」 | ユーザー情報 約 2,362 万件、画像メタデータ 約 4.9 億件。削除済み画像メタデータ 約 1.74 億件も。決済情報は無し | 脆弱性 (画像アップロードサーバ、任意コマンド実行) | サーバの脆弱性 | [複数報道] ITmedia・ScanNetSecurity・Impress・BleepingComputer。9 日間サービス停止、9/27 再開 |
| 6/25 検知、9/11 公表 | デジタル庁 GSS (ガバメントソリューションサービス) | 約 24.6 万件 (政府職員約 18.9 万、民間約 5.7 万)。マイナンバー等は無し | VPN 脆弱性 + 保守運用担当者アカウント | VPN の脆弱性。製品名・CVE は非公表 | [複数報道] ScanNetSecurity・@IT・Impress・nippon.com。検知から公表まで約 2.5 か月 |
| 8/9 検知、8/18〜9/10 に三報 | さくらインターネット | 最大 136 万 563 アカウント (販売管理システム)。レンタルサーバ 951 アカウントで不正ログイン、マルウェア設置。ハッシュ化パスワード含む | 管理環境経由。侵入経路は確定せず | 初期パスワードが販管システムに平文保存。ログ管理が不十分。侵入は 2023-04〜2026-03 の約 3 年 | [複数報道] @IT・ScanNetSecurity・Impress・rocket-boys。第三報で経路は「客観的に確定できず」 |
| 8/4 速報、8/7 確定 | イノベーション | 62,691 名分 (氏名・メール・電話) | 認証情報漏えい → GitHub 不正アクセス | 認証情報のハードコーディング + 個人情報をリポジトリに保存 (独立した 2 つの問題) | [複数報道] ScanNetSecurity・rocket-boys |
| 5/1 公表 (詳細調査 6/23 完了) | マネーフォワード | 従業員 2,300 名、顧客識別子 60,449 名分 | GitHub 認証情報 (トークン) 漏えい → リポジトリ複製 | トークン漏えいの根本経路は未特定 | [複数報道] Impress・ScanNetSecurity。8 月以前だが GitHub 系の類似例として採録。銀行連携を一時停止 |
| 9/26 | 京王 (Keio) | ホテル・決済系システム停止。ランサムウェア | ランサムウェア | 報道では詳細不明 | [複数報道] SC World、CM Alliance 月報。電車運行は影響なし |
| 8/21 | 楽天ブックスネットワーク | 33,333 件 (PC 端末への不正アクセス) | 端末侵入 | 不明 | [単独報道] ScanNetSecurity 一覧のみ |
| 8/3 | 講談社 | 個人情報流出 | 不正アクセス | 不明 | [単独報道] 一覧のみ |
| 9 月 | スマレジ / モンベル / 東大医学系研究科 / 扶桑電通 | 扶桑電通は 26,489 件の可能性 | 不正アクセス | 不明 | [単独報道] ScanNetSecurity 9 月一覧のみ |
| 8 月 | シーイーシー | データセンターへのランサムでシステム障害 | ランサムウェア | 不明 | [単独報道] 一覧のみ |

GMO グループについて: infoQ の件が今回の確認事項。GMO の別会社 (GMO ペパボ等) の 8〜9 月の事案は、検索では見つからなかった。

### 海外

| 日付 | 会社 | 内容 | 経路 | 信頼度 |
|---|---|---|---|---|
| 8/4〜 | ChainDrop (Shai-Hulud 亜種。keyv / cacheable の npm) | 数百パッケージ汚染。npm/GitHub トークン、クラウド鍵、K8s 秘密を窃取。さらに汚染を拡散 | メンテナの GitHub アカウント乗っ取り → 既存の GitHub Actions リリース WF を起動 → 正規の provenance 付きで公開。Linux runner のプロセスメモリから org secret も読む | [複数] Checkmarx, op-c.net。BleepingComputer 直接記事は未確認 |
| 8/30 公表 | CareCloud (医療 SaaS) | 約 375 万人。SSN・診療記録 | 3/10〜16 に AWS 環境へ侵入。公表まで約 5 か月 | [単独報道] ThreatCluster 要約。原典未確認 |
| 8 月 | Framework | 全顧客の氏名・メール・電話・住所 | 第三者 (BI ベンダー) の事故 = サプライチェーン | [単独報道] Privacy Guides 経由で TechCrunch を引用 |
| 6/〜 | Oracle PeopleSoft (CVE-2026-35273) | ShinyHunters が 5/27〜6/9 に RCE で多数組織のデータ窃取 | 未認証 RCE の 0-day | [単独報道] The Hacker News 系の要約 |
| 6/〜 | Oracle E-Business Suite (CVE-2026-46817) | Oracle Payments の未認証 RCE。約 900〜950 台がネット露出。悪用はハニーポットで観測 | 脆弱性。パッチは 2026 年 5 月 CPU | [複数] BleepingComputer・Computing 等。被害者の特定は無し |
| 2025 (参考) | Oracle EBS (CVE-2025-61882, Clop) | Washington Post 約 1 万人、Informa 約 6,000 人など | 脆弱性 → 恐喝 | [複数] Bloomberg・Teiss。8/9 に悪用開始、9/29 に恐喝メール = 検知遅れの例 |
| 2025 (参考) | Oracle Cloud (OCI) 認証情報流出 | 数千テナントの認証情報とされる | 不明 | Oracle は否認。DeXpose など二次情報のみ [要確認]。2026 年の新事案ではない |
| 9/1, 9/5 | Nutex Health、ベルリン州政府 | ランサム | ランサムウェア | [単独報道] CM Alliance 月報 |
| 9/15 | VMware vCenter の脆弱性 | ランサム勢が悪用 | 脆弱性 | [単独報道] BleepingComputer を月報が引用 |

Oracle について: 2026 年の「Oracle 自身の新規侵害」を示す一次・主要報道は見つからなかった。確認できたのは製品 (EBS / PeopleSoft) の脆弱性悪用。日本オラクル関連の国内事案も見つからなかった。

見つからなかったもの (捏造しない): NHK / 日経 / Reuters / The Record / The Register の 2026-09 以降の個別大型漏えい記事は、検索では特定できなかった。

---

## (b) 障害・サービス停止

| 日付 | 対象 | 影響 | 継続 | 原因 | 信頼度 |
|---|---|---|---|---|---|
| 8/6 | GitHub Actions / Pages | Actions 失敗、Webhook 遅延、Copilot にも波及。push / PR イベントの一部は自動再生不可 | 約 9〜10 時間 | 公式: 制約された本番クラスタ (キャッシュ CPU 98%)。8 月可用性レポートで負荷の 33% を別容量へ移した。「スケジューラの不正なジョブ割当」は二次情報 [要確認] | [複数] GitHub blog・IncidentHub・byteiota |
| 8/17 | GitHub 全体 (Web/API/Actions/Copilot/PR/Git) | エラー率最大 約 20% (アーカイブ DL は約 50%) | 7 時間 47 分 | 公式: ピーク時に Central US の基盤コンポーネントがスケールせず。**コードや設定変更ではない**。Copilot はクライアント側の再試行ループで復旧が遅れた | [複数] GitHub blog・BleepingComputer・CyberInsider |
| 9/13 | GitHub | DB レプリケーション遅延で認可エンドポイントのエラー増 | 不明 | DB 遅延 | [単独報道] |
| 9/24 | GitHub 課金 | 課金システム停止 | 3 時間 53 分 | 不明 | [単独報道] トラッカー |
| 9/28 | GitHub Copilot Code Review | レビュー完了せず | 53 分 | 直前の変更を revert して復旧 | [単独報道] トラッカー |
| 10/1 | GitHub Actions | 3 件の障害 | 最長 9 時間 34 分 | 不明 | [単独報道] 範囲外だが参考 |
| 8/16 | Anthropic Claude | 認証失敗から開始。claude.ai / API / Code | 数時間 (22:40 UTC に全復旧) | 非公表 | [複数] BleepingComputer 他 |
| 8/18〜20, 8/24 | Anthropic Claude | 複数モデルで高エラー。8/24 は約 3 時間 (8:30 UTC 復旧) | 約 3 時間 | 「原因を特定し修正中」のみ。技術詳細なし | [複数] BleepingComputer・Android Authority |
| 9/3 | Anthropic / OpenAI / xAI / Gemini 同時 | OpenAI は 19 コンポーネント、Downdetector 7.4 万件。Anthropic 約 2h50m、OpenAI 約 2h12〜4h | 2〜4 時間 | OpenAI は「ルーティングエラー」、xAI は計算センター。Anthropic は非特定。**同時多発の原因は不明** | [複数] secnews.gr・cryptobriefing 他。事業者本文は未確認。9/3 と 9/4 で日付揺れ [要確認] |
| 9/22 | Anthropic Claude / Claude Code | 1,600+ 報告 | 約 1h40m (00:57-02:35 UTC) | 非公表 | [単独報道] |
| 9/25 | OpenAI Codex | | 56 分 | 内部障害とのみ | [単独報道] |
| 9/29 | Anthropic (claude.ai, Code, Cowork, API) | SSO・Apple サインインも失敗。一部メッセージ未保存 | 約 1 時間 (14:21 UTC〜) | 非公表。部分緩和後に二次障害 | [複数] IsDown・aiweekly・windowsreport |
| 9/29 | OpenAI ChatGPT / Codex / API | エラー増 | 5h31m | 非公表。2 件は同根の疑い (二次情報の推測) | [単独報道] |
| 9/29, 9/30 | Cloudflare | Access のワンタイムPINメール不達 41 分。9/30 は 4 件 (最長 43 時間のネットワーク事象) | 〜43h | 不明 | [単独報道] トラッカー。9/15 の全球障害は裏付け無し [要確認] |
| 7/23 | Azure West US | ネットワーク | 約 5 時間 | 保守リクエスト変換ソフトのバグで、想定より多い機器から IP ルートを削除。**blast radius ツールの欠陥**。自動ロールバックが障害を受けた接続に依存 | [複数] w.media・IncidentHub (予備 PIR)。範囲は 7 月で外れるが教訓が強いので採録 |
| 8/24 | Google Cloud us-west1 | | 不明 | 予備レポートに原因なし | [単独報道] 要確認 |
| 5/7 | AWS us-east-1 | 1 AZ の熱障害 (冷却)。Coinbase 等に波及 | 19〜28 時間 | 冷却失敗 | [複数] 範囲外、参考 |
| 9/4, 9/11-12 | 大阪市 住基ネット端末 | 窓口業務停止 | 40 分 / 約 3 時間 | 9/12 は保守業者の DB 設定変更で復旧。原因は未明記 | [単独報道] 市の発表 |

要点: 証明書失効・DNS が原因と断定できる 8〜9 月の事案は、検索では見つからなかった。

---

## (c) パターンと v4 要件への対応

v4 要件ファイル: `C:\dev\ut-v4-requirements-20261007\docs\governance\candidates\ut-tdd-concept-v4-requirements.md`
FR は全 76 件を要約レベルで確認した。NFR の id (UTV4-NFR) は存在しない。

| # | パターン | 根拠となる事案 | 該当 FR | 判定 |
|---|---|---|---|---|
| P1 | 単一の Git ホスト (GitHub) 依存。数時間停止が月 2〜3 回 | 8/6, 8/17, 9/24, 9/28, 10/1 | FR-004 (チケット = Issue/Sub-issue/PR)、FR-036 (3 段が GitHub 上)、FR-013 (exact-head review) が GitHub 前提。FR-006 は正本をファイルにして DB を再生成可能とした | **GAP**。GitHub 停止時の縮退・キュー・復帰時の再同期を定める FR が無い。FR-006 の「正本はファイル」は土台になる |
| P2 | 単一の AI provider 依存。同時多発停止もある (9/3) | 9/3, 9/22, 9/29, 8/16, 8/24 | FR-023 (provider topology profile)、FR-024 (single-provider の補償統制と、利用上限での格下げ record)、FR-049/050 (論理 role と provider 非依存) | **部分カバー**。profile の格下げは「利用上限・契約停止」だけを想定。**障害 (outage) による一時縮退・フェイルオーバーの扱いが無い**。9/3 は全 provider 同時なので、hybrid でも切替が効かない前提が必要 |
| P3 | 認証情報のハードコード・リポジトリ内秘密、トークン漏えい | イノベーション、マネーフォワード、ChainDrop、さくら (初期パスワード平文) | FR-074 (依存の登録簿と脆弱性審査)。FR-038 (改善 intake) は事後学習 | **GAP**。secret scan・rotation・失効手順・秘密の置き場の FR が無い。CLAUDE.md の Safety Boundaries にはあるが要件化されていない |
| P4 | サプライチェーン / CI 経由の窃取。provenance が付いても安全でない | ChainDrop, TanStack(5月), Red Hat(6月) | FR-074 (登録簿に無い依存は fail-close。定期再検査) | **部分カバー**。リリース/公開ワークフローの権限最小化、OIDC publish の保護、runner メモリからの窃取への対策は無い。**GAP** |
| P5 | 設定変更・保守作業の blast radius。自動ロールバックが障害と同じ経路に依存 | Azure 7/23、大阪市 9/12、GitHub 9/28 (revert で復旧) | FR-037 (依存 graph で影響範囲判定、2 区分以上は stop-the-line)、FR-064 (差分から影響テスト選択) | **部分カバー**。コード変更の影響は扱うが、**配布 (release / upgrade) の段階展開・影響上限・ロールバック**は無い。#814 safe upgrade に対応する FR が見当たらない。**GAP** |
| P6 | 検知の遅れ。侵入から公表まで数か月〜数年 | さくら (3 年)、GSS (検知 6/25 → 公表 9/11)、CareCloud (約 5 か月)、EBS (悪用 8/9 → 恐喝 9/29) | FR-012 (進捗は事実から自動導出)、FR-038 (incident を intake に入れる)、FR-042 (incident を判断 record へ後付け注釈) | **GAP**。harness 自体のログ・監査証跡の異常検知、保持期間、ログ管理の要件が無い。FR-006 は証跡の保管形式のみ |
| P7 | 脆弱性の悪用が即日〜数日 (VPN, Gyazo, infoQ, EBS) | GSS, Gyazo, infoQ, CVE-2026-46817 | FR-074 | **部分カバー**。FR-074 は「依存の脆弱性」を登録時と定期で見る。**緊急パッチ SLA・KEV 連動・露出面の棚卸し**は無い。harness の配布物にも適用すべき |
| P8 | 管理者・保守アカウントの乗っ取り | GSS (保守運用者アカウント)、さくら (管理環境経由) | FR-075 (メンバーと権限 registry)、FR-001/002 (承認の束縛、RACI) | **部分カバー**。短命資格・MFA・特権操作の監査の要件は無い |
| P9 | クライアント再試行の暴走が復旧を遅らせる | GitHub 8/17 (Copilot 再試行ループ) | FR-072 (token・費用・時間を記録) | **GAP**。harness が provider/GitHub を叩く際の backoff・circuit breaker・上限の要件が無い。並列 8 は CLAUDE.md の運用規律のみ |
| P10 | 障害・事故の runbook と事後学習 | 全般 | FR-010 (記録 → パターン抽出 → 振り分け)、FR-038、FR-040 (incident から skill 化) | **部分カバー**。学習側はある。**対応手順 (runbook) と、障害時の運用モード切替の定義が無い** |
| P11 | 復旧後の整合性。イベントが失われ再生できない | GitHub 8/6 (push/PR イベントを再生不可)、Anthropic 9/29 (メッセージ未保存) | FR-006 (正本ファイル、DB は再構築可)、FR-027 (receipt の保管と訂正世代) | **部分カバー**。「外部イベントが欠落した場合に、HEAD とチケットを突合して再同期する」要件は無い (FR-012 の事実導出が近い) |

---

## 推奨 (要件追加の案)

優先度は高・中・低。いずれも「最小実装原則」に合わせ、既存の FR を拡張する形を先に検討する。

1. 【高】縮退運転 (degraded mode) を FR-023 の拡張として追加する。
   - provider 障害 (outage) と上限停止を同じ「縮退 record」で扱う。profile を恒久格下げせず、期限付きで一時縮退する。
   - 縮退中は高影響境界の merge を止める。FR-024 の補償統制 (人間 review) を自動で有効にする。
   - 9/3 のような全 provider 同時停止では、作業を止めてキューに積む。独立 review を偽装しない。

2. 【高】GitHub 停止時の動作を新規 FR にする (P1, P11)。
   - 正本はローカルのファイル (FR-006) とし、チケット・receipt をローカルに積む。
   - 復帰後に push と突合して再同期する。イベント欠落は HEAD と CI を再実行して検証する。
   - 停止中の merge は禁止にする (exact-head receipt は CI green 前提のため)。

3. 【高】秘密情報の統制を新規 FR にする (P3, P4)。
   - リポジトリ・ログ・receipt・memory への秘密の混入を gate で fail-close にする (secret scan)。
   - 漏えい疑い時の rotation 手順と、失効の証跡 record を持つ。
   - release / publish の権限を最小化し、トークンの寿命を短くする。

4. 【高】配布 (release / upgrade) の blast radius 制限とロールバックを新規 FR にする (P5)。#814 safe upgrade の要件化にあたる。
   - 段階展開 (canary → 全体)、1 回の変更の影響上限、自動停止条件を持つ。
   - ロールバック経路は、更新対象の経路から独立させる (Azure 7/23 の教訓: 自動ロールバックが障害と同じ接続に依存した)。
   - ロールバック手順の演習を AT として持つ (FR-065 の AT 宣言に載せる)。

5. 【中】harness 自身の検知・ログ要件を追加する (P6)。
   - `.ut-tdd/` の監査ログの保持期間・改ざん検知・異常通知を定める。
   - 「検知から公表まで」の目標時間を incident record に持つ (FR-038 の拡張)。

6. 【中】外部 API 呼び出しの backoff・circuit breaker・並列上限を要件化する (P9)。
   - 並列 8 の上限 (現状は advisory) を、provider 障害時に自動で下げる。

7. 【中】incident runbook を設ける (P10)。
   - 障害種別ごとに: 検知 → 縮退 → 連絡 → 復旧 → 事後 record。最初の対象は「GitHub 停止」「provider 停止」「秘密漏えい疑い」「配布物の不良」。
   - 事後は FR-010 / FR-040 に乗せて、skill・判断パックへ昇格させる。

8. 【中】FR-074 に緊急パッチ SLA と、悪用確認済み脆弱性 (KEV 等) の即時扱いを追加する (P7)。

9. 【低】特権・保守アカウントの要件 (短命資格、MFA、特権操作の監査) を FR-075 に足す (P8)。

---

## 要確認

- infoQ の脆弱性の具体名。原因記述は rocket-boys のみ。GMO リサーチ&AI の公式発表で確認が必要。
- GitHub 8/6 の根本原因。GitHub の 8 月可用性レポート本文を精読する必要あり (pmo-tech-docs 向け)。
- 9/3 の AI 同時障害の原因と日付 (9/3 か 9/4)。事業者の PIR が未確認。
- Cloudflare 9/15 全球障害は裏付けなし。Cloudflare 9/30 の「43 時間」はトラッカー値で、鵜呑みにしない。
- Oracle: 2026 年の Oracle Cloud 新規侵害は未確認。2025 年の OCI 認証情報流出は二次情報のみ。
- 検索で出た「cybersecuritynews.com の日付つき」ページは、クロール日が見出しになっている疑い。Oracle 関連の日付には使っていない。
- 日経・NHK・Reuters・The Record・The Register の直接記事は、今回の検索では十分に取得できなかった。BleepingComputer・NHK(GMO)・ITmedia・Impress・ScanNetSecurity は一部確認できた。

## エスカレーション

- pmo-tech-docs: GitHub 8 月可用性レポートと 8/17 ポストモーテム (https://github.blog/news-insights/company-news/the-august-17-outage-and-the-work-ahead/) の精読。復旧設計 (再試行ループ) の参考になる。
- pmo-tech-docs: ChainDrop の一次情報 (Checkmarx 記事) の精読。release workflow の防御策の根拠になる。
- 要件追加は設計判断 (trade-off あり) なので、着手前に advisor (progress / design) で合意形成する。

## 主な参照 URL

- GMO infoQ: https://news.web.nhk/newsweb/na/nd-20261006de55007 / https://news.yahoo.co.jp/articles/839c2eae6ad5427fc0977e0d2ee64d0b3c99f034 / https://rocket-boys.co.jp/?p=42554
- Gyazo: https://www.itmedia.co.jp/news/article/2609/16/2000001560/ / https://www.bleepingcomputer.com/news/security/gyazo-server-flaw-exploited-to-steal-236-million-user-records/amp/ / https://scan.netsecurity.ne.jp/article/2026/09/28/56313.html
- デジタル庁 GSS: https://www.digital.go.jp/news/2026-0911-01 / https://scan.netsecurity.ne.jp/article/2026/09/14/56223.html / https://atmarkit.itmedia.co.jp/ait/articles/2609/14/news038.html
- さくら: https://atmarkit.itmedia.co.jp/ait/articles/2609/11/news039.html / https://scan.netsecurity.ne.jp/article/2026/08/20/55974.html / https://scan.netsecurity.ne.jp/article/2026/09/17/56259.html
- イノベーション: https://scan.netsecurity.ne.jp/article/2026/08/20/55975.html / https://rocket-boys.co.jp/?p=38276
- マネーフォワード: https://scan.netsecurity.ne.jp/article/2026/07/07/55647.html
- Oracle EBS CVE-2026-46817: https://www.bleepingcomputer.com/news/security/over-900-oracle-e-business-instances-exposed-to-ongoing-attacks/amp/ / https://www.bleepingcomputer.com/news/security/new-oracle-e-business-suite-flaw-now-exploited-in-attacks/amp/
- ChainDrop: https://checkmarx.com/zero-post/shai-hulud-npm-supply-chain-attack-keyv-cacheable.md / https://op-c.net/blog/chaindrop-npm-supply-chain-attack/
- Keio: https://www.scworld.com/brief/japanese-railway-operator-keio-hit-by-ransomware-attack
- 月報: https://www.cm-alliance.com/cybersecurity-blog/major-cyber-attacks-data-breaches-ransomware-attacks-september-2026 / https://www.privacyguides.org/news/2026/08/14/data-breach-roundup-august-7-13-2026/
- ScanNetSecurity 月次一覧: https://scan.netsecurity.ne.jp/article/2026/08/
- GitHub 8/17: https://github.blog/news-insights/company-news/the-august-17-outage-and-the-work-ahead/ / https://www.bleepingcomputer.com/news/microsoft/microsoft-confirms-github-is-down-worldwide/amp/
- GitHub 8/6: https://github.blog/news-insights/company-news/github-availability-report-august-2026/ / https://github.blog/news-insights/company-news/github-availability-report-july-2026/
- Anthropic: https://www.bleepingcomputer.com/news/artificial-intelligence/anthropic-confirms-claude-is-down-in-major-outage-affecting-multiple-services/amp/ / https://isdown.app/status/anthropic/incidents/662308-elevated-errors-on-claude-ai-claude-code-and-claude-cowork
- AI 同時障害 9/3: https://www.secnews.gr/en/730408/chatgpt-claude-grok-outage-september-3-2026/ / https://cryptobriefing.com/openai-anthropic-google-ai-service-outages/
- Azure 7/23: https://w.media/microsoft-azure-outage-cloud-services-disrupted-after-west-us-network-failure-now-resolved/ / https://blog.incidenthub.cloud/azure-west-us-outage-jul-23-2026
