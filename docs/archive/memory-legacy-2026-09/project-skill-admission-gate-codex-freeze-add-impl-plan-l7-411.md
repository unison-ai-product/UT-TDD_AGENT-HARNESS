---
memory_id: memory:project:skill-admission-gate-codex-freeze-add-impl-plan-l7-411
kind: project
title: "skill admission gate 実装依頼 (Codex): 設計freeze済 add-impl残 PLAN-L7-411"
tags: ["codex", "fail-open", "handover", "implementation", "plan-l6-67", "plan-l7-411", "skill-admission", "skill-gate"]
updated_at: 2026-07-09T22:32:11+09:00
---

skill admission gate (スキル管理ゲート) の実装を Codex に依頼する。設計は freeze 済み、残るは add-impl。

## 現状 (2026-07-09)
- 設計正本: docs/design/harness/L6-function-design/skill-admission.md
- owning PLAN: PLAN-L6-67-skill-admission-gate (Codex が所有・confirmed 化・design freeze 済と記載)
- add-impl 候補: PLAN-L7-411-skill-admission-gate (draft)。Codex が採用し、重複 PLAN を残さない。
- Reverse pairing: add-impl には Reverse back-fill 義務 (concept §10.3 用語 back-merge)。PLAN-REVERSE-411-skill-admission-backfill を起票済み。

## 実装対象 (skill-admission.md §4-§8 が正本、本文で重複記述しない)
1. 判定関数群 src/skill-engine/admission.ts (純関数・決定論):
   - analyzeSkillFit (analyzeSkillAssignments へ委譲 + readability + trigger 衝突)
   - computeSkillNovelty (metadataOverlap へ委譲、凍結 snapshot、band = novel/ambiguous/duplicate)
   - analyzeDecisionPoints (when / choose A over B / because 構造 + 一般語 denylist)
   - repairSkillCandidate (冪等、本文の意味は書き換えない)
   - resolveAdmission (default-closed 判定表 §5)
   - renderSkillCatalogIndex (frontmatter SSoT の外部化カタログ生成、SKILL_MAP 手保守廃止)
2. src/lint/skill-supersession.ts (analyzePlanSupersession と同型、双方向強制)
3. doctor skill-admission-coverage (NEW-only fail-close、決定論残渣のみ、baseline 54 件を fail-close しない)
4. CLI ut-tdd skill admit (judge dispatch = 既存 advisor / gate 再利用)
5. ledger .ut-tdd/skill_admissions/*.json -> harness.db projection、quarantine は scan root 外
6. policy .ut-tdd/skill-admission-policy.json (閾値・denylist を外部化)
7. tests/skill-admission.test.ts (U-SKILL-ADMIT、AC-1..9)

## 死守 (fail-open 封止 = 本機能の核心)
- judge に admit 権を与えない: verdict は reject / flag / no_objection のみ。admit-new は機械3点合致 (overlap < 閾値 かつ decision_points 有効 かつ cross_agent verdict が比較 N snapshot 付きで台帳記録) かつ judge = no_objection でのみ default-closed に確定。judge 単独では admit しない。
- judge / LLM を CI・doctor 合否条件に絶対入れない (非決定性で CI が壊れる)。doctor は残渣のみ検証。
- 単一 runtime の judge は reject / flag 限定 (no_objection 不可 = 自己肯定で admit させない)。
- quarantine は scan root の外 (skills/ .ut-tdd/skills/ docs/skills/ の外) に置く (却下 skill の再浮上防止)。
- baseline は既存 54 skill を content hash で凍結し NEW-only (新規 skill のみ admission 必須、既存を fail-close しない)。
- 既存 gate / advisor / plan-supersession / skill-scoring / skill-assignment へ委譲。新規の類似度 / fit 実装を書かない (三重真実防止)。

## 検証
- 検証は HEAD 基準。freeze-readiness = readability / ut-tdd plan lint / ut-tdd doctor exit 0 を pair-freeze 前に。
- 実装は別ブランチ推奨 (現 shared tree は work/l4-21)。
- add-impl 完了時は status = confirmed + review_evidence 記録 (hybrid は cross_agent、worker != reviewer provider)。

## direction-check (Claude が安全側デフォルトで確定、PO 未明示承認。異論あれば PO へ)
1. novelty 3-band (novel / ambiguous / duplicate)、ambiguous は人間 flag。
2. decision_points を新規 skill の必須構造項目に格上げ (一般語のみは機械 reject)。
3. 単一 runtime では新規 skill が auto admit されず人間 flag 止まり (安全側)。
