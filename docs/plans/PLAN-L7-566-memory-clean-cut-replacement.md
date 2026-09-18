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
  - artifact_path: src/memory/legacy-archive-manifest.ts
    artifact_type: source_module
  - artifact_path: src/memory/curation-ledger.ts
    artifact_type: source_module
  - artifact_path: tests/memory-clean-cut-non-read.test.ts
    artifact_type: test_code
  - artifact_path: tests/memory-legacy-archive.test.ts
    artifact_type: test_code
  - artifact_path: tests/memory-curation-ledger.test.ts
    artifact_type: test_code
  - artifact_path: tests/memory-clean-cut-removal.test.ts
    artifact_type: test_code
  - artifact_path: docs/archive/memory-legacy-2026-09/MANIFEST.json
    artifact_type: json_config
  - artifact_path: docs/archive/memory-legacy-2026-09/SUMMARY.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/memory-curation-ledger-2026-09.md
    artifact_type: markdown_doc
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
review_evidence:
  - reviewer: codex-sol-blind-reviewer
    review_kind: cross_agent
    reviewed_at: 2026-09-18T03:52:26.521Z
    tests_green_at: 2026-09-18T03:38:36.000Z
    verdict: "VERDICT: PASS (blocking 0; PR #644 r1〜r4 の previous FINDING は全て
      CLOSED、correction diff に回帰なし)"
    worker_model: claude-fable-5-1
    reviewer_model: gpt-5.6-sol
    effort: low
    plan_revision: 66ff1ac1e7b2ca18e0dc6def0a3b0dae69d78653
    subject_head: 66ff1ac1e7b2ca18e0dc6def0a3b0dae69d78653
    evidence_path: tests/memory-clean-cut-non-read.test.ts
    anchor_commit: 66ff1ac1e7b2ca18e0dc6def0a3b0dae69d78653
    scope: "PR #655 exact head 66ff1ac1 に対する非著者 (Codex family) blind preflight
      review。著者 family は claude (PO 判断 2026-09-16 により Claude control lane が PR-2
      を実装)。canonical request rv1-e1ae6a6cb92a0f11… の receipt が verdict を記録する。対象は
      PLAN-L6-104 §5 PR-2 / 本 PLAN §3 の成果物 (archive rename + manifest / summary、
      canonical-only non-read oracle、reader の canonical 束縛 2 件、curation ledger と
      46 件の再登録) と pair test-design §4.1 / §4.3 / §4.4 / §4.5 の昇格行。"
    citations:
      - .ut-tdd/review/receipts/e1ae6a6cb92a0f117a3bed324c0555042ec3d6840bde8592b1cc945726cbf0fc.json
      - .ut-tdd/review/packets/pr655-66ff1ac1/control-lane-measurements.txt
      - .ut-tdd/review/packets/pr655-66ff1ac1/red-evidence.txt
    green_commands:
      - kind: unit_test
        command: node scripts/run-vitest-snapshot.ts tests/memory-legacy-archive.test.ts
          tests/memory-clean-cut-non-read.test.ts
          tests/memory-curation-ledger.test.ts (fence env = exact-head snapshot;
          U-MEMCUT-028 は reviewer 記録束縛後に Green)
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: 2026-09-18T03:38:36.000Z
        evidence_path: tests/memory-clean-cut-non-read.test.ts
        output_digest: sha256:72e9b80ba22c3ddc8f95dc6f9ec31337c4b1d4b5710576c82ef2ab0be6828369
        anchor_commit: 66ff1ac1e7b2ca18e0dc6def0a3b0dae69d78653
      - kind: typecheck
        command: npx tsc --noEmit -p .
        runner: node
        scope: full
        exit_code: 0
        completed_at: 2026-09-18T03:38:36.000Z
        evidence_path: src/memory/legacy-archive-manifest.ts
        output_digest: sha256:2c22d314295de5deb182b1cb24c98029bb32b817b1c4f892da0ebe9cc73550c8
        anchor_commit: 66ff1ac1e7b2ca18e0dc6def0a3b0dae69d78653
status: confirmed
github_issue_id: 424
admission_receipt:
  schema_version: v2
  receipt_id: certificate:3cbfe4e442fe65c204bc7f8befa0a54d
  command_id: plan-revise:issue-424:pr2-confirm:r4:0d42c71d1a79
  admitted_at: 2026-09-18T03:54:06.986Z
  source_digest: sha256:52b88699bd744c8c7f0302d0ec7e457516ff50974a6de9f18154ee49f477aba9
  decision_digest: sha256:5c1ae5d99fe72b0e742b6a5ae705046b56b39727b6b09af7f1cb354bc46d9efd
  receipt_digest: sha256:b5b958950f4572830ebba8f8c521e4bc1612b7ed2359be9d21ed8753c2c277c7
  binding:
    path: docs/plans/PLAN-L7-566-memory-clean-cut-replacement.md
    plan_id: PLAN-L7-566-memory-clean-cut-replacement
    asset_id: plan:6f7505a570cabcffc4899bfc7f83cc98
    revision: 4
    content_digest: sha256:52b88699bd744c8c7f0302d0ec7e457516ff50974a6de9f18154ee49f477aba9
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
    target_revision: 4
    phase: forward_merge
  escape_reason: "Issue #424 PR-2 (PR #644): PLAN-L7-566 を draft から confirmed
    へ遷移し、exact head 66ff1ac1e7b2 の非著者 preflight review に束縛して landing 成果物 (module
    2、test 4、manifest / summary / ledger) を generates で所有する。契約変更なし。"
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

## 6. PR-2 実装記録 (rev 4、2026-09-16)

- 実装 lane: Claude control lane (PO 判断 2026-09-16、Codex 飽和のため回収)。非著者 review は Codex Sol。
- §3 の scope 判定: L6-104 §8 の「db rebuild の cwd 起点」と「review-live の memory path 包含検査不在」は、canonical root 解決
  (`requireProjectMemoryRoot`) と typed deny (`review_memory_path_outside_canonical_root`) の最小配線で PR-2 に収まると判定し、
  L6-104 の revise は行わなかった。方式は L6-104 §3.1 判断 2 (project-scoped canonical root の維持) から一意に決まる。
- Red 起点 (base HEAD で実測): `P-MEMCUT-006` は linked worktree cwd の `db rebuild` が linked root 配下へ db を作り linked legacy を
  投影、`P-MEMCUT-009` は review-live に path 包含検査が無い。
- 成果物: §3 表の 5 件に加え、archive manifest module (`src/memory/legacy-archive-manifest.ts`) と curation ledger module
  (`src/memory/curation-ledger.ts`) を `generates` へ登録。`tests/memory-clean-cut-removal.test.ts` の所有を PLAN-L7-512 rev 9 の
  暫定所有から本 PLAN へ移した (512 rev 10 と対)。
- 昇格しなかった行: `CANDIDATE-P-MEMCUT-008` (session start digest)、`CANDIDATE-U-MEMCUT-022` (local 証跡のみ)、`CANDIDATE-P-MEMCUT-031`
  (hook consume 経路、旧 009(a))。
- curation: 1032 source (tracked 607 / untracked 425)、adopt 46 (同義統合 5)。採用件数は受入条件ではない (L6-104 §3.1 判断 6)。

## 7. 設計判断: `U-MEMCUT-028` の reviewer 束縛 head (rev 4)

- **前提**: 028 は ledger の reviewer 記録が非著者 frontier (codex `gpt-5.6-sol`) の実 receipt と判定対象 exact head に束縛される
  ことを要求する。receipt は review 後にしか存在せず、束縛 commit は review 対象 head より後になる (循環)。
- **決定**: 束縛先は「ledger 内容を確定した head」に対する Sol PASS receipt とし、`reviewer.exact_head` にはその head、
  `reviewer.receipt` にはその canonical request の review revision (`rv1-<sha256>`) を記録する。束縛 commit 自体は束縛差分
  (ledger の reviewer 記録と test-design の記述) だけを bounded で再検し、その PASS を本 PLAN の `review_evidence` に記録する。
- **却下した案**: (a) 028 を placeholder 許容にする (PR #644 r1 FINDING #5 のとおり reviewer 不在で Green になる)。(b) 束縛のために
  ledger 全体を再 review する (65 file の全面再読が FLAG のたびに繰り返されて収束せず、PO 2026-09-17 の bounded 再検規律に反する)。
- **PR #655 での実値**: `reviewer.exact_head` = 66ff1ac1e7b2ca18e0dc6def0a3b0dae69d78653、receipt = rv1-e1ae6a6cb92a0f11…。
