---
plan_id: PLAN-L7-245-sub-doc-schema-integrity
title: "PLAN-L7-245 (add-impl): 設計 doc frontmatter sub_doc の schema 整合 (schema 外値・重複の解消)"
kind: add-impl
layer: L7
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-14
review_evidence:
  - reviewer: codex-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-14T10:05:00+09:00"
    tests_green_at: "2026-07-14T09:50:00+09:00"
    verdict: approve
    scope: "PASS-WEAK。claim-blind/spec-blind とも未反証の仕様違反なし、targeted test 19/19 green、方式 b (artifact_role 吸収) と map §1b-1 の整合確認、反例4系 (sub_doc 欠落/schema 外値/L4 drift 双方向/L6 方針ノート欠落) すべて防御確認。WEAK 理由は reviewer 環境での doctor 完走 timeout のみで、実 repo gate はオーケストレータが直接実測済み: sub-doc-schema-integrity OK (checked=54, meta skipped=3, drift 0) / sub-doc-catalog-drift OK / sub-doc-section-structure OK (bun src/cli.ts doctor、2026-07-14)。"
    worker_model: claude-sonnet-5
    reviewer_model: gpt-5.6
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/sub-doc-schema-integrity.test.ts (19/19 green、3者突合 正例/負例 fixture)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-14T09:44:57+09:00"
        evidence_path: tests/sub-doc-schema-integrity.test.ts
        output_digest: "sha256:1e64400695a9caa1f900956f1daf3c6fd945e5dc773c36e08e6f6a9cc49f1701"
        anchor_commit: d2ee517e77e63d95f4b52fd4cf5b70011b3eca10
      - kind: doctor
        command: "bun src/cli.ts doctor (sub-doc-schema-integrity OK checked=54 meta skipped=3 drift 0 / sub-doc-catalog-drift OK)"
        runner: bun
        scope: gate
        exit_code: 0
        completed_at: "2026-07-14T09:50:00+09:00"
        evidence_path: src/lint/sub-doc-schema-integrity.ts
        output_digest: "sha256:4cc05b6a9b61579efd2cdca2d6f36a761230e3801d354b8713ff26f264b3dc1e"
        anchor_commit: d2ee517e77e63d95f4b52fd4cf5b70011b3eca10
owner: PM / PO
parent_design: docs/governance/document-system-map.md
backprop_decision: not_required
backprop_decision_reason: "A-174 F-5 latent-defect の解消 (schema 整合 lint + 既存 doc 正規化) であり新規 L0/L1 要件ではない。設計正本への合流は同一変更内で document-system-map §1b-1 に記録済み。"
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - VALID_SUB_DOCS 拡張 or supplemental role 区別 lint"
generates:
  - artifact_path: docs/plans/PLAN-L7-245-sub-doc-schema-integrity.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/sub-doc-schema-integrity.ts
    artifact_type: source_module
  - artifact_path: tests/sub-doc-schema-integrity.test.ts
    artifact_type: test_code
  - artifact_path: docs/plans/PLAN-REVERSE-245-sub-doc-schema-integrity-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-174-forward-design-test-pair-audit-2026-07-02.md
    - src/schema/index.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - docs/plans/PLAN-L7-429-spec-ir-detector-scope.md
    - docs/plans/PLAN-REVERSE-245-sub-doc-schema-integrity-backfill.md
---

# PLAN-L7-245 (add-impl): 設計 doc frontmatter sub_doc の schema 整合

## Status

draft 起票 (PO /goal 2026-07-02、A-174 F-5 latent-defect)。2026-07-14 に実装事実を
`add-impl` + `PLAN-REVERSE-245` pairing へ昇格した。既存の cross-agent review evidence は
sub_doc 整合実装の判断証跡として保持し、Reverse のR0-R4 evidenceで上位設計へのbackfillを閉じる。

## 背景 (A-174 F-5)

- L2: business-flow.md / screen-detail.md が primary doc と同一 `sub_doc` (screen-flow / screen-list) を supplemental_* role で重複宣言 — 1:1 前提 lint の誤判定源。
- L6: skill-index.md (`sub_doc: skill-index`)、governance-enforcement.md (`sub_doc: function-spec-addendum`) が VALID_SUB_DOCS[L6] 外の値。

## スコープ

設計 doc frontmatter の sub_doc 値集合と VALID_SUB_DOCS / document-system-map §1b の 3 者を突合する lint を追加し、schema 外値は (a) VALID_SUB_DOCS へ正式登録 or (b) artifact_role 区別で吸収のどちらかへ寄せる (方式は TL 判断)。

## Steps

| Step | 内容 | mode | 状態 |
|---|---|---|---|
| 1 | 3 者突合 lint (report-only で現状差分の全量確定 → fail-close gate 化) | 直列 | 完了 (`src/lint/sub-doc-schema-integrity.ts`) |
| 2 | 登録 or role 吸収の適用 + fail-close 化 | 直列 | 完了 (方式 b 適用、下記) |

## 方式判断・実装 (2026-07-13、be-logic worker)

**方式 b (artifact_role 区別で吸収) を採用**。理由:

1. cluster A 18 件の実 doc 内容を確認すると、全件が既存 function-spec doc
   (`cross-review-enforcement.md` / `gate-confirm.md` / `plan-schedule-lint.md` /
   `review-evidence-stale.md` / `test-before-review.md` / `function-spec.md`、既存 6 件) と
   同型の L6 単体契約 doc (`L6 contract marker` + `pair_artifact: .../L7-unit-test-design.md` +
   PLAN 参照) であり、L6 の sub_doc catalog は「関数仕様 doc という artifact 種別」を表す coarse
   bucket である (L4 §1b の per-product-artifact enumerable catalog とは粒度が異なる)。
2. 方式 a (`VALID_SUB_DOCS.L6` へ 18 件を正式登録) は、既存 `sub-doc-catalog-drift` gate
   (schema ↔ 要件 v1.2 §G.1 mirror、`tests/sub-doc-catalog-drift.test.ts` U-SDCD-007 実 repo
   regression) を要件側未同期で即 fail-close させる。要件 v1.2 の更新は本 PLAN の許諾編集面の外。
3. 方式 a は L6-function-design に新規トピック doc を追加するたび schema 値を無制限に増やす前例に
   なり、L4 §1b が持つ「本当に列挙すべき per-product-artifact catalog」という設計意図と混同する。

適用内容:

- `docs/design/harness/L6-function-design/` 配下 18 件の `sub_doc` を schema 正本値
  `function-spec` に統一し、元の bespoke 値/未宣言だった topic 識別は
  `artifact_role: topic_<name>` (governance-enforcement.md のみ「addendum」の意味を保つため
  `supplemental_governance_enforcement`) として保持 (L2 `business-flow.md` の
  `artifact_role: supplemental_business_flow` と同型の non-schema free-form メタデータ)。
- `docs/governance/document-system-map.md` に §1b-1 (L6 sub_doc の粒度ノート) を新設し、
  「L6 は per-topic catalog を持たず `function-spec` 共有 bucket + ファイル名/artifact_role で
  差分化する」慣行を明文化 (今回の latent-defect の再発防止)。
- `src/lint/sub-doc-schema-integrity.ts` (新規): 3 者突合を fail-close 化。
  1. doc↔schema: `docs/design/harness/**` の設計 doc (メタ doc `doc_type: index` /
     `verification-roadmap` は除外) の frontmatter `sub_doc` が宣言済 かつ
     `VALID_SUB_DOCS[layer]` に含まれること。
  2. schema↔map (L4): document-system-map.md §1b の per-slug table と `VALID_SUB_DOCS.L4` を
     双方向 diff (`architecture` = 方式設計 §0 の別区分として明示 exempt)。
  3. schema↔map (L6): §1b-1 の bucket 方針ノート存在を正本とする (enumerable catalog を持たない
     層の definition rot 防止、`frontend-design-coverage.ts` の marker 方式と同型)。
  `ut-tdd doctor` (`sub-doc-schema-integrity` gate、`sub-doc-catalog-drift` の隣) に登録。
- `tests/sub-doc-schema-integrity.test.ts` (新規、19 tests): fixture 正例/負例 + 実 repo regression
  (U-SDSI-018: 実 repo で drift 0、U-SDSI-019: 旧 bespoke 値が `function-spec` に統一されたことを固定)。

## DoD

- [x] 全設計 doc の sub_doc が schema/map と 3 者一致 (lint green、`sub-doc-schema-integrity` OK
      checked=54 meta skipped=3、実測 2026-07-13)

## 2026-07-13 spec-ir triage 追記 (PLAN-L7-429 起票に伴う事例補強)

`spec-ir-invalid-subdoc` finding 22 件の triage (PO 採択案 A) で、本 PLAN が対象とする
schema 外 sub_doc の実例が `docs/design/harness/L6-function-design/` 配下に 18 件確認された
(cluster A)。既知の latent-defect (A-174 F-5) と同型であり、本 PLAN のスコープを変更しない —
検出側の副作用縮小は別途 `PLAN-L7-429-spec-ir-detector-scope` が担当する。

代表例 (`VALID_SUB_DOCS.L6 = [function-spec, class-design, edge-case, screen-spec]` に対して):

- `agent-slots.md`: `sub_doc` frontmatter 自体が未宣言 (path 推論に依存し L6 有効値へ解決しない)。
- `skill-index.md`: `sub_doc: skill-index` (schema 外値、独自宣言)。
- `governance-enforcement.md`: `sub_doc: function-spec-addendum` (schema 外値、A-174 F-5 と同型の
  supplemental role 重複)。
- 同型で他に `context.md` (`sub_doc: context`)、`graph.md` (`sub_doc: graph`)、`memory.md`
  (`sub_doc: memory`)、`secret.md` (`sub_doc: secret`)、`skill-admission.md`
  (`sub_doc: skill-admission`) 等、独自 topic 命名の sub_doc 宣言が残る 18 件。

triage の残り (spec-ir-invalid-subdoc 22 件中): cluster B 3 件 (README `doc_type: index` /
roadmap `doc_type: verification-roadmap` 等メタ doc の除外漏れ、`shouldValidateDesignSubDoc` の
scope 側で対処 — PLAN-L7-429)、cluster C 1 件 (`L1-business-requirements.md` stub、別途削除済み
扱いのため本 PLAN 対象外)。

本 PLAN の Step 1/2 (3 者突合 lint) は cluster A の 18 件を確定差分として引き継ぐ。
