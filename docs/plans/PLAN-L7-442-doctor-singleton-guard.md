---
plan_id: PLAN-L7-442-doctor-singleton-guard
title: "PLAN-L7-442 (add-impl): doctor 多重起動 fail-fast (singleton lock)"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / Claude / Codex
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

1. `src/doctor/singleton-lock.ts`: `.ut-tdd/state/doctor.lock` による排他
   (pid + started_at + host + lock_id、`wx` 排他 create)。stale 判定 = 同一 host の保持 pid 死亡、
   45 分超過、または破損 lock。別 host の pid はローカル OS で probe せず、TTL 超過時だけ回収する。
   stale/release は対象 lock を同一 directory の固有 quarantine 名へ rename してから削除し、
   後続の fresh lock を単純 unlink しない。**advisory guard であり安全ゲートでも分散 lease でもない**:
   lock I/O 自体の障害では doctor を止めない (fail-open、degraded 続行)。SMB/NFS/OneDrive をまたぐ
   strict mutual exclusion、heartbeat、clock-skew 耐性は保証しない。
2. CLI `doctor` コマンド配線: 取得失敗時は保持者情報付きメッセージで exit 2 (JSON モードは `ok:false`)。
   実行後 finally で release。通常の `doctor` に加え `review --staged` / `review --uncommitted` が内部で
   full doctor を起動する経路も同じ lock の対象にする。`runDoctor` ライブラリ直呼びは対象外。
3. regression test (`tests/doctor-singleton-lock.test.ts` と `tests/cli-surface.test.ts`、
   U-DOCLOCK-001〜011)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | lock module (取得/解放/stale 回収) + unit test | 直列 |
| 2 | CLI doctor 配線 (fail-fast exit 2 / finally release) | 直列 |
| 3 | typecheck + targeted test green + doctor 実走 | 直列 |

## DoD

- [x] 保持者生存中の 2 本目 doctor が exit 2 で即終了する (U-DOCLOCK-002/009)
- [x] 同一 host の pid 死亡 / 45 分超過 / 破損 lock は自動回収され、別 host の fresh lock は保持する
  (U-DOCLOCK-003/004/005/007)
- [x] lock create I/O 障害で doctor 本体が止まらない (fail-open、degraded 続行、U-DOCLOCK-008)
- [x] release は pid/host/started_at/lock_id が一致する取得者の lock だけを quarantine 経由で削除し、
  通常経路で冪等に動作する。所有確認後の fresh generation 差替えも削除せず復元する
  (U-DOCLOCK-006/010)
- [x] stale 回収中に fresh generation へ差し替わった場合、quarantine後の再照合で検出して復元し、
  contender は取得せず block する (U-DOCLOCK-011)

## 保証境界と後続

- 本 PLAN の受入対象は、同一 repo で発生した再試行嵐を抑止する advisory guard である。
- 共有 filesystem 上の strict lease、release/reclaim の adversarial race oracle、quarantine 残骸清掃、
  fail-open receipt/telemetry は `PLAN-REVERSE-442` の R1〜R4 で L6 doctor 実行モデルへ back-fill する。
- doctor 一実行の性能 SLO は GitHub Issue #70 の Recovery で扱い、排他保証と混在させない。
