# A-121 A-120 Multi-Lens Remediation (修正対応)

Date: 2026-06-09
Gate: A-120 (Phase 2 3-lens cross-review) findings remediation
Implementer: Claude Opus (PM-authored TS、[[feedback_ts_native_over_helix_cli]])
**Verdict: 完了**。actionable は実装、既存充足は verify、真の carry は IMP-102..105 へ routing。machine green。

## 対応結果

| A-120 finding | 重度 | 対応 |
|---|---|---|
| recordGuardFire 引数不整合 + guard が typecheck 死角 | Critical-impl | ✅ 実装。`.claude/hooks/agent-guard.ts` を object 引数へ修正、`tsconfig.json` include に `.claude/hooks` 追加 (typecheck green、今後 signature drift を CI 捕捉)。IMP-102。 |
| hasReviewEvidence 不整合重複 | Important | ✅ 実装。l6-completion を review-evidence の export 版へ統一 (gate 齟齬解消)。IMP-103。 |
| fmValue×5 / DbC RE×2 / AST helper×2 / repoRoot×5 重複 | Important | ✅ 実装。`src/lint/shared.ts` に集約 (fmValue=comment 吸収版 / hasDbcTable / normalizePath / lineOf / sourceModule / importedSourceModule)。5 lint に repoRoot 注入 (default=ROOT で挙動保存)。IMP-103。 |
| ハードコードリストの根拠コメント欠落 | Minor | ✅ readability PM_REVIEW_PLAN_PATHS / l6-fr-coverage requiresSubstanceMarker に根拠注記。 |
| worker_model omit で cross_agent 僭称 | Important | ✅ **既存充足** (review-evidence.ts:138 が `!worker_model` を violation 化済)。新規変更なし。 |
| claude-only で cross_agent 記録を mode で塞がない | Important | ⏸ **意図的に未追加**。post-hoc lint は mode が環境で変動しノイズ化 + fraud 検出不能。live gate `evaluateGateReview` が claude-only→intra_runtime_subagent に正しく routing 済 = 正しい着地点。 |
| team run 実委譲未実装 / drive 招集 L7 | Important | ⏭ carry IMP-104 (L7 feature、設計検証サイクルで L7 前倒ししない)。 |
| module-boundary ⇔ domain-boundary 2 重テーブル | Important | ⏭ carry IMP-105 (L6-25/L6-26 の別ルール統合は設計判断。AST helper は共通化済)。 |
| stale slot 可視化 stub | Minor | ✅ **既存充足** (doctor が `agent-slots — ⚠ stale N 件` を surface 済)。 |

## 機械層 (全 green)

- typecheck (`.claude/hooks` 込み) / lint 76 files / **vitest 316 (38 files)** / doctor exit 0。
- doctor: asset-drift OK / coding-rules OK / ddd-tdd-rules OK / l6-fr-coverage 47FR / l6-completion G6 PASS / review-evidence OK。
- DRY 集約は挙動保存 (関連 tests 全 pass、回帰なし)。

## commit

- `d65b8ca` feat(lint): Phase 2 verification + HELIX cutover hardening (asset-drift) — Codex TL 実装 / A-119 cross-review 済 (30 files)。
- `c141a45` fix(lint): A-120 multi-lens cross-review remediation (19 files)。
- push: origin main (2fb98f0..c141a45)。

## carry

- IMP-102/103 = implemented (本対応)。IMP-104 (team-run 実委譲 / drive 招集 L7) / IMP-105 (boundary 統合) = observed。
- `.github/workflows/harness-check.yml` (CI lint+doctor step) は workflow-scope token 必須で未 push (PO 側)。
- `.ut-tdd/audit/*.md` git 追跡は PO 判断。

## 決定

A-120 の actionable findings は解消、既存充足は検証で確認、真の carry は IMP 化。Phase 2 cross-review 由来の修正は完了し machine green を維持。
