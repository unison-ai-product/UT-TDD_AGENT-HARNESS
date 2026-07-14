---
plan_id: PLAN-L7-429-spec-ir-detector-scope
title: "PLAN-L7-429 (add-impl): spec-ir detector scope 精密化 — メタ doc 除外 + relation orphan 誤検知解消"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-13
updated: 2026-07-13
owner: Codex
parent_design: docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - shouldValidateDesignSubDoc のメタ doc 除外条件と parseSpecRelations の spec依存/evidence参照分離の設計整合レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-429-spec-ir-detector-scope.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-429-spec-ir-detector-scope-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-405-spec-ir-detector-precision.md
  requires:
    - docs/plans/PLAN-REVERSE-429-spec-ir-detector-scope-backfill.md
  references:
    - docs/plans/PLAN-L7-245-sub-doc-schema-integrity.md
    - src/state-db/spec-ir-projections.ts
    - src/schema/index.ts
    - tests/spec-ir-projections.test.ts
review_evidence:
  - reviewer: codex-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-13T21:05:29+09:00"
    tests_green_at: "2026-07-13T20:41:58+09:00"
    verdict: approve
    scope: "FLAG→解消。tests/spec-ir-projections.test.ts 21/21 green (2回再現)、実 repo orphan-relation=1 (pairs:self、REVERSE-12 規定通り) を実測確認。指摘1: 実測 invalid-subdoc=0≠18 は並行 PLAN-L7-245 レーンが同一 working tree で cluster A 18件の sub_doc を正規化済みのため (§4 規定の差分説明、両 PLAN 合流後の最終想定値と一致)。指摘2: §2 existsSync 記述と実装の不一致は §2 を採択実装に訂正、欠落検出は §7 残リスクへ。"
    worker_model: claude-fable-5
    reviewer_model: gpt-5.6-terra
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts (21/21 green、PLAN-L7-429 メタdoc除外/evidence参照分離/self-pair 退行防止 fixture 含む)"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-13T20:41:58+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:53e677236ddc1cb19b66725f5d64ac93aa91500bfbd0cef27c2cea0f29ceb0fc"
        anchor_commit: d2ee517e77e63d95f4b52fd4cf5b70011b3eca10
---

# PLAN-L7-429 (add-impl): spec-ir detector scope 精密化

## 0. 位置づけ

`PLAN-L7-405-spec-ir-detector-precision` が固定した検出境界の上に、2026-07-13 時点の
`spec-ir-invalid-subdoc` (22 件) / `spec-ir-orphan-relation` (58 件) triage で新たに切り分けられた
2 系統の構造的誤検知を精密化する add-impl。back-fill pairing (add-impl → Reverse 合流) は
**PLAN-REVERSE-429**。

## 1. 背景 (2026-07-13 triage 確定事項)

- `spec-ir-invalid-subdoc` 22 件のうち cluster A 18 件 (`docs/design/harness/L6-function-design/`
  配下の独自 topic 命名 sub_doc、例: `skill-index.md` / `governance-enforcement.md` /
  `agent-slots.md`) は `PLAN-L7-245-sub-doc-schema-integrity` の既知スコープであり本 PLAN では
  扱わない (対処は PLAN-L7-245 の Step 1/2)。
- cluster B 3 件は `doc_type: index` (README 系) や `doc_type: verification-roadmap`
  (roadmap.md) 等、メタ doc を `shouldValidateDesignSubDoc`
  (`src/state-db/spec-ir-projections.ts` L567-574) が除外できていないことに起因する誤検知。
  メタ doc は L1-L6 design document catalog の実体ではなく、除外漏れは検出側の scope 不備。
- cluster C 1 件 (`L1-business-requirements.md` stub) は既に削除済み扱いのため本 PLAN 対象外。
- `spec-ir-orphan-relation` 58 件のうち cluster D 約 51 件は、PLAN frontmatter の
  `dependencies.requires` / `pair_artifact` が `src/` / `tests/` /
  `.ut-tdd/audit/` / `docs/research/` / `CLAUDE.md` 等、`loadSpecIrSources`
  (`src/state-db/spec-ir-projections.ts` L483-533) が spec-ir ソースとして取り込まない
  artifact を指すために `parseSpecRelations` (L721-798) の `addRelation` が `to` を解決できず
  orphan 化する構造的誤検知。5 件は stale パス起因で既に修正 commit 済み、残 cluster E
  1-2 件は cluster D と同型。
- **設計判断記録**: `ut-tdd task classify` 相当の routeFiling は target=L6/function-spec を
  機械提示したが、本件は既存 L6 契約 (`PLAN-L6-39-vmodel-spec-ir-function-contracts.md` /
  `PLAN-L7-405` の function-spec.md) の precision 追補であり新規 L6 契約を要しないため、PO 判断で
  **L7 (本 PLAN) を override 採択** (2026-07-13)。理由: スコープが検出関数の除外条件追加と
  relation 分類のみで、L6 function contract の記述内容自体は変更しない。

## 2. スコープ

1. `shouldValidateDesignSubDoc` (L567-574) に `doc_type: index` / `doc_type:
   verification-roadmap` 等メタ doc の除外条件を追加する。判定は `def.spec_kind ===
   "design_doc"` 側ではなく、frontmatter `doc_type` を読む新しいメタ doc 判定ヘルパーを
   `parseSpecDefs` (L655-719) 側で `spec_kind` に反映させ、`shouldValidateDesignSubDoc` は
   その `spec_kind` を除外条件として参照する形にする (既存 `design_doc` 判定と混在させない)。
2. `parseSpecRelations` (L721-798) の `requires` / `pair_artifact` 解決を「spec 依存
   relation」と「evidence/実装参照」に分離する:
   - path prefix allowlist (`src/`, `tests/`, `.ut-tdd/`, `docs/research/`, `skills/`,
     `docs/improvement-backlog.md`, ルート設定ファイル `CLAUDE.md` / `AGENTS.md` /
     `package.json` 等) に一致する参照は spec-ir relation (`requires` / `pairs`) の解決対象外とし、
     evidence reference として扱い、relation 解決から無条件に除外する。本 PLAN では **新規
     finding kind 追加は行わない**ため実在確認 (`existsSync`) も行わない (確認しても報告先
     finding が無く dead check になる。blind-review 指摘 2026-07-13 で記述を採択実装に訂正)。
     存在しない evidence path の欠落検出 (`spec-ir-missing-evidence` 相当) は実在確認ごと
     次期課題として §7 残リスクに明記する。
   - **`pair_artifact: self` は除外しない** (blind-review 指摘 2026-07-13 で撤回): confirmed の
     `PLAN-REVERSE-12` が「self-pair は撤去済み、`pair_artifact: self` は unresolved orphan として
     fail-close」を規定しており、本 PLAN はこれに従い self を orphan 判定のまま残す。
     `PLAN-L2-04-wireframe.md` に残る `pair_artifact: self` (IMP-039/058 由来) と REVERSE-12 規定の
     不整合は本 PLAN の対象外とし、別途 doc 側整理へ回す。
3. 上記 1-2 は検出を弱める方向ではなく、`loadSpecIrSources` が構造的に読み込まない
   artifact 種別を relation 解決の対象外へ正しく分類するものである。spec-ir が本来検出すべき
   L1-L6 design document catalog 違反や PLAN 間の spec 依存 orphan は従来通り検出する。

## 3. 副作用確認 (DoD 必須)

`spec-ir-projections.ts` の relation 消費側 (`typedSpecFlowEdges` 等、L1692 / L1854 付近) を
retest し、`requires` / `pairs` relation_kind の分類変更が下流 projection の集計・エッジ生成に
副作用を与えないことを確認する。

## 4. U-oracle 案

- 負系 fixture: メタ doc (`doc_type: index` / `doc_type: verification-roadmap`) を持つ
  design_doc 相当ファイルを fixture として用意し、`spec-ir-invalid-subdoc` が発火しないことを
  固定する。
- 負系 fixture: PLAN frontmatter に `requires: [src/foo.ts, tests/bar.test.ts]` を持つケースを
  fixture 化し、`spec-ir-orphan-relation` が発火しないことを固定する。
- 正系 fixture (検出維持): `pair_artifact: self` を持つケースは REVERSE-12 規定通り
  `spec-ir-orphan-relation` が**発火し続ける**ことを固定する (退行防止)。
- 実 repo 回帰: `bun src/cli.ts doctor` / 実 projection 経由で残存件数を実測固定する。
  blind-review 実測 (2026-07-13, gpt-5.6-luna、真正欠陥 6 件の doc 修正後): invalid-subdoc 21 件
  (A=18 / B=3)、orphan-relation 47 件 (拡張 allowlist 該当 46 + `pair_artifact: self` 1)。
  self は REVERSE-12 規定により orphan のまま残す。
  本 PLAN 適用後の残存想定: invalid-subdoc = cluster A の 18 件 (PLAN-L7-245 が引き取る)、
  orphan-relation = self 1 件のみ。実測がこの想定とずれた場合は差分を review Step で説明する。

## 5. 工程表

### Step 1: [直列] shouldValidateDesignSubDoc メタ doc 除外
- 直列理由 = file_conflict (`src/state-db/spec-ir-projections.ts` 単一ファイル)。

### Step 2: [直列] parseSpecRelations の spec依存/evidence参照分離
- 直列理由 = downstream_dependency (Step 1 の `spec_kind` 変更を relation 解決が参照する
  可能性があるため)。

### Step 3: [直列] 副作用確認 + tests
- 直列理由 = downstream_dependency。`typedSpecFlowEdges` 等 relation 消費側の retest、
  `tests/spec-ir-projections.test.ts` へ負系 fixture を追加。

### Step 4: [直列] review Step (cross_agent / hybrid)
- 直列理由 = downstream_dependency。通過後 review_evidence 記録 + confirmed flip +
  PLAN-REVERSE-429 で back-fill。

## 6. DoD

- [ ] メタ doc (`doc_type: index` / `doc_type: verification-roadmap`) が
      `spec-ir-invalid-subdoc` の対象から除外されることを unit test で固定する。
- [ ] `src/` / `tests/` / `.ut-tdd/` / `docs/research/` / `skills/` / ルート設定ファイル等の
      evidence 参照が `spec-ir-orphan-relation` の対象から除外されることを unit test で固定する。
- [ ] `pair_artifact: self` は REVERSE-12 規定通り orphan として**発火し続ける**ことを
      unit test で固定する (除外しない)。
- [ ] `typedSpecFlowEdges` 等 relation 消費側の副作用が無いことを retest で確認する。
- [ ] `bun run vitest run tests/spec-ir-projections.test.ts` が green。
- [ ] 実 repo 回帰で finding 件数が想定 (cluster B/D/E 分) まで減ることを確認する。
- [ ] PLAN-REVERSE-429 で back-fill pairing (add-impl → Reverse 合流)。

## 7. 残リスク

- evidence reference (`src/` / `tests/` 等) を relation 解決対象外とすることで、実在しない
  evidence path を指す PLAN の欠落検出が弱まる可能性がある。新規 finding kind
  (`spec-ir-missing-evidence` 相当) の要否は本 PLAN の外に残す。
- 共有 stable ID helper への全局移行は `PLAN-L7-405` と同様に本 PLAN の外に残る。
