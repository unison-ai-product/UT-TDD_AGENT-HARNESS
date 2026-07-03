---
plan_id: PLAN-L7-253-orchestrator-model-identity-advisor-triggers
title: "PLAN-L7-253 (impl): orchestrator model 自己認識 + advisor 機械発火条件 (Claude/Codex 両 orchestrator 対称)"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - advisor 発火条件セット (どの局面で相談推奨を出すか) の承認"
  - role: tl
    slot_label: "TL - 自己申告チャネル設計 (env/state/DB) と発火条件の deterministic 評価レビュー"
  - role: se
    slot_label: "SE - model identity 記録 + trigger 評価 + surface 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-253-orchestrator-model-identity-advisor-triggers.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
    - src/team/advisor-policy.ts
    - src/runtime/detect.ts
    - src/cli.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
---

# PLAN-L7-253 (impl): orchestrator model 自己認識 + advisor 機械発火条件

## Status

draft 起票 (A-177 F-1/F-2。PO 指示 2026-07-02「Opus アドバイザーの発火条件などの整備でコストを抑えて Sonnet オーケストレーションを Opus 同等に」)。

**2026-07-03 PO 決定 (未決分岐クローズ)**: ①発火条件セットをスコープ 2 の T1〜T5 で承認 ②**GPT/Codex orchestrator にも同じ仕組みを対称展開する** (PO 指示「あとは GPT にも同じ仕組みを」) — 本 PLAN は Claude 専用でなく両 orchestrator 共通機構として実装する。実装着手の wave 判断は従来どおり PO。

## PO返し (2026-07-03 Opus /goal セッション)

**部分 landed = spec 確定済み・実装は Codex 沈静後**。発火条件 T1〜T7 は PO 承認済み (f554392 で未決分岐クローズ)。実装は code+tests を要し、Codex が src/doctor/state-db/tests を活発に未コミットで触る間は full test green が達成不能。src/runtime の新規モジュール (model 自己認識 + trigger 評価) は cli.ts 非依存で先行可能だが、full 検証は Codex 沈静を待つ。**unblock 条件: Codex の in-flight コミット完了 → full test green 可能に。**

## 背景

- advisor エンジン (`src/team/advisor-policy.ts`) は完成済み (Claude→opus+high / Codex→gpt-5.5+xhigh、dry-run 既定、MODEL_IDS SSoT)。**発火が CLI 手動 1 経路のみ** (`buildAdvisorDecision` 呼び出し元は `src/cli.ts:2102` だけ、grep 裏取り済)。
- `src/runtime/detect.ts` は provider (claude/codex) までしか検出せず **orchestrator の model 名を知る手段が無い**。「Sonnet 以下なら advisor を使え」規約 (CLAUDE.md) は機械発火できない prose のまま。

## スコープ

1. **model 自己申告チャネル**: orchestrator model を `UT_TDD_ORCHESTRATOR_MODEL` (env) / session start hook 引数 / `.ut-tdd/state/` のいずれかで受け、runtime state + harness.db (session 系) へ記録。未申告は `unknown` として扱い、unknown は「下位扱い」で fail-safe (上位と僭称できない)。
2. **advisor 発火条件の deterministic 評価** — **発火条件セット確定 (PO 承認 2026-07-03)**:

   | ID | 条件 | 評価点 (deterministic) |
   |---|---|---|
   | T1 | 判断ゲート到達 (confirmed への flip / スコープ変更 / supersedes 判断) で orchestrator が opus/frontier 族未満 | JUDGMENT_GATES 進入 × model identity |
   | T2 | `task classify` が escalation-sensitive risk flag (auth/payments/PII/migration/production) or hard difficulty を返した | classify 出力 |
   | T3 | 未決分岐 (TL/PO slot) が本文に残る PLAN への着手 | plan lint の pending-decision 検出 (L7-304 と接続) |
   | T4 | 検証矛盾に遭遇 (テスト red と claim green の併存 / digest 不一致 / doctor red の反復) | gate/lint 出力 |
   | T5 | C 級設計 doc しか無い実装への着手 | design-ir grade (L7-353 と接続。gate 未活性の間は skip) |

   補助条件 (原案 (c)/(d) から維持、閾値は TL レビュー): T6 同一 gate/lint の反復失敗 (N=3 目安)、T7 完了主張の review evidence 不足。
3. **surface と記録**: 推奨は `status` / gate 出力 / SessionStart surface に載せ、advisor 実行 (dry-run/execute) の実績を DB へ記録 (advisor_consults 系)。**自動実行はしない** (発火=推奨 surface まで、execute は人間/明示)。PLAN-L7-254 (gate 側 tier 強制) の代替 evidence 源として接続。
4. `isLowerThanAdvisor` を自己申告値で自動評価し `--current-model` 手動入力を既定不要化 (手動上書きは残す)。
5. **両 orchestrator 対称 (PO 指示 2026-07-03、A-183 LENS-PY 原則「新機構は最初から両 runtime で設計」)**:
   - 自己申告チャネル・trigger 評価・surface は **runtime 中立の実装** (CLI / `.ut-tdd/state/` / harness.db 経由) とし、Claude hook 専用経路に置かない。SessionStart surface は両 runtime とも `cli.ts session start` 配線済み (L7-139) のため自動的に対称になる。
   - 相談先は advisor-policy 既存のとおり対称: Claude 系 orchestrator → opus (high)、**GPT/Codex 系 orchestrator → gpt-5.5 (xhigh)**。unknown 申告は下位扱い (fail-safe) を両 runtime 共通に。
   - AGENTS.md へ発火条件表 (T1〜T7) を CLAUDE.md 側と同文で転記し、rule-drift marker 対象へ含めるかは TL 判断 (doc 非対称 = A-183 PY-5 型を作らない)。
   - Codex 相談経路の可用性は A-183 VD-3 (config 非互換の既往) に留意 — 実装時に codex provider の実走 smoke を DoD へ含める。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 自己申告チャネル設計 (TL) + 発火条件セット確定 (PO) | 直列 |
| 2 | model identity 記録 (state+DB) 実装 | 直列 |
| 3 | trigger 評価 + surface + advisor 実績記録 | 直列 |
| 4 | regression test (unknown=下位 fail-safe / 発火条件が観測に追従 / 自動実行しない) | 直列 |

## DoD

- [ ] orchestrator model が記録され `status --json` で読める (test 固定)
- [ ] Sonnet 申告 + JUDGMENT_GATE 進入 (T1) で advisor 推奨が surface される (test 固定)
- [ ] 推奨は surface のみで自動 execute しない (test 固定)
- [ ] T1〜T5 の各条件に発火/非発火の fixture test が対で存在する
- [ ] **GPT/Codex 系申告でも同一 trigger が発火し、相談先が gpt-5.5 になる** (test 固定 — 対称性の機械証明)
- [ ] codex provider の実走 smoke (dry-run で可) が evidence に記録される
- [ ] AGENTS.md に発火条件表が転記されている (PY-5 型の doc 非対称を作らない)
