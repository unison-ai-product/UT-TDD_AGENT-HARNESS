---
title: "Vモデル upgrade schedule authoring source"
status: confirmed
owner: PO / TL
updated: 2026-07-13
typed_spec_phase_owner: L6
---

# Vモデル upgrade schedule authoring source

## 0. 役割

本書は `Vモデル設計ドキュメント_checked.zip` から始まった HARNESS バージョンアップの工程管理表である。
目的は、上流からの全面見直しを「現在地」「V-pair」「前提」「RAG」「駆動モデルの入口」に分解し、
`.ut-tdd/harness.db` の `schedule_entries` projection へ宣言的に引き込むことである。

DB は正本ではない。本書、PLAN、設計 doc、test-design が authoring source であり、検出系は本書の現在地と
`routeFiling` / 駆動モデル設計に従う。検出系の都合で layer、sub_doc、pairing、起票先を創作してはいけない。

## 1. 工程管理表

| `plan_id` | `layer` | `sub_doc` | `v_pair` | `predecessor_plan_ids` | `current_location` | `rag` | `status` | `blocked_reason` |
|---|---|---|---|---|---|---|---|---|
| PLAN-L0-01-vmodel-harness-upgrade-charter | L0 | charter |  |  | U0: engine-swap/full-scope charter承認済。programはU18a-d設計中 | yellow | confirmed | 109→163 join、FSM/PLAN v2、G8-G14 contract未完 |
| PLAN-L1-06-vmodel-upgrade-requirements | L1 | technical | L14 | PLAN-L0-01-vmodel-harness-upgrade-charter | U1: VUP-REQ-01〜08の既存freezeを履歴として維持 | green | confirmed |  |
| PLAN-L1-07-vmodel-engine-swap-requirements-delta | L1 | technical | L14 | PLAN-L1-06-vmodel-upgrade-requirements | U18: VUP-REQ-08A/09/10とfull-scope engine-swap差分をadditive freeze済 | green | confirmed |  |
| PLAN-L4-22-vmodel-source-disposition-profile-ssot | L4 | data | L9 | PLAN-L0-01-vmodel-harness-upgrade-charter | U18a: 109 source→163 item→target dispositionと8 profileを再freeze | yellow | draft | 163 item-level join、L9 pair review、projection設計待ち |
| PLAN-L4-23-forward-fsm-plan-asset-v2 | L4 | function | L9 | PLAN-L0-01-vmodel-harness-upgrade-charter | U18b: append-only Forward FSM / immutable PLAN Asset v2を再freeze | green | confirmed | L5/L6 ledger・guard・migration設計freeze済み。L9実検証は後続 |
| PLAN-L4-24-declarative-vmodel-contract-right-arm | L4 | architecture | L9 | PLAN-L4-23-forward-fsm-plan-asset-v2 | U18c: 設計由来V-model contractとG8-G14右腕engineを再freeze | yellow | draft | contract schema、L8-L14 verify PLAN、G11-G14 evidence待ち |
| PLAN-L6-69-active-upgrade-frontier-right-arm-contract | L6 | function-spec | L7 | PLAN-L4-24-declarative-vmodel-contract-right-arm | U18c-design: active frontier/right-arm fail-close関数契約をfreeze済 | green | confirmed |  |
| PLAN-L7-416-active-upgrade-frontier-right-arm-gate | L7 |  | L6 | PLAN-L6-69-active-upgrade-frontier-right-arm-contract | U18c-impl: false-greenを除去するparser/analyzer/doctor gate実装済 | green | confirmed |  |
| PLAN-REVERSE-416-active-upgrade-frontier-right-arm-backfill | cross | function-spec | L7 | PLAN-L7-416-active-upgrade-frontier-right-arm-gate | U18c-backfill: observed false-greenをL6/L7契約へ合流済 | green | confirmed |  |
| PLAN-L4-25-repository-docs-engine-swap-audit | L4 | architecture | L9 | PLAN-L4-22-vmodel-source-disposition-profile-ssot,PLAN-L4-23-forward-fsm-plan-asset-v2,PLAN-L4-24-declarative-vmodel-contract-right-arm | U18d: repository全tracked docsのdispositionと設計波及を監査 | yellow | draft | baseline ledger、全件判断、cross-reference closure待ち |
| PLAN-L4-26-engine-swap-object-method-design | L4 | data | L9 | PLAN-L4-21-domain-vo-coding-constraints,PLAN-L4-23-forward-fsm-plan-asset-v2 | U18e: engine-swap domainのaggregate/class/method/port設計を実体化 | yellow | draft | L4 object判断、L5 module、L6 method契約、負債routing待ち |
| PLAN-L4-27-vmodel-semantic-self-audit | L4 | architecture | L9 | PLAN-L4-22-vmodel-source-disposition-profile-ssot,PLAN-L4-25-repository-docs-engine-swap-audit,PLAN-L4-26-engine-swap-object-method-design | U18f: ZIP 163 itemに対するHARNESS設計/実装/test/evidenceの正しさを全件監査 | yellow | draft | 163 item review、pending 0、gap debt、frontier review待ち |
| PLAN-L4-28-design-detection-self-proof | L4 | architecture | L9 | PLAN-L4-24-declarative-vmodel-contract-right-arm,PLAN-L4-27-vmodel-semantic-self-audit | U18g: 設計由来detectorの完全性/freshness/実発火/mutationを独立自己証明 | yellow | draft | meta-verifier、receipt、mutation survivor 0、surface parity待ち |
| PLAN-L3-04-upstream-schedule-reconciliation | L3 | functional | L12 | PLAN-L0-01-vmodel-harness-upgrade-charter | U1: requirements slice confirmed; 上流要求と受入条件を固定 | green | confirmed |  |
| PLAN-L4-18-roadmap-drive-selection-hardening | L4 | function | L9 | PLAN-L3-04-upstream-schedule-reconciliation | U2a: routeFiling / 駆動モデル選択の外部設計を固定 | green | confirmed |  |
| PLAN-L4-19-vmodel-spec-ir-data | L4 | data | L9 | PLAN-L4-18-roadmap-drive-selection-hardening | U2b: spec IR / 工程 / activation の集約境界を固定 | green | confirmed |  |
| PLAN-L5-13-vmodel-spec-ir-physical-data | L5 | physical-data | L8 | PLAN-L4-19-vmodel-spec-ir-data | U2c: physical schema と projection table を固定 | green | confirmed |  |
| PLAN-L6-39-vmodel-spec-ir-function-contracts | L6 | function-spec | L7 | PLAN-L5-13-vmodel-spec-ir-physical-data | U2d: loader/parser/projector/detector handoff 契約を固定 | green | confirmed |  |
| PLAN-L7-381-vmodel-spec-ir-projection | L7 |  | L6 | PLAN-L6-39-vmodel-spec-ir-function-contracts | U3: spec_defs / relations / schedule / activation / candidates をDB投影済 | green | confirmed |  |
| PLAN-L7-382-detector-route-candidate-feedback | L7 |  | L6 | PLAN-L7-381-vmodel-spec-ir-projection | U4: detector候補をfeedback / dry-run issue queueへ接続済 | green | confirmed |  |
| PLAN-L7-383-vmodel-schedule-authoring-source | L7 |  | L6 | PLAN-L7-382-detector-route-candidate-feedback | U5: 工程管理表を専用 authoring source としてDB投影へ接続済 | green | confirmed |  |
| PLAN-L6-40-route-filing-review-surface | L6 | function-spec | L7 | PLAN-L7-383-vmodel-schedule-authoring-source | U6a: routeFiling SSoT 評価結果のreview DTO契約を固定 | green | confirmed |  |
| PLAN-L7-384-route-filing-review-surface | L7 |  | L6 | PLAN-L6-40-route-filing-review-surface | U6b: detector candidate review surfaceへFilingTarget評価結果を表示済 | green | confirmed |  |
| PLAN-L6-41-vmodel-activation-profile-join | L6 | function-spec | L7 | PLAN-L7-384-route-filing-review-surface | U7a: activation profile と工程表 join の関数契約を固定 | green | confirmed |  |
| PLAN-L7-385-vmodel-activation-profile-join | L7 |  | L6 | PLAN-L6-41-vmodel-activation-profile-join | U7b: activation profile と工程表をjoinしてversion-up対象/除外/延期理由を検索可能化済 | green | confirmed |  |
| PLAN-L6-42-typed-spec-declaration-source | L6 | function-spec | L7 | PLAN-L7-385-vmodel-activation-profile-join | U8a: ZIP 99の spec.defines 型宣言をHARNESS正本へ落とす契約を固定 | green | confirmed |  |
| PLAN-L7-386-typed-spec-declaration-projection | L7 |  | L6 | PLAN-L6-42-typed-spec-declaration-source | U8b: typed spec declaration をDB projectionへ接続済 | green | confirmed |  |
| PLAN-L6-43-typed-spec-trace-closure | L6 | function-spec | L7 | PLAN-L7-386-typed-spec-declaration-projection | U9a: typed spec trace closure / 双方向不一致 / test backlink の契約 | green | confirmed |  |
| PLAN-L7-387-typed-spec-trace-closure-gate | L7 |  | L6 | PLAN-L6-43-typed-spec-trace-closure | U9b: typed spec trace closure を doctor hard gate として実装 | green | confirmed |  |
| PLAN-L6-44-typed-spec-ledger-and-body-sync | L6 | function-spec | L7 | PLAN-L7-387-typed-spec-trace-closure-gate | U10a: 台帳突合 / 本文実体突合 / V字逆流 phase 判定の契約 | green | confirmed |  |
| PLAN-L7-388-typed-spec-ledger-body-sync-gate | L7 |  | L6 | PLAN-L6-44-typed-spec-ledger-and-body-sync | U10b: typed spec ledger/body sync を doctor hard gate として実装 | green | confirmed |  |
| PLAN-L6-45-typed-spec-owned-artifact-dispersal | L6 | function-spec | L7 | PLAN-L7-388-typed-spec-ledger-body-sync-gate | U11a: bootstrap doc から各 owned artifact へ spec block を分散配置し、修正版ZIPの文書ローカル agent 契約を後続 U12 へ送る境界を固定 | green | confirmed |  |
| PLAN-L7-389-typed-spec-owned-artifact-dispersal-gate | L7 |  | L6 | PLAN-L6-45-typed-spec-owned-artifact-dispersal | U11b: owned artifact 分散を doctor hard gate として実装 | green | confirmed |  |
| PLAN-L6-46-typed-spec-phase-layer-alignment | L6 | function-spec | L7 | PLAN-L7-389-typed-spec-owned-artifact-dispersal-gate | U12a: `v_phase` と owner artifact layer/frontmatter の整合を固定する契約 | green | confirmed |  |
| PLAN-L7-390-typed-spec-phase-layer-alignment-gate | L7 |  | L6 | PLAN-L6-46-typed-spec-phase-layer-alignment | U12b: phase/layer 整合を doctor hard gate として実装 | green | confirmed |  |
| PLAN-L6-47-agent-contract-authoring-source | L6 | function-spec | L7 | PLAN-L7-390-typed-spec-phase-layer-alignment-gate | U12c: 修正版ZIPの `agent.read_first` / `agent.done_when` を HARNESS の authoring source 契約へ翻訳済み | green | confirmed |  |
| PLAN-L7-391-agent-contract-detect-gate | L7 |  | L6 | PLAN-L6-47-agent-contract-authoring-source | U12d: agent 契約を DB projection / doctor gate へ接続し、done_when detect green を検出可能化済み | green | confirmed |  |
| PLAN-L6-48-vmodel-l2-freeze-l5-verification-design | L6 | function-spec | L7 | PLAN-L7-391-agent-contract-detect-gate | U13a: 107のL2プロト合意凍結、L5検証設計整備をHARNESSのForward freeze条件へ反映 | green | confirmed |  |
| PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate | L7 |  | L6 | PLAN-L6-48-vmodel-l2-freeze-l5-verification-design | U13a-impl: L2/L5 forward freeze contract を doctor gate と unit oracle へ接続 | green | confirmed |  |
| PLAN-L6-49-refactor-and-qa-release-gates | L6 | function-spec | L7 | PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate | U13b: 108リファクタ等価性テスト、109 QA Go/No-GoをRefactor/Accept/Release gateへ翻訳 | green | confirmed |  |
| PLAN-L7-394-refactor-qa-release-contract-gate | L7 |  | L6 | PLAN-L6-49-refactor-and-qa-release-gates | U13b-impl: refactor / QA release contract を doctor gate と unit oracle へ接続 | green | confirmed |  |
| PLAN-L7-367-refactor-candidate-lifecycle | L7 |  | L6 | PLAN-L6-49-refactor-and-qa-release-gates | U13c: Refactor candidate lifecycle を DB 永続 state と rebuild 保持へ接続 | green | confirmed |  |
| PLAN-L4-20-document-catalog-scale-profile-ssot | L4 | data | L9 | PLAN-L0-01-vmodel-harness-upgrade-charter | U14a-0: ドキュメントカタログ／規模プロファイルのSSoT | green | confirmed |  |
| PLAN-L6-59-design-doc-cross-integrity-check | L6 | function-spec | L7 | PLAN-L4-20-document-catalog-scale-profile-ssot,PLAN-L6-43-typed-spec-trace-closure | U14a: 設計doc横断の重複定義/循環依存検出契約を固定 | green | confirmed |  |
| PLAN-L7-404-design-doc-cross-integrity-gate | L7 |  | L6 | PLAN-L6-59-design-doc-cross-integrity-check | U14a-impl: 設計doc横断整合性 gate を doctor / unit oracle へ接続 | green | confirmed |  |
| PLAN-REVERSE-395-cli-command-design-backfill | cross | external-if | L9 |  | U14b: 実装先行 CLI command surface / exit code / JSON 境界を L4 external-if へ back-fill | green | confirmed |  |
| PLAN-L6-64-cli-shell-completion | L6 | function-spec | L7 | PLAN-REVERSE-395-cli-command-design-backfill | U14c: shell completion は REVERSE-395 の as-is command catalog を入力にして設計する | yellow | draft | REVERSE-395 R4 合流待ちは解除済み。次 slice で completion 対象 shell / command generation を freeze する。 |
| PLAN-L4-16-security-design-slot | L4 | security | L9 |  | U14d: L4 security slot を schema / catalog / profile / L4 body へ登録し、L6-62 secret-scan の上流前提を解凍 | green | confirmed |  |
| PLAN-L6-62-design-doc-secret-scan-gate | L6 | function-spec | L7 | PLAN-L4-16-security-design-slot | U14e: docs横断 secret-scan / distribution 前 fail-close / rotation 方針を L6 契約化し、doctor / distribution preflight へ降下 | green | confirmed |  |
| PLAN-L7-260-sensitive-scan-boundary | L7 |  | L6 | PLAN-L6-62-design-doc-secret-scan-gate | U14e-impl: L6 secret-scan 契約を `src/lint/secret-scan.ts` / doctor hard gate / distribution preflight へ接続済み。pre-push hook 対象見直しが残る | yellow | draft | pre-push hook 対象見直しは carry。 |
| PLAN-L6-50-execution-assignment-ledger | L6 | function-spec | L7 | PLAN-L7-386-typed-spec-declaration-projection | U15a: ZIP assign/signals の ID 単位実行割当台帳を L6 契約・L7 oracle・typed spec 台帳へ接続 | green | confirmed |  |
| PLAN-L4-21-domain-vo-coding-constraints | L4 | data/function | L9 | PLAN-L0-01-vmodel-harness-upgrade-charter | U16a: ZIP94/95 の値オブジェクト方針とクラス・メソッド構造規約を L4 data / coding-rules SSoT へ固定 | green | confirmed |  |
| PLAN-L6-67-skill-admission-gate | L6 | function-spec | L7 | PLAN-L6-37-skill-index-category | U16b: skill admission gate を品質3要件・4種判定・judge fail-open封止・決定論残渣 doctor 契約として L6/L7 に接続 | green | confirmed |  |
| PLAN-L7-411-skill-admission-gate | L7 |  | L6 | PLAN-L6-67-skill-admission-gate | U16b-impl: skill admission gate の判定関数・CLI・台帳/quarantine・doctor coverage・supersede lint を実装する後続 slice | yellow | draft | PLAN-REVERSE-411 と双方向 pair。 |
| PLAN-L6-52-signals-schedule-live-handover | L6 | function-spec | L7 | PLAN-L7-383-vmodel-schedule-authoring-source,PLAN-L7-385-vmodel-activation-profile-join | U17a: runtime test/review/gate signal と工程 authoring RAG のlive join、固定4段digest契約をfreeze | green | confirmed |  |
| PLAN-L7-412-schedule-live-session-digest | L7 |  | L6 | PLAN-L6-52-signals-schedule-live-handover | U17b: 工程live stateと固定4段SessionStart digestを実装し、旧feedback/memory個別surfaceを統合 | green | confirmed |  |
| PLAN-REVERSE-412-schedule-live-session-digest-backfill | cross | function-spec | L7 | PLAN-L7-412-schedule-live-session-digest | U17b-r: 既存handover/feedback/memory surfaceをL6固定4段digest契約へbackfill | green | confirmed |  |
| PLAN-L5-15-feedback-lifecycle-physical-data | L5 | physical-data | L8 | PLAN-L7-412-schedule-live-session-digest | U17c-physical: source generationとappend-only lifecycleの物理境界をfreeze | green | confirmed |  |
| PLAN-L6-68-memory-telemetry-lifecycle-contract | L6 | function-spec | L7 | PLAN-L5-15-feedback-lifecycle-physical-data | U17c-design: memory昇格nudge、telemetry消化、source解消の設計契約をfreeze | green | confirmed |  |
| PLAN-L7-392-memory-promotion-handover-digest | L7 |  | L6 | PLAN-L6-68-memory-telemetry-lifecycle-contract | U17c: digest責務移管後、memory昇格nudgeとtelemetry TTL/auto-ackを実装 | green | confirmed |  |
| PLAN-L5-16-vmodel-source-profile-physical-data | L5 | physical-data | L8 | PLAN-L4-22-vmodel-source-disposition-profile-ssot | U19a: source 109/item 163/category 21/profile 8の物理境界 | yellow | draft | L8 pair、schema/index/rebuild invariant待ち |
| PLAN-L5-17-plan-asset-workflow-ledger-physical-data | L5 | physical-data | L8 | PLAN-L4-23-forward-fsm-plan-asset-v2 | U19b: PLAN Asset v2 revision/event/evidence ledger物理境界 | green | confirmed | ledger DB・event/current・FK・partial UNIQUE設計freeze済み。L8実検証は後続 |
| PLAN-L5-18-vmodel-contract-right-arm-physical-data | L5 | physical-data | L8 | PLAN-L4-24-declarative-vmodel-contract-right-arm | U19c: contract/right-arm evidence manifest物理境界 | yellow | draft | L5-16/17、L8 pair待ち |
| PLAN-L5-19-repository-document-disposition-ledger | L5 | physical-data | L8 | PLAN-L4-25-repository-docs-engine-swap-audit | U19d: 全tracked docs disposition shard/snapshot/delta設計 | yellow | draft | 921件materialize、L8 pair待ち |
| PLAN-L5-20-engine-swap-module-decomposition | L5 | module-decomposition | L8 | PLAN-L4-26-engine-swap-object-method-design | U19e: aggregate/domain/application/port/adapter分解 | yellow | draft | class採否、cycle 0、L8 pair待ち |
| PLAN-L5-21-semantic-assessment-debt-routing-physical-data | L5 | physical-data | L8 | PLAN-L4-27-vmodel-semantic-self-audit | U19f: 163 item assessment/review/debt route物理境界 | yellow | draft | L5-19/20、pending 0設計待ち |
| PLAN-L5-22-detector-self-proof-receipt-physical-data | L5 | physical-data | L8 | PLAN-L4-28-design-detection-self-proof | U19g: self-proof receipt/mutation corpus物理境界 | yellow | draft | L5-18/21、mutation oracle待ち |
| PLAN-L6-70-source-catalog-profile-resolver-contracts | L6 | function-spec | L7 | PLAN-L5-16-vmodel-source-profile-physical-data | U20a: catalog aggregate/profile overlay resolver契約 | yellow | draft | L5-16 pair-freeze待ち |
| PLAN-L6-71-plan-asset-canonical-migration-contracts | L6 | function-spec | L7 | PLAN-L5-17-plan-asset-workflow-ledger-physical-data | U20b: PlanAsset/Revision/Evidence/migration契約 | green | confirmed | identity/canonical migration/reservation設計freeze済み。U-PA Red待ち |
| PLAN-L6-72-forward-fsm-evidence-policy-contracts | L6 | function-spec | L7 | PLAN-L6-71-plan-asset-canonical-migration-contracts | U20c: Forward FSM/reducer/transition/evidence policy契約 | green | confirmed | FSM/evidence/CLI/property設計freeze済み。418完了後U-FSM Red待ち |
| PLAN-L6-73-vmodel-contract-compiler-right-arm-contracts | L6 | function-spec | L7 | PLAN-L5-18-vmodel-contract-right-arm-physical-data | U20d: contract compiler/generic right-arm契約 | yellow | draft | L6-70/72、L7 Red設計待ち |
| PLAN-L6-74-repository-docs-disposition-auditor-contracts | L6 | function-spec | L7 | PLAN-L5-19-repository-document-disposition-ledger | U20e: docs snapshot/disposition/reference closure auditor契約 | yellow | draft | L5-19 pair-freeze待ち |
| PLAN-L6-75-engine-swap-domain-method-port-contracts | L6 | function-spec | L7 | PLAN-L5-20-engine-swap-module-decomposition | U20f: class/method/CQS/port/依存方向契約 | yellow | draft | L6-70〜73、L7 Red設計待ち |
| PLAN-L6-76-semantic-assessment-debt-routing-contracts | L6 | function-spec | L7 | PLAN-L5-21-semantic-assessment-debt-routing-physical-data | U20g: semantic verdict/evidence/debt routing契約 | yellow | draft | L6-74/75、163 item oracle待ち |
| PLAN-L6-77-detector-compiler-meta-verifier-contracts | L6 | function-spec | L7 | PLAN-L5-22-detector-self-proof-receipt-physical-data | U20h: deterministic compiler/independent meta-verifier契約 | yellow | draft | L6-73/76、mutation survivor 0設計待ち |
| PLAN-L7-417-source-disposition-profile-projection | L7 | implementation | L6 | PLAN-L6-70-source-catalog-profile-resolver-contracts | U20i-1: catalog/profile domainとprojection | yellow | draft | U-DISP/U-PROFILE Red、REVERSE-417待ち |
| PLAN-REVERSE-417-source-disposition-profile-backfill | cross | function-spec | L7 | PLAN-L7-417-source-disposition-profile-projection | U20i-1R: catalog/profile実装backfill | yellow | draft | L7-417実装観測待ち |
| PLAN-L7-418-plan-asset-v2-adapter-migration-ledger | L7 | implementation | L6 | PLAN-L6-71-plan-asset-canonical-migration-contracts | U20i-2: PLAN Asset v2 adapter/migration | yellow | confirmed | U-PA-001〜042 Green。U-PA-043〜046 token custody/evidence型、REVERSE-418待ち |
| PLAN-REVERSE-418-plan-asset-v2-backfill | cross | function-spec | L7 | PLAN-L7-418-plan-asset-v2-adapter-migration-ledger | U20i-2R: PLAN Asset実装backfill | yellow | draft | L7-418実装観測待ち |
| PLAN-L7-419-forward-fsm-transition-workflow-cli | L7 | implementation | L7 | PLAN-L7-418-plan-asset-v2-adapter-migration-ledger | U20i-3: Forward FSM/CLI | yellow | draft | 418 token/evidence port、U/P-FSM Red、REVERSE-419待ち |
| PLAN-REVERSE-419-forward-fsm-backfill | cross | function-spec | L7 | PLAN-L7-419-forward-fsm-transition-workflow-cli | U20i-3R: FSM実装backfill | yellow | draft | L7-419実装観測待ち |
| PLAN-L7-420-vmodel-contract-compiler-registry | L7 | implementation | L6 | PLAN-L6-73-vmodel-contract-compiler-right-arm-contracts | U20i-4: contract compiler/registry | green | confirmed | independent review、U-VMC Green、REVERSE-420合流済み |
| PLAN-REVERSE-420-vmodel-contract-compiler-backfill | cross | function-spec | L7 | PLAN-L7-420-vmodel-contract-compiler-registry | U20i-4R: compiler実装backfill | green | confirmed | L4-L7へ実装事実を合流済み |
| PLAN-L7-421-generic-right-arm-doctor-gate | L7 | implementation | L7 | PLAN-L7-420-vmodel-contract-compiler-registry | U20i-5: contract-derived right-arm/right-lung gate | green | confirmed | independent review、負例Green、REVERSE-421合流済み |
| PLAN-REVERSE-421-generic-right-arm-backfill | cross | function-spec | L7 | PLAN-L7-421-generic-right-arm-doctor-gate | U20i-5R: right-arm gate backfill | green | confirmed | L6/L7へ実装事実を合流済み |
| PLAN-L7-422-repository-document-disposition-closure-gate | L7 | implementation | L6 | PLAN-L6-74-repository-docs-disposition-auditor-contracts | U20i-6: docs ledger/closure gate | yellow | draft | U-DOCLEDGER Red、921 materialize待ち |
| PLAN-REVERSE-422-repository-document-ledger-backfill | cross | function-spec | L7 | PLAN-L7-422-repository-document-disposition-closure-gate | U20i-6R: docs ledger実装backfill | yellow | draft | L7-422実装観測待ち |
| PLAN-L7-423-engine-swap-domain-objects-ports | L7 | implementation | L7 | PLAN-L7-417-source-disposition-profile-projection,PLAN-L7-418-plan-asset-v2-adapter-migration-ledger,PLAN-L7-419-forward-fsm-transition-workflow-cli,PLAN-L7-420-vmodel-contract-compiler-registry,PLAN-L7-422-repository-document-disposition-closure-gate | U20i-7: shared kernel/module boundary移行 | yellow | draft | source owner完了、U-DOMAIN Red、cycle 0待ち |
| PLAN-REVERSE-423-engine-swap-domain-backfill | cross | function-spec | L7 | PLAN-L7-423-engine-swap-domain-objects-ports | U20i-7R: domain実装backfill | yellow | draft | L7-423実装観測待ち |
| PLAN-L7-424-semantic-assessment-debt-router | L7 | implementation | L7 | PLAN-L7-422-repository-document-disposition-closure-gate,PLAN-L7-423-engine-swap-domain-objects-ports | U20i-8: semantic evaluator/debt router | yellow | draft | normalized schema、U-ASSESS Red、163 review待ち |
| PLAN-REVERSE-424-semantic-assessment-backfill | cross | function-spec | L7 | PLAN-L7-424-semantic-assessment-debt-router | U20i-8R: assessment実装backfill | yellow | draft | L7-424実装観測待ち |
| PLAN-L7-425-independent-detector-meta-verifier | L7 | implementation | L7 | PLAN-L7-420-vmodel-contract-compiler-registry,PLAN-L7-421-generic-right-arm-doctor-gate,PLAN-L7-424-semantic-assessment-debt-router | U20i-9: independent meta-verifier/receipts | yellow | draft | normalized receipt schema、U/I/M-SP Red、mutation survivor 0待ち |
| PLAN-REVERSE-425-detector-meta-verifier-backfill | cross | function-spec | L7 | PLAN-L7-425-independent-detector-meta-verifier | U20i-9R: self-proof実装backfill | yellow | draft | L7-425実装観測待ち |
| PLAN-L8-01-engine-swap-integration-verification | L8 | verification | L5 | PLAN-L5-16-vmodel-source-profile-physical-data,PLAN-L5-22-detector-self-proof-receipt-physical-data | U21a/G8: engine-swap integration verification | yellow | draft | L5 pair-freeze、IT evidence manifest待ち |
| PLAN-L9-01-engine-swap-system-verification | L9 | verification | L4 | PLAN-L8-01-engine-swap-integration-verification | U21b/G9: engine-swap whole-system verification | yellow | draft | G8 pass、ST-ENGINE evidence待ち |
| PLAN-L10-01-engine-swap-ux-validation | L10 | verification | L2 | PLAN-L9-01-engine-swap-system-verification | U21c/G10: CLI/feedback UX validation | yellow | draft | G9 pass、UXV case/evidence待ち |
| PLAN-L11-01-engine-swap-uat-review | L11 | process-evidence | L1/L3/L4/L5/L6/L7 | PLAN-L10-01-engine-swap-ux-validation | U21d/G11: PO scenario UAT/stakeholder review | yellow | draft | G10 pass、UAT approval manifest待ち |
| PLAN-L12-01-engine-swap-acceptance-deploy | L12 | verification | L3 | PLAN-L11-01-engine-swap-uat-review | U21e/G12: acceptance/deploy/rollback readiness | yellow | draft | G11 pass、AT/rollback evidence待ち |
| PLAN-L13-01-engine-swap-post-deploy-verification | L13 | process-evidence | L12 | PLAN-L12-01-engine-swap-acceptance-deploy | U21f/G13: post-deploy smoke/SLI-SLO verification | yellow | draft | G12 pass、smoke/SLO evidence待ち |
| PLAN-L14-01-engine-swap-operational-value-verification | L14 | verification | L1 | PLAN-L13-01-engine-swap-post-deploy-verification | U21g/G14: operational/value feedback verification | yellow | draft | G13 pass、operational KPI/PO decision待ち |
| PLAN-L4-29-security-design-substance | L4 | security | L9 | PLAN-L4-16-security-design-slot | U22a: A-187 §3 のsecurity実体化 (脅威モデル/供給網/鍵/監査ログ + not_applicable明文化) を起票 | yellow | draft | 脅威モデル節、供給網/鍵/監査ログ設計、na判断の catalog 反映待ち |
| PLAN-L6-78-coding-structure-rules-contract | L6 | function-spec | L7 | PLAN-L4-21-domain-vo-coding-constraints | U22b: ZIP-DOC-095 構造規約の analyzer 契約を起票 (A-187 §5) | yellow | draft | rule 語彙の排他分類、analyzer 契約 freeze、L7 add-impl 後続起票待ち |

## 2. 解釈規則

- `current_location` は人間向けの現在地であり、検出器の推測結果ではない。
- `rag=green` は当該工程の設計・実装・検証証跡が揃っている状態を示す。
- `rag=yellow` は工程が正規に進行中、または後続工程が前提待ちであることを示す。
- `blocked_reason` が空でない行は、検出系が `detector_route_candidates` または feedback surface へ上げる候補になり得る。
- 本表に載っていないPLANは、後方互換のため PLAN frontmatter から `schedule_entries` fallback を作る。ただし本表に載ったPLANは本表を優先する。

## 3. 不変条件

- 工程管理表は Workflow 集約の authoring source であり、PLAN frontmatter を暗黙更新しない。
- 駆動モデル選択は `routeFiling` / route mode SSoT に従い、本表は現在地と前提を渡すだけに留める。
- `status=planned` の行は実装完了を意味しない。起票前の位置づけを明示するための計画行である。
- 本表と projection の齟齬は doctor / detector の finding として扱い、projection 側で silent repair しない。

## U11 型付きスペック所有 artifact

```yaml
spec:
  defines:
    - id: VMS-002
      kind: schedule-authoring-source
      traces_from: [VMS-001]
      traces_to: [VMS-005]
      tests: [TVMS-002]
```

VMS-002 は工程管理表の所有 artifact で宣言される typed spec である。
