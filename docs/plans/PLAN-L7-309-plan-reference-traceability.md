---
plan_id: PLAN-L7-309-plan-reference-traceability
title: "PLAN-L7-309 (refactor): PLAN 参照の追跡可能性 — debt 32 本への台帳リンク back-fill (L7-312/314 の残スライス)"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "debt 32 本の dependencies.references に台帳 doc (route-mode-kind-debt-audit) と PLAN-L7-263 を機械追記するのみ。本文・スコープ・DoD・公開 contract・上位設計の意味は不変 (git diff で references 2 行 ×32 のみを保証)。lint 誘導と行番号 stale 検出は L7-312/314 で Codex が landed 済につき本 PLAN の対象外。"
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期 (wave 1 先頭推奨、最小侵襲)"
  - role: tl
    slot_label: "TL - back-fill の機械性確認 (内容変更ゼロのレビュー)"
  - role: se
    slot_label: "SE - back-fill + lint メッセージ + stale 検出実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-309-plan-reference-traceability.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - docs/plans/PLAN-L7-312-plan-reference-freshness-analyzer.md
review_evidence:
  - reviewer: claude-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T13:21:08+09:00"
    tests_green_at: "2026-07-03T13:21:08+09:00"
    verdict: approve
    scope: "debt 32 本 (ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS 正本一致) の references に台帳 doc + PLAN-L7-263 を機械追記。git diff は references 2 行 ×32 = 64 挿入のみ、本文・スコープ・DoD 変更ゼロを oracle 確認。単一 runtime のため intra_runtime_subagent 証跡 (concept §2.1.2.1 fallback)。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-intra-runtime
    green_commands:
      - kind: lint
        command: "bun src/cli.ts plan lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T13:21:08+09:00"
        evidence_path: docs/plans/PLAN-L7-232-sync-pack-clean-tree-guard.md
        output_digest: "sha256:08294923c02bcbe23930745f358d836b157a2dca1fdc860adbc580e284e717e5"
        anchor_commit: "e57f70bf878269168e8ba9841c34b289a6ea4641"
---

# PLAN-L7-309 (impl): PLAN 参照の追跡可能性

## Status

**confirmed / landed (2026-07-03)**。PO /goal で version-up parked から活性化し完遂。A-181 GR-4/GR-5。活性化型は先例 (Codex L7-312/314) に倣い version-up→refactor (code_smell) — 振る舞い不変の doc back-fill のため add-feature 昇格・Reverse pairing は不要 (backprop_decision=not_required)。

**スコープ縮小 (2026-07-03 同日、2 段階)**: Codex が PLAN-L7-312-plan-reference-freshness-analyzer (confirmed) で lint detail の台帳誘導 + `analyzePlanReferenceFreshness` 基盤を、続けて PLAN-L7-314-plan-reference-freshness-advisory で doctor advisory 配線を実装済み。本 PLAN の残スライスは **(a) debt 32 本への references back-fill のみ** (両 PLAN が明示的に非対象とした唯一の項目) で、これを完遂した。

**完了証跡**: debt 32 本すべてに台帳 doc + PLAN-L7-263 を追記 (grep 32/32、下記 DoD)。`git diff docs/plans/` = 64 挿入 (32×2)、`git diff | grep '^+'` の一意行は追記 2 参照のみ (本文変更ゼロ)。`bun src/cli.ts plan lint` exit 0。

## 背景 (2026-07-03 粒度監査、orchestrator 裏取り済)

- **GR-4**: draft debt 32 本 (`ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS`) の本文・references のどこにも、着手時昇格義務の正本 (`docs/governance/route-mode-kind-debt-audit-2026-07-02.md`) と昇格実例 (PLAN-L7-263 本文) へのリンクが無い (精読 16 本中 0 本、PLAN-L7-232 で grep 裏取り)。後続モデルが台帳を知らずに着手すると `route_mode_kind_mismatch` で fail するが、**なぜ・どう直すか**へ辿り着けない。
- **GR-5**: 精読 16 本中 12 本が `file.ts:NNN` 形式の行番号引用を持つ。Codex リファクタが並行進行しているため、着手時にはずれている可能性が高い。ずれた行番号は「誤った箇所を触る」「見つからず停止」の両方を引き起こす。

## スコープ (1 要件: debt PLAN から正本台帳へ機械的に辿り着けるようにする — L7-312/314 の残スライス)

1. **debt 32 本への references back-fill**: 各 PLAN の `dependencies.references` に台帳 doc (`docs/governance/route-mode-kind-debt-audit-2026-07-02.md`) と PLAN-L7-263 を機械追記。**本文・スコープ・DoD は 1 文字も変更しない** (内容変更ゼロを diff で保証、TL レビューは diff 確認のみ)。

(実装済みにつき非対象: lint detail の台帳誘導 + analyzer 本体 = PLAN-L7-312、doctor advisory 配線 = PLAN-L7-314 — いずれも Codex、2026-07-03 landed)

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 32 本 references back-fill (機械追記、diff レビュー) | 直列 |

## DoD

- [x] debt 32 本すべての references に台帳 doc + PLAN-L7-263 が含まれる (grep で全数確認、結果を review_evidence に記録)
- [x] back-fill の diff が references 追記行のみである (git diff で確認: `git diff | grep '^+'` の一意行 = 追記 2 参照 ×32 のみ)

## 実装ノート (後続モデル向け)

- 触るファイル: debt 32 本の frontmatter のみ (対象一覧の正本 = `src/plan/lint-policy.ts` の ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS)。
- back-fill は frontmatter の YAML 構造を parse→追記→再 serialize せず、**references 配列末尾への行挿入**で行う (再 serialize は既存の quote/順序を壊し diff が汚れる)。
- 本 PLAN 自身も debt 台帳と同じ「draft のまま」状態になるが、route_mode=version-up なので昇格義務の対象外 (debt 台帳は add-feature 慣行の是正であり別枠)。
