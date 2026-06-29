---
plan_id: PLAN-L7-189-shared-harness-memory-cross-runtime
title: "PLAN-L7-189 (impl): HARNESS 所有の共有 memory — Claude memory の silo を解消し、Claude Code と Codex が .ut-tdd/memory(harness.db projection) を read/write で共有、SessionStart で両ランタイムへ surface。curated memory を event stream(feedback_events) の隣に置く"
kind: impl
layer: L7
drive: be
status: draft
version_target: future
created: 2026-06-29
updated: 2026-06-29
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE — ut-tdd memory CRUD + .ut-tdd/memory(md authored) → harness.db memory table projection + SessionStart surface(両ランタイム)"
  - role: tl
    slot_label: "TL — canonical=harness.db 不変・secret/PII 非投影・project↔user scope 分離のレビュー"
  - role: qa
    slot_label: "QA — cross-runtime 共有(Claude write→Codex read)と surface のテスト設計"
generates:
  - artifact_path: docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
  references:
    - docs/plans/PLAN-L6-06-handover-mechanism.md
    - docs/plans/PLAN-L5-08-harness-db-feedback.md
---

# PLAN-L7-189 (impl): HARNESS 共有 memory (cross-runtime)

## 優先度: version-up parked / 将来版へ保全 (PO 2026-06-29)

PO 決定 (2026-06-29): いまは配布クローズを優先。本 capability は破棄でなく将来版へ保全
(`status=draft` + `version_target: future`)。現行クローズに新規挿入しない。再開条件 = クローズ着地後 PO 指示。

## 0. なぜ (curated memory が一番共有されていない)

現状、Claude Code と Codex の唯一の共有チャネルは harness.db `feedback_events` (1780 件、`ut-tdd session start`
で両ランタイムへ surface、PLAN-L7-110) だが、これは **イベント列 (起きたこと)**。一方、蒸留された高価値の
**curated memory (user/feedback/project/reference の知見)** は `~/.claude/.../memory/*.md` = **Claude 専用・
off-repo の silo** で、**Codex から不可視**。handover prose は per-session・stale で「共有できていない感」。
→ 一番効く知見が一番共有されていない。これは正本主義 (canonical = harness.db、prose handover を正本にしない)
の延長で塞ぐべき gap。新発明でなく既存 SessionStart surface 機構の拡張。

## 1. Scope

### IN (本 PLAN)
- **store**: `.ut-tdd/memory/*.md` (typed schema = user/feedback/project/reference、人間が diff れる authored 形、
  リンク `[[name]]`) → harness.db `memory` table へ projection (既存「md authored → projection」パターン準拠)。
- **CRUD**: `ut-tdd memory add/list/recall`。Claude も Codex も **この command 経由で書く**。
- **Claude 書込経路**: Claude の memory 書込を `.ut-tdd/memory/` へ向ける (in-repo・共有・git 追跡)。既存
  `~/.claude/.../memory/` は personal mirror として残すか移行するかは activation 時に決定。
- **surface**: `ut-tdd session start` を拡張し feedback_events と並べて relevant memory を **両ランタイムへ surface**。

### OUT (本 PLAN では作らない)
- いま実装すること (version-up parked)。
- secret/PII/credential を memory へ書くこと (Safety Boundary、fail-close 必須)。

## 2. 決めどころ (activation 時に PO 確定)
- **scope 分割**: project memory は repo `.ut-tdd/` (per-project・dogfood 非配布で正しい)。user 型 (PO の好み) は
  cross-project なので別格納 (global 共有) にするか。
- **既存 Claude memory 移行**: `.ut-tdd/memory/` へ移すか personal mirror として残すか。
- **store 形式**: md+projection (推奨、人間可読) か harness.db table 一本か。

## 3. 配布への含意
mechanism (ut-tdd memory + table + surface) は **配布 system 側に乗る** = 「チームに cross-runtime 共有
プロジェクト memory を与える」プロダクト機能。dogfood 都合でなく配布価値のある feature。

## 4. Acceptance Criteria
- Claude が書いた memory を Codex が同一 SessionStart で受け取れる (cross-runtime 共有の実証)。
- canonical = harness.db projection、authored = `.ut-tdd/memory/*.md`、prose handover を正本にしない。
- secret/PII/raw transcript が memory に載らない (fail-close)。
- doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。

## 5. Schedule
- mode: serial。
- Step 0: memory schema (typed + link) と project↔user scope 方針を概念/要件へ反映。
- Step 1: `.ut-tdd/memory/` authored 形 + harness.db `memory` table + projection。
- Step 2: `ut-tdd memory add/list/recall` CRUD (両ランタイム共通)。
- Step 3: SessionStart surface 拡張 (両ランタイム) + secret 非投影 fail-close。
- Step 4: Claude 書込経路を `.ut-tdd/memory/` へ + 既存 memory 移行/mirror 決定。
- Step 5: 検証 (cross-runtime 共有 / surface / fail-close) → review → confirmed。

## 6. 壊さない / 再発させない
- canonical = harness.db を維持。stale prose handover を現状把握の正本にしない ([[feedback_verify_carry_status_against_code]])。
- secret/PII を outward-facing state へ載せない。
