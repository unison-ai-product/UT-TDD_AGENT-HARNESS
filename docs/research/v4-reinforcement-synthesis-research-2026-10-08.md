# v4 補強の統合報告 (先行研究・OSS 参考・古典手法・セキュリティ・障害)

> 2026-10-08 に repo へ移したときの注記: research-1〜4b は同じ docs/research/ の v4-prior / v4-oss-reference / v4-classic-methods / v4-security-landscape / v4-leaks-outages-news (-research-2026-10-08.md) です。本書のセキュリティ節はハーネス自身を対象にしていました。PO の指摘で、製品のセキュリティ対策を軸にした v4-product-security-synthesis に置き換えています。

- 作成日: 2026-10-08。作成: pmo-sonnet (統合のみ。repo は変更していない)。
- 入力: research-1 (先行研究) / research-2 (OSS、参考のみ) / research-3 (古典手法) / research-4 (セキュリティ動向) / research-4b (漏えい・障害ニュース)。脅威モデル (research-5) は repo に置かない。ハーネス工程の不具合として issue に起票する。
- 照合先: PR #892 で review 中の v4 候補 (requirements: UTV4-FR-001〜076 / acceptance: UTV4-AC-001〜090 / decision ledger: V4D-001〜098)。
- 表記: 「r1 a-6」は research-1 の a-6 節を指す。「r3 §8」は research-3 の第 8 章を指す。
- 公開 repo 向けの配慮: 脅威モデルの個別所見 (場所・手順) は本書に書かない。「非公開の脅威モデル (件数: High 3 / Medium 5 / Low 2)」としてだけ参照する。
- OSS は依存にしない (V4D-096、UTV4-FR-074)。本書の OSS は着想とデータモデルの参照だけである。コードは写さない。

---

## §1 結論

1. v4 は「統制と証跡」に強い。弱いのは「証跡そのものの信頼」と「外部が落ちたときの動き方」である。
2. 設計を楽にする一番の手は、状態遷移表を 1 つ書き、契約・負例テスト・利用統計に使い回すことである (r3 §8)。
3. 別 family の review は「必要条件」であって「独立の保証」ではない。別モデルでも失敗は相関する (r1 e-2、r3 §10)。合否の主役は決定的な oracle に置く。
4. 非公開の脅威モデルでは、review の受領記録がローカルで書き換えられる経路が最重要だった。受領は改ざんできない経路で検証する要件が要る。
5. 2026 年 8〜10 月は GitHub と AI provider の数時間停止が月に複数回あった (r4b P1/P2)。v4 には縮退運転の要件が無い。
6. GMO リサーチ&AI (infoQ) など国内の漏えいの主因は、未パッチの脆弱性・委託先や保守アカウント・認証情報の漏えいだった (r4 §2.4、r4b)。Oracle は「製品の脆弱性悪用」までは確認できたが、「Oracle 自身の 2026 年の新規侵害」は確認できなかった (r4b)。
7. 不足課題は 8 件以上ある。ただし最小実装原則に従い、新 FR は 4 本に束ねる。残りは既存 FR の改訂で吸収する (§5)。
8. このうち 4 本の新 FR は、認証・秘密情報・本番配布・外部 API 前提のいずれかに触れる。追加の前に PO 承認が要る。

---

## §2 設計を楽にする提案 (ゼロから設計せず、借りる・再生する)

並びは「設計の手間を省ける量」の大きい順である。各項目は 4 点で書く: 出典 / 単純になる FR・AC / 設計文書に書くこと / 作らないもの。

### 2-1. 状態遷移表 1 つを、契約・負例テスト・利用統計に使い回す

- 出典: r3 §8 (g) モデルベーステスト。r3 §2 (a) Cleanroom の usage model。r3 §3 (b) Design by Contract。r3 は「v4 を単純にする最も大きな提案」としている。
- 単純になる FR / AC:
  - FR-005 / AC-008 (claim の二重取得は deny)。
  - FR-017 / AC-026、FR-058 / AC-071 (provisional → frozen は人間の record だけ)。
  - FR-025 / AC-035 (段階を跳ばした遷移は deny)。
  - FR-068 / AC-081 (右腕の順序を跳ばした遷移は deny)。
  - FR-013 / AC-022 (review の依頼 → 判定 → 受領)。
- 設計文書に書くこと:
  - 状態機械を 3〜4 個に絞って JSON の表で持つ。候補はチケット、review 依頼 → 受領、凍結状態、右腕の工程。
  - 規則は 1 行: 「表に無い (状態, 事象) の組はすべて deny」。
  - 各遷移の guard を事前条件、effect を事後条件として書く。
  - 負例テストは表から自動で作る。AC の「跳ばしたら deny」を手で書かない。
  - 回帰側だけ、hook event の実測から遷移の頻度を数えて重みにする。新機能は決定的な負例で守る。
- 作らないもの:
  - 汎用の MBT ツールや DSL。
  - すべての状態機械の表 (最初は gate に関わる 3〜4 個だけ)。
  - 2 つ目の正本。表の置き場 (設計文書か product/contracts/ か) は 1 つに決める。これは trade-off のある方式選択なので advisor 相談の対象である (r3 §8 反例、§9)。

### 2-2. 決定的な oracle を主役にし、family の合意を主役にしない

- 出典:
  - r1 e-2 (Nogueira ら arXiv 2607.02808。別モデルの合議の利得は独立時の約 0.43〜0.44。同モデルは 0.3 未満)。
  - r3 §10 (Knight & Leveson 1986。Ron ら arXiv 2606.20158 の 2026 年追試でも共通モード故障が大きい)。
  - r1 a-1〜a-3 (「テスト合格」は弱い証拠)。
- 単純になる FR / AC: FR-013、FR-023、FR-024、FR-051 / AC-063、FR-042。
- 設計文書に書くこと:
  - 「family 分離は相関を下げる手段であり、独立の十分条件ではない」と 1 文で書く。
  - 合否の根拠の順序を決める: 決定的 oracle (テスト・型・schema・mutation) → 反証試行 → LLM review の所見。
  - PASS は多数決や合意で決めない。
  - 曖昧さ検出 (ambiguity probe) は高リスクの契約だけに使う。2 family が設計文書だけから期待値付きテストを書き、食い違いを設計の曖昧さ候補として FR-048 の backflow へ返す (r3 §10)。
- 作らないもの:
  - 同じ family の lane を 2 つ並べる「疑似独立」。
  - 実装を複数版持つ N-version。複数 family で書くのはテストだけにする。
  - 独立性を測る新しい指標体系。較正は FR-042 の既存の枠に「family 組ごとの同時見逃し」を 1 列足すだけにする。

### 2-3. Doorstop 型の suspect link (上流の digest が変わったら下流を要再確認にする)

- 出典: r2 (d) Doorstop (r2 は「最も効く着想」とする)。r2 (d) OpenFastTrace の版付きタグ。r3 §11 の baseline digest manifest。
- 単純になる FR / AC: FR-004 (親参照)、FR-006 (ID と digest で引く)、FR-048 (backflow)、FR-058 (frozen)、FR-007 / AC-013 (移し漏れ)。
- 設計文書に書くこと:
  - リンクは「上流の path + revision + digest」を持つ。CLAUDE.md の「上流の設計 revision digest」を機械検査に格上げするだけである。
  - 上流の digest が変わったら、下流のリンクは suspect になる。
  - suspect は、下流 owner の再確認 record でだけ解ける。
  - 孤児 (親なし) と未検証 (対のテスト設計なし) を lint で出す。
- 作らないもの:
  - ReqIF などの交換形式。
  - StrictDoc 相当の専用文書形式。
  - LLM が張ったリンクを正本にすること。LLM は欠落リンクの候補を出すだけにする (r1 c-1。回復精度は 85% 前後)。

### 2-4. L8 の食い違いを 3 分類し、不適合 (NCR) の 3 処置で閉じる

- 出典: r3 §6.2 (DO-178C の双方向トレース)。r3 §9.2 (建設の as-built と NCR 処置)。r1 d-1 / f-1 (コードを正とした仕様は欠陥も写す)。
- 単純になる FR / AC: FR-067 / AC-080、FR-029 / AC-040、FR-066。
- 設計文書に書くこと:
  - 分類: A = 設計にあり実装に無い / B = 実装にあり設計に無い (未意図機能。死んだコードを含む) / C = 両方にあり挙動が違う。
  - 処置の対応: A → 実装を直す (L7)。B → 設計へ backfill するか削る。C → 3 処置のどれか。
  - as-built を書く lane は設計文書を見ない (blind)。比較する lane だけが両方を見る。
  - as-built の各文は根拠の位置 (関数名など) を必須にする。根拠の無い文は食い違い候補にしない。
  - 重要な文は特性化テストに変えて実行する。
  - 許容差を定義する。比較の主対象は構造化フィールド (契約・状態遷移・schema) とし、散文の表記ゆれは数えない。
  - 「as-built は設計との差分検出であり、正しさの証明ではない」と明記する。
- 作らないもの: 新しい処置の種類。散文どうしの自由比較。CCB の会議体。

### 2-5. receipt を in-toto の Statement 形に揃える

- 出典: r2 (b) in-toto (Statement = subject + predicateType + predicate)。r2 (b) SLSA。r3 §6.2 採用提案 3 (検証者の版を束縛)。
- 単純になる FR / AC: FR-013、FR-023、FR-027、FR-041 / AC-022、AC-032、AC-033、AC-053。
- 設計文書に書くこと:
  - subject = candidate HEAD の tree digest + CI generation。
  - predicate = verdict、reviewer の family・model・tier・session、evidence tier、反証試行の有無。
  - predicate に「検証したハーネス (gate 規則) の版 digest」を入れる。gate の規則が変わったら、古い PASS を新規則の証拠にしない。
  - 形を揃えておけば、後で署名や attestation に接続できる (§4 S-1)。
- 作らないもの: 自前の暗号・署名実装。in-toto の layout 検証エンジン。

### 2-6. gate の出力を「severity 付き violation の配列」に統一する

- 出典: r2 (c) OPA / Conftest (deny / warn と構造化 violation)。r2 (c) reviewdog (差分行フィルタ)。
- 単純になる FR / AC: FR-002、FR-005、FR-046、FR-070 / AC-083 (当面は報告だけ)。
- 設計文書に書くこと: 全 gate の戻り値を `{ severity: deny|warn, rule_id, path, message }[]` に揃える。変更行に関係する指摘だけを出すフィルタを 1 つ持つ。
- 作らないもの: Rego などの規則言語。規則は TS の純関数で足りる。

### 2-7. Assurance 2.0 の語彙を借りる

- 出典: r1 b-1 (Bloomfield & Rushby、arXiv 2205.04522 / 2405.15800)。r1 b-2 (GSN v3 / SACM 2.3)。
- 単純になる FR / AC: FR-013、FR-051 / AC-063 (反証ゼロの PASS は PASS-WEAK)、FR-058 / AC-071、FR-042。
- 設計文書に書くこと:
  - 自作の用語を claim / argument / evidence / defeater (主張への疑い) / residual doubt (残存疑義) に置き換える。
  - 「PASS-WEAK」は defeater の検討が記録されていない PASS と定義し直す。
  - frozen への遷移条件に「未解決 defeater の一覧が記録されていること」を足す。
  - schema に持つ型は claim / evidence / context / defeater の 4 つだけにする。
- 作らないもの: SACM の全実装。GSN 図の正本化。図は JSON 正本から生成する view にする (FR-008)。

### 2-8. Fagan の欠陥分類と検査量の上限

- 出典: r3 §4 (Fagan inspection)。r3 は「v4 は Fagan の役割と退場条件をほぼ再発明している。足りないのは欠陥分類と検査量の上限」とする。
- 単純になる FR / AC: FR-041、FR-042、FR-051 / AC-053、AC-063、FR-010。
- 設計文書に書くこと:
  - FINDING の分類を 4 つにする: 契約違反 / 欠落 / 余剰 / 規約・品質。L8 の A/B/C と語彙を揃える。
  - judgement record に `defect_class` と `found_by_lane` (claim-blind / spec-blind) を足す。lane ごとの見逃し率を FR-042 で測れる。
  - review packet に diff 行数の上限を置く。上限値は実測で決める (Fagan の数値は [要確認])。PR スコープ規律 (1 PR = 1 論点) と整合する。
- 作らないもの: 会議。細かい分類。欠陥数を人や lane の評価に使うこと。

### 2-9. 狙いを絞った mutation (Meta ACH 型)

- 出典: r1 d-2 (Foster ら、ACH、FSE 2025、arXiv 2501.12862)。r1 a-6 (METR: モデルはテストや採点を書き換える)。r1 d-4 (TDFlow)。
- 単純になる FR / AC: FR-065 / AC-078、FR-024 / AC-034、FR-054 / AC-066。
- 設計文書に書くこと:
  - release 必須の AT は、守る要件に結びついた少数の mutant を殺すことを受理条件にする。
  - equivalent mutant の判定は別 family の提案とし、TS 側が mutant を実行して確かめる。
  - AT のテストファイルと oracle は、実装 worker の書き込み区分の外に置く (FR-005 の区分で fail-close)。
  - 可能なら worker に見せない保留 AT を持つ。
- 作らないもの: 全面的な mutation。mutation score をテスト数の代わりにすること。

### 2-10. その他の小さな借用 (1 行ずつ)

| 借用 | 出典 | 効く FR | 作らないもの |
|---|---|---|---|
| 配置 registry を「区分 × 区分」の forbidden 表 + 既存違反の baseline で持つ | r2 (f) dependency-cruiser / eslint-plugin-boundaries | FR-005, FR-070 | 汎用の依存解析エンジン |
| 境界は「schema + 共有 fixtures 表」で TS と Python の合否一致を試験する | r2 (g) JSON-Schema-Test-Suite 方式 | FR-062 / AC-075 | 生成器の自作 |
| 監査 sampling に「見逃し 0 件なら上限約 3/n」(rule of three) を付ける | r3 §2 | FR-024 / AC-034 | 統計基盤 |
| gate ごとに「どの人間作業の代わりか / 見逃しの影響 / 別の検出手段」を 1 行で持つ | r3 §6.2 (DO-330 / ISO 26262-8 のツール分類) | FR-024, FR-042, FR-051 | 認定文書 |
| 「frozen = baseline」「軽い是正 = Class II、契約の戻し = Class I」と用語で説明する | r3 §11 (構成管理・CCB) | FR-031, FR-058, FR-048 | 新しい機構 |
| 設計判断に品質特性シナリオ (刺激 / 環境 / 応答 / 尺度) と前提 (感度点) を 1 件持たせる | r3 §7 (ATAM) | FR-076 / AC-089 | ATAM の workshop |
| RACI の各セルを「承認軸 × 書き込み範囲軸」に写す | r2 (a) Codex CLI の approval × sandbox | FR-002 / AC-002 | 承認 UI |
| 固定工程に LLM を差し込み、次の行動を LLM に選ばせない | r1 a-5 (Agentless) | FR-050, FR-060 | 自由度の高い agent ループ |

---

## §3 補強 (既存 FR / AC の改訂で吸収するもの)

V4D-087 に従い、同じ論点は既存の行を同じ ID で直す。新しい ID は作らない。

| FR/AC id | 補強内容 | 根拠 | 優先度 |
|---|---|---|---|
| UTV4-FR-013 / AC-022 | receipt に「検証したハーネスの版 digest」を束縛する。合否の根拠は決定的 oracle を先に置き、合意で決めないと書く。 | r3 §6.2、r1 e-2、r3 §10 | 高 |
| UTV4-FR-023 / AC-033 | author family は自己申告で決めない。PR と commit の事実から導き、導けなければ fail-close する。明示の値は導出値と一致するときだけ受理する。 | 非公開の脅威モデル | 高 |
| UTV4-FR-027 | receipt を in-toto の Statement 形 (subject digest + predicate) にする。受領の検証経路は §4 S-1 で定める。 | r2 (b)、非公開の脅威モデル | 高 |
| UTV4-FR-051 / AC-063 | review 中のセッションへの入力は、control plane が組んだ packet だけにする。memory や通知などの別経路の本文を、review 中のセッションへ配らない。比較判定は順序を入れ替えた 2 回で行う。 | r1 e-1 (位置バイアス)、非公開の脅威モデル | 高 |
| UTV4-FR-054 / FR-065 / AC-078 | AT のテストと oracle を実装 worker の書き込み区分の外に置く。release 必須 AT は狙いを絞った mutant を殺すことを受理条件にする。別 family が追加テストで穴を探す工程を宣言時に置く。 | r1 a-6、d-2、a-3 | 高 |
| UTV4-FR-074 / AC-087 | agent による依存の追加は登録簿の変更として review を通す。install スクリプトを既定で無効にする。lockfile と来歴を検証する。公開直後の版を一定期間避ける。悪用が確認された脆弱性 (KEV 等) は緊急の対応期限を持つ。 | r4 §5 #5、r4b P4 / P7 (ChainDrop など) | 高 |
| UTV4-FR-005 / AC-007 | 編集 guard は「事故防止」であって安全境界ではないと明記する。guard が掛からない書き込み経路も、他者の未コミット成果の変化を事後に検出する。override は書いた session と対象 path に束縛する。 | 非公開の脅威モデル | 中 |
| UTV4-FR-049 / AC-061 | capability floor は role record (機械 policy) を根拠にし、その変更を高影響扱いにする。guard の bypass は永続の監査記録を残す。 | 非公開の脅威モデル | 中 |
| UTV4-FR-024 / AC-034 | 監査 sampling の record に「何件見て何を言えるか」(rule of three) を残す。格下げの理由に「利用上限」だけでなく「障害による一時縮退」を足す (詳細は §4 R-1)。 | r3 §2、r4b P2 | 中 |
| UTV4-FR-031 / AC-042 | 是正の入力は、別 family の FINDING か実行結果に限る。worker の自己批評だけの是正ループを数えない。Class II / Class I の語彙で説明する。 | r1 d-3、r3 §11 | 中 |
| UTV4-FR-041 / FR-042 | judgement record に `defect_class` と `found_by_lane` を足す。family 組ごとの同時見逃しを較正指標に足す。 | r3 §4、r1 e-2 | 中 |
| UTV4-FR-064 / AC-077 | テスト選択は「観察モード」(選ばなかったテストも走らせて見逃し率を測る) を先に置く。選択結果に依存グラフの版を束縛する。 | r1 c-2 | 中 |
| UTV4-FR-067 / AC-080 | §2-4 の 3 分類・blind as-built・根拠位置・特性化テスト・許容差を入れる。「as-built は正しさの証明ではない」と書く。 | r3 §6.2 / §9.2、r1 d-1 / f-1 | 中 |
| UTV4-FR-058 / AC-071 | 「frozen = baseline」と書く。frozen の変更は backflow record を通す。frozen の条件に未解決 defeater の一覧を足す。 | r3 §11、r1 b-1 | 中 |
| UTV4-FR-038 / AC-050 | Issue・PR・コメント・依存の README・ツール出力を untrusted として型付けする (信頼境界は §4 S-2)。 | r4 §5 #1 | 中 |
| UTV4-FR-075 / AC-088 | 特権・保守アカウントは短命の資格と多要素認証を前提にし、特権操作を監査する。 | r4b P8 (デジタル庁 GSS、さくら) | 中 (認可に触れるため PO 承認) |
| UTV4-FR-037 / AC-049 | incident の型に「セキュリティ」を足す (封じ込め・影響範囲・通知判断・事後の backflow)。runbook の本体は §4 S-6。 | r4 §5 #11 | 中 |
| UTV4-FR-012 / AC-021 | 全体ビューに縮退中かどうかを表示する。 | r4b P1 / P2 | 低 |
| UTV4-FR-062 / AC-075 | 合否一致の試験を「schema + 共有 fixtures 表」で行う。 | r2 (g) | 低 |
| UTV4-FR-076 / AC-089 | 設計判断に品質特性シナリオ 1 件と、依存する前提 1 行を持たせる。 | r3 §7 | 低 |

---

## §4 不足課題 (対応する FR が無いもの)

各項目は「検証できる形の要件案」「優先度」「高影響境界 (認証・認可 / secret / 本番 / 外部 API) に触れるか」で書く。
触れる項目は、追加の前に PO 承認が要る (CLAUDE.md §Safety Boundaries)。advisor 相談は承認の代わりにならない。

### セキュリティ

**S-1 review 受領の完全性 (review custody)** — 優先度: 高 — 高影響境界: 触れる (merge 権限・トークン・ホスト側設定 = 認可と本番)

- 根拠: 非公開の脅威モデル (件数: High 3 / Medium 5 / Low 2) の最重要所見群。r2 (b) in-toto / GitHub artifact attestations。
- 要件案:
  - review の受領記録は、author 側のプロセスが書ける経路で作られたものを merge 判定の入力にしない。
  - 受領は改ざんできない経路 (サーバー側の検証、または author の手が届かない鍵による署名) で検証する。
  - merge の最終強制はホスト側 (必須の status check または ruleset) に置く。クライアント側の gate だけに頼らない。
  - AI lane に渡す認証情報から、直接 merge する権限を外す。
  - reviewer の実行中に、判定の値を外から差し替えられない受け渡し経路にする。判定の値が 2 経路で食い違えば fail-close する。
  - 受領の検証に使う CI の外部 action は、commit SHA で固定する。
- 検証 (受入案、release 必須 yes。判定基準 3「検証の迂回」):
  - (a) ローカルに偽の受領記録を置いて merge を試す → deny。
  - (b) wrapper を通さずホストで直接 merge を試す → ホストが拒否。
  - (c) 自己申告の family で同族 review を別族に見せる → deny。

**S-2 プロンプト注入の信頼境界と agent の最小権限** — 優先度: 高 — 高影響境界: 触れる (secret と、権限の設計は認可)

- 根拠: r4 §4 (Issue・PR・隠しコメント経由の注入、OWASP LLM01 / Agentic ASI01〜03)。r1 a-7 (境界を先に固定し、承認を減らす)。非公開の脅威モデル。
- 要件案:
  - 外部由来のテキスト (Issue・PR・コメント・依存の README・MCP やツールの出力・他 lane の memory 本文) を untrusted と型付けする。
  - untrusted を入力に持つ lane は、書き込み・秘密情報・外向き通信の権限を持たない。
  - role record の許可に、読み取り範囲・環境変数の継承・外向き通信先を足す。秘密情報の置き場の読み取りは既定で deny する。
  - untrusted 入力から権限操作が試みられたら、security event として記録する (S-6)。
- 検証: 注入入りの Issue・コメント・memory の corpus を CI で流し、guard が止めることを確かめる (release 必須 yes。判定基準 2 / 5)。

**S-3 秘密情報の統制とローテーション** — 優先度: 高 — 高影響境界: 触れる (secret)

- 根拠: r4b P3 (イノベーション・マネーフォワードの GitHub 認証情報、さくらの初期パスワード平文)。r4 §5 #6。CLAUDE.md の Safety Boundaries は規律だけで、要件化されていない。
- 要件案:
  - 秘密情報の混入を 3 点で検査し、検出したら block する: commit 前 / PR の CI / ログ・receipt・memory・Evidence Ledger への書き込み前。
  - 漏えいの疑いがあるときの失効とローテーションの手順を持ち、実施を record に残す。
  - release / publish の権限を最小にし、トークンの寿命を短くする。CI の agent には長期の秘密情報を渡さない。
- 検証: 秘密情報の形をした文字列を各点へ流す → block (release 必須 yes。判定基準 5)。ローテーション手順の演習 record がある。

**S-4 MCP・hook・設定・skill の完全性** — 優先度: 中〜高 (MCP を使い始めたら高) — 高影響境界: 一部触れる (外部 MCP は外部 API 前提)

- 根拠: r4 §4 (tool poisoning、MCP の CVE 群、npm ワームが agent の設定ファイルを狙った報告)。r4 §5 #3 / #4。
- 要件案:
  - MCP サーバーとツールは FR-074 の登録簿に載せ、版を固定する。tool description の digest を記録し、変わったら承認を取り直す。
  - consumer repo へ配る hook・設定・skill は、release の manifest digest と照合する。差異は doctor が fail-close する。
  - clone 直後に hook や設定を自動で有効にしない。信頼の確認後に有効化する。
- 検証: 配った設定を 1 byte 変える → doctor が fail-close。登録簿に無い MCP を使う → deny。

**S-5 SBOM・署名・来歴 (配布物の完全性)** — 優先度: 中〜高 — 高影響境界: 触れる (本番配布と外部サービス前提)

- 根拠: r4 §5 #9。r4b P4 (ChainDrop: 乗っ取られたアカウントが正規の provenance 付きで公開した)。r2 (b) SLSA / sigstore / GitHub attestations。
- 要件案:
  - compiled Node bundle に SBOM・署名・ビルド来歴を付け、install 時に検証する。
  - 来歴の repo・workflow・commit が期待値と一致することを確かめる。
  - 「来歴があれば安全」としない。公開 workflow の権限と起動条件を最小にする。
  - 署名の信頼根は設計判断として凍結する。V4D-096 (OSS は依存にしない) との関係で、プラットフォーム機能の利用で足りるかを PO が判断する (r2 (b) 注記)。
- 検証: 署名や来歴が合わない bundle を install する → 拒否 (release 必須 yes。判定基準 3)。

**S-6 ハーネスのセキュリティ event 記録と runbook (SOC 相当)** — 優先度: 中 — 高影響境界: 原則触れない (個人情報の通知判断だけは PO)

- 根拠: r4b P6 (検知の遅れ: さくらは約 3 年、デジタル庁 GSS は検知から公表まで約 2.5 か月)。r4 §5 #10 / #11 / #12。r4b P10。
- 要件案:
  - security event を型付きで記録する: guard の拒否、override の使用、権限外のツール呼び出し、秘密情報の検出、untrusted 入力からの権限操作。
  - 記録は改ざんを検知できる形で持ち、保持期間を決める。
  - 重大度と owner による triage 区分を持つ。1 人の時期も省略しない (FR-033 と同じ考え方)。
  - runbook は 4 種から始める: GitHub 停止 / provider 停止 / 秘密情報の漏えい疑い / 配布物の不良。各々「検知 → 縮退 → 連絡 → 復旧 → 事後 record」の順。
  - 敵対的テストの corpus (注入入りの Issue、汚染された MCP、偽の受領記録、改ざんした hook) を repo に持ち、release ごとに CI で流す。
- 検証: corpus の各件で guard が止まり、security event が 1 件ずつ記録される。runbook の演習 record がある。

### レジリエンス

**R-1 GitHub / AI provider 停止時の縮退運転** — 優先度: 高 — 高影響境界: 触れる (外部 API 前提の明文化)

- 根拠: r4b P1 (GitHub 8/6・8/17 など月に複数回の数時間停止)、P2 (9/3 の AI provider 同時停止 [要確認])、P9 (再試行の暴走が復旧を遅らせた)、P11 (停止中のイベントが再生できない)。
- 要件案:
  - 障害による縮退と利用上限による停止を、同じ「縮退 record」で扱う。縮退は期限付きで、恒久の格下げにしない。
  - 縮退中は高影響境界の merge を止め、FR-024 の補償統制を自動で有効にする。
  - 全 provider が同時に止まったら作業を止めてキューに積む。独立 review を偽装しない。
  - GitHub 停止中も正本はローカルのファイル (FR-006) に積む。停止中の merge は禁止する。
  - 復帰後は HEAD・チケット・CI を突き合わせて再同期する。欠落したイベントは CI の再実行で検証し直す。
  - 外部呼び出しは backoff・circuit breaker・回数上限を持つ。障害時は並列上限を自動で下げる。
- 検証: 停止を模した状態で merge を試す → deny。復帰後の再同期で、正本と投影のずれが 0 件になる。再試行の回数が上限を超えない。

**R-2 配布の影響範囲の制限と、独立したロールバック経路** — 優先度: 高 — 高影響境界: 触れる (本番配布)

- 根拠: r4b P5 (Azure 7/23: 保守ツールの欠陥で影響が広がり、自動ロールバックが障害と同じ経路に依存した)。#814 safe upgrade に対応する FR が無い。
- 要件案:
  - 配布は段階展開 (canary → 全体) とし、1 回の変更の影響上限と自動停止条件を持つ。
  - ロールバックの経路は、更新の経路から独立させる。
  - ロールバックの演習を AT として宣言する (FR-065)。
- 検証: ロールバック AT が、更新経路を止めた状態でも成功する (release 必須 yes。判定基準 4「正本や作業を失う」)。

### プロセス

**P-1 gate の「ツール影響」分類** — 優先度: 中 — 高影響境界: 触れない

- 根拠: r3 §6.2 (DO-330 の基準 2 / ISO 26262-8 の TI・TD)。
- 要件案: 人間の確認を減らす根拠になる gate は、次のどれか 1 つ以上を必須にする: 独立の oracle / mutation 検証 / 較正の実績。gate ごとの分類 1 行を一覧で読める。
- 検証: 分類の無い gate、または必須手段の無い「基準 2 相当」の gate を lint が出す。

**P-2 AI provider へ送るデータの分類** — 優先度: 中 — 高影響境界: 触れる (PII と外部 API)

- 根拠: r4 §5 #13 / #14 (IPA 10 大脅威 2026 の 3 位「AI の利用をめぐるリスク」、AI 事業者ガイドライン 第 1.2 版)。
- 要件案: 送ってよいデータの分類を定め、provider ごとに許可を持つ。FR-038 の遮断規則と対にする。
- 検証: 許可されない分類のデータを含む packet を送ろうとする → deny。

**P-3 セキュリティ検査の oracle (SAST / SCA、consumer 向け DAST)** — 優先度: 中 — 高影響境界: 触れない

- 根拠: r4 §5 #7 / #8。
- 要件案: SAST と SCA を CI の必須 oracle にする。FR-065 の AT 宣言に「セキュリティ」の種類を足し、consumer product が DAST を L10 の AT として宣言できるようにする。
- 備考: 公開面の資産台帳と脆弱性の対応期限 (r4 §5 #8) は consumer product 側の話であり、ハーネス本体の優先度は一段下 (低)。

**P-4 決定台帳の不足欄** — 優先度: 低 — 高影響境界: 触れない

- 根拠: r3 §11 (CCB との比較)。
- 要件案: 台帳に承認者の identity を持つ。影響集合は依存グラフから生成した値として持つ (手書きにしない、FR-076 の二重管理禁止と両立させる)。決定が実現したかを L8 の結果へ結ぶ。

---

## §5 段取り (最小にまとめる)

### 重なりの統合

8 件以上の不足課題を、新 FR 4 本に束ねる。残りは既存 FR の改訂で吸収する。

| 新 FR (仮) | 束ねる不足課題 | 束ねる理由 |
|---|---|---|
| FR-A review 受領の完全性 | S-1 (+ §2-5 の Statement 形、FR-023 の family 導出) | どれも「受領を何で信じるか」という 1 論点 |
| FR-B agent の実行境界 | S-2、S-3、S-4 | どれも「agent が何を読めて、何を出せるか」という 1 論点 |
| FR-C 縮退と事故対応 | R-1、S-6 | runbook の 4 種のうち 2 種が縮退そのもの |
| FR-D 配布の完全性と復旧 | S-5、R-2 | どちらも release の経路が対象 |

P-1〜P-4 は新 FR にしない。P-1 は FR-024、P-2 は FR-038、P-3 は FR-065 / FR-074、P-4 は FR-076 の改訂で吸収する。

### 順序

1. **PR #892 を広げない。** 1 PR = 1 論点の規律に従い、#892 の merge 後に別 PR で入れる。
2. **高影響境界の判断を先に取る。** FR-A〜D はいずれも高影響境界に触れる。advisor (design) に相談した上で、PO 承認を得る。承認は V4D として台帳に記録する。
3. **既存 FR の改訂 (§3) を入れる。** 新しい ID は作らない。`node docs/governance/candidates/v4-ledger-check.mjs` で対応を確かめる。
4. **新 FR 4 本と受入行を入れる。** FR-A・FR-D と、FR-B の秘密情報部分は、release 必須 yes の判定基準 (V4D-095) に当たる。
5. **設計文書は §2 の上位から書く。** 最初の PoC は「review 依頼 → 受領」の状態遷移表 1 つにする。この 1 つで §2-1 (遷移表)、§2-5 (Statement 形の receipt)、FR-A (受領の完全性) をまとめて試せる。
6. **方式選択は advisor に回す。** 遷移表の置き場、署名の信頼根、Windows での通信制御は trade-off のある方式選択である。

---

## §6 確度 (出典レポートの印をそのまま引き継ぐ)

### [確認] (出典レポートが一次資料や abstract を直接確かめたもの)

- SWE-Bench+、「Solved Issues」(ICSE 2026)、UTBoost、Agentless、METR の reward hacking、TDFlow (r1)。
- Assurance 2.0 の 2 論文、GSN v3、SACM 2.3 (r1 b-1 / b-2)。
- Meta ACH の数値 (9,095 mutant / 571 テスト / 受理 73%) (r1 d-2)。
- 自己修正の限界 (Huang ら、Olausson ら)、自己選好 (Panickssery ら、Wataoka ら)、MT-Bench の偏り (r1)。
- Knight & Leveson 1986 の書誌と結果 (r3 §10)。
- arXiv 2606.20158 と 2607.02808 の abstract (r3 は [確認]、r1 は 2607.02808 を [二次] とした。abstract 水準の確認として扱い、本文は未読)。
- Helpfeel (Gyazo) とデジタル庁 GSS の公式発表 (r4 §2.1)。
- GitHub 8/17 停止の公式ポストモーテム (r4b)。
- OSS の stars・release 日 (2026-10-08 の gh api 実測、r2)。
- 非公開の脅威モデルの所見は、コードを読んで確かめた事実である。ただしホスト側の設定は未読で、一部は仮説 (r5)。

### [二次] (二次情報・複数報道・二次資料経由)

- GMO リサーチ&AI (infoQ) の件数と経緯は複数報道。原因の記述は 1 媒体のみ (r4b)。
- Oracle EBS / PeopleSoft の脆弱性悪用 (r4b)。
- ChainDrop (Shai-Hulud 亜種) の手口 (r4b)。
- Azure 7/23 の原因 (予備 PIR 経由)、GitHub 8/6 の原因の一部 (r4b)。
- SmartScope の国内漏えい集計 (123 件など) (r4 §2.3)。
- DO-330 の TQL 表、ISO 26262-8 の TCL (r3 §6.2)。
- AI coding agent への注入の実例 (CSA ノート経由) (r4 §4)。
- TDAD、VeriGuard、「Specification as Quality Gate」(r1)。

### [要確認] (採用前に一次資料を取ること)

- 9/3 の AI provider 同時停止の原因と日付 (r4b)。
- Oracle 自身の 2026 年の新規侵害 (見つかっていない)。2025 年の OCI 認証情報流出の真偽 (r4b)。
- CVE-2026-54316 / CVE-2026-75130 の NVD 記録 (r4 §4)。
- OWASP Agentic Top 10 の ASI04〜08 (r4 §3)。
- Fagan の検査速度の数値、IEEE 1012 の独立性 3 軸、rule of three の書誌 (r3。記憶ベース)。
- mutation score と実欠陥検出の相関の効果量 (r1 d-2)。
- NOASSERTION と出た OSS のライセンス (r2。コードを写さないので判断には影響しない)。
- 9 月以降の JPCERT/CC・NISC・個人情報保護委員会の公式注意喚起 (r4)。
- 「承認の 93% が通る」のような出典不明の数字は使わない (r1 a-7)。
