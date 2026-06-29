---
plan_id: PLAN-L7-198-research-recovery-finding-routing
title: "PLAN-L7-198 (impl): Research/監査 finding → 分類 router → Recovery 起票配線 — 監査/調査が見つけた regression/premise-gap を Recovery(機械強制+L14)へ、機能欠落を Add-feature/Refactor へ起票。新 mode を足さず既存 Research+Recovery を route eval で接続。A-144/A-145 の VER-1/DB-1 が初回起票候補"
kind: impl
layer: L7
drive: be
status: draft
version_target: future
created: 2026-06-29
updated: 2026-06-29
owner: PM (Opus) / PO (人間)
parent_design: docs/design/harness/L6-function-design/forced-stop-feedback.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE — route eval に finding 分類 router 実装(regression/premise-gap→Recovery 起票、feature-gap→Add-feature/Refactor 起票) + 人間承認ゲート + unit test"
  - role: tl
    slot_label: "TL — 新 mode/kind/signal を増やさない(既存 regression_dev 接続)・全 finding を Recovery に押し込まない・Recovery exit の prose 止まり禁止を緩めないレビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-198-research-recovery-finding-routing.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-02-forced-stop-feedback.md
  references:
    - docs/process/modes/recovery.md
    - docs/process/modes/research.md
    - .ut-tdd/audit/A-145-feature-review-index.md
    - .ut-tdd/audit/A-144-judge-audit-index.md
---

# PLAN-L7-198 (impl): Research/監査 finding → Recovery 起票配線

## 優先度: version-up parked / 将来版へ保全 (PO 2026-06-29)

PO 決定 (2026-06-29): いまは配布クローズを優先。本対応も将来版へ保全 (`status=draft` + `version_target: future`)。
PO 案 (2026-06-29):「リサーチからリカバリー起票への配線がベスト」。本 PLAN はその配線を機械化する。

> 注: 本 PLAN は「Audit を新 mode として新設」案を**棄却**した結果である。新 mode を足さず、既存
> Research(調査→レポート) と Recovery(復旧→再発防止) を route eval の起票で繋ぐ方が governance が軽く
> ([[feedback_migration_is_requirements_driven]] 整合)、かつ Recovery の収束契約をそのまま再利用できる。

## 0. 前提 (調査結論 2026-06-29)

- **Research は既存駆動モデル** (`docs/process/modes/research.md`、kind=`research`)。現 exit は
  `ADR → Forward(L1/L4)` のみ (前向き決定)。監査レポート (A-144/A-145、`audit quality`、`branch audit`、
  l14-close-audit) は **駆動モデル無しのアドホック/ゲート出力**で、収束契約を持たない (findings が宙に浮く)。
- **Recovery は最強の収束契約を持つ** (`recovery.md` §3): exit MUST = ①root cause + ②**guard/test/schema/
  rule/hook へのファイル・関数粒度で trace 可能な仕組み変更** + ③L14 route。**prose 止まりを明示禁止**。
- **意味アンカーは既存**: concept §2.6.1 `regression_dev` signal → Recovery。監査/調査が見つけた regression は
  新 signal を作らずこの既存経路に乗る。本 PLAN は forced-stop-feedback (signal/finding → Recovery 起票候補 →
  人間 yes) の設計系を「研究/監査 finding」へ拡張するもの (parent_design = forced-stop-feedback.md)。
- 根本テーマ = coverage/projection ≠ substance ([[feedback_coverage_not_substance]])。監査 finding を
  「読んで終わり」「backlog 登録止まり」にせず Recovery 経由で**機械強制修正**へ落とす
  ([[feedback_improve_means_implement_not_route]])。

## 1. Scope

### IN (本 PLAN)
- **finding 分類 router を route eval に追加** (`src/workflow/routing-contracts.ts` / `route eval`):
  - `regression` / `premise-gap` / `deviation` → **Recovery 起票** (`PLAN-RECOVERY-NN`)。
  - `feature-gap` / `latent-defect` / `smell` → **Add-feature / Refactor 起票**。
- **research.md に第二 exit を明記**: `ADR(決定)` | `finding(欠陥/regression) → Recovery 起票`。
- **recovery.md の trigger source に「research/audit finding (regression_dev 経由)」を追記** (concept §2.6.1 の
  既存 `regression_dev` に接続。**新 signal を勝手に作らない**)。
- **起票は人間承認ゲート経由** (forced-stop と同型: 起票候補を提示 → 人間 yes → 起票。auto-起票しない)。
- **A-144/A-145 の VER-1(digest advisory)・DB-1(telemetry facade) を初回 Recovery 起票候補**として ledger 化
  (premise-gap/regression 系。SEC-2 injection・smell 未配線・version タグ無しは feature-gap 側へ分岐)。

### OUT (本 PLAN では作らない)
- 新 mode/kind の追加 (Audit mode は不要。concept §2.5 9-mode / VALID_KINDS 12 種を据え置く)。
- 新 signal の追加 (既存 `regression_dev` に接続。signal taxonomy 改変は上位正本案件)。
- 全 finding を Recovery に押し込む実装 (機能欠落は Add-feature/Refactor。分類 router で分岐)。
- GitHub issue への outward-facing 起票 (内部 Recovery/Refactor 起票が本線。issue 化は別判断)。
- いま実装すること (version-up parked。PO 指示で activation 可)。

## 2. Acceptance Criteria
- finding 分類 router が `regression`/`premise-gap`/`deviation` → Recovery、`feature-gap`/`latent-defect`/
  `smell` → Add-feature/Refactor へ route する (unit test で分岐を機械保証)。
- Recovery 起票物が `recovery.md` §3 exit (root cause + guard/test/rule/hook への trace 可能変更 + L14 route)
  を満たす雛形で生成される (**prose 止まり禁止を緩めない**)。
- 起票は人間承認ゲート経由 (auto-起票しない。forced-stop と同じ「起票は人間 yes」)。
- 新 mode/kind/signal を増やさない (VALID_KINDS 12 種不変、drive-model-passage は既存 mode のみ、
  route eval は既存 `regression_dev` に接続)。
- A-144/A-145 の VER-1・DB-1 が Recovery 起票候補として登録され、finding→起票が trace 可能。
- doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。

## 3. Schedule
- mode: serial。
- Step 0: finding 分類スキーマ確定 (`regression`/`premise-gap`/`deviation`/`feature-gap`/`latent-defect`/
  `smell`) と各 → 起票先 mode のマッピング確認 (concept §2.6.1 signal との整合、新 signal を作らないこと)。
- Step 1: `route eval` に finding → 分類 → 起票先 router 実装 (`src/workflow/routing-contracts.ts`) + unit test。
- Step 2: research.md に第二 exit、recovery.md に trigger source を追記 (上位正本 concept §2.6.1 先行確認、
  modes 反映は research.md ヘッダの「規範変更は concept/requirements 先行」順序に従う)。
- Step 3: 起票候補 → 人間承認ゲート配線 (forced-stop-feedback と同型、auto-起票禁止)。
- Step 4: A-144/A-145 の VER-1・DB-1 を初回 Recovery 起票候補として ledger 化 → review → confirmed。

## 4. 壊さない / 再発させない
- 新 mode/kind/signal を勝手に作らない (concept §2.5/§2.6.1・VALID_KINDS 据え置き、
  [[feedback_migration_is_requirements_driven]] / [[feedback_drive_is_specialist_not_mode]])。
- 全 finding を Recovery に押し込まない (機能欠落は Add-feature/Refactor。誤分類は退行、router を unit test で被覆)。
- 起票は人間承認 (auto-起票は agent_runaway 級リスク。起票は人間 yes を必須に)。
- Recovery exit の prose 止まり禁止を緩めない ([[feedback_improve_means_implement_not_route]] / 仕組み化志向)。
- version-up parked。実装は後続版、PO 指示で activation。配布クローズを止めない。
