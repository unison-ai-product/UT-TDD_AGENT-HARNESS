---
plan_id: PLAN-L7-82-feedback-log-discipline-lint
title: "PLAN-L7-82: feedback-log discipline lint — FB ドメスティック化未強制を fail-close (IMP-085)"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L4-basic-design/architecture.md
status: confirmed
created: 2026-06-19
updated: 2026-06-19
review_evidence:
  - reviewer: qa-test
    review_kind: cross_agent
    worker_model: claude-opus-4-8
    reviewer_model: codex-gpt-5.5
    tests_green_at: "2026-06-19"
    reviewed_at: "2026-06-19"
    verdict: pass
    scope: "feedback-log discipline lint (analyzeFeedbackLog 純関数 + parseFeedbackEntries + loadFeedbackLogInput loader + checkFeedbackLog doctor 配線 + 8 unit テスト U-FBLOG-001..008)。検査規則 = status=open / domesticated 空(status≠superseded) → undomesticated 違反、domesticated の IMP-NNN が improvement-backlog 不在 → dangling、backtick path repo 不在 → missingPathRef、不正 status / 重複 ID / 列欠落 / unparseable FB 行 (absence-blindness)。superseded は domestication/参照実在 対象外。memory [[name]] は repo 外 private で存在突合せず非空のみ要求 (honest 限界)。fail-open(docs/feedback-log.md 不在)/fail-close(repo root 不在/読めない)。実 repo 4 FB entries domesticated=green。cross_agent QA(codex-gpt-5.5) verdict=pass-with-nits (Critical/Important 0、Minor=path 表記制約の明文化のみ→コメント反映済)。evidence=.ut-tdd/audit/A-139。"
agent_slots:
  - role: qa
    slot_label: "QA - feedback-log domestication discipline lint 設計 + 配線 + cross_agent review"
generates:
  - artifact_path: src/lint/feedback-log.ts
    artifact_type: source_module
  - artifact_path: tests/feedback-log.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-55-plan-artifact-existence-gate.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-82: feedback-log discipline lint (IMP-085)

## Objective

設計の柱2 (doc×機械厳格化) + 柱3 (フィードバック機構の可視化) の実体化。**`docs/feedback-log.md` の各
FB エントリが実際に memory/IMP/doc へドメスティック化されたか** (= `domesticated to` 非空 + `status≠open`
+ 参照先の in-repo 実在) を doctor が fail-close 検査し、「フィードバックがログに書かれたまま未ドメスティック化で
放置」を機械で塞ぐ。

**動機 (A-138 ITEM-3、cross_agent TL/Codex 裏取り)**: feedback-log は PO 指摘
「memory に書いてドメスティック化して見えなきゃ価値ゼロ」(2026-06-08) の可視 tracked counterpart として
新設されたが、ドメスティック化の実効性は人手依存だった (IMP-085 observed)。TL cross-review で「improvement-backlog
lint と同型の existence/consistency 検査 = 既存 §1.10.G.12 backlog discipline / FR-L1-19 の隣接拡張で、
新規 FR を起票せず実装可」と分類された ((a) 既存 FR 拡張)。

## WBS

| WBS ID | Work | Source target | Test target | Gate | 並直 |
|---|---|---|---|---|---|
| WBS-L7-82-01 | `parseFeedbackEntries` + `analyzeFeedbackLog` 純関数 + `loadFeedbackLogInput` loader + `feedbackLogMessages`。検査 = undomesticated(open/空) / danglingImpRefs / missingPathRefs / invalidStatus / duplicate / incomplete / unparseable。superseded 除外。memory は非空のみ。 | `src/lint/feedback-log.ts` | `tests/feedback-log.test.ts` | `vitest tests/feedback-log.test.ts` | [直列] |
| WBS-L7-82-02 | `checkFeedbackLog` を doctor へ配線 (runDoctor.ok 連動、hard gate)。fail-open(file 不在)/fail-close(repo 不在/読めない)。 | `src/doctor/index.ts` | `ut-tdd doctor` | `ut-tdd doctor` | [直列] |
| WBS-L7-82-03 | cross_agent review (qa-test=codex-gpt-5.5) → nit 反映 → confirmed。 | (review) | A-139 | `ut-tdd doctor` | [直列] (02 後) |

## Acceptance Criteria

- [x] status=open / domesticated 空 (status≠superseded) → undomesticated 違反・doctor ok=false。
- [x] domesticated の IMP-NNN が improvement-backlog 不在 → dangling、backtick path repo 不在 → missingPathRef。
- [x] superseded は domestication / 参照実在 検査の対象外 (status/列欠落は依然検査)。
- [x] memory `[[name]]` は repo 外 private で存在突合しない (非空のみ要求、honest 限界をコメント明示)。
- [x] FB 様行が parse できない (absence-blindness) を unparseableRows で surface。
- [x] fail-open(docs/feedback-log.md 不在)、fail-close(repo root 不在/読めない)。
- [x] 実 repo で feedback-log OK (4 FB entries domesticated、open/dangling 0)。
- [x] typecheck / biome / vitest (U-FBLOG-001..008) / doctor green。
- [x] review 前置: cross_agent QA (codex-gpt-5.5) verdict=pass-with-nits、Critical/Important 0、nit 反映。

## 壊さない / 再発させない

- **本 gate は「フィードバックはドメスティック化せよ」を強制する**。緩める (open を許す / 空 domesticated を
  通す) と feedback-log が「書いて放置」の死蔵ログに退化する (柱3 の可視化が形骸化)。
- **memory 存在突合はしない** = repo 外 private state なので in-repo では検証不能 (false-confidence を作らない
  ための honest 限界)。memory を gate truth にしようとして agent-private path を CI 前提にしない。
- backtick + repo 相対 POSIX path のみ突合 (prose 中の偶然のファイル名を拾わない false-positive 回避)。
