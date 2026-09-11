---
plan_id: PLAN-L7-562-d3b-provider-judgment
title: "PLAN-L7-562 (pair-freeze): D3b verified provider judgment producer"
kind: impl
layer: L7
drive: be
route_signal: forward
route_mode: forward
created: 2026-09-11
updated: 2026-09-11
owner: Claude / Fable (contract review) · Codex worker (bounded implementation)
parent_design: docs/plans/PLAN-L7-465-cross-review-author-binding.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
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
    slot_label: "Terra - CANDIDATE-D3B-001..010のmutationとwrite-zero oracleを実装時にU-*へ昇格"
generates:
  - artifact_path: docs/plans/PLAN-L7-562-d3b-provider-judgment.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/plans/PLAN-REVERSE-562-d3b-provider-judgment-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/feedback/provider-judgment.ts
    artifact_type: source_module
  - artifact_path: src/feedback/ports/provider-judgment-evidence.ts
    artifact_type: source_module
  - artifact_path: src/feedback/adapters/provider-judgment-evidence.ts
    artifact_type: source_module
  - artifact_path: tests/provider-judgment.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-465-cross-review-author-binding.md
  requires:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
  blocks:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/541
  references:
    - docs/plans/PLAN-REVERSE-562-d3b-provider-judgment-backfill.md
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/plans/PLAN-L7-518-review-request-retraction.md
    - src/feedback/review-custody.ts
    - src/feedback/review-custody-runner.ts
    - src/feedback/ports/provider-family-authority.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/562
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/541
review_evidence:
  - reviewer: claude
    review_kind: cross_agent
    reviewed_at: 2026-09-11T04:50:00Z
    tests_green_at: 2026-09-11T04:45:00Z
    verdict: PASS-WEAK / blocking 0
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    effort: middle
    plan_revision: 062fa30372a303167f46423909ca7aa6f9acee8c
    subject_head: 062fa30372a303167f46423909ca7aa6f9acee8c
    scope: "PR #564 exact HEADのD3b pair-freezeを非著者review。provider evidence ref、family境界、candidate oracle、write-zero契約を確認した。実装GreenはIssue #568で別途検証する。"
    citations:
      - .ut-tdd/review/receipts/a2a46e5efe3f6ff63ca4fe89d512a2632f2c3b0f39f44d7370851eea88f7df84.json
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/564
status: confirmed
github_issue_id: 562
---

# PLAN-L7-562: D3b 検証済み provider judgment producer

## 1. 目的と境界

Issue #541 が必要とする D3b `judgment_digest` と `provider_evidence_ref` を、
レビュー本文・PR comment・HARNESS Memory・D3a receipt digest・operator の手入力から
導出しないための契約を freeze する。D3a が検証した exact request/attempt に対して、
provider adapter が返した構造化 judgment evidence を一度だけ canonicalize し、
content-addressed な immutable artifact と ref を生成する。

この PLAN は契約と oracle のみを所有する。provider family の強い認証、GitHub
Artifact Attestation、D3c/D3d workflow、D2 required check、#555 の consumer runtime、
PLAN-L6-93 の seal、#540/#487 の実装は変更しない。

## 2. 正規 judgment payload

producer の入力は、既に schema 検証済みの D3a attempt envelope と、同じ invocation
から provider adapter が返した evidence bytes の組だけとする。caller は digest/ref、
provider、model、nonce、verdict、findings を個別に上書きできない。

正規 payload は次の field 集合に限定する。

```text
schema_version      = "d3b.v1"
kind                = "provider_judgment"
repository          = 正規 owner/name
pr_number           = 正の整数
head_sha            = reviewed head の lower 40-hex
request_memory_id   = D3a request identity
request_digest      = D3a 正規 request digest
review_revision     = D3a review revision
attempt             = 正の整数
provider            = 検証済み provider invocation fact
model               = 検証済み model invocation fact
author_family       = D3a request identity 由来の author family (codex | claude)
reviewer_family     = author_family の反対 family (claude | codex)
invocation_nonce    = 検証済み custody-envelope nonce
verdict             = PASS | PASS-WEAK | FLAG
blocking_findings   = 順序付き typed finding list (PASS/PASS-WEAK は空だけ)
evidence_digest     = provider evidence bytes の sha256
```

digest の preimage は、派生値 `judgment_digest` を除く上記 field だけを RFC 8785/JCS で
正規化した bytes とする。`author_family` は D3a request identity から、
`reviewer_family` はその反対 family から導出する。caller が両 field を指定・上書きしては
ならない。D3a attempt が記録した実 spawn の provider family は `reviewer_family` と一致
しなければならない。`provider` / `model` は観測値であり family authority ではないため、
承認済み external authority が無い D3c は引き続き `unverified_family` で終端する。

producer は `.ut-tdd/review/judgments/<judgment_digest>.json` に immutable JSON artifact を
ちょうど1件書き、D3c consumer の strict decoder と同じ
`provider_evidence_ref=d3b:<judgment_digest>` を返す。同じ完全入力の replay は冪等な read
へ収束する。identity、author/reviewer family、verdict、finding、evidence、schema、attempt の
いずれか1 byteでも異なれば conflict とし、第2 artifact を生成しない。

## 3. fail-close と write-zero 規則

- evidence の missing、malformed、superseded、provider failure は typed unavailable とする;
- exact PR/head/request/revision/attempt の不一致は `identity_mismatch` とする;
- D3a request の `author_family` 欠落・未知値、または導出した `reviewer_family` と実 spawn
  provider family の不一致は、same-family のとき `same_family_reviewer`、それ以外は
  `identity_mismatch` として artifact/workflow/seal write 0 で拒否する;
- unknown field、duplicate finding、unordered finding、または blocking finding を持つ PASS は
  `judgment_schema_invalid` とする;
- caller-supplied digest/ref または手書き JSON を producer input として受理しない;
- artifact write、fsync、既存 bytes mismatch は `judgment_write_failed` とし、artifact count と
  downstream workflow dispatch をゼロのままにする;
- 有効な D3b artifact 単独では reviewer family を証明できず、独立した D3c/D3d input 無しに
  `custody_admitted` を生成してはならない。

#541 seal、database mutation、workflow dispatch、#540/#487 cutover は、producer が exact
reviewed subject に束縛された schema-valid artifact を返すまで実行してはならない。

## 4. 実装 slice と証跡

bounded implementation が追加できるのは provider-judgment domain、その狭い evidence port/
adapter、canonical artifact resolver、および下記の test だけとする。runner/workflow wiring は
後続 slice とし、environment string を受理せず resolver の出力だけを消費する。

Red → Green には Linux/Windows/aggregate CI、exact-head non-author review、reverse backfill
document を要求する。これらが揃うまで #541 は actual seal を再試行してはならない。PR #557
の旧 D3a receipt は再利用せず、この producer が存在した後の fresh exact-subject provider
attempt を要求する。

この pair-freeze では未実装の oracle を正規IDとして確定しない。L7 test-design の
候補IDは実装PRが Red test と同一 revision で追加された時点で正規oracleへ昇格し、
実装・review・CIの証跡を同じ subject に束縛する。
