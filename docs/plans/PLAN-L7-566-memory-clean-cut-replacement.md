---
plan_id: PLAN-L7-566-memory-clean-cut-replacement
title: "PLAN-L7-566 (add-impl): project memory clean-cut replacement implementation"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-16
updated: 2026-09-16
owner: Claude control lane (PR-1) · Codex Luna worker (PR-2 候補) · 非著者 frontier
  reviewer
parent_design: docs/plans/PLAN-L6-104-memory-clean-cut-replacement.md
pair_artifact: docs/test-design/harness/L7-memory-clean-cut-replacement-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: 置換後の non-read 保証 (canonical / archive / linked
  worktree legacy の同時配置 fixture) は既存 Slice 4 migration
  契約に無い新契約であり、PLAN-REVERSE-566 で上位不変条件へ逆向きに束縛する。
agent_slots:
  - role: se
    slot_label: PR-1 は Claude control lane が撤去と oracle 昇格を実装。PR-2 は Luna worker が
      rename manifest、 curation ledger、non-read integration、db rebuild を実装する
  - role: qa
    slot_label: Terra - 撤去の負例 (import 戻し、行据え置き、宣言据え置き、generates 据え置き) と置換の
      adversarial fixture (同一 memory_id 異 digest、frontmatter 破損、symlink) の Red
      を独立に実測する
  - role: tl
    slot_label: 非著者 frontier reviewer (Claude 著は Codex Sol、Codex 著は Claude Opus) -
      exact head で supersede 境界、非 read 保証、archive 配置を検収する
generates:
  - artifact_path: docs/plans/PLAN-L7-566-memory-clean-cut-replacement.md
    artifact_type: markdown_doc
  - artifact_path: tests/memory-clean-cut-removal.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-104-memory-clean-cut-replacement.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-104-memory-clean-cut-replacement.md
    - docs/plans/PLAN-L7-512-project-scoped-memory-root.md
    - docs/plans/PLAN-REVERSE-566-memory-clean-cut-replacement.md
    - docs/test-design/harness/L7-memory-clean-cut-replacement-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/424
review_evidence: []
status: draft
github_issue_id: 424
admission_receipt:
  schema_version: v2
  receipt_id: certificate:e9a586a9cfd2880665a218f2b7a1350a
  command_id: plan-revise:issue-424:memory-clean-cut-impl:2
  admitted_at: 2026-09-16T04:23:38.598Z
  source_digest: sha256:a320820d565232986afd4de613b403bfa74c49d24b0f7f171f87d51b907e0726
  decision_digest: sha256:e545cb9c11a6cae0db59780975288d09d7810979100af4f7df486f2d4e95631b
  receipt_digest: sha256:2587d744847591a12da14bb4924cc005b351726fc13b2fa760df24b63d7e8ec4
  binding:
    path: docs/plans/PLAN-L7-566-memory-clean-cut-replacement.md
    plan_id: PLAN-L7-566-memory-clean-cut-replacement
    asset_id: plan:6f7505a570cabcffc4899bfc7f83cc98
    revision: 2
    content_digest: sha256:a320820d565232986afd4de613b403bfa74c49d24b0f7f171f87d51b907e0726
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 424
    episode_id: E4-424-memory-clean-cut-replacement
    projection_digest: sha256:3752d540f8d100945ac0f194391370fa52ceb76ecd501d3a6f010927eb87450e
  origin:
    plan_id: PLAN-L6-104-memory-clean-cut-replacement
    revision: 4
    digest: sha256:681847898234e3d840b1f6d18204054b3c9a366b1992922df8f28c80a0b87546
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-566-memory-clean-cut-replacement
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #424 PR-1: register tests/memory-clean-cut-removal.test.ts
    as a test_code deliverable of this PLAN (deliverable-plan-trace
    orphan-deliverable on PR #631 Linux CI)"
---

# PLAN-L7-566: project memory clean-cut replacement implementation

## 1. Outcome と位置付け

`PLAN-L6-104-memory-clean-cut-replacement` (redesign、`PLAN-L7-512` を supersede) の admission receipt が
`implementation_target` として本 PLAN rev 1 を名指ししている。本 PLAN は、その再降下先として PR-1 (migration 撤去) と
PR-2 (corpus 置換) の実装成果物を所有する。設計判断は上位の L6-104 §3 に凍結済みであり、本 PLAN は方式を追加・変更しない。

kind は `add-impl` (route `add-feature`) とし、Reverse 対 `PLAN-REVERSE-566` を同時に起票する。選定は
`ut-tdd advisor --decision design` (2026-09-16、claude-fable-5) の推奨 B に従う。`backprop_decision: not_required` による
Reverse 免除は `src/lint/backfill-pairing.ts` の `KIND_BACKFILL["add-impl"] = "required"` により conditional kind にしか
効かず、`impl` + `forward` は L6-104 の redesign 系譜 (supersede) との接続根拠を prose で別途担保する負担がある。

## 2. PR-1: migration 撤去 (本 PLAN の起票 PR で実施)

L6-104 §5 PR-1 の変更契約をそのまま実行する。

- `src/runtime/project-memory-migration.ts` と `tests/project-memory-migration.test.ts` を削除する。
- `src/doctor/test-repository-isolation.ts` の `CONTRACT_ROWS` から `project-memory-migration:1` を削除し、
  新規 oracle test の行 `memory-clean-cut-removal:1` を追加する。
- `L7-project-scoped-memory-root-test-design.md` の Slice 4a / 4b oracle 宣言 (13 件) を撤回する。baseline へは退避しない。
- `PLAN-L7-512` rev 8 (canonical `plan revise`) で `generates` から削除対象 2 件を外す。
- pair artifact §4.2 の候補 5 行を `U-MEMCUT-012`〜`U-MEMCUT-016` へ昇格し、`tests/memory-clean-cut-removal.test.ts` の
  静的 label で citation する。各行は負例 (import を 1 行戻す、CONTRACT_ROWS を据え置く、宣言を据え置く、generates を
  据え置く) を同じ test 内で Red として実測する。

新規 test file `tests/memory-clean-cut-removal.test.ts` は本 PLAN の `generates` (test_code) が所有する。
`deliverable-plan-trace` は出荷物ルート配下の全 file に owner PLAN を要求し、`merged-plan-status` は PR で初めて追加した
成果物を base tree で `landing_in_subject` と判定して draft 放置とみなさない (`src/lint/merged-plan-status.ts`) ため、
draft のまま同一 PR で登録できる (rev 2、PR #631 の Linux CI `orphan-deliverable` 赤化の是正)。

## 3. PR-2: corpus 置換

L6-104 §5 PR-2 の変更契約に従う。本 PLAN が追加で固定するのは成果物の置き場と所有だけである。

| 成果物 | path (予定) | 所有 |
| --- | --- | --- |
| rename digest manifest (tracked corpus の旧 path → archive path、bytes digest) | `docs/archive/memory-legacy-2026-09/MANIFEST.json` | 本 PLAN |
| generated summary (件数・digest 集計のみ。untracked の path / title / 本文を含めない) | `docs/archive/memory-legacy-2026-09/SUMMARY.md` | 本 PLAN |
| curation ledger (採否と根拠) | `docs/governance/memory-curation-ledger-2026-09.md` | 本 PLAN |
| non-read integration test (canonical / archive / linked legacy 同時配置 fixture) | `tests/memory-clean-cut-non-read.test.ts` | 本 PLAN |
| local archive の ignore rule | `.gitignore` (`.ut-tdd/archive/`) | 本 PLAN |

pair artifact §4.1 / §4.3〜§4.5 の候補 (001〜011、017〜030) は PR-2 で Red→Green を観測した行だけを同番号の正規 ID へ
昇格する。L6-104 §8 が指摘する「db rebuild と review-live の memory path が canonical root 内包検査を持たない」点は、
PR-2 の着手前に scope 判定し、収まらなければ L6-104 の revise で契約を先に固定する (本 PLAN で方式を発明しない)。

## 4. 受入条件

L6-104 §6 の 6 条件を本 PLAN の受入条件とする。PR-1 完了時点で成立するのは条件 6 (import graph と `CONTRACT_ROWS` に
`project-memory-migration` が存在しない) だけであり、それを `U-MEMCUT-012` / `U-MEMCUT-013` / `U-MEMCUT-016` で機械的に
証明する。条件 1〜5 は PR-2 の受入である。

## 5. 完了条件と非対象

- 完了: PR-2 merge 後、L6-104 §6 が全て Green、`ut-tdd db rebuild` が clean、非著者 closing review の PASS receipt が
  exact head に束縛され、本 PLAN が confirmed へ遷移し `generates` に PR-1 / PR-2 の test_code と成果物を登録する。
- 非対象: linked worktree legacy の cleanup (#578)、memory add 入口の重複 / episodic 検出 (#552 / #584)、inbox の
  終端状態 (#444)、global memory (#413)。これらは置換後の再汚染を防ぐ隣接課題であり、本 PLAN の受入に含めない。
