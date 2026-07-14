---
plan_id: PLAN-L7-430-task-kind-model-routing-v2
title: "PLAN-L7-430 (retrofit): task-kind ベース model routing v2 — Luna 採用 / advisor 行列改定 (PO 2026-07-14)"
kind: retrofit
layer: L7
drive: agent
status: draft
route_signal: dependency_outdated
route_mode: retrofit
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-415 (confirmed) の routing を PO 指示 2026-07-14 で task-kind ベースへ改定する実装 slice。Model/Effort Routing 原則の上位要求は維持し、lane 割当と advisor 行列のみ更新する。"
created: 2026-07-14
updated: 2026-07-14
owner: PM (Claude Fable orchestrator) / cross-review = Codex lane
parent_design: docs/design/harness/L6-function-design/function-spec.md
agent_slots:
  - role: tl
    slot_label: "TL (別 runtime) — routing 行列と effort 上書きのクロスレビュー"
  - role: se
    slot_label: "SE — MODEL_IDS / intent 推論 / tier roster / advisor 行列 / pricing 更新"
generates:
  - artifact_path: docs/plans/PLAN-L7-430-task-kind-model-routing-v2.md
    artifact_type: markdown_doc
  - artifact_path: src/team/model-policy.ts
    artifact_type: source_module
  - artifact_path: src/team/advisor-policy.ts
    artifact_type: source_module
  - artifact_path: src/task/tier-router-policy.ts
    artifact_type: source_module
  - artifact_path: src/state-db/token-tracker.ts
    artifact_type: source_module
  - artifact_path: tests/team-model-policy.test.ts
    artifact_type: test_code
  - artifact_path: tests/tier-router.test.ts
    artifact_type: test_code
  - artifact_path: tests/token-tracker.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-415-gpt56-tier-routing-adoption.md
  requires:
    - PLAN-L7-415-gpt56-tier-routing-adoption
  references:
    - docs/plans/PLAN-DISCOVERY-10-gpt56-tier-routing-bench.md
    - src/team/model-policy.ts
    - src/team/advisor-policy.ts
    - src/task/tier-router-policy.ts
    - .ut-tdd/memory/project-fable-5-7-13-rate-limit.md
    - .ut-tdd/memory/feedback-gpt-5-6-effort-crossover-tendency-h4.md
review_evidence: []
---

# PLAN-L7-430 (retrofit): task-kind ベース model routing v2

## 背景 / PO 決定 (2026-07-14 チャット)

PLAN-DISCOVERY-10 S4 では H3 (gpt-5.6-luna) を「T2 軽量 lane としては現職同等・有意差なし」
として保留した。PO は 2026-07-14 に routing を **tier ベースから task-kind ベース**へ再定義し、
Luna を「実装 / ドキュメント修正の主力」として採用した (保留判断の supersede は PO 明示指示。
なお H3 が測ったのは T2 軽量 lane としての適性であり、本採用は T1 実装帯としての配置なので
ベンチ結論とは矛盾しない。T1 適性の実測は運用データで継続検証する)。

### 確定割当

| provider | task-kind | model | effort |
|---|---|---|---|
| Codex | テスト実装 | gpt-5.6-terra | middle (worker 既定) |
| Codex | 実装 / ドキュメント修正 | **gpt-5.6-luna (新規)** | **high (PO 2026-07-14、worker middle 既定の上書き)** |
| Codex | 検証 / 設計 | gpt-5.6-sol | high〜xhigh (review=xhigh 維持) |
| Codex | 軽量実装 / 内部探索 / web 検索 / doc パッチ | gpt-5.3-codex-spark / gpt-5.4-mini | middle |
| Claude | フロントデザイン / 設計ドキュメント作成 | claude-opus-4-8 | high (uiux 文脈は xhigh) |
| Claude | UI デザイン実装 / ドキュメント修正 | claude-sonnet-5 | high (uiux=xhigh 維持) |
| Claude | web 検索 / doc パッチ | claude-haiku-4-5 | high (Claude 既定) |

### advisor 行列改定

| 判断種別 | 一次 | fallback |
|---|---|---|
| 技術 / 設計 / トラブルシューティング | gpt-5.6-sol | Fable (claude-only 時は Fable 一次) |
| デザイン / UI | claude-fable-5 | gpt-5.6-sol (次点、PO 明示) |

旧行列 (design→Fable 一次) を supersede。根拠: Fable レート制限
([[project-fable-5-7-13-rate-limit]]) と Sol の escalation 席実測。

### 追補: オーケストラパターン分岐 / レビュー 3 面 / プランエージェント (PO 2026-07-14 同日追加)

- **標準パターンの想定 orchestrator モデル**: Claude Code = 設計タスク時 Opus / 設計タスク
  完了時 Sonnet、Codex = 設計タスク時 Sol / 実装タスク時 Terra。想定を下回るモデル選定で
  走る場合は **advisor 機能を多用する** (`advisorHeavyUseRecommended`、未知モデルは advisor
  推奨側へ倒す)。worker lane 割当 (テスト実装=terra / 実装=luna) とは別軸。
- **レビュー 3 面**: 設計レビュー / 実装レビュー / ブラインドレビューを置く
  (`REVIEW_LANES` / `REVIEW_LANE_MODELS`、floor = Sol / Opus、hybrid では非作成側 provider)。
- **プランエージェント**: 一次 = Fable、Fable 不在時は Sol へフォールバック
  (`PLAN_AGENT_MODELS`)。

### 追補 2: モデル別 effort 基準ラダー (PO 2026-07-14 同日追加)

| model | 基準 | 浅い時 | なお浅い時 |
|---|---|---|---|
| Sol / Terra / Fable | low | middle | Terra のみ Sol low へ乗り換え |
| Sonnet | middle | high | — |
| Opus | high | xhigh | — |
| Luna / spark | high | — | — |
| mini | xhigh | — | — |

下位帯ほど高 effort の逆傾斜 (能力を effort で補う)。H4 ベンチ実測
([[feedback-gpt-5-6-effort-crossover-tendency-h4]]: Sol low ≈ Terra high) と整合。
`MODEL_EFFORT_LADDER` / `escalateShallowResponse` として SSoT 化し、`policyEffort` の
既定を置換 (UI/UX xhigh は task-kind 例外として維持)。「浅い」の判定は orchestrator /
呼び出し側の運用判断で、ladder は次段の正本のみ提供する。

### 追補 3: モデル入替の判定基準 (PO 2026-07-14)

- モデルの入れ替え (roster 変更) は **使用トークン量 × モデル単価 × 回答品質** の 3 軸で
  判定する。感覚や新モデルの話題性では入れ替えない。
- 品質検証のタイミングは、**問題調査時の複数モデル平行検証** (同一問題を複数モデルに
  同時投入) に相乗りさせ、**クリティカルな要因を見つけた数**で勝負させる (recall 偏重や
  ノイズ撒きを避けるため、単なる指摘数ではなく致命要因の発見数)。
- 器は既存の token-tracker (`workflow_runs` トークン実測 + `OPENAI_PRICING` /
  `CLAUDE_PRICING` 単価) と `model_evaluations` projection。PLAN-DISCOVERY-10 の
  lane 別ベンチ手法 (W1-W5 oracle) を再利用する。

## 実装範囲

1. `MODEL_IDS.codex.luna = "gpt-5.6-luna"` 追加。
2. `TASK_INTENTS` に `test` / `design` を追加し `inferTaskIntent` を拡張。
3. `modelForProvider` を intent-aware 化 (上表の割当)。
4. `policyEffort`: luna→high 上書き (PO 2026-07-14)。
5. `TIER_TABLE.T1.codex` / `PROPOSAL_SUBAGENT_LANES.T1-worker` → luna (実装帯)。terra はテスト実装席として roster に残す。
6. `OPENAI_PRICING` に luna 公式単価 ($1 / cached $0.1 / $6 per 1M、2026-07-09 GA) を追加。
7. `CLAUDE.md` / `AGENTS.md` の Model / Effort Routing 節を同一内容で更新 (adapter parity)。
8. tests: team-model-policy / tier-router / token-tracker ほか影響テストの期待値更新 + 新割当の正例・effort 上書きの回帰を追加。

## AC

- [ ] 上表の全割当が `selectTeamModel` / `resolveModel` / `buildAdvisorDecision` の単体テストで固定されている (機械 oracle、prose 主張なし)。
- [ ] luna effort=high 上書きと worker middle 既定の共存がテストで固定されている。
- [ ] advisor: uiux 判断が Fable 一次 + Sol fallback、design/implementation/troubleshooting が Sol 一次であることがテストで固定されている。
- [ ] typecheck / 影響テスト / plan lint green。CLAUDE.md ↔ AGENTS.md の routing 記述が一致。
