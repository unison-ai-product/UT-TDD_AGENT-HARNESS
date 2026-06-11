# A-130 harness.db L7 実装セグメント accept (PLAN-L7-44 / G-L7DB.D)

Date: 2026-06-11
Status: accepted (PO 明示 accept「OK」 — PLAN-L7-44 工程表 accept)

## What / Why

- **PLAN-L7-44 (harness.db L7 実装セグメント / 工程表)** の最終 accept。全 6 span (① foundation + 45-49) 完遂、roadmap gates 4/4 到達 (G-L7DB.A→D)、**G-L7DB.D reached** をもって harness.db セグメントを close。
- PO accept は **status 遷移ではなく frontmatter (`accepted_by`/`accepted_at`/`accept_evidence`) + 本 audit 台帳**で記録する。master PLAN-L7-44 status は **`confirmed` を維持**する。
  - 理由: roadmap 到達判定 (`roadmap-registry.ts:92`) は span PLAN が `confirmed` であることを条件とし、**G-L7DB.D の span は master 自身** (工程表 spans[] 末尾)。master を `completed` に bump すると自分の close gate G-L7DB.D が un-reach する (4/4→3/4)。`completed ⊇ confirmed` を到達計数が扱わない lint の latent gap であり、accept を status 遷移で表すと矛盾するため frontmatter 表現を採る。
  - span PLAN 45-49 も `confirmed` のまま (個別実装は confirmed = 完遂+review 済)。

## Follow-up (lint gap → IMP)

- roadmap 到達計数 (`computeGateProgress`) が `completed` を `confirmed` 未満として扱い、`completed` span が gate を un-reach させる。`completed` は confirmed の後続状態なので到達計数では `confirmed|completed` を満たす扱いにすべき。**IMP として backlog 起票** (lint 契約変更 + test + Reverse 要のため inline 修正せず routing)。

## Evidence (accept 根拠)

- **実装 commit**: `4f81f5d` (span ① foundation) + `692f358` (span 46-49 projection 層)。
- **回帰**: vitest 436/436 green。
- **doctor**: 全項目 OK。特に:
  - `roadmap PLAN-L7-44`: gates 4/4 到達、G-L7DB.D ✅ reached、6 span 全 confirmed、孤児 span 0、構造 issue 0。
  - `module-drift` OK (新規 5 module = search/feedback/workflow/guardrail/assets を architecture §3.1 登録、孤児 0)。
  - `impl-plan-trace` OK (新 src 全件 PLAN generates 被覆、NEW orphan 0)。
  - `review-evidence` OK / 実装検証サイクルゲート [L0-L7] freeze 完了。
- **review 前置**: span 45-49 + master 44 すべてに `code-reviewer` review_evidence (verdict pass-with-fixes、worker≠reviewer、tests_green_at≤reviewed_at) 記録済。
- **invariant 維持**: 証跡なし ready 不可 / human-required 非降格 / feedback auto-approve 不可 / secret・PII・raw transcript 非保存 (各 span review scope で確認)。

## 影響 / 次手

- harness.db セグメント close → **HELIX→UT cutover (Mode 2→3)** が射程。
- **carry**: cutover 戦略 doc が ADR-001 前提とズレて stale → Reverse back-fill (現況 TS-native / 実 Mode へ更新) を先行させる IMP 起票予定。
- **carry**: bun:sqlite path が vitest(Node) 未カバー (adapter は両対応、test は node:sqlite 経路のみ) → bun 経路 acceptance test は別途 (Minor)。
