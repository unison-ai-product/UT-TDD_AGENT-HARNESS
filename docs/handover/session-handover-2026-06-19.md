# Session Handover — 2026-06-19

## §1 PLAN サマリ

- `A-136-cycle-p4-verification-audit` (unknown): A-136-cycle-p4-verification-audit
- `PLAN-DISCOVERY-01-workflow-metamodel` (poc): PLAN-DISCOVERY-01 (kind=poc): workflow メタモデル検証 (①必須+②駆動モデル→PLAN合成→駆動プラン→exit→fullback がきれいに回るか)
- `PLAN-DISCOVERY-05-roadmap-registration` (poc): PLAN-DISCOVERY-05 (kind=poc): 工程表 (gated layer-decomposition roadmap) を第一級・機械登録エンティティ化する metamodel 検証
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
- `PLAN-L6-35-descent-obligation` (add-design): PLAN-L6-35 (add-design): descent-obligation ledger の機能設計 — 上流 FR + 層隣接 matrix から下流/pair artifact を生成し不在を fail-close (FR…
- `PLAN-L7-04-handover-mechanism` (add-impl): PLAN-L7-04 (add-impl): handover 記録機構の実装 — src/handover + ut-tdd handover / plan use CLI + session-log 限定 amendment (cur…
- `PLAN-L7-05-biome-debt` (refactor): PLAN-L7-05 (refactor): repo 既存 biome 負債を解消し harness-check CI に biome lint を有効化 (機能変更なし、113 test green 維持が安全網)
- `PLAN-L7-06-handover-enforcement` (add-impl): PLAN-L7-06 (add-impl): handover-on-completion 規律の機械強制 — checkHandoverDiscipline + Stop-hook warn + doctor surface (IMP-…
- `PLAN-L7-21-runtime-adapter-session-lifecycle` (add-impl): PLAN-L7-21 (add-impl): runtime adapter session lifecycle and shared hook entrypoints
- `PLAN-L7-32-cross-artifact-relation-graph` (add-impl): PLAN-L7-32 (add-impl): cross-artifact relation graph and verification profile projection
- `PLAN-L7-35` (add-impl): PLAN-L7-35 (add-impl): canonical document export
- `PLAN-L7-43` (add-impl): PLAN-L7-43 (add-impl): 実装検証サイクルゲート L0-L7 verification group
- `PLAN-L7-44-harness-db-master` (impl): PLAN-L7-44 (Master hub / 工程表): harness.db L7 実装セグメント — gate+span 分解
- `PLAN-L7-48-readiness-guardrail` (impl): PLAN-L7-48: harness.db automation-readiness + guardrail-ledger
- `PLAN-L7-52-l7-completion-audit-closure` (impl): PLAN-L7-52: L7 completion audit — risk reduction closure (cycle 1)
- `PLAN-L7-53-learning-engine` (impl): PLAN-L7-53: skill learning engine — evaluation, trend, and recommendation feedback
- `PLAN-L7-54-merged-plan-status-gate` (impl): PLAN-L7-54: merged-plan-status hard gate — merge 済み artifact + draft PLAN の不整合検出
- `PLAN-L7-55` (impl): PLAN-L7-55: plan-artifact-existence hard gate — 完了宣言 PLAN の phantom artifact 検出
- `PLAN-L7-57-token-telemetry-tracker` (impl): PLAN-L7-57: cross-runtime token telemetry tracker — FR-L1-38 cost 効率の実データ化
- `PLAN-L7-58-telemetry-cost-enrichment` (impl): PLAN-L7-58: token telemetry の $ cost enrichment + ut-tdd telemetry scan CLI 配線 (FR-L1-38 follow-up)
- `PLAN-L7-68` (troubleshoot): PLAN-L7-68 (troubleshoot): provider dispatch portability and handover split
- `PLAN-L7-70-skill-pack-curation` (impl): PLAN-L7-70 (impl): skill pack の UT-TDD substance curate (FR-L1-47 / FR-L1-12)
- `PLAN-L7-71-slash-commands` (impl): PLAN-L7-71 (impl): .claude/commands slash-command transplant (FR-L1-12)
- `PLAN-L7-72` (impl): PLAN-L7-72 (impl): ut-tdd task classify public CLI (FR-L1-39)
- `PLAN-L7-73-claude-native-semver-resolution` (troubleshoot): PLAN-L7-73 (troubleshoot): semver-newest native Claude resolution (A-137 #6)
- `PLAN-L7-74-task-risk-whole-word-match` (troubleshoot): PLAN-L7-74 (troubleshoot): whole-word escalation-risk matching in task classify
- `PLAN-L7-75-cost-tiered-provider-router` (impl): PLAN-L7-75 (impl): cost-tiered dual-provider role router (§7.8.7.1 / §1.8 / FR-L1-39)
- `PLAN-L7-76` (troubleshoot): PLAN-L7-76 (troubleshoot): L7 reliability remediation — DB rebuild atomicity, non-git doctor, agent-slots atomic write
- `PLAN-L7-77-codex-stdin-prompt-dispatch` (troubleshoot): PLAN-L7-77 (troubleshoot): codex dispatch delivers the prompt via stdin so Windows .cmd shell-wrapping cannot truncate …
- `PLAN-M-00` (design): PLAN-VERIFY-CUTOVER-00: L8-L14 verification band + legacy-source isolation backfill
- `PLAN-RECOVERY-02-vmodel-canonical` (recovery): PLAN-RECOVERY-02 (recovery): V-model 定義の前提欠落 — 正規式モデルへ収束 + L0-L3 fullback/フィックス
- `PLAN-RECOVERY-04-roadmap-definition` (recovery): PLAN-RECOVERY-04 (recovery): 工程表の定義の前提欠落 — 人間向け全プログラム台帳へ収束 + 製本化 fullback
- `PLAN-REVERSE-01-process-docs` (reverse): PLAN-REVERSE-01 (kind=reverse): docs/process 正本化 — DISCOVERY-04 dogfood 実績 (V1-V7) から forward/modes/gates を as-is 復元し g…
- `PLAN-REVERSE-05-handover-mechanism` (reverse): PLAN-REVERSE-05 (reverse/fullback): handover 記録機構を上位整合へ back-fill — §6.8.5 follow-up done 化 + CURRENT.md→.json 表記同期 + §…
- `PLAN-REVERSE-06-workflow-improvements` (reverse): PLAN-REVERSE-06 (reverse/fullback): workflow 改善 (IMP-047/049/050) を上位整合へ back-fill — §6.8.5 handover 強制側 + §G.4 直列/並列規約…
- `PLAN-REVERSE-07-backfill-pairing` (reverse): PLAN-REVERSE-07 (reverse/fullback): back-fill pairing 機構を上位整合へ back-fill — §1.10.E2 + 起票ルール + L0 §10 用語 (IMP-051)。新 FR …
- `PLAN-REVERSE-08-discovery-metamodel` (reverse): PLAN-REVERSE-08 (reverse/normalization): DISCOVERY-01 (workflow メタモデル PoC) confirmed を上位整合へ — concept §2.5 Discovery 定義…
- `PLAN-REVERSE-12` (reverse): PLAN-REVERSE-12 (reverse/back-fill): review_evidence 機械強制を governance へ合流 — requirements §7.8.7 機械強制注記 + concept §10 用語…
- `PLAN-REVERSE-36-verification-cycle-gate-naming` (reverse): PLAN-REVERSE-36 (reverse/normalization): 横断ゲート命名を V-model band 検証サイクルゲートへ正規化 — roadmap GATE-A/B 廃し L3/L6/設計/実装 検証サイクルゲー…
- `PLAN-REVERSE-40-orphan-governance` (reverse): PLAN-REVERSE-40 (reverse): orphan 統制の土台 — impl→PLAN trace lint (IMP-088) + orphan back-fill (IMP-087) を上位設計へ back-fill
- `PLAN-REVERSE-41-substance-lints` (reverse): PLAN-REVERSE-41 (reverse): substance-gate lint 群 — oracle⇔実test (IMP-128) + tracked⊆canonical (IMP-127) を上位設計へ back-fill
- `PLAN-REVERSE-44-roadmap-definition-design` (reverse): PLAN-REVERSE-44 (reverse/design): 工程表メタモデルの設計書 back-fill — 人間向け全プログラム台帳 + human/AI plane を L4/L6 へ

## §2 成果物 (commit / files)

- `A-136-cycle-p4-verification-audit`
- `PLAN-DISCOVERY-01-workflow-metamodel`
- `PLAN-DISCOVERY-05-roadmap-registration`
  - commit: 236c70e
- `PLAN-L4-00-master`
  - commit: edb245d
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-05.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-44-roadmap-definition-design.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\codex-tasks\roadmap-park-rollup-prompt.md
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
- `PLAN-L6-35-descent-obligation`
  - commit: f6e98e7
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-12-descent-obligation…
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
- `PLAN-L7-32-cross-artifact-relation-graph`
  - commit: 06ed076
  - commit: 7aa8eae
  - commit: f1d454f
  - commit: f171e3f
  - commit: b83d6d2
  - commit: 41f6313
  - commit: c95ac4e
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-10.md
  - file: Edit C:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L6-function-design\function-spec.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L6-function-design\function-spec.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L7-52-l7-completion-audit-closure.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-15.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-40-orphan-governance.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-REVERSE-40-orphan-governance.md
- `PLAN-L7-35`
  - commit: 879e899
- `PLAN-L7-43`
- `PLAN-L7-44-harness-db-master`
  - commit: 6dec6bf
  - commit: 4f81f5d
  - commit: 3dd88e4
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-11.md
- `PLAN-L7-48-readiness-guardrail`
  - commit: 531a31f
  - file: Edit C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\project_l7_audit_desce…
- `PLAN-L7-52-l7-completion-audit-closure`
  - commit: 37449c3
  - commit: 86ef5df
  - commit: 21c97de
  - commit: e9ecdff
  - commit: 5444497
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L6-function-design\function-spec.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L7-52-l7-completion-audit-closure.md
  - file: Edit C:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L6-function-design\function-spec.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-15.md
- `PLAN-L7-53-learning-engine`
  - commit: b2ab766
  - commit: db670fa
  - commit: 4174350
  - commit: d1cdd54
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-15.md
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\feedback_verify_deleg…
  - file: Edit C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\MEMORY.md
- `PLAN-L7-54-merged-plan-status-gate`
  - commit: 14948c3
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-15.md
- `PLAN-L7-55`
  - commit: 1264e55
  - commit: 5e9bb36
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\lint\plan-dependency-existence.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\doctor\index.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\plan-dependency-existence.test.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L7-56-plan-dependency-existence-gate.md
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\project_plan_governan…
  - file: Edit C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\MEMORY.md
- `PLAN-L7-57-token-telemetry-tracker`
  - commit: 192554f
  - commit: 3237972
  - commit: da7ae4a
  - file: Edit C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\project_fr38_cost_tele…
- `PLAN-L7-58-telemetry-cost-enrichment`
  - commit: f17c33c
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-15.md
- `PLAN-L7-68`
  - commit: 8d31c3c
- `PLAN-L7-70-skill-pack-curation`
  - commit: 2082273
  - commit: 88e6a3e
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\skills\gate-planning.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\skills\research.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\skills\documentation-and-adrs.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\skills\design-doc.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\skills\agent-cost-design.md
- `PLAN-L7-71-slash-commands`
  - commit: 7305fe7
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L7-72-task-classify-cli.md
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\task\classify.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\task-classify.test.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\cli.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\state-db\projection-writer.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L7-72-task-classify-cli.md
- `PLAN-L7-72`
  - commit: 6c72630
  - commit: 78ad74a
  - commit: b0021c7
  - commit: de3f5d6
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\design\harness\L4-basic-design\architecture.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\state-db\projection-writer.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\projection-writer.test.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\migration\helix-fork-completion-plan.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\repository-structure.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\state-db\index.ts
- `PLAN-L7-73-claude-native-semver-resolution`
  - commit: 0cd08f8
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\task\classify.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\task-classify.test.ts
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\plans\PLAN-L7-74-task-risk-whole-word-match.md
- `PLAN-L7-74-task-risk-whole-word-match`
  - commit: ca73ea7
  - commit: 42cdc8c
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\project_cross_review_…
  - file: Edit C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\MEMORY.md
- `PLAN-L7-75-cost-tiered-provider-router`
  - commit: f48546d
  - commit: 601810b
- `PLAN-L7-76`
  - commit: b168aa5
  - commit: 31dae85
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-17.md
- `PLAN-L7-77-codex-stdin-prompt-dispatch`
  - commit: 9b416ca
- `PLAN-M-00`
  - commit: 384934b
  - commit: b7a8aa7
  - commit: 151b36d
  - commit: f491baf
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\tests\state-db.test.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\lint\project-hook.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\src\lint\runtime-portability.ts
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\governance\ut-tdd-agent-harness-concept_v3.1.md
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
- `PLAN-RECOVERY-04-roadmap-definition`
  - commit: 975b25b
  - commit: 2f1981d
  - commit: e89d981
  - commit: 9188e78
  - file: Write c:\tmp\handover-recovery04-block.md
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json
- `PLAN-REVERSE-01-process-docs`
- `PLAN-REVERSE-05-handover-mechanism`
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-04.md
- `PLAN-REVERSE-06-workflow-improvements`
- `PLAN-REVERSE-07-backfill-pairing`
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\feedback_impl_must_ba…
- `PLAN-REVERSE-08-discovery-metamodel`
- `PLAN-REVERSE-12`
- `PLAN-REVERSE-36-verification-cycle-gate-naming`
  - commit: 4c89184
  - commit: fa29f67
- `PLAN-REVERSE-40-orphan-governance`
  - commit: 27f40d6
  - commit: ea51f25
  - file: Edit c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\docs\handover\session-handover-2026-06-10.md
- `PLAN-REVERSE-41-substance-lints`
  - commit: b2e9824
  - file: Write C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\project_implementatio…
  - file: Edit C:\Users\micro\.claude\projects\c--Users-micro-OneDrive-Desktop-UT-TDD-agent-harness\memory\MEMORY.md
- `PLAN-REVERSE-44-roadmap-definition-design`
  - commit: f280f16
  - file: Write c:\Users\micro\OneDrive\Desktop\UT-TDD-agent-harness\.ut-tdd\handover\CURRENT.json

## §3 Next Action

本 session (Opus 実行 / PO 直接ディレクト) の実完了:

1. **A: branch → main マージ済** — `codex/harden-automation-team-launch` を
   `main` へ fast-forward + push (`main` = `origin/main` = `31dae85`、51 commits)。
2. **ローカル HELIX 全撤去 (5 面)** — kit `~/ai-dev-kit-vscode/` rm / `.bashrc` PATH
   shim 行 / `~/.claude/settings.json` の `HELIX_HOME`+permission 50+**HELIX フック
   6 個** / global `~/.claude/CLAUDE.md` 最小化 / `~/.codex/skills/ut-tdd-*` 50 個
   (壊れ residue)。codex→`npm\codex.cmd` / claude→`claude.exe` の実バイナリに解決。
   バックアップ=`~/.claude/helix-cleanup-backup-20260619-114120/`。詳細=[[project_helix_global_optin]]。
3. **PLAN-L7-77 (codex stdin prompt dispatch fix) 完了・commit `9b416ca`** — Windows
   `.cmd` の cmd.exe shell-wrap がプロンプトを 1 行目で切っていた defect を test-first で
   修正 (プロンプトを stdin へ)。typecheck/Biome/Vitest 720/doctor green。**未 push**
   (main より 1 commit 先行)。live で複数行 6 問プロンプトの全文到達を実証。
4. **B/C/D Codex クロスレビュー完遂** — live 確認が同時にクロスレビューになった。
   Codex 判定 `PO_RESIDUAL: #7, #9`。残り (B 既決 / C#8 / D#3 / D#5) は AI-decidable。

次 session の起点: ①`9b416ca` の main 反映 (PO 判断、下記 §5)。②AI-decidable 分を
着手 (PO 不要、下記 §4)。③真の PO residual #7/#9 (§5)。

## §4 carry (未了・先送り)

AI-decidable・非ブロック (PO 確認なしで着手可、Codex クロスレビュー裏取り済):

- **C#8 `status --json` 契約**: 実装を正本に doc 整合。`RuntimeDetection`
  (`src/runtime/detect.ts`) が doc より rich → `mode/claude/codex/currentRuntime/
  availableRuntimes/missingRuntimes` を doc 化。
- **D#3 session digest 過少計上**: `compressPlanDigest` (`src/runtime/session-log.ts`
  ~L230) の session 単位 idempotency → **event 単位 high-watermark**。別 PLAN
  (digest schema/意味論変更)。
- **D#5 MCP launch argv**: `renderGeneratedMcpConfig` (`src/lint/verification-profile.ts`
  ~L516) の display-string 分割 → 構造化 `mcpCommand`/`mcpArgs`。別 PLAN (外部 launcher 契約)。
- 軽微: model-id 一元化 (`TIER_TABLE` ⇔ `model-policy`)、handover 同日累積
  (本ファイルは多数セクション重複)。

## §5 未了 PO 判断

- **`9b416ca` (PLAN-L7-77) を main へ push/マージするか** (現在 main より 1 commit 先行・未 push)。
- **#7 (Q2) requirements の current/future/carry taxonomy**: 区分付与は**ガバナンス意味**を
  変える (編集作業でない)。ガバナンス区分と割当ルールを PO が確定後 AI が機械適用。
- **#9 (Q4) `skill suggest` 公開 I/O 契約**: 現状 `--plan <id>`→ranked rows。path 入力 /
  `--text` / 3-bucket 出力の追加は**製品契約**の変更 → PO/API 判断。

## §6 壊さない / 再発させない

- **codex dispatch のプロンプトは stdin で渡す** (`codex exec -`)。cmd.exe は改行/メタ文字
  (`< > | ( )`) を運べないので、args に戻すな (PLAN-L7-77、複数行切り詰めが再発する)。
  claude は `claude.exe` で shell-wrap されず無影響。
- **ローカル HELIX を足し戻すな** — kit (`~/ai-dev-kit-vscode`)/PATH shim/`HELIX_*` env/
  global HELIX フックは全撤去済。再 clone は GitHub `RetryYN/ai-dev-kit-vscode` から可。
  他 project で `@~/ai-dev-kit-vscode/...` opt-in していた CLAUDE.md は @import が壊れる。
- **harness.db は local/untracked** — PLAN 追加後は `ut-tdd db rebuild` しないと
  drive-db-registration が stale で doctor EXIT=1 (回帰でない)。
- **Codex live クロスレビュー**は DESK REVIEW 制約を front-load しないと直近 commit/PLAN
  レビューへ逸れる ([[feedback_cross_review_before_po_escalation]])。判断系は self-review→
  相手 provider クロスレビュー→残差のみ PO の順 (hybrid で直接 PO に振るな)。

---

---

---

---

---

<!-- ut-tdd handover: 1 件の同日中間エントリを累積抑制のため剪定 (git 履歴に保全) -->

---

# Session Handover — 2026-06-19

## §1 PLAN サマリ

- (同日 first entry 参照 — 全 PLAN registry は本ファイル冒頭エントリ §1 に記載、本 session 固有の進捗は §3 へ)

## §2 成果物 (commit / files)

- (同日 first entry 参照 — 本 session の commit/file は §3 Next Action に記載)
- commit `69d3227` feat(status,review-guard): PLAN-L7-84 + PLAN-L7-85 (12 files)
- commit `583bbc6` docs(handover): 完了記録

## §3 Next Action

PO「両方修正を」を受け、handover §5 に繰越されていた **2 件の PO 残差を実装で解消**
(本 session commit `69d3227` + `583bbc6`、全 green・push 済、main=`583bbc6`)。

1. **PLAN-L7-84 (impl) — `status --json` の `nextAction` フィールド (A-138 ITEM-1 carry discharge)**:
   既存 6 フィールド (camelCase 公開契約) に `nextAction` を additive 付加。正式フィールド名は
   **PO 判断不要**だった = 既存が全て camelCase ゆえ規約上 `nextAction` に一意決定。値域 =
   mode→judgment-gate guidance (`standalone`=`human-review-required:` / 単一runtime=
   `single-runtime:` intra_runtime_subagent / `hybrid`=`cross-review-ready:`)、先頭 token で
   機械 switch でき ASCII のみ。`nextActionForMode` 純関数 + `NEXT_ACTION_BY_MODE` SSoT。
   requirements §6 を carry→**current**、function-spec §1.2 back-fill。U-DETECT-001..005。
2. **PLAN-L7-85 (troubleshoot) — 委譲レビュー read-only 強制 + commit前 staged-diff 機械化 (IMP-137)**:
   `src/runtime/review-guard.ts` (新規・純関数: read-only ロール分類 / working-tree mutation 検知 /
   assessment / message / staged summary)。git/fs 端点なしで module-boundary (runtime↛lint) 順守。
   `ut-tdd <provider> --role <read-only> --execute` が spawn 前後を assess し warning surface
   (**fail-open**=委譲成果を殺さない)。`ut-tdd review --staged` が staged 集合+doctor を **fail-close**。
   `loadStagedFiles`/`parseStagedNames` を change-impact に追加。U-RGUARD-001..012。

検証: typecheck / Biome / Vitest **779/779** / doctor EXIT=0 / db rebuild。独立 code-reviewer
subagent (sonnet) + PM 自己レビュー。**commit 前に新ツール `ut-tdd review --staged` を dogfood**
(staged=12 / doctor=ok / 不要混入0 = IMP-137 で作った規律を自分に適用)。

次 session: 新規実装の手待ちなし。残るは §5 (繰越 PO 判断、本 session 範囲外)。

## §4 carry (未了・先送り)

- AI-decidable carry は本 session で**全消化** (next_action / IMP-137 機械化の両方)。新規実装の残件なし。
- **review-guard 既知境界** (繰越メモ): `detectWorkingTreeMutation` は path-presence ベースゆえ、
  session 前から dirty なファイルへの追加編集は検知しない (IMP-137 の実 failure mode = clean な
  共有ファイルへの off-task 編集は捕捉)。content-hash 検知 / staged との session 跨ぎ cross-reference
  永続化は PLAN-L7-85 Out of scope = 必要なら future enrichment (solo 可)。
- 軽微 (繰越): CURRENT.json `digest_summary.failures: 1` は履歴 digest の記録値 (現行 779 green、回帰でない)。

## §5 未了 PO 判断

- 本 session で繰越 PO 残差は解消済み。新規の PO 判断は無し。
- (参考) review-guard の content-hash 化 / staged cross-reference 永続化を将来やるかは、必要が
  生じた時点で判断 (現状は path-presence + doctor fail-close で IMP-137 の実 failure mode を被覆)。

## §6 壊さない / 再発させない

- **`status --json` の既存 6 camelCase フィールドは公開契約**。`nextAction` は additive・後方互換で
  足した。フィールド名は snake_case 別名を付けない (既存 6 が camelCase の SSoT、PLAN-L7-84)。
- **machine surface (status --json 等) の文字列は ASCII**。`nextAction` 値を日本語化すると
  公開 JSON 契約を崩し、machine-surface-language lint の射程にも入る (今回 ASCII で実装)。
- **review-guard は純関数で git/fs 端点を持たない** (I/O は cli の loadChangedFiles/loadStagedFiles)。
  runtime↛lint の module-boundary と dependency-drift cycles 0 を壊すので、review-guard に git 呼び出しや
  lint import を足すな (PLAN-L7-85)。
- **execute パスの review-guard は fail-open** (exit 不変・warning のみ)。レビュー成果を殺さず混入を
  staged 前に弾く設計。ここを fail-close に変えると正当な委譲まで止まる。staged 側 (`review --staged`) が
  fail-close 担当。
- **PLAN 追加/status 変更後は `ut-tdd db rebuild`** をしないと plan-governance / drive-db-registration が
  stale で doctor 赤化 (回帰でない、[[project_codex_branch_ci_verification]])。今回も rebuild 済。
- **kind=impl は `parent_design` 必須** (master_hub 除く)。PLAN-L7-84 で一度 invalid_frontmatter に
  なり function-spec を parent_design に指定して解消した (schema §1.1.parent_design)。

---

---

# Session Handover — 2026-06-19

## §1 PLAN サマリ

- (同日 first entry 参照 — 全 PLAN registry は本ファイル冒頭エントリ §1 に記載、本 session 固有の進捗は §3 へ)

## §2 成果物 (commit / files)

- commit `a571b5d` feat(readability): runtime-artifact mojibake guard (PLAN-L7-69、5 files)
- commit `e4d7de6` docs(plans): confirm L7-71 drift + L7-52 guardrail re-verification (2 files)

## §3 Next Action

本 session (Opus 実行 / PO `/goal` ディレクト) で **「L7 未実装はない?」の問いから出た 3 件を是正・完遂**。
doctor green は draft PLAN を span 計上せず映さない (absence-blindness、[[feedback_coverage_not_substance]]) ため、
PLAN 実体を読んで残差を特定した。

1. **PLAN-L7-69 (impl) 実装・confirmed** (`a571b5d`) — runtime-readability hard gate。prose band
   (`loadSystemReadabilityDocs`) が `docs/` のみ走査で塞げない最高リスク面 = `.ut-tdd/audit/**/*.md` +
   `.ut-tdd/handover/**/*.json` (provider cross-agent payload) の mojibake を検知。
   `loadRuntimeArtifactReadabilityDocs` + `checkRuntimeReadability` (fail-open on absence / fail-close on
   marker / fail-close on unreadable root)。raw JSON text を既存 MOJIBAKE_MARKERS で走査。negative fixture
   4 種 (audit md / provider JSON halfwidth-katakana / U+FFFD / clean pass)。既存 .ut-tdd は mojibake 0 で green。
2. **PLAN-L7-71 (impl) status drift 解消・confirmed** (`e4d7de6`) — Phase-1 slash command 7 本は `7305fe7`
   で実装済・稼働中だが PLAN が draft 放置 (bookkeeping drift)。AC を機械再検証 (legacy term 0 / 実 ut-tdd
   command 参照 / description frontmatter 有) し confirmed 化。P2 innovation-* は明示 defer 化。
3. **PLAN-L7-52 C-1 (`recordGuardrailDecision`) 裏取り** (`e4d7de6`、PLAN-L7-48 §Deferred に記録) — production
   未配線は事実だが **active な漏洩リスク無し** をコードで確認: 本番書込 `projectIssueApprovalGuardrails` は
   `SECRET_PATTERN` 列ガード通過で secret-safe / 不変条件は `inspectGuardrailInvariants` SSoT を write(fail-close)
   と projection advisory(warn) が共有・単体テスト済。残るは PO 所有 auth-gated の配線方針判断のみ。隠れ穴無し。

検証: typecheck / Biome / Vitest **785/785** / doctor **EXIT=0** / db rebuild 2 回。code-reviewer
(sonnet, intra_runtime_subagent) verdict=**pass-with-nits・Critical 0**。**未 push** (main が origin/main より
**2 commit 先行**: `a571b5d`, `e4d7de6`)。次 session 起点: ①下記 §5 の push 判断。②§4 の carry。

## §4 carry (未了・先送り)

- **L7-71 P2 innovation commands** (新規明示 defer): `innovation-{tech,marketing,synthesize}` (pdm-* 招集)。
  owner=PM/PO、condition=pdm-* invocation 契約を実際に使う段で author。under-design でない (記録済 defer)。
- **前 session 繰越 carry の実状照合** ([[feedback_verify_carry_status_against_code]]): 旧 handover §4 の
  **D#3 (session digest event-watermark)→`PLAN-L7-80` で confirmed 済 / D#5 (MCP launch argv)→`PLAN-L7-79`
  で confirmed 済**。= もう open でない (旧 carry は stale だった)。残りうるは **C#8 (`status --json` の doc 整合)**
  のみ — 対応 PLAN 未確認ゆえ着手前にコード/PLAN 照合。
- 軽微: `CURRENT.json` `digest_summary.failures:1` は履歴 digest 記録値 (現行 785 green、回帰でない)。
  stale agent-slot 1 件 (本 session の subagent 由来、`.ut-tdd/state/agent-slots.json`=untracked runtime
  state、doctor は EXIT=0 で advisory のみ)。

## §5 未了 PO 判断

- **`a571b5d` / `e4d7de6` を main へ push するか** (現在 origin/main より 2 commit 先行・未 push)。
  CI=harness-check は local で typecheck/Biome/Vitest 785/doctor EXIT=0 を全 green 確認済。
- **L7-52 `recordGuardrailDecision` の production 配線方針** (auth-gated、owner=PO、solo 確定禁止)。
  今 session は裏取りのみで据え置き。配線するなら PO が decision-source / issue 承認 vocabulary 統合を確定後。

## §6 壊さない / 再発させない

- **runtime-readability は `.ut-tdd/audit`(.md) + `.ut-tdd/handover`(.json) のみ走査**。vendor snapshot /
  `legacy local state/` は除外 (source 由来 encoding を quote しうる = false-positive 化を避ける、PLAN-L7-69 §3)。
  **fail-open on absence は意図** (generated state — 不在は壊れでなく clean bootstrap)。prose band の checked>0
  非対称はこの理由で正当。
- **`walkFiles` の `statSync` skip は元 `walkMarkdown` 継承で fail-close を弱めない** — 選択ファイルは
  `readFileSync`→`checkRuntimeReadability` の catch で fail-close。propagate に変えると live dir の race
  (readdir↔statSync 間の削除) で doctor が flaky 化する。
- **PLAN 追加/status 変更後は `ut-tdd db rebuild`** (plan-registry-fingerprint stale で doctor /
  drive-db-registration が赤化、回帰でない、[[project_codex_branch_ci_verification]])。本 session も 2 回 rebuild。
- **委譲 subagent の最終 narration を成果証拠にするな** ([[feedback_verify_delegated_agent_output_by_files]])。
  今回 code-reviewer 第 1 run が maxTurns で narration truncate → **verdict-first** で再 run し実 verdict を取得した。

---

# Session Handover — 2026-06-19

## §1 PLAN サマリ

- (同日 first entry 参照 — 全 PLAN registry は本ファイル冒頭エントリ §1 に記載、本 session 固有の進捗は §3 へ)

## §2 成果物 (commit / files)

- commit `cacb7fe` fix(merged-plan-status): detect merged non-src deliverables (PLAN-L7-86、4 files)

## §3 Next Action — L7 実装の真の完了度 (PO「完了処理ができてないだけか確定させろ」回答)

**重要な是正**: 前報告の「残なし／完了」は誤りだった。原因 = doctor green と handover 要約を
実体と思い込み PLAN を読まなかったこと。本 entry で **PLAN 完了 ≠ 層完了 ≠ プロジェクト完了** を
弁別して実態を確定する。

### (1) L7 実装の完了度 = 「層として完了」ではない
- **confirmed/completed L7 PLAN は完了**。だが L7 には **記録済みの未了**が残っている:
  - **明示 defer (実装が"あとで発生"する正規記録)**: `PLAN-L7-48` recordGuardrailDecision 本番配線
    (auth-gated, owner=PO)、`PLAN-L7-71` P2 innovation commands (後回しバッチ)。他に
    explicit_l7_defer/under-design を持つ PLAN 計 ~12 (L4/L6/L7/RECOVERY)。これらは
    「shipped でない＝後で実装」を owner/condition 付きで記録した正規 deferral。
- **なぜ"実装フェーズなのに後で実装"が起きるか**: このリポは waterfall でなく
  **L7 実装先行 → L3 要件は Reverse で back-fill** (bottom-up)。加えて PLAN 単位の明示 defer がある。
  ゆえに「実装フェーズ完了」という締まった状態は存在しない。「PLAN の commit 範囲は完了」が正確な単位。

### (2) 検出不備を実コードで確定 → 根治 (PO「ハーネスDBが検出ちゃんとやってない」)
- **根因**: `merged-plan-status` gate は「generated artifact が merged なのに PLAN が draft」を
  捕まえる設計なのに、`generatesSrcPaths` が `src/*.ts` のみ filter。L7-71 の出荷物は
  `.claude/commands/*.md` ゆえ素通り = **当 gate 自身が absence-blind**。だから L7-71 drift が
  doctor green のまま埋もれ、PO が手で PLAN を読むまで発見できなかった。
- **根治 (commit `cacb7fe`, PLAN-L7-86)**: `generatesMergedDeliverablePaths` +
  `DELIVERABLE_ROOTS=[src/,tests/,scripts/,.claude/]` (docs//.ut-tdd/ 除外)。regression test 2 本。
  blast radius 0 (現存 draft 5 本は全て非 artifact-kind)。**これで今後は同型 drift を機械が fail-close**。
- **残る検出不備 = IMP-139 (observed)**: status/handover/harness.db が「層内の非終端 PLAN 数 /
  open defer 数 / PLAN完了≠層完了」を**正の集計シグナル**として surface しない。ゆえに defer や
  非 artifact-kind draft は依然 grep 依存。これは status --json 公開契約変更を伴うので別 PLAN。

### (3) 現存の未了 (全体・既存・L7 ゴール外だが「現状報告」の対象)
- **draft PLAN 5 本 (全て非L7・非 artifact-kind)**: `DISCOVERY-03/05` (poc・検証中で draft 正常な可能性)、
  `L3-04/05` (add-design・upstream 要件 reconciliation)、`RECOVERY-02` (recovery)。
  各が drift か真未着手かは**未判定** (次の triage 候補)。
- これらは merged-plan-status (修正後) では flag されない (非 artifact-kind ゆえ正しく対象外)。

## §4 carry (未了・先送り)

- **IMP-139** (observed): 未了の正の集計を status/handover/harness.db に surface する機構。owner=PO/設計判断。
- **5 本の非L7 draft の triage**: drift (実体済) か真未着手かを 1 本ずつ実体で確定する (本 session 未実施)。
- **明示 defer ~12 件**: 各 owner/condition で正規記録済。discharge は各 condition 成立時。
- 軽微: stale agent-slot 1 件 (subagent 由来、`.ut-tdd/state/agent-slots.json`=untracked、doctor advisory)。

## §5 未了 PO 判断

- **commit 群を main へ push 済か確認**: 本 entry 時点で `cacb7fe` まで push 予定 (§最終検証後)。
- **IMP-139 (未了集計 surface) を実装するか + status --json 契約変更の可否** (公開契約ゆえ PO 判断)。
- **L7-52 recordGuardrailDecision 本番配線方針** (auth-gated, owner=PO, solo 確定禁止) — 据え置き。

## §6 壊さない / 再発させない

- **「doctor green = 完了」と読むな**。doctor は draft PLAN を roadmap span に計上せず、明示 defer も
  failure にしない (意図的)。完了主張は **PLAN status を実際に読んで** PLAN単位/層単位/defer を弁別せよ
  ([[feedback_coverage_not_substance]] / [[project_descent_absence_blindness]])。今 session の発端は
  この誤読だった。
- **merged-plan-status は出荷物ルート (src/tests/scripts/.claude) 全体で検出する** (PLAN-L7-86)。
  `src/*.ts` 限定に戻すと `.claude` 等の非 src deliverable を merge した draft PLAN の drift を再び見逃す。
- **明示 defer は under-design ではない** (CLAUDE.md)。owner/condition 付きで PLAN に記録された
  「後で実装」は正規。ただし IMP-139 が入るまで一覧 surface は grep 依存。
- **PLAN 追加/status 変更後は `ut-tdd db rebuild`** (plan-registry-fingerprint stale で doctor 赤化)。

