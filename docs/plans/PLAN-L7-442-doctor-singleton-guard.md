---
plan_id: PLAN-L7-442-doctor-singleton-guard
title: "PLAN-L7-442 (add-impl): doctor 多重起動 fail-fast (singleton lock)"
kind: add-impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / Claude
parent_design: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - doctor singleton lock + CLI fail-fast 配線"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-442-doctor-singleton-guard.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/singleton-lock.ts
    artifact_type: source_module
  - artifact_path: tests/doctor-singleton-lock.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  requires: []
  references:
    - .ut-tdd/memory/project-pr64-verdict-lane-b-pass-weak-lane-a-flag-staged-scope-follow-up-3.md
---

# PLAN-L7-442 (add-impl): doctor 多重起動 fail-fast (singleton lock)

## 背景 — 実害 (2026-07-16)

同一 repo で `ut-tdd doctor` (および `runDoctor` 直呼び) が 11:12〜11:24 の 12 分間に 16 プロセス並列滞留し、
16GB マシンの物理メモリ残 31MB まで枯渇、全プロセスがスラッシングして doctor 自体も 10 分超で完走不能になった。
発火元は hook ではなく **agent の再試行嵐** (doctor が遅い → agent が形を変えて再実行 → さらに遅くなる正帰還)。
doctor は read-only 検査であり同時複数実行に価値がないため、2 本目以降を即 fail-fast させて
プロセスが積み上がらない構造にする。

## スコープ

1. `src/doctor/singleton-lock.ts`: `.ut-tdd/state/doctor.lock` による排他 (pid + started_at + host、`wx` 排他 create)。
   stale 判定 = 保持 pid 死亡 or 45 分超過 or 破損 lock → 自動回収。**advisory guard であり安全ゲートではない**:
   lock I/O 自体の障害では doctor を止めない (fail-open、degraded 続行)。
2. CLI `doctor` コマンド配線: 取得失敗時は保持者情報付きメッセージで exit 2 (JSON モードは `ok:false`)。
   実行後 finally で release。`runDoctor` ライブラリ呼びは対象外 (テスト経路を壊さない)。
3. regression test (`tests/doctor-singleton-lock.test.ts`、U-DOCLOCK-001〜006)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | lock module (取得/解放/stale 回収) + unit test | 直列 |
| 2 | CLI doctor 配線 (fail-fast exit 2 / finally release) | 直列 |
| 3 | typecheck + targeted test green + doctor 実走 | 直列 |

## DoD

- [ ] 保持者生存中の 2 本目 doctor が exit 2 で即終了する (U-DOCLOCK-002、CLI 配線)
- [ ] pid 死亡 / 45 分超過 / 破損 lock は自動回収され doctor 実行を妨げない (U-DOCLOCK-003/004/005)
- [ ] lock I/O 障害で doctor 本体が止まらない (fail-open、degraded 続行)
- [ ] release は所有 lock のみ削除し冪等 (U-DOCLOCK-006)
