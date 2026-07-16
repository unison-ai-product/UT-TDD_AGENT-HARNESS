---
plan_id: PLAN-REVERSE-280-skill-root-doc-sync
title: "PLAN-REVERSE-280: skill canonical root 移行の設計 back-fill (docs/skills → skills)"
kind: reverse
layer: cross
workflow_phase: R2
confirmed_reverse_type: design
drive: fullstack
status: draft
route_signal: drift
route_mode: reverse
created: 2026-07-02
updated: 2026-07-16
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

## R2 実施記録 (2026-07-16、Claude)

- item 1: ADR-004 決定1 を `skills/**/*.md` へ訂正 + 訂正注記節を追加。PLAN-L4-12 §1-2/§3、PLAN-L5-06 §1/Step2 を訂正 (confirmed doc は訂正注記付きインライン)。SKILL_MAP.md 自己説明を `skills/` へ修正。
- item 2: `.claude/agents/refactor-scout.md` の dead link を `skills/refactoring.md` へ修正。
- item 3: SKILL_MAP.md に review-checklist.yaml の索引外マーカーを明示 (data asset / `shouldScoreSkillAsset` 除外 = PLAN-L7-277 N-1 の実装済み結論と同一結論に整合)。**PO 確認は R3 で要取得** (両 PLAN 同一結論の事後承認)。
- item 4: domain_tags 着手済みを A-186 で確認済み — R3 検証のみ。
- item 5: (a) security.md の `ut-tdd guardrail` 誤案内を実在防波堤 (pre-push hook + `src/lint/secret-scan.ts`) ベースへ書換え、guardrail = decision ledger (`guardrail status`) と明記。(b) incident-runbook.md の status 副作用表現を read-only 実態へ修正。(c) context-engineering.md `--plan <path>` → `<plan-id>` (SKILL_MAP も同修正)、harness-observability.md / db.md / context-memory.md / code-review-and-quality.md の bare `metrics` → `metrics skill` (+`telemetry scan`/`find <query>`)。(d) graph bare form 6 ファイル (api / api-and-interface-design / dependency-map / project-management / reverse-r0 / testing) を `graph impact --changed` / `graph export --format mermaid` へ実行単位化、project-management の「full PLAN dependency graph」過大表現を cross-artifact relation graph 実態へ修正。(e) N-4 3 ファイル是正。(f) estimation.md の task classify 陳腐化注記を実装済み実態へ更新。(g) deprecation-cutover.md:60 の表記揺れ修正。
- **DoD 範囲注記**: 「`docs/skills` stale 参照ゼロ」は *誤誘導 4 系統* に限る。残存する `docs/skills` 言及は (a) 歴史的記述 (ADR/L1/governance の起票時文脈・frozen 要求 doc)、(b) L6 skill-index.md が正規に設計する dual-root fallback (`skills/` 優先 / `docs/skills/` fallback) であり、stale ではない。全文書一括置換は confirmed 要求 doc の改変になるため本 PLAN では行わない。

## DoD

- [x] 上記 4 系統の是正が landed (誤誘導系統ゼロ。範囲注記どおり歴史的記述と dual-root fallback 設計は除外)
- [x] review-checklist.yaml の索引外扱いが明示される (PO 確認は R3/R4 で取得)
- [x] item 5(d)(e)(f)(g) (A-186 追加分、計 8 ファイル + estimation.md + deprecation-cutover.md) が是正される
