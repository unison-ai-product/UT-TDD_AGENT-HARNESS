# 監査レンズカタログ (audit lens catalog)

- **date**: 2026-07-03
- **author**: Claude Fable 5。出典 = A-172〜A-181 で実際に使った監査手法の資産化 (PO 指示 2026-07-03「監査ポイントと解釈観点をシステム内に組み込む」)。
- **これは何か**: ハーネスを監査するときの「見る場所 (プローブ)」「読み方 (解釈観点)」「委譲の仕方 (プロンプト雛形)」の正本。オーケストレータ (どのモデルでも) がこのカタログから該当レンズを選び、雛形を埋めて subagent へ渡せば、A-18x 級の監査が再現できる。
- **機械配線**: `ut-tdd audit` コマンド化と skill 推奨接続は PLAN-L7-310 (version-up v2)。配線前でも本カタログは手動運用で完全に機能する。
- **使い方**: ①目的に合うレンズを §2 から選ぶ (複数可、独立レンズは並列 fan-out) ②各レンズの委譲プロンプト雛形の `{{...}}` を埋めて subagent (推奨: pmo-sonnet、model=sonnet) へ渡す ③返ってきた所見は §1 の共通規律で必ず裏取りしてから A-18x へ記録する。

## §1 共通規律 (全レンズ適用、これを守らない監査は無効)

1. **実測必須**: 全ての数値主張に測定コマンドを添える。「多い/遅い/古い」は禁止、「11,150 行 (`SELECT COUNT(*)`)」と書く。
2. **既存カバー判定必須**: 所見ごとに docs/plans/ を検索し「既存 PLAN で解決予定 (plan_id 明記)」と「未起票 gap」を分離する。重複起票は台帳を汚す。
3. **裏取り必須**: subagent の所見のうち、起票根拠になる主張は最低 1 件/レーン、オーケストレータ自身が実ファイル/実データで検証する (delegated narration を成果の証拠にしない)。
4. **transient 注意**: 相手ランタイム並行作業中の working tree 計測は transient。基準は HEAD + 意図変更のみ。doctor fail はまず in-flight との切り分け。
5. **coverage ≠ substance**: 機械 green (orphan 0 / N 件登録 / lint OK) を「中身が健全」の証拠にしない。サンプルを開いて読む。
6. **出力様式**: 所見 ID (レンズ固有 prefix + 連番) / 現象 / 実測根拠 / 影響 / 既存カバー判定 / 是正方向 (触るファイル・check 名まで)。監査レポートは `.ut-tdd/audit/A-<連番>-<slug>-<date>.md`。
7. **read-only**: 監査 subagent には Edit/Write 禁止を明示する。是正は監査と別 cycle (routing 経由で起票)。
8. **redaction self-trigger 回避**: 検出器の trigger 文字列をレポートに素書きしない。

## §2 レンズ一覧

| ID | レンズ | 問い | 主な出典 |
|---|---|---|---|
| LENS-CE | コンテキスト経済 | オーケストレータの 1 ループ固定コスト (トークン/秒) はいくらで、どこが割高か | A-181 |
| LENS-DV | 劣化ベクトル | 放置すると増える/腐る/例外固定のまま残るものはどれで、抑制機構はあるか | A-181 |
| LENS-GR | 実装粒度 | draft PLAN をどのモデルが拾っても迷わず実装できるか | A-181 |
| LENS-DR | 宣言と実在の乖離 | confirmed が主張する機能/データは、DB・コード・実行証跡として実在するか | A-173/A-176/A-181 |
| LENS-DE | 検出器の実効性 | 検出器は実際に発火しているか。発火記録は実行由来か投影由来か | A-176/A-178/A-180 |
| LENS-GG | 番人の番人 | gate/lint 自身の免除リスト・scope 限定・fail-open は健全か | A-175/A-178 |
| LENS-UX | UI/UX 検証態勢 | 画面系の検証観点 (操作必須項目・ユーザビリティ・要求降下) は実装フェーズに耐える厚みがあるか | A-181 (PO 指摘 2026-07-03) |
| LENS-RW | 生化 (raw-OS 純度) | Pack = 自己適用を外した生の OS は、自分史なしで起動し・自己適用の混入なしに機能するか | A-172 + PO 指摘 2026-07-03 |
| LENS-AQ | 実装アーキテクチャ品質 | コード構造は後続エージェントが安全に拡張できるか (megafile / util 複製 / 依存方向 / 様式世代) | A-182 |
| LENS-TQ | テスト実質 | テストは欠陥を実際に捕まえるか (oracle 強度 / mutation 耐性 / 実 repo 回帰 / oracle_id トレース) | A-182 |
| LENS-DQ | 設計現役性 | 設計 doc は実装判断の現役資料か (stale / 未登録モジュール / PLAN→設計 doc 参照) | A-182 |
| LENS-CX | CLI/API 契約品質 | AI が一級ユーザーの CLI として誤用できない契約か (--json / exit code / フラグ二義性) | A-182 |
| LENS-PY | ランタイム対称性 | Claude で効く統制・資産は Codex でも効くか (4 値: both / Claude-only / Codex-only / N-A × 意図的/漏れ) | A-183 (PO 指摘 2026-07-03) |
| LENS-VD | ベンダー surface 前提 | vendor (Claude Code/Codex CLI/bun) の更新で壊れる前提はどこにあり、防御 (contract test / degradation / 無防備) はあるか | A-183 |
| LENS-LM | 教訓機構化率 | prose 教訓 (ルール doc/戦略 doc/memory) のうち機械強制へ変換済みは何割か。「機械化済み」の自認は実装 Grep で裏取ったか | A-183 |

レンズは独立 — 3〜4 本を並列 fan-out するのが標準 (1 subagent 1 レンズ、混ぜない)。全域監査は A-175 §1 の 18 領域台帳を先に見て未監査領域を選ぶ。

---

## §3 LENS-CE: コンテキスト経済

**解釈観点**: セッション/ループごとに「必ず支払うコスト」を洗い出し、支払いに見合う情報密度があるかを問う。閾値の目安: 常時読み > 2 万トークンは要 tier 化検討、開発ループ内コマンド > 30 秒は要高速化検討、surface の actionable 比 < 10% は S/N 崩壊。

**実測プローブ** (そのまま実行可):

```
# 起動必読 doc の重さ (CLAUDE.md の Read Order 記載ファイルを対象に)
wc -l <file>; wc -c <file>   # トークン概算 = 文字数 / 3.5

# CLI 固定コスト
time (bun src/cli.ts status); time (bun src/cli.ts session start)
# doctor 計時 (PowerShell): $sw=[Diagnostics.Stopwatch]::StartNew(); bun src/cli.ts doctor *>$null; $sw.Stop(); $sw.Elapsed

# feedback surface の S/N (bun:sqlite readonly)
SELECT signal_type, status, COUNT(*) FROM feedback_events GROUP BY signal_type, status ORDER BY 3 DESC;
# session start 実出力の actionable / telemetry 比を読む

# skill 推奨の識別力
SELECT score, COUNT(*) FROM skill_recommendations GROUP BY score;  -- distinct が数種しかなければ rank 無差別
```

**委譲プロンプト雛形**:

> あなたは UT-TDD Agent Harness (cwd = リポジトリルート) の監査員。**read-only、Edit/Write 禁止**。{{並行作業の注意 (例: Codex リファクタ中は未コミット変更と doctor transient 失敗を不問)}}。
> 任務: オーケストレータが毎セッション・毎ループで支払う固定コンテキスト/時間コストを実測し、持続的パフォーマンスを損なう箇所を特定せよ。
> 実測項目 (必ず実コマンドで測り、数値と測定コマンドを記す): (1) 起動時必読ドキュメント (CLAUDE.md の Read Order 記載分) の行数/文字数/合計 (2) status / session start / doctor の出力量と実行秒数 (3) feedback surface の actionable vs telemetry 構成 (harness.db を bun:sqlite readonly で集計) (4) skill 推奨 score 分布。
> 分析観点: 常時読みから外せる doc はどれか / S/N 比は機能しているか / 重い check はどれか (コード構造から推定)。
> 既存 PLAN 重複判定: docs/plans/ の {{隣接 PLAN 群}} を読み「既存 PLAN で解決予定」と「未起票 gap」を分離せよ。
> 出力 (日本語 markdown): §1 実測表 (項目/測定値/測定コマンド) §2 所見リスト (ID: CE-1..、現象/実測根拠/影響/既存カバー判定/是正方向 — 触るファイルと追加機構まで具体的に) §3 常時コンテキスト予算の推奨値と削減余地。

---

## §4 LENS-DV: 劣化ベクトル

**解釈観点**: 「時間経過そのものが敵」。3 分類で全数列挙する — **A. 増え続けるもの** (append-only テーブル、ログ、doc 群: retention/rotation はあるか)、**B. 腐り続けるもの** (証跡 hash、backlog、行番号引用: 再検証/消化の恒常機構はあるか。一回性の是正は機構ではない)、**C. 例外として固定されたもの** (allowlist/baseline/免除 Set: 出口条件と ratchet (縮小のみ許可) はあるか)。判定は 3 値: 機構あり健全 / 機構あり不十分 / 機構なし。

**実測プローブ**:

```
# A: 成長点の全数
bun:sqlite readonly で全テーブル COUNT (降順) + DB ファイルサイズ
Get-ChildItem .ut-tdd/audit, .ut-tdd/logs -Recurse | Measure-Object Length -Sum
grep -c "status: draft" docs/plans/*.md  # 滞留

# B: 腐敗点
doctor 出力の green-command-digest / improvement-backlog 行を全文読む (| tail 禁止)
docs/improvement-backlog.md の status 分布と日付

# C: 例外固定点の全数列挙
grep -rn "baseline\|allowlist\|LEGACY\|EXEMPT\|_PLAN_IDS" src/ --include="*.ts" -l
# 各 Set/配列について: 出口条件の記述有無、size assertion (ratchet test) の有無を tests/ で確認
```

**委譲プロンプト雛形**:

> あなたは UT-TDD Agent Harness の監査員。**read-only、Edit/Write 禁止**。{{並行作業の注意}}。
> 任務: 人手の注意が薄れても品質が保たれるかを「増え続けるもの / 腐り続けるもの / 例外として固定されたもの」の 3 分類で監査せよ。
> 調査対象: (A) harness.db telemetry テーブル群と retention 機構の有無 (src/state-db/)、.ut-tdd/audit/ と logs/ のサイズ、docs/plans/ の増加と archive 経路 (B) digest 系不一致の恒常機構有無、improvement backlog の年齢と消化強制、debt 台帳の放置検出 (C) src/ 内のハードコード免除リスト全数 (grep で列挙し、各々に出口条件/ratchet があるか分類)。
> 出力 (日本語 markdown): §1 劣化ベクトル台帳 (ID: DV-1..、分類 A/B/C / 現在値実測 / 成長速度推定 / 既存抑制機構 / 判定 3 値) §2 機構なし・不十分項目の是正方向 (触るファイル、check 名、retention/ratchet の具体設計) §3 既存 PLAN との重複判定 (plan_id 明記)。未調査項目は「未確認」と明示せよ。

---

## §5 LENS-GR: 実装粒度 (後続モデルの実装可能性)

**解釈観点**: 「このハーネスの PLAN は、文脈を持たないモデルが拾っても迷わず完了できるか」。5 基準で A/B/C 採点 — ①変更対象の明示 (ファイル/関数名まで = A、「gate を追加」だけ = C) ②test oracle (DoD が機械検証可能コマンドか。prose 主張のみ = C) ③依存と順序の成立 ④1 PLAN = 1 要件か (束の検出) ⑤文脈自足性 (PLAN + 参照 doc だけで着手できるか。「TL/PO 判断」の未決 slot が核心に残っていれば C)。既知の系統欠陥パターン: 未決分岐の丸投げ / 隠れ束 / 番号衝突 / debt 台帳リンク欠落 / 行番号 stale (A-181 GR-1〜5)。

**実測プローブ**:

```
grep -l "status: draft" docs/plans/*.md            # 対象列挙
# 最低 15 本精読 + 残り frontmatter triage
# 各 PLAN: DoD checkbox 数、file.ts:NNN 引用の現物照合 (Grep)、requires の status 確認
# debt 台帳突合: src/plan/lint-policy.ts の *_PLAN_IDS と PLAN 本文の相互リンク有無
```

**委譲プロンプト雛形**:

> あなたは UT-TDD Agent Harness の監査員。**read-only、Edit/Write 禁止**。{{並行作業の注意}}。
> 任務: draft PLAN 群を「後続の実装エージェントが迷わず実装できる粒度か」で監査せよ。今後 Opus/Sonnet/Haiku/GPT 系が消化する前提。
> 対象: status=draft 全列挙のうち最低 15 本を精読、残りは frontmatter triage。
> 評価基準 (A/B/C): ①変更対象の明示 ②test oracle の機械検証可能性 ③依存/順序の成立 ④1 PLAN = 1 要件 (束検出) ⑤文脈自足性 (未決分岐が本文で閉じるか)。
> 追加調査: 免除台帳 (src/plan/lint-policy.ts) 掲載 PLAN の本文に台帳/昇格手順へのリンクがあるか。行番号引用が現物とずれていないか。
> 出力 (日本語 markdown): §1 採点表 (plan_id / 5 基準 / 総合 / 一言) §2 系統的粒度欠陥パターン (ID: GR-1..、パターン / 該当 PLAN / 後続モデルがどう迷うか / 是正方向) §3 着手順の推奨 wave 案 (依存と価値から)。

---

## §6 LENS-DR: 宣言と実在の乖離

**解釈観点**: 「confirmed = 実在」ではない。宣言 (PLAN の claim、schema の存在、doc の記述) と実在 (DB の行、コードの既定動作、実行証跡) を突合する。典型パターン: (a) schema は在るが 0 行/全 null (書き手未実装) (b) 機能は在るが opt-in flag の陰で既定 off (c) claim は在るが cite された test/コマンドが無い (d) 一回性の是正が「恒常機構あり」と読まれている。これは V-model 右腕のデータ実在性エスカレーションの監査版。

**実測プローブ**:

```
# (a) 型: 全テーブル COUNT で 0 行を列挙し、各々「evidence-gated 宣言」か「実装漏れ」か分類
#        列レベル: PRAGMA table_info + 代表行 SELECT で全 null 列を発見 (例: model_runs のコスト 5 列)
# (b) 型: 該当機能のフラグ既定値をコードで確認 (grep "=== true" / options 既定)
# (c) 型: confirmed PLAN の review_evidence の green_commands が現物 (tests/, コマンド) を指すか抜き取り
# (d) 型: 「N 件是正済み」claim の対象を doctor 現在値と突合 (再増殖していないか)
```

**委譲プロンプト雛形**:

> あなたは UT-TDD Agent Harness の監査員。**read-only、Edit/Write 禁止**。{{並行作業の注意}}。
> 任務: {{対象領域 (例: harness.db 全テーブル / 特定 subsystem)}} について「宣言と実在の乖離」を監査せよ。
> 手順: (1) 宣言側を列挙 (confirmed PLAN の claim、schema 定義、doc 記述) (2) 実在側を実測 (DB 行/列の実データ、フラグ既定値、実行証跡の有無) (3) 乖離を型分類: 0行・全null型 / opt-in陰型 / cite欠落型 / 一回性是正型。
> 重要: 乖離 = 悪ではない。PLAN が訂正を明記していれば「documented correction」、evidence-gated 宣言があれば「意図的 0」— 分類してから判定せよ。
> 出力 (日本語 markdown): §1 突合表 (宣言 / 実在の実測 / 乖離型 / 判定) §2 所見 (ID: DR-1..) §3 既存 PLAN 重複判定。

---

## §7 LENS-DE: 検出器の実効性

**解釈観点**: 「検出器が在る」と「検出器が働いている」は別。3 段で問う — (1) **発火実績**: 実際に fire した記録はあるか (2) **記録の由来**: その記録は実行由来 (provenance 付き) か、投影が自動生成した「発火したことになっている」行か (3) **発火ゼロの意味**: 対象が本当に無いのか、検出器が対象に届いていないのか (absence-blindness)。実例: skill_invocations 1,580 件が全て auto-projection で実発火 0 だった (2026-06-29)。

**実測プローブ**:

```
# 発火実績と由来
SELECT source_table, COUNT(*) FROM <検出系テーブル> GROUP BY source_table;
# provenance 列 (source_color / evidence_path 等) の分布。実行由来を示す値が 0 なら全て投影
# 発火ゼロ検出器の列挙: gate_runs / guardrail_decisions 等で一度も現れない check 名を doctor 出力の check 一覧と突合
# 実走テスト: 意図的に違反 fixture を作れる検出器は、fixture で本当に fail するか 1 件実走 (read-only で可能な範囲)
```

**委譲プロンプト雛形**:

> あなたは UT-TDD Agent Harness の監査員。**read-only、Edit/Write 禁止**。{{並行作業の注意}}。
> 任務: {{対象検出器群 (例: guard/hook/gate/skill 発火系)}} の実効性を監査せよ。「存在」ではなく「発火実績と記録の由来」を実測する。
> 手順: (1) 対象検出器を全列挙 (2) 発火記録テーブルを bun:sqlite で集計し、実行由来 vs 自動投影を provenance 列で分離 (3) 発火ゼロの検出器は「対象が無い」のか「届いていない」のかをコード経路で判定。
> 出力 (日本語 markdown): §1 検出器台帳 (検出器 / 発火数 / 由来内訳 / 判定: 実効・空回り・不明) §2 所見 (ID: DE-1..) §3 既存 PLAN 重複判定。

---

## §8 LENS-GG: 番人の番人

**解釈観点**: gate/lint 自身を監査する。(1) **免除の健全性**: 免除リストに出口条件・期限・ratchet があるか。「恒久免除」は台帳に理由が明記されているか (2) **scope の意図性**: gate の対象限定 (draft のみ / 特定 kind のみ) は設計意図 (テスト+doc に痕跡) か、実装都合の漏れか — **バグと断じる前に意図の痕跡を探す** (3) **fail-open/close の宣言との一致**: 「fail-close」と書かれた check が実は warning 止まりでないか (4) **bypass 経路**: 免除フィールドの削除や空値で gate を素通りできないか (bypass 自体を fail-close しているか)。

**実測プローブ**:

```
grep -rn "ENFORCEMENT_DATE\|_PLAN_IDS\|allowlist\|baseline" src/plan src/lint --include="*.ts"
# 各 gate: 対象限定条件 (if status/kind/date) を読み、対応するテスト or 設計 doc の意図記述を探す
# bypass 試験の存在: tests/ に「フィールド削除で fail-close」型のケースがあるか grep
# 宣言照合: doc/PLAN の「fail-close」記述と実装の exit code 経路を突合
```

**委譲プロンプト雛形**:

> あなたは UT-TDD Agent Harness の監査員。**read-only、Edit/Write 禁止**。{{並行作業の注意}}。
> 任務: {{対象 gate/lint 群}} 自身の健全性を監査せよ。
> 手順: (1) 免除リスト/enforcement cutoff/baseline を全列挙し、各々の出口条件と ratchet の有無を判定 (2) gate の scope 限定について意図の痕跡 (テスト・設計 doc) を探し、意図的 / 漏れ疑いを区別 (3) 「fail-close」宣言と実装の一致を突合 (4) bypass 経路 (フィールド削除・空値) がテストで塞がれているか確認。
> 重要: scope 限定をバグと断定する前に必ず意図の痕跡を探せ。疑いは「要 PO/TL 確認」として報告し、断定しない。
> 出力 (日本語 markdown): §1 免除/scope 台帳 §2 所見 (ID: GG-1..、意図的 / 漏れ疑い / 要確認の 3 値判定付き) §3 既存 PLAN 重複判定。

---

## §8b LENS-UX: UI/UX 検証態勢

**解釈観点**: バックエンド先行のシステムでは UI/UX の検証観点が「実際に稼働する機会がない」まま痩せる (PO 指摘 2026-07-03)。テスト green や coverage では測れない 4 面を問う — (1) **操作必須項目の網羅**: 各画面 spec に空状態 / エラー表示 / ローディング / 取消・戻る / 権限別表示 / キーボード操作 / 操作フィードバックが定義されているか (抜けは実装時でなく spec 時に見つける) (2) **要求降下**: 業務要求・ユーザー要求 (特に usability 系 NFR) が画面別の AC まで降りているか、それとも機能要求だけが降りているか (3) **検証ケースの厚み**: UXV ケース数 / 画面数の比 (2026-07-03 実測: 5 ケース / 15 画面)、heuristics (Nielsen 10 等) 由来の観点がケース設計に存在するか (4) **デザイン判断の主体**: 見た目・情報設計の判断が「機械 gate で測れないから誰も見ていない」状態になっていないか (fe-design / fe-a11y agent の発火実績を LENS-DE と同じ方法で確認)。

**実測プローブ**:

```
# 検証ケースの厚み
bun src/cli.ts doctor 2>&1 | grep "g10-ux-workflow"    # uxv_cases / mandatory
grep -c "screen" docs/design/harness/L2-*/screen-list* 相当で画面数
# 画面 spec の操作必須項目網羅 (サンプル 3-5 画面を精読)
docs/design/harness/L6-function-design/screen-spec.md ほか screen 系 sub-doc の § 構成を確認
# usability 要求の降下
grep -i "usability\|ユーザビリティ\|操作性" docs/governance/ut-tdd-agent-harness-requirements_v1.2.md docs/design/harness/L3-*/nfr*
# FE agent の発火実績
SELECT model, role, COUNT(*) FROM model_runs WHERE role LIKE '%fe%' OR model LIKE '%fe-%' GROUP BY 1,2;
```

**委譲プロンプト雛形**:

> あなたは UT-TDD Agent Harness の監査員。**read-only、Edit/Write 禁止**。{{並行作業の注意}}。
> 任務: 中央 UI ({{現段階 (例: mock 段階、L10 pair-freeze 前)}}) の UI/UX 検証態勢を監査せよ。「実装が無いから検証も無い」を許容せず、**実装フェーズ進入時に検証が追いつく態勢か**を測る。
> 手順: (1) UXV ケース数と観点の分類 (heuristics 由来 / 業務フロー由来 / 場当たり) (2) 画面 spec 3-5 本を精読し操作必須項目 (空状態/エラー/ローディング/取消/権限/キーボード/フィードバック) の定義率を表にする (3) usability 系要求の L1→画面 AC 降下を trace (4) fe-design/fe-a11y の発火実績。
> 出力 (日本語 markdown): §1 実測表 §2 所見 (ID: UX-1..、抜け観点 / 実装時に何が起きるか / 是正方向) §3 既存 PLAN 重複判定。

## §8c LENS-RW: 生化 (raw-OS 純度)

**解釈観点**: source repo は「ハーネスが自分自身を開発する場」であり、成果物には**OS 本体**と**自己適用の歴史** (481 本の PLAN、A-17x 監査、harness.db の自分史、self-repo 前提の閾値) が混在する。Pack はそこから自己適用を外した**生の OS** — 消費者は自分史ゼロ・PLAN 0 本・空 DB から起動する。生化の監査は 4 面で問う:

1. **資産の三分類**: 全資産 (gate / lint / doc / skill / schema / CLI / hook) を「OS 本体 (Pack に載る)」「自己適用専用 (source に残る)」「**混入** (OS 経路に自己適用の前提が漏れている = 欠陥)」に分類する。混入の典型: OS の doc/skill が self-repo の PLAN ID・A-17x・`.ut-tdd/audit/` の自分史を参照する、gate の閾値/enforcement 日付/免除台帳が self-repo の歴史に校正されている、テストが source の個人パス/実データに依存する。
2. **day-0 起動性**: 消費者の初期状態 (fresh checkout、空 `.ut-tdd/`、PLAN 0 本) で setup → status → doctor → 最初の PLAN 起票までが green で通るか。「self-repo では常に何かが在る」前提の check は day-0 で誤発火または空回りする (RECOVERY-06 の consumer doctor exit 1 が実例)。
3. **閾値・基準の出自**: doctor/lint の数値基準 (advisory 閾値、baseline、cutoff 日付) が「self-repo の現状」由来か「OS として普遍」かを区別。self 由来の値が Pack に運ばれると、消費者環境で無意味な green / 誤 red を生む。
4. **更新経路の非対称**: 消費者は sync-pack の受け手であり、source の進化からの**遅延を検出する機構が無い** (Pack lag)。OS 更新の配布 (source→Pack→consumer) と消費者側 state の互換 (schema migration) が生化の運用面。

**実測プローブ**:

```
# 混入スキャン (Pack artifact set 内の自己適用参照)
# sync-pack の対象 set を確認した上で:
grep -rn "PLAN-L7-\|PLAN-DISCOVERY-\|A-1[0-9][0-9]\|\.ut-tdd/audit" <Pack対象のdocs/skills/> | grep -v <OS本体として正当な参照の除外>
# 個人パス/実データ依存 (L7-233 と同型)
grep -ri "Users.\+micro" <Pack対象>
# day-0 起動性 (隔離環境)
fresh checkout (or Pack checkout) で: ut-tdd setup → status → doctor を実行し exit code と誤発火を記録
# 閾値の出自
grep -rn "ENFORCEMENT_DATE\|閾値\|baseline" src/ を列挙し、各値に「self 由来 / 普遍」の判定列を付ける
```

**委譲プロンプト雛形**:

> あなたは UT-TDD Agent Harness の監査員。**read-only、Edit/Write 禁止**。{{並行作業の注意}}。
> 任務: Pack (自己適用を外した生の OS) の純度を監査せよ。source repo は自分自身を開発してきた歴史を持つが、消費者は自分史ゼロで起動する。
> 手順: (1) {{対象資産群}} を OS 本体 / 自己適用専用 / 混入 の三分類で全数仕分けし、混入は参照先 (self PLAN ID / 監査 doc / 個人パス / self 校正閾値) を明記 (2) day-0 初期状態で誤発火または空回りする check を机上で列挙 (可能なら隔離環境で実走) (3) 数値基準の出自 (self 由来 / 普遍) を判定 (4) Pack lag (source からの遅延) の検出機構有無を確認。
> 重要: 「source で green だから Pack でも green」は成立しない。判定は常に「自分史ゼロの消費者」を主語にせよ。
> 出力 (日本語 markdown): §1 三分類仕分け表 §2 所見 (ID: RW-1..) §3 既存 PLAN 重複判定 (RECOVERY-06 / L7-232〜236 / L7-266/267/282 / L7-252 との差分を必ず取る)。

## §8d 品質 4 レンズ: LENS-AQ / LENS-TQ / LENS-DQ / LENS-CX (A-182 で新設)

運用系レンズ (CE/DV/GR/DR/DE/GG) が「ハーネスの働き方」を監査するのに対し、この 4 本は**成果物そのものの実質品質**を監査する。判定 4 軸と是正 wave の正本 = `docs/governance/harness-v2-quality-uplift-strategy.md` §1。四半期または大規模リファクタ後に 4 レーン fan-out で回し、A-182 §1 の基線と比較する。

**LENS-AQ (実装アーキテクチャ) — 解釈観点**: 変更が 1 箇所に閉じるか。(1) megafile: >800 行の全数と成長 (2) util 複製: 同名/同機能関数の横断 grep (実例: frontmatter parser 15 実装、walkMarkdown 5 複製) (3) 依存方向: 逆流・cli→内層直 import (4) 様式世代: gate シグネチャの揃い (5) 暗黙 fail-open: `catch {` の意図宣言有無。

```
git ls-files 'src/*.ts' | xargs wc -l | sort -rn | head -15      # megafile
grep -rn "function .*[fF]rontmatter\|function walkMarkdown" src   # 複製
grep -rn "catch {" src --include="*.ts" | wc -l                   # 暗黙 fail-open
grep -rn "as any\|@ts-ignore" src --include="*.ts" | wc -l        # 型安全
```

**LENS-TQ (テスト実質) — 解釈観点**: green の件数でなく捕捉力。(1) oracle 強度 3 分類 (厳密一致 / 存在確認 smoke / 実装ミラー) を 10 本以上精読 (2) mutation 机上試験: gate 判定を反転したら対応テストが red になるか (3) bypass 封じ: 空値・フィールド削除がテストで塞がれているか (4) 実 repo 回帰の本数 (5) oracle_id (`U-*`) 引用率。expect 密度 = expect 数 / it 数 (基線 3.19)。

**LENS-DQ (設計現役性) — 解釈観点**: 「設計 doc が在る」でなく「信じて実装して事故らないか」。(1) 登録簿突合: architecture §3.1 ⊇ src 実在 (module-drift lint green の確認) + L6 設計 doc 不在モジュールの列挙 (2) 鮮度抜き取り: doc 5 本の記述 (件数/stub 宣言/関数名) を現物 Grep 突合 (3) PLAN→設計 doc 参照: 直近 confirmed PLAN の references に docs/design/ が有るか (4) 用語: L0 glossary ↔ src 識別子 10 語突合。

**LENS-CX (CLI/API 契約) — 解釈観点**: 文脈を持たない AI が誤用できるか。(1) 機械可読性: 高頻度コマンドに --json と構造化 exit code が有るか (2) フラグ二義性: 同名フラグの意味揺れを grep 突合 (実例: --plan = path vs ID) (3) exit code 規律: 0/1/2 の意味が help に書かれているか (4) typo 耐性: suggestion 有無 (5) testability: ロジックが return 値で検証可能か。**所見は必ず実走で裏取りする** (A-182 で CX-9 が静的読解のみで誤検出 → 実走で棄却された前例)。

**委譲プロンプト雛形 (4 レンズ共通の骨格)**:

> あなたは UT-TDD Agent Harness の監査員。**read-only、Edit/Write 禁止**。{{並行作業の注意}}。
> 任務: {{レンズ名}} の観点で {{対象}} の実質品質を監査せよ。実測項目: {{上記プローブから選択}}。
> 既存 PLAN 重複判定: docs/plans/ の {{隣接 PLAN 群}} と突合し「既存カバー」と「未起票 gap」を分離せよ。
> 出力 (日本語 markdown): §1 実測表 (測定コマンド付き) §2 所見リスト (ID: {{AQ|TQ|DQ|CX}}-1..、現象/実測根拠/影響/既存カバー判定/是正方向) §3 総合判定と底上げ優先順。最終メッセージがそのまま監査記録になる — 完成形で返せ。

## §8e 運用対称・外部前提 3 レンズ: LENS-PY / LENS-VD / LENS-LM (A-183 で新設)

**LENS-PY (ランタイム対称性) — 解釈観点**: 「Claude で効くものは Codex でも効くか」を hook だけでなく**全資産** (guard/subagent/skill/memory/goal/委譲注入/doc 記載) で仕分けする。判定は 4 値 (both-effective / Claude-only / Codex-only / N-A) × 意図/漏れの 2 値。**意図的非対称は doc の宣言痕跡を必ず探す** (N-A 宣言があるものを漏れと誤判定しない)。新機構を作る PLAN は「最初から両 runtime で設計されているか」を見る。

```
# 強制面の突合
diff <(jq keys .claude/settings.json の hooks) <(jq keys .codex/hooks.json の hooks)
# Claude 専用資産の列挙
ls .claude/agents .claude/agent-memory skills/ && grep -rn "skill\|agent" .codex/
# 委譲注入の対称性 (argv 実読 — metadata 貫通と argv 到達は別)
sed -n '/const args = isCodex/,/];/p' src/runtime/adapter.ts
```

**LENS-VD (ベンダー surface 前提) — 解釈観点**: vendor (Claude Code / codex.exe / bun / GH Actions) の更新で壊れる前提を全数列挙し、防御を 3 値判定 (contract test あり / graceful degradation あり / 無防備)。**定数を定数と突合する自己参照テストは contract test に数えない** (実バイナリ出力との突合のみが防御)。破損時に fail-open へ倒れる経路 (guard の素通り) を最重要とする。実害既往 (service_tier 型) は denylist へ reactive に蓄積する。

```
grep -n "ARGS\|FLAG" src/runtime/adapter-policy.ts   # ハードコード前提の列挙
# 各前提: tests/ が実 CLI/--help を叩くか、定数 import で自己参照かを実読で判定
```

**LENS-LM (教訓機構化率) — 解釈観点**: prose 教訓 (CLAUDE.md 規律 / 戦略 doc はまりどころ / memory) を全数列挙し 4 値判定 (機械強制済み / 部分 / prose のみ / 強制不能=意図的)。**「機械強制済み」は実装ファイルを Grep で確認してから判定** (宣言だけで済まさない — git hooks が非追跡でローカル限定だった実例 = 機械化済み誤認)。優先順は「実害既往回数 × prose のまま」で付ける。変換率 (M/全体) を基線として記録し、次回監査で ratchet する。

```
grep -c "禁止\|しない\|必須" CLAUDE.md .claude/CLAUDE.md   # 教訓候補の粗列挙
git ls-files .githooks .git/hooks; git config core.hooksPath  # 「hook がある」の配布実在確認
git log --oneline | grep -i <教訓語>   # 実害既往回数の実測
```

委譲プロンプト雛形は §8d と同一骨格 (所見 ID = PY-/VD-/LM-)。CLI/実行系の所見は**実走裏取り必須** (A-183 で PY-1 の leak 実例が transient 誤検出 → 裏取りで補正された前例)。

## §9 監査運用プロトコル (fan-out の作法)

1. **レーン設計**: 1 subagent = 1 レンズ。3〜4 レーン並列が標準 (pmo-sonnet、model=sonnet 明示)。レンズを混ぜたプロンプトは焦点が薄まり両方浅くなる。
2. **プロンプト構成**: 雛形の `{{}}` を今回の文脈で埋める。特に (a) 並行作業の不問条件 (b) 既存 PLAN の隣接候補 (重複判定の起点) (c) 精読 minimum 本数、を必ず具体化する。
3. **未完了時の再駆動**: subagent が中間 narration で止まったら「追加調査は最小限、指示した §構成で最終出力を完成させよ。未調査は未確認と明示せよ」と 1 回だけ継続指示する。
4. **裏取り**: 各レーン最低 1 主張をオーケストレータが実ファイル/実データで検証してから採用する。検証で崩れた主張はレポートに「裏取りで棄却」と明記する (silent drop しない)。
5. **統合**: 所見は 1 本の A-18x レポートに統合し、既存カバー判定列を必ず付ける。起票は修正駆動 (Recovery/Add-feature/Refactor) または version-up で routing する。
6. **カタログ自身の更新**: 新しい解釈観点を発見したら本カタログへレンズ追加/観点追記する。監査のたびにカタログが良くなるのが設計意図 (このファイル自体が学習の置き場)。
