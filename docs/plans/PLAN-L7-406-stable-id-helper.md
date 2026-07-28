---
plan_id: PLAN-L7-406-stable-id-helper
title: "PLAN-L7-406 (add-impl): stable ID helper consolidation"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: Codex
parent_design: docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - stable ID helper 共通化"
generates:
  - artifact_path: docs/plans/PLAN-L7-406-stable-id-helper.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-406-stable-id-helper-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/stable-id.ts
    artifact_type: source_module
  - artifact_path: tests/stable-id.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
  requires:
    - docs/plans/PLAN-REVERSE-406-stable-id-helper-backfill.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L5-detailed-design/module-decomposition.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
  references:
    - docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-21T00:10:00+09:00"
    tests_green_at: "2026-07-21T00:10:00+09:00"
    verdict: approve
    scope: "stableId helper 共通化、L4/L5/L6/L7 設計 back-fill、projection/feedback/skill/workflow consumer 置換、targeted tests と db rebuild の確認。2026-07-21: PLAN-L7-420 Step 1 rerun-bound correction で smoke エントリの evidence_path (.ut-tdd/harness.db、gitignored/未 commit の構造的欠陥) を committed audit log へ張り替え、typecheck/lint/unit_test は同日の Step 1 一括再実行 (bun run typecheck / bun run lint / 全 vitest) で再確認した。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T16:58:00+09:00"
        evidence_path: src/stable-id.ts
        output_digest: "sha256:e0a3a0580965ece1cc130dadc5b98a82effa30245a6b046c0de98d2f79e31375"
        anchor_commit: 740f83f985da717310271e2e2d46ce2a5e4134a5
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T16:58:00+09:00"
        evidence_path: tests/stable-id.test.ts
        output_digest: "sha256:ddbd23941724d316a083f6463a71200f86f4932fd76ad292a7d5f8e7993158a7"
        anchor_commit: 740f83f985da717310271e2e2d46ce2a5e4134a5
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts tests\\stable-id.test.ts tests\\spec-ir-projections.test.ts tests\\feedback-surface.test.ts tests\\skill-recommend.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T17:01:00+09:00"
        evidence_path: tests/stable-id.test.ts
        output_digest: "sha256:ddbd23941724d316a083f6463a71200f86f4932fd76ad292a7d5f8e7993158a7"
        anchor_commit: 740f83f985da717310271e2e2d46ce2a5e4134a5
      - kind: smoke
        command: "bun src/cli.ts db rebuild --json"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-21T00:00:00+09:00"
        evidence_path: .ut-tdd/audit/A-L7-420-l7-406-db-rebuild-correction-2026-07-21.log
        output_digest: "sha256:4984b34bde0735b580dad5c2cf745f8eb45e79396dcdbd70331aec997cefbd22"
        anchor_commit: 3c728fad6cacdd181080e39ad02be89d60ef2c81
---

# PLAN-L7-406: stable ID helper consolidation

## 背景

PLAN-L7-405 で spec-ir projection の ID 衝突は止めたが、同じ正規表現による ID 生成が
projection / feedback / skill / workflow に分散して残っていた。非ASCII見出しやパス由来 ID を
DB に引き込む V-model 改善では、検出器ごとの local regex copy は衝突再発と test mock drift の温床になる。

## 実装スコープ

1. `src/stable-id.ts` を低レベル helper として追加し、ASCII safe ID の後方互換を保つ。
2. 正規化で情報が落ちる場合だけ `sha256` 12 桁 suffix を付け、非ASCIIや区切り差の衝突を避ける。
3. `state-db` / `spec-ir` / `feedback` / `skill-engine` / `workflow` の local stable ID 実装を共通 helper へ寄せる。
4. テスト injected deps も同じ helper を使い、oracle 側の旧 regex copy を残さない。
5. L4/L5/L6/L7 設計へ helper の module boundary と function contract を back-fill する。

## DoD

- [x] `tests/stable-id.test.ts` が ASCII safe / hash suffix / empty sentinel を固定する。
- [x] spec-ir / feedback / skill / projection-writer の既存 targeted tests が green。
- [x] `module-drift` が `src/stable-id.ts` を孤児 module として報告しない。
- [x] `bun run tsc --noEmit` / `bun run lint` / `bun run src\cli.ts doctor` が green。

## 残リスク

`src/assets/catalog.ts` と `src/guardrail/ledger.ts` には独自 ID 正規化が残るが、現時点では asset key / guardrail
ledger 固有の責務であり、この PLAN は projection / feedback / skill / workflow の共通 row ID 生成に絞る。

## 2026-07-21 Rerun-Bound Correction (PLAN-L7-420 Step 1)

`kind: smoke` の green_command が `evidence_path: .ut-tdd/harness.db` を指していたが、この経路は
`.gitignore` で常に除外される生成物 (rebuildable runtime state) であり、commit されたことが一度もない。
よって file-hash evidence 契約 (`green-command-digest`) を構造的に一度も満たせない設計ミスだった
(stale digest ではなく evidence_path 選定そのものの欠陥)。

是正: `bun src/cli.ts db rebuild --json` を再実行し (exit 0)、その実出力を
`.ut-tdd/audit/A-L7-420-l7-406-db-rebuild-correction-2026-07-21.log` として保存した上で、
`green_commands[].evidence_path` / `output_digest` をそのログへ張り替えた。この監査ログは
PLAN-L7-420 の blind review 是正 slice の commit に含めて追跡する (commit 自体は orchestrator が
本 slice の commit 操作で行う。是正編集時点ではまだ untracked)。`exit_code` (0) と検証意図
(db rebuild が smoke evidence として green であること) は変更していないが、`command` は
evidence_path 張り替えに伴い `bun run src\cli.ts db rebuild` (Windows バックスラッシュ表記、
JSON 出力なし) から `bun src/cli.ts db rebuild --json` (追跡可能な committed ログを生成する
実行形) へ更新した — これは PLAN-L7-420 の是正対象 30 PLAN のうち command 表記が変わった
唯一の例外である (他は digest/anchor/evidence_path のみの是正、詳細は PLAN-L7-420 の
Step 1 実施記録 §FLAG 是正記録 参照)。
