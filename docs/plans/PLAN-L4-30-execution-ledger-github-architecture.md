---
plan_id: PLAN-L4-30-execution-ledger-github-architecture
title: "PLAN-L4-30 (add-design/function): Execution Ledger と GitHub Forward再合流アーキテクチャ"
kind: add-design
layer: L4
sub_doc: function
drive: fullstack
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-21
owner: PO / Codex
parent_design: docs/design/harness/L4-basic-design/function.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: "TL - Forward escape境界、再合流条件、GitHub障害時の統制判断"
  - role: se
    slot_label: "SE - Execution Ledger集約、outbox/inbox、GitHub projection契約"
  - role: qa
    slot_label: "QA - E0-E15遷移、重複配送、stale HEAD、再合流負系のoracle"
generates:
  - artifact_path: docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
    - docs/plans/PLAN-L6-50-execution-assignment-ledger.md
  blocks:
    - docs/plans/PLAN-L5-23-execution-ledger-github-physical-data.md
  references:
    - docs/process/forward/overview.md
    - docs/process/plan-asset-v2.md
    - docs/process/gates.md
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/test-design/harness/L9-system-test-design.md
review_evidence:
  - reviewer: claude-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-21T18:24:00+09:00"
    tests_green_at: "2026-07-21T18:23:35+09:00"
    verdict: approve
    scope: "claim-blind / spec-blind 両レーン PASS。L9 pair oracle (ST-EPISODE/ST-CLOSURE) 実在、Ledger=authoritative/GitHub=projection 不変条件の L4→L5→L6 降下整合を確認。詳細は A-189。"
    worker_model: codex-gpt-5
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: lint
        command: "bun src/cli.ts plan lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-21T18:23:35+09:00"
        evidence_path: .ut-tdd/audit/A-189-execution-ledger-design-trio-blind-review-2026-07-21.md
        output_digest: "sha256:d03515a765cb89a50d2fc80c6a5aef3cfda573b8c2b1121959dfe89d85d1349a"
        anchor_commit: 2c34ac34f343e54eb6a0e90f2348cc5420883604
---

# PLAN-L4-30: Execution Ledger と GitHub Forward再合流アーキテクチャ

## 0. 目的

通常の Forward (`plan → pair-freeze → implement → trace-freeze → review → accept`) は GitHub Issue を必須にしない。一方、通常経路を外れる episode は、HARNESS 内部だけで暗黙処理せず GitHub Issue を外部境界として可視化する。本 PLAN は Execution Ledger を制御上の正本、GitHub を冪等な外部 projection とし、駆動モデル内検証から Forward 再合流、PR、cross-review、main mergeまでを一つのdurable lifecycleとして定義する。

GitHubの可用性や表示状態を workflow の正本にはしない。GitHub停止、二重webhook、API timeout、PR番号変更が起きても、episode、証跡、再入位置、merge可否を失わない構造を先に固定し、検出器と自動化をこの設計へ追従させる。

## 1. 境界と集約

### 1.1 Forward escape境界

次の遷移は外部Issueを必須とする。

- `blocked`、`rejected`、`reopened`、`superseded`
- Reverse、Recovery、Incident
- Scrum/PoC branch
- 通常順序を変更する先行着手またはpreemptive work
- time-bounded defer

Issueは第二の状態機械ではない。許可遷移、現在revision、再合流位置はPLAN Asset v2 / Forward FSMが判定し、Issueはそのescape episodeの外部projectionである。

### 1.2 Execution Episode集約

`ExecutionEpisode`を集約rootとし、最低限次を不変属性として持つ。

- `episode_id`、`recurrence_id`、`event_sequence`
- origin `plan_asset_id`、`plan_revision`、`layer`、`forward_state`
- `escape_type`、`reason_code`、検証対象のassumption/decision
- 必須`drive_model`、選択根拠、human override evidence
- `reentry_target_state`、`reentry_policy_revision`
- source commit、latest observed HEAD、required CI profile
- Issue/branch/PRの外部identity mapping

未知の`drive_model`、PLAN kind・branch kind・escape typeと矛盾する選択、根拠のないoverrideはfail-closeする。選択した駆動モデルからPLAN template、V-pair義務、工程表branch、workflow、必須CI profileを導出する。

### 1.3 正本とprojection

- append-only `ExecutionEvent`とそのreducer結果を制御正本とする。
- GitHub Issue、branch、check、PR、review、mergeは外部projectionとする。
- outboxが送信意図、inboxが外部観測をdurableに保持し、API呼出し成功だけを状態遷移の根拠にしない。
- projectionは全削除・再構築可能であり、外部IDと内部episode IDの対応は一意かつ監査可能にする。
- webhookとpollingは同じinbox normalizationを通し、配送順ではなくGitHub event identityとhead SHAで整列する。

## 2. E0-E15 durable lifecycle

| 状態 | 意味 | 次状態へ必要な証拠 |
|---|---|---|
| E0 `escape_observed` | Forward外遷移候補を観測 | origin PLAN/revision/state、signal |
| E1 `escape_classified` | Forward内/外/不正を分類 | 閉じたescape type、分類rule revision |
| E2 `drive_selected` | 駆動モデルを確定 | 適合判定、選択根拠、必要ならoverride |
| E3 `issue_requested` | Issue作成意図をoutboxへ登録 | episode ID、冪等key、canonical payload digest |
| E4 `issue_projected` | GitHub Issueとの対応を確認 | external ID/URL、payload reconciliation |
| E5 `drive_plan_frozen` | 駆動モデル内PLAN/V-pairとbranchをfreeze | PLAN revision、paired oracle、base SHA |
| E6 `drive_verified` | 駆動モデル固有検証を通過 | required test/evidence profile |
| E7 `reentry_proposed` | Forward再入候補を構成 | original assumption/decisionの判定結果 |
| E8 `intermediate_verified` | 合流前中間テストを通過 | target L/state対応oracle |
| E9 `reentry_certified` | 再合流証明を発行 | E6/E8、origin/reentry revision、evidence digest |
| E10 `forward_reentered` | Forward FSMへ正規遷移 | certificate消費、resume event |
| E11 `post_reentry_verified` | 合流後テストを通過 | latest HEAD上の必須CI |
| E12 `draft_pr_projected` | draft PRを冪等生成 | base/head、episode/Issue/PLAN link |
| E13 `cross_review_approved` | 別runtime/modelが判定 | review evidence、最新HEAD一致 |
| E14 `merged` | mainへmerge | exact merge SHA、remote reconciliation |
| E15 `closed_learned` | main CI、Issue close、学習loopを確定 | main CI、Issue close、telemetry集計 |

状態飛越しは禁止する。外部副作用の再試行は同じ冪等keyを再利用し、同じeventを二重appendしない。失敗、取消し、stale化はeventとして保持し、過去を更新して消さない。

## 3. 再合流・PR・mergeゲート

`ReentryCertificate`は少なくともepisode、origin PLAN Asset/revision/state、採択drive model、駆動モデル検証 (E6)、中間test (E8)、再入先、source/head SHA、発行policy revision、証拠digestを結ぶ。別episode・別revision・別HEADのcertificateは利用できない。

draft PR自動生成はE11通過後だけ許可する。main mergeは次をすべて満たす場合に限定する。

1. E9 certificateが有効で、E10で一度だけ消費されている。
2. E6、E8、E11の必須test/CIが各subject SHAでGreenであり、E11以降のPR headと一致する。
3. authorと異なるruntime/model familyのcross-reviewがPASSである。
4. PR head SHA、review対象SHA、CI対象SHA、merge対象SHAが一致する。
5. unresolved blocker、未処理outbox、矛盾するinbox observationがない。
6. branch protectionが許せばauto-merge、許さなければhuman approval付きmergeへ分岐する。

## 4. 設計学習telemetry

Issue数の削減を目標にしない。escapeを`layer × escape_type × cause × drive_model × recurrence_id × reentry outcome`で集計し、同一原因の再発率を下げる。PoCはS4 decision、採否、再合流先まで閉じなければ完了扱いにしない。

集計結果は上流Forwardのassumption、設計判断、evidence policy、工程表branch、駆動モデル選択規則の改訂候補を生成する。telemetryは設計変更を自動承認せず、PLAN/ADRへ戻す入力とする。

## 5. 受入条件

- 通常ForwardではIssue不要、列挙したescapeではIssue必須という境界を正負両方で証明する。
- `drive_model`欠落、未知値、PLAN/escape/branchとの矛盾、根拠なしoverrideをE1以前で拒否する。
- E0-E15の全合法遷移と、飛越し・逆行・証拠欠落・別revision証拠の全負系oracleをL9に持つ。
- GitHub API停止中もE0-E3を保持し、復旧後の再送でIssue/PRを重複生成しない。
- webhook二重配送、順序逆転、polling重複が同じreduction結果になる。
- projection全削除/rebuild後もepisode、外部identity、現在state、merge可否が一致する。
- 駆動モデル内検証、再合流前中間テスト、再合流後テストを別証拠として保持し、相互代用を拒否する。
- stale PR head、stale review、stale CI、別episode certificateではmergeできない。
- escape telemetryがL/type/cause/drive/outcome別に再構築でき、recurrenceを重複countしない。

## 6. 降下先

L5でevent/outbox/inbox/projection/telemetryの物理データ設計、L6でdomain contract・GitHub adapter・reentry/merge policy、L7でCLI/worker/projector、L8で統合検証、L9でsystem lifecycle検証を対にして起票する。
