---
plan_id: PLAN-REVERSE-36-verification-cycle-gate-naming
title: "PLAN-REVERSE-36 (reverse/normalization): 横断ゲート命名を V-model band 検証サイクルゲートへ正規化 — roadmap GATE-A/B 廃し L3/L6/設計/実装 検証サイクルゲート + doctor ラベル + concept §10 用語 (PO 2026-06-10)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: normalization
drive: agent
status: confirmed
created: 2026-06-10
updated: 2026-06-10
owner: PM (Opus) / PO (人間)
forward_routing: L3
promotion_strategy: reuse-with-hardening
agent_slots:
  - role: tl
    slot_label: "TL — 命名正規化が検証ロードマップ (検証タイミングの V-model band 機械発火) の実体と整合するか / GATE-A/B 廃止に伴う dangling 参照が無いか / 検証ロードマップを driver にしない原則を崩さないかのレビュー (claude-only/hybrid-Codex不安定時は code-reviewer 代替)"
  - role: po
    slot_label: "PO — 命名 intent (L3検証サイクルゲート / L6検証サイクルゲート / 設計検証サイクルゲート、GATE-B も実装検証サイクルゲートへ) 検証。PO 2026-06-10『L3検証サイクルゲート、L6検証サイクルゲート、設計検証サイクルゲートって感じにすれば』+ 『フォワードのワークフロー上じゃない？』(GATE-A を Forward gate ceremony に格上げするなの是正) で授権済"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-12-verification-trigger.md
  references:
    - docs/plans/PLAN-REVERSE-11-verification-trigger.md
    - docs/design/harness/L3-functional/roadmap.md
---

# PLAN-REVERSE-36 (reverse/normalization): 横断ゲート命名の V-model band 正規化

## §0 位置づけ

PO 是正 (2026-06-10): GATE-A の「再検証して accept → 台帳記録」は **検証ロードマップを Forward ワークフローの gate ceremony に格上げ**する誤りだった。Forward の正規ゲートは per-layer の G0.5/G1/G3/G4/G5/G6 (gate-design §2、全 PASS 済、G2 のみ DEFER) であり、横断「GATE-A/GATE-B」は roadmap (L3 検証ロードマップ = living doc) 固有の **V-model band 単位で機械発火する検証サイクル** ([[feedback_roadmap_is_design_doc_level]] / doctor `checkVerificationGroups`)。

そこで Phase 連番由来の「GATE-A/GATE-B」を廃し、**band 終端層 / band 性質で命名**する検証サイクルゲートへ正規化する:

| 新名称 | V-model band (発火単位) | 旧名称 |
|---|---|---|
| **L3 検証サイクルゲート** | L0-L3 (上流 要求〜要件) | GATE-A の一部 |
| **L6 検証サイクルゲート** | L4-L6 (設計 基本〜機能) | GATE-A の一部 |
| **設計検証サイクルゲート** | L0-L6 (全設計層 = 上記の累積) | GATE-A |
| **実装検証サイクルゲート** | L0-L7 (左腕 + 谷) | GATE-B |

これで「名前 = V-model band」となり、検証ロードマップを driver にせず Forward freeze で機械発火する実体 (doctor surface) と一致する。機構 (PLAN-L6-11/L7-12) は不変、命名のみ正規化 (no behavior change)。

## §工程表

### Step 1: [直列] doctor 検証サイクルゲート名を単一正本へ
- 直列理由 = **file_conflict** (`src/vmodel/lint.ts` を編集)。`VerificationGroup`/`GroupReadiness` に `gate` を追加し、`VERIFICATION_GROUPS` に L3/L6/設計 検証サイクルゲート名を付与。`verificationGroupMessages` で gate 名を surface (range id + label は保持)。labels は単一正本 = `VERIFICATION_GROUPS`。

### Step 2: [直列] vmodel-pair テスト期待値を gate 名へ追従
- 直列理由 = **downstream_dependency** (Step 1 の出力文字列に依存)。`tests/vmodel-pair.test.ts` に gate 名 surface の assertion を追加 (既存「検証サイクル発火可」は不変)。

### Step 3: [直列] roadmap の GATE-A/B 表記を検証サイクルゲートへ
- 直列理由 = **file_conflict** (`roadmap.md` を編集)。§3 の GATE-A/GATE-B 見出し + §4 ゲート位置表 + §5 現在地表を新名称へ。旧名称は「(旧 GATE-A)」併記で読み替え可能にし dangling 参照を残さない。§5 の「PO accept 待ち」は old framing の遺物 → 「per-layer Forward gate は PO サインオフ済 / 検証サイクルは機械発火・別 accept ceremony なし」へ訂正。

### Step 4: [直列] concept §10 用語 back-merge
- 直列理由 = **file_conflict** (concept §10 を編集)。「検証サイクルゲート」を §10 用語集へ追加 ([[検証発火]]/[[検証層群]] と link)。

### Step 5: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で命名正規化の整合・dangling 参照 0・原則非崩壊をレビュー。

## §実装計画

- **src/vmodel/lint.ts** (情報源: PLAN-L6-11/L7-12 設計 + PO 2026-06-10 命名): `gate` field 追加 + label 単一正本維持。
- **tests/vmodel-pair.test.ts** (情報源: Step 1 出力): gate 名 surface の回帰。
- **roadmap.md / concept §10** (情報源: PO 2026-06-10 是正): 命名正規化 + glossary back-merge。
- back-fill の向き = 「Reverse (本 PLAN) が impl (L7-12) を requires」。roadmap は living (frozen 対象外) のため freeze 破壊なし。

## §6 用語更新

- **検証サイクルゲート (verification cycle gate)**: V-model band (L0-L3 / L4-L6 / L0-L6 / L0-L7) の Forward freeze 完了で機械発火する検証サイクルの band 単位ゲート。band 終端層または band 性質で命名する (L3 検証サイクルゲート / L6 検証サイクルゲート / 設計検証サイクルゲート / 実装検証サイクルゲート)。Forward の per-layer 正規ゲート (G0.5〜G7) とは別レイヤーであり、検証ロードマップ (roadmap.md、living) 固有。旧称「GATE-A (L0-L6) / GATE-B (L0-L7)」を置換 (PO 2026-06-10、[[検証発火]]/[[検証層群]])。→ concept §10 へ back-merge (本 PLAN Step 4)。

## §7 DoD
- [x] `src/vmodel/lint.ts` で gate 名を単一正本化、doctor が検証サイクルゲート名を surface (doctor 出力で L3/L6/設計 検証サイクルゲート 確認済)
- [x] `tests/vmodel-pair.test.ts` で gate 名 surface を回帰 (U-VTRIG-004 + U-VTRIG-005 で全 3 ゲート名 assert)
- [x] roadmap の GATE-A/B 表記を検証サイクルゲートへ正規化 (旧名併記、dangling 参照 0。handover の旧 GATE-A 3 箇所も reframe = review Important 対応)
- [x] concept §10 に「検証サイクルゲート」を back-merge (glossary gap 解消)
- [x] typecheck 0 / vitest green / biome CLEAN / doctor exit 0 / plan-id-naming test green
- [x] doctor backfill 行で本 cycle の Reverse 孤児 0 / glossary gap 0 を確認
- [x] review 前置 (intra_runtime_subagent = code-reviewer sonnet、2026-06-10 **APPROVE**。hybrid だが Codex Windows 不安定のため cross-agent = frontier-reviewer 不在、code-reviewer 代替で記録。Important 1 件 = handover 旧 GATE-A 残存 → reframe 反映済、Minor 3 = U-VTRIG-005 gate 名 assert → 追加済)

## §8 review evidence

- reviewer = `code-reviewer` (intra_runtime_subagent, sonnet)、2026-06-10、verdict = **APPROVE**。
- cross_agent: hybrid mode だが別 runtime frontier-reviewer (Codex) は Windows sandbox 不安定 ([[feedback_ts_native_over_helix_cli]]) のため不在。intra_runtime_subagent を代替とし本欄に記録 (worker≠reviewer: 実装=PM/Opus、review=code-reviewer)。
- findings: Critical 0 / Important 1 (handover 旧 GATE-A 残存 → §3/§4/§5 reframe 反映済) / Minor 3 (U-VTRIG-005 に設計検証サイクルゲート surface assert 追加済、他 2 は実害なし)。
- 機械検証: typecheck 0 / vitest green / biome exit 0 / doctor exit 0 (tests_green_at ≤ reviewed_at の順序を満たす)。
