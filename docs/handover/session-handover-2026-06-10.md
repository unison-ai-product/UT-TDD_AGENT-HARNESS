# Session Handover — 2026-06-10

## §1 PLAN サマリ

- `PLAN-DISCOVERY-01-workflow-metamodel` (poc): PLAN-DISCOVERY-01 (kind=poc): workflow メタモデル検証 (①必須+②駆動モデル→PLAN合成→駆動プラン→exit→fullback がきれいに回るか)
- `PLAN-L4-00-master` (design): PLAN-L4-00 (Master hub): L4 基本設計 — 必須/選択 triage + child PLAN 合成
- `PLAN-L4-05-workflow-orchestration` (add-design): PLAN-L4-05 (add-design): L4 基本設計 — workflow オーケストレーション外部設計の補追 (9 駆動モデル + Forward spine + 2 工程専門の状態遷移 what / 入口出口 / 担当 b…
- `PLAN-L4-06` (add-design): PLAN-L4-06 (add-design): L4 設計 doc を実装実体へ整合 (drift back-fill) + under-design の明示 defer 化
- `PLAN-L4-13` (design): PLAN-L4-13: 内部資産 drift lint の L4 基本設計増分
- `PLAN-L6-06-handover-mechanism` (add-design): PLAN-L6-06 (add-design): handover 記録機構の機能設計 — session-log PLAN digest → handover 生成 (機械ポインタ CURRENT.json + 人間判断 markdow…
- `PLAN-L6-07-agent-slots` (add-design): PLAN-L6-07 (add-design): agent-slots Layer-2 オーケストレーション機構の機能設計 — slot lifecycle + team strategy schema + 直列化3条件 (IMP-05…
- `PLAN-L6-08-backfill-pairing` (add-design): PLAN-L6-08 (add-design): 駆動モデル back-fill pairing 完全性の機能設計 — KIND_BACKFILL マトリクス + impl⇔Reverse / impl⇔glossary 検査 (IMP-…
- `PLAN-L6-09-governance-enforcement` (add-design): PLAN-L6-09 (add-design): governance enforcement lints の機能設計 — scrum-reverse / backfill-hard / propagation (A/B/C、IMP-06…
- `PLAN-L6-10` (add-design): PLAN-L6-10 (add-design): vmodel pair-freeze lint の機能設計 — design⇔test-design pair_artifact 双方向整合・孤児0 (rule pair-exists/r…
- `PLAN-L6-11-verification-trigger` (add-design): PLAN-L6-11 (add-design): 検証タイミングの機械発火の機能設計 — V-model 層群 freeze 集計 (vmodel-pair-freeze §7、IMP-068)
- `PLAN-L6-12-review-evidence` (add-design): PLAN-L6-12 (add-design): review 前置の機械強制 — review_evidence 機能設計 (confirmed design/impl PLAN が review 証跡なしで素通りするのを doctor…
- `PLAN-L6-21-fr-unit-coverage` (add-design): PLAN-L6-21 (add-design): FR registry to L6 unit coverage
- `PLAN-L6-22-l6-completion-readiness` (add-design): PLAN-L6-22 (add-design): L6 completion readiness lint
- `PLAN-L7-04-handover-mechanism` (add-impl): PLAN-L7-04 (add-impl): handover 記録機構の実装 — src/handover + ut-tdd handover / plan use CLI + session-log 限定 amendment (cur…
- `PLAN-L7-05-biome-debt` (refactor): PLAN-L7-05 (refactor): repo 既存 biome 負債を解消し harness-check CI に biome lint を有効化 (機能変更なし、113 test green 維持が安全網)
- `PLAN-L7-06-handover-enforcement` (add-impl): PLAN-L7-06 (add-impl): handover-on-completion 規律の機械強制 — checkHandoverDiscipline + Stop-hook warn + doctor surface (IMP-…
- `PLAN-L7-21-runtime-adapter-session-lifecycle` (add-impl): PLAN-L7-21 (add-impl): runtime adapter session lifecycle and shared hook entrypoints
- `PLAN-RECOVERY-02-vmodel-canonical` (recovery): PLAN-RECOVERY-02 (recovery): V-model 定義の前提欠落 — 正規式モデルへ収束 + L0-L3 fullback/フィックス
- `PLAN-REVERSE-01-process-docs` (reverse): PLAN-REVERSE-01 (kind=reverse): docs/process 正本化 — DISCOVERY-04 dogfood 実績 (V1-V7) から forward/modes/gates を as-is 復元し g…
- `PLAN-REVERSE-05-handover-mechanism` (reverse): PLAN-REVERSE-05 (reverse/fullback): handover 記録機構を上位整合へ back-fill — §6.8.5 follow-up done 化 + CURRENT.md→.json 表記同期 + §…
- `PLAN-REVERSE-06-workflow-improvements` (reverse): PLAN-REVERSE-06 (reverse/fullback): workflow 改善 (IMP-047/049/050) を上位整合へ back-fill — §6.8.5 handover 強制側 + §G.4 直列/並列規約…
- `PLAN-REVERSE-07-backfill-pairing` (reverse): PLAN-REVERSE-07 (reverse/fullback): back-fill pairing 機構を上位整合へ back-fill — §1.10.E2 + 起票ルール + L0 §10 用語 (IMP-051)。新 FR …
- `PLAN-REVERSE-08-discovery-metamodel` (reverse): PLAN-REVERSE-08 (reverse/normalization): DISCOVERY-01 (workflow メタモデル PoC) confirmed を上位整合へ — concept §2.5 Discovery 定義…
- `PLAN-REVERSE-12` (reverse): PLAN-REVERSE-12 (reverse/back-fill): review_evidence 機械強制を governance へ合流 — requirements §7.8.7 機械強制注記 + concept §10 用語…

## §2 成果物 (commit / files)

- `PLAN-DISCOVERY-01-workflow-metamodel`
- `PLAN-L4-00-master`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
- `PLAN-L4-05-workflow-orchestration`
- `PLAN-L4-06`
- `PLAN-L4-13`
  - commit: 86c61fa
  - file: Edit src/cli.ts
  - file: Edit .claude/hooks/session-log.ts
- `PLAN-L6-06-handover-mechanism`
- `PLAN-L6-07-agent-slots`
- `PLAN-L6-08-backfill-pairing`
- `PLAN-L6-09-governance-enforcement`
- `PLAN-L6-10`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
- `PLAN-L6-11-verification-trigger`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
- `PLAN-L6-12-review-evidence`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\improvement-backlog.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
- `PLAN-L6-21-fr-unit-coverage`
- `PLAN-L6-22-l6-completion-readiness`
  - commit: 0047f5b
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\audit\A-108-orphan-impl-vs-plan.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\improvement-backlog.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\audit\A-110-l6-independent-reaudit.md
- `PLAN-L7-04-handover-mechanism`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\handover\index.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-05-handover-mechanism.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-requirements_v1.2.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-concept_v3.1.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L1-requirements\functional-requirements.md
- `PLAN-L7-05-biome-debt`
- `PLAN-L7-06-handover-enforcement`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\runtime\agent-slots.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\runtime\agent-slots.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\doctor\index.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\agent-slots.test.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.claude\hooks\agent-guard.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\agent-slots.test.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\schema\team.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\teams\example-review-team.yaml
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\team-schema.test.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\teams\example-review-team.yaml
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\doctor.test.ts
  - file: Write C:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L6-function-design\agent-slots.md
  - file: Edit C:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\test-design\harness\L7-unit-test-design.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.claude\CLAUDE.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-requirements_v1.2.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L6-07-agent-slots.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L7-08-agent-slots.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-06-workflow-improvements.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\improvement-backlog.md
- `PLAN-L7-21-runtime-adapter-session-lifecycle`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\test-design\harness\L8-integration-test-design.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L5-00-master.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\audit\A-106-l5-completion-re-review.md
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\feedback_freeze_check…
- `PLAN-RECOVERY-02-vmodel-canonical`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\overview.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L07-implementation.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L08-L14-verification-phase.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L00-L06-design-phase.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\gates.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\gate-design.md
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\project_vmodel_canoni…
  - file: Edit C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\MEMORY.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-04.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
- `PLAN-REVERSE-01-process-docs`
- `PLAN-REVERSE-05-handover-mechanism`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-04.md
- `PLAN-REVERSE-06-workflow-improvements`
- `PLAN-REVERSE-07-backfill-pairing`
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\feedback_impl_must_ba…
- `PLAN-REVERSE-08-discovery-metamodel`
- `PLAN-REVERSE-12`

## §3 Next Action

1. **push**: A-128 remediation commit + `a411940` (ahead 2 想定) を `origin main` へ (workflow scope token 必須、[[project_github_push_workflow_scope]])。IMP-127 は (a) tracked 維持 + 正本更新で解消済 — PO が (b) 除外を選ぶ場合のみ commit から外す (可逆)。
2. **F-7/F-8 (PO 手動、repo 外)**: `~/.claude/settings.json` の ① env.PATH エントリ削除 (`${PATH}` 未展開 → System32 消失) ② OPENAI_API_KEY 平文 allow 2 エントリ削除 + OpenAI 側 key revoke。AI からの編集は permission classifier が拒否 (妥当)。
3. Forward L7 実装 (PLAN-L7-32..35) へ — 外部ツーリング 4 ファミリーの TDD Red entry (L7/L8 carry 宣言済)。

## §4 carry (未了・先送り)

- A-128 remediation 済 (IMP-127..130 implemented)。残 carry: tracked⊆canonical の機械突合 lint (asset-drift 拡張候補)、oracle 宣言⇔実テスト突合 lint (IMP-083 系)。
- 既存 carry 継続: IMP-087/088 (A-108 orphan 三つ組)、doctor scaffold stub (dependency-drift / regression expansion)。

## §5 未了 PO 判断

- **F-7/F-8 (repo 外、§3-2 参照)**: user-global settings.json の PATH エントリと API key 平文の手動除去 + key revoke。
- IMP-127 の (a) tracked 維持は PO の a411940 意図に沿って確定した — 異議があれば push 前に申し出 (git rm --cached で可逆)。

## §6 壊さない / 再発させない

- **runtime-hook-entrypoints 5 件 fail は repo 退行ではない** ([[project_path_injection_breaks_spawn_tests]])。`PATH="$PATH:/c/Windows/System32:/c/Windows" npx vitest run` で 329/329 green (A-128 で実証)。env を直さず test を「直す」な。
- 確定基準更新: typecheck/lint clean・**vitest 329** (309→329 は a411940 増分)・doctor exit 0。
- A-127 boundary 維持: 外部ツーリングの runtime 実装は L7 PLAN + TDD Red + Reverse closure 経由のみ (A-128 でも source 実装はしていない)。

---

# Session Handover — 2026-06-10

## §1 PLAN サマリ

- `PLAN-DISCOVERY-01-workflow-metamodel` (poc): PLAN-DISCOVERY-01 (kind=poc): workflow メタモデル検証 (①必須+②駆動モデル→PLAN合成→駆動プラン→exit→fullback がきれいに回るか)
- `PLAN-L4-00-master` (design): PLAN-L4-00 (Master hub): L4 基本設計 — 必須/選択 triage + child PLAN 合成
- `PLAN-L4-05-workflow-orchestration` (add-design): PLAN-L4-05 (add-design): L4 基本設計 — workflow オーケストレーション外部設計の補追 (9 駆動モデル + Forward spine + 2 工程専門の状態遷移 what / 入口出口 / 担当 b…
- `PLAN-L4-06` (add-design): PLAN-L4-06 (add-design): L4 設計 doc を実装実体へ整合 (drift back-fill) + under-design の明示 defer 化
- `PLAN-L4-13` (design): PLAN-L4-13: 内部資産 drift lint の L4 基本設計増分
- `PLAN-L6-06-handover-mechanism` (add-design): PLAN-L6-06 (add-design): handover 記録機構の機能設計 — session-log PLAN digest → handover 生成 (機械ポインタ CURRENT.json + 人間判断 markdow…
- `PLAN-L6-07-agent-slots` (add-design): PLAN-L6-07 (add-design): agent-slots Layer-2 オーケストレーション機構の機能設計 — slot lifecycle + team strategy schema + 直列化3条件 (IMP-05…
- `PLAN-L6-08-backfill-pairing` (add-design): PLAN-L6-08 (add-design): 駆動モデル back-fill pairing 完全性の機能設計 — KIND_BACKFILL マトリクス + impl⇔Reverse / impl⇔glossary 検査 (IMP-…
- `PLAN-L6-09-governance-enforcement` (add-design): PLAN-L6-09 (add-design): governance enforcement lints の機能設計 — scrum-reverse / backfill-hard / propagation (A/B/C、IMP-06…
- `PLAN-L6-10` (add-design): PLAN-L6-10 (add-design): vmodel pair-freeze lint の機能設計 — design⇔test-design pair_artifact 双方向整合・孤児0 (rule pair-exists/r…
- `PLAN-L6-11-verification-trigger` (add-design): PLAN-L6-11 (add-design): 検証タイミングの機械発火の機能設計 — V-model 層群 freeze 集計 (vmodel-pair-freeze §7、IMP-068)
- `PLAN-L6-12-review-evidence` (add-design): PLAN-L6-12 (add-design): review 前置の機械強制 — review_evidence 機能設計 (confirmed design/impl PLAN が review 証跡なしで素通りするのを doctor…
- `PLAN-L6-21-fr-unit-coverage` (add-design): PLAN-L6-21 (add-design): FR registry to L6 unit coverage
- `PLAN-L6-22-l6-completion-readiness` (add-design): PLAN-L6-22 (add-design): L6 completion readiness lint
- `PLAN-L7-04-handover-mechanism` (add-impl): PLAN-L7-04 (add-impl): handover 記録機構の実装 — src/handover + ut-tdd handover / plan use CLI + session-log 限定 amendment (cur…
- `PLAN-L7-05-biome-debt` (refactor): PLAN-L7-05 (refactor): repo 既存 biome 負債を解消し harness-check CI に biome lint を有効化 (機能変更なし、113 test green 維持が安全網)
- `PLAN-L7-06-handover-enforcement` (add-impl): PLAN-L7-06 (add-impl): handover-on-completion 規律の機械強制 — checkHandoverDiscipline + Stop-hook warn + doctor surface (IMP-…
- `PLAN-L7-21-runtime-adapter-session-lifecycle` (add-impl): PLAN-L7-21 (add-impl): runtime adapter session lifecycle and shared hook entrypoints
- `PLAN-L7-32` (add-impl): PLAN-L7-32 (add-impl): cross-artifact relation graph and verification profile projection
- `PLAN-RECOVERY-02-vmodel-canonical` (recovery): PLAN-RECOVERY-02 (recovery): V-model 定義の前提欠落 — 正規式モデルへ収束 + L0-L3 fullback/フィックス
- `PLAN-REVERSE-01-process-docs` (reverse): PLAN-REVERSE-01 (kind=reverse): docs/process 正本化 — DISCOVERY-04 dogfood 実績 (V1-V7) から forward/modes/gates を as-is 復元し g…
- `PLAN-REVERSE-05-handover-mechanism` (reverse): PLAN-REVERSE-05 (reverse/fullback): handover 記録機構を上位整合へ back-fill — §6.8.5 follow-up done 化 + CURRENT.md→.json 表記同期 + §…
- `PLAN-REVERSE-06-workflow-improvements` (reverse): PLAN-REVERSE-06 (reverse/fullback): workflow 改善 (IMP-047/049/050) を上位整合へ back-fill — §6.8.5 handover 強制側 + §G.4 直列/並列規約…
- `PLAN-REVERSE-07-backfill-pairing` (reverse): PLAN-REVERSE-07 (reverse/fullback): back-fill pairing 機構を上位整合へ back-fill — §1.10.E2 + 起票ルール + L0 §10 用語 (IMP-051)。新 FR …
- `PLAN-REVERSE-08-discovery-metamodel` (reverse): PLAN-REVERSE-08 (reverse/normalization): DISCOVERY-01 (workflow メタモデル PoC) confirmed を上位整合へ — concept §2.5 Discovery 定義…
- `PLAN-REVERSE-12` (reverse): PLAN-REVERSE-12 (reverse/back-fill): review_evidence 機械強制を governance へ合流 — requirements §7.8.7 機械強制注記 + concept §10 用語…

## §2 成果物 (commit / files)

- `PLAN-DISCOVERY-01-workflow-metamodel`
- `PLAN-L4-00-master`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
- `PLAN-L4-05-workflow-orchestration`
- `PLAN-L4-06`
- `PLAN-L4-13`
  - commit: 86c61fa
  - file: Edit src/cli.ts
  - file: Edit .claude/hooks/session-log.ts
- `PLAN-L6-06-handover-mechanism`
- `PLAN-L6-07-agent-slots`
- `PLAN-L6-08-backfill-pairing`
- `PLAN-L6-09-governance-enforcement`
- `PLAN-L6-10`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
- `PLAN-L6-11-verification-trigger`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
- `PLAN-L6-12-review-evidence`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\improvement-backlog.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
- `PLAN-L6-21-fr-unit-coverage`
- `PLAN-L6-22-l6-completion-readiness`
  - commit: 0047f5b
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\audit\A-108-orphan-impl-vs-plan.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\improvement-backlog.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\audit\A-110-l6-independent-reaudit.md
- `PLAN-L7-04-handover-mechanism`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\handover\index.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-05-handover-mechanism.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-requirements_v1.2.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-concept_v3.1.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L1-requirements\functional-requirements.md
- `PLAN-L7-05-biome-debt`
- `PLAN-L7-06-handover-enforcement`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\runtime\agent-slots.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\runtime\agent-slots.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\doctor\index.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\agent-slots.test.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.claude\hooks\agent-guard.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\agent-slots.test.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\schema\team.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\teams\example-review-team.yaml
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\team-schema.test.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\teams\example-review-team.yaml
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\doctor.test.ts
  - file: Write C:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L6-function-design\agent-slots.md
  - file: Edit C:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\test-design\harness\L7-unit-test-design.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.claude\CLAUDE.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-requirements_v1.2.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L6-07-agent-slots.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L7-08-agent-slots.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-06-workflow-improvements.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\improvement-backlog.md
- `PLAN-L7-21-runtime-adapter-session-lifecycle`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\test-design\harness\L8-integration-test-design.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L5-00-master.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\audit\A-106-l5-completion-re-review.md
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\feedback_freeze_check…
- `PLAN-L7-32`
  - commit: f171e3f
- `PLAN-RECOVERY-02-vmodel-canonical`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\overview.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L07-implementation.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L08-L14-verification-phase.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L00-L06-design-phase.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\gates.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\gate-design.md
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\project_vmodel_canoni…
  - file: Edit C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\MEMORY.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-04.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
- `PLAN-REVERSE-01-process-docs`
- `PLAN-REVERSE-05-handover-mechanism`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-04.md
- `PLAN-REVERSE-06-workflow-improvements`
- `PLAN-REVERSE-07-backfill-pairing`
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\feedback_impl_must_ba…
- `PLAN-REVERSE-08-discovery-metamodel`
- `PLAN-REVERSE-12`

## §3 Next Action

<!-- TODO(human): 順序付き次手 -->

## §4 carry (未了・先送り)

<!-- TODO(human): carry -->

## §5 未了 PO 判断

<!-- TODO(human): escalation -->

## §6 壊さない / 再発させない

<!-- TODO(human): 壊さない注意 -->

---

# Session Handover — 2026-06-10

## §1 PLAN サマリ

- `PLAN-DISCOVERY-01-workflow-metamodel` (poc): PLAN-DISCOVERY-01 (kind=poc): workflow メタモデル検証 (①必須+②駆動モデル→PLAN合成→駆動プラン→exit→fullback がきれいに回るか)
- `PLAN-L4-00-master` (design): PLAN-L4-00 (Master hub): L4 基本設計 — 必須/選択 triage + child PLAN 合成
- `PLAN-L4-05-workflow-orchestration` (add-design): PLAN-L4-05 (add-design): L4 基本設計 — workflow オーケストレーション外部設計の補追 (9 駆動モデル + Forward spine + 2 工程専門の状態遷移 what / 入口出口 / 担当 b…
- `PLAN-L4-06` (add-design): PLAN-L4-06 (add-design): L4 設計 doc を実装実体へ整合 (drift back-fill) + under-design の明示 defer 化
- `PLAN-L4-13` (design): PLAN-L4-13: 内部資産 drift lint の L4 基本設計増分
- `PLAN-L6-06-handover-mechanism` (add-design): PLAN-L6-06 (add-design): handover 記録機構の機能設計 — session-log PLAN digest → handover 生成 (機械ポインタ CURRENT.json + 人間判断 markdow…
- `PLAN-L6-07-agent-slots` (add-design): PLAN-L6-07 (add-design): agent-slots Layer-2 オーケストレーション機構の機能設計 — slot lifecycle + team strategy schema + 直列化3条件 (IMP-05…
- `PLAN-L6-08-backfill-pairing` (add-design): PLAN-L6-08 (add-design): 駆動モデル back-fill pairing 完全性の機能設計 — KIND_BACKFILL マトリクス + impl⇔Reverse / impl⇔glossary 検査 (IMP-…
- `PLAN-L6-09-governance-enforcement` (add-design): PLAN-L6-09 (add-design): governance enforcement lints の機能設計 — scrum-reverse / backfill-hard / propagation (A/B/C、IMP-06…
- `PLAN-L6-10` (add-design): PLAN-L6-10 (add-design): vmodel pair-freeze lint の機能設計 — design⇔test-design pair_artifact 双方向整合・孤児0 (rule pair-exists/r…
- `PLAN-L6-11-verification-trigger` (add-design): PLAN-L6-11 (add-design): 検証タイミングの機械発火の機能設計 — V-model 層群 freeze 集計 (vmodel-pair-freeze §7、IMP-068)
- `PLAN-L6-12-review-evidence` (add-design): PLAN-L6-12 (add-design): review 前置の機械強制 — review_evidence 機能設計 (confirmed design/impl PLAN が review 証跡なしで素通りするのを doctor…
- `PLAN-L6-21-fr-unit-coverage` (add-design): PLAN-L6-21 (add-design): FR registry to L6 unit coverage
- `PLAN-L6-22-l6-completion-readiness` (add-design): PLAN-L6-22 (add-design): L6 completion readiness lint
- `PLAN-L6-33-tool-adapter-probes` (add-design): PLAN-L6-33 (add-design): graph and diagram tool adapter probes
- `PLAN-L7-04-handover-mechanism` (add-impl): PLAN-L7-04 (add-impl): handover 記録機構の実装 — src/handover + ut-tdd handover / plan use CLI + session-log 限定 amendment (cur…
- `PLAN-L7-05-biome-debt` (refactor): PLAN-L7-05 (refactor): repo 既存 biome 負債を解消し harness-check CI に biome lint を有効化 (機能変更なし、113 test green 維持が安全網)
- `PLAN-L7-06-handover-enforcement` (add-impl): PLAN-L7-06 (add-impl): handover-on-completion 規律の機械強制 — checkHandoverDiscipline + Stop-hook warn + doctor surface (IMP-…
- `PLAN-L7-21-runtime-adapter-session-lifecycle` (add-impl): PLAN-L7-21 (add-impl): runtime adapter session lifecycle and shared hook entrypoints
- `PLAN-L7-32` (add-impl): PLAN-L7-32 (add-impl): cross-artifact relation graph and verification profile projection
- `PLAN-RECOVERY-02-vmodel-canonical` (recovery): PLAN-RECOVERY-02 (recovery): V-model 定義の前提欠落 — 正規式モデルへ収束 + L0-L3 fullback/フィックス
- `PLAN-REVERSE-01-process-docs` (reverse): PLAN-REVERSE-01 (kind=reverse): docs/process 正本化 — DISCOVERY-04 dogfood 実績 (V1-V7) から forward/modes/gates を as-is 復元し g…
- `PLAN-REVERSE-05-handover-mechanism` (reverse): PLAN-REVERSE-05 (reverse/fullback): handover 記録機構を上位整合へ back-fill — §6.8.5 follow-up done 化 + CURRENT.md→.json 表記同期 + §…
- `PLAN-REVERSE-06-workflow-improvements` (reverse): PLAN-REVERSE-06 (reverse/fullback): workflow 改善 (IMP-047/049/050) を上位整合へ back-fill — §6.8.5 handover 強制側 + §G.4 直列/並列規約…
- `PLAN-REVERSE-07-backfill-pairing` (reverse): PLAN-REVERSE-07 (reverse/fullback): back-fill pairing 機構を上位整合へ back-fill — §1.10.E2 + 起票ルール + L0 §10 用語 (IMP-051)。新 FR …
- `PLAN-REVERSE-08-discovery-metamodel` (reverse): PLAN-REVERSE-08 (reverse/normalization): DISCOVERY-01 (workflow メタモデル PoC) confirmed を上位整合へ — concept §2.5 Discovery 定義…
- `PLAN-REVERSE-12` (reverse): PLAN-REVERSE-12 (reverse/back-fill): review_evidence 機械強制を governance へ合流 — requirements §7.8.7 機械強制注記 + concept §10 用語…

## §2 成果物 (commit / files)

- `PLAN-DISCOVERY-01-workflow-metamodel`
- `PLAN-L4-00-master`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
- `PLAN-L4-05-workflow-orchestration`
- `PLAN-L4-06`
- `PLAN-L4-13`
  - commit: 86c61fa
  - file: Edit src/cli.ts
  - file: Edit .claude/hooks/session-log.ts
- `PLAN-L6-06-handover-mechanism`
- `PLAN-L6-07-agent-slots`
- `PLAN-L6-08-backfill-pairing`
- `PLAN-L6-09-governance-enforcement`
- `PLAN-L6-10`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
- `PLAN-L6-11-verification-trigger`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
- `PLAN-L6-12-review-evidence`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\improvement-backlog.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
- `PLAN-L6-21-fr-unit-coverage`
- `PLAN-L6-22-l6-completion-readiness`
  - commit: 0047f5b
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\audit\A-108-orphan-impl-vs-plan.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\improvement-backlog.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\audit\A-110-l6-independent-reaudit.md
- `PLAN-L6-33-tool-adapter-probes`
  - commit: 78716bd
- `PLAN-L7-04-handover-mechanism`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\handover\index.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-05-handover-mechanism.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-requirements_v1.2.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-concept_v3.1.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L1-requirements\functional-requirements.md
- `PLAN-L7-05-biome-debt`
- `PLAN-L7-06-handover-enforcement`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\runtime\agent-slots.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\runtime\agent-slots.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\doctor\index.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\agent-slots.test.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.claude\hooks\agent-guard.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\agent-slots.test.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\schema\team.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\teams\example-review-team.yaml
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\team-schema.test.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\teams\example-review-team.yaml
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\doctor.test.ts
  - file: Write C:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L6-function-design\agent-slots.md
  - file: Edit C:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\test-design\harness\L7-unit-test-design.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.claude\CLAUDE.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-requirements_v1.2.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L6-07-agent-slots.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L7-08-agent-slots.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-06-workflow-improvements.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\improvement-backlog.md
- `PLAN-L7-21-runtime-adapter-session-lifecycle`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\test-design\harness\L8-integration-test-design.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L5-00-master.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\audit\A-106-l5-completion-re-review.md
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\feedback_freeze_check…
- `PLAN-L7-32`
  - commit: f171e3f
- `PLAN-RECOVERY-02-vmodel-canonical`
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\overview.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L07-implementation.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L08-L14-verification-phase.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\forward\L00-L06-design-phase.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\process\gates.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\gate-design.md
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\project_vmodel_canoni…
  - file: Edit C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\MEMORY.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-04.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
- `PLAN-REVERSE-01-process-docs`
- `PLAN-REVERSE-05-handover-mechanism`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-04.md
- `PLAN-REVERSE-06-workflow-improvements`
- `PLAN-REVERSE-07-backfill-pairing`
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\feedback_impl_must_ba…
- `PLAN-REVERSE-08-discovery-metamodel`
- `PLAN-REVERSE-12`

## §3 Next Action

<!-- TODO(human): 順序付き次手 -->

## §4 carry (未了・先送り)

<!-- TODO(human): carry -->

## §5 未了 PO 判断

<!-- TODO(human): escalation -->

## §6 壊さない / 再発させない

<!-- TODO(human): 壊さない注意 -->


---

# 現行 handover (2026-06-10 PM 追記) — Phase 2 再レビュー完了 + ツール/フロント方向確定

> 注: 上部に CLI 自動生成の §1-§2 ブロックが複数あるが (handover 再生成による重複)、人手節 §3-§6 の正本は本「現行 handover」セクション。

## このセッションでやったこと (時系列)

1. **A-128 Phase 2 増築再レビュー** (commit a411940/23a9b86 の差分): code-reviewer / qa-test / security-audit / pmo-sonnet の 4 視点 + PM 裏取り。Critical 0。所見 F-1〜F-8 → IMP-127〜130 起票。
2. **A-128 remediation**: IMP-127 (tracked 化方針整合) / IMP-128 (L7/L8 carry 宣言) / IMP-129 (requirements⇔physical-data 降下齟齬 5 点) / IMP-130 (verification-profile hardening + テスト強化)。code-reviewer APPROVE、vitest 332/332、doctor exit 0。
3. **F-7 PATH 注入の repo 側耐性化**: src/runtime/detect.ts (where.exe) + tests/runtime-hook-entrypoints.test.ts (cmd.exe) を %SystemRoot% canonical 解決へ。壊れた PATH でも 332/332 green。
4. **F-8 OpenAI key**: settings.json から平文 2 エントリ削除 (PO 明示指示)。OpenAI 側に key 不存在 (失効済み) を PO 確認 → 完全クローズ。
5. **settings.json**: env.PATH の ${PATH} 未展開エントリも削除 (System32 消失の根本原因、反映は次 session)。
6. **gh workflow スコープ**: PO がデバイス認証で unison-ai-product トークンに workflow 付与 → push 経路が通った。
7. **A-129 履歴書き換え**: 全 259 commit の author email を 253932653+unison-ai-product@users.noreply.github.com へ (filter-branch) → force push。Contributors から RetryYN 消滅、unison-ai-product のみ。gh の RetryYN 連携も logout 済。
8. **Phase 2 ツール棚卸し (IMP-131)**: tool adapter (insight 系) を `ut-tdd setup graph-tools` + アナウンスへ降格、MCP/verification profile (must-tool 系) は profile 維持。
9. **Phase B フロント/同期方向確定** (ADR-005 Follow-ups, direction-only): 中央 UI = SQLite + GitHub webhook + 定期 reconcile + XServer VPS。

## §3 Next Action

1. **Forward L7 実装へ**: 設計検証サイクルゲート (旧 GATE-A、L0-L6) は **per-layer Forward gate G0.5〜G6 が gate-design §2 で PO サインオフ済**で着地済 (G2 のみ DEFER)。横断 band は機械発火 (doctor) であって別建ての手動 accept ceremony は持たない (PO 2026-06-10 是正「フォワードのワークフロー上じゃない？」、PLAN-REVERSE-36 で命名正規化済)。よって定常は Forward で Phase 3 (L7) へ降下。待機列の先頭 = 外部ツーリング (PLAN-L7-32 relation graph / L7-33 MCP profile / L7-34 setup graph-tools へ改訂済 / L7-35 doc export) の TDD Red entry。
2. backend-first 継続: core を固めてから Phase B (中央 UI + 同期) を起票。方向は ADR-005 Follow-ups + [[project_harness_central_ui_backend_first]]。

## §4 carry (未了・先送り)

- 設計検証サイクルゲート (旧 GATE-A) = per-layer Forward gate (G0.5〜G6) で PO サインオフ済・横断 band は機械発火 (別 accept ceremony なし、PLAN-REVERSE-36 で reframe 済)。実装検証サイクルゲート (旧 GATE-B、L0-L7) の機械発火は L7 freeze 後に VERIFICATION_GROUPS 追加 (carry)。
- IMP-128 の oracle⇔実テスト突合 lint (IMP-083 系)、IMP-127 の tracked⊆canonical 機械突合 lint (asset-drift 拡張) は降下先候補のまま。
- 既存 carry: IMP-087/088 (A-108 orphan 三つ組)、doctor scaffold stub (dependency-drift / regression expansion)。
- Phase B 中央 UI/同期は direction-only (未 freeze・未実装)。

## §5 未了 PO 判断

- (解決済) 設計検証サイクルゲート (旧 GATE-A) の「正式受入」は別建てゲートでなく per-layer Forward gate G0.5〜G6 の PO サインオフが着地点 = 済 (PLAN-REVERSE-36、PO 2026-06-10 是正)。
- Phase B 着手タイミング (core 安定をどこで「フロント要件を出せる」と判断するか)。
- 外部ツーリング (relation graph / doc export / MCP profile) の実装優先順位。

## §6 壊さない / 再発させない

- commit ID が A-129 で全変更。docs の旧 commit 番号は .ut-tdd/evidence/history-rewrite-2026-06-10-hash-map.txt で引く。書き換え前バックアップ = c:\tmp\ut-tdd-pre-rewrite-backup.bundle。
- push は gh トークン経由必須: 素の git push は GCM の workflow なしトークンで失敗。gh auth token --user unison-ai-product + temp credential file で push ([[project_github_push_workflow_scope]])。force push 中に git プロセスを kill しない (repack 後に放置で通る、A-129 教訓)。
- PATH 注入耐性: detect.ts/test は %SystemRoot% 解決済 ([[project_path_injection_breaks_spawn_tests]])。
- ツール判断はミッションで測る: harness 自身が CLI/UI 無しを理由にツールを trim しない。harness 自身も中央 UI を持つ (deferred、[[feedback_judge_tooling_by_mission_not_self_scope]] / [[project_harness_central_ui_backend_first]])。
- insight (adapter) と must-tool (MCP) を混同しない (IMP-131): adapter は setup+announce、MCP は profile+機械着地。
- 確定基準: typecheck/lint clean・vitest 332・doctor exit 0。
