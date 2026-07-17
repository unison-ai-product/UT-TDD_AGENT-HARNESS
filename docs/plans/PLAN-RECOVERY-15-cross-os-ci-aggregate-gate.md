---
plan_id: PLAN-RECOVERY-15-cross-os-ci-aggregate-gate
title: "PLAN-RECOVERY-15 (recovery): Linux / Windows CI の最終 aggregate gate 収束 (issue #97)"
kind: recovery
layer: cross
drive: agent
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-17
updated: 2026-07-17
owner: PM / PO
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
backprop_decision: not_required
backprop_decision_reason: "上流 requirements §6.9.2/6.9.4 と FR-L1-17 は既にaggregateを要求済みで、新規上流要件の追加は不要。同Recovery内でL6契約とL8検証設計を正本へ追補し、既存PLAN-REVERSE-448との整合を照合する。"
agent_slots:
  - role: aim
    slot_label: "AIM — aggregate gate の成功条件、cancel/skip/failure の fail-close 判定と Required Status Check 境界"
  - role: se
    slot_label: "SE — harness-check.yml への always aggregate job と policy detector の実装"
  - role: qa
    slot_label: "QA — Linux/Windows の success/failure/cancel/skip 組合せ負例と実 GitHub CI 証跡"
  - role: tl
    slot_label: "TL — requirements / FR-L1-17 / L6-82 / L7-221 / L7-448 / Reverse pair の横断収束判定"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-15-cross-os-ci-aggregate-gate.md
    artifact_type: markdown_doc
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: config
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
  - artifact_path: src/lint/github-ci-policy.ts
    artifact_type: source_module
  - artifact_path: tests/github-ci-policy.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - PLAN-L7-448-source-repo-windows-ci-job
  blocks: []
  references:
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/design/harness/L1-requirements/functional-requirements.md
    - docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
    - docs/plans/PLAN-L7-221-github-ci-policy-gate.md
    - docs/plans/PLAN-L7-448-source-repo-windows-ci-job.md
    - docs/plans/PLAN-REVERSE-448-source-repo-windows-ci-job-backfill.md
    - .github/workflows/harness-check.yml
review_evidence: []
---

# PLAN-RECOVERY-15 (recovery): Linux / Windows CI の最終 aggregate gate 収束

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/97

## 事故記録

PLAN-L7-448 により source repository の `harness-check` workflow は Linux job と
Windows job を個別に実行できるようになった。しかし両結果を `needs` で受け取り、
`if: always()` で必ず最終判定する aggregate job が存在しない。これは処理失敗や
履歴破壊ではないが、branch protection が片側だけを Required Status Check に登録でき、
「両 OS Green」を一つの合流条件として証明できない CI 契約事故である。

requirements §6.9.2 は CI を merge 単位の収束点、§6.9.4 は doc-only PR を pending
させないこと、§6.9.3 は複数 job の場合に最終 `harness-check` aggregator だけを Required
Status Check とすることを要求する。FR-L1-17 の単一 required check、PLAN-L6-82 の全 PR
trigger、PLAN-L7-221 の policy gate、PLAN-L7-448 の Windows job を同じ出口へ束ね直す。

## 議論順序

1. 現在の workflow job ID、job-level `if`、`needs`、branch protection の required context
   を観測し、既存 Linux/Windows job を証拠生成 job として固定する。
2. aggregate の入力状態と成功条件を設計する。両 job の `result == 'success'` の場合だけ
   Green とし、`failure` / `cancelled` / 予期しない `skipped` / 未知状態は fail-close する。
3. TDD で policy detector の Red を先に追加し、aggregate job 欠落、依存片側欠落、
   `always()` 欠落、判定式の片側欠落、required context の分裂を検出する。
4. workflow と detector を実装し、fixture test、plan lint、実 GitHub Actions の順で検証する。
5. Reverse pair で実装事実を設計へ引き戻し、R4 で Forward の CI/PR 合流契約へ閉じる。

## 認識訂正履歴

- 訂正前: Linux と Windows の各 job が Green なら CI 被覆は完成する。
- 訂正後: 個別 Green は証拠であり、合流許可の正本ではない。複数 job 構成では、両 job を
  束ねて必ず終了状態を返す単一 aggregate context がなければ FR-L1-17 を満たさない。
- 訂正前: branch protection に個別 job を二つ required 登録すれば同等である。
- 訂正後: job 追加・名称変更時の設定漏れ、自動 merge と Execution Ledger の参照分裂を
  防ぐため、外部公開する required context は aggregate 一つに固定する。

## 中間結論

本件は既存 PLAN-L7-448 を取り消す Reverse ではない。Windows job を生かしつつ、欠落した
合流出口を追加する Recovery である。実装後は PLAN-REVERSE-448 を既存 pair として照合し、
aggregate 契約に不足する back-fill は同 Reverse 系列の後続 R0-R4 で設計へ戻す。確定済み
PLAN-L7-221 の claim は本文を黙って上書きせず、Recovery/Reverse の訂正履歴から参照する。

## context 再構築

| 正本 / 資産 | 本 Recovery で固定する関係 |
|---|---|
| requirements §6.9.2 | CI は integration-worthy な merge 単位を収束させる |
| requirements §6.9.3/6.9.4 | 複数 job は `needs` + `if: always()` の単一 aggregator、doc-only pending なし |
| FR-L1-17 | branch protection が参照する Required Status Check は一つ |
| PLAN-L6-82 | 全 PR / main push で aggregate context 自体が欠落しない |
| PLAN-L7-221 | workflow 構造を検査対象本文の自己申告に依存せず fail-close する |
| PLAN-L7-448 | Linux/Windows は個別証拠生成 job、aggregate は合流判断 job |
| PLAN-REVERSE-448 | 実装から CI 責務境界・残余リスク・検証契約を設計へ戻す pair |

## 再開ポイント

1. `.github/workflows/harness-check.yml` の job ID と branch protection の現 required context を
   実測し、fixture との差を記録する。
2. aggregate contract の L6 add-design と L7 add-impl、対応する Reverse R0 を起票する。
3. detector の負例 Red を先行し、workflow 実装後に Green、実 PR で Linux/Windows/aggregate
   の三段証跡を採取する。

## 再発防止

- `github-ci-policy` は「OS job がある」だけでなく、複数の証拠 job が単一 aggregate に
  完全依存され、aggregate が `always()` で全終了状態を fail-close することを検査する。
- branch protection / auto-merge / Execution Ledger は個別 OS job 名を直接参照せず、安定した
  aggregate context だけを参照する。
- 将来 macOS、security、distribution job を追加するときも、required context を増殖させず
  aggregate の依存集合と detector fixture を同じ変更で更新する。

## AC

- [ ] Linux `harness-check-linux` と `harness-check-windows` を `needs` に持つ最終 `harness-check` job が
      `if: always()` で必ず実行され、両方 `success` の場合だけ Green になる。
- [ ] Linux/Windows の `failure` / `cancelled` / 予期しない `skipped` / 未知状態の各負例で
      aggregate が fail-close する TDD oracle が Green になる。
- [ ] `github-ci-policy` が aggregate 欠落、依存片側欠落、`always()` 欠落、片側しか見ない
      判定を structured violation として検出する。
- [ ] pull request と `push: main` の双方で aggregate context が生成され、doc-only PR でも
      pending のまま残らないことを実 GitHub Actions URL で証明する。
- [ ] branch protection、auto-merge、Execution Ledger が参照する Required Status Check を
      aggregate 一つへ固定し、個別 OS job は診断証拠として保持する。
- [ ] requirements §6.9.2/6.9.4、FR-L1-17、PLAN-L6-82、PLAN-L7-221、PLAN-L7-448 と
      Reverse pair の trace/back-fill がレビュー証跡付きで閉じる。
- [ ] plan lint、対象 unit test、TypeScript typecheck、実 CI が Green になり、confirmed 前に
      cross-runtime review evidence を記録する。
