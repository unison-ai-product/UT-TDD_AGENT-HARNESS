---
plan_id: PLAN-REVERSE-280-skill-root-doc-sync
title: "PLAN-REVERSE-280: skill canonical root 移行の設計 back-fill (docs/skills → skills)"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: fullstack
status: draft
route_signal: drift
route_mode: reverse
created: 2026-07-02
updated: 2026-07-09
owner: PM / PO
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - root 記述是正の対象範囲確定 (ADR/PLAN/SKILL_MAP/agent 定義)"
  - role: se
    slot_label: "SE - doc 是正 + dead link 修正 + 索引外 asset の明示"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-280-skill-root-doc-sync.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-180-skill-system-audit-2026-07-02.md
    - .ut-tdd/audit/A-186-skill-quality-design-impl-audit-2026-07-09.md
    - docs/adr/ADR-004-internal-asset-ts-control-boundary.md
    - docs/plans/PLAN-L4-12-skill-pack.md
    - docs/plans/PLAN-L5-06-skill.md
    - skills/SKILL_MAP.md
---

# PLAN-REVERSE-280: skill canonical root 移行の設計 back-fill

## 状態

draft 起票 (A-180 S-2/S-3/S-4/S-5)。実装が先行して root を `skills/` へ移行済みなのに設計側が旧 `docs/skills/` のまま凍結している drift の正規化 = Reverse 駆動 (実装→設計 back-fill)。

## 対象 (2026-07-02 実測)

1. **root 記述の是正**: ADR-004:21 / PLAN-L4-12:52 / PLAN-L5-06:54,72 の `docs/skills/**/*.md` 記述を現行 root (`skills/`) へ更新 (confirmed doc の修正は correction note 付き)。`skills/SKILL_MAP.md:14` の自己説明 "Catalog index for docs/skills/." を修正。
2. **dead link 修正**: `.claude/agents/refactor-scout.md:24` の `docs/skills/refactoring.md` → `skills/refactoring.md` (refactor-scout はコード側 allowlist 現役 agent)。
3. **索引外 asset の明示**: `skills/review-checklist.yaml` (gate checklist SSoT) が skill 索引対象外であることの意図確認 (PO/TL) と、意図的なら索引外マーカーの明示。**2026-07-09 優先順位パネル追記**: これは「人間向け SKILL_MAP 索引からの除外」決定であり、`PLAN-L7-277` の N-1 追補 (「機械採点/注入パイプラインからの除外」決定) と同一資産に対する別軸の境界決定である。3レンズ独立分析全てがこの2決定の無連携リスクを検出 — 本項目着手時は `PLAN-L7-277` N-1 の結論と整合させ、review-checklist.yaml が「skill か data asset か」を両 PLAN で同一結論にすること。
4. **domain_tags 空値の是正**: `skills/technical-writing.md` の `domain_tags` を実値で埋める (L6-37 の situation-pull 索引を唯一の domain skill で機能させる)。**2026-07-09 A-186 で着手済みを確認** — 現行 `domain_tags: [writing, documentation, technical-writing, editing]`。本項目は実質完了、検証 (R3) のみ残る。
5. **skill 本文の実態同期 (A-180 §3b、本文査読で確定 + A-186 で追加確認)**: (a) `skills/security.md:76-85` — `ut-tdd guardrail` を secret スキャンと誤案内 (実装は台帳表示のみ)。実在防波堤 (pre-commit hook / secret.ts) ベースへ書き直し、PLAN-L7-260 の実スキャナ landed 後にそちらへ差し替え。(b) `skills/incident-runbook.md:54-56` — `ut-tdd status` の PLAN 登録副作用という過大表現を read-only 実態へ修正。(c) `skills/context-engineering.md` の `--plan <path>`→PLAN ID 表記、`skills/harness-observability.md:45` の bare サブコマンド列挙の実行単位化 (軽微 2 件)。(d) **A-186 N-3**: `ut-tdd graph` (bare) を直接実行可能な PLAN 依存グラフとして誤案内する箇所が `project-management.md:53,71,80` / `api-and-interface-design.md:71` / `api.md:69` / `dependency-map.md:21,50,54,80` / `reverse-r0.md:47` の 5 ファイルに拡散 (実サブコマンドは `graph impact`/`graph export` のみ)。(e) **A-186 N-4**: `ut-tdd metrics` (bare) の同型誤案内が `db.md:40` / `context-memory.md:92` / `code-review-and-quality.md:84` の 3 ファイルに拡散 (実サブコマンドは `metrics skill` のみ)。(f) **A-186 N-6**: `estimation.md:22-24` の「`ut-tdd task classify` 未実装」注記が陳腐化 (実装済み、`src/cli.ts:2500-2586`)。(g) **A-186 N-5**: `deprecation-cutover.md:60` の `ut-tdd doctor asset-drift` 表記揺れ (同ファイル内の正しい表記と不整合、軽微)。

## R0→R4

R0 (本 doc) → R1 対象確定 → R2 是正実施 → R3 検証 (asset-drift / SKILL_MAP 突合 green) → R4 fullback (backprop_scope 記録)。

## 未着手 DoD

- [ ] 上記 4 系統の是正が landed し、`docs/skills` への stale 参照が tracked docs からゼロになる (domain_tags は着手済み、R3 検証のみ残)
- [ ] review-checklist.yaml の索引外扱いが明示される (PO 確認済みで)
- [ ] item 5(d)(e)(f)(g) (A-186 追加分、計 8 ファイル + estimation.md + deprecation-cutover.md) が是正される
