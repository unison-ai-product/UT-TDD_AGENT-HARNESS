# A-177: オーケストレーション層監査 (subagent / harness コマンド群 / model routing) — 2026-07-02

- 監査種別: アーキテクチャ監査 (A-172〜A-176 系列の続き、A-175 registry 領域 #対象: オーケストレーション)
- 依頼: PO 2026-07-02「サブエージェントや HARNESS コマンド群とオーケストラレーション層の見直し。Sonnet 5 がオーケストレーションしても抜け漏れなく Opus 同等レベルに作業できるよう Codex の補助や Opus アドバイザーの発火条件を整備。ドキュメント/ビジュアル系は Claude、実装/テスト/レビュー系は GPT に寄せると ROI が高い」
- 方法: 並列調査 2 系統 (subagent/team 定義棚卸し + CLI/routing 実装調査、いずれも pmo-project-explorer sonnet) → load-bearing 主張を orchestrator 自身が grep/read で裏取り。基準点 = HEAD (hybrid のため foreign tree transient は計測から除外)。
- 処置: 起票のみ (実装しない、PO /goal 2026-07-02 準拠)。

## §0 結論サマリ

**PO 提案の ROI routing (docs→Claude / research→Haiku / 実装→GPT / effort 既定) は policy 層に実装済みだが、それが効くのは `team run --route` / `task route` 経路だけで、正規委譲経路 (`ut-tdd codex/claude --role`) と advisor 発火・判断ゲートには届いていない。** 「Sonnet オーケストレーターの Opus 同等化」に必要な 3 部品 — ①自分の model を知る手段、②advisor の機械発火条件、③判断ゲートでの reviewer tier 強制 — は 3 つとも未実装 (prose 規約のみ)。

## §1 所見 (F-1〜F-9)

### F-1: orchestrator model 自己認識が存在しない (advisor 発火の前提欠落)

- `src/runtime/detect.ts` は `CLAUDECODE=1` / `CODEX_*` env で **provider (claude/codex) までしか検出しない**。model 名 (sonnet/opus) を知る経路が無い。
- `ut-tdd advisor --current-model` は人間の手動入力。`isLowerThanAdvisor()` (`src/team/advisor-policy.ts:55-73`) はその値を比較するだけで、判定結果はフラグ surface のみ (実行制御に未使用)。
- SessionStart hook 入力にも model フィールド無し。session JSONL→`telemetry scan` は事後分析であり実行中の自己認識ではない。
- 帰結: 「orchestrator が Sonnet 以下なら advisor を使え」(CLAUDE.md Model/Effort Routing) は**機械的に発火できない**。

### F-2: advisor の自動発火経路がゼロ (CLI 手動 1 経路のみ)

- `buildAdvisorDecision` の呼び出し元は `src/cli.ts:2102` (advisor コマンド) の 1 箇所のみ (grep 裏取り済)。hook / gate / lint / doctor からの連動配線なし。
- advisor 自体は deterministic policy として完成している (Claude→`claude-opus-4-8`+high / Codex→`gpt-5.5`+xhigh、dry-run 既定、`--execute` で spawn、`MODEL_IDS` SSoT 参照)。**足りないのはエンジンでなく発火条件**。

### F-3: 判断ゲート (JUDGMENT_GATES) × reviewer tier マトリクスが未強制

- `JUDGMENT_GATES = ["G0.5","G2","G4","G5","G6","G7","R4"]` (`src/gate/review-tier-policy.ts:1`) は存在するが、`src/gate/` に frontier 文字列は 0 件 (grep 裏取り済)。
- gate の review-tier 検証は cross-agent model pair の**異族性のみ** (same_model / same_provider / unknown / missing → fail)。「この gate は T0 (frontier) reviewer が必須」という tier 強制は無い。
- frontier gate の機械実装は tier-router (`T0 は auth.explicit 必須、fail-close`) と team run (`--allow-frontier` 無しで member block) に存在するが、**gate コマンド側に届いていない** = 判断ゲートを Sonnet reviewer だけで通過できる。

### F-4: 正規委譲経路 (`ut-tdd codex` / `ut-tdd claude`) に role→model/effort 注入が無い

- `runtimeCommand` (`src/cli.ts:2155-2296`) は `--role` を受けるが **role→model マッピングを持たない**。直接呼ぶと provider CLI の既定モデルで起動する (harness 側の model/effort 指定なし)。
- `ut-tdd task route --execute` も `routeToAdapterPlan` (`src/task/tier-router.ts:227-243`) が **effort を adapter plan に渡していない**。effort 既定 (claude=high / codex=middle / uiux=xhigh / mini,spark=high) が効くのは `team run` の `selectTeamModel` 経路のみ。
- 帰結: CLAUDE.md の canonical delegation (`ut-tdd codex --role <role> --task`) を使うほど routing policy が素通りされる、という倒立。

### F-5: model ID の SSoT drift (agent frontmatter / setup template / doc allowlist)

- `src/team/model-policy.ts:15` SSoT = `claude-opus-4-8`。しかし `.claude/agents/pdm-{tech,marketing}-innovation.md:5` / `pdm-innovation-manager.md:5` は `claude-opus-4-7`、`src/setup/templates.ts:35,40,45` も opus-4-7 (裏取り済)。
- haiku は frontmatter `claude-haiku-4-5-20251001` vs SSoT `claude-haiku-4-5` (family 一致で guard は通るが ID 非同一)。
- `.claude/CLAUDE.md` の Subagent Guard allowlist 列挙 (14 件) はコード正本 `src/runtime/agent-guard-policy.ts:2-22` (19 件) に対し **be-api / be-logic / db-schema / devops-deploy / refactor-scout の 5 件が記載漏れ** (突合済)。rule-drift gate は marker 節のみ検査で allowlist は対象外。
- MODEL_IDS の oracle (U-MODELID-001..004) は tier-router↔model-policy の合成一致しか見ておらず、**frontmatter / template / doc は drift 検査の外**。

### F-6: `.claude/agents` は全 18 体 Claude 系 — 実装系 subagent の Claude/GPT 二重構成

- be-api / be-logic / db-schema / devops-deploy (実装系) が `claude-sonnet-4-6` で定義されており、CLAUDE.md「実装は GPT/Codex-class 既定」と併存する二重構成。GPT/Codex 系は `.claude/agents/` に現れず、`TIER_TABLE` / team yaml `engine: codex-se` のみ。
- これは Claude Code の subagent 機構が Claude 系しか spawn できない構造上の制約でもある。GPT へ寄せる経路は harness 委譲 (F-4) を通すしかなく、**F-4 が未整備なため「実装は GPT」への誘導が実質 team run 限定**になっている。

### F-7: PO 提案「テスト/レビューも GPT へ」と cross-review 不変条件の緊張

- concept §2.1.2.1 核心ルール 2 (`same_model_approval: forbidden`) の機械着地 (cross-review-enforcement) は worker≠reviewer の **model 族相異**を要求する。tier-router も hybrid で execution≠judgement (一致なら throw、U-TIER-008)。
- よって「実装も GPT・レビューも GPT」に全部寄せると同族承認で fail-close する。成立する形は: **worker lane の既定を GPT に寄せ (ROI)、判断側はクロス配置を維持** (worker=GPT のとき reviewer=Claude 系、worker=Claude のとき reviewer=GPT frontier)。ROI 最適化は「創出側の既定」で取り、「判断側の族分離」は崩さない — この整理を routing doc に明文化する必要あり。

### F-8: team 定義が example 1 件のみ / orchestration_mode cell 配置は defer のまま

- `.ut-tdd/teams/` は `example-review-team.yaml` のみ (se=codex-se → tl=pmo-sonnet → qa=qa-test 直列)。docs/impl/review の標準 preset が無い。
- drive×layer の orchestration_mode cell → 具体 roster (どの subagent / Codex role を実際に招集するか) の割当は **PO 指示 (2026-06-05「サブエージェントの配置とかは後で」) で defer 継続** (cross-review-enforcement scope OUT、function §3.7)。今回の PO 依頼はこの defer の解除判断に相当する。

### F-9: PLAN 番号の並行採番衝突 (運用所見)

- hybrid 並行起票により `PLAN-L7-250-layer-question-catalog` (Claude) と `PLAN-L7-250-doctor-dependency-regression-extraction` (Codex) が併存。plan_id 全体としては unique で lint green だが、**数値 prefix の一意性は無検査**で参照時の取り違えリスク。

## §2 PO 提案との突合 — 何が既にあり、何が無いか

| PO 提案 | 実装済 | 欠落 |
|---|---|---|
| docs/visual→Claude, research→Haiku, 実装→GPT | `inferTaskIntent` 7 値 + `providerForIntent` + `TIER_TABLE` (2026-07-01 追補、U-TEAM-MODEL oracle 付き) | 正規委譲経路への配線 (F-4)。intent policy が効くのは team run のみ |
| effort 既定 (Claude=high / GPT=middle / UIUX=xhigh) | `policyEffort` で機械化済 | `task route` 経路の effort 欠落 (F-4) |
| Opus アドバイザー発火条件の整備 | advisor エンジン (dry-run/execute、上位 model 指名) | 発火条件ゼロ + 自己認識ゼロ (F-1/F-2) |
| Sonnet orchestrator の Opus 同等化 (抜け漏れ防止) | 機械 gate 群 (doctor/plan lint/JUDGMENT_GATES 枠) | 判断ゲートの reviewer tier 強制 (F-3)、Codex クロスチェックの定点化 (F-8 preset 不在) |
| Codex の補助 | tier-router クロス配置 (worker=創出/consult・verify=判断)、cross-review-enforcement | 同上 + F-7 の族分離明文化 |

## §3 起票 map (すべて draft、着手は PO 判断)

| PLAN | 対応所見 | 骨子 |
|---|---|---|
| PLAN-L7-253-orchestrator-model-identity-advisor-triggers | F-1, F-2 | orchestrator model 自己申告チャネル (session start 記録 + env/state) + advisor 機械発火条件 (判断ゲート進入 / risk 分類 / 反復失敗 / 完了主張) の deterministic 評価と surface。実行は人間 explicit のまま |
| PLAN-L7-254-judgment-gate-reviewer-tier-matrix | F-3 | JUDGMENT_GATES × 要求 reviewer tier の宣言マトリクス + gate 側 fail-close (frontier reviewer or 代替 evidence)。warn-first phased |
| PLAN-L7-255-delegation-model-effort-injection | F-4, F-6, F-7 | `ut-tdd codex/claude` への tier/model/effort 既定注入 + `task route` effort 貫通 + 「創出=GPT 寄せ / 判断=族分離維持」の routing 明文化 |
| PLAN-L7-256-model-id-ssot-drift-gate | F-5, F-9 | MODEL_IDS↔frontmatter↔template↔doc allowlist の drift lint (fail-close) + 現 drift の是正 + PLAN 数値 prefix 一意性 lint |
| PLAN-L7-257-orchestration-cell-roster | F-8 | orchestration_mode cell→roster 割当 + 標準 team preset (docs/impl/review)。**2026-06-05 defer の解除は PO 承認が前提** |

## §4 裏取り記録

- allowlist 5 件漏れ: `.claude/CLAUDE.md` 本文と `src/runtime/agent-guard-policy.ts` を直接突合。
- opus 世代ずれ: `.claude/agents/pdm-*.md:5` grep で 3 件確定、`src/team/model-policy.ts:15` = opus-4-8。
- advisor 発火: `buildAdvisorDecision` 呼び出し元 grep → `src/cli.ts:2102` のみ。
- gate frontier 不在: `src/gate/` に frontier 文字列 0 件。
- detect.ts model 不検出: model 出現は prose 文字列 2 件のみ。
- subagent 調査 2 体は途中停止→SendMessage 再開で最終レポート回収 (narration を成果と見なさない規律適用)。
