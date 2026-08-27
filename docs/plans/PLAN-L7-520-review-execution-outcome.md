---
plan_id: PLAN-L7-520-review-execution-outcome
title: "PLAN-L7-520 (add-impl): reviewer verdict と non-zero execution outcome の分離"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-27
updated: 2026-08-27
owner: PM / PO / Codex
github_issue_id: 386
parent_design: docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
pair_artifact: docs/test-design/harness/L7-review-execution-outcome-test-design.md
transition_direction: implementation_to_reverse
implementation_disposition: none
implementation_target: src/feedback/review-attestation.ts
agent_slots:
  - role: se
    slot_label: "SE - verdict projection と typed execution outcome の最小実装"
  - role: qa
    slot_label: "QA - non-zero、欠落、identity mismatch、merge fail-close の独立検証"
  - role: tl
    slot_label: "TL - D3a custody と D2 merge gate の境界検収"
generates:
  - artifact_path: docs/plans/PLAN-L7-520-review-execution-outcome.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-review-execution-outcome-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
  requires:
    - PLAN-L7-493-d3a-repo-local-verdict-custody
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-493-d3a-repo-local-verdict-custody-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/386
review_evidence: []
backprop_decision: required
backprop_decision_reason: "non-zero execution を verdict の有無から分離し、L7 receipt と L6 custody gate の fail-close 根拠へ戻す。"
---

# PLAN-L7-520: reviewer verdict と non-zero execution outcome の分離

## 1. 目的

Claude reviewer が read-only 検証権限の拒否などで non-zero 終了しても、consumer-derived
verdict path に書かれた identity-bound verdict を捨てず、実行失敗を typed outcome として
同じ canonical receipt に保存する。verdict 本文を合成せず、receipt の custody path、request
digest、attempt、provider、nonce の検証は従来どおり必須とする。

non-zero receipt は監査・再実行の入力として保持するが、review-dispatch / merge gate では
`reviewer_execution_failed` として merge-ready から除外する。これにより #438 のような
「有効な PASS-WEAK file があるのに generic execution failure へ潰れて証跡 0」も、
「non-zero なのに PASS として merge」も発生させない。

## 2. 境界

- 対象は verdict projection、live delegation の終了結果、dispatch の receipt validation のみ。
- verdict file が無い場合は `verdict_file_missing` または `verdict_absent_after_provider_failure` を維持する。
- identity 不一致、外部 path、symlink、provider 同族、invalid envelope は従来どおり fail-close。
- reviewer の Edit capability、並行 Memory の帰責、Bun retirement、#438 contract、remote publication は対象外。
- 手書き receipt、stdout の verdict による代替、merge wrapper bypass は許可しない。

## 3. 実装契約

1. non-zero provider exit を `executionOutcome={status: failed, exitCode, reason: reviewer_exit_nonzero}` として保存する。
2. verdict が存在し、request / attestation / path / envelope / provider identity の検証を通った場合だけ outcome 付き receipt を発行する。
3. live wrapper は non-zero child の JSON projection を検証し、typed outcome と child exit code が一致する場合のみ返す。それ以外は `reviewer_execution_failed` とする。
4. dispatch は outcome 付き receipt を構造検証するが、`reviewer_execution_failed` reason を付けて merge-ready を拒否する。
5. live consume は receipt を保持・公開した後も non-zero outcome を成功扱いせず、typed failure として返す。

## 4. 完了条件

- detached snapshot の対象テスト、TypeScript、Biome が Green。
- valid identity-bound verdict + non-zero exit が outcome 付き receipt へ保存される。
- verdict 欠落、invalid identity、外部 path は receipt 0 のまま。
- outcome 付き receipt は `merge_ready` へ到達しない。
- provider mutation boundary は既存 exact Edit allow と fail-close を維持する。
- exact HEAD の非著者 Claude review が実施され、closing receipt が Memory に記録される。
