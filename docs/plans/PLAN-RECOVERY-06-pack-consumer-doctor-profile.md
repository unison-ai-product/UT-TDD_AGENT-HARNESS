---
plan_id: PLAN-RECOVERY-06-pack-consumer-doctor-profile
title: "PLAN-RECOVERY-06 (recovery): Pack consumer 実動線の doctor self-application 前提混入の是正"
kind: recovery
layer: cross
drive: be
status: confirmed
route_signal: regression_dev
route_mode: recovery
created: 2026-07-02
updated: 2026-07-03
owner: PM / PO
parent_design: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: aim
    slot_label: "AIM - 収束サイクルの主担当 (root cause 確定〜fullback)"
  - role: po
    slot_label: "PO - consumer profile 分離方針 (full doctor を生成 CI から外す vs consumer-profile 新設) の採否"
  - role: tl
    slot_label: "TL - doctor gate の self-application/consumer 境界設計レビュー"
  - role: se
    slot_label: "SE - 生成 CI template / project-hook gate / wrapper 解決の是正実装"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-172-pack-comprehensive-review-2026-07-02.md
    - docs/templates/github/common/harness-check.yml
    - src/setup/templates.ts
    - src/lint/project-hook.ts
review_evidence:
  - reviewer: claude-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T18:05:00+09:00"
    tests_green_at: "2026-07-03T18:02:00+09:00"
    verdict: note
    scope: "案 A slice (C-1 生成 CI --setup-smoke / C-2 wrapper repo-local 解決 + hook 配線単一定義源 / B 項目 v1.1 allowlist 除外) の 5 軸レビュー。Critical 0、Important 1 (Codex 側 wrapper blockOnFailure negative test 欠落 → U-CXHOOK-002e で反映)、Minor 4 (HookId 型化・wrapper 相互 prefix 構造テスト・README 注記は反映、wrapper 部分存在 unit test は E2E 被覆ありのため skip 記録)。guard 弱体化なし (blockOnFailure/forbidden-path 両形式で維持) を確認。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-4-6
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/project-hook.test.ts tests/codex-hook-adapter.test.ts tests/setup.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T18:01:00+09:00"
        evidence_path: tests/project-hook.test.ts
        output_digest: "sha256:48480897a7026a89bd00952cbf40a4d089f0d0288ab1bcba446ba4452d2ff950"
        anchor_commit: 9eed81bb65bf768b9e9a6a74b373e700ff047fbe
      - kind: unit_test
        command: "bun run vitest run tests/distribution-acceptance.test.ts tests/github-ci-policy.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T17:42:00+09:00"
        evidence_path: tests/distribution-acceptance.test.ts
        output_digest: "sha256:70f64cbd086c233fb169d9d13a2ca630c21802bf5c1a088acf94629b5af0dab0"
        anchor_commit: 9eed81bb65bf768b9e9a6a74b373e700ff047fbe
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T18:01:00+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:e4720ac55b9b542d18f0a9f5d54b6258a17f556cb9622576a63558ec5be435b4"
        anchor_commit: 9eed81bb65bf768b9e9a6a74b373e700ff047fbe
      - kind: lint
        command: "bunx biome check src/setup/distribution.ts src/setup/templates.ts src/lint/project-hook.ts src/lint/codex-hook-adapter.ts src/lint/codex-hook-adapter-policy.ts tests/project-hook.test.ts tests/codex-hook-adapter.test.ts tests/distribution-acceptance.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T18:01:30+09:00"
        evidence_path: src/lint/project-hook.ts
        output_digest: "sha256:8248d0f61f0d8525482ff63d2b3b4a10d0a73f5e58b204490fdebca3c39e1176"
        anchor_commit: 9eed81bb65bf768b9e9a6a74b373e700ff047fbe
---

# PLAN-RECOVERY-06 (recovery): Pack consumer 実動線の doctor self-application 前提混入の是正

## Status

draft 起票 (PO /goal 指示 2026-07-02: 監査所見の改善・対応を修正駆動モデルで起票)。着手時期は PO 判断。

**2026-07-03 方式決定 + Step 1-3 実装完了**: PO「最適な方法で」により方式選択を委任 →
**案 A (生成 CI から full doctor を外し `doctor --setup-smoke` へ置換) を即時 slice として採用**。
案 B (doctor consumer-profile 新設) は、進行中の doctor check registry リファクタ
(PLAN-L7-300 系: per-check watches/scope メタデータ) と同じ registry メタデータ設計に乗せる
follow-up として残す (registry の二重構造化を避けるため L7-300 側の設計と合流させる)。
Step 4 (Pack sync + A-171 UAT 境界再評価) は PO gate 待ち。A-172 B 項目 (v1.1 旧構想 doc の
配布同梱) も同一 commit で修正 (allowlist 除外)。

## 根本原因 (A-172 C-1 / C-2、premise-gap)

doctor のガバナンス gate 群が self-application (source repo dogfood) 前提のまま配布エンジンへ焼き付いており、consumer profile が未分離:

1. setup が consumer へ生成する CI (`docs/templates/github/common/harness-check.yml` + `src/setup/templates.ts:464` builtin) が最終 step で full `doctor` を実行するが、fresh consumer では **exit 1 / violation 123 件** (実測、A-172)。README 自身が「full doctor を初期導入判定に使うな」と明記しており自己矛盾。
2. project-hook / codex-hook-adapter gate が source repo の hook 配線を要求する一方、setup 生成 settings.json は wrapper 配線 → **setup 出力が自製品の doctor を通らない** (missing_hook 11 件実測)。生成 CI 第一 step の wrapper も CI runner 上で 3 段解決すべて不能。

## 再発防止 (recovery exit 3 要件)

- **root cause**: gate 定数への self-application パス焼き込み (proposal-document-coverage-policy 等) + gate 要求と setup 生成物の非同期進化。
- **guard/test の具体変更点**: (a) 生成 CI から full doctor を外す or doctor に consumer-profile を新設 (PO 判断)、(b) project-hook gate の要求配線を setup 生成物と単一定義源で共有、(c) 「fresh consumer で setup → 生成 CI 相当が green」の regression test (実 setup 実行 smoke) を追加し、gate と setup の再乖離を fail-close。
- **L14 route**: Pack UAT 境界 (A-171) の前提修正として L13/L14 運用検証へ接続。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | ✅ consumer profile 方式の決定 (PO gate → 2026-07-03「最適な方法で」委任、案 A 採用) | 直列 |
| 2 | ✅ 生成 CI template 修正 (`doctor --setup-smoke`) + wrapper repo-local 解決段 + hook 配線の単一定義源化 | 直列 |
| 3 | ✅ regression test 追加 (setup 生成物 → gate green の fail-close 固定) | 直列 |
| 4 | ✅ Pack sync (PO 承認 push `57c8fcb`、CI success) + A-171 UAT 前提解除を A-172 correction note へ記録。実 UAT の実施自体は A-171 External Close Checklist 側の残項目 | 直列 |

## 実装 (Step 2-3、2026-07-03)

- **C-1**: 生成 CI (`docs/templates/github/common/harness-check.yml` + `src/setup/templates.ts`
  builtin) の最終 step を `doctor` → `doctor --setup-smoke` へ。full doctor は source repo
  self-application 用として据え置き (source repo 自身の `.github/workflows/harness-check.yml` は不変)。
- **C-2 (CI wrapper)**: 生成 wrapper `.ut-tdd/bin/ut-tdd.mjs` に repo-local `src/cli.ts` 解決段を
  追加 (cwd 相対、CI runner で setup 機の絶対パス非依存)。誤解決防止に `src/setup/index.ts` の
  共存在を要求 (consumer 自身の無関係な `src/cli.ts` を harness CLI と誤認しない)。
- **C-2 (gate 単一定義源)**: `src/lint/project-hook.ts` の `REQUIRED` に `id` + `wrapperCommand`
  (setup 生成 wrapper 配線の正規形) を追加し、source 配線 (`$CLAUDE_PROJECT_DIR` 必須) と wrapper
  配線 (repo-relative、`$CLAUDE_PROJECT_DIR` 不要) の両形式を受理。`blockOnFailure` 要求と
  forbidden-path 検査は両形式で維持 (guard 弱体化なし)。`codex-hook-adapter-policy` は
  `wrapperHookCommand()` を import して構築時共有 (文字列複製でなく参照 = 定義上分岐不能)。
  setup templates (`adapter/.claude/settings.json` / `adapter/.codex/hooks.json`) は同関数から
  command を生成。
- **B 項目 (A-172 review)**: `src/setup/distribution.ts` allowlist から参照ゼロの旧構想 doc
  `docs/governance/ai-dev-team-concept_v1.1.md` / `ai-dev-team-operations_v1.1.md` を除外。

## DoD

- [x] setup 生成 hook 配線が doctor project-hook / codex-hook-adapter gate を pass
      (tests/project-hook.test.ts「accepts the setup-generated consumer settings.json wrapper wiring」/
      tests/codex-hook-adapter.test.ts U-CXHOOK-002c が実テンプレートで固定。gate 要求と setup
      生成物が再乖離するとこれらが赤 = fail-close)
- [x] 生成 CI が fresh consumer で構造的に赤にならない gate 構成である
      (tests/setup.test.ts U-SETUP-004b/004b2 が builtin と docs template の両方で
      `doctor --setup-smoke` を固定。`doctor --setup-smoke` の fresh consumer green は
      A-172 実機 smoke で実測済み: checked=22, failed=0)
- [x] clean 配布 artifact 実測 (tests/distribution-acceptance.test.ts AT-DIST-001: 実 clean export →
      `setup --solo` → wrapper 実走 green、v1.1 doc 非同梱 assert 含む)
- [x] A-172 C-1/C-2 に correction note を追記し、A-171 UAT 境界の前提解除を記録
      (.ut-tdd/audit/A-172 §Correction Note 2026-07-03)
- [x] Pack sync 反映 (PO 承認 2026-07-03: Codex sync 4f3cbf0〜 + `57c8fcb chore: sync clean pack
      fffb132` push、Pack CI success。v1.1 doc 2 件は --prune-local で除去)
