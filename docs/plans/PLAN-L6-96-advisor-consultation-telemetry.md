---
plan_id: PLAN-L6-96-advisor-consultation-telemetry
title: "PLAN-L6-96 (add-design): advisor 相談の発火 telemetry と不在検知 — 計測を先に、fail-close は実測が示した面のみ (PO 要求 2026-07-28)"
kind: add-design
layer: L6
drive: agent
route_signal: po_change
route_mode: add-feature
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: draft
hold_reason: "条件付き保留 (PO 判断 2026-07-28)。運用ルール (.claude/CLAUDE.md) を先に置き、機構化は spot-check の実測が必要性を示した場合のみ着手する。"
created: 2026-07-28
updated: 2026-07-28
backprop_decision: not_required
backprop_decision_reason: "orchestration 運用の計測面追加であり、harness の L0/L1 要件と製品外部契約を変えない。fail-close 昇格は計測窓の実測を経て別 PLAN で判断する。"
owner: PM / PO
agent_slots:
  - role: aim
    slot_label: "AIM - telemetry スキーマ・不在検知の surface 地点・fail-close 昇格条件の設計判断"
  - role: tl
    slot_label: "TL - warn-first が feedback 飢餓に落ちない出口条項のレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L6-96-advisor-consultation-telemetry.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L3-07-design-decision-elicitation-format.md
    - src/team/advisor-policy.ts
    - src/state-db/projection-writer.ts
    - src/plan/lint.ts
    - docs/governance/design-decision-elicitation.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L6-96 (add-design): advisor 相談の発火 telemetry と不在検知

## Status: 条件付き保留 (PO 判断 2026-07-28)

**本 PLAN は着手しない。** 先に運用ルールだけを置く (`.claude/CLAUDE.md`
「着手前 advisor 合意形成」節。Claude 固有ルールのため共有 CLAUDE.md / AGENTS.md には
置かない)。機構 (telemetry + 不在検知) はルールが守られないと**実測が示した場合にのみ**着手する。

理由: 相談 baseline は 16 発火 / 10 PLAN (841 PLAN 中) であり、機構の実効性が現状を
上回るという証拠がまだ無い。加えて本 repo は warn が恒久無視される失敗モードを実測済みで
(`unresolved-join` 621 件 / `stale-runtime-plan-context` 3115 件)、不在検知 warn も同じ死に方を
する公算がある。**発火ログは既に存在しクエリ可能**なので、ルールのみでも遵守状況は後から
数えられる — 「気づく手段が無い」ではなく「手段はあるが見ない」状態であり、spot-check の
運用固定で足りる。

**着手 (機構化) の発火条件** — 次のいずれかを spot-check で観測したとき:

- (a) 設計判断節に 2 案以上の方式と trade-off を記録した直近 20 PLAN の全てが
  advisor 発火ゼロ
- (b) 同じ 20 PLAN 窓で override (advisor 推奨と異なる決定) が実測併記なしに 2 件以上

以下は、その条件が満たされたときに実装する設計の記録である。

## 背景 (PO 要求 2026-07-28 と、その場での設計転換)

当初の要求は「設計・実装・修正の判断は着手前に advisor と合意形成する。Opus / Sonnet が
orchestration を担当するときに機械で厳格化できるか」であった。これに対する第一案は
receipt binding + plan lint / doctor での fail-close ゲートだったが、PO から

> 証拠を残すというより発火ログを測ったほうがいいんじゃないか

という指摘が入り、**計測を先に置く方向へ転換した** (advisor: claude-fable-5 も転換に賛成)。
未計測のまま fail-close を建てるのは「必要性を実証しない機構」であり、本 repo が
繰り返し踏んできた過剰機構化の型そのものである。

## 実測 (2026-07-28、この転換の根拠)

1. **発火ログは既に存在し、既に harness.db へ projection 済みだった** (第一案の前提は誤り)。
   `ut-tdd advisor` 実行 → `.ut-tdd/logs/session/advisor-<provider>-<ts>.jsonl`
   (session_start / tool_use / session_end) → `src/state-db/projection-writer.ts` の
   `projectHookEvents` が `hook_events` テーブルへ投影
   (event_id / session_id / plan_id / hook_name / event_type / occurred_at /
   digest=outcome / evidence_path)。session_id が `advisor-` prefix を持つため
   advisor 発火は既にクエリ可能。
2. **相談カバレッジの baseline = 16 発火 / 10 PLAN** (repo 全期間、session jsonl 実測)。
   うち 5 件は 2026-07-28 の当セッション。**841 PLAN に対し歴史的な相談は ~11 件**。
   → いま fail-close ゲートを建てれば、ほぼ全作業が即座に止まる。
3. 現状の不足は 3 点のみ:
   - row に `tool=advisor` / provider / model / decision_kind が載らない
     (hook_name が `PostToolUse` に丸められる)
   - **不在検知が無い** (「kind=design/add-impl の PLAN が advisor 発火ゼロで confirm」を
     出す signal が無い)
   - 集計が無い (相談率 / override 率 / 相談から着手までの時間)

## 設計判断 (advisor: claude-fable-5、2026-07-28)

### 1. 計測 → 実測 → 必要面のみ fail-close の順に固定する

本 PLAN では **fail-close ゲートを作らない**。作るのは telemetry と不在検知 (warn) と、
**出口条項** (下記 4)。fail-close 昇格は計測窓の実測を PO に提示したうえで別 PLAN で判断する。

### 2. 新規 receipt 成果物は作らない。既存 session jsonl を最小拡張する

「全部捨てると何を相談したか分からず override 率も測れない / 全部残すと receipt 設計に
戻る」の中間として、**既存の advisor session jsonl の `tool_use` 行に構造化フィールドを
追記し、projection で列へ昇格**する。これは receipt 契約ではなく telemetry スキーマ定義。

最小フィールド: `decision_kind` / `provider` / `model` / `current_model` /
`question_digest` / `adopted_decision` / `divergence` (`accept` | `override`)。
選択肢全文の binding は行わない (ログ本文に残るため事後照会可能)。

### 3. 不在検知は PLAN-L7-95 invocation fence の同型

「到達可能でテスト済みだが runtime path で一度も発火しない」という absence-blindness の
検出は本 repo に先例がある (PLAN-L7-95)。今回の「設計判断節に 2 案以上の方式と trade-off
を記録した PLAN が advisor 発火ゼロで confirm される」も同型であり、**到達可能性ではなく
発火事実を数える**検出器パターンを流用する。

### 4. warn 飢餓を避ける出口条項 (これが無いなら warn-first を導入しない)

本 repo には warn が恒久的に無視される既知の失敗モードがある (`unresolved-join` 621 件、
`stale-runtime-plan-context` 3115 件)。同じ死に方をさせないため:

- (a) 不在 warn は**蓄積型 feedback list に流さず、confirm / merge の地点で点として surface**
  する。
- (b) **計測窓 4 週間** (2026-07-28 起点)。窓の経過時点で相談率・override 率の実測を PO へ
  提示し、**fail-close 昇格か warn 撤去かを必ず判断する**。判断されないまま warn が
  継続する状態を許さない。

## スコープ

1. advisor session jsonl の telemetry フィールド追記 (上記 2) の契約。
2. projection での列昇格 (`hook_events` 拡張 or 専用 projection) の契約。
3. 不在検知 signal の定義 (上記の対象 PLAN、判定式、surface 地点 = confirm / merge) の契約。
4. 集計 surface (相談率 / override 率) の契約と、出口条項 (4-b) の明文化。

## スコープ外

- fail-close ゲート (計測窓の実測を経て別 PLAN)。
- 編集 hook での強制 (第一案で却下: 編集単位では trade-off の実在を機械判別できない)。
- advisor の provider routing 自体の変更。

## Schedule

- step 1 (serial): telemetry スキーマと不在検知の判定式 freeze (本 PLAN)
- step 2 (serial): PO 採択 (対象 PLAN の意味条件と計測窓 20 件)
- step 3 (serial): L7 add-impl PLAN + Reverse pairing 起票 → Red から実装
- step 4 (serial): 計測窓経過後、実測を PO へ提示し fail-close 昇格 / warn 撤去を判断

## AC

- AC-1: advisor 実行が telemetry フィールド付きで記録され、projection 後に
  「相談率 (設計判断節に 2 案以上の方式と trade-off を記録した PLAN のうち発火 1 件以上を
  持つ割合)」を実測クエリできる。
  before baseline = **16 発火 / 10 PLAN (841 PLAN 中)** を evidence として引用する。
- AC-2: 上記の対象 PLAN が advisor 発火ゼロで confirm される事象を検出する負例テストが
  green (発火事実を数える。到達可能性で代用しない)。
- AC-3: 不在 warn が蓄積型 feedback list ではなく confirm / merge 地点で surface される
  ことをテストで固定 (warn 飢餓の構造的回避)。
- AC-4: 計測窓の期限が機械可読な形で宣言され、期限超過時に「PO 判断未実施」を検出できる
  (出口条項の空文化を防ぐ)。
- AC-5: 本 PLAN の範囲では既存 workflow を fail-close させない (過剰強制の回帰防止を
  テストで固定)。
