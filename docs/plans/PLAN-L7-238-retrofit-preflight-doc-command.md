---
plan_id: PLAN-L7-238-retrofit-preflight-doc-command
title: "PLAN-L7-238 (add-impl): retrofit.md 誤コマンド修正 + doc 記載コマンド実在ガード"
kind: add-impl
layer: L7
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/process/modes/retrofit.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - retrofit.md 訂正 + cited-command 実在 lint"
generates:
  - artifact_path: docs/plans/PLAN-L7-238-retrofit-preflight-doc-command.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/retrofit.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/scrum.md
    artifact_type: markdown_doc
  - artifact_path: tests/cited-command-existence.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
  requires: []
  references:
    - .ut-tdd/audit/A-173-drive-model-coverage-audit-2026-07-02.md
    - docs/process/modes/retrofit.md
    - src/cli.ts
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
review_evidence:
  - reviewer: codex-cli
    review_kind: cross_agent
    reviewed_at: "2026-07-02T22:50:30+09:00"
    tests_green_at: "2026-07-02T22:50:05+09:00"
    verdict: approve
    scope: "retrofit.md の不在コマンド (ut-tdd doctor --preflight upgrade) を §7.8.3 相当読みの実在前段検証 (ut-tdd doctor full pass) へ訂正。再発防止は docs/process 限定の cited-command 実在ガード (CI テスト、top-level command 突合、実装予定 marker 規約)。codex (gpt-5.5) が初回 request-changes (nested subcommand 混入 / PLAN 背景の guard preflight 誤記 / スコープ記述不一致) → 3 件是正 → 追認 approve。"
    worker_model: claude-fable-5
    reviewer_model: gpt-5.5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/cited-command-existence.test.ts tests/plan-lint.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T22:50:05+09:00"
        evidence_path: tests/cited-command-existence.test.ts
        output_digest: "sha256:52e720551229a5fb4553c8855ff040d0cce1d88c4848be43c901be3bc3609093"
        anchor_commit: 6e7e79e9854df90e589081343282e2878f6e2e8d
---

# PLAN-L7-238 (impl): retrofit.md 誤コマンド修正 + doc 記載コマンド実在 lint

## Status

2026-07-02 実装完了。route_mode↔kind 台帳 (PLAN-L7-263) の draft debt から add-impl +
PLAN-REVERSE-238 pairing へ昇格 (昇格実例第 4 号)。

## 背景 (A-173 F-2)

`docs/process/modes/retrofit.md:34,84` が必須手順として `ut-tdd doctor --preflight upgrade` を記載するが該当フラグ/サブコマンドは存在しない。§7.8.3 は「`ut-tdd doctor --preflight <type>` **相当**の前段検証 pass」を要求しており、実在コマンドでの正は前段検証としての `ut-tdd doctor` full pass (監査 A-173 が候補に挙げた `ut-tdd guard preflight` は hosted/API 編集 guard であり upgrade preflight ではない — codex レビューで訂正)。upgrade 高リスク時の必須手順が実行不能で、retrofit 実行者を確実にブロックする。

## スコープ

1. retrofit.md の誤コマンド訂正。
2. 再発防止: 運用手順の正本 docs/process 内の `ut-tdd <sub>` 記載を CLI surface (top-level command) と突合する cited-command 実在ガード (doc が存在しないコマンドを正規手順として記載したら fail)。concept/requirements は将来面を規定する仕様書のため対象外 (意図的スコープ)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | doc 訂正 | 直列 |
| 2 | cited-command lint + 全 process doc 走査 green | 直列 |

## 実装 (2026-07-02)

- retrofit.md:34,84 の `ut-tdd doctor --preflight upgrade` (不在コマンド) を実在の前段検証
  `ut-tdd doctor` full pass へ訂正 (専用 `--preflight` フラグ不在を明記)。
- 再発防止ガードは CI-gating テスト `tests/cited-command-existence.test.ts` として実装
  (docs/process の backtick 引用 `ut-tdd <sub>` の第 1 トークンを src/cli.ts の command 登録と
  突合。doctor 配線は setup/doctor リファクタ進行中のため意図的に避け、CI テストで fail-close)。
- 書式規約: プレースホルダ/記号 token は対象外、未実装コマンドの意図的引用は同一行に
  「実装予定」/「未実装」marker 必須 (scrum.md の `ut-tdd reverse fullback` 引用へ marker 追記)。
- 全 docs/process 走査 green (retrofit.md 訂正後、違反 0)。

## DoD

- [x] retrofit.md 記載コマンドが全て実在 (cited-command-existence テスト green)
- [x] 意図的擬似例 (プレースホルダ/実装予定 marker) を除外できる書式規約を持つ (テスト header に規約明文化)
