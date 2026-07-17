---
plan_id: PLAN-L7-255-delegation-model-effort-injection
title: "PLAN-L7-255 (add-impl): 正規委譲経路への model/effort routing 注入 (ROI routing の全経路貫通)"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-16
owner: PM / PO
backprop_decision: not_required
backprop_decision_reason: "正規委譲経路への model/effort 注入は既存要求の実装であり上位要求の変更なし。trace: CLAUDE.md L167(effort 既定 routing)、.ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md F-4/F-6/F-7(policy 実装済・正規委譲経路への配線欠落)"
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 創出=GPT 寄せ / 判断=族分離維持 の routing 原則確認"
  - role: tl
    slot_label: "TL - runtimeCommand への注入設計 (上書き規則含む) レビュー"
  - role: se
    slot_label: "SE - 委譲経路 model/effort 注入 + task route effort 貫通"
generates:
  - artifact_path: docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-255-delegation-injection-backfill.md
    artifact_type: markdown_doc
  - artifact_path: tests/delegation-routing.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-215-model-effort-advisor-routing.md
  requires: []
  references:
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
    - src/cli.ts
    - src/team/model-policy.ts
    - src/task/tier-router.ts
    - src/runtime/adapter.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-255 (add-impl): 正規委譲経路への model/effort routing 注入

## Status

draft 起票 (A-177 F-4/F-6/F-7。PO 指示 2026-07-02「docs/ビジュアルは Claude、実装/テスト/レビューは GPT に寄せると ROI が高い」)。

**部分 slice landed (2026-07-02, draft のまま)**: スコープ 1 の明示フラグ部分のみ先行実装 —
`ut-tdd codex/claude --role` (`runtimeCommand`) に `--model` / `--effort` per-call 上書きを追加し、
adapter plan (`buildAdapterPlan` の既存 intent.model/effort) へ貫通。dry-run plan と CLI surface test
(`tests/cli-surface.test.ts` "injects per-call model/effort overrides") で固定。実走確認:
`ut-tdd codex --role reviewer --model gpt-5.3-codex-spark --execute` で spark lane が governed 経路で
成立 (2026-07-02、route_mode↔kind 台帳の機械照合を spark で実行し legacy=5 / draft=32 /
promoted-ok=yes を得た)。残スコープ (intent 推定による自動注入、task route effort 貫通、routing 原則
doc 明文化、注入監査記録) は未着手のため status は draft を維持 (着手時昇格は完遂 slice で行う)。

## PO返し (2026-07-03 Opus /goal セッション)

**着手前提が未充足**。A-183 追補のとおり codex 分岐の effort argv 非注入 (PY-2) を直すには、**codex CLI が effort フラグ/config を持つかの実機裏取りが先行必須** (実機依存、Opus セッションでは不能)。**unblock 条件: codex 実機で effort 指定手段を確認 → 実装可。**

## 背景 — policy は実装済みだが正規経路が素通り

- intent 7 値 (`inferTaskIntent`) / provider 既定 (`providerForIntent`) / effort 既定 (claude=high, codex=middle, uiux=xhigh, mini・spark=high) は `src/team/model-policy.ts` に実装済み (2026-07-01 追補、U-TEAM-MODEL oracle)。
- しかし効くのは `team run --route` 経路のみ:
  - `ut-tdd codex/claude --role` (`runtimeCommand`, `src/cli.ts:2155-2296`) は **role→model/effort マッピング無し** — provider CLI 既定モデルで起動。
  - `task route --execute` は `routeToAdapterPlan` (`src/task/tier-router.ts:227-243`) が **effort を adapter plan に渡さない**。
- canonical delegation (CLAUDE.md) ほど routing が効かない倒立を解消する。

## 方針境界 (cross-review 不変条件との整理、A-177 F-7)

- ROI 寄せは**創出側 (worker lane) の既定**で取る: docs/uiux→Claude Sonnet、research→Haiku、実装/テスト作成→GPT/Codex worker。
- **判断側 (review/verify) は族分離を維持** (`same_model_approval: forbidden`、U-TIER-008): worker=GPT のとき reviewer=Claude 系、worker=Claude のとき reviewer=GPT frontier。「レビューも全部 GPT」へは寄せない (同族承認 fail-close と矛盾するため)。この原則を routing doc (CLAUDE.md / AGENTS.md 双方、rule-drift 対象節) に明文化する。

## スコープ

1. **runtimeCommand 注入**: `ut-tdd codex/claude --role <role> --task` 実行時に task text+role から intent/difficulty を推定し、tier-router/model-policy の model + effort 既定を adapter plan へ注入。明示フラグ (`--model`/`--effort`) は常に優先。frontier (T0) は既存の explicit gate を維持。
2. **task route effort 貫通**: `routeToAdapterPlan` に effort を渡し spawn 引数へ反映。
3. **routing 原則の doc 明文化**: 創出=ROI 寄せ / 判断=族分離を CLAUDE.md・AGENTS.md の Model/Effort Routing 節へ追記 (adapter rule markers と整合、rule-drift green 維持)。
4. 注入結果 (適用された model/effort と根拠 intent) を session-log / DB へ記録し、後から「どの routing が効いたか」を監査可能にする。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 注入設計 (上書き規則 / frontier gate 整合) TL レビュー | 直列 |
| 2 | runtimeCommand 注入 + task route effort 貫通 実装 | 直列 |
| 3 | routing 原則 doc 追記 (rule-drift 突合) | 2 と並列 |
| 4 | regression test (intent→model/effort 反映 / 明示上書き優先 / T0 block 維持) | 直列 |

## 実装 slice 2 (2026-07-16, Claude / PLAN-L7-255 本体)

**unblock 条件クリア (実機裏取り)**: `codex exec -c model_reasoning_effort=low -` を実機実行し受理を確認
(codex-cli 0.144.1、`~/.codex/config.toml` の実在キー `model_reasoning_effort` への `-c` 上書き)。

- スコープ 1: `src/team/delegation-routing.ts` 新設 — role allowlist fail-close (READ_ONLY roles +
  worker roles + SUBAGENT_ALLOWLIST)、判断ゲート role は `REVIEW_LANE_MODELS` の族内 frontier
  (sol/opus) + effort ladder base へ固定、worker role は `selectTeamModel` へ委譲。`runtimeCommand` へ配線
  (明示 `--model`/`--effort` 優先は不変)。live 確認: `codex --role blind-reviewer` → `-m gpt-5.6-sol
  -c model_reasoning_effort=low`、`--role bogus-role` → BLOCK。
- スコープ 2 + PY-2: `buildAdapterPlan` codex 分岐へ effort argv (`-c model_reasoning_effort=<effort>`) を
  実注入 (middle→medium 正規化)。`routeToAdapterPlan` は effort を既に渡しており argv 側の穴が塞がって貫通。
- スコープ 3: CLAUDE.md「Model / Effort Routing」/ AGENTS.md routing defaults 節へ機械強制の明文を追記。
- スコープ 4 (部分): routing 根拠 (model/effort/source/lane/intent) を plan messages へ監査記録
  (dry-run JSON / execute ログに残る)。**DB (telemetry) 投影は未実施 — 残スコープ**。

## DoD

- [x] `ut-tdd codex --role se` が GPT worker lane の model/effort 付き plan を生成する (U-DELEG-003)
- [x] `task route --execute` の spawn に effort が乗る (codex argv 注入 = U-DELEG-005、claude 既存契約 = U-DELEG-006)
- [x] 判断側の族分離が注入で破られない (review role は族内 frontier へ固定 = U-DELEG-002。worker tier への
      review 流出を遮断。same_model_approval fail-close は review_evidence 側 gate 不変)
- [ ] 注入監査の DB (telemetry/model_runs) 投影 (残スコープ、messages 記録までは実施済み)

## 2026-07-16 クロスレビュー是正 (PR #73 差し戻し対応、非 author runtime = Claude)

PR #73 のクロスレビュー (blind-review 2 レーン FLAG + CI Red) の指摘をレビュー担当側 (Claude) が是正した:

1. **gate subagent role の opus-floor 復旧**: `REVIEW_GATE_ROLES` を READ_ONLY 短縮形 +
   subagent 名形 (`ut-tdd-tl` / `qa-test` / `security-audit`) の合成 Set へ拡張。allowlist 合流で
   許可された subagent 形 role が worker tier (terra) へ落ちる欠陥を遮断 (U-DELEG regression で固定)。
2. **codex `model_reasoning_effort=xhigh` 実機裏取り**: codex-cli 0.144.1 で
   `codex exec -m gpt-5.4-mini -c model_reasoning_effort=xhigh -` の受理・正常応答を確認 (2026-07-16)。
   mini ladder base=`xhigh` の自動生成 argv は実行可能。素通し仕様を維持し、`=low` に加え `=xhigh` を
   裏取り済みとして adapter コメントへ記録。
3. **module 境界是正 (CI Red 根治)**: `delegation-routing.ts` を `src/runtime/` から `src/team/` へ移設。
   runtime→team は禁止方向 (ddd-tdd domain boundary) であり、依存循環 3 件 / coding-rules /
   ddd-tdd real-repo guard 違反はすべてこの逆方向 import が根因だった。移設で U-DEPD-005 / U-CODE /
   U-DDDTDD green を実測確認。
4. **設計判断 (uiux role)**: `uiux` は READ_ONLY_DELEGATION_ROLES 由来で判断ゲート扱い (frontier/opus +
   ladder base effort) とする。CLAUDE.md の「UI デザイン実装 = Sonnet / UI/UX effort xhigh」は
   **実装系 uiux タスク (worker 経路、`selectTeamModel` の uiux intent)** に適用されるものであり、
   `--role uiux` の委譲 = デザイン判断・レビュー相談 (gate 側) は上位 tier 固定が正 (PO 原則 2026-07-08
   「review は orchestrator より下位にしない」)。二読み解消のためここに明記する。
5. 低 severity: `effort_source` の無意味な三項分岐を除去、review 分岐 fallback effort の到達条件
   (明示 --model が ladder 外の場合のみ) をコメント化。

## 2026-07-03 A-183 追補 (PY-2: codex 分岐の effort argv 非注入)

A-183 (LENS-PY) の裏取りで、`buildAdapterPlan` の codex 分岐が effort を **argv に載せていない**ことを確認した (`src/runtime/adapter.ts:334-343` — codex args = `exec` / `-m <model>` / `-` のみ。claude 分岐のみ `--effort` + env)。effort は plan metadata (`effort:` フィールド) までは貫通するが実行へ届かず、AGENTS.md「GPT/Codex effort defaults to middle」が実行時無効 + telemetry の effort 記録が Codex 側で欠落する (片肺測定)。

本 PLAN のスコープに以下を追加する:

- codex CLI の effort 指定手段 (フラグ / config) の**実機裏取りを先行**し、存在すれば codex argv/config へ注入する。
- 存在しなければ「codex effort は CLI から制御不能」を AGENTS.md へ意図的宣言として明記し、telemetry には「uncontrolled」を記録する (無宣言の非対称を残さない)。

## 分類昇格ノート(2026-07-03)

本 PLAN は `kind: impl` + `route_mode: add-feature` の debt として `ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS` に起票されていたが、以下 3 点一致により `kind: add-impl` へ昇格した:

1. **frontier 相談結果**: 「正規委譲経路への routing 注入は既存要求 (CLAUDE.md の routing 規約) の実装であり、上位要求の変更は不要」と確定。
2. **要求 trace**: CLAUDE.md L167 (effort 既定 routing) が上位根拠として既存。A-177 F-4/F-6/F-7 は policy 実装済み・正規委譲経路への配線欠落を所見として記録済み。
3. **ハーネス debt 規則**: `route_mode: add-feature` + `kind: impl` の組み合わせは PLAN-L7-263 lint (route_mode_kind_mismatch) で draft 離脱時に fail-close となるため、着手前昇格必須。

**Reverse pairing**: PLAN-REVERSE-255-delegation-injection-backfill を同時起票。上位要求は既存 trace 済みのため `backprop_decision: not_required` を宣言 (重い設計変更なし)。Reverse は back-fill not_required の確認であり、設計 doc への追記は不要と判断済み。

**debt リスト残留**: 昇格後も `ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS` への残留は別フェーズ (src/plan/lint-policy.ts + debt-audit doc 更新) で解消する (本 PLAN は kind: add-impl のため route_mode_kind_mismatch lint は通過する)。
