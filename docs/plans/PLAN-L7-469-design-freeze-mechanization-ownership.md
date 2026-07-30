---
plan_id: PLAN-L7-469-design-freeze-mechanization-ownership
title: "PLAN-L7-469 (troubleshoot): design-freeze 機械検査 gate の所有分離 — merged-plan-status fail-close の恒久対策 (issue #149 / #162)"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
route_signal: incident
route_mode: incident
created: 2026-07-30
updated: 2026-07-30
owner: PM (Claude) / PO
backprop_decision: not_required
backprop_decision_reason: "既存 gate (merged-plan-status / deliverable-plan-trace / impl-plan-trace) の意味論も検査ロジックも変更しない。変更は PLAN 間の artifact 所有帰属 (generates) のみであり、新規 L0/L1 要件ではない。gate 自身の一般化 (状態遷移条件と所有 artifact 完了判定の同一性検査) と post-merge 罠の PR CI 前倒し判定は §5 carry-1 として issue #162 側の後続 slice へ routing する。"
agent_slots:
  - role: aim
    slot_label: "AIM — artifact 所有帰属の境界判断 (PLAN 状態遷移条件と完了判定の同一性)"
  - role: se
    slot_label: "SE - design-freeze 機械検査 gate の所有分離と doctor 配線"
  - role: tl
    slot_label: "TL - merged-plan-status torsion の恒久回避境界"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
parent_design: docs/design/harness/L6-function-design/function-spec.md
github_issue_id: 149
generates:
  - artifact_path: docs/plans/PLAN-L7-469-design-freeze-mechanization-ownership.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/resource-kernel-fixture-manifest.ts
    artifact_type: source_module
  - artifact_path: tests/resource-kernel-fixture-manifest.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
    - docs/plans/PLAN-L7-132-green-command-digest-integrity.md
review_evidence:
  - reviewer: codex-cli
    review_kind: cross_agent
    reviewed_at: "2026-07-30T14:59:00+09:00"
    tests_green_at: "2026-07-30T14:50:00+09:00"
    verdict: pass
    worker_model: claude-opus-5
    reviewer_model: codex-gpt-5.6-sol
    scope: "本 PLAN が所有する 2 成果物 (src/lint/resource-kernel-fixture-manifest.ts、tests/resource-kernel-fixture-manifest.test.ts) は PR #196 exact HEAD 43d7c28c で Codex 非 author closing cross-review = PASS を取得済 (PR コメント 2026-07-30T05:59:12Z)。同 HEAD の GitHub Actions run 30517859805 で harness-check-linux / harness-check-windows / 集約 harness-check が全 green。成果物の内容は本 PLAN で変更していない (所有の移管のみ) ため、review 対象と実体は同一 blob (digest 一致を anchor_commit で機械照合可能)。所有移管の妥当性は advisor 二系統 (claude-fable-5 / gpt-5.6-sol) が独立に方式 A を推奨した判断に基づく。"
    green_commands:
      - kind: smoke
        command: "GitHub Actions harness-check run 30517859805 (PR #196 HEAD 43d7c28c、linux/windows/集約 全 green)"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-07-30T14:50:00+09:00"
        evidence_path: tests/resource-kernel-fixture-manifest.test.ts
        output_digest: "sha256:b93bb84a7dfc60d924dbc077a2c82125c5354c48a91eda5d9aa7561b63e0670f"
        anchor_commit: 43d7c28c23775b1b2a84db3ef0b035e906328b91
      - kind: unit_test
        command: "bun scripts/run-vitest-snapshot.ts tests/resource-kernel-fixture-manifest.test.ts (U-RGKFIX-001..005、5/5 green)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-30T14:50:00+09:00"
        evidence_path: src/lint/resource-kernel-fixture-manifest.ts
        output_digest: "sha256:54ee92d6d579f62bf24a453fb213b81d2cab238c3cdca55aecba54804555fa1a"
        anchor_commit: 43d7c28c23775b1b2a84db3ef0b035e906328b91
---

# PLAN-L7-469 (troubleshoot): design-freeze 機械検査 gate の所有分離

## 0. Objective — 2 つの gate が design PLAN 上で衝突した (main red の恒久対策)

PR #196 は design PLAN `PLAN-L5-25` の `generates` へ機械検査系の出荷物
(`src/lint/resource-kernel-fixture-manifest.ts` / `tests/resource-kernel-fixture-manifest.test.ts`)
を登録して merge した。結果、merge 直後から main を含む全 CI が fail-close した:

```
doctor: merged-plan-status - violation: PLAN PLAN-L5-25-resource-kernel-physical-protocol は
status=draft (未 confirm) なのに generated deliverable が merge 済み:
src/lint/resource-kernel-fixture-manifest.ts, tests/resource-kernel-fixture-manifest.test.ts
```

これは 2 つの正当な gate の要求が 1 つの PLAN 上で両立不能になった構造 torsion である
(open issue #162 の実例そのもの — merged-plan-status は PR CI では base tree 判定のため、未 confirm
PLAN + deliverable を持ち込む PR は green のまま merge でき、**merge 後の main run で初めて赤化**する。
当初 #186 (stacked PR の throw) と誤分類していたが、#196 は base=main の通常 PR であり #162 が正):

- `deliverable-plan-trace` は `tests/` 配下の deliverable が**どこかの PLAN の `generates` に
  登録**されていることを要求する (本文 prose 参照では不足)。
- `merged-plan-status` は「出荷物ルート (`src/` `tests/` `scripts/` `.claude/`) の generates artifact が
  canonical target に実在するなら PLAN は confirmed/completed/accepted であれ」を要求する。
- 一方 `PLAN-L5-25` §7.2 は「confirmed 昇格には実 OS runner 証跡 (real-OS 6 + mock+real-OS 9 の
  実測) が必要、それまで `draft` 維持」と明文で定める。実装が存在しない段階で confirm すれば偽完了に
  なる (`coding ≠ substance`、PLAN-L7-89 の claim discipline に反する)。

## 1. 根因 — 1 つの PLAN に 2 つのライフサイクルが同居した

design PLAN の confirm 条件 (実 runner 証跡) と、merge 済み出荷物が要求する confirm-on-merge は
**本質的に別のクロックで進む**。所有が同居する限り、どちらかの gate を弱めない解は存在しない。

正確な一般則は「design PLAN は出荷物を持たない」ではなく、**PLAN の状態遷移条件と、その PLAN が
`generates` で所有する artifact の完了判定が同一であること**である (両 advisor の一致点。
`claude-fable-5` / `gpt-5.6-sol` に独立諮問し、いずれも本 PLAN の方式を推奨した)。

## 2. 本 PLAN が実施した所有移管 (単一 commit)

1. 上記 2 成果物の `generates` 所有を `PLAN-L5-25` から本 PLAN へ移す。本 PLAN は成果物が完成・
   検証済みであるため即 `confirmed` (review_evidence は §4 の実 citation)。
2. `PLAN-L5-25` の `generates` は docs 成果物 (PLAN 本体 / L5 設計 doc / L8 テスト設計 /
   fixture manifest yaml) のみを保持する。docs/ は confirm 前に実在するのが正常なため
   `merged-plan-status` の対象外であり、design PLAN のライフサイクルと整合する。
3. `PLAN-L5-25` §7 本文は機械検査の所在 (本 PLAN が所有) を明記し、trace を失わない。
   本 PLAN も `dependencies.references` に `PLAN-L5-25` を持ち、双方向で辿れる。

**supersede ではない**: `PLAN-L5-25` の claim が誤っていたわけではなく、artifact 所有の
帰属先が誤っていた。よって errata (`supersedes`) ではなく所有の是正として記録する。

## 3. 移管する成果物と検査内容

| artifact | 役割 |
|---|---|
| `src/lint/resource-kernel-fixture-manifest.ts` | L8 freeze 属性表の fixture 列と正本 manifest (`docs/test-design/harness/resource-kernel-fixture-manifest.yaml`) の双方向突合。`status: planned` の entry が `path` を実在させていたら violation (実体の偽装検出)。 |
| `tests/resource-kernel-fixture-manifest.test.ts` | 実 repo 回帰 `U-RGKFIX-001..005`。42 件の宣言・実体整合、planned 非実在、合成 violation 検出。 |

doctor hard gate `resource-kernel-fixture-manifest` は `src/doctor/doc-registry.ts` →
`src/doctor/check-definition-groups.ts` → `FULL_DOCTOR_OUTPUT_IDS` へ配線済み
(配線自体は PR #196 で着地、本 PLAN では変更しない)。

## 4. AC (acceptance / substance)

- `U-RGKFIX-001..005` が 5/5 green (実 repo HEAD snapshot 経由)。
- PR #196 exact HEAD `43d7c28c` の CI run 30517859805 が Linux / Windows / 集約すべて green。
- 同 HEAD で Codex 非 author closing cross-review = PASS。
- 本 PLAN の適用後、`merged-plan-status` が violation 0 (main red の解消。CI が判定者)。
- `deliverable-plan-trace` / `impl-plan-trace` の孤児 0 が維持される (所有先が変わるだけ)。

## 5. carry / 次工程 (未機構化として正直に記録)

1. **一般則の機械化が未了**: 本 PLAN は 1 件の torsion を解消したが、「PLAN の状態遷移条件と
   所有 artifact の完了判定が同一であること」を機械強制する gate は存在しない。同型違反は
   今後も prose では防げない (機構化率の既往教訓)。issue #162 の恒久対策 (PR CI での
   merge 後 main tree 前倒し判定 + 所有同一性検査) を起票・実装するまで閉じない。
2. **既存 PLAN の sweep 未実施**: 他の design lane PLAN が出荷物ルート artifact を `generates` に
   持っていないかの棚卸しは行っていない。1 の gate 実装と同時に行う。
3. **PR #197 の pair-mapping 成果物**: `src/lint/resource-kernel-pair-mapping.ts` /
   `tests/resource-kernel-pair-mapping.test.ts` は同型の成果物であり、merge 時には本 PLAN が
   所有する (PR #197 側で `generates` を本 PLAN へ寄せる)。`PLAN-L5-25` へ再び登録すると
   同じ torsion が再発する。

## 6. 壊さない / 再発させない

- gate に escape hatch (`confirm_blocked_by` のような宣言で violation を降格する抜け道) を
  実装してはならない。「merge 済み deliverable を draft PLAN の下へ無期限駐車する」経路になり、
  `merged-plan-status` の検出意図そのものを 1 行で無効化できる (両 advisor が独立に棄却)。
- design PLAN を「CI を通すため」に confirm してはならない。未充足の昇格条件を隠す偽完了であり、
  PLAN claim discipline に正面から反する。
- 所有移管は `generates` の付け替えと新 PLAN の confirm を**単一 commit**で行う。分割すると
  `deliverable-plan-trace` が所有不在の瞬間を観測して逆向きに red になる。
