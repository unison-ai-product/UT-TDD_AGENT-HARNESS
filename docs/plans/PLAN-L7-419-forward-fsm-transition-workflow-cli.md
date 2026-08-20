---
plan_id: PLAN-L7-419-forward-fsm-transition-workflow-cli
title: "PLAN-L7-419 (add-impl): Forward FSM transition engine / workflow CLI"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-08-20
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - ForwardWorkflow/reducer/policy/ledger/CLI"
  - role: qa
    slot_label: "QA - U-FSM/P-FSM Red→Green"
generates:
  - artifact_path: docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-419-forward-fsm-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/forward/adapters/cli-registrar.ts
    artifact_type: source_module
  - artifact_path: src/forward/adapters/in-memory-forward-ledger.ts
    artifact_type: source_module
  - artifact_path: src/forward/adapters/in-memory-forward-projection.ts
    artifact_type: source_module
  - artifact_path: src/forward/application/forward-evidence-policy.ts
    artifact_type: source_module
  - artifact_path: src/forward/application/forward-workflow.ts
    artifact_type: source_module
  - artifact_path: src/forward/domain/reducer.ts
    artifact_type: source_module
  - artifact_path: src/forward/domain/transition-policy.ts
    artifact_type: source_module
  - artifact_path: src/forward/domain/types.ts
    artifact_type: source_module
  - artifact_path: src/forward/domain/workflow.ts
    artifact_type: source_module
  - artifact_path: src/forward/ports/forward-ledger.ts
    artifact_type: source_module
  - artifact_path: src/forward/ports/forward-projection.ts
    artifact_type: source_module
  - artifact_path: tests/forward/fsm.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
  requires:
    - PLAN-L7-418-plan-asset-v2-adapter-migration-ledger
  blocks: []
  references:
    - docs/plans/PLAN-L7-418-plan-asset-v2-adapter-migration-ledger.md
    - src/plan-asset/application/legacy-migration-decision-manifest.ts
    - docs/plans/PLAN-REVERSE-419-forward-fsm-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/108
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/342
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/344
github_issue_id: 344
review_evidence:
  - reviewer: codex-integration-precheck
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-20T12:22:10+09:00"
    tests_green_at: "2026-08-20T12:21:39+09:00"
    verdict: pass
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    green_commands:
      - kind: unit_test
        command: "node_modules/.bin/vitest run tests/forward/fsm.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-20T12:21:39+09:00"
        evidence_path: tests/forward/fsm.test.ts
        output_digest: "sha256:2c7539d5b8c48a29e453fe7562631425c00614ae0bc05f416c1185098efecaa6"
        anchor_commit: fa6e8661
    scope: >-
      Issue #344 bounded implementation。PR #349 (merge commit 62a159ef) で src/forward と FSM test を実装し、
      Opus pre-gate と targeted test evidence を記録済み。非作者 closing review / CI / Reverse は後続 gate として残す。
---

# PLAN-L7-419: Forward FSM transition engine / workflow CLI

## 0. 位置づけと pair-freeze 境界

Issue #344 は、L層検証契約の正本である Issue #108 の正式な bounded implementation child
である。#342はdocs-only pair-freezeのpredecessor/reference、Issue #224（段階リリース全体）は
Related として参照するが、本PLANの実装所有者ではない。#341でmainへ到達した
PLAN-L7-418のidentity・EvidenceRecord・reservation portを前提に、Forward状態機械の実装
入場条件だけを凍結する。

本PRは **docs-only pair-freeze** である。`src/forward/**`、CLI、実行可能なFSM test、
Episode、Pack結線を生成・変更しない。draft PLANの`generates`は本PLANとReverse PLANだけに
限定し、実装source/testの所有権は後続のbounded implementation Issue/PRで初めて宣言する。

main実査では、PLAN-L7-418のU-PA-043/U-PA-044がreservation token、EvidenceRecord境界、
3表transaction rollbackを既に固定している。旧IMP-156の未解消記録はその証跡へ更新し、
後続の設計不足IMP-167はReverse-419で扱う。418の既存契約を419で再発明しない。

## 1. 設計判断

### 1.1 遷移表をSSoTにする

state直書きやcommandごとの分岐複製は許可せず、許可された`state × event × evidence`
からnext stateを一意に導くtransition policyを唯一の正本とする。reducerはappend-only
eventを再生し、同一入力列から同一state/verdict/digestを得る。

### 1.2 command/queryを分離する

`workflow status|explain`はread-only projection、`workflow transition`と実装・review・accept
commandはtyped policyを通るapplication serviceとする。policy違反時はtyped reasonで
fail-closeし、event/outbox/外部intentを生成しない。

### 1.3 既存EvidenceRecord/Reservation portを再利用する

EvidenceRecord、reservation、migration ledgerのidentityとtransaction境界は
PLAN-L7-418を注入portとして再利用する。Forward固有の新型を先に作らず、実装PRで
adapter/application seamを追加する。

実装時に候補となるbounded surfaceは `src/forward/{domain,application,ports,adapters}`,
event/evidence projection、CLI registrar、`tests/forward/**` だが、pair-freezeでは
ファイルを作成しない。

## 2. Red freeze と oracle 対

実装PRで次の候補を1:1で昇格し、pair-freeze中はREDのまま保持する。既存の
`CANDIDATE-P-FSM-001`も同じtransition policyのproperty oracleとして束ねる。

- `CANDIDATE-U-FSM-001`: transition tableの正例を許可表どおりに通し、許可表にないstate/event全般は`forward-transition-illegal`で拒否。
- `CANDIDATE-U-FSM-002`: 飛越し、逆行、terminal後commandを拒否し、stateを不変にする。
- `CANDIDATE-U-FSM-003`: pair freezeまたはRed evidence欠落のimplementを拒否し、外部intentを0件にする。
- `CANDIDATE-U-FSM-004`: trace freeze欠落のreviewを拒否し、review stateを昇格しない。
- `CANDIDATE-U-FSM-005`: review/test evidence不足のacceptを拒否し、acceptedへ遷移しない。
- `CANDIDATE-U-FSM-006`: blocked/reopenedのreasonまたはtyped evidence欠落を拒否し、reentry/rollback intentを発行しない。
- `CANDIDATE-U-FSM-007`: 同一event列のreplayでstate/verdict/digestを一致させ、projection/outboxを二重生成しない。
- `CANDIDATE-U-FSM-008`: ledger entry不在・projection再構築不能を`forward-ledger-unavailable` / exit 3へ閉じ、PLAN frontmatterからstateを補完せず副作用0件にする。
- `CANDIDATE-U-FSM-009`: 12 lifecycle eventの必須evidence欠落・期限切れを表のspecialized ruleまたは`forward-evidence-missing` / exit 2へ閉じ、eligible frontier・state・outboxを変更しない。

## 3. Acceptance criteria / DoD

- [ ] `CANDIDATE-U-FSM-001..009`と`CANDIDATE-P-FSM-001`がtest-design台帳に登録される。
- [ ] transition table、EvidenceRecord port、reservation境界、禁止遷移を設計判断として固定する。
- [ ] `requires`がconfirmedなPLAN-L7-418を指し、IMP-156はU-PA-043/U-PA-044へ解決、IMP-167はReverseへ送られる。
- [ ] Schedule、AC/DoD、実装時のbounded surface、Reverse-419 R0→R4が相互参照される。
- [ ] draftの`generates`はPLAN文書だけで、`src/forward/**`や実装testを先取りしない。
- [ ] exact HEADでplan lint、candidate/trace/backfill doctorがGreenになる。
- [ ] 非作者Claudeによるclaim-blind/spec-blind closing reviewが同一revisionでPASSする。
- [ ] pair-freeze merge後にのみ、別Issue/PRでLuna実装を開始する。

## 4. 工程と出口

1. **[直列/docs] pair-freeze** — #342で本PLAN、Reverse PLAN、候補9件、依存と境界を確定する。#347でevidence ruleと所有Issueの補正を行う。
2. **[直列/review] cross-review** — exact HEAD、plan lint、doctor、Claude closing PASSを揃える。
3. **[直列/implementation] bounded implementation** — pair-freeze merge後、別Issue/PRでLunaが
   `src/forward/**`とU/P-FSMを実装し、Opusがpre/post gateを行う。
4. **[直列/reverse] R0→R4** — 実装のsignature/storage/evidence差分、replay/fault、全surface
   verdictを検証し、必要なL6 backfill後にForwardへ戻す。

## 5. スコープ境界

GitHub Project/Issue projection、D1/D2/D3 review custody、Execution Episode E0-E15、
PF-5 Pack admission、外部Pack copy、promotion/rollbackは本PLANに混ぜない。それぞれの
既存PLANと親Issueの依存順に従う。
