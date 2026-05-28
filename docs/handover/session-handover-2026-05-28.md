---
doc_id: session-handover-2026-05-28
title: "UT-TDD Agent Harness セッション引継ぎメモ (2026-05-28)"
status: active
created: 2026-05-28
updated: 2026-05-28
owner: PM (Opus)
next_action: PO G3 PASS サインオフ判断
parent_g1: docs/handover/G1-readiness-report-2026-05-28.md (v8 PASS 確定)
parent_g3: docs/handover/G3-readiness-report-2026-05-28.md (v3、PASS 待ち)
---

# UT-TDD Agent Harness セッション引継ぎメモ (2026-05-28)

## §1 現在 phase

- **L1**: G1 PASS 確定 (v8、commit 59f5fd5、Minor 0 件)
- **L3**: G3 readiness v3 = PASS 推奨待ち (Critical 0 / Important 0 / Minor 0、PO サインオフ未)
- **L4**: 未起票 (G3 PASS 後着手)
- **PO 直問**: 1 件保留 (G3 PASS or 残追加修正)

## §2 直近 commit chain (本セッション分、新しい順)

| commit | 内容 |
|--------|------|
| d79c965 | **A-50** workflow core 7 FR L3 直接詳細化 (11 mode 全件被覆) |
| 8c87e7f | **A-49** L3→L1 back-propagation FR-L1-45 追加 + ID 衝突解消 |
| e3b5b47 | **A-48** g3-trace + entity-coverage 機械検証 lint 実装 (vitest 45 pass) |
| b4415f2 | **A-47** Critical 4 件解消 + P1 13 件 carry 明示 + D-01/D-04 補完 |
| b77f7bb | **A-46** 6 subagent 並列調査結果 back-propagation (DORA/SPACE/JTBD/NSM/PLG/fork/governance) |
| 2a3510f | **A-45** L3 sub-doc 本起草完了 (functional + business-detail + nfr-grade + L12 受入テスト) |
| 6ef4da6 | **A-44** L3 ヒアリング PO 直問 0 件達成 (TL 採用) |
| 301498c | **A-43** L3 ヒアリング TL レビュー反映 (PO 直問 36→2 件) |
| 29df198 | **A-42** L3 起票フレーム着地 (PLAN-L3-01〜03 + L3-functional/ + L12 placeholder) |
| 59f5fd5 | **A-41** G1 readiness v8 (Minor 5 件全件解消) |
| 486be21 | A-40 wireframe 柔軟方針 + 外部依頼 back-propagation |
| 109e2ec | A-39 L2-screen フォルダ新設 |
| f96ad44 | A-38 G1-trace sub-gate 新設 |
| d9ce15f | A-37 L2 skip 撤回 |
| 991b65f | A-33〜A-36 screen 14 画面 PM/HM/GD 全面再編 |

合計 15 commit (本セッション)。

## §3 重要 file パス (PO 判断材料)

### PO スキャン用 (最優先)
- `docs/handover/G3-readiness-report-2026-05-28.md` (v3) — **G3 PASS 判断材料の正本**
- `docs/handover/G1-readiness-report-2026-05-28.md` (v8 PASS 確定)
- `docs/migration/v2-import-ledger.md` §5 A-30〜A-50 — 本セッション軌跡

### L3 sub-doc (G3 凍結対象)
- `docs/design/harness/L3-functional/functional-requirements.md` (FR-01〜30/45 + AC 81+ 件)
- `docs/design/harness/L3-functional/business-detail.md` (BR-21 + HM-08 + FR-BR21-36/38/43)
- `docs/design/harness/L3-functional/nfr-grade.md` (NFR-01〜16 IPA Lv + 受入閾値)
- `docs/test-design/harness/L3-acceptance-test-design.md` (AT 116 件量閉じ)

### L3 PLAN
- `docs/plans/PLAN-L3-01-functional-detail.md`
- `docs/plans/PLAN-L3-02-business-detail.md`
- `docs/plans/PLAN-L3-03-nfr-grade.md`

### 機械検証 (vitest)
- `src/lint/g3-trace.ts` (~180 行、FR-L1/FR/AC/AT/NFR trace + 孤児検出)
- `src/lint/entity-coverage.ts` (~80 行、business §10.1 + §10.1.1 entity 整合)
- `tests/g3-trace.test.ts` (10 test)
- `tests/entity-coverage.test.ts` (4 test)
- 全 vitest: **45 pass / 0 fail**

## §4 PO 判断待ち (Next Action 候補)

### (a) G3 最終 PASS サインオフ (推奨)
- L3 凍結確定 → L4 基本設計起票 (PLAN-L4-01〜05) へ進行
- 並行で PO 指摘 carry 2 件 (process + guard) commit

### (b) 残追加修正
- Important 6 件: handover lifecycle / kind 固有 AC / G4-G14 / hook SessionStart/Stop / 問題視覚化 / S-04/S-05 詳細
- Minor 5 件: UX-02 専用 AT / 工程専門 mode 詳細 / cross layer / DORA 新 KPI / back-prop AT
- L4 carry に明示済、G3 PASS 阻害ではない

### (c) NG (追加スコープ修正)

## §5 PO 指摘 carry (未対応、別 commit 予定)

| # | PO 指摘 | 対応方針 |
|---|--------|---------|
| **carry-1** | 「PLAN 起票時に Web 検索 + フォーク + pdm 調査を組み込む process 改善」 | `docs/governance/PLAN-template.md` (新設) or concept §3.6 に「Step 0: 外部調査必須」明記 |
| **carry-2** | 「agent-guard に opus pdm-* 系の追加制約 (weekly quota 保護)」 | `.claude/CLAUDE.md` Guard Rules + `.claude/hooks/agent-guard.ts` で `UT_TDD_ALLOW_PDM=1` 明示必須化 |

## §6 L4 carry (G3 PASS 後の L4 起票で必須参照)

### functional 残 carry (P1 8 件、§3.1 で明示済)
- FR-L1-21 (テスト観点 W 字ゲート) / FR-L1-22 (FE detector 5 軸)
- FR-L1-28 (W 2 段設計) / FR-L1-37 (model 推挙) / FR-L1-39 (タスク難易度)
- FR-L1-42 (provider 引継ぎ) / FR-L1-44 (onboarding)
- FR-L1-31〜35 (P2 整備系)

### NFR L4 carry
- NFR-02 (npm/template/Packages 配布形態 ADR-002 候補)
- NFR-15 (Cloudflare/fly/docker Phase B 拡張 ADR-003 候補)
- NFR-09 (rule parity 機械検証実装方式)
- NFR-17 (Phase B telemetry PII redaction、新規候補)

### governance L4 carry
- `docs/governance/back-propagation-protocol.md` (4-step 手順 doc 化)
- `docs/design/nfr-classification.md` (NFR 3-tier: A doctor 自動 / B CI 後人間 / C PO 合意)
- ADR-002 候補: DORA 4+1 + SPACE Satisfaction + LT 分解 (PdM tech-innovation)
- ADR-003 候補: Neurosymbolic Guard Pattern + Back-propagation Protocol (tech-docs)

### PdM L4 add-design 候補
- BR-JTBD-01 (3 層 job + UX-04 audit evidence 可視化)
- BR-NSM-01 (Verified AI delivery rate = D-10 候補)
- BR-TTV-01 (Aha moment + TTV ≤ 15 分、FR-L1-44 連携)
- BR-multi-01/02 + FR-L1-multi-01/02 (Phase B multi-team carry)

### KPI 拡張候補 (PdM tech-innovation)
- D-10〜D-13 (DORA: Deploy Freq / Lead Time / Change Failure Rate / MTTR)
- D-14〜D-17 (SPACE: reviewer cognitive load / handover 完全性 / gate block time / PLAN diff LOC)

## §7 G3 readiness 最終状態

### 件数
| 指標 | 件数 |
|------|------|
| L1 BR | 8 + UX 3 + BR-21 = 12 |
| L1 FR-L1 | **42 件** (P0 19 + P1 18 + P2 5、A-49 で FR-L1-45 追加) |
| L1 NFR | 14 件 (NFR-09/10 欠番) |
| L3 FR | **26 件** (P0 19 + workflow core 7、A-50 で 7 件詳細化) |
| AC | **81+ 件** (Given-When-Then 形式) |
| AT | **116 件** (Phase A 即実装 104 + carry 12) |
| 14 画面 | PM 5 + HM 8 + GD 1 |
| 9 mode + 工程専門 2 = 11 mode | **全件 L3 直接被覆達成 (A-50)** |
| 業務 entity | 主要 12 + L3 由来 11 = 23 件 (A-46) |

### G1-trace / G3-trace
- G1-trace R1-R4 全 PASS (screen §5.6)
- G3-trace R1-R4 全 PASS (人手確認 + vitest 機械検証、L7 で本格 lint 実装)

### 機械検証
- vitest: **45 pass / 0 fail**
- biome lint: 通過
- g3-trace.ts / entity-coverage.ts 実装済

## §8 security / runtime 制約 (絶対遵守)

CLAUDE.md memory 由来:
- **subagent guard fail-close**: PreToolUse(Agent) で許可リスト 15 件 + model 明示 + opus override 禁止 ([[feedback-subagent-model-explicit]])
- **pdm-* は opus 固定** (sonnet override block)、weekly quota 消費
- **委譲 Codex のコミット禁止** (PM = Opus が verify 後にまとめて commit)
- **Codex Windows sandbox 不安定**: `helix codex --task-file <path>` で本文埋め込み ([[project-codex-windows-sandbox]])
- **filename English only** ([[feedback-filename-english]])
- **main 直接 commit/push 可** (PO 単独 maintainer、[[feedback-main-direct-solo]])
- **commit-msg hook**: Conventional Commits 強制、heredoc `git commit -F -` 使用 ([[project-commit-msg-hook]])
- **vendor/helix-source/ は read-only** (移植時は UT-TDD 所有パスへコピー)
- **API key / secret / PII を rules / docs / examples に書かない**

## §9 next session の AI への引継ぎ指示

1. **最初に読むファイル**:
   - 本 doc (`session-handover-2026-05-28.md`)
   - `docs/handover/G3-readiness-report-2026-05-28.md` (v3)
   - `CLAUDE.md` + `.claude/CLAUDE.md`
   - 直近 ledger entry: `docs/migration/v2-import-ledger.md` §5 A-50

2. **PO 確認待ち事項を確認**:
   - 本 doc §4 (a)/(b)/(c) の判断
   - 確認次第、(a) なら L4 起票 + carry-1/carry-2 並行 commit / (b) なら該当項目修正 / (c) なら PO 指示

3. **NG にすべき行動**:
   - L1 / L3 doc を勝手に再編 (G1 PASS / G3 PASS 後は凍結)
   - pdm-* を sonnet で呼ぶ (guard で block される、必ず opus + weekly quota 考慮)
   - 委譲 Codex に commit させる
   - secret / credential を doc に書く

4. **作業前に確認**:
   - vitest 45 pass / 0 fail を維持
   - biome lint pass
   - g3-trace / entity-coverage 機械検証を破壊しない (件数を変えるなら test も更新)

5. **memory 連動**:
   - 本セッションで [[feedback-elicitation-ai-first]] / [[feedback-elicitation-and-self-review]] を 2 回違反 (PO 直問格上げ / Web 検索遅れ) → 強化
   - PO 単独 maintainer [[feedback-main-direct-solo]] / main 直接 commit でやってきた

## §10 評価 (本セッションの振り返り)

### Keep
- G1 PASS → L3 詳細化を 1 セッションで完走
- pmo-sonnet matrix で Critical 4 件発見 → 即解消の sequence は機能した
- 6 subagent 並列調査 (tech-fork × 3 + tech-docs + pdm × 2 opus) で外部知見を補強
- back-propagation を doc + entity + FR の 3 軸で正本ルール化
- workflow core を L4 carry → L3 詳細化に格上げ (PO 指摘 = harness のコア価値死守)

### Problem
- L3 起票時 (PLAN-L3-01〜03 §3 ヒアリング) で Web 検索 / フォーク / pdm を組み込まず後追い → process 違反
- pdm 系を呼ぶ判断を逃した (PO 指摘で気付き)
- L3 で FR-19 (doc-reviewer) を独自起草、L1 FR-L1-19 と ID 衝突を放置 (PO 指摘で発覚)
- workflow core 7 件を L4 carry default にした (PO 指摘で発覚)
- PO 直問に技術用語生で投げた (PO 指摘「で、何が聞きたいの？」)

### Try (next session で改善)
- PLAN 起票テンプレに「Step 0: 外部調査 (pmo-tech-fork + pmo-tech-docs + pdm-* 必要性判定)」必須化
- agent-guard に opus pdm-* 追加制約 (`UT_TDD_ALLOW_PDM=1` 明示必須)
- PO 問は「ビジネス言葉で、1 文で、何を判断するか」明示
- 新 FR 起草時は ID 衝突チェック + L1 back-propagation を必ず実施
- workflow / mode / ガードレール系は P1 でも L4 carry 禁止、L3 詳細化必須
