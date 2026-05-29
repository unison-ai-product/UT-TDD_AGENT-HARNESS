---
plan_id: PLAN-REC-001-internal-asset-recovery
title: "PLAN-REC-001 (recovery): 内部資産 UT-TDD 化の前提抜け — 認識ずれ収束 + L1/L3 fullback"
kind: recovery
layer: cross
drive: fullstack
status: draft
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: aim
    slot_label: "AIM — recovery 観点 (認識訂正の網羅性 / 再発防止 CI チェック案) のレビュー"
  - role: tl
    slot_label: "TL — リオープンポイント (L1/L3 のどこから再開するか) の確認"
  - role: po
    slot_label: "PO — Recovery スコープ承認 (内部資産 FR を L1/L3 に追加してよいか、G1/G3 reopen 可否)"
generates:
  - artifact_path: docs/plans/PLAN-REC-001-internal-asset-recovery.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/migration/internal-asset-inventory.md
  references:
    - docs/migration/helix-porting-map.md
    - docs/governance/gate-design.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-REC-001 (recovery): 内部資産 UT-TDD 化の前提抜け — 認識ずれ収束 + L1/L3 fullback

> **駆動モデル = Recovery** (concept §3.1:384「AI の逸脱・認識ずれ・前提誤読からの再開の収束」)。PO 指示「こういうのは駆動モデルのリカバリーで対応」(2026-05-29) に基づき、前提抜けで進めた工程を Recovery で収束 → 中断工程 (Forward L1/L3) へ fullback する。requires_human_approval = true (tl リオープン確認 + po スコープ承認)。

## §1 事故記録

- **timestamp**: 2026-05-29
- **severity**: P2 (開発時の認識ずれ。本番影響なし。48h SLA 対象外)
- **impact**: V-model 設計 L1-L6 を **「内部資産 (subagent/skill/command) は HELIX からそのまま使う/後で port」という誤前提**で進行。正しい前提は「**内部資産は UT-TDD 用に作り替える必要がある**」。結果、L1 業務要求・L3 機能要件に「UT-TDD が自前の runtime 資産体系を持つ/既存資産を再構築する」FR が欠落 (FR-level gap)。L4-L6 設計は TS core のみを対象にし、内部資産の次元が丸ごと欠けた。G1/G3 に gap。
- **検知元**: PO 指摘 (「ヘリックス側のスキル資産・サブエージェント・コマンドは TS に作り替えているのか、整理してあるか」→「内部資産を UT-TDD 用に作り替える必要があるのを前提抜けている」)。

## §2 議論順序 timeline

1. L1-L6 設計を Forward で完遂 (A-42〜A-76、内部資産を設計対象に含めず)。
2. PM が「L7 実装 readiness」を宣言 (内部資産前提抜けに無自覚)。
3. PO が runtime 資産 (skill/subagent/command) の TS 化・整理状況を質問。
4. PM 調査: guard 機構は TS 化済だが、資産そのもの (roster/pack/command) は未整理・未設計と判明。
5. PO が前提抜けを明示「内部資産を UT-TDD 用に作り替える必要がある」= FR-level 漏れ。
6. PO が process 指示「Recovery 駆動で対応せよ」。
7. PM が棚卸 (subagent ×19 / skill ×107) を pmo-project-explorer 並行委譲で実施 → [internal-asset-inventory.md](../migration/internal-asset-inventory.md)。
8. 本 recovery PLAN 起票 (認識ずれ収束 + L1/L3 fullback)。

## §3 認識訂正履歴

| # | 当初仮説 (誤) | 実際の状況 (正) | 根拠 |
|---|---|---|---|
| 1 | HELIX 内部資産はそのまま使う / 後で port すれば良い | **UT-TDD 用に作り替える必要がある** (機能要求レベル) | PO 指摘 |
| 2 | guard が TS 化済なら内部資産は統制済 | guard (呼び出しの安全弁) と **資産の中身 (roster/pack)** は別。中身は未整理 | inventory §0 |
| 3 | subagent は active 化されている | active 19 = vendor と **byte 完全一致 = 未改変**。HELIX 絶対パス・`helix codex` 直叩きが現役残存 | inventory §1 |
| 4 | skill は参照すれば足りる | `docs/skills/` = 空 (`.gitkeep`)。curate 未着手。107 skill 中 core 直結 ~15 が未整理 | inventory §2 |
| 5 | L1-L6 は内部資産も網羅 | L4-L6 は TS core のみ。内部資産は設計対象外 = FR 不在 | inventory §5 |

## §4 中間結論 list

- 棚卸完了: subagent 19 (PMO9/PdM3/review3/BE2/DB1/DevOps1、guard pass15/block4)、skill 107 (core 直結 ~15、drop 候補 ~9)、command 0 (未整備)。詳細 = [internal-asset-inventory.md](../migration/internal-asset-inventory.md)。
- gap の本質: 「機構の FR (FR-09 guard / FR-12 skill 注入)」はあるが「**資産そのものを UT-TDD 用に構築する FR**」が無い。
- 不足 FR 候補 4 件 (FR-AST-1 roster / FR-AST-2 skill pack curate / FR-AST-3 command / FR-AST-4 drift lint、inventory §5)。
- cli/lib は porting-map W1-W17 で既出・TS 再実装対象 (ADR-001) のため本 recovery の対象外。gap は runtime 内部資産側のみ。
- L4-L6 の TS core 設計は **破棄不要** (誤りではなく不完全)。内部資産次元を追加する増分。

## §5 context 再構築 (session 復帰時に必要な前提)

- V-model/W-model 用語は A-74 で是正済 (L0-L14 = V-model / UT-TDD W = AI エージェント 2段V)。harness 自身は単一 V。
- 駆動モデル ② (9-mode) は gate-design §1.1 に統合済。本件は Recovery mode の最初の実適用。
- 設計層 L1-L6 は完了 (G1-G6 passed/conditional) **だが内部資産次元が欠落** = G1/G3 に gap。
- 内部資産の正本: subagent = `.claude/agents/` (未改変)、skill = `vendor/helix-source/skills/` (read-only 移植元)、UT-TDD 側 `docs/skills/` は空。
- 棚卸 evidence = [internal-asset-inventory.md](../migration/internal-asset-inventory.md)。

## §6 再開ポイント (中断工程への fullback)

**forward_routing = L1 / L3** (FR-level gap のため要求層へ戻す)。順序:

1. **L1 業務要求**に「UT-TDD は自前の runtime 資産体系 (subagent roster / skill pack / command) を持ち、既存 (HELIX 由来) 資産を UT-TDD 用に再構築する」BR を追加。
2. **L3 機能要件**に FR-AST-1〜4 を追加 (inventory §5)。fr-registry-audit / g3-trace で trace 接続。
3. **G1/G3 を内部資産次元で再** (PO/TL signoff)。
4. 以降 Forward で L4-L6 に内部資産設計を増分 (roster 設計 / skill pack curate 設計 / command 設計) → L7 実装。
5. **fullback 完了条件**: 内部資産が ① 必須スケルトン (Forward spine) に正式に乗り、porting-map W6/W7 (subagent)・W10 (skill) が後続 PLAN として接続される。

> **承認ゲート (Recovery)**: tl がリオープンポイント (L1/L3) を確認、po がスコープ (内部資産 FR を追加して G1/G3 を reopen してよいか) を承認するまで本 fullback は着手しない (requires_human_approval)。

## §7 再発防止 (観点リスト / CI チェック追加案)

- **FR-AST-4 (drift lint)**: 内部資産の前提抜けを機械検出する lint を追加 (rule engine IMP-033 のインスタンス):
  - `docs/skills/` が空のまま放置されていないか (curate 未着手検出)
  - `.claude/agents/*.md` に HELIX 絶対パス (`~/ai-dev-kit-vscode/` / `C:\Users\micro`) や `helix codex` 直叩きが残存していないか
  - subagent roster と guard allowlist (15) の整合 (frontmatter model family ↔ agent-guard.ts)
- **設計工程チェックリスト**: V-model 着手時に「対象システムの内部資産 (agent/skill/command) を設計スコープに含めたか」を必須確認項目化 (gate-design の 4 軸に「資産次元」を追加検討)。
- **メタモデル接続**: 本件を Recovery mode の参照事例として記録。前提抜け/認識ずれ検知時の標準応答 = recovery kind PLAN ([[feedback-recovery-mode-for-premise-gap]])。
- **improvement-backlog 登録**: IMP として「内部資産 FR 前提抜け」を記録し verified までトラッキング。
