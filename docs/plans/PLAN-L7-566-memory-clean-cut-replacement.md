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
  - artifact_path: docs/governance/memory-curation-ledger-2026-09.md
    artifact_type: markdown_doc
  - artifact_path: docs/archive/memory-legacy-2026-09/MANIFEST.json
    artifact_type: json_config
  - artifact_path: docs/archive/memory-legacy-2026-09/SUMMARY.md
    artifact_type: markdown_doc
  - artifact_path: src/memory/curation-ledger.ts
    artifact_type: source_module
  - artifact_path: src/memory/legacy-archive-manifest.ts
    artifact_type: source_module
  - artifact_path: tests/memory-clean-cut-non-read.test.ts
    artifact_type: test_code
  - artifact_path: tests/memory-curation-ledger.test.ts
    artifact_type: test_code
  - artifact_path: tests/memory-legacy-archive.test.ts
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
  receipt_id: certificate:aefff77da46304bdff051b15ff4bf4cb
  command_id: plan-revise:issue-424:memory-clean-cut-impl:4
  admitted_at: 2026-09-17T05:10:11.742Z
  source_digest: sha256:ac5224c7616e183c7cf3fd8cdbc2fd61b4cfb5ae912bcf4ea956e596f0673e73
  decision_digest: sha256:de782ca208caf201ad467c21b6d951113c84a4aeb61a3cba42def801d6510791
  receipt_digest: sha256:6432275da5f6c674b8a7a9662f872988c7a22d06bcc3e313736606463564eb7a
  binding:
    path: docs/plans/PLAN-L7-566-memory-clean-cut-replacement.md
    plan_id: PLAN-L7-566-memory-clean-cut-replacement
    asset_id: plan:6f7505a570cabcffc4899bfc7f83cc98
    revision: 4
    content_digest: sha256:ac5224c7616e183c7cf3fd8cdbc2fd61b4cfb5ae912bcf4ea956e596f0673e73
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
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #424 PR-1: move ownership of
    tests/memory-clean-cut-removal.test.ts to confirmed PLAN-L7-512 rev 9
    because merged-plan-status rejects a landing deliverable on a draft PLAN (PR
    #631 Linux CI)"
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

新規 test file `tests/memory-clean-cut-removal.test.ts` の所有は、confirmed である `PLAN-L7-512` rev 9 の `generates`
(test_code) に置く。`deliverable-plan-trace` は出荷物ルート配下の全 file に owner PLAN を要求し、`merged-plan-status` は
draft PLAN の deliverable が PR 内で landing でも「未 confirm のまま出荷物」として違反にする (PR #631 Linux CI、rev 2 での実測)。
draft のままの本 PLAN は出荷物を所有できないため、本 PLAN が confirmed へ遷移する PR-2 の完了時に所有を本 PLAN へ移す
(512 rev 9 の注記と対)。この test は 512 の `generates` 整合 (U-MEMCUT-015) と Slice 4 撤去後の不変条件を守るものであり、
512 が所有する間も内容の owner 契約は本 PLAN §2 である。

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
