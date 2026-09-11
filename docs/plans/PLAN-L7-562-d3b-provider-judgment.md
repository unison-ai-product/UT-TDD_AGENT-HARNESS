---
plan_id: PLAN-L7-562-d3b-provider-judgment
title: "PLAN-L7-562 (pair-freeze): D3b verified provider judgment producer"
kind: pair-freeze
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-11
updated: 2026-09-11
owner: Claude / Fable (contract review) · Codex worker (bounded implementation)
parent_design: docs/plans/PLAN-L7-465-cross-review-author-binding.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
backprop_decision: required
backprop_decision_reason: >-
  D3b の検証済み judgment を D3c/D3d の入力へ戻し、D3a exact attempt と
  provider evidence の結合条件を上位契約へ逆向きに固定する。手書き digest や
  operator supplied ref を許さないため、契約・テスト対を先に確定する。
agent_slots:
  - role: tl
    slot_label: "Sol / Claude Opus - D3a envelope、canonical preimage、D3c custody境界の非著者検収"
  - role: se
    slot_label: "Luna worker - provider judgment domain/port/adapterをこの契約の範囲だけ実装"
  - role: qa
    slot_label: "Terra - U-D3B-001..010のmutationとwrite-zero oracleを独立実測"
generates:
  - artifact_path: docs/plans/PLAN-L7-562-d3b-provider-judgment.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/plans/PLAN-REVERSE-562-d3b-provider-judgment-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-465-cross-review-author-binding.md
  requires:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/test-design/harness/L7-unit-test-design.md
  blocks:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/541
  references:
    - docs/plans/PLAN-REVERSE-562-d3b-provider-judgment-backfill.md
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/plans/PLAN-L7-518-review-request-retraction.md
    - src/feedback/review-custody.ts
    - src/feedback/review-custody-runner.ts
    - src/feedback/ports/provider-family-authority.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/562
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/541
review_evidence: []
workflow_phase: L7
status: draft
github_issue_id: 562
---

# PLAN-L7-562: D3b verified provider judgment producer

## 1. 目的と境界

Issue #541 が必要とする D3b `judgment_digest` と `provider_evidence_ref` を、
レビュー本文・PR comment・HARNESS Memory・D3a receipt digest・operator の手入力から
導出しないための契約を freeze する。D3a が検証した exact request/attempt に対して、
provider adapter が返した構造化 judgment evidence を一度だけ canonicalize し、
content-addressed な immutable artifact と ref を生成する。

この PLAN は契約と oracle のみを所有する。provider family の強い認証、GitHub
Artifact Attestation、D3c/D3d workflow、D2 required check、#555 の consumer runtime、
PLAN-L6-93 の seal、#540/#487 の実装は変更しない。

## 2. canonical judgment payload

producer の入力は、既に schema 検証済みの D3a attempt envelope と、同じ invocation
から provider adapter が返した evidence bytes の組だけとする。caller は digest/ref、
provider、model、nonce、verdict、findings を個別に上書きできない。

canonical payload は次の field 集合に限定する。

```text
schema_version      = "d3b.v1"
kind                = "provider_judgment"
repository          = canonical owner/name
pr_number           = positive integer
head_sha            = lower 40-hex exact reviewed head
request_memory_id   = D3a request identity
request_digest      = D3a canonical request digest
review_revision     = D3a review revision
attempt             = positive integer
provider            = validated provider invocation fact
model               = validated model invocation fact
invocation_nonce    = validated custody-envelope nonce
verdict             = PASS | PASS-WEAK | FLAG
blocking_findings   = ordered typed finding list (empty only for PASS/PASS-WEAK)
evidence_digest     = sha256 of provider evidence bytes
```

The digest preimage is RFC 8785/JCS over exactly the fields above except the derived
`judgment_digest`. `provider`/`model` are observations, not family authority; absent an
approved external authority D3c must still terminate at `unverified_family`.

The producer writes exactly one immutable JSON artifact at
`.ut-tdd/review/judgments/<judgment_digest>.json` and returns
`provider_evidence_ref=judgment:<judgment_digest>`. Replaying the same complete input is an
idempotent read; a different byte at any identity, verdict, finding, evidence, schema, or
attempt axis is a conflict and emits no second artifact.

## 3. fail-close and write-zero rules

- missing, malformed, superseded, or provider-failed evidence produces typed unavailable;
- exact PR/head/request/revision/attempt mismatch produces `identity_mismatch`;
- unknown fields, duplicate findings, unordered findings, or PASS with blocking findings
  produces `judgment_schema_invalid`;
- caller-supplied digest/ref or hand-authored JSON is never accepted as producer input;
- artifact write, fsync, or existing-bytes mismatch produces `judgment_write_failed` and
  leaves artifact count and downstream workflow dispatch at zero;
- a valid D3b artifact alone does not prove reviewer family and cannot produce
  `custody_admitted` without the independent D3c/D3d inputs.

No #541 seal, database mutation, workflow dispatch, or #540/#487 cutover may occur until the
producer returns a schema-valid artifact bound to the exact reviewed subject.

## 4. implementation slices and evidence

The bounded implementation may add only a provider-judgment domain, its narrow evidence port/
adapter, the canonical artifact resolver, and the tests named below. Runner/workflow wiring is
a later slice and must consume the resolver output rather than accepting environment strings.

Red → Green requires Linux/Windows/aggregate CI, exact-head non-author review, and the reverse
backfill document before #541 may retry actual seal. The old D3a receipt for PR #557 is not
reused; a fresh exact-subject provider attempt is required after this producer exists.

