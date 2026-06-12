# Session Handover — 2026-06-12 — descent-obligation (PLAN-L6-35)

## Scope

- Active plan: `PLAN-L6-35-descent-obligation` (kind=add-design, layer=L6, status=confirmed)
- Trace key: **FR-L1-03** (V字双方向 trace、抜け漏れ検出。新 FR 採番せず既存 FR の降下不足を補填)
- 目的: V-model 降下鎖 (要求→要件→基本→詳細→機能設計) を **前後で取りこぼさない仕組み = descent-obligation ledger** を、要件 (L3) から機能設計 (L6) + L6↔L7 テスト設計 V-pair まで設計降下させる。L7 実装は本 PLAN 外 (Codex 委譲)。

## 動機 (なぜこの仕組みか)

A-136 後のクロスレビューで **skill subsystem の片肺 V-pair** を発見: `src/skills/recommend.ts` + テストコードは着地済だが L6 単体テスト設計が不在で、`impl-plan-trace` / `oracle-test-trace` / `pair-freeze` を全て素通りした。根本原因 = **absence-blindness** (既存検査は宣言された link しか見ず、在るべき成果物の不在を違反と扱えない)。本仕組みは検査を **上流駆動 (要件 FR + 層隣接 matrix → obligation 生成 → 不在 fail-close) + impl-ahead ガード** へ反転する。詳細 = [[project_descent_absence_blindness]]。

## Completed (この add-design サイクルで作成・確定)

降下鎖を dogfood で貫通 (各層に descent を反映):

- **L1 要求**: FR-L1-03 (既存、trace key)。
- **L3 要件**: `docs/design/harness/L3-functional/functional-requirements.md` FR-03 に振る舞い追記 + **AC-FR-03-04** (不在検出 / impl-ahead) 追加。
- **L4 基本設計**: `docs/design/harness/L4-basic-design/function.md` **§1.2** (C2 descent-obligation building block: 層隣接 matrix / 上流駆動生成 / defer ledger + impl-ahead)。
- **L5 詳細設計**: `docs/design/harness/L5-detailed-design/module-decomposition.md` **Appendix A.3** (descent-obligation module integration、relation-graph 再利用)。
- **L6 機能設計 (中核)**: `docs/design/harness/L6-function-design/descent-obligation.md` 新規 (関数 6 本 signature+DbC / §2 層隣接 matrix / §3 pseudocode / §4 edge case E1-E8 / §5 既存 lint 非重複 / §6 ガード + hard 昇格機械条件 / §7 段階導入)。status=confirmed。
- **L6↔L7 テスト設計 V-pair**: `docs/test-design/harness/L7-unit-test-design.md` **§1.22 U-DESC-001〜008** + §2 量閉じ行。
- **L0 用語 back-merge**: `concept_v3.1 §10.3` に `descent-obligation (降下義務)` / `impl-ahead ガード` / `absence-blindness` を merge (backfill-pairing green)。
- **Red 骨格 (forward-citation)**: `tests/descent-obligation.test.ts` (`it.todo` U-DESC-001〜008、oracle-test-trace green)。実装は L7。

## Evidence

- `npm test`: **484 passed + 8 todo** (1 skipped file)
- `npm run typecheck`: clean / `npm run lint` (biome): clean (130 files)
- `ut-tdd doctor`: **exit 0**
  - `pair-freeze — OK (39 pair、孤児 0)`
  - `l6-completion — OK (L6 docs 19件、L7 confirmed、G6 PASS)`
  - `verification — L4-L6 検証サイクルゲート: ✅ freeze 完了 (27/27 confirmed、孤児0)` (新 doc confirm で再 freeze)
  - `oracle-test-trace — OK (NEW 未 citation 0)` / `backfill — note のみ (PLAN-L7-05、本 PLAN 無関係)`
  - `review-evidence — OK (tests_green_at ≤ reviewed_at)`
- **Cross-review (review 前置)**: `code-reviewer` (intra_runtime_subagent、claude-only cross-runtime 代替)。初回 REQUEST_CHANGES (I-1 park satisfied 詐称 / I-2 untraceable 混入 / I-3 impl-ahead 二重登録 / I-4 invalid-defer dead code / M-1 from:* 型 / M-2 doctor 関数配置 / M-3 hard 昇格機械化) を全件 in-cycle 是正 → 再レビュー **APPROVE**。review_evidence は PLAN-L6-35 frontmatter に記録。

## Residual / Next Action

1. **L7 add-impl (Codex 委譲、本 PLAN 外)**: `src/lint/descent-obligation.ts` 実装 (load×3 / generateObligations / analyzeDescentObligations / messages) + harness.db `descent_obligations` projection + doctor `checkDescentObligation` 配線 (warn-first)。U-DESC-001〜008 の `it.todo` を実テストへ昇格 (U-DESC-008 = Phase 0 = 実 repo で skill 片肺が unmet/impl-ahead として surface される実アサーション)。別 add-impl PLAN を起票 (Codex)。
2. **skill 片肺の是正 (この仕組みが捕まえる最初の実ターゲット)**: L7 実装後、`analyzeDescentObligations` が surface する skill subsystem の unmet (L6 test-design 不在) / impl-ahead を是正 = (a) skill エンジンの L6 単体テスト設計 back-fill、(b) W10 skill pack curate (107 HELIX skills → 7 pack、`docs/skills/*-pack.md`)。
3. **§6 用語 back-merge**: concept §10.3 へ merge 済 (本サイクル)。requirements/process 側の追補は不要 (FR-L1-03 既存降下のため)。

## 壊さない / 再発させない

- `descent-obligation.md` は status=confirmed で L4-L6 freeze に算入される。draft へ戻すと freeze が再オープンする (U-VTRIG-005)。
- U-DESC は forward-citation の Red 骨格 (`it.todo`)。oracle-test-trace baseline には**追加しない** (baseline は縮小のみ可)。実テスト化で citation を保つ。
- この仕組み (descent-obligation) 自体が「absence-blind を是正する」ものなので、L7 実装時は **実 repo の現存 drop を warn-first で一掃検出 → 是正 → hard 昇格** の Phase 0→2 順を守る (descent-obligation.md §7)。
