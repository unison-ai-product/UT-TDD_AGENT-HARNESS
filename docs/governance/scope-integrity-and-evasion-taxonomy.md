# スコープ不可侵と回避分類の正本 (scope integrity & evasion taxonomy)

- **date**: 2026-07-03
- **出典**: PO 指示 (2026-07-03)「勝手にスコープを下げさせない・矮小化を防ぐ。ルールの穴をついた回避を許容できるもの/できないものに分類し、保守性の高いプロダクト開発 OS の仕組化の穴として資産に残す」。A-181 監査と本リポジトリの実回避事例 (route-mode-kind debt 32 本の慣行化ほか) を素材とする。
- **これは何か**: ①スコープ低下・矮小化が起きる瞬間の全数台帳 ②回避パターンの 許容 (設計された逃し弁) / 非許容 (fail-close 対象) 分類と、各非許容パターン → 防御 gate の対応表 (**対応 gate が無い行 = 仕組化の穴 = 起票対象**) ③駆動モデル workflow への組み込み設計指針。機械強制の実装は PLAN-L7-314 (version-up v2)。
- **保守の作法**: 新しい回避が発見されたら、まず本台帳へ分類を 1 行追加してから対策を起票する (分類なき対策は場当たりになる)。監査レンズ LENS-GG (番人の番人) が本台帳との突合を行う。

## §1 スコープ低下・矮小化が起きる 7 つの瞬間

| # | 瞬間 | 起きること | 現行防御 | 判定 |
|---|---|---|---|---|
| 1 | routing (作業経路の選択) | 作業経路を変えて必要な設計や検証を省く | Issue と設計文書に記録した経路、pair-freeze と review | 規約と review |
| 2 | Issue 起票 | 完了条件を説明だけで済ませる、検証の対を欠く、複数の論点で未決を隠す | 完了条件と検証証拠を記録し、設計 revision と照合する | 規約と review |
| 3 | 実装中 (scope の無宣言変更) | DoD 項目の削除・書き換え、スコープ節の縮小、「非対象」の後付け拡大 | **検出器なし** — git diff でしか見えず、review が見落とせば素通り | **穴 → PLAN-L7-314** |
| 4 | 検証 (部分実行の全体主張) | targeted 実行で full を主張 / 出力を tail で切る / green の再刻印 | green_commands (scope/exit_code/digest) + digest 検査 (L7-132/194、v2 で anchor 化 L7-303)。**scope=full の真偽検証は無い** | 部分 (穴は §2 B6) |
| 5 | レビュー | 縮小済みスコープを承認する、非著者レビューを省く | exact-head の review receipt と必須 CI を照合する | 機械検査と review |
| 6 | 完了宣言 | Issue の完了条件と実体が一致しない | PR の検証結果、対象コミット、必須子 Issue の完了を確認する | CI と review |
| 7 | 繰延 (先送りの偽装) | 「将来やる」と言って台帳に載せない / parked の永久放置 | version-up certificate (機械宣言) + defer ledger。放置検出は v2 (L7-307 aging) | 部分 (v2 で強化) |

**矮小化の定義**: DoD を名目的に満たす最小実装で「完了」を主張すること。防御は二層 — 機械層は「DoD の機械 oracle 必須化」(L7-304/305 + oracle 強度系 L6-29) で名目充足の余地を減らし、実体層は review (cross-runtime) が substance を読む。機械だけでは防げないことを明記する (`coverage ≠ substance` は自動化の限界宣言でもある)。

## §2 回避分類台帳

### §2.1 許容できる回避 (設計された逃し弁 — 条件を欠いた瞬間に非許容へ転落する)

| ID | パターン | 許容条件 (全て必須) |
|---|---|---|
| A1 | enforcement_date cutoff (新規のみ対象、既存を遡及 red にしない) | cutoff 日が policy コードに定数として明記され、テストがある |
| A2 | allowlist / baseline / debt 台帳 (grandfathering) | 正本台帳 doc + 双方向一致 check + 出口条件 + ratchet (縮小のみ許可)。例: FORWARD_CONVERGENCE_LEGACY_DEBT (健全)、ORACLE_TEST_TRACE_BASELINE (健全) |
| A3 | DoD 項目の明示 waiver (免除) | 理由、承認者、期限または再開条件を Issue に記録する。免除が認められる範囲は適用する契約に従う |
| A4 | version-up parking (今やらないが破棄しない) | version_target + route certificate (機械宣言)。landed への付与は禁止 |
| A5 | 検証 defer | defer ledger に登録され open 数が追跡される |
| A6 | gate の意図的 scope 限定 | テスト + 設計 doc に意図の痕跡がある (痕跡なき限定は「漏れ疑い」として LENS-GG が報告) |
| A7 | guard の緊急 override (foreign-edit marker / env) | 非空理由 + 監査ログ (jsonl) + one-shot 消費。実例: 2026-07-03 本セッションの自己作成ファイル誤判定への marker 使用 |

**共通原理**: 許容される回避はすべて「**宣言され、記録され、出口がある**」。silent なものは一つも無い。

### §2.2 許容できない回避 (fail-close 対象) と防御対応表

| ID | パターン | 防御 gate | 状態 |
|---|---|---|---|
| B1 | 作業経路の選択で必須工程を省く | Issue の経路と設計文書、検証証拠の照合 | 規約と review |
| B2 | 免除の記録を消して適用条件を隠す | 正本と証跡、差分の照合 | 規約と review |
| B3 | digest restamp / 監査証跡の機械的再刻印 | 禁止 (監査改ざん)。検出 = digest 検査、恒常化 = L7-303 anchor | 部分 → **v2 L7-303** |
| B4 | **スコープの無宣言縮小** (DoD 削除・スコープ節縮小・非対象の後付け) | **なし** | **穴 → PLAN-L7-314** |
| B5 | 完了主張の prose 化 (cite なき "N green" / "fully covered") | claim discipline (L7-89、real-repo regression test を機械的代替とする) | 塞がれた (規約 + review) |
| B6 | 検証の部分実行で全体を主張 (scope=full の偽装、tail 切り) | green_commands の scope 欄はあるが真偽検証なし | **穴** (部分対応: L7-303 anchor + L7-311 probe。完全な機械検証は test 実行の DB ingest (L7-273) 後に判定可能になる — 対応表の更新条件として記録) |
| B7 | 工程スキップ (review 前 merge、検証前の完了宣言) | exact-head の closing review receipt と必須 CI | merge gate と review |
| B8 | 束の部分実装で全体完了主張 | 親 Issue 固有の完了条件と必須子 Issue の照合 | 規約と review |
| B9 | 履歴書き換え (reset/force で相手成果・証跡を破棄) | 機械防御なし (git は環境側)。運用規約 (hybrid 規律: history 書き換え前の git log/reflog 確認、push 済み破壊禁止) + reflog による事後監査 | **規約のみ** (git hook での機械化は環境依存が強く費用対効果が低い — 意図的に規約層へ置く。判定根拠を残すこと自体が本台帳の役割) |
| B10 | 自動投影を「実発火」と主張 (telemetry 偽装) | provenance 原則 (L7-188/262) + LENS-DE 監査 + probe (L7-311) | 部分 → **v2 L7-311** |
| B11 | 正本 doc の勝手な書き換えによる基準変更 (要件を下げて「充足」にする) | 上流変更は設計改訂と非著者 review を経る。rule-drift が adapter 間乖離を検出。descent 系が下流との整合を検出 | 防御あり (完全ではない — 要件本文の意味的な弱体化は review 依存。LENS-GG の監査対象として明記) |

## §3 駆動モデル workflow への組み込み (強制力の設計指針)

原則: **強制は「工程の入口/出口」に置く** (工程中の自由は保つ — 中間状態まで縛ると開発が止まる)。

1. **起票時 (全 mode 共通)**。対象の設計 revision、依存、完了条件と検証方法を Issue に記録する。
2. **pair-freeze 時**: スコープ節 + DoD が freeze 対象に入る (L7-314 の scope digest 起点)。freeze 後の縮小は宣言必須。
3. **mode exit 時**: 各駆動モデルの exit contract (L7-240/241/242 系) に scope-integrity 照合を追加 — 「exit 時の DoD/スコープが freeze 時と一致、または宣言済み変更のみ」。exit contract の未強制 mode が残っている間 (A-173 F-6/F-7) は L7-242 の消化が先行依存。
4. **完了時**。Issue の条件と CI、検証コマンド、review の対象 head を照合する。
5. **設計・テスト設計 doc への組み込み**: sub-doc 標準 §構造 (L7-100/245) に「スコープ変更履歴」欄を追加し、設計側のスコープ縮小も同じ宣言規律に乗せる (実装は L7-314 スコープ外の将来項 — 本台帳に記録して起票判断は PO)。

## §4 仕組化の穴 (現時点の残存、優先順)

1. **B4 スコープ無宣言縮小 — 検出器なし** → PLAN-L7-314 (scope digest + 変更宣言 + waiver 機構)
2. **B6 検証 scope 偽装 — 真偽検証なし** → 前提 (L7-273 test ingest) 後に「green_commands scope=full ↔ test_results 実測の突合 check」を起票 (本台帳が起票条件を管理)
3. **§1-2 矮小化の機械限界** — oracle 強度は上げられるが substance は review 依存。cross-runtime review の質を保つ運用 (frontier gate) を崩さないこと
4. **B9 履歴書き換え — 規約層** — 意図的判断 (上記)。四半期監査 (LENS-GG) で reflog 抜き取りを行う
5. **A3 waiver 機構の不在** — 現状「DoD を消す」以外に免除手段が無いことが、かえって B4 を誘発している (逃し弁の不在は違反を生む)。L7-314 で waiver を設計するのはこのため
