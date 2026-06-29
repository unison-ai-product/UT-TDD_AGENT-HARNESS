---
plan_id: PLAN-L7-197-github-ops-workflow-hardening
title: "PLAN-L7-197 (impl): GitHub 運用 workflow hardening — smell スキャン(audit quality) を harness-check CI に配線、release-version タグ運用(git tag/gh release)を追加、branch-type guard(poc-no-merge/hotfix-postmortem/commitlint)を実装、CODEOWNERS 0-team 通過(SEC-1)を fail-close。A-144/A-145 SEC-1 + 2026-06-29 GitHub-ops probe"
kind: impl
layer: L7
drive: be
status: draft
version_target: future
created: 2026-06-29
updated: 2026-06-29
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE (Codex 委譲) — audit quality を CI subjob 配線(dogfood+consumer template)、release tag 運用 script/doc、branch-type guard subjob、CODEOWNERS 0-team fail-close + test"
  - role: tl
    slot_label: "TL (Claude cross-runtime judge) — 既存 CI subjob 非破壊・consumer template 整合・harness-check.yml コメントの『PLAN で追加』予定との一致をレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-197-github-ops-workflow-hardening.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-03-setup-solo-team.md
  references:
    - .ut-tdd/audit/A-145-01-distribution-packaging.md
    - .ut-tdd/audit/A-144-02-runtime-config-security.md
    - .ut-tdd/audit/A-145-03-verification-gate-engine.md
---

# PLAN-L7-197 (impl): GitHub 運用 workflow hardening

## 優先度: version-up parked / 将来版へ保全 (PO 2026-06-29)

PO 決定 (2026-06-29): 配布クローズ優先で将来版へ保全 (`status=draft` + `version_target: future`)。
本 PLAN は 2026-06-29 の GitHub-ops probe (smell 未配線 / version タグ無し / branch-type guard 未実装) の回収先。

## 0. 前提 (調査結論 2026-06-29)

- **smell 未配線**: `audit quality` (`src/audit/quality.ts`: secret-like / 絶対パス / local endpoint /
  model・provider ハードコード / TODO・FIXME・HACK・XXX) は **手動 CLI のみ**。`harness-check.yml` CI は
  `typecheck/db rebuild/vitest/biome/doctor` の 5 つで **smell スキャン未配線**。
- **release-version タグ無し**: `git tag`=0、`package.json` version=`0.1.0` 固定、`.github/` に release/tag 自動化なし。
  `version_target` ledger は doc 版保全 (version-up 駆動) で git/release タグとは別物。
- **branch-type guard 未実装**: `harness-check.yml` コメントが `commitlint / poc-no-merge-guard /
  hotfix-postmortem-required` 等を「**PLAN で追加**」と明記 (§6.3 branch-type subjob)、未実装。
- **SEC-1**: `src/cli.ts:2600` `teamCount>0 && teamCount<3` 条件のため **CODEOWNERS は 0-team で通過** (gate 穴)。

## 1. Scope

### IN (本 PLAN)
- **smell を CI に配線**: `ut-tdd audit quality` を `harness-check.yml` の subjob に追加 (dogfood) + consumer
  CI template にも。fail-close 方針は要確定 (advisory→hard の段階化可)。
- **release-version タグ運用**: `git tag` + `gh release` の運用 script/doc を追加 (例 `v0.1.0`)。
  初回リリースの version 刻みを workflow 化。
- **branch-type guard**: `poc-no-merge-guard` / `hotfix-postmortem-required` / `commitlint` を branch 種別で
  発火する subjob として実装 (harness-check.yml コメントの予定を消化)。
- **SEC-1**: CODEOWNERS の 0-team 通過を **fail-close** 化 (`teamCount===0` も reject、または CODEOWNERS 要件を
  team 構成と整合)。

### OUT (本 PLAN では作らない)
- 既存 CI subjob (typecheck/test/doctor 等) の挙動変更 (追加のみ)。
- smell ロジック自体の変更 (`audit quality` は既存、CI 配線のみ)。
- 配布対象の切り出し方針変更 (L7-157/190/191 の領分)。
- いま実装すること (version-up parked)。

## 2. Acceptance Criteria
- `audit quality` が CI subjob として実行され、smell 検出時に CI 結果へ反映 (advisory/hard は段階明記)。
- release-version タグ運用 (git tag + gh release) が script/doc 化され、初回 `v0.x.y` を刻める。
- branch-type guard が branch 種別 (poc/hotfix 等) で発火する test green。
- CODEOWNERS の 0-team 通過が **reject** される test green (SEC-1 穴が閉じる)。
- 既存 CI subjob 非破壊。consumer CI template と整合。
- doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。

## 3. Schedule
- mode: serial。
- Step 0: smell の CI 段階 (advisory→hard) / release タグ運用方式 / branch-type guard の発火条件を確定。
- Step 1: `audit quality` を harness-check + consumer CI template に配線。
- Step 2: release-version タグ運用 script/doc 追加。
- Step 3: branch-type guard subjob 実装 + test。
- Step 4: CODEOWNERS 0-team fail-close + test → review (cross-runtime judge) → confirmed。

## 4. 壊さない / 再発させない
- 既存 CI subjob を壊さない (追加のみ、段階化で local-green/CI-red の急変を避ける [[project_ci_feedback_gap_and_biome_drift]])。
- smell ロジック本体に触れない (CI 配線のみ)。
- consumer template と dogfood CI の整合を保つ。
- version-up parked。
