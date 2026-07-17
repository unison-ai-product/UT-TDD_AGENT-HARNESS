---
plan_id: PLAN-L7-451-github-ops-phase1-visibility-and-policy
title: "PLAN-L7-451 (add-impl): GitHub 運用 Phase-1 — Job Summary / typed PR trace contract / Issue Forms / repository policy 監査 (提案書監査 2026-07-17 A群。aggregate check は PLAN-RECOVERY-15 で実装済み)"
kind: add-impl
layer: L7
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-17
updated: 2026-07-17
owner: PO / Claude (起票・実装)
parent_design: docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - workflow aggregate 化 + github CLI 面 (summary / pr / policy) 実装"
  - role: qa
    slot_label: "QA - ci-policy DAG 検査 / trace block / policy diff の unit oracle Red 先行"
review_evidence:
  - reviewer: codex-subagent-post-test-ci-recovery-review
    review_kind: cross_agent
    worker_model: claude-fable-5
    reviewer_model: gpt-5
    tests_green_at: "2026-07-17T19:35:00+09:00"
    reviewed_at: "2026-07-17T20:21:00+09:00"
    verdict: pass
    scope: >-
      Claude blind-reviewerのpre-test攻撃で得たFLAG 2件と修正結果を入力に含め、
      PR #104 の失敗4系統と修正差分をCodexがpost-testでcross-runtime再攻撃した。
      実repo参照2件のisolation契約、DB close後のretry cleanup、Reverse未完了を
      claimしないDoD境界をPASSとし、pre-test承認entryは正本から除外した。
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-17T19:20:00+09:00"
        evidence_path: .ut-tdd/audit/A-L7-451-typecheck.log
        output_digest: "sha256:8366207267355d3e"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-17T19:20:00+09:00"
        evidence_path: .ut-tdd/audit/A-L7-451-lint.log
        output_digest: "sha256:86580aae589db1e6"
generates:
  - artifact_path: docs/plans/PLAN-L7-451-github-ops-phase1-visibility-and-policy.md
    artifact_type: markdown_doc
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: config
  - artifact_path: .github/PULL_REQUEST_TEMPLATE.md
    artifact_type: markdown_doc
  - artifact_path: .github/ISSUE_TEMPLATE/recovery.yml
    artifact_type: config
  - artifact_path: .github/ISSUE_TEMPLATE/reverse.yml
    artifact_type: config
  - artifact_path: .github/ISSUE_TEMPLATE/redesign.yml
    artifact_type: config
  - artifact_path: .github/ISSUE_TEMPLATE/incident.yml
    artifact_type: config
  - artifact_path: .github/ISSUE_TEMPLATE/nfr-failure.yml
    artifact_type: config
  - artifact_path: .github/ISSUE_TEMPLATE/config.yml
    artifact_type: config
  - artifact_path: docs/governance/github-repository-policy.yaml
    artifact_type: config
  - artifact_path: src/github/job-summary.ts
    artifact_type: source_module
  - artifact_path: src/github/pr-trace.ts
    artifact_type: source_module
  - artifact_path: src/github/repository-policy.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/github-job-summary.test.ts
    artifact_type: test_code
  - artifact_path: tests/github-pr-trace.test.ts
    artifact_type: test_code
  - artifact_path: tests/github-repository-policy.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
  requires: []
  references:
    - docs/plans/PLAN-REVERSE-451-github-ops-phase1-backfill.md
    - docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
    - docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
    - docs/plans/PLAN-L7-437-github-issue-projection-inbound.md
    - docs/plans/PLAN-RECOVERY-15-cross-os-ci-aggregate-gate.md
    - src/lint/github-ci-policy.ts
    - src/github/ops-guard.ts
    - src/setup/branch-protection.ts
---

# PLAN-L7-451 (add-impl): GitHub 運用 Phase-1 — 可視化と外周統制の即着手分

## Status

draft (2026-07-17 起票)。Reverse pairing は PLAN-REVERSE-451。

## 背景

2026-07-17 の GitHub 運用最適化提案書 (gpt-5.6-Pro 作成) を監査した。既存設計
(PLAN-L4-30 → L5-23 → L6-83/84/85 → L7-436〜439、全て draft・実装ゼロ) と照合し、
提案のうち **既存設計と独立に即着手可能な A 群 5 項目** を本 PLAN で実装する。
提案の Phase 2〜4 相当 (固定ステータスコメント / Projects / schedule overlay /
surface bindings) は L7-436〜439 の正規実装が土台であり、本 PLAN のスコープ外。

監査で確認した現状の実欠陥:

- `$GITHUB_STEP_SUMMARY` 未使用 (検証結果の人間向け surface が raw log のみ)。
- PR テンプレート / ISSUE_TEMPLATE が存在しない。
- repository policy の authoring source が無く、rulesets / branch protection の
  現物と意図の diff を検査する手段が無い (実測: protection 404、rulesets 空)。

**A 群のうち aggregate required check (旧 W1) と github-ci-policy の DAG 検査化
(旧 W2) は、Codex 側が PLAN-RECOVERY-15 (issue #97) で先行実装し main 合流済み**
(commits c75fe08e / 4d363b3b / 1417fecb / 9c83a84c)。本 PLAN では重複実装せず、
残りの W3-W6 のみを所有する。

## 設計判断 (PO 採択 2026-07-17)

- **Rulesets 段階適用 (選択肢 1 採択)**: required status check = 集約
  `harness-check` 1 本 + force-push 禁止 + branch 削除禁止 + bypass actor = PO のみ。
  approval 系 (required approvals / stale approval dismissal / conversation
  resolution) は solo 自己ブロックになるため適用しない。適用操作自体は本 PLAN の
  merge 後に PO の gh 認証で実施する別手順であり、本 PLAN は authoring source
  (policy.yaml) と監査 CLI (inspect/diff) までを納品する。
- **GitHub App 不採用**: Check Run / PR 固定ステータスコメント等の App 前提機能は
  作らない (利なし、鍵管理コスト見合わず)。可視化は read-only の Job Summary で賄う。
- **merge queue / Actions への write 権限拡大は不採用継続**。
- **CI 相当の検証はハーネス自前を正とする**: GitHub Actions への依存・課金を
  増やさない。Actions は既存 harness-check の枠内に留め、判定正本はハーネス側
  (PLAN-L7-438 の provider-independent internal CI runner port 方向)。
- 上記は HARNESS メモリ
  `feedback-github-ops-actions-ci-app-merge-queue-po-2026-07-17` に記録済み。

## スコープ

1. **W1 / W2 (実装しない)**: aggregate required check と ci-policy の DAG 検査は
   PLAN-RECOVERY-15 (issue #97、Codex 実装) で main 合流済み。本 PLAN は観測のみ
   (Step 0 で新検査の green を確認) とし、変更を加えない。
2. **W3 Actions Job Summary**: `ut-tdd github summary` を新設し、gate matrix /
   failed tests / doctor 所見 / next action を markdown で stdout へ出力する。
   workflow の aggregate job から `>> "$GITHUB_STEP_SUMMARY"` で追記する
   (write 権限拡大なし)。GitHub 表示は projection であり判定正本にしない。
3. **W4 typed PR trace contract**: `.github/PULL_REQUEST_TEMPLATE.md` を新設し、
   人間可読要約 + 機械可読 hidden block (`<!-- ut-tdd:trace/v1 ... -->`,
   plan_id / route_mode / subject_head 等) を持たせる。
   `ut-tdd github pr render --plan <id>` (block 生成) と
   `ut-tdd github pr validate --body-file <path>` (block 検証、欠落 fail-close)
   を実装する。項目語彙は PLAN-L6-85 の PR body 規定を正とし、拡張しない。
4. **W5 Issue Forms**: `.github/ISSUE_TEMPLATE/` に recovery / reverse /
   redesign / incident / nfr-failure の Issue Form (+ config.yml で blank 禁止)
   を設置する。項目は PLAN-L6-83 の Issue 本文規定 (origin PLAN / revision /
   observed state / reason / observed HEAD / evidence / drive model /
   reentry target) 準拠。通常 Forward の Issue 化はしない (L4-30 原則維持)。
5. **W6 repository policy 監査**: `docs/governance/github-repository-policy.yaml`
   を authoring source として新設し (段階適用の採択内容を記述)、
   `ut-tdd github policy inspect` (gh api で現物取得・表示) /
   `ut-tdd github policy diff` (authoring source と現物の乖離を finding 列挙、
   乖離あり exit 1) を実装する。read-only であり適用操作は含めない。

## 非スコープ

- GitHub App / Check Run / PR 固定ステータスコメント (PO 不採用)。
- GitHub Projects / schedule_entries overlay / surface bindings (L7-436〜439 後段)。
- merge queue / merge_group (前提未成立、不採用継続)。
- Rulesets の実適用操作 (merge 後の PO 手順)。
- hot-file conflict forecast (優先度低、別 PLAN 候補)。

## Steps (TDD Red 先行)

| Step | 内容 | mode |
|---|---|---|
| 0 | RECOVERY-15 実装 (aggregate + DAG 検査) の green を観測 (変更なし) | 直列 |
| 1 | W3/W4 unit oracle Red → job-summary / pr-trace 実装 Green + CLI 配線 | 直列 |
| 2 | W6 unit oracle Red (diff の乖離検出/一致) → policy.yaml + repository-policy 実装 Green | 直列 |
| 3 | W5 Issue Forms 設置 + form 構造検査 | 直列 |
| 4 | 全体検証 (typecheck / test / lint) → review → confirm → PR | 直列 |

## DoD

- [x] W1/W2: PLAN-RECOVERY-15 実装が本ブランチ上で green であることを観測した
      (`tests/github-ci-policy.test.ts` 29 tests pass、2026-07-17)。本 PLAN は
      aggregate 構造へ変更を加えていない (summary step の追加のみ、leg 側)。
- [x] W3: `ut-tdd github summary` が gate matrix を含む markdown を出力し、
      入力欠落時も exit 0 で degrade する (CI を summary 生成失敗で red にしない)。
      根拠: `tests/github-job-summary.test.ts` の `U-L7-451-W3-001`〜`003` (green 実測
      2026-07-17) と CLI 実走 (live repo で gate matrix 出力を確認)。
- [x] W4: `pr render` が有効な trace block を生成し、`pr validate` が欠落 /
      壊れた block を fail-close する。根拠: `tests/github-pr-trace.test.ts` の
      `U-L7-451-W4-001`〜`005` (green 実測 2026-07-17) と CLI 実走 (render→validate
      往復 exit 0 / block 欠落 exit 1)。
- [x] W5: ISSUE_TEMPLATE 5 form + config.yml が存在し、必須項目が PLAN-L6-83 の
      規定項目を欠かさない。根拠: `tests/github-repository-policy.test.ts` 内の
      form 構造検査 `U-L7-451-W5-001` (blind review FLAG を受け全 5 form の
      required-id ループ検査へ強化、green 実測 2026-07-17)。
- [x] W6: `policy diff` が authoring source と現物の乖離を finding として列挙し
      乖離あり exit 1 / 一致 exit 0。gh 不通時は exit 3 (外部障害) で判定を
      偽装しない。根拠: `tests/github-repository-policy.test.ts` の
      `U-L7-451-W6-001`〜`005` (green 実測 2026-07-17) と CLI 実走 (現物未適用に対し
      DRIFT 3 findings / exit 1 を実測)。
- [x] PLAN-REVERSE-451 R0-R4 の完了は本 slice では claim しない。R2 で実装観測と
      L6-83/L6-85 契約の差分を gap-only で照合する。
