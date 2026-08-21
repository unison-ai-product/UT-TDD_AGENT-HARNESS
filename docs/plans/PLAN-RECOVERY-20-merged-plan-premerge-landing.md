---
plan_id: PLAN-RECOVERY-20-merged-plan-premerge-landing
title: "PLAN-RECOVERY-20 (recovery): merged-plan-status の post-merge 罠を三点比較で塞ぐ (issue #162)"
kind: recovery
layer: cross
drive: agent
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-08-21
updated: 2026-08-21
owner: PO / Claude
github_issue_id: 162
parent_design: docs/plans/PLAN-RECOVERY-18-merged-plan-target-evidence.md
backprop_decision: not_required
backprop_decision_reason: "merged-plan-status の deliverable-driven 契約 (未 confirm PLAN の出荷物を merge させない) は不変で、その検出時点を merge 後から merge 前へ前倒しするだけである。harness 自身の lint gate 内部の診断区分であり、製品の要求 / 設計 / テスト設計契約を変えないため上流 backprop 対象が無い。"
agent_slots:
  - role: aim
    slot_label: "AIM - landing 判定の証拠境界 (immediate base を landed 判定へ昇格させない) の確定"
  - role: qa
    slot_label: "QA - landing / inherited_from_base / base 解決不能の三面 fail-close 回帰"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-20-merged-plan-premerge-landing.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-RECOVERY-18-merged-plan-target-evidence.md
  requires:
    - docs/plans/PLAN-L7-87-merged-plan-status-kind-independent.md
  blocks: []
  references:
    - src/lint/merged-plan-status.ts
    - src/lint/merged-plan-target-evidence.ts
    - tests/merged-plan-status.test.ts
    - tests/merged-plan-target-evidence.test.ts
    - docs/plans/PLAN-L7-54-merged-plan-status-gate.md
    - docs/plans/PLAN-L7-86-merged-plan-status-deliverable-scope.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-RECOVERY-20: merged-plan-status pre-merge landing detection

## 1. 事故と不変条件

`merged-plan-status` は canonical target (default branch) の tree だけを見て「未 confirm PLAN の
出荷物が既に merge されている」を判定する。この二点比較には、**未 confirm PLAN + その deliverable を
同一 PR が持ち込む場合、PR CI が green のまま merge でき、merge 後の main run で初めて赤化する**
という穴がある (issue #162)。実害は #140 / RECOVERY-18 で発生し、復旧 PR #161 を割り込みで要した。

保つべき不変条件 (RECOVERY-18 から継承、変更しない):

- **merged 判定は default branch の commit tree だけを正本とする。**
- **immediate base ref/SHA は監査証拠として残し、landed 判定には使わない。**
- canonical target が解決不能なら working tree へ fail-open しない。
- 非 Git fixture だけは既存の disk fallback 互換を維持する。

本 PLAN が追加する不変条件:

- 「target に不在 / subject に存在 / immediate base に不在」の deliverable は、**merge されれば
  target へ載る**ものとして `phase=landing` で **merge 前に** violation にする。
- immediate base に既に存在する deliverable は `inherited_from_base` とし、**子 PR の責任に
  しない** (RECOVERY-18 が塞いだ「子 PR を永久 Red にする」誤検出を再発させない)。
- 三点目 (subject / immediate base) を解決できない面では **landing 検出ごと落として二点比較へ
  縮退する**。推測で violation を作らない。

## 2. 実装契約

`classifyTargetArtifacts` の decision を四値へ拡張する:

| decision | 意味 |
|---|---|
| `landed_on_target` | canonical target に存在 = merge 済み (従来どおり) |
| `landing_in_subject` | target に不在、subject に存在、immediate base に不在 = **この PR が載せる** |
| `inherited_from_base` | target に不在だが immediate base に存在 = 親 PR が持ち込んだ |
| `absent_from_target` | どこにも無い |

`subjectPaths` 未指定なら従来どおり二値へ縮退する (完全後方互換)。`analyzeMergedPlanStatus` は
`merged` / `landing` の二 bucket を返し、同一 PLAN が両方に該当する場合は `merged` 側だけを出す
(1 PLAN 1 violation)。

**三点比較は subject と immediate base の両方が解決できたときだけ有効化する。**片方でも欠けたら
landing 検出ごと落として二点比較へ縮退する。immediate base が分からないまま subject だけで分類すると、
stacked 構成で親由来の deliverable を `landing` と誤認し、RECOVERY-18 が塞いだ「子 PR を永久 Red に
する」誤検出を別経路で再発させるためである。

欠け方は 2 通りあり、どちらも区別できないという点で同じなので同じ扱いにする:

1. **event 自体が無い** (非 PR 実行 / ローカル doctor)。immediate base の概念が与えられない。
2. **event に immediate base SHA はあるが object を解決できない** (親 branch 削除後 / shallow fetch)。

CI の `pull_request` run では event が必ず base SHA を持つため、issue #162 が対象とする PR CI での
fail-close は失われない。

## 3. TDD と trace

Red → Green を実測で通す (fence 済み snapshot runner)。

```
UT_TDD_TEST_EXECUTION_ROOT=<worktree> UT_TDD_TEST_FENCE_ROOT=<worktree> \
UT_TDD_HEAD_SNAPSHOT_ROOT=<worktree> \
node node_modules/vitest/vitest.mjs run \
  tests/merged-plan-status.test.ts tests/merged-plan-target-evidence.test.ts
```

- Red: source 2 file を stash した状態で `tests/merged-plan-status.test.ts` が **5 failed / 15 passed**。
- Red (fail-close 面): 三点比較の有効化条件 (`immediateBasePaths` が解決できたときだけ subject を
  読む) を外すと、`suppresses landing detection when no pull_request event declares an immediate base`
  と `suppresses landing detection when a declared immediate base cannot be resolved` の 2 件が失敗。
- Green: 両 file で **30 passed / 30**。

既存 assertion の更新 2 件:

1. `tests/merged-plan-status.test.ts` の「PR branch の未 merge artifact を merged 扱いしない」面 —
   元の意図 (`mergedArtifacts` が空) は保持したまま、同じ入力が `phase=landing` として挙がることを
   追加検証する。旧 `not.toContain` は issue #162 の穴そのものを固定していた。
2. `tests/merged-plan-target-evidence.test.ts` の stacked 面 — 親由来 `src/parent.ts` の decision が
   `absent_from_target` から `inherited_from_base` へ具体化する。同テスト内の violations 検査
   (`["PLAN-TEST-main-debt"]` のまま) が RECOVERY-18 の不変条件を保っていることの実測になっている。

## 4. 設計判断

### 4.1 route certificate = `regression_dev` / `recovery` (advisor: gpt-5.6-sol)

- **案A (採択)**: `route_signal=regression_dev` / `route_mode=recovery` / `kind=recovery` / `layer=cross`。
- 案B: `route_mode=add-feature` / `kind=add-impl` / `layer=L7` (Reverse 対 + design ancestor)。

採択理由: `landing` は lint 内部の violation 診断区分であり、CLI schema / DB schema / 設計文書上の
状態機械 / consumer 契約へ公開されない。禁止対象も PLAN lifecycle も新設せず、既存不変条件の
**検出時点を前倒しする**だけである。直系の RECOVERY-18 が同一 resolver・同一 failure class を
`recovery` として扱っている前例にも一致する。`phase=landing` が外部契約へ露出する段階で案B を再検討する。

### 4.2 既存ファイルの所有権を再宣言しない

`src/lint/merged-plan-status.ts` / `tests/merged-plan-status.test.ts` は `PLAN-L7-87` が、
`src/lint/merged-plan-target-evidence.ts` / `tests/merged-plan-target-evidence.test.ts` は
`PLAN-RECOVERY-18` が所有する。`generates` には本 PLAN doc のみを宣言し、変更対象は
`dependencies.references` に記録する (`duplicate-artifact-ownership` を踏まない)。

### 4.3 supersede しない理由

RECOVERY-18 の主張は「immediate base を landed 判定に使わない」であり、本 PLAN もそれを守る
(immediate base は landing の**抑止**にのみ使い、`landed_on_target` へは決して昇格させない)。
falsified な claim が無いため errata (supersedes + 相互参照) の対象にしない。

## 5. 工程の実態 (隠さない)

対策方式は issue #162 本文が列挙した対策候補のうち候補 2 (PR diff の deliverable 追加を検出して
PR CI で fail-close) を採ったものだが、**実装とテストが本 PLAN の起票より先行した**。通常の
pair-freeze 済み工程として扱わない。起票時の advisor 相談 (gpt-5.6-sol) で route と反証を取り、
指摘された stacked fail-close 欠落を実装へ反映してから本 PLAN を出した。

## 6. 完了条件

1. 対象 test / TypeScript / Biome / PLAN lint / `merged-plan-status` 系 doctor が Green。
2. Linux / Windows CI が exact HEAD で Green。
3. Codex (非著者 family) の closing review が blocking 0。
