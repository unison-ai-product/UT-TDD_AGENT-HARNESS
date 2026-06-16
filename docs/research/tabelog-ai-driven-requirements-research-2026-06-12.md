---
artifact_type: research_memo
status: confirmed
created: 2026-06-12
updated: 2026-06-12
related_design: docs/design/harness/L6-function-design/descent-obligation.md
related_requirements: FR-L1-03
source_url: https://tech-blog.tabelog.com/entry/ai-driven-requirements-definition-process_52
source_checked: 2026-06-12
---

# 食べログ AI 駆動要件定義プロセス — Research Memo

## Scope

本メモは食べログテックブログ記事「AI 駆動要件定義プロセス」(2025 年公開) の調査記録である。
**設計成果物 (①) ではなく参照資料**であり、`docs/design/` でなく `docs/research/` に置く (research.md §6 注記に準拠)。

調査の焦点: UT-TDD Agent Harness の descent-obligation 設計 (落とさない仕組み、FR-L1-03、`docs/design/harness/L6-function-design/descent-obligation.md`) に転用できる設計概念を抽出すること。

本メモの内容を descent-obligation.md / 既存 PLAN / schema に直接反映しない。実反映は別の Forward PLAN として Codex が起票・実装する想定 (次アクション候補: §C 参照)。

---

## Source Check

確認日: 2026-06-12

| 項目 | 内容 |
|---|---|
| 出典 URL | https://tech-blog.tabelog.com/entry/ai-driven-requirements-definition-process_52 |
| 種別 | 技術ブログ (食べログ公式テックブログ) |
| 主な主張 | AI が「フィージビリティレポート」を即時生成し、企画とエンジニアが並列作業できる要件定義フローへ転換した事例 |
| 直接引用の可否 | 公開記事。URL 明記・引用可 |
| 不確実情報 | セルフレビュー4チェックの具体内容は記事に明記なし (要確認) |

---

## 記事サマリ (1st pass)

### 全体像: 直列→並列への転換

従来の直列フロー (企画→エンジニア調査→すり合わせ MTG 複数回) を、AI が「フィージビリティレポート」を約5分で生成することで並列化した。企画 (PdM) とエンジニアが同一成果物を起点に並列作業できる。

### AI ワークフロー: 8ステップ4フェーズ

| フェーズ | ステップ | 内容 |
|---|---|---|
| 準備 | Step 0 | ドメイン知識・観点パターン・過去レポートを読み込み |
| 分析 | Step 1-4 | User Story 分析 → ユースケース洗い出し + データ特定 → 業務ルール策定 → コードベース調査 (相互フィードバック) |
| 評価・出力 | Step 5-6 | フィージビリティ評価 → レポート生成 |
| 品質保証 | Step 7 | セルフレビュー 4チェック × 最大3反復 (具体内容は記事で未明示 = 要確認) |

### 3部構成フィージビリティレポート (読者分離)

| Part | 対象読者 | 内容 |
|---|---|---|
| Part 1: 評価サマリ | 企画・PdM | 実現性 (◎/○/△)・技術リスク・セキュリティリスク・主要判断ポイント・User Story 改善提案 |
| Part 2: ユースケース・業務ルール | エンジニア | UC 一覧 (データ状態バリエーション分解・★印で AI 検出分を明示)・BR 定義 (宣言的記述) |
| Part 3: データ設計 | エンジニア | データエンティティ一覧・状態バリエーション・主要属性・既存データとの関係性 |

### 粒度ルール: データ状態分解

ユースケースを「誰が何をする」でなく「**データエンティティのどの状態のとき何が起きるか**」で分解する。

例 (モーダル表示機能): 「未表示 / 離脱済み / 回答済み / 月跨ぎ」の4状態それぞれを別 UC として立てる。この具体 UC 群を帰納することで「有効な表示期間内 かつ 当月内に回答済みでない かつ 離脱済みでない場合に表示」という業務ルール (BR) が導出される。

### ★印: AI 追加検出の可視化

人間が出した UC/BR と AI が追加で洗い出した UC/BR を ★ で区別する。

実例:
- UC-34 [境界値]: 月末から翌月への時刻跨ぎでの判定正確性 ★
- UC-38 [並行操作]: 複数端末からの同時回答時の整合性 ★
- BR-025: 複数端末同時回答の結果整合性 ★

### トレーサビリティ

`User Story → ユースケース → 業務ルール → データ設計` の逆算可能な鎖。各 UC・データエンティティに「関連 UC」相互リンクを付与。

### 自動化: GitHub Actions + Devin API

PR に `feasibility` ラベル付与 → Devin セッション自動生成。User Story 更新時にラベル再付与 → 再評価モード起動。レポート再生成は数分以内。

### 効果

| 指標 | Before | After |
|---|---|---|
| 初回要件定義 | 約2週間 | 2-3日 |
| たたき台生成 | 数日 (網羅性低) | 約5分 (網羅性高) |
| エンジニア要件確認 | 調査と一体 | 約1-2時間 (確認専念) |
| すり合わせ MTG | 3-4回以上 | 1回30分 |
| 要求変更1件 | 数日-1週間 | 半日以内 |

---

## A. 強く転用できる点 (UT-TDD 設計の柱・現作業への紐付け)

### A-1. データ状態分解の粒度軸 — descent-obligation の trace key 鎖 × 境界値 surface

**転用先**: descent-obligation §4 edge case (E1-E8) の生成ロジック / L3 要件 → L6 機能設計の粒度設計

食べログの「データエンティティの状態バリエーションで UC を分解する」は、UT-TDD の「設計粒度 = 単体テスト設計粒度 (V-pair)」の原則 (`document-system-map.md §0 重要(2)`) と同型の発想である。

- UT-TDD では L6 機能設計 (= 仕様設計 = 関数の pre/post) の粒度が単体テスト oracle (U-DESC-\*) の粒度と 1:1 になる。
- 食べログの状態バリエーション分解 (未表示/離脱済/回答済/月跨ぎ) は「その状態それぞれに独立した oracle が書けるか」の問いと同じ。
- descent-obligation の `generateObligations` が「上流 trace key × 層隣接 adjacency rule から在るべき下流成果物を生成する」ロジックは、この「状態数 = 期待 UC 数 = 期待 oracle 数」の機械生成と方向が一致する。

**具体的適用案**: L3 要件 (FR-\*) の acceptance criteria を「データエンティティの状態バリエーション」で列挙する記述様式を導入すると、`generateObligations` が生成する obligation の completeness を人間がレビューするときの粒度感を揃えられる。特に境界値 (月跨ぎ 23:59→0:00、複数端末同時操作) は descent-obligation §4 の E5 (impl-ahead: src が在るのに L6 test-design が不在) の surface 候補であり、状態分解が edge case の機械的追加を補助する。

**採用条件**: 要追加調査。L3 FR 記述様式への「状態バリエーション列挙」追加は L3 設計 doc の変更を伴う。descent-obligation の adjacency rule 拡張には別 PLAN が必要。

---

### A-2. ★印マーキング — coverage ≠ substance 問題の運用化 (obligation surface / harness.db projection)

**転用先**: descent-obligation §6 の harness.db `descent_obligations` projection / `generateObligations` の出力スキーマ

**根本問題との対応**: `coverage ≠ substance` の原則 ([[feedback_coverage_not_substance]]) は「機械チェック (fr-registry/pair-freeze/status) は ID 登録・link 存在・被覆しか見ず中身を見ない = false-confidence の温床」と定義されている。

食べログの ★ 印は逆向きの操作: **AI が positive に surface した検出分 (人間が宣言しなかった分) を可視化**する。対して descent-obligation の absence-detection は**宣言された被覆に対して下流の不在を fail-close する**。

この対比を整理すると:

| 軸 | 手法 | 何を検出するか |
|---|---|---|
| 食べログ ★ | AI positive surface | 人間が宣言しなかった UC/BR の追加検出 |
| descent-obligation | absence fail-close | 宣言された trace key に対して下流成果物の不在を検出 |

両者は補完関係: ★ が「宣言すべき trace key の漏れ自体」を surface し、descent-obligation が「宣言した trace key の降下不足」を fail-close する。

**具体的適用案**: `descent_obligations` projection の obligation レコードに `origin: "human_declared" | "ai_surfaced"` フィールドを追加する。AI (Codex/pmo agent) が分析フェーズで追加 surface した obligation candidate (★相当) を `ai_surfaced` として記録し、人間レビューで `human_declared` に昇格 or 却下する。これにより「人間宣言 vs AI 検出」の境界を harness.db に永続化でき、substance gate (IMP-079〜083) の材料となる。

**採用条件**: 要追加調査。`origin` フィールドの追加は `descent_obligations` テーブルスキーマ変更を伴う。AI surface の発火条件 (いつ・どの agent が surface するか) の設計が先行必要。

---

### A-3. セルフレビュー×反復 — UT-TDD の cross-agent review への翻案

**転用先**: `.claude/CLAUDE.md` の review gate 方針 / `pmo-tech-docs` / `code-reviewer` agent の役割設計

食べログの品質保証フェーズ (Step 7: セルフレビュー4チェック × 最大3反復) の発想 — 一度生成した成果物を AI 自身が複数回チェックする — は有用である。

ただし UT-TDD には明示ルールがある: **「self-review を gate 通過根拠にしない」** (`.claude/CLAUDE.md` guard rules: cross-agent / 別 model への翻案が必須)。

**翻案**: 食べログのセルフレビューを UT-TDD に転用する場合、`pmo-tech-docs` (このエージェント自身) → `code-reviewer` / `frontier-reviewer` の **cross-agent review パイプライン**として再構成する。セルフレビューを「下書き品質向上のための AI 内部サイクル」と位置付け、最終 gate 通過は別 runtime / 別 model 系統のレビューを必須とする。

反復回数の上限 (×3) の概念は、descent-obligation の Phase 0 → Phase 1 → Phase 2 の段階導入 (§7) と対応する。一度に全 obligation を enforce するのでなく、段階的に厳格化する崩れ防止設計と同型。

**採用条件**: cross-agent pipeline が整備済みであること (現状 standalone mode 中心のため要確認)。

---

### A-4. 読者分離の3部構成 — 人間プレーン / AI プレーンの分離との相性

**転用先**: harness 中央 UI (14画面・src/web Phase B) の進行台帳設計 / PLAN の読者設計

食べログの Part 1 (PdM 向け評価サマリ) / Part 2-3 (エンジニア向け仕様) の分離は、UT-TDD の「工程表=人間向け機能群進行台帳 / PLAN=AI 開発オーケストレーション」の分離 ([[project_roadmap_human_ai_planes]]) と同型。

**具体的適用案**:
- Part 1 相当: 工程表 / 進行台帳 (人間が「ここ担当」を判断する粒度)。中央 UI の Layer Summary 画面に対応。
- Part 2 相当: PLAN (1 PLAN = 1 機能群スプリント。AI が依存→難易度→agent 割当→並列/直列を判断する粒度)。
- Part 3 相当: harness.db projection (データ設計に相当する state layer)。descent_obligations / graph_nodes 等。

**採用条件**: Phase B (src/web) の要件定義フェーズで参照資料として活用できる。直ちに実装変更は不要。

---

## B. そのまま転用しない / 注意点

### B-1. Devin API 直叩き + GitHub Actions トリガーの機構はそのまま使えない

食べログの自動化は `feasibility` ラベル → Devin API → セッション生成という直接配線だが、UT-TDD には明示ルールがある:

> 「Codex / Claude Code は API 直叩きではなく、契約プラン + CLI / hook を UT-TDD Agent Harness が管理する対象として扱う」(CLAUDE.md)
> 「Raw `codex exec` / raw `claude` を通常運用の導線にしない」(.claude/CLAUDE.md)

**翻案が必須**: 食べログの「ラベルトリガー → 再評価」の**発想**は、UT-TDD では `ut-tdd hook post-tool-use` / GitHub Actions の `harness-check` ワークフロー経由で行う。Devin API を直叩きするのでなく `ut-tdd codex --role <role> --task "..."` wrapper を通すのが正規導線。

自動化の**概念** (再評価トリガー・変更時の自動 obligation 再生成) は参照価値があるが、機構はそのままコピーしない。

---

### B-2. スコープ非対称: 記事は要件定義1層、UT-TDD は L0-L14 全 V-model

食べログの記事は `User Story → ユースケース → 業務ルール → データ設計` の1ループに集中している。このスコープでは V-model / obligation ledger / state DB feedback の概念が不要であり、記事に登場しない。

**注意点**: 食べログの「トレーサビリティが取れている」は `User Story ID ↔ UC ID ↔ BR ID` の相互リンク程度を指す。UT-TDD が `descent-obligation` で実現しようとしている「L1 → L3 → L4 → L5 → L6 → L7 の全層貫通トレーサビリティ + 各ホップの不在を fail-close」とは厳格さのスケールが大きく異なる。記事の設計を「UT-TDD のトレーサビリティと同等」と見なさないこと。

---

### B-3. セルフレビューの4チェック内容が記事で未明示

記事では Step 7「セルフレビュー4チェック × 最大3反復」の具体的な4チェック項目が開示されていない (要確認)。チェック内容を推測して UT-TDD の gate 設計に援用することは避ける。記事著者への問い合わせ・続報を待つか、別途 PoC で検証する。

---

### B-4. 食べログのセルフレビューは自己宣言寄り

食べログの品質保証は「AI が自分で作って自分でチェックする」ループである。UT-TDD では self-review を gate 通過根拠にしない (§ A-3 翻案参照)。food-blog 事例の効果測定 (MTG 削減・期間短縮) は「AI+人間」の分業効果であり、cross-agent review なしに同等品質を得られるかどうかは UT-TDD の文脈で別途検証が必要。

---

## C. 次アクション候補 (記録のみ。このメモは PLAN を起票しない)

以下は本 research memo を参照した場合に Codex が Forward PLAN として起票・実装する候補を示す。このメモが起票する対象ではない。

1. **状態バリエーション列挙様式の導入検討 (L3 FR 記述様式)**
   - 調査課題: L3 FR の acceptance criteria に「データエンティティ状態×境界値」の記述軸を追加することで、`generateObligations` が surface する edge case の completeness を向上できるか。
   - 合流先候補: L3 設計 doc (FR フォーマット) の Add-feature PLAN。
   - 先行チェック: descent-obligation の L7 実装 PLAN (PLAN-L7-\* = 要確認) が完了してから検討。

2. **`origin: "human_declared" | "ai_surfaced"` フィールドの harness.db 追加**
   - 調査課題: `descent_obligations` projection に AI surface 分 (★相当) と human 宣言分を区別するフィールドを追加し、substance gate の材料にする。
   - 合流先候補: harness.db スキーマ拡張 PLAN (PLAN-L6/L7 系)。
   - 先行チェック: descent_obligations テーブル設計が確定してから。

3. **再評価トリガー (obligation の動的再生成) の設計検討**
   - 調査課題: User Story 更新→再評価 (食べログの自動化発想) を UT-TDD では `ut-tdd hook post-tool-use` / doctor 再実行でどう実現するか。
   - 合流先候補: hook 設計 PLAN / doctor `checkDescentObligation` の増分更新対応。
   - 先行チェック: descent-obligation L7 実装完了後。

---

## Selection Matrix (転用判断)

| 概念 | 転用判断 | 転用先 | 優先度 | 採用条件 |
|---|---|---|---|---|
| データ状態分解の粒度軸 | 比較候補 | L3 FR 記述様式 / descent-obligation edge case | 中 | L7 実装後に検討 |
| ★印マーキング (AI surface 可視化) | 比較候補 | descent_obligations.origin フィールド | 中 | スキーマ確定後に検討 |
| セルフレビュー×反復 → cross-agent 翻案 | 採用 (翻案要) | cross-agent review pipeline | 低 | cross-agent 整備状況確認後 |
| 3部構成 (読者分離) | 採用 | 工程表/PLAN/harness.db の層分離設計に援用 | 低 | Phase B (src/web) 要件定義時 |
| Devin API 直叩き | 不採用 | — | — | UT-TDD の API 管理ルールと非整合 |
| ラベルトリガー自動化の発想 | 比較候補 (翻案要) | ut-tdd hook / harness-check | 低 | wrapper 整備後 |

---

## Safety / Quality Rules (本メモ適用)

- 本メモの内容を根拠に descent-obligation.md / PLAN / schema を直接変更しない。
- 食べログのセルフレビュー4チェックの具体内容は「要確認」のまま扱い、推測値で設計判断しない。
- Devin API の機構を UT-TDD 導線に混入させない。
- 転用案は「採用」「比較候補」「不採用」のいずれかで明示済み。

---

## 参考リンク

- 出典: https://tech-blog.tabelog.com/entry/ai-driven-requirements-definition-process_52 (食べログテックブログ、確認日 2026-06-12)
- descent-obligation 設計: `docs/design/harness/L6-function-design/descent-obligation.md`
- 層隣接規則 SSoT: `docs/governance/document-system-map.md §1`
- research モード定義: `docs/process/modes/research.md`
- coverage ≠ substance: memory `[[feedback_coverage_not_substance]]`
- 人間/AI プレーン分離: memory `[[project_roadmap_human_ai_planes]]`
