---
plan_id: PLAN-L7-513-worktree-lifecycle-application
title: "PLAN-L7-513 (add-impl): worktree lifecycle application saga"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-27
updated: 2026-08-27
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L7-501-worktree-lifecycle-domain.md
pair_artifact: docs/test-design/harness/L7-worktree-lifecycle-application-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - lifecycle application reserve/create/observe/activate saga"
  - role: qa
    slot_label: "QA - U-WTAPP fault, identity, path, terminal handoff oracle"
  - role: tl
    slot_label: "TL - #384/#391 domain reuse and application boundary review"
generates:
  - artifact_path: docs/plans/PLAN-L7-513-worktree-lifecycle-application.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-501-worktree-lifecycle-domain.md
  requires:
    - PLAN-L7-501-worktree-lifecycle-domain
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-513-worktree-lifecycle-application-backfill.md
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    - docs/plans/PLAN-L7-501-worktree-lifecycle-domain.md
    - docs/plans/PLAN-REVERSE-501-worktree-lifecycle-domain-backfill.md
    - docs/test-design/harness/L7-worktree-lifecycle-application-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/385
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/391
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/384
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/425
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/428
github_issue_id: 425
backprop_decision: required
backprop_decision_reason: "application sagaの補償・terminal handoff・path境界を上流placement契約へ戻すため。"
review_evidence:
  - reviewer: claude-opus-pr435-pair-freeze
    review_kind: cross_agent
    reviewed_at: "2026-08-27T04:02:47.016Z"
    tests_green_at: "2026-08-27T03:44:31Z"
    verdict: "PASS-WEAK; blocking 0"
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    subject_head: "2eff2dcbe3e16e367e5dbebdca84d649fd9dee1e"
    scope: "PR #435 docs-only pair-freeze。application実装、adapter、物理cleanupは未完であり、本evidenceは実装完了を意味しない。"
    citations:
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/435#issuecomment-5434212084"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/33036697995"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/test-design-naming.test.ts tests/plan-lint.test.ts --reporter=dot"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-27T03:44:31Z"
        evidence_path: tests/test-design-naming.test.ts
        output_digest: "sha256:40ead295773959b04ee240f555696fa028f33973009deaf172ee1b7b370e7a4a"
        anchor_commit: 2eff2dcbe3e16e367e5dbebdca84d649fd9dee1e
---

# PLAN-L7-513: worktree lifecycle application saga

## 1. 位置づけと目的

Issue #425 は、Issue #384（PR #391でmergedされた `PLAN-L7-501` domain）の immutable record / FSM / reducerを
呼び出す application 境界を固定する。worktree の作成と終了を、owner・Issue・PLAN revision・TTL・branch・parent・path
の同一 identity / attempt に束縛し、途中失敗を成功や無音孤児へ丸めない。

これは #385 の L4/L9 pair-freeze と `PLAN-L7-501` の domain 契約を再利用する docs-only pair-freeze である。
本 PLAN は application の順序、補償、handoff、path入力の意味だけを凍結し、adapterや物理操作の実装を追加しない。

## 2. 固定する application 契約

### 2.1 create の入力と side effect 0

create は全入力を side effect 前に検証する。`repository_lineage_id`、`lifecycle_id`、owner、Issue、PLAN ID /
PLAN revision、`use`、`head_oid`、TTL、`activation_deadline`、branch、parent (parent process/session)、path、
`operation_id`、`attempt` のいずれかが欠落・空・不正なら、`reservePath` を含む全呼出しと worktree create / worker spawn を 0 にして typed
deny を返す。これらは各々独立mutationで検証し、別fieldの存在から推測・補完しない。入力は文字列 shell command
ではなく path object / argv 境界で受ける。

作成対象は canonical `C:\dev\` 配下の direct child だけとする。root 自身、nested child、root 外、canonicalize 不能、
junction / reparse point / symlink によって実体が root 外へ解決する path、home、Temp、OneDrive、Windows reserved
name、未解決 link、Windows path長が 240 UTF-16 code units を超える path は fail-close とし、worktree create を 0
にする。240 は長さだけでは拒否せず、239 / 241 の境界を独立に判定する。spaces を含む path は拒否理由にせず、
同じ argv contract で扱う。

direct-child 比較は canonical 実体に対して行う。Windows は drive letter と各 path component を case-insensitive
に比較し、Linux は case-sensitive に比較する。path の字面だけ、cwd、worktree 名、symlink の入口を identity としない。

### 2.2 create saga の順序

正常系の唯一の順序は次のとおりで、段階の省略・並べ替え・暗黙 retry を許さない。

`reservePath → plan → worktree create → observe → worker spawn → start receipt → activate`

| 段階 | 固定する入力・後条件 |
| --- | --- |
| `reservePath` | canonical path、`repository_lineage_id`、`lifecycle_id`、owner、`operation_id`、同一 `attempt` を束縛したpath leaseを原子的に取得する。成功時は検証可能なlease receiptを返し、throw時はreservation / leaseを0として後続を呼ばない。 |
| `plan` | lease receiptを含む全identity/input（`use`、`head_oid`、`activation_deadline`、`attempt`を含む）を同じ `operation_id` / attemptの`planned` recordとしてappendする。record登録失敗時はworktree create / worker spawn 0。 |
| `worktree create` | `planned` recordとleaseがある場合だけ、worktree create port / operationを一度呼ぶ。worker spawn port / operationとは別であり、直接`git worktree add`をapplication内で行わない。post-plan faultはこのrecordを対象に補償する。 |
| `observe` | 作成結果のcanonical worktree/admin entry、inventory available、lineage / identityを同じattemptで照合する。不一致・欠測はworker spawn / activateしない。 |
| `worker spawn` | observe成功後だけ、worker spawn port / operationを一度呼ぶ。worktree create operationと混同せず、spawn成功前にstart receiptを発行しない。 |
| `start receipt` | worker spawn成功のstart receiptを同じ `repository_lineage_id` / `lifecycle_id` / `operation_id` / attempt / ownerに束縛する。foreign receipt・別attempt receipt・欠落はactivate 0。 |
| `activate` | start receipt、owner認証、inventory fact、lease、identity、attempt、`operation_id` が一致した場合だけ `planned → active` を domain reducerへ渡す。 |

owner、identity、attempt、`operation_id` は全段階で同じ値を使う。別 owner、別 repository lineage、別 lifecycle、別
attempt のstart receiptやobservationを補完に使わない。applicationはdomainの許可遷移を再実装せず、domain append
pointを一つに保つ。

### 2.3 fault と補償

faultはrecordの存在で3区分する。pre-reserve（validationまたはreservePath前）はrecordもlease receiptも無いため、
存在しないrecordへのactivation-abort / terminal / cleanup handoffを要求しない。post-reserve / pre-planはlease receiptが
原子的reservePath成功の結果として存在するがrecordは無いため、可能なreceiptだけrelease対象にする。post-plan（worktree create / observe / worker spawn / start receipt / activate）は
planned recordへ同じidentity / `operation_id` / attemptのactivation-abort、path lease release、cleanup handoffを記録する。
いずれも最初のprimary errorを保持し、releasePath自体がthrowしてもrelease errorで置き換えず、release failureをtyped faultとして併記する。
存在しないrecordへの補償要求は発行しない。abort / cleanup handoffの記録失敗も成功へ丸めず、未完了handoffをfail-closeで返す。

activation-abort は `planned → terminal_pending` の sealed domain event とし、#124 の terminal receiptを捏造しない。
補償は物理削除ではなく、後続の cleanup authority が再開できる handoff である。

### 2.4 finish / abort の terminal handoff

- `finish` の正規順序は `terminal event → lease-release receipt → cleanup handoff` である。typed terminal inputまたは
  authenticated owner/session-loss observationを同じlifecycle / `operation_id` / attemptへ束縛してdomainへ渡し、terminal
  event append後にlease releaseを一度試み、release receipt（成功またはtyped fault）を記録してからcleanup handoffを一度だけ記録する。
  terminal event throw時は後続を要求せず、release throw時もterminal eventとhandoffを保持し、handoff throw時もterminal eventと
  release receiptをauthoritative stateとして保持する。各faultは最初のprimary errorを置換しない。
- `abort` は activation fault、起動前 cancel、timeout、owner loss を activation-abort として sealed にし、terminal
  handoffが必要な場合も `terminal event → lease-release receipt → cleanup handoff` の順で同じ identity / `operation_id` /
  attemptへ記録する。active recordへ成功terminalを推測で付与しない。
- terminal receipt 欠落・不一致、owner 認証欠落、inventory 欠測は domain の typed deny（`terminal_missing`、
  `terminal_mismatch`、`owner_unknown`、`inventory_unavailable` 等）を保持し、TTL超過だけで retire / cleanup success
 へ遷移させない。
- finish / abort の再送は同一 receipt なら冪等、異なる digest・identity・attempt なら `replay_conflict` とし、terminal
  stateや既存 handoff を上書きしない。

## 3. 非Scope

この docs-only slice は次を実装・変更しない。

- adapter（Node/Git/FS/process/OS）と `reservePath` / `releasePath` の物理実装
- CLI、doctor、hooks、session start/stop、JSONL ledger / durable ledger
- worktree bytes の physical cleanup、quarantine、branch削除、既存worktree回収（#426）
- #232 inventory detector、#124 Stop worker/resource/cancellation、`PLAN-L7-501` domain FSM の再実装
- #141 placement cutover、canonical state root 移設、OneDrive からの実移動

## 4. 設計と検証の対

pair artifact の `CANDIDATE-U-WTAPP-001..007` と `CANDIDATE-P-WTAPP-001` は、実装前の RED oracle として保持する。
candidate を Green 実績、既存実装、既存worktree cleanupの証拠とはみなさない。

## 5. Schedule と完了条件

1. [直列] `PLAN-L7-501` domain の confirmed identity / attempt / transition 契約を入力として application port境界を固定する。
2. [直列] reserve→plan→worktree create→observe→worker spawn→start receipt→activate と fault compensation の Red oracle を pair-freeze する。
3. [並列] OS path boundary、finish/abort handoff、identity/replay、performance candidate を検証する。
4. [直列] Reverse R1〜R4、targeted test、plan lint、非著者 exact-head reviewへ進む。

完了条件は、全必須入力欠落時の create 0、順序違反の検出、primary error 保持、releasePath fault時の abort / cleanup
handoff、finish / abort の terminal handoff、Windows/Linux path規則、および candidateの1:1 traceを実装とテストで実測すること。
docs-only freeze時点ではこれらの Greenを主張しない。

性能candidateは `N=100` valid attemptsを固定し、各port/event/handoffを `1N+0` 回以下（正常系は各々 exactly `N`）とする。
portは `reservePath / worktree create / observe / worker spawn / start receipt / releasePath` の6種で総呼出し `6N+0` 以下、
append eventは `plan / activate / terminal` の3種で総数 `3N+0` 以下、cleanup handoffは `1N+0` 以下にする。暗黙retryやNに対する二次増幅は許可しない。
