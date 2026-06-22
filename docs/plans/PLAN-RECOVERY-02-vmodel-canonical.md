---
plan_id: PLAN-RECOVERY-02-vmodel-canonical
title: "PLAN-RECOVERY-02 (recovery): V-model 定義の前提欠落 — 正規式モデルへ収束 + L0-L3 fullback/フィックス"
kind: recovery
layer: cross
drive: fullstack
status: completed
created: 2026-06-04
updated: 2026-06-22
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: PO (人間) sign-off
    review_kind: human
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-04"
    verdict: pass
    scope: "PO 2026-06-22『2 はそもそも通過してないとおかしい段階だろ。ただの記載ミスか運用ミスだろ』= L0-L3 freeze (G0.5/G1/G2/G3) の PO サインオフ付与。Phase 1-3 (定義 doc / WF / 既存資産) は commit db79a3e→096a40e で正規式整合完了、gated downstream (L1-01..05 / L3-00..05) は全て status=confirmed、機械 trace (g3-trace / fr-registry / doc-consistency / vitest) green = freeze-ready が既済だったのに recovery PLAN 自身の status だけが draft に取り残された運用ミス (= 完了 bookkeeping drift)。本サインオフで L0-L3 freeze 確定 + status draft→completed。再発防止は plan-completion-drift gate ([[PLAN-L7-93]], DoD 全消化なのに status 非終端を fail-close) で機械化。"
    worker_model: human
    reviewer_model: human
  - reviewer: pmo-sonnet (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: pass
    scope: "Phase 1-3 境界 review (正規式モデルの網羅性 / 非破壊性 / エスカレーション列挙順を右腕工程順へ統一)。single-agent mode ゆえ cross-agent 不在を記録。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
agent_slots:
  - role: aim
    slot_label: "AIM — recovery 観点 (正規式モデルの網羅性 / 非破壊性 / 再発防止 = V-model 定義の anchor 化) のレビュー"
  - role: tl
    slot_label: "TL — 設計判断 (谷=3点合算・データ実在性エスカレーション・L2=L1分離 の妥当性、既存番号/ペア非破壊) の確認"
  - role: po
    slot_label: "PO — Recovery スコープ承認 (正規式モデル確定、L0⇔価値検証の新設、L3完了までのフィックス範囲、L4 entry readiness)"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-02-vmodel-canonical.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/process/forward/overview.md
    - docs/governance/gate-design.md
    - docs/design/harness/L3-functional/roadmap.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-RECOVERY-02 (recovery): V-model 定義の前提欠落 — 正規式モデルへ収束 + L0-L3 fullback/フィックス

> **駆動モデル = Recovery** (concept §2.5 / recovery-workflow)。PO 対話 (2026-06-04) で **V-model 定義そのものの前提欠落**が判明 → ad-hoc 編集を止め、Recovery で「上から doc 修正 → L0-L3 フィックス → L4 へ fullback」する。PO 指摘「リカバリー起票じゃないの？」+「アップデートってモデルはない」(2026-06-04) に基づき起票 (定義修正に "update" という非モデルの近道は無く、実在の駆動モデル=Recovery を通す)。requires_human_approval = true (po スコープ承認 + tl 非破壊性確認)。[[feedback_recovery_mode_for_premise_gap]] / PLAN-RECOVERY-01 と同型。

## §1 事故記録

- **timestamp**: 2026-06-04
- **severity**: P1 (foundational。V-model 定義は L0-L14 全工程の土台。本番影響なし)
- **impact**: V-model 定義 (concept §2.3 / requirements §1.4 / overview §4) が **(a) L0 企画に検証ペアが無い (穴)** / **(b) 谷 L7 の「3 点合算」(L6 設計 + 単体テスト + L7 コード) が未明示で、単体テストの居場所が L6⇔L7 の表記揺れに見えていた** / **(c) 右腕の「データ実在性エスカレーション」(テストデータ→本番実データ→運用→価値) という検証本質が未言語化** / **(d) L2 画面が「L1 のフェーズ分離 (画面要求→要求/要件・画面詳細→L5)」である点が未明示** という欠落を抱えていた。結果、粒度・左右対照の監査 (PO /goal) が定義の不備に何度も突き当たり、PM が「全面再番号が要る/崩れる」と誤った over-claim をした。
- **検知元**: PO の Socratic な問い (「L7 が底なら L8 は単体テスト」「企画のペアは？要求は運用で測る」「要件は本番、基本設計は総合」「どこも崩れないのでは」「画面は実データ検証、本番受入は検証ありき」) を通じて正規式モデルが明確化され、現定義の欠落が浮上。

## §2 議論順序 timeline

1. PO /goal: L6 機能設計⇔単体テストを最小単位に左右設計書粒度の対照性を確認・改善。
2. PM が監査・記録に寄せ、WF↔設計対応の改善を routing で済ませ Stop hook 差し戻し → 実装 ([[feedback_improve_means_implement_not_route]])。
3. PO「A は V-model 設計書全部見たか／L3 で止まっている」→ PM が「5/6 対照」over-claim を成熟度実態 (spine L3 停止) へ訂正。
4. PO「ドキュメントの定義を適切な粒度に見直す意味」→ 対象が定義 (meta-spec) と判明。
5. PO の一連の問いで **正規式モデル** (§4/§5) が確定。PM の「全面再番号/崩れる」は誤りで「非破壊の追加・明確化」と確定。
6. PM が concept §2.3 を ad-hoc 編集開始 → PO「リカバリー起票じゃないの？」「アップデートってモデルはない」で process 是正 → 本 Recovery 起票。

## §3 認識訂正履歴 (当初仮説 → 実際の差分)

| # | 当初仮説 (PM 誤認識) | 実際 (PO 対話で確定) |
|---|---|---|
| 1 | 「L8 単体」は PO の言い違いで、doc (L8=結合) が正。PM が PO を 2 回「言い違いでは」と訂正 | **PO のモデルが正**。現 V-model 定義 (単体を L7 内包・L0 ペア無し・検証本質未言語化) の方が不備で、訂正対象は PO でなく doc |
| 2 | 粒度対照は監査・記録 + REVERSE-01 への routing で足りる | **改善そのものを実装**する必要 (Stop hook 差し戻し、[[feedback_improve_means_implement_not_route]]) |
| 3 | 「6 V-pair 中 5/6 が対照」は確定結論 | spine は L3 停止 (L1/L3/L4 全 draft、L5/L6 は Add-feature slice のみ confirmed)。L4-L6 は draft 同士の構造並行で**確定対照でない** (over-claim を訂正) |
| 4 | 正規式採用は **全面再番号が要る / V が崩れる** | **非破壊**。既存 6 V-pair は元から正規式と一致 (L6⇔L7/L5⇔L8/L4⇔L9/L3⇔L12/L2⇔L10/L1⇔L14)。足すのは L0⇔価値の 1 ペアと明確化のみ |
| 5 | 定義は ad-hoc に編集 (update) してよい | **「アップデート」という駆動モデルは無い** (PO 2026-06-04)。定義修正は実在の駆動モデル (Recovery) を通す |

## §4 中間結論 list

正規式 V-model モデルの確定点 (PO 対話 2026-06-04、対応中に判明した中間判断):
- **L0 企画 ⇔ 価値検証** (L14→L0 feedback で検証) を新設 — 唯一の構造的な穴埋め (新規 layer 番号は増やさない)。
- **谷 L7 = 3 点合算** (L6 設計 ① + 単体テスト設計 ③ を見て TDD red 先行 → コード ②、最小単位)。
- **右腕 = データ実在性エスカレーション** (合成/テストデータ→本番実データ→運用→価値)。
- **各ペアの検証本質**: L3=本番受入 / L2=実データ検証 / L1=運用 / L0=価値。
- **L2 画面 = L1 のフェーズ分離** (画面要求→要求/要件、画面詳細→L5)。
- **非破壊原則**: 番号・既存 V-pair 据え置き。追加 (L0 ペア) と明確化のみ。
- **reopen = L0** (concept §2.3 を起点に上から修正)。

## §5 context 再構築 (session 復帰時に必要な前提)

正規式 V-model モデル全表 (復帰時はこれを正本とする):

| 左 (設計層) | 右 (検証、既存工程) | 検証本質 (環境・データ実在性) |
|---|---|---|
| **L0 企画** | (価値検証 = L14→L0 feedback) | **価値**: 事業目的・価値の実現 (実成果) ← 新設 |
| L1 要求定義 | L14 運用検証 | **運用**: 実データ × 継続運用 (時間) |
| L2 画面設計 | L10 UX 磨き | **実データ検証**: 本番の実データで画面が成立するか |
| L3 要件定義 | L12 デプロイ+受入 | **本番受入**: 本番環境で要件 (FR+AC) が満たせるか |
| L4 基本設計 | L9 総合テスト | **総合**: テスト環境・全体 |
| L5 詳細設計 | L8 結合テスト | **結合**: テスト環境・モジュール |
| L6 機能設計 | L7 谷 (3 点合算) | **単体**: テスト環境・関数 |

- **現在地**: Forward spine は L3 停止 (L1/L3/L4 全 draft、L5/L6 は Add-feature slice のみ confirmed)。本 Recovery で L0-L3 を正規式整合 → フィックス → L4 へ。
- **情報源**: 主たる正本 = PO 対話 (2026-06-04) で確定した正規式。既存資料 = concept §2.3 / requirements §1.4 / overview §4。Web/TL 調査・自動生成は無し。
- **進捗 (2026-06-04、commit db79a3e→096a40e)**: **Phase 1 (定義: concept §2.3 / requirements §1.4 / gate-design / document-system-map) + Phase 2 (WF: overview §4 / forward L00-L06/L07/L08-L14 / gates.md) + Phase 3 (既存資産: L1/L3 design・test-design) 完了** (9+ doc 正規式整合、非破壊)。phase 境界 review 前置 (pmo-sonnet) 通過 (エスカレーション列挙順を右腕工程順へ統一)。**要件定義 (L3) は正規式整合済** (検証本質=本番受入 / 画面要求=L1 確認。FR 内容は不変、P1/P2 は既存どおり L4 carry)。**残 = L0-L3 freeze (G0.5/G1/G2/G3) の po-gate**: doc は正規式整合 + 機械 trace (g3-trace / fr-registry / doc-consistency / vitest 113 pass) green = **freeze-ready**。最終 freeze (L1/L3 PLAN の confirmed 化 + G1/G3 の PO サインオフ) は requires_human_approval。L4 entry は G3 freeze 後にスムーズ。

## §6 再開ポイント (中断工程への fullback)

上から (concept → requirements → overview → process → assets → L3 要件) へ修正を流し、L0-L3 をフィックスして L4 へ fullback。着手順:

1. **Phase 1 — 定義ドキュメント** (governance): concept §2.3 (**済**) / requirements §1.4 (**済**) / overview §4 / gate-design (G0.5↔価値検証) / document-system-map (層別検証本質)。
2. **Phase 2 — ワークフロー**: process/forward (overview / L00-L06-design-phase / L07-implementation / L08-L14-verification-phase) + modes/* + gates.md を正規式へ整合 (谷 3 点合算の TDD red / 右腕エスカレーション / L2=L1 分離)。
3. **Phase 3 — 既存資産**: L0 価値検証 artifact の位置づけ + L1/L3 design・test-design 整合、L2=L1 分離 (画面要求の L1 内包 / 画面詳細の L5 行き) を反映。
4. **要件定義 (L3) 修正 + L1 上流整合**: 本番受入の検証本質、画面要求の L1 内包前提を反映 (新 FR は定義整合のため最小)。
5. **L0-L3 フィックス**: G0.5 (企画⇔価値 trace) / G1 (L1) / G2 (L2 mock) / G3 (L3) の freeze-ready (機械検証分 + 宣言 trace)。**最終 freeze は po-gate**。L4 entry がスムーズな状態へ。
6. **固定 review Step**: 各 Phase 完了時に **intra_runtime_subagent review** (`pmo-sonnet` / `code-reviewer`) を前置。PO へ確定/gate を求める前に必ず通し、代替 reviewer を evidence に残す (single-agent mode、cross-agent 不在記録)。
7. **回帰**: 各 commit で命名テスト (`tests/plan-id-naming.test.ts`) + 全 vitest。**1 Phase = 1 commit** を default。

## §7 再発防止 (観点リスト / CI チェック追加案)

- **観点**: V-model 定義 (番号 / 既存 V-pair / 検証本質 / 谷 3 点合算 / L0 ペア) が doc 間 (concept §2.3 / requirements §1.4 / overview §4) で drift しないこと。
- **anchor 化**: V-model 定義の正本 anchor = concept §2.3。roadmap §1 (観点 B = ドキュメント⇔テスト設計の同粒度) がこれを参照する。
- **用語更新 (§G.9 相当)**: 「価値検証」「3 点合算」「データ実在性エスカレーション」「本番受入」「実データ検証」「L2=L1 フェーズ分離」を living glossary へ追加。
- **CI チェック追加案 (IMP)**: 定義 drift (concept §2.3 表 ↔ requirements §1.4 ↔ overview §4 の V-pair / 検証本質の不一致) を `ut-tdd plan lint` / vmodel lint の検証候補に追加。improvement-backlog へ IMP 起票。
- **「アップデート」非モデルの規律化**: 定義の ad-hoc 編集 (update) を禁じ、定義修正は必ず駆動モデルを通す規律を CLAUDE.md / process に明記する候補。
- **完了 bookkeeping drift の機械化 (2026-06-22 実装済)**: 本 PLAN は Phase 1-3 完了 + gated downstream 全 confirmed + freeze-ready なのに status=draft に取り残され、毎 session「未了」として再報告された (= 「ただの記載ミス / 運用ミス」)。merged-plan-status は出荷物 (src/tests/scripts/.claude) しか見ず自分の md だけが deliverable の recovery PLAN を構造的に見逃した。再発防止として `plan-completion-drift` gate ([[PLAN-L7-93]]) を新設 = DoD/完了条件を全消化 (`- [x]`) したのに status が非終端なら doctor fail-close。本 PLAN は §8 DoD を追加し本 gate の被覆下に置いた。

## §8 完了条件 (DoD)

- [x] **Phase 1** — 定義 doc (concept §2.3 / requirements §1.4 / gate-design / document-system-map) を正規式整合 (非破壊)。
- [x] **Phase 2** — ワークフロー (overview §4 / forward L00-L06・L07・L08-L14 / gates.md) を正規式整合 (谷 3 点合算 / 右腕エスカレーション / L2=L1 分離)。
- [x] **Phase 3** — 既存資産 (L0 価値検証の位置づけ / L1・L3 design・test-design 整合 / 画面要求の L1 内包)。
- [x] **要件定義 (L3) 修正 + L1 上流整合** — 本番受入の検証本質・画面要求の L1 内包前提を反映 (FR 内容不変)。
- [x] **固定 review Step** — 各 Phase 完了時の intra_runtime_subagent review (pmo-sonnet) 前置 + cross-agent 不在記録。
- [x] **機械 trace green** — g3-trace / fr-registry / doc-consistency / vitest が green = freeze-ready。
- [x] **gated downstream 確定** — L1-01..05 / L3-00..05 PLAN が全て status=confirmed。
- [x] **L0-L3 freeze (G0.5/G1/G2/G3) の PO サインオフ** — PO 2026-06-22 付与 (review_evidence)。
- [x] **再発防止** — 完了 bookkeeping drift を `plan-completion-drift` gate ([[PLAN-L7-93]]) で機械化。
