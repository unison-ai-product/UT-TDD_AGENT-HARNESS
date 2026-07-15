---
plan_id: PLAN-L7-438-reentry-internal-ci-auto-pr
title: "PLAN-L7-438 (add-impl): 駆動モデル再合流・内部CI・draft PR自動化"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-84-drive-model-reentry-verification-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - episode reducer・certificate・internal CI・draft PR worker"
  - role: qa
    slot_label: "QA - 中間/合流後test、crash/retry/stale HEADのRed oracle"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-438-reentry-internal-ci-auto-pr.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-438-reentry-internal-ci-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-84-drive-model-reentry-verification-contract.md
  requires: []
  references:
    - docs/plans/PLAN-L6-50-execution-assignment-ledger.md
    - docs/plans/PLAN-L6-72-forward-fsm-evidence-policy-contracts.md
    - docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
    - docs/plans/PLAN-REVERSE-438-reentry-internal-ci-backfill.md
  blocks:
    - docs/plans/PLAN-L7-439-cross-review-merge-learning-closure.md
---

# PLAN-L7-438: 駆動モデル再合流・内部CI・draft PR自動化

## 1. 実装目的

L4-30のE0–E15 lifecycleのうち、off-Forward Issueと駆動モデル実行を受け取った後の
`E6 drive_verified`から`E12 draft_pr_projected`までを実装する。駆動モデル内のgreenをそのまま
Forward merge許可へ読み替えず、ReentryCertificate、中間test、Forward仮合流後test、同一HEADの
内部CIを順番に通した後だけdraft PRを作る。

## 2. 実装境界

### 2.1 Episode reducer / repository

- L5-23の`execution_episode_events`をappend-onlyで読み、E6→E12の正規遷移をpure reducerで再構築する。
- command/event ID、episode ID、sequence、policy revisionをvalue object化し、stringの取り違えを防ぐ。
- event appendとGitHub outbox enqueueは同一transactionに置き、projection更新を正本にしない。
- E6未達、drive model不一致、origin/reentry revision不一致、event飛越しはstructured rejectionを返す。

### 2.2 ReentryCertificate

`issue/drive/origin/reentry/evidence/head/policy` claimをcanonicalizeし、content digest付きcertificateを発行する。
別episode、別origin revision、別target revision、別HEAD、期限切れpolicyのcertificateをconsumeできない。
certificate consumeとE10 appendをatomicにし、二重再合流を防ぐ。

### 2.3 二段testと内部CI

1. **中間test (E9)**: 選択drive model内のhypothesis/repair/refactor oracleをsource revisionへ実行する。
2. **Forward仮合流後test (E11)**: target revisionとのisolated candidateを作り、impact graphが要求する
   targeted/integration/system/doctor/contract profileをcandidate HEADへ実行する。

test resultはcommand、runner、scope、exit、completed_at、output digest、tested commitを保持する。
E9 evidenceをE11へ流用せず、対象HEADの違うgreenや失敗後の古いgreenを採用しない。
internal CI runnerはprovider-independent portとし、GitHub Actionsの表示を内部判定正本にしない。

### 2.4 draft PR projector (E12)

- E11 greenかつfreshなcertificateだけを`RequestDraftPullRequest` outboxへ変換する。
- PR bodyへIssue、episode、origin 4-tuple、drive model、reentry target、二段test digest、impact/backprop、HEADを投影する。
- logical key `(repository, episode_id, pull_request, intent_revision)`で冪等化する。
- timeout/429/5xx/応答喪失時はremote queryで既存PRをreconcileしてから再送し、重複PRを作らない。
- E4到達後にGitHubが不通となってもE5–E11は保持できるが、E12成功やready-for-reviewを推測しない。E4未達ならE5以降へ進めない。

## 3. TDD Red freeze

実装前に次のoracleをRedで固定する。

| oracle | Red条件 / Green契約 |
|---|---|
| `U-REENTRY-001` | E6前のcertificate発行、またはE8/E9/E10/E11飛越しを拒否 |
| `U-REENTRY-002` | drive model、origin revision、target revision、HEADの不一致を拒否 |
| `U-REENTRY-003` | certificate二重consumeがE10を二重appendしない |
| `U-REENTRY-004` | 中間testのみ、合流後testのみ、digestなしをE11/E12へ進めない |
| `U-REENTRY-005` | impact graph未処理artifactをbackprop findingとして残し、合流を拒否 |
| `U-PRFLOW-001` | eligible certificate + E11 greenだけがdraft PR outboxを1件作る |
| `U-PRFLOW-002` | PR bodyのIssue/origin/drive/reentry/test/HEAD欠落mutationを検出 |
| `U-PRFLOW-003` | timeout、429、5xx、worker crash後の再送でPRが1件に収束 |
| `P-REENTRY-001` | E6–E12のevent列を生成し、非許可state到達不能・replay決定性を証明 |

integration fixtureはSQLite transaction crash point、outbox lease失効、webhook/poll重複、target base更新、
GitHub応答成功直後のprocess crashを含める。

## 4. CLI / worker surface

- `ut-tdd execution reentry certify --episode <id>`: query+commandを分離し、JSONにrule IDとsubject revisionを返す。
- `ut-tdd execution verify --episode <id> --stage intermediate|post-reentry`: profileを設計から解決する。
- `ut-tdd execution pr project --episode <id>`: E11未達・入力不正はvalidation exit 1、authorization guardはexit 2、外部障害はexit 3。
- background workerはbounded batch/lease/retry budgetを持ち、終了可能で常駐前提を設計へ埋め込まない。

## 5. AC

- [ ] E6–E12 reducer、repository、certificate、runner、GitHub PR portが短い責務単位に分離される。
- [ ] 中間testとForward合流後testが別artifact/別evidenceとして同一candidateへtraceする。
- [ ] certificate、test、CI、PRのsubject HEADが一致しない限りE12へ進まない。
- [ ] draft PRは完全なtrace bodyを持ち、timeout/crash/retry後も1件だけ生成される。
- [ ] GitHub不通でもLedger/certificate/test custodyを失わず、復旧後に同一intentを再開できる。
- [ ] `U/P-REENTRY-*` / `U-PRFLOW-*`がRed→Greenとなり、mutation survivor 0を記録する。
- [ ] 別provider review後、REVERSE-438で観測事実をL4/L5/L6/test-designへgap-only backfillする。
