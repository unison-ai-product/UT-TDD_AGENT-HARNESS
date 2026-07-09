---
plan_id: PLAN-L7-400-feedback-surface-group-before-slice
title: "PLAN-L7-400 (troubleshoot): takeover feedback surface の多様性飢餓修正 — group を slice より先に行う"
kind: troubleshoot
layer: L7
drive: db
status: archived
route_signal: incident
route_mode: incident
created: 2026-07-09
updated: 2026-07-09
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "既存 takeover feedback surface (PLAN-L7-110/137/366) の選択順序バグ修正であり、新規 L0/L1 要件ではない。harness self-application の内部補正。"
agent_slots:
  - role: aim
    slot_label: "AIM - selectTakeoverFeedback の group/slice 順序修正"
  - role: tl
    slot_label: "TL - グルーピング先行方式のレビュー (breadcrumb 文言 / 既存 cap 方針との整合)"
  - role: se
    slot_label: "SE - 実装委譲 + regression test"
generates:
  - artifact_path: docs/plans/PLAN-L7-400-feedback-surface-group-before-slice.md
    artifact_type: markdown_doc
  - artifact_path: src/feedback/surface.ts
    artifact_type: source_module
  - artifact_path: tests/feedback-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
    - docs/plans/PLAN-L7-137-feedback-surface-taxonomy.md
    - docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
    - docs/plans/PLAN-L7-144-warn-remediation-parity-and-join.md
    - docs/governance/context-efficiency-audit-2026-07-09.md
    - docs/plans/PLAN-L7-403-feedback-surface-context-efficiency.md
---

# PLAN-L7-400 (troubleshoot): takeover feedback surface の多様性飢餓修正

> **実装着地**: 本 draft の実装は `PLAN-L7-403-feedback-surface-context-efficiency` に統合済み。
> 本ファイルは context-efficiency audit F2 の分解起票として保持し、今後の正本実装参照は PLAN-L7-403 とする。
>
> **archived 化の理由 (2026-07-09、Claude 追記)**: 本 PLAN は `status: draft` のまま一度も confirm
> されずに実装が `PLAN-L7-403` (confirmed、review_evidence 記録済) へ統合された。`generates` が
> `src/feedback/surface.ts` / `tests/feedback-surface.test.ts` を宣言したまま draft で放置すると
> `merged-plan-status` doctor gate が「merge 済みなのに未 confirm」として fail-close するため、
> 正本実装の座は `PLAN-L7-403` に一本化し、本 PLAN は `status: archived` (起票の経緯を残す参照のみ)
> とする。DoD は起票時点のまま未消化 (実装判断は PLAN-L7-403 側で完結)。

## 0. 目的

`selectTakeoverFeedback` (SessionStart の takeover feedback surface) が、固定予算 (既定 10 件) 内で
**常に複数の異なる問題種別を surface する**ようにし、同一クラスタによる恒久的な独占を防ぐ。

## 1. 背景 (実測、`docs/governance/context-efficiency-audit-2026-07-09.md` F2 より)

`selectTakeoverFeedback` (`src/feedback/surface.ts:155-259`) は次の順で処理している:

1. open feedback を全件収集し `(bucket, severity, feedback_event_id 辞書順)` でソート (`surface.ts:233-238`)。
2. **ソート後に `slice(0, limit)`** で上位 10 件だけ残す (`surface.ts:258`、既定 `limit=10`)。
3. その 10 件だけを `renderGroupedItems` で `(bucket, severity, signal_type)` 単位にグルーピングして
   表示する (`surface.ts:104-146`)。

グルーピングより先に絞り込みが起きるため、同一 `signal_type` が 10 件超あると、その 1 群だけで
予算を使い切り、他の群は一切表示されない。2026-07-09 時点の本番 `harness.db` に対する実測 (本番と
同条件 `limit=10` と全件 `limit=100000` を比較):

```
limit=10 (実際の SessionStart 挙動): 10/10 件が "detector_route_candidate:spec-ir-invalid-subdoc"
全 open actionable/gate: 11 distinct signal_type
  unresolved-join: 602 件                              ← 最大群、一度も表示されない
  detector_route_candidate:spec-ir-invalid-subdoc: 446 件  ← 毎回これだけが表示される
  detector_route_candidate:spec-ir-orphan-relation: 199 件
  missing-test-plan-id: 10 件
  (以下 7 種、各 1-2 件)
```

`detector_route_candidate:spec-ir-invalid-subdoc` の `feedback_event_id` 接頭辞
(`detector-route-...`) が `unresolved-join:...` より辞書順で先に来るため、severity/bucket が同列
(すべて `warn`/`actionable`) の場合は常にこのクラスタが上位 10 件を占有する。

補足: `unresolved-join` は未知の新規問題ではない。`PLAN-L7-144-warn-remediation-parity-and-join`
(confirmed、2026-06-24) が `checkResolvablePlanJoin` の false-positive を修正し、当時
「unresolved-join 95→0」まで remediation した実績がある。しかし本 PLAN 起票時点では 602 件まで
再増加している (PLAN registry が 199→659 本に増える過程で新規 PLAN が dangling join を再生産した
可能性が高い、未確認)。本バグにより **この再増加自体が SessionStart から見えなかった** — これが
absence-blindness の実害である。

## 2. Scope

- `selectTakeoverFeedback` の内部処理順序を「全 open 集合を先に `(bucket, severity, signal_type)` で
  グルーピング → 上位 N **群** を breadcrumb 付きで返す」に変更する (slice と group の順序を入れ替える)。
- 固定予算 (既定 10 行程度) を維持したまま、常に複数の distinct signal_type が surface されることを
  regression test で固定する。
- `renderTakeoverFeedback` の breadcrumb (`+N more actionable`) は「残り件数」に加え、可能であれば
  「隠れている distinct signal_type 数」も分かる文言にする (詳細は実装時に TL レビューで確定)。

## 3. Non-Scope

- `unresolved-join` (602 件) 自体の remediation (根本原因調査・fix) は別スライス。本 PLAN は
  「見えるようにする」までが scope。
- `feedback_events` の close/supersede lifecycle 完結は `PLAN-L7-246` の scope。
- `renderFeedbackEventRows` (`ut-tdd feedback list` 側、`surface.ts:292-339`) は同種の
  slice-before-group ではない (limit=20 かつ全件 group 後に slice している) ため対象外
  だが、実装時に同じ関数を共有できないか確認する。

## 4. Steps (未着手)

| Step | 内容 | mode |
|---|---|---|
| 1 | `selectTakeoverFeedback` を group-then-slice に書き換える (純関数、既存 `renderGroupedItems` の
     グルーピングロジックを先に全件へ適用してから top-N 群を選ぶ) | 直列 |
| 2 | breadcrumb 文言の調整 (隠れた signal_type 数の明示、TL レビュー) | Step 1 の後 |
| 3 | regression test 追加 (`tests/feedback-surface.test.ts`): 複数 signal_type が同 bucket/severity で
     大量にある場合、上位 N 件が単一クラスタで占有されず distinct signal_type が surface されることを
     固定 | 直列 |
| 4 | 既存 test (`tests/feedback-surface.test.ts`, `tests/search-feedback.test.ts`,
     `tests/projection-writer.test.ts`) の regression 確認 | Step 3 と並列可 |

## 5. DoD

- [ ] `selectTakeoverFeedback` が全 open 集合を先にグルーピングしてから top-N 群を選ぶ (実装)
- [ ] 大量の同一 signal_type クラスタが存在しても、他の distinct signal_type が上位予算内に
      surface される (test 固定)
- [ ] 既存の cap/breadcrumb 挙動 (件数超過時の `+N more`) は退行しない (test 固定)
- [ ] `renderFeedbackEventRows` (`ut-tdd feedback list`) の既存挙動は変更しない、または意図的に
      揃える場合はその判断を本 PLAN に追記する
- [ ] typecheck / Biome / Vitest / `ut-tdd doctor` green

## 6. Verification (実施時に記録)

- `bun run vitest run tests/feedback-surface.test.ts tests/search-feedback.test.ts tests/projection-writer.test.ts --reporter=dot`
- `bun run typecheck`
- `bun run src/cli.ts doctor`
