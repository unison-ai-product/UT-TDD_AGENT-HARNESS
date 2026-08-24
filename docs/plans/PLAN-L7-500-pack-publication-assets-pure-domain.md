---
plan_id: PLAN-L7-500-pack-publication-assets-pure-domain
title: "Pack publication deterministic tar/checksum/asset inventory pure domain"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-08-24
updated: 2026-08-24
owner: Codex / Luna
github_issue_id: 383
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: "tar/gzip/checksumのbyte-level実測をPLAN-REVERSE-500でL6公開契約へ戻す"
agent_slots:
  - role: se
    slot_label: "Luna worker - deterministic asset pure domain"
  - role: qa
    slot_label: "TDD - literal golden and one-axis mutation oracles"
  - role: tl
    slot_label: "Codex - exact revision verification and integration"
  - role: qa
    slot_label: "Claude Opus 5 - non-author closing review"
generates:
  - artifact_path: docs/plans/PLAN-L7-500-pack-publication-assets-pure-domain.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-500-pack-publication-assets-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/pack-publication-assets.ts
    artifact_type: source_module
  - artifact_path: tests/pack-publication-assets.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
  blocks: []
  references:
    - src/schema/release-manifest.ts
review_evidence: []
---

# PLAN-L7-500

## Bounded implementation

入力はparse済みmanifest v2の単一release recordと、同recordの`artifacts[]`へexactに対応する
sealed content entriesだけとする。current worktree、directory walk、Git、Pack checkout、allowlist、
networkからの補完は禁止する。

生成順序は次で固定する。

```text
manifest artifact inventory + sealed bytes
  -> POSIX ustar regular entries
  -> fixed stored-block gzip
  -> tar.gz checksum file
  -> exact two-asset inventory digest
```

tar header、padding、終端2 block、gzip header、stored block split、CRC32、ISIZE、checksum framing、
asset inventory framingはPLAN-L6-63 §2のbyte contractをそのまま実装する。unsupported path/type、
entry identity・mode・size・content digest不一致、余剰・欠落entryはtyped denyとし、artifact bytesを返さない。

## Oracle

| ID | axis | expected |
| --- | --- | --- |
| U-PACKASSET-001 | single regular entry literal golden | tar.gz/checksum/inventoryのliteral bytes/digest一致 |
| U-PACKASSET-002 | UTF-8 path・ustar split・65535 block境界 | Linux/Windows非依存の同一bytes |
| U-PACKASSET-003 | order/path/mode/size/contentの単独変異 | typed deny、artifact bytes 0 |
| U-PACKASSET-004 | directory/symlink/hardlink/PAX/GNU/表現不能path相当入力 | typed deny、fallback 0 |
| U-PACKASSET-005 | gzip header/trailer/stored block/checksumの単独mutation | literal oracleが各軸を検出 |
| U-PACKASSET-006 | manifest外entry・欠落entry | typed deny、暗黙補完0 |

## Exit

- Red→Greenを同一PLAN revisionで記録する。
- typecheck、Biome、targeted snapshot、plan lint、Linux/Windows/aggregate CIをGreenにする。
- PLAN-REVERSE-500をR1→R4へ進める。
- Claude Opus 5のexact-head non-author closing receiptを得る。
