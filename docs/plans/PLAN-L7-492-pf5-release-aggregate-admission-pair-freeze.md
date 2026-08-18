---
plan_id: PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze
title: "PLAN-L7-492 (impl): PF-5 release aggregate admission pair-freeze"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-18
updated: 2026-08-18
owner: PM / Codex
parent_design: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: aim
    slot_label: "AIM - PF-5 final-tree admission と外部publish境界を固定する"
  - role: tl
    slot_label: "TL - 三predicate AND、sealed plan、fault時rollbackの独立レビュー"
  - role: se
    slot_label: "SE - PF-1〜PF-4 portを再利用するaggregate application seamを設計する"
  - role: qa
    slot_label: "QA - CANDIDATE-RELMAN-014〜017のmutation/fault oracleを固定する"
generates:
  - artifact_path: docs/plans/PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/release-aggregate-admission.ts
    artifact_type: source_module
  - artifact_path: tests/release-aggregate-admission.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
  requires:
    - PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze
  blocks: []
  references:
    - docs/plans/PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze.md
    - docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/251
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/250
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/330
github_issue_id: 251
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-18T05:24:18Z"
    tests_green_at: "2026-08-18T05:24:18Z"
    verdict: pass
    scope: "PR #333 PF-5 pair-freezeのclaim-blind/spec-blind再レビュー。predicate Cの静的化、PF-4 requires、docs-only境界を確認。"
    worker_model: codex
    reviewer_model: claude-opus-5
    plan_revision: 15e76078ec216655e4c1896717771966a864d227
    subject_head: 15e76078ec216655e4c1896717771966a864d227
    evidence_path: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/333"
    anchor_commit: 15e76078ec216655e4c1896717771966a864d227
    citations:
      - "PR #333 exact HEAD 15e76078 non-author closing review (PASS, 2026-08-18T05:24:18Z)"
      - "GitHub Actions run 32099499128 (Linux/Windows/aggregate success)"
    green_commands:
      - kind: lint
        command: "GitHub Actions run 32099499128: harness-check Linux/Windows/aggregate"
        runner: ci
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-18T05:24:18Z"
        evidence_path: docs/plans/PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze.md
        output_digest: "sha256:52ba651e439bd066d94c50256be8df2c4ff7f5cb0e8380127c1d54dc36072d4e"
        anchor_commit: 15e76078ec216655e4c1896717771966a864d227
---

# PLAN-L7-492: PF-5 release aggregate admission pair-freeze

## 0. 位置づけ

Issue #251 は、PF-1〜PF-4で分離して検証したrelease manifest、materializer、isolated Git
resolver、channel adapterを、Packへ公開する単一のaggregate admissionへ合流させるsliceである。
PF-4実装PR #330がmainへ到達したため、PF-5の設計freezeを開始できる。master PLAN-L7-473と
Reverse-473のAC-6を上書きせず、final-treeからのpreflightと原子applyの責務だけを固定する。

本PRはdocs-only pair-freezeであり、実装source、外部CLI結線、Pack copy、test-design台帳の
candidate昇格を含めない。candidate `CANDIDATE-RELMAN-014`〜`017`は実装PRでのみ対応する。

## 1. 凍結する契約

- exact HEADのfinal treeから、(A) canonical `release/manifest.yaml`の一意性・schema妥当性、
  (B) clean Pack distribution allowlistがcontrol manifestを含むこと、(C) channel-selected
  artifact revisionがmanifestのsource revision/object identityからPack destinationへ写像でき、
  そのdestinationがallowlistで許可されることを、side effect前に静的にAND判定する。ここでの
  (C)はresolver/materializerを実行する到達実績ではなく、final tree上のchannel→revision→destination
  対応関係の存在を指す。1 predicateでも欠ければsealed planを生成せず、resolver/materializer/
  copy/write countは0とする。実装時のread-only resolver/materializerがselected revision/object
  unavailableを返した場合も、typed findingを保持してsealed plan/applyを0件でfail-closeする。
- preflight成功値は、適用対象・expected digest・source revisionを束縛したimmutable sealed
  planだけとする。Git commit/merge方式、current worktree、ネットワーク取得を判定入力にしない。
- sealed planのapplyはisolated stagingへ行い、staging write/copyおよびdestination commit/apply
  の各境界へ1..N faultを注入する。全faultでstagingを破棄し、destination/control manifest/
  allowlist/copy inputのprior bytes・mode・pathを不変に保ち、partial publishを0にする。
  faultなしの成功時だけdestination applyをexactly 1回許可する。
- manifest schema invalid、unknown channel、selected revision/object unavailableはtyped finding
  を保持したままfail-closeする。`unavailable`を`mismatch`や成功へ丸めない。
- application coreは既存PF-1〜PF-4のpure domain/resolver/materializer/adapter portを注入し、
  CLI、GitHub、外部network、Pack repoの実copyをpair-freeze/aggregate coreへ直接持ち込まない。

## 2. 対応oracle

実装PRで次の候補を1:1で昇格する。pair-freezeではREDのまま保持する。

1. `CANDIDATE-RELMAN-014`: final-tree三predicateの各欠落でsealed planと全副作用が0件。
2. `CANDIDATE-RELMAN-015`: schema invalid manifestをtyped invalidとして拒否し、副作用0件。
3. `CANDIDATE-RELMAN-016`: unknown channelを`unknown_channel`として保持し、副作用0件。
4. `CANDIDATE-RELMAN-017`: staging/apply各境界の1..N faultでprior state不変・partial publish 0、
   成功時のみapply exactly 1回。

## 3. 工程と出口

1. 本docs-only pair-freezeはPR #333でcross-family review、exact HEAD、CI 3 job greenを確認してmainへmerge済み。
2. 本実装PRでPF-4 confirmed PLAN-L7-489を`requires`へ束縛し、aggregate application core、
   isolated staging/apply port、U-RELMAN-014〜017を実装する。candidate以外の後段oracleを先行昇格しない。
3. implementation PRのclosing reviewで三predicate、typed failure、副作用count、fault rollback、
   success exactly-onceを実測する。PASS後にのみPLAN-REVERSE-473 R3/R4へ進む。

## 4. スコープ境界

Pack repoへのtag/release、promotion/rollback、S3、multi-consumer generalization、Git commit/push
自動化は本PLANへ混ぜない。Issue #251は実装・全fault検証・cross-review・mergeが完了するまでcloseしない。
