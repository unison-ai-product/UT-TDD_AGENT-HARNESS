# A-186: スキル品質ならびにスキル関連設計＆実装 全監査 — A-180 是正状況の再検証 + 新規所見 (2026-07-09)

- 監査種別: アーキテクチャ監査 (A-172〜A-185 系列の継続)。`/goal` 起点「スキル品質ならびにスキル関連設計＆実装の全監査」。
- 対象: `.ut-tdd/audit/A-180-skill-system-audit-2026-07-02.md` (7 日前の先行監査) の全所見 (S-1〜S-12) の**現在時点での再検証** (live 実走 + 実コード裏取り) と、A-180 未サンプリング範囲の追加調査。
- 方法: orchestrator 直接裏取り (live `skill suggest` 実行、harness.db 直接クエリ、git blame、doctor/plan lint/feedback list 実走) + `pmo-project-explorer` (sonnet) 1 体で A-180 未サンプルの skill 本文 45 本を全文横断チェック。
- 処置: 起票は既存 draft PLAN への追補のみ (新規 PLAN 濫立を避ける、`.claude/CLAUDE.md` PLAN Rules「既存 PLAN を拡張優先」に従う)。実装はしない。

## §0 結論サマリ

**A-180 が 2026-07-02 に指摘した S-1〜S-9 の実装/設計側所見は、S-4 (`technical-writing.md` の `domain_tags`) を除く全項目が本日時点でも未着手のまま実在する。** 対応する修正 PLAN (L7-277/278/279、REVERSE-277/278/279/280) は 5 件とも作成日 2026-07-02 の `status: draft` から一切前進していない。特に S-6 (推奨スコアの平坦化) は本監査でも `skill suggest --plan PLAN-L7-277-skill-recommendation-discrimination` を実走し、**当の「推奨差別化」PLAN 自身に対する推奨が今日も 5/5 件 score=0.85・reason 完全一致・アルファベット順 rank** という同一の不具合を再現した。加えて、この不具合を検出するはずの unit test (`U-SKILL-IDX-006`) は実カタログを代表しない合成データで green になっており、テスト側の実効性にも疑義がある (N-2)。新規に、`skills/review-checklist.yaml` が全 15 層×全 10 駆動モデルの wildcard `applies_to` でカタログ登録されており、機械採点上は常時 0.80 点の「required tier」候補になっている実態を確認した (N-1)。本文品質面は A-180 が未サンプルだった 45 本の横断チェックで新たに 4 系統 (estimation.md の陳腐化した「未実装」注記、`ut-tdd graph`/`ut-tdd metrics` の bare form 誤案内が計 8 ファイルに拡散、1 件の表記揺れ) を確認した。

## §1 A-180 所見の再検証 (2026-07-09、live 裏取り)

| # | 所見 | 状態 | 裏取り |
|---|---|---|---|
| S-1 | `PLAN-L6-37-skill-index-category.md:212-213` の XML 擬似ツール呼び出し残渣 | **未修正** | 該当 2 行を本日実読、`</content>` `</invoke>` が今も存在。`src/lint/*.ts` (80+ 本) を全走査、xml/residue 系 lint は今も無し。PLAN-L7-279-xml-residue-lint / PLAN-REVERSE-279-xml-residue-backfill は共に `status: draft` (未変化)。 |
| S-2 | 設計 doc の canonical root 記述が旧 `docs/skills/` のまま | **未修正** | `ADR-004-internal-asset-ts-control-boundary.md:21`、`PLAN-L4-12-skill-pack.md:52`、`PLAN-L5-06-skill.md:54` を本日実読、いずれも `docs/skills/**/*.md` を層1正本と記述したまま。`docs/skills/` は物理不存在 (Glob 0 件)。PLAN-REVERSE-280-skill-root-doc-sync は `status: draft` (未変化)。 |
| S-3 | `skills/review-checklist.yaml` が `SKILL_MAP.md` の索引から不可視 | **未修正 + 深掘りで悪化方向の追加所見** | `SKILL_MAP.md` に "review-checklist" 文字列 0 件 (grep 確認)。§2 N-1 で機械採点側の実害を新規確認。 |
| S-4 | `technical-writing.md` の `domain_tags` 空値 | **修正済み (トラッキング未更新)** | 本日実読: `domain_tags: [writing, documentation, technical-writing, editing]` — 実値が入っている。しかし修正を追跡するはずの PLAN-REVERSE-280 は今も `status: draft` で、この項目が着手済みである記録が PLAN 側に無い (PLAN 進捗ハイジーンの小さな穴)。 |
| S-5 | `.claude/agents/refactor-scout.md:24` が `docs/skills/refactoring.md` への dead link | **未修正** | 本日実読、24 行目は変化なし。`docs/skills/` 物理不存在を再確認。refactor-scout は `.claude/CLAUDE.md` の agent-guard allowlist に現役登録 (A-177 確定を継承)。 |
| S-6 | 推奨スコアが平坦フィルタで差別化ゼロ | **未修正、本日 live 再現** | `bun run src/cli.ts skill suggest --plan PLAN-L7-277-skill-recommendation-discrimination` を実走 → 5/5 候補が `score=0.85`、`reason` が全候補で完全同一文字列、rank はアルファベット順 (adversarial-review → browser-testing-and-screen-verification → code-review → code-review-and-quality → test-driven-development)。DB 専業の add-impl PLAN に対し browser-testing が rank 2 で出る無関係推奨は A-180 が別 PLAN で観測した現象と同型。`metadataOverlap` de-saturator (`src/skill-engine/recommend.ts:201-223`) は git blame で `4b1c64e7` (2026-06-30、A-180 より前) から存在しており「無い」のではなく「実データに対して弱すぎる」ことを確認 (§2 N-2 でテスト側の理由を特定)。 |
| S-7 | `scoreSkill` (recommend.ts) と `skillScore` (skill-projections.ts) の二重実装乖離 | **未修正** | 本日双方を全文読み比較。base 項 (0.15 vs 0.2)、layer/drive 加点 (0.3/0.3 vs 0.35/0.35)、overlap 処理 (graduated token 重なり vs 単純部分文字列一致)、review keyword 加点 (0.05 vs 0.25) が全て異なる。CLI 手動推奨 (`skill suggest`) と DB 自動投影 (rebuild) で異なるランキングを生む片改修リスクは A-180 指摘のまま。 |
| S-8 | 注入の安全弁 (path 実在再検証・注入予算) が無い | **未修正** | `buildSkillInjectionSet` (recommend.ts:95-140) の `skillAssetPath` (:88-93) は DB 参照のみで `existsSync` 等の実在確認をしない。`skill suggest` の CLI オプション一覧 (src/cli.ts:1585-1594: `--plan`/`--text`/`--record`/`--buckets`/`--inject`/`--json`) に `--limit` 相当は無い (他コマンド `quality-audit`/`branch-audit`/`memory list` には `--limit` があるのと対照的)。 |
| S-9 | 本文品質の検査層が無く scaffold が `TODO` を生成するだけ | **未修正** | `analyzeSkillAssignments` (src/lint/skill-assignment.ts:119-170) は `skill_type`/`layers`/`drive_models`/`category` の形式のみ検査、本文長・見出し構成・`TODO` 残存は検査対象外。`scaffoldSkill` (src/skill-engine/scaffold.ts:121) は生成本文に literal `"- TODO"` を書き込み、それが後で置換されたかを確認する仕組みは無い。 |
| §3b | `security.md`/`incident-runbook.md`/`context-engineering.md`/`harness-observability.md` の本文精度 4 件 | **個別再検証はスコープ外 (未変化と推定)** | PLAN-REVERSE-280 item 5 に是正スコープとして記録済み、`status: draft` のまま。本監査は同じ欠陥パターンが他ファイルへも拡散していることを新規確認 (§3 N-3/N-4)。 |

**PLAN 側の裏付け**: `bun run src/cli.ts doctor` の `plan-reference-freshness` チェックが、まさに S-6/S-7 の修正 PLAN である `PLAN-L7-277-skill-recommendation-discrimination.md` 自身の参照行 `recommend.ts:232`（実際は `:225` — `route_mode` 対応コミット等で数行ズレた）/`skill-projections.ts:27` を `reference_path_missing` として検出している。修正対象コードを指す PLAN の引用が、放置期間中にコード側のドリフトで既にズレている、という「未着手であることの機械的な追加証拠」。

## §2 新規所見 — エンジン (推奨・注入・学習)

### N-1 [high] `skills/review-checklist.yaml` が全層×全駆動 wildcard で自動採点され、常時 0.80 点の required 候補になっている

harness.db を直接クエリし、`automation_assets` 上の実レコードを確認 (`asset_id = "skill:review-checklist"`):

```
applies_layers:       L0,L1,L10,L11,L12,L13,L14,L2,L3,L4,L5,L6,L7,L8,L9   (全 15 層)
applies_drive_models: Add-feature,Discovery,Forward,Incident,Recovery,Refactor,Research,Retrofit,Reverse,Scrum  (全 10 駆動モデル)
trigger / capability: "Single-runtime judgment-gate review evidence. Each item requires pass/fail/n-a and evidence for n-a."
```

`scoreSkill` (recommend.ts:225-247) の式に代入すると、layer 一致 (+0.30) と drive_model 一致 (+0.30) は**任意の PLAN で無条件に成立**し、`skill_type: quality-gate-review` は review キーワード加点 (+0.05) にも一致する。結果、base(0.15) と合わせて**常に最低 0.80 点**が保証される — これは `SKILL_BUCKET_THRESHOLDS.required = 0.8` (recommend.ts:55) の閾値そのものであり、review-checklist は構造的に「どの PLAN でも required tier」の資格を持つ。

A-180 の S-3 は「SKILL_MAP.md という人間向け索引から見えない」ことを指摘したが、本所見はその裏側で「機械向け推奨/注入パイプラインには常時最上位候補として存在し得る」ことを示す。両者を合わせると、review-checklist.yaml は**人間の発見経路からは見えず、自動採点経路では恒常的に高評価という非対称な状態**にある。今回のサンプルでは他候補が偶然 0.85 で上回り top-5 から漏れたが (§1 S-6 の live 実行結果)、S-6/S-7 の差別化修正が入ると、専用 skill が少ない層/駆動 (L2, L9, L12, Retrofit, Incident 等) では review-checklist のような wildcard 資産が対抗馬なしで浮上するリスクが高まる。これは gate チェックリストのデータ SSoT であり「読むべき skill 本文」ではないため、本文注入されると意味を持たない。

**既存 PLAN との関係**: `PLAN-REVERSE-280` item 3 は「索引外扱いの意図確認」のみを扱い、本所見の採点/注入資格側は範囲外。`PLAN-L7-278`(注入安全弁) または `PLAN-L7-277`(スコアリング統合) のどちらかにスコープ追加が必要 — 本監査では `PLAN-L7-277` に追補する (カタログ入力の境界そのものに関わるため)。

### N-2 [medium] de-saturation の regression test オラクルが実カタログを代表しない

`tests/skill-recommend.test.ts:234-274` (`U-SKILL-IDX-006`) は `trigger`/`capability` を "fullstack forward implementation add impl" のように ctx token と強く重なるよう合成した 3 skill で差別化を検証しており、green である。しかし本監査の live 実行 (§1 S-6) は同じ `scoreSkill` 実装に対し**実カタログ 56 件**を渡した結果、5/5 が同点になることを示した。原因は、実際の skill frontmatter (`trigger`/`capability`/`skill_type`/`role`/`category`) のトークン集合と、実際の PLAN context token (`drive`/`kind`/`workflowMode`/`plan_id` 文字列) のトークン集合が、テストの合成データほど強く重ならないため — 現実データでは overlap が 1 トークン一致 (+0.05) 程度にしか伸びず、layer+drive+review キーワードの支配項 (0.15+0.30+0.30+0.05=0.80) の上に乗る薄い差 (+0.05 前後) しか生まれない。**テストは「関数が正しく動く合成入力」を検証しているだけで、「実際の運用データで機能するか」を検証していない** — このプロジェクトの既存教訓 (coverage ≠ 実質) がまさに当てはまる自己言及的な事例。

### 定量観測 (harness.db、本日実測)

- `doctor drive-db-registration`: `skill_recommendations=3320`、`skill_invocations=2510`。A-180 は「実 runtime 発火は全履歴で約 10 件」と確認済み — つまり 2510 件の大半は `auto-projection:review-evidence` 経由の間接推定であり、実利用ではない。
- `quality_signals`: `skill_firing_rate` / `skill_acceptance_rate` が各 3305 件生成されており、生成ロジック (`projectSkillMetrics`, skill-projections.ts:130-178) 上 `inv=0` の大半が `status=warn` になる。これは S-6「学習ループが片道」を数字で裏付ける規模感。

## §3 新規所見 — コンテンツ (A-180 未サンプルの 45 本横断チェック、`pmo-project-explorer` 実施)

A-180 は 56 本中 10 本 (`security.md`/`incident-runbook.md`/`context-engineering.md`/`harness-observability.md`/`technical-writing.md` 他) を全文査読していた。残る全ファイルを本監査で全文横断チェックし、以下を新規確認 (mojibake・personal path・HELIX 残渣・XML 残渣は追加サンプルにもゼロ):

**N-3 [medium, 5 ファイルに拡散] `ut-tdd graph` (bare form) を直接実行可能な PLAN 依存グラフとして誤案内**
- `skills/project-management.md:53,71,80` (`:71` は「`ut-tdd graph` renders the full PLAN dependency graph」と明記)
- `skills/api-and-interface-design.md:71`
- `skills/api.md:69`
- `skills/dependency-map.md:21,50,54,80`
- `skills/reverse-r0.md:47`

実装 (`src/cli.ts:777-829`) では `graph` 単体はデフォルト action を持たず、実サブコマンドは `graph impact --changed <path...>` と `graph export --format <mermaid|dot>` のみ。対象ノード種別も requirement/plan/design/test-design/source/test/db-table/verification-profile/external-tool/diagram (`src/lint/relation-graph-types.ts:1-11`) の汎用グラフであり、「PLAN 専用の依存グラフ」ではない。記載どおりに `ut-tdd graph` を単体実行すると Commander のヘルプ表示になり、説明どおりの出力は得られない。

**N-4 [low-medium, 3 ファイルに拡散、既存 S-12 と同型] `ut-tdd metrics` (bare form) の直接実行可能表記**
- `skills/db.md:40`、`skills/context-memory.md:92`、`skills/code-review-and-quality.md:84` (この 1 件は "if available" と自己ヘッジ済みで軽微)
- 実装 (`src/cli.ts:1510-1530`) では `metrics` 単体にも action が無く、実サブコマンドは `metrics skill` のみ。A-180 が既に `harness-observability.md:45` で同型の欠陥を確認済み (S-12) — 本所見はその同一欠陥パターンの適用範囲が広いことを追加確認したのみで、新規 PLAN は不要。

**N-5 [low, 単発] `skills/deprecation-cutover.md:60` の表記揺れ**
- 「`ut-tdd doctor asset-drift` is green」— `doctor` はサブコマンドを取らず (`src/cli.ts:497-517`)、`asset-drift` は `ut-tdd doctor` 実行内の finding/gate 名 (`src/lint/asset-drift.ts`)。同ファイルの 34/43/71 行目では正しく「`doctor` 内の `asset-drift` finding」と表記されており、60 行目のみの孤立した書き崩れ。

**N-6 [low, 単発] `skills/estimation.md:22-24` の陳腐化した「未実装」注記**
- 「`ut-tdd task classify` や `ut-tdd task estimate` はまだ無く、著者が手動採点する」と記載。実際は `ut-tdd task classify` が実装済み (`src/cli.ts:2500-2586`) で、`size`/`complexity_score`/`difficulty`/`risk_flags` をまさにこの skill が「手動でやれ」と指示している軸そのもので自動算出する。読者が実在するコマンドの代わりに手作業で採点し、ツール出力と不整合な数値を生む可能性がある。

**確認したが誤りなし (再フラグ不要、参考記録)**: `debt-register.md:23`「`ut-tdd debt` コマンドは存在しない」は正しい。`reverse-r4.md:59`「`--invalidate-forward` は未実装の将来 gate 機構」は正しい (`gate <id>` の実オプションに該当なし)。`ut-tdd codex/claude --role ... --task ...` への参照 5 ファイルは実装と一致 (`src/cli/delegation.ts:147-227`)。`ut-tdd handover` (bare) の多数参照は正しい (デフォルト action あり)。

## §4 起票 map (新規 PLAN は作らず、既存 draft PLAN へ追補)

| 追補先 PLAN (既存 draft) | 追補内容 |
|---|---|
| `PLAN-L7-277-skill-recommendation-discrimination` | N-1 (review-checklist wildcard の採点資格境界) + N-2 (de-saturation test オラクルを実カタログ由来の代表データへ差し替える regression 要件) をスコープへ追加。 |
| `PLAN-L7-278-skill-injection-safety` | 既存スコープ (§4 配信様式) は変更不要 — S-8 の再確認のみ、追補なし。 |
| `PLAN-REVERSE-280-skill-root-doc-sync` | S-4 (technical-writing domain_tags) が着手済みである旨を追記 (「未着手 DoD」の該当項目を「着手済み、要検証」へ)。N-3/N-4 (graph/metrics bare form、計 8 ファイル) を item 5 の本文実態同期スコープへ追加。 |

## §5 追補: 優先順位パネル (2026-07-09 同日、PO指示)

PO指示「Fableに相談投げてみて」を実施。`ut-tdd advisor --decision design` (design判断の一次相談先=Fable、`advisor-policy.ts` PO仕様2026-07-08) を実行した結果、**Fable 5 がレート上限に到達**し、設計どおりCodex frontier (gpt-5.5) へ自動fallback。Codexの第二意見: 「REVERSE系(現行runtimeが誤ったスキルを選ぶ・非canonical sourceを正本扱いする欠陥の是正)を新規L7設計より先行すべき」。

続けて `pmo-project-explorer` sonnet×3 による独立3レンズ (current-runtime-harm / structural-foundation-risk / effort-vs-risk-reduction) で、A-186所見(S-1〜S-9、N-1〜N-6 — 3レンズ全てが独立に「N-7は文書に実在しない」と検出、依頼文の数え間違いを検知) と7本のdraft PLAN (L7-277/278/279、REVERSE-277/278/279/280) の1:1マッピング + P0〜P4分類を実施。

**収束**: current-runtime-harm/structural-foundation-riskの2レンズが独立に **`PLAN-L7-277` を最優先** と判定 (Codexの P0基準「現行runtimeが誤ったスキルを選ぶ欠陥」に一致)。effort-vs-risk-reductionレンズのみコード変更ゼロで8所見を一括解消する `PLAN-REVERSE-280` を僅差の首位、`PLAN-L7-279` を次点とした。

**3レンズ全てが独立検出した新規懸念 (該当PLANへ追補済み)**:
- review-checklist.yamlの境界決定が `PLAN-REVERSE-280` item 3 (人間索引からの除外) と `PLAN-L7-277` N-1 (機械採点からの除外) という別々のdraftで無連携に決定され得るリスク。
- S-9 (本文品質lint欠如) は7本のdraft PLANのどれも実装コミットしておらず、`PLAN-L7-277`スコープ項目4の「実装時にTL判断」という保留のみで**孤立所見**のまま。

処置: `PLAN-L7-277`・`PLAN-REVERSE-280` へ相互参照と孤立所見の明示を追記 (2026-07-09)。着手順の最終決定はPO判断。

## §6 裏取り記録

- `bun run src/cli.ts skill suggest --plan PLAN-L7-277-skill-recommendation-discrimination` を本日実行 — 5/5 score=0.85 均一、reason 完全一致、alphabetical rank を確認。
- harness.db 直接クエリ (`automation_assets WHERE asset_id = 'skill:review-checklist'`) — wildcard `applies_layers`/`applies_drive_models` を確認。
- `git blame -L 200,247 src/skill-engine/recommend.ts` — `metadataOverlap`/`scoreSkill` が commit `4b1c64e7` (2026-06-30) 由来、A-180 (2026-07-02) より前から存在することを確認。
- `git log --oneline -- src/runtime/adapter.ts src/runtime/adapter-policy.ts` (since 2026-07-02) — 0 件、bare label 注入形式は無変化。
- `bun run src/cli.ts doctor` — `skill-assignment OK (checked=56)`、`asset-drift OK`、`drive-db-registration` の `skill_recommendations=3320`/`skill_invocations=2510`、`plan-reference-freshness` が `PLAN-L7-277` の参照行ズレを検出、を確認。
- `bun run src/cli.ts plan lint` — 個別 PLAN 差分は報告対象外 (スケジュール整合性チェックのみ) と確認。
- Glob `docs/skills/**` — 0 件、物理不存在を再確認。
- Glob `skills/*.md` — 55 件 (+ yaml 1 件) で A-180 時点と同数、増減なし。
- `pmo-project-explorer` (sonnet) 1 体、A-180 未サンプルの 45 skill 本文を全文横断チェック (§3 の N-3〜N-6 および「誤りなし」確認群の根拠)。
