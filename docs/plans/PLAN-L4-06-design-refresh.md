---
plan_id: PLAN-L4-06-design-refresh
title: "PLAN-L4-06 (add-design): L4 設計 doc を実装実体へ整合 (drift back-fill) + under-design の明示 defer 化"
kind: add-design
layer: L4
drive: fullstack
status: confirmed
created: 2026-06-05
updated: 2026-06-05
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: pass
    scope: "L4 drift 整合 + under-design→defer + L9 孤児0 の最終 verdict = PASS (Critical 0)。drift 精度 5 点 (VALID_DRIVES=5 / src handover・setup・web + runHandover・runSetup / lint 9 / runtime 5 / ADR-005) を src 直照合で一致確認。code-reviewer は 2 回 truncate (IMP-009) のため pmo-sonnet で確定 + PM が src を直接再照合。Important 2 = ① workflow 残手続き (本 flip で解消) ② A-102 references (gitignore 実在の誤検知)。claude-only の TL 代替"
agent_slots:
  - role: tl
    slot_label: "TL — drift 整合 (実装↔設計) / under-design→defer 変換 / V-pair 孤児0 のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/external-if.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
dependencies:
  parent: docs/plans/PLAN-L4-00-master.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L4-basic-design/external-if.md
  references:
    - .ut-tdd/audit/A-101-g4-l4-freeze.md
    - .ut-tdd/audit/A-102-g4-workflow-orchestration.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L4-06 (add-design): L4 設計 doc を実装実体へ整合 + under-design の明示 defer 化

## §0 位置づけ

PO 指示「L4 の見直し・改善」を受け、L4 core 4 doc (data/architecture/function/external-if) を**新鮮な adversarial 監査** (pmo-sonnet ×4) にかけた結果、A-101/A-102 freeze 後に発生した 2 種の不整合を確定:

1. **drift (実装 ahead-of-design)**: agent-slots/forced-stop/session-log (IMP-050/068)・handover/setup feature・src/web (ADR-005)・追加 lint 4 種・review_evidence (IMP-071)・drive enum 縮小 (DISCOVERY-04 V7) が**実装済かつ review 済なのに L4 設計 doc へ back-fill されていなかった**。これは harness 自身が [[feedback_impl_must_backfill_to_design]] (IMP-051) を L4 で破った meta drift。
2. **under-design (機械担保の着地先未定義)**: GateId 形式 lint / Research 出口 gate の機械条件 / review_kind 記録の着地集約が「doc に書いたが守らせる機械処理が未定義」のまま (柱 2 違反)。

本 add-design は ① drift を実体へ整合 (cleanup 原則) + ② under-design を明示 defer (skip/carry + reason) へ変換し、L4 を「実装と一致し、かつ機械担保着地先が全項目で定義済 (または明示 defer)」へ戻す。新規 FR/設計の発明はしない (altitude 維持、wiring/整合のみ)。

## §1 監査所見 (4 軸 × 4 doc、Critical/Important)

| # | doc | 種別 | 所見 | 対応 |
|---|---|---|---|---|
| D-1 | data §3 | drift(Critical) | Drive 値域 = 9 (mode 値 scrum/reverse/poc/troubleshoot 混入) vs `VALID_DRIVES`=5 | §3 を 5 種へ整合 + 根拠注記 |
| D-2 | data §6 | drift(Important) | review_evidence 不変条件 (IMP-071 hard) が §6 に未着地 | §6 に Plan 不変条件行追加 |
| A-1 | arch §3.1/§6 | drift(Critical) | lint = 5 と記載 vs 実 src/lint = 9 module | 実体 9 + 「doctor/index.ts が正本」へ |
| A-2 | arch §3.1/§4 | drift(Critical) | handover/setup が「将来 session module」vs `src/handover` `src/setup` 実装済 | building block 追加 + §4 更新 |
| A-3 | arch §3.1/§3.2 | drift(Important) | runtime = detect+agent-guard のみ vs 実 5 ファイル | agent-slots/forced-stop/session-log 追記 |
| A-4 | arch §7 | drift(Important) | ADR-005 (配布+中央UI) が §7 表に欠落、src/web 未言及 | ADR-005 行追加 + web 言及 |
| A-5 | arch §6 | drift(Minor) | commit-msg hook (Conventional Commits) 不在 | §6 に追記 |
| E-1 | external-if §4 | drift(Critical) | degradation に codex-only (Claude不在/Codex存在) 欠落 vs function §3.6 正式 mode | §4 に codex-only 追記 |
| E-2 | external-if §3(d) | typo(Minor) | 「trishe」→「triage」 | 修正 |
| DC-1 | data §4 | under-design(Critical) | GateId lint = 「—」(機械担保着地先未定義) | 明示 defer (gate-id-format lint = IMP carry) |
| F-1 | function §3.1 | under-design(Critical) | Research 出口 gate = 「gate なし」で機械条件も defer 宣言もなし | 明示 defer (機械化 = IMP-052 carry) |
| F-2 | function §3.6 | under-design(Important) | review_kind/cross_agent_review の記録着地集約が未明示 | review_evidence (IMP-071) を着地先に明示 |
| F-3 | function §3.1/§3.2 | 可視化(Important) | Discovery/Scrum→Reverse 昇華の機械発火が doc から不可視 (実は scrum-reverse lint で enforce 済) | checkScrumReverse 参照を追記 |
| F-4 | function §3.7 | under-design(Important) | Scrum L8-L14 不可 (IMP-044) の機械着地先未明示 | forward_routing enum + carry 明示 |

> **carry (本 PLAN scope 外、IMP 化)**: ① external-if (c)(d) 観測/依存境界の ST-EXT 被覆 placeholder (C1) ② data ScrumType/evaluation_batch ライフサイクル (Minor) ③ asset-drift lint の carry PLAN id 確定。§6 で IMP 起票。

## §工程表

### Step 1: [直列] Tier1 drift 整合 (data/architecture/external-if)
- 直列理由 = **file_conflict** (3 design doc を書く)。D-1/D-2/A-1〜A-5/E-1/E-2 を実体へ整合。実装の実在は src/ 照合で確認済 (本 PLAN §1)。

### Step 2: [直列] Tier2 under-design→明示 defer (data/function)
- 直列理由 = **file_conflict** (data/function を Step1 と同じファイルで継続編集)。DC-1/F-1〜F-4 を defer 宣言 or 機械着地先参照へ。

### Step 3: [直列] L9 再ペア (孤児0 維持)
- 直列理由 = **downstream_dependency** (Step1/2 の設計変更を L9 ST へ反映)。ST-DATA (review_evidence) / ST-EXT-02 (codex-only) / §2 量閉じ更新。

### Step 4: [直列] IMP backlog 追記 + 検証
- 直列理由 = **downstream_dependency**。carry を IMP 化。typecheck 0 / vitest 全回帰 / doctor exit 0 / pair-freeze 孤児0。

### Step 5: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で drift 整合の正確性 (実装一致) + under-design→defer の妥当性 + V-pair 孤児0 をレビュー。通過後 review_evidence 記録 + confirmed flip + G4 再 bless (A-103)。

## §実装計画

- **data.md** (情報源: src/schema/index.ts VALID_DRIVES + doctor checkReviewEvidence): §3 Drive 整合 / §6 review_evidence 不変条件 / §4 GateId defer。
- **architecture.md** (情報源: src/ ディレクトリ実体 + ADR-005): §3.1 lint/runtime/handover/setup/web / §4 Handover / §6 commit-msg hook / §7 ADR-005。
- **function.md** (情報源: review_evidence schema + checkScrumReverse + concept §2.6): §3.1 Research defer / §3.6 review_kind 着地 / §3.2 scrum-reverse 参照 / §3.7 Scrum L8-L14。
- **external-if.md** (情報源: function §3.6 4 mode): §4 codex-only / §3(d) typo。
- **L9-system-test-design.md** (情報源: 上記設計変更): ST 整合 + 量閉じ。

## §6 用語更新

> 新規語の発明なし (drift 整合 = 既存実装語の doc 反映 / under-design→defer = 既存 defer 様式の適用)。既存語 (review_evidence/scrum-reverse/codex-only) は L0 §10 に既登録 (IMP-071/既存)。back-merge 対象なし。

## §8 DoD

- [x] Tier1 drift 7 件 (D-1/D-2/A-1〜A-5/E-1/E-2) を実体へ整合、src/ 照合で一致確認
- [x] Tier2 under-design 5 件 (DC-1/F-1〜F-4) を明示 defer or 機械着地先参照へ変換
- [x] L9 ST 整合 + 量閉じ孤児0 (pair-freeze lint 31 pair green)
- [x] carry を IMP backlog へ起票 (IMP-072〜075)
- [x] typecheck 0 / vitest 195 green / doctor exit 0
- [x] review 前置 (pmo-sonnet PASS、Critical 0。code-reviewer 2回 truncate=IMP-009 のため pmo-sonnet 確定 + PM src 直照合) → review_evidence 記録 + confirmed flip + G4 再 bless (A-103)
