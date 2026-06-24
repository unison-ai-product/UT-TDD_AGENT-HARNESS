---
plan_id: PLAN-L7-90-ci-readability-gitignored-artifact
title: "PLAN-L7-90 (troubleshoot): CI green 復旧 — runtime-readability テストが gitignored CURRENT.json の実在を要求していた local-green/CI-red 罠"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-22
updated: 2026-06-22
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "PO 指摘『GitHub harness-check が失敗している』(2026-06-22) の根治。gh run log で失敗は vitest step の tests/readability.test.ts 1 件 = 'expected [...51] to include .ut-tdd/handover/CURRENT.json'。原因: PLAN-L7-69 の runtime-artifact readability テスト (commit a571b5d, 2026-06-19) が live tree の `.ut-tdd/handover/CURRENT.json` 実在を hard assert していたが、CURRENT.* は .gitignore (line 19) ゆえ fresh CI checkout に不在 → 2026-06-19 12:35 を最後に CI が赤継続 (ローカルは CURRENT.json が在るので green = local-green/CI-red 罠、[[project_codex_branch_ci_verification]])。修正: 当該 assert を撤去し、tracked な evidence (.ut-tdd/audit/*.md 42件 / .ut-tdd/handover/provider/*.json 9件) の存在 + loader scope (全 path が audit/handover 配下) + mojibake-free のみを検査。CURRENT.json の handling は既存 fixture test (clean/replacement-character) が被覆。doctor の checkRuntimeReadability は fail-open-on-absence ゆえ CI で赤化せず (テストのみが over-assert していた)。typecheck/Biome/Vitest/doctor green + gh CI 緑を確認。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - CI green recovery: readability test must not require gitignored runtime state"
generates:
  - artifact_path: docs/plans/PLAN-L7-90-ci-readability-gitignored-artifact.md
    artifact_type: markdown_doc
  - artifact_path: tests/readability.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-69-encoding-corruption-expanded-guard.md
  requires: []
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-90 (troubleshoot): CI green recovery — readability test vs gitignored CURRENT.json

## 0. Objective

`harness-check` CI を green へ復旧する。失敗は **私 (Opus) のセッション以前から** 継続して
いた既存欠陥で、私の commit はその赤を継承していた。

## 1. Problem (gh run log で確定)

- `gh run view --log-failed`: vitest step で `tests/readability.test.ts` 1 件のみ失敗
  (`Failed Tests 1`)。message = `expected [ …(51) ] to include '.ut-tdd/handover/CURRENT.json'`。
- 原因: PLAN-L7-69 の runtime-artifact readability テスト (`a571b5d`, 2026-06-19) が
  `loadRuntimeArtifactReadabilityDocs()` の結果に `.ut-tdd/handover/CURRENT.json` が含まれることを
  hard assert していた。
- だが `.ut-tdd/handover/CURRENT.*` は `.gitignore` (line 19) ゆえ **tracked でない** =
  fresh CI checkout に不在。ローカルは `ut-tdd handover` 実行で CURRENT.json が常在するため
  test は green に見え、CI (clean checkout) だけ赤 = **local-green/CI-red 罠**
  ([[project_codex_branch_ci_verification]])。最後の CI 成功 = 2026-06-19 12:35 (a571b5d 直前)。

## 2. Fix

`tests/readability.test.ts` の当該テスト:

- `expect(paths).toContain(".ut-tdd/handover/CURRENT.json")` を撤去 (gitignored 生成物の
  実在に依存しない)。
- 代わりに **tracked な runtime evidence のみ**を検査: `.ut-tdd/audit/*.md` (42 件) +
  `.ut-tdd/handover/provider/*.json` (9 件) の存在 + loader scope (全 path が `.ut-tdd/audit/`
  または `.ut-tdd/handover/` 配下) + `analyzeReadability(docs).violations == []`。
- CURRENT.json の readability handling は既存 fixture test (clean ASCII / U+FFFD) が被覆済。
- doctor 側 `checkRuntimeReadability` は **fail-open-on-absence** 設計 (PLAN-L7-69) ゆえ CURRENT.json
  不在でも赤化しない = テストだけが over-assert していた。

## 3. Acceptance Criteria — met

- [x] readability テストが gitignored の `.ut-tdd/handover/CURRENT.json` 実在に依存しない。
- [x] tracked evidence (audit md / provider json) + loader scope + mojibake-free は引き続き検査。
- [x] doctor の fail-open 設計は不変 (テスト側のみ修正)。
- [x] typecheck / Biome / Vitest / doctor local green + `gh` で CI green を確認。

## 4. 再発防止

- **test は tracked artifact のみに依存させる** (gitignored runtime state の実在を assert しない)。
  CI は fresh checkout = gitignored 不在。push 前に「この assert は git に居るファイルか」を確認する。
- 恒久教訓は [[project_codex_branch_ci_verification]] (local green ≠ CI green) に集約済。
